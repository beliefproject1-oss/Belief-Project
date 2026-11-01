/* Belief Project — studio garment: the models.
   The studio shows each colour on its own model, photographed from behind in the real shirt
   (studio.config.js, stages). For every stage this script:
     1. writes the photograph the page shows, at the frame's shape, in a few widths:
        assets/studio/model-<colour>-<width>.webp,
     2. measures the shirt's fabric on the back panel — how bright it is from place to place (its light, its folds,
        its knit) — and saves it in tools/.cache/stage-<colour>.bin for prepare-designs.js, which prints the artwork
        onto that fabric so it is lit and textured like the shirt in the photograph.

     node tools/prepare-garment.js [--debug <folder>]

   Run it, then prepare-designs.js, whenever a model photograph or a stage's settings change. */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const P = require('./lib/pixels');
const S = require('./studio.config');

const ROOT = path.resolve(__dirname, '..');
const debugDir = (i => (i > 0 ? process.argv[i + 1] : ''))(process.argv.indexOf('--debug'));
if (debugDir) fs.mkdirSync(debugDir, { recursive: true });

// 1 inside the polygon, 0 outside (even-odd scanline fill)
function polygonMask(pts, w, h) {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + (yc - y0) / (y1 - y0) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x < Math.min(w, xs[k + 1] - 0.5); x++) m[y * w + x] = 1;
  }
  return m;
}

async function stage(st) {
  const { w, h } = S.frame;
  const src = path.join(ROOT, st.source);
  // the photograph at the frame's shape: what the page shows, and what the print is measured against
  const frame = await sharp(src).rotate().resize(w, h, { fit: 'cover', kernel: 'lanczos3' }).removeAlpha();
  const outDir = path.join(ROOT, S.out.dir);
  fs.mkdirSync(outDir, { recursive: true });
  for (const width of S.widths) {
    await frame.clone().resize({ width, kernel: 'lanczos3' }).webp({ quality: 84, effort: 6, smartSubsample: true })
      .toFile(path.join(outDir, `model-${st.id}-${width}.webp`));
  }
  const { data: rgb } = await frame.clone().raw().toBuffer({ resolveWithObject: true });

  // brightness of the fabric, in linear light, relative to the back panel's typical brightness
  const N = w * h, lum = new Float32Array(N);
  for (let i = 0; i < N; i++) lum[i] = 0.2126 * P.LIN[rgb[i * 3]] + 0.7152 * P.LIN[rgb[i * 3 + 1]] + 0.0722 * P.LIN[rgb[i * 3 + 2]];
  const body = polygonMask(st.body, w, h);
  const inside = [];
  for (let i = 0; i < N; i++) if (body[i]) inside.push(lum[i]);
  const ref = Math.max(1e-4, P.median(inside));
  // a touch of smoothing takes the camera's noise out of the dark fabric, but keeps the knit
  const soft = P.blur(lum, w, h, 0.8);
  const shade = new Float32Array(N);
  for (let i = 0; i < N; i++) shade[i] = Math.min(4, Math.max(0.02, soft[i] / ref));

  // tools/.cache/stage-<id>.bin: width, height, then the shade (float32) and the back panel (uint8)
  const cache = path.join(__dirname, '.cache');
  fs.mkdirSync(cache, { recursive: true });
  const head = Buffer.from(new Float32Array([w, h, ref]).buffer);
  fs.writeFileSync(path.join(cache, `stage-${st.id}.bin`), Buffer.concat([head, Buffer.from(shade.buffer), Buffer.from(body)]));
  console.log(`${st.id}: back panel ${inside.length} px, fabric brightness ${ref.toFixed(4)} (linear)`);

  if (debugDir) {
    // the photograph with the back panel and the print area marked
    const pr = st.print;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<polygon points="${st.body.map(p => p.join(',')).join(' ')}" fill="rgba(255,0,255,.18)" stroke="#f0f" stroke-width="2"/>` +
      `<rect x="${pr.centerX - pr.width / 2}" y="${pr.top}" width="${pr.width}" height="${pr.height}" fill="none" stroke="#0f0" stroke-width="2" stroke-dasharray="8 6"/>` +
      `<rect x="${st.view.x}" y="${st.view.y}" width="${st.view.w}" height="${st.view.h}" fill="none" stroke="#ff0" stroke-width="2"/></svg>`;
    await frame.clone().composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toFile(path.join(debugDir, `stage-${st.id}.jpg`));
  }
}

async function main() {
  for (const st of S.stages) await stage(st);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { polygonMask };
