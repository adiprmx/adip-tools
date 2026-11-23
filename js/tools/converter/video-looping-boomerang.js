import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "video-looping-boomerang", "name": "Video Looping/Boomerang", "cat": "converter", "icon": "🔁", "desc": "Ulangi video berkali-kali, atau buat maju mundur.", "keywords": "video,loop,boomerang,ulang,maju mundur,repeat", "since": "6.17.0", "online": true};

// Durasi hasil dari durasi awal. Mode 'loop' mengulang sejumlah n kali,
// mode 'boomerang' maju sekali lalu mundur sekali. Murni, bisa diuji di Node.
export function durasiHasilLoop(durasi, mode, jumlah) {
  if (!Number.isFinite(durasi) || durasi <= 0) return 0;
  if (mode === 'boomerang') return durasi * 2;
  return durasi * Math.max(1, jumlah || 1);
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

  const modeSel = T.select([
    ['loop', 'Ulangi video berkali-kali'],
    ['boomerang', 'Boomerang (maju lalu mundur)'],
  ], 'loop');
  const jumlahSel = T.select([
    ['2', '2 kali'],
    ['3', '3 kali'],
    ['5', '5 kali'],
    ['10', '10 kali'],
  ], '3');
  const jumlahWrap = T.el('<div></div>');
  jumlahWrap.appendChild(T.field('Diulang berapa kali', jumlahSel));

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const refreshInfo = () => {
    if (!fileObj) { T.hide(infoBox); return; }
    const hasil = durasiHasilLoop(duration, modeSel.value, Number(jumlahSel.value));
    T.show(infoBox,
      kv('File', T.esc(fileObj.name)) +
      kv('Durasi awal', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
      kv('Durasi hasil', hasil ? hasil.toFixed(1) + ' detik' : '-') +
      kv('Ukuran', fmtBytes(fileObj.size)));
  };
  modeSel.addEventListener('change', () => {
    jumlahWrap.hidden = modeSel.value !== 'loop';
    refreshInfo();
  });
  jumlahSel.addEventListener('change', refreshInfo);

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

  const goBtn = T.btn('Buat video', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const mode = modeSel.value;
    const jumlah = Number(jumlahSel.value);
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
      const label = mode === 'boomerang' ? 'Membuat boomerang' : 'Mengulang video';
      setStage(label + '… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage(label + '… ' + pct + '%', pct); };
      if (mode === 'loop') {
        try {
          // Salin apa adanya dulu (cepat, kualitas tidak berubah).
          await runFFmpeg(ffmpeg, ['-stream_loop', String(jumlah - 1), '-i', inName, '-c', 'copy', '-movflags', '+faststart', 'output.mp4'], prog);
        } catch (e) {
          if (isCancelled(e)) throw e;
          await cleanupFFmpeg(ffmpeg, ['output.mp4']);
          setStage('Format video ini perlu diolah ulang… 0%', 0);
          await runFFmpeg(ffmpeg, ['-stream_loop', String(jumlah - 1), '-i', inName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'output.mp4'], prog);
        }
      } else {
        // Boomerang: video dibagi dua jalur (asli + dibalik) lalu disambung.
        // asplit dipakai supaya suara asli tidak hilang di jalur balik.
        const denganSuara = ['-i', inName, '-filter_complex',
          '[0:v]split=2[asli][balik];[balik]reverse[r];[asli][r]concat=n=2:v=1:a=0[vout];[0:a]asplit=2[aasli][abalik];[abalik]areverse[ar];[aasli][ar]concat=n=2:v=0:a=1[aout]',
          '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'output.mp4'];
        const tanpaSuara = ['-i', inName, '-filter_complex',
          '[0:v]split=2[asli][balik];[balik]reverse[r];[asli][r]concat=n=2:v=1:a=0[vout]',
          '-map', '[vout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-an', '-movflags', '+faststart', 'output.mp4'];
        try {
          await runFFmpeg(ffmpeg, denganSuara, prog);
        } catch (e) {
          if (isCancelled(e)) throw e;
          await cleanupFFmpeg(ffmpeg, ['output.mp4']);
          setStage('Video ini tidak bersuara, melanjutkan tanpa suara… 0%', 0);
          await runFFmpeg(ffmpeg, tanpaSuara, prog);
        }
      }
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      const akhir = mode === 'boomerang' ? '-boomerang.mp4' : '-loop' + jumlah + 'x.mp4';
      T.dl(base + akhir, blob, 'video/mp4');
      const hasilDur = durasiHasilLoop(duration, mode, jumlah);
      T.show(outBox, '<span class="ok">Selesai. Video terunduh.</span>' +
        kv('Mode', mode === 'boomerang' ? 'Boomerang (maju mundur)' : 'Diulang ' + jumlah + ' kali') +
        kv('Durasi hasil', hasilDur ? 'sekitar ' + hasilDur.toFixed(1) + ' detik' : '-') +
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ulangi satu video berkali-kali jadi satu file panjang, atau buat boomerang yang maju lalu mundur seperti di media sosial.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Mode', modeSel));
  root.appendChild(jumlahWrap);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
