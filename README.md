# Walimatul Urus · Imas & Azam — online invitation

A single-file, mobile-first wedding e-invitation. The design is rebuilt from the couple's
**new printed card** (`Reference/Jemputan Imas&Azam-1 (1).pdf`): the mocha botanical toile,
the scalloped cream panel, and the card's own typefaces, colours and detail order.

```
index.html                  ← the invitation. Self-contained: images, panel mask and every
                              font are inlined; only YouTube (the song) and Google Sheets
                              (the guestbook) are fetched at runtime
src/index.template.html     ← editable source
src/build.py                ← inlines assets/fonts and writes index.html
assets/card-tile-500.webp   ← the print's botanical toile cell (tiles seamlessly)
assets/panel-scallop.svg    ← the scalloped panel silhouette, traced from the card
assets/flourish.svg         ← the card's ornamental divider, vector-traced
assets/qr.svg               ← the card's location QR (decodes to the Google Maps pin)
assets/fonts/web/*.woff2    ← the card's 9 embedded typefaces, re-cmapped for the web
assets/fonts/google/*.woff2 ← Vollkorn + La Belle Aurore (OFL), subsetted
assets/og.jpg               ← 1200×630 WhatsApp/Facebook preview
ref/refcard/DESIGN-SPEC.md  ← every measurement, colour and font finding behind the rebuild
Reference/                  ← the client's card PDF + reference links
apps-script/                ← the Google Sheet endpoint for RSVP + guestbook
docs/agent-memory/          ← notes for future work sessions
```

Rebuild after editing the template:

```bash
python src/build.py        # → index.html (≈470 KB, everything inlined)
```

## Previewing it on your own computer

**Easiest:** double-click **`index.html`**. Everything except the song and the live guestbook
is inside that one file, so it renders.

**Recommended:** double-click **`run-locally.bat`** → `http://localhost:8000`. Use this for
testing: a real `http://` address is what the invitation sees once published, so the per-guest
links (`?to=Nama`), the guestbook fetch and copy-to-clipboard behave correctly.

---

## 1. How faithful is it to the card?

The card is a vector A6 PDF, so the design was lifted from it, not eyeballed. Every number
below is in `ref/refcard/DESIGN-SPEC.md`.

| Element | On the print card | In the page |
|---|---|---|
| Botanical toile | one 118.4 pt motif cell painted 17× on a lattice rotated 25.732° | `assets/card-tile-500.webp`, tiled at `175px` (220px ≥700 px wide) |
| Panel cream | `#F9F7F5` (CMYK 6/6/8/0) | `--panel` |
| Type brown | `#785D41` | `--brown` |
| Maroon accent (`DIS` / `2026`) | `#4D0F17` | `--accent` |
| Panel shape | 48 shallow scallops (14 top, 12 sides, 10 bottom) on an arch-topped rect; shadow σ 8 pt `#6E5039` @ .66 | `assets/panel-scallop.svg` as a CSS `mask`, shadow on a wrapper |
| Cover script | MoonTime 49.96 pt | `--script` (MoonTime, subsetted) |
| Cover ampersand | Daydream 37.97 pt | `--amp` (Daydream) |
| Cover small caps | Vollkorn 8.38 pt, tracking .164 em | Vollkorn |
| Inside serif | TheSeasons 7.29–21.81 pt, tracking .067 em | `--card` (TheSeasons Reg/Bd/BdIt) |
| "dengan pasangannya" | Brittany Signature 9.53 pt | `--hand` |
| Detail order | greeting → hosts → menjemput → guest line → puteri kami → names → flourish → date/address/time → QR → contacts | identical, in the same order |
| QR | vector QR of `maps.app.goo.gl/TxpW6quXn25QASN97` | **removed** (physical-card affordance; Maps/Waze buttons instead) |

**The brief asked for a phone-first adaptation, not a reproduction.** Three departures from
the print, all deliberate:

1. **The cover shows initials only** — a large Allura monogram (`MENUJU SATU · I & A ·
   SABTU | 26.12.2026 · venue`), no tap hint, no full names.
