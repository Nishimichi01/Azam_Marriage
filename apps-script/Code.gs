/**
 * RSVP endpoint — Walimatul Urus · Azam & Nazifa
 * ---------------------------------------------------------------------------
 * Stores every RSVP as a row in a Google Sheet, and serves the whole sheet as
 * a CSV on demand. Runs on Google's free Apps Script — no server, no database,
 * no monthly limit for a wedding.
 *
 * SETUP (3 minutes)
 *  1. Open https://script.google.com → "New project".
 *  2. Delete the sample code, paste this file, then press Save.
 *  3. Change SECRET below to any random string, and put the same string into
 *     RSVP_KEY in index.html.
 *  4. Deploy → "New deployment" → type "Web app"
 *       Description : RSVP
 *       Execute as  : Me
 *       Access      : Anyone            ← required, otherwise guests get 401
 *     Press Deploy, authorise the script, and copy the **/exec** URL.
 *  5. Put that URL into RSVP_ENDPOINT in index.html and set
 *     RSVP_CHANNEL = "sheet". Rebuild with `python src/build.py`.
 *
 * CSV
 *  - Spreadsheet: File → Download → Comma-separated values (.csv)
 *  - Live URL   : <your /exec URL>?csv=1&key=YOUR_SECRET   (downloads a fresh CSV)
 *  - Dashboard  : <your /exec URL>                          (totals + CSV link)
 */

var SHEET_NAME = 'RSVP';
var SECRET     = 'TUKAR-KEPADA-STRING-RAWAK';   // must match RSVP_KEY in index.html
var TIMEZONE   = 'Asia/Kuala_Lumpur';
var TITLE      = 'RSVP · Walimatul Urus Azam & Nazifa';

var HEADERS = [
  'Masa (server)', 'Masa (pelawat)', 'Nama', 'Telefon', 'Status',
  'Dewasa', 'Kanak-kanak', 'Jumlah tetamu', 'Ucapan', 'Dijemput', 'Halaman'
];

/* ------------------------------------------------------------------ POST */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    var body = parse_(e);
    if (SECRET && body.key !== SECRET) return json_({ ok: false, error: 'bad key' });
    if (String(body.honeypot || '').trim()) return json_({ ok: true, skipped: 'bot' });

    var nama = String(body.nama || '').trim().slice(0, 120);
    if (!nama) return json_({ ok: false, error: 'no name' });

    var hadir  = body.status !== 'tidak';
    var dewasa = hadir ? num_(body.dewasa, 1) : 0;
    var kanak  = hadir ? num_(body.kanak_kanak, 0) : 0;
    var phone  = String(body.telefon || '').replace(/[^0-9+]/g, '').slice(0, 20);

    var book  = book_();
    var sheet = book.sh;
    var row = [
      new Date(),
      date_(body.masa),
      nama,
      phone,
      hadir ? 'Hadir' : 'Tidak Hadir',
      dewasa,
      kanak,
      dewasa + kanak,
      String(body.ucapan || '').slice(0, 1000),
      String(body.dijemput || '').slice(0, 120),
      String(body.halaman || '').slice(0, 300)
    ];

    var hit = find_(sheet, nama, phone);
    if (hit) {
      sheet.getRange(hit, 1, 1, row.length).setValues([row]);
      sheet.getRange(hit, 1).setNote('Dikemas kini pada ' + stamped_());
      return json_({ ok: true, updated: true, row: hit });
    }

    sheet.appendRow(row);
    return json_({ ok: true, updated: false, row: sheet.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------- GET */

function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.csv || p.format === 'csv') {
    if (SECRET && p.key !== SECRET) return text_('Unauthorized', 'text/plain');
    var file = TITLE.replace(/[^A-Za-z0-9]+/g, '-') + '-' +
               Utilities.formatDate(new Date(), TIMEZONE, 'yyyyMMdd-HHmm') + '.csv';
    var out = ContentService.createTextOutput(csv_())
      .setMimeType(ContentService.MimeType.CSV);
    // Not all browsers honour a filename on ContentService, the sheet download always does.
    return out;
  }

  var rows = book_().sh.getDataRange().getValues().slice(1);
  var hadir = 0, tidak = 0, orang = 0, kanak = 0;
  rows.forEach(function (r) {
    if (r[4] === 'Hadir') { hadir++; orang += num_(r[5], 0); kanak += num_(r[6], 0); }
    else if (r[4]) { tidak++; }
  });

  var link = ScriptApp.getService().getUrl() + '?csv=1&key=' + encodeURIComponent(SECRET);
  return HtmlService.createHtmlOutput(
    '<div style="font-family:Georgia,serif;max-width:520px;margin:40px auto;color:#2E361D">' +
      '<h2 style="color:#4D2E1A;margin:0 0 4px">' + TITLE + '</h2>' +
      '<p style="opacity:.7;margin:0 0 24px">' + stamped_() + '</p>' +
      '<table style="border-collapse:collapse;font-size:16px">' +
        row_('Jawapan diterima', rows.length) +
        row_('Hadir (bilangan jawapan)', hadir) +
        row_('Hadir (jumlah dewasa)', orang) +
        row_('Hadir (jumlah kanak-kanak)', kanak) +
        row_('Tidak hadir', tidak) +
      '</table>' +
      '<p style="margin-top:24px"><a href="' + link + '" style="color:#78804B">Muat turun CSV</a></p>' +
    '</div>'
  );
}

/* -------------------------------------------------------------- helpers  */

function book_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var ss;

  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(TITLE);
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }

  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#78804b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, HEADERS.length, 150);
    sh.setColumnWidth(9, 320);
  }

  // tidy the default empty sheet that Google creates with a new spreadsheet
  var first = ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);

  return { ss: ss, sh: sh };
}

function parse_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); }
    catch (err) { return (e && e.parameter) || {}; }
  }
  return (e && e.parameter) || {};
}

function find_(sheet, nama, phone) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var keys = sheet.getRange(2, 3, last - 1, 2).getValues();   // nama, telefon
  var wantName = String(nama || '').toLowerCase().replace(/\s+/g, ' ').trim();
  for (var i = keys.length - 1; i >= 0; i--) {                 // newest first
    var n = String(keys[i][0] || '').toLowerCase().replace(/\s+/g, ' ').trim();
    var p = String(keys[i][1] || '').replace(/[^0-9+]/g, '');
    if (phone && p && p === phone) return i + 2;
    if (!phone && wantName && n === wantName) return i + 2;
  }
  return 0;
}

function csv_() {
  var values = book_().sh.getDataRange().getValues();
  var lines = values.map(function (row) {
    return row.map(function (cell) {
      var s = (cell instanceof Date)
        ? Utilities.formatDate(cell, TIMEZONE, 'yyyy-MM-dd HH:mm')
        : String(cell === null ? '' : cell);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  });
  // BOM keeps Malay text correct when the CSV is opened in Excel
  return '\ufeff' + lines.join('\r\n');
}

function num_(v, fallback) {
  var n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

function date_(v) {
  if (!v) return '';
  var d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d;
}

function stamped_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm');
}

function row_(label, value) {
  return '<tr><td style="padding:6px 18px 6px 0;opacity:.75">' + label +
         '</td><td style="padding:6px 0;font-weight:bold">' + value + '</td></tr>';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function text_(body, mime) {
  return ContentService.createTextOutput(body)
    .setMimeType(mime === 'text/plain' ? ContentService.MimeType.TEXT : ContentService.MimeType.JSON);
}

/** Optional: run this once from the editor to create the sheet + headers early. */
function setup() {
  var book = book_();
  Logger.log('Spreadsheet: ' + book.ss.getUrl());
}
