import os
import traceback
from urllib.parse import urljoin, urlsplit

from browser import PORTAL, record


MATH = 'matematicka-pustolovina'
THINK = 'mislim-i-otkrivam'
IT = 'informaticka-pustolovina'
NATURE = 'istrazivaci-naseg-svijeta'
NAMES = {
    MATH: 'Matematička pustolovina', THINK: 'Mislim i otkrivam',
    IT: 'Informatička pustolovina', NATURE: 'Istraživači našeg svijeta',
}
SUBJECTS = {MATH: 'Matematika', THINK: 'Razmišljanje', IT: 'Informatika', NATURE: 'Priroda i društvo'}


def path_app(url):
    page = urlsplit(url)
    base = urlsplit(PORTAL)
    if page.netloc != base.netloc or page.scheme != base.scheme or not page.path.startswith(base.path):
        return None
    path = page.path.removeprefix(base.path).removesuffix('index.html').strip('/')
    return path if path in NAMES or not path else None


class Navigation:
    def __init__(self, browser, width, screenshot):
        self.b = browser
        self.width = width
        self.take_screenshot = screenshot
        self.touch = width < 500
        self.input = 'touch' if self.touch else 'mouse'
        self.nav_input = 'touch' if self.touch else 'keyboard'
        self.window = self.b.driver.current_window_handle
        self.evidence = {'mode': os.environ['QA_MODE'], 'commit': os.environ['QA_COMMIT'],
                         'chrome': self.b.driver.capabilities['browserVersion'],
                         'viewport': self.b.js('return [innerWidth,innerHeight]'),
                         'touchPoints': self.b.js('return navigator.maxTouchPoints'),
                         'returns': [], 'exercises': {}, 'failures': {}}
        assert self.evidence['viewport'][0] == width
        assert (self.evidence['touchPoints'] > 0) == self.touch

    def shot(self, name, full=False):
        self.b.js('return document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))')
        self.take_screenshot(self.b, name, full=full)

    def click(self, target):
        self.b.press(target, self.input)

    def document(self, expected):
        self.b.wait(lambda: path_app(self.b.driver.current_url) == expected, expected or 'portal')
        self.b.element('main h1')
        assert self.b.driver.window_handles == [self.window]
        assert self.b.driver.current_window_handle == self.window

    def no_overflow(self):
        size = self.b.js('return [document.documentElement.clientWidth,document.documentElement.scrollWidth]')
        assert size[0] == self.width and size[1] <= size[0] + 1, (self.b.driver.current_url, size)

    def card_links(self):
        self.document('')
        links = {}
        for anchor in self.b.all('main a[href]'):
            key = path_app(anchor.get_property('href'))
            if key not in NAMES:
                continue
            assert key not in links, f'Duplicate link: {key}'
            self.check_anchor(anchor)
            assert anchor.is_displayed() and NAMES[key].casefold() in anchor.accessible_name.casefold(), (
                key, anchor.text, anchor.accessible_name)
            assert SUBJECTS[key] in anchor.text, (key, anchor.text)
            links[key] = anchor
        assert links.keys() == NAMES.keys(), list(links)
        return links

    def check_anchor(self, el):
        href = el.get_dom_attribute('href')
        assert href and not href.startswith(('/', '#')) and not urlsplit(href).scheme, href
        assert el.get_dom_attribute('target') in (None, '', '_self'), el.get_dom_attribute('target')
        assert el.aria_role == 'link' and el.accessible_name, el.get_attribute('outerHTML')
        size = self.b.js('const r=arguments[0].getBoundingClientRect();return [r.width,r.height]', el)
        assert min(size) >= 44, (el.text, size)

    def keyboard_focus(self, anchor):
        before = self.b.js('return getComputedStyle(arguments[0]).boxShadow', anchor)
        self.b.focus_by_tab(anchor)
        ring = self.b.js('''
            const e=arguments[0],s=getComputedStyle(e);
            return {focused:document.activeElement===e && e.matches(':focus-visible'),
                    style:s.outlineStyle,width:parseFloat(s.outlineWidth),color:s.outlineColor,shadow:s.boxShadow};
        ''', anchor)
        assert ring['focused'] and (
            (ring['width'] >= 2 and ring['style'] != 'none' and ring['color'] != 'rgba(0, 0, 0, 0)')
            or (ring['shadow'] != 'none' and ring['shadow'] != before)), (anchor.text, ring)
        return ring

    def hub(self):
        self.b.driver.get(PORTAL)
        links = self.card_links()
        self.no_overflow()
        images = self.b.js('return [...document.querySelectorAll("main a[href] img")].map(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight}))')
        assert len(images) == 4 and all(i['width'] and i['height'] for i in images), images
        self.evidence['illustrations'] = images
        self.shot('izbornik-poslije-cijela-stranica', full=True)
        self.shot('izbornik-poslije-prvi-zaslon')
        self.evidence['cards'] = {}
        rectangles = []
        for key, card in links.items():
            r = self.b.js('return arguments[0].getBoundingClientRect().toJSON()', card)
            assert r['left'] >= 0 and r['right'] <= self.width + 1, (key, r)
            for other in rectangles:
                assert min(r['right'], other['right']) <= max(r['left'], other['left']) + 1 or (
                    min(r['bottom'], other['bottom']) <= max(r['top'], other['top']) + 1), (r, other)
            rectangles.append(r)
            self.evidence['cards'][key] = {'name': card.accessible_name, 'href': card.get_dom_attribute('href'),
                                          'size': [r['width'], r['height']]}
        if not self.touch:
            for key, card in links.items():
                self.evidence['cards'][key]['focus'] = self.keyboard_focus(card)
                if key == MATH:
                    self.shot('izbornik-fokus-tipkovnice')
        print('Izbornik', self.width, list(self.evidence['cards']), flush=True)

    def choose(self, app):
        card = self.card_links()[app]
        if not self.touch:
            self.keyboard_focus(card)
        self.b.press(card, self.nav_input)
        self.document(app)

    def return_link(self):
        # Native modal dialogs make background controls inert even when Selenium reports them displayed.
        modal = self.b.all('dialog[open]')
        scope = 'dialog[open] ' if modal else ''
        links = [a for a in self.b.all(scope + 'a[href]') if a.is_displayed() and a.text.strip() == 'Sve aplikacije']
        assert len(links) == 1, (self.b.driver.current_url, [a.text for a in self.b.all('a[href]')])
        anchor = links[0]
        self.check_anchor(anchor)
        assert anchor.accessible_name.strip() == 'Sve aplikacije', anchor.accessible_name
        assert path_app(anchor.get_property('href')) == '', anchor.get_property('href')
        # Also resolve from an installation under a directory instead of the origin root.
        path = urlsplit(self.b.driver.current_url).path
        mounted = urljoin('https://example.invalid/skola' + path, anchor.get_dom_attribute('href'))
        assert urlsplit(mounted).path in ('/skola/', '/skola/index.html'), mounted
        return anchor, bool(modal)

    def hit_check(self, anchor, modal):
        geometry = self.b.js('''
            const el=arguments[0],r=el.getBoundingClientRect(), container=el.closest('dialog,header,[role=banner],nav');
            const points=[[.2,.25],[.8,.25],[.5,.5],[.2,.75],[.8,.75]];
            const hit=points.every(([x,y])=>el.contains(document.elementFromPoint(r.left+r.width*x,r.top+r.height*y)));
            const bad=[];
            if(container)for(const item of container.querySelectorAll('a[href],button,strong,h1,h2,[class*=badge],[class*=brand]')){
                if(el===item || el.contains(item) || item.contains(el) || !item.checkVisibility())continue;
                const t=item.getBoundingClientRect();
                if(Math.min(t.right,r.right)>Math.max(t.left,r.left)+1 && Math.min(t.bottom,r.bottom)>Math.max(t.top,r.top)+1)
                    bad.push(item.innerText.trim().slice(0,80));
            }
            return {area:r.toJSON(),inside:r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1,
                    header:!!container,hit,overlaps:bad};
        ''', anchor)
        assert geometry['header'] and geometry['inside'] and geometry['hit'] and not geometry['overlaps'], (
            self.b.driver.current_url, modal, geometry)
        return geometry['area']

    def leave(self, app, stage, mode=None, picture=False):
        self.document(app)
        self.no_overflow()
        anchor, modal = self.return_link()
        if not modal:
            self.b.js("window.scrollTo({top:0,behavior:'instant'})")
        top = self.hit_check(anchor, modal)
        entry = {'app': app, 'stage': stage, 'from': self.b.driver.current_url,
                 'rawHref': anchor.get_dom_attribute('href'), 'linkBoundsAtTop': top}
        if picture:
            self.shot(app + '-' + stage)
        if not modal:
            self.b.js("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})")
            entry['scrollY'] = self.b.js('return window.scrollY')
            entry['linkBoundsWhenScrolled'] = self.hit_check(anchor, modal)
        action = mode or self.nav_input
        if action == 'keyboard':
            entry['focus'] = self.keyboard_focus(anchor)
        self.b.press(anchor, action)
        self.b.wait(lambda: path_app(self.b.driver.current_url) == '', 'Sve aplikacije')
        self.card_links()
        assert not urlsplit(self.b.driver.current_url).fragment
        entry['to'] = self.b.driver.current_url
        entry['activation'] = action
        self.evidence['returns'].append(entry)
        print('Povratak', app, stage, action, entry['to'], flush=True)

    def different_then_back(self, app, stage):
        names = list(NAMES)
        other = names[(names.index(app) + 1) % len(names)]
        self.choose(other)
        self.leave(other, stage + '-drugi-predmet', self.input)
        self.choose(app)

    def homes(self, app):
        for suffix, stage in [('/', 'izravna-mapa'), ('/index.html', 'izravna-datoteka')]:
            self.b.driver.get(PORTAL + app + suffix)
            self.leave(app, stage, self.input if suffix == '/' else self.nav_input)
            other = list(NAMES)[(list(NAMES).index(app) + 1) % len(NAMES)]
            self.choose(other)


def verify_navigation(browser, width, screenshot):
    from rounds import check_math, check_think, check_it, check_nature
    qa = Navigation(browser, width, screenshot)
    scenarios = [('izbornik', qa.hub)]
    scenarios += [('pocetne-' + name, lambda name=name: qa.homes(name)) for name in NAMES]
    scenarios += [(name, lambda run=run: run(qa)) for name, run in
                  ((MATH, check_math), (THINK, check_think), (IT, check_it), (NATURE, check_nature))]
    for name, check in scenarios:
        try:
            check()
        except Exception:
            print(traceback.format_exc(), flush=True)
            qa.evidence['failures'][name] = traceback.format_exc()
            try:
                qa.shot('greska-' + name)
            except Exception:
                pass
        finally:
            record('provjera.json', qa.evidence)
    assert not qa.evidence['failures'], list(qa.evidence['failures'])
