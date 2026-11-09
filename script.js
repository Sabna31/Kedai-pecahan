/* Kedai Pecahan – Web Game Edukasi Matematika Kelas V (materi pecahan)
   Komponen: Pembuka, Zona Belajar Visual, Kuis Cek Paham, Game Edukatif, Penutup, Panduan Guru */
var A=document.getElementById('app');
var S={name:'',kelas:'',scr:'home',done:{},stars:{},quiz:[],qdone:false,demo:false,note:''};
var Z1={n:4,sel:new Set([0])},Z2={s:0,cmp:false},Z3={e:0,st:0},Q=null,L1,L2,L3,R={},LAST={};

/* ---------- utilitas ---------- */
var g=function(a,b){return b?g(b,a%b):a};
var sim=function(m,d){var x=g(m,d);return [m/x,d/x]};
var rnd=function(n){return Math.floor(Math.random()*n)};
var shuf=function(a){return a.map(function(x){return [Math.random(),x]}).sort(function(p,q){return p[0]-q[0]}).map(function(p){return p[1]})};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var fr=function(a,b){return '<span class="fr"><b class="nu">'+a+'</b><i></i><b class="de">'+b+'</b></span>'};
var eq=function(n){return Array(n).fill(360/n)};
var bar=function(n,k){var s='';for(var i=0;i<n;i++)s+='<span class="'+(i<k?'f':'')+'"></span>';return '<div class="bar">'+s+'</div>'};
var pico=function(t){return '<div class="pico"><div class="pi" aria-hidden="true">🍕</div><div class="bub">'+t+'</div></div>'};

function pizza(ang,sel,click){
  var c=110,r=100,t=0,o='';
  var pt=function(a){var x=(a-90)*Math.PI/180;return [(c+r*Math.cos(x)).toFixed(1),(c+r*Math.sin(x)).toFixed(1)]};
  ang.forEach(function(w,i){
    var p=pt(t),q=pt(t+w);t+=w;
    o+='<path tabindex="'+(click?0:-1)+'" role="'+(click?'button':'img')+'" aria-label="potongan '+(i+1)+'" class="sl'+(sel.has(i)?' on':'')+'" d="M'+c+' '+c+'L'+p[0]+' '+p[1]+'A'+r+' '+r+' 0 '+(w>180?1:0)+' 1 '+q[0]+' '+q[1]+'Z"'+(click?' onclick="'+click+'('+i+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){'+click+'('+i+')}"':'')+'/>';
  });
  return '<svg viewBox="0 0 220 220" class="pz'+(click?'':' static')+'">'+o+'</svg>';
}
function go(s){S.scr=s;S.note='';render();window.scrollTo(0,0)}
function stars(){return Object.keys(S.stars).reduce(function(a,k){return a+S.stars[k]},0)}
function zonaSelesai(){return [1,2,3].every(function(z){return S.done[z]})}
function qScore(){return S.quiz.filter(function(x){return x&&x.ok}).length}
function hd(){return '<header class="no-print"><b>🍕 Kedai Pecahan</b>'+(S.scr!=='map'?'<button class="ghost" onclick="go(\'map\')">← Peta</button>':'')+'<span>⭐ '+stars()+'</span></header>'}
function render(){
  var f={home:home,map:map,z1:z1,z2:z2,z3:z3,qz:qz,l1:l1,l2:l2,l3:l3,fin:fin,res:res,guru:guru}[S.scr];
  A.innerHTML=(S.scr==='home'?'':hd())+f();
}
function finish(l,st,msg){S.stars[l]=Math.max(S.stars[l]||0,st);LAST={t:'Level '+l+' selesai!',st:st,msg:msg};go('fin')}

