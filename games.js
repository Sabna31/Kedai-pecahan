'use strict';
function finishLevel(k, label) {
  S.lv[k] = true; Snd.sfx('star'); logEv(label, 'selesai');
  setNext('Selesai ✔ Kembali ke Peta', () => go('peta'));
  saveLocal();
}

/* ============ LEVEL 1: PESANAN KILAT ============ */
SCENES.l1 = {
  title: 'Level 1: Pesanan Kilat',
  enter() {
    const orders = [{ n: 3, d: 8, who: '👵' }, { n: 1, d: 4, who: '🧒' }, { n: 1, d: 2, who: '👨‍🦱' }, { n: 5, d: 8, who: '👩‍🦰' }, { n: 3, d: 4, who: '🧔' }];
    let i = 0, sel = new Set(), tries = 0, busy = false;
    const render = () => {
      const o = orders[i];
      $('#stage').innerHTML = `<div class="card center">
        <div class="gamehead"><span>Pesanan ${i + 1} dari 5</span><span id="l1sel">Dipilih: 0 potong</span></div>
        <div class="order"><span class="who">${o.who}</span><div class="talk">Aku mau ${frac(o.n, o.d)} pizza!</div></div>
        <div id="pz">${pizzaSVG(8, sel)}</div>
        <div class="btnrow"><button class="btn" id="bServe">🍕 Sajikan</button><button class="btn soft" id="bClear">Ulangi pilihan</button></div>
        <div id="l1msg" class="msg"></div></div>`;
      say('Layani pesanan secepatnya dan setepatnya! Pizza ini dibagi 8 potong.');
      const upd = () => { $('#pz').innerHTML = pizzaSVG(8, sel); $('#l1sel').textContent = 'Dipilih: ' + sel.size + ' potong'; };
      $('#pz').onclick = e => { if (busy) return; const p = e.target.closest('.slice'); if (!p) return; const k = +p.dataset.i; sel.has(k) ? sel.delete(k) : sel.add(k); Snd.sfx('pop'); upd(); };
      $('#bClear').onclick = () => { sel = new Set(); upd(); };
      $('#bServe').onclick = async () => {
        if (busy) return;
        const need = o.n * 8 / o.d, got = sel.size;
        if (got === need) {
          busy = true;
          const first = tries === 0; if (first) S.m.l1First++;
          addScore(first ? 10 : 5); Snd.sfx('ok'); logEv('pesanan ' + (i + 1) + ' (' + o.n + '/' + o.d + ')', 'benar', 'percobaan ke-' + (tries + 1));
          $('#l1msg').className = 'msg good'; $('#l1msg').textContent = (first ? '😊 Pelanggan senang! +10 poin' : '😊 Pelanggan senang! +5 poin');
          await wait(1100);
          i++; sel = new Set(); tries = 0; busy = false;
          if (i >= orders.length) {
            $('#stage').innerHTML = `<div class="card center"><h2>🎉 Semua pesanan terlayani!</h2><p>Benar di percobaan pertama: <b>${S.m.l1First} dari 5</b></p></div>`;
            say('Kerja bagus, Koki Cilik!'); finishLevel('l1', 'level 1');
          } else render();
        } else {
          tries++; S.m.l1Salah++; Snd.sfx('bad');
          logEv('pesanan ' + (i + 1) + ' (' + o.n + '/' + o.d + ')', 'salah', 'memilih ' + got + ' potong');
          const diff = Math.abs(need - got);
          $('#l1msg').className = 'msg bad';
          $('#l1msg').textContent = got < need ? `Kurang ${diff} potong. Coba lagi!` : `Kelebihan ${diff} potong. Coba lagi!`;
          $('#pz').classList.add('shake'); setTimeout(() => $('#pz').classList.remove('shake'), 400);
        }
      };
    };
    render();
  },
  help() { say('Pizza ada 8 potong. Samakan penyebut pesanan dengan 8, lalu hitung potongannya.'); }
};

