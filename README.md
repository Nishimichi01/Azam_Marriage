# Walimatul Urus · Azam & Nazifa — online invitation

A single-file, mobile-first wedding e-invitation. The design is rebuilt from the couple's
printed card (`Kad Kahwin - Azam & Nazifa.pdf`); the motion and the interaction model follow
the sample recording (`video_20261112_123720.mp4`).

```
index.html                  ← the invitation. Self-contained (fonts are the only external request)
assets/lily.webp            ← the pink lily, extracted from the PDF (real transparency)
assets/branch.webp          ← the bud branch, extracted from the PDF
assets/og.jpg               ← 1200×630 share preview
src/index.template.html     ← editable source (assets referenced as {{LILY}} / {{BRANCH}})
src/build.py                ← inlines the images and writes index.html
src/plaid.uri               ← the exact plaid tile used as a CSS background
ref/                        ← reference renders: PDF pages, video frames, extracted artwork
```

Rebuild after editing the template:

```bash
python src/build.py
```

Preview locally (any static server):

```bash
python -m http.server 8000     # → http://localhost:8000
```

---

## 1. How faithful is it to the card?

The card is a vector PDF, so the design was lifted from it rather than eyeballed:

| Element | Source in the PDF | Used in the page |
|---|---|---|
| Plaid | 93.1 pt square repeating unit: 1 white 7.495 pt thread + 1 blush 3.17 pt thread + 4 blush 1.056 pt threads, each direction | `src/plaid.uri`, tiled at `22.2vw` so the unit is the same share of the width as on the card |
| Olive | `rgb(120,128,75)` | `--olive #78804B` |
| Blush | `rgb(197,168,158)` | `--blush #C5A89E` |
| Cream panel | `rgb(234,223,217)` at 18.6 % / 18.8 % insets | `--paper #EADFD9`, panel sized `62.8vw × 62.4vh` |
| Sage page | `rgb(223,224,188)` | `--sage #DFE0BC` |
| Ink / body | `#4D2E1A` / `#2E361D` | `--ink`, `--soft` |
| Lily + branch artwork | 2 embedded images with soft masks | pulled out at full resolution, `assets/*.webp` |
| Type | Pinyon Script, Lora, TheSeasons | Pinyon Script, Lora, Cormorant Garamond (free stand-in for TheSeasons) |

Everything else — wording, names, date, venue, contact — is copied verbatim from the card.

## 2. What it does (from the sample video)

* **Cover** — the printed cover, tappable. The round seal pulses, then on tap it scales up and
  dissolves while the cream panel grows to fill the screen and turns sage, exactly like the
  sample's "seal → blurred-background-to-sharp" opening.
* **Greeting** — every line fades up out of a blur, staggered (~80 ms apart), the way the
  reference reveals "Majlis Perkahwinan → names → date".
* **Scroll reveals** — the same blur-and-lift on every block as it enters the view.
* **Bottom bar** — icon + label, three items maximum: `Lagu`, `RSVP`, `Lokasi`.
* **Frosted card** — the venue block sits on a translucent paper card with a backdrop blur,
  like the reference's glass schedule card.
* **Falling petals** — lily petals drifting down, not the reference's roses.
* **Extras** — live countdown, add-to-calendar, Maps/Waze, WhatsApp RSVP sheet, share, and
  per-guest greeting via `?to=`.

## 3. Editing

All copy lives in plain HTML in `src/index.template.html` (search for the Malay text).
The few settings are at the top of the `<script>` block:

```js
var SONG        = "";                  // ← MP3 URL here. Empty = the Lagu button stays hidden
var MUSIC_VOL   = 0.55;
var WA_NUMBER   = "60175707840";       // WhatsApp for RSVP + contact
var EVENT_START = "2026-12-26T11:00:00+08:00";
var EVENT_END   = "2026-12-26T15:00:00+08:00";
```

Other places to touch:

* **Atur cara / tentative** — the `<!-- EDIT -->` block in the `#tentatif` section. The times
  currently shown are a sensible default, **please confirm them** with the family/masjid.
* **Gallery** — not included; there are no photographs yet. Say the word and a photo section
  will be added (lazy-loaded, swipeable).
* **Maps / Waze / calendar links** — plain `<a href>` in `#lokasi`.
* **Contact** — the olive band at the bottom.

### Adding the song (when you're ready)

