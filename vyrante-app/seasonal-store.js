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
    ,
    valentines: {symbol:"♥",title:"VYRANT · LOVE EDITION",subtitle:"Amor em cada movimento. Conexão em cada conquista.",product:"Edição Dia dos Namorados · Juntos na evolução",productText:"Celebre conexões, conquistas e carinho sem alterar peças, tamanhos ou valores.",cart:"♥ SUA SELEÇÃO · LOVE EDITION",hero:"♥ CONEXÕES QUE NOS FAZEM EVOLUIR ♥",card:"LOVE",introBadge:"DIA DOS NAMORADOS · VYRANT",introSymbol:"♥",introDivider:"♥ LOVE EDITION ♥",introTitle:"MOVIMENTOS QUE CONECTAM.",introCopy:"Uma história de amor também é feita de movimento. Descubra uma VYRANT elegante, romântica e cheia de presença.",aria:"Boas-vindas à edição de Dia dos Namorados",particle:"♥"},
    halloween: {symbol:"🎃",title:"VYRANT · HALLOWEEN EDITION",subtitle:"Desafie a noite. Supere seus limites.",product:"Edição Halloween · Poder em cada movimento",productText:"Uma noite extraordinária para descobrir sua próxima conquista. Produtos e disponibilidade mantidos.",cart:"🎃 SUA SELEÇÃO · HALLOWEEN EDITION",hero:"✦ A NOITE É DE QUEM OUSA ✦",card:"HALLOWEEN",introBadge:"HALLOWEEN · VYRANT",introSymbol:"🎃",introDivider:"✦ DARK PERFORMANCE ✦",introTitle:"OUSE IR ALÉM.",introCopy:"Entre na noite com atitude. Uma edição de Halloween com mistério, energia e performance, criada para desafiar o comum.",aria:"Boas-vindas à edição de Halloween",particle:"✦"},
    easter: {symbol:"🐰",title:"VYRANT · EASTER EDITION",subtitle:"Renove sua energia. Celebre novos começos.",product:"Edição Páscoa · Renove seu movimento",productText:"Uma temporada de renovação, leveza e novas conquistas. Peças, estoque e preços preservados.",cart:"🐰 SUA SELEÇÃO · EASTER EDITION",hero:"✿ TEMPO DE RENOVAR E EVOLUIR ✿",card:"EASTER",introBadge:"PÁSCOA · VYRANT",introSymbol:"🐰",introDivider:"✿ NOVOS COMEÇOS ✿",introTitle:"RENOVE O SEU MOVIMENTO.",introCopy:"Descubra novos começos em uma atmosfera suave e luminosa. Uma Páscoa VYRANT feita de energia, leveza e evolução.",aria:"Boas-vindas à edição de Páscoa",particle:"✿"}
  };
  let mode = null;
  let observer = null;
  let countdown = null;
  let serial = 0;
  let introTheme = null;
  let introTimer = null;
  let introRemoveTimer = null;
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

  /* A short, dismissible seasonal introduction — not a maintenance or launch lock. */
  function closeIntro(immediate=false){
    if(introTimer){clearTimeout(introTimer);introTimer=null;}
    if(introRemoveTimer){clearTimeout(introRemoveTimer);introRemoveTimer=null;}
    const screen=document.querySelector("#vyrant-season-intro");
    if(!screen)return;
    if(immediate){screen.remove();return;}
    screen.classList.add("is-closing");
    introRemoveTimer=setTimeout(()=>screen.remove(),450);
  }
  function showIntro(type){
    closeIntro(true);
    const d=LABELS[type];
    if(!d)return;
    const christmas=type==="christmas";
    const screen=el("div","seasonal-intro seasonal-intro-"+type);
    screen.id="vyrant-season-intro";
    screen.setAttribute("role","dialog");
    screen.setAttribute("aria-label",d.aria||(christmas?"Boas-vindas à edição de Natal":"Boas-vindas à edição de Ano Novo"));
    const lights=el("div","seasonal-intro-lights");
    lights.setAttribute("aria-hidden","true");
    for(let i=0;i<(MEDIA?0:14);i++){
      const sparkle=el("span",christmas?"seasonal-intro-flake":"seasonal-intro-spark",d.particle||(christmas?(i%4?"❄":"✦"):"✧"));
      sparkle.style.setProperty("--x",((i*29.7)%96)+"%");
      sparkle.style.setProperty("--delay",(-i*.43)+"s");
      sparkle.style.setProperty("--duration",(5+i%6)+"s");
      lights.append(sparkle);
    }
    screen.append(lights);
    const panel=el("div","seasonal-intro-panel");
    const badge=el("span","seasonal-intro-badge",d.introBadge||(christmas?"HOLIDAY SEASON / 2026":"NEW YEAR / 2027"));
    panel.append(badge);
    const logo=el("div","seasonal-intro-logo");
    const storeLogo=document.querySelector(".brand img")||document.querySelector("#modeLogo");
    if(storeLogo){
      const brand=storeLogo.cloneNode(false);
      brand.removeAttribute("id");
      brand.alt="VYRANT";
      logo.append(brand);
    }else logo.textContent="VYRANT";
    logo.append(el("span","seasonal-intro-logo-detail",d.introSymbol||(christmas?"🎅":"✦")));
    panel.append(logo);
    panel.append(el("div","seasonal-intro-divider",d.introDivider||(christmas?"✧  NATAL VYRANT  ✧":"✧  UM NOVO CICLO  ✧")));
    panel.append(el("h1","seasonal-intro-title",d.introTitle||(christmas?"UM NATAL PARA EVOLUIR.":"UM NOVO ANO. UMA NOVA VERSÃO.")));
    panel.append(el("p","seasonal-intro-copy",d.introCopy||(christmas?"O espírito do Natal encontra a performance. Descubra a VYRANT em uma experiência de fim de ano.":"Celebre novas conquistas e novos movimentos. Bem-vindo à edição especial de Ano Novo da VYRANT.")));
    const enter=el("button","seasonal-intro-enter","EXPLORAR A LOJA");
    enter.type="button";
    enter.addEventListener("click",()=>closeIntro(false),{once:true});
    panel.append(enter);
    const note=el("span","seasonal-intro-note","Coleção, produtos e carrinho disponíveis normalmente");
    panel.append(note);
    screen.append(panel);
    document.body.append(screen);
    introTimer=setTimeout(()=>closeIntro(false),MEDIA?850:2400);
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
    const seasonalParticle=type==="valentines"?"♥":type==="halloween"?"🦇":type==="easter"?"✿":null;
    const seasonalClass=type==="valentines"?"heart":type==="halloween"?"bat":type==="easter"?"petal":null;
    const quantity=window.innerWidth<700?16:34;
    for(let i=0;i<quantity;i++){
      const particle=el("span",seasonalClass||(isChristmas?"flake":"spark"),seasonalParticle||(isChristmas?(i%3?"❄":"·"):(i%4?"✦":"✧")));
      particle.style.setProperty("--left",((i*37.13+11)%100).toFixed(2)+"%");
      particle.style.setProperty("--size",(8+i%12)+"px");
      particle.style.setProperty("--duration",(11+i%16)+"s");
      particle.style.setProperty("--delay",(-i*.47)+"s");
      sky.append(particle);
    }
    if(type==="newyear"){
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
    const previous=mode;
    removeSeasonal();
    mode = m&&m.type==="event"?(LABELS[m.eventTheme]?m.eventTheme:"christmas"):null;
    document.body.classList.remove("vyrant-christmas","vyrant-newyear","vyrant-valentines","vyrant-halloween","vyrant-easter");
    if(!mode){introTheme=null;closeIntro(true);return;}
    if(introTheme!==mode){introTheme=mode;showIntro(mode);}
    const d=LABELS[mode];
    document.body.classList.add("vyrant-"+mode);
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
    try{if(typeof ORIGINAL==="function")ORIGINAL(m&&m.type==="event"&&!["christmas","newyear"].includes(m.eventTheme)?{type:"normal"}:m);}catch(err){console.warn("VYRANT theme base",err);}
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
