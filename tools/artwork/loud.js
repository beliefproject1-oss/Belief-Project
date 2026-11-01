/* Loud Belief — big type, bold colour, nothing quiet.
   Condensed capitals set edge to edge, every line justified to one width; echoes, overlaps and a few hand-made marks. */
'use strict';
const K = require('./kit');
const { C, text, outlined, fit, capHeight, P, g, star, burst } = K;

const W = 880; // the width every justified line is set to

// lines of capitals stacked edge to edge, each fitted to the same width. Returns the paths and where it ended.
function stack(lines, { x = 500, top, gap = 18, font = 'anton', tracking = 0.01, width = W }) {
  let y = top, out = '';
  const placed = lines.map(l => {
    const o = { font, tracking, ...l, size: fit(l.text, { font, tracking }, l.width || width) };
    const cap = capHeight(font) * o.size;
    y += cap;
    const at = { ...o, x, y };
    y += gap;
    return { at, cap };
  });
  placed.forEach(({ at }) => { out += at.draw ? at.draw(at) : text(at.text, { font: at.font, size: at.size, x: at.x, y: at.y, tracking: at.tracking, skew: at.skew, fill: at.fill, stroke: at.stroke, strokeWidth: at.strokeWidth, strokeLinejoin: at.stroke ? 'round' : undefined }); });
  return { art: out, bottom: y - gap, placed };
}

module.exports = {
  id: 'loud',
  designs: [
    {
      id: 'believe-before-you-see-it',
      title: 'Believe It Before You See It',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        const s = stack([
          { text: 'BELIEVE IT', fill: C.tomato },
          { text: 'BEFORE', fill: C.sun },
          { text: 'YOU SEE IT.', fill: C.cobalt },
        ], { top: 230, gap: 22 });
        // a starburst sticker slapped on the corner, just clear of the words
        const sticker =
          P(burst(858, 130, 0, 88, 14, 1.0), { fill: C.pink }) + K.circle(858, 130, 68, { fill: C.pink }) +
          text('NO', { font: 'anton', size: 44, x: 858, y: 124, tracking: 0.04, fill: C.cream, transform: 'rotate(14 858 130)' }) +
          text('PROOF', { font: 'anton', size: 32, x: 858, y: 162, tracking: 0.06, fill: C.cream, transform: 'rotate(14 858 130)' });
        const foot = text('BELIEF PROJECT — ALGER — 2026', { font: 'oswaldBold', size: 30, x: 500, y: s.bottom + 70, tracking: 0.42, fill: C.tomato });
        return { art: s.art + sticker + foot };
      },
    },
    {
      id: 'louder-than-doubt',
      title: 'Louder Than Doubt',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        const size = fit('LOUDER', { font: 'anton' }, W), cap = capHeight('anton') * size;
        const y1 = 110 + cap;
        // the shout, and its echoes ringing out behind it
        const echoes = [[42, C.pink], [28, C.sun], [14, C.cobalt]].map(([d, c]) =>
          text('LOUDER', { font: 'anton', size, x: 500 + d, y: y1 + d, fill: 'none', stroke: c, strokeWidth: 6, strokeLinejoin: 'round' })).join('');
        const loud = echoes + text('LOUDER', { font: 'anton', size, x: 500, y: y1, fill: C.tomato });
        const than = outlined('than', { font: 'shrikhand', size: 190, x: 500, y: y1 + 190, fill: C.cream, transform: `rotate(-7 500 ${y1 + 130})` },
          { stroke: C.tomato, width: 9, shadow: { fill: C.ink, dx: 8, dy: 9 } });
        const dSize = fit('DOUBT', { font: 'anton' }, W), dCap = capHeight('anton') * dSize, y3 = y1 + 250 + dCap;
        const doubt = text('DOUBT', { font: 'anton', size: dSize, x: 500, y: y3, fill: C.cobalt });
        // crossed out by hand: a fat marker stroke, ragged at its ends
        const strike = P(`M70 ${y3 - dCap * 0.52}Q300 ${y3 - dCap * 0.62} 520 ${y3 - dCap * 0.5}T934 ${y3 - dCap * 0.56}L938 ${y3 - dCap * 0.4}Q700 ${y3 - dCap * 0.34} 500 ${y3 - dCap * 0.38}T66 ${y3 - dCap * 0.36}L78 ${y3 - dCap * 0.44}Z`, { fill: C.sun });
        const foot = text('SAY IT LIKE YOU MEAN IT', { font: 'oswaldBold', size: 32, x: 500, y: y3 + 74, tracking: 0.5, fill: C.tomato });
        return { art: loud + doubt + strike + than + foot };
      },
    },
    {
      id: 'move-differently',
      title: 'Move Differently',
      w: 1000, h: 1200, paper: C.paper,
      draw() {
        // MOVE, four times, leaning further forward each time
        const s = stack([
          { text: 'MOVE', fill: C.tomato },
          { text: 'MOVE', fill: 'none', stroke: C.tomato, strokeWidth: 7, skew: 6 },
          { text: 'MOVE', fill: 'none', stroke: C.sun, strokeWidth: 7, skew: 12 },
          { text: 'MOVE', fill: C.sun, skew: 18 },
        ], { top: 80, gap: 12, width: 560 });
        const mid = s.placed[2].at.y - s.placed[2].cap * 0.2;
        const diff = outlined('differently.', { font: 'shrikhand', size: 150, x: 500, y: mid + 40, fill: C.cream, transform: `rotate(-9 500 ${mid})` },
          { stroke: C.pink, width: 7, shadow: { fill: C.ink, dx: 7, dy: 8 } });
        const arrows = [0, 1, 2].map(i => P(`M${140 + i * 40} ${s.bottom + 78}l24 -22l-24 -22`, { fill: 'none', stroke: C.pink, strokeWidth: 10, strokeLinecap: 'round', strokeLinejoin: 'round' })).join('');
        const foot = text('BUILT FOR THOSE WHO MOVE DIFFERENTLY', { font: 'oswaldBold', size: 24, x: 588, y: s.bottom + 66, tracking: 0.24, fill: C.tomato });
        return { art: s.art + diff + arrows + foot };
      },
    },
  ],
};
