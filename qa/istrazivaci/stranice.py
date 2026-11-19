import tempfile
from urllib.parse import urlsplit

from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select

from browser import APP, EXPECTED, Browser, norm, record

BODY = 'hard/health/str-58/vjezba'
HABITS = 'hard/health/str-60/vjezba'
LINK = APP + '#vjezba/str-58/hard'
TITLE = 'Dijelovi tijela i njihove uloge · str. 58–59'
SELECTED = '[data-choice][aria-pressed="true"]'
report = {'url': APP, 'expectedSha256': EXPECTED, 'profiles': {}}


def launch(profile, mode):
    return Browser(profile, mobile=mode == 'touch', headless=True)


def catalogue(browser):
    assert browser.element('#book-page').is_displayed()
    assert browser.driver.current_url == APP + '#gradivo', browser.driver.current_url


def page_number(browser, number, mode):
    field = browser.element('#book-page')
    if mode == 'touch':
        browser.tap(field)
    else:
        browser.focus_by_tab(field)
    if field.get_property('value'):
        field.send_keys(Keys.CONTROL, 'a', Keys.NULL, Keys.BACKSPACE)
    if number:
        field.send_keys(str(number))
    assert field.get_property('value') == str(number)


def lookup_status(browser):
    status = browser.element('#page-lookup-status')
    assert status.get_attribute('role') == 'status'
    return norm(status.text)


def find_unit(browser, number, unit, mode):
    page_number(browser, number, mode)
    link = browser.element('#found-unit')
    browser.wait(lambda: link.is_displayed() and link.get_attribute('data-found-unit') == unit)
    return link


def visible(browser, selector):
    return [element for element in browser.all(selector) if element.is_displayed()]


def finder_width(browser):
    layout = browser.js("""
      const controls = {};
      for (const id of ['book-page','book-level','found-unit','share-unit']) {
        const r = document.getElementById(id).getBoundingClientRect();
        controls[id] = {left:r.left, right:r.right, width:r.width, height:r.height};
      }
      return {viewport:innerWidth, document:document.documentElement.scrollWidth, controls};
    """)
    assert layout['document'] <= layout['viewport'], layout
    for control in layout['controls'].values():
        assert 0 <= control['left'] < control['right'] <= layout['viewport'] + 1, layout
    return layout


def test_lookup(browser, mode, evidence):
    browser.driver.get(APP + '#gradivo')
    catalogue(browser)
    assert browser.element('#book-page').accessible_name
    empty = lookup_status(browser)
    initial = find_unit(browser, 59, 'str-58', mode)
    assert lookup_status(browser) == TITLE, lookup_status(browser)
    assert initial.get_attribute('href') == APP + '#vjezba/str-58/easy'
    Select(browser.element('#book-level')).select_by_value('hard')
    browser.wait(lambda: browser.element('#found-unit').get_attribute('href') == LINK)

    page_number(browser, 105, mode)
    message = lookup_status(browser)
    assert '105' in message and 'nema vježbe' in message, message
    assert not visible(browser, '#found-unit, #share-unit')
    evidence['page105'] = message
    browser.screenshot(mode + '-stranica-105')

    page_number(browser, '', mode)
    assert lookup_status(browser) == empty and not visible(browser, '#found-unit, #share-unit')
    assert len(browser.all('[data-unit]')) == 41

    link = find_unit(browser, 59, 'str-58', mode)
    assert lookup_status(browser) == TITLE
    assert link.get_attribute('href') == LINK and link.accessible_name
    assert browser.element('#share-unit').accessible_name
    evidence.update(page59=lookup_status(browser), link=LINK)
    evidence['finderLayout'] = finder_width(browser)
    browser.screenshot(mode + '-stranica-59')
    if mode == 'touch':
        browser.viewport(320, 568)
        assert lookup_status(browser) == TITLE
        evidence['finderLayout320'] = finder_width(browser)
        browser.js("document.querySelector('#page-lookup').scrollIntoView({block:'start',behavior:'instant'})")
        browser.screenshot('touch-stranica-59-na-320')
        browser.viewport(360, 740)


