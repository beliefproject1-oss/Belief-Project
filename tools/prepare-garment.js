/* Belief Project — studio garment.
   Turns the photograph of the back of the shirt (_reference/garment/midnight-back.heic) into the two
   garments the studio shows: the shirt cut out of the wall and the hanger, in Midnight and in Ice Blue.
   Both are built from the same photograph, so the print sits on exactly the same fabric in either colour.

     node tools/prepare-garment.js [--debug <folder>]

   Writes assets/studio/shirt-<colour>-<width>.webp, assets/studio/shirt-shadow.webp and the fabric data
   tools/.cache/fabric.bin that prepare-designs.js uses to print the artwork onto the shirt. */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const heic = require('heic-convert');
const P = require('./lib/pixels');
const S = require('./studio.config');

const ROOT = path.resolve(__dirname, '..');
const debugDir = (i => (i > 0 ? process.argv[i + 1] : ''))(process.argv.indexOf('--debug'));
if (debugDir) fs.mkdirSync(debugDir, { recursive: true });

async function loadFrame() {
  const src = path.join(ROOT, S.garment.source);
  let buf = fs.readFileSync(src);
  if (/\.hei[cf]$/i.test(src)) buf = Buffer.from(await heic({ buffer: buf, format: 'JPEG', quality: 0.97 }));
  const { w, h } = S.frame;
  const { data } = await sharp(buf).rotate().resize(w, h, { fit: 'cover', kernel: 'lanczos3' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

async function dbg(name, w, h, channels, data) {
  if (!debugDir) return;
  fs.mkdirSync(debugDir, { recursive: true });
  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels } }).png().toFile(path.join(debugDir, name));
}

