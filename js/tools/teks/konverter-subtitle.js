import { h as T, kv, errBox, utils, fileInput } from '../../core.js';

export const meta = {"id":"konverter-subtitle","name":"Konverter Subtitle","cat":"teks","icon":"💬","desc":"Ubah subtitle antar format SRT, VTT, ASS, SBV, dan TTML, ambil teks polosnya, atau geser waktunya.","keywords":"subtitle,srt,vtt,ass,sbv,ttml,film,video,waktu,subtitle ke teks,teks polos,ekstrak subtitle,transkrip subtitle","since":"6.11.0"};

/* Konverter subtitle 5 format + teks polos + geser waktu.
   Hasil gabung v6.21.0 (B5): Konverter Subtitle (SRT<->VTT + geser) +
   Konverter Subtitle ASS/SBV/TTML (parser/serializer 5 format + deteksi
   otomatis) + Subtitle ke Teks Polos (mode output teks polos).
   Parser toleran: nomor urut boleh hilang, pemisah desimal koma/titik.
   PERHATIAN (perbaikan gelombang 2, F8): milidetik nol-depan WAJIB
   dibaca sebagai string, BUKAN angka — ",005" = 1005 ms, bukan 1500 ms.
   Pola yang benar: (m[4] + '000').slice(0, 3). Jangan diubah lagi. */

/* Terima: H:MM:SS.cc, H:MM:SS,mmm, MM:SS.cc, detik "12.5s", detik "12.5". */
export function parseTime(s) {
  const str = String(s || '').trim();
  let m = /^(\d+(?:\.\d+)?)s$/.exec(str);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  m = /^(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})$/.exec(str);
  if (m) {
    const ms = (m[4] + '000').slice(0, 3);
    return ((+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3])) * 1000 + (+ms);
  }
  m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(str);
  if (m) return ((+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3])) * 1000;
  if (/^\d+(?:\.\d+)?$/.test(str)) return Math.round(parseFloat(str) * 1000);
  return null;
}

// fmtSrt, fmtVtt kanonis tinggal di utils (core.js).
export function fmtAss(ms) {
  ms = Math.max(0, Math.round(ms));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
  const s = Math.floor(ms % 60000 / 1000), cs = Math.floor((ms % 1000) / 10);
  const p = (n, l) => String(n).padStart(l, '0');
  return h + ':' + p(m, 2) + ':' + p(s, 2) + '.' + p(cs, 2);
}

export function parseSub(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n');
  const blocks = src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const cues = [];
  for (const b of blocks) {
    if (/^WEBVTT/i.test(b) && !/-->/.test(b)) continue;
    const lines = b.split('\n').map((l) => l.trimEnd());
    let ti = lines.findIndex((l) => /-->/.test(l));
    if (ti < 0) continue;
    const parts = lines[ti].split('-->');
    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    if (start == null || end == null) continue;
    const txt = lines.slice(ti + 1).join('\n').trim();
    if (!txt) continue;
    cues.push({ start, end, text: txt });
  }
  return cues;
}

/* ASS: baris "Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,
   MarginV,Effect,Text". Tag {\...} dibuang, \N jadi baris baru. */
export function parseAss(text) {
  const cues = [];
  for (const raw of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!/^Dialogue:/i.test(line)) continue;
    const body = line.slice(line.indexOf(':') + 1);
    // 9 koma pertama memisahkan field, sisanya adalah teks.
    const fields = [];
    let rest = body;
    for (let i = 0; i < 9; i++) {
      const idx = rest.indexOf(',');
      if (idx < 0) { rest = ''; break; }
      fields.push(rest.slice(0, idx));
      rest = rest.slice(idx + 1);
    }
    if (fields.length < 9) continue;
    const start = parseTime(fields[1]);
    const end = parseTime(fields[2]);
    if (start == null || end == null) continue;
    const txt = rest
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\N/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\h/g, ' ')
      .trim();
    if (!txt) continue;
    cues.push({ start, end, text: txt });
  }
  return cues;
}

