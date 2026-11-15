import { h as T, kv, utils } from '../../core.js?v=6.11.5';

/* Fungsi murni (bisa diuji dari node tanpa DOM). */
export const STOPWORDS_ID = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'ini', 'itu', 'adalah', 'atau', 'juga', 'pada', 'dalam', 'sebagai', 'tidak', 'akan', 'sudah', 'ada', 'oleh', 'karena', 'saat', 'jika', 'agar', 'dapat', 'bisa', 'saya', 'kami', 'kita', 'mereka', 'dia', 'ia', 'nya', 'lah', 'pun', 'telah', 'lebih', 'sangat', 'seperti', 'antara', 'setelah', 'sebelum', 'selama', 'tanpa', 'tentang', 'kepada', 'menjadi', 'merupakan', 'dimana', 'kapan', 'bagaimana', 'kenapa', 'mengapa'];

export function hitungSukuKata(kata) {
  const w = String(kata).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const g = w.match(/[aiueo]+/g);
  let n = g ? g.length : 0;
  if (n === 0) n = 1;
  return n;
}

export function flesch(kata, kalimat, sukuKata) {
  if (!kata || !kalimat) return null;
  return 206.835 - 1.015 * (kata / kalimat) - 84.6 * (sukuKata / kata);
}

export function labelFlesch(skor) {
  if (skor >= 90) return 'Sangat mudah dibaca';
  if (skor >= 80) return 'Mudah dibaca';
  if (skor >= 70) return 'Cukup mudah dibaca';
  if (skor >= 60) return 'Standar';
  if (skor >= 50) return 'Cukup sulit dibaca';
  if (skor >= 30) return 'Sulit dibaca';
  return 'Sangat sulit dibaca';
}

export function kataKunci(s, top) {
  const words = String(s).toLowerCase().match(/[a-zà-ÿ]{3,}/g) || [];
  const hit = {};
  words.forEach((w) => { if (STOPWORDS_ID.indexOf(w) === -1) hit[w] = (hit[w] || 0) + 1; });
  const total = words.length;
  return Object.keys(hit).map((w) => ({ kata: w, jumlah: hit[w], persen: total ? (hit[w] / total * 100) : 0 }))
    .sort((a, b) => b.jumlah - a.jumlah).slice(0, top || 5);
}

export const BATAS_PLATFORM = [
  ['X (Twitter)', 280],
  ['Threads', 500],
  ['Status WhatsApp', 700],
  ['Caption Instagram', 2200],
  ['LinkedIn', 3000],
  ['Caption TikTok', 4000],
  ['Deskripsi YouTube', 5000],
  ['Postingan Facebook', 63206],
];

export const meta = {"id": "word-counter", "name": "Penghitung Kata", "cat": "teks", "icon": "🔡", "desc": "Kata, karakter, estimasi baca.", "keywords": "kata,hitung,karakter,skripsi"};
export function render(root) {

      const taIn = T.ta(8, 'Ketik atau tempel teks di sini, hitungan live…');
      const box = T.out();
      const boxBatas = T.out();
      const boxFb = T.out();

      function fmtDurasi(menit) {
        if (menit < 1) return Math.max(1, Math.round(menit * 60)) + ' detik';
        return menit.toFixed(1).replace('.', ',') + ' menit';
      }

      function count() {
        const s = taIn.value;
        const words = (s.trim().match(/\S+/g) || []).length;
        const withSpace = s.length;
        const noSpace = s.replace(/\s/g, '').length;
        const sentences = (s.match(/[^.!?\n]+[.!?]+/g) || []).length;
        const paras = s.trim() ? s.trim().split(/\n\s*\n|\n/).filter((x) => x.trim()).length : 0;
        const mins = words / 200;
        const read = fmtDurasi(mins);
        const speak = fmtDurasi(words / 130);
        const suku = (s.match(/\S+/g) || []).reduce((a, w) => a + hitungSukuKata(w), 0);
        const skor = flesch(words, sentences, suku);
        const kunci = kataKunci(s, 5);
        let html =
          `<div class="kv"><span>Kata</span><b>${T.fmt(words)}</b></div>` +
          `<div class="kv"><span>Karakter (dengan spasi)</span><b>${T.fmt(withSpace)}</b></div>` +
          `<div class="kv"><span>Karakter (tanpa spasi)</span><b>${T.fmt(noSpace)}</b></div>` +
          `<div class="kv"><span>Kalimat</span><b>${T.fmt(sentences)}</b></div>` +
          `<div class="kv"><span>Paragraf</span><b>${T.fmt(paras)}</b></div>` +
          `<div class="kv"><span>Estimasi baca</span><b>${read}</b></div>` +
          `<div class="kv"><span>Estimasi dibaca keras</span><b>${speak}</b></div>`;
        if (skor != null) {
          html += `<div class="kv"><span>Kemudahan baca (Flesch)</span><b>${skor.toFixed(0)} · ${labelFlesch(skor)}</b></div>`;
        }
        if (kunci.length) {
          html += '<div style="font-size:13px;font-weight:600;margin:12px 0 4px">Kata yang paling sering muncul</div>' +
            kunci.map((k) => `<div class="kv"><span>${T.esc(k.kata)}</span><b>${T.fmt(k.jumlah)}× · ${k.persen.toFixed(1).replace('.', ',')}%</b></div>`).join('');
        }
        T.show(box, html);
        if (skor != null) {
          box.appendChild(T.el('<div class="hint" style="margin-top:6px">Skor Flesch dibuat untuk Bahasa Inggris, jadi untuk Bahasa Indonesia angkanya hanya perkiraan. Semakin tinggi, semakin mudah dibaca.</div>'));
        }
        if (!s.trim()) { T.hide(boxBatas); T.hide(boxFb); return; }
        const batasHtml = '<div style="font-size:13px;font-weight:600;margin-bottom:6px">Batas karakter tiap platform</div>' +
          BATAS_PLATFORM.map(([nama, batas]) => {
            const muat = withSpace <= batas;
            return '<div class="kv"><span>' + T.esc(nama) + ' (maks ' + T.fmt(batas) + ')</span><b style="color:' + (muat ? '#4ade80' : '#f87171') + '">' + (muat ? 'Muat' : 'Lebih ' + T.fmt(withSpace - batas) + ' karakter') + '</b></div>';
          }).join('') +
          '<div class="hint" style="margin-top:6px">Batas di atas bisa berubah sewaktu-waktu mengikuti kebijakan tiap platform.</div>';
        T.show(boxBatas, batasHtml);
        if (withSpace > 477) {
          T.show(boxFb,
            '<div style="font-size:13px;font-weight:600;margin-bottom:6px">Pratinjau "Lihat selengkapnya" Facebook</div>' +
            '<div style="background:#131316;border:1px solid #27272a;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word">' + T.esc(s.slice(0, 477)) + '… <span style="color:#a1a1aa">Lihat selengkapnya</span></div>' +
            '<div class="hint" style="margin-top:6px">Perkiraan. Facebook memotong kiriman panjang dan menampilkan tombol "Lihat selengkapnya".</div>');
        } else {
          T.hide(boxFb);
        }
      }

      taIn.addEventListener('input', count);
      T.onLeave(() => taIn.removeEventListener('input', count));
      root.appendChild(T.field('Teks', taIn, '200 kata per menit untuk estimasi baca, 130 kata per menit untuk dibaca keras.'));
      root.appendChild(box);
      root.appendChild(boxBatas);
      root.appendChild(boxFb);
      count();
    
}
