import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id": "kualitas-udara", "name": "Kualitas Udara", "cat": "liveapi", "icon": "🌫️", "desc": "Indeks kualitas udara (AQI), PM2.5 & PM10 kota pilihan.", "keywords": "kualitas,udara,aqi,polusi,pm2.5,pm10,polutan,sehat,indeks"};

function aqiKat(v) {
  if (v == null || isNaN(v)) return { label: 'Tidak tersedia', color: '#9ca3af', bg: '#9ca3af22' };
  if (v <= 50) return { label: 'Baik', color: '#22c55e', bg: '#22c55e1f' };
  if (v <= 100) return { label: 'Sedang', color: '#eab308', bg: '#eab3081f' };
  if (v <= 150) return { label: 'Tidak sehat bagi kelompok sensitif', color: '#f97316', bg: '#f973161f' };
  if (v <= 200) return { label: 'Tidak sehat', color: '#ef4444', bg: '#ef44441f' };
  if (v <= 300) return { label: 'Sangat tidak sehat', color: '#a855f7', bg: '#a855f71f' };
  return { label: 'Berbahaya', color: '#fca5a5', bg: '#991b1b40' };
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(res.status === 429 ? 'Batas permintaan API terlampaui.' : 'HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Waktu habis (15 detik). Periksa koneksi internet lalu coba lagi.');
    throw e;
  } finally { clearTimeout(timer); }
}

export function render(root) {
  const kota = T.input('text', 'Nama kota', 'Jakarta');
  const pilihWrap = T.out();
  const box = T.out();
  let reqId = 0;

  const namaLokasi = (loc) => loc.name + (loc.admin1 ? ', ' + loc.admin1 : '') + (loc.country ? ' (' + loc.country + ')' : '');

  const errDenganTombolUlang = (boxEl, pesan, detail, ulang) => {
    T.show(boxEl, '<span class="err">' + esc(pesan) + '</span><br><span class="dim">(' + esc(detail) + ')</span>');
    const wr = T.el('<div class="mt8"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    boxEl.appendChild(wr);
  };

  const muatAqi = async (loc) => {
    const id = ++reqId;
    T.show(box, '<div class="dim center">Memuat kualitas udara ' + esc(loc.name) + '…</div>');
    try {
      const d = await fetchJson('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + loc.latitude +
        '&longitude=' + loc.longitude + '&current=us_aqi,pm2_5,pm10&timezone=auto');
      if (id !== reqId) return;
      const c = d.current || {};
      const k = aqiKat(c.us_aqi);
      const waktu = c.time ? String(c.time).replace('T', ' ') : '';
      T.show(box,
        '<div class="center"><div class="dim">' + esc(namaLokasi(loc)) + '</div>' +
        '<div class="big">' + (c.us_aqi == null ? '–' : esc(String(Math.round(c.us_aqi)))) + '</div>' +
        '<div class="info" style="margin:4px 0"><span style="display:inline-block;padding:4px 12px;border-radius:999px;font-weight:700;font-size:13px;color:' +
        k.color + ';background:' + k.bg + ';border:1px solid ' + k.color + '55">' + esc(k.label) + '</span></div>' +
        '<div class="hint">Indeks AQI (standar US EPA)</div>' +
        (waktu ? '<div class="dim" style="font-size:12px;margin-top:2px">Data jam ' + esc(waktu) + ' (' + esc(d.timezone_abbreviation || d.timezone || '') + ')</div>' : '') +
        '</div>' +
        '<div class="kv"><span class="k">PM2.5</span><span class="v">' + (c.pm2_5 == null ? '–' : esc(String(c.pm2_5)) + ' µg/m³') + '</span></div>' +
        '<div class="kv"><span class="k">PM10</span><span class="v">' + (c.pm10 == null ? '–' : esc(String(c.pm10)) + ' µg/m³') + '</span></div>');
    } catch (e) {
      if (id !== reqId) return;
      errDenganTombolUlang(box, 'Gagal memuat kualitas udara. Periksa koneksi internet atau coba kota lain.', e.message || String(e), () => muatAqi(loc));
    }
  };

  const cariKota = async (otomatis) => {
    const q = kota.value.trim();
    if (!q) { T.show(pilihWrap, '<span class="err">Isi nama kota dulu.</span>'); return; }
    const id = ++reqId;
    T.show(pilihWrap, '<div class="dim">Mencari kota…</div>');
    T.show(box, '');
    try {
      const gd = await fetchJson('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=id&format=json');
      if (id !== reqId) return;
      if (!gd.results || !gd.results.length) throw new Error('Kota "' + q + '" tidak ditemukan.');
      const pairs = gd.results.map((r) => [String(r.id), namaLokasi(r)]);
      const sel = T.select(pairs, String(gd.results[0].id));
      const byId = {};
      gd.results.forEach((r) => { byId[String(r.id)] = r; });
      sel.addEventListener('change', () => { const l = byId[sel.value]; if (l) muatAqi(l); });
      T.show(pilihWrap, '');
      pilihWrap.appendChild(T.field('Pilih lokasi (' + gd.results.length + ' hasil)', sel));
      if (otomatis) muatAqi(gd.results[0]);
    } catch (e) {
      if (id !== reqId) return;
      T.show(pilihWrap, '');
      errDenganTombolUlang(box, 'Gagal mencari kota. Periksa koneksi internet lalu coba lagi.', e.message || String(e), () => cariKota(false));
    }
  };

  kota.addEventListener('keydown', (e) => { if (e.key === 'Enter') cariKota(false); });
  root.appendChild(T.el('<div class="dim" style="margin-bottom:6px"><b>🌫️ Kualitas udara kota</b></div>'));
  root.appendChild(T.field('Kota', kota));
  root.appendChild(T.row(T.btn('🔍 Cek kualitas udara', () => cariKota(false), true)));
  root.appendChild(pilihWrap);
  root.appendChild(box);
  cariKota(true);
}
