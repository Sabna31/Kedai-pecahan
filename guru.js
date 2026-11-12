/* Panel Guru: dilindungi PIN. Rekap skor, kunci jawaban, tips miskonsepsi, pengaturan, unduh Excel. */
var G={ok:false,tab:'rekap',rows:[],src:'',msg:'',q:'',f:'',open:null,pin:'',tries:0,until:0,busy:false,hash:''};
var STAT_ORD={'Perlu bimbingan':0,'Belum selesai':1,'Perlu penguatan':2,'Paham':3};
var STAT_CLS={'Perlu bimbingan':'rd','Belum selesai':'gy','Perlu penguatan':'yl','Paham':'gn'};

function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ('0'+b.toString(16)).slice(-2)}).join('')}
function pinHash(pin){
  if(!(window.crypto&&crypto.subtle))return Promise.reject(new Error('nocrypto'));
  var e=new TextEncoder();
  return crypto.subtle.importKey('raw',e.encode(pin),'PBKDF2',false,['deriveBits']).then(function(k){
    return crypto.subtle.deriveBits({name:'PBKDF2',salt:e.encode(KP_CONFIG.PIN_SALT),iterations:KP_CONFIG.PIN_ITER,hash:'SHA-256'},k,256)}).then(hex);
}

/* ---------- masuk ---------- */
function guruLogin(){
  var now=Date.now();
  if(now<G.until){G.msg='Terlalu banyak percobaan. Tunggu '+Math.ceil((G.until-now)/1000)+' detik.';return render()}
  var pin=document.getElementById('pn').value.trim();
  if(!pin){G.msg='Masukkan PIN.';return render()}
  G.busy=true;G.msg='Memeriksa…';render();
  pinHash(pin).then(function(h){
    var localOk=h===KP_CONFIG.PIN_HASH;
    if(!KP_CONFIG.SCRIPT_URL)return localOk?{ok:true,rows:null}:{ok:false};
    return Store.fetchAll(pin).then(function(rows){return {ok:true,rows:rows,src:'Google Sheet'}})
      .catch(function(err){
        if(/PIN/i.test(String(err.message)))return {ok:false};
        return localOk?{ok:true,rows:null,off:true}:{ok:false}; /* server tak terjangkau */
      });
  }).then(function(r){
    G.busy=false;
    if(!r.ok){G.tries++;G.msg='PIN salah.';if(G.tries>=5){G.until=Date.now()+30000;G.tries=0;G.msg='PIN salah 5 kali. Coba lagi dalam 30 detik.'}return render()}
    G.ok=true;G.pin=pin;G.msg='';
    if(r.rows){G.rows=r.rows;G.src=r.src}
    else{G.rows=Store.local();G.src=r.off?'Perangkat ini (server tidak terjangkau)':'Perangkat ini'}
    render();
  }).catch(function(e){G.busy=false;G.msg=e.message==='nocrypto'?'Buka halaman lewat https:// atau localhost agar PIN dapat diperiksa.':'Terjadi kesalahan.';render()});
}
function guruKeluar(){G.ok=false;G.pin='';G.rows=[];G.open=null;S.scr=(S.nama?'map':'home');render()}
function guruRefresh(){
  G.msg='Memuat data…';render();
  var p=KP_CONFIG.SCRIPT_URL?Store.fetchAll(G.pin).then(function(r){G.src='Google Sheet';return r}):Promise.resolve(Store.local()).then(function(r){G.src='Perangkat ini';return r});
  p.then(function(r){G.rows=r;G.msg='Data diperbarui '+new Date().toLocaleTimeString('id-ID');render()})
   .catch(function(){G.rows=Store.local();G.src='Perangkat ini (server tidak terjangkau)';G.msg='Tidak dapat menghubungi Google Sheet.';render()});
}

/* ---------- tampilan ---------- */
function guruScreen(){
  if(!G.ok)return '<div class="card c"><div class="logo">🔒</div><h2>Panel Guru</h2><p class="mut">Masukkan PIN guru untuk melihat rekap siswa.</p>'+
   '<input type="password" id="pn" inputmode="numeric" autocomplete="off" aria-label="PIN guru" placeholder="PIN" onkeydown="if(event.key===\'Enter\')guruLogin()"><br>'+
   (G.msg?'<p class="'+(G.busy?'mut':'bad')+'" role="alert">'+esc(G.msg)+'</p>':'')+
   '<div class="row"><button class="btn" '+(G.busy?'disabled':'')+' onclick="guruLogin()">Masuk</button><button class="ghost" onclick="G.msg=\'\';S.scr=(S.nama?\'map\':\'home\');render()">Kembali</button></div></div>';
  var tabs=[['rekap','Rekap Skor'],['kunci','Kunci Jawaban'],['tips','Tips Miskonsepsi'],['set','Pengaturan']];
  return '<header><b>🍕 Panduan Guru</b><span class="mut sm">'+esc(G.src)+'</span><button class="ghost" onclick="guruKeluar()">Keluar</button></header>'+
   '<div class="tabs" role="tablist">'+tabs.map(function(t){return '<button role="tab" aria-selected="'+(G.tab===t[0])+'" class="tb'+(G.tab===t[0]?' on':'')+'" onclick="G.tab=\''+t[0]+'\';render()">'+t[1]+'</button>'}).join('')+'</div>'+
   (G.msg?'<p class="mut" role="status">'+esc(G.msg)+'</p>':'')+
   {rekap:gRekap,kunci:gKunci,tips:gTips,set:gSet}[G.tab]();
}

