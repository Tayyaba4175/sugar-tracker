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

## Storage

The page has two backends and picks whichever is available:

- **Synced** — when served as a published Claude Artifact it gets a per-account
  document store, so the same log appears on every device. Readings are kept one
  document per calendar month (the store caps an artifact at 5,000 documents, which
  one-document-per-reading would reach in about three years).
- **This device only** — anywhere else, including static hosting like GitHub Pages,
  records live in the browser's `localStorage`. Nothing is uploaded and there is no
  backend. A phone and a laptop then keep separate logs, and clearing site data
  erases one.

The status pill under the title always says which mode you are in, and the note at
the foot of the page follows it. `localStorage` doubles as a local mirror in synced
mode so the first paint is instant. Either way, **Copy as CSV** is the backup.

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
