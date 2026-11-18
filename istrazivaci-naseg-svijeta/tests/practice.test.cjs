const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../src/engine'),C=require('../src/content'),P=require('../src/practice');
const response=q=>q.options?{selected:q.answer}:q.left?{pairs:q.answer}:q.zones?{zones:q.answer}:{items:q.answer};
const build=(world,key,level='hard',seed=26,example=0,review=false,revision)=>P.buildRound(level,world,seed,[{world,key,seed,example,review}],revision)[0];

test('every current family at all three levels can be completed, including every diagram and review type',()=>{
  let checked=0;
  for(const w of P.worlds)for(const level of P.levels){
    const keys=P.keys[w.id];
    for(const key of keys){
      for(let i=0;i<(P.lessonById.get(key)?.cases||6);i++)for(const review of [true,false]){
        const q=build(w.id,key,level.id,i+3,i,review),s=E.createSession(level.id,w.id,9,[q]),answer=response(q);
        if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.includes(q.answer));assert.ok(q.options.length>=2);}
        assert.equal(E.submit(s,answer),'correct',q.id);E.advance(s);
        const saved=E.restore(E.serialize(s),P.buildRound);assert.deepEqual(saved.questions,s.questions);assert.deepEqual(saved.attempts,[1]);checked++;
      }
    }
  }
  assert.ok(checked>4500);
});
test('all 65 original two-speaker families retain the four verdicts in saved revision three',()=>{
  let count=0;
  for(const w of P.worlds)for(const [key,def] of C.banks[w.id].entries()){
    if(!['observe','cause','single'].includes(def.type))continue;
    const verdicts=new Set();
    for(let seed=1;seed<150&&verdicts.size<4;seed++){
      const q=build(w.id,key,'hard',seed,0,false,3);assert.equal(q.clues.length,2);
      assert.ok(q.clues.every(c=>c.length>14&&!c.includes('undefined')));verdicts.add(q.answer);
    }
    assert.equal(verdicts.size,4,w.id+'/'+key);count++;
  }
  assert.equal(count,65);
});
test('grading permits independent actions but enforces prerequisites, routes and transport groups',()=>{
  const bedroom=build('home',3),a=bedroom.answer;
  assert.ok(E.check(bedroom,{items:[a[0],a[1],a[3],a[2],a[4]]}));
  assert.equal(E.check(bedroom,{items:[a[4],a[1],a[3],a[2],a[0]]}),false);
  const washing=build('health',3),b=washing.answer;assert.equal(E.check(washing,{items:[b[0],b[3],b[2],b[1],b[4]]}),false);
  const transport=build('spacetime',2);assert.ok(transport.answer.voda.includes('jedrilica s jedrom'));assert.ok(transport.answer.zrak.includes('zrakoplovna jedrilica'));
  let alternatives=0,obstacles=0;
  for(let n=0;n<24;n++){
    const q=build('spacetime','skica','hard',47,n);
    const paths=[];
    for(const a of q.items)for(const b of q.items)for(const c of q.items)paths.push([a,b,c]);
    const start=q.visual.start,end=q.visual.end;
    for(const path of paths){
      let x=start%3,y=Math.floor(start/3),valid=true;
      for(const step of path){if(step==='lijevo')x--;if(step==='desno')x++;if(step==='gore')y--;if(step==='dolje')y++;
        if(x<0||x>2||y<0||y>2){valid=false;break;}if(q.visual.blocked.includes(3*y+x)){valid=false;obstacles++;break;}}
      const expected=valid&&y*3+x===end;
      assert.equal(E.check(q,{items:path}),expected);
      if(expected&&JSON.stringify(path)!==JSON.stringify(q.answer))alternatives++;
    }
  }
  assert.ok(alternatives>0&&obstacles>0);
});
test('history spans all families before reuse, including across mixed and lesson rounds',()=>{
  for(const l of P.levels)for(const w of P.worlds){
    const history={},seen=new Set(),all=P.keys[w.id].length;let previous=[];
    for(let n=0;n<Math.ceil(all/5)+1;n++){
      const plan=P.makePlan(l.id,w.id,n,history),keys=plan.map(r=>r.key);
      assert.equal(new Set(keys).size,5);assert.ok(keys.every(k=>!previous.includes(k)));
      for(const k of keys){if(seen.size<all)assert.equal(seen.has(k),false);seen.add(k);}
      P.record(history,l.id,plan);previous=keys;
    }
    assert.equal(seen.size,all);
  }
  const history={},first=P.makePlan('easy','mix',9,history);P.record(history,'easy',first);
  assert.equal(new Set(first.map(ref=>ref.world)).size,11);
  for(const ref of first)assert.ok(!P.makePlan('easy',ref.world,88,history).some(r=>r.key===ref.key));
  for(const l of P.lessons){
    const history={},seen=new Set();
    for(let i=0;i<Math.ceil(l.cases/5);i++){
      const plan=P.makePlan('hard',l.world,i,history,l.id);P.record(history,'hard',plan);
      assert.equal(new Set(plan.map(r=>r.example)).size,5);
      for(const r of plan){if(seen.size<l.cases)assert.ok(!seen.has(r.example));seen.add(r.example);}
    }
    assert.equal(seen.size,l.cases);
  }
});
test('calendar weekday alignment, leap day and clock arithmetic agree with an independent date calculation',()=>{
  const days=['nedjelja','ponedjeljak','utorak','srijeda','četvrtak','petak','subota'];
  for(let i=0;i<24;i++){
    const q=build('spacetime','kalendar','medium',5,i),v=q.visual;
    assert.equal(q.answer,days[new Date(Date.UTC(v.year,i%12,v.day)).getUTCDay()]);
    assert.equal(v.count,new Date(Date.UTC(v.year,i%12+1,0)).getUTCDate());
    const hard=build('spacetime','kalendar','hard',5,i),delta=Number(hard.prompt.match(/je (\d+) dana/)[1]);
    assert.equal(parseInt(hard.answer),v.day+(hard.prompt.includes('nakon')?delta:-delta));
  }
  assert.equal(build('spacetime','kalendar','easy',7,13).visual.count,29);
  for(let n=0;n<12;n++){
    const q=build('spacetime','sat','hard',3,n),v=q.visual,departure=q.prompt.match(/polazi u (\d+):(\d+)/);
    assert.equal(Number(departure[1])*60+Number(departure[2])-v.h*60-v.m,parseInt(q.answer));
    const medium=build('spacetime','sat','medium',8,n),time=medium.visual.h*60+medium.visual.m;
    const row=medium.visual.detail.rows.find(([t])=>{const [h,m]=t.split(':').map(Number);return h*60+m===time;});assert.equal(row[1],medium.answer);
  }
});
test('duplicate checks do not inflate attempts and corrupted drafts never restore',()=>{
  const q=build('school',1),s=E.createSession('hard','school',17,[q]),wrong=q.answer.map(p=>p.slice());
  [wrong[0][1],wrong[1][1]]=[wrong[1][1],wrong[0][1]];
  assert.equal(E.submit(s,{pairs:wrong}),'incorrect');assert.equal(E.submit(s,{pairs:wrong.slice().reverse()}),'unchanged');assert.equal(s.attempts[0],1);
  const saved=JSON.parse(E.serialize(s));
  for(const change of [{draft:{pairs:[['nepoznato','x']]}},{plan:[{world:'other',key:1,seed:1}]},{phase:'incorrect',draft:{pairs:[]}},
    {pending:q.answer[0][0]},{plan:[{world:'school',key:333,seed:3}]}])assert.equal(E.restore({...saved,...change},P.buildRound),null);
});

