'use strict';
/* ============ PANDUAN GURU (layar tersembunyi, dibuka dengan PIN) ============ */
function openGuruPin() {
  openModal(`<h3>🔒 Panduan Guru</h3><p>Masukkan PIN guru:</p>
    <input id="pin" class="input" type="password" inputmode="numeric" autocomplete="off" aria-label="PIN guru">
    <div class="center"><button class="btn" id="pinGo">Buka</button></div><div id="pinMsg" class="msg bad center"></div>`);
  const tryPin = () => {
    if ($('#pin').value === CONFIG.PIN) { closeModal(); go('guru'); }
    else { $('#pinMsg').textContent = 'PIN salah.'; }
  };
  $('#pinGo').onclick = tryPin;
  $('#pin').onkeydown = e => { if (e.key === 'Enter') tryPin(); };
  $('#pin').focus();
}

const TIPS = [
  { t: 'Miskonsepsi 1: 1/2 + 1/4 = 2/6 (penyebut ikut dijumlahkan)', f: 'Tunjukkan bahwa 2/6 lebih kecil daripada 1/2, padahal ditambah. Minta siswa memotong 1/2 pizza menjadi 2/4 lebih dulu, baru digabung dengan 1/4 (Zona 3 dan Level 3).' },
  { t: 'Miskonsepsi 2: penyebut lebih besar berarti nilai lebih besar (1/8 dianggap > 1/4)', f: 'Bandingkan dua batang sama panjang: makin banyak potongan, makin kecil tiap potongan. Pakai Zona 1 (geser slider penyebut) dan Zona 2.' },
  { t: 'Miskonsepsi 3: potongan tidak sama besar tetap disebut pecahan', f: 'Gunakan panel kontra contoh di Zona 1 dan misi pembuka (kue dibagi 4). Tanya: "Adilkah pembagiannya?"' },
  { t: 'Siswa kesulitan memakai web', f: 'Dampingi 1 sesi pertama: tunjukkan peta kedai, tombol Bantuan, dan tombol Berikutnya di pojok kanan bawah. Menu terkunci akan terbuka setelah zona dan kuis selesai.' }
];

