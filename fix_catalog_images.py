#!/usr/bin/env python3
"""Fix blank product cards in the public ZIP without exposing purchased templates."""
import os,re,tempfile,zipfile
from pathlib import Path
archive=Path("Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip")
with zipfile.ZipFile(archive) as z:
    html=z.read("index.html").decode("utf-8")
    names=set(z.namelist())
pattern=re.compile(r'(<a\\s+class="cover"\\s+href="(?P<img>previews/(?:LP|SI|LV)\\d{2}\\.webp)"\\s+rel="noopener"\\s+target="_blank">)\\s*(</a>)')
def replace(match):
    asset=match.group("img")
    assert asset in names, "Missing image: "+asset
    code=asset.split("/")[-1].split(".")[0]
    return match.group(1)+f'<img src="{asset}" loading="lazy" decoding="async" alt="Prévia real {code}"/>'+match.group(3)
fixed,n=pattern.subn(replace,html)
if n==0 and fixed.count('class="cover"')==30 and fixed.count('<img src="previews/')>=30:
    print("Already fixed")
    raise SystemExit(0)
assert n==30, f"Expected 30 thumbnails, found {n}"
fd,tmp=tempfile.mkstemp(prefix=".smc-",suffix=".zip",dir=archive.parent)
os.close(fd)
try:
    with zipfile.ZipFile(archive) as source, zipfile.ZipFile(tmp,"w") as dest:
        for i in source.infolist():
            dest.writestr(i,fixed.encode("utf8") if i.filename=="index.html" else source.read(i.filename))
    with zipfile.ZipFile(tmp) as check:
        assert check.testzip() is None
    os.replace(tmp,archive)
finally:
    if os.path.exists(tmp):os.unlink(tmp)
print(f"Fixed {n} product images")
