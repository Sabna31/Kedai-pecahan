/**
 * Kedai Pecahan – penghubung ke Google Sheet (satu file untuk semua siswa).
 * Cara pakai: lihat README.md. PIN guru disimpan di Properti Skrip (GURU_PIN), bukan di kode ini.
 */
var SHEET = 'Hasil Siswa';

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return out({ ok: true, msg: 'Kedai Pecahan aktif' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    if (d.action === 'ping') return out({ ok: true });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (d.action === 'save') return out(save_(sh, d));
    if (d.action === 'list') return out(list_(sh, d));
    return out({ ok: false, error: 'aksi tidak dikenal' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function save_(sh, d) {
  var n = d.headers.length;
  var cur = sh.getRange(1, 1, 1, n).getValues()[0];
  if (cur.join('|') !== d.headers.join('|')) {
    sh.getRange(1, 1, 1, n).setValues([d.headers]).setFontWeight('bold').setBackground('#E5432D').setFontColor('#FFFFFF').setWrap(true);
    sh.setFrozenRows(1);
  }
  var last = sh.getLastRow(), row = 0;
  if (last > 1) {
    var ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(d.id)) { row = i + 2; break; }
    }
  }
  if (!row) row = Math.max(last, 1) + 1;
  // cegah rumus: teks yang diawali = + - @ dijadikan teks biasa
  var vals = d.values.map(function (v) {
    return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
  });
  sh.getRange(row, 1, 1, n).setValues([vals]);
  return { ok: true, row: row };
}

function list_(sh, d) {
  var pin = PropertiesService.getScriptProperties().getProperty('GURU_PIN');
  if (!pin) return { ok: false, error: 'GURU_PIN belum diatur di Properti Skrip' };
  if (String(d.pin) !== String(pin)) return { ok: false, error: 'PIN salah' };
  var last = sh.getLastRow();
  if (last < 1) return { ok: true, headers: [], rows: [] };
  var vals = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
  return { ok: true, headers: vals[0], rows: vals.slice(1) };
}
