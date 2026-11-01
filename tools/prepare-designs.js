/* Belief Project — studio designs.
   For every image in designs-source/<direction>/ this script:
     1. removes the image's background and keeps the artwork (text, illustration, details) with true transparency,
        then clears what is left of the paper: paper caught inside letters, specks of grain away from the artwork,
        and faint film that never becomes solid ink. A vector master drawn by draw-designs.js (.svg) skips all that:
        its art layer is already cut out exactly,
     2. prints the artwork on the back of the studio shirt twice — the cut-out, and the image as supplied, with its
        own background — large and centred in the print area, following the fabric's ribs and folds, lit like the
        fabric and textured by it,
     3. writes everything the studio page needs, and the list of designs, assets/designs/designs.js.

     node tools/prepare-designs.js [--only <direction>/<file-or-id>] [--debug <folder>]

   Run prepare-garment.js first (it measures the fabric). Per-image settings live in designs.config.js. */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const P = require('./lib/pixels');
const S = require('./studio.config');
const D = require('./designs.config');

const ROOT = path.resolve(__dirname, '..');
const arg = name => (i => (i > 0 ? process.argv[i + 1] : ''))(process.argv.indexOf(name));
const debugDir = arg('--debug');
const only = arg('--only');
const reuse = process.argv.includes('--reuse-cutouts');
if (debugDir) fs.mkdirSync(debugDir, { recursive: true });

const slug = s => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'design';

