import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "kalkulator-inflasi", "name": "Kalkulator Inflasi Rupiah", "cat": "bisnis", "icon": "💸", "desc": "Nilai rupiah dulu vs sekarang dari data inflasi BPS 2010–2025, plus proyeksi daya beli ke depan.", "keywords": "inflasi,bps,nilai rupiah,daya beli,harga dulu,harga sekarang,ihk", "since": "6.13.0"};

// ---------------------------------------------------------------------------
// TABEL INFLASI TAHUNAN BPS — inflasi year-on-year (y-on-y) bulan Desember,
// dalam persen. Angka diambil dari Berita Resmi Statistik (BRS) BPS dan
// publikasi yang mengutip BPS; diverifikasi 16 Nov 2026 (lihat laporan ronde
// v6.13.0 P1 untuk daftar sumber per tahun).
//
//   2013: BRS No. 01/01/Th. XVII (2 Jan 2014) = 8,38%
//   2018-2020: BRS No. 01/01/Th. XXIV (4 Jan 2021) = 3,13 / 2,72 / 1,68%
//   2022-2024: BRS No. 01/01/Th. XXVIII (2 Jan 2025) = 5,51 / 2,61 / 1,57%
//   2025: BRS No. 01/01/Th. XXIX (5 Jan 2026) = 2,92%
//   2010-2018: lampiran data BPS (UNHAS) + Rakornas Pengendalian Inflasi 2017
//     (TPIN/Kemenko Perekonomian, "Sumber: BPS diolah"); 2016-2024 juga
//     dikonfirmasi tabel Bank Indonesia (2025). Catatan: TPIN menulis 2012
//     sebagai 4,28%, dua sumber lain 4,30% — dipakai 4,30%.
//   PERHATIAN: inflationtool.com menulis 2013 = 7,72% dan 2020 = 1,59% —
//     keduanya SALAH menurut BRS BPS (8,38% dan 1,68%). Jangan salin mentah.
//
// UTANG PEMELIHARAAN: tambah satu baris tiap Januari setelah BPS merilis BRS
// inflasi Desember tahun sebelumnya (biasanya awal Januari).
// ---------------------------------------------------------------------------
const INFLASI_BPS = {
  2010: 6.96, 2011: 3.79, 2012: 4.30, 2013: 8.38, 2014: 8.36,
  2015: 3.35, 2016: 3.02, 2017: 3.61, 2018: 3.13, 2019: 2.72,
  2020: 1.68, 2021: 1.87, 2022: 5.51, 2023: 2.61, 2024: 1.57, 2025: 2.92,
};
const TAHUN_AWAL = 2010;
const TAHUN_AKHIR = 2025;

// Faktor pengali harga dari akhir tahun `dari` ke akhir tahun `sampai`.
// Cth: faktor(2010, 2012) = 1,0379 x 1,0430 (inflasi 2011 dan 2012).
function faktorInflasi(dari, sampai) {
  if (dari === sampai) return 1;
  let f = 1;
  for (let y = dari + 1; y <= sampai; y++) {
    if (!(y in INFLASI_BPS)) return NaN;
    f *= 1 + INFLASI_BPS[y] / 100;
  }
  return f;
}

utils.inflasiFaktor = faktorInflasi;
utils.inflasiTabelBPS = INFLASI_BPS;

const TAHUN_LIST = [];
for (let y = TAHUN_AWAL; y <= TAHUN_AKHIR; y++) TAHUN_LIST.push([String(y), String(y)]);

function fmtPersen(x) {
  return (Math.round(x * 100) / 100).toString().replace('.', ',') + '%';
}

