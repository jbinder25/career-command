import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig,interpolate,spring,Easing,staticFile,continueRender,delayRender} from 'remotion';
import {Logo} from './Story.jsx';
import {BulletMatch,BM_BASE_SECONDS} from './BulletMatch.jsx';
import boxes from '../public/shots/mobile/boxes.json';

const GREEN='#173d2b',MUTED='#5b7a6a';
const ease=Easing.inOut(Easing.cubic);
const ip=(f,r,o)=>interpolate(f,r,o,{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const shot=n=>staticFile('shots/mobile/'+n+'.png');
const FONT="'DM Sans',system-ui,sans-serif";

const fr=delayRender('teaser-fonts');
Promise.all([['500','DMSans-500.ttf'],['700','DMSans-700.ttf']].map(([w,f])=>{const ff=new FontFace('DM Sans',`url(${staticFile('fonts/'+f)})`,{weight:w});return ff.load().then(x=>document.fonts.add(x))})).then(()=>continueRender(fr)).catch(()=>continueRender(fr));

// Layout. Text stays inside y 220..1620; only the phone bezel reaches the bottom overlay zone.
const PH_H=1340,BEZ=20,SCR_W=Math.round((PH_H-2*BEZ)*390/844),SCR_H=PH_H-2*BEZ,PH_W=SCR_W+2*BEZ,PH_TOP=400,PH_LEFT=(1080-PH_W)/2;
const K=SCR_W/390; // css px -> video px

const Background=()=><AbsoluteFill style={{background:'linear-gradient(170deg,#e8f6ee 0%,#f2faf6 100%)'}}>
 <div style={{position:'absolute',left:-200,top:-80,width:760,height:760,borderRadius:'50%',background:'#c4ebd7',opacity:.3,filter:'blur(140px)'}}/>
 <div style={{position:'absolute',right:-240,bottom:-120,width:820,height:820,borderRadius:'50%',background:'#fde8d2',opacity:.3,filter:'blur(150px)'}}/>
</AbsoluteFill>;

const Caption=({title,sub})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f,fps,config:{damping:200,stiffness:220}});const s2=spring({frame:f-3,fps,config:{damping:200,stiffness:220}});
 return <div style={{position:'absolute',top:236,left:0,right:0,textAlign:'center',fontFamily:FONT}}>
  <div style={{fontSize:72,fontWeight:700,color:GREEN,letterSpacing:-2,whiteSpace:'nowrap',opacity:s,transform:`translateY(${(1-s)*30}px)`}}>{title}</div>
  <div style={{fontSize:36,fontWeight:500,color:MUTED,marginTop:8,opacity:s2,transform:`translateY(${(1-s2)*20}px)`}}>{sub}</div>
 </div>};

const Beat=({dur,first,children})=>{const f=useCurrentFrame();
 const o=Math.min(first?1:ip(f,[0,5],[0,1]),ip(f,[dur-5,dur],[1,0]));
 return <AbsoluteFill style={{opacity:o}}>{children}</AbsoluteFill>};

// Rounded dark bezel, no branding. Children render inside the screen (SCR_W x SCR_H).
const Phone=({children,enter})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f-enter,fps,config:{damping:18,stiffness:140}});
 const out=ip(f,[END_AT-2,END_AT+10],[0,1]);
 const h=ip(f,[starts[1]-2,starts[1]+9],[0,1])-ip(f,[starts[2]-4,starts[2]+10],[0,1]);
 return <div style={{position:'absolute',left:PH_LEFT,top:PH_TOP,width:PH_W,height:PH_H,borderRadius:88,background:'#14181a',
  boxShadow:'0 50px 110px rgba(23,61,43,.28),0 10px 26px rgba(23,61,43,.14),inset 0 0 0 3px #2b3235',
  opacity:s*(1-out)*(1-h),transform:`translateY(${(1-s)*120+out*-60+h*80}px) scale(${(.94+.06*s)*(1-.18*h)})`}}>
  <div style={{position:'absolute',left:BEZ,top:BEZ,width:SCR_W,height:SCR_H,borderRadius:68,overflow:'hidden',background:'#f4f7f5'}}>{children}</div>
  <div style={{position:'absolute',left:PH_W/2-60,top:BEZ+14,width:120,height:30,borderRadius:15,background:'#14181a'}}/>
 </div>};

