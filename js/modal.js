/* Belief Project — floating windows: a pane of liquid glass over the page.
   BeliefModal.open({ title, eyebrow, body, wide, onClose }) opens one; it returns { close }.
   The page behind is dimmed and blurred and does not scroll; Escape, the close button or a click outside closes it,
   and focus returns to whatever opened it. BeliefPanels (js/panels.js) builds the shipping and size windows. */
window.BeliefModal = (() => {
  'use strict';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let openOne = null;

  function open({ title = '', eyebrow = '', body, wide = false, onClose, label } = {}) {
    if (openOne) openOne.close({ quiet: true });
    const opener = document.activeElement;
    const root = document.createElement('div');
    root.className = 'modal' + (wide ? ' is-wide' : '');
    root.innerHTML = '<div class="modal-veil" data-close></div>' +
      '<section class="modal-pane" role="dialog" aria-modal="true" tabindex="-1">' +
      '<span class="modal-shine" aria-hidden="true"></span>' +
      '<header class="modal-head"><div class="modal-titles"><p class="modal-eyebrow"></p><h2 class="modal-title"></h2></div>' +
      '<button class="modal-close" type="button" aria-label="Close" data-close><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></header>' +
      '<div class="modal-body"></div></section>';
    const pane = root.querySelector('.modal-pane');
    root.querySelector('.modal-eyebrow').textContent = eyebrow;
    if (!eyebrow) root.querySelector('.modal-eyebrow').remove();
    const h = root.querySelector('.modal-title');
    h.textContent = title;
    h.id = 'modal-title-' + Date.now();
    pane.setAttribute('aria-labelledby', h.id);
    if (label) pane.setAttribute('aria-label', label);
    if (body) root.querySelector('.modal-body').append(body);
    document.body.append(root);
    document.documentElement.classList.add('has-modal');
    // opened on the next frame, so it fades in; a tab that holds frames back still gets it open
    const reveal = () => { if (!closed) root.classList.add('is-open'); };
    requestAnimationFrame(reveal);
    setTimeout(reveal, 60);

    // the light on the glass follows the pointer
    pane.addEventListener('pointermove', e => {
      const r = pane.getBoundingClientRect();
      pane.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      pane.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });

    const focusables = () => [...pane.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(n => n.offsetParent !== null);
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', key);
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });

    let closed = false;
    function close({ quiet = false } = {}) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', key);
      root.classList.remove('is-open');
      root.classList.add('is-closing');
      const done = () => {
        root.remove();
        if (!document.querySelector('.modal')) document.documentElement.classList.remove('has-modal');
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      };
      if (reducedMotion.matches || quiet) done(); else setTimeout(done, 380);
      if (openOne && openOne.root === root) openOne = null;
      onClose?.();
    }
    // the first field, or the window itself, takes focus
    setTimeout(() => (pane.querySelector('[autofocus]') || pane).focus({ preventScroll: true }), reducedMotion.matches ? 0 : 60);
    openOne = { root, close };
    return { close, root, pane };
  }

  return { open };
})();
