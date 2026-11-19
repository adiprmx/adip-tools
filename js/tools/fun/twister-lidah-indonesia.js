import { h as T, onLeave } from '../../core.js';

export const meta = {"id": "twister-lidah-indonesia", "name": "Twister Lidah Indonesia", "cat": "fun", "icon": "👅", "desc": "30 kalimat pelafalan yang bikin lidah kusut. Ucapkan 3 kali cepat tanpa salah, lalu catat waktumu.", "keywords": "twister lidah,tongue twister,latihan bicara,pelafalan,lidah,permainan kata", "since": "6.19.0"};

// Bank 30 twister lidah Indonesia, ditulis sendiri untuk tool ini.
// Tingkat: pendek (sampai 6 kata), sedang (7 sampai 9 kata),
// panjang (10 kata ke atas).
export const TWISTER = [
  { t: 'Kucing kuning kecilku, kucing kuningku kecil.', tingkat: 'pendek' },
  { t: 'Kuku kaki kakak kakakku kaku, kaku kuku kaki kakak kakakku.', tingkat: 'panjang' },
  { t: 'Ular melingkar di atas pagar, pagar melingkar di atas ular.', tingkat: 'panjang' },
  { t: 'Satu satu, saya sayang satu satu.', tingkat: 'pendek' },
  { t: 'Sayur sawi saya, sawi sayur saya.', tingkat: 'pendek' },
  { t: 'Bibir bibi berbiru, biru bibir bibi.', tingkat: 'pendek' },
  { t: 'Sari suka soto sapi, soto sapi suka Sari.', tingkat: 'sedang' },
  { t: 'Kera kera ke kiri, kiri kera kera.', tingkat: 'sedang' },
  { t: 'Lala lari lari lila, lila lari lari Lala.', tingkat: 'sedang' },
  { t: 'Rara rajin merapikan rambut Rara tiap pagi, rambut Rara rapi tiap pagi.', tingkat: 'panjang' },
  { t: 'Siti suka sosis sapi, sosis sapi suka Siti.', tingkat: 'sedang' },
  { t: 'Dedi duduk di dekat dadu di depan Dodo, dadu dekat Dedi duduk di depan Dodo.', tingkat: 'panjang' },
  { t: 'Bola bolu, bolu bola, bola bolu bolu bola.', tingkat: 'sedang' },
  { t: 'Tiga tikus tikus tiga, tikus tiga tiga tikus.', tingkat: 'sedang' },
  { t: 'Cici cuci cucu Cici, cucu Cici cuci Cici.', tingkat: 'sedang' },
  { t: 'Nana nanam nanas, nanas Nana nanam.', tingkat: 'pendek' },
  { t: 'Mama masak mi, mi masak Mama.', tingkat: 'pendek' },
  { t: 'Gigi gajah gugur, gugur gigi gajah.', tingkat: 'pendek' },
  { t: 'Kaki kakek kekar, kekar kaki kakek.', tingkat: 'pendek' },
  { t: 'Bebek bebek berenang, berenang bebek bebek.', tingkat: 'pendek' },
  { t: 'Susu Susi susu, susu Susi susu Susi.', tingkat: 'sedang' },
  { t: 'Roti Rani rontok, rontok roti Rani.', tingkat: 'pendek' },
  { t: 'Pipi Pipit pipih, pipih pipi Pipit.', tingkat: 'pendek' },
  { t: 'Tata tatap Tata, Tata tatap Tata.', tingkat: 'pendek' },
  { t: 'Wawa wangi, wangi Wawa wangi.', tingkat: 'pendek' },
  { t: 'Jaja jajan jajanan, jajanan Jaja jajan.', tingkat: 'pendek' },
  { t: 'Kopi Koko kental, kental kopi Koko.', tingkat: 'pendek' },
  { t: 'Papa pegang pipa, pipa pegang Papa.', tingkat: 'pendek' },
  { t: 'Sasa susun susu, susu susun Sasa.', tingkat: 'pendek' },
  { t: 'Budi bawa baju biru, baju biru bawa Budi.', tingkat: 'sedang' },
];

