/* =========================================================
   Kedai Pecahan: Web Game Edukasi Pecahan (Kelas V)
   Logika Game Siswa: Pembuka, Peta, Zona Belajar, Kuis, Game, Penutup
   ========================================================= */

var A = document.getElementById('app');

/* ---------- Audio Synthesizer (Web Audio API) ---------- */
var Snd = {
  ctx: null, on: true,
  init: function() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone: function(f, d, type, vol, when) {
    if (!this.on || !this.ctx) return;
    d = d || 0.12; type = type || 'sine'; vol = vol || 0.08; when = when || 0;
    try {
      var t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + 0.02);
    } catch(e){}
  },
  sfx: function(k) {
    if (!this.on) return; this.init();
    var T = {
      pop: [[660, 0.08, 'sine', 0.09, 0]],
      click: [[820, 0.04, 'sine', 0.05, 0]],
      ok: [[523, 0.1, 'triangle', 0.1, 0], [659, 0.1, 'triangle', 0.1, 0.08], [784, 0.18, 'triangle', 0.1, 0.16]],
      bad: [[220, 0.16, 'sawtooth', 0.06, 0], [165, 0.22, 'sawtooth', 0.06, 0.12]],
      star: [[784, 0.1, 'triangle', 0.1, 0], [988, 0.1, 'triangle', 0.1, 0.1], [1319, 0.25, 'triangle', 0.12, 0.2]]
    }[k] || [];
    var self = this;
    T.forEach(function(a){ self.tone(a[0], a[1], a[2], a[3], a[4]); });
  },
  toggle: function() {
    this.on = !this.on;
    try { localStorage.setItem('kp_snd', this.on ? '1' : '0'); } catch(e){}
    this.sfx('click');
    render();
  }
};
try { if (localStorage.getItem('kp_snd') === '0') Snd.on = false; } catch(e){}

/* ---------- State Siswa ---------- */
var AVATARS = ['🧑‍🍳', '👩‍🍳', '🦊', '🐻', '🐱', '🐶', '🦁', '🐼'];

function newState() {
  return {
    id: '', nama: '', kelas: '', absen: '', avatar: '🧑‍🍳',
    done: {}, stars: {}, kuis: null,
    mis: { m1: 0, m2: 0, m3: 0, m4: 0 },
    e: { 1: 0, 2: 0, 3: 0 },
    hint: 0, mood: '', ease: '', hard: '', act: 0, last: 0, scr: 'home', note: ''
  };
}

var S = newState();
var Z1 = { n: 4, sel: new Set([0]) }, Z2 = { s: 0, cmp: false }, Z3 = { e: 0, st: 0 }, K = null, L1 = null, L2 = null, L3 = null, LAST = {};
var DEMO = false;
try { DEMO = sessionStorage.getItem('kp_demo') === '1'; } catch(e){}

