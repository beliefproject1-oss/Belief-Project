/* Riso Print — old shop signs and the characters behind the counter.
   Printed like a risograph: a few flat inks, the blue plate a hair out of register, halftone shading. */
'use strict';
const K = require('./kit');
const { C, text, arch, P, circle, ellipse, rect, g, star, sparkle, face, halftone } = K;

// the riso inks
const pink = C.pink, blue = C.cobalt, sun = C.sun, cream = C.cream, ink = C.ink;
const OFF = 'translate(5 4)'; // the blue plate, slightly out of register

// a striped shop awning with a scalloped edge
function awning(x, y, w, n, h, colors) {
  const sw = w / n;
  let fills = '', lines = '';
  for (let i = 0; i < n; i++) {
    const x0 = x + i * sw, d = `M${x0} ${y}L${x0 + sw} ${y}L${x0 + sw} ${y + h}A${sw / 2} ${sw / 2} 0 0 1 ${x0} ${y + h}Z`;
    fills += P(d, { fill: colors[i % colors.length] });
    lines += P(d, { fill: 'none', stroke: blue, strokeWidth: 6, strokeLinejoin: 'round' });
  }
  return { fills, lines: lines + rect(x - 14, y - 22, w + 28, 26, { rx: 13, fill: blue }) };
}
// steam: soft S-curves rising
const steam = (x, y, hgt, a = {}) => P(`M${x} ${y}c-26 -${hgt * 0.22} 26 -${hgt * 0.4} 0 -${hgt * 0.62}s26 -${hgt * 0.28} 0 -${hgt * 0.38}`,
  { fill: 'none', strokeLinecap: 'round', strokeWidth: 13, ...a });

