import { h as T, esc, utils } from '../../core.js';

// Skor CHA2DS2-VASc (Lip dkk., Chest 2010): perkiraan risiko stroke per
// tahun pada pasien fibrilasi atrium (jantung berdebar tidak teratur).
// C gagal jantung kongestif: 1. H hipertensi: 1. A2 umur 75 ke atas: 2.
// D diabetes: 1. S2 riwayat stroke/TIA/darah beku: 2. V penyakit pembuluh
// darah (serangan jantung, penyakit arteri kaki, plak aorta): 1.
// A umur 65-74: 1. Sc perempuan: 1. Total 0-9.
// Risiko stroke per tahun (Lip 2010, tabel adjusted stroke rate; diverifikasi
// 20 Nov 2026 terhadap PMC/Medscape/MSD Manual — skor 6 = 9,8%, BUKAN 9,7%):
// 0: 0%, 1: 1,3%, 2: 2,2%, 3: 3,2%, 4: 4,0%, 5: 6,7%, 6: 9,8%, 7: 9,6%,
// 8: 6,7%, 9: 15,2%. (Angka 9,7% di skor 6 adalah nilai Friberg 2012, bukan
// tabel Lip 2010 — dikoreksi Q5 v6.21.0.)
export const RISIKO_TAHUNAN = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 6.7, 15.2];

export function cha2ds2vasc(f) {
  let s = 0;
  if (f.gagalJantung) s += 1;
  if (f.hipertensi) s += 1;
  if (f.umur >= 75) s += 2;
  else if (f.umur >= 65) s += 1;
  if (f.diabetes) s += 1;
  if (f.stroke) s += 2;
  if (f.vaskular) s += 1;
  if (f.wanita) s += 1;
  return s;
}

export function risikoTahunan(skor) {
  return RISIKO_TAHUNAN[Math.max(0, Math.min(9, skor))];
}

export function saranCha(skor, wanita) {
  // Ambang pengencer darah umumnya: 2 ke atas (pria), 3 ke atas (wanita).
  const ambang = wanita ? 3 : 2;
  if (skor === 0) return ['Risiko rendah', 'Pada skor ini, pengencer darah umumnya tidak dianjurkan. Tetap kontrol fibrilasi atriummu ke dokter.', 'ok'];
  if (skor < ambang) return ['Risiko menengah', 'Pengencer darah bisa dipertimbangkan. Keputusan ada di tangan dokter setelah menimbang risiko perdarahanmu.', 'warn'];
  return ['Risiko tinggi', 'Pada skor ini, pengencer darah umumnya dianjurkan untuk mencegah stroke. Diskusikan dengan dokter secepatnya.', 'err'];
}
utils.cha2ds2vasc = cha2ds2vasc;
utils.risikoTahunan = risikoTahunan;

export const meta = {"id": "skor-cha2ds2-vasc", "name": "Skor CHA2DS2-VASc (Risiko Stroke)", "cat": "kesehatan", "icon": "❤️", "desc": "Perkiraan risiko stroke per tahun untuk penderita fibrilasi atrium, dari umur, riwayat penyakit, dan jenis kelamin.", "keywords": "cha2ds2-vasc,cha2ds2vasc,fibrilasi atrium,risiko stroke,stroke,pengencer darah,antikoagulan", "since": "6.19.0"};
export function render(root) {
  const umur = T.input('number', 'Umur (tahun)', '68');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const yaTidak = [['0', 'Tidak'], ['1', 'Ya']];
  const gagalJantung = T.select(yaTidak, '0');
  const hipertensi = T.select(yaTidak, '0');
  const diabetes = T.select(yaTidak, '0');
  const stroke = T.select(yaTidak, '0');
  const vaskular = T.select(yaTidak, '0');
  const box = T.out();

  const hitung = () => {
    const um = T.num(umur.value);
    if (!(um >= 18 && um <= 120)) {
      T.show(box, '<span class="err">Isi umur antara 18 sampai 120 tahun.</span>');
      return;
    }
    const wanita = gender.value === 'wanita';
    const f = {
      umur: um, wanita,
      gagalJantung: gagalJantung.value === '1',
      hipertensi: hipertensi.value === '1',
      diabetes: diabetes.value === '1',
      stroke: stroke.value === '1',
      vaskular: vaskular.value === '1',
    };
    const skor = cha2ds2vasc(f);
    const risiko = risikoTahunan(skor);
    const saran = saranCha(skor, wanita);
    const poinUmur = um >= 75 ? 2 : (um >= 65 ? 1 : 0);
    T.show(box,
      '<div class="center"><div class="dim">Skor CHA2DS2-VASc</div>' +
      '<div class="big">' + skor + ' / 9</div>' +
      '<div class="dim">Perkiraan risiko stroke: ' + utils.fmtDes(risiko, 1) + '% per tahun</div>' +
      '<div class="' + saran[2] + '" style="margin-top:6px"><b>' + esc(saran[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Gagal jantung (C)</span><span class="v">' + (f.gagalJantung ? '1 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Hipertensi (H)</span><span class="v">' + (f.hipertensi ? '1 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Umur ' + um + ' tahun (A2/A)</span><span class="v">' + poinUmur + ' poin</span></div>' +
      '<div class="kv"><span class="k">Diabetes (D)</span><span class="v">' + (f.diabetes ? '1 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Stroke/TIA/darah beku (S2)</span><span class="v">' + (f.stroke ? '2 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Penyakit pembuluh darah (V)</span><span class="v">' + (f.vaskular ? '1 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Perempuan (Sc)</span><span class="v">' + (wanita ? '1 poin' : '0') + '</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(saran[1]) + '</span></div>' +
      '<p class="hint">Skor ini hanya berlaku untuk penderita fibrilasi atrium dan hanya memperkirakan risiko stroke, BUKAN diagnosis. ' +
      'Angka risiko per tahun berasal dari studi Lip dkk. (2010) dan bisa berbeda pada tiap orang. ' +
      'Jangan mulai atau berhenti minum pengencer darah dari hasil tool ini. Keputusan obat, termasuk menimbang risiko perdarahan, sepenuhnya ada di tangan dokter yang merawatmu.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Umur (tahun)', umur),
    T.field('Jenis kelamin', gender),
  ));
  root.appendChild(T.grid2(
    T.field('Punya gagal jantung?', gagalJantung),
    T.field('Punya hipertensi (darah tinggi)?', hipertensi),
  ));
  root.appendChild(T.grid2(
    T.field('Punya diabetes?', diabetes),
    T.field('Pernah stroke, TIA, atau darah beku?', stroke, 'TIA adalah stroke ringan yang gejalanya hilang dalam sehari.'),
  ));
  root.appendChild(T.field('Punya penyakit pembuluh darah?', vaskular, 'Misalnya pernah serangan jantung, penyempitan arteri kaki, atau plak di aorta.'));
  root.appendChild(T.btn('Hitung skor', hitung, true));
  root.appendChild(box);
  hitung();
}
