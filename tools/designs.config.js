/* Belief Project — the studio's creative directions and per-image settings for prepare-designs.js.

   The artwork is drawn in code by tools/draw-designs.js (tools/artwork/<direction id>.js), which writes one vector
   master per design: designs-source/<direction id>/<id>.svg. Its title is taken from the drawing; nothing else needs
   setting. The artwork used before (collected images) is kept in _reference/designs-previous/.

   Designs show in the order listed here, then any unlisted ones. Settings, per file name, all optional:
     title           — the design's name in the studio (default: the drawing's title, or the file name)
     credit          — who made it, shown under its name
     cutout          — false: the studio offers the design with its background (its paper) only
     skip            — leave the design out of the studio
   A raster image (JPEG, PNG) dropped in a direction's folder still works: its background is removed automatically,
   and these tune that removal (see tools/README.md):
     holes           — paper-coloured areas shut inside the artwork:
                         'keep'   keep them (fills of illustrations, white lettering inside a shape),
                         'remove' clear them (the inside of letters, distressed texture),
                         'auto'   clear the paper caught inside letters: a hole ringed by a thick stroke, with the outside
                                  of the mark just past it, smaller than holeMax (default 0.004 of the image). Fills inside
                                  the thin outlines of a drawing, the white of an eye, white lettering inside a bigger
                                  shape and large fills stay,
                         <number> clear only those smaller than this many pixels of the original image
     keepHoles       — [[left, top, right, bottom], …] fractions of the image: paper holes there are always kept
     clearHoles      — the same, always cleared (whatever holes says)
     tolerance       — how different from the paper a colour must be to count as artwork (default: measured)
     seal            — close gaps up to this many pixels in outlines, so the paper outside cannot run into
                       a fill of the same colour (the face of a character, say)
     keepBox         — [left, top, right, bottom] as fractions of the image: always artwork, whatever its colour
     crop            — [left, top, right, bottom] as fractions of the image: trim it first (a frame or overlay
                       left over from a screenshot, never the design itself)
     background      — the paper colour, '#rrggbb', when the edge of the image is not mostly paper
     stray           — specks away from the artwork are cleared (grain, dust): false keeps them, or tune
                       { size, gap, mass } (fractions of the image: largest speck, how far to look, how much artwork
                       nearby keeps a mark)
   Every design is also printed with its background: customers choose with or without it.
   Direction names and descriptions shown on the page are in content.js (studio.directions). */
'use strict';
module.exports = {
  source: 'designs-source',
  output: { dir: 'assets/designs', isolated: 'designs-isolated', manifest: 'assets/designs/designs.js' },
  defaults: { upscale: 2, holes: 'keep', tolerance: 0, speck: 4, seal: 0 },
  faintAbove: 0.6, // a design is "soft" on a shirt colour when more than this share of its ink is close to it in brightness

  directions: [
    {
      id: 'creed-type',
      designs: { 'ever-forward.svg': {}, 'worn-with-intention.svg': {}, 'small-steps.svg': {} },
    },
    {
      id: 'loud',
      designs: { 'believe-before-you-see-it.svg': {}, 'louder-than-doubt.svg': {}, 'move-differently.svg': {} },
    },
    {
      id: 'matisse-cut-out',
      designs: { 'la-mer.svg': {}, 'soleil.svg': {}, 'le-jardin.svg': {} },
    },
    {
      id: 'retro-mascot-badge',
      designs: { 'early-riser-club.svg': {}, 'night-owl-society.svg': {}, 'ever-forward-trail-club.svg': {} },
    },
    {
      id: 'retro-mascot',
      designs: { 'cafe-belief.svg': {}, 'bread-and-belief.svg': {}, 'fresh-squeezed.svg': {} },
    },
    {
      id: 'vintage-athletic',
      designs: { 'belief-athletic-club.svg': {}, 'sunday-tennis-society.svg': {}, 'ever-forward-running-club.svg': {} },
    },
  ],
};
