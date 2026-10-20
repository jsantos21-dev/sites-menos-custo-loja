#!/usr/bin/env python3
"""Rebuild the public website ZIP as Sites Menos Custo 2.0.
35 Cakto URLs are taken strictly from the verified JSON config.
"""
import html,json,re,os,tempfile,zipfile
from pathlib import Path
from urllib.parse import urlparse,urlencode
from xml.sax.saxutils import escape as xml_escape

ARCHIVE=Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
DOMAIN="https://sites-menos-custo-loja.onrender.com"
IG="https://www.instagram.com/sitesmenoscusto/"
MAIL="sitesmenoscusto@gmail.com"
PACKS={
 "P3-01":["LP04","SI04","LV02"],"P3-02":["SI01","SI02","SI03"],"P3-03":["LV01","LV02","LV03"],
 "P10-01":["LP01","LP02","LP03","LP04","SI01","SI02","SI03","LV01","LV02","LV03"],
 "P10-02":["LP05","LP06","LP07","SI04","SI05","SI06","SI07","LV04","LV05","LV06"]}
def e(x):return html.escape(str(x),quote=True)
def replace_one(t,a,b):
 if t.count(a)!=1:raise AssertionError("Expected one "+a[:85]+" got "+str(t.count(a)))
 return t.replace(a,b,1)
def new_nav(home=False):
 pre="#" if home else "/#"
 return ('<a href="'+pre+'templates">Templates</a><a href="'+pre+'pacotes">Pacotes</a>'
 +'<a href="'+pre+'como-funciona">Como funciona</a><a href="'+pre+'informacoes">Dúvidas</a>'
 +'<a href="'+IG+'" target="_blank" rel="noopener noreferrer" class="v2-nav-ig">Instagram ↗</a>'
 +'<a href="'+pre+'templates" class="btn">Explorar modelos ↗</a>')
def top(home=False):
 return ('<div class="notice-bar">35 produtos digitais · Arquivos HTML editáveis · <strong>Pagamento seguro na Cakto</strong></div>'
 +'<header class="nav"><div class="container nav-row"><a href="/" class="brand"><img src="/logo-sites-menos-custo.png" width="73" height="68" alt="Sites Menos Custo">'
 +'<div class="brand-text">Sites Menos<span>Custo</span><small>CATÁLOGO DE TEMPLATES</small></div></a>'
 +'<button type="button" class="nav-toggle" aria-label="Abrir menu">☰</button><nav class="nav-menu">'+new_nav(home)+'</nav></div></header>')
def footer():
 return ('<footer class="footer"><div class="container"><div class="v2-footer-main">'
 +'<div><div class="v2-footer-brand">Sites Menos<span>Custo</span></div><p>Templates HTML editáveis para empresas, freelancers e agências. Os modelos são demonstrativos; personalização, hospedagem e integrações não estão incluídas.</p><p><a href="mailto:'+MAIL+'">'+MAIL+'</a><br><a href="'+IG+'" target="_blank" rel="noopener noreferrer">Instagram @sitesmenoscusto ↗</a></p></div>'
 +'<nav aria-label="Catálogo"><h3>Explore</h3><a href="/#templates">Modelos individuais</a><a href="/#pacotes">Pacotes</a><a href="/#como-funciona">Como funciona</a><a href="/#informacoes">Perguntas frequentes</a><a href="/entrega.html">Entrega digital</a></nav>'
 +'<nav aria-label="Informações legais"><h3>Informações</h3><a href="/termos.html">Termos e licença</a><a href="/reembolsos.html">Reembolsos</a><a href="/privacidade.html">Privacidade</a><a href="/cookies.html">Cookies</a><button class="v2-cookie-link" data-cookie-settings type="button">Configurar cookies</button></nav></div><hr>'
 +'<p style="color:#a7b9d0;font-size:12px;line-height:1.7">© 2026 Sites Menos Custo. Pagamentos processados pela Cakto. Marcas e conteúdos dos templates demonstrativos podem ser fictícios.</p></div></footer>')
