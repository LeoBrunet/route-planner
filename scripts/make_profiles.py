"""Builds BRouter profiles with a tunable 'cycleway_priority' penalty on car roads without bike infrastructure."""
import re,sys,urllib.request
GLOBAL="assign cycleway_priority = 0 # %cycleway_priority% | Extra cost on car roads without cycle lane/track (0 = off) | number\n"
WAY='''
# --- cycleway priority (added) ---
assign has_bikeinfra = or highway=cycleway or bicycle=designated or cycleway=track|lane|opposite_track|opposite_lane|shared_lane or cycleway:right=track|lane cycleway:left=track|lane
assign is_carroad = highway=trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|road|living_street|service
assign costfactor = if and is_carroad not has_bikeinfra then multiply costfactor_base add 1 cycleway_priority else costfactor_base

'''
for name in ('gravel','fastbike','trekking'):
    src=urllib.request.urlopen(f'https://brouter.de/brouter/profiles2/{name}.brf').read().decode()
    src=re.sub(r'(---context:global[^\n]*\n)',lambda m:m.group(1)+GLOBAL,src,1)
    i=src.index('\nassign costfactor')+1
    src=src[:i]+'assign costfactor_base'+src[i+len('assign costfactor'):]
    j=re.compile(r'\n(#[^\n]*\n)*assign ').search(src,i+30)   # next statement after the costfactor expression
    src=src[:j.start()+1]+WAY+src[j.start()+1:]
    open(f'profiles/{name}-cyclepriority.brf','w').write(src)
    print(name,'ok')
