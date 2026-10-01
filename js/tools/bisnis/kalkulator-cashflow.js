import { h as T, kv, rp, num } from '../../core.js?v=6.8.0';

export const meta = {"id": "kalkulator-cashflow", "name": "Arus Kas", "cat": "bisnis", "icon": "💹", "desc": "Catat pemasukan & pengeluaran bulanan, ketahuan sisa kasnya.", "keywords": "cashflow,arus kas,pemasukan,pengeluaran,surplus,defisit,keuangan"};

export function render(root) {

    const K = 'adip.cashflow.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
    const saved = load();

    const box = T.out();

    const makeRow = (nama, jumlah) => {
      const wrap = T.el('<div style="display:flex;gap:8px;margin-bottom:8px"></div>');
      const nI = T.input('text', 'cth: Gaji / Sewa ruko', nama || '');
      nI.style.flex = '1.4';
      const jI = T.input('text', 'Rp', jumlah || '');
      jI.style.flex = '1';
      const del = T.btn('✕', () => { wrap.remove(); calc(); });
      wrap.appendChild(nI); wrap.appendChild(jI); wrap.appendChild(del);
      return { wrap, nI, jI };
    };

    const inBox = T.el('<div style="margin-bottom:14px"></div>');
    const outBox = T.el('<div style="margin-bottom:14px"></div>');
    const inRows = [], outRows = [];

    const seed = saved || { in: [{ nama: 'Gaji / usaha utama', jumlah: '' }], out: [{ nama: 'Sewa kos', jumlah: '' }, { nama: 'Makan', jumlah: '' }] };
    seed.in.forEach((r) => { const x = makeRow(r.nama, r.jumlah); inBox.appendChild(x.wrap); inRows.push(x); });
    seed.out.forEach((r) => { const x = makeRow(r.nama, r.jumlah); outBox.appendChild(x.wrap); outRows.push(x); });

    const calc = () => {
      const sumRows = (rows) => {
        let total = 0; const items = [];
        rows.forEach(({ nI, jI }) => {
          const v = num(jI.value);
          if (isFinite(v) && v !== 0) {
            total += Math.abs(v);
            items.push({ nama: (nI.value || '(tanpa nama)').trim(), v: Math.abs(v) });
          }
        });
        return { total, items };
      };
      const m = sumRows(inRows), k = sumRows(outRows);
      const saldo = m.total - k.total;
      const status = saldo >= 0 ? 'Surplus' : 'Defisit';
      try { localStorage.setItem(K, JSON.stringify({ in: inRows.map(({ nI, jI }) => ({ nama: nI.value, jumlah: jI.value })), out: outRows.map(({ nI, jI }) => ({ nama: nI.value, jumlah: jI.value })) })); } catch (e) {}
      let ringkas;
      if (saldo >= 0) ringkas = 'Sisa ' + rp(saldo) + ' — bagus, sisanya bisa ditabung atau diputer jadi modal.';
      else ringkas = 'Kurang ' + rp(-saldo) + ' — pengeluaran lebih besar dari pemasukan, coba pangkas yang paling gede dulu.';
      T.show(box,
        '<div class="big center">' + rp(saldo) + '</div>' +
        '<p class="center"><b>' + status + '</b> — sisa kas bulan ini</p>' +
        kv('Total pemasukan', rp(m.total)) +
        kv('Total pengeluaran', rp(k.total)) +
        (m.items.length ? '<p class="hint">Masuk: ' + m.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (m.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        (k.items.length ? '<p class="hint">Keluar: ' + k.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (k.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        '<p class="note">' + T.esc(ringkas) + '</p>');
    };

    root.appendChild(T.el('<p class="note">Biar dompet nggak bocor — tulis semua uang masuk dan keluar <b>satu bulan</b>, terus lihat sisanya.</p>'));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💰 Pemasukan</h3>'));
    root.appendChild(inBox);
    root.appendChild(T.row(T.btn('+ Tambah pemasukan', () => { const x = makeRow('', ''); inBox.appendChild(x.wrap); inRows.push(x); calc(); })));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💸 Pengeluaran</h3>'));
    root.appendChild(outBox);
    root.appendChild(T.row(T.btn('+ Tambah pengeluaran', () => { const x = makeRow('', ''); outBox.appendChild(x.wrap); outRows.push(x); calc(); })));
    root.appendChild(T.row(T.btn('Hitung Arus Kas', calc, true)));
    root.appendChild(box);
    calc();
}
