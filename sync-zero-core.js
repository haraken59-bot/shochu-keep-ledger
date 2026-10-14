async function runZeroSyncOnce({storage,uid,locks,readTable,verifyIdentity,confirmRun,online}) {
 if(!locks?.request)throw Error('排他制御が使えません。');
 return locks.request('shochu-baseline-execute1',{ifAvailable:true},async lock=>{
  if(!lock)throw Error('別タブで処理中です。');
  const key='shochu-zero-sync-after-baseline-v1:'+uid;
  if(storage.getItem(key)!==null)throw Error('この確認は実行済みです。再実行しません。');
  const report={version:'zero-sync-after-baseline-1',phase:'started',startedAt:new Date().toISOString(),dbWrites:{count:0,targets:[]},blockedWrites:[],before:null,after:null,differences:null};
  const save=()=>storage.setItem(key,JSON.stringify(report));save();
  const baselineKey='shochu-keep-ledger-cloud-migration-v1:'+uid;
  const keys=[...BASELINE_DATA_KEYS,baselineKey],original=keys.map(k=>storage.getItem(k));
  const unchanged=()=>{if(!online()||keys.some((k,i)=>storage.getItem(k)!==original[i]))throw Error('端末または認証状態が変化しました。');baselinePending(storage,uid);};
  const tables=['stores','bottles','store_visits','remaining_updates','brand_labels'];
  const checkRows=(table,rows)=>{if(!tables.includes(table)||!Array.isArray(rows)||rows.some(r=>r.user_id!==uid)||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('本人データの読取りを確認できません。');return rows;};
  const all=async()=>{const s={};for(const t of tables)s[t]=checkRows(t,await readTable(t));return s;};
  const canon=x=>JSON.stringify(Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))));
  const diff=(a,b)=>Object.fromEntries(tables.map(t=>{
   const x=new Map(a[t].map(r=>[r.id,r])),y=new Map(b[t].map(r=>[r.id,r]));
   return[t,[...new Set([...x.keys(),...y.keys()])].flatMap(id=>{
    const before=x.get(id),after=y.get(id);if(before&&after&&canon(before)===canon(after))return[];
    const fields=[...new Set([...Object.keys(before||{}),...Object.keys(after||{})])].filter(k=>JSON.stringify(before?.[k])!==JSON.stringify(after?.[k]));
    return[{id,fields,before:before??null,after:after??null}];
   })];
  }));
  try{
   if(!confirmRun())throw Error('キャンセルしました。再実行しません。');
   const baseline=JSON.parse(storage.getItem(baselineKey));
   if(storage.getItem(BASELINE_DATA_KEYS[6])!==uid||baseline?.comparisonSchema!=='v35-r2-c2'||!baseline.baselineExecute1?.savedAt||baseline.cloudCheckedAt!==baseline.baselineExecute1.savedAt)throw Error('成功済みVer.35基準を確認できません。');
   const expected=baselineConvert(baseline),local=baselineLocal(storage);
   const matches=s=>{if(createCloudRevision(s.stores,s.bottles,s.store_visits,s.brand_labels)!==expected.revision||createCloudComparable(s.stores,s.bottles,s.store_visits,s.brand_labels)!==expected.comparable||local!==expected.comparable)throw Error('想定外の実質差分があるため書込み前に停止しました。');};
   unchanged();await verifyIdentity();report.before=await all();unchanged();matches(report.before);
   report.preflight={safe:true,substantiveDifferences:0,pending:0};report.phase='checking-normal-sync';save();
   const bottles=JSON.parse(storage.getItem(BASELINE_DATA_KEYS[0])),visits=JSON.parse(storage.getItem(BASELINE_DATA_KEYS[4]));
   const locations=JSON.parse(storage.getItem(BASELINE_DATA_KEYS[2])||'{}'),settings=JSON.parse(storage.getItem(BASELINE_DATA_KEYS[3])||'{}');
   const stores=[...new Set([...bottles.map(b=>b.store),...visits.map(v=>v.store),...Object.keys(locations),...Object.keys(settings)])];
   await verifyNormalSyncNoWrites({bottles,visits,locations,settings,stores},uid,async t=>{unchanged();const rows=checkRows(t,await readTable(t));unchanged();return rows;},report.blockedWrites);
   report.after=await all();report.differences=diff(report.before,report.after);unchanged();matches(report.after);
   // Preserve raw date/timestamp differences for inspection; ignore only legacy bottle dates in substantive verdict.
   const material=Object.entries(report.differences).some(([t,rows])=>rows.some(r=>!r.before||!r.after||r.fields.some(f=>t!=='bottles'||!['last_visited_at','last_updated_at','updated_at'].includes(f))));
   if(material)throw Error('確認前後のDBに想定外変更があります。');
   report.phase='completed';report.result='zero-write-sync-verified';report.syncStillStopped=true;
  }catch(e){report.phase='stopped';report.error=e.message;report.syncStillStopped=true;}
  report.writeRequests={count:report.blockedWrites.length,targets:report.blockedWrites};
  report.finishedAt=new Date().toISOString();save();return report;
 });
}
