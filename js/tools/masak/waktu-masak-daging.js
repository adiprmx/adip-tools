import { h as T, kv, utils, errBox } from '../../core.js';

export const meta = {"id": "waktu-masak-daging", "name": "Waktu Masak Daging", "cat": "masak", "icon": "🍗", "desc": "Perkiraan waktu panggang atau rebus dari jenis dan berat daging.", "keywords": "daging,masak,panggang,rebus,ayam,sapi,kambing,waktu", "since": "6.19.0"};

// Patokan waktu dari panduan masak umum (USDA dan buku resep rumahan).
// menitDasar: waktu minimum walau potongan kecil; menitPer500g: tambahan
// per 500 gram. Suhu dalam adalah suhu aman minimum daging matang.
// Batas aman USDA (FoodSafety.gov, diverifikasi 20 Nov 2026): daging
// sapi/kambing/babi utuh (steak, panggang) minimal 63 derajat C (145
// derajat F) + diamkan 3 menit; daging giling 71 derajat C; ayam 74
// derajat C; ikan 63 derajat C. Suhu rare 52 derajat C dan medium 60
// derajat C BERADA DI BAWAH batas aman USDA — hanya untuk potongan utuh
// dari sumber terpercaya, dan tidak untuk anak, ibu hamil, atau lansia.
export const SUHU_AMAN_USDA = 63;
export const DAGING = {
  ayamUtuh: {
    label: 'Ayam utuh (panggang)', metode: 'Panggang di oven 200 derajat C',
    menitDasar: 20, menitPer500g: 20, suhuDalam: 74,
    catatan: 'Tusuk paha, air yang keluar harus bening, bukan merah muda.',
  },
  ayamPotong: {
    label: 'Ayam potong (panggang)', metode: 'Panggang di oven 200 derajat C',
    menitDasar: 25, menitPer500g: 5, suhuDalam: 74,
    catatan: 'Balik sekali di tengah waktu supaya matang merata.',
  },
  ayamRebus: {
    label: 'Ayam (rebus)', metode: 'Rebus setelah air mendidih',
    menitDasar: 15, menitPer500g: 15, suhuDalam: 74,
    catatan: 'Buang busa yang mengapung di awal rebusan.',
  },
  sapiPanggang: {
    label: 'Daging sapi (panggang)', metode: 'Panggang di oven 180 derajat C',
    menitDasar: 15, menitPer500g: 20, suhuDalam: 63,
    kematangan: { rare: 15, medium: 20, well: 25 },
    suhuKematangan: { rare: 52, medium: 60, well: 71 },
    catatan: 'Diamkan 10 menit sebelum dipotong supaya sarinya tidak keluar.',
  },
  sapiRebus: {
    label: 'Daging sapi (rebus/sop)', metode: 'Rebus dengan api kecil',
    menitDasar: 45, menitPer500g: 30, suhuDalam: 71,
    catatan: 'Api kecil dan panci tertutup, daging jadi empuk.',
  },
  kambingPanggang: {
    label: 'Daging kambing (panggang)', metode: 'Panggang di oven 180 derajat C',
    menitDasar: 15, menitPer500g: 25, suhuDalam: 63,
    kematangan: { rare: 20, medium: 25, well: 30 },
    suhuKematangan: { rare: 52, medium: 60, well: 71 },
    catatan: 'Diamkan 10 menit sebelum dipotong.',
  },
  babiPanggang: {
    label: 'Daging babi (panggang)', metode: 'Panggang di oven 180 derajat C',
    menitDasar: 20, menitPer500g: 30, suhuDalam: 71,
    catatan: 'Babi harus matang sampai ke dalam, tidak boleh setengah matang.',
  },
  ikanUtuh: {
    label: 'Ikan utuh (panggang)', metode: 'Panggang di oven 200 derajat C',
    menitDasar: 10, menitPer500g: 10, suhuDalam: 63,
    catatan: 'Daging ikan matang saat mudah lepas dari tulang.',
  },
  ikanFillet: {
    label: 'Fillet ikan (panggang)', metode: 'Panggang di oven 200 derajat C',
    menitDasar: 12, menitPer500g: 5, suhuDalam: 63,
    catatan: 'Fillet tipis cepat matang, cek dari menit ke-10.',
  },
};

