const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../src/engine'),C=require('../src/content'),P=require('../src/practice');
const response=q=>q.options?{selected:q.answer}:q.left?{pairs:q.answer}:q.zones?{zones:q.answer}:{items:q.answer};
const build=(world,key,level='hard',seed=26,example=0,review=false)=>P.buildRound(level,world,seed,[{world,key,seed,example,review}])[0];

test('every current family at all three levels can be completed, including every diagram and review type',()=>{
  let checked=0;
  for(const w of P.worlds)for(const level of P.levels){
    const keys=[...C.banks[w.id].keys(),...P.lessons.filter(l=>l.world===w.id).map(l=>l.id)];
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
test('all 65 two-speaker questions can truthfully use each of the four verdicts',()=>{
  let count=0;
  for(const w of P.worlds)for(const [key,def] of C.banks[w.id].entries()){
    if(!['observe','cause','single'].includes(def.type))continue;
    const verdicts=new Set();
    for(let seed=1;seed<150&&verdicts.size<4;seed++){
      const q=build(w.id,key,'hard',seed);assert.equal(q.clues.length,2);
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
    const history={},seen=new Set(),all=12+P.lessons.filter(s=>s.world===w.id).length;let previous=[];
    for(let n=0;n<5;n++){
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