/* ---------- Alat Bantu Matematika & Format ---------- */
var g = function(a, b) { return b ? g(b, a % b) : a; };
var sim = function(m, d) { var x = g(m, d); return [m / x, d / x]; };
var rnd = function(n) { return Math.floor(Math.random() * n); };
var shuf = function(a) {
  return a.map(function(x) { return [Math.random(), x]; })
          .sort(function(p, q) { return p[0] - q[0]; })
          .map(function(p) { return p[1]; });
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

var fr = function(a, b) {
  return '<span class="fr"><b class="nu">' + a + '</b><i></i><b class="de">' + b + '</b></span>';
};

var eq = function(n) { return Array(n).fill(360 / n); };

var bar = function(n, k) {
  var s = '';
  for (var i = 0; i < n; i++) s += '<span class="' + (i < k ? 'f' : '') + '"></span>';
  return '<div class="bar" role="img" aria-label="' + k + ' dari ' + n + ' bagian terisi">' + s + '</div>';
};

var pico = function(t) {
  return '<div class="pico"><div class="pi" aria-hidden="true">🍕</div><div class="bub">' + t + '</div></div>';
};

function pizza(ang, sel, click) {
  var c = 110, r = 100, t = 0, o = '';
  var pt = function(a) {
    var x = (a - 90) * Math.PI / 180;
    return [(c + r * Math.cos(x)).toFixed(1), (c + r * Math.sin(x)).toFixed(1)];
  };
  ang.forEach(function(w, i) {
    var p = pt(t), q = pt(t + w); t += w;
    o += '<path tabindex="' + (click ? 0 : -1) + '" role="' + (click ? 'button' : 'img') + '" aria-label="potongan ' + (i + 1) + (sel.has(i) ? ' diambil' : '') + '" class="sl' + (sel.has(i) ? ' on' : '') + '" d="M' + c + ' ' + c + 'L' + p[0] + ' ' + p[1] + 'A' + r + ' ' + r + ' 0 ' + (w > 180 ? 1 : 0) + ' 1 ' + q[0] + ' ' + q[1] + 'Z"' + (click ? ' onclick="' + click + '(' + i + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + click + '(' + i + ')}"' : '') + '/>';
  });
  return '<svg viewBox="0 0 220 220" class="pz">' + o + '</svg>';
}

/* ---------- Waktu Aktif, Simpan, Kirim ---------- */
function tick() {
  var n = Date.now();
  if (S.last && n - S.last < 60000) S.act += n - S.last;
  S.last = n;
}

function stars() {
  return Object.keys(S.stars).reduce(function(a, k) { return a + (S.stars[k] || 0); }, 0);
}

function persist() {
  if (S.id) Store.saveState(S.id, S);
}

function record() {
  var d = S.done, k = S.kuis, tot = stars(), ks = k ? k.a.filter(Boolean).length : 0;
  var nilai = Math.round(ks / 3 * 40 + tot / 9 * 60);
  var all = d[1] && d[2] && d[3] && k && S.stars[1] && S.stars[2] && S.stars[3];
  var status = !all ? 'Belum selesai' : nilai >= KP_CONFIG.KKM ? 'Paham' : nilai >= KP_CONFIG.CUKUP ? 'Perlu penguatan' : 'Perlu bimbingan';
  var mn = Math.round(S.act / 6000) / 10;
  var kend = [];
  if (S.mood === '😕') kend.push('Merasa belajar sulit');
  if (S.ease === '😕') kend.push('Sulit memakai web');
  if (S.hint >= 2) kend.push('Sering minta petunjuk (' + S.hint + 'x)');
  if (k && ks <= 1) kend.push('Skor kuis rendah (' + ks + '/3)');
  if (S.e[2] > 8) kend.push('Banyak salah pasang kartu');
  if (S.e[1] + S.e[3] >= 4) kend.push('Banyak jawaban salah di game');
  if (mn >= 40) kend.push('Waktu pengerjaan lama (' + mn + ' mnt)');
  if (!all && mn >= 15) kend.push('Belum selesai setelah ' + mn + ' mnt');
  var top = Object.keys(S.mis).filter(function(m) { return S.mis[m] > 0; })
    .sort(function(a, b) { return S.mis[b] - S.mis[a]; }).slice(0, 2)
    .map(function(m) { return MISK[m].t + ' (' + S.mis[m] + 'x)'; });
  var saran = !all ? 'Belum menyelesaikan seluruh kegiatan; dampingi dan cek kendala.' : top.length ? 'Prioritaskan: ' + top.join('; ') + '.' : 'Tidak ada miskonsepsi menonjol.';
  if (all && top.length && status === 'Paham') saran = 'Sudah paham; ulas singkat: ' + top.join('; ') + '.';
  var ya = function(x) { return x ? 'Selesai' : 'Belum'; };
  var qa = function(i) { return k ? (k.a[i] ? 'Benar' : 'Salah') : '-'; };
  return {
    id: S.id, upd: new Date().toLocaleString('id-ID', { hour12: false }),
    nama: S.nama, kelas: S.kelas, absen: +S.absen,
    z1: ya(d[1]), z2: ya(d[2]), z3: ya(d[3]),
    q1: qa(0), q2: qa(1), q3: qa(2), kuis: k ? ks : '',
    s1: S.stars[1] || 0, s2: S.stars[2] || 0, s3: S.stars[3] || 0, bintang: tot,
    nilai: nilai, lencana: tot >= 7 ? 'Ya' : 'Belum', status: status,
    e1: S.e[1], e2: S.e[2], e3: S.e[3],
    m1: S.mis.m1, m2: S.mis.m2, m3: S.mis.m3, m4: S.mis.m4,
    hint: S.hint, durasi: mn,
    mood: S.mood || '-', ease: S.ease || '-', hard: S.hard || '-',
    kendala: kend.join('; ') || '-', saran: saran
  };
}

function sync() {
  persist();
  Store.save(record());
}

/* ---------- Navigasi ---------- */
function go(s) {
  tick();
  S.scr = s;
  S.note = '';
  Snd.sfx('click');
  render();
  window.scrollTo(0, 0);
}

function syncBadge() {
  var m = {
    off: ['💾', 'Tersimpan di perangkat ini'],
    ok: ['☁️', 'Terkirim ke guru'],
    wait: ['⏳', 'Mengirim…'],
    err: ['⚠️', 'Belum terkirim, akan dicoba lagi']
  }[Store.status()] || ['💾', 'Tersimpan lokal'];
  return '<button class="ghost sy" onclick="Store.retry()" title="' + m[1] + '" aria-label="' + m[1] + '">' + m[0] + '</button>';
}

Store.onStatus(function() {
  var e = document.getElementById('syb');
  if (e) e.innerHTML = syncBadge();
});

function hd() {
  var userChip = S.nama ? '<div class="hdr-user"><span>' + (S.avatar || '🧑‍🍳') + '</span> <b>' + esc(S.nama) + '</b> <small>(' + esc(S.kelas) + ')</small></div>' : '';
  return '<header>' +
    '<button class="brand" onclick="go(\'map\')">🍕 <span>Kedai Pecahan</span></button>' +
    userChip +
    '<div class="hdr-right">' +
      (S.scr !== 'map' ? '<button class="ghost sm" onclick="go(\'map\')">🗺️ Peta</button>' : '') +
      '<button class="ghost sm" onclick="Snd.toggle()" title="Suara: ' + (Snd.on ? 'Nyala' : 'Mati') + '" aria-label="Suara">' + (Snd.on ? '🔊' : '🔇') + '</button>' +
      '<span id="syb">' + syncBadge() + '</span>' +
      '<span class="star-badge" title="Total bintang">⭐ <b>' + stars() + '</b>/9</span>' +
    '</div>' +
  '</header>';
}

function render() {
  tick();
  var f = {
    home: home, map: map,
    z1: z1, z2: z2, z3: z3,
    kuis: kuis,
    l1: l1, l2: l2, l3: l3,
    fin: fin, res: res,
    guru: guruScreen
  }[S.scr] || home;
  A.className = S.scr === 'guru' ? 'wide' : '';
  A.innerHTML = (S.scr === 'home' || S.scr === 'guru' ? '' : hd()) + f();
}

function finish(l, st, msg) {
  S.stars[l] = Math.max(S.stars[l] || 0, st);
  LAST = { l: l, st: st, msg: msg };
  Snd.sfx('star');
  sync();
  go('fin');
}

var unlockKuis = function() { return DEMO || (S.done[1] && S.done[2] && S.done[3]); };
var unlockGame = function() { return DEMO || !!S.kuis; };

/* ================= 1. PEMBUKA (HOME) ================= */
function setAvatar(av) {
  S.avatar = av;
  Snd.sfx('pop');
  render();
}

function home() {
  var curAv = S.avatar || '🧑‍🍳';
  var avHtml = AVATARS.map(function(av) {
    return '<button type="button" class="avatar-btn' + (curAv === av ? ' sel' : '') + '" onclick="setAvatar(\'' + av + '\')" aria-label="Avatar ' + av + '">' + av + '</button>';
  }).join('');

  return '<div class="card c">' +
    '<div class="logo">🍕</div>' +
    '<h1>Kedai Pecahan</h1>' +
    '<p class="mut">Belajar pecahan sambil jadi koki cilik! Matematika Kelas V SD.</p>' +
    pico('Halo, Koki Cilik! Pilih avatarmu, lalu ketik nama dan kelas untuk mulai!') +
    '<div class="form">' +
      '<label>Pilih Karakter Koki</label>' +
      '<div class="avatar-grid">' + avHtml + '</div>' +
      '<label for="nm">Nama Lengkap</label>' +
      '<input type="text" id="nm" maxlength="30" placeholder="mis. Budi Santoso" autocomplete="off" value="' + esc(S.nama) + '" onkeydown="if(event.key===\'Enter\')document.getElementById(\'kl\').focus()">' +
      '<div class="two">' +
        '<div>' +
          '<label for="kl">Kelas</label>' +
          '<input type="text" id="kl" maxlength="6" placeholder="mis. 5A" autocomplete="off" value="' + esc(S.kelas) + '" onkeydown="if(event.key===\'Enter\')document.getElementById(\'ab\').focus()">' +
        '</div>' +
        '<div>' +
          '<label for="ab">No. Absen</label>' +
          '<input type="text" id="ab" inputmode="numeric" maxlength="2" placeholder="mis. 12" autocomplete="off" value="' + esc(S.absen) + '" onkeydown="if(event.key===\'Enter\')mulai()">' +
        '</div>' +
      '</div>' +
    '</div>' +
    (S.note ? '<p class="bad" role="alert">' + S.note + '</p>' : '') +
    '<div class="row">' +
      '<button class="btn big" onclick="mulai()">Mulai Petualangan 🚀</button>' +
    '</div>' +
    '<p class="mut xs">Hasil belajarmu tersimpan otomatis dan dapat diperiksa oleh bu/pak guru.</p>' +
  '</div>' +
  '<div class="c">' +
    '<button class="lnk" onclick="S.scr=\'guru\';Snd.sfx(\'click\');render()">🔒 Masuk Panel Guru</button>' +
  '</div>';
}

function mulai() {
  var v = function(i) { return (document.getElementById(i) ? document.getElementById(i).value : '').trim(); };
  var n = v('nm'), k = v('kl').toUpperCase().replace(/\s+/g, ''), a = v('ab').replace(/\D/g, '');
  S.nama = n; S.kelas = k; S.absen = a;
  if (n.length < 2 || !k || !a) {
    S.note = 'Isi nama lengkap, kelas, dan nomor absen dulu ya!';
    Snd.sfx('bad');
    return render();
  }
  var id = (n.toLowerCase().replace(/\s+/g, ' ') + '|' + k + '|' + (+a));
  var sv = Store.loadState(id);
  var curAvatar = S.avatar || '🧑‍🍳';
  S = sv ? Object.assign(newState(), sv) : Object.assign(newState(), { nama: n, kelas: k, absen: a, avatar: curAvatar });
  S.id = id; S.nama = n; S.kelas = k; S.absen = a; S.avatar = sv && sv.avatar ? sv.avatar : curAvatar;
  S.last = Date.now();
  sync();
  Snd.sfx('ok');
  go('map');
}

/* ================= 2. PETA PETUALANGAN (MAP) ================= */
function map() {
  var zDoneCount = [1, 2, 3].filter(function(z) { return S.done[z]; }).length;
  var ku = unlockKuis(), gm = unlockGame();
  var totStars = stars();

  var zc = function(z, t, d, icon) {
    var isDone = S.done[z];
    return '<button class="tile' + (isDone ? ' ok' : '') + '" onclick="go(\'z' + z + '\')">' +
      '<span class="tile-icon">' + (isDone ? '✅' : icon) + '</span>' +
      '<div class="tile-text"><b>' + t + '</b>' +
      '<small>' + d + '</small></div>' +
      '<em>' + (isDone ? 'Sudah dipelajari' : 'Mulai ➔') + '</em>' +
    '</button>';
  };

  var kt = '<button class="tile' + (S.kuis ? ' ok' : ku ? '' : ' lock') + '" onclick="' +
    (ku ? 'go(\'kuis\')' : 'S.note=\'Selesaikan 3 Zona Belajar dulu untuk membuka Kuis Cek Paham!\';Snd.sfx(\'bad\');render()') + '">' +
    '<span class="tile-icon">' + (S.kuis ? '✅' : ku ? '📝' : '🔒') + '</span>' +
    '<div class="tile-text"><b>Kuis Cek Paham</b>' +
    '<small>3 soal bergambar</small></div>' +
    '<em>' + (S.kuis ? 'Benar ' + S.kuis.a.filter(Boolean).length + '/3' : ku ? 'Buka Kuis ➔' : 'Terkunci') + '</em>' +
  '</button>';

  var lc = function(l, t, d, icon) {
    var st = S.stars[l] || 0;
    return '<button class="tile' + (st > 0 ? ' ok' : gm ? '' : ' lock') + '" onclick="' +
      (gm ? 'go(\'l' + l + '\')' : 'S.note=\'Selesaikan Kuis Cek Paham dulu untuk menyalakan Oven Game!\';Snd.sfx(\'bad\');render()') + '">' +
      '<span class="tile-icon">' + (gm ? icon : '🔒') + '</span>' +
      '<div class="tile-text"><b>' + t + '</b>' +
      '<small>' + d + '</small></div>' +
      '<em>' + (gm ? (st ? '⭐'.repeat(st) : 'Mulai Main ➔') : 'Terkunci') + '</em>' +
    '</button>';
  };

  return pico('Halo, <b>' + esc(S.nama) + '</b>! ' + (totStars >= 7 ? '🎉 Hebat! Kamu sudah mendapat lencana Koki Pecahan!' : 'Selesaikan zona belajar, kuis, lalu layani pelanggan untuk kumpulkan ⭐!')) +
    '<div class="card mis">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
        '<b>🎯 Target Misi Koki Cilik</b>' +
        '<span class="chip ' + (totStars >= 7 ? 'gn' : 'yl') + '">⭐ ' + totStars + ' / 9 Bintang</span>' +
      '</div>' +
      '<ol>' +
        '<li><b>Pelajari 3 Zona di Dapur</b> (' + zDoneCount + '/3 selesai)</li>' +
        '<li><b>Jawab Kuis Cek Paham</b> (' + (S.kuis ? '✅ Selesai: ' + S.kuis.a.filter(Boolean).length + '/3 benar' : ku ? '🔓 Terbuka' : '🔒 Belum terbuka') + ')</li>' +
        '<li><b>Nyalakan Oven Game (3 Level)</b> (' + (gm ? '🔓 Terbuka' : '🔒 Kuis dulu') + ')</li>' +
        '<li><b>Kumpulkan minimal 7 ⭐</b> untuk raih lencana <b>Koki Pecahan</b> 🏅</li>' +
      '</ol>' +
    '</div>' +
    (S.note ? '<p class="bad c" role="alert">' + S.note + '</p>' : '') +
    '<h2>🍳 1. Zona Belajar Dapur</h2>' +
    '<div class="grid">' +
      zc(1, 'Zona 1: Konsep', 'Pembilang & Penyebut', '🍕') +
      zc(2, 'Zona 2: Senilai', 'Beda bentuk, nilai sama', '📏') +
      zc(3, 'Zona 3: Menjumlah', 'Samakan penyebut dulu', '➕') +
    '</div>' +
    '<h2>📝 2. Kuis Cek Paham</h2>' +
    '<div class="grid">' + kt + '</div>' +
    '<h2>🔥 3. Level Oven Game</h2>' +
    '<div class="grid">' +
      lc(1, 'Pesanan Kilat', 'Potong & layani pizza', '🧾') +
      lc(2, 'Pasangan Senilai', 'Cocokkan kartu senilai', '🃏') +
      lc(3, 'Resep Ajaib', 'Soal cerita penjumlahan', '📖') +
    '</div>' +
    '<div class="row">' +
      '<button class="btn g big" onclick="go(\'res\')">🏆 Lihat Hasil Belajar & Refleksi</button>' +
      '<button class="ghost" onclick="gantiPemain()">🔄 Ganti Pemain</button>' +
    '</div>';
}

function zdone(z, nextScr) {
  S.done[z] = true;
  Snd.sfx('ok');
  sync();
  if (nextScr) go(nextScr);
  else go('map');
}

/* ================= 3. ZONA BELAJAR ================= */
/* ---------- ZONA 1 ---------- */
function z1box() {
  return pizza(eq(Z1.n), Z1.sel, 'z1t') +
    '<div class="c big">' + fr(Z1.sel.size, Z1.n) + '</div>' +
    '<p class="c">Kamu mengambil <b class="nu">' + Z1.sel.size + '</b> dari total <b class="de">' + Z1.n + '</b> potong yang sama besar.</p>';
}

function z1n(v) {
  Z1.n = +v;
  Z1.sel = new Set([...Z1.sel].filter(function(i) { return i < Z1.n; }));
  if (!Z1.sel.size && Z1.n > 0) Z1.sel.add(0);
  Snd.sfx('click');
  document.getElementById('zn').textContent = Z1.n;
  document.getElementById('z1b').innerHTML = z1box();
}

function z1t(i) {
  Z1.sel.has(i) ? Z1.sel.delete(i) : Z1.sel.add(i);
  Snd.sfx('pop');
  document.getElementById('z1b').innerHTML = z1box();
}

function z1() {
  return pico('Penyebut (angka bawah) = jumlah <b>seluruh potongan sama besar</b>. Pembilang (angka atas) = <b>potongan yang diambil</b>.') +
    '<div class="card">' +
      '<h2>Eksplorasi Potongan Pizza</h2>' +
      '<label for="rg">Geser jumlah potongan pizza: <b id="zn" class="chip yl">' + Z1.n + ' potong</b></label>' +
      '<input id="rg" type="range" min="2" max="8" value="' + Z1.n + '" oninput="z1n(this.value)">' +
      '<p class="mut sm c">Ketuk potongan pizza di bawah untuk mengambil atau mengembalikannya!</p>' +
      '<div id="z1b">' + z1box() + '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h3><span class="bad">✗</span> Mengapa ini BUKAN pecahan?</h3>' +
      pizza([200, 100, 60], new Set([0]), null) +
      '<p class="c">Potongannya <b>tidak sama besar</b>! Syarat pecahan adalah setiap bagian wajib berukuran sama.</p>' +
    '</div>' +
    '<div class="row">' +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
      '<button class="btn g" onclick="zdone(1, \'z2\')">Selesai & Lanjut ke Zona 2 ➔</button>' +
    '</div>';
}

/* ---------- ZONA 2 ---------- */
var SETS = [[[1, 2], [2, 4], [4, 8]], [[1, 3], [2, 6], [3, 9]]];

function z2() {
  var st = SETS[Z2.s], pos = (st[0][0] / st[0][1]) * 100;
  return pico('Perhatikan batang-batang di bawah! Walaupun jumlah potongannya berbeda, apakah nilainya sama?') +
    '<div class="card">' +
      '<h2>Bandingkan Pecahan Senilai</h2>' +
      '<div class="row" style="margin-top:0">' +
        '<button class="ghost' + (Z2.s === 0 ? ' sel' : '') + '" onclick="Z2.s=0;Z2.cmp=false;Snd.sfx(\'click\');render()">Set 1/2 (1/2, 2/4, 4/8)</button>' +
        '<button class="ghost' + (Z2.s === 1 ? ' sel' : '') + '" onclick="Z2.s=1;Z2.cmp=false;Snd.sfx(\'click\');render()">Set 1/3 (1/3, 2/6, 3/9)</button>' +
      '</div>' +
      '<div class="bw">' +
        st.map(function(p) {
          return '<div class="lab">' + fr(p[0], p[1]) + '</div>' + bar(p[1], p[0]);
        }).join('') +
        (Z2.cmp ? '<u style="left:calc(' + pos + '% + 0px)"></u>' : '') +
      '</div>' +
      '<div class="row">' +
        '<button class="btn" onclick="Z2.cmp=!Z2.cmp;Snd.sfx(\'click\');render()">' +
          (Z2.cmp ? '🙈 Sembunyikan Garis Pembantu' : '📏 Pasang Garis Pembantu') +
        '</button>' +
      '</div>' +
      (Z2.cmp ? '<div class="card highlight c"><b class="good">Semua batang berakhir di garis yang persis sama!</b><br>Artinya: ' + st.map(function(p) { return p[0] + '/' + p[1]; }).join(' = ') + '. Walaupun bentuknya berbeda, nilainya sama besar.</div>' : '') +
    '</div>' +
    '<div class="row">' +
      '<button class="ghost" onclick="go(\'z1\')">← Zona 1</button>' +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Peta</button>' +
      '<button class="btn g" onclick="zdone(2, \'z3\')">Selesai & Lanjut ke Zona 3 ➔</button>' +
    '</div>';
}

/* ---------- ZONA 3 ---------- */
function z3() {
  var a = E[Z3.e][0], b = E[Z3.e][1], c = E[Z3.e][2], d = E[Z3.e][3];
  var m = (a * d) / b, s = sim(m + c, d), t = Z3.st, x = '';

  if (t === 0) {
    x = '<div class="lab">' + fr(a, b) + '</div>' + bar(b, a) +
        '<div class="lab">' + fr(c, d) + '</div>' + bar(d, c) +
        '<p class="bad">⚠️ Potongannya berukuran beda (' + b + ' dan ' + d + '), jadi belum bisa langsung dijumlahkan!</p>';
  } else if (t === 1) {
    x = '<div class="lab">' + fr(a, b) + ' diubah jadi ' + fr(m, d) + '</div>' + bar(d, m) +
        '<div class="lab">' + fr(c, d) + '</div>' + bar(d, c) +
        '<p class="good">✅ Sekarang kedua pecahan punya ukuran potongan yang sama (penyebutnya sama-sama ' + d + ').</p>';
  } else if (t === 2) {
    x = '<div class="lab">' + fr(m, d) + ' + ' + fr(c, d) + ' = ' + fr(m + c, d) + (s[1] !== d ? ' = ' + fr(s[0], s[1]) : '') + '</div>' +
        bar(d, m + c) +
        '<p class="good">🎉 Jumlahkan pembilangnya: ' + m + ' + ' + c + ' = ' + (m + c) + '. Penyebut TETAP ' + d + ' (tidak ikut dijumlahkan)!</p>';
  } else {
    x = '<div class="card highlight">' +
      '<p><span class="bad">❌ Mengapa bukan ' + fr(a + c, b + d) + '?</span></p>' +
      '<p>Karena ' + (a + c) + '/' + (b + d) + ' justru lebih kecil dari ' + a + '/' + b + ', padahal kita sedang menambah bahan!</p>' +
      '<p class="bold">Ingat aturan koki: Penyebut adalah nama ukuran potongan, jadi TIDAK PERNAH ikut dijumlahkan!</p>' +
    '</div>';
  }

  return pico('Yuk belajar menjumlahkan pecahan: ' + a + '/' + b + ' + ' + c + '/' + d + ' langkah demi langkah.') +
    '<div class="card">' +
      '<h2>Langkah Menjumlahkan Pecahan</h2>' +
      '<div class="row" style="margin-top:0">' +
        '<button class="ghost' + (Z3.e === 0 ? ' sel' : '') + '" onclick="Z3={e:0,st:0};Snd.sfx(\'click\');render()">Resep A: 1/2 + 1/4</button>' +
        '<button class="ghost' + (Z3.e === 1 ? ' sel' : '') + '" onclick="Z3={e:1,st:0};Snd.sfx(\'click\');render()">Resep B: 1/3 + 1/6</button>' +
      '</div>' +
      '<div style="margin:12px 0"><span class="chip yl">Langkah ' + (t + 1) + ' dari 4</span></div>' +
      x +
      '<div class="row">' +
        (t > 0 ? '<button class="ghost" onclick="Z3.st--;Snd.sfx(\'click\');render()">← Langkah Sebelumnya</button>' : '') +
        (t < 3 ? '<button class="btn" onclick="Z3.st++;Snd.sfx(\'click\');render()">Langkah Berikutnya ➔</button>' : '<button class="btn g big" onclick="zdone(3, \'kuis\')">Selesai Zona 3 & Ke Kuis ➔</button>') +
        '<button class="ghost" onclick="Z3.st=0;Snd.sfx(\'click\');render()">🔄 Ulangi</button>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<button class="ghost" onclick="go(\'z2\')">← Zona 2</button>' +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
    '</div>';
}

/* ================= 4. KUIS CEK PAHAM ================= */
function kuisPic(q) {
  if (q.tipe === 'pizza') return pizza(eq(q.n), new Set(q.sel), null);
  if (q.tipe === 'bar') return '<div class="bw">' + bar(q.n, q.k) + '</div>';
  return q.bars.map(function(p, i) {
    return (i ? '<div class="plus" aria-hidden="true">+</div>' : '') +
      '<div class="lab">' + fr(p[0], p[1]) + '</div>' + bar(p[1], p[0]);
  }).join('');
}

function kuis() {
  if (S.kuis && !K) return kuisHasil();
  if (!K) K = { i: 0, pick: -1, opts: null, a: [] };
  var q = KUIS[K.i];
  if (!K.opts) K.opts = shuf([[q.ans, '']].concat(q.dis));

  var o = K.opts.map(function(t, j) {
    var cls = K.pick < 0 ? '' : (t[0] === q.ans ? ' r' : K.pick === j ? ' w' : '');
    return '<button class="opt' + cls + '" onclick="kuisPick(' + j + ')" ' + (K.pick > -1 ? 'disabled' : '') + '>' +
      (cls.indexOf('r') > -1 ? '✅ ' : cls.indexOf('w') > -1 ? '❌ ' : '👉 ') + t[0] +
    '</button>';
  }).join('');

  var ok = K.pick > -1 && K.opts[K.pick][0] === q.ans;

  return pico('Soal ' + (K.i + 1) + ' dari ' + KUIS.length + '. Perhatikan gambarnya baik-baik!') +
    '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<h3>Kuis Cek Paham</h3>' +
        '<span class="chip yl">Soal ' + (K.i + 1) + ' / ' + KUIS.length + '</span>' +
      '</div>' +
      '<div class="c kp">' + kuisPic(q) + '</div>' +
      '<p><b>' + q.q + '</b></p>' +
      o +
      (K.pick > -1 ?
        '<div class="card highlight">' +
          '<p>' + (ok ? '<b class="good">🎉 Benar sekali!</b> ' : '<b class="bad">🤔 Belum tepat.</b> ') + q.why + '</p>' +
          '<div class="row">' +
            '<button class="btn g big" onclick="kuisNext()">' + (K.i + 1 >= KUIS.length ? 'Lihat Hasil Kuis ➔' : 'Soal Berikutnya ➔') + '</button>' +
          '</div>' +
        '</div>' : '') +
    '</div>';
}

function kuisPick(j) {
  if (K.pick > -1) return;
  var q = KUIS[K.i], o = K.opts[j], ok = o[0] === q.ans;
  K.pick = j;
  K.a.push(ok);
  if (ok) Snd.sfx('ok');
  else {
    Snd.sfx('bad');
    if (o[1]) S.mis[o[1]]++;
  }
  persist();
  render();
}

function kuisNext() {
  Snd.sfx('click');
  if (K.i + 1 >= KUIS.length) {
    S.kuis = { a: K.a };
    K = null;
    sync();
    render();
    window.scrollTo(0, 0);
  } else {
    K = { i: K.i + 1, pick: -1, opts: null, a: K.a };
    render();
    window.scrollTo(0, 0);
  }
}

function kuisRetry() {
  K = null;
  S.kuis = null;
  Snd.sfx('pop');
  go('kuis');
}

function kuisHasil() {
  var a = S.kuis.a, n = a.filter(Boolean).length;
  var msg = n === 3 ? 'Luar biasa! Kamu sudah sangat paham konsep pecahan. Pintu Oven Game sekarang terbuka!' :
            n === 2 ? 'Bagus sekali! Sedikit lagi sempurna. Oven Game sudah bisa dimainkan!' :
            'Tidak apa-apa, belajar adalah proses! Kamu boleh coba kuis lagi atau ulangi zona belajar.';
  return '<div class="card c">' +
    '<h2>Hasil Kuis Cek Paham</h2>' +
    '<div class="stars" aria-label="' + n + ' dari 3 benar">' +
      a.map(function(x) { return x ? '✅' : '❌'; }).join(' ') +
    '</div>' +
    '<p style="font-size:20px">Kamu menjawab benar <b>' + n + '</b> dari 3 soal.</p>' +
    '<p class="mut">' + msg + '</p>' +
    '<div class="row">' +
      '<button class="btn g big" onclick="go(\'l1\')">🔥 Masuk Oven Game (Level 1) ➔</button>' +
      '<button class="ghost" onclick="kuisRetry()">🔄 Coba Kuis Lagi</button>' +
    '</div>' +
    '<div class="row">' +
      (n < 3 ? '<button class="ghost" onclick="go(\'z1\')">📖 Ulangi Zona Belajar</button>' : '') +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
    '</div>' +
  '</div>';
}

/* ================= 5. GAME LEVEL 1 (PESANAN KILAT) ================= */
function newOrder() {
  var n = [4, 6, 8][rnd(3)];
  return { n: n, k: 1 + rnd(n - 1), sel: new Set(), fb: '', done: false };
}

function l1() {
  if (!L1) L1 = Object.assign({ i: 0, ok: 0 }, newOrder());
  var o = L1;
  return pico('Pesanan <b>' + (o.i + 1) + ' dari 5</b>. Ketuk potongan pizza sesuai pesanan pelanggan!') +
    '<div class="card c">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span class="chip yl">Level 1: Pesanan Kilat</span>' +
        '<span class="bold">Pesanan ' + (o.i + 1) + '/5</span>' +
      '</div>' +
      '<div class="big" style="margin:12px 0">Pelanggan: "Aku pesan ' + fr(o.k, o.n) + ' pizza!"</div>' +
      pizza(eq(o.n), o.sel, 'l1t') +
      '<p>Potongan dipilih: <b class="nu">' + o.sel.size + '</b> dari <b class="de">' + o.n + '</b> potong.</p>' +
      (o.fb ? '<div class="card highlight">' + o.fb + '</div>' : '<p class="mut sm">Ketuk potongan pizza di atas untuk mengambilnya.</p>') +
      '<div class="row">' +
        (!o.done ? '<button class="ghost" onclick="l1clear()">Kosongkan</button>' : '') +
        (!o.done ? '<button class="btn big" onclick="l1c()">Kirim Pesanan 🍕</button>' : '<button class="btn g big" onclick="l1n()">Pesanan Berikutnya ➔</button>') +
      '</div>' +
    '</div>' +
    '<div class="row"><button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button></div>';
}

function l1clear() {
  if (L1 && !L1.done) {
    L1.sel.clear();
    Snd.sfx('pop');
    render();
  }
}

function l1t(i) {
  if (L1.done) return;
  L1.sel.has(i) ? L1.sel.delete(i) : L1.sel.add(i);
  Snd.sfx('pop');
  render();
}

function l1c() {
  var o = L1;
  if (!o.sel.size) {
    o.fb = '<span class="bad">Pilih dulu potongannya sebelum disajikan ya!</span>';
    Snd.sfx('bad');
    return render();
  }
  if (o.sel.size === o.k) {
    o.ok++;
    o.fb = '<span class="good">🎉 Tepat sekali! Pelanggan sangat puas!</span>';
    Snd.sfx('ok');
  } else {
    S.e[1]++;
    if (o.sel.size === o.n - o.k) S.mis.m1++;
    persist();
    Snd.sfx('bad');
    o.fb = '<span class="bad">Kamu mengambil ' + o.sel.size + ' potong, padahal pesanannya ' + o.k + ' dari ' + o.n + ' potong.</span>';
  }
  o.done = true;
  render();
}

function l1n() {
  Snd.sfx('click');
  var ok = L1.ok, i = L1.i + 1;
  if (i >= 5) {
    L1 = null;
    finish(1, ok >= 4 ? 3 : ok >= 3 ? 2 : 1, 'Kamu melayani ' + ok + ' dari 5 pesanan dengan benar.');
  } else {
    L1 = Object.assign({ i: i, ok: ok }, newOrder());
    render();
  }
}

/* ================= 6. GAME LEVEL 2 (PASANGAN SENILAI) ================= */
function l2init() {
  var c = [];
  PR.forEach(function(p, i) {
    c.push({ p: i, v: p[0], b: 0 });
    c.push({ p: i, v: p[1], b: 1 });
  });
  L2 = { c: shuf(c), f: [], m: new Set(), mv: 0, lock: false };
}

function l2() {
  if (!L2) l2init();
  var h = L2.c.map(function(k, i) {
    var open = L2.f.indexOf(i) > -1 || L2.m.has(k.p);
    return '<button class="mc' + (L2.m.has(k.p) ? ' m' : open ? ' o' : '') + '" onclick="l2f(' + i + ')" aria-label="kartu ' + (i + 1) + (open ? ': ' + k.v[0] + '/' + k.v[1] : '') + '">' +
      (open ? fr(k.v[0], k.v[1]) + (k.b ? bar(k.v[1], k.v[0]) : '') : '❓') +
    '</button>';
  }).join('');

  return pico('Buka dua kartu yang nilainya <b>sama besar</b> (senilai). Coba selesaikan dalam sesedikit mungkin langkah!') +
    '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
        '<span class="chip yl">Level 2: Pasangan Senilai</span>' +
        '<span class="bold">Langkah: <b class="chip gn">' + L2.mv + '</b></span>' +
        '<small class="mut">≤ 7 langkah = ⭐⭐⭐ | ≤ 11 = ⭐⭐</small>' +
      '</div>' +
      '<div class="mg">' + h + '</div>' +
    '</div>' +
    '<div class="row">' +
      '<button class="ghost" onclick="l2init();render()">🔄 Kocok Ulang</button>' +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
    '</div>';
}

function l2f(i) {
  if (L2.lock || L2.f.indexOf(i) > -1 || L2.m.has(L2.c[i].p)) return;
  L2.f.push(i);
  Snd.sfx('pop');
  render();

  if (L2.f.length === 2) {
    L2.mv++;
    var a = L2.c[L2.f[0]], b = L2.c[L2.f[1]];
    L2.lock = true;
    setTimeout(function() {
      if (a.p === b.p) {
        L2.m.add(a.p);
        Snd.sfx('ok');
      } else {
        S.e[2]++;
        persist();
        Snd.sfx('bad');
      }
      L2.f = [];
      L2.lock = false;
      if (L2.m.size === PR.length) {
        var mv = L2.mv;
        L2 = null;
        finish(2, mv <= 7 ? 3 : mv <= 11 ? 2 : 1, 'Semua 4 pasangan senilai berhasil kamu temukan dalam ' + mv + ' langkah.');
      } else {
        render();
      }
    }, 800);
  }
}

/* ================= 7. GAME LEVEL 3 (RESEP AJAIB) ================= */
function l3new(i, ok) {
  return { i: i, ok: ok, miss: false, hint: false, done: false, pick: -1, opts: null };
}

function l3() {
  if (!L3) L3 = l3new(0, 0);
  var q = QS[L3.i], a = q[0], b = q[1], c = q[2], d = q[3];
  var m = (a * d) / b + c, s = sim(m, d), ans = s[0] + '/' + s[1];
  if (!L3.opts) L3.opts = shuf([[ans, ''], [(a + c) + '/' + (b + d), 'm2'], [(a + c) + '/' + d, 'm4']]);

  var o = L3.opts.map(function(t, j) {
    var cls = L3.pick === j ? (t[0] === ans ? ' r' : ' w') : (L3.done && t[0] === ans ? ' r' : '');
    return '<button class="opt' + cls + '" onclick="l3p(' + j + ')" ' + (L3.done ? 'disabled' : '') + '>' +
      (cls.indexOf('r') > -1 ? '✅ ' : cls.indexOf('w') > -1 ? '❌ ' : '🥄 ') + t[0] + ' cangkir' +
    '</button>';
  }).join('');

  return pico('Resep <b>' + (L3.i + 1) + ' dari 3</b>. Baca resep kue dengan teliti lalu tentukan jumlah bahan!') +
    '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span class="chip yl">Level 3: Resep Ajaib</span>' +
        '<span class="bold">Resep ' + (L3.i + 1) + ' / 3</span>' +
      '</div>' +
      '<p style="font-size:18px;line-height:1.6;margin:16px 0">' +
        '📖 Koki butuh <b>' + a + '/' + b + '</b> cangkir gula, lalu menambahkan lagi <b>' + c + '/' + d + '</b> cangkir gula. Berapa cangkir gula seluruhnya?' +
      '</p>' +
      (L3.hint ?
        '<div class="card highlight"><p class="bold">💡 Petunjuk:</p><p>Samakan dulu penyebutnya: ' + a + '/' + b + ' senilai dengan ' + (a * d / b) + '/' + d + '. Lalu jumlahkan pembilangnya!</p></div>' :
        '<button class="ghost sm" onclick="L3.hint=true;S.hint++;persist();Snd.sfx(\'click\');render()">💡 Minta Petunjuk</button>') +
      o +
      (L3.pick > -1 ?
        '<div class="card highlight">' +
          '<p>' + (L3.opts[L3.pick][0] === ans ?
            '<span class="good">🎉 Benar! ' + (a * d / b) + '/' + d + ' + ' + c + '/' + d + ' = ' + m + '/' + d + (s[1] !== d ? ' = ' + ans : '') + ' cangkir.</span>' :
            '<span class="bad">Belum tepat. Ingat, penyebut harus disamakan dulu dan tidak ikut dijumlahkan!</span>') +
          '</p>' +
          (L3.done ? '<div class="row"><button class="btn g big" onclick="l3n()">' + (L3.i + 1 >= 3 ? 'Lihat Hasil Akhir ➔' : 'Resep Berikutnya ➔') + '</button></div>' : '') +
        '</div>' : '') +
    '</div>' +
    '<div class="row"><button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button></div>';
}

function l3p(j) {
  if (L3.done) return;
  L3.pick = j;
  var q = QS[L3.i], s = sim(q[0] * q[3] / q[1] + q[2], q[3]), o = L3.opts[j];
  if (o[0] === s[0] + '/' + s[1]) {
    L3.done = true;
    if (!L3.miss) L3.ok++;
    Snd.sfx('ok');
  } else {
    L3.miss = true;
    S.e[3]++;
    if (o[1]) S.mis[o[1]]++;
    persist();
    Snd.sfx('bad');
  }
  render();
}

function l3n() {
  Snd.sfx('click');
  var ok = L3.ok, i = L3.i + 1;
  if (i >= 3) {
    L3 = null;
    finish(3, ok >= 3 ? 3 : ok >= 2 ? 2 : 1, 'Kamu benar pada percobaan pertama di ' + ok + ' dari 3 resep.');
  } else {
    L3 = l3new(i, ok);
    render();
  }
}

/* ================= 8. HASIL LEVEL (FIN) ================= */
function fin() {
  var nextBtn = '';
  if (LAST.l === 1) {
    nextBtn = '<button class="btn g big" onclick="go(\'l2\')">Lanjut ke Level 2 (Pasangan Senilai) ➔</button>';
  } else if (LAST.l === 2) {
    nextBtn = '<button class="btn g big" onclick="go(\'l3\')">Lanjut ke Level 3 (Resep Ajaib) ➔</button>';
  } else {
    nextBtn = '<button class="btn g big" onclick="go(\'res\')">Lihat Hasil & Lencana 🏅 ➔</button>';
  }

  return '<div class="card c">' +
    '<h2>Level ' + LAST.l + ' Selesai! 🎉</h2>' +
    '<div class="stars" aria-label="' + LAST.st + ' bintang">' + '⭐'.repeat(LAST.st) + '</div>' +
    '<p style="font-size:18px">' + LAST.msg + '</p>' +
    '<div class="row" style="margin-top:20px">' +
      nextBtn +
      '<button class="ghost" onclick="go(\'l' + LAST.l + '\')">Main Lagi Level Ini 🔄</button>' +
      '<button class="ghost" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
    '</div>' +
  '</div>';
}

/* ================= 9. HASIL AKHIR & REFLEKSI (RES) ================= */
function pick(key, val) {
  S[key] = val;
  Snd.sfx('pop');
  sync();
  render();
}

function res() {
  var t = stars(), ks = S.kuis ? S.kuis.a.filter(Boolean).length : 0;
  var rec = record();
  var opt = function(key, arr) {
    return '<div class="row">' + arr.map(function(e) {
      return '<button type="button" class="ghost' + (S[key] === e ? ' sel' : '') + '" onclick="pick(\'' + key + '\',\'' + e + '\')" aria-pressed="' + (S[key] === e) + '">' + e + '</button>';
    }).join('') + '</div>';
  };

  return '<div class="card c highlight">' +
    '<div style="font-size:48px;margin-bottom:8px">' + (t >= 7 ? '🏅' : '🌟') + '</div>' +
    '<h2>Hasil Belajar: ' + esc(S.nama) + '</h2>' +
    '<div class="stars">⭐ ' + t + ' / 9 Bintang</div>' +
    '<p style="font-size:20px;font-weight:700">' +
      (t >= 7 ? '🎉 Selamat! Kamu berhak meraih Lencana <b>Koki Pecahan</b>!' : 'Kumpulkan minimal 7 bintang untuk mendapatkan Lencana Koki Pecahan!') +
    '</p>' +
    '<div class="card" style="text-align:left;background:var(--card)">' +
      '<b>📊 Rangkuman Belajar:</b>' +
      '<ul style="margin:8px 0;padding-left:20px;line-height:1.7">' +
        '<li>Zona Belajar: <b>' + Object.keys(S.done).length + ' dari 3</b> selesai</li>' +
        '<li>Kuis Cek Paham: <b>' + ks + ' dari 3</b> benar</li>' +
        '<li>Level 1 (Pesanan Kilat): <b>' + (S.stars[1] || 0) + ' ⭐</b></li>' +
        '<li>Level 2 (Pasangan Senilai): <b>' + (S.stars[2] || 0) + ' ⭐</b></li>' +
        '<li>Level 3 (Resep Ajaib): <b>' + (S.stars[3] || 0) + ' ⭐</b></li>' +
        '<li>Nilai Akhir: <b class="chip ' + (rec.nilai >= KP_CONFIG.KKM ? 'gn' : 'yl') + '">' + rec.nilai + ' / 100</b> (' + rec.status + ')</li>' +
      '</ul>' +
    '</div>' +
  '</div>' +
  '<div class="card">' +
    '<h3>📝 Lembar Refleksi Siswa</h3>' +
    '<p>Bagaimana perasaanmu belajar pecahan hari ini?</p>' +
    opt('mood', ['😄 Sangat Senang', '🙂 Cukup Senang', '😕 Masih Bingung']) +
    '<p>Bagian mana yang menurutmu paling menantang?</p>' +
    opt('hard', ['Apa itu pecahan', 'Pecahan senilai', 'Menjumlahkan']) +
    '<p>Apakah game Kedai Pecahan ini mudah kamu gunakan?</p>' +
    opt('ease', ['😄 Sangat Mudah', '🙂 Cukup Mudah', '😕 Agak Sulit']) +
    (S.mood && S.hard && S.ease ?
      '<div class="card highlight c"><b class="good">Terima kasih atas refleksimu, ' + esc(S.nama) + '! Data belajarmu sudah disimpan dan siap dilihat guru.</b></div>' : '') +
  '</div>' +
  '<div class="row">' +
    '<button class="btn big" onclick="go(\'map\')">🗺️ Kembali ke Peta</button>' +
    '<button class="ghost" onclick="window.print()">🖨️ Cetak / Simpan Ringkasan</button>' +
    '<button class="ghost" onclick="gantiPemain()">🔄 Ganti Pemain</button>' +
  '</div>';
}

function gantiPemain() {
  if (confirm('Apakah kamu ingin mengganti pemain? Data pemain saat ini sudah tersimpan dengan aman.')) {
    S = newState();
    K = L1 = L2 = L3 = null;
    Snd.sfx('click');
    go('home');
  }
}

/* Mulai render pertama kali */
render();
