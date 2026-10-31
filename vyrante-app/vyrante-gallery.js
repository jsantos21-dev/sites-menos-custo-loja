/* VYRANTE · Product carousel and quantity. No checkout/payment integration. */
(function(){
"use strict";
var catalog=[],version="";
var main=id=>"/api/catalog-image/"+encodeURIComponent(id)+"/main";
var detail=id=>"/api/catalog-image/"+encodeURIComponent(id)+"/detail";
var clamp=n=>Math.min(10,Math.max(1,Math.floor(Number(n)||1)));
function productId(){var m=(location.hash||"").match(/^#\/produto\/([a-z0-9-]{1,60})/i);return m?m[1]:null;}
function images(p){var a=(p.images||[]).filter(v=>typeof v==="string"&&v.trim()).slice(0,10);return a.length?a:[main(p.id),detail(p.id)];}
function element(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function enhance(){
 var id=productId(),gallery=document.querySelector(".pdp-gallery"),info=document.querySelector(".pdp-info");
 if(!gallery||!info||!id)return;
 var p=catalog.find(q=>q.id===id);if(!p)return;
 var photos=images(p),sig=id+"|"+photos.join("|");
 if(gallery.dataset.vySignature===sig&&document.getElementById("pdpQuantity"))return;
 createCarousel(gallery,p,photos);createQuantity(info);
}
function createCarousel(gallery,p,photos){
 gallery.replaceChildren();
 gallery.dataset.vySignature=p.id+"|"+photos.join("|");
 gallery.dataset.vyCurrent="0";
 var frame=element("div","vy-photo-frame"),track=element("div","vy-photo-track");track.id="vyPhotoTrack";
 track.tabIndex=0;track.setAttribute("aria-label","Galeria de imagens. Deslize para ver outras fotos.");
 photos.forEach((src,i)=>{
  var slide=element("div","vy-photo-slide"),img=element("img");img.src=src;
  img.alt=p.title+" — foto "+(i+1)+" de "+photos.length;img.loading=i?"lazy":"eager";img.decoding="async";
  img.addEventListener("error",()=>{if(!img.dataset.vyFailed){img.dataset.vyFailed="yes";img.src=main(p.id);}});
  slide.append(img);track.append(slide);
 });
 frame.append(track);
 var prev=element("button","vy-photo-arrow prev","‹"),next=element("button","vy-photo-arrow next","›"),count=element("span","vy-photo-count","1 / "+photos.length);
 prev.type=next.type="button";prev.setAttribute("aria-label","Foto anterior");next.setAttribute("aria-label","Próxima foto");frame.append(prev,next,count);
 var thumbs=element("div","vy-photo-thumbs");thumbs.setAttribute("role","group");thumbs.setAttribute("aria-label","Escolher foto do produto");
 var select=i=>{
  i=Math.min(photos.length-1,Math.max(0,i));gallery.dataset.vyCurrent=String(i);count.textContent=(i+1)+" / "+photos.length;
  thumbs.querySelectorAll("button").forEach((b,n)=>{b.classList.toggle("is-active",n===i);b.setAttribute("aria-pressed",String(n===i));});
 };
 var go=i=>{
  i=(i%photos.length+photos.length)%photos.length;
  track.scrollTo({left:i*track.clientWidth,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});select(i);
 };
 photos.forEach((src,i)=>{
  var btn=element("button","vy-thumb"+(i===0?" is-active":"")),img=element("img");
  btn.type="button";btn.setAttribute("aria-label","Ver foto "+(i+1));btn.setAttribute("aria-pressed",String(i===0));
  img.src=src;img.alt="";img.loading="lazy";img.addEventListener("error",()=>{if(!img.dataset.vyFailed){img.dataset.vyFailed="yes";img.src=main(p.id);}});
  btn.append(img);btn.addEventListener("click",()=>go(i));thumbs.append(btn);
 });
 prev.addEventListener("click",()=>go(Number(gallery.dataset.vyCurrent||0)-1));
 next.addEventListener("click",()=>go(Number(gallery.dataset.vyCurrent||0)+1));
 var raf=0;track.addEventListener("scroll",()=>{
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>select(Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));
 },{passive:true});
 track.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();go(Number(gallery.dataset.vyCurrent||0)+(e.key==="ArrowRight"?1:-1));}});
 gallery.append(frame,thumbs);select(0);
}
function createQuantity(info){
 var add=info.querySelector("#addToCart");if(!add)return;
 info.querySelector("#vyQtyBox")?.remove();
 var wrap=element("div","vy-qty-wrap");wrap.id="vyQtyBox";
 var label=element("label","vy-qty-label","Quantidade");label.htmlFor="pdpQuantity";
 var hint=element("small","vy-qty-hint","Até 10 peças por tamanho");
 var controls=element("div","vy-quantity"),down=element("button","vy-qty-button","−"),up=element("button","vy-qty-button","+"),input=element("input","vy-qty-input");
 down.type=up.type="button";down.setAttribute("aria-label","Diminuir quantidade");up.setAttribute("aria-label","Aumentar quantidade");
 input.id="pdpQuantity";input.type="number";input.min="1";input.max="10";input.step="1";input.inputMode="numeric";input.value="1";input.setAttribute("aria-label","Quantidade de peças");
 controls.append(down,input,up);wrap.append(label,hint,controls);add.before(wrap);
 var set=n=>{n=clamp(n);input.value=n;down.disabled=n<=1;up.disabled=n>=10;};
 down.addEventListener("click",()=>set(Number(input.value)-1));up.addEventListener("click",()=>set(Number(input.value)+1));
 input.addEventListener("change",()=>set(input.value));input.addEventListener("blur",()=>set(input.value));
 set(1);
}
function refresh(){
 fetch("/api/public",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("API");return r.json()}).then(data=>{
  if(data.updatedAt!==version){version=data.updatedAt;catalog=data.products||[];}
  enhance();
 }).catch(()=>{});
}
function init(){
 var app=document.getElementById("app");
 if(app&&window.MutationObserver){
  var observer=new MutationObserver(()=>{
   if(productId()&&(!app.querySelector(".vy-photo-frame")||!document.getElementById("pdpQuantity")))enhance();
  });observer.observe(app,{childList:true});
 }
 refresh();window.addEventListener("hashchange",()=>{setTimeout(refresh,120);});
 setInterval(()=>{if(!document.hidden)refresh();},18000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();