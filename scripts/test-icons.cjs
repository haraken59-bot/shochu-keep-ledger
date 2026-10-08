// Development-only check. Uses an existing Playwright installation via NODE_PATH.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = '/shochu-keep-ledger/';
const baseline = 'bb02ba1'; // Last release before the PNG icon update.
const oldFiles = Object.fromEntries(['index.html', 'manifest.webmanifest', 'service-worker.js'].map(name =>
  [name, execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root })]));
let updated = false;
const missing = [];
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png',
  '.ico':'image/x-icon', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.wasm':'application/wasm' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(base)) { res.writeHead(404); res.end(); return; }
  const name = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    missing.push(name); res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
  res.end(!updated && oldFiles[name] ? oldFiles[name] : fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  try {
    const context = await browser.newContext();
    // Never connect tests to live Supabase or external services.
    await context.route('**/*', route => route.request().url().startsWith(origin)
      ? route.continue() : route.fulfill({status:200, contentType:'text/javascript', body:''}));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const oldManifest = await page.evaluate(async () => (await fetch('manifest.webmanifest?v=22')).json());
    assert.equal(oldManifest.icons[0].src, 'icon.svg');
    await page.evaluate(() => localStorage.setItem('icon-update-test', 'preserved'));
    updated = true;
    await page.evaluate(async () => {
      const previous = navigator.serviceWorker.controller;
      const switched = new Promise(resolve => {
        const check = () => {
          if (navigator.serviceWorker.controller !== previous) {
            navigator.serviceWorker.removeEventListener('controllerchange', check);
            resolve();
          }
        };
        navigator.serviceWorker.addEventListener('controllerchange', check);
      });
      await (await navigator.serviceWorker.ready).update();
      await switched;
    });
    await page.waitForFunction(async () => {
      const keys = await caches.keys();
      return keys.includes('shochu-keep-ledger-v34-2-audit-20261009') && !keys.includes('shochu-keep-ledger-v34-1-otp');
    });
    await page.reload();
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active?.state === 'activated' && !registration.installing && !registration.waiting;
    });
    const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest?v=22')).json());
    assert.equal(manifest.icons.length, 4);
    assert.equal(manifest.start_url, oldManifest.start_url);
    assert.equal(await page.evaluate(() => localStorage.getItem('icon-update-test')), 'preserved');
    const refs = await page.locator('link[rel="icon"],link[rel="apple-touch-icon"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
    const assets = [...new Set([...manifest.icons.map(i => i.src), ...refs])];
    for (const asset of assets) {
      const response = await context.request.get(origin + base + asset);
      assert.equal(response.status(), 200, asset);
    }
    const dimensions = await page.evaluate(async icons => Promise.all(icons.map(icon => new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`);
      image.onerror = reject; image.src = icon.src;
    }))), manifest.icons);
    assert.deepEqual(dimensions, manifest.icons.map(i => i.sizes));
    await page.getByRole('button', {name:/いいちこ.*20%.*残量/}).click();
    await page.getByRole('button', {name:'＋ 10%', exact:true}).click();
    assert.equal(await page.locator('#detail-remaining').innerText(), '30%');
    assert.ok((await page.locator('#detail-dialog').innerText()).includes('20% → 30%'));
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', {name:'この変更を取り消す', exact:true}).click();
    assert.equal(await page.locator('#detail-remaining').innerText(), '20%');
    const roundTrip = await page.evaluate(() => {
      const backup = createBackupData();
      const restored = parseBackupData(JSON.parse(JSON.stringify(backup)));
      return {bottles:restored.bottles.length, visits:restored.storeVisits.length, history:restored.remainingHistory.length};
    });
    assert.equal(roundTrip.bottles, 4); assert.ok(roundTrip.visits > 0); assert.equal(roundTrip.history, 2);
    const related = await page.evaluate(() => ({
      sameLocation: distanceInMeters({latitude:35,longitude:135},{latitude:35,longitude:135}),
      oneDegree: distanceInMeters({latitude:0,longitude:0},{latitude:1,longitude:0}),
      ocrCandidate: findBrandCandidates('黒霧鳥')[0]?.brand,
      candidateCount: findBrandCandidates('黒霧鳥 二階堂 いいちこ').length,
      weekdays: normalizeClosedWeekdays([5,5,-1,9,0]),
    }));
    assert.equal(related.sameLocation, 0);
    assert.ok(related.oneDegree > 111000 && related.oneDegree < 112000);
    assert.equal(related.ocrCandidate, '黒霧島');
    assert.ok(related.candidateCount <= 3);
    assert.deepEqual(related.weekdays, [0,5]);
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator('.app-version').innerText(), 'Ver. 34');
    const offlineIcons = await page.evaluate(async assets => Promise.all(assets.map(async asset => (await fetch(asset)).status)), assets);
    assert.ok(offlineIcons.every(status => status === 200));
    const ocrText = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 120;
      const pen = canvas.getContext('2d');
      pen.fillStyle = 'white'; pen.fillRect(0,0,500,120);
      pen.fillStyle = 'black'; pen.font = '64px sans-serif'; pen.fillText('12345',20,80);
      return recognizeLabelWith('jpn', canvas);
    });
    assert.ok(ocrText.includes('12345'), `OCR returned: ${ocrText}`);
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    console.log(JSON.stringify({result:'PASS', iconReferences:assets.length, dimensions,
      cacheUpgrade:true, localStoragePreserved:true, remainingAndUndo:true, backupRoundTrip:roundTrip,
      offlinePwaAndIcons:true, gpsOcrWeekdayLogic:related, offlineOcr:true,
      pageErrors:errors, missingFiles:missing}, null, 2));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
