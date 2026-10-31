// PNL League bot: early-list signup, FAQ, private questions to admins, creator refs, admin broadcast.
// Stateless: each user's progress lives in the Sheet ("step" column), so it survives serverless restarts.
const { t } = require("./text");

const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const btn = (text, data) => ({ text, callback_data: data });
const url = (text, u) => ({ text, url: u });
const REF_RE = /^[A-Za-z0-9_-]{1,40}$/;

function countdown(ms, lang) {
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  if (lang === "ar") return d > 0 ? `${d} يوم و${h} ساعة` : h > 0 ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`;
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function createBot({ tg, db, cfg, now = () => Date.now(), card = (o) => require("./card").renderCard(o) }) {
  const admins = new Set(String(cfg.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));
  const adminChat = cfg.ADMIN_CHAT_ID || [...admins][0];
  const opensAt = new Date(cfg.REG_OPENS || "2026-11-01T12:00:00+03:00").getTime();
  const isOpen = () => now() >= opensAt;
  const isAdmin = (id) => admins.has(String(id));
  // read-only: /stats and nothing else (e.g. the ads team)
  const viewers = new Set(String(cfg.STATS_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));
  const canSeeStats = (id) => isAdmin(id) || viewers.has(String(id));
  // existing OKX accounts join the PNL League affiliate community through this link
  const REBIND_URL = cfg.OKX_REBIND_URL || "https://okx.com/ul/f1IP61?channelId=8754277&rebindCode=TGQ27Z5X";

  /* ---------- screens ---------- */
  function menu(L, row) {
    const rows = [];
    if (isOpen()) rows.push([url(L.bRegister, cfg.OKX_CAMPAIGN_URL)]);
    else if (row.status !== "complete") rows.push([btn(L.bJoin, "join")]);
    else if (row.okx !== "verified") rows.push([btn(L.bOkxUpdate, "okxu")]); // the bot can't see OKX, so let people tell us
    rows.push([btn(L.bHow, "m:how"), btn(L.bPrizes, "m:prizes")]);
    rows.push([btn(L.bRules, "m:rules"), btn(L.bAsk, "m:ask")]);
    rows.push([btn(L.bPrivacy, "m:privacy"), btn(L.bLang, row.lang === "ar" ? "lang:en" : "lang:ar")]);
    return { inline_keyboard: rows };
  }

  async function home(chat, row) {
    const L = t(row.lang);
    const left = opensAt - now();
    const text = isOpen() ? L.open
      : row.status === "complete" ? L.welcomeBack(esc(firstName(row)), countdown(left, row.lang))
      : L.welcome(countdown(left, row.lang));
    await tg.send(chat, text, { reply_markup: menu(L, row) });
  }

  const back = (L) => ({ inline_keyboard: [[btn(L.bBack, "m:home")]] });
  const firstName = (row) => String(row.name || row.first_name || "").split(" ")[0];

  /* ---------- signup steps ---------- */
  async function ask(chat, row, step) {
    const L = t(row.lang);
    await db.save(row.tg_id, { step });
    if (step === "name") {
      const suggest = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
      const kb = suggest.includes(" ") ? { keyboard: [[{ text: suggest }]], resize_keyboard: true, one_time_keyboard: true, input_field_placeholder: L.askName }
        : { force_reply: true, input_field_placeholder: L.askName };
      return tg.send(chat, L.askName, { reply_markup: kb });
    }
    if (step === "phone") {
      return tg.send(chat, L.askPhone, { reply_markup: { keyboard: [[{ text: L.bShare, request_contact: true }], [{ text: L.bSkip }]], resize_keyboard: true, one_time_keyboard: true } });
    }
    if (step === "okx") {
      return tg.send(chat, L.askOkx, { reply_markup: { inline_keyboard: [[btn(L.okx.verified, "okx:verified")], [btn(L.okx.unverified, "okx:unverified")], [btn(L.okx.none, "okx:none")]] } });
    }
    if (step === "okxgo") { // no account / not verified: point them at the affiliate link before they can confirm
      const kb = row.okx === "none"
        ? [[url(L.bCreateOkx, cfg.OKX_SIGNUP_URL)], [btn(L.bOkxCreated, "og:created")]]
        : [[url(L.bOpenOkx, cfg.OKX_SIGNUP_URL)], [btn(L.bOkxVerifiedNow, "og:verified")], [btn(L.bOkxLater, "og:later")]];
      return tg.send(chat, L.okxGo[row.okx === "none" ? "none" : "unverified"], { reply_markup: { inline_keyboard: kb } });
    }
    if (step === "exp") {
      return tg.send(chat, L.askExp, { reply_markup: { inline_keyboard: [[btn(L.exp.futures, "exp:futures"), btn(L.exp.spot, "exp:spot")], [btn(L.exp.both, "exp:both"), btn(L.exp.new, "exp:new")], [btn(L.exp.skip, "exp:")]] } });
    }
    if (step === "elig") {
      return tg.send(chat, L.askElig, { reply_markup: { inline_keyboard: [[btn(L.yes, "elig:yes"), btn(L.no, "elig:no")]] } });
    }
    if (step === "consent") {
      return tg.send(chat, L.askConsent, { reply_markup: { inline_keyboard: [[btn(L.bConsentYes, "consent:yes")], [btn(L.no, "consent:no")]] } });
    }
    if (step === "confirm") {
      return tg.send(chat, L.askConfirm(esc(firstName(row))), { reply_markup: { inline_keyboard: [[btn(L.bConfirm, "cf:yes")], [btn(L.bNotEligible, "cf:no")]] } });
    }
  }

  // Signup is two taps: OKX status, then one confirmation (18+, Lebanon, OK with messages).
  // No account / not verified adds one stop in between: the affiliate link, before they can confirm.
  // The name comes from the Telegram profile (/name changes it); phone is optional after signup.
  // Also where anyone stuck at an old step (name/phone/style/...) gets picked up.
  const tgName = (row) => [row.first_name, row.last_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().slice(0, 80);
  async function startSignup(chat, row) {
    if (isOpen() || row.status === "complete") return home(chat, row);
    if (!row.lang) row = await db.save(row.tg_id, { lang: "en" });
    if (!row.name && tgName(row).length >= 2) row = await db.save(row.tg_id, { name: tgName(row) });
    if (!row.name) return ask(chat, row, "name"); // no usable Telegram name: ask once
    if (!["verified", "unverified", "none"].includes(row.okx)) return ask(chat, row, "okx");
    if (row.okx !== "verified" && cfg.OKX_SIGNUP_URL) return ask(chat, row, "okxgo");
    return ask(chat, row, "confirm");
  }

  async function finish(chat, row) {
    const L = t(row.lang);
    row = await db.save(row.tg_id, { step: "", status: "complete", consent: "yes", eligible: "yes" });
    const kyc = row.okx === "verified" ? L.kycDone : L.kycTodo;
    const ref = row.ref && REF_RE.test(row.ref) ? row.ref : "";
    const link = `https://t.me/${cfg.BOT_USERNAME}${ref ? "?start=" + ref : ""}`;
    const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(L.inviteText)}`;
    const kb = [];
    if (row.okx !== "verified" && cfg.OKX_SIGNUP_URL) kb.push([url(L.bOpenOkx, cfg.OKX_SIGNUP_URL)]);
    kb.push([url(L.bInvite, share)]);
    if (!row.phone) kb.push([btn(L.bAddPhone, "addphone")]);
    kb.push([btn(L.bBack, "m:home")]);
    await tg.send(chat, L.done(esc(firstName(row)), kyc) + "\n\n<i>" + L.nameHint + "</i>", { reply_markup: { inline_keyboard: kb } });
    await sendCard(chat, row);
  }

  const inviteLink = (row) => {
    const ref = row.ref && REF_RE.test(row.ref) ? row.ref : "";
    return `https://t.me/${cfg.BOT_USERNAME}${ref ? "?start=" + ref : ""}`;
  };

  // The shareable contender card. Never lets a rendering problem break signup.
  async function sendCard(chat, row) {
    const L = t(row.lang);
    try {
      const png = card({ name: row.name || row.first_name, no: row.no, link: inviteLink(row) });
      const share = `https://t.me/share/url?url=${encodeURIComponent(inviteLink(row))}&text=${encodeURIComponent(L.inviteText)}`;
      await tg.sendPhoto(chat, png, { caption: L.cardCaption(row.no), parse_mode: "HTML", reply_markup: { inline_keyboard: [[url(L.bInvite, share)]] } });
    } catch (err) {
      console.error("card failed", err && err.message);
    }
  }

  // Bridge-page funnel per tag: page views -> tapped Open -> opened the bot -> signed up
  function adFunnel(s) {
    const c = s.clicks || {};
    const tags = Object.keys(c).filter((k) => (c[k].view || 0) > 0 && !["selftest", "probe"].includes(k)).sort((a, b) => (c[b].view || 0) - (c[a].view || 0));
    if (!tags.length) return "";
    const lines = tags.slice(0, 10).map((k) => {
      const v = c[k], opened = (s.opened_by_ref || {})[k] || 0, signed = (s.by_ref || {})[k] || 0;
      return `${esc(k)}: ${v.view || 0} views → ${v.tap_open || 0} taps → ${opened} in bot → ${signed} signed${v.tap_get_telegram ? ` · ${v.tap_get_telegram} needed Telegram` : ""}`;
    });
    return `\n\n<b>Ad page (/go)</b>\n${lines.join("\n")}`;
  }

  /* ---------- admin ---------- */
  async function adminCommand(chat, from, cmd, arg, row, video) {
    if (cmd === "/whoami") { await tg.send(chat, `Your Telegram ID: <code>${from.id}</code>\nThis chat ID: <code>${chat}</code>`); return true; }
    if (cmd === "/stats" && !canSeeStats(from.id)) return false;
    if (cmd !== "/stats" && !isAdmin(from.id)) return false;
    if (cmd === "/stats") {
      const s = await db.stats();
      const top = Object.entries(s.by_ref || {}).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${esc(k)}: ${v}`).join("\n") || "none yet";
      await tg.send(chat,
        `<b>Early list</b>\nSigned up: <b>${s.complete}</b> (started: ${s.started})\nOpted out / blocked: ${s.stopped} / ${s.blocked}\n\n` +
        `<b>OKX</b> verified ${s.by_okx.verified || 0} · not verified ${s.by_okx.unverified || 0} · none ${s.by_okx.none || 0}\n` +
        `<b>Language</b> EN ${s.by_lang.en || 0} · AR ${s.by_lang.ar || 0}\n\n<b>By source</b>\n${top}` + adFunnel(s));
      return true;
    }
    if (cmd === "/broadcast" || cmd === "/launch" || cmd === "/nudge" || cmd === "/okx" || cmd === "/okxcheck" || cmd === "/rebind") {
      let payload;
      const everyoneAgain = arg.toLowerCase() === "all", testOnly = arg.toLowerCase() === "test";
      if (cmd === "/rebind") { // video only: existing OKX accounts join the PNL League community via the rebind link
        if (!video) { await tg.send(chat, "Send the edited video to me <b>as a video</b> (not as a file), with <code>/rebind</code> as its caption. Caption <code>/rebind test</code> sends it only to you first; <code>/rebind all</code> resends to people who already got it."); return true; }
        payload = { kind: testOnly ? "rebindtest" : "rebind", audience: testOnly ? "test" : "signed_up", video, filter: testOnly ? { only: String(from.id) } : everyoneAgain ? { okx: ["verified", "unverified"] } : { okx: ["verified", "unverified"], new_only: true }, text: { en: t("en").rebind, ar: t("ar").rebind }, button: { en: { text: t("en").bRebind, url: REBIND_URL }, ar: { text: t("ar").bRebind, url: REBIND_URL } } };
      } else if (cmd === "/okxcheck") {
        payload = { kind: "okxcheck", audience: "signed_up", filter: everyoneAgain ? { okx: ["none", "unverified"] } : { okx: ["none", "unverified"], new_only: true }, text: { en: t("en").okxCheck, ar: t("ar").okxCheck }, button: { en: { text: t("en").bOkxUpdate, data: "okxu" }, ar: { text: t("ar").bOkxUpdate, data: "okxu" } } };
      } else if (cmd === "/okx") {
        if (!cfg.OKX_SIGNUP_URL) { await tg.send(chat, "Set OKX_SIGNUP_URL in Vercel first (your OKX affiliate link), then redeploy."); return true; }
        payload = { kind: "okx", audience: "signed_up", filter: everyoneAgain ? { okx: ["none", "unverified"] } : { okx: ["none", "unverified"], new_only: true }, text: { en: t("en").okxNudge(cfg.OKX_SIGNUP_URL), ar: t("ar").okxNudge(cfg.OKX_SIGNUP_URL) }, button: { en: { text: t("en").bOpenOkx, url: cfg.OKX_SIGNUP_URL }, ar: { text: t("ar").bOpenOkx, url: cfg.OKX_SIGNUP_URL } } };
      } else if (cmd === "/nudge") {
        const everyone = arg.toLowerCase() === "all";
        payload = { kind: "nudge", audience: "unfinished", filter: everyone ? null : { new_only: true }, text: { en: t("en").nudge, ar: t("ar").nudge }, button: { en: { text: t("en").bResume, data: "resume" }, ar: { text: t("ar").bResume, data: "resume" } } };
      } else if (cmd === "/launch") {
        payload = { kind: "launch", text: { en: t("en").open, ar: t("ar").open }, button: { en: { text: t("en").bRegister, url: cfg.OKX_CAMPAIGN_URL }, ar: { text: t("ar").bRegister, url: cfg.OKX_CAMPAIGN_URL } } };
      } else {
        if (!arg) { await tg.send(chat, "Usage: <code>/broadcast your message</code>\nSame text goes to everyone. For the launch-day message in both languages with the OKX button, use /launch."); return true; }
        payload = { kind: "text", text: { en: esc(arg), ar: esc(arg) } };
      }
      const d = await db.draftBroadcast({ ...payload, admin_chat: String(chat) });
      const again = payload.filter && payload.filter.new_only ? "never got this message before" : "INCLUDING people who already got it";
      const who = payload.audience === "unfinished" ? (payload.filter && payload.filter.new_only ? "didn't finish signup, never nudged before" : "didn't finish signup, INCLUDING people already nudged") : payload.kind === "okx" || payload.kind === "okxcheck" ? `signed up, no OKX account or not verified, ${again}` : payload.kind === "rebind" ? `signed up, already had an OKX account, ${again}` : payload.audience === "test" ? "TEST, only you" : "signed up, opted in";
      await tg.send(chat, `<b>Preview</b> · goes to <b>${d.recipients}</b> people (${who}):`);
      const pb = payload.button && payload.button.en;
      const pkb = pb ? { reply_markup: { inline_keyboard: [[pb.data ? btn(pb.text, pb.data) : url(pb.text, pb.url)]] } } : {};
      const ptext = payload.text[row.lang === "ar" ? "ar" : "en"];
      if (payload.video) await tg.call("sendVideo", { chat_id: chat, video: payload.video, caption: ptext, parse_mode: "HTML", ...pkb });
      else await tg.send(chat, ptext, pkb);
      await tg.send(chat, "Send it?", { reply_markup: { inline_keyboard: [[btn(`Send to ${d.recipients}`, `bc:send:${d.id}`), btn("Cancel", `bc:cancel:${d.id}`)]] } });
      return true;
    }
    return false;
  }

  /* ---------- update router ---------- */
  async function handle(update) {
    // admin answering a forwarded question (reply in the admin chat)
    const msg = update.message;
    if (msg && String(msg.chat.id) === String(adminChat) && msg.reply_to_message && isAdmin(msg.from.id)) {
      const m = /#u(\d+)/.exec(msg.reply_to_message.text || "");
      if (m && msg.text && !msg.text.startsWith("/")) {
        const target = await db.touch({ id: Number(m[1]) });
        await tg.send(m[1], t(target.lang).answer(esc(msg.text)));
        await tg.send(msg.chat.id, "Sent ✓", { reply_to_message_id: msg.message_id });
        return;
      }
    }

    if (update.callback_query) return onCallback(update.callback_query);
    if (!msg || msg.chat.type !== "private" || !msg.from || msg.from.is_bot) return;

    const chat = msg.chat.id, from = msg.from;
    const text = (msg.text || (msg.video ? msg.caption : "") || "").trim(); // a video's caption can carry an admin command (/rebind)
    const [cmdRaw, ...rest] = text.split(/\s+/);
    const cmd = text.startsWith("/") ? cmdRaw.split("@")[0].toLowerCase() : "";
    const arg = text.slice(cmdRaw.length).trim();

    let ref = "";
    if (cmd === "/start" && rest[0] && REF_RE.test(rest[0])) ref = rest[0].toLowerCase();
    let row = await db.touch({ id: from.id, username: from.username || "", first_name: from.first_name || "", last_name: from.last_name || "", language_code: from.language_code || "" }, ref);
    const L = t(row.lang);

    if (cmd && (await adminCommand(chat, from, cmd, arg, row, msg.video && msg.video.file_id))) return;

    if (cmd === "/start") {
      if (row.deleted === "yes" || row.consent === "no") row = await db.save(row.tg_id, { deleted: "", consent: "" });
      if (!row.lang) return tg.send(chat, L.pickLang, { reply_markup: { inline_keyboard: [[btn("English", "lang:en"), btn("العربية", "lang:ar")]] } });
      if (row.step) row = await db.save(row.tg_id, { step: "" });
      await home(chat, row);
      return isOpen() || row.status === "complete" ? undefined : startSignup(chat, row); // no extra "Join" tap
    }
    if (cmd === "/menu" || cmd === "/help") return home(chat, row);
    if (cmd === "/join") return startSignup(chat, row);
    if (cmd === "/name") return ask(chat, row, "name");
    if (cmd === "/language") return tg.send(chat, L.pickLang, { reply_markup: { inline_keyboard: [[btn("English", "lang:en"), btn("العربية", "lang:ar")]] } });
    if (cmd === "/stop") { await db.save(row.tg_id, { consent: "no", step: "" }); return tg.send(chat, L.stopped, { reply_markup: { remove_keyboard: true } }); }
    if (cmd === "/delete") {
      await db.save(row.tg_id, { deleted: "yes", consent: "no", step: "", status: "", name: "", phone: "", okx: "", exp: "", eligible: "", username: "", first_name: "", last_name: "", dup: "" });
      return tg.send(chat, L.deleted, { reply_markup: { remove_keyboard: true } });
    }
    if (cmd === "/card") {
      if (row.status !== "complete") return tg.send(chat, L.cardNotYet, { reply_markup: menu(L, row) });
      if (!row.no) row = await db.save(row.tg_id, {}); // older signups get their number now
      return sendCard(chat, row);
    }
    if (cmd === "/ask") { await db.save(row.tg_id, { step: "question" }); return tg.send(chat, L.askQ, { reply_markup: { force_reply: true } }); }

    // free text / contact, depending on where the user is
    if (row.step === "name" && text && !cmd) {
      const name = text.replace(/\s+/g, " ").slice(0, 80);
      if (name.length < 3 || !/\p{L}/u.test(name)) return tg.send(chat, L.badName);
      row = await db.save(row.tg_id, { name, step: "" });
      if (row.status === "complete") { await tg.send(chat, L.nameUpdated, { reply_markup: { remove_keyboard: true } }); return sendCard(chat, row); }
      return startSignup(chat, row);
    }
    if (row.step === "phone") {
      if (msg.contact) {
        if (msg.contact.user_id && msg.contact.user_id !== from.id) return tg.send(chat, L.notOwnContact);
        row = await db.save(row.tg_id, { phone: "+" + String(msg.contact.phone_number).replace(/\D/g, ""), step: "" }); // Telegram sends it without the +
        if (row.status === "complete") return tg.send(chat, L.phoneThanks, { reply_markup: { remove_keyboard: true } });
        await tg.send(chat, "✓", { reply_markup: { remove_keyboard: true } });
        return startSignup(chat, row);
      }
      if (text && !cmd) { // "Skip" or anything else
        row = await db.save(row.tg_id, { step: "" });
        await tg.send(chat, "✓", { reply_markup: { remove_keyboard: true } });
        return row.status === "complete" ? home(chat, row) : startSignup(chat, row);
      }
    }
    if (row.step === "question" && text && !cmd) {
      await db.save(row.tg_id, { step: "" });
      const who = `${esc(row.name || [from.first_name, from.last_name].filter(Boolean).join(" "))}${from.username ? " @" + esc(from.username) : ""}`;
      await tg.send(adminChat, `❓ <b>Question</b> from ${who} · ${row.lang === "ar" ? "AR" : "EN"} · #u${from.id}\n\n${esc(text)}\n\n<i>Reply to this message to answer.</i>`);
      return tg.send(chat, L.qSent, { reply_markup: menu(L, row) });
    }
    if (["okx", "okxgo", "exp", "elig", "consent", "confirm"].includes(row.step)) return tg.send(chat, L.useTypeHint);
    return home(chat, row);
  }

  async function onCallback(q) {
    const chat = q.message && q.message.chat.id, from = q.from, data = q.data || "";
    await tg.answer(q.id);
    if (!chat) return;
    let row = await db.touch({ id: from.id, username: from.username || "", first_name: from.first_name || "", last_name: from.last_name || "" });
    const [kind, val, extra] = data.split(":");

    if (kind === "bc" && isAdmin(from.id)) {
      await tg.clearButtons(chat, q.message.message_id);
      if (val === "send") { const r = await db.sendBroadcast(extra); return tg.send(chat, r.started ? `Sending to ${r.recipients} people now. I'll message you here when it's done.` : `Not sent: ${esc(r.error || "already sent or cancelled")}`); }
      await db.cancelBroadcast(extra);
      return tg.send(chat, "Cancelled.");
    }

    if (kind === "lang") {
      const first = !row.lang;
      row = await db.save(row.tg_id, { lang: val === "ar" ? "ar" : "en" });
      await tg.clearButtons(chat, q.message.message_id);
      if (!first) await tg.send(chat, t(row.lang).langSet);
      await home(chat, row);
      return first ? startSignup(chat, row) : undefined;
    }
    const L = t(row.lang);
    if (kind === "m") {
      if (val === "home") return home(chat, row);
      if (val === "ask") { await db.save(row.tg_id, { step: "question" }); return tg.send(chat, L.askQ, { reply_markup: { force_reply: true } }); }
      const body = { how: L.how, prizes: L.prizes, rules: L.rules, privacy: L.privacy }[val];
      if (body) return tg.send(chat, body, { reply_markup: val === "how" && row.status !== "complete" && !isOpen() ? { inline_keyboard: [[btn(L.bJoin, "join")], [btn(L.bBack, "m:home")]] } : back(L) });
      return;
    }
    if (kind === "okxu") {
      if (row.status !== "complete") return home(chat, row);
      if (!val) return tg.send(chat, L.okxAskAgain, { reply_markup: { inline_keyboard: [[btn(L.okx.verified, "okxu:verified")], [btn(L.okx.unverified, "okxu:unverified")], [btn(L.okx.none, "okxu:none")]] } });
      if (!["verified", "unverified", "none"].includes(val)) return;
      await tg.clearButtons(chat, q.message.message_id);
      row = await db.save(row.tg_id, { okx: val });
      const reply = val === "none" ? L.okxNow.none(esc(cfg.OKX_SIGNUP_URL || "")) : L.okxNow[val];
      const kb = val !== "verified" && cfg.OKX_SIGNUP_URL ? [[url(L.bOpenOkx, cfg.OKX_SIGNUP_URL)], [btn(L.bBack, "m:home")]] : [[btn(L.bBack, "m:home")]];
      return tg.send(chat, reply, { reply_markup: { inline_keyboard: kb } });
    }
    if (kind === "join" || kind === "resume") {
      return startSignup(chat, row); // also picks up anyone who stopped at an old step
    }
    if (kind === "addphone") {
      if (row.phone) return home(chat, row);
      return ask(chat, row, "phone");
    }
    if (kind === "cf") {
      if (row.status === "complete" || isOpen()) return home(chat, row);
      if (row.step !== "confirm") return startSignup(chat, row); // stale button
      await tg.clearButtons(chat, q.message.message_id);
      if (val !== "yes") { await db.save(row.tg_id, { consent: "no", step: "" }); return tg.send(chat, L.cfNo); }
      return finish(chat, row);
    }
    if (kind === "og") {
      if (row.status === "complete" || isOpen()) return home(chat, row);
      if (row.step !== "okxgo") return startSignup(chat, row); // stale button
      await tg.clearButtons(chat, q.message.message_id);
      if (val === "created") row = await db.save(row.tg_id, { okx: "unverified" }); // account made, KYC still to do
      if (val === "verified") row = await db.save(row.tg_id, { okx: "verified" });
      return ask(chat, row, "confirm");
    }

    // signup answers: only accept the one we're waiting for, so old buttons can't skip steps
    if (kind !== row.step) return;
    await tg.clearButtons(chat, q.message.message_id);
    if (kind === "okx" && ["verified", "unverified", "none"].includes(val)) { row = await db.save(row.tg_id, { okx: val }); return startSignup(chat, row); }
    // buttons left over from the old, longer flow
    if (kind === "exp") { row = await db.save(row.tg_id, { exp: ["futures", "spot", "both", "new"].includes(val) ? val : "" }); return startSignup(chat, row); }
    if (kind === "elig") {
      if (val !== "yes") { await db.save(row.tg_id, { eligible: "no", step: "", status: "ineligible" }); return tg.send(chat, L.inelig); }
      row = await db.save(row.tg_id, { eligible: "yes" });
      return startSignup(chat, row);
    }
    if (kind === "consent") {
      if (val !== "yes") { await db.save(row.tg_id, { consent: "no", step: "" }); return tg.send(chat, L.noConsent); }
      return finish(chat, row);
    }
  }

  return { handle, countdown };
}

module.exports = { createBot, countdown };
