import { h as T } from '../../core.js';

// Kamus Sinonim Indonesia: cari kata yang artinya sama atau mirip, plus
// lawan katanya. Daftar ini berisi kata-kata umum bahasa Indonesia yang
// sinonimnya sudah dikenal luas. Daftarnya masih terbatas dan dinyatakan
// jujur di layar: kata yang tidak ketemu berarti belum masuk daftar,
// bukan berarti tidak punya sinonim.
export const meta = {"id": "kamus-sinonim-indonesia", "name": "Kamus Sinonim Indonesia", "cat": "teks", "icon": "📖", "desc": "Cari sinonim dan lawan kata dalam bahasa Indonesia.", "keywords": "sinonim,antonim,kamus indonesia,tesaurus,persamaan kata,lawan kata,kosakata", "since": "6.18.0"};

// Kata dasar -> { s: sinonim, a: lawan kata (boleh kosong) }.
// Entri hanya berisi pasangan yang maknanya sudah dikenal luas.
export const DATA_SINONIM = {
  bahagia: { s: ['senang', 'gembira', 'riang', 'suka cita'], a: ['sedih', 'murung'] },
  besar: { s: ['gede', 'agung', 'raksasa'], a: ['kecil'] },
  kecil: { s: ['mungil', 'mini', 'cilik'], a: ['besar'] },
  cepat: { s: ['lekas', 'segera', 'kilat', 'gesit'], a: ['lambat', 'lamban'] },
  lambat: { s: ['lamban', 'perlahan', 'pelan'], a: ['cepat'] },
  pintar: { s: ['pandai', 'cerdas', 'cerdik'], a: ['bodoh'] },
  bodoh: { s: ['tolol', 'dungu', 'bebal'], a: ['pintar', 'cerdas'] },
  cantik: { s: ['elok', 'indah', 'menawan', 'ayu'], a: ['jelek', 'buruk rupa'] },
  tampan: { s: ['gagah', 'rupawan', 'menawan'], a: ['jelek'] },
  jelek: { s: ['buruk', 'tidak bagus'], a: ['cantik', 'tampan', 'bagus'] },
  bagus: { s: ['baik', 'indah', 'bermutu'], a: ['jelek', 'buruk'] },
  baik: { s: ['bagus', 'mulia'], a: ['buruk', 'jahat'] },
  buruk: { s: ['jelek', 'tidak baik'], a: ['baik', 'bagus'] },
  jahat: { s: ['kejam', 'zalim', 'bengis'], a: ['baik', 'mulia'] },
  baikhati: { s: ['dermawan', 'murah hati'], a: ['pelit', 'kikir'] },
  pelit: { s: ['kikir', 'bakhil', 'medit'], a: ['dermawan', 'murah hati'] },
  kaya: { s: ['berada', 'makmur'], a: ['miskin'] },
  miskin: { s: ['melarat', 'fakir'], a: ['kaya'] },
  kuat: { s: ['perkasa', 'tegap', 'kokoh', 'tangguh'], a: ['lemah'] },
  lemah: { s: ['lunglai', 'lemas', 'rapuh'], a: ['kuat'] },
  tinggi: { s: ['jangkung', 'menjulang'], a: ['pendek', 'rendah'] },
  pendek: { s: ['singkat', 'cebol'], a: ['tinggi', 'panjang'] },
  panjang: { s: ['jenjang'], a: ['pendek', 'singkat'] },
  lebar: { s: ['luas', 'lapang'], a: ['sempit'] },
  luas: { s: ['lebar', 'lapang'], a: ['sempit'] },
  sempit: { s: ['sesak'], a: ['luas', 'lebar'] },
  panas: { s: ['hangat', 'terik', 'gerah'], a: ['dingin', 'sejuk'] },
  dingin: { s: ['sejuk', 'adem'], a: ['panas'] },
  terang: { s: ['cerah', 'benderang'], a: ['gelap'] },
  gelap: { s: ['remang', 'suram'], a: ['terang'] },
  cerah: { s: ['terang', 'benderang'], a: ['mendung', 'gelap'] },
  mendung: { s: ['berawan', 'kelabu'], a: ['cerah'] },
  baru: { s: ['anyar', 'segar'], a: ['lama', 'usang'] },
  lama: { s: ['usang', 'tua'], a: ['baru'] },
  tua: { s: ['lanjut usia', 'sepuh'], a: ['muda'] },
  muda: { s: ['belia', 'remaja'], a: ['tua'] },
  sedih: { s: ['murung', 'duka', 'nelangsa'], a: ['bahagia', 'senang'] },
  senang: { s: ['gembira', 'bahagia', 'suka'], a: ['sedih'] },
  marah: { s: ['murka', 'geram', 'berang'], a: ['tenang', 'sabar'] },
  tenang: { s: ['tenteram', 'damai', 'teduh'], a: ['gelisah', 'resah'] },
  takut: { s: ['gentar', 'ngeri', 'khawatir'], a: ['berani'] },
  berani: { s: ['pemberani', 'nekat', 'gagah berani'], a: ['takut', 'pengecut'] },
  rajin: { s: ['tekun', 'ulet', 'gigih'], a: ['malas'] },
  malas: { s: ['enggan', 'ogah'], a: ['rajin'] },
  jujur: { s: ['terus terang', 'apa adanya'], a: ['bohong', 'dusta'] },
  bohong: { s: ['dusta', 'palsu'], a: ['jujur', 'benar'] },
  benar: { s: ['betul', 'tepat'], a: ['salah'] },
  salah: { s: ['keliru', 'sesat'], a: ['benar'] },
  mudah: { s: ['gampang', 'ringan'], a: ['sulit', 'susah'] },
  sulit: { s: ['susah', 'sukar', 'rumit'], a: ['mudah', 'gampang'] },
  mahal: { s: ['tinggi harganya'], a: ['murah'] },
  murah: { s: ['terjangkau'], a: ['mahal'] },
  ramai: { s: ['hiruk pikuk', 'padat'], a: ['sepi'] },
  sepi: { s: ['sunyi', 'lengang'], a: ['ramai'] },
  bersih: { s: ['suci', 'kinclong'], a: ['kotor'] },
  kotor: { s: ['jorok', 'cemar'], a: ['bersih'] },
  sehat: { s: ['bugar', 'segar'], a: ['sakit'] },
  sakit: { s: ['nyeri', 'tidak enak badan'], a: ['sehat'] },
  gemuk: { s: ['gendut', 'montok'], a: ['kurus'] },
  kurus: { s: ['kerempeng', 'langsing'], a: ['gemuk'] },
  tajam: { s: ['runcing'], a: ['tumpul'] },
  tumpul: { s: ['majir'], a: ['tajam'] },
  keras: { s: ['kokoh', 'padat'], a: ['lunak', 'lembut'] },
  lembut: { s: ['halus', 'lunak'], a: ['kasar', 'keras'] },
  kasar: { s: ['tidak halus'], a: ['halus', 'lembut'] },
  halus: { s: ['lembut', 'licin'], a: ['kasar'] },
  manis: { s: ['legit'], a: ['pahit', 'asam'] },
  pahit: { s: ['pahit getir'], a: ['manis'] },
  asin: { s: ['gurih'], a: ['hambar'] },
  enak: { s: ['lezat', 'nikmat', 'sedap'], a: ['tidak enak'] },
  lezat: { s: ['enak', 'nikmat', 'sedap'], a: ['tidak enak'] },
  sibuk: { s: ['repot', 'padat'], a: ['senggang', 'luang'] },
  senggang: { s: ['luang', 'santai'], a: ['sibuk'] },
  awal: { s: ['permulaan', 'mula'], a: ['akhir'] },
  akhir: { s: ['ujung', 'penutup'], a: ['awal'] },
  datang: { s: ['tiba', 'hadir'], a: ['pergi'] },
  pergi: { s: ['berangkat'], a: ['datang'] },
  naik: { s: ['menanjak', 'mendaki'], a: ['turun'] },
  turun: { s: ['menurun', 'merosot'], a: ['naik'] },
  hidup: { s: ['nyala', 'bernyawa'], a: ['mati'] },
  mati: { s: ['meninggal', 'tewas', 'padam'], a: ['hidup'] },
  menang: { s: ['juara', 'unggul'], a: ['kalah'] },
  kalah: { s: ['tumbang'], a: ['menang'] },
  suka: { s: ['gemar', 'senang'], a: ['benci'] },
  benci: { s: ['muak', 'tidak suka'], a: ['suka', 'cinta'] },
  cinta: { s: ['kasih', 'sayang'], a: ['benci'] },
  sayang: { s: ['kasih', 'cinta'], a: ['benci'] },
  tertawa: { s: ['terkekeh', 'terbahak'], a: ['menangis'] },
  menangis: { s: ['tersedu', 'meratap'], a: ['tertawa'] },
  tidur: { s: ['lelap', 'terpejam'], a: ['bangun'] },
  bangun: { s: ['terjaga'], a: ['tidur'] },
  makan: { s: ['menyantap', 'bersantap'], a: [] },
  minum: { s: ['meneguk'], a: [] },
  melihat: { s: ['memandang', 'menatap'], a: [] },
  mendengar: { s: ['menyimak'], a: [] },
  berbicara: { s: ['berkata', 'berujar', 'bercerita'], a: ['diam'] },
  diam: { s: ['bungkam', 'hening'], a: ['bicara', 'ribut'] },
  ribut: { s: ['gaduh', 'bising'], a: ['tenang', 'diam'] },
  bertanya: { s: ['menanyakan'], a: ['menjawab'] },
  menjawab: { s: ['membalas'], a: ['bertanya'] },
  memberi: { s: ['memberikan', 'mengasih'], a: ['meminta'] },
  meminta: { s: ['memohon'], a: ['memberi'] },
  membeli: { s: ['berbelanja'], a: ['menjual'] },
  menjual: { s: ['menjajakan'], a: ['membeli'] },
  bekerja: { s: ['berkarya'], a: ['menganggur'] },
  belajar: { s: ['menuntut ilmu', 'menimba ilmu'], a: [] },
  berpikir: { s: ['merenung', 'memikirkan'], a: [] },
  mengingat: { s: ['mengenang'], a: ['melupakan'] },
  melupakan: { s: ['lalai'], a: ['mengingat'] },
  memilih: { s: ['menentukan pilihan'], a: [] },
  membantu: { s: ['menolong', 'mendukung'], a: [] },
  menolong: { s: ['membantu', 'menyelamatkan'], a: [] },
  menunggu: { s: ['menanti'], a: [] },
  mencari: { s: ['menggeledah', 'memburu'], a: [] },
  menemukan: { s: ['mendapati'], a: ['kehilangan'] },
  kehilangan: { s: ['kehabisan'], a: ['menemukan'] },
  membangun: { s: ['mendirikan', 'membangkitkan'], a: ['meruntuhkan'] },
  merusak: { s: ['menghancurkan'], a: ['memperbaiki'] },
  memperbaiki: { s: ['membetulkan'], a: ['merusak'] },
};

