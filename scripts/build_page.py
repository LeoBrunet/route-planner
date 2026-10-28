import json
t=open('heatmap_template.html').read()
brf={b:open(f'profiles/{b}-cyclepriority.brf').read() for b in ('gravel','fastbike','trekking')}
ov=json.load(open('data/overlay.json'));ov.pop('unp',None)
t=t.replace('/*DATA*/null',json.dumps(ov,separators=(',',':'),ensure_ascii=False)).replace('/*BRF*/{}',json.dumps(brf))
open('route-atlas.html','w').write(t)
