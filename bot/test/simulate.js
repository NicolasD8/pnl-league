// Offline test: runs real bot logic against a fake Telegram + in-memory Sheet. `node test/simulate.js`
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createBot } = require("../lib/bot");

// --- fakes ---------------------------------------------------------------
const sent = [];
const tg = {
  send: async (chat, text, extra = {}) => { sent.push({ chat: String(chat), text, kb: extra.reply_markup }); return { message_id: sent.length }; },
  answer: async () => {},
  clearButtons: async () => {},
  call: async (method, p = {}) => { if (method === "sendVideo") sent.push({ chat: String(p.chat_id), video: p.video, text: p.caption || "", kb: p.reply_markup }); return {}; },
  sendPhoto: async (chat, png, extra = {}) => { sent.push({ chat: String(chat), photo: png, text: extra.caption || "", kb: extra.reply_markup }); return {}; },
};
const users = new Map();
const broadcasts = new Map();
const db = {
  async touch(user, ref) {
    const id = String(user.id);
    if (!users.has(id)) users.set(id, { tg_id: id, lang: "", step: "", status: "", ref: ref || "", consent: "", deleted: "", ...pick(user) });
    const r = users.get(id);
    if (!r.ref && ref) r.ref = ref;
    if (r.deleted !== "yes") Object.assign(r, pick(user));
    return { ...r };
  },
  async save(id, fields) {
    const r = users.get(String(id)); Object.assign(r, fields);
    if (r.status === "complete" && !r.no) r.no = String([...users.values()].reduce((m, u) => Math.max(m, Number(u.no) || 0), 14) + 1); // mirrors FIRST_NO = 15
    return { ...r };
  },
  async stats() {
    const rows = [...users.values()], done = rows.filter((u) => u.status === "complete");
    const count = (k) => done.reduce((a, u) => ((a[u[k] || "(direct)"] = (a[u[k] || "(direct)"] || 0) + 1), a), {});
    return { complete: done.length, started: rows.filter((u) => u.name).length, stopped: rows.filter((u) => u.consent === "no").length, blocked: 0, by_ref: count("ref"), by_okx: count("okx"), by_lang: count("lang") };
  },
  async draftBroadcast(p) {
    const id = String(broadcasts.size + 1); broadcasts.set(id, { ...p, status: "draft" });
    const unfinished = (u) => u.status !== "complete" && u.status !== "ineligible" && u.consent !== "no" && u.deleted !== "yes";
    if (p.audience === "test") return { id, recipients: [...users.values()].filter((u) => u.tg_id === p.filter.only).length };
    const base = p.audience === "unfinished" ? unfinished : (u) => u.status === "complete" && u.consent === "yes";
    const f = p.filter || {};
    const keys = Object.keys(f).filter((k) => Array.isArray(f[k]));
    const fresh = (u) => !f.new_only || (p.kind === "nudge" ? !u.nudged : !String(u.got || "").split(",").includes(p.kind));
    return { id, recipients: [...users.values()].filter((u) => base(u) && fresh(u) && keys.every((k) => f[k].includes(String(u[k] || "")))).length };
  },
  async sendBroadcast(id) { const b = broadcasts.get(id); if (b.status !== "draft") return { started: false, error: "status is " + b.status }; b.status = "queued"; return { started: true, recipients: 1 }; },
  async cancelBroadcast(id) { broadcasts.get(id).status = "cancelled"; return {}; },
};
function pick(u) { const o = {}; ["username", "first_name", "last_name"].forEach((k) => { if (u[k] !== undefined) o[k] = u[k]; }); return o; }

let clock = new Date("2026-10-26T10:00:00+02:00").getTime();
const cfg = { BOT_USERNAME: "PNLLeagueBot", ADMIN_IDS: "900", STATS_IDS: "950", REG_OPENS: "2026-11-01T12:00:00+03:00", OKX_CAMPAIGN_URL: "https://www.okx.com/campaigns/ce-community-trading-competition-phase-1", OKX_SIGNUP_URL: "https://example.com/okx-affiliate" };
const bot = createBot({ tg, db, cfg, now: () => clock });

