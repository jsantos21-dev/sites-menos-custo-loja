#!/usr/bin/env python3
"""Install the official Sites Menos Custo favicon into the public site ZIP."""
import base64
import os
import tempfile
import zipfile
from pathlib import Path

archive = Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
icon = base64.b64decode(Path("favicon64.b64").read_text(encoding="ascii").strip())
assert icon[:8] == b"\x89PNG\r\n\x1a\n", "Invalid icon image"

with zipfile.ZipFile(archive) as z:
    old_html = z.read("index.html").decode("utf-8")
    assert "<head>" in old_html
    tag = '<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png"/>'
    new_html = old_html if tag in old_html else old_html.replace("<head>", "<head>" + tag, 1)
    have_old_icon = "favicon.png" in z.namelist()
    if new_html == old_html and have_old_icon and z.read("favicon.png") == icon:
        print("Favicon already installed")
        raise SystemExit(0)

fd, tmp = tempfile.mkstemp(prefix=".smc-favicon-", suffix=".zip", dir=archive.parent)
os.close(fd)
try:
    with zipfile.ZipFile(archive, "r") as source, zipfile.ZipFile(tmp, "w") as output:
        for item in source.infolist():
            if item.filename == "index.html":
                output.writestr(item, new_html.encode("utf-8"))
            elif item.filename == "favicon.png":
                output.writestr(item, icon)
            else:
                output.writestr(item, source.read(item.filename))
        if not have_old_icon:
            output.writestr("favicon.png", icon, compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(tmp) as z:
        assert z.testzip() is None
        assert z.read("favicon.png") == icon
        assert tag in z.read("index.html").decode("utf-8")
    os.replace(tmp, archive)
finally:
    if os.path.exists(tmp):
        os.unlink(tmp)
print("Favicon installed in public storefront archive")
