import { h as T, esc, utils } from '../../core.js';

// Denyut jantung pemulihan (HRR, heart rate recovery): seberapa jauh
// denyut jantung turun setelah olahraga berhenti.
//   HRR 1 menit = denyut puncak - denyut 1 menit setelah berhenti
//   HRR 2 menit = denyut puncak - denyut 2 menit setelah berhenti
// Patokan (Cole dkk., New England Journal of Medicine 1999): HRR 1 menit
// 12 denyut/menit ke bawah dianggap tidak normal dan dikaitkan dengan
// risiko kematian yang lebih tinggi. Untuk 2 menit, patokan umum yang
// dipakai adalah 22 denyut/menit ke bawah sebagai batas kurang baik.
export function hitungHRR(puncak, menit1, menit2) {
  if (!(puncak > 0) || !(menit1 > 0)) return null;
  const hrr1 = puncak - menit1;
  const hrr2 = menit2 != null && menit2 > 0 ? puncak - menit2 : null;
  return { hrr1, hrr2 };
}

export function kategoriHRR1(hrr1) {
  if (hrr1 <= 12) return ['Kurang baik', 'Denyutmu turun 12 kali/menit atau kurang dalam 1 menit. Menurut penelitian Cole (1999), ini perlu diperhatikan dan sebaiknya dibicarakan dengan dokter.', 'err'];
  return ['Baik', 'Denyutmu turun lebih dari 12 kali/menit dalam 1 menit. Jantungmu pulih dengan kecepatan yang normal setelah olahraga.', 'ok'];
}

export function kategoriHRR2(hrr2) {
  if (hrr2 < 22) return ['Kurang baik', 'Denyutmu turun kurang dari 22 kali/menit dalam 2 menit. Pemulihanmu agak lambat; bicarakan dengan dokter bila ini terus terjadi.', 'warn'];
  return ['Baik', 'Denyutmu turun 22 kali/menit atau lebih dalam 2 menit. Pemulihanmu baik.', 'ok'];
}

export const meta = { "id": "kalkulator-denyut-jantung-pemulihan", "name": "Kalkulator Denyut Jantung Pemulihan (HRR)", "cat": "kesehatan", "icon": "❤️‍🩹", "desc": "Seberapa cepat denyut jantungmu turun setelah olahraga berhenti, dan apa artinya buat kesehatan jantungmu.", "keywords": "hrr,denyut jantung pemulihan,heart rate recovery,denyut jantung,olahraga,jantung,kardio", "since": "6.19.0" };

export function render(root) {
  const puncak = T.input('number', 'Denyut saat puncak olahraga (bpm)', '170');
  const menit1 = T.input('number', 'Denyut 1 menit setelah berhenti (bpm)', '145');
  const menit2 = T.input('number', 'Denyut 2 menit setelah berhenti (bpm, boleh kosong)', '');
  const box = T.out();

  const hitung = () => {
    const pk = T.num(puncak.value);
    const m1 = T.num(menit1.value);
    const m2raw = menit2.value.trim();
    const m2 = m2raw === '' ? null : T.num(m2raw);
    if (!(pk >= 60 && pk <= 250)) {
      T.show(box, '<span class="err">Isi denyut puncak antara 60 sampai 250 kali/menit.</span>');
      return;
    }
    if (!(m1 >= 30 && m1 <= 250)) {
      T.show(box, '<span class="err">Isi denyut 1 menit antara 30 sampai 250 kali/menit.</span>');
      return;
    }
    if (m2 != null && !(m2 >= 30 && m2 <= 250)) {
      T.show(box, '<span class="err">Isi denyut 2 menit antara 30 sampai 250 kali/menit, atau kosongkan.</span>');
      return;
    }
    if (m1 > pk || (m2 != null && m2 > pk)) {
      T.show(box, '<span class="err">Denyut setelah berhenti tidak mungkin lebih tinggi dari denyut puncak. Periksa lagi angkanya.</span>');
      return;
    }
    const r = hitungHRR(pk, m1, m2);
    const k1 = kategoriHRR1(r.hrr1);
    let html =
      '<div class="center"><div class="dim">Penurunan denyut dalam 1 menit (HRR 1 menit)</div>' +
      '<div class="big">' + utils.fmtDes(r.hrr1, 0) + ' bpm</div>' +
      '<div class="' + k1[2] + '" style="margin-top:6px"><b>' + esc(k1[0]) + '</b><br>' + esc(k1[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Denyut puncak</span><span class="v">' + T.fmt(pk) + ' bpm</span></div>' +
      '<div class="kv"><span class="k">Denyut 1 menit setelah berhenti</span><span class="v">' + T.fmt(m1) + ' bpm</span></div>';
    if (r.hrr2 != null) {
      const k2 = kategoriHRR2(r.hrr2);
      html += '<div class="kv"><span class="k">Denyut 2 menit setelah berhenti</span><span class="v">' + T.fmt(m2) + ' bpm</span></div>' +
        '<div class="kv"><span class="k">Penurunan dalam 2 menit (HRR 2 menit)</span><span class="v">' + utils.fmtDes(r.hrr2, 0) + ' bpm, ' + esc(k2[0].toLowerCase()) + '</span></div>' +
        '<div class="' + k2[2] + '" style="margin-top:8px">' + esc(k2[1]) + '</div>';
    }
    html += '<div class="dim" style="margin-top:12px">Patokan</div>' +
      '<div class="kv"><span class="k">HRR 1 menit 12 ke bawah</span><span class="v">Kurang baik (Cole dkk., 1999)' + (r.hrr1 <= 12 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">HRR 1 menit di atas 12</span><span class="v">Baik' + (r.hrr1 > 12 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Cara ukur: catat denyut saat olahraga paling berat, lalu berhenti dan catat lagi setelah 1 menit (dan 2 menit) sambil jalan pelan atau berdiri. ' +
      'Obat jantung dan kondisi tertentu memengaruhi hasil. Ini perkiraan buat belajar, bukan diagnosis. Kalau denyutmu pulih lambat terus-menerus, atau kamu merasa pusing dan sesak saat olahraga, cek ke dokter.</p>';
    T.show(box, html);
  };

  root.appendChild(T.grid2(
    T.field('Denyut saat puncak olahraga (bpm)', puncak, 'Denyut tertinggi saat olahraga, dari jam tangan atau alat ukur.'),
    T.field('Denyut 1 menit setelah berhenti (bpm)', menit1),
    T.field('Denyut 2 menit setelah berhenti (bpm)', menit2, 'Boleh kosong kalau tidak diukur.'),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