/* ---------- 1. PEMBUKA: judul, identitas siswa, peta kedai, misi ---------- */
function home(){
  return '<div class="card c"><div class="logo">🍕</div><h1>Kedai Pecahan</h1><p class="mut">Belajar pecahan sambil jadi koki cilik · Matematika Kelas V</p>'+
  pico('Halo, Koki Cilik! Misimu: layani pelanggan Kedai Pecahan dengan potongan yang tepat dan selesaikan semua zona di peta kedai!')+
  '<input type="text" id="nm" maxlength="20" placeholder="Nama siswa" value="'+esc(S.name)+'" aria-label="Nama siswa"><br>'+
  '<input type="text" id="kl" maxlength="10" placeholder="Kelas (contoh: 5A)" value="'+esc(S.kelas)+'" aria-label="Kelas"><br>'+
  '<button class="btn" onclick="mulai()">Mulai Misi</button></div>'+
  '<div class="row no-print"><button class="ghost" onclick="S.name=document.getElementById(\'nm\').value.trim();S.kelas=document.getElementById(\'kl\').value.trim();go(\'guru\')">Panduan Guru</button></div>';
}
function mulai(){
  S.name=document.getElementById('nm').value.trim()||'Koki Cilik';
  S.kelas=document.getElementById('kl').value.trim()||'-';
  go('map');
}
function map(){
  var ready=zonaSelesai()&&S.qdone, un=S.demo||ready;
  var zc=function(z,t,d){return '<button class="tile'+(S.done[z]?' ok':'')+'" onclick="go(\'z'+z+'\')"><span>'+(S.done[z]?'✅':['','🍕','📏','➕'][z])+'</span><b>'+t+'</b><small>'+d+'</small></button>'};
  var lc=function(l,t,d){return '<button class="tile'+(un?'':' lock')+'" onclick="'+(un?'go(\'l'+l+'\')':'S.note=\'Selesaikan 3 zona belajar dan kuis cek paham dulu, ya!\';render()')+'"><span>'+(un?['','🧾','🃏','📖'][l]:'🔒')+'</span><b>'+t+'</b><small>'+d+'</small><em>'+('⭐'.repeat(S.stars[l]||0)||'&nbsp;')+'</em></button>'};
  var zk=S.demo||zonaSelesai();
  return pico('Halo, '+esc(S.name)+'! Selesaikan tiga Zona Belajar, lalu Kuis Cek Paham, untuk membuka oven game.')+(S.note?'<p class="bad">'+S.note+'</p>':'')+
  '<h2>Zona Belajar Visual</h2><div class="grid">'+zc(1,'Apa itu pecahan?','Pembilang dan penyebut')+zc(2,'Pecahan senilai','Beda bentuk, nilai sama')+zc(3,'Menjumlah','Samakan penyebut')+'</div>'+
  '<h2>Kuis Cek Paham</h2><div class="grid"><button class="tile wide'+(S.qdone?' ok':'')+(zk?'':' lock')+'" onclick="'+(zk?'qstart()':'S.note=\'Selesaikan 3 zona belajar dulu, ya!\';render()')+'"><span>'+(S.qdone?'✅':zk?'📝':'🔒')+'</span><span style="font-size:inherit;display:flex;flex-direction:column;align-items:flex-start"><b>3 soal bergambar</b><small>'+(S.qdone?'Skor kuis: '+qScore()+' / 3':'Cek pemahamanmu')+'</small></span></button></div>'+
  '<h2>Level Game</h2><div class="grid">'+lc(1,'Pesanan Kilat','Tunjukkan pecahan')+lc(2,'Pasangan Senilai','Cocokkan kartu')+lc(3,'Resep Ajaib','Soal cerita')+'</div>'+
  '<div class="row no-print"><button class="ghost" onclick="S.demo=!S.demo;render()">'+(S.demo?'Matikan':'Aktifkan')+' mode demo (buka semua level)</button><button class="btn g" onclick="go(\'res\')">Lihat hasil</button></div>'+
  '<div class="row no-print"><button class="ghost" onclick="go(\'guru\')">Panduan Guru</button></div>';
}

/* ---------- 2. ZONA BELAJAR VISUAL ---------- */
/* Zona 1: konsep pecahan */
function z1box(){return pizza(eq(Z1.n),Z1.sel,'z1t')+'<div class="c big">'+fr(Z1.sel.size,Z1.n)+'</div><p class="c">Kamu mengambil <b class="nu">'+Z1.sel.size+'</b> dari <b class="de">'+Z1.n+'</b> potong yang sama besar.</p>'}
function z1n(v){Z1.n=+v;Z1.sel=new Set([...Z1.sel].filter(function(i){return i<Z1.n}));document.getElementById('zn').textContent=Z1.n;document.getElementById('z1b').innerHTML=z1box()}
function z1t(i){Z1.sel.has(i)?Z1.sel.delete(i):Z1.sel.add(i);document.getElementById('z1b').innerHTML=z1box()}
function z1(){return pico('Penyebut = jumlah seluruh potongan yang sama besar. Pembilang = potongan yang diambil.')+'<div class="card"><label>Geser untuk mengubah jumlah potongan: <b id="zn">'+Z1.n+'</b></label><input type="range" min="2" max="8" value="'+Z1.n+'" oninput="z1n(this.value)" aria-label="Jumlah potongan"><p class="mut">Ketuk potongan pizza untuk mengambilnya.</p><div id="z1b">'+z1box()+'</div></div><div class="card"><b class="bad">✗ Bukan pecahan</b>'+pizza([200,100,60],new Set([0]),null)+'<p class="c">Potongannya tidak sama besar, jadi tidak bisa disebut pecahan.</p></div><div class="row"><button class="btn g" onclick="S.done[1]=true;go(\'map\')">Selesai zona ini</button></div>'}

