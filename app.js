const STORAGE_KEY = "shochu-keep-ledger-v1";
const LABELS_KEY = "shochu-keep-ledger-label-images-v1";
const STORE_LOCATIONS_KEY = "shochu-keep-ledger-store-locations-v1";
const STORE_VISITS_KEY = "shochu-keep-ledger-store-visits-v1";
const KEEP_VISITS_MIGRATION_KEY = "shochu-keep-ledger-keep-visits-migration-v1";
const CLOUD_MIGRATION_KEY = "shochu-keep-ledger-cloud-migration-v1";
const CLOUD_OWNER_KEY = "shochu-keep-ledger-cloud-owner-v1";
const PENDING_REMAINING_KEY = "shochu-keep-ledger-pending-remaining-v1";
const PENDING_VISIT_DELETES_KEY = "shochu-keep-ledger-pending-visit-deletes-v1";
const PENDING_LABELS_KEY = "shochu-keep-ledger-pending-labels-v1";
const DAY = 24 * 60 * 60 * 1000;
const PUBLIC_APP_URL = "https://haraken59-bot.github.io/shochu-keep-ledger/";

const demoBottles = [
  { id: "demo-1", store: "やきとり日高", name: "黒霧島", volume: 900, remaining: 70, startedAt: "2026-07-05", lastVisitedAt: "2026-07-24", notes: "水代 220円" },
  { id: "demo-2", store: "しょうふく", name: "二階堂", volume: 900, remaining: 90, startedAt: "2026-07-12", lastVisitedAt: "2026-07-28", notes: "" },
  { id: "demo-3", store: "酒処 まる", name: "いいちこ", volume: 900, remaining: 20, startedAt: "2026-05-01", lastVisitedAt: "2026-07-18", notes: "次回、キープ更新を確認" },
  { id: "demo-4", store: "大衆酒場 つばき", name: "黒霧島", volume: 900, remaining: 45, startedAt: "2026-07-20", lastVisitedAt: "2026-07-26", notes: "" },
];

const els = {
  activeCount: document.querySelector("#active-count"),
  accountButton: document.querySelector("#account-button"),
  accountDot: document.querySelector("#account-dot"),
  accountStatus: document.querySelector("#account-status"),
  authDialog: document.querySelector("#auth-dialog"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authSubmit: document.querySelector("#auth-submit"),
  authSignedOut: document.querySelector("#auth-signed-out"),
  authSignedIn: document.querySelector("#auth-signed-in"),
  authUserEmail: document.querySelector("#auth-user-email"),
  authSignOut: document.querySelector("#auth-sign-out"),
  authMessage: document.querySelector("#auth-message"),
  cloudMigrationSummary: document.querySelector("#cloud-migration-summary"),
  cloudMigrationButton: document.querySelector("#cloud-migration-button"),
  cloudMigrationStatus: document.querySelector("#cloud-migration-status"),
  cloudSyncStatus: document.querySelector("#cloud-sync-status"),
  cloudRestoreButton: document.querySelector("#cloud-restore-button"),
  cloudRestoreStatus: document.querySelector("#cloud-restore-status"),
  cloudUpdateBanner: document.querySelector("#cloud-update-banner"),
  cloudUpdateTitle: document.querySelector("#cloud-update-title"),
  cloudUpdateSummary: document.querySelector("#cloud-update-summary"),
  cloudUpdateChanges: document.querySelector("#cloud-update-changes"),
  cloudUpdateButton: document.querySelector("#cloud-update-button"),
  nearbyStoresSection: document.querySelector("#nearby-stores-section"),
  findNearbyStores: document.querySelector("#find-nearby-stores"),
  nearbyStoresStatus: document.querySelector("#nearby-stores-status"),
  nearbyStoresList: document.querySelector("#nearby-stores-list"),
  list: document.querySelector("#bottle-list"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#bottle-card-template"),
  sort: document.querySelector("#sort-select"),
  add: document.querySelector("#add-button"),
  addMenuDialog: document.querySelector("#add-menu-dialog"),
  openCurrentAdd: document.querySelector("#open-current-add"),
  openPastAdd: document.querySelector("#open-past-add"),
  openLabelManager: document.querySelector("#open-label-manager"),
  openDataManager: document.querySelector("#open-data-manager"),
  form: document.querySelector("#bottle-form"),
  formDialog: document.querySelector("#bottle-dialog"),
  storeSelect: document.querySelector("#store-select"),
  newStore: document.querySelector("#store-new"),
  findNearbyStore: document.querySelector("#find-nearby-store"),
  nearbyStoreStatus: document.querySelector("#nearby-store-status"),
  nameSelect: document.querySelector("#name-select"),
  newName: document.querySelector("#name-new"),
  scanLabelFromForm: document.querySelector("#scan-label-from-form"),
  previousKeepInfo: document.querySelector("#previous-keep-info"),
  pastForm: document.querySelector("#past-bottle-form"),
  pastFormDialog: document.querySelector("#past-bottle-dialog"),
  pastStoreSelect: document.querySelector("#past-store-select"),
  pastNewStore: document.querySelector("#past-store-new"),
  pastNameSelect: document.querySelector("#past-name-select"),
  pastNewName: document.querySelector("#past-name-new"),
  labelManagerDialog: document.querySelector("#label-manager-dialog"),
  labelManagerForm: document.querySelector("#label-manager-form"),
  labelBrandSelect: document.querySelector("#label-brand-select"),
  labelImageFile: document.querySelector("#label-image-file"),
  dataManagerDialog: document.querySelector("#data-manager-dialog"),
  backupDownload: document.querySelector("#backup-download"),
  backupRestoreFile: document.querySelector("#backup-restore-file"),
  backupStatus: document.querySelector("#backup-status"),
  detailDialog: document.querySelector("#detail-dialog"),
  detailStore: document.querySelector("#detail-store"),
  detailName: document.querySelector("#detail-name"),
  detailRemaining: document.querySelector("#detail-remaining"),
  detailProgress: document.querySelector("#detail-progress"),
  range: document.querySelector("#remaining-range"),
  decrease: document.querySelector("#decrease-button"),
  increase: document.querySelector("#increase-button"),
  detailStarted: document.querySelector("#detail-started"),
  detailLastVisited: document.querySelector("#detail-last-visited"),
  detailDays: document.querySelector("#detail-days"),
  detailNotes: document.querySelector("#detail-notes"),
  finishRenew: document.querySelector("#finish-renew-button"),
  delete: document.querySelector("#delete-button"),
  historyDialog: document.querySelector("#store-history-dialog"),
  historyStore: document.querySelector("#history-store"),
  historyList: document.querySelector("#history-list"),
  saveStoreLocation: document.querySelector("#save-store-location"),
  historyLocationStatus: document.querySelector("#history-location-status"),
  storeVisitToday: document.querySelector("#store-visit-today"),
  calendarPrev: document.querySelector("#calendar-prev"),
  calendarNext: document.querySelector("#calendar-next"),
  calendarTitle: document.querySelector("#calendar-title"),
  calendarGrid: document.querySelector("#calendar-grid"),
  visitEditDialog: document.querySelector("#visit-edit-dialog"),
  visitEditForm: document.querySelector("#visit-edit-form"),
  visitEditDelete: document.querySelector("#visit-edit-delete"),
  historyEditDialog: document.querySelector("#history-edit-dialog"),
  historyEditForm: document.querySelector("#history-edit-form"),
  historyEditStoreSelect: document.querySelector("#history-edit-store-select"),
  historyEditNewStore: document.querySelector("#history-edit-store-new"),
  historyEditNameSelect: document.querySelector("#history-edit-name-select"),
  historyEditNewName: document.querySelector("#history-edit-name-new"),
  quickVisitDialog: document.querySelector("#quick-visit-dialog"),
  quickVisitTitle: document.querySelector("#quick-visit-title"),
  quickVisitLast: document.querySelector("#quick-visit-last"),
  quickVisitStatus: document.querySelector("#quick-visit-status"),
  quickBottleList: document.querySelector("#quick-bottle-list"),
  quickVisitToday: document.querySelector("#quick-visit-today"),
  quickScanLabel: document.querySelector("#quick-scan-label"),
  quickOpenHistory: document.querySelector("#quick-open-history"),
  ocrDialog: document.querySelector("#ocr-dialog"),
  ocrImageFile: document.querySelector("#ocr-image-file"),
  ocrPreview: document.querySelector("#ocr-preview"),
  ocrProgressWrap: document.querySelector("#ocr-progress-wrap"),
  ocrProgress: document.querySelector("#ocr-progress"),
  ocrStatus: document.querySelector("#ocr-status"),
  ocrCandidates: document.querySelector("#ocr-candidates"),
  ocrSaveLabelRow: document.querySelector("#ocr-save-label-row"),
  ocrSaveLabel: document.querySelector("#ocr-save-label"),
  ocrTextDetails: document.querySelector("#ocr-text-details"),
  ocrText: document.querySelector("#ocr-text"),
  ocrNone: document.querySelector("#ocr-none"),
  ocrManual: document.querySelector("#ocr-manual"),
  ocrRetake: document.querySelector("#ocr-retake"),
};

let bottles = normalizeBottles(loadBottles());
let labelImages = loadLabelImages();
let storeLocations = loadStoreLocations();
let storeVisits = loadStoreVisits();
let selectedId = null;
let editingHistoryId = null;
let editingVisitId = null;
let calendarMonth = null;
let nearbyStoreDistances = null;
let previousSortValue = els.sort.value;
let supabaseClient = null;
let authSession = null;
let cloudSyncTimer = null;
let cloudSyncPromise = null;
let cloudSyncQueued = false;
let cloudSyncState = "idle";
let cloudSyncPaused = false;
let cloudUpdateAvailable = false;
let observedCloudRevision = null;
let observedCloudComparable = null;
let cloudUpdateMode = "";
let cloudUpdateMessages = [];
let pendingCloudSnapshot = null;
let nearbyHomePosition = null;
let currentQuickStore = "";
let ocrTarget = null;
let ocrSourceFile = null;
let ocrPreviewUrl = "";
let ocrRunning = false;
renumberKeeps();
migrateKeepDatesToStoreVisits();
saveStoreVisits();
saveStoreLocations();

function setAuthMessage(message, isError = false) {
  els.authMessage.textContent = message;
  els.authMessage.classList.toggle("is-error", isError);
}

function authRedirectUrl() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return PUBLIC_APP_URL;
}

function renderCloudUpdateBanner() {
  if (!els.cloudUpdateBanner) return;
  const visible = Boolean(authSession?.user && (cloudUpdateAvailable || cloudUpdateMode === "applied"));
  els.cloudUpdateBanner.hidden = !visible;
  els.cloudUpdateBanner.classList.toggle("is-conflict", cloudUpdateMode === "conflict");
  els.cloudUpdateBanner.classList.toggle("is-applied", cloudUpdateMode === "applied");
  els.cloudUpdateTitle.textContent = cloudUpdateMode === "conflict"
    ? "クラウドとこの端末の両方に変更があります"
    : cloudUpdateMode === "applied"
      ? "クラウドの変更を自動反映しました"
      : "クラウドに新しいデータがあります";
  els.cloudUpdateButton.textContent = cloudUpdateMode === "applied" ? "閉じる" : "クラウドの内容を読み込む";
  els.cloudUpdateButton.disabled = !visible;
  els.cloudUpdateChanges.replaceChildren(...cloudUpdateMessages.slice(0, 6).map((message) => {
    const item = document.createElement("li");
    item.textContent = message;
    return item;
  }));
}

function renderAuthState(session = null) {
  const previousUserId = authSession?.user?.id || "";
  authSession = session;
  const connected = Boolean(session?.user);
  const nextUserId = session?.user?.id || "";
  if (previousUserId !== nextUserId) {
    const cloudRecord = nextUserId ? readCloudMigrationRecord() : {};
    cloudUpdateAvailable = false;
    observedCloudRevision = cloudRecord.cloudRevision || null;
    observedCloudComparable = cloudRecord.cloudComparable || null;
    cloudUpdateMode = "";
    cloudUpdateMessages = [];
    pendingCloudSnapshot = null;
  }
  els.accountDot.classList.toggle("is-connected", connected);
  els.accountStatus.textContent = connected ? "クラウド接続済み" : "クラウド未接続";
  els.authSignedOut.hidden = connected;
  els.authSignedIn.hidden = !connected;
  els.authUserEmail.textContent = session?.user?.email || "";
  if (els.cloudRestoreButton) els.cloudRestoreButton.disabled = !connected;
  renderCloudUpdateBanner();
  renderCloudMigrationState();
  renderCloudSyncState();
}

async function initializeSupabaseAuth() {
  const config = window.SHOCHU_SUPABASE_CONFIG;
  if (!window.supabase?.createClient || !config?.url || !config?.publishableKey) {
    renderAuthState();
    els.accountStatus.textContent = "端末内に保存中";
    els.authSubmit.disabled = true;
    setAuthMessage("クラウド接続の設定を読み込めませんでした。現在のデータは端末内でそのまま利用できます。", true);
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    renderAuthState(data.session);
    if (isCloudSyncEnabled()) scheduleCloudSync(0);
    supabaseClient.auth.onAuthStateChange((event, session) => {
      renderAuthState(session);
      if (event === "SIGNED_IN") {
        if (isCloudSyncEnabled()) {
          setAuthMessage("ログインできました。端末内の変更をクラウドへ確認します。");
          scheduleCloudSync(0);
        } else {
          setAuthMessage("ログインできました。クラウドから読み込むか、この端末のデータをクラウドへ移行できます。");
        }
      }
    });
  } catch (error) {
    renderAuthState();
    els.accountStatus.textContent = "端末内に保存中";
    setAuthMessage(error.message || "クラウド接続を確認できませんでした。", true);
  }
}

async function sendMagicLink(event) {
  event.preventDefault();
  if (!els.authForm.reportValidity() || !supabaseClient) return;
  els.authSubmit.disabled = true;
  setAuthMessage("ログイン用メールを送信しています…");
  try {
    const { error } = await supabaseClient.auth.signInWithOtp({
      email: els.authEmail.value.trim(),
      options: {
        emailRedirectTo: authRedirectUrl(),
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    setAuthMessage("メールを送信しました。届いたメールのリンクを押してください。");
  } catch (error) {
    setAuthMessage(error.message || "メールを送信できませんでした。", true);
  } finally {
    els.authSubmit.disabled = false;
  }
}

async function signOutFromSupabase() {
  if (!supabaseClient || !authSession) return;
  els.authSignOut.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.clearTimeout(cloudSyncTimer);
    cloudSyncTimer = null;
    cloudSyncQueued = false;
    renderAuthState();
    setAuthMessage("ログアウトしました。端末内のデータは残っています。");
  } catch (error) {
    setAuthMessage(error.message || "ログアウトできませんでした。", true);
  } finally {
    els.authSignOut.disabled = false;
  }
}

function getCloudMigrationSnapshot() {
  const hasSavedBottleData = localStorage.getItem(STORAGE_KEY) !== null;
  const isUntouchedDemo = !hasSavedBottleData
    && bottles.length > 0
    && bottles.every((bottle) => String(bottle.id).startsWith("demo-"));
  const snapshotBottles = isUntouchedDemo ? [] : bottles;
  const snapshotVisits = isUntouchedDemo ? [] : storeVisits;
  const snapshotLabels = isUntouchedDemo ? {} : labelImages;
  const snapshotLocations = isUntouchedDemo ? {} : storeLocations;
  const stores = [...new Set([
    ...snapshotBottles.map((bottle) => bottle.store),
    ...snapshotVisits.map((visit) => visit.store),
    ...Object.keys(snapshotLocations),
  ].map((store) => store.trim()).filter(Boolean))];

  return {
    stores,
    bottles: snapshotBottles,
    visits: snapshotVisits,
    labels: snapshotLabels,
    locations: snapshotLocations,
  };
}

function migrationItemCount(snapshot) {
  return snapshot.stores.length
    + snapshot.bottles.length
    + snapshot.visits.length
    + Object.keys(snapshot.labels).length;
}

function cloudMigrationStorageKey() {
  return authSession?.user?.id ? `${CLOUD_MIGRATION_KEY}:${authSession.user.id}` : CLOUD_MIGRATION_KEY;
}

function readCloudMigrationRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(cloudMigrationStorageKey()));
    return record && typeof record === "object" ? record : {};
  } catch {
    return {};
  }
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
    ])),
    bottles: sortCanonicalRows(cloudBottles.map((bottle) => [
      bottle.id,
      bottle.legacy_id || "",
      bottle.store_id,
      bottle.brand,
      Number(bottle.volume_ml) || 900,
      Number(bottle.current_remaining),
      bottle.kept_at,
      bottle.last_visited_at || bottle.kept_at,
      bottle.status,
      bottle.notes || "",
      bottle.last_updated_at || "",
    ])),
    visits: sortCanonicalRows(cloudVisits.map((visit) => [visit.id || "", visit.store_id, visit.visited_on])),
    labels: sortCanonicalRows(cloudLabels.map((label) => [label.id || "", label.brand, label.image_path])),
  });
}

