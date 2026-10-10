// Offline only: actual functions with synthetic data and stubbed storage/network.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
function fn(name) {
  const re = new RegExp('^(?:async )?function ' + name + '\\(', 'm');
  const start = source.search(re); assert.ok(start >= 0, name);
  const end = source.indexOf('\n}', start) + 2;
  return source.slice(start, end);
}
const initial = [
  {id:'old',store:'A',name:'old',startedAt:'2020-01-01',lastVisitedAt:'2099-01-01',remaining:0,keepNumber:1},
  {id:'one',store:'A',name:'one',startedAt:'2026-01-01',lastVisitedAt:'2099-01-01',remaining:65,keepNumber:1},
  {id:'two',store:'A',name:'two',startedAt:'2026-02-01',lastVisitedAt:'2099-01-01',remaining:90,keepNumber:1},
  {id:'other',store:'B',name:'other',startedAt:'2026-03-01',lastVisitedAt:'2099-01-01',remaining:70,keepNumber:1},
];
const storage = new Map(); let savedVisits=0; let queued;
const c = vm.createContext({bottles:structuredClone(initial),storeVisits:[], crypto:require('node:crypto'),
  STORE_VISITS_KEY:'visits',KEEP_VISITS_MIGRATION_KEY:'migration',
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  cancelPendingVisitDelete:()=>{},saveBottles:()=>{},saveStoreVisits:()=>savedVisits++,render:()=>{},
  queueRemainingChange:(b,n)=>queued={id:b.id,n}, dateToInput:()=> '2026-10-10',
  cloudCoordinate:()=>null,normalizeRemainingHistory:()=>[],normalizeClosedWeekdays:()=>[],
});
for (const name of ['latestStoreVisitDate','syncStoreLastVisited','recordStoreVisit','saveBottleRemaining','loadStoreVisits','migrateKeepDatesToStoreVisits','cloudBottlePayload','cloudBottleMetadataChanged','parseBackupData','formatDate']) vm.runInContext(fn(name),c);
const plain=x=>JSON.parse(JSON.stringify(x));
c.recordStoreVisit('A','2026-10-10');
assert.deepEqual(plain(c.bottles),initial);
assert.equal(c.storeVisits.length,1); assert.equal(savedVisits,1);
assert.equal(c.latestStoreVisitDate('A'),'2026-10-10');
assert.equal(c.latestStoreVisitDate('B'),''); assert.equal(c.formatDate(''),'来店記録なし');
c.saveBottleRemaining('one',55);
assert.deepEqual(queued,{id:'one',n:55});
assert.deepEqual(plain(c.bottles),initial.map(b=>b.id==='one'?{...b,remaining:55}:b));
c.migrateKeepDatesToStoreVisits();
assert.ok(c.storeVisits.every(v=>v.visitedAt!=='2099-01-01'));
assert.deepEqual(plain(c.bottles),initial.map(b=>b.id==='one'?{...b,remaining:55}:b));
assert.ok(c.loadStoreVisits().every(v=>v.visitedAt!=='2099-01-01'));
const restored=c.parseBackupData({type:'shochu-keep-ledger-backup',version:1,data:{bottles:initial,storeVisits:[{id:'v',store:'A',visitedAt:'2026-04-01'}]}});
c.bottles=restored.bottles;c.storeVisits=restored.storeVisits;
const before=plain(c.bottles); c.syncStoreLastVisited('A');
assert.deepEqual(plain(c.bottles),before); assert.equal(c.latestStoreVisitDate('A'),'2026-04-01');
const payload=c.cloudBottlePayload(initial[1],'store-a');
assert.ok(!Object.hasOwn(payload,'last_visited_at'));
assert.equal(c.cloudBottleMetadataChanged({...payload,last_visited_at:'2099-01-01'},payload),false);
// Restore and cloud-load routes share the now read-only hook; no inline copy remains.
assert.doesNotMatch(fn('syncStoreLastVisited'),/bottles\s*=/);
assert.doesNotMatch(fn('createCloudComparable'),/last_visited_at/);
assert.doesNotMatch(fn('createLocalComparable'),/lastVisitedAt/);
assert.doesNotMatch(fn('describeCloudChanges'),/lastVisitedAt/);
assert.doesNotMatch(source,/last_visited_at\s*:/);
console.log('PASS: visit registration / finished and concurrent bottles / ID-only remaining / backup / migration / stale dates / sync payload and comparisons');

// Real cloud snapshot reader, fake read-only transport. No Supabase connection.
c.supabaseData=async x=>x;
c.createCloudRevision=()=>'';c.createCloudComparable=()=>'';
const tables={stores:[{id:'sa',name:'A'}],bottles:initial.filter(b=>b.store==='A').map(b=>({id:'db-'+b.id,legacy_id:b.id,store_id:'sa',brand:b.name,kept_at:b.startedAt,current_remaining:b.remaining,last_visited_at:b.lastVisitedAt})),store_visits:[{id:'v',store_id:'sa',visited_on:'2026-04-01'}],brand_labels:[],remaining_updates:[]};
c.supabaseClient={from:name=>({select:()=>name==='remaining_updates'?{order(){return this},limit:()=>[]}:tables[name]})};
vm.runInContext(fn('fetchCloudRestoreSnapshot'),c);
(async()=>{
  const snapshot=await c.fetchCloudRestoreSnapshot();
  c.bottles=snapshot.bottles;c.storeVisits=snapshot.storeVisits;
  const prior=plain(c.bottles);
  storage.delete('migration');c.migrateKeepDatesToStoreVisits();c.syncStoreLastVisited('A');
  assert.deepEqual(plain(c.bottles),prior);
  assert.equal(c.latestStoreVisitDate('A'),'2026-04-01');
  assert.ok(c.storeVisits.every(v=>v.visitedAt!=='2099-01-01'));
  console.log('PASS: cloud read + migration + restore hook preserve all bottle values and ignore stale date');
})().catch(e=>{console.error(e);process.exitCode=1});
