/* Belief Project — site content.
   This is the only file you need to edit day to day: change the text between
   the quotes, save, and refresh the page. Leave a "url" empty ("") to show the
   item without a link until the real one is ready. */
window.BELIEF = {
  // Text repeated in the moving strip at the very top.
  marquee: "Belief Project",

  hero: {
    video: "assets/video/hero-placeholder.mp4", // wide video for desktop and tablet
    videoMobile: "",                            // optional 9:16 video for phones
    poster: "",                                 // optional still image shown while the video loads
    shopLabel: "Shop Now",
    shopUrl: "shop.html",                       // the colour selection page
    captionLeft: "Est. 2026 — Alger",
    captionRight: "Scroll",
  },

  // About Us
  statement: {
    eyebrow: "The project",
    body: "Belief Project is built for those who move differently. A space where identity, culture, and modern fashion come together. We create pieces made to be worn with intention, confidence, and belief.",
  },

  // Full-screen photo section
  custom: {
    image: "assets/img/custom-wide.jpg",          // photo for desktop and tablet
    imageMobile: "assets/img/custom-mobile.jpg",  // optional upright photo for phones
    imageAlt: "Two models in navy hoodies and wide jeans, one facing forward and one seen from behind",
    eyebrow: "Custom",
    title: "Create your own shirt",
    cta: "Make It Yours",
    url: "shop.html",
  },

  // Colour selection page (shop.html)
  shop: {
    title: "Choose your",   // the page's heading: read out by screen readers, not shown
    titleSerif: "colour",
    // Address of the page that opens once a colour is chosen: each colour opens it as
    // customize.html?color=ice-blue or customize.html?color=midnight. Empty ("") = a click only
    // marks the colour as chosen.
    next: "customize.html",
    // The two photos fill the page: the first is the left half, the second the right half.
    // They are stand-ins (originals kept in _reference). To change one, replace the file or
    // write a new address in "image". "focus" is the part of the photo that stays in view
    // when it is cropped: across, then down (0% = left / top).
    colors: [
      { id: "ice-blue", label: "Ice Blue", image: "assets/img/tee-ice-blue.jpg", imageAlt: "Model in a light blue shirt and beige trousers", focus: "48% 20%" },
      { id: "midnight", label: "Midnight", image: "assets/img/tee-midnight.jpg", imageAlt: "Model in a black top and grey jeans, holding a leather jacket", focus: "50% 10%" },
    ],
  },

  // Prices, shown once the colour is chosen (customize.html, under each choice) and in the design studio.
  prices: {
    plainLabel: "Without design",
    plain: "3,900 DA",
    printedLabel: "With design",
    printed: "4,900 DA",
  },

  // Plain or printed (customize.html): the step after the colour
  customize: {
    title: "Plain or",      // read out by screen readers, not shown
    titleSerif: "printed",
    plainEyebrow: "01 — Plain",
    plainLabel: "Keep it plain",
    printEyebrow: "02 — Printed",
    printLabel: "Add artwork",
    // Address of the plain-shirt page. It is not built yet: while this is empty, choosing Plain
    // only marks it as chosen and shows plainSoon under the button. The fit page (size.html) already
    // works for a plain shirt, so "size.html" here sends Plain straight to it.
    plainNext: "",
    plainSoon: "The plain shirt opens soon",
    printNext: "studio.html", // the design studio
  },

  // Design studio (studio.html): artwork printed on the back of the shirt.
  // The designs themselves come from assets/designs/designs.js: drawn by tools/draw-designs.js and
  // printed on the shirt by tools/prepare-designs.js (see tools/README.md).
  studio: {
    eyebrow: "Design studio",
    title: "Six",
    titleSerif: "directions",
    // Small line under the title. Empty it ("") once the final artwork is in.
    note: "Artwork shown is for preview.",
    empty: "Choose a design",
    areaLabel: "Print area",      // on the empty shirt
    creditLabel: "Artwork by",    // before a design's credit (tools/designs.config.js)
    printLabel: "Back print",
    keepLabel: "Choose this design",
    allLabel: "All directions",     // the way back from a direction to the six cards
    pickedLabel: "Your design",     // on the card of the direction the chosen design belongs to
    // The artwork printed with the background of its image, or cut out on its own
    bgLabel: "Artwork background",
    bgWith: "With background",
    bgWithout: "Without background",
    bgOnlyNote: "This design keeps its original background: it cannot be cut out cleanly.",
    // Address of the page that opens once a design is chosen (?color=…&design=…&bg=…): the fit.
    // Empty ("") = the button only saves the choice and shows keptNote.
    next: "size.html",
    keptNote: "Saved — ordering opens soon.",
    // The six creative directions, in this order: two cards per row, top to bottom, on every screen.
    // "id" is the folder name in designs-source/ and stays as it is; "name" is what the page shows.
    directions: [
      { id: "retro-mascot", name: "Riso Print", note: "Old shop signs and the characters behind the counter." },
      { id: "retro-mascot-badge", name: "Badge Style", note: "Cartoon characters stamped into club badges." },
      { id: "vintage-athletic", name: "Vintage Athletic Club", note: "Clubhouse graphics from the track and the court." },
      { id: "loud", name: "Loud Belief", note: "Big type, bold colour, nothing quiet." },
      { id: "matisse-cut-out", name: "Matisse Cut Out", note: "Paper shapes, cut by hand, in flat colour." },
      { id: "creed-type", name: "Creed Type", note: "Words to live by, lettered by hand." },
    ],
  },

  // Fit (size.html): the size recommendation, after the design (or after "Keep it plain", once that page leads here).
  size: {
    eyebrow: "Your fit",
    title: "Find your",     // shown as FIND YOUR FIT
    titleSerif: "fit",
    intro: "Enter your height and weight, and we will recommend the size that suits you.",
    heightLabel: "Height",
    weightLabel: "Weight",
    button: "Find my size",
    resultLabel: "Recommended size",
    continueLabel: "Continue",
    next: "packaging.html", // the packaging page
    sizes: ["M", "L", "XL"],
    // The sizing rules. Each rule names a size and the heights (cm) and weights (kg) it fits, both ends included:
    //   { size: "M", height: [165, 175], weight: [55, 70] },
    // They are read from top to bottom; the first rule that fits both measurements gives the size.
    // Leave the list empty until the official sizing data is in: the page then says so instead of guessing.
    rules: [],
    found: "Based on your height and weight.",
    awaiting: "Our size guide is being finalised. Your measurements are saved, and your recommended size will appear here once the official sizing data is added.",
    outside: "We cannot recommend a size reliably for these measurements yet. Contact us and we will help you choose.",
    // what the fields accept; anything outside is taken as a typing mistake
    limits: { height: [120, 230], weight: [30, 250] },
  },

  // Packaging (packaging.html): after the fit.
  packaging: {
    eyebrow: "Packaging",
    title: "Choose your",
    titleSerif: "packaging",
    intro: "How your shirt reaches you.",
    selectLabel: "Select this package",
    selectedLabel: "Selected",
    continueLabel: "Continue",
    // Address of the order details page. It is not built yet: while this is empty, Continue only
    // saves the choice and shows keptNote.
    next: "",
    keptNote: "Saved — ordering opens soon.",
    // status "available" can be chosen; "soon" is shown dimmed, under frosted glass, and cannot be chosen.
    // "image": a photograph of the packaging (until there is one, the page shows a drawing).
    // "photoNote": the small line under the drawing while there is no photograph; empty it ("") to hide it.
    options: [
      { id: "box", name: "The Belief Project Box", status: "available", note: "", image: "", imageAlt: "The Belief Project box", photoNote: "Photograph of the box coming soon." },
      { id: "alternative", name: "Alternative packaging", status: "soon", note: "A second way to receive your shirt.", soonLabel: "Coming soon", image: "", imageAlt: "" },
    ],
  },

  // Orders
  orders: {
    // Web-app address of the Google script that emails each order (it ends in /exec).
    // Setup steps: backend/order-email/SETUP.md. While this is empty no order can be sent.
    endpoint: "",
  },

  community: {
    eyebrow: "Community",
    // The leather label is shown in place of the written phrase. Empty the "label"
    // line ("") to show the written phrase again.
    label: "assets/img/ever-forward-label.webp",
    title: "Ever forward",
    titleSerif: "/ together",
    supportTitle: "Support",
    support: [
      { id: "help", label: "Help & Support", note: "Orders, sizing, care", url: "" },
      { id: "contact", label: "Contact Us", note: "Write to the team", url: "" }, // e.g. "mailto:you@yourdomain.com"
      { label: "Shipping Prices", note: "How delivery works", url: "" },
      { label: "Size Guide", note: "Find your fit", url: "" },
    ],
  },

  newsletter: {
    eyebrow: "New drops",
    title: "Be first",
    titleSerif: "to know.",
    text: "Early access to new drops, product launches, brand news and special releases.",
    placeholder: "Your email address",
    button: "Subscribe",
    note: "By subscribing you agree to receive emails from Belief Project. You can unsubscribe at any time.",
    success: "You're on the list.",
    // Address of the mailing-list service that stores the emails.
    // While this is empty the form only previews the confirmation and saves nothing.
    endpoint: "",
  },

  // Small icons under the email field. An icon with an empty url is shown but cannot be clicked.
  socials: [
    { name: "Instagram", url: "https://www.instagram.com/beli.efproject?obrf=MXFyejdhd21vb3p0eA==" },
    { name: "TikTok", url: "https://www.tiktok.com/@belief.project?_r=1&_t=ZS-9AO9EZ4O2nF" },
    { name: "YouTube", url: "" },
  ],

  footer: {
    note: "Est. 2026 — Algiers",
  },
};
