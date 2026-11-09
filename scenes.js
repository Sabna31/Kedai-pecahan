'use strict';
/* ============ 1. PEMBUKA ============ */
SCENES.pembuka = {
  title: 'Kedai Pecahan',
  enter() {
    $('#stage').innerHTML = `<div class="hero">
      <div class="signboard">Kedai Pecahan</div>
      <div class="hero-pico">${picoSVG(150)}</div>
      <p class="lead">Belajar pecahan sambil menjadi koki cilik!</p>
      <div class="btnrow">
        <button class="btn big" id="bMulai">▶ Mulai</button>
        <button class="btn alt" id="bPetunjuk">❓ Petunjuk</button>
        <button class="btn soft snd" id="bSuara">${Snd.on ? '🔊' : '🔇'} Suara</button>
      </div></div>`;
    say('Halo, Koki Cilik! Yuk bantu aku melayani pelanggan di Kedai Pecahan!');
    $('#bMulai').onclick = () => { Snd.init(); Snd.sfx('pop'); Snd.music(); go('identitas'); };
    $('#bSuara').onclick = () => Snd.set(!Snd.on);
    $('#bPetunjuk').onclick = () => {
      S.m.petunjuk++; logEv('petunjuk', 'dibuka');
      openModal(`<h3>❓ Cara bermain</h3><ol>
        <li>Ketik namamu dan pilih avatar koki.</li>
        <li>Selesaikan misi pembuka, lalu pelajari <b>3 Zona Belajar</b> di meja belajar.</li>
        <li>Jawab <b>Kuis Cek Paham</b> untuk membuka oven game.</li>
        <li>Mainkan <b>3 Level Game</b>. Tidak ada batas waktu, salah boleh dicoba lagi.</li>
        <li>Tombol <b>💡 Bantuan</b> memberi petunjuk. Tombol <b>Berikutnya</b> ada di pojok kanan bawah.</li></ol>`);
    };
    setNext(null);
  }
};

/* ============ 2. IDENTITAS ============ */
SCENES.identitas = {
  title: 'Kenalan dulu, yuk!',
  enter() {
    const av = ['👩‍🍳', '👨‍🍳', '🧑‍🍳', '🐱'];
    $('#stage').innerHTML = `<div class="card center"><h2>Siapa nama Koki Cilik hari ini?</h2>
      <input id="inNama" class="input" maxlength="30" placeholder="Ketik namamu" value="${esc(S.name)}" autocomplete="off" aria-label="Nama">
      <input id="inKelas" class="input" maxlength="12" placeholder="Kelas, contoh 5A (boleh dikosongkan)" value="${esc(S.kelas)}" autocomplete="off" aria-label="Kelas">
      <p class="muted">Pilih avatar kokimu:</p>
      <div class="avatars">${av.map(a => `<button class="avatar ${a === S.avatar ? 'sel' : ''}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div></div>`;
    say('Siapa nama Koki Cilik hari ini? Pilih avatarmu juga!');
    const check = () => {
      S.name = $('#inNama').value.trim(); S.kelas = $('#inKelas').value.trim();
      setNext('Berikutnya ▶', () => { Snd.sfx('ok'); logEv('identitas', 'ok', S.name); go('misi'); }, S.name.length >= 2);
    };
    $('#inNama').oninput = check; $('#inKelas').oninput = check;
    $('#inNama').onkeydown = e => { if (e.key === 'Enter' && S.name.length >= 2) $('#btnNext').click(); };
    $$('.avatar').forEach(b => b.onclick = () => { S.avatar = b.dataset.a; $$('.avatar').forEach(x => x.classList.toggle('sel', x === b)); Snd.sfx('pop'); });
    check(); $('#inNama').focus();
  }
};