def head(title,desc,path,img="/previews/LP01.webp",schema=None):
 url=DOMAIN+path
 out=('<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+e(title)+'</title>'
 +'<meta name="description" content="'+e(desc)+'"><link rel="canonical" href="'+e(url)+'">'
 +'<meta name="robots" content="index,follow,max-image-preview:large">'
 +'<meta property="og:type" content="website"><meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(desc)+'">'
 +'<meta property="og:url" content="'+e(url)+'"><meta property="og:image" content="'+e(DOMAIN+img)+'">'
 +'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+e(title)+'">'
 +'<link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="/v2.css"><script src="/v2.js" defer></script>')
 if schema:out+='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('</','<\\/')+'</script>'
 return out
def category(sku):
 if sku in PACKS:return "Pacote com "+str(len(PACKS[sku]))+" templates"
 return {"LP":"Landing Page Visual","SI":"Site Institucional Visual","LV":"Loja Virtual Visual"}[sku[:2]]
def detail(sku,prod,products,links):
 title=prod["name"];price=prod["price"];kind=category(sku);pk=PACKS.get(sku,[])
 description=(f'{len(pk)} modelos HTML editáveis reunidos em um pacote para personalização.' if pk else
  ('Layout editável de uma página, com formulário ilustrativo sem envio real.' if sku.startswith('LP') else
   'Layout institucional com várias páginas editáveis, sem serviços de hospedagem.' if sku.startswith('SI') else
   'Vitrine digital visual com páginas de produto e carrinho demonstrativo, sem pagamentos funcionais.'))
 direct=links[sku]
 parts=urlparse(direct)
 assert parts.scheme=="https" and parts.netloc=="pay.cakto.com.br"
 direct+=('?' if '?' not in direct else '&')+urlencode({'utm_source':'sitesmenoscusto','utm_medium':'site','utm_campaign':'produto_v2'})
 price_text=f'R$ {price:,}'.replace(',','.')
 thumbs=[("/previews/"+sku+".webp","Desktop")]
 if pk:thumbs.extend(("/previews/"+ref+".webp",ref+" · "+products[ref]['name']) for ref in pk)
 else:thumbs.append(("/previews/"+sku+"_mobile.webp","Celular"))
 buttons=''.join('<button type="button" class="v2-thumb" data-v2-preview="'+e(path)+'" data-preview-alt="'+e(label)+'" aria-pressed="'+('true' if i==0 else 'false')+'"><img src="'+e(path)+'" alt="" loading="lazy"><span>'+e(label)+'</span></button>' for i,(path,label) in enumerate(thumbs))
 includes=(''.join('<span class="v2-chip">'+e(code)+' · '+e(products[code]['name'])+'</span>' for code in pk) if pk else
  '<ul><li>Arquivos HTML, CSS e JavaScript editáveis.</li><li>Layout de demonstração conforme as prévias reais.</li><li>Orientações e limitações técnicas no material entregue.</li></ul>')
 includes_title="Modelos incluídos no pacote" if pk else "O que vem no produto"
 schema={'@context':'https://schema.org','@type':'Product','name':title+' — '+kind,'sku':sku,
 'image':[DOMAIN+'/previews/'+sku+'.webp'],'description':description,'brand':{'@type':'Brand','name':'Sites Menos Custo'},
 'offers':{'@type':'Offer','priceCurrency':'BRL','price':str(price),'availability':'https://schema.org/InStock','url':DOMAIN+'/produtos/'+sku+'.html'}}
 docdesc=title+' — '+kind.lower()+' editável por '+price_text+'. Confira prévias reais, recursos e a compra pela Cakto.'
 return ('<!doctype html><html lang="pt-BR"><head>'+head(title+' | Sites Menos Custo',docdesc,'/produtos/'+sku+'.html','/previews/'+sku+'.webp',schema)+'</head><body>'
 +top()+'<main class="v2-product-main"><div class="container"><div class="v2-breadcrumb"><a href="/">Início</a> / <a href="/#templates">Catálogo</a> / '+e(sku)+' · '+e(title)+'</div>'
 +'<div class="v2-product-grid"><div><div class="v2-preview-box"><img class="v2-preview-main" id="v2-preview-image" src="/previews/'+e(sku)+'.webp" alt="Prévia real de '+e(title)+'" width="1000" height="625">'
 +'<div class="v2-thumbnail-row">'+buttons+'</div><p style="font-size:12px;color:#63768b">Prévias reais dos templates de demonstração. Conteúdo, marcas e imagens ilustrativas devem ser revisados antes de publicar.</p></div>'
 +'<section class="v2-detail-panel"><h2>'+includes_title+'</h2><div class="v2-includes">'+includes+'</div></section>'
 +'<section class="v2-detail-panel"><h2>Informações importantes</h2><p>Os produtos são arquivos digitais editáveis, não um serviço de desenvolvimento sob encomenda. Hospedagem, domínio, integração de formulários, pagamento real nas lojas-modelo e suporte de implementação não estão incluídos.</p><p>Consulte os <a href="/termos.html">termos de licença</a> e a <a href="/reembolsos.html">política de reembolsos</a> antes da compra.</p></section></div>'
 +'<aside class="v2-product-info"><span class="v2-kicker">'+e(sku)+' · '+e(kind)+'</span><h1>'+e(title)+'</h1><p class="v2-product-desc">'+e(description)+'</p>'
 +'<div class="v2-product-price">'+price_text+'</div><span class="v2-chip">Arquivos editáveis</span> <span class="v2-chip">Produto digital</span>'
 +'<a class="v2-buy" href="'+e(direct)+'" data-smc-checkout data-product-id="'+e(sku)+'" data-product-price="'+str(price)+'" data-product-name="'+e(title)+'" rel="nofollow">Comprar na Cakto ↗</a>'
 +'<p class="v2-trust-line">Pagamento realizado diretamente na Cakto. Valores e condições finais são apresentados no checkout oficial.</p><hr style="border:0;border-top:1px solid #e3ebf4;margin:18px 0">'
 +'<p class="v2-trust-line">Entrega digital conforme a oferta após a aprovação do pagamento. Dúvidas pelo <a href="'+IG+'" target="_blank" rel="noopener noreferrer">Instagram @sitesmenoscusto</a> ou <a href="mailto:'+MAIL+'">'+MAIL+'</a>.</p>'
 +'<p class="v2-trust-line"><a href="/entrega.html">Entrega</a> · <a href="/termos.html">Licença</a> · <a href="/privacidade.html">Privacidade</a></p></aside></div></div></main>'
 +footer()+'</body></html>')
