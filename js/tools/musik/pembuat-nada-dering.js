import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "pembuat-nada-dering", "name": "Pembuat Nada Dering", "cat": "musik", "icon": "📱", "desc": "Potong lagu jadi nada dering, dengan fade halus di awal dan akhir.", "keywords": "nada dering,ringtone,potong lagu,hp,iphone,android", "since": "6.17.0", "online": true};

/* Susun argumen ffmpeg untuk potongan nada dering. Fade (bila aktif)
   dipasang 1 detik di awal dan akhir potongan, atau seperempat panjang
   potongan bila potongannya pendek. Fungsi murni, diuji di Node. */
export function buildRingtoneArgs(opts) {
  const start = Math.max(0, opts.start || 0);
  const end = Math.max(start + 0.1, opts.end || 0);
  const seg = end - start;
  const args = ['-ss', String(start), '-to', String(end), '-i', 'input', '-vn'];
  if (opts.fade) {
    const fd = Math.min(1, seg / 4);
    args.push('-af', 'afade=t=in:st=0:d=' + fd + ',afade=t=out:st=' + Math.max(0, seg - fd) + ':d=' + fd);
  }
  if (opts.format === 'm4r') {
    args.push('-c:a', 'aac', '-b:a', '192k', '-f', 'ipod', 'output.m4r');
  } else {
    args.push('-c:a', 'libmp3lame', '-b:a', '192k', 'output.mp3');
  }
  return args;
}

export function render(root) {
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

  const startInp = T.input('number', '0', '0');
  startInp.min = '0';
  startInp.step = '0.1';
  const endInp = T.input('number', '30', '30');
  endInp.min = '0.1';
  endInp.step = '0.1';
  const fmtSel = T.select([
    ['mp3', 'MP3 (Android dan umum)'],
    ['m4r', 'M4R (iPhone)'],
  ], 'mp3');
  const fadeChk = document.createElement('input');
  fadeChk.type = 'checkbox';
  fadeChk.checked = true;
  fadeChk.id = 'ring-fade';
  const fadeLbl = T.el('<label for="ring-fade" style="font-size:13px;display:flex;gap:8px;align-items:center;cursor:pointer"></label>');
  fadeLbl.appendChild(fadeChk);
  fadeLbl.appendChild(T.el('<span>Haluskan awal dan akhir potongan (fade)</span>'));
  const m4rHint = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0" hidden>Untuk iPhone, potongan di bawah 40 detik umumnya bisa langsung dipakai sebagai nada dering.</p>');
  const refreshHint = () => { m4rHint.hidden = fmtSel.value !== 'm4r'; };
  fmtSel.addEventListener('change', refreshHint);
  refreshHint();

  let fileObj = null, duration = 0, busy = false;
  let previewAudio = null;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const readRange = () => {
    const start = T.num(startInp.value);
    const end = T.num(endInp.value);
    return { start: isFinite(start) ? start : NaN, end: isFinite(end) ? end : NaN };
  };

  const previewBtn = T.btn('Dengar potongan', () => {
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file lagunya.')); return; }
    const { start, end } = readRange();
    if (!isFinite(start) || !isFinite(end) || start < 0 || end <= start) {
      T.show(outBox, errBox('Isi awal dan akhir potongan dengan angka yang benar, akhir harus lebih besar dari awal.'));
      return;
    }
    if (duration > 0 && end > duration) {
      T.show(outBox, errBox('Akhir potongan melewati durasi lagu (' + duration.toFixed(1) + ' detik).'));
      return;
    }
    if (previewAudio) { try { previewAudio.pause(); } catch (e) {} }
    const url = URL.createObjectURL(fileObj);
    previewAudio = document.createElement('audio');
    previewAudio.src = url;
    const stopAt = () => {
      if (previewAudio && previewAudio.currentTime >= end) {
        previewAudio.pause();
        URL.revokeObjectURL(url);
        previewAudio = null;
      }
    };
    previewAudio.addEventListener('timeupdate', stopAt);
    previewAudio.addEventListener('ended', () => { URL.revokeObjectURL(url); previewAudio = null; });
    // currentTime baru boleh dipasang sesudah metadata termuat.
    previewAudio.addEventListener('loadedmetadata', () => {
      if (!previewAudio) return;
      try { previewAudio.currentTime = start; } catch (e) {}
      previewAudio.play().catch(() => {
        T.show(outBox, errBox('Pratinjau tidak bisa diputar di browser ini.'));
        URL.revokeObjectURL(url);
        previewAudio = null;
      });
    }, { once: true });
  });

  const goBtn = T.btn('Buat nada dering', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file lagunya.')); return; }
    const { start, end } = readRange();
    if (!isFinite(start) || !isFinite(end) || start < 0 || end <= start) {
      T.show(outBox, errBox('Isi awal dan akhir potongan dengan angka yang benar, akhir harus lebih besar dari awal.'));
      return;
    }
    if (duration > 0 && end > duration) {
      T.show(outBox, errBox('Akhir potongan melewati durasi lagu (' + duration.toFixed(1) + ' detik).'));
      return;
    }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const isM4r = fmtSel.value === 'm4r';
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
    const inName = 'input' + ext;
    const outName = isM4r ? 'output.m4r' : 'output.mp3';
    const mime = isM4r ? 'audio/mp4' : 'audio/mpeg';
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'lagu';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin lagu ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = buildRingtoneArgs({ start, end, fade: fadeChk.checked, format: fmtSel.value });
      args[5] = inName;
      args[args.length - 1] = outName;
      setStage('Memotong… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Memotong… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile(outName);
      await cleanupFFmpeg(ffmpeg, [inName, outName]);
      const blob = new Blob([data], { type: mime });
      T.dl(base + '-ringtone' + (isM4r ? '.m4r' : '.mp3'), blob, mime);
      T.show(outBox, '<span class="ok">Selesai. Nada dering terunduh.</span>' +
        kv('Potongan', start + ' detik sampai ' + end + ' detik') +
        kv('Durasi hasil', (end - start).toFixed(1) + ' detik') +
        kv('Format', isM4r ? 'M4R (iPhone)' : 'MP3') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Nada dering terunduh');
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
      if (duration > 0) {
        startInp.value = '0';
        endInp.value = String(Math.min(30, Math.floor(duration * 10) / 10));
      }
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });

  T.onLeave(() => {
    if (busy) cancelFFmpeg();
    if (previewAudio) { try { previewAudio.pause(); } catch (e) {} }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih bagian lagu yang mau dipakai, dengarkan dulu potongannya, lalu unduh. MP3 untuk Android dan umum, M4R untuk iPhone.</p>'));
  root.appendChild(T.field('Pilih file lagu', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Mulai dari detik ke', startInp, 'Boleh desimal, misal 12,5.'), T.field('Sampai detik ke', endInp, 'Boleh desimal, misal 42,5.')));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(m4rHint);
  root.appendChild(T.el('<div style="margin:10px 0"></div>')).appendChild(fadeLbl);
  root.appendChild(T.row(previewBtn, goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Lagunya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
