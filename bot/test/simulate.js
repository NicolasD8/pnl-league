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
  call: async () => ({}),
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
    const base = p.audience === "unfinished" ? unfinished : (u) => u.status === "complete" && u.consent === "yes";
    const f = p.filter || {};
    return { id, recipients: [...users.values()].filter((u) => base(u) && Object.keys(f).every((k) => f[k].includes(String(u[k] || "")))).length };
  },
  async sendBroadcast(id) { const b = broadcasts.get(id); if (b.status !== "draft") return { started: false, error: "status is " + b.status }; b.status = "queued"; return { started: true, recipients: 1 }; },
  async cancelBroadcast(id) { broadcasts.get(id).status = "cancelled"; return {}; },
};
function pick(u) { const o = {}; ["username", "first_name", "last_name"].forEach((k) => { if (u[k] !== undefined) o[k] = u[k]; }); return o; }

let clock = new Date("2026-10-26T10:00:00+02:00").getTime();
const cfg = { BOT_USERNAME: "PNLLeagueBot", ADMIN_IDS: "900", REG_OPENS: "2026-11-01T12:00:00+03:00", OKX_CAMPAIGN_URL: "https://www.okx.com/campaigns/ce-community-trading-competition-phase-1", OKX_SIGNUP_URL: "https://example.com/okx-affiliate" };
const bot = createBot({ tg, db, cfg, now: () => clock });

let uid = 0;
const from = (id, extra = {}) => ({ id, is_bot: false, first_name: "Test", last_name: "Trader", username: "tt" + id, ...extra });
const msg = (id, text, extra = {}) => bot.handle({ update_id: ++uid, message: { message_id: uid, chat: { id, type: "private" }, from: from(id), text, ...extra } });
const tap = (id, data) => bot.handle({ update_id: ++uid, callback_query: { id: "q" + uid, from: from(id), data, message: { message_id: 1, chat: { id, type: "private" } } } });
const last = (chat) => [...sent].reverse().find((s) => s.chat === String(chat));
const buttons = (s) => (s.kb && s.kb.inline_keyboard ? s.kb.inline_keyboard.flat().map((b) => b.callback_data || b.url) : []);
const log = (label) => console.log("✓", label);

