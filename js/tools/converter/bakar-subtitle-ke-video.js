import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL, fetchFileLokal } from '../../ffmpeg-loader.js';

export const meta = {"id": "bakar-subtitle-ke-video", "name": "Bakar Subtitle ke Video", "cat": "converter", "icon": "🔤", "desc": "Tempel subtitle jadi teks permanen di dalam video.", "keywords": "subtitle,srt,vtt,teks,video,bakar,tempel", "since": "6.17.0", "online": true};

// Font DejaVu Sans (TTF, lisensi bebas) untuk huruf subtitle. Diunduh sekali
// dari internet saat proses berjalan, lalu ditulis ke memori mesin ffmpeg.
const FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';

export function render(root) {
  const fileVideo = T.input('file');
  fileVideo.accept = 'video/*';
  const fileSub = T.input('file');
  fileSub.accept = '.srt,.vtt,.ass,.ssa,text/plain';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const ukuranSel = T.select([
    ['kecil', 'Kecil'],
    ['sedang', 'Sedang'],
    ['besar', 'Besar'],
  ], 'sedang');
  const posisiSel = T.select([
    ['bawah', 'Bawah'],
    ['atas', 'Atas'],
  ], 'bawah');

  let videoObj = null, subObj = null, vh = 0, busy = false;
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
      vh = v.videoHeight || 0;
      T.show(infoBox,
        kv('Video', T.esc(videoObj.name)) +
        kv('Durasi', v.duration ? v.duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar', v.videoWidth && v.videoHeight ? v.videoWidth + ' x ' + v.videoHeight : 'tidak terbaca'));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      vh = 0;
      T.show(infoBox, kv('Video', T.esc(videoObj.name)));
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
  fileSub.addEventListener('change', () => {
    subObj = fileSub.files && fileSub.files[0] ? fileSub.files[0] : null;
    T.hide(outBox);
  });

  const goBtn = T.btn('Tempel subtitle ke video', async () => {
    if (busy) return;
    if (!videoObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!subObj) { T.show(outBox, errBox('Pilih dulu file subtitlenya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const extV = (videoObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const extS = (subObj.name.match(/\.(srt|vtt|ass|ssa)$/i) || ['.srt'])[0].toLowerCase();
    const inName = 'input' + extV;
    const subName = 'sub' + extS;
    const base = videoObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video dan subtitle ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(videoObj));
      await ffmpeg.writeFile(subName, await fetchFile(subObj));
      setStage('Mengunduh huruf untuk subtitle…', 0);
      let adaFont = false;
      try {
        await ffmpeg.writeFile('font.ttf', await fetchFileLokal(FONT_URL));
        adaFont = true;
      } catch (e) { /* lanjut tanpa font unduhan, mesin memakai huruf bawaannya */ }
      // Ukuran huruf mengikuti tinggi video supaya tetap terbaca.
      const faktor = ukuranSel.value === 'kecil' ? 0.03 : ukuranSel.value === 'besar' ? 0.06 : 0.045;
      const fontSize = Math.max(14, Math.round((vh || 720) * faktor));
      const alignment = posisiSel.value === 'atas' ? 8 : 2;
      const gaya = 'FontName=DejaVu Sans,FontSize=' + fontSize +
        ',PrimaryColour=&HFFFFFF&,OutlineColour=&H80000000&,BorderStyle=1,Outline=1,Shadow=0,Alignment=' + alignment;
      const filter = 'subtitles=' + subName + (adaFont ? ':fontsdir=/' : '') + ":force_style='" + gaya + "'";
      setStage('Menempel subtitle… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage('Menempel subtitle… ' + pct + '%', pct); };
      await runFFmpeg(ffmpeg, ['-i', inName, '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', 'output.mp4'], prog);
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, subName, 'font.ttf', 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-subtitle.mp4', blob, 'video/mp4');
      T.show(outBox, '<span class="ok">Selesai. Video dengan subtitle terunduh.</span>' +
        kv('Subtitle', T.esc(subObj.name)) +
        kv('Ukuran hasil', fmtBytes(blob.size)) +
        '<p class="hint" style="margin-top:8px">Subtitle sudah menyatu dengan gambarnya, jadi tidak bisa dihilangkan lagi.</p>');
      T.toast('Video terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else {
        T.show(outBox, errBox(/subtitle|sub/i.test(friendlyError(e)) ? 'Subtitle tidak bisa ditempel. File subtitlenya mungkin rusak atau formatnya tidak didukung. Coba file SRT lain.' : friendlyError(e)));
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Subtitle SRT atau VTT ditempel permanen ke dalam gambar video, jadi tetap tampil di pemutar mana pun tanpa file subtitle terpisah.</p>'));
  root.appendChild(T.field('Pilih video', fileVideo, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(T.field('Pilih file subtitle', fileSub, 'SRT, VTT, atau ASS.'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Ukuran huruf', ukuranSel), T.field('Posisi subtitle', posisiSel)));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