/* ============ LEVEL 2: PASANGAN SENILAI ============ */
const PAIRS = [[1, 2, 2, 4], [1, 3, 2, 6], [3, 4, 6, 8], [2, 3, 4, 6], [1, 4, 2, 8], [1, 5, 2, 10]];
SCENES.l2 = {
  title: 'Level 2: Pasangan Senilai',
  enter() {
    const cards = [];
    PAIRS.forEach((p, k) => { cards.push({ pair: k, type: 'sym', n: p[0], d: p[1] }); cards.push({ pair: k, type: 'img', n: p[2], d: p[3] }); });
    const deck = shuffle(cards); let open = [], lock = false, found = 0;
    $('#stage').innerHTML = `<div class="card center" style="max-width:640px">
      <div class="gamehead"><span>Temukan dua kartu yang nilainya sama!</span><span id="l2c">0 dari 6 pasang</span></div>
      <div class="mgrid" id="mg">${deck.map((c, i) => `<button class="mcard" data-i="${i}" aria-label="Kartu ${i + 1}"><div class="in"><div class="f">?</div>
        <div class="b">${c.type === 'sym' ? `<span style="font-size:1.6rem">${frac(c.n, c.d)}</span>` : barHTML(c.n, c.d)}</div></div></button>`).join('')}</div>
      <div id="l2msg" class="msg"></div></div>`;
    say('Temukan dua kartu yang nilainya sama! Tidak ada batas waktu.');
    $$('.mcard').forEach(el => el.onclick = async () => {
      const i = +el.dataset.i, c = deck[i];
      if (lock || el.classList.contains('open') || el.classList.contains('match')) return;
      el.classList.add('open'); open.push(i); Snd.sfx('pop');
      if (open.length < 2) return;
      lock = true;
      const [a, b] = open.map(x => deck[x]), els = open.map(x => $$('.mcard')[x]);
      const ok = a.pair === b.pair && a.type !== b.type;
      await wait(ok ? 400 : 1000);
      if (ok) {
        els.forEach(e => { e.classList.remove('open'); e.classList.add('match'); });
        found++; S.m.l2Pairs = Math.max(S.m.l2Pairs, found); addScore(10); Snd.sfx('ok');
        logEv('pasangan', 'cocok', `${a.n}/${a.d} = ${b.n}/${b.d}`);
        $('#l2c').textContent = found + ' dari 6 pasang';
        $('#l2msg').className = 'msg good'; $('#l2msg').textContent = 'Cocok! Nilainya sama.';
        if (found === PAIRS.length) { say('Semua pasangan ditemukan!'); finishLevel('l2', 'level 2'); }
      } else {
        els.forEach(e => e.classList.remove('open'));
        S.m.l2Salah++; Snd.sfx('bad'); logEv('pasangan', 'tidak cocok', `${a.n}/${a.d} dan ${b.n}/${b.d}`);
        $('#l2msg').className = 'msg bad'; $('#l2msg').textContent = 'Belum sama. Coba lagi, tanpa hukuman!';
      }
      open = []; lock = false;
    });
  },
  help() {
    S.m.l2Bantuan++;
    openModal(`<h3>💡 Batang bantuan</h3><p>Bandingkan panjang bagian berwarna:</p>${PAIRS.map(p => `<div class="helpbars"><span>${frac(p[0], p[1])}</span>${barHTML(p[0], p[1])}</div>`).join('')}`);
  }
};

