import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig,interpolate,spring,Easing,staticFile,continueRender,delayRender} from 'remotion';
import {BulletMatch} from './BulletMatch.jsx';
import boxes from '../public/shots/boxes.json';

const GREEN='#173d2b',MUTED='#5b7a6a';
const ease=Easing.inOut(Easing.cubic);
const ip=(f,r,o)=>interpolate(f,r,o,{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const shot=n=>staticFile('shots/'+n+'.png');

// fonts
const fr=delayRender('fonts');
Promise.all([['500','DMSans-500.ttf'],['700','DMSans-700.ttf']].map(([w,f])=>{const ff=new FontFace('DM Sans',`url(${staticFile('fonts/'+f)})`,{weight:w});return ff.load().then(x=>document.fonts.add(x))})).then(()=>continueRender(fr)).catch(()=>continueRender(fr));
const FONT="'DM Sans',system-ui,sans-serif";

const Background=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:'linear-gradient(160deg,#e8f6ee 0%,#f2faf6 100%)'}}>
 <div style={{position:'absolute',left:-120,top:-160,width:560,height:560,borderRadius:'50%',background:'#c4ebd7',opacity:.28,filter:'blur(110px)'}}/>
 <div style={{position:'absolute',right:-140,bottom:-200,width:620,height:620,borderRadius:'50%',background:'#fde8d2',opacity:.28,filter:'blur(120px)'}}/>
</AbsoluteFill>};

const Caption=({title,sub,pre=0})=>{const f=useCurrentFrame()+pre;const {fps}=useVideoConfig();
 const s=spring({frame:f,fps,config:{damping:200}});const s2=spring({frame:f-4,fps,config:{damping:200}});
 return <div style={{position:'absolute',top:30,left:0,right:0,textAlign:'center',fontFamily:FONT}}>
  <div style={{fontSize:44,fontWeight:700,color:GREEN,letterSpacing:-1,opacity:s,transform:`translateY(${(1-s)*18}px)`}}>{title}</div>
  <div style={{fontSize:22,fontWeight:500,color:MUTED,marginTop:4,height:30,opacity:s2,transform:`translateY(${(1-s2)*12}px)`}}>{sub||''}</div>
 </div>};

const WIN_TOP=146,CH=28,CONTENT_H=470;
const Window=({w=1040,children,enter=0,style,pre=0})=>{
 const f=useCurrentFrame()+pre;const {fps}=useVideoConfig();
 const s=spring({frame:f-enter,fps,config:{damping:200}});
 return <div style={{position:'absolute',top:WIN_TOP,left:(1200-w)/2,width:w,height:CONTENT_H+CH,borderRadius:14,background:'#fff',overflow:'hidden',
  boxShadow:'0 24px 60px rgba(23,61,43,.18),0 4px 12px rgba(23,61,43,.08)',border:'1px solid rgba(23,61,43,.12)',opacity:s,transform:`translateY(${(1-s)*36}px) scale(${.96+.04*s})`,...style}}>
  <div style={{height:CH,background:'#eef1ef',display:'flex',alignItems:'center',paddingLeft:12,gap:7,borderBottom:'1px solid rgba(0,0,0,.07)'}}>
   {['#f0a3a0','#f1d38c','#a5d6a7'].map(c=><div key={c} style={{width:10,height:10,borderRadius:5,background:c}}/>)}
   <div style={{marginLeft:16,height:16,width:260,borderRadius:8,background:'#fff',opacity:.8}}/>
  </div>
  <div style={{position:'relative',height:CONTENT_H,overflow:'hidden'}}>{children}</div>
 </div>};

// shows page shot cropped to view {x,y,w} (css px of 1600-wide page); overlays given in page coords
const Shot=({src,view,W=1040,opacity=1,children,style})=>{
 const s=W/view.w;
 return <div style={{position:'absolute',inset:0,opacity,...style}}>
  <div style={{position:'absolute',left:0,top:0,width:1600,transformOrigin:'0 0',transform:`translate(${-view.x*s}px,${-view.y*s}px) scale(${s})`}}>
   <img src={shot(src)} style={{width:1600,display:'block'}}/>{children}
  </div></div>};
const lerpView=(f,r,a,b)=>({x:ip(f,r,[a.x,b.x]),y:ip(f,r,[a.y,b.y]),w:ip(f,r,[a.w,b.w])});

