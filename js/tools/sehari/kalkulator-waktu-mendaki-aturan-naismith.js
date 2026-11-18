import { h as T, utils, kv } from '../../core.js';

// Aturan Naismith: jalan datar 5 km per jam, ditambah 1 jam untuk tiap
// 600 m naik. Untuk turun, kurangi 10 menit untuk tiap 300 m turun (jalan
// turun lebih cepat, tapi lutut lebih capek). Kecepatan dasar dan angka
// naik bisa diubah, karena tiap pendaki beda. Hasilnya perkiraan untuk
// pendaki biasa dengan beban normal, belum termasuk istirahat panjang.
export function hitungMendaki(o) {
  const jarak = Math.max(0, Number(o.jarak) || 0);
  const naik = Math.max(0, Number(o.naik) || 0);
  const turun = Math.max(0, Number(o.turun) || 0);
  const kec = Math.max(0.1, Number(o.kecepatan) || 5);
  const perNaik = Math.max(1, Number(o.perNaik) || 600);
  const jamDatar = jarak / kec;
  const jamNaik = naik / perNaik;
  const jamTurun = turun > 0 ? turun / 300 * (10 / 60) : 0;
  const totalJam = Math.max(0, jamDatar + jamNaik - jamTurun);
  const istirahat = Math.max(0, Number(o.istirahat) || 0) / 60;
  return { jamDatar, jamNaik, jamTurun, totalJam: totalJam + istirahat, jalanJam: totalJam };
}
utils.waktuMendakiNaismith = hitungMendaki;

export function fmtDurasi(jam) {
  const totalMenit = Math.round(jam * 60);
  const j = Math.floor(totalMenit / 60);
  const m = totalMenit % 60;
  if (j <= 0) return m + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}

export const meta = {"id": "kalkulator-waktu-mendaki-aturan-naismith", "name": "Kalkulator Waktu Mendaki (Aturan Naismith)", "cat": "sehari", "icon": "🥾", "desc": "Perkiraan waktu mendaki dari jarak dan ketinggian, pakai aturan Naismith.", "keywords": "mendaki,naismith,gunung,hiking,trekking,waktu,jalur,ketinggian", "since": "6.17.0"};
export function render(root) {
  const jarakI = T.input('text', 'cth: 10', ''); jarakI.inputMode = 'decimal';
  const naikI = T.input('text', 'cth: 600', ''); naikI.inputMode = 'decimal';
  const turunI = T.input('text', 'cth: 0', '0'); turunI.inputMode = 'decimal';
  const kecI = T.input('text', 'cth: 5', '5'); kecI.inputMode = 'decimal';
  const istirahatI = T.input('text', 'cth: 30', '0'); istirahatI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const jarak = T.num(jarakI.value) || 0;
    const naik = T.num(naikI.value) || 0;
    if (!(jarak > 0) && !(naik > 0)) { T.hide(box); return; }
    const kec = T.num(kecI.value);
    if (!isFinite(kec) || kec <= 0) { T.show(box, '<p class="warn">Kecepatan jalan harus angka lebih dari 0.</p>'); return; }
    const r = hitungMendaki({ jarak, naik, turun: T.num(turunI.value), kecepatan: kec, perNaik: 600, istirahat: T.num(istirahatI.value) });
    T.show(box,
      '<div class="big">' + fmtDurasi(r.totalJam) + '</div>' +
      '<p class="center mut">Perkiraan total waktu mendaki.</p>' +
      kv('Waktu jalan datar (' + T.fmt(Math.round(jarak * 10) / 10) + ' km)', fmtDurasi(r.jamDatar)) +
      kv('Tambahan untuk naik (' + T.fmt(naik) + ' m)', '+ ' + fmtDurasi(r.jamNaik)) +
      (r.jamTurun > 0 ? kv('Pengurang untuk turun (' + T.fmt(T.num(turunI.value) || 0) + ' m)', '- ' + fmtDurasi(r.jamTurun)) : '') +
      kv('Waktu jalan murni', fmtDurasi(r.jalanJam)) +
      ((T.num(istirahatI.value) || 0) > 0 ? kv('Istirahat', fmtDurasi((T.num(istirahatI.value) || 0) / 60)) : '') +
      '<p class="hint">Aturan Naismith (William Naismith, 1892): jalan datar 5 km per jam, tambah 1 jam tiap 600 m naik, kurangi 10 menit tiap 300 m turun. Ini perkiraan pendaki biasa dengan beban normal di jalur yang jelas. Jalur terjal, licin, beban berat, atau rombongan besar bisa membuat waktunya lebih lama. Selalu sisakan waktu cadangan sebelum gelap.</p>');
  };
  [jarakI, naikI, turunI, kecI, istirahatI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Jarak saja tidak cukup untuk memperkirakan waktu mendaki, tanjakan yang bikin lama. Aturan Naismith menghitung keduanya.</p>'));
  root.appendChild(T.field('Jarak jalur (km)', jarakI, 'Panjang jalur sekali jalan'));
  root.appendChild(T.grid2(
    T.field('Total naik (meter)', naikI, 'Ketinggian yang didaki, bukan ketinggian puncak'),
    T.field('Total turun (meter)', turunI, 'Untuk jalur pulang atau jalur naik-turun')
  ));
  root.appendChild(T.grid2(
    T.field('Kecepatan jalan datar (km/jam)', kecI, 'Naismith memakai 5 km/jam'),
    T.field('Istirahat (menit)', istirahatI, 'Total berhenti selama perjalanan')
  ));
  root.appendChild(box);
  hitung();
}
