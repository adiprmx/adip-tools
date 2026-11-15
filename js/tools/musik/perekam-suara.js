import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"perekam-suara","name":"Perekam Suara","cat":"musik","icon":"🎙️","desc":"Rekam suara dari mikrofon, potong, lalu unduh WebM atau WAV.","keywords":"rekam,suara,mikrofon,audio,voice,note","since":"6.11.0"};

/* Perekam suara: MediaRecorder + AnalyserNode untuk gelombang saat merekam.
   Potong awal/akhir berlaku untuk unduhan WAV (decode + encode ulang).
   WebM diunduh apa adanya dari hasil rekaman. */
const fmtDur = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60), d = s % 60;
  return (m < 10 ? '0' + m : m) + ':' + (d < 10 ? '0' + d : d);
};

export function render(root) {
  const supported = typeof MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const box = T.out();
  const wave = document.createElement('canvas');
  wave.style.cssText = 'width:100%;height:90px;border-radius:10px;border:1px solid #ffffff20;background:#18181b;display:block';
  wave.width = 720; wave.height = 180;
  const durEl = T.el('<div style="font-size:28px;font-weight:700;text-align:center;letter-spacing:1px;font-variant-numeric:tabular-nums">00:00</div>');
  const statusEl = T.el('<p class="hint center" style="margin:4px 0 0">Siap merekam</p>');
  const audioEl = document.createElement('audio');
  audioEl.controls = true;
  audioEl.style.cssText = 'width:100%;margin-top:10px';
  audioEl.hidden = true;

  let stream = null, rec = null, chunks = [];
  let actx = null, analyser = null, rafId = 0, t0 = 0, tickId = 0;
  let blob = null, blobUrl = null, audioBuf = null;
  let recording = false;

  const trimStart = T.input('text', '0', '0');
  trimStart.inputMode = 'decimal';
  const trimEnd = T.input('text', 'sampai akhir', '');
  trimEnd.inputMode = 'decimal';

  const drawIdle = () => {
    const x = wave.getContext('2d');
    if (!x) return;
    x.clearRect(0, 0, wave.width, wave.height);
    x.fillStyle = '#52525b';
    const mid = wave.height / 2;
    for (let i = 0; i < 90; i++) {
      const h = 4 + (Math.sin(i * 0.7) * 0.5 + 0.5) * 10;
      x.fillRect(8 + i * 8, mid - h / 2, 4, h);
    }
  };

  const drawLive = () => {
    if (!analyser) return;
    const x = wave.getContext('2d');
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    x.clearRect(0, 0, wave.width, wave.height);
    x.strokeStyle = '#fafafa'; x.lineWidth = 2; x.beginPath();
    const step = Math.floor(data.length / wave.width) || 1;
    for (let i = 0; i < wave.width; i++) {
      const v = data[i * step] / 128 - 1;
      const y = wave.height / 2 + v * (wave.height / 2 - 6);
      if (i === 0) x.moveTo(i, y); else x.lineTo(i, y);
    }
    x.stroke();
    rafId = requestAnimationFrame(drawLive);
  };

  const drawStatic = () => {
    if (!audioBuf) { drawIdle(); return; }
    const x = wave.getContext('2d');
    const ch = audioBuf.getChannelData(0);
    const W = wave.width, H = wave.height;
    x.clearRect(0, 0, W, H);
    x.fillStyle = '#a1a1aa';
    const step = Math.max(1, Math.floor(ch.length / W));
    for (let px = 0; px < W; px++) {
      let mx = 0;
      for (let i = px * step; i < (px + 1) * step && i < ch.length; i += 4) {
        const v = Math.abs(ch[i]);
        if (v > mx) mx = v;
      }
      const h = Math.max(2, mx * (H - 12));
      x.fillRect(px, (H - h) / 2, 1, h);
    }
    const [s, e] = getRange();
    const x0 = (s / audioBuf.duration) * W, x1 = (e / audioBuf.duration) * W;
    x.fillStyle = 'rgba(255,255,255,0.14)';
    x.fillRect(0, 0, x0, H); x.fillRect(x1, 0, W - x1, H);
    x.fillStyle = '#ffffff';
    x.fillRect(Math.max(0, x0 - 1), 0, 2, H); x.fillRect(Math.min(W - 2, x1 - 1), 0, 2, H);
  };

  const getRange = () => {
    const dur = audioBuf ? audioBuf.duration : 0;
    let s = Math.max(0, T.num(trimStart.value) || 0);
    let e = trimEnd.value.trim() === '' ? dur : Math.min(dur, T.num(trimEnd.value) || dur);
    if (!(e > s)) e = Math.min(dur, s + 0.5);
    if (e > dur) e = dur;
    return [s, e];
  };

  const encodeWav = (s0, s1) => {
    const sr = audioBuf.sampleRate, nCh = audioBuf.numberOfChannels;
    const a = Math.max(0, Math.floor(s0 * sr)), b = Math.min(audioBuf.length, Math.floor(s1 * sr));
    const frames = Math.max(0, b - a);
    const ab = new ArrayBuffer(44 + frames * nCh * 2), v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true); ws(8, 'WAVE');
    ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, nCh, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, frames * nCh * 2, true);
    const chans = [];
    for (let c = 0; c < nCh; c++) chans.push(audioBuf.getChannelData(c));
    let o = 44;
    for (let i = a; i < b; i++) for (let c = 0; c < nCh; c++) {
      const xv = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(o, xv < 0 ? xv * 0x8000 : xv * 0x7fff, true); o += 2;
    }
    return new Blob([ab], { type: 'audio/wav' });
  };

  const cleanup = () => {
    cancelAnimationFrame(rafId);
    clearInterval(tickId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    recording = false;
  };
  T.onLeave(cleanup);

  const bRekam = T.btn('Mulai rekam', null, true);
  const bStop = T.btn('Berhenti', null);
  bStop.disabled = true;
  const bWebm = T.btn('Unduh WebM', () => {
    if (!blob) { T.toast('Belum ada rekaman'); return; }
    T.dl('rekaman.webm', blob, blob.type || 'audio/webm');
  });
  const bWav = T.btn('Unduh WAV (terpotong)', async () => {
    if (!audioBuf) { T.toast('Belum ada rekaman'); return; }
    const [s, e] = getRange();
    T.show(box, '<span class="dim">Menyiapkan WAV…</span>');
    await new Promise((r) => setTimeout(r, 30));
    try {
      const wav = encodeWav(s, e);
      T.dl('rekaman-' + Math.round(s) + '-' + Math.round(e) + 's.wav', wav, 'audio/wav');
      T.show(box, kv('Durasi potongan', fmtDur(e - s) + ' dari ' + fmtDur(audioBuf.duration)) + kv('Ukuran WAV', fmtBytes(wav.size)));
      T.toast('WAV diunduh');
    } catch (err) { T.show(box, errBox('Gagal membuat WAV.')); }
  });
  bWebm.disabled = true; bWav.disabled = true;

  bRekam.addEventListener('click', async () => {
    if (!supported) {
      T.show(box, errBox('Browser ini tidak mendukung perekaman suara. Coba Chrome atau Edge terbaru.'));
      return;
    }
    try {
      statusEl.textContent = 'Meminta izin mikrofon…';
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      T.show(box, errBox('Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di pengaturan browser, lalu coba lagi.'));
      statusEl.textContent = 'Mikrofon belum diizinkan';
      return;
    }
    chunks = [];
    blob = null; audioBuf = null;
    audioEl.hidden = true;
    bWebm.disabled = true; bWav.disabled = true;
    T.hide(box);
    try {
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) {
      cleanup();
      T.show(box, errBox('Perekam tidak bisa dimulai di browser ini.'));
      return;
    }
    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = async () => {
      recording = false;
      cancelAnimationFrame(rafId);
      clearInterval(tickId);
      blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(blob);
      audioEl.src = blobUrl;
      audioEl.hidden = false;
      statusEl.textContent = 'Rekaman selesai, dengarkan dulu sebelum diunduh';
      bWebm.disabled = false;
      try {
        const c = T.actx();
        audioBuf = await c.decodeAudioData(await blob.arrayBuffer());
        trimEnd.value = '';
        bWav.disabled = false;
        drawStatic();
        T.show(box, kv('Durasi', fmtDur(audioBuf.duration)) + kv('Ukuran WebM', fmtBytes(blob.size)));
      } catch (e) {
        audioBuf = null;
        drawIdle();
        T.show(box, '<p class="hint">Rekaman tersimpan, tapi formatnya tidak bisa dibaca untuk dipotong di browser ini. Unduhan WebM tetap bisa dipakai.</p>');
      }
      bRekam.disabled = false;
      bStop.disabled = true;
    };
    try {
      actx = T.actx();
      const srcNode = actx.createMediaStreamSource(stream);
      analyser = actx.createAnalyser();
      analyser.fftSize = 2048;
      srcNode.connect(analyser);
    } catch (e) { analyser = null; }
    rec.start(250);
    recording = true;
    t0 = Date.now();
    durEl.textContent = '00:00';
    statusEl.textContent = 'Merekam… ketuk Berhenti kalau sudah cukup';
    tickId = setInterval(() => { durEl.textContent = fmtDur((Date.now() - t0) / 1000); }, 500);
    if (analyser) drawLive();
    bRekam.disabled = true;
    bStop.disabled = false;
  });

  bStop.addEventListener('click', () => {
    if (rec && recording) {
      try { rec.stop(); } catch (e) {}
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  });

  [trimStart, trimEnd].forEach((i) => i.addEventListener('input', drawStatic));

  root.appendChild(T.el('<p class="note">Diproses di browser, rekaman tidak diunggah ke mana-mana.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Rekam langsung dari mikrofon, lihat gelombangnya, lalu unduh. Potong awal dan akhir berlaku untuk unduhan WAV; unduhan WebM berisi rekaman utuh.</p>'));
  if (!supported) {
    root.appendChild(T.el('<p class="err">Browser ini tidak mendukung perekaman suara (butuh MediaRecorder dan akses mikrofon). Coba Chrome atau Edge terbaru.</p>'));
  }
  root.appendChild(durEl);
  root.appendChild(statusEl);
  root.appendChild(wave);
  root.appendChild(T.row(bRekam, bStop));
  root.appendChild(audioEl);
  root.appendChild(T.grid2(T.field('Potong dari detik', trimStart), T.field('Sampai detik', trimEnd, 'Kosongkan bila sampai akhir.')));
  root.appendChild(T.row(bWebm, bWav));
  root.appendChild(box);
  drawIdle();
}