POLICIES={
 'termos.html':('Termos e licença de uso',[
 ('O que é vendido','Layouts HTML, CSS e JavaScript editáveis, entregues como arquivos digitais. Os templates são demonstrativos e não constituem um serviço de desenvolvimento personalizado.'),
 ('Permissões de uso','Conforme a oferta comercial, cada modelo poderá ser personalizado e utilizado como base para um projeto final próprio ou de cliente. Pacotes incluem modelos com uso individual. A aquisição não transfere a titularidade dos arquivos originais.'),
 ('Restrições','Não é permitida a revenda, redistribuição ou publicação dos ZIPs originais como produto, coleção ou biblioteca de terceiros.'),
 ('Responsabilidades','Substitua textos, marcas, imagens, preços e personagens fictícios antes de publicar. A compra não inclui domínio, hospedagem, manutenção, funcionalidades de backend ou integrações de produção.'),
 ('Documentação','As condições de utilização devem ser compatíveis com a documentação fornecida na entrega e com a legislação aplicável. Se houver divergência entre os arquivos e a oferta, contate o atendimento antes de implantar o projeto.'),
 ]),
 'entrega.html':('Entrega digital',[
 ('Disponibilização','Após a aprovação do pagamento, os arquivos ZIP são disponibilizados pelo canal digital configurado na oferta correspondente na Cakto.'),
 ('Conteúdo entregue','Cada produto individual contém seu respectivo template; pacotes contêm os modelos identificados na página da oferta. Os materiais são editáveis e podem conter instruções técnicas.'),
 ('Dificuldades para acessar','Se a compra foi aprovada e você não recebeu acesso, entre em contato por e-mail ou Instagram com a identificação da oferta ou o código de compra. Não envie senhas nem dados bancários.'),
 ('Serviços não incluídos','O download não inclui instalação, hospedagem, domínio, criação de banco de dados ou integrações externas.'),
 ]),
 'reembolsos.html':('Reembolsos e arrependimento',[
 ('Como solicitar','Solicite pelo e-mail de atendimento, informando a compra realizada e a questão apresentada. A solicitação será analisada de acordo com as condições da oferta e a legislação de defesa do consumidor.'),
 ('Direito de arrependimento','O direito de arrependimento em contratação fora do estabelecimento comercial é observado nos termos do artigo 49 do Código de Defesa do Consumidor, quando aplicável.'),
 ('Problemas com o conteúdo','Em caso de arquivo diferente da descrição ou falha na entrega, comunique o ocorrido para avaliação e solução conforme os direitos legais.'),
 ('Processamento','Reembolsos aprovados seguem os procedimentos de estorno do processador de pagamento Cakto.'),
 ]),
 'privacidade.html':('Política de privacidade',[
 ('Sobre o site','A Sites Menos Custo utiliza um catálogo estático. Não é necessário criar conta para visualizar os produtos, e o pagamento ocorre diretamente no ambiente da Cakto.'),
 ('Dados pessoais','O site guarda a preferência de cookies no armazenamento local do navegador. Comunicações enviadas voluntariamente por e-mail ou Instagram são usadas para atendimento.'),
 ('Pagamento externo','Os dados inseridos na Cakto são tratados conforme a política de privacidade e os procedimentos dessa plataforma.'),
 ('Estatísticas','Medições opcionais dependem de consentimento e de configuração de um identificador de análise. É possível revisar a preferência pelo rodapé.'),
 ('Seus direitos','Questões relativas à Lei Geral de Proteção de Dados e solicitações de privacidade podem ser encaminhadas ao e-mail de atendimento.'),
 ]),
 'cookies.html':('Política de cookies',[
 ('Tecnologias essenciais','Armazenamos localmente a decisão de privacidade do visitante. Essa preferência é necessária para respeitar suas escolhas.'),
 ('Estatísticas opcionais','O site oferece consentimento específico para ferramentas de estatísticas. A integração só funciona quando configurada e mediante sua autorização.'),
 ('Alterar preferências','Use a opção “Configurar cookies” no rodapé para aceitar, recusar ou personalizar o consentimento a qualquer momento.'),
 ('Serviços externos','Instagram e Cakto são plataformas externas com suas próprias políticas de cookies.'),
 ]),
}
def legal(filename,title,sections):
 body=''.join('<section><h2>'+e(h)+'</h2><p>'+e(p)+'</p></section>' for h,p in sections)
 desc=title+' da Sites Menos Custo. Saiba seus direitos, condições de compra, utilização dos templates e atendimento.'
 return ('<!doctype html><html lang="pt-BR"><head>'+head(title+' | Sites Menos Custo',desc,'/'+filename)+'</head><body>'+top()
 +'<main class="container v2-legal"><a class="v2-breadcrumb" href="/">← Voltar ao catálogo</a><h1>'+e(title)+'</h1>'
 +'<p>Informações comerciais da Sites Menos Custo. Atualizado em 20/10/2026.</p>'+body
 +'<p>Atendimento: <a href="mailto:'+MAIL+'">'+MAIL+'</a> ou <a href="'+IG+'" target="_blank" rel="noopener noreferrer">Instagram @sitesmenoscusto</a>.</p></main>'
 +footer()+'</body></html>')
