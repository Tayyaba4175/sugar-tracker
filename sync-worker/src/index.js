// Cloudflare Worker: receives the current readings array from the Sugar
// Tracker web page and commits it to data/readings.json in the GitHub repo.
// The GitHub token lives only in this Worker's secret store (set with
// `wrangler secret put GITHUB_TOKEN`) — it is never sent to, or readable
// from, the public web page.

const OWNER = "Tayyaba4175";
const REPO = "sugar-tracker";
const PATH = "data/readings.json";
const BRANCH = "main";

// Restrict which sites may call this Worker. Add more origins if you serve
// the tracker from anywhere else.
const ALLOWED_ORIGINS = new Set([
  "https://tayyaba4175.github.io",
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function isValidReading(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.id === "string" &&
    typeof r.t === "number" &&
    typeof r.v === "number" &&
    typeof r.type === "string"
  );
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response("Origin not allowed", { status: 403, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }
    if (!env.GITHUB_TOKEN) {
      return new Response("Worker is missing GITHUB_TOKEN secret", { status: 500, headers });
    }

    let readings;
    try {
      readings = await request.json();
    } catch (e) {
      return new Response("Invalid JSON body", { status: 400, headers });
    }
    if (!Array.isArray(readings) || !readings.every(isValidReading)) {
      return new Response("Expected an array of {id,t,v,type,note} readings", { status: 400, headers });
    }
    // Basic sanity cap so a runaway client can't blow up the file.
    if (readings.length > 20000) {
      return new Response("Too many readings in one request", { status: 400, headers });
    }

    const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const ghHeaders = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "sugar-tracker-sync-worker",
      Accept: "application/vnd.github+json",
    };

    // Need the current file's SHA to update it (GitHub's Contents API
    // requires this to avoid clobbering concurrent edits); a 404 means the
    // file doesn't exist yet, which is fine for the first sync.
    let sha;
    const getResp = await fetch(`${apiBase}?ref=${BRANCH}`, { headers: ghHeaders });
    if (getResp.status === 200) {
      sha = (await getResp.json()).sha;
    } else if (getResp.status !== 404) {
      return new Response(`Failed to read current file (${getResp.status})`, { status: 502, headers });
    }

    const body = {
      message: `Update readings (${readings.length} entr${readings.length === 1 ? "y" : "ies"}) via Sugar Tracker app`,
      content: toBase64(JSON.stringify(readings, null, 2) + "\n"),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const putResp = await fetch(apiBase, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!putResp.ok) {
      const text = await putResp.text();
      return new Response(`Failed to write file (${putResp.status}): ${text}`, { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true, count: readings.length }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
