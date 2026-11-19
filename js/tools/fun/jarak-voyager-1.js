import { h as T, utils } from '../../core.js';

// Jarak Voyager 1 Sekarang: dihitung dari titik acuan NASA + kecepatan
// jelajahnya. Titik acuan: 25 Agustus 2012 Voyager 1 menembus heliopause
// pada jarak 121,6 SA dari Matahari (angka NASA yang banyak dikutip).
// Kecepatan rata-rata yang dipakai 16,95 km/detik (sekitar 17 km/detik,
// angka publik NASA; gravitasi Matahari memperlambatnya sedikit dari
// tahun ke tahun, jadi dipakai rata-rata, bukan angka sesaat).
// BELUM TERVERIFIKASI WEB (egress mati saat build, 19 Nov 2026): angka
// epoch dan kecepatan ini dari ingatan + hitungan silang (121,6 SA pada
// 2012 + 3,58 SA/tahun cocok dengan laporan "lebih dari 15 miliar mil"
// pada 2024). QA mohon cek ulang ke science.nasa.gov saat egress pulih.
export const meta = {"id": "jarak-voyager-1", "name": "Jarak Voyager 1 Sekarang", "cat": "fun", "icon": "🛰️", "desc": "Seberapa jauh Voyager 1 dari Bumi sekarang, dihitung dari titik acuan NASA + kecepatannya. Angka acuan tampil jelas di layar.", "keywords": "voyager,voyager 1,nasa,luar angkasa,jarak,antariksa,satelit", "since": "6.19.0"};

export const AU_KM = 149597870.7;
export const C_KMS = 299792.458;
// Epoch: 25 Agu 2012 00:00 UTC, 121,6 SA dari Matahari.
export const EPOCH_MS = Date.UTC(2012, 7, 25);
export const EPOCH_AU = 121.6;
export const KECEPATAN_KMS = 16.95;
// Arah Voyager 1 di langit (RA 17j13m, Dek +12°): bujur ekliptika
// 255,6 derajat, lintang ekliptika +34,9 derajat.
export const V1_LON = 255.6;
export const V1_LAT = 34.9;

const D2R = Math.PI / 180;

// Jarak dari Matahari (SA) pada tanggal tertentu. Murni.
export function jarakMatahariAU(tanggal) {
  const detik = (tanggal.getTime() - EPOCH_MS) / 1000;
  return EPOCH_AU + (KECEPATAN_KMS * detik) / AU_KM;
}

// Bujur heliosentris Bumi (derajat): bujur geosentris Matahari
// (pendekatan mean longitude + equation of center) ditambah 180.
// Cukup akurat untuk jarak Bumi-Voyager.
export function bujurBumi(tanggal) {
  const d = (tanggal.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const M = (357.529 + 0.9856003 * d) % 360;
  const L = 280.46 + 0.9856474 * d + 1.915 * Math.sin(M * D2R) + 0.02 * Math.sin(2 * M * D2R);
  return ((L + 180) % 360 + 360) % 360;
}

// Jarak dari Bumi (SA) via geometri 3D: posisi Voyager (arah tetap,
// jarak dari Matahari) dikurangi posisi Bumi (1 SA pada bujur L).
export function jarakBumiAU(tanggal) {
  const r = jarakMatahariAU(tanggal);
  const L = bujurBumi(tanggal) * D2R;
  const lo = V1_LON * D2R, la = V1_LAT * D2R;
  const vx = r * Math.cos(la) * Math.cos(lo);
  const vy = r * Math.cos(la) * Math.sin(lo);
  const vz = r * Math.sin(la);
  const ex = Math.cos(L), ey = Math.sin(L);
  const dx = vx - ex, dy = vy - ey, dz = vz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Waktu tempuh cahaya (detik) untuk jarak dalam SA.
export function waktuCahayaDetik(au) {
  return (au * AU_KM) / C_KMS;
}

export function fmtDurasi(detik) {
  const d = Math.floor(detik / 86400);
  const j = Math.floor((detik % 86400) / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = Math.floor(detik % 60);
  if (d > 0) return d + ' hari ' + j + ' jam';
  if (j > 0) return j + ' jam ' + m + ' menit';
  if (m > 0) return m + ' menit ' + s + ' detik';
  return s + ' detik';
}

export function render(root) {
  const box = T.out();
  let timer = null;

  const gambar = () => {
    const now = new Date();
    const auBumi = jarakBumiAU(now);
    const auMatahari = jarakMatahariAU(now);
    const km = auBumi * AU_KM;
    const mil = km * 0.621371;
    const cahaya = waktuCahayaDetik(auBumi);
    T.show(box,
      '<p class="hint center">Jarak dari Bumi, saat ini</p>' +
      '<div class="big center">' + T.fmt(Math.round(km)) + '<span class="mut" style="font-size:15px"> km</span></div>' +
      '<p class="center hint">sekitar ' + T.fmt(Math.round(mil)) + ' mil</p>' +
      '<div style="margin-top:12px">' +
      '<div class="kv"><span class="k">Dalam satuan astronomi (SA)</span><span class="v">' + utils.r4(auBumi) + ' SA</span></div>' +
      '<div class="kv"><span class="k">Jarak dari Matahari</span><span class="v">' + utils.r4(auMatahari) + ' SA</span></div>' +
      '<div class="kv"><span class="k">Sinyal radio sampai ke Bumi</span><span class="v">' + fmtDurasi(cahaya) + '</span></div>' +
      '<div class="kv"><span class="k">Kecepatan menjauh</span><span class="v">16,95 km/detik</span></div>' +
      '<div class="kv"><span class="k">Dalam setahun, makin jauh</span><span class="v">sekitar 3,58 SA</span></div>' +
      '</div>' +
      '<p class="hint" style="margin-top:12px">Cara hitungnya: titik acuan 25 Agustus 2012 saat Voyager 1 menembus batas tata surya pada 121,6 SA dari Matahari, ditambah kecepatan rata-rata 16,95 km/detik dikali waktu yang lewat. Jarak dari Bumi dihitung dari posisi Bumi di orbitnya, jadi angkanya naik turun sedikit sepanjang tahun. Ini perkiraan dari rumus, bukan data live NASA. Angka acuan belum dicek ulang ke situs NASA karena koneksi internet sedang mati saat tool ini dibuat.</p>');
  };

  root.appendChild(T.el('<p class="hint">Voyager 1 adalah benda buatan manusia yang paling jauh dari Bumi. Diluncurkan 1977, sekarang ia melayang di ruang antar bintang. Angka di bawah ini bergerak live, bertambah 16,95 km setiap detik.</p>'));
  root.appendChild(box);
  gambar();
  timer = setInterval(gambar, 1000);
  T.onLeave(() => { if (timer) clearInterval(timer); });
}
