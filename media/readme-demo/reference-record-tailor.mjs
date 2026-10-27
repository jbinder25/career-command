import {createRequire} from 'module';import fs from 'fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const ROOT='/home/user/career-console-template/public',DIR=new URL('.',import.meta.url).pathname,OUT=DIR+'tframes/';
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT);
const mock=fs.readFileSync(DIR+'../mock-supabase.js','utf8'),stage=fs.readFileSync(DIR+'stage.html');
const API=JSON.parse(fs.readFileSync(DIR+'tailor-api.json','utf8'));const FPS=15,browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,colorScheme:'dark'});
await ctx.addInitScript(()=>{try{localStorage.setItem('site-theme','dark');localStorage.setItem('career-job-filter','all');localStorage.setItem('career-job-view','list')}catch(e){}});
await ctx.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.hostname==='esm.sh'&&u.pathname.includes('supabase-js'))return r.fulfill({contentType:'application/javascript',body:mock});
 if(u.hostname==='app.local'){if(u.pathname==='/__stage')return r.fulfill({contentType:'text/html',body:stage});
  if(u.pathname==='/api/tailor'){const st=JSON.parse(r.request().postData()||'{}').step;await new Promise(z=>setTimeout(z,st==='gap'?2500:3500));return r.fulfill({contentType:'application/json',body:JSON.stringify(API[st])})}
  if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:JSON.stringify({status:'open',questions:[],note:'Posting is open.'})});
  let p=u.pathname;if(p.endsWith('/'))p+='index.html';else if(!p.includes('.'))p+='/index.html';
  const f=ROOT+p;if(fs.existsSync(f)){const ext=f.split('.').pop();return r.fulfill({contentType:{html:'text/html',js:'application/javascript',svg:'image/svg+xml'}[ext]||'application/octet-stream',body:fs.readFileSync(f)})}
  return r.fulfill({status:404,body:''})}
 return r.continue()});
const page=await ctx.newPage();page.on('pageerror',e=>console.log('ERR',e.message));
await page.goto('http://app.local/__stage');await page.waitForTimeout(3000);
const app=page.frameLocator('#app');
// hide the app's floating theme button so the frame stays clean
await page.frame({url:/\/career/}).addStyleTag({content:'.site-theme-btn{display:none!important}'});
let n=0,cur={x:1180,y:720},pressed=false;
const shot=async()=>{await page.evaluate(([x,y,p])=>setCursor(x,y,p),[cur.x,cur.y,pressed]);await page.screenshot({path:OUT+String(n++).padStart(4,'0')+'.png'})};
const io=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
async function hold(s){for(let i=0;i<Math.round(s*FPS);i++){await page.waitForTimeout(25);await shot()}}
async function moveTo(x,y,s){const a={...cur},k=Math.round(s*FPS),arc=Math.min(60,Math.hypot(x-a.x,y-a.y)*.12);
 for(let i=1;i<=k;i++){const e=io(i/k);cur={x:a.x+(x-a.x)*e,y:a.y+(y-a.y)*e-Math.sin(Math.PI*e)*arc};await page.mouse.move(cur.x,cur.y);await shot()}}
async function target(sel,dx=.5,dy=.5){const b=await app.locator(sel).first().boundingBox();return [b.x+b.width*dx,b.y+b.height*dy]}
async function click(){pressed=true;await shot();await page.mouse.down();await page.mouse.up();pressed=false;
 for(let i=1;i<=5;i++){await page.evaluate(([x,y,k])=>ring(x,y,k),[cur.x,cur.y,i/5]);await page.waitForTimeout(25);await shot()}await page.evaluate(()=>ring(0,0,0))}
await page.evaluate(()=>intro(10));
const F=page.frame({url:/\/career/});
const scrollIn=async(sel,px,steps)=>{for(let i=0;i<steps;i++){await F.evaluate(([sel,px])=>{let e=document.querySelector(sel);while(e&&!(e.scrollHeight>e.clientHeight+2&&getComputedStyle(e).overflowY!=='visible'))e=e.parentElement;e&&e.scrollBy(0,px)},[sel,px]);await page.waitForTimeout(25);await shot()}};
async function type(text){for(const ch of text){await page.keyboard.type(ch);await shot()}}
cur={x:900,y:560};await hold(.6);
await moveTo(...await target('[data-open="00000000-0000-0000-0000-000000000006"] h2'),0.9);await hold(.15);await click();await hold(.7);
await moveTo(...await target('#tailor-detail'),0.8);await hold(.2);await click();await hold(.9);
await moveTo(...await target('#tailor-want-letter'),0.7);await hold(.15);await click();await hold(.5);
await moveTo(...await target('#tailor-fitcheck'),0.7);await hold(.15);await click();await hold(1.0);
await F.waitForSelector('.gap-groups');await hold(1.2);
await moveTo(...await target('.lead-dialog-body',.6,.6),0.5);await scrollIn('.gap-groups',40,10);await hold(1.0);
await moveTo(...await target('#tailor-next'),0.7);await hold(.15);await click();await hold(.5);
await moveTo(...await target('#tailor-why'),0.6);await click();await type('Agent tooling is where I want to build next');await hold(.4);
await moveTo(...await target('#tailor-next'),0.8);await hold(.15);await click();await hold(1.4);
await F.waitForSelector('.tailor-doc');await hold(1.0);
await moveTo(...await target('.tailor-doc',.7,.5),0.6);await scrollIn('.tailor-doc',35,16);await hold(1.0);
await moveTo(...await target('.tailor-tabs [data-tab="letter"]'),0.8);await hold(.15);await click();await hold(2.0);
await moveTo(...await target('#tailor-save'),0.8);await hold(.2);await click();await hold(1.0);
await F.waitForSelector('#lead-modal.hidden',{state:'attached'}).catch(()=>{});await hold(2.2);
console.log('frames',n);await browser.close();
