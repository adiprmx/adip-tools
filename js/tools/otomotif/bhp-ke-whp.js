import { h as T, utils, kv } from '../../core.js';

// BHP ke WHP: tenaga di roda = tenaga mesin x (1 - rugi transmisi).
// Rugi transmisi adalah patokan umum bengkel: gerak roda depan sekitar
// 10%, gerak roda belakang sekitar 15%, semua roda sekitar 20%.
// Angka sebenarnya beda tiap mobil dan bisa diubah user.
export function hitungWHP(bhp, rugiPersen) {
  const b = Number(bhp);
  const r = Number(rugiPersen);
  if (![b, r].every(isFinite) || b <= 0 || r < 0 || r >= 100) return null;
  return { whp: b * (1 - r / 100), rugiHp: b * r / 100 };
}
export function hitungBHP(whp, rugiPersen) {
  const w = Number(whp);
  const r = Number(rugiPersen);
  if (![w, r].every(isFinite) || w <= 0 || r < 0 || r >= 100) return null;
  const bhp = w / (1 - r / 100);
  return { bhp, rugiHp: bhp - w };
}
utils.bhpWHP = hitungWHP;

export const meta = {"id": "bhp-ke-whp", "name": "BHP ke WHP", "cat": "otomotif", "icon": "🐎", "desc": "Berapa tenaga yang benar-benar sampai ke roda dari tenaga mesinnya.", "keywords": "bhp,whp,tenaga,mesin,roda,transmisi,drivetrain,hp,dyno,mobil", "since": "6.18.0"};
export function render(root) {
  const arahSel = T.select([
    ['ke-whp', 'BHP (mesin) ke WHP (roda)'],
    ['ke-bhp', 'WHP (roda) ke BHP (mesin)'],
  ], 'ke-whp');
  const tenagaI = T.input('text', 'cth: 150', ''); tenagaI.inputMode = 'decimal';
  const gerakSel = T.select([
    ['10', 'Gerak roda depan (FWD, rugi 10%)'],
    ['15', 'Gerak roda belakang (RWD, rugi 15%)'],
    ['20', 'Semua roda (AWD, rugi 20%)'],
    ['custom', 'Isi sendiri persen ruginya'],
  ], '15');
  const rugiI = T.input('text', 'cth: 15', '15'); rugiI.inputMode = 'decimal';
  const box = T.out();

  gerakSel.addEventListener('change', () => {
    if (gerakSel.value !== 'custom') rugiI.value = gerakSel.value;
    hitung();
  });

  const hitung = () => {
    const tenaga = T.num(tenagaI.value);
    const rugi = T.num(rugiI.value);
    if (!isFinite(tenaga) || tenaga <= 0) {
      T.show(box, '<div class="err">Tenaga harus diisi angka lebih dari 0 (dalam HP).</div>');
      return;
    }
    if (!isFinite(rugi) || rugi < 0 || rugi >= 100) {
      T.show(box, '<div class="err">Rugi transmisi harus angka antara 0 sampai di bawah 100%.</div>');
      return;
    }
    const fmtHp = (x) => x.toFixed(1).replace('.', ',') + ' HP';
    if (arahSel.value === 'ke-bhp') {
      const r = hitungBHP(tenaga, rugi);
      if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
      T.show(box,
        '<div class="big">' + fmtHp(r.bhp) + '</div>' +
        '<p class="center mut">Perkiraan tenaga di mesin (BHP).</p>' +
        kv('Tenaga di roda (WHP)', fmtHp(tenaga)) +
        kv('Rugi transmisi (' + String(rugi).replace('.', ',') + '%)', fmtHp(r.rugiHp)) +
        '<p class="hint">Rugi transmisi di atas adalah patokan umum bengkel. Angka sebenarnya beda tiap mobil, tergantung girboks, gardan, dan kondisi komponennya. Ukur di dyno untuk angka pastinya.</p>');
      return;
    }
    const r = hitungWHP(tenaga, rugi);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + fmtHp(r.whp) + '</div>' +
      '<p class="center mut">Perkiraan tenaga di roda (WHP).</p>' +
      kv('Tenaga mesin (BHP)', fmtHp(tenaga)) +
      kv('Rugi transmisi (' + String(rugi).replace('.', ',') + '%)', fmtHp(r.rugiHp)) +
      '<p class="hint">Tenaga di roda selalu lebih kecil dari tenaga mesin karena sebagian hilang di girboks, gardan, dan as roda. Rugi transmisi di atas adalah patokan umum bengkel, angka sebenarnya beda tiap mobil.</p>');
  };
  [arahSel].forEach((i) => i.addEventListener('change', hitung));
  [tenagaI, rugiI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">BHP itu tenaga di mesin, WHP itu tenaga yang benar-benar sampai ke roda. Selisihnya hilang di girboks dan gardan. Masukkan tenaga dan jenis penggeraknya.</p>'));
  root.appendChild(T.field('Arah hitung', arahSel));
  root.appendChild(T.field('Tenaga (HP)', tenagaI, 'BHP bila arahnya ke WHP, WHP bila arahnya ke BHP'));
  root.appendChild(T.field('Jenis penggerak', gerakSel));
  root.appendChild(T.field('Rugi transmisi (%)', rugiI, 'Terisi otomatis dari jenis penggerak, bisa diubah'));
  root.appendChild(box);
}
