#!/usr/bin/env python3
"""Build the single-file, self-contained wedding invitation.

    python src/build.py

Reads src/index.template.html, inlines assets/lily.webp and assets/branch.webp
as data URIs, and writes index.html (no external files needed besides the
Google Fonts stylesheet).
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "src" / "index.template.html"
OUT = ROOT / "index.html"

ASSETS = {
    "{{LILY}}": ROOT / "assets" / "lily.webp",
    "{{BRANCH}}": ROOT / "assets" / "branch.webp",
}


def data_uri(path: pathlib.Path) -> str:
    mime = "image/webp" if path.suffix == ".webp" else "image/png"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> int:
    html = TPL.read_text(encoding="utf-8")
    for token, path in ASSETS.items():
        if not path.exists():
            print(f"missing asset: {path}", file=sys.stderr)
            return 1
        if token not in html:
            print(f"warning: token {token} not found in template", file=sys.stderr)
        html = html.replace(token, data_uri(path))
    OUT.write_text(html, encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.relative_to(ROOT)}  ({kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
