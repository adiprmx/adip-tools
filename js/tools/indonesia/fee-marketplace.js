import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id": "fee-marketplace", "name": "Fee Admin Marketplace", "cat": "indonesia", "icon": "🛒", "desc": "Bandingin fee admin Shopee, Tokopedia & TikTok Shop.", "keywords": "fee,admin,marketplace,shopee,tokopedia,tiktok,komisi,seller"};
export function render(root) {
  const MP = [
    { name: 'Shopee', fee: 10 },
    { name: 'Tokopedia', fee: 10 },
    { name: 'TikTok Shop', fee: 8 },
  ];
  const harga = T.input('text', 'Contoh: 100000');
  harga.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const h = T.num(harga.value) || 0;
    if (h <= 0) { T.show(box, '<p class="hint">Isi harga jualnya dulu ya.</p>'); return; }
    const rows = MP.map((m) => {
      const f = Math.min(100, Math.max(0, T.num(m.feeInp.value) || 0));
      const fix = Math.max(0, T.num(m.fixInp.value) || 0);
      const feeRp = Math.round(h * f / 100) + Math.round(fix);
      const bersih = Math.max(0, h - feeRp);
      return { m, f, fix, feeRp, bersih };
    });
    const maxBersih = Math.max(...rows.map((r) => r.bersih));
    let html = '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">' +
      '<tr><td></td><td class="mut" style="padding:7px 8px">Fee</td><td class="mut" style="padding:7px 8px">Bersih diterima</td></tr>';
    rows.forEach((r) => {
      const juara = r.bersih === maxBersih ? ' <b>← paling cuan</b>' : '';
      html += '<tr>' +
        '<td style="padding:7px 8px;border-bottom:1px solid #251f18;vertical-align:top">' + T.esc(r.m.name) + juara + '</td>' +
        '<td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;vertical-align:top">' + T.rp(r.feeRp) + '<br><span class="mut" style="font-size:11px">' + T.esc(String(r.f)) + '% + ' + T.rp(r.fix) + '</span></td>' +
        '<td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;vertical-align:top"><b>' + T.rp(r.bersih) + '</b></td>' +
        '</tr>';
    });
    html += '</table>';
    html += '<p class="hint">Fee % dan biaya tetap bisa kamu ubah sesuai akun sellermu — tiap toko bisa beda. Ini estimasi aja, angka resminya cek di seller center masing-masing ya.</p>';
    T.show(box, html);
  };

  MP.forEach((m) => {
    m.feeInp = T.input('number', '% fee', String(m.fee));
    m.feeInp.min = '0';
    m.feeInp.max = '100';
    m.fixInp = T.input('text', 'Rp 0', '0');
    m.fixInp.inputMode = 'decimal';
    const card = T.el('<div></div>');
    card.appendChild(T.el('<div style="font-weight:600;margin-bottom:6px">' + T.esc(m.name) + '</div>'));
    card.appendChild(T.field('Fee (%)', m.feeInp));
    card.appendChild(T.field('Biaya tetap (Rp)', m.fixInp));
    m.card = card;
    m.feeInp.addEventListener('input', hitung);
    m.fixInp.addEventListener('input', hitung);
  });

  root.appendChild(T.field('Harga jual (Rp)', harga));
  const cols = T.el('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px"></div>');
  MP.forEach((m) => cols.appendChild(m.card));
  root.appendChild(cols);
  root.appendChild(box);
  harga.addEventListener('input', hitung);
  hitung();
}
