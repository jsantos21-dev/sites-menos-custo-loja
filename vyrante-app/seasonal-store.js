/* VYRANT | Full-store event experience. Never blocks catalog or product interactions. */
(function(){
  "use strict";
  const ORIGINAL = window.applyVyrantEvent;
  const MEDIA = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LABELS = {
    christmas: {
      symbol: "🎄",
      title: "VYRANT · CHRISTMAS EDITION",
      subtitle: "Uma temporada especial. Sua evolução continua.",
      product: "Edição Natal · Performance com presença",
      productText: "Uma atmosfera de Natal para explorar sua coleção VYRANT. As peças e os tamanhos permanecem os mesmos.",
      cart: "🎅 SUA SELEÇÃO · CHRISTMAS EDITION",
      hero: "✧ A TEMPORADA MAIS ESPECIAL DO ANO ✧",
      card: "CHRISTMAS"
    },
    newyear: {
      symbol: "✦",
      title: "VYRANT · NEW YEAR EDITION",
      subtitle: "O próximo capítulo começa com você.",
      product: "Edição Ano Novo · Comece em movimento",
      productText: "Um novo ano, novos objetivos. Explore a coleção original em uma experiência especial de celebração.",
      cart: "✦ SUA SELEÇÃO · NEW YEAR EDITION",
      hero: "✧ 2027 · UM NOVO CAPÍTULO ✧",
      card: "NEW YEAR"
    }
  };
  let mode = null;
  let observer = null;
  let countdown = null;
  let serial = 0;
  function el(tag,cls,text){
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(text!==undefined)x.textContent=text;
    return x;
  }
  function removeSeasonal(){
    document.querySelectorAll(".seasonal-shop-banner,.seasonal-sky,.seasonal-corner,.seasonal-product-note,.seasonal-hero-label,.seasonal-cart-line").forEach(n=>n.remove());
    document.querySelector("#vyrant-event-ribbon")?.remove();
    document.querySelector("#vyrant-event-particles")?.remove();
    if(countdown){clearInterval(countdown);countdown=null;}
    if(observer){observer.disconnect();observer=null;}
  }
  function decorate(){
    if(!mode)return;
    const d=LABELS[mode];
    const app=document.querySelector("#app");
    if(app){
      const hero=app.querySelector(".hero-copy");
      if(hero&&!hero.querySelector(".seasonal-hero-label"))hero.prepend(el("div","seasonal-hero-label",d.hero));
      app.querySelectorAll(".product-card").forEach(card=>{
        if(!card.querySelector(".seasonal-corner"))card.append(el("span","seasonal-corner",d.symbol+" "+d.card));
      });
      app.querySelectorAll(".category-tile").forEach(card=>{
        if(!card.querySelector(".seasonal-corner"))card.append(el("span","seasonal-corner",d.symbol+" "+d.card));
      });
      const pdp=app.querySelector(".pdp-info");
      if(pdp&&!pdp.querySelector(".seasonal-product-note")){
        const msg=el("div","seasonal-product-note");
        msg.append(el("span","seasonal-icon",d.symbol));
        const wrap=el("span");
        wrap.append(el("b","",d.product));
        wrap.append(document.createTextNode(" — "+d.productText));
        msg.append(wrap);
        const target=pdp.querySelector(".pdp-separator")||pdp.querySelector(".pdp-cta");
        if(target)target.parentNode.insertBefore(msg,target);
        else pdp.append(msg);
      }
    }
    document.querySelectorAll(".drawer-top").forEach(top=>{
      const wrapper=top.parentElement||top;
      if(!wrapper.querySelector(".seasonal-cart-line")){
        const bar=el("div","seasonal-cart-line",d.cart);
        top.insertAdjacentElement("afterend",bar);
      }
    });
  }
  function createBanner(m,d){
    const bar=el("div","seasonal-shop-banner");
    bar.id="vyrant-season-banner";
    bar.append(el("span","seasonal-symbol",d.symbol));
    bar.append(el("strong","",String(m.title||d.title).slice(0,110)));
    bar.append(el("small","",String(m.subtitle||d.subtitle).slice(0,190)));
    if(m.endsAt){
      const timer=el("small");
      timer.setAttribute("aria-live","off");
      bar.append(timer);
      function tick(){
        const left=new Date(m.endsAt).getTime()-Date.now();
        if(!Number.isFinite(left)||left<=0){timer.textContent=" · EVENTO ENCERRADO";return;}
        const days=Math.floor(left/86400000);
        const hours=Math.floor(left%86400000/3600000);
        const mins=Math.floor(left%3600000/60000);
        timer.textContent=" · TERMINA EM "+days+"D "+String(hours).padStart(2,"0")+"H "+String(mins).padStart(2,"0")+"MIN";
      }
      tick();countdown=setInterval(tick,30000);
    }
    const header=document.querySelector(".site-header");
    if(header&&header.parentNode)header.parentNode.insertBefore(bar,header);
    else document.body.prepend(bar);
  }
  function createSky(type){
    if(MEDIA)return;
    const sky=el("div","seasonal-sky");
    sky.setAttribute("aria-hidden","true");
    const isChristmas=type==="christmas";
    const quantity=window.innerWidth<700?16:34;
    for(let i=0;i<quantity;i++){
      const particle=el("span",isChristmas?"flake":"spark",isChristmas?(i%3?"❄":"·"):(i%4?"✦":"✧"));
      particle.style.setProperty("--left",((i*37.13+11)%100).toFixed(2)+"%");
      particle.style.setProperty("--size",(8+i%12)+"px");
      particle.style.setProperty("--duration",(11+i%16)+"s");
      particle.style.setProperty("--delay",(-i*.47)+"s");
      sky.append(particle);
    }
    if(!isChristmas){
      for(let i=0;i<5;i++){
        const burst=el("div","seasonal-firework");
        burst.style.setProperty("--fx",((i*19+11)%92)+"%");
        burst.style.setProperty("--fy",(11+i%3*19)+"%");
        burst.style.setProperty("--fd",(-i*1.45)+"s");
        sky.append(burst);
      }
    }
    document.body.append(sky);
  }
  function setTheme(m){
    ++serial;
    removeSeasonal();
    mode = m&&m.type==="event"?(m.eventTheme==="newyear"?"newyear":"christmas"):null;
    if(!mode)return;
    const d=LABELS[mode];
    document.body.classList.add(mode==="christmas"?"vyrant-christmas":"vyrant-newyear");
    createBanner(m,d);
    createSky(mode);
    decorate();
    const app=document.querySelector("#app");
    if(app){
      observer=new MutationObserver(()=>{if(mode)decorate();});
      observer.observe(app,{childList:true});
    }
  }
  window.applyVyrantEvent=function(m){
    try{if(typeof ORIGINAL==="function")ORIGINAL(m);}catch(err){console.warn("VYRANT theme base",err);}
    setTheme(m);
  };
  function onLoaded(){
    fetch("/api/public",{cache:"no-store"})
      .then(r=>r.ok?r.json():Promise.reject(Error("API")))
      .then(d=>{if(d&&d.mode)window.applyVyrantEvent(d.mode);})
      .catch(()=>{ /* The storefront remains usable in the default visual. */ });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",onLoaded,{once:true});
  else onLoaded();
})();
