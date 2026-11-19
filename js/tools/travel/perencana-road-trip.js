import { h as T, utils, kv } from '../../core.js';

// Perencana road trip: daftar pemberhentian (nama, jarak dari titik
// sebelumnya, lama singgah), lalu total jarak, lama nyetir, total waktu,
// bensin yang dipakai, biayanya, dan saran istirahat tiap 2 jam nyetir.
export function hitungRoadTrip(perhentian, kecepatanKmh, konsumsiKmPerLiter, hargaBbmPerLiter, jamNyeterPerHari) {
  const stops = (Array.isArray(perhentian) ? perhentian : []).map((s) => ({
    nama: String(s && s.nama ? s.nama : ''),
    jarakKm: Math.max(0, Number(s && s.jarakKm) || 0),
    singgahMenit: Math.max(0, Number(s && s.singgahMenit) || 0),
  }));
  const kec = Number(kecepatanKmh);
  const kons = Number(konsumsiKmPerLiter);
  const harga = Number(hargaBbmPerLiter) || 0;
  const jamHari = Math.max(1, Number(jamNyeterPerHari) || 8);
  if (!isFinite(kec) || kec <= 0 || !isFinite(kons) || kons <= 0) return null;
  const totalJarak = stops.reduce((a, s) => a + s.jarakKm, 0);
  const totalSinggah = stops.reduce((a, s) => a + s.singgahMenit, 0);
  const nyetirMenit = totalJarak / kec * 60;
  const totalMenit = nyetirMenit + totalSinggah;
  const bensinLiter = totalJarak / kons;
  return {
    stops, totalJarak: Math.round(totalJarak * 10) / 10,
    nyetirMenit: Math.round(nyetirMenit),
    singgahMenit: totalSinggah,
    totalMenit: Math.round(totalMenit),
    bensinLiter: Math.round(bensinLiter * 10) / 10,
    biayaBbm: Math.round(bensinLiter * harga),
    istirahat: Math.floor(nyetirMenit / 120),
    hari: Math.max(1, Math.ceil(nyetirMenit / 60 / jamHari)),
  };
}
export function fmtDurasi(menit) {
  const total = Math.round(Number(menit) || 0);
  const j = Math.floor(total / 60);
  const m = total % 60;
  if (j <= 0) return total + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}
utils.roadTrip = { hitungRoadTrip, fmtDurasi };