(async () => {
  // 1. creator link + language
  await msg(101, "/start rami");
  assert.match(last(101).text, /Choose your language/); assert.equal(users.get("101").ref, "rami");
  await tap(101, "lang:en");
  assert.match(last(101).text, /Registration opens on OKX in <b>6d 1h<\/b>/); assert.ok(buttons(last(101)).includes("join"));
  log("ref captured from /start rami, language picker, countdown in welcome");

  // 2. full signup
  await tap(101, "join");
  assert.equal(last(101).text, "What's your full name?"); assert.equal(last(101).kb.keyboard[0][0].text, "Test Trader");
  await msg(101, "x"); assert.match(last(101).text, /doesn't look like a full name/);
  await msg(101, "Test Trader");
  assert.match(last(101).text, /Share your phone number/); assert.equal(last(101).kb.keyboard[0][0].request_contact, true);
  await msg(101, "", { contact: { phone_number: "96171234567", user_id: 999 } }); assert.match(last(101).text, /your own number/);
  await msg(101, "", { contact: { phone_number: "96171234567", user_id: 101 } });
  assert.equal(users.get("101").phone, "+96171234567");
  assert.match(last(101).text, /Do you have an OKX account/);
  await tap(101, "consent:yes"); assert.equal(users.get("101").status, "", "out-of-order button must be ignored");
  await tap(101, "okx:unverified");
  await tap(101, "exp:futures");
  await tap(101, "elig:yes");
  await tap(101, "consent:yes");
  const cardMsg = last(101);
  assert.ok(cardMsg.photo && cardMsg.photo.length > 20000, "contender card PNG sent"); assert.match(cardMsg.text, /#0015/);
  assert.deepStrictEqual([...cardMsg.photo.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47], "is a PNG");
  const done = sent[sent.length - 2];
  assert.match(done.text, /You're in, Test/); assert.match(done.text, /KYC verified now/);
  assert.ok(buttons(done).includes(cfg.OKX_SIGNUP_URL), "affiliate button for unverified");
  assert.ok(buttons(done).some((u) => u && u.includes("t.me/share/url") && decodeURIComponent(u).includes("t.me/PNLLeagueBot?start=rami")), "invite carries ref");
  assert.equal(users.get("101").status, "complete");
  log("signup: name validation, own-contact check, stale buttons ignored, done screen with affiliate + invite link");
  log("contender card: real PNG rendered and sent after signup, numbered #0015 (first number)");

  // 3. returning user
  await msg(101, "/start"); assert.match(last(101).text, /You're on the list, <b>Test<\/b>/); assert.ok(!buttons(last(101)).includes("join"));
  log("returning user sees 'You're on the list', no join button");

  // 4. Arabic user, verified, ineligible path and consent refusal
  await msg(202, "/start"); await tap(202, "lang:ar");
  assert.match(last(202).text, /أول بطولة تداول مباشرة/);
  await tap(202, "join"); await msg(202, "سارة خوري"); await msg(202, "تخطَّ");
  await tap(202, "okx:verified"); await tap(202, "exp:"); await tap(202, "elig:yes"); await tap(202, "consent:yes");
  assert.match(sent[sent.length - 2].text, /أنت معنا يا سارة/); assert.ok(!buttons(sent[sent.length - 2]).includes(cfg.OKX_SIGNUP_URL), "no affiliate button for verified");
  assert.match(last(202).text, /#0016/); assert.ok(last(202).photo, "Arabic card sent");
  await msg(303, "/card"); assert.match(last(303).text, /unlocks when you join/);
  await msg(101, "/card"); assert.ok(last(101).photo && /#0015/.test(last(101).text), "/card resends same number");
  await msg(303, "/start"); await tap(303, "lang:en"); await tap(303, "join"); await msg(303, "Minor Person"); await msg(303, "Skip");
  await tap(303, "okx:none"); await tap(303, "exp:new"); await tap(303, "elig:no");
  assert.match(last(303).text, /open to traders 18 or older/); assert.equal(users.get("303").status, "ineligible");
  log("Arabic signup, verified users get no affiliate button, under-18/outside-Lebanon path");

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
  await msg(505, "/start lead1"); await tap(505, "lang:en"); await tap(505, "join"); await msg(505, "Half Way"); // now waiting on phone
  await msg(900, "/nudge");
  assert.match(sent[sent.length - 3].text, /goes to <b>2<\/b> people \(started but didn't finish/); // user 505 + the admin, who never signed up; finished (101), opted-out (202) and ineligible (303) are excluded
  assert.match(sent[sent.length - 2].text, /one step away/); assert.deepStrictEqual(buttons(sent[sent.length - 2]), ["resume"]);
  assert.equal([...broadcasts.values()].pop().audience, "unfinished");
  await tap(505, "resume"); assert.match(last(505).text, /Share your phone number/);
  await tap(101, "resume"); assert.match(last(101).text, /You're on the list/);
  await msg(900, "/okx");
  assert.match(sent[sent.length - 3].text, /goes to <b>1<\/b> people \(signed up, no OKX account or not verified\)/); // 101 unverified yes; 202 verified (and opted out) no
  assert.match(sent[sent.length - 2].text, /KYC-verified OKX account/); assert.ok(sent[sent.length - 2].text.includes(cfg.OKX_SIGNUP_URL), "link shown in text"); assert.deepStrictEqual(buttons(sent[sent.length - 2]), [cfg.OKX_SIGNUP_URL]);
  assert.deepStrictEqual([...broadcasts.values()].pop().filter, { okx: ["none", "unverified"] });
  log("/okx targets only signed-up people without a verified OKX account, with the affiliate button");

  // people update their own OKX status (the bot can't see OKX)
  await msg(101, "/start"); assert.ok(buttons(last(101)).includes("okxu"), "menu offers OKX update when not verified");
  await tap(101, "okxu"); assert.match(last(101).text, /Where's your OKX account at now/);
  await tap(101, "okxu:verified"); assert.equal(users.get("101").okx, "verified"); assert.match(last(101).text, /ready for day one/);
  await msg(101, "/start"); assert.ok(!buttons(last(101)).includes("okxu"), "button gone once verified");
  await tap(303, "okxu"); assert.ok(!/Where's your OKX/.test(last(303).text), "only signed-up users can update");
  await tap(101, "okxu:none"); assert.equal(users.get("101").okx, "none"); assert.ok(last(101).text.includes(cfg.OKX_SIGNUP_URL));
  await msg(900, "/okxcheck");
  assert.match(sent[sent.length - 3].text, /\(signed up, no OKX account or not verified\)/);
  assert.deepStrictEqual(buttons(sent[sent.length - 2]), ["okxu"]); assert.deepStrictEqual([...broadcasts.values()].pop().filter, { okx: ["none", "unverified"] });
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

  // 9. Apps Script phone normaliser
  const gs = fs.readFileSync(path.join(__dirname, "../apps-script/Code.gs"), "utf8");
  const fn = new Function(gs.replace(/\r\n/g, "\n").match(/function normalisePhone_[\s\S]*?\n}\n/)[0] + "; return normalisePhone_;")();
  [["+96171234567", "+96171234567"], ["96171234567", "+96171234567"], ["03 123 456", "+9613123456"], ["+961 3 123 456", "+9613123456"], ["0096176123456", "+96176123456"], ["+33612345678", "+33612345678"], ["+961 12", ""]]
    .forEach(([i, o]) => assert.equal(fn(i), o, i));
  log("Sheet phone normaliser (Lebanese + international)");

  console.log(`\nAll checks passed · ${sent.length} messages simulated`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
