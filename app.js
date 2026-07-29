const STORAGE_KEY = "shochu-keep-ledger-v1";
const LABELS_KEY = "shochu-keep-ledger-label-images-v1";
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
  openHistoryPicker: document.querySelector("#open-history-picker"),
  add: document.querySelector("#add-button"),
  addMenuDialog: document.querySelector("#add-menu-dialog"),
  openCurrentAdd: document.querySelector("#open-current-add"),
  openPastAdd: document.querySelector("#open-past-add"),
  openLabelManager: document.querySelector("#open-label-manager"),
  form: document.querySelector("#bottle-form"),
  formDialog: document.querySelector("#bottle-dialog"),
  storeSelect: document.querySelector("#store-select"),
  newStore: document.querySelector("#store-new"),
  nameSelect: document.querySelector("#name-select"),
  newName: document.querySelector("#name-new"),
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
  visitToday: document.querySelector("#visit-today-button"),
  delete: document.querySelector("#delete-button"),
  historyDialog: document.querySelector("#store-history-dialog"),
  historyStore: document.querySelector("#history-store"),
  historyList: document.querySelector("#history-list"),
  historyPickerDialog: document.querySelector("#history-store-picker-dialog"),
  historyPickerForm: document.querySelector("#history-store-picker-form"),
  historyPicker: document.querySelector("#history-store-picker"),
  historyEditDialog: document.querySelector("#history-edit-dialog"),
  historyEditForm: document.querySelector("#history-edit-form"),
  historyEditStoreSelect: document.querySelector("#history-edit-store-select"),
  historyEditNewStore: document.querySelector("#history-edit-store-new"),
  historyEditNameSelect: document.querySelector("#history-edit-name-select"),
  historyEditNewName: document.querySelector("#history-edit-name-new"),
};

let bottles = normalizeBottles(loadBottles());
let labelImages = loadLabelImages();
let selectedId = null;
let editingHistoryId = null;
renumberKeeps();

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
  const days = getDaysSince(bottle.lastVisitedAt);
  return days === 0 ? "今日来店" : `前回の来店から ${days}日`;
}

function isActive(bottle) {
  return bottle.remaining > 0;
}

function sortedBottles() {
  const sort = els.sort.value;
  return [...bottles].sort((a, b) => {
    if (sort === "remaining") return a.remaining - b.remaining;
    if (sort === "newest") return new Date(b.startedAt) - new Date(a.startedAt);
    return new Date(a.lastVisitedAt) - new Date(b.lastVisitedAt);
  });
}

function render() {
  const activeBottles = sortedBottles().filter(isActive);
  els.activeCount.textContent = activeBottles.length;
  els.list.replaceChildren();
  els.empty.hidden = activeBottles.length > 0;

  const groupedBottles = activeBottles.reduce((groups, bottle) => {
    (groups[bottle.store] ||= []).push(bottle);
    return groups;
  }, {});

  Object.keys(groupedBottles).sort((a, b) => a.localeCompare(b, "ja")).forEach((store) => {
    const group = document.createElement("section");
    group.className = "store-group";
    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "store-group-heading";
    heading.textContent = store;
    heading.addEventListener("click", () => openStoreHistory(store));
    const groupList = document.createElement("div");
    groupList.className = "store-group-list";
    group.append(heading, groupList);

    groupedBottles[store].forEach((bottle) => {
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

    els.list.append(group);
  });
}

function openStoreHistory(store) {
  const history = bottles
    .filter((bottle) => bottle.store === store)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  els.historyStore.textContent = store;
  els.historyList.replaceChildren();

  history.forEach((bottle, index) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.classList.toggle("is-finished", bottle.remaining === 0);
    const information = document.createElement("div");
    const serial = document.createElement("span");
    serial.className = "history-serial";
    serial.textContent = `No. ${index + 1}`;
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

function openHistoryPicker() {
  const stores = [...new Set(bottles.map((bottle) => bottle.store.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  els.historyPicker.replaceChildren(new Option("店名を選択してください", ""));
  els.historyPicker.options[0].disabled = true;
  stores.forEach((store) => els.historyPicker.add(new Option(store, store)));
  els.historyPickerDialog.showModal();
}

function openHistoryEdit(id) {
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle) return;
  editingHistoryId = id;
  els.historyDialog.close();
  els.historyEditForm.reset();
  renderStoreOptions();
  renderBrandOptions();
  els.historyEditStoreSelect.value = bottle.store;
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
  els.detailLastVisited.textContent = formatDate(bottle.lastVisitedAt);
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
    bottles = bottles.map((bottle) => bottle.id === selectedId ? { ...bottle, remaining: amount } : bottle);
    saveBottles();
    render();
  }
}

function renderOptions(select, values, placeholder, newLabel) {
  select.replaceChildren(new Option(placeholder, ""));
  select.options[0].disabled = true;
  values.forEach((value) => select.add(new Option(value, value)));
  select.add(new Option(newLabel, "__new__"));
}

function renderStoreOptions() {
  const stores = [...new Set(bottles.map((bottle) => bottle.store.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  renderOptions(els.storeSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
  renderOptions(els.pastStoreSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
  renderOptions(els.historyEditStoreSelect, stores, "店名を選択してください", "＋ 新しい店名を入力");
}

function renderBrandOptions() {
  const brands = [...new Set(bottles.map((bottle) => bottle.name.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  renderOptions(els.nameSelect, brands, "銘柄を選択してください", "＋ 新しい銘柄を入力");
  renderOptions(els.pastNameSelect, brands, "銘柄を選択してください", "＋ 新しい銘柄を入力");
  renderOptions(els.historyEditNameSelect, brands, "銘柄を選択してください", "＋ 新しい銘柄を入力");
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

function prepareCurrentForm() {
  els.form.reset();
  renderStoreOptions();
  renderBrandOptions();
  setInputMode(els.storeSelect, els.newStore);
  setInputMode(els.nameSelect, els.newName);
  els.form.elements.remaining.value = 100;
  const today = dateToInput();
  els.form.elements.startedAt.value = today;
  els.form.elements.lastVisitedAt.value = today;
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
els.openHistoryPicker.addEventListener("click", openHistoryPicker);
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

els.storeSelect.addEventListener("change", () => setInputMode(els.storeSelect, els.newStore));
els.nameSelect.addEventListener("change", () => setInputMode(els.nameSelect, els.newName));
els.pastStoreSelect.addEventListener("change", () => setInputMode(els.pastStoreSelect, els.pastNewStore));
els.pastNameSelect.addEventListener("change", () => setInputMode(els.pastNameSelect, els.pastNewName));
els.historyEditStoreSelect.addEventListener("change", () => setInputMode(els.historyEditStoreSelect, els.historyEditNewStore));
els.historyEditNameSelect.addEventListener("change", () => setInputMode(els.historyEditNameSelect, els.historyEditNewName));

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

els.historyPickerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.historyPickerForm.reportValidity()) return;
  const store = new FormData(els.historyPickerForm).get("historyStore");
  if (!store) return;
  els.historyPickerDialog.close();
  openStoreHistory(store);
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
els.visitToday.addEventListener("click", () => {
  const lastVisitedAt = dateToInput();
  bottles = bottles.map((bottle) => bottle.id === selectedId ? { ...bottle, lastVisitedAt } : bottle);
  saveBottles();
  const bottle = bottles.find((item) => item.id === selectedId);
  els.detailLastVisited.textContent = formatDate(bottle.lastVisitedAt);
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
