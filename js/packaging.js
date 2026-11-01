/* Belief Project — packaging (packaging.html).
   The options come from content.js (packaging.options), each with its photograph. Only an option with status
   "available" can be chosen. Any other stays in view as a preview of what is coming — its photograph blurred, an
   "Unavailable" mark over it — and trying to choose it turns the card red for a moment and says why.
   The chosen packaging is saved with the order (js/flow.js) and Continue opens the order details page. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const P = C.packaging || {};
  const Flow = window.BeliefFlow;
  const $ = (s, r = document) => r.querySelector(s);
  const host = $('#packOptions');
  if (!host || !Flow) return;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';

  const options = (P.options || []).filter(o => o && o.id);
  const status = $('#packStatus');
  const goOn = $('#packContinue');
  const d = Flow.current();
  Flow.summary($('#flowSummary'), { ...Flow.read(), ...d }, { size: true });
  const back = $('#flowBack');
  if (back) back.href = Flow.nextHref('size.html', d);

  /* ---------- the options ---------- */
  let chosen = '';
  const cards = options.map((o, n) => {
    const available = o.status === 'available';
    const card = el('article', 'pack-card');
    card.dataset.pack = o.id;
    card.dataset.status = available ? 'available' : 'unavailable';
    card.style.setProperty('--i', n);
    if (!available) card.setAttribute('aria-disabled', 'true');
    const nameId = 'pack-name-' + o.id;
    card.setAttribute('aria-labelledby', nameId);

    const stage = el('div', 'pack-stage');
    const visual = el('div', 'pack-visual');
    if (o.image) {
      const img = new Image();
      img.className = 'pack-photo';
      img.alt = o.imageAlt || o.name || '';
      img.decoding = 'async';
      if (o.imageSmall) { img.srcset = o.imageSmall + " 900w, " + o.image + " 1600w"; img.sizes = "(max-width: 899px) 92vw, 46vw"; }
      img.src = o.image;
      visual.append(img);
    }
    stage.append(visual);
    if (!available) {
      const lock = el('span', 'pack-lock');
      lock.innerHTML = LOCK;
      lock.append(el('span', '', o.unavailableLabel || 'Unavailable'));
      stage.append(lock);
      const told = el('span', 'pack-told', o.unavailableMessage || 'This packaging is not available yet.');
      told.setAttribute('aria-hidden', 'true');
      stage.append(told);
    }
    const tick = el('span', 'pack-tick');
    tick.setAttribute('aria-hidden', 'true');
    stage.append(tick);

    const info = el('div', 'pack-info');
    info.append(el('p', 'pack-chip', o.statusLabel || (available ? 'Available' : 'Unavailable')));
    const name = el('h2', 'pack-name', o.name || '');
    name.id = nameId;
    info.append(name);
    if (o.note) info.append(el('p', 'pack-note', o.note));
    const btn = el('button', 'lg-btn pack-select' + (available ? '' : ' is-locked'));
    btn.type = 'button';
    if (available) {
      btn.setAttribute('aria-pressed', 'false');
      btn.append(el('span', 'pack-select-label', P.selectLabel || 'Select this package'));
      Flow.glass(btn);
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.innerHTML = LOCK;
      btn.append(el('span', 'pack-select-label', o.unavailableLabel || 'Unavailable'));
    }
    info.append(btn);
    card.append(stage, info);

    if (available) {
      card.addEventListener('click', () => choose(o.id, { announce: true }));
    } else {
      // it cannot be chosen: the card blushes red, shakes once and says so
      let timer = 0;
      card.addEventListener('click', () => {
        status.textContent = o.unavailableMessage || `${o.name}: not available yet.`;
        status.dataset.tone = 'refused';
        card.classList.remove('is-refused'); void card.offsetWidth; card.classList.add('is-refused');
        clearTimeout(timer);
        timer = setTimeout(() => card.classList.remove('is-refused'), 1800);
      });
    }
    host.append(card);
    return { o, card, btn, available };
  });

  function choose(id, { announce = false } = {}) {
    const pick = cards.find(c => c.o.id === id && c.available);
    if (!pick) return;
    chosen = id;
    cards.forEach(c => {
      const on = c === pick;
      c.card.classList.toggle('is-selected', on);
      if (!c.available) return;
      c.btn.setAttribute('aria-pressed', String(on));
      $('.pack-select-label', c.btn).textContent = on ? (P.selectedLabel || 'Selected') : (P.selectLabel || 'Select this package');
    });
    goOn.disabled = false;
    Flow.save({ ...d, packaging: id });
    if (announce) { status.textContent = `${pick.o.name} ${(P.selectedLabel || 'selected').toLowerCase()}.`; status.dataset.tone = ''; }
  }

  goOn.addEventListener('click', () => {
    if (!chosen) return;
    Flow.save({ ...d, packaging: chosen });
    if (P.next) { window.location.assign(Flow.nextHref(P.next, Flow.read())); return; }
    goOn.classList.add('is-kept');
    status.textContent = P.keptNote || 'Saved.';
  });
  Flow.glass(goOn);

  // the packaging chosen before, if it can still be chosen; with a single option on offer, it is chosen already
  const before = Flow.read().packaging;
  const offered = cards.filter(c => c.available);
  if (before && offered.some(c => c.o.id === before)) choose(before);
  else if (offered.length === 1) choose(offered[0].o.id);
  host.classList.add('is-entering');
})();
