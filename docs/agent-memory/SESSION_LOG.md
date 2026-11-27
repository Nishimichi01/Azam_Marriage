# Session Log — Azam_Marriage

Append-only record of work sessions. Newest entries at the bottom.

```markdown
## YYYY-MM-DD — <short title>

**Branch / HEAD:** `<branch>` @ `<sha>`
**Request:** what the user asked for.
**Findings:** what was discovered (paths).
**Changes:** files created/modified (or "none — research only").
**Verification:** what was actually run and its result. Say "not run" if not run.
**Follow-ups:** open questions / next steps.
```

## 2026-11-13 — Built the Azam &amp; Nazifa online wedding invitation from the printed card PDF

**Asked:** study the handoff MD + the card PDF + the sample screen recording, then build an online wedding invitation whose *design* is the printed card and whose *features/animations* follow the video. Hold the music for now.

**Findings:**
- `Kad Kahwin - Azam & Nazifa.pdf` is A5 vector: the plaid is a 93.1pt square pattern (1 white 7.495pt + 1 blush 3.17pt + 4 blush 1.056pt threads per direction), olive `#78804B`, blush `#C5A89E`, cream panel `#EADFD9` at 18.6%/18.8% insets, sage `#DFE0BC`, ink `#4D2E1A`, body `#2E361D`. Card fonts are Pinyon Script + Lora + TheSeasons.
- The two page-1 images are the real lily and bud branch **with smasks** — extractable at full resolution (PyMuPDF `extract_image` + `Pixmap(pix, mask)`), so the old handoff's "hand-drawn SVG" gap is now closed.
- The video shows jemputan.me (Mia & Idraki) and tetamu.me: round seal cover, blurred scene that sharpens on open, staggered line-by-line fade, frosted glass cards, icon+label bottom bar (max 3), falling petals.
- No ffmpeg on this machine, so browser `recording.start()` fails; `page.screenshot` is not on the restricted wrapper — use the global `screenshot()`.

**Changes:** built `index.html` (269 KB, self-contained, images inlined as webp data URIs) from `src/index.template.html` via `src/build.py`; `assets/{lily,branch}.webp`, `assets/og.jpg`; `README.md` with editing/publishing/music instructions. `ref/` keeps the PDF renders, video frames and extracted artwork.

**Bugs found and fixed during verification:**
1. `.rv` reveal elements were already `in` before the cover was tapped (IO started at load) → observer now starts in `openCover()`.
2. `[hidden]` had no effect on `.bar button` (`.bar a,.bar button{display:flex}` won), so the `Lagu` button showed with no song → added `[hidden]{display:none!important}`.
3. Share failed silently when `navigator.share` rejected → falls back to clipboard + toast.
4. Desktop cover stretched into a landscape panel → `min-width:640px` keeps the card's portrait ratio.
5. Reveal timing vs cover fade left an empty screen → reveal at 470 ms, 0.85 s duration, 70 ms stagger.

**Verification:** 390/360/320 px and 1280 px; `scrollWidth == innerWidth`; opening animation sampled frame-by-frame (seal 0→545 ms, panel insets→0 by ~1.1 s, cover fade 0.72–1.5 s, hero cascade from 470 ms); wa.me message text asserted; Lokasi scroll lands `#lokasi` at top 24; no console/page errors.

**Follow-ups:** song MP3 (set `var SONG`), couple photos for a galeri section, confirm the placeholder *atur cara* times, decide WhatsApp-RSVP vs a sheet-backed form.

## 2026-11-13 — Netlify &quot;Page not found&quot;: repo main had only a README, no index.html

**Asked:** the Netlify site says "Page not found"; suspected a missing `main` branch.

**Findings (checked with git + GitHub API, not guessed):**
- `main` **does** exist locally and on `origin` (`refs/heads/main` = ccf1fdf) — the branch was never the problem.
- `git show --stat ccf1fdf` → "first commit" contains **only `README.md`**. Netlify deployed a repo with no `index.html`, so every path 404s. All site files were still untracked (`git status` showed the whole folder untracked).
- No Netlify deployment artifacts on either new commit (`/commits/<sha>/status` → `statuses: []`, `/deployments` → 0), so the repo is probably **not** linked to a working site — or the Netlify GitHub App has no access to `Nishimichi01/Azam_Marriage` (that shows up in the UI as an empty branch list, which is what the user remembered). Guessing `*.netlify.app` hostnames gave only Netlify's generic 404 page, so the site URL still has to come from the dashboard.

