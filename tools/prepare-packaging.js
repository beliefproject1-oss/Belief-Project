/* Belief Project — the packaging picture: two frosted zipper bags lying on a stone surface in daylight, an Ice Blue
   shirt folded in one and a Midnight shirt in the other, shot from above like a product flat lay.

     node tools/prepare-packaging.js [--debug <folder>]

   What is in it comes from the photographs supplied:
     the bag    — _reference/packaging/zipper-bag-hanging.jpg: its shape and proportions and its print, lifted off the
                  photo. The print keeps the light blue it has on the bag (_reference/packaging/zipper-bag-on-shirt.jpg),
                  where its black zip, white pull and the two vent holes near its foot also show;
     the shirts — Midnight: the ribbed fabric of _reference/garment/flat/16.jpg with the collar, woven label and hang tag
                  of 15.jpg; Ice Blue: the cable-ribbed fabric of 24.jpg with the collar, label and tag of 22.jpg.
   Each shirt is folded the way shirts are packed (sides and sleeves under, the collar at the top) and seen through
   the bag's two layers of milky film, which soften it; where the shirt does not reach, the film shows the stone
   through both layers. The film is loose near the edges, so it catches the light in soft creases; its sides and foot
   are heat-sealed. The light comes from the upper left; each bag casts a soft shadow down and to the right.
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
const PRINT = [110, 154, 172]; // the print's light blue, as it shows on the bag lying flat
// a folded shirt: its fabric (a flat stretch of the body) and its collar patch (the collar, woven label and hang tag,
// seen from the front). ring: where the collar ring runs across the photo; plain: a stretch of plain fabric in it, to
// bring the body fabric to the same colour; feather: how softly the patch fades at its left, top, right and bottom
const SHIRTS = {
  midnight: {
    fabric: { file: '_reference/garment/flat/16.jpg', crop: { left: 530, top: 260, width: 1090, height: 1060 }, turn: 90 },
    collar: { file: '_reference/garment/flat/15.jpg', crop: { left: 0, top: 642, width: 1150, height: 1010 }, ring: [36, 1105], plain: [900, 1300, 1140, 1640], feather: [8, 2, 40, 60],
      // the orange rug the shirt lay on, around the top of the collar and down the photo's left edge
      floor: (r, g, b, x, y) => (y < 800 || x < 90) && (r - b > 12 || r + g + b > 300) },
    fleck: (r, g, b) => r - b > 14 || r + g + b > 300,
  },
  'ice-blue': {
    fabric: { file: '_reference/garment/flat/24.jpg', crop: { left: 12, top: 580, width: 380, height: 910 }, mirror: 3 },
    collar: { file: '_reference/garment/flat/22.jpg', crop: { left: 120, top: 576, width: 845, height: 700 }, ring: [277, 807], plain: [700, 900, 950, 1260], feather: [40, 2, 40, 60],
      // the terrazzo floor: warm stone and its dark chips, above the shoulders (the black woven label is spared)
      floor: (r, g, b, x, y) => y < 705 && !(x > 370 && x < 650 && y > 665) && (r - b > -3 || r + g + b < 380) },
    fleck: (r, g, b) => r - b > 8,
  },
};
// the scene: back to front; centres and the bag's height in pixels of the 1600 × 1600 picture, turn in degrees
const OUT = 1600, BAG_H = 980;
const LAYOUT = [
  { shirt: 'ice-blue', cx: 612, cy: 636, angle: -15 },
  { shirt: 'midnight', cx: 1000, cy: 968, angle: 6 },
];
const LIGHT = [-0.56, -0.83]; // where the light comes from (upper left), in the picture

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = v => Math.max(0, Math.min(1, v));
const lin = hex => [1, 3, 5].map(i => P.LIN[parseInt(hex.slice(i, i + 2), 16)]);
const rand = (() => { let s = 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();

async function raw(img) { return (typeof img.raw === 'function' ? img : sharp(img)).removeAlpha().raw().toBuffer({ resolveWithObject: true }); }
const upright = async file => sharp(await sharp(path.join(ROOT, file)).rotate().toBuffer());

// smooth value noise, about one bump per `size` pixels, in [-1, 1]
function noise(seed) {
  const h = (x, y) => { let n = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296 * 2 - 1; };
  return (x, y, size) => {
    const u = x / size, v = y / size, x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(x0, y0), b = h(x0 + 1, y0), c = h(x0, y0 + 1), d = h(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// a value from a map (one or three channels), bilinear; 0 outside it
function sample(map, w, h, x, y, ch = 1, k = 0) {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 0;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0;
  const at = (xx, yy) => map[(yy * w + xx) * ch + k];
  return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy) + (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy;
}

/* ---------- the bag's print, lifted off the photograph ---------- */
async function bagPrint() {
  const bw = BAG.x1 - BAG.x0, bh = BAG.y1 - BAG.y0, N = bw * bh;
  const { data: rgb } = await raw((await upright(BAG.file)).extract({ left: BAG.x0, top: BAG.y0, width: bw, height: bh }));
  const L = new Float32Array(N), ink = new Float32Array(N);
  const [sx0, sy0, sx1, sy1] = BAG.stickers, [px0, py0, px1, py1] = BAG.printArea;
  const inSticker = i => { const x = i % bw + BAG.x0, y = (i - i % bw) / bw + BAG.y0; return x >= sx0 && x <= sx1 && y >= sy0 && y <= sy1; };
  for (let i = 0; i < N; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    L[i] = 0.2126 * P.LIN[r] + 0.7152 * P.LIN[g] + 0.0722 * P.LIN[b];
    // the print is the only blue on the bag: how much bluer than grey a pixel is says how much ink it holds
    ink[i] = inSticker(i) ? 0 : b - r;
  }
  // from a lightly smoothed blueness, so the ink reads solid and the bear's fine hatching holds together, and inside
  // the printed area from how much darker than the frosting around it a pixel is
  const blue = P.blur(ink, bw, bh, 0.6), around = P.blur(L, bw, bh, 9);
  for (let i = 0; i < N; i++) {
    const x = i % bw + BAG.x0, y = (i - i % bw) / bw + BAG.y0;
    const dark = x >= px0 && x <= px1 && y >= py0 && y <= py1 ? smooth(0.3, 0.62, 1 - L[i] / Math.max(1e-4, around[i])) : 0;
    ink[i] = inSticker(i) ? 0 : Math.max(smooth(8, 42, blue[i]), dark);
  }
  return { bw, bh, ink };
}