const Glow=({b,f,pad=6,color='#e9a86a',delay=0})=>{
 const p=ip(f,[delay,delay+8],[0,1]);const pulse=.5+.5*Math.sin((f-delay)/3.2);
 return <div style={{position:'absolute',left:b.x-pad,top:b.y-pad,width:b.width+pad*2,height:b.height+pad*2,borderRadius:14,opacity:p,
  border:`4px solid ${color}`,boxShadow:`0 0 ${24+pulse*26}px ${6+pulse*6}px ${color}88`}}/>};

const Beat=({dur,children,first,last})=>{const f=useCurrentFrame();
 const o=Math.min(first?1:ip(f,[0,5],[0,1]),last?1:ip(f,[dur-5,dur],[1,0]));
 return <AbsoluteFill style={{opacity:o}}>{children}</AbsoluteFill>};

const ScoreBadge=({f})=>{const {fps}=useVideoConfig();
 const s=spring({frame:f-14,fps,config:{damping:12,stiffness:120}});
 const v=Math.round(ip(f,[14,46],[0,93]));const R=44,C=2*Math.PI*R;
 return <div style={{position:'absolute',left:1000,top:WIN_TOP+78,width:132,transform:`scale(${s})`,opacity:Math.min(1,s*2),textAlign:'center',fontFamily:FONT}}>
  <div style={{position:'relative',width:112,height:112,margin:'0 auto',borderRadius:56,background:'#fff',boxShadow:'0 14px 34px rgba(23,61,43,.25)'}}>
   <svg width="112" height="112" style={{position:'absolute',inset:0,transform:'rotate(-90deg)'}}><circle cx="56" cy="56" r={R} fill="none" stroke="#e1efe7" strokeWidth="9"/><circle cx="56" cy="56" r={R} fill="none" stroke="#2f7d55" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-v/100)}/></svg>
   <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,fontWeight:700,color:GREEN}}>{v}</div>
  </div>
  <div style={{marginTop:8,display:'inline-block',padding:'3px 12px',borderRadius:12,background:GREEN,color:'#fff',fontSize:14,fontWeight:700}}>Match score</div>
 </div>};

const B1=()=>{const f=useCurrentFrame();
 const v=lerpView(f,[4,36],{x:50,y:290,w:1500},{x:175,y:338,w:1250});
 return <>
  <Caption pre={6} title="A great role finds you." sub="Scored against what you want, every day."/>
  <Window pre={6} enter={0}><Shot src="01-leads" view={v}/></Window>
  <ScoreBadge f={f}/>
 </>};

const Cross=({f,at,len=6,a,b})=>{const o=ip(f,[at,at+len],[0,1]);return <>{a(1-o)}{b(o)}</>};

const B2=()=>{const f=useCurrentFrame();
 const v1=lerpView(f,[0,14],{x:200,y:410,w:1200},{x:240,y:400,w:1120});
 const v2=lerpView(f,[26,40],{x:110,y:300,w:1380},{x:130,y:300,w:1340});
 const o=ip(f,[26,32],[0,1]);
 return <>
  <Caption title="One click to your pipeline." sub="The lead becomes a tracked opportunity."/>
  <Window enter={0}>
   <Shot src="03-toast" view={v1} opacity={1-o}/>
   <Shot src="04-pipeline" view={v2} opacity={o}><Glow b={boxes['04-pipeline']} f={f} delay={30}/></Shot>
  </Window></>};

const B3=()=>{const f=useCurrentFrame();
 const bm=1-ip(f,[78,84],[0,1]);
 return <>
  <Caption title="Built for this role." sub="Only bullets from your real experience."/>
  <div style={{position:'absolute',inset:0,opacity:bm}}>{f<86&&<BulletMatch layout="landscape" ts={1.2}/>}</div>
  {f>=80&&<Window w={760} enter={80}><Shot src="09-tailor-letter" W={760} view={{x:440,y:300,w:720}}/><TabPill f={100}/></Window>}
 </>};
const TabPill=({f})=>{const letter=f>=61;return <div style={{position:'absolute',right:14,bottom:14,fontFamily:FONT,fontSize:14,fontWeight:700,padding:'5px 12px',borderRadius:14,background:GREEN,color:'#fff',opacity:ip(f,[26,34],[0,1]),boxShadow:'0 6px 16px rgba(23,61,43,.3)'}}>{letter?'Cover letter':'Resume'}</div>};