test('each route deck has 24 distinct visible maps and targeted practice changes the path a pupil actually used',()=>{
  const signature=q=>JSON.stringify(q.visual);
  for(const {id:level} of P.levels){
    const all=Array.from({length:24},(_,i)=>build('spacetime','skica',level,1,i));
    assert.equal(new Set(all.map(signature)).size,24);
    for(let seed=0;seed<160;seed++){
      const plan=P.makePlan(level,'spacetime',seed,{},'skica');
      const first=P.buildRound(level,'spacetime',seed,plan);
      assert.equal(new Set(first.map(signature)).size,5);
      const mistakes=first.map(q=>{
        let paths=[[]];
        for(let i=0;i<q.answer.length;i++)paths=paths.flatMap(p=>q.items.map(m=>[...p,m]));
        const accepted=paths.filter(path=>E.check(q,{items:path}));
        return {...q.ref,previousMoves:accepted[(seed+1)%accepted.length]};
      });
      const repeat=P.makePlan(level,'spacetime',seed,{},'skica',mistakes);
      const next=P.buildRound(level,'spacetime',seed,repeat);
      assert.equal(new Set([...first,...next].map(signature)).size,10);
      for(const [i,q] of next.entries()){
        assert.equal(E.check(q,{items:first[i].answer}),false);
        assert.equal(E.check(q,{items:mistakes[i].previousMoves}),false);
      }
    }
  }
});