/* ---------- a shirt, folded ---------- */
async function foldedShirt(def, fw, fh) {
  // the body fabric, filling the fold
  let fab = await upright(def.fabric.file);
  fab = sharp(await fab.extract(def.fabric.crop).toBuffer());
  if (def.fabric.turn) fab = sharp(await fab.rotate(def.fabric.turn).toBuffer());
  if (def.fabric.mirror) {
    // a narrow strip of a ribbed knit, repeated side by side, mirrored so the ribs run on without a seam
    const strip = await fab.png().toBuffer(), flip = await sharp(strip).flop().png().toBuffer();
    const { width: w, height: h } = await sharp(strip).metadata();
    fab = sharp(await sharp({ create: { width: w * def.fabric.mirror, height: h, channels: 3, background: '#000' } })
      .composite(Array.from({ length: def.fabric.mirror }, (_, k) => ({ input: k % 2 ? flip : strip, left: k * w, top: 0 }))).png().toBuffer());
  }
  const { data: base } = await raw(fab.resize(fw, fh, { fit: 'cover' }));
  // any fleck of the floor left in the fabric takes the fabric's own colour
  {
    const keep = [0, 0, 0]; let n = 0;
    const stray = i => def.fleck(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
    for (let i = 0; i < fw * fh; i++) if (!stray(i)) { for (let k = 0; k < 3; k++) keep[k] += base[i * 3 + k]; n++; }
    const fill = keep.map(v => Math.round(v / Math.max(1, n)));
    let flecks = 0;
    for (let i = 0; i < fw * fh; i++) if (stray(i)) { for (let k = 0; k < 3; k++) base[i * 3 + k] = fill[k]; flecks++; }
    if (debugDir) console.log('fabric flecks replaced:', flecks);
  }

  // the collar patch: the collar ring half as wide as the fold
  const C = def.collar, scale = (fw * 0.46) / (C.ring[1] - C.ring[0]);
  const cw = Math.round(C.crop.width * scale), ch = Math.round(C.crop.height * scale);
  const { data: col } = await raw((await upright(C.file)).extract(C.crop).resize(cw, ch, { kernel: 'lanczos3' }));
  const cx0 = Math.round(fw / 2 - ((C.ring[0] + C.ring[1]) / 2 - C.crop.left) * scale), cy0 = 0;
  // the floor the shirt was photographed on is left out of the patch (the folded fabric shows instead)
  const floorRaw = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) floorRaw[i] = C.floor(col[i * 3], col[i * 3 + 1], col[i * 3 + 2], (i % cw) / scale + C.crop.left, Math.floor(i / cw) / scale + C.crop.top) ? 1 : 0;
  // a chip of floor is never alone: grow the mask a little and soften it
  const floor = P.blur(P.blur(floorRaw, cw, ch, 3).map((v, i) => (v > 0.12 || floorRaw[i] ? 1 : 0)), cw, ch, 1.6).map((v, i) => Math.max(v, floorRaw[i]));

  // the body fabric brought to the colour of the collar patch's own plain fabric
  const mean = (buf, w, box) => {
    const s = [0, 0, 0]; let n = 0;
    for (let y = box[1]; y < box[3]; y++) for (let x = box[0]; x < box[2]; x++) { const j = (y * w + x) * 3; for (let k = 0; k < 3; k++) s[k] += P.LIN[buf[j + k]]; n++; }
    return s.map(v => v / Math.max(1, n));
  };
  const plain = mean(col, cw, C.plain.map((v, k) => Math.round((v - (k % 2 ? C.crop.top : C.crop.left)) * scale)));
  const body = mean(base, fw, [0, 0, fw, fh]);
  const match = plain.map((v, k) => v / Math.max(1e-4, body[k]));

  const N = fw * fh, rgb = new Float32Array(N * 3), cover = new Float32Array(N);
  const radius = fw * 0.05, turnUnder = fw * 0.055;
  const [fl, ft, fr, fb] = C.feather.map(v => v * scale / 0.5);
  const wob = noise(fw + fh);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = y * fw + x;
    // the outline: the shoulders fall a little away from the collar; corners rounded where the fabric turns under;
    // the folded edges are never quite straight
    const top = fh * 0.028 * smooth(0.24, 0.5, Math.abs(x / fw - 0.5));
    const wx = fw * 0.006 * wob(x, y, 160), wy = fw * 0.006 * wob(x + 999, y, 160);
    const dx = Math.max(radius - x - wx, x + wx - (fw - radius), 0), dy = Math.max(radius + top - y - wy, y + wy - (fh - radius), 0);
    const s = smooth(1.2, -1.2, Math.hypot(dx, dy) - radius);
    if (s <= 0) continue;
    // folded: darker where the fabric turns under at the edges, a soft crease where it is folded across, the middle
    // lifted a touch towards the light
    const edge = Math.min(x, y - top, fw - x, fh - y);
    let shade = 0.58 + 0.42 * smooth(0, turnUnder, edge);
    const fold = (y / fh - 0.58) / 0.018;
    shade *= 1 - 0.14 * Math.exp(-fold * fold) + 0.05 * Math.exp(-((fold + 1.6) ** 2));
    shade *= 1.04 - 0.08 * Math.hypot(x / fw - 0.42, y / fh - 0.4);
    let c = [0, 1, 2].map(k => P.LIN[base[i * 3 + k]] * match[k] * shade);
    // the collar, label and tag over it
    const a = x - cx0, b = y - cy0;
    if (a >= 0 && b >= 0 && a < cw && b < ch) {
      const m = smooth(0, fl, a) * smooth(0, fr, cw - a) * smooth(0, ft, b) * smooth(0, fb, ch - b) * (1 - floor[b * cw + a]);
      if (m > 0) {
        const k = (b * cw + a) * 3;
        const shadeC = 0.58 + 0.42 * smooth(0, turnUnder, Math.min(x, fw - x)); // the patch turns under at the sides too
        c = c.map((q, n) => q * (1 - m) + P.LIN[col[k + n]] * shadeC * m);
      }
    }
    for (let k = 0; k < 3; k++) rgb[i * 3 + k] = c[k];
    cover[i] = s;
  }
  return { rgb, cover };
}

