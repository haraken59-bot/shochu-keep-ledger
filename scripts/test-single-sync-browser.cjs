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
    assert.match(await page.locator('.app-version').innerText(),/Ver\.35 sync-test 5/);
    const start=page.getByRole('button',{name:'検証：同期を1回だけ実行'});
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>singleSyncTest.active()),true);
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      scheduleCloudSync(0);
      window.__signedIn();
    });
    assert.equal(await page.evaluate(()=>cloudSyncTimer),null);
    assert.equal(await page.evaluate(()=>window.__databaseCalls),0);
    await page.evaluate(async()=>{ await executeSingleSyncTest(); await runCloudSync(); });
    await page.evaluate(()=>localStorage.setItem('shochu-keep-ledger-single-sync-test-v1',JSON.stringify({
      phase:'stopped',userId:'synthetic',error:'同期未完了',
      after:{stores:[],bottles:[],store_visits:[],remaining_updates:[],brand_labels:[]}
    })));
    assert.equal(await start.isDisabled(),true);
    await page.goto(origin);
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>singleSyncTest.active()),true);
    const second=await context.newPage();
    await second.goto(origin+'/?syncTest=once');
    assert.equal(await second.getByRole('button',{name:'検証：同期を1回だけ実行'}).isDisabled(),true);
    const downloadPromise=page.waitForEvent('download');
    const original=await page.evaluate(()=>localStorage.getItem('shochu-keep-ledger-single-sync-test-v1'));
    await page.evaluate(()=>{
      const key='shochu-keep-ledger-cloud-migration-v1:synthetic';
      const value=JSON.parse(localStorage.getItem(key));
      Object.assign(value,{cloudRevision:'fixture-revision',cloudComparable:'fixture-comparable',cloudCheckedAt:'2026-10-11T00:00:00Z',access_token:'must-not-export'});
      localStorage.setItem(key,JSON.stringify(value));
    });
    const baselineBefore=await page.evaluate(()=>localStorage.getItem('shochu-keep-ledger-cloud-migration-v1:synthetic'));
    await page.getByRole('button',{name:'停止情報を保存（同期しません）'}).click();
    const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'shochu-sync-diagnostics.json');
    const diagnostic=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(diagnostic.historicalStop.status,'not_recorded');
    assert.equal(diagnostic.currentState.diagnosticOnly,false);
    assert.equal(diagnostic.savedBaseline.cloudRevision,'fixture-revision');
    assert.equal(diagnostic.savedBaseline.cloudComparable,'fixture-comparable');
    assert.equal(diagnostic.savedBaseline.cloudCheckedAt,'2026-10-11T00:00:00Z');
    assert.equal(diagnostic.currentCloud.status,'not_fetched');
    assert.ok(!JSON.stringify(diagnostic).includes('must-not-export'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('shochu-keep-ledger-cloud-migration-v1:synthetic')),baselineBefore);
    assert.deepEqual(diagnostic.testRecord,JSON.parse(original));
    assert.equal(await page.evaluate(()=>localStorage.getItem('shochu-keep-ledger-single-sync-test-v1')),original);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    // Explicit re-arm changes only the test record, never starts sync.
    await page.evaluate(()=>localStorage.setItem('shochu-keep-ledger-single-sync-test-v1',JSON.stringify({
      phase:'stopped',userId:'synthetic',before:{},
      startedAt:'2026-10-11T04:17:09.151Z',finishedAt:'2026-10-11T04:17:26.283Z',
      error:'実行を取り消しました。自動同期は停止したままです。',
      preflight:{safe:true,pending:0,changedSections:[],sectionDifferences:[],rawBottleDifferences:[],addedVisits:[],missingVisits:[]}
    })));
    await page.reload();
    const rearm=page.getByRole('button',{name:'キャンセル分を1回だけ再許可'});
    assert.equal(await rearm.isVisible(),false);
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>singleSyncTest.read().phase),'stopped');
    assert.equal(await page.evaluate(()=>window.__databaseCalls),0);
    await page.reload();
    assert.equal(await rearm.isVisible(),false);
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>cloudSyncTimer),null);
    assert.equal(await page.evaluate(()=>window.__databaseCalls),0);
    // UI only: seed isolated fixture and restore Auth without invoking sync.
    await page.evaluate(()=>{
      localStorage.setItem('shochu-keep-ledger-single-sync-test-v1',JSON.stringify({phase:'stopped',userId:'synthetic'}));
      localStorage.setItem('shochu-keep-ledger-cloud-migration-v1:synthetic',JSON.stringify({completedAt:'2026-10-11T00:00:00Z',comparisonSchema:'v35-r2-c2'}));
      renderAuthState(null);
    });
    assert.equal(await start.isDisabled(),true);
    await page.evaluate(()=>window.__signedIn());
    assert.equal(await start.isEnabled(),true);
    await page.reload();
    // Init script deliberately restores an unmigrated fixture: must remain disabled.
    assert.equal(await start.isDisabled(),true);
    await page.evaluate(()=>{
      localStorage.setItem('shochu-keep-ledger-cloud-migration-v1:synthetic',JSON.stringify({completedAt:'2026-10-11T00:00:00Z',comparisonSchema:'v35-r2-c2'}));
      window.__signedIn();
    });
    assert.equal(await start.isEnabled(),true);
    await page.evaluate(()=>{
      localStorage.setItem('shochu-keep-ledger-single-sync-test-v1',JSON.stringify({phase:'stopped',userId:'synthetic',postBaselineAttempt:true}));
      window.__signedIn();
    });
    assert.equal(await start.isDisabled(),true);
    await page.evaluate(()=>renderAuthState({user:{id:'other'}}));
    assert.equal(await start.isDisabled(),true);
    assert.equal(await page.evaluate(()=>window.__databaseCalls),0);
    assert.deepEqual(errors,[]); assert.equal(dbRequests,0);
    console.log('PASS: auth absent disabled / restored migrated user enabled / unmigrated, consumed, other user disabled / UI refresh only / no sync');
    console.log('PASS: diagnostic-only / guard before Auth / events suppressed / direct sync blocked / immutable record download / rearm hidden / reload and second tab / no overflow / JS errors 0 / DB requests 0');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