/* ============ 3. MISI PEMBUKA ============ */
SCENES.misi = {
  title: 'Misi Pembuka',
  enter() {
    let theta = 55, solved = S.misi;
    $('#stage').innerHTML = `<div class="card center"><h2>Bagaimana membagi satu kue sama rata untuk 4 orang?</h2>
      <div style="max-width:300px;margin:0 auto" id="cake"></div>
      <div style="font-size:2rem" aria-hidden="true">🧒 👧 👦 👵</div>
      <label class="slidelab">🔪 Geser pisau: <input type="range" id="knife" min="15" max="165" value="55" aria-label="Geser pisau"></label>
      <div id="misiMsg" class="msg">Geser pisau, lalu lepaskan.</div></div>`;
    say('Geser pisaunya sampai keempat potongan sama besar. Lalu lepaskan!');
    const draw = glow => {
      const b = [0, theta, 180, 180 + theta, 360];
      const cols = glow ? ['#ffe066', '#ffe066', '#ffe066', '#ffe066'] : ['#ffd6a5', '#ff9fb2', '#ffd6a5', '#ff9fb2'];
      let s = `<svg viewBox="0 0 200 200" role="img" aria-label="Kue dipotong">`;
      for (let i = 0; i < 4; i++) s += `<path d="${sectorPath(b[i], b[i + 1], 88)}" fill="${cols[i]}" stroke="#fff" stroke-width="3"/>`;
      s += '<circle cx="100" cy="100" r="88" fill="none" stroke="#c97b2a" stroke-width="5"/>';
      const [x1, y1] = polar(100, 100, 94, theta), [x2, y2] = polar(100, 100, 94, theta + 180);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#444" stroke-width="3" stroke-dasharray="5 4"/>`;
      s += '<line x1="100" y1="6" x2="100" y2="194" stroke="#444" stroke-width="3" stroke-dasharray="5 4"/>';
      $('#cake').innerHTML = s + '</svg>';
    };
    draw(solved);
    if (solved) { $('#knife').value = 90; theta = 90; draw(true); }
    const done = () => {
      $('#misiMsg').className = 'msg good';
      $('#misiMsg').innerHTML = `Hebat! Tiap orang mendapat ${frac(1, 4)} kue.`;
      say('Potongannya sama besar! Itulah dasar pecahan.');
      setNext('Ke Peta Kedai ▶', () => go('peta'));
    };
    if (solved) done();
    $('#knife').oninput = e => { if (solved) return; theta = +e.target.value; draw(false); };
    $('#knife').onchange = e => {
      if (solved) return;
      theta = +e.target.value;
      if (Math.abs(theta - 90) <= 3) {
        theta = 90; $('#knife').value = 90; solved = true; S.misi = true; addScore(5); Snd.sfx('ok'); draw(true);
        logEv('misi kue', 'benar'); done();
      } else {
        S.m.misiSalah++; Snd.sfx('bad'); logEv('misi kue', 'salah', 'sudut ' + theta);
        $('#misiMsg').className = 'msg bad'; $('#misiMsg').textContent = 'Ups, potongannya belum sama besar!';
        say('Perhatikan warnanya: potongan sama besar berwarna sama.');
      }
    };
  },
  help() { say('Dua garis potong harus saling tegak lurus supaya empat potongan sama besar.'); }
};

