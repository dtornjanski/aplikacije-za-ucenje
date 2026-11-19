import re

from browser import PORTAL
from navigation import MATH, THINK, IT, NATURE, NAMES


def action(name):
    return f'[data-action="{name}"]'


def state(browser, key):
    return browser.js('return JSON.parse(localStorage.getItem(arguments[0]))', key)


def report(qa, app, text, completed):
    stats = [e.text for e in qa.b.all('.stat')]
    assert stats and completed > 0, (app, stats)
    qa.evidence['exercises'][app] = {'restored': text, 'questionsCompleted': completed, 'result': stats}
    qa.leave(app, 'rezultat', picture=True)
    names = list(NAMES)
    qa.choose(names[(names.index(app) + 1) % len(names)])


def check_math(qa):
    b = qa.b
    key = 'math-adventure-session-v2'
    b.driver.get(PORTAL + MATH + '/index.html')
    qa.click('[data-level="easy"]')
    qa.click('[data-topic="2"]')
    field = b.element('#answer-0')
    field.send_keys('999')
    qa.click('#check-button')
    assert 'Nije točno' in b.element('#feedback').text
    before = state(b, key)
    assert before['given'][0] == ['999'] and before['attempts'][0] == 1
    qa.leave(MATH, 'vjezba', picture=True)
    qa.different_then_back(MATH, 'matematika')
    qa.click(action('resume'))
    assert before == state(b, key)
    assert b.element('#answer-0').get_property('value') == '999'
    for index in range(12):
        expected = f'{index + 1} od 12'
        b.wait(lambda: expected in b.element('.count').text, 'Vidljivi brojač: '+expected)
        equation = b.element('.equation-line').text
        parts = re.search(r'(\d+)\s*([+−-])\s*(\d+)\s*=', equation)
        assert parts, equation
        left, operator, right = parts.groups()
        value = int(left) + int(right) if operator == '+' else int(left) - int(right)
        field = b.element('#answer-0')
        field.clear()
        field.send_keys(str(value))
        qa.click('#check-button')
        assert 'Točno' in b.element('#feedback').text
        qa.click('#next-button')
    b.wait(lambda: 'završila' in b.element('.summary-hero h1').text, 'Vidljivi rezultat matematike')
    saved = state(b, key)
    assert all(saved['solved']) and saved['attempts'] == [2] + [1] * 11
    report(qa, MATH, '999 i broj pokušaja nakon prelaska u drugi predmet', 12)


def think_question(qa):
    b = qa.b
    heading = b.element('.question-head h1').text
    pair = b.js('return ThinkContent.find(q => q.title === arguments[0]).validPairs[0]', heading)
    qa.click(f'label:has(input[name="answer"][value="{pair[0]}"])')
    qa.click(action('reason'))
    qa.click(f'label:has(input[name="reason"][value="{pair[1]}"])')
    qa.click(action('submit'))
    assert 'Točno' in b.element('.feedback-hero h1').text
    return [x.text for x in b.all('.answer-review .selection strong')]


def check_think(qa):
    b = qa.b
    b.driver.get(PORTAL + THINK + '/index.html')
    qa.click('[data-level="1"]')
    qa.click('[data-category="error"]')
    before = think_question(qa)
    assert len(before) == 2 and all(before)
    qa.leave(THINK, 'vjezba', picture=True)
    qa.different_then_back(THINK, 'razmisljanje')
    qa.click(action('resume'))
    assert before == [x.text for x in b.all('.answer-review .selection strong')]

    # Leave while the native confirmation dialog makes the top header inert.
    qa.click('#brand')
    qa.click('[data-level="1"]')
    qa.click('[data-category="missing"]')
    assert b.element('dialog[open]').is_displayed()
    qa.leave(THINK, 'dijalog', picture=True)
    qa.choose(THINK)
    qa.click(action('resume'))
    assert before == [x.text for x in b.all('.answer-review .selection strong')]

    qa.click(action('next'))
    assert '2 od 2' in b.element('.progress-text').text
    think_question(qa)
    qa.click(action('next'))
    assert 'oba zadatka' in b.element('.results').text
    report(qa, THINK, {'answer': before[0], 'reason': before[1]}, 2)


