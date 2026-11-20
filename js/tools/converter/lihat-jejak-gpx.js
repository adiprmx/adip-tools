import { h as T, utils, kv, errBox } from '../../core.js';

export const meta = {"id": "lihat-jejak-gpx", "name": "Lihat Jejak GPX di Peta", "cat": "converter", "icon": "🗺️", "desc": "Tampilkan rute lari atau sepeda dari file GPX di peta.", "keywords": "gpx,peta,rute,lari,sepeda,jejak,track", "since": "6.19.0"};

// Leaflet 1.9.4 (jsDelivr). SRI diukur 19 Nov 2026 (B2, 2x identik)
// dan MASUK ke peta SRI_HASH core.js (G4 Blue R1, D-G4-12 / RED-03):
//   leaflet.js:  sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH
//   leaflet.css: sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H
// CSS dimuat lewat fetch lalu disuntik sebagai <style> — TAPI hash
// SHA-384 hasil fetch DIVERIFIKASI dulu ke peta SRI_HASH core.js
// (SubtleCrypto) sebelum disuntik (G4 Blue R1, RED-12): fetch tanpa
// verifikasi sama tidak amannya dengan <link> tanpa integrity.
// Penanda memakai circleMarker (tanpa gambar), jadi CSS tidak butuh
// aset gambar Leaflet.
const LEAFLET_JS = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';

// Verifikasi hash SHA-384 sebuah teks terhadap entri SRI_HASH (RED-12).
// Mengembalikan true bila hash cocok (atau bila SubtleCrypto tidak
// tersedia — lingkungan non-aman — pemanggil memperlakukannya sebagai
// gagal lewat pengecualian, bukan lolos diam-diam).
export async function verifikasiHashCss(teks, hashHarap) {
  if (!hashHarap || typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Verifikasi hash CSS tidak tersedia.');
  const buf = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(teks));
  const byte = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < byte.length; i++) bin += String.fromCharCode(byte[i]);
  return 'sha384-' + btoa(bin) === hashHarap;
}

