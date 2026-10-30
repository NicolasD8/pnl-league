// PNL League bot · Google Sheet backend (Apps Script web app)
//
// Setup (full steps in bot/README.md):
// 1. New Google Sheet > Extensions > Apps Script. Replace Code.gs with this file. Save.
// 2. Project Settings (gear) > Script properties > add:
//      SHEET_SECRET = a long random string (same value as SHEET_SECRET in Vercel)
//      BOT_TOKEN    = your bot token from @BotFather (only used to send broadcasts)
// 3. Run > setup (once) and approve the permissions.
// 4. Deploy > New deployment > Web app · Execute as: Me · Who has access: Anyone. Copy the /exec URL to Vercel as SHEET_URL.
// After editing: Deploy > Manage deployments > edit > Version: New version (URL stays the same).

const USERS = "Users";
const BROADCASTS = "Broadcasts";
const CLICKS = "Clicks";
const CCOLS = ["day", "ref", "event", "os", "count"];
const CLICK_EVENTS = ["view", "tap_open", "auto_open", "tap_get_telegram", "tap_web", "left_page", "fallback_web"];
const UCOLS = ["tg_id", "username", "first_name", "last_name", "language_code", "lang", "name", "phone", "okx", "exp",
  "eligible", "consent", "status", "step", "ref", "dup", "blocked", "deleted", "created", "updated", "no", "nudged", "got"];
const BCOLS = ["id", "status", "kind", "payload", "admin_chat", "recipients", "cursor", "sent", "failed", "blocked", "created", "finished"];
const FIRST_NO = 15; // first contender number handed out
const SAVEABLE = ["username", "first_name", "last_name", "lang", "name", "phone", "okx", "exp", "eligible", "consent", "status", "step", "dup", "deleted", "blocked"];

