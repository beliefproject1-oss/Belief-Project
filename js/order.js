/* Belief Project — order details (order.html).
   The customer's details on one side; on the other, the order as it stands — the shirt on its model with the
   design on its back, every choice with a way back to change it, the delivery for the chosen wilaya and the total.
   CONFIRM ORDER checks every field, sends the order (js/orders.js) and opens the confirmation only once the order
   service says the order is saved. One reference goes with the order, so a second press or a retry can never
   create a second order. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const Flow = window.BeliefFlow;
  const Orders = window.BeliefOrders;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#orderForm');
  if (!form || !Flow) return;
  const O = C.order || {};
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const DETAILS = 'belief.details';    // what was typed, kept for the visit
  const REF = 'belief.orderRef';       // the reference of the order being placed
  const DONE = 'belief.confirmed';     // the order the confirmation page shows
  const keep = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (err) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (err) { /* private browsing */ } },
    drop(k) { try { sessionStorage.removeItem(k); } catch (err) { /* nothing kept */ } },
  };

  const d = Flow.current();
  const product = Flow.product(d);
  const packaging = (C.packaging?.options || []).find(o => o.id === d.packaging && o.status === 'available') || null;
  const back = $('#flowBack');
  if (back) back.href = Flow.nextHref('packaging.html', d);

  /* ---------- the shirt ---------- */
  if (d.color && window.BeliefGarment) {
    const g = window.BeliefGarment.build($('#orderGarment'), { colors: [d.color], sizes: '(min-width: 900px) 30vw, 80vw' });
    g.setShirt(d.color);
    if (product.design) g.show(product.design, { pull: false });
  } else $('.o-shirt').hidden = true;

  /* ---------- where it goes: the wilaya, then one of its communes (js/places.js) ---------- */
  const places = window.BeliefPlaces.pickers({
    wilaya: { input: $('#oWilaya'), hidden: form.elements.wilaya },
    commune: { input: $('#oCommune'), hidden: form.elements.commune },
  });
  // the wilaya as the order names it: "16 — Alger (الجزائر)"
  const placeLabel = code => { const w = window.BeliefPlaces.wilaya(code); return w ? `${String(w.code).padStart(2, '0')} — ${w.name}${w.nameAr ? ' (' + w.nameAr + ')' : ''}` : ''; };
  // the field the customer sees: the search box of a picker, or the field itself
  const shown = name => ({ wilaya: $('#oWilaya'), commune: $('#oCommune') })[name] || form.elements[name];
  const M = Flow.methods();
  const methodInputs = $$('input[name="method"]', form);

  /* ---------- reading and checking the fields ---------- */
  const field = name => form.elements[name];
  const val = name => (field(name)?.value || '').trim();
  const digits = v => v.replace(/[\s.\-()]/g, '');
  // Algerian numbers: mobiles 05/06/07 and landlines, with or without +213
  const phoneOk = v => /^(?:\+?213|0)(?:[5-7]\d{8}|[2-4]\d{7,8})$/.test(digits(v));
  const nameOk = v => v.length >= 2 && /^[\p{L}][\p{L}\p{M}' .-]*$/u.test(v);
  const emailOk = v => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(v);
  const method = () => (methodInputs.find(i => i.checked) || {}).value || '';

  const RULES = {
    firstName: v => (!v ? 'Enter your first name.' : nameOk(v) ? '' : 'Enter your first name in letters.'),
    familyName: v => (!v ? 'Enter your family name.' : nameOk(v) ? '' : 'Enter your family name in letters.'),
    phone: v => (!v ? 'Enter a phone number we can call.' : phoneOk(v) ? '' : 'Enter an Algerian number, like 05 55 12 34 56.'),
    phone2: v => (!v || phoneOk(v) ? '' : 'Enter an Algerian number, or leave this empty.'),
    email: v => (!v || emailOk(v) ? '' : 'Enter a valid email address, or leave this empty.'),
    wilaya: v => (v ? '' : 'Choose your wilaya.'),
    commune: v => (v ? '' : val('wilaya') ? 'Choose your commune.' : 'Choose your wilaya first.'),
    method: v => (v ? '' : 'Choose home delivery or stop desk.'),
    address: v => (v.length >= 5 ? '' : 'Enter the delivery address.'),
    instructions: () => '',
  };
  function messageBox(name) {
    if (name === 'method') return $('#oMethodField .o-msg');
    return field(name)?.closest('.o-field')?.querySelector('.o-msg');
  }
  function check(name, { show = true } = {}) {
    const v = name === 'method' ? method() : val(name);
    const err = RULES[name](v);
    if (show) {
      const box = messageBox(name);
      if (box) box.textContent = err;
      const wrap = name === 'method' ? $('#oMethodField') : field(name)?.closest('.o-field');
      wrap?.classList.toggle('is-wrong', !!err);
      if (name !== 'method') { if (err) shown(name).setAttribute('aria-invalid', 'true'); else shown(name).removeAttribute('aria-invalid'); }
    }
    return !err;
  }

  /* ---------- the order, as it stands ---------- */
  function shipping() {
    const code = val('wilaya'), m = method();
    const w = code ? Flow.wilaya(code) : null;
    const price = w && m ? Flow.shippingPrice(code, m) : null;
    return { w, method: m, price, listed: price != null };
  }
  function totals() {
    const s = shipping();
    const shirt = typeof product.price === 'number' ? product.price : 0;
    return { shirt, shipping: s.price, total: shirt + (s.price || 0), complete: s.listed };
  }
  // what is still missing from the earlier steps
  function missing() {
    const out = [];
    if (!d.color) out.push(['Choose your colour', 'shop.html']);
    if (!d.size) out.push(['Choose your size', Flow.nextHref('size.html', d)]);
    if (!packaging) out.push(['Choose your packaging', Flow.nextHref('packaging.html', d)]);
    return out;
  }

  const editLink = (href, label) => { const a = el('a', 'o-edit', 'Edit'); a.href = href; a.setAttribute('aria-label', 'Edit ' + label.toLowerCase()); return a; };
  function row(host, label, value, edit) {
    const dt = el('dt', '', label);
    const dd = el('dd');
    if (value instanceof Node) dd.append(value); else dd.textContent = value;
    if (edit) dd.append(edit);
    host.append(dt, dd);
  }

  function draw() {
    const sum = $('#orderSum');
    sum.textContent = '';
    const s = shipping();
    const swatch = el('span', 'o-swatch');
    swatch.dataset.color = d.color || '';
    const colour = el('span', 'o-colour');
    colour.append(swatch, document.createTextNode(Flow.colorLabel(d.color) || '—'));
    row(sum, 'T-shirt', 'Belief Project T-shirt');
    row(sum, 'Colour', colour, editLink(Flow.withParams('shop.html', {}), 'Colour'));
    row(sum, 'Design', product.design ? `${product.design.title} — ${product.design.direction}` : 'Plain, no design',
      editLink(product.design ? Flow.nextHref('studio.html', d) : Flow.withParams('customize.html', { color: d.color }), 'Design'));
    row(sum, 'Size', d.size || '—', editLink(Flow.nextHref('size.html', d), 'Size'));
    row(sum, 'Customisation', product.design ? 'Back print, cut out' : 'None');
    row(sum, 'Packaging', packaging ? packaging.name : '—', editLink(Flow.nextHref('packaging.html', d), 'Packaging'));
    const where = window.BeliefPlaces.wilaya(val('wilaya'));
    row(sum, 'Shipping', s.method ? `${M[s.method]}${where ? ', ' + where.name : ''}` : 'Choose below');

    const t = totals();
    const tot = $('#orderTotals');
    tot.textContent = '';
    row(tot, `T-shirt · ${product.label}`, Flow.money(t.shirt));
    row(tot, 'Shipping', !s.w || !s.method ? '—' : s.listed ? Flow.money(s.price) : (C.shipping?.onRequest || 'On request'));
    const total = !s.w || !s.method ? Flow.money(t.shirt) + ' + shipping' : s.listed ? Flow.money(t.total) : Flow.money(t.shirt) + ' + shipping';
    row(tot, 'Total', total);
    tot.lastElementChild.classList.add('o-total');
    tot.lastElementChild.previousElementSibling.classList.add('o-total-label');

    // the delivery prices for the chosen wilaya, on the two choices
    const code = val('wilaya');
    ['home', 'desk'].forEach(m => {
      const p = code ? Flow.shippingPrice(code, m) : null;
      $(`[data-method-price="${m}"]`).textContent = !code ? '—' : p != null ? Flow.money(p) : (C.shipping?.onRequest || 'On request');
    });

    const gaps = missing();
    const box = $('#orderMissing');
    box.textContent = '';
    box.hidden = !gaps.length;
    if (gaps.length) {
      box.append(document.createTextNode('Before you confirm: '));
      gaps.forEach(([label, href], i) => { const a = el('a', '', label); a.href = href; box.append(a); if (i < gaps.length - 1) box.append(document.createTextNode(' · ')); });
    }
    if (!s.listed && s.w && s.method) say(C.shipping?.onRequestNote || 'We confirm the delivery price with you by phone.', 'note');
  }

  /* ---------- the status line ---------- */
  const status = $('#orderStatus');
  function say(text, tone = '', link) {
    status.textContent = text;
    status.dataset.tone = tone;
    if (link) { const a = el('a', '', link[0]); a.href = link[1]; a.target = '_blank'; a.rel = 'noopener'; status.append(' ', a); }
  }

  /* ---------- typing ---------- */
  const saved = keep.get(DETAILS) || {};
  Object.entries(saved).forEach(([k, v]) => {
    if (k === 'method') { const r = methodInputs.find(i => i.value === v); if (r) r.checked = true; return; }
    if (k === 'wilaya' || k === 'commune') return; // the pickers put these back, below
    if (field(k) && typeof v === 'string') field(k).value = v;
  });
  // the address comes back only if it still names a real wilaya and one of its communes
  places.restore(saved.wilaya || Flow.read?.().wilaya || '', saved.commune || '');
  const remember = () => {
    const out = {};
    ['firstName', 'familyName', 'phone', 'phone2', 'email', 'wilaya', 'commune', 'address', 'instructions'].forEach(k => { out[k] = val(k); });
    out.method = method();
    keep.set(DETAILS, out);
    Flow.save({ wilaya: out.wilaya, delivery: out.method });
  };
  form.addEventListener('input', e => {
    const name = e.target.name;
    if (name && RULES[name] && e.target.closest('.o-field')?.classList.contains('is-wrong')) check(name);
    // a warning about the fields goes once the customer starts putting them right
    if (status.dataset.tone === 'error' && !sending) say('');
    remember();
    if (name === 'wilaya' || name === 'method') draw();
  });
  form.addEventListener('change', e => {
    if (e.target.name === 'method') { check('method'); }
    if (e.target.name === 'wilaya') { check('wilaya'); }
    remember();
    draw();
  });
  $$('input, textarea', form).forEach(i => i.addEventListener('blur', () => { if (i.name && RULES[i.name] && i.value.trim()) check(i.name); }));
  form.addEventListener('submit', e => { e.preventDefault(); confirm(); });

  /* ---------- confirming ---------- */
  const btn = $('#orderConfirm');
  Flow.glass(btn);
  let sending = false;
  async function confirm() {
    if (sending) return;
    const gaps = missing();
    const names = Object.keys(RULES);
    const ok = names.map(n => check(n)).every(Boolean);
    if (gaps.length || !ok) {
      if (gaps.length) say('Your order is missing a step: ' + gaps.map(g => g[0].toLowerCase()).join(', ') + '.', 'error');
      else say('Please check the highlighted fields.', 'error');
      const first = names.find(n => !check(n, { show: false }));
      if (first) (first === 'method' ? methodInputs[0] : shown(first)).focus();
      return;
    }
    sending = true;
    btn.disabled = true;
    btn.classList.add('is-sending');
    $('.o-confirm-label', btn).textContent = O.sendingLabel || 'Sending your order…';
    say('');

    const s = shipping(), t = totals();
    // the same reference for every try of this order: the order service never counts it twice
    let ref = keep.get(REF);
    if (!ref) { ref = (window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); keep.set(REF, ref); }
    const photo = await (window.BeliefGarment?.snapshot ? window.BeliefGarment.snapshot(d.color, product.design, 520) : Promise.resolve(''));
    const order = {
      kind: 'order',
      clientRef: ref,
      website: form.elements.website?.value || '',
      customer: {
        firstName: val('firstName'), familyName: val('familyName'),
        phone: val('phone'), phone2: val('phone2'), email: val('email'),
        wilaya: placeLabel(val('wilaya')), wilayaCode: s.w ? s.w.code : '',
        commune: val('commune'), address: val('address'), instructions: val('instructions'),
      },
      items: [{
        product: 'T-shirt', color: d.color, size: d.size, quantity: 1, photo,
        design: product.design ? product.design.title : '', direction: product.design ? product.design.direction : '', designKey: product.design ? product.design.key : '',
        customization: product.design ? 'Back print, cut out (no background)' : 'Plain, no design',
      }],
      packaging: packaging ? packaging.name : '',
      delivery: { method: s.method, methodLabel: M[s.method] || s.method, price: s.listed ? s.price : null },
      pricing: { currency: C.prices?.currency || 'DA', product: t.shirt, shipping: s.listed ? s.price : null, total: s.listed ? t.total : null, shippingOnRequest: !s.listed },
      measurements: { weight: d.weight || '', height: d.height || '' },
    };

    try {
      const { orderNumber } = await Orders.submit(order);
      // saved: the confirmation page shows this order, and only this one
      keep.set(DONE, {
        orderNumber, at: new Date().toISOString(), firstName: order.customer.firstName,
        color: d.color, design: product.design ? product.design.key : '', size: d.size, packaging: order.packaging,
        delivery: order.delivery.methodLabel, wilaya: order.customer.wilaya, commune: order.customer.commune,
        product: t.shirt, productLabel: product.label, shipping: order.pricing.shipping, total: order.pricing.total,
      });
      keep.drop(REF);
      keep.drop(DETAILS);
      Flow.clear();
      btn.classList.remove('is-sending');
      btn.classList.add('is-done');
      $('.o-confirm-label', btn).textContent = 'Order confirmed';
      setTimeout(() => window.location.assign('confirmation.html?order=' + encodeURIComponent(orderNumber)), reducedMotion.matches ? 300 : 1300);
    } catch (err) {
      sending = false;
      btn.disabled = false;
      btn.classList.remove('is-sending');
      $('.o-confirm-label', btn).textContent = O.confirmLabel || 'Confirm order';
      if (err && err.code === 'not_configured') say(O.notConnected || 'Ordering isn’t connected yet.', 'error', [C.contact?.whatsapp ? 'Message us on WhatsApp' : '', C.contact?.whatsapp || ''].filter(Boolean).length === 2 ? ['Message us on WhatsApp', C.contact.whatsapp] : null);
      else say((err && err.message) || O.failed || 'Your order couldn’t be sent.', 'error');
    }
  }
  btn.addEventListener('click', confirm);

  draw();
})();
