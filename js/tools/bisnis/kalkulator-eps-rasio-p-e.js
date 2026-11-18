import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-eps-rasio-p-e", "name": "Kalkulator EPS & Rasio P/E", "cat": "bisnis", "icon": "📉", "desc": "Laba per saham dan rasio harga terhadap laba untuk menilai saham.", "keywords": "eps,pe ratio,laba per saham,rasio harga laba,saham,valuasi", "since": "6.17.0"};

// EPS = laba bersih / jumlah saham beredar.
// P/E = harga saham / EPS. Tidak berlaku bila EPS nol atau negatif.
export function hitungEpsPe(labaBersih, sahamBeredar, hargaSaham) {
  const laba = Number(labaBersih), saham = Number(sahamBeredar), harga = Number(hargaSaham);
  if (![laba, saham, harga].every(isFinite) || saham <= 0 || harga < 0) return null;
  const eps = laba / saham;
  const pe = eps > 0 ? harga / eps : null;
  if (!isFinite(eps) || (pe != null && !isFinite(pe))) return null;
  return { eps, pe };
}

const fmt2 = (x) => x.toFixed(2).replace('.', ',');

export function render(root) {
  const labaI = T.input('text', 'cth: 10000000000', '');
  const sahamI = T.input('text', 'cth: 1000000000', '');
  const hargaI = T.input('text', 'cth: 2500', '');
  const box = T.out();

  const hitung = () => {
    const laba = T.num(labaI.value);
    const saham = T.num(sahamI.value);
    const harga = T.num(hargaI.value);
    if (!isFinite(laba)) { T.show(box, '<div class="err">Laba bersih harus diisi angka. Boleh negatif kalau perusahaan rugi.</div>'); return; }
    if (!isFinite(saham) || saham <= 0) { T.show(box, '<div class="err">Jumlah saham beredar harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(harga) || harga < 0) { T.show(box, '<div class="err">Harga saham harus diisi angka 0 atau lebih.</div>'); return; }
    const hasil = hitungEpsPe(laba, saham, harga);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const peTeks = hasil.pe == null
      ? 'tidak berlaku (laba per saham nol atau negatif)'
      : fmt2(hasil.pe) + 'x';
    T.show(box,
      '<div class="big center">' + T.rp(hasil.eps) + '</div>' +
      '<p class="center">laba per satu lembar saham (EPS)</p>' +
      kv('Rasio P/E', peTeks) +
      kv('Harga saham', T.rp(harga)) +
      kv('Laba bersih setahun', T.rp(laba)) +
      kv('Saham beredar', T.fmt(saham) + ' lembar') +
      (hasil.pe == null ? '<p class="warn">Perusahaan sedang rugi, jadi rasio P/E tidak bisa dipakai untuk menilai saham ini.</p>' :
        '<p class="hint">P/E ' + fmt2(hasil.pe) + 'x artinya kamu membayar ' + fmt2(hasil.pe) + ' kali laba tahunannya untuk satu lembar saham. Bandingkan dengan saham sejenis, jangan dipakai sendirian.</p>'));
  };

  root.appendChild(T.el('<p class="note">EPS itu laba perusahaan dibagi jumlah sahamnya: berapa laba yang jadi jatah satu lembar saham. P/E membandingkan harga saham dengan laba itu.</p>'));
  root.appendChild(T.field('Laba bersih setahun (Rp)', labaI, 'Laba bersih perusahaan dalam satu tahun. Boleh negatif kalau rugi.'));
  root.appendChild(T.field('Jumlah saham beredar (lembar)', sahamI, 'Total saham perusahaan yang beredar di pasar.'));
  root.appendChild(T.field('Harga satu lembar saham (Rp)', hargaI, 'Harga pasar saham saat ini.'));
  root.appendChild(T.row(T.btn('Hitung EPS & P/E', hitung, true)));
  root.appendChild(box);
}
