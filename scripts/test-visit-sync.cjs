// Isolated regression: execute the actual sync function, without network or user data.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf('async function syncCloudVisits(');
const end = source.indexOf('\nasync function ', start + 1);
assert.ok(start >= 0 && end > start);
const inserted = [];
const context = vm.createContext({
  loadPendingVisitDeletes: () => ({}),
  supabaseData: async value => value,
  supabaseClient: { from: name => {
    assert.equal(name, 'store_visits');
    return {
      select: () => [{ store_id: 'store-1', visited_on: '2026-10-07' }],
      insert: rows => {
        for (const row of rows) {
          assert.ok(['manual', 'bottle_created', 'remaining_updated', 'import'].includes(row.source));
          assert.equal(row.user_id, 'user-1');
          assert.equal(row.store_id, 'store-1');
          inserted.push(row);
        }
        return rows;
      },
    };
  } },
});
vm.runInContext(source.slice(start, end), context);
(async () => {
  await context.syncCloudVisits({ visits: [
    { store: 'Test', visitedAt: '2026-10-07' },
    { store: 'Test', visitedAt: '2026-10-08' },
    { store: 'Test', visitedAt: '2026-10-08' },
  ] }, new Map([['Test', 'store-1']]), 'user-1');
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].visited_on, '2026-10-08');
  assert.equal(inserted[0].source, 'import');
  console.log('PASS: actual syncCloudVisits payload / allowed source / existing and duplicate dates');
})().catch(error => { console.error(error); process.exitCode = 1; });
