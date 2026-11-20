import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "thumbnail-video", "name": "Thumbnail Video", "cat": "converter", "icon": "🖼️", "desc": "Tangkap satu frame video jadi gambar sampul.", "keywords": "video,thumbnail,frame,gambar,sampul,cover,jepret", "since": "6.17.0"};

// Hitung ukuran hasil dengan perbandingan yang sama. targetLebar 0 berarti
// pakai ukuran asli. Murni, bisa diuji di Node.
export function hitungUkuranSampul(w, h, targetLebar) {
  if (!w || !h) return { w: 0, h: 0 };
  if (!targetLebar || targetLebar >= w) return { w, h };
  return { w: targetLebar, h: Math.max(2, Math.round((h * targetLebar) / w)) };
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const prevBox = T.out();

  const waktuRange = document.createElement('input');
  waktuRange.type = 'range';
  waktuRange.min = '0';
  waktuRange.max = '0';
  waktuRange.step = '0.1';
  waktuRange.value = '0';
  waktuRange.style.width = '100%';
  const waktuLabel = T.el('<p class="dim" style="font-size:13px;margin:6px 0 0">Detik ke-0</p>');
  const waktuWrap = T.el('<div></div>');
  waktuWrap.hidden = true;
  waktuWrap.appendChild(T.field('Posisi frame di video', waktuRange));
  waktuWrap.appendChild(waktuLabel);

  const ukuranSel = T.select([
    ['0', 'Ukuran asli video'],
    ['1280', 'Lebar 1280 (HD)'],
    ['720', 'Lebar 720'],
    ['480', 'Lebar 480'],
  ], '0');
  const formatSel = T.select([
    ['png', 'PNG (kualitas penuh)'],
    ['jpeg', 'JPG (ukuran lebih kecil)'],
  ], 'png');

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  let fileObj = null;
  let duration = 0;
  let vw = 0;
  let vh = 0;
  let videoUrl = null;
  let busy = false;

  const fmtWaktu = (d) => {
    const mnt = Math.floor(d / 60);
    const dtk = (d % 60).toFixed(1);
    return mnt > 0 ? mnt + ' menit ' + dtk + ' detik' : dtk + ' detik';
  };

  const jepret = () => new Promise((resolve, reject) => {
    const t = Math.min(duration || 0, Math.max(0, parseFloat(waktuRange.value) || 0));
    const { w, h } = hitungUkuranSampul(vw, vh, Number(ukuranSel.value));
    if (!w || !h) { reject(new Error('Ukuran video tidak terbaca.')); return; }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      const tipe = formatSel.value === 'jpeg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Gambar tidak bisa dibuat.')); return; }
        resolve(blob);
      }, tipe, 0.92);
    };
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', () => reject(new Error('Video tidak bisa dibaca.')), { once: true });
    video.currentTime = t;
  });

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox); T.hide(prevBox);
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null; }
    if (!fileObj) { T.hide(infoBox); waktuWrap.hidden = true; return; }
    videoUrl = URL.createObjectURL(fileObj);
    const fDipilih = fileObj;
    video.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(video);
      if (fileObj !== fDipilih) return;
      duration = d;
      vw = video.videoWidth || 0;
      vh = video.videoHeight || 0;
      waktuRange.max = String(Math.max(0, duration - 0.05));
      waktuRange.value = '0';
      waktuLabel.textContent = 'Detik ke-0';
      waktuWrap.hidden = false;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? fmtWaktu(duration) : 'tidak terbaca') +
        kv('Ukuran layar', vw && vh ? vw + ' x ' + vh : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
    };
    video.onerror = () => {
      duration = 0; vw = 0; vh = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Video ini tidak bisa dibaca browser. Coba file MP4 atau WebM lain.</p>');
    };
    video.src = videoUrl;
  });
  waktuRange.addEventListener('input', () => {
    waktuLabel.textContent = 'Detik ke-' + (parseFloat(waktuRange.value) || 0).toFixed(1);
  });

  const goBtn = T.btn('Tangkap frame ini', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!duration) { T.show(outBox, errBox('Durasi video tidak terbaca, jadi posisi frame tidak bisa dipilih. Coba file MP4 atau WebM lain.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    try {
      const blob = await jepret();
      const ext = formatSel.value === 'jpeg' ? '.jpg' : '.png';
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
      const detik = (parseFloat(waktuRange.value) || 0).toFixed(1).replace('.', 'p');
      const nama = base + '-detik' + detik + ext;
      const url = URL.createObjectURL(blob);
      T.show(prevBox, '<p class="hint">Hasil tangkapan:</p>');
      const img = T.el('<img alt="Hasil tangkapan frame video" style="max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block">');
      img.src = url;
      prevBox.appendChild(img);
      prevBox.appendChild(T.row(T.btn('Unduh gambar', () => { T.dl(nama, blob, blob.type); T.toast('Gambar terunduh'); }, true)));
      T.show(outBox, '<span class="ok">Frame tertangkap.</span>' +
        kv('Posisi', fmtWaktu(parseFloat(waktuRange.value) || 0)) +
        kv('Ukuran gambar', blob.size ? fmtBytes(blob.size) : '-'));
      T.scrollToPreview(prevBox);
    } catch (e) {
      T.show(outBox, errBox((e && e.message) || 'Frame tidak bisa ditangkap. Coba posisi lain.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  T.onLeave(() => { if (videoUrl) URL.revokeObjectURL(videoUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Geser ke momen yang pas di video, lalu tangkap jadi gambar sampul untuk dibagikan atau dipakai sebagai cover.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(waktuWrap);
  root.appendChild(T.grid2(T.field('Ukuran gambar', ukuranSel), T.field('Format gambar', formatSel)));
  root.appendChild(T.row(goBtn));
  root.appendChild(outBox);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana.</p>'));
}