export function render(root) {
  const modeI = T.select([
    ['dulu', 'Nilai uang dulu → sekarang'],
    ['depan', 'Proyeksi daya beli ke depan'],
  ], 'dulu');
  const jumlahI = T.input('text', 'cth: 100000', '100000');
  jumlahI.inputMode = 'decimal';
  const dariI = T.select(TAHUN_LIST, '2010');
  const sampaiI = T.select(TAHUN_LIST, '2025');
  const tahunDepanI = T.input('text', 'cth: 10', '10');
  tahunDepanI.inputMode = 'decimal';
  const asumsiI = T.input('text', 'cth: 2,5', '2,5');
  asumsiI.inputMode = 'decimal';
  const box = T.out();

  const barisDulu = T.el('<div></div>');
  barisDulu.appendChild(T.grid2(
    T.field('Dari tahun', dariI),
    T.field('Sampai tahun', sampaiI)
  ));
  const barisDepan = T.el('<div></div>');
  barisDepan.appendChild(T.grid2(
    T.field('Berapa tahun ke depan', tahunDepanI, 'Maksimal 30 tahun.'),
    T.field('Asumsi inflasi per tahun (%)', asumsiI, 'Target Bank Indonesia 2,5% ± 1% (2024–2027).')
  ));

  const aturMode = () => {
    const depan = modeI.value === 'depan';
    barisDulu.hidden = depan;
    barisDepan.hidden = !depan;
  };

  const hitung = () => {
    const jumlah = T.num(jumlahI.value);
    if (!isFinite(jumlah) || jumlah <= 0) {
      T.toast('Isi dulu jumlah uangnya dengan angka lebih dari 0.'); return;
    }
    if (modeI.value === 'dulu') {
      const dari = Number(dariI.value);
      const sampai = Number(sampaiI.value);
      if (sampai < dari) {
        T.toast('Tahun "sampai" harus sama atau sesudah tahun "dari".'); return;
      }
      const f = faktorInflasi(dari, sampai);
      if (!isFinite(f)) {
        T.toast('Data inflasi untuk rentang tahun itu belum lengkap.'); return;
      }
      const hasil = jumlah * f;
      // Guard hasil: jumlah raksasa meluber ke Infinity (RT2-08: "Rp∞").
      if (!isFinite(hasil)) {
        T.toast('Jumlahnya terlalu besar untuk dihitung — coba pakai jumlah yang lebih kecil.'); return;
      }
      const naik = (f - 1) * 100;
      let rincian = '';
      if (sampai > dari) {
        const parts = [];
        for (let y = dari + 1; y <= sampai; y++) parts.push(y + ': ' + fmtPersen(INFLASI_BPS[y]));
        rincian = '<p class="hint">Inflasi BPS yang dipakai: ' + parts.join(' · ') + '.</p>';
      }
      T.show(box,
        '<div class="center"><div class="dim">Rp' + T.fmt(Math.round(jumlah)) + ' tahun ' + dari + ' setara dengan</div>' +
        '<div class="big">' + T.rp(hasil) + '</div>' +
        '<div class="dim">pada tahun ' + sampai + '</div></div>' +
        kv('Kenaikan harga kumulatif', fmtPersen(naik)) +
        kv('Artinya', 'barang yang harganya ' + T.rp(jumlah) + ' pada ' + dari + ', harganya sekitar ' + T.rp(hasil) + ' pada ' + sampai + '.') +
        rincian);
    } else {
      const n = T.num(tahunDepanI.value);
      const asumsi = T.num(asumsiI.value);
      if (!isFinite(n) || n <= 0 || n > 30 || Math.floor(n) !== n) {
        T.toast('Isi "berapa tahun ke depan" dengan angka bulat 1 sampai 30.'); return;
      }
      if (!isFinite(asumsi) || asumsi < 0 || asumsi > 50) {
        T.toast('Isi asumsi inflasi dengan angka 0 sampai 50 persen.'); return;
      }
      const f = Math.pow(1 + asumsi / 100, n);
      const hasil = jumlah * f;
      if (!isFinite(hasil)) {
        T.toast('Jumlahnya terlalu besar untuk dihitung — coba pakai jumlah yang lebih kecil.'); return;
      }
      T.show(box,
        '<div class="center"><div class="dim">Supaya bisa beli barang yang sama ' + n + ' tahun lagi, ' + T.rp(jumlah) + ' harus jadi</div>' +
        '<div class="big">' + T.rp(hasil) + '</div></div>' +
        kv('Daya beli uangmu sekarang', 'uang ' + T.rp(jumlah) + ' yang disimpan tanpa hasil apa pun hanya akan bernilai setara ' + T.rp(jumlah / f) + ' dalam harga hari ini.') +
        kv('Asumsi yang dipakai', 'inflasi ' + fmtPersen(asumsi) + ' per tahun selama ' + n + ' tahun. Ini proyeksi, bukan ramalan — inflasi asli bisa beda.') +
        '<p class="hint">Patokan: Bank Indonesia menargetkan inflasi 2,5% ± 1% untuk 2024–2027.</p>');
    }
  };

  root.appendChild(T.el('<p class="note">Rupiah Rp100 ribu tahun 2010 tidak sama nilainya dengan Rp100 ribu sekarang. Kalkulator ini memakai data inflasi tahunan BPS (2010–2025) untuk membandingkan nilai uang antar tahun, dan bisa memproyeksikan daya beli ke depan.</p>'));
  root.appendChild(T.field('Mau hitung apa', modeI));
  root.appendChild(T.field('Jumlah uang (Rp)', jumlahI));
  root.appendChild(barisDulu);
  root.appendChild(barisDepan);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
  const det = document.createElement('details');
  det.style.marginTop = '14px';
  const sum = document.createElement('summary');
  sum.textContent = 'Lihat tabel inflasi BPS 2010–2025';
  det.appendChild(sum);
  const tbl = document.createElement('div');
  let tHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">';
  const thn = Object.keys(INFLASI_BPS).map(Number).sort((a, b) => b - a);
  thn.forEach((y) => {
    tHtml += '<tr><td style="padding:5px 6px;border-bottom:1px solid var(--line-soft)">' + y + '</td>' +
      '<td style="text-align:right;padding:5px 6px;border-bottom:1px solid var(--line-soft)">' + fmtPersen(INFLASI_BPS[y]) + '</td></tr>';
  });
  tHtml += '</table><p class="hint">Sumber: Berita Resmi Statistik BPS (inflasi y-on-y Desember). Tabel ini perlu ditambah tiap Januari setelah BPS merilis angka tahun sebelumnya.</p>';
  tbl.innerHTML = tHtml;
  det.appendChild(tbl);
  root.appendChild(det);
  modeI.addEventListener('change', aturMode);
  aturMode();
}
