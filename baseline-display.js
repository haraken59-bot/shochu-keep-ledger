// Dedicated entry: app.js never runs. GET-only network, no token refresh or Auth writes.
const panel=document.createElement('main');
panel.style.cssText='max-width:640px;margin:40px auto;padding:24px;line-height:1.8';
const title=document.createElement('h1');title.textContent='Ver.35 baseline 1（基準更新専用・1回実行版）';
const message=document.createElement('p');message.textContent='同期停止中。基準更新以外の操作は無効です。基準更新はまだ実行していません。';
const detail=document.createElement('p');detail.textContent='識別子：'+BASELINE_RELEASE+'。最新クラウドを2回読み取り、実質差0・未送信0の場合だけ端末の比較基準を保存します。';
const button=document.createElement('button');button.disabled=true;button.textContent='比較基準だけを1回更新（同期しません）';
const status=document.createElement('p'),swStatus=document.createElement('p');swStatus.textContent='SW更新を確認中…';
panel.append(title,message,detail,button,status,swStatus);document.body.replaceChildren(panel);
const config=window.SHOCHU_SUPABASE_CONFIG,origin=new URL(config.url).origin;
const authKey='sb-'+new URL(origin).hostname.split('.')[0]+'-auth-token';
const sessionRaw=localStorage.getItem(authKey);
let session;try{session=JSON.parse(sessionRaw);}catch{}
const uid=session?.user?.id;
function sessionUnchanged(){
  if(!uid||!session?.access_token||!session.expires_at||session.expires_at*1000<=Date.now()||localStorage.getItem(authKey)!==sessionRaw)throw Error('有効なログイン状態を確認できません。通常版を開かず、この停止画面のままご報告ください。');
}
async function readOnlyGet(path){
  sessionUnchanged();
  if(!/^\/auth\/v1\/user$|^\/rest\/v1\/(stores|bottles|store_visits|remaining_updates|brand_labels)\?/.test(path))throw Error('許可されていない通信です。');
  const response=await fetch(origin+path,{method:'GET',cache:'no-store',redirect:'error',headers:{apikey:config.publishableKey,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('本人確認または読取りに失敗しました（HTTP '+response.status+'）。保存していません。');
  return response.json();
}
async function verifyIdentity(){const user=await readOnlyGet('/auth/v1/user');if(user.id!==uid)throw Error('本人確認が一致しません。');}
async function readCloud(){
  const result={};
  for(const table of ['stores','bottles','store_visits','remaining_updates','brand_labels']){
    result[table]=[];
    for(let offset=0;;offset+=500){
      const rows=await readOnlyGet('/rest/v1/'+table+'?select=*&user_id=eq.'+encodeURIComponent(uid)+'&order=id&limit=500&offset='+offset);
      if(!Array.isArray(rows))throw Error('読取り形式が不明です。');
      result[table].push(...rows);if(rows.length<500)break;
      if(offset>=100000)throw Error('データ件数上限のため停止しました。');
    }
  }
  return result;
}
function showEligibility(){
  try{
    sessionUnchanged();
    if(!navigator.onLine||!navigator.locks?.request)throw Error('オンライン状態と排他制御が必要です。');
    if(localStorage.getItem('shochu-baseline-execute1-attempt:'+uid)!==null)throw Error('この専用版は実行済みです。再実行しません。');
    const baseline=baselineRead(localStorage,'shochu-keep-ledger-cloud-migration-v1:'+uid,null);
    if(!baseline?.completedAt||localStorage.getItem(BASELINE_DATA_KEYS[6])!==uid)throw Error('移行済み本人の端末を確認できません。');
    baselineConvert(baseline);baselineLocal(localStorage);baselinePending(localStorage,uid);
    button.disabled=false;status.textContent='実行可能です。押すと1回分を消費します。失敗後も再実行しません。';
  }catch(e){button.disabled=true;status.textContent=e.message;}
}
button.addEventListener('click',async()=>{
  button.disabled=true;
  if(!confirm('DBには書き込みません。照合条件を満たす場合だけ端末の比較基準を1回更新します。実行しますか？')){status.textContent='実行していません。同期停止を維持します。';return;}
  status.textContent='本人確認・2回のクラウド照合中…';
  try{
    const report=await baselineCommitOnce({storage:localStorage,uid,locks:navigator.locks,online:()=>{sessionUnchanged();return navigator.onLine;},verifyIdentity,readCloud});
    status.textContent='基準保存成功。実質差0・未送信0・端末データ不変。同期停止を維持しています。確認時刻：'+report.savedAt;
  }catch(e){status.textContent='停止しました：'+e.message;}
});
window.addEventListener('storage',()=>{button.disabled=true;status.textContent='別タブの保存状態が変わったため停止しました。';});
showEligibility();
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(async r=>{
    await r.update();await navigator.serviceWorker.ready;
    swStatus.textContent=(await caches.keys()).includes('shochu-keep-ledger-v35-baseline-1-execute1')?'SWキャッシュ：shochu-keep-ledger-v35-baseline-1-execute1':'SW更新中です。オンラインで開き直してください。';
  }).catch(()=>{swStatus.textContent='SW更新未確認。オンラインで開き直してください。';});
}
