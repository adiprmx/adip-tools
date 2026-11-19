import { h as T, utils, kv } from '../../core.js';

// Tekanan angin ban yang dianjurkan (angka umum dari buku panduan pabrikan).
// Nilai dalam PSI; 1 bar = 14,5038 PSI; 1 PSI = 6,89476 kPa. Muatan penuh
// umumnya menambah sekitar 2 PSI di ban belakang. Angka PASTI tiap kendaraan
// ada di stiker pintu pengemudi, tutup tangki, atau buku panduan — tabel ini
// hanya patokan umum bila stikernya hilang. Tekanan selalu diukur saat ban
// dingin (belum jalan jauh), karena ban panas menaikkan tekanan 2-4 PSI.
const TEKANAN = {
  'motor-matic': { nama: 'Motor matic / bebek', depan: [29, 29], belakang: [33, 33] },
  'motor-sport': { nama: 'Motor sport 150 cc', depan: [29, 32], belakang: [33, 36] },
  'motor-gede': { nama: 'Motor besar (250 cc ke atas)', depan: [32, 36], belakang: [36, 42] },
  'mobil-kecil': { nama: 'Mobil kecil / sedan', depan: [30, 32], belakang: [30, 32] },
  'mpv-suv': { nama: 'MPV / SUV', depan: [32, 35], belakang: [32, 35] },
  'pickup': { nama: 'Pickup / niaga ringan', depan: [32, 35], belakang: [35, 40] },
  'sepeda-road': { nama: 'Sepeda balap (road bike)', depan: [80, 100], belakang: [80, 100] },
  'sepeda-mtb': { nama: 'Sepeda gunung (MTB)', depan: [30, 50], belakang: [30, 50] },
  'sepeda-hybrid': { nama: 'Sepeda hybrid / kota', depan: [50, 70], belakang: [50, 70] },
};
export function konversiTekanan(psi) {
  const p = Math.max(0, Number(psi) || 0);
  return { psi: p, bar: p / 14.5038, kpa: p * 6.89476 };
}
export function tekananBan(jenis, muatan) {
  const t = TEKANAN[jenis] || TEKANAN['mobil-kecil'];
  const tambah = muatan === 'penuh' ? 2 : 0;
  return {
    nama: t.nama,
    depan: [t.depan[0], t.depan[1]],
    belakang: [t.belakang[0] + tambah, t.belakang[1] + tambah],
  };
}
utils.tekananBan = tekananBan;

export const meta = {"id": "tekanan-angin-ban", "name": "Tekanan Angin Ban", "cat": "otomotif", "icon": "🛞", "desc": "Tekanan ban yang pas buat kendaraanmu dalam PSI, bar, dan kPa, plus konverter satuan tekanan.", "keywords": "tekanan,angin,ban,psi,bar,kpa,pompa,ban kempes,motor,mobil,sepeda", "since": "6.19.0"};
export function render(root) {
  const jenisSel = T.select(Object.keys(TEKANAN).map((k) => [k, TEKANAN[k].nama]), 'mobil-kecil');
  const muatanSel = T.select([['normal', 'Muatan normal'], ['penuh', 'Muatan penuh / penumpang banyak']], 'normal');
  const psiI = T.input('text', 'cth: 32', ''); psiI.inputMode = 'decimal';
  const box = T.out();

  const teksRentang = ([lo, hi]) => lo === hi ? T.fmt(lo) + ' PSI' : T.fmt(lo) + '–' + T.fmt(hi) + ' PSI';
  const hitung = () => {
    const t = tekananBan(jenisSel.value, muatanSel.value);
    const psi = T.num(psiI.value) || 0;
    const k = psi > 0 ? konversiTekanan(psi) : null;
    const f = (x) => T.fmt(Math.round(x * 100) / 100);
    T.show(box,
      '<div class="big">' + teksRentang(t.depan) + ' / ' + teksRentang(t.belakang) + '</div>' +
      '<p class="center mut">Depan / belakang untuk ' + T.esc(t.nama.toLowerCase()) + '.</p>' +
      kv('Ban depan', teksRentang(t.depan) + ' (' + f(t.depan[0] / 14.5038) + (t.depan[0] === t.depan[1] ? '' : '–' + f(t.depan[1] / 14.5038)) + ' bar)') +
      kv('Ban belakang', teksRentang(t.belakang) + ' (' + f(t.belakang[0] / 14.5038) + (t.belakang[0] === t.belakang[1] ? '' : '–' + f(t.belakang[1] / 14.5038)) + ' bar)') +
      (k ? kv('Konversi ' + T.fmt(psi) + ' PSI', f(k.bar) + ' bar = ' + f(k.kpa) + ' kPa') : '') +
      '<p class="hint">Angka di atas patokan umum dari buku panduan pabrikan. Angka pasti kendaraanmu ada di stiker pintu pengemudi (mobil), stiker rantai atau buku panduan (motor), dan dinding ban (sepeda, tertulis batas maksimumnya). Ukur saat ban dingin. Ban kurang angin bikin boros BBM dan cepat aus di pinggir; ban kelebihan angin bikin grip berkurang dan cepat aus di tengah.</p>');
  };
  [jenisSel, muatanSel, psiI].forEach((i) => i.addEventListener('input', hitung));
  [jenisSel, muatanSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Ban kurang angin atau kelebihan angin sama-sama tidak enak dan tidak aman. Pilih kendaraanmu, lihat angka yang pas.</p>'));
  root.appendChild(T.field('Jenis kendaraan', jenisSel));
  root.appendChild(T.field('Muatan', muatanSel));
  root.appendChild(T.field('Konverter: tekanan dalam PSI (opsional)', psiI, 'Isi angka PSI untuk diubah ke bar dan kPa'));
  root.appendChild(box);
  hitung();
}
