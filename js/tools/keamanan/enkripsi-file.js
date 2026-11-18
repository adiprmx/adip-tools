import { h as T, tabs, errBox, fmtBytes, fileInput } from '../../core.js';

// Enkripsi file AES-GCM (WebCrypto). Kunci diturunkan dari kata sandi
// dengan PBKDF2 (250.000 iterasi, SHA-256), sama seperti tool Enkripsi Teks.
// Format file hasil: magic "ATF1" (4 byte) + salt 16 byte + IV 12 byte +
// ciphertext. Nama file asli ikut TERENKRIPSI di dalam ciphertext (2 byte
// panjang nama + nama + isi) — tidak ada lagi metadata terang-terangan di
// header (RED-G2-07): tanpa kata sandi, nama file pun tidak bisa dibaca.
// Semua proses 100% di perangkat ini.
const MAGIC = 'ATF1';
const ITER = 250000;
const PANJANG_SANDI_MIN = 8;

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptFileBytes(data, fileName, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  // Nama file dibungkus ke dalam plaintext (panjang 2 byte + nama + isi)
  // supaya ikut terenkripsi — header hanya berisi magic, salt, dan IV.
  const nameBytes = new TextEncoder().encode(String(fileName || 'file').slice(0, 500));
  const plain = new Uint8Array(2 + nameBytes.length + data.length);
  plain[0] = (nameBytes.length >> 8) & 0xff;
  plain[1] = nameBytes.length & 0xff;
  plain.set(nameBytes, 2);
  plain.set(data, 2 + nameBytes.length);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const out = new Uint8Array(4 + 16 + 12 + ct.length);
  out.set(new TextEncoder().encode(MAGIC), 0);
  out.set(salt, 4);
  out.set(iv, 20);
  out.set(ct, 32);
  return out;
}

export async function decryptFileBytes(packed, password) {
  const bytes = packed instanceof Uint8Array ? packed : new Uint8Array(packed);
  if (bytes.length < 32 + 2 + 16) throw new Error('pendek');
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== MAGIC) throw new Error('format');
  const salt = bytes.slice(4, 20);
  const iv = bytes.slice(20, 32);
  const ct = bytes.slice(32);
  const key = await deriveKey(password, salt);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
  const nameLen = (pt[0] << 8) | pt[1];
  if (pt.length < 2 + nameLen) throw new Error('pendek');
  const fileName = new TextDecoder().decode(pt.slice(2, 2 + nameLen)) || 'file';
  return { data: pt.slice(2 + nameLen), fileName };
}

