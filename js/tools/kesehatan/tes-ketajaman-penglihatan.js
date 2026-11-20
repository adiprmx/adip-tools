import { h as T, esc, utils } from '../../core.js';

// Tes ketajaman penglihatan ala Snellen dengan huruf E berputar
// (tumbling E): pengguna menebak arah kaki huruf E yang makin kecil.
// Tinggi huruf untuk baris 20/X pada jarak d dihitung dari sudut pandang
// 5 menit busur: h = d x tan(5') x (X/20). Pada jarak 2 meter dengan
// satuan CSS px (1 mm = 96/25,4 px), rumusnya menjadi px = 0,5497 x X.
// Baris yang diuji: 20/200 sampai 20/20. Tiap baris 3 soal, lolos bila
// 2 atau 3 jawaban benar. Ini SKRINING KASAR, bukan pemeriksaan mata.
// KOREKSI CAP-HEIGHT: ukuranHurufPx() menghasilkan TINGGI HURUF nominal,
// tapi CSS font-size bukan tinggi huruf — tinggi huruf kapital "E" Arial
// hanya ~71,6% dari font-size. Jadi font-size yang dipakai =
// tinggi nominal / 0,716 (fontSizeHurufPx), kalau tidak huruf tampil ~28%
// lebih kecil dari ukuran Snellen nominal dan tes jadi lebih sulit dari
// yang diklaim.
const TAN_5_MENIT = 0.0014544;
const CAP_HEIGHT_ARIAL = 0.716;

export function ukuranHurufPx(penyebut, jarakMeter) {
  const d = (jarakMeter || 2) * 1000;
  const hMm = d * TAN_5_MENIT * (penyebut / 20);
  return Math.round(hMm * (96 / 25.4));
}

// font-size CSS yang membuat tinggi huruf "E" Arial sama dengan tinggi
// nominal Snellen (ukuranHurufPx dibagi cap-height Arial).
export function fontSizeHurufPx(penyebut, jarakMeter) {
  return Math.round(ukuranHurufPx(penyebut, jarakMeter) / CAP_HEIGHT_ARIAL);
}

export function lolosLevel(benar, total) {
  return benar >= 2 && total >= 3;
}
utils.ukuranHurufPx = ukuranHurufPx;
utils.fontSizeHurufPx = fontSizeHurufPx;
utils.lolosLevel = lolosLevel;

const BARIS = [200, 100, 70, 50, 40, 30, 25, 20];
const ARAH = ['atas', 'bawah', 'kiri', 'kanan'];
const ROTASI = { kanan: 0, bawah: 90, kiri: 180, atas: 270 };

