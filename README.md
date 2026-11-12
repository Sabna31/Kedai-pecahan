# Kedai Pecahan: Web Game Edukasi Pecahan (Kelas V)

Buka `index.html` di peramban. Tidak perlu instalasi.

## Isi folder
| Berkas | Fungsi |
|---|---|
| `index.html` | Halaman utama |
| `style.css` | Tampilan |
| `config.js` | Pengaturan (URL Google Sheet, hash PIN, batas nilai) |
| `data.js` | Soal kuis, kolom Excel, miskonsepsi |
| `app.js` | Pembuka, zona belajar, kuis, game, penutup |
| `guru.js` | Panduan guru (PIN): rekap skor, kunci jawaban, tips miskonsepsi, unduh Excel |
| `storage.js`, `xlsx.js` | Simpan/kirim data dan pembuat file Excel |
| `Code.gs` | Penghubung ke Google Sheet (satu file untuk semua siswa) |

## Menghubungkan semua siswa ke SATU Excel (Google Sheet)
1. Buat Google Sheet baru, misalnya "Hasil Kedai Pecahan".
2. Menu **Ekstensi → Apps Script**, hapus isi, tempel isi `Code.gs`.
3. **Setelan proyek (ikon roda gigi) → Properti skrip → Tambah properti**: nama `GURU_PIN`, nilai = PIN guru (6 angka).
4. **Deploy → Deployment baru → Aplikasi web**: *Jalankan sebagai: Saya*, *Yang memiliki akses: Siapa saja*. Salin URL yang berakhiran `/exec`.
5. Tempel URL itu ke `SCRIPT_URL` di `config.js`.
6. Unggah folder ini ke hosting (GitHub Pages, Netlify, atau Google Drive/sekolah) dan bagikan tautannya ke siswa.

Setiap siswa akan mendapat satu baris di sheet **Hasil Siswa**, diperbarui otomatis setiap kali ia menyelesaikan zona, kuis, level, atau refleksi. Guru dapat membuka Google Sheet langsung (**File → Unduh → .xlsx**) atau memakai tombol **Unduh Excel** di Panduan Guru.

Tanpa `SCRIPT_URL`, data hanya tersimpan di peramban perangkat yang dipakai siswa.

## PIN guru
PIN tidak tertulis di folder ini, hanya sidik jarinya (`PIN_HASH`). Untuk mengganti: masuk **Masuk Guru → Pengaturan → Ganti PIN**, salin hash ke `config.js`, dan ubah `GURU_PIN` di Apps Script.
Catatan: perlindungan sepenuhnya baru kuat jika memakai Google Sheet, karena data hanya dikirim server setelah PIN benar.
