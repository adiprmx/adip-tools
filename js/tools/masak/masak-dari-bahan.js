import { h as T } from '../../core.js';

// 12 resep rumahan Indonesia, masing-masing dari sumber terverifikasi
// (dicantumkan per resep). Waktu bertanda ± adalah perkiraan.
// Sumber 1-4: dataset unitools-recipes-v1 (CC BY-SA 4.0), diterjemahkan.
// Sumber 5-12: situs resep Indonesia, diverifikasi 18 Nov 2026.
const RESEP = [
  { nama: 'Nasi Goreng', porsi: '4 porsi', waktu: '20 menit', tingkat: 'Mudah',
    sumber: 'unitools-recipes-v1 (CC BY-SA 4.0)',
    utama: ['nasi', 'ayam', 'udang', 'telur', 'bawang merah', 'bawang putih', 'cabai', 'kecap manis'],
    bahan: ['Nasi matang dingin 600 g', 'Dada ayam potong dadu 250 g', 'Udang 150 g', 'Bawang merah 4', 'Bawang putih 4 siung', 'Cabai merah 3', 'Terasi 1 sdt', 'Kecap manis 3 sdm', 'Telur 4', 'Kol iris 150 g', 'Mentimun + bawang goreng (pelengkap)', 'Minyak 4 sdm'],
    langkah: ['Haluskan bawang merah, bawang putih, cabai, dan terasi.', 'Tumis bumbu 2 menit.', 'Masukkan ayam 3 menit, lalu udang dan kol 2 menit.', 'Masukkan nasi dingin dan kecap, goreng api besar 3 menit sambil diaduk.', 'Telur diceplok terpisah.', 'Sajikan dengan mentimun dan bawang goreng.'] },
  { nama: 'Rendang', porsi: '6 porsi', waktu: '4,5 jam', tingkat: 'Sulit',
    sumber: 'unitools-recipes-v1 (CC BY-SA 4.0)',
    utama: ['daging sapi', 'santan', 'bawang merah', 'bawang putih', 'cabai', 'lengkuas', 'serai'],
    bahan: ['Daging sengkel potong besar 1,2 kg', 'Santan 1,2 L', 'Bawang merah 8', 'Bawang putih 6 siung', 'Cabai kering 10', 'Lengkuas 40 g', 'Jahe 30 g', 'Kunyit segar 20 g', 'Serai 3', 'Daun jeruk 6', 'Kelapa sangrai (kerisik) 60 g', 'Garam secukupnya'],
    langkah: ['Rendam cabai kering air panas 15 menit, blender dengan bawang, lengkuas, jahe, dan kunyit.', 'Sangrai kelapa sampai cokelat tua, tumbuk jadi kerisik.', 'Tumis bumbu 5 menit, masukkan daging, santan, serai, dan daun jeruk, lalu didihkan.', 'Masak terbuka 2,5 jam, aduk tiap 20 menit.', 'Masukkan kerisik, masak 1 jam lagi sampai santan pecah dan minyak keluar.', 'Selesai saat daging cokelat tua dan hampir kering.'] },
  { nama: 'Sate Ayam', porsi: '5 porsi', waktu: '65 menit (+ marinasi min. 2 jam)', tingkat: 'Mudah',
    sumber: 'unitools-recipes-v1 (CC BY-SA 4.0)',
    utama: ['ayam', 'kacang tanah', 'kecap manis', 'bawang merah', 'bawang putih', 'ketumbar'],
    bahan: ['Paha ayam tanpa tulang 900 g', 'Kecap manis 100 ml', 'Kacang tanah sangrai 250 g', 'Bawang merah 5', 'Bawang putih 6 siung', 'Cabai 3', 'Ketumbar bubuk 2 sdt', 'Kunyit 1 sdt', 'Pasta asam jawa 2 sdm', 'Gula aren 2 sdm', 'Jeruk nipis 2', 'Minyak 60 ml', 'Nasi 400 g (pelengkap)', 'Garam secukupnya'],
    langkah: ['Potong ayam 2 cm, lumuri kecap, bawang putih, ketumbar, dan kunyit.', 'Marinasi minimal 2 jam (semalaman lebih baik).', 'Giling kacang kasar.', 'Tumis bawang merah, bawang putih, dan cabai, masukkan kacang 3 menit.', 'Tambah 1 gelas air, asam, gula aren, dan kecap, masak 10 menit sampai kental.', 'Tusuk 5-6 potong per tusuk.', 'Bakar 2 menit tiap sisi, olesi kecap.'] },
  { nama: 'Soto Ayam', porsi: '5 porsi', waktu: '95 menit', tingkat: 'Sedang',
    sumber: 'unitools-recipes-v1 (CC BY-SA 4.0)',
    utama: ['ayam', 'bawang merah', 'bawang putih', 'kunyit', 'serai', 'soun', 'telur', 'tauge'],
    bahan: ['Ayam utuh 1,4 kg', 'Bawang merah 8', 'Bawang putih 6 siung', 'Kunyit segar 30 g', 'Jahe 30 g', 'Kemiri 4', 'Serai 3', 'Daun jeruk 6', 'Soun 150 g', 'Telur rebus 5', 'Tauge 200 g', 'Kol 200 g', 'Jeruk nipis 3', 'Minyak 100 ml', 'Garam secukupnya'],
    langkah: ['Rebus ayam dalam 2 L air 40 menit, buang buih 10 menit pertama.', 'Iris separuh bawang merah, goreng kering.', 'Haluskan sisa bawang merah, bawang putih, kunyit, jahe, dan kemiri.', 'Tumis bumbu 5 menit dengan serai dan daun jeruk.', 'Masukkan ke kaldu, masak 20 menit.', 'Angkat ayam, suwir.', 'Rendam soun, rebus sebentar tauge dan kol.', 'Sajikan dengan telur belah dua dan bawang goreng.'] },
  { nama: 'Telur Balado', porsi: '4 porsi', waktu: '35 menit', tingkat: 'Mudah',
    sumber: 'kridafarm.com',
    utama: ['telur', 'cabai', 'bawang merah', 'bawang putih', 'tomat'],
    bahan: ['Telur ayam 8 butir', 'Cabai merah keriting 10 buah', 'Cabai rawit 5 buah (opsional)', 'Bawang merah 8 siung', 'Bawang putih 3 siung', 'Tomat 1 buah', 'Gula merah sisir 1 sdm', 'Air asam jawa 1 sdm', 'Garam secukupnya', 'Minyak secukupnya'],
    langkah: ['Rebus telur dalam air mendidih 10 menit, angkat, rendam air dingin, lalu kupas.', 'Goreng telur rebus sebentar sampai permukaannya berkulit kecokelatan, tiriskan.', 'Haluskan cabai, bawang merah, bawang putih, dan tomat.', 'Tumis bumbu halus dengan sedikit minyak sampai harum dan matang, sekitar 8-10 menit.', 'Tambahkan gula merah, garam, dan air asam jawa; aduk dan koreksi rasa.', 'Masukkan telur, aduk hingga rata terbalut sambal, masak 2 menit, sajikan.'] },
  { nama: 'Tempe Goreng', porsi: '2-3 porsi', waktu: '±20 menit', tingkat: 'Mudah',
    sumber: 'brainly.co.id',
    utama: ['tempe', 'bawang putih', 'ketumbar', 'kunyit'],
    bahan: ['Tempe 1 papan, potong dadu', 'Garam 1/2 sdt', 'Ketumbar bubuk 1/4 sdt', 'Kunyit bubuk 1/4 sdt', 'Merica bubuk 1/4 sdt', 'Minyak goreng secukupnya'],
    langkah: ['Potong tempe menjadi dadu berukuran sedang.', 'Campur garam, ketumbar bubuk, kunyit bubuk, dan merica bubuk.', 'Lumuri potongan tempe dengan campuran bumbu hingga merata.', 'Panaskan minyak goreng dalam wajan. Goreng tempe hingga berwarna keemasan dan renyah, api sedang agar matang merata.', 'Angkat dan tiriskan.', 'Sajikan hangat sebagai camilan atau lauk.'] },
  { nama: 'Tumis Kangkung Terasi', porsi: '2-3 porsi', waktu: '±15 menit', tingkat: 'Mudah',
    sumber: 'kuliner.indostri.com',
    utama: ['kangkung', 'bawang putih', 'cabai', 'terasi', 'kecap manis'],
    bahan: ['Kangkung 1 ikat', 'Bawang putih 3 siung, cincang halus', 'Cabai merah 2 buah, iris tipis', 'Terasi 1 sdm', 'Gula pasir 1 sdt', 'Kecap manis 1 sdm', 'Garam 1 sdt', 'Minyak secukupnya untuk menumis'],
    langkah: ['Bersihkan kangkung. Potong bagian batangnya dan pisahkan daunnya.', 'Panaskan minyak dalam wajan dengan api sedang. Tumis bawang putih dan cabai merah hingga harum.', 'Masukkan terasi, aduk rata dengan bawang putih dan cabai merah.', 'Tambahkan gula pasir, kecap manis, dan garam. Aduk rata.', 'Masukkan kangkung, aduk rata dengan bumbu.', 'Masak hingga kangkung layu dan matang, tetapi masih renyah. Sajikan dengan nasi hangat.'] },
  { nama: 'Sayur Asem Jawa', porsi: '4 porsi', waktu: '±45 menit', tingkat: 'Mudah',
    sumber: 'briliofood.net',
    utama: ['jagung', 'labu siam', 'kacang panjang', 'melinjo', 'bawang merah', 'asam jawa'],
    bahan: ['Sayur asem 1 bungkus (labu siam, kacang panjang, jagung, melinjo), siangi', 'Air 1,5 liter', 'Daun salam', 'Lengkuas', 'Air asam jawa secukupnya', 'Garam secukupnya', 'Gula secukupnya', 'Bumbu halus: bawang merah 5 siung, cabai keriting 8, kemiri 4, terasi 1/2 sdt'],
    langkah: ['Didihkan air, masukkan bumbu halus, lengkuas, dan daun salam, masak sampai tercium bau wangi.', 'Masukkan sayur yang keras dahulu, rebus sampai kira-kira empuk.', 'Masukkan sayur lainnya dengan air asam jawa, gula, dan garam.', 'Cicipi sampai rasa pas.', 'Jagung manis dimasukkan menjelang selesai.', 'Angkat dan sajikan.'] },
  { nama: 'Capcay', porsi: '3-4 porsi', waktu: '±20 menit', tingkat: 'Mudah',
    sumber: 'Cookpad (Pawon Lina)',
    utama: ['sawi', 'wortel', 'kembang kol', 'jagung muda', 'bakso', 'sosis', 'telur puyuh', 'saus tiram'],
    bahan: ['Sawi putih 5 lembar', 'Caisim 3 lembar', 'Wortel 2 batang', 'Jagung putren 3 buah', 'Kembang kol 1 bonggol', 'Telur puyuh rebus 5 buah', 'Sosis 2 buah', 'Bakso sapi 5 buah', 'Saus tiram, saus tomat, kecap asin, kecap manis secukupnya', 'Air secukupnya', 'Gula, garam, merica, kaldu jamur secukupnya', 'Bumbu tumis: bawang putih 2 siung geprek, bawang bombay 1/2 siung'],
    langkah: ['Tumis bawang putih dan bawang bombay sampai wangi, masukkan sosis, bakso, dan telur puyuh. Tambahkan gula, garam, merica, dan kaldu. Aduk rata.', 'Masukkan sayuran. Tambahkan air secukupnya lalu masukkan saus tiram, saus tomat, kecap asin, dan kecap manis. Aduk kembali. Ungkep sebentar agar sayur matang merata.', 'Koreksi rasa. Sajikan.'] },
  { nama: 'Ayam Goreng Bumbu Kuning', porsi: '4-6 porsi', waktu: '±60 menit', tingkat: 'Sedang',
    sumber: 'bukupraktis.com',
    utama: ['ayam', 'bawang merah', 'bawang putih', 'kunyit', 'kemiri', 'ketumbar', 'serai'],
    bahan: ['Ayam 1 ekor (sekitar 1 kg), potong 8-10 bagian', 'Air 600 ml', 'Serai 2 batang, memarkan', 'Daun salam 3 lembar', 'Daun jeruk dan lengkuas secukupnya', 'Garam dan gula secukupnya', 'Minyak untuk menggoreng', 'Bumbu halus: bawang merah 8 siung, bawang putih 5 siung, kunyit 3 cm (bakar sebentar), jahe 2 cm, kemiri 3 butir (sangrai), ketumbar 1 sdt'],
    langkah: ['Bersihkan ayam, lumuri sedikit garam dan air jeruk nipis. Diamkan 10 menit, lalu bilas.', 'Haluskan bumbu dengan ulekan atau blender. Kalau memakai blender, tambahkan sedikit minyak, bukan air.', 'Tumis bumbu halus dengan sedikit minyak bersama serai, daun salam, daun jeruk, dan lengkuas sampai harum dan matang, sekitar 5 menit.', 'Masukkan ayam, aduk sampai seluruh permukaan terbalut bumbu dan berubah warna.', 'Tuang air, tambahkan garam dan gula. Masak api kecil sampai sedang, panci setengah tertutup.', 'Ungkep sampai air menyusut, sekitar 30-40 menit. Balik ayam sesekali agar bumbu merata.', 'Goreng dalam minyak panas api sedang sampai kuning keemasan, sekitar 3-5 menit per sisi.'] },
  { nama: 'Mie Goreng Jawa', porsi: '2-3 porsi', waktu: '±30 menit', tingkat: 'Mudah',
    sumber: 'indokuliner.id',
    utama: ['mie telur', 'ayam', 'telur', 'kol', 'sawi', 'kecap manis', 'bawang merah', 'bawang putih'],
    bahan: ['Mie telur kuning 250 g', 'Ayam suwir 100 g', 'Telur 2 butir', 'Kol 5 lembar, iris tipis', 'Daun bawang 1 batang', 'Sawi hijau 1 genggam', 'Kecap manis 2 sdm', 'Kecap asin 1 sdt', 'Garam dan merica secukupnya', 'Bumbu halus: bawang putih 4 siung, bawang merah 5 butir, kemiri sangrai 3 butir, terasi matang 1/2 sdt, garam secukupnya'],
    langkah: ['Rebus mie telur sampai setengah matang, tiriskan.', 'Tumis bumbu halus hingga harum.', 'Masukkan ayam suwir, aduk rata.', 'Geser bumbu ke sisi wajan dan masukkan telur. Orak-arik telur hingga matang.', 'Tambahkan kol, sawi, dan daun bawang.', 'Masukkan mie yang telah direbus.', 'Tuangkan kecap manis, kecap asin, garam, dan merica.', 'Aduk hingga semua bumbu meresap sempurna. Masak 3-5 menit lalu sajikan hangat.'] },
  { nama: 'Sop Ayam Bening', porsi: '4 porsi', waktu: '±45 menit', tingkat: 'Mudah',
    sumber: 'halodoc.com',
    utama: ['ayam', 'wortel', 'kentang', 'kol', 'buncis', 'bawang putih', 'bawang merah'],
    bahan: ['Ayam tanpa kulit 300 g', 'Wortel 2 buah', 'Kentang 2 buah', 'Kol 100 g', 'Buncis 100 g', 'Daun bawang 1 batang', 'Seledri 1 batang', 'Bawang putih 3 siung', 'Bawang merah 4 siung', 'Merica dan garam secukupnya'],
    langkah: ['Rebus ayam hingga matang, buang buih yang muncul di permukaan kaldu agar kuah tetap bening.', 'Masukkan bumbu, lalu kentang dan wortel.', 'Masukkan buncis dan kol, masak sampai sayur empuk.', 'Tambahkan daun bawang dan seledri sebelum api dimatikan.', 'Koreksi rasa, sajikan hangat.'] },
];

