/* Data tetap: kolom Excel, soal kuis, miskonsepsi, kunci jawaban. */

/* Urutan kolom di Excel / Google Sheet */
var FIELDS=[
 ['id','ID'],['upd','Diperbarui'],['nama','Nama'],['kelas','Kelas'],['absen','No. Absen'],
 ['z1','Zona 1 Konsep Pecahan'],['z2','Zona 2 Pecahan Senilai'],['z3','Zona 3 Penjumlahan'],
 ['q1','Kuis 1 (membaca pecahan)'],['q2','Kuis 2 (pecahan senilai)'],['q3','Kuis 3 (penjumlahan)'],['kuis','Skor Kuis (0-3)'],
 ['s1','Bintang Pesanan Kilat'],['s2','Bintang Pasangan Senilai'],['s3','Bintang Resep Ajaib'],['bintang','Total Bintang (0-9)'],
 ['nilai','Nilai Akhir (0-100)'],['lencana','Lencana Koki Pecahan'],['status','Status Pemahaman'],
 ['e1','Salah Pesanan Kilat (kali)'],['e2','Salah Pasang Kartu (kali)'],['e3','Salah Resep Ajaib (kali)'],
 ['m1','Miskonsepsi 1: Pembilang-penyebut tertukar (kali)'],['m2','Miskonsepsi 2: Penyebut ikut dijumlahkan (kali)'],
 ['m3','Miskonsepsi 3: Belum paham pecahan senilai (kali)'],['m4','Miskonsepsi 4: Penyebut belum disamakan (kali)'],
 ['hint','Petunjuk Dipakai (kali)'],['durasi','Durasi Aktif (menit)'],
 ['mood','Perasaan Belajar'],['ease','Kemudahan Memakai Web'],['hard','Bagian Tersulit'],
 ['kendala','Indikasi Kesulitan'],['saran','Saran untuk Guru']
];

var MISK={
 m1:{t:'Pembilang dan penyebut tertukar',
  ciri:'Menghitung potongan yang TIDAK diwarnai, membandingkan bagian dengan bagian (3/5), atau menulis 8/3 untuk 3 dari 8.',
  tips:['Selalu ucapkan: "… dari … potong yang sama besar". Angka bawah = seluruh potongan, angka atas = yang diambil.','Minta siswa mewarnai sendiri pecahan dari kertas yang dilipat, lalu menamai dengan kartu pembilang (merah) dan penyebut (hijau).','Beri pasangan soal: gambar sama, pecahan 3/8 dan 5/8, lalu bahas mana yang diwarnai.']},
 m2:{t:'Penyebut ikut dijumlahkan',
  ciri:'Menulis 1/2 + 1/4 = 2/6. Siswa memperlakukan pembilang dan penyebut sebagai dua bilangan terpisah.',
  tips:['Tunjukkan dengan gambar: 1/2 + 1/4 hasilnya pasti lebih besar dari 1/2, sedangkan 2/6 lebih kecil dari 1/2.','Tekankan: penyebut adalah NAMA ukuran potongan, jadi tidak ikut dijumlahkan. Contoh: 2 apel + 3 apel = 5 apel.','Gunakan langkah tetap: samakan penyebut, jumlahkan pembilang, sederhanakan.']},
 m3:{t:'Belum paham pecahan senilai',
  ciri:'Mengira 1/2 dan 2/4 berbeda, atau menganggap penyebut lebih besar berarti nilai lebih besar.',
  tips:['Gunakan batang pecahan sejajar dan garis tegak lurus (seperti Zona 2) sampai siswa melihat ujung batang sama.','Lipat kertas: setiap potongan dibelah dua, pembilang dan penyebut sama-sama dikali 2.','Buat permainan kartu "cari pasangan senilai" berulang dengan kertas.']},
 m4:{t:'Penyebut belum disamakan',
  ciri:'Menulis 1/2 + 1/4 = 2/4 (hanya menjumlah pembilang, penyebut memakai salah satu).',
  tips:['Tanyakan: "Apakah potongan 1/2 dan 1/4 sama besar?" Belum, jadi belum bisa dijumlahkan.','Ubah dulu 1/2 menjadi 2/4 dengan batang pecahan, baru jumlahkan.','Minta siswa menuliskan langkah "menyamakan penyebut" sebagai baris tersendiri.']},
 m0:{t:'Potongan tidak sama besar tetap dianggap pecahan',
  ciri:'Menyebut pizza yang dipotong tidak sama besar sebagai 1/3 atau 2/3 (tidak tercatat otomatis, diamati guru lewat Zona 1).',
  tips:['Gunakan contoh dan bukan-contoh (kartu "✗ Bukan pecahan" di Zona 1) dan minta siswa menjelaskan alasannya.','Minta siswa membagi kertas atau roti menjadi bagian yang benar-benar sama besar dengan melipat.']}
};

/* Kuis cek paham: 3 soal bergambar. dis = [teks, kode miskonsepsi] */
var KUIS=[
 {tipe:'pizza',n:8,sel:[0,1,2],q:'Pizza dipotong sama besar. Pecahan manakah yang menunjukkan bagian berwarna merah?',
  ans:'3/8',dis:[['5/8','m1'],['8/3','m1'],['3/5','m1']],
  why:'Ada 8 potong sama besar (penyebut) dan 3 potong berwarna (pembilang), jadi 3/8.'},
 {tipe:'bar',n:2,k:1,q:'Batang di atas menunjukkan 1/2. Pecahan manakah yang nilainya sama dengan 1/2?',
  ans:'2/4',dis:[['1/4','m3'],['2/3','m3'],['1/3','m3']],
  why:'Jika setiap potongan dibelah dua, 1/2 menjadi 2/4. Bentuknya beda, nilainya sama.'},
 {tipe:'plus',bars:[[1,2],[1,4]],q:'Berapa hasil dari gabungan kedua batang ini?',
  ans:'3/4',dis:[['2/6','m2'],['2/4','m4']],
  why:'Samakan dulu: 1/2 = 2/4. Lalu 2/4 + 1/4 = 3/4. Penyebut tidak ikut dijumlahkan.'}
];

/* Bank soal game (juga dipakai untuk kunci jawaban) */
var PR=[[[1,2],[2,4]],[[1,3],[2,6]],[[3,4],[6,8]],[[1,4],[2,8]]];
var QS=[[1,3,1,6],[1,2,1,4],[2,5,1,10]];
var E=[[1,2,1,4],[1,3,1,6]];