/* ---------- 1. background removal ---------- */
// A vector master from draw-designs.js needs none: its art layer is drawn on nothing, so the cut-out is exact.
// "With background" is the whole page, its paper layer included. Rendered with the longer side SVG_SIZE px.
const SVG_SIZE = 2400;
const svgTitle = svg => ((svg.match(/<title>([\s\S]*?)(?: — Belief Project)?<\/title>/) || [])[1] || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
async function isolateSvg(file, opt) {
  const svg = fs.readFileSync(file, 'utf8');
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!vb) throw new Error(file + ': no viewBox');
  const density = 72 * (opt.size || SVG_SIZE) / Math.max(+vb[3], +vb[4]);
  const render = src => sharp(Buffer.from(src), { density }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const page = await render(svg);
  const w = page.info.width, h = page.info.height;
  for (let i = 3; i < page.data.length; i += 4) page.data[i] = 255;
  const original = { w, h, rgba: page.data };
  if (opt.cutout === false) return { original };

  const { data } = await render(svg.replace(/<g id="paper">.*<\/g>\n/, ''));
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error(file + ': the art layer is empty');
  const pad = 8;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, rgba = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) data.copy(rgba, y * tw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
  const paper = (svg.match(/<g id="paper">.*?fill="(#[0-9a-fA-F]{6})"/) || [])[1] || '';
  return { w: tw, h: th, rgba, cleared: Buffer.alloc(tw * th), trim: { x: x0, y: y0, w, h }, tol: 0, spread: 0, bgHex: paper, original, vector: true };
}

async function isolate(file, opt) {
  if (/\.svg$/i.test(file)) return isolateSvg(file, opt);
  const up = opt.upscale;
  const meta = await sharp(file).rotate().metadata();
  // crop: trim the image's own edges first (a frame or overlay left from a screenshot, not part of the design)
  const [c0, c1, c2, c3] = opt.crop || [0, 0, 1, 1];
  const cut = { left: Math.round(c0 * meta.width), top: Math.round(c1 * meta.height) };
  cut.width = Math.round(c2 * meta.width) - cut.left; cut.height = Math.round(c3 * meta.height) - cut.top;
  const w = Math.round(cut.width * up), h = Math.round(cut.height * up);
  const { data: rgb } = await sharp(file).rotate().removeAlpha().extract(cut).resize(w, h, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const N = w * h;
  // the image as supplied, background and all: the studio's "with background" print
  const original = { w, h, rgba: Buffer.alloc(N * 4, 255) };
  for (let i = 0; i < N; i++) rgb.copy(original.rgba, i * 4, i * 3, i * 3 + 3);
  if (opt.cutout === false) return { original };

  const Lc = new Float32Array(N), Ac = new Float32Array(N), Bc = new Float32Array(N);
  for (let i = 0; i < N; i++) { const l = P.lab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]); Lc[i] = l[0]; Ac[i] = l[1]; Bc[i] = l[2]; }

  // the background colour: what most of the outer edge of the image is
  const band = Math.max(2, Math.round(Math.min(w, h) * 0.015));
  const edge = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < band || y < band || x >= w - band || y >= h - band) edge.push(y * w + x);
  let bg = [P.median(edge.map(i => Lc[i])), P.median(edge.map(i => Ac[i])), P.median(edge.map(i => Bc[i]))];
  if (opt.background) { const [r, g, b] = [1, 3, 5].map(k => parseInt(opt.background.slice(k, k + 2), 16)); bg = P.lab(r, g, b); }
  const de = (i, c) => Math.hypot(Lc[i] - c[0], Ac[i] - c[1], Bc[i] - c[2]);
  const spread = P.median(edge.map(i => de(i, bg)));
  const tol = opt.tolerance || Math.min(24, Math.max(7, 3 * spread + 6));

  // follow slow changes in the paper (vignette, uneven light): the background colour near each pixel.
  // Flat digital backgrounds do not need it, and it could drift into near-paper ink, so only textured ones get it.
  const dist = new Float32Array(N);
  const adapt = opt.adapt ?? spread > 1;
  if (!adapt) for (let i = 0; i < N; i++) dist[i] = de(i, bg);
  else {
  const rough = new Uint8Array(N);
  for (let i = 0; i < N; i++) rough[i] = de(i, bg) < tol * 1.3 ? 1 : 0;
  const reach0 = P.flood(rough, w, h, P.borderSeeds(w, h));
  const wsum = P.blur(Float32Array.from(reach0), w, h, 30);
  const field = [Lc, Ac, Bc].map(ch => P.blur(ch.map((v, i) => v * reach0[i]), w, h, 30));
  const localBg = i => (wsum[i] > 0.02 ? [field[0][i] / wsum[i], field[1][i] / wsum[i], field[2][i] / wsum[i]] : bg);
  for (let i = 0; i < N; i++) dist[i] = de(i, localBg(i));
  }

  // background = paper-coloured pixels the edge of the image can reach
  const paper = new Uint8Array(N);
  for (let i = 0; i < N; i++) paper[i] = dist[i] < tol ? 1 : 0;
  let isBg;
  if (!opt.seal) isBg = P.flood(paper, w, h, P.borderSeeds(w, h));
  else {
    // thicken the outlines while flooding, so small gaps in them hold; then let the paper back up to the ink
    const r = Math.max(1, Math.round(opt.seal * up));
    const near = P.distanceTo(paper.map(v => 1 - v), w, h, r + 1);
    isBg = P.flood(paper.map((v, i) => (v && near[i] > r ? 1 : 0)), w, h, P.borderSeeds(w, h));
    const back = P.distanceTo(isBg, w, h, r + 2);
    for (let i = 0; i < N; i++) if (paper[i] && back[i] <= r + 1) isBg[i] = 1;
  }

  // paper-coloured areas shut inside the artwork (see holes in designs.config.js)
  const cleared = new Uint8Array(N); // what the clean-up took away, for the review sheets
  if (opt.holes !== 'keep' || opt.clearHoles) {
    const inside = new Uint8Array(N);
    for (let i = 0; i < N; i++) inside[i] = paper[i] && !isBg[i] ? 1 : 0;
    const cc = P.components(inside, w, h);
    const clear = holesToClear(cc, paper, isBg, w, h, opt);
    for (let i = 0; i < N; i++) { const k = cc.labels[i]; if (k && clear[k]) { isBg[i] = 1; cleared[i] = 1; } }
  }
  if (opt.keepBox) { // a region that is artwork whatever its colour
    const [x0, y0, x1, y1] = opt.keepBox.map((v, k) => Math.round(v * (k % 2 ? h : w)));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { isBg[y * w + x] = 0; cleared[y * w + x] = 0; }
  }

  // soft edge: across the boundary, opacity follows how far a pixel's colour is from the paper towards the ink
  const ink = isBg.map(v => 1 - v);
  const toBg = P.distanceTo(isBg, w, h, 4);
  const toInk = P.distanceTo(ink, w, h, 4);
  const inkRef = P.blur(dist.map((v, i) => v * ink[i] * (toBg[i] >= 2 ? 1 : 0)), w, h, 2.5);
  const inkW = P.blur(ink.map((v, i) => v * (toBg[i] >= 2 ? 1 : 0)), w, h, 2.5);
  const alpha = new Float32Array(N);
  const lo = tol * 0.55;
  for (let i = 0; i < N; i++) {
    const nearEdge = (ink[i] && toBg[i] <= 2) || (!ink[i] && toInk[i] <= 1);
    if (!nearEdge) { alpha[i] = ink[i]; continue; }
    const full = Math.max(tol * 1.25, inkW[i] > 0.05 ? (inkRef[i] / inkW[i]) * 0.9 : tol * 2);
    const t = Math.min(1, Math.max(0, (dist[i] - lo) / (full - lo)));
    alpha[i] = t * t * (3 - 2 * t);
  }

  // drop specks of paper grain that survived, never real marks (those differ clearly from the paper)
  {
    const m = alpha.map(v => (v > 0.04 ? 1 : 0));
    const cc = P.components(m, w, h);
    const peak = new Float32Array(cc.sizes.length);
    for (let i = 0; i < N; i++) { const k = cc.labels[i]; if (k && dist[i] > peak[k]) peak[k] = dist[i]; }
    const speck = opt.speck * up * up;
    for (let i = 0; i < N; i++) { const k = cc.labels[i]; if (k && cc.sizes[k] <= speck && peak[k] < tol * 2.2) { alpha[i] = 0; cleared[i] = 1; } }
  }
  // what else is left of the paper: specks away from the artwork, and film that never turns into solid ink
  if (opt.stray !== false) clearStray(alpha, w, h, opt, cleared);
  clearFilm(alpha, w, h, cleared);
  const tinted = bg[0] >= 80 && Math.hypot(bg[1], bg[2]) >= 3;
  const glints = tinted ? clearGlints(alpha, Lc, bg[0], w, h, up, cleared) : null;

  // colour of half-covered edge pixels: take the paper back out of them
  const core = alpha.map(v => (v >= 0.999 ? 1 : 0));
  const out = Buffer.alloc(N * 4);
  const fillW = P.blur(core, w, h, 1.5);
  const fill = [0, 1, 2].map(c => P.blur(core.map((v, i) => v * P.LIN[rgb[i * 3 + c]]), w, h, 1.5));
  const bgLin = labToLin(bg);
  for (let i = 0; i < N; i++) {
    const a = alpha[i];
    if (a <= 0) continue;
    for (let c = 0; c < 3; c++) {
      let v = P.LIN[rgb[i * 3 + c]];
      if (a < 0.999) {
        const un = Math.min(1, Math.max(0, (v - bgLin[c] * (1 - a)) / a));
        const near = fillW[i] > 0.02 ? fill[c][i] / fillW[i] : un;
        v = near * (1 - a) + un * a;
      }
      out[i * 4 + c] = P.toSrgb(v);
    }
    out[i * 4 + 3] = Math.round(a * 255);
  }

  // trim to the artwork
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > 0.03) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error('nothing left after removing the background — lower its tolerance');
  const pad = Math.round(4 * up);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const trimmed = Buffer.alloc(tw * th * 4);
  const gone = Buffer.alloc(tw * th);
  for (let y = 0; y < th; y++) {
    out.copy(trimmed, y * tw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
    for (let x = 0; x < tw; x++) gone[y * tw + x] = cleared[(y + y0) * w + x + x0] ? 255 : 0;
  }
  return { w: tw, h: th, rgba: trimmed, cleared: gone, trim: { x: x0, y: y0, w, h }, tol, spread, glints: glints ? glints.reduce((n, v) => n + v, 0) : 0, glintMask: glints, bgHex: linToHex(bgLin), original };
}

