# Orders and newsletter: one-time setup

Every order placed on the site, and every newsletter sign-up, is sent to a small script that lives in your Google
account (`Code.gs`). The script:

- saves each **order** in your Notion **Orders** database (status *Pending*), keeps a backup row in a Google Sheet and
  emails it to **ybelhandouz8@gmail.com**;
- saves each **newsletter sign-up** in your Notion **Newsletter** database, once per address.

The website shows "order confirmed" or "you're on the list" only when the script answers that it really saved it.
No password or key is stored in the website: the Notion key lives in the script's private settings.

It takes about fifteen minutes. Do the Google steps signed in to Google as **ybelhandouz8@gmail.com**, and the Notion
steps signed in to Notion as **Souabamouche@gmail.com** (the workspace the orders should arrive in). The script refuses
orders until Notion is connected, so nothing is ever confirmed to a customer before it is in Notion.

## 1. Create the orders sheet and add the script

1. Open <https://sheets.new> and name the spreadsheet `Belief Project Orders`.
2. In its menu choose **Extensions → Apps Script**. A new tab opens.
3. Delete the few lines of code that are already there, paste **all** of `Code.gs` (in this folder), click **Save**,
   and name the project `Belief Project orders`.

## 2. Connect Notion

1. Signed in to Notion as **Souabamouche@gmail.com**, go to <https://www.notion.so/profile/integrations> →
   **New integration**. Name it `Belief Project website`, choose that workspace, type **Internal**. Save, then under
   **Capabilities** make sure *Read content*, *Update content* and *Insert content* are ticked, and copy its
   **Internal Integration Secret** (it starts with `ntn_`). Keep it private: it goes only into step 4 below, never in
   the website, an email or a chat.
2. In Notion, create an empty page called `Belief Project` (the two databases will be created inside it).
   On that page click **•••** → **Connections** → **Connect to** → `Belief Project website`.
3. Copy the page's link (**•••** → **Copy link**).
4. Back in Apps Script, click the gear (**Project Settings**) → **Script Properties** → **Add script property**, and add:
   - `NOTION_TOKEN` — the secret from step 1
   - `NOTION_PARENT_PAGE` — the page link from step 3
5. In the editor, pick **setupNotion** in the function list and click **Run**. Google asks for permission the first
   time: **Review permissions** → your account → **Advanced** → **Go to Belief Project orders (unsafe)** → **Allow**
   (Google shows that warning for every private script; this one is yours).
   Two databases appear in your Notion page: **Belief Project — Orders** and **Belief Project — Newsletter**.
   If it stops with *Notion 404*, the page is not connected to the integration yet (step 2.2).
6. Run **checkNotion** any time to see whether the key works and both databases can be reached.

## 3. Try it

1. Run **sendTestOrder**: a test order appears in the Notion Orders database (status *Pending*), in the sheet, and
   in your inbox.
2. Run **testNewsletter**: `newsletter-test@example.com` appears in the Newsletter database. Run it again: it is not
   added twice. Delete the test entries in Notion when you are done.

## 4. Put it online

1. Click **Deploy → New deployment**, the gear next to **Select type** → **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

## 5. Connect the website

In `content.js`, paste that address in **both** places:

```js
orders: {
  endpoint: "https://script.google.com/macros/s/…/exec",
},
…
newsletter: {
  …
  endpoint: "https://script.google.com/macros/s/…/exec",
},
```

Then place a test order on the site: the confirmation page opens only once the order is in Notion.

## Good to know

- **What each order holds in Notion**: order reference, status (*Pending* to start; also Confirmed, Shipped, Delivered,
  Cancelled), order date, first and family name, phone, second phone, email, wilaya, commune, full address, delivery
  instructions, colour, size, design and its collection, customisation, packaging, delivery method, shipping price,
  T-shirt price, total, weight and height, whether the email went out, and the website's own reference for the order.
  Fields the customer left empty stay empty.
- **Order references** look like `BP-261101-0042`: the date, then a counter that only goes up.
- **No double orders.** Every order carries its own reference from the website; pressing Confirm twice, or a retry on a
  slow connection, finds the first order again instead of creating a second one.
- **Shipping "on request".** Wilayas without a price on the delivery list are sent with *Shipping on request* ticked
  and no total: call the customer to agree the delivery price.
- **If the email fails** (for example Gmail's limit of about 100 a day), the order is still saved and the customer
  still sees their confirmation; the order's *Email sent* box in Notion stays unticked so you can follow it up.
- **Changing the script later**: paste the new code, then **Deploy → Manage deployments → pencil icon →
  Version: New version → Deploy**. The address stays the same, so the website needs no change.
- This `backend` folder does not need to be uploaded with the site.
