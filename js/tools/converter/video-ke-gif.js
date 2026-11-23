// MERGE B21 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = video-ke-gif (survivor), arah B = gif-ke-video (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, kv, fmtBytes, errBox, utils, fileInput, LOCAL_NOTE } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "video-ke-gif", "name": "Video ↔ GIF", "cat": "converter", "icon": "🎞️", "desc": "Potong video jadi GIF bergerak, atau ubah GIF jadi video MP4/WebM.", "keywords": "video,gif,animasi,bergerak,stiker,meme,gif ke video,video ke gif,mp4,webm,ubah gif", "since": "6.11.0", "online": true};


// ---------- Mesin arah B: GIF → Video (dari gif-ke-video.js) ----------
const GIFUCT_CDN = 'https://esm.sh/gifuct-js@2.1.2';
const MAKS_FRAME = 300;
const MAKS_DURASI_MS = 60000;

// Susun frame-frame GIF mentah jadi gambar utuh per frame (murni, tanpa DOM).
// Sama seperti di pecah-gif-jadi-frame: menghormati disposal 2 dan 3.
// susunFrame kanonis tinggal di utils (core.js).

// Total durasi dari jeda tiap frame (murni, bisa diuji). Jeda di bawah
// 20ms dinaikkan ke 20ms supaya video tidak kelewat cepat.
export function totalDurasi(jedas) {
  return jedas.reduce((s, j) => s + Math.max(20, Number(j) || 100), 0);
}

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderVideoKeGif(panel) {
  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#fff;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  // Input angka desimal: T.input('text') + inputMode, bukan T.input('number'),
  // supaya koma desimal Indonesia tidak bermasalah.
  const startIn = T.input('text', '0', '0'); startIn.inputMode = 'decimal';
  const durIn = T.input('text', '1-10', '3'); durIn.inputMode = 'decimal';
  const wSel = T.select([['320', '320 px (kecil, ringan)'], ['480', '480 px (seimbang)'], ['640', '640 px (besar)']], '480');
  const fpsSel = T.select([['8', '8 gambar/detik (paling ringan)'], ['10', '10 gambar/detik'], ['12', '12 gambar/detik'], ['15', '15 gambar/detik (paling halus)']], '10');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // parseNum kanonis tinggal di utils (core.js).

  const goBtn = T.btn('Buat GIF', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    let start = Math.max(0, utils.parseNum(startIn.value, 0));
    let dur = Math.min(10, Math.max(0.5, utils.parseNum(durIn.value, 3)));
    if (duration > 0) {
      if (start >= duration) { T.show(outBox, errBox('Detik mulai melewati durasi video (' + duration.toFixed(1) + ' detik).')); return; }
      dur = Math.min(dur, duration - start);
    }
    const width = wSel.value, fps = fpsSel.value;
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
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
      // Dua langkah sesuai resep resmi FFmpeg: buat palet warna dulu dari
      // potongan video, lalu pakai palet itu supaya GIF warnanya bagus dan
      // ukurannya wajar.
      setStage('Langkah 1 dari 2: menyiapkan warna…', 10);
      await runFFmpeg(ffmpeg, ['-ss', String(start), '-t', String(dur), '-i', inName,
        '-vf', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos,palettegen=stats_mode=diff',
        '-y', 'palette.png']);
      setStage('Langkah 2 dari 2: membuat GIF… 0%', 50);
      await runFFmpeg(ffmpeg, ['-ss', String(start), '-t', String(dur), '-i', inName, '-i', 'palette.png',
        '-filter_complex', '[0:v]fps=' + fps + ',scale=' + width + ':-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
        '-y', 'output.gif'], (p) => {
        const pct = 50 + Math.round(p * 50);
        setStage('Langkah 2 dari 2: membuat GIF… ' + Math.round(p * 100) + '%', pct);
      });
      const data = await ffmpeg.readFile('output.gif');
      await cleanupFFmpeg(ffmpeg, [inName, 'palette.png', 'output.gif']);
      const blob = new Blob([data], { type: 'image/gif' });
      T.dl(base + '.gif', blob, 'image/gif');
      T.show(outBox, '<span class="ok">Selesai. GIF terunduh.</span>' +
        kv('Potongan', 'detik ' + start.toFixed(1) + ' sampai ' + (start + dur).toFixed(1) + ' (' + dur.toFixed(1) + ' detik)') +
        kv('Ukuran GIF', fmtBytes(blob.size)));
      T.toast('GIF terunduh');
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
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)) +
        (duration ? '' : '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, jadi titik mulai tidak bisa diperiksa dulu. Bila hasilnya kosong, coba mulai dari detik 0.</p>'));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil sepotong video jadi GIF yang bergerak. GIF tidak punya suara dan ukurannya bisa lebih besar dari video aslinya, jadi potongan pendek dan lebar kecil hasilnya paling ringan.</p>'));
  panel.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  panel.appendChild(infoBox);
  panel.appendChild(T.grid2(T.field('Mulai (detik)', startIn), T.field('Durasi GIF (detik, maks 10)', durIn)));
  panel.appendChild(T.grid2(T.field('Lebar GIF', wSel), T.field('Kehalusan gerak', fpsSel)));
  panel.appendChild(T.row(goBtn, cancelBtn));
  panel.appendChild(barWrap);
  panel.appendChild(outBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}

