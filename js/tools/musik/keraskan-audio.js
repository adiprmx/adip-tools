import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "keraskan-audio", "name": "Keraskan Audio", "cat": "musik", "icon": "🔊", "desc": "Buat suara audio lebih keras atau samakan kerasnya.", "keywords": "audio,keras,volume,normalisasi,suara", "since": "6.16.0", "online": true};

export function render(root) {
  // Naikkan volume: filter volume dengan satuan dB. Samakan: loudnorm
  // sekali jalan (pendekatan, bukan dua tahap) ke target -16 LUFS,
  // patokan umum podcast dan rekaman suara.
  const MODES = {
    naik6: { label: 'Sedikit lebih keras', af: 'volume=6dB' },
    naik12: { label: 'Jauh lebih keras', af: 'volume=12dB' },
    samakan: { label: 'Samakan kerasnya (normalisasi)', af: 'loudnorm=I=-16:TP=-1.5:LRA=11' },
  };

  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const modeSel = T.select(Object.keys(MODES).map((k) => [k, MODES[k].label]), 'naik6');
  const modeNote = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0"></p>');
  const refreshNote = () => {
    modeNote.textContent = modeSel.value === 'samakan'
      ? 'Kerasnya dibuat seragam mengikuti patokan umum, jadi bagian pelan ikut terangkat dan bagian keras ditahan. Cocok untuk rekaman suara atau podcast.'
      : 'Suaranya dinaikkan merata. Bila hasil akhirnya pecah atau kasar, coba pilihan yang lebih ringan.';
  };
  modeSel.addEventListener('change', refreshNote);
  refreshNote();

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // Durasi hasil DIUKUR dari file jadi, bukan disalin dari file awal.
  // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'audio').

  const goBtn = T.btn('Keraskan audio', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const mode = MODES[modeSel.value];
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin audio ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-i', inName, '-vn', '-af', mode.af, '-c:a', 'libmp3lame', '-b:a', '192k', 'output.mp3'];
      setStage('Mengeraskan… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengeraskan… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp3');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp3']);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      T.dl(base + '-keras.mp3', blob, 'audio/mpeg');
      const outDur = await utils.measureDur(blob, 'audio');
      T.show(outBox, '<span class="ok">Selesai. Audio terunduh.</span>' +
        kv('Perubahan', mode.label) +
        kv('Durasi', (outDur || duration) ? (outDur || duration).toFixed(1) + ' detik' : '-') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Audio terunduh');
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
    const fDipilih = fileObj;
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Betulkan rekaman yang suaranya terlalu pelan, atau samakan kerasnya supaya nyaman didengar dari awal sampai akhir.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Keraskan bagaimana', modeSel));
  root.appendChild(modeNote);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
