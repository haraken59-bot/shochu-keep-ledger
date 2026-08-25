const STORAGE_KEY = "shochu-keep-ledger-v1";
const LABELS_KEY = "shochu-keep-ledger-label-images-v1";
const STORE_LOCATIONS_KEY = "shochu-keep-ledger-store-locations-v1";
const STORE_VISITS_KEY = "shochu-keep-ledger-store-visits-v1";
const KEEP_VISITS_MIGRATION_KEY = "shochu-keep-ledger-keep-visits-migration-v1";
const DAY = 24 * 60 * 60 * 1000;

const demoBottles = [
  { id: "demo-1", store: "やきとり日高", name: "黒霧島", volume: 900, remaining: 70, startedAt: "2026-07-05", lastVisitedAt: "2026-07-24", notes: "水代 220円" },
  { id: "demo-2", store: "しょうふく", name: "二階堂", volume: 900, remaining: 90, startedAt: "2026-07-12", lastVisitedAt: "2026-07-28", notes: "" },
  { id: "demo-3", store: "酒処 まる", name: "いいちこ", volume: 900, remaining: 20, startedAt: "2026-05-01", lastVisitedAt: "2026-07-18", notes: "次回、キープ更新を確認" },
  { id: "demo-4", store: "大衆酒場 つばき", name: "黒霧島", volume: 900, remaining: 45, startedAt: "2026-07-20", lastVisitedAt: "2026-07-26", notes: "" },
];

const els = {
  activeCount: document.querySelector("#active-count"),
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
  visitToday: document.querySelector("#visit-today-button"),
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
};

let bottles = normalizeBottles(loadBottles());
let labelImages = loadLabelImages();
let storeLocations = loadStoreLocations();
let storeVisits = loadStoreVisits();
let selectedId = null;
let editingHistoryId = null;
let editingVisitId = null;
let calendarMonth = null;
renumberKeeps();
migrateKeepDatesToStoreVisits();
saveStoreVisits();

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
}

function loadStoreLocations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_LOCATIONS_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveStoreLocations() {
  localStorage.setItem(STORE_LOCATIONS_KEY, JSON.stringify(storeLocations));
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
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);
      if (!store || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
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

    bottles = restored.bottles;
    labelImages = restored.labelImages;
    storeLocations = restored.storeLocations;
    storeVisits = restored.storeVisits;
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
    heading.addEventListener("click", () => openStoreHistory(store));
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

function updateDetailRemaining(value, persist = true) {
  const amount = Math.min(100, Math.max(0, Number(value)));
  els.range.value = amount;
  els.detailRemaining.textContent = `${amount}%`;
  els.detailProgress.style.width = `${amount}%`;
  if (persist && selectedId) {
    const selectedBottle = bottles.find((bottle) => bottle.id === selectedId);
    if (!selectedBottle || Number(selectedBottle.remaining) === amount) return;
    bottles = bottles.map((bottle) => bottle.id === selectedId ? { ...bottle, remaining: amount } : bottle);
    recordStoreVisit(selectedBottle.store, dateToInput());
    saveBottles();
    const updatedBottle = bottles.find((bottle) => bottle.id === selectedId);
    els.detailLastVisited.textContent = formatDate(latestStoreVisitDate(selectedBottle.store));
    els.detailDays.textContent = visitText(updatedBottle);
    render();
  }
}

function finishAndOpenNextBottleForm() {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle) return;
  if (!window.confirm(`「${bottle.name}」を飲み切りにして、次のボトル入力へ進みますか？`)) return;

  const today = dateToInput();
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
els.findNearbyStore.addEventListener("click", chooseNearbyStore);
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

els.sort.addEventListener("change", render);
els.range.addEventListener("input", (event) => updateDetailRemaining(event.target.value));
els.decrease.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) - 10));
els.increase.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) + 10));
els.finishRenew.addEventListener("click", finishAndOpenNextBottleForm);
els.visitToday.addEventListener("click", () => {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle) return;
  recordStoreVisit(bottle.store, dateToInput());
  const lastVisitedAt = latestStoreVisitDate(bottle.store);
  els.detailLastVisited.textContent = formatDate(lastVisitedAt);
  els.detailDays.textContent = visitText(bottle);
  render();
});
els.delete.addEventListener("click", () => {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle || !window.confirm(`「${bottle.name}」を削除しますか？`)) return;
  bottles = bottles.filter((item) => item.id !== selectedId);
  renumberKeeps();
  saveBottles();
  render();
  els.detailDialog.close();
});
document.querySelectorAll(".close-dialog").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}
