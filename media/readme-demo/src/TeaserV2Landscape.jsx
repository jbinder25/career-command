import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,spring} from 'remotion';
import {Logo} from './Story.jsx';
import {GREEN,MUTED,ORANGE,FONT,ip,Background,Scene,SH,Bar,Chip,ClockIcon,StagePill,HeroCard,TONE,SD,CARDS,Icon,Badge,ACC,SLOT,Resume,Letter,REEL1,REEL2,reelPos,Reel,GH,CH,CW,PX,PY,SC,CWD,CHT,CS2,RW,RH,CELL,PH} from './TeaserV2.jsx';

// TeaserV2Landscape: same scenes, copy, motion and timing as TeaserV2, laid out for 1920x1080.
// Headline in the left column (x 120..780), scene visual centred in the right area (x 780..1800).
const CX=1280; // centre of the right area

const HL=({text,f,a=0,b=null})=>{
 const i=ip(f,[a,a+12],[0,1]);const o=b===null?1:ip(f,[b,b+8],[1,0]);
 return <div style={{position:'absolute',top:0,left:120,width:660,height:1080,display:'flex',alignItems:'center'}}>
  <div style={{width:660,textAlign:'left',whiteSpace:'pre-line',fontFamily:FONT,fontSize:84,fontWeight:700,color:GREEN,letterSpacing:-2,lineHeight:1.1,opacity:i*o,transform:`translateY(${(1-i)*26-(1-o)*14}px)`}}>{text}</div></div>};

