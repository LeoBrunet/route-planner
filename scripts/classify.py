import json, math, sys, collections
FAST={'compacted','fine_gravel'}
TECH={'ground','dirt','earth','rock','mud','grass','sand'}
def cls(t):
    hw=t.get('highway'); s=t.get('surface'); tt=t.get('tracktype')
    if t.get('bicycle') in ('no','dismount'): return None
    if tt in ('grade4','grade5') or s in TECH or hw=='bridleway':
        return 3
    if hw=='path' and s in ('unpaved',None) : return 3
    if s in FAST or tt=='grade1': return 1
    if s in ('gravel','pebblestone','unpaved') and hw in ('unclassified','residential','tertiary','cycleway') : return 1 if s!='unpaved' else 2
    return 2
def hav(a,b):
    R=6371000; la1,lo1=map(math.radians,a); la2,lo2=map(math.radians,b)
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
if __name__=='__main__':
    d=json.load(open(sys.argv[1]))['elements']
    km=collections.Counter(); grid=collections.Counter()
    for e in d:
        c=cls(e['tags'])
        if not c: continue
        g=[(p['lat'],p['lon']) for p in e['geometry']]
        L=sum(hav(g[i],g[i+1]) for i in range(len(g)-1))/1000
        km[c]+=L
        if c in (1,2):
            m=g[len(g)//2]; grid[(round(m[0]/0.03)*0.03,round(m[1]/0.05)*0.05)]+=L
    print({k:round(v) for k,v in km.items()})
    for k,v in grid.most_common(25): print(round(k[0],2),round(k[1],2),round(v,1))
