import { h as T } from '../../core.js?v=6.8.0';

export const meta = {"id": "ukuran-file-audio", "name": "Ukuran File Audio", "cat": "musik", "icon": "🎵", "desc": "Bitrate × durasi jadi ukuran file, atau sebaliknya.", "keywords": "ukuran file,audio,bitrate,mp3,wav,flac,mb,durasi,kbps"};

const PRESETS = [
  ['128', 'MP3 128 kbps'],
  ['320', 'MP3 320 kbps'],
  ['1000', 'FLAC ~1000 kbps'],
  ['1411', 'WAV 1411 kbps'],
  ['custom', 'Custom...'],
];

const parseDur = (s) => {
  const m = /^\s*(?:(\d+)\s*:\s*)?(\d+(?:[.,]\d+)?)\s*$/.exec(String(s == null ? '' : s));
  if (!m) return NaN;
  return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseFloat(m[2].replace(',', '.'));
};
const fmtDur = (det) => {
  const m = Math.floor(det / 60), s = Math.round(det % 60);
  return m + ':' + String(s).padStart(2, '0');
};

export function render(root) {
  const durI = T.input('text', 'cth: 3:45', '3:45');
  const brSel = T.select(PRESETS, '320');
  const customI = T.input('number', 'cth: 192');
  customI.inputMode = 'decimal';
  const customF = T.field('Bitrate custom (kbps)', customI);
  const targetI = T.input('number', 'cth: 10');
  targetI.inputMode = 'decimal';
  const boxA = T.out();
  const boxB = T.out();

  const hitung = () => {
    customF.style.display = brSel.value === 'custom' ? '' : 'none';
    const det = parseDur(durI.value);
    if (!(det > 0)) {
      T.show(boxA, '<p class="center mut">Isi durasi yang valid dulu ya (format menit:detik).</p>');
      T.show(boxB, '<p class="center mut">Isi durasi yang valid dulu ya.</p>');
      return;
    }
    const kbps = brSel.value === 'custom' ? T.num(customI.value) : parseFloat(brSel.value);
    if (kbps > 0) {
      const mb = (kbps * det) / 8 / 1024;
      T.show(boxA,
        '<div class="big center">' + mb.toFixed(2) + ' <span class="mut" style="font-size:15px">MB</span></div>' +
        '<p class="center mut">' + kbps + ' kbps &times; ' + fmtDur(det) + '</p>');
    } else {
      T.show(boxA, '<p class="center mut">Isi bitrate custom dulu.</p>');
    }
    const tmb = T.num(targetI.value);
    if (tmb > 0) {
      const maxk = Math.floor((tmb * 8 * 1024) / det);
      T.show(boxB,
        '<div class="big center">' + maxk + ' <span class="mut" style="font-size:15px">kbps</span></div>' +
        '<p class="center mut">Bitrate maksimal biar muat ' + tmb + ' MB dalam ' + fmtDur(det) + '</p>');
    } else {
      T.show(boxB, '<p class="center mut">Isi target ukuran di bawah buat hitung bitrate maksimalnya.</p>');
    }
  };

  durI.addEventListener('input', hitung);
  brSel.addEventListener('change', hitung);
  customI.addEventListener('input', hitung);
  targetI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="h3">Dari bitrate ke ukuran</p>'));
  root.appendChild(T.grid2(
    T.field('Durasi (menit:detik)', durI, 'Contoh: 3:45 untuk 3 menit 45 detik.'),
    T.field('Bitrate', brSel)
  ));
  root.appendChild(customF);
  root.appendChild(boxA);
  root.appendChild(T.el('<p class="h3" style="margin-top:18px">Dari target ukuran ke bitrate</p>'));
  root.appendChild(T.field('Target ukuran (MB)', targetI, 'Misal batas upload 10 MB.'));
  root.appendChild(boxB);
  root.appendChild(T.el('<p class="hint center">Rumus: ukuran (MB) = bitrate (kbps) &times; detik &divide; 8 &divide; 1024.</p>'));
  hitung();
}
