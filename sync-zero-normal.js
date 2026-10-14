// Frozen normal sync payload functions; test enforces exact match with app.js.
// Adapter only permits reads. A proposed mutation is logged and rejected before network.
async function verifyNormalSyncNoWrites(snapshot, userId, readTable, blockedWrites) {
const authSession={user:{id:userId}};
const getCloudMigrationSnapshot=()=>snapshot;
const loadPendingRemainingChanges=()=>({});
const loadPendingVisitDeletes=()=>({});
const loadPendingLabels=()=>({});
const supabaseData=x=>x;
// No date is ever sent: this value only annotates a blocked legacy RPC proposal.
const dateToInput=()=>new Date().toISOString().slice(0,10);
const block=(table,operation,payload)=>{blockedWrites.push({table,operation,payload:payload??null});throw Error('想定外の書込み要求を送信前に停止しました。');};
const supabaseClient={
 from:table=>({select:()=>readTable(table),insert:p=>block(table,'insert',p),update:p=>block(table,'update',p),delete:()=>block(table,'delete')}),
 rpc:(name,p)=>block(name,'rpc',p),
 storage:{from:table=>({upload:()=>block(table,'upload')})}
};
async function ensureCloudStores(snapshot, userId) {
  const existingStores = await supabaseData(
    supabaseClient.from("stores").select("id,name,latitude,longitude,location_updated_at,closed_weekdays"),
  );
  const storeByName = new Map(existingStores.map((store) => [store.name, store]));
  const missingNames = snapshot.stores.filter((name) => !storeByName.has(name));

  if (missingNames.length > 0) {
    const createdStores = await supabaseData(
      supabaseClient.from("stores").insert(missingNames.map((name) => {
        const location = snapshot.locations[name];
        return {
          user_id: userId,
          name,
          area: "",
          notes: "",
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          location_updated_at: location?.updatedAt || null,
          closed_weekdays: normalizeClosedWeekdays(snapshot.settings[name]?.closedWeekdays),
        };
      })).select("id,name,latitude,longitude,location_updated_at,closed_weekdays"),
    );
    createdStores.forEach((store) => storeByName.set(store.name, store));
  }

  for (const store of snapshot.stores) {
    const cloudStore = storeByName.get(store);
    if (!cloudStore) continue;
    const location = snapshot.locations[store];
    const closedWeekdays = normalizeClosedWeekdays(snapshot.settings[store]?.closedWeekdays);
    const payload = {};
    if (location && (
      cloudCoordinate(cloudStore.latitude) !== cloudCoordinate(location.latitude)
      || cloudCoordinate(cloudStore.longitude) !== cloudCoordinate(location.longitude)
      || (location.updatedAt && cloudStore.location_updated_at !== location.updatedAt)
    )) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.location_updated_at = location.updatedAt || new Date().toISOString();
    }
    if (JSON.stringify(normalizeClosedWeekdays(cloudStore.closed_weekdays)) !== JSON.stringify(closedWeekdays)) {
      payload.closed_weekdays = closedWeekdays;
    }
    if (Object.keys(payload).length === 0) continue;
    await supabaseData(
      supabaseClient.from("stores").update(payload).eq("id", cloudStore.id),
    );
  }

  return new Map([...storeByName].map(([name, store]) => [name, store.id]));
}

function cloudBottlePayload(bottle, storeId, remaining = bottle.remaining) {
  return {
    store_id: storeId,
    brand: bottle.name,
    volume_ml: Number(bottle.volume) || 900,
    current_remaining: Math.min(100, Math.max(0, Number(remaining))),
    kept_at: bottle.startedAt,
    status: Number(remaining) > 0 ? "active" : "finished",
    notes: bottle.notes || "",
    legacy_id: String(bottle.id),
  };
}

function cloudBottleMetadataChanged(cloudBottle, expected) {
  return cloudBottle.store_id !== expected.store_id
    || cloudBottle.brand !== expected.brand
    || Number(cloudBottle.volume_ml) !== Number(expected.volume_ml)
    || cloudBottle.kept_at !== expected.kept_at
    || cloudBottle.status !== expected.status
    || (cloudBottle.notes || "") !== expected.notes;
}