/* SBV: blok "H:MM:SS.mmm,H:MM:SS.mmm" lalu teks, dipisah baris kosong. */
export function parseSbv(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n');
  const blocks = src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const cues = [];
  for (const b of blocks) {
    const lines = b.split('\n');
    const m = /^(\S+),(\S+)$/.exec(lines[0].trim());
    if (!m) continue;
    const start = parseTime(m[1]);
    const end = parseTime(m[2]);
    if (start == null || end == null) continue;
    const txt = lines.slice(1).join('\n').trim();
    if (!txt) continue;
    cues.push({ start, end, text: txt });
  }
  return cues;
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}
function encodeEntities(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* TTML: elemen <p begin end> (end boleh diganti dur). Diparse dengan
   regex + decode entitas (bukan DOMParser) supaya hasilnya identik di
   browser dan di tes Node; elemen <p> tidak bersarang di subtitle TTML. */
export function parseTtml(text) {
  const cues = [];
  const src = String(text || '');
  const re = /<p\b([^>]*)>([\s\S]*?)<\/p\s*>/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const attrs = m[1];
    const beginM = /\bbegin\s*=\s*["']([^"']+)["']/.exec(attrs);
    if (!beginM) continue;
    const start = parseTime(beginM[1]);
    if (start == null) continue;
    let end = null;
    const endM = /\bend\s*=\s*["']([^"']+)["']/.exec(attrs);
    if (endM) end = parseTime(endM[1]);
    if (end == null) {
      const durM = /\bdur\s*=\s*["']([^"']+)["']/.exec(attrs);
      if (durM) {
        const d = parseTime(durM[1]);
        if (d != null) end = start + d;
      }
    }
    if (end == null || end <= start) continue;
    const txt = decodeEntities(m[2]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''))
      .replace(/[ \t]+/g, ' ')
      .split('\n').map((l) => l.trim()).join('\n').trim();
    if (!txt) continue;
    cues.push({ start, end, text: txt });
  }
  return cues;
}

export function detectSubtitleFormat(text) {
  const s = String(text || '');
  if (/^\s*WEBVTT/i.test(s)) return 'VTT';
  if (/\[Script Info\]|^\s*Dialogue:/im.test(s)) return 'ASS';
  if (/<tt\b/i.test(s)) return 'TTML';
  if (/^\d{1,2}:\d{2}:\d{2}[,.]\d{1,3},\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*$/m.test(s)) return 'SBV';
  return 'SRT';
}

export function parseSubtitles(text, format) {
  const fmt = format || detectSubtitleFormat(text);
  if (fmt === 'ASS') return parseAss(text);
  if (fmt === 'SBV') return parseSbv(text);
  if (fmt === 'TTML') return parseTtml(text);
  return parseSub(text);
}

// toSrt, toVtt kanonis tinggal di utils (core.js).
export function toSbv(cues) {
  return cues.map((c) => utils.fmtVtt(c.start) + ',' + utils.fmtVtt(c.end) + '\n' + c.text).join('\n\n') + '\n';
}
export function toAss(cues) {
  const head = '[Script Info]\nTitle: Adip Tools\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n' +
    '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    'Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n' +
    '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  const body = cues.map((c) =>
    'Dialogue: 0,' + fmtAss(c.start) + ',' + fmtAss(c.end) + ',Default,,0,0,0,,' +
    c.text.replace(/\r\n?/g, '\n').replace(/\n/g, '\\N')).join('\n');
  return head + body + '\n';
}
export function toTtml(cues) {
  const ps = cues.map((c) =>
    '    <p begin="' + utils.fmtVtt(c.start) + '" end="' + utils.fmtVtt(c.end) + '">' +
    encodeEntities(c.text).replace(/\n/g, '<br/>') + '</p>').join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="id">\n  <body>\n    <div>\n' +
    ps + '\n    </div>\n  </body>\n</tt>\n';
}

/* Teks polos dari baris subtitle: buang nomor + penanda waktu + kode
   tampilan. Baris yang sama berulang hanya diambil sekali. gabung=true
   jadi satu paragraf, false jadi satu baris per kalimat. */
export function bersihBarisTeks(b) {
  let s = String(b || '');
  s = s.replace(/\{[^}]*\}/g, '');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\\N/gi, ' ');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return s.replace(/\s+/g, ' ').trim();
}
export function toTeksPolos(cues, gabung) {
  const keluar = [];
  for (const c of cues || []) {
    const bersih = bersihBarisTeks(c.text);
    if (!bersih) continue;
    if (keluar.length && keluar[keluar.length - 1] === bersih) continue;
    keluar.push(bersih);
  }
  if (!keluar.length) return '';
  return gabung ? keluar.join(' ') : keluar.join('\n');
}

/* Tebak format dari isinya (dipakai mode teks polos langsung dari teks
   mentah). Murni, bisa diuji di Node. */
export function deteksiFormat(teks) {
  const s = String(teks || '');
  if (/^\s*WEBVTT/i.test(s)) return 'vtt';
  if (/\[Script Info\]|\[Events\]|Dialogue:/i.test(s)) return 'ass';
  if (/^\d+:\d{2}:\d{2}\.\d+,\d+:\d{2}:\d{2}\.\d+/m.test(s)) return 'sbv';
  if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(s)) return 'srt';
  return 'tidak dikenal';
}

