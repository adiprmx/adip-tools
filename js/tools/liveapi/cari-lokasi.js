import { h as T, esc, errBox, tabs } from '../../core.js';

// Cari Lokasi & Koordinat: dua arah.
// - Nama tempat -> koordinat lewat Nominatim OpenStreetMap.
// - Koordinat -> alamat lewat BigDataCloud (tanpa key, bahasa Indonesia).
//   Terverifikasi 18 Nov 2026: /data/reverse-geocode-client 200, CORS *.
// Hasil gabung v6.21.0 (B10): mode balik diserap dari Alamat dari Koordinat.
export const meta = {"id":"cari-lokasi","name":"Cari Lokasi & Koordinat","cat":"liveapi","icon":"📍","desc":"Cari tempat apa pun dan dapatkan koordinatnya, atau balik: tulis koordinat untuk tahu nama tempat dan alamatnya.","keywords":"lokasi,koordinat,latitude,longitude,tempat,peta,alamat,osm,lintang,bujur,reverse geocoding,gps,alamat dari koordinat","since":"6.16.0", "online": true};

const API = 'https://nominatim.openstreetmap.org/search';
const API_BALIK = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

// Validasi koordinat. Murni, bisa diuji di Node.
export function validasiKoordinat(lat, lon) {
  // Kosong harus ditolak: Number('') adalah 0 (titik 0,0 di tengah laut),
  // bukan "tidak diisi".
  if (String(lat).trim() === '' || String(lon).trim() === '') return false;
  const la = Number(lat), lo = Number(lon);
  return Number.isFinite(la) && la >= -90 && la <= 90 && Number.isFinite(lo) && lo >= -180 && lo <= 180;
}

// Tautan peta OpenStreetMap untuk satu titik. Murni, bisa diuji di Node.
export function urlPetaOsm(lat, lon, zoom) {
  const z = zoom || 15;
  return 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=' + z + '/' + lat + '/' + lon;
}

// Baris alamat dari jawaban BigDataCloud. Murni, bisa diuji di Node.
export function barisAlamat(j) {
  if (!j || typeof j !== 'object') return [];
  return [
    ['Tempat', j.locality || j.city || ''],
    ['Kota/Kabupaten', j.city || ''],
    ['Provinsi', j.principalSubdivision || ''],
    ['Negara', j.countryName || ''],
    ['Kode pos', j.postcode || ''],
    ['Benua', j.continent || ''],
  ].filter((b) => b[1]);
}

