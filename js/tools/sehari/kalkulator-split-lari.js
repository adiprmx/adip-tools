import { h as T, kv, utils } from '../../core.js';

// Split lari: waktu tiap kilometer untuk target waktu lomba.
// Strategi rata: semua km sama. Negatif: paruh kedua lebih cepat sekian
// persen. Positif: paruh kedua lebih lambat sekian persen (mulai kencang,
// akhir melambat). Jarak pecahan (21,1 dan 42,2 km) dapat baris terakhir
// sendiri sesuai sisa jaraknya.
export function fmtSplit(detik) {
  const total = Math.round(detik);
  const jam = Math.floor(total / 3600);
  const mnt = Math.floor((total % 3600) / 60);
  const dtk = total % 60;
  const mm = String(mnt).padStart(2, '0');
  const ss = String(dtk).padStart(2, '0');
  return jam > 0 ? jam + ':' + mm + ':' + ss : mnt + ':' + ss;
}

export function splitLari(jarakKm, totalDetik, strategi, persen) {
  const j = Number(jarakKm), t = Number(totalDetik), f = Math.min(50, Math.max(0, Number(persen) || 0)) / 100;
  if (!(j > 0) || !(t > 0)) return null;
  const penuh = Math.floor(j);
  const sisa = j - penuh;
  const segmen = [];
  for (let i = 0; i < penuh; i++) segmen.push(1);
  if (sisa > 0.001) segmen.push(sisa);
  const paruh = j / 2;
  let p1;
  if (strategi === 'negatif') {
    let d1 = 0, d2 = 0;
    segmen.forEach((s, i) => { const awal = segmen.slice(0, i).reduce((a, b) => a + b, 0); if (awal < paruh) d1 += s; else d2 += s; });
    p1 = t / (d1 + d2 * (1 - f));
  } else if (strategi === 'positif') {
    let d1 = 0, d2 = 0;
    segmen.forEach((s, i) => { const awal = segmen.slice(0, i).reduce((a, b) => a + b, 0); if (awal < paruh) d1 += s; else d2 += s; });
    p1 = t / (d1 + d2 * (1 + f));
  } else {
    p1 = t / j;
  }
  const splits = [];
  let kum = 0, jalan = 0;
  segmen.forEach((s, i) => {
    let pace = p1;
    if (strategi === 'negatif' && jalan >= paruh) pace = p1 * (1 - f);
    if (strategi === 'positif' && jalan >= paruh) pace = p1 * (1 + f);
    const split = pace * s;
    kum += split;
    splits.push({ km: i + 1, jarak: s, splitDetik: split, kumulatifDetik: kum });
    jalan += s;
  });
  return { paceRataDetik: t / j, splits, totalDetik: t };
}
utils.splitLari = splitLari;
utils.fmtSplit = fmtSplit;

export const meta = {"id": "kalkulator-split-lari", "name": "Kalkulator Split Lari", "cat": "sehari", "icon": "⏱️", "desc": "Waktu tiap kilometer untuk target waktu lombamu, dengan strategi rata, negatif, atau positif.", "keywords": "split lari,pace,km,lomba,marathon,half marathon,5k,10k,strategi lari", "since": "6.19.0"};
export function render(root) {
  const jarakSel = T.select([
    ['5', '5K (5 km)'], ['10', '10K (10 km)'], ['21.0975', 'Half marathon (21,1 km)'], ['42.195', 'Marathon (42,2 km)'], ['custom', 'Jarak lain'],
  ], '10');
  const jarakCustom = T.input('text', 'cth: 15', '15');
  jarakCustom.inputMode = 'decimal';
  const jam = T.input('text', 'cth: 0', '0');
  jam.inputMode = 'numeric';
  const menit = T.input('text', 'cth: 50', '50');
  menit.inputMode = 'numeric';
  const detik = T.input('text', 'cth: 0', '0');
  detik.inputMode = 'numeric';
  const strategi = T.select([
    ['rata', 'Rata: semua km sama cepat'],
    ['negatif', 'Negatif: paruh kedua lebih cepat'],
    ['positif', 'Positif: paruh kedua lebih lambat'],
  ], 'rata');
  const persen = T.input('text', 'cth: 5', '5');
  persen.inputMode = 'decimal';
  const box = T.out();

  const wrapCustom = T.el('<div></div>');
  wrapCustom.appendChild(T.field('Jarak (km)', jarakCustom));
  const wrapPersen = T.el('<div></div>');
  wrapPersen.appendChild(T.field('Selisih paruh kedua (%)', persen, 'Misal 5 artinya paruh kedua 5 persen lebih cepat atau lebih lambat.'));
  const aturTampil = () => {
    wrapCustom.hidden = jarakSel.value !== 'custom';
    wrapPersen.hidden = strategi.value === 'rata';
  };
  jarakSel.addEventListener('change', aturTampil);
  strategi.addEventListener('change', aturTampil);
  aturTampil();

  const hitung = () => {
    // Nilai select dikontrol program (bukan ketikan user), jadi pakai
    // Number(): T.num akan membaca "42.195" sebagai ribuan (42195).
    const j = jarakSel.value === 'custom' ? T.num(jarakCustom.value) : Number(jarakSel.value);
    const m = T.num(menit.value) || 0, s = T.num(detik.value) || 0, jj = T.num(jam.value) || 0;
    const total = jj * 3600 + m * 60 + s;
    if (!(j > 0)) { T.show(box, '<span class="err">Isi jarak dengan angka lebih dari 0.</span>'); return; }
    if (!(total > 0) || m >= 60 || s >= 60) { T.show(box, '<span class="err">Isi target waktu dengan benar. Menit dan detik masing-masing maksimal 59.</span>'); return; }
    const r = splitLari(j, total, strategi.value, T.num(persen.value));
    if (!r) { T.show(box, '<span class="err">Isi jarak dan target waktu dengan angka yang benar.</span>'); return; }
    let tabel = '<div class="dim" style="margin-top:12px">Split tiap kilometer</div>';
    r.splits.forEach((sp) => {
      const label = sp.jarak === 1 ? 'KM ' + sp.km : 'KM ' + sp.km + ' (' + utils.fmtDes(sp.jarak * 1000, 0) + ' m terakhir)';
      tabel += kv(label, fmtSplit(sp.splitDetik) + ' (total ' + fmtSplit(sp.kumulatifDetik) + ')');
    });
    T.show(box,
      '<div class="center"><div class="dim">Pace rata-rata yang dibutuhkan</div>' +
      '<div class="big">' + fmtSplit(r.paceRataDetik) + ' /km</div>' +
      '<div class="dim">Target ' + fmtSplit(total) + ' untuk ' + utils.fmtDes(j, 1) + ' km</div></div>' +
      tabel +
      '<p class="hint">Strategi negatif (mulai pelan, akhir kencang) biasanya paling aman untuk lomba pertama, karena tenaga masih tersisa di akhir. Strategi positif berisiko kehabisan tenaga di tengah jalan.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan jarak lomba dan target waktumu. Hasilnya waktu yang harus kamu tempuh di tiap kilometer supaya target tercapai.</p>'));
  root.appendChild(T.field('Jarak lomba', jarakSel));
  root.appendChild(wrapCustom);
  root.appendChild(T.grid2(
    T.field('Target: jam', jam),
    T.field('Target: menit', menit),
    T.field('Target: detik', detik),
  ));
  root.appendChild(T.field('Strategi', strategi));
  root.appendChild(wrapPersen);
  root.appendChild(T.btn('Hitung Split', hitung, true));
  root.appendChild(box);
  hitung();
}
