const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { JSDOM } = createRequire(require.resolve('../istrazivaci-naseg-svijeta/package.json'))('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../javne-aplikacije/mislim-i-otkrivam/index.html'), 'utf8');
const prefix = 'mislim-i-otkrivam-istraga-v1-';
const url = 'https://test.example/skola/mislim-i-otkrivam/index.html';
const mainText = p => p.doc.querySelector('main').textContent;
const plain = value => JSON.parse(JSON.stringify(value));

function page(saved = {}, blocked = false) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  const window = dom.window, doc = window.document;
  window.scrollTo = () => {};
  Object.entries(saved).forEach(([k, v]) => window.localStorage.setItem(k, v));
  if (blocked) Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } });
  for (const script of doc.scripts) window.eval(script.textContent);
  function click(selector) {
    const el = doc.querySelector(selector);
    assert.ok(el && !el.disabled && !el.hidden, selector);
    el.click();
  }
  const act = name => click('[data-action="' + name + '"]');
  function choose(level) {
    const select = doc.querySelector('[name="investigation-level"]');
    select.value = String(level);
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  }
  function picks(values, reason = null) {
    const inputs = [...doc.querySelectorAll('[name="inv-pick"]')];
    inputs.forEach(input => {
      const wanted = values.includes(Number(input.value));
      if (input.checked !== wanted && (wanted || input.type === 'checkbox')) input.click();
    });
    if (reason !== null) click('[name="inv-reason"][value="' + reason + '"]');
  }
  return { window, doc, click, act, choose, picks,
    run: level => JSON.parse(window.localStorage.getItem(prefix + level)).run,
    save: () => Object.fromEntries(Object.entries(window.localStorage)),
    close: () => window.close() };
}

const trialPairs = {
  'trial-autic': [0, 1], 'trial-rucnik': [0, 2], 'trial-sjena': [0, 2], 'trial-most': [0, 2],
  'trial-led': [0, 2], 'trial-avion': [0, 1], 'trial-camac': [0, 2], 'trial-vrtuljak': [0, 3], 'trial-otisak': [0, 2]
};
const pairs = count => Array.from({ length: count }, (_, i) => Array.from({ length: i }, (_, j) => [j, i])).flat();

function solutions(q, r) {
  const positions = q.cards ? q.cards.map((_, i) => i) : [];
  if (q.kind === 'sort') {
    const valid = q.reasons.map(([, ids], reason) => ({ pick: ids, reason })).filter(x => x.pick.length === 1);
    const good = valid.find(x => !r.step || r.prior.pick[0] !== x.pick[0]);
    const bad = r.step ? r.prior : { ...good, pick: [(good.pick[0] + 1) % q.cards.length] };
    return [bad, good];
  }
  let good, bad;
  if (q.kind === 'clue' && r.step < q.clues.length) {
    good = positions.filter(i => q.clues.slice(0, r.step + 1).every(([, ids]) => ids.includes(i)));
    bad = good.length === 1 ? [(good[0] + 1) % q.cards.length] : [good[0]];
  } else if (q.kind === 'ask' && !r.step) {
    good = [q.questions.findIndex(([, ids]) => ids.length === q.cards.length / 2)];
    bad = [(good[0] + 1) % q.questions.length];
  } else if (q.kind === 'ask') {
    good = positions.filter(i => q.questions[r.prior.pick[0]][1].includes(i) === q.yes);
    bad = [good[0]];
  } else if (q.kind === 'trial' && !r.step) {
    good = trialPairs[q.id];
    bad = pairs(q.runs.length).find(pair => !pair.every(n => good.includes(n)));
  } else { good = [0]; bad = [1]; }
  return [{ pick: bad }, { pick: good }];
}

test('72 distinct situations, balanced levels, discriminating clues, fair comparisons and multiple justified answers', () => {
  const p = page();
  const tasks = plain(p.window.ThinkInvestigations);
  assert.equal(p.window.ThinkContent.length, 36);
  assert.equal(tasks.length, 36);
  assert.equal(new Set([...p.window.ThinkContent, ...tasks].map(q => q.id)).size, 72);
  assert.equal(new Set(tasks.map(q => q.title)).size, 36);
  for (const level of [1, 2, 3]) for (const kind of ['clue', 'ask', 'trial', 'sort']) {
    assert.equal(tasks.filter(q => q.level === level && q.kind === kind).length, 3);
  }
  for (const q of tasks) {
    if (q.kind === 'trial') {
      const fair = pairs(q.runs.length).filter(([i, j]) => q.runs[i][0] !== q.runs[j][0] &&
        q.runs[i].slice(1, -1).every((v, k) => v === q.runs[j][k + 1]));
      assert.deepEqual(fair, [trialPairs[q.id]], q.id);
    } else if (q.kind === 'clue') {
      let possibilities = q.cards.map((_, i) => i);
      for (const [, chosen] of q.clues) {
        const left = possibilities.filter(i => chosen.includes(i));
        assert.ok(left.length && left.length < possibilities.length, q.id);
        possibilities = left;
      }
      assert.equal(possibilities.length, 1, q.id);
    } else if (q.kind === 'ask') {
      assert.equal(q.questions.filter(([, options]) => options.length === q.cards.length / 2).length, 1, q.id);
    } else {
      assert.ok(new Set(q.reasons.filter(([, ids]) => ids.length === 1).map(([, ids]) => ids[0])).size >= 2, q.id);
    }
  }
  p.close();
});

