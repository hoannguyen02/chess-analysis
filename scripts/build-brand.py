import xml.etree.ElementTree as ET,re,json
from pathlib import Path
root=ET.parse('public/images/Logo_LIMA.svg').getroot()
ns='{http://www.w3.org/2000/svg}'
commands=[]
for group in list(root):
 shape=list(group)[0];style=shape.attrib.get('style','')
 if 'fill:none' in style:
  root.remove(group);continue
 matrix=re.search(r'matrix\(([^)]+)\)',group.attrib['transform']).group(1).replace(',',' ')
 color='1 1 1' if 'fill:white' in style else ('0.9647 0.6549 0.1216' if '246,167,31' in style else '0.0627 0.0863 0.1020')
 commands.extend(['q',matrix+' cm',color+' rg'])
 if shape.tag==ns+'rect':
  commands.append(' '.join(shape.attrib[k] for k in ['x','y','width','height'])+' re')
 else:
  tokens=re.findall(r'[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?',shape.attrib['d'])
  i=0
  while i<len(tokens):
   op=tokens[i];i+=1;n={'M':2,'L':2,'C':6,'Z':0}[op]
   if n:
    while i<len(tokens) and tokens[i] not in ['M','L','C','Z']:
     commands.append(' '.join(tokens[i:i+n])+' '+{'M':'m','L':'l','C':'c'}[op]);i+=n
     if op=='M':op='L'
   else:commands.append('h')
 commands.extend(['f','Q'])
ET.register_namespace('', 'http://www.w3.org/2000/svg')
root.set('viewBox','0 40 500 420');root.set('width','500');root.set('height','420')
Path('public/brand/lima-symbol.svg').write_text(ET.tostring(root,encoding='unicode'))
Path('src/lib/brand/logo.ts').write_text('// Vector paths from public/brand/lima-symbol.svg. Regenerate with scripts/build-brand.py.\nexport const LIMA_LOGO_PDF = '+json.dumps('\n'.join(commands))+';\n')
