import { h as T } from '../../core.js';

// Arti & Asal Nama: cari arti dan asal bahasa sebuah nama, khususnya nama
// Indonesia. Daftar ini berisi nama-nama yang arti dan asal bahasanya
// sudah dikenal luas. Nama yang tidak ketemu berarti belum masuk daftar,
// bukan berarti tidak punya arti, dan tool ini tidak mengarang arti.
export const meta = {"id": "arti-asal-nama", "name": "Arti & Asal Nama", "cat": "fun", "icon": "🏷️", "desc": "Cari arti dan asal bahasa sebuah nama, khususnya nama Indonesia.", "keywords": "arti nama,asal nama,makna nama,nama bayi,nama indonesia,arti nama anak", "since": "6.18.0"};

// nama -> { arti, asal }. Hanya nama yang arti dan asal bahasanya
// sudah dikenal luas.
export const DATA_NAMA = {
  aditya: { arti: 'matahari', asal: 'Sanskerta' },
  arjuna: { arti: 'pahlawan yang bersih hatinya', asal: 'Sanskerta' },
  bagas: { arti: 'tegap dan kuat', asal: 'Jawa' },
  bayu: { arti: 'angin', asal: 'Sanskerta' },
  bima: { arti: 'kuat dan berani', asal: 'Sanskerta' },
  damar: { arti: 'cahaya penerang', asal: 'Jawa' },
  dimas: { arti: 'adik tercinta', asal: 'Jawa' },
  eka: { arti: 'yang pertama dan utama', asal: 'Sanskerta' },
  fajar: { arti: 'cahaya pagi hari', asal: 'Arab' },
  galang: { arti: 'menegakkan kebenaran', asal: 'Jawa' },
  gilang: { arti: 'bercahaya', asal: 'Jawa' },
  hadi: { arti: 'pemberi petunjuk', asal: 'Arab' },
  hendra: { arti: 'kuat dan perkasa', asal: 'Sanskerta' },
  indra: { arti: 'pemimpin yang agung', asal: 'Sanskerta' },
  jatmiko: { arti: 'terhormat dan mulia', asal: 'Jawa' },
  langit: { arti: 'setinggi langit cita-citanya', asal: 'Indonesia' },
  mahesa: { arti: 'kuat bagai banteng', asal: 'Sanskerta' },
  nara: { arti: 'pemimpin umat', asal: 'Sanskerta' },
  pandu: { arti: 'bijaksana', asal: 'Sanskerta' },
  raditya: { arti: 'matahari pagi', asal: 'Sanskerta' },
  rangga: { arti: 'tampan bagai bunga', asal: 'Jawa' },
  sakti: { arti: 'berkuasa dan sakti', asal: 'Sanskerta' },
  satria: { arti: 'ksatria pemberani', asal: 'Sanskerta' },
  surya: { arti: 'matahari', asal: 'Sanskerta' },
  taufik: { arti: 'mendapat petunjuk Tuhan', asal: 'Arab' },
  anisa: { arti: 'ramah dan bersahabat', asal: 'Arab' },
  ayu: { arti: 'cantik', asal: 'Jawa' },
  bunga: { arti: 'indah bagai bunga', asal: 'Indonesia' },
  cahya: { arti: 'cahaya', asal: 'Sanskerta' },
  dewi: { arti: 'bidadari', asal: 'Sanskerta' },
  dinda: { arti: 'adik kesayangan', asal: 'Indonesia' },
  fitri: { arti: 'suci dan bersih', asal: 'Arab' },
  intan: { arti: 'permata yang berharga', asal: 'Indonesia' },
  kartika: { arti: 'bintang', asal: 'Sanskerta' },
  kirana: { arti: 'cahaya yang indah', asal: 'Sanskerta' },
  laras: { arti: 'selaras dan harmonis', asal: 'Jawa' },
  lestari: { arti: 'abadi', asal: 'Jawa' },
  lintang: { arti: 'bintang di langit', asal: 'Jawa' },
  maya: { arti: 'cahaya yang mempesona', asal: 'Sanskerta' },
  melati: { arti: 'suci bagai bunga melati', asal: 'Indonesia' },
  nabila: { arti: 'mulia', asal: 'Arab' },
  nadia: { arti: 'penuh harapan', asal: 'Arab' },
  putri: { arti: 'putri raja', asal: 'Sanskerta' },
  ratna: { arti: 'permata', asal: 'Sanskerta' },
  ratri: { arti: 'malam yang tenang', asal: 'Sanskerta' },
  sari: { arti: 'inti yang terbaik', asal: 'Jawa' },
  sekar: { arti: 'bunga', asal: 'Jawa' },
  wulan: { arti: 'bulan purnama', asal: 'Jawa' },
  zahra: { arti: 'bersinar terang', asal: 'Arab' },
  cinta: { arti: 'penuh kasih sayang', asal: 'Indonesia' },
  ahmad: { arti: 'yang terpuji', asal: 'Arab' },
  muhammad: { arti: 'yang terpuji', asal: 'Arab' },
  ali: { arti: 'yang tinggi dan mulia', asal: 'Arab' },
  fatimah: { arti: 'yang menjauhkan diri dari keburukan', asal: 'Arab' },
  aisyah: { arti: 'yang hidup sejahtera', asal: 'Arab' },
  yusuf: { arti: 'Tuhan menambahkan', asal: 'Ibrani' },
  ibrahim: { arti: 'bapak banyak bangsa', asal: 'Ibrani' },
  mariam: { arti: 'yang dicintai', asal: 'Ibrani' },
  alexander: { arti: 'pembela manusia', asal: 'Yunani' },
  sophia: { arti: 'kebijaksanaan', asal: 'Yunani' },
  theodore: { arti: 'pemberian Tuhan', asal: 'Yunani' },
  nicholas: { arti: 'kemenangan rakyat', asal: 'Yunani' },
  victoria: { arti: 'kemenangan', asal: 'Latin' },
  felix: { arti: 'beruntung dan bahagia', asal: 'Latin' },
  clara: { arti: 'terang dan jernih', asal: 'Latin' },
  stella: { arti: 'bintang', asal: 'Latin' },
  luna: { arti: 'bulan', asal: 'Latin' },
  aurora: { arti: 'fajar', asal: 'Latin' },
  david: { arti: 'yang dicintai', asal: 'Ibrani' },
  daniel: { arti: 'Tuhan adalah hakimku', asal: 'Ibrani' },
  gabriel: { arti: 'Tuhan adalah kekuatanku', asal: 'Ibrani' },
  michael: { arti: 'siapa yang seperti Tuhan', asal: 'Ibrani' },
  sarah: { arti: 'putri', asal: 'Ibrani' },
  hannah: { arti: 'anugerah', asal: 'Ibrani' },
  william: { arti: 'pelindung yang teguh', asal: 'Jerman' },
  frederick: { arti: 'penguasa yang damai', asal: 'Jerman' },
  charles: { arti: 'pria merdeka', asal: 'Jerman' },
  emma: { arti: 'yang menyeluruh', asal: 'Jerman' },
  liam: { arti: 'pelindung yang teguh', asal: 'Irlandia' },
  nora: { arti: 'cahaya', asal: 'Irlandia' },
  kenji: { arti: 'yang bijaksana dan sehat', asal: 'Jepang' },
  sakura: { arti: 'bunga sakura', asal: 'Jepang' },
  yuki: { arti: 'salju', asal: 'Jepang' },
  minjun: { arti: 'yang cerdas dan berbakat', asal: 'Korea' },
  wei: { arti: 'yang agung', asal: 'Cina' },
  mei: { arti: 'cantik', asal: 'Cina' },
  carlos: { arti: 'pria merdeka', asal: 'Spanyol' },
  lucia: { arti: 'cahaya', asal: 'Spanyol' },
  diego: { arti: 'pengganti', asal: 'Spanyol' },
  marco: { arti: 'dewa perang Mars', asal: 'Italia' },
  sofia: { arti: 'kebijaksanaan', asal: 'Italia' },
  // --- Tambahan v6.21.0: arti terverifikasi via pencarian web (20 Nov 2026).
  // Nama yang artinya masih diperdebatkan sumbernya sengaja tidak dimasukkan.
  // Sanskerta
  wijaya: { arti: 'kemenangan', asal: 'Sanskerta' },
  aruna: { arti: 'fajar', asal: 'Sanskerta' },
  tirta: { arti: 'air', asal: 'Sanskerta' },
  cakra: { arti: 'roda', asal: 'Sanskerta' },
  kusuma: { arti: 'bunga', asal: 'Sanskerta' },
  puspita: { arti: 'berbunga', asal: 'Sanskerta' },
  saraswati: { arti: 'dewi ilmu pengetahuan', asal: 'Sanskerta' },
  putra: { arti: 'anak laki-laki', asal: 'Sanskerta' },
  candra: { arti: 'bulan', asal: 'Sanskerta' },
  widya: { arti: 'ilmu pengetahuan', asal: 'Sanskerta' },
  dipta: { arti: 'cahaya yang terang', asal: 'Sanskerta' },
  wira: { arti: 'pahlawan yang berani', asal: 'Sanskerta' },
  yuda: { arti: 'perang', asal: 'Sanskerta' },
  puspa: { arti: 'bunga', asal: 'Sanskerta' },
  arya: { arti: 'bangsawan yang terhormat', asal: 'Sanskerta' },
  karuna: { arti: 'belas kasih', asal: 'Sanskerta' },
  adi: { arti: 'yang pertama dan utama', asal: 'Sanskerta' },
  giri: { arti: 'gunung', asal: 'Sanskerta' },
  wimala: { arti: 'suci dan tak bernoda', asal: 'Sanskerta' },
  abimanyu: { arti: 'yang tak takut', asal: 'Sanskerta' },
  tama: { arti: 'yang utama', asal: 'Sanskerta' },
  yuwana: { arti: 'selamat', asal: 'Sanskerta' },
  // Jawa
  arum: { arti: 'harum', asal: 'Jawa' },
  // Bali (nama urutan kelahiran)
  wayan: { arti: 'anak pertama', asal: 'Bali' },
  putu: { arti: 'anak pertama', asal: 'Bali' },
  gede: { arti: 'besar', asal: 'Bali' },
  made: { arti: 'anak kedua', asal: 'Bali' },
  kadek: { arti: 'anak kedua', asal: 'Bali' },
  nengah: { arti: 'anak kedua', asal: 'Bali' },
  nyoman: { arti: 'anak ketiga', asal: 'Bali' },
  komang: { arti: 'anak ketiga', asal: 'Bali' },
  ketut: { arti: 'anak keempat', asal: 'Bali' },
  // Arab
  khalid: { arti: 'abadi', asal: 'Arab' },
  omar: { arti: 'panjang umur', asal: 'Arab' },
  hasan: { arti: 'baik dan indah', asal: 'Arab' },
  salim: { arti: 'aman dan selamat', asal: 'Arab' },
  rahman: { arti: 'maha penyayang', asal: 'Arab' },
  rahim: { arti: 'penyayang', asal: 'Arab' },
  nur: { arti: 'cahaya', asal: 'Arab' },
  huda: { arti: 'petunjuk', asal: 'Arab' },
  amira: { arti: 'putri', asal: 'Arab' },
  layla: { arti: 'malam', asal: 'Arab' },
  yasmin: { arti: 'bunga melati', asal: 'Arab' },
  faris: { arti: 'ksatria penunggang kuda', asal: 'Arab' },
  hamzah: { arti: 'berani dan kuat', asal: 'Arab' },
  fadil: { arti: 'murah hati', asal: 'Arab' },
  farhan: { arti: 'gembira dan bahagia', asal: 'Arab' },
  habib: { arti: 'kekasih dan sahabat', asal: 'Arab' },
  hakim: { arti: 'bijaksana dan adil', asal: 'Arab' },
  jamal: { arti: 'keindahan', asal: 'Arab' },
  jamil: { arti: 'indah dan tampan', asal: 'Arab' },
  karim: { arti: 'murah hati dan mulia', asal: 'Arab' },
  malik: { arti: 'raja', asal: 'Arab' },
  amina: { arti: 'aman', asal: 'Arab' },
  salma: { arti: 'aman', asal: 'Arab' },
  // Ibrani
  samuel: { arti: 'didengar oleh Tuhan', asal: 'Ibrani' },
  isaac: { arti: 'dia akan tertawa', asal: 'Ibrani' },
  jacob: { arti: 'penyusul', asal: 'Ibrani' },
  joseph: { arti: 'Tuhan menambahkan', asal: 'Ibrani' },
  joshua: { arti: 'Tuhan adalah keselamatan', asal: 'Ibrani' },
  rachel: { arti: 'domba betina', asal: 'Ibrani' },
  rebecca: { arti: 'pengikat', asal: 'Ibrani' },
  ethan: { arti: 'kuat dan teguh', asal: 'Ibrani' },
  adam: { arti: 'manusia dari tanah', asal: 'Ibrani' },
  eve: { arti: 'kehidupan', asal: 'Ibrani' },
  elijah: { arti: 'Tuhan adalah Tuhanku', asal: 'Ibrani' },
  benjamin: { arti: 'anak tangan kanan', asal: 'Ibrani' },
  moses: { arti: 'ditarik dari air', asal: 'Ibrani' },
  elizabeth: { arti: 'Tuhan adalah sumpahku', asal: 'Ibrani' },
  naomi: { arti: 'yang menyenangkan', asal: 'Ibrani' },
  // Yunani
  george: { arti: 'petani', asal: 'Yunani' },
  peter: { arti: 'batu karang', asal: 'Yunani' },
  philip: { arti: 'pencinta kuda', asal: 'Yunani' },
  andrew: { arti: 'gagah dan berani', asal: 'Yunani' },
  irene: { arti: 'damai', asal: 'Yunani' },
  chloe: { arti: 'tunas yang sedang mekar', asal: 'Yunani' },
  zoe: { arti: 'kehidupan', asal: 'Yunani' },
  stephen: { arti: 'mahkota', asal: 'Yunani' },
  christopher: { arti: 'pembawa Kristus', asal: 'Yunani' },
  dorothy: { arti: 'hadiah dari Tuhan', asal: 'Yunani' },
  eugene: { arti: 'bangsawan', asal: 'Yunani' },
  timothy: { arti: 'yang menghormati Tuhan', asal: 'Yunani' },
  gregory: { arti: 'waspada', asal: 'Yunani' },
  iris: { arti: 'pelangi', asal: 'Yunani' },
  alexandra: { arti: 'pelindung dan penolong manusia', asal: 'Yunani' },
  // Latin
  marcus: { arti: 'pengikut Mars, dewa perang', asal: 'Latin' },
  julia: { arti: 'awet muda', asal: 'Latin' },
  beatrice: { arti: 'pembawa kebahagiaan', asal: 'Latin' },
  paul: { arti: 'kecil', asal: 'Latin' },
  flora: { arti: 'bunga', asal: 'Latin' },
  rosa: { arti: 'mawar', asal: 'Latin' },
  valentina: { arti: 'kuat dan sehat', asal: 'Latin' },
  martin: { arti: 'suka berperang', asal: 'Latin' },
  vincent: { arti: 'sang penakluk', asal: 'Latin' },
  victor: { arti: 'sang penakluk', asal: 'Latin' },
  laura: { arti: 'mahkota daun salam', asal: 'Latin' },
  julius: { arti: 'awet muda', asal: 'Latin' },
  // Jerman
  henry: { arti: 'penguasa rumah', asal: 'Jerman' },
  albert: { arti: 'mulia dan cemerlang', asal: 'Jerman' },
  robert: { arti: 'ketenaran yang bersinar', asal: 'Jerman' },
  matilda: { arti: 'kuat dalam perang', asal: 'Jerman' },
  bernard: { arti: 'berani seperti beruang', asal: 'Jerman' },
  leonard: { arti: 'berani seperti singa', asal: 'Jerman' },
  walter: { arti: 'penguasa pasukan', asal: 'Jerman' },
  louis: { arti: 'prajurit terkenal', asal: 'Jerman' },
  roger: { arti: 'prajurit tombak yang terkenal', asal: 'Jerman' },
  otto: { arti: 'kaya', asal: 'Jerman' },
  adelaide: { arti: 'mulia dan tenang', asal: 'Jerman' },
  // Jepang
  hana: { arti: 'bunga', asal: 'Jepang' },
  akira: { arti: 'cerah', asal: 'Jepang' },
  sora: { arti: 'langit', asal: 'Jepang' },
  ren: { arti: 'teratai', asal: 'Jepang' },
  riku: { arti: 'daratan', asal: 'Jepang' },
  nanami: { arti: 'tujuh lautan', asal: 'Jepang' },
  ai: { arti: 'cinta', asal: 'Jepang' },
  makoto: { arti: 'jujur', asal: 'Jepang' },
  kaoru: { arti: 'wangi', asal: 'Jepang' },
  mai: { arti: 'tarian', asal: 'Jepang' },
  rin: { arti: 'bermartabat', asal: 'Jepang' },
};

