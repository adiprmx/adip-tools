import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "biaya-perpanjang-sim", "name": "Biaya Perpanjang SIM", "cat": "indonesia", "icon": "🪪", "desc": "Hitung total biaya perpanjangan SIM: PNBP + cek kesehatan + psikotes, bisa diedit.", "keywords": "sim,perpanjang,surat,izin,mengemudi,pnbp,biaya,kesehatan,psikotes"};
export function render(root) {
  const PNBP_DEFAULT = { 'SIM A': 80000, 'SIM C': 75000, 'SIM B1': 80000, 'SIM B2': 80000 };
  const KESEHATAN_DEFAULT = 25000;
  const PSIKOTES_DEFAULT = 50000;

  const golI = T.select(Object.keys(PNBP_DEFAULT).map((g) => [g, g]), 'SIM A');
  const pnbpI = T.input('number', 'cth: 80000', String(PNBP_DEFAULT['SIM A'])); pnbpI.inputMode = 'numeric';
  const sehatI = T.input('number', 'cth: 25000', String(KESEHATAN_DEFAULT)); sehatI.inputMode = 'numeric';
  const psikoI = T.input('number', 'cth: 50000', String(PSIKOTES_DEFAULT)); psikoI.inputMode = 'numeric';
  const outBox = T.out();

  const kvTable = (pairs) => '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
    pairs.map((p) => '<tr><td style="padding:7px 4px;color:#a8a29e">' + T.esc(p[0]) + '</td>' +
      '<td style="padding:7px 4px;text-align:right;font-weight:600">' + p[1] + '</td></tr>').join('') + '</table>';

  const hitung = () => {
    const gol = golI.value;
    const pnbp = T.num(pnbpI.value) || 0;
    const sehat = T.num(sehatI.value) || 0;
    const psiko = T.num(psikoI.value) || 0;
    const total = pnbp + sehat + psiko;
    T.show(outBox,
      kvTable([
        ['Golongan', T.esc(gol)],
        ['PNBP (penerimaan negara)', T.rp(pnbp)],
        ['Cek kesehatan', T.rp(sehat)],
        ['Tes psikologi (psikotes)', T.rp(psiko)],
      ]) +
      '<p style="margin:12px 0 4px;font-size:17px">Total perkiraan: <b>' + T.rp(total) + '</b></p>' +
      '<p class="mut" style="font-size:12px;line-height:1.6;margin-top:8px">Disclaimer: tarif dapat berubah mengikuti kebijakan terbaru. PNBP mengacu PP No. 60/2016 tentang PNBP Polri. Biaya cek kesehatan & psikotes bervariasi antar klinik/Satpas — angka di atas nilai umum 2026 dan bisa kamu edit sesuai daerahmu.</p>');
  };

  golI.addEventListener('change', () => {
    pnbpI.value = String(PNBP_DEFAULT[golI.value] || 0);
    hitung();
  });
  [pnbpI, sehatI, psikoI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Estimasi biaya perpanjangan SIM: PNBP + cek kesehatan + psikotes. Semua nilai bisa diedit menyesuaikan tarif di kotamu.</p>'));
  root.appendChild(T.grid2(
    T.field('Golongan SIM', golI),
    T.field('PNBP (Rp)', pnbpI),
    T.field('Cek kesehatan (Rp)', sehatI),
    T.field('Psikotes (Rp)', psikoI)
  ));
  root.appendChild(T.row(T.btn('Hitung total', hitung, true)));
  root.appendChild(outBox);
  hitung();
}