test('an unfinished revision-three route restores its blocked middle arrow and its ungraded position',()=>{
  const saved={
    version:2,contentRevision:3,level:'hard',world:'spacetime',lesson:'skica',seed:47,
    plan:[{world:'spacetime',key:'skica',seed:47,example:12}],review:false,index:0,
    phase:'answer',attempts:[0],solved:[false],responses:[null],credited:[],pending:null,
    draft:{items:['dolje','dolje']}
  };
  const resumed=P.restore(saved);
  assert.ok(resumed);
  const q=resumed.questions[0];
  assert.deepEqual(q.visual,{kind:'map',start:2,end:7,blocked:[8]});
  assert.deepEqual(resumed.draft,saved.draft);
  assert.equal(E.submit(resumed,resumed.draft),'empty');
  assert.equal(resumed.attempts[0],0);
  assert.deepEqual(E.traceRoute(q.visual,resumed.draft.items),{position:5,firstInvalidIndex:1,lastMoveInvalid:true});
  resumed.draft.items.push('lijevo');
  const savedAgain=P.restore(JSON.parse(E.serialize(resumed)));
  assert.deepEqual(E.traceRoute(q.visual,savedAgain.draft.items),{position:4,firstInvalidIndex:1,lastMoveInvalid:false});
  assert.equal(E.submit(resumed,resumed.draft),'incorrect');
  assert.equal(resumed.attempts[0],1);
});
test('book units cover every page traced to the teaching plan and have distinct playable activities',()=>{
  const b=require('../src/book');
  assert.equal(b.units.length,41);
  assert.equal(b.groups.length,8);
  assert.equal(Object.keys(b.extraNames).length,21);
  assert.deepEqual(b.units.flatMap(u=>Array.from({length:u.to-u.from+1},(_,i)=>u.from+i)),Array.from({length:94},(_,i)=>6+i));
  for(const unit of b.units)for(const {id:level} of P.levels){
    const plan=P.makePlan(level,unit.world,2,{},unit.id);
    assert.deepEqual(new Set(plan.map(r=>r.key)),new Set(unit.keys));
    const qs=P.buildRound(level,unit.world,2,plan);
    for(const q of qs){assert.equal(q.lesson,unit.id);assert.ok(E.check(q,response(q)));}
    const again=P.makePlan(level,unit.world,9,{},unit.id,[plan[0]]);
    assert.equal(P.buildRound(level,unit.world,9,again)[0].lesson,unit.id);
  }
  for(const review of [true,false])for(let seed=1;seed<24;seed++){
    const q=build('autumn',4,'medium',seed,0,review);
    const hours=q.visual.rows.map(([,rise,set])=>Number(set.split(':')[0])-Number(rise.split(':')[0]));
    assert.deepEqual(hours,[12,10]);assert.equal(q.answer,review?'za 120 minuta':'za 2 sata');
    assert.doesNotMatch(JSON.stringify(q),/zaustavlja sat|gase žarulje/);
  }
});
test('an existing version-two round retains attempted answers, drafts and uses fresh materials for later items',()=>{
  const level='medium',world='spacetime';
  const old=Array.from({length:5},(_,i)=>({world,key:'skica',seed:i+1,example:i,legacy:true}));
  const s=E.createSession(level,world,3,P.buildRound(level,world,3,old));s.lesson='skica';
  E.submit(s,response(s.questions[0]));E.advance(s);
  s.draft={items:[s.questions[1].answer[0]]};
  const saved=JSON.parse(E.serialize(s));delete saved.contentRevision;
  for(const ref of saved.plan)delete ref.legacy;
  const restored=P.restore(saved);assert.ok(restored);assert.deepEqual(restored.draft,s.draft);
  assert.deepEqual(restored.questions.slice(0,2),s.questions.slice(0,2));
  assert.equal(new Set(restored.questions.map(q=>JSON.stringify(q.visual))).size,5);
  assert.ok(restored.questions.slice(2).every(q=>!q.ref.legacy));assert.deepEqual(restored.attempts,[1,0,0,0,0]);
  assert.equal(restored.contentRevision,3);
  let continued=P.restore(E.serialize(restored));
  for(let i=restored.index;i<restored.questions.length;i++){
    assert.deepEqual(continued.questions,restored.questions);assert.equal(continued.index,i);
    E.submit(continued,response(continued.questions[i]));E.advance(continued);continued=P.restore(E.serialize(continued));
  }
  assert.equal(continued.phase,'complete');assert.deepEqual(continued.questions,restored.questions);
  const ref={world:'autumn',key:4,seed:22,legacy:true};
  const before=E.createSession('easy','autumn',3,P.buildRound('easy','autumn',3,[ref]));
  const wrong={selected:before.questions[0].options.find(v=>v!==before.questions[0].answer)};
  E.submit(before,wrong);const raw=JSON.parse(E.serialize(before));delete raw.contentRevision;delete raw.plan[0].legacy;
  const same=P.restore(raw);assert.deepEqual(same.draft,wrong);assert.deepEqual(same.questions,before.questions);assert.equal(same.phase,'incorrect');
  assert.equal(E.submit(same,response(same.questions[0])),'correct');
});

