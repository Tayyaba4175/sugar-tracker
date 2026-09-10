# Google Sheet sync

Makes your "sugar record" Google Sheet the shared home for every reading:
add, edit, or delete an entry on any device and it's saved straight to the
Sheet, and every device that opens the page loads its list from that same
Sheet — so your phone and your laptop always show the same log. No
Cloudflare account needed and no GitHub sync required — this uses only
your Google account.

## Deploy (5 minutes, all inside Google Sheets)

1. Open the "sugar record" spreadsheet.
2. **Extensions > Apps Script.** A new tab opens with a blank script editor.
3. Delete the placeholder `function myFunction() {}` code and paste in the
   contents of `Code.gs` from this folder.
4. Click the **Save** icon (or Ctrl/Cmd+S).
5. Click **Deploy > New deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
   (This just means "anyone with the secret URL can call it" — the
   `SHARED_SECRET` check in the code is what actually gates writes.)
8. Click **Deploy**. Google will ask you to authorize the script the first
   time — click **Authorize access**, choose your account, click **Advanced**
   if it warns the app isn't verified (it's your own script), then
   **Go to (project name) (unsafe)**, then **Allow**.
9. Copy the **Web app URL** it gives you (ends in `/exec`).
10. Paste that URL into `index.html` — find this line near the top of the
    `<script>` block:
    ```js
    var GOOGLE_SHEET_SYNC_URL = ""; // <-- paste your Apps Script Web App URL here
    ```
    and set it to the URL from step 9. Commit and push `index.html`.

That's it — every time you add, edit, or delete a reading in the app, it
POSTs the full reading list to this script, which rewrites Sheet1 to
match. And every time the page loads (any device, any browser), it GETs
the current rows from this script and shows those — so the Sheet is the
one shared copy everyone reads from.

## Updating the script later

If you ever change `Code.gs` (including updating to this version from an
older one that only supported writes), paste the updated code into the
same Apps Script project, save, then **Deploy > Manage deployments >
(pencil/edit icon) > Deploy** to push the new version to the same URL (so
you don't have to update `index.html` again).

## Note on the secret

`SHARED_SECRET` in `Code.gs` must exactly match `GOOGLE_SHEET_SECRET` in
`index.html`. Both already default to the same generated value
(`Rk6sotsrNTgPPuVwiuLDyDj0KPi59-Ov`) — you don't need to change either
unless you want to rotate it, in which case update both places together.