// ---------------- Scenes 1 + 2 ----------------
const LT=470,LH=420,LW=490,LX={P:780,S:1310}; // lanes side by side under the incoming card
const slotXY=(lane,slot)=>[LX[lane]+(LW-CWD*CS2)/2,LT+130+slot*134];
const CARDX=CX-CWD/2,CARDY=210; // compact incoming card
const PLX=880,PLY=190; // pipeline panel
const RX=PLX+30,RY=PLY+164,RS=740/760;
const LaneL=({kind,count,bump,o})=>{const S=kind==='S';
 return <div style={{position:'absolute',left:LX[kind],top:LT+(1-o)*40,width:LW,height:LH,boxSizing:'border-box',borderRadius:36,opacity:o,background:S?'#e4f5ec':'#eceeed',border:`3px solid ${S?'#2f7d55':'#dcc3c3'}`,boxShadow:'inset 0 12px 28px rgba(23,61,43,.12),inset 0 -2px 0 rgba(255,255,255,.7)'}}>
  <div style={{position:'absolute',left:24,top:26,display:'flex',alignItems:'center',fontFamily:FONT,fontSize:40,fontWeight:700,color:S?GREEN:'#7d6a6a',whiteSpace:'nowrap'}}>
   <span style={{width:52,height:52,borderRadius:26,marginRight:14,background:S?'#2f7d55':'#c99a9a',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon kind={S?'check':'cross'}/></span>{S?'Shortlist · 80+':'Pass'}</div>
  <div style={{position:'absolute',right:-15,top:-28,width:64,height:64,borderRadius:32,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT,fontSize:36,fontWeight:700,color:'#fff',background:S?'#2f7d55':'#c99a9a',border:'4px solid #fff',boxShadow:'0 8px 18px rgba(23,61,43,.2)',opacity:count?1:.55,transform:`scale(${1+.4*bump})`}}>{count}</div>
 </div>};
const SceneA=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const D1=95;
 const enter=ip(f,[21,51],[0,1]);
 const m=ip(f,[98,116],[0,1]);
 const outF=1-ip(f,[234,246],[0,1]),laneIn=ip(f,[100,118],[0,1]),q=ip(f,[236,258],[0,1]),panelO=ip(f,[232,244],[0,1]);
 const bs=spring({frame:f-33,fps,config:{damping:16,stiffness:110}});const v=Math.round(ip(f,[33,72],[0,93]));
 const drift=[[1950,700,250,22,76,.5],[700,1950,110,21,73,.45],[1950,700,430,24,78,.4]];
 const gl=ip(f,[256,262],[0,1]),pulse=.78+.22*Math.sin((f-256)/6);
 const cnt={S:0,P:0},bump={S:0,P:0};
 CARDS.forEach(c=>{const t=(f-c.sl-SD)/10;if(t>=0)cnt[c.lane]++;if(t>=0&&t<1)bump[c.lane]=Math.max(bump[c.lane],Math.sin(Math.PI*t))});
 return <AbsoluteFill>
  <HL text={"The right jobs.\nFound for you."} f={f} b={D1}/>
  <HL text={"Less noise.\nBetter matches."} f={f} a={D1+8} b={270}/>
  {drift.map(([x0,x1,y,f0,f1,op],i)=>{const t=ip(f,[f0,f1],[0,1]);return <div key={i} style={{position:'absolute',left:x0+(x1-x0)*t,top:y,width:520,height:620,opacity:op*Math.min(ip(f,[f0,f0+6],[0,1]),ip(f,[f1-14,f1],[1,0])),filter:'blur(7px)'}}><BlankLite/></div>})}
  {laneIn>0&&['P','S'].map(k=><LaneL key={k} kind={k} count={cnt[k]} bump={bump[k]} o={laneIn*outF}/>)}
  {panelO>0&&<><div style={{position:'absolute',left:PLX,top:PLY-54,fontFamily:FONT,fontSize:34,fontWeight:700,color:MUTED,opacity:panelO}}>Pipeline</div>
  <div style={{position:'absolute',left:PLX,top:PLY,width:800,height:663,borderRadius:30,overflow:'hidden',background:'#f4f7f5',boxShadow:SH,opacity:panelO}}>
   {[[24,120],[164,195],[379,120],[519,120]].map(([y,rh],i)=>i===1
    ?<div key={i} style={{position:'absolute',left:30,top:y,width:740,height:rh,boxSizing:'border-box',borderRadius:26,border:'3px dashed #c4d8cc'}}/>
    :<div key={i} style={{position:'absolute',left:30,top:y,width:740,height:rh,borderRadius:26,background:'#fff',boxShadow:'0 10px 26px rgba(23,61,43,.08)'}}>
      <Bar w={i%2?460:300} h={28} c="#cfd6d2" style={{position:'absolute',left:36,top:28}}/><Bar w={i%2?380:460} h={16} c="#e4e9e6" style={{position:'absolute',left:36,top:76}}/></div>)}</div></>}
  {[1,2,3,0].map(i=>{const c=CARDS[i],hero=i===0;
   const p=ip(f,[c.sl,c.sl+SD],[0,1]);const [tx,ty]=slotXY(c.lane,c.slot);
   const ar=hero?1:ip(f,[c.arr,c.arr+5],[0,1]);
   const o=hero?Math.min(enter*1.5,1):ar*outF;if(o<=0)return null;
   const x0=CARDX,y0=hero?CARDY+(540-250-CARDY)*(1-m)+(1-enter)*70:CARDY+(1-ar)*40;
   let x=x0+(tx-x0)*p,y=y0+(ty-y0)*p,s=1+(CS2-1)*p,b=0;
   if(hero){x+=(RX-x)*q;y+=(RY-y)*q;s+=(RS-s)*q;b=Math.sin(Math.PI*q);y-=46*b;s+=.05*b}
   const h=hero?500-300*m:CHT,inS=hero?.97+.03*enter:.94+.06*ar;
   const D=hero?190-74*m:116,bx=hero?745-137*m:608,by=hero?42*m:42;
   const val=hero?v:c.sc,rv=hero?v:c.sc*ip(f,[c.arr,c.arr+10],[0,1]);
   const bsc=hero?bs:spring({frame:f-c.arr-1,fps,config:{damping:14,stiffness:200}});
   const bo=hero?Math.min(1,bs*2)*(1-ip(f,[246,254],[0,1])):1;
   return <div key={i} style={{position:'absolute',left:x,top:y,width:CWD,height:h,transform:`scale(${s})`,transformOrigin:'0 0',opacity:o}}>
    <div style={{position:'relative',width:CWD,height:h,transform:`scale(${inS})`}}>
     <HeroCard h={h} name={c.n} role={c.r} tsz={hero?56-8*m:48} chipO={hero?1-ip(f,[96,106],[0,1]):0} style={{boxShadow:`0 ${34+30*b}px ${80+40*b}px rgba(23,61,43,${.22+.06*b}),0 8px 22px rgba(23,61,43,.10)`}}>
      {hero&&<StagePill k="prospect" style={{position:'absolute',right:40,top:70,opacity:ip(f,[250,258],[0,1])}}/>}</HeroCard>
     <div style={{position:'absolute',left:bx,top:by,width:D,height:D,transform:`scale(${bsc})`,opacity:bo}}>
      <Badge D={D} v={val} ringV={rv} tone={c.sc>=80?'g':'r'}/>
      {hero&&<div style={{position:'absolute',top:D+14,left:D/2-115,width:230,textAlign:'center',fontFamily:FONT,opacity:1-ip(f,[96,104],[0,1])}}>
       <div style={{display:'inline-block',padding:'6px 24px',borderRadius:24,background:GREEN,color:'#fff',fontSize:30,fontWeight:700,whiteSpace:'nowrap'}}>Your match</div></div>}
     </div></div></div>})}
  {CARDS.map((c,i)=>{const L=c.sl+SD;if(f<L)return null;const pop=spring({frame:f-L,fps,config:{damping:9,stiffness:220}});const [tx,ty]=slotXY(c.lane,c.slot);
   const o=(i===0?1-ip(f,[234,242],[0,1]):outF)*Math.min(1,pop*3);if(o<=0)return null;const ok=c.sc>=80;
   return <div key={i} style={{position:'absolute',left:tx+CWD*CS2-24,top:ty+CHT*CS2-26,width:52,height:52,borderRadius:26,boxSizing:'border-box',background:ok?'#2f7d55':'#c99a9a',border:'3px solid #fff',boxShadow:'0 8px 18px rgba(23,61,43,.25)',display:'flex',alignItems:'center',justifyContent:'center',opacity:o,transform:`scale(${pop})`}}><Icon kind={ok?'check':'cross'} size={28}/></div>})}
  <div style={{position:'absolute',left:RX,top:RY,width:740,height:195,borderRadius:26,boxShadow:`0 0 0 6px rgba(233,168,106,${gl}),0 0 64px 16px rgba(233,168,106,${gl*.5*pulse})`}}/>
  <div style={{position:'absolute',left:PLX,width:800,top:PLY+663+40,textAlign:'center',fontFamily:FONT,opacity:ip(f,[258,268],[0,1]),transform:`translateY(${(1-ip(f,[258,268],[0,1]))*16}px)`}}>
   <span style={{display:'inline-block',padding:'10px 30px',borderRadius:40,background:GREEN,color:'#fff',fontSize:36,fontWeight:700}}>{'✓'} Added to pipeline</span></div>
 </AbsoluteFill>};
const BlankLite=()=><div style={{position:'relative',width:520,height:620,borderRadius:30,background:'#fff',boxShadow:SH}}>
 <Bar w={260} h={32} c="#cfd6d2" style={{position:'absolute',left:36,top:40}}/>
 {[0,1,2,3,4].map(i=><Bar key={i} w={i%2?286:390} h={16} c="#e4e9e6" style={{position:'absolute',left:36,top:120+i*40}}/>)}
 <Bar w={187} h={44} c="#ece9e3" style={{position:'absolute',left:36,top:620-96}}/></div>;

// ---------------- Scene 3: tailoring ----------------
const GS0=.9,GS1=.6,GLX=938,GTY=99,TX=-102,TY=81; // group scale start/end, origin, travel
const CYL=[200,346,492];
const LET_X=1328,LET_Y=180;
const Scene3=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const hack=ip(f,[48,64],[0,1]),res=ip(f,[50,64],[0,1]),hi=ip(f,[48,55],[0,1]);
 const c=ip(f,[76,96],[0,1]),letterIn=ip(f,[80,100],[0,1]);
 const pop=spring({frame:f-98,fps,config:{damping:13,stiffness:160}});
 const pre=ip(f,[29,41],[0,1])*(1-ip(f,[48,58],[0,1]));
 const cardStyle=i=>{
  const ent=ip(f,[29+i*4,43+i*4],[0,1]);
  let x=-50,y=CYL[i]+(1-ent)*40,s=1;
  const CSS=.772;
  if(i<2){const p=i===0?ip(f,[51,73],[0,1]):ip(f,[50,76],[0,1]);x=-50+(SLOT[i][0]+50)*p;y=CYL[i]+(SLOT[i][1]-CYL[i])*p+(1-ent)*40*(1-p);s=1-(1-CSS)*p;}
  return {x,y,s,ent};};
 return <AbsoluteFill>
  <HL text={"Your experience.\nPerfectly\npositioned."} f={f} a={8} b={140}/>
  <div style={{position:'absolute',left:780,width:1000,top:128,textAlign:'center',fontFamily:FONT,opacity:pre,transform:`translateY(${(1-pre)*14}px)`}}>
   <span style={{display:'inline-block',padding:'10px 30px',borderRadius:40,background:'#fdeedd',border:`2px solid ${ORANGE}`,color:'#8a4b10',fontSize:32,fontWeight:700}}>Role needs: developer platforms</span></div>
  <div style={{position:'absolute',left:893,top:216,fontFamily:FONT,fontSize:32,fontWeight:700,color:MUTED,opacity:pre}}>Your experience</div>
  <div style={{position:'absolute',left:letterIn>0?LET_X+(1-letterIn)*420:2300,top:LET_Y,width:RW,height:RH,opacity:letterIn,transform:`scale(${GS1}) rotate(${2+(1-letterIn)*4}deg)`,transformOrigin:'0 0'}}><Letter/></div>
  <div style={{position:'absolute',left:GLX,top:GTY,width:RW,height:RH,transformOrigin:'0 0',transform:`translate(${TX*c}px,${TY*c}px) scale(${GS0-(GS0-GS1)*c}) rotate(${-2*c}deg)`}}>
   <div style={{opacity:res}}><Resume/></div>
   {[2,1,0].map(i=>{const {x,y,s,ent}=cardStyle(i);const first=i===0,second=i===1;
    const green=first?hi:0;const o=ent*(i===2?1-hack:1);
    return <div key={i} style={{position:'absolute',left:0,top:0,width:860,height:124,boxSizing:'border-box',borderRadius:26,background:green>0?`rgb(${255-28*green},${255-9*green},${255-17*green})`:'#fff',
     border:green>0?`3px solid rgba(47,125,85,${.3+.7*green})`:'2px solid #d9e6de',boxShadow:i===2&&hack>0?'none':'0 14px 34px rgba(23,61,43,.14)',opacity:o*(second?1-.25*ip(f,[60,74],[0,1]):1),
     transform:`translate(${x}px,${y}px) scale(${s*(i===2?1-.04*hack:1)})`,transformOrigin:'0 0',display:'flex',alignItems:'center',fontFamily:FONT,fontSize:40,fontWeight:700,color:i===2&&hack>0?MUTED:GREEN,filter:i===2?`grayscale(${hack})`:'none'}}>
     <div style={{width:48,height:48,borderRadius:24,marginLeft:28,marginRight:22,flex:'none',background:green>0?'#2f7d55':'#dcece3',color:'#fff',fontSize:30,display:'flex',alignItems:'center',justifyContent:'center'}}>{green>0?'✓':<span style={{width:14,height:14,borderRadius:7,background:second?'#7fbf9d':'#2f7d55',display:'block'}}/>}</div>
     <span style={{whiteSpace:'nowrap'}}>{ACC[i][0]}</span></div>})}
  </div>
  <div style={{position:'absolute',left:LET_X-492,top:LET_Y+588+52,opacity:Math.min(1,pop*2)*ip(f,[98,102],[0,1]),transform:`scale(${.6+.4*pop})`,transformOrigin:'0 50%',zIndex:5}}>
   <span style={{display:'inline-block',padding:'12px 28px',borderRadius:40,background:'#2f7d55',color:'#fff',fontFamily:FONT,fontSize:32,fontWeight:700,whiteSpace:'nowrap',boxShadow:'0 14px 30px rgba(23,61,43,.3)'}}>{'✓'} From your approved experience</span></div>
 </AbsoluteFill>};

