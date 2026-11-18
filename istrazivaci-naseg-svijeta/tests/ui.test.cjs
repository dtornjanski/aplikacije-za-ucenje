const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('../../math-site/node_modules/jsdom');
const E=require('../src/engine'),C=require('../src/content'),P=require('../src/practice');
const source=path.join(__dirname,'../src'),read=name=>fs.readFileSync(path.join(source,name),'utf8');
const prefix='world-explorers-v2/run/';
const runKey=s=>prefix+[s.level,s.world,s.lesson||'sve',s.review?'ponavljanje':'vjezba'].join('/');
function fixture({session,entries={},legacy,blocked=false,seed=207,hash=''}={}){
  const errors=[],virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('index.html'),{url:'https://example.test/'+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;
  w.scrollTo=()=>{};w.crypto.getRandomValues=v=>{v[0]=seed;return v;};
  for(const [key,value] of Object.entries(entries))w.localStorage.setItem(key,value);
  if(session)w.localStorage.setItem(runKey(session),JSON.stringify({updated:1,state:JSON.parse(E.serialize(session))}));
  if(legacy)w.localStorage.setItem('world-explorers-session-v1',JSON.stringify(legacy));
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
  for(const file of ['engine','content','lessons','activities','book','practice','app'])w.eval(read(file+'.js'));
  const one=s=>d.querySelector(s),all=s=>[...d.querySelectorAll(s)];
  function click(s){
    const node=typeof s==='string'?one(s):s;
    assert.ok(node,'Missing button '+s);assert.ok(!node.disabled,'Disabled '+node.outerHTML);node.click();
  }
  const action=a=>click('[data-action="'+a+'"]');
  const value=(q,v)=>all(q).find(b=>b.dataset.value===v);
  const snapshot=key=>E.restore(JSON.parse(w.localStorage.getItem(key)).state,P.buildRound);
  const dump=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];}));
  const close=()=>{dom.window.close();assert.deepEqual(errors,[]);};
  return {w,d,one,all,click,action,value,snapshot,dump,close};
}
function make(level,world,keys){
  const refs=keys.map((key,i)=>({world,key,seed:22+i,...(typeof key==='string'?{example:i}: {})}));
  return E.createSession(level,world,101,P.buildRound(level,world,101,refs));
}
function enter(f,q,response){
  if(q.options)return f.click(f.value('[data-choice]',response.selected));
  if(q.type==='match')for(const [a,b] of response.pairs){f.click(f.value('[data-match-left]',a));f.click(f.value('[data-match-right]',b));}
  else if(q.type==='sort')for(const [z,items] of Object.entries(response.zones))for(const item of items){f.click(f.value('[data-sort-item]',item));f.click(f.value('[data-sort-zone]',z));}
  else for(const item of response.items)f.click(f.value(q.type==='route'?'[data-route]':'[data-sequence-item]',item));
}
const right=q=>q.options?{selected:q.answer}:q.left?{pairs:q.answer}:q.zones?{zones:q.answer}:{items:q.answer};

