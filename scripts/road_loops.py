import json,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from route import build
LOOPS={
 "Särö coast road loop":("Korsvägen (tram)",[(57.6966,11.9870),(57.6330,11.9300),(57.5100,11.9400),(57.4870,12.0700),(57.5761,12.0742),(57.6966,11.9870)]),
 "Marstrand road loop":("Göteborgs central",[(57.7089,11.9730),(57.8710,11.9800),(57.8870,11.6000),(57.7200,11.7700),(57.7089,11.9730)]),
 "Alingsås lakes road loop":("Lerum station",[(57.7705,12.2690),(57.9300,12.5330),(57.8600,12.6600),(57.8094,12.3600),(57.7705,12.2690)]),
}
res=[]
for n,(start,pts) in LOOPS.items():
    r=build(n,pts,'fastbike',outdir='gpx/road'); r['start']=start; res.append(r)
    print(n,r['km'],r['ascent'],r['classes'],list(r['surfaces'].items())[:3])
json.dump(res,open('data/road_loops.json','w'),ensure_ascii=False)