test('revision three reproduces the published assignments for all 166 families',()=>{
  const hash=require('node:crypto').createHash('sha256');
  let count=0;
  for(const {id:level} of P.levels)for(const {id:world} of P.worlds)for(const key of P.keys[world]){
    for(const seed of [1,26,94])for(const review of [false,true]){
      const example=seed%(P.lessonById.get(key)?.cases||6);
      hash.update(JSON.stringify(build(world,key,level,seed,example,review,3))+'\n');count++;
    }
  }
  assert.equal(count,166*3*3*2);
  // Digest of these assignments from the public revision-three HTML, including visual data and option order.
  assert.equal(hash.digest('hex'),'2fc996bf191c4400d862078dbb0d23f5e0bfbfee126d75c27fb5a8f2e9430fa1');
});
test('all 86 former two-speaker families have a fresh review example and a single gradeable answer',()=>{
  const pairs=new Set(['winter/11','spring/7','summer/10','nature/10']);
  let direct=0,paired=0;
  for(const {id:world} of P.worlds)for(const key of P.keys[world]){
    if(!build(world,key,'hard',26,0,false,3).clues)continue;
    const [first,repeat]=[false,true].map(review=>build(world,key,'hard',26,0,review));
    assert.notDeepEqual([first.prompt,first.visual],[repeat.prompt,repeat.visual],world+'/'+key);
    for(const q of [first,repeat]){
      assert.equal(q.options.length,4,q.id);
      assert.deepEqual(q.options.filter(selected=>E.check(q,{selected})),[q.answer],q.id);
      if(pairs.has(world+'/'+key))assert.equal(q.clues.length,2,q.id);
      else {assert.equal(q.clues,undefined,q.id);assert.doesNotMatch(q.prompt,/Procijeni oba|Tko je u pravu/);}
    }
    if(first.clues)paired++;else direct++;
  }
  assert.equal(paired,4);assert.equal(direct,82);
});
test('the body exercise requires a concrete action and sunset answers follow from the actual table',()=>{
  for(const key of ['tijelo','zglobovi'])for(const review of [false,true])for(let seed=1;seed<=48;seed++){
    const q=build('health',key,'hard',seed,0,review);
    assert.equal(q.clues,undefined);assert.ok(q.prompt.length<=100,q.prompt);
    assert.ok(q.options.every(option=>option.length<=37),q.options.join(', '));
  }
  const q=build('autumn',4),review=build('autumn',4,'hard',2,0,true);
  assert.equal(q.prompt,'U kojem će mjesecu u 18 sati Sunce već zaći?');
  assert.deepEqual(q.visual.rows,[['rujan','19:00'],['studeni','17:00']]);
  assert.equal(q.answer,'U studenome.');assert.equal(review.answer,'U listopadu.');
  assert.deepEqual(review.visual.rows,[['listopad','18:00'],['prosinac','16:00']]);
});
test('revision-three rounds keep their entire assignment, draft and attempts after repeated saves up to completion',()=>{
  const refs=['tijelo','zglobovi'].map((key,i)=>({world:'health',key,unit:'str-58',seed:22+i})),qs=P.buildRound('hard','health',31,refs,3);
  let s=E.createSession('hard','health',31,qs,3);s.lesson='str-58';
  E.submit(s,{selected:qs[0].options.find(v=>v!==qs[0].answer)});
  for(let i=0;i<qs.length;i++){
    for(let j=0;j<2;j++){
      const raw=E.serialize(s),restored=P.restore(raw);
      assert.ok(restored);assert.equal(JSON.parse(raw).contentRevision,3);
      assert.deepEqual(restored.questions,qs);assert.deepEqual(restored.attempts,s.attempts);assert.deepEqual(restored.draft,s.draft);s=restored;
    }
    E.submit(s,response(qs[i]));E.advance(s);
  }
  s=P.restore(E.serialize(s));assert.equal(s.phase,'complete');assert.deepEqual(s.attempts,[2,1]);assert.deepEqual(s.questions,qs);
  const next=E.createSession('hard','health',31,P.buildRound('hard','health',31,refs));
  assert.equal(JSON.parse(E.serialize(next)).contentRevision,4);assert.ok(next.questions.every(q=>!q.clues));
});
test('a raw version-one round retains its own prompts, choices and attempts through completion',()=>{
  const level='hard',world='mix',seed=49,qs=C.buildRound(level,world,seed);
  const first=E.createSession(level,world,seed,qs);
  E.submit(first,response(qs[0]));E.advance(first);
  const raw={...JSON.parse(E.serialize(first)),version:1};delete raw.contentRevision;
  let saved=P.restore(raw);
  for(let i=1;i<qs.length;i++){
    assert.ok(saved);assert.equal(saved.index,i);
    assert.deepEqual(saved.questions.map(({ref,...q})=>q),qs);
    assert.deepEqual(saved.attempts,qs.map((_,j)=>j<i?1:0));
    assert.equal(E.submit(saved,response(qs[i])),'correct');E.advance(saved);saved=P.restore(E.serialize(saved));
  }
  assert.equal(saved.phase,'complete');assert.equal(saved.contentRevision,1);
});

