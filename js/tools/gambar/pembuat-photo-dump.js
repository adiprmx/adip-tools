import { h as T, utils, loadImage, fileInput, LOCAL_NOTE } from '../../core.js';

// Pembuat Photo Dump: setumpuk foto jadi slide-slide photo dump ala
// Instagram, satu foto per slide, dengan gaya scrapbook, polaroid,
// film, atau majalah. Tiap slide ukurannya 1080x1350 (rasio feed
// Instagram), bisa diunduh satu per satu atau sekaligus dalam ZIP.
// BEDA dari Kolase Foto (kolase-foto.js) yang menggabung foto jadi satu
// grid; di sini tiap foto jadi slide sendiri dengan hiasan gaya.
export const meta = {"id": "pembuat-photo-dump", "name": "Pembuat Photo Dump", "cat": "gambar", "icon": "📸", "desc": "Setumpuk foto jadi slide photo dump bergaya: scrapbook, polaroid, film, atau majalah.", "keywords": "photo dump,instagram,carousel,slide,scrapbook,polaroid,film,majalah", "since": "6.17.0"};

const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
const MAKS_FOTO = 10;
const LEBAR = 1080, TINGGI = 1350;

// Posisi dan rotasi foto per gaya, dalam fraksi dari ukuran slide.
// Dipakai render() dan bisa diuji tanpa DOM.
export const GAYA = {
  scrapbook: { latar: '#f3ead8', putar: [-4, 3, -2, 5, -3, 2, -5, 4, -2, 3], margin: 90, selotip: true, label: 'Scrapbook' },
  polaroid: { latar: '#faf7f0', putar: [-3, 2, -2, 3, -2, 2, -3, 2, -2, 3], margin: 110, selotip: false, label: 'Polaroid' },
  film: { latar: '#1c1a17', putar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], margin: 70, selotip: false, label: 'Film' },
  majalah: { latar: '#ffffff', putar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], margin: 60, selotip: false, label: 'Majalah' },
};

// Hitung kotak foto di dalam slide (murni, bisa diuji): foto di-cover ke
// kotak persegi dengan margin, lalu diputar sedikit sesuai gaya.
export function kotakSlide(gaya, i) {
  const g = GAYA[gaya] || GAYA.scrapbook;
  const sisi = LEBAR - g.margin * 2;
  const y = gaya === 'majalah' ? 200 : gaya === 'film' ? 150 : Math.round((TINGGI - sisi) / 2) - 40;
  return { x: g.margin, y, sisi, putar: g.putar[i % g.putar.length] };
}