/* ============ 4. PETA KEDAI ============ */
SCENES.peta = {
  title: 'Peta Kedai',
  enter() {
    const zdone = Object.values(S.zona).every(Boolean);
    const node = (id, ico, tt, sub, state) => `<button class="node ${state}" data-go="${id}" data-state="${state}" aria-label="${tt}${state === 'locked' ? ' (terkunci)' : ''}">
      <span class="ico">${state === 'locked' ? '🔒' : ico}</span><b>${tt}</b><small>${sub}</small>${state === 'done' ? '<span class="chk">✅</span>' : ''}</button>`;
    const zs = k => S.zona[k] ? 'done' : 'open';
    const qs = S.quiz.done ? 'done' : (zdone ? 'open' : 'locked');
    const ls = k => S.lv[k] ? 'done' : (S.quiz.done ? 'open' : 'locked');
    $('#stage').innerHTML = `<div class="map">
      <h3>🪑 Meja Belajar</h3><div class="row3">
        ${node('z1', '🍕', 'Zona 1', 'Apa itu pecahan?', zs('z1'))}
        ${node('z2', '🍫', 'Zona 2', 'Pecahan senilai', zs('z2'))}
        ${node('z3', '🥧', 'Zona 3', 'Menjumlah pecahan', zs('z3'))}</div>
      <h3>📝 Kuis</h3><div class="row3">${node('kuis', '🧠', 'Kuis Cek Paham', S.quiz.done ? 'Sudah selesai' : '3 soal bergambar', qs)}</div>
      <h3>🔥 Oven Game</h3><div class="row3">
        ${node('l1', '🛎️', 'Level 1', 'Pesanan Kilat', ls('l1'))}
        ${node('l2', '🃏', 'Level 2', 'Pasangan Senilai', ls('l2'))}
        ${node('l3', '📖', 'Level 3', 'Resep Ajaib', ls('l3'))}</div>
      <p class="center" style="margin-top:14px"><b>🏆 Papan skor:</b> ${S.score} dari ${MAX_SCORE} poin</p></div>`;
    say(!zdone ? 'Selesaikan Zona Belajar untuk membuka oven game!' : !S.quiz.done ? 'Kerjakan kuis cek paham dulu ya!' : 'Oven game sudah terbuka. Selamat bermain!');
    $$('.node').forEach(n => n.onclick = () => {
      if (n.dataset.state === 'locked') {
        S.m.terkunci++; Snd.sfx('bad'); n.classList.add('shake'); setTimeout(() => n.classList.remove('shake'), 400);
        logEv('menu terkunci', n.dataset.go);
        say(n.dataset.go === 'kuis' ? 'Selesaikan dulu ketiga Zona Belajar ya!' : 'Selesaikan kuis cek paham dulu untuk membuka oven ini!');
        return;
      }
      Snd.sfx('pop'); go(n.dataset.go);
    });
    setNext('Lihat Hasil 🏁', () => go('hasil'));
  }
};

/* ============ ZONA ============ */
function finishZone(z) {
  if (!S.zona[z]) { S.zona[z] = true; addScore(5); Snd.sfx('ok'); logEv('zona ' + z, 'selesai'); }
  setNext('Selesai ✔ Kembali ke Peta', () => go('peta'));
}

/* ----- Zona 1 ----- */
SCENES.z1 = {
  title: 'Zona 1: Apa itu Pecahan?',
  enter() {
    let parts = 4, sel = new Set(), taps = 0, slides = 0;
    $('#stage').innerHTML = `<div class="zone">
      <div class="panel"><div id="pz"></div>
        <label class="slidelab">Penyebut (jumlah potongan): <input type="range" id="sl" min="2" max="8" value="4" aria-label="Jumlah potongan"> <b id="slv">4</b></label>
        <p class="center muted">Ketuk potongan pizza untuk mengambilnya.</p></div>
      <div class="panel"><div class="fracbig" id="fb"></div>
        <p><span class="tagd">Penyebut</span> = jumlah seluruh potongan yang sama besar.</p>
        <p><span class="tagn">Pembilang</span> = potongan yang diambil.</p>
        <div class="counter"><h4>Bukan pecahan! ❌</h4><div class="mini">${sectorsSVG([200, 70, 50, 40], ['#ffc15e', '#ffd6a5', '#ff9f1c', '#ffe3b3'], true)}</div>
          <p>Potongannya tidak sama besar, jadi tidak bisa disebut pecahan.</p></div>
        <div class="progline"><span class="pill" id="pg1">Geser slider 2x</span><span class="pill" id="pg2">Ketuk potongan 3x</span></div></div></div>`;
    say('Penyebut adalah jumlah semua potongan. Pembilang adalah potongan yang diambil.');
    const render = () => {
      $('#pz').innerHTML = pizzaSVG(parts, sel);
      $('#fb').innerHTML = frac(sel.size, parts);
      $('#slv').textContent = parts;
      $('#pg1').classList.toggle('ok', slides >= 2); $('#pg2').classList.toggle('ok', taps >= 3);
      if (slides >= 2 && taps >= 3) finishZone('z1');
    };
    $('#pz').onclick = e => {
      const p = e.target.closest('.slice'); if (!p) return;
      const i = +p.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); taps++; Snd.sfx('pop'); render();
    };
    $('#sl').oninput = e => { parts = +e.target.value; sel = new Set(); slides++; render(); };
    render();
    if (S.zona.z1) finishZone('z1');
  },
  help() { say('Geser slider untuk mengubah jumlah potongan, lalu ketuk potongan oranye.'); }
};

