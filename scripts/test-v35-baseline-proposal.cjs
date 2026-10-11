// Proposal only: no app execution, network, localStorage, or database writes.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0);
  return source.slice(start, source.indexOf('\nfunction ', start + 1));
}
const context = vm.createContext({});
vm.runInContext(['sortCanonicalRows','cloudCoordinate','comparableLocation','normalizeClosedWeekdays','createCloudRevision','createCloudComparable'].map(extract).join('\n'), context);
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const snapshot = report.testRecord.after;
const args = s => [s.stores,s.bottles,s.store_visits,s.brand_labels];
const comparable = s => JSON.parse(context.createCloudComparable(...args(s)));
function revision(s) {
  const r = JSON.parse(context.createCloudRevision(...args(s)));
  // Proposed v35-r2 excludes last_updated_at (and never includes last_visited_at).
  r.bottles = r.bottles.map(row => row.slice(0,9));
  return r;
}
const before = JSON.stringify(snapshot);
const current = comparable(snapshot);
assert.equal(current.bottles.length,56);
// Reconstructed legacy fixture, NOT the phone's actual saved baseline.
const legacy = structuredClone(current);
legacy.bottles = legacy.bottles.map(row => [...row,'2020-01-01']);
const migrated = structuredClone(legacy);
migrated.bottles = migrated.bottles.map(row => {
  assert.equal(row.length,9); return row.slice(0,8);
});
assert.deepEqual(migrated,current);
const dateOnly = structuredClone(snapshot);
dateOnly.bottles.forEach(b => {b.last_visited_at='2020-01-01';b.last_updated_at='2026-10-11T00:00:00Z';b.updated_at='2026-10-11T00:00:00Z';});
assert.deepEqual(revision(dateOnly),revision(snapshot));
assert.deepEqual(comparable(dateOnly),current);
let tested=0;
for(const [field,value] of Object.entries({id:'different-id',legacy_id:'different-local-id',store_id:'different-store',brand:'different-brand',volume_ml:1234,current_remaining:12.345,kept_at:'2000-01-01',status:'different-status',notes:'different-note'})) {
  const changed=structuredClone(snapshot); changed.bottles[0][field]=value;
  assert.notDeepEqual(revision(changed),revision(snapshot),field); tested++;
}
for (const [table,field,value] of [['stores','name','different-store'],['store_visits','visited_on','2000-01-01'],['brand_labels','image_path','different-image']]) {
  const changed=structuredClone(snapshot);changed[table][0][field]=value;
  assert.notDeepEqual(revision(changed),revision(snapshot),field);tested++;
}
for(const table of ['stores','bottles','store_visits','brand_labels']) {
  const changed=structuredClone(snapshot);changed[table].pop();
  assert.notDeepEqual(revision(changed),revision(snapshot),table);tested++;
}
assert.equal(JSON.stringify(snapshot),before);
console.log(JSON.stringify({result:'PASS',reconstructedLegacyBottles:56,dateOnlyIgnored:true,substantiveMutationTests:tested,inputUnchanged:true,realSavedBaselineTested:false}));
