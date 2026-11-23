import { h as T, utils, kv, fmtBytes, errBox, tabs } from '../../core.js';
import { gunzipBytes, gzipBytes } from './gzip-gunzip-file.js';

export const meta = {"id": "ekstrak-arsip-7z-rar-tar-gz", "name": "Arsip TAR/7Z/RAR", "cat": "converter", "icon": "🗄️", "desc": "Buka isi arsip 7Z, RAR, TAR, dan TAR.GZ, atau gabung file jadi arsip TAR.GZ.", "keywords": "ekstrak,arsip,7z,rar,tar,gz,buka,unzip,buat,tar.gz,kompres,gabung", "since": "6.17.0", "online": true};

/* Dua jalur ekstraksi, keduanya 100% di browser:
   - TAR dan TAR.GZ: parser TAR tulisan sendiri + gunzip bawaan browser.
   - 7Z dan RAR: 7z-wasm 1.2.0 (7-Zip 24.09 yang dikompilasi ke WebAssembly,
     mendukung ekstrak RAR v4/v5, 7Z, dan format 7-Zip lainnya). Mesinnya
     dimuat dari internet saat tombol ditekan.
   Batasan jujur (ditulis juga di UI): arsip yang terbagi jadi beberapa
   bagian (part1.rar, .7z.001) tidak bisa dibuka di sini karena hanya satu
   file yang bisa dipilih; arsip berkunci butuh kata sandi yang benar.
   Tab "Buat arsip" (diserap dari Buat Arsip TAR.GZ, v6.21.0): penulis TAR
   ustar tulisan sendiri + gzip bawaan browser. */
const SZ_CDNS = [
  'https://cdn.jsdelivr.net/npm/7z-wasm@1.2.0/7zz.umd.js',
  'https://unpkg.com/7z-wasm@1.2.0/7zz.umd.js',
];
const JSZIP_CDNS = [
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];
const TEXT_EXT = ['txt', 'md', 'json', 'csv', 'html', 'htm', 'css', 'js', 'xml', 'log', 'srt', 'vtt'];
const MAX_PREVIEW = 100 * 1024;
const BATAS_7Z = 200 * 1024 * 1024;

function teks0(bytes, off, len) {
  let end = off;
  while (end < off + len && bytes[end] !== 0) end++;
  return new TextDecoder().decode(bytes.subarray(off, end));
}
function oktal(bytes, off, len) {
  const s = teks0(bytes, off, len).trim();
  if (!s) return 0;
  const v = parseInt(s, 8);
  return Number.isFinite(v) ? v : 0;
}

// Sanitasi nama entri arsip (RED-G2-01): nama dari header TAR bisa berisi
// `../` atau path absolut. Buang komponen `..`/`.`, backslash, dan awalan `/`
// supaya nama tidak pernah lolos sebagai traversal saat ditulis kembali ke
// ZIP hasil (jalur unduh satuan sudah membuang direktori; ini menyamakannya).
// Kembalikan '' bila tidak ada komponen nama yang tersisa.
export function bersihkanNamaArsip(nama) {
  return String(nama || '').replace(/\\/g, '/').split('/')
    .filter((p) => p && p !== '..' && p !== '.').join('/');
}

// Parser TAR murni: mendukung ustar, longname GNU ('L'), dan header
// tambahan pax ('x', dipakai untuk nama panjang). Mengembalikan daftar
// {nama, ukuran, data}. Bisa diuji di Node.
export function uraiTar(bytes) {
  const entri = [];
  let pos = 0;
  let namaPanjang = null;
  while (pos + 512 <= bytes.length) {
    const blok = bytes.subarray(pos, pos + 512);
    let kosong = true;
    for (let i = 0; i < 512; i++) { if (blok[i] !== 0) { kosong = false; break; } }
    if (kosong) break;
    const nama = teks0(blok, 0, 100);
    const ukuran = oktal(blok, 124, 12);
    const tipe = String.fromCharCode(blok[156] || 48);
    const prefix = teks0(blok, 345, 155);
    const namaLengkap = prefix ? prefix + '/' + nama : nama;
    const awalData = pos + 512;
    const akhirData = awalData + ukuran;
    if (akhirData > bytes.length) break; // arsip terpotong
    if (tipe === 'L') {
      namaPanjang = teks0(bytes, awalData, ukuran);
    } else if (tipe === 'x' || tipe === 'g') {
      // Header pax: cari "path=" di dalam catatan "panjang kunci=nilai".
      const teks = new TextDecoder().decode(bytes.subarray(awalData, akhirData));
      const m = /path=([^\n]*)/.exec(teks);
      if (m) namaPanjang = m[1].trim();
    } else if (tipe === '0' || tipe === '\0' || tipe === '') {
      const namaAman = bersihkanNamaArsip(namaPanjang || namaLengkap);
      if (namaAman) entri.push({ nama: namaAman, ukuran, data: bytes.slice(awalData, akhirData) });
      namaPanjang = null;
    } else {
      // Direktori ('5') dan tipe lain dilewati, namanya tidak dipakai.
      if (tipe !== '5') namaPanjang = null;
    }
    pos = awalData + Math.ceil(ukuran / 512) * 512;
  }
  return entri;
}

