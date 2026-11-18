import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-kenaikan-gaji", "name": "Kalkulator Kenaikan Gaji", "cat": "bisnis", "icon": "💼", "desc": "Gaji baru, selisih, dan persentase kenaikan gajimu.", "keywords": "kenaikan gaji,gaji baru,gaji naik,persen kenaikan,gaji", "since": "6.17.0"};

// Dari persen: gajiBaru = lama x (1 + persen/100).
// Dari gaji baru: persen = (baru - lama) / lama x 100.
export function hitungKenaikanDariPersen(gajiLama, persen) {
  const lama = Number(gajiLama), p = Number(persen);
  if (![lama, p].every(isFinite) || lama <= 0 || p < -100) return null;
  const baru = lama * (1 + p / 100);
  if (!isFinite(baru)) return null;
  return { baru, selisih: baru - lama, persen: p };
}

export function hitungKenaikanDariBaru(gajiLama, gajiBaru) {
  const lama = Number(gajiLama), baru = Number(gajiBaru);
  if (![lama, baru].every(isFinite) || lama <= 0 || baru < 0) return null;
  const persen = ((baru - lama) / lama) * 100;
  if (!isFinite(persen)) return null;
  return { baru, selisih: baru - lama, persen };
}

const fmtPersen = (x) => (x > 0 ? '+' : '') + x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const lamaI = T.input('text', 'cth: 5000000', '');
  const modeI = T.select([['persen', 'Saya tahu persen kenaikannya'], ['baru', 'Saya tahu gaji barunya']], 'persen');
  const nilaiI = T.input('text', 'cth: 10', '');
  const box = T.out();

  const labelNilai = () => (modeI.value === 'persen' ? 'Persen kenaikan (%)' : 'Gaji baru (Rp)');
  const nilaiField = T.field(labelNilai(), nilaiI, 'Isi persen kenaikan atau gaji barunya.');
  modeI.addEventListener('change', () => {
    const lb = nilaiField.querySelector('label');
    if (lb) lb.textContent = labelNilai();
    nilaiI.placeholder = modeI.value === 'persen' ? 'cth: 10' : 'cth: 5500000';
    nilaiI.value = '';
  });

  const hitung = () => {
    const lama = T.num(lamaI.value);
    const nilai = T.num(nilaiI.value);
    if (!isFinite(lama) || lama <= 0) { T.show(box, '<div class="err">Gaji sekarang harus diisi angka lebih dari 0.</div>'); return; }
    let hasil;
    if (modeI.value === 'persen') {
      if (!isFinite(nilai) || nilai < -100) { T.show(box, '<div class="err">Persen kenaikan harus diisi angka, minimal -100.</div>'); return; }
      hasil = hitungKenaikanDariPersen(lama, nilai);
    } else {
      if (!isFinite(nilai) || nilai < 0) { T.show(box, '<div class="err">Gaji baru harus diisi angka 0 atau lebih.</div>'); return; }
      hasil = hitungKenaikanDariBaru(lama, nilai);
    }
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const naik = hasil.selisih > 0;
    T.show(box,
      '<div class="big center">' + T.rp(hasil.baru) + '</div>' +
      '<p class="center">gaji baru per bulan</p>' +
      kv('Kenaikan', fmtPersen(hasil.persen) + ' (' + (naik ? '+' : '') + T.rp(hasil.selisih) + ' per bulan)') +
      kv('Selisih setahun', (hasil.selisih > 0 ? '+' : '') + T.rp(hasil.selisih * 12)) +
      kv('Gaji sekarang', T.rp(lama)) +
      '<p class="' + (naik ? 'info' : hasil.selisih === 0 ? 'warn' : 'err') + '">' +
      (naik ? 'Gajimu naik ' + T.rp(hasil.selisih) + ' per bulan, atau ' + T.rp(hasil.selisih * 12) + ' dalam setahun.'
        : hasil.selisih === 0 ? 'Gajimu tidak berubah.'
        : 'Gajimu turun ' + T.rp(-hasil.selisih) + ' per bulan dibanding sekarang.') + '</p>');
  };

  root.appendChild(T.el('<p class="note">Hitung gaji barumu dari persen kenaikan, atau cari tahu persennya kalau kamu sudah tahu gaji barunya. Hasilnya gaji kotor sebelum potongan.</p>'));
  root.appendChild(T.field('Gaji sekarang per bulan (Rp)', lamaI, 'Gaji pokok yang kamu terima sekarang.'));
  root.appendChild(T.field('Yang kamu tahu', modeI, 'Pilih salah satu sesuai info yang kamu punya.'));
  root.appendChild(nilaiField);
  root.appendChild(T.row(T.btn('Hitung Kenaikan Gaji', hitung, true)));
  root.appendChild(box);
}