const Img=({src,style})=><img src={shot(src)} style={{display:'block',...style}}/>;

const ScoreBadge=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f-8,fps,config:{damping:12,stiffness:130}});
 const v=Math.round(ip(f,[8,46],[0,93]));const R=70,C=2*Math.PI*R,D=190;
 return <div style={{position:'absolute',left:PH_LEFT+PH_W-110,top:PH_TOP+150,width:D+40,textAlign:'center',fontFamily:FONT,transform:`scale(${s})`,opacity:Math.min(1,s*2)}}>
  <div style={{position:'relative',width:D,height:D,margin:'0 auto',borderRadius:D/2,background:'#fff',boxShadow:'0 24px 54px rgba(23,61,43,.3)'}}>
   <svg width={D} height={D} style={{position:'absolute',inset:0,transform:'rotate(-90deg)'}}><circle cx={D/2} cy={D/2} r={R} fill="none" stroke="#e1efe7" strokeWidth="14"/><circle cx={D/2} cy={D/2} r={R} fill="none" stroke="#2f7d55" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-v/100)}/></svg>
   <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:76,fontWeight:700,color:GREEN}}>{v}</div>
  </div>
  <div style={{marginTop:14,display:'inline-block',padding:'6px 22px',borderRadius:22,background:GREEN,color:'#fff',fontSize:26,fontWeight:700}}>Match score</div>
 </div>};

// Screens render inside the persistent Phone; captions/badge render outside it.
const S1=({dur})=>{const f=useCurrentFrame();const z=ip(f,[0,dur],[1,1.04]);
 return <Beat dur={dur} first><Img src="01-leads" style={{width:SCR_W,transformOrigin:'50% 30%',transform:`scale(${z})`}}/></Beat>};
const S2=()=>null; // beat 2 is the BulletMatch motion graphic, drawn outside the phone
// ---- Beat 3: lift-out, slot-machine stage reel, landing flourish, day ticker ----
const rowShot=n=>staticFile('shots/mobile/'+n+'.png');
const ROW=boxes['list-applied'],PILL=boxes.pill;
const LIFT=6,T0=26,LAND=40,SETTLE=54; // local frames: lift starts, reel starts, reel lands (peak), row image swap
const REEL=['applied','screen','loop','offer','applied','screen','loop','offer','applied'];
const CELL=42,BOX={x:184,y:8,w:165,h:38},OVER=.22;
const eo3=u=>1-Math.pow(1-Math.min(1,Math.max(0,u)),3);
const reelPos=f=>{if(f<=0)return 0;if(f<=LAND)return (7+OVER)*eo3(f/LAND);
 const sp=spring({frame:f-LAND,fps:30,config:{damping:9,stiffness:170}});return 7+OVER*(1-sp)};
const S3=({dur})=>{const f=useCurrentFrame();
 const bl=ip(f,[LIFT,LIFT+14],[0,5]),br=ip(f,[LIFT,LIFT+14],[1,.8]);
 return <Beat dur={dur}><Img src="pipeline-applied" style={{width:SCR_W,filter:`blur(${bl}px) brightness(${br})`}}/></Beat>};

