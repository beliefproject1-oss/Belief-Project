/* Belief Project — the drawing kit the studio artwork is made with (see draw-designs.js).
   Everything is vector: lettering is set in open-licence fonts (SIL OFL, free to print on garments) and turned into
   outlines, so each design is a self-contained SVG that prints at any size and needs no font installed.
   Coordinates are SVG user units, y down. */
'use strict';
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

/* ---------- colour: one palette for the whole studio, each direction uses its own part of it ---------- */
// Mid-tone inks carry on both shirts (Midnight and Ice Blue); cream is the light ink, ink the dark one.
const C = {
  paper: '#F4EADB',   // the "with background" sheet
  cream: '#FBF1E1',
  tomato: '#E4472C',
  sun: '#F4B63D',
  pink: '#F2789F',
  cobalt: '#3A5FD9',
  ice: '#C2E2FE',     // the brand's Ice Blue
  sky: '#86BDEB',
  pine: '#1F6A4E',
  leaf: '#4E9A5B',
  plum: '#7A3E8E',
  coral: '#F2805C',
  cocoa: '#9C5D3B',
  ink: '#13193A',     // close to the brand's Midnight
  white: '#FFFFFF',
};

/* ---------- fonts ---------- */
const fontsource = (pkg, file) => path.join(__dirname, '..', 'node_modules', '@fontsource', pkg, 'files', file);
const FONT_FILES = {
  anton: fontsource('anton', 'anton-latin-400-normal.woff'),                     // condensed grotesk, loud
  oswald: fontsource('oswald', 'oswald-latin-500-normal.woff'),                  // condensed, small labels
  oswaldBold: fontsource('oswald', 'oswald-latin-700-normal.woff'),
  graduate: fontsource('graduate', 'graduate-latin-400-normal.woff'),            // collegiate slab
  yellowtail: fontsource('yellowtail', 'yellowtail-latin-400-normal.woff'),      // sign-painter script
  shrikhand: fontsource('shrikhand', 'shrikhand-latin-400-normal.woff'),         // fat italic display
  alfa: fontsource('alfa-slab-one', 'alfa-slab-one-latin-400-normal.woff'),      // heavy slab
  serif: fontsource('dm-serif-display', 'dm-serif-display-latin-400-normal.woff'),
  serifItalic: fontsource('dm-serif-display', 'dm-serif-display-latin-400-italic.woff'),
  brush: fontsource('caveat-brush', 'caveat-brush-latin-400-normal.woff'),       // hand lettering
  bagel: fontsource('bagel-fat-one', 'bagel-fat-one-latin-400-normal.woff'),     // round, chunky
};
const fonts = {};
function font(name) {
  if (!fonts[name]) {
    const file = FONT_FILES[name];
    if (!file) throw new Error('unknown font ' + name);
    const buf = fs.readFileSync(file);
    fonts[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return fonts[name];
}
// height of the capitals, in units of the font size
function capHeight(name) {
  const f = font(name);
  const ch = f.tables.os2 && f.tables.os2.sCapHeight;
  return (ch || f.charToGlyph('H').getBoundingBox().y2) / f.unitsPerEm;
}

/* ---------- numbers and path data ---------- */
const r2 = v => Math.round(v * 100) / 100;
function cmdsToD(cmds) {
  return cmds.map(c => {
    switch (c.type) {
      case 'M': case 'L': return c.type + r2(c.x) + ' ' + r2(c.y);
      case 'C': return 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(r2).join(' ');
      case 'Q': return 'Q' + [c.x1, c.y1, c.x, c.y].map(r2).join(' ');
      default: return 'Z';
    }
  }).join('');
}
function mapCmds(cmds, fn) {
  return cmds.map(c => {
    const o = { type: c.type };
    if ('x' in c) [o.x, o.y] = fn(c.x, c.y);
    if ('x1' in c) [o.x1, o.y1] = fn(c.x1, c.y1);
    if ('x2' in c) [o.x2, o.y2] = fn(c.x2, c.y2);
    return o;
  });
}
const attrs = a => Object.entries(a).filter(([, v]) => v !== undefined && v !== null && v !== false)
  .map(([k, v]) => ` ${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${v}"`).join('');

/* ---------- lettering ---------- */
// Lay a line out glyph by glyph: kerning from the font, tracking in em.
function layout(str, { font: name, size, tracking = 0, kerning = true }) {
  const f = font(name), scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str);
  const items = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    items.push({ g, x, adv: g.advanceWidth * scale });
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += tracking * size + (kerning ? f.getKerningValue(g, glyphs[i + 1]) * scale : 0);
  });
  return { items, width: x, size };
}
const measure = (str, o) => layout(str, o).width;
// the size at which a line is exactly `width` wide
const fit = (str, o, width) => width / measure(str, { ...o, size: 100 }) * 100;

