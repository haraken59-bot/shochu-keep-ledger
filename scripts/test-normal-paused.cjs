// Synthetic VM only; no real localStorage, session, network or DB.
const fs=require('fs'),vm=require('vm'),a=require('assert/strict'),cp=require('child_process');
const src=fs.readFileSync('app.js','utf8'),released=cp.execFileSync('git',['show','HEAD:app.js'],{encoding:'utf8'});
function fn(s,n){let i=s.indexOf(`function ${n}(`);a(i>=0,n);if(s.slice(i-6,i)==='async ')i-=6;return s.slice(i,s.indexOf('\n}',i)+2).replace(/\r\n/g,'\n');}
for(const n of ['runCloudSync','syncCloudSnapshot','ensureCloudStores','syncCloudBottles','syncCloudVisits','syncPendingCloudLabels','createCloudRevision','createCloudComparable','createLocalComparable','inspectCloudUpdates'])a.equal(fn(src,n),fn(released,n),n);
a(src.includes('const AUTOMATIC_CLOUD_SYNC_ENABLED = false;'));
let calls=0;const c=vm.createContext({AUTOMATIC_CLOUD_SYNC_ENABLED:false,window:{setTimeout(){calls++;},clearTimeout(){}},runCloudSync(){calls++;}});vm.runInContext(fn(src,'scheduleCloudSync'),c);
for(const event of ['getSession','SIGNED_IN','online','visible','save'])c.scheduleCloudSync(0);
a.equal(calls,0);
a(src.includes('if (isCloudSyncEnabled()) scheduleCloudSync(0)'));
a(src.includes('window.addEventListener("online", () => scheduleCloudSync(0))'));
a(src.includes('if (document.visibilityState === "visible") scheduleCloudSync(0)'));
console.log('PASS: auto-sync triggers blocked before timers/network/state changes; normal sync and comparison functions unchanged');