/* ---------- one bag with its shirt, as maps at the size it is drawn ---------- */
async function bagMaps(print, shirtName) {
  const { bw, bh } = print;
  const fw = Math.round(bw * 0.8), fh = Math.round(bh * 0.78), fx = Math.round((bw - fw) / 2), fy = Math.round(bh * 0.12);
  const shirt = await foldedShirt(SHIRTS[shirtName], fw, fh);
  // into the bag's frame, then down to the size the bag is drawn at (prefiltered, so the ribs and the print stay clean)
  const sw = Math.round(bw * BAG_H / bh), sh = BAG_H;
  const toImg = (n, f) => { const b = Buffer.alloc(bw * bh * 4); for (let i = 0; i < bw * bh; i++) { const v = f(i); for (let k = 0; k < 4; k++) b[i * 4 + k] = v[k]; } return sharp(b, { raw: { width: bw, height: bh, channels: 4 } }); };
  const shirtImg = toImg(4, i => {
    const x = i % bw - fx, y = Math.floor(i / bw) - fy;
    if (x < 0 || y < 0 || x >= fw || y >= fh) return [0, 0, 0, 0];
    const j = y * fw + x, a = shirt.cover[j];
    return [0, 1, 2].map(k => P.toSrgb(clamp01(shirt.rgb[j * 3 + k]))).concat(Math.round(a * 255));
  });
  const { data: sd } = await shirtImg.resize(sw, sh, { kernel: 'lanczos3' }).blur(1.25).raw().toBuffer({ resolveWithObject: true });
  const inkImg = toImg(4, i => { const v = Math.round(print.ink[i] * 255); return [v, v, v, 255]; });
  const { data: id } = await inkImg.resize(sw, sh, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const n = sw * sh, srgb = new Float32Array(n * 3), cover = new Float32Array(n), ink = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = sd[i * 4 + 3] / 255;
    cover[i] = a;
    for (let k = 0; k < 3; k++) srgb[i * 3 + k] = a > 0.01 ? P.LIN[sd[i * 4 + k]] : 0;
    ink[i] = id[i * 4] / 255;
  }
  return { sw, sh, shirt: srgb, cover, ink };
}

