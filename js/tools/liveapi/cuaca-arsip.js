import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"cuaca-arsip","name":"Cuaca Arsip","cat":"liveapi","icon":"🗓️","desc":"Lihat cuaca hari-hari yang sudah lewat: suhu siang, malam, dan hujan.","keywords":"cuaca,arsip,historis,tanggal lampau,suhu,hujan,open-meteo","since":"6.18.0", "online": true};

// Cuaca tanggal lampau lewat Open-Meteo Archive, tanpa key.
// Terverifikasi 18 Nov 2026: archive-api.open-meteo.com/v1/archive -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200. Batas layanan: 10.000 permintaan/hari per alamat IP.
const API = 'https://archive-api.open-meteo.com/v1/archive';

export const KOTA = [
  ['jakarta', 'Jakarta', -6.2, 106.8],
  ['bandung', 'Bandung', -6.9, 107.6],
  ['surabaya', 'Surabaya', -7.25, 112.75],
  ['medan', 'Medan', 3.59, 98.67],
  ['semarang', 'Semarang', -6.97, 110.42],
  ['yogyakarta', 'Yogyakarta', -7.8, 110.36],
  ['makassar', 'Makassar', -5.15, 119.42],
  ['denpasar', 'Denpasar', -8.67, 115.22],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function urlArsip(lat, lon, mulai, sampai) {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: mulai,
    end_date: sampai,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'Asia/Jakarta',
  });
  return API + '?' + q.toString();
}

// Validasi rentang tanggal. Mengembalikan pesan salah, atau null bila sah.
// Data arsip tersedia mulai 1940 dan biasanya sampai beberapa hari lalu.
export function validasiRentang(mulai, sampai, hariIni) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mulai) || !/^\d{4}-\d{2}-\d{2}$/.test(sampai)) {
    return 'Pilih tanggal mulai dan tanggal akhir dulu.';
  }
  if (sampai < mulai) return 'Tanggal akhir tidak boleh sebelum tanggal mulai.';
  if (mulai < '1940-01-01') return 'Data arsip baru tersedia mulai tahun 1940.';
  if (sampai > hariIni) return 'Tanggal akhir tidak boleh lewat hari ini.';
  const hari = (Date.parse(sampai) - Date.parse(mulai)) / 86400000 + 1;
  if (hari > 31) return 'Rentangnya maksimal 31 hari.';
  return null;
}

export function ringkasCuaca(j) {
  const d = j && j.daily;
  if (!d || !Array.isArray(d.time) || !d.time.length) return null;
  const baris = d.time.map((t, i) => ({
    tanggal: t,
    maks: Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max[i] : null,
    min: Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min[i] : null,
    hujan: Array.isArray(d.precipitation_sum) ? d.precipitation_sum[i] : null,
  }));
  const angka = (a) => a.filter((x) => typeof x === 'number');
  const maks = angka(baris.map((b) => b.maks));
  const min = angka(baris.map((b) => b.min));
  const hujan = angka(baris.map((b) => b.hujan));
  const rata = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  return {
    baris,
    rataMaks: rata(maks),
    rataMin: rata(min),
    totalHujan: hujan.length ? hujan.reduce((s, x) => s + x, 0) : null,
  };
}

const fmtTanggal = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtSuhu = (v) => (typeof v === 'number' ? v.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '°C' : '-');
const fmtHujan = (v) => (typeof v === 'number' ? v.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' mm' : '-');

export function render(root) {
  const box = T.out();
  const kotaSel = T.select(KOTA.map((k) => [k[0], k[1]]), 'jakarta');
  const hariIni = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const akhir = new Date(hariIni); akhir.setDate(akhir.getDate() - 7);
  const awal = new Date(hariIni); awal.setDate(awal.getDate() - 13);
  const mulaiInp = T.input('date', '', iso(awal));
  const sampaiInp = T.input('date', '', iso(akhir));

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', lihat));
    box.appendChild(w);
  };

  const lihat = async () => {
    const kota = KOTA.find((k) => k[0] === kotaSel.value) || KOTA[0];
    const salah = validasiRentang(mulaiInp.value, sampaiInp.value, iso(hariIni));
    if (salah) { T.show(box, errBox(salah)); return; }
    T.show(box, '<p class="mut">Mengambil data cuaca ' + esc(kota[1]) + '…</p>');
    try {
      const hasil = ringkasCuaca(await getJSON(urlArsip(kota[2], kota[3], mulaiInp.value, sampaiInp.value)));
      if (!hasil) {
        T.show(box, '<p class="center dim">Tidak ada data cuaca untuk rentang itu. Coba rentang lain.</p>');
        return;
      }
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:17px">Cuaca ' + esc(kota[1]) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc(fmtTanggal(mulaiInp.value)) + ' sampai ' + esc(fmtTanggal(sampaiInp.value)) + ' (' + hasil.baris.length + ' hari)</div>' +
        '<div style="display:flex;gap:16px;justify-content:center;margin-top:10px;flex-wrap:wrap">' +
        '<div><div class="dim" style="font-size:12px">Rata-rata siang</div><div style="font-weight:700">' + esc(fmtSuhu(hasil.rataMaks)) + '</div></div>' +
        '<div><div class="dim" style="font-size:12px">Rata-rata malam</div><div style="font-weight:700">' + esc(fmtSuhu(hasil.rataMin)) + '</div></div>' +
        '<div><div class="dim" style="font-size:12px">Total hujan</div><div style="font-weight:700">' + esc(fmtHujan(hasil.totalHujan)) + '</div></div>' +
        '</div></div>' +
        '<table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 4px;border-bottom:1px solid #2e2823">Tanggal</th><th style="text-align:right;padding:6px 4px;border-bottom:1px solid #2e2823">Siang</th><th style="text-align:right;padding:6px 4px;border-bottom:1px solid #2e2823">Malam</th><th style="text-align:right;padding:6px 4px;border-bottom:1px solid #2e2823">Hujan</th></tr></thead><tbody>' +
        hasil.baris.map((b) => '<tr><td style="padding:5px 4px">' + esc(fmtTanggal(b.tanggal)) + '</td><td style="text-align:right;padding:5px 4px">' + esc(fmtSuhu(b.maks)) + '</td><td style="text-align:right;padding:5px 4px">' + esc(fmtSuhu(b.min)) + '</td><td style="text-align:right;padding:5px 4px">' + esc(fmtHujan(b.hujan)) + '</td></tr>').join('') +
        '</tbody></table>' +
        '<p class="hint">Sumber: Open-Meteo Archive. Suhu siang = tertinggi harian, suhu malam = terendah harian.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server cuaca tidak bisa dihubungi dalam 10 detik.'
        : 'Gagal mengambil data cuaca. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Lihat cuaca hari-hari yang sudah lewat di kota pilihanmu: suhu siang dan malam, plus hujan tiap hari.</p>'));
  root.appendChild(T.field('Kota', kotaSel));
  root.appendChild(T.field('Dari tanggal', mulaiInp));
  root.appendChild(T.field('Sampai tanggal', sampaiInp, 'Rentang maksimal 31 hari'));
  root.appendChild(T.row(T.btn('Lihat cuaca', lihat, true)));
  root.appendChild(box);
}