// Ambil hanya teks dari subtitle mentah (tanpa lewat parser baris).
// Opsi gabung: true = satu paragraf utuh, false = satu baris per kalimat.
export function subtitleKeTeks(teks, gabung) {
  const src = String(teks || '').replace(/\r\n?/g, '\n');
  const format = deteksiFormat(src);
  const barisKeluar = [];
  const dorong = (b) => {
    const bersih = bersihBarisTeks(b);
    if (!bersih) return;
    if (barisKeluar.length && barisKeluar[barisKeluar.length - 1] === bersih) return;
    barisKeluar.push(bersih);
  };
  if (format === 'ass') {
    src.split('\n').forEach((baris) => {
      const m = /^Dialogue:\s*(.*)$/.exec(baris.trim());
      if (!m) return;
      const kolom = m[1].split(',');
      if (kolom.length >= 10) dorong(kolom.slice(9).join(','));
    });
  } else {
    src.split('\n').forEach((baris) => {
      const b = baris.trim();
      if (!b) return;
      if (/^WEBVTT/i.test(b)) return;
      if (/^\d+$/.test(b)) return;
      if (b.includes('-->')) return;
      if (/^\d{1,2}:\d{2}:\d{2}[,.]\d{1,3},\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}$/.test(b)) return;
      if (/^(NOTE|STYLE|REGION)([ :]|$)/i.test(b)) return;
      dorong(b);
    });
  }
  if (!barisKeluar.length) return '';
  return gabung ? barisKeluar.join(' ') : barisKeluar.join('\n');
}

export const SERIALIZERS = { SRT: utils.toSrt, VTT: utils.toVtt, SBV: toSbv, ASS: toAss, TTML: toTtml, TXT: (cues) => toTeksPolos(cues, false) };
export const EXTENSIONS = { SRT: '.srt', VTT: '.vtt', SBV: '.sbv', ASS: '.ass', TTML: '.ttml', TXT: '.txt' };

