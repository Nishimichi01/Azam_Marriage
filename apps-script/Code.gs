// RSVP + guestbook endpoint - Walimatul Urus Imas & Azam
// ---------------------------------------------------------------------------
// One Apps Script web app shared by the invitation (index.html):
//
//   POST  { key, nama, telefon, status, dewasa, kanak_kanak, ucapan, ... }
//         status "hadir" / "tidak"  -> an RSVP row
//         status "ucapan"           -> a guestbook wish (never a guest)
//   GET                          -> dashboard: totals + CSV link
//   GET  ?csv=1&key=SECRET       -> the whole sheet as CSV
//
// RSVP replies are appended to the "RSVP" tab; guestbook wishes to the
// "Buku Tetamu" tab. Both live in the spreadsheet whose id sits in the
// SPREADSHEET_ID script property (a configured id wins; otherwise a bound
// script uses the sheet it lives in).
//
//   GET  ?csv=1&key=SECRET      -> RSVP tab as CSV
//   GET  ?wishes=1&key=SECRET   -> Buku Tetamu tab as CSV (the page reads this)
//
// To publish a change: paste this file, Save, then
// Deploy > Manage deployments > pencil > Version: New version > Deploy.
// Saving alone does not change what guests hit.
//
// SECRET must equal RSVP_KEY in index.html. It is not a real secret - the page
// ships with it - so treat the guest list as readable by anyone holding the
// invitation link.

var SHEET_NAME = 'RSVP';          // RSVP replies only
var WISH_SHEET = 'Buku Tetamu';   // guestbook wishes only
var SECRET     = '$DanishVb09';                 // must match RSVP_KEY in index.html
var TIMEZONE   = 'Asia/Kuala_Lumpur';
var TITLE      = 'RSVP - Walimatul Urus Imas & Azam';

// The guestbook posts wishes with this marker in place of a phone number: a
// non-empty, never-matching value stops find_() from updating (and so wiping)
// an existing RSVP row that happens to carry the same name.
var GUESTBOOK_MARK = '0000000000';

var HEADERS = [
  'Masa (server)', 'Masa (pelawat)', 'Nama', 'Telefon', 'Status',
  'Dewasa', 'Kanak-kanak', 'Jumlah tetamu', 'Ucapan', 'Dijemput', 'Halaman'
];

// ---------------------------------------------------------------- POST

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    var body = parse_(e);

    // accept this page's field names and the shorter { name, attending, pax } style
    if (body.nama === undefined) body.nama = body.name;
    if (body.telefon === undefined) body.telefon = body.phone;
    if (body.ucapan === undefined) body.ucapan = body.message;
    if (body.status === undefined) {
      var a = body.attending;
      body.status = (a === true || a === 'true' || a === 'hadir' || a === 1 || a === '1') ? 'hadir' : 'tidak';
    }
    if (body.dewasa === undefined && body.pax !== undefined) body.dewasa = body.pax;

    if (SECRET && body.key !== SECRET) return json_({ ok: false, error: 'bad key' });
    if (String(body.honeypot || '').trim()) return json_({ ok: true, skipped: 'bot' });

    var nama = String(body.nama || '').trim().slice(0, 120);
    if (!nama) return json_({ ok: false, error: 'no name' });

    // a guestbook wish is a reply without attendance: never counted as a guest,
    // and never merged into an RSVP row
    var isWish = String(body.status || '').toLowerCase() === 'ucapan' ||
                 String(body.jenis || '').toLowerCase() === 'ucapan' ||
                 String(body.kind || '').toLowerCase() === 'guestbook';

    var hadir  = !isWish && body.status !== 'tidak';
    var dewasa = hadir ? num_(body.dewasa, 1) : 0;
    var kanak  = hadir ? num_(body.kanak_kanak, 0) : 0;
    var phone  = String(body.telefon || '').replace(/[^0-9+]/g, '').slice(0, 24);
    if (phone) phone = phone.charAt(0) + phone.slice(1);   // force text, keeps the leading 0
    if (phone === GUESTBOOK_MARK) phone = '';

    var book  = book_();
    var sheet = isWish ? wishSheet_(book.ss) : book.sh;
    var row = [
      new Date(),
      date_(body.masa),
      nama,
      phone,
      isWish ? 'Ucapan' : (hadir ? 'Hadir' : 'Tidak Hadir'),
      dewasa,
      kanak,
      dewasa + kanak,
      String(body.ucapan || '').slice(0, 1000),
      String(body.dijemput || '').slice(0, 120),
      String(body.halaman || '').slice(0, 300)
    ];

    var hit = isWish ? 0 : find_(sheet, nama, phone);
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

// ----------------------------------------------------------------- GET

