/* Vintage Athletic Club — clubhouse graphics from the track and the court.
   Varsity lettering with a cream inline and a navy drop, sign-painter script, laurels; the whole print worn a
   little, like a team shirt that has been through a few seasons. */
'use strict';
const K = require('./kit');
const { C, text, outlined, arch, P, circle, ellipse, rect, g, star, leaf, wornMask } = K;

const red = C.tomato, cream = C.cream, navy = C.ink, gold = C.sun, green = C.pine;
// varsity: red letters, a cream outline, and a navy drop below-right
const varsity = (str, o) => outlined(str, { fill: red, ...o }, { stroke: cream, width: o.line || 9, shadow: { fill: navy, dx: 9, dy: 10 } });
const script = (str, o) => outlined(str, { fill: cream, ...o }, { stroke: red, width: o.line || 6, shadow: { fill: navy, dx: 7, dy: 8 } });
const worn = (id, art, w, h) => ({ defs: wornMask(id, { amount: 0.24, scale: 0.5, w, h }), art: g(art, { mask: `url(#${id})` }) });

// a laurel branch round one side of (cx, cy): leaves in pairs along an arc
function laurel(cx, cy, r, side, { from = 196, to = 338, n = 9, len = 84, wid = 36, fill = gold } = {}) {
  let out = '', pts = [];
  for (let i = 0; i <= n; i++) {
    const deg = from + (to - from) * i / n, a = deg * Math.PI / 180;
    const p = [cx + side * r * Math.sin(a) * -1, cy - r * Math.cos(a)];
    // along the arc, from the bottom upwards, and away from the centre
    const T = [-side * Math.cos(a), Math.sin(a)], N = [p[0] - cx, p[1] - cy].map(v => v / r);
    pts.push(p);
    const tip = k => [p[0] + len * (T[0] * Math.cos(0.6) + k * N[0] * Math.sin(0.6)), p[1] + len * (T[1] * Math.cos(0.6) + k * N[1] * Math.sin(0.6))];
    const sz = 1 - i / (n + 4);
    [1, -1].forEach(k => { const t = tip(k); out += P(leaf(p[0], p[1], p[0] + (t[0] - p[0]) * sz, p[1] + (t[1] - p[1]) * sz, wid * sz, 0.08 * k * side), { fill, stroke: navy, strokeWidth: 5 }); });
  }
  const stem = P(K.smooth(pts, false), { fill: 'none', stroke: navy, strokeWidth: 9, strokeLinecap: 'round' }) +
    P(K.smooth(pts, false), { fill: 'none', stroke: fill, strokeWidth: 4, strokeLinecap: 'round' });
  return stem + out;
}

