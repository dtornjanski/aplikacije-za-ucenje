import html
import os
import pathlib
import re
import tempfile
import time

from selenium.webdriver.common.keys import Keys

from browser import APP, EXPECTED, Browser, colors, contrast, hue, norm, record

CLOCK = 'easy/spacetime/sat/vjezba'
WRONG = 'Još nije točno. Odaberi drugi odgovor.'
CHOICE = '[data-choice][aria-pressed="true"]'
metrics = {'url': APP, 'sha256': EXPECTED, 'profiles': {}, 'speech': []}
speech_log = pathlib.Path(os.environ['ORCA_LOG'])


def clock(browser):
    hand = browser.element('.hand.hour').get_attribute('style')
    angle = float(re.search(r'rotate\(([\d.]+)deg\)', hand).group(1))
    assert 'rotate(0deg)' in browser.element('.hand.minute').get_attribute('style')
    return '%02d:00' % (round(angle / 30) or 12)


def choose(browser, value, mode):
    browser.press(f'[data-choice][data-value="{value}"]', mode)


def no_solution_controls(browser):
    names = browser.js("""
        return [...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length)
          .map(e=>(e.getAttribute('aria-label')||'')+' '+e.innerText);
    """)
    assert not any(re.search('pokaži rješenje|mala pomoć', name, re.I) for name in names), names


def goal(browser, correct):
    no_solution_controls(browser)
    if correct:
        assert browser.element('h1').text == 'Točno!'
        assert '✓' in browser.element('.feedback.correct').text
        assert browser.js('return document.activeElement.matches(\'[data-action="next"]\')')
        browser.wait(lambda: 'Točno!' in browser.element('#announcer').get_attribute('textContent'))
    else:
        error = browser.element('.inline-feedback')
        assert error.is_displayed() and norm(error.text) == WRONG, error.text
        assert browser.js('return arguments[0]===document.activeElement', error)
        assert browser.js('const e=arguments[0];return e.previousElementSibling?.matches(arguments[1])', error, CHOICE)
        gap = browser.js("""
            const f=arguments[0].getBoundingClientRect(), c=arguments[0].previousElementSibling.getBoundingClientRect();
            return f.top-c.bottom;""", error)
        assert -1 <= gap <= 24, gap
        assert not browser.element('#check-button').is_enabled()


def listen_submit(browser, mode, case, correct):
    control = browser.element('#check-button')
    assert control.is_enabled()
    if mode == 'keyboard':
        browser.focus_by_tab(control)
    # Record only the announcements originating during this submission.
    time.sleep(.35)
    start = speech_log.stat().st_size
    if mode == 'keyboard':
        control.send_keys(Keys.ENTER)
    else:
        browser.tap(control)
    goal(browser, correct)
    time.sleep(2)
    with speech_log.open('rb') as log:
        log.seek(start)
        lines = log.read().decode(errors='replace').splitlines()
    # Orca logs the unmarked string before wrapping it. Only these SSML entries
    # are actually sent to speech-dispatcher. Inline markup can split a sentence.
    utterances = []
    for line in lines:
        match = re.search(r"SPEECH DISPATCHER: Speaking '(<speak(?:\s[^>]*)?>.*?</speak>)'", line)
        if match:
            utterances.append(norm(html.unescape(re.sub('<[^>]+>', '', match.group(1)))))
    spoken = norm(' '.join(utterances)).casefold()
    counts = ({'Točno!': len(re.findall(r'(?<!nije )\btočno\b', spoken))} if correct else
              {phrase: spoken.count(phrase.casefold()) for phrase in ['Još nije točno', 'Odaberi drugi odgovor']})
    row = {'mode': mode, 'submission': case, 'correct': correct, 'counts': counts, 'utterances': utterances}
    metrics['speech'].append(row)
    record('sat-i-govor.json', metrics)
    print('Orca', case, mode, counts, flush=True)
    assert all(count == 1 for count in counts.values()), row


