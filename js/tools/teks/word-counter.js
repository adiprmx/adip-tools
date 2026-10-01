import { h as T, utils } from '../../core.js?v=5.1.0';

export const meta = {"id": "word-counter", "name": "Penghitung Kata", "cat": "teks", "icon": "🔡", "desc": "Kata, karakter, estimasi baca."};

export function render(root) {

      const taIn = T.ta(8, 'Ketik atau tempel teks di sini, hitungan live…');
      const box = T.out();

      function count() {
        const s = taIn.value;
        const words = (s.trim().match(/\S+/g) || []).length;
        const withSpace = s.length;
        const noSpace = s.replace(/\s/g, '').length;
        const sentences = (s.match(/[^.!?\n]+[.!?]+/g) || []).length;
        const paras = s.trim() ? s.trim().split(/\n\s*\n|\n/).filter((x) => x.trim()).length : 0;
        const mins = words / 200;
        const read = mins < 1 ? Math.max(1, Math.round(mins * 60)) + ' detik' : mins.toFixed(1) + ' menit';
        T.show(box,
          `<div class="kv"><span>Kata</span><b>${T.fmt(words)}</b></div>` +
          `<div class="kv"><span>Karakter (dengan spasi)</span><b>${T.fmt(withSpace)}</b></div>` +
          `<div class="kv"><span>Karakter (tanpa spasi)</span><b>${T.fmt(noSpace)}</b></div>` +
          `<div class="kv"><span>Kalimat</span><b>${T.fmt(sentences)}</b></div>` +
          `<div class="kv"><span>Paragraf</span><b>${T.fmt(paras)}</b></div>` +
          `<div class="kv"><span>Estimasi baca</span><b>${read}</b></div>`);
      }

      taIn.addEventListener('input', count);
      T.onLeave(() => taIn.removeEventListener('input', count));
      root.appendChild(T.field('Teks', taIn, '200 kata per menit untuk estimasi baca.'));
      root.appendChild(box);
      count();
    
}
