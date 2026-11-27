#!/usr/bin/env node
/**
 * Test harness for apps-script/Code.gs.
 *
 * Runs the real Apps Script source against a minimal in-memory imitation of the
 * Google APIs it uses, so doPost/doGet behaviour can be checked without
 * deploying anything.
 *
 *   node apps-script/test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);

/* ---------------------------------------------------- fake SpreadsheetApp */

function makeSheet(name) {
  const rows = [];
  const formats = {};           // column index -> number format
  const asText = (col) => formats[col] === '@';
  const sheet = {
    name,
    _rows: rows,
    _formats: formats,
    getLastRow: () => rows.length,
    getMaxRows: () => Math.max(rows.length, 1000),
    getMaxColumns: () => 11,
    appendRow: (r) => { currentSheet = { _formats: formats }; rows.push(coerce(r)); },
    getRange: (r, c, nr, nc) => ({
      setValues: (vals) => {
        currentSheet = { _formats: formats };
        nr = nr || 1;
        nc = nc || (vals[0] ? vals[0].length : 1);
        for (let i = 0; i < vals.length; i++) {
          const target = rows[r - 1 + i] || (rows[r - 1 + i] = []);
          for (let j = 0; j < vals[i].length; j++) target[c - 1 + j] = vals[i][j];
        }
      },
      getValues: () => {
        nr = nr || 1;
        nc = nc || 1;
        const out = [];
        for (let i = 0; i < nr; i++) {
          const src = rows[r - 1 + i] || [];
          const line = [];
          for (let j = 0; j < nc; j++) line.push(src[c - 1 + j] === undefined ? '' : src[c - 1 + j]);
          out.push(line);
        }
        return out;
      },
      getFormula: () => {
        const f = sheet._formula;
        return f && f.r === r && f.c === c ? f.v : '';
      },
      setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
      setBackground: () => ({ setFontColor: () => {} }),
      setFontColor: () => {},
      setNote: () => {},
      setNumberFormat: (f) => {
        nr = nr || 1;
        for (let i = 0; i < nr; i++) formats[c - 1 + i] = f;
      }
    }),
    getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
    deleteRow: (n) => { rows.splice(n - 1, 1); },
    clear: () => { rows.length = 0; },
    setFormula: (r, c, v) => { sheet._formula = { r, c, v }; },
    setFrozenRows: () => {},
    setColumnWidth: () => {},
    setColumnWidths: () => {}
  };
  return sheet;
}

function makeSpreadsheet(title, id) {
  const sheets = [makeSheet('Sheet1')]; // Google creates one empty tab
  const ss = {
    _id: id || 'SS_' + title,
    _sheets: sheets,
    getId: () => ss._id,
    getUrl: () => 'https://docs.google.com/spreadsheets/d/' + ss._id,
    getSheetByName: (n) => sheets.find((s) => s.name === n) || null,
    insertSheet: (n) => { const s = makeSheet(n); sheets.push(s); return s; },
    getSheets: () => sheets.slice(),
    deleteSheet: (s) => { const i = sheets.indexOf(s); if (i >= 0) sheets.splice(i, 1); }
  };
  return ss;
}

// Sheets converts numeric-looking strings; a '@' (text) column keeps them as-is.
let currentSheet = null;

const store = { spreadsheets: {}, active: null, nextId: 1 };
const props = {};

const SpreadsheetApp = {
  create: (title) => {
    const ss = makeSpreadsheet(title, 'SS' + store.nextId++);
    store.spreadsheets[ss.getId()] = ss;
    return ss;
  },
  openById: (id) => {
    if (!store.spreadsheets[id]) throw new Error('no spreadsheet ' + id);
    return store.spreadsheets[id];
  },
  getActiveSpreadsheet: () => store.active
};

/* ------------------------------------------------------- other services  */

function coerce(row, startRow) {
  return row.map((v, i) => {
    if (typeof v !== 'string' || !/^[0-9]+$/.test(v)) return v;
    const col = i;
    const isText = currentSheet && currentSheet._formats[col] === '@';
    if (isText) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  });
}

const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null),
    setProperty: (k, v) => { props[k] = String(v); }
  })
};

