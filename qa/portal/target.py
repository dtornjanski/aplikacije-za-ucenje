import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.request import Request, urlopen


TARGET = json.loads(Path(__file__).with_name('target.json').read_text())
MODE = TARGET['mode']
COMMIT = TARGET['commit']
PUBLIC = 'https://aplikacije-za-ucenje.onrender.com/'
LOCAL = 'http://127.0.0.1:4173/'
APPS = ('matematicka-pustolovina', 'mislim-i-otkrivam',
        'informaticka-pustolovina', 'istrazivaci-naseg-svijeta')


def configure():
    assert MODE in ('candidate', 'design', 'public', 'baseline')
    assert re.fullmatch('[0-9a-f]{40}', COMMIT), COMMIT
    evidence = Path(os.environ['RUNNER_TEMP']) / 'ishod'
    evidence.mkdir(exist_ok=True)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as outputs:
        print(f'commit={COMMIT}\nmode={MODE}', file=outputs)
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        print('QA_PORTAL=' + (LOCAL if MODE in ('candidate', 'design') else PUBLIC), file=env)
        print(f'QA_EVIDENCE={evidence}\nQA_MODE={MODE}\nQA_COMMIT={COMMIT}', file=env)
    print(MODE, COMMIT)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify():
    portal = os.environ['QA_PORTAL']
    release = Path('candidate/javne-aplikacije')
    urls = {'': 'index.html', **{name + '/index.html': name + '/index.html' for name in APPS}}
    for asset in (release / 'assets').rglob('*'):
        if asset.is_file() and asset.suffix in ('.webp', '.css', '.woff2'):
            uri = asset.relative_to(release).as_posix()
            urls[uri] = uri
    expected = {url: digest((release / path).read_bytes()) for url, path in urls.items()}
    deadline = time.monotonic() + (300 if MODE == 'public' else 45)

    def check(url):
        request = Request(portal + url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'QA-Portal/1'})
        with urlopen(request, timeout=15) as response:
            assert response.status == 200, response.status
            if urls[url].endswith('.html'):
                assert response.headers.get_content_type() == 'text/html', response.headers
            raw = response.read()
            return url, {'requested': request.full_url, 'served': response.geturl(), 'sha256': digest(raw),
                         'bytes': len(raw)}

    while True:
        try:
            with concurrent.futures.ThreadPoolExecutor(5) as pool:
                responses = dict(pool.map(check, urls))
            wrong = {key: result['sha256'] for key, result in responses.items()
                     if result['sha256'] != expected[key]}
            assert not wrong, {'servedDifferentFiles': wrong}
            break
        except (AssertionError, OSError) as err:
            print('Provjera objavljenih dokumenata', str(err), flush=True)
            if time.monotonic() >= deadline:
                raise
            time.sleep(4)
    report = dict(mode=MODE, commit=COMMIT, documents=responses)
    (Path(os.environ['QA_EVIDENCE']) / 'izdanje.json').write_text(json.dumps(report, indent=2))
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        print('EXPECTED_SHA256=' + expected[APPS[-1] + '/index.html'], file=env)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    {'configure': configure, 'verify': verify}[sys.argv[1]]()
