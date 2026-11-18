import { h as T, esc, errBox } from '../../core.js';

// Jadwal akhir dukungan software lewat endoflife.date (tanpa key).
// Terverifikasi 18 Nov 2026: /api/python.json 200, CORS *.
const API = 'https://endoflife.date/api/';

const PRODUK = [
  ['python', 'Python'], ['nodejs', 'Node.js'], ['php', 'PHP'], ['go', 'Go'],
  ['rust', 'Rust'], ['ruby', 'Ruby'], ['java', 'Java'], ['dotnet', '.NET'],
  ['django', 'Django'], ['laravel', 'Laravel'], ['angular', 'Angular'],
  ['react', 'React'], ['vue', 'Vue'], ['kubernetes', 'Kubernetes'],
  ['ubuntu', 'Ubuntu'], ['debian', 'Debian'], ['windows', 'Windows'],
  ['android', 'Android'], ['ios', 'iOS'], ['mysql', 'MySQL'],
  ['postgresql', 'PostgreSQL'], ['mongodb', 'MongoDB'], ['redis', 'Redis'],
  ['nginx', 'NGINX'], ['wordpress', 'WordPress'], ['flutter', 'Flutter'],
  ['spring-boot', 'Spring Boot'], ['rails', 'Ruby on Rails'],
  ['linux', 'Linux Kernel'], ['macos', 'macOS'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tglCantik(s) {
  if (!s || typeof s !== 'string') return '';
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d)) return s;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusDukungan(eol) {
  if (eol === false || eol == null) return { teks: 'Belum ada tanggal akhir', sudah: false };
  if (eol === true) return { teks: 'Sudah berakhir', sudah: true };
  if (typeof eol !== 'string') return { teks: 'Tidak ada info', sudah: false };
  const d = new Date(eol + 'T00:00:00');
  if (isNaN(d)) return { teks: 'Tidak ada info', sudah: false };
  return d.getTime() < Date.now()
    ? { teks: 'Sudah berakhir', sudah: true }
    : { teks: 'Masih didukung', sudah: false };
}

export const meta = {"id": "akhir-dukungan-software", "name": "Akhir Dukungan Software", "cat": "liveapi", "icon": "📅", "desc": "Cek sampai kapan sebuah bahasa atau framework masih didukung, per versinya.", "keywords": "endoflife,eol,dukungan,versi,python,nodejs,php,update,akhir dukungan,support", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const pilih = T.select(PRODUK, 'python');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const slug = pilih.value;
    const nama = PRODUK.find((p) => p[0] === slug);
    T.show(box, '<p class="mut">Mengambil jadwal ' + esc(nama ? nama[1] : slug) + '…</p>');
    try {
      const j = await getJSON(API + encodeURIComponent(slug) + '.json');
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      const list = j.slice().sort((a, b) => String(b.releaseDate || '').localeCompare(String(a.releaseDate || ''))).slice(0, 12);
      T.show(box, '<p class="hint">' + list.length + ' versi terbaru ' + esc(nama ? nama[1] : slug) + ', dari yang paling baru dirilis.</p>' +
        list.map((c) => {
          const st = statusDukungan(c.eol);
          return '<div class="kv"><span class="k"><b>Versi ' + esc(String(c.cycle)) + '</b>' +
            (c.lts ? ' <span class="hint">(dukungan panjang)</span>' : '') +
            '<br><span class="hint">Rilis ' + esc(tglCantik(c.releaseDate) || 'tidak ada info') +
            (c.latest ? ' · terbaru ' + esc(String(c.latest)) : '') + '</span></span>' +
            '<span class="v" style="text-align:right">' + esc(st.teks) +
            (typeof c.eol === 'string' ? '<br><span class="hint">' + esc(tglCantik(c.eol)) + '</span>' : '') + '</span></div>';
        }).join('') +
        '<p class="hint">Sumber: endoflife.date. Tanggal bisa berubah kalau pembuat software mengumumkan jadwal baru.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server jadwal tidak merespons dalam 15 detik.'
        : 'Jadwal gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Pilih software, lalu lihat tiap versinya masih didukung sampai kapan. Berguna sebelum memakai versi lama di proyek.</p>'));
  root.appendChild(T.field('Software', pilih, 'Jadwal diambil langsung dari endoflife.date'));
  root.appendChild(T.row(T.btn('Lihat jadwal', muat, true)));
  root.appendChild(box);
}
