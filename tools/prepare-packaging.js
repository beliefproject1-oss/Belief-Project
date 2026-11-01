/* Belief Project — the packaging picture: the frosted zipper bag with a Midnight shirt folded inside it, lit like an
   advertising photograph, for the packaging page.

     node tools/prepare-packaging.js [--debug <folder>]

   Everything in it comes from the photographs supplied:
     the bag   — _reference/packaging/zipper-bag-hanging.jpg: its shape and proportions, the brightness of its frosted
                 plastic and its print, lifted off the photo; the print takes the light blue it has over a dark shirt
                 (_reference/packaging/zipper-bag-on-shirt.jpg), where its black zip and white pull also show;
     the shirt — the ribbed Midnight fabric of _reference/garment/flat/16.jpg, folded, with the collar, the woven label
                 and the hang tag of _reference/garment/flat/13.jpg at its top.
   The frosting is rebuilt as two layers of milky plastic: the front of the bag over the folded shirt, and over the back
   of the bag where the shirt does not reach; the shirt shows through as it does through the real bag.
   The bag lies a little turned on a Midnight surface: a key light from the upper left, a sheen across the plastic,
   a soft shadow down and to the right, a film grain.
   Writes assets/img/pack-zipper-bag.webp (1600 × 1600) and assets/img/pack-zipper-bag-sm.webp (900 × 900). */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const P = require('./lib/pixels');

const ROOT = path.resolve(__dirname, '..');
const debugDir = (i => (i > 0 ? process.argv[i + 1] : ''))(process.argv.indexOf('--debug'));
if (debugDir) fs.mkdirSync(debugDir, { recursive: true });

// the bag in its photograph (1500 × 2000), below the top it hangs from; the stickers inside it are left out of the print
const BAG = { file: '_reference/packaging/zipper-bag-hanging.jpg', x0: 85, y0: 262, x1: 1345, y1: 1790, stickers: [880, 1540, 1345, 1790], printArea: [480, 850, 980, 1230] };
const PRINT = [110, 154, 172];            // the print's colour over a dark shirt (sampled from zipper-bag-on-shirt.jpg)
const FABRIC = { file: '_reference/garment/flat/16.jpg', crop: { left: 440, top: 210, width: 1240, height: 1230 } };
// the collar, label and tag, with the shirt turned upright (13.jpg turned a quarter clockwise)
const COLLAR = { file: '_reference/garment/flat/13.jpg', crop: { left: 740, top: 0, width: 540, height: 380 }, ring: { x: 804, w: 411, top: 36 } };
const OUT = 1600;
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = hex => [1, 3, 5].map(i => P.LIN[parseInt(hex.slice(i, i + 2), 16)]);
const clamp01 = v => Math.max(0, Math.min(1, v));

// pixels of an image (a file, a buffer or a sharp pipeline), three channels
async function raw(img) { return (typeof img.raw === 'function' ? img : sharp(img)).removeAlpha().raw().toBuffer({ resolveWithObject: true }); }