test('all topic, level and mixed entry points work without a sign-in or answer reveal',()=>{
  for(const level of P.levels)for(const w of [...P.worlds,{id:'mix'}]){
    const f=fixture();assert.equal(new Set(f.all('[data-level]').map(b=>b.textContent)).size,3);
    f.click('[data-level="'+level.id+'"]');assert.equal(f.all('[data-world]').length,12);assert.equal(f.all('[data-world]')[0].dataset.world,'mix');
    f.click('[data-world="'+w.id+'"]');
    const key=prefix+level.id+'/'+w.id+'/sve/vjezba',s=f.snapshot(key);
    assert.equal(s.questions.length,w.id==='mix'?11:5);
    assert.equal(f.one('#check-button').disabled,true);
    assert.doesNotMatch(f.d.body.textContent,/pokaži rješenje|mala pomoć/i);f.close();
  }
});
test('every original hard observation shows both actual claims before submission in a world and in mixed practice',()=>{
  let count=0;const outcomes=new Set();
  for(const w of P.worlds)for(const [key,def] of C.banks[w.id].entries())if(def.type==='observe'){
    count++;
    const seeds=new Map();
    for(let seed=1;seed<=100&&seeds.size<4;seed++){
      const [q]=P.buildRound('hard',w.id,seed,[{world:w.id,key,seed}]);seeds.set(q.answer,seed);
    }
    assert.equal(seeds.size,4,w.id+'-'+key);
    for(const world of [w.id,'mix'])for(const seed of seeds.values()){
      const ref={world:w.id,key,seed},s=E.createSession('hard',world,seed,P.buildRound('hard',world,seed,[ref]));
      const f=fixture({session:s});f.action('resume');const q=s.questions[0];
      assert.deepEqual(f.all('.evidence-clue').map(e=>e.textContent),q.clues);assert.ok(q.clues.every(c=>c.length>12));
      assert.deepEqual(f.all('[data-choice]').map(b=>b.dataset.value),q.options);assert.equal(f.one('#check-button').disabled,true);
      outcomes.add(q.answer);f.close();
    }
  }
  assert.equal(count,21);assert.equal(outcomes.size,4);
});
test('all interaction types allow a correction in place, keep attempts and lock after success',()=>{
  for(const key of [0,1,2,3,4,5,6,'skica']){
    const world=key==='skica'?'spacetime':'school',s=make('hard',world,[key]),q=s.questions[0],f=fixture({session:s});
    f.action('resume');const wrong=structuredClone(right(q));
    if(q.options)wrong.selected=q.options.find(v=>v!==q.answer);
    else if(q.left)[wrong.pairs[0][1],wrong.pairs[1][1]]=[wrong.pairs[1][1],wrong.pairs[0][1]];
    else if(q.zones)wrong.zones[q.zones[1]].push(wrong.zones[q.zones[0]].pop());
    else if(q.type==='route')wrong.items=Array(q.answer.length).fill(q.visual.start%3===0?'lijevo':'desno');
    else wrong.items.reverse();
    assert.equal(E.check(q,wrong),false);
    enter(f,q,wrong);f.click('#check-button');assert.ok(f.one('.inline-feedback'));assert.ok(f.one('#check-button').disabled);
    assert.equal(f.one('h1').textContent,q.title);const saved=f.snapshot(runKey(s));assert.deepEqual(saved.draft,wrong);
    f.click('.brand');f.action('resume');assert.deepEqual(f.snapshot(runKey(s)).draft,wrong);assert.ok(f.one('.inline-feedback'));
    if(q.options)enter(f,q,right(q));
    else if(q.left){
      f.click(f.all('[data-remove-pair]')[1]);f.click(f.all('[data-remove-pair]')[0]);assert.equal(f.all('[data-remove-pair]').length,q.answer.length-2);
      enter(f,q,{pairs:q.answer.slice(0,2)});
    }else if(q.zones){
      const item=q.answer[q.zones[0]].at(-1);f.click(f.all('[data-remove-sort]').find(b=>b.textContent.includes(item)));
      f.click(f.value('[data-sort-zone]',q.zones[0]));
    }else if(q.type==='route'){
      while(f.one('[data-remove-sequence]'))f.click(f.one('[data-remove-sequence]'));enter(f,q,right(q));
    }else{
      for(let i=0;i<q.answer.length;i++){
        const selected=f.snapshot(runKey(s)).draft.items;
        let at=selected.indexOf(q.answer[i]);while(at>i){f.click('[data-move="'+at+'"][data-delta="-1"]');at--;}
      }
    }
    f.click('#check-button');assert.match(f.one('h1').textContent,/Točno!/);assert.equal(f.snapshot(runKey(s)).attempts[0],2);
    f.action('next');assert.deepEqual(f.all('.stat strong').map(e=>e.textContent),['0','1']);f.close();
  }
});
test('draft, pending selection and progress survive a reload and switching worlds',()=>{
  const s=make('medium','school',[1,0]),q=s.questions[0],f=fixture({session:s});f.action('resume');
  enter(f,q,{pairs:[q.answer[0]]});f.click(f.value('[data-match-left]',q.answer[1][0]));
  f.click('.brand');assert.match(f.one('.resume strong').textContent,/Škola/);f.click('[data-level="easy"]');f.click('[data-world="spring"]');
  f.click('.brand');assert.equal(f.all('[data-action="resume"]').length,2);
  const entries=f.dump();f.close();const again=fixture({entries});
  again.click('[data-run="medium/school/sve/vjezba"]');assert.equal(again.all('[data-remove-pair]').length,1);
  assert.ok(again.value('[data-match-right]',q.answer[1][1])&&!again.value('[data-match-right]',q.answer[1][1]).disabled);
  again.click(again.value('[data-match-right]',q.answer[1][1]));assert.equal(again.all('[data-remove-pair]').length,2);
  again.action('worlds');again.click('[data-world="school"]');assert.equal(again.all('[data-remove-pair]').length,2);again.close();
});
test('all 13 named lessons open from their own topic, the result offers fresh targeted work only for misses',()=>{
  for(const lesson of P.lessons){
    const f=fixture();f.click('[data-level="easy"]');f.click('[data-lessons="'+lesson.world+'"]');f.click('[data-lesson="'+lesson.id+'"]');
    const key=prefix+'easy/'+lesson.world+'/'+lesson.id+'/vjezba',s=f.snapshot(key);assert.equal(s.questions.length,5);
    assert.ok(s.questions.every(q=>q.lesson===lesson.id));assert.equal(new Set(s.questions.map(q=>q.ref.example)).size,5);
    f.close();
  }
  const f=fixture();f.click('[data-level="hard"]');f.click('[data-lessons="spacetime"]');f.click('[data-lesson="sat"]');
  const key=prefix+'hard/spacetime/sat/vjezba',s=f.snapshot(key);
  for(const [i,q] of s.questions.entries()){
    assert.ok(f.one('.clock-face[role="img"]'));
    if(i===2){enter(f,q,{selected:q.options.find(o=>o!==q.answer)});f.click('#check-button');}
    enter(f,q,right(q));f.click('#check-button');f.action('next');
  }
  assert.deepEqual(f.all('.stat strong').map(n=>n.textContent),['4','1']);f.action('review');
  const review=f.snapshot(prefix+'hard/spacetime/sat/ponavljanje');
  assert.equal(review.questions.length,1);assert.notEqual(review.questions[0].ref.example,s.questions[2].ref.example);
  enter(f,review.questions[0],right(review.questions[0]));f.click('#check-button');f.action('next');assert.equal(f.one('[data-action="review"]'),null);f.close();
});
test('a legacy round keeps its solved questions and attempts on upgrade and blocked storage remains playable',()=>{
  const old=E.createSession('hard','mix',49,C.buildRound('hard','mix',49));
  E.submit(old,right(old.questions[0]));E.advance(old);
  const legacy={...JSON.parse(E.serialize(old)),version:1};
  const f=fixture({legacy});f.action('resume');const restored=f.snapshot(runKey(old));assert.equal(restored.index,1);assert.equal(restored.solved[0],true);assert.equal(restored.attempts[0],1);
  assert.equal(restored.questions[1].world,old.questions[1].world);f.close();
  const broken=fixture({entries:{[prefix+'bad']:'{unreadable','world-explorers-v2/history':'{"easy/school":"bad"}'}});
  broken.click('[data-level="easy"]');broken.click('[data-world="school"]');assert.ok(broken.one('#check-button'));broken.close();
  const blocked=fixture({blocked:true});blocked.click('[data-level="hard"]');blocked.click('[data-lessons="spacetime"]');blocked.click('[data-lesson="kalendar"]');
  assert.ok(blocked.one('.calendar'));blocked.click('.brand');blocked.action('resume');assert.ok(blocked.one('.calendar'));blocked.close();
});
test('contextual sort picker, step names, keyboard focus and motion preferences are exposed',()=>{
  const s=make('hard','spacetime',[2]),f=fixture({session:s});f.action('resume');const v=f.one('[data-sort-item]').dataset.value;
  f.click(f.value('[data-sort-item]',v));assert.equal(f.one('[data-sort-zone]').closest('.sort-unit').querySelector('[data-sort-item]').dataset.value,v);
  assert.equal(f.d.activeElement,f.one('[data-sort-zone]'));f.click('[data-sort-zone]');assert.ok(f.one('[data-remove-sort]'));f.close();
  const seq=make('hard','home',[3]),g=fixture({session:seq});g.action('resume');const item=seq.questions[0].items[0];g.click(g.value('[data-sequence-item]',item));
  assert.ok(g.one('[data-remove-sequence]').getAttribute('aria-label').includes(item));assert.ok(g.one('[aria-live="polite"]'));g.close();
  assert.match(read('styles.css'),/prefers-reduced-motion/);
});

