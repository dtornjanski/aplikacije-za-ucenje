import itertools
import tempfile

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from browser import APP, EXPECTED, PORTAL, Browser, colors, contrast, norm, record

UNIT = '[data-unit="str-58"]'
BOOK = 'hard/health/str-58/vjezba'
ROUTE = 'hard/spacetime/skica/vjezba'
DIRECTIONS = {'gore': (0, -1), 'desno': (1, 0), 'dolje': (0, 1), 'lijevo': (-1, 0)}
report = {'url': APP, 'sha256': EXPECTED, 'body': [], 'routes': [], 'history': {}}


def chapter(browser):
    return next(group for group in browser.all('.book-group') if group.find_elements(By.CSS_SELECTOR, UNIT))


def open_unit(browser, seed, mode):
    browser.press('[data-action="book"]', mode)
    Select(browser.element('#book-level')).select_by_value('hard')
    browser.press(chapter(browser).find_element(By.TAG_NAME, 'summary'), mode)
    browser.next_seed(seed)
    browser.press(UNIT, mode)
    browser.element('.prompt')
    assert browser.state(BOOK)['seed'] == seed


def book_context(browser):
    return browser.js("""
    return {y:scrollY,open:[...document.querySelectorAll('.book-group[open]>summary')].map(e=>e.innerText),
      level:document.querySelector('#book-level').value,focus:document.activeElement.dataset.unit};
    """)


def catalogue(browser):
    browser.element('.book-group')
    assert len(browser.all('[data-unit]')) == 41 and len(browser.all('.book-group')) > 1


def assert_book_return(browser, before, label):
    catalogue(browser)
    browser.wait(lambda: browser.js('return document.activeElement.dataset.unit') == 'str-58')
    after = book_context(browser)
    assert after['open'] == before['open'] and after['level'] == before['level'] == 'hard', after
    assert abs(after['y'] - before['y']) <= 2, (before, after)
    report['history'][label] = after
    browser.screenshot(label)


def navigation(browser):
    browser.viewport(1100, 650, False)
    browser.driver.get(PORTAL)
    browser.press('a[href*="istrazivaci-naseg-svijeta"]')
    browser.element('[data-level]')
    browser.driver.back()
    browser.wait(lambda: browser.driver.current_url.rstrip('/') == PORTAL.rstrip('/'))
    assert 'Aplikacije za učenje' in browser.element('h1').text
    browser.driver.forward()
    browser.element('[data-level]')
    browser.press('[data-action="book"]')
    catalogue(browser)
    Select(browser.element('#book-level')).select_by_value('hard')
    for group in (browser.all('.book-group')[0], chapter(browser)):
        browser.press(group.find_element(By.TAG_NAME, 'summary'))
    unit = browser.element(UNIT)
    browser.js("arguments[0].scrollIntoView({block:'center',behavior:'instant'});arguments[0].focus({preventScroll:true})", unit)
    before = book_context(browser)
    assert 'Tijelo i zdravlje' in before['open'] and len(before['open']) == 2 and before['y'] > 0, before
    report['history']['before'] = before
    browser.next_seed(7)
    browser.press(unit)
    browser.element('.prompt')
    start = browser.state(BOOK)
    assert start['seed'] == 7
    q = browser.js('const s=arguments[0];return WorldPractice.buildRound(s.level,s.world,s.seed,s.plan)[s.index]', start)
    wrong = next(e for e in browser.all('[data-choice]') if e.get_attribute('data-value') != q['answer'])
    value = wrong.get_attribute('data-value')
    length = browser.js('return history.length')
    browser.press(wrong)
    browser.press('#check-button')
    assert 'Još nije točno' in browser.element('.inline-feedback').text
    assert browser.js('return history.length') == length
    saved = browser.state(BOOK)
    assert saved['phase'] == 'incorrect' and saved['attempts'][0] == 1
    prompt = browser.element('.prompt').text

    def assert_restored():
        browser.element('.inline-feedback')
        assert browser.element('.prompt').text == prompt
        assert browser.element('[data-choice][aria-pressed="true"]').get_attribute('data-value') == value
        state = browser.state(BOOK)
        for field in ['seed', 'index', 'plan', 'attempts', 'responses', 'phase', 'draft']:
            assert state[field] == saved[field], field

    browser.press('[data-action="book"]')
    assert_book_return(browser, before, 'gradivo-gumb')
    browser.driver.forward()
    assert_restored()
    browser.driver.refresh()
    assert_restored()
    browser.driver.back()
    assert_book_return(browser, before, 'gradivo-natrag')
    browser.driver.forward()
    assert_restored()
    report['history'].update({'portalBackForward': True, 'reloadedExercise': True,
                              'unchangedHistoryOnAnswer': length, 'persistedAttempts': saved['attempts']})
    browser.driver.get('about:blank')
    browser.driver.get(APP + '#gradivo')
    catalogue(browser)
    browser.driver.refresh()
    catalogue(browser)
    browser.driver.get('about:blank')
    browser.home()
    browser.js("window.qaSameDocument=true;location.hash='gradivo'")
    catalogue(browser)
    assert browser.js('return window.qaSameDocument')
    browser.driver.back()
    browser.element('[data-level]')
    browser.driver.forward()
    catalogue(browser)
    assert browser.js('return window.qaSameDocument')
    report['history'].update({'directFragment': True, 'sameTabFragment': True, 'fragmentBackForward': True})