(async () => {
  const { w, h } = S.frame;
  const N = w * h;
  const rgb = await loadFrame();

  // linear luminance and how warm (wall, hanger) or cool (the navy shirt) each pixel is
  const L = new Float32Array(N);
  const warm = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    L[i] = 0.2126 * P.LIN[r] + 0.7152 * P.LIN[g] + 0.0722 * P.LIN[b];
    warm[i] = r - b;
  }

  // ---- the shirt: everything the wall cannot reach from the edge of the photo ----
  // wall and hanger are warm and lighter than the shirt; the shirt is dark and neutral to cool
  const G = S.garment.matte;
  const pass = new Uint8Array(N);
  for (let i = 0; i < N; i++) pass[i] = (warm[i] > G.warmMin && L[i] > G.warmLumMin) || L[i] > G.brightMin ? 1 : 0;
  const bg = P.flood(pass, w, h, P.borderSeeds(w, h));
  let shirt = new Uint8Array(N);
  for (let i = 0; i < N; i++) shirt[i] = bg[i] ? 0 : 1;
  // wall seen through the hole in the hanger is shut in by the hanger's dark rim: warm enclosed patches are wall too
  {
    const enclosed = new Uint8Array(N);
    for (let i = 0; i < N; i++) enclosed[i] = shirt[i] && pass[i] ? 1 : 0;
    const ec = P.components(enclosed, w, h);
    const sum = new Float64Array(ec.sizes.length);
    for (let i = 0; i < N; i++) if (ec.labels[i]) sum[ec.labels[i]] += warm[i];
    for (let i = 0; i < N; i++) { const k = ec.labels[i]; if (k && sum[k] / ec.sizes[k] > G.wallWarm) shirt[i] = 0; }
  }
  // keep the shirt itself (the largest piece), not specks of the socket on the wall
  const cc = P.components(shirt, w, h);
  let best = 1;
  for (let k = 2; k < cc.sizes.length; k++) if (cc.sizes[k] > cc.sizes[best]) best = k;
  for (let i = 0; i < N; i++) shirt[i] = cc.labels[i] === best ? 1 : 0;
  // open the outline: anything thinner than the fabric (the rim of the hanger above the collar) falls away
  {
    const r = G.open;
    const out0 = shirt.map(v => 1 - v);
    const inner = P.distanceTo(out0, w, h, r + 1).map(d => (d > r ? 1 : 0));
    const back = P.distanceTo(inner, w, h, r + 1);
    for (let i = 0; i < N; i++) shirt[i] = shirt[i] && back[i] <= r ? 1 : 0;
    const again = P.components(shirt, w, h);
    let top = 1;
    for (let k = 2; k < again.sizes.length; k++) if (again.sizes[k] > again.sizes[top]) top = k;
    for (let i = 0; i < N; i++) shirt[i] = again.labels[i] === top ? 1 : 0;
    // and smooth it: blur and re-threshold
    const f = P.blur(Float32Array.from(shirt), w, h, 1.6);
    for (let i = 0; i < N; i++) shirt[i] = f[i] > 0.5 ? 1 : 0;
  }
  const alpha = P.blur(Float32Array.from(shirt), w, h, 0.75);

  // distance inwards from the outline, so edge pixels can take their colour from the fabric next to them
  const outside = new Uint8Array(N);
  for (let i = 0; i < N; i++) outside[i] = shirt[i] ? 0 : 1;
  const depth = P.distanceTo(outside, w, h, 6);
  const core = new Float32Array(N);
  for (let i = 0; i < N; i++) core[i] = depth[i] >= 3 ? 1 : 0;
  const coreL = P.blur(L.map((v, i) => v * core[i]), w, h, 2.5);
  const coreW = P.blur(core, w, h, 2.5);
  const Lf = new Float32Array(N);
  for (let i = 0; i < N; i++) Lf[i] = depth[i] >= 3 || coreW[i] < 1e-4 ? L[i] : coreL[i] / coreW[i];

  // ---- the embroidered logo on the cuff: much brighter than the fabric around it ----
  // the fabric's own brightness nearby, ignoring anything bright (the logo itself)
  const fabricPx = core.map((v, i) => (v && Lf[i] < 0.15 ? 1 : 0));
  const local = P.blur(Lf.map((v, i) => v * fabricPx[i]), w, h, 9);
  const localW = P.blur(fabricPx, w, h, 9);
  const logo = new Float32Array(N);
  const Lb = S.garment.logoBox;
  for (let y = Lb.y0; y < Lb.y1; y++) for (let x = Lb.x0; x < Lb.x1; x++) {
    const i = y * w + x;
    if (!shirt[i]) continue;
    const ref = local[i] / Math.max(localW[i], 1e-4);
    logo[i] = Math.min(1, Math.max(0, (Lf[i] / ref - 2.2) / 1.8));
  }
  // the light catching the sleeve's edge is long and thin; letters are not
  {
    const m = logo.map(v => (v > 0.15 ? 1 : 0));
    const lc = P.components(m, w, h);
    const box = lc.sizes.map(() => [w, h, 0, 0]);
    for (let i = 0; i < N; i++) {
      const k = lc.labels[i];
      if (!k) continue;
      const x = i % w, y = (i - x) / w, b = box[k];
      b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
    }
    for (let i = 0; i < N; i++) {
      const k = lc.labels[i];
      if (!k) continue;
      const b = box[k], bw = b[2] - b[0] + 1, bh = b[3] - b[1] + 1;
      if (depth[i] < 2 || bh > 3.5 * bw || lc.sizes[k] < 6) logo[i] = 0;
    }
  }
  const logoSoft = P.blur(logo, w, h, 0.6);

  // ---- shading: how lit each point of the fabric is, relative to the body of the shirt ----
  const body = [];
  const B = S.garment.bodyBox;
  for (let y = B.y0; y < B.y1; y += 2) for (let x = B.x0; x < B.x1; x += 2) { const i = y * w + x; if (shirt[i]) body.push(Lf[i]); }
  const Lref = P.median(body);
  const shade = new Float32Array(N);
  for (let i = 0; i < N; i++) shade[i] = shirt[i] || alpha[i] > 0 ? Lf[i] / Lref : 1;
  // a lightly denoised copy: the photo is of dark fabric, so its grain is strong once brightened
  const shadeD = P.blur(shade, w, h, 0.55);
  // broad light (folds, the shadow across the back) and fine relief (the ribs), so each colour can soften them separately
  const logS = shadeD.map(v => Math.log(Math.max(v, 0.02)));
  const logLow = P.blur(logS, w, h, 9);

  // ---- the two colours ----
  const rollOff = (s, max) => (s <= 1 ? s : 1 + (max - 1) * Math.tanh((s - 1) / (max - 1)));
  for (const tone of S.garment.colors) {
    const t = P.hexToLin(tone.fabric);
    const thread = P.hexToLin(tone.thread);
    const max = Math.min(tone.maxLift, 0.985 / Math.max(...t));
    const out = Buffer.alloc(N * 4);
    for (let i = 0; i < N; i++) {
      const a = alpha[i];
      if (a <= 0.002) continue;
      const s = rollOff(Math.exp(logLow[i] * tone.light + (logS[i] - logLow[i]) * tone.relief), max);
      const k = logoSoft[i];
      for (let c = 0; c < 3; c++) {
        const fabric = t[c] * s;
        // the thread is lit like the fabric around it, a little brighter
        const lit = thread[c] * Math.min(1.6, Math.max(0.55, Math.pow(local[i] / Math.max(localW[i], 1e-4) / Lref, 0.8)));
        out[i * 4 + c] = P.toSrgb(fabric * (1 - k) + lit * k);
      }
      out[i * 4 + 3] = Math.round(Math.min(1, a) * 255);
    }
    const crop = S.garment.crop;
    const img = sharp(out, { raw: { width: w, height: h, channels: 4 } }).extract({ left: crop.x, top: crop.y, width: crop.w, height: crop.h });
    const png = await img.png().toBuffer();
    for (const width of S.garment.widths) {
      const file = path.join(ROOT, S.out.dir, `shirt-${tone.id}-${width}.webp`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await sharp(png).resize({ width, kernel: 'lanczos3' }).webp({ quality: tone.quality, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(file);
      console.log('wrote', path.relative(ROOT, file), (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
    }
    if (debugDir) await sharp(png).resize({ width: 900 }).flatten({ background: '#F3F9FF' }).jpeg({ quality: 90 }).toFile(path.join(debugDir, `shirt-${tone.id}.jpg`));
  }

  // ---- a soft contact shadow, small (it is scaled up and blurred anyway) ----
  {
    const crop = S.garment.crop;
    const sw = Math.round(crop.w / 6), sh = Math.round(crop.h / 6);
    const m = Buffer.alloc(N);
    for (let i = 0; i < N; i++) m[i] = shirt[i] ? 255 : 0;
    const small = await sharp(m, { raw: { width: w, height: h, channels: 1 } }).extract({ left: crop.x, top: crop.y, width: crop.w, height: crop.h }).resize(sw, sh).blur(6).raw().toBuffer({ resolveWithObject: true });
    const rgba = Buffer.alloc(sw * sh * 4);
    const ch = small.info.channels;
    for (let i = 0; i < sw * sh; i++) { rgba[i * 4] = 1; rgba[i * 4 + 1] = 13; rgba[i * 4 + 2] = 44; rgba[i * 4 + 3] = Math.round(small.data[i * ch] * 0.55); }
    const file = path.join(ROOT, S.out.dir, 'shirt-shadow.webp');
    await sharp(rgba, { raw: { width: sw, height: sh, channels: 4 } }).webp({ quality: 80, alphaQuality: 80 }).toFile(file);
    console.log('wrote', path.relative(ROOT, file));
  }

  // ---- fabric data for printing: shading across the print area (frame pixels) ----
  fs.mkdirSync(path.join(__dirname, '.cache'), { recursive: true });
  const header = new Float32Array([w, h, Lref]);
  fs.writeFileSync(path.join(__dirname, '.cache', 'fabric.bin'), Buffer.concat([Buffer.from(header.buffer), Buffer.from(shade.buffer), Buffer.from(Uint8Array.from(shirt).buffer)]));
  console.log('fabric cached; body luminance', Lref.toFixed(4));

  if (debugDir) {
    const vis = Buffer.alloc(N * 3);
    for (let i = 0; i < N; i++) { vis[i * 3] = shirt[i] * 200; vis[i * 3 + 1] = pass[i] * 120; vis[i * 3 + 2] = Math.round(logo[i] * 255); }
    await dbg('mask.png', w, h, 3, vis);
    // rib direction across the back, for placing the print (degrees from vertical; + leans right going down)
    const g = P.blur(L, w, h, 1.2);
    const rows = [];
    for (let cy = 250; cy <= 1250; cy += 125) {
      const row = [];
      for (let cx = 450; cx <= 1050; cx += 100) {
        let xx = 0, yy = 0, xy = 0;
        for (let y = cy - 60; y < cy + 60; y++) for (let x = cx - 60; x < cx + 60; x++) {
          const i = y * w + x;
          const gx = (g[i + 1] - g[i - 1]) / 2, gy = (g[i + w] - g[i - w]) / 2;
          xx += gx * gx; yy += gy * gy; xy += gx * gy;
        }
        const th = 0.5 * Math.atan2(2 * xy, xx - yy); // dominant gradient direction
        const coh = Math.sqrt((xx - yy) ** 2 + 4 * xy * xy) / (xx + yy);
        row.push(`${(th * 180 / Math.PI).toFixed(1).padStart(5)}°/${coh.toFixed(2)}`);
      }
      rows.push(`y${cy}: ` + row.join('  '));
    }
    console.log('rib gradient angle (0 = ribs vertical) / coherence at x=450..1050:\n' + rows.join('\n'));
  }
})().catch(e => { console.error(e); process.exit(1); });