/* Zona 2: pecahan senilai */
var SETS=[[[1,2],[2,4],[4,8]],[[1,3],[2,6],[3,9]]];
function z2(){var st=SETS[Z2.s],pos=st[0][0]/st[0][1]*100;
  return pico('Lihat batang-batang ini! Bentuknya beda, tapi apakah nilainya sama?')+'<div class="card"><div class="row" style="margin-top:0"><button class="ghost" onclick="Z2.s=0;Z2.cmp=false;render()">Set 1/2</button><button class="ghost" onclick="Z2.s=1;Z2.cmp=false;render()">Set 1/3</button></div><div class="bw">'+st.map(function(p){return '<div class="lab">'+fr(p[0],p[1])+'</div>'+bar(p[1],p[0])}).join('')+(Z2.cmp?'<u style="left:'+pos+'%"></u>':'')+'</div><div class="row"><button class="btn" onclick="Z2.cmp=!Z2.cmp;render()">'+(Z2.cmp?'Sembunyikan garis':'Bandingkan')+'</button></div>'+(Z2.cmp?'<p class="good c">Semua batang berakhir di garis yang sama, jadi '+st.map(function(p){return p[0]+'/'+p[1]}).join(' = ')+'.</p>':'')+'</div><div class="row"><button class="btn g" onclick="S.done[2]=true;go(\'map\')">Selesai zona ini</button></div>'}

/* Zona 3: penjumlahan pecahan */
var E=[[1,2,1,4],[1,3,1,6]];
function z3(){var a=E[Z3.e][0],b=E[Z3.e][1],c=E[Z3.e][2],d=E[Z3.e][3],m=a*d/b,s=sim(m+c,d),t=Z3.st,x='';
  if(t===0)x='<div class="lab">'+fr(a,b)+'</div>'+bar(b,a)+'<div class="lab">'+fr(c,d)+'</div>'+bar(d,c)+'<p>Potongannya beda ukuran, jadi belum bisa langsung digabung.</p>';
  else if(t===1)x='<div class="lab">'+fr(a,b)+' = '+fr(m,d)+'</div>'+bar(d,m)+'<div class="lab">'+fr(c,d)+'</div>'+bar(d,c)+'<p>Samakan ukuran potongan (penyebut sama). Nilainya tidak berubah.</p>';
  else if(t===2)x='<div class="lab">'+fr(m,d)+' + '+fr(c,d)+' = '+fr(m+c,d)+(s[1]!==d?' = '+fr(s[0],s[1]):'')+'</div>'+bar(d,m+c)+'<p>Potongannya sudah sama besar, tinggal jumlahkan pembilangnya.</p>';
  else x='<p>Mengapa bukan '+fr(a+c,b+d)+'? Karena '+(a+c)+'/'+(b+d)+' lebih kecil dari '+a+'/'+b+', padahal kita sedang menambah. <b class="bad">Penyebut tidak ikut dijumlahkan!</b></p>';
  return pico('Yuk jumlahkan '+a+'/'+b+' + '+c+'/'+d+' langkah demi langkah.')+'<div class="card"><div class="row" style="margin-top:0"><button class="ghost" onclick="Z3={e:0,st:0};render()">1/2 + 1/4</button><button class="ghost" onclick="Z3={e:1,st:0};render()">1/3 + 1/6</button></div>'+x+'<div class="row">'+(t<3?'<button class="btn" onclick="Z3.st++;render()">Langkah berikutnya</button>':'<button class="btn g" onclick="S.done[3]=true;go(\'map\')">Selesai zona ini</button>')+(t>0?'<button class="ghost" onclick="Z3.st=0;render()">Ulangi</button>':'')+'</div></div>'}

