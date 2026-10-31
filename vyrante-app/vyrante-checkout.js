/* VYRANTE — isolated checkout demonstration.
   No orders, payments, network requests containing customer form data, or card fields. */
(function(){"use strict";
const API="/api/public",CART_KEY="vyrante-demo-cart";
const $=selector=>document.querySelector(selector);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const state={
 step:1,maxStep:1,completed:false,products:[],items:[],payment:"pix",
 form:{name:"",email:"",zip:"",street:"",number:"",complement:"",city:"",region:""}
};
const dataFields=["name","email","zip","street","number","complement","city","region"];
let toastTimer=null;
function notify(message){
 const x=$("#checkoutToast");x.textContent=message;x.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>{x.hidden=true},3900);
}
function cartRead(){
 let saved=[];
 try{const parsed=JSON.parse(localStorage.getItem(CART_KEY)||"[]");if(Array.isArray(parsed))saved=parsed;}catch{}
 return saved.filter(i=>i&&typeof i.id==="string"&&typeof i.size==="string"&&Number(i.qty)>0).map(i=>({
  id:i.id.slice(0,60),size:i.size.slice(0,20),qty:Math.floor(Number(i.qty)),key:String(i.key||i.id+"-"+i.size)
 }));
}
function limitFor(product){return Math.max(1,Math.min(10,Math.floor(Number(product?.maxPerOrder)||10)));}
function persistCart(){
 try{localStorage.setItem(CART_KEY,JSON.stringify(state.items));}catch{}
}
function reconcile(){
 const allowed=new Map(state.products.map(p=>[p.id,p]));
 const unique=new Map();
 for(const item of cartRead()){
  const product=allowed.get(item.id);
  if(!product||!Array.isArray(product.sizes)||!product.sizes.includes(item.size))continue;
  const key=item.id+"-"+item.size,limit=limitFor(product);
  const value=unique.get(key);
  if(value)value.qty=Math.min(limit,value.qty+item.qty);
  else unique.set(key,{key,id:item.id,size:item.size,qty:Math.min(limit,Math.max(1,item.qty))});
 }
 state.items=[...unique.values()];
 persistCart();
}
function productFor(id){return state.products.find(p=>p.id===id)}
function pic(p){const first=(Array.isArray(p.images)?p.images:[]).find(x=>typeof x==="string"&&(x.startsWith("https://")||x.startsWith("/api/")));return first||"/api/catalog-image/"+encodeURIComponent(p.id)+"/main"}
function subtotal(){return state.items.reduce((sum,i)=>sum+Number(productFor(i.id)?.price||0)*i.qty,0)}
function count(){return state.items.reduce((sum,i)=>sum+i.qty,0)}
function renderSummary(){
 const el=$("#orderItems"),len=count();$("#bagCount").textContent=len+" "+(len===1?"peça":"peças");
 if(!state.items.length)el.innerHTML='<p class="muted">Sua sacola está vazia.</p>';
 else el.innerHTML=state.items.map(i=>{
  const p=productFor(i.id),max=limitFor(p);
  if(!p)return"";
  return '<article class="order-item">'
  +'<img src="'+esc(pic(p))+'" alt="'+esc(p.title)+'" loading="lazy">'
  +'<div><strong>'+esc(p.title)+'</strong><small>'+esc(p.color||"")+' · Tam. '+esc(i.size)+'</small>'
  +'<div class="line-bottom"><b>'+money(Number(p.price)*i.qty)+'</b><div class="item-qty" aria-label="Quantidade de '+esc(p.title)+'">'
  +'<button type="button" data-change="-1" data-key="'+esc(i.key)+'" aria-label="Diminuir quantidade" '+(i.qty<=1?'disabled':'')+'>−</button>'
  +'<span aria-live="polite">'+i.qty+'</span>'
  +'<button type="button" data-change="1" data-key="'+esc(i.key)+'" aria-label="Aumentar quantidade" '+(i.qty>=max?'disabled':'')+'>+</button></div></div>'
  +'<button class="remove-item" type="button" data-remove="'+esc(i.key)+'">Remover</button></div></article>';
 }).join("");
 $("#subtotal").textContent=money(subtotal());$("#total").textContent=money(subtotal());
 document.querySelectorAll(".step").forEach((step)=>{
  const num=Number(step.dataset.step),active=num===state.step;
  step.classList.toggle("is-active",active);step.classList.toggle("is-done",num<state.step);
  step.disabled=num>state.maxStep||state.completed;
  if(active)step.setAttribute("aria-current","step");else step.removeAttribute("aria-current");
 });
}
function field(key,label,placeholder,type="text",full=false,optional=false,more=""){
 return '<div class="field '+(full?"full":"")+'"><label for="checkout-'+key+'">'+esc(label)+(optional?' <span class="muted">(opcional)</span>':' <span aria-hidden="true">*</span>')+'</label>'
 +'<input id="checkout-'+key+'" type="'+type+'" name="'+key+'" value="'+esc(state.form[key])+'" placeholder="'+esc(placeholder)+'" '+(!optional?'required ':'')+'autocomplete="'+esc(more)+'" aria-describedby="error-'+key+'" spellcheck="false">'
 +'<span class="field-error" id="error-'+key+'" aria-live="polite"></span></div>';
}
function stageOne(){
 return '<div class="flow-kicker">01 / IDENTIFICAÇÃO E ENTREGA</div><h2>Vamos começar pelo essencial.</h2><p class="flow-intro">Continue como visitante, sem criar uma conta. Para explorar este teste, recomendamos dados fictícios.</p>'
 +'<form id="deliveryForm" novalidate>'
 +'<div class="section-title">Contato</div><div class="fields">'
 +field("name","Nome completo","Ex.: Cliente VYRANTE","text",true,false,"name")
 +field("email","E-mail","exemplo@teste.com","email",true,false,"email")
 +'</div><div class="divider"></div><div class="section-title">Endereço ilustrativo de entrega</div><div class="fields">'
 +field("zip","CEP","00000-000","text",false,false,"postal-code")
 +field("region","Estado (UF)","UF","text",false,false,"address-level1")
 +field("street","Rua e endereço","Rua Exemplo","text",true,false,"address-line1")
 +field("number","Número","100","text",false,false,"off")
 +field("complement","Complemento","Apto, bloco, referência","text",false,true,"address-line2")
 +field("city","Cidade","Cidade Exemplo","text",true,false,"address-level2")
 +'</div><div class="demo-note"><span>ⓘ</span><span><b>Este formulário é apenas visual.</b> Não calcula frete nem armazena ou transmite seus dados. Clique em “Preencher com exemplo” para testar sem informar dados reais.</span></div>'
 +'<div class="actions"><button class="secondary" type="button" id="exampleFill">Preencher com exemplo</button><button class="primary" type="submit">Continuar para pagamento →</button></div>'
 +'<p class="hint-line">* Campos usados apenas para demonstrar a experiência. Nenhuma compra será realizada.</p></form>';
}
function stageTwo(){
 const choices=[
  {id:"pix",symbol:"◈",title:"Pix",desc:"Simulação de pagamento instantâneo. Nenhum QR Code ou cobrança é gerado."},
  {id:"card",symbol:"▣",title:"Cartão",desc:"Demonstração do layout. Não solicitamos número, validade ou código de segurança."}
 ];
 return '<div class="flow-kicker">02 / FORMA DE PAGAMENTO</div><h2>Simples, do seu jeito.</h2>'
 +'<p class="flow-intro">Escolha a forma de pagamento para visualizar a experiência. Nenhuma transação será processada.</p>'
 +'<div class="payment-options" role="radiogroup" aria-label="Pagamento apenas demonstrativo">'
 +choices.map(c=>'<label class="payment-option '+(state.payment===c.id?"is-selected":"")+'">'
 +'<input type="radio" name="payment" value="'+c.id+'" '+(state.payment===c.id?'checked':'')+'><span class="payment-symbol">'+c.symbol+'</span>'
 +'<span><b>'+c.title+'</b><small>'+c.desc+'</small></span></label>').join("")
 +'</div><div class="demo-note"><span>ⓘ</span><span><b>Pagamento não disponível.</b> Esta etapa não apresenta campos de cartão nem links externos para pagar. O botão leva somente à revisão da simulação.</span></div>'
 +'<div class="actions"><button type="button" class="secondary" data-back="1">← Voltar aos dados</button><button type="button" class="primary" id="continueReview">Revisar seleção →</button></div>';
}
function stageThree(){
 const info=state.form;
 return '<div class="flow-kicker">03 / REVISÃO DA SIMULAÇÃO</div><h2>Confira cada escolha.</h2>'
 +'<p class="flow-intro">Este é o último passo do protótipo. Nenhuma compra será enviada ou cobrada.</p>'
 +'<div class="section-title">Resumo do visitante</div><div class="review-items">'
 +'<div class="review-row"><span>Contato</span><strong>'+esc(info.name)+'<br><small>'+esc(info.email)+'</small></strong></div>'
 +'<div class="review-row"><span>Entrega de exemplo</span><strong>'+esc(info.street)+', '+esc(info.number)+'<br><small>'+esc(info.city)+' / '+esc(info.region)+' · '+esc(info.zip)+'</small></strong></div>'
 +'<div class="review-row"><span>Forma ilustrativa</span><strong>'+(state.payment==="pix"?"Pix (teste)":"Cartão (teste)")+'</strong></div>'
 +'<div class="review-row"><span>Subtotal das peças</span><strong>'+money(subtotal())+'</strong></div>'
 +'<div class="review-row"><span>Frete</span><strong>Não disponível</strong></div>'
 +'</div><div class="demo-note"><span>!</span><span><b>Não há total definitivo nem pedido real.</b> O subtotal considera somente as peças. Frete e pagamentos serão integrados no futuro.</span></div>'
 +'<div class="actions"><button type="button" class="secondary" data-back="2">← Alterar pagamento</button><button type="button" class="primary" id="simulateOrder">Concluir simulação — sem cobrança</button></div>';
}
function finalScreen(){
 return '<div class="complete"><div class="complete-mark" aria-hidden="true">✧</div><div class="flow-kicker">DEMONSTRAÇÃO CONCLUÍDA</div><h2>Uma nova experiência começa aqui.</h2>'
 +'<p>Você percorreu o checkout da VYRANTE até a confirmação de teste. <b>Nenhum pedido foi registrado e nenhuma cobrança foi realizada.</b></p>'
 +'<p>Sua sacola permanece salva apenas neste navegador para continuar explorando o protótipo.</p>'
 +'<div class="actions"><button type="button" class="secondary" id="restart">Reiniciar teste</button><a href="/#/" class="primary">Voltar à VYRANTE →</a></div></div>';
}
function renderStage(){
 renderSummary();
 let el=$("#checkoutFlow");
 if(!state.items.length){el.innerHTML='<div class="empty-bag"><div class="empty-icon" aria-hidden="true">◇</div><h2>Sua sacola está esperando por você.</h2><p>Volte para a coleção, escolha uma peça, selecione o tamanho e a quantidade e adicione à sua sacola. O checkout aparecerá aqui automaticamente.</p><a class="primary" href="/#/colecao/todos">Explorar a coleção →</a></div>';return}
 el.innerHTML=state.completed?finalScreen():state.step===1?stageOne():state.step===2?stageTwo():stageThree();
 el.scrollIntoView({behavior:"auto",block:"nearest"});
}
function storeForm(){
 for(const k of dataFields){let x=$("#checkout-"+k);if(x)state.form[k]=x.value.trim();}
}
function errors(){
 storeForm();
 const bad={};
 for(const k of dataFields.filter(x=>x!=="complement"))if(!state.form[k])bad[k]="Este campo é obrigatório.";
 if(state.form.name&&!state.form.name.includes(" "))bad.name="Informe nome e sobrenome, ou use os dados de exemplo.";
 if(state.form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.form.email))bad.email="Digite um e-mail válido para testar.";
 if(state.form.zip&&!/^\d{5}-?\d{3}$/.test(state.form.zip))bad.zip="Use o formato 00000-000.";
 if(state.form.region&&!/^[A-Za-z]{2}$/.test(state.form.region))bad.region="Informe a sigla do estado com 2 letras.";
 for(const k of dataFields){
  const input=$("#checkout-"+k),label=$("#error-"+k);
  if(input){input.setAttribute("aria-invalid",String(!!bad[k]));if(label)label.textContent=bad[k]||"";}
 }
 return bad;
}
function changeQuantity(key,delta){
 const i=state.items.find(x=>x.key===key);if(!i)return;
 const max=limitFor(productFor(i.id));
 i.qty=Math.max(1,Math.min(max,i.qty+delta));persistCart();renderSummary();
 if(state.step===3)renderStage();
}
function removeItem(key){
 state.items=state.items.filter(i=>i.key!==key);persistCart();
 if(!state.items.length){state.step=1;state.maxStep=1;state.completed=false;renderStage()}
 else if(state.step===3)renderStage();else renderSummary();
}
function navigate(next){
 state.step=next;state.maxStep=Math.max(state.maxStep,next);
 renderStage();window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
 const q=e.target.closest("[data-change]");
 if(q){changeQuantity(q.dataset.key,Number(q.dataset.change));return}
 const r=e.target.closest("[data-remove]");
 if(r){removeItem(r.dataset.remove);return}
 const back=e.target.closest("[data-back]");
 if(back){navigate(Number(back.dataset.back));return}
 const step=e.target.closest("[data-step]");
 if(step&&!step.disabled&&Number(step.dataset.step)<=state.maxStep){if(state.step===1)storeForm();navigate(Number(step.dataset.step));return}
 if(e.target.closest("#exampleFill")){
  Object.assign(state.form,{name:"Cliente de Teste",email:"teste@exemplo.com",zip:"00000-000",street:"Rua Demonstração",number:"100",complement:"",city:"Cidade Exemplo",region:"SP"});
  renderStage();notify("Dados fictícios preenchidos. Agora você pode continuar.");return;
 }
 if(e.target.closest("#continueReview")){navigate(3);return}
 if(e.target.closest("#simulateOrder")){state.completed=true;renderStage();window.scrollTo({top:0,behavior:"smooth"});return}
 if(e.target.closest("#restart")){state.step=1;state.maxStep=1;state.completed=false;renderStage();return}
});
document.addEventListener("input",e=>{
 if(e.target.matches("#deliveryForm [name]")){const k=e.target.name;if(dataFields.includes(k))state.form[k]=e.target.value;}
});
document.addEventListener("change",e=>{
 if(e.target.matches('input[name="payment"]')){state.payment=e.target.value;renderStage();}
});
document.addEventListener("submit",e=>{
 if(e.target.id!=="deliveryForm")return;
 e.preventDefault();const problems=errors();
 const bad=Object.keys(problems);
 if(bad.length){$("#checkout-"+bad[0])?.focus();notify("Confira os campos destacados.");return}
 navigate(2);
});
async function init(){
 try{
  const response=await fetch(API,{cache:"no-store"});if(!response.ok)throw Error("Dados indisponíveis");
  const data=await response.json();
  if(data.mode&&data.mode.type&&data.mode.type!=="normal"){
   $("#checkoutFlow").innerHTML='<div class="empty-bag"><h2>Loja temporariamente indisponível.</h2><p>O checkout de teste acompanha o controle de acesso da VYRANTE. Retorne à página inicial para visualizar as novidades.</p><a href="/" class="primary">Voltar à loja</a></div>';
   $("#orderItems").innerHTML="";return;
  }
  const theme=data.storeTheme||"original";if(["christmas","newyear","valentines","halloween","easter"].includes(theme))document.body.classList.add("theme-"+theme);
  state.products=(data.products||[]).filter(p=>p&&p.id);
  reconcile();renderStage();
 }catch(e){
  $("#checkoutFlow").innerHTML='<div class="empty-bag"><h2>Não foi possível carregar a sua seleção.</h2><p>Confira sua conexão e tente abrir novamente o checkout.</p><button type="button" class="primary" id="retryCheckout">Tentar novamente</button></div>';
  document.querySelector("#retryCheckout")?.addEventListener("click",init,{once:true});
 }
}
init();
})();