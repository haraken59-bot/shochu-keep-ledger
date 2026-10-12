// Isolated VM: no real network, account, localStorage, or database.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
const src=fs.readFileSync('app.js','utf8'),released=cp.execFileSync('git',['show','c2f0116:app.js'],{encoding:'utf8'});
function fn(text,name){let i=text.indexOf(`function ${name}(`);assert(i>=0,name);if(text.slice(i-6,i)==='async ')i-=6;return text.slice(i,text.indexOf('\n}',i)+2).replace(/\r\n/g,'\n');}
for(const n of ['createCloudRevision','createCloudComparable','createLocalComparable','syncCloudSnapshot','ensureCloudStores','syncCloudBottles','syncCloudVisits','syncPendingCloudLabels','inspectCloudUpdates'])assert.equal(fn(src,n),fn(released,n),n+' must be unchanged');
assert(!/singleSyncTest|POST_BASELINE_SYNC_TEST|baselineMigration|mountSingleSyncTest/.test(src));
const c=vm.createContext({console:{error(){}},Date,Intl,JSON,Map,Set});
assert(src.includes('const AUTOMATIC_CLOUD_SYNC_ENABLED = true;'));
c.AUTOMATIC_CLOUD_SYNC_ENABLED = true;
const stage1=cp.execFileSync('git',['show','db4528c:app.js'],{encoding:'utf8'});
assert.equal(src.replace(/\/\/ Stage 2:.*\r?\n/, '').replace('AUTOMATIC_CLOUD_SYNC_ENABLED = true','AUTOMATIC_CLOUD_SYNC_ENABLED = false').replace(/\r\n/g,'\n'),stage1.replace(/\/\/ Stage 1:.*\r?\n/,'').replace(/\r\n/g,'\n'),'only release flag and comment may change');
for(const n of ['runCloudSync','scheduleCloudSync','sortCanonicalRows','cloudCoordinate','normalizeClosedWeekdays','createCloudRevision'])vm.runInContext(fn(src,n),c);
let saves=0,restores=0,remember=0,scheduled;
Object.assign(c,{cloudSyncPromise:null,cloudSyncQueued:false,cloudSyncTimer:null,cloudSyncPaused:false,cloudUpdateAvailable:false,
 navigator:{onLine:true},isCloudSyncEnabled:()=>true,window:{clearTimeout(){},setTimeout:f=>{scheduled=f;return 1;}},setCloudSyncState(){},
 inspectCloudUpdates:async()=>({safeToSync:true}),syncCloudSnapshot:async()=>{saves++;},fetchCloudRestoreSnapshot:async()=>({comparable:'local',remainingHistory:[]}),
 replaceRemainingHistoryFromCloud(){},createLocalComparable:()=> 'local',rememberCloudRevision:()=>remember++,setCloudUpdateAvailability(){},
 restoreFromSupabase:async()=>restores++,observedCloudComparable:'local',hasPendingCloudChanges:()=>false,describeCloudChanges:()=>[]});
(async()=>{
 // Automatic triggers schedule work without synchronous writes.
 c.scheduleCloudSync(0);assert.equal(typeof scheduled,'function');assert.equal(saves,0);assert.equal(remember,0);
 assert(src.includes('window.addEventListener("online", () => scheduleCloudSync(0))'));
 assert(src.includes('if (document.visibilityState === "visible") scheduleCloudSync(0)'));
 // All following operations use synthetic data and mocked network only.
 assert.equal(await c.runCloudSync(),'synced');assert.equal(await c.runCloudSync(),'synced');assert.equal(saves,2);assert.equal(remember,2);
 c.scheduleCloudSync(0);assert(scheduled);await scheduled();await c.cloudSyncPromise;assert.equal(saves,3);
 c.navigator.onLine=false;await c.runCloudSync();assert.equal(saves,3);c.navigator.onLine=true;
 c.inspectCloudUpdates=async()=>({safeToSync:false,autoApply:false});await c.runCloudSync();assert.equal(saves,3);
 c.inspectCloudUpdates=async()=>({safeToSync:false,autoApply:true});await c.runCloudSync();assert.equal(restores,1);assert.equal(saves,3);
 c.inspectCloudUpdates=async()=>{throw Error('offline');};await c.runCloudSync();assert.equal(saves,3);assert.equal(c.cloudSyncPromise,null);
 c.inspectCloudUpdates=async()=>({safeToSync:true});assert.equal(await c.runCloudSync(),'synced');assert.equal(saves,4);
 const stores=[{id:'s',name:'店',closed_weekdays:[]}],bottles=[{id:'b',store_id:'s',brand:'銘柄',volume_ml:900,current_remaining:50,kept_at:'2026-01-01',status:'active'}];
 const base=c.createCloudRevision(stores,bottles,[],[]);bottles[0].last_visited_at='2026-02-01';bottles[0].last_updated_at='2026-02-01';bottles[0].updated_at='2026-02-01';assert.equal(c.createCloudRevision(stores,bottles,[],[]),base);
 for(const field of ['id','store_id','brand','volume_ml','current_remaining','kept_at','status','notes']){const rows=structuredClone(bottles);rows[0][field]=['volume_ml','current_remaining'].includes(field)?123:'changed';assert.notEqual(c.createCloudRevision(stores,rows,[],[]),base,field);}
 console.log('PASS: sync/comparison helpers unchanged / normal repeated sync / schedule / offline / conflict prevents writes / cloud-only apply / failure recovery / obsolete bottle dates ignored / real changes detected');
})().catch(e=>{console.error(e);process.exitCode=1;});