export function filterTingkat(tingkat) {
  if (tingkat === 'semua') return TWISTER;
  return TWISTER.filter((x) => x.tingkat === tingkat);
}

export function twisterAcak(tingkat, rand) {
  const daftar = filterTingkat(tingkat || 'semua');
  if (!daftar.length) return null;
  const r = rand || Math.random;
  return daftar[Math.floor(r() * daftar.length)];
}

export function hitungKata(teks) {
  return String(teks || '').trim().split(/\s+/).filter(Boolean).length;
}

export function render(root) {
  const tingkatSel = T.select([['semua', 'Semua tingkat'], ['pendek', 'Pendek'], ['sedang', 'Sedang'], ['panjang', 'Panjang']], 'semua');
  const box = T.out();
  const waktuBox = T.out();
  let saatIni = twisterAcak('semua');
  let mulaiMs = null;
  let timerId = null;

  const tampilkan = () => {
    if (mulaiMs !== null) { mulaiMs = null; if (timerId) clearInterval(timerId); timerId = null; }
    T.show(box, '<p style="font-size:20px;line-height:1.6;margin:14px 0;text-align:center">' + T.esc(saatIni.t) + '</p>' +
      '<p class="center hint">Tingkat ' + saatIni.tingkat + ' · ' + hitungKata(saatIni.t) + ' kata. Ucapkan 3 kali tanpa salah.</p>');
    T.show(waktuBox, '');
  };

  const acakBtn = T.btn('Twister berikutnya', () => {
    const daftar = filterTingkat(tingkatSel.value);
    let baru = saatIni;
    for (let i = 0; i < 5 && baru === saatIni && daftar.length > 1; i++) {
      baru = daftar[Math.floor(Math.random() * daftar.length)];
    }
    saatIni = baru;
    tampilkan();
  }, true);
  const timerBtn = T.btn('Mulai hitung waktu', () => {
    if (mulaiMs === null) {
      mulaiMs = performance.now();
      timerBtn.textContent = 'Selesai! Berhenti';
      T.show(waktuBox, '<p class="center hint">Waktu berjalan. Ucapkan kalimat di atas 3 kali secepat mungkin tanpa salah, lalu tekan "Selesai".</p>');
      timerId = setInterval(() => {
        const dtk = (performance.now() - mulaiMs) / 1000;
        T.show(waktuBox, '<p class="big center">' + dtk.toFixed(1).replace('.', ',') + ' detik</p><p class="center hint">Ucapkan 3 kali, lalu tekan "Selesai".</p>');
      }, 100);
    } else {
      const dtk = (performance.now() - mulaiMs) / 1000;
      mulaiMs = null;
      clearInterval(timerId); timerId = null;
      timerBtn.textContent = 'Mulai hitung waktu';
      const perKali = dtk / 3;
      T.show(waktuBox, '<p class="big center">' + dtk.toFixed(1).replace('.', ',') + ' detik</p>' +
        '<p class="center hint">3 kali ucap, rata-rata ' + perKali.toFixed(1).replace('.', ',') + ' detik per kali. ' +
        (dtk <= 10 ? 'Cepat sekali.' : dtk <= 20 ? 'Lumayan cepat.' : 'Pelan-pelan saja, yang penting tidak salah.') + '</p>');
    }
  });
  tingkatSel.addEventListener('change', () => {
    saatIni = twisterAcak(tingkatSel.value);
    tampilkan();
  });
  onLeave(() => { if (timerId) clearInterval(timerId); });

  root.appendChild(T.el('<p class="hint">Bank berisi 30 kalimat pelafalan. Pilih tingkatnya, ucapkan kalimatnya 3 kali tanpa salah, dan ukur waktumu kalau mau tantangan.</p>'));
  root.appendChild(T.field('Tingkat kesulitan', tingkatSel));
  root.appendChild(box);
  root.appendChild(T.row(acakBtn, timerBtn));
  root.appendChild(waktuBox);
  tampilkan();
}
