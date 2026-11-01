/* Belief Project — studio settings shared by prepare-garment.js and prepare-designs.js.
   Coordinates are pixels of the working frame: the garment photo scaled to frame.w × frame.h. */
'use strict';
module.exports = {
  frame: { w: 1500, h: 2000 },
  out: { dir: 'assets/studio' },

  garment: {
    source: '_reference/garment/midnight-back.heic',
    // the part of the frame the page shows (the shirt plus a little air)
    crop: { x: 0, y: 0, w: 1500, h: 2000 },
    widths: [1200, 760],
    matte: { warmMin: 9, warmLumMin: 0.11, brightMin: 0.5, wallWarm: 18, open: 5 },
    bodyBox: { x0: 450, y0: 350, x1: 1050, y1: 1300 },   // where "normal" fabric brightness is measured
    logoBox: { x0: 40, y0: 1650, x1: 260, y1: 1900 },    // the embroidered logo on the cuff
    colors: [
      // fabric: the colour of the body in even light. thread: the embroidered logo.
      // light / relief: how much of the photo's broad lighting and of the rib texture to keep (1 = all of it)
      { id: 'midnight', fabric: '#242B3F', thread: '#C9CED8', light: 0.9, relief: 1.0, maxLift: 3.2, quality: 86 },
      { id: 'ice-blue', fabric: '#AFC9D7', thread: '#1D2742', light: 0.5, relief: 0.75, maxLift: 1.4, quality: 86 },
    ],
  },

  // the print on the back. width × height is the printable area: clear of the collar, the sleeves and the hem
  // (the back panel runs about x 280–1170 and y 130–1790 of the frame). Every design is printed at the same
  // share of that area (fill), keeping its own proportions — so a wide design is wider and a tall one taller,
  // with the same presence — capped by the area, never stretched or cropped, and centred both ways in it.
  print: {
    centerX: 690, top: 255, width: 600, height: 800, fill: 0.7,
    scale: 2,                                       // printed at 2× the frame, for the close-up view
    ribArea: { x0: 500, y0: 300, x1: 900, y1: 1050 }, // where the rib direction is measured
    leanFollow: 0.8, ribFollow: 0.45,                // how much of the ribs' overall lean and of their fanning the print follows (0–1)
    foldScale: 14, fold: 90,                        // folds: smoothing of the surface, and how far they move the print
    light: 0.62, relief: 0.5, minLit: 0.42, maxLit: 1.12, // lighting taken from the fabric
    grain: 0.28,                                    // ink thins in the valleys between ribs
  },
};