/* ----- Zona 2 ----- */
SCENES.z2 = {
  title: 'Zona 2: Pecahan Senilai',
  enter() {
    const rows = [[1, 2], [2, 4], [4, 8]], picked = new Set();
    $('#stage').innerHTML = `<div class="card" style="max-width:820px">
      <p class="center"><b>Ketuk tiap batang</b> untuk membandingkan bagian yang diwarnai.</p>
      <div class="barsbox" id="bb">${rows.map((r, i) => `<div class="brow" data-i="${i}" tabindex="0" role="button" aria-label="Batang ${r[0]}/${r[1]}">
        <span>${frac(r[0], r[1])}</span><div class="barw">${barHTML(r[0], r[1])}<span class="mark"></span></div></div>`).join('')}</div>
      <div class="numline"><span></span><div class="line"><span style="left:0">0</span><span style="left:50%">½</span><span style="left:100%">1</span><div class="dot" id="dot"></div></div></div>
      <div class="btnrow" style="margin-top:34px"><button class="btn alt" id="bStack">🧱 Tumpuk batang</button></div>
      <div id="z2msg" class="msg center">Ketuk ketiga batang untuk menemukannya.</div></div>`;
    say('Lihat! Bagian yang diwarnai sama panjang. Bentuknya beda, nilainya sama.');
    const pick = i => {
      picked.add(i); Snd.sfx('pop');
      $$('.brow')[i].classList.add('picked'); $('#dot').classList.add('blink');
      if (picked.size === 3) {
        $('#z2msg').className = 'msg good center';
        $('#z2msg').innerHTML = `${frac(1, 2)} = ${frac(2, 4)} = ${frac(4, 8)}. Bentuknya beda, nilainya sama!`;
        finishZone('z2');
      } else $('#z2msg').textContent = `Bagus! Tinggal ${3 - picked.size} batang lagi.`;
    };
    $$('.brow').forEach(r => { r.onclick = () => pick(+r.dataset.i); r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(+r.dataset.i); } }; });
    $('#bStack').onclick = () => { $('#bb').classList.toggle('stack'); Snd.sfx('pop'); };
    if (S.zona.z2) finishZone('z2');
  },
  help() { say('Garis merah putus-putus menunjukkan ujung bagian berwarna. Letaknya selalu di tengah!'); }
};