let lockHeld = false;
const LockService = {
  getScriptLock: () => ({
    waitLock: () => { if (lockHeld) throw new Error('locked'); lockHeld = true; },
    releaseLock: () => { lockHeld = false; }
  })
};

const pad = (n) => String(n).padStart(2, '0');
const Utilities = {
  formatDate: (d, tz, fmt) => {
    if (fmt === 'yyyy-MM-dd HH:mm') {
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
             ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    if (fmt === 'dd/MM/yyyy HH:mm') {
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
             ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    if (fmt === 'yyyyMMdd-HHmm') {
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
             '-' + pad(d.getHours()) + pad(d.getMinutes());
    }
    return d.toISOString();
  }
};

const ContentService = {
  MimeType: { JSON: 'application/json', CSV: 'text/csv', TEXT: 'text/plain' },
  createTextOutput: (body) => ({
    _body: body,
    _mime: 'text/plain',
    setMimeType(m) { this._mime = m; return this; },
    getContent() { return this._body; },
    getMimeType() { return this._mime; }
  })
};

const HtmlService = {
  createHtmlOutput: (html) => ({ getContent: () => html })
};

const ScriptApp = {
  getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' })
};

const Logger = { log: () => {} };

/* ------------------------------------------------------------- run Code.gs */

const src = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const ctx = vm.createContext({
  SpreadsheetApp, PropertiesService, LockService, Utilities,
  ContentService, HtmlService, ScriptApp, Logger,
  console, Date, JSON, String, Number, parseInt, isNaN, encodeURIComponent, Error
});
vm.runInContext(src, ctx, { filename: 'Code.gs' });

const SECRET = vm.runInContext('SECRET', ctx);

/* ------------------------------------------------------------------ tests */

let pass = 0;
let fail = 0;
function check(label, cond, extra) {
  if (cond) {
    pass++;
    console.log('  ok   ' + label);
  } else {
    fail++;
    console.log('  FAIL ' + label + (extra ? '  -> ' + extra : ''));
  }
}

function post(payload) {
  const out = ctx.doPost({ postData: { contents: JSON.stringify(payload) } });
  const body = out.getContent();
  return { status: out.getMimeType(), body, json: JSON.parse(body) };
}

console.log('');
console.log('doPost - first submission creates the sheet');
const r1 = post({ key: SECRET, nama: 'Nurul Aisyah', telefon: '012-345 6789', status: 'hadir',
                  dewasa: '4', kanak_kanak: '2', ucapan: 'Barakallahu lakuma', dijemput: 'Encik Ahmad',
                  halaman: 'https://x.test/index.html?to=Encik+Ahmad' });
check('responds ok', r1.json.ok === true, r1.body);
check('reports row 2 (row 1 = headers)', r1.json.row === 2, r1.json.row);

const ss = Object.values(store.spreadsheets)[0];
const sh = ss.getSheetByName('RSVP');
check('spreadsheet created', !!ss);
check('RSVP tab created', !!sh);
check('leaves only the RSVP tab', ss.getSheets().length === 1,
      ss.getSheets().map((s) => s.name).join(','));
const header = sh._rows[0] || [];
check('header row written', header[2] === 'Nama' && header[7] === 'Jumlah tetamu',
      JSON.stringify(header));
const row = sh._rows[1] || [];
check('name stored', row[2] === 'Nurul Aisyah', row[2]);
check('phone normalised', row[3] === '0123456789', row[3]);
check('status stored', row[4] === 'Hadir', row[4]);
check('dewasa + kanak-kanak', row[5] === 4 && row[6] === 2, row[5] + '/' + row[6]);
check('total computed', row[7] === 6, row[7]);
check('?to= capture stored', row[9] === 'Encik Ahmad', row[9]);

// Malaysian numbers all start with 0; Sheets would strip it as a number
check('phone column is formatted as text', sh._formats[3] === '@', sh._formats[3]);
check('leading zero survives as a string',
      row[3] === '0123456789' && typeof row[3] === 'string',
      typeof row[3] + ':' + JSON.stringify(row[3]));

console.log('');
console.log('doPost - repeat reply updates instead of duplicating');
const r2 = post({ key: SECRET, nama: 'Nurul Aisyah', telefon: '0123456789', status: 'hadir',
                  dewasa: '3', kanak_kanak: '1' });
check('marked as update', r2.json.updated === true, r2.body);
check('still only one data row', sh.getLastRow() === 2, sh.getLastRow());
check('row overwritten with new pax', sh._rows[1][5] === 3 && sh._rows[1][7] === 4,
      sh._rows[1][5]);

console.log('');
console.log('doPost - not attending');
const r3 = post({ key: SECRET, nama: 'Siti Aminah binti Ali', status: 'tidak' });
check('accepted', r3.json.ok === true, r3.body);
check('pax zeroed for absentees', sh._rows[2][5] === 0 && sh._rows[2][7] === 0,
      sh._rows[2][5]);

console.log('');
console.log('doPost - guards');
check('wrong key rejected', post({ key: 'nope', nama: 'Hacker' }).json.ok === false);
check('missing name rejected', post({ key: SECRET, telefon: '011' }).json.ok === false);
check('honeypot silently dropped',
      post({ key: SECRET, nama: 'Bot', honeypot: 'x' }).json.skipped === 'bot');
check('bot did not add a row', sh.getLastRow() === 3, sh.getLastRow());

console.log('');
console.log('doPost - short payload { name, attending, pax, message }');
post({ key: SECRET, name: 'Hafiz bin Omar', attending: true, pax: 5, message: 'Tahniah' });
const alias = sh._rows[3] || [];
check('name mapped', alias[2] === 'Hafiz bin Omar', alias[2]);
check('attending:true -> Hadir', alias[4] === 'Hadir', alias[4]);
check('pax mapped to dewasa', alias[5] === 5, alias[5]);
check('message mapped to ucapan', alias[8] === 'Tahniah', alias[8]);

console.log('');
console.log('doGet - dashboard');
const dashHtml = ctx.doGet({ parameter: {} }).getContent();
check('shows the title', dashHtml.indexOf('Walimatul Urus') > -1);
check('counts 3 replies', dashHtml.indexOf('>3<') > -1, 'rows=' + (sh.getLastRow() - 1));
check('links the CSV', dashHtml.indexOf('?csv=1&key=') > -1);

console.log('');
console.log('doGet - CSV');
const csv1 = ctx.doGet({ parameter: { csv: '1', key: SECRET } });
const csvText = csv1.getContent();
check('CSV mime type', csv1.getMimeType() === 'text/csv', csv1.getMimeType());
check('starts with a BOM (Excel-safe)', csvText.charCodeAt(0) === 0xfeff);
check('header contains the expected columns',
      csvText.split(CR + LF)[0].indexOf('Nama,Telefon,Status') > -1);
check('CSV refused without the key',
      ctx.doGet({ parameter: { csv: '1', key: 'wrong' } }).getContent() === 'Unauthorized');

console.log('');
console.log('CSV - commas and quotes inside a guest reply');
post({ key: SECRET, nama: 'Aminah, "Kak Min"', status: 'hadir', dewasa: '1',
       ucapan: 'Moga bahagia, sentiasa dilindungi Allah SWT.' });
const csv2 = ctx.doGet({ parameter: { csv: '1', key: SECRET } }).getContent();
check('quotes a name containing a comma + quote',
      csv2.indexOf('"Aminah, ""Kak Min"""') > -1, 'not found in CSV');
check('quotes an ucapan containing a comma',
      csv2.indexOf('"Moga bahagia, sentiasa dilindungi Allah SWT."') > -1, 'not found');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { q = false; }
      else { field += c; }
    } else if (c === '"') { q = true; }
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === CR) { /* swallow */ }
    else if (c === LF) { row.push(field); rows.push(row); row = []; field = ''; }
    else { field += c; }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const parsed = parseCsv(csv2.replace(/^\uFEFF/, ''));
