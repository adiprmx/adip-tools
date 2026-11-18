import { h as T, esc, errBox } from '../../core.js';

// Sinonim dan kata terkait bahasa Inggris lewat Datamuse, tanpa key.
// Terverifikasi 17 Nov 2026: /words?rel_syn=happy&max=5 -> 200, CORS echo.
// Batas: sekitar 100 ribu permintaan per hari.
export const meta = {"id":"sinonim-kata-terkait","name":"Sinonim & Kata Terkait","cat":"liveapi","icon":"📖","desc":"Cari sinonim, lawan kata, kata yang berima, dan kata terkait dalam bahasa Inggris.","keywords":"sinonim,antonim,rima,datamuse,kata,bahasa inggris,thesaurus,kosakata","since":"6.17.0"};

const RELASI = [
  ['rel_syn', 'Sinonim (arti mirip)'],
  ['rel_ant', 'Lawan kata'],
  ['rel_rhy', 'Kata yang berima'],
  ['rel_trg', 'Kata yang sering muncul bersama'],
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

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: happy, fast, atau bright');
  inp.setAttribute('autocomplete', 'off');
  const rel = T.select(RELASI, 'rel_syn');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata dalam bahasa Inggris dulu.')); return; }
    T.show(box, '<p class="mut">Mencari kata untuk ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://api.datamuse.com/words?' + rel.value + '=' + encodeURIComponent(q) + '&max=20');
      const list = (Array.isArray(j) ? j : []).map((w) => w.word).filter(Boolean);
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada kata yang ditemukan untuk hubungan itu. Coba kata lain atau hubungan lain.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' kata ditemukan</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' + list.map((w) =>
          '<span style="border:1px solid #ffffff20;border-radius:8px;padding:6px 10px;font-size:13.5px">' + esc(w) + '</span>'
        ).join('') + '</div>' +
        '<p class="hint">Sumber: Datamuse. Data berbahasa Inggris, urutan dari yang paling mirip.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Datamuse tidak merespons dalam 15 detik.'
        : 'Gagal mencari kata. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis kata dalam bahasa Inggris lalu pilih hubungannya: sinonim, lawan kata, rima, atau kata yang sering muncul bersama.</p>'));
  root.appendChild(T.field('Kata', inp, 'Contoh: happy'));
  root.appendChild(T.field('Hubungan kata', rel, ''));
  root.appendChild(T.row(T.btn('🔍 Cari kata', cari, true)));
  root.appendChild(box);
}
