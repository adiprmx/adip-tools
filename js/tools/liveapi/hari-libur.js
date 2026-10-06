import { h as T, utils, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"hari-libur","name":"Hari Libur Indonesia","cat":"liveapi","icon":"📅","desc":"Daftar hari libur nasional Indonesia per tahun.","keywords":"hari,libur,nasional,tanggal,merah,indonesia"};
export function render(root) {
  const tahun = T.select([['2025', '2025'], ['2026', '2026'], ['2027', '2027']], '2026');
  const box = T.out();
  const fmtTgl = (iso) => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
  };
  const muat = async () => {
    const th = tahun.value;
    T.show(box, '<div class="dim center">Memuat hari libur ' + esc(th) + '…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch('https://date.nager.at/api/v3/publicholidays/' + th + '/ID', { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('Tahun ' + th + ' di luar jangkauan data libur nasional.');
      const hariIni = new Date();
      hariIni.setHours(0, 0, 0, 0);
      let berikutnya = null;
      let html = '';
      data.forEach((h) => {
        const tgl = new Date(h.date + 'T00:00:00');
        const lewat = tgl < hariIni;
        if (!lewat && !berikutnya) berikutnya = h;
        const sisa = Math.round((tgl - hariIni) / 86400000);
        html += '<div class="kv"' + (lewat ? ' style="opacity:0.45"' : '') + '>' +
          '<span class="k">' + esc(fmtTgl(h.date)) + '</span>' +
          '<span class="v" style="text-align:right"><b>' + esc(h.localName || h.name || '-') + '</b>' +
          (h.name && h.name !== h.localName ? '<br><span class="dim" style="font-size:12px">' + esc(h.name) + '</span>' : '') +
          (!lewat && sisa >= 0 ? '<br><span class="info" style="font-size:12px">' + sisa + ' hari lagi</span>' : '') +
          '</span></div>';
      });
      let head = '';
      if (berikutnya) {
        const tgl = new Date(berikutnya.date + 'T00:00:00');
        const sisa = Math.round((tgl - hariIni) / 86400000);
        head = '<div class="center" style="margin-bottom:10px"><div class="dim">Libur terdekat</div>' +
          '<div class="big">' + sisa + ' hari lagi</div>' +
          '<div class="info"><b>' + esc(berikutnya.localName || berikutnya.name) + '</b> — ' + esc(fmtTgl(berikutnya.date)) + '</div></div>';
      } else {
        head = '<div class="dim center" style="margin-bottom:10px">Semua libur tahun ' + esc(th) + ' sudah lewat.</div>';
      }
      T.show(box, head + html + '<div class="hint">Data hari libur nasional Indonesia.</div>');
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
      else if (status === 404 || /di luar jangkauan/.test(e.message)) msg = 'Tahun ' + th + ' di luar jangkauan data libur nasional. Pilih tahun 2025–2027.';
      else msg = 'Gagal memuat hari libur. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wrap);
    }
  };
  root.appendChild(T.grid2(T.field('Tahun', tahun)));
  root.appendChild(T.row(T.btn('📅 Tampilkan', muat, true)));
  root.appendChild(box);
  tahun.addEventListener('change', muat);
  muat();
}
