/* Belief Project — hero interactions. Text and links come from content.js. */
(() => {
  'use strict';

  const C = window.BELIEF || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const remap = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const get = path => path.split('.').reduce((o, k) => (o == null ? o : o[k]), C);

  /* ---------- content ---------- */
  function initContent() {
    $$('[data-bind]').forEach(el => {
      const v = get(el.dataset.bind);
      if (v != null && v !== '') el.textContent = v;
    });
    $$('[data-href]').forEach(el => {
      const v = get(el.dataset.href);
      if (v) el.setAttribute('href', v);
    });
    // amounts in dinars: [data-price="plain"] shows prices.plain as "3,900 DA"
    $$('[data-price]').forEach(el => {
      const v = C.prices?.[el.dataset.price];
      if (typeof v === 'number') el.textContent = v.toLocaleString('en-US') + ' ' + (C.prices.currency || 'DA');
    });
    // WhatsApp and email, wherever the page names them
    $$('[data-contact]').forEach(el => {
      const href = contactHref(el.dataset.contact);
      if (!href) return;
      el.href = href;
      if (/^https?:/i.test(href)) { el.target = '_blank'; el.rel = 'noopener'; }
      // email: a window with every way to write (a mailto: link alone does nothing without a mail app)
      if (el.dataset.contact === 'email' && window.BeliefPanels) { el.dataset.panel = 'contact'; el.setAttribute('aria-haspopup', 'dialog'); }
    });
    $$('[data-rows]').forEach(list => {
      (get(list.dataset.rows) || []).forEach(item => {
        const li = document.createElement('li');
        if (item.id) li.id = item.id;
        const external = /^https?:/i.test(item.url || '');
        // a row with an action opens a window on this page (js/panels.js); one with a url is a link
        const row = document.createElement(item.url ? 'a' : item.action ? 'button' : 'div');
        row.className = 'row';
        if (item.url) {
          row.href = item.url;
          if (external) { row.target = '_blank'; row.rel = 'noopener'; }
        } else if (item.action) {
          row.type = 'button';
          row.dataset.panel = item.action;
          row.setAttribute('aria-haspopup', 'dialog');
        }
        const name = document.createElement('span');
        name.className = 'row-name';
        name.textContent = item.label || '';
        const note = document.createElement('span');
        note.className = 'row-note';
        note.textContent = item.note || '';
        const arrow = document.createElement('span');
        arrow.className = 'row-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        row.append(name, note, arrow);
        li.append(row);
        list.append(li);
      });
    });
    const input = $('#nlEmail');
    if (input && C.newsletter?.placeholder) input.placeholder = C.newsletter.placeholder;

    const label = $('#communityLabel');
    if (label && C.community?.label) {
      label.alt = [C.community.title, C.community.titleSerif].filter(Boolean).join(' ');
      label.src = C.community.label;
      label.hidden = false;
      $('#communityWords').hidden = true;
    }

    const picture = $('#customPicture');
    if (picture && C.custom?.image) {
      const phone = $('#customSource');
      if (C.custom.imageMobile) phone.srcset = C.custom.imageMobile;
      else phone.remove();
      const photo = $('#customImage');
      photo.alt = C.custom.imageAlt || '';
      photo.src = C.custom.image;
      if (C.custom.focus) photo.style.objectPosition = C.custom.focus;
      picture.hidden = false;
    }

    // Shipping Prices, Size Guide, Contact Us: floating windows over the page
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-panel]');
      if (!t || !window.BeliefPanels) return;
      e.preventDefault();
      window.BeliefPanels.open(t.dataset.panel);
    });

    const socials = $('#socials');
    (C.socials || []).forEach(item => {
      const icon = ICONS[(item.name || '').toLowerCase()];
      if (!socials || !icon) return;
      const li = document.createElement('li');
      // no address yet: the icon is shown but is not a link
      const el = document.createElement(item.url ? 'a' : 'span');
      if (item.url) {
        el.href = item.url;
        el.target = '_blank';
        el.rel = 'noopener';
        el.setAttribute('aria-label', item.name);
      } else {
        el.setAttribute('aria-hidden', 'true');
      }
      el.innerHTML = icon;
      li.append(el);
      socials.append(li);
    });
  }

  // "whatsapp" → the chat link, "email" → a new email to the shop, with its subject
  function contactHref(kind) {
    const K = C.contact || {};
    if (kind === 'whatsapp') return K.whatsapp || '';
    if (kind === 'email' && K.email) return 'mailto:' + K.email + (K.emailSubject ? '?subject=' + encodeURIComponent(K.emailSubject) : '');
    return '';
  }

  const ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  };

  /* ---------- marquee ---------- */
  // Two identical groups side by side; sliding the track by one group's width loops with no seam.
  function initMarquee() {
    const track = $('#marqueeTrack');
    if (!track) return;
    const text = C.marquee || 'Belief Project';
    const SPEED = 34; // px per second
    let builtFor = 0;

    function build() {
      const width = Math.max(window.innerWidth, 320);
      if (width <= builtFor) return;
      builtFor = width;
      track.textContent = '';
      const group = document.createElement('div');
      group.className = 'marquee-group';
      const add = i => {
        const item = document.createElement('span');
        item.className = 'marquee-item' + (i % 2 ? ' is-serif' : '');
        item.textContent = text;
        group.append(item);
      };
      track.append(group);
      // an even count keeps the sans / serif alternation unbroken across the loop
      let i = 0;
      do { add(i++); add(i++); } while (group.getBoundingClientRect().width < width && i < 200);
      track.append(group.cloneNode(true));
      track.style.setProperty('--marquee-dur', (group.getBoundingClientRect().width / SPEED).toFixed(2) + 's');
    }

    build();
    document.fonts?.ready.then(() => { builtFor = 0; build(); });
    window.addEventListener('resize', build);
  }

  /* ---------- hero video ---------- */
  function initVideo() {
    const video = $('#heroVideo');
    if (!video) return;
    const phone = matchMedia('(max-width: 700px) and (orientation: portrait)');
    const src = (phone.matches && C.hero?.videoMobile) || C.hero?.video;
    if (C.hero?.poster) video.poster = C.hero.poster;
    if (src) video.src = src;

    // No controls: the video loops for as long as it is on screen. It only rests while
    // nobody can see it, and picks itself up again if the browser pauses it.
    let inView = true;
    const play = () => { if (inView && !document.hidden) video.play().catch(() => {}); };
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else video.pause();
    }, { threshold: .05 }).observe(video);
    document.addEventListener('visibilitychange', play);
    video.addEventListener('canplay', play, { once: true });
  }

  /* ---------- logo → bear → navigation ---------- */
  // p runs 0 → 1. It follows the scroll while the video is leaving the screen and
  // settles on 1 as soon as scrolling stops with any part of the video hidden.
  function initMorph() {
    const frame = $('#heroFrame');
    const logo = $('#heroLogo');
    const inner = $('#heroLogoIn');
    const dock = $('#dock');
    const slot = $('#dockBear');
    const menu = $('#dockMenu');
    const panel = $('#dockPanel');
    if (!frame || !logo || !inner || !dock || !slot) return;

    let p = 0, target = 0, floor = 0, raf = 0, last = 0, lastY = window.scrollY, idle = 0;

    const hiddenPx = () => Math.max(0, -frame.getBoundingClientRect().top);

    function setMenu(open) {
      if (!menu || !panel) return;
      menu.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }

    function render() {
      const style = dock.style;
      if (p <= 0) {
        inner.style.transform = '';
        inner.style.visibility = '';
        inner.style.removeProperty('--fade');
        inner.style.removeProperty('--ink');
      } else {
        // the logo's own box never moves; only the inner layer travels to the bear's slot
        const from = logo.getBoundingClientRect();
        const to = slot.getBoundingClientRect();
        const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        // first 58%: the wordmark flies to the slot; then the bear takes its place and the bar opens
        const t = easeInOut(remap(p, 0, .58));
        const x = dx * Math.pow(t, 1.5);
        const y = dy * (1 - Math.pow(1 - t, 1.5));
        const s = Math.pow(to.width / from.width, t); // geometric, so it shrinks evenly
        inner.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
        inner.style.visibility = p >= .6 ? 'hidden' : '';
        // ice blue turns to midnight ink on the way up, then gives way to the bear
        inner.style.setProperty('--ink', remap(p, .08, .4).toFixed(3));
        inner.style.setProperty('--fade', (1 - remap(p, .47, .6)).toFixed(3));
      }

      style.setProperty('--dock-o', remap(p, .44, .58).toFixed(3));
      style.setProperty('--bear-o', remap(p, .48, .66).toFixed(3));
      style.setProperty('--bear-s', lerp(.5, 1, easeOut(remap(p, .48, .76))).toFixed(4));
      style.setProperty('--bear-blur', ((1 - remap(p, .48, .7)) * 6).toFixed(2) + 'px');
      style.setProperty('--e', easeInOut(remap(p, .6, 1)).toFixed(4));
      style.setProperty('--links-o', remap(p, .86, 1).toFixed(3));
      dock.classList.toggle('is-live', p > .44);
      const usable = p > .9;
      dock.inert = !usable;
      if (!usable) setMenu(false);
    }

    function tick(now) {
      const dt = Math.min(64, now - last);
      last = now;
      p += (target - p) * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 95));
      if (Math.abs(target - p) < .0008) p = target;
      render();
      raf = p === target ? 0 : requestAnimationFrame(tick);
    }
    function kick() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function onScroll() {
      const hidden = hiddenPx();
      const span = Math.min(240, frame.offsetHeight * .4);
      const scrub = clamp(hidden / span);
      const down = window.scrollY >= lastY;
      lastY = window.scrollY;
      if (hidden <= 0) floor = 0;
      target = down ? Math.max(scrub, floor) : scrub;
      clearTimeout(idle);
      idle = setTimeout(() => {
        target = floor = hiddenPx() > 2 ? 1 : 0;
        kick();
      }, 150);
      kick();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pageshow', onScroll);
    onScroll();

    menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    panel?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
    });

    // a soft light follows the cursor along the top edge of the glass
    const bar = $('#dockBar');
    bar?.addEventListener('pointermove', e => {
      const r = bar.getBoundingClientRect();
      bar.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      bar.style.setProperty('--gh', '1');
    });
    bar?.addEventListener('pointerleave', () => bar.style.setProperty('--gh', '0'));
  }

  /* ---------- Shop Now: liquid glass ---------- */
  // The button is a soft body on springs: the cursor pulls it, stretches it and
  // drags the highlights across its surface; entering sends a ripple from the point of contact.
  function initLiquid(btn) {
    if (!btn) return;
    const shine = $('.liquid-shine', btn);
    const disp = $('#liquidDisp');
    const K = 190, DAMP = 11;      // stretch spring: loose enough to wobble
    const KM = 150, DAMPM = 17;    // pull spring: follows the cursor without overshoot
    const S = {
      sx: 1, sy: 1, vx: 0, vy: 0, tsx: 1, tsy: 1,
      ox: 0, oy: 0, vox: 0, voy: 0, tox: 0, toy: 0,
      hx: .5, hy: .5, thx: .5, thy: .5,
      hov: 0, thov: 0, energy: 0,
    };
    let raf = 0, last = 0, px = 0, py = 0, pressed = false;

    function apply() {
      btn.style.transform = `translate3d(${S.ox.toFixed(2)}px,${S.oy.toFixed(2)}px,0) scale(${S.sx.toFixed(4)},${S.sy.toFixed(4)})`;
      // the shine layer overhangs the button by 40% on every side
      btn.style.setProperty('--mx', (22.2 + S.hx * 55.6).toFixed(2) + '%');
      btn.style.setProperty('--my', (22.2 + S.hy * 55.6).toFixed(2) + '%');
      btn.style.setProperty('--hov', S.hov.toFixed(3));
      btn.style.setProperty('--ang', (Math.atan2(S.hy - .5, S.hx - .5) * 180 / Math.PI + 90).toFixed(1));
      disp?.setAttribute('scale', (S.energy * 24).toFixed(2));
    }

    function step(now) {
      const dt = Math.min(.032, (now - last) / 1000 || .016);
      last = now;
      S.vx += (-K * (S.sx - S.tsx) - DAMP * S.vx) * dt; S.sx += S.vx * dt;
      S.vy += (-K * (S.sy - S.tsy) - DAMP * S.vy) * dt; S.sy += S.vy * dt;
      S.vox += (-KM * (S.ox - S.tox) - DAMPM * S.vox) * dt; S.ox += S.vox * dt;
      S.voy += (-KM * (S.oy - S.toy) - DAMPM * S.voy) * dt; S.oy += S.voy * dt;
      const follow = 1 - Math.exp(-dt * 9);
      S.hx += (S.thx - S.hx) * follow;
      S.hy += (S.thy - S.hy) * follow;
      S.hov += (S.thov - S.hov) * (1 - Math.exp(-dt * 7));
      S.energy *= Math.exp(-dt * 4.2);
      apply();
      const moving =
        Math.abs(S.vx) + Math.abs(S.vy) > .004 ||
        Math.abs(S.sx - S.tsx) + Math.abs(S.sy - S.tsy) > .0008 ||
        Math.abs(S.vox) + Math.abs(S.voy) > .05 ||
        Math.abs(S.ox - S.tox) + Math.abs(S.oy - S.toy) > .05 ||
        Math.abs(S.hx - S.thx) + Math.abs(S.hy - S.thy) > .002 ||
        Math.abs(S.hov - S.thov) > .004 ||
        S.energy > .01;
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function kick() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    function local(e) {
      const r = btn.getBoundingClientRect();
      return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
    }
    function ripple(pos) {
      if (!shine || reducedMotion.matches) return;
      const drop = document.createElement('span');
      drop.className = 'liquid-ripple';
      drop.style.setProperty('--rx', (pos.x * 100).toFixed(1) + '%');
      drop.style.setProperty('--ry', (pos.y * 100).toFixed(1) + '%');
      drop.addEventListener('animationend', () => drop.remove());
      shine.append(drop);
    }
    function rest() {
      const hover = S.thov > 0 && !reducedMotion.matches;
      S.tsx = pressed ? .965 : hover ? 1.035 : 1;
      S.tsy = pressed ? .93 : hover ? 1.035 : 1;
    }

    function enter(e) {
      const pos = local(e);
      px = e.clientX; py = e.clientY;
      S.thov = 1;
      S.hx = S.thx = pos.x; S.hy = S.thy = pos.y;
      rest();
      if (!reducedMotion.matches) {
        // the surface gives way along the axis the cursor came in on
        const side = Math.min(pos.x, 1 - pos.x) < Math.min(pos.y, 1 - pos.y);
        S.vx += side ? -.75 : .6;
        S.vy += side ? .6 : -.75;
        S.energy = 1;
      }
      ripple(pos);
      kick();
    }
    function leave() {
      S.thov = 0; S.tox = S.toy = 0; pressed = false;
      rest();
      if (!reducedMotion.matches) { S.vx -= .5; S.vy += .5; S.energy = Math.max(S.energy, .7); }
      kick();
    }
    // Phones have no hover, so the press plays the whole animation: the finger stands in for
    // the cursor while it is down, and the glass stays lit for a beat after it lifts.
    let settle = 0;
    const settleTouch = () => { clearTimeout(settle); btn.classList.remove('is-touch'); leave(); };

    btn.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch') return;
      enter(e);
    });
    btn.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !pressed) return;
      const pos = local(e);
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      S.thx = pos.x; S.thy = pos.y;
      if (!reducedMotion.matches) {
        S.tox = (pos.x - .5) * 12;
        S.toy = (pos.y - .5) * 8;
        S.vx += clamp(Math.abs(dx) - Math.abs(dy), -20, 20) * .0035; // stretches along the direction of travel
        S.vy -= clamp(Math.abs(dx) - Math.abs(dy), -20, 20) * .0035;
        S.energy = Math.min(1, S.energy + Math.hypot(dx, dy) * .012);
      }
      kick();
    });
    btn.addEventListener('pointerleave', e => {
      if (e.pointerType === 'touch') return;
      leave();
    });
    btn.addEventListener('pointerdown', e => {
      const touch = e.pointerType === 'touch';
      if (touch) { clearTimeout(settle); btn.classList.add('is-touch'); enter(e); }
      pressed = true;
      rest();
      S.energy = 1;
      if (!touch) ripple(local(e)); // a finger's ripple has already left from enter()
      kick();
    });
    const release = e => {
      if (e.pointerType === 'touch') { clearTimeout(settle); settle = setTimeout(settleTouch, 700); }
      if (!pressed) return;
      pressed = false; rest(); kick();
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) { S.thov = 1; rest(); kick(); } });
    btn.addEventListener('blur', () => { if (!btn.matches(':hover')) { S.thov = 0; rest(); kick(); } });
    // coming back with the phone's back button finds the button at rest
    window.addEventListener('pageshow', e => { if (e.persisted && btn.classList.contains('is-touch')) settleTouch(); });
    holdTap(btn, 450);
  }

  /* ---------- phones: a tap plays the button's animation, then follows the link ---------- */
  // Only a finger is held back; a mouse click or the keyboard opens the link at once.
  function holdTap(link, ms) {
    let finger = false, timer = 0;
    link.addEventListener('pointerdown', e => { finger = e.pointerType === 'touch'; });
    link.addEventListener('click', e => {
      const tapped = finger;
      finger = false;
      const href = link.getAttribute('href') || '';
      if (!tapped || reducedMotion.matches || e.defaultPrevented || !href || href[0] === '#' || link.target === '_blank') return;
      e.preventDefault();
      clearTimeout(timer);
      timer = setTimeout(() => window.location.assign(link.href), ms);
    });
  }

  /* ---------- Make It Yours on phones ---------- */
  // The pill clears to show the photo while the cursor is over it. A finger has no hover,
  // so the press clears it and it fills again a moment after the finger lifts.
  function initPill(pill) {
    if (!pill) return;
    let refill = 0;
    const fill = () => { clearTimeout(refill); pill.classList.remove('is-touch'); };
    pill.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      clearTimeout(refill);
      pill.classList.add('is-touch');
    });
    const lift = e => {
      if (e.pointerType !== 'touch') return;
      clearTimeout(refill);
      refill = setTimeout(fill, 1000);
    };
    pill.addEventListener('pointerup', lift);
    pill.addEventListener('pointercancel', lift);
    window.addEventListener('pageshow', e => { if (e.persisted) fill(); });
    holdTap(pill, 560);
  }

  /* ---------- colour selection page ---------- */
  // Each half is one link. Its side widens and its photo scales up while the cursor is over it;
  // on a phone the tap does that. Until content.js names the next page (shop.next) a click only
  // marks the colour as chosen; once it does, the same click opens that page with ?color=<id>.
  function initPick() {
    const pick = $('#colours');
    if (!pick) return;
    const tones = $$('.tone', pick);
    const status = $('#pickStatus');
    const next = C.shop?.next || '';
    const STORE = 'belief.color';
    let leaving = 0;

    const show = tone => {
      tones.forEach(t => t.classList.toggle('is-active', t === tone));
      pick.classList.toggle('has-active', !!tone);
    };
    const mark = tone => tones.forEach(t => {
      t.classList.toggle('is-picked', t === tone);
      if (t === tone) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });

    // on a phone held upright the halves are stacked, wider than tall: the wide photographs fit them
    const stacked = matchMedia('(max-width: 700px) and (orientation: portrait)');
    tones.forEach(tone => {
      const id = tone.dataset.color;
      const data = (C.shop?.colors || []).find(c => c.id === id) || {};
      const photo = $('img', tone);
      if (data.label) $('.tone-name', tone).textContent = data.label;
      const frame = () => {
        const wide = stacked.matches && data.imageWide;
        const focus = (wide && data.focusWide) || data.focus;
        if (focus) tone.style.setProperty('--focus', focus);
        const src = wide ? data.imageWide : data.image;
        if (photo && src && photo.getAttribute('src') !== src) photo.src = src;
      };
      if (photo && data.image) {
        photo.alt = data.imageAlt || '';
        frame();
        photo.hidden = false;
        stacked.addEventListener?.('change', frame);
      }
      if (next) tone.href = next + (next.includes('?') ? '&' : '?') + 'color=' + encodeURIComponent(id);

      let finger = false;
      tone.addEventListener('pointerdown', e => { finger = e.pointerType === 'touch'; });
      tone.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') show(tone); });
      tone.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') show(null); });
      tone.addEventListener('focus', () => { if (tone.matches(':focus-visible')) show(tone); });
      tone.addEventListener('blur', () => { if (tone.classList.contains('is-active') && !tone.matches(':hover')) show(null); });
      tone.addEventListener('click', e => {
        const tapped = finger;
        finger = false;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        mark(tone);
        try { sessionStorage.setItem(STORE, id); } catch (err) { /* private browsing */ }
        if (status) status.textContent = $('.tone-name', tone).textContent + ' selected';
        if (tapped) show(tone);
        if (!next) { e.preventDefault(); return; }
        if (tapped && !reducedMotion.matches) {
          // the photo finishes growing before the page changes
          e.preventDefault();
          clearTimeout(leaving);
          leaving = setTimeout(() => window.location.assign(tone.href), 700);
        }
      });
    });

    let saved = '';
    try { saved = sessionStorage.getItem(STORE) || ''; } catch (err) { /* private browsing */ }
    const chosen = tones.find(t => t.dataset.color === saved);
    if (chosen) mark(chosen);
    window.addEventListener('pageshow', e => { if (e.persisted) show(null); });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- newsletter ---------- */
  function initNewsletter() {
    const form = $('#nlForm');
    if (!form) return;
    const input = $('#nlEmail', form);
    const button = $('.nl-submit', form);
    const status = $('#nlStatus', form);
    const N = C.newsletter || {};
    // the sign-up is saved by the same Google script as the orders (backend/order-email), which writes it to Notion
    const endpoint = N.endpoint || '';
    const say = (text, kind) => {
      status.textContent = text;
      form.dataset.state = kind || '';
    };

    input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); if (form.dataset.state !== 'done') say(''); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        say('Enter a valid email address.', 'error');
        input.focus();
        return;
      }
      // nothing is shown as saved unless the service says it was saved
      if (!endpoint) {
        say(N.notConnected || 'Sign-ups open soon: we can’t save your email just yet.', 'error');
        return;
      }
      button.disabled = true;
      form.classList.add('is-sending');
      try {
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), 20000);
        // sent as plain text so the browser needs no permission round-trip with Google
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ kind: 'subscribe', email, source: 'Website newsletter', website: $('#nlWebsite', form)?.value || '' }),
          redirect: 'follow',
          signal: abort.signal,
        });
        clearTimeout(timer);
        const answer = res.ok ? await res.json() : null;
        if (!answer || answer.ok !== true || answer.saved !== true) throw new Error((answer && answer.error) || 'not_saved');
        form.classList.add('is-done');
        say(answer.duplicate ? (N.already || "You're already on the list.") : (N.success || "You're on the list."), 'done');
        input.value = '';
      } catch (err) {
        console.error(err);
        say(N.failed || 'We couldn’t save your email. Please try again in a moment.', 'error');
      } finally {
        button.disabled = false;
        form.classList.remove('is-sending');
      }
    });
  }

  initContent();
  initMarquee();
  initVideo();
  initMorph();
  initLiquid($('#shopNow'));
  initPill($('.pill-cta'));
  initPick();
  initReveal();
  initNewsletter();
})();
