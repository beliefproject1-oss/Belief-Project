# Order emails: one-time setup

Every order placed on the site is sent to a small script that lives in your Google account.
The script gives the order its number, saves it in a Google Sheet and emails it to
**ybelhandouz8@gmail.com**. No password or key is stored in the website.

It takes about five minutes. Do it while signed in to Google as **ybelhandouz8@gmail.com**.

## 1. Create the orders sheet

1. Open <https://sheets.new>.
2. Name the spreadsheet `Belief Project Orders`.

## 2. Add the script

1. In the spreadsheet menu choose **Extensions → Apps Script**. A new tab opens.
2. Delete the few lines of code that are already there.
3. Open `Code.gs` (in this folder) in a text editor, copy **all** of it and paste it in.
4. Click the **Save** icon. Click `Untitled project` at the top and name it `Belief Project orders`.

## 3. Give permission and send a first test

1. In the toolbar, pick **sendTestOrder** in the function list and click **Run**.
2. Google asks for permission: **Review permissions** → choose your account →
   **Advanced** → **Go to Belief Project orders (unsafe)** → **Allow**.
   (Google shows that warning for every private script that has not been published; this one is yours.)
3. Check your inbox: an email titled `New order BP-…` should have arrived, and the
   spreadsheet now has an `Orders` tab with one row.

## 4. Put it online

1. Click **Deploy → New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy**.
4. Copy the **Web app URL**. It ends in `/exec`.

## 5. Connect the website

1. Open `content.js` and find `orders`.
2. Paste the address between the quotes of `endpoint`:

   ```js
   orders: {
     endpoint: "https://script.google.com/macros/s/…/exec",
   },
   ```

3. Open `backend/order-email/test.html` through the site (for example
   `http://localhost:4173/backend/order-email/test.html`) and press **Send test order**.
   The page says `Email sent` only when the script confirms the email has left.

## Good to know

- **Order numbers** look like `BP-261010-0042`: the date, then a counter that only goes up.
- **The Orders sheet is your backup.** Its last column says `Sent` or `NOT SENT` for every order.
  If an email could not be sent, the order is still saved there and the customer is not shown a confirmation.
- **Gmail limit:** a free Google account can send about 100 emails a day from a script.
- **Changing the script later** (for example the address in `NOTIFY_TO` at the top): paste the new
  code, then **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**.
  The address stays the same, so the website needs no change.
- This `backend` folder does not need to be uploaded with the site.
