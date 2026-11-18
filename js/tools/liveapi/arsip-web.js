import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"arsip-web","name":"Arsip Web (Wayback)","cat":"liveapi","icon":"🕰️","desc":"Lihat versi lama sebuah situs dari arsip Wayback Machine.","keywords":"arsip,wayback,versi lama,situs lama,archive,web archive","since":"6.16.0"};

function normalisasiUrl(s) {
  let u = String(s || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

// Hanya tautan https yang dirender sebagai <a> — skema lain (javascript:,
// data:, ...) dari respons API TIDAK pernah jadi tautan yang bisa diklik
// (RED-01, v6.16.0). Pola yang sama seperti radio-online.js.
const tautanAman = (u) => String(u || '').indexOf('https://') === 0;

function tanggalCantik(ts) {
  if (!ts || ts.length < 8) return '';
  const thn = ts.slice(0, 4), bln = ts.slice(4, 6), tgl = ts.slice(6, 8);
  const d = new Date(+thn, +bln - 1, +tgl);
  if (isNaN(d)) return thn + '-' + bln + '-' + tgl;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: google.com atau https://example.com');
  inp.setAttribute('inputmode', 'url');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const url = normalisasiUrl(inp.value);
    if (!url) { T.show(box, errBox('Tulis alamat situs dulu.')); return; }
    T.show(box, '<p class="mut">Mencari arsip untuk ' + esc(url) + '…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch('https://archive.org/wayback/available?url=' + encodeURIComponent(url), { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const snap = j && j.archived_snapshots && j.archived_snapshots.closest;
      if (!snap || !snap.available || !snap.url) {
        T.show(box, '<p class="center dim">Tidak ada arsip tersimpan untuk situs ini.</p><p class="hint center">Wayback Machine hanya menyimpan situs yang pernah dikunjungi dan diarsipkan. Coba alamat lain atau versi tanpa www.</p>');
        return;
      }
      T.show(box,
        '<div class="center"><div class="dim">Arsip terdekat ditemukan</div>' +
        '<div style="font-weight:800;font-size:18px;margin:4px 0">' + esc(tanggalCantik(snap.timestamp) || 'Tanggal tidak diketahui') + '</div>' +
        '<div class="dim" style="font-size:12.5px">Alamat arsip: <span style="word-break:break-all">' + esc(snap.url) + '</span></div></div>' +
        '<div class="center" style="margin-top:12px">' + (tautanAman(snap.url)
          ? '<a class="btn primary" href="' + esc(snap.url) + '" target="_blank" rel="noopener">Buka versi lama situs ini</a>'
          : '<span class="dim" style="font-size:12.5px">Tautan arsip tidak bisa dibuka langsung dari sini.</span>') + '</div>' +
        '<p class="hint">Sumber: Internet Archive Wayback Machine</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server arsip tidak merespons dalam 15 detik.'
        : 'Gagal mencari arsip. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.field('Alamat situs', inp, 'Tulis nama domain saja boleh, contoh: kompas.com'));
  root.appendChild(T.row(T.btn('🔍 Cari arsip', cari, true)));
  root.appendChild(box);
}