def grid(browser):
    labels = [e.find_element(By.TAG_NAME, 'small').text for e in browser.all('.route-map td')]
    assert len(labels) == 9
    return labels.index('Škola'), labels.index('Park'), tuple(i for i, label in enumerate(labels) if label == 'Radovi')


def follow(layout, moves):
    start, _, blocked = layout
    at = start
    for move in moves:
        dx, dy = DIRECTIONS[move]
        x, y = at % 3 + dx, at // 3 + dy
        if not 0 <= x < 3 or not 0 <= y < 3 or y * 3 + x in blocked:
            return None
        at = y * 3 + x
    return at


def paths(layout):
    return [p for p in itertools.product(DIRECTIONS, repeat=3) if follow(layout, p) == layout[1]]


def position(browser):
    return browser.js("""
      const cells=[...document.querySelectorAll('.route-map td')];
      const markers=cells.filter(e=>e.matches('.map-current'));
      return markers.length===1 ? cells.indexOf(markers[0]) : -1;
    """)


def move(browser, direction):
    browser.press(f'[data-route][data-value="{direction}"]', 'touch')


def count(browser, n):
    assert f'{n} od 3' in norm(browser.element('.route-count').text)
    assert len(browser.all('.route-steps li')) == n


def undo(browser):
    browser.press('[data-action="undo-route"]', 'touch')


def check_position(browser, at, n, invalid):
    count(browser, n)
    assert position(browser) == at, (at, position(browser))
    if invalid:
        assert norm(browser.element('.route-note').text) == 'Potez je upisan. Položaj se nije promijenio.'
    else:
        assert not browser.all('.route-note')