// Which paper-coloured holes inside the artwork to clear. 'remove': all; a number: those smaller than that many
// pixels of the original image; 'auto': paper caught inside a letter — a hole ringed by a thick stroke, with the
// outside of the mark just beyond that stroke (the wall is no thicker than the hole is wide). Fills inside the thin
// outlines of a drawing (a face, a glove, a flower), the white of an eye deep inside a face, white lettering inside
// a bigger shape, and large fills stay.
function holesToClear(cc, paper, isBg, w, h, opt) {
  const n = cc.sizes.length, N = w * h, up = opt.upscale;
  const clear = new Uint8Array(n);
  if (opt.holes !== 'auto') {
    for (let k = 1; k < n; k++) clear[k] = opt.holes === 'remove' || (typeof opt.holes === 'number' && cc.sizes[k] <= opt.holes * up * up) ? 1 : 0;
    if (opt.clearHoles || opt.keepHoles) placed(cc, w, h, opt, clear);
    return clear;
  }
  // how thick the ink is around each hole: the strokes of lettering survive being thinned by r, the outlines of a drawing do not
  const r = Math.max(3, Math.round(Math.min(w, h) * (opt.stroke ?? 0.0055)));
  const toPaper = P.distanceTo(paper, w, h, r + 1);
  const core = new Uint8Array(N);
  for (let i = 0; i < N; i++) core[i] = toPaper[i] > r ? 1 : 0;
  const toCore = P.distanceTo(core, w, h, r + 1);
  // how far each pixel is from the background outside the artwork
  const cap = Math.min(250, Math.round(Math.min(w, h) * 0.08));
  const toOut = P.distanceTo(isBg, w, h, cap);
  const ring = new Int32Array(n), thick = new Int32Array(n), wall = new Int32Array(n).fill(cap);
  const cx = new Float64Array(n), cy = new Float64Array(n);
  const look = (k, j) => {
    if (paper[j]) return;
    ring[k]++;
    if (toCore[j] <= r) thick[k]++;
    if (toOut[j] < wall[k]) wall[k] = toOut[j];
  };
  for (let i = 0; i < N; i++) {
    const k = cc.labels[i]; if (!k) continue;
    const x = i % w;
    cx[k] += x; cy[k] += (i - x) / w;
    if (x > 0) look(k, i - 1);
    if (x < w - 1) look(k, i + 1);
    if (i >= w) look(k, i - w);
    if (i < N - w) look(k, i + w);
  }
  const maxHole = (opt.holeMax ?? 0.004) * N;
  for (let k = 1; k < n; k++) {
    const across = 2 * Math.sqrt(cc.sizes[k] / Math.PI);
    clear[k] = ring[k] && cc.sizes[k] <= maxHole && thick[k] >= ring[k] * 0.5 && wall[k] <= across * (opt.holeWall ?? 2.5) ? 1 : 0;
    // what the review found: holes always kept, or always cleared, by where they are ([left, top, right, bottom] fractions)
    const fx = cx[k] / cc.sizes[k] / w, fy = cy[k] / cc.sizes[k] / h;
    const within = boxes => (boxes || []).some(([a, b, c2, d]) => fx >= a && fx <= c2 && fy >= b && fy <= d);
    if (within(opt.keepHoles)) clear[k] = 0;
    if (within(opt.clearHoles)) clear[k] = 1;
  }
  return clear;
}
// holes kept or cleared by where they are, for the modes other than 'auto'
function placed(cc, w, h, opt, clear) {
  const n = cc.sizes.length, cx = new Float64Array(n), cy = new Float64Array(n);
  for (let i = 0; i < w * h; i++) { const k = cc.labels[i]; if (k) { const x = i % w; cx[k] += x; cy[k] += (i - x) / w; } }
  for (let k = 1; k < n; k++) {
    const fx = cx[k] / cc.sizes[k] / w, fy = cy[k] / cc.sizes[k] / h;
    const within = boxes => (boxes || []).some(([a, b, c2, d]) => fx >= a && fx <= c2 && fy >= b && fy <= d);
    if (within(opt.keepHoles)) clear[k] = 0;
    if (within(opt.clearHoles)) clear[k] = 1;
  }
}

