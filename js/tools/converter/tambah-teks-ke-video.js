import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL, fetchFileLokal } from '../../ffmpeg-loader.js';

export const meta = {"id": "tambah-teks-ke-video", "name": "Tambah Teks ke Video", "cat": "converter", "icon": "✍️", "desc": "Tulis teks atau judul di atas video.", "keywords": "video,teks,judul,tulisan,overlay,caption", "since": "6.17.0"};

// Font DejaVu Sans (TTF, lisensi bebas) untuk huruf teks. Diunduh sekali
// dari CDN saat proses berjalan.
const FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';

// Escape teks untuk filter drawtext ffmpeg. Teks TIDAK dibungkus tanda
// petik (pembungkus petik membuat parser salah membaca \% bila teks juga
// mengandung petik — terbukti lewat probe CLI: petik + persen = peringatan
// "Stray %" walau tiap karakter sendiri-sendiri aman). Karena tanpa
// pembungkus, karakter pemisah filter juga harus di-escape: titik dua,
// koma, titik koma, dan kurung siku. Backslash dan persen butuh escape
// ganda (parser filter lalu parser drawtext). Backslash ditulis lewat
// fromCharCode supaya jumlahnya tidak bisa salah baca di lapisan
// penulisan berkas. Murni, bisa diuji di Node.
export function escapeDrawtext(teks) {
  const B = String.fromCharCode(92);
  return String(teks || '')
    .replace(/\\/g, B + B + B + B)
    .replace(/'/g, B + "'")
    .replace(/%/g, B + B + '%')
    .replace(/:/g, B + ':')
    .replace(/,/g, B + ',')
    .replace(/;/g, B + ';')
    .replace(/\[/g, B + '[')
    .replace(/\]/g, B + ']')
    .replace(/\n/g, ' ');
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'video/*';
  const teksInp = T.input('text', 'Tulis teksnya di sini');
  teksInp.maxLength = 120;
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
    ['bawah', 'Bawah'],
    ['tengah', 'Tengah'],
    ['atas', 'Atas'],
  ], 'bawah');
  const ukuranSel = T.select([
    ['kecil', 'Kecil'],
    ['sedang', 'Sedang'],
    ['besar', 'Besar'],
  ], 'sedang');
  const warnaSel = T.select([
    ['putih', 'Putih'],
    ['kuning', 'Kuning'],
    ['hitam', 'Hitam'],
  ], 'putih');

  let fileObj = null, duration = 0, vw = 0, vh = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const faktorUkuran = () => ukuranSel.value === 'kecil' ? 0.05 : ukuranSel.value === 'besar' ? 0.09 : 0.07;
  const warnaCss = () => warnaSel.value === 'kuning' ? '#ffd60a' : warnaSel.value === 'hitam' ? '#000000' : '#ffffff';
  const warnaDrawtext = () => warnaSel.value === 'kuning' ? 'yellow' : warnaSel.value === 'hitam' ? 'black' : 'white';

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(fileObj);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      duration = v.duration || 0;
      vw = v.videoWidth || 0;
      vh = v.videoHeight || 0;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar', vw && vh ? vw + ' x ' + vh : 'tidak terbaca'));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0; vw = 0; vh = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)));
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  // Cara cadangan: gambar teks di atas video dengan canvas sambil memutar
  // video, lalu rekam hasilnya. Berjalan secepat durasi video dan
  // menghasilkan WebM. Mengembalikan Blob atau null bila dibatalkan.
  const rekamCanvas = async (teks, onProgress) => {
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      throw new Error('Browser ini tidak mendukung perekaman canvas.');
    }
    const url = URL.createObjectURL(fileObj);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.src = url;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error('Video tidak bisa dibaca.'));
    });
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    const dur = video.duration || 0;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    let px = Math.max(16, Math.round(h * faktorUkuran()));
    ctx.font = 'bold ' + px + 'px sans-serif';
    const maksLebar = w * 0.9;
    while (ctx.measureText(teks).width > maksLebar && px > 12) {
      px -= 2;
      ctx.font = 'bold ' + px + 'px sans-serif';
    }
    const yTeks = posisiSel.value === 'atas' ? Math.round(h * 0.08) + px
      : posisiSel.value === 'tengah' ? Math.round(h / 2) + Math.round(px / 2)
      : Math.round(h * 0.92);
    const gambar = () => {
      ctx.drawImage(video, 0, 0, w, h);
      ctx.font = 'bold ' + px + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText(teks).width;
      ctx.fillStyle = warnaSel.value === 'hitam' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect((w - tw) / 2 - 14, yTeks - px - 10, tw + 28, px + 20);
      ctx.fillStyle = warnaCss();
      ctx.fillText(teks, w / 2, yTeks);
    };
    // Suara asli ikut direkam lewat AudioContext.
    let streamGabung = canvas.captureStream(30);
    let actx = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        actx = new AC();
        if (actx.state === 'suspended') { try { await actx.resume(); } catch (e) {} }
        const sumber = actx.createMediaElementSource(video);
        const tujuan = actx.createMediaStreamDestination();
        sumber.connect(tujuan);
        sumber.connect(actx.destination);
        const trekSuara = tujuan.stream.getAudioTracks();
        if (trekSuara.length) streamGabung.addTrack(trekSuara[0]);
      }
    } catch (e) { /* lanjut tanpa suara */ }
    const tipe = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
    const perekam = new MediaRecorder(streamGabung, tipe ? { mimeType: tipe, videoBitsPerSecond: 5000000 } : undefined);
    const potongan = [];
    perekam.ondataavailable = (e) => { if (e.data && e.data.size) potongan.push(e.data); };
    const selesai = new Promise((resolve) => { perekam.onstop = resolve; });
    let raf = 0;
    const putar = () => {
      gambar();
      if (!video.ended) raf = requestAnimationFrame(putar);
    };
    // Memutar video dengan suara butuh ketukan pengguna. Bila ketukan awal
    // sudah kedaluwarsa (proses mesin tadi memakan waktu), minta ketuk lagi.
    try {
      await video.play();
    } catch (e) {
      const lanjut = await new Promise((resolve) => {
        T.show(outBox, '<p class="dim" style="font-size:13px;line-height:1.6">Cara cadangan siap. Ketuk tombol di bawah untuk memutar video dan merekamnya dengan teks. Prosesnya selama durasi video.</p>');
        const tombol = T.btn('Putar dan rekam', () => resolve(true), true);
        outBox.appendChild(tombol);
      });
      if (!lanjut) { URL.revokeObjectURL(url); return null; }
      await video.play();
    }
    perekam.start(250);
    putar();
    const cek = setInterval(() => {
      if (onProgress && dur) onProgress(video.currentTime / dur);
    }, 300);
    await new Promise((resolve) => {
      video.onended = resolve;
      setTimeout(resolve, (dur + 2) * 1000);
    });
    clearInterval(cek);
    cancelAnimationFrame(raf);
    if (perekam.state !== 'inactive') perekam.stop();
    await selesai;
    if (actx) { try { await actx.close(); } catch (e) {} }
    URL.revokeObjectURL(url);
    return new Blob(potongan, { type: 'video/webm' });
  };

  const goBtn = T.btn('Tambah teks ke video', async () => {
    if (busy) return;
    const teks = teksInp.value.trim();
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!teks) { T.show(outBox, errBox('Tulis dulu teksnya.')); return; }
    const sup = supportsFFmpeg();
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    let pakaiCadangan = false;
    try {
      if (sup.ok) {
        try {
          const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
            if (s.stage === 'unduh') setStage(s.label, s.pct);
            else setStage(s.label, s.stage === 'siap' ? 100 : 0);
          });
          setStage('Menyalin video ke mesin…', 0);
          await ffmpeg.writeFile(inName, await fetchFile(fileObj));
          setStage('Mengunduh huruf untuk teks…', 0);
          await ffmpeg.writeFile('font.ttf', await fetchFileLokal(FONT_URL));
          const fontSize = Math.max(16, Math.round((vh || 720) * faktorUkuran()));
          const yPos = posisiSel.value === 'atas' ? 'y=h*0.08' : posisiSel.value === 'tengah' ? 'y=(h-text_h)/2' : 'y=h-text_h-h*0.08';
          const boxColor = warnaSel.value === 'hitam' ? 'white@0.6' : 'black@0.5';
          const filter = 'drawtext=fontfile=font.ttf:text=' + escapeDrawtext(teks) + ':fontsize=' + fontSize + ':fontcolor=' + warnaDrawtext() + ':box=1:boxcolor=' + boxColor + ':boxborderw=12:x=(w-text_w)/2:' + yPos;
          setStage('Menulis teks… 0%', 0);
          const prog = (p) => { const pct = Math.round(p * 100); setStage('Menulis teks… ' + pct + '%', pct); };
          await runFFmpeg(ffmpeg, ['-i', inName, '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', 'output.mp4'], prog);
          const data = await ffmpeg.readFile('output.mp4');
          await cleanupFFmpeg(ffmpeg, [inName, 'font.ttf', 'output.mp4']);
          const blob = new Blob([data], { type: 'video/mp4' });
          T.dl(base + '-teks.mp4', blob, 'video/mp4');
          T.show(outBox, '<span class="ok">Selesai. Video dengan teks terunduh.</span>' +
            kv('Teks', T.esc(teks)) +
            kv('Ukuran hasil', fmtBytes(blob.size)));
          T.toast('Video terunduh');
          return;
        } catch (e) {
          if (isCancelled(e)) throw e;
          // Cara cepat gagal (huruf tidak terunduh atau filter tidak jalan
          // di mesin ini): lanjut ke cara cadangan, bukan gagal total.
          pakaiCadangan = true;
          try { cancelFFmpeg(); } catch (err) {}
        }
      } else {
        pakaiCadangan = true;
      }
      if (pakaiCadangan) {
        setStage('Cara cepat tidak jalan di sini, memakai cara cadangan…', 0);
        const blob = await rekamCanvas(teks, (p) => {
          const pct = Math.round(p * 100);
          setStage('Merekam video dengan teks… ' + pct + '%', pct);
        });
        if (!blob || !blob.size) { T.show(outBox, errBox('Perekaman dibatalkan atau gagal.')); return; }
        T.dl(base + '-teks.webm', blob, 'video/webm');
        T.show(outBox, '<span class="ok">Selesai. Video dengan teks terunduh.</span>' +
          kv('Teks', T.esc(teks)) +
          kv('Ukuran hasil', fmtBytes(blob.size)) +
          '<p class="hint" style="margin-top:8px">Hasil cara cadangan berformat WebM, bisa dibuka di Chrome, Edge, dan Firefox.</p>');
        T.toast('Video terunduh');
      }
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis satu baris teks di atas video, misalnya judul atau nama. Teksnya menyatu dengan gambar video.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(T.field('Teks', teksInp, 'Maksimal 120 huruf, satu baris.'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Posisi teks', posisiSel), T.field('Ukuran teks', ukuranSel)));
  root.appendChild(T.field('Warna teks', warnaSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Bila cara cepat tidak jalan di browser ini, tool memakai cara cadangan yang merekam video sambil diputar. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
