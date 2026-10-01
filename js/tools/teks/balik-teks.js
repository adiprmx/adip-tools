import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"balik-teks","name":"Teks Terbalik","cat":"teks","icon":"🙃","desc":"Teks upside-down unicode atau dibalik urutannya.","keywords":"terbalik,upside down,reverse,teks,flip"};

const FLIP={a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ı',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
  '0':'0','1':'Ɩ','2':'ᘔ','3':'Ɛ','6':'9','8':'8','9':'6',
  '.':'˙',',':"'",'!':'¡','?':'¿',"'":',','"':'„','(':')',')':'(','[':']',']':'[','{':'}','}':'{','_':'‾'};

function upsideDown(s){
  return [...s.toLowerCase()].map((c)=>FLIP[c]||c).reverse().join('');
}
function reverseStr(s){
  return [...s].reverse().join('');
}

export function render(root){
  let mode='flip',lastRes='';
  const taIn=T.ta(5,'Ketik teks di sini, hasil muncul otomatis…');
  const box=T.out();
  const bFlip=T.btn('🙃 Upside-down',null,true);
  const bRev=T.btn('⬅ Reverse biasa',null);
  const go=()=>{
    const s=taIn.value;
    if(!s){T.hide(box);lastRes='';return;}
    lastRes=mode==='flip'?upsideDown(s):reverseStr(s);
    T.show(box,'<pre class="pre" style="font-size:20px;line-height:1.7">'+T.esc(lastRes)+'</pre>');
  };
  const setMode=(m)=>{
    mode=m;
    bFlip.classList.toggle('primary',m==='flip');
    bRev.classList.toggle('primary',m==='rev');
    go();
  };
  bFlip.addEventListener('click',()=>setMode('flip'));
  bRev.addEventListener('click',()=>setMode('rev'));
  taIn.addEventListener('input',go);
  T.onLeave(()=>taIn.removeEventListener('input',go));

  root.appendChild(T.row(bFlip,bRev));
  root.appendChild(T.field('Teks',taIn,'Contoh: "halo" → upside-down jadi "olɐɥ".'));
  root.appendChild(T.row(T.copyBtn(()=>lastRes,'Salin hasil')));
  root.appendChild(box);
}
