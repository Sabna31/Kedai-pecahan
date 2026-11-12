/* Penulis .xlsx mini (tanpa library, bisa dipakai offline).
   XLSX.download('nama.xlsx',[{name:'Sheet',rows:[[..],[..]],widths:[..]}]) ; sel bisa {v:nilai,s:gaya} */
var XLSX=(function(){
  var CT=null,enc=new TextEncoder();
  function crc(u){
    if(!CT){CT=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CT[n]=c>>>0}}
    var r=0xFFFFFFFF;for(var i=0;i<u.length;i++)r=CT[(r^u[i])&255]^(r>>>8);return (r^0xFFFFFFFF)>>>0}
  function esc(s){return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function col(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
  var HEAD='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  var NS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  /* gaya: 0 biasa, 1 header, 2 hijau, 3 kuning, 4 merah */
  var STYLES=HEAD+'<styleSheet '+NS+'><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'+
   '<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
   ['FFE5432D','FFCDEFD8','FFFFE9A6','FFF9C7C0'].map(function(c){return '<fill><patternFill patternType="solid"><fgColor rgb="'+c+'"/><bgColor indexed="64"/></patternFill></fill>'}).join('')+'</fills>'+
   '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
   '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
   '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>'+
   [3,4,5].map(function(f){return '<xf numFmtId="0" fontId="0" fillId="'+f+'" borderId="0" xfId="0" applyFill="1"/>'}).join('')+
   '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function sheetXml(sh){
    var rows=sh.rows,nc=rows.reduce(function(m,r){return Math.max(m,r.length)},1);
    var x=HEAD+'<worksheet '+NS+'><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
    if(sh.widths)x+='<cols>'+sh.widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join('')+'</cols>';
    x+='<sheetData>';
    rows.forEach(function(r,ri){
      x+='<row r="'+(ri+1)+'">';
      r.forEach(function(c,ci){
        var v=c,s=ri===0?1:0;
        if(c&&typeof c==='object'){v=c.v;s=c.s||0}
        var ref=col(ci)+(ri+1),sa=s?' s="'+s+'"':'';
        if(v===''||v==null){if(s)x+='<c r="'+ref+'"'+sa+'/>';return}
        if(typeof v==='number'&&isFinite(v))x+='<c r="'+ref+'"'+sa+'><v>'+v+'</v></c>';
        else x+='<c r="'+ref+'"'+sa+' t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';
      });
      x+='</row>';
    });
    x+='</sheetData>';
    if(rows.length>1)x+='<autoFilter ref="A1:'+col(nc-1)+rows.length+'"/>';
    return x+'</worksheet>';
  }

  function zip(files){
    var chunks=[],central=[],off=0;
    files.forEach(function(f){
      var nm=enc.encode(f.name),c=crc(f.data),sz=f.data.length;
      var h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);
      h.setUint32(14,c,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);h.setUint16(26,nm.length,true);
      chunks.push(new Uint8Array(h.buffer),nm,f.data);
      var d=new DataView(new ArrayBuffer(46));
      d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x0800,true);d.setUint16(14,0x21,true);
      d.setUint32(16,c,true);d.setUint32(20,sz,true);d.setUint32(24,sz,true);d.setUint16(28,nm.length,true);d.setUint32(42,off,true);
      central.push(new Uint8Array(d.buffer),nm);
      off+=30+nm.length+sz;
    });
    var cs=central.reduce(function(a,c){return a+c.length},0);
    var e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
    var all=chunks.concat(central,[new Uint8Array(e.buffer)]);
    var out=new Uint8Array(off+cs+22),p=0;
    all.forEach(function(a){out.set(a,p);p+=a.length});
    return out;
  }

  function build(sheets){
    var F=function(n,s){return {name:n,data:enc.encode(s)}};
    var n=sheets.length,i,ct='',wb='',rl='';
    for(i=1;i<=n;i++){
      ct+='<Override PartName="/xl/worksheets/sheet'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      wb+='<sheet name="'+esc(sheets[i-1].name).slice(0,31)+'" sheetId="'+i+'" r:id="rId'+i+'"/>';
      rl+='<Relationship Id="rId'+i+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+i+'.xml"/>';
    }
    var files=[
      F('[Content_Types].xml',HEAD+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+ct+'</Types>'),
      F('_rels/.rels',HEAD+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      F('xl/workbook.xml',HEAD+'<workbook '+NS+' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+wb+'</sheets></workbook>'),
      F('xl/_rels/workbook.xml.rels',HEAD+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rl+'<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
      F('xl/styles.xml',STYLES)
    ];
    sheets.forEach(function(sh,k){files.push(F('xl/worksheets/sheet'+(k+1)+'.xml',sheetXml(sh)))});
    return zip(files);
  }

  function download(name,sheets){
    var blob=new Blob([build(sheets)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);
  }
  return {build:build,download:download};
})();
