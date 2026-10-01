import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"kekuatan-pin","name":"Kekuatan PIN","cat":"keamanan","icon":"🔢","desc":"Cek seberapa kuat PIN kamu, 100% offline.","keywords":"pin,password,keamanan,kuat,sandi,cek"};

const COMMON = ['1234', '0000', '1111', '1212', '7777', '123456', '111111', '123123', '112233', '654321', '4321', '000000', '6969', '2580', '0852', '1470', '159753', '123321', '1122', '2211', '1004', '2000', '1010'];

function analyze(pin) {
  const n = pin.length;
  const notes = [];
  let score = 40;

  if (n >= 8) { score += 25; notes.push(['ok', 'Panjang ' + n + ' digit — makin panjang, makin susah ditebak.']); }
  else if (n >= 6) { score += 20; notes.push(['ok', 'Panjang ' + n + ' digit, lumayan. 8+ digit lebih aman.']); }
  else if (n >= 4) { score += 10; notes.push(['warn', 'Cuma ' + n + ' digit — gampang dijebol brute force.']); }
  else { score -= 20; notes.push(['bad', 'Terlalu pendek, di bawah 4 digit.']); }

  if (/^(\d)\1+$/.test(pin)) {
    score -= 30;
    notes.push(['bad', 'Semua digitnya sama — ini pola paling gampang ditebak.']);
  } else if (COMMON.indexOf(pin) !== -1) {
    score -= 30;
    notes.push(['bad', 'Ini PIN sejuta umat — ada di daftar tebakan pertama.']);
  } else {
    let up = true, down = true;
    for (let i = 1; i < n; i++) {
      const d = (Number(pin[i]) - Number(pin[i - 1]) + 10) % 10;
      if (d !== 1) up = false;
      if (d !== 9) down = false;
    }
    if (up || down) {
      score -= 20;
      notes.push(['bad', 'Digitnya urut ' + (up ? 'naik' : 'turun') + ' — pola klasik yang gampang ditebak.']);
    }
    if (/^(19|20)\d\d/.test(pin)) {
      score -= 15;
      notes.push(['warn', 'Mirip tahun lahir (19xx/20xx) — orang terdekatmu bisa nebak ini.']);
    }
    if (/^(\d\d)\1+$/.test(pin) || /^(\d)(\d)\1\2(\1\2)*$/.test(pin)) {
      score -= 15;
      notes.push(['warn', 'Ada pola berulang — variasinya dikit, gampang ditebak.']);
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { score: score, notes: notes };
}

function verdict(s) {
  if (s >= 80) return ['Kuat', 'var(--ok)'];
  if (s >= 55) return ['Lumayan', 'var(--warn)'];
  if (s >= 30) return ['Lemah', 'var(--warn)'];
  return ['Bahaya', '#ef4444'];
}

export function render(root) {
  let raw = '';
  const inp = T.input('text', 'Ketik PIN, mis. 482913');
  inp.maxLength = 12;
  inp.autocomplete = 'off';
  inp.style.letterSpacing = '6px';
  const box = T.out();

  const noteColor = { ok: 'var(--ok)', warn: 'var(--warn)', bad: '#ef4444' };

  const show = () => {
    if (!raw) { T.hide(box); return; }
    const r = analyze(raw);
    const v = verdict(r.score);
    let html = '<div class="big center" style="color:' + v[1] + '">' + r.score + '<span class="mut" style="font-size:14px">/100</span></div>' +
      '<p class="center" style="color:' + v[1] + ';font-weight:700">' + v[0] + '</p>';
    r.notes.forEach(([k, t]) => {
      html += '<p style="font-size:13px;line-height:1.6;color:' + noteColor[k] + '">' +
        (k === 'ok' ? '✓ ' : '⚠ ') + T.esc(t) + '</p>';
    });
    if (r.score < 80) {
      html += '<p class="hint" style="margin-top:10px">Biar lebih kuat:</p>' +
        '<p class="hint">• Jangan pakai tanggal/tahun lahir.<br>' +
        '• Campur digit acak, hindari urutan & pengulangan.<br>' +
        '• Minimal 6 digit, idealnya 8+.<br>' +
        '• Jangan pakai PIN yang sama buat semua akun.</p>';
    }
    T.show(box, html);
  };

  inp.addEventListener('input', () => {
    raw = inp.value.replace(/\D/g, '').slice(0, 12);
    inp.value = '•'.repeat(raw.length);
    show();
  });

  root.appendChild(T.el('<p class="center" style="font-size:13px;line-height:1.6;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--line-soft)">🔒 <b>PIN tidak dikirim ke mana-mana</b> — semua dihitung di perangkatmu.</p>'));
  root.appendChild(T.field('PIN kamu', inp, 'Ditampilkan sebagai •••• biar nggak kelihatan orang sebelah.'));
  root.appendChild(box);
}
