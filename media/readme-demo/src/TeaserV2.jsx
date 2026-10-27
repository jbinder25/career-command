import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig,interpolate,spring,Easing,staticFile,continueRender,delayRender} from 'remotion';
import {Logo} from './Story.jsx';

// Teaser V2: headline-only scenes, 1080x1920 @ 30 fps. All data is fictional.
const GREEN='#173d2b',MUTED='#5b7a6a',ORANGE='#e9a86a',FONT="'DM Sans',system-ui,sans-serif";
const ease=Easing.inOut(Easing.cubic);
const ip=(f,r,o)=>interpolate(f,r,o,{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const eo3=u=>1-Math.pow(1-Math.min(1,Math.max(0,u)),3);

const fr=delayRender('teaser-v2-fonts');
Promise.all([['500','DMSans-500.ttf'],['700','DMSans-700.ttf']].map(([w,f])=>{const ff=new FontFace('DM Sans',`url(${staticFile('fonts/'+f)})`,{weight:w});return ff.load().then(x=>document.fonts.add(x))})).then(()=>continueRender(fr)).catch(()=>continueRender(fr));

const Background=()=><AbsoluteFill style={{background:'linear-gradient(170deg,#e8f6ee 0%,#f2faf6 100%)'}}>
 <div style={{position:'absolute',left:-200,top:-80,width:760,height:760,borderRadius:'50%',background:'#c4ebd7',opacity:.3,filter:'blur(140px)'}}/>
 <div style={{position:'absolute',right:-240,bottom:-120,width:820,height:820,borderRadius:'50%',background:'#fde8d2',opacity:.3,filter:'blur(150px)'}}/>
</AbsoluteFill>;

// One headline per scene (top 236 .. ~400, inside the safe zone). a = frame it appears, b = frame it leaves.
const H=({text,f,a=0,b=null})=>{
 const i=ip(f,[a,a+12],[0,1]);const o=b===null?1:ip(f,[b,b+8],[1,0]);
 return <div style={{position:'absolute',top:236,left:90,width:900,textAlign:'center',whiteSpace:'pre-line',fontFamily:FONT,fontSize:76,fontWeight:700,color:GREEN,letterSpacing:-2,lineHeight:1.08,opacity:i*o,transform:`translateY(${(1-i)*26-(1-o)*14}px)`}}>{text}</div>};

const Scene=({from,dur,first,last,children})=><Sequence from={from} durationInFrames={dur}><SceneFade dur={dur} first={first} last={last}>{children}</SceneFade></Sequence>;
const SceneFade=({dur,first,last,children})=>{const f=useCurrentFrame();
 const o=Math.min(first?1:ip(f,[0,15],[0,1]),last?1:ip(f,[dur-15,dur],[1,0]));
 return <AbsoluteFill style={{opacity:o}}>{children}</AbsoluteFill>};

const SH='0 34px 80px rgba(23,61,43,.22),0 8px 22px rgba(23,61,43,.10)';
const Bar=({w,h=14,c='#e4e9e6',style})=><div style={{width:w,height:h,borderRadius:h/2,background:c,...style}}/>;
const Chip=({text,hi,w,icon,style})=><div style={{display:'inline-flex',alignItems:'center',boxSizing:'border-box',height:80,width:w,padding:'0 30px 0 18px',borderRadius:24,fontFamily:FONT,fontSize:36,fontWeight:700,whiteSpace:'nowrap',
 background:hi?'#e4f5ec':'#fff',border:hi?'3px solid #2f7d55':'2px solid #d9e6de',boxShadow:hi?'none':'0 8px 22px rgba(23,61,43,.08)',color:hi?GREEN:MUTED,...style}}>
 <span style={{width:44,height:44,borderRadius:22,marginRight:18,flex:'none',display:'flex',alignItems:'center',justifyContent:'center',background:hi?'#2f7d55':'#dcece3',color:'#fff',fontSize:28}}>
  {icon||(hi?'✓':<span style={{width:14,height:14,borderRadius:7,background:'#7fbf9d',display:'block'}}/>)}</span>{text}</div>;
const ClockIcon=()=><span style={{position:'relative',width:44,height:44,borderRadius:22,boxSizing:'border-box',border:`5px solid ${ORANGE}`,background:'#fff',display:'block'}}>
 <span style={{position:'absolute',left:15,top:7,width:4,height:13,borderRadius:2,background:ORANGE}}/><span style={{position:'absolute',left:15,top:17,width:11,height:4,borderRadius:2,background:ORANGE}}/></span>;
const STAGE={prospect:['Prospect','#9aa9a1','#eef1ef',MUTED],applied:['Applied','#5b8fd0','#eaf2fb','#2d5a8a'],screen:['Recruiter screen','#a78bd0','#f1ebfa','#5a3f8a'],loop:['Interview loop','#2f7d55','#e4f5ec',GREEN],offer:['Offer',ORANGE,'#fdeedd','#8a4b10']};
const StagePill=({k,h=60,size=34,style})=>{const [t,d,bg,c]=STAGE[k];return <div style={{display:'inline-flex',alignItems:'center',height:h,boxSizing:'border-box',padding:'0 28px 0 22px',borderRadius:h/2,background:bg,fontFamily:FONT,fontSize:size,fontWeight:700,color:c,whiteSpace:'nowrap',...style}}>
 <span style={{width:18,height:18,borderRadius:9,background:d,marginRight:14,flex:'none'}}/>{t}</div>};
// blank illustrative card (title bar + grey bars)
const BlankCard=({w,h})=><div style={{position:'relative',width:w,height:h,borderRadius:30,background:'#fff',boxShadow:SH}}>
 <Bar w={w*.5} h={32} c="#cfd6d2" style={{position:'absolute',left:36,top:40}}/>
 {[0,1,2,3,4].map(i=><Bar key={i} w={i%2?w*.55:w*.75} h={16} c="#e4e9e6" style={{position:'absolute',left:36,top:120+i*40}}/>)}
 <Bar w={w*.36} h={44} c="#ece9e3" style={{position:'absolute',left:36,top:h-96}}/></div>;
const HeroCard=({h,chipO,style,name='Kestrel AI',role='Senior PM, Developer Platform',tsz=56,children})=><div style={{position:'relative',width:760,height:h,borderRadius:30,background:'#fff',boxShadow:SH,overflow:'hidden',...style}}>
 <div style={{position:'absolute',left:44,top:34,fontFamily:FONT,fontSize:tsz,fontWeight:700,color:GREEN,letterSpacing:-1,whiteSpace:'nowrap'}}>{name}</div>
 <div style={{position:'absolute',left:44,top:112,fontFamily:FONT,fontSize:30,fontWeight:500,color:MUTED,whiteSpace:'nowrap'}}>{role}</div>
 <Bar w={560} h={16} c="#e4e9e6" style={{position:'absolute',left:44,top:174}}/><Bar w={400} h={16} c="#eef1ef" style={{position:'absolute',left:44,top:208}}/>
 <div style={{position:'absolute',left:44,top:262,opacity:chipO}}><Chip hi text="Developer platforms"/></div>
 <div style={{position:'absolute',left:44,top:358,opacity:chipO}}><Chip text={'Remote · $210K+'}/></div>
 {children}
</div>;
// placeholder lead card with a visible low score
const LowCard=({score,tone,style})=><div style={{position:'relative',width:760,height:340,borderRadius:30,background:'#fff',boxShadow:SH,...style}}>
 <div style={{position:'absolute',left:36,top:36,width:150,height:150,borderRadius:28,background:tone[0],color:tone[1],fontFamily:FONT,fontWeight:700,fontSize:78,display:'flex',alignItems:'center',justifyContent:'center'}}>{score}</div>
 <Bar w={200} h={20} c="#dbe9e1" style={{position:'absolute',left:220,top:44}}/><Bar w={360} h={32} c="#cfd6d2" style={{position:'absolute',left:220,top:84}}/><Bar w={440} h={22} c="#e3e8e5" style={{position:'absolute',left:220,top:136}}/>
 <Bar w={190} h={46} c="#ece9e3" style={{position:'absolute',left:36,top:222}}/><Bar w={250} h={46} c="#ece9e3" style={{position:'absolute',left:246,top:222}}/>
</div>;

// ---------------- Scenes 1 + 2: discovery, then obvious sorting (Pass / Shortlist 80+) -> pipeline ----------------
const LT=830,LH=470,LW=470,LX={P:60,S:550},CS2=.56,CWD=760,CHT=200; // lanes: top, height, width, x; sorted-card scale / size
const slotXY=(lane,slot)=>[LX[lane]+(LW-CWD*CS2)/2,LT+130+slot*134];
const RX=170,RY=724,RS=740/760; // pipeline row the Kestrel card lands on
const TONE={g:{stroke:'#2f7d55',track:'#e1efe7',num:GREEN},r:{stroke:'#c98a8a',track:'#f1e3e3',num:'#8c5a5a'}};
const SD=13; // slide duration (frames)
const CARDS=[
 {n:'Kestrel AI',r:'Senior PM, Developer Platform',sc:93,lane:'S',slot:0,arr:0,sl:127},
 {n:'Brightline Robotics',r:'Product Manager, Fleet Software',sc:41,lane:'P',slot:0,arr:140,sl:156},
 {n:'Meridian Health',r:'Senior PM, Care Platform',sc:84,lane:'S',slot:1,arr:169,sl:185},
 {n:'Quarry',r:'Associate PM, Internal Tools',sc:58,lane:'P',slot:1,arr:198,sl:214}];
const Icon=({kind,size=30})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
 {kind==='check'?<path d="M5 12.5l4.5 4.5L19 7.5"/>:<path d="M7 7l10 10M17 7L7 17"/>}</svg>;
const Badge=({D,v,ringV,tone})=>{const t=TONE[tone],R=70,C=2*Math.PI*R;
 return <div style={{position:'relative',width:D,height:D,borderRadius:'50%',background:'#fff',boxShadow:`0 ${D*.126}px ${D*.28}px rgba(23,61,43,.3)`}}>
  <svg width={D} height={D} viewBox="0 0 190 190" style={{position:'absolute',inset:0,transform:'rotate(-90deg)'}}><circle cx="95" cy="95" r={R} fill="none" stroke={t.track} strokeWidth="14"/><circle cx="95" cy="95" r={R} fill="none" stroke={t.stroke} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-ringV/100)}/></svg>
  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT,fontSize:D*.4,fontWeight:700,color:t.num}}>{v}</div></div>};
