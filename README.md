# PNL League · pre-registration site

A static site, with no framework and no build step. Everything Vercel serves lives in `public/`.

```
public/
  index.html            English page (/)
  ar/index.html         Arabic page (/ar/), DRAFT copy, noindex until approved
  assets/config.js      ← the only file you normally edit
  assets/site.js        page logic (countdown, form, launch switch, analytics)
  assets/site.css       styles (mobile first, RTL-ready)
  assets/fonts/         self-hosted woff2 (Big Shoulders Display, IBM Plex Mono, Cairo, IBM Plex Sans Arabic)
  assets/brand/         wordmark.svg, logo-stacked.svg (cropped + cleaned), icons
  og.png                1200×630 social image
  404.html, robots.txt, sitemap.xml, site.webmanifest, favicons
apps-script.gs          Google Sheets backend (paste into Apps Script)
vercel.json             Vercel settings: serve public/, clean URLs, security + cache headers
source/                 the original draft and brand files (not deployed)
screenshots/            390px and 1440px captures
```

## 1. Edit CONFIG

Open `public/assets/config.js`. Both languages read it.

| Key | What it does |
|---|---|
| `FORM_ENDPOINT` | Your Apps Script web-app URL (ends in `/exec`). Empty = **demo mode**: the form shows success, saves nothing, and logs the payload to the browser console. |
| `REG_OPENS` | When OKX registration opens, with timezone, e.g. `2026-11-01T12:00:00+03:00` (Beirut). From this moment the page switches itself to "Registration is open". |
| `OKX_CAMPAIGN_URL` | Where every CTA points after launch. |
| `OKX_SIGNUP_URL` | Your OKX affiliate sign-up link. It appears as "Open my OKX account" after signup, for people who aren't verified yet. Empty = hidden. |
| `EARLY_CAP` / `EARLY_TAKEN` | Optional cap bar. Leave `EARLY_CAP: 0` unless you really cap the list (compliance: scarcity must be true). |
| `SITE_URL` | Base for the WhatsApp share link. |
| `TELEGRAM_URL` | Telegram community invite link. Every "Join our Telegram community" button uses it. Empty = those buttons scroll to the community section. |
| `CREW` | Rami's and Rich's Instagram/TikTok handles (no @) and photo paths (put photos in `public/assets/img/`). Empty handle = that button is hidden; empty photo = their initial is shown. |
| `LOGOS` | OKX and VCore logo files (SVG preferred, in `public/assets/brand/`). Empty = the name is set in type. Use OKX's logo only from their official brand kit, with their OK. |
| `META_PIXEL_ID`, `GA4_ID` | Analytics. Empty = that tracker never loads. |

Push or redeploy after editing. Visitors get the change on their next load.

### Analytics behaviour
- **PageView** fires on load (Meta `PageView`; GA4 `page_view` via `config`).
- After a successful signup: Meta `Lead` + a `PageView` on `/?joined=1`, and GA4 `generate_lead` (with `ref` and `lang`).
- The URL changes to `?joined=1` (your utm_* params are kept), so you can build a **URL-based custom conversion** in Meta: *URL contains `joined=1`*.
- If someone opens a `?joined=1` link directly, the page strips that parameter before tracking runs, so shared links don't create fake conversions.
- GA4: enhanced measurement's "page changes based on browser history events" may also log the `?joined=1` view. Optimise GA on `generate_lead`, not page views.
- No other trackers, no cookie wall, no chat widget.

## 2. Set up the Google Sheet

