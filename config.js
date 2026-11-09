'use strict';
/* ============================================================
   PENGATURAN KEDAI PECAHAN
   - SHEET_URL : isi dengan URL Web App Google Apps Script agar semua
                 hasil siswa dari banyak HP/laptop masuk ke 1 spreadsheet
                 yang sama (lihat README.md). Kosongkan jika dipakai offline.
   - PIN       : PIN untuk membuka Panduan Guru. Ganti sebelum dipakai!
   - THRESH    : ambang batas penentu "perlu bimbingan" / "kesulitan memakai web".
   ============================================================ */
const CONFIG = {
  SHEET_URL: '',
  PIN: '1234',
  THRESH: {
    l2SalahMax: 10,   // salah membuka kartu di Level 2 lebih dari ini = belum kuat pecahan senilai
    petunjukMin: 3,   // membuka Petunjuk >= ini = bingung cara memakai web
    bantuanMin: 8,    // menekan Bantuan >= ini = sering butuh bantuan
    terkunciMin: 3,   // menekan menu terkunci >= ini = bingung alur/navigasi
    easeMax: 2,       // penilaian kemudahan web <= ini (skala 1-5) = merasa sulit
    durasiMax: 45     // menit; lebih lama dari ini dianggap sangat lambat
  },
  /* Urutan kolom = urutan kolom di Excel & Google Sheet. Jangan diubah setelah data terkumpul. */
  COLUMNS: [
    {key:'id', label:'ID', w:14},
    {key:'waktu', label:'Waktu', w:19},
    {key:'nama', label:'Nama Siswa', w:22},
    {key:'kelas', label:'Kelas', w:8},
    {key:'status_selesai', label:'Status Pengerjaan', w:17},
    {key:'durasi_menit', label:'Durasi (menit)', w:11},
    {key:'skor', label:'Skor', w:8},
    {key:'persen', label:'Skor (%)', w:9},
    {key:'bintang', label:'Bintang', w:8},
    {key:'zona_selesai', label:'Zona Belajar Selesai (dari 3)', w:15},
    {key:'kuis_benar_pertama', label:'Kuis Benar Percobaan 1 (dari 3)', w:16},
    {key:'kuis_detail', label:'Kuis Q1 Q2 Q3', w:14},
    {key:'l1_benar_pertama', label:'Level 1 Benar Percobaan 1 (dari 5)', w:17},
    {key:'l1_salah', label:'Level 1 Jumlah Salah', w:12},
    {key:'l2_pasangan', label:'Level 2 Pasangan Ditemukan (dari 6)', w:17},
    {key:'l2_salah', label:'Level 2 Salah Buka Kartu', w:12},
    {key:'l3_benar_pertama', label:'Level 3 Benar Tanpa Salah/Petunjuk (dari 3)', w:19},
    {key:'l3_petunjuk', label:'Level 3 Petunjuk Dipakai', w:12},
    {key:'l3_salah', label:'Level 3 Jumlah Salah', w:12},
    {key:'miskonsepsi_penyebut', label:'Miskonsepsi: Menjumlahkan Penyebut (kali)', w:17},
    {key:'emoji', label:'Perasaan (Refleksi)', w:12},
    {key:'tersulit', label:'Bagian Paling Sulit', w:24},
    {key:'kemudahan_web', label:'Kemudahan Memakai Web (1-5)', w:14},
    {key:'klik_petunjuk', label:'Klik Petunjuk', w:9},
    {key:'klik_bantuan', label:'Klik Bantuan', w:9},
    {key:'klik_terkunci', label:'Klik Menu Terkunci', w:10},
    {key:'status_materi', label:'STATUS PEMAHAMAN', w:18},
    {key:'topik_bimbingan', label:'Topik yang Perlu Bimbingan', w:38},
    {key:'status_web', label:'STATUS PENGGUNAAN WEB', w:24},
    {key:'alasan_web', label:'Alasan Kesulitan Web', w:38},
    {key:'rekomendasi', label:'Rekomendasi Tindak Lanjut', w:55}
  ]
};
