'use strict';
/* ================= Utilitas ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; }
const same = (n1, d1, n2, d2) => d1 > 0 && d2 > 0 && n1 * d2 === n2 * d1;
const wait = ms => new Promise(r => setTimeout(r, ms));

const MAX_SCORE = 220; // misi 5 + zona 15 + kuis 30 + L1 50 + L2 60 + L3 60

/* ================= Suara (tanpa file audio) ================= */
const Snd = {
  ctx: null, on: true, timer: null,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d = .12, type = 'sine', vol = .08, when = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + .02);
  },
  sfx(k) {
    if (!this.on) return; this.init();
    const T = {
      pop: [[660, .08, 'sine', .1, 0]],
      ok: [[523, .1, 'triangle', .1, 0], [659, .1, 'triangle', .1, .1], [784, .18, 'triangle', .1, .2]],
      bad: [[220, .18, 'sawtooth', .05, 0], [165, .25, 'sawtooth', .05, .15]],
      star: [[784, .1, 'triangle', .1, 0], [988, .1, 'triangle', .1, .1], [1319, .25, 'triangle', .1, .2]]
    }[k] || [];
    T.forEach(a => this.tone(...a));
  },
  music() {
    clearInterval(this.timer);
    if (!this.on || !this.ctx) return;
    const n = [262, 330, 392, 330, 294, 349, 440, 349]; let i = 0;
    this.timer = setInterval(() => this.tone(n[i++ % 8], .5, 'triangle', .022), 650);
  },
  set(on) {
    this.on = on;
    if (on) { this.init(); this.music(); } else clearInterval(this.timer);
    $$('.snd').forEach(b => b.textContent = (on ? '🔊' : '🔇') + ' Suara');
  }
};

/* ================= State siswa ================= */
function newState(prev) {
  return {
    id: 'S' + Date.now().toString(36) + rand(46656).toString(36),
    name: prev ? prev.name : '', kelas: prev ? prev.kelas : '', avatar: prev ? prev.avatar : '🧑‍🍳',
    score: 0, start: Date.now(), scene: 'pembuka', misi: false,
    zona: { z1: false, z2: false, z3: false },
    quiz: { i: 0, done: false, tries: [0, 0, 0], first: [null, null, null] },
    lv: { l1: false, l2: false, l3: false },
    m: { petunjuk: 0, bantuan: 0, terkunci: 0, l1First: 0, l1Salah: 0, l2Pairs: 0, l2Salah: 0, l2Bantuan: 0, l3First: 0, l3Hint: 0, l3Salah: 0, zona3Salah: 0, tambahPenyebut: 0, misiSalah: 0 },
    emoji: '', tersulit: '', ease: null, submitted: false, log: []
  };
}
let S = newState();

/* ================= Antarmuka umum ================= */
const SCENES = {};
let cur = null;

