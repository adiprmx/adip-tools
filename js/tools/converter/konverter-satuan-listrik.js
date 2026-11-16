import { h as T, kv, errBox, utils } from '../../core.js?v=6.13.0';

export const meta = {"id": "konverter-satuan-listrik", "name": "Konverter Satuan Listrik", "cat": "converter", "icon": "⚡", "desc": "Volt, ampere, watt, dan ohm dengan satuan apa pun (mV, kW, kΩ), daya semu VA dan faktor daya, plus perkiraan biaya listrik dari daftar alat.", "keywords": "volt,ampere,watt,ohm,kwh,listrik,hukum ohm,daya,va,biaya listrik,tarif,konverter", "since": "6.11.0"};

/* Faktor konversi ke satuan dasar (V, A, W, Ω). */
export const SATUAN = {
  v: [['mV', 0.001], ['V', 1], ['kV', 1000]],
  i: [['mA', 0.001], ['A', 1], ['kA', 1000]],
  p: [['mW', 0.001], ['W', 1], ['kW', 1000]],
  r: [['mΩ', 0.001], ['Ω', 1], ['kΩ', 1000], ['MΩ', 1000000]],
};

/* Hukum Ohm: isi dua dari V/I/P/R, dua sisanya dihitung.
   Nilai masuk dalam satuan dasar. cosPhi (0–1) dipakai untuk daya nyata
   vs daya semu: P nyata = V x I x cosPhi. */
export function hitungOhm(o) {
  let V = Number(o.v), I = Number(o.i), P = Number(o.p), R = Number(o.r);
  V = isFinite(V) && V > 0 ? V : null;
  I = isFinite(I) && I > 0 ? I : null;
  P = isFinite(P) && P > 0 ? P : null;
  R = isFinite(R) && R > 0 ? R : null;
  const isi = [V, I, P, R].filter((x) => x !== null).length;
  if (isi < 2) return null;
  if (V !== null && I !== null) { P = V * I; R = V / I; }
  else if (V !== null && P !== null) { I = P / V; R = (V * V) / P; }
  else if (V !== null && R !== null) { I = V / R; P = (V * V) / R; }
  else if (I !== null && P !== null) { V = P / I; R = P / (I * I); }
  else if (I !== null && R !== null) { V = I * R; P = I * I * R; }
  else if (P !== null && R !== null) { I = Math.sqrt(P / R); V = Math.sqrt(P * R); }
  return { v: V, i: I, p: P, r: R };
}

/* kWh & biaya dari daftar alat: [{watt, jam}] per hari, selama `hari` hari. */
export function hitungBiayaListrik(alat, hari, tarif) {
  const h = Math.max(0, Number(hari) || 0);
  const t = Math.max(0, Number(tarif) || 0);
  let kwh = 0;
  const rincian = (alat || []).map((a) => {
    const w = Math.max(0, Number(a.watt) || 0);
    const j = Math.max(0, Number(a.jam) || 0);
    const k = (w * j * h) / 1000;
    kwh += k;
    return { nama: a.nama || 'Alat', kwh: k, rupiah: k * t };
  });
  return { kwh, rupiah: kwh * t, rincian };
}

/* Fungsi lama konverter-satuan-listrik v6.11.0 (logika murni, dipertahankan
   untuk kompatibilitas): hukum Ohm V = I x R dan daya P = V x I — isi dua
   nilai apa pun, dua sisanya dihitung. */
utils.hitungListrik = function (o) {
  let V = Number(o.v), I = Number(o.i), P = Number(o.p), R = Number(o.r);
  V = isFinite(V) && V > 0 ? V : null;
  I = isFinite(I) && I > 0 ? I : null;
  P = isFinite(P) && P > 0 ? P : null;
  R = isFinite(R) && R > 0 ? R : null;
  const isi = [V, I, P, R].filter((x) => x !== null).length;
  if (isi < 2) return null;
  if (V !== null && I !== null) { P = V * I; R = V / I; }
  else if (V !== null && P !== null) { I = P / V; R = (V * V) / P; }
  else if (V !== null && R !== null) { I = V / R; P = (V * V) / R; }
  else if (I !== null && P !== null) { V = P / I; R = P / (I * I); }
  else if (I !== null && R !== null) { V = I * R; P = I * I * R; }
  else if (P !== null && R !== null) { I = Math.sqrt(P / R); V = Math.sqrt(P * R); }
  return { v: V, i: I, p: P, r: R };
};

// kWh = watt x jam x hari / 1000 (fungsi lama, satu alat)
utils.hitungKwh = function (o) {
  const watt = Math.max(0, Number(o.watt) || 0);
  const jam = Math.max(0, Number(o.jam) || 0);
  const hari = Math.max(0, Number(o.hari) || 0);
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const kwh = (watt * jam * hari) / 1000;
  return { kwh, rupiah: kwh * tarif };
};

