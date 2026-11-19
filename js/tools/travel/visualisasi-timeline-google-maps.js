import { h as T, utils, kv, fileInput, LOCAL_NOTE } from '../../core.js';
import { jarakHaversine } from '../converter/lihat-jejak-gpx.js';

// Visualisasi Timeline Google Maps dari file ekspor Google Takeout
// (Location History / Timeline). Dua format didukung: format lama
// {locations: [{timestampMs, latitudeE7, longitudeE7}]} dan format baru
// {semanticSegments: [{timelinePath: [{point: {latLng: "lat, lon"}}]}]}.
// Semua diproses lokal, file tidak diunggah ke mana-mana.
export function uraiTimeline(data) {
  const titik = [];
  let format = '';
  if (data && Array.isArray(data.locations)) {
    format = 'lama';
    data.locations.forEach((l) => {
      const lat = Number(l && l.latitudeE7) / 1e7;
      const lon = Number(l && l.longitudeE7) / 1e7;
      const t = Number(l && l.timestampMs);
      if (isFinite(lat) && isFinite(lon) && isFinite(t)) titik.push({ t, lat, lon });
    });
  } else if (data && Array.isArray(data.semanticSegments)) {
    format = 'baru';
    data.semanticSegments.forEach((seg) => {
      const jalur = Array.isArray(seg && seg.timelinePath) ? seg.timelinePath : [];
      jalur.forEach((p) => {
        const ll = p && p.point && p.point.latLng;
        if (typeof ll !== 'string') return;
        const [latS, lonS] = ll.split(',');
        const lat = Number(latS);
        const lon = Number(lonS);
        const t = p.time ? Date.parse(p.time) : (seg.startTime ? Date.parse(seg.startTime) : NaN);
        if (isFinite(lat) && isFinite(lon) && isFinite(t)) titik.push({ t, lat, lon });
      });
    });
  } else {
    return { format: '', titik: [], jarakKm: 0, hariAktif: 0, mulai: null, akhir: null, perBulan: [] };
  }
  titik.sort((a, b) => a.t - b.t);
  let jarakM = 0;
  for (let i = 1; i < titik.length; i++) {
    const d = jarakHaversine(titik[i - 1].lat, titik[i - 1].lon, titik[i].lat, titik[i].lon);
    // Lompatan > 500 km antar dua titik berurutan dianggap pindah pesawat
    // atau data loncat, tetap dihitung tapi dicatat apa adanya.
    if (isFinite(d)) jarakM += d;
  }
  const hari = new Set(titik.map((p) => new Date(p.t).toISOString().slice(0, 10)));
  const bulanMap = {};
  titik.forEach((p) => {
    const b = new Date(p.t).toISOString().slice(0, 7);
    bulanMap[b] = (bulanMap[b] || 0) + 1;
  });
  const perBulan = Object.keys(bulanMap).sort().map((b) => ({ bulan: b, titik: bulanMap[b] }));
  return {
    format,
    titik,
    jarakKm: Math.round(jarakM / 1000),
    hariAktif: hari.size,
    mulai: titik.length ? titik[0].t : null,
    akhir: titik.length ? titik[titik.length - 1].t : null,
    perBulan,
  };
}
export function namaBulan(yyyymm) {
  const nama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m] = String(yyyymm).split('-');
  const idx = Number(m) - 1;
  if (!nama[idx]) return String(yyyymm);
  return nama[idx] + ' ' + y;
}
utils.timelineMaps = { uraiTimeline, namaBulan };

export const meta = {"id": "visualisasi-timeline-google-maps", "name": "Visualisasi Timeline Google Maps", "cat": "travel", "icon": "🗺️", "desc": "Lihat ringkasan perjalananmu dari file ekspor Timeline Google Maps (Takeout): jarak, hari aktif, dan grafik per bulan.", "keywords": "google maps timeline,timeline,location history,google takeout,riwayat lokasi,visualisasi perjalanan", "since": "6.19.0"};
export function render(root) {
  const fi = fileInput('.json,application/json');
  const box = T.out();
  const contohBox = T.el('<div></div>');

  const tampil = (r) => {
    if (!r.titik.length) {
      T.show(box, '<div class="err">File ini tidak berisi titik lokasi yang bisa dibaca. Pastikan file-nya ekspor Location History / Timeline dari Google Takeout (format JSON).</div>');
      return;
    }
    const mulai = new Date(r.mulai);
    const akhir = new Date(r.akhir);
    const fmtTgl = (d) => d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    const maks = Math.max.apply(null, r.perBulan.map((b) => b.titik).concat([1]));
    const barBulan = r.perBulan.slice(-12).map((b) => {
      const persen = Math.round(b.titik / maks * 100);
      return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + T.esc(namaBulan(b.bulan)) + '</span><span><b>' + T.fmt(b.titik) + '</b> titik</span></div>' +
        '<div style="height:8px;border-radius:4px;background:rgba(127,127,127,.18);overflow:hidden;margin-top:3px"><div style="height:100%;width:' + Math.max(persen, 2) + '%;background:#ff6b4a;border-radius:4px"></div></div></div>';
    }).join('');
    const contoh = r.titik.slice(-5).reverse().map((p) => {
      const d = new Date(p.t);
      return '<div style="font-size:13px;padding:6px 0;border-bottom:1px solid rgba(127,127,127,.15)">' + fmtTgl(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' · ' + p.lat.toFixed(4) + ', ' + p.lon.toFixed(4) + '</div>';
    }).join('');
    T.show(box,
      '<div class="big">' + T.fmt(r.jarakKm) + ' km</div>' +
      '<p class="center mut">Total jarak antar titik lokasi yang terekam.</p>' +
      kv('Titik lokasi', T.fmt(r.titik.length)) +
      kv('Hari aktif', T.fmt(r.hariAktif) + ' hari') +
      kv('Rentang tanggal', fmtTgl(mulai) + ' sampai ' + fmtTgl(akhir)) +
      kv('Format file', r.format === 'lama' ? 'Location History (lama)' : 'Timeline (baru)') +
      '<div class="dim" style="margin-top:12px">Titik per bulan (12 bulan terakhir)</div>' + barBulan +
      '<div class="dim" style="margin-top:12px">5 titik terakhir</div>' + contoh);
  };

  fi.addEventListener('change', () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    const baca = new FileReader();
    baca.onload = () => {
      try {
        const data = JSON.parse(String(baca.result || ''));
        tampil(uraiTimeline(data));
      } catch (e) {
        T.show(box, '<div class="err">File tidak bisa dibaca sebagai JSON. Pastikan file-nya hasil ekspor Google Takeout yang belum diubah.</div>');
      }
      fi.value = '';
    };
    baca.onerror = () => T.show(box, '<div class="err">File gagal dibaca. Coba lagi.</div>');
    baca.readAsText(f);
  });

  root.appendChild(T.el('<p class="note">Unggah file JSON ekspor Timeline dari Google Takeout untuk melihat ringkasan perjalananmu. ' + T.esc(LOCAL_NOTE) + '</p>'));
  root.appendChild(T.el('<p class="hint">Cara dapat filenya: buka Google Takeout, pilih hanya "Location History" atau "Timeline", ekspor, lalu unggah file JSON-nya di sini. File besar (ratusan ribu titik) tetap bisa diproses, tapi butuh beberapa detik.</p>'));
  root.appendChild(T.field('File Timeline (.json)', fi));
  root.appendChild(box);
  root.appendChild(contohBox);
  T.show(box, '<p class="mut" style="font-size:13px">Belum ada file yang diunggah. Unggah file JSON Timeline Google Maps untuk melihat ringkasan perjalananmu.</p>');
}