/* ============ LEVEL 3: RESEP AJAIB ============ */
const RECIPES = [
  { item: 'gula', a: [1, 3], b: [1, 6], lcd: 6, opts: [3, 6, 9, 12] },
  { item: 'tepung', a: [1, 4], b: [3, 8], lcd: 8, opts: [8, 12, 16, 32] },
  { item: 'susu', a: [2, 3], b: [1, 4], lcd: 12, opts: [7, 12, 6, 24] }
];
SCENES.l3 = {
  title: 'Level 3: Resep Ajaib',
  enter() {
    let r = 0, step = 1, rw = 0, rh = 0, hl = 0;
    const calc = () => {
      const c = RECIPES[r], a2 = c.a[0] * c.lcd / c.a[1], b2 = c.b[0] * c.lcd / c.b[1];
      return { c, a2, b2, sn: a2 + b2 };
    };
    const showMsg = (t, good) => { $('#l3msg').className = 'msg ' + (good ? 'good' : 'bad'); $('#l3msg').innerHTML = t; };
    const view = () => {
      const { c } = calc();
      rw = 0; rh = 0; hl = 0; step = 1;
      $('#stage').innerHTML = `<div class="card"><span class="recipehead">📖 Resep ${r + 1} dari 3</span>
        <p class="story">Kue butuh <b>${frac(c.a[0], c.a[1])}</b> cangkir ${c.item} ditambah <b>${frac(c.b[0], c.b[1])}</b> cangkir ${c.item}. <b>Berapa cangkir ${c.item} yang dibutuhkan semuanya?</b></p>
        <div class="eqrow"><div>${barHTML(c.a[0], c.a[1])}</div><b style="font-size:1.6rem">+</b><div>${barHTML(c.b[0], c.b[1])}</div></div>
        <div id="l3step" class="stepbox"></div><div id="l3hint" class="hintbox"></div><div id="l3msg" class="msg center"></div></div>`;
      say('Berapa cangkir yang dibutuhkan semuanya? Ikuti tiga langkahnya!');
      renderStep();
    };
    const renderStep = () => {
      const { c, a2, b2, sn } = calc(), box = $('#l3step');
      if (step === 1) {
        box.innerHTML = `<h4>Langkah 1: Pilih penyebut yang sama</h4><div class="chips">${c.opts.map(o => `<button class="chip" data-v="${o}">${o}</button>`).join('')}</div>`;
        $$('.chip', box).forEach(b => b.onclick = () => {
          if (+b.dataset.v === c.lcd) { Snd.sfx('ok'); logEv('resep ' + (r + 1) + ' langkah 1', 'benar', b.dataset.v); showMsg('Tepat! Penyebut yang sama: ' + c.lcd, true); step = 2; renderStep(); }
          else { rw++; S.m.l3Salah++; Snd.sfx('bad'); b.classList.add('wrong'); logEv('resep ' + (r + 1) + ' langkah 1', 'salah', b.dataset.v); showMsg('Belum tepat. Cari KPK dari ' + c.a[1] + ' dan ' + c.b[1] + '.', false); }
        });
      } else if (step === 2) {
        box.innerHTML = `<h4>Langkah 2: Ubah ke pecahan senilai</h4>
          <div class="inl">${frac(c.a[0], c.a[1])} = <input id="i1" class="input num" type="number" min="0" aria-label="Pembilang pertama"> / ${c.lcd}</div>
          <div class="inl">${frac(c.b[0], c.b[1])} = <input id="i2" class="input num" type="number" min="0" aria-label="Pembilang kedua"> / ${c.lcd}</div>
          <button class="btn" id="b2">Cek</button>`;
        $('#b2').onclick = () => {
          const x = parseInt($('#i1').value, 10), y = parseInt($('#i2').value, 10);
          if (x === a2 && y === b2) { Snd.sfx('ok'); logEv('resep ' + (r + 1) + ' langkah 2', 'benar'); showMsg('Betul! Kedua potongan kini sama ukurannya.', true); step = 3; renderStep(); }
          else { rw++; S.m.l3Salah++; Snd.sfx('bad'); logEv('resep ' + (r + 1) + ' langkah 2', 'salah', x + ',' + y); showMsg('Belum tepat. Kalikan pembilang dengan angka yang sama seperti penyebutnya.', false); }
        };
      } else if (step === 3) {
        box.innerHTML = `<h4>Langkah 3: Jumlahkan</h4>
          <div class="inl">${frac(a2, c.lcd)} + ${frac(b2, c.lcd)} = <input id="rn" class="input num" type="number" min="0" aria-label="Pembilang hasil"> / <input id="rd" class="input num" type="number" min="1" aria-label="Penyebut hasil"></div>
          <button class="btn" id="b3">Cek hasil</button>`;
        $('#b3').onclick = () => {
          const n = parseInt($('#rn').value, 10), d = parseInt($('#rd').value, 10);
          if (isNaN(n) || isNaN(d)) { showMsg('Isi pembilang dan penyebut dulu ya.', false); return; }
          if (same(n, d, sn, c.lcd)) {
            const first = rw === 0 && rh === 0; if (first) S.m.l3First++;
            const pts = first ? 20 : 10; addScore(pts); Snd.sfx('ok');
            logEv('resep ' + (r + 1), 'benar', `${n}/${d}; salah ${rw}; petunjuk ${rh}`);
            box.innerHTML = `<h4>🎉 ${frac(a2, c.lcd)} + ${frac(b2, c.lcd)} = ${frac(sn, c.lcd)}</h4>${barHTML(sn, c.lcd)}<p>Jadi butuh ${frac(sn, c.lcd)} cangkir ${c.item}. +${pts} poin</p>`;
            $('#l3msg').textContent = ''; $('#l3hint').innerHTML = '';
            if (r < RECIPES.length - 1) setNext('Resep berikutnya ▶', () => { r++; view(); });
            else { say('Semua resep selesai. Kamu koki hebat!'); finishLevel('l3', 'level 3'); }
          } else {
            rw++; S.m.l3Salah++; Snd.sfx('bad'); logEv('resep ' + (r + 1) + ' langkah 3', 'salah', n + '/' + d);
            if (d === c.a[1] + c.b[1] || d === c.lcd * 2) { S.m.tambahPenyebut++; showMsg('Penyebut tidak dijumlahkan! Penyebut tetap ' + c.lcd + ', hanya pembilang yang dijumlahkan.', false); }
            else showMsg('Belum tepat. Jumlahkan pembilangnya saja: ' + a2 + ' + ' + b2 + '.', false);
          }
        };
      }
    };
    SCENES.l3._help = () => {
      const { c, a2, b2, sn } = calc(); hl++; rh++; S.m.l3Hint++; logEv('resep ' + (r + 1), 'petunjuk', 'tingkat ' + hl);
      const h = $('#l3hint'); if (!h) return;
      if (hl === 1) h.innerHTML = `Petunjuk 1: samakan dulu penyebutnya. Cari KPK dari ${c.a[1]} dan ${c.b[1]}.`;
      else if (hl === 2) h.innerHTML = `Petunjuk 2 (visual): ${frac(c.a[0], c.a[1])} sama dengan ${frac(a2, c.lcd)}, dan ${frac(c.b[0], c.b[1])} sama dengan ${frac(b2, c.lcd)}.${barHTML(a2, c.lcd)}${barHTML(b2, c.lcd)}`;
      else h.innerHTML = `Penjelasan: ${frac(a2, c.lcd)} + ${frac(b2, c.lcd)} = ${frac(sn, c.lcd)}. Penyebut tetap ${c.lcd}, pembilang dijumlahkan.`;
    };
    view();
  },
  help() { if (SCENES.l3._help) SCENES.l3._help(); }
};

