/* Belief Project — the size recommendation.
   One set of rules (content.js, size.rules), used by the Size Guide window on the homepage and by the Find Your Fit
   page, so both always give the same answer. Weight decides the size; height is only kept with the order.
   A weight no rule covers gets no size — the customer is asked to get in touch instead of being given a guess.

     BeliefSizing.parse('72,5')       → 72.5 (NaN when it is not a number)
     BeliefSizing.check('weight', 72) → '' or the reason it cannot be used ("Enter a weight between 30 and 250 kg.")
     BeliefSizing.recommend(72)       → { state: 'found', size: 'L' } | { state: 'outside' } */
window.BeliefSizing = (() => {
  'use strict';

  const S = (window.BELIEF || {}).size || {};
  const limits = { height: [120, 230], weight: [30, 250], ...(S.limits || {}) };
  const units = { height: 'cm', weight: 'kg' };
  const unitWords = { height: 'centimetres', weight: 'kilograms' };
  const sizes = (S.sizes && S.sizes.length ? S.sizes : ['M', 'L', 'XL']).map(String);
  const rules = (S.rules || []).filter(r => r && r.size && Array.isArray(r.weight));

  // whole or decimal numbers, with a point or a comma ("72,5")
  const parse = v => {
    const s = String(v ?? '').trim().replace(',', '.');
    return /^\d{1,3}(\.\d{1,2})?$/.test(s) ? parseFloat(s) : NaN;
  };

  function check(kind, value, { required = kind === 'weight' } = {}) {
    const word = (kind === 'height' ? S.heightLabel || 'Height' : S.weightLabel || 'Weight').toLowerCase();
    const [lo, hi] = limits[kind];
    if (value === '' || value == null || (typeof value === 'number' && Number.isNaN(value) && String(value) === '')) {
      return required ? `Enter your ${word} in ${unitWords[kind]}.` : '';
    }
    const v = typeof value === 'number' ? value : parse(value);
    if (!(v >= lo && v <= hi)) return `Enter a ${word} between ${lo} and ${hi} ${units[kind]}.`;
    return '';
  }

  // the first rule whose weight range holds the weight gives the size
  function recommend(weight) {
    const w = typeof weight === 'number' ? weight : parse(weight);
    if (Number.isNaN(w)) return { state: 'invalid' };
    const r = rules.find(r => w >= r.weight[0] && (r.weight[1] == null || w <= r.weight[1]));
    return r ? { state: 'found', size: String(r.size) } : { state: 'outside' };
  }

  // the rules as lines for a table: "50–60 kg" → "M"
  const table = () => rules.map(r => ({ size: String(r.size), range: r.weight[1] == null ? `${r.weight[0]} kg and above` : `${r.weight[0]}–${r.weight[1]} kg` }));

  return { parse, check, recommend, table, sizes, limits, units };
})();
