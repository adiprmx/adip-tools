import { h as T } from '../../core.js?v=6.6.0';

export const meta = {"id":"teks-mocking","name":"Teks Mocking","cat":"teks","icon":"🐔","desc":"Ubah teks jadi tEkS mOcKiNg ala SpongeBob.","keywords":"mocking,spongebob,teks,lucu,acak,besar kecil,ejekan"};

/* Mode selang-seling rapi: huruf ke-n ganjil = kecil, genap = besar
   (spasi & tanda baca tidak dihitung, biar polanya konsisten). */
function mockRapi(text) {
  let i = 0;
  return Array.from(String(text == null ? '' : text)).map((ch) => {
    if (!/[a-zA-Z]/.test(ch)) return ch;
    i++;
    return i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
  }).join('');
}

/* Mode acak: tiap huruf 50/50 besar/kecil. */
function mockAcak(text) {
  return Array.from(String(text == null ? '' : text)).map((ch) => {
    if (!/[a-zA-Z]/.test(ch)) return ch;
    return Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase();
  }).join('');
}

export function render(root) {
  const inT = T.ta(4, 'Ketik atau tempel teks yang mau diejek…', '');
  const modeS = T.select([['rapi', 'Selang-seling rapi'], ['acak', 'Acak total']], 'rapi');
  const box = T.out();
  let last = '';

  function gen() {
    const mode = modeS.value;
    last = mode === 'acak' ? mockAcak(inT.value) : mockRapi(inT.value);
    if (!last.trim()) { T.hide(box); return; }
    T.show(box, '<div class="mock-out" style="background:#12100d;border:1px solid #2e2823;border-radius:10px;padding:14px;font-size:16px;line-height:1.6;word-break:break-word">' + T.esc(last) + '</div>');
  }

  const acakBtn = T.btn('🔀 Acak Lagi', () => {
    if (modeS.value !== 'acak') { modeS.value = 'acak'; }
    gen();
  });

  inT.addEventListener('input', gen);
  modeS.addEventListener('change', gen);

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tau meme SpongeBob yang ngetawain orang pakai huruf besar-kecil? Nah, ini mesinnya. Ketik kalimat serius apa aja, terus ubah jadi <b>tEkS mOcKiNg</b> — tinggal salin, tempel ke chat, beres.</p>'));
  root.appendChild(T.field('Teks asli', inT));
  root.appendChild(T.field('Gaya mocking', modeS, 'Rapi = polanya konsisten selang-seling. Acak = tiap huruf lempar koin.'));
  root.appendChild(T.row(T.copyBtn(() => last, 'Salin Hasil'), acakBtn));
  root.appendChild(box);
  gen();
}
