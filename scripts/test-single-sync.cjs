// Offline-only: actual guard/sync entry functions, synthetic storage and DB transport.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
function fn(name) {
  const start = source.search(new RegExp('^(?:async )?function ' + name + '\\(', 'm'));
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}
const c = vm.createContext({ console, Date, Map, Set, JSON, SINGLE_SYNC_DIAGNOSTIC_ONLY:false });
for (const name of ['createSingleSyncTest', 'singleSyncDatabaseDiff', 'singleSyncPreflight',
  'scheduleCloudSync', 'runCloudSync', 'restoreFromSupabase', 'migrateLocalDataToSupabase', 'executeSingleSyncTest',
  'syncDiagnosticError', 'createStoppedSyncDiagnostic']) {
  vm.runInContext(fn(name), c);
}
const key = 'shochu-keep-ledger-single-sync-test-v1';
function storage() {
  const map = new Map();
  return { map, getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v) };
}
function locks() {
  let held = false;
  return { request: async (key, options, task) => {
    if (held) return task(null);
    held = true;
    try { return await task({name:key}); } finally { held = false; }
  } };
}
const plain = value => JSON.parse(JSON.stringify(value));
(async () => {
  let count = 0;
  const db = storage(), lock = locks();
  assert.equal(c.createSingleSyncTest(db, lock, false).active(), false);
  const guard = c.createSingleSyncTest(db, lock, true);
  assert.equal(guard.active(), true);
  const other = c.createSingleSyncTest(db, lock, true);
  await Promise.all([guard.run(async () => { count++; await Promise.resolve(); }), other.run(async () => count++)]);
  assert.equal(count, 1);
  await c.createSingleSyncTest(db, lock, true).run(async () => count++);
  await c.createSingleSyncTest(db, lock, false).run(async () => count++);
  assert.equal(count, 1);
  assert.equal(guard.read().phase, 'completed');
  const failed = c.createSingleSyncTest(storage(), locks(), true);
  await failed.run(async () => { throw new Error('network'); });
  await failed.run(async () => count++);
  assert.equal(count, 1); assert.equal(failed.read().phase, 'stopped');
  const crashStorage = storage(); crashStorage.setItem(key, JSON.stringify({phase:'running'}));
  await c.createSingleSyncTest(crashStorage, locks(), false).run(async () => count++);
  assert.equal(count, 1);
  const broken = c.createSingleSyncTest({getItem(){throw Error('storage')},setItem(){throw Error('storage')}}, lock, true);
  assert.equal(broken.active(), true); await assert.rejects(broken.run(async () => count++));
  await assert.rejects(c.createSingleSyncTest(storage(), null, true).run(async () => count++));
  assert.equal(count, 1);
  console.log('PASS: concurrent tabs / double click / reload / URL removal / crash / failure / storage failure / unsupported lock');

  const cancellation = {phase:'stopped',userId:'synthetic',before:{},
    startedAt:'2026-10-11T04:17:09.151Z',finishedAt:'2026-10-11T04:17:26.283Z',
    error:'実行を取り消しました。自動同期は停止したままです。',
    preflight:{safe:true,pending:0,changedSections:[],sectionDifferences:[],rawBottleDifferences:[],addedVisits:[],missingVisits:[]}};
  for (const override of [{phase:'completed'},{phase:'running'},{result:null},{after:{}},{diff:{}},
    {syncStartedAt:'now'},{cancelRearmUsed:true},{startedAt:'different'},
    {error:'network'}, {preflight:{...cancellation.preflight,pending:1}}]) {
    const rejectedStorage=storage(); rejectedStorage.setItem(key,JSON.stringify({...cancellation,...override}));
    const rejected=c.createSingleSyncTest(rejectedStorage,locks(),true);
    assert.equal(rejected.canRearmCancelled(),false); assert.equal(await rejected.rearmCancelled(),false);
  }
  const rearmStorage=storage(); rearmStorage.setItem(key,JSON.stringify(cancellation));
  const rearmLocks=locks(), rearm=c.createSingleSyncTest(rearmStorage,rearmLocks,true);
  const peer=c.createSingleSyncTest(rearmStorage,rearmLocks,true);
  const permissions=await Promise.all([rearm.rearmCancelled(),peer.rearmCancelled()]);
  assert.equal(permissions.filter(Boolean).length,1);
  assert.equal(rearm.read().phase,'ready'); assert.equal(rearm.active(),true);
  assert.deepEqual(plain(rearm.read().previousAttempt),cancellation);
  assert.equal(await c.createSingleSyncTest(rearmStorage,rearmLocks,true).rearmCancelled(),false);
  let attempts=0;
  await rearm.run(async()=>{attempts++;throw new Error(cancellation.error);});
  assert.equal(await rearm.rearmCancelled(),false);
  await rearm.run(async()=>attempts++); assert.equal(attempts,1);
  console.log('PASS: reviewed cancellation only / ambiguous and started states rejected / atomic one-time re-arm / original report retained / no network / second cancellation stays stopped');

  let writes = 0, restores = 0, timers = 0;
  Object.assign(c, {
    singleSyncTest: {active:()=>true,read:()=>({phase:'running'})}, singleSyncPermit: Symbol(),
    singleSyncPermissionAvailable: false, cloudSyncPaused: false,
    cloudUpdateAvailable: false, cloudUpdateMode:'', cloudSyncPromise: null, cloudSyncQueued: false, cloudSyncTimer: null,
    isCloudSyncEnabled: () => true, navigator: {onLine:true},
    window: { clearTimeout(){}, setTimeout(){timers++;} }, setCloudSyncState(){},
    inspectCloudUpdates: async () => ({safeToSync:true}),
    syncCloudSnapshot: async () => { writes++; c.scheduleCloudSync(); await c.runCloudSync(); },
    fetchCloudRestoreSnapshot: async () => ({comparable:'same', remainingHistory:[]}),
    replaceRemainingHistoryFromCloud(){}, createLocalComparable: () => 'same',
    rememberCloudRevision(){}, setCloudUpdateAvailability(){}, hasPendingCloudChanges: () => false,
    authSession: {user:{id:'test-user'}}, singleSyncExpectedState: {userId:'test-user',comparable:'same'},
  });
  c.scheduleCloudSync(0); await c.runCloudSync();
  await c.restoreFromSupabase(); await c.migrateLocalDataToSupabase();
  assert.equal(timers, 0); assert.equal(writes, 0);
  await c.runCloudSync(c.singleSyncPermit); assert.equal(writes, 0);
  c.singleSyncPermissionAvailable = true;
  assert.equal(await c.runCloudSync(c.singleSyncPermit), 'synced');
  assert.equal(writes, 1); assert.equal(timers, 0);
  await c.runCloudSync(c.singleSyncPermit); assert.equal(writes, 1);
  c.inspectCloudUpdates = async () => ({safeToSync:false,autoApply:true});
  c.restoreFromSupabase = async () => restores++;
  c.singleSyncPermissionAvailable = true;
  await c.runCloudSync(c.singleSyncPermit);
  assert.equal(restores, 0); assert.equal(writes, 1);
  c.singleSyncTest = {active:()=>false};
  c.scheduleCloudSync(); assert.equal(timers, 1);
  c.inspectCloudUpdates = async () => ({safeToSync:true});
  c.syncCloudSnapshot = async () => writes++;
  await c.runCloudSync(); assert.equal(writes, 2);
  console.log('PASS: startup/online/visibility schedule gate / direct call / migration / restore / queued request / no auto-restore / normal mode');

  const before = {stores:[{id:'s',name:'A'}],bottles:[{id:'b',legacy_id:'b',store_id:'s',brand:'B',volume_ml:900,status:'active',notes:'',current_remaining:50,kept_at:'2020-01-01',last_visited_at:'2020-02-01'}],store_visits:[],remaining_updates:[],brand_labels:[]};
  assert.ok(Object.values(c.singleSyncDatabaseDiff(before,before)).every(x=>x.count===0));
  const after = structuredClone(before); after.bottles[0].last_visited_at = '2026-10-11';
  after.store_visits.push({id:'v',store_id:'s',visited_on:'2026-10-11'});
  const diff = plain(c.singleSyncDatabaseDiff(before,after));
  assert.equal(diff.bottles.count,1); assert.deepEqual(diff.bottles.changes[0].fields,['last_visited_at']);
  assert.equal(diff.bottles.changes[0].id,'b'); assert.equal(diff.store_visits.changes[0].store_id,'s');
  assert.equal(diff.store_visits.changes[0].kind,'added');
  const comparable = {stores:[['A']],bottles:[['b','A','B',900,50,'2020-01-01','active','']],visits:[],labels:[]};
  let local = structuredClone(comparable), pending = {};
  c.createLocalComparable = () => JSON.stringify(local);
  c.createCloudComparable = () => JSON.stringify(comparable);
  c.loadPendingRemainingChanges = () => pending;
  c.loadPendingVisitDeletes = c.loadPendingLabels = () => ({});
  assert.equal(c.singleSyncPreflight(before).safe,true);
  const missingVolume = structuredClone(before); missingVolume.bottles[0].volume_ml = null;
  assert.equal(c.singleSyncPreflight(missingVolume).safe,false);
  local.visits = [['A','2026-10-11']]; assert.equal(c.singleSyncPreflight(before).safe,true);
  local.visits.push(['A','2026-10-10']); assert.equal(c.singleSyncPreflight(before).safe,false);
  local = structuredClone(comparable); local.bottles[0][4] = 40;
  assert.equal(c.singleSyncPreflight(before).safe,false);
  local = structuredClone(comparable); pending = {change:{}};
  assert.equal(c.singleSyncPreflight(before).safe,false); pending = {};
  console.log('PASS: full-row diff / old bottle date detection / counts and IDs / bulk visits and bottle edits stop before writes');

  let reads = 0;
  c.singleSyncTest = c.createSingleSyncTest(storage(),locks(),true);
  c.readSingleSyncDatabase = async () => { reads++; return structuredClone(before); };
  c.window.confirm = () => true;
  const realRun = c.runCloudSync;
  c.runCloudSync = async permit => { assert.equal(permit,c.singleSyncPermit); writes++; return 'synced'; };
  const previousWrites = writes;
  const record = await c.executeSingleSyncTest();
  assert.equal(record.phase,'completed'); assert.equal(reads,2);
  assert.ok(Object.values(record.diff).every(x=>x.count===0));
  await c.executeSingleSyncTest(); assert.equal(writes,previousWrites+1); assert.equal(reads,2);
  c.singleSyncTest = c.createSingleSyncTest(storage(),locks(),true);
  local.bottles[0][4] = 1;
  const stopped = await c.executeSingleSyncTest();
  assert.equal(stopped.phase,'stopped'); assert.equal(writes,previousWrites+1);
  assert.ok(stopped.before); assert.equal(stopped.preflight.safe,false);
  c.runCloudSync = realRun;
  console.log('PASS: end-to-end single attempt / persistent before-after report / unsafe preflight zero writes');

  // Diagnostic release cannot consume a permit, write, or re-run the test.
  c.SINGLE_SYNC_DIAGNOSTIC_ONLY = true;
  const stoppedRecord = {phase:'stopped',userId:'test-user',after:before,error:'old generic error'};
  c.singleSyncTest = {active:()=>true,read:()=>stoppedRecord,run:()=>{throw Error('must not retry');}};
  const original=JSON.stringify(stoppedRecord), writesBefore= writes;
  Object.assign(c,{cloudSyncState:'idle',observedCloudRevision:'old-revision',observedCloudComparable:'old-comparable',
    createCloudRevision:()=> 'new-revision',createCloudComparable:()=> 'current',createLocalComparable:()=> 'current',
    authSession:{user:{id:'test-user'},access_token:'do-not-export-this-token'}});
  await c.executeSingleSyncTest(); await c.runCloudSync(c.singleSyncPermit);
  const baselineRecord={cloudRevision:'saved-revision',cloudComparable:'saved-comparable',cloudCheckedAt:'2026-10-11T00:00:00Z',access_token:'excluded-secret'};
  const baselineBefore=JSON.stringify(baselineRecord);
  c.readCloudMigrationRecord=()=>baselineRecord;
  const report=c.createStoppedSyncDiagnostic();
  assert.equal(report.savedBaseline.cloudRevision,'saved-revision');
  assert.equal(report.savedBaseline.cloudComparable,'saved-comparable');
  assert.equal(report.savedBaseline.cloudCheckedAt,'2026-10-11T00:00:00Z');
  assert.equal(report.currentCloud.status,'not_fetched');
  assert.equal(report.localComparableAtCapture,'current');
  assert.equal(JSON.stringify(baselineRecord),baselineBefore);
  assert.ok(!JSON.stringify(report).includes('excluded-secret'));
  assert.equal(report.historicalStop.status,'not_recorded');
  assert.equal(report.currentState.baselineRevisionMatchesRecordedAfter,false);
  assert.equal(report.currentState.recordedAfterMatchesLocal,true);
  assert.equal(JSON.stringify(stoppedRecord),original); assert.equal(writes,writesBefore);
  assert.ok(!JSON.stringify(report).includes('do-not-export-this-token'));
  const redacted=c.syncDiagnosticError({message:'Bearer secret eyJabc.def.ghi https://a.invalid/?token=secret sb_secret_abcd'});
  assert.ok(!redacted.message.includes('eyJabc')); assert.ok(!redacted.message.includes('token=secret'));
  console.log('PASS: diagnostics read only / previous failure not invented / no session token export / no sync/permit consumption');

  // Future instrumentation, synthetic execution only. Production flag remains true.
  c.SINGLE_SYNC_DIAGNOSTIC_ONLY = false;
  c.singleSyncTest={active:()=>false};
  c.inspectCloudUpdates=async()=>{throw Object.assign(Error('synthetic denial'),{code:'42501'});};
  const entries=[];
  await c.runCloudSync(undefined,entry=>entries.push(entry));
  assert.equal(entries.at(-1).stage,'inspect_cloud_updates');assert.equal(entries.at(-1).status,'error');
  assert.equal(entries.at(-1).error.code,'42501');assert.equal(writes,writesBefore);
  console.log('PASS: actual error stage/code retained without writes');
})().catch(error => { console.error(error); process.exitCode=1; });