// Small marks with hardly any artwork around them are grain or dust, not part of the design. A mark stays when
// there is enough artwork within `gap` of it (a full stop, a line of small print, the dot of an i).
function clearStray(alpha, w, h, opt, cleared) {
  const N = w * h, st = { size: 0.00006, gap: 0.03, mass: 0.0001, ...(typeof opt.stray === 'object' ? opt.stray : {}) };
  const solid = new Uint8Array(N);
  for (let i = 0; i < N; i++) solid[i] = alpha[i] > 0.35 ? 1 : 0;
  const cc = P.components(solid, w, h);
  const n = cc.sizes.length;
  const x0 = new Int32Array(n).fill(w), y0 = new Int32Array(n).fill(h), x1 = new Int32Array(n).fill(-1), y1 = new Int32Array(n).fill(-1);
  for (let i = 0; i < N; i++) {
    const k = cc.labels[i]; if (!k) continue;
    const x = i % w, y = (i - x) / w;
    if (x < x0[k]) x0[k] = x; if (x > x1[k]) x1[k] = x; if (y < y0[k]) y0[k] = y; if (y > y1[k]) y1[k] = y;
  }
  // summed-area table of the solid pixels: how much artwork lies around each mark
  const W1 = w + 1, sat = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += solid[y * w + x]; sat[(y + 1) * W1 + x + 1] = sat[y * W1 + x + 1] + row; } }
  const sum = (ax, ay, bx, by) => sat[by * W1 + bx] - sat[ay * W1 + bx] - sat[by * W1 + ax] + sat[ay * W1 + ax];
  const small = st.size * N, gap = Math.round(Math.min(w, h) * st.gap), mass = st.mass * N;
  const drop = new Uint8Array(n);
  for (let k = 1; k < n; k++) {
    if (cc.sizes[k] > small) continue;
    const ax = Math.max(0, x0[k] - gap), ay = Math.max(0, y0[k] - gap), bx = Math.min(w, x1[k] + 1 + gap), by = Math.min(h, y1[k] + 1 + gap);
    if (sum(ax, ay, bx, by) - cc.sizes[k] < mass) drop[k] = 1;
  }
  const gone = new Uint8Array(N);
  let any = false;
  for (let i = 0; i < N; i++) if (drop[cc.labels[i]]) { gone[i] = 1; any = true; }
  if (!any) return;
  // the mark and the soft edge around it
  const near = P.distanceTo(gone, w, h, 3);
  for (let i = 0; i < N; i++) if (gone[i] || (near[i] <= 2 && !solid[i] && alpha[i] > 0)) { alpha[i] = 0; cleared[i] = 1; }
}

// Paper grain that never becomes solid ink (a faint patch, a hairline along the edge of a scan) prints as a haze
// on a dark shirt: a patch whose strongest pixel is still mostly transparent goes, and so does the faintest fringe.
function clearFilm(alpha, w, h, cleared) {
  const N = w * h;
  const cc = P.components(alpha.map(v => (v > 0.02 ? 1 : 0)), w, h);
  const peak = new Float32Array(cc.sizes.length);
  for (let i = 0; i < N; i++) { const k = cc.labels[i]; if (k && alpha[i] > peak[k]) peak[k] = alpha[i]; }
  for (let i = 0; i < N; i++) {
    const k = cc.labels[i];
    if (k && peak[k] < 0.55) { alpha[i] = 0; cleared[i] = 1; }
    else if (alpha[i] > 0 && alpha[i] <= 0.02) alpha[i] = 0;
  }
}

