import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "watermark-video", "name": "Watermark Video", "cat": "converter", "icon": "💧", "desc": "Tempel logo atau gambar di sudut video.", "keywords": "video,watermark,logo,gambar,tanda,cap", "since": "6.17.0"};

// Posisi overlay ffmpeg (margin 16px dari tepi). Murni, bisa diuji di Node.
export function posisiOverlay(posisi) {
  switch (posisi) {
    case 'kanan-atas': return 'x=W-w-16:y=16';
    case 'kiri-bawah': return 'x=16:y=H-h-16';
    case 'kiri-atas': return 'x=16:y=16';
    case 'tengah': return 'x=(W-w)/2:y=(H-h)/2';
    default: return 'x=W-w-16:y=H-h-16';
  }
}

export function render(root) {
  const fileVideo = T.input('file');
  fileVideo.accept = 'video/*';
  const fileLogo = T.input('file');
  fileLogo.accept = 'image/png,image/jpeg,image/webp';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const posisiSel = T.select([
    ['kanan-bawah', 'Kanan bawah'],
    ['kanan-atas', 'Kanan atas'],
    ['kiri-bawah', 'Kiri bawah'],
    ['kiri-atas', 'Kiri atas'],
    ['tengah', 'Tengah'],
  ], 'kanan-bawah');
  const ukuranSel = T.select([
    ['0.1', 'Kecil (sepersepuluh lebar video)'],
    ['0.15', 'Sedang'],
    ['0.2', 'Besar (seperlima lebar video)'],
  ], '0.15');
  const opasitasSel = T.select([
    ['1', 'Jelas'],
    ['0.7', 'Agak samar'],
    ['0.4', 'Samar'],
  ], '0.7');

  let videoObj = null, logoObj = null, vw = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  fileVideo.addEventListener('change', () => {
    videoObj = fileVideo.files && fileVideo.files[0] ? fileVideo.files[0] : null;
    T.hide(outBox);
    if (!videoObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(videoObj);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      vw = v.videoWidth || 0;
      T.show(infoBox,
        kv('Video', T.esc(videoObj.name)) +
        kv('Durasi', v.duration ? v.duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar', v.videoWidth && v.videoHeight ? v.videoWidth + ' x ' + v.videoHeight : 'tidak terbaca'));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      vw = 0;
      T.show(infoBox, kv('Video', T.esc(videoObj.name)));
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
  fileLogo.addEventListener('change', () => {
    logoObj = fileLogo.files && fileLogo.files[0] ? fileLogo.files[0] : null;
    T.hide(outBox);
  });

  const goBtn = T.btn('Tempel watermark', async () => {
    if (busy) return;
    if (!videoObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!logoObj) { T.show(outBox, errBox('Pilih dulu gambar logonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const extV = (videoObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const extL = (logoObj.name.match(/\.(png|jpg|jpeg|webp)$/i) || ['.png'])[0].toLowerCase();
    const inName = 'input' + extV;
    const logoName = 'logo' + extL;
    const base = videoObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video dan logo ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(videoObj));
      await ffmpeg.writeFile(logoName, await fetchFile(logoObj));
      // Lebar logo mengikuti lebar video supaya proporsinya masuk akal.
      const lebarLogo = vw ? Math.max(32, Math.round(vw * parseFloat(ukuranSel.value))) : 160;
      const filter = '[1:v]format=rgba,colorchannelmixer=aa=' + opasitasSel.value + ',scale=' + lebarLogo + ':-1[wm];[0:v][wm]overlay=' + posisiOverlay(posisiSel.value) + '[v]';
      setStage('Menempel watermark… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage('Menempel watermark… ' + pct + '%', pct); };
      await runFFmpeg(ffmpeg, ['-i', inName, '-i', logoName, '-filter_complex', filter, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', 'output.mp4'], prog);
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, logoName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-watermark.mp4', blob, 'video/mp4');
      T.show(outBox, '<span class="ok">Selesai. Video dengan watermark terunduh.</span>' +
        kv('Logo', T.esc(logoObj.name)) +
        kv('Posisi', posisiSel.options[posisiSel.selectedIndex].textContent) +
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

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel logo atau gambar kecil di video supaya karyamu gampang dikenali. Gambar PNG dengan latar tembus pandang hasilnya paling rapi.</p>'));
  root.appendChild(T.field('Pilih video', fileVideo, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(T.field('Pilih gambar logo', fileLogo, 'PNG, JPG, atau WebP.'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Posisi logo', posisiSel), T.field('Ukuran logo', ukuranSel)));
  root.appendChild(T.field('Kejelasan logo', opasitasSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
