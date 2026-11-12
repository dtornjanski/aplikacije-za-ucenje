(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfoEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION=1;
  const text=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('hr');
  const clone=value=>JSON.parse(JSON.stringify(value));

  function makeRng(seed){
    let state=(Number(seed)>>>0)||0x6d2b79f5;
    return function(){
      state+=0x6d2b79f5;
      let t=state;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }

  function shuffle(values,rng=Math.random){
    const copy=values.slice();
    for(let i=copy.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function pairKey(pair){return `${text(pair?.[0])}\u0000${text(pair?.[1])}`;}
  function normalizedZones(zones,names){
    if(!zones||typeof zones!=='object') return null;
    const out={};
    for(const name of names){
      if(!Array.isArray(zones[name])) return null;
      out[text(name)]=zones[name].map(text).sort();
    }
    return out;
  }

  function complete(question,response){
    if(!question||!response||typeof response!=='object') return false;
    if(['single','debug','sim'].includes(question.type)) return Boolean(text(response.selected));
    if(question.type==='match') return Array.isArray(response.pairs)&&response.pairs.length===question.answer.length&&response.pairs.every(p=>Array.isArray(p)&&p.length===2&&text(p[0])&&text(p[1]));
    if(question.type==='sort'){
      if(!response.zones||typeof response.zones!=='object') return false;
      return Object.keys(question.answer).every(name=>Array.isArray(response.zones[name]))&&Object.values(response.zones).flat().length===Object.values(question.answer).flat().length;
    }
    if(question.type==='order') return Array.isArray(response.items)&&response.items.length===question.answer.length&&response.items.every(v=>text(v));
    return false;
  }

  function check(question,response){
    if(!complete(question,response)) return false;
    if(['single','debug','sim'].includes(question.type)) return text(response.selected)===text(question.answer);
    if(question.type==='match'){
      const expected=question.answer.map(pairKey).sort();
      const actual=response.pairs.map(pairKey).sort();
      return new Set(actual).size===actual.length&&JSON.stringify(actual)===JSON.stringify(expected);
    }
    if(question.type==='sort'){
      const names=Object.keys(question.answer);
      const expected=normalizedZones(question.answer,names);
      const actual=normalizedZones(response.zones,names);
      if(!actual) return false;
      const values=Object.values(actual).flat();
      return new Set(values).size===values.length&&JSON.stringify(actual)===JSON.stringify(expected);
    }
    if(question.type==='order') return question.answer.every((value,index)=>text(value)===text(response.items[index]));
    return false;
  }

  function createSession(level,world,seed,questions){
    if(!Array.isArray(questions)||questions.length===0) throw new Error('Runda mora sadržavati zadatke.');
    return {version:VERSION,level,world,seed:Number(seed)>>>0,questions:clone(questions),index:0,phase:'answer',attempts:questions.map(()=>0),solved:questions.map(()=>false),responses:questions.map(()=>null)};
  }

  function submit(session,response){
    const index=session.index;
    if(session.solved[index]) return 'locked';
    const question=session.questions[index];
    if(!complete(question,response)) return 'empty';
    session.attempts[index]+=1;
    session.responses[index]=clone(response);
    if(!check(question,response)){session.phase='incorrect';return 'incorrect';}
    session.solved[index]=true;
    session.phase='correct';
    return 'correct';
  }

  function advance(session){
    if(!session.solved[session.index]) return false;
    if(session.index>=session.questions.length-1){session.phase='complete';return true;}
    session.index+=1;
    session.phase='answer';
    return true;
  }

  function summarize(session){
    const solved=session.solved.filter(Boolean).length;
    let firstTry=0,retried=0;
    session.solved.forEach((done,index)=>{if(done){if(session.attempts[index]===1) firstTry+=1;else retried+=1;}});
    return {solved,total:session.questions.length,firstTry,retried};
  }

  return {VERSION,makeRng,shuffle,complete,check,createSession,submit,advance,summarize};
});