const FloatRow=({dur})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const lift=spring({frame:f-LIFT,fps,config:{damping:13,stiffness:150}});
 const cx0=PH_LEFT+BEZ+(ROW.x+ROW.width/2)*K,cy0=PH_TOP+BEZ+(ROW.y+ROW.height/2)*K;
 const cx1=540,cy1=PH_TOP+PH_H/2-70;
 const cx=cx0+(cx1-cx0)*lift,cy=cy0+(cy1-cy0)*lift;
 const sc=K*(1+.35*lift);
 const rf=f-T0;const pos=reelPos(rf);
  const vel=Math.abs(reelPos(rf+.5)-reelPos(rf-.5));
 const blur=Math.min(7,vel*14);
 const swapIn=ip(f,[T0-2,T0+2],[0,1]),swapOut=ip(f,[T0+SETTLE-1,T0+SETTLE+2],[0,1]);
 const landT=f-T0-LAND;
 const glow=landT>=0?Math.max(0,1-landT/18):0;
 const day=Math.min(24,Math.round(1+23*Math.min(pos,7.1)/7.1));
 const landed=landT>=0;
 // pill centre relative to the row centre, in video px
 const pc={x:(PILL.offer.x+PILL.offer.width/2-ROW.width/2)*sc,y:(PILL.offer.y+PILL.offer.height/2-ROW.height/2)*sc};
 const dayPop=spring({frame:landT,fps,config:{damping:9,stiffness:200}});
 const rays=Array.from({length:10},(_,i)=>-115+i*(230/9));
 return <Beat dur={dur}>
  <div style={{position:'absolute',left:cx-ROW.width/2,top:cy-ROW.height/2,width:ROW.width,height:ROW.height,transform:`scale(${sc})`,transformOrigin:'50% 50%',opacity:ip(f,[LIFT-2,LIFT],[0,1])}}>
   <div style={{position:'absolute',inset:0,borderRadius:12,background:'#fff',
    boxShadow:`0 ${50*lift/sc}px ${120*lift/sc}px rgba(23,61,43,${.32*lift}),0 0 0 ${glow*7/sc}px rgba(233,168,106,${glow}),0 0 ${glow*90/sc}px ${glow*26/sc}px rgba(233,168,106,${glow*.7})`}}/>
   <div style={{position:'absolute',inset:0,borderRadius:12,overflow:'hidden'}}>
    <img src={rowShot('row-applied')} style={{position:'absolute',inset:0,width:ROW.width,opacity:1-swapIn}}/>
    <img src={rowShot('row-screen')} style={{position:'absolute',inset:0,width:ROW.width,opacity:swapIn*(1-swapOut)}}/>
    <img src={rowShot('row-offer')} style={{position:'absolute',inset:0,width:ROW.width,opacity:swapOut}}/>
    {f>=T0-2&&f<T0+SETTLE+2&&<div style={{position:'absolute',left:BOX.x,top:BOX.y,width:BOX.w,height:BOX.h,background:'#fff',overflow:'hidden',opacity:swapIn*(1-swapOut)}}>
     <svg width="0" height="0" style={{position:'absolute'}}><filter id="vblur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation={`0 ${blur}`}/></filter></svg>
     <div style={{position:'absolute',left:0,top:BOX.h/2-CELL/2,width:BOX.w,transform:`translateY(${-pos*CELL}px)`,filter:blur>.3?'url(#vblur)':'none'}}>
      {REEL.map((k,i)=>{const pb=PILL[k];return <img key={i} src={rowShot('pill-'+k)} style={{position:'absolute',left:346-BOX.x-pb.width,top:i*CELL+(CELL-pb.height)/2,width:pb.width,height:pb.height}}/>})}
     </div></div>}
   </div>
  </div>
  {/* day ticker, outside the app UI */}
  <div style={{position:'absolute',left:cx+ROW.width*sc/2-380,top:cy-ROW.height*sc/2-110,width:380,display:'flex',justifyContent:'flex-end',fontFamily:FONT,opacity:ip(f,[T0-4,T0],[0,1]),transform:`translateY(${(1-ip(f,[T0-4,T0],[0,1]))*20}px)`}}>
   <div style={{padding:'12px 30px',borderRadius:40,background:landed?'#c9702a':GREEN,color:'#fff',fontSize:40,fontWeight:700,letterSpacing:-.5,whiteSpace:'nowrap',boxShadow:'0 14px 30px rgba(23,61,43,.3)',transform:`scale(${landed?.9+.1*Math.min(1.3,dayPop):1})`,transformOrigin:'100% 50%'}}>{landed?'Day 24 \u00b7 Offer':'Day '+day}</div>
  </div>
  {/* radial burst */}
  {landT>=0&&landT<15&&rays.map((a,i)=>{const t=landT/15,r=ip(landT,[0,15],[0,1]);const rad=a*Math.PI/180;
   const hw=PILL.offer.width*sc/2+26,hh=PILL.offer.height*sc/2+24,d=40+r*70;
   const x=cx+pc.x+Math.cos(rad)*(hw+d*.6),y=cy+pc.y+Math.sin(rad)*(hh+d*.6);
   const col=['#2f6b4f','#e9a86a','#9fdcc0'][i%3];
   return <div key={i} style={{position:'absolute',left:x-2,top:y-14,width:5,height:i%2?26:14,borderRadius:3,background:col,opacity:1-t,transform:`rotate(${a+90}deg) scaleY(${1-t*.5})`}}/>})}
 </Beat>};