function renderGifKeVideo(panel) {
  const fi = fileInput('.gif,image/gif');
  const fmtSel = T.select([['webm', 'WebM (bisa di semua browser)'], ['mp4', 'MP4 (bila browser mendukung)']], 'webm');
  const statusBox = T.out();
  const infoBox = T.out();
  const hasilBox = T.out();

  let gifuctSiap = null;
  let fileAsli = null;
  let namaFile = 'gif';

  const muatGifuct = () => {
    if (!gifuctSiap) {
      gifuctSiap = import(/* @vite-ignore */ GIFUCT_CDN).then((m) => {
        if (typeof m.parseGIF !== 'function' || typeof m.decompressFrames !== 'function') throw new Error('api gifuct tidak lengkap');
        return m;
      }).catch((e) => { gifuctSiap = null; throw e; });
    }
    return gifuctSiap;
  };

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    fileAsli = f;
    namaFile = (f.name || 'gif').replace(/\.[^.]*$/, '');
    T.hide(hasilBox); T.hide(statusBox);
    T.show(infoBox, `<div class="kv"><span>Ukuran GIF</span><b>${fmtBytes(f.size)}</b></div><p class="dim">Tekan tombolnya untuk mengubah jadi video. Prosesnya memutar GIF sekali penuh, jadi tunggu sampai selesai.</p>`);
    buatB.disabled = false;
  });

  async function buat() {
    if (!fileAsli) { T.toast('Pilih file GIF dulu'); return; }
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      T.show(statusBox, '<div class="err">Browser ini tidak bisa merekam video dari canvas. Coba browser lain yang lebih baru.</div>');
      return;
    }
    T.hide(hasilBox);
    buatB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat pembaca GIF… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatGifuct();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembaca GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca GIF…</span>');
      const buf = await fileAsli.arrayBuffer();
      const gif = lib.parseGIF(buf);
      const frames = lib.decompressFrames(gif, true);
      if (!frames.length) throw new Error('tidak ada frame');
      const w = gif.lsd.width, h = gif.lsd.height;
      const pakai = frames.slice(0, MAKS_FRAME);
      const jedas = pakai.map((f) => f.delay);
      let durasi = totalDurasi(jedas);
      let jumlah = pakai.length;
      // GIF yang durasinya kelewat panjang dipotong supaya perekaman tidak menggantung.
      if (durasi > MAKS_DURASI_MS) {
        let akumulasi = 0;
        jumlah = 0;
        for (const j of jedas) {
          akumulasi += Math.max(20, Number(j) || 100);
          if (akumulasi > MAKS_DURASI_MS) break;
          jumlah++;
        }
        jumlah = Math.max(1, jumlah);
        durasi = totalDurasi(jedas.slice(0, jumlah));
      }
      const susun = utils.susunFrame(pakai.slice(0, jumlah), w, h);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      // Pilih format yang benar-benar didukung browser ini.
      let mime = '';
      let ekstensi = 'webm';
      if (fmtSel.value === 'mp4' && window.MediaRecorder.isTypeSupported('video/mp4')) {
        mime = 'video/mp4'; ekstensi = 'mp4';
      } else if (fmtSel.value === 'mp4') {
        T.show(statusBox, '<div class="err">Browser ini belum bisa merekam MP4, jadi hasilnya WebM. Videonya tetap bisa diputar di mana saja.</div>');
        await new Promise((r) => setTimeout(r, 1200));
        mime = 'video/webm;codecs=vp9';
        if (!window.MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      } else {
        mime = 'video/webm;codecs=vp9';
        if (!window.MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      }
      const stream = c.captureStream(30);
      const rekam = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5000000 } : { videoBitsPerSecond: 5000000 });
      const potongan = [];
      rekam.ondataavailable = (e) => { if (e.data && e.data.size) potongan.push(e.data); };
      const selesai = new Promise((res, rej) => {
        rekam.onstop = res;
        rekam.onerror = () => rej(new Error('rekam gagal'));
      });
      // Gambar frame pertama dulu supaya perekam tidak mulai dari hitam.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(susun[0]), w, h), 0, 0);
      rekam.start(250);
      const mulai = performance.now();
      const jedaKumulatif = [];
      let ak = 0;
      for (let i = 0; i < jumlah; i++) { jedaKumulatif.push(ak); ak += Math.max(20, Number(jedas[i]) || 100); }
      await new Promise((res) => {
        let idx = 0;
        const langkah = () => {
          const berlalu = performance.now() - mulai;
          while (idx + 1 < jumlah && berlalu >= jedaKumulatif[idx + 1]) idx++;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.putImageData(new ImageData(new Uint8ClampedArray(susun[idx]), w, h), 0, 0);
          if (berlalu < durasi) {
            T.show(statusBox, `<span class="dim">Merekam video… ${Math.min(100, Math.round((berlalu / durasi) * 100))}%</span>`);
            requestAnimationFrame(langkah);
          } else res();
        };
        requestAnimationFrame(langkah);
      });
      // Beri sedikit waktu supaya frame terakhir ikut terekam.
      await new Promise((r) => setTimeout(r, 300));
      rekam.stop();
      await selesai;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(potongan, { type: rekam.mimeType || mime || 'video/webm' });
      if (!blob.size) throw new Error('video kosong');
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(hasilBox, '');
      const vid = document.createElement('video');
      vid.src = url; vid.controls = true; vid.loop = true; vid.playsInline = true;
      vid.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background:#000';
      hasilBox.appendChild(vid);
      hasilBox.appendChild(T.el(`<p class="dim">Video ${ekstensi.toUpperCase()}, ${fmtBytes(blob.size)}.${jumlah < frames.length ? ' GIF dipotong karena durasinya panjang.' : ''}</p>`));
      hasilBox.appendChild(T.btn('Unduh Video', () => { T.dl(`${namaFile}.${ekstensi}`, blob, blob.type); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat video. Pastikan filenya GIF asli, lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      buatB.disabled = false;
    }
  }

  const buatB = T.btn('Ubah jadi Video', buat, true, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.field('Pilih file GIF', fi));
  panel.appendChild(T.field('Format video', fmtSel, 'MP4 lebih luas dipakai, tapi tidak semua browser bisa merekamnya.'));
  panel.appendChild(statusBox);
  panel.appendChild(infoBox);
  panel.appendChild(buatB);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderVideoKeGif(panelA);
  renderGifKeVideo(panelB);
  root.appendChild(buatSakelarArah('Video → GIF', 'GIF → Video', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