// Deteksi format dari isi file (bukan cuma nama): 'zip', '7z', 'rar',
// 'gzip', 'tar', atau null bila tidak dikenali.
export function deteksiArsip(bytes, namaFile) {
  const nama = String(namaFile || '').toLowerCase();
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) && (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)) return 'zip';
  if (bytes.length >= 6 && bytes[0] === 0x37 && bytes[1] === 0x7a && bytes[2] === 0xbc && bytes[3] === 0xaf && bytes[4] === 0x27 && bytes[5] === 0x1c) return '7z';
  if (bytes.length >= 7 && bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21 && bytes[4] === 0x1a && bytes[5] === 0x07) return 'rar';
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return 'gzip';
  if (bytes.length >= 262 && teks0(bytes, 257, 5) === 'ustar') return 'tar';
  if (/\.7z$/i.test(nama)) return '7z';
  if (/\.rar$/i.test(nama)) return 'rar';
  if (/\.tar(\.gz|\.tgz)?$/i.test(nama) || /\.tgz$/i.test(nama)) return /\.gz$/i.test(nama) || /\.tgz$/i.test(nama) ? 'gzip' : 'tar';
  if (/\.gz$/i.test(nama)) return 'gzip';
  return null;
}

export function arsipTerbagi(namaFile) {
  const n = String(namaFile || '').toLowerCase();
  return /\.part\d+\.rar$/i.test(n) || /\.7z\.\d+$/i.test(n) || /\.z\d+$/i.test(n) || /\.r\d+$/i.test(n);
}

/* Penulis TAR (format ustar) murni, tanpa pustaka. Dipakai bersama gzip
   untuk menghasilkan .tar.gz yang bisa dibuka tar, 7-Zip, dan tab Buka
   arsip di sini. Murni, bisa diuji di Node. */

function tulisTeks(buf, off, len, s) {
  const bytes = new TextEncoder().encode(String(s || ''));
  const n = Math.min(bytes.length, len);
  buf.set(bytes.subarray(0, n), off);
}
function tulisOktal(buf, off, len, nilai) {
  const s = Math.max(0, Math.floor(nilai)).toString(8);
  const isi = s.padStart(len - 1, '0').slice(-(len - 1));
  for (let i = 0; i < isi.length; i++) buf[off + i] = isi.charCodeAt(i);
  buf[off + len - 1] = 0;
}
function headerTar(nama, ukuran, mtime, typeflag) {
  const h = new Uint8Array(512);
  tulisTeks(h, 0, 100, nama);
  tulisTeks(h, 100, 8, '0000644\0');
  tulisTeks(h, 108, 8, '0000000\0');
  tulisTeks(h, 116, 8, '0000000\0');
  tulisOktal(h, 124, 12, ukuran);
  tulisOktal(h, 136, 12, mtime);
  for (let i = 148; i < 156; i++) h[i] = 32; // checksum diisi spasi dulu
  h[156] = (typeflag || '0').charCodeAt(0);
  tulisTeks(h, 257, 6, 'ustar\0');
  tulisTeks(h, 263, 2, '00');
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  const cs = sum.toString(8).padStart(6, '0');
  for (let i = 0; i < 6; i++) h[148 + i] = cs.charCodeAt(i);
  h[154] = 0;
  h[155] = 32;
  return h;
}

