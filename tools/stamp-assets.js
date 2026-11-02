/* Belief Project — gives every stylesheet and script a page links to, and every picture content.js names, a version
   tag made from its content (and the prints in the design list): css/styles.css?v=3f9a1c02. The host's CDN
   keeps files for a week; a file that changed gets a new tag, so browsers fetch the new file at once instead of an old
   copy. A file that did not change keeps its tag (and its cache).

     node tools/stamp-assets.js

   Run it before every push. The pages themselves are never cached by the CDN, so new tags reach visitors at once. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// the version of a file: its content (for text, line endings ignored, so a Windows checkout gives the host's tag)
const tags = {};
const tagOf = rel => {
  if (!(rel in tags)) {
    const file = path.join(ROOT, rel);
    const text = /\.(css|js|html|svg)$/i.test(rel);
    tags[rel] = fs.existsSync(file)
      ? crypto.createHash('sha1').update(text ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : fs.readFileSync(file)).digest('hex').slice(0, 8)
      : null;
  }
  return tags[rel];
};

// first the pictures and video content.js and the design list name (every print and thumbnail, regenerated under the
// same names by prepare-designs.js), so their own tags (below) already include them
for (const data of ['content.js', 'assets/designs/designs.js']) {
  const file = path.join(ROOT, data);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/(["'])((?:assets|designs-isolated)\/[^"'?#\s]+\.(?:webp|avif|jpe?g|png|svg|gif|mp4|webm))(?:\?v=[0-9a-f]*)?\1/g, (all, q, rel) => {
    const tag = tagOf(rel);
    return tag ? `${q}${rel}?v=${tag}${q}` : all;
  });
  if (after !== before) { fs.writeFileSync(file, after); if (!process.argv.includes('--quiet')) console.log('stamped the pictures in ' + data); }
}

let changed = 0;
for (const page of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/(<(?:link|script)\b[^>]*?\b(?:href|src)=")([^"?#:]+\.(?:css|js))(?:\?v=[^"]*)?"/g, (all, head, rel) => {
    const tag = tagOf(rel);
    return tag ? `${head}${rel}?v=${tag}"` : all;
  });
  if (after !== before) { fs.writeFileSync(file, after); changed++; if (!process.argv.includes('--quiet')) console.log('stamped', page); }
}
if (!process.argv.includes('--quiet')) console.log(changed ? `${changed} page(s) updated` : 'all tags already current');
