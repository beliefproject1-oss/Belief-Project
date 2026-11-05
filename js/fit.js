/* Belief Project — the fit (size.html).
   The customer chooses a size, any of those on sale (content.js size.sizes), and that choice alone goes with the order.
   The weight is optional: given, it brings a recommendation just under the field, from the same rules as the Size
   Guide window (js/sizing.js, content.js size.rules), and the recommended size is marked among the sizes. It is never
   chosen for the customer, and a different size can always be chosen. A weight no rule covers gets no recommendation
   but an offer to ask us on WhatsApp. The height is optional too and never changes anything.
   The weight and height (when given and valid) and the size chosen are saved with the order (js/flow.js). */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const S = C.size || {};
  const Flow = window.BeliefFlow;
  const Z = window.BeliefSizing;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (all, k) => (k in values ? values[k] : all));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const form = $('#fitForm');
  if (!form || !Flow || !Z) return;

  const reco = $('#fitReco');
  const note = $('#fitNote');
  const ask = $('#fitAsk');
  const goOn = $('#fitContinue');
  const fields = ['weight', 'height'].map(k => {
    const box = $(`[data-measure="${k}"]`, form);
    return { k, box, input: $('input', box), msg: $('.measure-msg', box) };
  });
  const [weightF, heightF] = fields;

  // the order so far, and where Back and Continue lead
  const d = Flow.current();
  const keep = patch => Flow.save({ color: d.color, design: d.design, ...patch });
  const back = $('#flowBack');
  if (back) {
    back.href = d.design ? Flow.nextHref(C.customize?.printNext || 'studio.html', d) : Flow.withParams('customize.html', { color: d.color });
    if (!d.design) back.lastElementChild.textContent = 'Plain or printed';
  }
  if (ask) { ask.href = C.contact?.whatsapp || '#'; ask.textContent = S.outsideAction || 'Ask on WhatsApp'; }
  $('#fitRecoOutside').textContent = S.outside || 'We can’t recommend a size for this weight automatically.';

  /* ---------- the sizes: glass tiles, one to choose (radio buttons, so arrow keys move between them) ---------- */
  const group = $('#fitSizes');
  group.style.setProperty('--n', Z.sizes.length);
  const tiles = Z.sizes.map(size => {
    const label = el('label', 'size-tile');
    label.dataset.size = size;
    const input = el('input', 'size-radio');
    Object.assign(input, { type: 'radio', name: 'size', value: size });
    const tag = el('span', 'size-tile-tag', S.recoTag || 'Recommended');
    tag.hidden = true;
    label.append(input, el('span', 'size-tile-letter', size), tag);
    group.append(label);
    input.addEventListener('change', () => { if (input.checked) choose(size, { animate: true }); });
    return { size, label, input, tag };
  });

  let chosen = '';
  function choose(size, { save = true, animate = false } = {}) {
    chosen = Z.sizes.includes(size) ? size : '';
    tiles.forEach(t => {
      const on = t.size === chosen;
      t.input.checked = on;
      t.label.classList.toggle('is-on', on);
      if (on && animate && !reducedMotion.matches) { t.label.classList.remove('is-picked'); void t.label.offsetWidth; t.label.classList.add('is-picked'); }
    });
    goOn.disabled = !chosen;
    note.textContent = chosen ? fill(S.pickedNote || 'Size {size} chosen.', { size: chosen }) : (S.pickNote || 'Choose a size to continue.');
    if (save) Flow.summary($('#flowSummary'), keep({ size: chosen }), { size: true });
  }

  /* ---------- the measurements: optional, each checked only once something is typed ---------- */
  // the scale under each field fills with the value, within what the field accepts
  function gauge(f) {
    const v = Z.parse(f.input.value);
    const [lo, hi] = Z.limits[f.k];
    const ok = v >= lo && v <= hi;
    f.box.style.setProperty('--fill', ok ? ((v - lo) / (hi - lo)).toFixed(3) : 0);
    f.box.classList.toggle('has-value', ok);
  }
  // '' when the field is empty or holds a number it accepts; a reason, shown unless quiet, otherwise
  function mark(f, quiet) {
    const err = Z.check(f.k, f.input.value, { required: false });
    if (!quiet || !err) {
      f.msg.textContent = err;
      f.box.classList.toggle('is-wrong', !!err);
      if (err) f.input.setAttribute('aria-invalid', 'true'); else f.input.removeAttribute('aria-invalid');
    }
    return !err;
  }

  // the recommendation under the weight; the recommended tile is marked, nothing is chosen
  let last = '';
  function show(state, size, weight, { animate = true } = {}) {
    reco.dataset.state = state;
    $('#fitRecoSize').textContent = state === 'found' ? size : '';
    $('#fitRecoNote').textContent = state === 'found' ? fill(S.recoNote || 'Based on {weight} kg.', { weight: String(weight) }) : '';
    tiles.forEach(t => {
      const on = state === 'found' && t.size === size;
      t.tag.hidden = !on;
      t.label.classList.toggle('is-reco', on);
    });
    const key = state + (size || '');
    if (animate && key !== last && !reducedMotion.matches) { reco.classList.remove('is-new'); void reco.offsetWidth; reco.classList.add('is-new'); }
    last = key;
  }

  // follows the measurements as they are typed; the size chosen is never touched
  function measure({ quiet = true, animate = true, save = true } = {}) {
    fields.forEach(gauge);
    const wOk = mark(weightF, quiet);
    const hOk = mark(heightF, quiet);
    const typed = weightF.input.value.trim() !== '';
    const w = Z.parse(weightF.input.value), h = Z.parse(heightF.input.value);
    const r = typed && wOk ? Z.recommend(w) : { state: typed ? 'invalid' : 'idle' };
    if (save) keep({ weight: typed && wOk ? w : '', height: hOk && !Number.isNaN(h) ? h : '' });
    show(r.state, r.size, w, { animate });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    measure({ quiet: false });
  });
  fields.forEach(f => {
    f.input.addEventListener('input', () => measure());
    f.input.addEventListener('blur', () => { if (f.input.value.trim()) mark(f, false); });
  });

  goOn.addEventListener('click', () => {
    if (!chosen) return;
    window.location.assign(Flow.nextHref(S.next || 'packaging.html', keep({ size: chosen })));
  });
  Flow.glass(goOn);

  // coming back to the page: the measurements and the size given before
  const saved = Flow.read();
  if (saved.weight) weightF.input.value = saved.weight;
  if (saved.height) heightF.input.value = saved.height;
  measure({ animate: false, save: false });
  choose(saved.size, { save: false });
  Flow.summary($('#flowSummary'), { ...saved, ...d }, { size: true });
})();
