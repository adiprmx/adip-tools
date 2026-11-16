import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.13.0';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js?v=6.13.0';

export const meta = {"id": "konverter-audio", "name": "Konverter Audio", "cat": "musik", "icon": "🔄", "desc": "Ubah audio antar MP3, WAV, FLAC, OGG, dan M4A.", "keywords": "audio,konversi,mp3,wav,flac,ogg,m4a,aac,format", "since": "6.11.0"};

export function render(root) {
  const FORMATS = {
    mp3: { label: 'MP3', ext: '.mp3', mime: 'audio/mpeg', codec: 'libmp3lame', lossy: true },
    wav: { label: 'WAV', ext: '.wav', mime: 'audio/wav', codec: 'pcm_s16le', lossy: false },
    flac: { label: 'FLAC', ext: '.flac', mime: 'audio/flac', codec: 'flac', lossy: false },
    ogg: { label: 'OGG', ext: '.ogg', mime: 'audio/ogg', codec: 'libvorbis', lossy: true },
    m4a: { label: 'M4A (AAC)', ext: '.m4a', mime: 'audio/mp4', codec: 'aac', lossy: true },
  };

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
  const brSel = T.select([['128', '128 kbps'], ['192', '192 kbps'], ['256', '256 kbps'], ['320', '320 kbps']], '192');
  const srSel = T.select([['asli', 'Ikuti file asli'], ['44100', '44100 Hz (standar CD)'], ['48000', '48000 Hz (standar video)']], 'asli');
  const brField = T.field('Kualitas suara', brSel, 'Angka lebih besar berarti suara lebih jernih dan file lebih besar.');

  const refreshFormat = () => {
    const f = FORMATS[fmtSel.value];
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
      const args = ['-i', inName, '-vn', '-c:a', f.codec];
      if (f.lossy) args.push('-b:a', brSel.value + 'k');
      if (srSel.value !== 'asli') args.push('-ar', srSel.value);
      args.push(outName);
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
        kv('Ukuran awal', fmtBytes(fileObj.size)) +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast(f.label + ' terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else T.show(outBox, errBox(friendlyError(e)));
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
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      duration = a.duration || 0;
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah audio ke format lain. WAV dan FLAC menyimpan suara tanpa ada yang dibuang, jadi filenya lebih besar. MP3, OGG, dan M4A memadatkan suara, jadi filenya lebih kecil.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Format tujuan', fmtSel), T.field('Sample rate', srSel, 'Biarkan mengikuti file asli bila ragu.')));
  root.appendChild(brField);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