def home_upgrade(page,products):
 if '<meta name="smc-version" content="2.0">' in page:return page
 # Remove legacy modal and old Pix checkout scripts.
 page,n=re.subn(r'<div aria-labelledby="shop-title"[\s\S]*?</script>','',page,count=1)
 if n!=1:raise AssertionError('Legacy payment script not found')
 # Preserve just search/filter; no order history, Pix, copy receipt or saved cart.
 pattern=r'<script>let active=[\s\S]*?</script>'
 minimal="""<script>let active='todos';function doFilter(t,b){active=t;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));applyFilters()}function applyFilters(){let q=document.getElementById('search').value.toLowerCase().trim(),count=0;document.querySelectorAll('.card').forEach(c=>{let show=(active==='todos'||c.dataset.type===active)&&c.dataset.query.includes(q);c.style.display=show?'':'none';if(show)count++});document.getElementById('empty').style.display=count?'none':'block'}</script>"""
 page,n=re.subn(pattern,minimal,page,count=1)
 if n!=1:raise AssertionError('Original filter script not found')
 page=replace_one(page,"onclick=\"document.querySelector('.nav-menu').classList.toggle('open')\"","")
 page,n=re.subn(r'<nav class="nav-menu">[\s\S]*?</nav>','<nav class="nav-menu">'+new_nav(True)+'</nav>',page,count=1)
 if n!=1:raise AssertionError('Original nav not found')
 page=replace_one(page,'<body>','<body><div class="notice-bar">35 produtos digitais · Arquivos HTML editáveis · <strong>Pagamento seguro na Cakto</strong></div>')
 page=replace_one(page,'<html lang="pt-BR"><head>','<html lang="pt-BR"><head><meta name="smc-version" content="2.0">')
 page=replace_one(page,'30 templates HTML • 3 categorias • 5 pacotes','35 opções digitais • 30 modelos • 5 pacotes')
 page=replace_one(page,'Uma boa ideia merece um <em>site incrível.</em>','Seu próximo site começa com uma <em>base profissional.</em>')
 page=replace_one(page,'Layouts modernos, editáveis e organizados para quem cria sites, apresenta negócios e quer partir de uma base visual profissional.','Templates HTML editáveis para empresas, freelancers e agências. Compare as prévias reais, escolha seu modelo e personalize para o seu projeto.')
 page=replace_one(page,'As imagens abaixo são capturas de tela dos templates HTML desta coleção. Você pode abrir as demonstrações e navegar pelas páginas.','Confira capturas reais dos 30 templates, com detalhes, prévias para desktop e celular e condições de compra.')
 def action(m):
  sku=m.group(1);assert sku in products
  return '<a class="btn outline" href="/produtos/'+sku+'.html">Detalhes e comprar ↗</a>'
 page,n1=re.subn(r'<button class="btn outline" onclick="addToCart\(\x27([A-Z0-9-]+)\x27\)">Adicionar ao pedido ＋</button>',action,page)
 def action_pack(m):
  sku=m.group(1);assert sku in products
  return '<a class="btn green" href="/produtos/'+sku+'.html">Ver pacote e comprar ↗</a>'
 page,n2=re.subn(r'<button class="btn green" onclick="addToCart\(\x27([A-Z0-9-]+)\x27\)">Adicionar pacote ＋</button>',action_pack,page)
 if (n1,n2)!=(30,5):raise AssertionError('35 buttons not updated '+str((n1,n2)))
 page,n3=re.subn(r'href="previews/([A-Z0-9-]+).webp"',lambda m:'href="/produtos/'+m.group(1)+'.html"',page)
 if n3!=60:raise AssertionError('60 preview links expected, got '+str(n3))
 page=page.replace('Ver imagem real ↗','Prévias e detalhes ↗')
 m=re.search(r'<section class="sec packs" id="pacotes">[\s\S]*?</section>',page)
 if not m:raise AssertionError('Package section missing')
 pack=m.group(0);page=page.replace(pack,'',1)
 page=replace_one(page,'<section class="sec" id="templates"',pack+'<section class="sec" id="templates"')
 steps='''<section class="v2-simple-section" id="como-funciona"><div class="container"><span class="v2-kicker">COMO FUNCIONA</span><div class="sectop"><h2>Simples de escolher.<br>Fácil de começar.</h2><p>Veja o produto, compre com segurança e personalize seus arquivos.</p></div><div class="v2-how-grid"><div class="v2-step"><span class="v2-step-number">01</span><h3>Encontre o seu modelo</h3><p>Explore os nichos e confira imagens reais dos templates.</p></div><div class="v2-step"><span class="v2-step-number">02</span><h3>Compre pela Cakto</h3><p>Finalize a compra pelo checkout do produto selecionado.</p></div><div class="v2-step"><span class="v2-step-number">03</span><h3>Receba e personalize</h3><p>Após a aprovação do pagamento, receba os arquivos e edite para o seu projeto.</p></div></div></div></section>'''
 page=replace_one(page,'<section class="sec" id="precos">',steps+'<section class="sec" id="precos">')
 trust='''<section class="v2-proof"><div class="container"><span class="v2-kicker">TRANSPARÊNCIA</span><div class="sectop"><h2>Escolha com confiança.</h2><p>Informações claras antes de pagar.</p></div><div class="v2-proof-grid"><div class="v2-proof-item"><b>Prévias reais</b><p>Imagens dos modelos em desktop e celular.</p></div><div class="v2-proof-item"><b>Checkout seguro</b><p>Pagamentos realizados pela Cakto.</p></div><div class="v2-proof-item"><b>Compra transparente</b><p>Veja nossos <a href="/termos.html">termos</a>, <a href="/entrega.html">entrega</a> e <a href="/reembolsos.html">reembolsos</a>.</p></div></div></div></section>'''
 trust+=('<section class="v2-banner"><div class="container v2-banner-inner"><div><span class="v2-kicker">FALE COM A GENTE</span><h2>Precisa de ajuda para escolher?</h2><p>Converse com a Sites Menos Custo antes de comprar.</p></div>'
 +'<a class="btn green" href="'+IG+'" target="_blank" rel="noopener noreferrer">Instagram @sitesmenoscusto ↗</a></div></section>')
 page=replace_one(page,'<section class="sec faq" id="informacoes">',trust+'<section class="sec faq" id="informacoes">')
 page=page.replace('Pix e cartão estão disponíveis conforme a oferta.','Consulte os meios de pagamento disponíveis diretamente no checkout da oferta.')
 page=page.replace('As licenças comerciais são preliminares e precisam de aprovação antes da venda.','Consulte as condições de licença antes de adquirir qualquer modelo.')
 old='<details><summary>Como comprar?</summary><p>Selecione um modelo ou pacote, revise o pedido e clique em Pagar com segurança na Cakto. A entrega do ZIP acontece pelo canal configurado para a oferta após o pagamento aprovado.</p></details>'
 new='<details><summary>Como comprar?</summary><p>Escolha o modelo ou pacote, confira a página com prévias e clique em Comprar na Cakto. O ZIP será disponibilizado pelo canal configurado na Cakto após a aprovação.</p></details>'
 new+='<details><summary>Como posso tirar dúvidas?</summary><p>Pelo Instagram <a href="'+IG+'" target="_blank" rel="noopener noreferrer">@sitesmenoscusto</a> ou por e-mail: '+MAIL+'.</p></details>'
 page=replace_one(page,old,new)
 page,n=re.subn(r'<footer class="footer">[\s\S]*?</footer>',footer(),page,count=1)
 if n!=1:raise AssertionError('Old footer not found')
 extra=('<link rel="canonical" href="'+DOMAIN+'/"><meta name="robots" content="index,follow,max-image-preview:large">'
 +'<meta property="og:type" content="website"><meta property="og:title" content="Sites Menos Custo | Templates HTML editáveis">'
 +'<meta property="og:description" content="30 templates individuais e 5 pacotes. Confira imagens reais e compre pela Cakto.">'
 +'<meta property="og:url" content="'+DOMAIN+'/"><meta property="og:image" content="'+DOMAIN+'/previews/P10-01.webp">'
 +'<meta name="twitter:card" content="summary_large_image">'
 +'<link rel="stylesheet" href="/v2.css"><script src="/v2.js" defer></script>')
 page=replace_one(page,'</head>',extra+'</head>')
 page=page.replace('Sites Menos Custo — Catálogo de 30 Templates Visuais','Sites Menos Custo | 35 Templates e Pacotes HTML Editáveis')
 if any(t in page for t in ['Meu pedido','Pagamento Pix','addToCart(','Comprovante Pix']):raise AssertionError('Legacy Pix/cart still exists')
 return page