/* ---------- 3. KUIS CEK PAHAM (3 soal bergambar, asesmen formatif) ---------- */
var QZ=[
  {q:'Berapa pecahan bagian pizza yang berwarna merah?',img:function(){return pizza(eq(8),new Set([0,1,2]),null)},
   key:'3/8',opts:[['3/8',''],['3/5','Membandingkan bagian merah dengan bagian tidak merah, bukan dengan seluruh potongan.'],['5/8','Menghitung potongan yang tidak berwarna.']],
   why:'Pizza dibagi 8 potong sama besar (penyebut 8) dan 3 potong berwarna merah (pembilang 3).'},
  {q:'Batang manakah yang nilainya sama dengan batang pertama (1/2)?',img:function(){return '<div class="lab">Batang pertama</div>'+bar(2,1)+'<div class="lab">Batang kedua</div>'+bar(4,2)},
   key:'2/4',opts:[['2/4',''],['1/4','Mengira angka pembilang yang sama berarti nilainya sama.'],['2/3','Menganggap angka yang lebih besar berarti nilainya sama atau lebih besar.']],
   why:'Batang kedua terisi sampai garis yang sama dengan batang pertama, jadi 1/2 = 2/4.'},
  {q:'Perhatikan gambar. Berapa hasil 1/4 + 2/4 ?',img:function(){return '<div class="lab">'+fr(1,4)+' + '+fr(2,4)+'</div>'+bar(4,1)+bar(4,2)},
   key:'3/4',opts:[['3/4',''],['3/8','Menjumlahkan penyebut juga (4 + 4 = 8).'],['2/8','Mengalikan pembilang dan menjumlahkan penyebut.']],
   why:'Penyebutnya sudah sama, jadi pembilang dijumlahkan: 1 + 2 = 3. Hasilnya 3/4.'}
];
function qstart(){Q={i:0,pick:-1,opts:null};S.quiz=[];S.qdone=false;go('qz')}
function qz(){
  if(!Q)Q={i:0,pick:-1,opts:null};
  var q=QZ[Q.i];
  if(!Q.opts)Q.opts=shuf(q.opts.map(function(o){return {t:o[0],mis:o[1]}}));
  var o=Q.opts.map(function(x,j){
    var cls=Q.pick===j?(x.t===q.key?' r':' w'):(Q.pick>-1&&x.t===q.key?' r':'');
    return '<button class="btn opt'+cls+'" onclick="qp('+j+')">'+x.t+'</button>'}).join('');
  var fb='';
  if(Q.pick>-1){var ok=Q.opts[Q.pick].t===q.key;
    fb='<p>'+(ok?'<span class="good">Benar! ':'<span class="bad">Belum tepat. ')+'</span>'+q.why+'</p><div class="row"><button class="btn g" onclick="qn()">'+(Q.i<2?'Soal berikutnya':'Selesai kuis')+'</button></div>'}
  return pico('Kuis cek paham · soal '+(Q.i+1)+' dari 3. Lihat gambarnya dengan teliti!')+'<div class="prog"><span style="width:'+(Q.i/3*100)+'%"></span></div><div class="card"><p><b>'+q.q+'</b></p><div class="c">'+q.img()+'</div>'+o+fb+'</div>'}
function qp(j){if(Q.pick>-1)return;Q.pick=j;var q=QZ[Q.i],x=Q.opts[j];S.quiz[Q.i]={ok:x.t===q.key,pick:x.t,mis:x.mis};render()}
function qn(){
  if(Q.i<2){Q={i:Q.i+1,pick:-1,opts:null};render()}
  else{Q=null;S.qdone=true;var s=qScore();LAST={t:'Kuis Cek Paham selesai!',st:s,msg:'Skor kuismu '+s+' dari 3 soal.'+(s<3?' Ulangi zona yang masih membingungkan sebelum bermain.':' Hebat, kamu siap membuka oven game!')};go('fin')}
}

/* ---------- 4. GAME EDUKATIF ---------- */
/* Level 1: Pesanan Kilat */
function newOrder(){var n=[4,6,8][rnd(3)];return {n:n,k:1+rnd(n-1),sel:new Set(),fb:'',done:false}}
function l1(){if(!L1)L1=Object.assign({i:0,ok:0},newOrder());
  var o=L1;
  return pico('Pesanan '+(o.i+1)+' dari 5. Layani dengan tepat!')+'<div class="card c"><div class="big">Aku mau '+fr(o.k,o.n)+' pizza!</div>'+pizza(eq(o.n),o.sel,'l1t')+(o.fb?'<p>'+o.fb+'</p>':'<p class="mut">Ketuk potongan sesuai pesanan.</p>')+'<div class="row">'+(o.done?'<button class="btn" onclick="l1n()">Lanjut</button>':'<button class="btn" onclick="l1c()">Layani</button>')+'</div></div>'}
