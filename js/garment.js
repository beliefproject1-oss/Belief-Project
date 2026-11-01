/* Belief Project — the shirt on its model, with the chosen design printed on its back.
   Used by the plain-or-printed page, the design studio, the order page and the confirmation.
   Each colour has its own model, photographed from behind in the real shirt (a "stage" in assets/designs/designs.js);
   tools/prepare-designs.js printed every design onto each stage's shirt, lit and textured like the fabric, and the
   print is laid exactly over the photograph here. The page frames each model by its stage's view (head to hips).

     const g = BeliefGarment.build(host, { colors: ['ice-blue', 'midnight'], sizes: '46vw' });
     g.setShirt('midnight');      // which model is shown
     g.show(design);              // a design from designs.js, pulled down the shirt like ink; g.show(null) clears it
     g.setZoom(1.9);              // the close-up wants the sharper print
     g.focus()                    // the middle of the print area, in % of the frame shown: { x, y } */
window.BeliefGarment = (() => {
  'use strict';

  const DS = window.BELIEF_DESIGNS || {};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pct = (v, of) => (v / of * 100).toFixed(4) + '%';
  const el = (tag, cls, attrs) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  function build(host, { colors = Object.keys(DS.stages || {}), sizes = '50vw', label = 'Print area' } = {}) {
    const frame = DS.frame || { w: 1120, h: 1400 };
    const stages = DS.stages || {};
    host.textContent = '';
    host.classList.add('garment');
    const scenes = {};
    colors.forEach(id => {
      const st = stages[id];
      if (!st) return;
      const v = st.view || { x: 0, y: 0, w: frame.w, h: frame.h };
      // the whole photograph, moved and scaled so the view fills the garment's box
      const scene = el('span', 'scene', { 'data-color': id });
      Object.assign(scene.style, { width: pct(frame.w, v.w), height: pct(frame.h, v.h), left: pct(-v.x, v.w), top: pct(-v.y, v.h) });
      const img = el('img', 'garment-photo', { alt: '', decoding: 'async', sizes: `calc(${sizes} * ${(frame.w / v.w).toFixed(3)})` });
      const a = st.area || { x: 0, y: 0, w: 0, h: 0 };
      const guide = el('span', 'garment-guide');
      Object.assign(guide.style, { left: pct(a.x, frame.w), top: pct(a.y, frame.h), width: pct(a.w, frame.w), height: pct(a.h, frame.h) });
      guide.dataset.label = label;
      const b = st.box || a;
      const box = el('span', 'garment-print');
      Object.assign(box.style, { left: pct(b.x, frame.w), top: pct(b.y, frame.h), width: pct(b.w, frame.w), height: pct(b.h, frame.h) });
      scene.append(img, guide, box);
      host.append(scene);
      scenes[id] = { scene, img, box, st, v };
    });

    const load = id => {
      const s = scenes[id];
      if (!s || s.img.getAttribute('srcset')) return;
      const photos = s.st.photo || [];
      s.img.srcset = photos.map(p => `${p.src} ${p.w}w`).join(', ');
      s.img.src = (photos[photos.length - 1] || photos[0] || {}).src || '';
    };

    let color = '', current = null, zoom = 1, seq = 0;
    // the sharper print once the shirt is shown large enough to need it
    const srcFor = (design, id = color) => {
      const p = design && design.prints && design.prints[id];
      if (!p) return '';
      const s = scenes[id];
      const need = (s ? s.box.getBoundingClientRect().width : 0) * (window.devicePixelRatio || 1) * zoom;
      return need > (p.width || 900) / 2 * 1.15 ? p.src : p.small;
    };

    // pull: a new design is pulled down the shirt like ink under a squeegee; otherwise it fades in
    function show(design, { pull = true } = {}) {
      const token = ++seq;
      current = design || null;
      host.classList.toggle('has-print', !!current);
      host.classList.toggle('is-empty', !current);
      const leave = layers => layers.forEach(layer => {
        layer.classList.add('is-leaving');
        setTimeout(() => layer.remove(), reducedMotion.matches ? 0 : 520);
      });
      // other colours' prints go: the shirt on show is the only one that carries the design
      Object.entries(scenes).forEach(([id, s]) => { if (id !== color) leave([...s.box.querySelectorAll('.print-layer:not(.is-leaving)')]); });
      const s = scenes[color];
      if (!s) return Promise.resolve();
      const old = () => [...s.box.querySelectorAll('.print-layer:not(.is-leaving)')];
      const src = srcFor(current);
      if (!src) { leave(old()); return Promise.resolve(); }
      const layer = el('img', 'print-layer', { alt: '', decoding: 'async' });
      layer.src = src;
      const place = () => {
        if (token !== seq) return;
        const before = old();
        s.box.append(layer);
        leave(before);
        if (reducedMotion.matches) return;
        if (!pull) { layer.classList.add('is-fading'); return; }
        s.box.classList.remove('is-pulling');
        void s.box.offsetWidth;
        s.box.classList.add('is-pulling');
        layer.classList.add('is-pulling');
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          layer.classList.remove('is-pulling');
          if (token === seq) s.box.classList.remove('is-pulling');
        };
        layer.addEventListener('animationend', settle, { once: true });
        setTimeout(settle, 1400);
      };
      // placed once decoded, so it never flashes in half-drawn; a print that fails to load leaves the last one
      const wait = pull ? 280 : 40;
      return new Promise(resolve => {
        let done = false;
        const go = ok => { if (done) return; done = true; if (ok) place(); resolve(); };
        if (layer.decode) layer.decode().then(() => go(true), () => {});
        if (layer.complete && layer.naturalWidth) setTimeout(() => go(true), wait);
        layer.addEventListener('load', () => setTimeout(() => go(true), wait), { once: true });
        layer.addEventListener('error', () => go(false), { once: true });
      });
    }

    function setShirt(id) {
      if (!scenes[id]) return;
      const changed = id !== color;
      color = id;
      load(id);
      Object.entries(scenes).forEach(([k, s]) => s.scene.classList.toggle('is-on', k === id));
      const f = focus();
      host.style.setProperty('--pcx', f.x + '%');
      host.style.setProperty('--pcy', f.y + '%');
      if (changed && current) show(current, { pull: false });
    }

    // the middle of the print area, as a share of the garment's box
    function focus(id = color) {
      const s = scenes[id];
      if (!s) return { x: 50, y: 40 };
      const a = s.st.area || { x: 0, y: 0, w: 0, h: 0 };
      return { x: +((a.x + a.w / 2 - s.v.x) / s.v.w * 100).toFixed(3), y: +((a.y + a.h / 2 - s.v.y) / s.v.h * 100).toFixed(3) };
    }

    function setZoom(z) {
      zoom = z;
      const s = scenes[color];
      if (!current || !s) return;
      const layer = s.box.querySelector('.print-layer:not(.is-leaving)');
      const want = srcFor(current);
      if (layer && want && !layer.src.endsWith(want)) {
        const sharp = new Image();
        const swap = () => { if (layer.isConnected && !layer.src.endsWith(want)) layer.src = want; };
        sharp.onload = () => setTimeout(swap, 200);
        sharp.src = want;
      }
    }

    const preloaded = new Set();
    function preload(design, id = color) {
      const src = srcFor(design, id);
      if (!src || preloaded.has(src)) return;
      preloaded.add(src);
      const i = new Image();
      i.decoding = 'async';
      i.src = src;
    }

    // the other colours' photographs arrive once the page has settled, so switching is instant
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
    idle(() => Object.keys(scenes).forEach(load));

    return { show, preload, setShirt, setZoom, focus, get current() { return current; }, get color() { return color; } };
  }

  // A still of the shirt — the model framed by its view, the design on its back — as a small JPEG data address,
  // for the order email. Resolves with '' when it cannot be made; it never stops an order.
  function snapshot(color, design, width = 520) {
    const frame = DS.frame || { w: 1120, h: 1400 };
    const st = (DS.stages || {})[color];
    if (!st) return Promise.resolve('');
    const v = st.view || { x: 0, y: 0, w: frame.w, h: frame.h };
    const photos = st.photo || [];
    const photoSrc = (photos[photos.length - 1] || {}).src;
    const p = design && design.prints && design.prints[color];
    const load = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    return Promise.all([load(photoSrc), load(p && p.small)]).then(([photo, print]) => {
      if (!photo) return '';
      try {
        const height = Math.round(width * v.h / v.w);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        const kx = photo.naturalWidth / frame.w, ky = photo.naturalHeight / frame.h;
        ctx.drawImage(photo, v.x * kx, v.y * ky, v.w * kx, v.h * ky, 0, 0, width, height);
        if (print && st.box) {
          const s = width / v.w, b = st.box;
          ctx.drawImage(print, (b.x - v.x) * s, (b.y - v.y) * s, b.w * s, b.h * s);
        }
        return canvas.toDataURL('image/jpeg', 0.84);
      } catch (err) {
        return '';
      }
    });
  }

  return { build, snapshot };
})();
