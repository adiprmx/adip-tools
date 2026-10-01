import { h as T, utils, kv } from '../../core.js?v=6.7.0';

const DEFAULT_POS = [
  ['Katering', 40, 'Porsi paling gede: makanan tamu + keluarga.'],
  ['Gedung / venue', 20, 'Sewa tempat; kalau di rumah, alihkan ke tenda & kursi.'],
  ['Dekorasi', 10, 'Pelaminan, bunga, backdrop foto.'],
  ['Foto & video', 8, 'Dokumentasi seharian — jangan sampai nyesel.'],
  ['MUA & busana', 5, 'Rias pengantin + sewa baju akad/resepsi.'],
  ['Hiburan', 5, 'MC, band akustik, atau organ tunggal.'],
  ['Souvenir', 4, 'Bingkisan buat tamu undangan.'],
  ['Undangan & cetak', 3, 'Undangan fisik (yang digital mah gratis).'],
  ['Mahar / mas kawin', 3, 'Sesuai kesepakatan keluarga.'],
  ['Lain-lain', 2, 'Dana darurat: parkir, keamanan, tips, dll.'],
];

export const meta = {
  id: 'anggaran-nikah',
  name: 'Anggaran Nikah',
  cat: 'indonesia',
  icon: '💒',
  desc: 'Bagi-bagi budget nikah per pos, biar nggak jebol di tengah jalan.',
  keywords: 'nikah,budget,anggaran,wedding,katering,gedung,pernikahan,biaya',
};

export function render(root) {
  let budget = 200000000;
  try {
    const s = localStorage.getItem('anggaran-nikah-budget');
    if (s != null && T.num(s) > 0) budget = T.num(s);
  } catch (e) { /* abaikan */ }

  const budgetI = T.input('text', 'cth: 200000000', String(budget));
  budgetI.inputMode = 'decimal';
  const box = T.out();

  const rows = DEFAULT_POS.map(([label, pct]) => {
    const pctI = T.input('number', 'cth: 40', String(pct));
    pctI.min = '0'; pctI.max = '100'; pctI.step = '0.5';
    pctI.style.maxWidth = '92px';
    return { label, pctI };
  });

  const getPcts = () => rows.map((r) => {
    const p = T.num(r.pctI.value);
    return isFinite(p) && p >= 0 ? p : 0;
  });

  const hitung = () => {
    const b = Math.max(0, T.num(budgetI.value) || 0);
    try { localStorage.setItem('anggaran-nikah-budget', String(b)); } catch (e) { /* abaikan */ }
    const pcts = getPcts();
    const total = pcts.reduce((a, x) => a + x, 0);
    const ok = Math.abs(total - 100) < 0.001;
    let html = '';
    if (!(b > 0)) html += '<p class="warn">Isi dulu total budget nikahnya.</p>';
    html += '<div class="big center">' + T.rp(b) + '</div><p class="center mut">total budget</p>';
    rows.forEach((r, i) => {
      html += kv(r.label + ' <span class="mut">(' + T.esc(String(pcts[i])) + '%)</span>', T.rp(b * pcts[i] / 100));
    });
    html += '<p class="' + (ok ? 'info' : 'warn') + '">Total alokasi: <b>' +
      total.toFixed(1) + '%</b>' +
      (ok ? ' — pas 100%, aman.' : ' — belum 100%. Atur ulang persennya, atau tekan Normalisasi.') + '</p>';
    T.show(box, html);
  };

  const normalisasi = () => {
    const pcts = getPcts();
    const total = pcts.reduce((a, x) => a + x, 0);
    if (!(total > 0)) { T.toast('Isi dulu persen tiap posnya'); return; }
    rows.forEach((r, i) => {
      const v = (pcts[i] / total * 100).toFixed(1);
      r.pctI.value = v.replace(/\.0$/, '');
    });
    hitung();
    T.toast('Persentase dinormalisasi ke 100%');
  };

  root.appendChild(T.el('<p class="note">Nikah itu sekali — tapi budget jebol rasanya berkali-kali. Tulis total budget, atur persen tiap pos, nominal rupiahnya otomatis keluar.</p>'));
  root.appendChild(T.field('Total budget nikah (Rp)', budgetI, 'Estimasi kasar dulu juga nggak apa-apa.'));
  const list = T.el('<div class="fld"><label>Alokasi per pos (%)</label></div>');
  rows.forEach((r) => {
    const w = T.el('<div class="row" style="align-items:center;margin-bottom:6px"></div>');
    w.appendChild(T.el('<span style="flex:1;font-size:14px">' + T.esc(r.label) + '</span>'));
    w.appendChild(r.pctI);
    list.appendChild(w);
  });
  root.appendChild(list);
  root.appendChild(T.row(T.btn('Hitung', hitung, true), T.btn('Normalisasi ke 100%', normalisasi)));
  root.appendChild(box);
  [budgetI, ...rows.map((r) => r.pctI)].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