test('all 41 textbook units open from the catalogue and a saved unit resumes at the chosen level',()=>{
  const f=fixture({hash:'#gradivo'});
  assert.equal(f.one('h1').textContent,'Gradivo prema udžbeniku');
  assert.equal(f.all('.book-group').length,8);
  assert.equal(f.all('[data-unit]').length,41);
  f.one('#book-level').value='hard';
  f.one('#book-level').dispatchEvent(new f.w.Event('change',{bubbles:true}));
  for(const unit of P.units){
    const button=f.one('[data-unit="'+unit.id+'"]');button.closest('details').open=true;f.click(button);
    const saved=f.snapshot(prefix+'hard/'+unit.world+'/'+unit.id+'/vjezba');
    assert.equal(saved.lesson,unit.id);assert.equal(saved.level,'hard');assert.ok(f.one('#check-button'));
    f.action('book');
  }
  f.click('[data-unit="str-58"]');const q=f.snapshot(prefix+'hard/health/str-58/vjezba').questions[0];
  const wrong=q.options.find(o=>o!==q.answer);enter(f,q,{selected:wrong});f.click('#check-button');
  const entries=f.dump();f.close();const g=fixture({entries});
  g.click('[data-run="hard/health/str-58/vjezba"]');assert.ok(g.one('.inline-feedback'));assert.equal(g.one('.choice.selected').dataset.value,wrong);
  enter(g,q,right(q));g.click('#check-button');assert.equal(g.one('h1').textContent,'Točno!');
  g.click('.brand');g.action('book');assert.equal(g.w.location.hash,'#gradivo');g.close();
});
