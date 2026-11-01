/* Badge Style — cartoon characters stamped into club badges.
   One badge build for all three: a cream rim, a coloured ring lettered round the top and the bottom, and a scene in
   the middle with its character stepping out over the inner edge. Heavy ink keylines, like an enamel pin. */
'use strict';
const K = require('./kit');
const { C, text, arcText, P, circle, ellipse, rect, g, star, sparkle, face, burst, leaf } = K;

const cx = 500, cy = 500, line = C.ink, LW = 9;

function badge({ ring, ringText, disc, top, bottom, starFill, scene, pop = '' }) {
  const ringType = { font: 'alfa', size: 74, cx, cy, r: 388, tracking: 0.1, fill: ringText };
  return {
    defs: `<clipPath id="disc"><circle cx="${cx}" cy="${cy}" r="318"/></clipPath>`,
    art:
      circle(cx, cy, 478, { fill: line }) +
      circle(cx, cy, 466, { fill: C.cream }) +
      circle(cx, cy, 452, { fill: line }) +
      circle(cx, cy, 446, { fill: ring }) +
      arcText(top, { ...ringType, at: 0, side: 'top' }) +
      arcText(bottom, { ...ringType, size: 58, tracking: 0.16, at: 180, side: 'bottom' }) +
      P(star(cx - 388, cy, 30, 13), { fill: starFill }) + P(star(cx + 388, cy, 30, 13), { fill: starFill }) +
      circle(cx, cy, 334, { fill: line }) +
      circle(cx, cy, 326, { fill: C.cream }) +
      circle(cx, cy, 318, { fill: disc }) +
      g(scene, { clipPath: 'url(#disc)' }) +
      circle(cx, cy, 318, { fill: 'none', stroke: line, strokeWidth: 6 }) +
      pop,
  };
}
// keyline then fill, so every shape carries the badge's heavy outline
const inked = (d, fill, w = LW) => P(d, { fill, stroke: line, strokeWidth: w, strokeLinejoin: 'round' });