// The outline of a line of text as path commands. anchor: 'start' | 'middle' | 'end' at x; y is the baseline.
// warp(x, y) → [x, y] bends the finished line (arch, bulge…); skew leans it (positive = to the right).
function textCmds(str, { font: name, size, x = 0, y = 0, anchor = 'middle', tracking = 0, kerning = true, warp, skew = 0 }) {
  const L = layout(str, { font: name, size, tracking, kerning });
  const x0 = anchor === 'middle' ? x - L.width / 2 : anchor === 'end' ? x - L.width : x;
  let cmds = [];
  L.items.forEach(it => { cmds = cmds.concat(it.g.getPath(x0 + it.x, y, size).commands); });
  if (skew) cmds = mapCmds(cmds, (px, py) => [px + (y - py) * Math.tan(skew * Math.PI / 180), py]);
  if (warp) cmds = mapCmds(cmds, warp);
  return { cmds, width: L.width, x0 };
}
// <path> of a line of text; any other option becomes an attribute (fill, stroke, strokeWidth, transform, …)
function text(str, o) {
  const { font: _f, size: _s, x: _x, y: _y, anchor: _a, tracking: _t, kerning: _k, warp: _w, skew: _sk, ...rest } = o;
  return `<path d="${cmdsToD(textCmds(str, o).cmds)}"${attrs(rest)}/>`;
}
// text with a solid outline behind it: the outline drawn first, as a fat stroke of the same shape
function outlined(str, o, { stroke, width, shadow }) {
  const d = cmdsToD(textCmds(str, o).cmds);
  const { font: _f, size: _s, x: _x, y: _y, anchor: _a, tracking: _t, kerning: _k, warp: _w, skew: _sk, fill, ...rest } = o;
  let out = '';
  if (shadow) out += `<path d="${d}" fill="${shadow.fill}" stroke="${shadow.fill}" stroke-width="${width * 2}" stroke-linejoin="round" transform="translate(${shadow.dx} ${shadow.dy})"/>`;
  out += `<path d="${d}" fill="${stroke}" stroke="${stroke}" stroke-width="${width * 2}" stroke-linejoin="round"${attrs(rest)}/>`;
  out += `<path d="${d}" fill="${fill}"${attrs(rest)}/>`;
  return out;
}

// Arch: the line rises (or sinks, rise < 0) along a parabola, letters stay upright — the varsity arch.
const arch = (cx, halfWidth, rise) => (x, y) => { const t = (x - cx) / halfWidth; return [x, y - rise * (1 - t * t)]; };
// Bulge: the middle of the line swells taller around the baseline at `base`, the ends stay — for loud type
const bulge = (cx, halfWidth, base, amount) => (x, y) => { const t = Math.min(1, Math.abs((x - cx) / halfWidth)); return [x, base + (y - base) * (1 + amount * (1 - t * t))]; };

