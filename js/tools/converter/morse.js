import { h as T, utils } from '../../core.js?v=4.3.0';

(function () {
    const M = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
      I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
      Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
      Y: '-.--', Z: '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
      '-': '-....-', '=': '-...-', '+': '.-.-.', '@': '.--.-.', ':': '---...', ';': '-.-.-.'
    };
    const INV = {};
    for (const k in M) INV[M[k]] = k;
    utils.morseEncode = function (s) {
      return String(s == null ? '' : s).toUpperCase().trim().split(/\s+/)
        .map((w) => w.split('').map((c) => M[c] || '').filter(Boolean).join(' '))
        .join(' / ');
    };
    utils.morseDecode = function (s) {
      return String(s == null ? '' : s).trim().split(/\s*\/\s*/)
        .map((w) => w.trim().split(/\s+/).map((m) => INV[m] || '').join(''))
        .join(' ');
    };
    utils.morseMap = M;
  })();

export const meta = {"id": "morse", "name": "Sandi Morse", "cat": "converter", "icon": "📻", "desc": "Teks ↔ sandi Morse + bunyi."};

export function render(root) {

    const inp = T.ta(4, 'Tulis teks di sini…');
    const outp = T.ta(4, 'Hasil morse / teks…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    const bPlay = T.btn('🔊 Putar Bunyi');
    const bStop = T.btn('⏹️ Berhenti');
    let token = 0;
    T.onLeave(() => { token++; });

    const enc = () => { outp.value = utils.morseEncode(inp.value) || '⚠️ Tidak ada karakter yang bisa di-encode.'; };
    const dec = () => { outp.value = utils.morseDecode(inp.value); };
    const play = () => {
      const seq = (outp.value || utils.morseEncode(inp.value)).split('');
      if (!seq.length) { T.toast('Tidak ada morse untuk dimainkan'); return; }
      const my = ++token;
      T.toast('Memutar morse…');
      let i = 0;
      (function step() {
        if (my !== token) return;
        if (i >= seq.length) { token = 0; return; }
        const ch = seq[i++];
        if (ch === '.') { T.beep(750, 0.09, 'sine'); setTimeout(step, 170); }
        else if (ch === '-') { T.beep(750, 0.28, 'sine'); setTimeout(step, 370); }
        else if (ch === '/') setTimeout(step, 520);
        else setTimeout(step, 270);
      })();
    };
    bPlay.addEventListener('click', play);
    bStop.addEventListener('click', () => { token++; T.toast('Berhenti'); });
    root.appendChild(T.field('Input', inp, 'Huruf, angka, dan tanda baca umum didukung.'));
    root.appendChild(T.row(T.btn('Teks → Morse', enc, true), T.btn('Morse → Teks', dec)));
    root.appendChild(T.field('Output', outp));
    root.appendChild(T.row(bPlay, bStop, T.copyBtn(() => outp.value, 'Salin')));
  
}
