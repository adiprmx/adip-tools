import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "video-ke-frame", "name": "Video ke Frame", "cat": "converter", "icon": "📸", "desc": "Simpan frame-frame video jadi gambar.", "keywords": "video,frame,gambar,ekstrak,detik,cuplikan", "since": "6.17.0"};

const JSZIP_CDNS = [
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];
const MAKS_FRAME = 300;

// Daftar detik pengambilan frame untuk durasi dan jeda tertentu, dibatasi
// MAKS_FRAME. Murni, bisa diuji di Node.
export function rencanaFrame(durasi, jeda) {
  const out = [];
  const step = Math.max(0.1, jeda || 1);
  for (let t = 0; t < durasi && out.length < MAKS_FRAME; t += step) {
    out.push(Math.round(t * 10) / 10);
  }
  return out;
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const prevBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const jedaSel = T.select([
    ['0.5', 'Tiap setengah detik'],
    ['1', 'Tiap 1 detik'],
    ['2', 'Tiap 2 detik'],
    ['5', 'Tiap 5 detik'],
    ['10', 'Tiap 10 detik'],
  ], '1');
  const formatSel = T.select([
    ['jpeg', 'JPG (ukuran lebih kecil)'],
    ['png', 'PNG (kualitas penuh)'],
  ], 'jpeg');
  const ukuranSel = T.select([
    ['0', 'Ukuran asli video'],
    ['720', 'Lebar 720'],
    ['480', 'Lebar 480'],
  ], '0');

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

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox); T.hide(prevBox);
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null; }
    if (!fileObj) { T.hide(infoBox); return; }
    videoUrl = URL.createObjectURL(fileObj);
    video.onloadedmetadata = () => {
      duration = video.duration || 0;
      vw = video.videoWidth || 0;
      vh = video.videoHeight || 0;
      const rencana = rencanaFrame(duration, parseFloat(jedaSel.value));
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran layar', vw && vh ? vw + ' x ' + vh : 'tidak terbaca') +
        kv('Frame yang diambil', rencana.length + ' frame') +
        (duration / parseFloat(jedaSel.value) > MAKS_FRAME ? '<p class="hint" style="margin-top:8px">Video ini panjang, jadi hanya ' + MAKS_FRAME + ' frame pertama yang diambil. Pilih jeda lebih besar bila mau mencakup seluruh video.</p>' : ''));
    };
    video.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Video ini tidak bisa dibaca browser. Coba file MP4 atau WebM lain.</p>');
    };
    video.src = videoUrl;
  });
  jedaSel.addEventListener('change', () => {
    if (!fileObj || !duration) return;
    const rencana = rencanaFrame(duration, parseFloat(jedaSel.value));
    T.show(infoBox,
      kv('File', T.esc(fileObj.name)) +
      kv('Durasi', duration.toFixed(1) + ' detik') +
      kv('Ukuran layar', vw + ' x ' + vh) +
      kv('Frame yang diambil', rencana.length + ' frame') +
      (duration / parseFloat(jedaSel.value) > MAKS_FRAME ? '<p class="hint" style="margin-top:8px">Video ini panjang, jadi hanya ' + MAKS_FRAME + ' frame pertama yang diambil. Pilih jeda lebih besar bila mau mencakup seluruh video.</p>' : ''));
  });

  const tangkapPada = (detik) => new Promise((resolve, reject) => {
    const w = Number(ukuranSel.value);
    const tw = w && w < vw ? w : vw;
    const th = w && w < vw ? Math.max(2, Math.round((vh * w) / vw)) : vh;
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tw, th);
      const tipe = formatSel.value === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Gambar tidak bisa dibuat.')); return; }
        resolve(blob);
      }, tipe, 0.92);
    };
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', () => reject(new Error('Video tidak bisa dibaca.')), { once: true });
    video.currentTime = Math.min(detik, Math.max(0, duration - 0.05));
  });

  const goBtn = T.btn('Ambil frame', async () => {
    if (busy) return;
    if (!fileObj || !duration) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox); T.hide(prevBox);
    barWrap.hidden = false;
    const rencana = rencanaFrame(duration, parseFloat(jedaSel.value));
    const ext = formatSel.value === 'png' ? '.png' : '.jpg';
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    const frames = [];
    let batal = false;
    cancelBtn.onclick = () => { batal = true; };
    try {
      for (let i = 0; i < rencana.length; i++) {
        if (batal) break;
        const pct = Math.round((i / rencana.length) * 100);
        barFill.style.width = pct + '%';
        barLabel.textContent = 'Mengambil frame ' + (i + 1) + ' dari ' + rencana.length + '…';
        try {
          const blob = await tangkapPada(rencana[i]);
          frames.push({ nama: base + '-detik' + rencana[i].toFixed(1).replace('.', 'p') + ext, blob });
        } catch (e) { /* satu frame gagal dilewati, sisanya lanjut */ }
      }
      if (batal) {
        T.show(outBox, '<span class="dim">Dibatalkan. ' + frames.length + ' frame sempat diambil tapi tidak diunduh.</span>');
        return;
      }
      if (!frames.length) { T.show(outBox, errBox('Tidak ada frame yang berhasil diambil. Coba video lain.')); return; }
      barFill.style.width = '100%';
      barLabel.textContent = 'Menyiapkan alat ZIP…';
      // Loader library kanonis: utils.loadLibOnce (core.js).
      const ok = await utils.loadLibOnce(JSZIP_CDNS, () => typeof window.JSZip === 'function');
      if (!ok) { T.show(outBox, errBox('Alat ZIP tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.')); return; }
      barLabel.textContent = 'Menggabungkan ' + frames.length + ' frame jadi ZIP…';
      const zip = new window.JSZip();
      frames.forEach((fr) => zip.file(fr.nama, fr.blob));
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      T.dl(base + '-frame.zip', zipBlob, 'application/zip');
      T.show(outBox, '<span class="ok">Selesai. ZIP berisi ' + frames.length + ' frame terunduh.</span>' +
        kv('Frame diambil', frames.length + ' frame') +
        kv('Ukuran ZIP', fmtBytes(zipBlob.size)));
      T.show(prevBox, '<p class="hint">Pratinjau frame awal:</p>');
      const strip = T.el('<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px"></div>');
      frames.slice(0, 6).forEach((fr) => {
        const im = T.el('<img alt="Pratinjau frame" style="height:90px;width:auto;border-radius:8px;border:1px solid #ffffff20;flex-shrink:0">');
        im.src = URL.createObjectURL(fr.blob);
        strip.appendChild(im);
      });
      prevBox.appendChild(strip);
      T.toast('ZIP frame terunduh');
    } catch (e) {
      T.show(outBox, errBox('Frame tidak bisa diambil. Coba lagi.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      outBox.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);
  const cancelBtn = T.btn('Batalkan', () => {});
  cancelBtn.hidden = true;

  T.onLeave(() => { if (videoUrl) URL.revokeObjectURL(videoUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Simpan momen-momen video jadi gambar, tiap beberapa detik sekali. Semua frame dikemas jadi satu file ZIP.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Jeda antar frame', jedaSel), T.field('Format gambar', formatSel)));
  root.appendChild(T.field('Ukuran gambar', ukuranSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana.</p>'));
}
