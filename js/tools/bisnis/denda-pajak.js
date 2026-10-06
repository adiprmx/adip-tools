import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "denda-pajak", "name": "Kalkulator Denda Pajak", "cat": "bisnis", "icon": "🧾", "desc": "Estimasi denda telat lapor & bayar pajak.", "keywords": "pajak,denda,spt,telat", "file": "tools/bisnis/denda-pajak.js"};

export function render(root) {
  const jenis = T.select([
    ['spt-op', 'SPT Tahunan Orang Pribadi — telat lapor'],
    ['spt-badan', 'SPT Tahunan Badan — telat lapor'],
    ['spt-masa', 'SPT Masa — telat lapor'],
    ['telat-bayar', 'Telat bayar / setor pajak (bunga per bulan)']
  ], 'spt-op');

  const masaDenda = T.select([
    ['100000', 'Rp100.000 (denda SPT Masa ringan)'],
    ['200000', 'Rp200.000'],
    ['500000', 'Rp500.000 (denda SPT Masa maks)']
  ], '100000');

  const pokok = T.input('text', 'cth: 5000000');
  pokok.inputMode = 'decimal';
  const persen = T.input('text', 'cth: 1', '1');
  persen.inputMode = 'decimal';
  const bulan = T.input('text', 'cth: 3');
  bulan.inputMode = 'numeric';

  const box = T.out();

  const wrapMasa = T.el('<div></div>');
  const wrapBayar = T.el('<div></div>');

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
    const p = T.num(pokok.value);
    const b = T.num(persen.value);
    const m = T.num(bulan.value);
    if (p <= 0) { T.show(box, '<p class="warn">Isi pokok pajak dulu (angka > 0).</p>'); return; }
    if (b < 0) { T.show(box, '<p class="warn">Persen bunga tidak boleh negatif.</p>'); return; }
    if (m <= 0) { T.show(box, '<p class="warn">Isi jumlah bulan telat (angka > 0).</p>'); return; }
    const denda = p * (b / 100) * m;
    const total = p + denda;
    T.show(box,
      '<p class="mut" style="font-size:13px">Jenis pelanggaran</p>' +
      '<div class="big" style="font-size:15px">Telat bayar / setor — bunga ' + T.esc(bulan.value) + ' bulan × ' + T.esc(persen.value) + '%</div>' +
      '<table style="width:100%;font-size:14px;margin-top:8px;border-collapse:collapse">' +
      '<tr><td style="padding:4px 0">Pokok pajak</td><td style="text-align:right">' + T.rp(p) + '</td></tr>' +
      '<tr><td style="padding:4px 0">Bunga (' + T.esc(String(b)) + '% × ' + T.esc(String(m)) + ' bulan)</td><td style="text-align:right">' + T.rp(denda) + '</td></tr>' +
      '<tr><td style="padding:4px 0;border-top:1px solid #ffffff20;font-weight:700">Total bayar</td><td style="text-align:right;font-weight:700">' + T.rp(total) + '</td></tr>' +
      '</table>' +
      '<p class="mut" style="font-size:12px;margin-top:8px">Estimasi, bukan ketentuan resmi.</p>');
  };

  const aturForm = () => {
    wrapMasa.style.display = jenis.value === 'spt-masa' ? '' : 'none';
    wrapBayar.style.display = jenis.value === 'telat-bayar' ? '' : 'none';
    T.hide(box);
  };
  jenis.addEventListener('change', aturForm);

  wrapMasa.appendChild(T.field('Besaran denda SPT Masa', masaDenda));
  wrapBayar.appendChild(T.field('Pokok pajak (Rp)', pokok));
  wrapBayar.appendChild(T.field('Bunga per bulan (%)', persen));
  wrapBayar.appendChild(T.field('Jumlah bulan telat', bulan));

  root.appendChild(T.field('Jenis pelanggaran', jenis, 'Denda telat lapor mengacu pada tarif UU KUP.'));
  root.appendChild(wrapMasa);
  root.appendChild(wrapBayar);
  root.appendChild(T.row(T.btn('Hitung Denda', hitung, true)));
  root.appendChild(box);
  aturForm();
}
