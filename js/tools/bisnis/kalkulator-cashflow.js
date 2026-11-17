import { h as T, utils, kv, rp, num } from '../../core.js';

// Logika murni (bisa di-test di Node): ringkasan dari baris { nama, kategori, jumlah }.
// Tiap baris dibatasi Rp1.000 triliun supaya jumlah absurd (mis. 1e308) tidak
// membuat total jadi Infinity dan saldo jadi NaN (Infinity − Infinity).
const CASHFLOW_MAKS_BARIS = 1e15;
utils.cashflowRingkasan = function (masuk, keluar) {
  const agg = (rows) => {
    let total = 0; const perKat = {};
    (rows || []).forEach((r) => {
      const v = Math.min(Math.abs(Number(r.jumlah) || 0), CASHFLOW_MAKS_BARIS);
      if (v > 0) { total += v; const k = r.kategori || 'Lainnya'; perKat[k] = (perKat[k] || 0) + v; }
    });
    return { total, perKat };
  };
  const m = agg(masuk), k = agg(keluar);
  return { masuk: m.total, keluar: k.total, saldo: m.total - k.total, perKatMasuk: m.perKat, perKatKeluar: k.perKat };
};

// Parse CSV hasil ekspor tool ini (Jenis,Nama,Kategori,Jumlah) kembali jadi
// baris { jenis, nama, kategori, jumlah }. Baris Total & header dilewati.
// Dibatasi 1.000 baris per impor: 10.000 baris DOM membuat tool tidak responsif
// (15 detik impor + 3,7 dtk per ketikan karena tulis ulang localStorage).
const CASHFLOW_MAKS_IMPOR = 1000;
utils.cashflowParseCsv = function (teks, maks) {
  const batas = Math.max(1, Math.round(maks) || CASHFLOW_MAKS_IMPOR);
  const baris = [];
  const lines = String(teks || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  lines.forEach((line, idx) => {
    if (baris.length >= batas) return;
    if (!line.trim()) return;
    if (idx === 0 && /^"?Jenis"?/i.test(line.trim())) return;
    const sel = [];
    let cur = '', dalamKutip = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (dalamKutip) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else dalamKutip = false;
        } else cur += ch;
      } else if (ch === '"') dalamKutip = true;
      else if (ch === ',') { sel.push(cur); cur = ''; }
      else cur += ch;
    }
    sel.push(cur);
    if (sel.length < 4) return;
    const jenis = sel[0].trim();
    if (jenis !== 'Masuk' && jenis !== 'Keluar') return;
    const jumlah = num(sel[3].trim());
    if (!isFinite(jumlah) || jumlah === 0) return;
    baris.push({ jenis, nama: sel[1].trim() || '(tanpa nama)', kategori: sel[2].trim() || 'Lainnya', jumlah: Math.abs(jumlah) });
  });
  return baris;
};

