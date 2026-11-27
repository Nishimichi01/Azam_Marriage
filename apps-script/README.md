# RSVP → Google Sheet → CSV

This folder holds the small Google Apps Script that turns the invitation's RSVP form
into rows in a spreadsheet, with a CSV download.

Everything runs on Google's free tier: no server, no database, no monthly submission cap
(a wedding is well inside the quota).

## Setup (about 3 minutes)

1. Open <https://script.google.com> → **New project**.
2. Paste the contents of `Code.gs` over the sample code, then **Save**.
3. In `Code.gs`, change:
   ```js
   var SECRET = 'TUKAR-KEPADA-STRING-RAWAK';
   ```
   to any random string (e.g. `azam-nazifa-26-12-2026-x7k2`).
   Copy the same string into `RSVP_KEY` in `src/index.template.html`.
4. **Deploy → New deployment → Web app**

   | Field | Value |
   |---|---|
   | Description | `RSVP` |
   | Execute as | `Me` |
   | Who has access | **Anyone** |

   Press **Deploy**, authorise the script, and copy the URL ending in **`/exec`**.
5. Put that URL into the page — **this is the only line you must change**:
   ```js
   var RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfy…/exec";
   var RSVP_KEY      = "azam-nazifa-26-12-2026-x7k2";
   ```
   `RSVP_CHANNEL` is `"auto"`, so filling in the endpoint switches storage on by
   itself. Then rebuild:
   ```bash
   python src/build.py
   ```

The first submission creates the spreadsheet automatically and remembers its id in the
script's properties. Run `setup()` once from the editor if you want the sheet (and its
headers) to exist before the first guest arrives — the log prints the spreadsheet URL.

## Getting the CSV

Three ways, all free:

| Where | How |
|---|---|
| Spreadsheet | **File → Download → Comma-separated values (.csv)** |
| Live URL | `<your /exec URL>?csv=1&key=YOUR_SECRET` → downloads a fresh CSV |
| Dashboard | Open `<your /exec URL>` → totals + a "Muat turun CSV" link |

The CSV is UTF-8 **with a BOM**, so Malay text and emoji open correctly in Excel.
Columns:

```
Masa (server), Masa (pelawat), Nama, Telefon, Status, Dewasa, Kanak-kanak,
Jumlah tetamu, Ucapan, Dijemput, Halaman
```

`Dijemput` is the `?to=` name from the guest's personal link, so you can see which
invitation they replied to.

## Two ways to install the script — both supported

The script works whether you create it **standalone** (`script.google.com` →
New project) or **bound** to a spreadsheet (open the sheet → **Extensions → Apps
Script**). This matters: the `getActiveSpreadsheet()` pattern you'll see in most
snippets only works in the bound case, and returns `null` in a standalone script —
which is the usual cause of an "exception" 500 from a web app.

`book_()` tries, in order:

1. `SpreadsheetApp.getActiveSpreadsheet()` — the bound sheet, if there is one
2. the spreadsheet id stored from a previous run
3. otherwise creates a new spreadsheet and remembers its id

So a fresh standalone script creates its own sheet on the first RSVP, and a bound
script writes into the sheet you are already looking at. No configuration needed.

## If you edit Code.gs, you must redeploy

Apps Script serves the **deployed version**, not the file in the editor. After any
change: **Deploy → Manage deployments → (pencil) Edit → Version: New version → Deploy.**
Forgetting this is why a fix can "not work" — the old `/exec` keeps running.

## Behaviour worth knowing

* **Phones are stored as text.** Without this, Sheets parses `0123456789` as a number and
  drops the leading zero — every Malaysian number comes out as `123456789`. The script sets
  the phone column to plain text (`@`) and re-writes the value, so exports keep the `0`.
* **Re-submissions update, they don't duplicate.** A guest who replies twice is matched on
  phone number (or name when no phone is given) and their existing row is overwritten.
* **Honeypot.** Bots that fill the hidden field are silently dropped.
* **`SECRET`** is a soft guard — it lives in the public page, so treat it as a spam filter,
  not a password. Real protection is Apps Script's rate limits plus the honeypot.
* **Changing `Code.gs` later** requires **Deploy → Manage deployments → Edit → New version**;
  otherwise the live `/exec` URL keeps running the old code.

## Alternative: Netlify Forms (no Google account)

Set `RSVP_CHANNEL = "netlify"` in the page and deploy to Netlify. The hidden `<form name="rsvp">`
in the HTML is detected at deploy time, submissions appear under **Forms** in the Netlify
dashboard, and **Download CSV** sits right there. Trade-off: the free plan allows
**100 submissions per month** and Netlify stops accepting them past that, so a large guest
list is safer on the Google Sheet.