def clipboard(browser, operation, value=''):
    result = browser.driver.execute_async_script("""
      const [operation, value, done] = arguments;
      const promise = operation === 'write' ? navigator.clipboard.writeText(value) : navigator.clipboard.readText();
      promise.then(result => done({value:result || ''}), error => done({error:error.name}));
    """, operation, value)
    assert 'error' not in result, result
    return result['value']


def copy_link(browser, mode, marker):
    # Confirm this individual click wrote the URL even on a shared system clipboard.
    clipboard(browser, 'write', marker)
    browser.press('#share-unit', mode)
    browser.wait(lambda: clipboard(browser, 'read') == LINK)
    assert norm(browser.element('#share-feedback').text) == 'Poveznica je kopirana.'
    return clipboard(browser, 'read')


def share(browser, mode, evidence):
    site = urlsplit(APP)
    browser.driver.execute_cdp_cmd('Browser.grantPermissions', {
        'origin': f'{site.scheme}://{site.netloc}', 'permissions': ['clipboardReadWrite', 'clipboardSanitizedWrite']})
    evidence['copiedUrl'] = copy_link(browser, mode, 'prije vježbe ' + mode)

    # Exercise just the denied clipboard write. The browser still renders, focuses and selects the actual URL.
    browser.js("""
      window.qaWriteText = Clipboard.prototype.writeText;
      Clipboard.prototype.writeText = () => Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError'));
    """)
    try:
        browser.press('#share-unit', mode)
        browser.wait(lambda: bool(visible(browser, '#share-url')))
        fallback = browser.element('#share-url')
        assert fallback.get_property('readOnly') and fallback.get_property('value') == LINK
        assert fallback.accessible_name
        assert browser.js("""
          const input = arguments[0];
          return document.activeElement === input && input.selectionStart === 0 && input.selectionEnd === input.value.length;
        """, fallback)
        evidence['manualCopyUrl'] = fallback.get_property('value')
        browser.screenshot(mode + '-rucno-kopiranje')
    finally:
        browser.js('Clipboard.prototype.writeText = window.qaWriteText; delete window.qaWriteText')
    return evidence['copiedUrl']


def personal_state(browser):
    state = browser.state(BODY)
    return {key: state[key] for key in ('seed', 'index', 'plan', 'phase', 'draft', 'attempts', 'responses', 'solved')}


def hard_body(browser):
    assert browser.element('.prompt').is_displayed()
    assert browser.driver.current_url == LINK
    assert norm(browser.element('.topline .pill').text) == 'Teški zadaci'
    state = browser.state(BODY)
    assert (state['level'], state['world'], state['lesson']) == ('hard', 'health', 'str-58')
    return state


def fresh_body(browser):
    state = hard_body(browser)
    assert state['index'] == 0 and state['phase'] == 'answer' and not any(state['attempts'])
    assert not any(state['solved']) and not any(state['responses']) and state['draft'] == {'selected': ''}
    assert len(state['plan']) > 0 and len(state['attempts']) == len(state['plan'])
    assert norm(browser.element('.progress-text').text) == f"Zadatak 1 od {len(state['plan'])}"
    assert not browser.all(SELECTED) and not browser.all('.inline-feedback') and not browser.element('#check-button').is_enabled()
    return state


def wrong_answer(browser, mode):
    state = fresh_body(browser)
    correct = browser.js('const s=arguments[0];return WorldPractice.buildRound(s.level,s.world,s.seed,s.plan)[s.index].answer', state)
    choice = next(option for option in browser.all('[data-choice]') if option.get_attribute('data-value') != correct)
    browser.press(choice, mode)
    browser.press('#check-button', mode)
    assert 'Još nije točno' in browser.element('.inline-feedback').text
    saved = personal_state(browser)
    assert saved['phase'] == 'incorrect' and saved['attempts'][0] == 1 and not any(saved['attempts'][1:])
    return saved


