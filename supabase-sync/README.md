# Supabase sync

Makes a free Supabase project the shared home for every reading: add,
edit, or delete an entry on any device and it's saved straight to a
`readings` table there, and every device that opens the page loads its
list from that same table — so your phone and your laptop always show
the same log.

Supabase is open-source (Postgres + PostgREST under the hood); this uses
their free hosted tier, so there's nothing to install or run yourself.

## 1. Create the project (~2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up (free) if you
   don't already have an account.
2. Click **New project**. Pick any name (e.g. "sugar-tracker"), pick a
   region close to you, and set a database password (you won't need this
   password for the app itself — just don't lose it, Supabase may ask for
   it later).
3. Wait a minute or two while it provisions.

## 2. Create the table

1. In the left sidebar, open the **SQL Editor**.
2. Paste in the SQL below and click **Run**.

```sql
create table readings (
  id text primary key,
  t bigint not null,
  v numeric not null,
  type text not null,
  note text default '',
  inserted_at timestamptz default now()
);

alter table readings enable row level security;

-- This app has no login step, so it uses the same "anyone with the link
-- (and this key) can read/write" model as the Google Sheet version did.
-- The key below is not a secret you type in — it's meant to be public in
-- the page's source. Don't put anything more sensitive than a personal
-- glucose log behind this.
create policy "public read" on readings for select using (true);
create policy "public insert" on readings for insert with check (true);
create policy "public delete" on readings for delete using (true);
```

## 3. Get your URL and key

1. In the left sidebar, open **Project Settings > API**.
2. Copy the **Project URL** (looks like `https://xxxxxxxx.supabase.co`).
3. Copy the **anon / public** key (a long string starting with `eyJ...`).
   Do **not** use the `service_role` key — that one can bypass the read/
   write rules above and must never be shipped to a browser.

## 4. Wire it into the app

Open `index.html` — find these lines near the top of the `<script>` block:

```js
var SUPABASE_URL = ""; // <-- paste your Supabase Project URL here
var SUPABASE_ANON_KEY = ""; // <-- paste your Supabase anon public key here
```

Paste in the URL and key from step 3. Commit and push `index.html`.

That's it — every time you add or delete a reading in the app, it
rewrites the `readings` table to match. And every time the page loads
(any device, any browser), it loads the current rows from that table and
shows those, so the table is the one shared copy everyone reads from.

## Note on security

The anon key is public by design (it's meant to sit in client-side code),
but the policies above let *anyone* who finds your Supabase URL + anon
key read and erase this table — there's no per-user login. That's the
same trust model the Google Sheet / Apps Script version used (a
not-really-secret token baked into the page). It's fine for a personal
log you're not sharing the link to, but don't treat it as private data
protection.
