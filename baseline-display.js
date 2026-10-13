// Dedicated entry: no SDK, auth events, timers, or app.js. Explicit Auth refresh only.
const panel=document.createElement('main');
panel.style.cssText='max-width:640px;margin:40px auto;padding:24px;line-height:1.8';
const title=document.createElement('h1');title.textContent='Ver.35 baseline 1（認証再取得付き・基準更新専用）';
const message=document.createElement('p');message.textContent='同期停止中。認証再取得と基準更新以外の操作は無効です。基準更新はまだ実行していません。';
const authButton=document.createElement('button');authButton.textContent='認証だけ再取得';
const authStatus=document.createElement('p');
const detail=document.createElement('p');detail.textContent='配信識別子：35.0-baseline-1-auth1。基準更新は別操作です。最新クラウドを2回読み取り、実質差0・未送信0の場合だけ端末の比較基準を保存します。';
const button=document.createElement('button');button.disabled=true;button.textContent='比較基準だけを1回更新（同期しません）';
const status=document.createElement('p'),swStatus=document.createElement('p');swStatus.textContent='SW更新を確認中…';
panel.append(title,message,detail,authButton,authStatus,button,status,swStatus);document.body.replaceChildren(panel);
const config=window.SHOCHU_SUPABASE_CONFIG,origin=new URL(config.url).origin;
const authKey='sb-'+new URL(origin).hostname.split('.')[0]+'-auth-token';
let sessionRaw=localStorage.getItem(authKey);
let session;try{session=JSON.parse(sessionRaw);}catch{}
const uid=session?.user?.id;
let authAttempted=false,halted=false;
authButton.addEventListener('click',async()=>{
  if(authAttempted||halted)return;
  authAttempted=true;authButton.disabled=true;button.disabled=true;
  authStatus.textContent='認証だけを再取得しています。同期・基準更新は実行しません。';
  try{
    if(!navigator.locks?.request||!navigator.onLine)throw Error('通信または排他制御を確認できません。');
    await navigator.locks.request('shochu-baseline-execute1',{ifAvailable:true},async lock=>{
      if(!lock)throw Error('別タブで処理中です。');
      if(!uid||!session?.refresh_token)throw Error('OTP再認証が必要です。ここで停止してください。');
      const ownerKey=BASELINE_DATA_KEYS[6];
      if(localStorage.getItem(ownerKey)!==uid)throw Error('認証前の本人IDが一致しません。');
      const protectedKeys=[...BASELINE_DATA_KEYS,'shochu-keep-ledger-cloud-migration-v1:'+uid,'shochu-baseline-execute1-attempt:'+uid];
      const before=protectedKeys.map(k=>localStorage.getItem(k));
      const assertUnchanged=()=>{
        if(halted||localStorage.getItem(authKey)!==sessionRaw||protectedKeys.some((k,i)=>localStorage.getItem(k)!==before[i]))throw Error('認証中に端末状態が変わりました。');
      };
      assertUnchanged();
      const response=await fetch(origin+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',cache:'no-store',credentials:'omit',redirect:'error',
        headers:{apikey:config.publishableKey,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(20000)
      });
      if(response.status===400||response.status===401||response.status===403)throw Error('認証情報を更新できません。OTP再認証が必要です。ここで停止してください。');
      if(!response.ok)throw Error('認証サーバーで失敗しました。自動再試行はしません。');
      const next=await response.json();
      if(next.user?.id!==uid)throw Error('認証後の本人IDが一致しません。');
      if(!next.access_token||!next.refresh_token||!Number.isFinite(next.expires_in)||next.expires_in<=0)throw Error('有効な認証応答ではありません。');
      const checked=await fetch(origin+'/auth/v1/user',{
        method:'GET',cache:'no-store',credentials:'omit',redirect:'error',
        headers:{apikey:config.publishableKey,Authorization:'Bearer '+next.access_token},signal:AbortSignal.timeout(20000)
      });
      if(!checked.ok)throw Error('認証後の本人確認に失敗しました。');
      if((await checked.json()).id!==uid)throw Error('認証後の本人IDが一致しません。');
      assertUnchanged();
      const expiresAt=next.expires_at??Math.floor(Date.now()/1000)+next.expires_in;
      if(!Number.isFinite(expiresAt)||expiresAt*1000<=Date.now())throw Error('認証が期限切れです。');
      const raw=JSON.stringify({...next,expires_at:expiresAt});
      localStorage.setItem(authKey,raw);sessionRaw=raw;session=JSON.parse(raw);
    });
    authStatus.textContent='認証済み・同期停止中・基準更新は未実行';
    showEligibility(); // Local checks only. Never starts a baseline update.
  }catch(e){
    halted=true;button.disabled=true;
    authStatus.textContent='停止しました：'+(e instanceof TypeError||e.name==='TimeoutError'?'通信に失敗しました。認証情報は保存していません。':e.message);
  }
});
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
    if(halted)throw Error('停止中です。');
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
  if(halted)return;
  authButton.disabled=true;
  button.disabled=true;
  if(!confirm('DBには書き込みません。照合条件を満たす場合だけ端末の比較基準を1回更新します。実行しますか？')){status.textContent='実行していません。同期停止を維持します。';return;}
  status.textContent='本人確認・2回のクラウド照合中…';
  try{
    const report=await baselineCommitOnce({storage:localStorage,uid,locks:navigator.locks,online:()=>{sessionUnchanged();return navigator.onLine;},verifyIdentity,readCloud});
    status.textContent='基準保存成功。実質差0・未送信0・端末データ不変。同期停止を維持しています。確認時刻：'+report.savedAt;
  }catch(e){status.textContent='停止しました：'+e.message;}
});
window.addEventListener('storage',()=>{halted=true;authButton.disabled=true;button.disabled=true;status.textContent='別タブの保存状態が変わったため停止しました。';});
showEligibility();
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(async r=>{
    await r.update();await navigator.serviceWorker.ready;
    swStatus.textContent=(await caches.keys()).includes('shochu-keep-ledger-v35-baseline-1-auth1')?'SWキャッシュ：shochu-keep-ledger-v35-baseline-1-auth1':'SW更新中です。オンラインで開き直してください。';
  }).catch(()=>{swStatus.textContent='SW更新未確認。オンラインで開き直してください。';});
}
