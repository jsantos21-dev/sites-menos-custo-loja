/* Sites Menos Custo v2 — only essential local preferences without optional consent. */
(function(){
  'use strict';
  const KEY='smc_consent_v2', VERSION=1, GA4_ID=window.SMC_GA4_ID||'';
  let consent=null;
  try{
    const v=JSON.parse(localStorage.getItem(KEY)||'null');
    if(v&&v.version===VERSION&&typeof v.analytics==='boolean')consent=v;
  }catch(_){}
  function el(tag,cls,html){const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n}
  function track(event,parameters){
    if(!consent?.analytics||!GA4_ID||typeof window.gtag!=='function')return;
    window.gtag('event',event,parameters||{});
  }
  window.smcTrack=track;
  function enableAnalytics(){
    if(!consent?.analytics||!/^G-[A-Z0-9]+$/.test(GA4_ID)||document.getElementById('smc-ga4'))return;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',GA4_ID,{anonymize_ip:true});
    const script=document.createElement('script');script.id='smc-ga4';script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA4_ID);
    document.head.appendChild(script);
  }
  function apply(next){
    const previous=consent;consent={version:VERSION,necessary:true,analytics:!!next.analytics,updatedAt:new Date().toISOString()};
    try{localStorage.setItem(KEY,JSON.stringify(consent))}catch(_){}
    document.getElementById('smc-cookie-banner')?.remove();
    document.getElementById('smc-cookie-dialog')?.remove();
    if(previous?.analytics&&!consent.analytics){
      // Do not send future events. GA4 data deletion controls live on the provider.
      for(const k of Object.keys(localStorage)){if(k.startsWith('_ga'))try{localStorage.removeItem(k)}catch(_){}}
    }
    if(consent.analytics)enableAnalytics();
  }
  function showDialog(){
    document.getElementById('smc-cookie-dialog')?.remove();
    const wrap=el('div','v2-cookie-dialog');wrap.id='smc-cookie-dialog';
    wrap.innerHTML='<div class="v2-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="smc-cookie-title">'
      +'<h2 id="smc-cookie-title">Preferências de cookies</h2>'
      +'<p>Utilizamos armazenamento essencial para registrar sua escolha. Estatísticas de uso são opcionais e só serão ativadas quando houver uma integração configurada e você concordar.</p>'
      +'<div class="v2-cookie-toggle"><div><b>Necessários</b><small>Preferências essenciais de funcionamento. Sempre ativos.</small></div><input type="checkbox" checked disabled aria-label="Cookies necessários, sempre ativos"></div>'
      +'<label class="v2-cookie-toggle"><div><b>Estatísticas opcionais</b><small>Permitir medição de navegação quando este recurso estiver configurado.</small></div><input type="checkbox" id="smc-analytics-choice"></label>'
      +'<div class="v2-cookie-actions" style="margin-top:18px"><button type="button" id="smc-dialog-reject">Recusar opcionais</button><button class="v2-accept" type="button" id="smc-dialog-save">Salvar preferências</button></div></div>';
    document.body.appendChild(wrap);
    const cb=wrap.querySelector('#smc-analytics-choice');cb.checked=!!consent?.analytics;
    wrap.querySelector('#smc-dialog-reject').addEventListener('click',()=>apply({analytics:false}));
    wrap.querySelector('#smc-dialog-save').addEventListener('click',()=>apply({analytics:cb.checked}));
    wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});
    wrap.querySelector('button').focus();
  }
  window.openCookieSettings=showDialog;
  function showBanner(){
    if(consent)return;
    const bar=el('div','v2-cookie');bar.id='smc-cookie-banner';bar.setAttribute('role','region');bar.setAttribute('aria-label','Aviso de cookies');
    bar.innerHTML='<h2>Seu controle de privacidade</h2><p>Usamos armazenamento necessário para lembrar suas escolhas. As estatísticas são opcionais e dependem da sua autorização. Consulte nossa <a href="/cookies.html" style="text-decoration:underline;color:#0a6c9b">Política de cookies</a>.</p>'
    +'<div class="v2-cookie-actions"><button class="v2-accept" type="button" data-choice="all">Aceitar opcionais</button><button type="button" data-choice="none">Recusar opcionais</button><button type="button" data-choice="custom">Personalizar</button></div>';
    document.body.appendChild(bar);
    bar.querySelector('[data-choice=all]').addEventListener('click',()=>apply({analytics:true}));
    bar.querySelector('[data-choice=none]').addEventListener('click',()=>apply({analytics:false}));
    bar.querySelector('[data-choice=custom]').addEventListener('click',showDialog);
  }
  function ready(){
    if(consent?.analytics)enableAnalytics();
    showBanner();
    document.querySelectorAll('[data-smc-checkout]').forEach(link=>{
      link.addEventListener('click',()=>{
        const id=link.getAttribute('data-product-id')||'';
        const raw=Number(link.getAttribute('data-product-price')||'0');
        track('begin_checkout',{currency:'BRL',value:raw,items:[{item_id:id,item_name:link.getAttribute('data-product-name')||id,price:raw,quantity:1}]});
      });
    });
    document.querySelectorAll('[data-v2-preview]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const img=document.getElementById('v2-preview-image');if(!img)return;
        img.src=btn.dataset.v2Preview;img.alt=btn.dataset.previewAlt||'Prévia do template';
        document.querySelectorAll('[data-v2-preview]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
      });
    });
    document.querySelectorAll('.nav-toggle').forEach(btn=>btn.addEventListener('click',()=>document.querySelector('.nav-menu')?.classList.toggle('open')));
    document.querySelectorAll('.nav-menu a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.nav-menu')?.classList.remove('open')));
    document.querySelectorAll('[data-cookie-settings]').forEach(btn=>btn.addEventListener('click',showDialog));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();