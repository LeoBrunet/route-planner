import json,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from classify import cls,hav
d=json.load(open('data/unpaved.json'))['elements']
la0,lo0,la1,lo1=map(float,sys.argv[1:5])
out=[]
for e in d:
    c=cls(e['tags'])
    if c not in (1,2) or e['tags'].get('highway') in ('path','service'): continue
    g=[(p['lat'],p['lon']) for p in e['geometry']]
    m=g[len(g)//2]
    if not(la0<=m[0]<=la1 and lo0<=m[1]<=lo1): continue
    L=sum(hav(g[i],g[i+1]) for i in range(len(g)-1))
    out.append((L,c,e['tags'].get('name',''),e['tags'].get('highway'),e['tags'].get('surface','-'),round(g[0][0],4),round(g[0][1],4),round(m[0],4),round(m[1],4),round(g[-1][0],4),round(g[-1][1],4)))
for o in sorted(out,reverse=True)[:int(sys.argv[5]) if len(sys.argv)>5 else 20]: print(int(o[0]),*o[1:])
