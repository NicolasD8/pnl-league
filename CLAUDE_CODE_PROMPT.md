# Build the PNL League pre-registration landing page

You're building a one-page website for **PNL League**, a crypto trading competition in Lebanon. Read this whole brief before writing code. The folder you're in contains a working draft (`index.html`), a Google Sheets backend script (`apps-script.gs`) and the brand assets. Start from the draft: keep its copy, structure and brand, then do the work in the **Your tasks** section.

---

## 1. What this page is for

OKX (the crypto exchange) runs the official competition page, and registration on it only opens on **1 November 2026**:
https://www.okx.com/campaigns/ce-community-trading-competition-phase-1

We're already running content and want to run paid ads **now**. Ads can't point at a page that isn't open yet, so this page is the bridge:

1. **Before 1 Nov:** ads and creator links send traffic here. People join an **early list** (name, WhatsApp number, OKX account status). We message them the official link the moment it opens, and push them to get their OKX account KYC-verified now so they can start on day one.
2. **From 1 Nov:** the same URL keeps working. The page switches automatically to "Registration is open" and every button sends people to the OKX campaign page. Ads never need new links.

Domain: **pnlleague.com** (or whichever variant we buy). Host it as a static site.

The single success metric is **early-list signups**, then **conversion of that list into OKX registrations** on launch day.

## 2. The competition (facts, use exactly)