2. **The interior keeps the card's order but not its layout.** The couple is a name +
   uppercased patronymic block rather than the card's tight stack; the three-column
   `SABTU / ALAMAT / MASA MAJLIS` band is replaced by a large date block over two labelled
   rows (`MASA`, `TEMPAT`); the print's tiny sizes are gone (body ~13–15 px).
3. **The QR code was removed** — it belongs on the physical card; the Google Maps / Waze
   buttons do that job on a phone.

Because the card's fonts are Canva **subsets** (MoonTime only carries `A I a m s z`), they are
used only for the exact strings on the card. All new UI copy uses Vollkorn — the card's own
secondary typeface — and the guestbook messages use La Belle Aurore.

## 2. What the invitation does

* **Cover — initials only.** A large Allura monogram on the scalloped panel. Tap/Enter: the
  panel turns away like a book page (`rotateY`, 1.9 s, hinged on its left edge with a light
  sweep) while dried-petal leaves drift down and the invitation settles in behind it. Nothing
  behind the cover is pre-revealed, and reduced motion skips straight to the open state.
* **The card's interior** in the card's order — greeting → hosts → *dengan segala hormatnya
  menjemput* → addressee + rule → *hadir ke majlis…* → the couple (name, patronymic, script
  line, name) → flourish → date block → `MASA` / `TEMPAT` rows → Maps/Waze/calendar → the four
  `UNTUK DIHUBUNGI` numbers as full-width `wa.me` rows.
* **Countdown** to 26 December 2026, 11:00 (+08:00), then a "majlis sedang/telah berlangsung" line.
* **Senarai Hadiah** — the gift list section (see §3).
* **RSVP** — the existing Google Sheet flow, restyled.
* **Sign Our Guestbook** — wishes carousel + form (see §4).
* **Bottom bar** — `RSVP · Hadiah · Lagu` (music toggle; label flips to `Senyap` while playing).
* **Scroll reveal** — opacity + 14 px lift only (no animated `blur`, no `backdrop-filter` on the
  fixed bar), fires once per element, 50 ms stagger: cheap enough to stay smooth on a
  mid-range phone.
* **Personal greeting** — `index.html?to=Encik%20Ahmad` adds `KEPADA / Encik Ahmad` to the cover
  and records who was invited in the sheet.
* **Closing block** sits on a cream card, not on the toile — the thanks and the share button
  were washing into the wallpaper.
* Reduced motion is respected: no reveals, no petals, instant open.

## 3. The gift list (hadiah)

`#hadiah` explains that presence is enough, then opens the couple's Google Sheet — the list of
55 suggested gifts in 9 categories, with a checkbox per row so two guests don't buy the same
thing. Edit the link in one place:

```js
var GIFT_SHEET = "https://docs.google.com/spreadsheets/d/1VxoHAGpd_y6fGH3YPTAJIpBUNGNbNLHegU3TtRdWJM0/edit?usp=sharing";
```

The button must point at a sheet shared as **"Anyone with the link → Viewer"** (or Editor if
guests should be able to tick boxes). The eight categories listed under the button are static
text in `#hadiah` — update them if the sheet's tabs change.

## 4. Sign Our Guestbook

Modelled on the reference invitation in `Reference/Link for reference.txt`
(aliveinvite.com/hazimxdina): one wish at a time in a handwritten face, the guest's name
tracked in small caps, dot navigation, `lihat semua ucapan` opening a full-screen sheet, then
the form (`Nama anda`, `Mesej`, `Ucapan Anda`).

* **Reading** — wishes come from the `Ucapan` column of the RSVP sheet
  (`<exec URL>?csv=1&key=…`, which Google serves with `Access-Control-Allow-Origin: *`).
  Newest first, up to 8 in the carousel; `lihat semua ucapan` shows every one. The couple's
  `UJIAN…` / `DIAG…` test rows are filtered out.
* **Writing** — the form POSTs `{ status: "ucapan", ucapan: "<message>" }` to the same Apps
  Script endpoint, and the wish appears immediately (optimistic), then persists.
