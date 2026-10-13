const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('baseline-core.js','utf8').replace(/\r\n/g,'\n');
const ctx=vm.createContext({});vm.runInContext(source,ctx);
const prefix='shochu-keep-ledger-',uid='synthetic-user',key=prefix+'cloud-migration-v1:'+uid;
function fixture(){
 const cloud={stores:[{id:'s1',user_id:uid,name:'Test store',closed_weekdays:[]}],bottles:[{id:'b1',user_id:uid,legacy_id:'local1',store_id:'s1',brand:'Test brand',volume_ml:900,current_remaining:50,kept_at:'2026-01-01',status:'active',notes:''}],store_visits:[{id:'v1',user_id:uid,store_id:'s1',visited_on:'2026-02-01'}],brand_labels:[],remaining_updates:[]};
 const args=[cloud.stores,cloud.bottles,cloud.store_visits,cloud.brand_labels];
 const record={completedAt:'test',comparisonSchema:'v35-r2-c2',cloudRevision:ctx.createCloudRevision(...args),cloudComparable:ctx.createCloudComparable(...args),cloudCheckedAt:'old'};
 const data={[key]:JSON.stringify(record),[prefix+'cloud-owner-v1']:uid,[prefix+'v1']:JSON.stringify([{id:'local1',store:'Test store',name:'Test brand',volume:900,remaining:50,startedAt:'2026-01-01',notes:''}]),[prefix+'store-visits-v1']:JSON.stringify([{store:'Test store',visitedAt:'2026-02-01'}])};
 return {cloud,record,data};
}
function setup(){const f=fixture(),map=new Map(Object.entries(f.data)),writes=[];let reads=0;
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v);}};
 const options={storage,uid,locks:{request:async(n,o,fn)=>fn({})},online:()=>true,verifyIdentity:async()=>{},readCloud:async()=>{reads++;return structuredClone(f.cloud);}};
 return {...f,map,writes,options,reads:()=>reads};}
async function run(){
 let t=setup(),before=t.map.get(key);await ctx.baselineCommitOnce(t.options);
 assert.equal(t.reads(),2);assert.equal(t.writes.filter(k=>k===key).length,1);assert.deepEqual(JSON.parse(t.map.get(key)).baselineExecute1.previousRecord,JSON.parse(before));
 for(const [k,v]of Object.entries(t.data))if(k!==key)assert.equal(t.map.get(k),v);
 await assert.rejects(ctx.baselineCommitOnce(t.options));
 t=setup();let old=JSON.parse(t.map.get(key));delete old.comparisonSchema;for(const k of ['cloudRevision','cloudComparable']){let v=JSON.parse(old[k]);v.bottles=v.bottles.map(row=>k==='cloudRevision'?[...row.slice(0,7),'legacy-date',...row.slice(7),'old-timestamp']:[...row.slice(0,6),'legacy-date',...row.slice(6)]);old[k]=JSON.stringify(v);}t.map.set(key,JSON.stringify(old));await ctx.baselineCommitOnce(t.options);assert.equal(JSON.parse(t.map.get(key)).cloudRevision,t.record.cloudRevision);
 const cases=['pending','owner','identity','offline','local','cloud','secondRead','localRace','baselineRace','unknown','quota','lock'];
 for(const type of cases){t=setup();let n=0;
  if(type==='pending')t.map.set(prefix+'pending-labels-v1:'+uid,'{"x":1}');
  if(type==='owner')t.map.set(prefix+'cloud-owner-v1','other');
  if(type==='identity')t.options.verifyIdentity=async()=>{throw Error('auth');};
  if(type==='offline')t.options.online=()=>false;
  if(type==='local')t.map.set(prefix+'v1','[]');
  if(type==='unknown')t.map.set(key,JSON.stringify({...t.record,comparisonSchema:'unknown'}));
  if(type==='quota')t.options.storage.setItem=(k,v)=>{if(k===key)throw Error('quota');t.map.set(k,v);};
  if(type==='lock')t.options.locks.request=async(n,o,fn)=>fn(null);
  if(['cloud','secondRead','localRace','baselineRace'].includes(type))t.options.readCloud=async()=>{n++;let s=structuredClone(t.cloud);if(type==='cloud'||(type==='secondRead'&&n===2))s.bottles[0].current_remaining=60;if(type==='localRace')t.map.set(prefix+'v1','[]');if(type==='baselineRace')t.map.set(key,'changed');return s;};
  await assert.rejects(ctx.baselineCommitOnce(t.options),undefined,type);assert(!t.writes.includes(key),type);
 }
 const app=fs.readFileSync('app.js','utf8').replace(/\r\n/g,'\n');for(const name of ['sortCanonicalRows','cloudCoordinate','comparableLocation','createCloudRevision','createCloudComparable','normalizeClosedWeekdays']){const start=app.indexOf('function '+name+'('),end=app.indexOf('\n}',start)+2;assert(source.includes(app.slice(start,end)),name);}
 assert(!fs.readFileSync('index.html','utf8').includes('src="app.js'));
 console.log('PASS baseline: current/legacy success, two reads, old record preserved, data unchanged, repeat refused, 12 stop cases, helper compatibility');
}
module.exports={fixture,uid,key};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
