import { h as T, utils, kv, rp, num } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): ringkasan dari baris { nama, kategori, jumlah }.
utils.cashflowRingkasan = function (masuk, keluar) {
  const agg = (rows) => {
    let total = 0; const perKat = {};
    (rows || []).forEach((r) => {
      const v = Math.abs(Number(r.jumlah) || 0);
      if (v > 0) { total += v; const k = r.kategori || 'Lainnya'; perKat[k] = (perKat[k] || 0) + v; }
    });
    return { total, perKat };
  };
  const m = agg(masuk), k = agg(keluar);
  return { masuk: m.total, keluar: k.total, saldo: m.total - k.total, perKatMasuk: m.perKat, perKatKeluar: k.perKat };
};

const IN_CATS = ['Gaji', 'Usaha', 'Investasi', 'Lainnya'];
const OUT_CATS = ['Makan', 'Transport', 'Hunian', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Lainnya'];
const BLN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const meta = {"id": "kalkulator-cashflow", "name": "Arus Kas", "cat": "bisnis", "icon": "💹", "desc": "Catat pemasukan & pengeluaran bulanan per kategori, lihat sisa kas & trennya.", "keywords": "cashflow,arus kas,pemasukan,pengeluaran,surplus,defisit,keuangan,kategori,tren"};

export function render(root) {

    const K = 'adip.cashflow.v1';
    const KH = 'adip.cashflow.history.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
    const loadHist = () => { try { return JSON.parse(localStorage.getItem(KH) || '{}') || {}; } catch (e) { return {}; } };
    const saved = load();

    const box = T.out();
    const chartBox = T.out();

    const makeRow = (nama, jumlah, kategori, cats) => {
      const wrap = T.el('<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"></div>');
      const nI = T.input('text', 'cth: Gaji / Sewa ruko', nama || '');
      nI.style.flex = '1.4';
      nI.style.minWidth = '120px';
      const cI = T.select(cats.map((c) => [c, c]), cats.includes(kategori) ? kategori : cats[cats.length - 1]);
      cI.style.flex = '1';
      cI.style.minWidth = '110px';
      const jI = T.input('text', 'Rp', jumlah || '');
      jI.style.flex = '1';
      jI.style.minWidth = '100px';
      const del = T.btn('✕', () => { wrap.remove(); calc(); });
      del.setAttribute('aria-label', 'Hapus baris');
      wrap.appendChild(nI); wrap.appendChild(cI); wrap.appendChild(jI); wrap.appendChild(del);
      return { wrap, nI, cI, jI };
    };

    const inBox = T.el('<div style="margin-bottom:14px"></div>');
    const outBox = T.el('<div style="margin-bottom:14px"></div>');
    const inRows = [], outRows = [];

    const seed = saved || { in: [{ nama: 'Gaji / usaha utama', jumlah: '', kategori: 'Gaji' }], out: [{ nama: 'Sewa kos', jumlah: '', kategori: 'Hunian' }, { nama: 'Makan', jumlah: '', kategori: 'Makan' }] };
    seed.in.forEach((r) => { const x = makeRow(r.nama, r.jumlah, r.kategori, IN_CATS); inBox.appendChild(x.wrap); inRows.push(x); });
    seed.out.forEach((r) => { const x = makeRow(r.nama, r.jumlah, r.kategori, OUT_CATS); outBox.appendChild(x.wrap); outRows.push(x); });

    let lastTotals = { masuk: 0, keluar: 0 };

    const calc = () => {
      const keBaris = (rows) => rows.map(({ nI, cI, jI }) => ({ nama: (nI.value || '(tanpa nama)').trim(), kategori: cI.value || 'Lainnya', jumlah: num(jI.value) }));
      const ring = utils.cashflowRingkasan(keBaris(inRows), keBaris(outRows));
      const itemsDari = (rows) => keBaris(rows).filter((r) => isFinite(r.jumlah) && r.jumlah !== 0).map((r) => ({ nama: r.nama, v: Math.abs(r.jumlah) }));
      const m = { total: ring.masuk, items: itemsDari(inRows), perKat: ring.perKatMasuk };
      const k = { total: ring.keluar, items: itemsDari(outRows), perKat: ring.perKatKeluar };
      const saldo = ring.saldo;
      const status = saldo >= 0 ? 'Surplus' : 'Defisit';
      lastTotals = { masuk: m.total, keluar: k.total };
      try { localStorage.setItem(K, JSON.stringify({ in: inRows.map(({ nI, cI, jI }) => ({ nama: nI.value, kategori: cI.value, jumlah: jI.value })), out: outRows.map(({ nI, cI, jI }) => ({ nama: nI.value, kategori: cI.value, jumlah: jI.value })) })); } catch (e) {}
      let ringkas;
      if (saldo >= 0) ringkas = 'Sisa ' + rp(saldo) + '. Bagus, sisanya bisa ditabung atau diputer jadi modal.';
      else ringkas = 'Kurang ' + rp(-saldo) + '. Pengeluaran lebih besar dari pemasukan, coba pangkas yang paling gede dulu.';
      const katHtml = (perKat, total) => {
        const arr = Object.entries(perKat).sort((a, b) => b[1] - a[1]);
        if (!arr.length) return '';
        return arr.map(([kat, v]) => {
          const pct = total > 0 ? Math.round(v / total * 100) : 0;
          return '<div class="kv"><span class="k">' + T.esc(kat) + ' (' + pct + '%)</span><span class="v">' + rp(v) + '</span></div>';
        }).join('');
      };
      // Patokan 50/30/20 dari total pemasukan: 50% kebutuhan, 30% keinginan,
      // 20% tabungan/investasi.
      const bagiHtml = m.total > 0
        ? '<h3 style="font-size:14px;margin:10px 0 4px">Patokan 50 / 30 / 20 dari pemasukan</h3>' +
          kv('Kebutuhan (50%)', rp(Math.round(m.total * 0.5))) +
          kv('Keinginan (30%)', rp(Math.round(m.total * 0.3))) +
          kv('Tabungan & investasi (20%)', rp(Math.round(m.total * 0.2))) +
          '<p class="hint">Ini patokan umum mengatur uang, bukan aturan wajib. Bila pengeluarannya sudah di atas 50% untuk kebutuhan pokok, sesuaikan porsinya dulu.</p>'
        : '';
      T.show(box,
        '<div class="big center">' + rp(saldo) + '</div>' +
        '<p class="center"><b>' + status + '</b>, sisa kas bulan ini</p>' +
        kv('Total pemasukan', rp(m.total)) +
        kv('Total pengeluaran', rp(k.total)) +
        (Object.keys(m.perKat).length ? '<h3 style="font-size:14px;margin:10px 0 4px">Pemasukan per kategori</h3>' + katHtml(m.perKat, m.total) : '') +
        (Object.keys(k.perKat).length ? '<h3 style="font-size:14px;margin:10px 0 4px">Pengeluaran per kategori</h3>' + katHtml(k.perKat, k.total) : '') +
        (m.items.length ? '<p class="hint">Masuk: ' + m.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (m.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        (k.items.length ? '<p class="hint">Keluar: ' + k.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (k.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        '<p class="note">' + T.esc(ringkas) + '</p>' +
        bagiHtml);
    };

    const eksporCsv = () => {
      calc();
      const escCsv = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      const barisCsv = (jenis, rows) => rows.map(({ nI, cI, jI }) => {
        const v = num(jI.value);
        if (!isFinite(v) || v === 0) return null;
        return [jenis, (nI.value || '(tanpa nama)').trim(), cI.value || 'Lainnya', Math.abs(v)].map(escCsv).join(',');
      }).filter(Boolean);
      const isi = ['Jenis,Nama,Kategori,Jumlah (Rp)']
        .concat(barisCsv('Masuk', inRows), barisCsv('Keluar', outRows))
        .concat([
          ['Total', 'Pemasukan', '', lastTotals.masuk].map(escCsv).join(','),
          ['Total', 'Pengeluaran', '', lastTotals.keluar].map(escCsv).join(','),
          ['Total', 'Sisa kas', '', lastTotals.masuk - lastTotals.keluar].map(escCsv).join(','),
        ]).join('\n');
      const d = new Date();
      const nama = 'arus-kas-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '.csv';
      T.dl(nama, isi, 'text/csv');
      T.toast('CSV terunduh');
    };

    const renderChart = () => {
      const hist = loadHist();
      const keys = Object.keys(hist).sort().slice(-12);
      if (!keys.length) {
        T.show(chartBox, '<h3 style="font-size:14px;margin:14px 0 6px">Tren bulanan</h3><p class="hint">Belum ada riwayat. Tekan "Simpan bulan ini" tiap akhir bulan supaya tren pemasukan dan pengeluaranmu kelihatan di sini.</p>');
        return;
      }
      let max = 0;
      keys.forEach((k) => { max = Math.max(max, hist[k].masuk || 0, hist[k].keluar || 0); });
      const bar = (label, val, warna) => {
        const pct = max > 0 ? Math.max(2, Math.round(val / max * 100)) : 0;
        return '<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="width:46px;font-size:11px;opacity:.7">' + T.esc(label) + '</span>' +
          '<div style="flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + warna + '"></div></div>' +
          '<span style="font-size:11px;width:92px;text-align:right;white-space:nowrap">' + rp(val) + '</span></div>';
      };
      let rows = '';
      keys.forEach((k) => {
        const [y, mo] = k.split('-');
        const label = BLN_SINGKAT[Number(mo) - 1] + ' ' + y;
        const s = (hist[k].masuk || 0) - (hist[k].keluar || 0);
        rows += '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><b>' + T.esc(label) + '</b>' +
          '<span style="color:' + (s >= 0 ? '#4ade80' : '#f87171') + '">Sisa ' + rp(s) + '</span></div>' +
          bar('Masuk', hist[k].masuk || 0, '#ffffff') + bar('Keluar', hist[k].keluar || 0, '#9ca3af') + '</div>';
      });
      T.show(chartBox, '<h3 style="font-size:14px;margin:14px 0 6px">Tren bulanan (12 bulan terakhir)</h3>' + rows);
    };

    const bulanIni = () => {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    };
    const simpanBulan = () => {
      calc();
      const hist = loadHist();
      hist[bulanIni()] = { masuk: lastTotals.masuk, keluar: lastTotals.keluar };
      try { localStorage.setItem(KH, JSON.stringify(hist)); } catch (e) {}
      T.toast('Bulan ini tersimpan di tren.');
      renderChart();
    };
    const hapusRiwayat = () => {
      try { localStorage.removeItem(KH); } catch (e) {}
      T.toast('Riwayat tren dihapus.');
      renderChart();
    };

    const bindRowEvents = (x) => {
      x.nI.addEventListener('input', calc);
      x.jI.addEventListener('input', calc);
      x.cI.addEventListener('change', calc);
    };
    inRows.forEach(bindRowEvents);
    outRows.forEach(bindRowEvents);

    root.appendChild(T.el('<p class="note">Biar dompet nggak bocor, tulis semua uang masuk dan keluar <b>satu bulan</b>, terus lihat sisanya.</p>'));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💰 Pemasukan</h3>'));
    root.appendChild(inBox);
    root.appendChild(T.row(T.btn('+ Tambah pemasukan', () => { const x = makeRow('', '', 'Lainnya', IN_CATS); inBox.appendChild(x.wrap); inRows.push(x); bindRowEvents(x); calc(); })));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💸 Pengeluaran</h3>'));
    root.appendChild(outBox);
    root.appendChild(T.row(T.btn('+ Tambah pengeluaran', () => { const x = makeRow('', '', 'Lainnya', OUT_CATS); outBox.appendChild(x.wrap); outRows.push(x); bindRowEvents(x); calc(); })));
    root.appendChild(T.row(T.btn('Hitung Arus Kas', calc, true)));
    root.appendChild(box);
    root.appendChild(T.row(T.btn('Simpan bulan ini', simpanBulan), T.btn('Unduh CSV', eksporCsv), T.btn('Hapus riwayat tren', hapusRiwayat)));
    root.appendChild(chartBox);
    calc();
    renderChart();
}