// Text on a circle. at: where the middle of the line sits, in degrees clockwise from the top.
// side 'top' reads clockwise with the letters standing outward; 'bottom' reads left to right, upright, letters
// hanging inward. r is the radius of the middle of the capitals, so top and bottom lines share one ring.
function arcText(str, { font: name, size, cx, cy, r, at, side = 'top', tracking = 0, ...rest }) {
  const L = layout(str, { font: name, size, tracking });
  const half = capHeight(name) * size / 2;
  const rb = side === 'top' ? r - half : r + half; // baseline radius
  const deg = 180 / Math.PI;
  let cmds = [];
  L.items.forEach(it => {
    const s = it.x + it.adv / 2 - L.width / 2; // arc length from the middle of the line to this letter's centre
    const th = side === 'top' ? at / deg + s / rb : at / deg - s / rb;
    const rot = side === 'top' ? th : th - Math.PI;
    const px = cx + rb * Math.sin(th), py = cy - rb * Math.cos(th);
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const g = it.g.getPath(-it.adv / 2, 0, size).commands;
    cmds = cmds.concat(mapCmds(g, (x, y) => [px + x * cos - y * sin, py + x * sin + y * cos]));
  });
  return `<path d="${cmdsToD(cmds)}"${attrs(rest)}/>`;
}

/* ---------- shapes ---------- */
const P = (d, a = {}) => `<path d="${d}"${attrs(a)}/>`;
const circle = (cx, cy, r, a = {}) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"${attrs(a)}/>`;
const ellipse = (cx, cy, rx, ry, a = {}) => `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"${attrs(a)}/>`;
const rect = (x, y, w, h, a = {}) => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"${attrs(a)}/>`;
const g = (inner, a = {}) => `<g${attrs(a)}>${inner}</g>`;
const poly = pts => 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L') + 'Z';
// a ring as one shape (even-odd), for badges
const ringD = (cx, cy, r1, r0) => `M${r2(cx - r1)} ${r2(cy)}a${r2(r1)} ${r2(r1)} 0 1 0 ${r2(r1 * 2)} 0a${r2(r1)} ${r2(r1)} 0 1 0 ${r2(-r1 * 2)} 0Z` +
  `M${r2(cx - r0)} ${r2(cy)}a${r2(r0)} ${r2(r0)} 0 1 1 ${r2(r0 * 2)} 0a${r2(r0)} ${r2(r0)} 0 1 1 ${r2(-r0 * 2)} 0Z`;
