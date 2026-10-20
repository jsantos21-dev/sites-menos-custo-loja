#!/usr/bin/env python3
"""Activate Cakto checkouts for every storefront SKU, only when fully configured.

Atomic migration: require 35 real payment links and never leave
a mixed Cakto/manual-Pix checkout. Coupons activate only when explicitly enabled.
"""
import json
import os
import re
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import urlparse

ARCHIVE = Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
CONFIG = Path("cakto-checkouts.json")
MARKER = "const CAKTO_CHECKOUTS="

def replace_once(html, old, new):
    amount = html.count(old)
    if amount != 1:
        raise AssertionError("Expected one HTML anchor, found %s: %r" % (amount, old[:90]))
    return html.replace(old, new, 1)

def sub_once(html, pattern, replacement):
    result, count = re.subn(pattern, lambda _: replacement, html, count=1, flags=re.S)
    if count != 1:
        raise AssertionError("HTML structure changed, cannot safely migrate checkout")
    return result

def main():
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    with zipfile.ZipFile(ARCHIVE) as source:
        html = source.read("index.html").decode("utf-8")
    if MARKER in html:
        print("Cakto checkout migration already installed")
        return

    match = re.search(r"const SHOP_PRODUCTS=(\{.*?\});\s*const PIX_KEY=", html, flags=re.S)
    if not match:
        raise AssertionError("Product catalog not found")
    products = json.loads(match.group(1))
    checkouts = config.get("checkouts", {})
    missing = [key for key in products if not checkouts.get(key)]
    unknown = set(checkouts) - set(products)
    if unknown:
        raise ValueError("Unknown product SKU(s): " + ", ".join(sorted(unknown)))
    if missing:
        print("Cakto checkout NOT activated. Missing %s/%s links: %s" %
              (len(missing), len(products), ", ".join(missing)))
        return
    normalized = {}
    for sku in products:
        url = checkouts[sku].strip()
        parts = urlparse(url)
        if (parts.scheme != "https" or parts.netloc != "pay.cakto.com.br" or
                not parts.path.strip("/") or parts.username or parts.password or parts.fragment):
            raise ValueError("Invalid official Cakto checkout URL for " + sku)
        normalized[sku] = url
    if len(set(normalized.values())) != len(products):
        raise ValueError("Repeated checkout URL across SKUs: every delivered ZIP needs its own linked offer")

    html = replace_once(html, "const PIX_KEY=", MARKER +
        json.dumps(normalized, ensure_ascii=False, separators=(",", ":")) + ";\nconst CAKTO_COUPON_ENABLED=" +
        json.dumps(bool(config.get("coupon_primeira10_enabled"))) + ";\nconst PIX_KEY=")
    # Suppress the private coupon UI until the same 10% discount is active
    # for P10-01 and P10-02 in Cakto (not just in the site's JavaScript).
    html = replace_once(html,
        "function couponDiscount(){if(appliedCoupon!=='PRIMEIRA10')",
        "function couponDiscount(){if(!CAKTO_COUPON_ENABLED||appliedCoupon!=='PRIMEIRA10')")
    html = replace_once(html, "function couponHtml(lines){",
        "function couponHtml(lines){if(!CAKTO_COUPON_ENABLED)return '';")

    html = replace_once(html,
        "function addToCart(id){shoppingCart[id]=(shoppingCart[id]||0)+1;updateShop();checkoutStage=0;openCart();}",
        "function addToCart(id){shoppingCart={};shoppingCart[id]=1;updateShop();checkoutStage=0;openCart();}")

    checkout_ui = r'''function drawShop(){
 const el=document.querySelector('#cart-view'), lines=productsInCart();
 if(!lines.length){el.innerHTML='<div class="shop-body"><h3 class="shop-section">Seu pedido</h3><p class="shop-empty">Escolha um dos produtos do catálogo para comprar diretamente pela Cakto.</p></div>';return}
 if(lines.length!==1||lines[0].qty!==1){shoppingCart={};updateShop();el.innerHTML='<div class="shop-body"><p class="shop-empty">A compra agora é individual. Selecione novamente o template ou pacote desejado.</p></div>';return}
 const x=lines[0];
 el.innerHTML='<div class="shop-body"><div class="shop-steps"><span class="selected">1. Revisar produto</span><span>2. Pagamento seguro na Cakto</span></div>'
 +'<h3 class="shop-section">PRODUTO SELECIONADO</h3><div class="cart-line"><div><strong>'+esc(x.id)+' · '+esc(x.name)+'</strong><small>1 × '+money(x.price)+'</small></div></div>'
 +couponHtml(lines)
 +'<div class="cart-total"><span>VALOR ESTIMADO</span><strong>'+money(totalAmount())+'</strong></div>'
 +'<p class="shop-inline-warning">O preço e qualquer desconto serão confirmados no checkout oficial da Cakto. Pagamentos e dados bancários não são recebidos por este site.</p>'
 +'<button class="shop-primary" onclick="startPayment()">Pagar com segurança na Cakto ↗</button>'
 +'<div class="shop-row" style="margin-top:12px"><button class="shop-secondary" onclick="removeFromCart(\''+x.id+'\')">Trocar produto</button></div></div>';
}
'''
    html = sub_once(html, r"function drawShop\(\)\{.*?(?=function esc\(s\))", checkout_ui)
    checkout_handler = r'''function caktoCheckoutUrl(id){
 const base=CAKTO_CHECKOUTS[id];
 if(!base)return '';
 const url=new URL(base);
 if(CAKTO_COUPON_ENABLED&&appliedCoupon==='PRIMEIRA10'&&(id==='P10-01'||id==='P10-02'))url.searchParams.set('coupon','PRIMEIRA10');
 url.searchParams.set('utm_source','sitesmenoscusto');
 url.searchParams.set('utm_medium','site');
 return url.toString();
}
function startPayment(){
 const items=productsInCart();
 if(items.length!==1||items[0].qty!==1){notify('Selecione apenas um produto por compra na Cakto.');return}
 const url=caktoCheckoutUrl(items[0].id);
 if(!url){notify('Checkout temporariamente indisponível para este produto.');return}
 window.location.assign(url);
}
'''
    html = sub_once(html, r"function startPayment\(\)\{.*?(?=function paymentReported\(\))", checkout_handler)

    html = sub_once(html,
        r'<section class="sec pix-section" id="pagamento">.*?</section>',
        '<section class="sec pix-section" id="pagamento"><div class="container"><div class="sectop"><div><span class="kicker">FORMA DE PAGAMENTO</span><h2>Compra segura diretamente na Cakto.</h2></div><p>Escolha o template ou pacote e prossiga para o checkout oficial da Cakto. Pix e cartão estão disponíveis conforme a oferta. A entrega dos arquivos é feita pelo canal configurado na Cakto após a aprovação do pagamento.</p></div></div></section>')

    replacements = [
        ("Escolha os produtos, monte seu pedido e pague via Pix. Envie o comprovante para conferência manual.",
         "Escolha o seu produto e finalize a compra pelo checkout seguro da Cakto."),
        ("Escolha seus modelos, adicione ao pedido e clique em Prosseguir para o Pix. Depois de pagar, abra o e-mail com os produtos e a referência preenchidos, anexe o comprovante e aguarde a conferência manual para receber os ZIPs.",
         "Selecione um modelo ou pacote, revise o pedido e clique em Pagar com segurança na Cakto. A entrega do ZIP acontece pelo canal configurado para a oferta após o pagamento aprovado."),
        ("O catálogo não processa pagamentos nem valida transferências automaticamente. Compras e entregas exigem confirmação manual por e-mail.",
         "O pagamento é processado no checkout oficial da Cakto. Verifique os dados da oferta antes de finalizar."),
        ("Pagamento somente Pix (CNPJ informado: 69.160.552/0001-63)",
         "Pagamento processado pela Cakto"),
        ("SITES MENOS CUSTO · COMPRA VIA PIX","SITES MENOS CUSTO · CHECKOUT CAKTO"),
    ]
    for old, new in replacements:
        html = replace_once(html, old, new)

    assert "Prosseguir para o Pix →" not in html
    assert 'function caktoCheckoutUrl(id)' in html
    assert len(normalized) == 35

    fd, tmp = tempfile.mkstemp(prefix=".smc-cakto-", suffix=".zip", dir=ARCHIVE.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(ARCHIVE) as source, zipfile.ZipFile(tmp, "w") as target:
            for member in source.infolist():
                target.writestr(member, html.encode("utf-8") if member.filename == "index.html" else source.read(member.filename))
        with zipfile.ZipFile(tmp) as check:
            assert check.testzip() is None
        os.replace(tmp, ARCHIVE)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    print("Activated 35 individual Cakto checkouts with no Pix/manual fallback")

if __name__ == "__main__":
    main()
