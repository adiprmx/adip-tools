import { h as T } from '../../core.js?v=6.6.0';

// Kode plat nomor kendaraan Indonesia: kode -> [wilayah, contoh daerah]
const PLAT = {
  A: ['Banten', 'Serang, Cilegon, Pandeglang, Lebak'],
  B: ['DKI Jakarta & Bodetabek', 'Jakarta, Depok, Bekasi, Tangerang, Tangerang Selatan'],
  D: ['Bandung Raya', 'Kota/Kab. Bandung, Bandung Barat, Cimahi'],
  E: ['Ciayumajakuning', 'Cirebon, Indramayu, Majalengka, Kuningan'],
  F: ['Bogor & Sukabumi', 'Kota/Kab. Bogor, Sukabumi, Cianjur'],
  T: ['Karawang & sekitar', 'Karawang, Purwakarta, Subang'],
  Z: ['Priangan Timur', 'Garut, Tasikmalaya, Ciamis, Banjar, Pangandaran, Sumedang'],
  G: ['Pekalongan (Pantura Barat)', 'Pekalongan, Tegal, Brebes, Batang, Pemalang'],
  H: ['Semarang', 'Kota/Kab. Semarang, Kendal, Demak, Salatiga'],
  K: ['Pati (Pantura Timur)', 'Pati, Kudus, Jepara, Rembang, Blora, Grobogan'],
  R: ['Banyumas', 'Banyumas, Cilacap, Purbalingga, Banjarnegara'],
  AA: ['Kedu', 'Magelang, Temanggung, Wonosobo, Purworejo, Kebumen'],
  AB: ['DI Yogyakarta', 'Kota Yogyakarta, Sleman, Bantul, Kulon Progo, Gunungkidul'],
  AD: ['Solo Raya', 'Surakarta, Sukoharjo, Karanganyar, Wonogiri, Sragen, Klaten, Boyolali'],
  AE: ['Madiun', 'Madiun, Ngawi, Magetan, Ponorogo, Pacitan'],
  AG: ['Kediri', 'Kediri, Tulungagung, Blitar, Trenggalek, Nganjuk'],
  L: ['Surabaya', 'Kota Surabaya'],
  M: ['Madura', 'Bangkalan, Sampang, Pamekasan, Sumenep'],
  N: ['Malang Raya', 'Malang, Batu, Pasuruan, Probolinggo, Lumajang'],
  P: ['Tapal Kuda Timur', 'Jember, Bondowoso, Situbondo, Banyuwangi'],
  S: ['Bojonegoro & sekitar', 'Bojonegoro, Tuban, Lamongan, Mojokerto, Jombang'],
  W: ['Gresik & Sidoarjo', 'Gresik, Sidoarjo'],
  BA: ['Sumatera Barat', 'Padang, Bukittinggi, Payakumbuh, dsb.'],
  BB: ['Sumatera Utara (pantai barat)', 'Sibolga, Tapanuli, Nias'],
  BK: ['Sumatera Utara (pantai timur)', 'Medan, Binjai, Deli Serdang, dsb.'],
  BD: ['Bengkulu', 'Kota Bengkulu & kabupaten'],
  BE: ['Lampung', 'Bandar Lampung, Metro, dsb.'],
  BG: ['Sumatera Selatan', 'Palembang, dsb.'],
  BH: ['Jambi', 'Kota Jambi & kabupaten'],
  BL: ['Aceh', 'Banda Aceh, Lhokseumawe, dsb.'],
  BM: ['Riau', 'Pekanbaru, Dumai, dsb.'],
  BN: ['Kep. Bangka Belitung', 'Pangkal Pinang, Tanjung Pandan'],
  BP: ['Kep. Riau', 'Tanjung Pinang, Batam, Bintan'],
  DA: ['Kalimantan Selatan', 'Banjarmasin, Banjarbaru, dsb.'],
  KB: ['Kalimantan Barat', 'Pontianak, Singkawang, dsb.'],
  KH: ['Kalimantan Tengah', 'Palangka Raya, dsb.'],
  KT: ['Kalimantan Timur', 'Samarinda, Balikpapan, Bontang'],
  KU: ['Kalimantan Utara', 'Tarakan, Nunukan, dsb.'],
  DB: ['Sulawesi Utara', 'Manado, Bitung, Minahasa'],
  DL: ['Kep. Sangihe & Talaud', 'Tahuna, Melonguane'],
  DM: ['Gorontalo', 'Kota Gorontalo & kabupaten'],
  DN: ['Sulawesi Tengah', 'Palu, dsb.'],
  DD: ['Sulawesi Selatan', 'Makassar, Gowa, Maros'],
  DP: ['Sulawesi Barat', 'Mamuju, Majene, Polewali Mandar'],
  DT: ['Sulawesi Tenggara', 'Kendari, dsb.'],
  DW: ['Sulawesi Selatan (Bosowasi)', 'Bone, Sinjai, Soppeng, Wajo'],
  DK: ['Bali', 'Denpasar & kabupaten'],
  DR: ['Nusa Tenggara Barat', 'Mataram, Lombok'],
  DH: ['NTT (Timor)', 'Kupang, Atambua'],
  EB: ['NTT (Flores)', 'Ende, Maumere, Larantuka'],
  DE: ['Maluku', 'Ambon, dsb.'],
  DG: ['Maluku Utara', 'Ternate, Tidore, Sofifi'],
  DS: ['Papua', 'Jayapura, Merauke, dsb.'],
  PB: ['Papua Barat', 'Manokwari, Sorong, dsb.'],
};

