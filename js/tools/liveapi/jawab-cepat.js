import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"jawab-cepat","name":"Jawab Cepat","cat":"liveapi","icon":"💡","desc":"Jawaban singkat untuk pertanyaan umum, dari DuckDuckGo.","keywords":"jawab cepat,tanya,jawaban instan,duckduckgo,wikipedia,arti","since":"6.18.0"};

// Jawaban instan lewat DuckDuckGo Instant Answer, tanpa key.
// Terverifikasi 18 Nov 2026: api.duckduckgo.com/?q=Jakarta&format=json -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
// Beda dari Ringkasan Wikipedia (ringkasan satu artikel): tool ini memberi
// jawaban instan multi-sumber (jawaban langsung, definisi, topik terkait).
const API = 'https://api.duckduckgo.com/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Buang tag HTML dari teks hasil (API mengembalikan <a> di dalam Result),
// supaya yang tampil hanya teks polos. Outputnya tetap di-escape saat render.
export function bersihkanHasil(teks) {
  return String(teks || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function ringkasJawaban(j) {
  if (!j || typeof j !== 'object') return null;
  const topik = [];
  const kumpul = (daftar) => {
    (Array.isArray(daftar) ? daftar : []).forEach((t) => {
      if (Array.isArray(t.Topics)) { kumpul(t.Topics); return; }
      const teks = bersihkanHasil(t.Result || t.Text);
      const tautan = typeof t.FirstURL === 'string' && t.FirstURL.indexOf('https://') === 0 ? t.FirstURL : '';
      if (teks) topik.push({ teks, tautan });
    });
  };
  kumpul(j.RelatedTopics);
  return {
    judul: typeof j.Heading === 'string' ? j.Heading : '',
    jawaban: typeof j.Answer === 'string' ? j.Answer : '',
    ringkasan: typeof j.AbstractText === 'string' ? j.AbstractText : '',
    sumberRingkasan: typeof j.AbstractSource === 'string' ? j.AbstractSource : '',
    definisi: typeof j.Definition === 'string' ? j.Definition : '',
    topik: topik.slice(0, 5),
  };
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Jakarta, fotosintesis, 2+2');
  inp.setAttribute('autocomplete', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', tanya));
    box.appendChild(w);
  };

  const tanya = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis pertanyaan atau kata kunci dulu.')); return; }
    T.show(box, '<p class="mut">Mencari jawaban untuk ' + esc(q) + '…</p>');
    try {
      const hasil = ringkasJawaban(await getJSON(API + '?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1'));
      if (!hasil) throw new Error('bad-data');
      const kosong = !hasil.jawaban && !hasil.ringkasan && !hasil.definisi && !hasil.topik.length;
      if (kosong) {
        T.show(box, '<p class="center dim">Tidak ada jawaban singkat untuk itu. Coba kata kunci lain yang lebih umum.</p>' +
          '<p class="center" style="margin-top:8px"><a href="https://duckduckgo.com/?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">Cari di DuckDuckGo</a></p>');
        return;
      }
      T.show(box,
        (hasil.judul ? '<div class="center"><div style="font-weight:800;font-size:18px">' + esc(hasil.judul) + '</div></div>' : '') +
        (hasil.jawaban ? '<p style="font-size:16px;font-weight:700;margin-top:10px">' + esc(hasil.jawaban) + '</p>' : '') +
        (hasil.ringkasan ? '<p class="hint" style="margin-top:10px">' + esc(hasil.ringkasan) + (hasil.sumberRingkasan ? ' <span class="dim">(sumber: ' + esc(hasil.sumberRingkasan) + ')</span>' : '') + '</p>' : '') +
        (hasil.definisi ? '<p class="hint" style="margin-top:10px">' + esc(hasil.definisi) + '</p>' : '') +
        (hasil.topik.length ? '<div style="margin-top:12px"><div style="font-weight:700;font-size:13px">Topik terkait</div>' +
          hasil.topik.map((t) => '<div style="border-bottom:1px solid #2e2823;padding:7px 0;font-size:13px;line-height:1.5">' + esc(t.teks) +
            (t.tautan ? ' <a href="' + esc(t.tautan) + '" target="_blank" rel="noopener">Buka</a>' : '') + '</div>').join('') + '</div>' : '') +
        '<p class="hint">Sumber: DuckDuckGo Instant Answer.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 10 detik.'
        : 'Gagal mencari jawaban. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tanya(); });
  root.appendChild(T.el('<p class="note">Tanya apa saja untuk jawaban singkat: arti kata, hitungan sederhana, atau ringkasan topik.</p>'));
  root.appendChild(T.field('Pertanyaan atau kata kunci', inp, 'Contoh: Jakarta, fotosintesis'));
  root.appendChild(T.row(T.btn('Cari jawaban', tanya, true)));
  root.appendChild(box);
}
