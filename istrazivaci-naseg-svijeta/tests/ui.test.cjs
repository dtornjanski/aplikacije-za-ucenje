const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const E=require('../src/engine'),C=require('../src/content'),P=require('../src/practice');
const source=path.join(__dirname,'../src'),read=name=>fs.readFileSync(path.join(source,name),'utf8');
const prefix='world-explorers-v2/run/';
const runKey=s=>prefix+[s.level,s.world,s.lesson||'sve',s.review?'ponavljanje':'vjezba'].join('/');
function fixture({session,entries={},legacy,blocked=false,seed=207,hash='',url='https://example.test/',historyState,blockedHistory=false}={}){
  const errors=[],virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('index.html'),{url:url+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;
  w.scrollTo=(x,y)=>{w.scrollX=x;w.scrollY=y;};w.crypto.getRandomValues=v=>{v[0]=seed;return v;};
  if(historyState)w.history.replaceState(historyState,'');
  if(blockedHistory)for(const method of ['pushState','replaceState'])w.history[method]=()=>{throw Error('blocked');};
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

function navigationEvent(f,event,action){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Missing '+event)),1000);
    f.w.addEventListener(event,()=>{clearTimeout(timer);resolve();},{once:true});
    action();
  });
}

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
test('a clock choice is provisional, its submitted error stays with it across reopening, and editing clears it',async()=>{
  const refs=[{world:'spacetime',key:'sat',seed:20,example:2}];
  const s=E.createSession('easy','spacetime',101,P.buildRound('easy','spacetime',101,refs));
  const key=runKey(s);
  assert.equal(s.questions[0].answer,'03:00');
  let f=fixture({session:s});
  f.action('resume');
  const choose=time=>f.click(f.value('[data-choice]',time));
  choose('01:00');
  assert.equal(f.one('.choice.selected').getAttribute('aria-pressed'),'true');
  assert.equal(f.one('.inline-feedback, .choice-incorrect, .correct'),null);
  assert.equal(f.snapshot(key).attempts[0],0);
  f.action('check');
  const attachedError=()=>{
    const wrong=f.one('.choice.selected.choice-incorrect');
    assert.ok(wrong);
    assert.equal(wrong.dataset.value,'01:00');
    const msg=wrong.nextElementSibling;
    assert.ok(msg.matches('.inline-feedback.choice-feedback'));
    assert.equal(msg.id,wrong.getAttribute('aria-describedby'));
    assert.equal(msg.textContent,'Još nije točno. Odaberi drugi odgovor.');
    assert.equal(f.one('.check-area .inline-feedback, .correct'),null);
    assert.ok(f.one('#check-button').disabled);
    assert.equal(f.snapshot(key).attempts[0],1);
    return msg;
  };
  const error=attachedError();
  assert.equal(f.one('#answer-editor'),f.d.activeElement);
  await new Promise(resolve=>f.w.setTimeout(resolve,120));
  assert.equal(f.one('[role=status][aria-atomic=true]').textContent,error.textContent);
  const entries=f.dump();f.close();
  f=fixture({entries});f.action('resume');attachedError();
  choose('04:00');
  choose('01:00');
  assert.equal(f.one('.inline-feedback'),null);
  assert.ok(!f.one('#check-button').disabled,'a previously checked option can be checked again after editing');
  f.action('check');attachedError();
  choose('03:00');
  assert.equal(f.one('.inline-feedback, [aria-describedby="choice-feedback"], .choice-incorrect, .correct'),null);
  assert.ok(!f.one('#check-button').disabled);
  f.action('check');
  assert.equal(f.one('.feedback.correct h1').textContent,'Točno!');
  assert.equal(f.snapshot(key).attempts[0],2);
  f.action('next');
  assert.equal(f.one('.stat.warm strong').textContent,'1');
  f.close();
});

