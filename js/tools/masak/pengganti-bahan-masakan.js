import { h as T } from '../../core.js';

// Pengganti bahan masakan yang umum dipakai di dapur Indonesia. Takaran
// dihitung untuk 1 bagian bahan asli. Bila tidak ada takaran, ganti dengan
// jumlah yang sama. Daftar ini berisi pengetahuan memasak umum.
export const DATA_PENGGANTI = [
  { bahan: 'Santan', ganti: [
    { nama: 'Susu cair + sedikit minyak', takaran: '1 gelas susu + 1 sdm minyak', cat: 'Untuk masakan gurih. Rasanya lebih ringan dari santan.' },
    { nama: 'Santan instan bubuk', takaran: 'Sesuai kemasan', cat: 'Larutkan dulu dengan air hangat.' },
    { nama: 'FiberCreme', takaran: 'Jumlah yang sama dengan santan', cat: 'Untuk kuah, rasanya gurih dan creamy.' },
  ] },
  { bahan: 'Telur (1 butir)', ganti: [
    { nama: 'Pisang matang yang dihaluskan', takaran: '1/2 buah', cat: 'Untuk kue dan roti. Menambah rasa manis.' },
    { nama: 'Tahu sutra yang dihaluskan', takaran: '60 gram', cat: 'Untuk kue, rasanya netral.' },
    { nama: 'Biji chia direndam air', takaran: '1 sdm chia + 3 sdm air', cat: 'Diamkan 15 menit sampai seperti gel. Untuk kue dan adonan.' },
  ] },
  { bahan: 'Mentega', ganti: [
    { nama: 'Margarin', takaran: 'Jumlah yang sama', cat: 'Rasanya hampir sama, tapi lebih asin.' },
    { nama: 'Minyak kelapa', takaran: 'Jumlah yang sama', cat: 'Untuk kue, memberi aroma kelapa.' },
    { nama: 'Minyak sayur', takaran: '3/4 bagian', cat: 'Untuk tumis dan kue. Gunakan sedikit lebih sedikit dari mentega.' },
  ] },
  { bahan: 'Gula pasir', ganti: [
    { nama: 'Gula merah yang disisir', takaran: 'Jumlah yang sama', cat: 'Warna masakan jadi lebih gelap, rasanya lebih karamel.' },
    { nama: 'Madu', takaran: '3/4 bagian', cat: 'Kurangi cairan lain sedikit. Jangan untuk masakan bersuhu sangat tinggi.' },
    { nama: 'Gula aren', takaran: 'Jumlah yang sama', cat: 'Aromanya lebih wangi.' },
  ] },
  { bahan: 'Tepung terigu', ganti: [
    { nama: 'Tepung beras', takaran: 'Jumlah yang sama', cat: 'Hasilnya lebih renyah, cocok untuk gorengan.' },
    { nama: 'Tepung maizena', takaran: 'Setengah bagian', cat: 'Untuk mengentalkan kuah, bukan untuk adonan kue.' },
    { nama: 'Tepung tapioka', takaran: 'Jumlah yang sama', cat: 'Hasilnya lebih kenyal.' },
  ] },
  { bahan: 'Susu cair', ganti: [
    { nama: 'Susu kedelai', takaran: 'Jumlah yang sama', cat: 'Untuk kue dan minuman.' },
    { nama: 'Santan encer', takaran: 'Jumlah yang sama', cat: 'Untuk masakan gurih.' },
    { nama: 'Air + sedikit mentega', takaran: '1 gelas air + 1 sdm mentega', cat: 'Darurat untuk kue, hasilnya kurang creamy.' },
  ] },
  { bahan: 'Susu kental manis', ganti: [
    { nama: 'Susu cair + gula', takaran: '1 gelas susu + 1/2 gelas gula, dimasak sampai kental', cat: 'Masak dengan api kecil sambil diaduk.' },
  ] },
  { bahan: 'Keju parut', ganti: [
    { nama: 'Keju cheddar parut', takaran: 'Jumlah yang sama', cat: 'Bisa saling menggantikan untuk taburan.' },
    { nama: 'Keju mozzarella', takaran: 'Jumlah yang sama', cat: 'Meleleh lebih baik, cocok untuk panggang.' },
  ] },
  { bahan: 'Mayones', ganti: [
    { nama: 'Yogurt tawar', takaran: 'Jumlah yang sama', cat: 'Lebih segar dan asam, cocok untuk salad.' },
    { nama: 'Saus tartar', takaran: 'Jumlah yang sama', cat: 'Untuk pendamping gorengan.' },
  ] },
  { bahan: 'Minyak goreng', ganti: [
    { nama: 'Minyak kelapa', takaran: 'Jumlah yang sama', cat: 'Untuk tumis dan goreng.' },
    { nama: 'Minyak zaitun', takaran: 'Jumlah yang sama', cat: 'Untuk tumis api kecil dan salad, bukan goreng suhu tinggi.' },
  ] },
  { bahan: 'Cuka', ganti: [
    { nama: 'Air jeruk nipis', takaran: 'Jumlah yang sama', cat: 'Untuk asam segar di masakan dan salad.' },
    { nama: 'Air jeruk lemon', takaran: 'Jumlah yang sama', cat: 'Sama seperti jeruk nipis.' },
  ] },
  { bahan: 'Jeruk nipis', ganti: [
    { nama: 'Jeruk lemon', takaran: 'Jumlah yang sama', cat: 'Rasanya hampir sama.' },
    { nama: 'Cuka', takaran: 'Setengah bagian', cat: 'Untuk rasa asam saja, aromanya beda.' },
    { nama: 'Asam jawa', takaran: 'Sedikit, larutkan dulu', cat: 'Untuk kuah asam seperti sayur asem.' },
  ] },
  { bahan: 'Bawang putih (1 siung)', ganti: [
    { nama: 'Bawang putih bubuk', takaran: '1/4 sdt', cat: 'Untuk bumbu halus.' },
    { nama: 'Bawang merah', takaran: '1 siung', cat: 'Rasanya lebih manis, tambahkan sedikit saja.' },
  ] },
  { bahan: 'Jahe', ganti: [
    { nama: 'Jahe bubuk', takaran: '1/4 bagian dari jahe segar', cat: 'Jahe bubuk jauh lebih kuat.' },
    { nama: 'Lengkuas', takaran: 'Jumlah yang sama', cat: 'Aromanya beda tapi masih satu keluarga, cocok untuk kuah.' },
  ] },
  { bahan: 'Kunyit', ganti: [
    { nama: 'Kunyit bubuk', takaran: '1 sdt untuk 1 ruas kunyit', cat: 'Warnanya sama, aromanya lebih ringan.' },
  ] },
  { bahan: 'Cabai merah', ganti: [
    { nama: 'Cabai rawit', takaran: 'Setengah bagian', cat: 'Rawit jauh lebih pedas.' },
    { nama: 'Saus sambal', takaran: '1 sdm untuk 2-3 cabai', cat: 'Rasanya lebih asam dan sudah ada garam.' },
    { nama: 'Cabai bubuk', takaran: '1/2 sdt untuk 2-3 cabai', cat: 'Untuk rasa pedas saja.' },
  ] },
  { bahan: 'Kecap manis', ganti: [
    { nama: 'Kecap asin + gula merah', takaran: '1 sdm kecap asin + 1 sdm gula merah cair', cat: 'Aduk sampai gula larut.' },
    { nama: 'Madu + kecap asin', takaran: '1 sdm madu + 1 sdm kecap asin', cat: 'Untuk olesan bakar.' },
  ] },
  { bahan: 'Saus tomat', ganti: [
    { nama: 'Tomat segar yang diblender', takaran: '2 buah tomat untuk 3 sdm saus', cat: 'Tambah sedikit gula dan garam.' },
    { nama: 'Pasta tomat', takaran: 'Setengah bagian + air', cat: 'Encerkan dengan air.' },
  ] },
  { bahan: 'Ragi instan (1 sdt)', ganti: [
    { nama: 'Ragi segar', takaran: '3 kali lipat', cat: 'Ragi segar perlu diaktifkan dengan air hangat dan gula dulu.' },
    { nama: 'Baking powder', takaran: '2 sdt', cat: 'Hanya untuk roti cepat, hasilnya tidak sama dengan ragi.' },
  ] },
  { bahan: 'Baking powder (1 sdt)', ganti: [
    { nama: 'Baking soda + cuka', takaran: '1/4 sdt soda + 1/2 sdt cuka', cat: 'Campur saat adonan siap dipanggang.' },
    { nama: 'Baking soda + air jeruk nipis', takaran: '1/4 sdt soda + 1/2 sdt air jeruk', cat: 'Sama seperti cuka.' },
  ] },
  { bahan: 'Baking soda (1 sdt)', ganti: [
    { nama: 'Baking powder', takaran: '3 sdt', cat: 'Baking powder lebih lemah, pakai tiga kali lipat.' },
  ] },
  { bahan: 'Gelatin (1 lembar)', ganti: [
    { nama: 'Agar-agar bubuk', takaran: '1/2 sdt', cat: 'Hasilnya lebih keras dan rapuh dari gelatin.' },
  ] },
  { bahan: 'Agar-agar (1 bungkus)', ganti: [
    { nama: 'Gelatin bubuk', takaran: '2 sdm', cat: 'Hasilnya lebih lembut dan kenyal.' },
    { nama: 'Nutrijel', takaran: '1 bungkus', cat: 'Cara pakai sama, rasanya sudah ada.' },
  ] },
  { bahan: 'Maizena (1 sdm)', ganti: [
    { nama: 'Tepung tapioka', takaran: '1 sdm', cat: 'Hasilnya lebih bening dan kenyal.' },
    { nama: 'Tepung terigu', takaran: '2 sdm', cat: 'Hasilnya lebih keruh, masak lebih lama.' },
  ] },
  { bahan: 'Krim kental', ganti: [
    { nama: 'Susu cair + mentega', takaran: '3/4 gelas susu + 1/4 gelas mentega leleh', cat: 'Untuk saus dan sup, bukan untuk dikocok.' },
    { nama: 'Santan kental', takaran: 'Jumlah yang sama', cat: 'Untuk sup dan kari.' },
  ] },
  { bahan: 'Yogurt tawar', ganti: [
    { nama: 'Susu asam', takaran: 'Jumlah yang sama', cat: 'Untuk adonan kue.' },
    { nama: 'Krim asam', takaran: 'Jumlah yang sama', cat: 'Untuk saus dan dressing.' },
  ] },
  { bahan: 'Daging sapi', ganti: [
    { nama: 'Daging ayam', takaran: 'Jumlah yang sama', cat: 'Waktu masak lebih singkat.' },
    { nama: 'Tempe', takaran: 'Jumlah yang sama', cat: 'Untuk masakan berkuah dan tumis.' },
  ] },
  { bahan: 'Ayam', ganti: [
    { nama: 'Tahu', takaran: 'Jumlah yang sama', cat: 'Goreng dulu supaya tidak hancur.' },
    { nama: 'Tempe', takaran: 'Jumlah yang sama', cat: 'Untuk tumis dan kuah.' },
  ] },
  { bahan: 'Ikan', ganti: [
    { nama: 'Udang', takaran: 'Jumlah yang sama', cat: 'Waktu masak lebih singkat.' },
    { nama: 'Tahu', takaran: 'Jumlah yang sama', cat: 'Untuk pepes dan kuah.' },
  ] },
  { bahan: 'Kemiri (1 butir)', ganti: [
    { nama: 'Kacang mete', takaran: '2 butir', cat: 'Untuk bumbu halus, rasanya gurih.' },
    { nama: 'Kacang tanah sangrai', takaran: '1 sdm', cat: 'Untuk bumbu kacang dan halus.' },
  ] },
  { bahan: 'Ketumbar (1 sdt)', ganti: [
    { nama: 'Ketumbar bubuk', takaran: '1 sdt', cat: 'Sama saja, bubuk lebih praktis.' },
    { nama: 'Jinten', takaran: '1/2 sdt', cat: 'Aromanya lebih tajam, pakai setengah saja.' },
  ] },
  { bahan: 'Daun salam', ganti: [
    { nama: 'Daun jeruk', takaran: '2 lembar', cat: 'Aromanya lebih segar, cocok untuk kuah.' },
  ] },
  { bahan: 'Serai (1 batang)', ganti: [
    { nama: 'Daun jeruk + jahe', takaran: '2 lembar daun jeruk + 1 ruas jahe', cat: 'Mendekati aroma serai untuk kuah.' },
    { nama: 'Serai bubuk', takaran: '1 sdt', cat: 'Untuk bumbu halus.' },
  ] },
  { bahan: 'Terasi', ganti: [
    { nama: 'Ebi kering', takaran: '1 sdm', cat: 'Untuk sambal dan bumbu, aromanya mirip.' },
    { nama: 'Ikan teri', takaran: '1 sdm', cat: 'Sangrai dan haluskan dulu.' },
  ] },
  { bahan: 'Kecap ikan', ganti: [
    { nama: 'Kecap asin', takaran: 'Jumlah yang sama', cat: 'Rasanya kurang gurih laut, tapi bisa dipakai.' },
  ] },
  { bahan: 'Saus tiram', ganti: [
    { nama: 'Kecap manis + kecap asin', takaran: '1 sdm + 1 sdm', cat: 'Tambah sedikit gula, rasanya mendekati.' },
  ] },
];

