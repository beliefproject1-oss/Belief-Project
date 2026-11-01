/* Belief Project — draws the studio's artwork.
   Every design is drawn in code, in tools/artwork/<direction>.js, with the shared kit in tools/artwork/kit.js, and
   written as a vector master: designs-source/<direction>/<id>.svg. Lettering is outlined, so the file prints the same
   anywhere. Each SVG has two layers: <g id="paper"> (the sheet it sits on — the studio's "with background") and
   <g id="art"> (what is printed on its own).

     node tools/draw-designs.js [--only <direction>[/<id>]] [--preview <folder>]

   Then run prepare-designs.js to print them on the shirt. --preview writes a contact sheet per direction: each design
   on its paper, on the Midnight fabric and on the Ice Blue fabric. */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./designs.config');
const S = require('./studio.config');

const ROOT = path.resolve(__dirname, '..');
const arg = name => (i => (i > 0 ? process.argv[i + 1] : ''))(process.argv.indexOf(name));
const only = arg('--only');
const previewDir = arg('--preview');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The sheet is cut to the artwork: the drawing is measured and the page set round it with an even margin
// (MARGIN of its longer side), so every design sits on its paper the same way whatever it was drawn on.
const MARGIN = 0.08;
async function svgOf(design) {
  const sharp = require('sharp');
  const { w, h } = design;
  const { defs = '', art, paper } = design.draw();
  const page = (x, y, pw, ph, withPaper) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="${x} ${y} ${pw} ${ph}">\n` +
    `<title>${esc(design.title)} — Belief Project</title>\n` +
    (defs ? `<defs>${defs}</defs>\n` : '') +
    (withPaper ? `<g id="paper">${paper || `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${design.paper}"/>`}</g>\n` : '') +
    `<g id="art">${art}</g>\n</svg>\n`;
  // measure what is drawn, on a canvas with room to spare round the one it was drawn on
  const sc = 0.5, ox = -w * 0.25, oy = -h * 0.25, mw = w * 1.5, mh = h * 1.5;
  const { data, info } = await sharp(Buffer.from(page(ox, oy, mw, mh, false)), { density: 72 * sc }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error(design.id + ': nothing drawn');
  const bx = ox + x0 / sc, by = oy + y0 / sc, bw = (x1 - x0 + 1) / sc, bh = (y1 - y0 + 1) / sc;
  const m = Math.round(Math.max(bw, bh) * MARGIN);
  return page(Math.floor(bx - m), Math.floor(by - m), Math.ceil(bw + m * 2), Math.ceil(bh + m * 2), true);
}

async function preview(dirId, files) {
  const sharp = require('sharp');
  const cell = 420, pad = 22;
  const tones = [null, ...S.garment.colors.map(c => c.fabric)];
  const tiles = [];
  for (const file of files) {
    const svg = fs.readFileSync(file, 'utf8');
    const artOnly = svg.replace(/<g id="paper">.*<\/g>\n/, '');
    for (const tone of tones) {
      const src = Buffer.from(tone ? artOnly : svg);
      const img = await sharp(src, { density: 144 }).resize(cell - pad * 2, cell - pad * 2, { fit: 'inside' }).png().toBuffer();
      tiles.push(await sharp({ create: { width: cell, height: cell, channels: 3, background: tone || '#DADCE0' } })
        .composite([{ input: img, gravity: 'center' }]).png().toBuffer());
    }
  }
  const cols = tones.length, rows = files.length;
  const out = path.join(previewDir, dirId + '.jpg');
  await sharp({ create: { width: cell * cols, height: cell * rows, channels: 3, background: '#888' } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * cell, top: Math.floor(i / cols) * cell })))
    .jpeg({ quality: 86 }).toFile(out);
  console.log('preview', out);
}

async function main() {
  if (previewDir) fs.mkdirSync(previewDir, { recursive: true });
  for (const dir of D.directions) {
    const file = path.join(__dirname, 'artwork', dir.id + '.js');
    if (!fs.existsSync(file)) continue;
    const [onlyDir, onlyId] = (only || '').split('/');
    if (onlyDir && onlyDir !== dir.id) continue;
    const mod = require(file);
    const outDir = path.join(ROOT, D.source, dir.id);
    fs.mkdirSync(outDir, { recursive: true });
    const written = [];
    for (const design of mod.designs) {
      if (onlyId && onlyId !== design.id) continue;
      const out = path.join(outDir, design.id + '.svg');
      fs.writeFileSync(out, await svgOf(design));
      written.push(out);
      console.log(`${dir.id}/${design.id}.svg`);
    }
    if (previewDir && written.length) await preview(dir.id, written);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
