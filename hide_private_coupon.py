#!/usr/bin/env python3
"""Keep PRIMEIRA10 valid in checkout without advertising it in the storefront."""
from pathlib import Path
import os, tempfile, zipfile

archive=Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
with zipfile.ZipFile(archive) as z:
    html=z.read("index.html").decode("utf-8")
original=html

banner='<div class="promo-banner"><div><strong>10% OFF na biblioteca de 10 templates</strong><p>Somente nos pacotes de R$ 997: com o cupom PRIMEIRA10, pague R$ 897,30.</p></div><span class="promo-code">PRIMEIRA10</span></div>'
if banner in html:
    assert html.count(banner)==1
    html=html.replace(banner,"",1)

promotional_price='<div class="pack-price"><span class="orig-price">R$ 997</span><span class="coupon-price">R$ 897,30 com cupom</span></div><div class="promo-pack-note">Use PRIMEIRA10 no carrinho para obter 10% OFF.</div>'
if promotional_price in html:
    assert html.count(promotional_price)==2
    html=html.replace(promotional_price,'<div class="pack-price">R$ 997</div>')

visible_hint='<p class="coupon-hint">PRIMEIRA10 dá 10% OFF apenas nos pacotes de 10 templates de R$ 997.</p>'
if visible_hint in html:
    assert html.count(visible_hint)==1
    html=html.replace(visible_hint,'<p class="coupon-hint">Insira seu cupom, caso tenha recebido um.</p>')

leaky_error="Cupom inválido. Confira o código PRIMEIRA10."
if leaky_error in html:
    html=html.replace(leaky_error,"Cupom inválido.",1)

# The input remains generic; the code is shown only *after* a successful application.
assert '<label for="smc-coupon-input">Tem um cupom de desconto?</label>' in html
assert '<div class="pack-price">R$ 997</div>' in html
assert html.count('<div class="pack-price">R$ 997</div>')==2
assert 'function couponDiscount()' in html and "if(appliedCoupon!=='PRIMEIRA10')return 0" in html
assert 'function applyCoupon()' in html
assert 'function totalAmount(){return Math.round((subtotalAmount()-couponDiscount())*100)/100}' in html
assert banner not in html and promotional_price not in html and visible_hint not in html
assert 'R$ 897,30 com cupom' not in html
assert '10% OFF na biblioteca' not in html

if html==original:
    print("Private coupon storefront presentation already installed")
    raise SystemExit(0)

fd,tmp=tempfile.mkstemp(prefix=".smc-private-coupon-",suffix=".zip",dir=archive.parent)
os.close(fd)
try:
    with zipfile.ZipFile(archive) as src,zipfile.ZipFile(tmp,"w") as dest:
        for item in src.infolist():
            dest.writestr(item,html.encode("utf-8") if item.filename=="index.html" else src.read(item.filename))
    with zipfile.ZipFile(tmp) as test:
        assert test.testzip() is None
    os.replace(tmp,archive)
finally:
    if os.path.exists(tmp):os.unlink(tmp)
print("Removed visible coupon advertisements; PRIMEIRA10 still applies to P10 at Pix checkout")
