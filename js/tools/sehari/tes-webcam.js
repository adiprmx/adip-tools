import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-webcam", "name": "Tes Webcam", "cat": "sehari", "icon": "📹", "desc": "Lihat pratinjau kamera dan cek resolusi yang benar-benar dipakai.", "keywords": "webcam,kamera,video,resolusi,tes kamera", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Tool ini memakai kamera perangkat untuk pratinjau video. Gambar hanya tampil di browser ini dan tidak dikirim ke mana-mana. Foto yang diambil tersimpan di perangkat.</p>');
  const stateBox = T.out();
  const videoWrap = T.el('<div hidden></div>');
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.style.cssText = 'display:block;width:100%;border-radius:12px;background:#000;max-height:360px';
  videoWrap.appendChild(video);
  const shotBox = T.out();

  let stream = null, raf = null, fpsCount = 0, fpsShown = false;

  const stopAll = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    video.srcObject = null;
  };

  const paintInfo = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const s = track.getSettings();
    const w = s.width || video.videoWidth || 0;
    const h = s.height || video.videoHeight || 0;
    T.show(stateBox,
      kv('Kamera aktif', T.esc(track.label || 'Kamera')) +
      kv('Resolusi yang dipakai', (w && h) ? w + ' × ' + h + ' px' : 'Belum terbaca') +
      kv('Kecepatan gambar', fpsShown ? fpsCount + ' gambar/detik (perkiraan)' : 'Mengukur…'));
  };

  const measureFps = () => {
    if (!stream) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      let frames = 0, t0 = performance.now();
      const cb = () => {
        frames++;
        if (performance.now() - t0 >= 1000) {
          fpsCount = frames;
          fpsShown = true;
          paintInfo();
          frames = 0; t0 = performance.now();
        }
        if (stream) video.requestVideoFrameCallback(cb);
      };
      video.requestVideoFrameCallback(cb);
    } else {
      fpsShown = false;
      T.show(stateBox, (stateBox.innerHTML || '').replace('Mengukur…', 'Tidak bisa diukur di browser ini'));
    }
  };

  const camSelect = T.select([], '');
  const switchCam = async () => {
    const id = camSelect.value;
    if (!id || !stream) return;
    stopAll();
    await start(id);
  };
  camSelect.addEventListener('change', switchCam);

  const takeShot = () => {
    if (!video.videoWidth) { T.toast('Video belum siap'); return; }
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    T.show(shotBox, '<p style="font-size:13px;margin:0 0 6px">Foto dari webcam (' + c.width + ' × ' + c.height + ' px):</p>');
    const img = document.createElement('img');
    img.src = c.toDataURL('image/png');
    img.style.cssText = 'display:block;width:100%;border-radius:12px';
    img.alt = 'Foto dari webcam';
    shotBox.appendChild(img);
    shotBox.appendChild(T.row(T.btn('⬇ Unduh foto (PNG)', () => {
      const a = document.createElement('a');
      a.href = img.src; a.download = 'tes-webcam.png';
      a.click();
    })));
  };

  const stopBtn = T.btn('Berhenti', () => {
    stopAll();
    videoWrap.hidden = true;
    ctlRow.hidden = true;
    T.hide(shotBox);
    T.show(stateBox, '<p class="mut" style="font-size:13px">Kamera sudah dimatikan.</p>');
    startBtn.disabled = false;
  });
  const ctlRow = T.row(T.btn('📸 Ambil foto', takeShot, true), stopBtn);
  ctlRow.hidden = true;
  const camRow = T.el('<div hidden></div>');
  camRow.appendChild(T.field('Pilih kamera', camSelect));
  camRow.hidden = true;

  const start = async (deviceId) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      T.show(stateBox, '<div class="big warn">Browser ini tidak bisa mengakses kamera</div><p class="mut" style="font-size:13px">Coba browser terbaru, dan pastikan halaman dibuka lewat HTTPS.</p>');
      return;
    }
    startBtn.disabled = true;
    T.show(stateBox, '<p class="mut" style="font-size:13px">Menunggu izin kamera…</p>');
    try {
      stream = await navigator.mediaDevices.getUserMedia(deviceId ? { video: { deviceId: { exact: deviceId } } } : { video: true });
    } catch (e) {
      startBtn.disabled = false;
      if (e && e.name === 'NotAllowedError') {
        T.show(stateBox, '<div class="big warn">Izin kamera ditolak</div><p class="mut" style="font-size:13px">Izinkan akses kamera di pengaturan browser, lalu coba lagi.</p>');
      } else if (e && e.name === 'NotFoundError') {
        T.show(stateBox, '<div class="big warn">Tidak ada kamera yang terdeteksi</div><p class="mut" style="font-size:13px">Perangkat ini tidak menemukan kamera yang bisa dipakai.</p>');
      } else {
        T.show(stateBox, '<div class="big warn">Kamera tidak bisa dibuka</div><p class="mut" style="font-size:13px">Coba tutup aplikasi lain yang memakai kamera, lalu coba lagi.</p>');
      }
      return;
    }
    video.srcObject = stream;
    try { await video.play(); } catch (e) {}
    videoWrap.hidden = false;
    ctlRow.hidden = false;
    fpsShown = false;
    paintInfo();
    measureFps();
    video.addEventListener('loadedmetadata', paintInfo, { once: true });
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter((d) => d.kind === 'videoinput');
      if (cams.length > 1) {
        const cur = stream.getVideoTracks()[0];
        const curId = cur ? cur.getSettings().deviceId : '';
        camSelect.innerHTML = '';
        cams.forEach((c, i) => {
          const o = document.createElement('option');
          o.value = c.deviceId;
          o.textContent = c.label || ('Kamera ' + (i + 1));
          if (c.deviceId === curId) o.selected = true;
          camSelect.appendChild(o);
        });
        camRow.hidden = false;
      }
    } catch (e) {}
  };

  const startBtn = T.btn('📹 Mulai tes webcam', () => start(null), true);

  T.onLeave(stopAll);

  root.appendChild(info);
  root.appendChild(T.row(startBtn));
  root.appendChild(stateBox);
  root.appendChild(camRow);
  root.appendChild(videoWrap);
  root.appendChild(ctlRow);
  root.appendChild(shotBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Resolusi yang tampil adalah resolusi yang benar-benar dipakai browser, bukan angka di boks kamera. Diproses di browser.</p>'));
}
