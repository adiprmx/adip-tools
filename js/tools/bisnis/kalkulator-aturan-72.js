import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-aturan-72", "name": "Kalkulator Aturan 72", "cat": "bisnis", "icon": "✖️", "desc": "Perkiraan cepat berapa tahun uang berlipat ganda dari suku bunganya.", "keywords": "aturan 72,rule of 72,uang berlipat,bunga majemuk,investasi", "since": "6.17.0"};

// Aturan 72: tahun berlipat ganda = 72 / bunga%.
// Sebaliknya: bunga yang dibutuhkan = 72 / tahun.
export function hitungAturan72(bungaPersen) {
  const r = Number(bungaPersen);
  if (!isFinite(r) || r <= 0) return null;
  const tahun = 72 / r;
  return isFinite(tahun) ? tahun : null;
}

export function bungaUntukLipatGanda(tahun) {
  const t = Number(tahun);
  if (!isFinite(t) || t <= 0) return null;
  const r = 72 / t;
  return isFinite(r) ? r : null;
}

export function render(root) {
  const modeI = T.select([['bunga', 'Saya tahu bunganya, mau tahu tahunnya'], ['tahun', 'Saya tahu tahunnya, mau tahu bunganya']], 'bunga');
  const nilaiI = T.input('text', 'cth: 8', '');
  const box = T.out();

  const labelNilai = () => (modeI.value === 'bunga' ? 'Bunga per tahun (%)' : 'Target tahun berlipat ganda');
  const nilaiField = T.field(labelNilai(), nilaiI, 'Isi bunga tahunan atau target tahunnya.');
  modeI.addEventListener('change', () => {
    const lb = nilaiField.querySelector('label');
    if (lb) lb.textContent = labelNilai();
    nilaiI.placeholder = modeI.value === 'bunga' ? 'cth: 8' : 'cth: 9';
    nilaiI.value = '';
  });

  const hitung = () => {
    const nilai = T.num(nilaiI.value);
    if (!isFinite(nilai) || nilai <= 0) { T.show(box, '<div class="err">Isi angka lebih dari 0.</div>'); return; }
    if (modeI.value === 'bunga') {
      if (nilai >= 1000) { T.show(box, '<div class="err">Bunga diisi di bawah 1000.</div>'); return; }
      const tahun = hitungAturan72(nilai);
      if (tahun === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
      T.show(box,
        '<div class="big center">' + String(tahun.toFixed(1)).replace('.', ',') + ' tahun</div>' +
        '<p class="center">sampai uangmu berlipat ganda</p>' +
        kv('Bunga per tahun', String(nilai).replace('.', ',') + '%') +
        kv('Rumus yang dipakai', '72 ÷ ' + String(nilai).replace('.', ',')) +
        '<p class="hint">Ini perkiraan cepat, bukan hitungan persis. Makin kecil bunganya, makin akurat hasilnya. Berlaku untuk bunga majemuk yang dibiarkan berbunga.</p>');
    } else {
      if (nilai > 1000) { T.show(box, '<div class="err">Target tahun diisi sampai 1000.</div>'); return; }
      const bunga = bungaUntukLipatGanda(nilai);
      if (bunga === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
      T.show(box,
        '<div class="big center">' + String(bunga.toFixed(2)).replace('.', ',') + '%</div>' +
        '<p class="center">bunga per tahun yang dibutuhkan</p>' +
        kv('Target berlipat ganda', String(nilai).replace('.', ',') + ' tahun') +
        kv('Rumus yang dipakai', '72 ÷ ' + String(nilai).replace('.', ',')) +
        '<p class="hint">Ini perkiraan cepat, bukan hitungan persis. Makin panjang target tahunnya, makin akurat hasilnya.</p>');
    }
  };

  root.appendChild(T.el('<p class="note">Aturan 72 itu jalan pintas: bagi 72 dengan bunga tahunan, hasilnya kira-kira berapa tahun uangmu berlipat ganda. Bisa dibalik untuk mencari bunga yang dibutuhkan.</p>'));
  root.appendChild(T.field('Yang kamu tahu', modeI, 'Pilih salah satu sesuai info yang kamu punya.'));
  root.appendChild(nilaiField);
  root.appendChild(T.row(T.btn('Hitung Aturan 72', hitung, true)));
  root.appendChild(box);
}