for (const level of [1, 2, 3]) test('three complete four-task investigations cover level ' + level + ' with no repeats', () => {
  const p = page();
  p.choose(level);
  const visited = new Set();
  for (let game = 0; game < 3; game++) {
    p.act('investigate');
    const run = p.run(level);
    assert.equal(new Set(run.ids.map(id => id.split('-')[0])).size, 4);
    for (let index = 0; index < 4; index++) {
      const task = plain(p.window.ThinkInvestigations.find(q => q.id === run.ids[index]));
      assert.ok(!visited.has(task.id), task.id);
      visited.add(task.id);
      const steps = task.kind === 'clue' ? task.clues.length + 1 : 2;
      for (let step = 0; step < steps; step++) {
        const state = p.run(level);
        assert.equal(state.index, index); assert.equal(state.step, step);
        assert.equal(p.doc.querySelector('.portal-link').href, 'https://test.example/skola/index.html');
        assert.equal(p.doc.querySelector('.inv-feedback').textContent, '');
        assert.ok(p.doc.querySelector('[data-action="investigation-check"]').disabled);
        if (task.kind === 'trial') assert.equal(p.doc.querySelectorAll('.inv-measure').length, step ? 2 : 0);
        if (task.kind === 'clue') assert.equal(p.doc.querySelectorAll('.inv-notes li').length, Math.min(step + 1, task.clues.length));
        const [bad, good] = solutions(task, state);
        if (index === 0) {
          p.picks(bad.pick, bad.reason);
          p.act('investigation-check');
          assert.match(p.doc.querySelector('.inv-feedback').textContent, /Pokušaj ponovno/);
          assert.ok(p.doc.querySelector('[data-action="investigation-next"]').hidden);
        }
        p.picks(good.pick, good.reason);
        assert.equal(p.doc.querySelector('.inv-feedback').textContent, '');
        p.act('investigation-check');
        assert.equal(p.doc.querySelector('.inv-feedback').textContent, 'Točno!');
        assert.equal(Number(p.doc.querySelector('.inv-exercise .progress').getAttribute('aria-valuenow')), index + (step === steps - 1 ? 1 : 0));
        assert.ok([...p.doc.querySelectorAll('.inv-exercise input')].every(i => i.disabled));
        p.act('investigation-next');
      }
    }
    assert.match(mainText(p), /Istraga je dovršena!/);
    assert.deepEqual([...p.doc.querySelectorAll('.stat strong')].map(x => x.textContent), ['3', '1']);
  }
  assert.equal(visited.size, 12);
  p.close();
});

test('unfinished drafts, submitted feedback, level choice and shuffled boards survive leaving and reopening', () => {
  let p = page();
  p.choose(2); p.act('investigate');
  let run = p.run(2);
  let task = plain(p.window.ThinkInvestigations.find(q => q.id === run.ids[0]));
  const [bad, good] = solutions(task, run);
  p.picks(bad.pick, bad.reason);
  const order = [...p.doc.querySelectorAll('[name="inv-pick"]')].map(i => i.value);
  p.act('investigation-back');
  assert.match(mainText(p), /Nastavi malu istragu/);
  p.choose(3); p.act('investigate'); p.click('#brand');
  p.choose(2);
  let saved = p.save(); p.close();
  p = page(saved); p.act('investigate');
  assert.deepEqual(p.run(2), { ...run, pick: p.run(2).pick, reason: bad.reason ?? null });
  assert.deepEqual([...p.doc.querySelectorAll('[name="inv-pick"]')].map(i => i.value), order);
  assert.deepEqual([...p.doc.querySelectorAll('[name="inv-pick"]:checked')].map(i => Number(i.value)).sort(), [...bad.pick].sort());
  p.act('investigation-check');
  saved = p.save(); p.close();
  p = page(saved); p.act('investigate');
  assert.match(p.doc.querySelector('.inv-feedback').textContent, /Pokušaj ponovno/);
  p.picks(good.pick, good.reason); p.act('investigation-check'); p.act('investigation-next');
  const followUp = mainText(p);
  saved = p.save(); p.close();
  p = page(saved); p.act('investigate');
  assert.equal(mainText(p), followUp);
  assert.ok(p.run(3));
  p.close();
});

test('classic exercises and investigations keep independent progress, including areas return and bad storage', () => {
  const p = page({ [prefix + 2]: '{invalid' });
  p.click('[data-level="2"]'); p.click('[data-category="error"]');
  p.click('input[name="answer"]'); p.act('areas'); p.act('investigate');
  assert.equal(p.run(2).index, 0);
  p.act('investigation-back'); assert.match(mainText(p), /Što ćemo istražiti/);
  p.act('resume'); assert.ok(p.doc.querySelector('input[name="answer"]:checked'));
  p.close();
  const b = page({}, true);
  b.act('investigate');
  b.act('investigation-back'); b.act('investigate');
  assert.ok(b.doc.querySelector('.inv-exercise h1'));
  b.close();
});