def restored(browser, saved):
    hard_body(browser)
    assert personal_state(browser) == saved
    assert browser.element(SELECTED).get_attribute('data-value') == saved['draft']['selected']
    assert 'Još nije točno' in browser.element('.inline-feedback').text


def back_to_catalogue(browser, mode):
    browser.press('[data-action="book"]', mode)
    catalogue(browser)
    assert Select(browser.element('#book-level')).first_selected_option.get_attribute('value') == 'hard'


def home_first(browser, expected):
    primary = browser.element('.resume-list > .resume [data-run]')
    assert primary.is_displayed() and 'Nastavi' in primary.accessible_name
    actual = primary.get_attribute('data-run')
    assert actual == expected, (actual, expected)
    return actual


def start_owner(browser, mode, data):
    data['documentSha256'] = browser.home()
    assert not browser.all('[data-run]')
    data['chrome'] = browser.driver.capabilities['browserVersion']
    data['viewport'] = browser.js('return [innerWidth,innerHeight]')
    data['touchPoints'] = browser.js('return navigator.maxTouchPoints')
    assert (data['touchPoints'] > 0) == (mode == 'touch')
    if mode == 'touch':
        assert data['viewport'] == [360, 740], data['viewport']
    else:
        assert data['viewport'][0] >= 1000, data['viewport']
    test_lookup(browser, mode, data)
    link = share(browser, mode, data)
    browser.js("""
      window.qaUnitInput = [];
      for (const type of ['keydown', 'touchstart']) {
        document.addEventListener(type, event => {
          if (event.isTrusted && event.target.closest('#found-unit') && (type === 'touchstart' || event.key === 'Enter')) {
            window.qaUnitInput.push(type);
          }
        }, {capture:true, passive:true});
      }
    """)
    browser.next_seed(7)
    browser.press('#found-unit', mode)
    saved = wrong_answer(browser, mode)
    data['trustedLinkEvents'] = browser.js('return window.qaUnitInput')
    assert ('touchstart' if mode == 'touch' else 'keydown') in data['trustedLinkEvents']
    back_to_catalogue(browser, mode)
    assert browser.element('#book-page').get_property('value') == '59'
    assert browser.element('#found-unit').get_attribute('href') == link
    data['copiedAfterIncorrect'] = copy_link(browser, mode, 'nakon pogrešnog odgovora ' + mode)
    browser.driver.forward()
    restored(browser, saved)
    browser.driver.refresh()
    restored(browser, saved)
    browser.driver.back()
    catalogue(browser)

    find_unit(browser, 60, 'str-60', mode)
    browser.next_seed(2)
    browser.press('#found-unit', mode)
    browser.element('.prompt')
    assert browser.driver.current_url == APP + '#vjezba/str-60/hard'
    habits = browser.state(HABITS)
    assert habits['index'] == 0 and not any(habits['attempts']) and not any(habits['solved'])
    browser.press('.brand[data-action="home"]', mode)
    data['firstAfterOnlyOpening60'] = home_first(browser, BODY)
    browser.screenshot(mode + '-nastavi-poslije-otvaranja')
    return link, saved


def partial_habits(browser, mode):
    before = browser.state(HABITS)
    if visible(browser, '[data-choice]'):
        browser.press(browser.all('[data-choice]')[0], mode)
    elif visible(browser, '[data-sequence-item]'):
        browser.press(browser.all('[data-sequence-item]')[0], mode)
    elif visible(browser, '[data-sort-item]'):
        browser.press(browser.all('[data-sort-item]')[0], mode)
        browser.press(browser.element('[data-sort-zone]'), mode)
    else:
        browser.press(browser.element('[data-match-left]'), mode)
        browser.press(browser.element('[data-match-right]:not(:disabled)'), mode)
    after = browser.state(HABITS)
    assert before['draft'] != after['draft'] and not any(after['attempts'])
    return after['draft']