/* ---------- the stone surface, lit from the upper left ---------- */
function surface() {
  const N = OUT * OUT, out = new Float32Array(N * 3);
  const n1 = noise(3), n2 = noise(5), n3 = noise(9), n4 = noise(13);
  const stone = lin('#9C9893'), warm = lin('#A19A91'), cool = lin('#979696');
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    const i = y * OUT + x, u = x / OUT, v = y / OUT;
    const tone = n1(x, y, 420);
    const mott = 0.06 * n2(x, y, 150) + 0.035 * n3(x, y, 46) + 0.02 * n4(x, y, 11) + (rand() - 0.5) * 0.05;
    // daylight from a window to the upper left, falling off across the stone
    const light = 1.12 - 0.3 * (0.55 * u + 0.45 * v) + 0.1 * Math.exp(-(((u - 0.1) ** 2) / 0.12 + ((v - 0.05) ** 2) / 0.1));
    for (let k = 0; k < 3; k++) {
      const c = stone[k] + (tone > 0 ? (warm[k] - stone[k]) * tone : (stone[k] - cool[k]) * tone);
      out[i * 3 + k] = c * (1 + mott) * light;
    }
  }
  // pores and specks of aggregate
  for (let p = 0; p < 2600; p++) {
    const px = rand() * OUT, py = rand() * OUT, r = 0.6 + rand() * 1.6, dark = 0.18 + rand() * 0.3, light = rand() < 0.25;
    for (let y = Math.floor(py - r - 1); y <= py + r + 1; y++) for (let x = Math.floor(px - r - 1); x <= px + r + 1; x++) {
      if (x < 0 || y < 0 || x >= OUT || y >= OUT) continue;
      const m = smooth(r + 0.8, r - 0.4, Math.hypot(x - px, y - py)) * dark, i = y * OUT + x;
      for (let k = 0; k < 3; k++) out[i * 3 + k] *= light ? 1 + m * 0.5 : 1 - m;
    }
  }
  return out;
}

