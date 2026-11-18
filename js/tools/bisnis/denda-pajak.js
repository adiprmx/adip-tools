import { h as T } from '../../core.js';

export const meta = {"id": "denda-pajak", "name": "Kalkulator Denda Pajak", "cat": "bisnis", "icon": "🧾", "desc": "Estimasi denda telat lapor & bayar pajak, termasuk hitungan gabungan denda + bunga SPT Tahunan.", "keywords": "pajak,denda,spt,telat,spt tahunan,bunga,djp,wajib pajak", "file": "tools/bisnis/denda-pajak.js"};

export function render(root) {
  const jenis = T.select([
    ['spt-op', 'SPT Tahunan Orang Pribadi — telat lapor'],
    ['spt-badan', 'SPT Tahunan Badan — telat lapor'],
    ['spt-masa', 'SPT Masa — telat lapor'],
    ['spt-gabung', 'SPT Tahunan — denda + bunga sekaligus'],
    ['telat-bayar', 'Telat bayar / setor pajak (bunga per bulan)']
  ], 'spt-op');

  const masaDenda = T.select([
    ['100000', 'Rp100.000 (SPT Masa lainnya)'],
    ['500000', 'Rp500.000 (SPT Masa PPN)']
  ], '100000');

  const pokok = T.input('text', 'cth: 5000000');
  pokok.inputMode = 'decimal';
  const persen = T.input('text', 'cth: 1', '1');
  persen.inputMode = 'decimal';
  const bulan = T.input('text', 'cth: 3');
  bulan.inputMode = 'numeric';

  // Mode gabungan (dari tool Denda Telat Lapor SPT): denda tetap + bunga
  // atas pajak terutang dalam satu hitungan. Bunga = (BI Rate + 5%) / 12
  // per bulan, maksimal 24 bulan. Default BI 5,75% (RDG 20–21 Okt 2026,
  // masih berlaku Nov 2026).
  const gabungWp = T.select([['op', 'Orang Pribadi'], ['badan', 'Badan']], 'op');
  const gabungBln = T.input('number', 'Telat berapa bulan', '1');
  const gabungPajak = T.input('text', 'Pajak terutang (Rp, boleh 0)', '0');
  const gabungBi = T.input('text', 'cth: 5,75', '5,75');
  gabungBi.inputMode = 'decimal';

  const box = T.out();

  const wrapMasa = T.el('<div></div>');
  const wrapBayar = T.el('<div></div>');
  const wrapGabung = T.el('<div></div>');

  const hitung = () => {
    const j = jenis.value;
    if (j === 'spt-op') {
      T.show(box,
        '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
        '<div class="big" style="font-size:15px">SPT Tahunan Orang Pribadi — telat lapor</div>' +
        '<div class="big ok" style="font-size:26px;margin-top:8px">' + T.rp(100000) + '</div>' +
        '<p class="mut" style="font-size:13px">Denda administrasi tetap (UU KUP).</p>' +
        '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
      return;
    }
    if (j === 'spt-badan') {
      T.show(box,
        '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
        '<div class="big" style="font-size:15px">SPT Tahunan Badan — telat lapor</div>' +
        '<div class="big ok" style="font-size:26px;margin-top:8px">' + T.rp(1000000) + '</div>' +
        '<p class="mut" style="font-size:13px">Denda administrasi tetap (UU KUP).</p>' +
        '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
      return;
    }
    if (j === 'spt-masa') {
      const d = T.num(masaDenda.value);
      T.show(box,
        '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
        '<div class="big" style="font-size:15px">SPT Masa — telat lapor</div>' +
        '<div class="big ok" style="font-size:26px;margin-top:8px">' + T.rp(d) + '</div>' +
        '<p class="mut" style="font-size:13px">Denda administrasi tetap (UU KUP).</p>' +
        '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
      return;
    }
    if (j === 'spt-gabung') {
      const bln = Math.floor(Number(gabungBln.value));
      const terutang = T.num(gabungPajak.value);
      const bi = T.num(gabungBi.value);
      if (!(bln >= 0) || !(terutang >= 0) || !(bi >= 0)) { T.show(box, '<p class="warn">Isi bulan, pajak terutang, dan suku bunga BI dengan angka yang benar ya.</p>'); return; }
      const blnHitung = Math.min(bln, 24);
      const bungaPersen = (bi + 5) / 12;
      const dendaTetap = gabungWp.value === 'badan' ? 1000000 : 100000;
      const bunga = (bungaPersen / 100) * blnHitung * terutang;
      const total = dendaTetap + bunga;
      T.show(box,
        '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
        '<div class="big" style="font-size:15px">SPT Tahunan ' + (gabungWp.value === 'badan' ? 'Badan' : 'Orang Pribadi') + ' — denda + bunga</div>' +
        '<table style="width:100%;font-size:14px;margin-top:8px;border-collapse:collapse">' +
        '<tr><td style="padding:4px 0">Denda telat lapor</td><td style="text-align:right">' + T.rp(dendaTetap) + '</td></tr>' +
        '<tr><td style="padding:4px 0">Bunga (' + bungaPersen.toFixed(2).replace('.', ',') + '%/bln × ' + blnHitung + ' bln)</td><td style="text-align:right">' + T.rp(bunga) + '</td></tr>' +
        '<tr><td style="padding:4px 0;border-top:1px solid #ffffff20;font-weight:700">Total sanksi</td><td style="text-align:right;font-weight:700">' + T.rp(total) + '</td></tr>' +
        '</table>' +
        '<p class="mut" style="font-size:12px;margin-top:8px">Denda Orang Pribadi Rp100rb / Badan Rp1jt. Bunga = (suku bunga acuan BI + 5%) ÷ 12 per bulan, maksimal 24 bulan — dengan BI Rate 5,75% jadi ±0,90%/bulan. Tarif resmi tiap bulan ditetapkan lewat KMK, jadi angka pastinya cek di pajak.go.id ya.</p>' +
        '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
      return;
    }
    const p = T.num(pokok.value);
    const b = T.num(persen.value);
    const mRaw = T.num(bulan.value);
    const m = Math.min(mRaw, 24);
    if (p <= 0) { T.show(box, '<p class="warn">Isi pokok pajak dulu (angka > 0).</p>'); return; }
    if (b < 0) { T.show(box, '<p class="warn">Persen bunga tidak boleh negatif.</p>'); return; }
    if (m <= 0) { T.show(box, '<p class="warn">Isi jumlah bulan telat (angka > 0).</p>'); return; }
    const denda = p * (b / 100) * m;
    const total = p + denda;
    T.show(box,
      '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
      '<div class="big" style="font-size:15px">Telat bayar / setor — bunga ' + T.esc(String(m)) + ' bulan × ' + T.esc(persen.value) + '%</div>' +
      '<table style="width:100%;font-size:14px;margin-top:8px;border-collapse:collapse">' +
      '<tr><td style="padding:4px 0">Pokok pajak</td><td style="text-align:right">' + T.rp(p) + '</td></tr>' +
      '<tr><td style="padding:4px 0">Bunga (' + T.esc(String(b)) + '% × ' + T.esc(String(m)) + ' bulan)</td><td style="text-align:right">' + T.rp(denda) + '</td></tr>' +
      '<tr><td style="padding:4px 0;border-top:1px solid #ffffff20;font-weight:700">Total bayar</td><td style="text-align:right;font-weight:700">' + T.rp(total) + '</td></tr>' +
      '</table>' +
      (mRaw > 24 ? '<p class="mut" style="font-size:12px;margin-top:8px">Bulan telat dibatasi 24 bulan — bunga sanksi pajak maksimal 24 bulan (UU KUP).</p>' : '') +
      '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
  };

  const aturForm = () => {
    wrapMasa.style.display = jenis.value === 'spt-masa' ? '' : 'none';
    wrapBayar.style.display = jenis.value === 'telat-bayar' ? '' : 'none';
    wrapGabung.style.display = jenis.value === 'spt-gabung' ? '' : 'none';
    T.hide(box);
  };
  jenis.addEventListener('change', aturForm);

  wrapMasa.appendChild(T.field('Besaran denda SPT Masa', masaDenda));
  wrapBayar.appendChild(T.field('Pokok pajak (Rp)', pokok));
  wrapBayar.appendChild(T.field('Bunga per bulan (%)', persen));
  wrapBayar.appendChild(T.field('Jumlah bulan telat', bulan, 'Maksimal 24 bulan.'));
  wrapGabung.appendChild(T.field('Wajib Pajak', gabungWp));
  wrapGabung.appendChild(T.grid2(T.field('Keterlambatan (bulan)', gabungBln), T.field('Pajak terutang (Rp)', gabungPajak)));
  wrapGabung.appendChild(T.field('Suku bunga acuan BI (% per tahun)', gabungBi, 'Default 5,75% (Nov 2026) — ubah bila BI Rate sudah berubah.'));

  root.appendChild(T.field('Jenis pelanggaran', jenis, 'Denda telat lapor mengacu pada tarif UU KUP.'));
  root.appendChild(wrapMasa);
  root.appendChild(wrapBayar);
  root.appendChild(wrapGabung);
  root.appendChild(T.row(T.btn('Hitung Denda', hitung, true)));
  root.appendChild(box);
  aturForm();
}
