import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.12.0';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js?v=6.12.0';

export const meta = {"id": "kompres-video", "name": "Kompres Video", "cat": "converter", "icon": "🗜️", "desc": "Perkecil ukuran video, termasuk pilihan pas untuk WhatsApp.", "keywords": "video,kompres,perkecil,whatsapp,ukuran,mp4,kecil", "since": "6.11.0"};

export function render(root) {
  const WA_TARGET_MB = 15.5; // di bawah batas 16 MB, sisakan ruang untuk audio
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

  const presetSel = T.select([
    ['whatsapp', 'Buat WhatsApp (maks 16 MB)'],
    ['hemat', 'Hemat (paling kecil)'],
    ['seimbang', 'Seimbang'],
    ['kualitas', 'Kualitas (paling jernih)'],
  ], 'whatsapp');
  const estLine = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0"></p>');

  let fileObj = null, duration = 0, vWidth = 0, vHeight = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  // Hitung bitrate video (kbps) agar hasil mendekati target MB.
  // Mengembalikan null bila durasi tidak terbaca.
  // Bitrate hasil TIDAK PERNAH melebihi 85% bitrate video asli: tanpa batas
  // ini, video yang sudah di bawah target (mis. 7 MB, 10 detik) di-encode
  // ulang ke bitrate target 15,5 MB dan hasilnya justru MEMBESAR (terbukti
  // di uji browser 15 Nov 2026: 7,21 MB -> 9,92 MB). Batas ini tidak mengubah
  // apa pun untuk video di atas target, karena di sana bitrate target sudah
  // lebih kecil dari bitrate asli.
  const waVideoKbps = () => {
    if (!duration || duration <= 0) return null;
    const totalKbps = (WA_TARGET_MB * 8 * 1024) / duration;
    let vk = Math.max(150, Math.round(totalKbps - 96));
    if (fileObj && fileObj.size > 0) {
      const srcKbps = (fileObj.size * 8 / 1000) / duration;
      vk = Math.min(vk, Math.max(150, Math.round(srcKbps * 0.85)));
    }
    return vk;
  };

  const refreshEst = () => {
    const p = presetSel.value;
    if (p === 'whatsapp') {
      if (!fileObj) { estLine.textContent = 'Hasil diusahakan di bawah 16 MB. Pilih video dulu untuk melihat hitungannya.'; return; }
      const vk = waVideoKbps();
      if (vk === null) { estLine.textContent = 'Durasi video tidak terbaca, jadi target ukuran tidak bisa dihitung. Dipakai setelan hemat (resolusi paling tinggi 480p).'; return; }
      estLine.textContent = 'Target sekitar ' + WA_TARGET_MB.toString().replace('.', ',') + ' MB (dihitung dari durasi ' + duration.toFixed(0) + ' detik).' +
        (vk <= 150 ? ' Video ini panjang, jadi hasilnya bisa tetap di atas 16 MB.' : '') +
        (fileObj.size <= WA_TARGET_MB * 1024 * 1024 ? ' Video ini sudah di bawah 16 MB, jadi pilihan ini hanya memperkecil sedikit. Pakai Hemat bila mau jauh lebih kecil.' : '');
      return;
    }
    if (p === 'hemat') estLine.textContent = 'Resolusi paling tinggi 720p, kualitas gambar diturunkan paling banyak. Ukuran hasil baru ketahuan setelah proses selesai.';
    else if (p === 'seimbang') estLine.textContent = 'Resolusi paling tinggi 1080p, kualitas gambar masih enak dilihat. Ukuran hasil baru ketahuan setelah proses selesai.';
    else estLine.textContent = 'Resolusi asli dipertahankan, kualitas gambar paling dijaga. Ukuran hasil baru ketahuan setelah proses selesai.';
  };
  presetSel.addEventListener('change', refreshEst);
  refreshEst();

  const goBtn = T.btn('Kompres video', async () => {
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
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    const p = presetSel.value;
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-i', inName];
      if (p === 'whatsapp') {
        const vk = waVideoKbps();
        args.push('-vf', 'scale=-2:min(ih\\,480)', '-c:v', 'libx264', '-preset', 'veryfast');
        if (vk !== null) args.push('-b:v', vk + 'k', '-maxrate', vk + 'k', '-bufsize', (vk * 2) + 'k');
        else args.push('-crf', '28');
        args.push('-c:a', 'aac', '-b:a', '96k');
      } else if (p === 'hemat') {
        args.push('-vf', 'scale=-2:min(ih\\,720)', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-c:a', 'aac', '-b:a', '96k');
      } else if (p === 'seimbang') {
        args.push('-vf', 'scale=-2:min(ih\\,1080)', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-c:a', 'aac', '-b:a', '128k');
      } else {
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k');
      }
      args.push('-movflags', '+faststart', 'output.mp4');
      setStage('Mengompres… 0%', 0);
      await runFFmpeg(ffmpeg, args, (pr) => {
        const pct = Math.round(pr * 100);
        setStage('Mengompres… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-kecil.mp4', blob, 'video/mp4');
      const pct = Math.round((1 - blob.size / fileObj.size) * 100);
      T.show(outBox, '<span class="ok">Selesai. Video terunduh.</span>' +
        kv('Ukuran awal', fmtBytes(fileObj.size)) +
        kv('Ukuran hasil', fmtBytes(blob.size)) +
        (blob.size < fileObj.size
          ? kv('Lebih kecil', fmtBytes(fileObj.size - blob.size) + ' (' + pct + '%)')
          : '<p class="dim" style="font-size:13px;margin:8px 0 0">Hasil tidak lebih kecil. Video aslinya sudah padat, coba pilihan Hemat bila perlu.</p>'));
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
    if (!fileObj) { T.hide(infoBox); refreshEst(); return; }
    const url = URL.createObjectURL(fileObj);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      duration = v.duration || 0;
      vWidth = v.videoWidth || 0;
      vHeight = v.videoHeight || 0;
      const big = fileObj.size > 200 * 1024 * 1024;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Resolusi', vWidth && vHeight ? vWidth + ' x ' + vHeight : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)) +
        (big ? '<p class="dim" style="font-size:13px;margin:8px 0 0">File besar. Proses bisa lama dan butuh memori besar di browser.</p>' : ''));
      refreshEst();
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0; vWidth = 0; vHeight = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      refreshEst();
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Perkecil video supaya gampang dikirim atau diunggah. Pilihan WhatsApp mengusahakan hasil di bawah 16 MB.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Preset', presetSel));
  root.appendChild(estLine);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