function createCloudComparable(cloudStores, cloudBottles, cloudVisits, cloudLabels) {
  const storeById = new Map(cloudStores.map((store) => [store.id, store]));
  return JSON.stringify({
    stores: sortCanonicalRows(cloudStores.map((store) => [store.name, ...comparableLocation(
      store.latitude,
      store.longitude,
      store.location_updated_at,
    )])),
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
        bottle.last_visited_at || bottle.kept_at,
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

function createLocalComparable() {
  const snapshot = getCloudMigrationSnapshot();
  return JSON.stringify({
    stores: sortCanonicalRows(snapshot.stores.map((store) => {
      const location = snapshot.locations[store];
      return [store, ...comparableLocation(location?.latitude, location?.longitude, location?.updatedAt)];
    })),
    bottles: sortCanonicalRows(snapshot.bottles.map((bottle) => [
      String(bottle.id),
      bottle.store,
      bottle.name,
      Number(bottle.volume) || 900,
      Number(bottle.remaining),
      bottle.startedAt,
      bottle.lastVisitedAt || bottle.startedAt,
      Number(bottle.remaining) > 0 ? "active" : "finished",
      bottle.notes || "",
    ])),
    visits: sortCanonicalRows(snapshot.visits.map((visit) => [visit.store, visit.visitedAt])),
    labels: Object.keys(snapshot.labels).sort((left, right) => left.localeCompare(right, "ja")),
  });
}

function rememberCloudRevision(snapshot) {
  const previous = readCloudMigrationRecord();
  observedCloudRevision = snapshot.revision;
  observedCloudComparable = snapshot.comparable;
  localStorage.setItem(cloudMigrationStorageKey(), JSON.stringify({
    ...previous,
    cloudRevision: snapshot.revision,
    cloudComparable: snapshot.comparable,
    cloudCheckedAt: new Date().toISOString(),
  }));
}

function setCloudMigrationStatus(message, isError = false) {
  els.cloudMigrationStatus.textContent = message;
  els.cloudMigrationStatus.classList.toggle("is-error", isError);
}

function renderCloudMigrationState() {
  if (!els.cloudMigrationSummary || !els.cloudMigrationButton) return;
  const snapshot = getCloudMigrationSnapshot();
  const labelCount = Object.keys(snapshot.labels).length;
  els.cloudMigrationSummary.textContent = `移行対象：店舗 ${snapshot.stores.length}件、ボトル ${snapshot.bottles.length}件、来店日 ${snapshot.visits.length}件、ラベル ${labelCount}件`;
  els.cloudMigrationButton.disabled = !authSession?.user || migrationItemCount(snapshot) === 0;
  els.cloudMigrationButton.textContent = migrationItemCount(snapshot) === 0
    ? "移行する端末データがありません"
    : "クラウドへの移行を開始";

  if (!authSession?.user) {
    setCloudMigrationStatus("");
    return;
  }

  try {
    const previous = JSON.parse(localStorage.getItem(cloudMigrationStorageKey()));
    if (previous?.completedAt) {
      const migratedAt = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(previous.completedAt));
      setCloudMigrationStatus(`前回の移行：${migratedAt}。再実行しても登録済みデータは重複しません。`);
      return;
    }
  } catch {
    localStorage.removeItem(cloudMigrationStorageKey());
  }

  setCloudMigrationStatus(migrationItemCount(snapshot) > 0
    ? "バックアップを保存してから移行すると、さらに安心です。"
    : "サンプル表示だけの場合はクラウドへ移行しません。");
}

async function supabaseData(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function dataUrlToImageFile(dataUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("ラベル画像の形式を読み込めませんでした。");
  const bytes = atob(match[2]);
  const values = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) values[index] = bytes.charCodeAt(index);
  const mimeType = match[1].toLowerCase();
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return { blob: new Blob([values], { type: mimeType }), extension, mimeType };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("ラベル画像を端末用に変換できませんでした。")));
    reader.readAsDataURL(blob);
  });
}

function setCloudRestoreStatus(message, isError = false) {
  if (!els.cloudRestoreStatus) return;
  els.cloudRestoreStatus.textContent = message;
  els.cloudRestoreStatus.classList.toggle("is-error", isError);
}

async function fetchCloudRestoreSnapshot() {
  const [cloudStores, cloudBottles, cloudVisits, cloudLabels] = await Promise.all([
    supabaseData(supabaseClient.from("stores").select("id,name,latitude,longitude,location_updated_at")),
    supabaseData(supabaseClient.from("bottles").select("id,legacy_id,store_id,brand,volume_ml,current_remaining,kept_at,last_visited_at,status,notes,last_updated_at")),
    supabaseData(supabaseClient.from("store_visits").select("id,store_id,visited_on")),
    supabaseData(supabaseClient.from("brand_labels").select("id,brand,image_path")),
  ]);
  const storeById = new Map(cloudStores.map((store) => [store.id, store]));
  const restoredBottles = cloudBottles.flatMap((bottle) => {
    const store = storeById.get(bottle.store_id);
    if (!store || !bottle.legacy_id || !bottle.brand || !bottle.kept_at) return [];
    return [{
      id: String(bottle.legacy_id),
      store: store.name,
      name: bottle.brand,
      volume: Number(bottle.volume_ml) || 900,
      remaining: Math.min(100, Math.max(0, Number(bottle.current_remaining))),
      startedAt: bottle.kept_at,
      lastVisitedAt: bottle.last_visited_at || bottle.kept_at,
      notes: bottle.notes || "",
      keepNumber: 1,
    }];
  });
  const visitKeys = new Set();
  const restoredVisits = cloudVisits.flatMap((visit) => {
    const store = storeById.get(visit.store_id);
    const key = `${store?.name || ""}\u0000${visit.visited_on}`;
    if (!store || !visit.visited_on || visitKeys.has(key)) return [];
    visitKeys.add(key);
    return [{ id: String(visit.id || crypto.randomUUID()), store: store.name, visitedAt: visit.visited_on }];
  });
  const restoredLocations = Object.fromEntries(cloudStores.flatMap((store) => {
    const latitude = cloudCoordinate(store.latitude);
    const longitude = cloudCoordinate(store.longitude);
    if (latitude === null || longitude === null || (latitude === 0 && longitude === 0)) return [];
    return [[store.name, {
      latitude,
      longitude,
      updatedAt: store.location_updated_at || "",
    }]];
  }));

  return {
    bottles: restoredBottles,
    storeVisits: restoredVisits,
    storeLocations: restoredLocations,
    labelRows: cloudLabels,
    storeCount: cloudStores.length,
    revision: createCloudRevision(cloudStores, cloudBottles, cloudVisits, cloudLabels),
    comparable: createCloudComparable(cloudStores, cloudBottles, cloudVisits, cloudLabels),
  };
}

function bottleChangeLabel(bottle) {
  return `${bottle.store}「${bottle.name}」`;
}

function describeCloudChanges(snapshot) {
  const messages = [];
  const localBottles = new Map(bottles.map((bottle) => [String(bottle.id), bottle]));
  const cloudBottles = new Map(snapshot.bottles.map((bottle) => [String(bottle.id), bottle]));

  snapshot.bottles.forEach((cloudBottle) => {
    const localBottle = localBottles.get(String(cloudBottle.id));
    if (!localBottle) {
      messages.push(`${bottleChangeLabel(cloudBottle)}を追加`);
      return;
    }
    if (Number(localBottle.remaining) !== Number(cloudBottle.remaining)) {
      messages.push(`${bottleChangeLabel(cloudBottle)}：残量 ${localBottle.remaining}% → ${cloudBottle.remaining}%`);
    }
    if ((localBottle.lastVisitedAt || localBottle.startedAt) !== cloudBottle.lastVisitedAt) {
      messages.push(`${bottleChangeLabel(cloudBottle)}：最終来店日を ${cloudBottle.lastVisitedAt} に更新`);
    }
    const metadataChanged = localBottle.store !== cloudBottle.store
      || localBottle.name !== cloudBottle.name
      || localBottle.startedAt !== cloudBottle.startedAt
      || (localBottle.notes || "") !== (cloudBottle.notes || "");
    if (metadataChanged) messages.push(`${bottleChangeLabel(cloudBottle)}の登録内容を更新`);
  });
  bottles.forEach((localBottle) => {
    if (!cloudBottles.has(String(localBottle.id))) messages.push(`${bottleChangeLabel(localBottle)}を削除`);
  });

  const localVisits = new Set(storeVisits.map((visit) => `${visit.store}\u0000${visit.visitedAt}`));
  const cloudVisits = new Set(snapshot.storeVisits.map((visit) => `${visit.store}\u0000${visit.visitedAt}`));
  snapshot.storeVisits.forEach((visit) => {
    if (!localVisits.has(`${visit.store}\u0000${visit.visitedAt}`)) messages.push(`${visit.store}：来店日 ${visit.visitedAt} を追加`);
  });
  storeVisits.forEach((visit) => {
    if (!cloudVisits.has(`${visit.store}\u0000${visit.visitedAt}`)) messages.push(`${visit.store}：来店日 ${visit.visitedAt} を削除`);
  });

  const localLocationStores = new Set(Object.keys(storeLocations));
  const cloudLocationStores = new Set(Object.keys(snapshot.storeLocations));
  Object.keys(snapshot.storeLocations).forEach((store) => {
    const localLocation = storeLocations[store];
    const cloudLocation = snapshot.storeLocations[store];
    if (!localLocation) messages.push(`${store}：店舗位置を追加`);
    else if (JSON.stringify(comparableLocation(localLocation.latitude, localLocation.longitude))
      !== JSON.stringify(comparableLocation(cloudLocation.latitude, cloudLocation.longitude))) {
      messages.push(`${store}：店舗位置を更新`);
    }
  });
  localLocationStores.forEach((store) => {
    if (!cloudLocationStores.has(store)) messages.push(`${store}：店舗位置を削除`);
  });

  const localLabelBrands = new Set(Object.keys(labelImages));
  const cloudLabelBrands = new Set(snapshot.labelRows.map((label) => label.brand));
  cloudLabelBrands.forEach((brand) => {
    if (!localLabelBrands.has(brand)) messages.push(`${brand}：ラベル画像を追加`);
  });
  localLabelBrands.forEach((brand) => {
    if (!cloudLabelBrands.has(brand)) messages.push(`${brand}：ラベル画像を削除`);
  });

  if (messages.length === 0) messages.push("店舗情報またはラベル画像が更新されました");
  return messages;
}

