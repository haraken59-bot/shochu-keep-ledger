const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.js','utf8');
function extract(n){let i=src.indexOf(`function ${n}(`);let start=src.slice(i-6,i)==='async '?i-6:i;let end=src.indexOf('\nfunction ',i+1);let ae=src.indexOf('\nasync function ',i+1);if(ae>=0&&ae<end)end=ae;return src.slice(start,end);}
const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
function setup(){
 const store=new Map([['baseline',JSON.stringify({...d.savedBaseline,completedAt:'yes'})]]);let writes=0,reads=0;
 const c={JSON,Date,Set,Map,Error,sortCanonicalRows:null,authSession:{user:{id:d.testRecord.userId}},SINGLE_SYNC_DIAGNOSTIC_ONLY:true,
 navigator:{onLine:true,locks:{request:async(k,o,f)=>f({})}},singleSyncTest:{active:()=>true,read:()=>d.testRecord},
 cloudSyncPromise:null,cloudSyncQueued:false,cloudSyncTimer:null,isCloudSyncEnabled:()=>true,hasPendingCloudChanges:()=>false,
 cloudMigrationStorageKey:()=> 'baseline',createLocalComparable:()=>d.localComparableAtCapture,
 localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{assert.equal(k,'baseline');writes++;store.set(k,v);}},
 readSingleSyncDatabase:async()=>{reads++;return structuredClone(d.testRecord.after);},
 STORAGE_KEY:'b',LABELS_KEY:'l',STORE_LOCATIONS_KEY:'p',STORE_SETTINGS_KEY:'s',STORE_VISITS_KEY:'v',REMAINING_HISTORY_KEY:'h'};
 vm.createContext(c);for(const n of ['sortCanonicalRows','cloudCoordinate','comparableLocation','normalizeClosedWeekdays','createCloudRevision','createCloudComparable','singleSyncDatabaseDiff','convertLegacyBaselineV35','migrateComparisonBaselineV35'])vm.runInContext(extract(n),c);
 return {c,store,writes:()=>writes,reads:()=>reads};
}
(async()=>{
 let t=setup();const r=await t.c.migrateComparisonBaselineV35();assert.equal(t.writes(),1);assert.equal(t.reads(),2);assert.equal(r.substantiveDifferences,0);assert.equal(JSON.parse(t.store.get('baseline')).baselineMigration.before.cloudRevision,d.savedBaseline.cloudRevision);
 await assert.rejects(t.c.migrateComparisonBaselineV35());assert.equal(t.writes(),1);
 for(const type of ['pending','user','cloud','local','secondRead','storage']){
 t=setup();if(type==='pending')t.c.hasPendingCloudChanges=()=>true;
 if(type==='user')t.c.authSession.user.id='other';
 if(type==='local')t.c.createLocalComparable=()=> '{}';
 if(type==='cloud'||type==='secondRead'){let n=0;t.c.readSingleSyncDatabase=async()=>{let s=structuredClone(d.testRecord.after);if(type==='cloud'||++n===2)s.bottles[0].current_remaining+=1;return s;};}
 if(type==='storage')t.c.localStorage.setItem=()=>{throw Error('quota');};
 await assert.rejects(t.c.migrateComparisonBaselineV35());assert.equal(t.writes(),0,type);
 }
 console.log('PASS: actual old baseline 56 bottles / two reads / baseline-only atomic write / original retained / second execution refused / pending, identity, cloud, local, race, storage failure stop');
})().catch(e=>{console.error(e);process.exitCode=1;});
