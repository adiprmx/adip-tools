import { h as T, utils } from '../../core.js?v=6.10.0';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

export const meta = {"id": "biaya-sim-baru", "name": "Biaya Bikin SIM Baru", "cat": "indonesia", "icon": "🪪", "desc": "Hitung total biaya bikin SIM A atau C baru: PNBP + tes kesehatan + tes psikologi.", "keywords": "sim,baru,biaya,pnbp,tes,kesehatan,psikologi,satpas,calo"};
export function render(root) {
  const PNBP = { 'SIM A': 120000, 'SIM C': 100000, 'SIM CI': 100000, 'SIM CII': 100000 };
  const golI = T.select(Object.keys(PNBP).map((g) => [g, g]), 'SIM C');
  const pnbpI = T.input('text', 'cth: 100000', '100000'); pnbpI.inputMode = 'decimal';
  const sehatI = T.input('text', 'cth: 35000', '35000'); sehatI.inputMode = 'decimal';
  const psikoI = T.input('text', 'cth: 77500', '77500'); psikoI.inputMode = 'decimal';
  const asuransiWrap = T.el('<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 0;cursor:pointer"><input type="checkbox"> <span>Tambah asuransi (opsional, tidak wajib)</span></label>');
  const asuransiBox = asuransiWrap.querySelector('input');
  const asuransiI = T.input('text', 'cth: 50000', '50000'); asuransiI.inputMode = 'decimal';
  const box = T.out();

  const kvTable = (pairs) => '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
    pairs.map((p) => '<tr><td style="padding:7px 4px;color:#a8a29e">' + T.esc(p[0]) + '</td>' +
      '<td style="padding:7px 4px;text-align:right;font-weight:600">' + p[1] + '</td></tr>').join('') + '</table>';

  const hitung = () => {
    const pnbp = parseRp(pnbpI.value) || 0;
    const sehat = parseRp(sehatI.value) || 0;
    const psiko = parseRp(psikoI.value) || 0;
    const asuransi = asuransiBox.checked ? (parseRp(asuransiI.value) || 0) : 0;
    const total = pnbp + sehat + psiko + asuransi;
    const rows = [
      ['PNBP ' + golI.value + ' (penerimaan negara)', T.rp(pnbp)],
      ['Tes kesehatan', T.rp(sehat)],
      ['Tes psikologi', T.rp(psiko)],
    ];
    if (asuransiBox.checked) rows.push(['Asuransi (opsional)', T.rp(asuransi)]);
    T.show(box,
      kvTable(rows) +
      '<div class="big" style="margin-top:10px">' + T.rp(total) + '</div>' +
      '<p class="hint">Perkiraan total untuk ' + T.esc(golI.value) + ' baru' + (asuransiBox.checked ? ', termasuk asuransi.' : ' — belum termasuk asuransi (opsional, tidak wajib).') +
      ' PNBP mengacu PP 76/2020. Tarif tes kesehatan & psikologi beda-beda per daerah dan Satpas — angka di atas nilai umum 2026, ubah sesuai daerahmu. Kalau ada yang minta jauh lebih mahal dari ini, hati-hati calo.</p>');
  };

  golI.addEventListener('change', () => { pnbpI.value = String(PNBP[golI.value] || 0); hitung(); });
  asuransiBox.addEventListener('change', hitung);
  [pnbpI, sehatI, psikoI, asuransiI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Biaya bikin SIM baru itu PNBP + tes kesehatan + tes psikologi. Hitung dulu di sini biar tidak kaget di Satpas dan tidak termakan calo.</p>'));
  root.appendChild(T.grid2(
    T.field('Golongan SIM', golI),
    T.field('PNBP (Rp)', pnbpI, 'Terisi otomatis, bisa diubah'),
    T.field('Tes kesehatan (Rp)', sehatI, 'Sekitar Rp35.000, beda per daerah'),
    T.field('Tes psikologi (Rp)', psikoI, 'Rp77.500 lewat ePPsi, s.d. Rp100.000 di Satpas')
  ));
  root.appendChild(asuransiWrap);
  root.appendChild(T.field('Biaya asuransi (Rp)', asuransiI, 'Opsional — hanya dihitung kalau kotaknya dicentang'));
  root.appendChild(T.row(T.btn('Hitung total', hitung, true)));
  root.appendChild(box);
  root.appendChild(T.el(
    '<p class="mut" style="font-weight:600;margin:16px 0 6px">Syarat bikin SIM baru — centang yang sudah siap</p>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>KTP asli (fotokopi biasanya diminta juga)</span></label>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>Usia minimal 17 tahun</span></label>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>Surat keterangan sehat dari dokter</span></label>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>Surat hasil tes psikologi</span></label>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>Lulus ujian teori (nilai minimal 70)</span></label>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:6px 0;cursor:pointer"><input type="checkbox"> <span>Lulus ujian praktik</span></label>'
  ));
  hitung();
}
