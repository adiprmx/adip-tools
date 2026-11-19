import { h as T, esc, errBox, utils } from '../../core.js';

// Daftar sertifikat SSL yang pernah diterbitkan untuk sebuah domain,
// lewat crt.sh (log publik Certificate Transparency), tanpa key.
// Terverifikasi 17 Nov 2026: https://crt.sh/?q=example.com&output=json -> 200, CORS *.
export const meta = {"id":"sertifikat-ssl-domain","name":"Sertifikat SSL Domain","cat":"liveapi","icon":"🔒","desc":"Lihat sertifikat SSL yang pernah diterbitkan untuk sebuah domain beserta masa berlakunya.","keywords":"ssl,sertifikat,https,crt.sh,keamanan domain,certificate transparency","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js).

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: google.com atau example.com');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const cari = async () => {
    const d = String(inp.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!d || d.indexOf('.') < 0) { T.show(box, errBox('Tulis nama domain yang benar, contoh: google.com')); return; }
    T.show(box, '<p class="mut">Mencari sertifikat untuk ' + esc(d) + '…</p>');
    try {
      const j = await getJSON('https://crt.sh/?q=' + encodeURIComponent(d) + '&output=json');
      const list = Array.isArray(j) ? j : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada sertifikat yang tercatat untuk domain ini. Mungkin domain belum pernah memakai HTTPS.</p>');
        return;
      }
      const urut = list.slice().sort((a, b) => new Date(b.not_after || 0) - new Date(a.not_after || 0));
      const tampil = urut.slice(0, 15);
      const sekarang = Date.now();
      T.show(box, '<p class="hint">' + T.fmt(list.length) + ' sertifikat tercatat, menampilkan ' + tampil.length + ' terbaru</p>' + tampil.map((s) => {
        const akhir = new Date(s.not_after || 0);
        const masihBerlaku = !isNaN(akhir) && akhir.getTime() > sekarang;
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
          '<div style="font-weight:700;font-size:14px;word-break:break-all">' + esc(s.common_name || s.name_value || '-') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (s.issuer_name ? 'Penerbit: ' + esc(s.issuer_name) + '<br>' : '') +
          'Berlaku: ' + esc(utils.tglCantik(s.not_before)) + ' sampai ' + esc(utils.tglCantik(s.not_after)) + '<br>' +
          'Status: ' + (masihBerlaku ? 'Masih berlaku' : 'Sudah kedaluwarsa') +
          '</div></div>';
      }).join('') + '<p class="hint">Sumber: crt.sh, log publik Certificate Transparency. Daftar ini berisi sertifikat yang pernah diterbitkan, termasuk yang sudah kedaluwarsa.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server crt.sh tidak merespons dalam 15 detik. Server ini kadang lambat, coba lagi.'
        : 'Gagal mencari sertifikat. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Lihat sertifikat SSL yang pernah diterbitkan untuk sebuah domain, beserta penerbit dan masa berlakunya.</p>'));
  root.appendChild(T.field('Nama domain', inp, 'Tanpa awalan http, contoh: google.com'));
  root.appendChild(T.row(T.btn('🔍 Cari sertifikat', cari, true)));
  root.appendChild(box);
}
