import { h as T, utils, kv } from '../../core.js';

// Ukuran kabel tembaga berisolasi PVC, acuan PUIL 2011. KHA (kemampuan
// hantar arus) dalam pipa di tembok: 1,5 mm2 = 16 A; 2,5 = 21 A; 4 = 27 A;
// 6 = 34 A; 10 = 46 A; 16 = 61 A; 25 = 81 A. Di udara terbuka: 19, 26, 34,
// 44, 61, 82, 108 A. Aturan pilih: KHA kabel >= 1,25 x arus beban.
// Arus: 1 fasa I = P / (V x cos phi); 3 fasa I = P / (akar3 x V x cos phi).
// Jatuh tegangan (tembaga, rho = 0,0175 ohm.mm2/m): 1 fasa dV = 2 x I x L x
// rho / A; 3 fasa dV = akar3 x I x L x rho / A. Batas PUIL: maks 5% dari
// tegangan nominal. Bila jatuh tegangan melebihi batas, ukuran dinaikkan
// sampai lolos. MCB yang disarankan: nilai standar terbesar yang tidak
// melebihi KHA kabel (2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80 A).
const KHA = [
  [1.5, 16, 19], [2.5, 21, 26], [4, 27, 34], [6, 34, 44],
  [10, 46, 61], [16, 61, 82], [25, 81, 108],
];
const MCB = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80];
const RHO = 0.0175;
export function hitungKabel(o) {
  const daya = Math.max(0, Number(o.daya) || 0);
  const V = Math.max(0, Number(o.tegangan) || 0);
  const cosPhi = Math.max(0.1, Math.min(1, Number(o.cosPhi) || 0.85));
  const fasa3 = o.fasa === 3;
  const L = Math.max(0, Number(o.panjang) || 0);
  const udara = o.pemasangan === 'udara';
  const arus = V > 0 ? (fasa3 ? daya / (Math.sqrt(3) * V * cosPhi) : daya / (V * cosPhi)) : 0;
  const arusMin = arus * 1.25;
  const jatuh = (A) => fasa3
    ? Math.sqrt(3) * arus * L * RHO / A
    : 2 * arus * L * RHO / A;
  let pilih = null; let naikKarenaDrop = false;
  for (const [A, khaPipa, khaUdara] of KHA) {
    const kha = udara ? khaUdara : khaPipa;
    if (kha < arusMin) continue;
    if (pilih == null) pilih = { ukuran: A, kha, jatuhVolt: jatuh(A), jatuhPersen: V > 0 ? jatuh(A) / V * 100 : 0 };
    if (pilih.jatuhPersen <= 5) break;
    naikKarenaDrop = true;
    pilih = { ukuran: A, kha, jatuhVolt: jatuh(A), jatuhPersen: V > 0 ? jatuh(A) / V * 100 : 0 };
  }
  const mcb = pilih ? MCB.filter((m) => m <= pilih.kha).pop() || null : null;
  return { arus, arusMin, pilih, naikKarenaDrop, mcb, mentok: pilih != null && pilih.jatuhPersen > 5 };
}
utils.hitungKabel = hitungKabel;

export const meta = {"id": "kalkulator-ukuran-kabel", "name": "Kalkulator Ukuran Kabel", "cat": "rumah", "icon": "🔌", "desc": "Ukuran kabel tembaga yang aman untuk beban dan jaraknya, pakai tabel KHA PUIL 2011 plus cek jatuh tegangan.", "keywords": "kabel,kha,ukuran kabel,ampere,puil,listrik,instalasi,mcb,jatuh tegangan", "since": "6.19.0"};
export function render(root) {
  const dayaI = T.input('text', 'cth: 2200', '2200'); dayaI.inputMode = 'decimal';
  const tegSel = T.select([['220', '220 V, 1 fasa (rumah biasa)'], ['380', '380 V, 3 fasa']], '220');
  const panjangI = T.input('text', 'cth: 20', '20'); panjangI.inputMode = 'decimal';
  const pasangSel = T.select([['pipa', 'Dalam pipa di tembok (tanam)'], ['udara', 'Udara terbuka / kabel tray']], 'pipa');
  const cosI = T.input('text', 'cth: 0,85', '0,85'); cosI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const daya = T.num(dayaI.value) || 0;
    if (!(daya > 0)) { T.hide(box); return; }
    const teg = Number(tegSel.value);
    const r = hitungKabel({
      daya, tegangan: teg, fasa: teg === 380 ? 3 : 1,
      panjang: T.num(panjangI.value), pemasangan: pasangSel.value, cosPhi: T.num(cosI.value),
    });
    const f = (x) => T.fmt(Math.round(x * 100) / 100);
    if (!r.pilih) {
      T.show(box, '<div class="big">Di atas 25 mm²</div><p class="center mut">Arus ' + f(r.arus) + ' A butuh kabel lebih besar dari tabel ini. Untuk beban sebesar ini, konsultasikan ke teknisi listrik.</p>');
      return;
    }
    T.show(box,
      '<div class="big">' + f(r.pilih.ukuran) + ' mm²</div>' +
      '<p class="center mut">Kabel tembaga yang disarankan.</p>' +
      kv('Arus beban', f(r.arus) + ' A') +
      kv('Arus minimum kabel (x1,25)', f(r.arusMin) + ' A') +
      kv('KHA kabel ' + f(r.pilih.ukuran) + ' mm²', r.pilih.kha + ' A') +
      kv('Jatuh tegangan', f(r.pilih.jatuhVolt) + ' V (' + f(r.pilih.jatuhPersen) + '%)') +
      (r.mcb ? kv('MCB yang cocok', r.mcb + ' A') : '') +
      (r.naikKarenaDrop ? '<p class="hint">Ukuran ini dinaikkan karena jatuh tegangan: kabel yang lebih kecil cukup kuat arusnya, tapi tegangannya turun lebih dari 5% di ujung kabel sepanjang ini.</p>' : '') +
      (r.mentok ? '<p class="hint">Perhatian: bahkan kabel 25 mm² masih jatuh tegangan di atas 5% untuk jarak ini. Pertimbangkan memperpendek jalur kabel atau memakai tegangan lebih tinggi.</p>' : '') +
      '<p class="hint">Acuan: tabel KHA PUIL 2011 (kabel tembaga PVC, suhu 30°C, satu sirkit). KHA kabel harus minimal 1,25 kali arus beban, dan jatuh tegangan maksimal 5%. MCB tidak boleh lebih besar dari KHA kabel, supaya kabel putus arusnya duluan sebelum kepanasan. Instalasi nyata sebaiknya dicek teknisi listrik berlisensi.</p>');
  };
  [dayaI, tegSel, panjangI, pasangSel, cosI].forEach((i) => i.addEventListener('input', hitung));
  [tegSel, pasangSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Kabel kekecilan bikin panas dan berbahaya. Masukkan daya beban dan jarak kabelnya, lihat ukuran yang aman.</p>'));
  root.appendChild(T.field('Daya beban (watt)', dayaI, 'Total watt alat yang lewat kabel ini'));
  root.appendChild(T.field('Tegangan', tegSel));
  root.appendChild(T.field('Panjang kabel satu arah (meter)', panjangI, 'Jarak dari MCB/panel ke beban, bukan bolak-balik'));
  root.appendChild(T.field('Cara pasang kabel', pasangSel));
  root.appendChild(T.field('Faktor daya / cos phi', cosI, '0,85 umum untuk rumah; 1 untuk pemanas murni'));
  root.appendChild(box);
  hitung();
}
