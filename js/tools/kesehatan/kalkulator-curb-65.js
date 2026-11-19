import { h as T, esc, utils } from '../../core.js';

// CURB-65, skor keparahan pneumonia (Lim dkk., Thorax 2003).
// Satu poin untuk tiap kriteria yang terpenuhi (total 0-5):
//   C: bingung (disorientasi baru terhadap orang, tempat, atau waktu)
//   U: urea darah di atas 7 mmol/L (setara BUN di atas 19 mg/dL)
//   R: laju napas 30 kali/menit ke atas
//   B: tekanan darah sistolik di bawah 90 atau diastolik 60 ke bawah
//   65: umur 65 tahun ke atas
// Angka kematian 30 hari per skor (Lim dkk. 2003): 0: 0,7%, 1: 2,1%,
// 2: 9,2%, 3: 14,5%, 4: 40%, 5: 57%.
export const MORTALITAS_CURB65 = [0.7, 2.1, 9.2, 14.5, 40, 57];

export function hitungCURB65(o) {
  const k = {
    bingung: !!o.bingung,
    urea: o.ureaMmol > 7,
    napas: o.napas >= 30,
    tekanan: o.sistolik < 90 || o.diastolik <= 60,
    umur: o.umur >= 65,
  };
  const skor = (k.bingung ? 1 : 0) + (k.urea ? 1 : 0) + (k.napas ? 1 : 0) + (k.tekanan ? 1 : 0) + (k.umur ? 1 : 0);
  return { skor, kriteria: k, mortalitas: MORTALITAS_CURB65[skor] };
}

export function risikoCURB65(skor) {
  if (skor <= 1) return ['Risiko rendah', 'Skor 0-1 biasanya dirawat jalan dengan obat dari dokter, bila kondisi umumnya baik dan tidak ada masalah lain.', 'ok'];
  if (skor === 2) return ['Risiko sedang', 'Skor 2 biasanya perlu rawat inap singkat di rumah sakit untuk pemantauan dan obat lewat infus.', 'warn'];
  return ['Risiko tinggi', 'Skor 3 ke atas biasanya perlu rawat inap, dan dokter akan mempertimbangkan perawatan intensif. Segera ke rumah sakit.', 'err'];
}

export const meta = { "id": "kalkulator-curb-65", "name": "Kalkulator Skor CURB-65 (Pneumonia)", "cat": "kesehatan", "icon": "🫁", "desc": "Skor keparahan pneumonia dari 5 tanda: bingung, urea darah, laju napas, tekanan darah, dan umur.", "keywords": "curb-65,curb65,pneumonia,paru,skor keparahan,urea,napas,tekanan darah", "since": "6.19.0" };

export function render(root) {
  const bingung = T.select([['tidak', 'Tidak'], ['ya', 'Ya, bingung atau linglung (baru)']], 'tidak');
  const urea = T.input('number', 'Urea darah (mmol/L)', '5');
  const napas = T.input('number', 'Laju napas (kali/menit)', '20');
  const sistolik = T.input('number', 'Tekanan atas / sistolik', '120');
  const diastolik = T.input('number', 'Tekanan bawah / diastolik', '80');
  const umur = T.input('number', 'Umur (tahun)', '50');
  const box = T.out();

  const hitung = () => {
    const ur = T.num(urea.value);
    const np = T.num(napas.value);
    const sis = T.num(sistolik.value);
    const dia = T.num(diastolik.value);
    const u = T.num(umur.value);
    if (!(ur >= 0.5 && ur <= 60)) {
      T.show(box, '<span class="err">Isi urea darah antara 0,5 sampai 60 mmol/L (dari hasil lab).</span>');
      return;
    }
    if (!(np >= 4 && np <= 80)) {
      T.show(box, '<span class="err">Isi laju napas antara 4 sampai 80 kali/menit.</span>');
      return;
    }
    if (!(sis >= 40 && sis <= 300)) {
      T.show(box, '<span class="err">Isi tekanan sistolik antara 40 sampai 300 mmHg.</span>');
      return;
    }
    if (!(dia >= 20 && dia <= 200)) {
      T.show(box, '<span class="err">Isi tekanan diastolik antara 20 sampai 200 mmHg.</span>');
      return;
    }
    if (!(u >= 0 && u <= 120)) {
      T.show(box, '<span class="err">Isi umur antara 0 sampai 120 tahun.</span>');
      return;
    }
    const r = hitungCURB65({ bingung: bingung.value === 'ya', ureaMmol: ur, napas: np, sistolik: sis, diastolik: dia, umur: u });
    const rk = risikoCURB65(r.skor);
    const baris = (label, ya) => '<div class="kv"><span class="k">' + label + '</span><span class="v">' + (ya ? '<b>1 poin</b>' : '0 poin') + '</span></div>';
    T.show(box,
      '<div class="center"><div class="dim">Skor CURB-65</div>' +
      '<div class="big">' + r.skor + ' / 5</div>' +
      '<div class="' + rk[2] + '" style="margin-top:6px"><b>' + esc(rk[0]) + '</b><br>' + esc(rk[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Angka kematian 30 hari (penelitian Lim 2003)</span><span class="v">sekitar ' + utils.fmtDes(r.mortalitas, 1) + '%</span></div>' +
      '<div class="dim" style="margin-top:12px">Rincian 5 kriteria</div>' +
      baris('Bingung (baru)', r.kriteria.bingung) +
      baris('Urea di atas 7 mmol/L', r.kriteria.urea) +
      baris('Napas 30 kali/menit ke atas', r.kriteria.napas) +
      baris('Tekanan darah rendah (atas di bawah 90 atau bawah 60 ke bawah)', r.kriteria.tekanan) +
      baris('Umur 65 tahun ke atas', r.kriteria.umur) +
      '<p class="hint">CURB-65 adalah alat bantu dokter di rumah sakit untuk menilai pneumonia, dari Lim dkk. (Thorax, 2003). ' +
      'Skor ini tidak bisa dipakai menilai sendiri di rumah tanpa hasil lab dan pemeriksaan dokter. Ini perkiraan buat belajar, bukan diagnosis. ' +
      'Kalau kamu atau orang terdekatmu sesak napas, demam tinggi, atau bingung, segera ke dokter atau rumah sakit.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Bingung atau linglung (baru muncul)?', bingung, 'Tidak kenal orang, tempat, atau waktu, yang sebelumnya tidak ada.'),
    T.field('Urea darah (mmol/L)', urea, 'Dari hasil lab. Urea di atas 7 mmol/L = 1 poin.'),
    T.field('Laju napas (kali/menit)', napas, 'Hitung naik-turun dada selama 1 menit saat istirahat.'),
    T.field('Tekanan darah atas / sistolik (mmHg)', sistolik),
    T.field('Tekanan darah bawah / diastolik (mmHg)', diastolik),
    T.field('Umur (tahun)', umur),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