export const meta = {"id": "plat-nomor", "name": "Cek Asal Plat Nomor", "cat": "indonesia", "icon": "🚗", "desc": "Asal daerah dari kode plat kendaraan.", "keywords": "plat,nomor,kendaraan,motor,mobil,daerah"};
export function render(root) {

    const inp = T.input('text', 'cth: B 1234 XYZ  atau  D');
    inp.autocapitalize = 'characters';
    const box = T.out();

    const cek = () => {
      const kode = (inp.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
      if (!kode) { T.show(box, '<p class="warn">Ketik dulu kode platnya, misal <b>B</b> atau <b>D</b>.</p>'); return; }
      const hit = PLAT[kode];
      if (!hit) { T.show(box, '<p class="warn">Kode <b>' + T.esc(kode) + '</b> tidak dikenal. Mungkin plat khusus (TNI/Polri/diplomatik) atau kode baru.</p>'); return; }
      T.show(box,
        '<div class="big">' + T.esc(kode) + '</div>' +
        '<div class="kv"><span>Wilayah</span><b>' + T.esc(hit[0]) + '</b></div>' +
        '<div class="kv"><span>Daerah</span><span>' + T.esc(hit[1]) + '</span></div>');
    };
    inp.addEventListener('input', cek);

    root.appendChild(T.field('Kode plat (1–2 huruf depan)', inp, 'Cukup huruf depannya saja, misal "B 1234 XYZ" → B'));
    root.appendChild(T.row(T.btn('Cek asal', cek, true)));
    root.appendChild(box);

    // Daftar semua kode
    let daftarHtml = '<div style="display:grid;grid-template-columns:1fr;gap:6px;margin-top:8px">';
    for (const k of Object.keys(PLAT).sort()) {
      daftarHtml += '<div class="kv"><span><b>' + k + '</b> — ' + T.esc(PLAT[k][0]) + '</span></div>';
    }
    daftarHtml += '</div>';
    const det = T.el('<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600;font-size:14px">Lihat semua ' + Object.keys(PLAT).length + ' kode plat</summary>' + daftarHtml + '</details>');
    root.appendChild(det);
    root.appendChild(T.el('<p class="hint">Belum termasuk plat khusus: TNI, Polri, korps diplomatik (CD), dan kendaraan dinas pemerintah.</p>'));

}
