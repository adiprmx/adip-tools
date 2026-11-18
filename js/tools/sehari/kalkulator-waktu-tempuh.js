import { h as T, utils, kv } from '../../core.js';

// Waktu tempuh = jarak / kecepatan rata-rata, ditambah istirahat.
// Bila jam berangkat diisi, jam tibanya dihitung juga.
export function hitungWaktuTempuh(jarak, kecepatan, istirahatMenit) {
  const j = Math.max(0, Number(jarak) || 0);
  const k = Math.max(0, Number(kecepatan) || 0);
  const istirahat = Math.max(0, Number(istirahatMenit) || 0);
  if (k <= 0) return null;
  const jalanMenit = j / k * 60;
  return { jalanMenit, istirahatMenit: istirahat, totalMenit: jalanMenit + istirahat };
}
utils.waktuTempuh = hitungWaktuTempuh;

export function fmtDurasi(menit) {
  const total = Math.round(menit);
  const j = Math.floor(total / 60);
  const m = total % 60;
  if (j <= 0) return total + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}
export function tambahWaktu(jamBerangkat, menit) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(jamBerangkat || '').trim());
  if (!m) return '';
  const total = (+m[1] * 60 + +m[2] + Math.round(menit)) % (24 * 60);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

export const meta = {"id": "kalkulator-waktu-tempuh", "name": "Kalkulator Waktu Tempuh", "cat": "sehari", "icon": "🕐", "desc": "Berapa lama perjalanan dari jarak dan kecepatan rata-rata, plus jam tiba bila jam berangkat diisi.", "keywords": "waktu tempuh,jarak,kecepatan,perjalanan,berangkat,tiba,jam", "since": "6.17.0"};
export function render(root) {
  const jarakI = T.input('text', 'cth: 120', ''); jarakI.inputMode = 'decimal';
  const kecI = T.input('text', 'cth: 60', ''); kecI.inputMode = 'decimal';
  const istirahatI = T.input('text', 'cth: 30', '0'); istirahatI.inputMode = 'decimal';
  const berangkatI = T.input('time', '', '');
  const box = T.out();

  const hitung = () => {
    const jarak = T.num(jarakI.value) || 0;
    const kec = T.num(kecI.value);
    if (!(jarak > 0)) { T.hide(box); return; }
    if (!isFinite(kec) || kec <= 0) { T.show(box, '<p class="warn">Kecepatan rata-rata harus angka lebih dari 0.</p>'); return; }
    const r = hitungWaktuTempuh(jarak, kec, T.num(istirahatI.value));
    const tiba = berangkatI.value ? tambahWaktu(berangkatI.value, r.totalMenit) : '';
    T.show(box,
      '<div class="big">' + fmtDurasi(r.totalMenit) + '</div>' +
      '<p class="center mut">Total waktu perjalanan.</p>' +
      kv('Jarak', T.fmt(Math.round(jarak * 10) / 10) + ' km') +
      kv('Kecepatan rata-rata', T.fmt(Math.round(kec * 10) / 10) + ' km/jam') +
      kv('Waktu jalan murni', fmtDurasi(r.jalanMenit)) +
      (r.istirahatMenit > 0 ? kv('Istirahat', fmtDurasi(r.istirahatMenit)) : '') +
      (tiba ? kv('Jam tiba (berangkat ' + T.esc(berangkatI.value) + ')', '<b>' + tiba + '</b>') : '') +
      '<p class="hint">Kecepatan rata-rata bukan kecepatan tertinggi di speedometer. Di jalan tol yang lancar, rata-rata mobil sekitar 70-80 km/jam; di jalan kota yang macet bisa di bawah 30 km/jam. Tambahkan istirahat bila perjalanan jauh.</p>');
  };
  [jarakI, kecI, istirahatI, berangkatI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau tahu sampai jam berapa? Masukkan jarak dan kecepatan rata-rata, dan waktu tempuhnya langsung ketemu.</p>'));
  root.appendChild(T.field('Jarak (km)', jarakI, 'Cek di aplikasi peta untuk angka pastinya'));
  root.appendChild(T.field('Kecepatan rata-rata (km/jam)', kecI, 'Kecepatan jalan secara keseluruhan, bukan kecepatan tertinggi'));
  root.appendChild(T.grid2(
    T.field('Istirahat (menit)', istirahatI, 'Total berhenti selama perjalanan'),
    T.field('Jam berangkat (opsional)', berangkatI, 'Diisi untuk menghitung jam tiba')
  ));
  root.appendChild(box);
  hitung();
}
