// Mobile (390x844 @3x) captures for the vertical teaser. Same mocks/routing as capture.mjs.
import {createRequire} from 'module';import fs from 'fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const DIR=new URL('.',import.meta.url).pathname,ROOT=DIR+'../../public',OUT=DIR+'public/shots/mobile/';
fs.mkdirSync(OUT,{recursive:true});
const mock=fs.readFileSync(DIR+'mock-supabase.js','utf8');
const API=JSON.parse(fs.readFileSync(DIR+'tailor-api.json','utf8'));
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,colorScheme:'light',isMobile:true,hasTouch:true});
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
const boxes={};
const page=await ctx.newPage();page.on('pageerror',e=>console.log('ERR',e.message));
await page.goto('http://app.local/career');
await page.addStyleTag({content:'.site-theme-btn{display:none!important}'});
await page.waitForSelector('article.job-row');
const settle=async()=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500)};
const shot=async(name,loc,opt={})=>{await settle();await (loc||page).screenshot({path:OUT+name+'.png',...opt});console.log('shot',name)};
await page.click('[data-view="leads"]');await page.waitForSelector('.lead-card');
await page.locator('.lead-card').first().evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-16));await page.waitForTimeout(300);
await shot('01-leads');
await shot('02-lead-card',page.locator('.lead-card').first());
await shot('07-lead-2',page.locator('.lead-card').nth(1));
await shot('08-lead-3',page.locator('.lead-card').nth(2));
boxes.leadBtn=await page.locator('.lead-card').first().locator('[data-lead-accept]').boundingBox();boxes.leadCard=await page.locator('.lead-card').first().boundingBox();
await page.click('.lead-card >> nth=0 >> [data-lead-accept]');
await page.waitForSelector('.lead-toast');
await page.addStyleTag({content:'.lead-toast{display:none!important}'});
await page.click('[data-view="jobs"]');
await page.waitForSelector('article.job-row');
const row=page.locator('article.job-row',{hasText:'Kestrel AI'}).first();
await row.waitFor();
await row.evaluate(e=>e.scrollIntoView({block:'center'}));await page.mouse.move(2,2);await page.waitForTimeout(300);boxes.prospectRow=await row.boundingBox();await shot('pipeline-prospect');await shot('row-prospect',row);
const id=await row.getAttribute('data-open');console.log('job',id);
await row.locator('h2').click();await page.waitForSelector('#tailor-detail');
await page.click('#tailor-detail');
await page.waitForSelector('#tailor-want-letter');
await page.check('#tailor-want-letter');
await page.click('#tailor-next');await page.waitForSelector('#tailor-why');
await page.fill('#tailor-why','Agent tooling is where I want to build next.');
await page.click('#tailor-next');
await page.waitForSelector('.tailor-doc',{timeout:30000});
await page.waitForTimeout(800);
await shot('03-tailor-resume');
await shot('04-tailor-resume-doc',page.locator('.tailor-doc').first());
await page.click('#lead-modal [aria-label="Close"], #lead-modal .lead-dialog-close, #lead-modal button:has-text("×")').catch(async()=>{await page.keyboard.press('Escape')});
await page.keyboard.press('Escape');await page.waitForTimeout(500);
const krow=page.locator(`article.job-row[data-open="${id}"]`);
const pill=page.locator(`[data-stage-menu="${id}"]`);
const stages=[['Applied','applied'],['Recruiter screen','screen'],['Interview loop','loop'],['Offer','offer']];
boxes.pill={};
for(const [st,key] of stages){
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  await krow.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(300);
  await pill.click();await page.waitForSelector('.stage-menu');
  await page.click(`.stage-menu [data-stage="${st}"]`);
  if(st==='Applied'){await page.waitForSelector('#lead-modal:not(.hidden)');await page.waitForTimeout(500);
    await page.click('#lead-modal button:has-text("Yes, I applied")');await page.waitForSelector('#lead-modal.hidden',{state:'attached'})}
  await page.waitForTimeout(700);
  await page.mouse.move(2,2);
  await krow.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(300);
  const rb=await krow.boundingBox(),pb=await pill.boundingBox();
  boxes.pill[key]={x:pb.x-rb.x,y:pb.y-rb.y,width:pb.width,height:pb.height};
  boxes.row=rb;boxes['list-'+key]=rb;
  if(key==='applied'){await shot('pipeline-applied')}
  await shot('row-'+key,krow);await shot('pill-'+key,pill);
}
fs.writeFileSync(OUT+'boxes.json',JSON.stringify(boxes,null,1));
await browser.close();