function l1t(i){if(L1.done)return;L1.sel.has(i)?L1.sel.delete(i):L1.sel.add(i);render()}
function l1c(){var o=L1;if(!o.sel.size){o.fb='<span class="bad">Pilih dulu potongannya.</span>';return render()}
  if(o.sel.size===o.k){o.ok++;o.fb='<span class="good">Pas! Pelanggan senang. +10 poin 🎉</span>'}else o.fb='<span class="bad">Kamu mengambil '+o.sel.size+' potong, padahal pesanannya '+o.k+' dari '+o.n+' potong.</span>';
  o.done=true;render()}
function l1n(){var ok=L1.ok,i=L1.i+1;if(i>=5){L1=null;finish(1,ok>=4?3:ok>=3?2:1,'Kamu melayani '+ok+' dari 5 pesanan dengan benar.')}else{L1=Object.assign({i:i,ok:ok},newOrder());render()}}

/* Level 2: Pasangan Senilai (kartu memori) */
var PR=[[[1,2],[2,4]],[[1,3],[2,6]],[[3,4],[6,8]],[[1,4],[2,8]]];
function l2init(){var c=[];PR.forEach(function(p,i){c.push({p:i,v:p[0],b:0});c.push({p:i,v:p[1],b:1})});L2={c:shuf(c),f:[],m:new Set(),mv:0,lock:false}}
function l2(){if(!L2)l2init();
  var h=L2.c.map(function(k,i){var open=L2.f.indexOf(i)>-1||L2.m.has(k.p);
    return '<button class="mc'+(L2.m.has(k.p)?' m':open?' o':'')+'" onclick="l2f('+i+')" aria-label="kartu '+(i+1)+'">'+(open?fr(k.v[0],k.v[1])+(k.b?bar(k.v[1],k.v[0]):''):'?')+'</button>'}).join('');
  return pico('Temukan dua kartu yang nilainya sama. Langkah: '+L2.mv)+'<div class="mg">'+h+'</div>'}
function l2f(i){if(L2.lock||L2.f.indexOf(i)>-1||L2.m.has(L2.c[i].p))return;L2.f.push(i);render();
  if(L2.f.length===2){L2.mv++;var a=L2.c[L2.f[0]],b=L2.c[L2.f[1]];L2.lock=true;
    setTimeout(function(){if(!L2)return;if(a.p===b.p)L2.m.add(a.p);L2.f=[];L2.lock=false;
      if(L2.m.size===PR.length){var mv=L2.mv;L2=null;finish(2,mv<=7?3:mv<=11?2:1,'Semua pasangan ketemu dalam '+mv+' langkah.')}else if(S.scr==='l2')render()},800)}}

/* Level 3: Resep Ajaib (soal cerita) */
var QS=[[1,3,1,6],[1,2,1,4],[2,5,1,10]];
function l3(){if(!L3)L3={i:0,ok:0,miss:false,hint:false,done:false,pick:-1,opts:null};
  var q=QS[L3.i],a=q[0],b=q[1],c=q[2],d=q[3],m=a*d/b+c,s=sim(m,d),ans=s[0]+'/'+s[1];
  if(!L3.opts)L3.opts=shuf([ans,(a+c)+'/'+(b+d),(a+c)+'/'+d]);
  var o=L3.opts.map(function(t,j){var cls=L3.pick===j?(t===ans?' r':' w'):(L3.done&&t===ans?' r':'');return '<button class="btn opt'+cls+'" onclick="l3p('+j+')">'+t+' cangkir</button>'}).join('');
  return pico('Resep '+(L3.i+1)+' dari 3. Baca resepnya dengan teliti!')+'<div class="card"><p>📖 Kue ini butuh <b>'+a+'/'+b+'</b> cangkir gula, lalu ditambah <b>'+c+'/'+d+'</b> cangkir gula. Berapa cangkir gula semuanya?</p>'+(L3.hint?'<p class="mut">Petunjuk: samakan penyebutnya dulu. '+a+'/'+b+' = '+(a*d/b)+'/'+d+'.</p>':'<button class="ghost" onclick="L3.hint=true;render()">Minta petunjuk</button>')+o+(L3.pick>-1?'<p>'+(L3.opts[L3.pick]===ans?'<span class="good">Benar! '+(a*d/b)+'/'+d+' + '+c+'/'+d+' = '+m+'/'+d+(s[1]!==d?' = '+ans:'')+'.</span>':'<span class="bad">Belum tepat. Ingat, penyebut tidak ikut dijumlahkan. Coba lagi!</span>')+'</p>':'')+(L3.done?'<div class="row"><button class="btn g" onclick="l3n()">Lanjut</button></div>':'')+'</div>'}