/* ---------- a bag laid on the scene ---------- */
function layBag(scene, bag, at) {
  const { sw, sh } = bag, N = OUT * OUT;
  const th = at.angle * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
  // where each pixel of the picture falls on the bag
  const local = (x, y) => { const dx = x - at.cx, dy = y - at.cy; return [cos * dx + sin * dy + sw / 2, -sin * dx + cos * dy + sh / 2]; };
  const radius = 5;
  const outline = (u, v) => {
    const ex = Math.min(u, sw - u), ey = Math.min(v, sh - v);
    if (ex < -1 || ey < -1) return 0;
    const ox = Math.max(0, radius - ex), oy = Math.max(0, radius - ey);
    return smooth(0.6, -0.6, Math.hypot(ox, oy) - radius) * smooth(-0.5, 0.7, Math.min(ex, ey));
  };

  // 1. its shadow: the bag barely lifts off the stone, the folded shirt in it a little more
  const mass = new Float32Array(N);
  const [bx0, by0, bx1, by1] = (() => { const r = Math.hypot(sw, sh) / 2 + 4; return [Math.max(0, at.cx - r), Math.max(0, at.cy - r), Math.min(OUT - 1, at.cx + r), Math.min(OUT - 1, at.cy + r)].map(Math.round); })();
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const [u, v] = local(x, y), a = outline(u, v);
    if (a > 0) mass[y * OUT + x] = a * (0.45 + 0.55 * sample(bag.cover, sw, sh, u, v));
  }
  const near = P.blur(mass, OUT, OUT, 5), far = P.blur(mass, OUT, OUT, 26);
  const shift = (map, d) => (x, y) => { const xx = Math.round(x + LIGHT[0] * -d), yy = Math.round(y + LIGHT[1] * -d); return xx >= 0 && yy >= 0 && xx < OUT && yy < OUT ? map[yy * OUT + xx] : 0; };
  const nearAt = shift(near, 6), farAt = shift(far, 22);
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    const s = 0.34 * nearAt(x, y) + 0.3 * farAt(x, y);
    if (s > 0.001) { const i = y * OUT + x; for (let k = 0; k < 3; k++) scene[i * 3 + k] *= 1 - s; }
  }

  // 2. the film's loose creases near its edges (a soft height field; flat where the shirt presses it down)
  const cr = noise(21 + at.cx), cr2 = noise(41 + at.cy);
  const height = (u, v) => {
    const edge = Math.min(u, v, sw - u, sh - v) / sw;
    const loose = 0.35 + 0.65 * smooth(0.16, 0.02, edge);
    return (cr(u, v, 210) * 0.75 + cr2(u * 0.7, v * 1.4, 95) * 0.25) * loose * (1 - 0.75 * sample(bag.cover, sw, sh, u, v));
  };

  // 3. the bag itself
  const W = lin('#F4F6F8'), ink = PRINT.map(v => P.LIN[v]), zipC = lin('#16181C'), pullC = lin('#F2F2F0');
  const seal = sw * 0.016, zipTop = sh * 0.02, zipBot = sh * 0.0305;
  const holes = [[sw * 0.085, sh * 0.958], [sw * 0.915, sh * 0.958]], holeR = sw * 0.0075;
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const [u, v] = local(x, y), alpha = outline(u, v);
    if (alpha <= 0) continue;
    const i = y * OUT + x;
    const under = [scene[i * 3], scene[i * 3 + 1], scene[i * 3 + 2]];
    const lx = u / sw, ly = v / sh;
    const lit = 1.06 - 0.16 * (0.55 * lx + 0.45 * ly);
    // a vent hole goes through both layers: the stone shows, ringed by a bright cut edge
    const hd = Math.min(...holes.map(([hx, hy]) => Math.hypot(u - hx, v - hy)));
    // the back layer on the stone, the shirt, the front layer
    const s = sample(bag.cover, sw, sh, u, v);
    const aBack = 0.34, aFront = 0.19 + 0.07 * (1 - s);
    let px = under.map((q, k) => q * (1 - aBack) + W[k] * aBack * lit);
    if (s > 0) px = px.map((q, k) => q * (1 - s) + sample(bag.shirt, sw, sh, u, v, 3, k) * s * (lit * 1.05));
    px = px.map((q, k) => q * (1 - aFront) + W[k] * aFront * lit);
    // sealed sides and foot: the two layers fused, whiter, with a fine line where the seal ends
    const sd = Math.min(u, sw - u, sh - v);
    const sealBand = smooth(seal + 1, seal - 1, sd);
    const sealLine = Math.exp(-(((sd - seal) / 0.9) ** 2));
    px = px.map((q, k) => q * (1 - 0.3 * sealBand) + W[k] * 0.3 * sealBand * lit + 0.035 * sealLine);
    // light on the film: a broad sheen and the creases catching it
    const e = 2, hc = height(u, v), gx = (height(u + e, v) - hc) / e, gy = (height(u, v + e) - hc) / e;
    const facing = -(gx * LIGHT[0] + gy * LIGHT[1]) * 30;
    const along = lx * 0.6 + ly * 0.4;
    const sheen = 0.05 * Math.exp(-(((along - 0.34) / 0.12) ** 2)) + 0.02 * Math.exp(-(((along - 0.62) / 0.05) ** 2));
    px = px.map(q => q * (1 + 0.32 * Math.max(-0.3, Math.min(0.5, facing))) + sheen + 0.035 * Math.max(0, facing - 0.2));
    // the print, on the outside
    const a = sample(bag.ink, sw, sh, u, v) * 0.95;
    if (a > 0) px = px.map((q, k) => q * (1 - a) + ink[k] * a * lit);
    // the zip along the top, its white pull at the right end
    const track = smooth(zipTop - 0.8, zipTop + 0.6, v) * smooth(zipBot + 0.8, zipBot - 0.6, v);
    if (track > 0) {
      const teeth = 0.75 + 0.25 * Math.sin(u * 2.2);
      px = px.map((q, k) => q * (1 - track) + zipC[k] * teeth * track + 0.05 * track * Math.exp(-(((v - zipTop - 1.2) / 0.8) ** 2)));
    }
    const pw = sw * 0.026, ph = sh * 0.03, pcx = sw - sw * 0.05, pcy = (zipTop + zipBot) / 2 + ph * 0.2;
    const pull = smooth(1, -1, Math.hypot(Math.max(0, Math.abs(u - pcx) - pw / 2 + 3), Math.max(0, Math.abs(v - pcy) - ph / 2 + 3)) - 3);
    if (pull > 0) px = px.map((q, k) => q * (1 - pull) + pullC[k] * pull * (lit + 0.05 * (1 - (v - pcy + ph / 2) / ph)));
    if (hd < holeR + 1.5) {
      const hole = smooth(holeR + 0.6, holeR - 0.6, hd), ring = Math.exp(-(((hd - holeR - 0.4) / 0.7) ** 2));
      px = px.map((q, k) => q * (1 - hole) + under[k] * hole + 0.12 * ring);
    }
    // the cut edge: lit on the side facing the light, a fine dark line on the other
    const ex = Math.min(u, sw - u, v, sh - v);
    const rim = Math.exp(-((ex / 1.1) ** 2));
    const facingEdge = (u < sw / 2 ? -LIGHT[0] * (u < 8 ? 1 : 0) : 0) + (v < sh / 2 ? -LIGHT[1] * (v < 8 ? 1 : 0) : 0);
    px = px.map(q => q + rim * (facingEdge > 0 ? 0.12 : -0.05));
    for (let k = 0; k < 3; k++) scene[i * 3 + k] = under[k] * (1 - alpha) + px[k] * alpha;
  }
}

