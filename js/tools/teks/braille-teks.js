import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id":"braille-teks","name":"Teks ke Braille","cat":"teks","icon":"⠿","desc":"Konversi dua arah teks Latin ↔ huruf braille Unicode.","keywords":"braille,tunanetra,konversi,teks,aksara"};

const L2B={a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵'};
const D2B={'1':'⠁','2':'⠃','3':'⠉','4':'⠙','5':'⠑','6':'⠋','7':'⠛','8':'⠓','9':'⠊','0':'⠚'};
const NUM='⠼',BLANK='⠀';
const B2L={};for(const k in L2B)B2L[L2B[k]]=k;
const B2D={};for(const k in D2B)B2D[D2B[k]]=k;

function toBraille(s){
  let out='',digit=false;
  for(const ch of s.toLowerCase()){
    if(ch>='0'&&ch<='9'){if(!digit){out+=NUM;digit=true;}out+=D2B[ch];continue;}
    digit=false;
    if(ch>='a'&&ch<='z')out+=L2B[ch];
    else if(ch===' ')out+=BLANK;
    else out+=ch;
  }
  return out;
}
function fromBraille(s){
  let out='',digit=false;
  for(const ch of s){
    if(ch===NUM){digit=true;continue;}
    if(ch===BLANK){out+=' ';digit=false;continue;}
    if(digit&&B2D[ch]){out+=B2D[ch];continue;}
    digit=false;
    out+=B2L[ch]||ch;
  }
  return out;
}

export function render(root){
  let mode='l2b',lastRes='';
  const taIn=T.ta(5,'Ketik teks di sini, hasil muncul otomatis…');
  const box=T.out();
  const bL2B=T.btn('Latin → Braille',null,true);
  const bB2L=T.btn('Braille → Latin',null);
  const go=()=>{
    const s=taIn.value;
    if(!s.trim()){T.hide(box);lastRes='';return;}
    lastRes=mode==='l2b'?toBraille(s):fromBraille(s);
    T.show(box,'<pre class="pre" style="font-size:22px;line-height:1.9;letter-spacing:2px">'+T.esc(lastRes)+'</pre>');
  };
  const setMode=(m)=>{
    mode=m;
    bL2B.classList.toggle('primary',m==='l2b');
    bB2L.classList.toggle('primary',m==='b2l');
    taIn.placeholder=m==='l2b'?'Ketik teks di sini, hasil muncul otomatis…':'Tempel pola braille di sini, hasil muncul otomatis…';
    go();
  };
  bL2B.addEventListener('click',()=>setMode('l2b'));
  bB2L.addEventListener('click',()=>setMode('b2l'));
  taIn.addEventListener('input',go);
  T.onLeave(()=>taIn.removeEventListener('input',go));

  root.appendChild(T.row(bL2B,bB2L));
  root.appendChild(T.field('Teks',taIn));
  root.appendChild(T.row(T.copyBtn(()=>lastRes,'Salin hasil')));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Angka otomatis diawali ⠼ (tanda angka): 2026 → ⠼⠃⠚⠃⠋. Huruf kapital dibaca sebagai huruf kecil.</div>'));
}