async function syncCloudBottles(snapshot, storeIds, userId) {
  const pendingRemaining = loadPendingRemainingChanges();
  let cloudBottles = await supabaseData(
    supabaseClient.from("bottles").select("id,legacy_id,store_id,brand,volume_ml,current_remaining,kept_at,last_visited_at,status,notes"),
  );
  const cloudByLegacyId = new Map(cloudBottles
    .filter((bottle) => bottle.legacy_id)
    .map((bottle) => [String(bottle.legacy_id), bottle]));
  const localByLegacyId = new Map(snapshot.bottles.map((bottle) => [String(bottle.id), bottle]));
  const pendingEntries = Object.entries(pendingRemaining)
    .sort((left, right) => (
      left[1].changedAt.localeCompare(right[1].changedAt)
      || left[0].localeCompare(right[0])
    ));
  const missingBottles = snapshot.bottles.filter((bottle) => !cloudByLegacyId.has(String(bottle.id)));

  if (missingBottles.length > 0) {
    const createdBottles = await supabaseData(
      supabaseClient.from("bottles").insert(missingBottles.map((bottle) => {
        const pending = pendingEntries.find(([, change]) => change.bottleId === String(bottle.id))?.[1];
        return {
          user_id: userId,
          ...cloudBottlePayload(
            bottle,
            storeIds.get(bottle.store),
            pending?.previousRemaining ?? bottle.remaining,
          ),
          last_updated_at: new Date().toISOString(),
        };
      })).select("id,legacy_id,store_id,brand,volume_ml,current_remaining,kept_at,last_visited_at,status,notes"),
    );
    createdBottles.forEach((bottle) => {
      cloudBottles.push(bottle);
      cloudByLegacyId.set(String(bottle.legacy_id), bottle);
    });
  }

  for (const [changeId, change] of pendingEntries) {
    const legacyId = change.bottleId;
    const localBottle = localByLegacyId.get(legacyId);
    const cloudBottle = cloudByLegacyId.get(legacyId);
    if (!localBottle || !cloudBottle) {
      const currentChanges = loadPendingRemainingChanges();
      if (!localBottle) delete currentChanges[changeId];
      savePendingRemainingChanges(currentChanges);
      continue;
    }
    const cloudRemaining = Number(cloudBottle.current_remaining);
    if (cloudRemaining === Number(change.newRemaining)) {
      const latestHistory = await fetchLatestCloudRemainingUpdate(cloudBottle.id);
      if (!cloudHistoryMatchesChange(latestHistory, change)) {
        throw new Error("クラウドの残量履歴と端末の変更内容が一致しません。最新データを確認してください。");
      }
    } else {
      if (cloudRemaining !== Number(change.previousRemaining)) {
        throw new Error("クラウドの残量が変更済みのため、この端末の残量変更を安全に保存できません。");
      }
      if (change.kind === "undo") {
        await supabaseData(
          supabaseClient.rpc("undo_latest_bottle_remaining", {
            p_bottle_id: cloudBottle.id,
            p_expected_previous_remaining: Number(change.newRemaining),
            p_expected_new_remaining: Number(change.previousRemaining),
          }),
        );
      } else {
        await supabaseData(
          supabaseClient.rpc("update_bottle_remaining", {
            p_bottle_id: cloudBottle.id,
            p_new_remaining: Number(change.newRemaining),
            p_notes: change.notes || "焼酎キープ帳から更新",
            p_image_path: null,
            p_visited_on: change.visitedOn || dateToInput(),
          }),
        );
      }
      cloudBottle.current_remaining = Number(change.newRemaining);
      cloudBottle.status = Number(change.newRemaining) > 0 ? "active" : "finished";
    }
    const currentChanges = loadPendingRemainingChanges();
    if (currentChanges[changeId]?.changedAt === change.changedAt) {
      delete currentChanges[changeId];
      savePendingRemainingChanges(currentChanges);
    }
  }

  for (const bottle of snapshot.bottles) {
    const cloudBottle = cloudByLegacyId.get(String(bottle.id));
    if (!cloudBottle) continue;
    if (Number(cloudBottle.current_remaining) !== Number(bottle.remaining)) {
      await supabaseData(
        supabaseClient.rpc("update_bottle_remaining", {
          p_bottle_id: cloudBottle.id,
          p_new_remaining: Number(bottle.remaining),
          p_notes: "焼酎キープ帳から更新",
          p_image_path: null,
          p_visited_on: dateToInput(),
        }),
      );
      cloudBottle.current_remaining = Number(bottle.remaining);
    }
    const expected = cloudBottlePayload(bottle, storeIds.get(bottle.store));
    if (!cloudBottleMetadataChanged(cloudBottle, expected)) continue;
    const { current_remaining: ignoredRemaining, legacy_id: ignoredLegacyId, ...metadata } = expected;
    await supabaseData(
      supabaseClient.from("bottles").update({
        ...metadata,
        last_updated_at: new Date().toISOString(),
      }).eq("id", cloudBottle.id),
    );
  }

  const localIds = new Set(localByLegacyId.keys());
  const deletedCloudIds = cloudBottles
    .filter((bottle) => bottle.legacy_id && !localIds.has(String(bottle.legacy_id)))
    .map((bottle) => bottle.id);
  if (deletedCloudIds.length > 0) {
    await supabaseData(supabaseClient.from("bottles").delete().in("id", deletedCloudIds));
  }
}

