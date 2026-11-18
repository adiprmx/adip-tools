import { h as T, kv, errBox } from '../../core.js';

export const meta = {"id": "konverter-subtitle-ass-sbv-ttml", "name": "Konverter Subtitle ASS/SBV/TTML", "cat": "teks", "icon": "📄", "desc": "Ubah subtitle antar format ASS, SBV, TTML, SRT, dan VTT.", "keywords": "subtitle,ass,sbv,ttml,srt,vtt,film,video,format", "since": "6.17.0"};

/* Konverter antar 5 format subtitle. Beda dari Konverter Subtitle (yang
   hanya SRT<->VTT + geser waktu): tool ini fokus ke format ASS, SBV,
   dan TTML. Geser waktu sengaja tidak dibangun lagi, sudah ada di
   tool lama. Semua parser/serializer fungsi murni, diuji di Node. */

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

export function fmtSrt(ms) {
  ms = Math.max(0, Math.round(ms));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
  const s = Math.floor(ms % 60000 / 1000), r = ms % 1000;
  const p = (n, l) => String(n).padStart(l, '0');
  return p(h, 2) + ':' + p(m, 2) + ':' + p(s, 2) + ',' + p(r, 3);
}
export function fmtVtt(ms) { return fmtSrt(ms).replace(',', '.'); }
export function fmtAss(ms) {
  ms = Math.max(0, Math.round(ms));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
  const s = Math.floor(ms % 60000 / 1000), cs = Math.floor((ms % 1000) / 10);
  const p = (n, l) => String(n).padStart(l, '0');
  return h + ':' + p(m, 2) + ':' + p(s, 2) + '.' + p(cs, 2);
}

function parseSrtVtt(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n');
  const blocks = src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const cues = [];
  for (const b of blocks) {
    if (/^WEBVTT/i.test(b) && !/-->/.test(b)) continue;
    const lines = b.split('\n').map((l) => l.trimEnd());
    const ti = lines.findIndex((l) => /-->/.test(l));
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
  return parseSrtVtt(text);
}

export function toSrt(cues) {
  return cues.map((c, i) => (i + 1) + '\n' + fmtSrt(c.start) + ' --> ' + fmtSrt(c.end) + '\n' + c.text).join('\n\n') + '\n';
}
export function toVtt(cues) {
  return 'WEBVTT\n\n' + cues.map((c) => fmtVtt(c.start) + ' --> ' + fmtVtt(c.end) + '\n' + c.text).join('\n\n') + '\n';
}
export function toSbv(cues) {
  return cues.map((c) => fmtVtt(c.start) + ',' + fmtVtt(c.end) + '\n' + c.text).join('\n\n') + '\n';
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
    '    <p begin="' + fmtVtt(c.start) + '" end="' + fmtVtt(c.end) + '">' +
    encodeEntities(c.text).replace(/\n/g, '<br/>') + '</p>').join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="id">\n  <body>\n    <div>\n' +
    ps + '\n    </div>\n  </body>\n</tt>\n';
}

export const SERIALIZERS = { SRT: toSrt, VTT: toVtt, SBV: toSbv, ASS: toAss, TTML: toTtml };
export const EXTENSIONS = { SRT: '.srt', VTT: '.vtt', SBV: '.sbv', ASS: '.ass', TTML: '.ttml' };

export function render(root) {
  const ta = T.ta(10, 'Tempel isi file subtitle di sini, atau muat dari file di bawah.');
  const file = T.input('file');
  file.accept = '.srt,.vtt,.ass,.sbv,.ttml,.xml,.txt';
  const targetSel = T.select([
    ['ASS', 'ASS (untuk pemutar dengan gaya teks)'],
    ['SBV', 'SBV (format YouTube)'],
    ['TTML', 'TTML (format XML untuk siaran)'],
    ['SRT', 'SRT (paling umum)'],
    ['VTT', 'VTT (untuk web)'],
  ], 'ASS');
  const box = T.out();
  const prevBox = T.out();
  let hasil = '', namaFile = 'subtitle.ass';

  const contohBtn = T.btn('Isi contoh (ASS)', () => {
    ta.value = '[Script Info]\nTitle: Contoh\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Halo, selamat datang.\nDialogue: 0,0:00:05.50,0:00:08.00,Default,,0,0,0,,Ini baris kedua.';
    targetSel.value = 'SRT';
  });

  file.addEventListener('change', async () => {
    const f = file.files && file.files[0] ? file.files[0] : null;
    file.value = '';
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
      T.show(box, errBox('Tidak ada baris subtitle yang bisa dibaca. Pastikan isinya subtitle ASS, SBV, TTML, SRT, atau VTT dengan penanda waktu yang benar.'));
      T.hide(prevBox);
      hasil = '';
      return;
    }
    const target = targetSel.value;
    hasil = SERIALIZERS[target](cues);
    namaFile = 'subtitle' + EXTENSIONS[target];
    const note = masuk === target
      ? '<p class="hint">Catatan: teks yang ditempel sudah berformat ' + masuk + ', jadi hasilnya hanya ditulis ulang dengan rapi.</p>' : '';
    T.show(box,
      kv('Format masuk', masuk) +
      kv('Baris terbaca', cues.length + ' baris') +
      kv('Hasil', target) + note);
    box.appendChild(T.row(
      T.btn('Unduh ' + target, () => { if (hasil) T.dl(namaFile, hasil, 'text/plain;charset=utf-8'); }, true),
      T.copyBtn(() => hasil, 'Salin hasil')
    ));
    const rows = cues.slice(0, 8).map((c, i) =>
      '<tr><td style="padding:5px 8px;vertical-align:top;color:#a1a1aa">' + (i + 1) + '</td>' +
      '<td style="padding:5px 8px;vertical-align:top;white-space:nowrap;font-variant-numeric:tabular-nums">' + fmtSrt(c.start) + ' → ' + fmtSrt(c.end) + '</td>' +
      '<td style="padding:5px 8px;vertical-align:top">' + T.esc(c.text).replace(/\n/g, '<br>') + '</td></tr>').join('');
    T.show(prevBox, '<p class="hint" style="margin-bottom:6px">Pratinjau ' + Math.min(8, cues.length) + ' baris pertama:</p>' +
      '<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse;line-height:1.5">' + rows + '</table></div>' +
      (cues.length > 8 ? '<p class="hint">…dan ' + (cues.length - 8) + ' baris lagi di file hasil.</p>' : ''));
    T.toast('Selesai, ' + cues.length + ' baris');
  };

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel isi file subtitle atau muat dari file, lalu pilih format tujuannya. Format masuk terdeteksi otomatis. Untuk menggeser waktu subtitle, pakai tool Konverter Subtitle.</p>'));
  root.appendChild(T.field('Isi subtitle', ta));
  root.appendChild(T.field('Atau muat dari file', file, 'File .ass, .sbv, .ttml, .srt, atau .vtt.'));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.field('Format tujuan', targetSel));
  root.appendChild(T.row(T.btn('Konversi', konversi, true)));
  root.appendChild(box);
  root.appendChild(prevBox);
}