// Jarak dua titik di permukaan bumi (meter). Fungsi murni, diuji di Node.
export function jarakHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Urai file GPX jadi daftar segmen, tiap segmen daftar titik
// {lat, lon, ele, time}. Parsing regex supaya bisa diuji di Node.
export function uraiGpx(teksGpx) {
  const xml = String(teksGpx || '');
  const segmen = [];
  const polaSeg = /<(trkseg|rte)>([\s\S]*?)<\/(trkseg|rte)>/gi;
  let mSeg;
  const bacaTitik = (bagian) => {
    const titik = [];
    const polaPt = /<(trkpt|rtept)[^>]*lat=["'](-?[\d.]+)["'][^>]*lon=["'](-?[\d.]+)["'][^>]*>([\s\S]*?)<\/(trkpt|rtept)>/gi;
    let mPt;
    while ((mPt = polaPt.exec(bagian)) !== null) {
      const isi = mPt[4] || '';
      const ele = /<ele>([^<]+)<\/ele>/i.exec(isi);
      const time = /<time>([^<]+)<\/time>/i.exec(isi);
      titik.push({
        lat: parseFloat(mPt[2]),
        lon: parseFloat(mPt[3]),
        ele: ele ? parseFloat(ele[1]) : null,
        time: time ? time[1] : null,
      });
    }
    return titik;
  };
  while ((mSeg = polaSeg.exec(xml)) !== null) {
    const titik = bacaTitik(mSeg[2]);
    if (titik.length) segmen.push(titik);
  }
  if (!segmen.length) {
    const titik = bacaTitik(xml);
    if (titik.length) segmen.push(titik);
  }
  return segmen;
}

// Statistik dari daftar segmen. Fungsi murni, diuji di Node.
export function hitungStatistikGpx(segmen) {
  let jarak = 0, naik = 0, turun = 0, jumlah = 0, eleMin = null, eleMax = null;
  let waktuAwal = null, waktuAkhir = null;
  for (const titik of segmen) {
    for (let i = 0; i < titik.length; i++) {
      const p = titik[i];
      jumlah += 1;
      if (p.ele != null && isFinite(p.ele)) {
        if (eleMin == null || p.ele < eleMin) eleMin = p.ele;
        if (eleMax == null || p.ele > eleMax) eleMax = p.ele;
      }
      if (p.time) {
        const t = Date.parse(p.time);
        if (isFinite(t)) {
          if (waktuAwal == null || t < waktuAwal) waktuAwal = t;
          if (waktuAkhir == null || t > waktuAkhir) waktuAkhir = t;
        }
      }
      if (i > 0) {
        const q = titik[i - 1];
        jarak += jarakHaversine(q.lat, q.lon, p.lat, p.lon);
        if (p.ele != null && q.ele != null) {
          const d = p.ele - q.ele;
          if (d > 0) naik += d; else turun -= d;
        }
      }
    }
  }
  const durasiDetik = (waktuAwal != null && waktuAkhir != null && waktuAkhir > waktuAwal)
    ? Math.round((waktuAkhir - waktuAwal) / 1000) : null;
  return {
    jarakMeter: jarak, naikMeter: naik, turunMeter: turun, jumlahTitik: jumlah,
    eleMin, eleMax, durasiDetik,
    kecepatanKpj: (durasiDetik && jarak > 0) ? (jarak / durasiDetik) * 3.6 : null,
  };
}

// Proyeksikan titik rute ke koordinat SVG (lebar x tinggi). Dipakai gambar
// cadangan bila peta Leaflet gagal dimuat. Fungsi murni, diuji di Node.
export function proyeksiSvg(segmen, lebar, tinggi, pad) {
  const p = pad == null ? 12 : pad;
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const titik of segmen) for (const t of titik) {
    if (t.lat < minLat) minLat = t.lat;
    if (t.lat > maxLat) maxLat = t.lat;
    if (t.lon < minLon) minLon = t.lon;
    if (t.lon > maxLon) maxLon = t.lon;
  }
  if (!isFinite(minLat)) return [];
  const spanLat = (maxLat - minLat) || 0.001;
  const spanLon = (maxLon - minLon) || 0.001;
  const skala = Math.min((lebar - p * 2) / spanLon, (tinggi - p * 2) / spanLat);
  const offX = (lebar - spanLon * skala) / 2;
  const offY = (tinggi - spanLat * skala) / 2;
  return segmen.map((titik) => titik.map((t) => [
    Math.round(offX + (t.lon - minLon) * skala),
    Math.round(offY + (maxLat - t.lat) * skala),
  ]));
}

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.gpx,application/gpx+xml,text/xml';
  const statBox = T.out();
  const petaBox = T.out();
  const box = T.out();
  let peta = null;

  const gambarSvgCadangan = (segmen) => {
    const garis = proyeksiSvg(segmen, 640, 360, 16);
    const path = garis.map((g) => g.map((pt, i) => (i ? 'L' : 'M') + pt[0] + ' ' + pt[1]).join(' ')).join(' ');
    const awal = garis[0] && garis[0][0];
    const akhir = garis[garis.length - 1] && garis[garis.length - 1][garis[garis.length - 1].length - 1];
    T.show(petaBox,
      '<p class="dim" style="font-size:13px;line-height:1.6;margin:0 0 8px">Peta tidak bisa dimuat (perlu internet untuk peta Leaflet). Ini bentuk rutenya saja:</p>' +
      '<svg viewBox="0 0 640 360" style="width:100%;height:auto;background:#18181b;border:1px solid #27272a;border-radius:12px">' +
      '<path d="' + T.esc(path) + '" fill="none" stroke="#ff6f61" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
      (awal ? '<circle cx="' + awal[0] + '" cy="' + awal[1] + '" r="6" fill="#22c55e"/>' : '') +
      (akhir ? '<circle cx="' + akhir[0] + '" cy="' + akhir[1] + '" r="6" fill="#ef4444"/>' : '') +
      '</svg>');
  };

  const gambarPeta = async (segmen) => {
    if (typeof window.L === 'undefined') {
      // Loader kanonis: utils.loadLibOnce (core.js) — timeout 30 dtk.
      const ok = await utils.loadLibOnce(LEAFLET_JS, () => typeof window.L !== 'undefined');
      if (!ok || typeof window.L === 'undefined') { gambarSvgCadangan(segmen); return; }
    }
    if (!document.getElementById('leaflet-css-b2')) {
      try {
        const hashHarap = T.scriptIntegrity(LEAFLET_CSS);
        if (!hashHarap) throw new Error('Hash CSS Leaflet tidak ada di SRI_HASH.');
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        let css;
        try {
          const res = await fetch(LEAFLET_CSS, { signal: ctrl.signal });
          if (!res.ok) throw new Error('CSS gagal');
          css = await res.text();
        } finally {
          clearTimeout(timer);
        }
        if (!(await verifikasiHashCss(css, hashHarap))) throw new Error('Hash CSS Leaflet tidak cocok.');
        const st = document.createElement('style');
        st.id = 'leaflet-css-b2';
        st.textContent = css;
        document.head.appendChild(st);
      } catch (e) { gambarSvgCadangan(segmen); return; }
    }
    try {
      T.show(petaBox, '<div id="peta-gpx-b2" style="width:100%;height:360px;border-radius:12px;overflow:hidden"></div>');
      if (peta) { peta.remove(); peta = null; }
      const semua = segmen.flat();
      const batas = semua.map((t) => [t.lat, t.lon]);
      peta = window.L.map('peta-gpx-b2').fitBounds(batas, { padding: [24, 24] });
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(peta);
      for (const titik of segmen) {
        window.L.polyline(titik.map((t) => [t.lat, t.lon]), { color: '#ff6f61', weight: 4, opacity: 0.9 }).addTo(peta);
      }
      const awal = semua[0];
      const akhir = semua[semua.length - 1];
      window.L.circleMarker([awal.lat, awal.lon], { radius: 7, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }).addTo(peta).bindPopup('Mulai');
      window.L.circleMarker([akhir.lat, akhir.lon], { radius: 7, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }).addTo(peta).bindPopup('Selesai');
    } catch (e) {
      gambarSvgCadangan(segmen);
    }
  };

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0] ? fi.files[0] : null;
    T.hide(box); T.hide(statBox); T.hide(petaBox);
    if (!f) return;
    T.show(box, '<span class="dim">Membaca file GPX…</span>');
    try {
      const teks = await f.text();
      const segmen = uraiGpx(teks);
      if (!segmen.length) { T.show(box, errBox('Tidak ada titik rute di file ini. Pastikan filenya GPX dari aplikasi lari atau sepeda.')); return; }
      const s = hitungStatistikGpx(segmen);
      const jam = s.durasiDetik != null ? Math.floor(s.durasiDetik / 3600) : 0;
      const mnt = s.durasiDetik != null ? Math.floor((s.durasiDetik % 3600) / 60) : 0;
      const durasi = s.durasiDetik != null ? (jam ? jam + ' jam ' : '') + mnt + ' menit' : 'Tidak tercatat di file';
      T.hide(box);
      T.show(statBox,
        kv('Jarak', (s.jarakMeter / 1000).toFixed(2) + ' km') +
        kv('Titik rute', s.jumlahTitik + ' titik') +
        kv('Durasi', durasi) +
        (s.kecepatanKpj != null ? kv('Kecepatan rata-rata', s.kecepatanKpj.toFixed(1) + ' km/jam') : '') +
        (s.eleMin != null ? kv('Ketinggian', Math.round(s.eleMin) + ' m sampai ' + Math.round(s.eleMax) + ' m') : '') +
        (s.naikMeter > 0 ? kv('Total tanjakan', Math.round(s.naikMeter) + ' m') : ''));
      const tengah = segmen[0][Math.floor(segmen[0].length / 2)];
      statBox.appendChild(T.el('<a href="https://www.openstreetmap.org/?mlat=' + tengah.lat + '&mlon=' + tengah.lon + '#map=15/' + tengah.lat + '/' + tengah.lon + '" target="_blank" rel="noopener" style="display:inline-block;margin:8px 0;font-size:13px;color:#fff">Buka lokasi di OpenStreetMap</a>'));
      T.show(petaBox, '<span class="dim">Memuat peta…</span>');
      await gambarPeta(segmen);
    } catch (e) {
      T.show(box, errBox('File tidak bisa dibaca sebagai GPX.'));
    }
  });

  T.onLeave(() => { if (peta) { try { peta.remove(); } catch (e) {} peta = null; } });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih file GPX dari jam, aplikasi lari, atau aplikasi sepeda. Rutenya tampil di peta lengkap dengan jarak, durasi, dan tanjakan. Peta butuh internet, statistik dihitung lokal.</p>'));
  root.appendChild(T.field('Pilih file GPX', fi));
  root.appendChild(box);
  root.appendChild(statBox);
  root.appendChild(petaBox);
}
