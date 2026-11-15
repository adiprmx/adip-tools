import { h as T, utils, kv } from '../../core.js?v=6.12.0';

// Data UMP TAHUN 2026 (38 provinsi), sumber: Satudata Kemnaker
// ("Upah Minimum Provinsi (UMP) Tahun 2026"), berlaku 1 Jan 2026 per PP 49/2025.
// Dicek 12 Nov 2026. Catatan: Papua Tengah tidak naik dari 2025 (Rp4.285.848).
// DISCLAIMER: angka resmi bisa berubah — selalu cek Disnaker setempat.
const UMP = [
  ['Aceh', 3932552],
  ['Sumatera Utara', 3228949],
  ['Sumatera Barat', 3182955],
  ['Riau', 3780495],
  ['Jambi', 3471497],
  ['Sumatera Selatan', 3942963],
  ['Bengkulu', 2827250],
  ['Lampung', 3047734],
  ['Kep. Bangka Belitung', 4035000],
  ['Kep. Riau', 3879520],
  ['DKI Jakarta', 5729876],
  ['Jawa Barat', 2317601],
  ['Jawa Tengah', 2327386],
  ['DI Yogyakarta', 2417495],
  ['Jawa Timur', 2446880],
  ['Banten', 3100881],
  ['Bali', 3207459],
  ['Nusa Tenggara Barat', 2673861],
  ['Nusa Tenggara Timur', 2455898],
  ['Kalimantan Barat', 3054552],
  ['Kalimantan Tengah', 3686138],
  ['Kalimantan Selatan', 3725000],
  ['Kalimantan Timur', 3762431],
  ['Kalimantan Utara', 3775243],
  ['Sulawesi Utara', 4002630],
  ['Sulawesi Tengah', 3179565],
  ['Sulawesi Selatan', 3921088],
  ['Sulawesi Tenggara', 3306496],
  ['Gorontalo', 3405144],
  ['Sulawesi Barat', 3315934],
  ['Maluku', 3334490],
  ['Maluku Utara', 3510240],
  ['Papua Barat', 3841000],
  ['Papua', 4436283],
  ['Papua Tengah', 4285848],
  ['Papua Pegunungan', 4508714],
  ['Papua Selatan', 4508100],
  ['Papua Barat Daya', 3766000],
];

export const meta = {
  id: 'ump-provinsi',
  name: 'UMP per Provinsi',
  cat: 'indonesia',
  icon: '💵',
  desc: 'Daftar UMP 2026 38 provinsi + bandingkan gajimu dengan UMP daerahmu.',
  keywords: 'ump,gaji,upah minimum,provinsi,2026,buruh,pekerja',
};

export function render(root) {
  root.appendChild(T.el(
    '<p class="note"><b>Data UMP tahun 2026.</b> Tertinggi: DKI Jakarta ' + T.rp(5729876) +
    ' · Terendah: Jawa Barat ' + T.rp(2317601) + '.</p>'
  ));

  // --- tabel searchable ---
  const cari = T.input('text', 'Ketik nama provinsi… cth: bali', '');
  cari.inputMode = 'text';
  const tabelBox = T.out();

  const gambarTabel = () => {
    const q = cari.value.trim().toLowerCase();
    const rows = UMP.filter(([nama]) => !q || nama.toLowerCase().includes(q));
    if (!rows.length) {
      T.show(tabelBox, '<p class="warn">Nggak ketemu provinsi dengan nama itu.</p>');
      return;
    }
    let html = '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
      '<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ffffff20">Provinsi</th>' +
      '<th style="text-align:right;padding:8px;border-bottom:1px solid #ffffff20">UMP 2026</th></tr>';
    rows.forEach(([nama, v]) => {
      html += '<tr><td style="padding:8px;border-bottom:1px solid #ffffff10">' + T.esc(nama) +
        '</td><td style="padding:8px;border-bottom:1px solid #ffffff10;text-align:right;white-space:nowrap">' +
        T.rp(v) + '</td></tr>';
    });
    T.show(tabelBox, html + '</table>' +
      '<p class="hint">' + rows.length + ' dari ' + UMP.length + ' provinsi ditampilkan.</p>');
  };

  // --- kalkulator pembanding ---
  const provSel = T.select(UMP.map(([n], i) => [i, n]), '10'); // DKI Jakarta
  const gajiI = T.input('text', 'cth: 4500000', '');
  gajiI.inputMode = 'decimal';
  const bandingBox = T.out();

  const banding = () => {
    const gaji = T.num(gajiI.value);
    if (!(gaji > 0)) { T.show(bandingBox, '<p class="warn">Isi dulu gajimu per bulan (Rp).</p>'); return; }
    const [nama, ump] = UMP[+provSel.value] || UMP[0];
    const selisih = gaji - ump;
    const persen = (selisih / ump) * 100;
    const diAtas = selisih >= 0;
    const absSel = Math.abs(selisih);
    const absPct = Math.abs(persen).toFixed(1);
    T.show(bandingBox,
      '<div class="big center" style="color:' + (diAtas ? '#22c55e' : '#ef4444') + '">' +
      (diAtas ? '+' : '−') + T.rp(absSel) + '</div>' +
      '<p class="center">' + (diAtas ? 'Gajimu di ATAS UMP ' : 'Gajimu di BAWAH UMP ') + T.esc(nama) +
      ' (' + absPct + '%)</p>' +
      kv('Gajimu', T.rp(gaji)) +
      kv('UMP ' + nama + ' 2026', T.rp(ump)) +
      kv('Selisih', (diAtas ? '+' : '−') + T.rp(absSel)) +
      '<p class="hint">UMP itu batas MINIMUM untuk pekerja baru (masa kerja < 1 tahun). ' +
      (diAtas ? 'Selamat, gajimu sudah di atas standar minimum — tapi tetap layak diperjuangkan naik tiap tahun.'
        : 'Kalau kamu pekerja tetap dengan masa kerja < 1 tahun dan gajimu di bawah ini, perusahaanmu melanggar aturan upah minimum.') + '</p>');
  };

  root.appendChild(T.field('Cari provinsi', cari));
  root.appendChild(tabelBox);
  root.appendChild(T.el('<hr style="border:none;border-top:1px solid #ffffff15;margin:18px 0">'));
  root.appendChild(T.el('<p class="note">💬 <b>Bandingkan gajimu.</b> Pilih provinsimu, masukkan gaji per bulan — lihat posisimu dibanding UMP.</p>'));
  root.appendChild(T.grid2(
    T.field('Provinsi', provSel),
    T.field('Gajimu / bulan (Rp)', gajiI)
  ));
  root.appendChild(T.row(T.btn('Bandingkan', banding, true)));
  root.appendChild(bandingBox);
  root.appendChild(T.el('<p class="hint" style="margin-top:16px">⚠️ Angka UMP tiap tahun ditetapkan gubernur dan bisa berubah. Cek Disnaker setempat untuk angka terbaru & resmi — data di atas khusus tahun 2026 (sumber: Satudata Kemnaker, PP 49/2025).</p>'));

  cari.addEventListener('input', gambarTabel);
  [provSel, gajiI].forEach((i) => i.addEventListener('input', banding));
  provSel.addEventListener('change', banding);
  gambarTabel();
}
