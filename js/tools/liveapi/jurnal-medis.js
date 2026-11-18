import { h as T, esc, errBox } from '../../core.js';

// Cari jurnal medis lewat Europe PMC, tanpa key.
// Terverifikasi 17 Nov 2026: /webservices/rest/search?query=diabetes&format=json&pageSize=1 -> 200, CORS *.
// Europe PMC mencakup seluruh isi PubMed ditambah teks lengkap dan sitasi.
export const meta = {"id":"jurnal-medis","name":"Jurnal Medis","cat":"liveapi","icon":"🔬","desc":"Cari artikel dan jurnal medis dari Europe PMC, mencakup isi PubMed.","keywords":"jurnal medis,artikel medis,pubmed,europe pmc,penelitian,kesehatan,riset","since":"6.17.0"};

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
  const inp = T.input('text', 'Contoh: diabetes, vaksin, atau kanker');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis topik medis dulu.')); return; }
    T.show(box, '<p class="mut">Mencari jurnal tentang ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=' + encodeURIComponent(q) + '&format=json&pageSize=10');
      const list = (j && j.resultList && j.resultList.result) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada artikel yang cocok. Coba kata kunci dalam bahasa Inggris yang lebih umum.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + T.fmt(j.hitCount || list.length) + ' artikel ditemukan, menampilkan ' + list.length + '</p>' + list.map((a) => {
        const abstrak = a.abstractText ? String(a.abstractText).replace(/\s+/g, ' ').trim() : '';
        const tautan = a.pmid
          ? 'https://europepmc.org/article/MED/' + encodeURIComponent(a.pmid)
          : (a.doi ? 'https://doi.org/' + encodeURIComponent(a.doi) : '');
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
          '<div style="font-weight:700;font-size:14px;line-height:1.5">' + esc(a.title || 'Tanpa judul') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (a.authorString ? esc(a.authorString.length > 120 ? a.authorString.slice(0, 120) + '…' : a.authorString) : '') +
          ((a.journalInfo && a.journalInfo.journal && a.journalInfo.journal.title) ? '<br>' + esc(a.journalInfo.journal.title) : '') +
          (a.pubYear ? ' · ' + esc(a.pubYear) : '') + '</div>' +
          (abstrak ? '<p class="hint" style="margin-top:6px">' + esc(abstrak.length > 350 ? abstrak.slice(0, 350) + '…' : abstrak) + '</p>' : '') +
          (tautan ? '<div style="margin-top:4px"><a href="' + esc(tautan) + '" target="_blank" rel="noopener" style="font-size:12.5px">Baca artikel lengkap</a></div>' : '') +
          '</div>';
      }).join('') + '<p class="hint">Sumber: Europe PMC. Artikel umumnya berbahasa Inggris.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Europe PMC tidak merespons dalam 15 detik.'
        : 'Gagal mencari jurnal. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari artikel dan jurnal medis dari Europe PMC, yang mencakup seluruh isi PubMed. Tulis topik dalam bahasa Inggris untuk hasil terbaik.</p>'));
  root.appendChild(T.field('Topik medis', inp, 'Contoh: diabetes, vaksin'));
  root.appendChild(T.row(T.btn('🔍 Cari jurnal', cari, true)));
  root.appendChild(box);
}