const headLen = parsed[0].length;
check('every CSV line has the same column count',
      parsed.every((r) => r.length === headLen), parsed.map((r) => r.length).join(','));
check('round-trips the quoted name',
      parsed.some((r) => r[2] === 'Aminah, "Kak Min"'), 'name not parsed back');

console.log('');
console.log('guestbook wishes go to their own tab');
const rsvpBefore = sh.getLastRow();
const hadirBefore = sh._rows.slice(1).filter((r) => r[4] === 'Hadir').length;
const gb1 = post({ key: SECRET, nama: 'Nurul Aisyah', telefon: '0000000000', status: 'ucapan',
                   dewasa: 0, kanak_kanak: 0, ucapan: 'Semoga bahagia hingga ke jannah!' });
check('wish accepted', gb1.json.ok === true, gb1.body);

const wishSh = ss.getSheetByName('Buku Tetamu');
check('the "Buku Tetamu" tab is created', !!wishSh, ss.getSheets().map((x) => x.name).join(','));
check('wish does NOT touch the RSVP tab', sh.getLastRow() === rsvpBefore,
      'rows ' + rsvpBefore + ' -> ' + sh.getLastRow());
check('wish is written to "Buku Tetamu"', wishSh.getLastRow() === 2, wishSh.getLastRow());