test('each retained comparison grades all four verdicts against both speakers’ actual statements',()=>{
  const cases=[
    ['winter',11,['Između grma i ograde vide se otisci.','Tuda je prošla životinja.'],
      ['Otisci se vide pokraj klupe.','Životinja je prošla pokraj bora.']],
    ['spring',7,['Ptica na isto mjesto donosi travke.','Možda ondje gradi gnijezdo.'],
      ['Sjenica nosi hranu u kućicu.','Možda u kućici hrani mlade.']],
    ['summer',10,['U hladu su ostale četiri žlice.','Na suncu su nestale tri žlice.'],
      ['U hladu je ostalo više vode.','Na suncu je ostala jedna žlica.']],
    ['nature',10,['Čep je plutao.','Kamen je potonuo.'],
      ['List je ostao na površini.','Kovanica je potonula.']],
  ];
  for(const [world,key,initial,repeat] of cases)for(const review of [false,true]){
    const truth=review?repeat:initial,seen=new Set();
    for(let seed=1;seed<=100;seed++){
      const q=build(world,key,'hard',seed,0,review);
      const [lara,bitko]=q.clues.map((clue,i)=>{
        const name=i===0?'Lara: ':'Bitko: ';assert.ok(clue.startsWith(name));
        return truth.includes(clue.slice(name.length));
      });
      const correct=lara?(bitko?'Oboje.':'Samo Lara.'):(bitko?'Samo Bitko.':'Nitko.');
      assert.equal(q.answer,correct);seen.add(correct);
    }
    assert.equal(seen.size,4,world+'/'+key);
  }
});
test('every offered hard route, clock and month choice follows its diagram and fresh reviews use another one',()=>{
  for(let seed=1;seed<=140;seed++)for(const key of [5,7,11]){
    const first=build('spacetime',key,'hard',seed),review=build('spacetime',key,'hard',seed,0,true);
    assert.notDeepEqual(first.visual,review.visual);
    for(const q of [first,review]){
      const v=q.visual;
      if(key===5){
        const valid=q.options.filter(option=>E.walk(v,option.split(', '))===v.end);assert.deepEqual(valid,[q.answer]);
      }else if(key===7){
        const time=q.prompt.match(/polazi u (\d+):(\d+)/);
        assert.equal(Number(time[1])*60+Number(time[2])-v.h*60-v.m,parseInt(q.answer));
      }else{
        const offset=Number(q.prompt.match(/je (\d+) dana/)[1])*(q.prompt.includes('nakon')?1:-1);
        assert.equal(v.day+offset,parseInt(q.answer));
      }
    }
  }
});
