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

test('content bank covers eight worlds, three levels and 288 templates', () => {
  const C=require('../src/content.js');
  assert.deepEqual(C.worlds.map(w=>w.id),['computer','programs','internet','safety','traces','algorithm','scratch','create']);
  assert.deepEqual(C.levels.map(l=>l.id),['easy','medium','hard']);
  assert.equal(C.templateCount(),288);
  for(const world of C.worlds) for(const level of C.levels) assert.equal(C.templates[world.id][level.id].length,12,`${world.id}/${level.id}`);
});

function correctResponse(q){
  if(['single','debug','sim'].includes(q.type)) return {selected:q.answer};
  if(q.type==='match') return {pairs:q.answer.map(pair=>pair.slice())};
  if(q.type==='sort') return {zones:Object.fromEntries(Object.entries(q.answer).map(([k,v])=>[k,v.slice()]))};
  return {items:q.answer.slice()};
}

function wrongResponse(q){
  if(['single','debug','sim'].includes(q.type)) return {selected:q.options.find(v=>v!==q.answer)};
  if(q.type==='match'){
    const pairs=q.answer.map(pair=>pair.slice());
    [pairs[0][1],pairs[1][1]]=[pairs[1][1],pairs[0][1]];
    return {pairs};
  }
  if(q.type==='sort'){
    const zones=Object.fromEntries(Object.entries(q.answer).map(([k,v])=>[k,v.slice()]));
    const names=Object.keys(zones);
    const item=zones[names[0]].shift(); zones[names[1]].push(item);
    return {zones};
  }
  const items=q.answer.slice();
  const swapAt=items.findIndex((value,index)=>index<items.length-1&&value!==items[index+1]);
  assert.notEqual(swapAt,-1,'Order fixture needs two distinct adjacent steps');
  [items[swapAt],items[swapAt+1]]=[items[swapAt+1],items[swapAt]];
  return {items};
}

test('generated rounds are deterministic, unique, complete and solvable across 100 seeds', () => {
  const C=require('../src/content.js');
  const knownTypes=new Set(['single','match','sort','order','debug','sim']);
  let checked=0;
  for(const level of C.levels){
    for(const world of C.worlds){
      for(let seed=1;seed<=100;seed++){
        const round=C.buildRound(level.id,world.id,seed);
        assert.equal(round.length,5);
        assert.deepEqual(round,C.buildRound(level.id,world.id,seed));
        assert.equal(new Set(round.map(q=>q.id)).size,5);
        for(const q of round){
          assert.equal(q.world,world.id); assert.equal(q.level,level.id); assert.ok(knownTypes.has(q.type));
          assert.ok(q.title&&q.prompt); assert.doesNotMatch(JSON.stringify(q),/undefined|NaN/);
          assert.equal(E.check(q,correctResponse(q)),true,JSON.stringify(q));
          assert.equal(E.check(q,wrongResponse(q)),false,JSON.stringify(q));
          checked++;
        }
      }
    }
    for(let seed=1;seed<=100;seed++){
      const mixed=C.buildRound(level.id,'mix',seed);
      assert.equal(mixed.length,8);
      assert.deepEqual(new Set(mixed.map(q=>q.world)),new Set(C.worlds.map(w=>w.id)));
      assert.notDeepEqual(mixed,C.buildRound(level.id,'mix',seed+1000));
    }
  }
  assert.equal(checked,12000);
});

test('session serialization rebuilds the same deterministic questions and progress', () => {
  const C=require('../src/content.js');
  const round=C.buildRound('hard','mix',2026);
  const s=E.createSession('hard','mix',2026,round);
  assert.equal(E.submit(s,correctResponse(round[0])),'correct');
  E.advance(s);
  assert.equal(E.submit(s,wrongResponse(round[1])),'incorrect');
  const raw=E.serialize(s);
  assert.doesNotMatch(raw,/"questions"/);
  const restored=E.restore(raw,C.buildRound);
  assert.deepEqual(restored.questions,round);
  assert.equal(restored.index,1);
  assert.equal(restored.phase,'incorrect');
  assert.deepEqual(restored.attempts,[1,1,0,0,0,0,0,0]);
  assert.deepEqual(restored.solved,[true,false,false,false,false,false,false,false]);
});

test('restore rejects corrupt, impossible and injected saved states', () => {
  const C=require('../src/content.js');
  const round=C.buildRound('easy','computer',77);
  const s=E.createSession('easy','computer',77,round);
  assert.equal(E.submit(s,correctResponse(round[0])),'correct'); E.advance(s);
  const valid=JSON.parse(E.serialize(s));
  const corrupt=[
    'not json',
    {...valid,version:99},
    {...valid,level:'expert'},
    {...valid,world:'unknown'},
    {...valid,index:99},
    {...valid,attempts:[]},
    {...valid,solved:[false,...valid.solved.slice(1)]},
    {...valid,responses:valid.responses.map((r,i)=>i===1?{selected:'ubrizgano'}:r)},
    {...valid,phase:'complete'}
  ];
  for(const raw of corrupt) assert.equal(E.restore(typeof raw==='string'?raw:JSON.stringify(raw),C.buildRound),null,JSON.stringify(raw));
});