/* ---------------- web app ---------------- */

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad json" }); }
  const expected = prop_("SHEET_SECRET"), got = String(body.secret || "").trim();
  if (!expected || got !== expected) return json_({ ok: false, error: "unauthorised (secret lengths: sheet " + expected.length + ", request " + got.length + ")" });
  // Click counts are append-only and never take the lock, so ad traffic can't make the bot wait.
  if (body.action === "track") {
    try { return json_(Object.assign({ ok: true }, track_(body.ref, body.event, body.os))); }
    catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    switch (body.action) {
      case "touch": return json_({ ok: true, row: touch_(body.user || {}, body.ref) });
      case "save": return json_({ ok: true, row: save_(String(body.id), body.fields || {}) });
      case "stats": return json_({ ok: true, stats: stats_() });
      case "overview": return json_({ ok: true, overview: overview_() });
      case "track": return json_(Object.assign({ ok: true }, track_(body.ref, body.event, body.os)));
      case "draft_broadcast": return json_(Object.assign({ ok: true }, draftBroadcast_(body.payload || {})));
      case "send_broadcast": return json_(Object.assign({ ok: true }, sendBroadcast_(String(body.id))));
      case "mark_received": return json_(Object.assign({ ok: true }, markReceived_(body.payload || {})));
      case "cancel_broadcast": return json_(Object.assign({ ok: true }, setBroadcast_(String(body.id), { status: "cancelled" })));
      default: return json_({ ok: false, error: "unknown action" });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json_({ ok: true, service: "pnl-league-bot" }); }

/* ---------------- users ---------------- */

function touch_(user, ref) {
  const id = String(user.id || "");
  if (!/^\d+$/.test(id)) throw new Error("bad user id");
  const sh = sheet_(USERS, UCOLS);
  const r = findRow_(sh, id);
  const now = new Date();
  if (!r) {
    const row = blank_(UCOLS);
    row.tg_id = id; row.created = now; row.updated = now;
    row.ref = /^[a-z0-9_-]{1,40}$/i.test(String(ref || "")) ? String(ref).toLowerCase() : "";
    ["username", "first_name", "last_name", "language_code"].forEach(function (k) { row[k] = clip_(user[k], 80); });
    writeRow_(sh, sh.getLastRow() + 1, row);
    return row;
  }
  const row = readRow_(sh, r);
  if (row.deleted !== "yes") ["username", "first_name", "last_name"].forEach(function (k) { if (user[k] !== undefined) row[k] = clip_(user[k], 80); });
  if (!row.ref && ref && /^[a-z0-9_-]{1,40}$/i.test(String(ref))) row.ref = String(ref).toLowerCase(); // first source wins
  row.blocked = ""; // they messaged us, so they haven't blocked the bot
  row.updated = now;
  writeRow_(sh, r, row);
  return row;
}

function save_(id, fields) {
  const sh = sheet_(USERS, UCOLS);
  let r = findRow_(sh, id);
  if (!r) { touch_({ id: id }); r = findRow_(sh, id); }
  const row = readRow_(sh, r);
  Object.keys(fields).forEach(function (k) { if (SAVEABLE.indexOf(k) >= 0) row[k] = clip_(fields[k], 120); });
  if (fields.phone !== undefined) {
    row.phone = normalisePhone_(fields.phone);
    row.dup = "";
    if (row.phone) {
      const hit = sh.getRange(2, UCOLS.indexOf("phone") + 1, Math.max(1, sh.getLastRow() - 1), 1)
        .createTextFinder(row.phone).matchEntireCell(true).findAll()
        .filter(function (c) { return c.getRow() !== r; })[0];
      if (hit) row.dup = "DUPLICATE phone, row " + hit.getRow();
    }
  }
  // contender number: handed out once, in signup order, when someone finishes
  if (row.status === "complete" && !row.no) row.no = nextNo_(sh);
  row.updated = new Date();
  writeRow_(sh, r, row);
  return row;
}

function nextNo_(sh) {
  const col = UCOLS.indexOf("no") + 1, n = sh.getLastRow() - 1;
  if (n < 1) return String(FIRST_NO);
  const max = sh.getRange(2, col, n, 1).getValues().reduce(function (m, v) { return Math.max(m, Number(v[0]) || 0); }, FIRST_NO - 1);
  return String(max + 1);
}

function isRecipient_(u) {
  return u.status === "complete" && u.consent === "yes" && u.blocked !== "yes" && u.deleted !== "yes";
}

// Started the bot but never finished signup (and never said no, wasn't ineligible, didn't delete or block).
function isUnfinished_(u) {
  return u.tg_id && u.status !== "complete" && u.status !== "ineligible" && u.consent !== "no" && u.blocked !== "yes" && u.deleted !== "yes";
}
// filter (optional) narrows the audience further, e.g. { okx: ["none","unverified"] } or { ref: ["rich"], lang: ["ar"] }
function audience_(name, filter) {
  const base = name === "unfinished" ? isUnfinished_ : isRecipient_;
  const f = filter || {};
  const keys = Object.keys(f).filter(function (k) { return ["okx", "ref", "lang", "exp"].indexOf(k) >= 0 && Array.isArray(f[k]) && f[k].length; });
  const after = Number(f.created_after) || 0; // new_only: people who arrived after the last nudge
  return function (u) {
    if (!base(u)) return false;
    if (f.new_only && f.kind && f.kind !== "nudge") {
      if (got_(u).indexOf(f.kind) >= 0) return false;
    } else if (f.new_only) {
      if (u.nudged || got_(u).indexOf("nudge") >= 0) return false;
      const c = u.created instanceof Date ? u.created.getTime() : Date.parse(u.created) || 0;
      if (after && c && c <= after) return false; // existed (and was unfinished) when the last nudge went out
    }
    return keys.every(function (k) { return f[k].indexOf(String(u[k] || "")) >= 0; });
  };
}

function stats_() {
  const rows = allRows_(sheet_(USERS, UCOLS));
  const s = { total: rows.length, started: 0, complete: 0, stopped: 0, blocked: 0, by_ref: {}, by_okx: {}, by_lang: {}, opened_by_ref: {}, clicks: clickTotals_() };
  rows.forEach(function (u) {
    if (u.tg_id) { const o = u.ref || "(direct)"; s.opened_by_ref[o] = (s.opened_by_ref[o] || 0) + 1; }
    if (u.name || u.status) s.started++;
    if (u.consent === "no") s.stopped++;
    if (u.blocked === "yes") s.blocked++;
    if (u.status === "complete" && u.deleted !== "yes") {
      s.complete++;
      const ref = u.ref || "(direct)";
      s.by_ref[ref] = (s.by_ref[ref] || 0) + 1;
      if (u.okx) s.by_okx[u.okx] = (s.by_okx[u.okx] || 0) + 1;
      s.by_lang[u.lang || "en"] = (s.by_lang[u.lang || "en"] || 0) + 1;
    }
  });
  return s;
}

// Bridge-page step counter: one row per day + ref + event + os, with a running count. No personal data.
function track_(ref, event, os) {
  ref = String(ref || "").toLowerCase(); event = String(event || ""); os = String(os || "other");
  if (!/^[a-z0-9_-]{0,40}$/.test(ref) || CLICK_EVENTS.indexOf(event) < 0) return { counted: false };
  const sh = sheet_(CLICKS, CCOLS);
  const day = Utilities.formatDate(new Date(), "Asia/Beirut", "yyyy-MM-dd");
  // One row per event (count 1). Totals add the count column, so old summed rows and new rows mix fine.
  sh.appendRow(["'" + day, ref || "(direct)", event, os, 1]);
  return { counted: true };
}

function clickTotals_() {
  const sh = sheet_(CLICKS, CCOLS), out = {};
  if (sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, CCOLS.length).getValues().forEach(function (r) {
    const ref = String(r[1] || "(direct)"), ev = String(r[2]);
    out[ref] = out[ref] || {};
    out[ref][ev] = (out[ref][ev] || 0) + (Number(r[4]) || 0);
  });
  return out;
}

// Everyone who ever opened the bot, as counts only (no personal data): stage, source, language, day.
function overview_() {
  const rows = allRows_(sheet_(USERS, UCOLS)).filter(function (u) { return u.tg_id; });
  const o = { total: rows.length, stage: {}, by_source: {}, by_lang: {}, by_day: {}, okx_signed: {} };
  const inc = function (obj, k, n) { obj[k] = (obj[k] || 0) + (n || 1); };
  rows.forEach(function (u) {
    let stage;
    if (u.deleted === "yes") stage = "deleted";
    else if (u.status === "complete") stage = "signed_up";
    else if (u.status === "ineligible") stage = "ineligible";
    else if (u.consent === "no") stage = "declined";
    else if (u.step || u.name) stage = "mid_signup:" + (u.step || "name");
    else stage = "opened_only";
    if (u.blocked === "yes") inc(o.stage, "blocked_bot");
    inc(o.stage, stage);
    const src = u.ref || "(direct)";
    o.by_source[src] = o.by_source[src] || { opened: 0, signed_up: 0 };
    o.by_source[src].opened++;
    if (stage === "signed_up") { o.by_source[src].signed_up++; inc(o.okx_signed, u.okx || "(blank)"); }
    inc(o.by_lang, u.lang || "(not picked)");
    const d = u.created instanceof Date ? Utilities.formatDate(u.created, "Asia/Beirut", "yyyy-MM-dd") : String(u.created || "").slice(0, 10);
    if (d) { o.by_day[d] = o.by_day[d] || { opened: 0, signed_up: 0 }; o.by_day[d].opened++; if (stage === "signed_up") o.by_day[d].signed_up++; }
  });
  return o;
}

/* ---------------- broadcasts ---------------- */

function draftBroadcast_(payload) {
  const sh = sheet_(BROADCASTS, BCOLS);
  const audience = payload.audience === "unfinished" ? "unfinished" : "signed_up";
  const filter = payload.filter && typeof payload.filter === "object" ? payload.filter : null;
  if (filter && filter.new_only) { filter.kind = clip_(payload.kind, 20); if (filter.kind === "nudge") filter.created_after = lastNudgeAt_(); }
  const recipients = allRows_(sheet_(USERS, UCOLS)).filter(audience_(audience, filter)).length;
  const b = blank_(BCOLS);
  b.id = String(Date.now()); b.status = "draft"; b.kind = clip_(payload.kind, 20);
  b.payload = JSON.stringify({ text: payload.text || {}, button: payload.button || null, audience: audience, filter: filter });
  b.admin_chat = clip_(payload.admin_chat, 30); b.recipients = recipients; b.cursor = 2; b.sent = 0; b.failed = 0; b.blocked = 0; b.created = new Date();
  writeRow_(sh, sh.getLastRow() + 1, b, BCOLS);
  return { id: b.id, recipients: recipients };
}

function got_(u) { return String(u.got || "").split(",").map(function (x) { return x.trim(); }).filter(String); }

// Record a message kind as already received by everyone matching audience+filter, without sending anything.
// Used once to backfill people who got a message before per-person tracking existed.
function markReceived_(p) {
  const kind = clip_(p.kind, 20);
  if (!/^[a-z_]{2,20}$/.test(kind)) return { marked: 0, error: "bad kind" };
  const ush = sheet_(USERS, UCOLS), users = allRows_(ush), test = audience_(p.audience === "unfinished" ? "unfinished" : "signed_up", p.filter || null);
  let n = 0;
  users.forEach(function (u, i) {
    if (!test(u) || got_(u).indexOf(kind) >= 0) return;
    ush.getRange(i + 2, UCOLS.indexOf("got") + 1).setValue(got_(u).concat([kind]).join(","));
    n++;
  });
  return { marked: n };
}

// Time of the most recent nudge that actually went out (0 if none)
function lastNudgeAt_() {
  return allRows_(sheet_(BROADCASTS, BCOLS), BCOLS).reduce(function (m, b) {
    if (b.kind !== "nudge" || ["queued", "sending", "done"].indexOf(b.status) < 0) return m;
    const t = b.created instanceof Date ? b.created.getTime() : Date.parse(b.created) || 0;
    return Math.max(m, t);
  }, 0);
}

function sendBroadcast_(id) {
  const sh = sheet_(BROADCASTS, BCOLS);
  const r = findRow_(sh, id);
  if (!r) return { started: false, error: "not found" };
  const b = readRow_(sh, r, BCOLS);
  if (b.status !== "draft") return { started: false, error: "status is " + b.status };
  b.status = "queued"; b.recipients = allRows_(sheet_(USERS, UCOLS)).filter((function (p) { return audience_(p.audience, p.filter); })(JSON.parse(b.payload))).length;
  writeRow_(sh, r, b, BCOLS);
  scheduleWorker_(1);
  return { started: true, recipients: b.recipients };
}

function setBroadcast_(id, patch) {
  const sh = sheet_(BROADCASTS, BCOLS);
  const r = findRow_(sh, id);
  if (!r) return { error: "not found" };
  const b = readRow_(sh, r, BCOLS);
  if (b.status === "draft") { Object.assign(b, patch); writeRow_(sh, r, b, BCOLS); }
  return {};
}

// Runs from a time trigger. Sends in chunks of ~5 minutes, then reschedules itself until done.
function processBroadcasts() {
  // Own guard instead of the script lock, so the bot keeps answering while a broadcast runs.
  const props = PropertiesService.getScriptProperties();
  const running = Number(props.getProperty("WORKER_SINCE") || 0);
  if (running && Date.now() - running < 6 * 60 * 1000) { scheduleWorker_(2); return; }
  props.setProperty("WORKER_SINCE", String(Date.now()));
  const started = Date.now();
  try {
    clearWorkers_();
    const bsh = sheet_(BROADCASTS, BCOLS);
    const all = allRows_(bsh, BCOLS);
    const idx = all.findIndex(function (b) { return b.status === "queued" || b.status === "sending"; });
    if (idx < 0) return;
    const br = idx + 2, b = all[idx];
    const p = JSON.parse(b.payload);
    const ush = sheet_(USERS, UCOLS);
    const users = allRows_(ush);           // users[i] is sheet row i + 2
    const last = users.length + 1;
    b.status = "sending";
    let cursor = Number(b.cursor) || 2;
    while (cursor <= last) {
      if (Date.now() - started > 4.5 * 60 * 1000) break;
      const u = users[cursor - 2];
      if (audience_(p.audience, p.filter)(u)) {
        const lang = u.lang === "ar" ? "ar" : "en";
        const params = { chat_id: u.tg_id, text: p.text[lang] || p.text.en, parse_mode: "HTML", disable_web_page_preview: true };
        const bt = p.button && p.button[lang];
        if (bt) params.reply_markup = JSON.stringify({ inline_keyboard: [[bt.data ? { text: bt.text, callback_data: bt.data } : { text: bt.text, url: bt.url }]] });
        const res = tg_("sendMessage", params);
        if (res.ok) {
          b.sent = Number(b.sent) + 1;
          if (b.kind === "nudge") ush.getRange(cursor, UCOLS.indexOf("nudged") + 1).setValue(new Date());
          if (b.kind && got_(u).indexOf(b.kind) < 0) ush.getRange(cursor, UCOLS.indexOf("got") + 1).setValue(got_(u).concat([b.kind]).join(","));
        }
        else if (res.error_code === 403) { b.blocked = Number(b.blocked) + 1; ush.getRange(cursor, UCOLS.indexOf("blocked") + 1).setValue("yes"); }
        else b.failed = Number(b.failed) + 1;
        Utilities.sleep(40); // stay under Telegram's ~30 msgs/sec
      }
      cursor++;
    }
    b.cursor = cursor;
    if (cursor > last) {
      b.status = "done"; b.finished = new Date();
      if (b.admin_chat) tg_("sendMessage", { chat_id: b.admin_chat, text: "Broadcast done. Sent: " + b.sent + " · blocked the bot: " + b.blocked + " · failed: " + b.failed });
    } else {
      scheduleWorker_(1);
    }
    writeRow_(bsh, br, b, BCOLS);
    if (b.status === "done" && all.some(function (x, i) { return i !== idx && x.status === "queued"; })) scheduleWorker_(1);
  } finally {
    props.deleteProperty("WORKER_SINCE");
  }
}

function tg_(method, params) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = UrlFetchApp.fetch("https://api.telegram.org/bot" + prop_("BOT_TOKEN") + "/" + method, { method: "post", payload: params, muteHttpExceptions: true });
    const j = JSON.parse(r.getContentText() || "{}");
    if (j.ok || j.error_code !== 429) return j;
    Utilities.sleep(((j.parameters && j.parameters.retry_after) || 2) * 1000);
  }
  return { ok: false, error_code: 429 };
}