async function main() {
  const print = await bagPrint();
  const scene = surface();
  for (const at of LAYOUT) layBag(scene, await bagMaps(print, at.shirt), at);
  // a last soft fall-off to the corners and a fine grain, as a photograph has
  const out = Buffer.alloc(OUT * OUT * 3);
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    const i = y * OUT + x, d = Math.hypot(x / OUT - 0.46, y / OUT - 0.44);
    const dim = 1 - Math.max(0, d - 0.42) * 0.7;
    for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.max(0, Math.min(255, P.toSrgb(clamp01(scene[i * 3 + k] * dim)) + (rand() - 0.5) * 3));
  }
  const img = sharp(out, { raw: { width: OUT, height: OUT, channels: 3 } });
  const dir = path.join(ROOT, 'assets', 'img');
  await img.clone().webp({ quality: 88, effort: 6, smartSubsample: true }).toFile(path.join(dir, 'pack-zipper-bag.webp'));
  await img.clone().resize(900, 900, { kernel: 'lanczos3' }).webp({ quality: 86, effort: 6 }).toFile(path.join(dir, 'pack-zipper-bag-sm.webp'));
  if (debugDir) await img.clone().jpeg({ quality: 90 }).toFile(path.join(debugDir, 'packaging.jpg'));
  console.log('wrote assets/img/pack-zipper-bag.webp and -sm.webp');
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