function say(t) { $('#bubble').textContent = t; }
function setNext(label, fn, enabled = true) {
  const b = $('#btnNext');
  if (!label) { b.style.display = 'none'; b.onclick = null; return; }
  b.style.display = ''; b.textContent = label; b.disabled = !enabled; b.onclick = fn;
}
function addScore(n) { S.score += n; $('#scoreVal').textContent = S.score; }
function logEv(item, hasil, detail) {
  const t = new Date(); const p = x => String(x).padStart(2, '0');
  S.log.push([`${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`, cur && SCENES[cur] ? SCENES[cur].title : '', item, hasil, detail || '']);
}
function openModal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="mbox">${html}<div class="center"><button class="btn soft" id="mClose">Tutup</button></div></div>`;
  m.classList.add('show');
  $('#mClose').onclick = closeModal;
  return m;
}
function closeModal() { const m = $('#modal'); m.classList.remove('show'); m.innerHTML = ''; }
function go(name, arg) {
  const prev = SCENES[cur]; if (prev && prev.leave) prev.leave();
  cur = name; S.scene = name;
  const sc = SCENES[name];
  $('#sceneTitle').textContent = sc.title;
  setNext(null);
  const st = $('#stage'); st.innerHTML = ''; st.scrollTop = 0;
  sc.enter(arg);
  saveLocal();
}
function curScene() { return cur; }

/* ================= Pecahan & visual ================= */
const frac = (n, d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
function barHTML(n, d) { let s = '<div class="bar">'; for (let i = 0; i < d; i++) s += `<i class="${i < n ? 'on' : ''}"></i>`; return s + '</div>'; }
function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function sectorPath(a0, a1, r = 90, cx = 100, cy = 100) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}
function pizzaSVG(parts, sel, opt) {
  sel = sel || new Set(); opt = opt || {};
  const step = 360 / parts;
  let s = `<svg class="pizza ${opt.static ? 'static' : ''}" viewBox="0 0 200 200" role="img" aria-label="Pizza dibagi ${parts} potong">`;
  for (let i = 0; i < parts; i++) s += `<path class="slice ${sel.has(i) ? 'on' : ''}" data-i="${i}" d="${sectorPath(i * step, (i + 1) * step)}"/>`;
  for (let i = 0; i < parts; i++) if (sel.has(i)) { const [x, y] = polar(100, 100, 55, (i + .5) * step); s += `<circle class="top" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/>`; }
  return s + '<circle class="crust" cx="100" cy="100" r="90" fill="none"/></svg>';
}
function sectorsSVG(angles, cols, mark) {
  let a = 0, s = '<svg viewBox="0 0 200 200">';
  angles.forEach((g, i) => { s += `<path d="${sectorPath(a, a + g, 88)}" fill="${cols[i % cols.length]}" stroke="#fff" stroke-width="3"/>`; a += g; });
  s += '<circle cx="100" cy="100" r="88" fill="none" stroke="#c97b2a" stroke-width="5"/>';
  if (mark) s += '<text x="100" y="122" text-anchor="middle" font-size="70" fill="#ef476f" font-weight="800">✖</text>';
  return s + '</svg>';
}
function picoSVG(size) {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Pico, maskot potongan pizza">
  <path d="M50 94 L10 24 Q50 -4 90 24 Z" fill="#ffc15e" stroke="#c97b2a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10 24 Q50 -4 90 24" fill="none" stroke="#c97b2a" stroke-width="8" stroke-linecap="round"/>
  <circle cx="36" cy="34" r="5" fill="#e63946"/><circle cx="64" cy="36" r="5" fill="#e63946"/><circle cx="52" cy="72" r="4" fill="#e63946"/>
  <circle cx="40" cy="50" r="4" fill="#4a2f1b"/><circle cx="60" cy="50" r="4" fill="#4a2f1b"/>
  <path d="M40 60 Q50 70 60 60" fill="none" stroke="#4a2f1b" stroke-width="3" stroke-linecap="round"/>
  <circle cx="32" cy="58" r="4" fill="#ff8fa3" opacity=".7"/><circle cx="68" cy="58" r="4" fill="#ff8fa3" opacity=".7"/></svg>`;
}

/* ================= Evaluasi: membangun rekaman untuk Excel ================= */
function buildRecord() {
  const m = S.m, q = S.quiz.first, T = CONFIG.THRESH;
  const quizN = q.filter(x => x === true).length;
  const zonaN = Object.values(S.zona).filter(Boolean).length;
  const lvN = Object.values(S.lv).filter(Boolean).length;
  const dur = Math.round((Date.now() - S.start) / 6000) / 10;
  const persen = Math.round(S.score / MAX_SCORE * 100);
  const bintang = S.score <= 0 ? 0 : persen >= 80 ? 3 : persen >= 55 ? 2 : 1;

  const konsepOK = q[0] === true && (!S.lv.l1 || m.l1First >= 3);
  const senilaiOK = q[1] === true && (!S.lv.l2 || m.l2Salah <= T.l2SalahMax);
  const jumlahOK = q[2] === true && (!S.lv.l3 || m.l3First >= 2) && m.zona3Salah <= 2 && m.tambahPenyebut === 0;
  const topik = [];
  if (!konsepOK) topik.push('Konsep pecahan (pembilang/penyebut)');
  if (!senilaiOK) topik.push('Pecahan senilai');
  if (!jumlahOK) topik.push('Penjumlahan pecahan berpenyebut beda');
  let statusMateri;
  if (!S.quiz.done) statusMateri = 'Belum dinilai';
  else { const ok = 3 - topik.length; statusMateri = ok === 3 ? 'Paham' : ok === 2 ? 'Cukup paham' : 'Perlu bimbingan'; }

  const alasan = [];
  if (S.ease !== null && S.ease <= T.easeMax) alasan.push('Menilai web sulit dipakai');
  if (m.petunjuk >= T.petunjukMin) alasan.push('Sering membuka Petunjuk (' + m.petunjuk + 'x)');
  if (m.bantuan >= T.bantuanMin) alasan.push('Sering menekan Bantuan (' + m.bantuan + 'x)');
  if (m.terkunci >= T.terkunciMin) alasan.push('Berulang menekan menu terkunci (' + m.terkunci + 'x), bingung alur');
  if (dur > T.durasiMax) alasan.push('Pengerjaan sangat lama (' + dur + ' menit)');
  const statusWeb = alasan.length ? 'Perlu dibantu memakai web' : 'Lancar';

  const rek = [];
  if (m.tambahPenyebut > 0) rek.push('Miskonsepsi menjumlahkan penyebut (mis. 1/2+1/4=2/6): ulangi Zona 3 dengan potongan pizza.');
  if (S.quiz.done && !konsepOK) rek.push('Ulang Zona 1: minta siswa menjelaskan mengapa potongan harus sama besar.');
  if (S.quiz.done && !senilaiOK) rek.push('Ulang Zona 2 memakai lipat kertas/pita untuk pecahan senilai.');
  if (S.quiz.done && jumlahOK === false && m.tambahPenyebut === 0) rek.push('Latih menyamakan penyebut dengan gambar sebelum rumus.');
  if (statusWeb !== 'Lancar') rek.push('Dampingi saat memakai web: tunjukkan peta kedai, tombol Bantuan, dan tombol Berikutnya.');
  if (!rek.length) rek.push(S.quiz.done ? 'Siap pengayaan (pengurangan/pecahan campuran).' : 'Belum cukup data: minta siswa menyelesaikan kuis.');

  const sel = S.submitted && S.quiz.done && lvN === 3 ? 'Selesai' : 'Belum selesai';
  const p = x => String(x).padStart(2, '0'), d = new Date(S.start);
  return {
    id: S.id, waktu: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,
    nama: S.name, kelas: S.kelas, status_selesai: sel, durasi_menit: dur, skor: S.score, persen, bintang,
    zona_selesai: zonaN, kuis_benar_pertama: quizN,
    kuis_detail: q.map(x => x === true ? '✔' : x === false ? '✘' : '-').join(' '),
    l1_benar_pertama: m.l1First, l1_salah: m.l1Salah, l2_pasangan: m.l2Pairs, l2_salah: m.l2Salah,
    l3_benar_pertama: m.l3First, l3_petunjuk: m.l3Hint, l3_salah: m.l3Salah,
    miskonsepsi_penyebut: m.tambahPenyebut, emoji: S.emoji, tersulit: S.tersulit,
    kemudahan_web: S.ease === null ? '' : S.ease,
    klik_petunjuk: m.petunjuk, klik_bantuan: m.bantuan, klik_terkunci: m.terkunci,
    status_materi: statusMateri, topik_bimbingan: topik.join('; '),
    status_web: statusWeb, alasan_web: alasan.join('; '), rekomendasi: rek.join(' '),
    log: S.log
  };
}

