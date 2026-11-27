# Project documentary — Azam_Marriage

Durable notes about how this invitation is built and why. Read this before changing anything.

## What this is

A single-file wedding e-invitation for **Imas Nazifatuz Zahro binti Suhaimi & Muhammad Azam
Muddin bin Ishak**, Saturday 26 December 2026, Masjid Prima Saujana, Kajang.

* Live artefact: `index.html` (repo root) — deployed by Netlify (`netlify.toml`,
  `publish = "."`). `dist/` is the drag-and-drop variant (git-ignored).
* Source of truth: `src/index.template.html` → build with `python src/build.py`.
* Design source: `Reference/Jemputan Imas&Azam-1 (1).pdf` (the *new* card). The extracted
  spec is `ref/refcard/DESIGN-SPEC.md` — read it before touching any colour, size or panel
  geometry.
* `Kad Kahwin - Azam & Nazifa.pdf` + `video_20261112_123720.mp4` are the **previous**
  (olive/blush) card and the motion reference. They are history, not the current design.

## Architecture

```
src/index.template.html  HTML + CSS + one IIFE of vanilla JS. No framework, no runtime deps.
src/build.py             replaces {{CARD_TILE}} {{PANEL_MASK}} {{FLOURISH}} {{QR}} and
                         {{FONTS}} with base64 data URIs, writes index.html.
assets/                  tile, mask, flourish, QR, og.jpg, fonts/{web,google}
apps-script/Code.gs      one Apps Script web app: RSVP rows + guestbook wishes + CSV + dashboard
apps-script/test.js      Node harness (vm + stubs) with 51 assertions: `node apps-script/test.js`
```

Everything except YouTube (the song) and Google (the wish list) is inlined, so the page has
no font/image network dependency at all.

## Design system (from the print card)

