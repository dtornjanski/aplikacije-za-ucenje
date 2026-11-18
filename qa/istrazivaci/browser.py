import base64
import colorsys
import hashlib
import json
import os
import pathlib
import re
import shutil
from urllib.parse import urlsplit

from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

PORTAL = os.environ['QA_PORTAL'].rstrip('/') + '/'
APP = PORTAL + 'istrazivaci-naseg-svijeta/index.html'
EXPECTED = os.environ['EXPECTED_SHA256']
ARTIFACTS = pathlib.Path(os.environ['QA_EVIDENCE'])
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def record(filename, data):
    (ARTIFACTS / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2))


class Browser:
    def __init__(self, profile, mobile=False, headless=False):
        options = webdriver.ChromeOptions()
        options.binary_location = os.environ.get('CHROME_BINARY') or shutil.which('google-chrome')
        for argument in ['--user-data-dir=' + str(profile), '--force-renderer-accessibility=complete',
                         '--disable-dev-shm-usage', '--no-first-run', '--lang=hr', '--window-size=1280,820']:
            options.add_argument(argument)
        if headless:
            options.add_argument('--headless=new')
        if mobile:
            options.add_experimental_option('mobileEmulation', {'deviceMetrics': {
                'width': 360, 'height': 740, 'pixelRatio': 1, 'touch': True, 'mobile': True}})
        options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
        self.driver = webdriver.Chrome(service=Service(shutil.which('chromedriver')), options=options)
        self.driver.set_page_load_timeout(35)
        self.driver.execute_cdp_cmd('Network.enable', {})
        self.driver.execute_cdp_cmd('Network.setCacheDisabled', {'cacheDisabled': True})

    def quit(self):
        self.driver.quit()

    def js(self, script, *arguments):
        return self.driver.execute_script(script, *arguments)

    def wait(self, condition, message=''):
        return WebDriverWait(self.driver, 10, poll_frequency=.08).until(lambda _: condition(), message)

    def element(self, selector):
        return self.wait(lambda: self.driver.find_element(By.CSS_SELECTOR, selector), selector)

    def all(self, selector):
        return self.driver.find_elements(By.CSS_SELECTOR, selector)

    def home(self):
        self.driver.get(APP)
        self.driver.execute_cdp_cmd('Page.bringToFront', {})
        self.element('[data-level]')
        # Hash the document loaded in this tab, including direct navigation after Chrome relaunch.
        events = [json.loads(e['message'])['message'] for e in self.driver.get_log('performance')]
        documents = [e['params'] for e in events if e['method'] == 'Network.responseReceived'
                     and e['params']['type'] == 'Document' and e['params']['response']['url'] == APP]
        assert documents, 'Chrome did not report an HTTP response for the exercise document'
        response = documents[-1]
        assert response['response']['status'] == 200, response['response']
        body = self.driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': response['requestId']})
        raw = base64.b64decode(body['body']) if body['base64Encoded'] else body['body'].encode()
        digest = hashlib.sha256(raw).hexdigest()
        assert digest == EXPECTED, (APP, digest, EXPECTED)
        return digest

    def fresh_home(self):
        origin = urlsplit(APP)
        self.driver.execute_cdp_cmd('Storage.clearDataForOrigin', {
            'origin': f'{origin.scheme}://{origin.netloc}', 'storageTypes': 'local_storage'})
        self.driver.get('about:blank')
        return self.home()

    def screenshot(self, name):
        assert self.driver.save_screenshot(str(ARTIFACTS / (name + '.png')))

    def viewport(self, width, height, mobile=True):
        self.driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {
            'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': mobile})
        self.driver.execute_cdp_cmd('Emulation.setTouchEmulationEnabled', {
            'enabled': mobile, 'maxTouchPoints': 1})
        self.wait(lambda: self.js('return [innerWidth,innerHeight]') == [width, height])

    def focus_by_tab(self, element):
        # Follow the tab order from the real active control, including reverse navigation.
        for _ in range(90):
            if self.js('return document.activeElement===arguments[0]', element):
                return
            backward = self.js('return !!(document.activeElement.compareDocumentPosition(arguments[0]) & Node.DOCUMENT_POSITION_PRECEDING)', element)
            keys = ActionChains(self.driver)
            if backward:
                keys.key_down(Keys.SHIFT)
            keys.send_keys(Keys.TAB)
            if backward:
                keys.key_up(Keys.SHIFT)
            keys.perform()
        raise AssertionError('Keyboard cannot reach ' + element.get_attribute('outerHTML')[:180])

    def tap(self, element):
        self.js("arguments[0].scrollIntoView({block:'center',behavior:'instant'})", element)
        point = self.js('const r=arguments[0].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}', element)
        self.driver.execute_cdp_cmd('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point]})
        self.driver.execute_cdp_cmd('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

    def press(self, target, mode='mouse'):
        element = self.element(target) if isinstance(target, str) else target
        assert element.is_displayed() and element.is_enabled(), element.get_attribute('outerHTML')
        if mode == 'touch':
            self.tap(element)
        elif mode == 'keyboard':
            self.focus_by_tab(element)
            element.send_keys(Keys.ENTER)
        else:
            element.click()

    def next_seed(self, seed):
        # Fix only the public round's next entropy draw. The app still builds, stores and restores it.
        self.js("""
        const original=crypto.getRandomValues, seed=arguments[0];
        crypto.getRandomValues=function(array){
          if(array instanceof Uint32Array && array.length===1){
            crypto.getRandomValues=original; array[0]=seed; return array;
          }
          return original.call(this,array);
        };""", seed)

    def state(self, scope):
        state = self.js("""
            const value=localStorage.getItem('world-explorers-v2/run/'+arguments[0]);
            return value && JSON.parse(value).state;""", scope)
        assert state, scope
        return state

    def open_lesson(self, level, world, lesson, seed, mode='mouse'):
        self.press(f'[data-level="{level}"]', mode)
        self.press(f'[data-lessons="{world}"]', mode)
        self.next_seed(seed)
        self.press(f'[data-lesson="{lesson}"]', mode)
        self.element('.progress-text')
        assert self.state(f'{level}/{world}/{lesson}/vjezba')['seed'] == seed


def colors(browser, selector):
    return browser.js("""
        const element=document.querySelector(arguments[0]), s=getComputedStyle(element);
        let node=element, background;
        while(node) {
          background=getComputedStyle(node).backgroundColor;
          if(background!=='rgba(0, 0, 0, 0)' && background!=='transparent') break;
          node=node.parentElement;
        }
        return {ink:s.color, background:background||'rgb(255, 255, 255)', border:s.borderTopColor};
    """, selector)


def rgb(color):
    return [int(n) / 255 for n in re.findall(r'\d+', color)[:3]]


def hue(color):
    h, _, saturation = colorsys.rgb_to_hls(*rgb(color))
    assert saturation > .15, color
    return round(360 * h, 1)


def contrast(palette):
    def luminance(color):
        channels = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb(color)]
        return sum(v * weight for v, weight in zip(channels, [.2126, .7152, .0722]))
    low, high = sorted([luminance(palette['ink']), luminance(palette['background'])])
    return (high + .05) / (low + .05)


def norm(text):
    return ' '.join(text.split())
