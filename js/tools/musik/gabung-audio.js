import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "gabung-audio", "name": "Gabung Audio", "cat": "musik", "icon": "🔗", "desc": "Sambung beberapa file audio jadi satu.", "keywords": "audio,gabung,sambung,mp3,satu", "since": "6.16.0"};

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  file.multiple = true;
  const listBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  let clips = [];
  let busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const fmtDur = (d) => (d > 0 ? d.toFixed(1) + ' detik' : 'durasi tidak terbaca');
  // Durasi hasil DIUKUR dari file jadi (bukan dijumlah dari rumus).
  const measureDur = (blob) => new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const m = document.createElement('audio');
    m.preload = 'metadata';
    m.onloadedmetadata = () => { const d = m.duration || 0; URL.revokeObjectURL(url); resolve(d); };
    m.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    m.src = url;
  });

  const refreshList = () => {
    if (!clips.length) {
      T.show(listBox, '<p class="hint">Belum ada audio. Pilih satu atau banyak file di atas, bisa bertahap.</p>');
      return;
    }
    const total = clips.reduce((a, c) => a + (c.duration || 0), 0);
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + clips.length + ' file, total ' + fmtDur(total) + '. Urutan di bawah adalah urutan hasil gabungan.</p>');
    clips.forEach((c, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (i + 1) + '. ' + T.esc(c.file.name) + ' <span class="dim">(' + fmtDur(c.duration) + ')</span></span>'));
      const acts = T.el('<div style="display:flex;gap:6px;flex-shrink:0"></div>');
      const up = T.btn('Naik', () => { if (i > 0) { const t = clips[i - 1]; clips[i - 1] = clips[i]; clips[i] = t; refreshList(); } });
      up.classList.add('small'); up.disabled = i === 0 || busy;
      const down = T.btn('Turun', () => { if (i < clips.length - 1) { const t = clips[i + 1]; clips[i + 1] = clips[i]; clips[i] = t; refreshList(); } });
      down.classList.add('small'); down.disabled = i === clips.length - 1 || busy;
      const del = T.btn('Hapus', () => { clips.splice(i, 1); refreshList(); });
      del.classList.add('small'); del.disabled = busy;
      acts.appendChild(up); acts.appendChild(down); acts.appendChild(del);
      row.appendChild(acts);
      listBox.appendChild(row);
    });
  };

  const readMeta = (f) => new Promise((resolve) => {
    const url = URL.createObjectURL(f);
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.onloadedmetadata = () => { const d = a.duration || 0; URL.revokeObjectURL(url); resolve(d); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });

  file.addEventListener('change', async () => {
    const picked = Array.from(file.files || []);
    file.value = '';
    if (!picked.length) return;
    T.hide(outBox);
    for (const f of picked) {
      const duration = await readMeta(f);
      clips.push({ file: f, duration });
      refreshList();
    }
  });

  const goBtn = T.btn('Gabung jadi satu audio', async () => {
    if (busy) return;
    if (clips.length < 2) { T.show(outBox, errBox('Pilih minimal 2 file audio untuk digabung.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    refreshList();
    T.hide(outBox);
    const names = clips.map((c, i) => {
      const ext = (c.file.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
      return 'in' + i + ext;
    });
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      for (let i = 0; i < clips.length; i++) {
        setStage('Menyalin audio ' + (i + 1) + ' dari ' + clips.length + '…', 0);
        await ffmpeg.writeFile(names[i], await fetchFile(clips[i].file));
      }
      // Daftar sambungan: tiap baris "file 'inN.ext'". Nama file dibuat
      // sendiri (tanpa spasi/karakter aneh) supaya daftar selalu valid.
      // Hasil diolah ulang jadi MP3 dengan kualitas suara disamakan,
      // supaya file beda format tetap bisa gabung.
      const listText = names.map((n) => "file '" + n + "'").join('\n');
      await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listText));
      setStage('Menggabungkan… 0%', 0);
      await runFFmpeg(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', 'output.mp3'], (p) => {
        const pct = Math.round(p * 100);
        setStage('Menggabungkan… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp3');
      await cleanupFFmpeg(ffmpeg, [...names, 'list.txt', 'output.mp3']);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      T.dl('audio-gabungan.mp3', blob, 'audio/mpeg');
      const outDur = await measureDur(blob);
      const total = outDur || clips.reduce((a, c) => a + (c.duration || 0), 0);
      T.show(outBox, '<span class="ok">Selesai. Audio gabungan terunduh.</span>' +
        kv('File digabung', clips.length + ' file') +
        kv('Total durasi', fmtDur(total)) +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Audio gabungan terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else T.show(outBox, errBox(friendlyError(e)));
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
      refreshList();
    }
  }, true);
  const cancelBtn = T.btn('Batalkan', () => { cancelFFmpeg(); });
  cancelBtn.hidden = true;

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Sambung beberapa rekaman atau lagu jadi satu file MP3. Cocok untuk menggabungkan potongan rekaman suara atau bagian podcast.</p>'));
  root.appendChild(T.field('Pilih audio (boleh banyak)', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(listBox);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
  refreshList();
}