async function getJSONBalik(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function render(root) {
  // --- Tab 1: Cari tempat (nama -> koordinat) ---
  const cariPage = T.el('<div></div>');
  const box = T.out();
  const inp = T.input('text', 'Contoh: Monas Jakarta, Pantai Kuta, Stasiun Bandung');
  inp.setAttribute('autocomplete', 'off');
  let terakhir = 0;

  const cari = async () => {
    const q = inp.value.trim();
    if (!q) { T.show(box, errBox('Tulis nama tempat dulu.')); return; }
    const jeda = Date.now() - terakhir;
    if (jeda < 1000) {
      T.show(box, '<p class="dim center">Tunggu sebentar, pencarian dibatasi satu kali per detik.</p>');
      return;
    }
    terakhir = Date.now();
    T.show(box, '<p class="mut">Mencari "' + esc(q) + '"…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API + '?q=' + encodeURIComponent(q) + '&format=json&limit=8&addressdetails=1', { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada tempat yang cocok dengan "' + esc(q) + '".</p><p class="hint center">Coba nama yang lebih umum, contoh: nama kota atau nama jalan saja.</p>');
        return;
      }
      let html = '<p class="hint">Ketuk koordinat untuk menyalinnya.</p>';
      j.forEach((it) => {
        const lat = it.lat, lon = it.lon;
        const nama = it.display_name || '-';
        const jenis = it.type ? String(it.type).replace(/_/g, ' ') : '';
        html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
          '<div style="font-weight:700;line-height:1.4">' + esc(nama) + '</div>' +
          (jenis ? '<div class="dim" style="font-size:12px;margin-top:2px">Jenis: ' + esc(jenis) + '</div>' : '') +
          '<div style="font-family:monospace;font-size:13px;margin-top:6px"><button type="button" class="btn" data-koor="' + esc(lat + ', ' + lon) + '" style="font-family:monospace">📋 ' + esc(lat + ', ' + lon) + '</button> ' +
          '<a class="btn" href="' + esc(urlPetaOsm(lat, lon, 16)) + '" target="_blank" rel="noopener">Lihat di peta</a></div></div>';
      });
      html += '<p class="hint">Data © kontributor OpenStreetMap, lisensi ODbL.</p>';
      T.show(box, html);
      box.querySelectorAll('[data-koor]').forEach((b) => {
        b.addEventListener('click', () => T.copy(b.getAttribute('data-koor')));
      });
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server peta tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari tempat. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  cariPage.appendChild(T.field('Nama tempat', inp, 'Nama jalan, gedung, kota, atau tempat wisata.'));
  cariPage.appendChild(T.row(T.btn('🔍 Cari tempat', cari, true)));
  cariPage.appendChild(box);

  // --- Tab 2: Alamat dari koordinat (koordinat -> alamat) ---
  const balikPage = T.el('<div hidden></div>');
  const boxBalik = T.out();
  const latI = T.input('number', 'Contoh: -6.2', '-6.2');
  const lonI = T.input('number', 'Contoh: 106.8', '106.8');

  const gagalBalik = (pesan) => {
    T.show(boxBalik, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cariBalik));
    boxBalik.appendChild(w);
  };

  const cariBalik = async () => {
    const lat = parseFloat(String(latI.value).replace(',', '.'));
    const lon = parseFloat(String(lonI.value).replace(',', '.'));
    if (!validasiKoordinat(lat, lon)) {
      T.show(boxBalik, errBox('Isi lintang antara -90 sampai 90 dan bujur antara -180 sampai 180. Contoh Jakarta: -6.2 dan 106.8.'));
      return;
    }
    T.show(boxBalik, '<p class="mut">Mencari alamat untuk koordinat itu…</p>');
    try {
      const j = await getJSONBalik(API_BALIK + '?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=id');
      if (!j || typeof j !== 'object') throw new Error('bad-data');
      const baris = barisAlamat(j);
      if (!baris.length) {
        T.show(boxBalik, '<p class="center dim">Tidak ada alamat yang dikenal di koordinat itu. Mungkin titiknya jatuh di laut atau daerah tanpa nama tempat.</p>' +
          '<p style="font-size:13px"><a href="' + esc(urlPetaOsm(lat, lon)) + '" target="_blank" rel="noopener">Lihat titik ini di peta</a></p>');
        return;
      }
      T.show(boxBalik, baris.map((b) => '<div class="kv"><span class="k">' + esc(b[0]) + '</span><span class="v">' + esc(String(b[1])) + '</span></div>').join('') +
        (j.plusCode ? '<p class="hint">Kode Plus: ' + esc(String(j.plusCode)) + '</p>' : '') +
        '<p style="font-size:13px"><a href="' + esc(urlPetaOsm(lat, lon)) + '" target="_blank" rel="noopener">Lihat titik ini di peta</a></p>' +
        '<p class="hint">Sumber: BigDataCloud. Koordinat yang kamu isi dikirim ke layanan itu untuk dicari alamatnya.</p>');
    } catch (e) {
      gagalBalik(e.name === 'AbortError'
        ? 'Waktu habis, server alamat tidak bisa dihubungi dalam 15 detik.'
        : 'Alamat gagal dicari. Cek koneksi internet, lalu coba lagi.');
    }
  };

  const pakaiLokasi = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      T.show(boxBalik, errBox('Peramban ini tidak mendukung pengambilan lokasi. Isi koordinat secara manual.'));
      return;
    }
    T.show(boxBalik, '<p class="mut">Meminta izin lokasi dari peramban…</p>');
    navigator.geolocation.getCurrentPosition((pos) => {
      latI.value = String(pos.coords.latitude.toFixed(6));
      lonI.value = String(pos.coords.longitude.toFixed(6));
      cariBalik();
    }, () => {
      T.show(boxBalik, errBox('Lokasi tidak bisa diambil. Izin lokasi mungkin ditolak, atau perangkat tidak menemukan posisimu. Isi koordinat secara manual.'));
    }, { timeout: 15000 });
  };

  latI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cariBalik(); });
  lonI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cariBalik(); });
  balikPage.appendChild(T.el('<p class="note">Punya angka koordinat dari peta atau foto? Tulis di sini untuk tahu nama tempatnya. Lintang itu angka utara-selatan, bujur itu angka barat-timur.</p>'));
  balikPage.appendChild(T.field('Lintang (latitude)', latI, 'Angka antara -90 sampai 90'));
  balikPage.appendChild(T.field('Bujur (longitude)', lonI, 'Angka antara -180 sampai 180'));
  balikPage.appendChild(T.row(T.btn('Cari alamat', cariBalik, true), T.btn('Pakai lokasiku', pakaiLokasi)));
  balikPage.appendChild(boxBalik);

  root.appendChild(T.el('<p class="note">Cari tempat dari namanya, atau sebaliknya: tulis angka koordinat untuk tahu alamatnya.</p>'));
  root.appendChild(tabs([['Cari tempat', 0], ['Alamat dari koordinat', 1]], [cariPage, balikPage]));
  root.appendChild(cariPage);
  root.appendChild(balikPage);
}