SCENES.guru = {
  title: 'Panduan Guru',
  enter() {
    const back = (S.name && S.name.length >= 2) ? 'peta' : 'pembuka';
    let tab = 'rekap', filter = 'all';
    const stClass = v => ({ 'Paham': 'green', 'Cukup paham': 'yellow', 'Perlu bimbingan': 'red', 'Belum dinilai': 'gray', 'Lancar': 'green', 'Perlu dibantu memakai web': 'red', 'Selesai': 'green', 'Belum selesai': 'yellow' }[v] || 'gray');
    const view = () => {
      $('#stage').innerHTML = `<div class="card guru-wide" style="max-width:1050px">
        <div class="tabs">${[['rekap', '📊 Rekap Siswa'], ['kunci', '🔑 Kunci Jawaban'], ['tips', '💬 Tips Miskonsepsi'], ['data', '📁 Excel & Data']].map(t => `<button class="tab ${tab === t[0] ? 'sel' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
        <div id="gbody"></div></div>`;
      $$('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; view(); });
      ({ rekap: tabRekap, kunci: tabKunci, tips: tabTips, data: tabData })[tab]();
    };

    const tabRekap = () => {
      const all = loadRecords().sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)));
      const list = all.filter(r => filter === 'all' ? true : filter === 'materi' ? r.status_materi === 'Perlu bimbingan' : filter === 'web' ? r.status_web !== 'Lancar' : r.status_selesai !== 'Selesai');
      const cnt = f => all.filter(f).length;
      const avg = all.length ? Math.round(all.reduce((a, r) => a + (+r.persen || 0), 0) / all.length) : 0;
      $('#gbody').innerHTML = `<div class="tiles">
        <div class="tile"><small>Jumlah siswa</small><b>${all.length}</b></div>
        <div class="tile ${cnt(r => r.status_materi === 'Perlu bimbingan') ? 'warn' : ''}"><small>Perlu bimbingan materi</small><b>${cnt(r => r.status_materi === 'Perlu bimbingan')}</b></div>
        <div class="tile ${cnt(r => r.status_web !== 'Lancar') ? 'warn' : ''}"><small>Kesulitan memakai web</small><b>${cnt(r => r.status_web !== 'Lancar')}</b></div>
        <div class="tile"><small>Rata-rata skor</small><b>${avg}%</b></div></div>
        <label>Tampilkan: <select id="fl" class="input" style="display:inline-block;width:auto;margin:0 0 8px">
          <option value="all">Semua siswa</option><option value="materi">Perlu bimbingan materi</option><option value="web">Kesulitan memakai web</option><option value="belum">Belum selesai</option></select></label>
        <div class="tablewrap"><table class="rekap"><thead><tr><th>Nama</th><th>Kelas</th><th>Pengerjaan</th><th>Skor</th><th>Kuis</th><th>L1</th><th>L2 salah</th><th>L3</th><th>Pemahaman</th><th>Topik perlu bimbingan</th><th>Penggunaan web</th><th>Alasan</th></tr></thead><tbody>
        ${list.length ? list.map(r => `<tr><td><b>${esc(r.nama)}</b></td><td>${esc(r.kelas)}</td><td><span class="st ${stClass(r.status_selesai)}">${esc(r.status_selesai)}</span></td>
          <td>${esc(r.skor)} (${esc(r.persen)}%)</td><td>${esc(r.kuis_benar_pertama)}/3 ${esc(r.kuis_detail)}</td><td>${esc(r.l1_benar_pertama)}/5</td><td>${esc(r.l2_salah)}</td><td>${esc(r.l3_benar_pertama)}/3</td>
          <td><span class="st ${stClass(r.status_materi)}">${esc(r.status_materi)}</span></td><td>${esc(r.topik_bimbingan) || '-'}</td>
          <td><span class="st ${stClass(r.status_web)}">${esc(r.status_web)}</span></td><td>${esc(r.alasan_web) || '-'}</td></tr>`).join('')
          : '<tr><td colspan="12" class="center muted" style="padding:20px">Belum ada data. Hasil muncul setelah siswa memainkan dan menyimpan hasilnya.</td></tr>'}
        </tbody></table></div>`;
      $('#fl').value = filter; $('#fl').onchange = e => { filter = e.target.value; tabRekap(); };
    };

    const tabKunci = () => {
      $('#gbody').innerHTML = `
        <h3>Misi pembuka</h3><p>Dua garis potong harus tegak lurus (sudut 90°) agar kue terbagi 4 sama besar. Tiap orang mendapat 1/4.</p>
        <h3>Kuis cek paham</h3><ol>${QUIZ.map(q => `<li>${esc(q.prompt)} → <b>${q.ans}</b></li>`).join('')}</ol>
        <h3>Level 1: Pesanan Kilat (pizza 8 potong)</h3><p>3/8 = <b>3 potong</b>; 1/4 = <b>2 potong</b>; 1/2 = <b>4 potong</b>; 5/8 = <b>5 potong</b>; 3/4 = <b>6 potong</b>.</p>
        <h3>Level 2: Pasangan Senilai</h3><p>${PAIRS.map(p => `${p[0]}/${p[1]} = ${p[2]}/${p[3]}`).join('; ')}.</p>
        <h3>Level 3: Resep Ajaib</h3><ol>
          <li>1/3 + 1/6 = 2/6 + 1/6 = <b>3/6 = 1/2</b> cangkir gula</li>
          <li>1/4 + 3/8 = 2/8 + 3/8 = <b>5/8</b> cangkir tepung</li>
          <li>2/3 + 1/4 = 8/12 + 3/12 = <b>11/12</b> cangkir susu</li></ol>
        <h3>Zona 3: Coba sendiri</h3><p>1/3 + 1/6 = <b>3/6 (= 1/2)</b>. Jawaban 2/9 menandakan miskonsepsi menjumlahkan penyebut.</p>
        <h3>Sistem poin (maksimal ${MAX_SCORE})</h3><p>Misi 5; tiap zona 5; kuis 10 per soal (5 bila butuh percobaan ulang); Level 1: 10 per pesanan (5 bila ulang); Level 2: 10 per pasang; Level 3: 20 per resep (10 bila ada salah atau petunjuk). Bintang: 3 bila ≥ 80%, 2 bila ≥ 55%, selain itu 1.</p>
        <h3>Cara status ditentukan</h3><ul>
          <li><b>Pemahaman</b>: dinilai dari 3 topik (konsep, senilai, penjumlahan). Paham = ketiganya kuat; Cukup paham = 2 topik; Perlu bimbingan = 1 topik atau kurang.</li>
          <li><b>Penggunaan web</b>: "Perlu dibantu" bila siswa menilai web sulit (≤ ${CONFIG.THRESH.easeMax}), membuka Petunjuk ≥ ${CONFIG.THRESH.petunjukMin}x, menekan Bantuan ≥ ${CONFIG.THRESH.bantuanMin}x, menekan menu terkunci ≥ ${CONFIG.THRESH.terkunciMin}x, atau mengerjakan lebih dari ${CONFIG.THRESH.durasiMax} menit. Ambang bisa diubah di js/config.js.</li></ul>`;
    };

    const tabTips = () => {
      $('#gbody').innerHTML = TIPS.map(t => `<div class="tip"><b>${esc(t.t)}</b><p>${esc(t.f)}</p></div>`).join('');
    };

    const tabData = () => {
      const url = getSheetUrl();
      $('#gbody').innerHTML = `
        <h3>📗 Unduh Excel</h3>
        <p>File berisi 3 lembar: <b>Rekap Siswa</b> (warna merah = perlu bimbingan/dibantu), <b>Ringkasan Kelas</b>, dan <b>Detail Jawaban</b> (jejak tiap jawaban siswa).</p>
        <div class="btnrow" style="justify-content:flex-start"><button class="btn" id="bX">⬇️ Unduh Excel (.xlsx)</button>
          <button class="btn soft" id="bJ">💾 Cadangan (.json)</button><button class="btn soft" id="bI">📥 Gabung dari cadangan</button>
          <button class="btn soft" id="bDel">🗑️ Hapus semua data di perangkat ini</button></div><input type="file" id="fi" accept=".json" style="display:none">
        <h3>🔗 Sambungkan ke 1 Google Sheet bersama</h3>
        <p>Dengan ini hasil dari banyak HP/laptop siswa masuk ke satu spreadsheet yang sama (cara pembuatan URL ada di README.md). Status saat ini: <b>${url ? 'Terhubung ✅' : 'Belum terhubung (mode offline)'}</b></p>
        <input id="su" class="input" style="max-width:none" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(url)}" aria-label="URL Web App">
        <div class="btnrow" style="justify-content:flex-start"><button class="btn alt" id="bSave">Simpan URL</button><button class="btn soft" id="bSync">⬆️ Kirim semua data perangkat ini</button><button class="btn soft" id="bPull">⬇️ Tarik data dari Sheet</button></div>
        <div id="dmsg" class="msg"></div>`;
      const say2 = (t, ok = true) => { $('#dmsg').className = 'msg ' + (ok ? 'good' : 'bad'); $('#dmsg').textContent = t; };
      $('#bX').onclick = () => { exportXlsx(); say2('File Excel diunduh.'); };
      $('#bJ').onclick = () => { downloadBlob(new Blob([JSON.stringify(loadRecords(), null, 1)], { type: 'application/json' }), 'kedai-pecahan-cadangan.json'); say2('Cadangan diunduh.'); };
      $('#bI').onclick = () => $('#fi').click();
      $('#fi').onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { try { const arr = JSON.parse(rd.result); arr.forEach(upsertRecord); say2(arr.length + ' data digabung.'); } catch (x) { say2('File tidak valid.', false); } };
        rd.readAsText(f);
      };
      $('#bDel').onclick = () => { if (confirm('Hapus semua data siswa di perangkat ini? Unduh Excel dulu bila perlu.')) { saveRecords([]); say2('Data dihapus.'); } };
      $('#bSave').onclick = () => { setSheetUrl($('#su').value); say2('URL disimpan.'); tabData(); };
      $('#bSync').onclick = async () => { setSheetUrl($('#su').value); say2('Mengirim…'); const r = await syncAll(); say2(`Terkirim ${r.ok} dari ${r.total} data.`, r.ok === r.total); };
      $('#bPull').onclick = async () => { setSheetUrl($('#su').value); say2('Mengambil…'); try { const r = await pullFromSheet(); say2(`${r.rows} baris dibaca, ${r.added} siswa baru ditambahkan.`); } catch (x) { say2('Gagal: ' + x.message, false); } };
    };

    say('Ini layar khusus guru. Siswa tidak perlu membukanya.');
    setNext('Tutup Panduan Guru', () => go(back));
    view();
  }
};

/* ============ EKSPOR EXCEL ============ */
function exportXlsx() {
  const recs = loadRecords().sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
  const cols = CONFIG.COLUMNS;
  const style = (k, v) => {
    if (k === 'status_materi') return v === 'Paham' ? 3 : v === 'Cukup paham' ? 4 : v === 'Perlu bimbingan' ? 2 : 0;
    if (k === 'status_web') return v === 'Lancar' ? 3 : v ? 2 : 0;
    if (k === 'status_selesai') return v === 'Selesai' ? 3 : 4;
    if (k === 'topik_bimbingan' || k === 'alasan_web' || k === 'rekomendasi') return 5;
    return 0;
  };
  const rekap = [cols.map(c => ({ v: c.label, s: 1 }))];
  recs.forEach(r => rekap.push(cols.map(c => { const v = r[c.key]; const s = style(c.key, v); return s ? { v: v === undefined ? '' : v, s } : (v === undefined ? '' : v); })));

  const cnt = f => recs.filter(f).length;
  const names = f => recs.filter(f).map(r => r.nama + (r.kelas ? ' (' + r.kelas + ')' : '')).join(', ') || '-';
  const topikCnt = t => cnt(r => String(r.topik_bimbingan || '').includes(t));
  const ring = [
    [{ v: 'Ringkasan Kelas', s: 1 }, { v: 'Nilai', s: 1 }],
    ['Jumlah siswa', recs.length],
    ['Sudah selesai', cnt(r => r.status_selesai === 'Selesai')],
    ['Rata-rata skor (%)', recs.length ? Math.round(recs.reduce((a, r) => a + (+r.persen || 0), 0) / recs.length) : 0],
    ['Paham', cnt(r => r.status_materi === 'Paham')],
    ['Cukup paham', cnt(r => r.status_materi === 'Cukup paham')],
    ['Perlu bimbingan', cnt(r => r.status_materi === 'Perlu bimbingan')],
    ['Belum dinilai (kuis belum selesai)', cnt(r => r.status_materi === 'Belum dinilai')],
    ['Siswa perlu bimbingan materi', { v: names(r => r.status_materi === 'Perlu bimbingan'), s: 5 }],
    ['Siswa perlu dibantu memakai web', { v: names(r => r.status_web && r.status_web !== 'Lancar'), s: 5 }],
    ['Topik sulit: konsep pecahan', topikCnt('Konsep pecahan')],
    ['Topik sulit: pecahan senilai', topikCnt('Pecahan senilai')],
    ['Topik sulit: penjumlahan pecahan', topikCnt('Penjumlahan')],
    ['Siswa dengan miskonsepsi menjumlahkan penyebut', cnt(r => +r.miskonsepsi_penyebut > 0)]
  ];

  const det = [['Nama', 'Kelas', 'ID', 'Jam', 'Bagian', 'Butir', 'Hasil', 'Keterangan'].map(t => ({ v: t, s: 1 }))];
  recs.forEach(r => (r.log || []).forEach(l => det.push([r.nama, r.kelas, r.id, l[0], l[1], l[2], l[3], l[4]])));

  const blob = XlsxMini.build([
    { name: 'Rekap Siswa', rows: rekap, widths: cols.map(c => c.w), freeze: true, filter: true },
    { name: 'Ringkasan Kelas', rows: ring, widths: [46, 60] },
    { name: 'Detail Jawaban', rows: det, widths: [22, 8, 14, 10, 26, 30, 14, 34], freeze: true, filter: true }
  ]);
  const d = new Date(), p = x => String(x).padStart(2, '0');
  downloadBlob(blob, `Evaluasi-Kedai-Pecahan-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.xlsx`);
}