export const meta = {"id": "tes-ketajaman-penglihatan", "name": "Tes Ketajaman Penglihatan", "cat": "kesehatan", "icon": "👁️", "desc": "Skrining kasar ketajaman mata dengan huruf E berputar ala Snellen, dari jarak 2 meter. Bukan pengganti pemeriksaan mata.", "keywords": "tes mata,ketajaman penglihatan,snellen,tumbling e,tes penglihatan,mata rabun,visus", "since": "6.19.0"};
export function render(root) {
  const panggung = T.el('<div class="center" style="min-height:150px;display:flex;align-items:center;justify-content:center"></div>');
  const info = T.out();
  const hasil = T.out();
  const arahBtns = {};
  let jalan = false;
  let levelIdx = 0;
  let soalKe = 0;
  let benar = 0;
  let terbaik = null;
  let arahSekarang = 'kanan';

  const acakArah = () => ARAH[Math.floor(Math.random() * ARAH.length)];

  const tampilE = () => {
    arahSekarang = acakArah();
    const px = fontSizeHurufPx(BARIS[levelIdx], 2);
    panggung.innerHTML = '<div data-arah="' + arahSekarang + '" aria-label="Huruf E menghadap ' + arahSekarang + '" style="font-family:Arial,Helvetica,sans-serif;font-weight:900;line-height:1;font-size:' + px + 'px;transform:rotate(' + ROTASI[arahSekarang] + 'deg)">E</div>';
    T.show(info, '<p class="center">Baris <b>20/' + BARIS[levelIdx] + '</b>, soal ' + (soalKe + 1) + ' dari 3. Ke arah mana kaki huruf E membuka?</p>');
  };

  const selesai = () => {
    jalan = false;
    Object.values(arahBtns).forEach((b) => { b.disabled = true; });
    panggung.innerHTML = '';
    if (terbaik == null) {
      T.show(hasil,
        '<div class="center"><div class="dim">Hasil skrining</div>' +
        '<div class="big">Di bawah 20/200</div>' +
        '<div class="err"><b>Huruf terbesar pun sulit dibaca.</b></div></div>' +
        '<p class="hint">Bila kamu tidak bisa membaca baris 20/200 dari jarak 2 meter, sebaiknya periksa ke dokter mata atau optik. ' +
        'Pastikan dulu jarakmu benar 2 meter, layar terang, dan mata yang tidak dites tertutup rapat.</p>');
    } else {
      const bagus = terbaik <= 30;
      T.show(hasil,
        '<div class="center"><div class="dim">Hasil skrining</div>' +
        '<div class="big">20/' + terbaik + '</div>' +
        '<div class="' + (bagus ? 'ok' : 'warn') + '"><b>' + (bagus ? 'Ketajamanmu masih dalam rentang yang wajar untuk skrining ini.' : 'Di bawah 20/30, pertimbangkan periksa ke dokter mata atau optik.') + '</b></div></div>' +
        '<p class="hint">' + (terbaik === 20
          ? 'Artinya: ketajamanmu setara mata normal pada skrining ini. '
          : 'Artinya: huruf yang kamu baca dari jarak 2 meter ini bisa dibaca mata normal dari jarak ' + utils.fmtDes(terbaik / 20, 1) + ' kali lebih jauh. ') +
        'Ini skrining kasar di layar HP, bukan pemeriksaan mata. Ukuran huruf dihitung untuk layar biasa dan jarak 2 meter, jadi hasilnya perkiraan. ' +
        'Tes tiap mata bergantian (tutup satu mata), dan periksa ke dokter mata bila ada keluhan: buram, silau, sering sakit kepala, atau sulit membaca.</p>');
    }
    T.show(info, '<p class="center">Tes selesai. Tekan "Mulai tes" untuk mengulang, misalnya untuk mata satunya.</p>');
  };

  const jawab = (arah) => {
    if (!jalan) return;
    if (arah === arahSekarang) benar += 1;
    soalKe += 1;
    if (soalKe < 3) {
      tampilE();
      return;
    }
    if (lolosLevel(benar, soalKe)) {
      terbaik = BARIS[levelIdx];
      levelIdx += 1;
      if (levelIdx >= BARIS.length) {
        selesai();
        return;
      }
      soalKe = 0;
      benar = 0;
      tampilE();
    } else {
      selesai();
    }
  };

  const mulai = () => {
    jalan = true;
    levelIdx = 0;
    soalKe = 0;
    benar = 0;
    terbaik = null;
    T.hide(hasil);
    Object.values(arahBtns).forEach((b) => { b.disabled = false; });
    tampilE();
  };

  root.appendChild(T.el('<p class="note">Skrining kasar, BUKAN pengganti pemeriksaan mata. Sandarkan HP, berdiri <b>2 meter</b> dari layar, tutup satu mata, lalu tebak arah kaki huruf E. Tes tiap mata bergantian.</p>'));
  root.appendChild(panggung);
  root.appendChild(info);
  T.show(info, '<p class="center">Tekan "Mulai tes", lalu jawab dengan tombol arah di bawah. Tiap baris ada 3 soal, lolos bila 2 jawaban benar.</p>');
  const grid = T.grid2(
    T.btn('Atas', () => jawab('atas')),
    T.btn('Bawah', () => jawab('bawah')),
    T.btn('Kiri', () => jawab('kiri')),
    T.btn('Kanan', () => jawab('kanan')),
  );
  const btns = grid.querySelectorAll('button');
  arahBtns.atas = btns[0];
  arahBtns.bawah = btns[1];
  arahBtns.kiri = btns[2];
  arahBtns.kanan = btns[3];
  Object.values(arahBtns).forEach((b) => { b.disabled = true; });
  root.appendChild(grid);
  root.appendChild(T.row(T.btn('Mulai tes', mulai, true)));
  root.appendChild(hasil);
}