function setCloudUpdateAvailability(isAvailable, snapshot = null, mode = "available", messages = []) {
  cloudUpdateAvailable = isAvailable;
  if (isAvailable) {
    pendingCloudSnapshot = snapshot;
    cloudUpdateMode = mode;
    cloudUpdateMessages = messages.length > 0 ? messages : describeCloudChanges(snapshot);
    if (els.cloudUpdateSummary) {
      const extraCount = Math.max(0, cloudUpdateMessages.length - 6);
      els.cloudUpdateSummary.textContent = mode === "conflict"
        ? `端末側の変更を守るため、自動反映を止めました。${cloudUpdateMessages.length}件の違いがあります。`
        : `${cloudUpdateMessages.length}件の変更を確認しました${extraCount > 0 ? `（ほか${extraCount}件）` : ""}。`;
    }
    window.clearTimeout(cloudSyncTimer);
    cloudSyncTimer = null;
  } else {
    pendingCloudSnapshot = null;
    if (cloudUpdateMode !== "applied") {
      cloudUpdateMode = "";
      cloudUpdateMessages = [];
    }
  }
  renderCloudUpdateBanner();
  renderCloudSyncState();
}

function showAppliedCloudChanges(messages) {
  cloudUpdateAvailable = false;
  pendingCloudSnapshot = null;
  cloudUpdateMode = "applied";
  cloudUpdateMessages = messages;
  els.cloudUpdateSummary.textContent = `${messages.length}件の変更をこの端末へ反映しました。`;
  renderCloudUpdateBanner();
  renderCloudSyncState();
}

function dismissAppliedCloudChanges() {
  cloudUpdateMode = "";
  cloudUpdateMessages = [];
  renderCloudUpdateBanner();
}

async function inspectCloudUpdates() {
  const snapshot = await fetchCloudRestoreSnapshot();
  const localComparable = createLocalComparable();
  const hasUpdate = observedCloudRevision
    ? observedCloudRevision !== snapshot.revision
    : snapshot.comparable !== localComparable;

  if (hasUpdate) {
    const localUnchanged = Boolean(
      observedCloudComparable
      && observedCloudComparable === localComparable
      && !hasPendingCloudChanges()
    );
    const messages = describeCloudChanges(snapshot);
    setCloudUpdateAvailability(true, snapshot, localUnchanged ? "available" : "conflict", messages);
    return { safeToSync: false, autoApply: localUnchanged, snapshot, messages };
  }

  rememberCloudRevision(snapshot);
  setCloudUpdateAvailability(false);
  return { safeToSync: true, snapshot };
}

async function downloadCloudLabelImages(labelRows) {
  const images = {};
  for (let index = 0; index < labelRows.length; index += 1) {
    const label = labelRows[index];
    setCloudRestoreStatus(`ラベル画像を読み込んでいます（${index + 1}/${labelRows.length}）…`);
    const { data, error } = await supabaseClient.storage.from("brand-labels").download(label.image_path);
    if (error) throw error;
    images[label.brand] = await blobToDataUrl(data);
  }
  return images;
}

function clearPendingCloudChanges() {
  [PENDING_REMAINING_KEY, PENDING_VISIT_DELETES_KEY, PENDING_LABELS_KEY].forEach((baseKey) => {
    localStorage.removeItem(pendingCloudStorageKey(baseKey));
  });
}

function hasPendingCloudChanges() {
  return Object.keys(loadPendingRemainingChanges()).length > 0
    || Object.keys(loadPendingVisitDeletes()).length > 0
    || Object.keys(loadPendingLabels()).length > 0;
}

async function restoreFromSupabase(options = {}) {
  const {
    snapshot: providedSnapshot = null,
    requireConfirmation = true,
    automatic = false,
    skipOutgoingSync = false,
    changeMessages = [],
  } = options;
  if (!supabaseClient || !authSession?.user) {
    setCloudRestoreStatus("先にクラウドへログインしてください。", true);
    return;
  }
  if (navigator.onLine === false) {
    setCloudRestoreStatus("通信できる状態でお試しください。", true);
    return;
  }

  const previousCloudSyncPaused = cloudSyncPaused;
  let shouldSyncAfterRestore = false;
  cloudSyncPaused = true;
  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = null;
  cloudSyncQueued = false;
  els.cloudRestoreButton.disabled = true;
  if (els.cloudUpdateButton) els.cloudUpdateButton.disabled = true;
  setCloudRestoreStatus(automatic ? "クラウドの変更を自動反映しています…" : "クラウドの保存内容を確認しています…");
  try {
    if (!skipOutgoingSync && isCloudSyncEnabled()) {
      await runCloudSync();
      if (cloudSyncState === "pending") {
        throw new Error("端末内の変更がまだクラウドへ保存できていません。通信状態をご確認ください。");
      }
    }

    const restored = providedSnapshot || await fetchCloudRestoreSnapshot();
    const itemCount = restored.storeCount + restored.bottles.length + restored.storeVisits.length + restored.labelRows.length;
    if (itemCount === 0) {
      setCloudRestoreStatus("このアカウントには読み込めるクラウドデータがありません。", true);
      return;
    }
    const confirmed = !requireConfirmation || window.confirm(
      `クラウドのデータをこの端末へ読み込みますか？\n\n`
      + `店舗 ${restored.storeCount}件・ボトル ${restored.bottles.length}件・来店日 ${restored.storeVisits.length}件・ラベル ${restored.labelRows.length}件\n\n`
      + `現在の端末内データは、このクラウド内容に置き換わります。`,
    );
    if (!confirmed) {
      setCloudRestoreStatus("読み込みをキャンセルしました。");
      return;
    }

    const restoredLabels = await downloadCloudLabelImages(restored.labelRows);
    const previousState = { bottles, labelImages, storeLocations, storeVisits };
    const storageKeys = [STORAGE_KEY, LABELS_KEY, STORE_LOCATIONS_KEY, STORE_VISITS_KEY, KEEP_VISITS_MIGRATION_KEY];
    const previousStorage = new Map(storageKeys.map((key) => [key, localStorage.getItem(key)]));
    try {
      bottles = normalizeBottles(restored.bottles);
      labelImages = restoredLabels;
      storeLocations = restored.storeLocations;
      storeVisits = restored.storeVisits;
      renumberKeeps();
      localStorage.removeItem(KEEP_VISITS_MIGRATION_KEY);
      migrateKeepDatesToStoreVisits();
      new Set(bottles.map((bottle) => bottle.store)).forEach(syncStoreLastVisited);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
      localStorage.setItem(LABELS_KEY, JSON.stringify(labelImages));
      localStorage.setItem(STORE_LOCATIONS_KEY, JSON.stringify(storeLocations));
      localStorage.setItem(STORE_VISITS_KEY, JSON.stringify(storeVisits));
    } catch (error) {
      ({ bottles, labelImages, storeLocations, storeVisits } = previousState);
      previousStorage.forEach((value, key) => {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      });
      throw error;
    }

    clearPendingCloudChanges();
    const completedAt = new Date().toISOString();
    localStorage.setItem(CLOUD_OWNER_KEY, authSession.user.id);
    localStorage.setItem(cloudMigrationStorageKey(), JSON.stringify({
      completedAt,
      restoredFromCloud: true,
      stores: restored.storeCount,
      bottles: bottles.length,
      visits: storeVisits.length,
      labels: Object.keys(labelImages).length,
      cloudRevision: restored.revision,
      cloudComparable: restored.comparable,
      cloudCheckedAt: completedAt,
    }));
    observedCloudRevision = restored.revision;
    observedCloudComparable = restored.comparable;
    setCloudUpdateAvailability(false);
    selectedId = null;
    editingHistoryId = null;
    editingVisitId = null;
    calendarMonth = null;
    nearbyStoreDistances = null;
    render();
    renderCloudMigrationState();
    renderCloudSyncState();
    const appliedMessages = changeMessages.length > 0 ? changeMessages : describeCloudChanges(restored);
    if (automatic || changeMessages.length > 0) showAppliedCloudChanges(appliedMessages);
    setCloudRestoreStatus(`${automatic ? "自動反映" : "読み込み"}が完了しました。ボトル ${bottles.length}件・来店日 ${storeVisits.length}件です。`);
    shouldSyncAfterRestore = true;
  } catch (error) {
    setCloudRestoreStatus(error.message || "クラウドからデータを読み込めませんでした。", true);
  } finally {
    cloudSyncPaused = previousCloudSyncPaused;
    els.cloudRestoreButton.disabled = !authSession?.user;
    renderCloudUpdateBanner();
    if (shouldSyncAfterRestore && !previousCloudSyncPaused) scheduleCloudSync(0);
  }
}

function readStoredObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function cloudOwnerId() {
  return authSession?.user?.id || localStorage.getItem(CLOUD_OWNER_KEY) || "unassigned";
}

function pendingCloudStorageKey(baseKey) {
  return `${baseKey}:${cloudOwnerId()}`;
}

function isCloudSyncEnabled() {
  if (!authSession?.user) return false;
  try {
    return Boolean(JSON.parse(localStorage.getItem(cloudMigrationStorageKey()))?.completedAt);
  } catch {
    return false;
  }
}

function setCloudSyncState(state, message) {
  cloudSyncState = state;
  const connected = Boolean(authSession?.user);
  els.accountDot.classList.toggle("is-pending", connected && (state === "pending" || state === "update"));
  if (!connected) {
    if (els.cloudSyncStatus) els.cloudSyncStatus.textContent = "";
    return;
  }

  const statusLabels = {
    disabled: "クラウド接続済み",
    idle: "クラウド同期済み",
    checking: "クラウド確認中",
    syncing: "クラウド同期中",
    pending: "同期待ち",
    update: "クラウド更新あり",
  };
  els.accountStatus.textContent = statusLabels[state] || "クラウド接続済み";
  if (els.cloudSyncStatus) {
    els.cloudSyncStatus.textContent = message || "";
    els.cloudSyncStatus.classList.toggle("is-pending", state === "pending" || state === "update");
  }
}

function renderCloudSyncState() {
  if (!els.cloudSyncStatus) return;
  if (!authSession?.user) {
    setCloudSyncState("disabled", "");
    return;
  }
  if (!isCloudSyncEnabled()) {
    setCloudSyncState("disabled", "初回移行またはクラウド読み込みが完了すると、以後の変更を自動でクラウドへ保存します。");
    return;
  }
  localStorage.setItem(CLOUD_OWNER_KEY, authSession.user.id);
  if (cloudUpdateAvailable) {
    setCloudSyncState("update", "別の端末で新しい変更が見つかりました。確認してからこの端末へ読み込めます。");
  } else if (cloudSyncState === "checking") {
    setCloudSyncState("checking", "クラウドに新しい変更がないか確認しています…");
  } else if (cloudSyncState === "syncing") {
    setCloudSyncState("syncing", "端末内の変更をクラウドへ保存しています…");
  } else if (cloudSyncState === "pending") {
    setCloudSyncState("pending", "通信できるようになったら自動で再試行します。端末内のデータは保存済みです。");
  } else {
    setCloudSyncState("idle", "残量・ボトル・来店日・店舗位置・ラベルの変更を自動で保存します。");
  }
}

function loadPendingRemainingChanges() {
  return readStoredObject(pendingCloudStorageKey(PENDING_REMAINING_KEY));
}

function savePendingRemainingChanges(changes) {
  localStorage.setItem(pendingCloudStorageKey(PENDING_REMAINING_KEY), JSON.stringify(changes));
}

function queueRemainingChange(bottle, newRemaining) {
  if (!bottle) return;
  const changes = loadPendingRemainingChanges();
  const legacyId = String(bottle.id);
  const previousRemaining = changes[legacyId]?.previousRemaining ?? Number(bottle.remaining);
  if (Number(newRemaining) === Number(previousRemaining)) {
    delete changes[legacyId];
  } else {
    changes[legacyId] = {
      previousRemaining,
      newRemaining: Number(newRemaining),
      visitedOn: dateToInput(),
      changedAt: new Date().toISOString(),
    };
  }
  savePendingRemainingChanges(changes);
}

function removePendingRemainingChange(bottleId) {
  const changes = loadPendingRemainingChanges();
  delete changes[String(bottleId)];
  savePendingRemainingChanges(changes);
}

function loadPendingVisitDeletes() {
  return readStoredObject(pendingCloudStorageKey(PENDING_VISIT_DELETES_KEY));
}

function visitDeleteKey(store, visitedAt) {
  return `${store}\u0000${visitedAt}`;
}

function queueVisitDelete(store, visitedAt) {
  if (!store || !visitedAt) return;
  const changes = loadPendingVisitDeletes();
  changes[visitDeleteKey(store, visitedAt)] = { store, visitedAt, changedAt: new Date().toISOString() };
  localStorage.setItem(pendingCloudStorageKey(PENDING_VISIT_DELETES_KEY), JSON.stringify(changes));
}

function cancelPendingVisitDelete(store, visitedAt) {
  const changes = loadPendingVisitDeletes();
  delete changes[visitDeleteKey(store, visitedAt)];
  localStorage.setItem(pendingCloudStorageKey(PENDING_VISIT_DELETES_KEY), JSON.stringify(changes));
}

function queueRemovedVisitDeletes(previousVisits, nextVisits) {
  const nextKeys = new Set(nextVisits.map((visit) => visitDeleteKey(visit.store, visit.visitedAt)));
  previousVisits.forEach((visit) => {
    if (!nextKeys.has(visitDeleteKey(visit.store, visit.visitedAt))) {
      queueVisitDelete(visit.store, visit.visitedAt);
    }
  });
  nextVisits.forEach((visit) => cancelPendingVisitDelete(visit.store, visit.visitedAt));
}

function loadPendingLabels() {
  return readStoredObject(pendingCloudStorageKey(PENDING_LABELS_KEY));
}

