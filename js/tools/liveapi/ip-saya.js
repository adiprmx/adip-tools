import { h as T, utils, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"ip-saya","name":"IP & Lokasi Saya","cat":"liveapi","icon":"🌐","desc":"Cek alamat IP publik & perkiraan lokasimu.","keywords":"ip,lokasi,saya,alamat,isp,internet"};
export function render(root) {
  const box = T.out();
  const muat = async () => {
    T.show(box, '<div class="dim center">Mendeteksi IP & lokasi…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const d = await res.json();
      if (d.success === false) throw new Error(d.message || 'API tidak dapat memproses permintaan.');
      const rows = [
        ['Kota', d.city || '-'],
        ['Wilayah', d.region || '-'],
        ['Negara', (d.country || '-') + (d.country_code ? ' (' + d.country_code + ')' : '')],
        ['ISP', (d.connection && d.connection.isp) || '-'],
        ['Zona waktu', (d.timezone && (d.timezone.id || d.timezone.abbr)) || '-'],
        ['Koordinat', (d.latitude != null && d.longitude != null) ? d.latitude + ', ' + d.longitude : '-']
      ];
      let html = '<div class="center"><div class="dim">Alamat IP publikmu</div>' +
        '<div class="big">' + esc(d.ip || '-') + '</div></div>';
      rows.forEach((r) => {
        html += '<div class="kv"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
      });
      html += '<div class="hint">Lokasi diperkirakan dari alamat IP, bisa tidak 100% akurat.</div>';
      T.show(box, html);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal memuat data IP. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wrap);
    }
  };
  root.appendChild(T.row(T.btn('🔄 Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