const wishHead = wishSh._rows[0];
check('the guestbook tab has its own columns',
      wishHead.join('|') === 'Masa|Nama|Ucapan|Dijemput', wishHead.join('|'));
const wishRow = wishSh._rows[1];
check('wish row is wish-shaped (4 columns, no phone/status/pax)',
      wishRow.length === 4, JSON.stringify(wishRow));
check('wish row stores the name', wishRow[1] === 'Nurul Aisyah', wishRow[1]);
check('wish row stores the message', wishRow[2] === 'Semoga bahagia hingga ke jannah!', wishRow[2]);

const gb2 = post({ key: SECRET, nama: 'Nurul Aisyah', telefon: '0000000000', status: 'ucapan',
                   ucapan: 'Second wish from the same guest' });
check('a second wish from the same person also appends',
      gb2.json.ok === true && wishSh.getLastRow() === 3, 'rows ' + wishSh.getLastRow());

console.log('');
console.log('two separate CSV feeds');
const wishCsv = ctx.doGet({ parameter: { wishes: '1', key: SECRET } }).getContent();
const rsvpCsv = ctx.doGet({ parameter: { csv: '1', key: SECRET } }).getContent();
check('?wishes=1 serves the wishes tab', wishCsv.indexOf('Second wish from the same guest') > -1);
check('?csv=1 does not leak wishes', rsvpCsv.indexOf('Second wish from the same guest') === -1);
check('?wishes=1 is refused without the key',
      ctx.doGet({ parameter: { wishes: '1', key: 'wrong' } }).getContent() === 'Unauthorized');
check('wishes CSV carries the wish header row',
      wishCsv.split(CR + LF)[0].indexOf('Masa,Nama,Ucapan,Dijemput') > -1,
      wishCsv.split(CR + LF)[0]);

console.log('');
console.log('dashboard separates wishes from attendance');
const dash2 = ctx.doGet({ parameter: {} }).getContent();
function dashNum(html, label) {
  const i = html.indexOf(label);
  if (i < 0) return -1;
  const m = html.slice(i).match(/>(\d+)</);
  return m ? +m[1] : -1;
}
check('dashboard labels wishes', dash2.indexOf('Ucapan buku tetamu') > -1);
check('wishes are not counted as hadir',
      dashNum(dash2, 'Hadir (bilangan jawapan)') === hadirBefore,
      'hadir=' + dashNum(dash2, 'Hadir (bilangan jawapan)') + ' expected ' + hadirBefore);
check('dashboard counts the two wishes',
      dashNum(dash2, 'Ucapan buku tetamu') === 2, dashNum(dash2, 'Ucapan buku tetamu'));

console.log('');
console.log('a tab holding a =QUERY view is refused as storage');
const viewTab = ss.getSheetByName('Buku Tetamu');
viewTab.setFormula(1, 1, '=QUERY(RSVP!A2:K, "select C, I", 0)');
let guarded = null;
try { ctx.wishSheet_(ss); } catch (e) { guarded = e; }
check('explains the formula problem', String(guarded).indexOf('has a formula in A1') > -1, String(guarded));
viewTab.setFormula(1, 1, '');

