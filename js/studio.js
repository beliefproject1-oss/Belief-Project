/* Belief Project — the steps after the colour.
   customize.html: keep the shirt plain or give it artwork.
   studio.html: the design studio — the six creative directions as cards, two by two; each opens its designs, and the
   chosen design is printed on the back of the shirt, with or without the background of the image it came from.
   Text comes from content.js (customize, studio); the designs from assets/designs/designs.js. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const DS = window.BELIEF_DESIGNS || { directions: [] };
  const Flow = window.BeliefFlow;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const el = (tag, cls, attrs) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };
  const store = {
    get(k) { try { return sessionStorage.getItem(k) || ''; } catch (err) { return ''; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (err) { /* private browsing */ } },
  };
  const params = new URLSearchParams(location.search);
  const url = () => { const q = params.toString(); return location.pathname + (q ? '?' + q : '') + location.hash; };
  const setParam = (k, v) => {
    if (v) params.set(k, v); else params.delete(k);
    history.replaceState(history.state, '', url());
  };
  const withParams = (href, extra) => {
    const [path, query = ''] = href.split('?');
    const p = new URLSearchParams(query);
    Object.entries(extra).forEach(([k, v]) => { if (v) p.set(k, v); });
    const q = p.toString();
    return path + (q ? '?' + q : '');
  };
  // play a CSS entrance again
  const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

  /* ---------- colour ---------- */
  const STORE_COLOR = 'belief.color';     // shared with the colour page
  const STORE_DESIGN = 'belief.design';   // the design chosen with "Choose this design"
  const STORE_PREVIEW = 'belief.preview'; // the design last looked at
  const STORE_BG = 'belief.bg';           // the artwork printed with or without its background
  const COLORS = (C.shop?.colors?.length ? C.shop.colors : [{ id: 'ice-blue', label: 'Ice Blue' }, { id: 'midnight', label: 'Midnight' }])
    .map(c => ({ id: c.id, label: c.label || c.id }));
  const colorLabel = id => (COLORS.find(c => c.id === id) || {}).label || id;
  let color = [params.get('color'), store.get(STORE_COLOR)].find(id => COLORS.some(c => c.id === id)) || 'midnight';
  const colorListeners = [];

  function setColor(id, { remember = true } = {}) {
    if (!COLORS.some(c => c.id === id)) return;
    color = id;
    document.documentElement.dataset.shirt = id;
    if (remember) store.set(STORE_COLOR, id);
    if (params.get('color') !== id && (params.has('color') || remember)) setParam('color', id);
    $$('[data-tone-switch] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === id)));
    colorListeners.forEach(fn => fn(id));
  }

  // two buttons, one per colour, in every [data-tone-switch]
  function initToneSwitch() {
    $$('[data-tone-switch]').forEach(group => {
      COLORS.forEach(c => {
        const b = el('button', 'tone-switch-btn', { type: 'button', 'data-color': c.id, 'aria-pressed': 'false' });
        const sw = el('span', 'tone-switch-dot', { 'aria-hidden': 'true' });
        const name = el('span', 'tone-switch-name');
        name.textContent = c.label;
        b.append(sw, name);
        b.addEventListener('click', () => setColor(c.id));
        group.append(b);
      });
    });
  }

  /* ---------- directions and designs ---------- */
  const directions = (() => {
    const named = (C.studio?.directions || []).map(d => ({ ...d, designs: (DS.directions.find(x => x.id === d.id) || {}).designs || [] }));
    // a folder in designs-source that content.js does not name yet still shows, under its folder name
    DS.directions.forEach(x => {
      if (x.id[0] === '_' || named.some(d => d.id === x.id)) return;
      named.push({ id: x.id, name: x.id.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase()), note: '', designs: x.designs });
    });
    return named.filter(d => d.designs.length);
  })();
  const findDesign = key => {
    const [dir, id] = (key || '').split('/');
    const d = directions.find(x => x.id === dir);
    const design = d && d.designs.find(x => x.id === id);
    return design ? { dir: d, design, key: dir + '/' + id } : null;
  };
  // a design with no clean cut-out is only ever printed with its background
  const hasCutout = design => !!design && design.cutout !== false && !!design.print;

  /* ---------- the garment: shirt photograph, shadow, and the print on its back ---------- */
  // Everything is placed in the frame of the garment photograph (designs.js: frame, print, area),
  // so the print sits exactly where prepare-designs.js put it, at any size.
  const pct = (v, of) => (v / of * 100).toFixed(4) + '%';
  function buildGarment(host, { sizes }) {
    const frame = DS.frame || { w: 1500, h: 2000 };
    const box = DS.print || { x: 376, y: 241, w: 628, h: 828 };
    const area = DS.area || { x: 390, y: 255, w: 600, h: 800, angle: 0 };
    host.textContent = '';
    host.style.setProperty('--pcx', pct(area.x + area.w / 2, frame.w));
    host.style.setProperty('--pcy', pct(area.y + area.h / 2, frame.h));

    const shadow = el('img', 'garment-shadow', { alt: '', src: 'assets/studio/shirt-shadow.webp', decoding: 'async' });
    host.append(shadow);
    const shirts = {};
    COLORS.forEach(c => {
      const img = el('img', 'garment-shirt', { alt: '', decoding: 'async', 'data-color': c.id, sizes });
      shirts[c.id] = img;
      host.append(img);
    });
    const load = id => {
      const img = shirts[id];
      if (!img || img.getAttribute('srcset')) return;
      img.srcset = `assets/studio/shirt-${id}-760.webp 760w, assets/studio/shirt-${id}-1200.webp 1200w`;
      img.src = `assets/studio/shirt-${id}-760.webp`;
    };

    const guide = el('span', 'garment-guide');
    Object.assign(guide.style, { left: pct(area.x, frame.w), top: pct(area.y, frame.h), width: pct(area.w, frame.w), height: pct(area.h, frame.h) });
    guide.style.setProperty('--angle', (area.angle || 0) + 'deg');
    guide.dataset.label = C.studio?.areaLabel || 'Print area';
    const printBox = el('span', 'garment-print');
    Object.assign(printBox.style, { left: pct(box.x, frame.w), top: pct(box.y, frame.h), width: pct(box.w, frame.w), height: pct(box.h, frame.h) });
    host.append(guide, printBox);

    let seq = 0, current = null, mode = 'without', zoom = 1;
    // "with": the image as supplied, its own background printed too; "without": the cut-out artwork alone
    const srcFor = (design, m = mode) => {
      const bg = m === 'with' || !hasCutout(design);
      const big = bg ? design.printBg || design.print : design.print;
      const small = bg ? design.printBgSmall || design.printSmall : design.printSmall;
      const need = printBox.getBoundingClientRect().width * (window.devicePixelRatio || 1) * zoom;
      return need > (design.printWidth || 900) / 2 * 1.15 ? big : small;
    };

    // pull: a new design is pulled down the shirt like ink; a change of background only fades across
    function show(design, { mode: m = 'without', pull = true } = {}) {
      const token = ++seq;
      current = design;
      mode = m;
      host.classList.toggle('has-print', !!design);
      const leave = layers => layers.forEach(layer => {
        layer.classList.add('is-leaving');
        setTimeout(() => layer.remove(), reducedMotion.matches ? 0 : 520);
      });
      if (!design) { leave($$('.print-layer:not(.is-leaving)', printBox)); return Promise.resolve(); }
      const layer = el('img', 'print-layer', { alt: '', decoding: 'async' });
      layer.src = srcFor(design, m);
      const place = () => {
        if (token !== seq) return;
        const old = $$('.print-layer:not(.is-leaving)', printBox);
        printBox.append(layer);
        leave(old);
        if (reducedMotion.matches) return;
        if (!pull) { layer.classList.add('is-fading'); return; }
        // the new print is pulled down the screen like ink under a squeegee
        printBox.classList.remove('is-pulling');
        void printBox.offsetWidth;
        printBox.classList.add('is-pulling');
        layer.classList.add('is-pulling');
        // the print is fully shown when the pull ends — or after a moment anyway, should the animation not run
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          layer.classList.remove('is-pulling');
          if (token === seq) printBox.classList.remove('is-pulling');
        };
        layer.addEventListener('animationend', settle, { once: true });
        setTimeout(settle, 1400);
      };
      // placed once decoded, so it never flashes in half-drawn; a tab in the background may hold decode()
      // back, so a loaded image goes in shortly after anyway. A print that fails to load leaves the last one.
      const wait = pull ? 300 : 60;
      return new Promise(resolve => {
        let done = false;
        const go = ok => { if (done) return; done = true; if (ok) place(); resolve(); };
        if (layer.decode) layer.decode().then(() => go(true), () => {});
        if (layer.complete && layer.naturalWidth) setTimeout(() => go(true), wait);
        layer.addEventListener('load', () => setTimeout(() => go(true), wait), { once: true });
        layer.addEventListener('error', () => go(false), { once: true });
      });
    }

    // a closer look needs the sharper print
    function setZoom(z) {
      zoom = z;
      if (!current) return;
      const layer = $('.print-layer:not(.is-leaving)', printBox);
      const want = srcFor(current);
      if (layer && !layer.src.endsWith(want)) {
        const sharp = new Image();
        const swap = () => { if (layer.isConnected && !layer.src.endsWith(want)) layer.src = want; };
        sharp.onload = () => setTimeout(swap, 300);
        sharp.src = want;
        if (sharp.decode) sharp.decode().then(swap, () => {});
      }
    }

    const preloaded = new Set();
    function preload(design, m = mode) {
      const src = srcFor(design, m);
      if (preloaded.has(src)) return;
      preloaded.add(src);
      const i = new Image();
      i.decoding = 'async';
      i.src = src;
    }

    function setShirt(id) {
      load(id);
      Object.entries(shirts).forEach(([k, img]) => img.classList.toggle('is-on', k === id));
    }

    // the other colour arrives once the page has settled, so switching is instant
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
    idle(() => COLORS.forEach(c => load(c.id)));

    return { show, preload, setShirt, setZoom, get current() { return current; }, printBox };
  }
  /* ---------- customize.html: plain or printed ---------- */
  function initWays() {
    const ways = $('#ways');
    if (!ways) return;
    const halves = $$('.way', ways);
    const status = $('#pickStatus');
    const K = C.customize || {};
    const garments = $$('[data-garment]', ways).map(host => ({ host, g: buildGarment(host, { sizes: '(max-width: 700px) and (orientation: portrait) 60vw, 34vw' }) }));
    colorListeners.push(id => {
      garments.forEach(({ g }) => g.setShirt(id));
      ways.dataset.color = id;
      const print = halves.find(h => h.dataset.way === 'print');
      if (print) print.href = withParams(K.printNext || 'studio.html', { color: id });
    });

    // the printed half shows one design from each direction in turn
    const showcase = garments.find(({ host }) => host.hasAttribute('data-showcase'));
    if (showcase) {
      const picks = directions.map(d => d.designs[0]).filter(Boolean);
      let i = 0, timer = 0;
      const next = () => {
        if (!picks.length) return;
        showcase.g.show(picks[i % picks.length]);
        picks[(i + 1) % picks.length] && showcase.g.preload(picks[(i + 1) % picks.length]);
        i++;
        clearTimeout(timer);
        if (!reducedMotion.matches) timer = setTimeout(() => (document.hidden ? (timer = setTimeout(next, 800)) : next()), 2800);
      };
      next();
    }

    let leaving = 0;
    const show = half => {
      halves.forEach(h => h.classList.toggle('is-active', h === half));
      ways.classList.toggle('has-active', !!half);
    };
    halves.forEach(half => {
      let finger = false;
      half.addEventListener('pointerdown', e => { finger = e.pointerType === 'touch'; });
      half.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') show(half); });
      half.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') show(null); });
      half.addEventListener('focus', () => { if (half.matches(':focus-visible')) show(half); });
      half.addEventListener('blur', () => { if (half.classList.contains('is-active') && !half.matches(':hover')) show(null); });
      half.addEventListener('click', e => {
        const tapped = finger;
        finger = false;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (tapped) show(half);
        if (half.dataset.way === 'plain' && !K.plainNext) {
          // the plain shirt's page is not built yet: the choice is only marked
          e.preventDefault();
          halves.forEach(h => h.classList.toggle('is-picked', h === half));
          const soon = $('.way-soon', half);
          if (soon) soon.hidden = false;
          if (status) status.textContent = (K.plainLabel || 'Keep it plain') + ' selected. ' + (K.plainSoon || '');
          return;
        }
        if (half.dataset.way === 'plain') half.href = withParams(K.plainNext, { color });
        if (tapped && !reducedMotion.matches) {
          e.preventDefault();
          clearTimeout(leaving);
          leaving = setTimeout(() => window.location.assign(half.href), 650);
        }
      });
    });
    window.addEventListener('pageshow', e => { if (e.persisted) show(null); });
  }

  /* ---------- studio.html ---------- */
  function initStudio() {
    const studio = $('#studio');
    if (!studio) return;
    const S = C.studio || {};
    const garment = buildGarment($('#garment'), { sizes: '(min-width: 900px) 46vw, 80vw' });
    const views = $('#atelierViews');
    const grid = $('#dirGrid');
    const dirView = $('#dirView');
    const panels = $('#dirPanels');
    const rig = $('#rig');
    const hang = $('#hang');
    const zoomBtn = $('#stageZoom');
    const title = $('#stageTitle');
    const credit = $('#stageCredit');
    const kicker = $('.stage-kicker');
    const faint = $('#stageFaint');
    const bgGroup = $('#bgMode');
    const bgBtns = $$('[data-bg]', bgGroup);
    const bgNote = $('#bgNote');
    const keepBtn = $('#keepBtn');
    const keepLine = $('#keepLine');
    const keepDesign = $('#keepDesign');
    const keepStatus = $('#keepStatus');
    const live = $('#studioStatus');
    const back = $('#stageBack');
    let selected = null;
    let mode = [params.get('bg'), store.get(STORE_BG), Flow?.read().background].find(m => m === 'with' || m === 'without') || 'without';
    // the close-up turns about the middle of the print area
    ['--pcx', '--pcy'].forEach(v => rig.style.setProperty(v, $('#garment').style.getPropertyValue(v)));

    /* the six directions as cards, two by two, in the order content.js lists them */
    const pad = n => String(n).padStart(2, '0');
    const cards = directions.map((d, n) => {
      const li = el('li', 'dcard-cell');
      const b = el('button', 'dcard', { type: 'button', 'data-dir': d.id });
      b.style.setProperty('--i', n);
      const art = el('span', 'dcard-art', { 'aria-hidden': 'true' });
      d.designs.slice(0, 3).forEach(x => art.append(el('img', '', { alt: '', loading: 'lazy', decoding: 'async', src: x.thumb })));
      const num = el('span', 'dcard-num', { 'aria-hidden': 'true' });
      num.textContent = pad(n + 1);
      const name = el('span', 'dcard-name');
      name.textContent = d.name;
      const note = el('span', 'dcard-note');
      note.textContent = d.note || '';
      const foot = el('span', 'dcard-foot');
      const count = el('span', 'dcard-count');
      count.textContent = d.designs.length + (d.designs.length === 1 ? ' design' : ' designs');
      const arrow = el('span', 'dcard-arrow', { 'aria-hidden': 'true' });
      arrow.textContent = '→';
      foot.append(count, arrow);
      const text = el('span', 'dcard-text');
      text.append(num, name, note, foot);
      const mark = el('span', 'dcard-mark');
      mark.textContent = S.pickedLabel || 'Your design';
      mark.hidden = true;
      b.append(art, text, mark);
      b.addEventListener('pointerenter', () => d.designs.slice(0, 2).forEach(x => garment.preload(x)));
      b.addEventListener('click', () => go(d.id, { push: true }));
      Flow?.glass(b);
      li.append(b);
      grid.append(li);
      return { id: d.id, b, mark };
    });

    /* each direction's designs, as swatches of the shirt's fabric; one direction shown at a time */
    const lists = directions.map(d => {
      const ul = el('ul', 'designs', { role: 'list', 'data-dir': d.id, 'aria-label': d.name });
      ul.hidden = true;
      d.designs.forEach(x => {
        const li = el('li');
        const b = el('button', 'design', { type: 'button', 'aria-pressed': 'false', 'data-key': d.id + '/' + x.id });
        const sw = el('span', 'design-swatch', { 'aria-hidden': 'true' });
        const im = el('img', '', { alt: '', loading: 'lazy', decoding: 'async', src: x.thumb });
        sw.append(im);
        const label = el('span', 'design-name');
        label.textContent = x.title;
        b.append(sw, label);
        b.addEventListener('pointerenter', () => garment.preload(x, effectiveMode(x)));
        b.addEventListener('focus', () => garment.preload(x, effectiveMode(x)));
        b.addEventListener('click', () => select(d.id + '/' + x.id, { announce: true }));
        li.append(b);
        ul.append(li);
      });
      panels.append(ul);
      return { id: d.id, ul };
    });

    // bring the top of what just opened into view, below the pinned shirt on narrow screens
    function bringIntoView(node) {
      const r = node.getBoundingClientRect();
      const stage = $('#stage').getBoundingClientRect();
      const topLimit = matchMedia('(max-width: 899px)').matches ? stage.bottom : 0;
      if (r.top < topLimit + 8 || r.top > window.innerHeight * 0.55) {
        window.scrollTo({ top: window.scrollY + r.top - topLimit - 12, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
    }

    // the grid of directions (id empty) or one direction's designs
    function go(id, { push = false, scroll = true } = {}) {
      const d = directions.find(x => x.id === id) || null;
      const n = d ? directions.indexOf(d) : -1;
      grid.hidden = !!d;
      dirView.hidden = !d;
      views.dataset.view = d ? 'dir' : 'grid';
      if (d) {
        $('#dirNum').textContent = `${pad(n + 1)} / ${pad(directions.length)}`;
        $('#dirTitle').textContent = d.name;
        $('#dirNote').textContent = d.note || '';
        $('#dirCount').textContent = d.designs.length + (d.designs.length === 1 ? ' design' : ' designs');
        lists.forEach(l => { l.ul.hidden = l.id !== d.id; });
        replay(dirView, 'is-in');
      } else replay(grid, 'is-entering');
      // the address says which direction is open; the browser's Back button returns to the grid
      if (push && d) { params.set('dir', d.id); history.pushState({ studioDir: d.id }, '', url()); }
      else setParam('dir', d ? d.id : '');
      if (scroll) setTimeout(() => bringIntoView(d ? $('.dir-head', dirView) : $('.atelier-head')), reducedMotion.matches ? 0 : 60);
      if (d && push) setTimeout(() => $('#dirBack').focus({ preventScroll: true }), 0);
    }
    $('#dirBack').addEventListener('click', () => {
      // the step this page added: going back is the same as the browser's Back button
      if (history.state && history.state.studioDir) history.back();
      else go(null);
    });
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(location.search);
      [...params.keys()].forEach(k => params.delete(k));
      p.forEach((v, k) => params.set(k, v));
      go(p.get('dir'), { scroll: false });
      // the shirt keeps the design on it; the address follows it again
      setParam('design', selected ? selected.key : '');
      setParam('bg', selected ? effectiveMode() : '');
      if (!p.get('dir')) {
        const card = cards.find(c => selected && c.id === selected.dir.id) || cards[0];
        if (card) card.b.focus({ preventScroll: true });
      }
    });

    /* with or without the artwork's own background */
    const effectiveMode = (design = selected && selected.design) => (design && !hasCutout(design) ? 'with' : mode);
    bgBtns.forEach(b => {
      Flow?.glass(b);
      b.addEventListener('click', () => setMode(b.dataset.bg));
    });
    function setMode(m) {
      if (m === 'without' && selected && !hasCutout(selected.design)) return;
      const before = effectiveMode();
      mode = m;
      store.set(STORE_BG, m);
      updateBg();
      if (selected && effectiveMode() !== before) {
        garment.show(selected.design, { mode: effectiveMode(), pull: false });
        if (live) live.textContent = `${selected.design.title}, ${m === 'with' ? (S.bgWith || 'with background') : (S.bgWithout || 'without background')}`.toLowerCase();
      }
      updateFaint();
    }
    function updateBg() {
      const m = effectiveMode();
      bgGroup.dataset.mode = m;
      bgGroup.classList.toggle('is-off', !selected);
      bgBtns.forEach(b => {
        b.setAttribute('aria-pressed', String(!!selected && b.dataset.bg === m));
        b.disabled = !selected || (b.dataset.bg === 'without' && !hasCutout(selected.design));
      });
      bgNote.textContent = selected && !hasCutout(selected.design) ? (S.bgOnlyNote || 'This design is printed with its background.') : '';
      bgNote.hidden = !bgNote.textContent;
      setParam('bg', selected ? m : '');
    }

    function select(key, { announce = false } = {}) {
      const found = findDesign(key);
      const changed = (selected && selected.key) !== (found && found.key);
      selected = found;
      $$('.design', panels).forEach(b => b.setAttribute('aria-pressed', String(!!found && b.dataset.key === found.key)));
      cards.forEach(c => { const on = !!found && found.dir.id === c.id; c.mark.hidden = !on; c.b.classList.toggle('has-pick', on); });
      if (changed) garment.show(found && found.design, { mode: effectiveMode() });
      $('#garment').classList.toggle('is-empty', !found);
      zoomBtn.disabled = !found;
      if (!found) { setZoom(false); }
      title.textContent = found ? found.design.title : (S.empty || 'Choose a design');
      title.classList.remove('is-new');
      void title.offsetWidth;
      title.classList.add('is-new');
      credit.textContent = found && found.design.credit ? (S.creditLabel || 'Artwork by') + ' ' + found.design.credit : '';
      kicker.textContent = found ? found.dir.name : (S.printLabel || 'Back print');
      keepDesign.textContent = found ? found.design.title : (S.empty || 'Choose a design');
      keepBtn.disabled = !found;
      keepBtn.classList.remove('is-kept');
      keepStatus.textContent = '';
      setParam('design', found ? found.key : '');
      if (found) store.set(STORE_PREVIEW, found.key);
      updateBg();
      updateFaint();
      if (announce && found && live) live.textContent = `${found.design.title} printed on the back of the ${colorLabel(color)} shirt`;
    }

    // a cut-out that is hard to read on this colour: suggest the other one (its background keeps it legible)
    function updateFaint() {
      const d = selected && selected.design;
      const other = COLORS.find(c => c.id !== color);
      if (!d || effectiveMode() === 'with' || !(d.faint || []).includes(color) || !other || (d.faint || []).includes(other.id)) { faint.hidden = true; return; }
      faint.textContent = '';
      const txt = document.createTextNode(`Soft on ${colorLabel(color)}. `);
      const b = el('button', 'stage-faint-btn', { type: 'button' });
      b.textContent = `See it on ${other.label}`;
      b.addEventListener('click', () => setColor(other.id));
      faint.append(txt, b);
      faint.hidden = false;
    }

    colorListeners.push(id => {
      garment.setShirt(id);
      keepLine.textContent = [colorLabel(id), S.printLabel || 'Back print', C.prices?.printed].filter(Boolean).join(' · ');
      if (back) back.href = withParams('customize.html', { color: id });
      updateFaint();
      if (live && selected) live.textContent = `${colorLabel(id)} shirt`;
    });

    /* close-up: the print comes to the middle of the stage */
    let zoomed = false;
    function setZoom(on) {
      zoomed = !!on && !!selected;
      rig.classList.toggle('is-close', zoomed);
      $('#stage').classList.toggle('is-close', zoomed);
      zoomBtn.setAttribute('aria-pressed', String(zoomed));
      $('.stage-zoom-label', zoomBtn).textContent = zoomed ? 'Whole shirt' : 'Close-up';
      garment.setZoom(zoomed ? 1.9 : 1);
    }
    zoomBtn.addEventListener('click', () => setZoom(!zoomed));
    $('#garment').addEventListener('click', e => {
      if (!selected) return;
      if (zoomed || e.target.closest('.garment-print')) setZoom(!zoomed);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && zoomed) setZoom(false); });

    /* the shirt sways a little with the cursor, as if it hung from the line */
    if (finePointer.matches && !reducedMotion.matches) {
      const room = $('#stageRoom');
      let target = 0, cur = 0, raf = 0;
      const tick = () => {
        cur += (target - cur) * 0.08;
        hang.style.setProperty('--sway', cur.toFixed(3) + 'deg');
        raf = Math.abs(target - cur) > 0.002 ? requestAnimationFrame(tick) : 0;
      };
      room.addEventListener('pointermove', e => {
        const r = room.getBoundingClientRect();
        target = ((e.clientX - r.left) / r.width - 0.5) * -1.4;
        room.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        if (!raf) raf = requestAnimationFrame(tick);
      });
      room.addEventListener('pointerleave', () => { target = 0; if (!raf) raf = requestAnimationFrame(tick); });
    }

    // the chosen design, its background and the colour go to the next step: the fit
    keepBtn.addEventListener('click', () => {
      if (!selected) return;
      const m = effectiveMode();
      store.set(STORE_DESIGN, selected.key);
      Flow?.save({ color, design: selected.key, background: m });
      if (S.next) { window.location.assign(withParams(S.next, { color, design: selected.key, bg: m })); return; }
      keepBtn.classList.add('is-kept');
      keepStatus.textContent = S.keptNote || 'Saved.';
    });

    // start where the visitor left off: a link to a design opens its direction; otherwise the six directions,
    // with the design last looked at still on the shirt
    const linked = findDesign(params.get('design'));
    const start = linked || findDesign(store.get(STORE_PREVIEW));
    const openFirst = directions.find(d => d.id === params.get('dir')) || (linked && linked.dir);
    go(openFirst ? openFirst.id : null, { scroll: false });
    if (start) select(start.key);
    else select('');
  }

  initToneSwitch();
  initWays();
  initStudio();
  setColor(color, { remember: params.has('color') || !!store.get(STORE_COLOR) });
})();