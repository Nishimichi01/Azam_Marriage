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

## 4. Publishing

Any static host works, because there are no server requirements:

* **Netlify Drop** — drag the folder onto app.netlify.com/drop.
* **Cloudflare Pages / GitHub Pages / Vercel** — drop the folder in.
* **Any cPanel hosting** — upload `index.html` (plus `og.jpg` if you use it).

Then enable the share preview: uncomment the two `og:image` lines in `<head>` and set your real
domain (`https://domain.com/og.jpg`).

## 5. RSVP — how it actually stores answers

Tapping **Hantar melalui WhatsApp** opens WhatsApp with a pre-filled message:

```
Salam, saya *Nama* (nombor).
Saya akan *hadir* ke Walimatul Urus Azam & Nazifa pada Sabtu, 26 Disember 2026.
Jumlah: 3 dewasa, 2 kanak-kanak.
Ucapan: …
```

Nothing is stored on a server — the guest still has to press send in WhatsApp. That is a
deliberate choice for a static page: it needs no database, no login and no hosting cost, and
every reply lands in Azam's phone. If a proper response table is wanted instead (a Google
Sheet, attendance totals, a wishes wall), that needs a small backend (Supabase/Firebase) or a
Google Form — both are easy to swap in later.

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