// ---------------- Scenes 4 + 5 ----------------
const OVER_CL=830,CT=220,SX=880,SW=800;
const SceneB=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const CL=OVER_CL;
 const G=102,g=f-G;
 const enter=ip(f,[0,20],[0,1]);
 const R1=29,L1=28,R2=G+33,L2=28;
 const p1=reelPos(f-R1,L1,5),v1=Math.abs(reelPos(f-R1+.5,L1,5)-reelPos(f-R1-.5,L1,5));
 const p2=reelPos(f-R2,L2,5),v2=Math.abs(reelPos(f-R2+.5,L2,5)-reelPos(f-R2-.5,L2,5));
 const sw1=ip(f,[R1+L1+20,R1+L1+23],[0,1]),sw2=ip(f,[R2+L2+20,R2+L2+23],[0,1]);
 const landT=f-(R2+L2);const glow=landT>=0?Math.max(0,1-landT/24):0;
 const landed1=f-(R1+L1);
 const offerDot=spring({frame:landT,fps,config:{damping:11,stiffness:170}});
 const ringOn=ip(f,[R1+L1+4,R1+L1+14],[0,1])*(1-ip(f,[G-8,G+2],[0,1]));
 const ph=((f-(R1+L1))%36)/36;
 const lab=ip(f,[R1+L1+8,R1+L1+20],[0,1])*(1-ip(f,[G-8,G+2],[0,1]));
 const sp=ip(f,[G+29,G+39],[0,1]);const prog=ip(f,[G+33,G+61],[0,2/3])+ip(f,[R2+L2,R2+L2+14],[0,1/3]);
 const rays=Array.from({length:10},(_,i)=>-115+i*(230/9));
 const cx=CL+PX+105,cy=CT+PY+36;
 const steps=['Lead','Applied','Interview','Offer'];
 const stat=f<R1?'applied':(f<R2?'loop':'offer');
 return <AbsoluteFill>
  <HL text={"Every\nopportunity.\nUnder control."} f={f} a={8} b={G}/>
  <HL text={"From first\nmatch to\nfinal offer."} f={f} a={G+8} b={209}/>
  <div style={{position:'absolute',left:CL,top:CT+(1-enter)*60,width:CW,height:CH,opacity:Math.min(1,enter*1.6)}}>
   <div style={{position:'absolute',inset:0,borderRadius:30,background:'#fff',boxShadow:`${SH},0 0 0 ${glow*8}px rgba(233,168,106,${glow}),0 0 ${glow*100}px ${glow*28}px rgba(233,168,106,${glow*.7})`}}/>
   <div style={{position:'absolute',inset:0,borderRadius:30,overflow:'hidden'}}>
    <div style={{position:'absolute',left:PX,top:36,fontFamily:FONT,fontSize:56,fontWeight:700,color:GREEN,letterSpacing:-1}}>Kestrel AI</div>
    <div style={{position:'absolute',left:PX,top:112,fontFamily:FONT,fontSize:30,fontWeight:500,color:MUTED,whiteSpace:'nowrap'}}>Senior PM, Developer Platform</div>
    {stat&&<StagePill k={stat} style={{position:'absolute',left:PX,top:PY+(CELL-PH)/2}}/>}
    {f>=R1&&sw1<1&&<div><Reel cells={REEL1} pos={p1} blur={Math.min(7,v1*14)}/></div>}
    {f>=R2&&sw2<1&&<div><Reel cells={REEL2} pos={p2} blur={Math.min(7,v2*14)}/></div>}
    <Bar w={600} h={16} c="#e4e9e6" style={{position:'absolute',left:PX,top:372}}/><Bar w={420} h={16} c="#eef1ef" style={{position:'absolute',left:PX,top:400}}/>
   </div>
   <div style={{position:'absolute',left:PX,top:290,opacity:ringOn}}><Chip text="Waiting on company" icon={<ClockIcon/>} w={470} style={{borderColor:ORANGE,borderWidth:3}}/></div>
   {ringOn>0&&<div style={{position:'absolute',left:PX,top:290,width:470,height:80,borderRadius:24,border:`5px solid ${ORANGE}`,boxSizing:'border-box',opacity:ringOn*(1-ph*.85),transform:`scale(${1+ph*.16})`,boxShadow:`0 0 24px rgba(233,168,106,${.6*(1-ph)})`}}/>}
  </div>
  <div style={{position:'absolute',left:CL,width:CW,top:CT+CH+40,textAlign:'center',fontFamily:FONT,opacity:lab,transform:`translateY(${(1-lab)*16}px)`}}>
   <span style={{display:'inline-block',padding:'12px 34px',borderRadius:44,background:'#fff',color:GREEN,fontSize:40,fontWeight:700,boxShadow:'0 12px 30px rgba(23,61,43,.16)',border:`2px solid ${ORANGE}`}}>Next: final round prep</span></div>
  <div style={{position:'absolute',left:SX,top:CT+CH+70,width:SW,height:130,fontFamily:FONT,opacity:sp,transform:`translateY(${(1-sp)*16}px)`}}>
   <div style={{position:'absolute',left:17,right:17,top:13,height:8,borderRadius:4,background:'#d2e4d9'}}/>
   <div style={{position:'absolute',left:17,top:13,width:(SW-34)*Math.min(1,prog),height:8,borderRadius:4,background:prog>.99?ORANGE:'#2f7d55'}}/>
   {steps.map((s,i)=>{const on=prog>=i/3-.01,last=i===3;const sc=last&&landT>=0?.9+.2*Math.min(1.3,offerDot):1;
    return <div key={s} style={{position:'absolute',left:(SW-34)*i/3-30,top:0,width:94,textAlign:'center'}}>
     <div style={{width:34,height:34,borderRadius:17,margin:'0 auto',boxSizing:'border-box',background:on?(last?ORANGE:'#2f7d55'):'#fff',border:`4px solid ${on?(last?ORANGE:'#2f7d55'):'#c4d8cc'}`,transform:`scale(${sc})`,boxShadow:last&&on?`0 0 ${glow*30}px rgba(233,168,106,${glow})`:'none'}}/>
     <div style={{marginTop:14,fontSize:30,fontWeight:700,color:on?GREEN:'#8aa597',whiteSpace:'nowrap',marginLeft:-20,marginRight:-20}}>{s}</div></div>})}
  </div>
  {landT>=0&&landT<20&&rays.map((a,i)=>{const t=landT/20,r=ip(landT,[0,20],[0,1]);const rad=a*Math.PI/180;
   const hw=131,hh=54,d=40+r*70;
   const x=cx+Math.cos(rad)*(hw+d*.6),y=cy+Math.sin(rad)*(hh+d*.6);
   const col=['#2f6b4f',ORANGE,'#9fdcc0'][i%3];
   return <div key={i} style={{position:'absolute',left:x-2,top:y-14,width:5,height:i%2?26:14,borderRadius:3,background:col,opacity:1-t,transform:`rotate(${a+90}deg) scaleY(${1-t*.5})`}}/>})}
 </AbsoluteFill>};

