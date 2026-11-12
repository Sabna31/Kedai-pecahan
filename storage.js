/* Penyimpanan: selalu simpan di peramban, lalu kirim ke Google Sheet (jika SCRIPT_URL diisi).
   Jika sedang offline, antrean dikirim ulang otomatis saat ada koneksi. */
var Store=(function(){
  var REC='kp_rec',PEND='kp_pend',ST='kp_st_',url=function(){return KP_CONFIG.SCRIPT_URL};
  var status=url()?'ok':'off',cb=function(){},busy=false;
  function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
  function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function setStatus(s){status=s;cb(s)}

  function post(payload){
    var ctl=window.AbortController?new AbortController():null,t=setTimeout(function(){ctl&&ctl.abort()},20000);
    return fetch(url(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:ctl?ctl.signal:undefined})
      .then(function(r){clearTimeout(t);return r.json()});
  }
  function payload(r){return {action:'save',headers:FIELDS.map(function(f){return f[1]}),id:r.id,values:FIELDS.map(function(f){var v=r[f[0]];return v==null?'':v})}}

  function flush(){
    if(!url()||busy)return;
    var q=jget(PEND,[]);if(!q.length){setStatus('ok');return}
    busy=true;setStatus('wait');
    var id=q[0],all=jget(REC,{}),r=all[id];
    var done=function(){var p=jget(PEND,[]).filter(function(x){return x!==id});jset(PEND,p);busy=false;flush()};
    if(!r){done();return}
    post(payload(r)).then(function(j){if(j&&j.ok)done();else throw new Error(j&&j.error||'gagal')})
      .catch(function(){busy=false;setStatus('err')});
  }
  window.addEventListener('online',flush);

  return {
    onStatus:function(f){cb=f;f(status)},
    status:function(){return status},
    save:function(r){
      var all=jget(REC,{});all[r.id]=r;jset(REC,all);
      if(url()){var q=jget(PEND,[]);if(q.indexOf(r.id)<0)q.push(r.id);jset(PEND,q);flush()}
    },
    retry:flush,
    local:function(){var a=jget(REC,{});return Object.keys(a).map(function(k){return a[k]})},
    clearLocal:function(){jset(REC,{});jset(PEND,[])},
    loadState:function(id){return jget(ST+id,null)},
    saveState:function(id,s){jset(ST+id,s)},
    /* untuk panel guru: ambil semua baris dari Google Sheet */
    fetchAll:function(pin){
      return post({action:'list',pin:pin}).then(function(j){
        if(!j||!j.ok)throw new Error(j&&j.error||'gagal');
        var idx={};FIELDS.forEach(function(f,i){idx[f[1]]=f[0]});
        return j.rows.filter(function(r){return r[0]!==''}).map(function(r){var o={};j.headers.forEach(function(h,i){if(idx[h])o[idx[h]]=r[i]});return o});
      });
    },
    ping:function(){return post({action:'ping'})}
  };
})();
