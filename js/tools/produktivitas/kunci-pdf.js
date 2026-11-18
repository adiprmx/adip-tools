import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Kunci PDF: tambah kata sandi pembuka ke PDF (enkripsi AES-256, standar
// yang dipakai Acrobat). Mesinnya qpdf yang dikompilasi ke WebAssembly
// (@neslinesli93/qpdf-wasm) — pdf-lib TIDAK bisa mengenkripsi, jadi ini
// satu-satunya jalan client-side yang benar. Kata sandi tidak pernah
// keluar dari browser; tidak ada pemulihan bila lupa.
export const meta = {"id": "kunci-pdf", "name": "Kunci PDF", "cat": "produktivitas", "icon": "🔒", "desc": "Kunci PDF dengan kata sandi (AES-256), hanya yang tahu sandinya bisa buka.", "keywords": "kunci pdf,password pdf,enkripsi pdf,lindungi pdf,sandi pdf", "since": "6.16.0"};

const QPDF_ESM = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.1/+esm';
const QPDF_WASM = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.1/dist/qpdf.wasm';

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const sandiI = T.input('password', 'Kata sandi pembuka');
  const sandi2I = T.input('password', 'Ketik ulang kata sandinya');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

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

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    const sandi = sandiI.value;
    if (!sandi) { T.toast('Isi kata sandinya dulu'); sandiI.focus(); return; }
    if (sandi !== sandi2I.value) { T.toast('Kata sandi yang diketik ulang tidak sama'); sandi2I.focus(); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
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
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Kunci PDF', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE} Kata sandi tidak pernah keluar dari HP kamu.</p>`));
  root.appendChild(T.el('<p class="note">PDF yang sudah dikunci hanya bisa dibuka dengan kata sandi ini. <b>Kalau lupa kata sandinya, tidak ada yang bisa membukanya lagi.</b></p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.field('Kata sandi pembuka', sandiI, 'Makin panjang kata sandinya, makin aman.'));
  root.appendChild(T.field('Ketik ulang kata sandi', sandi2I, 'Supaya tidak salah ketik.'));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