/* ----- Zona 3 ----- */
SCENES.z3 = {
  title: 'Zona 3: Menjumlah Pecahan',
  enter() {
    let step = 0, solved = S.zona.z3;
    $('#stage').innerHTML = `<div class="zone">
      <div class="panel">
        <div class="eq"><div class="eqcell" id="v1"></div><span class="op">+</span><div class="eqcell" id="v2"></div><span class="op">=</span><div class="eqcell" id="v3"></div></div>
        <div class="btnrow"><button class="btn" id="bCut">✂️ Potong</button><button class="btn alt" id="bJoin" disabled>🍽️ Gabungkan</button></div>
        <ol class="steps"><li id="st1">Samakan penyebut (cari KPK).</li><li id="st2">Ubah ke pecahan senilai.</li><li id="st3">Jumlahkan pembilangnya.</li></ol>
        <p id="z3say" class="msg">Potongan yang beda ukuran tidak bisa langsung digabung. Samakan dulu ukurannya!</p></div>
      <div class="panel">
        <details class="misk"><summary>🤔 Mengapa ${frac(1, 2)} + ${frac(1, 4)} bukan ${frac(2, 6)}?</summary>
          <p>Karena ${frac(2, 6)} lebih kecil daripada ${frac(1, 2)}. Menambah potongan tidak mungkin membuat jumlah kue jadi lebih sedikit!</p>
          <div style="display:grid;gap:6px">${barHTML(1, 2)}${barHTML(2, 6)}</div>
          <p>Penyebut menunjukkan <b>ukuran potongan</b>, jadi tidak ikut dijumlahkan. Hanya potongan yang <b>sama ukuran</b> yang boleh digabung.</p></details>
        <div class="try"><h4>Coba sendiri: ${frac(1, 3)} + ${frac(1, 6)}</h4>
          <div style="display:grid;gap:6px;max-width:300px;margin:0 auto">${barHTML(1, 3)}${barHTML(1, 6)}</div>
          <div class="inl">= <input id="tn" class="input num" type="number" min="0" inputmode="numeric" aria-label="Pembilang"> / <input id="td" class="input num" type="number" min="1" inputmode="numeric" aria-label="Penyebut"></div>
          <button class="btn" id="bCek">Cek jawaban</button><div id="tmsg" class="msg"></div></div></div></div>`;
    say('Potongan beda ukuran tidak bisa langsung digabung. Samakan dulu!');
    const render = () => {
      const a = step >= 1 ? [2, 4] : [1, 2];
      $('#v1').innerHTML = barHTML(a[0], a[1]) + frac(a[0], a[1]);
      $('#v2').innerHTML = barHTML(1, 4) + frac(1, 4);
      $('#v3').innerHTML = step >= 2 ? barHTML(3, 4) + frac(3, 4) : '<b style="font-size:2rem">?</b>';
      $('#bJoin').disabled = step !== 1; $('#bCut').disabled = step >= 1;
      $('#st1').classList.toggle('ok', step >= 1); $('#st2').classList.toggle('ok', step >= 1); $('#st3').classList.toggle('ok', step >= 2);
    };
    render();
    $('#bCut').onclick = () => { step = 1; Snd.sfx('pop'); $('#z3say').textContent = `${'1/2'} dipotong jadi 2/4. Sekarang ukurannya sama dengan 1/4.`; render(); };
    $('#bJoin').onclick = () => { step = 2; Snd.sfx('ok'); $('#z3say').textContent = '2/4 + 1/4 = 3/4. Pembilang dijumlahkan, penyebut tetap.'; render(); };
    const fin = () => {
      $('#tmsg').className = 'msg good'; $('#tmsg').innerHTML = `Benar! ${frac(2, 6)} + ${frac(1, 6)} = ${frac(3, 6)} = ${frac(1, 2)}`;
      finishZone('z3');
    };
    $('#bCek').onclick = () => {
      const n = parseInt($('#tn').value, 10), d = parseInt($('#td').value, 10);
      if (isNaN(n) || isNaN(d)) { $('#tmsg').className = 'msg bad'; $('#tmsg').textContent = 'Isi pembilang dan penyebut dulu ya.'; return; }
      if (same(n, d, 1, 2)) { logEv('z3 coba 1/3+1/6', 'benar', n + '/' + d); Snd.sfx('ok'); fin(); }
      else {
        S.m.zona3Salah++; Snd.sfx('bad'); logEv('z3 coba 1/3+1/6', 'salah', n + '/' + d);
        if (d === 9) { S.m.tambahPenyebut++; $('#tmsg').textContent = 'Penyebut tidak dijumlahkan! Samakan dulu penyebutnya menjadi 6.'; }
        else $('#tmsg').textContent = 'Belum tepat. Ubah 1/3 menjadi pecahan berpenyebut 6 dulu.';
        $('#tmsg').className = 'msg bad';
      }
    };
    if (solved) finishZone('z3');
  },
  help() { say('Ubah 1/3 menjadi 2/6. Lalu jumlahkan 2/6 + 1/6.'); }
};

/* ============ KUIS CEK PAHAM ============ */
const QUIZ = [
  {
    prompt: 'Berapa pecahan bagian pizza yang berwarna oranye?',
    vis: () => `<div class="qvis">${pizzaSVG(8, new Set([0, 1, 2]), { static: true })}</div>`,
    opts: [{ k: '3/8', h: frac(3, 8) }, { k: '3/5', h: frac(3, 5) }, { k: '5/8', h: frac(5, 8) }, { k: '8/3', h: frac(8, 3) }],
    ans: '3/8', hint: 'Hitung semua potongan (penyebut), lalu potongan yang oranye (pembilang).', zona: 'z1', zname: 'Zona 1'
  },
  {
    prompt: 'Gambar mana yang nilainya sama dengan ½ ini?',
    vis: () => `<div class="qvis">${barHTML(1, 2)}</div>`,
    opts: [{ k: '2/4', h: barHTML(2, 4) }, { k: '1/3', h: barHTML(1, 3) }, { k: '3/8', h: barHTML(3, 8) }, { k: '2/3', h: barHTML(2, 3) }],
    ans: '2/4', hint: 'Cari batang yang bagian berwarnanya sama panjang dengan ½.', zona: 'z2', zname: 'Zona 2'
  },
  {
    prompt: 'Berapa hasil dari ¼ + 2/4 ?',
    vis: () => `<div class="qvis">${barHTML(1, 4)}${barHTML(2, 4)}<p class="center">Potongannya sudah sama besar.</p></div>`,
    opts: [{ k: '3/8', h: frac(3, 8) }, { k: '3/4', h: frac(3, 4) }, { k: '2/8', h: frac(2, 8) }, { k: '1/2', h: frac(1, 2) }],
    ans: '3/4', hint: 'Ukuran potongan sama, jadi hanya pembilang yang dijumlahkan. Penyebut tetap.', zona: 'z3', zname: 'Zona 3'
  }
];
QUIZ.forEach(q => q.shown = shuffle(q.opts));