| token | value | role |
|---|---|---|
| `--panel` | `#F9F7F5` | cream panel / cards |
| `--brown` | `#785D41` | all type, rules, QR, ornament |
| `--accent` | `#4D0F17` | `DIS` / `2026` maroon |
| `--muted` | `#8B735A` | eyebrows, notes |
| `--card` | TheSeasons (Reg 400 / Bd-p2 700 / BdIt 700i) | the card's serif |
| `--script` | MoonTime | signature only (`Imas & Azam` — it carries just `A I a m s z`) |
| `--mono` | Kaushan Script | the cover monogram (`I & A`, stacked + leaning, 80–106 px) |
| `--amp` | Daydream | the `&` |
| `--hand` | Brittany Signature | "dengan pasangannya" |
| `--serif` | Vollkorn | all new copy (the card's secondary face) |
| `--wish` | La Belle Aurore | guestbook messages (matches the reference invite) |

Panel: `assets/panel-scallop.svg` (48 scallops on an arch-topped rect, traced from the print)
used as a CSS `mask`. Body sections use a plain cream `.card` with a 1px hairline and an inset
rule, so only the cover and the card interior carry the scallops.

Cover rule: **initials only** (`MENUJU SATU`, `I & A`, `SABTU | 26.12.2026`, venue, and the
optional `KEPADA` line). No tap hint — the client had it removed; the monogram itself is the
affordance. Do not put the full names back on the cover.

Monogram: Kaushan Script, stacked `I` / `&` / `A` with per-glyph offsets
(`I` -0.591em/-6°, `&` 0.82em/-0.179em, `A` 1.08em/+0.149em/+2°) copied from
`Reference/Signature front page reference.png`; the ink needs ~3.2% bottom margin or it
touches the date line.

Calendar: only `calendar/render?action=TEMPLATE` with **UTC** `dates`
(`20261226T030000Z/20261226T080000Z`) + `ctz` reliably opens a prefilled, save-ready event;
`r/eventedit` with naive local timestamps lands on the wrong day.

Opening: the panel is a **two-sided card** (`preserve-3d`, `.cface` + `.cback`,
`backface-visibility:hidden`) hinged on its left edge and turned `rotateY(-104deg)` over 1.9 s;
a blurred `.cshadow` shape sits behind it (a `filter` on the turning element would flatten the
3D and also kill the mask), `main` fades/settles in from ~660 ms, petals fall from the tap.

Interior layout is **deliberately not the print card**: `.cname` + `.cbin` (italic name, then
uppercase patronymic), a `.date` block, and `.fact` rows for MASA / TEMPAT. No QR.

## Gotchas (learned the hard way)

1. **The card fonts are Canva subsets.** MoonTime only carries `A I a m s z`, Daydream only
   `&`, Brittany only `a d e g n p s y`, TheSeasons-Reg lacks `F G J L N O Q V W X f q v x z`.
   Use them **only** for strings that appear on the card; every other character silently falls
   back to Vollkorn mid-word (which looks broken). Check a new string against
   `fontTools` cmap before using a card face.
2. **Chrome drops the mask when `filter` and `mask` are on the same element** (the scallops
   vanish). Always put `drop-shadow` on a wrapper (`.sheetwrap`) — and on the cover, use the
   separate blurred `.cshadow` div, because a `filter` also forces `transform-style: flat` and
   would break the page-turn.
3. **`background-size: 132% auto` broke the fixed toile** on tall viewports (white band at the
   bottom). The toile is now the 1000px cell tiled at `175px`/`220px`, which is seamless and
   scale-consistent at every viewport.
4. **Bold TheSeasons has no `E`, `p`, `1` or `:`** (the page-2 subset is card-exact). Month
   names, times and phone numbers must use the regular cut (`var(--card)` weight 400) or
   Vollkorn, otherwise single glyphs silently fall back and the line looks broken. The date
   labels (`SABTU`, `DISEMBER`, `2026`) are therefore **Vollkorn 600**, not TheSeasons bold.
5. **`file://` blocks the guestbook fetch** (cross-origin `fetch` from a `file:` origin) — use
   `run-locally.bat` for testing. The song and RSVP POST still work.
6. **Apps Script serves the deployed version, not the editor file.** Any `Code.gs` change
   needs Deploy → Manage deployments → Edit → *New version*.
7. **Old Code.gs + guestbook = overwrite risk.** The guestbook posts
   `telefon:"0000000000"` because `find_()` only skips name matching when a phone is present;
   without it a wish would overwrite that guest's RSVP row. The updated `Code.gs` also treats
   `status:"ucapan"` as a wish (Status `Ucapan`, 0 guests, always append).
8. **Sheet coercion:** phone numbers must stay text (leading zero). Already handled in
   `Code.gs` (`@` format + rewrite).
9. **Screenshot artifacts are pruned** by the browser harness within minutes; copy anything
   you need into `work/shots/` immediately.
9. **`node --check` on process substitution fails on this Windows setup** — write the inline
   script to `work/inline.js` first.
11. **The song** must start and loop at 115 s. `loop=1` alone restarts at 0:00, so the YT
    **IFrame API** seeks on `ENDED`. Playback is started on the cover tap (user gesture);
    `unMute()` inside that handler is what makes sound allowed on mobile. The iframe is a
    full-size player parked below the viewport (`bottom:-320px`) rather than a 2×2 px box —
    that is what kadkahwinmy.com does, and it avoids "player hidden/too small" edge cases.
    Researched: their template stores the song as `…&t=115s`, seeks on open, and never loops.

## Content sources

* Names/hosts/date/time/venue/contacts/QR: the card PDF (transcription in `DESIGN-SPEC.md` §8).
* Gift list: `https://docs.google.com/spreadsheets/d/1VxoHAGpd_y6fGH3YPTAJIpBUNGNbNLHegU3TtRdWJM0`
  (55 gifts, 9 categories, checkboxes; "Anyone with the link → Viewer").
* Song: `https://youtu.be/9CHAP_Sdc9A` — Banda Neira · Sampai Jadi Debu (Peaceful Piano).
* Guestbook style: `https://aliveinvite.com/hazimxdina` (one wish at a time, script message,
  tracked small-caps name, dots, "lihat semua ucapan", simple two-field form).

## Verification habits

* The Apps Script logic has a real test harness → `node apps-script/test.js` (must stay green).
* Browser checks that matter: cover leak (main opacity 0 before tap), music
  `YT.get('ytplayer')` state/time, guestbook POST body against the local mock
  (`work/mock_rsvp.py` on :8898 + `work/test-local.html`), RSVP success screen, no horizontal
  overflow at 320/360/390/1280, footer clear of the fixed bar.
* Never submit test data to the live sheet; use the mock copy.
* Animation frames can't be trusted from headless screenshots (composited layers sometimes
  come back blank). Verify motion by reading computed styles over time
  (`getComputedStyle(panel).transform`, petal rects), then confirm the static end state with a
  screenshot.
