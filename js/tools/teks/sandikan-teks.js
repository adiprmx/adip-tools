import { h as T, utils } from '../../core.js?v=6.7.0';

/* Sandi klasik: Caesar (geser huruf) + Vigenère (kunci kata). */

function shiftChar(ch, shift) {
  const cp = ch.codePointAt(0);
  if (cp >= 65 && cp <= 90) return String.fromCodePoint(((cp - 65 + shift) % 26 + 26) % 26 + 65);
  if (cp >= 97 && cp <= 122) return String.fromCodePoint(((cp - 97 + shift) % 26 + 26) % 26 + 97);
  return ch;
}

function caesar(text, shift, enc) {
  const s = enc ? shift : -shift;
  return Array.from(String(text)).map((c) => shiftChar(c, s)).join('');
}

function vigenereKeyShifts(key) {
  return Array.from(String(key).toUpperCase()).filter((c) => c >= 'A' && c <= 'Z')
    .map((c) => c.codePointAt(0) - 65);
}

function vigenere(text, key, enc) {
  const ks = vigenereKeyShifts(key);
  if (!ks.length) return null;
  let ki = 0;
  return Array.from(String(text)).map((ch) => {
    const cp = ch.codePointAt(0);
    const up = cp >= 65 && cp <= 90, lo = cp >= 97 && cp <= 122;
    if (!up && !lo) return ch;
    const sh = enc ? ks[ki % ks.length] : -ks[ki % ks.length];
    ki++;
    const base = up ? 65 : 97;
    return String.fromCodePoint(((cp - base + sh) % 26 + 26) % 26 + base);
  }).join('');
}

const LS_KEY = 'sandikan-teks:v1';
function saveState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ }
}
function loadState() {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? JSON.parse(v) : {};
  } catch (e) { return {}; }
}

export const meta = {"id": "sandikan-teks", "name": "Sandi Teks", "cat": "teks", "icon": "🔏", "desc": "Enkripsi teks dengan sandi Caesar & Vigenère.", "keywords": "sandi,caesar,vigenere,enkripsi,rahasia"};
export function render(root) {

  const saved = loadState();
  const state = {
    mode: saved.mode === 'dec' ? 'dec' : 'enc',
    cipher: saved.cipher === 'vig' ? 'vig' : 'caesar',
    shift: Math.min(25, Math.max(1, +saved.shift || 3)),
    key: String(saved.key || 'KUNCI'),
  };

  const modeSel = T.select([['enc', 'Enkripsi (acakin teks)'], ['dec', 'Dekripsi (balikin teks)']], state.mode);
  const cipherSel = T.select([['caesar', 'Caesar — geser huruf'], ['vig', 'Vigenère — kunci kata']], state.cipher);

  const shiftWrap = T.el('<div class="fld"><label>Geser <span class="hint"></span></label></div>');
  const shiftLbl = shiftWrap.querySelector('span');
  const shiftIn = T.el(`<input type="range" min="1" max="25" value="${state.shift}" class="inp" style="width:100%">`);

  const keyIn = T.input('text', 'Kata kunci, mis. RAHASIA', state.key);
  const keyWrap = T.field('Kata kunci (huruf saja)', keyIn, 'Hurufnya diulang otomatis mengikuti panjang teks.');

  const inTa = T.ta(4, 'Ketik atau tempel teks di sini…', 'Halo Dunia');
  const box = T.out();
  let lastResult = '';

  function syncCipherUI() {
    shiftWrap.style.display = state.cipher === 'caesar' ? '' : 'none';
    keyWrap.style.display = state.cipher === 'vig' ? '' : 'none';
  }

  function convert() {
    const txt = inTa.value;
    if (!txt) { T.hide(box); lastResult = ''; return; }
    let out = '';
    if (state.cipher === 'caesar') {
      out = caesar(txt, state.shift, state.mode === 'enc');
    } else {
      out = vigenere(txt, state.key, state.mode === 'enc');
      if (out === null) { T.hide(box); lastResult = ''; T.toast('Isi kata kuncinya dulu'); return; }
    }
    lastResult = out;
    T.show(box, '<pre style="white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6;margin:0">' + T.esc(out) + '</pre>');
    saveState(state);
  }

  function onShift() {
    state.shift = +shiftIn.value;
    shiftLbl.textContent = state.shift + ' huruf';
    convert();
  }
  shiftLbl.textContent = state.shift + ' huruf';
  shiftIn.addEventListener('input', onShift);
  shiftWrap.appendChild(shiftIn);

  modeSel.addEventListener('change', () => { state.mode = modeSel.value; convert(); });
  cipherSel.addEventListener('change', () => { state.cipher = cipherSel.value; syncCipherUI(); convert(); });
  keyIn.addEventListener('input', () => {
    const clean = keyIn.value.replace(/[^a-zA-Z]/g, '');
    if (clean !== keyIn.value) keyIn.value = clean;
    state.key = keyIn.value;
    convert();
  });
  inTa.addEventListener('input', convert);
  T.onLeave(() => {
    inTa.removeEventListener('input', convert);
    shiftIn.removeEventListener('input', onShift);
  });

  root.appendChild(T.grid2(T.field('Mode', modeSel), T.field('Jenis sandi', cipherSel)));
  root.appendChild(shiftWrap);
  root.appendChild(keyWrap);
  root.appendChild(T.field('Teks', inTa));
  root.appendChild(T.el('<div class="hint" style="margin:10px 0 4px">Hasil:</div>'));
  root.appendChild(box);
  root.appendChild(T.row(T.copyBtn(() => lastResult, 'Salin Hasil')));
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Cocok buat kode-kodean sama temen. Tapi ingat: sandi klasik gampang dibobol, jangan dipakai buat nyimpen PIN atau password beneran ya.</div>'));

  syncCipherUI();
  convert();

}
