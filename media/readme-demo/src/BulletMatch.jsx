import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate,spring,Easing} from 'remotion';

// Illustrative motion graphic: posting requirements -> bullet library -> matching bullets assemble a resume page.
// Layout is computed per composition ('portrait' 1080x1920 / 'landscape' 1200x675). All timings are in seconds
// of the base 4.5 s timeline divided by `ts` (ts=1.2 stretches it to 5.4 s).
const GREEN='#173d2b',MUTED='#5b7a6a',G2='#2f6b4f',AMB='#e9a86a',MINT='#d9f1e3';
const FONT="'DM Sans',system-ui,sans-serif";
const ez=Easing.inOut(Easing.cubic),eo=Easing.out(Easing.cubic);
const ip=(t,r,o=[0,1],e=ez)=>interpolate(t,r,o,{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:e});
const lerp=(a,b,u)=>a+(b-a)*u;

export const BM_BASE_SECONDS=4.5;

const CHIPS=['Developer platforms','0→1 launches','Usage-based pricing','LLM experience'];
// m = chip index the bullet matches (-1 = general match, no chip), out = left out of the resume
const CARDS=[
 {t:'Led the Public API platform from beta to GA, growing active developers 4x in 18 months',m:0},
 {t:'Grew a B2C referral program 30% in one quarter',out:true},
 {t:'Repackaged API tiers into metered, usage-based pricing, lifting expansion revenue 22%',m:2},
 {t:'Organized a 200-person internal hackathon',out:true},
 {t:'Shipped AI summarization to 30K developers with an eval suite that cut bad outputs 40%',m:3},
 {t:'Took Workflow Builder from concept to $4M ARR in two years',m:1},
 {t:'Ran 120+ developer interviews that reshaped the SDK roadmap',m:0},
 {t:'Led the mobile app redesign for a consumer fitness brand',out:true},
 {t:'Defined the activation metric now used company-wide in quarterly planning',m:-1},
];
const PROC=[0,2,4,5,6,8];            // card indexes in the order they are matched (accelerating)
const P=[1.0,1.4,1.73,2.01,2.25,2.45];
const OUT=[1,3,7];
const ROT=[-3,2.5,-1.8,3,-2.5,1.5,2.2,-3.2,1.2];
const JIT=[[-6,4],[5,-5],[-4,-3],[6,5],[-5,6],[4,-4],[-6,-5],[5,4],[-3,5]];

const GEO={
 portrait:{W:1080,H:1920,
  chip:{h:70,font:32,pad:26,pos:[[60,420,460],[560,420,460],[60,505,460],[560,505,460]]},
  label:{x:540,y:592,font:26},
  colX:[190,540,890],rowY:[705,855,1005],cw:330,ch:140,cfont:22,cpad:16,bw:5,radius:16,
  page:{x:150,y:1090,w:780,h:520,pad:32,name:44,sec:20,hdr:152,bh:58,bfont:22,line:27},
  stack:{x:540,y:860,off:14,scale:.5,label:26},
  stats:{y:850,font:34,h:68,gap:18},line:5,
  fly:.55},
 landscape:{W:1200,H:675,
  chip:{h:36,font:16,pad:14,pos:[[0,140,196],[0,140,164],[0,140,206],[0,140,178]]},
  label:{x:410,y:204,font:15},
  colX:[165,410,655],rowY:[276,368,460],cw:220,ch:82,cfont:13.5,cpad:10,bw:2.5,radius:9,
  page:{x:830,y:188,w:330,h:440,pad:22,name:24,sec:13,hdr:90,bh:56,bfont:13.5,line:17},
  stack:{x:410,y:372,off:8,scale:.45,label:15},
  stats:{y:372,font:20,h:40,gap:12},line:2.5,
  fly:.5},
};
// landscape chips in a centered single row
(()=>{const g=GEO.landscape,gap=14,tot=g.chip.pos.reduce((a,c)=>a+c[2],0)+gap*3;let x=(g.W-tot)/2;g.chip.pos.forEach(c=>{c[0]=x;x+=c[2]+gap})})();

const Check=({s,color='#fff',bg=G2})=><svg width={s} height={s} viewBox="0 0 24 24" style={{display:'block'}}><circle cx="12" cy="12" r="12" fill={bg}/><path d="M6.5 12.5l3.8 3.8 7.2-8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;

