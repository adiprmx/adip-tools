import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "konverter-video", "name": "Konverter Video", "cat": "converter", "icon": "🎬", "desc": "Ubah video ke MP4, WebM, MKV, MOV, atau AVI.", "keywords": "video,konversi,mp4,webm,mkv,mov,avi,format", "since": "6.16.0", "online": true};

export function render(root) {
  // Per format: encoder gambar + suara yang didukung mesin di browser.
  // Kualitas: angka crf/q lebih kecil berarti gambar lebih tajam dan
  // file lebih besar. AVI memakai mpeg4 (q) karena H.264 tidak lazim
  // di wadah AVI.
  const FORMATS = {
    mp4: { label: 'MP4', ext: '.mp4', mime: 'video/mp4', v: 'libx264', a: 'aac', ab: '128k', q: { hemat: '28', bagus: '23', terbaik: '18' }, faststart: true },
    webm: { label: 'WebM', ext: '.webm', mime: 'video/webm', v: 'libvpx', a: 'libopus', ab: '128k', q: { hemat: '35', bagus: '30', terbaik: '20' }, faststart: false },
    mkv: { label: 'MKV', ext: '.mkv', mime: 'video/x-matroska', v: 'libx264', a: 'aac', ab: '128k', q: { hemat: '28', bagus: '23', terbaik: '18' }, faststart: false },
    mov: { label: 'MOV', ext: '.mov', mime: 'video/quicktime', v: 'libx264', a: 'aac', ab: '128k', q: { hemat: '28', bagus: '23', terbaik: '18' }, faststart: true },
    avi: { label: 'AVI', ext: '.avi', mime: 'video/x-msvideo', v: 'mpeg4', a: 'libmp3lame', ab: '192k', q: { hemat: '8', bagus: '5', terbaik: '2' }, faststart: false },
  };

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

  const fmtSel = T.select(Object.keys(FORMATS).map((k) => [k, FORMATS[k].label]), 'mp4');
  const qSel = T.select([
    ['bagus', 'Bagus (ukuran sedang)'],
    ['terbaik', 'Paling bagus (ukuran besar)'],
    ['hemat', 'Hemat (ukuran kecil)'],
  ], 'bagus');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // Durasi hasil DIUKUR dari file jadi. Bila browser tidak bisa membaca
  // formatnya (mis. AVI), pakai durasi file awal sebagai cadangan.
  // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'video').

  const goBtn = T.btn('Ubah format', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const f = FORMATS[fmtSel.value];
    const q = f.q[qSel.value];
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    const outName = 'output' + f.ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-i', inName, '-c:v', f.v];
      if (f.v === 'libx264') args.push('-preset', 'veryfast', '-crf', q);
      else if (f.v === 'libvpx') args.push('-crf', q, '-b:v', '0');
      else args.push('-q:v', q);
      args.push('-c:a', f.a, '-b:a', f.ab);
      if (f.faststart) args.push('-movflags', '+faststart');
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
      const outDur = await utils.measureDur(blob, 'video');
      T.show(outBox, '<span class="ok">Selesai. Video ' + f.label + ' terunduh.</span>' +
        kv('Durasi', (outDur || duration) ? (outDur || duration).toFixed(1) + ' detik' : '-') +
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
    const v = document.createElement('video');
    const fDipilih = fileObj;
    v.preload = 'metadata';
    v.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(v);
      if (fileObj !== fDipilih) { URL.revokeObjectURL(url); return; }
      duration = d;
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah video ke format lain. MP4 paling mudah dibuka di mana-mana. WebM cocok untuk web. MKV dan MOV menyimpan kualitas yang sama baiknya, AVI untuk perangkat lama.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, AVI, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Format tujuan', fmtSel), T.field('Kualitas gambar', qSel, 'Kualitas lebih bagus berarti file lebih besar.')));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