// P4-04: nilai non-finite -> "di luar jangkauan", samakan dengan T.rp
// (T.fmt sudah dijaga di core.js; fmtAngka menjaga sendiri supaya
// satuannya tidak ikut menempel — "di luar jangkauan", bukan
// "di luar jangkauan W"). Diekspor supaya bisa diuji dari node.
// P4-08: nilai FINITE raksasa (|x| >= 1e15) juga di luar jangkauan —
// Intl mencetaknya penuh digit (1e300 = 401 karakter di baris Daya).
// Tidak ada besaran listrik di tool ini yang wajar mencapai 1e15.
export const fmtAngka = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || Math.abs(v) >= 1e15) return 'di luar jangkauan';
  const x = Math.round(v * 1000) / 1000;
  return T.fmt(x);
};

// Angka + satuan; bila di luar jangkauan, satuan tidak ditempel.
const fmtSatuan = (n, satuan) => {
  const s = fmtAngka(n);
  return s === 'di luar jangkauan' ? s : s + ' ' + satuan;
};

export function render(root) {
  const box = T.out();
  const box2 = T.out();

  // ---- Bagian 1: hukum Ohm dengan pemilih satuan ----
  const buatPasangan = (kunci, ph, satuanDefault) => {
    const inp = T.input('text', ph, '');
    inp.inputMode = 'decimal';
    const sel = T.select(SATUAN[kunci].map(([nama, faktor]) => [String(faktor), nama]), String(satuanDefault));
    sel.style.cssText = 'max-width:86px;flex:none';
    const wrap = T.el('<div style="display:flex;gap:8px"></div>');
    wrap.appendChild(inp);
    wrap.appendChild(sel);
    return { inp, sel, wrap, dasar: () => {
      const n = T.num(inp.value);
      if (!isFinite(n) || !(n > 0)) return null;
      return n * Number(sel.value);
    } };
  };

  const pasanganV = buatPasangan('v', 'Tegangan, mis. 220', 1);
  const pasanganI = buatPasangan('i', 'Arus, mis. 2', 1);
  const pasanganP = buatPasangan('p', 'Daya, mis. 440', 1);
  const pasanganR = buatPasangan('r', 'Hambatan, mis. 110', 1);
  const cosPhiInp = T.input('text', 'Faktor daya 0–1, mis. 0,85', '1');
  cosPhiInp.inputMode = 'decimal';

  const tampilSatuan = (nilaiDasar, kunci) => {
    // Pilih satuan yang paling enak dibaca (nilai 1–999 bila memungkinkan).
    if (!Number.isFinite(nilaiDasar)) return 'di luar jangkauan';
    const daftar = SATUAN[kunci];
    let pilih = daftar[1] || daftar[0];
    for (const [nama, faktor] of daftar) {
      const n = nilaiDasar / faktor;
      if (n >= 1 && n < 1000) { pilih = [nama, faktor]; break; }
    }
    return fmtSatuan(nilaiDasar / pilih[1], pilih[0]);
  };

  const hitung = () => {
    const hasil = hitungOhm({
      v: pasanganV.dasar(), i: pasanganI.dasar(), p: pasanganP.dasar(), r: pasanganR.dasar(),
    });
    if (!hasil) {
      T.show(box, '<div class="hint">Isi dua nilai apa pun dari empat ini. Dua nilai lainnya akan dihitung.</div>');
      return;
    }
    const cosPhi = T.num(cosPhiInp.value);
    const pf = isFinite(cosPhi) && cosPhi > 0 && cosPhi <= 1 ? cosPhi : 1;
    const va = hasil.v * hasil.i; // daya semu
    const pNyata = va * pf;
    T.show(box,
      kv('Tegangan', '<b style="color:#fff">' + tampilSatuan(hasil.v, 'v') + '</b>') +
      kv('Arus', '<b>' + tampilSatuan(hasil.i, 'i') + '</b>') +
      kv('Daya', '<b>' + tampilSatuan(hasil.p, 'p') + '</b>') +
      kv('Hambatan', '<b>' + tampilSatuan(hasil.r, 'r') + '</b>') +
      kv('Daya semu (VA)', '<b>' + tampilSatuan(va, 'p').replace(/W|kW|mW/, 'VA') + '</b>') +
      (pf < 1
        ? kv('Daya nyata (faktor daya ' + String(pf).replace('.', ',') + ')', '<b>' + tampilSatuan(pNyata, 'p') + '</b>')
        : '') +
      '<p class="hint">Rumusnya: daya = volt × ampere, dan volt = ampere × ohm. Listrik rumah di Indonesia umumnya 220 volt. Daya semu (VA) adalah volt × ampere; daya nyata dikalikan faktor daya — alat seperti motor dan kulkas biasanya punya faktor daya di bawah 1.</p>');
  };

  // ---- Bagian 2: daftar alat -> biaya per bulan ----
  const daftarEl = T.el('<div></div>');
  const rows = [];
  const hariInp = T.input('text', 'Jumlah hari', '30'); hariInp.inputMode = 'decimal';
  const tarifInp = T.input('text', 'Tarif Rp per kWh', '1444,70'); tarifInp.inputMode = 'decimal';

  const tambahAlat = (def) => {
    const d = def || {};
    const nama = T.input('text', 'Nama alat, mis. Kulkas', d.nama || '');
    const watt = T.input('text', 'Daya (watt)', d.watt || ''); watt.inputMode = 'decimal';
    const jam = T.input('text', 'Jam pakai per hari', d.jam || ''); jam.inputMode = 'decimal';
    const wrap = T.el('<div style="border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;margin-bottom:10px"></div>');
    const hapusBtn = T.btn('Hapus alat ini', () => {
      const i = rows.indexOf(rec);
      if (i > -1) rows.splice(i, 1);
      wrap.remove();
    });
    const rec = { wrap, nama, watt, jam };
    wrap.appendChild(T.field('Nama alat', nama));
    wrap.appendChild(T.grid2(T.field('Daya alat (watt)', watt, 'Cek label di alatnya'), T.field('Lama pakai per hari (jam)', jam)));
    wrap.appendChild(T.row(hapusBtn));
    rows.push(rec);
    daftarEl.appendChild(wrap);
  };

  const hitungBiaya = () => {
    if (rows.length === 0) { T.show(box2, errBox('Tambah minimal 1 alat dulu.')); return; }
    const alat = [];
    for (const r of rows) {
      const w = T.num(r.watt.value), j = T.num(r.jam.value);
      const nama = r.nama.value.trim() || 'Alat';
      if (!isFinite(w) || !(w > 0)) { T.show(box2, errBox('Daya "' + nama + '" harus lebih dari 0 watt.')); return; }
      if (!isFinite(j) || j < 0 || j > 24) { T.show(box2, errBox('Lama pakai "' + nama + '" isi 0 sampai 24 jam per hari.')); return; }
      alat.push({ nama, watt: w, jam: j });
    }
    const hari = T.num(hariInp.value), tarif = T.num(tarifInp.value);
    if (!isFinite(hari) || !(hari > 0) || hari > 366) { T.show(box2, errBox('Jumlah hari isi 1 sampai 366.')); return; }
    if (!isFinite(tarif) || tarif < 0) { T.show(box2, errBox('Tarif isi 0 atau lebih.')); return; }
    const hasil = hitungBiayaListrik(alat, hari, tarif);
    const baris = hasil.rincian.map((a) =>
      '<tr><td>' + T.esc(a.nama) + '</td><td style="text-align:right">' + fmtSatuan(a.kwh, 'kWh') + '</td><td style="text-align:right">' + T.rp(a.rupiah) + '</td></tr>'
    ).join('');
    T.show(box2,
      '<div class="center"><div class="dim">Perkiraan biaya listrik ' + hari + ' hari</div>' +
      '<div class="big" style="color:#ff6f61">' + T.rp(hasil.rupiah) + '</div>' +
      '<p class="dim">Total pemakaian ' + fmtSatuan(hasil.kwh, 'kWh') + '</p></div>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alat</th><th style="text-align:right">Pemakaian</th><th style="text-align:right">Biaya</th></tr></thead><tbody>' + baris + '</tbody></table></div>' +
      '<p class="hint">Tarif contoh Rp1.444,70 per kWh adalah tarif golongan 1.300 VA ke atas. Ubah sesuai tarif di struk listrikmu. Biaya ini belum termasuk pajak penerangan jalan dan biaya beban/abonemen.</p>');
  };

  root.appendChild(T.el('<p class="note">Isi dua nilai apa pun dari empat ini, dua sisanya dihitung otomatis — dengan satuan yang bisa kamu ubah.</p>'));
  root.appendChild(T.grid2(
    T.field('Tegangan', pasanganV.wrap),
    T.field('Arus', pasanganI.wrap)
  ));
  root.appendChild(T.grid2(
    T.field('Daya', pasanganP.wrap),
    T.field('Hambatan', pasanganR.wrap)
  ));
  root.appendChild(T.field('Faktor daya (opsional)', cosPhiInp, '1 untuk alat pemanas & lampu pijar; 0,8–0,9 untuk motor/kulkas/AC'));
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);

  root.appendChild(T.el('<h3 class="h3" style="margin-top:24px">💡 Perkiraan biaya listrik dari daftar alat</h3>'));
  root.appendChild(T.el('<p class="hint">Tambahkan alat-alat di rumahmu beserta lama pakainya, untuk melihat total biaya listrik per bulan.</p>'));
  root.appendChild(daftarEl);
  root.appendChild(T.row(T.btn('+ Tambah alat', () => tambahAlat())));
  root.appendChild(T.grid2(
    T.field('Jumlah hari', hariInp),
    T.field('Tarif listrik (Rp per kWh)', tarifInp)
  ));
  root.appendChild(T.row(T.btn('Hitung biaya listrik', hitungBiaya, true)));
  root.appendChild(box2);
  tambahAlat({ nama: 'Kulkas', watt: '120', jam: '24' });
  tambahAlat({ nama: 'Lampu (3 buah)', watt: '30', jam: '8' });
}
