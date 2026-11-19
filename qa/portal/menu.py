import base64
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'istrazivaci'))
from browser import Browser, ARTIFACTS, PORTAL, record


def screenshot(browser, name, full=False):
    if full:
        extent = browser.driver.execute_cdp_cmd('Page.getLayoutMetrics', {})['cssContentSize']
        image = browser.driver.execute_cdp_cmd('Page.captureScreenshot', {
            'format': 'png', 'captureBeyondViewport': True,
            'clip': {'x': 0, 'y': 0, 'width': extent['width'], 'height': extent['height'], 'scale': 1}})
        (ARTIFACTS / (name + '.png')).write_bytes(base64.b64decode(image['data']))
    else:
        browser.screenshot(name)


def baseline(browser, width):
    browser.driver.get(PORTAL)
    heading = browser.element('main h1').text
    links = [link.accessible_name for link in browser.all('main a[href]')]
    assert heading and len(links) == 4, (heading, links)
    screenshot(browser, 'izbornik-prije-cijela-stranica', full=True)
    screenshot(browser, 'izbornik-prije-prvi-zaslon')
    record('prije.json', {'width': width, 'title': heading, 'links': links, 'url': browser.driver.current_url,
                          'browser': browser.driver.capabilities['browserVersion']})
    print('Snimljen postojeći javni izbornik', width, heading, links)


def main():
    width = int(os.environ['WIDTH'])
    with tempfile.TemporaryDirectory() as profile:
        browser = Browser(profile, mobile=width < 500, headless=True)
        try:
            browser.viewport(width, 840 if width >= 500 else 740, mobile=width < 500)
            if os.environ['QA_MODE'] == 'baseline':
                baseline(browser, width)
            else:
                from navigation import verify_navigation
                verify_navigation(browser, width, screenshot)
        finally:
            browser.quit()


if __name__ == '__main__':
    main()