function queueLabelSync(brand) {
  const changes = loadPendingLabels();
  changes[brand] = { changedAt: new Date().toISOString() };
  localStorage.setItem(pendingCloudStorageKey(PENDING_LABELS_KEY), JSON.stringify(changes));
}

function scheduleCloudSync(delay = 700) {
  if (cloudSyncPaused || cloudUpdateAvailable || !isCloudSyncEnabled()) return;
  if (navigator.onLine === false) {
    setCloudSyncState("pending", "通信できるようになったら自動で再試行します。端末内のデータは保存済みです。");
    return;
  }
  if (cloudSyncPromise) {
    cloudSyncQueued = true;
    return;
  }
  window.clearTimeout(cloudSyncTimer);
  setCloudSyncState("checking", "クラウドに新しい変更がないか確認しています…");
  cloudSyncTimer = window.setTimeout(() => {
    cloudSyncTimer = null;
    runCloudSync();
  }, delay);
}

async function ensureCloudStores(snapshot, userId) {
  const existingStores = await supabaseData(
    supabaseClient.from("stores").select("id,name,latitude,longitude,location_updated_at"),
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
        };
      })).select("id,name,latitude,longitude,location_updated_at"),
    );
    createdStores.forEach((store) => storeByName.set(store.name, store));
  }

  for (const [store, location] of Object.entries(snapshot.locations)) {
    const cloudStore = storeByName.get(store);
    if (!cloudStore || !location) continue;
    const hasChanged = cloudCoordinate(cloudStore.latitude) !== cloudCoordinate(location.latitude)
      || cloudCoordinate(cloudStore.longitude) !== cloudCoordinate(location.longitude)
      || (location.updatedAt && cloudStore.location_updated_at !== location.updatedAt);
    if (!hasChanged) continue;
    await supabaseData(
      supabaseClient.from("stores").update({
        latitude: location.latitude,
        longitude: location.longitude,
        location_updated_at: location.updatedAt || new Date().toISOString(),
      }).eq("id", cloudStore.id),
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
    last_visited_at: bottle.lastVisitedAt || bottle.startedAt,
    status: Number(bottle.remaining) > 0 ? "active" : "finished",
    notes: bottle.notes || "",
    legacy_id: String(bottle.id),
  };
}

