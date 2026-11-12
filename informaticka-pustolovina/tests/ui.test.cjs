const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('../../math-site/node_modules/jsdom');
const E = require('../src/engine.js');
const C = require('../src/content.js');

const root=path.join(__dirname,'../src');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const key='info-adventure-session-v1';

function fixture(saved,blocked=false,seed=500){
  const errors=[],virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM(read('index.html'),{url:'https://info.example/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;
  w.scrollTo=()=>{}; w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
  w.crypto.getRandomValues=values=>{values[0]=seed;return values;};
  if(saved!==undefined) w.localStorage.setItem(key,typeof saved==='string'?saved:JSON.stringify(saved));
  if(blocked) Object.defineProperty(w,'localStorage',{get(){throw new Error('blocked');}});
  for(const file of ['engine.js','content.js','app.js']) w.eval(read(file));
  const click=selector=>{const node=typeof selector==='string'?d.querySelector(selector):selector;assert.ok(node,`Missing ${selector}`);node.click();};
  const byValue=(selector,value)=>[...d.querySelectorAll(selector)].find(node=>node.dataset.value===value);
  const snapshot=()=>{try{return E.restore(w.localStorage.getItem(key),C.buildRound);}catch(error){return null;}};
  return {dom,w,d,errors,click,byValue,snapshot};
}

function response(q,correct=true){
  if(['single','debug','sim'].includes(q.type)) return {selected:correct?q.answer:q.options.find(v=>v!==q.answer)};
  if(q.type==='match'){
    const pairs=q.answer.map(pair=>pair.slice());
    if(!correct) [pairs[0][1],pairs[1][1]]=[pairs[1][1],pairs[0][1]];
    return {pairs};
  }
  if(q.type==='sort'){
    const zones=Object.fromEntries(Object.entries(q.answer).map(([name,items])=>[name,items.slice()]));
    if(!correct){const names=Object.keys(zones);zones[names[1]].push(zones[names[0]].shift());}
    return {zones};
  }
  const items=q.answer.slice();
  if(!correct){const at=items.findIndex((v,i)=>i<items.length-1&&v!==items[i+1]);[items[at],items[at+1]]=[items[at+1],items[at]];}
  return {items};
}

function enter(f,q,answer){
  if(['single','debug','sim'].includes(q.type)) return f.click(f.byValue('[data-choice]',answer.selected));
  if(q.type==='match') for(const [left,right] of answer.pairs){f.click(f.byValue('[data-match-left]',left));f.click(f.byValue('[data-match-right]',right));}
  if(q.type==='sort') for(const [zone,items] of Object.entries(answer.zones)) for(const item of items){f.click(f.byValue('[data-sort-item]',item));f.click(f.byValue('[data-sort-zone]',zone));}
  if(q.type==='order') for(const item of answer.items) f.click(f.byValue('[data-order-item]',item));
}

function savedAtType(type){
  for(const level of C.levels) for(const world of C.worlds) for(let seed=1;seed<500;seed++){
    const round=C.buildRound(level.id,world.id,seed);
    if(round[0].type===type) return E.serialize(E.createSession(level.id,world.id,seed,round));
  }
  throw new Error(`No first question for ${type}`);
}

test('home, level and world navigation exposes the approved learning flow', () => {
  const f=fixture();
  assert.match(f.d.title,/Informatička pustolovina/);
  assert.match(f.d.body.textContent,/Bitko/);
  assert.equal(f.d.querySelectorAll('[data-level]').length,3);
  assert.doesNotMatch(f.d.body.textContent,/pokaži rješenje|mala pomoć/i);
  f.click('[data-level="easy"]');
  assert.equal(f.d.querySelectorAll('[data-world]').length,9);
  f.click('[data-world="computer"]');
  assert.ok(f.d.querySelector('#check-button').disabled);
  assert.match(f.d.querySelector('.progress-text').textContent,/1 od 5/);
  assert.deepEqual(f.errors,[]); f.dom.window.close();
});

test('all six interactions support incorrect retry and correct completion without revealing an answer', () => {
  for(const type of ['single','match','sort','order','debug','sim']){
    const f=fixture(savedAtType(type)); f.click('[data-action="resume"]');
    const q=f.snapshot().questions[0]; assert.equal(q.type,type);
    enter(f,q,response(q,false)); assert.equal(f.d.querySelector('#check-button').disabled,false); f.click('#check-button');
    assert.match(f.d.body.textContent,/Pogledaj još jednom/); assert.doesNotMatch(f.d.body.textContent,/Točan odgovor|Rješenje je/);
    f.click('[data-action="retry"]'); enter(f,q,response(q,true)); f.click('#check-button');
    assert.match(f.d.body.textContent,/Točno!/); assert.ok(f.d.querySelector('[data-action="next"]'));
    assert.deepEqual(f.errors,[],type); f.dom.window.close();
  }
});

test('a complete five-question round shows first-try and retry totals', () => {
  const f=fixture(); f.click('[data-level="medium"]'); f.click('[data-world="programs"]');
  for(let i=0;i<5;i++){
    const s=f.snapshot(),q=s.questions[s.index];
    if(i===0){enter(f,q,response(q,false));f.click('#check-button');f.click('[data-action="retry"]');}
    enter(f,q,response(q,true)); f.click('#check-button'); f.click('[data-action="next"]');
  }
  assert.match(f.d.querySelector('h1').textContent,/Bravo/);
  assert.deepEqual([...f.d.querySelectorAll('.stat strong')].map(n=>n.textContent),['4','1']);
  assert.deepEqual(f.errors,[]); f.dom.window.close();
});

test('resume survives reload while corrupt and blocked storage never prevent practice', () => {
  const first=fixture(); first.click('[data-level="hard"]'); first.click('[data-world="internet"]');
  const q=first.snapshot().questions[0]; enter(first,q,response(q,true)); first.click('#check-button'); first.click('[data-action="next"]');
  const raw=first.w.localStorage.getItem(key); first.dom.window.close();
  const resumed=fixture(raw); resumed.click('[data-action="resume"]'); assert.match(resumed.d.querySelector('.progress-text').textContent,/2 od 5/); resumed.dom.window.close();
  const corrupt=fixture('{bad'); assert.equal(corrupt.d.querySelector('[data-action="resume"]'),null); corrupt.dom.window.close();
  const blocked=fixture(undefined,true); blocked.click('[data-level="easy"]'); blocked.click('[data-world="safety"]');
  assert.ok(blocked.d.querySelector('#check-button')); assert.deepEqual(blocked.errors,[]); blocked.dom.window.close();
});

test('interface provides accessible names, focus styles and reduced-motion support', () => {
  const f=fixture();
  for(const button of f.d.querySelectorAll('button')) assert.ok(button.textContent.trim()||button.getAttribute('aria-label'));
  const css=read('styles.css');
  assert.match(css,/prefers-reduced-motion/); assert.match(css,/:focus-visible/); assert.match(css,/min-height:\s*44px/); assert.match(css,/overflow-wrap/); assert.match(css,/max-width:\s*420px/);
  assert.ok(f.d.querySelector('[aria-live="polite"]')); f.dom.window.close();
});

test('all 24 world-level selections and three mixed selections start a usable round', () => {
  let count=0;
  for(const level of C.levels) for(const world of [...C.worlds,{id:'mix'}]){
    const f=fixture(undefined,false,700+count);
    f.click(`[data-level="${level.id}"]`); f.click(`[data-world="${world.id}"]`);
    const s=f.snapshot();
    assert.equal(s.level,level.id); assert.equal(s.world,world.id);
    assert.equal(s.questions.length,world.id==='mix'?8:5);
    assert.ok(f.d.querySelector('#check-button').disabled);
    assert.deepEqual(f.errors,[]); f.dom.window.close(); count++;
  }
  assert.equal(count,27);
});

test('sorting assignments can be removed accessibly and malformed drafts never expose resume', () => {
  const f=fixture(savedAtType('sort')); f.click('[data-action="resume"]');
  const item=f.d.querySelector('[data-sort-item]'),value=item.dataset.value;
  f.click(item); f.click('[data-sort-zone]');
  const remove=f.d.querySelector('[data-remove-sort]');
  assert.ok(remove); assert.match(remove.getAttribute('aria-label'),/Ukloni/);
  f.click(remove);
  assert.ok(f.byValue('[data-sort-item]',value));
  assert.deepEqual(f.errors,[]); f.dom.window.close();

  const raw=JSON.parse(savedAtType('sort')); raw.responses[0]={zones:{}};
  const corrupt=fixture(raw);
  assert.equal(corrupt.d.querySelector('[data-action="resume"]'),null);
  assert.deepEqual(corrupt.errors,[]); corrupt.dom.window.close();
});

test('simulations have a distinct visual workspace and answer interactions preserve keyboard focus', () => {
  const sim=fixture(savedAtType('sim')); sim.click('[data-action="resume"]');
  assert.ok(sim.d.querySelector('.simulator'));
  assert.ok(sim.d.querySelector('.sim-screen'));
  assert.equal(sim.d.querySelector('.choices'),null);
  sim.dom.window.close();

  const f=fixture(savedAtType('single')); f.click('[data-action="resume"]');
  const choice=f.d.querySelector('[data-choice]'); f.click(choice);
  assert.equal(f.d.activeElement.dataset.value,choice.dataset.value);
  assert.equal(f.d.activeElement.getAttribute('aria-pressed'),'true');
  f.dom.window.close();
});

test('starting the same world again avoids every question from the previous round', () => {
  const f=fixture(undefined,false,1);
  f.click('[data-level="easy"]'); f.click('[data-world="computer"]');
  const first=new Set(f.snapshot().questions.map(q=>q.id));
  f.click('[data-action="worlds"]'); f.click('[data-world="computer"]');
  const second=f.snapshot().questions.map(q=>q.id);
  assert.equal(second.some(id=>first.has(id)),false);
  f.dom.window.close();
});
