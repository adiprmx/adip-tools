import { h as T, esc } from '../../core.js?v=6.12.0';

export const meta = {"id":"data-indonesia","name":"Data Indonesia","cat":"liveapi","icon":"🇮🇩","desc":"Angka resmi Indonesia: penduduk, ekonomi, harapan hidup & lainnya dari Bank Dunia.","keywords":"indonesia,data,penduduk,pdb,ekonomi,harapan hidup,pengangguran,inflasi,bank dunia","since":"6.12.0"};

const API = 'https://api.worldbank.org/v2/country/IDN/indicator/';

// [kode indikator, label, format]
const INDIKATOR = [
  ['SP.POP.TOTL', 'Jumlah penduduk', 'orang'],
  ['NY.GDP.PCAP.CD', 'PDB per kapita', 'usd'],
  ['NY.GDP.MKTP.KD.ZG', 'Pertumbuhan ekonomi', 'persen'],
  ['SP.DYN.LE00.IN', 'Harapan hidup', 'tahun'],
  ['SP.URB.TOTL.IN.ZS', 'Penduduk yang tinggal di kota', 'persen'],
  ['SL.UEM.TOTL.ZS', 'Pengangguran', 'persen'],
  ['FP.CPI.TOTL.ZG', 'Inflasi', 'persen']
];

export function render(root) {
  const box = T.out();
  const cache = new Map();

  const formatNilai = (nilai, jenis) => {
    if (nilai == null) return null;
    if (jenis === 'orang') return Math.round(nilai).toLocaleString('id-ID') + ' jiwa';
    if (jenis === 'usd') return 'US$ ' + nilai.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    if (jenis === 'persen') return nilai.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%';
    if (jenis === 'tahun') return nilai.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' tahun';
    return String(nilai);
  };

  const ambilSatu = async (kode) => {
    const url = API + kode + '?format=json&per_page=5';
    if (cache.has(url)) return cache.get(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const j = await res.json();
      const rows = (j && j[1]) || [];
      const terbaru = rows.find((r) => r.value != null) || null;
      const hasil = terbaru ? { nilai: terbaru.value, tahun: terbaru.date } : null;
      cache.set(url, hasil);
      return hasil;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };

  const muat = async () => {
    T.show(box, '<div class="dim center">Mengambil data terbaru dari Bank Dunia…</div>');
    try {
      const hasil = await Promise.allSettled(INDIKATOR.map(([kode]) => ambilSatu(kode)));
      const berhasil = hasil.filter((r) => r.status === 'fulfilled' && r.value);
      if (!berhasil.length) throw new Error('Semua permintaan data gagal.');
      let html = '<div class="center"><div class="dim">Data resmi Indonesia (Bank Dunia)</div></div>';
      hasil.forEach((r, i) => {
        const [, label, jenis] = INDIKATOR[i];
        if (r.status === 'fulfilled' && r.value) {
          html += '<div class="kv"><span class="k">' + esc(label) + ' <span class="dim">(' + esc(r.value.tahun) + ')</span></span>' +
            '<span class="v">' + esc(formatNilai(r.value.nilai, jenis) || '-') + '</span></div>';
        } else {
          html += '<div class="kv"><span class="k">' + esc(label) + '</span><span class="v dim">tidak tersedia</span></div>';
        }
      });
      html += '<div class="hint">Tahun di samping tiap angka adalah tahun data terbaru yang tersedia. Sumber: api.worldbank.org.</div>';
      T.show(box, html);
    } catch (e) {
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else msg = 'Gagal memuat data Indonesia. Periksa koneksi internet lalu coba lagi.';
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
