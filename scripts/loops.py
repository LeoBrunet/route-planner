import json,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from route import build
LOOPS={
 "Delsjön–Härryda forest loop":("Korsvägen (tram)", [(57.6966,11.9870),(57.689,12.03),(57.678,12.1093),(57.669,12.1781),(57.7289,12.1902),(57.7253,12.1477),(57.6966,11.9870)]),
 "Vättlefjäll loop":("Surte station", [(57.8226,12.0122),(57.8338,12.0057),(57.8733,12.0301),(57.8408,12.0647),(57.8226,12.0122)]),
 "Mollsjön traverse Lerum":("Lerum station", [(57.7705,12.2690),(57.7836,12.1195),(57.8287,12.1398),(57.8508,12.1344),(57.7705,12.2690)]),
 "Floda lakes gravel":("Floda station", [(57.8094,12.3600),(57.7983,12.3961),(57.7692,12.3838),(57.7602,12.3964),(57.7646,12.4157),(57.751,12.451),(57.7554,12.474),(57.7716,12.4716),(57.7784,12.4621),(57.8094,12.3600)]),
 "Hindås southern forests":("Hindås station", [(57.7046,12.4440),(57.6601,12.4117),(57.6208,12.3909),(57.5845,12.4085),(57.6065,12.4609),(57.6224,12.4834),(57.6565,12.4552),(57.7046,12.4440)]),
 "Svartedalen long ride":("Älvängen station", [(57.9606,12.1197),(57.976,12.0157),(58.0089,12.0398),(58.0369,12.0891),(58.0145,12.1015),(58.0035,12.0937),(57.9606,12.1197)]),
}
res=[]
for n,(start,pts) in LOOPS.items():
    try:
        r=build(n,pts); r['start']=start; r['wps']=pts; res.append(r)
        print(n,r['km'],r['ascent'],r['classes'])
    except Exception as e: print('FAIL',n,e)
json.dump(res,open('data/loops.json','w'),ensure_ascii=False)
