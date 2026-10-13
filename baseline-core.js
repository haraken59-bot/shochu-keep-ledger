// Frozen copies of the current Ver.35 comparison helpers; tested against app.js.
const BASELINE_RELEASE = '35.0-baseline-1-execute1';
const BASELINE_DATA_KEYS = ['shochu-keep-ledger-v1','shochu-keep-ledger-label-images-v1','shochu-keep-ledger-store-locations-v1','shochu-keep-ledger-store-settings-v1','shochu-keep-ledger-store-visits-v1','shochu-keep-ledger-remaining-history-v1','shochu-keep-ledger-cloud-owner-v1'];
function baselineObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function baselineRead(storage, key, fallback) {
  const raw = storage.getItem(key);
  return raw === null ? fallback : JSON.parse(raw);
}
function baselineLocal(storage) {
  const [bk,lk,pk,sk,vk] = BASELINE_DATA_KEYS;
  const bottles = baselineRead(storage,bk,null), visits=baselineRead(storage,vk,null);
  const labels=baselineRead(storage,lk,{}),locations=baselineRead(storage,pk,{}),settings=baselineRead(storage,sk,{});
  if (!Array.isArray(bottles)||!Array.isArray(visits)||![labels,locations,settings].every(baselineObject)) throw Error('端末データ形式を確認できません。');
  if (new Set(bottles.map(b=>String(b.id))).size!==bottles.length) throw Error('端末ID重複です。');
  const stores=[...new Set([...bottles.map(b=>b.store),...visits.map(v=>v.store),...Object.keys(locations),...Object.keys(settings)].map(x=>x.trim()).filter(Boolean))];
  return JSON.stringify({
    stores:sortCanonicalRows(stores.map(s=>[s,...comparableLocation(locations[s]?.latitude,locations[s]?.longitude,locations[s]?.updatedAt),normalizeClosedWeekdays(Array.isArray(settings[s])?settings[s]:settings[s]?.closedWeekdays)])),
    bottles:sortCanonicalRows(bottles.map(b=>[String(b.id),b.store,b.name,Number(b.volume)||900,Number(b.remaining),b.startedAt,Number(b.remaining)>0?'active':'finished',b.notes||''])),
    visits:sortCanonicalRows(visits.map(v=>[v.store,v.visitedAt])),
    labels:Object.keys(labels).sort((a,b)=>a.localeCompare(b,'ja'))
  });
}
function baselineConvert(record) {
  const r=JSON.parse(record.cloudRevision),c=JSON.parse(record.cloudComparable);
  const check=(v,lens)=>{
    if (!baselineObject(v)||Object.keys(v).sort().join()!=='bottles,labels,stores,visits') throw Error('未知の比較基準です。');
    for(const [k,len] of Object.entries(lens)) if(!Array.isArray(v[k])||!v[k].every(row=>Array.isArray(row)&&row.length===len)) throw Error('比較基準の列数が不明です。');
    if(new Set(v.bottles.map(x=>x[0])).size!==v.bottles.length)throw Error('基準ID重複です。');
  };
  const current=record.comparisonSchema==='v35-r2-c2';
  if(record.comparisonSchema && !current)throw Error('未対応の比較基準です。');
  check(r,{stores:6,bottles:current?9:11,visits:3,labels:3});
  check(c,{stores:5,bottles:current?8:9,visits:2});
  if(!Array.isArray(c.labels)||!c.labels.every(x=>typeof x==='string'))throw Error('ラベル基準不明です。');
  if(!current){r.bottles=r.bottles.map(row=>row.filter((_,i)=>i!==7&&i!==10));c.bottles=c.bottles.map(row=>row.filter((_,i)=>i!==6));}
  for(const v of [r,c])for(const k of ['stores','bottles','visits'])sortCanonicalRows(v[k]);
  sortCanonicalRows(r.labels);c.labels.sort((a,b)=>a.localeCompare(b,'ja'));
  return {revision:JSON.stringify(r),comparable:JSON.stringify(c)};
}
function baselinePending(storage,uid) {
  for(const key of ['shochu-keep-ledger-pending-remaining-v1','shochu-keep-ledger-pending-visit-deletes-v1','shochu-keep-ledger-pending-labels-v1']){
    for(const suffix of ['',':unassigned',':'+uid]){
      const value=baselineRead(storage,key+suffix,{});
      if(!baselineObject(value)||Object.keys(value).length)throw Error('未送信変更があるか、形式が不明です。');
    }
  }
  const history=baselineRead(storage,BASELINE_DATA_KEYS[5],[]);
  if(!Array.isArray(history)||history.some(h=>h.synced===false))throw Error('未送信残量履歴があります。');
}
async function baselineCommitOnce({storage,uid,locks,online,readCloud,verifyIdentity}) {
  if(!locks?.request)throw Error('排他制御が使えません。');
  return locks.request('shochu-baseline-execute1',{ifAvailable:true},async lock=>{
    if(!lock)throw Error('別タブで確認中です。');
    const attempt='shochu-baseline-execute1-attempt:'+uid,key='shochu-keep-ledger-cloud-migration-v1:'+uid;
    if(storage.getItem(attempt)!==null)throw Error('この専用版は実行済みです。再実行しません。');
    // Consume before network/validation: failures and reloads cannot silently retry.
    storage.setItem(attempt,JSON.stringify({startedAt:new Date().toISOString(),phase:'started'}));
    const original=storage.getItem(key),previous=JSON.parse(original);
    if(!previous?.completedAt||storage.getItem(BASELINE_DATA_KEYS[6])!==uid)throw Error('移行済み本人の端末と確認できません。');
    const converted=baselineConvert(previous),local=baselineLocal(storage);
    const before=BASELINE_DATA_KEYS.map(k=>storage.getItem(k));
    const unchanged=()=>{
      if(!online()||storage.getItem(key)!==original||BASELINE_DATA_KEYS.some((k,i)=>storage.getItem(k)!==before[i])||baselineLocal(storage)!==local)throw Error('照合中に端末状態が変わりました。');
      baselinePending(storage,uid);
    };
    const compare=s=>{
      for(const k of ['stores','bottles','store_visits','brand_labels','remaining_updates']){
        if(!Array.isArray(s[k])||s[k].some(x=>x.user_id!==uid)||new Set(s[k].map(x=>x.id)).size!==s[k].length)throw Error('クラウド本人データを確認できません。');
      }
      const a=[s.stores,s.bottles,s.store_visits,s.brand_labels];
      if(createCloudRevision(...a)!==converted.revision||createCloudComparable(...a)!==converted.comparable||converted.comparable!==local)throw Error('実質差分があります。基準は保存しません。');
    };
    const canonical=s=>JSON.stringify(Object.fromEntries(Object.keys(s).sort().map(k=>[k,sortCanonicalRows(s[k].map(r=>Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))])));
    unchanged();await verifyIdentity();
    const first=await readCloud();compare(first);unchanged();
    await verifyIdentity();
    const latest=await readCloud();compare(latest);unchanged();
    if(canonical(first)!==canonical(latest))throw Error('2回の読取り中にDBが変わりました。保存しません。');
    const at=new Date().toISOString();
    const report={release:BASELINE_RELEASE,savedAt:at,substantiveDifferences:0,pendingChanges:0,localDataUnchanged:true,syncStillStopped:true,cloudReads:2};
    const next=JSON.stringify({...previous,cloudRevision:converted.revision,cloudComparable:converted.comparable,cloudCheckedAt:at,comparisonSchema:'v35-r2-c2',baselineExecute1:{...report,previousRecord:previous}});
    // Atomic replacement: old baseline retained in the same successful write.
    storage.setItem(key,next);
    if(storage.getItem(key)!==next)throw Error('保存確認に失敗しました。再実行せず停止してください。');
    return report;
  });
}
function sortCanonicalRows(rows) {
  return rows.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right), "ja"));
}

