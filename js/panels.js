/* Belief Project — what the floating windows hold (js/modal.js shows them).
   BeliefPanels.shipping(): every wilaya with its home-delivery and stop-desk price, searchable as you type.
   BeliefPanels.size(): weight (and, if wished, height) in, the recommended size out, from the same rules as the
   Find Your Fit page (js/sizing.js).
   BeliefPanels.contact(): the shop's email address, with ways to write that work on any device — in Gmail, in the mail
   app, or by copying the address — and WhatsApp. Text and prices come from content.js (shipping, size, contact). */
window.BeliefPanels = (() => {
  'use strict';

  const C = window.BELIEF || {};
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const money = v => (typeof v === 'number' ? v.toLocaleString('en-US') + ' ' + (C.prices?.currency || 'DA') : '');
  // "Béjaïa" and "bejaia" are the same search
  const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’\s-]+/g, ' ').toLowerCase().trim();

  /* ---------- shipping prices ---------- */
  function shipping() {
    const S = C.shipping || {};
    const M = S.methods || { home: 'Home delivery', desk: 'Stop desk' };
    const wrap = el('div', 'ship');
    if (S.intro) wrap.append(el('p', 'ship-intro', S.intro));

    const field = el('label', 'ship-search');
    const icon = el('span', 'ship-search-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.4 15.4 21 21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    const input = el('input');
    Object.assign(input, { type: 'search', placeholder: S.searchLabel || 'Find your wilaya', autocomplete: 'off', spellcheck: false, autofocus: true });
    input.setAttribute('aria-label', S.searchLabel || 'Find your wilaya');
    input.setAttribute('enterkeyhint', 'search');
    field.append(icon, input);
    wrap.append(field);

    const head = el('div', 'ship-row ship-head');
    head.setAttribute('aria-hidden', 'true');
    head.append(el('span', 'ship-no', 'No.'), el('span', 'ship-name', 'Wilaya'), el('span', 'ship-price', M.home), el('span', 'ship-price', M.desk));
    const list = el('ul', 'ship-list');
    list.setAttribute('aria-label', S.title || 'Shipping prices');
    const rows = (S.wilayas || []).map(([code, name, home, desk]) => {
      const li = el('li', 'ship-row');
      const missing = home == null && desk == null;
      if (missing) li.classList.add('is-request');
      const priceCell = (v, label) => {
        const c = el('span', 'ship-price', v == null ? (S.onRequest || 'On request') : money(v));
        c.setAttribute('aria-label', `${label}: ${v == null ? (S.onRequest || 'on request') : money(v)}`);
        return c;
      };
      li.append(el('span', 'ship-no', String(code).padStart(2, '0')), el('span', 'ship-name', name), priceCell(home, M.home), priceCell(desk, M.desk));
      list.append(li);
      return { li, key: fold(name), code: String(code), code2: String(code).padStart(2, '0') };
    });
    const empty = el('p', 'ship-empty');
    empty.hidden = true;
    const foot = el('p', 'ship-note', `${S.onRequest || 'On request'}: ${S.onRequestNote || ''}`);
    wrap.append(head, list, empty, foot);

    input.addEventListener('input', () => {
      const q = fold(input.value);
      let shown = 0;
      rows.forEach(r => {
        const on = !q || r.key.includes(q) || r.code === q || r.code2 === q;
        r.li.hidden = !on;
        if (on) shown++;
      });
      empty.hidden = shown > 0;
      empty.textContent = shown ? '' : `No wilaya matches “${input.value.trim()}”.`;
    });
    return wrap;
  }

  /* ---------- size guide ---------- */
  function size() {
    const S = C.size || {};
    const Z = window.BeliefSizing;
    const wrap = el('div', 'guide');
    if (S.guideIntro) wrap.append(el('p', 'guide-intro', S.guideIntro));

    const form = el('form', 'guide-form');
    form.noValidate = true;
    const field = (kind, label, unit, placeholder, optional) => {
      const box = el('div', 'guide-field');
      const id = 'guide-' + kind;
      const l = el('label', 'guide-label', label);
      l.htmlFor = id;
      if (optional) l.append(el('span', 'guide-optional', ' · ' + (S.optional || 'Optional')));
      const row = el('div', 'guide-input');
      const input = el('input');
      Object.assign(input, { id, name: kind, type: 'text', inputMode: 'decimal', autocomplete: 'off', placeholder, spellcheck: false });
      if (kind === 'weight') input.autofocus = true;
      row.append(input, el('span', 'guide-unit', unit));
      const msg = el('p', 'guide-msg');
      msg.id = id + '-msg';
      input.setAttribute('aria-describedby', msg.id);
      box.append(l, row, msg);
      form.append(box);
      return { input, msg, box };
    };
    const weight = field('weight', S.weightLabel || 'Weight', 'kg', '70', false);
    const height = field('height', S.heightLabel || 'Height', 'cm', '175', true);

    const result = el('div', 'guide-result');
    result.dataset.state = 'idle';
    const tiles = el('div', 'guide-sizes');
    const tileFor = {};
    (Z?.sizes || ['M', 'L', 'XL']).forEach(s => { const t = el('span', 'size-tile', s); tileFor[s] = t; tiles.append(t); });
    const note = el('p', 'guide-note');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    const ask = el('a', 'guide-ask', S.outsideAction || 'Ask on WhatsApp');
    ask.href = C.contact?.whatsapp || '#';
    ask.target = '_blank';
    ask.rel = 'noopener';
    ask.hidden = true;
    result.append(el('p', 'guide-result-label', S.resultLabel || 'Recommended size'), tiles, note, ask);

    const table = el('dl', 'guide-table');
    (Z?.table() || []).forEach(r => { table.append(el('dt', '', r.range), el('dd', '', r.size)); });
    const tableBox = el('div', 'guide-rules');
    tableBox.append(el('p', 'guide-rules-label', S.table || 'Weight → size'), table);
    // the same answer, on its own page (not offered when the window is opened from that page)
    if (!document.body.classList.contains('fit-page')) {
      const fit = el('a', 'guide-fit', 'Open Find Your Fit →');
      fit.href = 'size.html';
      tableBox.append(fit);
    }
    wrap.append(form, result, tableBox);

    function update({ quiet = true } = {}) {
      const wErr = Z.check('weight', weight.input.value);
      const hErr = Z.check('height', height.input.value, { required: false });
      if (!quiet) { weight.msg.textContent = wErr; height.msg.textContent = hErr; }
      else {
        if (!wErr) weight.msg.textContent = '';
        if (!hErr) height.msg.textContent = '';
      }
      weight.input.toggleAttribute('aria-invalid', !!wErr && !quiet);
      const r = wErr ? { state: 'idle' } : Z.recommend(weight.input.value);
      result.dataset.state = r.state;
      Object.entries(tileFor).forEach(([s, t]) => t.classList.toggle('is-on', r.state === 'found' && r.size === s));
      note.textContent = r.state === 'found' ? `${S.resultLabel || 'Recommended size'}: ${r.size}. ${S.found || ''}` : r.state === 'outside' ? (S.outside || '') : '';
      ask.hidden = r.state !== 'outside';
    }
    [weight, height].forEach(f => {
      f.input.addEventListener('input', () => update());
      f.input.addEventListener('blur', () => { if (f.input.value.trim()) update({ quiet: false }); });
    });
    form.addEventListener('submit', e => { e.preventDefault(); update({ quiet: false }); });
    return wrap;
  }

  /* ---------- contact ---------- */
  // A plain mailto: link does nothing on a computer with no mail app set up, so the window offers every way to write.
  function contact() {
    const K = C.contact || {};
    const wrap = el('div', 'contact');
    wrap.append(el('p', 'contact-intro', 'Questions about an order, a size or delivery? Write to us.'));
    const address = el('p', 'contact-address', K.email || '');
    wrap.append(address);
    const actions = el('div', 'contact-actions');
    const link = (cls, label, href, external) => {
      const a = el('a', 'lg-btn ' + cls);
      a.append(el('span', '', label));
      a.href = href;
      if (external) { a.target = '_blank'; a.rel = 'noopener'; }
      actions.append(a);
      return a;
    };
    const subject = K.emailSubject ? encodeURIComponent(K.emailSubject) : '';
    if (K.email) {
      link('', 'Write in Gmail', 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(K.email) + (subject ? '&su=' + subject : ''), true);
      link('is-light', 'Open my email app', 'mailto:' + K.email + (subject ? '?subject=' + subject : ''));
      const copy = el('button', 'lg-btn is-light');
      copy.type = 'button';
      const label = el('span', '', 'Copy the address');
      copy.append(label);
      copy.addEventListener('click', async () => {
        let done = false;
        try { await navigator.clipboard.writeText(K.email); done = true; } catch (err) { done = false; }
        if (!done) { // no clipboard access: select the address so it can be copied by hand
          const r = document.createRange(); r.selectNodeContents(address);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        }
        label.textContent = done ? 'Copied' : 'Selected — copy it';
        setTimeout(() => { label.textContent = 'Copy the address'; }, 1800);
      });
      actions.append(copy);
    }
    wrap.append(actions);
    if (K.whatsapp) {
      const wa = el('a', 'contact-whatsapp');
      wa.href = K.whatsapp; wa.target = '_blank'; wa.rel = 'noopener';
      wa.append(el('span', '', 'Or message us on WhatsApp'), el('strong', '', K.whatsappNumber || ''));
      wrap.append(wa);
    }
    return wrap;
  }

  // opens a window by name: 'shipping', 'size' or 'contact'
  function open(name) {
    const M = window.BeliefModal;
    if (!M) return null;
    if (name === 'contact') return M.open({ eyebrow: 'Contact', title: 'Contact us', body: contact() });
    if (name === 'shipping') return M.open({ eyebrow: 'Delivery', title: C.shipping?.title || 'Shipping prices', body: shipping(), wide: true });
    if (name === 'size') return M.open({ eyebrow: 'Your fit', title: C.size?.guideTitle || 'Size guide', body: size() });
    return null;
  }

  return { shipping, size, contact, open };
})();
