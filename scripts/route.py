"""Gravel route builder: BRouter (gravel profile) -> GPX + surface report.
usage: python3 route.py NAME "lat,lon;lat,lon;..." [profile]
"""
import json, sys, urllib.request, urllib.parse, collections, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from classify import cls

def build(name, pts, profile='gravel', outdir='gpx'):
    ll='|'.join(f'{lon},{lat}' for lat,lon in pts)
    url='https://brouter.de/brouter?'+urllib.parse.urlencode({'lonlats':ll,'profile':profile,'alternativeidx':0,'format':'geojson'})
    req=urllib.request.Request(url, headers={'User-Agent':'gbg-gravel/1.0'})
    gj=json.load(urllib.request.urlopen(req, timeout=120))
    f=gj['features'][0]; p=f['properties']; coords=f['geometry']['coordinates']
    msgs=p['messages']; hdr=msgs[0]; rows=msgs[1:]
    iD=hdr.index('Distance'); iT=hdr.index('WayTags')
    surf=collections.Counter(); klass=collections.Counter(); hw=collections.Counter()
    for r in rows:
        dist=int(r[iD])/1000; tags=dict(kv.split('=',1) for kv in r[iT].split() if '=' in kv)
        s=tags.get('surface','(untagged)')
        surf[s]+=dist; hw[tags.get('highway','?')]+=dist
        paved = s in ('asphalt','paved','concrete','paving_stones','sett','concrete:plates') or (s=='(untagged)' and tags.get('highway') not in ('track','path'))
        klass[0 if paved else (cls(tags) or 3)]+=dist
    total=int(p['track-length'])/1000
    gpx=['<?xml version="1.0" encoding="UTF-8"?>','<gpx version="1.1" creator="gbg-gravel (BRouter gravel)" xmlns="http://www.topografix.com/GPX/1/1">',
         f'<metadata><name>{name}</name></metadata>',f'<trk><name>{name}</name><trkseg>']
    for c in coords:
        gpx.append(f'<trkpt lat="{c[1]:.6f}" lon="{c[0]:.6f}"><ele>{c[2] if len(c)>2 else 0}</ele></trkpt>')
    gpx+=['</trkseg></trk>','</gpx>']
    os.makedirs(outdir,exist_ok=True)
    fn=os.path.join(outdir, name.lower().replace(' ','-').replace('–','-')+'.gpx')
    open(fn,'w').write('\n'.join(gpx))
    rep={'name':name,'km':round(total,1),'ascent':int(p['filtered ascend']),'file':fn,
         'classes':{k:round(v,1) for k,v in sorted(klass.items())},
         'surfaces':{k:round(v,1) for k,v in surf.most_common(8)},
         'highways':{k:round(v,1) for k,v in hw.most_common(6)},
         'coords':[[round(c[1],5),round(c[0],5)] for c in coords]}
    return rep

if __name__=='__main__':
    pts=[tuple(map(float,x.split(','))) for x in sys.argv[2].split(';')]
    r=build(sys.argv[1],pts,*(sys.argv[3:4] or []))
    r.pop('coords'); print(json.dumps(r,ensure_ascii=False))