// On cream or tinted paper, marks LIGHTER than the paper are not ink: the bright ring a JPEG leaves along a line, or
// white grain. They print as white specks on a dark shirt. They are small or thin, and sit on the edge of the artwork,
// against the paper taken away. A white area that belongs to the design (a white top, a white flower) is bigger and
// thicker, and stays. On white or grey paper nothing is lighter than the paper but white artwork, so it is left alone.
// Returns the pixels that went.
function clearGlints(alpha, Lc, paperL, w, h, up, cleared) {
  const N = w * h;
  const light = new Uint8Array(N);
  for (let i = 0; i < N; i++) light[i] = alpha[i] > 0 && Lc[i] >= paperL - 3 ? 1 : 0;
  const cc = P.components(light, w, h);
  const n = cc.sizes.length;
  const depth = P.distanceTo(light.map(v => 1 - v), w, h, 2 * up + 2);
  const deep = new Uint8Array(n), rim = new Uint32Array(n), open = new Uint32Array(n);
  for (let i = 0; i < N; i++) {
    const k = cc.labels[i]; if (!k) continue;
    if (depth[i] > deep[k]) deep[k] = depth[i];
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= N || light[j]) continue;
      rim[k]++;
      if (alpha[j] <= 0) open[k]++;
    }
  }
  const small = 16 * up * up, thin = up + 1;
  const glint = new Uint8Array(n);
  for (let k = 1; k < n; k++) glint[k] = (cc.sizes[k] <= small || deep[k] <= thin) && open[k] >= rim[k] * 0.25 ? 1 : 0;
  const gone = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (glint[cc.labels[i]]) { alpha[i] = 0; cleared[i] = 1; gone[i] = 1; }
  return gone;
}

function labToLin([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = t => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
  return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z].map(v => Math.min(1, Math.max(0, v)));
}
const linToHex = lin => '#' + lin.map(v => P.toSrgb(v).toString(16).padStart(2, '0')).join('');
/* ---------- 2. the fabric: one stage per colour, measured by prepare-garment.js ---------- */
function loadStage(st) {
  const file = path.join(__dirname, '.cache', `stage-${st.id}.bin`);
  if (!fs.existsSync(file)) throw new Error('run tools/prepare-garment.js first');
  const buf = fs.readFileSync(file);
  const head = new Float32Array(buf.buffer, buf.byteOffset, 3);
  const w = head[0], h = head[1], N = w * h;
  const shade = new Float32Array(buf.buffer.slice(buf.byteOffset + 12, buf.byteOffset + 12 + N * 4));
  const shirt = new Uint8Array(buf.buffer.slice(buf.byteOffset + 12 + N * 4, buf.byteOffset + 12 + N * 5));
  const logS = shade.map(v => Math.log(Math.max(v, 0.02)));
  const logLow = P.blur(logS, w, h, 9);
  const height = P.blur(logS, w, h, st.print.foldScale);
  // the model's back faces the camera: the print stands straight, following only the folds
  const pr = st.print;
  return { w, h, shade, shirt, logS, logLow, height, lean: { a: 0, b: 0, c: 0, xc: pr.centerX, yc: pr.top + pr.height / 2 } };
}

// a cut-out made before (designs-isolated/), read back instead of removing the background again
async function loadCutout(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, rgba: data, cleared: Buffer.alloc(info.width * info.height), reused: true };
}

function sampleF(arr, w, h, x, y) {
  x = Math.min(w - 1.001, Math.max(0, x)); y = Math.min(h - 1.001, Math.max(0, y));
  const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, i = iy * w + ix;
  return (arr[i] * (1 - fx) + arr[i + 1] * fx) * (1 - fy) + (arr[i + w] * (1 - fx) + arr[i + w + 1] * fx) * fy;
}

/* ---------- 3. printing onto the shirt ---------- */
// How large the artwork is printed: the same share of the print area for every design (studio.config.js, print.fill),
// so a wide design comes out wider and a tall one taller with the same presence — never past the print area, never
// stretched, and centred in it both ways.
function printSize(ar, pr) {
  let dw = Math.sqrt(pr.fill * pr.width * pr.height * ar), dh = dw / ar;
  if (dw > pr.width) { dw = pr.width; dh = dw / ar; }
  if (dh > pr.height) { dh = pr.height; dw = dh * ar; }
  return { dw, dh };
}

