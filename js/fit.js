/* Belief Project — the fit (size.html).
   The customer gives a height in centimetres and a weight in kilograms; FIND MY SIZE reads the sizing rules in
   content.js (size.rules) and recommends M, L or XL. Until those rules are filled in the page says the
   recommendation is waiting for the official sizing data, and never shows a size it cannot stand behind.
   The height, the weight and the recommended size are saved with the order (js/flow.js). */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const S = C.size || {};
  const Flow = window.BeliefFlow;
  const $ = (s, r = document) => r.querySelector(s);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const form = $('#fitForm');
  if (!form || !Flow) return;

  const sizes = (S.sizes && S.sizes.length ? S.sizes : ['M', 'L', 'XL']).map(String);
  const limits = { height: [120, 230], weight: [30, 250], ...(S.limits || {}) };
  const units = { height: 'cm', weight: 'kg' };
  const words = { height: (S.heightLabel || 'Height').toLowerCase(), weight: (S.weightLabel || 'Weight').toLowerCase() };
  const result = $('#fitResult');
  const note = $('#fitNote');
  const goOn = $('#fitContinue');
  const fields = ['height', 'weight'].map(k => {
    const box = $(`[data-measure="${k}"]`, form);
    return { k, box, input: $('input', box), msg: $('.measure-msg', box) };
  });
  let shown = null; // the measurements the result on screen belongs to

  // the order so far, and where Back and Continue lead
  const d = Flow.current();
  Flow.summary($('#flowSummary'), d);
  const back = $('#flowBack');
  if (back) {
    back.href = d.design ? Flow.nextHref(C.customize?.printNext || 'studio.html', d) : Flow.withParams('customize.html', { color: d.color });
    if (!d.design) back.lastElementChild.textContent = 'Plain or printed';
  }

  // the three sizes, as glass tiles; the recommended one lights up
  const tiles = sizes.map(s => {
    const t = document.createElement('span');
    t.className = 'size-tile';
    t.dataset.size = s;
    t.textContent = s;
    $('#fitSizes').append(t);
    return t;
  });

  /* ---------- reading the fields ---------- */
  // whole or decimal numbers, with a point or a comma ("72,5")
  const parse = v => {
    const s = String(v || '').trim().replace(',', '.');
    return /^\d{1,3}(\.\d{1,2})?$/.test(s) ? parseFloat(s) : NaN;
  };
  function check(f, { quiet = false } = {}) {
    const v = parse(f.input.value);
    const [lo, hi] = limits[f.k];
    const ok = v >= lo && v <= hi;
    const empty = !f.input.value.trim();
    f.box.style.setProperty('--fill', ok ? ((v - lo) / (hi - lo)).toFixed(3) : 0);
    f.box.classList.toggle('has-value', ok);
    if (!quiet) {
      f.msg.textContent = ok ? '' : empty ? `Enter your ${words[f.k]} in ${units[f.k] === 'cm' ? 'centimetres' : 'kilograms'}.` : `Enter a ${words[f.k]} between ${lo} and ${hi} ${units[f.k]}.`;
      if (ok) f.input.removeAttribute('aria-invalid'); else f.input.setAttribute('aria-invalid', 'true');
      f.box.classList.toggle('is-wrong', !ok);
    }
    return ok ? v : NaN;
  }

  /* ---------- the recommendation ---------- */
  // the first rule whose height and weight ranges both hold the measurements gives the size
  function recommend(h, w) {
    const rules = (S.rules || []).filter(r => r && r.size && Array.isArray(r.height) && Array.isArray(r.weight));
    if (!rules.length) return { state: 'awaiting' };
    const r = rules.find(r => h >= r.height[0] && h <= r.height[1] && w >= r.weight[0] && w <= r.weight[1]);
    return r ? { state: 'found', size: String(r.size) } : { state: 'outside' };
  }

  function show(state, size, { animate = true } = {}) {
    result.dataset.state = state;
    tiles.forEach(t => t.classList.toggle('is-on', state === 'found' && t.dataset.size === size));
    if (state === 'found') note.textContent = `${S.resultLabel || 'Recommended size'}: ${size}. ${S.found || ''}`.trim();
    else if (state === 'awaiting') note.textContent = S.awaiting || 'The size recommendation is waiting for its official sizing data.';
    else if (state === 'outside') note.textContent = S.outside || 'A size cannot be recommended reliably for these measurements.';
    else if (state === 'stale') note.textContent = 'Your measurements changed: find your size again.';
    else note.textContent = '';
    goOn.disabled = state !== 'found';
    if (animate && !reducedMotion.matches) { result.classList.remove('is-new'); void result.offsetWidth; result.classList.add('is-new'); }
  }

  function find({ animate = true, quiet = false } = {}) {
    const [h, w] = fields.map(f => check(f, { quiet }));
    if (Number.isNaN(h) || Number.isNaN(w)) {
      if (!quiet) (fields.find(f => f.input.getAttribute('aria-invalid') === 'true') || fields[0]).input.focus();
      return;
    }
    const r = recommend(h, w);
    shown = { h, w };
    // the measurements are kept even while there is no recommendation yet
    Flow.save({ ...d, height: h, weight: w, size: r.state === 'found' ? r.size : '' });
    show(r.state, r.size, { animate });
  }

  form.addEventListener('submit', e => { e.preventDefault(); find(); });
  fields.forEach(f => {
    f.input.addEventListener('input', () => {
      f.box.classList.remove('is-wrong');
      f.msg.textContent = '';
      f.input.removeAttribute('aria-invalid');
      check(f, { quiet: true });
      // a result belongs to the measurements it was found for
      if (shown && result.dataset.state !== 'idle') {
        const now = fields.map(x => parse(x.input.value));
        if (now[0] !== shown.h || now[1] !== shown.w) show('stale', '', { animate: false });
        else find({ animate: false, quiet: true });
      }
    });
    f.input.addEventListener('blur', () => { if (f.input.value.trim()) check(f); });
  });

  goOn.addEventListener('click', () => {
    if (goOn.disabled) return;
    window.location.assign(Flow.nextHref(S.next || 'packaging.html', Flow.read()));
  });
  [$('#fitGo'), goOn].forEach(b => Flow.glass(b));

  // coming back to the page: the measurements given before, and their result
  const saved = Flow.read();
  if (saved.height) fields[0].input.value = saved.height;
  if (saved.weight) fields[1].input.value = saved.weight;
  if (saved.height && saved.weight) find({ animate: false, quiet: true });
  else fields.forEach(f => check(f, { quiet: true }));
})();