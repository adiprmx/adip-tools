import { h as T, utils, canvasToBlob } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): bagi teks jadi baris sesuai lebar.
utils.bungkusTeks = function (teks, maksKarakter) {
  const hasil = [];
  String(teks || '').split(/\r?\n/).forEach((paragraf) => {
    if (!paragraf.trim()) { hasil.push(''); return; }
    let sisa = paragraf;
    while (sisa.length > maksKarakter) {
      let potong = sisa.lastIndexOf(' ', maksKarakter);
      if (potong <= 0) potong = maksKarakter;
      hasil.push(sisa.slice(0, potong));
      sisa = sisa.slice(potong).trim();
    }
    if (sisa) hasil.push(sisa);
  });
  return hasil;
};

export const meta = {"id": "teks-tulisan-tangan", "name": "Teks jadi Tulisan Tangan", "cat": "teks", "icon": "✍️", "desc": "Ubah ketikan jadi tulisan tangan di kertas bergaris.", "keywords": "tulisan tangan,handwriting,catatan,tugas,sekolah,kertas", "since": "6.11.0"};

export function render(root) {
  const teks = T.ta(6, 'Tulis atau tempel teksmu di sini. Misalnya tugas sekolah atau surat.', '');
  const ukuran = T.select([['36', 'Kecil'], ['44', 'Sedang'], ['54', 'Besar']], '44');
  const kertas = T.select([['garis', 'Kertas bergaris'], ['kotak', 'Kertas kotak-kotak'], ['polos', 'Kertas polos']], 'garis');
  const box = T.out();
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;margin-top:12px;box-shadow:0 2px 12px rgba(0,0,0,0.4)';
  let fontSiap = false;

  // Muat font tulisan tangan Caveat dari Google Fonts (sekali saja).
  if (!document.querySelector('link[data-font-tangan]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap';
    link.setAttribute('data-font-tangan', '1');
    document.head.appendChild(link);
  }
  if (document.fonts && document.fonts.load) {
    document.fonts.load('44px Caveat').then(() => { fontSiap = true; }).catch(() => { fontSiap = false; });
  }

  function gambar() {
    const isi = teks.value.trim();
    if (!isi) { T.show(box, '<div class="hint">Tulis dulu teksnya.</div>'); return; }
    const fontPx = Number(ukuran.value);
    const maksKarakter = Math.max(20, Math.floor(1240 / (fontPx * 0.42)));
    const baris = utils.bungkusTeks(isi, maksKarakter).slice(0, 60);
    const tinggiBaris = fontPx * 1.9;
    const W = 1240, padAtas = 90;
    const H = padAtas + baris.length * tinggiBaris + 60;
    kanvas.width = W; kanvas.height = H;
    const ctx = kanvas.getContext('2d');
    ctx.fillStyle = '#fdfdf8';
    ctx.fillRect(0, 0, W, H);
    if (kertas.value === 'garis') {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      for (let i = 0; i < baris.length + 2; i++) {
        const y = padAtas + i * tinggiBaris + fontPx * 0.35;
        ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(W - 50, y); ctx.stroke();
      }
      ctx.strokeStyle = '#fca5a5';
      ctx.beginPath(); ctx.moveTo(56, 0); ctx.lineTo(56, H); ctx.stroke();
    } else if (kertas.value === 'kotak') {
      ctx.strokeStyle = '#dbeafe';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '500 ' + fontPx + 'px Caveat, cursive';
    ctx.textBaseline = 'alphabetic';
    baris.forEach((b, i) => {
      ctx.fillText(b, 80, padAtas + i * tinggiBaris + fontPx * 0.2);
    });
    T.show(box, '<div class="hint">Hasil di bawah ini berupa gambar' + (fontSiap ? '.' : '. Font tulisan tangan belum termuat, jadi memakai font cursive bawaan browser.') + '</div>');
  }

  root.appendChild(T.el('<p class="note">Ketik teksmu, jadilah tulisan tangan di atas kertas. Cocok untuk tugas yang harus terlihat ditulis tangan.</p>'));
  root.appendChild(T.field('Teks', teks));
  root.appendChild(T.grid2(
    T.field('Ukuran tulisan', ukuran),
    T.field('Jenis kertas', kertas)
  ));
  root.appendChild(T.row(
    T.btn('Buat tulisan tangan', gambar, true),
    T.btn('Unduh gambar', async () => {
      if (!kanvas.width) { T.toast('Buat dulu tulisannya'); return; }
      const blob = await canvasToBlob(kanvas, 'image/jpeg', 0.92);
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('tulisan-tangan.jpg', blob, 'image/jpeg');
      T.toast('Gambar berhasil diunduh');
    })
  ));
  root.appendChild(box);
  root.appendChild(kanvas);
}
