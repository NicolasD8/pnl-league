// PNL League early list -> Google Sheet
//
// Setup (full steps in README.md):
// 1. Create a Google Sheet. Extensions > Apps Script. Replace Code.gs with this file. Save.
// 2. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
// 3. Copy the web app URL (ends in /exec) into FORM_ENDPOINT in public/assets/config.js.
// After editing this file later: Deploy > Manage deployments > edit > Version: New version (the URL stays the same).
//
// What it does:
// - rejects rows with a missing name or an invalid phone, and bot rows (honeypot filled)
// - normalises phones to E.164 (+9613123456), so "03 123 456", "3123456" and "+961 3 123 456" all match
// - flags duplicates by phone in the "dup" column (never drops them)
// - neutralises spreadsheet formulas in user input

const SHEET_NAME = "Signups";
const REJECT_SHEET = "Rejected";
const COLS = [
  "ts", "name", "phone", "okx", "exp", "lang", "dup",
  "ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid",
  "page", "consent", "ms",
];
const PHONE_COL = COLS.indexOf("phone") + 1;
const OKX_VALUES = ["verified", "unverified", "none"];
const EXP_VALUES = ["", "futures", "spot", "both", "new"];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // honeypot: real people never see the "website" field
  if (String(p.website || "").trim() !== "") {
    logReject_(p, "honeypot");
    return json_({ ok: true }); // look successful so bots don't retry
  }

  const name = clean_(p.name).replace(/\s+/g, " ").slice(0, 80);
  const phone = normalisePhone_(p.phone);
  const okx = OKX_VALUES.indexOf(String(p.okx)) >= 0 ? String(p.okx) : "";
  const exp = EXP_VALUES.indexOf(String(p.exp || "")) >= 0 ? String(p.exp || "") : "";

  if (name.length < 2) { logReject_(p, "missing name"); return json_({ ok: false, error: "name" }); }
  if (!phone) { logReject_(p, "invalid phone"); return json_({ ok: false, error: "phone" }); }
  if (!okx) { logReject_(p, "missing okx status"); return json_({ ok: false, error: "okx" }); }
  if (p.consent !== "yes") { logReject_(p, "no consent"); return json_({ ok: false, error: "consent" }); }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(SHEET_NAME, COLS);
    let dup = "";
    if (sh.getLastRow() > 1) {
      const hit = sh.getRange(2, PHONE_COL, sh.getLastRow() - 1, 1)
        .createTextFinder(phone).matchEntireCell(true).findNext();
      if (hit) dup = "DUPLICATE of row " + hit.getRow();
    }
    const row = {
      ts: new Date(), name: name, phone: phone, okx: okx, exp: exp,
      lang: p.lang === "ar" ? "ar" : "en", dup: dup, consent: "yes",
    };
    const values = COLS.map(function (k) {
      if (k === "ts") return row.ts;
      if (k === "phone") return "'" + phone; // keep the leading + as text
      return safe_(k in row ? row[k] : clean_(p[k]).slice(0, 300));
    });
    sh.appendRow(values);
    return json_({ ok: true, dup: !!dup });
  } finally {
    lock.releaseLock();
  }
}

// Health check: open the /exec URL in a browser and you should see {"ok":true,"service":"pnl-early-list"}
function doGet() {
  return json_({ ok: true, service: "pnl-early-list" });
}

/* ---------- helpers ---------- */

// Accepts "+961 71 234 567", "961 71234567", "00961...", "+961 03 123 456". Returns "+96171234567" or "" if invalid.
// Lebanon (+961): 7 or 8 national digits after dropping the trunk 0. Other countries: 6-12 national digits.
function normalisePhone_(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.indexOf("00") === 0) d = "+" + d.slice(2);
  if (d.charAt(0) !== "+") d = "+961" + d.replace(/^0+/, ""); // no country code: assume Lebanon
  d = "+" + d.replace(/\D/g, "");
  let cc = "", nat = "";
  if (d.indexOf("+961") === 0) { cc = "961"; nat = d.slice(4); }
  else { const m = d.match(/^\+(\d{1,3})(\d+)$/); if (!m) return ""; cc = m[1]; nat = m[2]; }
  nat = nat.replace(/^0+/, "");
  if (cc === "961") { if (nat.length !== 7 && nat.length !== 8) return ""; }
  else if (nat.length < 6 || nat.length > 12) return "";
  return "+" + cc + nat;
}

function clean_(v) { return String(v == null ? "" : v).trim(); }

// Stop "=HYPERLINK(...)" style formula injection
function safe_(v) { const s = String(v == null ? "" : v); return /^[=+\-@]/.test(s) ? "'" + s : s; }

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function logReject_(p, reason) {
  try {
    const sh = sheet_(REJECT_SHEET, ["ts", "reason", "name", "phone", "website", "ref", "page"]);
    sh.appendRow([new Date(), reason, safe_(clean_(p.name).slice(0, 80)), safe_(clean_(p.phone).slice(0, 30)),
      safe_(clean_(p.website).slice(0, 100)), safe_(clean_(p.ref).slice(0, 60)), safe_(clean_(p.page).slice(0, 200))]);
  } catch (err) { /* never fail the request over logging */ }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select testNormalise > Run) to sanity-check phone handling.
function testNormalise() {
  [["+961 71 234 567", "+96171234567"], ["+961 03 123 456", "+9613123456"], ["0096176123456", "+96176123456"],
   ["71234567", "+96171234567"], ["+961 12", ""], ["+33 6 12 34 56 78", "+33612345678"]]
    .forEach(function (t) { Logger.log(t[0] + " -> " + normalisePhone_(t[0]) + (normalisePhone_(t[0]) === t[1] ? "  OK" : "  FAIL, expected " + t[1])); });
}
