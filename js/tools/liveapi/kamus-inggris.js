import { h as T, esc } from '../../core.js?v=6.12.0';

export const meta = {"id":"kamus-inggris","name":"Kamus Inggris","cat":"liveapi","icon":"📖","desc":"Arti kata bahasa Inggris lengkap dengan cara baca & contoh kalimat.","keywords":"kamus,inggris,arti kata,dictionary,definisi,pengucapan,sinonim","since":"6.12.0"};

const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

export function render(root) {
  const q = T.input('text', 'Ketik kata bahasa Inggris, mis. hello…', '');
  const box = T.out();
  const cache = new Map();

  const cari = async () => {
    const kw = q.value.trim();
    if (!kw) { T.toast && T.toast('Ketik dulu kata yang mau dicari'); return; }
    if (!/^[a-zA-Z][a-zA-Z' -]*$/.test(kw)) {
      T.show(box, '<div class="dim center">Ketik satu kata bahasa Inggris saja (huruf A–Z).</div>');
      return;
    }
    T.show(box, '<div class="dim center">Mencari arti "' + esc(kw) + '"…</div>');
    const key = kw.toLowerCase();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      let data;
      if (cache.has(key)) {
        data = cache.get(key);
      } else {
        const res = await fetch(API + encodeURIComponent(key), { signal: ctrl.signal });
        clearTimeout(timer);
        status = res.status;
        if (status === 404) {
          T.show(box, '<div class="dim center">Kata "' + esc(kw) + '" tidak ditemukan di kamus. Periksa ejaannya atau coba kata lain.</div>');
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
        data = await res.json();
        cache.set(key, data);
      }
      const d = (data && data[0]) || null;
      if (!d || !d.meanings || !d.meanings.length) {
        T.show(box, '<div class="dim center">Tidak ada arti untuk "' + esc(kw) + '". Coba kata lain.</div>');
        return;
      }
      const fonetik = (d.phonetics || []).find((p) => p.text) || {};
      const audio = (d.phonetics || []).find((p) => p.audio);
      let html = '<div class="center"><div class="big">' + esc(d.word || kw) + '</div>' +
        (fonetik.text ? '<div class="dim">' + esc(fonetik.text) + '</div>' : '') + '</div>';
      if (audio && audio.audio) {
        html += '<div class="center" style="margin-top:8px"><audio controls preload="none" src="' + esc(audio.audio) + '" style="max-width:100%"></audio><div class="dim">Dengarkan cara bacanya</div></div>';
      }
      d.meanings.forEach((m) => {
        html += '<div style="font-weight:700;margin-top:14px">' + esc(m.partOfSpeech || 'Kata') + '</div>';
        (m.definitions || []).slice(0, 5).forEach((def, i) => {
          html += '<div style="margin-top:6px"><span class="dim">' + (i + 1) + '.</span> ' + esc(def.definition || '-') + '</div>';
          if (def.example) html += '<div class="dim" style="margin-left:16px">Contoh: "' + esc(def.example) + '"</div>';
        });
        const sin = (m.synonyms || []).slice(0, 8);
        const ant = (m.antonyms || []).slice(0, 8);
        if (sin.length) html += '<div class="dim" style="margin-top:6px">Kata sejenis: ' + sin.map(esc).join(', ') + '</div>';
        if (ant.length) html += '<div class="dim" style="margin-top:4px">Kata lawan: ' + ant.map(esc).join(', ') + '</div>';
      });
      T.show(box, html);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal mencari kata. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.field('Kata bahasa Inggris', q));
  root.appendChild(T.row(T.btn('🔍 Cari arti', cari, true)));
  root.appendChild(box);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
}
