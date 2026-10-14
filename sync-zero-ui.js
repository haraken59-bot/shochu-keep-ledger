const zeroConfig=window.SHOCHU_SUPABASE_CONFIG,zeroOrigin=new URL(zeroConfig.url).origin;
const zeroAuthKey='sb-'+new URL(zeroOrigin).hostname.split('.')[0]+'-auth-token';
let zeroRaw=localStorage.getItem(zeroAuthKey);let zeroSession;try{zeroSession=JSON.parse(zeroRaw);}catch{}
const zeroUid=zeroSession?.user?.id,zeroButton=document.getElementById('run'),zeroStatus=document.getElementById('status');
let zeroReport;
const zeroAuthButton=document.getElementById('auth'),zeroAuthStatus=document.getElementById('auth-status');
let zeroVerified=false,zeroAuthAttempted=false,zeroHalted=false;
zeroAuthButton.addEventListener('click',async()=>{
  if(zeroAuthAttempted||zeroHalted)return;
  zeroAuthAttempted=true;zeroAuthButton.disabled=true;zeroButton.disabled=true;
  zeroAuthStatus.textContent='認証だけを再取得しています。同期・基準更新は実行しません。';
  try{
    if(!navigator.locks?.request||!navigator.onLine)throw Error('通信または排他制御を確認できません。');
    await navigator.locks.request('shochu-baseline-execute1',{ifAvailable:true},async lock=>{
      if(!lock)throw Error('別タブで処理中です。');
      if(!zeroUid||!zeroSession?.refresh_token)throw Error('OTP再認証が必要です。ここで停止してください。');
      const ownerKey=BASELINE_DATA_KEYS[6];
      if(localStorage.getItem(ownerKey)!==zeroUid)throw Error('認証前の本人IDが一致しません。');
      const protectedKeys=[...BASELINE_DATA_KEYS,'shochu-keep-ledger-cloud-migration-v1:'+zeroUid,'shochu-baseline-execute1-attempt:'+zeroUid,'shochu-zero-sync-after-baseline-v1:'+zeroUid];
      const before=protectedKeys.map(k=>localStorage.getItem(k));
      const assertUnchanged=()=>{
        if(zeroHalted||localStorage.getItem(zeroAuthKey)!==zeroRaw||protectedKeys.some((k,i)=>localStorage.getItem(k)!==before[i]))throw Error('認証中に端末状態が変わりました。');
      };
      assertUnchanged();
      const response=await fetch(zeroOrigin+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',cache:'no-store',credentials:'omit',redirect:'error',
        headers:{apikey:zeroConfig.publishableKey,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:zeroSession.refresh_token}),signal:AbortSignal.timeout(20000)
      });
      if(response.status===400||response.status===401||response.status===403)throw Error('認証情報を更新できません。OTP再認証が必要です。ここで停止してください。');
      if(!response.ok)throw Error('認証サーバーで失敗しました。自動再試行はしません。');
      const next=await response.json();
      if(next.user?.id!==zeroUid)throw Error('認証後の本人IDが一致しません。');
      if(!next.access_token||!next.refresh_token||!Number.isFinite(next.expires_in)||next.expires_in<=0)throw Error('有効な認証応答ではありません。');
      const checked=await fetch(zeroOrigin+'/auth/v1/user',{
        method:'GET',cache:'no-store',credentials:'omit',redirect:'error',
        headers:{apikey:zeroConfig.publishableKey,Authorization:'Bearer '+next.access_token},signal:AbortSignal.timeout(20000)
      });
      if(!checked.ok)throw Error('認証後の本人確認に失敗しました。');
      if((await checked.json()).id!==zeroUid)throw Error('認証後の本人IDが一致しません。');
      assertUnchanged();
      const expiresAt=next.expires_at??Math.floor(Date.now()/1000)+next.expires_in;
      if(!Number.isFinite(expiresAt)||expiresAt*1000<=Date.now())throw Error('認証が期限切れです。');
      const raw=JSON.stringify({...next,expires_at:expiresAt});
      localStorage.setItem(zeroAuthKey,raw);zeroRaw=raw;zeroSession=JSON.parse(raw);
    });
    zeroVerified=true;
    zeroAuthStatus.textContent='認証済み・自動同期停止中・基準更新なし';
    zeroButton.disabled=localStorage.getItem('shochu-zero-sync-after-baseline-v1:'+zeroUid)!==null;
    zeroStatus.textContent=zeroButton.disabled?'同期確認は実行済みです。再実行しません。':'同期確認は未実行です。別ボタンを押すまで実行しません。';
  }catch(e){
    zeroHalted=true;zeroButton.disabled=true;
    zeroAuthStatus.textContent='停止しました：'+(e instanceof TypeError||e.name==='TimeoutError'?'通信に失敗しました。認証情報は保存していません。':e.message);
  }
});
function zeroOnline(){if(zeroHalted||!zeroVerified||!zeroUid||!zeroSession.access_token||zeroSession.expires_at*1000<=Date.now()||!zeroSession.expires_at||localStorage.getItem(zeroAuthKey)!==zeroRaw)throw Error('認証だけ再取得で本人確認してください。同期は停止中です。');return navigator.onLine;}
async function zeroGet(path){if(!zeroOnline())throw Error('オフラインです。');const r=await fetch(zeroOrigin+path,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',headers:{apikey:zeroConfig.publishableKey,Authorization:'Bearer '+zeroSession.access_token},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('読取り失敗 HTTP '+r.status);return r.json();}
async function zeroRead(table){if(!['stores','bottles','store_visits','remaining_updates','brand_labels'].includes(table))throw Error('対象外');const rows=[];for(let offset=0;offset<=100000;offset+=500){const page=await zeroGet('/rest/v1/'+table+'?select=*&user_id=eq.'+encodeURIComponent(zeroUid)+'&order=id&limit=500&offset='+offset);if(!Array.isArray(page))throw Error('形式不明');rows.push(...page);if(page.length<500)return rows;}throw Error('読取り上限');}
try{zeroOnline();zeroButton.disabled=localStorage.getItem('shochu-zero-sync-after-baseline-v1:'+zeroUid)!==null;zeroStatus.textContent=zeroButton.disabled?'実行済みです。再実行しません。':'未実行・自動同期停止中';}catch(e){zeroButton.disabled=true;zeroStatus.textContent=e.message;}
zeroButton.addEventListener('click',async()=>{zeroButton.disabled=true;try{if(!zeroOnline())throw Error('オフラインです。');zeroAuthButton.disabled=true;zeroReport=await runZeroSyncOnce({storage:localStorage,uid:zeroUid,locks:navigator.locks,online:zeroOnline,confirmRun:()=>confirm('1回のみ確認します。書込み要求は拒否し、失敗後も再実行しません。'),verifyIdentity:async()=>{if((await zeroGet('/auth/v1/user')).id!==zeroUid)throw Error('本人不一致');},readTable:zeroRead});zeroStatus.textContent=zeroReport.phase+' / 書込み0件 / 自動同期停止中'+(zeroReport.error?'\n'+zeroReport.error:'');}catch(e){zeroStatus.textContent='停止：'+e.message;}});
document.getElementById('export').addEventListener('click',()=>{const report=zeroReport||JSON.parse(localStorage.getItem('shochu-zero-sync-after-baseline-v1:'+zeroUid)||'null');if(!report){zeroStatus.textContent='記録はありません。';return;}const u=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='shochu-zero-sync-check.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
window.addEventListener('storage',()=>{zeroHalted=true;zeroVerified=false;zeroAuthButton.disabled=true;zeroButton.disabled=true;});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(async r=>{await r.update();await navigator.serviceWorker.ready;document.getElementById('cache').textContent=(await caches.keys()).includes('shochu-keep-ledger-v35-zero-sync-auth1')?'SWキャッシュ：shochu-keep-ledger-v35-zero-sync-auth1':'SW更新中。オンラインで開き直してください。';}).catch(()=>{document.getElementById('cache').textContent='SW更新未確認（35-zero-sync-auth1）';});