function l3p(j){if(L3.done)return;L3.pick=j;var q=QS[L3.i],s=sim(q[0]*q[3]/q[1]+q[2],q[3]);if(L3.opts[j]===s[0]+'/'+s[1]){L3.done=true;if(!L3.miss)L3.ok++}else L3.miss=true;render()}
function l3n(){var ok=L3.ok,i=L3.i+1;if(i>=3){L3=null;finish(3,ok>=3?3:ok>=2?2:1,'Kamu benar pada percobaan pertama di '+ok+' dari 3 resep.')}else{L3={i:i,ok:ok,miss:false,hint:false,done:false,pick:-1,opts:null};render()}}

/* ---------- 5. PENUTUP: skor, lencana, refleksi ---------- */
function fin(){return '<div class="card c"><h2>'+LAST.t+'</h2><div class="stars" aria-label="'+LAST.st+' bintang">'+'⭐'.repeat(LAST.st)+'</div><p>'+LAST.msg+'</p><div class="row"><button class="btn" onclick="go(\'map\')">Kembali ke peta</button></div></div>'}
function res(){var t=stars();
  return '<div class="card c"><h2>Hasil '+esc(S.name)+'</h2><div class="stars">⭐ '+t+' / 9</div><p>'+(t>=7?'🏅 Lencana <b>Koki Pecahan</b> kamu dapatkan!':'Kumpulkan 7 bintang untuk lencana Koki Pecahan.')+'</p><p class="mut">Zona selesai: '+Object.keys(S.done).length+' dari 3 · Kuis cek paham '+(S.qdone?qScore()+'/3':'belum') +' · Pesanan Kilat '+(S.stars[1]||0)+' · Pasangan Senilai '+(S.stars[2]||0)+' · Resep Ajaib '+(S.stars[3]||0)+'</p></div>'+
  '<div class="card"><b>Refleksi:</b> bagaimana perasaanmu belajar pecahan hari ini?<div class="row">'+['😄','🙂','😕'].map(function(e){return '<button class="ghost" onclick="R.mood=\''+e+'\';render()" style="'+(R.mood===e?'border-color:var(--bas)':'')+'">'+e+'</button>'}).join('')+'</div><p>Bagian mana yang paling sulit?</p><div class="row">'+['Apa itu pecahan','Pecahan senilai','Menjumlah'].map(function(e){return '<button class="ghost" onclick="R.hard=\''+e+'\';render()" style="'+(R.hard===e?'border-color:var(--bas)':'')+'">'+e+'</button>'}).join('')+'</div>'+(R.mood&&R.hard?'<p class="good">Terima kasih, '+esc(S.name)+'! Ulangi zona “'+R.hard+'” kapan pun kamu mau.</p>':'')+'</div><div class="row"><button class="btn" onclick="go(\'map\')">Kembali ke peta</button></div>'}