function cloudCoordinate(value) {
  if (value === null || value === "" || typeof value === "undefined") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function comparableLocation(latitudeValue, longitudeValue, updatedAt = "") {
  const latitude = cloudCoordinate(latitudeValue);
  const longitude = cloudCoordinate(longitudeValue);
  if (latitude === null || longitude === null || (latitude === 0 && longitude === 0)) return [null, null, ""];
  return [latitude, longitude, updatedAt || ""];
}

function createCloudRevision(cloudStores, cloudBottles, cloudVisits, cloudLabels) {
  return JSON.stringify({
    stores: sortCanonicalRows(cloudStores.map((store) => [
      store.id,
      store.name,
      cloudCoordinate(store.latitude),
      cloudCoordinate(store.longitude),
      store.location_updated_at || "",
      normalizeClosedWeekdays(store.closed_weekdays),
    ])),
    bottles: sortCanonicalRows(cloudBottles.map((bottle) => [
      bottle.id,
      bottle.legacy_id || "",
      bottle.store_id,
      bottle.brand,
      Number(bottle.volume_ml) || 900,
      Number(bottle.current_remaining),
      bottle.kept_at,
      bottle.status,
      bottle.notes || "",
    ])),
    visits: sortCanonicalRows(cloudVisits.map((visit) => [visit.id || "", visit.store_id, visit.visited_on])),
    labels: sortCanonicalRows(cloudLabels.map((label) => [label.id || "", label.brand, label.image_path])),
  });
}

function createCloudComparable(cloudStores, cloudBottles, cloudVisits, cloudLabels) {
  const storeById = new Map(cloudStores.map((store) => [store.id, store]));
  return JSON.stringify({
    stores: sortCanonicalRows(cloudStores.map((store) => [
      store.name,
      ...comparableLocation(store.latitude, store.longitude, store.location_updated_at),
      normalizeClosedWeekdays(store.closed_weekdays),
    ])),
    bottles: sortCanonicalRows(cloudBottles.flatMap((bottle) => {
      const store = storeById.get(bottle.store_id);
      if (!store || !bottle.legacy_id) return [];
      return [[
        String(bottle.legacy_id),
        store.name,
        bottle.brand,
        Number(bottle.volume_ml) || 900,
        Number(bottle.current_remaining),
        bottle.kept_at,
        bottle.status,
        bottle.notes || "",
      ]];
    })),
    visits: sortCanonicalRows(cloudVisits.flatMap((visit) => {
      const store = storeById.get(visit.store_id);
      return store ? [[store.name, visit.visited_on]] : [];
    })),
    labels: [...new Set(cloudLabels.map((label) => label.brand).filter(Boolean))].sort((left, right) => left.localeCompare(right, "ja")),
  });
}

function normalizeClosedWeekdays(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    .sort((left, right) => left - right);
}
