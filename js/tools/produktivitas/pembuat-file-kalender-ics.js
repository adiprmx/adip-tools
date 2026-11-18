import { h as T, dl, LOCAL_NOTE } from '../../core.js';

// Pembuat File Kalender ICS: susun acara lalu unduh sebagai file .ics
// yang bisa diimpor ke Google Calendar, kalender HP, atau Outlook.
// Formatnya mengikuti RFC 5545 (teks biasa, tanpa pustaka apa pun):
// baris-baris VEVENT dengan tanggal lokal (waktu setempat, tanpa zona),
// jadi jam yang diimpor sama dengan jam yang diketik di sini.
export const meta = {"id": "pembuat-file-kalender-ics", "name": "Pembuat File Kalender ICS", "cat": "produktivitas", "icon": "📅", "desc": "Buat file acara .ics yang bisa diimpor ke Google Calendar atau kalender HP.", "keywords": "ics,kalender,acara,google calendar,buat acara,undangan kalender", "since": "6.17.0"};

// "2026-11-20T13:30" -> "20261120T133000" (format tanggal ICS).
// Mengembalikan '' bila input bukan tanggal-jam yang benar.
export function keFormatIcs(nilai) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(nilai || '').trim());
  if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return '';
  return m[1] + m[2] + m[3] + 'T' + m[4] + m[5] + '00';
}

// Escape nilai teks menurut RFC 5545: backslash, koma, titik koma,
// dan baris baru. Murni, bisa diuji di Node.
export function escapeIcs(teks) {
  return String(teks == null ? '' : teks)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// Susun isi file .ics dari data acara. Murni, bisa diuji di Node.
// acara: {judul, mulai, selesai, lokasi, catatan, pengingatMenit}
// pengingatMenit: 0 = tanpa pengingat, selain itu menit sebelum acara.
export function susunIcs(acara) {
  const a = acara || {};
  const mulai = keFormatIcs(a.mulai);
  const selesai = keFormatIcs(a.selesai);
  const uid = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + '@adip-tools';
  const cap = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const stempel = cap.getUTCFullYear() + p2(cap.getUTCMonth() + 1) + p2(cap.getUTCDate())
    + 'T' + p2(cap.getUTCHours()) + p2(cap.getUTCMinutes()) + p2(cap.getUTCSeconds()) + 'Z';
  const baris = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Adip Tools//Pembuat ICS//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + stempel,
    'DTSTART:' + mulai,
  ];
  if (selesai) baris.push('DTEND:' + selesai);
  baris.push('SUMMARY:' + escapeIcs(a.judul || 'Acara'));
  if (a.lokasi) baris.push('LOCATION:' + escapeIcs(a.lokasi));
  if (a.catatan) baris.push('DESCRIPTION:' + escapeIcs(a.catatan));
  const ingat = Number(a.pengingatMenit) || 0;
  if (ingat > 0) {
    baris.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT' + ingat + 'M',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + escapeIcs(a.judul || 'Acara'),
      'END:VALARM',
    );
  }
  baris.push('END:VEVENT', 'END:VCALENDAR');
  return baris.join('\r\n') + '\r\n';
}

export function render(root) {
  const judulI = T.input('text', 'Misal: Rapat dengan klien');
  const mulaiI = T.input('datetime-local');
  const selesaiI = T.input('datetime-local');
  const lokasiI = T.input('text', 'Misal: Kantor, Jalan Merdeka 12');
  const catatanI = T.ta(3, 'Catatan tambahan untuk acara ini (boleh kosong)');
  const ingatSel = T.select([
    ['0', 'Tanpa pengingat'],
    ['10', '10 menit sebelumnya'],
    ['30', '30 menit sebelumnya'],
    ['60', '1 jam sebelumnya'],
    ['1440', '1 hari sebelumnya'],
  ], '30');
  const box = T.out();
  const hasilBox = T.out();

  // Isi awal yang masuk akal: besok jam 09.00 sampai 10.00.
  const besok = new Date();
  besok.setDate(besok.getDate() + 1);
  const p2 = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())
    + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  const awal = new Date(besok); awal.setHours(9, 0, 0, 0);
  const akhir = new Date(besok); akhir.setHours(10, 0, 0, 0);
  mulaiI.value = iso(awal);
  selesaiI.value = iso(akhir);

  function buat() {
    const judul = judulI.value.trim();
    if (!judul) { T.toast('Isi judul acaranya dulu'); judulI.focus(); return; }
    if (!keFormatIcs(mulaiI.value)) { T.toast('Tanggal dan jam mulai belum benar'); return; }
    if (selesaiI.value && !keFormatIcs(selesaiI.value)) { T.toast('Tanggal dan jam selesai belum benar'); return; }
    if (selesaiI.value && selesaiI.value <= mulaiI.value) { T.toast('Jam selesai harus setelah jam mulai'); return; }
    const isi = susunIcs({
      judul,
      mulai: mulaiI.value,
      selesai: selesaiI.value,
      lokasi: lokasiI.value.trim(),
      catatan: catatanI.value.trim(),
      pengingatMenit: ingatSel.value,
    });
    const namaFile = judul.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'acara';
    T.show(box, `<p class="note">File acaranya sudah jadi. Buka file ini di HP atau impor ke Google Calendar, acaranya langsung masuk.</p>`);
    T.show(hasilBox, '');
    hasilBox.appendChild(T.btn('Unduh File .ics', () => { dl(namaFile + '.ics', isi, 'text/calendar;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.copyBtn(() => isi, 'Salin Isi File'));
    T.scrollToPreview(box);
  }

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Isi detail acaranya, unduh filenya, lalu buka di HP atau impor ke Google Calendar. Jam yang diimpor sama dengan jam yang kamu ketik di sini.</p>'));
  root.appendChild(T.field('Judul acara', judulI));
  root.appendChild(T.grid2(T.field('Mulai', mulaiI), T.field('Selesai', selesaiI)));
  root.appendChild(T.field('Tempat', lokasiI));
  root.appendChild(T.field('Catatan', catatanI));
  root.appendChild(T.field('Pengingat', ingatSel));
  root.appendChild(T.btn('Buat File .ics', buat, true));
  root.appendChild(box);
  root.appendChild(hasilBox);
}