let uid = 0;
const from = (id, extra = {}) => ({ id, is_bot: false, first_name: "Test", last_name: "Trader", username: "tt" + id, ...extra });
const msg = (id, text, extra = {}) => bot.handle({ update_id: ++uid, message: { message_id: uid, chat: { id, type: "private" }, from: from(id), text, ...extra } });
const tap = (id, data) => bot.handle({ update_id: ++uid, callback_query: { id: "q" + uid, from: from(id), data, message: { message_id: 1, chat: { id, type: "private" } } } });
const last = (chat) => [...sent].reverse().find((s) => s.chat === String(chat));
const buttons = (s) => (s.kb && s.kb.inline_keyboard ? s.kb.inline_keyboard.flat().map((b) => b.callback_data || b.url) : []);
const log = (label) => console.log("✓", label);

(async () => {
  // 1. creator link + language, then signup starts by itself (no "Join" tap)
  await msg(101, "/start rami");
  assert.match(last(101).text, /Choose your language/); assert.equal(users.get("101").ref, "rami");
  await tap(101, "lang:en");
  assert.match(sent[sent.length - 2].text, /Registration opens on OKX in <b>6d 1h<\/b>/);
  assert.match(last(101).text, /Do you have an OKX account/, "first question appears right after the welcome");
  assert.equal(users.get("101").name, "Test Trader", "name taken from the Telegram profile");
  log("ref captured from /start rami, language picker, countdown, signup starts without a Join tap, name from Telegram");

  // 2. two-tap signup
  await tap(101, "cf:yes"); assert.equal(users.get("101").status, "", "stale confirm button can't skip the OKX question");
  assert.match(last(101).text, /Do you have an OKX account/);
  await tap(101, "okx:unverified");
  assert.match(last(101).text, /finish identity verification \(KYC\) on OKX/); assert.deepStrictEqual(buttons(last(101)), [cfg.OKX_SIGNUP_URL, "og:verified", "og:later"]);
  await tap(101, "cf:yes"); assert.equal(users.get("101").status, "", "can't confirm before the OKX-link step");
  await tap(101, "og:later"); assert.equal(users.get("101").okx, "unverified");
  assert.match(last(101).text, /Last step, Test\. Tap below to confirm you're <b>18 or older<\/b>/); assert.deepStrictEqual(buttons(last(101)), ["cf:yes", "cf:no"]);
  await tap(101, "cf:yes");
  const cardMsg = last(101);
  assert.ok(cardMsg.photo && cardMsg.photo.length > 20000, "contender card PNG sent"); assert.match(cardMsg.text, /#0015/);
  assert.deepStrictEqual([...cardMsg.photo.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47], "is a PNG");
  const done = sent[sent.length - 2];
  assert.match(done.text, /You're in, Test/); assert.match(done.text, /KYC verified now/); assert.match(done.text, /Send \/name to change it/);
  assert.ok(buttons(done).includes(cfg.OKX_SIGNUP_URL), "affiliate button for unverified");
  assert.ok(buttons(done).includes("addphone"), "optional phone offered after signup");
  assert.ok(buttons(done).some((u) => u && u.includes("t.me/share/url") && decodeURIComponent(u).includes("t.me/PNLLeagueBot?start=rami")), "invite carries ref");
  const u101 = users.get("101");
  assert.equal(u101.status, "complete"); assert.equal(u101.consent, "yes"); assert.equal(u101.eligible, "yes");
  log("signup in 2 taps: OKX status, then one confirm (18+, Lebanon, messages); stale buttons ignored; done screen + card #0015");

  // optional phone after signup, and renaming
  await tap(101, "addphone"); assert.equal(last(101).kb.keyboard[0][0].request_contact, true);
  await msg(101, "", { contact: { phone_number: "96171234567", user_id: 999 } }); assert.match(last(101).text, /your own number/);
  await msg(101, "", { contact: { phone_number: "96171234567", user_id: 101 } });
  assert.equal(users.get("101").phone, "+96171234567"); assert.match(last(101).text, /may also reach you on WhatsApp/);
  await msg(101, "/name"); assert.match(last(101).text, /What name should go on your contender card/);
  await msg(101, "x"); assert.match(last(101).text, /doesn't look like a full name/);
  await msg(101, "Karim Test"); assert.equal(users.get("101").name, "Karim Test"); assert.ok(last(101).photo, "new card after rename"); assert.match(sent[sent.length - 2].text, /Name updated/);
  log("optional WhatsApp number after signup (own number only), /name renames and resends the card");

  // 3. returning user
  await msg(101, "/start"); assert.match(last(101).text, /You're on the list, <b>Karim<\/b>/); assert.ok(!buttons(last(101)).includes("join"));
  log("returning user sees 'You're on the list', no join button, no signup questions");

  // 4. Arabic user with an Arabic name, verified; declining path
  await msg(202, "/start"); await tap(202, "lang:ar");
  assert.match(sent[sent.length - 2].text, /أول بطولة تداول مباشرة/); assert.match(last(202).text, /حساب على OKX/);
  await msg(202, "/name"); await msg(202, "سارة خوري"); assert.match(last(202).text, /حساب على OKX/, "rename mid-signup continues the signup");
  await tap(202, "okx:verified"); assert.match(last(202).text, /الخطوة الأخيرة يا سارة/);
  await tap(202, "cf:yes");
  assert.match(sent[sent.length - 2].text, /أنت معنا يا سارة/); assert.ok(!buttons(sent[sent.length - 2]).includes(cfg.OKX_SIGNUP_URL), "no affiliate button for verified");
  assert.match(last(202).text, /#0016/); assert.ok(last(202).photo, "Arabic card sent");
  await msg(303, "/card"); assert.match(last(303).text, /unlocks when you join/);
  await msg(101, "/card"); assert.ok(last(101).photo && /#0015/.test(last(101).text), "/card resends same number");
  await msg(303, "/start"); await tap(303, "lang:en"); await tap(303, "okx:none");
  assert.match(last(303).text, /create your OKX account with the PNL League link/); assert.deepStrictEqual(buttons(last(303)), [cfg.OKX_SIGNUP_URL, "og:created"]);
  await msg(303, "hello"); assert.match(last(303).text, /Tap a button above/);
  await tap(303, "og:created"); assert.equal(users.get("303").okx, "unverified", "account created -> KYC still to do");
  assert.match(last(303).text, /Last step/); await tap(303, "cf:no");
  assert.match(last(303).text, /open to traders 18 or older based in Lebanon/); assert.equal(users.get("303").consent, "no"); assert.notEqual(users.get("303").status, "complete");
  log("no OKX account / not verified: OKX-link step before the confirm (can't be skipped); 'created' marks KYC pending");
  log("Arabic signup with Arabic name, verified users get no affiliate button, 'No' on the confirm ends signup politely");

  // people stuck at a step of the OLD flow get carried into the new one
  users.set("606", { tg_id: "606", lang: "en", step: "exp", status: "", ref: "", consent: "", deleted: "", name: "Old Flow", okx: "none", first_name: "Old", last_name: "Flow" });
  await tap(606, "resume"); assert.match(last(606).text, /create your OKX account/, "stuck at old 'trading style' step, no OKX -> the OKX-link step");
  users.set("607", { tg_id: "607", lang: "en", step: "name", status: "", ref: "", consent: "", deleted: "", name: "", okx: "", first_name: "New", last_name: "Person" });
  await tap(607, "resume"); assert.equal(users.get("607").name, "Test Trader", "name filled from the live Telegram profile"); assert.match(last(607).text, /Do you have an OKX account/);
  users.delete("606"); users.delete("607");
  log("anyone stuck at an old step (name, phone, style...) resumes into the 2-tap flow");

  // 5. FAQ + question to admins + admin reply
  await tap(101, "m:prizes"); assert.match(last(101).text, /5,000 USDT prize pool/); assert.match(last(101).text, /1,000 USDT in leaderboard rewards/);
  await tap(101, "m:ask"); await msg(101, "Can I use my existing account?");
  const q = last(900); assert.match(q.text, /#u101/); assert.match(q.text, /existing account/);
  await bot.handle({ update_id: ++uid, message: { message_id: uid, chat: { id: 900, type: "private" }, from: from(900), text: "Yes, we'll check it with you.", reply_to_message: { text: q.text } } });
  assert.match(last(101).text, /<b>PNL League:<\/b>\nYes, we'll check it with you\./);
  log("FAQ answers, question forwarded to admin with #u id, admin reply delivered to user");

  // 6. admin: stats + broadcast
  await msg(101, "/stats"); assert.notStrictEqual(last(101).text.indexOf("Early list"), 0, "non-admin cannot see stats");
  await msg(900, "/stats"); assert.match(last(900).text, /Signed up: <b>2<\/b>/); assert.match(last(900).text, /rami: 1/);
  await msg(900, "/broadcast KYC reminder: get verified before 1 Nov <b>now</b>");
  const confirm = last(900); const id = buttons(confirm)[0].split(":")[2];
  assert.match(sent[sent.length - 2].text, /&lt;b&gt;now&lt;\/b&gt;/, "admin text is escaped");
  await tap(900, `bc:send:${id}`); assert.match(last(900).text, /Sending to/); assert.equal(broadcasts.get(id).status, "queued");
  await tap(900, `bc:send:${id}`); assert.match(last(900).text, /Not sent/);
  await msg(900, "/launch"); assert.equal(broadcasts.get("2").button.ar.url, cfg.OKX_CAMPAIGN_URL);
  log("admin /stats, /broadcast preview + confirm, double-send blocked, /launch has OKX button in both languages");

  // nudge: only people who started but didn't finish; button resumes at their step
  await msg(505, "/start lead1"); await tap(505, "lang:en"); // now waiting on the OKX question
  await msg(900, "/nudge");
  assert.match(sent[sent.length - 3].text, /goes to <b>2<\/b> people \(didn't finish signup/); // user 505 + the admin, who never signed up; finished (101), opted-out (202) and ineligible (303) are excluded
  assert.match(sent[sent.length - 2].text, /one step away/); assert.deepStrictEqual(buttons(sent[sent.length - 2]), ["resume"]);
  assert.equal([...broadcasts.values()].pop().audience, "unfinished");
  assert.deepStrictEqual([...broadcasts.values()].pop().filter, { new_only: true }, "/nudge skips people already nudged");
  assert.match(sent[sent.length - 3].text, /never nudged before/);
  users.get("505").nudged = "yes"; await msg(900, "/nudge"); assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people/, "already-nudged user excluded");
  await msg(900, "/nudge all"); assert.equal([...broadcasts.values()].pop().filter, null); assert.match(sent[sent.length - 3].text, /INCLUDING people already nudged/);
  users.get("505").nudged = "";
  await tap(505, "resume"); assert.match(last(505).text, /Do you have an OKX account/);
  await tap(101, "resume"); assert.match(last(101).text, /You're on the list/);
  await msg(900, "/okx");
  assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people \(signed up, no OKX account or not verified, never got this message before\)/); // 101 unverified yes; 202 verified (and opted out) no
  assert.match(sent[sent.length - 2].text, /KYC-verified OKX account/); assert.ok(sent[sent.length - 2].text.includes(cfg.OKX_SIGNUP_URL), "link shown in text"); assert.deepStrictEqual(buttons(sent[sent.length - 2]), [cfg.OKX_SIGNUP_URL]);
  assert.deepStrictEqual([...broadcasts.values()].pop().filter, { okx: ["none", "unverified"], new_only: true });
  assert.match(sent[sent.length - 3].text, /never got this message before/);
  users.get("101").got = "okx"; await msg(900, "/okx"); assert.match(sent[sent.length - 3].text, /goes to <b>0<\/b> people/, "already-received excluded");
  await msg(900, "/okx all"); assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people .*INCLUDING/); users.get("101").got = "";
  log("/okx targets only signed-up people without a verified OKX account, once per person (/okx all to resend)");

  // people update their own OKX status (the bot can't see OKX)
  await msg(101, "/start"); assert.ok(buttons(last(101)).includes("okxu"), "menu offers OKX update when not verified");
  await tap(101, "okxu"); assert.match(last(101).text, /Where's your OKX account at now/);
  await tap(101, "okxu:verified"); assert.equal(users.get("101").okx, "verified"); assert.match(last(101).text, /ready for day one/);
  await msg(101, "/start"); assert.ok(!buttons(last(101)).includes("okxu"), "button gone once verified");
  await tap(303, "okxu"); assert.ok(!/Where's your OKX/.test(last(303).text), "only signed-up users can update");
  await tap(101, "okxu:none"); assert.equal(users.get("101").okx, "none"); assert.ok(last(101).text.includes(cfg.OKX_SIGNUP_URL));
  await msg(900, "/okxcheck");
  assert.match(sent[sent.length - 3].text, /\(signed up, no OKX account or not verified, never got this message before\)/);
  assert.deepStrictEqual(buttons(sent[sent.length - 2]), ["okxu"]); assert.deepStrictEqual([...broadcasts.values()].pop().filter, { okx: ["none", "unverified"], new_only: true });
  log("/okxcheck asks only non-verified signups to update their OKX status (one-tap button)");
  log("'Update my OKX status': signed-up users update okx themselves; link shown if still none; button hides once verified");
  log("/nudge targets only unfinished signups; 'Finish my signup' resumes at the exact step; finished users just see the menu");

  // 7. stop / delete
  await msg(202, "/stop"); assert.equal(users.get("202").consent, "no");
  await msg(202, "/delete"); assert.equal(users.get("202").name, ""); assert.equal(users.get("202").phone || "", "");
  log("/stop opts out, /delete wipes personal fields");

  // 8. launch day
  clock = new Date("2026-11-01T12:00:01+03:00").getTime();
  await msg(404, "/start"); await tap(404, "lang:en");
  assert.match(last(404).text, /Registration is open/); assert.ok(buttons(last(404)).includes(cfg.OKX_CAMPAIGN_URL)); assert.ok(!buttons(last(404)).includes("join"));
  await tap(404, "join"); assert.match(last(404).text, /Registration is open/);
  log("after REG_OPENS: welcome switches to 'Registration is open' + OKX button, signup closed");

  // ad bridge page (/go/<tag>)
  const go = require("../api/go");
  const render = (ref, ua, q = {}) => { let out = { code: 0, body: "", h: {} }; go({ query: { ref, ...q }, headers: { "user-agent": ua } }, { setHeader: (k, v) => (out.h[k] = v), status: (c) => ({ send: (b) => { out.code = c; out.body = b; } }) }); return out; };
  process.env.BOT_USERNAME = "PNLLeagueBot";
  const and = render("Lead3", "Mozilla/5.0 (Linux; Android 14) Instagram 300.0");
  assert.equal(and.code, 200); assert.match(and.body, /intent:\/\/resolve\?domain=PNLLeagueBot&amp;start=lead3#Intent;scheme=tg;package=org.telegram.messenger/);
  assert.match(and.body, /play\.google\.com\/store\/apps\/details\?id=org\.telegram\.messenger/);
  const ios = render("lead3", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Instagram");
  assert.match(ios.body, /href="tg:\/\/resolve\?domain=PNLLeagueBot&amp;start=lead3"/); assert.match(ios.body, /apps\.apple\.com/);
  const desk = render("lead3", "Mozilla/5.0 (Windows NT 10.0)");
  assert.match(desk.body, /href="https:\/\/t\.me\/PNLLeagueBot\?start=lead3"/);
  const evil = render("<script>", "Mozilla/5.0 (Android)");
  assert.ok(!evil.body.includes("<script>alert") && /domain=PNLLeagueBot#Intent/.test(evil.body), "bad tag dropped, plain bot link used");
  assert.match(render("lead3", "x", { lang: "ar" }).body, /dir="rtl"/);
  log("/go bridge page: Android intent link, iPhone tg:// link, desktop t.me link, store links, bad tags dropped, Arabic version");

  // /stats shows the ad funnel once the page has traffic
  const realStats = db.stats; db.stats = async () => ({ ...(await realStats()), clicks: { lead3: { view: 120, tap_open: 45, tap_get_telegram: 9 } }, opened_by_ref: { lead3: 30 }, by_ref: { lead3: 12 } });
  await msg(900, "/stats"); assert.match(last(900).text, /lead3: 120 views → 45 taps → 30 in bot → 12 signed · 9 needed Telegram/);
  db.stats = realStats;
  log("/stats adds the ad-page funnel per tag");
  const before = sent.length;
  await msg(950, "/stats"); assert.match(last(950).text, /Early list/, "stats-only viewer gets /stats");
  await msg(950, "/broadcast hi"); assert.ok(!/Preview/.test(last(950).text), "stats-only viewer can't broadcast");
  await msg(950, "/okx"); await msg(950, "/nudge"); assert.ok(!sent.slice(before).some((m) => /Preview/.test(m.text || "")), "no broadcast previews for viewer");
  log("STATS_IDS: read-only /stats for the ads team, no broadcasts");
  await msg(900, "/rebind"); assert.match(last(900).text, /as a video/, "/rebind without a video only explains how");
  const okx101 = users.get("101").okx; users.get("101").okx = "verified";
  await msg(900, undefined, { video: { file_id: "VID123" }, caption: "/rebind" });
  assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people \(signed up, already had an OKX account, never got this message before\)/);
  const pv = sent[sent.length - 2]; assert.equal(pv.video, "VID123", "preview is the video"); assert.match(pv.text, /Join this community/); assert.match(pv.text, /1 Nov at 12:00/);
  assert.ok(buttons(pv)[0].includes("rebindCode="), "rebind link button");
  const rb = [...broadcasts.values()].pop(); assert.equal(rb.video, "VID123"); assert.equal(rb.kind, "rebind"); assert.deepStrictEqual(rb.filter, { okx: ["verified", "unverified"], new_only: true });
  assert.ok(rb.text.ar.length < 1024 && rb.text.en.length < 1024, "captions fit Telegram's 1024 limit");
  await msg(950, undefined, { video: { file_id: "X" }, caption: "/rebind" }); assert.equal(rb, [...broadcasts.values()].pop(), "stats viewer can't /rebind");
  await msg(900, undefined, { video: { file_id: "VID123" }, caption: "/rebind test" });
  assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people \(TEST, only you\)/); assert.equal(sent[sent.length - 2].video, "VID123");
  assert.deepStrictEqual([...broadcasts.values()].pop().filter, { only: "900" }); assert.equal([...broadcasts.values()].pop().kind, "rebindtest", "test send doesn't count as the real one");
  users.get("101").okx = okx101;
  log("/rebind: video-only broadcast (caption + OKX rebind button) to signed-up people who already had an OKX account, once each");

  // 9. Apps Script phone normaliser
  const gs = fs.readFileSync(path.join(__dirname, "../apps-script/Code.gs"), "utf8");
  const fn = new Function(gs.replace(/\r\n/g, "\n").match(/function normalisePhone_[\s\S]*?\n}\n/)[0] + "; return normalisePhone_;")();
  [["+96171234567", "+96171234567"], ["96171234567", "+96171234567"], ["03 123 456", "+9613123456"], ["+961 3 123 456", "+9613123456"], ["0096176123456", "+96176123456"], ["+33612345678", "+33612345678"], ["+961 12", ""]]
    .forEach(([i, o]) => assert.equal(fn(i), o, i));
  log("Sheet phone normaliser (Lebanese + international)");

  console.log(`\nAll checks passed · ${sent.length} messages simulated`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