* Wishes are **not** counted as attending guests (see §6).
* If the endpoint is unreachable, the page still works: the wish is shown locally and an
  error explains that it wasn't saved.

## 5. The song

The song is the client's YouTube link — **Banda Neira · Sampai Jadi Debu (Peaceful Piano)**,
`https://youtu.be/9CHAP_Sdc9A`.

```js
var YT_ID      = "9CHAP_Sdc9A";
var YT_START   = 115;   // 1:55 — start here, and loop back here
var MUSIC_VOL  = 55;
```

How it works (the same technique the kadkahwinmy.com-style invitations use):

* A **hidden** YouTube player: a normal 366×206 iframe parked entirely below the viewport
  (`bottom:-320px`, `pointer-events:none`) — the same trick the kadkahwinmy.com templates use
  (they park a full-size player off-screen too). No visible video, no controls, no branding.
* The **YouTube IFrame API** seeks to `YT_START` and plays. On `ENDED` it seeks back to
  `YT_START` and plays again — so it loops from 1:55 forever, not from 0:00. (The reference
  template only seeks on open and never loops; this page fixes that.)
* Browsers block sound before a user gesture, so playback starts on the **cover tap**
  (`unMute()` + `playVideo()` inside the click handler). If the browser still refuses
  (iOS Low Power Mode), it retries on the next touch, and the `Lagu` button in the bottom bar
  is a manual fallback that also pauses/resumes.

> The song is streamed from YouTube, so it needs a connection. Nothing is downloaded into the
> repo. If the video is ever taken down or made non-embeddable, the button simply reports
> "Lagu latar tidak dapat dimainkan" and the invitation keeps working.

## 6. Editing

All copy is plain HTML in `src/index.template.html`. The settings are at the top of the
`<script>` block:

```js
var YT_ID = "9CHAP_Sdc9A";               // the song
var YT_START = 115;                      // 1:55
var MAPS = "https://maps.app.goo.gl/…";  // (also hard-coded in the QR <a href>)
var GIFT_SHEET = "https://docs.google.com/spreadsheets/d/…";
var WA_NUMBER = "60175707840";           // WhatsApp fallback
var EVENT_START = "2026-12-26T11:00:00+08:00";
var EVENT_END   = "2026-12-26T16:00:00+08:00";

var RSVP_CHANNEL  = "auto";              // "auto" | "sheet" | "netlify" | "whatsapp"
var RSVP_ENDPOINT = "https://script.google.com/macros/s/…/exec";
var RSVP_KEY      = "…";                 // must equal SECRET in apps-script/Code.gs
```

Other things worth knowing:

* **Names / date / venue / phone numbers** are in the `.sheet` hero block — keep the card's
  order.
* **The flourish, QR and scallop mask** are files in `assets/`; replacing them only requires
  `python src/build.py`.
* **Fonts**: the card subsets must only be used for the exact card strings (they contain no
  other letters). New copy → Vollkorn.
* **Atur cara / photo gallery** are intentionally absent: the card has neither, and the brief
  was to follow the card's details and order.

## 7. Publishing on Netlify

The repo carries the two things Netlify needs: `index.html` at the **root**, and a
`netlify.toml` that pins the publish directory.

```
[build]
  publish = "."
  command = ""
```

If the site is linked to `github.com/Nishimichi01/Azam_Marriage`, every push to `main`
deploys. When a deploy shows **"Page not found"**, it is almost always one of these:

| Symptom | Cause | Fix |
|---|---|---|
| Deploy succeeded, page 404s | the commit had no `index.html` (only a README) | commit/push the site files — this repo now has them |
| No branches listed when linking | the Netlify GitHub App has no access to the repo | GitHub → Settings → Applications → Netlify → *Configure* → grant the repo, then re-link |
| Still 404 after linking | publish directory set to `public`/`dist` in the UI | Build & deploy → Build settings → publish directory = `.` |

Manual deploy (fastest, works even if the Git link is broken):

