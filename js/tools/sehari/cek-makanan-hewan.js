import { h as T, utils } from '../../core.js?v=6.12.1';

// Daftar makanan umum dan tingkat bahayanya untuk kucing dan anjing.
// Sumber: ASPCA Animal Poison Control Center, Pet Poison Helpline,
// Merck Veterinary Manual.
// Tingkat: aman, hati-hati, berbahaya, sangat berbahaya.
const MAKANAN = [
  { nama: 'Cokelat', kucing: 'sangat berbahaya', anjing: 'sangat berbahaya', kenapa: 'Theobromine dan kafein mengganggu jantung dan saraf. Cokelat hitam paling berbahaya.' },
  { nama: 'Permen karet bebas gula (xylitol)', kucing: 'hati-hati', anjing: 'sangat berbahaya', kenapa: 'Xylitol membuat gula darah anjing turun drastis dan bisa merusak hati. Untuk kucing belum terbukti beracun, tapi tetap jangan diberikan.' },
  { nama: 'Anggur', kucing: 'berbahaya', anjing: 'sangat berbahaya', kenapa: 'Bisa merusak ginjal anjing. Tidak ada jumlah aman yang diketahui.' },
  { nama: 'Kismis', kucing: 'berbahaya', anjing: 'sangat berbahaya', kenapa: 'Sama seperti anggur, bisa merusak ginjal anjing.' },
  { nama: 'Bawang merah', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Merusak sel darah merah dan menyebabkan anemia. Kucing lebih peka.' },
  { nama: 'Bawang putih', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Sama seperti bawang merah, merusak sel darah merah. Kucing lebih peka.' },
  { nama: 'Bawang bombai', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Satu keluarga dengan bawang merah, merusak sel darah merah.' },
  { nama: 'Daun bawang', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Satu keluarga dengan bawang merah, merusak sel darah merah.' },
  { nama: 'Kacang macadamia', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Menyebabkan lemas, gemetar, muntah, dan demam pada anjing.' },
  { nama: 'Kopi dan kafein', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Kafein mengganggu jantung dan saraf, sama seperti theobromine di cokelat.' },
  { nama: 'Alkohol', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Sedikit saja sudah berbahaya, bisa merusak hati dan saraf.' },
  { nama: 'Adonan ragi mentah', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Adonan mengembang di dalam perut dan menghasilkan alkohol.' },
  { nama: 'Bunga lili', kucing: 'sangat berbahaya', anjing: 'hati-hati', kenapa: 'Bukan makanan, tapi sering dimakan kucing. Bisa gagal ginjal pada kucing, termasuk serbuk sarinya.' },
  { nama: 'Biji apel', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Biji apel mengandung sianida. Buang bijinya sebelum memberi apel.' },
  { nama: 'Tulang yang sudah dimasak', kucing: 'berbahaya', anjing: 'berbahaya', kenapa: 'Tulang matang mudah pecah dan tajam, bisa melukai mulut dan usus.' },
  { nama: 'Alpukat', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Mengandung persin. Daging buah umumnya ringan, tapi bijinya bisa tersangkut di tenggorokan.' },
  { nama: 'Susu', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Banyak kucing dan anjing tidak tahan laktosa, bisa mencret.' },
  { nama: 'Keju', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Sedikit saja. Tinggi lemak dan laktosa.' },
  { nama: 'Es krim', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Tinggi gula dan laktosa, bisa mencret.' },
  { nama: 'Cokelat putih', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Theobromine rendah, tapi tinggi lemak dan gula.' },
  { nama: 'Ikan mentah', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Enzim di ikan mentah merusak vitamin B1 kalau dimakan sering.' },
  { nama: 'Makanan pedas', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Bisa sakit perut dan mencret.' },
  { nama: 'Tomat matang', kucing: 'hati-hati', anjing: 'hati-hati', kenapa: 'Tomat merah matang aman sedikit saja. Daun dan tomat hijau mengandung solanin yang beracun.' },
  { nama: 'Daging ayam matang tanpa tulang', kucing: 'aman', anjing: 'aman', kenapa: 'Sumber protein yang bagus, asalkan matang dan tanpa tulang.' },
  { nama: 'Wortel', kucing: 'aman', anjing: 'aman', kenapa: 'Renyah, rendah kalori, bagus untuk gigi anjing.' },
  { nama: 'Apel tanpa biji', kucing: 'aman', anjing: 'aman', kenapa: 'Manis dan berserat. Buang bijinya dulu.' },
  { nama: 'Pisang', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja, karena manis.' },
  { nama: 'Semangka tanpa biji', kucing: 'aman', anjing: 'aman', kenapa: 'Menyegarkan dan rendah kalori. Buang bijinya dulu.' },
  { nama: 'Telur matang', kucing: 'aman', anjing: 'aman', kenapa: 'Sumber protein yang bagus, asalkan matang.' },
  { nama: 'Nasi putih matang', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja, sering dipakai saat perut hewan bermasalah.' },
  { nama: 'Selai kacang tanpa xylitol', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja. Cek labelnya, jangan yang mengandung xylitol.' },
  { nama: 'Blueberry', kucing: 'aman', anjing: 'aman', kenapa: 'Rendah kalori dan kaya antioksidan.' },
  { nama: 'Labu matang', kucing: 'aman', anjing: 'aman', kenapa: 'Bagus untuk pencernaan, sering dipakai saat hewan sembelit.' },
  { nama: 'Brokoli', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja. Terlalu banyak bisa membuat perut kembung.' },
  { nama: 'Kacang tanah', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja, tanpa garam.' },
  { nama: 'Roti tawar', kucing: 'aman', anjing: 'aman', kenapa: 'Aman sedikit saja, asalkan tidak ada kismis atau xylitol.' },
  { nama: 'Jagung', kucing: 'aman', anjing: 'aman', kenapa: 'Aman, tapi jangan beri tongkolnya karena bisa tersangkut.' },
  { nama: 'Kentang matang', kucing: 'aman', anjing: 'aman', kenapa: 'Aman kalau sudah matang. Kentang mentah dan hijau beracun.' },
  { nama: 'Ubi matang', kucing: 'aman', anjing: 'aman', kenapa: 'Aman dan mudah dicerna.' },
];
const LABEL = {
  'aman': ['Aman', 'ok'],
  'hati-hati': ['Hati-hati', 'warn'],
  'berbahaya': ['Berbahaya', 'err'],
  'sangat berbahaya': ['Sangat berbahaya', 'err'],
};
utils.cekMakanan = function (kata, jenis) {
  const q = String(kata || '').trim().toLowerCase();
  const j = jenis === 'anjing' ? 'anjing' : 'kucing';
  return MAKANAN.filter((m) => !q || m.nama.toLowerCase().includes(q))
    .map((m) => ({ nama: m.nama, tingkat: m[j], kenapa: m.kenapa }));
};

export const meta = {"id": "cek-makanan-hewan", "name": "Cek Makanan Hewan", "cat": "sehari", "icon": "🍫", "desc": "Cek makanan aman atau berbahaya untuk kucing dan anjing, beserta alasannya.", "keywords": "makanan,hewan,kucing,anjing,aman,beracun,cokelat,bawang,anggur", "since": "6.11.0"};
export function render(root) {
  const cari = T.input('text', 'Cari makanan, contoh: cokelat');
  const jenis = T.select([['kucing', 'Kucing'], ['anjing', 'Anjing']], 'kucing');
  const box = T.out();

  const tampilkan = () => {
    const hasil = utils.cekMakanan(cari.value, jenis.value);
    if (!hasil.length) {
      T.show(box, '<p class="warn">Tidak ada makanan yang cocok dengan pencarian itu. Coba kata lain, contoh: cokelat, bawang, apel.</p>' +
        '<p class="hint">Daftar ini tidak lengkap. Kalau ragu soal satu makanan, tanya dokter hewan sebelum memberikannya. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
      return;
    }
    let html = '<div class="center"><div class="dim">' + hasil.length + ' makanan untuk ' + jenis.value + '</div></div>';
    hasil.forEach((m) => {
      const l = LABEL[m.tingkat];
      html += '<div class="kv"><span class="k">' + m.nama + '<br><span class="dim">' + m.kenapa + '</span></span>' +
        '<span class="v"><span class="' + l[1] + '"><b>' + l[0] + '</b></span></span></div>';
    });
    html += '<p class="hint">Sumber: ASPCA Animal Poison Control Center, Pet Poison Helpline, Merck Veterinary Manual. Kalau hewanmu makan sesuatu yang berbahaya, segera hubungi dokter hewan. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>';
    T.show(box, html);
  };
  cari.addEventListener('input', tampilkan);
  jenis.addEventListener('change', tampilkan);

  root.appendChild(T.grid2(
    T.field('Cari makanan', cari),
    T.field('Jenis hewan', jenis),
  ));
  root.appendChild(box);
  tampilkan();
}
