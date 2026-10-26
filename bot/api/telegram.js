// Vercel function: Telegram webhook. Telegram POSTs every update here.
const { createBot } = require("../lib/bot");
const { telegram, sheet } = require("../lib/clients");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(200).send("PNL League bot is running.");
  // Only Telegram knows this secret (set by /api/setup), so nobody else can fake updates.
  if (req.headers["x-telegram-bot-api-secret-token"] !== require("../lib/env")().WEBHOOK_SECRET) return res.status(401).send("no");

  const env = require("../lib/env")();
  const bot = createBot({
    tg: telegram(env.BOT_TOKEN),
    db: sheet(env.SHEET_URL, env.SHEET_SECRET),
    cfg: env,
  });
  try {
    await bot.handle(req.body || {});
  } catch (err) {
    console.error("update failed", err && err.message, JSON.stringify(req.body).slice(0, 500));
  }
  // Always 200, otherwise Telegram retries the same update over and over.
  res.status(200).json({ ok: true });
};
