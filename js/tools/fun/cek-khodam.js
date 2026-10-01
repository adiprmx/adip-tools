import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"cek-khodam","name":"Cek Khodam","cat":"fun","icon":"👻","desc":"Cek khodam penjagamu (hiburan!).","keywords":"khodam,ramalan,fun,lucu,hiburan"};

const KHODAM = [
  ['Tuyul Magang', 'Masih magang, nyolong receh aja sering ketahuan.'],
  ['Kuntilanak Shift Malam', 'Jaga malam tiap hari, ketawanya bikin tetangga lapor RT.'],
  ['Pocong Parkir Liar', 'Ahli melompat menghindari razia, parkir di mana aja.'],
  ['Genderuwo Ngonten', 'Sibuk bikin konten horor, followernya 2 juta.'],
  ['Wewe Gombel Baby Sitter', 'Spesialis jagain anak rewel, tarifnya per jam.'],
  ['Jenglot Crypto', 'Portofolionya minus 90%, tapi tetap optimis.'],
  ['Banaspati Ojek Online', 'Rating 4.9, antar-jemputnya secepat kilat. Beneran kilat.'],
  ['Leak Barista', 'Racikan kopinya juara, tapi bayarnya pakai darah.'],
  ['Macan Putih Sekuriti', 'Jaga komplek 24 jam, tidak pernah tidur.'],
  ['Khodam Wifi Tetangga', 'Bikin sinyal tetangga lemot setiap kamu butuh.'],
  ['Tuyul Nyolong Sinyal', 'Spesialis curi sinyal 5G pas kamu lagi push rank.'],
  ['Pocong Lompat Indah', 'Skor 9.8 dari juri, sayang olahraganya belum diakui.'],
  ['Kuntilanak Ketawa Sendiri', 'Nonton meme terus, ketawa sampai jam 3 pagi.'],
  ['Genderuwo Bau Ketek', 'Aromanya khas, tercium radius 500 meter.'],
  ['Jenglot Kolektor NFT', 'Koleksinya 300 gambar monyet, nilainya nol.'],
  ['Suster Ngesot Ojol', 'Ngesotnya lebih cepat dari motor, hemat bensin.'],
  ['Babi Ngepet Freelance', 'Kerja remote, gajinya dibayar pakai koin kuno.'],
  ['Siluman Ular Sawah', 'Ahli nangkep belut, tapi alergi lumpur.'],
  ['Khodam Air Galon', 'Selalu ingatkan kamu minum air putih.'],
  ['Tuyul Parkir Motor', 'Jagain motormu, tarifnya seikhlasnya.'],
  ['Pocong Jaga Portal', 'Portal komplek aman, maling auto kabur.'],
  ['Kuntilanak Doyan Kopi', 'Ngopi tiap malam, tidurnya siang.'],
  ['Genderuwo Tukang Odading', 'Odadingnya viral, antreannya sampai kampung sebelah.'],
  ['Wewe Gombel TikTok', 'Jogetnya fyp terus, padahal kakinya cuma satu.'],
  ['Banaspati Tukang Parkir', 'Mundur-maju jago, tapi mobilnya gaib.'],
  ['Leak Tukang Las', 'Percikan apinya asli, bukan efek CGI.'],
  ['Siluman Kera Gamer', 'Rank Mythic, mainnya sambil makan pisang.'],
  ['Khodam Charger Rusak', 'HP dicas semalaman tetap 1%.'],
  ['Tuyul Jualan Seblak', 'Seblak level 10, pembelinya setan semua.'],
  ['Pocong Marawis', 'Rebananya kencang, vokalnya merdu.'],
  ['Kuntilanak Stand Up Comedy', 'Bitnya garing, penontonnya ketakutan.'],
  ['Genderuwo Tukang Ojek', 'Ngetem di kuburan, penumpangnya hantu semua.'],
  ['Wewe Gombel Ibu PKK', 'Rajin arisan, gosipnya update tiap malam Jumat.'],
  ['Jenglot Joki Skripsi', 'Skripsimu dijamin lulus, tapi sidangnya gaib.'],
  ['Banaspati Tukang Sate', 'Satenya 100 tusuk, bakarnya pakai api abadi.'],
  ['Leak DJ Koplo', 'Tiap manggung, penontonnya kesurupan massal.'],
  ['Siluman Harimau Satpam', 'Patroli tiap malam, maling auto tobat.'],
  ['Khodam Listrik Token', 'Tokenmu awet, tapi lampunya kedip-kedip.'],
  ['Tuyul Tukang Sablon', 'Sablon kaos satuan bisa, desainnya mistis.'],
  ['Pocong Jaga Warkop', 'Indomie-nya enak, yang masak gaib.'],
  ['Kuntilanak K-Popers', 'Hafal semua koreografi, lightstick-nya nyala sendiri.'],
  ['Genderuwo Ngabuburit', 'Ngabuburitnya di kuburan, buka puasanya gaib.'],
  ['Wewe Gombel Arisan', 'Kocokannya selalu menang, pesertanya curiga.'],
  ['Jenglot Ngevape', 'Asepnya ngebul, rasanya misteri.'],
  ['Banaspati Tukang Bakso', 'Baksonya kenyal, kuahnya mendidih sendiri.'],
  ['Leak Tukang Bangunan', 'Ngedak rumah sehari jadi, tukangnya hilang.'],
  ['Siluman Ular Kobra', 'Bisanya mematikan, tapi dia vegetarian.'],
  ['Macan Putih Jaga Villa', 'Villa aman, tamunya yang kabur.'],
  ['Khodam AC Bocor', 'Ruanganmu dingin, tagihan listrik aman.'],
  ['Tuyul Cuci Motor', 'Motor kinclong, helmnya ikut hilang.'],
  ['Pocong Kurir Paket', 'Paket selalu sampai, kurirnya tak terlihat.'],
  ['Kuntilanak Live Shopee', 'Check out sekarang, promonya cuma malam Jumat!'],
  ['Genderuwo Satpam Bank', 'Brankas aman, tapi dia yang ambil.'],
  ['Wewe Gombel Guru Les', 'Les privat matematika, muridnya auto pintar.'],
];

