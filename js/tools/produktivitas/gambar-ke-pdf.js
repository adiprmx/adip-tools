import { h as T, utils, loadImage, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Gambar ke PDF: gabung foto JPG/PNG jadi satu file PDF, satu foto satu
// halaman. PDF Lab (pdflab.js) punya tab serupa; tool ini versi mandiri
// yang fokus: pilih foto, atur urutan dan ukuran halaman, unduh.
// Mesin PDF-nya pdf-lib, sama seperti PDF Lab.
export const meta = {"id": "gambar-ke-pdf", "name": "Gambar ke PDF", "cat": "produktivitas", "icon": "🖼️", "desc": "Gabung foto-foto jadi satu file PDF, satu foto satu halaman.", "keywords": "gambar ke pdf,foto ke pdf,jpg ke pdf,png ke pdf,gabung foto", "since": "6.16.0"};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_FOTO = 50;

export function render(root) {
  const fi = fileInput('image/jpeg,image/png,image/webp');
  fi.multiple = true;
  const ukuranSel = T.select([
    ['pas', 'Sepas foto (halaman mengikuti foto)'],
    ['a4', 'A4 tegak (foto di tengah halaman)'],
    ['a4-l', 'A4 mendatar (foto di tengah halaman)'],
  ], 'pas');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  let daftar = []; // [{file, img, nama, url}]
  // Loader library kanonis: utils.loadLibOnce (core.js).

  function gambarDaftar() {
    T.show(box, '');
    if (!daftar.length) {
      box.appendChild(T.el('<p class="dim">Belum ada foto. Pilih foto JPG, PNG, atau WebP.</p>'));
      return;
    }
    daftar.forEach((item, i) => {
      const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
      const kiri = T.el('<div style="display:flex;gap:10px;align-items:center;min-width:0"></div>');
      const thumb = document.createElement('img');
      thumb.src = item.url; thumb.alt = item.nama;
      thumb.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:8px;flex:none';
      const nama = T.el(`<div style="word-break:break-word"><b>Halaman ${i + 1}: ${T.esc(item.nama)}</b><div class="dim" style="font-size:12px">${item.img.naturalWidth}×${item.img.naturalHeight}</div></div>`);
      kiri.appendChild(thumb); kiri.appendChild(nama);
      const tombol = T.el('<div style="display:flex;gap:6px;flex:none"></div>');
      const naikB = T.btn('↑', () => { if (i > 0) { const t = daftar[i - 1]; daftar[i - 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === 0);
      const turunB = T.btn('↓', () => { if (i < daftar.length - 1) { const t = daftar[i + 1]; daftar[i + 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === daftar.length - 1);
      const hapusB = T.btn('Hapus', () => { URL.revokeObjectURL(daftar[i].url); daftar.splice(i, 1); buatB.disabled = !daftar.length; gambarDaftar(); });
      [naikB, turunB, hapusB].forEach((b) => { b.classList.add('small'); tombol.appendChild(b); });
      baris.appendChild(kiri); baris.appendChild(tombol);
      box.appendChild(baris);
    });
  }

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])];
    if (!files.length) return;
    T.hide(hasilBox); T.hide(statusBox);
    const sisa = MAKS_FOTO - daftar.length;
    if (sisa <= 0) { T.toast(`Maksimal ${MAKS_FOTO} foto`); fi.value = ''; return; }
    const batch = files.slice(0, sisa);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    let gagal = 0;
    for (const f of batch) {
      try {
        const img = await loadImage(f);
        daftar.push({ file: f, img, nama: f.name || 'foto', url: URL.createObjectURL(f) });
      } catch (e) { gagal++; }
    }
    T.hide(statusBox);
    if (gagal) T.toast(`${gagal} foto tidak bisa dibuka, dilewati`);
    fi.value = '';
    buatB.disabled = !daftar.length;
    gambarDaftar();
  });

  // Foto apa pun -> JPEG (pdf-lib hanya menerima JPG/PNG mentah; WebP
  // diubah dulu lewat canvas supaya tetap bisa masuk PDF).
  async function fotoKeJpg(item) {
    const t = (item.file.type || '').toLowerCase();
    if (t === 'image/jpeg' || t === 'image/jpg') return { bytes: new Uint8Array(await item.file.arrayBuffer()), jpg: true };
    if (t === 'image/png') return { bytes: new Uint8Array(await item.file.arrayBuffer()), jpg: false };
    const c = document.createElement('canvas');
    c.width = item.img.naturalWidth; c.height = item.img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(item.img, 0, 0);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));
    if (!blob) throw new Error('gagal mengubah foto');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), jpg: true };
  }

  async function buat() {
    if (!daftar.length) { T.toast('Pilih foto dulu'); return; }
    T.hide(hasilBox);
    buatB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    try {
      const L = window.PDFLib;
      const doc = await L.PDFDocument.create();
      for (let i = 0; i < daftar.length; i++) {
        T.show(statusBox, `<span class="dim">Menempel foto ${i + 1} dari ${daftar.length}…</span>`);
        await new Promise((r) => setTimeout(r, 0));
        const item = daftar[i];
        const { bytes, jpg } = await fotoKeJpg(item);
        const gambar = jpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
        const mode = ukuranSel.value;
        let pw, ph, x = 0, y = 0, dw, dh;
        if (mode === 'pas') {
          // 1 px = 0,75 pt supaya ukuran halaman wajar di pembaca PDF.
          pw = gambar.width * 0.75; ph = gambar.height * 0.75;
          dw = pw; dh = ph;
        } else {
          pw = mode === 'a4' ? 595.28 : 841.89;
          ph = mode === 'a4' ? 841.89 : 595.28;
          const s = Math.min((pw - 72) / gambar.width, (ph - 72) / gambar.height);
          dw = gambar.width * s; dh = gambar.height * s;
          x = (pw - dw) / 2; y = (ph - dh) / 2;
        }
        const page = doc.addPage([pw, ph]);
        page.drawImage(gambar, { x, y, width: dw, height: dh });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="note">PDF jadi: <b>${daftar.length} halaman</b>, ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl('foto-gabung.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat PDF. Coba kurangi jumlah foto atau pakai foto lain.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      buatB.disabled = !daftar.length;
    }
  }

  const buatB = T.btn('Buat PDF', buat, true, true);
  const tambahB = T.btn('Tambah Foto Lagi', () => fi.click());

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto (bisa banyak sekaligus)', fi, `Maksimal ${MAKS_FOTO} foto sekali buat.`));
  root.appendChild(T.field('Ukuran halaman', ukuranSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(tambahB, buatB));
  root.appendChild(hasilBox);
  gambarDaftar();
}
