import { h as T, kv, fmtBytes, errBox, p2 } from '../../core.js';

export const meta = {"id": "perekam-webcam", "name": "Perekam Webcam", "cat": "converter", "icon": "📹", "desc": "Rekam video dari kamera HP atau laptop, langsung unduh.", "keywords": "webcam,rekam,video,kamera,rekam video", "since": "6.19.0"};

// Pilih format rekaman yang didukung browser. Fungsi murni, diuji di Node
// dengan fungsi isTypeSupported tiruan.
export function pilihMimeVideo(isTypeSupported) {
  const cek = typeof isTypeSupported === 'function' ? isTypeSupported : () => false;
  const kandidat = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const k of kandidat) {
    try { if (cek(k)) return k; } catch (e) {}
  }
  return '';
}

export function render(root) {
  const didukung = typeof MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const kameraSel = T.select([['user', 'Kamera depan'], ['environment', 'Kamera belakang']], 'user');
  const resolusiSel = T.select([
    ['720', 'HD (720p)'],
    ['480', 'SD (480p, file lebih kecil)'],
    ['1080', 'Full HD (1080p, file besar)'],
  ], '720');
  const videoWrap = T.el('<div hidden></div>');
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.style.cssText = 'display:block;width:100%;border-radius:12px;background:#000;max-height:360px';
  videoWrap.appendChild(video);
  const timerDisp = T.el('<div class="big center" style="font-size:32px" hidden>00:00</div>');
  const statusBox = T.out();
  const hasilBox = T.out();

  let stream = null, rec = null, potongan = [], timer = null, detik = 0, merekam = false, mimeDipakai = '';

  const gambarTimer = () => {
    timerDisp.textContent = p2(Math.floor(detik / 60)) + ':' + p2(detik % 60);
  };

  const stopStream = () => {
    if (stream) { stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} }); stream = null; }
    video.srcObject = null;
    videoWrap.hidden = true;
  };

  const stopSemua = () => {
    if (timer) { clearInterval(timer); timer = null; }
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
    rec = null;
    merekam = false;
    stopStream();
  };

  const refreshTombol = () => {
    mulaiBtn.disabled = !didukung || merekam || !stream;
    berhentiBtn.disabled = !merekam;
    kameraBtn.disabled = !didukung || merekam;
  };

  const bukaKamera = async () => {
    T.hide(hasilBox);
    try {
      stopStream();
      const tinggi = Number(resolusiSel.value);
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: kameraSel.value, width: { ideal: 1280 }, height: { ideal: tinggi } },
        audio: true,
      });
      video.srcObject = stream;
      await video.play();
      videoWrap.hidden = false;
      const track = stream.getVideoTracks()[0];
      const s = track ? track.getSettings() : {};
      T.show(statusBox,
        kv('Kamera aktif', T.esc((track && track.label) || 'Kamera')) +
        kv('Resolusi yang dipakai', (s.width && s.height) ? s.width + ' x ' + s.height + ' px' : 'Belum terbaca'));
    } catch (e) {
      T.show(statusBox, errBox('Kamera tidak bisa dibuka. Izinkan akses kamera dan mikrofon di browser, lalu coba lagi.'));
    }
    refreshTombol();
  };

  const mulaiRekam = () => {
    if (!stream || merekam) return;
    potongan = [];
    mimeDipakai = pilihMimeVideo((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
    try {
      rec = mimeDipakai ? new MediaRecorder(stream, { mimeType: mimeDipakai }) : new MediaRecorder(stream);
    } catch (e) {
      T.show(statusBox, errBox('Browser ini tidak bisa merekam video. Coba Chrome atau Edge terbaru.'));
      return;
    }
    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) potongan.push(ev.data); };
    rec.onstop = () => {
      const tipe = mimeDipakai || rec.mimeType || 'video/webm';
      const blob = new Blob(potongan, { type: tipe });
      const ext = /mp4/.test(tipe) ? '.mp4' : '.webm';
      const url = URL.createObjectURL(blob);
      const putar = document.createElement('video');
      putar.controls = true;
      putar.playsInline = true;
      putar.src = url;
      putar.style.cssText = 'display:block;width:100%;border-radius:12px;background:#000;max-height:360px;margin-top:8px';
      T.show(hasilBox,
        '<span class="ok">Rekaman selesai.</span>' +
        kv('Durasi', detik + ' detik') +
        kv('Ukuran', fmtBytes(blob.size)));
      hasilBox.appendChild(putar);
      hasilBox.appendChild(T.row(T.dlBtn('rekaman-webcam' + ext, () => blob, tipe, 'Unduh video')));
      T.toast('Rekaman selesai');
    };
    rec.start(250);
    merekam = true;
    detik = 0;
    gambarTimer();
    timerDisp.hidden = false;
    timer = setInterval(() => { detik += 1; gambarTimer(); }, 1000);
    refreshTombol();
  };

  const berhentiRekam = () => {
    if (!merekam) return;
    if (timer) { clearInterval(timer); timer = null; }
    merekam = false;
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
    refreshTombol();
  };

  const kameraBtn = T.btn('Buka kamera', bukaKamera, true);
  const mulaiBtn = T.btn('Mulai rekam', mulaiRekam);
  const berhentiBtn = T.btn('Berhenti', berhentiRekam);
  mulaiBtn.disabled = true;
  berhentiBtn.disabled = true;

  kameraSel.addEventListener('change', () => { if (stream && !merekam) bukaKamera(); });
  resolusiSel.addEventListener('change', () => { if (stream && !merekam) bukaKamera(); });
  T.onLeave(stopSemua);

  if (!didukung) {
    root.appendChild(T.el('<p class="err">Browser ini tidak mendukung perekaman video (butuh MediaRecorder dan akses kamera). Coba Chrome atau Edge terbaru.</p>'));
    return;
  }

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Buka kamera, tekan rekam, berhenti kapan saja, lalu unduh videonya. Rekaman tersimpan di perangkatmu, tidak diunggah ke mana-mana.</p>'));
  root.appendChild(T.grid2(T.field('Kamera', kameraSel), T.field('Resolusi', resolusiSel)));
  root.appendChild(T.row(kameraBtn));
  root.appendChild(videoWrap);
  root.appendChild(timerDisp);
  root.appendChild(statusBox);
  root.appendChild(T.row(mulaiBtn, berhentiBtn));
  root.appendChild(hasilBox);
}
