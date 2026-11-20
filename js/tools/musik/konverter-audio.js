import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "konverter-audio", "name": "Konverter Audio", "cat": "musik", "icon": "🔄", "desc": "Ubah audio antar MP3, WAV, FLAC, OGG, M4A, OPUS, dan AAC, dengan pilihan kualitas suara, sample rate, dan kanal mono/stereo.", "keywords": "audio,konversi,mp3,wav,flac,ogg,m4a,aac,opus,format,bitrate,mono,stereo,lanjutan", "since": "6.11.0"};

/* Daftar format tujuan (diserap dari konverter-audio-lanjutan, v6.21.0:
   OPUS + AAC + catatan per format). Encoder tersedia di core ffmpeg.wasm
   (lihat ffmpeg-loader.js): libmp3lame, libvorbis, libopus, aac, flac,
   pcm_s16le. */
export const FORMATS = {
  mp3: { label: 'MP3', ext: '.mp3', mime: 'audio/mpeg', codec: 'libmp3lame', lossy: true, note: 'Paling umum, diputar di mana saja.' },
  wav: { label: 'WAV', ext: '.wav', mime: 'audio/wav', codec: 'pcm_s16le', lossy: false, note: 'Suara utuh tanpa dipadatkan, file besar.' },
  flac: { label: 'FLAC', ext: '.flac', mime: 'audio/flac', codec: 'flac', lossy: false, note: 'Suara utuh tapi file lebih kecil dari WAV.' },
  ogg: { label: 'OGG', ext: '.ogg', mime: 'audio/ogg', codec: 'libvorbis', lossy: true, note: 'Alternatif MP3 yang terbuka.' },
  m4a: { label: 'M4A (AAC)', ext: '.m4a', mime: 'audio/mp4', codec: 'aac', lossy: true, note: 'Format Apple, suara bagus di ukuran kecil.' },
  opus: { label: 'OPUS', ext: '.opus', mime: 'audio/ogg', codec: 'libopus', lossy: true, note: 'Suara jernih walau filenya kecil, cocok untuk dikirim lewat chat.' },
  aac: { label: 'AAC', ext: '.aac', mime: 'audio/aac', codec: 'aac', lossy: true, note: 'Suara AAC mentah, tanpa wadah M4A.' },
};

/* Susun argumen ffmpeg dari pilihan. Fungsi murni, diuji di Node.
   Nama file input/output diganti pemanggil dengan nama sebenarnya. */
export function buildConvertArgs(formatKey, opts) {
  const f = FORMATS[formatKey];
  if (!f) throw new Error('Format tidak dikenal: ' + formatKey);
  const args = ['-i', 'input', '-vn', '-c:a', f.codec];
  if (f.lossy && opts.bitrate) args.push('-b:a', opts.bitrate + 'k');
  if (opts.sampleRate && opts.sampleRate !== 'asli') args.push('-ar', String(opts.sampleRate));
  if (opts.channels === 'mono') args.push('-ac', '1');
  else if (opts.channels === 'stereo') args.push('-ac', '2');
  args.push('output' + f.ext);
  return args;
}

export function render(root) {

  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#fff;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const fmtSel = T.select(Object.keys(FORMATS).map((k) => [k, FORMATS[k].label]), 'mp3');
  const fmtNote = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0"></p>');
  const brSel = T.select([['64', '64 kbps (kecil, suara seadanya)'], ['96', '96 kbps'], ['128', '128 kbps'], ['192', '192 kbps (disarankan)'], ['256', '256 kbps'], ['320', '320 kbps (paling jernih)']], '192');
  const srSel = T.select([['asli', 'Ikuti file asli'], ['22050', '22050 Hz (rekaman suara)'], ['32000', '32000 Hz'], ['44100', '44100 Hz (standar CD)'], ['48000', '48000 Hz (standar video)'], ['96000', '96000 Hz (kualitas studio)']], 'asli');
  const chSel = T.select([['asli', 'Ikuti file asli'], ['stereo', 'Stereo (dua kanal)'], ['mono', 'Mono (satu kanal, file lebih kecil)']], 'asli');
  const brField = T.field('Kualitas suara', brSel, 'Angka lebih besar berarti suara lebih jernih dan file lebih besar.');

  const refreshFormat = () => {
    const f = FORMATS[fmtSel.value];
    fmtNote.textContent = f.note;
    brField.hidden = !f.lossy;
  };
  fmtSel.addEventListener('change', refreshFormat);
  refreshFormat();

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const goBtn = T.btn('Ubah format', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const f = FORMATS[fmtSel.value];
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
    const inName = 'input' + ext;
    const outName = 'output' + f.ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin audio ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = buildConvertArgs(fmtSel.value, {
        bitrate: brSel.value,
        sampleRate: srSel.value,
        channels: chSel.value,
      });
      args[1] = inName;
      args[args.length - 1] = outName;
      setStage('Mengubah format… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengubah format… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile(outName);
      await cleanupFFmpeg(ffmpeg, [inName, outName]);
      const blob = new Blob([data], { type: f.mime });
      T.dl(base + f.ext, blob, f.mime);
      T.show(outBox, '<span class="ok">Selesai. File ' + f.label + ' terunduh.</span>' +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : '-') +
        kv('Kanal', chSel.value === 'mono' ? 'Mono' : chSel.value === 'stereo' ? 'Stereo' : 'Ikuti file asli') +
        kv('Ukuran awal', fmtBytes(fileObj.size)) +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast(f.label + ' terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else {
        T.show(outBox, errBox(friendlyError(e)));
        const retry = T.btn('Coba lagi', () => goBtn.click());
        outBox.appendChild(retry);
      }
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);
  const cancelBtn = T.btn('Batalkan', () => { cancelFFmpeg(); });
  cancelBtn.hidden = true;

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(fileObj);
    const a = document.createElement('audio');
    const fDipilih = fileObj;
    a.preload = 'metadata';
    a.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(a);
      if (fileObj !== fDipilih) { URL.revokeObjectURL(url); return; }
      duration = d;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah audio ke format lain, termasuk OPUS dan AAC. Atur kualitas suara, sample rate, dan kanal mono atau stereo. WAV dan FLAC menyimpan suara tanpa ada yang dibuang, jadi filenya lebih besar. Format lain memadatkan suara, jadi filenya lebih kecil.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Format tujuan', fmtSel));
  root.appendChild(fmtNote);
  root.appendChild(brField);
  root.appendChild(T.grid2(T.field('Sample rate', srSel, 'Biarkan mengikuti file asli bila ragu.'), T.field('Kanal suara', chSel, 'Mono cocok untuk rekaman suara atau podcast.')));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
