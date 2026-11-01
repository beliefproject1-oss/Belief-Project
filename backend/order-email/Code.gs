/** @OnlyCurrentDoc */

/* Belief Project — order notifications (Google Apps Script).

   This file runs on Google's servers under the Google account that receives the orders, so
   no password or key ever sits in the website. The website posts each order to this script,
   which gives the order its serial number, saves it in the "Orders" sheet, emails it to
   NOTIFY_TO and answers the website with whether that email really left.

   Setup and updating: SETUP.md in this folder. */

const CONFIG = {
  NOTIFY_TO: 'ybelhandouz8@gmail.com', // every order is emailed here
  BRAND: 'Belief Project',
  PREFIX: 'BP',                        // order numbers look like BP-261010-0042
  TIMEZONE: 'Africa/Algiers',
  TIMEZONE_NAME: 'Algiers time',       // written next to every date
  SHEET: 'Orders',
  // the only colours an order may name
  COLORS: {
    'ice-blue': { label: 'Ice Blue', hex: '#C2E2FE' },
    'midnight': { label: 'Midnight', hex: '#010D2C' },
  },
  MAX_ITEMS: 20,
  MAX_QUANTITY: 50,
  MAX_PHOTO_BYTES: 400 * 1024,
};

const HEADERS = ['Order number', 'Received', 'Name', 'Email', 'Phone', 'Other details', 'Items', 'Pieces', 'Summary', 'Notes', 'Notification email'];
const EMAIL_STATUS_COLUMN = HEADERS.length;

/* ---------- web app ---------- */

// Opening the web-app address in a browser shows that the script is deployed and reachable.
function doGet() {
  return json_({ ok: true, service: CONFIG.BRAND + ' orders' });
}

// One order in, one answer out. "ok" is true only when the notification email has left.
function doPost(e) {
  let order;
  try {
    order = readOrder_(e);
  } catch (err) {
    return json_({ ok: false, error: err.code || 'invalid_order', message: err.code ? err.message : 'The order could not be read.' });
  }

  // one order at a time, so two orders can never share a number
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json_({ ok: false, error: 'busy', message: 'The order service is busy. Please try again.' });
  }
  try {
    return json_(handle_(order));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'not_saved', message: 'The order could not be saved. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

function handle_(order) {
  // The same submission arriving twice (a double tap, a retry on a slow connection) keeps its
  // first number and its first row; only an email that failed is attempted again.
  const cache = CacheService.getScriptCache();
  const key = order.clientRef ? 'order:' + order.clientRef : '';
  let entry = key ? JSON.parse(cache.get(key) || 'null') : null;
  const isNew = !entry;
  if (isNew) {
    entry = {
      number: nextNumber_(),
      received: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'd MMM yyyy, HH:mm'),
      sent: false,
    };
  }
  order.number = entry.number;
  order.received = entry.received;
  if (isNew) entry.row = saveOrder_(order);

  if (!entry.sent) {
    try {
      sendOrderEmail_(order);
      entry.sent = true;
      markEmail_(entry.row, 'Sent');
    } catch (err) {
      console.error(err);
      markEmail_(entry.row, 'NOT SENT: ' + err.message);
    }
  }
  if (key) cache.put(key, JSON.stringify(entry), 21600);

  return entry.sent
    ? { ok: true, orderNumber: entry.number, emailSent: true }
    : { ok: false, error: 'email_failed', orderNumber: entry.number, emailSent: false, message: 'The order was saved, but its notification email could not be sent.' };
}

// Run this once from the editor (choose sendTestOrder, then Run). Google asks for permission
// the first time; after that a sample order arrives at NOTIFY_TO and appears in the sheet.
function sendTestOrder() {
  const answer = doPost({
    postData: {
      contents: JSON.stringify({
        customer: { name: 'Test Customer', email: CONFIG.NOTIFY_TO, phone: '+213 555 00 00 00', city: 'Algiers' },
        items: [{ product: 'T-shirt', color: 'ice-blue', size: 'M', quantity: 1, customization: { Note: 'Sample order sent from the script editor' } }],
        notes: 'This is a test. No real order was placed.',
      }),
    },
  });
  console.log(answer.getContent());
}

/* ---------- reading and checking an order ---------- */

function refusal_(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function readOrder_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) throw refusal_('empty', 'No order was received.');
  if (raw.length > 4 * 1024 * 1024) throw refusal_('too_large', 'The order is too large.');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw refusal_('unreadable', 'The order could not be read.');
  }
  return cleanOrder_(data);
}