def option(qa, selector, value):
    el = qa.b.js('return [...document.querySelectorAll(arguments[0])].find(e=>e.dataset.value===arguments[1])',
                 selector, value)
    assert el, (selector, value)
    qa.click(el)


def answer_generated(qa, q):
    # Read the exercise rules as an answer key. All changes and submissions use actual on-screen controls.
    answer = q['answer']
    if 'options' in q:
        option(qa, '[data-choice]', answer)
    elif q['type'] == 'match':
        for left, right in answer:
            option(qa, '[data-match-left]', left)
            option(qa, '[data-match-right]', right)
    elif q['type'] == 'sort':
        for zone, values in answer.items():
            for value in values:
                option(qa, '[data-sort-item]', value)
                option(qa, '[data-sort-zone]', zone)
    else:
        for value in answer:
            option(qa, '[data-order-item],[data-sequence-item]', value)
    qa.click('#check-button')
    assert 'Točno' in qa.b.element('.feedback.correct h1').text


def check_it(qa):
    b = qa.b
    key = 'info-adventure-session-v1'
    b.driver.get(PORTAL + IT + '/index.html')
    qa.click('[data-level="easy"]')
    b.next_seed(2)
    qa.click('[data-world="computer"]')
    initial = state(b, key)
    assert initial['seed'] == 2
    questions = b.js('const s=arguments[0];return InfoContent.buildRound(s.level,s.world,s.seed)', initial)
    assert len(questions) == 5
    answer_generated(qa, questions[0])
    before = state(b, key)
    assert before['phase'] == 'correct' and before['responses'][0] and before['solved'][0]
    qa.leave(IT, 'vjezba', picture=True)
    qa.different_then_back(IT, 'informatika')
    qa.click(action('resume'))
    assert before == state(b, key)
    assert b.element('.feedback.correct h1').text == 'Točno!'
    qa.click(action('next'))
    for q in questions[1:]:
        answer_generated(qa, q)
        qa.click(action('next'))
    assert 'svih 5' in b.element('.results').text and all(state(b, key)['solved'])
    report(qa, IT, before['responses'][0], len(questions))


def check_nature(qa):
    b = qa.b
    run = 'hard/health/str-58/vjezba'
    address = PORTAL + NATURE + '/index.html#vjezba/str-58/hard'
    b.driver.get(address)
    assert b.driver.current_url == address
    initial = b.state(run)
    assert initial['level'] == 'hard' and initial['lesson'] == 'str-58'
    questions = b.js('const s=arguments[0];return WorldPractice.buildRound(s.level,s.world,s.seed,s.plan)', initial)
    wrong = next(o for o in b.all('[data-choice]') if o.get_attribute('data-value') != questions[0]['answer'])
    wrong_value = wrong.get_attribute('data-value')
    qa.click(wrong)
    qa.click('#check-button')
    assert 'Još nije točno' in b.element('.inline-feedback').text
    before = b.state(run)
    assert before['draft']['selected'] == wrong_value and before['attempts'][0] == 1
    qa.leave(NATURE, 'dijeljena-vjezba-str-58', picture=True)
    qa.different_then_back(NATURE, 'priroda')
    qa.click(f'[data-run="{run}"]')
    assert b.driver.current_url == address
    now = b.state(run)
    for key in ('seed', 'plan', 'index', 'phase', 'draft', 'attempts', 'responses', 'solved'):
        assert now[key] == before[key], (key, before[key], now[key])
    assert b.element('[data-choice][aria-pressed="true"]').get_attribute('data-value') == wrong_value
    assert 'Još nije točno' in b.element('.inline-feedback').text
    for q in questions:
        answer_generated(qa, q)
        qa.click(action('next'))
    assert 'Riješeni zadaci' in b.element('.results').text and all(b.state(run)['solved'])
    report(qa, NATURE, {'link': address, 'selected': wrong_value, 'attempts': before['attempts']}, len(questions))
