# Sugar Log

A single-page blood glucose log with a trend chart. One HTML file, no build step,
no dependencies, no server.

## What it does

- Log readings: date, time, glucose (mg/dL), reading type, optional note
- Flags each reading High / Low / In range against its own type's target range
- Charts readings over time with a fitted trend line and the target range shaded
- Reports the pattern as **Rising / Falling / Stable**, with the rate in mg/dL per week
- Summary stats: average, estimated HbA1c, percent in range, count of lows under 70
- Export the whole log as CSV

## Privacy

Records are stored in the browser's `localStorage` on the device that entered them.
Nothing is uploaded and there is no backend — the deployed page is static HTML.

Because storage is per-browser, a phone and a laptop keep separate logs, and
clearing site data erases the log. Use **Copy as CSV** to keep a backup.

## Reference ranges

Targets are defined in one place, the `TYPES` object in `index.html`:

| Type | Target (mg/dL) |
|------|----------------|
| Fasting | 80–130 |
| Post-meal | 80–180 |
| Random | 80–160 |
| Bedtime | 90–150 |

Readings under 70 are additionally counted as lows. These are common targets for
managing diabetes, not diagnostic cutoffs — edit them to whatever your doctor sets.

## Run locally

Open `index.html` in any browser. That's it.

## Deploy

Static hosting, root directory, no build command. On GitHub Pages: enable Pages
with source *Deploy from a branch* → `main` → `/ (root)`.

## Not medical advice

This is a personal record-keeping tool. Discuss any pattern it shows with a doctor.
