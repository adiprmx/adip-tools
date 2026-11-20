import { h as T, esc, utils } from '../../core.js';

// Peak Flow (PEF, arus puncak ekspirasi): seberapa cepat kamu bisa
// menghembuskan napas, diukur dengan peak flow meter (liter/menit).
// Nilai acuan dihitung dengan persamaan ECSC (Quanjer dkk., 1993),
// dipakai luas di praktik paru — PERSAMAAN DEWASA, tidak berlaku untuk
// anak (nilai acuan anak memakai tabel berdasarkan tinggi badan).
//   pria:   PEF = (6,14 x tinggi (m) - 0,043 x umur + 0,15) x 60
//   wanita: PEF = (5,50 x tinggi (m) - 0,030 x umur - 1,11) x 60
// Konstanta diverifikasi digit-per-digit 20 Nov 2026 dari tabel Quanjer
// 1993 (Eur Respir J 1993;6 Suppl 16: pria "6.14H-0.043A+0.15", wanita
// "5.50H-0.030A-1.11") + silang-cek tabel nilai ERS 1993 (wanita 160 cm,
// umur 25 th = 416 L/menit). Intersep wanita -1,11 (BUKAN -0,11 — nilai
// lama -0,11 membuat acuan wanita 60 L/menit terlalu tinggi; dikoreksi
// Q5 v6.21.0). Contoh benar: wanita 30 th/160 cm = 407,4 L/menit.
// Zona lampu lalu lintas mengikuti rencana aksi asma (GINA/BTS):
// hijau 80% ke atas dari nilai acuan, kuning 50-80%, merah di bawah 50%.
export function hitungPEFprediksi(jk, umur, tinggiCm) {
  if (!(umur > 0) || !(tinggiCm > 0)) return null;
  const h = tinggiCm / 100;
  const lps = jk === 'pria'
    ? 6.14 * h - 0.043 * umur + 0.15
    : 5.50 * h - 0.030 * umur - 1.11;
  if (!(lps > 0)) return null;
  return lps * 60;
}

export function zonaPEF(persen) {
  if (persen >= 80) return ['Zona hijau', 'Hasilmu masih di kisaran baik. Lanjutkan obat dan rutinitas seperti biasa.', 'ok'];
  if (persen >= 50) return ['Zona kuning', 'Hasilmu di bawah kisaran baik. Ikuti rencana aksi asma dari doktermu, dan perhatikan gejalamu.', 'warn'];
  return ['Zona merah', 'Hasilmu jauh di bawah kisaran baik. Segera cari bantuan medis dan ikuti rencana darurat dari doktermu.', 'err'];
}

export const meta = { "id": "kalkulator-peak-flow", "name": "Kalkulator Peak Flow (Arus Puncak Napas)", "cat": "kesehatan", "icon": "🌬️", "desc": "Bandingkan hasil peak flow meter-mu dengan nilai acuan untuk umur dan tinggimu, lengkap dengan zona hijau, kuning, dan merah.", "keywords": "peak flow,pef,arus puncak,asma,napas,paru,spirometri,zona hijau", "since": "6.19.0" };

export function render(root) {
  const jk = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const umur = T.input('number', 'Umur (tahun)', '30');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const ukur = T.input('number', 'Hasil peak flow meter (L/menit)', '500');
  const box = T.out();

  const hitung = () => {
    const u = T.num(umur.value);
    const tb = T.num(tinggi.value);
    const hasil = T.num(ukur.value);
    if (!(u >= 18 && u <= 120)) {
      if (u >= 5 && u < 18) {
        T.show(box, '<span class="warn">Tool ini hanya untuk dewasa (18 tahun ke atas). Nilai acuan anak memakai tabel berbeda berdasarkan tinggi badan — tanya dokter anak atau pakai tabel acuan dari doktermu.</span>');
      } else {
        T.show(box, '<span class="err">Isi umur antara 18 sampai 120 tahun.</span>');
      }
      return;
    }
    if (!(tb >= 100 && tb <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    if (!(hasil >= 50 && hasil <= 1000)) {
      T.show(box, '<span class="err">Isi hasil pengukuran antara 50 sampai 1000 L/menit.</span>');
      return;
    }
    const acuan = hitungPEFprediksi(jk.value, u, tb);
    if (acuan == null) {
      T.show(box, '<span class="err">Nilai acuan tidak bisa dihitung dari umur dan tinggi ini. Cek lagi angkanya.</span>');
      return;
    }
    const persen = hasil / acuan * 100;
    const z = zonaPEF(persen);
    T.show(box,
      '<div class="center"><div class="dim">Hasilmu dibanding nilai acuan</div>' +
      '<div class="big">' + utils.fmtDes(persen, 0) + '%</div>' +
      '<div class="' + z[2] + '" style="margin-top:6px"><b>' + esc(z[0]) + '</b><br>' + esc(z[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Nilai acuan untukmu</span><span class="v">' + T.fmt(Math.round(acuan)) + ' L/menit</span></div>' +
      '<div class="kv"><span class="k">Hasil pengukuranmu</span><span class="v">' + T.fmt(Math.round(hasil)) + ' L/menit</span></div>' +
      '<div class="dim" style="margin-top:12px">Batas zona untukmu</div>' +
      '<div class="kv"><span class="k">Zona hijau (80% ke atas)</span><span class="v">' + T.fmt(Math.round(acuan * 0.8)) + ' L/menit ke atas' + (persen >= 80 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Zona kuning (50-80%)</span><span class="v">' + T.fmt(Math.round(acuan * 0.5)) + ' - ' + T.fmt(Math.round(acuan * 0.8)) + ' L/menit' + (persen >= 50 && persen < 80 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Zona merah (di bawah 50%)</span><span class="v">di bawah ' + T.fmt(Math.round(acuan * 0.5)) + ' L/menit' + (persen < 50 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Cara ukur: berdiri, tarik napas dalam, lalu hembuskan sekuat dan secepat mungkin ke peak flow meter. Ulangi 3 kali dan pakai angka terbesar. ' +
      'Nilai acuan dihitung dengan persamaan ECSC (Quanjer dkk., 1993), yang hanya berlaku untuk dewasa. Nilai terbaik pribadimu (saat sehat) lebih akurat daripada nilai acuan umum. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Kalau napasmu sesak atau hasilmu terus di zona kuning atau merah, cek ke dokter.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jenis kelamin', jk),
    T.field('Umur (tahun)', umur, 'Hanya untuk dewasa (18 tahun ke atas).'),
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Hasil peak flow meter (L/menit)', ukur, 'Angka terbesar dari 3 kali tiup.'),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
