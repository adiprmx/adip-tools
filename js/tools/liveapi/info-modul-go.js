import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"info-modul-go","name":"Info Modul Go","cat":"liveapi","icon":"🐹","desc":"Cari versi terbaru modul Go beserta tanggal rilisnya.","keywords":"go,golang,modul,proxy,versi,paket","since":"6.18.0", "online": true};

// Info modul Go terbaru lewat Go Module Proxy, tanpa key.
// Terverifikasi 18 Nov 2026:
// proxy.golang.org/github.com/gin-gonic/gin/@latest -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
const API = 'https://proxy.golang.org/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404 || r.status === 410) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Jalur modul Go yang sah: github.com/pemilik/repo, golang.org/x/text, dsb.
export function validasiModul(m) {
  const s = String(m || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9.-]*(\.[a-z]{2,})?\/[a-z0-9._~/-]+$/.test(s)) return null;
  if (s.includes('..') || s.includes('//') || s.endsWith('/')) return null;
  return s;
}

export function urlModul(modul) {
  return API + modul + '/@latest';
}

export function ringkasModul(j, modul) {
  if (!j || typeof j !== 'object' || typeof j.Version !== 'string') return null;
  const asal = j.Origin && typeof j.Origin === 'object' ? j.Origin : {};
  const tautan = (u) => (typeof u === 'string' && u.indexOf('https://') === 0 ? u : '');
  return {
    modul,
    versi: j.Version,
    waktu: typeof j.Time === 'string' ? j.Time : '',
    repo: tautan(asal.URL),
  };
}

const fmtWaktu = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: github.com/gin-gonic/gin');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const modul = validasiModul(inp.value);
    if (!modul) {
      T.show(box, errBox('Tulis jalur modul yang benar, contoh: github.com/gin-gonic/gin.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari versi terbaru ' + esc(modul) + '…</p>');
    try {
      const hasil = ringkasModul(await getJSON(urlModul(modul)), modul);
      if (!hasil) throw new Error('bad-data');
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:17px;word-break:break-all">' + esc(hasil.modul) + '</div>' +
        '<div style="font-weight:700;font-size:20px;margin-top:6px">' + esc(hasil.versi) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:4px">Versi terbaru, dirilis ' + esc(fmtWaktu(hasil.waktu)) + '</div></div>' +
        (hasil.repo ? '<div style="margin-top:10px" class="center"><a class="btn" href="' + esc(hasil.repo) + '" target="_blank" rel="noopener">Kode sumber</a></div>' : '') +
        '<p class="hint">Sumber: Go Module Proxy (proxy.golang.org). Versi yang tampil adalah rilis terbaru yang tercatat di proxy.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Modul tidak ditemukan di proxy Go. Periksa jalur modulnya.</p>');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server proxy Go tidak bisa dihubungi dalam 10 detik.'
        : 'Gagal mencari modul. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari versi terbaru sebuah modul Go, lengkap dengan tanggal rilisnya.</p>'));
  root.appendChild(T.field('Jalur modul', inp, 'Contoh: github.com/gin-gonic/gin'));
  root.appendChild(T.row(T.btn('🔍 Cari modul', cari, true)));
  root.appendChild(box);
}
