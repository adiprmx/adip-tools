import { h as T, kv } from '../../core.js?v=6.12.0';

export const meta = {"id": "tes-gps", "name": "Tes GPS", "cat": "sehari", "icon": "📍", "desc": "Cek koordinat lokasi dan akurasinya, lalu buka di peta.", "keywords": "gps,lokasi,koordinat,latitude,longitude,peta", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Tool ini membaca posisi perangkat lewat GPS atau jaringan. Koordinat hanya tampil di browser ini dan tidak dikirim ke mana-mana. Di dalam ruangan, akurasi bisa turun sampai puluhan meter.</p>');
  const stateBox = T.out();
  const linkBox = T.out();

  const cari = () => {
    if (!('geolocation' in navigator)) {
      T.show(stateBox, '<div class="big warn">Browser ini tidak bisa membaca lokasi</div><p class="mut" style="font-size:13px">Fitur lokasi tidak tersedia di browser ini. Coba browser terbaru lewat HTTPS.</p>');
      return;
    }
    T.show(stateBox, '<p class="mut" style="font-size:13px">Mencari posisi… butuh beberapa detik, pastikan GPS aktif.</p>');
    T.hide(linkBox);
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = pos.coords;
      T.show(stateBox,
        kv('Lintang', c.latitude.toFixed(6)) +
        kv('Bujur', c.longitude.toFixed(6)) +
        kv('Akurasi', 'Sekitar ±' + Math.round(c.accuracy) + ' meter') +
        kv('Ketinggian', c.altitude != null ? Math.round(c.altitude) + ' meter' : 'Tidak terbaca') +
        kv('Kecepatan', c.speed != null ? (c.speed * 3.6).toFixed(1) + ' km/jam' : 'Tidak terbaca (diam atau tidak didukung)') +
        '<p class="mut" style="font-size:12px">Semakin kecil angka akurasi, semakin tepat posisinya.</p>');
      const q = c.latitude + ',' + c.longitude;
      T.show(linkBox, '');
      const a1 = T.el('<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" style="display:inline-block;margin:4px 8px 4px 0;font-size:13px;color:#fff">Buka di Google Maps ↗</a>');
      const a2 = T.el('<a href="https://www.openstreetmap.org/?mlat=' + c.latitude + '&mlon=' + c.longitude + '#map=16/' + c.latitude + '/' + c.longitude + '" target="_blank" rel="noopener" style="display:inline-block;margin:4px 0;font-size:13px;color:#fff">Buka di OpenStreetMap ↗</a>');
      linkBox.appendChild(a1);
      linkBox.appendChild(a2);
      refreshBtn.disabled = false;
    }, (err) => {
      let msg = '';
      if (err.code === 1) msg = '<div class="big warn">Izin lokasi ditolak</div><p class="mut" style="font-size:13px">Izinkan akses lokasi di pengaturan browser, lalu coba lagi.</p>';
      else if (err.code === 2) msg = '<div class="big warn">Posisi tidak tersedia</div><p class="mut" style="font-size:13px">GPS tidak menemukan sinyal. Coba di luar ruangan atau dekat jendela.</p>';
      else msg = '<div class="big warn">Pencarian posisi habis waktu</div><p class="mut" style="font-size:13px">Coba lagi. Pastikan GPS aktif dan sinyal cukup.</p>';
      T.show(stateBox, msg);
      refreshBtn.disabled = false;
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const startBtn = T.btn('📍 Cari posisi saya', cari, true);
  const refreshBtn = T.btn('↻ Perbarui posisi', cari);
  refreshBtn.disabled = true;

  root.appendChild(info);
  root.appendChild(T.row(startBtn, refreshBtn));
  root.appendChild(stateBox);
  root.appendChild(linkBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Tautan peta membuka situs pihak ketiga dengan koordinat yang kamu lihat di atas. Diproses di browser.</p>'));
}
