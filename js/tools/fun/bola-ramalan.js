import { h as T, utils, beep, actx, onLeave, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "bola-ramalan", "name": "Bola Ramalan", "cat": "fun", "icon": "🔮", "desc": "Tanya ya/tidak, biar bola ajaib yang jawab.", "keywords": "ramalan,magic 8 ball,tanya,ya tidak,hiburan"};

export const JAWABAN = [
  'Sangat mungkin. 👍',
  'Sudah pasti ya. ✨',
  'Tanda-tandanya bagus.',
  'Sepertinya iya.',
  'Bisa jadi, kenapa tidak?',
  'Tanya lagi nanti. 🎱',
  'Jawabannya masih kabur… coba tanya lagi.',
  'Sulit diprediksi sekarang.',
  'Fokus dan tanya sekali lagi.',
  'Jangan berharap terlalu tinggi. 😅',
  'Sepertinya tidak.',
  'Kemungkinannya kecil.',
  'Bola bilang: belum waktunya.',
  'Jangan tanya bola, tanya hatimu. 💭',
  'Mending kamu yang tentukan sendiri!',
];

export function jawabBola() {
  return JAWABAN[Math.floor(Math.random() * JAWABAN.length)];
}

export function render(root) {
  const inTanya = T.input('text', 'Contoh: Apakah aku lulus ujian besok?', '');
  const box = T.out();
  let iv = null;
  const hentikan = () => { if (iv) { clearInterval(iv); iv = null; } };
  onLeave(hentikan);

  const tanya = () => {
    const q = inTanya.value.trim();
    if (!q) { T.show(box, errBox('Tulis dulu pertanyaan ya/tidak kamu.')); return; }
    hentikan();
    const final = jawabBola();
    let n = 0;
    beep(330, 0.12, 'sine');
    iv = setInterval(() => {
      n++;
      const tampil = n >= 12 ? final : jawabBola();
      const gaya = n >= 12
        ? 'font-size:22px;font-weight:700;color:#fff'
        : 'font-size:16px;color:#a8a29e';
      T.show(box,
        '<div class="center">' +
        '<div style="font-size:56px;margin-bottom:6px">' + (n >= 12 ? '🔮' : '🎱') + '</div>' +
        '<div class="dim" style="margin-bottom:10px;max-width:420px">“' + T.esc(q) + '”</div>' +
        '<div style="' + gaya + ';line-height:1.5;max-width:420px">' + T.esc(tampil) + '</div>' +
        (n >= 12 ? '<div class="dim" style="margin-top:14px;font-size:11.5px">⚠️ Sekadar hiburan — jangan dijadikan pedoman keputusan penting ya.</div>' : '') +
        '</div>');
      if (n >= 12) { hentikan(); beep(523, 0.2, 'sine'); beep(784, 0.3, 'sine', 0.18); }
    }, 110);
  };

  root.appendChild(T.field('Pertanyaanmu', inTanya, 'Pertanyaan yang jawabannya ya atau tidak.'));
  root.appendChild(T.btn('🔮 Tanya bola', tanya, true));
  root.appendChild(box);
}
