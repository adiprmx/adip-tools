import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"gempa-dirasakan","name":"Gempa Dirasakan","cat":"liveapi","icon":"🌋","desc":"Gempa terbaru yang terasa di Indonesia, langsung dari BMKG.","keywords":"gempa,dirasakan,bmkg,guncangan,lindu,magnitudo,terkini","since":"6.16.0", "online": true};

const API = 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';

function warnaMag(m) {
  const v = parseFloat(m);
  if (isNaN(v)) return '#e8e0d5';
  if (v >= 6) return '#ef4444';
  if (v >= 5) return '#f59e0b';
  return '#e8e0d5';
}

export function render(root) {
  const box = T.out();
  let cacheData = null, cacheAt = 0;

  const tampil = (list) => {
    if (!list.length) {
      T.show(box, '<p class="center dim">Belum ada gempa yang dirasakan dalam daftar terbaru BMKG.</p><p class="hint center">Cek lagi nanti, datanya diperbarui BMKG begitu ada gempa baru.</p>');
      return;
    }
    let html = '<p class="hint">Diurutkan dari yang paling baru. Skala dirasakan memakai angka Romawi, makin besar makin terasa.</p>';
    list.forEach((g) => {
      const mag = String(g.Magnitude || '-');
      html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:12px;margin-bottom:10px">' +
        '<div style="display:flex;gap:12px;align-items:flex-start">' +
        '<div style="min-width:56px;text-align:center"><div style="font-size:22px;font-weight:800;color:' + warnaMag(mag) + '">' + esc(mag) + '</div><div class="dim" style="font-size:11px">Magnitudo</div></div>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;line-height:1.4">' + esc(g.Wilayah || '-') + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc(((g.Tanggal || '') + ' ' + (g.Jam || '')).trim() || '-') + '</div>' +
        '<div style="font-size:13px;margin-top:6px">Terasa: <b>' + esc(g.Dirasakan || '-') + '</b></div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">Kedalaman ' + esc(g.Kedalaman || '-') + ' · ' + esc(((g.Lintang || '') + ', ' + (g.Bujur || '')).replace(/^, |, $/g, '') || '-') + '</div></div>' +
        '</div></div>';
    });
    html += '<p class="hint">Sumber: BMKG, data.bmkg.go.id</p>';
    T.show(box, html);
  };

  const muat = async () => {
    if (cacheData && Date.now() - cacheAt < 5 * 60 * 1000) { tampil(cacheData); return; }
    T.show(box, '<p class="mut">Mengambil daftar gempa terbaru dari BMKG…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const list = j && j.Infogempa && Array.isArray(j.Infogempa.gempa) ? j.Infogempa.gempa : null;
      if (!list) throw new Error('bad-data');
      cacheData = list; cacheAt = Date.now();
      tampil(list);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server BMKG tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal ambil data gempa. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  root.appendChild(T.row(T.btn('🔄 Perbarui daftar', muat, true)));
  root.appendChild(box);
  muat();
}
