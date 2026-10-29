// Vercel function: counts steps on the /go bridge page (view, tap_open, auto_open, tap_get_telegram, tap_web, left_page).
// Counts only: no IPs, no device IDs, nothing personal. Writes to the Sheet's "Clicks" tab.
const { sheet } = require("../lib/clients");
const env = require("../lib/env");

const EVENTS = ["view", "tap_open", "auto_open", "tap_get_telegram", "tap_web", "left_page"];
const REF_RE = /^[a-z0-9_-]{0,40}$/;
const BOT_UA = /facebookexternalhit|facebot|bot|crawler|spider|preview|slurp/i;

module.exports = async (req, res) => {
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") return res.status(405).send("POST only");
  if (BOT_UA.test(req.headers["user-agent"] || "")) return res.status(204).end(); // link previews, not people
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const ev = String(b.e || ""), ref = String(b.r || "").toLowerCase(), os = ["android", "ios", "desktop"].includes(b.os) ? b.os : "other";
  if (!EVENTS.includes(ev) || !REF_RE.test(ref)) return res.status(400).send("bad event");
  const e = env();
  try {
    await sheet(e.SHEET_URL, e.SHEET_SECRET).track(ref, ev, os);
  } catch (err) {
    console.error("track failed", err && err.message);
  }
  res.status(204).end();
};
