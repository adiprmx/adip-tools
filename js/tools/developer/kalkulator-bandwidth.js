import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "kalkulator-bandwidth", "name": "Kalkulator Bandwidth", "cat": "developer", "icon": "📡", "desc": "Estimasi waktu transfer file & kecepatan minimum yang dibutuhkan.", "keywords": "bandwidth,transfer,mbps,kecepatan,download,upload"};

// 1 byte = 8 bit. Satuan file pakai basis desimal (1 MB = 1.000.000 byte),
// selaras dengan cara ISP menulis kecepatan (1 Mbps = 1.000.000 bit/detik).
const UNIT_B = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };

export function bytesDari(nilai, satuan) {
  return Number(nilai) * (UNIT_B[satuan] || 1);
}

// detik yang dibutuhkan untuk mentransfer `bytes` byte pada kecepatan `mbps` Mbps
export function waktuTransfer(bytes, mbps) {
  return (bytes * 8) / (mbps * 1e6);
}

// Mbps minimum agar `bytes` byte selesai dalam `detik` detik
export function kecepatanMinimum(bytes, detik) {
  return (bytes * 8) / detik / 1e6;
}

export function fmtDurasi(detik) {
  if (!isFinite(detik) || detik < 0) return '-';
  if (detik < 1) return detik.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' detik';
  const d = Math.floor(detik / 86400), h = Math.floor(detik % 86400 / 3600);
  const m = Math.floor(detik % 3600 / 60), s = Math.floor(detik % 60);
  const bagian = [];
  if (d) bagian.push(d + ' hari');
  if (h) bagian.push(h + ' jam');
  if (m) bagian.push(m + ' menit');
  if (s || !bagian.length) bagian.push(s + ' detik');
  return bagian.join(' ');
}

export function render(root) {
  function card(judul) {
    const wrap = T.el('<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;margin-bottom:14px"><b style="font-size:14px">' + T.esc(judul) + '</b></div>');
    const body = T.el('<div style="margin-top:10px"></div>');
    wrap.appendChild(body);
    return { wrap, body };
  }

  // --- (a) ukuran + kecepatan -> waktu ---
  const c1 = card('⏱️ Estimasi waktu transfer');
  const sizeA = T.input('number', 'Contoh: 100', '100');
  const unitA = T.select([['B', 'B'], ['KB', 'KB'], ['MB', 'MB'], ['GB', 'GB'], ['TB', 'TB']], 'MB');
  const speedA = T.input('number', 'Contoh: 10', '10');
  const outA = T.out();
  const hitungA = () => {
    const b = bytesDari(T.num(sizeA.value), unitA.value), mbps = T.num(speedA.value);
    if (!(b > 0) || !(mbps > 0)) { T.hide(outA); return; }
    const d = waktuTransfer(b, mbps);
    T.show(outA, '<div class="kv"><span class="k">Estimasi waktu</span><span class="v big">' + T.esc(fmtDurasi(d)) + '</span></div>' +
      '<div class="dim" style="font-size:12px">≈ ' + T.fmt(Math.round(d)) + ' detik • ' + T.fmt(Math.round(b)) + ' byte ÷ ' + T.esc(String(mbps)) + ' Mbps</div>');
  };
  [sizeA, speedA].forEach((i) => i.addEventListener('input', hitungA));
  unitA.addEventListener('change', hitungA);
  c1.body.append(T.field('Ukuran file', T.row(sizeA, unitA)), T.field('Kecepatan koneksi (Mbps)', speedA, 'Contoh: paket 20 Mbps ≈ 2,5 MB/detik'), outA);

  // --- (b) ukuran + target waktu -> kecepatan minimum ---
  const c2 = card('🚀 Kecepatan minimum yang dibutuhkan');
  const sizeB = T.input('number', 'Contoh: 4.7', '4.7');
  const unitB = T.select([['B', 'B'], ['KB', 'KB'], ['MB', 'MB'], ['GB', 'GB'], ['TB', 'TB']], 'GB');
  const timeB = T.input('number', 'Contoh: 10', '10');
  const tunitB = T.select([['detik', 'detik'], ['menit', 'menit'], ['jam', 'jam']], 'menit');
  const outB = T.out();
  const hitungB = () => {
    const b = bytesDari(T.num(sizeB.value), unitB.value);
    let t = T.num(timeB.value);
    if (!(b > 0) || !(t > 0)) { T.hide(outB); return; }
    if (tunitB.value === 'menit') t *= 60; else if (tunitB.value === 'jam') t *= 3600;
    const mbps = kecepatanMinimum(b, t);
    T.show(outB, '<div class="kv"><span class="k">Butuh minimal</span><span class="v big">' + mbps.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' Mbps</span></div>' +
      '<div class="dim" style="font-size:12px">≈ ' + (mbps / 8).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' MB/detik • tambah margin 20–30% buat overhead biar aman</div>');
  };
  [sizeB, timeB].forEach((i) => i.addEventListener('input', hitungB));
  [unitB, tunitB].forEach((s) => s.addEventListener('change', hitungB));
  c2.body.append(T.field('Ukuran file', T.row(sizeB, unitB)), T.field('Target waktu selesai', T.row(timeB, tunitB)), outB);

  root.append(
    T.el('<p class="dim" style="font-size:13px">Hitung dua arah: berapa lama download/upload, atau seberapa kencang koneksi yang kamu butuhkan. Ingat: 1 byte = 8 bit, jadi 20 Mbps ≈ 2,5 MB/detik.</p>'),
    c1.wrap, c2.wrap
  );
  hitungA(); hitungB();
}
