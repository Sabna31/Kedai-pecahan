'use strict';
(function init() {
  $('#pico').innerHTML = picoSVG(64);
  $('#btnSnd').onclick = () => Snd.set(!Snd.on);
  $('#btnGuru').onclick = openGuruPin;
  $('#btnHelp').onclick = () => {
    S.m.bantuan++;
    const sc = SCENES[cur];
    logEv('bantuan', 'dibuka');
    if (sc && sc.help) sc.help(); else say('Ikuti petunjuk di layar ya, Koki Cilik! Tombol Berikutnya ada di pojok kanan bawah.');
  };
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  // Simpan otomatis bila tab ditutup di tengah pengerjaan, supaya siswa yang belum selesai tetap terlihat guru.
  const flush = () => {
    if (!S.name || S.name.length < 2) return;
    const rec = buildRecord(); upsertRecord(rec);
    if (!S.submitted && getSheetUrl()) sendToSheet(rec, true);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);

  go('pembuka');
})();