function sorted(){
  return G.rows.slice().sort(function(a,b){
    var x=(STAT_ORD[a.status]!=null?STAT_ORD[a.status]:9)-(STAT_ORD[b.status]!=null?STAT_ORD[b.status]:9);
    return x||String(a.kelas).localeCompare(String(b.kelas))||(+a.absen)-(+b.absen);
  });
}
function gRekap(){
  var R=G.rows,n=function(s){return R.filter(function(r){return r.status===s}).length};
  var kend=R.filter(function(r){return r.kendala&&r.kendala!=='-'}).length;
  var card=function(l,v,c){return '<div class="stat '+c+'"><b>'+v+'</b><span>'+l+'</span></div>'};
  var q=G.q.toLowerCase();
  var rows=sorted().filter(function(r){return (!G.f||r.status===G.f||(G.f==='kendala'&&r.kendala&&r.kendala!=='-'))&&(!q||(String(r.nama)+' '+r.kelas).toLowerCase().indexOf(q)>-1)});
  G.vis=rows.map(function(r){return r.id});
  var tb=rows.map(function(r,i){
    var op=G.open===r.id;
    return '<tr class="rw" tabindex="0" onclick="gOpen('+i+')" onkeydown="if(event.key===\'Enter\')gOpen('+i+')"><td><b>'+esc(r.nama)+'</b></td><td>'+esc(r.kelas)+'</td><td>'+esc(r.absen)+'</td><td>'+(r.kuis===''?'-':esc(r.kuis)+'/3')+'</td><td>'+esc(r.bintang)+'/9</td><td>'+esc(r.nilai)+'</td><td><span class="chip '+(STAT_CLS[r.status]||'gy')+'">'+esc(r.status)+'</span></td><td class="kd">'+esc(r.kendala)+'</td></tr>'+
      (op?'<tr class="dt"><td colspan="8">'+gDetail(r)+'</td></tr>':'');
  }).join('');
  return '<div class="stats">'+card('Siswa',R.length,'')+card('Paham',n('Paham'),'gn')+card('Perlu penguatan',n('Perlu penguatan'),'yl')+card('Perlu bimbingan',n('Perlu bimbingan'),'rd')+card('Belum selesai',n('Belum selesai'),'gy')+card('Ada indikasi kesulitan',kend,'rd')+'</div>'+
   '<div class="row bar2"><input type="text" placeholder="Cari nama / kelas" value="'+esc(G.q)+'" oninput="G.q=this.value;gRefreshTable(this)" aria-label="Cari"><select aria-label="Filter status" onchange="G.f=this.value;render()">'+
   [['','Semua status'],['Perlu bimbingan','Perlu bimbingan'],['Belum selesai','Belum selesai'],['Perlu penguatan','Perlu penguatan'],['Paham','Paham'],['kendala','Ada indikasi kesulitan']].map(function(o){return '<option value="'+o[0]+'"'+(G.f===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'+
   '<button class="ghost" onclick="guruRefresh()">⟳ Muat ulang</button><button class="btn g" onclick="guruExcel()">⬇ Unduh Excel</button></div>'+
   (R.length?'<div class="tw"><table><thead><tr><th>Nama</th><th>Kelas</th><th>Abs</th><th>Kuis</th><th>⭐</th><th>Nilai</th><th>Status</th><th>Indikasi kesulitan</th></tr></thead><tbody id="tbd">'+(tb||'<tr><td colspan="8" class="c mut">Tidak ada data yang cocok.</td></tr>')+'</tbody></table></div><p class="mut sm">Klik baris untuk melihat rincian. Urutan: siswa yang paling perlu bantuan di atas. Paham = nilai ≥ '+KP_CONFIG.KKM+'.</p>':'<div class="card c mut">Belum ada siswa yang mengerjakan.</div>');
}
function gOpen(i){var id=G.vis[i];G.open=G.open===id?null:id;render()}
function gRefreshTable(inp){var pos=inp.selectionStart;render();var e=document.querySelector('.bar2 input');if(e){e.focus();e.setSelectionRange(pos,pos)}}
function gDetail(r){
  var it=function(l,v){return '<div><span class="mut">'+l+'</span><br><b>'+esc(v===''||v==null?'-':v)+'</b></div>'};
  return '<div class="dg">'+it('Zona 1 / 2 / 3',r.z1+' / '+r.z2+' / '+r.z3)+it('Kuis 1 / 2 / 3',r.q1+' / '+r.q2+' / '+r.q3)+it('Bintang (Kilat / Senilai / Resep)',r.s1+' / '+r.s2+' / '+r.s3)+
   it('Salah (Kilat / Kartu / Resep)',r.e1+' / '+r.e2+' / '+r.e3)+it('Miskonsepsi 1 / 2 / 3 / 4',r.m1+' / '+r.m2+' / '+r.m3+' / '+r.m4)+it('Petunjuk dipakai',r.hint)+it('Durasi aktif',r.durasi+' menit')+
   it('Perasaan / kemudahan web',r.mood+' / '+r.ease)+it('Bagian tersulit',r.hard)+it('Lencana',r.lencana)+it('Diperbarui',r.upd)+'</div><p><b>Saran:</b> '+esc(r.saran)+'</p>';
}

function gKunci(){
  var li=function(t){return '<li>'+t+'</li>'};
  return '<div class="card"><h2>Kuis Cek Paham</h2><ol>'+KUIS.map(function(q,i){return li('<b>'+q.q+'</b><br>Kunci: <b class="good">'+q.ans+'</b>. '+q.why+'<br><span class="mut">Pengecoh: '+q.dis.map(function(d){return d[0]+' ('+MISK[d[1]].t+')'}).join('; ')+'</span>')}).join('')+'</ol></div>'+
   '<div class="card"><h2>Pesanan Kilat</h2><p>Siswa mengetuk potongan sebanyak pembilang pesanan (mis. 3/8 → 3 potong dari 8). Pesanan acak, 5 per permainan. Bintang: 4–5 benar = ⭐⭐⭐, 3 benar = ⭐⭐, lainnya ⭐.</p></div>'+
   '<div class="card"><h2>Pasangan Senilai</h2><ul>'+PR.map(function(p){return li(p[0][0]+'/'+p[0][1]+' = '+p[1][0]+'/'+p[1][1])}).join('')+'</ul><p class="mut">Bintang: ≤ 7 langkah = ⭐⭐⭐, ≤ 11 = ⭐⭐, lainnya ⭐.</p></div>'+
   '<div class="card"><h2>Resep Ajaib</h2><ul>'+QS.map(function(q){var m=q[0]*q[3]/q[1]+q[2],s=sim(m,q[3]);return li(q[0]+'/'+q[1]+' + '+q[2]+'/'+q[3]+' = <b class="good">'+s[0]+'/'+s[1]+'</b> cangkir'+(s[1]!==q[3]?' (= '+m+'/'+q[3]+')':''))}).join('')+'</ul><p class="mut">Bintang: benar pada percobaan pertama 3 resep = ⭐⭐⭐, 2 resep = ⭐⭐, lainnya ⭐.</p></div>'+
   '<div class="card"><h2>Penilaian</h2><p>Nilai Akhir = Skor Kuis (maks 40) + Bintang Game (maks 60). Paham ≥ '+KP_CONFIG.KKM+'; Perlu penguatan '+KP_CONFIG.CUKUP+'–'+(KP_CONFIG.KKM-1)+'; Perlu bimbingan &lt; '+KP_CONFIG.CUKUP+'. Siswa yang belum menyelesaikan seluruh kegiatan berstatus Belum selesai. Lencana Koki Pecahan: ≥ 7 bintang.</p></div>';
}
function gCount(){var c={};['m1','m2','m3','m4'].forEach(function(m){c[m]=G.rows.filter(function(r){return +r[m]>0}).length});return c}
function gTips(){
  var c=gCount();
  return '<p class="mut">Jumlah siswa dihitung dari data yang tampil di Rekap Skor.</p>'+['m1','m2','m3','m4','m0'].map(function(m){var x=MISK[m];
   return '<div class="card"><h2>'+x.t+(m!=='m0'?' <span class="chip '+(c[m]?'rd':'gn')+'">'+c[m]+' siswa</span>':'')+'</h2><p><b>Ciri:</b> '+x.ciri+'</p><ul>'+x.tips.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></div>'}).join('');
}
function gSet(){
  return '<div class="card"><h2>Sumber data</h2><p>'+(KP_CONFIG.SCRIPT_URL?'Terhubung ke Google Sheet (satu file untuk semua siswa).':'<b class="bad">Belum terhubung ke Google Sheet.</b> Hasil siswa hanya tersimpan di peramban perangkat ini. Ikuti README.md untuk menghubungkan.')+'</p>'+
   (KP_CONFIG.SCRIPT_URL?'<button class="ghost" onclick="guruPing()">Tes koneksi</button>':'')+'</div>'+
   '<div class="card"><h2>Mode pratinjau</h2><p>Buka semua level tanpa menyelesaikan zona dan kuis (untuk guru mencoba). Hanya berlaku di sesi ini.</p><button class="ghost" onclick="guruDemo()">'+(DEMO?'Matikan':'Aktifkan')+' mode pratinjau</button></div>'+
   '<div class="card"><h2>Ganti PIN</h2><p>Ketik PIN baru, lalu salin hasilnya ke <code>PIN_HASH</code> di <code>config.js</code>. Jika memakai Google Sheet, ubah juga properti <code>GURU_PIN</code> di Apps Script.</p><input type="password" id="np" inputmode="numeric" placeholder="PIN baru (6 angka)" autocomplete="off"> <button class="ghost" onclick="guruHash()">Buat hash</button><p><code id="nh" class="wrap"></code></p></div>'+
   '<div class="card"><h2>Data di perangkat ini</h2><p>Hapus salinan data siswa di peramban ini (data di Google Sheet tidak ikut terhapus).</p><button class="ghost" onclick="guruClear()">Hapus data lokal</button></div>';
}
function guruDemo(){DEMO=!DEMO;try{sessionStorage.setItem('kp_demo',DEMO?'1':'0')}catch(e){}render()}
function guruPing(){G.msg='Menguji koneksi…';render();Store.ping().then(function(j){G.msg=j&&j.ok?'Koneksi berhasil.':'Server menjawab, tetapi tidak sesuai.';render()}).catch(function(){G.msg='Tidak dapat menghubungi server.';render()})}
function guruHash(){var p=document.getElementById('np').value.trim();if(!/^\d{6}$/.test(p)){document.getElementById('nh').textContent='PIN harus 6 angka.';return}
  pinHash(p).then(function(h){document.getElementById('nh').textContent=h})}
function guruClear(){if(confirm('Hapus semua data siswa yang tersimpan di perangkat ini?')){Store.clearLocal();G.rows=KP_CONFIG.SCRIPT_URL?G.rows:[];G.msg='Data lokal dihapus.';render()}}

/* ---------- Excel ---------- */
function guruExcel(){
  var rows=sorted(),H=FIELDS.map(function(f){return f[1]});
  var cs=function(s){return {v:s,s:{'Paham':2,'Perlu penguatan':3,'Perlu bimbingan':4}[s]||0}};
  var data=[H].concat(rows.map(function(r){return FIELDS.map(function(f){var v=r[f[0]];if(f[0]==='status')return cs(v);if(f[0]==='kendala'&&v&&v!=='-')return {v:v,s:3};return v==null?'':(/^\d+(\.\d+)?$/.test(String(v))&&f[0]!=='id'&&f[0]!=='kelas'?+v:v)})}));
  var w=FIELDS.map(function(f){return {id:28,upd:19,nama:22,kelas:8,absen:9,status:17,kendala:42,saran:50,hard:18}[f[0]]||(f[0].charAt(0)==='m'&&f[0].length===2?24:14)});
  var c=gCount(),by={};
  rows.forEach(function(r){var k=r.kelas||'-';by[k]=by[k]||{n:0,s:0,p:0};by[k].n++;by[k].s+=+r.nilai||0;if(r.status==='Paham')by[k].p++});
  var sum=[['Ringkasan','Nilai'],['Jumlah siswa',rows.length]].concat(['Paham','Perlu penguatan','Perlu bimbingan','Belum selesai'].map(function(s){return [s,rows.filter(function(r){return r.status===s}).length]}))
    .concat([['',''],['Miskonsepsi','Jumlah siswa terdampak']],['m1','m2','m3','m4'].map(function(m){return [MISK[m].t,c[m]]}))
    .concat([['',''],['Kelas','Rata-rata nilai (jumlah siswa, paham)']],Object.keys(by).sort().map(function(k){return [k,Math.round(by[k].s/by[k].n)+' ('+by[k].n+' siswa, '+by[k].p+' paham)']}));
  var d=new Date(),pad=function(n){return ('0'+n).slice(-2)};
  XLSX.download('Rekap-Kedai-Pecahan-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'.xlsx',[{name:'Rekap Siswa',rows:data,widths:w},{name:'Ringkasan Kelas',rows:sum,widths:[48,40]}]);
}
