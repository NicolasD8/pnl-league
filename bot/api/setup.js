// Vercel function: one-time setup. Open https://<your-app>.vercel.app/api/setup?key=<WEBHOOK_SECRET> in a browser.
// It points Telegram at this deployment and registers the command menu in English and Arabic.
const { telegram } = require("../lib/clients");

module.exports = async (req, res) => {
  const env = require("../lib/env")();
  if (!env.WEBHOOK_SECRET || req.query.key !== env.WEBHOOK_SECRET) return res.status(401).send("Add ?key=<your WEBHOOK_SECRET> to the URL.");
  const missing = ["BOT_TOKEN", "BOT_USERNAME", "SHEET_URL", "SHEET_SECRET", "ADMIN_IDS", "OKX_CAMPAIGN_URL", "REG_OPENS"].filter((k) => !env[k]);
  const tg = telegram(env.BOT_TOKEN);
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const out = { webhook: `https://${host}/api/telegram`, missing_env: missing };
  try {
    out.setWebhook = await tg.call("setWebhook", {
      url: out.webhook,
      secret_token: env.WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    const en = [
      { command: "start", description: "Start / main menu" },
      { command: "join", description: "Join the early list" },
      { command: "ask", description: "Ask the PNL League team a question" },
      { command: "language", description: "English / العربية" },
      { command: "stop", description: "Stop all messages" },
      { command: "delete", description: "Delete my details" },
    ];
    const ar = [
      { command: "start", description: "البداية / القائمة الرئيسية" },
      { command: "join", description: "انضم إلى القائمة المبكرة" },
      { command: "ask", description: "اطرح سؤالًا على فريق PNL League" },
      { command: "language", description: "English / العربية" },
      { command: "stop", description: "إيقاف كل الرسائل" },
      { command: "delete", description: "حذف بياناتي" },
    ];
    out.commands = await tg.call("setMyCommands", { commands: en });
    out.commands_ar = await tg.call("setMyCommands", { commands: ar, language_code: "ar" });
    out.info = await tg.call("getWebhookInfo");
  } catch (err) {
    out.error = err.message;
  }
  res.status(out.error ? 500 : 200).json(out);
};