const B4=()=>{const f=useCurrentFrame();
 const v1=lerpView(f,[0,16],{x:360,y:255,w:880},{x:380,y:266,w:840});
 const v2=lerpView(f,[28,42],{x:110,y:300,w:1380},{x:130,y:300,w:1340});
 const o=ip(f,[28,34],[0,1]);
 return <>
  <Caption title="Apply, and always know what's next." sub="Follow-ups, deadlines and whose turn it is."/>
  <Window enter={0}>
   <Shot src="12-applied-dialog" view={v1} opacity={1-o}/>
   <Shot src="13-row-applied" view={v2} opacity={o}><Glow b={boxes['13-row-applied']} f={f} delay={34}/></Shot>
  </Window></>};

const DAYS=[['14-board-applied','Day 1'],['15-board-screen','Day 6'],['16-board-loop','Day 15'],['17-board-offer','Day 24']];
const B5=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const seg=[0,17,34,51];const idx=seg.filter(s=>f>=s+ (s? 3:0)).length-1;
 const view=lerpView(f,[0,80],{x:10,y:340,w:1580},{x:10,y:340,w:1580});
 const pop=spring({frame:f-seg[Math.max(idx,0)]-3,fps,config:{damping:10,stiffness:200}});
 const last=idx===3;
 return <>
  <Caption title="…all the way to the offer." sub="Every stage, one board."/>
  <Window enter={0}>
   {DAYS.map(([n],i)=>{const o=i===0?1-ip(f,[seg[1],seg[1]+6],[0,1])*1:Math.min(ip(f,[seg[i],seg[i]+6],[0,1]),i<3?1-ip(f,[seg[i+1],seg[i+1]+6],[0,1]):1);
    return <Shot key={n} src={n} view={view} opacity={Math.max(0,o)}><Glow b={boxes[n]} f={f} delay={i===3?seg[3]+4:seg[i]+2} color={i===3?'#e08a3a':'#e9a86a'}/></Shot>})}
  </Window>
  <div style={{position:'absolute',top:WIN_TOP-14,left:930,fontFamily:FONT,fontWeight:700,fontSize:20,color:'#fff',background:last?'#c9702a':GREEN,padding:'8px 20px',borderRadius:22,boxShadow:'0 10px 24px rgba(23,61,43,.3)',transform:`scale(${.9+.1*pop})`}}>{DAYS[Math.max(idx,0)][1]}</div>
 </>};

export const Logo=({size})=><svg width={size} height={size} viewBox="0 0 32 32"><rect width="32" height="32" rx="7.5" fill="#1d4632"/><circle cx="16" cy="16" r="12" fill="none" stroke="#fff" strokeWidth="1.6"/><path d="M16 4v3.5M16 24.5V28M4 16h3.5M24.5 16H28" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><g transform="rotate(35 16 16)"><path d="M16 8.5 18.4 16h-4.8z" fill="#e9a86a"/><path d="M16 23.5 18.4 16h-4.8z" fill="#fff"/></g></svg>;

const End=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f,fps,config:{damping:14}});const s2=spring({frame:f-5,fps,config:{damping:200}});const s3=spring({frame:f-10,fps,config:{damping:200}});
 return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',fontFamily:FONT,textAlign:'center'}}>
  <div style={{transform:`scale(${s}) rotate(${(1-s)*-25}deg)`,filter:'drop-shadow(0 14px 24px rgba(23,61,43,.25))'}}><Logo size={120}/></div>
  <div style={{fontSize:52,fontWeight:700,color:GREEN,letterSpacing:-1,marginTop:22,opacity:s2,transform:`translateY(${(1-s2)*16}px)`}}>Career Command Center</div>
  <div style={{fontSize:28,fontWeight:500,color:'#2b5a43',marginTop:10,opacity:s3,transform:`translateY(${(1-s3)*14}px)`}}>Your job search, run like a product launch.</div>
  <div style={{fontSize:20,fontWeight:500,color:MUTED,marginTop:16,opacity:s3,letterSpacing:.5}}>Free · Private · Yours</div>
 </AbsoluteFill>};

const SC=[['B1',66,B1],['B2',56,B2],['B3',98,B3],['B4',58,B4],['B5',80,B5],['End',36,End]];
const OV=5;
let t=0;const starts=SC.map(([,d])=>{const s=t;t+=d-OV;return s});
export const TOTAL=starts[starts.length-1]+SC[SC.length-1][1];
export const Story=()=><AbsoluteFill><Background/>
 {SC.map(([k,d,C],i)=><Sequence key={k} from={starts[i]} durationInFrames={d}><Beat dur={d} first={i===0} last={i===SC.length-1}><C/></Beat></Sequence>)}
</AbsoluteFill>;
