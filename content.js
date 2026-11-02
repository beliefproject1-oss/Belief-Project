/* Belief Project — site content.
   This is the only file you need to edit day to day: change the text between
   the quotes, save, and refresh the page. Leave a "url" empty ("") to show the
   item without a link until the real one is ready. */
window.BELIEF = {
  // Text repeated in the moving strip at the very top.
  marquee: "Belief Project",

  hero: {
    video: "assets/video/hero.mp4?v=5e3e2512",             // wide video for desktop and tablet (1080p)
    videoMobile: "assets/video/hero-720.mp4?v=53814207",   // lighter copy for phones held upright
    poster: "assets/video/hero-poster.jpg?v=968bc0ec",     // still image shown while the video loads
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
    image: "assets/img/custom-wide.webp?v=6a6e67e4",          // photo for desktop and tablet
    imageMobile: "assets/img/custom-mobile.webp?v=1323f5f9",  // upright photo for phones
    imageAlt: "Two models in Belief Project shirts and wide jeans: one in Midnight facing forward, one in Ice Blue seen from behind",
    focus: "50% 22%",                              // the part of the photo kept in view when it is cropped
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
    // "imageWide" is used on phones held upright, where the halves are stacked and wider than tall.
    // "focus" is the part of the photo that stays in view when it is cropped: across, then down (0% = left / top).
    // The same models wear the shirt in the design studio (tools/studio.config.js).
    colors: [
      { id: "ice-blue", label: "Ice Blue", image: "assets/img/tee-ice-blue.webp?v=d677f57e", imageWide: "assets/img/tee-ice-blue-wide.webp?v=e4e9d5e9", imageAlt: "Model seen from behind in the Ice Blue Belief Project shirt and light jeans", focus: "52% 30%", focusWide: "50% 30%" },
      { id: "midnight", label: "Midnight", image: "assets/img/tee-midnight.webp?v=7080d66c", imageWide: "assets/img/tee-midnight-wide.webp?v=c1a90543", imageAlt: "Model seated with his back to the camera in the Midnight Belief Project shirt", focus: "62% 40%", focusWide: "60% 40%" },
    ],
  },

  // Prices of the shirt, in dinars, shown once the colour is chosen (customize.html), in the studio and at checkout.
  prices: {
    currency: "DA",
    plainLabel: "Without design",
    plain: 3900,
    printedLabel: "With design",
    printed: 4900,
  },

  // Plain or printed (customize.html): the step after the colour
  customize: {
    title: "Plain or",      // read out by screen readers, not shown
    titleSerif: "printed",
    plainEyebrow: "01 — Plain",
    plainLabel: "Keep it plain",
    printEyebrow: "02 — Printed",
    printLabel: "Add artwork",
    // Where Plain leads: the fit page. Empty ("") = choosing Plain only marks it and shows plainSoon.
    plainNext: "size.html",
    plainSoon: "The plain shirt opens soon",
    printNext: "studio.html", // the design studio
  },

  // Design studio (studio.html): artwork printed on the back of the shirt, worn by the model of the chosen colour.
  // The designs come from assets/designs/designs.js, made by tools/prepare-designs.js from the images in
  // designs-source/ (see tools/README.md). Every design is shown cut out, without the background of its image.
  studio: {
    eyebrow: "Design studio",
    title: "Six",
    titleSerif: "directions",
    // Small line under the title. Empty it ("") to hide it.
    note: "",
    empty: "Choose a design",
    areaLabel: "Print area",      // on the shirt while no design is chosen
    creditLabel: "Artwork by",    // before a design's credit (tools/designs.config.js)
    printLabel: "Back print",
    keepLabel: "Choose this design",
    allLabel: "All directions",     // the way back from a direction to the six cards
    pickedLabel: "Your design",     // on the card of the direction the chosen design belongs to
    // Address of the page that opens once a design is chosen (?color=…&design=…): the fit.
    // Empty ("") = the button only saves the choice and shows keptNote.
    next: "size.html",
    keptNote: "Saved.",
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

  // Sizes. One recommendation, used by the Size Guide window on the homepage and by the Find Your Fit page.
  // Weight decides: each rule names a size and the weights (kg) it fits, both ends included; an empty upper end
  // (null) means "and above". A weight that no rule covers gets no size: the customer is asked to contact us.
  // Height is asked for and kept with the order, but never changes the recommendation.
  size: {
    eyebrow: "Your fit",
    title: "Find your",     // shown as FIND YOUR FIT
    titleSerif: "fit",
    intro: "Enter your weight, and your height if you like: we will recommend the size that suits you.",
    heightLabel: "Height",
    weightLabel: "Weight",
    optional: "Optional",
    button: "Find my size",
    resultLabel: "Recommended size",
    continueLabel: "Continue",
    next: "packaging.html", // the packaging page
    sizes: ["M", "L", "XL"],
    rules: [
      { size: "M", weight: [50, 60] },
      { size: "L", weight: [70, 80] },
      { size: "XL", weight: [85, null] },
    ],
    found: "Based on your weight.",
    outside: "We can't recommend a size for this weight automatically. Message us on WhatsApp and we'll help you choose.",
    outsideAction: "Ask on WhatsApp",
    // what the fields accept; anything outside is taken as a typing mistake
    limits: { height: [120, 230], weight: [30, 250] },
    guideTitle: "Size guide",
    guideIntro: "Your weight decides the size. Enter it below for an instant recommendation.",
    table: "Weight → size",
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
    next: "order.html", // the order details page
    keptNote: "Saved.",
    // status "available" can be chosen; "unavailable" is shown blurred, cannot be chosen, and flashes red when tried.
    // "image" is the large picture, "imageSmall" an optional lighter one for phones. The zipper bag picture is made by
    // tools/prepare-packaging.js from the photographs of the bag and the shirt.
    options: [
      { id: "zipper-bag", name: "Zipper Bag", status: "available", note: "Frosted zipper bag printed with the Belief Project bear, your shirt folded inside.", image: "assets/img/pack-zipper-bag-photo.webp?v=30b6927a", imageSmall: "assets/img/pack-zipper-bag-photo-sm.webp?v=3a1a9d3c", imageAlt: "A Midnight and an Ice Blue Belief Project T-shirt, each folded in its frosted zipper bag printed with the Belief Project wordmark and the bear, beside the two shirts folded with their neck labels showing", statusLabel: "Available" },
      { id: "luxury-box", name: "Luxury Box", status: "unavailable", note: "Rigid Midnight box with the Belief Project wordmark.", image: "assets/img/pack-luxury-box.webp?v=dd95fd31", imageAlt: "The Midnight Belief Project luxury box", statusLabel: "Unavailable", unavailableLabel: "Unavailable for now", unavailableMessage: "The Luxury Box isn't available yet. It's coming soon." },
    ],
  },

  // Shipping prices, in dinars, for home delivery and for stop desk delivery: [number, wilaya, home, stop desk].
  // These are the discounted prices from the delivery price list, shown exactly as given. A wilaya whose prices
  // are not on the list yet has null: the site shows "on request" and the price is confirmed with the customer.
  shipping: {
    title: "Shipping prices",
    intro: "Delivery to all 69 wilayas. Prices include our 15% delivery discount.",
    methods: { home: "Home delivery", desk: "Stop desk" },
    onRequest: "On request",
    onRequestNote: "Not on the price list yet: we confirm the delivery price with you by phone.",
    searchLabel: "Find your wilaya",
    wilayas: [
      [1, "Adrar", 1000, 600],
      [2, "Chlef", 550, 300],
      [3, "Laghouat", 600, 400],
      [4, "Oum El Bouaghi", 550, 300],
      [5, "Batna", 550, 300],
      [6, "Béjaïa", 550, 300],
      [7, "Biskra", 600, 300],
      [8, "Béchar", 1000, 700],
      [9, "Blida", 450, 300],
      [10, "Bouira", 500, 300],
      [11, "Tamanrasset", null, null],
      [12, "Tébessa", 550, 300],
      [13, "Tlemcen", 550, 300],
      [14, "Tiaret", 550, 300],
      [15, "Tizi Ouzou", 500, 300],
      [16, "Alger", 350, 250],
      [17, "Djelfa", 600, 400],
      [18, "Jijel", 550, 300],
      [19, "Sétif", 500, 300],
      [20, "Saïda", 600, 400],
      [21, "Skikda", 600, 400],
      [22, "Sidi Bel Abbès", 550, 300],
      [23, "Annaba", 550, 300],
      [24, "Guelma", 550, 300],
      [25, "Constantine", 500, 300],
      [26, "Médéa", 550, 300],
      [27, "Mostaganem", 550, 300],
      [28, "M'Sila", 550, 300],
      [29, "Mascara", 600, 400],
      [30, "Ouargla", 650, 450],
      [31, "Oran", 500, 300],
      [32, "El Bayadh", 650, 450],
      [33, "Illizi", null, null],
      [34, "Bordj Bou Arreridj", 500, 300],
      [35, "Boumerdès", 500, 300],
      [36, "El Tarf", 600, 400],
      [37, "Tindouf", null, null],
      [38, "Tissemsilt", 550, 350],
      [39, "El Oued", 650, 450],
      [40, "Khenchela", 600, 400],
      [41, "Souk Ahras", 550, 300],
      [42, "Tipaza", 500, 300],
      [43, "Mila", 550, 300],
      [44, "Aïn Defla", 550, 300],
      [45, "Naâma", 650, 450],
      [46, "Aïn Témouchent", 550, 300],
      [47, "Ghardaïa", 650, 450],
      [48, "Relizane", 550, 300],
      [49, "Timimoun", null, null],
      [50, "Bordj Badji Mokhtar", null, null],
      [51, "Ouled Djellal", null, null],
      [52, "Béni Abbès", null, null],
      [53, "In Salah", null, null],
      [54, "In Guezzam", null, null],
      [55, "Touggourt", 650, 450],
      [56, "Djanet", null, null],
      [57, "El M'Ghair", 650, 450],
      [58, "El Meniaa", 650, 450],
      [59, "Aflou", null, null],
      [60, "Barika", null, null],
      [61, "El Kantara", null, null],
      [62, "Bir El Ater", null, null],
      [63, "El Aricha", null, null],
      [64, "Ksar Chellala", null, null],
      [65, "Aïn Oussera", null, null],
      [66, "Messaad", null, null],
      [67, "Ksar El Boukhari", null, null],
      [68, "Bou Saâda", null, null],
      [69, "El Abiodh Sidi Cheikh", null, null],
    ],
  },

  // How customers reach us. WhatsApp opens a chat with the number; Contact Us opens a window with the email address
  // and ways to write: in Gmail, in the mail app, or by copying it.
  contact: {
    whatsappNumber: "0772 06 45 77",
    whatsapp: "https://wa.me/213772064577",
    email: "beliefproject1@gmail.com",
    emailSubject: "Belief Project — Customer inquiry",
  },

  // Order details (order.html) and the confirmation (confirmation.html)
  order: {
    eyebrow: "Order details",
    title: "Your",
    titleSerif: "details",
    intro: "We deliver everywhere in Algeria and call you to confirm before we ship.",
    confirmLabel: "Confirm order",
    sendingLabel: "Sending your order…",
    notConnected: "Ordering isn't connected yet, so this order can't be placed. Please message us on WhatsApp to order.",
    failed: "Your order couldn't be sent. Please check your connection and try again.",
    thanks: "Thank you for believing with us. We'll call you to confirm your order before it ships.",
  },

  // Orders and newsletter sign-ups are both sent to the Google script in backend/order-email, which saves them in
  // Notion (and emails each order). Paste its web-app address (it ends in /exec) in both places below.
  // Setup steps: backend/order-email/SETUP.md. While an address is empty, nothing can be sent and the page says so.
  orders: {
    endpoint: "https://script.google.com/macros/s/AKfycbyYpEJNmkQSf6DVmHmzuE1PcyCueschEp_IBDPSUQ-IB-VZo_sK2hhQ3jmLf-xVlnTV/exec",
  },

  community: {
    eyebrow: "Community",
    // The leather label is shown in place of the written phrase. Empty the "label"
    // line ("") to show the written phrase again.
    label: "assets/img/ever-forward-label.webp?v=ec44059d",
    title: "Ever forward",
    titleSerif: "/ together",
    supportTitle: "Support",
    // "url" makes a row a link; "action" opens a window on the page instead ("shipping", "size", "contact").
    support: [
      { id: "help", label: "Help & Support", note: "WhatsApp · 0772 06 45 77", url: "https://wa.me/213772064577" },
      { id: "contact", label: "Contact Us", note: "beliefproject1@gmail.com", action: "contact" },
      { id: "shipping", label: "Shipping Prices", note: "All 69 wilayas", action: "shipping" },
      { id: "size-guide", label: "Size Guide", note: "Find your size by weight", action: "size" },
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
    already: "You're already on the list.",
    notConnected: "Sign-ups open soon: we can't save your email just yet.",
    failed: "We couldn't save your email. Please try again in a moment.",
    // The same web-app address as orders.endpoint (see above). While this is empty nothing is saved.
    endpoint: "",
  },

  // Small icons under the email field. An icon with an empty url is shown but cannot be clicked.
  socials: [
    { name: "Instagram", url: "https://www.instagram.com/belief__project?srtk=MXFyejdhd21vb3p0eA==" },
    { name: "TikTok", url: "https://www.tiktok.com/@belief.project?_r=1&_t=ZS-9AO9EZ4O2nF" },
    { name: "YouTube", url: "" },
  ],

  footer: {
    note: "Est. 2026 — Algiers",
  },
};
