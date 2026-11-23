import { h as T, esc, errBox } from '../../core.js';

// Info label obat lewat openFDA (badan obat AS), tanpa key.
// Terverifikasi 17 Nov 2026: /drug/label.json?search=aspirin&limit=1 -> 200, CORS *.
// Batas tanpa key: 240 permintaan per menit.
export const meta = {"id":"info-obat-fda","name":"Info Obat FDA","cat":"liveapi","icon":"💊","desc":"Lihat kegunaan dan peringatan sebuah obat dari data resmi FDA Amerika.","keywords":"obat,fda,label obat,kegunaan obat,peringatan obat,efek samping","since":"6.17.0", "online": true};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const potong = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: aspirin, paracetamol, atau ibuprofen');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama obat dulu.')); return; }
    T.show(box, '<p class="mut">Mencari info obat ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://api.fda.gov/drug/label.json?search=' + encodeURIComponent(q) + '&limit=1');
      const d = j && j.results && j.results[0];
      if (!d) throw new Error('not-found');
      const o = d.openfda || {};
      const nama = (o.brand_name && o.brand_name[0]) || (o.generic_name && o.generic_name[0]) || q;
      const generik = o.generic_name && o.generic_name[0];
      const pabrik = o.manufacturer_name && o.manufacturer_name[0];
      const tujuan = d.purpose && d.purpose[0];
      const guna = d.indications_and_usage && d.indications_and_usage[0];
      const peringatan = d.warnings && d.warnings[0];
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px">' + esc(nama) + '</div>' +
        (generik && generik.toLowerCase() !== String(nama).toLowerCase() ? '<div class="dim" style="font-size:12.5px">Nama generik: ' + esc(generik) + '</div>' : '') +
        (pabrik ? '<div class="dim" style="font-size:12.5px">Pembuat: ' + esc(pabrik) + '</div>' : '') + '</div>' +
        '<div style="margin-top:12px">' +
        (tujuan ? '<div style="border-top:1px solid #ffffff14;padding:10px 0"><b>Kegunaan</b><p class="hint" style="margin-top:4px">' + esc(potong(tujuan, 500)) + '</p></div>' : '') +
        (guna ? '<div style="border-top:1px solid #ffffff14;padding:10px 0"><b>Cara pakai singkat</b><p class="hint" style="margin-top:4px">' + esc(potong(guna, 600)) + '</p></div>' : '') +
        (peringatan ? '<div style="border-top:1px solid #ffffff14;padding:10px 0"><b>Peringatan</b><p class="hint" style="margin-top:4px">' + esc(potong(peringatan, 600)) + '</p></div>' : '') +
        '</div>' +
        '<p class="hint" style="margin-top:10px">Ini info umum dari label resmi FDA Amerika, dalam bahasa Inggris apa adanya. Ini BUKAN saran medis. Untuk keputusan soal obat, konsultasi ke dokter atau apoteker.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Obat tidak ditemukan di data FDA. Coba nama generiknya dalam bahasa Inggris, contoh: paracetamol.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server FDA tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari info obat. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari nama obat untuk melihat kegunaan dan peringatannya dari label resmi FDA Amerika. Tulis nama obat dalam bahasa Inggris.</p>'));
  root.appendChild(T.field('Nama obat', inp, 'Contoh: aspirin, paracetamol'));
  root.appendChild(T.row(T.btn('🔍 Cari info obat', cari, true)));
  root.appendChild(box);
}