export const meta = {"id": "masak-dari-bahan", "name": "Masak dari Bahan", "cat": "masak", "icon": "🍳", "desc": "Pilih bahan yang ada di dapurmu, lihat resep apa saja yang bisa dimasak.", "keywords": "masak,resep,bahan,dapur,indonesia,rumahan", "since": "6.16.0"};
export function render(root) {
  const semuaBahan = [...new Set(RESEP.flatMap((r) => r.utama))].sort();
  const punya = new Set();
  const daftar = T.el('<div></div>');
  const detail = T.el('<div></div>');

  const tampilDetail = (r) => {
    detail.innerHTML =
      '<div class="sechead" style="margin-top:20px"><h2>' + T.esc(r.nama) + '</h2><span class="n">' + T.esc(r.porsi) + ' · ' + T.esc(r.waktu) + ' · ' + T.esc(r.tingkat) + '</span></div>' +
      '<p style="font-weight:600;margin:10px 0 4px">Bahan</p>' +
      '<ul style="margin:0 0 12px;padding-left:20px;line-height:1.7">' + r.bahan.map((b) => '<li>' + T.esc(b) + '</li>').join('') + '</ul>' +
      '<p style="font-weight:600;margin:10px 0 4px">Cara membuat</p>' +
      '<ol style="margin:0;padding-left:20px;line-height:1.7">' + r.langkah.map((l) => '<li>' + T.esc(l) + '</li>').join('') + '</ol>' +
      '<p class="hint">Sumber resep: ' + T.esc(r.sumber) + '. Waktu bertanda ± adalah perkiraan.</p>';
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tampilDaftar = () => {
    const hasil = RESEP.map((r) => {
      const cocok = r.utama.filter((b) => punya.has(b));
      const kurang = r.utama.filter((b) => !punya.has(b));
      return { r, cocok, kurang };
    });
    if (punya.size > 0) hasil.sort((a, b) => b.cocok.length - a.cocok.length || a.kurang.length - b.kurang.length);
    const tampil = punya.size > 0 ? hasil.filter((h) => h.cocok.length > 0) : hasil;
    daftar.innerHTML = '';
    if (!tampil.length) {
      daftar.appendChild(T.el('<p class="note">Belum ada resep yang cocok dengan bahan itu. Coba tambah bahan lain.</p>'));
      return;
    }
    tampil.forEach(({ r, cocok, kurang }) => {
      const kartu = T.el('<div style="padding:12px;margin:10px 0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px"></div>');
      kartu.innerHTML = '<p style="margin:0 0 4px"><b style="font-size:16px">' + T.esc(r.nama) + '</b> <span class="mut">· ' + T.esc(r.porsi) + ' · ' + T.esc(r.waktu) + ' · ' + T.esc(r.tingkat) + '</span></p>' +
        (punya.size > 0
          ? '<p class="mut" style="margin:0 0 8px">Kamu punya ' + cocok.length + ' dari ' + r.utama.length + ' bahan utama' + (kurang.length ? ' · kurang: ' + kurang.map(T.esc).join(', ') : ' · semua bahan utama ada!') + '</p>'
          : '<p class="mut" style="margin:0 0 8px">Bahan utama: ' + r.utama.map(T.esc).join(', ') + '</p>');
      kartu.appendChild(T.btn('Lihat resep', () => tampilDetail(r)));
      daftar.appendChild(kartu);
    });
  };

  const chips = T.el('<div class="row" style="flex-wrap:wrap;gap:6px;margin:12px 0"></div>');
  semuaBahan.forEach((b) => {
    const c = T.btn(b, () => {
      if (punya.has(b)) { punya.delete(b); c.style.background = ''; c.style.color = ''; }
      else { punya.add(b); c.style.background = '#ff6f61'; c.style.color = '#161311'; }
      tampilDaftar();
    });
    chips.appendChild(c);
  });

  root.appendChild(T.el('<p class="note">' + RESEP.length + ' resep rumahan Indonesia. Ketuk bahan yang ada di dapurmu di bawah, dan resep yang bisa dimasak akan muncul diurutkan dari yang paling cocok. Sumber tiap resep dicantumkan di halaman resepnya.</p>'));
  root.appendChild(T.el('<p style="font-weight:600;margin:8px 0 0">Bahan yang kamu punya:</p>'));
  root.appendChild(chips);
  root.appendChild(daftar);
  root.appendChild(detail);
  tampilDaftar();
}
