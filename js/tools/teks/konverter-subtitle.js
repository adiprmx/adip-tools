import { h as T, kv, errBox, utils } from '../../core.js';

export const meta = {"id":"konverter-subtitle","name":"Konverter Subtitle","cat":"teks","icon":"💬","desc":"Ubah subtitle SRT ke VTT atau sebaliknya, plus geser waktunya.","keywords":"subtitle,srt,vtt,film,video,waktu","since":"6.11.0"};

/* Subtitle SRT <-> VTT + geser waktu (detik, boleh desimal, boleh negatif).
   Parser toleran: nomor urut boleh hilang, pemisah desimal koma/titik. */
export function parseTime(s) {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})$/.exec(String(s || '').trim());
  if (!m) return null;
  const ms = (+m[4] + '000').slice(0, 3);
  return ((+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3])) * 1000 + (+ms);
}
// fmtSrt, fmtVtt kanonis tinggal di utils (core.js).
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
// toSrt, toVtt kanonis tinggal di utils (core.js).
const detectFmt = (text) => /^\s*WEBVTT/i.test(String(text || '')) ? 'VTT' : 'SRT';

export function render(root) {
  const ta = T.ta(10, '1\n00:00:01,000 --> 00:00:04,000\nHalo, selamat datang.\n\n2\n00:00:05,500 --> 00:00:08,000\nIni baris kedua.');
  const arahSel = T.select([['srt-vtt', 'SRT ke VTT'], ['vtt-srt', 'VTT ke SRT']], 'srt-vtt');
  const geserInp = T.input('text', '0', '0');
  geserInp.inputMode = 'decimal';
  const box = T.out();
  const prevBox = T.out();
  let hasil = '', namaFile = 'subtitle.vtt';

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '1\n00:00:01,000 --> 00:00:04,000\nHalo, selamat datang.\n\n2\n00:00:05,500 --> 00:00:08,000\nIni baris kedua.\n\n3\n00:00:09,000 --> 00:00:12,000\nBaris ketiga, dua baris teks\nmasih satu waktu tampil.';
  });

  const konversi = () => {
    const cues = parseSub(ta.value);
    if (!cues.length) {
      T.show(box, errBox('Tidak ada baris subtitle yang bisa dibaca. Pastikan formatnya SRT atau VTT dengan penanda waktu seperti 00:00:01,000 --> 00:00:04,000.'));
      T.hide(prevBox);
      hasil = '';
      return;
    }
    const geser = T.num(geserInp.value);
    const shiftMs = (isFinite(geser) ? geser : 0) * 1000;
    const shifted = cues.map((c) => ({
      start: Math.max(0, c.start + shiftMs),
      end: Math.max(0, c.end + shiftMs),
      text: c.text,
    })).filter((c) => c.end > c.start);
    const keVtt = arahSel.value === 'srt-vtt';
    hasil = keVtt ? utils.toVtt(shifted) : utils.toSrt(shifted);
    namaFile = keVtt ? 'subtitle.vtt' : 'subtitle.srt';
    const masuk = detectFmt(ta.value);
    const note = (keVtt && masuk === 'VTT') || (!keVtt && masuk === 'SRT')
      ? '<p class="hint">Catatan: teks yang ditempel sudah berformat ' + masuk + ', jadi hanya waktunya yang digeser.</p>' : '';
    T.show(box,
      kv('Baris terbaca', cues.length + ' baris') +
      kv('Geser waktu', (shiftMs >= 0 ? '+' : '') + (shiftMs / 1000) + ' detik') +
      kv('Hasil', keVtt ? 'VTT' : 'SRT') + note);
    box.appendChild(T.row(
      T.btn('Unduh ' + (keVtt ? 'VTT' : 'SRT'), () => { if (hasil) T.dl(namaFile, hasil, 'text/plain;charset=utf-8'); }, true),
      T.copyBtn(() => hasil, 'Salin hasil')
    ));
    const rows = shifted.slice(0, 8).map((c, i) =>
      '<tr><td style="padding:5px 8px;vertical-align:top;color:#a1a1aa">' + (i + 1) + '</td>' +
      '<td style="padding:5px 8px;vertical-align:top;white-space:nowrap;font-variant-numeric:tabular-nums">' + utils.fmtSrt(c.start) + ' → ' + utils.fmtSrt(c.end) + '</td>' +
      '<td style="padding:5px 8px;vertical-align:top">' + T.esc(c.text).replace(/\n/g, '<br>') + '</td></tr>').join('');
    T.show(prevBox, '<p class="hint" style="margin-bottom:6px">Pratinjau ' + Math.min(8, shifted.length) + ' baris pertama:</p>' +
      '<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse;line-height:1.5">' + rows + '</table></div>' +
      (shifted.length > 8 ? '<p class="hint">…dan ' + (shifted.length - 8) + ' baris lagi di file hasil.</p>' : ''));
    T.toast('Selesai, ' + shifted.length + ' baris');
  };

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel isi file subtitle, pilih arah konversi, dan geser waktunya bila subtitle tidak pas dengan video. Geser +2 artinya subtitle muncul 2 detik lebih lambat.</p>'));
  root.appendChild(T.field('Isi subtitle', ta));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.grid2(T.field('Arah konversi', arahSel), T.field('Geser waktu (detik)', geserInp, 'Boleh desimal, boleh negatif. 0 berarti tidak digeser.')));
  root.appendChild(T.row(T.btn('Konversi', konversi, true)));
  root.appendChild(box);
  root.appendChild(prevBox);
}
