/* Belief Project — packaging (packaging.html).
   The options come from content.js (packaging.options). Only an option with status "available" can be chosen;
   any other is shown dimmed under frosted glass with its "coming soon" line, and nothing happens when it is clicked.
   The chosen packaging is saved with the order (js/flow.js) and Continue opens the order details page. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const P = C.packaging || {};
  const Flow = window.BeliefFlow;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const host = $('#packOptions');
  if (!host || !Flow) return;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  const options = (P.options || []).filter(o => o && o.id);
  const status = $('#packStatus');
  const goOn = $('#packContinue');
  const d = Flow.current();
  Flow.summary($('#flowSummary'), { ...Flow.read(), ...d }, { size: true });
  const back = $('#flowBack');
  if (back) back.href = Flow.nextHref('size.html', d);

  /* ---------- drawings shown until a photograph is supplied (content.js: image) ---------- */
  // a rigid box, its lid lifted off and floating, in the brand's Midnight with an Ice Blue lining
  const BOX = `
<svg class="pack-art pack-art-box" viewBox="0 0 400 330" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bxR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B3474"/><stop offset="1" stop-color="#0A1A45"/></linearGradient>
    <linearGradient id="bxL" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D1F52"/><stop offset="1" stop-color="#040F30"/></linearGradient>
    <linearGradient id="bxT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A4C98"/><stop offset=".55" stop-color="#173777"/><stop offset="1" stop-color="#0E2560"/></linearGradient>
    <linearGradient id="bxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C2E2FE"/></linearGradient>
    <filter id="bxMarble" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018 .05" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.7"/></filter>
    <linearGradient id="bxShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010D2C" stop-opacity=".62"/><stop offset=".55" stop-color="#010D2C" stop-opacity=".18"/><stop offset="1" stop-color="#010D2C" stop-opacity="0"/></linearGradient>
    <radialGradient id="bxGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <mask id="bxBear" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="-40" y="-40" width="80" height="80"><image href="assets/img/bear-badge.webp" x="-30" y="-30" width="60" height="60"/></mask>
  </defs>
  <g class="pack-box">
    <polygon points="87.4,197 200,262 200,198 87.4,133" fill="url(#bxL)"/>
    <polygon points="200,262 347.2,177 347.2,113 200,198" fill="url(#bxR)"/>
    <polygon points="200,198 347.2,113 234.6,48 87.4,133" fill="url(#bxIn)"/>
    <polygon points="200,198 347.2,113 234.6,48 87.4,133" fill="#C2E2FE" filter="url(#bxMarble)" opacity=".7"/>
    <polygon points="87.4,113 200,178 347.2,93 347.2,113 200,198 87.4,133" fill="url(#bxShade)"/>
    <polyline points="87.4,133 200,198 347.2,113" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
  </g>
  <g class="pack-lid">
    <polygon points="87.4,113 200,178 200,158 87.4,93" fill="url(#bxL)"/>
    <polygon points="200,178 347.2,93 347.2,73 200,158" fill="url(#bxR)"/>
    <polygon points="200,158 347.2,73 234.6,8 87.4,93" fill="url(#bxT)"/>
    <ellipse cx="190" cy="70" rx="90" ry="40" fill="url(#bxGlow)" opacity=".45"/>
    <polyline points="87.4,93 200,158 347.2,73" fill="none" stroke="rgba(194,226,254,.55)" stroke-width="1.2"/>
    <g transform="matrix(.866 .5 -.866 .5 217.3 83)"><rect x="-40" y="-40" width="80" height="80" fill="#C2E2FE" opacity=".82" mask="url(#bxBear)"/></g>
  </g>
</svg>`;
  // a soft mailer, its flap sealed
  const MAILER = `
<svg class="pack-art pack-art-mailer" viewBox="0 0 400 330" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="mlB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D6E9FB"/><stop offset="1" stop-color="#9EC3E6"/></linearGradient>
    <linearGradient id="mlF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9F4FE"/><stop offset="1" stop-color="#B9D6F1"/></linearGradient>
  </defs>
  <g class="pack-mailer" transform="rotate(-7 200 170)">
    <rect x="78" y="64" width="244" height="200" rx="22" fill="url(#mlB)"/>
    <path d="M78 104 Q200 120 322 104 L322 86 Q322 64 300 64 L100 64 Q78 64 78 86 Z" fill="url(#mlF)"/>
    <path d="M96 150 C150 140 190 168 250 150 M110 200 C160 212 210 188 300 206 M120 236 C170 228 230 246 290 232" fill="none" stroke="rgba(1,13,44,.12)" stroke-width="3" stroke-linecap="round"/>
    <rect x="164" y="160" width="72" height="44" rx="8" fill="rgba(255,255,255,.55)"/>
  </g>
</svg>`;

  /* ---------- the options ---------- */
  let chosen = '';
  const cards = options.map((o, n) => {
    const available = o.status === 'available';
    const card = el('article', 'pack-card');
    card.dataset.pack = o.id;
    card.dataset.status = available ? 'available' : 'soon';
    card.style.setProperty('--i', n);
    if (!available) card.setAttribute('aria-disabled', 'true');
    const nameId = 'pack-name-' + o.id;
    card.setAttribute('aria-labelledby', nameId);

    const stage = el('div', 'pack-stage');
    stage.append(el('span', 'pack-light'));
    const visual = el('div', 'pack-visual');
    if (o.image) {
      const img = new Image();
      img.className = 'pack-photo';
      img.alt = o.imageAlt || o.name || '';
      img.decoding = 'async';
      img.src = o.image;
      visual.append(img);
    } else visual.innerHTML = o.id === 'box' || (available && n === 0) ? BOX : MAILER;
    stage.append(visual, el('span', 'pack-floor'));
    if (!available) {
      stage.append(el('span', 'pack-frost'));
      stage.append(el('span', 'pack-soon', o.soonLabel || P.soonLabel || 'Coming soon'));
    }
    const tick = el('span', 'pack-tick');
    tick.setAttribute('aria-hidden', 'true');
    stage.append(tick);

    const info = el('div', 'pack-info');
    info.append(el('p', 'pack-chip', available ? (o.statusLabel || 'Available') : (o.statusLabel || 'Not available yet')));
    const name = el('h2', 'pack-name', o.name || '');
    name.id = nameId;
    info.append(name);
    if (o.note) info.append(el('p', 'pack-note', o.note));
    const btn = el('button', 'lg-btn pack-select' + (available ? '' : ' is-light'));
    btn.type = 'button';
    if (available) {
      btn.setAttribute('aria-pressed', 'false');
      btn.append(el('span', 'pack-select-label', P.selectLabel || 'Select this package'));
      btn.addEventListener('click', () => choose(o.id, { announce: true }));
      Flow.glass(btn);
    } else {
      btn.disabled = true;
      btn.append(el('span', 'pack-select-label', o.soonLabel || P.soonLabel || 'Coming soon'));
    }
    info.append(btn);
    if (!o.image && o.photoNote) info.append(el('p', 'pack-photo-note', o.photoNote));
    card.append(stage, info);

    if (available) {
      // the picture chooses it too
      stage.addEventListener('click', () => choose(o.id, { announce: true }));
    } else {
      card.addEventListener('click', () => {
        status.textContent = `${o.name || 'This packaging'}: ${(o.soonLabel || P.soonLabel || 'coming soon').toLowerCase()}.`;
        card.classList.remove('is-nudged'); void card.offsetWidth; card.classList.add('is-nudged');
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
    if (announce) status.textContent = `${pick.o.name} ${(P.selectedLabel || 'selected').toLowerCase()}.`;
  }

  goOn.addEventListener('click', () => {
    if (!chosen) return;
    Flow.save({ ...d, packaging: chosen });
    if (P.next) { window.location.assign(Flow.nextHref(P.next, Flow.read())); return; }
    goOn.classList.add('is-kept');
    status.textContent = P.keptNote || 'Saved.';
  });
  Flow.glass(goOn);

  // the packaging chosen before, if it can still be chosen
  const before = Flow.read().packaging;
  if (before) choose(before);
  host.classList.add('is-entering');
})();