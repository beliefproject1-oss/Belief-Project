/* Belief Project — the studio's creative directions and per-image settings for prepare-designs.js.

   Every image in designs-source/<direction id>/ becomes a design (designs-source/ORIGINAL-NAMES.txt lists the names
   the images were supplied with). To add one, drop the image in its folder and run `node tools/prepare-designs.js`.
   Designs show in the order listed here, then any unlisted ones. Every design is shown and printed cut out, on its
   own: ALL of the paper of the image it came from is removed — around the artwork and inside it (the inside of a
   mug, a car, a letter) — so nothing white is printed that was not ink. Settings, per file name, all optional:
     title           — the design's name in the studio (default: the file name)
     credit          — who made it, shown under its name
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
     skip            — leave the image out of the studio
   A vector master (.svg, see tools/draw-designs.js) needs no settings: its art layer is already cut out. Nor does a PNG
   with its own transparency (a cut-out from the designer): it is used exactly as it is.
   Direction names and descriptions shown on the page are in content.js (studio.directions). */
'use strict';
module.exports = {
  source: 'designs-source',
  output: { dir: 'assets/designs', isolated: 'designs-isolated', manifest: 'assets/designs/designs.js' },
  defaults: { upscale: 2, holes: 'remove', tolerance: 0, speck: 4, seal: 0 },
  faintAbove: 0.6, // a design is "soft" on a shirt colour when more than this share of its ink is close to it in brightness

  directions: [
    {
      id: 'creed-type',
      designs: {
        'slow-down.jpg': { title: 'Slow Down' },
        'proud-of-the-progress.jpg': { title: 'Proud of the Progress' },
        'do-things-that-matter.jpg': { title: 'Do Things That Matter' },
        'happy-place.jpg': { title: 'This Is My Happy Place' },
        'be-brave.jpg': { title: 'You Can’t Be Brave Without Being Afraid', credit: 'Asho Designs' },
        'choose-kindness.jpg': { title: 'Choose Kindness', tolerance: 5 },
        'dont-forget-to-play.jpg': { title: 'Don’t Forget to Play' },
        'just-keep-swimming.jpg': { title: 'Just Keep Swimming' },
        'stop-chasing-perfection.jpg': { title: 'Stop Chasing Perfection' },
        'makes-you-happy.jpg': { title: 'Someone Who Makes You Happy' },
      },
    },
    {
      id: 'loud',
      designs: {
        'good-things.jpg': { title: 'Good Things Are Coming' },
        'happiness-within.jpg': { title: 'Happiness Within Yourself' },
        'summer-waves.jpg': { title: 'Summer Waves' },
        'just-be-yourself.jpg': { title: 'Just Be Yourself' },
        'human-after-all.jpg': { title: 'Human After All' },
        'light-of-the-world.jpg': { title: 'Light of the World' },
        'brooklyn-varsity.jpg': { title: 'Brooklyn Varsity Club' },
        'dream-big.png': { title: 'Dream Big, Start Small' },
        'perfect-love.png': { title: 'Perfect Love' },
        'homebody-club.jpg': { title: 'The Homebody Club' },
        'around-the-world.jpg': { title: 'Around the World' },
      },
    },
    {
      id: 'matisse-cut-out',
      designs: {
        'grow-at-your-own-pace.jpg': { title: 'Grow at Your Own Pace' },
        'sunset-tide.jpg': { title: 'Sunset Tide' },
        'lemons.jpg': { title: 'Lemons' },
        'sunburst.jpg': { title: 'Sunburst' },
        'blue-daisies.jpg': { title: 'Blue Daisies', tolerance: 30, crop: [0.02, 0.02, 0.98, 0.98] },
        'sun-between-waves.jpg': { title: 'Sun Between Waves' },
        'blue-stem.jpg': { title: 'Blue Stem' },
        'wildflowers.jpg': { title: 'Wildflowers', tolerance: 12 },
        'green-flower.jpg': { title: 'Green Flower', tolerance: 12 },
        'night-blooms.jpg': { title: 'Night Blooms', tolerance: 34 },
      },
    },
    {
      id: 'retro-mascot-badge',
      designs: {
        'summit-club.jpg': { title: 'Summit Club' },
        'happy-hands.jpg': { title: 'Happy Hands' },
        'cookies-and-milk.jpg': { title: 'Cookies & Milk' },
        'wrench-boy.jpg': { title: 'Wrench Boy', seal: 2 },
        'grandpa-goods.jpg': { title: 'Grandpa Goods', credit: 'Don Leon' },
        'central-oak.jpg': { title: 'Central Oak Barber Co.', credit: 'Good Time Retro' },
        'kooppee.jpg': { title: 'Kooppee' },
        'garage-club.jpg': { title: 'Garage Club' },
        'lagu-mano-boh.jpg': { title: 'Lagu Mano Boh' },
        'food-festival.jpg': { title: 'Food Festival' },
        'coffee-club.jpg': { title: 'Coffee Club' },
        'more-espresso.jpg': { title: 'More Espresso' },
        'flushed-golf.jpg': { title: 'Flushed Golf' },
        'pizza-friends.jpg': { title: 'Pizza Is Better With Friends' },
        'run-club-brunch.jpg': { title: 'Run Club Brunch' },
      },
    },
    {
      id: 'retro-mascot',
      designs: {
        'public-records.jpg': { title: 'Public Records', credit: 'Reza Alfian' },
        'dont-be-crabby.png': { title: 'Don’t Be Crabby' },
        'bangers-sub-shop.png': { title: 'Banger’s Sub Shop', credit: 'Zach Wieland' },
        'disco-only.png': { title: 'Disco Only' },
        'go-analog.jpg': { title: 'Go Analog' },
        'the-clubhouse.png': { title: 'The Clubhouse' },
        'pasta-la-vista.png': { title: 'Pasta La Vista' },
        'pasta-club.jpg': { title: 'Pasta Club' },
        'recents-detailing.png': { title: 'Recent’s Car Detailing' },
        'perhaps-showroom.png': { title: 'Perhaps Showroom' },
        'vintage-road.jpg': { title: 'Vintage Road' },
        'timeless-style.jpg': { title: 'Timeless Style' },
        'yes-we-are-open.png': { title: 'Yes, We Are Open' },
        'fisher-of-men.png': { title: 'Fisher of Men' },
        'gratitude.jpg': { title: 'Gratitude' },
        'consider-the-lilies.jpg': { title: 'Consider the Lilies' },
        'make-your-move.jpg': { title: 'Make Your Move' },
        'north-bay.png': { title: 'North Bay Leisure Club' },
        'borcelle.png': { title: 'The Borcelle' },
      },
    },
    {
      id: 'vintage-athletic',
      designs: {
        'dont-look-back.jpg': { title: 'Don’t Look Back' },
        'slow-and-easy.png': { title: 'Slow & Easy Running Club' },
        'just-got-served.png': { title: 'You Just Got Served' },
        'run-more-stress-less.jpg': { title: 'Run More, Stress Less' },
        'billys-bowling.png': { title: 'Billy’s Bowling Club', credit: 'Good Time Retro' },
        'slow-sundays.png': { title: 'Slow Sundays', credit: 'Good Time Retro' },
        'nice-day.jpg': { title: 'It’s a Nice Day' },
        'sunday-running-club.jpg': { title: 'Sunday Running Club' },
        'tennis-club.jpg': { title: 'Tennis Club' },
        'tennis-club-bubble.jpg': { title: 'Tennis Club, Bubble' },
        'run-the-race.jpg': { title: 'Run the Race' },
        'keep-moving-forward.jpg': { title: 'Keep Moving Forward' },
        'keep-moving.jpg': { title: 'Keep Moving' },
        'run-club.jpg': { title: 'Run Club' },
        'run-like-never-before.jpg': { title: 'Run Like Never Before' },
        'lazy-morning.jpg': { title: 'Lazy Morning Running Club', credit: 'Zina Borisova' },
        'live-like-an-athlete.jpg': { title: 'Live Like an Athlete' },
        'court-crew.jpg': { title: 'Court Crew', credit: 'choin' },
      },
    },
  ],
};
