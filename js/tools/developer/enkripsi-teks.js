import { h as T, tabs, errBox, esc } from '../../core.js?v=6.12.2';

// Enkripsi teks AES-GCM (WebCrypto). Kunci diturunkan dari kata sandi
// dengan PBKDF2 (250.000 iterasi, SHA-256). Format hasil:
// "AT1." + base64(salt 16 byte | iv 12 byte | ciphertext).
// Salt & IV dibuat acak tiap enkripsi, jadi hasil yang sama tidak
// pernah menghasilkan teks terenkripsi yang sama.
const PREFIX = 'AT1.';
const ITER = 250000;

function b64encode(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(s) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptText(plain, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
  const packed = new Uint8Array(16 + 12 + ct.length);
  packed.set(salt, 0); packed.set(iv, 16); packed.set(ct, 28);
  return PREFIX + b64encode(packed);
}

async function decryptText(packed, password) {
  const s = String(packed || '').trim();
  if (!s.startsWith(PREFIX)) throw new Error('format');
  const bytes = b64decode(s.slice(PREFIX.length));
  if (bytes.length < 28 + 16) throw new Error('pendek');
  const salt = bytes.slice(0, 16), iv = bytes.slice(16, 28), ct = bytes.slice(28);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export const meta = {"id": "enkripsi-teks", "name": "Enkripsi Teks", "cat": "developer", "icon": "🔐", "desc": "Kunci teks dengan kata sandi (AES-GCM).", "keywords": "enkripsi,aes,dekripsi,sandi,kunci", "since": "6.11.0"};
export function render(root) {

    const mkPass = (ph) => {
      const wrap = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      const inp = T.input('password', ph);
      inp.style.flex = '1';
      const show = T.el('<label class="pick" style="flex:none;min-height:0;padding:0"><input type="checkbox" style="width:20px;height:20px"> <span style="font-size:13px">Lihat</span></label>');
      show.querySelector('input').addEventListener('change', (e) => { inp.type = e.target.checked ? 'text' : 'password'; });
      wrap.appendChild(inp); wrap.appendChild(show);
      return { wrap, inp };
    };

    // ---- Tab enkripsi ----
    const pEnc = T.el('<div></div>');
    const encInp = T.ta(5, 'Tulis teks yang mau dikunci…');
    const encPass = mkPass('Kata sandi (minimal 4 karakter)');
    const encOut = T.out();
    const encRes = T.ta(4, 'Hasil terenkripsi muncul di sini…');
    encRes.readOnly = true;
    let encLast = '';
    const doEnc = async () => {
      const plain = encInp.value;
      const pw = encPass.inp.value;
      if (!plain) { T.show(encOut, errBox('Tulis dulu teksnya.')); return; }
      if (!pw || pw.length < 4) { T.show(encOut, errBox('Kata sandi minimal 4 karakter.')); return; }
      T.show(encOut, '<span class="dim">Mengunci…</span>');
      try {
        encLast = await encryptText(plain, pw);
        encRes.value = encLast;
        T.show(encOut, '<span class="ok">✓ Terkunci.</span> <span class="dim">Simpan teks ini bersama kata sandinya. Tanpa kata sandi yang benar, teks tidak bisa dibuka lagi.</span>');
      } catch (e) {
        T.show(encOut, errBox('Teks tidak bisa dikunci. Coba lagi.'));
      }
    };
    pEnc.appendChild(T.field('Teks', encInp));
    pEnc.appendChild(T.field('Kata sandi', encPass.wrap, 'Kata sandi tidak disimpan di mana pun. Lupa kata sandi berarti teks tidak bisa dibuka.'));
    pEnc.appendChild(T.row(T.btn('Kunci Teks', doEnc, true), T.copyBtn(() => encLast, 'Salin Hasil')));
    pEnc.appendChild(encOut);
    pEnc.appendChild(T.field('Hasil terenkripsi', encRes));

    // ---- Tab dekripsi ----
    const pDec = T.el('<div></div>');
    const decInp = T.ta(5, 'Tempel teks terenkripsi (diawali AT1.)…');
    const decPass = mkPass('Kata sandi yang dipakai saat mengunci');
    const decOut = T.out();
    const decRes = T.ta(4, 'Hasil terbuka muncul di sini…');
    decRes.readOnly = true;
    let decLast = '';
    const doDec = async () => {
      const packed = decInp.value;
      const pw = decPass.inp.value;
      if (!packed.trim()) { T.show(decOut, errBox('Tempel dulu teks terenkripsinya.')); return; }
      if (!pw) { T.show(decOut, errBox('Isi kata sandinya.')); return; }
      T.show(decOut, '<span class="dim">Membuka…</span>');
      try {
        decLast = await decryptText(packed, pw);
        decRes.value = decLast;
        T.show(decOut, '<span class="ok">✓ Terbuka.</span>');
      } catch (e) {
        decLast = '';
        const msg = (e && e.message) || '';
        if (msg === 'format') T.show(decOut, errBox('Teks ini bukan hasil dari tool ini. Teks terenkripsi selalu diawali "AT1.".'));
        else if (msg === 'pendek') T.show(decOut, errBox('Teks terenkripsi tidak lengkap. Pastikan seluruh teks tersalin.'));
        else T.show(decOut, errBox('Kata sandi salah, atau teks terenkripsi sudah berubah/rusak. Coba kata sandi lain atau tempel ulang teksnya.'));
      }
    };
    pDec.appendChild(T.field('Teks terenkripsi', decInp));
    pDec.appendChild(T.field('Kata sandi', decPass.wrap));
    pDec.appendChild(T.row(T.btn('Buka Teks', doDec, true), T.copyBtn(() => decLast, 'Salin Hasil')));
    pDec.appendChild(decOut);
    pDec.appendChild(T.field('Hasil terbuka', decRes));

    root.appendChild(tabs([['Kunci teks', 0], ['Buka teks', 1]], [pEnc, pDec]));
    root.appendChild(pEnc);
    root.appendChild(pDec);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Semua proses terjadi di perangkat ini. Dipakai untuk mengamankan teks milik sendiri, misalnya catatan atau pesan yang mau disimpan dalam keadaan terkunci.</div>'));
  
}
