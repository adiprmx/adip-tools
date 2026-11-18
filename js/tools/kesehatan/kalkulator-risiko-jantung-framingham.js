import { h as T, esc } from '../../core.js';

// Risiko penyakit jantung koroner 10 tahun ke depan, skor Framingham
// (Wilson dkk., Circulation 1998). Tiap faktor diberi poin berdasarkan
// tabel Framingham, lalu total poin diubah jadi persen risiko.
// Berlaku untuk umur 20-79 tahun. Kolesterol dalam mg/dL, tekanan darah
// sistolik dalam mmHg.
function kelompokUmur(u) {
  if (u < 40) return 0;
  if (u < 50) return 1;
  if (u < 60) return 2;
  if (u < 70) return 3;
  return 4;
}

function poinUmur(u, pria) {
  const tabelPria = [[34, -9], [39, -4], [44, 0], [49, 3], [54, 6], [59, 8], [64, 10], [69, 11], [74, 12], [79, 13]];
  const tabelWanita = [[34, -7], [39, -3], [44, 0], [49, 3], [54, 6], [59, 8], [64, 10], [69, 12], [74, 14], [79, 16]];
  const tabel = pria ? tabelPria : tabelWanita;
  for (const [batas, poin] of tabel) if (u <= batas) return poin;
  return pria ? 13 : 16;
}

function poinKolesterol(tc, u, pria) {
  const k = kelompokUmur(u);
  const tabelPria = [[160, [0, 0, 0, 0, 0]], [200, [4, 3, 2, 1, 0]], [240, [7, 5, 3, 1, 0]], [280, [9, 6, 4, 2, 1]], [Infinity, [11, 8, 5, 3, 1]]];
  const tabelWanita = [[160, [0, 0, 0, 0, 0]], [200, [4, 3, 2, 1, 1]], [240, [8, 6, 4, 2, 1]], [280, [11, 8, 5, 3, 2]], [Infinity, [13, 10, 7, 4, 2]]];
  const tabel = pria ? tabelPria : tabelWanita;
  for (const [batas, poin] of tabel) if (tc < batas) return poin[k];
  return 0;
}

function poinRokok(u, pria) {
  const k = kelompokUmur(u);
  return (pria ? [8, 5, 3, 1, 1] : [9, 7, 4, 2, 1])[k];
}

function poinHdl(hdl) {
  if (hdl >= 60) return -1;
  if (hdl >= 50) return 0;
  if (hdl >= 40) return 1;
  return 2;
}

function poinTekanan(sbp, diobati, pria) {
  const t = [
    [120, pria ? [0, 0] : [0, 0]],
    [130, pria ? [0, 1] : [1, 3]],
    [140, pria ? [1, 2] : [2, 4]],
    [160, pria ? [1, 2] : [3, 5]],
    [Infinity, pria ? [2, 3] : [4, 6]],
  ];
  for (const [batas, poin] of t) if (sbp < batas) return poin[diobati ? 1 : 0];
  return 0;
}

export function risikoDariPoin(poin, pria) {
  // [poin minimum, risiko %]. Di atas poin maksimum tabel, risiko "30% ke atas".
  const tabelPria = [[0, 1], [5, 2], [7, 3], [8, 4], [9, 5], [10, 6], [11, 8], [12, 10], [13, 12], [14, 16], [15, 20], [16, 25], [17, 30]];
  const tabelWanita = [[9, 1], [13, 2], [15, 3], [16, 4], [17, 5], [18, 6], [19, 8], [20, 11], [21, 14], [22, 17], [23, 22], [24, 27], [25, 30]];
  const tabel = pria ? tabelPria : tabelWanita;
  // Tabel wanita mulai di 9 poin = 1%; di bawah 9 poin risikonya <1%
  // (Wilson dkk. 1998) — bukan 1% (RED-G2-12). Tabel pria mulai di
  // 0 poin = 1%; poin negatif (pria muda sehat bisa −10) juga <1%
  // (RED-G2-14).
  const diBawahSatu = (!pria && poin < 9) || (pria && poin < 0);
  let risiko = 1;
  let atas = false;
  for (const [batas, r] of tabel) {
    if (poin >= batas) { risiko = r; atas = (pria && batas === 17) || (!pria && batas === 25); }
  }
  return { risiko, atas, diBawahSatu };
}

