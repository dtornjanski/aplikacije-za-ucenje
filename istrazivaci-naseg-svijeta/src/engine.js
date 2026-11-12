(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.WorldEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION=1;
  const text=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('hr');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const choiceTypes=new Set(['single','cause','observe']);
  const sequenceTypes=new Set(['order','timeline']);

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
    if(sequenceTypes.has(question.type)) return Array.isArray(response.items)&&response.items.length===question.answer.length&&response.items.every(value=>text(value));
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
    if(sequenceTypes.has(question.type)) return question.answer.every((value,index)=>text(value)===text(response.items[index]));
    return false;
  }

  function createSession(level,world,seed,questions){
    if(!Array.isArray(questions)||questions.length===0) throw new Error('Runda mora sadržavati zadatke.');
    return {version:VERSION,level,world,seed:Number(seed)>>>0,questions:clone(questions),index:0,phase:'answer',attempts:questions.map(()=>0),solved:questions.map(()=>false),responses:questions.map(()=>null)};
  }

  function submit(session,response){
    const index=session.index,question=session.questions[index];
    if(session.solved[index]) return 'locked';
    if(!complete(question,response)) return 'empty';
    session.attempts[index]+=1;
    session.responses[index]=clone(response);
    if(!check(question,response)){session.phase='incorrect';return 'incorrect';}
    session.solved[index]=true;session.phase='correct';return 'correct';
  }

  function advance(session){
    if(!session.solved[session.index]) return false;
    if(session.index>=session.questions.length-1){session.phase='complete';return true;}
    session.index+=1;session.phase='answer';return true;
  }

  function summarize(session){
    const solved=session.solved.filter(Boolean).length;
    let firstTry=0,retried=0;
    session.solved.forEach((done,index)=>{if(done){if(session.attempts[index]===1)firstTry+=1;else retried+=1;}});
    return {solved,total:session.questions.length,firstTry,retried};
  }

  return {VERSION,makeRng,shuffle,complete,check,createSession,submit,advance,summarize};
});
