# sugar-tracker-sync

A tiny Cloudflare Worker that lets the Sugar Tracker web page save every
reading to GitHub (`data/readings.json` in this repo), instead of only to
the browser's local storage. A GitHub Action (`.github/workflows/build-xlsx.yml`)
then rebuilds `blood_sugar_log.xlsx` automatically whenever that file changes.

The GitHub token this needs lives only in Cloudflare's secret store — it is
never present in the page's JavaScript, so nobody visiting the site can see
or steal it.

## One-time setup (run these yourself — they involve your own credentials)

1. Install the CLI (needs Node.js):
   ```
   cd sync-worker
   npm install
   ```

2. Log in to Cloudflare (opens a browser window, free account is fine):
   ```
   npx wrangler login
   ```

3. Create a GitHub token scoped to just this repo:
   - Go to https://github.com/settings/personal-access-tokens/new
   - Repository access: "Only select repositories" → `Tayyaba4175/sugar-tracker`
   - Permissions: "Contents" → "Read and write". Nothing else.
   - Generate and copy the token.

4. Store that token as a Worker secret (you'll be prompted to paste it):
   ```
   npx wrangler secret put GITHUB_TOKEN
   ```

5. Deploy:
   ```
   npx wrangler deploy
   ```
   This prints a URL like `https://sugar-tracker-sync.<your-subdomain>.workers.dev`.

6. Put that URL into `index.html` — find the line:
   ```js
   var GITHUB_SYNC_URL = ""; // <-- paste your Worker URL here after deploying
   ```
   and set it to the URL from step 5. Commit and push `index.html`.

That's it — every time a reading is added, edited, or deleted in the app, it
POSTs the full reading list to the Worker, which commits it to
`data/readings.json`, which triggers the Action, which rebuilds the xlsx.

## Updating the Worker later

If you ever change `src/index.js`, redeploy with:
```
cd sync-worker && npx wrangler deploy
```