/* ---------- 6. PANDUAN GURU: rekap skor, kunci jawaban, tips miskonsepsi ---------- */
function guru(){
  var nm=S.name||'(belum diisi)',kl=S.kelas||'-';
  var rekap='<div class="card"><h2>Rekap Skor</h2><div class="tw"><table class="t"><tr><th>Nama</th><td>'+esc(nm)+'</td></tr><tr><th>Kelas</th><td>'+esc(kl)+'</td></tr>'+
    '<tr><th>Zona belajar selesai</th><td>'+Object.keys(S.done).length+' dari 3</td></tr>'+
    '<tr><th>Kuis cek paham</th><td>'+(S.qdone?qScore()+' dari 3':'belum dikerjakan')+'</td></tr>'+
    '<tr><th>Pesanan Kilat</th><td>'+(S.stars[1]||0)+' / 3 bintang</td></tr>'+
    '<tr><th>Pasangan Senilai</th><td>'+(S.stars[2]||0)+' / 3 bintang</td></tr>'+
    '<tr><th>Resep Ajaib</th><td>'+(S.stars[3]||0)+' / 3 bintang</td></tr>'+
    '<tr><th>Total bintang</th><td>'+stars()+' / 9 '+(stars()>=7?'(lencana diperoleh)':'')+'</td></tr>'+
    '<tr><th>Refleksi siswa</th><td>Perasaan: '+(R.mood||'-')+' · Tersulit: '+(R.hard||'-')+'</td></tr></table></div>';
  if(S.quiz.length){rekap+='<h3>Jawaban kuis siswa</h3><div class="tw"><table class="t"><tr><th>Soal</th><th>Jawaban</th><th>Hasil</th></tr>'+QZ.map(function(q,i){var a=S.quiz[i];return '<tr><td>'+(i+1)+'</td><td>'+(a?a.pick:'-')+'</td><td>'+(a?(a.ok?'Benar':'Salah'+(a.mis?' – '+a.mis:'')):'-')+'</td></tr>'}).join('')+'</table></div>'}
  rekap+='</div>';
  var kunci='<div class="card"><h2>Kunci Jawaban</h2><h3>Kuis Cek Paham</h3><ol>'+QZ.map(function(q){return '<li>'+q.q+' <b>'+q.key+'</b>. '+q.why+'</li>'}).join('')+'</ol>'+
    '<h3>Pesanan Kilat</h3><p>Jawaban benar jika jumlah potongan yang diambil sama dengan pembilang pesanan. Bintang: 4–5 benar = 3, 3 benar = 2, selebihnya = 1.</p>'+
    '<h3>Pasangan Senilai</h3><p>Pasangan benar: 1/2 = 2/4, 1/3 = 2/6, 3/4 = 6/8, 1/4 = 2/8. Bintang: ≤7 langkah = 3, ≤11 langkah = 2, selebihnya = 1.</p>'+
    '<h3>Resep Ajaib</h3><ol>'+QS.map(function(q){var m=q[0]*q[3]/q[1]+q[2],s=sim(m,q[3]);return '<li>'+q[0]+'/'+q[1]+' + '+q[2]+'/'+q[3]+' = '+m+'/'+q[3]+(s[1]!==q[3]?' = '+s[0]+'/'+s[1]:'')+' cangkir</li>'}).join('')+'</ol></div>';
  var tips='<div class="card"><h2>Tips Mengatasi Miskonsepsi</h2>'+
    [['Potongan tidak sama besar tetap disebut pecahan','Tunjukkan lagi pizza tidak sama besar di Zona 1. Tekankan syarat “bagian yang sama besar” dan minta siswa membagi ulang gambar.'],
     ['Penyebut ikut dijumlahkan (1/4 + 2/4 = 3/8)','Gunakan batang pecahan: potongan seukuran seperempat tetap seukuran seperempat setelah digabung. Tanyakan: apakah hasilnya boleh lebih kecil dari 1/4?'],
     ['Angka lebih besar berarti nilai lebih besar (misalnya 1/8 dianggap lebih besar dari 1/4)','Bandingkan dua pizza yang sama besar: makin banyak potongan, makin kecil tiap potongan. Biarkan siswa memotong sendiri.'],
     ['Pecahan senilai dianggap harus berpembilang sama (1/2 dan 1/4)','Gunakan garis pembanding di Zona 2 agar siswa melihat bahwa nilai ditentukan oleh panjang bagian yang terisi, bukan angkanya.'],
     ['Membandingkan bagian berwarna dengan bagian tidak berwarna (3/5 untuk 3 dari 8)','Minta siswa menghitung seluruh potongan lebih dulu untuk menentukan penyebut, baru menghitung bagian yang diambil.']
    ].map(function(t){return '<div class="mis"><b>'+t[0]+'</b><br>'+t[1]+'</div>'}).join('')+'</div>';
  return '<h1 style="font-size:32px">Panduan Guru</h1>'+(S.scr==='guru'&&!S.name&&S.scr==='guru'?'':'')+rekap+kunci+tips+'<div class="row no-print"><button class="btn" onclick="window.print()">Cetak halaman</button><button class="ghost" onclick="go(S.name?\'map\':\'home\')">Kembali</button></div>';
}

render();
