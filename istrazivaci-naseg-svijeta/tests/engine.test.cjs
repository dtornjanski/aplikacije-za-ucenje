const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');

const questions = {
  single:{id:'s',type:'single',options:['list','kamen','oblak'],answer:'list'},
  cause:{id:'c',type:'cause',options:['jer je hladnije','jer je glasnije','jer je veće'],answer:'jer je hladnije'},
  observe:{id:'v',type:'observe',options:['prozirno','hrapavo','tekuće'],answer:'prozirno'},
  match:{id:'m',type:'match',left:['knjižnica','ambulanta'],right:['knjige','liječnik'],answer:[['knjižnica','knjige'],['ambulanta','liječnik']]},
  sort:{id:'z',type:'sort',items:['papir','kora banane','staklenka'],zones:['papir','bio','staklo'],answer:{papir:['papir'],bio:['kora banane'],staklo:['staklenka']}},
  order:{id:'o',type:'order',items:['pripremi sjeme','zalij','promatraj','zalij'],answer:['pripremi sjeme','zalij','promatraj','zalij']},
  timeline:{id:'t',type:'timeline',items:['jučer','danas','sutra'],answer:['jučer','danas','sutra']}
};

const correct = q => {
  if(['single','cause','observe'].includes(q.type)) return {selected:q.answer};
  if(q.type==='match') return {pairs:q.answer.map(pair=>pair.slice()).reverse()};
  if(q.type==='sort') return {zones:Object.fromEntries(Object.entries(q.answer).map(([key,items])=>[key,items.slice()]))};
  return {items:q.answer.slice()};
};

test('validates exact complete answers for all seven interaction types', () => {
  for(const q of Object.values(questions)){
    assert.equal(E.complete(q,correct(q)),true,q.type);
    assert.equal(E.check(q,correct(q)),true,q.type);
  }
});

test('rejects partial duplicate and wrong answers including repeated sequence labels', () => {
  assert.equal(E.check(questions.single,{selected:'kamen'}),false);
  assert.equal(E.check(questions.match,{pairs:[['knjižnica','knjige']]}),false);
  assert.equal(E.check(questions.match,{pairs:[['knjižnica','knjige'],['knjižnica','knjige']]}),false);
  assert.equal(E.check(questions.sort,{zones:{papir:['papir','papir'],bio:[],staklo:['staklenka']}}),false);
  assert.equal(E.check(questions.order,{items:['pripremi sjeme','zalij','zalij','promatraj']}),false);
  assert.equal(E.complete(questions.order,{items:['pripremi sjeme','zalij','promatraj']}),false);
  assert.equal(E.check(questions.timeline,{items:['danas','jučer','sutra']}),false);
});

test('counts retries locks solved questions and summarizes the round', () => {
  const round=[questions.single,questions.cause,questions.observe,questions.order,questions.timeline];
  const session=E.createSession('easy','school',42,round);
  assert.equal(E.submit(session,{}),'empty');
  assert.equal(E.submit(session,{selected:'kamen'}),'incorrect');
  assert.equal(E.submit(session,{selected:'list'}),'correct');
  assert.equal(E.submit(session,{selected:'list'}),'locked');
  assert.equal(E.advance(session),true);
  assert.equal(E.submit(session,correct(round[1])),'correct');
  assert.deepEqual(E.summarize(session),{solved:2,total:5,firstTry:1,retried:1});
  assert.deepEqual(session.attempts,[2,1,0,0,0]);
});

test('seeded random and shuffle are deterministic without mutating input', () => {
  const input=['a','b','c','d'];
  assert.deepEqual(E.shuffle(input,E.makeRng(17)),E.shuffle(input,E.makeRng(17)));
  assert.notDeepEqual(E.shuffle(input,E.makeRng(17)),E.shuffle(input,E.makeRng(18)));
  assert.deepEqual(input,['a','b','c','d']);
});
