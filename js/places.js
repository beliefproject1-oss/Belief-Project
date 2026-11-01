/* Belief Project — the wilaya and commune pickers of the order page (order.html).
   The places are the 58 wilayas of Algeria and their 1,541 communes, in French and Arabic (assets/data/places.js,
   made by tools/prepare-places.js). BeliefPlaces.pickers({ wilaya, commune }) turns two fields into searchable
   lists: the wilaya first; then the commune, which lists only the communes of that wilaya. Typing finds a place by
   its French or Arabic name, with or without accents, or a wilaya by its number. Changing the wilaya empties the
   commune. Each field keeps its choice in a hidden input (the wilaya's number, the commune's name) that the form
   sends; the input the customer types in only shows it. */
window.BeliefPlaces = (() => {
  'use strict';

  const D = window.BELIEF_PLACES || { wilayas: [], communes: {} };
  const pad = n => String(n).padStart(2, '0');
  // "Béjaïa", "bejaia" and "BEJAIA" are the same search; so are the ways Arabic writes alef, ya and ta marbuta
  const fold = s => String(s).normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/['’`\s-]+/g, ' ').toLowerCase().trim();

  const wilayas = () => D.wilayas.map(([code, fr, ar]) => ({ value: String(code), label: `${pad(code)} — ${fr}`, sub: ar, keys: [fold(fr), fold(ar), pad(code), String(code)] }));
  const communes = code => (D.communes[code] || []).map(([fr, ar]) => ({ value: ar ? `${fr} (${ar})` : fr, label: fr, sub: ar, keys: [fold(fr), fold(ar)] }));
  const wilaya = code => { const w = D.wilayas.find(x => x[0] === Number(code)); return w ? { code: w[0], name: w[1], nameAr: w[2] } : null; };

  let uid = 0;
  // one searchable list: `input` is what the customer types in, `hidden` holds the choice, `list` gives the options
  function combo({ input, hidden, list, empty, onPick }) {
    const id = 'combo-' + (++uid);
    const box = document.createElement('ul');
    box.className = 'o-combo-list';
    box.id = id;
    box.setAttribute('role', 'listbox');
    box.hidden = true;
    input.parentNode.append(box);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', id);
    input.autocomplete = 'off';
    input.spellcheck = false;
    let shown = [], active = -1, chosen = null;

    const labelOf = o => (o ? o.label : '');
    const options = () => list();
    function render(query) {
      const q = fold(query || '');
      const all = options();
      // a choice already in the box shows the whole list; typing narrows it, names that begin with it first
      shown = !q || (chosen && query === chosen.label) ? all
        : all.filter(o => o.keys.some(k => k.includes(q))).sort((a, b) => (b.keys.some(k => k.startsWith(q)) ? 1 : 0) - (a.keys.some(k => k.startsWith(q)) ? 1 : 0));
      box.textContent = '';
      if (!shown.length) {
        const li = document.createElement('li');
        li.className = 'o-combo-empty';
        li.textContent = empty(query);
        box.append(li);
      }
      shown.forEach((o, i) => {
        const li = document.createElement('li');
        li.id = `${id}-${i}`;
        li.className = 'o-combo-option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', chosen && chosen.value === o.value ? 'true' : 'false');
        const a = document.createElement('span'); a.textContent = o.label;
        li.append(a);
        if (o.sub) { const b = document.createElement('span'); b.className = 'o-combo-ar'; b.lang = 'ar'; b.dir = 'rtl'; b.textContent = o.sub; li.append(b); }
        li.addEventListener('pointerdown', e => { e.preventDefault(); pick(o); });
        box.append(li);
      });
      setActive(shown.findIndex(o => chosen && o.value === chosen.value));
    }
    function setActive(i) {
      active = i;
      [...box.children].forEach((li, k) => li.classList.toggle('is-active', k === i));
      if (i >= 0 && box.children[i]) { input.setAttribute('aria-activedescendant', box.children[i].id); box.children[i].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    function open() {
      if (input.disabled) return;
      render(input.value);
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function close() {
      box.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function pick(o, { quiet = false } = {}) {
      const changed = (chosen && chosen.value) !== (o && o.value);
      chosen = o || null;
      input.value = labelOf(chosen);
      hidden.value = chosen ? chosen.value : '';
      close();
      if (changed && !quiet) {
        hidden.dispatchEvent(new Event('input', { bubbles: true }));
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (!quiet && onPick) onPick(chosen);
    }

    input.addEventListener('focus', open);
    input.addEventListener('click', () => { if (box.hidden) open(); });
    input.addEventListener('input', e => { e.stopPropagation(); render(input.value); box.hidden = false; input.setAttribute('aria-expanded', 'true'); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (box.hidden) open();
        const n = shown.length;
        if (n) setActive(e.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
      } else if (e.key === 'Enter') {
        if (!box.hidden) { e.preventDefault(); const o = shown[active] || (shown.length === 1 ? shown[0] : null); if (o) pick(o); }
      } else if (e.key === 'Escape') {
        if (!box.hidden) { e.preventDefault(); input.value = labelOf(chosen); close(); }
      } else if (e.key === 'Tab' && !box.hidden && shown.length === 1 && input.value.trim()) {
        pick(shown[0]);
      }
    });
    input.addEventListener('blur', () => {
      // what was typed counts if it names one place exactly; otherwise the box goes back to the choice
      const q = fold(input.value);
      const exact = q && options().find(o => o.keys.includes(q) || fold(o.label) === q);
      if (exact && (!chosen || exact.value !== chosen.value)) pick(exact);
      else input.value = labelOf(chosen);
      close();
      hidden.dispatchEvent(new Event('blur'));
    });

    return {
      set(value, opts) { pick(options().find(o => o.value === String(value)) || null, { quiet: true, ...opts }); },
      clear() { pick(null, { quiet: true }); hidden.dispatchEvent(new Event('input', { bubbles: true })); },
      value: () => hidden.value,
      input,
    };
  }

  function pickers({ wilaya: w, commune: c }) {
    let current = '';
    const commune = combo({
      ...c,
      list: () => communes(current),
      empty: q => (current ? `No commune of this wilaya matches “${q}”.` : 'Choose your wilaya first.'),
    });
    const lock = () => {
      c.input.disabled = !current;
      c.input.placeholder = current ? 'Search your commune' : 'Choose your wilaya first';
    };
    const wil = combo({
      ...w,
      list: wilayas,
      empty: q => `No wilaya matches “${q}”.`,
      onPick: o => {
        const next = o ? o.value : '';
        if (next !== current) { current = next; commune.clear(); }
        lock();
      },
    });
    lock();
    return {
      wilaya: wil,
      commune,
      // a saved address comes back as it was, if it still names a real place
      restore(code, name) {
        wil.set(code);
        current = wil.value();
        lock();
        if (current && name) commune.set(name);
      },
    };
  }

  return { pickers, wilaya, wilayas, communes, fold };
})();
