# Studio image tools

These scripts make every image the design studio (`studio.html`) and the plain-or-printed page
(`customize.html`) show. Nothing here runs on the website itself: run them on your computer whenever
the shirt photo or the artwork changes, then upload the site as usual.

One-time setup (needs Node.js 18 or newer):

```
cd tools
npm install
```

## The artwork

Every design in the studio is original artwork drawn in code: one file per direction in `tools/artwork/`
(`retro-mascot.js` is Riso Print, `retro-mascot-badge.js` Badge Style, `vintage-athletic.js` Vintage Athletic Club,
`loud.js` Loud Belief, `matisse-cut-out.js` Matisse Cut Out, `creed-type.js` Creed Type), all sharing one drawing kit
and one palette (`tools/artwork/kit.js`). Lettering uses open-licence fonts (SIL Open Font License, free to print on
garments, installed with `npm install`) and is turned into outlines.

```
node tools/draw-designs.js          # writes designs-source/<direction>/<id>.svg
node tools/prepare-designs.js       # prints them on the shirt for the studio
```

`--only <direction>` or `--only <direction>/<id>` limits either script to those designs. `draw-designs.js --preview <folder>`
also writes a contact sheet per direction: each design on its paper, on the Midnight fabric and on the Ice Blue fabric.

Each SVG in `designs-source/` is the print master: vector, any size, no fonts needed. It has two layers, `<g id="paper">`
(the sheet it is printed on when the customer chooses "with background") and `<g id="art">` (the design on its own), and
the sheet is cut to the artwork with an even margin. To change a design, edit its drawing and run both scripts again;
to add one, add it to its direction's file and list it in `designs.config.js`. The images used before are kept in
`_reference/designs-previous/`.

## Adding a raster image

1. Put the image in its direction's folder in `designs-source/` (JPEG or PNG, as large as you have).
   The folders are the six directions (their names on the page, and their order, are in `content.js`):
   `retro-mascot` (Riso Print), `retro-mascot-badge` (Badge Style), `vintage-athletic` (Vintage Athletic Club),
   `loud` (Loud Belief), `matisse-cut-out` (Matisse Cut Out), `creed-type` (Creed Type). To replace a design,
   give the new file the old file's name.
2. Optional: give it a title, credit or settings in `tools/designs.config.js`.
3. Run `node tools/prepare-designs.js` from the site folder (about 8 seconds per design).
   `--only loud` or `--only loud/summer-waves` redoes just those.

For each image the script:

- **removes the background.** The paper colour is read from the edge of the image, and only the paper
  that can be reached from the edge is removed. Areas of the same colour shut inside the artwork (the
  white of an eye, white lettering inside a heart) are kept unless the settings say otherwise. Edges keep
  their anti-aliasing and the paper is taken back out of them, so there is no light fringe.
- **clears what is left of the paper:** paper caught inside letters (`holes: 'auto'` tells a letter's counter
  from the white of a drawing by the thickness of the stroke around it), specks of grain away from the artwork,
  and faint film that never becomes solid ink (a hairline along the edge of a scan, say).
- **saves the isolated artwork** as a lossless PNG with transparency in `designs-isolated/<direction>/`.
- **prints it on the back of the shirt, twice:** the cut-out, and the image as supplied with its own background
  (`<id>-print-bg.webp`), so customers can choose with or without it. Both are large and centred in the print
  area: every design covers the same share of it (`print.fill` in `studio.config.js`), a wide one wider and a tall
  one taller, never stretched or cropped,
  turned and narrowed with the fabric's ribs, moved by its folds, lit by the photo's light and textured
  by the knit. The result is `assets/designs/<direction>/<id>-print.webp` (and a half-size copy), which
  the page lays over the shirt photo. It works for both colours because both are built from one photo.
- **checks legibility:** a design whose ink is mostly as light or dark as a shirt colour is marked, and
  the studio suggests the other colour for it.

Check the result in the studio. If something was cut away that belongs to the artwork, or paper was left
behind, change that design's settings in `designs.config.js` (`holes`, `keepHoles`, `clearHoles`, `tolerance`,
`seal`, `keepBox`, `cutout` are explained at the top of the file) and run it again with `--only`. A design whose
background cannot be removed cleanly can be set to `cutout: false`: the studio then offers it with its
background only. `--debug <folder>` writes a review sheet per design: the image as supplied, the cut-out on
magenta with everything the clean-up removed in lime, and both prints on the Midnight shirt.

## The shirt

`node tools/prepare-garment.js` cuts the shirt out of `_reference/garment/midnight-back.heic` (the back of
the Midnight shirt on its hanger) and builds both colours from it. Run it, then `prepare-designs.js`, if
the photo changes. The colours, the print area and how closely the print follows the cloth are in
`tools/studio.config.js`.

The Ice Blue shirt in the studio is made from the Midnight photo, recoloured, because none of the
photos supplied shows the back of the Ice Blue shirt. A photo of it, taken like the Midnight one (back
to the camera, on a hanger against a plain light wall), would make that colour exact.

## Files

| Path | What it is |
| --- | --- |
| `tools/artwork/` | the drawings: one file per direction, and the shared kit |
| `designs-source/` | the print masters (SVG), one folder per direction |
| `designs-isolated/` | each design on its own (PNG, transparent, 2400 px on its longer side) — the SVG master is sharper |
| `_reference/designs-previous/` | the collected images the studio showed before, with their original names |
| `assets/designs/` | what the studio loads: thumbnails, prints with and without background, and `designs.js`, the list of designs |
| `assets/studio/` | the shirt in each colour, and its shadow |
| `tools/.cache/` | measurements of the fabric, remade by `prepare-garment.js` |