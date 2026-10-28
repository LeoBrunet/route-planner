import json,sys,urllib.request,urllib.parse
def run(profile,extra=''):
    ll='11.9870,57.6966|12.0170,57.6560|11.9300,57.6330'
    u='https://brouter.de/brouter?lonlats='+ll+'&profile='+profile+'&alternativeidx=0&format=geojson'+extra
    g=json.load(urllib.request.urlopen(u,timeout=90));p=g['features'][0]['properties'];m=p['messages'];h=m[0]
    iD,iT=h.index('Distance'),h.index('WayTags');inf=car=0;tot=0
    for r in m[1:]:
        t=dict(x.split('=',1) for x in r[iT].split() if '=' in x);d=int(r[iD]);tot+=d
        bi=t.get('highway')=='cycleway' or t.get('bicycle')=='designated' or any(t.get(k,'') in('track','lane','opposite_track','opposite_lane') for k in('cycleway','cycleway:right','cycleway:left'))
        cr=t.get('highway') in('trunk','primary','secondary','tertiary','unclassified','residential','road','living_street','service','primary_link','secondary_link','tertiary_link')
        if bi: inf+=d
        elif cr: car+=d
    return f"{tot/1000:.1f} km | piste/bande {inf/tot*100:.0f}% | route sans aménagement {car/tot*100:.0f}%"
pid=sys.argv[1]
print('fastbike standard     ',run('fastbike'))
for v in (0,1,3,8): print(f'fastbike prio={v:<2}       ',run(pid,f'&profile:cycleway_priority={v}'))
