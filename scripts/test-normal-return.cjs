const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const server=http.createServer((req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(p==='/')p='/index.html';const f=path.join(process.cwd(),p);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({channel:'msedge',headless:true});try{
const c=await b.newContext(),p=await c.newPage(),errors=[],db=[];p.on('pageerror',e=>errors.push(e.message));
await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();if(u.hostname.endsWith('supabase.co'))db.push(u.pathname);return r.fulfill({status:200,contentType:'text/javascript',body:''});});
await p.goto(origin);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await p.evaluate(()=>navigator.serviceWorker.ready);
assert((await p.content()).includes('app.js?v=35.1-normal1'));assert(!(await p.content()).includes('baseline-display.js'));assert((await p.locator('body').innerText()).includes('Ver.35.1'));
await c.setOffline(true);await p.reload();assert((await p.locator('body').innerText()).includes('Ver.35.1'));await c.setOffline(false);
for(const name of ['sync-zero.html','baseline-diagnostic.html']){await p.goto(origin+'/'+name);assert((await p.locator('body').innerText()).includes('検証画面は終了しました'));assert.equal(await p.locator('script').count(),0);assert.equal(await p.locator('button').count(),0);}
assert.deepEqual(errors,[]);assert.deepEqual(db,[]);console.log('PASS normal startup / offline / retired pages inert / JS errors0 / isolated DB requests0');
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
