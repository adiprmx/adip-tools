import { h as T, esc, utils } from '../../core.js';

// Glasgow Coma Scale / GCS (Teasdale dan Jennett, 1974): penilaian tingkat
// kesadaran dari 3 komponen. Total 3-15.
// E (Eye, membuka mata): 1 tidak membuka, 2 terhadap nyeri,
//   3 terhadap suara, 4 spontan.
// V (Verbal, bicara): 1 tidak ada suara, 2 suara tidak jelas,
//   3 kata tidak sesuai, 4 bicara bingung, 5 orientasi baik.
// M (Motor, gerak): 1 tidak ada gerakan, 2 ekstensi (kaku melurus),
//   3 fleksi abnormal (kaku menekuk), 4 menarik diri dari nyeri,
//   5 melokalisasi nyeri, 6 mengikuti perintah.
// 13-15 ringan, 9-12 sedang, 3-8 berat (koma).
export function gcs(mata, bicara, gerak) {
  return mata + bicara + gerak;
}

export function bandGcs(total) {
  if (total >= 13) return ['Ringan', 'Kesadaran hampir normal. Tetap perlu dipantau, terutama setelah cedera kepala.', 'ok'];
  if (total >= 9) return ['Sedang', 'Kesadaran menurun. Perlu penanganan dan pemantauan tenaga medis.', 'warn'];
  return ['Berat (koma)', 'Kesadaran sangat menurun. Keadaan darurat, butuh pertolongan medis segera.', 'err'];
}
utils.gcs = gcs;
utils.bandGcs = bandGcs;

export const meta = {"id": "skor-gcs", "name": "Skor GCS (Glasgow Coma Scale)", "cat": "kesehatan", "icon": "🧠", "desc": "Nilai tingkat kesadaran seseorang dari respons mata, bicara, dan gerak, dengan skala Glasgow Coma Scale.", "keywords": "gcs,glasgow coma scale,kesadaran,koma,cedera kepala,skor gcs,eye verbal motor", "since": "6.19.0"};
export function render(root) {
  const mata = T.select([
    ['4', '4: Membuka mata sendiri (spontan)'],
    ['3', '3: Membuka mata saat dipanggil'],
    ['2', '2: Membuka mata saat diberi rangsang nyeri'],
    ['1', '1: Tidak membuka mata sama sekali'],
  ], '4');
  const bicara = T.select([
    ['5', '5: Bicara normal, tahu tempat dan waktu'],
    ['4', '4: Bicara tapi bingung'],
    ['3', '3: Mengucap kata yang tidak sesuai'],
    ['2', '2: Hanya suara tidak jelas (mengerang)'],
    ['1', '1: Tidak bersuara sama sekali'],
  ], '5');
  const gerak = T.select([
    ['6', '6: Mengikuti perintah (misal angkat tangan)'],
    ['5', '5: Tangan bergerak ke arah sumber nyeri'],
    ['4', '4: Menarik anggota tubuh menjauhi nyeri'],
    ['3', '3: Lengan menekuk kaku (fleksi abnormal)'],
    ['2', '2: Lengan melurus kaku (ekstensi)'],
    ['1', '1: Tidak ada gerakan sama sekali'],
  ], '6');
  const box = T.out();

  const hitung = () => {
    const e = Number(mata.value);
    const v = Number(bicara.value);
    const m = Number(gerak.value);
    const total = gcs(e, v, m);
    const band = bandGcs(total);
    T.show(box,
      '<div class="center"><div class="dim">Skor GCS (E + V + M)</div>' +
      '<div class="big">E' + e + ' V' + v + ' M' + m + ' = ' + total + '</div>' +
      '<div class="' + band[2] + '"><b>' + esc(band[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Mata (E)</span><span class="v">' + e + ' dari 4</span></div>' +
      '<div class="kv"><span class="k">Bicara (V)</span><span class="v">' + v + ' dari 5</span></div>' +
      '<div class="kv"><span class="k">Gerak (M)</span><span class="v">' + m + ' dari 6</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(band[1]) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan skor</div>' +
      '<div class="kv"><span class="k">13-15</span><span class="v">Ringan' + (total >= 13 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">9-12</span><span class="v">Sedang' + (total >= 9 && total <= 12 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">3-8</span><span class="v">Berat (koma)' + (total <= 8 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<p class="hint">GCS adalah alat penilaian klinis untuk tenaga medis, BUKAN diagnosis. ' +
      'Skor rendah setelah cedera kepala, kejang, atau penurunan kesadaran adalah keadaan darurat: segera hubungi layanan darurat (118/119) atau bawa ke IGD. ' +
      'Jangan memindahkan korban cedera kepala atau leher secara sembarangan. Penilaian yang benar membutuhkan pemeriksaan langsung oleh tenaga medis.</p>');
  };

  root.appendChild(T.field('Membuka mata (E)', mata));
  root.appendChild(T.field('Bicara (V)', bicara));
  root.appendChild(T.field('Gerak (M)', gerak));
  root.appendChild(T.btn('Hitung skor', hitung, true));
  root.appendChild(box);
  hitung();
}