SCENES.kuis = {
  title: 'Kuis Cek Paham',
  enter() {
    const Q = S.quiz;
    const summary = () => {
      const n = Q.first.filter(x => x === true).length;
      $('#stage').innerHTML = `<div class="card center"><h2>Kuis selesai!</h2><div class="stars">${'⭐'.repeat(n)}${'☆'.repeat(3 - n)}</div>
        <p>Kamu benar pada percobaan pertama: <b>${n} dari 3</b> soal.</p>
        <p class="muted">${n === 3 ? 'Luar biasa! Oven game sudah terbuka.' : 'Tidak apa-apa, kamu bisa mengulang zona belajar kapan saja. Oven game sudah terbuka.'}</p></div>`;
      say(n === 3 ? 'Hebat sekali, Koki Cilik!' : 'Kamu sudah berusaha dengan baik. Yuk lanjut bermain!');
      setNext('Ke Peta Kedai ▶', () => go('peta'));
    };
    const render = () => {
      if (Q.done) return summary();
      const i = Q.i, q = QUIZ[i];
      $('#stage').innerHTML = `<div class="card center"><div class="pill">Soal ${i + 1} dari 3</div><h2>${q.prompt}</h2>${q.vis()}
        <div class="qopts">${q.shown.map(o => `<button class="opt" data-k="${o.k}" aria-label="Jawaban ${o.k}">${o.h}</button>`).join('')}</div>
        <div id="qmsg" class="msg"></div><div id="qlink"></div></div>`;
      say('Cek dulu, Koki Cilik sudah siap belum?');
      $$('.opt').forEach(b => b.onclick = () => answer(b));
    };
    const answer = btn => {
      const i = Q.i, q = QUIZ[i], k = btn.dataset.k;
      Q.tries[i]++;
      if (k === q.ans) {
        Q.first[i] = Q.tries[i] === 1 ? true : false;
        addScore(Q.tries[i] === 1 ? 10 : 5); Snd.sfx('ok');
        btn.classList.add('right'); $$('.opt').forEach(b => b.disabled = true);
        logEv('kuis ' + (i + 1), 'benar', 'percobaan ke-' + Q.tries[i]);
        $('#qmsg').className = 'msg good'; $('#qmsg').textContent = '⭐ Benar! Hebat!';
        say('Jawabanmu benar! Dapat bintang!');
        setNext(i < 2 ? 'Soal berikutnya ▶' : 'Selesai kuis ✔', () => {
          if (i < 2) { Q.i++; render(); } else { Q.done = true; saveLocal(); summary(); }
        });
      } else {
        Q.first[i] = false; Snd.sfx('bad');
        btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 500);
        logEv('kuis ' + (i + 1), 'salah', k);
        if (i === 2 && k === '3/8') S.m.tambahPenyebut++;
        $('#qmsg').className = 'msg bad'; $('#qmsg').textContent = 'Belum tepat. Coba lagi!';
        say('Petunjuk dari Pico: ' + q.hint);
        if (Q.tries[i] >= 2) {
          $('#qlink').innerHTML = `<button class="btn alt" id="qZ">📚 Buka kembali ${q.zname}</button>`;
          $('#qZ').onclick = () => go(q.zona);
        }
      }
    };
    render();
  },
  help() { const q = QUIZ[S.quiz.i]; say(q && !S.quiz.done ? 'Petunjuk: ' + q.hint : 'Kuis sudah selesai.'); }
};
