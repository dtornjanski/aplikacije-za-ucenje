const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { JSDOM } = createRequire(require.resolve('../istrazivaci-naseg-svijeta/package.json'))('jsdom');

const apps = ['matematicka-pustolovina', 'mislim-i-otkrivam', 'informaticka-pustolovina', 'istrazivaci-naseg-svijeta'];
const html = app => fs.readFileSync(path.join(__dirname, '../javne-aplikacije', app, 'index.html'), 'utf8');
const production = 'https://aplikacije-za-ucenje.onrender.com/';

for (const app of apps) {
  test(app + ' links to its own portal on the web, below a path, and in an offline bundle', () => {
    const source = html(app);
    const cases = [
      [`https://test.example/${app}/`, 'https://test.example/index.html'],
      [`https://test.example/skola/ucenje/${app}`, 'https://test.example/skola/ucenje/index.html'],
      [`https://test.example/skola/ucenje/${app}/#gradivo`, 'https://test.example/skola/ucenje/index.html'],
      [`https://test.example/skola/ucenje/${app}/index.html#vjezba/str-58/hard`, 'https://test.example/skola/ucenje/index.html'],
      [`file:///skola/paket/${app}/index.html`, 'file:///skola/paket/index.html'],
      [`file:///projekt/${app}/dist/index.html`, 'file:///projekt/javne-aplikacije/index.html'],
      [`file:///projekt/page-apps/${app}.html`, 'file:///projekt/javne-aplikacije/index.html'],
      [`file:///Downloads/${app}.html`, production],
      ['file:///Downloads/index.html', production],
      ['about:srcdoc', production],
    ];
    const dom = new JSDOM(source, { url: cases[0][0], runScripts: 'outside-only' });
    const doc = dom.window.document;
    const link = doc.querySelector('header a.portal-link');
    assert.equal(link.textContent, 'Sve aplikacije');
    assert.equal(link.getAttribute('href'), '../index.html');
    assert.equal(link.target, '');
    assert.ok(!link.hasAttribute('data-action') && !link.hasAttribute('onclick'));
    assert.ok(doc.querySelector('header .brand'));
    const skip = doc.querySelector('a.skip-link, a.skip');
    assert.ok(skip.compareDocumentPosition(link) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(doc.querySelector(skip.hash), doc.querySelector('main'));
    dom.window.close();
    for (const [url, target] of cases) {
      const page = new JSDOM(source, { url, runScripts: 'outside-only' });
      const document = page.window.document;
      page.window.eval(document.querySelector('#portal-navigation-path').textContent);
      for (const item of document.querySelectorAll('.portal-link')) assert.equal(item.href, target, url);
      page.window.close();
    }
  });

  test(app + ' keeps a native portal link available inside an exercise', () => {
    const world = app === 'istrazivaci-naseg-svijeta';
    const url = `https://test.example/razred/${app}/index.html` + (world ? '#vjezba/str-58/hard' : '');
    const page = new JSDOM(html(app), { url, runScripts: 'outside-only' });
    const { window } = page, document = window.document;
    window.scrollTo = () => {};
    const link = document.querySelector('header .portal-link');
    for (const script of document.scripts) window.eval(script.textContent);
    if (!world) {
      document.querySelector('[data-level]').click();
      document.querySelector('[data-topic], [data-category], [data-world]').click();
    }
    assert.ok(document.querySelector('.exercise, #answer-form'));
    assert.equal(document.querySelector('header .portal-link'), link);
    link.focus();
    assert.equal(document.activeElement, link);
    let nativeClick = false;
    window.addEventListener('click', event => { nativeClick = !event.defaultPrevented; event.preventDefault(); }, { once: true });
    link.click();
    assert.ok(nativeClick);
    assert.equal(link.href, 'https://test.example/razred/index.html');
    page.window.close();
  });
}

const thinkKey = 'mislim-i-otkrivam-round-v1';
function thinkPage(saved, blocked = false) {
  const dom = new JSDOM(html('mislim-i-otkrivam'), { url: 'https://test.example/mislim-i-otkrivam/', runScripts: 'outside-only' });
  const { window } = dom, doc = window.document;
  window.scrollTo = () => {};
  if (saved) window.sessionStorage.setItem(thinkKey, saved);
  if (blocked) Object.defineProperty(window, 'sessionStorage', { get() { throw Error('unavailable'); } });
  for (const script of doc.scripts) window.eval(script.textContent);
  const click = selector => { const button = doc.querySelector(selector); assert.ok(button && !button.disabled, selector); button.click(); };
  return { window, doc, click, close: () => window.close() };
}

test('a logic exercise resumes its shuffled choices and submitted answer after returning from the hub', () => {
  let page = thinkPage();
  page.click('[data-level="2"]');
  page.click('[data-category="error"]');
  const title = page.doc.querySelector('main h1').textContent;
  const choices = [...page.doc.querySelectorAll('label.option')].map(option => option.textContent);
  const question = page.window.ThinkContent.find(q => q.title === title);
  const [answer, reason] = question.validPairs[0];
  page.click(`input[name="answer"][value="${answer}"]`);
  const draft = page.window.sessionStorage.getItem(thinkKey);
  page.click('[data-action="reason"]');
  page.click(`input[name="reason"][value="${reason}"]`);
  page.click('[data-action="submit"]');
  const saved = page.window.sessionStorage.getItem(thinkKey);
  const submitted = page.doc.querySelector('.answer-review').textContent;
  const link = page.doc.querySelector('header .portal-link');
  let nativeClick = false;
  page.window.addEventListener('click', event => { nativeClick = !event.defaultPrevented; event.preventDefault(); }, { once: true });
  link.click();
  assert.ok(nativeClick);
  page.close();

  page = thinkPage(saved);
  assert.match(page.doc.querySelector('.resume').textContent, /1 od 2/);
  page.click('[data-action="resume"]');
  assert.equal(page.doc.querySelector('.answer-review').textContent, submitted);
  assert.equal(JSON.parse(page.window.sessionStorage.getItem(thinkKey)).phase, 'correct');
  page.click('[data-action="next"]');
  assert.match(page.doc.querySelector('.progress-text').textContent, /2 od 2/);
  assert.ok(page.doc.querySelector('dialog .portal-link'));
  page.close();

  page = thinkPage(draft);
  page.click('[data-action="resume"]');
  assert.equal(page.doc.querySelector('main h1').textContent, title);
  assert.deepEqual([...page.doc.querySelectorAll('label.option')].map(option => option.textContent), choices);
  assert.equal(page.doc.querySelector('input:checked').value, String(answer));
  page.close();
});

test('missing, corrupt, and blocked tab storage allow a new logic exercise', () => {
  for (const [saved, blocked] of [[null, false], ['{broken', false], ['{"ids":["missing"]}', false], [null, true]]) {
    const page = thinkPage(saved, blocked);
    assert.equal(page.doc.querySelector('[data-action="resume"]'), null);
    page.click('[data-level="1"]');
    page.click('[data-category="mix"]');
    assert.equal(page.doc.querySelectorAll('input[name="answer"]').length, 3);
    page.close();
  }
});
