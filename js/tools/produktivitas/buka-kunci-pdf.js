import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Buka Kunci PDF: hapus kata sandi dari PDF milik sendiri (kata sandinya
// harus diketahui). Mesinnya qpdf WebAssembly (@neslinesli93/qpdf-wasm) —
// pdf-lib TIDAK bisa mendekripsi, jadi ini satu-satunya jalan client-side
// yang benar. Tool ini TIDAK menebak kata sandi; sandi yang salah =
// gagal, dan itu memang seharusnya.
export const meta = {"id": "buka-kunci-pdf", "name": "Buka Kunci PDF", "cat": "produktivitas", "icon": "🔓", "desc": "Hapus kata sandi PDF milikmu sendiri (sandinya harus kamu ketahui).", "keywords": "buka kunci pdf,hapus password pdf,decrypt pdf,pdf terkunci", "since": "6.16.0"};

const QPDF_ESM = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.1/+esm';
const QPDF_WASM = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.1/dist/qpdf.wasm';

// Cek kasar apakah PDF terenkripsi: cari penanda /Encrypt di byte awal
// dan akhir file (trailer ada di akhir). Murni, bisa diuji tanpa DOM.
export function pdfTerkunci(bytes) {
  const cari = (buf) => {
    const teks = String.fromCharCode.apply(null, buf);
    return teks.indexOf('/Encrypt') !== -1;
  };
  if (bytes.length <= 65536) return cari(bytes);
  const awal = bytes.subarray(0, 32768);
  const akhir = bytes.subarray(bytes.length - 32768);
  return cari(awal) || cari(akhir);
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const sandiI = T.input('password', 'Kata sandi PDF-nya');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  let pabrikSiap = null;

  const muatPabrik = () => {
    if (!pabrikSiap) {
      pabrikSiap = import(/* @vite-ignore */ QPDF_ESM).then((m) => {
        const buat = m.default || m;
        if (typeof buat !== 'function') throw new Error('qpdf tidak lengkap');
        return buat;
      }).catch((e) => { pabrikSiap = null; throw e; });
    }
    return pabrikSiap;
  };

  async function jalankanQpdf(bytesMasuk, argumen) {
    const buat = await muatPabrik();
    const pesanErr = [];
    const modul = await Promise.race([
      buat({
        locateFile: () => QPDF_WASM,
        printErr: (t) => { pesanErr.push(String(t)); },
      }),
      new Promise((_, tolak) => setTimeout(() => tolak(new Error('timeout-muat')), 90000)),
    ]);
    try {
      modul.FS.writeFile('/masuk.pdf', bytesMasuk);
      const kode = modul.callMain(argumen);
      if (kode !== 0) {
        const err = new Error(pesanErr.join('\n') || `qpdf gagal (kode ${kode})`);
        err.kode = kode;
        throw err;
      }
      const keluar = modul.FS.readFile('/keluar.pdf');
      return new Uint8Array(keluar);
    } finally {
      try { modul.FS.unlink('/masuk.pdf'); } catch (e) {}
      try { modul.FS.unlink('/keluar.pdf'); } catch (e) {}
    }
  }

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    const sandi = sandiI.value;
    if (!sandi) { T.toast('Isi kata sandi PDF-nya dulu'); sandiI.focus(); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (!pdfTerkunci(bytes)) {
        T.show(statusBox, '<div class="err">PDF ini tidak terkunci kata sandi, jadi tidak ada yang perlu dibuka.</div>');
        prosesB.disabled = false;
        return;
      }
      T.show(statusBox, '<span class="dim">Membuka kunci PDF… (pertama kali butuh internet untuk memuat mesin, sekitar 3 MB)</span>');
      const keluar = await jalankanQpdf(bytes, [`--password=${sandi}`, '--decrypt', '/masuk.pdf', '/keluar.pdf']);
      const blob = new Blob([keluar], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, '<p class="note">Kunci PDF sudah dibuka. File hasilnya bisa dibuka tanpa kata sandi.</p>');
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF Tanpa Kunci', () => { T.dl(`${namaDasar}-terbuka.pdf`, blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      const timeout = e && e.message === 'timeout-muat';
      // Pesan error qpdf tidak bisa ditangkap (mesin wasm menulis langsung
      // ke konsol, bukan lewat printErr — terverifikasi lewat probe Node),
      // jadi sandi salah dan file rusak tidak bisa dibedakan: satu pesan
      // jujur yang mencakup keduanya.
      T.show(statusBox, timeout
        ? '<div class="err">Mesin pembuka kunci terlalu lama dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>'
        : '<div class="err">Kata sandinya mungkin salah, atau PDF-nya tidak bisa dibuka. Periksa kata sandinya lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Buka Kunci PDF', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE} Kata sandi tidak pernah keluar dari HP kamu.</p>`));
  root.appendChild(T.el('<p class="note">Tool ini hanya untuk PDF milikmu sendiri yang kata sandinya kamu ketahui. Tool ini tidak menebak kata sandi.</p>'));
  root.appendChild(T.field('Pilih file PDF yang terkunci', fi));
  root.appendChild(T.field('Kata sandi PDF-nya', sandiI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
