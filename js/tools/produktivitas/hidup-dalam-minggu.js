import { h as T, utils, canvasToBlob } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node).
utils.mingguHidup = function (tglLahirISO, usiaHarapan, sekarangISO) {
  const lahir = new Date(tglLahirISO + 'T00:00:00');
  const sekarang = sekarangISO ? new Date(sekarangISO + 'T00:00:00') : new Date();
  if (isNaN(lahir.getTime())) return null;
  const total = Math.max(1, Math.round(Number(usiaHarapan) || 80)) * 52;
  const lewat = Math.max(0, Math.min(total, Math.floor((sekarang - lahir) / (7 * 24 * 3600 * 1000))));
  return { total, lewat, sisa: total - lewat, persen: Math.round((lewat / total) * 1000) / 10 };
};

export const meta = {"id": "hidup-dalam-minggu", "name": "Hidup dalam Minggu", "cat": "produktivitas", "icon": "📅", "desc": "Lihat seluruh hidupmu sebagai kotak-kotak minggu.", "keywords": "life in weeks,minggu,hidup,waktu,memento mori,refleksi", "since": "6.11.0"};

export function render(root) {
  const lahir = T.input('date', '', '');
  const usia = T.input('text', 'Contoh: 80', '80'); usia.inputMode = 'decimal';
  const box = T.out();
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:12px;margin-top:12px';
  let terakhir = null;

  function gambar(r) {
    const tahun = Math.ceil(r.total / 52);
    const sel = 10, gap = 2, pad = 12;
    const w = pad * 2 + 52 * (sel + gap);
    const h = pad * 2 + tahun * (sel + gap);
    kanvas.width = w; kanvas.height = h;
    const ctx = kanvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < r.total; i++) {
      const x = pad + (i % 52) * (sel + gap);
      const y = pad + Math.floor(i / 52) * (sel + gap);
      if (i < r.lewat) { ctx.fillStyle = '#f4f4f5'; ctx.fillRect(x, y, sel, sel); }
      else { ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, sel - 1, sel - 1); }
    }
  }

  function tampil() {
    if (!lahir.value) { T.show(box, '<div class="hint">Isi dulu tanggal lahirmu.</div>'); return; }
    const r = utils.mingguHidup(lahir.value, T.num(usia.value));
    if (!r) { T.show(box, '<div class="hint">Tanggal lahir tidak valid.</div>'); return; }
    terakhir = r;
    gambar(r);
    T.show(box,
      `<div class="kv"><span>Minggu yang sudah lewat</span><b style="color:#fff">${T.fmt(r.lewat)} minggu</b></div>` +
      `<div class="kv"><span>Minggu yang tersisa</span><b>${T.fmt(r.sisa)} minggu</b></div>` +
      `<div class="kv"><span>Bagian hidup yang sudah berjalan</span><b>${r.persen}%</b></div>` +
      `<div class="hint">Tiap kotak adalah satu minggu. Kotak putih adalah minggu yang sudah lewat, kotak kosong adalah yang tersisa sampai usia ${T.num(usia.value) || 80} tahun. Angka usia harapan bisa diubah, ini hanya gambaran, bukan ramalan.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Satu kotak sama dengan satu minggu hidupmu. Melihatnya sekaligus sering membuat orang lebih sadar memakai waktunya.</p>'));
  root.appendChild(T.grid2(
    T.field('Tanggal lahir', lahir),
    T.field('Perkiraan usia harapan (tahun)', usia)
  ));
  root.appendChild(T.row(
    T.btn('Tampilkan', tampil, true),
    T.btn('Unduh sebagai gambar', async () => {
      if (!terakhir) { T.toast('Tampilkan dulu gambarnya'); return; }
      const blob = await canvasToBlob(kanvas, 'image/png');
      if (!blob) { T.toast('Gagal membuat gambar'); return; }
      T.dl('hidup-dalam-minggu.png', blob, 'image/png');
      T.toast('Gambar berhasil diunduh');
    })
  ));
  root.appendChild(box);
  root.appendChild(kanvas);
}
