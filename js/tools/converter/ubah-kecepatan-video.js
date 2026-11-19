import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "ubah-kecepatan-video", "name": "Ubah Kecepatan Video", "cat": "converter", "icon": "⏩", "desc": "Percepat atau perlambat video, suaranya ikut menyesuaikan.", "keywords": "video,kecepatan,cepat,lambat,tempo", "since": "6.16.0"};

export function render(root) {
  const SPEEDS = [
    ['0.5', 'Setengah kecepatan (0,5x, lebih lambat)'],
    ['0.75', 'Sedikit lebih lambat (0,75x)'],
    ['1.25', 'Sedikit lebih cepat (1,25x)'],
    ['1.5', 'Satu setengah kali (1,5x)'],
    ['2', 'Dua kali lipat (2x)'],
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

  const speedSel = T.select(SPEEDS, '1.5');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const goBtn = T.btn('Ubah kecepatan', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const speed = parseFloat(speedSel.value);
    // Gambar: setpts mempercepat/memperlama tiap frame. Suara: atempo
    // mengubah tempo tanpa mengubah nada (rentang atempo 0,5 sampai 2,
    // pas dengan pilihan di atas). fps_mode passthrough WAJIB: tanpa
    // itu ffmpeg membuang setengah frame saat dipercepat (terbukti di
    // uji CLI: 45 frame jadi 24, durasi 1,6 dtk bukan 1,5).
    const vfactor = (1 / speed).toFixed(4).replace(/\.?0+$/, '');
    // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'video').
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
      const withAudio = ['-i', inName, '-filter:v', 'setpts=' + vfactor + '*PTS', '-filter:a', 'atempo=' + speed, '-fps_mode', 'passthrough', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'output.mp4'];
      const videoOnly = ['-i', inName, '-filter:v', 'setpts=' + vfactor + '*PTS', '-fps_mode', 'passthrough', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-an', '-movflags', '+faststart', 'output.mp4'];
      setStage('Mengubah kecepatan… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage('Mengubah kecepatan… ' + pct + '%', pct); };
      try {
        await runFFmpeg(ffmpeg, withAudio, prog);
      } catch (e) {
        // Video tanpa suara membuat atempo gagal. Coba lagi tanpa suara
        // daripada gagal total.
        if (isCancelled(e)) throw e;
        await cleanupFFmpeg(ffmpeg, ['output.mp4']);
        setStage('Video ini tidak bersuara, melanjutkan tanpa suara… 0%', 0);
        await runFFmpeg(ffmpeg, videoOnly, prog);
      }
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-' + speedSel.value.replace('.', 'p') + 'x.mp4', blob, 'video/mp4');
      // Durasi hasil DIUKUR dari file jadi, bukan dihitung dari rumus,
      // karena pembulatan frame bisa menggeser sedikit.
      const outDur = await utils.measureDur(blob, 'video');
      const newDur = outDur || (duration ? duration / speed : 0);
      T.show(outBox, '<span class="ok">Selesai. Video terunduh.</span>' +
        kv('Kecepatan', speedSel.value.replace('.', ',') + 'x') +
        kv('Durasi baru', newDur ? newDur.toFixed(1) + ' detik' : '-') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Video terunduh');
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
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      duration = v.duration || 0;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar', v.videoWidth && v.videoHeight ? v.videoWidth + ' x ' + v.videoHeight : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Percepat video yang terlalu lama, atau perlambat bagian yang ingin dilihat detailnya. Suaranya ikut menyesuaikan dan nadanya tetap sama.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Kecepatan baru', speedSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
