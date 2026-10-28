"""Builds route-planner.html: compiles web/src (TypeScript) and inlines it with the map data and BRouter profiles."""
import json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')
os.chdir(ROOT)

if not os.path.isdir(os.path.join(WEB, 'node_modules')):
    subprocess.run(['npm', 'install', '--no-audit', '--no-fund'], cwd=WEB, check=True)
subprocess.run(['npm', 'run', '--silent', 'build'], cwd=WEB, check=True)

page = open(os.path.join(WEB, 'index.html')).read()
app_js = open(os.path.join(WEB, 'dist', 'app.js')).read().replace('</script', '<\\/script')
data = json.load(open('data/overlay.json'))
data.pop('unp', None)
profiles = {b: open(f'profiles/{b}-cyclepriority.brf').read() for b in ('gravel', 'fastbike', 'trekking')}

page = (page.replace('/*DATA*/null', json.dumps(data, separators=(',', ':'), ensure_ascii=False))
            .replace('/*BRF*/{}', json.dumps(profiles))
            .replace('/*APP_JS*/', app_js))
open('route-planner.html', 'w').write(page)
print('route-planner.html', len(page) // 1024, 'KB')
