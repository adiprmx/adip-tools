import { h as T, kv } from '../../core.js?v=6.9.5';

export const meta = {"id": "hitung-waris", "name": "Kalkulator Waris Islam", "cat": "indonesia", "icon": "🕌", "desc": "Simulasi pembagian waris (faraidh) sederhana.", "keywords": "waris,islam,faraidh,harta,ahli waris", "file": "tools/indonesia/hitung-waris.js"};
export function render(root) {
  const harta = T.input('number', 'cth: 1000000000', '');
  const pasSel = T.select([['none', 'Tidak ada'], ['suami', 'Suami'], ['istri', 'Istri']], 'none');
  const anakL = T.input('number', '0', '0');
  const anakP = T.input('number', '0', '0');
  const ayahChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Ayah (masih hidup)</label>');
  const ibuChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Ibu (masih hidup)</label>');
  const box = T.out();

  const pct = (v) => String(v.toFixed(1)).replace('.', ',') + '%';

  const hitung = () => {
    const total = T.num(harta.value);
    if (!(total > 0)) { T.hide(box); return; }
    const nL = Math.max(0, Math.floor(T.num(anakL.value) || 0));
    const nP = Math.max(0, Math.floor(T.num(anakP.value) || 0));
    const adaAnak = (nL + nP) > 0;
    const adaAyah = ayahChk.querySelector('input').checked;
    const adaIbu = ibuChk.querySelector('input').checked;
    const pas = pasSel.value;

    const rows = [];
    let tetap = 0;
    if (pas === 'suami') { const f = adaAnak ? 1 / 4 : 1 / 2; rows.push({ label: 'Suami', fr: adaAnak ? '1/4' : '1/2', frac: f }); tetap += f; }
    if (pas === 'istri') { const f = adaAnak ? 1 / 8 : 1 / 4; rows.push({ label: 'Istri', fr: adaAnak ? '1/8' : '1/4', frac: f }); tetap += f; }
    if (adaIbu) { const f = adaAnak ? 1 / 6 : 1 / 3; rows.push({ label: 'Ibu', fr: adaAnak ? '1/6' : '1/3', frac: f }); tetap += f; }
    if (adaAyah) { rows.push({ label: 'Ayah', fr: '1/6' + (adaAnak ? '' : ' + sisa'), frac: 1 / 6 }); tetap += 1 / 6; }

    if (rows.length === 0 && !adaAnak) {
      T.show(box, '<p class="warn">Pilih dulu ahli warisnya (pasangan / anak / orang tua).</p>');
      return;
    }

    const sisa = Math.max(0, 1 - tetap);
    if (adaAnak) {
      const unit = sisa / (2 * nL + nP);
      if (nL > 0) rows.push({ label: 'Anak laki-laki × ' + nL, fr: 'sisa ÷ 2:1', frac: 2 * nL * unit, per: 2 * unit, n: nL });
      if (nP > 0) rows.push({ label: 'Anak perempuan × ' + nP, fr: 'sisa ÷ 2:1', frac: nP * unit, per: unit, n: nP });
    } else if (adaAyah && sisa > 0) {
      rows[rows.length - 1].frac += sisa; // ayah juga sebagai asabah
    } else if (sisa > 0.0000001) {
      rows.push({ label: 'Residu', fr: 'perlu penetapan', frac: sisa, residu: true });
    }

    // normalisasi persen agar total = 100%
    const raw = rows.map((r) => r.frac * 100);
    const rounded = raw.map((v) => Math.round(v * 10) / 10);
    let diff = Math.round((100 - rounded.reduce((a, b) => a + b, 0)) * 10) / 10;
    let bigIdx = 0;
    rows.forEach((r, i) => { if (raw[i] > raw[bigIdx]) bigIdx = i; });
    rounded[bigIdx] = Math.round((rounded[bigIdx] + diff) * 10) / 10;

    let html = '<table class="tbl"><tr><th>Ahli waris</th><th>Bagian</th><th style="text-align:right">%</th><th style="text-align:right">Nominal</th></tr>';
    rows.forEach((r, i) => {
      const nominal = r.frac * total;
      const per = r.per ? '<div class="mut" style="font-size:12px">' + T.rp(r.per * total) + '/orang</div>' : '';
      html += '<tr' + (r.residu ? ' class="warn"' : '') + '><td>' + T.esc(r.label) + '<div class="mut" style="font-size:12px">' + T.esc(r.fr) + '</div></td>' +
        '<td style="text-align:right">' + pct(rounded[i]) + '</td>' +
        '<td style="text-align:right"><b>' + T.rp(nominal) + '</b>' + per + '</td></tr>';
    });
    html += '</table>';
    html += kv('Total harta', '<b>' + T.rp(total) + '</b>') +
      kv('Total bagian', '<span class="ok"><b>100,0%</b></span>');
    html += '<p class="hint">Estimasi/penyederhanaan, bukan ketentuan resmi. <b>Ini BUKAN fatwa</b> — waris punya banyak kondisi khusus (kakek, saudara, hamil, wasiat, utang, dsb.). Untuk kasus nyata, konsultasikan ke ahli waris/ulama atau Pengadilan Agama.</p>';
    T.show(box, html);
  };

  [pasSel, anakL, anakP].forEach((elm) => elm.addEventListener('input', hitung));
  ayahChk.querySelector('input').addEventListener('change', hitung);
  ibuChk.querySelector('input').addEventListener('change', hitung);

  root.appendChild(T.field('Total harta (Rp)', harta));
  root.appendChild(T.field('Pasangan pewaris', pasSel));
  root.appendChild(T.grid2(
    T.field('Anak laki-laki', anakL),
    T.field('Anak perempuan', anakP)
  ));
  root.appendChild(ayahChk);
  root.appendChild(ibuChk);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
}