async function main() {
  /* ---------- the bag: its print and the light across its frosting ---------- */
  const bw = BAG.x1 - BAG.x0, bh = BAG.y1 - BAG.y0, N = bw * bh;
  const { data: rgb } = await raw(sharp(await sharp(path.join(ROOT, BAG.file)).rotate().toBuffer()).extract({ left: BAG.x0, top: BAG.y0, width: bw, height: bh }));
  const L = new Float32Array(N), ink = new Float32Array(N), clean = new Float32Array(N);
  const [sx0, sy0, sx1, sy1] = BAG.stickers;
  for (let i = 0; i < N; i++) {
    const x = i % bw + BAG.x0, y = (i - i % bw) / bw + BAG.y0;
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    L[i] = 0.2126 * P.LIN[r] + 0.7152 * P.LIN[g] + 0.0722 * P.LIN[b];
    const sticker = x >= sx0 && x <= sx1 && y >= sy0 && y <= sy1;
    // the print is the only blue on the bag: how much bluer than grey a pixel is says how much ink it holds
    ink[i] = sticker ? 0 : b - r;
  }
  // the print, from a lightly smoothed blueness so the ink reads solid and the bear's fine hatching holds together
  // … and from how much darker than the frosting around it a pixel is, inside the printed area only (the door
  // behind the photographed bag shows faintly through it, but only ever a little darker)
  const blue = P.blur(ink, bw, bh, 0.6);
  const around = P.blur(L, bw, bh, 9);
  const [px0, py0, px1, py1] = BAG.printArea;
  for (let i = 0; i < N; i++) {
    const x = i % bw + BAG.x0, y = (i - i % bw) / bw + BAG.y0;
    const dark = x >= px0 && x <= px1 && y >= py0 && y <= py1 ? smooth(0.3, 0.62, 1 - L[i] / Math.max(1e-4, around[i])) : 0;
    ink[i] = Math.max(smooth(8, 42, blue[i]), dark);
    clean[i] = ink[i] < 0.04 ? 1 : 0;
  }
  for (let i = 0; i < N; i++) { const x = i % bw + BAG.x0, y = (i - i % bw) / bw + BAG.y0; if (x >= sx0 && x <= sx1 && y >= sy0 && y <= sy1) { ink[i] = 0; clean[i] = 0; } }
  // the frosting's broad light only (the door behind the photographed bag is smoothed away)
  const wsum = P.blur(clean, bw, bh, 70), field = P.blur(L.map((v, i) => v * clean[i]), bw, bh, 70);
  const veil = new Float32Array(N);
  for (let i = 0; i < N; i++) veil[i] = wsum[i] > 0.02 ? field[i] / wsum[i] : 0;
  const ref = P.median(Array.from(veil).filter((v, i) => clean[i] && i % 7 === 0));

  /* ---------- the shirt, folded: its fabric, its collar, label and tag ---------- */
  const fw = Math.round(bw * 0.84), fh = Math.round(bh * 0.76);
  const fx = Math.round((bw - fw) / 2), fy = Math.round(bh * 0.17);
  const fabUp = await sharp(await sharp(path.join(ROOT, FABRIC.file)).rotate().toBuffer()).extract(FABRIC.crop).rotate(90).toBuffer();
  const { data: fab } = await raw(sharp(fabUp).resize(fw, fh, { fit: 'cover' }).blur(0.8));
  const shirtUp = await sharp(await sharp(path.join(ROOT, COLLAR.file)).rotate().toBuffer()).rotate(90).toBuffer();
  const cscale = (fw * 0.31) / COLLAR.ring.w;
  const cw = Math.round(COLLAR.crop.width * cscale), ch = Math.round(COLLAR.crop.height * cscale);
  const { data: col } = await raw(sharp(shirtUp).extract(COLLAR.crop).resize(cw, ch).blur(0.6));
  // where the collar patch is shirt: not the rug (warm and light) — the white tag and label stay
  const cmask = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    const r = col[i * 3], g = col[i * 3 + 1], b = col[i * 3 + 2], lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const sx = (i % cw) / cscale, sy = Math.floor(i / cw) / cscale; // in the photo's pixels
    const rug = (sy < 172 - 0.76 * sx && lum > 58) || (sx > 384 && sy < 24 && lum > 58) || sy < 172 - 0.76 * sx - 18;
    cmask[i] = rug ? 0 : 1;
  }
  const cm = P.blur(cmask, cw, ch, 2.5);
  // the patch fades into the folded fabric at its sides and top
  const cx0 = fx + Math.round(fw / 2 - (COLLAR.ring.x - COLLAR.crop.left + COLLAR.ring.w / 2) * cscale);
  const cy0 = fy - Math.round((COLLAR.ring.top - COLLAR.crop.top) * cscale) + 6;
  // both fabrics brought to one Midnight
  const meanOf = (buf, n, keep) => { const s = [0, 0, 0]; let c = 0; for (let i = 0; i < n; i++) { if (!keep(i)) continue; s[0] += P.LIN[buf[i * 3]]; s[1] += P.LIN[buf[i * 3 + 1]]; s[2] += P.LIN[buf[i * 3 + 2]]; c++; } return s.map(v => v / Math.max(1, c)); };
  const fabMean = meanOf(fab, fw * fh, () => true);
  const colMean = meanOf(col, cw * ch, i => cmask[i] > 0.5 && col[i * 3] < 60);
  const match = fabMean.map((v, k) => v / Math.max(1e-4, colMean[k]));
  const corner = 30, foldEdge = 54;

  // the folded shirt, in the bag's frame: its colour (linear) and how much of it is there
  const shirt = new Float32Array(N * 3), cover = new Float32Array(N);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = y * bw + x, u = x - fx, v = y - fy;
    if (u < -2 || v < -40 || u > fw + 2 || v > fh + 2) continue;
    let c = [0, 0, 0], s = 0;
    if (v > -2) {
      const dx = Math.max(corner - u, u - (fw - corner), 0), dy = Math.max(corner - v, v - (fh - corner), 0);
      s = smooth(1.5, -1.5, Math.hypot(dx, dy) - corner);
      if (s > 0) {
        const j = (Math.max(0, Math.min(fh - 1, v)) * fw + Math.max(0, Math.min(fw - 1, u))) * 3;
        // folded: darker where the fabric turns under at the edges, a soft crease where it is folded in half and where
        // the sides are folded in
        const edge = Math.min(u, v, fw - u, fh - v);
        let shade = 0.6 + 0.4 * smooth(0, foldEdge, edge);
        shade *= 1 - 0.22 * Math.exp(-(((v / fh - 0.56) / 0.025) ** 2));
        shade *= 1 - 0.12 * (Math.exp(-(((u / fw - 0.2) / 0.012) ** 2)) + Math.exp(-(((u / fw - 0.8) / 0.012) ** 2)));
        c = [P.LIN[fab[j]], P.LIN[fab[j + 1]], P.LIN[fab[j + 2]]].map(q => q * shade);
      }
    }
    // the collar, label and tag over the fabric
    const a = x - cx0, b = y - cy0;
    if (a >= 0 && b >= 0 && a < cw && b < ch) {
      const k = b * cw + a;
      const fade = smooth(0, 26, Math.min(a, cw - a)) * smooth(0, 14, b + 14);
      const m = cm[k] * fade;
      if (m > 0) {
        const cc = [0, 1, 2].map(q => P.LIN[col[k * 3 + q]] * (col[k * 3] < 60 ? match[q] : 1));
        c = c.map((q, n) => q * (1 - m) + cc[n] * m);
        s = Math.max(s, m);
      }
    }
    for (let k = 0; k < 3; k++) shirt[i * 3 + k] = c[k];
    cover[i] = s;
  }
  // seen through frosted plastic the folded edges soften, and the fabric's lit side shows a little brighter
  const soft = [0, 1, 2].map(k => P.blur(shirt.filter((_, j) => j % 3 === k), bw, bh, 1.6));
  const coverSoft = P.blur(cover, bw, bh, 3.5);
  for (let i = 0; i < N; i++) { cover[i] = coverSoft[i]; for (let k = 0; k < 3; k++) shirt[i * 3 + k] = soft[k][i] * 1.55; }
  // the shirt's soft shadow on the back of the bag
  const shadow = P.blur(cover, bw, bh, 26);

  /* ---------- the bag, rendered ---------- */
  const milk = lin('#E3EAF2'), surface = lin('#0A1636'), inkLin = PRINT.map(v => P.LIN[v]);
  const bag = Buffer.alloc(N * 4);
  const rand = (() => { let s = 11; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  for (let i = 0; i < N; i++) {
    const x = i % bw, y = (i - x) / bw, lx = x / bw, ly = y / bh;
    const lit = Math.min(1.2, Math.max(0.8, veil[i] / ref));
    // where the shirt presses against the front the plastic clears a little
    const haze = 0.066 * lit * (1 - 0.3 * cover[i]), t = 0.86;
    // behind the front: the back of the bag over the surface (another frosted layer, shaded by the shirt) …
    const back = [0, 1, 2].map(k => (milk[k] * haze * 0.9 + surface[k] * t) * (1 - 0.55 * shadow[i]));
    // … or the folded shirt
    const s = cover[i];
    const behind = [0, 1, 2].map(k => back[k] * (1 - s) + shirt[i * 3 + k] * s);
    let px = [0, 1, 2].map(k => milk[k] * haze + behind[k] * t);
    // the frosting's fine grain
    const grain = (rand() - 0.5) * 0.006;
    px = px.map(q => q + grain);
    // the print, on the outside
    const a = ink[i] * 0.94;
    px = px.map((q, k) => q * (1 - a) + inkLin[k] * a);
    // the zip along the top: a black track and the white pull at its right end
    const zy = bh * 0.028;
    const track = smooth(6.5, 4.5, Math.abs(y - zy));
    const teeth = track * (0.82 + 0.18 * Math.sin(x * 1.4));
    px = px.map(q => q * (1 - teeth) + 0.006 * teeth);
    const pull = smooth(1, -1, Math.max(Math.abs(x - (bw - 58)) - 13, Math.abs(y - zy - 8) - 20));
    px = px.map(q => q * (1 - pull) + 0.72 * pull);
    // the light: brighter to the upper left, a broad sheen and a fine glint across the plastic, lit sealed edges
    const along = lx * 0.62 + ly * 0.38;
    const light = 1.18 - 0.36 * (lx * 0.42 + ly * 0.58);
    const sheen = Math.exp(-(((along - 0.3) / 0.09) ** 2)) * 0.06 + Math.exp(-(((along - 0.47) / 0.012) ** 2)) * 0.03 +
      Math.exp(-(((along - 0.72) / 0.14) ** 2)) * 0.022 + Math.exp(-(((lx * 0.3 + ly * 0.7 - 0.86) / 0.05) ** 2)) * 0.012;
    const seam = smooth(26, 10, Math.min(x, y, bw - x, bh - y)) * 0.035;
    const rim = Math.max(smooth(12, 0, x), smooth(12, 0, y), smooth(bw - 12, bw, x) * 0.45, smooth(bh - 14, bh, y) * 0.5) * 0.05;
    px = px.map(q => q * light + sheen + rim + seam);
    for (let k = 0; k < 3; k++) bag[i * 4 + k] = P.toSrgb(clamp01(px[k]));
    // the outline: square corners rounded a touch, edges anti-aliased
    const ex = Math.min(x + 0.5, bw - x - 0.5), ey = Math.min(y + 0.5, bh - y - 0.5);
    const rr = 8, ox = Math.max(0, rr - ex), oy = Math.max(0, rr - ey);
    bag[i * 4 + 3] = Math.round(255 * smooth(0.5, -0.5, Math.hypot(ox, oy) - rr) * smooth(0, 1, Math.min(ex, ey)));
  }

  /* ---------- the scene ---------- */
  const scale = 1230 / bh, sw = Math.round(bw * scale), shh = Math.round(bh * scale), angle = -7;
  const bagPng = await sharp(bag, { raw: { width: bw, height: bh, channels: 4 } }).resize(sw, shh, { kernel: 'lanczos3' }).png().toBuffer();
  const turned = await sharp(bagPng).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const tm = await sharp(turned).metadata();
  const left = Math.round(OUT / 2 - tm.width / 2 - 8), top = Math.round(OUT / 2 - tm.height / 2 - 10);
  // shadows: the bag's own silhouette, softened, falling away from the light
  const silhouette = async (blur, alpha, dx, dy) => {
    const { data, info } = await sharp(turned).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < info.width * info.height; i++) { data[i * 4] = 0; data[i * 4 + 1] = 1; data[i * 4 + 2] = 6; data[i * 4 + 3] = Math.round(data[i * 4 + 3] * alpha); }
    const shape = await sharp(data, { raw: info }).png().toBuffer();
    const placed = await sharp({ create: { width: OUT, height: OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: shape, left: left + dx, top: top + dy }]).png().toBuffer();
    return sharp(placed).blur(blur).png().toBuffer();
  };
  const far = await silhouette(52, 0.85, 40, 60), near = await silhouette(8, 0.6, 7, 11);

  // the surface: Midnight, a pool of light to the upper left, falling into shadow at the edges
  const bg = Buffer.alloc(OUT * OUT * 3);
  const deep = lin('#02060F'), mid = lin('#0A1A42'), glow = lin('#3359A8');
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    const u = x / OUT, v = y / OUT;
    const key = Math.exp(-(((u - 0.26) ** 2) / 0.08 + ((v - 0.16) ** 2) / 0.06));
    const vign = Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 1.55);
    const col = mid.map((m, k) => m * (1 - vign) + deep[k] * vign + glow[k] * key * 0.3);
    const o = (y * OUT + x) * 3;
    for (let k = 0; k < 3; k++) bg[o + k] = Math.max(0, Math.min(255, P.toSrgb(col[k]) + (rand() - 0.5) * 5));
  }
  const scene = await sharp(bg, { raw: { width: OUT, height: OUT, channels: 3 } })
    .composite([
      { input: far, left: 0, top: 0 },
      { input: near, left: 0, top: 0 },
      { input: turned, left, top },
    ]).png().toBuffer();
  // film: a last grain over everything, the corners a shade darker
  const { data: fin, info } = await raw(scene);
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    const o = (y * OUT + x) * 3, d = Math.hypot(x / OUT - 0.5, y / OUT - 0.5);
    const dim = 1 - Math.max(0, d - 0.4) * 0.85;
    for (let k = 0; k < 3; k++) fin[o + k] = Math.max(0, Math.min(255, fin[o + k] * dim + (rand() - 0.5) * 4));
  }
  const final = sharp(fin, { raw: info });
  const outDir = path.join(ROOT, 'assets', 'img');
  await final.clone().webp({ quality: 88, effort: 6, smartSubsample: true }).toFile(path.join(outDir, 'pack-zipper-bag.webp'));
  await final.clone().resize(900, 900, { kernel: 'lanczos3' }).webp({ quality: 86, effort: 6 }).toFile(path.join(outDir, 'pack-zipper-bag-sm.webp'));
  console.log(`bag ${bw}×${bh}, folded shirt ${fw}×${fh}, collar patch ${cw}×${ch}; wrote assets/img/pack-zipper-bag.webp`);
  if (debugDir) await final.clone().jpeg({ quality: 90 }).toFile(path.join(debugDir, 'packaging.jpg'));
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