// entri: [{nama, data: Uint8Array, mtime?}]. Nama lebih dari 100 karakter
// ditulis lewat entri longname GNU ('L'). Mengembalikan Uint8Array TAR.
export function buatTar(entri) {
  const potong = [];
  let total = 0;
  const dorong = (b) => { potong.push(b); total += b.length; };
  const mtime = Math.floor(Date.now() / 1000);
  for (const e of entri) {
    const nama = String(e.nama || 'file');
    const data = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data || []);
    const mt = e.mtime || mtime;
    if (new TextEncoder().encode(nama).length > 100) {
      const namaBytes = new TextEncoder().encode(nama + '\0');
      dorong(headerTar('././@LongLink', namaBytes.length, mt, 'L'));
      dorong(namaBytes);
      const sisaNama = (512 - (namaBytes.length % 512)) % 512;
      if (sisaNama) dorong(new Uint8Array(sisaNama));
    }
    dorong(headerTar(nama, data.length, mt, '0'));
    if (data.length) dorong(data);
    const sisa = (512 - (data.length % 512)) % 512;
    if (sisa) dorong(new Uint8Array(sisa));
  }
  dorong(new Uint8Array(1024)); // dua blok nol penutup
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of potong) { out.set(p, pos); pos += p.length; }
  return out;
}

// Nama di dalam arsip: nama file saja, tanpa jalur folder. Nama kembar
// diberi nomor supaya tidak menimpa satu sama lain.
export function namaArsipUnik(daftarNama) {
  const dipakai = new Set();
  return daftarNama.map((nama) => {
    let n = String(nama || 'file').replace(/[\\/]+/g, '_').replace(/^\.+/, '') || 'file';
    if (!dipakai.has(n)) { dipakai.add(n); return n; }
    const m = /^(.*?)(\.[^.]+)?$/.exec(n);
    let i = 2;
    let calon = m[1] + ' (' + i + ')' + (m[2] || '');
    while (dipakai.has(calon)) { i++; calon = m[1] + ' (' + i + ')' + (m[2] || ''); }
    dipakai.add(calon);
    return calon;
  });
}

