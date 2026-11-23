import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "video-ke-apng", "name": "Video ke APNG", "cat": "converter", "icon": "🎞️", "desc": "Ubah klip video jadi animasi APNG yang jernih.", "keywords": "video,apng,animasi,bergerak,png,stiker", "since": "6.19.0", "online": true};

// Susun argumen ffmpeg untuk APNG. Fungsi murni, diuji di Node.
export function bangunArgumenApng(inName, outName, start, dur, fps, width) {
  return ['-ss', String(start), '-t', String(dur), '-i', inName,
    '-vf', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos',
    '-c:v', 'apng', '-plays', '0', '-an', '-y', outName];
}

export function render(root) {
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
  const durIn = T.input('text', '1-10', '3'); durIn.inputMode = 'decimal';
  const wSel = T.select([['320', '320 px (kecil, ringan)'], ['480', '480 px (seimbang)'], ['640', '640 px (besar)']], '480');
  const fpsSel = T.select([['8', '8 gambar/detik (paling ringan)'], ['10', '10 gambar/detik'], ['12', '12 gambar/detik'], ['15', '15 gambar/detik (paling halus)']], '10');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const goBtn = T.btn('Buat APNG', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    let start = Math.max(0, utils.parseNum(startIn.value, 0));
    let dur = Math.min(10, Math.max(0.5, utils.parseNum(durIn.value, 3)));
    if (duration > 0) {
      if (start >= duration) { T.show(outBox, errBox('Detik mulai melewati durasi video (' + duration.toFixed(1) + ' detik).')); return; }
      dur = Math.min(dur, duration - start);
    }
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
      setStage('Membuat APNG… 0%', 10);
      await runFFmpeg(ffmpeg, bangunArgumenApng(inName, 'output.apng', start, dur, fpsSel.value, wSel.value), (p) => {
        const pct = 10 + Math.round(p * 90);
        setStage('Membuat APNG… ' + Math.round(p * 100) + '%', pct);
      });
      const data = await ffmpeg.readFile('output.apng');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.apng']);
      const blob = new Blob([data], { type: 'image/apng' });
      T.dl(base + '.apng', blob, 'image/apng');
      T.show(outBox, '<span class="ok">Selesai. APNG terunduh.</span>' +
        kv('Potongan', 'detik ' + start.toFixed(1) + ' sampai ' + (start + dur).toFixed(1) + ' (' + dur.toFixed(1) + ' detik)') +
        kv('Ukuran APNG', fmtBytes(blob.size)));
      T.toast('APNG terunduh');
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
      duration = isFinite(v.duration) ? v.duration : 0;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Potong sepotong video jadi gambar bergerak APNG. APNG warnanya lebih jernih dari GIF dan mendukung latar transparan. Maksimal 10 detik per klip supaya filenya tidak terlalu besar.</p>'));
  root.appendChild(T.field('Pilih file video', file, 'MP4, WebM, MOV, dan format video umum lainnya.'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Mulai dari detik ke', startIn), T.field('Durasi klip (detik)', durIn)));
  root.appendChild(T.grid2(T.field('Lebar gambar', wSel), T.field('Gambar per detik', fpsSel)));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videonya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