export const JUMLAH_ENTRI = Object.keys(DATA_SINONIM).length;

// Cari entri untuk satu kata (huruf tidak dibedakan, spasi dirapikan).
// Murni, bisa diuji di Node.
export function cariSinonim(kata) {
  const k = String(kata || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!k) return null;
  return DATA_SINONIM[k] || null;
}

export function render(root) {
  const cariI = T.input('text', 'cth: bahagia', '');
  const box = T.out();

  const cari = () => {
    const kata = cariI.value.trim();
    if (!kata) { T.show(box, '<div class="err">Tulis dulu kata yang mau dicari.</div>'); return; }
    const hasil = cariSinonim(kata);
    if (!hasil) {
      T.show(box, '<p class="note">Kata "<b>' + T.esc(kata) + '</b>" belum ada di daftar ini. Daftar ini baru berisi ' + JUMLAH_ENTRI + ' kata umum, jadi banyak kata yang memang belum masuk. Coba kata dasarnya saja, contoh: "bahagia", "cepat", "besar".</p>');
      return;
    }
    const sinonim = hasil.s.map((s) => '<button type="button" class="btn" data-kata="' + T.esc(s) + '">' + T.esc(s) + '</button>').join(' ');
    const antonim = hasil.a.length
      ? '<div class="dim" style="margin-top:10px">Lawan kata</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">' + hasil.a.map((s) => '<button type="button" class="btn" data-kata="' + T.esc(s) + '">' + T.esc(s) + '</button>').join(' ') + '</div>'
      : '';
    T.show(box,
      '<div class="big">' + T.esc(kata.toLowerCase()) + '</div>' +
      '<div class="dim" style="margin-top:10px">Kata yang artinya sama atau mirip</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">' + sinonim + '</div>' +
      antonim +
      '<p class="hint">Ketuk salah satu kata untuk mencari sinonimnya.</p>');
    box.querySelectorAll('button[data-kata]').forEach((b) => {
      b.addEventListener('click', () => { cariI.value = b.getAttribute('data-kata'); cari(); });
    });
  };

  cariI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cari(); } });

  root.appendChild(T.el('<p class="note">Daftar ini berisi ' + JUMLAH_ENTRI + ' kata umum bahasa Indonesia beserta sinonim dan lawan katanya. Ini bukan tesaurus lengkap: kata yang tidak ketemu berarti belum masuk daftar, bukan berarti tidak punya sinonim.</p>'));
  root.appendChild(T.field('Cari kata', cariI, 'Tulis kata dasarnya, contoh: bahagia, cepat, besar.'));
  root.appendChild(T.btn('Cari Sinonim', cari, true));
  root.appendChild(box);
}