1. Create a Google Sheet, e.g. "PNL League early list".
2. **Extensions → Apps Script**. Delete the sample code, paste all of `apps-script.gs`, and save.
3. Optional: pick `testNormalise` in the function menu, click **Run**, and check the log shows all `OK`.
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Authorise when asked (Google warns it's unverified: Advanced → Go to project).
5. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into `FORM_ENDPOINT`.
6. Check: open that URL in a browser. It should return `{"ok":true,"service":"pnl-early-list"}`.

What lands in the sheet:
- **Signups** tab: `ts, name, phone, okx, exp, lang, dup, ref, utm_*, fbclid, page, consent, ms`.
- **Phones** are normalised to E.164 (`03 123 456` → `+9613123456`), so duplicates match however people type them.
- **Duplicates** are kept, and `dup` says `DUPLICATE of row N`. Filter on it before messaging.
- **Rejected** tab: bot (honeypot) hits and rows with a missing name, a bad phone or no consent.
- Formula-looking input (`=…`) is neutralised.

If you edit the script later: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.

## 3. Test the launch-day switch locally

```bash
python -m http.server 5173 --directory public
```

1. Open http://localhost:5173.
2. In `public/assets/config.js`, set `REG_OPENS: "2020-01-01T00:00:00+03:00"` and hard-reload (Ctrl+Shift+R).
3. You should see the countdown gone, "Registration is open", a "Register on OKX" card, and every CTA (closing button, mobile sticky bar) pointing at the OKX campaign in a new tab. Check `/ar/` too.
4. **Set `REG_OPENS` back** before you deploy.

To test the form, leave `FORM_ENDPOINT` empty (demo mode). Open DevTools → Console, submit, and you'll see the exact payload that would be sent.

## 4. Creator links (`?ref=`)

Give each creator their own link:

```
https://pnlleague.com/?ref=rami
https://pnlleague.com/?ref=rich
https://pnlleague.com/?ref=jean
https://pnlleague.com/ar/?ref=jean        (Arabic page)
```

- Use lowercase, no spaces. The value is saved as-is into the `ref` column.
- The ref is remembered in the visitor's browser, so a person who comes back later without the link still counts for that creator.
- The "Challenge a friend on WhatsApp" link after signup carries the same ref onward.
- Ads: add normal UTMs on top, e.g. `?ref=rami&utm_source=instagram&utm_medium=paid&utm_campaign=prelaunch`. All of them are stored.

## 5. Deploy on Vercel (free tier)

### First deploy
1. Put this folder in a GitHub repo (private is fine):
   ```bash
   git init && git add . && git commit -m "PNL League site"
   ```
   Create an empty repo on github.com, then `git remote add origin …` and `git push -u origin main`.
2. Go to https://vercel.com/new, sign in with GitHub, and **Import** the repo.
3. Framework preset: **Other**. Leave Build Command and Output Directory empty, because `vercel.json` already sets output to `public/`. Click **Deploy**.
4. You get a `*.vercel.app` URL. Check it, then submit one real test signup and confirm the row appears in the sheet.

From then on, every push to `main` redeploys automatically (about 20 seconds).

No GitHub? Install the CLI (`npm i -g vercel`), then run `vercel` from this folder and `vercel --prod` for production.

### Connect pnlleague.com
1. Vercel → your project → **Settings → Domains** → add `pnlleague.com`. When asked, also add `www.pnlleague.com` redirecting to `pnlleague.com`.
2. At your registrar (Namecheap, GoDaddy, Cloudflare…), create the records Vercel shows. They are normally:

   | Type | Name / Host | Value |
   |---|---|---|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   Vercel sometimes shows a project-specific value, such as a different A record IP or a `…vercel-dns-017.com` CNAME. **If the dashboard shows something different, use what the dashboard shows.** Delete any old A/AAAA/CNAME records on `@` and `www` that point elsewhere (registrar parking pages).
   On Cloudflare, set these records to **DNS only** (grey cloud).
3. Wait for Vercel to show "Valid Configuration". It's usually minutes and can take up to 48 hours. HTTPS is issued automatically.

### Changing the domain
If you end up on a different domain, find and replace `https://pnlleague.com` in `public/index.html`, `public/ar/index.html`, `public/robots.txt`, `public/sitemap.xml` and `SITE_URL` in `config.js`. The OG/canonical tags must be absolute, so they're hard-coded rather than read from config.

After going live, paste the URL into https://developers.facebook.com/tools/debug/ and click **Scrape Again** so Meta picks up `og.png`.

## 6. Arabic page

`/ar/` is a **draft for review**. Until it's approved:
- it has `<meta name="robots" content="noindex">` (remove that line once approved), and
- it's left out of `sitemap.xml` (uncomment the line once approved).

The language toggle sits top right on both pages. Arabic UI strings that the script writes (errors, success state, launch-day card, share text) live in `public/assets/site.js` under `ar:`.

## Checks done
- Widths 360 / 390 / 768 / 1280 / 1440, EN and AR: no horizontal scroll. On 390×844 the form card starts at 552px (inside the first screen).
- Lighthouse mobile, local server with gzip: EN 98–99 performance, 100 accessibility / best practices / SEO. AR 94–96 performance (varies between runs on this machine), 100 accessibility / best practices, SEO 93 only because of the deliberate `noindex`. Re-run on the live Vercel URL to confirm.
- Colour contrast: every text pair is AA or better (lowest 5.97:1).