export const JUMLAH_NAMA = Object.keys(DATA_NAMA).length;

// Cari nama (huruf tidak dibedakan). Murni, bisa diuji di Node.
export function cariNama(nama) {
  const k = String(nama || '').trim().toLowerCase();
  if (!k) return null;
  return DATA_NAMA[k] || null;
}

export function render(root) {
  const cariI = T.input('text', 'cth: Aditya', '');
  const box = T.out();

  const cari = () => {
    const nama = cariI.value.trim();
    if (!nama) { T.show(box, '<div class="err">Tulis dulu nama yang mau dicari.</div>'); return; }
    const hasil = cariNama(nama);
    if (!hasil) {
      T.show(box, '<p class="note">Nama "<b>' + T.esc(nama) + '</b>" belum ada di daftar ini. Daftar ini baru berisi ' + JUMLAH_NAMA + ' nama, jadi banyak nama yang memang belum masuk. Coba satu kata saja, contoh: Aditya, Putri, Sofia.</p>');
      return;
    }
    T.show(box,
      '<div class="big">' + T.esc(nama.charAt(0).toUpperCase() + nama.slice(1).toLowerCase()) + '</div>' +
      '<p class="center" style="font-size:16px;margin-top:6px">"' + T.esc(hasil.arti) + '"</p>' +
      '<p class="center mut">Asal bahasa: ' + T.esc(hasil.asal) + '</p>');
  };

  const acak = () => {
    const kunci = Object.keys(DATA_NAMA);
    const nama = kunci[Math.floor(Math.random() * kunci.length)];
    cariI.value = nama.charAt(0).toUpperCase() + nama.slice(1);
    cari();
  };

  cariI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cari(); } });

  root.appendChild(T.el('<p class="note">Daftar ini berisi ' + JUMLAH_NAMA + ' nama beserta arti dan asal bahasanya. Nama yang tidak ketemu berarti belum masuk daftar, dan tool ini tidak mengarang arti.</p>'));
  root.appendChild(T.field('Cari nama', cariI, 'Tulis satu kata, contoh: Aditya, Putri, Sofia.'));
  root.appendChild(T.row(T.btn('Cari Arti', cari, true), T.btn('Nama Acak', acak)));
  root.appendChild(box);
}