function scheduleWorker_(minutes) {
  if (ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "processBroadcasts"; })) return;
  ScriptApp.newTrigger("processBroadcasts").timeBased().after(minutes * 60 * 1000).create();
}
function clearWorkers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "processBroadcasts") ScriptApp.deleteTrigger(t); });
}

/* ---------------- setup + sheet menu ---------------- */

// Run once from the editor: creates the tabs and asks for the permissions broadcasts need.
function setup() {
  sheet_(USERS, UCOLS); sheet_(BROADCASTS, BCOLS);
  if (!prop_("SHEET_SECRET")) throw new Error("Add SHEET_SECRET in Project Settings > Script properties first.");
  if (!prop_("BOT_TOKEN")) throw new Error("Add BOT_TOKEN in Project Settings > Script properties first.");
  const me = tg_("getMe", {});
  Logger.log(me.ok ? "Bot OK: @" + me.result.username : "Bot token problem: " + JSON.stringify(me));
  scheduleWorker_(1); clearWorkers_(); // touches the trigger permission so it's approved now
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("PNL Bot").addItem("Show stats", "menuStats_").addItem("Resume a stuck broadcast", "processBroadcasts").addToUi();
}
function menuStats_() {
  const s = stats_();
  SpreadsheetApp.getUi().alert("Signed up: " + s.complete + "\nStarted: " + s.started + "\nOpted out: " + s.stopped + "\nBlocked the bot: " + s.blocked + "\n\nBy source:\n" +
    Object.keys(s.by_ref).map(function (k) { return k + ": " + s.by_ref[k]; }).join("\n"));
}

