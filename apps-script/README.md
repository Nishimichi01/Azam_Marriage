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
5. Put that URL into the page:
   ```js
   var RSVP_CHANNEL  = "sheet";
   var RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfy…/exec";
   var RSVP_KEY      = "azam-nazifa-26-12-2026-x7k2";
   ```
   then rebuild:
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

## Behaviour worth knowing

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
