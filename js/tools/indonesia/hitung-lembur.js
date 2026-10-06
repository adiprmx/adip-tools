import { h as T, kv } from '../../core.js?v=6.9.5';

export const meta = {"id": "hitung-lembur", "name": "Kalkulator Upah Lembur", "cat": "indonesia", "icon": "⏰", "desc": "Hitung upah lembur (aturan 1,5x & 2x).", "keywords": "lembur,upah,gaji,kerja,kemenaker", "file": "tools/indonesia/hitung-lembur.js"};
export function render(root) {
  const gaji = T.input('number', 'cth: 5000000', '');
  const jamKerja = T.input('number', 'cth: 2', '0');
  const jamLibur = T.input('number', 'cth: 8', '0');
  const box = T.out();

  const jam = (v) => Math.max(0, T.num(v) || 0);

  const hitung = () => {
    const g = T.num(gaji.value);
    if (!(g > 0)) { T.hide(box); return; }
    const uj = g / 173; // upah per jam
    const hk = jam(jamKerja.value);
    const hl = jam(jamLibur.value);

    // Hari kerja: jam ke-1 = 1,5x, jam berikutnya 2x
    const hk1 = Math.min(hk, 1);
    const hk2 = Math.max(0, hk - 1);
    const bayarHk = uj * (1.5 * hk1 + 2 * hk2);

    // Hari libur: 7 jam pertama 2x, jam ke-8 = 3x, jam ke-9+ = 4x
    const hl2 = Math.min(hl, 7);
    const hl3 = Math.min(Math.max(0, hl - 7), 1);
    const hl4 = Math.max(0, hl - 8);
    const bayarHl = uj * (2 * hl2 + 3 * hl3 + 4 * hl4);

    const total = bayarHk + bayarHl;
    const xr = (v) => String(v.toFixed(1)).replace('.', ',');

    let html = '<div class="big center" style="font-size:24px">' + T.rp(total) + '</div>' +
      '<p class="center mut" style="font-size:13px">Total upah lembur</p>';
    html += kv('Gaji sebulan', T.rp(g)) + kv('Upah per jam (gaji ÷ 173)', T.rp(uj));
    html += '<table class="tbl"><tr><th>Keterangan</th><th style="text-align:right">Jam</th><th style="text-align:right">Upah</th></tr>';
    if (hk > 0) {
      html += '<tr><td>Hari kerja — jam ke-1 <span class="mut">×1,5</span></td><td style="text-align:right">' + xr(hk1) + '</td><td style="text-align:right">' + T.rp(uj * 1.5 * hk1) + '</td></tr>';
      if (hk2 > 0) html += '<tr><td>Hari kerja — jam ke-2+ <span class="mut">×2</span></td><td style="text-align:right">' + xr(hk2) + '</td><td style="text-align:right">' + T.rp(uj * 2 * hk2) + '</td></tr>';
      html += '<tr><td><b>Subtotal hari kerja</b></td><td></td><td style="text-align:right"><b>' + T.rp(bayarHk) + '</b></td></tr>';
    }
    if (hl > 0) {
      html += '<tr><td>Hari libur — 7 jam pertama <span class="mut">×2</span></td><td style="text-align:right">' + xr(hl2) + '</td><td style="text-align:right">' + T.rp(uj * 2 * hl2) + '</td></tr>';
      if (hl3 > 0) html += '<tr><td>Hari libur — jam ke-8 <span class="mut">×3</span></td><td style="text-align:right">' + xr(hl3) + '</td><td style="text-align:right">' + T.rp(uj * 3 * hl3) + '</td></tr>';
      if (hl4 > 0) html += '<tr><td>Hari libur — jam ke-9+ <span class="mut">×4</span></td><td style="text-align:right">' + xr(hl4) + '</td><td style="text-align:right">' + T.rp(uj * 4 * hl4) + '</td></tr>';
      html += '<tr><td><b>Subtotal hari libur</b></td><td></td><td style="text-align:right"><b>' + T.rp(bayarHl) + '</b></td></tr>';
    }
    if (hk === 0 && hl === 0) html += '<tr><td colspan="3" class="mut">Isi dulu jam lemburnya.</td></tr>';
    html += '</table>';
    html += '<p class="hint">Estimasi/penyederhanaan, bukan ketentuan resmi. Acuan umum: upah lembur = 1/173 × upah sebulan (aturan umum Kemenaker). Kebijakan perusahaan bisa berbeda.</p>';
    T.show(box, html);
  };

  root.appendChild(T.field('Gaji sebulan (Rp)', gaji, 'Upah per jam dihitung = gaji ÷ 173'));
  root.appendChild(T.grid2(
    T.field('Jam lembur — hari kerja', jamKerja),
    T.field('Jam lembur — hari libur', jamLibur)
  ));
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
  gaji.addEventListener('input', hitung);
  jamKerja.addEventListener('input', hitung);
  jamLibur.addEventListener('input', hitung);
}
