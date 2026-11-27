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