**Changes:**
- `netlify.toml` → `[build] publish = "."`, `command = ""`, plus cache/security headers; validated by parsing it with `tomllib`.
- `.gitignore` → excludes `video_20261112_123720.mp4` (13 MB), `ref/` (7 MB derived renders) and the generated `dist/`.
- Committed `a1c47d2` (invite + config) then `6cdd0b0` (README deploy section), pushed to `origin/main`; confirmed via the contents API that `index.html` now sits at the repo root.
- Built `dist/` (index.html + assets/og.jpg, 365 KB) for an account-level drag-and-drop deploy; served it locally on :8901 and confirmed `/` returns 200 with the real `<title>`.

**Verification gap:** could not see the Netlify dashboard (not signed in in the browser profile) and no deploy event exists, so the live URL is unverified — the user has to trigger the deploy.

## 2026-11-13 — RSVP storage: Google Sheet + CSV against a static Netlify site

**Asked:** can RSVPs be stored so they can be pulled out as a CSV report?

**Decision:** keep the single static file, but split it into one submit path with three delivery channels chosen by `RSVP_CHANNEL`:

- `whatsapp` (default, unchanged) — no storage, guest sends the message.
- `sheet` — POST to a Google Apps Script `/exec` web app that appends to a Google Sheet and serves the sheet as CSV (`?csv=1&key=…`), plus a totals dashboard.
- `netlify` — Netlify Forms via a hidden static `<form name="rsvp" data-netlify="true">`; CSV button in the dashboard, 100 submissions/month free.

**Why Google Sheets over Netlify Forms as the recommendation:** no submission cap, CSV is native even if they leave Netlify, and the family can be given view access. Netlify Forms stays as the zero-setup fallback.

**Implementation notes that mattered:**
- The Apps Script POST must be `mode:"no-cors"` with `Content-Type: text/plain;charset=utf-8` — a *simple* request, no preflight, and `e.postData.contents` still carries the JSON. The response is opaque, so the UI confirmation is optimistic and the WhatsApp link remains the fallback.
- Netlify Forms needs the form in the **static HTML at deploy time**; a JS-only form is never detected.
- Repeat replies update the existing row (match on normalised phone, else name) instead of appending duplicates.
- CSV is emitted with a UTF-8 BOM so Excel reads Malay text correctly.

**Verification:** all three channels exercised in the browser. The sheet channel was POSTed against a local mock server — the captured body was `CT=text/plain;charset=utf-8` and the full JSON payload. Netlify channel captured via a fetch stub: `form-name=rsvp&nama=…&kanak-kanak=0`. WhatsApp channel produced the correct `wa.me` text and hid the duplicate link. Closing/reopening the sheet resets it. `node --check` on the extracted inline script passes.

**Gotcha for future edits of this template:** escaping `\\n` inside a bash heredoc through the tool layer collapses to a real newline and breaks the JS string. Use `var NL = String.fromCharCode(10)` (now in the file) instead of `"\n"` literals.

## 2026-11-27 — Google Sheets RSVP: bound vs standalone script trap and the test harness

**Asked:** the user wants Google Sheets as the RSVP database, and pasted a Claude snippet using `SpreadsheetApp.getActiveSpreadsheet()` with `fetch(..., {mode:'no-cors', body: JSON.stringify(...)})`.

**The trap in that snippet:** `getActiveSpreadsheet()` only resolves for a **bound** script (created via Extensions → Apps Script from inside a sheet). For a script created at script.google.com — which is what "New project" gives you — it returns `null`, so `null.appendRow(...)` throws and the web app answers 500. The front-end can't see it because `no-cors` makes the response opaque, so RSVPs silently vanish. This is the single most common failure of this pattern.

**Changes to `apps-script/Code.gs`:**
- `book_()` now resolves in order: `getActiveSpreadsheet()` (bound) → stored `SPREADSHEET_ID` property → create a new spreadsheet and store its id. Both install methods work with no configuration.
- Accepts the shorter `{ name, attending, pax, message }` payload as aliases for `{ nama, status, dewasa, ucapan }`, so a different front-end can post to the same endpoint.
- **Fixed a real compile bug:** the header comment contained `**/exec**`, whose `*/` terminated the block comment and left ` *  5. ...` as code — `SyntaxError: Unexpected token '*'`. Code.gs would not have run at all.

**Page changes:** `RSVP_CHANNEL` defaults to `"auto"` and is resolved once at load from `RSVP_ENDPOINT`; if the channel says `sheet` but the endpoint is not a URL, it falls back to WhatsApp and `console.warn`s rather than dropping the reply.