/* ================= Penyimpanan lokal & sinkron ke Google Sheet ================= */
const LS = { rec: 'kedaiPecahan.records', url: 'kedaiPecahan.sheetUrl' };
function loadRecords() { try { return JSON.parse(localStorage.getItem(LS.rec) || '[]'); } catch (e) { return []; } }
function saveRecords(a) { try { localStorage.setItem(LS.rec, JSON.stringify(a)); } catch (e) { } }
function upsertRecord(rec) {
  const a = loadRecords(), i = a.findIndex(r => r.id === rec.id);
  if (i >= 0) a[i] = rec; else a.push(rec);
  saveRecords(a);
}
function saveLocal() { if (S.name && S.name.length >= 2) upsertRecord(buildRecord()); }
function getSheetUrl() { let u = ''; try { u = localStorage.getItem(LS.url) || ''; } catch (e) { } return (u || CONFIG.SHEET_URL || '').trim(); }
function setSheetUrl(u) { try { localStorage.setItem(LS.url, u.trim()); } catch (e) { } }

function sheetPayload(rec) {
  return JSON.stringify({ action: 'save', record: rec, columns: CONFIG.COLUMNS.map(c => c.key), labels: CONFIG.COLUMNS.map(c => c.label) });
}
function sendToSheet(rec, useBeacon) {
  const url = getSheetUrl();
  if (!url) return Promise.resolve('lokal');
  const body = sheetPayload(rec);
  if (useBeacon && navigator.sendBeacon) { try { navigator.sendBeacon(url, body); } catch (e) { } return Promise.resolve('beacon'); }
  return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body })
    .then(() => 'terkirim').catch(() => 'gagal');
}
async function syncAll() {
  const a = loadRecords(); let ok = 0;
  for (const r of a) { const res = await sendToSheet(r); if (res === 'terkirim') ok++; }
  return { total: a.length, ok };
}
async function pullFromSheet() {
  const url = getSheetUrl();
  if (!url) throw new Error('URL Google Sheet belum diisi.');
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=list');
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'Gagal membaca sheet');
  const keys = CONFIG.COLUMNS.map(c => c.key), a = loadRecords();
  let added = 0;
  (j.rows || []).forEach(row => {
    const o = {}; keys.forEach((k, i) => o[k] = row[i] === undefined ? '' : row[i]);
    if (!o.id) return;
    const i = a.findIndex(r => r.id === o.id);
    if (i >= 0) { o.log = a[i].log || []; a[i] = o; } else { o.log = []; a.push(o); added++; }
  });
  saveRecords(a);
  return { rows: (j.rows || []).length, added };
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
