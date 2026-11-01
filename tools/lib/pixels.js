/* Belief Project — small pixel helpers shared by the image scripts (no dependencies). */
'use strict';

const LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
const toLin = v => LIN[v];
function toSrgb(l) {
  if (l <= 0) return 0;
  if (l >= 1) return 255;
  const v = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}
const hexToLin = hex => [1, 3, 5].map(i => LIN[parseInt(hex.slice(i, i + 2), 16)]);

// separable box blur run three times (close to a Gaussian of the given sigma), on a Float32Array
function blur(src, w, h, sigma) {
  if (sigma <= 0) return Float32Array.from(src);
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) { boxH(a, b, w, h, r); boxV(b, a, w, h, r); }
  return a;
}
function boxH(s, d, w, h, r) {
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let acc = s[o] * (r + 1);
    for (let x = 1; x <= r; x++) acc += s[o + Math.min(x, w - 1)];
    for (let x = 0; x < w; x++) {
      d[o + x] = acc / n;
      acc += s[o + Math.min(x + r + 1, w - 1)] - s[o + Math.max(x - r, 0)];
    }
  }
}
function boxV(s, d, w, h, r) {
  const n = 2 * r + 1;
  for (let x = 0; x < w; x++) {
    let acc = s[x] * (r + 1);
    for (let y = 1; y <= r; y++) acc += s[Math.min(y, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      d[y * w + x] = acc / n;
      acc += s[Math.min(y + r + 1, h - 1) * w + x] - s[Math.max(y - r, 0) * w + x];
    }
  }
}

// labels 4-connected components of mask (Uint8Array, 1 = in). Returns { labels: Int32Array, sizes: [] } (label 0 = outside)
function components(mask, w, h) {
  const labels = new Int32Array(w * h);
  const sizes = [0];
  const stack = new Int32Array(w * h);
  let next = 1;
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || labels[i]) continue;
    let sp = 0, size = 0;
    stack[sp++] = i; labels[i] = next;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % w, y = (p - x) / w;
      if (x > 0 && mask[p - 1] && !labels[p - 1]) { labels[p - 1] = next; stack[sp++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !labels[p + 1]) { labels[p + 1] = next; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - w] && !labels[p - w]) { labels[p - w] = next; stack[sp++] = p - w; }
      if (y < h - 1 && mask[p + w] && !labels[p + w]) { labels[p + w] = next; stack[sp++] = p + w; }
    }
    sizes.push(size); next++;
  }
  return { labels, sizes };
}

// flood fill of `pass` (Uint8Array) starting from every seed index; returns Uint8Array of reached pixels
function flood(pass, w, h, seeds) {
  const out = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  for (const s of seeds) if (pass[s] && !out[s]) { out[s] = 1; stack[sp++] = s; }
  while (sp) {
    const p = stack[--sp];
    const x = p % w;
    if (x > 0 && pass[p - 1] && !out[p - 1]) { out[p - 1] = 1; stack[sp++] = p - 1; }
    if (x < w - 1 && pass[p + 1] && !out[p + 1]) { out[p + 1] = 1; stack[sp++] = p + 1; }
    if (p >= w && pass[p - w] && !out[p - w]) { out[p - w] = 1; stack[sp++] = p - w; }
    if (p < w * (h - 1) && pass[p + w] && !out[p + w]) { out[p + w] = 1; stack[sp++] = p + w; }
  }
  return out;
}

// indices of the pixels on the outer edge of the image
function borderSeeds(w, h) {
  const s = [];
  for (let x = 0; x < w; x++) s.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) s.push(y * w, y * w + w - 1);
  return s;
}

// distance (in px, chessboard) from each pixel to the nearest pixel where mask is 1, capped at max
function distanceTo(mask, w, h, max) {
  const d = new Uint8Array(w * h).fill(max);
  for (let i = 0; i < w * h; i++) if (mask[i]) d[i] = 0;
  for (let it = 0; it < max; it++) {
    let changed = false;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] <= it) continue;
      if ((x > 0 && d[i - 1] === it) || (x < w - 1 && d[i + 1] === it) || (y > 0 && d[i - w] === it) || (y < h - 1 && d[i + w] === it) ||
          (x > 0 && y > 0 && d[i - w - 1] === it) || (x < w - 1 && y > 0 && d[i - w + 1] === it) ||
          (x > 0 && y < h - 1 && d[i + w - 1] === it) || (x < w - 1 && y < h - 1 && d[i + w + 1] === it)) { d[i] = it + 1; changed = true; }
    }
    if (!changed) break;
  }
  return d;
}

// CIE Lab (D65) from 8-bit sRGB
function lab(r, g, b) {
  const R = LIN[r], G = LIN[g], B = LIN[b];
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const X = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const Y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const Z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}

const median = arr => { const a = Array.from(arr).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };

module.exports = { LIN, toLin, toSrgb, hexToLin, blur, components, flood, borderSeeds, distanceTo, lab, median };