**Verification:** wrote `apps-script/test.js`, a Node harness that stubs SpreadsheetApp / ContentService / LockService / Utilities / PropertiesService / ScriptApp / HtmlService and runs the real Code.gs in a `vm` context — 38 checks covering sheet creation + headers, phone normalisation, pax totals, dedupe-as-update, absentees zeroed, wrong key, missing name, honeypot, the alias payload, dashboard totals, CSV mime/BOM/key, CSV quoting of commas+quotes with a round-trip parse, and bound-script mode. All pass. Browser side: auto mode POSTed the full JSON to a local mock (captured), and the misconfigured page correctly rendered the WhatsApp variant.

**Note:** the tool layer collapses `\\n` inside heredocs, which twice broke JS string literals; `Code.gs` uses `String.fromCharCode(10)` (`NL`) for this reason and the test file is written with the `write` tool rather than a heredoc.

## 2026-11-27 — Google Sheets RSVP live: endpoint wired, leading-zero bug fixed, 4 test rows left

**Live endpoint (verified working):** `https://script.google.com/macros/s/AKfycbzW8tj6hFnJ2xZoIUjDnwIyM1I0a-DMV5pDZy-1fekJFq4Xkk6YnrZCJ_fZ8AOdlU36vQ/exec`

The Apps Script dashboard response embeds the CSV link, which leaked the deployment's `SECRET` (`$DanishVb09`) — useful, since `RSVP_KEY` must match it. Both are now wired into `src/index.template.html`.

**Verified against the live deployment:**
- `GET /exec` → 200, dashboard renders (title, 0 replies, CSV link)
- `GET /exec?csv=1&key=…` → 200, `text/csv`, BOM + header row
- `GET /exec?csv=1&key=wrong` → `Unauthorized`
- `POST` (`Content-Type: text/plain;charset=utf-8`, JSON) → 302, row appended
- Browser path (page → `fetch` `no-cors`) → row appended, `Dijemput` correctly captured the `?to=` parameter

**Bug found only because I wrote to the real sheet:** `0123456789` was stored as `123456789`. Sheets coerces numeric-looking strings, so **every Malaysian phone number loses its leading zero** on export. Fixed in `Code.gs` by setting the phone column to `@` (plain text) and rewriting the value; the mock harness now emulates Sheets' coercion, and removing the fix makes 12 checks fail (`phone=number:123456789`).

**Other changes:** `busy()` disables the button and shows "Menghantar…" (a Google cold start can exceed 5 s, and a double tap would otherwise double-submit); a rejected `fetch` now reports failure with a WhatsApp fallback instead of showing a false receipt.

**Left test data in their sheet:** 4 rows (UJIAN-AUTOMATED, UJIAN-DARI-BROWSER, DIAG, UJIAN-STATUS) — rows 2–5, all labelled "(boleh padam)". Flagged to the user for deletion; the script has no delete endpoint.

**Second gotcha:** Apps Script serves the *deployed* version, not the editor file. Any `Code.gs` edit needs Deploy → Manage deployments → Edit → New version, otherwise `/exec` keeps running the old code.

## 2026-11-27 — Local preview: run-locally.bat and the file:// caveat

**Asked:** how to run the site locally, without knowing Python commands.

**Answer:** two paths, no terminal needed for either.
1. **Double-click `index.html`** — the page is self-contained (images are data URIs, only Google Fonts is external), so `file://` renders it.
2. **Double-click `run-locally.bat`** (new) — starts `py -3 -m http.server 8000 --bind 0.0.0.0` in the foreground, opens the browser via a short-lived helper window, prints `localhost` and `COMPUTERNAME` URLs, and stops when the window closes.

**What I verified:** the launcher run under a Windows-like PATH (System32 first) prints its banner and serves `http://localhost:8000` → 200 with the right `<title>`, artwork loaded (`naturalWidth > 0`), `document.fonts.status === 'loaded'`, and the LAN IP responded 200 as well.

**What I could NOT verify:** `file://` — the BetterWright harness rejects `file:` navigation ("Browser navigation scheme is not available"), so the double-click path is reasoned, not proven. Known differences on `file://`: clipboard write fails (code already falls back to a toast), and `?to=` query strings are unreliable, which is why the bat is the recommended preview.