async function syncCloudVisits(snapshot, storeIds, userId) {
  const pendingDeletes = loadPendingVisitDeletes();
  for (const [key, change] of Object.entries(pendingDeletes)) {
    const storeId = storeIds.get(change.store);
    if (storeId) {
      await supabaseData(
        supabaseClient.from("store_visits").delete()
          .eq("store_id", storeId)
          .eq("visited_on", change.visitedAt),
      );
    }
    const currentDeletes = loadPendingVisitDeletes();
    if (currentDeletes[key]?.changedAt === change.changedAt) {
      delete currentDeletes[key];
      localStorage.setItem(pendingCloudStorageKey(PENDING_VISIT_DELETES_KEY), JSON.stringify(currentDeletes));
    }
  }

  const cloudVisits = await supabaseData(
    supabaseClient.from("store_visits").select("store_id,visited_on"),
  );
  const cloudKeys = new Set(cloudVisits.map((visit) => `${visit.store_id}\u0000${visit.visited_on}`));
  const missingVisits = snapshot.visits.filter((visit) => {
    const key = `${storeIds.get(visit.store)}\u0000${visit.visitedAt}`;
    if (cloudKeys.has(key)) return false;
    cloudKeys.add(key);
    return true;
  });
  if (missingVisits.length > 0) {
    await supabaseData(
      supabaseClient.from("store_visits").insert(missingVisits.map((visit) => ({
        user_id: userId,
        store_id: storeIds.get(visit.store),
        visited_on: visit.visitedAt,
        // Local visit snapshots do not retain an event source; use the DB's import category.
        source: "import",
      }))),
    );
  }
}

async function syncPendingCloudLabels(userId) {
  const pendingLabels = loadPendingLabels();
  if (Object.keys(pendingLabels).length === 0) return;
  const cloudLabels = await supabaseData(
    supabaseClient.from("brand_labels").select("id,brand,image_path"),
  );
  const cloudByBrand = new Map(cloudLabels.map((label) => [label.brand, label]));

  for (const [brand, change] of Object.entries(pendingLabels)) {
    const dataUrl = labelImages[brand];
    if (!dataUrl) continue;
    const image = dataUrlToImageFile(dataUrl);
    const imagePath = `${userId}/${crypto.randomUUID()}.${image.extension}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("brand-labels")
      .upload(imagePath, image.blob, { contentType: image.mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const existing = cloudByBrand.get(brand);
    if (existing) {
      await supabaseData(
        supabaseClient.from("brand_labels").update({ image_path: imagePath }).eq("id", existing.id),
      );
    } else {
      await supabaseData(
        supabaseClient.from("brand_labels").insert({ user_id: userId, brand, image_path: imagePath }),
      );
    }
    const currentLabels = loadPendingLabels();
    if (currentLabels[brand]?.changedAt === change.changedAt) {
      delete currentLabels[brand];
      localStorage.setItem(pendingCloudStorageKey(PENDING_LABELS_KEY), JSON.stringify(currentLabels));
    }
  }
}

async function syncCloudSnapshot() {
  const userId = authSession.user.id;
  const snapshot = getCloudMigrationSnapshot();
  const storeIds = await ensureCloudStores(snapshot, userId);
  await syncCloudBottles(snapshot, storeIds, userId);
  await syncCloudVisits(snapshot, storeIds, userId);
  await syncPendingCloudLabels(userId);
}
await syncCloudSnapshot();
}