const DISCLAIMER = '⚠️ <b>Ini cuma hiburan ya!</b> Khodam di sini murni hasil acak buat lucu-lucuan — jangan dibawa serius, apalagi dijadikan pedoman hidup. 👻';

export function render(root) {
  const namaInp = T.input('text', 'Tulis namamu', '');
  const hasil = T.out();
  let teksTerakhir = '';

  const cek = () => {
    const nama = namaInp.value.trim();
    if (!nama) { T.show(hasil, '<span class="err">Isi namamu dulu dong.</span>'); return; }
    const [khodam, deskripsi] = KHODAM[Math.floor(Math.random() * KHODAM.length)];
    const aura = 1 + Math.floor(Math.random() * 99);
    teksTerakhir = 'Hasil Cek Khodam 👻\nNama: ' + nama + '\nKhodam: ' + khodam + '\n' + deskripsi + '\nTingkat kesaktian: ' + aura + '%\n\n(cuma hiburan, jangan dibawa serius!)';
    T.show(hasil,
      '<div class="center">' +
      '<div class="dim">Khodam penjaga <b>' + T.esc(nama) + '</b> adalah…</div>' +
      '<div style="font-size:34px;margin:10px 0">👻</div>' +
      '<div class="big" style="font-size:24px">' + T.esc(khodam) + '</div>' +
      '<p class="info">' + T.esc(deskripsi) + '</p>' +
      '<div class="kv"><span class="k">Tingkat kesaktian</span><span class="v">' + aura + '%</span></div>' +
      '</div>');
    const wrap = T.el('<div class="row center" style="margin-top:10px"></div>');
    wrap.appendChild(T.btn('🔄 Cek ulang', cek));
    wrap.appendChild(T.copyBtn(() => teksTerakhir, '📋 Salin hasil'));
    hasil.appendChild(wrap);
  };

  root.appendChild(T.el('<p class="hint" style="border:1px solid #fbbf2433;background:#fbbf2411;border-radius:10px;padding:10px">' + DISCLAIMER + '</p>'));
  root.appendChild(T.field('Namamu', namaInp));
  root.appendChild(T.row(T.btn('🔮 Cek khodamku', cek, true)));
  root.appendChild(hasil);
  root.appendChild(T.el('<p class="hint center" style="margin-top:14px">' + DISCLAIMER + '</p>'));
  namaInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); });
}