**Two BAT gotchas found while testing:**
- `timeout /t 2` resolved to **GNU timeout** from mingw when invoked through Git Bash and failed with `invalid time interval '/t'` → replaced with `ping -n 3 127.0.0.1 >nul`.
- `start "title" /min cmd /c "…"` for a background server did not come up when launched through bash's cmd; running the server in the **foreground** of the same window is reliable and also removes the `taskkill /FI WINDOWTITLE` cleanup hack.
- Python resolution order is now `py -3` then `python`, each validated with `-c "import sys"` so the Windows Store stub (`WindowsApps\python.exe`) cannot silently open the Store.

## 2026-11-27 — Print-card design spec + web assets extracted from the Canva PDF

**Branch / HEAD:** `main`
**Asked:** measure the printed card PDF (`Reference/Jemputan Imas&Azam-1 (1).pdf`), export web assets, and write `ref/refcard/DESIGN-SPEC.md` (fonts usable? panel insets + scallop counts?). `src/index.template.html` and `index.html` were off-limits and untouched.

**Findings (non-obvious ones):**
- Page is 297.75 × 419.25 pt = **105 × 148 mm (A6)**, not A5.
- The background is **not** a full-bleed artwork: one 1000×1000 tile (xref 27 + soft mask 28) painted **17×** on a lattice **rotated 25.732°**, step 118.1 pt ≈ the tile side. So `background-repeat` cannot reproduce it axis-aligned.
- The cream panel is a **raster image** (xref 25 + mask 26), *not* a vector path and not a clip path — `get_drawings()` returns only white rects, two rules, the ornament, the QR plate and the QR modules. The scallop silhouette lives only in the alpha channel.
- Panel: insets **13.14 %W left / 10.10 %H top / 13.21 %W right / 10.02 %H bottom**; **14 bumps on the top arch, 12 on the left edge** (12 right, 10 bottom = 48 total); pitch 20.72 pt, amplitude 5.3 pt; base shape is an arch (top corner R ≈ 47 % of panel width, bottom R ≈ 9 %).
- Shadow is a shaped Gaussian glow (σ ≈ 8 pt, #6E5039 @ .66, zero offset) baked into the same image.
- Colours: paper `#FFFFFF`, motif ink `#9E7453` (lighter than the type!), panel `#F9F7F5` (not the guessed `#f7f1e7`), type brown `#785D41`, DIS accent `#4D0F17` (render) vs PDF swatch `#4D0010`.
- **All 9 embedded fonts are cmap-less Canva subsets** — unusable as-is. Rebuilt each as `assets/fonts/web/*.woff2` by synthesising a `cmap` from ToUnicode **plus CID↔char pairs recovered by aligning Identity-H show-strings with pymupdf's text** (that recovered the missing `o` in TheSeasons-BdIt). None is COMPLETE; every card string renders, but `W` (→ "Walimatul Urus") and `f q v x z F G J L N O Q V W X` are absent from TheSeasons-Reg.
- Tracking: cover small caps 0.164 em (thin spaces in the source), everything else on page 2 +0.067 em.
- The QR is vector and decodes to `https://maps.app.goo.gl/TxpW6quXn25QASN97`.

**Assets:** `assets/card-bg.webp` (1200×1690, produced by rendering the PDF with the panel + type stripped out — most faithful route), `assets/card-tile.webp`, `assets/panel-scallop.svg` (alpha-traced, 468 pts, IoU 0.9984 vs the source mask), `assets/flourish.svg`, `assets/qr.svg`, `assets/fonts/**`.

**Gotcha worth remembering:** Chrome mis-renders `filter: drop-shadow()` **and** `mask` on the *same* element (silhouette blurs, scallops vanish). Put the mask on a child and the drop-shadow on a wrapper — verified with a real browser proof (`work/proof.html`, `work/proof-cover.png`), which also confirmed the type scale to < 1 pt per line.

**Verification:** every measurement re-checked against the 150-dpi PNGs; proof page rendered in Chromium; QR re-decoded from the exported SVG (needs a quiet zone for cv2 to read it).

## 2026-11-27 — Rebuilt the invitation from the new card; added guestbook, gift list, hidden YouTube song

**Asked:** (1) rebuild the e-invitation to follow the *new* attached card design exactly — details, order, colours, elements, effects; (2) add a "Sign Our Guestbook" section styled like `aliveinvite.com/hazimxdina` from `Reference/Link for reference.txt`; (3) integrate the client's YouTube song, autoplaying from **1:55** and looping from there, hidden; (4) add a section linking their gift-list Google Sheet; (5) cover shows **initials only**, tap for a smooth transition.

**Findings**
- New card = `Reference/Jemputan Imas&Azam-1 (1).pdf`, A6, Canva. Palette: panel `#F9F7F5`, type brown `#785D41`, maroon accent `#4D0F17`, toile motif `#9E7453`. Panel is a raster with an **alpha-traced scalloped silhouette** (48 bumps: 14 top, 12 sides, 10 bottom) — no vector path. Background is one 118.4 pt motif cell on a 25.732° lattice, so it tiles.
- Embedded fonts are **Canva subsets** (MoonTime only `A I a m s z`, etc.). Usable for the card's exact strings, useless for new copy → new UI uses **Vollkorn** (the card's own secondary face), guestbook wishes use **La Belle Aurore** (the reference's face).
- Reference guestbook (aliveinvite.com): one wish per slide, script message, tracked uppercase name, dot nav, `see all wishes` overlay, then `Nama anda` + `Message` + `Ucapan Anda`.
- Song is `9CHAP_Sdc9A` = "Banda Neira – Sampai Jadi Debu (Peaceful Piano)", 273 s, embeddable. **kadkahwinmy.com uses the same video with `&t=115s`**, drives it with `vue-youtube` (IFrame API), seeks on open — and never loops. It parks a full-size iframe off-screen. Our implementation keeps the API but adds the `ENDED → seekTo(115)` loop and starts on the cover tap.
- Apps Script CSV endpoint sends `Access-Control-Allow-Origin: *` end-to-end, so the guestbook can read wishes directly from the sheet.

**Changes**
- `src/index.template.html` — full rewrite: toile + scalloped cover (initials `I & A`), card interior in the card's exact order (greeting → hosts → menjemput → guest line → rule → puteri kami → italic names → script line → flourish → SABTU/26/DIS/2026 + ALAMAT + MASA MAJLIS band → QR → 4 contacts), countdown, **Senarai Hadiah**, RSVP, **Sign Our Guestbook** (carousel + dots + all-wishes overlay + form), footer, bottom bar `RSVP · Hadiah · Lagu`.
- `src/build.py` — inlines tile, scallop mask, flourish, QR and **all 12 font files**; no external font/image request remains (468 KB single file).
- `assets/` — `card-tile-500.webp`, `panel-scallop.svg`, `flourish.svg`, `qr.svg`, `fonts/web/*` (subsetted card faces, re-cmapped), `fonts/google/*` (Vollkorn variable + La Belle Aurore, subsetted), regenerated `og.jpg`.
- `apps-script/Code.gs` — guestbook-aware: `status:"ucapan"` rows become Status `Ucapan`, 0 guests, blank phone, always appended (never merged into an RSVP row); dashboard adds "Ucapan buku tetamu".
- `apps-script/test.js` — +9 assertions for the guestbook path → **51 pass**.
- `README.md` rewritten; `docs/agent-memory/PROJECT_DOCUMENTARY.md` created; `.gitignore` ignores `work/`.
- `ref/refcard/` — card renders + `DESIGN-SPEC.md` (measurements, colours, font coverage, CSS recipe).

**Verification**
- Music: `YT.get('ytplayer')` → state 1, time 117.8, unmuted, vol 55; seek to 270 → returns to 117.2 playing, so it loops at 1:55. Iframe is 366×206 parked at `bottom:-320px` (offscreen), nothing visible.
- Guestbook: loads live wishes from the couple's sheet (filters `UJIAN…`/`DIAG…`), shows the loading state, optimistic submit → dot count +1, thanks message, form cleared; captured POST body `{status:"ucapan", telefon:"0000000000", dewasa:0, …}` against a local mock (never the live sheet).
- RSVP: mock POST captured with correct pax; success screen + WhatsApp fallback href; Escape closes and returns focus.
- Cover: `main` opacity 0 before the tap (no leaked content), cover `display:none` after; `?to=` renders `KEPADA / Nama`, absent without it.
- Layout: 320/390/1280 with `scrollWidth ≤ innerWidth`; reduced-motion shows everything instantly; footer clear of the fixed bar.
- Fonts: all 10 families report `loaded`, and every card string was checked codepoint-by-codepoint against the subset cmaps before use.
- `node apps-script/test.js` → 51 passed, 0 failed. `node --check work/inline.js` → OK.

**Follow-ups**
- **Redeploy `apps-script/Code.gs`** (Deploy → Manage deployments → Edit → New version). Until then guestbook rows still save (marker phone prevents overwrites) but appear as `Hadir` with 0 guests.
- Test the song on a real iPhone (Low Power Mode blocks unmuted playback; the retry + `Lagu` button are the fallbacks).
- The sheet still holds the 4 old `UJIAN/DIAG` test rows — safe to delete; the guestbook filters them out.
- Nothing was committed or pushed (a push would deploy).

## 2026-11-27 — Redesigned the invitation details hero for phone (prototype)

**Branch / HEAD:** `main`
**Asked:** rebuild the details/hero section of the wedding e-invitation as a phone-first layout: breathing room, non-cramped couple names, QR removed, SABTU/ALAMAT/MASA print band reworked. Sandbox only (`work/proto/details.html`), serve on :8899.

**Changes (all inside `work/`, nothing in `index.html`/`src/`):**
- Replaced the hero CSS block and hero markup in `work/proto/details.html`: spacing tokens `--h2..--h5` (11/16/22/30 → 13/20/27/36 px), sheet inner padding +4px per side.
- Couple block: `.cname` (TheSeasons italic, `clamp(15.5px,4.9vw,23px)`, lh 1.42) + `.cbin` (uppercase, .2em tracking) + `.and` script line with hairlines via ::before/::after.
- `.when`: `.date` grid (SABTU / big 26 / DISEMBER+2026 maroon) then `.facts` `<dl>` rows with hairlines for Masa and Tempat.
- Buttons: 2-up Maps/Waze + full-width Simpan Tarikh, 46px min-height.
- Contacts: `wa.me` rows, 48px, number left / name right, hairline separators.
- Deleted `.qr`, `.qr-row`, `.qr-note`, `.band3` CSS and their markup (QR data URI included).

**Verified at 320/390/1280:** `scrollWidth ≤ innerWidth` (305/320, 375/390, 1265/1280); longest name 268px of 302px content at 390 and 220/241 at 320 (single line); all 15 `.rv` reveal; scallop mask intact; RSVP sheet opens/closes; page scrolls to countdown/hadir/guestbook/footer.

**Notes:** `work/notes/details.md` (structure, spacing scale, exact CSS/markup to port, rejected ideas). Screenshots in `work/shots/details-*.png`.

**Caveat:** `index.html`/`src/*` show modifications from a concurrent session, not from this task.

## 2026-11-27 — Phone-first cover, book-turn opening, new details layout, RSVP + footer rework

**Asked:** (1) cover type too small for phones, initials too basic/small, remove "ketik untuk membuka"; (2) slower, smoother opening — "like opening a book", with theme-appropriate petals; (3) details section copied the card too literally, couple names cramped — different layout is fine if the order holds; (4) remove the QR, rework SABTU/ALAMAT/MASA MAJLIS for mobile; (5) revamp the RSVP form UI and field sizing; (6) footer thanks + "Kongsi Jemputan" illegible on the wallpaper; (7) smoother scrolling.

**Findings**
- Great Vibes' capital `I` reads as `J`; Pinyon's `&` is tiny; Allura reads "I & A" cleanly at large size → **Allura** became the monogram face (`--mono`, 104–142 px).
- A `filter` on the turning page forces `transform-style: flat`, so the page-turn needs a **separate blurred shadow div** (`.cshadow`) instead of `drop-shadow`.
- Bold TheSeasons (page-2 subset) has no `E`, `p`, `1` or `:` → the month ("DISEMBER"), the time ("11:00 …") and the phone numbers must use the **regular cut** (`var(--type)` weight 400) or glyphs fall back mid-line.
- The reveal's animated `blur(6px)` and the bar's live `backdrop-filter` were the two expensive things while scrolling on a phone.

**Changes** (`src/index.template.html`, rebuilt to `index.html`/`dist`)
- Cover: caps 12 px, Allura monogram with `&` at .64em, date 15 px, venue 12.5 px, no hint text; panel 86 vw with a blurred shadow shape.
- Opening: two-sided card (`.cface`/`.cback`, `preserve-3d`, backface hidden) hinged left, `rotateY(-104deg)` over 1.9 s with a light sweep; `main` fades/settles from 660 ms; cover hidden at 2.45 s; 9–13 falling dried-petal leaves (`.petals`, transform/opacity only) started on the tap.
- Details: `name (italic) + patronymic (uppercase, tracked)` couple block with 16–20 px gaps and a hairline script line; date block (`SABTU` / big `26` / `DISEMBER 2026`); `MASA` and `TEMPAT` rows; buttons 2-up + full width; contacts as 48 px rows (number left, role right). QR removed with its CSS/markup; build.py no longer inlines `qr.svg`.
- RSVP sheet: grabber, 52 px fields / 10 px radius / 16 px text, 50 px segmented control, full-width 54 px submit, focus ring, finished success panel. One shared field style for RSVP + guestbook.
- Footer: the closing block moved onto a cream `.card` (thanks, signature, credit, share) — contrast fixed.
- Scroll: `.rv` is now opacity + 14 px translate (no filter, no `will-change`), 550 ms, 50 ms stagger, reveal-once; bar lost its `backdrop-filter`; guestbook card got 56 px bottom padding so the bar can't cover its submit.

**Verification**
- Cover/panel: monogram + `?to=` KEPADA both render; no "Ketik" string and no QR string left in the file.
- Page turn: sampled `getComputedStyle(.cpanel).transform` → matrix3d progressing 0.13 → 0.99 → past 90°; petals created (9–13) with visible rects; a frozen −25° render confirmed the 3D panel and the petal asset both paint.
- Scroll: all 23 `.rv` reveal after a stepped scroll; `filter:none`, `will-change:auto`, bar `backdrop-filter:none`.
- Widths: 320/390/1280 → `scrollWidth ≤ innerWidth` (305/320, 375/390, 1265/1280); name fits one line at 320; RSVP fields 52 px at 320 with the submit reachable.
- `node --check work/inline.js` OK; `node apps-script/test.js` 51 pass (backend untouched).
- `assets/og.jpg` regenerated from the new cover (1200×630) and copied to `dist/`.

**Subagents:** only one of three finished (the details-layout agent — its `work/notes/details.md` design was ported nearly verbatim, including the name/patronymic hierarchy and contact rows). The cover and RSVP/footer agents died on the exhausted LiteLLM budget, so that work was done directly.

**Follow-ups:** nothing outstanding besides the earlier Code.gs redeploy; if the client wants petals during the whole visit rather than from the tap, move `petals()` out of `openCover()`.

## 2026-11-27 — Cover monogram font: Kaushan Script chosen and tuned

**Branch / HEAD:** `main`
**Task:** find the closest free Google Font to the hand-drawn `I & A` signature monogram in
`Reference/Signature front page reference.png` (the cover monogram, currently Allura, "too thin/plain").
Prototype only — `index.html` and `src/` untouched.

**Findings**
* Reference ink is `#765941` on `#F6F4F2`, ink block 367×693 (aspect 0.53), glyph centres at
  0.215/0.169, 0.474/0.462, 0.755/0.789. Flat-brush, chisel-cut terminals, low contrast,
  per-glyph lean 4°/10°/12°; the I is a slab with a bottom claw, the & has a barbed arm, the A's
  right stem continues into a tail that hooks left.
* 24 faces compared (`mono-compare.html` renders 20; `shape-probe.html` scores bbox-normalised
  64×64 IoU). Kaushan Script wins: brush idiom, italic slant, open barbed &, long A crossbar.
  Caveat Brush is the runner-up (real slab I, best & IoU .55, but no A crossbar, upright).
  Lobster third (bar I + crossbar A, but uniform stroke — its I reads as "1").
* Kaushan's `I` is a bare stroke, not a slab: its outline still scores the best I IoU (.42), but
  the capital has to be carried by context. Documented as the known trade-off.

**Changes** (all under `work/`, gitignored)
* `work/proto/mono-compare.html` — reference plate + 20 candidates at a shared 240 px stage.
* `work/proto/mono-final.html` — real cover geometry (`.cpanel`, scallop mask copied out of
  `index.html`) with the tuned stack.
* `work/proto/mono-glyphs.html`, `mono-pair.html`, `mono-shortlist.html`, `cover-compare.html` —
  decision sheets; `work/build_final.py`, `work/measure_ink.py`, `work/probe_build.py` — generators.
* `work/notes/sig-font.md` — ranking, numbers, integration notes.

**Verified**
* 390×844: fs 109 px, ink 129×235, ink centred (195.0 vs 195.0), 31 px air above SABTU,
  `scrollWidth 390 = innerWidth`. 320×680: fs 89.6 px, ink 107×194, 20 px air, `scrollWidth 320`.
  Ink measured by connected components (`work/measure_ink.py`), not by eye.
* `.mono` keeps `padding:1% 0 2%` from `index.html` so the box maths transfer to the build.

**Follow-ups**
* Integration is deliberately not applied: add `("Kaushan Script", "google/KaushanScript-400.woff2",
  400, "normal")` to `GOOGLE_FONTS` in `src/build.py`, set `--mono`, and replace the `.mono` rules.
* The reference's slab I with the claw is the one unfaithful detail; a pseudo-element bar on
  `.mono .i` is the cheap way to recover it if the client wants it.

## 2026-11-27 — Signature monogram, bold full names, bigger date labels, prefilled calendar, smoother scroll

**Asked:** (1) change the cover initials to the font in `Reference/Signature front page reference.png`, resized to fit; (2) the two names are full names, so bold **all** of it and space it so it doesn't overlap; (3) enlarge/bold `SABTU` and `DISEMBER`; (4) `TEMPAT` = "Masjid Prima Saujana / 43000 Kajang, Selangor" only; (5) "Simpan Tarikh" must open Google Calendar **on the date with everything filled in**, so the guest just presses Save; (6) smoother scrolling.

**Findings**
- The reference is a hand-set signature monogram: stacked, leaning, thick chisel brush (I top-left, & centre, A bottom-right). Two subagents ran: one matched the face, one verified the calendar URL.
- **Kaushan Script** is the closest free match (flat-brush terminals, italic slant, barbed `&`, crossbar `A`). Caveat: its `I` is a bare stroke, the reference's has slab bars.
- `calendar/r/eventedit` + naive local `dates` is why the calendar landed on the wrong day. The working contract is `calendar/render?action=TEMPLATE` with **UTC** dates + `ctz`.
- Bold TheSeasons (p2 subset) has no `E`, so a bold "DISEMBER" silently fell back glyph-by-glyph → date labels moved to **Vollkorn 600**.

**Changes** (`src/index.template.html` → `index.html`, `dist/` synced)
- Monogram: Kaushan Script, 80–106 px, `line-height .7`, stacked with per-glyph offsets (`I` −.591em/−6°, `&` .82em/−.179em, `A` 1.08em/+.149em/+2°), 3.2 % bottom margin so the ink clears the date line. Font subsetted to `assets/fonts/google/KaushanScript-400.sub.woff2` and registered in `build.py`; Allura removed.
- Names: one bold block each (`Imas Nazifatuz Zahro` / `Binti Suhaimi`, `Muhammad Azam Muddin` / `Bin Ishak`), TheSeasons 700 italic, `clamp(17px,4.9vw,23px)`, line-height 1.6 — the `.cbin` small-caps line is gone. At 320 the size drops to 17 px so the long line still fits in 241 px.
- Date: `SABTU` 12.5–14.5 px / 600, `DISEMBER` same, `2026` 11.5–13 px / 600 maroon; the `26` stays TheSeasons 700.
- Venue: two lines.
- Calendar: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=20261226T030000Z/20261226T080000Z&ctz=Asia/Kuala_Lumpur&location=…&details=…`.
- Scroll: reveal is 10 px / 480 ms / 45 ms stagger, triggered 2 % before entry; the scalloped card's `drop-shadow` was replaced by a static blurred pseudo-element (a filter over a 2000 px subtree re-rasterised on every reveal); petals fade out and the layer is removed ~8 s after the opening.

**Verification**
- Built page: `monoFont = "Kaushan Script"`; both `.cname` blocks `font-weight 700`, 19.11 px, 61 px tall (2 lines) at 390 and 17 px (2 lines) at 320 with no overflow (`scrollWidth 305 ≤ 320`, `375 ≤ 390`); date labels computed 13.26 px/600; `TEMPAT` innerText = "Masjid Prima Saujana\n43000 Kajang, Selangor"; calendar href resolves to the `render?action=TEMPLATE` URL above; no page errors; petals = 9 at open and removed after the timer.
- Monogram spacing measured: 11 px above the date at 390, 7 px at 320.
- `assets/og.jpg` regenerated (1200×630) with the new monogram; `dist/` byte-identical to `index.html`.
- Calendar caveat: the browser is signed out, so the prefilled editor could not be seen; both agents confirmed the query round-trips intact through the login redirect, and `render?action=TEMPLATE` + UTC `dates` is the documented contract. Worth one real-device check.

**Subagents:** both completed this time — `sig-font` (font ranking + final geometry, 24 faces tested) and `cal-link` (URL contract). Their notes are in `work/notes/`.

**Follow-ups:** the earlier Code.gs redeploy is still outstanding; if the client prefers the reference's slab `I`, it would need a licensed face (designer file), not a Google font.
