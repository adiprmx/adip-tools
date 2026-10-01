import { h as T, utils, kv } from '../../core.js?v=6.8.0';

// Data UMP TAHUN 2025 (38 provinsi), diringkas dari berbagai sumber media.
// DISCLAIMER: angka resmi bisa berubah — selalu cek Disnaker setempat.
const UMP = [
  ['Aceh', 3685616],
  ['Sumatera Utara', 2992559],
  ['Sumatera Barat', 2994193],
  ['Riau', 3508776],
  ['Jambi', 3234535],
  ['Sumatera Selatan', 3681571],
  ['Bengkulu', 2670039],
  ['Lampung', 2893070],
  ['Kep. Bangka Belitung', 3876600],
  ['Kep. Riau', 3623654],
  ['DKI Jakarta', 5396761],
  ['Jawa Barat', 2191232],
  ['Jawa Tengah', 2169349],
  ['DI Yogyakarta', 2264081],
  ['Jawa Timur', 2305985],
  ['Banten', 2905120],
  ['Bali', 2996561],
  ['Nusa Tenggara Barat', 2602931],
  ['Nusa Tenggara Timur', 2328970],
  ['Kalimantan Barat', 2878286],
  ['Kalimantan Tengah', 3473621],
  ['Kalimantan Selatan', 3496195],
  ['Kalimantan Timur', 3579314],
  ['Kalimantan Utara', 3580160],
  ['Sulawesi Utara', 3775425],
  ['Sulawesi Tengah', 2915000],
  ['Sulawesi Selatan', 3657527],
  ['Sulawesi Tenggara', 3073552],
  ['Gorontalo', 3221731],
  ['Sulawesi Barat', 3104430],
  ['Maluku', 3141700],
  ['Maluku Utara', 3408000],
  ['Papua Barat', 3615000],
  ['Papua', 4285850],
  ['Papua Tengah', 4285850],
  ['Papua Pegunungan', 4285850],
  ['Papua Selatan', 4285848],
  ['Papua Barat Daya', 3614000],
];

export const meta = {
  id: 'ump-provinsi',
  name: 'UMP per Provinsi',
  cat: 'indonesia',
  icon: '💵',
  desc: 'Daftar UMP 2025 38 provinsi + bandingkan gajimu dengan UMP daerahmu.',
  keywords: 'ump,gaji,upah minimum,provinsi,2025,buruh,pekerja',
};

export function render(root) {
  root.appendChild(T.el(
    '<p class="note"><b>Data UMP tahun 2025.</b> Tertinggi: DKI Jakarta ' + T.rp(5396761) +
    ' · Terendah: Jawa Tengah ' + T.rp(2169349) + '.</p>'
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
      '<th style="text-align:right;padding:8px;border-bottom:1px solid #ffffff20">UMP 2025</th></tr>';
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
      kv('UMP ' + nama + ' 2025', T.rp(ump)) +
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
  root.appendChild(T.el('<p class="hint" style="margin-top:16px">⚠️ Angka UMP tiap tahun ditetapkan gubernur dan bisa berubah. Cek Disnaker setempat untuk angka terbaru & resmi — data di atas khusus tahun 2025.</p>'));

  cari.addEventListener('input', gambarTabel);
  [provSel, gajiI].forEach((i) => i.addEventListener('input', banding));
  provSel.addEventListener('change', banding);
  gambarTabel();
}
