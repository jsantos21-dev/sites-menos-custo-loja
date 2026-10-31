/* VYRANTE: five original interactive seasonal experiences.
   Original synthesized motifs (not recordings or copyrighted melodies).
   Sound is user-initiated, off by default. */
(()=>{"use strict";
const themes={
 christmas:{symbol:"❄",size:18,fall:43,tune:[67,72,76,74,69,72],wave:"sine",accent:"🎄",label:"Natal"},
 newyear:{symbol:"🎆",size:20,fall:27,tune:[69,76,73,81,78,76],wave:"triangle",accent:"🎆",label:"Ano Novo"},
 valentines:{symbol:"♥",size:18,fall:30,tune:[64,67,71,69,67,64],wave:"sine",accent:"♥",label:"Dia dos Namorados"},
 halloween:{symbol:"🎃",size:20,fall:34,tune:[52,55,54,50,51,47],wave:"triangle",accent:"🎃",label:"Halloween"},
 easter:{symbol:"🥚",size:20,fall:30,tune:[62,66,69,74,66,64],wave:"sine",accent:"🐰",label:"Páscoa"}
};
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const gust={x:-9999,y:-9999,power:0,time:0};
let storeField=null,screenField=null,storeTheme=null,screenTheme=null;
let audio=null,muted=true,melodyTimer=null,noteIndex=0;
let enabledThemes={christmas:true,newyear:true,valentines:true,halloween:true,easter:true};
const isMusicEnabled=theme=>!!themes[theme]&&enabledThemes[theme]!==false;
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function pushWind(x,y,power){gust.x=x;gust.y=y;gust.power=power;gust.time=performance.now();}
addEventListener("pointermove",e=>pushWind(e.clientX,e.clientY,e.pointerType==="touch"?12:6),{passive:true});
addEventListener("pointerdown",e=>pushWind(e.clientX,e.clientY,16),{passive:true});
addEventListener("touchmove",e=>{const t=e.touches[0];if(t)pushWind(t.clientX,t.clientY,12);},{passive:true});
class Field{
 constructor(root,theme,screen=false){
  this.root=root;this.theme=theme;this.screen=screen;this.active=true;this.raf=0;
  this.el=make("div","vyrant-magic-sky"+(screen?" vyrant-screen-sky":""));
  this.el.setAttribute("aria-hidden","true");root.append(this.el);
  this.items=[];
  if(!reduced){
   const n=innerWidth<650?14:innerWidth<1050?22:34;
   for(let i=0;i<n;i++){
    const part=make("span","vyrant-magic-part",themes[theme].symbol);
    part.style.fontSize=(themes[theme].size+(i%5-2)*2)+"px";
    this.el.append(part);
    this.items.push({
     el:part,x:Math.random()*innerWidth,y:Math.random()*innerHeight,
     vx:0,vy:0,speed:themes[theme].fall*(.5+Math.random()),phase:Math.random()*6.28,
     spin:Math.random()*40-20
    });
   }
   this.last=performance.now();this.began=this.last;
   this.frame=this.frame.bind(this);
   this.raf=requestAnimationFrame(this.frame);
  }
 }
 frame(now){
  if(!this.active)return;
  if(now-this.last<31){this.raf=requestAnimationFrame(this.frame);return;}
  const dt=Math.min(2,(now-this.last)/16.67||1);this.last=now;
  // The first 2 minutes are fully festive. Between 2 and 3 minutes,
  // gradually taper to 30% so the screen remains clean and performant.
  const mins=(now-this.began)/60000;
  const density=mins<=2?1:mins>=3?.30:1-.70*(mins-2);
  const visible=Math.max(4,Math.round(this.items.length*density));
  const width=innerWidth,height=innerHeight;
  if(!document.hidden&&this.el.isConnected){
   for(let i=0;i<this.items.length;i++){
    const p=this.items[i];
    if(i>=visible){if(p.el.style.display!=='none')p.el.style.display='none';continue;}
    if(p.el.style.display==='none')p.el.style.display='';
    const dx=p.x-gust.x,dy=p.y-gust.y,dist=Math.hypot(dx,dy)||1;
    const nearby=now-gust.time<520&&dist<210;
    if(nearby){
     const f=(1-dist/210)*gust.power*1.65;
     p.vx+=(dx/dist*f+1.6)*dt;
     p.vy+=(dy/dist*f*.58)*dt;
    }
    const breeze=Math.sin(now/1700+p.phase)*.35;
    p.vx=(p.vx+breeze*dt)*Math.pow(.97,dt);
    p.vy*=Math.pow(.965,dt);
    p.x+=(p.vx+breeze)*dt;
    p.y+=(p.speed/60+p.vy)*dt;
    if(p.y>height+48){p.y=-45;p.x=Math.random()*width;p.vx=0;p.vy=0;}
    if(p.x<-40)p.x=width+20;else if(p.x>width+40)p.x=-20;
    p.el.style.transform="translate3d("+p.x.toFixed(1)+"px,"+p.y.toFixed(1)+"px,0) rotate("+(p.spin+p.vx*2+Math.sin(now/1200+p.phase)*15).toFixed(1)+"deg)";
   }
  }
  this.raf=requestAnimationFrame(this.frame);
 }
 stop(){this.active=false;if(this.raf)cancelAnimationFrame(this.raf);this.el.remove();}
}
/* Five bespoke multi-instrument, original instrumental compositions.
   No third-party recordings or copyrighted arrangements used. */
const SCORES={
 christmas:{
  bpm:122,meter:4,lead:"bell",pad:"string",bass:"soft",name:"Noite de Luzes",
  chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60],[60,64,67],[57,60,64],[53,57,60],[55,59,62]],
  melody:[
  79,-1,79,81,79,76,74,-1,76,79,81,79,76,74,72,-1,
  74,76,79,76,74,72,74,-1,76,74,72,76,79,-1,76,-1,
  79,81,84,81,79,76,74,-1,76,79,81,84,83,79,76,-1,
  81,79,76,74,72,74,76,-1,79,76,74,72,74,-1,72,-1]
 },
 newyear:{
  bpm:115,meter:4,lead:"brass",pad:"string",bass:"round",name:"Horizontes de Ouro",
  chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62],[60,64,67],[53,57,60],[57,60,64],[55,59,62]],
  melody:[
  72,-1,76,-1,79,81,84,-1,83,81,79,76,79,-1,76,-1,
  77,79,81,84,81,-1,79,77,76,-1,79,-1,84,-1,83,-1,
  84,86,88,84,81,-1,79,81,84,-1,79,76,77,79,81,-1,
  86,84,81,79,76,77,79,-1,81,79,76,74,76,-1,72,-1]
 },
 valentines:{
  bpm:78,meter:3,lead:"harp",pad:"warm",bass:"soft",name:"Entre Dois Corações",
  chords:[[57,60,64],[53,57,60],[60,64,67],[55,59,62],[57,60,64],[53,57,60],[62,65,69],[57,60,64]],
  melody:[
  76,-1,79,81,79,76, 74,-1,76,79,76,72,
  72,-1,74,76,79,76, 74,-1,72,71,72,-1,
  76,-1,79,84,81,79, 76,-1,74,76,79,-1,
  81,-1,79,76,74,72, 74,-1,76,74,72,-1]
 },
 halloween:{
  bpm:102,meter:3,lead:"spooky",pad:"organ",bass:"dark",name:"Baile da Meia-Noite",
  chords:[[50,53,57],[53,56,60],[46,50,53],[49,52,56],[50,53,57],[46,50,53],[53,56,60],[49,52,56]],
  melody:[
  74,-1,77,78,77,-1, 72,73,74,-1,69,-1,
  70,72,73,76,73,-1, 69,-1,70,68,69,-1,
  74,77,81,78,77,-1, 76,73,74,-1,72,-1,
  70,68,69,73,72,-1, 74,-1,69,65,62,-1]
 },
 easter:{
  bpm:112,meter:4,lead:"flute",pad:"warm",bass:"round",name:"Jardim de Renovação",
  chords:[[62,66,69],[57,61,64],[59,62,66],[55,59,62],[62,66,69],[59,62,66],[55,59,62],[57,61,64]],
  melody:[
  74,-1,78,81,83,81,78,-1, 76,78,81,83,81,78,74,-1,
  76,78,81,78,76,74,76,-1, 78,-1,81,83,86,-1,83,-1,
  86,83,81,78,74,76,78,-1, 81,83,86,88,86,83,81,-1,
  83,81,78,76,74,76,78,-1, 81,78,76,74,78,-1,74,-1]
 }
};
let musicNext=0,musicStep=0,musicActive="",master=null;
function tone(midi,at,len,voice,vol){
 if(!audio||muted||!Number.isFinite(midi))return;
 const envelope=audio.createGain(),shape=audio.createBiquadFilter();
 const base=440*Math.pow(2,(midi-69)/12);
 const duration=Math.max(.065,len),sharp=voice==="bell"||voice==="harp";
 let waveform=voice==="brass"?"sawtooth":voice==="organ"?"square":voice==="flute"?"sine":voice==="string"?"sawtooth":voice==="warm"?"triangle":voice==="spooky"?"triangle":"sine";
 shape.type="lowpass";
 shape.frequency.value=voice==="organ"?1000:voice==="brass"?1400:voice==="string"?1000:voice==="dark"?570:voice==="flute"?2300:3000;
 const attack=sharp?.008:voice==="string"||voice==="warm"?.095:.027;
 const peak=Math.max(.0002,vol||.01);
 envelope.gain.setValueAtTime(.0001,at);
 envelope.gain.exponentialRampToValueAtTime(peak,at+attack);
 envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
 const osc=audio.createOscillator();osc.type=waveform;osc.frequency.setValueAtTime(base,at);
 if(voice==="spooky")osc.detune.setValueAtTime(-11,at);
 osc.connect(shape);shape.connect(envelope);envelope.connect(master);
 osc.start(at);osc.stop(at+duration+.015);
 if((voice==="bell"||voice==="harp")&&vol>.014){
  const harmon=audio.createOscillator(),hg=audio.createGain();
  harmon.type="sine";harmon.frequency.value=base*(voice==="bell"?2.01:2);
  hg.gain.setValueAtTime(.0001,at);hg.gain.exponentialRampToValueAtTime(peak*.16,at+.009);
  hg.gain.exponentialRampToValueAtTime(.0001,at+duration*.72);
  harmon.connect(hg);hg.connect(master);harmon.start(at);harmon.stop(at+duration+.02);
 }
}
function scheduleStep(theme,i,at){
 const score=SCORES[theme],meter=score.meter,barSteps=meter*2,bpm=score.bpm;
 const beat=60/bpm;
 const note=score.melody[i%score.melody.length];
 const length=.5*beat;
 if(note>=0){
  const next=score.melody[(i+1)%score.melody.length];
  tone(note,at,length*(next<0?1.75:.87),score.lead,score.lead==="brass"?.025:.029);
 }
 const atBar=i%barSteps;
 const chordIndex=Math.floor(i/barSteps)%score.chords.length;
 const chord=score.chords[chordIndex],bass=chord[0]-12;
 if(atBar===0){
  tone(bass,at,beat*(meter===3?1.2:1.55),score.bass,.032);
  chord.forEach((n,k)=>tone(n,at+k*.014,beat*(meter===3?2.2:2.9),score.pad,.008));
 }
 if(atBar===3||atBar===5){
  tone(chord[(i+chordIndex)%3]+12,at,beat*.37,score.lead,.0085);
 }
 if(theme==="christmas"&&(atBar===2||atBar===6))tone(96,at,beat*.13,"bell",.007);
 if(theme==="newyear"&&(atBar===0||atBar===4))tone(chord[2]+12,at,beat*.45,"brass",.011);
 if(theme==="halloween"&&(atBar===2||atBar===4))tone(bass+12,at,beat*.35,"organ",.016);
}
function stopMusic(){
 if(melodyTimer){clearInterval(melodyTimer);melodyTimer=null;}
 musicActive="";
}
function startAudio(){
 if(muted)return;
 const theme=screenTheme||storeTheme;
 if(!theme||!SCORES[theme]||!isMusicEnabled(theme)){stopMusic();return;}
 try{
  if(!audio){
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return;
   audio=new Audio();master=audio.createGain();master.gain.value=.18;master.connect(audio.destination);
  }
  if(audio.state==="suspended"){audio.resume().then(()=>{if(!muted)startAudio();}).catch(()=>{});return;}
  stopMusic();musicActive=theme;musicStep=0;musicNext=audio.currentTime+.05;
  melodyTimer=setInterval(()=>{
   if(muted||!audio||audio.state!=="running"||document.hidden)return;
   const current=screenTheme||storeTheme;
   if(current!==musicActive){startAudio();return;}
   const d=60/SCORES[musicActive].bpm/2;
   if(musicNext<audio.currentTime)musicNext=audio.currentTime+.04;
   while(musicNext<audio.currentTime+.18){
    scheduleStep(musicActive,musicStep,musicNext);
    musicStep++;musicNext+=d;
   }
  },80);
 }catch(e){console.warn("Áudio temático indisponível",e);}
}
function sound(note,duration=.13,level=.027,wave="sine"){
 if(muted||!audio||!master)return;
 tone(note,audio.currentTime+.008,duration,wave==="triangle"?"harp":"bell",level);
}
function setAudioButtonLabels(){
 document.querySelectorAll(".vyrant-audio-button").forEach(button=>{
  button.textContent=muted?"♪ Ouvir · "+(SCORES[screenTheme||storeTheme]?.name||"Trilha temática"):"♫ Silenciar música";
  button.setAttribute("aria-pressed",String(!muted));
 });
}
function toggleAudio(){
 if(!isMusicEnabled(screenTheme||storeTheme))return;
 muted=!muted;
 if(muted){stopMusic();}
 else startAudio();
 setAudioButtonLabels();
}
function audioButton(where,mode){
 const button=make("button","vyrant-audio-button"+(mode==="screen"?" screen-audio":""));
 button.type="button";button.textContent="♪ Ouvir trilha";button.setAttribute("aria-label","Ativar ou silenciar música original e efeitos do evento");
 button.setAttribute("aria-pressed",String(!muted));
 button.addEventListener("click",e=>{e.stopPropagation();toggleAudio();});
 where.append(button);setAudioButtonLabels();
 return button;
}
document.addEventListener("click",e=>{
 if(muted||!isMusicEnabled(screenTheme||storeTheme)||e.target.closest(".vyrant-audio-button"))return;
 if(e.target.closest("button,a,[role='button'],select,input[type='checkbox']")){
  const theme=screenTheme||storeTheme;
  if(theme&&themes[theme])sound(themes[theme].tune[(++noteIndex)%themes[theme].tune.length]+12,.085,.011,themes[theme].wave);
 }
},true);
function refreshMusicControls(){
 const active=screenTheme||storeTheme;
 if(!isMusicEnabled(active)){
  muted=true;stopMusic();
  document.querySelector("#vyrant-store-audio")?.remove();
  document.querySelector(".vyrant-screen-audio-slot")?.remove();
 }
 if(storeTheme&&isMusicEnabled(storeTheme)&&!document.querySelector("#vyrant-store-audio")){
  const box=make("div","vyrant-store-music");box.id="vyrant-store-audio";
  audioButton(box,"store");document.body.append(box);
 }
 if(storeTheme&&!isMusicEnabled(storeTheme))document.querySelector("#vyrant-store-audio")?.remove();
 const root=document.querySelector("#vyranteMode");
 if(screenTheme&&isMusicEnabled(screenTheme)&&root?.querySelector(".mode-panel")&&!root.querySelector(".vyrant-screen-audio-slot")){
  const slot=make("div","vyrant-screen-audio-slot");
  audioButton(slot,"screen");root.querySelector(".mode-panel").append(slot);
 }
 if(screenTheme&&!isMusicEnabled(screenTheme))root?.querySelector(".vyrant-screen-audio-slot")?.remove();
 setAudioButtonLabels();
}
function setMusicSettings(config){
 const next={};
 for(const theme of Object.keys(themes))next[theme]=config?.[theme]!==false;
 const oldActive=isMusicEnabled(screenTheme||storeTheme);
 enabledThemes=next;
 if(oldActive&&!isMusicEnabled(screenTheme||storeTheme)){
  muted=true;stopMusic();
  if(audio&&audio.state==="running")audio.suspend().catch(()=>{});
 }
 refreshMusicControls();
}
function stopStore(){
 if(storeField){storeField.stop();storeField=null;}
 document.querySelector("#vyrant-store-audio")?.remove();
 storeTheme=null;
}
function activateStore(theme){
 stopStore();
 if(!themes[theme])return;
 storeTheme=theme;
 storeField=new Field(document.body,theme,false);
 refreshMusicControls();
 if(!muted&&isMusicEnabled(screenTheme||storeTheme))startAudio();
}
function updateScreen(m){
 const root=document.querySelector("#vyranteMode");if(!root)return;
 const current=m&&m.type!=="normal"?m.type:null;
 const theme=current&&themes[m.eventTheme]?m.eventTheme:null;
 const key=current+":"+(theme||"neutral");
 if(root.dataset.magicKey===key){refreshMusicControls();return;}
 root.dataset.magicKey=key;
 for(const name of Object.keys(themes))root.classList.remove("vyrant-screen-"+name);
 if(screenField){screenField.stop();screenField=null;}
 root.querySelector(".vyrant-screen-audio-slot")?.remove();
 screenTheme=theme;
 if(!current){root.removeAttribute("data-access-mode");refreshMusicControls();if(!muted&&isMusicEnabled(storeTheme))startAudio();return;}
 root.dataset.accessMode=current;
 if(theme){
  root.classList.add("vyrant-screen-"+theme);
  screenField=new Field(root,theme,true);
  const panel=root.querySelector(".mode-panel");
  if(panel&&isMusicEnabled(theme)){
   const slot=make("div","vyrant-screen-audio-slot");
   audioButton(slot,"screen");panel.append(slot);
  }
 }
 queueMicrotask(()=>{
  const eyebrow=root.querySelector(".mode-eyebrow");
  if(!eyebrow||!root.isConnected)return;
  const label=current==="maintenance"?"MANUTENÇÃO":current==="launch"?"NOVO LANÇAMENTO":"EVENTO";
  eyebrow.textContent="VYRANTE / "+label+(theme?" · "+themes[theme].label.toUpperCase():"");
 });
 refreshMusicControls();
 if(!muted&&isMusicEnabled(screenTheme||storeTheme))startAudio();
}
window.VyrantMagic={activateStore,stopStore,updateScreen,setMusicSettings,playClick:()=>{}};
window.VyrantScreens={update:updateScreen};
function verifyInitialScreen(){
 fetch("/api/public",{cache:"no-store"})
 .then(r=>r.ok?r.json():null)
 .then(data=>{if(data?.musicThemes)setMusicSettings(data.musicThemes);if(data?.mode)updateScreen(data.mode);})
 .catch(()=>{});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",verifyInitialScreen,{once:true});
else verifyInitialScreen();
})();