export function render(root) {
  /* ============ Tab 1: Buka arsip ============ */
  const pBuka = T.el('<div></div>');
  {
    const fi = T.input('file');
    fi.accept = '.7z,.rar,.tar,.tar.gz,.tgz,.gz,application/x-7z-compressed,application/vnd.rar,application/x-tar,application/gzip';
    const sandiInp = T.input('password', 'Kosongkan bila arsip tidak berkunci');
    const box = T.out();
    const listBox = T.out();
    const prevBox = T.out();
    const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
    const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
    const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
    barTrack.appendChild(barFill);
    const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
    barWrap.appendChild(barTrack);
    barWrap.appendChild(barLabel);

    let entries = [];
    let busy = false;
    let szModule = null;

    const setStage = (label, pct) => {
      barWrap.hidden = false;
      barLabel.textContent = label;
      barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
    };

    const muat7z = async () => {
      if (szModule) return szModule;
      // Loader kanonis: utils.loadLibOnce (core.js) — fallback 2-CDN +
      // timeout 30 dtk per URL (loop loadScript lama bisa menggantung
      // selamanya bila satu CDN macet, R-36).
      if (typeof window.SevenZip !== 'function') {
        await utils.loadLibOnce(SZ_CDNS, () => typeof window.SevenZip === 'function');
      }
      if (typeof window.SevenZip !== 'function') throw new Error('Mesin pembuka arsip tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.');
      szModule = await window.SevenZip();
      return szModule;
    };

    const ekstrak7z = async (data, namaFile, sandi) => {
      const sz = await muat7z();
      const ext = (namaFile.match(/\.[a-z0-9]+$/i) || ['.7z'])[0].toLowerCase();
      const arsipPath = '/arsip' + ext;
      try { sz.FS.unlink(arsipPath); } catch (e) {}
      try { sz.FS.unlink('/out'); } catch (e) {}
      sz.FS.writeFile(arsipPath, data);
      // '-p' selalu disertakan (kosong bila tidak ada kata sandi): tanpa ini,
      // arsip berkunci membuat 7z menunggu ketikan kata sandi di terminal
      // yang tidak ada di browser, sehingga prosesnya menggantung.
      const args = ['x', arsipPath, '-o/out', '-y', '-p' + (sandi || '')];
      let kode = 0;
      try {
        kode = sz.callMain(args) || 0;
      } catch (e) {
        kode = (e && typeof e.status === 'number') ? e.status : 1;
      }
      const hasil = [];
      const jalan = (dir, prefix) => {
        let namaList;
        try { namaList = sz.FS.readdir(dir); } catch (e) { return; }
        for (const n of namaList) {
          if (n === '.' || n === '..') continue;
          const p = dir + '/' + n;
          let st;
          try { st = sz.FS.stat(p); } catch (e) { continue; }
          const isDir = sz.FS.isDir ? sz.FS.isDir(st.mode) : (st.mode & 61440) === 16384;
          if (isDir) jalan(p, prefix + n + '/');
          else {
            try {
              const isi = sz.FS.readFile(p);
              hasil.push({ nama: prefix + n, ukuran: isi.length, data: isi });
            } catch (e) {}
          }
        }
      };
      jalan('/out', '');
      try { sz.FS.unlink(arsipPath); } catch (e) {}
      if (!hasil.length) {
        if (kode !== 0) {
          if (sandi) throw new Error('Arsip tidak bisa dibuka. Kata sandi mungkin salah, atau arsipnya rusak.');
          throw new Error('Arsip tidak bisa dibuka. Arsip mungkin rusak, berkunci, atau terbagi jadi beberapa bagian.');
        }
        throw new Error('Arsip ini kosong, tidak ada file di dalamnya.');
      }
      return hasil;
    };

    const tampilkanDaftar = () => {
      if (!entries.length) { T.hide(listBox); return; }
      const total = entries.reduce((a, e) => a + e.ukuran, 0);
      T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + entries.length + ' file, total ' + fmtBytes(total) + '. Ketuk Unduh di tiap file untuk menyimpannya:</p>');
      entries.forEach((e) => {
        const ext = (e.nama.split('.').pop() || '').toLowerCase();
        const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
        row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(e.nama) + ' <span class="dim">(' + fmtBytes(e.ukuran) + ')</span></span>'));
        const acts = T.el('<div style="display:flex;gap:6px;flex-shrink:0"></div>');
        if (TEXT_EXT.includes(ext)) {
          const lihat = T.btn('Lihat', () => {
            if (e.ukuran > MAX_PREVIEW) {
              T.show(prevBox, '<p class="hint">File ' + T.esc(e.nama) + ' terlalu besar untuk pratinjau. Unduh saja untuk membacanya.</p>');
              return;
            }
            const s = new TextDecoder().decode(e.data);
            T.show(prevBox, '<p class="hint">Isi ' + T.esc(e.nama) + ':</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:300px;overflow:auto"></pre>');
            prevBox.querySelector('pre').textContent = s.slice(0, 3000) + (s.length > 3000 ? '\n…(dipotong, unduh file untuk isi lengkap)' : '');
            T.scrollToPreview(prevBox);
          });
          lihat.classList.add('small');
          acts.appendChild(lihat);
        }
        const dl = T.btn('Unduh', () => {
          T.dl(e.nama.split('/').pop(), new Blob([e.data], { type: 'application/octet-stream' }), 'application/octet-stream');
        });
        dl.classList.add('small');
        acts.appendChild(dl);
        row.appendChild(acts);
        listBox.appendChild(row);
      });
      const zipBtn = T.btn('Unduh semua sebagai ZIP', async () => {
        T.show(box, '<span class="dim">Menyiapkan alat ZIP…</span>');
        // Loader library kanonis: utils.loadLibOnce (core.js).
        const ok = await utils.loadLibOnce(JSZIP_CDNS, () => typeof window.JSZip === 'function');
        if (!ok) { T.show(box, errBox('Alat ZIP tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.')); return; }
        try {
          const zip = new window.JSZip();
          // Sanitasi ulang di sini (RED-G2-01): entri juga bisa datang dari
          // jalur 7z/RAR atau .gz, jadi ZIP hasil tidak pernah berisi nama
          // traversal apa pun sumbernya.
          entries.forEach((e) => {
            const namaAman = bersihkanNamaArsip(e.nama);
            if (namaAman) zip.file(namaAman, e.data);
          });
          const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
          T.dl('hasil-ekstrak.zip', blob, 'application/zip');
          T.show(box, kv('Isi arsip', entries.length + ' file') + kv('Ukuran ZIP', fmtBytes(blob.size)));
          T.toast('ZIP terunduh');
        } catch (e) {
          T.show(box, errBox('ZIP tidak bisa dibuat. Coba unduh file satu per satu.'));
        }
      });
      listBox.appendChild(T.el('<div style="margin-top:12px"></div>')).appendChild(zipBtn);
    };

    const proses = async () => {
      const f = fi.files && fi.files[0];
      if (!f) return;
      if (busy) return;
      busy = true;
      goBtn.disabled = true;
      entries = [];
      T.hide(listBox);
      T.hide(prevBox);
      try {
        if (arsipTerbagi(f.name)) {
          T.show(box, errBox('Arsip ini terbagi jadi beberapa bagian (' + f.name + '). Di sini hanya satu file yang bisa dipilih, jadi arsip terbagi belum bisa dibuka. Gabungkan dulu semua bagiannya di komputer dengan 7-Zip atau WinRAR.'));
          return;
        }
        setStage('Membaca arsip…', 10);
        const data = new Uint8Array(await f.arrayBuffer());
        const format = deteksiArsip(data, f.name);
        if (format === 'zip') {
          T.show(box, errBox('Ini file ZIP. Buka dengan tool Buat dan Buka ZIP, yang memang dibuat untuk ZIP.'));
          return;
        }
        if (!format) {
          T.show(box, errBox('Format arsip tidak dikenali. Tool ini membuka 7Z, RAR, TAR, dan TAR.GZ.'));
          return;
        }
        if (format === 'tar') {
          setStage('Membaca isi TAR…', 50);
          entries = uraiTar(data);
          if (!entries.length) { T.show(box, errBox('Arsip TAR ini kosong atau rusak.')); return; }
        } else if (format === 'gzip') {
          setStage('Membuka lapisan gzip…', 40);
          let isi;
          try {
            isi = await gunzipBytes(data);
          } catch (e) {
            T.show(box, errBox('File .gz ini rusak atau tidak lengkap, jadi tidak bisa dibuka.'));
            return;
          }
          setStage('Membaca isi arsip…', 70);
          const tar = uraiTar(isi);
          if (tar.length) {
            entries = tar;
          } else {
            // .gz biasa (bukan TAR.GZ): isinya satu file.
            const nama = /\.tar\.gz$/i.test(f.name) || /\.tgz$/i.test(f.name)
              ? f.name.replace(/\.tar\.gz$/i, '.tar').replace(/\.tgz$/i, '.tar')
              : f.name.replace(/\.gz$/i, '');
            entries = [{ nama, ukuran: isi.length, data: isi }];
          }
        } else {
          if (f.size > BATAS_7Z) {
            T.show(box, errBox('Arsip ini lebih dari 200 MB. Mesin pembuka 7Z/RAR di browser belum sanggup menangani arsip sebesar itu. Buka dengan 7-Zip atau WinRAR di komputer.'));
            return;
          }
          setStage('Memuat mesin pembuka arsip…', 30);
          entries = await ekstrak7z(data, f.name, sandiInp.value);
        }
        setStage('Selesai', 100);
        T.show(box, kv('Isi arsip', entries.length + ' file') + kv('Format', format === 'gzip' ? 'TAR.GZ / GZ' : format.toUpperCase()));
        tampilkanDaftar();
      } catch (e) {
        T.show(box, errBox((e && e.message) || 'Arsip tidak bisa dibuka. Coba lagi.'));
        const retry = T.btn('Coba lagi', () => proses());
        box.appendChild(retry);
      } finally {
        busy = false;
        goBtn.disabled = false;
        barWrap.hidden = true;
        barFill.style.width = '0%';
      }
    };

    const goBtn = T.btn('Buka arsip', proses, true);

    pBuka.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Buka isi arsip 7Z, RAR, TAR, dan TAR.GZ langsung di browser. File ZIP dibuka dengan tool Buat dan Buka ZIP.</p>'));
    pBuka.appendChild(T.field('Pilih file arsip', fi, 'Arsip 7Z/RAR di atas 200 MB belum bisa dibuka di sini.'));
    pBuka.appendChild(T.field('Kata sandi arsip (bila berkunci)', sandiInp, 'Kosongkan bila arsip tidak memakai kata sandi. Kata sandi tidak pernah dikirim ke mana-mana.'));
    pBuka.appendChild(T.row(goBtn));
    pBuka.appendChild(barWrap);
    pBuka.appendChild(box);
    pBuka.appendChild(listBox);
    pBuka.appendChild(prevBox);
    pBuka.appendChild(T.el('<p class="hint">Diproses di browser. Arsipmu tidak diunggah ke mana-mana. Arsip yang terbagi jadi beberapa bagian (part1.rar, .7z.001) belum bisa dibuka di sini.</p>'));
  }

  /* ============ Tab 2: Buat arsip (diserap dari Buat Arsip TAR.GZ, v6.21.0) ============ */
  const pBuat = T.el('<div></div>');
  {
    const fi = T.input('file');
    fi.multiple = true;
    const namaArsip = T.input('text', 'arsip', 'arsip');
    const listBox = T.out();
    const outBox = T.out();
    const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
    const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
    const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
    barTrack.appendChild(barFill);
    const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
    barWrap.appendChild(barTrack);
    barWrap.appendChild(barLabel);

    let files = [];
    let busy = false;

    const refreshList = () => {
      if (!files.length) {
        T.show(listBox, '<p class="hint">Belum ada file. Pilih satu atau banyak file di atas.</p>');
        return;
      }
      const total = files.reduce((a, f) => a + f.size, 0);
      T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + files.length + ' file, total ' + fmtBytes(total) + ':</p>');
      files.forEach((f, i) => {
        const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
        row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.name) + ' <span class="dim">(' + fmtBytes(f.size) + ')</span></span>'));
        const del = T.btn('Hapus', () => { files.splice(i, 1); refreshList(); });
        del.classList.add('small');
        del.disabled = busy;
        row.appendChild(del);
        listBox.appendChild(row);
      });
    };
    fi.addEventListener('change', () => {
      files = files.concat(Array.from(fi.files || []));
      fi.value = '';
      T.hide(outBox);
      refreshList();
    });

    const goBtn = T.btn('Buat & unduh TAR.GZ', async () => {
      if (busy) return;
      if (!files.length) { T.show(outBox, errBox('Pilih file dulu.')); return; }
      busy = true;
      goBtn.disabled = true;
      T.hide(outBox);
      barWrap.hidden = false;
      try {
        const namaUnik = namaArsipUnik(files.map((f) => f.name));
        const entri = [];
        for (let i = 0; i < files.length; i++) {
          const pct = Math.round((i / files.length) * 60);
          barFill.style.width = pct + '%';
          barLabel.textContent = 'Membaca file ' + (i + 1) + ' dari ' + files.length + '…';
          entri.push({ nama: namaUnik[i], data: new Uint8Array(await files[i].arrayBuffer()) });
        }
        barFill.style.width = '70%';
        barLabel.textContent = 'Menyusun arsip…';
        const tar = buatTar(entri);
        barFill.style.width = '85%';
        barLabel.textContent = 'Mengecilkan arsip…';
        const gz = await gzipBytes(tar);
        const blob = new Blob([gz], { type: 'application/gzip' });
        const nama = (namaArsip.value.trim() || 'arsip').replace(/[\\/:*?"<>|]/g, '-').replace(/\.tar\.gz$/i, '').replace(/\.tgz$/i, '');
        T.dl(nama + '.tar.gz', blob, 'application/gzip');
        const totalAwal = files.reduce((a, f) => a + f.size, 0);
        T.show(outBox, '<span class="ok">Selesai. Arsip TAR.GZ terunduh.</span>' +
          kv('File di dalam arsip', files.length + ' file') +
          kv('Ukuran file awal', fmtBytes(totalAwal)) +
          kv('Ukuran arsip', fmtBytes(blob.size)));
        T.toast('Arsip TAR.GZ terunduh');
      } catch (e) {
        const msg = (e && e.message) || '';
        T.show(outBox, errBox(/tidak bisa dimuat/i.test(msg) ? msg : 'Arsip tidak bisa dibuat. File mungkin terlalu besar untuk memori browser ini, coba dengan file yang lebih sedikit.'));
        const retry = T.btn('Coba lagi', () => goBtn.click());
        outBox.appendChild(retry);
      } finally {
        busy = false;
        goBtn.disabled = false;
        barWrap.hidden = true;
        barFill.style.width = '0%';
        refreshList();
      }
    }, true);

    pBuat.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Gabung banyak file jadi satu arsip .tar.gz yang bisa dibuka di Linux, Mac, Windows (dengan 7-Zip), dan tab Buka arsip di tool ini.</p>'));
    pBuat.appendChild(T.field('Pilih file (boleh banyak)', fi, 'File dipilih bertahap, semuanya masuk daftar di bawah.'));
    pBuat.appendChild(listBox);
    pBuat.appendChild(T.field('Nama arsip', namaArsip, 'Tanpa .tar.gz, nanti ditambahkan otomatis.'));
    pBuat.appendChild(T.row(goBtn, T.btn('Kosongkan daftar', () => { files = []; refreshList(); })));
    pBuat.appendChild(barWrap);
    pBuat.appendChild(outBox);
    pBuat.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
    refreshList();
  }

  const tabBar = tabs([['Buka arsip', 0], ['Buat arsip', 1]], [pBuka, pBuat]);
  root.appendChild(tabBar);
  root.appendChild(pBuka);
  root.appendChild(pBuat);
}