- **Name:** PNL League. Full credit: "PNL League by CE · Presented by OKX". CE = Crypto Exchangers Lebanon, our community partner. OKX is the sponsor; never put OKX inside the PNL League name or logo.
- **Positioning:** Lebanon's first live trading championship. Esports format. Tagline: **Mind Over Market.**
- **Phase 1, Online League (on OKX):** two live leaderboards, **PnL** and **Trading Volume**, updated every 5 minutes. Futures and spot both count. Requirements to rank: KYC-verified OKX account, **50 USDT minimum deposit**, **5,000 USDT minimum trading volume**. Main accounts only, no sub-accounts.
- **Finalist selection:** rewards from both leaderboards are added up; the **12 highest totals** go to the Live Finals.
- **Phase 2, Live Finals:** **VCore Tabarja** (Lebanon's biggest esports venue). 6 hours of live trading, casters, a crowd, livestream on TikTok and Instagram. Date not announced yet: say "announced with the registration opening".
- **Prizes:** **5,000 USDT prize pool at the Live Finals**. Separately, **1,000 USDT in leaderboard rewards (trading bonus)** during the Online League. Never call the 1,000 a "prize pool" and never add them together.
- **People:** **Rami** casts the Live Finals and streams them. **Rich** coaches all 12 finalists on the night (one coach for everyone, no teams).
- **Eligibility:** 18+, based in Lebanon, KYC-verified OKX account. Some existing OKX accounts must be linked to the competition before they're eligible; we handle that case by case.
- **Handles:** @pnlleague (us), @okx_mena, @cryptoexchangersleb. Hashtags: #PNLLeague #MindOverMarket.

## 3. Brand

- **Colours:** Candle Green `#22F07A` · Pit Black `#0B1410` (page background) · Bone `#F3F5F0` (text / light sections) · Ash `#9FB0A6` (secondary text). Green is the accent: numbers, CTAs, one word per headline at most. No other colours.
- **Type:** **Big Shoulders Display** (Google Fonts) Black 900 for headlines, Bold 700 for labels, always uppercase, tight leading. **IBM Plex Mono** 400/500 for body. Self-host both fonts (woff2) instead of loading from Google, for speed and privacy.
- **Logo:** `wordmark.svg` (single line, for the header; "BY CE" credit built in) and `logo-stacked-for-dark.svg` (stacked, for the footer or OG image). The L of PNL is a green candlestick. Never stretch it or recolour the candle. `icon.png` is the square candle-L for the favicon.
- **Feel:** a championship, not a promo. Esports broadcast energy: big numbers, countdown, leaderboard grammar. Sharp edges, no rounded cards, no gradients, no stock crypto imagery, no coins, no rockets.

## 4. Copy rules (compliance, non-negotiable)

OKX compliance will review this page and Meta will review the ads. So:

- **Never** imply profit: no "make money", "earn", "easy gains", "financial freedom", "passive income".
- **No giveaway framing:** not "Win 5,000 USDT free". It's a prize pool you compete for.
- **No trading advice**, signals, price predictions, or mentions of other exchanges.
- **Scarcity must be true.** The real scarcity is: **12 seats at the Live Finals**, and **the early list closes when registration opens** (countdown). Do not say registration itself is limited or show a fake "X spots left" counter. The draft has an optional `EARLY_CAP` in `CONFIG`, off by default; it may only be turned on if we really cap the list.
- The page must say clearly that the early list **is not the official entry**; official registration is on OKX.
- Footer disclaimer, always visible: "18+. KYC required. Trading involves risk." plus the short risk paragraph already in the draft.
- Consent checkbox for WhatsApp contact is required, and the FAQ explains what we do with the number.

## 5. What the draft already does (keep it)

- Hero: "12 SEATS. ONE TITLE." + countdown to `CONFIG.REG_OPENS` + the signup form card.
- Form: full name, WhatsApp (country code defaults to +961), OKX account status (verified / not verified / none), trading style (optional), 18+ & Lebanon checkbox, WhatsApp consent checkbox. Client-side validation with plain error messages.
- Submits to a **Google Apps Script web app** (`apps-script.gs`) that appends a row to a Google Sheet. `CONFIG.FORM_ENDPOINT` empty = demo mode.
- Captures attribution: `?ref=` (creator code, e.g. `?ref=rami`, `?ref=rich`, `?ref=jean`), all `utm_*`, and `fbclid`; remembers them in localStorage so a returning visitor keeps their source. Sends them with the signup.
- Success state: personalised "You're in", three next steps, an "Open my OKX account" button (our OKX affiliate link, hidden if the user is already verified), and a "Challenge a friend on WhatsApp" share link that carries their ref.
- Fires `fbq("track","Lead")` and `gtag("event","generate_lead")` if those exist.
- Prize strip (5,000 / 1,000 / 12 / 6H), How it works (4 steps), Live Finals section (Rami, Rich, "You?"), FAQ, closing CTA, footer.
- Auto-switch after `REG_OPENS`: hides the countdown, replaces the form with "Register on OKX", rewrites every CTA to the OKX campaign URL.
- Sticky "Claim my spot" bar on mobile once the form scrolls out of view.

## 6. Your tasks

1. **Set up the project** as a plain static site (no framework needed; Astro or Vite is fine if you prefer, but the output must be static files). Split CSS/JS out of `index.html` if it helps, keep it dependency-light. Self-host the two fonts.
2. **Polish the design** against the brand above. It must look excellent on a phone first: most traffic is Instagram and TikTok ads on mobile. On a 390px-wide screen the form must start within the first screen and a half. Check 360px, 390px, 768px, 1280px, 1440px. No horizontal scroll anywhere.
3. **Header logo:** the wordmark renders small in the draft; size it properly (about 40px tall on desktop, 30px on mobile).
4. **OG / social image:** create `og.png` at 1200×630: Pit Black background, stacked logo, "12 SEATS. ONE TITLE.", "5,000 USDT prize pool". Wire `og:image`, `twitter:card=summary_large_image`, and absolute URLs on the final domain.
5. **Arabic:** add an Arabic version (`/ar/` or a toggle) with proper RTL layout, using a heavy Arabic display face (e.g. Cairo 800/900) paired with the existing fonts. Ask me before finalising the Arabic copy; draft it and flag it for review.
6. **Analytics:** add Meta Pixel and GA4 with IDs from a single config block (leave the IDs empty for me to fill). PageView on load, Lead on successful signup. No other trackers.
7. **Backend:** keep the Google Sheets approach. Tighten `apps-script.gs`: reject submissions with missing name/phone, normalise phone numbers, flag duplicates by phone (don't drop them, mark them), and add a honeypot field to the form to stop bots.
8. **Thank-you URL:** after a successful signup, also push `?joined=1` (or route to `/thanks`) so ads can optimise on a URL-based conversion.
9. **Performance & accessibility:** Lighthouse 95+ on mobile for performance, accessibility, best practices and SEO. Visible keyboard focus, labelled inputs, `prefers-reduced-motion` respected, colour contrast AA.
10. **Deployment:** give me exact steps to deploy on Vercel or Netlify (free tier) and connect pnlleague.com, including the DNS records. Add a short `README.md` covering: how to edit `CONFIG`, how to set up the Google Sheet, how to test the launch-day switch locally (temporarily set `REG_OPENS` to a past date), and how to create creator links (`?ref=name`).

## 7. Config you'll need from me (leave as clearly marked placeholders)

- `FORM_ENDPOINT`: Google Apps Script web app URL
- `REG_OPENS`: currently `2026-11-01T12:00:00+03:00`; exact time to confirm with OKX
- `OKX_SIGNUP_URL`: our OKX affiliate sign-up link
- `META_PIXEL_ID`, `GA4_ID`
- Final domain for `SITE_URL` and OG URLs

## 8. Don't

- Don't add sections, claims, testimonials, user counts or partner logos that aren't in this brief.
- Don't invent dates, prize splits or rules. If something is unknown, leave a visible placeholder and list it for me.
- Don't use OKX's logo or make the page look like an OKX page.
- Don't add cookie walls or chat widgets.

When you're done, show me screenshots at 390px and 1440px, list every placeholder still open, and run through the signup flow once end to end in demo mode.
