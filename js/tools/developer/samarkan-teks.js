import { h as T, kv, errBox, esc } from '../../core.js?v=6.12.0';

// Samarkan data pribadi di teks: email, nomor HP Indonesia, NIK,
// dan nomor kartu. 100% lokal, tidak ada yang dikirim ke mana pun.
// Urutan penting: kartu berkelompok dulu, lalu email, lalu HP, lalu NIK
// (16 angka berurutan dianggap NIK, bukan kartu).
const RE_CARD_GROUP = /\b(?:\d{4}[- ]){3}\d{4}\b|\b\d{4}[- ]\d{6}[- ]\d{5}\b/g;
const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RE_PHONE = /(?<!\d)(?:\+62|0)8\d{7,11}\b/g;
const RE_NIK = /\b\d{16}\b/g;

function maskMid(s, keepStart, keepEnd, ch) {
  if (s.length <= keepStart + keepEnd) return ch.repeat(s.length);
  // keepEnd 0: slice(-0) sama dengan slice(0) = seluruh string, jadi tangani khusus.
  const tail = keepEnd > 0 ? s.slice(s.length - keepEnd) : '';
  return s.slice(0, keepStart) + ch.repeat(s.length - keepStart - keepEnd) + tail;
}

function maskEmail(m, mode) {
  if (mode === 'full') return '•'.repeat(m.length);
  const at = m.indexOf('@');
  const local = m.slice(0, at), domain = m.slice(at);
  return maskMid(local, 1, 0, '•') + domain;
}

function maskDigits(m, mode, keepStart, keepEnd) {
  if (mode === 'full') return '•'.repeat(m.length);
  // Sensor sebagian: pertahankan angka awal/akhir, pemisah tetap.
  const digits = m.replace(/\D/g, '');
  const masked = maskMid(digits, keepStart, keepEnd, '•');
  let j = 0;
  return m.replace(/\d/g, () => masked[j++]);
}

function maskText(text, mode) {
  const counts = { kartu: 0, email: 0, hp: 0, nik: 0 };
  let out = String(text || '');
  out = out.replace(RE_CARD_GROUP, (m) => { counts.kartu++; return maskDigits(m, mode, 0, 4); });
  out = out.replace(RE_EMAIL, (m) => { counts.email++; return maskEmail(m, mode); });
  out = out.replace(RE_PHONE, (m) => { counts.hp++; return maskDigits(m, mode, 4, 2); });
  out = out.replace(RE_NIK, (m) => { counts.nik++; return maskDigits(m, mode, 4, 2); });
  return { out, counts };
}

export const meta = {"id": "samarkan-teks", "name": "Samarkan Teks", "cat": "developer", "icon": "🙈", "desc": "Sensor email, nomor HP, NIK & kartu di teks.", "keywords": "sensor,mask,privasi,nik,email,hp,kartu,samarkan", "since": "6.11.0"};
export function render(root) {

    const inp = T.ta(7, 'Tempel teks yang ada data pribadinya di sini…\nContoh: hubungi budi@mail.com atau 081234567890');
    const modeSel = T.select([
      ['partial', 'Sensor sebagian (awal & akhir masih terlihat)'],
      ['full', 'Sensor penuh (semua jadi titik)'],
    ], 'partial');
    const out = T.out();
    const resTa = T.ta(7, 'Hasil muncul di sini…');
    resTa.readOnly = true;
    let lastResult = '';

    const run = () => {
      if (!inp.value.trim()) { T.show(out, errBox('Tempel dulu teksnya.')); return; }
      const r = maskText(inp.value, modeSel.value);
      lastResult = r.out;
      resTa.value = r.out;
      const total = r.counts.kartu + r.counts.email + r.counts.hp + r.counts.nik;
      const detail = [];
      if (r.counts.email) detail.push(r.counts.email + ' email');
      if (r.counts.hp) detail.push(r.counts.hp + ' nomor HP');
      if (r.counts.nik) detail.push(r.counts.nik + ' NIK');
      if (r.counts.kartu) detail.push(r.counts.kartu + ' nomor kartu');
      T.show(out, total
        ? '<span class="ok">✓ ' + total + ' data disensor</span> <span class="dim">(' + esc(detail.join(', ')) + ').</span>'
        : '<span class="dim">Tidak ada email, nomor HP, NIK, atau nomor kartu yang dikenali di teks ini.</span>');
    };

    root.appendChild(T.field('Teks', inp));
    root.appendChild(T.field('Cara menyensor', modeSel));
    root.appendChild(T.row(T.btn('Samarkan', run, true), T.copyBtn(() => lastResult, 'Salin Hasil')));
    root.appendChild(out);
    root.appendChild(T.field('Hasil', resTa));
    root.appendChild(T.el('<div class="hint" style="margin-top:10px">Cara kerja: email disensor nama depannya, nomor HP &amp; NIK disensor tengahnya, nomor kartu hanya 4 angka terakhir yang terlihat. 16 angka berurutan dianggap NIK. Semua diproses di perangkat ini, teks tidak dikirim ke mana pun.</div>'));
  
}
