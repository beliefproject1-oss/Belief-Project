/* Belief Project — the confirmation (confirmation.html).
   js/order.js keeps the order the order service confirmed as saved; this page shows that order — and only when the
   reference in the address is that order's — with a moment of celebration: the seal draws itself, the title rises
   and a little confetti in the brand's colours falls once. Anything else (no order, another reference) gets a plain page saying there is nothing to show. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const Flow = window.BeliefFlow;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!$('#done') || !Flow) return;

  let done = null;
  try { done = JSON.parse(sessionStorage.getItem('belief.confirmed') || 'null'); } catch (err) { done = null; }
  const asked = new URLSearchParams(location.search).get('order') || '';
  if (!done || !done.orderNumber || done.orderNumber !== asked) {
    $('#doneEmpty').hidden = false;
    document.body.classList.add('is-empty');
    return;
  }

  /* ---------- the order ---------- */
  $('#doneHero').hidden = false;
  $('#doneBody').hidden = false;
  $('#doneRef').textContent = done.orderNumber;
  $('#doneHello').textContent = `Thank you, ${done.firstName || 'friend'}.`;
  $('#doneThanks').textContent = C.order?.thanks || 'Thank you for believing with us.';
  const design = Flow.designOf(done.design);
  const row = (host, label, value) => host.append(el('dt', '', label), el('dd', '', value));
  const sum = $('#doneSum');
  row(sum, 'T-shirt', 'Belief Project T-shirt');
  row(sum, 'Colour', Flow.colorLabel(done.color));
  row(sum, 'Design', design ? `${design.title} — ${design.direction}` : 'Plain, no design');
  row(sum, 'Size', done.size || '—');
  row(sum, 'Customisation', design ? 'Back print, cut out' : 'None');
  row(sum, 'Packaging', done.packaging || '—');
  row(sum, 'Delivery', [done.delivery, done.wilaya, done.commune].filter(Boolean).join(' · '));
  const tot = $('#doneTotals');
  row(tot, `T-shirt · ${done.productLabel || ''}`, Flow.money(done.product));
  row(tot, 'Shipping', typeof done.shipping === 'number' ? Flow.money(done.shipping) : (C.shipping?.onRequest || 'On request'));
  row(tot, 'Total', typeof done.total === 'number' ? Flow.money(done.total) : Flow.money(done.product) + ' + shipping');
  tot.lastElementChild.classList.add('o-total');
  tot.lastElementChild.previousElementSibling.classList.add('o-total-label');

  if (window.BeliefGarment && done.color) {
    const g = window.BeliefGarment.build($('#doneGarment'), { colors: [done.color], sizes: '(min-width: 900px) 34vw, 86vw' });
    g.setShirt(done.color);
    if (design) setTimeout(() => g.show(design), reducedMotion.matches ? 0 : 900);
  }

  // the reference, copied in one tap
  $('#doneCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(done.orderNumber); $('#doneCopy').textContent = 'Copied'; }
    catch (err) { $('#doneCopy').textContent = 'Select it'; }
    setTimeout(() => { $('#doneCopy').textContent = 'Copy'; }, 1800);
  });

  document.body.classList.add('is-celebrating');
  if (!reducedMotion.matches) confetti($('#doneConfetti'));

  /* ---------- confetti: a single, gentle fall in Ice Blue, white and cream ---------- */
  function confetti(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const colors = ['#C2E2FE', '#FFFFFF', '#FFEDDF', '#8DBDF0', '#E7F3FF'];
    let w = 0, h = 0;
    const size = () => { w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr; };
    size();
    window.addEventListener('resize', size);
    const count = Math.round(Math.min(140, innerWidth / 7));
    const bits = Array.from({ length: count }, (_, i) => ({
      x: (0.15 + Math.random() * 0.7) * w, y: -Math.random() * h * 0.4 - 20 * dpr,
      vx: (Math.random() - 0.5) * 2.4 * dpr, vy: (2 + Math.random() * 3) * dpr,
      r: (3 + Math.random() * 5) * dpr, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.2,
      c: colors[i % colors.length], shape: i % 3,
    }));
    const start = performance.now();
    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      bits.forEach(b => {
        b.vy += 0.035 * dpr; b.vx *= 0.995; b.x += b.vx + Math.sin(t * 2 + b.a) * 0.6 * dpr; b.y += b.vy; b.a += b.va;
        if (b.y < h + 30) alive++;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.globalAlpha = Math.max(0, Math.min(1, 4.2 - t));
        ctx.fillStyle = b.c;
        if (b.shape === 0) ctx.fillRect(-b.r, -b.r * 0.45, b.r * 2, b.r * 0.9);
        else if (b.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, b.r * 0.6, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(0, -b.r); ctx.lineTo(b.r * 0.8, b.r * 0.7); ctx.lineTo(-b.r * 0.8, b.r * 0.7); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      });
      if (alive && t < 4.5) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, w, h); canvas.remove(); }
    }
    requestAnimationFrame(frame);
  }
})();
