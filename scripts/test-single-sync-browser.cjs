// Isolated Edge, synthetic state, all external transport blocked. No real profile or DB.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
  const name = new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    // Simulate an already signed-in/migrated phone. No real credentials/SDK/DB.
    await context.addInitScript(() => {
      localStorage.setItem('shochu-keep-ledger-cloud-migration-v1:synthetic', JSON.stringify({completedAt:'2026-10-11T00:00:00Z'}));
      const session = {user:{id:'synthetic',email:'test@example.invalid'}};
      window.__databaseCalls = 0;
      window.supabase = { createClient() {
        window.__guardBeforeAuth = singleSyncTest.active();
        if (!window.__guardBeforeAuth) throw Error('Guard was not active before Auth');
        return {
          auth: {
            onAuthStateChange(callback) { window.__signedIn = () => callback('SIGNED_IN',session); },
            async getSession() { return {data:{session},error:null}; },
          },
          from() { window.__databaseCalls++; throw Error('Unexpected database access'); },
          rpc() { window.__databaseCalls++; throw Error('Unexpected RPC access'); },
        };
      } };
    });
    let dbRequests = 0;
    await context.route('**/*',route=>{
      const url = route.request().url();
      if(url.startsWith(origin)) return route.continue();
      if(url.includes('.supabase.co')) dbRequests++;
      return route.fulfill({status:200,contentType:'text/javascript',body:''});
    });
    const page = await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin);
    assert.equal(await page.evaluate(()=>window.__guardBeforeAuth),true);
    assert.equal(await page.evaluate(()=>isCloudSyncEnabled()),true);
    assert.match(await page.locator('.app-version').innerText(),/Ver\.35 sync-test/);
    const start=page.getByRole('button',{name:'検証：同期を1回だけ実行'});
    assert.equal(await start.isEnabled(),true);
    assert.equal(await page.evaluate(()=>singleSyncTest.active()),true);
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      scheduleCloudSync(0);
      window.__signedIn();
    });
    assert.equal(await page.evaluate(()=>cloudSyncTimer),null);
    assert.equal(await page.evaluate(()=>window.__databaseCalls),0);
    await page.evaluate(()=>renderAuthState(null));
    await start.click(); // No auth: consumes and fails closed, without touching DB.
    await page.waitForFunction(()=>singleSyncTest.read()?.phase==='stopped');
    assert.equal(await start.isDisabled(),true);
    await page.goto(origin);
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>singleSyncTest.active()),true);
    const second=await context.newPage();
    await second.goto(origin+'/?syncTest=once');
    assert.equal(await second.getByRole('button',{name:'検証：同期を1回だけ実行'}).isDisabled(),true);
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'検証記録を保存'}).click();
    const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'shochu-single-sync-test.json');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    assert.deepEqual(errors,[]); assert.equal(dbRequests,0);
    console.log('PASS: default-on release / guard before authenticated startup / event and login suppression / failed attempt latch / reload without flag / second tab / report download / no overflow / JS errors 0 / DB requests 0');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