export const meta = {"id": "enkripsi-file", "name": "Enkripsi File", "cat": "keamanan", "icon": "🔒", "desc": "Kunci file apa pun dengan kata sandi (AES-GCM) dan buka lagi kapan pun. Kata sandi tidak pernah keluar dari perangkatmu.", "keywords": "enkripsi,file,aes,kunci,dekripsi,sandi,aman,password", "since": "6.17.0"};
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

  // ---- Tab kunci file ----
  const pEnc = T.el('<div></div>');
  const encFile = fileInput('*/*');
  const encPass = mkPass('Kata sandi (minimal 8 karakter)');
  const encOut = T.out();
  let encName = '';
  encFile.addEventListener('change', () => {
    const f = encFile.files && encFile.files[0];
    encName = f ? f.name : '';
    if (f) T.show(encOut, '<span class="dim">' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ') siap dikunci.</span>');
    else T.hide(encOut);
  });
  const doEnc = async () => {
    const f = encFile.files && encFile.files[0];
    const pw = encPass.inp.value;
    if (!f) { T.show(encOut, errBox('Pilih dulu file yang mau dikunci.')); return; }
    if (!pw || pw.length < PANJANG_SANDI_MIN) { T.show(encOut, errBox('Kata sandi minimal 8 karakter. Kata sandi pendek mudah ditebak orang yang memegang file ini — makin panjang makin aman.')); return; }
    T.show(encOut, '<span class="dim">Mengunci ' + T.esc(f.name) + ', tunggu sebentar.</span>');
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const packed = await encryptFileBytes(data, f.name, pw);
      T.dl(f.name + '.atf1', new Blob([packed], { type: 'application/octet-stream' }), 'application/octet-stream');
      T.show(encOut, '<span class="ok">Terkunci.</span> <span class="dim">File ' + T.esc(f.name) + '.atf1 sudah diunduh. Simpan bersama kata sandinya. Tanpa kata sandi yang benar, file tidak bisa dibuka lagi.</span>');
    } catch (e) {
      T.show(encOut, errBox('File tidak bisa dikunci. Coba lagi.'));
    }
  };
  pEnc.appendChild(T.field('File yang mau dikunci', encFile, 'File apa pun: foto, dokumen, video, arsip.'));
  pEnc.appendChild(T.field('Kata sandi', encPass.wrap, 'Minimal 8 karakter — kata sandi pendek mudah ditebak orang yang memegang file ini. Kata sandi tidak disimpan di mana pun dan tidak pernah keluar dari perangkat ini.'));
  pEnc.appendChild(T.row(T.btn('Kunci File', doEnc, true)));
  pEnc.appendChild(encOut);

  // ---- Tab buka file ----
  const pDec = T.el('<div></div>');
  const decFile = fileInput('*/*');
  const decPass = mkPass('Kata sandi yang dipakai saat mengunci');
  const decOut = T.out();
  decFile.addEventListener('change', () => {
    const f = decFile.files && decFile.files[0];
    if (f) T.show(decOut, '<span class="dim">' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ') siap dibuka.</span>');
    else T.hide(decOut);
  });
  const doDec = async () => {
    const f = decFile.files && decFile.files[0];
    const pw = decPass.inp.value;
    if (!f) { T.show(decOut, errBox('Pilih dulu file .atf1 yang mau dibuka.')); return; }
    if (!pw) { T.show(decOut, errBox('Isi kata sandinya.')); return; }
    T.show(decOut, '<span class="dim">Membuka ' + T.esc(f.name) + ', tunggu sebentar.</span>');
    try {
      const packed = new Uint8Array(await f.arrayBuffer());
      const r = await decryptFileBytes(packed, pw);
      T.dl(r.fileName, new Blob([r.data], { type: 'application/octet-stream' }), 'application/octet-stream');
      T.show(decOut, '<span class="ok">Terbuka.</span> <span class="dim">File asli ' + T.esc(r.fileName) + ' sudah diunduh.</span>');
    } catch (e) {
      const msg = (e && e.message) || '';
      if (msg === 'format') T.show(decOut, errBox('File ini bukan hasil dari tool ini. File terkunci selalu dibuat tool ini dengan akhiran .atf1.'));
      else if (msg === 'pendek') T.show(decOut, errBox('File terkunci tidak lengkap atau rusak. Pastikan file terunduh utuh.'));
      else T.show(decOut, errBox('Kata sandi salah, atau file terkunci sudah berubah/rusak. Coba kata sandi lain.'));
    }
  };
  pDec.appendChild(T.field('File terkunci (.atf1)', decFile));
  pDec.appendChild(T.field('Kata sandi', decPass.wrap));
  pDec.appendChild(T.row(T.btn('Buka File', doDec, true)));
  pDec.appendChild(decOut);

  root.appendChild(T.el('<p class="note">Kunci file apa pun dengan kata sandi sebelum dikirim atau disimpan di tempat yang tidak aman. File dan kata sandi tidak pernah keluar dari perangkat ini.</p>'));
  root.appendChild(tabs([['Kunci file', 0], ['Buka file', 1]], [pEnc, pDec]));
  root.appendChild(pEnc);
  root.appendChild(pDec);
  root.appendChild(T.el('<div class="hint" style="margin-top:12px">Teknisnya: AES-GCM 256-bit, kunci dari kata sandi lewat PBKDF2 250.000 iterasi (SHA-256). File terkunci hanya bisa dibuka dengan kata sandi yang sama. Lupa kata sandi berarti file tidak bisa dibuka lagi oleh siapa pun.</div>'));
}
