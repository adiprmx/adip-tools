import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-kecepatan-jarak-waktu', name: 'Kalkulator Kecepatan (Jarak/Waktu)', cat: 'pelajar', icon: '🏃', desc: 'Cari kecepatan, jarak, atau waktu dari dua yang sudah diketahui. Lengkap dengan ubah satuan.', keywords: 'kecepatan,jarak,waktu,km/jam,m/s,cepat,lama perjalanan,rumus kecepatan', since: '6.17.0' };

// Semua hitungan dalam SI: meter, detik, m/s.
export function hitungKecepatan(jarakM, waktuS) { return jarakM / waktuS; }
export function hitungJarak(kecMS, waktuS) { return kecMS * waktuS; }
export function hitungWaktu(jarakM, kecMS) { return jarakM / kecMS; }

export const KE_SATUAN = {
  'km/jam': 1000 / 3600,
  'm/s': 1,
  'mil/jam': 1609.344 / 3600,
  'knot': 1852 / 3600,
};

export function fmtWaktu(detik) {
  if (!isFinite(detik) || detik < 0) return 'di luar jangkauan';
  const jam = Math.floor(detik / 3600);
  const menit = Math.floor((detik % 3600) / 60);
  const dtk = Math.round((detik % 60) * 10) / 10;
  const bagian = [];
  if (jam) bagian.push(jam + ' jam');
  if (menit) bagian.push(menit + ' menit');
  if (dtk || !bagian.length) bagian.push(String(dtk).replace('.', ',') + ' detik');
  return bagian.join(' ');
}

function fmtNum(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * Math.pow(10, des == null ? 3 : des)) / Math.pow(10, des == null ? 3 : des);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi dua yang sudah kamu tahu, nanti yang ketiga ketahuan. Rumusnya: kecepatan = jarak ÷ waktu.</p>'));

  const cari = T.select([['kecepatan', 'Cari kecepatan'], ['jarak', 'Cari jarak'], ['waktu', 'Cari waktu']], 'kecepatan');
  const jarakI = T.input('number', 'mis. 120');
  const jarakSat = T.select([['km', 'kilometer (km)'], ['m', 'meter (m)'], ['mil', 'mil']], 'km');
  const kecI = T.input('number', 'mis. 60');
  const kecSat = T.select([['km/jam', 'km/jam'], ['m/s', 'meter/detik'], ['mil/jam', 'mil/jam'], ['knot', 'knot']], 'km/jam');
  const jamI = T.input('number', 'jam', '0');
  const menitI = T.input('number', 'menit', '0');
  const detikI = T.input('number', 'detik', '0');

  const wrapJarak = T.el('<div></div>');
  wrapJarak.append(T.grid2(T.field('Jarak', jarakI), T.field('Satuan jarak', jarakSat)));
  const wrapKec = T.el('<div></div>');
  wrapKec.append(T.grid2(T.field('Kecepatan', kecI), T.field('Satuan kecepatan', kecSat)));
  const wrapWaktu = T.el('<div></div>');
  wrapWaktu.append(T.el('<p style="font-weight:700;margin:6px 0 2px">Waktu</p>'), T.grid2(T.field('Jam', jamI), T.field('Menit', menitI)), T.field('Detik', detikI));

  function aturTampil() {
    wrapJarak.hidden = cari.value === 'jarak';
    wrapKec.hidden = cari.value === 'kecepatan';
    wrapWaktu.hidden = cari.value === 'waktu';
  }
  cari.addEventListener('change', aturTampil);
  aturTampil();

  const box = T.out();

  function bacaWaktu() {
    const j = T.num(jamI.value) || 0, m = T.num(menitI.value) || 0, d = T.num(detikI.value) || 0;
    return j * 3600 + m * 60 + d;
  }
  function jarakKeMeter(v, sat) {
    return sat === 'km' ? v * 1000 : sat === 'mil' ? v * 1609.344 : v;
  }

  function hitung() {
    if (cari.value === 'kecepatan') {
      const j = T.num(jarakI.value);
      const w = bacaWaktu();
      if (!(j > 0)) { T.toast('Isi jaraknya dulu, harus lebih dari 0'); return; }
      if (!(w > 0)) { T.toast('Isi waktunya dulu, harus lebih dari 0'); return; }
      const ms = hitungKecepatan(jarakKeMeter(j, jarakSat.value), w);
      T.show(box,
        '<p class="big">' + fmtNum(ms / KE_SATUAN['km/jam']) + ' km/jam</p>' +
        '<p class="hint">Sama dengan ' + fmtNum(ms) + ' m/s, ' + fmtNum(ms / KE_SATUAN['mil/jam']) + ' mil/jam, dan ' + fmtNum(ms / KE_SATUAN['knot']) + ' knot.</p>' +
        '<p class="hint">Cara hitungnya: ' + fmtNum(j) + ' ' + jarakSat.value + ' ÷ ' + fmtWaktu(w) + '.</p>');
    } else if (cari.value === 'jarak') {
      const k = T.num(kecI.value);
      const w = bacaWaktu();
      if (!(k > 0)) { T.toast('Isi kecepatannya dulu, harus lebih dari 0'); return; }
      if (!(w > 0)) { T.toast('Isi waktunya dulu, harus lebih dari 0'); return; }
      const meter = hitungJarak(k * KE_SATUAN[kecSat.value], w);
      T.show(box,
        '<p class="big">' + fmtNum(meter / 1000) + ' km</p>' +
        '<p class="hint">Sama dengan ' + T.fmt(Math.round(meter)) + ' meter, atau ' + fmtNum(meter / 1609.344) + ' mil.</p>' +
        '<p class="hint">Cara hitungnya: ' + fmtNum(k) + ' ' + kecSat.value + ' × ' + fmtWaktu(w) + '.</p>');
    } else {
      const j = T.num(jarakI.value);
      const k = T.num(kecI.value);
      if (!(j > 0)) { T.toast('Isi jaraknya dulu, harus lebih dari 0'); return; }
      if (!(k > 0)) { T.toast('Isi kecepatannya dulu, harus lebih dari 0'); return; }
      const detik = hitungWaktu(jarakKeMeter(j, jarakSat.value), k * KE_SATUAN[kecSat.value]);
      T.show(box,
        '<p class="big">' + fmtWaktu(detik) + '</p>' +
        '<p class="hint">Totalnya ' + fmtNum(detik / 3600) + ' jam, atau ' + fmtNum(detik / 60) + ' menit.</p>' +
        '<p class="hint">Cara hitungnya: ' + fmtNum(j) + ' ' + jarakSat.value + ' ÷ ' + fmtNum(k) + ' ' + kecSat.value + '.</p>');
    }
  }

  root.append(
    T.field('Yang mau dicari', cari),
    wrapJarak, wrapKec, wrapWaktu,
    T.btn('Hitung', hitung, true),
    box,
  );
}
