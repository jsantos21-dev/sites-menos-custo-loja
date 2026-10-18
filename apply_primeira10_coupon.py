#!/usr/bin/env python3
"""Introduce PRIMEIRA10 for the two R$ 997 P10 bundles only.
Payment remains manual Pix, and discounted totals flow through order summary and receipt.
"""
import os
import tempfile
import zipfile
from pathlib import Path

archive = Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
with zipfile.ZipFile(archive) as source:
    html = source.read("index.html").decode("utf-8")
if 'id="smc-primeira10-styles"' in html:
    print("Coupon already installed")
    raise SystemExit(0)

def replace_once(old, new):
    global html
    n = html.count(old)
    assert n == 1, f"Expected one source anchor, found {n}: {old[:95]!r}"
    html = html.replace(old, new, 1)

css = """<style id="smc-primeira10-styles">
.promo-banner{margin:0 0 24px;padding:18px 22px;border:1px solid #5eeab2;background:linear-gradient(120deg,#0b5c46,#087a59);color:#fff;border-radius:17px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.promo-banner strong{font-size:18px}.promo-banner p{color:#d7fbe9;margin:5px 0 0;font-size:13px}
.promo-code{font-size:19px;font-weight:900;letter-spacing:.1em;border:1px dashed #b1f5d6;padding:10px 14px;border-radius:9px;white-space:nowrap}
.orig-price{font-size:14px;text-decoration:line-through;color:#a5b0c1;margin-right:8px}
.coupon-price{font-size:20px;color:#9cf5b9;display:inline-block}
.promo-pack-note{font-size:12px;line-height:1.5;color:#bff5dc;margin:7px 0 13px;font-weight:700}
.coupon-box{background:#effbf5;border:1px solid #bce9d1;border-radius:14px;padding:14px 15px;margin:16px 0 10px}
.coupon-box label{display:block;color:#0c5c3b;font-size:13px;font-weight:850;margin-bottom:7px}
.coupon-controls{display:flex;gap:8px;flex-wrap:wrap}
.coupon-controls input{flex:1;min-width:135px;font:inherit;border:1px solid #b9cfca;border-radius:9px;padding:11px;color:#102e2a}
.coupon-controls button,.coupon-remove{border:0;border-radius:9px;padding:11px 14px;background:#087653;color:#fff;font-weight:850;cursor:pointer}
.coupon-remove{background:transparent;border:1px solid #91b8a6;color:#176644;padding:7px 11px;margin-left:auto}
.coupon-hint,.coupon-feedback{font-size:12px;color:#527464;margin:7px 0 0}
.coupon-feedback{color:#ba2c2c}
.coupon-applied{display:flex;align-items:center;gap:9px;flex-wrap:wrap;color:#0c744c}
.coupon-breakdown{display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:800;color:#116c48;margin:10px 0 0}
@media(max-width:550px){.promo-banner{align-items:flex-start}.promo-code{font-size:16px}.coupon-controls input{min-width:125px}}
</style>"""
replace_once("</head>", css + "</head>")
anchor = '<section class="sec packs" id="pacotes"><div class="container"><div class="sectop">'
assert anchor in html
html = html.replace(anchor, '<section class="sec packs" id="pacotes"><div class="container"><div class="promo-banner"><div><strong>10% OFF na biblioteca de 10 templates</strong><p>Somente nos pacotes de R$ 997: com o cupom PRIMEIRA10, pague R$ 897,30.</p></div><span class="promo-code">PRIMEIRA10</span></div><div class="sectop">', 1)

normal = '<div class="pack-price">R$ 997</div>'
assert html.count(normal) == 2, "Only the two P10 bundles must be advertised as discounted"
html = html.replace(normal, '<div class="pack-price"><span class="orig-price">R$ 997</span><span class="coupon-price">R$ 897,30 com cupom</span></div><div class="promo-pack-note">Use PRIMEIRA10 no carrinho para obter 10% OFF.</div>')

replace_once("let shoppingCart={};let checkoutStage=0;let currentOrder=null;",
             "let shoppingCart={};let checkoutStage=0;let currentOrder=null;let appliedCoupon='';\ntry{appliedCoupon=localStorage.getItem('smc_coupon_v1')==='PRIMEIRA10'?'PRIMEIRA10':''}catch(e){}")
