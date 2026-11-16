import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.13.0';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js?v=6.13.0';

export const meta = {"id": "video-ke-mp3", "name": "Video ke MP3", "cat": "converter", "icon": "🎵", "desc": "Ambil suara dari video jadi file MP3.", "keywords": "video,mp3,audio,ekstrak,musik,suara,lagu", "since": "6.11.0"};

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

  const brSel = T.select([['128', '128 kbps (hemat, cukup untuk suara)'], ['192', '192 kbps (seimbang)'], ['320', '320 kbps (kualitas paling baik)']], '192');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const goBtn = T.btn('Ubah jadi MP3', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      setStage('Mengambil suara… 0%', 0);
      await runFFmpeg(ffmpeg, ['-i', inName, '-vn', '-c:a', 'libmp3lame', '-b:a', brSel.value + 'k', 'output.mp3'], (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengambil suara… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp3');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp3']);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      T.dl(base + '.mp3', blob, 'audio/mpeg');
      const saved = fileObj.size - blob.size;
      T.show(outBox, '<span class="ok">Selesai. MP3 terunduh.</span>' +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : '-') +
        kv('Ukuran video', fmtBytes(fileObj.size)) +
        kv('Ukuran MP3', fmtBytes(blob.size)) +
        (saved > 0 ? kv('Lebih kecil', fmtBytes(saved)) : ''));
      T.toast('MP3 terunduh');
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
      const big = fileObj.size > 200 * 1024 * 1024;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)) +
        (big ? '<p class="dim" style="font-size:13px;margin:8px 0 0">File besar. Prosesnya bisa lama dan HP/browser bisa terasa berat.</p>' : ''));
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih video, lalu ambil suaranya saja jadi MP3. Gambarnya dibuang, suaranya tetap.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Kualitas suara', brSel, 'Angka lebih besar berarti suara lebih jernih dan file lebih besar.'));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
