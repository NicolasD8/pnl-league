# PNL League · Telegram bot

People tap a link (from an ad or a creator), the bot asks a few questions, and they're on the early list. On launch day you send everyone the OKX link with one command.

- **Runs on:** Vercel (free) as a webhook, with no packages to install.
- **Stores data in:** a Google Sheet you own (tabs `Users` and `Broadcasts`).
- **Languages:** English and Arabic. The user picks at `/start`. The Arabic copy is a **draft for review**, in `lib/text.js`.

## What users get

| | |
|---|---|
| `/start` | Language picker, then a welcome with a live countdown to registration and a menu. |
| **Join the early list** | Full name → phone (one-tap "Share my number", or skip) → OKX account status → trading style → 18+ and in Lebanon → consent to be messaged. Then "You're in": KYC tip, "Open my OKX account" (affiliate link, only if not verified), and an "Invite a friend" link. |
| **How it works / Prizes / Who can enter / Your data** | Answers taken from the brief (prize pool and leaderboard rewards kept separate, risk line included). |
| **Ask a question** | Their message goes privately to you. You reply in Telegram and the bot sends your answer back. |
| `/stop`, `/delete` | Opt out of messages, or wipe their details. |
| After `REG_OPENS` | The welcome turns into "Registration is open" with a **Register on OKX** button, and signup closes. |

## What admins get (people listed in `ADMIN_IDS`)

| | |
|---|---|
| `/stats` | Signups, started vs finished, OKX status, language, and **signups per creator link**. |
| `/broadcast your text` | Shows a preview and the recipient count, then sends to everyone who finished signup and said yes. It goes out in the background; you get a "done" message with sent / blocked / failed counts. |
| `/launch` | The launch-day message in each person's language, with the **Register on OKX** button. Preview, then confirm. |
| Questions | Arrive in your private chat with the bot, tagged `#u123…`. **Reply to that message** to answer. |
| `/whoami` | Shows your Telegram ID, which you need for `ADMIN_IDS`. Works for anyone. |

## Creator links

```
https://t.me/PNLLeagueBot?start=rami
https://t.me/PNLLeagueBot?start=rich
https://t.me/PNLLeagueBot?start=jean
https://t.me/PNLLeagueBot?start=ig_oct_ad1      ← one per ad if you like
```

Use letters, numbers, `_` or `-` only, up to 40 characters. The **first** link someone arrives from is kept in the `ref` column. Their "Invite a friend" link passes that same ref on.

---

## Setup (about 20 minutes)

### 1. Create the bot
In Telegram, open **@BotFather**, send `/newbot`, and pick a name and a username ending in `bot`. Keep the **token** private.

### 2. Google Sheet
1. Create a new Google Sheet, e.g. "PNL League bot".
2. **Extensions → Apps Script**. Replace everything in `Code.gs` with [`apps-script/Code.gs`](apps-script/Code.gs). Save.
3. **Project Settings (gear) → Script properties → Add**:
   - `SHEET_SECRET`: a long random string. Make one up, 30+ letters and numbers.
   - `BOT_TOKEN`: the token from BotFather. Broadcasts are sent from here.
4. Back in the editor, select **setup** in the function dropdown → **Run** → approve the permissions. The log should say `Bot OK: @YourBot`.
5. **Deploy → New deployment → Web app**. Execute as **Me**, Who has access **Anyone** → Deploy → copy the URL ending in `/exec`.

### 3. Vercel
1. Push this repo to GitHub, go to https://vercel.com/new and import it.
2. **Set Root Directory to `bot`**. Framework preset: **Other**. Don't deploy yet.
3. Add **Environment Variables** (see [`.env.example`](.env.example)):
   - `BOT_TOKEN`, `BOT_USERNAME` (no @)
   - `WEBHOOK_SECRET`: another long random string you make up (letters, numbers, `_`, `-`)
   - `SHEET_URL`: the `/exec` URL; `SHEET_SECRET`: the same value as in Apps Script
   - `ADMIN_IDS`: leave a placeholder like `0` for now, fixed in step 5
   - `REG_OPENS`, `OKX_CAMPAIGN_URL`, and optionally `OKX_SIGNUP_URL`
4. **Deploy**.

### 4. Connect Telegram to Vercel
Open this in your browser once:

```
https://<your-project>.vercel.app/api/setup?key=<WEBHOOK_SECRET>
```

You should see JSON with `"setWebhook": true` and an empty `missing_env` list. This also registers the command menu in English and Arabic.

### 5. Make yourself admin
1. Message your bot `/whoami`. It replies with your ID.
2. In Vercel, set `ADMIN_IDS` to that number. Add more people comma-separated.
3. **Redeploy** (Deployments → ⋯ → Redeploy). Environment changes only apply after a redeploy.
4. Send `/stats` to check.

### 6. Test the whole flow
Join the early list yourself from `t.me/PNLLeagueBot?start=test`, ask a question, reply to it, then send `/broadcast test` and confirm. Check the rows in the Sheet. Delete your test rows before launch if you like.

## Launch day (1 Nov)

- At `REG_OPENS`, everyone who opens the bot sees **Registration is open** automatically.
- Send **`/launch`**, check the preview, and tap **Send**. Each person gets it in their own language with the OKX button.
- For a list of a few thousand people, sending takes a few minutes per batch and continues by itself. If it ever looks stuck, use the Sheet menu **PNL Bot → Resume a stuck broadcast**.

## Changing copy

Everything users read is in [`lib/text.js`](lib/text.js) (`en` and `ar`). Keep to the compliance rules: no profit claims, no giveaway framing, no trading advice, and the 1,000 USDT is "leaderboard rewards", never part of the prize pool. Run `npm test` after editing, then push.

## Local test

```bash
node test/simulate.js
```

This runs the real bot logic against a fake Telegram and an in-memory sheet. It covers: creator ref, both languages, full signup, stale-button protection, the 18+ path, FAQ, question → admin → reply, `/stats`, broadcast preview/confirm/double-send, `/launch`, `/stop`, `/delete`, the launch-day switch, and phone normalisation.

## Notes
- **Response time:** each reply waits on the Google Sheet, so expect about 1–2 seconds per answer. If that feels slow at scale, swap the store for Vercel KV / Upstash later. Only `lib/clients.js` changes.
- **Security:** Telegram signs every request with `WEBHOOK_SECRET`, and the Sheet only answers requests carrying `SHEET_SECRET`. Formula-looking input is neutralised in the Sheet.
- **Phones:** stored as `+961…`, with duplicates flagged in `dup` (never dropped).
