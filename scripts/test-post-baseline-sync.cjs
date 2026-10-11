const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');
const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
function fn(n){let i=src.indexOf(`function ${n}(`);if(src.slice(i-6,i)==='async ')i-=6;return src.slice(i,src.indexOf('\n}',i)+2);}
let held=false;const locks={request:async(k,o,f)=>{if(held)return f(null);held=true;try{return await f({});}finally{held=false;}}};
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
const c=vm.createContext({console,Date,Map,Set,JSON,Error,SINGLE_SYNC_DIAGNOSTIC_ONLY:false,POST_BASELINE_SYNC_TEST:true});
for(const n of ['createSingleSyncTest','sortCanonicalRows','cloudCoordinate','comparableLocation','normalizeClosedWeekdays','createCloudRevision','createCloudComparable','singleSyncDatabaseDiff','singleSyncPreflight','checkPostBaselineSync','postBaselineSafetyDiff','executeSingleSyncTest','runCloudSync','syncDiagnosticError'])vm.runInContext(fn(n),c);
const cloud=d.testRecord.after,args=[cloud.stores,cloud.bottles,cloud.store_visits,cloud.brand_labels];
const base={cloudRevision:c.createCloudRevision(...args),cloudComparable:c.createCloudComparable(...args),cloudCheckedAt:'now',comparisonSchema:'v35-r2-c2'};
base.baselineMigration={before:d.savedBaseline,after:{...base},substantiveDifferences:0,pendingChanges:0,localDataUnchanged:true,syncStillStopped:true};
let writes=0,pending=false,reads=0,mutate=false;
Object.assign(c,{localStorage:storage,authSession:{user:{id:d.testRecord.userId}},navigator:{onLine:true},
 readCloudMigrationRecord:()=>JSON.parse(storage.getItem('baseline')),cloudMigrationStorageKey:()=> 'baseline',
 createLocalComparable:()=>base.cloudComparable,loadPendingRemainingChanges:()=>pending?{x:1}:{},loadPendingLabels:()=>({}),loadPendingVisitDeletes:()=>({}),hasPendingCloudChanges:()=>pending,
 cloudSyncPromise:null,cloudSyncQueued:false,cloudSyncTimer:null,cloudUpdateAvailable:false,cloudUpdateMode:'',singleSyncPermit:Symbol(),singleSyncPermissionAvailable:false,
 isCloudSyncEnabled:()=>true,window:{confirm:()=>true},setCloudSyncState(){},setCloudUpdateAvailability(){},replaceRemainingHistoryFromCloud(){},rememberCloudRevision(){},scheduleCloudSync(){throw Error('must not schedule');},
 syncCloudSnapshot:async()=>{writes++;}, fetchCloudRestoreSnapshot:async()=>({comparable:base.cloudComparable,remainingHistory:[]}),
 readSingleSyncDatabase:async()=>{reads++;const s=structuredClone(cloud);if(mutate&&reads===2)s.bottles[0].current_remaining+=1;return s;}});
const key='shochu-keep-ledger-single-sync-test-v1';
function reset(){map.clear();map.set('baseline',JSON.stringify(base));map.set(key,JSON.stringify({phase:'stopped',userId:d.testRecord.userId}));c.singleSyncTest=c.createSingleSyncTest(storage,locks,true);c.cloudSyncPromise=null;reads=0;writes=0;pending=false;mutate=false;}
(async()=>{
 reset();await Promise.all([c.executeSingleSyncTest(),c.executeSingleSyncTest()]);assert.equal(writes,1);assert.equal(c.singleSyncTest.read().phase,'completed');assert.equal(reads,3);assert.equal(c.singleSyncTest.read().postBaselineAttempt,true);
 await c.executeSingleSyncTest();assert.equal(writes,1);
 c.singleSyncTest=c.createSingleSyncTest(storage,locks,true);await c.executeSingleSyncTest();assert.equal(writes,1);
 for(const mode of ['pending','cloudRace','cancel','baseline']){reset();if(mode==='pending')pending=true;if(mode==='cloudRace')mutate=true;if(mode==='cancel')c.window.confirm=()=>false;if(mode==='baseline')map.set('baseline',JSON.stringify({...base,comparisonSchema:'old'}));await c.executeSingleSyncTest();assert.equal(writes,0,mode);assert.equal(c.singleSyncTest.read().phase,'stopped');await c.executeSingleSyncTest();assert.equal(writes,0);c.window.confirm=()=>true;}
 let altered=structuredClone(cloud);altered.bottles[0].last_visited_at='2000-01-01';altered.bottles[0].last_updated_at='2000-01-01';altered.bottles[0].updated_at='2000-01-01';assert(Object.values(c.postBaselineSafetyDiff(cloud,altered)).every(x=>x.count===0));
 for(const field of ['current_remaining','kept_at','brand','id','status','store_id','notes','volume_ml']){let a=structuredClone(cloud);a.bottles[0][field]='changed';assert(c.postBaselineSafetyDiff(cloud,a).bottles.count>0);}
 console.log('PASS: post-migration only / real orchestration, synthetic transport / one cycle / concurrent click and reload blocked / prewrite race blocked / pending and old baseline blocked / cancel consumed / raw diff retained / excluded dates only / material changes detected');
})().catch(e=>{console.error(e);process.exitCode=1;});