/* ---------------- helpers ---------------- */

function prop_(k) { return String(PropertiesService.getScriptProperties().getProperty(k) || "").trim(); } // trim: pasted values often carry a trailing space/newline
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clip_(v, n) { return String(v == null ? "" : v).trim().slice(0, n); }
function blank_(cols) { const o = {}; cols.forEach(function (c) { o[c] = ""; }); return o; }

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); }
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); sh.getRange("A:A").setNumberFormat("@"); }
  else if (sh.getLastColumn() < header.length) sh.getRange(1, 1, 1, header.length).setValues([header]); // new columns added in an update
  return sh;
}
function findRow_(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}
function readRow_(sh, r, cols) {
  cols = cols || UCOLS;
  const v = sh.getRange(r, 1, 1, cols.length).getValues()[0];
  const o = {}; cols.forEach(function (c, i) { o[c] = v[i] instanceof Date ? v[i] : String(v[i]); });
  return o;
}
function allRows_(sh, cols) {
  cols = cols || UCOLS;
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues().map(function (v) {
    const o = {}; cols.forEach(function (c, i) { o[c] = v[i] instanceof Date ? v[i] : String(v[i]); }); return o;
  });
}
function writeRow_(sh, r, o, cols) {
  cols = cols || UCOLS;
  sh.getRange(r, 1, 1, cols.length).setValues([cols.map(function (c) {
    const v = o[c];
    if (v instanceof Date) return v;
    const s = String(v == null ? "" : v);
    if (c === "tg_id" || c === "id" || c === "admin_chat") return s;             // column A is plain text
    if (c === "phone" && s) return "'" + s;                                       // keep the leading +
    return /^[=+\-@]/.test(s) ? "'" + s : s;                                      // no formula injection
  })]);
}

// "+961 71 234 567", "96171234567", "0096171234567" -> "+96171234567"; "" if invalid. Telegram contacts arrive without "+".
function normalisePhone_(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.indexOf("00") === 0) d = "+" + d.slice(2);
  if (d.charAt(0) !== "+") d = (d.indexOf("961") === 0 && d.length >= 10 ? "+" : "+961") + d.replace(/^0+/, "");
  d = "+" + d.replace(/\D/g, "");
  let cc, nat;
  if (d.indexOf("+961") === 0) { cc = "961"; nat = d.slice(4); }
  else { const m = d.match(/^\+(\d{1,3})(\d{6,12})$/); if (!m) return ""; cc = m[1]; nat = m[2]; }
  nat = nat.replace(/^0+/, "");
  if (cc === "961" && nat.length !== 7 && nat.length !== 8) return "";
  return "+" + cc + nat;
}
