const day=n=>{const d=new Date(Date.now()+n*864e5);return d.toISOString().slice(0,10)};
const ts=n=>new Date(Date.now()+n*864e5).toISOString();
let id=0;const uid=()=>'00000000-0000-0000-0000-'+String(++id).padStart(12,'0');
const job=(company,title,stage,owner,next,nd,extra={})=>({id:uid(),company,title,stage,action_owner:owner,next_action:next,next_date:nd,location:'Remote (US)',created_at:ts(-20),updated_at:ts(-1),...extra});
const jobs=[
 job('Northwind Labs','Senior Product Manager, Platform','Interview loop','Me','Prep system-design walkthrough for final round',day(2),{recruiter:'Priya Shah',compensation:'$205K–$240K base',posting_url:'https://example.com/jobs/1',fit:'Platform APIs, developer experience, 0→1 launches.',notes:'Panel: VP Product, two EMs, design lead.'}),
 job('Lumen Health','Product Lead, Care Navigation','Recruiter screen','Company','Waiting on recruiter to confirm hiring-manager slot',day(1),{recruiter:'Marcus Lee'}),
 job('Fieldstone','Staff PM, Payments','Applied','Company','Follow up if no reply',day(4)),
 job('Orbital Analytics','Senior PM, Data Products','Applied','Me','Send thank-you note to referral',day(-1),{recruiter:'Dana Ortiz'}),
 job('Tidewater','Group PM, Growth','Offer','Me','Review offer and counter by Friday',day(3),{compensation:'$230K base + equity'}),
 job('Brightline Robotics','PM, Fleet Software','Prospect','Unassigned','Review posting and decide whether to apply',null),
 job('Cobalt Bank','Senior PM, Digital Lending','Recruiter outreach','Me','Reply to recruiter with availability',day(1),{recruiter:'Sam Whitfield'}),
 job('Harbor & Co','Principal PM, Marketplace','Interview loop','Company','Awaiting feedback from onsite',day(5)),
];
const ev=(rec,match,bl,fit,appeal,watch,scores,extra={})=>({recommendation:rec,match_type:match,bottom_line:bl,highlights:{fit,appeal,watch},why:[fit,'Roadmap ownership across a multi-team surface.'],appeal:[appeal],concerns:[watch],scores,role_summary:'Own the roadmap for a core product area, partner with engineering and design, and ship measurable outcomes.',...extra});
const leads=[
 {id:uid(),company:'Kestrel AI',title:'Senior Product Manager, Developer Platform',location:'Remote (US)',url:'https://example.com/l1',source:'greenhouse',posted_at:ts(-1),base_min:210000,base_max:255000,score:93,description:'Kestrel AI is hiring a Senior Product Manager for Agent Tooling. You will own the developer-facing SDK, CLI and dashboard that teams use to build, test and ship AI agents. You will partner with engineering, research and design to define the roadmap, run discovery with developers, set adoption and retention metrics, and launch new capabilities from beta to general availability.\n\nRequirements: 6+ years of product management, including developer platforms or APIs. Experience taking products from 0 to 1. Comfort with usage-based pricing. Strong written communication. Nice to have: hands-on experience with LLM applications, open-source community building.',evaluation:ev('Strong apply','exact','Squarely your lane: API platform, developer adoption metrics, and a team that ships weekly.','You led an API platform from beta to GA with 4x developer growth.','Tier-1 favorite company with a fast-growing developer product.','Hybrid preference stated; confirm remote is truly fully remote.',{responsibilities_fit:24,product_interest:19,career_progression:13,compensation:14,company_quality:9,work_arrangement:9,freshness:5},{bump:{points:3}})},
 {id:uid(),company:'Meridian Health',title:'Product Lead, Patient Experience',location:'New York, NY (Hybrid)',url:'https://example.com/l2',source:'lever',posted_at:ts(-2),base_min:190000,base_max:225000,score:84,evaluation:ev('Apply','adjacent','Good scope and mission fit; healthcare domain is new but your workflow-product experience transfers.','Owned end-to-end scheduling flows used by 2M+ users.','Mission-driven team, lead title is a step up in scope.','3 days in office; commute from your home city is long.',{responsibilities_fit:21,product_interest:17,career_progression:13,compensation:12,company_quality:8,work_arrangement:6,freshness:5})},
 {id:uid(),company:'Quarry',title:'Senior PM, Search & Discovery',location:'Remote (US)',url:'https://example.com/l3',source:'ashby',posted_at:ts(-3),base_min:180000,base_max:215000,score:78,evaluation:ev('Consider','adjacent','Solid role, but pay sits near your floor and search ranking is outside your strongest stories.','Experimentation-heavy roadmap matches your A/B testing track record.','Small, senior team with direct access to founders.','Base range tops out just above your minimum.',{responsibilities_fit:19,product_interest:15,career_progression:11,compensation:9,company_quality:8,work_arrangement:10,freshness:4})},
];
const activities=[
 {id:uid(),job_id:jobs[0].id,kind:'Interview',summary:'Hiring-manager interview with VP Product',details:'Went well. Asked about platform pricing and migration strategy. Next: final panel.',occurred_at:ts(-2),direction:'incoming',status:'completed',stage_at_time:'Interview loop'},
 {id:uid(),job_id:jobs[0].id,kind:'Email',summary:'Recruiter sent final-round schedule',details:'Four 45-minute sessions on Thursday.',occurred_at:ts(-1),direction:'incoming',status:'completed'},
 {id:uid(),job_id:jobs[4].id,kind:'Offer',summary:'Verbal offer from Tidewater',details:'$230K base, 0.1% equity, 4-year vest. Written offer to follow.',occurred_at:ts(-1),direction:'incoming',status:'completed'},
 {id:uid(),job_id:jobs[1].id,kind:'Call',summary:'Recruiter screen with Marcus',details:'30 minutes. Comp range confirmed. Moving to HM.',occurred_at:ts(-3),direction:'incoming',status:'completed'},
 {id:uid(),job_id:jobs[2].id,kind:'Applied',summary:'Applied to Fieldstone — Staff PM, Payments',details:'Resume sent: Resume_Fieldstone_v2.pdf',occurred_at:ts(-4),direction:'outgoing',status:'completed',stage_at_time:'Applied'},
 {id:uid(),job_id:jobs[3].id,kind:'Applied',summary:'Applied to Orbital Analytics — Senior PM, Data Products',occurred_at:ts(-6),direction:'outgoing',status:'completed',stage_at_time:'Applied'},
];
const documents=[
 {id:uid(),name:'Resume — Kestrel AI',kind:'resume',description:'Tailored for Kestrel AI — Senior PM, Agent Tooling',created_at:ts(-1),document_versions:[{id:uid(),version_number:2,storage_path:'a.pdf',mime_type:'application/pdf',file_size:84000,created_at:ts(-1)}]},
 {id:uid(),name:'Cover letter — Northwind Labs',kind:'cover_letter',description:'Tailored for Northwind Labs — Senior Product Manager, Platform',created_at:ts(-5),document_versions:[{id:uid(),version_number:1,storage_path:'b.docx',mime_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',file_size:22000,created_at:ts(-5)}]},
 {id:uid(),name:'Base resume',kind:'resume',description:'Master one-page resume',created_at:ts(-30),document_versions:[{id:uid(),version_number:4,storage_path:'c.pdf',mime_type:'application/pdf',file_size:91000,created_at:ts(-8)}]},
];
const tables={jobs,job_leads:leads.map(l=>({...l,status:'review'})),activities,documents,document_versions:[],job_documents:[],job_agent_runs:[{finished_at:ts(-0.2),stats:{postings_seen:1842,new_pending:27,scored:15}}],interview_rounds:[],contacts:[]};
function q(t){const f=[];let single=false,op='select',payload=null;const b={select(){return b},order(){return b},limit(){return b},gte(){return b},in(){return b},is(){return b},neq(){return b},ilike(){return b},
 eq(k,v){f.push([k,v]);return b},single(){single=true;return b},maybeSingle(){single=true;return b},
 insert(o){op='insert';payload=o;return b},update(o){op='update';payload=o;return b},delete(){op='delete';return b},upsert(o){op='insert';payload=o;return b},
 then(res,rej){const tab=tables[t]||(tables[t]=[]);let rows;
  if(op==='insert'){rows=[].concat(payload).map(o=>({id:uid(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...o}));if(t==='jobs'||t==='activities')tab.unshift(...rows);else tab.push(...rows)}
  else{rows=tab.filter(r=>f.every(([k,v])=>r[k]===undefined||String(r[k])===String(v)));
   if(op==='update')rows.forEach(r=>Object.assign(r,payload,{updated_at:new Date().toISOString()}));
   if(op==='delete')rows.forEach(r=>tab.splice(tab.indexOf(r),1))}
  return Promise.resolve({data:single?rows[0]||null:rows,error:null}).then(res,rej)}};return b}
export function createClient(){return{
 auth:{getUser:async()=>({data:{user:{id:'u1',email:'you@example.com'}}}),getSession:async()=>({data:{session:{access_token:'x'}}}),onAuthStateChange(cb){setTimeout(()=>cb('SIGNED_IN',{}),0);return{data:{subscription:{unsubscribe(){}}}}}},
 from:q,storage:{from(){return{createSignedUrl:async()=>({data:{signedUrl:'#'},error:null}),upload:async()=>({data:{},error:null}),download:async()=>({data:new Blob(),error:null})}}}}}
