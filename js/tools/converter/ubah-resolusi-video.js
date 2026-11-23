import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "ubah-resolusi-video", "name": "Ubah Resolusi Video", "cat": "converter", "icon": "📐", "desc": "Ubah ukuran layar video, bentuknya tetap tidak ketarik.", "keywords": "video,resolusi,ukuran,layar,720p,1080p,kecil", "since": "6.16.0", "online": true};

export function render(root) {
  const SIZES = [
    ['240', '240p (paling kecil, untuk hemat kuota)'],
    ['360', '360p (kecil)'],
    ['480', '480p (sedang)'],
    ['720', '720p (HD)'],
    ['1080', '1080p (Full HD)'],
  ];

  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const sizeSel = T.select(SIZES, '720');

  let fileObj = null, duration = 0, srcW = 0, srcH = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // Durasi hasil DIUKUR dari file jadi, bukan disalin dari file awal.
  // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'video').

  const goBtn = T.btn('Ubah ukuran', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const targetH = parseInt(sizeSel.value, 10);
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
      // scale=-2:H: lebar menyesuaikan otomatis supaya bentuk layar
      // tetap, dan lebar selalu genap (syarat H.264). Suara disalin
      // apa adanya.
      const args = ['-i', inName, '-vf', 'scale=-2:' + targetH, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', 'output.mp4'];
      setStage('Mengubah ukuran… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengubah ukuran… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-' + targetH + 'p.mp4', blob, 'video/mp4');
      const outDur = await utils.measureDur(blob, 'video');
      const outW = srcW && srcH ? Math.round(srcW * targetH / srcH / 2) * 2 : 0;
      T.show(outBox, '<span class="ok">Selesai. Video terunduh.</span>' +
        kv('Ukuran baru', outW ? outW + ' x ' + targetH : targetH + 'p') +
        kv('Durasi', (outDur || duration) ? (outDur || duration).toFixed(1) + ' detik' : '-') +
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
      srcW = v.videoWidth || 0;
      srcH = v.videoHeight || 0;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar sekarang', srcW && srcH ? srcW + ' x ' + srcH : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0; srcW = 0; srcH = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Perkecil video supaya filenya lebih ringan, atau perbesar untuk layar yang lebih besar. Bentuk layarnya tetap, tidak ketarik. Memperbesar video kecil tidak menambah ketajamannya.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Ukuran layar tujuan', sizeSel, 'Yang dipilih adalah tingginya. Lebarnya menyesuaikan otomatis.'));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