const CAPS=[['A great role finds you.','Scored against what you want.'],['Built for this role.','Only bullets from your real experience.'],['…all the way to the offer.','Every stage, one pipeline.']];
const Cap=({i,dur})=><Beat dur={dur} first={i===0}><Caption title={CAPS[i][0]} sub={CAPS[i][1]}/></Beat>;
const Badge=({dur})=><Beat dur={dur} first><ScoreBadge/></Beat>;

const End=({dur})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f,fps,config:{damping:14}});const s2=spring({frame:f-6,fps,config:{damping:200,stiffness:200}});const s3=spring({frame:f-12,fps,config:{damping:200,stiffness:200}});
 return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',fontFamily:FONT,textAlign:'center',opacity:ip(f,[0,4],[0,1])}}>
  <div style={{transform:`scale(${s}) rotate(${(1-s)*-25}deg)`,filter:'drop-shadow(0 24px 40px rgba(23,61,43,.25))'}}><Logo size={240}/></div>
  <div style={{fontSize:78,fontWeight:700,color:GREEN,letterSpacing:-2,marginTop:48,whiteSpace:'nowrap',opacity:s2,transform:`translateY(${(1-s2)*24}px)`}}>Career Command Center</div>
  <div style={{fontSize:40,fontWeight:500,color:'#2b5a43',marginTop:22,width:820,lineHeight:1.25,opacity:s3,transform:`translateY(${(1-s3)*20}px)`}}>Your job search, run like a product launch.</div>
 </AbsoluteFill>};

const OV=6;
const SC=[['B1',72],['B2',Math.round(BM_BASE_SECONDS*30)],['B3',100],['End',78]];
let t=0;const starts=SC.map(([,d])=>{const s=t;t+=d-OV;return s});
const END_AT=starts[3];
export const TEASER_TOTAL=starts[3]+SC[3][1];
export const Teaser=()=><AbsoluteFill><Background/>
 {[S1,S2,S3].map((C,i)=><Sequence key={'c'+i} from={starts[i]} durationInFrames={SC[i][1]}><Cap i={i} dur={SC[i][1]}/></Sequence>)}
 <Phone enter={0}>{[S1,S2,S3].map((C,i)=><Sequence key={'s'+i} from={starts[i]} durationInFrames={SC[i][1]}><C dur={SC[i][1]}/></Sequence>)}</Phone>
 <Sequence from={0} durationInFrames={SC[0][1]}><Badge dur={SC[0][1]}/></Sequence>
 <Sequence from={starts[1]} durationInFrames={SC[1][1]}><Beat dur={SC[1][1]}><BulletMatch layout="portrait"/></Beat></Sequence>
 <Sequence from={starts[2]} durationInFrames={SC[2][1]}><FloatRow dur={SC[2][1]}/></Sequence>
 <Sequence from={starts[3]} durationInFrames={SC[3][1]}><End dur={SC[3][1]}/></Sequence>
</AbsoluteFill>;
