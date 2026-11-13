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