const IN_CATS = ['Gaji', 'Usaha', 'Investasi', 'Lainnya'];
const OUT_CATS = ['Makan', 'Transport', 'Hunian', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Lainnya'];
const BLN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const WARNA_KAT = ['#ff6f61', '#f4a259', '#e9c46a', '#2a9d8f', '#8ab4f8', '#b388ff', '#f48fb1', '#9ca3af'];

export const meta = {"id": "kalkulator-cashflow", "name": "Arus Kas", "cat": "bisnis", "icon": "💹", "desc": "Catat pemasukan & pengeluaran bulanan per kategori, diagram lingkaran, transaksi rutin, target tabungan, tren & impor/ekspor CSV.", "keywords": "cashflow,arus kas,pemasukan,pengeluaran,surplus,defisit,keuangan,kategori,tren,rutin,target,tabungan,csv"};

export function render(root) {

    const K = 'adip.cashflow.v1';
    const KH = 'adip.cashflow.history.v1';
    const KR = 'adip.cashflow.rutin.v1';
    const KT = 'adip.cashflow.target.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
    // P-04: entri riwayat yang null / bukan objek (mis. {"2026-11":null})
    // dibuang saat muat — renderChart membaca hist[k].masuk dan akan
    // mati total ("Gagal memuat") bila entri null lolos sampai ke sana.
    const loadHist = () => { try { const v = JSON.parse(localStorage.getItem(KH) || '{}'); if (!v || typeof v !== 'object' || Array.isArray(v)) return {}; const out = {}; for (const k of Object.keys(v)) { const e = v[k]; if (e && typeof e === 'object' && !Array.isArray(e)) out[k] = e; } return out; } catch (e) { return {}; } };
    const loadRutin = () => { try { const v = JSON.parse(localStorage.getItem(KR) || '[]'); return Array.isArray(v) ? v.filter((r) => r && typeof r === 'object') : []; } catch (e) { return []; } };
    const saved = load();

    const box = T.out();
    const chartBox = T.out();

    const makeRow = (nama, jumlah, kategori, cats, rutin) => {
      const wrap = T.el('<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center"></div>');
      const nI = T.input('text', 'cth: Gaji / Sewa ruko', nama || '');
      nI.style.flex = '1.4';
      nI.style.minWidth = '120px';
      const cI = T.select(cats.map((c) => [c, c]), cats.includes(kategori) ? kategori : cats[cats.length - 1]);
      cI.style.flex = '1';
      cI.style.minWidth = '110px';
      const jI = T.input('text', 'Rp', jumlah || '');
      jI.style.flex = '1';
      jI.style.minWidth = '100px';
      const rCek = document.createElement('input');
      rCek.type = 'checkbox';
      rCek.checked = !!rutin;
      rCek.title = 'Rutin tiap bulan';
      rCek.setAttribute('aria-label', 'Rutin tiap bulan');
      const rLbl = T.el('<label style="display:flex;gap:4px;align-items:center;font-size:12px;white-space:nowrap" title="Otomatis dibawa ke bulan berikut saat mulai bulan baru"></label>');
      rLbl.appendChild(rCek);
      rLbl.appendChild(document.createTextNode('Rutin'));
      const del = T.btn('✕', () => {
        // Hapus dari array juga, bukan cuma DOM — kalau tidak, baris tetap
        // dihitung dan bangkit lagi setelah reload (P-R2-01).
        const iIn = inRows.findIndex((r) => r.wrap === wrap);
        if (iIn >= 0) inRows.splice(iIn, 1);
        const iOut = outRows.findIndex((r) => r.wrap === wrap);
        if (iOut >= 0) outRows.splice(iOut, 1);
        wrap.remove(); calc();
      });
      del.setAttribute('aria-label', 'Hapus baris');
      wrap.appendChild(nI); wrap.appendChild(cI); wrap.appendChild(jI); wrap.appendChild(rLbl); wrap.appendChild(del);
      return { wrap, nI, cI, jI, rCek };
    };

    const inBox = T.el('<div style="margin-bottom:14px"></div>');
    const outBox = T.el('<div style="margin-bottom:14px"></div>');
    const inRows = [], outRows = [];

    // Seed localStorage yang rusak/bertipe salah (mis. string, bukan array)
    // tidak boleh mematikan tool ("Gagal memuat") — pakai baris bawaan.
    const seedValid = saved && typeof saved === 'object' && Array.isArray(saved.in) && Array.isArray(saved.out);
    const seed = seedValid
      ? { in: saved.in.filter((r) => r && typeof r === 'object'), out: saved.out.filter((r) => r && typeof r === 'object') }
      : { in: [{ nama: 'Gaji / usaha utama', jumlah: '', kategori: 'Gaji' }], out: [{ nama: 'Sewa kos', jumlah: '', kategori: 'Hunian' }, { nama: 'Makan', jumlah: '', kategori: 'Makan' }] };
    seed.in.forEach((r) => { const x = makeRow(r.nama, r.jumlah, r.kategori, IN_CATS, r.rutin); inBox.appendChild(x.wrap); inRows.push(x); });
    seed.out.forEach((r) => { const x = makeRow(r.nama, r.jumlah, r.kategori, OUT_CATS, r.rutin); outBox.appendChild(x.wrap); outRows.push(x); });

    let lastTotals = { masuk: 0, keluar: 0 };
    let lastPerKat = { masuk: {}, keluar: {} };

    // Tulis localStorage di-debounce 500 ms: menulis ulang seluruh data tiap
    // ketikan membuat tool lambat (3,7 dtk/ketikan pada 10 ribu baris).
    // Ditulis segera saat tool ditinggal / tab ditutup (flushSimpan).
    let simpanTimer = null;
    const simpan = () => {
      try {
        localStorage.setItem(K, JSON.stringify({ in: inRows.map(({ nI, cI, jI, rCek }) => ({ nama: nI.value, kategori: cI.value, jumlah: jI.value, rutin: !!(rCek && rCek.checked) })), out: outRows.map(({ nI, cI, jI, rCek }) => ({ nama: nI.value, kategori: cI.value, jumlah: jI.value, rutin: !!(rCek && rCek.checked) })) }));
        const keBarisSimpan = (rows) => rows.map(({ nI, cI, jI, rCek }) => ({ nama: (nI.value || '(tanpa nama)').trim(), kategori: cI.value || 'Lainnya', jumlah: num(jI.value), rutin: !!(rCek && rCek.checked) }));
        const rutin = []
          .concat(keBarisSimpan(inRows).filter((r) => r.rutin).map((r) => ({ jenis: 'Masuk', nama: r.nama, kategori: r.kategori, jumlah: r.jumlah })))
          .concat(keBarisSimpan(outRows).filter((r) => r.rutin).map((r) => ({ jenis: 'Keluar', nama: r.nama, kategori: r.kategori, jumlah: r.jumlah })));
        localStorage.setItem(KR, JSON.stringify(rutin));
        localStorage.setItem(KT, targetI.value || '');
      } catch (e) {}
    };
    const flushSimpan = () => { if (simpanTimer) { clearTimeout(simpanTimer); simpanTimer = null; simpan(); } };
    const jadwalSimpan = () => { clearTimeout(simpanTimer); simpanTimer = setTimeout(() => { simpanTimer = null; simpan(); }, 500); };

    const targetI = T.input('text', 'cth: 1000000 (opsional)', '');
    targetI.inputMode = 'decimal';
    try { targetI.value = localStorage.getItem(KT) || ''; } catch (e) {}

    const donutHtml = (perKat, total, judul) => {
      const arr = Object.entries(perKat).sort((a, b) => b[1] - a[1]);
      if (!arr.length || total <= 0) return '';
      let mulai = 0;
      const segmen = arr.map(([kat, v], i) => {
        const pct = v / total * 100;
        const s = mulai;
        mulai += pct;
        return WARNA_KAT[i % WARNA_KAT.length] + ' ' + s.toFixed(1) + '% ' + mulai.toFixed(1) + '%';
      }).join(', ');
      const legenda = arr.map(([kat, v], i) => {
        const pct = Math.round(v / total * 100);
        return '<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0"><span style="width:10px;height:10px;border-radius:50%;background:' + WARNA_KAT[i % WARNA_KAT.length] + ';flex-shrink:0"></span>' +
          '<span style="flex:1">' + T.esc(kat) + ' (' + pct + '%)</span><b>' + rp(v) + '</b></div>';
      }).join('');
      return '<h3 style="font-size:14px;margin:10px 0 6px">' + T.esc(judul) + '</h3>' +
        '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
        '<div style="width:110px;height:110px;border-radius:50%;background:conic-gradient(' + segmen + ');flex-shrink:0;position:relative">' +
        '<div style="position:absolute;inset:26px;border-radius:50%;background:#161311;display:flex;align-items:center;justify-content:center;font-size:11px;text-align:center">Total<br><b>' + rp(total) + '</b></div></div>' +
        '<div style="flex:1;min-width:180px">' + legenda + '</div></div>';
    };

    const calc = () => {
      // Baris kosong (num('') = NaN) dihitung 0, bukan "di atas Rp100 triliun"
      // — kalau tidak, peringatan palsu muncul di keadaan bawaan (P-R2-01).
      // Infinity/1e308 tetap lolos (truthy) dan tetap ditangkap guard di bawah.
      const keBaris = (rows) => rows.map(({ nI, cI, jI, rCek }) => ({ nama: (nI.value || '(tanpa nama)').trim(), kategori: cI.value || 'Lainnya', jumlah: num(jI.value) || 0, rutin: !!(rCek && rCek.checked) }));
      // Jumlah di atas Rp100 triliun per baris hampir pasti salah ketik
      // (atau 1e308) — jangan tampilkan total yang menyesatkan.
      const semuaBaris = keBaris(inRows).concat(keBaris(outRows));
      if (semuaBaris.some((r) => !isFinite(r.jumlah) || Math.abs(r.jumlah) > 1e14)) {
        T.show(box, '<p class="warn">Ada jumlah di atas Rp100 triliun — periksa lagi angkanya, mungkin ada nol yang kelebihan. Total tidak dihitung sampai angkanya diperbaiki.</p>');
        jadwalSimpan();
        return false;
      }
      const ring = utils.cashflowRingkasan(keBaris(inRows), keBaris(outRows));
      const itemsDari = (rows) => keBaris(rows).filter((r) => isFinite(r.jumlah) && r.jumlah !== 0).map((r) => ({ nama: r.nama, v: Math.abs(r.jumlah) }));
      const m = { total: ring.masuk, items: itemsDari(inRows), perKat: ring.perKatMasuk };
      const k = { total: ring.keluar, items: itemsDari(outRows), perKat: ring.perKatKeluar };
      const saldo = ring.saldo;
      const status = saldo >= 0 ? 'Surplus' : 'Defisit';
      lastTotals = { masuk: m.total, keluar: k.total };
      lastPerKat = { masuk: m.perKat, keluar: k.perKat };
      jadwalSimpan();
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
      // Target tabungan
      const target = Math.max(0, num(targetI.value) || 0);
      let targetHtml = '';
      if (target > 0) {
        const pct = Math.max(0, Math.min(100, saldo / target * 100));
        const tercapai = saldo >= target;
        const terbesar = Object.entries(k.perKat).sort((a, b) => b[1] - a[1])[0];
        targetHtml = '<h3 style="font-size:14px;margin:10px 0 4px">Target tabungan bulan ini</h3>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px"><span>Sisa kas ' + rp(Math.max(0, saldo)) + ' dari target ' + rp(target) + '</span><span>' + Math.round(pct) + '%</span></div>' +
          '<div style="height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;margin:4px 0 6px"><div style="height:100%;width:' + pct + '%;background:' + (tercapai ? '#4ade80' : '#ff6f61') + '"></div></div>' +
          (tercapai
            ? '<p class="note">Target tercapai! Sisa kasmu ' + rp(saldo - target) + ' di atas target.</p>'
            : '<p class="hint">Kurang ' + rp(target - Math.max(0, saldo)) + ' lagi untuk mencapai target' + (terbesar ? '. Kategori terbesarmu: <b>' + T.esc(terbesar[0]) + '</b> (' + rp(terbesar[1]) + ') — memangkasnya ' + rp(Math.min(terbesar[1], target - Math.max(0, saldo))) + ' saja sudah cukup.' : '.') + '</p>');
      }
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
        donutHtml(k.perKat, k.total, 'Pengeluaran per kategori') +
        (m.items.length ? '<p class="hint">Masuk: ' + m.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (m.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        (k.items.length ? '<p class="hint">Keluar: ' + k.items.slice(0, 5).map((x) => T.esc(x.nama) + ' ' + rp(x.v)).join(' · ') + (k.items.length > 5 ? ' · …' : '') + '</p>' : '') +
        '<p class="note">' + T.esc(ringkas) + '</p>' +
        targetHtml +
        bagiHtml);
      return true;
    };

    const eksporCsv = () => {
      calc();
      // Netralisasi injeksi formula: sel yang diawali = + - @ | % dieksekusi
      // spreadsheet sebagai formula — kutip CSV bukan perlindungan.
      const escCsv = (s) => {
        let v = String(s == null ? '' : s);
        // Angka polos (-10000, +5, 3.5) aman: spreadsheet membacanya sebagai
        // angka, bukan formula — tanpa pengecualian ini total "Sisa kas"
        // negatif ikut berawalan tab dan berubah jadi teks.
        const angkaPolos = /^[+-]?\d+(\.\d+)?$/.test(v.trim());
        if (!angkaPolos && /^[=+\-@|%]/.test(v.trimStart())) v = '\t' + v;
        return '"' + v.replace(/"/g, '""') + '"';
      };
      const keBarisEkspor = (rows) => rows.map(({ nI, cI, jI }) => ({ nama: (nI.value || '(tanpa nama)').trim(), kategori: cI.value || 'Lainnya', jumlah: num(jI.value) }));
      // Total dihitung langsung dari baris (bukan lastTotals) supaya tidak
      // memakai total lama bila calc() menolak menghitung angka absurd.
      const ringEkspor = utils.cashflowRingkasan(keBarisEkspor(inRows), keBarisEkspor(outRows));
      const barisCsv = (jenis, rows) => rows.map(({ nI, cI, jI }) => {
        const v = num(jI.value);
        if (!isFinite(v) || v === 0) return null;
        return [jenis, (nI.value || '(tanpa nama)').trim(), cI.value || 'Lainnya', Math.abs(v)].map(escCsv).join(',');
      }).filter(Boolean);
      const isi = ['Jenis,Nama,Kategori,Jumlah (Rp)']
        .concat(barisCsv('Masuk', inRows), barisCsv('Keluar', outRows))
        .concat([
          ['Total', 'Pemasukan', '', ringEkspor.masuk].map(escCsv).join(','),
          ['Total', 'Pengeluaran', '', ringEkspor.keluar].map(escCsv).join(','),
          ['Total', 'Sisa kas', '', ringEkspor.saldo].map(escCsv).join(','),
        ]).join('\n');
      const d = new Date();
      const nama = 'arus-kas-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '.csv';
      T.dl(nama, isi, 'text/csv');
      T.toast('CSV terunduh');
    };

    const imporCsv = (file) => {
      const baca = new FileReader();
      baca.onload = () => {
        const teksFile = String(baca.result || '');
        const baris = utils.cashflowParseCsv(teksFile);
        if (!baris.length) { T.toast('CSV tidak berisi baris yang bisa dibaca'); return; }
        const totalBarisFile = teksFile.split('\n').filter((l) => l.trim()).length - 1; // dikurangi header
        const terpotong = totalBarisFile > baris.length && baris.length >= CASHFLOW_MAKS_IMPOR;
        const masuk = baris.filter((b) => b.jenis === 'Masuk');
        const keluar = baris.filter((b) => b.jenis === 'Keluar');
        // Tambahkan di bawah baris yang sudah ada (tidak menimpa).
        masuk.forEach((b) => { const x = makeRow(b.nama, String(b.jumlah), b.kategori, IN_CATS, false); inBox.appendChild(x.wrap); inRows.push(x); bindRowEvents(x); });
        keluar.forEach((b) => { const x = makeRow(b.nama, String(b.jumlah), b.kategori, OUT_CATS, false); outBox.appendChild(x.wrap); outRows.push(x); bindRowEvents(x); });
        calc();
        T.toast(terpotong
          ? baris.length + ' baris diimpor (batas maksimal ' + CASHFLOW_MAKS_IMPOR + ' baris per impor — ' + (totalBarisFile - baris.length) + ' baris sisanya tidak ikut)'
          : baris.length + ' baris diimpor dari CSV');
      };
      baca.readAsText(file);
    };

    const katTrenSel = T.select(
      [['', 'Semua (total masuk & keluar)']]
        .concat(IN_CATS.map((c) => ['Masuk|' + c, 'Masuk · ' + c]))
        .concat(OUT_CATS.map((c) => ['Keluar|' + c, 'Keluar · ' + c])),
      ''
    );
    katTrenSel.addEventListener('change', () => renderChart());

    const renderChart = () => {
      const hist = loadHist();
      const keys = Object.keys(hist).sort().slice(-12);
      // Lapis kedua P-04: akses entri selalu lewat penjaga ini, jadi
      // entri rusak (null/bukan objek) tidak pernah membunuh render.
      const entriAman = (k) => { const e = hist[k]; return (e && typeof e === 'object') ? e : {}; };
      if (!keys.length) {
        T.show(chartBox, '<h3 style="font-size:14px;margin:14px 0 6px">Tren bulanan</h3><p class="hint">Belum ada riwayat. Tekan "Simpan bulan ini" tiap akhir bulan supaya tren pemasukan dan pengeluaranmu kelihatan di sini.</p>');
        return;
      }
      const pilihan = katTrenSel.value;
      let max = 0;
      const nilaiKat = (k) => {
        if (!pilihan) return null;
        const [jenis, kat] = pilihan.split('|');
        const entri = hist[k] || {};
        const perKat = jenis === 'Masuk' ? (entri.perKatMasuk || {}) : (entri.perKatKeluar || {});
        return perKat[kat] || 0;
      };
      if (pilihan) {
        keys.forEach((k) => { max = Math.max(max, nilaiKat(k)); });
        const adaRincian = keys.some((k) => entriAman(k).perKatMasuk || entriAman(k).perKatKeluar);
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
          rows += '<div style="margin-bottom:8px">' + bar(label, nilaiKat(k), '#ff6f61') + '</div>';
        });
        const [jenis, kat] = pilihan.split('|');
        T.show(chartBox, '<h3 style="font-size:14px;margin:14px 0 6px">Tren kategori: ' + T.esc(jenis) + ' · ' + T.esc(kat) + ' (12 bulan terakhir)</h3>' + rows +
          (!adaRincian ? '<p class="hint">Riwayat lamamu belum menyimpan rincian per kategori — tekan "Simpan bulan ini" supaya tren kategori mulai tercatat.</p>' : ''));
        return;
      }
      keys.forEach((k) => { max = Math.max(max, entriAman(k).masuk || 0, entriAman(k).keluar || 0); });
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
        const s = (entriAman(k).masuk || 0) - (entriAman(k).keluar || 0);
        rows += '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><b>' + T.esc(label) + '</b>' +
          '<span style="color:' + (s >= 0 ? '#4ade80' : '#f87171') + '">Sisa ' + rp(s) + '</span></div>' +
          bar('Masuk', entriAman(k).masuk || 0, '#ffffff') + bar('Keluar', entriAman(k).keluar || 0, '#9ca3af') + '</div>';
      });
      T.show(chartBox, '<h3 style="font-size:14px;margin:14px 0 6px">Tren bulanan (12 bulan terakhir)</h3>' + rows);
    };

    const bulanIni = () => {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    };
    const simpanBulan = () => {
      if (!calc()) { T.toast('Perbaiki dulu angka yang terlalu besar sebelum menyimpan.'); return; }
      const hist = loadHist();
      hist[bulanIni()] = { masuk: lastTotals.masuk, keluar: lastTotals.keluar, perKatMasuk: lastPerKat.masuk, perKatKeluar: lastPerKat.keluar };
      try { localStorage.setItem(KH, JSON.stringify(hist)); } catch (e) {}
      T.toast('Bulan ini tersimpan di tren.');
      renderChart();
    };
    const hapusRiwayat = () => {
      try { localStorage.removeItem(KH); } catch (e) {}
      T.toast('Riwayat tren dihapus.');
      renderChart();
    };
    const mulaiBulanBaru = () => {
      const rutin = loadRutin();
      // Kosongkan semua baris, lalu bawa transaksi rutin bulan lalu.
      inRows.splice(0).forEach((x) => x.wrap.remove());
      outRows.splice(0).forEach((x) => x.wrap.remove());
      const masuk = rutin.filter((r) => r.jenis === 'Masuk');
      const keluar = rutin.filter((r) => r.jenis === 'Keluar');
      const tambah = (list, cats, boxEl, rows) => {
        list.forEach((b) => {
          const x = makeRow(b.nama, String(b.jumlah || ''), b.kategori, cats, true);
          boxEl.appendChild(x.wrap); rows.push(x); bindRowEvents(x);
        });
      };
      tambah(masuk, IN_CATS, inBox, inRows);
      tambah(keluar, OUT_CATS, outBox, outRows);
      if (!masuk.length && !keluar.length) {
        const x = makeRow('', '', 'Lainnya', IN_CATS, false);
        inBox.appendChild(x.wrap); inRows.push(x); bindRowEvents(x);
        const y = makeRow('', '', 'Lainnya', OUT_CATS, false);
        outBox.appendChild(y.wrap); outRows.push(y); bindRowEvents(y);
      }
      calc();
      T.toast(rutin.length ? rutin.length + ' transaksi rutin dibawa ke bulan baru.' : 'Bulan baru dimulai. Centang "Rutin" pada baris yang berulang tiap bulan.');
    };

    const bindRowEvents = (x) => {
      x.nI.addEventListener('input', calc);
      x.jI.addEventListener('input', calc);
      x.cI.addEventListener('change', calc);
      if (x.rCek) x.rCek.addEventListener('change', calc);
    };
    inRows.forEach(bindRowEvents);
    outRows.forEach(bindRowEvents);
    targetI.addEventListener('input', calc);

    const imporInp = document.createElement('input');
    imporInp.type = 'file';
    imporInp.accept = '.csv,text/csv';
    imporInp.style.display = 'none';
    imporInp.addEventListener('change', () => {
      if (imporInp.files && imporInp.files[0]) imporCsv(imporInp.files[0]);
      imporInp.value = '';
    });

    root.appendChild(T.el('<p class="note">Biar dompet nggak bocor, tulis semua uang masuk dan keluar <b>satu bulan</b>, terus lihat sisanya.</p>'));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💰 Pemasukan</h3>'));
    root.appendChild(inBox);
    root.appendChild(T.row(T.btn('+ Tambah pemasukan', () => { const x = makeRow('', '', 'Lainnya', IN_CATS); inBox.appendChild(x.wrap); inRows.push(x); bindRowEvents(x); calc(); })));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">💸 Pengeluaran</h3>'));
    root.appendChild(outBox);
    root.appendChild(T.row(T.btn('+ Tambah pengeluaran', () => { const x = makeRow('', '', 'Lainnya', OUT_CATS); outBox.appendChild(x.wrap); outRows.push(x); bindRowEvents(x); calc(); })));
    root.appendChild(T.field('Target tabungan / bulan (Rp)', targetI, 'Sisa kasmu dibandingkan dengan target ini. Kosongkan bila belum punya target.'));
    root.appendChild(T.row(T.btn('Hitung Arus Kas', calc, true)));
    root.appendChild(box);
    root.appendChild(T.row(T.btn('Simpan bulan ini', simpanBulan), T.btn('Unduh CSV', eksporCsv), T.btn('Impor CSV', () => imporInp.click())));
    root.appendChild(T.row(T.btn('Mulai bulan baru', mulaiBulanBaru), T.btn('Hapus riwayat tren', hapusRiwayat)));
    root.appendChild(imporInp);
    root.appendChild(T.el('<p class="hint">Centang "Rutin" pada baris yang berulang tiap bulan (gaji, sewa, langganan) — saat menekan "Mulai bulan baru", baris itu otomatis dibawa ke bulan berikut.</p>'));
    root.appendChild(T.field('Lihat tren per kategori', katTrenSel, 'Pilih satu kategori untuk melihat tren 12 bulannya.'));
    root.appendChild(chartBox);
    calc();
    renderChart();
    // Simpan tunda yang belum tertulis harus ikut tersimpan saat tool
    // ditinggal atau tab ditutup (debounce 500 ms di atas).
    window.addEventListener('beforeunload', flushSimpan);
    if (T.onLeave) T.onLeave(() => { flushSimpan(); window.removeEventListener('beforeunload', flushSimpan); });
}