// ---------------- Scene 6: end card (centred stack, scaled up for 1080 height) ----------------
const End=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f-8,fps,config:{damping:16,stiffness:110}});const s2=spring({frame:f-13,fps,config:{damping:26,stiffness:120}});
 const t2=ip(f,[22,30],[0,1])*(1-ip(f,[104,112],[0,1]));
 const m=ip(f,[106,130],[0,1]);
 const b1=spring({frame:f-114,fps,config:{damping:16,stiffness:140}}),b2=ip(f,[122,132],[0,1]),b3=ip(f,[127,137],[0,1]);
 const Y=-312;
 return <AbsoluteFill style={{fontFamily:FONT,textAlign:'center',opacity:ip(f,[0,4],[0,1])}}>
  <div style={{position:'absolute',inset:0,transform:'scale(1.1)',transformOrigin:'50% 50%'}}>
  <div style={{position:'absolute',left:840,top:640+Y-205*m,width:240,height:240,transform:`scale(${(1-.3*m)*s}) rotate(${(1-s)*-25}deg)`,filter:'drop-shadow(0 24px 40px rgba(23,61,43,.25))'}}><Logo size={240}/></div>
  <div style={{position:'absolute',left:0,right:0,top:910+Y-215*m,fontSize:78,fontWeight:700,color:GREEN,letterSpacing:-2,whiteSpace:'nowrap',opacity:s2,transform:`translateY(${(1-s2)*24}px) scale(${1-.17*m})`}}>Career Command Center</div>
  <div style={{position:'absolute',left:0,right:0,top:1030+Y,whiteSpace:'nowrap',fontSize:42,fontWeight:500,color:'#2b5a43',lineHeight:1.25,opacity:t2,transform:`translateY(${(1-t2)*16}px)`}}>Your data. Your rules. Your career.</div>
  <div style={{position:'absolute',left:0,right:0,top:870+Y,fontSize:92,fontWeight:700,color:GREEN,letterSpacing:-2.5,whiteSpace:'nowrap',opacity:Math.min(1,b1*1.5),transform:`translateY(${(1-b1)*40}px) scale(${.9+.1*b1})`}}>Build your own.
   <div style={{margin:'10px auto 0',height:8,borderRadius:4,background:ORANGE,width:420*ip(f,[118,134],[0,1])}}/></div>
  <div style={{position:'absolute',left:0,right:0,top:1040+Y,fontSize:46,fontWeight:500,color:'#2b5a43',opacity:b2,transform:`translateY(${(1-b2)*16}px)`}}>Free template on GitHub</div>
  <div style={{position:'absolute',left:0,right:0,top:1130+Y,opacity:b3,transform:`translateY(${(1-b3)*16}px)`}}>
   <span style={{display:'inline-block',padding:'18px 38px',borderRadius:60,background:'#fff',border:'2px solid #bfdccd',fontSize:32,fontWeight:700,color:GREEN,boxShadow:'0 14px 34px rgba(23,61,43,.14)'}}>{GH}</span></div>
  </div>
 </AbsoluteFill>};

export const TeaserV2Landscape=()=><AbsoluteFill><Background/>
 <Scene from={SC.A[0]} dur={SC.A[1]} first><SceneA/></Scene>
 <Scene from={SC.S3[0]} dur={SC.S3[1]}><Scene3/></Scene>
 <Scene from={SC.B[0]} dur={SC.B[1]}><SceneB/></Scene>
 <Scene from={SC.E[0]} dur={SC.E[1]} last><End/></Scene>
</AbsoluteFill>;