function printOnShirt(art, F, pr) {
  const K = pr.scale;
  const { dw, dh } = printSize(art.w / art.h, pr);
  const top = pr.top + (pr.height - dh) / 2;
  const yRef = top + dh / 2;
  const left = pr.centerX - dw / 2;

  // output: the print area plus room for the folds, at K× the frame
  const m = 14;
  const ox0 = Math.floor(pr.centerX - pr.width / 2 - m), oy0 = Math.floor(pr.top - m);
  const ow = Math.ceil(pr.width + 2 * m), oh = Math.ceil(pr.height + 2 * m);
  const W = ow * K, H = oh * K;
  // ribs: start a line at every half pixel across the artwork at its middle row, follow it up and down
  const L = F.lean;
  const leanAt = (x, y) => L.a + L.b * (x - L.xc) + L.c * (y - L.yc);
  const step = 0.5, n = Math.ceil((dw + 2 * m) / step) + 1;
  const x0s = Float64Array.from({ length: n }, (_, k) => left - m + k * step);
  const rowsX = new Array(H);
  const rowY = r => oy0 + (r + 0.5) / K;
  {
    const half = 0.5 / K;
    let cur = Float64Array.from(x0s), y = yRef;
    const startRow = Math.min(H - 1, Math.max(0, Math.round((yRef - oy0) * K - 0.5)));
    // walk from yRef to the first row's y below, then fill rows downward and upward
    const walk = (arr, yFrom, yTo) => {
      const dir = Math.sign(yTo - yFrom), steps = Math.ceil(Math.abs(yTo - yFrom) / half);
      const dy = steps ? (yTo - yFrom) / steps : 0;
      for (let s = 0; s < steps; s++) { const yy = yFrom + dy * (s + 0.5); for (let k = 0; k < arr.length; k++) arr[k] += leanAt(arr[k], yy) * dy; }
      return dir;
    };
    walk(cur, y, rowY(startRow));
    const base = Float64Array.from(cur);
    rowsX[startRow] = Float64Array.from(cur);
    for (let r = startRow + 1; r < H; r++) { walk(cur, rowY(r - 1), rowY(r)); rowsX[r] = Float64Array.from(cur); }
    cur = Float64Array.from(base);
    for (let r = startRow - 1; r >= 0; r--) { walk(cur, rowY(r + 1), rowY(r)); rowsX[r] = Float64Array.from(cur); }
  }

  const out = Buffer.alloc(W * H * 4);
  const fw = F.w, fh = F.h;
  // straight → premultiplied artwork, linear light
  const aw = art.w, ah = art.h;
  const pre = new Float32Array(aw * ah * 4);
  for (let i = 0; i < aw * ah; i++) {
    const a = art.rgba[i * 4 + 3] / 255;
    pre[i * 4] = P.LIN[art.rgba[i * 4]] * a; pre[i * 4 + 1] = P.LIN[art.rgba[i * 4 + 1]] * a; pre[i * 4 + 2] = P.LIN[art.rgba[i * 4 + 2]] * a; pre[i * 4 + 3] = a;
  }
  const px = [0, 0, 0, 0];
  const sampleArt = (u, v) => {
    // u, v in artwork pixels; bilinear, transparent outside
    const x = u - 0.5, y = v - 0.5;
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    px[0] = px[1] = px[2] = px[3] = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const xx = ix + i, yy = iy + j;
      if (xx < 0 || yy < 0 || xx >= aw || yy >= ah) continue;
      const wgt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy), p = (yy * aw + xx) * 4;
      px[0] += pre[p] * wgt; px[1] += pre[p + 1] * wgt; px[2] += pre[p + 2] * wgt; px[3] += pre[p + 3] * wgt;
    }
    return px;
  };
  // the art is drawn at dw frame px across from art.w px: average enough source pixels when it is reduced
  const shrink = art.w / (dw * K);
  const taps = shrink > 1.4 ? Math.min(3, Math.ceil(shrink)) : 1;

  for (let r = 0; r < H; r++) {
    const Y = rowY(r);
    const xs = rowsX[r];
    for (let c = 0; c < W; c++) {
      const X = ox0 + (c + 0.5) / K;
      // the cloth folds: the print moves with the surface
      const gx = sampleF(F.height, fw, fh, X + 1, Y) - sampleF(F.height, fw, fh, X - 1, Y);
      const gy = sampleF(F.height, fw, fh, X, Y + 1) - sampleF(F.height, fw, fh, X, Y - 1);
      const Xs = X - gx * pr.fold, Ys = Y - gy * pr.fold;
      // which rib passes here → horizontal position in the artwork
      let lo = 0, hi = n - 1;
      if (Xs <= xs[0] || Xs >= xs[n - 1]) continue;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= Xs) lo = mid; else hi = mid; }
      const x0 = x0s[lo] + (Xs - xs[lo]) / (xs[hi] - xs[lo]) * step;
      // rows of the artwork run square to the ribs, so the print turns with the cloth instead of slanting
      const u = (x0 - left) / dw * aw, v = (Ys + L.a * (x0 - pr.centerX) - top) / dh * ah;
      if (u < -2 || v < -2 || u > aw + 2 || v > ah + 2) continue;
      let R = 0, G = 0, Bb = 0, A = 0;
      for (let ty = 0; ty < taps; ty++) for (let tx = 0; tx < taps; tx++) {
        const s = sampleArt(u + ((tx + 0.5) / taps - 0.5) * shrink, v + ((ty + 0.5) / taps - 0.5) * shrink);
        R += s[0]; G += s[1]; Bb += s[2]; A += s[3];
      }
      const t2 = taps * taps;
      A /= t2;
      if (A <= 0.002) continue;
      R /= t2; G /= t2; Bb /= t2;
      // lit like the fabric under it; thinner in the valleys between the ribs
      const ls = sampleF(F.logS, fw, fh, X, Y), ll = sampleF(F.logLow, fw, fh, X, Y);
      let lit = Math.exp(ll * pr.light + (ls - ll) * pr.relief);
      lit = Math.min(pr.maxLit, Math.max(pr.minLit, lit));
      const valley = Math.min(1, Math.exp(ls - ll));
      const a = Math.min(1, A * (1 - pr.grain * (1 - valley))) * (sampleF(F.shirt, fw, fh, X, Y) > 0.5 ? 1 : 0);
      if (a <= 0.002) continue;
      const o = (r * W + c) * 4;
      out[o] = P.toSrgb(R / A * lit); out[o + 1] = P.toSrgb(G / A * lit); out[o + 2] = P.toSrgb(Bb / A * lit);
      out[o + 3] = Math.round(a * 255);
    }
  }
  return { W, H, rgba: out, box: { x: ox0, y: oy0, w: ow, h: oh } };
}

