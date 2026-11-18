import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

TARGET = pathlib.Path(__file__).with_name('target.json')
APP = 'istrazivaci-naseg-svijeta/index.html'
APPS = {APP, 'matematicka-pustolovina/index.html', 'mislim-i-otkrivam/index.html',
        'informaticka-pustolovina/index.html'}
PUBLIC = 'https://aplikacije-za-ucenje.onrender.com/'
LOCAL = 'http://127.0.0.1:4173/'


def configure():
    if os.environ.get('QA_INPUT_MODE'):
        target = {'mode': os.environ['QA_INPUT_MODE'], 'commit': os.environ['QA_INPUT_COMMIT'],
                  'sha256': os.environ['QA_INPUT_SHA256']}
    else:
        target = json.loads(TARGET.read_text())
    assert target['mode'] in ['candidate', 'public']
    assert re.fullmatch('[0-9a-f]{40}', target['commit']), 'Supply an immutable candidate commit SHA'
    assert re.fullmatch('[0-9a-f]{64}', target['sha256']), 'Supply the expected HTML SHA-256'
    evidence = pathlib.Path(os.environ['RUNNER_TEMP']) / 'ishod'
    evidence.mkdir(exist_ok=True)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
        for k, value in target.items():
            if k in ['mode', 'commit', 'sha256']:
                print(f'{k}={value}', file=stream)
    with open(os.environ['GITHUB_ENV'], 'a') as stream:
        print('QA_MODE=' + target['mode'], file=stream)
        print('QA_COMMIT=' + target['commit'], file=stream)
        print('EXPECTED_SHA256=' + target['sha256'], file=stream)
        print('QA_PORTAL=' + (PUBLIC if target['mode'] == 'public' else LOCAL), file=stream)
        print('QA_EVIDENCE=' + str(evidence), file=stream)
    print(json.dumps(target))


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = set()

    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get('href')
        if tag == 'a' and href:
            self.urls.add(href)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def download(url):
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'QA-Istrazivaci/1'})
    with urllib.request.urlopen(request, timeout=15) as response:
        assert response.status == 200 and response.headers.get_content_type() == 'text/html', url
        return response.read()


def verify():
    expected = os.environ['EXPECTED_SHA256']
    candidate = pathlib.Path('candidate')
    for path in ['javne-aplikacije/' + APP, 'istrazivaci-naseg-svijeta/dist/index.html',
                 'page-apps/istrazivaci-naseg-svijeta.html']:
        actual = digest((candidate / path).read_bytes())
        assert actual == expected, (path, actual, expected)
    portal = os.environ['QA_PORTAL']
    deadline = time.monotonic() + (420 if os.environ['QA_MODE'] == 'public' else 25)
    while True:
        try:
            html = download(portal + APP + '?qa=' + str(time.time_ns()))
            if digest(html) == expected:
                break
            print('Čekam SHA-256', expected, 'trenutačno', digest(html), flush=True)
        except (OSError, urllib.error.URLError) as error:
            print('Čekam', portal, error, flush=True)
        if time.monotonic() >= deadline:
            raise AssertionError('Poslužena verzija ne odgovara izabranom kandidatu.')
        time.sleep(4)
    parser = Links()
    portal_html = download(portal)
    parser.feed(portal_html.decode())
    same_site = {urllib.parse.urljoin(portal, path) for path in parser.urls}
    assert {portal + path for path in APPS} <= same_site, same_site
    responses = {portal: {'status': 200, 'bytes': len(portal_html)}}
    for relative in sorted(APPS):
        body = download(portal + relative)
        sha = digest(body)
        assert body and (relative != APP or sha == expected), (relative, sha)
        responses[relative] = {'status': 200, 'bytes': len(body), 'sha256': sha}
    record = {'mode': os.environ['QA_MODE'], 'commit': os.environ['QA_COMMIT'],
              'expectedSha256': expected, 'responses': responses}
    (pathlib.Path(os.environ['QA_EVIDENCE']) / 'izdanje.json').write_text(json.dumps(record, indent=2))
    print('Identičan HTML i svih pet adresa:', json.dumps(record, ensure_ascii=False))


if __name__ == '__main__':
    {'configure': configure, 'verify': verify}[sys.argv[1]]()
