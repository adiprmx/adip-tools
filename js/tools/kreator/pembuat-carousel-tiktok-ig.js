import { h as T } from '../../core.js';

// Editor carousel: sampai 10 slide, digambar ke canvas dan diekspor PNG
// per slide. Ukuran 1080x1350 (4:5) atau 1080x1080 (1:1).
const WARNA = [
  { nama: 'Arang', bg: '#161311', teks: '#f4f4f5', aksen: '#ff6f61' },
  { nama: 'Coral', bg: '#ff6f61', teks: '#161311', aksen: '#161311' },
  { nama: 'Krem', bg: '#f5efe6', teks: '#161311', aksen: '#ff6f61' },
  { nama: 'Laut', bg: '#0f2a43', teks: '#f4f4f5', aksen: '#ffd166' },
  { nama: 'Daun', bg: '#14342b', teks: '#f4f4f5', aksen: '#4ade80' },
];
const UKURAN = { '45': [1080, 1350, '1080 × 1350 (4:5)'], '11': [1080, 1080, '1080 × 1080 (1:1)'] };
const MAKS_SLIDE = 10;

function bungkus(ctx, teks, maksLebar) {
  const kata = String(teks || '').split(/\s+/).filter(Boolean);
  const baris = [];
  let cur = '';
  kata.forEach((w) => {
    const coba = cur ? cur + ' ' + w : w;
    if (ctx.measureText(coba).width > maksLebar && cur) { baris.push(cur); cur = w; }
    else cur = coba;
  });
  if (cur) baris.push(cur);
  return baris;
}

