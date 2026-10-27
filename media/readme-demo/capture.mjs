import {createRequire} from 'module';import fs from 'fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const DIR=new URL('.',import.meta.url).pathname,ROOT=DIR+'../../public',OUT=DIR+'public/shots/';
fs.mkdirSync(OUT,{recursive:true});
const mock=fs.readFileSync(DIR+'mock-supabase.js','utf8');
const API=JSON.parse(fs.readFileSync(DIR+'tailor-api.json','utf8'));
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:2,colorScheme:'light'});
await ctx.addInitScript(()=>{try{localStorage.setItem('site-theme','light');localStorage.setItem('career-job-filter','all');localStorage.setItem('career-job-view','list')}catch(e){}});
await ctx.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.hostname==='esm.sh'&&u.pathname.includes('supabase-js'))return r.fulfill({contentType:'application/javascript',body:mock});
 if(u.hostname==='app.local'){
  if(u.pathname==='/api/tailor'){const st=JSON.parse(r.request().postData()||'{}').step;return r.fulfill({contentType:'application/json',body:JSON.stringify(API[st])})}
  if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:JSON.stringify({status:'open',questions:[],note:'Posting is open.'})});
  let p=u.pathname;if(p.endsWith('/'))p+='index.html';else if(!p.includes('.'))p+='/index.html';
  const f=ROOT+p;if(fs.existsSync(f)){const ext=f.split('.').pop();return r.fulfill({contentType:{html:'text/html',js:'application/javascript',svg:'image/svg+xml',css:'text/css',json:'application/json'}[ext]||'application/octet-stream',body:fs.readFileSync(f)})}
  return r.fulfill({status:404,body:''})}
 return r.abort()});
const page=await ctx.newPage();page.on('pageerror',e=>console.log('ERR',e.message));
await page.goto('http://app.local/career');
await page.addStyleTag({content:'.site-theme-btn{display:none!important}'});
await page.waitForSelector('article.job-row');
const settle=async()=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500)};
const boxes={};const box=async(name,loc)=>{boxes[name]=await loc.boundingBox()};
const shot=async(name,loc)=>{await settle();await (loc||page).screenshot({path:OUT+name+'.png'});console.log('shot',name)};
await page.mouse.move(1500,880);
// leads
await page.click('[data-view="leads"]');await page.waitForSelector('.lead-card');
await box('01-card',page.locator('.lead-card').first());await box('01-tiles',page.locator('.lead-card').first().locator('.lead-tiles'));await shot('01-leads');
await shot('02-lead-card',page.locator('.lead-card').first());
await page.click('.lead-card >> nth=0 >> [data-lead-accept]');
await page.waitForSelector('.lead-toast');
await shot('03-toast');
await page.addStyleTag({content:'.lead-toast{display:none!important}'});
// pipeline
await page.click('[data-view="jobs"]');
await page.waitForSelector('article.job-row');
const row=page.locator('article.job-row',{hasText:'Kestrel AI'}).first();
await row.waitFor();
await box('04-pipeline',row);await shot('04-pipeline');
const id=await row.getAttribute('data-open');console.log('job',id);
await row.locator('h2').click();await page.waitForSelector('#tailor-detail');
await page.click('#tailor-detail');
await page.waitForSelector('#tailor-want-letter');
await page.check('#tailor-want-letter');
await shot('05-tailor-dialog');
await page.click('#tailor-next');await page.waitForSelector('#tailor-why');
await page.fill('#tailor-why','Agent tooling is where I want to build next.');
await shot('06-tailor-angle');
await page.click('#tailor-next');
await page.waitForSelector('.tailor-doc',{timeout:30000});
await page.waitForTimeout(800);
await shot('07-tailor-resume');
await shot('08-tailor-resume-doc',page.locator('.tailor-doc').first());
await page.click('.tailor-tabs [data-tab="letter"]');await page.waitForTimeout(400);
await shot('09-tailor-letter');
await shot('10-tailor-letter-doc',page.locator('.tailor-doc').first());

await page.click('#lead-modal [aria-label="Close"], #lead-modal .lead-dialog-close, #lead-modal button:has-text("×")').catch(async()=>{await page.keyboard.press('Escape')});
await page.waitForTimeout(500);
console.log('modal hidden?',await page.evaluate(()=>document.querySelector('#lead-modal')?.className));
const sel=`[data-stage-menu="${id}"]`;
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log(await page.locator(sel).count());
await page.click(sel);
await page.waitForSelector('.stage-menu');
await shot('11-stage-menu');
await page.click('.stage-menu [data-stage="Applied"]');
await page.waitForSelector('#lead-modal:not(.hidden)');
await page.waitForTimeout(500);
await page.evaluate(()=>document.activeElement&&document.activeElement.blur());
await shot('12-applied-dialog');
await page.click('#lead-modal button:has-text("Yes, I applied")');
await page.waitForSelector('#lead-modal.hidden',{state:'attached'});
await page.waitForTimeout(600);
const krow=page.locator(`article.job-row[data-open="${id}"]`);
await page.mouse.move(1500,880);
await krow.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(300);await box('13-row-applied',krow);await shot('13-row-applied');
await shot('13b-row-applied-crop',krow);
await page.addStyleTag({content:'main{max-width:1540px!important}.board-column{min-width:215px!important;width:215px!important;flex-basis:215px!important}'});
const toBoard=async(name)=>{await page.click('#view-board');await page.waitForSelector('.board-card');await page.mouse.move(1500,880);await box(name,page.locator('.board-card',{hasText:'Kestrel AI'}).first());await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:OUT+name+'.png',fullPage:true});await page.click('#view-list');await page.waitForSelector('article.job-row');await page.evaluate(()=>scrollTo(0,0));};
await page.evaluate(()=>scrollTo(0,0));await toBoard('14-board-applied');
for(const [st,n] of [['Recruiter screen','15-board-screen'],['Interview loop','16-board-loop'],['Offer','17-board-offer']]){
  await page.locator(`[data-stage-menu="${id}"]`).scrollIntoViewIfNeeded();await page.click(`[data-stage-menu="${id}"]`);await page.waitForSelector('.stage-menu');await page.waitForTimeout(300);
  await page.screenshot({path:OUT+'_dbg.png'});await page.click(`.stage-menu [data-stage="${st}"]`,{timeout:5000});await page.waitForTimeout(600);
  await toBoard(n);
}
const bb=await page.evaluate(()=>{const c=[...document.querySelectorAll('.board-card')].find(x=>x.textContent.includes('Kestrel'));return null});
fs.writeFileSync(OUT+'boxes.json',JSON.stringify(boxes,null,1));await browser.close();
