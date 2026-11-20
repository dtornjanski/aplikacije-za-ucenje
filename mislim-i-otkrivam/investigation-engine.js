(function (root) {
  'use strict';

  const bank = root.ThinkInvestigations;
  const byId = new Map(bank.map(task => [task.id, task]));
  const kinds = ['clue', 'ask', 'trial', 'sort'];
  const steps = task => task.kind === 'clue' ? task.clues.length + 1 : 2;
  const current = run => byId.get(run.ids[run.index]);
  const finalStep = run => run.step + 1 === steps(current(run));
  const equalSet = (a, b) => a.length === b.length && b.every(id => a.includes(id));
  const different = (a, b) => a.slice(1, -1).every((value, index) => value === b[index + 1]) && a[0] !== b[0];

  function stageType(task, step) {
    switch (task.kind) {
      case 'clue': return step === task.clues.length ? 'reason' : 'cards';
      case 'ask': return step === 0 ? 'question' : 'cards';
      case 'trial': return step === 0 ? 'runs' : 'conclusion';
      case 'sort': return 'pair';
    }
  }

  function sizeOf(task, step) {
    switch (stageType(task, step)) {
      case 'reason': return task.reasons.length;
      case 'question': return task.questions.length;
      case 'runs': return task.runs.length;
      case 'conclusion': return task.conclusions.length;
      default: return task.cards.length;
    }
  }

  function selectionFits(values, max) {
    return Array.isArray(values) && values.length <= max && new Set(values).size === values.length &&
      values.every(value => Number.isInteger(value) && value >= 0 && value < max);
  }

  function ready(run) {
    const task = current(run);
    switch (stageType(task, run.step)) {
      case 'runs': return run.pick.length === 2;
      case 'pair': return run.pick.length === 1 && run.reason !== null;
      default: return run.pick.length > 0;
    }
  }

  function correct(task, step, pick, reason, prior) {
    switch (stageType(task, step)) {
      case 'cards': {
        if (task.kind === 'clue') {
          const fits = task.clues.slice(0, step + 1);
          return equalSet(pick, task.cards.map((_, i) => i).filter(i => fits.every(([, ids]) => ids.includes(i))));
        }
        const yesGroup = task.questions[prior.pick[0]][1];
        return equalSet(pick, task.cards.map((_, i) => i).filter(i => yesGroup.includes(i) === task.yes));
      }
      case 'question': return pick.length === 1 && task.questions[pick[0]][1].length * 2 === task.cards.length;
      case 'runs': return pick.length === 2 && different(task.runs[pick[0]], task.runs[pick[1]]);
      case 'pair': {
        const matches = task.reasons[reason]?.[1];
        return !!matches && matches.length === 1 && equalSet(pick, matches) && (!step || prior.pick[0] !== pick[0]);
      }
      default: return equalSet(pick, [0]);
    }
  }

  function makeRound(level, seen, random = Math.random) {
    const chosen = kinds.map(kind => {
      const pool = root.ThinkEngine.shuffle(bank.filter(task => task.level === level && task.kind === kind), random);
      pool.sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
      return pool[0].id;
    });
    return { ids: root.ThinkEngine.shuffle(chosen, random), seed: Math.floor(random() * 0x100000000),
      index: 0, step: 0, feedback: 'idle', pick: [], reason: null, prior: null,
      missed: chosen.map(() => false), done: false };
  }

  function markSeen(record) {
    const id = current(record.run).id;
    record.seen[id] = Math.max(0, ...Object.values(record.seen)) + 1;
  }

  // Each board and set of answers keeps its shuffled order when the pupil revisits a step.
  function order(run, name, count) {
    let seed = run.seed >>> 0;
    for (const ch of current(run).id + '/' + name) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    return root.ThinkEngine.shuffle(Array.from({ length: count }, (_, i) => i), random);
  }

  function submit(run) {
    if (run.done || run.feedback === 'right' || !ready(run)) return false;
    const right = correct(current(run), run.step, run.pick, run.reason, run.prior);
    run.feedback = right ? 'right' : 'wrong';
    if (!right) run.missed[run.index] = true;
    return true;
  }

  function advance(record) {
    const run = record.run;
    if (run.done || run.feedback !== 'right') return false;
    if (finalStep(run) && run.index === run.ids.length - 1) {
      run.done = true;
      return true;
    }
    if (finalStep(run)) {
      run.index++;
      run.step = 0;
      run.prior = null;
      markSeen(record);
    } else {
      if (run.step === 0) run.prior = { pick: run.pick.slice(), reason: run.reason };
      run.step++;
    }
    run.pick = [];
    run.reason = null;
    run.feedback = 'idle';
    return true;
  }

  function validResponse(task, step, pick, reason) {
    const type = stageType(task, step);
    if (!selectionFits(pick, sizeOf(task, step))) return false;
    if (!['runs', 'cards'].includes(type) && pick.length > 1) return false;
    return reason === null || (type === 'pair' && selectionFits([reason], task.reasons.length));
  }

  function validRun(run, level) {
    if (!run || !Array.isArray(run.ids) || run.ids.length !== kinds.length ||
        !run.ids.every(id => byId.get(id)?.level === level) ||
        new Set(run.ids.map(id => byId.get(id).kind)).size !== kinds.length ||
        !Number.isInteger(run.seed) || run.seed < 0 || run.seed > 0xffffffff ||
        !selectionFits([run.index], kinds.length) || !Array.isArray(run.missed) ||
        run.missed.length !== kinds.length || !run.missed.every(v => typeof v === 'boolean') ||
        typeof run.done !== 'boolean' || !['idle', 'wrong', 'right'].includes(run.feedback)) return false;
    const task = current(run);
    if (!selectionFits([run.step], steps(task)) || !validResponse(task, run.step, run.pick, run.reason)) return false;
    if (run.step === 0 && run.prior !== null) return false;
    if (run.step > 0 && (!run.prior || !validResponse(task, 0, run.prior.pick, run.prior.reason) ||
        !correct(task, 0, run.prior.pick, run.prior.reason, null))) return false;
    if (run.feedback !== 'idle' && (!ready(run) || (run.feedback === 'right') !==
        correct(task, run.step, run.pick, run.reason, run.prior))) return false;
    return !run.done || (run.feedback === 'right' && finalStep(run) && run.index === kinds.length - 1);
  }

  function readRecord(text, level) {
    const empty = { seen: {}, run: null };
    if (!text) return empty;
    try {
      const saved = JSON.parse(text);
      const seen = Object.fromEntries(Object.entries(saved.seen || {}).filter(([id, n]) =>
        byId.get(id)?.level === level && Number.isSafeInteger(n) && n > 0 && n < Number.MAX_SAFE_INTEGER - 1));
      return { seen, run: validRun(saved.run, level) ? saved.run : null };
    } catch { return empty; }
  }

  root.InvestigationEngine = { current, stageType, steps, ready, finalStep, makeRound, markSeen, order, submit, advance, readRecord };
})(globalThis);