def run(mobile):
    mode = 'touch' if mobile else 'keyboard'
    data = metrics['profiles'][mode] = {}
    with tempfile.TemporaryDirectory() as profile:
        browser = Browser(profile, mobile=mobile)
        try:
            data['chrome'] = browser.driver.capabilities['browserVersion']
            browser.home()
            data['input'] = {'mode': mode, 'touchPoints': browser.js('return navigator.maxTouchPoints'),
                             'viewport': browser.js('return [innerWidth,innerHeight]')}
            if mobile:
                assert data['input']['touchPoints'] >= 1 and data['input']['viewport'] == [360, 740]
            browser.open_lesson('easy', 'spacetime', 'sat', 14, mode)
            assert clock(browser) == '03:00'
            no_solution_controls(browser)
            assert not browser.element('#check-button').is_enabled()
            choose(browser, '01:00', mode)
            assert not browser.all('.inline-feedback')
            selected = colors(browser, CHOICE)
            radio = colors(browser, CHOICE + ' .radio')
            assert 185 < hue(selected['border']) < 265 and 185 < hue(radio['background']) < 265, (selected, radio)
            assert contrast(selected) >= 4.5, selected
            data['selected'] = {'colors': selected, 'filledRadio': radio, 'contrast': contrast(selected)}
            browser.screenshot(mode + '-01-odabir')
            listen_submit(browser, mode, 'pogrešno-01-00', False)
            failed = colors(browser, CHOICE)
            feedback = colors(browser, '.inline-feedback')
            assert 18 <= hue(failed['border']) <= 62 and 18 <= hue(failed['background']) <= 62, failed
            assert failed['background'] != selected['background'] and contrast(failed) >= 4.5
            assert contrast(feedback) >= 4.5, feedback
            data['incorrect'] = {'answer': '01:00', 'message': WRONG, 'colors': failed,
                                 'messageColors': feedback, 'contrast': contrast(feedback)}
            assert browser.element(CHOICE).get_attribute('data-value') == '01:00'
            assert browser.state(CLOCK)['attempts'][0] == 1
            browser.screenshot(mode + '-02-pogreska')
            # Use a real pointer on the disabled verification control.
            disabled = browser.element('#check-button')
            if mobile:
                browser.tap(disabled)
            else:
                disabled.click()
            assert browser.state(CLOCK)['attempts'][0] == 1

            browser.quit()
            browser = None
            browser = Browser(profile, mobile=mobile)
            data['restoredDocumentSha256'] = browser.home()
            browser.press(f'[data-run="{CLOCK}"]', mode)
            assert browser.element(CHOICE).get_attribute('data-value') == '01:00'
            assert norm(browser.element('.inline-feedback').text) == WRONG
            assert not browser.element('#check-button').is_enabled() and clock(browser) == '03:00'
            assert browser.state(CLOCK)['attempts'][0] == 1
            browser.screenshot(mode + '-03-nastavak')
            choose(browser, '03:00', mode)
            assert not browser.all('.inline-feedback') and colors(browser, CHOICE)['border'] == selected['border']
            listen_submit(browser, mode, 'ispravak-03-00', True)
            success = colors(browser, '.feedback.correct')
            assert 70 <= hue(success['background']) <= 165 and contrast(success) >= 4.5, success
            data['success'] = success
            browser.screenshot(mode + '-04-tocno')
            browser.press('[data-action="next"]', mode)
            for index in range(1, 5):
                assert f'{index + 1} od 5' in browser.element('.progress-text').text
                choose(browser, clock(browser), mode)
                listen_submit(browser, mode, 'zadatak-' + str(index + 1), True)
                browser.press('[data-action="next"]', mode)
            stats = [norm(e.text) for e in browser.all('.stat')]
            assert stats == ['4 Iz prvog pokušaja', '1 Uz ponovni pokušaj'], stats
            data['score'] = stats
            assert browser.state(CLOCK)['attempts'] == [2, 1, 1, 1, 1]
            browser.screenshot(mode + '-05-rezultat')
            browser.next_seed(91)
            browser.press('[data-action="review"]', mode)
            assert '1 od 1' in browser.element('.progress-text').text
            assert clock(browser) != '03:00', clock(browser)
            data['reviewClock'] = clock(browser)
            choose(browser, clock(browser), mode)
            listen_submit(browser, mode, 'ciljano-ponavljanje', True)
            browser.press('[data-action="next"]', mode)
            assert [e.text for e in browser.all('.stat strong')] == ['1', '0']
            assert not browser.all('[data-action="review"]')
            no_solution_controls(browser)
            print('PASS', mode, 'restart, 4 + 1, ciljano ponavljanje', flush=True)
        except BaseException:
            if browser:
                browser.screenshot(mode + '-neuspjeh')
            raise
        finally:
            record('sat-i-govor.json', metrics)
            if browser:
                browser.quit()


if __name__ == '__main__':
    run(False)
    run(True)
