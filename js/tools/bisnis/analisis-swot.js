import { h as T, utils, dlNodePng } from '../../core.js';

// Analisis SWOT: empat kotak (kekuatan, kelemahan, peluang, ancaman).
// Satu baris per poin. parseSwot memecah teks jadi daftar poin, buang
// baris kosong dan spasi berlebih. buatSwot merakit keempat daftar jadi
// satu objek beserta jumlah poin tiap kotak.
export function parseSwot(teks) {
  return String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
}
export function buatSwot(o) {
  const kekuatan = parseSwot(o && o.kekuatan);
  const kelemahan = parseSwot(o && o.kelemahan);
  const peluang = parseSwot(o && o.peluang);
  const ancaman = parseSwot(o && o.ancaman);
  return {
    kekuatan, kelemahan, peluang, ancaman,
    total: kekuatan.length + kelemahan.length + peluang.length + ancaman.length,
  };
}
export function swotKeTeks(d, judul) {
  const bagian = (label, daftar) => label + '\n' + (daftar.length ? daftar.map((x) => '- ' + x).join('\n') : '(belum ada isi)');
  return 'ANALISIS SWOT: ' + (judul || 'Usahaku') + '\n' +
    'Dibuat dengan Adip Tools\n\n' +
    bagian('KEKUATAN', d.kekuatan) + '\n\n' +
    bagian('KELEMAHAN', d.kelemahan) + '\n\n' +
    bagian('PELUANG', d.peluang) + '\n\n' +
    bagian('ANCAMAN', d.ancaman);
}
utils.swot = buatSwot;

export const meta = {"id": "analisis-swot", "name": "Analisis SWOT", "cat": "bisnis", "icon": "🧭", "desc": "Petakan kekuatan, kelemahan, peluang, dan ancaman usahamu dalam satu matriks.", "keywords": "swot,analisis,strength,weakness,opportunity,threat,usaha,bisnis,strategi,matriks", "since": "6.18.0"};
export function render(root) {
  const judulI = T.input('text', 'cth: Kopi Sore', '');
  const sI = T.ta(4, 'Satu poin per baris.\ncth: Resep sendiri\ncth: Lokasi ramai');
  const wI = T.ta(4, 'Satu poin per baris.\ncth: Modal terbatas\ncth: Belum punya karyawan');
  const oI = T.ta(4, 'Satu poin per baris.\ncth: Kampus baru buka di dekat sini\ncth: Tren kopi susu masih naik');
  const tI = T.ta(4, 'Satu poin per baris.\ncth: Harga biji kopi naik\ncth: Pesaing baru buka di seberang');
  const box = T.out();
  let matriksEl = null;
  let teksSwot = '';

  const kotak = (judul, daftar, warna) => {
    const isi = daftar.length
      ? '<ul style="margin:8px 0 0;padding-left:18px;line-height:1.6">' + daftar.map((x) => '<li>' + T.esc(x) + '</li>').join('') + '</ul>'
      : '<p class="mut" style="margin:8px 0 0;font-size:13px">Belum ada isi.</p>';
    return '<div style="border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;background:rgba(255,255,255,.03)">' +
      '<div style="font-weight:600;font-size:13px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + warna + ';margin-right:6px"></span>' + judul + ' (' + daftar.length + ')</div>' + isi + '</div>';
  };

  const tampil = () => {
    const d = buatSwot({ kekuatan: sI.value, kelemahan: wI.value, peluang: oI.value, ancaman: tI.value });
    teksSwot = swotKeTeks(d, judulI.value.trim());
    const judul = judulI.value.trim() || 'Usahaku';
    T.show(box,
      '<div class="big">' + d.total + ' poin</div>' +
      '<p class="center mut">Total poin SWOT untuk ' + T.esc(judul) + '.</p>' +
      '<div id="swot-matrix" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">' +
      kotak('Kekuatan', d.kekuatan, '#22c55e') +
      kotak('Kelemahan', d.kelemahan, '#ef4444') +
      kotak('Peluang', d.peluang, '#3b82f6') +
      kotak('Ancaman', d.ancaman, '#f59e0b') +
      '</div>' +
      (d.total === 0 ? '<p class="warn">Matriks masih kosong. Isi dulu satu kotak di atas, satu poin per baris.</p>' : '<p class="hint">Baca matriksmu dari kiri atas: pakai kekuatan untuk mengambil peluang, dan perbaiki kelemahan sebelum ancaman datang.</p>'));
    matriksEl = box.querySelector('#swot-matrix');
    box.appendChild(T.copyBtn(() => teksSwot, 'Salin SWOT'));
    box.appendChild(T.dlBtn('analisis-swot.txt', () => teksSwot, 'text/plain;charset=utf-8', 'Unduh SWOT (.txt)'));
    box.appendChild(T.btn('Unduh matriks (PNG)', () => { if (matriksEl) dlNodePng(matriksEl, 'matriks-swot.png'); }));
  };
  [judulI, sI, wI, oI, tI].forEach((i) => i.addEventListener('input', tampil));

  root.appendChild(T.el('<p class="note">SWOT itu cara cepat melihat posisi usahamu: apa yang kuat, apa yang lemah, peluang apa yang terbuka, dan ancaman apa yang mengintai. Isi tiap kotak, satu poin per baris.</p>'));
  root.appendChild(T.field('Nama usaha atau ide', judulI));
  root.appendChild(T.grid2(
    T.field('Kekuatan (Strengths)', sI, 'Apa yang sudah bagus dari usahamu'),
    T.field('Kelemahan (Weaknesses)', wI, 'Apa yang masih kurang')
  ));
  root.appendChild(T.grid2(
    T.field('Peluang (Opportunities)', oI, 'Kesempatan di luar yang bisa diambil'),
    T.field('Ancaman (Threats)', tI, 'Hal di luar yang bisa merugikan')
  ));
  root.appendChild(box);
  tampil();
}