def main():
 config=json.loads(Path("cakto-checkouts.json").read_text(encoding='utf-8'))
 links=config['checkouts']
 with zipfile.ZipFile(ARCHIVE) as source:
  files={x.filename:source.read(x.filename) for x in source.infolist()}
 page=files['index.html'].decode('utf-8')
 if 'const SHOP_PRODUCTS=' in page:
  products=json.loads(re.search(r'const SHOP_PRODUCTS=(\{.*?\});',page,re.S).group(1))
 else:
  products=json.loads(files['products-v2.json'].decode('utf-8'))
 assert len(products)==len(links)==35 and set(products)==set(links)
 for url in links.values():
  u=urlparse(url);assert u.scheme=='https' and u.netloc=='pay.cakto.com.br'
 files['index.html']=home_upgrade(page,products).encode()
 files['products-v2.json']=json.dumps(products,ensure_ascii=False,indent=2).encode()
 files['v2.css']=Path('v2.css').read_bytes()
 files['v2.js']=Path('v2.js').read_bytes()
 for sku,entry in products.items():
  files['produtos/'+sku+'.html']=detail(sku,entry,products,links).encode()
 for filename,(title,sections) in POLICIES.items():
  files[filename]=legal(filename,title,sections).encode()
 links_for_map=['/']+['/produtos/'+sku+'.html' for sku in products]+['/'+f for f in POLICIES]
 files['sitemap.xml']=('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+xml_escape(DOMAIN+x)+'</loc></url>' for x in links_for_map)+'</urlset>').encode()
 files['robots.txt']=('User-agent: *\nAllow: /\nSitemap: '+DOMAIN+'/sitemap.xml\n').encode()
 assert not any(k.startswith(('arquivos_individuais/','pacotes/','modelos/')) for k in files)
 fd,temp=tempfile.mkstemp(suffix='.zip',dir='.')
 os.close(fd)
 try:
  with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as target:
   for path,content in sorted(files.items()):target.writestr(path,content)
  with zipfile.ZipFile(temp) as test:
   assert test.testzip() is None
   assert len([x for x in test.namelist() if x.startswith('produtos/') and x.endswith('.html')])==35
   for sku,link in links.items():assert link.encode() in test.read('produtos/'+sku+'.html')
  os.replace(temp,ARCHIVE)
 finally:
  if os.path.exists(temp):os.unlink(temp)
 Path('storefront-public-index.html').write_bytes(files['index.html'])
 print('Successfully generated Sites Menos Custo v2: 35 products, 5 legal pages, SEO, cookie consent, Instagram.')
if __name__=='__main__':main()
