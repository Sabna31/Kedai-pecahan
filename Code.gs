/**
 * Kedai Pecahan: penerima hasil siswa ke 1 Google Sheet bersama.
 * Cara pasang: lihat README.md bagian "Menyambungkan ke 1 Google Sheet".
 * Satu siswa = satu baris di lembar "Rekap Siswa" (data diperbarui, bukan dobel).
 * Jejak jawaban per butir masuk ke lembar "Detail Jawaban".
 */
var SHEET_REKAP = 'Rekap Siswa';
var SHEET_DETAIL = 'Detail Jawaban';

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var p = JSON.parse(e.postData.contents);
    if (p.action === 'save') save_(p);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet(e) {
  var sh = sheet_(SHEET_REKAP);
  var rows = [];
  if (sh.getLastRow() >= 2) rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  return json_({ ok: true, rows: rows });
}

function save_(p) {
  var rec = p.record, keys = p.columns, labels = p.labels;
  var sh = sheet_(SHEET_REKAP);
  if (sh.getLastRow() === 0) {
    sh.appendRow(labels);
    sh.getRange(1, 1, 1, labels.length).setFontWeight('bold').setBackground('#f28c28').setFontColor('#ffffff').setWrap(true);
    sh.setFrozenRows(1);
  }
  var values = keys.map(function (k) { return rec[k] === undefined ? '' : rec[k]; });
  var row = 0;
  if (sh.getLastRow() >= 2) {
    var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) { if (String(ids[i][0]) === String(rec.id)) { row = i + 2; break; } }
  }
  if (!row) row = sh.getLastRow() + 1;
  sh.getRange(row, 1, 1, values.length).setValues([values]);
  colorStatus_(sh, row, keys, rec);

  var dt = sheet_(SHEET_DETAIL);
  if (dt.getLastRow() === 0) {
    dt.appendRow(['ID', 'Nama', 'Kelas', 'Jam', 'Bagian', 'Butir', 'Hasil', 'Keterangan']);
    dt.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f28c28').setFontColor('#ffffff');
    dt.setFrozenRows(1);
  }
  for (var r = dt.getLastRow(); r >= 2; r--) { if (String(dt.getRange(r, 1).getValue()) === String(rec.id)) dt.deleteRow(r); }
  var log = rec.log || [];
  if (log.length) {
    var out = log.map(function (l) { return [rec.id, rec.nama, rec.kelas, l[0], l[1], l[2], l[3], l[4]]; });
    dt.getRange(dt.getLastRow() + 1, 1, out.length, 8).setValues(out);
  }
}

function colorStatus_(sh, row, keys, rec) {
  var red = '#ffc7ce', green = '#c6efce', yellow = '#ffeb9c';
  var m = keys.indexOf('status_materi') + 1, w = keys.indexOf('status_web') + 1;
  if (m > 0) sh.getRange(row, m).setBackground(rec.status_materi === 'Paham' ? green : rec.status_materi === 'Cukup paham' ? yellow : rec.status_materi === 'Perlu bimbingan' ? red : null);
  if (w > 0) sh.getRange(row, w).setBackground(rec.status_web === 'Lancar' ? green : red);
}
