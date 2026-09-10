"""Validate static pages, local links, fragments, images, and PDF integrity."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import hashlib

ROOT=Path(__file__).resolve().parent
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=True);self.ids=set();self.refs=[];self.h1=0;self.errors=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:self.errors.append('Duplicate id: '+a['id'])
            self.ids.add(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='img' and not a.get('alt'):self.errors.append('Missing image alt')
        if tag=='iframe' and not a.get('title'):self.errors.append('Missing iframe title')
        for key in ['href','src']:
            if a.get(key):self.refs.append(a[key])

pages={p:Page(p.read_text(encoding='utf-8')) for p in ROOT.rglob('*.html')}
errors=[];checked=0
for path,page in pages.items():
    errors.extend(f'{path.name}: {e}' for e in page.errors)
    if page.h1!=1:errors.append(f'{path.name}: expected one H1')
    for ref in page.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        checked+=1
        dest=(path.parent/unquote(u.path)).resolve() if u.path else path
        if not dest.exists():errors.append(f'{path.name}: missing {ref}')
        if u.fragment and dest.suffix=='.html' and dest in pages and unquote(u.fragment) not in pages[dest].ids:errors.append(f'{path.name}: missing fragment {ref}')
assert not errors,'\n'.join(errors)
print(f'PASS: {len(pages)} HTML pages; {checked} local links/assets/fragments; H1, alt and iframe checks.')
print('Resume SHA256:',hashlib.sha256((ROOT/'Hamza_Ouriour_Resume.pdf').read_bytes()).hexdigest())