const Lane=({kind,count,bump,o})=>{const S=kind==='S';
 return <div style={{position:'absolute',left:LX[kind],top:LT+(1-o)*40,width:LW,height:LH,boxSizing:'border-box',borderRadius:36,opacity:o,background:S?'#e4f5ec':'#eceeed',border:`3px solid ${S?'#2f7d55':'#dcc3c3'}`,boxShadow:'inset 0 12px 28px rgba(23,61,43,.12),inset 0 -2px 0 rgba(255,255,255,.7)'}}>
  <div style={{position:'absolute',left:24,top:26,display:'flex',alignItems:'center',fontFamily:FONT,fontSize:40,fontWeight:700,color:S?GREEN:'#7d6a6a',whiteSpace:'nowrap'}}>
   <span style={{width:52,height:52,borderRadius:26,marginRight:14,background:S?'#2f7d55':'#c99a9a',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon kind={S?'check':'cross'}/></span>{S?'Shortlist · 80+':'Pass'}</div>
  <div style={{position:'absolute',right:-15,top:-28,width:64,height:64,borderRadius:32,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT,fontSize:36,fontWeight:700,color:'#fff',background:S?'#2f7d55':'#c99a9a',border:'4px solid #fff',boxShadow:'0 8px 18px rgba(23,61,43,.2)',opacity:count?1:.55,transform:`scale(${1+.4*bump})`}}>{count}</div>
 </div>};
const SceneA=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const D1=95; // D1: discovery headline leaves; sorting scene follows
 const enter=ip(f,[21,51],[0,1]);
 const m=ip(f,[98,116],[0,1]); // hero card shrinks into a compact card
 const outF=1-ip(f,[234,246],[0,1]),laneIn=ip(f,[100,118],[0,1]),q=ip(f,[236,258],[0,1]),panelO=ip(f,[232,244],[0,1]);
 // hero badge
 const bs=spring({frame:f-33,fps,config:{damping:16,stiffness:110}});const v=Math.round(ip(f,[33,72],[0,93]));
 // drifting faint cards
 const drift=[[0,1150,-560,700,22,76,.5],[0,-560,1150,1000,21,73,.45],[0,1150,-560,1180,24,78,.4]];
 const gl=ip(f,[256,262],[0,1]),pulse=.78+.22*Math.sin((f-256)/6);
 const cnt={S:0,P:0},bump={S:0,P:0};
 CARDS.forEach(c=>{const t=(f-c.sl-SD)/10;if(t>=0)cnt[c.lane]++;if(t>=0&&t<1)bump[c.lane]=Math.max(bump[c.lane],Math.sin(Math.PI*t))});
 return <AbsoluteFill>
  <H text={"The right jobs.\nFound for you."} f={f} b={D1}/>
  <H text={"Less noise.\nBetter matches."} f={f} a={D1+8} b={270}/>
  {drift.map(([s,x0,x1,y,f0,f1,op],i)=>{const t=ip(f,[f0,f1],[0,1]);return <div key={i} style={{position:'absolute',left:x0+(x1-x0)*t,top:y-(i===1?560:0),width:520,height:620,opacity:op*Math.min(ip(f,[f0,f0+6],[0,1]),ip(f,[f1-6,f1],[1,0])),filter:'blur(7px)'}}><BlankCard w={520} h={620}/></div>})}
  {laneIn>0&&['P','S'].map(k=><Lane key={k} kind={k} count={cnt[k]} bump={bump[k]} o={laneIn*outF}/>)}
  {panelO>0&&<><div style={{position:'absolute',left:140,top:506,fontFamily:FONT,fontSize:34,fontWeight:700,color:MUTED,opacity:panelO}}>Pipeline</div>
  <div style={{position:'absolute',left:140,top:560,width:800,height:663,borderRadius:30,overflow:'hidden',background:'#f4f7f5',boxShadow:SH,opacity:panelO}}>
   {[[24,120],[164,195],[379,120],[519,120]].map(([y,rh],i)=>i===1
    ?<div key={i} style={{position:'absolute',left:30,top:y,width:740,height:rh,boxSizing:'border-box',borderRadius:26,border:'3px dashed #c4d8cc'}}/>
    :<div key={i} style={{position:'absolute',left:30,top:y,width:740,height:rh,borderRadius:26,background:'#fff',boxShadow:'0 10px 26px rgba(23,61,43,.08)'}}>
      <Bar w={i%2?460:300} h={28} c="#cfd6d2" style={{position:'absolute',left:36,top:28}}/><Bar w={i%2?380:460} h={16} c="#e4e9e6" style={{position:'absolute',left:36,top:76}}/></div>)}</div></>}
  {[1,2,3,0].map(i=>{const c=CARDS[i],hero=i===0;
   const p=ip(f,[c.sl,c.sl+SD],[0,1]);const [tx,ty]=slotXY(c.lane,c.slot);
   const ar=hero?1:ip(f,[c.arr,c.arr+5],[0,1]);
   const o=hero?Math.min(enter*1.5,1):ar*outF;if(o<=0)return null;
   const x0=hero?110+50*m:160,y0=hero?470+30*m+(1-enter)*70:500+(1-ar)*40;
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
  <div style={{position:'absolute',left:0,right:0,top:1262,textAlign:'center',fontFamily:FONT,opacity:ip(f,[258,268],[0,1]),transform:`translateY(${(1-ip(f,[258,268],[0,1]))*16}px)`}}>
   <span style={{display:'inline-block',padding:'10px 30px',borderRadius:40,background:GREEN,color:'#fff',fontSize:36,fontWeight:700}}>{'✓'} Added to pipeline</span></div>
 </AbsoluteFill>};

// ---------------- Scene 3: tailoring ----------------
const RW=760,RH=980,GL=160,GT=500; // resume group box
const ACC=[['Grew active developers 4x'],['Moved API to usage-based pricing'],['Organized a 200-person hackathon']];
const SLOT=[[48,270],[48,396]],CY=[100,246,392],CS=.772;
const Resume=()=><div style={{position:'absolute',left:0,top:0,width:RW,height:RH,borderRadius:28,background:'#fff',boxShadow:SH}}>
 <div style={{position:'absolute',left:48,top:44,fontFamily:FONT,fontSize:54,fontWeight:700,color:GREEN,letterSpacing:-1}}>Alex Rivera</div>
 <Bar w={300} h={18} style={{position:'absolute',left:48,top:122}}/><Bar w={440} h={14} c="#eef1ef" style={{position:'absolute',left:48,top:156}}/>
 <Bar w={160} h={16} c="#b9d8c8" style={{position:'absolute',left:48,top:218}}/>
 {[0,1].map(i=><React.Fragment key={i}><Bar w={560} h={14} c="#eef1ef" style={{position:'absolute',left:60,top:SLOT[i][1]+26}}/><Bar w={420} h={14} c="#eef1ef" style={{position:'absolute',left:60,top:SLOT[i][1]+54}}/></React.Fragment>)}
 <Bar w={160} h={16} c="#cfd8d3" style={{position:'absolute',left:48,top:540}}/>
 {[0,1,2,3,4].map(i=><Bar key={i} w={i%2?520:610} h={14} style={{position:'absolute',left:48,top:584+i*34}}/>)}
 <Bar w={160} h={16} c="#cfd8d3" style={{position:'absolute',left:48,top:790}}/>
 {[0,1,2,3].map(i=><Bar key={i} w={i%2?480:590} h={14} style={{position:'absolute',left:48,top:834+i*34}}/>)}
</div>;
const Letter=()=><div style={{position:'absolute',left:0,top:0,width:RW,height:RH,borderRadius:28,background:'#fffdf8',boxShadow:SH}}>
 <Bar w={200} h={16} c="#e9e3d6" style={{position:'absolute',right:56,top:56}}/><Bar w={150} h={14} c="#eee9de" style={{position:'absolute',right:56,top:88}}/>
 <div style={{position:'absolute',left:56,top:170,fontFamily:FONT,fontSize:50,fontWeight:700,color:GREEN}}>Dear hiring team,</div>
 {[[0,300],[1,300],[2,300]].map(([p,y0],pi)=>[0,1,2,3,4].map(i=><Bar key={pi+'-'+i} w={i===4?330:648} h={14} c="#e8e6df" style={{position:'absolute',left:56,top:260+pi*196+i*30}}/>))}
 <div style={{position:'absolute',left:56,top:850,fontFamily:FONT,fontSize:34,fontWeight:500,color:MUTED}}>Sincerely,</div>
 <Bar w={190} h={20} c="#cfc9b8" style={{position:'absolute',left:56,top:906}}/>
</div>;

const Scene3=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const hack=ip(f,[48,64],[0,1]),res=ip(f,[50,64],[0,1]),hi=ip(f,[48,55],[0,1]);
 const c=ip(f,[76,96],[0,1]),letterIn=ip(f,[80,100],[0,1]);
 const pop=spring({frame:f-98,fps,config:{damping:13,stiffness:160}});
 const pre=ip(f,[29,41],[0,1])*(1-ip(f,[48,58],[0,1]));
 const cardStyle=i=>{
  const ent=ip(f,[29+i*4,43+i*4],[0,1]);
  let x=-50,y=CY[i]+(1-ent)*40,s=1;
  if(i<2){const p=i===0?ip(f,[51,73],[0,1]):ip(f,[50,76],[0,1]);x=-50+(SLOT[i][0]+50)*p;y=CY[i]+(SLOT[i][1]-CY[i])*p+(1-ent)*40*(1-p);s=1-(1-CS)*p;}
  return {x,y,s,ent};};
 return <AbsoluteFill>
  <H text={"Your experience.\nPerfectly positioned."} f={f} a={8} b={140}/>
  <div style={{position:'absolute',left:0,right:0,top:440,textAlign:'center',fontFamily:FONT,opacity:pre,transform:`translateY(${(1-pre)*14}px)`}}>
   <span style={{display:'inline-block',padding:'10px 30px',borderRadius:40,background:'#fdeedd',border:`2px solid ${ORANGE}`,color:'#8a4b10',fontSize:32,fontWeight:700}}>Role needs: developer platforms</span></div>
  <div style={{position:'absolute',left:110,top:540,fontFamily:FONT,fontSize:32,fontWeight:700,color:MUTED,opacity:pre}}>Your experience</div>
  <div style={{position:'absolute',left:letterIn>0?580+(1-letterIn)*420:2000,top:600,width:RW,height:RH,opacity:letterIn,transform:`scale(.62) rotate(${2+(1-letterIn)*4}deg)`,transformOrigin:'0 0'}}><Letter/></div>
  <div style={{position:'absolute',left:GL,top:GT,width:RW,height:RH,transformOrigin:'0 0',transform:`translate(${-120*c}px,${100*c}px) scale(${1-.38*c}) rotate(${-2*c}deg)`}}>
   <div style={{opacity:res}}><Resume/></div>
   {[2,1,0].map(i=>{const {x,y,s,ent}=cardStyle(i);const first=i===0,second=i===1;
    const green=first?hi:0;const o=ent*(i===2?1-hack:1);
    return <div key={i} style={{position:'absolute',left:0,top:0,width:860,height:124,boxSizing:'border-box',borderRadius:26,background:green>0?`rgb(${255-28*green},${255-9*green},${255-17*green})`:'#fff',
     border:green>0?`3px solid rgba(47,125,85,${.3+.7*green})`:'2px solid #d9e6de',boxShadow:i===2&&hack>0?'none':'0 14px 34px rgba(23,61,43,.14)',opacity:o*(second?1-.25*ip(f,[60,74],[0,1]):1),
     transform:`translate(${x}px,${y}px) scale(${s*(i===2?1-.04*hack:1)})`,transformOrigin:'0 0',display:'flex',alignItems:'center',fontFamily:FONT,fontSize:40,fontWeight:700,color:i===2&&hack>0?MUTED:GREEN,filter:i===2?`grayscale(${hack})`:'none'}}>
     <div style={{width:48,height:48,borderRadius:24,marginLeft:28,marginRight:22,flex:'none',background:green>0?'#2f7d55':'#dcece3',color:'#fff',fontSize:30,display:'flex',alignItems:'center',justifyContent:'center'}}>{green>0?'✓':<span style={{width:14,height:14,borderRadius:7,background:second?'#7fbf9d':'#2f7d55',display:'block'}}/>}</div>
     <span style={{whiteSpace:'nowrap'}}>{ACC[i][0]}</span></div>})}
  </div>
  <div style={{position:'absolute',left:40,top:1176,opacity:Math.min(1,pop*2)*ip(f,[98,102],[0,1]),transform:`scale(${.6+.4*pop})`,transformOrigin:'0 50%',zIndex:5}}>
   <span style={{display:'inline-block',padding:'12px 28px',borderRadius:40,background:'#2f7d55',color:'#fff',fontFamily:FONT,fontSize:30,fontWeight:700,whiteSpace:'nowrap',boxShadow:'0 14px 30px rgba(23,61,43,.3)'}}>{'✓'} From your approved experience</span></div>
 </AbsoluteFill>};

// ---------------- Scenes 4 + 5: tracking, then the offer (same row card throughout) ----------------
const CELL=72,BOXW=400,PH=60,OVER=.22,CL=90,CT=600,CW=900,CH=440,PX=44,PY=186;
const REEL1=['applied','screen','loop','applied','screen','loop','applied'];
const REEL2=['loop','applied','screen','loop','applied','offer','applied'];
const reelPos=(f,LAND,n)=>{if(f<=0)return 0;if(f<=LAND)return (n+OVER)*eo3(f/LAND);
 const sp=spring({frame:f-LAND,fps:30,config:{damping:11,stiffness:160}});return n+OVER*(1-sp)};
const Reel=({cells,pos,blur})=><div style={{position:'absolute',left:PX,top:PY,width:BOXW,height:CELL,background:'#fff',overflow:'hidden'}}>
 <svg width="0" height="0" style={{position:'absolute'}}><filter id="vblur2" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation={`0 ${blur}`}/></filter></svg>
 <div style={{position:'absolute',left:0,top:0,width:BOXW,transform:`translateY(${-pos*CELL}px)`,filter:blur>.3?'url(#vblur2)':'none'}}>
  {cells.map((k,i)=><StagePill key={i} k={k} style={{position:'absolute',left:0,top:i*CELL+(CELL-PH)/2}}/>)}
 </div></div>;

const SceneB=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const G=102,g=f-G; // G: tracking headline leaves, offer begins
 const enter=ip(f,[0,20],[0,1]);
 // reel 1 (Applied -> Interview loop) and reel 2 (Interview loop -> Offer)
 const R1=29,L1=28,R2=G+33,L2=28;
 const p1=reelPos(f-R1,L1,5),v1=Math.abs(reelPos(f-R1+.5,L1,5)-reelPos(f-R1-.5,L1,5));
 const p2=reelPos(f-R2,L2,5),v2=Math.abs(reelPos(f-R2+.5,L2,5)-reelPos(f-R2-.5,L2,5));
 const reel1=f>=R1-2&&f<R1+L1+30,reel2=f>=R2-2&&f<R2+L2+30;
 const sw1=ip(f,[R1+L1+20,R1+L1+23],[0,1]),sw2=ip(f,[R2+L2+20,R2+L2+23],[0,1]);
 const landT=f-(R2+L2);const glow=landT>=0?Math.max(0,1-landT/24):0;
 const landed1=f-(R1+L1);
 const offerDot=spring({frame:landT,fps,config:{damping:11,stiffness:170}});
 // whose-turn ring (pulses on the "Waiting on company" badge)
 const rp=landed1>=0&&g<0?landed1:-1;const ringOn=ip(f,[R1+L1+4,R1+L1+14],[0,1])*(1-ip(f,[G-8,G+2],[0,1]));
 const ph=((f-(R1+L1))%36)/36;
 const lab=ip(f,[R1+L1+8,R1+L1+20],[0,1])*(1-ip(f,[G-8,G+2],[0,1]));
 // progress strip
 const sp=ip(f,[G+29,G+39],[0,1]);const prog=ip(f,[G+33,G+61],[0,2/3])+ip(f,[R2+L2,R2+L2+14],[0,1/3]);
  const rays=Array.from({length:10},(_,i)=>-115+i*(230/9));
 const cx=CL+PX+105,cy=CT+PY+36;
 const steps=['Lead','Applied','Interview','Offer'];
 const SX=140,SW=800;
 const stat=f<R1?'applied':(f<R2?'loop':'offer');
 return <AbsoluteFill>
  <H text={"Every opportunity.\nUnder control."} f={f} a={8} b={G}/>
  <H text={"From first match\nto final offer."} f={f} a={G+8} b={209}/>
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
  <div style={{position:'absolute',left:0,right:0,top:1080,textAlign:'center',fontFamily:FONT,opacity:lab,transform:`translateY(${(1-lab)*16}px)`}}>
   <span style={{display:'inline-block',padding:'12px 34px',borderRadius:44,background:'#fff',color:GREEN,fontSize:40,fontWeight:700,boxShadow:'0 12px 30px rgba(23,61,43,.16)',border:`2px solid ${ORANGE}`}}>Next: final round prep</span></div>
  <div style={{position:'absolute',left:SX,top:1110,width:SW,height:130,fontFamily:FONT,opacity:sp,transform:`translateY(${(1-sp)*16}px)`}}>
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

// ---------------- Scene 6: end card ----------------
const GH='github.com/jbinder25/career-console';
const End=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const s=spring({frame:f-8,fps,config:{damping:16,stiffness:110}});const s2=spring({frame:f-13,fps,config:{damping:26,stiffness:120}});
 const t2=ip(f,[22,30],[0,1])*(1-ip(f,[104,112],[0,1]));
 const m=ip(f,[106,130],[0,1]);
 const b1=spring({frame:f-114,fps,config:{damping:16,stiffness:140}}),b2=ip(f,[122,132],[0,1]),b3=ip(f,[127,137],[0,1]);
 return <AbsoluteFill style={{fontFamily:FONT,textAlign:'center',opacity:ip(f,[0,4],[0,1])}}>
  <div style={{position:'absolute',left:420,top:640-205*m,width:240,height:240,transform:`scale(${(1-.3*m)*s}) rotate(${(1-s)*-25}deg)`,filter:'drop-shadow(0 24px 40px rgba(23,61,43,.25))'}}><Logo size={240}/></div>
  <div style={{position:'absolute',left:0,right:0,top:910-215*m,fontSize:78,fontWeight:700,color:GREEN,letterSpacing:-2,whiteSpace:'nowrap',opacity:s2,transform:`translateY(${(1-s2)*24}px) scale(${1-.17*m})`}}>Career Command Center</div>
  <div style={{position:'absolute',left:0,right:0,top:1030,whiteSpace:'nowrap',fontSize:42,fontWeight:500,color:'#2b5a43',lineHeight:1.25,opacity:t2,transform:`translateY(${(1-t2)*16}px)`}}>Your data. Your rules. Your career.</div>
  <div style={{position:'absolute',left:0,right:0,top:870,fontSize:92,fontWeight:700,color:GREEN,letterSpacing:-2.5,whiteSpace:'nowrap',opacity:Math.min(1,b1*1.5),transform:`translateY(${(1-b1)*40}px) scale(${.9+.1*b1})`}}>Build your own.
   <div style={{margin:'10px auto 0',height:8,borderRadius:4,background:ORANGE,width:420*ip(f,[118,134],[0,1])}}/></div>
  <div style={{position:'absolute',left:0,right:0,top:1040,fontSize:46,fontWeight:500,color:'#2b5a43',opacity:b2,transform:`translateY(${(1-b2)*16}px)`}}>Free template on GitHub</div>
  <div style={{position:'absolute',left:0,right:0,top:1130,opacity:b3,transform:`translateY(${(1-b3)*16}px)`}}>
   <span style={{display:'inline-block',padding:'18px 38px',borderRadius:60,background:'#fff',border:'2px solid #bfdccd',fontSize:32,fontWeight:700,color:GREEN,boxShadow:'0 14px 34px rgba(23,61,43,.14)'}}>{GH}</span></div>
 </AbsoluteFill>};

const SC={A:[0,285],S3:[270,155],B:[410,224],E:[619,216]};
export const TEASER_V2_TOTAL=SC.E[0]+SC.E[1];
export const TeaserV2=()=><AbsoluteFill><Background/>
 <Scene from={SC.A[0]} dur={SC.A[1]} first><SceneA/></Scene>
 <Scene from={SC.S3[0]} dur={SC.S3[1]}><Scene3/></Scene>
 <Scene from={SC.B[0]} dur={SC.B[1]}><SceneB/></Scene>
 <Scene from={SC.E[0]} dur={SC.E[1]} last><End/></Scene>
</AbsoluteFill>;

// Shared pieces for TeaserV2Landscape.jsx (no change to the portrait composition).
export {GREEN,MUTED,ORANGE,FONT,ip,eo3,Background,Scene,SH,Bar,Chip,ClockIcon,StagePill,HeroCard,TONE,SD,CARDS,Icon,Badge,ACC,SLOT,CS,Resume,Letter,REEL1,REEL2,reelPos,Reel,GH,CELL,BOXW,PH,CW,CH,PX,PY,SC,CWD,CHT,CS2,RW,RH};
