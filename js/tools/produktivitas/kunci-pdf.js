import { h as T, fileInput, fmtBytes, LOCAL_NOTE, tabs } from '../../core.js';

// Kunci PDF: tambah kata sandi pembuka ke PDF (enkripsi AES-256, standar
// yang dipakai Acrobat) atau hapus kata sandi dari PDF milik sendiri
// (sandinya harus diketahui — tab "Buka kunci", diserap dari Buka Kunci
// PDF, v6.21.0). Mesinnya qpdf yang dikompilasi ke WebAssembly
// (@neslinesli93/qpdf-wasm) — pdf-lib TIDAK bisa mengenkripsi atau
// mendekripsi, jadi ini satu-satunya jalan client-side yang benar. Kata
// sandi tidak pernah keluar dari browser; tidak ada pemulihan bila lupa.
export const meta = {"id": "kunci-pdf", "name": "Kunci PDF", "cat": "produktivitas", "icon": "🔒", "desc": "Kunci PDF dengan kata sandi (AES-256), atau buka kunci PDF milikmu yang sandinya kamu ketahui.", "keywords": "kunci pdf,password pdf,enkripsi pdf,lindungi pdf,sandi pdf,buka kunci pdf,hapus password pdf,decrypt pdf,pdf terkunci", "since": "6.16.0"};

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
  // Mesin qpdf dimuat SATU kali dan dipakai kedua mode (v6.21.0).
  let pabrikSiap = null; // Promise<createModule>

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

  // Satu operasi = satu instance modul baru (Emscripten main hanya boleh
  // jalan sekali per instance; instance baru menghindari state sisa).
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

  /* ============ Tab 1: Kunci PDF ============ */
  const pKunci = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf,.pdf');
    const sandiI = T.input('password', 'Kata sandi pembuka');
    const sandi2I = T.input('password', 'Ketik ulang kata sandinya');
    const box = T.out();
    const statusBox = T.out();
    const hasilBox = T.out();

    async function prosesKunci() {
      const f = fi.files && fi.files[0];
      if (!f) { T.toast('Pilih file PDF dulu'); return; }
      const sandi = sandiI.value;
      if (!sandi) { T.toast('Isi kata sandinya dulu'); sandiI.focus(); return; }
      if (sandi !== sandi2I.value) { T.toast('Kata sandi yang diketik ulang tidak sama'); sandi2I.focus(); return; }
      T.hide(box); T.hide(hasilBox);
      kunciB.disabled = true;
      T.show(statusBox, '<span class="dim">Mengunci PDF… (pertama kali butuh internet untuk memuat mesin, sekitar 3 MB)</span>');
      try {
        const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
        const bytes = new Uint8Array(await f.arrayBuffer());
        const keluar = await jalankanQpdf(bytes, ['--encrypt', sandi, sandi, '256', '--', '/masuk.pdf', '/keluar.pdf']);
        const blob = new Blob([keluar], { type: 'application/pdf' });
        T.hide(statusBox);
        T.show(box, `<p class="note">PDF sudah terkunci dengan kata sandi.<br><b>Simpan kata sandinya baik-baik.</b> Kalau lupa, tidak ada yang bisa membukanya lagi, termasuk tool ini.</p>`);
        T.show(hasilBox, '');
        hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
        hasilBox.appendChild(T.btn('Unduh PDF Terkunci', () => { T.dl(`${namaDasar}-terkunci.pdf`, blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
        T.scrollToPreview(box);
      } catch (e) {
        const timeout = e && e.message === 'timeout-muat';
        T.show(statusBox, timeout
          ? '<div class="err">Mesin kunci terlalu lama dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>'
          : '<div class="err">PDF tidak bisa dikunci. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
        statusBox.querySelector('button').addEventListener('click', prosesKunci);
      } finally {
        kunciB.disabled = false;
      }
    }

    const kunciB = T.btn('Kunci PDF', prosesKunci, true);

    pKunci.appendChild(T.el('<p class="note">PDF yang sudah dikunci hanya bisa dibuka dengan kata sandi ini. <b>Kalau lupa kata sandinya, tidak ada yang bisa membukanya lagi.</b></p>'));
    pKunci.appendChild(T.field('Pilih file PDF', fi));
    pKunci.appendChild(T.field('Kata sandi pembuka', sandiI, 'Makin panjang kata sandinya, makin aman.'));
    pKunci.appendChild(T.field('Ketik ulang kata sandi', sandi2I, 'Supaya tidak salah ketik.'));
    pKunci.appendChild(kunciB);
    pKunci.appendChild(statusBox);
    pKunci.appendChild(box);
    pKunci.appendChild(hasilBox);
  }

  /* ============ Tab 2: Buka kunci (diserap dari Buka Kunci PDF, v6.21.0) ============ */
  const pBuka = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf,.pdf');
    const sandiI = T.input('password', 'Kata sandi PDF-nya');
    const box = T.out();
    const statusBox = T.out();
    const hasilBox = T.out();

    async function prosesBuka() {
      const f = fi.files && fi.files[0];
      if (!f) { T.toast('Pilih file PDF dulu'); return; }
      const sandi = sandiI.value;
      if (!sandi) { T.toast('Isi kata sandi PDF-nya dulu'); sandiI.focus(); return; }
      T.hide(box); T.hide(hasilBox);
      bukaB.disabled = true;
      try {
        const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
        const bytes = new Uint8Array(await f.arrayBuffer());
        if (!pdfTerkunci(bytes)) {
          T.show(statusBox, '<div class="err">PDF ini tidak terkunci kata sandi, jadi tidak ada yang perlu dibuka.</div>');
          bukaB.disabled = false;
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
        if (tombol) tombol.addEventListener('click', prosesBuka);
      } finally {
        bukaB.disabled = false;
      }
    }

    const bukaB = T.btn('Buka Kunci PDF', prosesBuka, true);

    pBuka.appendChild(T.el('<p class="note">Tool ini hanya untuk PDF milikmu sendiri yang kata sandinya kamu ketahui. Tool ini tidak menebak kata sandi.</p>'));
    pBuka.appendChild(T.field('Pilih file PDF yang terkunci', fi));
    pBuka.appendChild(T.field('Kata sandi PDF-nya', sandiI));
    pBuka.appendChild(bukaB);
    pBuka.appendChild(statusBox);
    pBuka.appendChild(box);
    pBuka.appendChild(hasilBox);
  }

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE} Kata sandi tidak pernah keluar dari HP kamu.</p>`));
  const tabBar = tabs([['Kunci PDF', 0], ['Buka kunci', 1]], [pKunci, pBuka]);
  root.appendChild(tabBar);
  root.appendChild(pKunci);
  root.appendChild(pBuka);
}
