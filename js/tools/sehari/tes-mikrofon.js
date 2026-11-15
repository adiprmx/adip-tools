import { h as T, kv } from '../../core.js?v=6.12.0';

export const meta = {"id": "tes-mikrofon", "name": "Tes Mikrofon", "cat": "sehari", "icon": "🎙️", "desc": "Lihat level suara mikrofon dan rekam sebentar untuk didengar ulang.", "keywords": "mikrofon,mic,suara,rekam,audio", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Tool ini memakai mikrofon perangkat untuk menampilkan level suara dan merekam sebentar. Suara hanya diproses di browser ini dan tidak dikirim ke mana-mana. Rekaman tersimpan di perangkat sampai halaman ditutup.</p>');
  const stateBox = T.out();
  const meterWrap = T.el('<div hidden></div>');
  const meterBar = T.el('<div style="height:14px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><div style="height:100%;width:0%;background:#fff;border-radius:7px"></div></div>');
  const meterLabel = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">0%</div>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:80px;border:1px solid rgba(255,255,255,.14);border-radius:12px;margin-top:10px';
  meterWrap.appendChild(meterLabel);
  meterWrap.appendChild(meterBar);
  meterWrap.appendChild(canvas);
  const recBox = T.out();

  let stream = null, actx = null, analyser = null, raf = null, recorder = null, recChunks = [], recTimer = null;

  const stopAll = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (recTimer) clearTimeout(recTimer);
    recTimer = null;
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch (e) {} }
    recorder = null;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (analyser) { try { analyser.disconnect(); } catch (e) {} analyser = null; }
    if (actx) { actx.close().catch(() => {}); actx = null; }
  };

  const drawLoop = () => {
    raf = requestAnimationFrame(drawLoop);
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / buf.length);
    const pct = Math.min(100, Math.round(rms * 300));
    meterLabel.textContent = pct + '%';
    meterBar.firstChild.style.width = pct + '%';
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth || 300;
    if (canvas.width !== w) { canvas.width = w; canvas.height = 80; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = Math.ceil(buf.length / canvas.width);
    for (let x = 0; x < canvas.width; x++) {
      const v = buf[x * step] / 255;
      const y = v * canvas.height;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const startRec = () => {
    if (!stream || !window.MediaRecorder) return;
    recChunks = [];
    try {
      recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
    } catch (e) {
      T.toast('Perekaman tidak didukung browser ini');
      return;
    }
    recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      T.show(recBox, '<p style="font-size:13px;margin:0 0 6px">Rekaman selesai, dengarkan:</p>');
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = url;
      audio.style.cssText = 'width:100%';
      recBox.appendChild(audio);
      recBox.appendChild(T.row(T.btn('⬇ Unduh rekaman', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'tes-mikrofon.webm';
        a.click();
      })));
      recBtn.textContent = '● Rekam 10 detik';
      recBtn.disabled = false;
    };
    recorder.start();
    recBtn.textContent = 'Merekam… (berhenti otomatis)';
    recBtn.disabled = true;
    recTimer = setTimeout(() => { if (recorder && recorder.state !== 'inactive') recorder.stop(); }, 10000);
  };

  const recBtn = T.btn('● Rekam 10 detik', startRec, true);
  const stopBtn = T.btn('Berhenti', () => {
    stopAll();
    meterWrap.hidden = true;
    T.hide(recBox);
    T.show(stateBox, '<p class="mut" style="font-size:13px">Mikrofon sudah dimatikan.</p>');
    startBtn.disabled = false;
  });
  const ctlRow = T.row(recBtn, stopBtn);
  ctlRow.hidden = true;

  const start = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      T.show(stateBox, '<div class="big warn">Browser ini tidak bisa mengakses mikrofon</div><p class="mut" style="font-size:13px">Coba browser terbaru, dan pastikan halaman dibuka lewat HTTPS.</p>');
      return;
    }
    startBtn.disabled = true;
    T.show(stateBox, '<p class="mut" style="font-size:13px">Menunggu izin mikrofon…</p>');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      startBtn.disabled = false;
      if (e && e.name === 'NotAllowedError') {
        T.show(stateBox, '<div class="big warn">Izin mikrofon ditolak</div><p class="mut" style="font-size:13px">Izinkan akses mikrofon di pengaturan browser, lalu coba lagi.</p>');
      } else if (e && e.name === 'NotFoundError') {
        T.show(stateBox, '<div class="big warn">Tidak ada mikrofon yang terdeteksi</div><p class="mut" style="font-size:13px">Perangkat ini tidak menemukan mikrofon yang bisa dipakai.</p>');
      } else {
        T.show(stateBox, '<div class="big warn">Mikrofon tidak bisa dibuka</div><p class="mut" style="font-size:13px">' + T.esc((e && e.message) || 'Terjadi kesalahan.') + '</p>');
      }
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      stopAll();
      startBtn.disabled = false;
      T.show(stateBox, '<div class="big warn">Browser ini tidak bisa menampilkan level suara</div>');
      return;
    }
    actx = new AC();
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    actx.createMediaStreamSource(stream).connect(analyser);
    const track = stream.getAudioTracks()[0];
    T.show(stateBox, kv('Mikrofon aktif', T.esc(track.label || 'Mikrofon')) + '<p class="mut" style="font-size:12px">Bicara atau buat suara. Batang naik berarti suara masuk.</p>');
    meterWrap.hidden = false;
    ctlRow.hidden = false;
    drawLoop();
  };

  const startBtn = T.btn('🎙️ Mulai tes mikrofon', start, true);

  T.onLeave(stopAll);

  root.appendChild(info);
  root.appendChild(T.row(startBtn));
  root.appendChild(stateBox);
  root.appendChild(meterWrap);
  root.appendChild(ctlRow);
  root.appendChild(recBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Diproses di browser. Tidak ada suara yang dikirim atau disimpan di server.</p>'));
}