function cloudBottleMetadataChanged(cloudBottle, expected) {
  return cloudBottle.store_id !== expected.store_id
    || cloudBottle.brand !== expected.brand
    || Number(cloudBottle.volume_ml) !== Number(expected.volume_ml)
    || cloudBottle.kept_at !== expected.kept_at
    || cloudBottle.last_visited_at !== expected.last_visited_at
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
  const missingBottles = snapshot.bottles.filter((bottle) => !cloudByLegacyId.has(String(bottle.id)));

  if (missingBottles.length > 0) {
    const createdBottles = await supabaseData(
      supabaseClient.from("bottles").insert(missingBottles.map((bottle) => {
        const pending = pendingRemaining[String(bottle.id)];
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

  const pendingEntries = Object.entries(pendingRemaining);
  for (const [legacyId, change] of pendingEntries) {
    const localBottle = localByLegacyId.get(legacyId);
    const cloudBottle = cloudByLegacyId.get(legacyId);
    if (!localBottle || !cloudBottle) {
      const currentChanges = loadPendingRemainingChanges();
      if (!localBottle) delete currentChanges[legacyId];
      savePendingRemainingChanges(currentChanges);
      continue;
    }
    if (Number(cloudBottle.current_remaining) !== Number(change.newRemaining)) {
      await supabaseData(
        supabaseClient.rpc("update_bottle_remaining", {
          p_bottle_id: cloudBottle.id,
          p_new_remaining: Number(change.newRemaining),
          p_notes: "焼酎キープ帳から更新",
          p_image_path: null,
          p_visited_on: change.visitedOn || dateToInput(),
        }),
      );
      cloudBottle.current_remaining = Number(change.newRemaining);
    }
    const currentChanges = loadPendingRemainingChanges();
    if (currentChanges[legacyId]?.changedAt === change.changedAt) {
      delete currentChanges[legacyId];
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
        source: "shochu_keep_ledger",
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

async function runCloudSync() {
  if (cloudSyncPromise) {
    cloudSyncQueued = true;
    return cloudSyncPromise;
  }
  if (cloudUpdateAvailable) return null;
  if (!isCloudSyncEnabled()) return null;
  if (navigator.onLine === false) {
    setCloudSyncState("pending", "通信できるようになったら自動で再試行します。端末内のデータは保存済みです。");
    return null;
  }

  cloudSyncPromise = (async () => {
    setCloudSyncState("checking", "クラウドに新しい変更がないか確認しています…");
    try {
      const inspection = await inspectCloudUpdates();
      if (!inspection.safeToSync) {
        if (inspection.autoApply) {
          await restoreFromSupabase({
            snapshot: inspection.snapshot,
            requireConfirmation: false,
            automatic: true,
            skipOutgoingSync: true,
            changeMessages: inspection.messages,
          });
        }
        return;
      }
      setCloudSyncState("syncing", "端末内の変更をクラウドへ保存しています…");
      await syncCloudSnapshot();
      const syncedSnapshot = await fetchCloudRestoreSnapshot();
      if (syncedSnapshot.comparable !== createLocalComparable()) {
        const messages = describeCloudChanges(syncedSnapshot);
        const localUnchanged = Boolean(
          observedCloudComparable
          && observedCloudComparable === createLocalComparable()
          && !hasPendingCloudChanges()
        );
        setCloudUpdateAvailability(true, syncedSnapshot, localUnchanged ? "available" : "conflict", messages);
        return;
      }
      rememberCloudRevision(syncedSnapshot);
      setCloudUpdateAvailability(false);
      const time = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      setCloudSyncState("idle", `${time}にクラウド保存を確認しました。`);
    } catch (error) {
      console.error("Cloud sync failed", error);
      setCloudSyncState("pending", "クラウドへ保存できませんでした。端末内には保存済みで、通信回復後に再試行します。");
    } finally {
      cloudSyncPromise = null;
      if (cloudSyncQueued) {
        cloudSyncQueued = false;
        scheduleCloudSync(300);
      }
    }
  })();

  return cloudSyncPromise;
}

async function migrateLocalDataToSupabase() {
  if (!supabaseClient || !authSession?.user) {
    setCloudMigrationStatus("先にクラウドへログインしてください。", true);
    return;
  }

  const snapshot = getCloudMigrationSnapshot();
  if (migrationItemCount(snapshot) === 0) {
    setCloudMigrationStatus("移行する端末データがありません。", true);
    return;
  }

  if (!window.confirm("この端末の店舗・ボトル・来店日・ラベル画像をSupabaseへ保存しますか？\n\n端末内の元データは削除されません。")) return;

  const userId = authSession.user.id;
  els.cloudMigrationButton.disabled = true;
  els.authSignOut.disabled = true;
  setCloudMigrationStatus("クラウドへ移行しています。画面を閉じずにお待ちください…");

  try {
    const existingStores = await supabaseData(
      supabaseClient.from("stores").select("id,name"),
    );
    const storeIds = new Map(existingStores.map((store) => [store.name, store.id]));
    const missingStores = snapshot.stores.filter((store) => !storeIds.has(store));

    if (missingStores.length > 0) {
      const createdStores = await supabaseData(
        supabaseClient.from("stores").insert(missingStores.map((name) => {
          const location = snapshot.locations[name];
          return {
            user_id: userId,
            name,
            area: "",
            notes: "",
            latitude: location?.latitude ?? null,
            longitude: location?.longitude ?? null,
            location_updated_at: location?.updatedAt || null,
          };
        })).select("id,name"),
      );
      createdStores.forEach((store) => storeIds.set(store.name, store.id));
    }

    for (const store of snapshot.stores) {
      const location = snapshot.locations[store];
      if (!location || missingStores.includes(store)) continue;
      await supabaseData(
        supabaseClient.from("stores").update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_updated_at: location.updatedAt || new Date().toISOString(),
        }).eq("id", storeIds.get(store)),
      );
    }

    const existingBottles = await supabaseData(
      supabaseClient.from("bottles").select("id,legacy_id"),
    );
    const migratedBottleIds = new Set(existingBottles.map((bottle) => bottle.legacy_id).filter(Boolean));
    const missingBottles = snapshot.bottles.filter((bottle) => !migratedBottleIds.has(String(bottle.id)));
    if (missingBottles.length > 0) {
      await supabaseData(
        supabaseClient.from("bottles").insert(missingBottles.map((bottle) => ({
          user_id: userId,
          store_id: storeIds.get(bottle.store),
          brand: bottle.name,
          volume_ml: Number(bottle.volume) || 900,
          current_remaining: Math.min(100, Math.max(0, Number(bottle.remaining))),
          kept_at: bottle.startedAt,
          last_visited_at: bottle.lastVisitedAt || bottle.startedAt,
          last_updated_at: new Date().toISOString(),
          status: Number(bottle.remaining) > 0 ? "active" : "finished",
          notes: bottle.notes || "",
          legacy_id: String(bottle.id),
        }))),
      );
    }

    const existingVisits = await supabaseData(
      supabaseClient.from("store_visits").select("store_id,visited_on"),
    );
    const visitKeys = new Set(existingVisits.map((visit) => `${visit.store_id}\u0000${visit.visited_on}`));
    const missingVisits = snapshot.visits.filter((visit) => {
      const key = `${storeIds.get(visit.store)}\u0000${visit.visitedAt}`;
      if (visitKeys.has(key)) return false;
      visitKeys.add(key);
      return true;
    });
    if (missingVisits.length > 0) {
      await supabaseData(
        supabaseClient.from("store_visits").insert(missingVisits.map((visit) => ({
          user_id: userId,
          store_id: storeIds.get(visit.store),
          visited_on: visit.visitedAt,
        }))),
      );
    }

    const existingLabels = await supabaseData(
      supabaseClient.from("brand_labels").select("brand,image_path"),
    );
    const registeredBrands = new Set(existingLabels.map((label) => label.brand));
    let migratedLabelCount = 0;
    for (const [brand, dataUrl] of Object.entries(snapshot.labels)) {
      if (registeredBrands.has(brand)) continue;
      setCloudMigrationStatus(`ラベル画像を移行しています（${migratedLabelCount + 1}/${Object.keys(snapshot.labels).length}）…`);
      const image = dataUrlToImageFile(dataUrl);
      const imagePath = `${userId}/${crypto.randomUUID()}.${image.extension}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("brand-labels")
        .upload(imagePath, image.blob, { contentType: image.mimeType, upsert: false });
      if (uploadError) throw uploadError;
      await supabaseData(
        supabaseClient.from("brand_labels").insert({
          user_id: userId,
          brand,
          image_path: imagePath,
        }),
      );
      migratedLabelCount += 1;
    }

    const completedAt = new Date().toISOString();
    localStorage.setItem(cloudMigrationStorageKey(), JSON.stringify({
      completedAt,
      stores: snapshot.stores.length,
      bottles: snapshot.bottles.length,
      visits: snapshot.visits.length,
      labels: Object.keys(snapshot.labels).length,
    }));
    localStorage.setItem(CLOUD_OWNER_KEY, userId);
    renderCloudSyncState();
    scheduleCloudSync(0);
    setCloudMigrationStatus(`移行が完了しました。店舗 ${snapshot.stores.length}件、ボトル ${snapshot.bottles.length}件、来店日 ${snapshot.visits.length}件をクラウドで確認できます。端末内データも残っています。`);
  } catch (error) {
    setCloudMigrationStatus(`移行を完了できませんでした：${error.message || "通信状態をご確認ください。"}\n途中まで保存されたデータは、再実行時に重複しないよう確認します。`, true);
  } finally {
    els.authSignOut.disabled = false;
    els.cloudMigrationButton.disabled = false;
  }
}

function loadBottles() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : demoBottles;
  } catch {
    return demoBottles;
  }
}

function normalizeBottles(source) {
  return source.map((bottle) => ({
    ...bottle,
    lastVisitedAt: bottle.lastVisitedAt || bottle.startedAt,
    keepNumber: bottle.keepNumber || 1,
  }));
}

function saveBottles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
  scheduleCloudSync();
}

function loadLabelImages() {
  try {
    const saved = JSON.parse(localStorage.getItem(LABELS_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveLabelImages() {
  localStorage.setItem(LABELS_KEY, JSON.stringify(labelImages));
  scheduleCloudSync();
}

function loadStoreLocations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_LOCATIONS_KEY));
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).flatMap(([store, location]) => {
      const latitude = cloudCoordinate(location?.latitude);
      const longitude = cloudCoordinate(location?.longitude);
      if (!store || latitude === null || longitude === null || (latitude === 0 && longitude === 0)) return [];
      return [[store, { ...location, latitude, longitude }]];
    }));
  } catch {
    return {};
  }
}

function saveStoreLocations() {
  localStorage.setItem(STORE_LOCATIONS_KEY, JSON.stringify(storeLocations));
  scheduleCloudSync();
}

function loadStoreVisits() {
  try {
    const storedText = localStorage.getItem(STORE_VISITS_KEY);
    if (storedText !== null) {
      const saved = JSON.parse(storedText);
      return Array.isArray(saved)
        ? saved.filter((visit) => visit?.store && visit?.visitedAt).map((visit) => ({
          id: visit.id || crypto.randomUUID(),
          store: visit.store,
          visitedAt: visit.visitedAt,
        }))
        : [];
    }
  } catch {
    return [];
  }

  const seen = new Set();
  return bottles.flatMap((bottle) => {
    const visitedAt = bottle.lastVisitedAt || bottle.startedAt;
    const key = `${bottle.store}\u0000${visitedAt}`;
    if (!bottle.store || !visitedAt || seen.has(key)) return [];
    seen.add(key);
    return [{ id: crypto.randomUUID(), store: bottle.store, visitedAt }];
  });
}

function saveStoreVisits() {
  localStorage.setItem(STORE_VISITS_KEY, JSON.stringify(storeVisits));
  scheduleCloudSync();
}

function migrateKeepDatesToStoreVisits() {
  if (localStorage.getItem(KEEP_VISITS_MIGRATION_KEY) === "done") return;
  const registered = new Set(
    storeVisits.map((visit) => `${visit.store}\u0000${visit.visitedAt}`),
  );

  bottles.forEach((bottle) => {
    [bottle.startedAt, bottle.lastVisitedAt].forEach((visitedAt) => {
      const key = `${bottle.store}\u0000${visitedAt}`;
      if (!bottle.store || !visitedAt || registered.has(key)) return;
      storeVisits.push({ id: crypto.randomUUID(), store: bottle.store, visitedAt });
      registered.add(key);
    });
  });

  localStorage.setItem(KEEP_VISITS_MIGRATION_KEY, "done");
}

function setBackupStatus(message, isError = false) {
  els.backupStatus.textContent = message;
  els.backupStatus.classList.toggle("is-error", isError);
}

function createBackupData() {
  return {
    type: "shochu-keep-ledger-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      bottles,
      labelImages,
      storeLocations,
      storeVisits,
    },
  };
}

function downloadBackup() {
  const json = JSON.stringify(createBackupData(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shochu-keep-ledger-backup-${dateToInput()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setBackupStatus("バックアップファイルを保存しました。大切な場所に保管してください。");
}

function parseBackupData(backup) {
  if (backup?.type !== "shochu-keep-ledger-backup" || backup?.version !== 1 || !backup.data) {
    throw new Error("このアプリのバックアップファイルではありません。");
  }

  const data = backup.data;
  const isDateText = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!Array.isArray(data.bottles) || !data.bottles.every((bottle) => (
    typeof bottle?.store === "string"
    && typeof bottle?.name === "string"
    && isDateText(bottle.startedAt)
    && isDateText(bottle.lastVisitedAt || bottle.startedAt)
    && Number.isFinite(Number(bottle.remaining))
  ))) {
    throw new Error("ボトル情報を読み込めませんでした。");
  }
  if (!Array.isArray(data.storeVisits) || !data.storeVisits.every((visit) => (
    typeof visit?.store === "string" && isDateText(visit.visitedAt)
  ))) {
    throw new Error("来店履歴を読み込めませんでした。");
  }

  const restoredBottles = data.bottles.map((bottle) => ({
    id: typeof bottle.id === "string" && bottle.id ? bottle.id : crypto.randomUUID(),
    store: bottle.store.trim().slice(0, 40),
    name: bottle.name.trim().slice(0, 40),
    volume: 900,
    remaining: Math.min(100, Math.max(0, Number(bottle.remaining))),
    startedAt: bottle.startedAt,
    lastVisitedAt: bottle.lastVisitedAt || bottle.startedAt,
    notes: typeof bottle.notes === "string" ? bottle.notes.slice(0, 1000) : "",
    keepNumber: 1,
  }));
  if (restoredBottles.some((bottle) => !bottle.store || !bottle.name)) {
    throw new Error("店名または銘柄が空のデータは復元できません。");
  }

  const visitKeys = new Set();
  const restoredStoreVisits = data.storeVisits.flatMap((visit) => {
    const store = visit.store.trim().slice(0, 40);
    const key = `${store}\u0000${visit.visitedAt}`;
    if (!store || visitKeys.has(key)) return [];
    visitKeys.add(key);
    return [{
      id: typeof visit.id === "string" && visit.id ? visit.id : crypto.randomUUID(),
      store,
      visitedAt: visit.visitedAt,
    }];
  });

  const restoredLabelImages = data.labelImages && typeof data.labelImages === "object"
    ? Object.fromEntries(Object.entries(data.labelImages).filter(([brand, image]) => (
      typeof brand === "string" && brand && typeof image === "string" && image.startsWith("data:image/")
    )))
    : {};
  const restoredStoreLocations = data.storeLocations && typeof data.storeLocations === "object"
    ? Object.fromEntries(Object.entries(data.storeLocations).flatMap(([store, location]) => {
      const latitude = cloudCoordinate(location?.latitude);
      const longitude = cloudCoordinate(location?.longitude);
      if (!store || latitude === null || longitude === null || (latitude === 0 && longitude === 0)) return [];
      return [[store.slice(0, 40), {
        latitude,
        longitude,
        updatedAt: typeof location.updatedAt === "string" ? location.updatedAt : "",
      }]];
    }))
    : {};

  return {
    bottles: restoredBottles,
    labelImages: restoredLabelImages,
    storeLocations: restoredStoreLocations,
    storeVisits: restoredStoreVisits,
  };
}

async function restoreBackup(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    setBackupStatus("ファイルが大きすぎます。25MB以下のバックアップを選んでください。", true);
    return;
  }

  try {
    const restored = parseBackupData(JSON.parse(await file.text()));
    if (!window.confirm("現在の入力データを、選択したバックアップの内容で置き換えますか？")) {
      setBackupStatus("復元をキャンセルしました。");
      return;
    }

    const previousVisits = storeVisits;
    bottles = restored.bottles;
    labelImages = restored.labelImages;
    storeLocations = restored.storeLocations;
    storeVisits = restored.storeVisits;
    queueRemovedVisitDeletes(previousVisits, storeVisits);
    Object.keys(labelImages).forEach(queueLabelSync);
    selectedId = null;
    editingHistoryId = null;
    editingVisitId = null;
    calendarMonth = null;
    renumberKeeps();
    localStorage.removeItem(KEEP_VISITS_MIGRATION_KEY);
    migrateKeepDatesToStoreVisits();
    new Set(bottles.map((bottle) => bottle.store)).forEach(syncStoreLastVisited);
    saveBottles();
    saveLabelImages();
    saveStoreLocations();
    saveStoreVisits();
    render();
    setBackupStatus(`復元しました。ボトル履歴 ${bottles.length}件、来店日 ${storeVisits.length}件です。`);
  } catch (error) {
    setBackupStatus(error.message || "バックアップを復元できませんでした。", true);
  }
}

function latestStoreVisitDate(store) {
  const recordedDates = storeVisits
    .filter((visit) => visit.store === store)
    .map((visit) => visit.visitedAt);
  const fallbackDates = bottles
    .filter((bottle) => bottle.store === store)
    .map((bottle) => bottle.startedAt);
  return [...recordedDates, ...fallbackDates].reduce(
    (latest, date) => (!latest || date > latest ? date : latest),
    "",
  );
}

function syncStoreLastVisited(store) {
  const latestVisit = latestStoreVisitDate(store);
  if (!latestVisit) return;
  bottles = bottles.map((bottle) => (
    bottle.store === store ? { ...bottle, lastVisitedAt: latestVisit } : bottle
  ));
}

function recordStoreVisit(store, visitedAt) {
  if (!store || !visitedAt) return false;
  cancelPendingVisitDelete(store, visitedAt);
  const duplicate = storeVisits.some((visit) => visit.store === store && visit.visitedAt === visitedAt);
  if (duplicate) {
    syncStoreLastVisited(store);
    saveBottles();
    return false;
  }
  storeVisits.push({ id: crypto.randomUUID(), store, visitedAt });
  syncStoreLastVisited(store);
  saveStoreVisits();
  saveBottles();
  return true;
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("この端末では位置情報を利用できません。"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      }),
      (error) => {
        if (error.code === 1) {
          reject(new Error("ブラウザの設定で位置情報の利用を許可してください。"));
        } else if (error.code === 3) {
          reject(new Error("位置情報を取得できませんでした。もう一度お試しください。"));
        } else {
          reject(new Error("現在地を確認できませんでした。"));
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}

function distanceInMeters(from, to) {
  const radius = 6371000;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const value = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDifference / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function setLocationStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function registeredStoreLocations() {
  const registeredStores = new Set(bottles.map((bottle) => bottle.store));
  return Object.entries(storeLocations)
    .filter(([store, location]) => (
      registeredStores.has(store)
      && Number.isFinite(Number(location?.latitude))
      && Number.isFinite(Number(location?.longitude))
    ));
}

function renderNearbyStoreCandidates(position) {
  els.nearbyStoresList.replaceChildren();
  const candidates = registeredStoreLocations()
    .map(([store, location]) => ({ store, distance: distanceInMeters(position, location) }))
    .sort((a, b) => a.distance - b.distance);
  const nearby = candidates.filter((candidate) => candidate.distance <= 1000).slice(0, 5);

  if (nearby.length === 0) {
    const nearest = candidates[0];
    setLocationStatus(
      els.nearbyStoresStatus,
      nearest
        ? `1km以内に登録店がありません。最寄りは「${nearest.store}」（約${formatDistance(nearest.distance)}）です。`
        : "場所を登録した店舗がありません。店舗履歴から現在地を登録できます。",
      true,
    );
    return;
  }

  nearby.forEach(({ store, distance }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nearby-store-candidate";
    const name = document.createElement("strong");
    name.textContent = store;
    const distanceText = document.createElement("span");
    distanceText.textContent = `現在地から約${formatDistance(distance)}`;
    button.append(name, distanceText);
    button.addEventListener("click", () => openQuickVisit(store));
    els.nearbyStoresList.append(button);
  });
  setLocationStatus(
    els.nearbyStoresStatus,
    `1km以内の候補を${nearby.length}件表示しています。店名を押して選んでください。${position.accuracy > 200 ? `（位置精度 約${formatDistance(position.accuracy)}）` : ""}`,
  );
}

async function findNearbyStoresForHome({ silent = false } = {}) {
  if (registeredStoreLocations().length === 0) {
    els.nearbyStoresList.replaceChildren();
    setLocationStatus(els.nearbyStoresStatus, "場所を登録した店舗がありません。店舗履歴から現在地を登録できます。", true);
    return;
  }
  els.findNearbyStores.disabled = true;
  if (!silent) setLocationStatus(els.nearbyStoresStatus, "現在地を確認しています…");
  try {
    nearbyHomePosition = await requestCurrentPosition();
    renderNearbyStoreCandidates(nearbyHomePosition);
  } catch (error) {
    els.nearbyStoresList.replaceChildren();
    setLocationStatus(els.nearbyStoresStatus, `${error.message} 下の店舗一覧はそのまま利用できます。`, true);
  } finally {
    els.findNearbyStores.disabled = false;
  }
}

async function tryAutomaticNearbyStores() {
  if (!navigator.permissions?.query) return;
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state === "granted") await findNearbyStoresForHome({ silent: true });
  } catch {
    // SafariなどPermissions APIが利用できない環境では、ボタン操作に任せる。
  }
}

function getStoreBrandKey(store, name) {
  return `${store}\u0000${name}`;
}

function renumberKeeps() {
  const counts = {};
  const numbersById = {};
  [...bottles]
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt) || String(a.id).localeCompare(String(b.id)))
    .forEach((bottle) => {
      const key = getStoreBrandKey(bottle.store, bottle.name);
      counts[key] = (counts[key] || 0) + 1;
      numbersById[bottle.id] = counts[key];
    });
  bottles = bottles.map((bottle) => ({ ...bottle, keepNumber: numbersById[bottle.id] }));
}

function dateToInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysSince(dateText) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateText}T00:00:00`);
  return Math.max(0, Math.round((today - target) / DAY));
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${dateText}T00:00:00`));
}

function visitText(bottle) {
  const days = getDaysSince(latestStoreVisitDate(bottle.store));
  return days === 0 ? "今日来店" : `前回の来店から ${days}日`;
}

function storeVisitText(store) {
  const days = getDaysSince(latestStoreVisitDate(store));
  return days === 0 ? "本日来店" : `最終来店から${days}日`;
}

function isActive(bottle) {
  return bottle.remaining > 0;
}

function sortedBottles() {
  const sort = els.sort.value;
  return [...bottles].sort((a, b) => {
    if (sort === "remaining") return a.remaining - b.remaining;
    if (sort === "newest") return new Date(b.startedAt) - new Date(a.startedAt);
    return new Date(latestStoreVisitDate(a.store)) - new Date(latestStoreVisitDate(b.store));
  });
}

function sortedStores() {
  const sort = els.sort.value;
  const stores = [...new Set(bottles.map((bottle) => bottle.store.trim()).filter(Boolean))];
  const sortValue = (store) => {
    const storeBottles = bottles.filter((bottle) => bottle.store === store);
    const activeStoreBottles = storeBottles.filter(isActive);
    if (sort === "remaining") {
      return activeStoreBottles.length
        ? Math.min(...activeStoreBottles.map((bottle) => bottle.remaining))
        : Number.POSITIVE_INFINITY;
    }
    if (sort === "newest") {
      return activeStoreBottles.length
        ? Math.max(...activeStoreBottles.map((bottle) => new Date(bottle.startedAt).getTime()))
        : Number.NEGATIVE_INFINITY;
    }
    if (sort === "nearby") {
      return nearbyStoreDistances?.get(store) ?? Number.POSITIVE_INFINITY;
    }
    return new Date(latestStoreVisitDate(store)).getTime();
  };

  return stores.sort((a, b) => {
    const difference = sort === "newest" ? sortValue(b) - sortValue(a) : sortValue(a) - sortValue(b);
    return difference || a.localeCompare(b, "ja");
  });
}

function render() {
  const activeBottles = sortedBottles().filter(isActive);
  const stores = sortedStores();
  els.activeCount.textContent = activeBottles.length;
  els.list.replaceChildren();
  els.empty.hidden = stores.length > 0;

  const groupedBottles = activeBottles.reduce((groups, bottle) => {
    (groups[bottle.store] ||= []).push(bottle);
    return groups;
  }, {});

  stores.forEach((store) => {
    const group = document.createElement("section");
    group.className = "store-group";
    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "store-group-heading";
    const headingName = document.createElement("span");
    headingName.className = "store-group-name";
    headingName.textContent = store;
    const headingVisit = document.createElement("small");
    headingVisit.className = "store-last-visit";
    headingVisit.textContent = storeVisitText(store);
    heading.append(headingName, headingVisit);
    heading.addEventListener("click", () => openQuickVisit(store));
    const groupList = document.createElement("div");
    groupList.className = "store-group-list";
    group.append(heading, groupList);

    const storeBottles = groupedBottles[store] || [];
    storeBottles.forEach((bottle) => {
      const fragment = els.template.content.cloneNode(true);
      const card = fragment.querySelector(".bottle-card");
      const button = fragment.querySelector(".card-button");
      fragment.querySelector(".store-name").remove();
      const label = fragment.querySelector(".bottle-label");
      const labelContainer = fragment.querySelector(".bottle-icon");
      const labelSource = labelImages[bottle.name];
      if (labelSource) {
        label.src = labelSource;
        label.hidden = false;
        labelContainer.classList.add("has-label");
        labelContainer.querySelector("span").hidden = true;
      }
      fragment.querySelector(".bottle-name").textContent = bottle.name;
      fragment.querySelector(".keep-count").textContent = `${bottle.keepNumber}回目のキープ`;
      fragment.querySelector(".visit-label").textContent = visitText(bottle);
      fragment.querySelector(".card-amount strong").textContent = `${bottle.remaining}%`;
      fragment.querySelector(".card-progress span").style.width = `${bottle.remaining}%`;
      button.addEventListener("click", () => openDetail(bottle.id));
      card.dataset.id = bottle.id;
      groupList.append(fragment);
    });

    if (storeBottles.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "current-keep-empty";
      emptyMessage.textContent = "現在キープ中のボトルはありません";
      groupList.append(emptyMessage);
    }

    els.list.append(group);
  });
  if (nearbyHomePosition) renderNearbyStoreCandidates(nearbyHomePosition);
}

function monthStartFromDate(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Date(validDate.getFullYear(), validDate.getMonth(), 1);
}

function renderStoreVisitCalendar(store) {
  if (!calendarMonth) {
    calendarMonth = monthStartFromDate(latestStoreVisitDate(store) || dateToInput());
  }

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayText = dateToInput();
  const visitsByDate = new Map(
    storeVisits
      .filter((visit) => visit.store === store)
      .map((visit) => [visit.visitedAt, visit]),
  );

  els.calendarTitle.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(calendarMonth);
  els.calendarGrid.replaceChildren();

  for (let index = 0; index < firstWeekday; index += 1) {
    const empty = document.createElement("span");
    empty.className = "calendar-day-empty";
    els.calendarGrid.append(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateText = dateToInput(new Date(year, month, day));
    const visit = visitsByDate.get(dateText);
    const isKeepDate = bottles.some((bottle) => (
      bottle.store === store && bottle.startedAt === dateText
    ));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.classList.toggle("is-today", dateText === todayText);

    if (visit) {
      button.classList.add("is-visited");
      button.classList.toggle("is-keep-date", isKeepDate);
      button.setAttribute(
        "aria-label",
        `${formatDate(dateText)} ${isKeepDate ? "キープ日・" : ""}来店済み。編集する`,
      );
      button.addEventListener("click", () => openVisitEdit(visit.id));
    } else {
      button.disabled = dateText > todayText;
      button.setAttribute("aria-label", `${formatDate(dateText)} 来店日を追加`);
      button.addEventListener("click", () => {
        if (!window.confirm(`${formatDate(dateText)}を来店日として追加しますか？`)) return;
        if (!recordStoreVisit(store, dateText)) return;
        render();
        renderStoreVisitCalendar(store);
      });
    }
    els.calendarGrid.append(button);
  }

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  els.calendarNext.disabled = calendarMonth >= currentMonth;
}

function moveCalendarMonth(offset) {
  const store = els.historyStore.textContent.trim();
  if (!store || !calendarMonth) return;
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  renderStoreVisitCalendar(store);
}

function renderQuickVisit(store) {
  currentQuickStore = store;
  const latestVisit = latestStoreVisitDate(store);
  els.quickVisitTitle.textContent = store;
  els.quickVisitLast.textContent = latestVisit
    ? `最終来店 ${formatDate(latestVisit)}・${storeVisitText(store)}`
    : "来店日の記録はありません";
  els.quickBottleList.replaceChildren();

  const activeBottles = bottles
    .filter((bottle) => bottle.store === store && isActive(bottle))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (activeBottles.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quick-empty";
    empty.textContent = "現在キープ中のボトルはありません。";
    els.quickBottleList.append(empty);
    return;
  }

  activeBottles.forEach((bottle) => {
    const card = document.createElement("article");
    card.className = "quick-bottle-card";
    const heading = document.createElement("div");
    heading.className = "quick-bottle-heading";
    const name = document.createElement("strong");
    name.textContent = `${bottle.name}（${bottle.keepNumber}回目）`;
    const amount = document.createElement("output");
    amount.textContent = `${bottle.remaining}%`;
    heading.append(name, amount);

    const range = document.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = "100";
    range.step = "5";
    range.value = String(bottle.remaining);
    range.setAttribute("aria-label", `${bottle.name}の残量`);
    const controls = document.createElement("div");
    controls.className = "quick-bottle-controls";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−10%";
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "＋10%";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "primary-button quick-save-button";
    save.textContent = "この残量で保存";
    const updateAmount = (value) => {
      const next = Math.min(100, Math.max(0, Number(value)));
      range.value = String(next);
      amount.textContent = `${next}%`;
    };
    range.addEventListener("input", () => updateAmount(range.value));
    decrease.addEventListener("click", () => updateAmount(Number(range.value) - 10));
    increase.addEventListener("click", () => updateAmount(Number(range.value) + 10));
    save.addEventListener("click", () => {
      if (!saveBottleRemaining(bottle.id, range.value)) {
        els.quickVisitStatus.textContent = "残量は変更されていません。";
        return;
      }
      els.quickVisitStatus.textContent = `${bottle.name}を${range.value}%で保存し、本日を来店日に記録しました。`;
      renderQuickVisit(store);
    });
    controls.append(decrease, increase);
    card.append(heading, range, controls, save);
    els.quickBottleList.append(card);
  });
}

function openQuickVisit(store) {
  if (!store) return;
  els.quickVisitStatus.textContent = "";
  renderQuickVisit(store);
  if (!els.quickVisitDialog.open) els.quickVisitDialog.showModal();
}

function openStoreHistory(store) {
  const historyByDate = bottles
    .filter((bottle) => bottle.store === store)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const history = [...historyByDate].reverse();
  els.historyStore.textContent = store;
  els.historyList.replaceChildren();
  calendarMonth = null;
  renderStoreVisitCalendar(store);
  setLocationStatus(
    els.historyLocationStatus,
    storeLocations[store] ? "この店舗の場所は登録済みです。" : "未登録です。お店にいるときに現在地を登録してください。",
  );

  history.forEach((bottle) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.classList.toggle("is-finished", bottle.remaining === 0);
    const information = document.createElement("div");
    const serial = document.createElement("span");
    serial.className = "history-serial";
    serial.textContent = `No. ${historyByDate.findIndex((item) => item.id === bottle.id) + 1}`;
    const name = document.createElement("strong");
    name.textContent = `${bottle.name}（${bottle.keepNumber}回目）`;
    const started = document.createElement("p");
    started.textContent = `キープ日：${formatDate(bottle.startedAt)}`;
    const side = document.createElement("div");
    side.className = "history-side";
    const amount = document.createElement("span");
    amount.className = "history-amount";
    amount.textContent = `${bottle.remaining}%`;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "history-edit-button";
    edit.textContent = "編集";
    edit.addEventListener("click", () => openHistoryEdit(bottle.id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "history-delete-button";
    remove.textContent = "削除";
    remove.addEventListener("click", () => deleteHistoryEntry(bottle.id, store));
    information.append(serial, name, started);
    side.append(amount, edit, remove);
    item.append(information, side);
    els.historyList.append(item);
  });

  els.historyDialog.showModal();
}

function openVisitEdit(id) {
  const visit = storeVisits.find((item) => item.id === id);
  if (!visit) return;
  editingVisitId = id;
  els.historyDialog.close();
  els.visitEditForm.reset();
  els.visitEditForm.elements.visitEditDate.value = visit.visitedAt;
  els.visitEditForm.elements.visitEditDate.max = dateToInput();
  els.visitEditDialog.showModal();
}

function deleteStoreVisit(id) {
  const visit = storeVisits.find((item) => item.id === id);
  if (!visit || !window.confirm(`${formatDate(visit.visitedAt)}の来店履歴を削除しますか？`)) return;
  queueVisitDelete(visit.store, visit.visitedAt);
  storeVisits = storeVisits.filter((item) => item.id !== id);
  syncStoreLastVisited(visit.store);
  saveStoreVisits();
  saveBottles();
  render();
  if (els.historyDialog.open) els.historyDialog.close();
  if (els.visitEditDialog.open) els.visitEditDialog.close();
  if (bottles.some((bottle) => bottle.store === visit.store)) openStoreHistory(visit.store);
}

function openHistoryEdit(id) {
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle) return;
  editingHistoryId = id;
  els.historyDialog.close();
  els.historyEditForm.reset();
  renderStoreOptions();
  els.historyEditStoreSelect.value = bottle.store;
  renderBrandOptions();
  els.historyEditNameSelect.value = bottle.name;
  setInputMode(els.historyEditStoreSelect, els.historyEditNewStore);
  setInputMode(els.historyEditNameSelect, els.historyEditNewName);
  els.historyEditForm.elements.historyEditStartedAt.value = bottle.startedAt;
  els.historyEditDialog.showModal();
}

function deleteHistoryEntry(id, store) {
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle || !window.confirm(`「${bottle.name}」の履歴を削除しますか？`)) return;
  removePendingRemainingChange(bottle.id);
  bottles = bottles.filter((item) => item.id !== id);
  renumberKeeps();
  saveBottles();
  render();
  els.historyDialog.close();
  if (bottles.some((item) => item.store === store)) openStoreHistory(store);
}

function openDetail(id) {
  selectedId = id;
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle) return;
  els.detailStore.textContent = bottle.store;
  els.detailName.textContent = `${bottle.name}（${bottle.keepNumber}回目）`;
  els.detailStarted.textContent = formatDate(bottle.startedAt);
  els.detailLastVisited.textContent = formatDate(latestStoreVisitDate(bottle.store));
  els.detailDays.textContent = visitText(bottle);
  els.detailNotes.textContent = bottle.notes || "登録なし";
  updateDetailRemaining(bottle.remaining, false);
  els.detailDialog.showModal();
}

function saveBottleRemaining(id, value) {
  const amount = Math.min(100, Math.max(0, Number(value)));
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle || Number(bottle.remaining) === amount) return false;
  queueRemainingChange(bottle, amount);
  bottles = bottles.map((item) => item.id === id ? { ...item, remaining: amount } : item);
  recordStoreVisit(bottle.store, dateToInput());
  saveBottles();
  render();
  return true;
}

function updateDetailRemaining(value, persist = true) {
  const amount = Math.min(100, Math.max(0, Number(value)));
  els.range.value = amount;
  els.detailRemaining.textContent = `${amount}%`;
  els.detailProgress.style.width = `${amount}%`;
  if (persist && selectedId) {
    const selectedBottle = bottles.find((bottle) => bottle.id === selectedId);
    if (!selectedBottle || !saveBottleRemaining(selectedId, amount)) return;
    const updatedBottle = bottles.find((bottle) => bottle.id === selectedId);
    els.detailLastVisited.textContent = formatDate(latestStoreVisitDate(selectedBottle.store));
    els.detailDays.textContent = visitText(updatedBottle);
  }
}

function finishAndOpenNextBottleForm() {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle) return;
  if (!window.confirm(`「${bottle.name}」を飲み切りにして、次のボトル入力へ進みますか？`)) return;

  const today = dateToInput();
  queueRemainingChange(bottle, 0);
  bottles = bottles.map((item) => item.id === bottle.id ? { ...item, remaining: 0 } : item);
  recordStoreVisit(bottle.store, today);
  saveBottles();
  render();
  els.detailDialog.close();
  prepareCurrentForm(bottle.store);
  els.formDialog.showModal();
  requestAnimationFrame(() => els.nameSelect.focus());
}

function renderOptions(select, values, placeholder, newLabel, formatLabel = (value) => value) {
  select.replaceChildren(new Option(placeholder, ""));
  select.options[0].disabled = true;
  select.add(new Option(newLabel, "__new__"));
  values.forEach((value) => select.add(new Option(formatLabel(value), value)));
}

function renderStoreOptions() {
  const stores = [...new Set(bottles.map((bottle) => bottle.store.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  renderOptions(els.storeSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
  renderOptions(els.pastStoreSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
  renderOptions(els.historyEditStoreSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
}

function selectedStore(select, newInput) {
  return select.value === "__new__" ? newInput.value.trim() : select.value;
}

function selectedBrand(select, newInput) {
  return select.value === "__new__" ? newInput.value.trim() : select.value;
}

function updatePreviousKeepInfo() {
  const store = selectedStore(els.storeSelect, els.newStore);
  const brand = selectedBrand(els.nameSelect, els.newName);
  if (!store || !brand) {
    els.previousKeepInfo.textContent = "";
    els.previousKeepInfo.hidden = true;
    return;
  }

  const previousBottle = bottles
    .filter((bottle) => bottle.store === store && bottle.name === brand)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  els.previousKeepInfo.textContent = previousBottle
    ? `前回この店でキープした日：${formatDate(previousBottle.startedAt)}`
    : "この店では初めてキープする銘柄です";
  els.previousKeepInfo.hidden = false;
}

function renderBrandOptionsFor(select, store, excludeId = null) {
  const brands = [...new Set(bottles.map((bottle) => bottle.name.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  const previousValue = select.value;
  renderOptions(select, brands, "銘柄を選択してください", "＋ 新しい銘柄を入力", (brand) => {
    if (!store) return brand;
    const count = bottles.filter((bottle) => (
      bottle.id !== excludeId && bottle.store === store && bottle.name === brand
    )).length;
    return `${brand}（今回で${count + 1}回目）`;
  });
  if ([...select.options].some((option) => option.value === previousValue)) {
    select.value = previousValue;
  }
}

function renderBrandOptions() {
  renderBrandOptionsFor(els.nameSelect, selectedStore(els.storeSelect, els.newStore));
  renderBrandOptionsFor(els.pastNameSelect, selectedStore(els.pastStoreSelect, els.pastNewStore));
  renderBrandOptionsFor(
    els.historyEditNameSelect,
    selectedStore(els.historyEditStoreSelect, els.historyEditNewStore),
    editingHistoryId,
  );
}

function renderLabelOptions() {
  const brands = [...new Set(bottles.map((bottle) => bottle.name.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  els.labelBrandSelect.replaceChildren(new Option("銘柄を選択してください", ""));
  els.labelBrandSelect.options[0].disabled = true;
  brands.forEach((brand) => els.labelBrandSelect.add(new Option(brand, brand)));
}

function resizeLabelImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith("image/")) {
      reject(new Error("画像ファイルを選択してください。"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("画像は10MB以下にしてください。"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("画像を表示できませんでした。"));
      image.onload = () => {
        const scale = Math.min(1, 220 / image.width, 300 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function registeredBrands() {
  return [...new Set([
    ...bottles.map((bottle) => bottle.name.trim()),
    ...Object.keys(labelImages).map((brand) => brand.trim()),
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
}

function normalizeOcrText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function brandMatchScore(brand, text) {
  const target = normalizeOcrText(brand);
  const compact = normalizeOcrText(text);
  if (!target || !compact) return 0;
  if (compact.includes(target)) return 1;

  const lines = String(text || "").split(/\r?\n/).map(normalizeOcrText).filter(Boolean);
  const samples = new Set(lines);
  const minimumLength = Math.max(1, target.length - 1);
  const maximumLength = Math.min(compact.length, target.length + 2);
  for (let length = minimumLength; length <= maximumLength; length += 1) {
    for (let index = 0; index + length <= compact.length; index += 1) {
      samples.add(compact.slice(index, index + length));
    }
  }

  let best = 0;
  samples.forEach((sample) => {
    if (sample.includes(target) || target.includes(sample) && sample.length >= Math.max(2, target.length - 1)) {
      best = Math.max(best, sample.length === target.length ? 0.96 : 0.75);
    }
    const distance = levenshteinDistance(target, sample);
    best = Math.max(best, 1 - distance / Math.max(target.length, sample.length));
  });
  return best;
}

function findBrandCandidates(text) {
  return registeredBrands()
    .map((brand) => ({ brand, score: brandMatchScore(brand, text) }))
    .filter((candidate) => candidate.score >= 0.24)
    .sort((a, b) => b.score - a.score || a.brand.localeCompare(b.brand, "ja"))
    .slice(0, 3);
}

async function preprocessLabelImage(file) {
  if (!file?.type.startsWith("image/")) throw new Error("画像ファイルを選択してください。");
  if (file.size > 10 * 1024 * 1024) throw new Error("画像は10MB以下にしてください。");

  let source;
  let release = () => {};
  if ("createImageBitmap" in window) {
    source = await createImageBitmap(file);
    release = () => source.close();
  } else {
    source = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("画像を表示できませんでした。"));
      };
      image.src = url;
    });
  }

  try {
    const sourceWidth = source.naturalWidth || source.width;
    const sourceHeight = source.naturalHeight || source.height;
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = 0.299 * pixels.data[index] + 0.587 * pixels.data[index + 1] + 0.114 * pixels.data[index + 2];
      const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.3 + 136));
      pixels.data[index] = contrasted;
      pixels.data[index + 1] = contrasted;
      pixels.data[index + 2] = contrasted;
    }
    context.putImageData(pixels, 0, 0);
    return canvas;
  } finally {
    release();
  }
}

function setOcrProgress(progress = 0) {
  const percentage = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  els.ocrProgress.style.width = `${percentage}%`;
}

function setOcrBusy(isBusy) {
  els.ocrImageFile.disabled = isBusy;
  els.ocrNone.disabled = isBusy;
  els.ocrManual.disabled = isBusy;
  els.ocrRetake.disabled = isBusy;
  const closeButton = els.ocrDialog.querySelector(".close-dialog");
  if (closeButton) closeButton.disabled = isBusy;
}

function ocrLogger(message) {
  const statusNames = {
    "loading tesseract core": "文字認識を準備しています",
    "initializing tesseract": "文字認識を準備しています",
    "loading language traineddata": "日本語データを読み込んでいます",
    "initializing api": "日本語の読み取りを準備しています",
    "recognizing text": "ラベルの文字を読み取っています",
  };
  if (statusNames[message.status]) els.ocrStatus.textContent = `${statusNames[message.status]}…`;
  if (Number.isFinite(message.progress)) setOcrProgress(message.progress);
}

async function recognizeLabelWith(language, canvas) {
  if (!window.Tesseract?.createWorker) throw new Error("文字認識機能を読み込めませんでした。通信状態を確認して再読み込みしてください。");
  const options = {
    workerPath: new URL("vendor/tesseract/worker.min.js", document.baseURI).href,
    corePath: new URL("vendor/tesseract/core", document.baseURI).href,
    langPath: new URL("vendor/tesseract/lang", document.baseURI).href,
    logger: ocrLogger,
  };
  const worker = await window.Tesseract.createWorker(language, 1, options);
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const result = await worker.recognize(canvas);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

function clearOcrPreview() {
  if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
  ocrPreviewUrl = "";
  els.ocrPreview.removeAttribute("src");
  els.ocrPreview.hidden = true;
}

function resetOcrResult({ keepPreview = false } = {}) {
  if (!keepPreview) clearOcrPreview();
  els.ocrCandidates.replaceChildren();
  els.ocrText.textContent = "";
  els.ocrTextDetails.hidden = true;
  els.ocrSaveLabelRow.hidden = true;
  els.ocrSaveLabel.checked = false;
  els.ocrProgressWrap.hidden = true;
  setOcrProgress(0);
}

function openOcrDialog(target) {
  ocrTarget = target;
  ocrSourceFile = null;
  els.ocrImageFile.value = "";
  resetOcrResult();
  els.ocrStatus.textContent = "写真を撮影してください。";
  els.ocrStatus.classList.remove("is-error");
  if (els.formDialog.open) els.formDialog.close();
  if (els.quickVisitDialog.open) els.quickVisitDialog.close();
  els.ocrDialog.showModal();
}

function selectBrandInCurrentForm(brand, forceManual = false) {
  const existingOption = [...els.nameSelect.options].some((option) => option.value === brand);
  if (!forceManual && existingOption) {
    els.nameSelect.value = brand;
  } else {
    els.nameSelect.value = "__new__";
    els.newName.value = forceManual ? "" : brand;
  }
  setInputMode(els.nameSelect, els.newName);
  updatePreviousKeepInfo();
}

function returnFromOcr({ brand = "", manual = false } = {}) {
  const target = ocrTarget;
  if (els.ocrDialog.open) els.ocrDialog.close();
  if (target?.type === "quick" && !brand && !manual) {
    clearOcrPreview();
    ocrSourceFile = null;
    ocrTarget = null;
    openQuickVisit(target.store);
    return;
  }
  if (target?.type === "quick") {
    prepareCurrentForm(target.store);
  }
  if (target?.type === "form" || target?.type === "quick") {
    if (brand || manual) selectBrandInCurrentForm(brand, manual);
    els.formDialog.showModal();
  }
  clearOcrPreview();
  ocrSourceFile = null;
  ocrTarget = null;
}

async function chooseOcrCandidate(brand) {
  if (ocrRunning) return;
  if (els.ocrSaveLabel.checked && ocrSourceFile) {
    try {
      els.ocrStatus.textContent = "ラベル画像を保存しています…";
      labelImages[brand] = await resizeLabelImage(ocrSourceFile);
      queueLabelSync(brand);
      saveLabelImages();
      render();
    } catch (error) {
      window.alert(error.message || "ラベル画像を保存できませんでした。");
      return;
    }
  }
  returnFromOcr({ brand });
}

function renderOcrCandidates(candidates) {
  els.ocrCandidates.replaceChildren();
  if (candidates.length === 0) {
    const message = document.createElement("p");
    message.className = "ocr-no-candidate";
    message.textContent = "登録済み銘柄に近い候補を見つけられませんでした。撮り直すか、手入力してください。";
    els.ocrCandidates.append(message);
    els.ocrSaveLabelRow.hidden = true;
    return;
  }
  const heading = document.createElement("strong");
  heading.className = "ocr-candidate-title";
  heading.textContent = "銘柄候補（選んで確定）";
  els.ocrCandidates.append(heading);
  candidates.forEach(({ brand }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ocr-candidate-button";
    button.textContent = brand;
    button.addEventListener("click", () => chooseOcrCandidate(brand));
    els.ocrCandidates.append(button);
  });
  els.ocrSaveLabelRow.hidden = false;
}

async function readLabelImage(file) {
  if (ocrRunning || !file) return;
  ocrRunning = true;
  setOcrBusy(true);
  ocrSourceFile = file;
  resetOcrResult();
  clearOcrPreview();
  ocrPreviewUrl = URL.createObjectURL(file);
  els.ocrPreview.src = ocrPreviewUrl;
  els.ocrPreview.hidden = false;
  els.ocrProgressWrap.hidden = false;
  els.ocrStatus.textContent = "写真を準備しています…";
  els.ocrStatus.classList.remove("is-error");
  try {
    const canvas = await preprocessLabelImage(file);
    let recognizedText = await recognizeLabelWith("jpn", canvas);
    let candidates = findBrandCandidates(recognizedText);
    if (normalizeOcrText(recognizedText).length < 3 || (candidates[0]?.score || 0) < 0.38) {
      els.ocrStatus.textContent = "縦書きの文字も確認しています…";
      setOcrProgress(0);
      const verticalText = await recognizeLabelWith("jpn_vert", canvas);
      recognizedText = `${recognizedText}\n${verticalText}`.trim();
      candidates = findBrandCandidates(recognizedText);
    }
    els.ocrText.textContent = recognizedText.trim() || "文字を読み取れませんでした。";
    els.ocrTextDetails.hidden = false;
    renderOcrCandidates(candidates);
    els.ocrStatus.textContent = candidates.length
      ? "候補を確認して、銘柄を1つ選んでください。"
      : "銘柄候補を見つけられませんでした。";
    setOcrProgress(1);
  } catch (error) {
    els.ocrStatus.textContent = error.message || "ラベルを読み取れませんでした。もう一度お試しください。";
    els.ocrStatus.classList.add("is-error");
  } finally {
    ocrRunning = false;
    setOcrBusy(false);
    els.ocrProgressWrap.hidden = true;
    if (!els.ocrDialog.open) {
      clearOcrPreview();
      ocrSourceFile = null;
      ocrTarget = null;
    }
  }
}

function setInputMode(select, newInput) {
  const isNewValue = select.value === "__new__";
  newInput.hidden = !isNewValue;
  newInput.required = isNewValue;
  if (!isNewValue) newInput.value = "";
  if (isNewValue) requestAnimationFrame(() => newInput.focus());
}

function selectionValue(formData, selectName, newName) {
  const selected = formData.get(selectName);
  return selected === "__new__" ? formData.get(newName).trim() : selected;
}

async function chooseNearbyStore() {
  const registeredStores = new Set(bottles.map((bottle) => bottle.store));
  const candidates = Object.entries(storeLocations)
    .filter(([store, location]) => registeredStores.has(store) && location?.latitude != null && location?.longitude != null);
  if (candidates.length === 0) {
    setLocationStatus(
      els.nearbyStoreStatus,
      "位置登録済みの店舗がありません。店名を押して履歴画面から現在地を登録してください。",
      true,
    );
    return;
  }

  els.findNearbyStore.disabled = true;
  setLocationStatus(els.nearbyStoreStatus, "現在地を確認しています…");
  try {
    const position = await requestCurrentPosition();
    const nearest = candidates
      .map(([store, location]) => ({ store, distance: distanceInMeters(position, location) }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest.distance > 1000) {
      setLocationStatus(
        els.nearbyStoreStatus,
        `1km以内に登録済み店舗がありません。最寄りは「${nearest.store}」（${formatDistance(nearest.distance)}）です。`,
        true,
      );
      return;
    }

    els.storeSelect.value = nearest.store;
    setInputMode(els.storeSelect, els.newStore);
    renderBrandOptionsFor(els.nameSelect, nearest.store);
    updatePreviousKeepInfo();
    setLocationStatus(
      els.nearbyStoreStatus,
      `「${nearest.store}」を選びました（現在地から約${formatDistance(nearest.distance)}）。`,
    );
  } catch (error) {
    setLocationStatus(els.nearbyStoreStatus, error.message, true);
  } finally {
    els.findNearbyStore.disabled = false;
  }
}

async function changeHomeSort() {
  const requestedSort = els.sort.value;
  if (requestedSort !== "nearby") {
    previousSortValue = requestedSort;
    nearbyStoreDistances = null;
    render();
    return;
  }

  const stores = new Set(bottles.map((bottle) => bottle.store));
  const candidates = Object.entries(storeLocations)
    .filter(([store, location]) => stores.has(store) && location?.latitude != null && location?.longitude != null);
  if (candidates.length === 0) {
    els.sort.value = previousSortValue;
    render();
    window.alert("位置登録済みの店舗がありません。店名を押して、店舗の現在地を登録してください。");
    return;
  }

  els.sort.disabled = true;
  try {
    const position = await requestCurrentPosition();
    nearbyStoreDistances = new Map(
      candidates.map(([store, location]) => [store, distanceInMeters(position, location)]),
    );
    previousSortValue = requestedSort;
    render();
  } catch (error) {
    nearbyStoreDistances = null;
    els.sort.value = previousSortValue;
    render();
    window.alert(error.message);
  } finally {
    els.sort.disabled = false;
  }
}

async function registerHistoryStoreLocation() {
  const store = els.historyStore.textContent.trim();
  if (!store) return;
  els.saveStoreLocation.disabled = true;
  setLocationStatus(els.historyLocationStatus, "現在地を確認しています…");
  try {
    const position = await requestCurrentPosition();
    storeLocations[store] = {
      latitude: position.latitude,
      longitude: position.longitude,
      updatedAt: new Date().toISOString(),
    };
    saveStoreLocations();
    setLocationStatus(
      els.historyLocationStatus,
      `現在地を登録しました（位置精度 約${formatDistance(position.accuracy)}）。`,
    );
  } catch (error) {
    setLocationStatus(els.historyLocationStatus, error.message, true);
  } finally {
    els.saveStoreLocation.disabled = false;
  }
}

function prepareCurrentForm(preselectedStore = "") {
  els.form.reset();
  renderStoreOptions();
  renderBrandOptions();
  if (preselectedStore && [...els.storeSelect.options].some((option) => option.value === preselectedStore)) {
    els.storeSelect.value = preselectedStore;
    renderBrandOptionsFor(els.nameSelect, preselectedStore);
  }
  setInputMode(els.storeSelect, els.newStore);
  setInputMode(els.nameSelect, els.newName);
  els.form.elements.remaining.value = 100;
  const today = dateToInput();
  els.form.elements.startedAt.value = today;
  els.form.elements.lastVisitedAt.value = today;
  updatePreviousKeepInfo();
  setLocationStatus(els.nearbyStoreStatus, "店舗の場所を一度登録すると使えます。");
}

function preparePastForm() {
  els.pastForm.reset();
  renderStoreOptions();
  renderBrandOptions();
  setInputMode(els.pastStoreSelect, els.pastNewStore);
  setInputMode(els.pastNameSelect, els.pastNewName);
  els.pastForm.elements.pastStartedAt.value = dateToInput();
}

els.add.addEventListener("click", () => els.addMenuDialog.showModal());
els.accountButton.addEventListener("click", () => {
  renderCloudMigrationState();
  renderCloudSyncState();
  setAuthMessage(authSession
    ? (isCloudSyncEnabled() ? "Supabaseとの自動保存を利用しています。" : "Supabaseとの接続を確認済みです。")
    : "ログインしても、現在の端末内データはまだ変更されません。");
  els.authDialog.showModal();
});
els.authForm.addEventListener("submit", sendMagicLink);
els.authSignOut.addEventListener("click", signOutFromSupabase);
els.cloudMigrationButton.addEventListener("click", migrateLocalDataToSupabase);
els.cloudRestoreButton.addEventListener("click", () => restoreFromSupabase());
els.cloudUpdateButton.addEventListener("click", () => {
  if (cloudUpdateMode === "applied") {
    dismissAppliedCloudChanges();
    return;
  }
  restoreFromSupabase({
    snapshot: pendingCloudSnapshot,
    requireConfirmation: true,
    skipOutgoingSync: true,
    changeMessages: cloudUpdateMessages,
  });
});
els.openCurrentAdd.addEventListener("click", () => {
  els.addMenuDialog.close();
  prepareCurrentForm();
  els.formDialog.showModal();
});
els.openPastAdd.addEventListener("click", () => {
  els.addMenuDialog.close();
  preparePastForm();
  els.pastFormDialog.showModal();
});
els.openLabelManager.addEventListener("click", () => {
  els.addMenuDialog.close();
  els.labelManagerForm.reset();
  renderLabelOptions();
  els.labelManagerDialog.showModal();
});
els.openDataManager.addEventListener("click", () => {
  els.addMenuDialog.close();
  els.backupRestoreFile.value = "";
  setBackupStatus("復元するときは、先に現在のデータをバックアップしておくと安心です。");
  els.dataManagerDialog.showModal();
});
els.backupDownload.addEventListener("click", downloadBackup);
els.backupRestoreFile.addEventListener("change", async () => {
  const [file] = els.backupRestoreFile.files;
  await restoreBackup(file);
  els.backupRestoreFile.value = "";
});
els.findNearbyStores.addEventListener("click", () => findNearbyStoresForHome());
els.findNearbyStore.addEventListener("click", chooseNearbyStore);
els.scanLabelFromForm.addEventListener("click", () => openOcrDialog({ type: "form" }));
els.saveStoreLocation.addEventListener("click", registerHistoryStoreLocation);
els.calendarPrev.addEventListener("click", () => moveCalendarMonth(-1));
els.calendarNext.addEventListener("click", () => moveCalendarMonth(1));
els.storeVisitToday.addEventListener("click", () => {
  const store = els.historyStore.textContent.trim();
  if (!store) return;
  if (!recordStoreVisit(store, dateToInput())) {
    window.alert("本日の来店はすでに登録されています。");
    return;
  }
  render();
  calendarMonth = monthStartFromDate(dateToInput());
  renderStoreVisitCalendar(store);
});
els.quickVisitToday.addEventListener("click", () => {
  if (!currentQuickStore) return;
  const added = recordStoreVisit(currentQuickStore, dateToInput());
  els.quickVisitStatus.textContent = added
    ? "本日を来店日に記録しました。"
    : "本日の来店はすでに登録されています。";
  render();
  renderQuickVisit(currentQuickStore);
});
els.quickScanLabel.addEventListener("click", () => {
  if (currentQuickStore) openOcrDialog({ type: "quick", store: currentQuickStore });
});
els.quickOpenHistory.addEventListener("click", () => {
  const store = currentQuickStore;
  if (!store) return;
  els.quickVisitDialog.close();
  openStoreHistory(store);
});
els.ocrImageFile.addEventListener("change", () => {
  const [file] = els.ocrImageFile.files;
  readLabelImage(file);
});
els.ocrNone.addEventListener("click", () => returnFromOcr());
els.ocrManual.addEventListener("click", () => returnFromOcr({ manual: true }));
els.ocrRetake.addEventListener("click", () => {
  if (ocrRunning) return;
  ocrSourceFile = null;
  els.ocrImageFile.value = "";
  resetOcrResult();
  els.ocrStatus.textContent = "新しい写真を撮影してください。";
  els.ocrImageFile.click();
});

els.storeSelect.addEventListener("change", () => {
  setInputMode(els.storeSelect, els.newStore);
  renderBrandOptionsFor(els.nameSelect, selectedStore(els.storeSelect, els.newStore));
  updatePreviousKeepInfo();
});
els.nameSelect.addEventListener("change", () => {
  setInputMode(els.nameSelect, els.newName);
  updatePreviousKeepInfo();
});
els.newStore.addEventListener("input", () => {
  renderBrandOptionsFor(els.nameSelect, selectedStore(els.storeSelect, els.newStore));
  updatePreviousKeepInfo();
});
els.newName.addEventListener("input", updatePreviousKeepInfo);
els.pastStoreSelect.addEventListener("change", () => {
  setInputMode(els.pastStoreSelect, els.pastNewStore);
  renderBrandOptionsFor(els.pastNameSelect, selectedStore(els.pastStoreSelect, els.pastNewStore));
});
els.pastNameSelect.addEventListener("change", () => setInputMode(els.pastNameSelect, els.pastNewName));
els.pastNewStore.addEventListener("input", () => {
  renderBrandOptionsFor(els.pastNameSelect, selectedStore(els.pastStoreSelect, els.pastNewStore));
});
els.historyEditStoreSelect.addEventListener("change", () => {
  setInputMode(els.historyEditStoreSelect, els.historyEditNewStore);
  renderBrandOptionsFor(
    els.historyEditNameSelect,
    selectedStore(els.historyEditStoreSelect, els.historyEditNewStore),
    editingHistoryId,
  );
});
els.historyEditNameSelect.addEventListener("change", () => setInputMode(els.historyEditNameSelect, els.historyEditNewName));
els.historyEditNewStore.addEventListener("input", () => {
  renderBrandOptionsFor(
    els.historyEditNameSelect,
    selectedStore(els.historyEditStoreSelect, els.historyEditNewStore),
    editingHistoryId,
  );
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.form.reportValidity()) return;
  const formData = new FormData(els.form);
  const store = selectionValue(formData, "storeSelect", "storeNew");
  const name = selectionValue(formData, "nameSelect", "nameNew");
  if (!store || !name) return;
  bottles.push({
    id: crypto.randomUUID(),
    store,
    name,
    volume: 900,
    remaining: Math.min(100, Math.max(0, Number(formData.get("remaining")))),
    startedAt: formData.get("startedAt"),
    lastVisitedAt: formData.get("lastVisitedAt"),
    notes: formData.get("notes").trim(),
  });
  renumberKeeps();
  recordStoreVisit(store, formData.get("lastVisitedAt"));
  saveBottles();
  render();
  els.formDialog.close();
});

els.pastForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.pastForm.reportValidity()) return;
  const formData = new FormData(els.pastForm);
  const store = selectionValue(formData, "pastStoreSelect", "pastStoreNew");
  const name = selectionValue(formData, "pastNameSelect", "pastNameNew");
  const startedAt = formData.get("pastStartedAt");
  if (!store || !name || !startedAt) return;
  bottles.push({
    id: crypto.randomUUID(),
    store,
    name,
    volume: 900,
    remaining: 0,
    startedAt,
    lastVisitedAt: startedAt,
    notes: "",
  });
  renumberKeeps();
  recordStoreVisit(store, startedAt);
  saveBottles();
  render();
  els.pastFormDialog.close();
});

els.labelManagerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!els.labelManagerForm.reportValidity()) return;
  const brand = new FormData(els.labelManagerForm).get("labelBrand");
  const file = els.labelImageFile.files[0];
  if (!brand || !file) return;
  try {
    labelImages[brand] = await resizeLabelImage(file);
    queueLabelSync(brand);
    saveLabelImages();
    render();
    els.labelManagerDialog.close();
  } catch (error) {
    window.alert(error.message || "ラベル画像を保存できませんでした。");
  }
});

els.visitEditDelete.addEventListener("click", () => {
  if (editingVisitId) deleteStoreVisit(editingVisitId);
});

els.visitEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.visitEditForm.reportValidity() || !editingVisitId) return;
  const visit = storeVisits.find((item) => item.id === editingVisitId);
  if (!visit) return;
  const visitedAt = new FormData(els.visitEditForm).get("visitEditDate");
  const duplicate = storeVisits.some((item) => (
    item.id !== editingVisitId && item.store === visit.store && item.visitedAt === visitedAt
  ));
  if (duplicate) {
    window.alert("同じ日の来店履歴はすでに登録されています。");
    return;
  }
  queueVisitDelete(visit.store, visit.visitedAt);
  cancelPendingVisitDelete(visit.store, visitedAt);
  storeVisits = storeVisits.map((item) => (
    item.id === editingVisitId ? { ...item, visitedAt } : item
  ));
  syncStoreLastVisited(visit.store);
  saveStoreVisits();
  saveBottles();
  render();
  els.visitEditDialog.close();
  openStoreHistory(visit.store);
});

els.historyEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.historyEditForm.reportValidity() || !editingHistoryId) return;
  const formData = new FormData(els.historyEditForm);
  const store = selectionValue(formData, "historyEditStoreSelect", "historyEditStoreNew");
  const name = selectionValue(formData, "historyEditNameSelect", "historyEditNameNew");
  const startedAt = formData.get("historyEditStartedAt");
  if (!store || !name || !startedAt) return;
  bottles = bottles.map((bottle) => bottle.id === editingHistoryId
    ? { ...bottle, store, name, startedAt }
    : bottle);
  renumberKeeps();
  saveBottles();
  render();
  els.historyEditDialog.close();
  openStoreHistory(store);
});

els.sort.addEventListener("change", changeHomeSort);
els.range.addEventListener("input", (event) => updateDetailRemaining(event.target.value));
els.decrease.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) - 10));
els.increase.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) + 10));
els.finishRenew.addEventListener("click", finishAndOpenNextBottleForm);
els.delete.addEventListener("click", () => {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle || !window.confirm(`「${bottle.name}」を削除しますか？`)) return;
  removePendingRemainingChange(bottle.id);
  bottles = bottles.filter((item) => item.id !== selectedId);
  renumberKeeps();
  saveBottles();
  render();
  els.detailDialog.close();
});
document.querySelectorAll(".close-dialog").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
els.ocrDialog.addEventListener("close", () => {
  if (!ocrRunning) {
    clearOcrPreview();
    ocrSourceFile = null;
    ocrTarget = null;
  }
});
els.ocrDialog.addEventListener("cancel", (event) => {
  if (!ocrRunning) return;
  event.preventDefault();
  els.ocrStatus.textContent = "文字を読み取っています。完了までお待ちください。";
});

render();
initializeSupabaseAuth();
tryAutomaticNearbyStores();
window.addEventListener("online", () => scheduleCloudSync(0));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") scheduleCloudSync(0);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js");
      await registration.update();
    } catch {
      // オフライン時は既存のキャッシュをそのまま利用する。
    }
  });
}