export const meta = {"id": "perencana-road-trip", "name": "Perencana Road Trip", "cat": "travel", "icon": "🛣️", "desc": "Rencanakan road trip: jarak, lama nyetir, bensin, biaya, dan saran istirahatnya.", "keywords": "road trip,perjalanan darat,rencana liburan,rute mobil,biaya bensin,roadtrip", "since": "6.19.0"};
export function render(root) {
  const kecI = T.input('text', 'cth: 60', '60'); kecI.inputMode = 'decimal';
  const konsI = T.input('text', 'cth: 14', '14'); konsI.inputMode = 'decimal';
  const hargaI = T.input('text', 'cth: 10000', '10000'); hargaI.inputMode = 'decimal';
  const jamHariI = T.input('text', 'cth: 8', '8'); jamHariI.inputMode = 'decimal';
  const daftarBox = T.el('<div></div>');
  const box = T.out();
  let baris = [];

  const buatBaris = (nama, jarak, singgah) => {
    const wrap = T.el('<div style="border:1px solid rgba(127,127,127,.3);border-radius:12px;padding:10px;margin-bottom:8px"></div>');
    const namaI = T.input('text', 'Nama tempat, cth: Bandung', nama || '');
    const jarakI = T.input('text', 'Jarak dari titik sebelumnya (km)', jarak || ''); jarakI.inputMode = 'decimal';
    const singgahI = T.input('text', 'Lama singgah (menit)', singgah || ''); singgahI.inputMode = 'numeric';
    const hapus = T.btn('Hapus', () => {
      baris = baris.filter((b) => b.wrap !== wrap);
      wrap.remove();
      hitung();
    });
    hapus.style.marginTop = '8px';
    wrap.appendChild(T.field('Tempat', namaI));
    wrap.appendChild(T.grid2(T.field('Jarak (km)', jarakI), T.field('Singgah (menit)', singgahI)));
    wrap.appendChild(hapus);
    const b = { wrap, namaI, jarakI, singgahI };
    [namaI, jarakI, singgahI].forEach((i) => i.addEventListener('input', hitung));
    return b;
  };
  const tambahBaris = (nama, jarak, singgah) => {
    const b = buatBaris(nama, jarak, singgah);
    baris.push(b);
    daftarBox.appendChild(b.wrap);
  };

  const hitung = () => {
    const kec = T.num(kecI.value);
    const kons = T.num(konsI.value);
    const harga = T.num(hargaI.value);
    const jamHari = T.num(jamHariI.value);
    const stops = baris.map((b) => ({ nama: b.namaI.value.trim(), jarakKm: T.num(b.jarakI.value), singgahMenit: T.num(b.singgahI.value) }));
    const adaInput = stops.some((s) => s.nama || isFinite(s.jarakKm));
    if (!adaInput) { T.hide(box); return; }
    for (let i = 0; i < baris.length; i++) {
      const b = baris[i];
      const s = stops[i];
      if (b.jarakI.value.trim() && (!isFinite(s.jarakKm) || s.jarakKm < 0)) { T.show(box, '<div class="err">Jarak tiap pemberhentian harus angka 0 atau lebih.</div>'); return; }
      if (b.singgahI.value.trim() && (!isFinite(s.singgahMenit) || s.singgahMenit < 0)) { T.show(box, '<div class="err">Lama singgah harus angka 0 atau lebih.</div>'); return; }
    }
    if (!isFinite(kec) || kec <= 0 || kec > 200) { T.show(box, '<div class="err">Kecepatan rata-rata harus angka lebih dari 0 sampai 200 km/jam.</div>'); return; }
    if (!isFinite(kons) || kons <= 0 || kons > 100) { T.show(box, '<div class="err">Konsumsi bensin harus angka lebih dari 0 sampai 100 km/liter.</div>'); return; }
    if (!isFinite(harga) || harga < 0) { T.show(box, '<div class="err">Harga bensin harus angka 0 atau lebih.</div>'); return; }
    if (!isFinite(jamHari) || jamHari <= 0 || jamHari > 24) { T.show(box, '<div class="err">Jam nyetir per hari harus angka lebih dari 0 sampai 24.</div>'); return; }
    const r = hitungRoadTrip(stops, kec, kons, harga, jamHari);
    if (!r.totalJarak) { T.show(box, '<div class="err">Isi jarak minimal satu pemberhentian.</div>'); return; }
    T.show(box,
      '<div class="big">' + T.fmt(r.totalJarak) + ' km</div>' +
      '<p class="center mut">Total jarak ' + r.stops.filter((s) => s.jarakKm > 0).length + ' pemberhentian, sekitar ' + r.hari + ' hari perjalanan.</p>' +
      kv('Lama nyetir', fmtDurasi(r.nyetirMenit)) +
      kv('Lama singgah', fmtDurasi(r.singgahMenit)) +
      kv('Total waktu', fmtDurasi(r.totalMenit)) +
      kv('Bensin', utils.fmtDes(r.bensinLiter, 1) + ' liter') +
      kv('Biaya bensin', T.rp(r.biayaBbm)) +
      kv('Saran istirahat', r.istirahat > 0 ? r.istirahat + 'x berhenti 15 menit (tiap 2 jam nyetir)' : 'Tidak perlu berhenti khusus, perjalanan di bawah 2 jam') +
      '<p class="hint">Kecepatan rata-rata di jalan tol yang lancar sekitar 70 sampai 80 km/jam, di jalan biasa 40 sampai 60 km/jam. Biaya di atas baru bensin, belum tol, makan, dan penginapan. Berhenti tiap 2 jam bukan cuma saran, supir yang lelah itu bahaya.</p>');
  };
  [kecI, konsI, hargaI, jamHariI].forEach((i) => i.addEventListener('input', hitung));
  // Dua baris awal dibuat SESUDAH hitung didefinisikan (buatBaris
  // mengevaluasi hitung saat memasang listener).
  tambahBaris('', '', '');
  tambahBaris('', '', '');

  root.appendChild(T.el('<p class="note">Tambahkan tiap tempat yang mau disinggahi beserta jaraknya dari titik sebelumnya.</p>'));
  root.appendChild(daftarBox);
  root.appendChild(T.btn('+ Tambah pemberhentian', () => { tambahBaris('', '', ''); hitung(); }));
  root.appendChild(T.grid2(
    T.field('Kecepatan rata-rata (km/jam)', kecI),
    T.field('Konsumsi bensin (km/liter)', konsI, 'Cek di MID mobil atau hitung manual')
  ));
  root.appendChild(T.grid2(
    T.field('Harga bensin (Rp/liter)', hargaI),
    T.field('Maks nyetir per hari (jam)', jamHariI)
  ));
  root.appendChild(box);
}
