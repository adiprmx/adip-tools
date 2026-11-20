import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "bagi-video", "name": "Bagi Video", "cat": "converter", "icon": "✂️", "desc": "Bagi video panjang jadi beberapa bagian per durasi.", "keywords": "video,bagi,potong,bagian,durasi,split", "since": "6.17.0"};

// Batas jumlah segmen: tanpa cap, durasi Infinity (atau video sangat
// panjang) membuat loop di bawah jalan selamanya dan tab hang.
export const MAKS_SEGMEN = 999;

// Rencana segmen murni: daftar {mulai, durasi} detik. Bisa diuji di Node.
export function rencanaSegmen(durasi, perSegmen) {
  const out = [];
  if (!Number.isFinite(durasi) || durasi <= 0) return out;
  const step = Math.max(1, perSegmen || 30);
  for (let mulai = 0; mulai < durasi && out.length < MAKS_SEGMEN; mulai += step) {
    out.push({ mulai: Math.round(mulai * 100) / 100, durasi: Math.round(Math.min(step, durasi - mulai) * 100) / 100 });
  }
  return out;
}

export function render(root) {
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

  const durSel = T.select([
    ['15', 'Tiap 15 detik'],
    ['30', 'Tiap 30 detik'],
    ['60', 'Tiap 1 menit'],
    ['120', 'Tiap 2 menit'],
    ['300', 'Tiap 5 menit'],
  ], '60');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const refreshInfo = () => {
    if (!fileObj) { T.hide(infoBox); return; }
    const rencana = duration ? rencanaSegmen(duration, Number(durSel.value)) : [];
    const terpotong = duration > 0 && Math.ceil(duration / Number(durSel.value)) > MAKS_SEGMEN;
    T.show(infoBox,
      kv('File', T.esc(fileObj.name)) +
      kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
      kv('Ukuran', fmtBytes(fileObj.size)) +
      (rencana.length ? kv('Jadi bagian', rencana.length + ' bagian') : '') +
      (terpotong ? '<p class="hint" style="margin-top:8px">Video ini sangat panjang, jadi hanya ' + MAKS_SEGMEN + ' bagian pertama yang dibuat.</p>' : ''));
  };
  durSel.addEventListener('change', refreshInfo);

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
      URL.revokeObjectURL(url);
      refreshInfo();
    };
    v.onerror = () => {
      duration = 0;
      URL.revokeObjectURL(url);
      refreshInfo();
    };
    v.src = url;
  });

  const goBtn = T.btn('Bagi video', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!duration) { T.show(outBox, errBox('Durasi video tidak terbaca, jadi tidak bisa dibagi per durasi. Coba file MP4 atau WebM lain.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    const rencana = rencanaSegmen(duration, Number(durSel.value));
    if (rencana.length < 2) { T.show(outBox, errBox('Video ini lebih pendek dari durasi tiap bagian. Pilih durasi tiap bagian yang lebih kecil.')); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    let selesai = 0;
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      for (let i = 0; i < rencana.length; i++) {
        const seg = rencana[i];
        const outName = 'bagian' + i + '.mp4';
        const denganSuara = ['-ss', String(seg.mulai), '-t', String(seg.durasi), '-i', inName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName];
        const tanpaSuara = ['-ss', String(seg.mulai), '-t', String(seg.durasi), '-i', inName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-an', '-movflags', '+faststart', outName];
        const prog = (p) => {
          const pct = Math.round(((i + p) / rencana.length) * 100);
          setStage('Memotong bagian ' + (i + 1) + ' dari ' + rencana.length + '… ' + pct + '%', pct);
        };
        setStage('Memotong bagian ' + (i + 1) + ' dari ' + rencana.length + '…', Math.round((i / rencana.length) * 100));
        try {
          await runFFmpeg(ffmpeg, denganSuara, prog);
        } catch (e) {
          if (isCancelled(e)) throw e;
          await cleanupFFmpeg(ffmpeg, [outName]);
          await runFFmpeg(ffmpeg, tanpaSuara, prog);
        }
        const data = await ffmpeg.readFile(outName);
        await cleanupFFmpeg(ffmpeg, [outName]);
        const blob = new Blob([data], { type: 'video/mp4' });
        T.dl(base + '-bagian' + String(i + 1).padStart(2, '0') + '.mp4', blob, 'video/mp4');
        selesai++;
        await new Promise((r) => setTimeout(r, 400));
      }
      await cleanupFFmpeg(ffmpeg, [inName]);
      T.show(outBox, '<span class="ok">Selesai. ' + selesai + ' bagian terunduh.</span>' +
        kv('Bagian', selesai + ' bagian') +
        kv('Durasi tiap bagian', 'sekitar ' + durSel.value + ' detik') +
        '<p class="hint" style="margin-top:8px">Kalau browser bertanya soal unduhan ganda, izinkan supaya semua bagian terunduh.</p>');
      T.toast(selesai + ' bagian terunduh');
    } catch (e) {
      if (isCancelled(e)) {
        T.show(outBox, '<span class="dim">Dibatalkan. ' + selesai + ' bagian sempat terunduh.</span>');
      } else {
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Video panjang dipotong jadi beberapa bagian dengan durasi yang sama, cocok untuk dibagikan per bagian. Tiap bagian terunduh sebagai file sendiri.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Durasi tiap bagian', durSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
