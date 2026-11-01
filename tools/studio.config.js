/* Belief Project — studio settings shared by prepare-garment.js and prepare-designs.js.

   The studio shows each colour on a model photographed from behind, wearing the real shirt, and prints the chosen
   design on that shirt's back. One stage per colour; coordinates are pixels of the stage's frame (its photograph
   scaled to frame.w × frame.h). */
'use strict';
module.exports = {
  frame: { w: 1120, h: 1400 },   // 4 : 5, the shape of the model photographs
  out: { dir: 'assets/studio' },
  widths: [1400, 900],           // the photographs the page loads, by width

  stages: [
    {
      id: 'ice-blue',
      source: '_reference/models/ice-blue-back.webp',   // standing, back to the camera, grey studio
      fabric: '#9FC4C4',                                // the shirt in even light (legibility check)
      // the back panel between the arms: where ink can land
      body: [[472, 318], [700, 318], [706, 470], [700, 676], [486, 676], [476, 470]],
      // the printable area: below the collar, clear of the sleeves and the hem
      print: { centerX: 588, top: 344, width: 186, height: 256, fill: 0.72,
        scale: 3, foldScale: 10, fold: 18, light: 0.7, relief: 0.42, minLit: 0.55, maxLit: 1.18, grain: 0.18 },
      // what the page frames by default: head to hips
      view: { x: 304, y: 108, w: 560, h: 700 },
    },
    {
      id: 'midnight',
      source: '_reference/models/midnight-back.webp',   // seated, back to the camera, blue paper
      fabric: '#1C2133',
      body: [[600, 588], [904, 588], [918, 720], [900, 880], [872, 1060], [612, 1066], [598, 800]],
      // below the label sewn at the back of the neck
      print: { centerX: 756, top: 614, width: 262, height: 362, fill: 0.72,
        scale: 3, foldScale: 12, fold: 20, light: 0.6, relief: 0.3, minLit: 0.6, maxLit: 1.25, grain: 0.14 },
      view: { x: 330, y: 228, w: 760, h: 950 },
    },
  ],
};
