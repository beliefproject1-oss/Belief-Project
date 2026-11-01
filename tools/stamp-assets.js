/* Belief Project — gives every stylesheet and script a page links to a version tag made from its content:
   css/styles.css?v=3f9a1c02. The host's CDN keeps CSS and JS for a week; a file that changed gets a new tag, so
   browsers fetch the new file at once instead of an old copy. A file that did not change keeps its tag (and its cache).

     node tools/stamp-assets.js

   Run it before every push. The pages themselves are never cached by the CDN, so new tags reach visitors at once. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// the version of a file: its content (line endings ignored, so a Windows checkout gives the same tag as the host)
const tags = {};
const tagOf = rel => {
  if (!(rel in tags)) {
    const file = path.join(ROOT, rel);
    tags[rel] = fs.existsSync(file) ? crypto.createHash('sha1').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8) : null;
  }
  return tags[rel];
};

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
