const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright'),{fixture,uid,key}=require('./test-baseline-execute.cjs');
const server=http.createServer((req,res)=>{try{const n=new URL(req.url,'http://localhost').pathname,p=path.join(process.cwd(),n==='/'?'index.html':n);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const mode of ['success','other-token','other-user','network','expired','no-refresh','already-used']){
  const c=await b.newContext({serviceWorkers:'block'}),requests=[],errors=[],f=fixture();
  await c.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(u.origin===origin)return r.continue();requests.push({method:q.method(),path:u.pathname});
   if(mode==='network')return r.abort();
   if(u.pathname==='/auth/v1/token'&&q.method()==='POST')return r.fulfill({status:mode==='expired'?400:200,json:mode==='expired'?{error:'invalid_grant'}:{user:{id:mode==='other-token'?'someone-else':uid},access_token:'synthetic-new',refresh_token:'synthetic-refresh-new',expires_in:3600}});
   if(u.pathname==='/auth/v1/user'&&q.method()==='GET')return r.fulfill({json:{id:mode==='other-user'?'someone-else':uid}});
   return r.abort();
  });
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);
  await p.evaluate(({data,mode})=>{for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);const host=new URL(window.SHOCHU_SUPABASE_CONFIG.url).hostname.split('.')[0];localStorage.setItem('sb-'+host+'-auth-token',JSON.stringify({user:{id:'synthetic-user'},access_token:'synthetic-old',refresh_token:mode==='no-refresh'?undefined:'synthetic-refresh',expires_at:1}));if(mode==='already-used')localStorage.setItem('shochu-baseline-execute1-attempt:synthetic-user','used');},{data:f.data,mode});
  await p.reload();const before=await p.evaluate(()=>({...localStorage}));assert.equal(requests.length,0);
  await p.evaluate(()=>{window.baselineCalls=0;baselineCommitOnce=async()=>{window.baselineCalls++;throw Error('Unexpected baseline call');};});
  const auth=p.getByRole('button',{name:'認証だけ再取得',exact:true}),base=p.getByRole('button',{name:'比較基準だけを1回更新（同期しません）',exact:true});
  assert(await base.isDisabled());await auth.click();await p.waitForFunction(()=>document.body.textContent.includes('認証済み・同期停止中・基準更新は未実行')||document.body.textContent.includes('停止しました：'));
  await p.evaluate(()=>{window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new CustomEvent('SIGNED_IN'));window.dispatchEvent(new CustomEvent('TOKEN_REFRESHED'));});
  const after=await p.evaluate(()=>({...localStorage}));const changed=Object.keys({...before,...after}).filter(k=>before[k]!==after[k]);
  if(['success','already-used'].includes(mode)){assert.equal(changed.length,1);assert(changed[0].endsWith('-auth-token'));assert.equal(await base.isEnabled(),mode==='success');}else{assert.deepEqual(changed,[]);assert(await base.isDisabled());}
  if(['expired','no-refresh'].includes(mode))assert((await p.locator('body').innerText()).includes('OTP再認証が必要'));
  assert.equal(after[key],before[key]);assert.equal(await p.evaluate(()=>window.baselineCalls),0);assert.equal(await p.evaluate(()=>typeof scheduleCloudSync),'undefined');assert(await auth.isDisabled());assert(requests.every(x=>x.path.startsWith('/auth/v1/')));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({case:mode,authRequests:requests.length,dataRequests:0,baselineChanges:0,appDataChanges:0,errors:0}));await c.close();
 }
 }finally{await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
