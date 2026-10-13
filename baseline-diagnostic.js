// Independent read-only entry. No auth library, core mutation code, fetch, or SW registration.
function diagnoseBaseline(storage) {
  const output={version:'baseline-state-diagnostic-1',capturedAt:new Date().toISOString(),result:'判定不能',reason:'',evidence:null};
  const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
  const parse=(raw)=>raw===null?null:JSON.parse(raw);
  function comparison(raw,kind,current){
    const v=JSON.parse(raw),lens=kind==='revision'?{stores:6,bottles:current?9:11,visits:3,labels:3}:{stores:5,bottles:current?8:9,visits:2};
    if(!obj(v)||Object.keys(v).sort().join()!=='bottles,labels,stores,visits')throw Error('比較基準の形式が不明です。');
    for(const[k,n]of Object.entries(lens))if(!Array.isArray(v[k])||v[k].some(row=>!Array.isArray(row)||row.length!==n))throw Error('比較基準の列数が不明です。');
    if(kind==='comparable'&&(!Array.isArray(v.labels)||v.labels.some(x=>typeof x!=='string')))throw Error('ラベル形式不明です。');
    // Only primitive array data; never export arbitrary objects or unknown record properties.
    const safe=x=>x===null||['string','number','boolean'].includes(typeof x)||(Array.isArray(x)&&x.every(safe));
    if(!Object.values(v).every(safe))throw Error('比較基準に未知の値があります。');
    return v;
  }
  const canonical=v=>JSON.stringify(Object.fromEntries(Object.keys(v).sort().map(k=>[k,[...v[k]].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'ja'))])));
  function select(r){
    if(!obj(r))return null;
    const current=r.comparisonSchema==='v35-r2-c2';
    if(r.comparisonSchema&&!current)throw Error('未知の比較仕様です。');
    return {comparisonSchema:r.comparisonSchema??null,cloudRevision:comparison(r.cloudRevision,'revision',current),cloudComparable:comparison(r.cloudComparable,'comparable',current),cloudCheckedAt:typeof r.cloudCheckedAt==='string'?r.cloudCheckedAt:null};
  }
  try{
    const ownerKey='shochu-keep-ledger-cloud-owner-v1',owner=storage.getItem(ownerKey);
    if(!owner)throw Error('保存所有者がありません。認証情報からは推定しません。');
    const attemptKey='shochu-baseline-execute1-attempt:'+owner,recordKey='shochu-keep-ledger-cloud-migration-v1:'+owner;
    const ar=storage.getItem(attemptKey),rr=storage.getItem(recordKey),a=parse(ar),r=parse(rr);
    const current=select(r),mark=r?.baselineExecute1;
    output.evidence={attemptPresent:ar!==null,attempt:obj(a)?{phase:typeof a.phase==='string'?a.phase:null,startedAt:typeof a.startedAt==='string'?a.startedAt:null}:null,current,baselineExecute1:null};
    if(mark!==undefined){
      if(!obj(mark))throw Error('成功記録が不正です。');
      const previous=select(mark.previousRecord);
      const m={};for(const k of ['release','savedAt','substantiveDifferences','pendingChanges','localDataUnchanged','syncStillStopped','cloudReads'])if(['string','number','boolean'].includes(typeof mark[k]))m[k]=mark[k];
      output.evidence.baselineExecute1={...m,previousRecord:previous};
      if(!previous||!current||!obj(a)||a.phase!=='started'||!date(a.startedAt)||!date(m.savedAt)||Date.parse(m.savedAt)<Date.parse(a.startedAt)||current.comparisonSchema!=='v35-r2-c2'||current.cloudCheckedAt!==m.savedAt||m.release!=='35.0-baseline-1-execute1'||m.substantiveDifferences!==0||m.pendingChanges!==0||m.localDataUnchanged!==true||m.syncStillStopped!==true||m.cloudReads!==2)throw Error('成功記録・開始記録・確認日時が整合しません。');
      const old=JSON.parse(JSON.stringify(previous));
      if(old.comparisonSchema!=='v35-r2-c2'){
        old.cloudRevision.bottles=old.cloudRevision.bottles.map(row=>row.filter((_,i)=>i!==7&&i!==10));
        old.cloudComparable.bottles=old.cloudComparable.bottles.map(row=>row.filter((_,i)=>i!==6));
      }
      if(canonical(old.cloudRevision)!==canonical(current.cloudRevision)||canonical(old.cloudComparable)!==canonical(current.cloudComparable))throw Error('旧基準の変換結果と保存基準が一致しません。');
      output.result='基準更新が成功済み';output.reason='成功時だけ保存される記録・旧基準・日時・変換結果が整合しています（端末記録上の判定）。';
    }else if(obj(a)&&a.phase==='started'&&date(a.startedAt)&&current){
      output.result='実行開始のみで未完了';output.reason='開始記録はありますが、同時保存される成功記録がありません。今回の基準保存完了は記録されていません。';
    }else throw Error('開始または成功を示す十分な記録がありません。');
    if(storage.getItem(ownerKey)!==owner||storage.getItem(attemptKey)!==ar||storage.getItem(recordKey)!==rr)throw Error('読取り中に保存状態が変化しました。');
  }catch(e){output.result='判定不能';output.reason=e instanceof SyntaxError?'保存JSONが壊れているため判定できません。':e.message;}
  return output;
}
if(typeof document!=='undefined'){
  const report=diagnoseBaseline(localStorage);
  document.getElementById('result').textContent=report.result;
  document.getElementById('reason').textContent=report.reason;
  const button=document.getElementById('export');button.disabled=false;
  button.addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='shochu-baseline-state-diagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
