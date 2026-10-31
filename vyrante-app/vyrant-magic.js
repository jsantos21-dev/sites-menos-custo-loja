/* VYRANT: five original interactive seasonal experiences.
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
   this.last=performance.now();
   this.frame=this.frame.bind(this);
   this.raf=requestAnimationFrame(this.frame);
  }
 }
 frame(now){
  if(!this.active)return;
  const dt=Math.min(2,(now-this.last)/16.67||1);this.last=now;
  const width=innerWidth,height=innerHeight;
  if(!document.hidden&&this.el.isConnected){
   for(let i=0;i<this.items.length;i++){
    const p=this.items[i];
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
function startAudio(){
 if(muted)return;
 try{
  if(!audio){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=new C();}
  if(audio.state==="suspended")audio.resume().catch(()=>{});
  if(melodyTimer)clearInterval(melodyTimer);
  noteIndex=0;
  melodyTimer=setInterval(()=>{
   const theme=screenTheme||storeTheme;
   if(!theme||!themes[theme])return;
   const step=noteIndex++%11;
   if(step>=6)return;
   sound(themes[theme].tune[step],.28,.018,themes[theme].wave);
  },510);
 }catch(e){console.warn("Áudio indisponível:",e.message);}
}
function sound(note,duration=.13,level=.027,wave="sine"){
 if(muted||!audio)return;
 const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
 osc.type=wave;osc.frequency.value=440*Math.pow(2,(note-69)/12);
 gain.gain.setValueAtTime(.0001,now);
 gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),now+.025);
 gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
 osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration+.015);
}
function setAudioButtonLabels(){
 document.querySelectorAll(".vyrant-audio-button").forEach(button=>{
  button.textContent=muted?"♪ Ativar som":"♫ Silenciar";
  button.setAttribute("aria-pressed",String(!muted));
 });
}
function toggleAudio(){
 muted=!muted;
 if(muted){if(melodyTimer)clearInterval(melodyTimer);melodyTimer=null;}
 else startAudio();
 setAudioButtonLabels();
}
function audioButton(where,mode){
 const button=make("button","vyrant-audio-button"+(mode==="screen"?" screen-audio":""));
 button.type="button";button.textContent="♪ Ativar som";button.setAttribute("aria-label","Ativar ou silenciar música original e efeitos do evento");
 button.setAttribute("aria-pressed",String(!muted));
 button.addEventListener("click",e=>{e.stopPropagation();toggleAudio();});
 where.append(button);setAudioButtonLabels();
 return button;
}
document.addEventListener("click",e=>{
 if(muted||e.target.closest(".vyrant-audio-button"))return;
 if(e.target.closest("button,a,[role='button'],select,input[type='checkbox']")){
  const theme=screenTheme||storeTheme;
  if(theme&&themes[theme])sound(themes[theme].tune[(noteIndex+2)%6]+12,.09,.014,themes[theme].wave);
 }
},true);
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
 const box=make("div","vyrant-store-music");box.id="vyrant-store-audio";audioButton(box,"store");
 document.body.append(box);
 if(!muted)startAudio();
}
function updateScreen(m){
 const root=document.querySelector("#vyranteMode");if(!root)return;
 const current=m&&m.type!=="normal"?m.type:null;
 const theme=current&&themes[m.eventTheme]?m.eventTheme:null;
 const key=current+":"+(theme||"neutral");
 if(root.dataset.magicKey===key)return;
 root.dataset.magicKey=key;
 for(const name of Object.keys(themes))root.classList.remove("vyrant-screen-"+name);
 if(screenField){screenField.stop();screenField=null;}
 root.querySelector(".vyrant-screen-audio-slot")?.remove();
 screenTheme=theme;
 if(!current){root.removeAttribute("data-access-mode");if(!muted&&storeTheme)startAudio();return;}
 root.dataset.accessMode=current;
 if(theme){
  root.classList.add("vyrant-screen-"+theme);
  screenField=new Field(root,theme,true);
  const panel=root.querySelector(".mode-panel");
  if(panel){
   const slot=make("div","vyrant-screen-audio-slot");
   audioButton(slot,"screen");panel.append(slot);
  }
 }
 queueMicrotask(()=>{
  const eyebrow=root.querySelector(".mode-eyebrow");
  if(!eyebrow||!root.isConnected)return;
  const label=current==="maintenance"?"MANUTENÇÃO":current==="launch"?"NOVO LANÇAMENTO":"EVENTO";
  eyebrow.textContent="VYRANT / "+label+(theme?" · "+themes[theme].label.toUpperCase():"");
 });
 if(!muted)startAudio();
}
window.VyrantMagic={activateStore,stopStore,updateScreen,playClick:()=>{}};
window.VyrantScreens={update:updateScreen};
})();