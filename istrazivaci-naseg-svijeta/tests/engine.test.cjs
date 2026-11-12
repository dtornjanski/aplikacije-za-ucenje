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

test('content bank covers eleven worlds three levels and 396 templates', () => {
  const C=require('../src/content.js');
  assert.deepEqual(C.worlds.map(world=>world.id),['school','home','autumn','winter','spring','summer','spacetime','energy','health','nature','place']);
  assert.deepEqual(C.levels.map(level=>level.id),['easy','medium','hard']);
  assert.equal(C.templateCount(),396);
  for(const world of C.worlds) for(const level of C.levels) assert.equal(C.templates[world.id][level.id].length,12,`${world.id}/${level.id}`);
});

function generatedResponse(question,correctAnswer=true){
  if(['single','cause','observe'].includes(question.type)) return {selected:correctAnswer?question.answer:question.options.find(value=>value!==question.answer)};
  if(question.type==='match'){
    const pairs=question.answer.map(pair=>pair.slice());
    if(!correctAnswer) [pairs[0][1],pairs[1][1]]=[pairs[1][1],pairs[0][1]];
    return {pairs};
  }
  if(question.type==='sort'){
    const zones=Object.fromEntries(Object.entries(question.answer).map(([name,items])=>[name,items.slice()]));
    if(!correctAnswer){const names=Object.keys(zones),item=zones[names[0]].shift();zones[names[1]].push(item);}
    return {zones};
  }
  const items=question.answer.slice();
  if(!correctAnswer){const at=items.findIndex((value,index)=>index<items.length-1&&value!==items[index+1]);assert.notEqual(at,-1);[items[at],items[at+1]]=[items[at+1],items[at]];}
  return {items};
}

test('generated rounds are deterministic unique complete and solvable across 100 seeds', () => {
  const C=require('../src/content.js'),types=new Set(['single','match','sort','order','cause','observe','timeline']);
  let checked=0;
  for(const level of C.levels){
    for(const world of C.worlds){
      for(let seed=1;seed<=100;seed++){
        const round=C.buildRound(level.id,world.id,seed);
        assert.equal(round.length,5);
        assert.deepEqual(round,C.buildRound(level.id,world.id,seed));
        assert.equal(new Set(round.map(question=>question.id)).size,5);
        for(const question of round){
          assert.equal(question.world,world.id);assert.equal(question.level,level.id);assert.ok(types.has(question.type));
          assert.ok(question.title&&question.prompt);assert.equal(E.check(question,generatedResponse(question,true)),true,JSON.stringify(question));
          assert.equal(E.check(question,generatedResponse(question,false)),false,JSON.stringify(question));checked++;
        }
      }
    }
    for(let seed=1;seed<=100;seed++){
      const mixed=C.buildRound(level.id,'mix',seed);
      assert.equal(mixed.length,11);
      assert.deepEqual(new Set(mixed.map(question=>question.world)),new Set(C.worlds.map(world=>world.id)));
    }
  }
  assert.equal(checked,16500);
});

test('difficulty variants preserve complete sequences and make hard decisions distinct', () => {
  const C=require('../src/content.js');
  for(const level of C.levels){
    const growth=C.templates.nature[level.id][3](E.makeRng(9));
    assert.match(growth.answer.join(' '),/nastaje nova biljka/,level.id);
    assert.equal(growth.answer.length,level.id==='easy'?3:level.id==='medium'?4:5);
  }
  const medium=C.templates.school.medium[0](E.makeRng(5)),hard=C.templates.school.hard[0](E.makeRng(5));
  assert.notEqual(medium.answer,hard.answer);
  assert.notDeepEqual(medium.options,hard.options);
  assert.match(hard.prompt,/usporedi|posljedicu|odluke/i);
});

test('serialization reconstructs identical seeded questions and progress', () => {
  const C=require('../src/content.js'),round=C.buildRound('hard','mix',2027);
  const session=E.createSession('hard','mix',2027,round);
  assert.equal(E.submit(session,generatedResponse(round[0],true)),'correct');E.advance(session);
  assert.equal(E.submit(session,generatedResponse(round[1],false)),'incorrect');
  const raw=E.serialize(session),restored=E.restore(raw,C.buildRound);
  assert.doesNotMatch(raw,/"questions"/);
  assert.deepEqual(restored.questions,round);
  assert.equal(restored.index,1);assert.equal(restored.phase,'incorrect');
  assert.deepEqual(restored.attempts,[1,1,0,0,0,0,0,0,0,0,0]);
});

test('restore rejects corrupt impossible injected and incomplete-shaped states', () => {
  const C=require('../src/content.js'),round=C.buildRound('easy','school',41);
  const session=E.createSession('easy','school',41,round);
  assert.equal(E.submit(session,generatedResponse(round[0],true)),'correct');E.advance(session);
  const valid=JSON.parse(E.serialize(session));
  const corrupt=[
    'not json',{...valid,version:88},{...valid,level:'expert'},{...valid,world:'moon'},
    {...valid,index:99},{...valid,attempts:[]},{...valid,solved:[false,...valid.solved.slice(1)]},
    {...valid,responses:valid.responses.map((response,index)=>index===1?{selected:'ubrizgano'}:response)},
    {...valid,phase:'complete'}
  ];
  for(const raw of corrupt) assert.equal(E.restore(typeof raw==='string'?raw:JSON.stringify(raw),C.buildRound),null,JSON.stringify(raw));

  let seed=1,sortRound;
  while(seed<500){sortRound=C.buildRound('easy','health',seed);if(sortRound[0].type==='sort')break;seed++;}
  const missing=JSON.parse(E.serialize(E.createSession('easy','health',seed,sortRound)));
  missing.phase='incorrect';missing.attempts[0]=1;missing.responses[0]={zones:{}};
  assert.equal(E.restore(JSON.stringify(missing),C.buildRound),null);

  let orderSeed=1,orderRound;
  while(orderSeed<500){orderRound=C.buildRound('easy','nature',orderSeed);if(orderRound[0].type==='order')break;orderSeed++;}
  const repeated=JSON.parse(E.serialize(E.createSession('easy','nature',orderSeed,orderRound)));
  repeated.phase='incorrect';repeated.attempts[0]=1;repeated.responses[0]={items:Array(orderRound[0].answer.length).fill(orderRound[0].items[0])};
  assert.equal(E.restore(JSON.stringify(repeated),C.buildRound),null);
});
