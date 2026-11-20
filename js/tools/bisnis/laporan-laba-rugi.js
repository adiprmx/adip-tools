import { h as T, kv, utils } from '../../core.js';

export const meta = {"id":"laporan-laba-rugi","name":"Laba Rugi Sederhana","cat":"bisnis","icon":"📒","desc":"Catat pemasukan, HPP & operasional, langsung ketahuan laba bersihmu. Tersimpan otomatis, bisa diunduh CSV.","keywords":"laba rugi,pemasukan,hpp,operasional,keuangan usaha,laporan keuangan,margin,untung,rugi"};

// Jumlahkan baris-baris { nama, nominal }. Nominal negatif TIDAK dihitung
// diam-diam: dikembalikan di daftar `negatif` supaya UI bisa memperingatkan.
// Logika murni (bisa di-test di Node).
export function jumlahkanBaris(baris) {
  let total = 0;
  const negatif = [];
  (Array.isArray(baris) ? baris : []).forEach((b) => {
    const n = Number(b && b.nominal);
    if (!isFinite(n) || n === 0) return;
    if (n < 0) { negatif.push({ nama: String(b.nama || '').trim() || '(tanpa nama)', nominal: n }); return; }
    total += n;
  });
  return { total, negatif };
}

// Ringkasan laba-rugi dari tiga total bagian.
export function hitungLabaRugi(pemasukan, hpp, operasional) {
  const p = Number(pemasukan) || 0, h = Number(hpp) || 0, o = Number(operasional) || 0;
  const laba = p - h - o;
  return { pemasukan: p, hpp: h, operasional: o, laba, margin: p > 0 ? (laba / p * 100) : null };
}

