// Helper "wrapped" tahunan bersama: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari 9 tool fun/*-wrapped.js + statistik-spotify-tahunan.js
// (G4 B16/B17/B18). Semua fungsi di sini byte-identik di file-file asalnya
// (dikelompokkan per hash isi fungsi); varian yang BERBEDA dibiarkan lokal:
// - hitungStreak Instagram (tanpa .filter(Boolean) + tanpa pelindung NaN)
// - hitungRingkasan Strava & TikTok (medan berbeda)
// - parseCSV vs parseCsvBaris memang dua fungsi berbeda (parseCSV
//   memecah baris di \r dan menyaring baris kosong; parseCsvBaris
//   membuang \r diam-diam dan tidak menyaring); keduanya diekspor
//   terpisah. Keduanya juga berbeda dari utils.parseCSV (core.js),
//   jadi tidak memakai kanon itu.
// - parseDaftarTeks ada dua varian yang hanya berbeda kunci hasil:
//   {nama, jumlah} (discord/instagram/whatsapp/youtube) dan
//   {nama, nilai} (apple-music/spotify); diekspor sebagai
//   parseDaftarTeks (jumlah) + parseDaftarNilai (nilai); tool
//   nilai-varian mengekspor ulang dengan nama aslinya.
import { h as T } from './core.js';

// Parser CSV kecil: petik dua + koma di dalam petik; \r\n dihitung satu
// pemisah baris; baris kosong disaring. (letterboxd + netflix)
export function parseCSV(teks) {
  const baris = [];
  let cur = [''], dalamKutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
        else dalamKutip = false;
      } else cur[cur.length - 1] += c;
    } else if (c === '"') dalamKutip = true;
    else if (c === ',') cur.push('');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && teks[i + 1] === '\n') i++;
      baris.push(cur); cur = [''];
    } else cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0] !== '') baris.push(cur);
  return baris.filter((r) => r.some((c) => String(c).trim() !== ''));
}

// Parser CSV kecil: petik dua + koma di dalam petik; \r dibuang
// diam-diam; baris kosong TIDAK disaring (pemanggil menyaring sendiri
// bila perlu). (apple-music + strava)
export function parseCsvBaris(teks) {
  const baris = [];
  let cur = [''], dalamPetik = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamPetik) {
      if (c === '"') {
        if (teks[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
        else dalamPetik = false;
      } else cur[cur.length - 1] += c;
    } else if (c === '"') dalamPetik = true;
    else if (c === ',') cur.push('');
    else if (c === '\n') { baris.push(cur); cur = ['']; }
    else if (c !== '\r') cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0] !== '') baris.push(cur);
  return baris;
}

// Daftar manual: satu baris "Nama: angka". Hasil {nama, jumlah}.
// (discord/instagram/whatsapp/youtube)
export function parseDaftarTeks(teks) {
  return teks.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?):\s*([\d.,]+)\s*$/);
    if (!m) return null;
    const nilai = Number(m[2].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(nilai) && nilai > 0 ? { nama: m[1].trim(), jumlah: nilai } : null;
  }).filter(Boolean);
}

// Daftar manual: satu baris "Nama: angka". Hasil {nama, nilai}.
// (apple-music/spotify; bentuknya sama persis dengan parseDaftarTeks
// kecuali kunci hasil.)
export function parseDaftarNilai(teks) {
  return teks.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?):\s*([\d.,]+)\s*$/);
    if (!m) return null;
    const nilai = Number(m[2].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(nilai) && nilai > 0 ? { nama: m[1].trim(), nilai } : null;
  }).filter(Boolean);
}

// Ringkasan turunan dari hasil parseAppleCsv/parseSpotifyJson:
// jam, menit per hari, setara jumlah lagu (±3,5 menit/lagu).
// (apple-music + statistik-spotify-tahunan)
export function hitungRingkasan(d) {
  const menit = d.totalMenit || 0;
  const bulat4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };
  return {
    menit,
    jam: bulat4(menit / 60),
    perHari: bulat4(menit / 365),
    setaraLagu: Math.round(menit / 3.5),
  };
}

// Hitung kemunculan tiap emoji dalam teks (Extended_Pictographic +
// varian selector opsional). (discord/instagram/whatsapp)
export function hitungEmoji(teks) {
  const out = {};
  const re = /\p{Extended_Pictographic}\uFE0F?/gu;
  let m;
  while ((m = re.exec(teks)) !== null) out[m[0]] = (out[m[0]] || 0) + 1;
  return out;
}

// n entri teratas dari peta {nama: jumlah}, urut menurun.
// (discord/instagram/whatsapp/youtube)
export function topDariMap(map, n) {
  return Object.entries(map).map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah).slice(0, n || 5);
}

// Satu baris batang horizontal (label + nilai + bar persentase).
// (7 tool wrapped; privat di tiap tool; diekspor modul agar bisa
// dipakai bersama, TIDAK diekspor ulang oleh tool.)
export function barisBatang(label, nilai, maks, satuan) {
  const pct = maks > 0 ? Math.max(2, Math.round((nilai / maks) * 100)) : 0;
  return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' +
    T.esc(label) + '</span><b>' + T.fmt(nilai) + ' ' + satuan + '</b></div>' +
    '<div style="height:8px;background:#ffffff14;border-radius:4px;margin-top:3px"><div style="height:8px;width:' +
    pct + '%;background:#fff;border-radius:4px"></div></div></div>';
}

// Streak hari berurutan terpanjang dari daftar tanggal 'YYYY-MM-DD'
// (kosong/invalid diabaikan). (letterboxd + netflix)
export function hitungStreak(tanggalList) {
  const set = new Set(tanggalList.filter(Boolean));
  if (!set.size) return 0;
  let terbaik = 0;
  for (const t of set) {
    const d = new Date(t + 'T00:00:00Z');
    if (isNaN(d.getTime())) continue;
    const kemarin = new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
    if (set.has(kemarin)) continue;
    let run = 1, cur = d.getTime();
    while (set.has(new Date(cur + 86400000).toISOString().slice(0, 10))) { run++; cur += 86400000; }
    if (run > terbaik) terbaik = run;
  }
  return terbaik;
}

// Ekor agregasi parseAppleCsv/parseSpotifyJson (byte-identik di
// keduanya): dari dua Map yang sudah terisi (artis: nama -> ms,
// lagu: kunci -> {judul, artis, putar, ms}) + total, hasilkan
// ringkasan 5 teratas. Kepala parser (ekstraksi per baris) tetap
// lokal karena format masukannya berbeda (CSV vs JSON).
export function agregasiPutar(artis, lagu, totalMs, totalPutar) {
  if (totalPutar === 0) return null;
  const topArtis = [...artis.entries()].map(([nama, ms]) => ({ nama, menit: Math.round(ms / 60000) }))
    .sort((x, y) => y.menit - x.menit).slice(0, 5);
  const topLagu = [...lagu.values()].map((l) => ({ judul: l.judul, artis: l.artis, putar: l.putar }))
    .sort((x, y) => y.putar - x.putar).slice(0, 5);
  return { totalMenit: Math.round(totalMs / 60000), totalPutar, totalArtis: artis.size, totalLagu: lagu.size, topArtis, topLagu };
}