1. `mkdir -p dist/assets && cp index.html dist/ && cp assets/og.jpg dist/assets/`
   (`dist/` is already built this way and is git-ignored)
2. Open <https://app.netlify.com/drop>
3. Drag the **`dist`** folder onto the page → live URL in ~10 seconds.

For the share preview, `assets/og.jpg` is already generated (1200×630). When the invitation
gets its real domain, set `og:image` in the template to the absolute URL
(`https://your-domain/assets/og.jpg`) and rebuild — WhatsApp needs an absolute URL.

## 8. RSVP + guestbook storage (Google Sheet)

One Apps Script endpoint stores everything: RSVPs and guestbook wishes. Three channels,
selected by `RSVP_CHANNEL`; `"auto"` (the default) uses the sheet whenever `RSVP_ENDPOINT` is a
URL, else falls back to WhatsApp.

| Mode | Where answers go | CSV |
|---|---|---|
| `whatsapp` | the guest's own WhatsApp message to Azam | ✗ |
| `sheet` | rows in a **Google Sheet**, via a free Apps Script web app | ✓ native |
| `netlify` | **Netlify Forms** (100 submissions/month on the free plan) | ✓ button in the UI |

Setup is in [`apps-script/README.md`](apps-script/README.md). Columns:
`Masa (server), Masa (pelawat), Nama, Telefon, Status, Dewasa, Kanak-kanak, Jumlah tetamu,
Ucapan, Dijemput, Halaman` — UTF-8 with BOM so Excel opens it cleanly.

**Guestbook rows** are written with `Status = Ucapan`, `Telefon` blank and 0 guests, so they
never disturb the attendance totals. They are appended, never merged into an RSVP row.
`apps-script/Code.gs` handles this (see `isWish`), and its dashboard shows a separate
"Ucapan buku tetamu" count.

> ⚠️ **After updating `apps-script/Code.gs`, redeploy it**: Deploy → Manage deployments →
> Edit (✏️) → *New version* → Deploy. Apps Script serves the deployed version, not the editor
> file. Until then the guestbook still saves (the page posts a marker phone number so the old
> code appends instead of overwriting), but those rows appear as `Hadir` with 0 guests.

Behaviour: a repeat RSVP **updates** that guest's row (matched on phone, or name when no phone
is given); a hidden honeypot field silently drops bots; after a successful save the guest sees
a receipt with an optional "Hantar juga melalui WhatsApp".

> `mode: "no-cors"` is used for the Google endpoint (a `text/plain` POST is a "simple"
> request, so no CORS preflight), which means the page cannot read the response — the
> confirmation is optimistic and the WhatsApp link stays as the fallback.

## 9. Known gaps / decisions

1. **Photographs** — none yet, so no gallery and no couple photo section.
2. **Dark mode** — intentionally absent: the card is a cream/mocha artefact and a dark theme
   would break it. `color-scheme: light` is pinned.
3. **`noindex`** — set so the family's phone numbers don't end up in search results.
3b. **Typefaces** — the cover monogram is **Allura** (OFL); the card's own script (MoonTime)
   only carries `A I a m s z`, so it cannot be used for new words. Bold TheSeasons strings must
   be card-exact: the bold subset has no `E`, `p`, `1` or `:`, which is why the month/date/time
   lines are set in the regular cut.
4. **Accessibility** — the cover is a real button (Enter/Space), the RSVP sheet and the
   all-wishes overlay close with Escape and return focus, every control is reachable by
   keyboard, and reduced-motion is honoured.
5. **`file://` preview** — works, except the guestbook's live wish list (cross-origin `fetch`
   from a `file:` origin is blocked) and clipboard fallbacks; use `run-locally.bat`.
6. **Licensing** — the card's typefaces (MoonTime, Daydream, TheSeasons, Brittany Signature)
   are commercial Canva faces. The shipped files are subsets of the couple's own card, fine for
   rebuilding *this* invitation, not for reuse elsewhere. Vollkorn and La Belle Aurore are OFL.