export const BulletMatch=({layout='portrait',ts=1})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();
 const g=GEO[layout];const T=f/fps/ts;const S=(t0,cfg={damping:14,stiffness:160})=>spring({frame:(T-t0)*fps*ts,fps,config:cfg});
 const pg=g.page;
 const cardPos=i=>({x:g.colX[i%3]+JIT[i][0]*(g.W/1080),y:g.rowY[Math.floor(i/3)]+JIT[i][1]*(g.W/1080)});
 const slot=n=>({x:pg.x+pg.w/2,y:pg.y+pg.hdr+n*pg.bh+pg.bh/2});
 const pageIn=ip(T,[.55,.9],[0,1]);
 const finish=ip(T,[3.1,3.35],[1,1.035]);
 const chipHit=Array(4).fill(Infinity);PROC.forEach((ci,n)=>{const m=CARDS[ci].m;if(m>=0)chipHit[m]=Math.min(chipHit[m],P[n]+.28)});

 return <AbsoluteFill style={{fontFamily:FONT}}>
  {/* connector lines */}
  <svg width={g.W} height={g.H} style={{position:'absolute',left:0,top:0,overflow:'visible'}}>
   {PROC.map((ci,n)=>{const m=CARDS[ci].m;if(m<0)return null;const p=P[n];const u=ip(T,[p+.08,p+.28]);const fade=1-ip(T,[p+.4,p+.55]);if(u<=0||fade<=0)return null;
    const c=cardPos(ci),[cx,cy,cw]=g.chip.pos[m];const x1=c.x,y1=c.y-g.ch/2,x2=cx+cw/2,y2=cy+g.chip.h;
    const mx=(x1+x2)/2+(x1<x2?-1:1)*g.W*.06,my=(y1+y2)/2;
    return <g key={ci} opacity={fade}><path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} pathLength="1" fill="none" stroke={G2} strokeWidth={g.line} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-u}/>
     {u>.98&&<circle cx={x2} cy={y2} r={g.line*1.6} fill={AMB}/>}</g>})}
  </svg>
  {/* requirement chips */}
  {CHIPS.map((c,i)=>{const [x,y,w]=g.chip.pos[i];const e=S(.05+i*.09);const hit=chipHit[i];const hb=ip(T,[hit,hit+.08,hit+.3],[0,1,0]);const on=T>=hit;
   return <div key={c} style={{position:'absolute',left:x,top:y,width:w,height:g.chip.h,borderRadius:g.chip.h/2,background:on?'#bfe8d0':MINT,border:`${g.line*.6}px solid ${on?G2:'#a9d9bd'}`,
    display:'flex',alignItems:'center',justifyContent:'center',gap:g.chip.pad*.5,color:GREEN,fontWeight:700,fontSize:g.chip.font,letterSpacing:-.3,whiteSpace:'nowrap',
    opacity:Math.min(1,e*2),transform:`translateY(${(1-e)*-30}px) scale(${(.7+.3*e)*(1+.12*hb)})`,boxShadow:`0 ${g.line*2}px ${g.line*5}px rgba(23,61,43,.12)`}}>
    {on&&<Check s={g.chip.font*1.05}/>}{c}</div>})}
  {/* library label */}
  <div style={{position:'absolute',left:g.label.x-300,width:600,top:g.label.y,textAlign:'center',fontSize:g.label.font,fontWeight:700,color:MUTED,letterSpacing:1,textTransform:'uppercase',
   opacity:ip(T,[.3,.5])*(1-ip(T,[2.9,3.1]))}}>Your bullet library</div>
  {/* resume page */}
  <div style={{position:'absolute',left:pg.x,top:pg.y,width:pg.w,height:pg.h,borderRadius:g.radius,background:'#fff',boxShadow:'0 30px 70px rgba(23,61,43,.22),0 4px 14px rgba(23,61,43,.08)',
   border:'1px solid rgba(23,61,43,.1)',opacity:pageIn,transform:`translateY(${(1-pageIn)*40}px) scale(${finish})`,padding:pg.pad,boxSizing:'border-box'}}>
   <div style={{fontSize:pg.name,fontWeight:700,color:GREEN,letterSpacing:-1}}>Alex Rivera</div>
   <div style={{height:g.line*.5,background:'#d7e6dd',margin:`${pg.pad*.3}px 0 ${pg.pad*.28}px`}}/>
   <div style={{fontSize:pg.sec,fontWeight:700,color:'#2f4fa0',letterSpacing:1.5}}>EXPERIENCE</div>
   <div style={{position:'absolute',left:pg.pad,top:pg.hdr,right:pg.pad}}>
    {PROC.map((ci,n)=>{const a=ip(T,[P[n]+.46,P[n]+.6]);
     return <div key={ci} style={{height:pg.bh,display:'flex',gap:pg.bfont*.5,fontSize:pg.bfont,lineHeight:`${pg.line}px`,fontWeight:500,color:'#22352b',opacity:a,transform:`translateX(${(1-a)*-14}px)`}}>
      <span style={{color:G2,fontWeight:700}}>{'•'}</span><span>{CARDS[ci].t}</span></div>})}
   </div>
  </div>
  {/* library cards */}
  {CARDS.map((cd,i)=>{
   const e=S(.15+i*.035,{damping:15,stiffness:150});const base=cardPos(i);
   let x=lerp(g.W/2,base.x,e),y=lerp((g.rowY[1]),base.y,e),sc=.4+.6*e,rot=ROT[i]*e+(1-e)*-18,op=Math.min(1,e*2),filter='none',hl=0,z=1,strike=0;
   const pi=PROC.indexOf(i);
   if(pi>=0){const p=P[pi];hl=ip(T,[p,p+.1]);const fl=ip(T,[p+.28,p+.52]);const s=slot(pi);
    x=lerp(x,s.x,fl);y=lerp(y,s.y,fl);sc=lerp(sc*(1+.06*Math.sin(hl*Math.PI)),g.fly,fl);rot*=1-fl;op*=1-ip(T,[p+.44,p+.54]);z=3}
   else{const k=OUT.indexOf(i);const dim=ip(T,[2.3,2.45]);const mv=ip(T,[2.5+k*.08,2.9+k*.08]);
    x=lerp(x,g.stack.x,mv);y=lerp(y,g.stack.y+(k-1)*g.stack.off,mv);sc=lerp(sc,g.stack.scale,mv);rot=lerp(rot,(k-1)*5,mv);
    op*=(1-.5*dim)*(1-ip(T,[3.15,3.3]));filter=`grayscale(${dim})`;strike=dim}
   return <div key={i} style={{position:'absolute',left:x-g.cw/2,top:y-g.ch/2,width:g.cw,height:g.ch,boxSizing:'border-box',padding:g.cpad,borderRadius:g.radius,background:'#fff',
    border:`${g.bw}px solid ${hl>0?`rgba(47,107,79,${hl})`:'rgba(23,61,43,.08)'}`,boxShadow:`0 ${g.line*2}px ${g.line*6}px rgba(23,61,43,${.13+.1*hl})`,
    fontSize:g.cfont,lineHeight:1.22,fontWeight:500,color:GREEN,opacity:op,filter,zIndex:z,transform:`rotate(${rot}deg) scale(${sc})`,display:'flex',alignItems:'center'}}>
    <span>{cd.t}</span>
    {hl>0&&<div style={{position:'absolute',right:-g.bw*3,top:-g.bw*3,transform:`scale(${hl})`}}><Check s={g.cfont*1.7}/></div>}
    {strike>0&&<div style={{position:'absolute',left:g.cpad*.5,right:g.cpad*.5,top:'50%',height:g.line,background:'#b24a3a',transform:`scaleX(${strike})`,transformOrigin:'0 50%',borderRadius:2}}/>}
   </div>})}
  <div style={{position:'absolute',left:g.stack.x-200,width:400,top:g.stack.y+g.stack.off*2+g.ch*g.stack.scale/2+g.stack.label*.5,textAlign:'center',fontSize:g.stack.label,fontWeight:700,color:'#9a5d3a',
   letterSpacing:1,textTransform:'uppercase',opacity:ip(T,[2.8,3.0])*(1-ip(T,[3.15,3.3]))}}>Left out</div>
  {/* stats */}
  <div style={{position:'absolute',left:0,right:0,top:g.stats.y-g.stats.h/2,display:'flex',justifyContent:'center',gap:g.stats.gap}}>
   {['1 page','6 bullets','0 invented facts'].map((s,i)=>{const e=S(3.3+i*.12,{damping:12,stiffness:200});
    return <div key={s} style={{height:g.stats.h,padding:`0 ${g.stats.h*.5}px`,borderRadius:g.stats.h/2,background:i===2?G2:GREEN,color:'#fff',fontSize:g.stats.font,fontWeight:700,letterSpacing:-.3,display:'flex',alignItems:'center',whiteSpace:'nowrap',
     boxShadow:'0 14px 30px rgba(23,61,43,.28)',opacity:Math.min(1,e*3),transform:`scale(${e})`}}>{s}</div>})}
  </div>
 </AbsoluteFill>};
