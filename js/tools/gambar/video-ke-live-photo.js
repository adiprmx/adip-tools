import { h as T, LOCAL_NOTE, fileInput, canvasToBlob, fmtBytes, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg } from '../../ffmpeg-loader.js';

// Video ke Live Photo: buat pasangan Live Photo Apple (foto JPG + video
// MOV) dari satu video. Keduanya ditautkan dengan pengenal yang sama:
// pengenal tertulis di MakerNote EXIF foto (tag Apple 0x0011) dan di
// metadata MOV (com.apple.quicktime.content.identifier). Foto diam diambil
// dari detik yang dipilih, videonya klip 3 detik di sekitar detik itu.
//
// Foto diam dibuat 100% lokal (tanpa internet). Video MOV memakai ffmpeg
// di peramban (perlu internet sekali untuk memuat mesinnya, ~31 MB).
// Pasangan yang dihasilkan perlu dicek di iPhone asli (aplikasi Foto)
// karena Apple tidak mempublikasikan format ini secara resmi.
export const meta = {"id": "video-ke-live-photo", "name": "Video ke Live Photo", "cat": "gambar", "icon": "📱", "desc": "Buat pasangan Live Photo Apple (foto + video) dari satu video.", "keywords": "live photo,apple,iphone,mov,jpg,pasangan,foto bergerak", "since": "6.19.0", "online": true};

const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';

// Buat UUID v4 (pakai crypto bila ada). Fungsi murni.
export function buatUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const acak = () => Math.floor(Math.random() * 256);
  const b = [];
  for (let i = 0; i < 16; i++) b.push(acak());
  b[6] = (b[6] & 0x0F) | 0x40;
  b[8] = (b[8] & 0x3F) | 0x80;
  const hex = b.map((v) => v.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
}

// Bangun byte TIFF EXIF (little-endian) berisi MakerNote Apple dengan
// ContentIdentifier (tag 0x0011). Struktur MakerNote mengikuti yang dibaca
// ExifTool: "Apple iOS\0" + header TIFF big-endian + IFD satu entri.
// Fungsi murni.
export function bangunExifLivePhoto(uuid) {
  const teks = uuid + '\0';
  const teksByte = new Uint8Array(teks.length);
  for (let i = 0; i < teks.length; i++) teksByte[i] = teks.charCodeAt(i);
  // MakerNote: 10 header + 8 TIFF header + 2 jumlah + 12 entri + 4 next + teks.
  const mnLen = 10 + 8 + 2 + 12 + 4 + teksByte.length;
  const mn = new Uint8Array(mnLen);
  const kepala = 'Apple iOS\0';
  for (let i = 0; i < 10; i++) mn[i] = kepala.charCodeAt(i);
  mn[10] = 0x4D; mn[11] = 0x4D; // "MM" big-endian
  mn[12] = 0; mn[13] = 42;
  mn[14] = 0; mn[15] = 0; mn[16] = 0; mn[17] = 8; // IFD di offset 8
  const ifd = 18; // 10 + 8
  mn[ifd] = 0; mn[ifd + 1] = 1; // 1 entri
  const e = ifd + 2;
  mn[e] = 0x00; mn[e + 1] = 0x11; // tag 0x0011 ContentIdentifier
  mn[e + 2] = 0; mn[e + 3] = 2; // tipe ASCII
  mn[e + 4] = 0; mn[e + 5] = 0; mn[e + 6] = 0; mn[e + 7] = teksByte.length; // jumlah
  const offNilai = 8 + 2 + 12 + 4; // 26, relatif ke awal TIFF MakerNote
  mn[e + 8] = 0; mn[e + 9] = 0; mn[e + 10] = 0; mn[e + 11] = offNilai;
  const next = e + 12;
  mn[next] = 0; mn[next + 1] = 0; mn[next + 2] = 0; mn[next + 3] = 0;
  mn.set(teksByte, 10 + offNilai);

  // TIFF EXIF luar (little-endian): IFD0 -> Exif IFD -> MakerNote.
  const total = 44 + mnLen;
  const t = new Uint8Array(total);
  const tulis16 = (o, v) => { t[o] = v & 255; t[o + 1] = (v >> 8) & 255; };
  const tulis32 = (o, v) => { t[o] = v & 255; t[o + 1] = (v >> 8) & 255; t[o + 2] = (v >> 16) & 255; t[o + 3] = (v >> 24) & 255; };
  t[0] = 0x49; t[1] = 0x49; tulis16(2, 42); tulis32(4, 8);
  tulis16(8, 1); // IFD0: 1 entri
  tulis16(10, 0x8769); tulis16(12, 4); tulis32(14, 1); tulis32(18, 26); // pointer Exif IFD
  tulis32(22, 0); // next IFD
  tulis16(26, 1); // Exif IFD: 1 entri
  tulis16(28, 0x927C); tulis16(30, 7); tulis32(32, mnLen); tulis32(36, 44); // MakerNote
  tulis32(40, 0);
  t.set(mn, 44);
  return t;
}

