# Studio image tools

These scripts make every image the design studio (`studio.html`), the plain-or-printed page (`customize.html`), the
order page and the confirmation show. Nothing here runs on the website itself: run them on your computer whenever a
model photo or the artwork changes, then upload the site as usual.

One-time setup (needs Node.js 18 or newer):

```
cd tools
npm install
```

## The models

Each colour is shown on its own model, photographed from behind in the real shirt: Ice Blue standing against grey
(`_reference/models/ice-blue-back.webp`), Midnight seated against blue paper (`_reference/models/midnight-back.webp`).
Each is a **stage** in `tools/studio.config.js`: the photograph, the back panel of the shirt (where ink can land),
the print area on it, and the view the page frames by default (head to hips).

```
node tools/prepare-garment.js       # the photographs the page loads, and the fabric measurements
node tools/prepare-designs.js       # every design printed on every model
node tools/prepare-places.js        # the wilayas and communes for the order page
node tools/stamp-assets.js          # before every push: version tags on CSS/JS links, so the CDN never serves old copies
```

Run both when a model photograph or a stage changes. `prepare-garment.js --debug <folder>` writes each photograph with
its back panel (magenta), print area (green) and view (yellow) marked.

## Adding or replacing a design

1. Put the image in its direction's folder in `designs-source/` (JPEG or PNG, as large as you have).
   The folders are the six directions (their names on the page, and their order, are in `content.js`):
   `retro-mascot` (Riso Print), `retro-mascot-badge` (Badge Style), `vintage-athletic` (Vintage Athletic Club),
   `loud` (Loud Belief), `matisse-cut-out` (Matisse Cut Out), `creed-type` (Creed Type). To replace a design,
   give the new file the old file's name. (`designs-source/ORIGINAL-NAMES.txt` lists the names the images came with.)
2. Optional: give it a title, credit or settings in `tools/designs.config.js`.
3. Run `node tools/prepare-designs.js` from the site folder (about 8 seconds per design).
   `--only loud` or `--only loud/summer-waves` redoes just those. `--reuse-cutouts` prints the cut-outs already in
   `designs-isolated/` instead of removing the backgrounds again (about a second per design).

For each image the script:

- **removes all of the paper.** The paper colour is read from the edge of the image, and every area of that
  colour goes: around the artwork and inside it (the inside of a letter, a mug, a car). Nothing white is printed
  that was not ink, so no design ever sits in a white box. Edges keep their anti-aliasing and the paper is taken
  back out of them, so there is no light fringe.
- **clears what is left of the paper:** specks of grain away from the artwork, faint film that never becomes solid
  ink (a hairline along the edge of a scan, say), and, on cream or tinted paper, marks lighter than the paper along
  the edge of the artwork (the bright ring a JPEG leaves around a line), which would print as white specks on a dark
  shirt. White that belongs to the drawing (a white top, white petals) is larger and stays.
- **saves the isolated artwork** as a lossless PNG with transparency in `designs-isolated/<direction>/`.
- **prints it on the back of each model's shirt, cut out:** there is no version with the image's own background.
  It is large and centred in the print area: every design covers the same share of it (`print.fill`), a wide one
  wider and a tall one taller, never stretched or cropped, moved by the folds and lit and textured by the shirt in
  the photograph. The results are `assets/designs/<direction>/<id>-<colour>.webp` (and half-size copies), which the
  page lays exactly over the model's back.
- **checks legibility:** a design whose ink is mostly as light or dark as a shirt colour is marked, and
  the studio suggests the other colour for it.

Check the result in the studio. If something was cut away that belongs to the artwork, or paper was left
behind, change that design's settings in `designs.config.js` (`tolerance`, `seal`, `crop` and the others are
explained at the top of the file) and run it again with `--only`. `--debug <folder>` writes a
review sheet per design: the image as supplied, the cut-out on magenta with everything the clean-up removed in lime,
and the print on each model.

## The zipper bag

The packaging page shows the photograph supplied, `_reference/packaging/zipper-bag-photo.webp`, as
`assets/img/pack-zipper-bag-photo.webp` (1448 px wide) and `-sm.webp` (900 px). To change it, replace both with the new
photograph at those widths and run `node tools/stamp-assets.js`.

## Wilayas and communes

`node tools/prepare-places.js` writes `assets/data/places.js`, the 58 wilayas and their 1,541 communes in French and
Arabic, from `_reference/data/algeria-cities.json` (the open dataset github.com/othmanus/algeria-cities). The order
page's pickers (`js/places.js`) read it.

## Drawn artwork (archived)

`tools/draw-designs.js` and `tools/artwork/` draw a set of 18 designs in code (vector, open-licence fonts). They are not
in the studio: the studio shows the original designs above. Running `draw-designs.js` writes its SVGs to
`_reference/designs-drawn/`; to put one in the studio, copy it into a direction's folder in `designs-source/`.

## Files

| Path | What it is |
| --- | --- |
| `designs-source/` | the designs as supplied, one folder per direction |
| `designs-isolated/` | each design cut out (PNG, transparent) — for the printer |
| `assets/designs/` | what the studio loads: thumbnails, the print on each model, and `designs.js`, the list of designs |
| `assets/studio/` | the model photographs, in two widths |
| `_reference/models/` | the model photographs as supplied |
| `_reference/designs-drawn/` | the drawn designs (SVG), kept out of the studio |
| `tools/.cache/` | measurements of the fabric on each model, remade by `prepare-garment.js` |