test('saved revision-three observations show both original claims in a world and in mixed practice',()=>{
  let count=0;const outcomes=new Set();
  for(const w of P.worlds)for(const [key,def] of C.banks[w.id].entries())if(def.type==='observe'){
    count++;
    const seeds=new Map();
    for(let seed=1;seed<=100&&seeds.size<4;seed++){
      const [q]=P.buildRound('hard',w.id,seed,[{world:w.id,key,seed}],3);seeds.set(q.answer,seed);
    }
    assert.equal(seeds.size,4,w.id+'-'+key);
    for(const world of [w.id,'mix'])for(const seed of seeds.values()){
      const ref={world:w.id,key,seed},s=E.createSession('hard',world,seed,P.buildRound('hard',world,seed,[ref],3),3);
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

test('route arrows stay visible at the last reachable square and undo replays the remaining sequence',async()=>{
  const ref={world:'spacetime',key:'skica',seed:47,example:20};
  const s=E.createSession('hard',ref.world,47,P.buildRound('hard',ref.world,47,[ref]));
  s.lesson='skica';
  const q=s.questions[0];
  let f=fixture({session:s});
  // School at 0, roadworks at 3, park at 5. Both →→↓ and →↓→ reach the park.
  assert.deepEqual(q.visual,{kind:'map',start:0,end:5,blocked:[3]});
  const marker=()=>f.all('.route-map td').findIndex(cell=>cell.classList.contains('map-current'));
  const undo=()=>f.all('button').find(node=>node.textContent.trim()==='Vrati potez');
  const move=name=>f.click(f.value('[data-route]',name));
  const note='Potez je upisan. Položaj se nije promijenio.';
  f.action('resume');
  for(const [name,arrow] of [['gore','↑'],['dolje','↓']]){
    move(name);
    assert.equal(marker(),0,'the marker stays at school after '+name);
    assert.match(f.one('.sequence-answer').textContent,new RegExp(arrow));
    assert.match(f.one('#app').textContent,/1 od 3/);
    assert.ok(f.one('#app').textContent.includes(note));
    assert.ok(f.one('#check-button').disabled);
    await new Promise(resolve=>f.w.setTimeout(resolve,0));
    assert.ok(f.one('#announcer').textContent.includes(note));
    move('desno');
    assert.equal(marker(),1,'the right arrow moves off the school square despite the earlier impossible arrow');
    assert.ok(!f.one('#app').textContent.includes(note));
    await new Promise(resolve=>f.w.setTimeout(resolve,0));
    assert.ok(!f.one('#announcer').textContent.includes(note));
    f.click(undo());
    assert.equal(marker(),0);
    assert.ok(f.one('#app').textContent.includes(note));
    f.click(undo());
    assert.equal(marker(),0);
    assert.match(f.one('#app').textContent,/0 od 3/);
    assert.ok(undo().disabled);
    assert.ok(!f.one('#app').textContent.includes(note));
  }
  move('desno');
  assert.equal(marker(),1);
  move('gore');
  const entries=f.dump();
  f.close();
  f=fixture({entries});
  f.action('resume');
  assert.equal(marker(),1);
  assert.match(f.one('#app').textContent,/2 od 3/);
  assert.ok(f.one('#app').textContent.includes(note));
  move('dolje');
  assert.equal(marker(),4,'the down arrow applies from the last reached square');
  assert.ok(!f.one('#app').textContent.includes(note));
  assert.match(f.one('#app').textContent,/3 od 3/);
  assert.deepEqual(f.snapshot(runKey(s)).draft.items,['desno','gore','dolje']);
  assert.equal(f.snapshot(runKey(s)).attempts[0],0);
  assert.equal(f.one('.inline-feedback'),null);
  f.click(undo());
  assert.equal(marker(),1);
  assert.ok(f.one('#app').textContent.includes(note));
  assert.equal(f.d.activeElement,undo());
  await new Promise(resolve=>f.w.setTimeout(resolve,0));
  assert.match(f.one('#announcer').textContent,/Potez je uklonjen/);
  move('dolje');
  f.click('#check-button');
  assert.ok(f.one('.inline-feedback'));
  f.click('[data-remove-sequence="1"]');
  assert.equal(marker(),4,'the remaining right and down arrows reach the centre');
  assert.ok(!f.one('#app').textContent.includes(note));
  assert.ok(f.one('#check-button').disabled);
  move('desno');
  assert.equal(marker(),5);
  assert.equal(f.snapshot(runKey(s)).phase,'answer');
  f.click('#check-button');
  assert.equal(f.one('h1').textContent,'Točno!');
  assert.equal(f.snapshot(runKey(s)).attempts[0],2);
  f.close();
});

test('all 41 textbook units open from the catalogue and a saved unit resumes at the chosen level',async()=>{
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
    await navigationEvent(f,'popstate',()=>f.action('book'));
  }
  f.click('[data-unit="str-58"]');const q=f.snapshot(prefix+'hard/health/str-58/vjezba').questions[0];
  const wrong=q.options.find(o=>o!==q.answer);enter(f,q,{selected:wrong});f.click('#check-button');
  const entries=f.dump();f.close();const g=fixture({entries});
  g.click('[data-run="hard/health/str-58/vjezba"]');assert.ok(g.one('.inline-feedback'));assert.equal(g.one('.choice.selected').dataset.value,wrong);
  enter(g,q,right(q));g.click('#check-button');assert.equal(g.one('h1').textContent,'Točno!');
  g.click('.brand');g.action('book');assert.equal(g.w.location.hash,'#gradivo');g.close();
});

function fillPage(f,value){
  const input=f.one('#book-page');
  input.value=value;
  input.dispatchEvent(new f.w.Event('input',{bubbles:true}));
}
function bookLevel(f,value){
  const select=f.one('#book-level');
  select.value=value;
  select.dispatchEvent(new f.w.Event('change',{bubbles:true}));
}

test('page lookup covers both ends of every unit, including single pages, and recovers from an unmatched entry',()=>{
  const f=fixture({hash:'#gradivo'});
  const status=f.one('#page-lookup-status');
  assert.equal(status.getAttribute('role'),'status');
  for(const unit of P.units)for(const number of new Set([unit.from,unit.to])){
    fillPage(f,String(number));
    assert.ok(status.textContent.includes(unit.name),'page '+number);
    assert.equal(f.one('#found-unit').dataset.foundUnit,unit.id);
    assert.equal(f.one('#found-unit').hash,'#vjezba/'+unit.id+'/easy');
  }
  for(const number of ['105','0','abc','5.9']){
    fillPage(f,number);assert.ok(status.textContent.length>0);
    assert.equal(f.one('[data-found-unit]'),null);
  }
  fillPage(f,'');assert.equal(status.textContent,'');
  assert.equal(f.all('.book-group').length,8);assert.equal(f.all('[data-unit]').length,41);
  assert.equal(Object.keys(f.dump()).filter(k=>k.startsWith(prefix)).length,0);
  f.close();
});

test('a found exercise keeps the query, level and focused link on Back and a fresh recipient gets independent progress',async()=>{
  const f=fixture({url:'https://example.test/app/index.html?from=letter',hash:'#gradivo'});
  fillPage(f,'59');bookLevel(f,'hard');
  const found=f.one('#found-unit'),key=prefix+'hard/health/str-58/vjezba';
  assert.match(f.one('#page-lookup-status').textContent,/Dijelovi tijela i njihove uloge.*58–59/);
  assert.equal(found.hash,'#vjezba/str-58/hard');
  f.click(found);assert.equal(f.w.location.hash,'#vjezba/str-58/hard');
  const q=f.snapshot(key).questions[0],wrong=q.options.find(x=>x!==q.answer);
  enter(f,q,{selected:wrong});f.action('check');
  await navigationEvent(f,'popstate',()=>f.w.history.back());
  assert.equal(f.one('#book-page').value,'59');assert.equal(f.one('#book-level').value,'hard');
  assert.equal(f.d.activeElement,f.one('#found-unit'));
  const mine=fixture({url:'https://example.test/app/index.html',hash:'#vjezba/str-58/hard',entries:f.dump()});
  assert.equal(mine.snapshot(key).attempts[0],1);assert.equal(mine.one('.choice.selected').dataset.value,wrong);
  const fresh=fixture({url:'https://example.test/app/index.html',hash:'#vjezba/str-58/hard'});
  assert.equal(fresh.snapshot(key).attempts[0],0);assert.equal(fresh.one('.choice.selected'),null);
  assert.equal(fresh.w.history.length,1);fresh.action('book');
  assert.equal(fresh.w.location.hash,'#gradivo');assert.equal(fresh.d.activeElement.dataset.unit,'str-58');
  const reloaded=fixture({hash:'#gradivo',historyState:JSON.parse(JSON.stringify(f.w.history.state))});
  assert.equal(reloaded.one('#book-page').value,'59');assert.equal(reloaded.one('#found-unit').hash,'#vjezba/str-58/hard');
  reloaded.close();fresh.close();mine.close();f.close();
});

test('the share control copies only the lesson and level and offers selectable text if the clipboard fails',async()=>{
  const f=fixture({url:'https://example.test/app/index.html?private=temporary',hash:'#gradivo'});
  const copied=[];
  Object.defineProperty(f.w.navigator,'clipboard',{value:{writeText:async value=>copied.push(value)},configurable:true});
  fillPage(f,'59');bookLevel(f,'medium');f.click('#share-unit');
  await new Promise(resolve=>f.w.setTimeout(resolve,0));
  assert.deepEqual(copied,['https://example.test/app/index.html#vjezba/str-58/medium']);
  assert.match(f.one('#share-feedback').textContent,/kopirana/i);
  Object.defineProperty(f.w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked');}},configurable:true});
  bookLevel(f,'hard');f.click('#share-unit');await new Promise(resolve=>f.w.setTimeout(resolve,0));
  const input=f.one('#share-url');
  assert.equal(input.value,'https://example.test/app/index.html#vjezba/str-58/hard');
  assert.equal(input.selectionStart,0);assert.equal(input.selectionEnd,input.value.length);
  assert.equal(f.d.activeElement,input);assert.equal(Object.keys(f.dump()).filter(k=>k.startsWith(prefix)).length,0);
  f.close();
});

test('a link pasted in the same tab, a damaged link and a file copy resolve without losing the catalogue',async()=>{
  const f=fixture({hash:'#gradivo'});
  await navigationEvent(f,'hashchange',()=>{f.w.location.hash='vjezba/str-96/medium';});
  assert.ok(f.one('#check-button'));assert.equal(f.snapshot(prefix+'medium/place/str-96/vjezba').lesson,'str-96');
  await navigationEvent(f,'popstate',()=>f.w.history.back());assert.ok(f.one('#book-page'));
  for(const hash of ['#vjezba','#vjezba/str-999/hard','#vjezba/str-58/nista']){
    const bad=fixture({hash});assert.ok(bad.one('#book-page'));assert.equal(bad.w.location.hash,'#gradivo');
    assert.ok(bad.one('#page-lookup-status').textContent.length>0);bad.close();
  }
  const local=fixture({url:'file:///offline/moja-vjezba.html',hash:'#gradivo',blocked:true});
  fillPage(local,'59');local.click('#share-unit');await Promise.resolve();
  assert.equal(local.one('#share-url').value,'https://aplikacije-za-ucenje.onrender.com/istrazivaci-naseg-svijeta/index.html#vjezba/str-58/easy');
  local.click('#found-unit');assert.ok(local.one('#check-button'));
  local.close();f.close();
});

test('both ways back restore the textbook unit, level, open chapters, focus and scroll; Forward loads the latest attempt',async()=>{
  for(const back of ['browser','button']){
    const f=fixture(),h=f.w.history;
    assert.equal(h.length,1);
    f.click('[data-level="hard"]');f.action('book');
    assert.equal(h.length,3);
    const unit=f.one('[data-unit="str-58"]'),groups=f.all('.book-group');
    groups[0].open=true;unit.closest('details').open=true;
    const opened=groups.filter(g=>g.open).map(g=>g.querySelector('summary').textContent);
    f.one('#book-level').focus();f.w.scrollTo(0,391);
    if(back==='button')unit.focus();
    f.click(unit);
    const key=prefix+'hard/health/str-58/vjezba',saved=f.snapshot(key),q=saved.questions[0];
    enter(f,q,{selected:q.options.find(o=>o!==q.answer)});f.click('#check-button');
    assert.equal(h.length,4);
    assert.doesNotMatch(JSON.stringify(h.state),/"(?:responses|draft|attempts)":/);
    await navigationEvent(f,'popstate',()=>back==='browser'?h.back():f.action('book'));
    assert.equal(f.one('#book-level').value,'hard');
    assert.deepEqual(f.all('.book-group[open] summary').map(g=>g.textContent),opened);
    assert.equal(f.d.activeElement,f.one('[data-unit="str-58"]'));assert.equal(f.w.scrollY,391);
    const latest=f.snapshot(key);assert.equal(latest.phase,'incorrect');
    E.submit(latest,right(q));E.advance(latest);
    const updated=JSON.parse(f.w.localStorage.getItem(key)).updated+100;
    f.w.localStorage.setItem(key,JSON.stringify({updated,state:JSON.parse(E.serialize(latest))}));
    await navigationEvent(f,'popstate',()=>h.forward());
    assert.equal(f.one('.progress-text').textContent,'Zadatak 2 od '+saved.questions.length);
    assert.equal(f.snapshot(key).attempts[0],2);assert.equal(h.length,4);f.close();
  }
});

test('direct textbook links, same-tab hash changes and refresh keep the correct screen',async()=>{
  const direct=fixture({hash:'#gradivo'});
  assert.equal(direct.w.history.length,1);assert.ok(direct.one('#book-level'));direct.close();
  const f=fixture(),h=f.w.history;
  f.click('[data-level="medium"]');
  await navigationEvent(f,'hashchange',()=>{f.w.location.hash='gradivo';});
  assert.equal(f.one('#book-level').value,'medium');assert.equal(h.length,3);
  await navigationEvent(f,'popstate',()=>h.back());
  assert.ok(f.one('[data-world="mix"]'));assert.equal(f.one('.pill').textContent,P.levels.find(l=>l.id==='medium').name);
  await navigationEvent(f,'popstate',()=>h.forward());
  const button=f.one('[data-unit="str-58"]');
  button.closest('details').open=true;button.focus();f.w.scrollTo(0,280);
  f.w.dispatchEvent(new f.w.Event('pagehide'));
  const refreshed=fixture({hash:'#gradivo',historyState:JSON.parse(JSON.stringify(h.state))});
  assert.equal(refreshed.one('#book-level').value,'medium');
  assert.ok(refreshed.one('[data-unit="str-58"]').closest('details').open);
  assert.equal(refreshed.d.activeElement.dataset.unit,'str-58');assert.equal(refreshed.w.scrollY,280);
  refreshed.close();
  await navigationEvent(f,'hashchange',()=>{f.w.location.hash='';});
  assert.ok(f.one('[data-level="easy"]'));
  await navigationEvent(f,'popstate',()=>h.back());
  assert.ok(f.one('[data-unit="str-58"]').closest('details').open);f.close();
});

test('an unavailable textbook exercise returns to its chapter without creating a run, including after refresh',async()=>{
  const f=fixture({hash:'#gradivo'});
  const key=prefix+'easy/health/str-58/vjezba',unit=f.one('[data-unit="str-58"]');
  unit.closest('details').open=true;f.click(unit);
  const playState=JSON.parse(JSON.stringify(f.w.history.state));
  const missing=fixture({historyState:playState});
  assert.equal(missing.d.activeElement.dataset.unit,'str-58');
  assert.ok(missing.d.activeElement.closest('details').open);
  assert.equal(missing.w.localStorage.getItem(key),null);missing.close();
  await navigationEvent(f,'popstate',()=>f.w.history.back());
  f.w.localStorage.removeItem(key);
  await navigationEvent(f,'popstate',()=>f.w.history.forward());
  assert.ok(f.one('#book-level'));assert.equal(f.d.activeElement.dataset.unit,'str-58');
  assert.equal(f.w.localStorage.getItem(key),null);f.close();
});

test('offline practice retains the textbook parent when local storage and browser history are unavailable',()=>{
  const f=fixture({url:'file:///offline/istrazivaci.html',hash:'#gradivo',blocked:true,blockedHistory:true});
  const unit=f.one('[data-unit="str-58"]');unit.closest('details').open=true;
  f.w.scrollTo(0,231);f.click(unit);assert.ok(f.one('#check-button'));f.action('book');
  assert.ok(f.one('[data-unit="str-58"]').closest('details').open);
  assert.equal(f.d.activeElement.dataset.unit,'str-58');assert.equal(f.w.scrollY,231);f.close();
});

test('revisiting either of two saved runs, a same-tab textbook link and a refresh always restore that run',async()=>{
  const a=make('hard','school',[0,4]),b=make('easy','home',[0,4]);
  const aKey=runKey(a),bKey=runKey(b),aLink='[data-run="'+aKey.slice(prefix.length)+'"]',bLink='[data-run="'+bKey.slice(prefix.length)+'"]';
  const f=fixture({session:a,entries:{[bKey]:JSON.stringify({updated:2,state:JSON.parse(E.serialize(b))})}}),h=f.w.history;
  f.one(aLink).closest('details').open=true;f.click(aLink);
  const wrong=a.questions[0].options.find(o=>o!==a.questions[0].answer);
  enter(f,a.questions[0],{selected:wrong});f.click('#check-button');
  f.click('.brand');f.one(bLink).closest('details').open=true;
  f.click(bLink);enter(f,b.questions[0],right(b.questions[0]));
  f.click('#check-button');f.action('next');assert.equal(h.length,4);
  await navigationEvent(f,'hashchange',()=>{f.w.location.hash='gradivo';});
  await navigationEvent(f,'popstate',()=>f.action('back-play'));
  assert.equal(f.one('h1').textContent,b.questions[1].title);assert.equal(h.length,5);
  await navigationEvent(f,'popstate',()=>h.back());
  assert.equal(f.d.activeElement,f.one(bLink));assert.ok(f.one(bLink).closest('details')?.open??true);
  await navigationEvent(f,'popstate',()=>h.back());
  assert.equal(f.one('.choice.selected').dataset.value,wrong);assert.ok(f.one('.inline-feedback'));
  enter(f,a.questions[0],right(a.questions[0]));f.click('#check-button');f.action('next');
  const refreshed=fixture({historyState:JSON.parse(JSON.stringify(h.state)),entries:f.dump()});
  assert.equal(refreshed.one('h1').textContent,a.questions[1].title);
  assert.deepEqual(refreshed.snapshot(aKey).attempts,[2,0]);assert.deepEqual(refreshed.snapshot(bKey).attempts,[1,0]);
  refreshed.close();
  await navigationEvent(f,'popstate',()=>h.forward());
  f.click(aLink);assert.equal(f.one('h1').textContent,a.questions[1].title);
  assert.deepEqual(f.snapshot(aKey).attempts,[2,0]);assert.deepEqual(f.snapshot(bKey).attempts,[1,0]);f.close();
});

test('file links can traverse between the catalogue and an in-memory exercise',async()=>{
  const f=fixture({url:'file:///offline/istrazivaci.html',hash:'#gradivo',blocked:true}),h=f.w.history;
  const unit=f.one('[data-unit="str-58"]');unit.closest('details').open=true;f.click(unit);
  assert.equal(h.length,2);assert.ok(f.one('#check-button'));
  await navigationEvent(f,'popstate',()=>h.back());assert.equal(f.d.activeElement.dataset.unit,'str-58');
  await navigationEvent(f,'popstate',()=>h.forward());assert.ok(f.one('#check-button'));f.close();
});

test('new hard body and sunset exercises show the direct question, evidence and response buttons',()=>{
  for(const [world,key] of [['health','tijelo'],['health','zglobovi'],['autumn',4],['winter',11]]){
    const s=make('hard',world,[key]),q=s.questions[0],f=fixture({session:s});f.action('resume');
    assert.equal(f.one('.prompt').textContent,q.prompt);
    assert.deepEqual(f.all('[data-choice]').map(b=>b.dataset.value),q.options);
    assert.deepEqual(f.all('.evidence-clue').map(e=>e.textContent),q.clues||[]);
    if(q.visual?.kind==='table'){
      assert.equal(f.one('.data-table caption').textContent,q.visual.caption);
      assert.deepEqual(f.all('.data-table tbody tr').map(row=>[...row.children].map(cell=>cell.textContent)),q.visual.rows);
    }
    assert.equal(f.one('#check-button').disabled,true);
    enter(f,q,right(q));f.click('#check-button');assert.equal(f.one('h1').textContent,'Točno!');f.close();
  }
});
test('loading a version-one wrong answer keeps its wording and selected choice after another reload',()=>{
  const seed=3,qs=C.buildRound('hard','school',seed),s=E.createSession('hard','school',seed,qs);
  while(!qs[s.index].options){E.submit(s,right(qs[s.index]));E.advance(s);}
  const q=qs[s.index],selected=q.options.find(v=>v!==q.answer);
  E.submit(s,{selected});
  const legacy={...JSON.parse(E.serialize(s)),version:1};delete legacy.contentRevision;
  const f=fixture({legacy});f.action('resume');
  assert.equal(f.one('.prompt').textContent,q.prompt);
  assert.equal(f.one('.choice.selected').dataset.value,selected);
  const entries=f.dump();f.close();const g=fixture({entries});g.action('resume');
  assert.deepEqual(g.all('[data-choice]').map(b=>b.dataset.value),q.options);
  enter(g,q,right(q));g.click('#check-button');assert.equal(g.snapshot(runKey(s)).attempts[s.index],2);g.close();
});