replace_once("function totalAmount(){return productsInCart().reduce((s,x)=>s+x.subtotal,0)}",
"""function subtotalAmount(){return productsInCart().reduce((s,x)=>s+x.subtotal,0)}
function couponDiscount(){if(appliedCoupon!=='PRIMEIRA10')return 0;const eligible=productsInCart().filter(x=>(x.id==='P10-01'||x.id==='P10-02')&&x.price===997);return Math.round(eligible.reduce((sum,x)=>sum+x.subtotal,0)*10)/100}
function totalAmount(){return Math.round((subtotalAmount()-couponDiscount())*100)/100}
function applyCoupon(){const input=document.getElementById('smc-coupon-input');const value=(input?.value||'').trim().toUpperCase();const notice=document.getElementById('smc-coupon-feedback');if(value!=='PRIMEIRA10'){if(notice)notice.textContent='Cupom inválido. Confira o código PRIMEIRA10.';return}if(!productsInCart().some(x=>(x.id==='P10-01'||x.id==='P10-02')&&x.price===997)){if(notice)notice.textContent='Este cupom vale apenas nos pacotes de 10 templates de R$ 997.';return}appliedCoupon='PRIMEIRA10';try{localStorage.setItem('smc_coupon_v1',appliedCoupon)}catch(e){}drawShop();notify('PRIMEIRA10 aplicado: 10% de desconto no pacote de 10 templates.')}
function removeCoupon(){appliedCoupon='';try{localStorage.removeItem('smc_coupon_v1')}catch(e){}drawShop();notify('Cupom removido.')}""")

coupon_ui = """function couponHtml(lines){if(!lines.length)return '';const eligible=lines.some(x=>(x.id==='P10-01'||x.id==='P10-02')&&x.price===997);if(appliedCoupon==='PRIMEIRA10'&&eligible){return '<div class="coupon-box"><div class="coupon-applied"><strong>✓ PRIMEIRA10 aplicado</strong><button type="button" class="coupon-remove" onclick="removeCoupon()">Remover cupom</button></div><div class="coupon-breakdown"><span>Subtotal: '+money(subtotalAmount())+'</span><span>Desconto: −'+money(couponDiscount())+'</span></div><p class="coupon-hint">10% somente nos pacotes de 10 templates de R$ 997. Os outros preços não mudam.</p></div>'}
return '<div class="coupon-box"><label for="smc-coupon-input">Tem um cupom de desconto?</label><div class="coupon-controls"><input id="smc-coupon-input" type="text" placeholder="Digite seu cupom" maxlength="30" autocomplete="off" onkeydown="if(event.key===\\'Enter\\'){event.preventDefault();applyCoupon()}"><button type="button" onclick="applyCoupon()">Aplicar cupom</button></div><p class="coupon-hint">PRIMEIRA10 dá 10% OFF apenas nos pacotes de 10 templates de R$ 997.</p><p class="coupon-feedback" id="smc-coupon-feedback" role="status" aria-live="polite"></p></div>'}
"""
replace_once("function drawShop(){", coupon_ui + "function drawShop(){")
replace_once('<div class="cart-total"><span>TOTAL DO PEDIDO</span>',
             '${couponHtml(lines)}<div class="cart-total"><span>TOTAL DO PEDIDO</span>')
replace_once("currentOrder={ref:newOrderRef(),total:totalAmount(),products,buyer:'',email:''}",
             "currentOrder={ref:newOrderRef(),subtotal:subtotalAmount(),discount:couponDiscount(),coupon:couponDiscount()>0?'PRIMEIRA10':'',total:totalAmount(),products,buyer:'',email:''}")
replace_once('<div class="big">${money(x.total)}</div><div class="shop-info">',
             '<div class="big">${money(x.total)}</div><p class="shop-info">${x.coupon?("Cupom "+x.coupon+" aplicado: −"+money(x.discount)+" (somente pacote P10)"):"Sem desconto aplicado"}</p><div class="shop-info">')
replace_once(r"\n\nTOTAL PAGO: ${money(o.total)}",
             r"\n\nCUPOM: ${o.coupon||'nenhum'}\nDESCONTO: ${money(o.discount||0)}\nTOTAL PAGO: ${money(o.total)}")
replace_once(r"\nTotal: ${money(o.total)}",
             r"\nCupom: ${o.coupon||'nenhum'}\nDesconto: ${money(o.discount||0)}\nTotal: ${money(o.total)}")
assert html.count('PRIMEIRA10')>=10
assert 'function couponDiscount()' in html
assert 'function applyCoupon()' in html
assert 'checkoutStage=1;drawShop()' in html
assert html.count("addToCart('P10-") == 2

fd,tmp=tempfile.mkstemp(prefix=".smc-primeira10-",suffix=".zip",dir=archive.parent)
os.close(fd)
try:
    with zipfile.ZipFile(archive) as source,zipfile.ZipFile(tmp,'w') as dest:
        for item in source.infolist():
            dest.writestr(item,html.encode('utf-8') if item.filename=='index.html' else source.read(item.filename))
    with zipfile.ZipFile(tmp) as check:
        assert check.testzip() is None
        assert 'id="smc-primeira10-styles"' in check.read("index.html").decode('utf-8')
    os.replace(tmp,archive)
finally:
    if os.path.exists(tmp):os.unlink(tmp)
print("Applied PRIMEIRA10 exclusively to the two P10 packs in storefront ZIP")