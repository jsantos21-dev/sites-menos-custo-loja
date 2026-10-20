#!/usr/bin/env python3
"""Remove obsolete nav/payment controls while preserving Cakto checkout modal."""
import json
import os
import re
import tempfile
import zipfile
from pathlib import Path

ARCHIVE = Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
CONFIG = Path("cakto-checkouts.json")

REMOVE_PARTS = [
    '<a href="#pagamento">Pagamento Pix</a>',
    '<button class="btn cart-trigger" id="cart-trigger" onclick="openCart()" type="button">Meu pedido · 0</button>',
    '<div class="floating-cart" id="floating-cart" onclick="openCart()" onkeydown="if(event.key===\'Enter\')openCart()" role="button" tabindex="0">🛒 <span id="cart-bubble">0</span></div>',
]
OLD_UPDATE = "function updateShop(){let items=productsInCart();let count=items.reduce((s,x)=>s+x.qty,0);document.querySelector('#cart-trigger').textContent='Meu pedido · '+count;document.querySelector('#cart-bubble').textContent=count;try{localStorage.setItem('smc_cart_v3',JSON.stringify(shoppingCart))}catch(e){}}"
NEW_UPDATE = "function updateShop(){try{localStorage.setItem('smc_cart_v3',JSON.stringify(shoppingCart))}catch(e){}}"


def patch(html):
    if "const CAKTO_CHECKOUTS=" not in html:
        raise RuntimeError("Cannot remove legacy controls before Cakto integration")
    if all(part not in html for part in REMOVE_PARTS) and OLD_UPDATE not in html:
        validate(html)
        print("Obsolete navigation is already removed")
        return html
    for part in REMOVE_PARTS:
        if html.count(part) != 1:
            raise AssertionError("Expected one occurrence of legacy element: " + part[:120])
        html = html.replace(part, "", 1)
    if html.count(OLD_UPDATE) != 1:
        raise AssertionError("Legacy cart update function not found")
    html = html.replace(OLD_UPDATE, NEW_UPDATE, 1)
    validate(html)
    return html


def validate(html):
    urls = json.loads(CONFIG.read_text(encoding="utf-8"))["checkouts"]
    match = re.search(r"const CAKTO_CHECKOUTS=(\{[^;]+\});", html)
    if not match or json.loads(match.group(1)) != urls or len(urls) != 35:
        raise AssertionError("Cakto checkout mapping is inconsistent")
    for unwanted in ("Meu pedido", "Pagamento Pix", 'id="cart-trigger"', 'id="floating-cart"', "document.querySelector('#cart-bubble')"):
        if unwanted.lower() in html.lower():
            raise AssertionError("Obsolete navigation still present: " + unwanted)
    for required in ("function addToCart(id)", "function openCart()", "function startPayment()", "function updateShop()", "Pagar com segurança na Cakto", '<a href="#templates">Templates</a>'):
        if required not in html:
            raise AssertionError("Required purchase flow missing: " + required)


def main():
    with zipfile.ZipFile(ARCHIVE, "r") as z:
        source_html = z.read("index.html").decode("utf-8")
    html = patch(source_html)
    if html == source_html:
        return
    fd, name = tempfile.mkstemp(prefix=".smc-nav-", suffix=".zip", dir=".")
    os.close(fd)
    try:
        with zipfile.ZipFile(ARCHIVE, "r") as src, zipfile.ZipFile(name, "w") as dest:
            for item in src.infolist():
                content = html.encode("utf-8") if item.filename == "index.html" else src.read(item.filename)
                dest.writestr(item, content)
        with zipfile.ZipFile(name) as check:
            assert check.testzip() is None
            assert check.read("index.html").decode("utf-8") == html
        os.replace(name, ARCHIVE)
    finally:
        if os.path.exists(name):
            os.unlink(name)
    print("Removed Meu pedido, Pagamento Pix and redundant cart bubble; retained 35 Cakto checkouts.")


if __name__ == "__main__":
    main()
