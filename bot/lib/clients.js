// Thin clients for the Telegram Bot API and the Google Sheet (Apps Script web app). No dependencies.

function telegram(token, fetchImpl = fetch) {
  const base = `https://api.telegram.org/bot${token}/`;
  async function call(method, params = {}) {
    const r = await fetchImpl(base + method, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    });
    const j = await r.json().catch(() => ({ ok: false, description: "bad json" }));
    if (!j.ok) {
      const err = new Error(`telegram ${method}: ${j.description || r.status}`);
      err.code = j.error_code;
      throw err;
    }
    return j.result;
  }
  async function sendPhoto(chat_id, png, extra = {}) {
    const form = new FormData();
    form.append("chat_id", String(chat_id));
    form.append("photo", new Blob([png], { type: "image/png" }), "pnl-league-card.png");
    for (const [k, v] of Object.entries(extra)) form.append(k, typeof v === "string" ? v : JSON.stringify(v));
    const r = await fetchImpl(base + "sendPhoto", { method: "POST", body: form });
    const j = await r.json().catch(() => ({ ok: false }));
    if (!j.ok) throw new Error(`telegram sendPhoto: ${j.description || r.status}`);
    return j.result;
  }
  return {
    call,
    sendPhoto,
    send: (chat_id, text, extra = {}) =>
      call("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra }),
    answer: (callback_query_id, text) => call("answerCallbackQuery", { callback_query_id, text }).catch(() => {}),
    clearButtons: (chat_id, message_id) =>
      call("editMessageReplyMarkup", { chat_id, message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {}),
  };
}

function sheet(url, secret, fetchImpl = fetch) {
  async function call(action, payload = {}) {
    const r = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" }, // simple request; Apps Script reads postData.contents
      body: JSON.stringify({ secret, action, ...payload }),
      redirect: "follow",
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`sheet ${action}: ${j.error || "failed"}`);
    return j;
  }
  return {
    touch: (user, ref) => call("touch", { user, ref }).then((j) => j.row),
    save: (id, fields) => call("save", { id: String(id), fields }).then((j) => j.row),
    stats: () => call("stats").then((j) => j.stats),
    track: (ref, event, os) => call("track", { ref, event, os }),
    draftBroadcast: (payload) => call("draft_broadcast", { payload }).then((j) => j),
    sendBroadcast: (id) => call("send_broadcast", { id }).then((j) => j),
    cancelBroadcast: (id) => call("cancel_broadcast", { id }).then((j) => j),
  };
}

module.exports = { telegram, sheet };
