import { h as T, utils, esc } from '../../core.js?v=6.1.0';

utils.weatherId = function (code) {
    const m = {
      0: 'Cerah', 1: 'Cerah berawan tipis', 2: 'Berawan sebagian', 3: 'Mendung',
      45: 'Berkabut', 48: 'Berkabut tebal',
      51: 'Gerimis ringan', 53: 'Gerimis', 55: 'Gerimis lebat',
      56: 'Gerimis beku', 57: 'Gerimis beku',
      61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat',
      66: 'Hujan es ringan', 67: 'Hujan es lebat',
      71: 'Salju ringan', 73: 'Salju', 75: 'Salju lebat', 77: 'Butiran salju',
      80: 'Hujan rintik', 81: 'Hujan sedang', 82: 'Hujan sangat lebat',
      85: 'Hujan salju ringan', 86: 'Hujan salju lebat',
      95: 'Badai petir', 96: 'Badai petir + hujan es', 99: 'Badai petir + hujan es',
    };
    return m[Number(code)] || 'Tidak diketahui';
  };

export const meta = {"id": "kurs-cuaca", "name": "Kurs & Cuaca", "cat": "liveapi", "icon": "💱", "desc": "Kurs mata uang live & cuaca kota.", "keywords": "kurs,dollar,uang,cuaca,rupiah"};
export function render(root) {

    const CURS = [['IDR', 'IDR - Rupiah'], ['USD', 'USD - Dolar AS'], ['EUR', 'EUR - Euro'], ['SGD', 'SGD - Dolar Singapura'], ['MYR', 'MYR - Ringgit'], ['JPY', 'JPY - Yen'], ['GBP', 'GBP - Pound'], ['AUD', 'AUD - Dolar Australia'], ['THB', 'THB - Baht'], ['CNY', 'CNY - Yuan'], ['KRW', 'KRW - Won'], ['SAR', 'SAR - Riyal'], ['PHP', 'PHP - Peso'], ['VND', 'VND - Dong'], ['INR', 'INR - Rupee'], ['HKD', 'HKD - Dolar HK']];
    const jml = T.input('number', 'Jumlah', '100000');
    const dari = T.select(CURS, 'IDR');
    const ke = T.select(CURS, 'USD');
    const kursBox = T.out();
    let rates = null, updateTime = '';
    const konversi = () => {
      if (!rates) return;
      const v = T.num(jml.value);
      if (isNaN(v)) { T.show(kursBox, '<span class="err">Isi jumlah dengan angka yang valid.</span>'); return; }
      const rf = rates[dari.value], rt = rates[ke.value];
      if (!rf || !rt) { T.show(kursBox, '<span class="err">Mata uang tidak tersedia di data kurs.</span>'); return; }
      const hasil = v * (rt / rf);
      T.show(kursBox,
        '<div class="center"><div class="dim">' + esc(jml.value) + ' ' + esc(dari.value) + ' =</div>' +
        '<div class="big">' + T.fmt(Math.round(hasil * 100) / 100) + ' ' + esc(ke.value) + '</div>' +
        '<div class="hint">1 ' + esc(dari.value) + ' = ' + (rt / rf).toFixed(6).replace(/0+$/, '').replace(/\.$/, '') + ' ' + esc(ke.value) + '</div>' +
        (updateTime ? '<div class="dim" style="font-size:12px">Update: ' + esc(updateTime) + '</div>' : '') + '</div>');
    };
    const muatKurs = async () => {
      T.show(kursBox, '<div class="dim center">Memuat kurs terbaru…</div>');
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/IDR');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.result !== 'success' || !data.rates) throw new Error('data tidak valid');
        rates = data.rates;
        try { updateTime = new Date(data.time_last_update_utc).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { updateTime = ''; }
        konversi();
      } catch (e) {
        T.show(kursBox, '<span class="err">Gagal memuat kurs. Periksa koneksi internet lalu coba lagi.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
        const wrap = T.el('<div style="margin-top:8px"></div>');
        wrap.appendChild(T.btn('🔄 Coba lagi', muatKurs));
        kursBox.appendChild(wrap);
      }
    };
    const kota = T.input('text', 'Nama kota', 'Jakarta');
    const cuacaBox = T.out();
    const cariCuaca = async () => {
      const q = kota.value.trim();
      if (!q) { T.show(cuacaBox, '<span class="err">Isi nama kota dulu.</span>'); return; }
      T.show(cuacaBox, '<div class="dim center">Mencari cuaca ' + esc(q) + '…</div>');
      try {
        const g = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=1&language=id');
        if (!g.ok) throw new Error('HTTP ' + g.status);
        const gd = await g.json();
        if (!gd.results || !gd.results.length) throw new Error('Kota "' + q + '" tidak ditemukan.');
        const loc = gd.results[0];
        const f = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m');
        if (!f.ok) throw new Error('HTTP ' + f.status);
        const fd = await f.json();
        const c = fd.current;
        const namaKota = loc.name + (loc.admin1 ? ', ' + loc.admin1 : '') + (loc.country ? ' (' + loc.country + ')' : '');
        T.show(cuacaBox,
          '<div class="center"><div class="dim">' + esc(namaKota) + '</div>' +
          '<div class="big">' + Math.round(c.temperature_2m) + '°C</div>' +
          '<div class="info"><b>' + esc(utils.weatherId(c.weather_code)) + '</b></div></div>' +
          '<div class="kv"><span class="k">Kelembapan</span><span class="v">' + c.relative_humidity_2m + '%</span></div>' +
          '<div class="kv"><span class="k">Angin</span><span class="v">' + c.wind_speed_10m + ' km/jam</span></div>');
      } catch (e) {
        T.show(cuacaBox, '<span class="err">Gagal memuat cuaca. Periksa koneksi internet atau coba kota lain.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
        const wr = T.el('<div class="mt8"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', cariCuaca));
        cuacaBox.appendChild(wr);
      }
    };
    [jml, dari, ke].forEach((elx) => elx.addEventListener('input', konversi));
    dari.addEventListener('change', konversi);
    ke.addEventListener('change', konversi);
    root.appendChild(T.el('<div class="dim" style="margin-bottom:6px"><b>💱 Kurs mata uang</b></div>'));
    root.appendChild(T.field('Jumlah', jml));
    root.appendChild(T.grid2(T.field('Dari', dari), T.field('Ke', ke)));
    root.appendChild(kursBox);
    root.appendChild(T.el('<div class="dim" style="margin:16px 0 6px"><b>🌤️ Cuaca kota</b></div>'));
    root.appendChild(T.grid2(T.field('Kota', kota)));
    root.appendChild(T.row(T.btn('🔍 Cek cuaca', cariCuaca, true)));
    root.appendChild(cuacaBox);
    muatKurs();
  
}