// Hitung perkiraan waktu. Dibulatkan ke 5 menit terdekat. Fungsi murni.
export function hitungWaktuDaging(jenisKey, beratGr, kematangan) {
  const d = DAGING[jenisKey];
  if (!d) return null;
  const berat = Math.max(50, Number(beratGr) || 0);
  let per500 = d.menitPer500g;
  let suhu = d.suhuDalam;
  if (d.kematangan && kematangan && d.kematangan[kematangan]) {
    per500 = d.kematangan[kematangan];
    suhu = d.suhuKematangan[kematangan];
  }
  const mentah = d.menitDasar + per500 * (berat / 500);
  const menit = Math.max(5, Math.round(mentah / 5) * 5);
  return { menit, jam: Math.floor(menit / 60), sisaMenit: menit % 60, suhuDalam: suhu, metode: d.metode, catatan: d.catatan };
}
utils.hitungWaktuDaging = hitungWaktuDaging;

export function render(root) {
  const jenisSel = T.select(Object.keys(DAGING).map((k) => [k, DAGING[k].label]), 'ayamUtuh');
  const beratIn = T.input('text', 'cth: 1000', '1000'); beratIn.inputMode = 'decimal';
  const matangSel = T.select([['medium', 'Setengah matang (medium)'], ['rare', 'Jarang matang (rare)'], ['well', 'Matang penuh (well done)']], 'medium');
  const matangField = T.field('Tingkat kematangan', matangSel);
  const box = T.out();

  const refreshMatang = () => {
    const d = DAGING[jenisSel.value];
    matangField.hidden = !(d && d.kematangan);
  };

  const hitung = () => {
    const berat = utils.parseNum(beratIn.value, NaN);
    if (!isFinite(berat) || berat < 50 || berat > 20000) {
      T.show(box, errBox('Isi berat daging 50 sampai 20.000 gram.'));
      return;
    }
    const r = hitungWaktuDaging(jenisSel.value, berat, matangSel.value);
    if (!r) { T.show(box, errBox('Jenis daging tidak dikenal.')); return; }
    const waktu = r.jam ? r.jam + ' jam ' + (r.sisaMenit ? r.sisaMenit + ' menit' : '') : r.menit + ' menit';
    const diBawahAman = r.suhuDalam < SUHU_AMAN_USDA;
    T.show(box,
      '<div class="big center">' + waktu + '</div>' +
      kv('Cara masak', T.esc(r.metode)) +
      kv('Suhu dalam daging', 'Minimal ' + r.suhuDalam + ' derajat C (cek pakai termometer dapur)') +
      (diBawahAman
        ? '<p class="warn" style="margin-top:10px">Hati-hati: suhu ini di bawah batas aman USDA ' + SUHU_AMAN_USDA + ' derajat C (145 derajat F, diamkan 3 menit). Daging setengah matang seperti ini hanya untuk potongan utuh (steak/panggang) dari sumber terpercaya — bakteri hanya di permukaan dan mati saat daging disear. Jangan untuk daging giling, anak-anak, ibu hamil, atau lansia. Sumber: FoodSafety.gov (USDA).</p>'
        : '') +
      '<p class="dim" style="font-size:13px;line-height:1.6;margin:10px 0 0">' + T.esc(r.catatan) + ' Angka ini patokan umum, ukuran potongan dan oven bisa mengubah hasilnya.</p>');
  };

  jenisSel.addEventListener('change', () => { refreshMatang(); hitung(); });
  beratIn.addEventListener('input', hitung);
  matangSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih jenis daging dan isi beratnya. Hasilnya perkiraan dari panduan masak umum. Cara paling pasti tetap cek suhu dalam daging pakai termometer.</p>'));
  root.appendChild(T.field('Jenis daging', jenisSel));
  root.appendChild(T.field('Berat (gram)', beratIn));
  root.appendChild(matangField);
  root.appendChild(box);
  refreshMatang();
  hitung();
}
