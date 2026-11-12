const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');

const questions = {
  single: { id:'s', type:'single', answer:'tipkovnica', options:['miš','tipkovnica','zaslon'] },
  debug: { id:'d', type:'debug', answer:'korak-2', options:['korak-1','korak-2','korak-3'] },
  sim: { id:'x', type:'sim', answer:'natrag', options:['natrag','naprijed','osvježi'] },
  match: { id:'m', type:'match', left:['miš','zaslon'], right:['pokazuje','odabire'], answer:[['miš','odabire'],['zaslon','pokazuje']] },
  sort: { id:'z', type:'sort', items:['ime','lozinka','omiljena boja'], zones:['osobno','javno'], answer:{ osobno:['ime','lozinka'], javno:['omiljena boja'] } },
  order: { id:'o', type:'order', items:['otvori','napiši','spremi'], answer:['otvori','napiši','spremi'] }
};

test('response validation accepts exact complete answers for all six interaction types', () => {
  assert.equal(E.check(questions.single,{selected:' TIPKOVNICA '}),true);
  assert.equal(E.check(questions.debug,{selected:'korak-2'}),true);
  assert.equal(E.check(questions.sim,{selected:'natrag'}),true);
  assert.equal(E.check(questions.match,{pairs:[['zaslon','pokazuje'],['miš','odabire']]}),true);
  assert.equal(E.check(questions.sort,{zones:{javno:['omiljena boja'],osobno:['lozinka','ime']}}),true);
  assert.equal(E.check(questions.order,{items:['otvori','napiši','spremi']}),true);
});

test('response validation rejects empty, partial, duplicate and wrong answers', () => {
  for (const q of Object.values(questions)) assert.equal(E.check(q,{}),false,q.type);
  assert.equal(E.check(questions.single,{selected:'tip'}),false);
  assert.equal(E.check(questions.match,{pairs:[['miš','odabire']]}),false);
  assert.equal(E.check(questions.match,{pairs:[['miš','odabire'],['miš','odabire']]}),false);
  assert.equal(E.check(questions.sort,{zones:{osobno:['ime','lozinka','lozinka'],javno:['omiljena boja']}}),false);
  assert.equal(E.check(questions.order,{items:['napiši','otvori','spremi']}),false);
});

test('session counts attempts once per submission, locks solved questions and summarizes retries', () => {
  const round=[questions.single,questions.debug,questions.sim,questions.order,questions.match];
  const s=E.createSession('easy','computer',123,round);
  assert.equal(E.submit(s,{}),'empty');
  assert.equal(s.attempts[0],0);
  assert.equal(E.submit(s,{selected:'miš'}),'incorrect');
  assert.equal(s.attempts[0],1);
  assert.equal(E.submit(s,{selected:'tipkovnica'}),'correct');
  assert.equal(s.attempts[0],2);
  assert.equal(E.submit(s,{selected:'tipkovnica'}),'locked');
  assert.equal(s.attempts[0],2);
  E.advance(s);
  assert.equal(s.index,1);
  assert.equal(E.submit(s,{selected:'korak-2'}),'correct');
  const summary=E.summarize(s);
  assert.deepEqual(summary,{solved:2,total:5,firstTry:1,retried:1});
});

test('seeded random and shuffle are deterministic without mutating input', () => {
  const values=['a','b','c','d'];
  const first=E.shuffle(values,E.makeRng(42));
  const second=E.shuffle(values,E.makeRng(42));
  assert.deepEqual(first,second);
  assert.deepEqual(values,['a','b','c','d']);
  assert.notDeepEqual(first,E.shuffle(values,E.makeRng(43)));
});