function doGet(e) {
  var p = (e && e.parameter) || {};

  var wantsWishes = p.wishes || p.csv === 'wishes';
  if (wantsWishes || p.csv || p.format === 'csv') {
    if (SECRET && p.key !== SECRET) return text_('Unauthorized', 'text/plain');
    var sheet = wantsWishes ? wishSheet_(book_().ss) : book_().sh;
    return ContentService.createTextOutput(csv_(sheet))
      .setMimeType(ContentService.MimeType.CSV);
  }

  var book = book_();
  var rows = book.sh.getDataRange().getValues().slice(1)
    .filter(function (r) { return r[4] !== 'Ucapan'; });   // legacy wishes live elsewhere
  var hadir = 0, tidak = 0, orang = 0, kanak = 0;
  rows.forEach(function (r) {
    if (r[4] === 'Hadir') { hadir++; orang += num_(r[5], 0); kanak += num_(r[6], 0); }
    else if (r[4]) { tidak++; }
  });
  var wishRows = wishSheet_(book.ss).getDataRange().getValues().slice(1)
    .filter(function (r) { return String(r[8] || '').trim(); });
  var ucapan = wishRows.length;

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
        row_('Ucapan buku tetamu', ucapan) +
      '</table>' +
      '<p style="margin-top:24px"><a href="' + link + '" style="color:#78804B">Muat turun CSV</a></p>' +
    '</div>'
  );
}

// ------------------------------------------------------------- helpers

function book_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var ss = null;

  // 1. an explicitly configured spreadsheet always wins. This is how you move the
  //    endpoint to a new sheet (Project Settings > Script properties > edit
  //    SPREADSHEET_ID) without changing the deployment or the page.
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; }
    if (!ss) {
      // NEVER fall through to "create a new one" here: that is how a wrong or
      // unshared id silently becomes a mystery spreadsheet and overwrites the
      // setting. Fail loudly instead, so the dashboard shows the real problem.
      throw new Error('SPREADSHEET_ID is set to "' + id + '" but this script cannot open it. ' +
                      'Check the id (only the part between /d/ and /edit) and that the sheet ' +
                      'is shared as Editor with the account that deploys this script.');
    }
  }

  // 2. bound script (Extensions > Apps Script from inside a sheet) - use that sheet
  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (err) { ss = null; }
  }

  // 3. standalone script with nothing configured - create the spreadsheet once
  if (!ss) {
    ss = SpreadsheetApp.create(TITLE);
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }

  var sh = ensure_(ss, SHEET_NAME);

  // Phones must stay text: Sheets parses "0123456789" as a number and drops the
  // leading zero, which silently corrupts every Malaysian number on export.
  sheetText_(sh, 4);

  // tidy the default empty sheet that Google creates with a new spreadsheet
  var first = ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);

  return { ss: ss, sh: sh };
}

function wishSheet_(ss) {
  return ensure_(ss, WISH_SHEET);
}

// Creates the tab (and its header row) the first time it is needed.
function ensure_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  // A tab that already holds a formula (typically a =QUERY view) cannot be used as
  // storage: the rows would be appended under the view and the CSV would come out
  // with the wrong columns. Ask for a clean tab instead of corrupting it.
  var formula = '';
  try {
    var cell = sh.getRange(1, 1);
    formula = String((cell.getFormula && cell.getFormula()) || '');
  } catch (err) { formula = ''; }
  if (formula.charAt(0) === '=') {
    throw new Error('"' + name + '" has a formula in A1. Clear the whole tab ' +
                    '(select all, delete) so the guestbook can store its rows there.');
  }

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#78804b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, HEADERS.length, 150);
    sh.setColumnWidth(9, 320);
  }
  return sh;
}

function sheetText_(sh, column) {
  var rows = Math.max(sh.getMaxRows(), sh.getLastRow(), 2);
  sh.getRange(1, column, rows, 1).setNumberFormat('@');
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

function csv_(sh) {
  var values = sh.getDataRange().getValues();
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

// Run once from the editor: move wish rows that were written into the RSVP tab
// (before the guestbook got its own tab) over to "Buku Tetamu".
function migrateWishes() {
  var book = book_();
  var src = book.sh;
  var dst = wishSheet_(book.ss);
  var values = src.getDataRange().getValues();
  var moved = 0;
  for (var i = values.length - 1; i >= 1; i--) {          // bottom-up, so indexes stay valid
    if (values[i][4] !== 'Ucapan') continue;
    dst.appendRow(values[i]);
    src.deleteRow(i + 1);
    moved++;
  }
  Logger.log('Moved ' + moved + ' wish row(s) to "' + WISH_SHEET + '".');
}

// Optional: run this once from the editor to create the sheet + headers early.
function setup() {
  var book = book_();
  Logger.log('Spreadsheet: ' + book.ss.getUrl());
}
