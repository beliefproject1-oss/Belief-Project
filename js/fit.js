/* Belief Project — the fit (size.html).
   The customer gives a weight in kilograms (and, if they like, a height in centimetres); the size is recommended as
   they type, from the same rules as the Size Guide window on the homepage (js/sizing.js, content.js size.rules).
   Weight decides; a weight no rule covers gets no size but an offer to ask us on WhatsApp.
   The height, the weight and the recommended size are saved with the order (js/flow.js). */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const S = C.size || {};
  const Flow = window.BeliefFlow;
  const Z = window.BeliefSizing;
  const $ = (s, r = document) => r.querySelector(s);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const form = $('#fitForm');
  if (!form || !Flow || !Z) return;

  const result = $('#fitResult');
  const note = $('#fitNote');
  const ask = $('#fitAsk');
  const goOn = $('#fitContinue');
  const fields = ['weight', 'height'].map(k => {
    const box = $(`[data-measure="${k}"]`, form);
    return { k, box, input: $('input', box), msg: $('.measure-msg', box), required: k === 'weight' };
  });
  const [weightF, heightF] = fields;

  // the order so far, and where Back and Continue lead
  const d = Flow.current();
  Flow.summary($('#flowSummary'), d);
  const back = $('#flowBack');
  if (back) {
    back.href = d.design ? Flow.nextHref(C.customize?.printNext || 'studio.html', d) : Flow.withParams('customize.html', { color: d.color });
    if (!d.design) back.lastElementChild.textContent = 'Plain or printed';
  }
  if (ask) { ask.href = C.contact?.whatsapp || '#'; ask.textContent = S.outsideAction || 'Ask on WhatsApp'; }

  // the three sizes, as glass tiles; the recommended one lights up
  const tiles = Z.sizes.map(s => {
    const t = document.createElement('span');
    t.className = 'size-tile';
    t.dataset.size = s;
    t.textContent = s;
    $('#fitSizes').append(t);
    return t;
  });

  // the scale under each field fills with the value, within what the field accepts
  function gauge(f) {
    const v = Z.parse(f.input.value);
    const [lo, hi] = Z.limits[f.k];
    const ok = v >= lo && v <= hi;
    f.box.style.setProperty('--fill', ok ? ((v - lo) / (hi - lo)).toFixed(3) : 0);
    f.box.classList.toggle('has-value', ok);
    return ok ? v : NaN;
  }
  function mark(f, quiet) {
    const err = Z.check(f.k, f.input.value, { required: f.required });
    if (!quiet || !err) {
      f.msg.textContent = err;
      f.box.classList.toggle('is-wrong', !!err);
      if (err) f.input.setAttribute('aria-invalid', 'true'); else f.input.removeAttribute('aria-invalid');
    }
    return !err;
  }

  let last = '';
  function show(state, size, { animate = true } = {}) {
    result.dataset.state = state;
    tiles.forEach(t => t.classList.toggle('is-on', state === 'found' && t.dataset.size === size));
    if (state === 'found') note.textContent = `${S.resultLabel || 'Recommended size'}: ${size}. ${S.found || ''}`.trim();
    else if (state === 'outside') note.textContent = S.outside || 'We can’t recommend a size for this weight automatically.';
    else note.textContent = '';
    if (ask) ask.hidden = state !== 'outside';
    goOn.disabled = state !== 'found';
    const key = state + (size || '');
    if (animate && key !== last && !reducedMotion.matches) { result.classList.remove('is-new'); void result.offsetWidth; result.classList.add('is-new'); }
    last = key;
  }

  // the recommendation follows the weight as it is typed
  function find({ quiet = true, animate = true } = {}) {
    fields.forEach(gauge);
    const wOk = mark(weightF, quiet);
    const hOk = mark(heightF, quiet);
    const w = Z.parse(weightF.input.value), h = Z.parse(heightF.input.value);
    if (!wOk) { show('idle', '', { animate: false }); Flow.save({ ...Flow.read(), weight: '', size: '' }); return false; }
    const r = Z.recommend(w);
    Flow.save({ ...Flow.read(), ...d, weight: w, height: hOk && !Number.isNaN(h) ? h : '', size: r.state === 'found' ? r.size : '' });
    show(r.state, r.size, { animate });
    return r.state === 'found';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!find({ quiet: false })) {
      const bad = fields.find(f => f.input.getAttribute('aria-invalid') === 'true');
      if (bad) bad.input.focus();
    }
  });
  fields.forEach(f => {
    f.input.addEventListener('input', () => find());
    f.input.addEventListener('blur', () => { if (f.input.value.trim()) mark(f, false); });
  });

  goOn.addEventListener('click', () => {
    if (goOn.disabled) return;
    window.location.assign(Flow.nextHref(S.next || 'packaging.html', Flow.read()));
  });
  [$('#fitGo'), goOn].forEach(b => Flow.glass(b));

  // coming back to the page: the measurements given before, and their result
  const saved = Flow.read();
  if (saved.weight) weightF.input.value = saved.weight;
  if (saved.height) heightF.input.value = saved.height;
  if (saved.weight) find({ animate: false });
  else fields.forEach(gauge);
})();