function star(cx, cy, rOut, rIn = rOut * 0.45, n = 5, rot = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rot - 90 + i * 180 / n) * Math.PI / 180, r = i % 2 ? rIn : rOut;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return poly(pts);
}
// a four-point sparkle
const sparkle = (cx, cy, r, w = 0.22) => `M${r2(cx)} ${r2(cy - r)}Q${r2(cx + r * w)} ${r2(cy - r * w)} ${r2(cx + r)} ${r2(cy)}Q${r2(cx + r * w)} ${r2(cy + r * w)} ${r2(cx)} ${r2(cy + r)}Q${r2(cx - r * w)} ${r2(cy + r * w)} ${r2(cx - r)} ${r2(cy)}Q${r2(cx - r * w)} ${r2(cy - r * w)} ${r2(cx)} ${r2(cy - r)}Z`;
// rays of a sunburst between radii r0 and r1; `fill` of the rays' width (0–1)
function burst(cx, cy, r0, r1, n, fill = 0.5, rot = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (rot + i * 360 / n) * Math.PI / 180, h = Math.PI / n * fill;
    const p = (r, t) => [cx + r * Math.sin(t), cy - r * Math.cos(t)];
    d += poly([p(r0, a - h * r0 / r1), p(r1, a - h), p(r1, a + h), p(r0, a + h * r0 / r1)]);
  }
  return d;
}
// a smooth closed (or open) curve through points (Catmull-Rom as cubic Béziers)
function smooth(pts, closed = true, k = 1) {
  const n = pts.length, at = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
    d += `C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
// seeded randomness, so every run draws the same design
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// points around an outline given as radius(angle), nudged a little as if cut by hand with scissors
function cutShape(cx, cy, radius, { n = 48, jitter = 0.02, seed = 1, rot = 0 } = {}) {
  const rand = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    const r = radius(t) * (1 + (rand() - 0.5) * 2 * jitter);
    pts.push([cx + r * Math.sin(t + rot), cy - r * Math.cos(t + rot)]);
  }
  return smooth(pts);
}
// a leaf from (x0, y0) to (x1, y1), `width` across at its widest, bent by `bend` (fraction of its length)
function leaf(x0, y0, x1, y1, width, bend = 0) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const at = (t, side) => {
    const w = width / 2 * Math.sin(Math.PI * Math.pow(t, 0.85)) * side, b = bend * len * Math.sin(Math.PI * t);
    return [x0 + dx * t + nx * (w + b), y0 + dy * t + ny * (w + b)];
  };
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push(at(i / 12, 1));
  for (let i = 11; i >= 1; i--) pts.push(at(i / 12, -1));
  return smooth(pts);
}

/* ---------- characters: the face every mascot shares ---------- */
// eyes: ink ovals with a light glint; smile: a thick round-capped curve; cheeks: two soft dots
function face(cx, cy, s, { ink = C.ink, cheek = C.pink, glint = C.white, wink = false, mouth = 'smile' } = {}) {
  const ex = 0.36 * s, ey = -0.06 * s, rx = 0.085 * s, ry = 0.13 * s;
  let out = '';
  [-1, 1].forEach(side => {
    const x = cx + side * ex, y = cy + ey;
    if (wink && side === 1) out += P(`M${r2(x - rx * 1.3)} ${r2(y + ry * 0.2)}Q${r2(x)} ${r2(y - ry * 0.9)} ${r2(x + rx * 1.3)} ${r2(y + ry * 0.2)}`, { fill: 'none', stroke: ink, strokeWidth: r2(s * 0.05), strokeLinecap: 'round' });
    else out += ellipse(x, y, rx, ry, { fill: ink }) + ellipse(x + rx * 0.3, y - ry * 0.42, rx * 0.36, ry * 0.26, { fill: glint });
  });
  if (cheek) [-1, 1].forEach(side => { out += ellipse(cx + side * 0.56 * s, cy + 0.16 * s, 0.11 * s, 0.07 * s, { fill: cheek }); });
  const my = cy + 0.13 * s;
  if (mouth === 'open') out += P(`M${r2(cx - 0.2 * s)} ${r2(my)}Q${r2(cx)} ${r2(my + 0.36 * s)} ${r2(cx + 0.2 * s)} ${r2(my)}Z`, { fill: ink }) + ellipse(cx, my + 0.13 * s, 0.08 * s, 0.05 * s, { fill: C.tomato });
  else out += P(`M${r2(cx - 0.17 * s)} ${r2(my)}Q${r2(cx)} ${r2(my + 0.2 * s)} ${r2(cx + 0.17 * s)} ${r2(my)}`, { fill: 'none', stroke: ink, strokeWidth: r2(s * 0.055), strokeLinecap: 'round' });
  return out;
}

/* ---------- print textures ---------- */
// Halftone dots in an ink, for riso shading: fill a shape with url(#id)
const halftone = (id, color, step = 9, r = 2.6, angle = 45) =>
  `<pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><circle cx="${step / 2}" cy="${step / 2}" r="${r}" fill="${color}"/></pattern>`;
// Worn ink: a mask that takes small irregular flecks out of the print, like a screen print washed a few times.
// amount 0–1: how much is taken away.
function wornMask(id, { amount = 0.35, scale = 0.55, seed = 4, w = 4000, h = 4000 } = {}) {
  const cut = 0.24 + amount * 0.16;
  return `<filter id="${id}-f" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${scale}" numOctaves="3" seed="${seed}" result="n"/>` +
    `<feComponentTransfer in="n"><feFuncR type="discrete" tableValues="${steps(cut)}"/><feFuncG type="discrete" tableValues="${steps(cut)}"/><feFuncB type="discrete" tableValues="${steps(cut)}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    `</filter><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#fff" filter="url(#${id}-f)"/></mask>`;
}
// a step table for feFuncX discrete: black below `cut` of the noise range, white above, sharp
function steps(cut) {
  const n = 40, t = [];
  for (let i = 0; i < n; i++) t.push(i / n < cut ? 0 : 1);
  return t.join(' ');
}

module.exports = {
  C, font, capHeight, layout, measure, fit, textCmds, text, outlined, arcText, arch, bulge, cmdsToD, mapCmds,
  P, circle, ellipse, rect, g, poly, ringD, star, sparkle, burst, smooth, rng, cutShape, leaf, face, halftone, wornMask, r2,
};
