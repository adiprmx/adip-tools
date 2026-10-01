import { h as T, kv } from '../../core.js?v=6.7.0';

export const meta = {"id":"laporan-laba-rugi","name":"Laba Rugi Sederhana","cat":"bisnis","icon":"📒","desc":"Catat pemasukan, HPP & operasional — langsung ketahuan laba bersihmu.","keywords":"laba rugi,pemasukan,hpp,operasional,keuangan usaha,laporan keuangan,margin,untung,rugi"};
export function render(root) {

    const box = T.out();
    const defs = [
      { title: '💰 Pemasukan', ph: 'cth: Jualan kopi' },
      { title: '📦 HPP (harga pokok)', ph: 'cth: Biji kopi & gula' },
      { title: '🧾 Operasional', ph: 'cth: Sewa & listrik' },
    ];

    const hitung = () => {
      const totals = secs.map((s) => s.total());
      const P = totals[0], H = totals[1], O = totals[2];
      const laba = P - H - O;
      const margin = P > 0 ? (laba / P * 100) : null;
      const warna = laba >= 0 ? '#22c55e' : '#ef4444';
      const status = P === 0 && H === 0 && O === 0
        ? 'isi baris-baris di atas dulu'
        : (laba >= 0 ? 'itu laba bersihmu — pertahankan!' : 'kamu masih rugi — cek lagi biayanya');
      const marginTxt = margin == null ? '—'
        : margin.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%';
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + T.rp(laba) + '</div>' +
        '<p class="center">' + T.esc(status) + '</p>' +
        kv('Total pemasukan', T.rp(P)) +
        kv('Total HPP', T.rp(H)) +
        kv('Total operasional', T.rp(O)) +
        kv('Margin laba', marginTxt) +
        '<p class="hint">Laba = pemasukan − HPP − operasional. Margin = laba ÷ pemasukan.</p>');
    };

    const makeSection = (def) => {
      const noms = [];
      const wrap = T.el('<div style="margin-bottom:14px"></div>');
      wrap.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">' + T.esc(def.title) + '</div>'));
      const list = T.el('<div></div>');
      wrap.appendChild(list);
      const addRow = () => {
        const r = T.el('<div style="display:flex;gap:6px;margin-bottom:6px"></div>');
        const namaI = T.input('text', def.ph, '');
        namaI.style.flex = '1';
        const nomI = T.input('text', 'Rp', '');
        nomI.style.width = '110px';
        nomI.style.flexShrink = '0';
        nomI.inputMode = 'decimal';
        noms.push(nomI);
        const del = T.btn('✕', () => {
          r.remove();
          noms.splice(noms.indexOf(nomI), 1);
          hitung();
        });
        del.style.flexShrink = '0';
        [namaI, nomI].forEach((i) => i.addEventListener('input', hitung));
        r.appendChild(namaI);
        r.appendChild(nomI);
        r.appendChild(del);
        list.appendChild(r);
        namaI.focus();
      };
      const addB = T.btn('+ Tambah baris', addRow);
      addB.style.marginTop = '2px';
      wrap.appendChild(addB);
      return {
        el: wrap,
        total: () => noms.reduce((a, i) => {
          const n = T.num(i.value);
          return a + (n > 0 ? n : 0);
        }, 0),
        reset: () => {
          list.querySelectorAll('input').forEach((i) => { i.value = ''; });
          hitung();
        },
        _addRow: addRow,
      };
    };

    const secs = defs.map(makeSection);
    root.appendChild(T.el('<p class="note">Tambah baris sebanyak yang kamu butuhkan di tiap bagian — nominalnya dijumlah otomatis.</p>'));
    secs.forEach((s) => { root.appendChild(s.el); s._addRow(); });
    root.appendChild(T.row(T.btn('↺ Reset semua', () => secs.forEach((s) => s.reset()))));
    root.appendChild(box);
    hitung();

}
