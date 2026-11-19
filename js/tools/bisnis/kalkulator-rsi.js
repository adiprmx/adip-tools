import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-rsi", "name": "Kalkulator RSI", "cat": "bisnis", "icon": "📈", "desc": "Relative Strength Index saham atau kripto dari daftar harga penutupan, dengan metode Wilder.", "keywords": "rsi,relative strength index,saham,kripto,trading,overbought,oversold,analisis teknikal,wilder", "since": "6.19.0"};

/* RSI Wilder: rata-rata kenaikan dan penurunan awal = rata-rata biasa atas
   `periode` perubahan pertama, lalu dihaluskan (smoothing):
   rataBaru = (rataLama x (periode-1) + nilaiBaru) / periode.
   RSI = 100 - 100 / (1 + rataNaik / rataTurun); bila rataTurun = 0, RSI = 100.
   Mengembalikan daftar RSI (satu nilai per harga mulai harga ke-periode+1),
   atau null bila data kurang. */
export function hitungRsi(harga, periode) {
  const p = Math.floor(Number(periode));
  if (!Array.isArray(harga) || !isFinite(p) || p < 2) return null;
  const data = harga.map(Number);
  if (data.length < p + 1 || !data.every(isFinite)) return null;
  const naik = [], turun = [];
  for (let i = 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    naik.push(d > 0 ? d : 0);
    turun.push(d < 0 ? -d : 0);
  }
  let rataNaik = naik.slice(0, p).reduce((a, b) => a + b, 0) / p;
  let rataTurun = turun.slice(0, p).reduce((a, b) => a + b, 0) / p;
  const rsi = (rn, rt) => (rt === 0 ? 100 : 100 - 100 / (1 + rn / rt));
  const hasil = [rsi(rataNaik, rataTurun)];
  for (let i = p; i < naik.length; i++) {
    rataNaik = (rataNaik * (p - 1) + naik[i]) / p;
    rataTurun = (rataTurun * (p - 1) + turun[i]) / p;
    hasil.push(rsi(rataNaik, rataTurun));
  }
  return hasil;
}
utils.rsi = hitungRsi;

const fmtD = (x, d) => {
  const t = Number(x.toFixed(d == null ? 2 : d));
  const v = t === 0 ? 0 : t;
  return v.toFixed(d == null ? 2 : d).replace('.', ',');
};

export function render(root) {
  const hargaI = T.ta(5, 'Satu harga per baris, urut dari yang terlama:\n44,34\n44,09\n44,15\n43,61\n44,33');
  const periodeI = T.input('text', 'cth: 14', '14');
  const box = T.out();

  const hitung = () => {
    // Parser seperti arus kas NPV/IRR: koma desimal Indonesia ("44,34")
    // tidak pernah jadi pemisah; koma daftar ("44.34, 44.09" atau "44, 45")
    // tetap dipisah. Pemisah lain: baris baru, titik-koma, tab, spasi.
    const token = [];
    const baris = String(hargaI.value).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const b of baris) {
      for (const pot of b.split(/[\t;]+|,(?=\s|\d[\d.]*\.)/)) {
        for (const sub of pot.split(/\s+/)) {
          const t = sub.trim();
          if (t) token.push(t);
        }
      }
    }
    const harga = [];
    for (const t of token) {
      const v = T.num(t);
      if (!isFinite(v)) { T.show(box, '<div class="err">"' + T.esc(t.slice(0, 20)) + '" bukan angka. Perbaiki dulu daftar harganya.</div>'); return; }
      harga.push(v);
    }
    const periode = T.num(periodeI.value);
    if (!isFinite(periode) || periode < 2 || Math.floor(periode) !== periode) { T.show(box, '<div class="err">Isi periode dengan bilangan bulat 2 atau lebih (umumnya 14).</div>'); return; }
    if (harga.length < periode + 1) { T.show(box, '<div class="err">Butuh minimal ' + (periode + 1) + ' harga untuk periode ' + periode + '. Saat ini baru ' + harga.length + ' harga.</div>'); return; }
    if (harga.length > 500) { T.show(box, '<div class="err">Maksimal 500 harga ya.</div>'); return; }
    const rsi = hitungRsi(harga, periode);
    if (rsi === null) { T.show(box, '<div class="err">RSI tidak bisa dihitung dari data ini.</div>'); return; }
    const terakhir = rsi[rsi.length - 1];
    const vonis = terakhir >= 70
      ? 'RSI di atas 70: harga naik kencang dan sering disebut jenuh beli. Bukan berarti pasti turun, tapi hati-hati bila mau beli di sini.'
      : terakhir <= 30
        ? 'RSI di bawah 30: harga turun kencang dan sering disebut jenuh jual. Bukan berarti pasti naik, tapi banyak trader mulai memperhatikan.'
        : 'RSI di zona tengah (30 sampai 70): tidak ada sinyal jenuh beli atau jenuh jual.';
    let riwayat = '';
    const awal = Math.max(0, rsi.length - 10);
    for (let i = awal; i < rsi.length; i++) {
      riwayat += '<tr><td>Harga ke-' + (i + periode + 1) + '</td><td style="text-align:right">' + fmtD(rsi[i]) + '</td></tr>';
    }
    T.show(box,
      '<div class="big center">' + fmtD(terakhir) + '</div>' +
      '<p class="center">RSI(' + periode + ') terakhir, skala 0 sampai 100</p>' +
      kv('Harga dihitung', harga.length + ' harga penutupan') +
      kv('RSI pertama', fmtD(rsi[0])) +
      kv('RSI tertinggi', fmtD(Math.max.apply(null, rsi))) +
      kv('RSI terendah', fmtD(Math.min.apply(null, rsi))) +
      '<table class="tbl" style="margin-top:10px"><thead><tr><th>Posisi</th><th style="text-align:right">RSI</th></tr></thead><tbody>' + riwayat + '</tbody></table>' +
      '<p class="' + (terakhir >= 70 || terakhir <= 30 ? 'warn' : 'info') + '">' + vonis + '</p>' +
      '<p class="hint">RSI memakai metode Wilder: rata-rata kenaikan dan penurunan dihaluskan supaya nilai terakhir lebih berpengaruh dari nilai lama. RSI di atas 70 atau di bawah 30 hanya penanda momentum, bukan perintah beli atau jual.</p>');
  };

  root.appendChild(T.el('<p class="note">RSI mengukur seberapa kencang harga naik atau turun belakangan ini, dalam skala 0 sampai 100. Tempel daftar harga penutupan saham atau kripto, urut dari yang terlama.</p>'));
  root.appendChild(T.field('Harga penutupan', hargaI, 'Satu harga per baris, urut dari yang terlama. Bisa juga dipisah koma atau spasi.'));
  root.appendChild(T.field('Periode', periodeI, 'Berapa perubahan harga yang dirata-rata. Standarnya 14.'));
  root.appendChild(T.row(T.btn('Hitung RSI', hitung, true)));
  root.appendChild(box);
}