def routes(browser):
    browser.viewport(360, 740)
    browser.fresh_home()
    browser.open_lesson('hard', 'spacetime', 'skica', 2, 'touch')
    layout = grid(browser)
    start, end, blocked = layout
    canonical = browser.js("""
      const s=arguments[0];return WorldPractice.buildRound(s.level,s.world,s.seed,s.plan)[0].answer;""", browser.state(ROUTE))
    assert start < 3 and follow(layout, ['gore']) is None
    valid = paths(layout)
    alternate = next(p for p in valid if list(p) != canonical)
    check_position(browser, start, 0, False)
    assert not browser.element('[data-action="undo-route"]').is_enabled()
    move(browser, 'gore')
    check_position(browser, start, 1, True)
    assert not browser.element('#check-button').is_enabled()
    browser.screenshot('skica-gore')
    undo(browser)
    check_position(browser, start, 0, False)
    # This fixture has a building site adjacent to the school.
    rock = next(move for move, (dx, dy) in DIRECTIONS.items()
                if (start % 3 + dx, start // 3 + dy) in [(b % 3, b // 3) for b in blocked])
    move(browser, rock)
    check_position(browser, start, 1, True)
    undo(browser)
    move(browser, alternate[0])
    at = follow(layout, alternate[:1])
    outward = next(direction for direction in DIRECTIONS if follow(layout, [alternate[0], direction]) is None)
    move(browser, outward)
    check_position(browser, at, 2, True)
    browser.driver.refresh()
    check_position(browser, at, 2, True)
    browser.screenshot('skica-povratak-izmedu-koraka')
    move(browser, alternate[-1])
    after_invalid = follow(layout, [alternate[0], alternate[-1]])
    assert after_invalid is not None and after_invalid != at and position(browser) == after_invalid
    count(browser, 3)
    browser.press('#check-button', 'touch')
    assert 'Još nije točno' in browser.element('.inline-feedback').text
    for _ in range(3):
        undo(browser)
    check_position(browser, start, 0, False)
    for direction in alternate:
        move(browser, direction)
    check_position(browser, end, 3, False)
    browser.screenshot('skica-drugi-put')
    browser.press('#check-button', 'touch')
    assert browser.element('h1').text == 'Točno!'
    report['routes'].append({'map': layout, 'canonical': canonical, 'alternate': alternate,
                             'outward': 'gore', 'blockedStep': rock, 'midRouteRetained': at,
                             'nextLegalMoveReached': after_invalid})
    seen = {layout}
    for _ in range(4):
        browser.press('[data-action="next"]', 'touch')
        next_grid = grid(browser)
        assert next_grid not in seen, next_grid
        seen.add(next_grid)
        chosen = paths(next_grid)[0]
        for direction in chosen:
            move(browser, direction)
        browser.press('#check-button', 'touch')
        assert browser.element('h1').text == 'Točno!'
        report['routes'].append({'map': next_grid, 'completed': chosen})
    browser.press('[data-action="next"]', 'touch')
    assert [e.text for e in browser.all('.stat strong')] == ['4', '1']
    browser.next_seed(87)
    browser.press('[data-action="review"]', 'touch')
    assert '1 od 1' in browser.element('.progress-text').text
    repeat = grid(browser)
    assert repeat != layout and follow(repeat, alternate) != repeat[1]
    report['routeReview'] = {'map': repeat, 'originalMoves': alternate, 'newPath': paths(repeat)[0]}


def geometry(browser):
    return browser.js("""
      const rect=e=>{
        const b=e.getBoundingClientRect();
        return {top:b.top,bottom:b.bottom,width:b.width,height:b.height,text:e.innerText,
          font:parseFloat(getComputedStyle(e).fontSize),fits:e.scrollHeight<=e.clientHeight+1 && e.scrollWidth<=e.clientWidth+1};
      };
      return {viewport:[innerWidth,innerHeight],width:document.documentElement.scrollWidth,
        scrollY, prompt:rect(document.querySelector('.prompt')),
        choices:[...document.querySelectorAll('[data-choice]')].map(rect),
        controls:[...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length).map(rect)};
    """)


def fits(data, width, height):
    assert data['viewport'] == [width, height] and data['width'] <= width, data
    for item in [data['prompt'], *data['controls']]:
        assert item['fits'], item
    for control in data['controls']:
        assert control['width'] >= 44 and control['height'] >= 44, control


def mobile_body(browser):
    browser.viewport(360, 740)
    # These six fresh seeds cover both body families and different options on pp. 58–59.
    # Classify by the saved family, so another two-claim task never stands in for body content.
    for seed in [1, 3, 7, 8, 10, 13]:
        browser.fresh_home()
        open_unit(browser, seed, 'touch')
        family = browser.state(BOOK)['plan'][0]['key']
        assert family in ['tijelo', 'zglobovi'] and not browser.all('.evidence-clue'), (seed, family)
        browser.wait(lambda: browser.js('return scrollY') == 0)
        data = geometry(browser)
        data['contrast'] = {s: round(contrast(colors(browser, s)), 2) for s in ['.prompt', '[data-choice]']}
        assert min(data['contrast'].values()) >= 4.5, data
        report['body'].append({'seed': seed, 'family': family, **data})
        fits(data, 360, 740)
        assert 0 <= data['prompt']['top'] < data['prompt']['bottom'] <= 740
        assert len(data['choices']) >= 2 and all(0 <= c['top'] < c['bottom'] <= 740 for c in data['choices'][:2]), data
        browser.screenshot('tijelo-360-' + str(seed))
    assert {entry['family'] for entry in report['body']} == {'tijelo', 'zglobovi'}
    assert len({entry['prompt']['text'] for entry in report['body']}) >= 4
    browser.viewport(320, 568)
    narrow = report['narrow'] = geometry(browser)
    fits(narrow, 320, 568)
    assert narrow['prompt']['font'] >= 16 and all(c['font'] >= 16 for c in narrow['choices'])
    browser.screenshot('tijelo-320')
    # Double actual computed font sizes, including controls declared in fixed CSS pixels.
    # This user-style stress test scales text only. Physical phone text settings are separate.
    browser.js("""
       const sizes=[...document.querySelectorAll('body,body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
       for(const [e,size] of sizes)e.style.setProperty('font-size',String(size*2)+'px','important');
    """)
    enlarged = report['text200Percent'] = geometry(browser)
    fits(enlarged, 320, 568)
    assert enlarged['prompt']['font'] >= 2 * narrow['prompt']['font'] - .1
    assert enlarged['choices'][0]['font'] >= 2 * narrow['choices'][0]['font'] - .1
    browser.screenshot('tijelo-320-povecani-tekst')
    browser.press(browser.all('[data-choice]')[0], 'touch')
    assert browser.element('#check-button').is_enabled()
    browser.fresh_home()
    browser.driver.execute_cdp_cmd('Emulation.setEmulatedMedia', {
        'features': [{'name': 'prefers-reduced-motion', 'value': 'reduce'}]})
    motion = browser.js("""
      const s=getComputedStyle(document.querySelector('.hero-lumi'));
      return {requested:matchMedia('(prefers-reduced-motion: reduce)').matches,name:s.animationName,
        seconds:parseFloat(s.animationDuration),loops:s.animationIterationCount};
    """)
    assert motion['requested'] and (motion['name'] == 'none' or
                                    motion['seconds'] <= .001 and motion['loops'] == '1'), motion
    report['reducedMotion'] = motion


if __name__ == '__main__':
    with tempfile.TemporaryDirectory() as profile:
        browser = Browser(profile, headless=True)
        try:
            report['chrome'] = browser.driver.capabilities['browserVersion']
            report['browserDocumentSha256'] = browser.home()
            for section in [navigation, routes, mobile_body]:
                section(browser)
                record('gradivo-skica-mobitel.json', report)
                print('PASS', section.__name__, flush=True)
        except BaseException:
            browser.screenshot('neuspjeh')
            print('URL', browser.driver.current_url, 'heading', [e.text for e in browser.all('h1')], flush=True)
            raise
        finally:
            record('gradivo-skica-mobitel.json', report)
            browser.quit()
