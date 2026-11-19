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