module.exports = {
  id: 'vintage-athletic',
  designs: [
    {
      id: 'belief-athletic-club',
      title: 'Belief Athletic Club',
      w: 1000, h: 1160, paper: C.paper,
      draw() {
        const art =
          varsity('BELIEF', { font: 'graduate', size: 206, x: 500, y: 300, tracking: 0.02, warp: arch(500, 440, 62) }) +
          text('ATHLETIC CLUB', { font: 'oswaldBold', size: 54, x: 500, y: 388, tracking: 0.42, fill: red }) +
          // the crest: laurels round the year
          laurel(500, 668, 196, -1) + laurel(500, 668, 196, 1) +
          circle(500, 660, 132, { fill: navy }) + circle(500, 660, 122, { fill: cream }) + circle(500, 660, 110, { fill: red }) +
          outlined('26', { font: 'graduate', size: 150, x: 500, y: 712, fill: cream }, { stroke: navy, width: 6 }) +
          P(star(500, 580, 18, 8), { fill: gold }) +
          P(star(436, 594, 10, 4.5), { fill: gold }) + P(star(564, 594, 10, 4.5), { fill: gold }) +
          // a pennant ribbon across the bottom of the wreath
          P('M250 860L330 840L330 920L250 900L280 880Z', { fill: navy }) + P('M750 860L670 840L670 920L750 900L720 880Z', { fill: navy }) +
          P('M300 830Q500 870 700 830L700 912Q500 952 300 912Z', { fill: red, stroke: navy, strokeWidth: 7, strokeLinejoin: 'round' }) +
          text('TRACK · FIELD · COURT', { font: 'oswaldBold', size: 30, x: 500, y: 898, tracking: 0.14, fill: cream, warp: arch(500, 200, -20) }) +
          script('Est. 2026', { font: 'yellowtail', size: 120, x: 500, y: 1052 }) +
          text('ALGIERS', { font: 'oswaldBold', size: 30, x: 500, y: 1110, tracking: 0.6, fill: red });
        return worn('wear', art, 1000, 1160);
      },
    },
    {
      id: 'sunday-tennis-society',
      title: 'Sunday Tennis Society',
      w: 1000, h: 1160, paper: C.paper,
      draw() {
        // a racket, head up, turned by rot about its throat
        const racket = (x, y, rot) => {
          const head = 'M0 -360a96 126 0 1 0 0.1 0Z';
          let strings = '';
          for (let i = -4; i <= 4; i++) strings += `M${i * 21} -500L${i * 21} -200M-110 ${-360 + i * 26}L110 ${-360 + i * 26}`;
          const id = 'head' + (rot < 0 ? 'L' : 'R');
          return g(
            `<clipPath id="${id}"><path d="${head}"/></clipPath>` +
            P('M-16 -236L-46 -120L-14 -40L14 -40L46 -120L16 -236', { fill: 'none', stroke: navy, strokeWidth: 30, strokeLinejoin: 'round' }) +
            P('M-16 -236L-46 -120L-14 -40L14 -40L46 -120L16 -236', { fill: 'none', stroke: red, strokeWidth: 14, strokeLinejoin: 'round' }) +
            g(P(strings, { stroke: cream, strokeWidth: 5 }), { clipPath: `url(#${id})` }) +
            P(head, { fill: 'none', stroke: navy, strokeWidth: 36 }) + P(head, { fill: 'none', stroke: red, strokeWidth: 20 }) +
            rect(-22, -50, 44, 170, { rx: 10, fill: navy }) + rect(-15, -44, 30, 158, { rx: 7, fill: cream }) +
            P('M-15 -20L15 -4M-15 14L15 30M-15 48L15 64M-15 82L15 98', { stroke: red, strokeWidth: 7 }),
            { transform: `translate(${x} ${y}) rotate(${rot}) scale(0.78)` });
        };
        const ball =
          circle(500, 632, 54, { fill: gold, stroke: navy, strokeWidth: 8 }) +
          P('M458 598Q500 632 458 666M542 598Q500 632 542 666', { fill: 'none', stroke: cream, strokeWidth: 7, strokeLinecap: 'round' });
        const swash = 'M214 486Q500 446 820 470Q610 488 316 520Q256 528 214 486Z';
        const art =
          text('THE SUNDAY', { font: 'graduate', size: 64, x: 500, y: 140, tracking: 0.24, fill: red }) +
          racket(500, 904, -28) + racket(500, 904, 28) + ball +
          script('Tennis', { font: 'yellowtail', size: 270, x: 500, y: 410, line: 8, skew: -2 }) +
          // the swash under the script
          P(swash, { fill: navy, transform: 'translate(7 8)' }) + P(swash, { fill: red }) +
          text('SOCIETY', { font: 'graduate', size: 84, x: 500, y: 1062, tracking: 0.3, fill: red }) +
          text('MEMBERS SINCE 2026 · ALGIERS', { font: 'oswaldBold', size: 30, x: 500, y: 1118, tracking: 0.3, fill: red });
        return worn('wear', art, 1000, 1160);
      },
    },
    {
      id: 'ever-forward-running-club',
      title: 'Ever Forward Running Club',
      w: 1000, h: 1160, paper: C.paper,
      draw() {
        // a running track seen from above: red lanes round a green infield
        const lane = (inset, a) => rect(130 + inset, 430 + inset, 740 - inset * 2, 420 - inset * 2, { rx: 210 - inset, ...a });
        const track =
          lane(-10, { fill: navy }) + lane(0, { fill: red }) +
          [24, 48, 72].map(i => lane(i, { fill: 'none', stroke: cream, strokeWidth: 4 })).join('') +
          lane(96, { fill: cream }) + lane(104, { fill: green }) +
          // the start line and lane numbers
          rect(586, 430, 8, 104, { fill: cream }) +
          ['1', '2', '3', '4'].map((n, i) => text(n, { font: 'oswaldBold', size: 20, x: 620, y: 520 - i * 24 + 7, fill: cream })).join('') +
          text('RUN CLUB', { font: 'graduate', size: 84, x: 500, y: 668, tracking: 0.06, fill: cream }) +
          text('MILE AFTER MILE', { font: 'oswaldBold', size: 26, x: 500, y: 718, tracking: 0.5, fill: gold });
        const art =
          varsity('EVER FORWARD', { font: 'graduate', size: 116, x: 500, y: 330, tracking: 0.02, warp: arch(500, 440, 70), line: 7 }) +
          track +
          script('Sundays, 7am', { font: 'yellowtail', size: 126, x: 500, y: 990 }) +
          text('EST. 2026 · ALGIERS', { font: 'oswaldBold', size: 30, x: 500, y: 1072, tracking: 0.5, fill: red });
        return worn('wear', art, 1000, 1160);
      },
    },
  ],
};