/* ============ HASIL DAN REFLEKSI ============ */
SCENES.hasil = {
  title: 'Hasil & Refleksi',
  enter() {
    const r = buildRecord(), m = S.m;
    const allDone = S.quiz.done && Object.values(S.lv).every(Boolean);
    const badge = (r.persen >= 55 && allDone) ? '🏅 Koki Pecahan' : '🥄 Koki Pemula';
    const emos = [['😄', 'Senang'], ['🙂', 'Lumayan'], ['😐', 'Biasa saja'], ['😟', 'Sulit']];
    const faces = [['😖', 1], ['😕', 2], ['😐', 3], ['🙂', 4], ['😄', 5]];
    $('#stage').innerHTML = `<div class="card center">
      <h2>Hebat, ${esc(S.avatar)} ${esc(S.name || 'Koki Cilik')}!</h2>
      <div class="stars">${'⭐'.repeat(r.bintang)}${'☆'.repeat(3 - r.bintang)}</div>
      <p><b>Skor: ${S.score}</b> dari ${MAX_SCORE} poin</p><div class="badge">${badge}</div>
      <table class="sumtable"><tr><th>Bagian</th><th>Hasil</th></tr>
        <tr><td>Zona Belajar</td><td>${r.zona_selesai} dari 3 selesai</td></tr>
        <tr><td>Kuis cek paham</td><td>${r.kuis_benar_pertama} dari 3 benar di percobaan pertama</td></tr>
        <tr><td>Level 1 Pesanan Kilat</td><td>${m.l1First} dari 5 benar di percobaan pertama</td></tr>
        <tr><td>Level 2 Pasangan Senilai</td><td>${m.l2Pairs} dari 6 pasang</td></tr>
        <tr><td>Level 3 Resep Ajaib</td><td>${m.l3First} dari 3 resep tanpa salah dan petunjuk</td></tr></table>
      ${allDone ? '' : '<p class="muted">Kamu belum menyelesaikan semua bagian. Kamu boleh kembali ke peta kapan saja.</p>'}
      <h3>Bagian mana yang paling mudah dan paling sulit?</h3>
      <div class="emojis">${emos.map(e => `<button class="emo ${S.emoji === e[0] ? 'sel' : ''}" data-e="${e[0]}" title="${e[1]}" aria-label="${e[1]}">${e[0]}</button>`).join('')}</div>
      <select id="selSulit" class="input" aria-label="Bagian paling sulit">
        <option value="">Pilih bagian yang paling sulit…</option>
        ${['Konsep pecahan', 'Pecahan senilai', 'Menjumlahkan pecahan', 'Cara memakai web ini', 'Tidak ada yang sulit'].map(t => `<option ${S.tersulit === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <h3>Seberapa mudah memakai web ini?</h3>
      <div class="faces">${faces.map(f => `<button class="emo ${S.ease === f[1] ? 'sel' : ''}" data-f="${f[1]}" aria-label="Kemudahan ${f[1]} dari 5">${f[0]}</button>`).join('')}</div>
      <p class="muted">1 = sangat sulit, 5 = sangat mudah</p>
      <div class="btnrow"><button class="btn" id="bSave">💾 Simpan hasil untuk guru</button><button class="btn alt" id="bAgain">🔁 Main lagi</button><button class="btn soft" id="bMap">🗺️ Kembali ke peta</button></div>
      <div id="saveMsg" class="msg"></div></div>`;
    say('Hebat! Bagian mana yang paling mudah dan paling sulit?');
    if (r.bintang > 0) Snd.sfx('star');
    $$('.emo[data-e]').forEach(b => b.onclick = () => { S.emoji = b.dataset.e; $$('.emo[data-e]').forEach(x => x.classList.toggle('sel', x === b)); Snd.sfx('pop'); });
    $$('.emo[data-f]').forEach(b => b.onclick = () => { S.ease = +b.dataset.f; $$('.emo[data-f]').forEach(x => x.classList.toggle('sel', x === b)); Snd.sfx('pop'); });
    $('#selSulit').onchange = e => { S.tersulit = e.target.value; };
    $('#bMap').onclick = () => go('peta');
    $('#bAgain').onclick = () => { S = newState(S); $('#scoreVal').textContent = 0; go('identitas'); };
    $('#bSave').onclick = async () => {
      S.submitted = true; logEv('refleksi', 'disimpan', `${S.emoji} | ${S.tersulit} | web ${S.ease}`);
      const rec = buildRecord(); upsertRecord(rec);
      $('#saveMsg').className = 'msg'; $('#saveMsg').textContent = 'Menyimpan…';
      const res = await sendToSheet(rec);
      Snd.sfx('ok');
      $('#saveMsg').className = 'msg good';
      $('#saveMsg').textContent = res === 'terkirim' ? '✅ Hasilmu sudah tersimpan dan dikirim ke guru.'
        : res === 'gagal' ? '✅ Tersimpan di perangkat ini. Pengiriman online gagal, minta guru mengirim ulang nanti.'
        : '✅ Hasilmu sudah tersimpan di perangkat ini. Guru akan melihatnya di panel guru.';
    };
  }
};
