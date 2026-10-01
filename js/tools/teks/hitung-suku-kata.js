import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id":"hitung-suku-kata","name":"Hitung Suku Kata","cat":"teks","icon":"🗣️","desc":"Estimasi suku kata per kata Bahasa Indonesia.","keywords":"suku kata,puisi,pantun,bahasa indonesia,hitung"};

function sukuKata(kata){
  let w=String(kata).toLowerCase().replace(/[^a-z]/g,'');
  if(!w)return 0;
  // diftong ai, au, oi dihitung 1 suku kata
  w=w.replace(/ai|au|oi/g,'V');
  // 'i' diikuti vokal dibaca 1 suku (in-do-ne-sya, ma-nu-sya)
  w=w.replace(/i(?=[aiueo])/g,'y');
  // vokal rangkap identik = 2 suku (sa-at, ma-af)
  const dobel=(w.match(/([aiueo])\1/g)||[]).length;
  const gugus=w.match(/[aiueoV]+/g);
  return (gugus?gugus.length:0)+dobel;
}

export function render(root){
  const taIn=T.ta(5,'Ketik atau tempel teks di sini…','Pergi ke pasar membeli mangga');
  const box=T.out();
  const chip=(w,n)=>'<span style="display:inline-block;background:#1c1712;border:1px solid #3a2f22;border-radius:20px;padding:4px 12px;margin:0 6px 8px 0;font-size:13px">'+T.esc(w)+' <b>'+n+'</b></span>';
  const hitung=()=>{
    const words=taIn.value.match(/[a-zA-Z]+/g)||[];
    if(!words.length){T.hide(box);return;}
    let total=0;
    const chips=words.map((w)=>{const n=sukuKata(w);total+=n;return chip(w,n);}).join('');
    T.show(box,
      '<div style="margin-bottom:10px">'+chips+'</div>'+
      '<div class="kv"><span>Total suku kata</span><b>'+total+'</b></div>'+
      '<div class="kv"><span>Total kata</span><b>'+words.length+'</b></div>'+
      '<div class="kv"><span>Rata-rata per kata</span><b>'+(total/words.length).toFixed(1)+'</b></div>');
  };
  taIn.addEventListener('input',hitung);
  T.onLeave(()=>taIn.removeEventListener('input',hitung));

  root.appendChild(T.field('Teks',taIn,'Contoh: "makan" = 2, "Indonesia" = 4.'));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Estimasi dengan heuristik gugus vokal + koreksi diftong (ai, au, oi). Berguna buat ngecek rima pantun &amp; puisi — hasil bukan fonetik sempurna ya.</div>'));
  hitung();
}