// Everything the website sends is treated as untrusted text: trimmed, shortened and checked here.
function cleanOrder_(data) {
  if (!data || typeof data !== 'object') throw refusal_('unreadable', 'The order could not be read.');
  // "website" is a field no person ever sees or fills in; only automated spam does
  if (text_(data.website, 200)) throw refusal_('rejected', 'The order was not accepted.');

  const given = data.customer && typeof data.customer === 'object' ? data.customer : {};
  const customer = { name: text_(given.name, 120), email: text_(given.email, 160), phone: text_(given.phone, 40), details: [] };
  if (!customer.name) throw refusal_('missing_name', 'The customer name is missing.');
  if (!customer.email && !customer.phone) throw refusal_('missing_contact', 'An email address or a phone number is needed.');
  if (customer.email && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(customer.email)) throw refusal_('bad_email', 'The email address is not valid.');
  // anything else collected at checkout (address, city, …) is carried through as it is
  customer.details = pairs_(given, ['name', 'email', 'phone']);

  const items = (Array.isArray(data.items) ? data.items : []).slice(0, CONFIG.MAX_ITEMS).map(cleanItem_);
  if (!items.length) throw refusal_('no_items', 'The order has no items.');

  return {
    clientRef: text_(data.clientRef, 64).replace(/[^A-Za-z0-9_-]/g, ''),
    customer: customer,
    items: items,
    summary: pairs_(data.summary, []),
    notes: text_(data.notes, 1000),
  };
}

function cleanItem_(item, index) {
  item = item && typeof item === 'object' ? item : {};
  const color = CONFIG.COLORS[text_(item.color, 40).toLowerCase().replace(/[\s_]+/g, '-')];
  if (!color) throw refusal_('bad_color', 'The colour must be Ice Blue or Midnight.');
  const size = text_(item.size, 20);
  if (!size) throw refusal_('missing_size', 'A size is missing.');
  const quantity = Math.floor(Number(item.quantity));
  if (!(quantity >= 1 && quantity <= CONFIG.MAX_QUANTITY)) throw refusal_('bad_quantity', 'A quantity is not valid.');
  const custom = typeof item.customization === 'string'
    ? (text_(item.customization, 400) ? [['Customisation', text_(item.customization, 400)]] : [])
    : pairs_(item.customization, []);
  return {
    product: text_(item.product, 120) || 'T-shirt',
    color: color.label,
    hex: color.hex,
    size: size,
    quantity: quantity,
    custom: custom,
    photo: index < 8 ? photo_(item.photo) : null,
  };
}

// The product photograph arrives from the order page as a small JPEG or PNG. A photo that is
// missing or unusable never stops the order: the email simply goes out without it.
function photo_(value) {
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(typeof value === 'string' ? value : '');
  if (!match || match[2].length * 0.75 > CONFIG.MAX_PHOTO_BYTES) return null;
  return { type: 'image/' + match[1], ext: match[1] === 'png' ? 'png' : 'jpg', data: match[2] };
}

// { deliveryAddress: "…" } becomes [["Delivery address", "…"]]
function pairs_(source, skip) {
  if (!source || typeof source !== 'object') return [];
  const out = [];
  Object.keys(source).forEach(function (key) {
    if (skip.indexOf(key) !== -1 || out.length >= 12) return;
    const value = text_(source[key], 400);
    if (value) out.push([label_(key), value]);
  });
  return out;
}