export const meta = {"id": "pembuat-carousel-tiktok-ig", "name": "Pembuat Carousel TikTok/IG", "cat": "kreator", "icon": "🖼️", "desc": "Susun carousel sampai 10 slide dan unduh tiap slide sebagai gambar.", "keywords": "carousel,tiktok,instagram,slide,desain,konten,posting", "since": "6.16.0"};
export function render(root) {
  const slides = [{ judul: '', isi: '', warna: 0 }];
  let aktif = 0;
  let format = '45';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;max-width:360px;height:auto;display:block;margin:0 auto;border:1px solid rgba(255,255,255,.12);border-radius:12px';
  const ctx = canvas.getContext('2d');

  const judulI = T.input('text', 'Judul slide — cth: 3 Kesalahan Masak Nasi', '');
  const isiI = T.ta(4, 'Isi slide — tulis poin-poin singkat di sini');
  const daftar = T.el('<div class="row" style="flex-wrap:wrap;gap:6px;margin:12px 0"></div>');
  const palet = T.el('<div class="row" style="flex-wrap:wrap;gap:8px;margin:12px 0"></div>');

  const gambarSlide = (i) => {
    const s = slides[i];
    const [W, H] = UKURAN[format];
    canvas.width = W; canvas.height = H;
    const w = WARNA[s.warna];
    ctx.fillStyle = w.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = w.aksen; ctx.fillRect(80, 90, 120, 14);
    ctx.fillStyle = w.teks;
    ctx.font = '700 72px system-ui, -apple-system, sans-serif';
    const judulBaris = bungkus(ctx, s.judul || 'Judul slide', W - 160);
    judulBaris.slice(0, 4).forEach((b, j) => ctx.fillText(b, 80, 220 + j * 92));
    ctx.font = '400 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = w.teks;
    ctx.globalAlpha = 0.85;
    const isiBaris = bungkus(ctx, s.isi, W - 160);
    const mulaiY = 220 + Math.min(judulBaris.length, 4) * 92 + 40;
    isiBaris.slice(0, 12).forEach((b, j) => ctx.fillText(b, 80, mulaiY + j * 56));
    ctx.globalAlpha = 1;
    ctx.font = '400 30px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = w.aksen;
    ctx.fillText((i + 1) + ' / ' + slides.length, 80, H - 70);
    // Titik indikator slide
    slides.forEach((_, k) => {
      ctx.beginPath();
      ctx.arc(W - 80 - (slides.length - 1 - k) * 34, H - 78, k === i ? 11 : 7, 0, Math.PI * 2);
      ctx.fillStyle = k === i ? w.aksen : w.teks;
      ctx.globalAlpha = k === i ? 1 : 0.4;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const segarkanDaftar = () => {
    daftar.innerHTML = '';
    slides.forEach((s, i) => {
      const b = T.btn('Slide ' + (i + 1), () => { aktif = i; muatEditor(); gambarSlide(i); segarkanDaftar(); });
      if (i === aktif) { b.style.background = '#ff6f61'; b.style.color = '#161311'; }
      daftar.appendChild(b);
    });
  };
  const muatEditor = () => {
    judulI.value = slides[aktif].judul;
    isiI.value = slides[aktif].isi;
    palet.querySelectorAll('button').forEach((b, i) => { b.style.borderColor = i === slides[aktif].warna ? '#fff' : 'rgba(255,255,255,.2)'; });
  };
  const segarkan = () => { slides[aktif].judul = judulI.value; slides[aktif].isi = isiI.value; gambarSlide(aktif); };

  judulI.addEventListener('input', segarkan);
  isiI.addEventListener('input', segarkan);

  WARNA.forEach((w, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = w.nama;
    b.style.cssText = 'min-height:36px;padding:0 12px;border-radius:999px;border:2px solid rgba(255,255,255,.2);background:' + w.bg + ';color:' + w.teks + ';font-size:13px;cursor:pointer';
    b.addEventListener('click', () => { slides[aktif].warna = i; muatEditor(); gambarSlide(aktif); });
    palet.appendChild(b);
  });

  const formatS = T.select(Object.entries(UKURAN).map(([k, v]) => [k, v[2]]), '45');
  formatS.addEventListener('change', () => { format = formatS.value; gambarSlide(aktif); });

  const tambahBtn = T.btn('＋ Tambah slide', () => {
    if (slides.length >= MAKS_SLIDE) { T.toast('Maksimal ' + MAKS_SLIDE + ' slide'); return; }
    slides.push({ judul: '', isi: '', warna: 0 });
    aktif = slides.length - 1;
    muatEditor(); gambarSlide(aktif); segarkanDaftar();
    judulI.focus();
  });
  const hapusBtn = T.btn('🗑 Hapus slide ini', () => {
    if (slides.length <= 1) { T.toast('Slide terakhir tidak bisa dihapus'); return; }
    slides.splice(aktif, 1);
    aktif = Math.max(0, aktif - 1);
    muatEditor(); gambarSlide(aktif); segarkanDaftar();
  });
  const unduhSatu = T.btn('⬇ Unduh slide ini (PNG)', () => {
    gambarSlide(aktif);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'carousel-slide-' + (aktif + 1) + '.png';
    a.click();
  });
  const unduhSemua = T.btn('⬇ Unduh semua slide', () => {
    slides.forEach((_, i) => {
      setTimeout(() => {
        gambarSlide(i);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'carousel-slide-' + (i + 1) + '.png';
        a.click();
        if (i === slides.length - 1) setTimeout(() => gambarSlide(aktif), 400);
      }, i * 600);
    });
    T.toast('Mengunduh ' + slides.length + ' gambar — izinkan unduhan ganda bila browser bertanya');
  });

  root.appendChild(T.el('<p class="note">Tulis tiap slide, pilih warna, lalu unduh sebagai gambar siap posting. Maksimal ' + MAKS_SLIDE + ' slide per carousel.</p>'));
  root.appendChild(T.field('Ukuran gambar', formatS));
  root.appendChild(daftar);
  root.appendChild(canvas);
  root.appendChild(palet);
  root.appendChild(T.field('Judul slide ' + '(slide yang sedang dipilih)', judulI));
  root.appendChild(T.field('Isi slide', isiI));
  const tombol = T.el('<div class="row" style="flex-wrap:wrap;gap:8px"></div>');
  tombol.appendChild(tambahBtn); tombol.appendChild(hapusBtn);
  tombol.appendChild(unduhSatu); tombol.appendChild(unduhSemua);
  root.appendChild(tombol);

  segarkanDaftar();
  muatEditor();
  gambarSlide(0);
}