console.log('');
console.log('a guestbook tab with RSVP columns is refused, and resetWishes() repairs it');
const oldTab = ss.insertSheet('Buku Tetamu (old)');
oldTab.appendRow(['Masa (server)', 'Masa (pelawat)', 'Nama', 'Telefon', 'Status']);
let mismatch = null;
try { ctx.ensure_(ss, 'Buku Tetamu (old)', ['Masa', 'Nama', 'Ucapan', 'Dijemput']); }
catch (e) { mismatch = e; }
check('explains the column mismatch', String(mismatch).indexOf('different columns') > -1, String(mismatch));

console.log('');
console.log('migrateWishes() moves pre-split wishes out of the RSVP tab');
sh._rows.push(['2026-01-01 10:00', '', 'Old Guest', '', 'Ucapan', 0, 0, 0,
               'Wish written before the split', '', '']);
const rsvpWithLegacy = sh.getLastRow();
ctx.migrateWishes();
check('the legacy row left the RSVP tab', sh.getLastRow() === rsvpWithLegacy - 1,
      'rows ' + rsvpWithLegacy + ' -> ' + sh.getLastRow());
check('and landed in "Buku Tetamu" as a wish row',
      wishSh._rows[wishSh.getLastRow() - 1][2] === 'Wish written before the split',
      JSON.stringify(wishSh._rows[wishSh.getLastRow() - 1]));
check('dashboard now counts three wishes',
      dashNum(ctx.doGet({ parameter: {} }).getContent(), 'Ucapan buku tetamu') === 3);

console.log('');
console.log('bound-script mode (Extensions > Apps Script inside a sheet)');
const bound = makeSpreadsheet('Kad Kahwin', 'BOUND1');
store.spreadsheets.BOUND1 = bound;
store.active = bound;

// a freshly bound project has no SPREADSHEET_ID stored
const savedId = props.SPREADSHEET_ID;
delete props.SPREADSHEET_ID;
const r5 = post({ key: SECRET, nama: 'Zul bin Bakar', status: 'hadir', dewasa: '2' });
check('writes into the containing sheet', r5.json.ok === true, r5.body);
check('created the RSVP tab there', !!bound.getSheetByName('RSVP'));

console.log('');
console.log('a configured SPREADSHEET_ID overrides the bound sheet');
const chosen = makeSpreadsheet('Sheet baru', 'NEW2');
store.spreadsheets.NEW2 = chosen;
props.SPREADSHEET_ID = 'NEW2';
const r6 = post({ key: SECRET, nama: 'Aina binti Ali', status: 'hadir', dewasa: '1' });
check('writes into the configured spreadsheet', !!chosen.getSheetByName('RSVP'), r6.body);
const boundSheet = bound.getSheetByName('RSVP');
check('leaves the bound sheet untouched', boundSheet.getLastRow() === 2, boundSheet.getLastRow());
props.SPREADSHEET_ID = savedId;

console.log('');
console.log('a bad SPREADSHEET_ID fails loudly instead of creating a mystery sheet');
const sheetsBefore = Object.keys(store.spreadsheets).length;
props.SPREADSHEET_ID = 'NOT-A-REAL-ID';
const bad = post({ key: SECRET, nama: 'Ujian ID salah' });
check('reports the failure', bad.json.ok === false, bad.body);
check('names the offending id', /NOT-A-REAL-ID/.test(bad.json.error || ''), bad.json.error);
check('does not create another spreadsheet',
      Object.keys(store.spreadsheets).length === sheetsBefore,
      Object.keys(store.spreadsheets).length + ' vs ' + sheetsBefore);
check('does not overwrite the stored id', props.SPREADSHEET_ID === 'NOT-A-REAL-ID', props.SPREADSHEET_ID);
props.SPREADSHEET_ID = savedId;

console.log('');
console.log('resetWishes() rebuilds the guestbook tab with its own columns');
ctx.resetWishes();
const resetTab = ss.getSheetByName('Buku Tetamu');
check('header rewritten', resetTab._rows[0].join('|') === 'Masa|Nama|Ucapan|Dijemput',
      resetTab._rows[0].join('|'));
check('old rows cleared', resetTab.getLastRow() === 1, resetTab.getLastRow());

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
console.log('');
process.exit(fail ? 1 : 0);