function label_(key) {
  const words = text_(key, 60).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function text_(value, max) {
  if (value == null || typeof value === 'object') return '';
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

/* ---------- serial number and the Orders sheet ---------- */

// A counter that only ever goes up, so no two orders share a number: BP-<yymmdd>-<count>.
function nextNumber_() {
  const props = PropertiesService.getScriptProperties();
  const count = Number(props.getProperty('ORDER_COUNT') || 0) + 1;
  props.setProperty('ORDER_COUNT', String(count));
  const day = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyMMdd');
  return CONFIG.PREFIX + '-' + day + '-' + String(count).padStart(4, '0');
}

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open this script from the orders spreadsheet (Extensions > Apps Script).');
  let sheet = book.getSheetByName(CONFIG.SHEET);
  if (!sheet) {
    sheet = book.insertSheet(CONFIG.SHEET);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveOrder_(order) {
  const sheet = sheet_();
  const lines = pair => pair[0] + ': ' + pair[1];
  sheet.appendRow([
    order.number,
    order.received,
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.customer.details.map(lines).join('\n'),
    order.items.map(itemLine_).join('\n'),
    pieces_(order),
    order.summary.map(lines).join('\n'),
    order.notes,
    'Pending',
  ].map(cell_));
  return sheet.getLastRow();
}

// Text that begins like a formula is stored as plain text, never run by the sheet.
function cell_(value) {
  return typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function markEmail_(row, status) {
  try {
    sheet_().getRange(row, EMAIL_STATUS_COLUMN).setValue(cell_(status));
  } catch (err) {
    console.error(err);
  }
}

function pieces_(order) {
  return order.items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
}

function itemLine_(item) {
  const extra = item.custom.map(function (pair) { return pair[0] + ': ' + pair[1]; }).join('; ');
  return item.quantity + ' × ' + item.product + ' — ' + item.color + ', size ' + item.size + (extra ? ' (' + extra + ')' : '');
}

/* ---------- the email ---------- */

function sendOrderEmail_(order) {
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error("today's Gmail sending limit has been reached");
  const images = { logo: Utilities.newBlob(Utilities.base64Decode(LOGO_PNG_), 'image/png', 'belief-project.png') };
  order.items.forEach(function (item, i) {
    if (!item.photo) return;
    try {
      images['item' + i] = Utilities.newBlob(Utilities.base64Decode(item.photo.data), item.photo.type, 'item-' + (i + 1) + '.' + item.photo.ext);
    } catch (err) {
      item.photo = null; // an unreadable photo is left out rather than stopping the email
    }
  });
  const mail = orderEmail_(order);
  const message = {
    to: CONFIG.NOTIFY_TO,
    subject: mail.subject,
    body: mail.text,
    htmlBody: mail.html,
    inlineImages: images,
    name: CONFIG.BRAND + ' Orders',
  };
  if (order.customer.email) message.replyTo = order.customer.email; // Reply writes to the customer
  MailApp.sendEmail(message);
}

function esc_(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Builds the subject, the HTML and the plain-text version of one order's email.
// Images are referred to as cid:logo and cid:item0, cid:item1 …; sendOrderEmail_ attaches them.
function orderEmail_(order) {
  const INK = '#010D2C', SOFT = '#525A70', LINE = '#E1E9F3', ICY = '#F3F9FF';
  const SANS = "font-family:Aeonik,'Helvetica Neue',Helvetica,Arial,sans-serif;";
  const SERIF = "font-family:Canela,Georgia,'Times New Roman',serif;";
  const EYEBROW = SANS + 'font-size:11px;line-height:1.5;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:' + SOFT + ';';
  const PAD = 'padding-left:36px;padding-right:36px;';

  const pieces = pieces_(order);
  const first = order.items[0];
  const subject = 'New order ' + order.number + ' — ' + (order.items.length === 1
    ? first.quantity + ' × ' + first.product + ', ' + first.color + ' (' + first.size + ')'
    : pieces + ' pieces');

  const row = function (label, value) {
    return '<tr>' +
      '<td valign="top" style="' + EYEBROW + 'padding:8px 18px 8px 0;white-space:nowrap;width:1%">' + esc_(label) + '</td>' +
      '<td valign="top" style="' + SANS + 'font-size:15px;line-height:1.45;color:' + INK + ';padding:6px 0;word-break:break-word">' + value + '</td>' +
      '</tr>';
  };
  const rows = function (list) { return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + list.join('') + '</table>'; };
  const rule = '<tr><td class="bp-pad" style="' + PAD + '"><div style="border-top:1px solid ' + LINE + ';font-size:0;line-height:0">&nbsp;</div></td></tr>';
  const section = function (title, body) {
    return rule + '<tr><td class="bp-pad" style="' + PAD + 'padding-top:26px;padding-bottom:28px">' +
      '<div style="' + EYEBROW + 'padding-bottom:10px">' + esc_(title) + '</div>' + body + '</td></tr>';
  };
  const swatch = function (item) {
    return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + item.hex + ';border:1px solid #B5C6DA;vertical-align:-1px;margin-right:8px">&nbsp;</span>' + esc_(item.color);
  };
  const link = function (href, label) { return '<a href="' + esc_(href) + '" style="color:' + INK + ';text-decoration:underline">' + esc_(label) + '</a>'; };

  const items = order.items.map(function (item, i) {
    const picture = item.photo
      ? '<img src="cid:item' + i + '" width="200" alt="' + esc_(item.product + ' in ' + item.color) + '" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:14px">'
      : '<div style="height:150px;border-radius:14px;background:' + item.hex + ';border:1px solid ' + LINE + ';font-size:0;line-height:0">&nbsp;</div>';
    const details = [row('Colour', swatch(item)), row('Size', esc_(item.size)), row('Quantity', String(item.quantity))]
      .concat(item.custom.map(function (pair) { return row(pair[0], esc_(pair[1])); }));
    return rule + '<tr><td class="bp-pad" style="' + PAD + 'padding-top:26px;padding-bottom:28px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td class="bp-col bp-photo" width="38%" valign="top" style="width:38%;padding:0 24px 0 0">' + picture + '</td>' +
      '<td class="bp-col" valign="top">' +
      '<div style="' + EYEBROW + '">' + (order.items.length > 1 ? 'Item ' + (i + 1) + ' of ' + order.items.length : 'Product') + '</div>' +
      '<div style="' + SANS + 'font-size:22px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:' + INK + ';padding:4px 0 10px">' + esc_(item.product) + '</div>' +
      rows(details) +
      (item.photo ? '' : '<div style="' + SERIF + 'font-style:italic;font-size:14px;line-height:1.4;color:' + SOFT + ';padding-top:8px">No photograph was sent with this item.</div>') +
      '</td></tr></table></td></tr>';
  }).join('');

  const customer = [row('Name', esc_(order.customer.name))];
  if (order.customer.email) customer.push(row('Email', link('mailto:' + order.customer.email, order.customer.email)));
  if (order.customer.phone) customer.push(row('Phone', link('tel:' + order.customer.phone.replace(/[^+\d]/g, ''), order.customer.phone)));
  order.customer.details.forEach(function (pair) { customer.push(row(pair[0], esc_(pair[1]))); });

  const summary = [row('Order', esc_(order.number)), row('Received', esc_(order.received + ' (' + CONFIG.TIMEZONE_NAME + ')'))];
  order.items.forEach(function (item, i) { summary.push(row(order.items.length > 1 ? 'Item ' + (i + 1) : 'Item', esc_(itemLine_(item)))); });
  summary.push(row('Pieces', String(pieces)));
  order.summary.forEach(function (pair) { summary.push(row(pair[0], esc_(pair[1]))); });
  if (order.notes) summary.push(row('Notes', esc_(order.notes).replace(/\n/g, '<br>')));

  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">' +
    '<title>' + esc_(subject) + '</title>' +
    '<style>@media (max-width:520px){' +
    '.bp-pad{padding-left:22px!important;padding-right:22px!important}' +
    '.bp-col{display:block!important;width:100%!important;box-sizing:border-box}' +
    '.bp-photo{padding:0 0 20px!important}' +
    '.bp-number{font-size:27px!important}' +
    '}</style></head>' +
    '<body style="margin:0;padding:0;background:' + ICY + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' + ICY + '">' + esc_(order.customer.name + ' · ' + order.items.map(itemLine_).join(' · ')) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + ICY + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#FFFFFF;border:1px solid ' + LINE + ';border-radius:22px">' +

    '<tr><td class="bp-pad" style="' + PAD + 'padding-top:32px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td align="left" valign="middle"><img src="cid:logo" width="150" alt="' + esc_(CONFIG.BRAND) + '" style="display:block;width:150px;height:auto;border:0"></td>' +
    '<td align="right" valign="middle" style="' + EYEBROW + '">New order</td>' +
    '</tr></table></td></tr>' +

    '<tr><td class="bp-pad" style="' + PAD + 'padding-top:34px;padding-bottom:30px">' +
    '<div style="' + EYEBROW + '">Order number</div>' +
    '<div class="bp-number" style="' + SANS + 'font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-.02em;color:' + INK + ';padding-top:6px">' + esc_(order.number) + '</div>' +
    '<div style="' + SERIF + 'font-style:italic;font-size:17px;line-height:1.4;color:' + SOFT + ';padding-top:8px">Received ' + esc_(order.received + ', ' + CONFIG.TIMEZONE_NAME) + '</div>' +
    '</td></tr>' +

    items +
    section('Customer', rows(customer)) +
    section('Order summary', rows(summary)) +

    '</table>' +
    '<div style="' + SANS + 'max-width:540px;font-size:12px;line-height:1.6;color:' + SOFT + ';padding:18px 12px 0">' +
    'Sent automatically by the ' + esc_(CONFIG.BRAND) + ' website when order ' + esc_(order.number) + ' was submitted.' +
    (order.customer.email ? ' Reply to this email to write to the customer.' : '') +
    '</div>' +
    '</td></tr></table></body></html>';

  const pairText = function (pair) { return pair[0] + ': ' + pair[1]; };
  const text = [
    'NEW ORDER ' + order.number,
    'Received ' + order.received + ' (' + CONFIG.TIMEZONE_NAME + ')',
    '',
    'ITEMS',
  ].concat(order.items.map(itemLine_), [
    'Pieces: ' + pieces,
    '',
    'CUSTOMER',
    'Name: ' + order.customer.name,
  ], order.customer.email ? ['Email: ' + order.customer.email] : [],
  order.customer.phone ? ['Phone: ' + order.customer.phone] : [],
  order.customer.details.map(pairText),
  order.summary.length ? [''].concat(order.summary.map(pairText)) : [],
  order.notes ? ['', 'NOTES', order.notes] : []).join('\n');

  return { subject: subject, html: html, text: text };
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

// The official wordmark as a small PNG, shown at the top of the email.
const LOGO_PNG_ = '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';
