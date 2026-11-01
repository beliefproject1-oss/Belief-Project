/* Creed Type — words to live by, lettered by hand.
   Script, serif capitals and brush lettering, set together like a sign painter would; two inks and a light hand. */
'use strict';
const K = require('./kit');
const { C, text, outlined, arcText, layout, capHeight, P, g, sparkle, star } = K;

const red = C.tomato, cream = C.cream, gold = C.sun, navy = C.ink;
const sheet = C.ink; // cream lettering needs a dark sheet behind it when printed with its background
// a hand-drawn line: a tapered stroke, thick in the middle
const swoosh = (x0, y0, x1, y1, lift, w, fill) => {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - lift;
  return P(`M${x0} ${y0}Q${mx} ${my - w / 2} ${x1} ${y1}Q${mx} ${my + w / 2} ${x0} ${y0}Z`, { fill });
};

module.exports = {
  id: 'creed-type',
  designs: [
    {
      id: 'ever-forward',
      title: 'Ever Forward',
      w: 1000, h: 1000, paper: sheet,
      draw() {
        const art =
          outlined('ever', { font: 'yellowtail', size: 330, x: 500, y: 380, fill: red, skew: -3 }, { stroke: red, width: 1, shadow: { fill: navy, dx: 8, dy: 9 } }) +
          outlined('FORWARD', { font: 'serif', size: 168, x: 500, y: 590, tracking: 0.06, fill: cream }, { stroke: cream, width: 1, shadow: { fill: red, dx: 7, dy: 8 } }) +
          // an arrow drawn in one go
          P('M190 690Q500 676 790 690', { fill: 'none', stroke: red, strokeWidth: 10, strokeLinecap: 'round' }) +
          P('M760 660L806 690L760 720', { fill: 'none', stroke: red, strokeWidth: 10, strokeLinecap: 'round', strokeLinejoin: 'round' }) +
          text('together, always.', { font: 'serifItalic', size: 70, x: 500, y: 800, fill: cream }) +
          P(sparkle(214, 250, 28), { fill: gold }) + P(sparkle(812, 776, 20), { fill: gold });
        return { art };
      },
    },
    {
      id: 'worn-with-intention',
      title: 'Worn With Intention',
      w: 1000, h: 1200, paper: sheet,
      draw() {
        const art =
          text('worn with', { font: 'serifItalic', size: 96, x: 500, y: 190, fill: cream }) +
          text('INTENTION,', { font: 'serif', size: 150, x: 500, y: 352, tracking: 0.04, fill: red }) +
          outlined('confidence', { font: 'brush', size: 200, x: 500, y: 540, fill: gold, skew: -4 }, { stroke: gold, width: 1, shadow: { fill: navy, dx: 7, dy: 8 } }) +
          swoosh(176, 588, 828, 572, -16, 22, red) +
          text('& BELIEF.', { font: 'serif', size: 150, x: 500, y: 760, tracking: 0.04, fill: red }) +
          text('— BELIEF PROJECT, ALGER —', { font: 'oswald', size: 28, x: 500, y: 850, tracking: 0.42, fill: cream }) +
          P(sparkle(232, 150, 28), { fill: gold }) + P(sparkle(872, 470, 24), { fill: cream }) + P(sparkle(860, 700, 18), { fill: gold });
        return { art };
      },
    },
    {
      id: 'small-steps',
      title: 'Small Steps Still Count',
      w: 1000, h: 1000, paper: sheet,
      draw() {
        // the creed round a ring, repeated so it closes on itself
        const phrase = 'SMALL STEPS STILL COUNT · ', words = phrase.repeat(2);
        const size = 56, r = 360, rb = r - capHeight('serif') * size / 2;
        const L = layout(words, { font: 'serif', size });
        const tracking = (2 * Math.PI * rb - L.width) / (words.length * size);
        const ring =
          K.circle(500, 500, 430, { fill: 'none', stroke: gold, strokeWidth: 6 }) +
          K.circle(500, 500, 292, { fill: 'none', stroke: gold, strokeWidth: 6 }) +
          arcText(words, { font: 'serif', size, cx: 500, cy: 500, r, at: 0, side: 'top', tracking, fill: red });
        // footsteps up the middle, left and right
        const step = (x, y, rot, fill) => g(
          K.ellipse(0, 0, 17, 30, { fill }) + K.ellipse(0, 40, 12, 14, { fill }),
          { transform: `translate(${x} ${y}) rotate(${rot})` });
        const steps = [[452, 690, -12], [530, 640, 10], [462, 580, -14], [538, 528, 8]].map(([x, y, rot], i) => step(x, y, rot, i % 2 ? gold : red)).join('');
        const art =
          ring + steps +
          outlined('keep going.', { font: 'brush', size: 132, x: 500, y: 450, fill: red, skew: -4 }, { stroke: red, width: 1, shadow: { fill: navy, dx: 6, dy: 7 } }) +
          P(star(500, 300, 26, 11), { fill: gold });
        return { art };
      },
    },
  ],
};