def reopened_owner(browser, mode, data, link, saved):
    data['reopenedDocumentSha256'] = browser.home()
    data['firstAfterRelaunch'] = home_first(browser, BODY)
    browser.press('.resume-list > .resume [data-run]', mode)
    restored(browser, saved)
    browser.driver.get('about:blank')
    browser.driver.get(link)
    restored(browser, saved)
    data['ownerAttemptsViaLink'] = personal_state(browser)['attempts']
    browser.screenshot(mode + '-vlastiti-nastavak-iz-poveznice')
    back_to_catalogue(browser, mode)
    find_unit(browser, 60, 'str-60', mode)
    browser.press('#found-unit', mode)
    browser.element('.prompt')
    data['partialPage60'] = partial_habits(browser, mode)
    browser.driver.get('about:blank')
    browser.driver.get(link)
    restored(browser, saved)
    browser.press('.brand[data-action="home"]', mode)
    data['firstAfterWorking60AndReopening58'] = home_first(browser, HABITS)
    browser.driver.get(link)
    restored(browser, saved)
    another = next(option for option in browser.all('[data-choice]') if option.get_attribute('data-value') != saved['draft']['selected'])
    browser.press(another, mode)
    assert browser.state(BODY)['draft'] != saved['draft']
    browser.press('.brand[data-action="home"]', mode)
    data['firstAfterEditing58Again'] = home_first(browser, BODY)


def recipient(browser, mode, data, link):
    # This is the very first navigation in a distinct empty Chrome user-data directory.
    browser.driver.get(link)
    blank = fresh_body(browser)
    data['recipientDocumentSha256'] = browser.document_digest()
    data['recipientInitialAttempts'] = blank['attempts']
    browser.screenshot(mode + '-primatelj-nova-vjezba')
    browser.press(browser.all('[data-choice]')[0], mode)
    draft = personal_state(browser)
    assert draft['draft']['selected'] and not any(draft['attempts'])
    browser.driver.refresh()
    hard_body(browser)
    assert personal_state(browser) == draft
    assert browser.element(SELECTED).get_attribute('data-value') == draft['draft']['selected']
    back_to_catalogue(browser, mode)
    browser.driver.refresh()
    catalogue(browser)

    browser.press('.brand[data-action="home"]', mode)
    browser.press('[data-level="easy"]', mode)
    browser.press('[data-world="health"]', mode)
    browser.element('.prompt')
    topic = browser.state('easy/health/sve/vjezba')
    assert topic['world'] == 'health' and topic['level'] == 'easy' and topic['lesson'] is None
    assert '#vjezba/' not in browser.driver.current_url
    browser.driver.get(APP + '#gradivo')
    catalogue(browser)
    browser.driver.back()
    assert browser.element('.prompt').is_displayed()
    data['regularTopicAndCatalogueHistory'] = True


def run(mode):
    data = report['profiles'][mode] = {}
    with tempfile.TemporaryDirectory() as owner_profile, tempfile.TemporaryDirectory() as fresh_profile:
        browser = launch(owner_profile, mode)
        try:
            link, saved = start_owner(browser, mode, data)
            browser.quit()
            browser = None
            browser = launch(owner_profile, mode)
            reopened_owner(browser, mode, data, link, saved)
            browser.quit()
            browser = None
            browser = launch(fresh_profile, mode)
            recipient(browser, mode, data, link)
        except BaseException:
            if browser:
                browser.screenshot(mode + '-stranice-neuspjeh')
                print('URL', browser.driver.current_url, 'heading', [e.text for e in browser.all('h1')], flush=True)
            raise
        finally:
            record('stranice-poveznice-nastavak.json', report)
            if browser:
                browser.quit()
    print('PASS', mode, data['link'], 'odvojeni profili, ponovno pokretanje i zadnji stvarni unos', flush=True)


if __name__ == '__main__':
    run('keyboard')
    run('touch')
