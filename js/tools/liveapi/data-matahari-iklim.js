import { h as T, esc, errBox } from '../../core.js';

// Data suhu dan sinar matahari harian NASA POWER untuk lokasi mana pun.
// Terverifikasi 19 Nov 2026: /api/temporal/daily/point?parameters=T2M...
// -> 200, CORS *. Respons: properties.parameter.{T2M,T2M_MAX,T2M_MIN,
// ALLSKY_SFC_SW_DWN,PRECTOTCORR} berisi peta tanggal YYYYMMDD -> angka.
// Nilai -999 berarti data kosong di hari itu. Data NASA biasanya tertinggal
// beberapa hari, jadi tanggal akhir bawaan dipasang 8 hari ke belakang.
export const meta = {"id":"data-matahari-iklim","name":"Data Matahari & Iklim","cat":"liveapi","icon":"☀️","desc":"Lihat suhu, sinar matahari, dan hujan harian di sebuah lokasi dari data NASA.","keywords":"matahari,iklim,suhu,nasa,radiasi,hujan,cuaca,iklim","since":"6.19.0"};

const API = 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,PRECTOTCORR&community=RE&format=JSON';

function isoKeApi(s) { return s.replace(/-/g, ''); }
function geserHari(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + t;
}
function tglCantik(yyyymmdd) {
  const y = yyyymmdd.slice(0, 4), m = yyyymmdd.slice(4, 6), d = yyyymmdd.slice(6, 8);
  const nama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return d + ' ' + (nama[parseInt(m, 10) - 1] || m) + ' ' + y;
}
const angka = (v) => (typeof v === 'number' && v !== -999 ? v : null);
const fmt1 = (v) => (v == null ? '-' : String(Math.round(v * 10) / 10).replace('.', ','));

export function render(root) {
  const box = T.out();
  const lat = T.input('text', 'Contoh: -6,2', '-6,2');
  const lon = T.input('text', 'Contoh: 106,8', '106,8');
  const mulai = T.input('date', '', geserHari(-14));
  const akhir = T.input('date', '', geserHari(-8));
  lat.setAttribute('inputmode', 'decimal');
  lon.setAttribute('inputmode', 'decimal');

  const lihat = async () => {
    const la = parseFloat(lat.value.replace(',', '.'));
    const lo = parseFloat(lon.value.replace(',', '.'));
    const s = mulai.value, e = akhir.value;
    if (Number.isNaN(la) || Number.isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      T.show(box, errBox('Koordinat tidak valid. Lintang antara -90 sampai 90, bujur antara -180 sampai 180.'));
      return;
    }
    if (!s || !e || s > e) {
      T.show(box, errBox('Tanggal mulai harus diisi dan tidak boleh lewat tanggal akhir.'));
      return;
    }
    const rentang = (new Date(e) - new Date(s)) / 86400000;
    if (rentang > 31) {
      T.show(box, errBox('Rentang tanggal maksimal 31 hari. Persempit dulu tanggalnya.'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil data NASA…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 25000);
    try {
      const url = API + '&longitude=' + lo + '&latitude=' + la + '&start=' + isoKeApi(s) + '&end=' + isoKeApi(e);
      const r = await fetch(url, { signal: c.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const p = j && j.properties && j.properties.parameter;
      if (!p || !p.T2M) throw new Error('bad-data');
      const tanggal = Object.keys(p.T2M).sort();
      if (!tanggal.length) throw new Error('bad-data');
      let suhuTotal = 0, suhuN = 0, sinarTotal = 0, sinarN = 0, hujanTotal = 0, hujanN = 0;
      let rows = '';
      tanggal.forEach((tg) => {
        const su = angka(p.T2M[tg]), mx = angka(p.T2M_MAX && p.T2M_MAX[tg]), mn = angka(p.T2M_MIN && p.T2M_MIN[tg]);
        const sn = angka(p.ALLSKY_SFC_SW_DWN && p.ALLSKY_SFC_SW_DWN[tg]);
        const hj = angka(p.PRECTOTCORR && p.PRECTOTCORR[tg]);
        if (su != null) { suhuTotal += su; suhuN++; }
        if (sn != null) { sinarTotal += sn; sinarN++; }
        if (hj != null) { hujanTotal += hj; hujanN++; }
        rows += '<tr><td>' + esc(tglCantik(tg)) + '</td><td style="text-align:right">' + fmt1(su) + '°</td>' +
          '<td style="text-align:right">' + fmt1(mx) + '°</td><td style="text-align:right">' + fmt1(mn) + '°</td>' +
          '<td style="text-align:right">' + fmt1(sn) + '</td><td style="text-align:right">' + fmt1(hj) + '</td></tr>';
      });
      const rataSuhu = suhuN ? fmt1(suhuTotal / suhuN) + '°C' : '-';
      const rataSinar = sinarN ? fmt1(sinarTotal / sinarN) + ' MJ/m² per hari' : '-';
      const totalHujan = hujanN ? fmt1(hujanTotal) + ' mm' : '-';
      T.show(box,
        '<div class="kv"><span class="k">Suhu rata-rata</span><span class="v">' + rataSuhu + '</span></div>' +
        '<div class="kv"><span class="k">Sinar matahari rata-rata</span><span class="v">' + rataSinar + '</span></div>' +
        '<div class="kv"><span class="k">Total hujan</span><span class="v">' + totalHujan + '</span></div>' +
        '<div style="overflow-x:auto;margin-top:10px"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr><th style="text-align:left">Tanggal</th><th style="text-align:right">Suhu</th><th style="text-align:right">Maks</th><th style="text-align:right">Min</th><th style="text-align:right">Sinar</th><th style="text-align:right">Hujan</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<p class="hint">Sumber: NASA POWER. Suhu dalam Celsius, sinar matahari dalam MJ/m² per hari, hujan dalam mm. Tanda - berarti data hari itu kosong di NASA.</p>');
    } catch (e2) {
      const msg = e2.name === 'AbortError'
        ? 'Waktu habis, server NASA tidak merespons dalam 25 detik.'
        : 'Gagal mengambil data. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', lihat));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  root.appendChild(T.el('<p class="note">Tulis koordinat dan rentang tanggal, lalu ketuk Lihat data. Hasilnya suhu, sinar matahari, dan hujan per hari dari data satelit NASA.</p>'));
  root.appendChild(T.grid2(T.field('Lintang', lat), T.field('Bujur', lon)));
  root.appendChild(T.grid2(T.field('Dari tanggal', mulai), T.field('Sampai tanggal', akhir)));
  root.appendChild(T.row(T.btn('☀️ Lihat data', lihat, true)));
  root.appendChild(box);
  T.show(box, '<p class="center dim">Belum ada data. Koordinat Jakarta dan 7 hari terakhir sudah terisi, ketuk tombol di atas untuk mulai.</p>');
}
