/* Pengaturan Kedai Pecahan.
   SCRIPT_URL : isi dengan URL Web App Google Apps Script (lihat README.md) agar semua hasil siswa
                masuk ke SATU file Excel/Google Sheet yang sama. Kosong = data tersimpan di peramban ini saja.
   PIN_HASH   : sidik jari (hash) PIN guru. PIN aslinya TIDAK disimpan di folder ini. */
var KP_CONFIG={
  SCRIPT_URL:'',
  PIN_SALT:'09794d66f62614dba0f20b88',
  PIN_HASH:'0ce0a14c6979a531f02e0298a70c63733f76ba400c0717b30838353eba4c011e',
  PIN_ITER:150000,
  KKM:75,        /* nilai minimal dinyatakan paham */
  CUKUP:55       /* di bawah ini = perlu bimbingan */
};