// Sisipkan segmen APP1 Exif ke JPEG (ganti yang lama bila ada).
// Fungsi murni.
export function sisipkanExifKeJpeg(jpegBytes, tiffBytes) {
  const b = jpegBytes instanceof Uint8Array ? jpegBytes : new Uint8Array(jpegBytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('Bukan file JPEG.');
  const segBaru = new Uint8Array(2 + 2 + 6 + tiffBytes.length);
  segBaru[0] = 0xFF; segBaru[1] = 0xE1;
  const len = 6 + tiffBytes.length + 2;
  segBaru[2] = (len >> 8) & 255; segBaru[3] = len & 255;
  segBaru.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4);
  segBaru.set(tiffBytes, 10);
  // Cari APP1 Exif lama.
  let i = 2, lama = null;
  while (i + 1 < b.length) {
    if (b[i] !== 0xFF) break;
    let j = i + 1;
    while (j < b.length && b[j] === 0xFF) j++;
    if (j >= b.length) break;
    const marker = b[j];
    if (marker === 0xD9 || marker === 0xDA) break;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= b.length) break;
    const slen = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + slen;
    if (slen < 2 || segEnd > b.length) break;
    if (marker === 0xE1 && b[j + 3] === 0x45 && b[j + 4] === 0x78 && b[j + 5] === 0x69 && b[j + 6] === 0x66) {
      lama = { awal: i, akhir: segEnd };
      break;
    }
    i = segEnd;
  }
  if (lama) {
    const keluar = new Uint8Array(b.length - (lama.akhir - lama.awal) + segBaru.length);
    keluar.set(b.subarray(0, lama.awal), 0);
    keluar.set(segBaru, lama.awal);
    keluar.set(b.subarray(lama.akhir), lama.awal + segBaru.length);
    return keluar;
  }
  const keluar = new Uint8Array(2 + segBaru.length + (b.length - 2));
  keluar.set(b.subarray(0, 2), 0);
  keluar.set(segBaru, 2);
  keluar.set(b.subarray(2), 2 + segBaru.length);
  return keluar;
}

// Baca kembali ContentIdentifier dari JPEG (untuk verifikasi).
// Fungsi murni.
export function bacaIdentifierDariJpeg(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2, tiff = null;
  while (i + 1 < b.length) {
    if (b[i] !== 0xFF) break;
    let j = i + 1;
    while (j < b.length && b[j] === 0xFF) j++;
    if (j >= b.length) break;
    const marker = b[j];
    if (marker === 0xD9 || marker === 0xDA) break;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= b.length) break;
    const slen = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + slen;
    if (slen < 2 || segEnd > b.length) break;
    if (marker === 0xE1 && b[j + 3] === 0x45 && b[j + 4] === 0x78) {
      tiff = b.subarray(j + 9, segEnd);
      break;
    }
    i = segEnd;
  }
  if (!tiff || tiff.length < 8) return null;
  const le = tiff[0] === 0x49;
  const u16 = (o) => (le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1]);
  const u32 = (o) => (le
    ? (tiff[o] | (tiff[o + 1] << 8) | (tiff[o + 2] << 16) | (tiff[o + 3] << 24)) >>> 0
    : ((tiff[o] << 24) | (tiff[o + 1] << 16) | (tiff[o + 2] << 8) | tiff[o + 3]) >>> 0);
  if (u16(2) !== 42) return null;
  const ifd0 = u32(4);
  const n0 = u16(ifd0);
  let exifOff = 0;
  for (let k = 0; k < n0; k++) {
    const eo = ifd0 + 2 + k * 12;
    if (u16(eo) === 0x8769) { exifOff = u32(eo + 8); break; }
  }
  if (!exifOff) return null;
  const nE = u16(exifOff);
  let mnOff = 0, mnLen = 0;
  for (let k = 0; k < nE; k++) {
    const eo = exifOff + 2 + k * 12;
    if (u16(eo) === 0x927C) { mnOff = u32(eo + 8); mnLen = u32(eo + 4); break; }
  }
  if (!mnOff || mnOff + mnLen > tiff.length) return null;
  const mn = tiff.subarray(mnOff, mnOff + mnLen);
  const kepala = 'Apple iOS\0';
  for (let k = 0; k < 10; k++) if (mn[k] !== kepala.charCodeAt(k)) return null;
  // IFD MakerNote big-endian, mulai byte 10.
  const bu16 = (o) => (mn[o] << 8) | mn[o + 1];
  const bu32 = (o) => ((mn[o] << 24) | (mn[o + 1] << 16) | (mn[o + 2] << 8) | mn[o + 3]) >>> 0;
  if (mn[10] !== 0x4D || bu16(12) !== 42) return null;
  const ifdMn = 10 + bu32(14);
  const nM = bu16(ifdMn);
  for (let k = 0; k < nM; k++) {
    const eo = ifdMn + 2 + k * 12;
    if (bu16(eo) === 0x0011) {
      const jumlah = bu32(eo + 4);
      const vo = bu32(eo + 8);
      const awal = 10 + vo;
      let s = '';
      for (let q = 0; q < jumlah && awal + q < mn.length; q++) {
        if (mn[awal + q] === 0) break;
        s += String.fromCharCode(mn[awal + q]);
      }
      return s;
    }
  }
  return null;
}