// Gambar satu slide ke context canvas (context sudah berukuran LEBAR x TINGGI).
// img: HTMLImageElement (atau canvas), caption: teks di bawah foto,
// total: jumlah slide (penyebut nomor halaman majalah "01 / 05").
export function gambarSlide(ctx, img, gaya, i, caption, total) {
  const g = GAYA[gaya] || GAYA.scrapbook;
  const k = kotakSlide(gaya, i);
  ctx.save();
  ctx.fillStyle = g.latar;
  ctx.fillRect(0, 0, LEBAR, TINGGI);
  if (gaya === 'film') {
    // Lubang sproket film di kiri-kanan.
    ctx.fillStyle = '#f3ead8';
    for (let y = 40; y < TINGGI - 40; y += 70) {
      ctx.fillRect(18, y, 26, 40);
      ctx.fillRect(LEBAR - 44, y, 26, 40);
    }
  }
  if (gaya === 'majalah') {
    ctx.fillStyle = '#161311';
    ctx.font = '700 64px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('PHOTO DUMP', 60, 120);
    ctx.fillRect(60, 150, LEBAR - 120, 3);
    ctx.font = '400 28px Georgia, serif';
    ctx.fillStyle = '#55504a';
    ctx.fillText(String(i + 1).padStart(2, '0') + ' / ' + String(Math.max(1, total || i + 1)).padStart(2, '0'), 60, TINGGI - 60);
  }
  const cx = k.x + k.sisi / 2, cy = k.y + k.sisi / 2;
  ctx.translate(cx, cy);
  ctx.rotate((k.putar * Math.PI) / 180);
  // Bingkai putih ala cetakan foto.
  const bingkai = gaya === 'polaroid' ? 46 : gaya === 'scrapbook' ? 22 : 0;
  const bawah = gaya === 'polaroid' ? 130 : bingkai;
  if (bingkai > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillRect(-k.sisi / 2 - bingkai, -k.sisi / 2 - bingkai, k.sisi + bingkai * 2, k.sisi + bingkai + bawah);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  // Gambar foto menutupi kotak persegi (cover).
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const skala = Math.max(k.sisi / iw, k.sisi / ih);
  const dw = iw * skala, dh = ih * skala;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  if (g.selotip) {
    // Dua potong selotip di sudut atas.
    ctx.fillStyle = 'rgba(255, 214, 130, 0.75)';
    ctx.save();
    ctx.translate(-k.sisi / 2 + 30, -k.sisi / 2 - 10);
    ctx.rotate(-0.5);
    ctx.fillRect(-70, -18, 140, 36);
    ctx.restore();
    ctx.save();
    ctx.translate(k.sisi / 2 - 30, -k.sisi / 2 - 10);
    ctx.rotate(0.5);
    ctx.fillRect(-70, -18, 140, 36);
    ctx.restore();
  }
  ctx.restore();
  // Caption di bawah foto.
  const teks = String(caption || '').trim();
  if (teks) {
    ctx.save();
    ctx.font = gaya === 'film' ? '400 34px Georgia, serif' : gaya === 'majalah' ? 'italic 400 36px Georgia, serif' : '400 38px "Segoe Script", "Comic Sans MS", cursive';
    ctx.fillStyle = gaya === 'film' ? '#f3ead8' : '#3a332c';
    ctx.textAlign = 'center';
    const yCap = gaya === 'polaroid' ? k.y + k.sisi + 100 : k.y + k.sisi + 90;
    ctx.fillText(teks.slice(0, 60), LEBAR / 2, Math.min(yCap, TINGGI - 50));
    ctx.restore();
  }
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const gayaSel = T.select(Object.entries(GAYA).map(([v, g]) => [v, g.label]), 'scrapbook');
  const captionInp = T.input('text', 'Tulisan di bawah foto (boleh kosong)');
  const statusBox = T.out();
  const daftarBox = T.out();
  const hasilBox = T.out();

  let daftar = []; // [{img, nama, url}]
  // Loader library kanonis: utils.loadLibOnce (core.js).
  let slideBlob = []; // Blob PNG per slide



  function gambarDaftar() {
    T.show(daftarBox, '');
    if (!daftar.length) {
      daftarBox.appendChild(T.el('<p class="dim">Belum ada foto. Pilih 2 sampai 10 foto.</p>'));
      return;
    }
    daftar.forEach((item, i) => {
      const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
      const kiri = T.el('<div style="display:flex;gap:10px;align-items:center;min-width:0"></div>');
      const thumb = document.createElement('img');
      thumb.src = item.url; thumb.alt = item.nama;
      thumb.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:8px;flex:none';
      const nama = T.el(`<div style="word-break:break-word"><b>${i + 1}. ${T.esc(item.nama)}</b></div>`);
      kiri.appendChild(thumb); kiri.appendChild(nama);
      const tombol = T.el('<div style="display:flex;gap:6px;flex:none"></div>');
      const naikB = T.btn('↑', () => { if (i > 0) { const t = daftar[i - 1]; daftar[i - 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === 0);
      const turunB = T.btn('↓', () => { if (i < daftar.length - 1) { const t = daftar[i + 1]; daftar[i + 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === daftar.length - 1);
      const hapusB = T.btn('Hapus', () => { URL.revokeObjectURL(daftar[i].url); daftar.splice(i, 1); buatB.disabled = daftar.length < 1; gambarDaftar(); });
      [naikB, turunB, hapusB].forEach((b) => { b.classList.add('small'); tombol.appendChild(b); });
      baris.appendChild(kiri); baris.appendChild(tombol);
      daftarBox.appendChild(baris);
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
        daftar.push({ img, nama: f.name || 'foto', url: URL.createObjectURL(f) });
      } catch (e) { gagal++; }
    }
    T.hide(statusBox);
    if (gagal) T.toast(`${gagal} foto tidak bisa dibuka, dilewati`);
    if (files.length > batch.length) T.toast(`Hanya ${batch.length} foto pertama yang dipakai (maksimal ${MAKS_FOTO})`);
    fi.value = '';
    buatB.disabled = daftar.length < 1;
    gambarDaftar();
  });

  async function buat() {
    if (!daftar.length) { T.toast('Pilih foto dulu'); return; }
    T.hide(hasilBox);
    buatB.disabled = true;
    slideBlob = [];
    try {
      const gaya = gayaSel.value;
      const caption = captionInp.value;
      const c = document.createElement('canvas');
      c.width = LEBAR; c.height = TINGGI;
      const ctx = c.getContext('2d');
      T.show(hasilBox, '');
      for (let i = 0; i < daftar.length; i++) {
        T.show(statusBox, `<span class="dim">Membuat slide ${i + 1} dari ${daftar.length}…</span>`);
        await new Promise((r) => setTimeout(r, 0));
        gambarSlide(ctx, daftar[i].img, gaya, i, caption, daftar.length);
        const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
        if (!blob) continue;
        slideBlob.push(blob);
        const url = URL.createObjectURL(blob);
        T.onLeave(() => URL.revokeObjectURL(url));
        const kartu = T.el('<div style="margin-bottom:14px"></div>');
        const im = document.createElement('img');
        im.src = url; im.alt = 'Slide ' + (i + 1);
        im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
        kartu.appendChild(im);
        const idx = i;
        kartu.appendChild(T.btn('Unduh Slide ' + (i + 1), () => { T.dl(`photo-dump-${String(idx + 1).padStart(2, '0')}.png`, slideBlob[idx], 'image/png'); }));
        hasilBox.appendChild(kartu);
      }
      T.hide(statusBox);
      hasilBox.appendChild(T.el(`<p class="dim">${slideBlob.length} slide jadi, ukuran tiap slide 1080 × 1350.</p>`));
      zipB.disabled = slideBlob.length === 0;
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat slide. Coba kurangi jumlah foto.</div>');
    } finally {
      buatB.disabled = daftar.length < 1;
    }
  }

  async function unduhZip() {
    if (!slideBlob.length) { T.toast('Belum ada slide'); return; }
    zipB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
    try {
      const ok = await utils.loadLibOnce(ZIP_CDN, () => typeof window.JSZip === 'function');
      if (!ok) throw new Error('zip gagal dimuat');
      const zip = new window.JSZip();
      slideBlob.forEach((b, i) => zip.file(`photo-dump-${String(i + 1).padStart(2, '0')}.png`, b));
      const blob = await zip.generateAsync({ type: 'blob' });
      T.dl('photo-dump.zip', blob, 'application/zip');
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat ZIP, coba lagi');
    } finally {
      T.hide(statusBox);
      zipB.disabled = slideBlob.length === 0;
    }
  }

  const buatB = T.btn('Buat Slide', buat, true, true);
  const tambahB = T.btn('Tambah Foto Lagi', () => fi.click());
  const zipB = T.btn('Unduh Semua (ZIP)', unduhZip, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto (bisa banyak sekaligus)', fi, `Minimal 1, maksimal ${MAKS_FOTO} foto. Urutannya bisa diubah di bawah.`));
  root.appendChild(T.field('Gaya slide', gayaSel));
  root.appendChild(T.field('Tulisan di bawah foto', captionInp, 'Tulisan yang sama muncul di semua slide. Kosongkan bila tidak perlu.'));
  root.appendChild(statusBox);
  root.appendChild(daftarBox);
  root.appendChild(T.row(tambahB, buatB));
  root.appendChild(hasilBox);
  root.appendChild(zipB);
  gambarDaftar();
}
