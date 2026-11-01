/* Matisse Cut Out — paper shapes, cut by hand, in flat colour.
   Every edge is drawn a little unsteady, as if cut with scissors, and nothing is outlined: colour against colour. */
'use strict';
const K = require('./kit');
const { C, text, P, g, cutShape, leaf, rng, smooth } = K;

// a sheet of paper cut roughly square: corners not quite true, edges not quite straight
function sheet(cx, cy, w, h, { rot = 0, seed = 1, wob = 6 } = {}) {
  const rand = rng(seed), pts = [];
  const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  corners.forEach((c, i) => {
    const n = corners[(i + 1) % 4];
    for (let k = 0; k < 6; k++) {
      const t = k / 6, j = k === 0 ? 0.4 : 1;
      pts.push([c[0] + (n[0] - c[0]) * t + (rand() - 0.5) * wob * j, c[1] + (n[1] - c[1]) * t + (rand() - 0.5) * wob * j]);
    }
  });
  const a = rot * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  return K.poly(pts.map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]));
}
// a frond of seaweed: a wavy stem with fingers alternating left and right
function frond(cx, y0, len, maxW, { lobes = 5, bend = 40, seed = 1, jitter = 0.05 } = {}) {
  const rand = rng(seed), right = [], left = [], N = 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N, base = maxW * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), 0.7);
    const x = cx + bend * Math.sin(Math.PI * t), y = y0 - len * t;
    const wave = ph => 0.42 + 0.58 * Math.pow(Math.abs(Math.sin(Math.PI * lobes * t + ph)), 1.6);
    right.push([x + base * wave(0) * (1 + (rand() - 0.5) * jitter), y]);
    left.push([x - base * wave(Math.PI / 2) * (1 + (rand() - 0.5) * jitter), y]);
  }
  return smooth(right.concat(left.reverse()).filter((_, i) => i % 2 === 0));
}
// a flower of round petals
const flower = (cx, cy, r, petals, seed, rot = 0) => cutShape(cx, cy, t => r * (0.62 + 0.38 * Math.abs(Math.cos(t * petals / 2))), { n: petals * 10, jitter: 0.03, seed, rot });
// a star cut quickly: points uneven
const cutStar = (cx, cy, r, n, seed, rot = 0) => {
  const rand = rng(seed), pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + i * Math.PI / n, rr = (i % 2 ? r * 0.42 : r) * (0.88 + rand() * 0.24);
    pts.push([cx + rr * Math.sin(a), cy - rr * Math.cos(a)]);
  }
  return K.poly(pts);
};
const blob = (cx, cy, r, seed, jitter = 0.08) => cutShape(cx, cy, () => r, { n: 14, jitter, seed });

module.exports = {
  id: 'matisse-cut-out',
  designs: [
    {
      id: 'la-mer',
      title: 'La Mer',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        const art =
          P(sheet(500, 560, 520, 720, { rot: -3, seed: 3 }), { fill: C.pink }) +
          P(frond(470, 1000, 820, 150, { lobes: 4.5, bend: 60, seed: 5 }), { fill: C.cobalt }) +
          P(frond(700, 860, 420, 70, { lobes: 3, bend: -30, seed: 9 }), { fill: C.tomato }) +
          P(frond(300, 880, 360, 60, { lobes: 2.5, bend: 30, seed: 11 }), { fill: C.pine }) +
          P(cutStar(260, 300, 70, 5, 4, 0.3), { fill: C.sun }) +
          P(cutStar(760, 240, 48, 5, 6, -0.2), { fill: C.sun }) +
          [[690, 470, 26], [250, 600, 20], [770, 640, 16], [330, 470, 14], [620, 330, 12]].map(([x, y, r], i) => P(blob(x, y, r, 20 + i), { fill: C.cream })).join('') +
          text('la mer', { font: 'serifItalic', size: 110, x: 500, y: 1130, fill: C.tomato });
        return { art };
      },
    },
    {
      id: 'soleil',
      title: 'Soleil d’Alger',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        // rays cut one by one, never the same length twice
        const rand = rng(7);
        let rays = '';
        for (let i = 0; i < 14; i++) {
          const a = i * Math.PI * 2 / 14 + (rand() - 0.5) * 0.08, r0 = 150, r1 = 250 + rand() * 70, hw = 0.12 + rand() * 0.05;
          const p = (r, t) => [500 + r * Math.sin(t), 520 - r * Math.cos(t)];
          rays += P(K.poly([p(r0, a - hw), p(r1, a + (rand() - 0.5) * 0.06), p(r0, a + hw)]), { fill: i % 2 ? C.tomato : C.sun });
        }
        const art =
          P(sheet(500, 520, 640, 640, { rot: 4, seed: 12, wob: 10 }), { fill: C.cobalt }) +
          rays +
          P(blob(500, 520, 160, 3, 0.03), { fill: C.sun }) +
          P(blob(500, 520, 92, 8, 0.05), { fill: C.tomato }) +
          P(leaf(200, 880, 120, 700, 110, 0.12), { fill: C.pine }) + P(leaf(800, 880, 890, 690, 110, -0.12), { fill: C.leaf }) +
          P(leaf(230, 230, 130, 130, 70, -0.1), { fill: C.pink }) + P(leaf(770, 230, 880, 140, 70, 0.1), { fill: C.pink }) +
          text('soleil d’Alger', { font: 'serifItalic', size: 104, x: 500, y: 1000, fill: C.tomato });
        return { art };
      },
    },
    {
      id: 'le-jardin',
      title: 'Le Jardin',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        // four tiles, each with one cut shape in a colour of its own
        const tiles = [
          { x: 345, y: 340, fill: C.cobalt, rot: -3, shape: P(frond(345, 470, 260, 70, { lobes: 3, bend: 20, seed: 2 }), { fill: C.cream }) },
          { x: 655, y: 335, fill: C.tomato, rot: 2, shape: P(flower(655, 335, 105, 6, 4, 0.2), { fill: C.sun }) + P(blob(655, 335, 30, 5, 0.1), { fill: C.tomato }) },
          { x: 340, y: 650, fill: C.sun, rot: 2.5, shape: P(cutStar(340, 650, 110, 5, 14, 0.2), { fill: C.tomato }) },
          { x: 660, y: 655, fill: C.pine, rot: -2, shape: P(leaf(600, 760, 720, 545, 150, 0.1), { fill: C.pink }) + P('M604 752Q656 664 714 556', { fill: 'none', stroke: C.pine, strokeWidth: 8, strokeLinecap: 'round' }) },
        ];
        const art =
          tiles.map((t, i) => P(sheet(t.x, t.y, 296, 296, { rot: t.rot, seed: 30 + i, wob: 7 }), { fill: t.fill }) + t.shape).join('') +
          P(blob(184, 860, 18, 41), { fill: C.cobalt }) + P(blob(820, 166, 16, 42), { fill: C.pink }) +
          text('le jardin', { font: 'serifItalic', size: 118, x: 500, y: 935, fill: C.tomato });
        return { art };
      },
    },
  ],
};