1. Put the MP3 next to `index.html` (e.g. `lagu.mp3`), or use any direct-file URL.
2. Set `var SONG = "lagu.mp3";`
3. The `Lagu` button appears in the bottom bar; playback starts on the cover tap (browsers
   block sound before a gesture) and the button toggles it.

Use audio you have the right to use — a licensed/royalty-free track or your own recording.

### Personal greeting per guest

`index.html?to=Encik%20Ahmad%20bin%20Ali` prints

> KEPADA
> *Encik Ahmad bin Ali*

on the cover. Without the parameter the line simply doesn't appear. Build one link per guest
(or per family) — it's the usual way these invitations get sent in WhatsApp groups.

## 4. Publishing on Netlify

The repo already carries the two things Netlify needs: `index.html` at the **root**, and a
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

Manual deploy, no GitHub in the loop (fastest, works even if the Git link is broken):

1. Build the deploy folder: `mkdir -p dist/assets && cp index.html dist/ && cp assets/og.jpg dist/assets/`
   (already done — `dist/` is ready and git-ignored)
2. Open <https://app.netlify.com/drop>
3. Drag the **`dist`** folder onto the page → you get a live URL in ~10 seconds.

Either way, then enable the share preview: uncomment the two `og:image` lines in `<head>` of
`src/index.template.html`, set your real domain, and run `python src/build.py` again.

## 5. RSVP — and getting a CSV

The form has three modes, set at the top of the script. Default is WhatsApp; nothing else
needs a backend, so the page stays a single static file.

```js
var RSVP_CHANNEL  = "whatsapp";   // "whatsapp" | "sheet" | "netlify"
var RSVP_ENDPOINT = "";           // Apps Script /exec URL  (for "sheet")
var RSVP_KEY      = "";           // shared secret          (for "sheet")
```

| Mode | Where answers go | CSV |
|---|---|---|
| `whatsapp` | the guest's own WhatsApp message to Azam | ✗ (you copy them out) |
| `sheet` | rows in a **Google Sheet**, via a free Apps Script endpoint | ✓ native |
| `netlify` | **Netlify Forms** (100 submissions/month on the free plan) | ✓ button in the dashboard |

### Recommended: Google Sheet → CSV

Setup is in [`apps-script/README.md`](apps-script/README.md) — paste `apps-script/Code.gs`
into script.google.com, deploy as a Web app, copy the `/exec` URL into `RSVP_ENDPOINT`,
set `RSVP_CHANNEL = "sheet"`, rebuild.

Then the CSV is available three ways:

* **File → Download → Comma-separated values** in the spreadsheet
* **`<exec URL>?csv=1&key=YOUR_SECRET`** — downloads a fresh CSV on demand
* **`<exec URL>`** — a small dashboard with totals (hadir / tidak hadir / jumlah tetamu)

Columns: `Masa (server), Masa (pelawat), Nama, Telefon, Status, Dewasa, Kanak-kanak,
Jumlah tetamu, Ucapan, Dijemput, Halaman`. UTF-8 with BOM so Excel opens it cleanly.

Behaviour: a repeat reply **updates** the guest's row instead of duplicating it (matched on
phone, or name when no phone is given); a hidden honeypot field silently drops bots; after a
successful save the guest sees a receipt with an optional "Hantar juga melalui WhatsApp".

> `mode: "no-cors"` is used for the Google endpoint (a `text/plain` POST is a "simple"
> request, so no CORS preflight), which means the page cannot read the response — the
> confirmation is optimistic and the WhatsApp link stays as the fallback. That is the normal
> trade-off for stateless static hosting; a real success/failure readout needs a backend.

## 6. Known gaps / decisions

1. **Music** — waiting on a track (see §3).
2. **Photographs** — none yet, so no gallery and no couple photo section.
3. **Atur cara times** — placeholder, confirm before sharing.
4. **RSVP storage** — WhatsApp, by design (§5).
5. **Dark mode** — intentionally not implemented: the card is a cream/sage artefact and a dark
   theme would break it. `color-scheme: light` is pinned.
6. **`noindex`** — set so the couple's phone number doesn't end up in search results. Remove
   the meta tag if that's not wanted.
7. **Accessibility** — reduced-motion is respected (no petals, no reveals, instant open),
   the cover is a real button, the sheet closes with Escape and returns focus.