export function render(root) {
  const ta = T.ta(10, '1\n00:00:01,000 --> 00:00:04,000\nHalo, selamat datang.\n\n2\n00:00:05,500 --> 00:00:08,000\nIni baris kedua.');
  const fi = fileInput('.srt,.vtt,.ass,.ssa,.sbv,.ttml,.xml,.txt,text/plain');
  const targetSel = T.select([
    ['VTT', 'VTT (untuk web)'],
    ['SRT', 'SRT (paling umum)'],
    ['ASS', 'ASS (untuk pemutar dengan gaya teks)'],
    ['SBV', 'SBV (format YouTube)'],
    ['TTML', 'TTML (format XML untuk siaran)'],
    ['TXT', 'Teks polos (hanya kata-katanya)'],
  ], 'VTT');
  const gabungSel = T.select([['baris', 'Satu baris per kalimat'], ['paragraf', 'Gabung jadi satu paragraf']], 'baris');
  const gabungFld = T.field('Hasil teks polosnya mau seperti apa', gabungSel);
  gabungFld.style.display = 'none';
  const geserInp = T.input('text', '0', '0');
  geserInp.inputMode = 'decimal';
  const geserFld = T.field('Geser waktu (detik)', geserInp, 'Boleh desimal, boleh negatif. 0 berarti tidak digeser.');
  const box = T.out();
  const prevBox = T.out();
  let hasil = '', namaFile = 'subtitle.vtt';

  const aturTarget = () => {
    const teksPolos = targetSel.value === 'TXT';
    gabungFld.style.display = teksPolos ? '' : 'none';
    geserFld.style.display = teksPolos ? 'none' : '';
  };
  targetSel.addEventListener('change', aturTarget);

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '1\n00:00:01,000 --> 00:00:04,000\nHalo, selamat datang.\n\n2\n00:00:05,500 --> 00:00:08,000\nIni baris kedua.\n\n3\n00:00:09,000 --> 00:00:12,000\nBaris ketiga, dua baris teks\nmasih satu waktu tampil.';
    targetSel.value = 'VTT';
    aturTarget();
  });
  const contohAssBtn = T.btn('Isi contoh (ASS)', () => {
    ta.value = '[Script Info]\nTitle: Contoh\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Halo, selamat datang.\nDialogue: 0,0:00:05.50,0:00:08.00,Default,,0,0,0,,Ini baris kedua.';
    targetSel.value = 'SRT';
    aturTarget();
  });

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0] ? fi.files[0] : null;
    fi.value = '';
    if (!f) return;
    try {
      ta.value = await f.text();
      T.hide(box);
      T.hide(prevBox);
      T.toast('File dimuat: ' + f.name);
    } catch (e) {
      T.show(box, errBox('File tidak bisa dibaca. Coba file teks lain.'));
    }
  });

  const konversi = () => {
    const masuk = detectSubtitleFormat(ta.value);
    const cues = parseSubtitles(ta.value, masuk);
    if (!cues.length) {
      T.show(box, errBox('Tidak ada baris subtitle yang bisa dibaca. Pastikan isinya subtitle SRT, VTT, ASS, SBV, atau TTML dengan penanda waktu yang benar.'));
      T.hide(prevBox);
      hasil = '';
      return;
    }
    const target = targetSel.value;
    const teksPolos = target === 'TXT';
    const geser = teksPolos ? 0 : T.num(geserInp.value);
    const shiftMs = (isFinite(geser) ? geser : 0) * 1000;
    const shifted = cues.map((c) => ({
      start: Math.max(0, c.start + shiftMs),
      end: Math.max(0, c.end + shiftMs),
      text: c.text,
    })).filter((c) => c.end > c.start);
    if (!shifted.length) {
      T.show(box, errBox('Setelah digeser, tidak ada baris subtitle yang tersisa. Coba geser yang lebih kecil.'));
      T.hide(prevBox);
      hasil = '';
      return;
    }
    hasil = teksPolos
      ? toTeksPolos(shifted, gabungSel.value === 'paragraf')
      : SERIALIZERS[target](shifted);
    namaFile = 'subtitle' + EXTENSIONS[target];
    const note = (!teksPolos && masuk === target)
      ? '<p class="hint">Catatan: teks yang ditempel sudah berformat ' + masuk + ', jadi hasilnya hanya ditulis ulang dengan rapi.</p>' : '';
    const namaHasil = teksPolos ? 'Teks polos' : target;
    T.show(box,
      kv('Format masuk', masuk) +
      kv('Baris terbaca', cues.length + ' baris') +
      (teksPolos ? '' : kv('Geser waktu', (shiftMs >= 0 ? '+' : '') + (shiftMs / 1000) + ' detik')) +
      kv('Hasil', namaHasil) + note);
    box.appendChild(T.row(
      T.btn('Unduh ' + namaHasil, () => { if (hasil) T.dl(namaFile, hasil, 'text/plain;charset=utf-8'); }, true),
      T.copyBtn(() => hasil, 'Salin hasil')
    ));
    if (teksPolos) {
      const barisTeks = hasil.split('\n');
      const jumlahKata = hasil.split(/\s+/).filter(Boolean).length;
      T.show(prevBox, '<p class="hint" style="margin-bottom:6px">Pratinjau teks (' + T.fmt(barisTeks.length) + ' baris, ' + T.fmt(jumlahKata) + ' kata):</p>' +
        '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:300px;overflow:auto">' + T.esc(barisTeks.slice(0, 20).join('\n')) + (barisTeks.length > 20 ? '\n…' : '') + '</pre>');
    } else {
      const rows = shifted.slice(0, 8).map((c, i) =>
        '<tr><td style="padding:5px 8px;vertical-align:top;color:#a1a1aa">' + (i + 1) + '</td>' +
        '<td style="padding:5px 8px;vertical-align:top;white-space:nowrap;font-variant-numeric:tabular-nums">' + utils.fmtSrt(c.start) + ' → ' + utils.fmtSrt(c.end) + '</td>' +
        '<td style="padding:5px 8px;vertical-align:top">' + T.esc(c.text).replace(/\n/g, '<br>') + '</td></tr>').join('');
      T.show(prevBox, '<p class="hint" style="margin-bottom:6px">Pratinjau ' + Math.min(8, shifted.length) + ' baris pertama:</p>' +
        '<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse;line-height:1.5">' + rows + '</table></div>' +
        (shifted.length > 8 ? '<p class="hint">…dan ' + (shifted.length - 8) + ' baris lagi di file hasil.</p>' : ''));
    }
    T.toast('Selesai, ' + shifted.length + ' baris');
  };

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel isi file subtitle atau muat dari file, lalu pilih format tujuannya. Format masuk terdeteksi otomatis. Geser +2 artinya subtitle muncul 2 detik lebih lambat. Pilih "Teks polos" kalau hanya kata-katanya yang dibutuhkan.</p>'));
  root.appendChild(T.field('Isi subtitle', ta));
  root.appendChild(T.field('Atau muat dari file', fi, 'File .srt, .vtt, .ass, .sbv, atau .ttml.'));
  root.appendChild(T.row(contohBtn, contohAssBtn));
  root.appendChild(T.field('Format tujuan', targetSel));
  root.appendChild(gabungFld);
  root.appendChild(geserFld);
  root.appendChild(T.row(T.btn('Konversi', konversi, true)));
  root.appendChild(box);
  root.appendChild(prevBox);
}
