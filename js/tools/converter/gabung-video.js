import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "gabung-video", "name": "Gabung Video", "cat": "converter", "icon": "🎞️", "desc": "Sambung beberapa klip video jadi satu video.", "keywords": "video,gabung,sambung,klip,satu", "since": "6.16.0"};

export function render(root) {
  const file = T.input('file');
  file.accept = 'video/*';
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

  // Daftar klip: { file, duration, w, h }. Ukuran layar dibaca dari tiap
  // klip supaya hasil gabungan memakai ukuran terbesar (klip kecil
  // ditempel di tengah dengan latar hitam, tidak ketarik).
  let clips = [];
  let busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const fmtDur = (d) => (d > 0 ? d.toFixed(1) + ' detik' : 'durasi tidak terbaca');
  // Durasi hasil DIUKUR dari file jadi (bukan dijumlah dari rumus),
  // karena pembulatan frame bisa menggeser sedikit.
  const measureDur = (blob) => new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const m = document.createElement('video');
    m.preload = 'metadata';
    m.onloadedmetadata = () => { const d = m.duration || 0; URL.revokeObjectURL(url); resolve(d); };
    m.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    m.src = url;
  });

  const refreshList = () => {
    if (!clips.length) {
      T.show(listBox, '<p class="hint">Belum ada video. Pilih satu atau banyak video di atas, bisa bertahap.</p>');
      return;
    }
    const total = clips.reduce((a, c) => a + (c.duration || 0), 0);
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + clips.length + ' video, total ' + fmtDur(total) + '. Urutan di bawah adalah urutan hasil gabungan.</p>');
    clips.forEach((c, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (i + 1) + '. ' + T.esc(c.file.name) + ' <span class="dim">(' + fmtDur(c.duration) + (c.w ? ', ' + c.w + 'x' + c.h : '') + ')</span></span>'));
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
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { const m = { duration: v.duration || 0, w: v.videoWidth || 0, h: v.videoHeight || 0 }; URL.revokeObjectURL(url); resolve(m); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve({ duration: 0, w: 0, h: 0 }); };
    v.src = url;
  });

  file.addEventListener('change', async () => {
    const picked = Array.from(file.files || []);
    file.value = '';
    if (!picked.length) return;
    T.hide(outBox);
    for (const f of picked) {
      const m = await readMeta(f);
      clips.push({ file: f, duration: m.duration, w: m.w, h: m.h });
      refreshList();
    }
  });

  const goBtn = T.btn('Gabung jadi satu video', async () => {
    if (busy) return;
    if (clips.length < 2) { T.show(outBox, errBox('Pilih minimal 2 video untuk digabung.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    // Ukuran target: terbesar di antara klip, dibulatkan genap (syarat H.264).
    const tw = Math.max(2, ...clips.map((c) => c.w || 0));
    const th = Math.max(2, ...clips.map((c) => c.h || 0));
    const W = (tw % 2 ? tw + 1 : tw) || 640;
    const H = (th % 2 ? th + 1 : th) || 360;
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    refreshList();
    T.hide(outBox);
    const names = clips.map((c, i) => {
      const ext = (c.file.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
      return 'in' + i + ext;
    });
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      for (let i = 0; i < clips.length; i++) {
        setStage('Menyalin video ' + (i + 1) + ' dari ' + clips.length + '…', 0);
        await ffmpeg.writeFile(names[i], await fetchFile(clips[i].file));
      }
      // concat filter: tiap klip disamakan dulu (ukuran, kecepatan gambar,
      // suara) baru disambung, supaya klip beda ukuran tetap bisa gabung.
      const buildArgs = (withAudio) => {
        const args = [];
        names.forEach((n) => args.push('-i', n));
        let fc = '';
        for (let i = 0; i < names.length; i++) {
          fc += '[' + i + ':v]scale=' + W + ':' + H + ':force_original_aspect_ratio=decrease,pad=' + W + ':' + H + ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v' + i + '];';
          if (withAudio) fc += '[' + i + ':a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a' + i + '];';
        }
        for (let i = 0; i < names.length; i++) { fc += '[v' + i + ']'; if (withAudio) fc += '[a' + i + ']'; }
        fc += 'concat=n=' + names.length + ':v=1:a=' + (withAudio ? '1' : '0') + '[v]' + (withAudio ? '[a]' : '');
        args.push('-filter_complex', fc, '-map', '[v]');
        if (withAudio) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '128k');
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-movflags', '+faststart', 'output.mp4');
        return args;
      };
      setStage('Menggabungkan… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage('Menggabungkan… ' + pct + '%', pct); };
      try {
        await runFFmpeg(ffmpeg, buildArgs(true), prog);
      } catch (e) {
        // Klip tanpa suara membuat sambungan bersuara gagal. Coba lagi
        // tanpa suara daripada gagal total.
        if (isCancelled(e)) throw e;
        await cleanupFFmpeg(ffmpeg, ['output.mp4']);
        setStage('Salah satu video tidak bersuara, menggabungkan tanpa suara… 0%', 0);
        await runFFmpeg(ffmpeg, buildArgs(false), prog);
      }
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [...names, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl('video-gabungan.mp4', blob, 'video/mp4');
      const outDur = await measureDur(blob);
      const total = outDur || clips.reduce((a, c) => a + (c.duration || 0), 0);
      T.show(outBox, '<span class="ok">Selesai. Video gabungan terunduh.</span>' +
        kv('Klip digabung', clips.length + ' video') +
        kv('Total durasi', fmtDur(total)) +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Video gabungan terunduh');
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Sambung beberapa klip jadi satu video. Bila ukuran layarnya beda, klip yang lebih kecil ditempel di tengah dengan latar hitam supaya tidak ketarik.</p>'));
  root.appendChild(T.field('Pilih video (boleh banyak)', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(listBox);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
  refreshList();
}
