import { h as T, kv, errBox, todayISO } from '../../core.js?v=6.12.0';

// Konversi Masehi ke penanggalan Jawa, sistem kurup Asapon (tahun Jawa
// 1867-1986, sekitar 1936-2053 M). Jangkar terverifikasi:
// 1 Suro 1959 Dal = Jumat Kliwon, 27 Juni 2025 (Kemenag + ki-demang).
// Diuji cocok dengan 27 Jun 2025, 1 Jan 2026 (12 Rejeb 1959, Kamis Pon,
// wuku Kuruwelut), dan 20 Jan 2026 (1 Ruwah 1959, Selasa Pahing).
const DAY = 86400000;
const ANCHOR = Date.UTC(2025, 5, 27); // 1 Suro 1959 Dal, Jumat Kliwon
const WARSA = ['Alip', 'Ehe', 'Jimawal', 'Je', 'Dal', 'Be', 'Wawu', 'Jimakir'];
const THN_LEN = [354, 355, 354, 354, 355, 354, 354, 355]; // Asapon: Ehe, Dal, Jimakir 355 hari
const BULAN = ['Suro', 'Sapar', 'Mulud', 'Bakda Mulud', 'Jumadilawal', 'Jumadilakir', 'Rejeb', 'Ruwah', 'Poso', 'Sawal', 'Sela', 'Besar'];
const BLN_LEN = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]; // Besar 30 di tahun kabisat
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
const WUKU = ['Sinta', 'Landep', 'Wukir', 'Kurantil', 'Tolu', 'Gumbreg', 'Warigalit', 'Warigagung', 'Julungwangi', 'Sungsang', 'Galungan', 'Kuningan', 'Langkir', 'Mandasiya', 'Julungpujut', 'Pahang', 'Kuruwelut', 'Marakeh', 'Tambir', 'Medangkungan', 'Maktal', 'Wuye', 'Manahil', 'Prangbakat', 'Bala', 'Wugu', 'Wayang', 'Kulawu', 'Dukut', 'Watugunung'];
const WINDU = ['Sancaya', 'Adi', 'Kuntara', 'Sengara'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NEPTU_HARI = [5, 4, 3, 7, 8, 6, 9];
const NEPTU_PASAR = [5, 9, 7, 4, 8];
const WUKU_ANCHOR = Date.UTC(1945, 7, 12); // Minggu, pekan pertama wuku Manahil (17 Agu 1945 = Jumat Legi, Manahil)

const warsaIdx = (y) => (((y - 1875) % 8) + 8) % 8;
const mod = (n, m) => (((n % m) + m) % m);

function konversi(ms) {
  let off = Math.round((ms - ANCHOR) / DAY);
  let tahun = 1959;
  if (off >= 0) {
    while (off >= THN_LEN[warsaIdx(tahun)]) { off -= THN_LEN[warsaIdx(tahun)]; tahun++; }
  } else {
    while (off < 0) { tahun--; off += THN_LEN[warsaIdx(tahun)]; }
  }
  const kabisat = THN_LEN[warsaIdx(tahun)] === 355;
  const blnLen = BLN_LEN.slice(); if (kabisat) blnLen[11] = 30;
  let bi = 0;
  while (off >= blnLen[bi]) { off -= blnLen[bi]; bi++; }
  const totalOff = Math.round((ms - ANCHOR) / DAY);
  const pasaran = PASARAN[mod(4 + totalOff, 5)]; // jangkar: Kliwon
  const wuku = WUKU[mod(22 + Math.floor(Math.round((ms - WUKU_ANCHOR) / DAY) / 7), 30)];
  const windu = WINDU[mod(Math.floor((tahun - 1) / 8), 4)];
  return { tgl: off + 1, bulan: BULAN[bi], tahun, warsa: WARSA[warsaIdx(tahun)], pasaran, wuku, windu, diLuarKurup: tahun < 1867 || tahun > 1986 };
}

export const meta = {"id": "kalender-jawa", "name": "Kalender Jawa", "cat": "indonesia", "icon": "🗓️", "desc": "Ubah tanggal Masehi ke penanggalan Jawa: tanggal Jawa, pasaran, weton, neptu, wuku, dan windu.", "keywords": "kalender,jawa,weton,pasaran,wuku,windu,neptu,legi,pahing,pon,wage,kliwon,suro,primbon", "since": "6.11.0"};
export function render(root) {
  const tglI = T.input('date', '', todayISO());
  const box = T.out();

  const lihat = () => {
    const p = String(tglI.value || '').split('-');
    if (p.length !== 3 || !p[0]) { T.show(box, errBox('Pilih tanggal dulu.')); return; }
    const ms = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    const d = new Date(ms);
    const j = konversi(ms);
    const wd = d.getUTCDay();
    const neptu = NEPTU_HARI[wd] + NEPTU_PASAR[PASARAN.indexOf(j.pasaran)];
    const masehi = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    T.show(box,
      '<p class="center hint">' + T.esc(masehi) + '</p>' +
      '<div class="big center">' + T.esc(HARI[wd]) + ' ' + T.esc(j.pasaran) + '</div>' +
      '<p class="center"><b>' + j.tgl + ' ' + T.esc(j.bulan) + ' ' + j.tahun + ' ' + T.esc(j.warsa) + '</b></p>' +
      kv('Weton', T.esc(HARI[wd]) + ' ' + T.esc(j.pasaran)) +
      kv('Neptu', String(neptu) + ' (' + HARI[wd] + ' ' + NEPTU_HARI[wd] + ' + ' + j.pasaran + ' ' + NEPTU_PASAR[PASARAN.indexOf(j.pasaran)] + ')') +
      kv('Wuku', T.esc(j.wuku)) +
      kv('Windu', T.esc(j.windu)) +
      kv('Tahun Jawa', j.tahun + ' ' + T.esc(j.warsa) + (THN_LEN[warsaIdx(j.tahun)] === 355 ? ' · tahun panjang (355 hari)' : ' · tahun pendek (354 hari)')) +
      (j.diLuarKurup
        ? '<p class="warn">Tanggal ini di luar kurup Asapon (tahun Jawa 1867-1986). Hasil dihitung dengan pola yang sama, tapi bisa berbeda dengan penanggalan resmi untuk tahun tersebut.</p>'
        : '') +
      '<p class="hint">Hari Jawa dimulai sejak matahari terbenam. Jadi kalau sudah lewat magrib, tanggal Jawanya sudah masuk hari berikutnya. Weton dan neptu adalah tradisi budaya Jawa, bukan ramalan nasib.</p>');
  };

  tglI.addEventListener('change', lihat);
  root.appendChild(T.el('<p class="note">Cari tahu tanggal Jawa, weton, dan wukumu dari tanggal lahir atau tanggal apa pun.</p>'));
  root.appendChild(T.grid2(T.field('Tanggal Masehi', tglI)));
  root.appendChild(T.row(T.btn('Lihat tanggal Jawa', lihat, true)));
  root.appendChild(box);
  lihat();
}