// Netralisasi injeksi formula CSV: sel yang diawali = + - @ atau diawali
// spasi/tab lalu salah satunya, diberi awalan apostrof.
function selCsv(v) {
  let s = String(v == null ? '' : v);
  if (/^[\s]*[=+\-@|%]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

// Ekspor laporan ke CSV. `bagian` = [{ judul, baris: [{nama, nominal}] }].
export function laporanKeCsv(bagian, ringkasan) {
  const baris = [['Bagian', 'Nama', 'Nominal (Rp)']];
  (Array.isArray(bagian) ? bagian : []).forEach((b) => {
    (b.baris || []).forEach((r) => {
      baris.push([b.judul, r.nama || '', String(Math.round(Number(r.nominal) || 0))]);
    });
  });
  if (ringkasan) {
    baris.push(['Ringkasan', 'Total pemasukan', String(Math.round(ringkasan.pemasukan))]);
    baris.push(['Ringkasan', 'Total HPP', String(Math.round(ringkasan.hpp))]);
    baris.push(['Ringkasan', 'Total operasional', String(Math.round(ringkasan.operasional))]);
    baris.push(['Ringkasan', 'Laba bersih', String(Math.round(ringkasan.laba))]);
    baris.push(['Ringkasan', 'Margin laba (%)', ringkasan.margin == null ? '' : String(Math.round(ringkasan.margin * 100) / 100)]);
  }
  return baris.map((r) => r.map(selCsv).join(',')).join('\n');
}

// Teks ringkasan untuk disalin/dibagikan.
export function laporanKeTeks(bagian, ringkasan) {
  const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
  const garis = ['LAPORAN LABA RUGI'];
  (Array.isArray(bagian) ? bagian : []).forEach((b) => {
    garis.push('');
    garis.push(b.judul.toUpperCase());
    (b.baris || []).forEach((r) => { garis.push('- ' + (r.nama || '(tanpa nama)') + ': ' + rp(r.nominal)); });
  });
  if (ringkasan) {
    garis.push('');
    garis.push('Total pemasukan: ' + rp(ringkasan.pemasukan));
    garis.push('Total HPP: ' + rp(ringkasan.hpp));
    garis.push('Total operasional: ' + rp(ringkasan.operasional));
    garis.push('Laba bersih: ' + rp(ringkasan.laba));
    if (ringkasan.margin != null) garis.push('Margin laba: ' + (Math.round(ringkasan.margin * 100) / 100) + '%');
  }
  return garis.join('\n');
}
utils.laporanLabaRugiJumlah = jumlahkanBaris;
utils.laporanLabaRugiCsv = laporanKeCsv;
utils.laporanLabaRugiTeks = laporanKeTeks;

export function render(root) {
  const K = 'tool:laporan-laba-rugi';
  const muatTersimpan = () => {
    try {
      const v = JSON.parse(localStorage.getItem(K) || 'null');
      if (v && Array.isArray(v.bagian)) return v.bagian;
    } catch (e) { /* abaikan */ }
    return null;
  };
  const tersimpan = muatTersimpan();

  const box = T.out();
  const defs = [
    { title: '💰 Pemasukan', ph: 'cth: Jualan kopi' },
    { title: '📦 HPP (harga pokok)', ph: 'cth: Biji kopi & gula' },
    { title: '🧾 Operasional', ph: 'cth: Sewa & listrik' },
  ];

  const dataSemua = () => secs.map((s, i) => ({ judul: defs[i].title, baris: s.data() }));

  const simpan = () => {
    try { localStorage.setItem(K, JSON.stringify({ bagian: dataSemua().map((b) => b.baris) })); } catch (e) { /* abaikan */ }
  };

  const hitung = () => {
    const data = dataSemua();
    const hasil = data.map((b) => jumlahkanBaris(b.baris));
    const P = hasil[0].total, H = hasil[1].total, O = hasil[2].total;
    const ringkasan = hitungLabaRugi(P, H, O);
    const laba = ringkasan.laba;
    const warna = laba >= 0 ? '#22c55e' : '#ef4444';
    const status = P === 0 && H === 0 && O === 0
      ? 'isi baris-baris di atas dulu'
      : (laba >= 0 ? 'itu laba bersihmu — pertahankan!' : 'kamu masih rugi — cek lagi biayanya');
    const marginTxt = ringkasan.margin == null ? '—'
      : ringkasan.margin.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%';
    const peringatan = [];
    hasil.forEach((h, i) => {
      h.negatif.forEach((n) => {
        peringatan.push('Baris "' + n.nama + '" di ' + defs[i].title + ' nominalnya ' + T.rp(n.nominal) + ' — angka negatif tidak dihitung. Pakai angka 0 atau lebih, atau pindahkan ke bagian yang sesuai.');
      });
    });
    T.show(box,
      '<div class="big center" style="color:' + warna + '">' + T.rp(laba) + '</div>' +
      '<p class="center">' + T.esc(status) + '</p>' +
      kv('Total pemasukan', T.rp(P)) +
      kv('Total HPP', T.rp(H)) +
      kv('Total operasional', T.rp(O)) +
      kv('Margin laba', marginTxt) +
      (peringatan.length ? '<p class="warn">' + peringatan.map((p) => T.esc(p)).join('<br>') + '</p>' : '') +
      '<p class="hint">Laba = pemasukan − HPP − operasional. Margin = laba ÷ pemasukan. Laporanmu tersimpan otomatis di perangkat ini.</p>');
    box.appendChild(T.row(
      T.dlBtn('laporan-laba-rugi.csv', () => laporanKeCsv(dataSemua(), ringkasan), 'text/csv', 'Unduh CSV'),
      T.copyBtn(() => laporanKeTeks(dataSemua(), ringkasan), 'Salin teks laporan')
    ));
    simpan();
  };

  const makeSection = (def, awal) => {
    const rows = [];
    const wrap = T.el('<div style="margin-bottom:14px"></div>');
    wrap.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">' + T.esc(def.title) + '</div>'));
    const list = T.el('<div></div>');
    wrap.appendChild(list);
    const addRow = (nama, nominal) => {
      const r = T.el('<div style="display:flex;gap:6px;margin-bottom:6px"></div>');
      const namaI = T.input('text', def.ph, nama || '');
      namaI.style.flex = '1';
      const nomI = T.input('text', 'Rp', nominal == null ? '' : String(nominal));
      nomI.style.width = '110px';
      nomI.style.flexShrink = '0';
      nomI.inputMode = 'decimal';
      const rec = { namaI, nomI };
      rows.push(rec);
      const del = T.btn('✕', () => {
        r.remove();
        rows.splice(rows.indexOf(rec), 1);
        hitung();
      });
      del.setAttribute('aria-label', 'Hapus baris');
      del.style.flexShrink = '0';
      [namaI, nomI].forEach((i) => i.addEventListener('input', hitung));
      r.appendChild(namaI);
      r.appendChild(nomI);
      r.appendChild(del);
      list.appendChild(r);
      return rec;
    };
    const addB = T.btn('+ Tambah baris', () => { const rec = addRow(); rec.namaI.focus(); });
    addB.style.marginTop = '2px';
    wrap.appendChild(addB);
    const el = {
      el: wrap,
      data: () => rows.map((rec) => ({ nama: rec.namaI.value.trim(), nominal: T.num(rec.nomI.value) || 0 })),
      reset: () => {
        list.querySelectorAll('input').forEach((i) => { i.value = ''; });
        hitung();
      },
      _addRow: addRow,
    };
    (Array.isArray(awal) && awal.length ? awal : [null]).forEach((b) => {
      addRow(b ? b.nama : '', b ? b.nominal : '');
    });
    return el;
  };

  const secs = defs.map((d, i) => makeSection(d, tersimpan ? tersimpan[i] : null));
  root.appendChild(T.el('<p class="note">Tambah baris sebanyak yang kamu butuhkan di tiap bagian — nominalnya dijumlah otomatis, dan laporanmu tersimpan otomatis di perangkat ini.</p>'));
  secs.forEach((s) => { root.appendChild(s.el); });
  root.appendChild(T.row(
    T.btn('↺ Reset semua', () => {
      secs.forEach((s) => s.reset());
      try { localStorage.removeItem(K); } catch (e) { /* abaikan */ }
      T.toast('Laporan dikosongkan.');
    })
  ));
  root.appendChild(box);
  hitung();
}