export const meta = {"id": "kalkulator-risiko-jantung-framingham", "name": "Kalkulator Risiko Jantung Framingham", "cat": "kesehatan", "icon": "❤️", "desc": "Perkiraan risiko penyakit jantung koroner 10 tahun ke depan, dari umur, kolesterol, tekanan darah, dan kebiasaanmu.", "keywords": "framingham,risiko jantung,jantung koroner,kolesterol,tekanan darah,diabetes,merokok", "since": "6.17.0"};
export function render(root) {
  const umur = T.input('number', 'Umur (tahun)', '55');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const kolTotal = T.input('number', 'Kolesterol total (mg/dL)', '220');
  const hdl = T.input('number', 'Kolesterol HDL / kolesterol baik (mg/dL)', '45');
  const sistolik = T.input('number', 'Tekanan darah atas / sistolik (mmHg)', '140');
  const obat = T.select([['tidak', 'Tidak minum obat darah tinggi'], ['ya', 'Minum obat darah tinggi']], 'tidak');
  const rokok = T.select([['tidak', 'Tidak merokok'], ['ya', 'Merokok']], 'tidak');
  const diabetes = T.select([['tidak', 'Tidak diabetes'], ['ya', 'Diabetes']], 'tidak');
  const box = T.out();

  const hitung = () => {
    const u = T.num(umur.value);
    const tc = T.num(kolTotal.value);
    const h = T.num(hdl.value);
    const sbp = T.num(sistolik.value);
    if (!(u >= 20 && u <= 79)) {
      T.show(box, '<span class="err">Skor Framingham hanya berlaku untuk umur 20 sampai 79 tahun.</span>');
      return;
    }
    if (!(tc >= 100 && tc <= 400)) {
      T.show(box, '<span class="err">Isi kolesterol total antara 100 sampai 400 mg/dL. Angkanya ada di hasil lab darahmu.</span>');
      return;
    }
    if (!(h >= 10 && h <= 150)) {
      T.show(box, '<span class="err">Isi kolesterol HDL antara 10 sampai 150 mg/dL.</span>');
      return;
    }
    if (!(sbp >= 80 && sbp <= 250)) {
      T.show(box, '<span class="err">Isi tekanan darah atas antara 80 sampai 250 mmHg.</span>');
      return;
    }
    const pria = gender.value === 'pria';
    const pUmur = poinUmur(u, pria);
    const pKol = poinKolesterol(tc, u, pria);
    const pHdl = poinHdl(h);
    const pTek = poinTekanan(sbp, obat.value === 'ya', pria);
    const pRokok = rokok.value === 'ya' ? poinRokok(u, pria) : 0;
    const pDiab = diabetes.value === 'ya' ? (pria ? 2 : 4) : 0;
    const total = pUmur + pKol + pHdl + pTek + pRokok + pDiab;
    const r = risikoDariPoin(total, pria);
    const kat = r.risiko < 10 ? ['Rendah', 'ok'] : r.risiko <= 20 ? ['Sedang', 'warn'] : ['Tinggi', 'err'];
    const teksRisiko = r.atas ? '30% ke atas' : r.diBawahSatu ? '<1%' : r.risiko + '%';
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan risiko penyakit jantung koroner, 10 tahun ke depan</div>' +
      '<div class="big">' + teksRisiko + '</div>' +
      '<div class="' + kat[1] + '" style="margin-top:6px"><b>Kategori: ' + esc(kat[0]) + '</b> (total skor ' + total + ' poin)</div></div>' +
      '<div class="dim" style="margin-top:12px">Rincian poin Framingham</div>' +
      '<div class="kv"><span class="k">Umur</span><span class="v">' + pUmur + ' poin</span></div>' +
      '<div class="kv"><span class="k">Kolesterol total</span><span class="v">' + pKol + ' poin</span></div>' +
      '<div class="kv"><span class="k">Kolesterol HDL</span><span class="v">' + pHdl + ' poin</span></div>' +
      '<div class="kv"><span class="k">Tekanan darah</span><span class="v">' + pTek + ' poin</span></div>' +
      '<div class="kv"><span class="k">Merokok</span><span class="v">' + pRokok + ' poin</span></div>' +
      '<div class="kv"><span class="k">Diabetes</span><span class="v">' + pDiab + ' poin</span></div>' +
      '<p class="hint">Dihitung dengan skor Framingham (Wilson dkk., 1998) dari studi jantung Framingham. Angka ini artinya: dari 100 orang dengan profil yang sama, ' + (r.diBawahSatu ? 'kurang dari 1 orang diperkirakan' : 'sekitar ' + r.risiko + ' orang diperkirakan') + ' kena penyakit jantung koroner dalam 10 tahun. ' +
      'Ini perkiraan populasi, bukan diagnosis buat kamu secara pribadi, dan tidak menghitung riwayat keluarga atau faktor lain. ' +
      'Bila risikomu sedang atau tinggi, cek ke dokter atau tenaga kesehatan untuk pemeriksaan lanjutan. Berhenti merokok, gerak teratur, dan pola makan sehat bisa menurunkan risikonya.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Umur (tahun)', umur),
    T.field('Jenis kelamin', gender),
  ));
  root.appendChild(T.grid2(
    T.field('Kolesterol total (mg/dL)', kolTotal, 'Dari hasil lab darah.'),
    T.field('Kolesterol HDL (mg/dL)', hdl, 'Kolesterol baik, dari hasil lab yang sama.'),
  ));
  root.appendChild(T.grid2(
    T.field('Tekanan darah atas / sistolik (mmHg)', sistolik, 'Angka atas saat tensi, misal 140 dari 140/90.'),
    T.field('Obat darah tinggi', obat),
  ));
  root.appendChild(T.grid2(
    T.field('Merokok', rokok),
    T.field('Diabetes', diabetes),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
