const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('../../math-site/node_modules/jsdom');
const E = require('../src/engine.js');
const C = require('../src/content.js');

const source=path.join(__dirname,'../src'),storageKey='world-explorers-session-v1';
const read=name=>fs.readFileSync(path.join(source,name),'utf8');

function fixture(saved,blocked=false,seed=500){
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM(read('index.html'),{url:'https://world.example/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
  w.crypto.getRandomValues=values=>{values[0]=seed;return values;};
  if(saved!==undefined) w.localStorage.setItem(storageKey,typeof saved==='string'?saved:JSON.stringify(saved));
  if(blocked) Object.defineProperty(w,'localStorage',{get(){throw new Error('blocked');}});
  for(const file of ['engine.js','content.js','app.js']) w.eval(read(file));
  const click=selector=>{const node=typeof selector==='string'?d.querySelector(selector):selector;assert.ok(node,`Missing ${selector}`);node.click();};
  const byValue=(selector,value)=>[...d.querySelectorAll(selector)].find(node=>node.dataset.value===value);
  const snapshot=()=>{try{return E.restore(w.localStorage.getItem(storageKey),C.buildRound);}catch(error){return null;}};
  return {dom,w,d,errors,click,byValue,snapshot};
}

function response(question,correct=true){
  if(['single','cause','observe'].includes(question.type)) return {selected:correct?question.answer:question.options.find(value=>value!==question.answer)};
  if(question.type==='match'){
    const pairs=question.answer.map(pair=>pair.slice());if(!correct)[pairs[0][1],pairs[1][1]]=[pairs[1][1],pairs[0][1]];return {pairs};
  }
  if(question.type==='sort'){
    const zones=Object.fromEntries(Object.entries(question.answer).map(([name,items])=>[name,items.slice()]));
    if(!correct){const names=Object.keys(zones),item=zones[names[0]].shift();zones[names[1]].push(item);}return {zones};
  }
  const items=question.answer.slice();
  if(!correct){const at=items.findIndex((value,index)=>index<items.length-1&&value!==items[index+1]);[items[at],items[at+1]]=[items[at+1],items[at]];}return {items};
}

function enter(f,question,answer){
  if(['single','cause','observe'].includes(question.type)) return f.click(f.byValue('[data-choice]',answer.selected));
  if(question.type==='match') for(const [left,right] of answer.pairs){f.click(f.byValue('[data-match-left]',left));f.click(f.byValue('[data-match-right]',right));}
  if(question.type==='sort') for(const [zone,items] of Object.entries(answer.zones)) for(const item of items){f.click(f.byValue('[data-sort-item]',item));f.click(f.byValue('[data-sort-zone]',zone));}
  if(['order','timeline'].includes(question.type)) for(const item of answer.items) f.click(f.byValue('[data-sequence-item]',item));
}

function savedAtType(type){
  for(const level of C.levels) for(const world of C.worlds) for(let seed=1;seed<700;seed++){
    const round=C.buildRound(level.id,world.id,seed);if(round[0].type===type)return E.serialize(E.createSession(level.id,world.id,seed,round));
  }
  throw new Error(`Missing first question type ${type}`);
}

test('home level and world navigation exposes the approved learning flow', () => {
  const f=fixture();assert.match(f.d.title,/Istraživači našeg svijeta/);assert.match(f.d.body.textContent,/Lumi/);
  assert.equal(f.d.querySelectorAll('[data-level]').length,3);assert.doesNotMatch(f.d.body.textContent,/pokaži rješenje|mala pomoć/i);
  f.click('[data-level="easy"]');assert.equal(f.d.querySelectorAll('[data-world]').length,12);
  f.click('[data-world="school"]');assert.ok(f.d.querySelector('#check-button').disabled);assert.match(f.d.querySelector('.progress-text').textContent,/1 od 5/);
  assert.deepEqual(f.errors,[]);f.dom.window.close();
});

test('all seven interactions support incorrect retry and correct completion without revealing an answer', () => {
  for(const type of ['single','match','sort','order','cause','observe','timeline']){
    const f=fixture(savedAtType(type));f.click('[data-action="resume"]');const question=f.snapshot().questions[0];
    enter(f,question,response(question,false));assert.equal(f.d.querySelector('#check-button').disabled,false);f.click('#check-button');
    assert.match(f.d.body.textContent,/Pogledaj još jednom/);assert.doesNotMatch(f.d.body.textContent,/Točan odgovor|Rješenje je/);
    f.click('[data-action="retry"]');enter(f,question,response(question,true));f.click('#check-button');
    assert.match(f.d.body.textContent,/Točno!/);assert.ok(f.d.querySelector('[data-action="next"]'));assert.deepEqual(f.errors,[],type);f.dom.window.close();
  }
});

test('a complete five-question round reports first-try and retry totals', () => {
  const f=fixture();f.click('[data-level="medium"]');f.click('[data-world="autumn"]');
  for(let index=0;index<5;index++){
    const session=f.snapshot(),question=session.questions[session.index];
    if(index===0){enter(f,question,response(question,false));f.click('#check-button');f.click('[data-action="retry"]');}
    enter(f,question,response(question,true));f.click('#check-button');f.click('[data-action="next"]');
  }
  assert.match(f.d.querySelector('h1').textContent,/Bravo/);assert.deepEqual([...f.d.querySelectorAll('.stat strong')].map(node=>node.textContent),['4','1']);
  assert.deepEqual(f.errors,[]);f.dom.window.close();
});

test('resume survives reload while corrupt and blocked storage never stop practice', () => {
  const first=fixture();first.click('[data-level="hard"]');first.click('[data-world="nature"]');
  const question=first.snapshot().questions[0];enter(first,question,response(question,true));first.click('#check-button');first.click('[data-action="next"]');
  const raw=first.w.localStorage.getItem(storageKey);first.dom.window.close();
  const resumed=fixture(raw);resumed.click('[data-action="resume"]');assert.match(resumed.d.querySelector('.progress-text').textContent,/2 od 5/);resumed.dom.window.close();
  const corrupt=fixture('{bad');assert.equal(corrupt.d.querySelector('[data-action="resume"]'),null);corrupt.dom.window.close();
  const blocked=fixture(undefined,true);blocked.click('[data-level="easy"]');blocked.click('[data-world="health"]');assert.ok(blocked.d.querySelector('#check-button'));assert.deepEqual(blocked.errors,[]);blocked.dom.window.close();
});

test('all world-level and mixed selections start usable rounds', () => {
  let count=0;
  for(const level of C.levels) for(const world of [...C.worlds,{id:'mix'}]){
    const f=fixture(undefined,false,800+count);f.click(`[data-level="${level.id}"]`);f.click(`[data-world="${world.id}"]`);
    const session=f.snapshot();assert.equal(session.level,level.id);assert.equal(session.world,world.id);assert.equal(session.questions.length,world.id==='mix'?11:5);
    assert.ok(f.d.querySelector('#check-button').disabled);assert.deepEqual(f.errors,[]);f.dom.window.close();count++;
  }
  assert.equal(count,36);
});

test('assignments are removable selected controls preserve focus and repeated occurrences stay available', () => {
  const sorting=fixture(savedAtType('sort'));sorting.click('[data-action="resume"]');
  const item=sorting.d.querySelector('[data-sort-item]'),value=item.dataset.value;sorting.click(item);sorting.click('[data-sort-zone]');
  const remove=sorting.d.querySelector('[data-remove-sort]');assert.match(remove.getAttribute('aria-label'),/Ukloni/);sorting.click(remove);assert.ok(sorting.byValue('[data-sort-item]',value));sorting.dom.window.close();

  const choice=fixture(savedAtType('single'));choice.click('[data-action="resume"]');const option=choice.d.querySelector('[data-choice]');choice.click(option);
  assert.equal(choice.d.activeElement.dataset.value,option.dataset.value);assert.equal(choice.d.activeElement.getAttribute('aria-pressed'),'true');choice.dom.window.close();

  const sequence=fixture(savedAtType('order'));sequence.click('[data-action="resume"]');const q=sequence.snapshot().questions[0];
  const first=q.items[0];sequence.click(sequence.byValue('[data-sequence-item]',first));const undo=sequence.d.querySelector('[data-remove-sequence]');assert.ok(undo);sequence.click(undo);assert.ok(sequence.byValue('[data-sequence-item]',first));sequence.dom.window.close();
});

test('interface exposes accessible names focus motion and narrow-screen safeguards', () => {
  const f=fixture();for(const button of f.d.querySelectorAll('button'))assert.ok(button.textContent.trim()||button.getAttribute('aria-label'));
  assert.ok(f.d.querySelector('[aria-live="polite"]'));const css=read('styles.css');
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/min-height:\s*44px/);assert.match(css,/overflow-wrap/);assert.match(css,/max-width:\s*360px/);
  f.dom.window.close();
});

test('starting the same world again avoids the immediately previous question ids', () => {
  const f=fixture(undefined,false,1);f.click('[data-level="easy"]');f.click('[data-world="school"]');const first=new Set(f.snapshot().questions.map(question=>question.id));
  f.click('[data-action="worlds"]');f.click('[data-world="school"]');assert.equal(f.snapshot().questions.some(question=>first.has(question.id)),false);f.dom.window.close();
});