module.exports = {
  id: 'retro-mascot-badge',
  designs: [
    {
      id: 'early-riser-club',
      title: 'Early Riser Club',
      w: 1000, h: 1000, paper: C.paper,
      draw() {
        // the sun coming up over the sea, a few gulls
        const waves = (y, fill, amp, n, phase = 0) => {
          let d = `M150 ${y}`;
          for (let i = 0; i < n; i++) { const x0 = 150 + i * 700 / n, w = 700 / n; d += `Q${x0 + w / 4} ${y - amp + (i + phase) % 2 * 0} ${x0 + w / 2} ${y}T${x0 + w} ${y}`; }
          d += `L850 900L150 900Z`;
          return inked(d, fill, 7);
        };
        const sun =
          P(burst(500, 520, 150, 250, 16, 0.5), { fill: C.sun, stroke: line, strokeWidth: 7, strokeLinejoin: 'round' }) +
          circle(500, 520, 138, { fill: C.sun, stroke: line, strokeWidth: LW }) +
          face(500, 520, 190, { ink: line, cheek: C.coral, wink: true });
        const gull = (x, y, s) => P(`M${x - s} ${y}Q${x - s / 2} ${y - s * 0.6} ${x} ${y}Q${x + s / 2} ${y - s * 0.6} ${x + s} ${y}`, { fill: 'none', stroke: line, strokeWidth: 7, strokeLinecap: 'round', strokeLinejoin: 'round' });
        const scene =
          rect(150, 150, 700, 700, { fill: C.sky }) +
          circle(500, 520, 290, { fill: C.ice }) +
          sun +
          waves(626, C.cobalt, 18, 6) + waves(676, C.sky, 16, 7) + waves(728, C.cobalt, 14, 8) +
          P('M300 655q22 -10 44 0M560 640q22 -10 44 0M440 704q22 -10 44 0M650 702q22 -10 44 0', { fill: 'none', stroke: C.cream, strokeWidth: 6, strokeLinecap: 'round' }) +
          gull(300, 330, 26) + gull(352, 296, 18) + gull(690, 360, 22);
        return badge({ ring: C.tomato, ringText: C.cream, disc: C.sky, starFill: C.sun, top: 'EARLY RISER', bottom: 'CLUB · ALGER · 2026', scene });
      },
    },
    {
      id: 'night-owl-society',
      title: 'Night Owl Society',
      w: 1000, h: 1000, paper: C.paper,
      draw() {
        const sky =
          rect(150, 150, 700, 700, { fill: C.cobalt }) +
          P('M640 250a74 74 0 1 0 60 118a60 60 0 1 1 -60 -118Z', { fill: C.sun, stroke: line, strokeWidth: 7 }) +
          [[300, 280, 16], [380, 230, 10], [250, 400, 9], [720, 470, 12], [430, 330, 7], [770, 600, 8]]
            .map(([x, y, r]) => P(K.sparkle(x, y, r * 1.6), { fill: C.cream })).join('');
        // the owl on its branch
        const owl =
          inked('M412 700Q404 520 500 470Q596 520 588 700Q560 772 500 772Q440 772 412 700Z', C.coral) +
          inked('M420 470L436 420L470 474Z', C.coral, 7) + inked('M580 470L564 420L530 474Z', C.coral, 7) +
          inked('M450 640Q450 584 500 576Q550 584 550 640Q550 726 500 742Q450 726 450 640Z', C.cream, 7) +
          P('M474 626q13 12 26 0q13 12 26 0M474 660q13 12 26 0q13 12 26 0M480 694q10 10 20 0q10 10 20 0', { fill: 'none', stroke: C.tomato, strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' }) +
          inked(leaf(424, 560, 410, 720, 52, 0.08), C.tomato, 7) + inked(leaf(576, 560, 590, 720, 52, -0.08), C.tomato, 7) +
          // the eyes, wide awake
          [-1, 1].map(s => circle(500 + s * 46, 528, 46, { fill: C.sun, stroke: line, strokeWidth: 7 }) + circle(500 + s * 46, 528, 30, { fill: C.cream }) +
            circle(500 + s * 42, 532, 17, { fill: line }) + circle(500 + s * 37, 525, 6, { fill: C.white })).join('') +
          inked('M488 560L512 560L500 584Z', C.sun, 6);
        const branch =
          P('M190 780Q420 752 820 790', { fill: 'none', stroke: line, strokeWidth: 30, strokeLinecap: 'round' }) +
          P('M190 780Q420 752 820 790', { fill: 'none', stroke: C.cocoa, strokeWidth: 16, strokeLinecap: 'round' }) +
          inked(leaf(250, 776, 214, 712, 34, 0.1), C.leaf, 6) + inked(leaf(720, 784, 780, 724, 34, -0.1), C.leaf, 6) + inked(leaf(690, 786, 690, 852, 30), C.leaf, 6) +
          [460, 540].map(x => P(`M${x - 18} 766l10 18M${x} 762l0 22M${x + 18} 766l-10 18`, { stroke: C.sun, strokeWidth: 7, strokeLinecap: 'round' })).join('');
        return badge({ ring: C.ink, ringText: C.cream, disc: C.cobalt, starFill: C.sun, top: 'NIGHT OWL', bottom: 'SOCIETY · AFTER HOURS', scene: sky + branch + owl });
      },
    },
    {
      id: 'ever-forward-trail-club',
      title: 'Ever Forward Trail Club',
      w: 1000, h: 1000, paper: C.paper,
      draw() {
        const hills =
          rect(150, 150, 700, 700, { fill: C.ice }) +
          circle(640, 420, 70, { fill: C.sun, stroke: line, strokeWidth: 7 }) +
          inked('M150 640L320 400L420 520L520 360L700 600L850 470L850 900L150 900Z', C.sky, 8) +
          inked('M320 400L362 460L338 452L300 470Z', C.cream, 6) + inked('M520 360L572 432L540 424L500 446L476 424Z', C.cream, 6) +
          inked('M150 720Q330 640 520 700Q690 752 850 680L850 900L150 900Z', C.leaf, 8) +
          // the trail, winding away
          P('M560 900Q520 820 600 780Q660 750 620 712', { fill: 'none', stroke: C.cream, strokeWidth: 16, strokeLinecap: 'round', strokeDasharray: '1 30' }) +
          [[250, 690], [790, 660]].map(([x, y]) => inked(`M${x} ${y - 90}L${x + 40} ${y}L${x - 40} ${y}Z`, C.pine, 7) + rect(x - 7, y, 14, 20, { fill: line })).join('');
        // the bear, in a beanie, looking out over the rim
        const bear =
          inked('M340 640a50 50 0 1 1 72 -66Z', C.cocoa) + inked('M660 640a50 50 0 1 0 -72 -66Z', C.cocoa) +
          inked('M330 720Q330 560 500 556Q670 560 670 720Q670 840 500 846Q330 840 330 720Z', C.cocoa) +
          inked('M430 776Q430 728 500 726Q570 728 570 776Q570 822 500 826Q430 822 430 776Z', C.cream, 7) +
          ellipse(500, 752, 26, 18, { fill: line }) +
          P('M500 772L500 790M478 798Q500 812 522 798', { fill: 'none', stroke: line, strokeWidth: 7, strokeLinecap: 'round' }) +
          [-1, 1].map(s => ellipse(500 + s * 72, 690, 14, 21, { fill: line }) + ellipse(500 + s * 72 + 5, 682, 5, 6, { fill: C.white })).join('') +
          [-1, 1].map(s => ellipse(500 + s * 112, 744, 22, 13, { fill: C.coral })).join('') +
          // the beanie: crown, ribbed cuff, pompom
          inked('M352 640Q352 470 500 466Q648 470 648 640Z', C.tomato) +
          inked('M338 616L662 616Q670 616 670 626L670 652Q670 662 660 662L340 662Q330 662 330 652L330 626Q330 616 338 616Z', C.tomato) +
          P([...Array(13)].map((_, i) => `M${364 + i * 23} 626L${364 + i * 23} 652`).join(''), { stroke: line, strokeWidth: 5, strokeLinecap: 'round' }) +
          inked(K.cutShape(500, 452, t => 40 + 6 * Math.sin(t * 9), { n: 36, jitter: 0, seed: 2 }), C.cream, 8);
        return badge({ ring: C.pine, ringText: C.cream, disc: C.ice, starFill: C.sun, top: 'EVER FORWARD', bottom: 'TRAIL CLUB · EST. 2026', scene: hills, pop: bear });
      },
    },
  ],
};
