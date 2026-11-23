import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "potong-video", "name": "Potong Video", "cat": "converter", "icon": "✂️", "desc": "Potong durasi video dan ubah bentuk layarnya.", "keywords": "video,potong,trim,crop,layar,rasio,pendek", "since": "6.11.0", "online": true};

export function render(root) {
  // Ekspresi crop FFmpeg. Koma di dalam min() WAJIB di-escape (\,) karena
  // koma adalah pemisah filter. trunc(/2)*2 menjaga lebar/tinggi genap
  // (syarat encoder H.264). Potongan diambil dari tengah layar.
  // Dua backslash di string JS sampai ke ffmpeg sebagai satu backslash —
  // bentuk yang benar, terverifikasi ffmpeg 8.1.2 (20 Nov 2026).
  const CROPS = {
    asli: null,
    '1:1': 'crop=trunc(min(iw\\,ih)/2)*2:trunc(min(iw\\,ih)/2)*2',
    '9:16': 'crop=trunc(min(iw\\,ih*9/16)/2)*2:trunc(min(ih\\,iw*16/9)/2)*2',
    '16:9': 'crop=trunc(min(iw\\,ih*16/9)/2)*2:trunc(min(ih\\,iw*9/16)/2)*2',
  };

  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#fff;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const startIn = T.input('text', '0', '0'); startIn.inputMode = 'decimal';
  const endIn = T.input('text', '', ''); endIn.inputMode = 'decimal';
  const cropSel = T.select([
    ['asli', 'Tetap seperti aslinya'],
    ['1:1', 'Kotak (1:1)'],
    ['9:16', 'Tegak (9:16, untuk Reels/Shorts/TikTok)'],
    ['16:9', 'Melebar (16:9, untuk YouTube)'],
  ], 'asli');
  const cropNote = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0"></p>');
  const refreshCropNote = () => {
    cropNote.textContent = cropSel.value === 'asli'
      ? 'Tanpa ubah layar, potongan disalin apa adanya: cepat dan kualitas sama persis. Titik potong mengikuti frame kunci terdekat, jadi awalnya bisa meleset sedikit.'
      : 'Layar dipotong dari tengah dan video diolah ulang. Titik potong jadi pas, tapi proses lebih lama.';
  };
  cropSel.addEventListener('change', refreshCropNote);
  refreshCropNote();

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // parseNum kanonis tinggal di utils (core.js).

  const goBtn = T.btn('Potong video', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    const start = Math.max(0, utils.parseNum(startIn.value, 0));
    let end = utils.parseNum(endIn.value, duration || 0);
    if (duration > 0) {
      end = Math.min(duration, end);
      if (end <= start) { T.show(outBox, errBox('Titik selesai harus setelah titik mulai (durasi video ' + duration.toFixed(1) + ' detik).')); return; }
    } else if (!(end > start)) {
      T.show(outBox, errBox('Isi titik selesai (detik), lebih besar dari titik mulai.')); return;
    }
    const crop = CROPS[cropSel.value];
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-ss', String(start), '-to', String(end), '-i', inName];
      if (crop) args.push('-vf', crop, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'copy');
      else args.push('-c', 'copy');
      args.push('-movflags', '+faststart', 'output.mp4');
      setStage('Memotong… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Memotong… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-potongan.mp4', blob, 'video/mp4');
      T.show(outBox, '<span class="ok">Selesai. Video terunduh.</span>' +
        kv('Potongan', 'detik ' + start.toFixed(1) + ' sampai ' + end.toFixed(1) + ' (' + (end - start).toFixed(1) + ' detik)') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Video terunduh');
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
    const v = document.createElement('video');
    const fDipilih = fileObj;
    v.preload = 'metadata';
    v.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(v);
      if (fileObj !== fDipilih) { URL.revokeObjectURL(url); return; }
      duration = d;
      if (duration > 0 && !endIn.value) endIn.value = duration.toFixed(2);
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Resolusi', v.videoWidth && v.videoHeight ? v.videoWidth + ' x ' + v.videoHeight : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca. Isi titik selesai secara manual.</p>');
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil sebagian video berdasarkan detik, dan bila perlu ubah bentuk layarnya jadi kotak, tegak, atau melebar.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Mulai (detik)', startIn), T.field('Selesai (detik)', endIn)));
  root.appendChild(T.field('Bentuk layar', cropSel));
  root.appendChild(cropNote);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
