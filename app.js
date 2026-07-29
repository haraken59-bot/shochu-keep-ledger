const STORAGE_KEY = "shochu-keep-ledger-v1";
const DAY = 24 * 60 * 60 * 1000;

const demoBottles = [
  { id: "demo-1", store: "やきとり日高", name: "黒霧島", volume: 900, remaining: 70, startedAt: "2026-07-05", expiresAt: "2026-10-05", notes: "水代 220円" },
  { id: "demo-2", store: "しょうふく", name: "二階堂", volume: 900, remaining: 90, startedAt: "2026-07-12", expiresAt: "2026-10-12", notes: "" },
  { id: "demo-3", store: "酒処 まる", name: "いいちこ", volume: 900, remaining: 20, startedAt: "2026-05-01", expiresAt: "2026-08-10", notes: "次回、キープ更新を確認" },
];

const els = {
  activeCount: document.querySelector("#active-count"),
  expiringCount: document.querySelector("#expiring-count"),
  list: document.querySelector("#bottle-list"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#bottle-card-template"),
  sort: document.querySelector("#sort-select"),
  add: document.querySelector("#add-button"),
  form: document.querySelector("#bottle-form"),
  formDialog: document.querySelector("#bottle-dialog"),
  detailDialog: document.querySelector("#detail-dialog"),
  detailStore: document.querySelector("#detail-store"),
  detailName: document.querySelector("#detail-name"),
  detailVolume: document.querySelector("#detail-volume"),
  detailRemaining: document.querySelector("#detail-remaining"),
  detailProgress: document.querySelector("#detail-progress"),
  range: document.querySelector("#remaining-range"),
  decrease: document.querySelector("#decrease-button"),
  increase: document.querySelector("#increase-button"),
  detailStarted: document.querySelector("#detail-started"),
  detailExpires: document.querySelector("#detail-expires"),
  detailDays: document.querySelector("#detail-days"),
  detailNotes: document.querySelector("#detail-notes"),
  detailNotesRow: document.querySelector("#detail-notes-row"),
  delete: document.querySelector("#delete-button"),
};

let bottles = loadBottles();
let selectedId = null;

function loadBottles() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : demoBottles;
  } catch {
    return demoBottles;
  }
}

function saveBottles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
}

function getDaysUntil(dateText) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateText}T00:00:00`);
  return Math.round((target - today) / DAY);
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${dateText}T00:00:00`));
}

function expiryText(bottle) {
  const days = getDaysUntil(bottle.expiresAt);
  if (days < 0) return `期限切れ（${Math.abs(days)}日超過）`;
  if (days === 0) return "期限は今日です";
  return `期限まであと ${days}日`;
}

function isActive(bottle) {
  return bottle.remaining > 0 && getDaysUntil(bottle.expiresAt) >= 0;
}

function sortedBottles() {
  const sort = els.sort.value;
  return [...bottles].sort((a, b) => {
    if (sort === "remaining") return a.remaining - b.remaining;
    if (sort === "newest") return new Date(b.startedAt) - new Date(a.startedAt);
    return new Date(a.expiresAt) - new Date(b.expiresAt);
  });
}

function render() {
  const active = bottles.filter(isActive);
  const expiring = active.filter((bottle) => getDaysUntil(bottle.expiresAt) <= 30);
  els.activeCount.textContent = active.length;
  els.expiringCount.textContent = expiring.length;
  els.list.replaceChildren();
  els.empty.hidden = bottles.length > 0;

  sortedBottles().forEach((bottle) => {
    const fragment = els.template.content.cloneNode(true);
    const card = fragment.querySelector(".bottle-card");
    const button = fragment.querySelector(".card-button");
    const days = getDaysUntil(bottle.expiresAt);
    fragment.querySelector(".store-name").textContent = bottle.store;
    fragment.querySelector(".bottle-name").textContent = bottle.name;
    const expiry = fragment.querySelector(".expiry-label");
    expiry.textContent = expiryText(bottle);
    expiry.classList.toggle("urgent", days <= 30);
    fragment.querySelector(".card-amount strong").textContent = `${bottle.remaining}%`;
    fragment.querySelector(".card-progress span").style.width = `${bottle.remaining}%`;
    button.addEventListener("click", () => openDetail(bottle.id));
    card.dataset.id = bottle.id;
    els.list.append(fragment);
  });
}

function openDetail(id) {
  selectedId = id;
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle) return;
  els.detailStore.textContent = bottle.store;
  els.detailName.textContent = bottle.name;
  els.detailVolume.textContent = `${bottle.volume}ml`;
  els.detailStarted.textContent = formatDate(bottle.startedAt);
  els.detailExpires.textContent = formatDate(bottle.expiresAt);
  els.detailDays.textContent = expiryText(bottle);
  els.detailNotes.textContent = bottle.notes || "登録なし";
  els.detailNotesRow.hidden = false;
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

function setDefaultDates() {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  const toInput = (date) => date.toISOString().slice(0, 10);
  els.form.elements.startedAt.value = toInput(now);
  els.form.elements.expiresAt.value = toInput(end);
}

els.add.addEventListener("click", () => {
  els.form.reset();
  els.form.elements.volume.value = 900;
  els.form.elements.remaining.value = 100;
  setDefaultDates();
  els.formDialog.showModal();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.form.reportValidity()) return;
  const formData = new FormData(els.form);
  bottles.unshift({
    id: crypto.randomUUID(),
    store: formData.get("store").trim(),
    name: formData.get("name").trim(),
    volume: Number(formData.get("volume")) || 900,
    remaining: Math.min(100, Math.max(0, Number(formData.get("remaining")))),
    startedAt: formData.get("startedAt"),
    expiresAt: formData.get("expiresAt"),
    notes: formData.get("notes").trim(),
  });
  saveBottles();
  render();
  els.formDialog.close();
});

els.sort.addEventListener("change", render);
els.range.addEventListener("input", (event) => updateDetailRemaining(event.target.value));
els.decrease.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) - 10));
els.increase.addEventListener("click", () => updateDetailRemaining(Number(els.range.value) + 10));
els.delete.addEventListener("click", () => {
  const bottle = bottles.find((item) => item.id === selectedId);
  if (!bottle || !window.confirm(`「${bottle.name}」を削除しますか？`)) return;
  bottles = bottles.filter((item) => item.id !== selectedId);
  saveBottles();
  render();
  els.detailDialog.close();
});
document.querySelectorAll(".close-dialog").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}
