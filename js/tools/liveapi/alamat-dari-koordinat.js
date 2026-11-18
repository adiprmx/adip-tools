import { h as T, esc, errBox } from '../../core.js';

// Koordinat GPS jadi alamat lewat BigDataCloud (tanpa key).
// Terverifikasi 18 Nov 2026: /data/reverse-geocode-client 200, CORS *.
const API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const meta = {"id": "alamat-dari-koordinat", "name": "Alamat dari Koordinat", "cat": "liveapi", "icon": "📍", "desc": "Ubah angka lintang dan bujur jadi nama tempat dan alamat yang bisa dibaca.", "keywords": "koordinat,lintang,bujur,latitude,longitude,alamat,reverse geocoding,gps,lokasi", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const latI = T.input('number', 'Contoh: -6.2', '-6.2');
  const lonI = T.input('number', 'Contoh: 106.8', '106.8');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const lat = parseFloat(String(latI.value).replace(',', '.'));
    const lon = parseFloat(String(lonI.value).replace(',', '.'));
    if (!isFinite(lat) || lat < -90 || lat > 90 || !isFinite(lon) || lon < -180 || lon > 180) {
      T.show(box, errBox('Isi lintang antara -90 sampai 90 dan bujur antara -180 sampai 180. Contoh Jakarta: -6.2 dan 106.8.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari alamat untuk koordinat itu…</p>');
    try {
      const j = await getJSON(API + '?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=id');
      if (!j || typeof j !== 'object') throw new Error('bad-data');
      const baris = [
        ['Tempat', j.locality || j.city || ''],
        ['Kota/Kabupaten', j.city || ''],
        ['Provinsi', j.principalSubdivision || ''],
        ['Negara', j.countryName || ''],
        ['Kode pos', j.postcode || ''],
        ['Benua', j.continent || ''],
      ].filter((b) => b[1]);
      if (!baris.length) {
        T.show(box, '<p class="center dim">Tidak ada alamat yang dikenal di koordinat itu. Mungkin titiknya jatuh di laut atau daerah tanpa nama tempat.</p>');
        return;
      }
      T.show(box, baris.map((b) => '<div class="kv"><span class="k">' + esc(b[0]) + '</span><span class="v">' + esc(String(b[1])) + '</span></div>').join('') +
        (j.plusCode ? '<p class="hint">Kode Plus: ' + esc(String(j.plusCode)) + '</p>' : '') +
        '<p class="hint">Sumber: BigDataCloud. Koordinat yang kamu isi dikirim ke layanan itu untuk dicari alamatnya.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server alamat tidak merespons dalam 15 detik.'
        : 'Alamat gagal dicari. Cek koneksi internet, lalu coba lagi.');
    }
  };

  const pakaiLokasi = () => {
    if (!navigator.geolocation) {
      T.show(box, errBox('Peramban ini tidak mendukung pengambilan lokasi. Isi koordinat secara manual.'));
      return;
    }
    T.show(box, '<p class="mut">Meminta izin lokasi dari peramban…</p>');
    navigator.geolocation.getCurrentPosition((pos) => {
      latI.value = String(pos.coords.latitude.toFixed(6));
      lonI.value = String(pos.coords.longitude.toFixed(6));
      cari();
    }, () => {
      T.show(box, errBox('Lokasi tidak bisa diambil. Izin lokasi mungkin ditolak, atau perangkat tidak menemukan posisimu. Isi koordinat secara manual.'));
    }, { timeout: 15000 });
  };

  latI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  lonI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Punya angka koordinat dari peta atau foto? Tulis di sini untuk tahu nama tempatnya. Lintang itu angka utara-selatan, bujur itu angka barat-timur.</p>'));
  root.appendChild(T.field('Lintang (latitude)', latI, 'Angka antara -90 sampai 90'));
  root.appendChild(T.field('Bujur (longitude)', lonI, 'Angka antara -180 sampai 180'));
  root.appendChild(T.row(T.btn('Cari alamat', cari, true), T.btn('Pakai lokasiku', pakaiLokasi)));
  root.appendChild(box);
}
