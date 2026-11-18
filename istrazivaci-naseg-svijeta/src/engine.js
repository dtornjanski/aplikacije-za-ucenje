(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.WorldEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION=2;
  const text=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('hr');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const choiceTypes=new Set(['single','cause','observe']);
  const sequenceTypes=new Set(['order','timeline']);
  const directions={gore:[0,-1],desno:[1,0],dolje:[0,1],lijevo:[-1,0]};

  function walk(map,moves){
    let at=map.start;
    for(const name of moves){
      if(!Object.hasOwn(directions,name))return -1;
      const [dx,dy]=directions[name],x=at%3+dx,y=Math.floor(at/3)+dy,next=3*y+x;
      if(x<0||x>2||y<0||y>2||map.blocked.includes(next))return -1;
      at=next;
    }
    return at;
  }
  function emptyDraft(q){
    if(choiceTypes.has(q.type))return {selected:''};
    if(q.type==='match')return {pairs:[]};
    if(q.type==='sort')return {zones:Object.fromEntries(q.zones.map(z=>[z,[]]))};
    return {items:[]};
  }

  function makeRng(seed){
    let state=(Number(seed)>>>0)||0x6d2b79f5;
    return function(){
      state+=0x6d2b79f5;
      let value=state;
      value=Math.imul(value^(value>>>15),value|1);
      value^=value+Math.imul(value^(value>>>7),value|61);
      return ((value^(value>>>14))>>>0)/4294967296;
    };
  }

  function shuffle(values,rng=Math.random){
    const copy=values.slice();
    for(let index=copy.length-1;index>0;index--){
      const swap=Math.floor(rng()*(index+1));
      [copy[index],copy[swap]]=[copy[swap],copy[index]];
    }
    return copy;
  }

  function pairKey(pair){return `${text(pair?.[0])}\u0000${text(pair?.[1])}`;}
  function normalizedZones(zones,names){
    if(!zones||typeof zones!=='object') return null;
    const normalized={};
    for(const name of names){
      if(!Array.isArray(zones[name])) return null;
      normalized[text(name)]=zones[name].map(text).sort();
    }
    return normalized;
  }

  function complete(question,response){
    if(!question||!response||typeof response!=='object') return false;
    if(choiceTypes.has(question.type)) return Boolean(text(response.selected));
    if(question.type==='match') return Array.isArray(response.pairs)&&response.pairs.length===question.answer.length&&response.pairs.every(pair=>Array.isArray(pair)&&pair.length===2&&text(pair[0])&&text(pair[1]));
    if(question.type==='sort'){
      const names=Object.keys(question.answer);
      return names.every(name=>Array.isArray(response.zones?.[name]))&&Object.values(response.zones||{}).flat().length===Object.values(question.answer).flat().length;
    }
    if(sequenceTypes.has(question.type)||question.type==='route') return Array.isArray(response.items)&&response.items.length===question.answer.length&&response.items.every(value=>text(value));
    return false;
  }

  function check(question,response){
    if(!complete(question,response)) return false;
    if(choiceTypes.has(question.type)) return text(response.selected)===text(question.answer);
    if(question.type==='match'){
      const expected=question.answer.map(pairKey).sort(),actual=response.pairs.map(pairKey).sort();
      return new Set(actual).size===actual.length&&JSON.stringify(actual)===JSON.stringify(expected);
    }
    if(question.type==='sort'){
      const names=Object.keys(question.answer),expected=normalizedZones(question.answer,names),actual=normalizedZones(response.zones,names);
      if(!actual) return false;
      return JSON.stringify(actual)===JSON.stringify(expected);
    }
    if(question.type==='route')return walk(question.visual,response.items)===question.visual.end;
    if(question.constraints){
      if(!sameMembers(response.items,question.answer))return false;
      const positions=question.answer.map(item=>response.items.indexOf(item));
      return question.constraints.every(([before,after])=>positions[before]<positions[after]);
    }
    if(sequenceTypes.has(question.type)) return question.answer.every((value,index)=>text(value)===text(response.items[index]));
    return false;
  }

  function createSession(level,world,seed,questions){
    if(!Array.isArray(questions)||questions.length===0) throw new Error('Runda mora sadržavati zadatke.');
    return {version:VERSION,level,world,seed:Number(seed)>>>0,questions:clone(questions),lesson:null,review:false,index:0,phase:'answer',attempts:questions.map(()=>0),solved:questions.map(()=>false),responses:questions.map(()=>null),credited:[],draft:emptyDraft(questions[0]),pending:null};
  }

  function sameResponse(q,left,right){
    if(!left||!right)return false;
    if(q.type==='match')return JSON.stringify(left.pairs.map(pairKey).sort())===JSON.stringify(right.pairs.map(pairKey).sort());
    if(q.type==='sort')return JSON.stringify(normalizedZones(left.zones,q.zones))===JSON.stringify(normalizedZones(right.zones,q.zones));
    return JSON.stringify(left)===JSON.stringify(right);
  }

  function submit(session,response){
    const index=session.index,question=session.questions[index];
    if(session.solved[index]) return 'locked';
    if(!complete(question,response)||!responseAllowed(question,response)) return 'empty';
    if(sameResponse(question,response,session.responses[index]))return 'unchanged';
    session.attempts[index]+=1;
    session.responses[index]=clone(response);session.draft=clone(response);session.pending=null;
    if(!check(question,response)){session.phase='incorrect';return 'incorrect';}
    session.solved[index]=true;session.phase='correct';return 'correct';
  }

  function advance(session){
    if(!session.solved[session.index]) return false;
    if(session.index>=session.questions.length-1){session.phase='complete';return true;}
    session.index+=1;session.phase='answer';session.draft=emptyDraft(session.questions[session.index]);session.pending=null;return true;
  }

  function summarize(session){
    const solved=session.solved.filter(Boolean).length;
    let firstTry=0,retried=0;
    session.solved.forEach((done,index)=>{if(done){if(session.attempts[index]===1)firstTry+=1;else retried+=1;}});
    return {solved,total:session.questions.length,firstTry,retried};
  }

  function serialize(session){
    const {level,world,seed,lesson,review,index,phase,attempts,solved,responses,credited,draft,pending}=session;
    return JSON.stringify({version:VERSION,level,world,seed,lesson,review,index,phase,attempts,solved,responses,credited,draft,pending,plan:session.questions[0].ref?session.questions.map(q=>q.ref):undefined});
  }

  function sameMembers(values,allowed){
    const counts=list=>list.reduce((map,value)=>map.set(text(value),(map.get(text(value))||0)+1),new Map());
    const actual=counts(values),expected=counts(allowed);
    if(actual.size!==expected.size) return false;
    for(const [value,count] of actual) if(count!==expected.get(value)) return false;
    return true;
  }

  function responseAllowed(question,response){
    if(response===null) return true;
    if(!complete(question,response)) return false;
    if(choiceTypes.has(question.type)) return question.options.some(option=>text(option)===text(response.selected));
    if(question.type==='match'){
      const left=response.pairs.map(pair=>pair[0]),right=response.pairs.map(pair=>pair[1]);
      return sameMembers(left,question.left)&&sameMembers(right,question.right);
    }
    if(question.type==='sort'){
      const keys=Object.keys(response.zones||{});
      if(keys.length!==question.zones.length||keys.some(name=>!question.zones.includes(name))) return false;
      return sameMembers(Object.values(response.zones).flat(),question.items);
    }
    if(sequenceTypes.has(question.type)) return sameMembers(response.items,question.items);
    if(question.type==='route')return response.items.every(move=>question.items.includes(move));
    return false;
  }

  function draftAllowed(q,d){
    if(!d||typeof d!=='object')return false;
    function subset(values,allowed){
      if(!Array.isArray(values))return false;
      const unused=allowed.slice();
      return values.every(v=>{const i=unused.indexOf(v);if(i<0)return false;unused.splice(i,1);return true;});
    }
    if(choiceTypes.has(q.type))return d.selected===''||q.options.includes(d.selected);
    if(q.type==='match')return Array.isArray(d.pairs)&&d.pairs.every(p=>Array.isArray(p)&&p.length===2)&&subset(d.pairs.map(p=>p[0]),q.left)&&subset(d.pairs.map(p=>p[1]),q.right);
    if(q.type==='sort')return d.zones&&Object.keys(d.zones).length===q.zones.length&&q.zones.every(z=>Array.isArray(d.zones[z]))&&subset(Object.values(d.zones).flat(),q.items);
    if(q.type==='route')return Array.isArray(d.items)&&d.items.length<=q.answer.length&&d.items.every(v=>q.items.includes(v));
    return subset(d.items,q.items);
  }

  function restore(raw,buildRound){
    try{
      const saved=typeof raw==='string'?JSON.parse(raw):raw;
      if(!saved||![1,VERSION].includes(saved.version)||typeof buildRound!=='function') return null;
      if(!Number.isInteger(saved.seed)||saved.seed<0||saved.seed>0xffffffff||!Number.isInteger(saved.index)) return null;
      const questions=buildRound(saved.level,saved.world,saved.seed,saved.version===1?undefined:saved.plan),total=questions.length;
      if(saved.index<0||saved.index>=total||!['answer','incorrect','correct','complete'].includes(saved.phase)) return null;
      if(!Array.isArray(saved.attempts)||!Array.isArray(saved.solved)||!Array.isArray(saved.responses)) return null;
      if(saved.attempts.length!==total||saved.solved.length!==total||saved.responses.length!==total) return null;
      if(saved.attempts.some(value=>!Number.isInteger(value)||value<0)||saved.solved.some(value=>typeof value!=='boolean')) return null;
      const credited=saved.version===VERSION?(saved.credited||[]):[];
      if(!Array.isArray(credited)||credited.some(i=>!Number.isInteger(i)||i<0||i>saved.index||!saved.solved[i]||saved.responses[i]!==null))return null;
      const passed=i=>credited.includes(i)||check(questions[i],saved.responses[i]);
      for(let index=0;index<total;index++){
        if(!responseAllowed(questions[index],saved.responses[index])) return null;
        if(index<saved.index&&(!saved.solved[index]||saved.attempts[index]<1||!passed(index))) return null;
        if(index>saved.index&&(saved.solved[index]||saved.attempts[index]!==0||saved.responses[index]!==null)) return null;
      }
      const current=saved.index,response=saved.responses[current],question=questions[current];
      if(saved.phase==='answer'&&(saved.solved[current]||(response!==null&&(saved.version===1||!saved.attempts[current]||check(question,response))))) return null;
      if(saved.phase==='incorrect'&&(saved.solved[current]||saved.attempts[current]<1||!response||check(question,response))) return null;
      if(saved.phase==='correct'&&(!saved.solved[current]||saved.attempts[current]<1||!passed(current))) return null;
      if(saved.phase==='complete'&&(current!==total-1||saved.solved.some(value=>!value)||saved.attempts[current]<1||!passed(current))) return null;
      const session=createSession(saved.level,saved.world,saved.seed,questions);
      session.index=current;session.phase=saved.phase;session.attempts=saved.attempts.slice();session.solved=saved.solved.slice();session.responses=clone(saved.responses);session.credited=credited.slice();
      if(saved.version===VERSION){
        if(!draftAllowed(question,saved.draft))return null;
        if(saved.phase==='incorrect'&&!sameResponse(question,saved.draft,response))return null;
        session.draft=clone(saved.draft);
        const pending=saved.pending;
        if(pending!=null){
          if(question.type==='match'&&question.left.includes(pending)&&!session.draft.pairs.some(p=>p[0]===pending))session.pending=pending;
          else if(question.type==='sort'&&question.items.includes(pending)&&!Object.values(session.draft.zones).flat().includes(pending))session.pending=pending;
          else return null;
        }
        if(saved.lesson!=null&&!questions.every(q=>q.lesson===saved.lesson))return null;
        session.lesson=saved.lesson||null;session.review=saved.review===true;
      }else session.draft=response?clone(response):emptyDraft(question);
      return session;
    }catch(error){return null;}
  }

  function migrate(old,questions){
    const session=createSession(old.level,old.world,old.seed,questions);
    session.index=old.index;session.attempts=old.attempts.slice();session.solved=old.solved.slice();
    session.phase=old.phase==='incorrect'?'answer':old.phase;
    for(let i=0;i<questions.length;i++){
      const q=questions[i],response=old.responses[i];
      if(old.solved[i]){
        if(responseAllowed(q,response)&&check(q,response))session.responses[i]=clone(response);
        else session.credited.push(i);
      }else if(i===old.index&&response&&responseAllowed(q,response)&&!check(q,response)){
        session.responses[i]=clone(response);session.phase='incorrect';
      }
    }
    session.draft=clone(session.responses[session.index]||emptyDraft(questions[session.index]));
    return session;
  }
  return {VERSION,makeRng,shuffle,complete,check,createSession,submit,advance,summarize,serialize,restore,migrate,emptyDraft,sameResponse,walk,directions};
});