export function cariPengganti(kueri) {
  const q = (kueri || '').trim().toLowerCase();
  if (!q) return DATA_PENGGANTI;
  return DATA_PENGGANTI.filter((d) =>
    d.bahan.toLowerCase().includes(q) ||
    d.ganti.some((g) => g.nama.toLowerCase().includes(q)));
}

export const meta = { "id": "pengganti-bahan-masakan", "name": "Pengganti Bahan Masakan", "cat": "masak", "icon": "🔄", "desc": "Cari pengganti bahan masakan yang habis di dapur, lengkap dengan takarannya.", "keywords": "pengganti bahan,masak,resep,bahan habis,substitusi,santan,telur,mentega", "since": "6.18.0" };

export function render(root) {
  const cari = T.input('text', 'Cari bahan, misal santan atau telur', '');
  const box = T.out();

  const tampilkan = () => {
    const hasil = cariPengganti(cari.value);
    if (hasil.length === 0) {
      T.show(box, '<p class="hint">Belum ada pengganti untuk "' + T.esc(cari.value) + '" di daftar ini. ' +
        'Coba kata lain, misalnya nama bahan utamanya saja.</p>');
      return;
    }
    const cards = hasil.map((d) => {
      const rows = d.ganti.map((g) =>
        '<tr><td><b>' + T.esc(g.nama) + '</b><br><span class="dim" style="font-size:13px">' + T.esc(g.cat) + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' + T.esc(g.takaran) + '</td></tr>').join('');
      return '<p style="font-weight:700;margin:14px 0 4px">Pengganti ' + T.esc(d.bahan) + '</p>' +
        '<table class="tbl"><tbody>' + rows + '</tbody></table>';
    }).join('');
    T.show(box, cards +
      '<p class="hint">Takaran dihitung untuk 1 bagian bahan asli. Bila tidak ada takaran, ganti dengan jumlah yang sama. ' +
      'Hasil masakan bisa sedikit beda rasa dan teksturnya, itu wajar.</p>');
  };

  cari.addEventListener('input', tampilkan);
  root.appendChild(T.field('Bahan yang habis', cari));
  root.appendChild(box);
  tampilkan();
}