// Jendela klip 3 detik di sekitar detik diam, dijepit ke durasi video.
// Fungsi murni.
export function hitungJendelaLivePhoto(durasi, detikDiam) {
  const d = Math.max(0, durasi || 0);
  const tengah = Math.max(0, Math.min(d, detikDiam));
  const mulai = Math.max(0, Math.min(tengah - 1.5, Math.max(0, d - 3)));
  const dur = Math.min(3, d - mulai);
  const r3 = (v) => Math.round(v * 1000) / 1000; // presisi milidetik cukup
  return { mulai: r3(mulai), durasi: r3(Math.max(0, dur)), diamDiDalamKlip: r3(tengah - mulai) };
}

// Argumen ffmpeg untuk MOV Live Photo. Fungsi murni.
export function argumenMovLivePhoto(inName, outName, mulai, durasi, uuid, diamUs) {
  return ['-ss', String(mulai), '-t', String(durasi), '-i', inName,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    '-metadata', 'com.apple.quicktime.content.identifier=' + uuid,
    '-metadata', 'com.apple.quicktime.still-image-time=' + String(diamUs),
    '-movflags', '+faststart', '-y', outName];
}

export function render(root) {
  const fi = fileInput('video/*');
  const video = document.createElement('video');
  video.controls = true;
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0';
  const detikR = T.input('range');
  detikR.min = '0'; detikR.max = '100'; detikR.value = '50';
  const detikV = T.el('<b>detik ke-0</b>');
  const statusBox = T.out();
  const hasilBox = T.out();
  let fileObj = null, nama = 'livephoto', durasi = 0, busy = false;

  detikR.addEventListener('input', () => {
    const d = (parseInt(detikR.value, 10) / 100) * durasi;
    detikV.textContent = 'detik ke-' + (Math.round(d * 10) / 10).toString().replace('.', ',');
    if (video.readyState >= 1 && Number.isFinite(d)) { try { video.currentTime = d; } catch (e) {} }
  });

  const buatB = T.btn('Buat Live Photo', async () => {
    if (busy) return;
    if (!fileObj) { T.toast('Pilih dulu videonya.'); return; }
    if (!durasi || !Number.isFinite(durasi)) { T.show(hasilBox, '<div class="err">Durasi video belum terbaca. Putar dulu videonya sebentar.</div>'); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(hasilBox, '<div class="err">' + T.esc(sup.reason) + '</div>'); return; }
    busy = true; buatB.disabled = true;
    T.hide(hasilBox);
    const uuid = buatUuid();
    const detikDiam = (parseInt(detikR.value, 10) / 100) * durasi;
    const jendela = hitungJendelaLivePhoto(durasi, detikDiam);
    // Langkah 1 (lokal): foto diam dari frame video.
    T.show(statusBox, '<span class="dim">Mengambil foto diam…</span>');
    let jpgBytes = null;
    try {
      await new Promise((res, rej) => {
        const sekali = () => { video.removeEventListener('seeked', sekali); res(); };
        video.addEventListener('seeked', sekali);
        video.currentTime = detikDiam;
        setTimeout(() => { video.removeEventListener('seeked', sekali); res(); }, 3000);
      });
      const c = document.createElement('canvas');
      c.width = video.videoWidth || 640;
      c.height = video.videoHeight || 360;
      const ctx = c.getContext('2d');
      ctx.drawImage(video, 0, 0, c.width, c.height);
      const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
      if (!blob) throw new Error('Gagal mengambil frame video.');
      const mentah = new Uint8Array(await blob.arrayBuffer());
      jpgBytes = sisipkanExifKeJpeg(mentah, bangunExifLivePhoto(uuid));
      if (bacaIdentifierDariJpeg(jpgBytes) !== uuid) throw new Error('Pengenal foto gagal ditulis.');
    } catch (e) {
      T.show(statusBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal mengambil foto diam.') + '</div>');
      busy = false; buatB.disabled = false;
      return;
    }
    // Foto diam langsung tersedia walau langkah video gagal.
    T.show(hasilBox, '');
    const infoJpg = T.el(`<p style="margin:0 0 8px">Foto diam siap (${fmtBytes(jpgBytes.length)}). Pengenal pasangan: <code>${uuid}</code></p>`);
    const dlJpg = T.btn('Unduh foto (JPG)', () => { T.dl(nama + '.jpg', jpgBytes, 'image/jpeg'); });
    hasilBox.appendChild(infoJpg); hasilBox.appendChild(dlJpg);
    // Langkah 2 (perlu internet): video MOV lewat ffmpeg.
    T.show(statusBox, '<span class="dim">Memuat mesin video… (perlu internet sekali, ~31 MB)</span>');
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    let movBytes = null;
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        T.show(statusBox, `<span class="dim">${T.esc(s)}</span>`);
      });
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const diamUs = Math.round(jendela.diamDiDalamKlip * 1000000);
      await runFFmpeg(ffmpeg, argumenMovLivePhoto(inName, 'output.mov', jendela.mulai, jendela.durasi, uuid, diamUs));
      const data = await ffmpeg.readFile('output.mov');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mov']);
      movBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    } catch (e) {
      if (isCancelled(e)) T.show(statusBox, '<span class="dim">Dibatalkan. Foto diam di atas tetap bisa diunduh.</span>');
      else T.show(statusBox, '<div class="err">Video MOV gagal dibuat (' + T.esc(friendlyError(e)) + '). Foto diam di atas tetap bisa diunduh; coba lagi saat internet stabil.</div>');
      busy = false; buatB.disabled = false;
      return;
    }
    T.hide(statusBox);
    const infoMov = T.el(`<p style="margin:12px 0 8px">Video MOV siap (${fmtBytes(movBytes.length)}), klip ${jendela.durasi.toFixed(1).replace('.', ',')} detik. Pindahkan kedua file dengan nama yang sama ke iPhone (misalnya lewat AirDrop), lalu buka di aplikasi Foto dan tekan lama fotonya.</p>`);
    const dlMov = T.btn('Unduh video (MOV)', () => { T.dl(nama + '.mov', movBytes, 'video/quicktime'); });
    const zipB = T.btn('Unduh keduanya (ZIP)', async () => {
      const ok = await utils.loadLibOnce(ZIP_CDN, () => typeof window.JSZip === 'function');
      if (!ok || typeof window.JSZip !== 'function') { T.toast('Pembuat ZIP gagal dimuat. Unduh satu per satu saja.'); return; }
      const zip = new window.JSZip();
      zip.file(nama + '.jpg', jpgBytes);
      zip.file(nama + '.mov', movBytes);
      const blob = await zip.generateAsync({ type: 'blob' });
      T.dl(nama + '-livephoto.zip', blob, 'application/zip');
    });
    hasilBox.appendChild(infoMov); hasilBox.appendChild(dlMov); hasilBox.appendChild(zipB);
    busy = false; buatB.disabled = false;
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox);
    fileObj = f;
    nama = (f.name || 'livephoto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'livephoto';
    const url = URL.createObjectURL(f);
    video.src = url;
    if (!video.parentNode) root.insertBefore(video, detikField);
    T.show(statusBox, '<span class="dim">Membaca video…</span>');
    video.addEventListener('loadedmetadata', () => {
      durasi = Number.isFinite(video.duration) ? video.duration : 0;
      if (!durasi) { T.show(statusBox, '<div class="err">Durasi video tidak terbaca. Coba file video lain (MP4 atau MOV).</div>'); return; }
      T.hide(statusBox);
      detikR.value = '50';
      detikV.textContent = 'detik ke-' + (Math.round(durasi / 2 * 10) / 10).toString().replace('.', ',');
      try { video.currentTime = durasi / 2; } catch (e) {}
    }, { once: true });
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Live Photo adalah pasangan foto dan video pendek yang bergerak saat ditekan lama di iPhone. Pilih detik yang jadi foto diamnya, videonya diambil 3 detik di sekitar detik itu.</p>'));
  root.appendChild(T.field('Pilih video', fi));
  const detikField = T.field('Detik yang jadi foto diam', T.row(detikR, detikV), 'Geser untuk memilih momennya, pratinjau video ikut bergerak.');
  root.appendChild(detikField);
  root.appendChild(statusBox);
  root.appendChild(buatB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">Foto diam dibuat di perangkat. Video MOV memakai ffmpeg di peramban (perlu internet sekali). ' + LOCAL_NOTE + '</p>'));
}
