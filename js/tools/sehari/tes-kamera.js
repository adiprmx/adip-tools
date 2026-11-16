import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "tes-kamera", "name": "Tes Kamera Foto", "cat": "sehari", "icon": "📷", "desc": "Ambil foto dari kamera, lihat hasilnya, dan unduh.", "keywords": "kamera,foto,ambil foto,selfie,tes kamera", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Tool ini untuk mengambil foto. Untuk tes video dan resolusi webcam, pakai Tes Webcam. Foto hanya tersimpan di perangkat, tidak dikirim ke mana-mana.</p>');
  const stateBox = T.out();
  const videoWrap = T.el('<div hidden></div>');
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.style.cssText = 'display:block;width:100%;border-radius:12px;background:#000;max-height:360px';
  videoWrap.appendChild(video);
  const shotBox = T.out();

  let stream = null;
  let facing = 'environment';

  const stopAll = () => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    video.srcObject = null;
  };

  const camSelect = T.select([], '');
  const camRow = T.el('<div hidden></div>');
  camRow.appendChild(T.field('Pilih kamera', camSelect));

  const takePhoto = () => {
    if (!video.videoWidth) { T.toast('Kamera belum siap'); return; }
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const url = c.toDataURL('image/jpeg', 0.92);
    T.show(shotBox, '<p style="font-size:13px;margin:0 0 6px">Foto diambil (' + c.width + ' × ' + c.height + ' px):</p>');
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'display:block;width:100%;border-radius:12px';
    img.alt = 'Foto dari kamera';
    shotBox.appendChild(img);
    shotBox.appendChild(T.row(T.btn('⬇ Unduh foto (JPG)', () => {
      const a = document.createElement('a');
      a.href = url; a.download = 'tes-kamera.jpg';
      a.click();
    }, true)));
  };

  const flipBtn = T.btn('🔄 Kamera depan / belakang', async () => {
    facing = facing === 'environment' ? 'user' : 'environment';
    camSelect.value = '';
    await start(null);
  });
  const stopBtn = T.btn('Berhenti', () => {
    stopAll();
    videoWrap.hidden = true;
    ctlRow.hidden = true;
    camRow.hidden = true;
    T.hide(shotBox);
    T.show(stateBox, '<p class="mut" style="font-size:13px">Kamera sudah dimatikan.</p>');
    startBtn.disabled = false;
  });
  const ctlRow = T.row(T.btn('📷 Ambil foto', takePhoto, true), flipBtn, stopBtn);
  ctlRow.hidden = true;

  camSelect.addEventListener('change', async () => {
    if (!camSelect.value) return;
    await start(camSelect.value);
  });

  const start = async (deviceId) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      T.show(stateBox, '<div class="big warn">Browser ini tidak bisa mengakses kamera</div><p class="mut" style="font-size:13px">Coba browser terbaru, dan pastikan halaman dibuka lewat HTTPS.</p>');
      return;
    }
    stopAll();
    startBtn.disabled = true;
    T.show(stateBox, '<p class="mut" style="font-size:13px">Menunggu izin kamera…</p>');
    const constraints = deviceId
      ? { video: { deviceId: { exact: deviceId } } }
      : { video: { facingMode: facing } };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // Kamera depan/belakang tidak selalu tersedia di semua perangkat, coba kamera mana saja.
      if (!deviceId && e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
        catch (e2) { e = e2; }
      }
      if (!stream) {
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
    }
    video.srcObject = stream;
    try { await video.play(); } catch (e) {}
    videoWrap.hidden = false;
    ctlRow.hidden = false;
    const track = stream.getVideoTracks()[0];
    const s = track ? track.getSettings() : {};
    T.show(stateBox, kv('Kamera aktif', T.esc(track && track.label ? track.label : 'Kamera')) +
      kv('Resolusi pratinjau', (s.width && s.height) ? s.width + ' × ' + s.height + ' px' : 'Belum terbaca'));
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter((d) => d.kind === 'videoinput');
      if (cams.length > 1) {
        camSelect.innerHTML = '';
        const curId = track ? s.deviceId : '';
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

  const startBtn = T.btn('📷 Mulai tes kamera', () => start(null), true);

  T.onLeave(stopAll);

  root.appendChild(info);
  root.appendChild(T.row(startBtn));
  root.appendChild(stateBox);
  root.appendChild(camRow);
  root.appendChild(videoWrap);
  root.appendChild(ctlRow);
  root.appendChild(shotBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Foto diambil dari pratinjau video, jadi ukurannya mengikuti resolusi video browser, bukan resolusi penuh kamera. Diproses di browser.</p>'));
}
