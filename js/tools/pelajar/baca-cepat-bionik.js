import { h as T, utils, esc } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node): tebalkan awal tiap kata.
// persen = seberapa besar bagian awal kata yang ditebalkan (0-100).
utils.bionik = function (teks, persen) {
  const p = Math.min(100, Math.max(0, Number(persen) || 50)) / 100;
  return String(teks || '').split(/(\s+)/).map((potong) => {
    if (!potong.trim()) return esc(potong);
    const huruf = [...potong];
    const n = Math.max(1, Math.round(huruf.length * p));
    const awal = esc(huruf.slice(0, n).join(''));
    const sisa = esc(huruf.slice(n).join(''));
    return `<b>${awal}</b>${sisa}`;
  }).join('');
};

export const meta = {"id": "baca-cepat-bionik", "name": "Baca Cepat Bionik", "cat": "pelajar", "icon": "👁️", "desc": "Tebalkan awal tiap kata supaya mata membaca lebih cepat.", "keywords": "bionic reading,baca cepat,membaca,pelajar,fokus", "since": "6.11.0"};

export function render(root) {
  const teks = T.ta(6, 'Tempel teks yang mau dibaca di sini. Misalnya materi pelajaran atau artikel panjang.', '');
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '20'; slider.max = '80'; slider.value = '50';
  slider.style.cssText = 'width:100%';
  const labelSlider = T.el('<div style="font-size:13px;color:#a1a1aa;margin-top:4px">Bagian awal kata yang ditebalkan: 50%</div>');
  const box = T.out();

  function tampil() {
    const isi = teks.value.trim();
    if (!isi) { T.show(box, '<div class="hint">Tempel teks dulu di atas.</div>'); return; }
    const kata = isi.split(/\s+/).filter(Boolean).length;
    const menit = Math.max(1, Math.round(kata / 200));
    T.show(box,
      `<div style="font-size:17px;line-height:1.9;max-width:65ch">${utils.bionik(isi, slider.value)}</div>` +
      `<div class="hint">${T.fmt(kata)} kata. Perkiraan waktu baca normal sekitar ${menit} menit. Cara ini membantu sebagian orang membaca lebih cepat, tapi bukan jaminan, coba dan rasakan sendiri.</div>`
    );
  }

  slider.addEventListener('input', () => {
    labelSlider.textContent = 'Bagian awal kata yang ditebalkan: ' + slider.value + '%';
    if (teks.value.trim()) tampil();
  });

  root.appendChild(T.el('<p class="note">Teknik bionik reading menebalkan huruf awal tiap kata, supaya mata langsung menangkap kata tanpa membaca huruf per huruf.</p>'));
  root.appendChild(T.field('Teks yang mau dibaca', teks));
  root.appendChild(T.field('Seberapa tebal', slider));
  root.appendChild(labelSlider);
  root.appendChild(T.btn('Tampilkan versi bionik', tampil, true));
  root.appendChild(box);
}
