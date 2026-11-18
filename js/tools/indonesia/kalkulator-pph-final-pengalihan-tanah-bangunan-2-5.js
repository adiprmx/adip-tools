import { h as T, utils, money, kv } from '../../core.js';

// PPh final atas pengalihan hak atas tanah dan/atau bangunan (PP 34/2016):
// 2,5% dari jumlah bruto nilai pengalihan untuk jual beli biasa; 1% untuk
// rumah sederhana / rusun sederhana yang dijual WP yang usaha pokoknya
// mengalihkan properti; 0% untuk pengalihan kepada pemerintah (dan BUMN/BUMD
// penugasan khusus) untuk kepentingan umum.
// Dikecualikan (Pasal 6): orang pribadi berpenghasilan di bawah PTKP yang
// mengalihkan dengan nilai di bawah Rp60 juta (bukan pecahan); hibah ke
// keluarga sedarah garis lurus satu derajat, badan keagamaan, pendidikan,
// sosial, koperasi, atau pelaku usaha mikro dan kecil; waris. Pengecualian
// umumnya perlu Surat Keterangan Bebas (SKB) dari kantor pajak.
export function hitungPphPengalihan(nilai, jenis) {
  const bruto = Math.max(0, Number(nilai) || 0);
  const tarif = jenis === 'sederhana' ? 1 : jenis === 'pemerintah' ? 0 : jenis === 'kecuali' ? 0 : 2.5;
  const pph = bruto * tarif / 100;
  return { bruto, tarif, pph, bersih: bruto - pph };
}
utils.pphPengalihanTanahBangunan = hitungPphPengalihan;

export const meta = {"id": "kalkulator-pph-final-pengalihan-tanah-bangunan-2-5", "name": "Kalkulator PPh Final Pengalihan Tanah/Bangunan 2,5%", "cat": "indonesia", "icon": "🧾", "desc": "Hitung PPh final 2,5% saat jual tanah atau bangunan, lengkap dengan pengecualiannya.", "keywords": "pph,pengalihan,jual,tanah,bangunan,rumah,2,5 persen,final,pp 34 2016,penjual", "since": "6.17.0"};
export function render(root) {
  const nilaiI = money(null, 'cth: 800000000');
  const jenisSel = T.select([
    ['biasa', 'Jual beli biasa (2,5%)'],
    ['sederhana', 'Rumah sederhana / rusun sederhana oleh pengembang (1%)'],
    ['pemerintah', 'Dijual ke pemerintah untuk kepentingan umum (0%)'],
    ['kecuali', 'Dikecualikan: waris, hibah keluarga, atau di bawah Rp60 juta'],
  ], 'biasa');
  const box = T.out();

  const hitung = () => {
    const nilai = T.num(nilaiI.value) || 0;
    if (!(nilai > 0)) { T.hide(box); return; }
    const r = hitungPphPengalihan(nilai, jenisSel.value);
    let catatan = '';
    if (jenisSel.value === 'kecuali') {
      catatan = '<p class="hint">Pengecualian ini berlaku untuk: waris; hibah ke keluarga sedarah garis lurus satu derajat (orang tua ke anak kandung dan sebaliknya), badan keagamaan, pendidikan, sosial, koperasi, atau pelaku usaha mikro dan kecil; dan orang pribadi berpenghasilan di bawah PTKP yang menjual dengan nilai di bawah Rp60 juta dan bukan hasil memecah transaksi. Untuk memakainya, umumnya perlu Surat Keterangan Bebas (SKB) dari kantor pajak. Bila tidak yakin, tanyakan ke kantor pajak sebelum transaksi.</p>';
    } else if (jenisSel.value === 'sederhana') {
      catatan = '<p class="hint">Tarif 1% hanya untuk rumah sederhana atau rumah susun sederhana yang dijual oleh wajib pajak yang usaha pokoknya mengalihkan properti (pengembang). Penjual biasa tetap kena 2,5%.</p>';
    } else if (jenisSel.value === 'pemerintah') {
      catatan = '<p class="hint">Tarif 0% berlaku untuk pengalihan kepada pemerintah, BUMN, atau BUMD yang mendapat penugasan khusus untuk pengadaan tanah bagi pembangunan untuk kepentingan umum.</p>';
    } else {
      catatan = '<p class="hint">PPh ini dibayar penjual sebelum Akta Jual Beli ditandatangani, dan bersifat final. Bila nilai jual di bawah Rp60 juta dan penghasilan penjual di bawah PTKP, pajaknya bisa dikecualikan, pilih jenis pengecualian di atas. Dasar: PP 34/2016.</p>';
    }
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.pph)) + '</div>' +
      '<p class="center mut">PPh final yang dibayar penjual.</p>' +
      kv('Nilai pengalihan (harga jual)', T.rp(r.bruto)) +
      kv('Tarif', String(r.tarif).replace('.', ',') + '%') +
      kv('Yang diterima penjual setelah pajak', '<b>' + T.rp(Math.round(r.bersih)) + '</b>') +
      catatan);
  };
  [nilaiI, jenisSel].forEach((i) => i.addEventListener('input', hitung));
  jenisSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Jual tanah atau rumah, penjual kena pajak final 2,5% dari harga jual kotor. Pajak ini dibayar sekali, sebelum akta ditandatangani.</p>'));
  root.appendChild(T.field('Nilai pengalihan / harga jual (Rp)', nilaiI, 'Harga yang tertulis di Akta Jual Beli'));
  root.appendChild(T.field('Jenis pengalihan', jenisSel));
  root.appendChild(box);
  hitung();
}