/* ---------- legibility on each shirt colour ---------- */
function contrast(art) {
  const res = {};
  for (const tone of S.stages) {
    const t = P.hexToLin(tone.fabric);
    const Lt = 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
    let low = 0, all = 0;
    for (let i = 0; i < art.w * art.h; i++) {
      if (art.rgba[i * 4 + 3] < 128) continue;
      const Li = 0.2126 * P.LIN[art.rgba[i * 4]] + 0.7152 * P.LIN[art.rgba[i * 4 + 1]] + 0.0722 * P.LIN[art.rgba[i * 4 + 2]];
      const ratio = (Math.max(Li, Lt) + 0.05) / (Math.min(Li, Lt) + 0.05);
      all++; if (ratio < 1.7) low++;
    }
    res[tone.id] = all ? low / all : 0;
  }
  return res;
}

/* ---------- run ---------- */
async function main() {
  const stages = S.stages.map(st => ({ st, F: loadStage(st) }));
  const manifestFile = path.join(ROOT, D.output.manifest);
  const previous = (() => { try { const m = {}; new Function('window', fs.readFileSync(manifestFile, 'utf8'))(m); return m.BELIEF_DESIGNS; } catch (e) { return null; } })();
  const manifest = { generated: new Date().toISOString().slice(0, 10), frame: { w: S.frame.w, h: S.frame.h }, stages: {}, directions: [] };

  for (const dir of D.directions) {
    const srcDir = path.join(ROOT, D.source, dir.id);
    const files = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter(f => /\.(jpe?g|png|webp|avif|svg)$/i.test(f)).sort((a, b) => a.localeCompare(b)) : [];
    const order = Object.keys(dir.designs || {});
    files.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
    const entry = { id: dir.id, designs: [] };
    const used = new Set();
    for (const file of files) {
      const own = (dir.designs || {})[file] || {};
      if (own.skip) continue;
      let id = own.id || slug(path.parse(file).name);
      while (used.has(id)) id += '-2';
      used.add(id);
      const isSvg = /\.svg$/i.test(file);
      const title = own.title || (isSvg && svgTitle(fs.readFileSync(path.join(srcDir, file), 'utf8'))) || path.parse(file).name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      const rel = `${D.output.dir}/${dir.id}/${id}`;
      if (only && only !== `${dir.id}/${file}` && only !== `${dir.id}/${id}` && only !== dir.id) {
        const old = previous?.directions?.find(d => d.id === dir.id)?.designs.find(d => d.id === id);
        if (old) entry.designs.push(old);
        continue;
      }
      // a vector master is rendered at full size, not upscaled
      const opt = { ...D.defaults, ...(dir.defaults || {}), ...own, ...(isSvg ? { upscale: 1 } : {}), cutout: true };
      const t0 = Date.now();
      const outDir = path.join(ROOT, D.output.dir, dir.id);
      const isoDir = path.join(ROOT, D.output.isolated, dir.id);
      fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(isoDir, { recursive: true });
      const isoFile = path.join(isoDir, id + '.png');
      // --reuse-cutouts: the cut-out already in designs-isolated/ is printed as it is
      const art = reuse && fs.existsSync(isoFile) ? await loadCutout(isoFile) : await isolate(path.join(srcDir, file), opt);
      const raw = (buf, w, h) => sharp(buf, { raw: { width: w, height: h, channels: 4 } });
      if (!art.reused) {
        // the isolated artwork, lossless, back at the size it was supplied (it was worked on at opt.upscale ×)
        await raw(art.rgba, art.w, art.h).resize({ width: Math.round(art.w / opt.upscale), kernel: 'mitchell' }).png({ compressionLevel: 9, effort: 8 }).toFile(isoFile);
      }
      // printed on each model's shirt, cut out: there is no version with the image's own background
      const prints = {};
      const printedAll = [];
      for (const { st, F } of stages) {
        const printed = printOnShirt(art, F, st.print);
        const name = `${id}-${st.id}`;
        await raw(printed.rgba, printed.W, printed.H).webp({ quality: 86, alphaQuality: 92, effort: 6, smartSubsample: true }).toFile(path.join(outDir, name + '.webp'));
        await raw(printed.rgba, printed.W, printed.H).resize({ width: Math.round(printed.W / 2), kernel: 'lanczos3' }).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(path.join(outDir, name + '-sm.webp'));
        prints[st.id] = { src: `${rel}-${st.id}.webp`, small: `${rel}-${st.id}-sm.webp`, width: printed.W };
        manifest.stages[st.id] = { box: printed.box, scale: st.print.scale };
        printedAll.push({ st, printed });
      }
      // thumbnail for the design swatches
      await raw(art.rgba, art.w, art.h).resize({ width: 300, height: 300, fit: 'inside', kernel: 'lanczos3' }).webp({ quality: 80, alphaQuality: 88, effort: 6 }).toFile(path.join(outDir, id + '-thumb.webp'));
      // the files of the way the studio used to show designs, with and without background, are gone
      for (const f of [id + '-print.webp', id + '-print-sm.webp', id + '-print-bg.webp', id + '-print-bg-sm.webp']) fs.rmSync(path.join(outDir, f), { force: true });
      const low = contrast(art);
      const design = {
        id, title, source: file,
        thumb: `${rel}-thumb.webp`,
        prints,
        art: `${D.output.isolated}/${dir.id}/${id}.png`,
        ratio: +(art.w / art.h).toFixed(4),
        // shirt colours this design is hard to read on (most of its ink close to the fabric's brightness)
        faint: Object.keys(low).filter(k => low[k] > D.faintAbove),
      };
      if (own.credit) design.credit = own.credit;
      if (!design.faint.length) delete design.faint;
      entry.designs.push(design);
      const how = art.reused ? 'cut-out reused' : art.vector ? `vector, paper ${art.bgHex}` : `bg ${art.bgHex} spread ${art.spread.toFixed(1)} tol ${art.tol.toFixed(1)} glints ${art.glints}`;
      console.log(`${dir.id}/${id}  ${how}  ${art.w}×${art.h}  faint:${(design.faint || []).join(',') || '-'}  ${Date.now() - t0}ms`);
      if (debugDir) await debugSheet(art, printedAll, path.join(ROOT, D.source, dir.id, file), path.join(debugDir, `${dir.id}--${id}.jpg`));
    }
    manifest.directions.push(entry);
  }
  // where each print sits on its model, and how the page frames the model
  for (const st of S.stages) {
    const pr = st.print;
    manifest.stages[st.id] = {
      ...(previous?.stages?.[st.id] || {}),
      ...(manifest.stages[st.id] || {}),
      area: { x: pr.centerX - pr.width / 2, y: pr.top, w: pr.width, h: pr.height },
      view: st.view,
      photo: S.widths.map(w => ({ src: `${S.out.dir}/model-${st.id}-${w}.webp`, w })),
    };
  }
  const js = '/* Generated by tools/prepare-designs.js — do not edit by hand; edit tools/designs.config.js and run the script. */\n' +
    'window.BELIEF_DESIGNS = ' + JSON.stringify(manifest, null, 1) + ';\n';
  fs.writeFileSync(manifestFile, js);
  console.log('wrote', D.output.manifest, '—', manifest.directions.reduce((n, d) => n + d.designs.length, 0), 'designs');
}

