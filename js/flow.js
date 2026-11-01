/* Belief Project — the order as it is put together, step by step.
   Colour → plain or printed → design (studio.html) → fit (size.html) → packaging (packaging.html) → order details.
   Each step saves what was chosen into one draft, kept for the visit (sessionStorage, key "belief.order"):

     { color, design, background, height, weight, size, packaging }

   The order page reads it with BeliefFlow.read() and turns it into the item BeliefOrders.submit() sends with
   BeliefFlow.orderItem(), so the height, weight and recommended size travel with the order.
   Also here: the light that follows the pointer across the liquid-glass controls of these steps (BeliefFlow.glass). */
window.BeliefFlow = (() => {
  'use strict';

  const C = window.BELIEF || {};
  const KEY = 'belief.order';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function read() {
    try { const v = JSON.parse(sessionStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (err) { return {}; }
  }
  function save(patch) {
    const next = { ...read(), ...patch };
    Object.keys(next).forEach(k => { if (next[k] === undefined || next[k] === null || next[k] === '') delete next[k]; });
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch (err) { /* private browsing: the steps still pass it along in the address */ }
    return next;
  }

  // the colour, design and background chosen so far, from the address first (a shared link), then the draft
  function current() {
    const p = new URLSearchParams(location.search);
    const d = read();
    const colors = (C.shop?.colors || []).map(c => c.id);
    let color = p.get('color') || d.color || '';
    if (colors.length && !colors.includes(color)) color = d.color && colors.includes(d.color) ? d.color : '';
    const design = p.has('design') ? p.get('design') : (d.design || '');
    const background = ['with', 'without'].includes(p.get('bg')) ? p.get('bg') : (d.background || '');
    return { ...d, color, design, background };
  }

  const withParams = (href, extra) => {
    const [path, query = ''] = href.split('?');
    const p = new URLSearchParams(query);
    Object.entries(extra).forEach(([k, v]) => { if (v) p.set(k, v); });
    const q = p.toString();
    return path + (q ? '?' + q : '');
  };
  // the address of the next step, carrying the choices made so far
  const nextHref = (href, d = current()) => withParams(href, { color: d.color, design: d.design, bg: d.design ? d.background : '' });

  const colorLabel = id => ((C.shop?.colors || []).find(c => c.id === id) || {}).label || id || '';
  function designOf(key) {
    const [dir, id] = (key || '').split('/');
    const DS = window.BELIEF_DESIGNS || { directions: [] };
    const d = (DS.directions.find(x => x.id === dir) || { designs: [] }).designs.find(x => x.id === id);
    const named = (C.studio?.directions || []).find(x => x.id === dir);
    return d ? { ...d, key: dir + '/' + id, direction: named ? named.name : dir } : null;
  }

  // The line the order email shows for the shirt: product, colour, size, and the rest as named details.
  function orderItem(d = read()) {
    const design = designOf(d.design);
    const pack = (C.packaging?.options || []).find(o => o.id === d.packaging);
    const details = {};
    if (design) {
      details.design = `${design.title} (${design.direction})`;
      details.artworkBackground = d.background === 'with' ? 'With background' : 'Without background';
    } else details.design = 'Plain — no artwork';
    if (d.height) details.height = d.height + ' cm';
    if (d.weight) details.weight = d.weight + ' kg';
    if (d.size) details.recommendedSize = d.size;
    if (pack) details.packaging = pack.name;
    return { product: 'T-shirt', color: d.color, size: d.size || '', quantity: 1, customization: details };
  }

  /* ---------- liquid glass: the light follows the pointer and a press sends a ripple across ---------- */
  function glass(el) {
    if (!el || el.dataset.glass) return;
    el.dataset.glass = '1';
    let shine = el.querySelector('.lg-shine');
    if (!shine) { shine = document.createElement('span'); shine.className = 'lg-shine'; shine.setAttribute('aria-hidden', 'true'); el.prepend(shine); }
    const at = e => {
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      return { x, y };
    };
    el.addEventListener('pointerenter', e => { at(e); el.classList.add('is-lit'); });
    el.addEventListener('pointermove', at);
    el.addEventListener('pointerleave', () => el.classList.remove('is-lit'));
    el.addEventListener('pointerdown', e => {
      const pos = at(e);
      if (reducedMotion.matches || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const drop = document.createElement('span');
      drop.className = 'lg-ripple';
      drop.style.left = (pos.x * 100).toFixed(1) + '%';
      drop.style.top = (pos.y * 100).toFixed(1) + '%';
      drop.addEventListener('animationend', () => drop.remove());
      shine.append(drop);
    });
  }

  /* ---------- the shirt so far, as a small card: fabric swatch with the artwork, design, colour, background ---------- */
  function summary(host, d = current(), { size = false } = {}) {
    if (!host) return;
    const S = C.studio || {};
    const make = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text) n.textContent = text; return n; };
    const design = designOf(d.design);
    host.textContent = '';
    const swatch = make('span', 'sum-swatch');
    swatch.setAttribute('aria-hidden', 'true');
    swatch.dataset.color = d.color || 'midnight';
    if (design) {
      const im = new Image();
      im.alt = ''; im.decoding = 'async'; im.src = design.thumb;
      swatch.append(im);
      swatch.classList.toggle('has-paper', d.background === 'with');
    }
    const lines = make('span', 'sum-lines');
    lines.append(
      make('span', 'sum-kicker', design ? design.direction : (C.customize?.plainLabel || 'Keep it plain')),
      make('span', 'sum-title', design ? design.title : 'Plain shirt'),
      make('span', 'sum-meta', [colorLabel(d.color), design ? (d.background === 'with' ? S.bgWith || 'With background' : S.bgWithout || 'Without background') : '', size && d.size ? 'Size ' + d.size : ''].filter(Boolean).join(' · ')),
    );
    host.append(swatch, lines);
  }

  return { read, save, current, nextHref, withParams, colorLabel, designOf, orderItem, glass, summary };
})();