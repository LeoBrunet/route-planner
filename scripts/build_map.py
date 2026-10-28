import json,math,sys,os
sys.path.insert(0,'scripts'); from classify import cls
LAT0=57.7; K=math.cos(math.radians(LAT0))
def P(lat,lon): return (lon*K*111320, lat*110540)
def dp(pts,eps):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1e-9
    i,dm=0,0
    for j in range(1,len(pts)-1):
        d=abs(dy*(pts[j][0]-a[0])-dx*(pts[j][1]-a[1]))/L
        if d>dm: i,dm=j,d
    if dm>eps: return dp(pts[:i+1],eps)[:-1]+dp(pts[i:],eps)
    return [a,b]
def enc(g,eps):
    pts=[P(p['lat'],p['lon']) if isinstance(p,dict) else P(*p) for p in g]
    s=dp(pts,eps); return [v for x,y in s for v in (round(x/10),round(y/10))]  # 10 m units
out={'unp':{1:[],2:[],3:[]},'road':[],'coast':[],'lake':[],'rail':[],'places':[],'stations':[]}
for e in json.load(open('data/unpaved.json'))['elements']:
    c=cls(e['tags'])
    if c: out['unp'][c].append(enc(e['geometry'],6))
for e in json.load(open('data/context.json'))['elements']:
    t=e['tags']; g=e.get('geometry')
    if not g: continue
    if t.get('natural')=='coastline': out['coast'].append(enc(g,25))
    elif t.get('natural')=='water':
        if len(g)>12: out['lake'].append(enc(g,20))
    elif t.get('railway'): out['rail'].append(enc(g,25))
    else: out['road'].append([{'motorway':0,'trunk':0,'primary':1,'secondary':2}[t['highway']]]+enc(g,20))
seen=set()
for e in json.load(open('data/places.json'))['elements']:
    t=e['tags']; n=t.get('name'); x,y=P(e['lat'],e['lon'])
    if not n: continue
    if t.get('railway')=='station':
        if n in seen: continue
        seen.add(n); out['stations'].append([n,round(x/10),round(y/10)])
    else: out['places'].append([n,t['place'],round(x/10),round(y/10)])
loops=json.load(open('data/loops.json'))
out['loops']=[]
for r in loops:
    out['loops'].append({k:r[k] for k in ('name','km','ascent','classes','surfaces','highways','start')}|{'g':enc(r['coords'],4),'file':os.path.basename(r['file'])})
s=json.dumps(out,separators=(',',':'),ensure_ascii=False)
open('data/mapdata.json','w').write(s); print(len(s)/1e6,'MB', {k:len(v) for k,v in out['unp'].items()})
