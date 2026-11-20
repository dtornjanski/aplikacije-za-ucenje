(function (root) {
  'use strict';
  const E = root.InvestigationEngine;
  const names = { clue: 'Stiže novi trag', ask: 'Imaš samo jedno pitanje', trial: 'Mali pokus', sort: 'Dva dobra odgovora' };
  const icons = { clue: 'search', ask: 'chat', trial: 'bulb', sort: 'puzzle' };
  const prefix = 'mislim-i-otkrivam-istraga-v1-';

  function create({ main, levels, esc, icon, action }) {
    const memory = new Map();
    function get(key) { try { return localStorage.getItem(key); } catch { return null; } }
    function put(key, value) { try { localStorage.setItem(key, value); } catch { /* Allow play in memory. */ } }
    const knownLevel = n => levels.some(item => item.id === n);
    let selected = Number(get(prefix + 'razina'));
    if (!knownLevel(selected)) selected = 1;

    function record(level) {
      if (!memory.has(level)) memory.set(level, E.readRecord(get(prefix + level), level));
      return memory.get(level);
    }
    function save(level) { put(prefix + level, JSON.stringify(record(level))); }
    function select(level) {
      if (!knownLevel(level)) return;
      selected = level;
      put(prefix + 'razina', String(level));
    }
    function start(level) {
      select(level);
      const state = record(level);
      if (!state.run || state.run.done) {
        state.run = E.makeRound(level, state.seen);
        E.markSeen(state);
        save(level);
      }
    }
    function completed(run) { return run.index + (run.feedback === 'right' && E.finalStep(run) ? 1 : 0); }
    function launch(level = selected, choose = false) {
      const run = record(level).run;
      const ongoing = run && !run.done;
      return `<section class="inv-launch" aria-label="Mala istraga"><div class="inv-launch-copy">
        <span class="inv-seal" aria-hidden="true">🔎</span><div><h2>Mala istraga</h2>
        <p>${ongoing ? `Dovršeno ${completed(run)} od 4 zadatka. Nastavi gdje si stala.` : 'Četiri kratka zadatka s tragovima, pitanjima i pokusima.'}</p></div></div>
        <div class="inv-launch-actions">${choose ? `<label class="inv-level">Težina<select name="investigation-level">${levels.map(l =>
          `<option value="${l.id}" ${l.id === level ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>` : ''}
        ${action('investigate', (ongoing ? 'Nastavi malu istragu ' : 'Pokreni malu istragu ') + icon('arrow'), 'button', `data-investigation-level="${level}"`)}</div></section>`;
    }

    function illustration(item) {
      const pattern = ['stripes', 'dots'].includes(item.mark);
      const sails = item.shape === 'boat' ? ` data-sails="${esc(item.mark)}"` : '';
      return `<span class="inv-art" aria-hidden="true"><span class="inv-object inv-${item.shape} inv-color-${item.color}${pattern ? ' inv-' + item.mark : ''}"${sails}>${pattern ? '' : esc(item.mark)}</span></span>`;
    }
    function board(task, run, interactive, multi) {
      return `<div class="inv-grid" data-count="${task.cards.length}">${E.order(run, 'cards', task.cards.length).map(i => {
        const item = task.cards[i];
        const tile = `<span class="inv-tile">${illustration(item)}<strong>${esc(item.label)}</strong></span>`;
        return interactive ? `<label class="inv-choice"><input type="${multi ? 'checkbox' : 'radio'}" name="inv-pick" value="${i}" ${run.pick.includes(i) ? 'checked' : ''}>${tile}</label>` :
          `<div class="inv-static">${tile}</div>`;
      }).join('')}</div>`;
    }
    function answers(run, items, group = 'inv-pick') {
      return `<div class="inv-options">${E.order(run, group + '-' + run.step, items.length).map(i => {
        const checked = group === 'inv-reason' ? run.reason === i : run.pick.includes(i);
        return `<label class="option"><input type="radio" name="${group}" value="${i}" ${checked ? 'checked' : ''}><span>${esc(items[i])}</span></label>`;
      }).join('')}</div>`;
    }
    function field(prompt, body) {
      return `<fieldset class="inv-field"><legend>${esc(prompt)}</legend>${body}</fieldset>`;
    }
    function clueBoard(task, run) {
      const notes = task.clues.slice(0, run.step + 1).map(([note], i) =>
        `<li><strong>Trag ${i + 1}</strong><span>${esc(note)}</span></li>`).join('');
      const isReason = run.step === task.clues.length;
      return `<ol class="inv-notes">${notes}</ol>` + (isReason
        ? field(task.why, answers(run, task.reasons))
        : field('Označi sve kartice koje odgovaraju tragovima.', board(task, run, true, true)));
    }
    function questionBoard(task, run) {
      if (run.step === 0) {
        const words = task.cards.length === 4 ? 'dvije mogućnosti' : 'tri mogućnosti';
        return board(task, run, false) + field(`Koje pitanje ostavlja ${words} i za „da” i za „ne”?`, answers(run, task.questions.map(q => q[0])));
      }
      return `<div class="inv-note"><p>${esc(task.questions[run.prior.pick[0]][0])}</p><strong>Odgovor je „${task.yes ? 'da' : 'ne'}”.</strong></div>`
        + field('Označi sve kartice koje još dolaze u obzir.', board(task, run, true, true));
    }
    function trialBoard(task, run) {
      const order = E.order(run, 'runs', task.runs.length);
      const showResults = run.step > 0;
      const units = { polja: 'u poljima', s: 'u sekundama', min: 'u minutama', cm: 'u centimetrima' };
      const unit = units[task.unit];
      const cards = order.map((id, position) => {
        if (showResults && !run.prior.pick.includes(id)) return '';
        const row = task.runs[id];
        const contents = `<span class="inv-run"><strong>Pokus ${position + 1}</strong>
          ${task.columns.map((column, index) => `<span class="inv-data"><small>${esc(column)}</small><b>${esc(row[index])}</b></span>`).join('')}
          ${showResults ? `<span class="inv-measure"><small>${esc(task.resultLabel)}${unit ? ' (' + unit + ')' : ''}</small><b>${row[row.length - 1]}</b></span>` : ''}</span>`;
        return showResults ? `<div class="inv-static">${contents}</div>` : `<label class="inv-choice"><input type="checkbox" name="inv-pick" value="${id}" ${run.pick.includes(id) ? 'checked' : ''}>${contents}</label>`;
      }).join('');
      const grid = `<div class="inv-grid inv-runs">${cards}</div>`;
      return showResults ? grid + field('Što pokazuju tvoja dva rezultata?', answers(run, task.conclusions)) :
        field('Odaberi dva pokusa za poštenu usporedbu.', grid);
    }
    function sortBoard(task, run) {
      const prior = run.step ? `<div class="inv-note"><small>Tvoj prvi izbor</small><p><strong>${esc(task.cards[run.prior.pick[0]].label)}</strong> · ${esc(task.reasons[run.prior.reason][0])}</p></div>` : '';
      return prior + field(run.step ? 'Sada izdvoji drugu karticu.' : 'Koju karticu možeš izdvojiti?', board(task, run, true, false)) +
        field('Koji razlog vrijedi samo za tu karticu?', answers(run, task.reasons.map(reason => reason[0]), 'inv-reason'));
    }
    const boards = { clue: clueBoard, ask: questionBoard, trial: trialBoard, sort: sortBoard };
    const levelPill = level => `<span class="pill level-pill l${level}">${esc(levels.find(l => l.id === level).name)}</span>`;
    const top = (level, back) => `<div class="topline">${action('investigation-back', icon('back') + back, 'text-button')}${levelPill(level)}</div>`;
    function screen(level, back) {
      const run = record(level).run;
      if (!run) return '';
      if (run.done) {
        const retried = run.missed.filter(Boolean).length;
        return `<section class="results view">${top(level, back)}<div class="inv-finish">
          <span class="inv-seal" aria-hidden="true">🔎</span><h1>Istraga je dovršena!</h1>
          <p>Riješila si sva četiri zadatka.</p></div><div class="stats">
          <div class="stat"><strong>${4 - retried}</strong><span>Iz prvog pokušaja</span></div>
          <div class="stat"><strong>${retried}</strong><span>Uz ponovni pokušaj</span></div></div>
          <p class="encouragement">Koji ti je trag najviše pomogao? Ispričaj to nekome.</p><div class="actions">
          ${action('investigate', 'Pokreni novu istragu ' + icon('arrow'), 'button', `data-investigation-level="${level}"`)}
          ${action('home', 'Početna', 'button secondary')}</div></section>`;
      }
      const task = E.current(run);
      const count = completed(run);
      return `<section class="exercise view inv-exercise">${top(level, back)}<div class="progress-wrap">
        <div class="progress" role="progressbar" aria-label="Dovršeni zadaci u istrazi" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${count}">
        ${run.ids.map((_, i) => `<span class="${i < count ? 'filled' : i === run.index ? 'current' : ''}"></span>`).join('')}</div>
        <span class="progress-text">Zadatak ${run.index + 1} od 4</span></div>
        <div class="question-card"><div class="question-head"><div class="icon-well">${icon(icons[task.kind])}</div><div>
        <p class="eyebrow">${names[task.kind]}</p><h1>${esc(task.title)}</h1></div></div>
        <p class="story">${esc(task.scene)}</p><p class="inv-step">Korak ${run.step + 1} od ${E.steps(task)}</p>
        ${boards[task.kind](task, run)}<div class="inv-bottom"><p class="inv-feedback" role="status" aria-live="polite" tabindex="-1"></p>
        <div class="inv-controls">${action('investigation-check', 'Provjeri', 'button')}
        ${action('investigation-next', (E.finalStep(run) ? (run.index === 3 ? 'Pogledaj završetak' : 'Sljedeći zadatak') :
          task.kind === 'clue' && run.step + 1 < task.clues.length ? 'Otkrij sljedeći trag' :
          task.kind === 'trial' ? 'Pogledaj rezultate' : 'Nastavi') + ' ' + icon('arrow'), 'button')}</div></div></div></section>`;
    }

    function sync(level) {
      const run = record(level).run;
      const status = main.querySelector('.inv-feedback');
      if (!status || !run || run.done) return;
      const correct = run.feedback === 'right';
      const count = completed(run);
      const progress = main.querySelector('.inv-exercise .progress');
      progress.setAttribute('aria-valuenow', count);
      [...progress.children].forEach((part, i) => { part.className = i < count ? 'filled' : i === run.index ? 'current' : ''; });
      for (const input of main.querySelectorAll('.inv-exercise input')) input.disabled = correct;
      const check = main.querySelector('[data-action="investigation-check"]');
      check.hidden = correct;
      check.disabled = !E.ready(run);
      main.querySelector('[data-action="investigation-next"]').hidden = !correct;
      status.dataset.feedback = run.feedback;
      const message = correct ? 'Točno!' : run.feedback === 'wrong' ? 'Još nije točno. Pokušaj ponovno.' : '';
      if (status.textContent !== message) status.textContent = message;
    }
    function edit(level, input) {
      const run = record(level).run;
      if (!run || run.done || run.feedback === 'right') return;
      const value = Number(input.value);
      if (input.name === 'inv-reason') run.reason = value;
      else if (input.type === 'checkbox') run.pick = [...main.querySelectorAll('input[name="inv-pick"]:checked')].map(i => Number(i.value));
      else run.pick = [value];
      run.feedback = 'idle';
      save(level);
      sync(level);
    }
    function check(level) {
      if (!E.submit(record(level).run)) return;
      save(level);
      sync(level);
      main.querySelector('.inv-feedback').focus();
    }
    function next(level) {
      if (E.advance(record(level))) save(level);
    }
    function external(key, value) {
      if (![1, 2, 3].some(level => key === prefix + level)) return false;
      const level = Number(key.slice(-1));
      memory.set(level, E.readRecord(value, level));
      return level;
    }
    return { launch, start, screen, sync, select, edit, check, next, external,
      hasRun: level => !!record(level).run, selected: () => selected };
  }
  root.InvestigationUI = { create };
})(globalThis);
