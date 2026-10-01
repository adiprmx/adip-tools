import { h as T, utils, U, kv } from '../../core.js?v=5.1.0';

U.parseDuration = (s) => {
    const parts = String(s).trim().split(':').map((p) => p.trim());
    if (!parts.length || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return NaN;
    if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + +parts[2];
    if (parts.length === 2) return +parts[0] * 60 + +parts[1];
    return +parts[0];
  };

const fmtDur = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
    return h ? h + ':' + mm + ':' + ss : m + ':' + ss;
  };

export const meta = {"id": "playlist-duration", "name": "Durasi Playlist", "cat": "musik", "icon": "📃", "desc": "Total durasi dari daftar lagu."};

export function render(root) {

    const src = T.ta(8, 'Judul lagu - 3:45\nLagu kedua - 4:12\nIntro - 1:02:30');
    const box = T.out();
    const hitung = () => {
      const lines = src.value.split('\n').map((s) => s.trim()).filter(Boolean);
      const items = [];
      lines.forEach((ln) => {
        const m = ln.match(/(\d+:)?\d{1,3}:\d{2}\s*$/);
        if (!m) return;
        const sec = U.parseDuration(m[0].trim());
        if (isNaN(sec)) return;
        const title = ln.slice(0, ln.length - m[0].length).replace(/[-–—:|]+$/, '').trim() || 'Tanpa judul';
        items.push({ title, sec });
      });
      if (!items.length) { T.show(box, '<p class="warn">Tidak ada durasi yang terbaca. Format per baris: <b>Judul - m:ss</b> (atau h:mm:ss).</p>'); return; }
      const total = items.reduce((a, x) => a + x.sec, 0);
      const avg = total / items.length;
      const sorted = [...items].sort((a, b) => a.sec - b.sec);
      T.show(box,
        '<div class="big">' + T.esc(fmtDur(total)) + '</div>' +
        kv('Jumlah lagu', items.length) +
        kv('Rata-rata', fmtDur(avg)) +
        kv('Terpendek', T.esc(sorted[0].title) + ' (' + fmtDur(sorted[0].sec) + ')') +
        kv('Terpanjang', T.esc(sorted[sorted.length - 1].title) + ' (' + fmtDur(sorted[sorted.length - 1].sec) + ')') +
        '<p class="hint">Cocok buat ngitung durasi set DJ, mixtape, atau playlist lari.</p>');
    };
    src.addEventListener('input', hitung);
    root.appendChild(T.field('Daftar lagu', src, 'Satu lagu per baris, akhiri dengan durasi m:ss'));
    root.appendChild(T.row(T.btn('Hitung total', hitung, true)));
    root.appendChild(box);
  
}