module.exports = {
  id: 'retro-mascot',
  designs: [
    {
      id: 'cafe-belief',
      title: 'Café Belief',
      w: 1000, h: 1180, paper: C.paper,
      draw() {
        const aw = awning(130, 318, 740, 8, 52, [pink, cream]);
        // the cup, standing behind the counter
        const body = 'M352 540Q356 760 392 930L608 930Q644 760 648 540Z';
        const defs = halftone('dotsPink', pink, 11, 3.4) + `<clipPath id="cup"><path d="${body}"/></clipPath>`;
        const fills =
          aw.fills +
          [432, 500, 568].map((x, i) => steam(x, 496 - (i % 2) * 8, 60 + (i % 2) * 8, { stroke: pink })).join('') +
          P(body, { fill: cream }) +
          g(ellipse(660, 760, 120, 240, { fill: 'url(#dotsPink)' }), { clipPath: 'url(#cup)' }) +
          ellipse(500, 540, 150, 34, { fill: cream }) +
          face(500, 700, 250, { ink, cheek: pink }) +
          P('M650 610C752 600 756 770 636 780', { fill: 'none', stroke: blue, strokeWidth: 34, strokeLinecap: 'round' }) +
          P('M650 610C752 600 756 770 636 780', { fill: 'none', stroke: cream, strokeWidth: 16, strokeLinecap: 'round' }) +
          P(sparkle(232, 610, 40), { fill: sun }) + P(sparkle(778, 470, 30), { fill: sun }) + P(sparkle(262, 500, 20), { fill: pink });
        const plate =
          aw.lines +
          P(body, { fill: 'none', stroke: blue, strokeWidth: 9 }) +
          ellipse(500, 540, 150, 34, { fill: 'none', stroke: blue, strokeWidth: 9 }) +
          ellipse(500, 546, 124, 22, { fill: blue }) +
          // the counter, with the hours knocked out
          rect(96, 900, 808, 96, { rx: 10, fill: blue }) +
          text('OPEN EARLY · CLOSE LATE', { font: 'oswald', size: 36, x: 500, y: 962, tracking: 0.22, fill: cream });
        const title =
          text('CAFÉ BELIEF', { font: 'bagel', size: 132, x: 500, y: 212, tracking: 0.01, warp: arch(500, 420, 46), fill: blue, transform: OFF }) +
          text('CAFÉ BELIEF', { font: 'bagel', size: 132, x: 500, y: 212, tracking: 0.01, warp: arch(500, 420, 46), fill: pink }) +
          text('ALGER — EST. 2026', { font: 'oswald', size: 30, x: 500, y: 266, tracking: 0.32, fill: blue });
        const foot =
          text('Coffee & Conviction', { font: 'shrikhand', size: 74, x: 500, y: 1106, fill: blue, transform: OFF }) +
          text('Coffee & Conviction', { font: 'shrikhand', size: 74, x: 500, y: 1106, fill: pink });
        return { defs, art: title + fills + g(plate, { transform: OFF }) + foot };
      },
    },
    {
      id: 'bread-and-belief',
      title: 'Bread & Belief',
      w: 1000, h: 1180, paper: C.paper,
      draw() {
        // the croissant: five rounded segments along a crescent, tips first so the middle sits on top
        const segs = [
          [296, 716, 56, 47, -42], [704, 716, 56, 47, 42],
          [390, 680, 80, 69, -20], [610, 680, 80, 69, 20],
          [500, 664, 108, 90, 0],
        ];
        const segD = ([x, y, rx, ry, rot]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"`;
        const defs = halftone('dotsPink', pink, 10, 3.2) +
          `<clipPath id="lower"><rect x="0" y="690" width="1000" height="200"/></clipPath>`;
        let pastry = '';
        segs.forEach(s => {
          const [x, y, rx, ry, rot] = s;
          pastry += segD(s) + ` fill="${sun}"/>`;
          pastry += g(segD(s) + ' fill="url(#dotsPink)"/>', { clipPath: 'url(#lower)' });
          // the fold of the pastry
          pastry += P(`M${x - rx * 0.55} ${y - ry * 0.35}Q${x} ${y + ry * 0.1} ${x + rx * 0.55} ${y - ry * 0.35}`, { fill: 'none', stroke: blue, strokeWidth: 7, strokeLinecap: 'round', transform: `rotate(${rot} ${x} ${y})${rot ? '' : ' translate(0 34)'}` });
          pastry += segD(s) + ` fill="none" stroke="${blue}" stroke-width="9"/>`;
        });
        // wheat on either side
        const wheat = (x, y, flip) => {
          let w = P(`M${x} ${y}Q${x + flip * 30} ${y - 140} ${x + flip * 8} ${y - 280}`, { fill: 'none', stroke: blue, strokeWidth: 8, strokeLinecap: 'round' });
          for (let i = 0; i < 5; i++) {
            const t = 0.3 + i * 0.15, cy = y - 280 * t, cx = x + flip * (30 * Math.sin(Math.PI * t * 0.8));
            w += P(K.leaf(cx, cy, cx - 46, cy - 40, 24, 0.05), { fill: sun, stroke: blue, strokeWidth: 5 });
            w += P(K.leaf(cx, cy, cx + 46, cy - 40, 24, -0.05), { fill: sun, stroke: blue, strokeWidth: 5 });
          }
          return w + P(K.leaf(x + flip * 8, y - 276, x + flip * 8, y - 340, 26), { fill: sun, stroke: blue, strokeWidth: 5 });
        };
        // a ribbon banner with folded ends
        const ribbon =
          P('M150 900L230 900L230 980L150 980L182 940Z', { fill: pink }) + P('M850 900L770 900L770 980L850 980L818 940Z', { fill: pink }) +
          P('M210 884L790 884L790 964L210 964Z', { fill: blue }) +
          P('M210 964L230 980L230 964Z', { fill: ink }) + P('M790 964L770 980L770 964Z', { fill: ink }) +
          text('PAIN CHAUD · 6H — 20H', { font: 'oswald', size: 38, x: 500, y: 938, tracking: 0.2, fill: cream });
        const art =
          text('BOULANGERIE', { font: 'oswald', size: 34, x: 500, y: 128, tracking: 0.5, fill: blue }) +
          P(K.burst(500, 676, 178, 238, 20, 0.42), { fill: C.tomato }) +
          text('Bread', { font: 'shrikhand', size: 228, x: 500, y: 330, fill: blue, transform: OFF }) +
          text('Bread', { font: 'shrikhand', size: 228, x: 500, y: 330, fill: pink }) +
          text('& BELIEF', { font: 'bagel', size: 92, x: 500, y: 424, tracking: 0.04, fill: blue }) +
          wheat(150, 820, 1) + wheat(850, 820, -1) +
          pastry + face(500, 654, 160, { ink, cheek: pink }) +
          ribbon +
          text('FRESH FROM THE OVEN, EVERY MORNING', { font: 'oswald', size: 25, x: 500, y: 1052, tracking: 0.28, fill: blue });
        return { defs, art };
      },
    },
    {
      id: 'fresh-squeezed',
      title: 'Fresh Squeezed',
      w: 1000, h: 1180, paper: C.paper,
      draw() {
        // riso orange: the yellow plate with pink overprinted in dots
        const defs = halftone('dotsPink', pink, 9, 3.3) + halftone('dotsPinkFine', pink, 8, 2.2) + halftone('dotsShade', pink, 9, 3.9) +
          `<clipPath id="fruit"><circle cx="500" cy="610" r="196"/></clipPath>`;
        // half an orange, cut: rind, pith, segments
        const slice = (cx, cy, r, rot) => {
          let s = circle(cx, cy, r, { fill: sun, stroke: blue, strokeWidth: 8 }) + circle(cx, cy, r * 0.84, { fill: cream });
          for (let i = 0; i < 8; i++) {
            const a0 = (rot + i * 45 + 5) * Math.PI / 180, a1 = (rot + (i + 1) * 45 - 5) * Math.PI / 180, ri = r * 0.76, rc = r * 0.12;
            const d = `M${cx + rc * Math.sin((a0 + a1) / 2)} ${cy - rc * Math.cos((a0 + a1) / 2)}L${cx + ri * Math.sin(a0)} ${cy - ri * Math.cos(a0)}A${ri} ${ri} 0 0 1 ${cx + ri * Math.sin(a1)} ${cy - ri * Math.cos(a1)}Z`;
            s += P(d, { fill: sun }) + P(d, { fill: 'url(#dotsPinkFine)' });
          }
          return s;
        };
        const fruit =
          circle(500, 610, 196, { fill: sun }) +
          circle(500, 610, 196, { fill: 'url(#dotsPink)' }) +
          g(circle(640, 740, 170, { fill: 'url(#dotsShade)' }), { clipPath: 'url(#fruit)' }) +
          circle(430, 520, 26, { fill: cream, opacity: 0.85 }) + circle(470, 500, 12, { fill: cream, opacity: 0.85 }) +
          face(500, 640, 230, { ink, cheek: C.tomato, mouth: 'open' });
        const plate =
          circle(500, 610, 196, { fill: 'none', stroke: blue, strokeWidth: 10 }) +
          P('M500 420Q492 380 470 356', { fill: 'none', stroke: blue, strokeWidth: 12, strokeLinecap: 'round' }) +
          P(K.leaf(492, 404, 640, 330, 74, -0.08), { fill: blue }) +
          P('M520 398Q580 368 626 336', { fill: 'none', stroke: cream, strokeWidth: 5, strokeLinecap: 'round' });
        const drops = [[262, 470, 18], [292, 410, 11], [740, 520, 16], [770, 470, 10]]
          .map(([x, y, r]) => P(`M${x} ${y - r * 1.9}Q${x + r} ${y - r * 0.4} ${x + r} ${y + r * 0.2}A${r} ${r} 0 0 1 ${x - r} ${y + r * 0.2}Q${x - r} ${y - r * 0.4} ${x} ${y - r * 1.9}Z`, { fill: blue })).join('');
        const art =
          text('FRESH SQUEEZED', { font: 'bagel', size: 104, x: 500, y: 236, tracking: 0.02, warp: arch(500, 430, 52), fill: blue, transform: OFF }) +
          text('FRESH SQUEEZED', { font: 'bagel', size: 104, x: 500, y: 236, tracking: 0.02, warp: arch(500, 430, 52), fill: pink }) +
          slice(196, 760, 92, 10) + slice(804, 760, 92, 32) +
          fruit + g(plate, { transform: OFF }) + drops +
          text('BELIEF', { font: 'bagel', size: 232, x: 500, y: 1034, tracking: 0.02, fill: blue, transform: OFF }) +
          text('BELIEF', { font: 'bagel', size: 232, x: 500, y: 1034, tracking: 0.02, fill: C.tomato }) +
          text('JUICE BAR · ALGER · SQUEEZED TO ORDER', { font: 'oswald', size: 26, x: 500, y: 1106, tracking: 0.26, fill: blue });
        return { defs, art };
      },
    },
  ],
};
