#!/usr/bin/env python3
"""Build the single-file, self-contained wedding invitation.

    python src/build.py

Reads src/index.template.html and inlines every binary asset so the finished
index.html needs no network at all (fonts included):

    {{CARD_TILE}}    assets/card-tile-500.webp  the print's botanical toile cell (tiles seamlessly)
    {{PANEL_MASK}}   assets/panel-scallop.svg   scalloped card silhouette (CSS mask)
    {{FLOURISH}}     assets/flourish.svg        ornamental divider
    {{QR}}           assets/qr.svg              Google Maps QR from the print card
    {{FONTS}}        @font-face block           card subsets + Vollkorn + La Belle Aurore
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "src" / "index.template.html"
OUT = ROOT / "index.html"
FONTS = ROOT / "assets" / "fonts"

# ---- the card's own typefaces, subsetted straight from the print PDF ----------
# (name, file, weight, style).  These subsets only carry the glyphs the card
# uses, so they must only be applied to the exact card strings.
CARD_FONTS = [
    ("MoonTime", "web/MoonTime-Regular.woff2", 400, "normal"),
    ("Daydream", "web/Daydream.woff2", 400, "normal"),
    ("TheSeasons", "web/TheSeasons-Reg.woff2", 400, "normal"),
    ("TheSeasonsDate", "web/TheSeasons-Bd.woff2", 400, "normal"),   # cover date line (has the "1")
    ("TheSeasons", "web/TheSeasons-Bd-p2.woff2", 700, "normal"),
    ("TheSeasons", "web/TheSeasons-BdIt.woff2", 700, "italic"),
    ("Brittany Signature", "web/BrittanySignatureRegular.woff2", 400, "normal"),
]

# ---- open-licence faces for all the new (non-card) copy ----------------------
GOOGLE_FONTS = [
    ("Vollkorn", "google/Vollkorn-400.sub.woff2", "400 900", "normal"),
    ("Vollkorn", "google/Vollkorn-400i.sub.woff2", "400 900", "italic"),
    ("La Belle Aurore", "google/LaBelleAurore-400.sub.woff2", 400, "normal"),
]


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def font_face(family, rel, weight, style) -> str:
    path = FONTS / rel
    if not path.exists():
        raise SystemExit(f"missing font: {path}")
    return (
        "@font-face{font-family:\"%s\";src:url(%s) format(\"woff2\");"
        "font-weight:%s;font-style:%s;font-display:block}"
        % (family, data_uri(path, "font/woff2"), weight, style)
    )


def main() -> int:
    html = TPL.read_text(encoding="utf-8")

    tokens = {
        "{{CARD_TILE}}": data_uri(ROOT / "assets" / "card-tile-500.webp", "image/webp"),
        "{{PANEL_MASK}}": data_uri(ROOT / "assets" / "panel-scallop.svg", "image/svg+xml"),
        "{{FLOURISH}}": data_uri(ROOT / "assets" / "flourish.svg", "image/svg+xml"),
        "{{QR}}": data_uri(ROOT / "assets" / "qr.svg", "image/svg+xml"),
    }
    for token, uri in tokens.items():
        if token not in html:
            print(f"warning: token {token} not found in template", file=sys.stderr)
        html = html.replace(token, uri)

    faces = [font_face(*f) for f in CARD_FONTS + GOOGLE_FONTS]
    if "{{FONTS}}" not in html:
        print("warning: token {{FONTS}} not found in template", file=sys.stderr)
    html = html.replace("{{FONTS}}", "\n".join(faces))

    OUT.write_text(html, encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.relative_to(ROOT)}  ({kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