// review sheet: the image as supplied; the cut-out on magenta, with what the clean-up took away in lime;
// then the print on each model, framed as the studio frames it
async function debugSheet(art, printedAll, sourceFile, file) {
  const cell = 440;
  const fit = buf => sharp(buf).resize(cell - 16, cell - 16, { fit: 'inside' }).png().toBuffer();
  const tile = async (bg, input) => sharp({ create: { width: cell, height: cell, channels: 3, background: bg } }).composite(input ? [{ input: await fit(input), gravity: 'center' }] : []).png().toBuffer();
  const tiles = [await tile('#ffffff', await sharp(sourceFile).rotate().png().toBuffer())];
  const n = art.w * art.h, over = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    if (art.cleared[i]) { over[i * 4] = 140; over[i * 4 + 1] = 255; over[i * 4 + 2] = 0; over[i * 4 + 3] = 255; }
    else art.rgba.copy(over, i * 4, i * 4, i * 4 + 4);
  }
  tiles.push(await tile('#ff00ff', await sharp(over, { raw: { width: art.w, height: art.h, channels: 4 } }).png().toBuffer()));
  for (const { st, printed } of printedAll) {
    const K = st.print.scale, b = printed.box, v = st.view;
    const photo = await sharp(path.join(ROOT, S.out.dir, `model-${st.id}-${S.widths[0]}.webp`)).resize(S.frame.w * K, S.frame.h * K).png().toBuffer();
    const img = await sharp(printed.rgba, { raw: { width: printed.W, height: printed.H, channels: 4 } }).png().toBuffer();
    const merged = await sharp(photo).composite([{ input: img, left: Math.round(b.x * K), top: Math.round(b.y * K) }]).png().toBuffer();
    tiles.push(await sharp(merged).extract({ left: v.x * K, top: v.y * K, width: v.w * K, height: v.h * K }).resize(cell, cell, { fit: 'contain', background: '#F3F9FF' }).png().toBuffer());
  }
  await sharp({ create: { width: cell * tiles.length, height: cell, channels: 3, background: '#888' } })
    .composite(tiles.map((t, i) => ({ input: t, left: i * cell, top: 0 }))).jpeg({ quality: 84 }).toFile(file);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { isolate, printOnShirt, printSize };
