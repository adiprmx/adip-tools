import { h as T, LOCAL_NOTE, fileInput, canvasToBlob, fmtBytes } from '../../core.js';

// Video ke Motion Photo: buat Motion Photo Samsung (satu file JPG berisi
// foto diam + video MP4 tertanam) dari video MP4. Formatnya: foto JPG
// biasa, dengan segmen XMP yang menandai GCamera:MotionPhoto, lalu seluruh
// byte video MP4 ditempel setelah akhir data JPEG (marker EOI). Galeri
// Samsung dan Google Foto membaca file seperti ini sebagai foto bergerak.
// Semua dibuat lokal, tanpa internet. Video masukan harus MP4.
export const meta = {"id": "video-ke-motion-photo", "name": "Video ke Motion Photo", "cat": "gambar", "icon": "📸", "desc": "Buat Motion Photo Samsung (foto + video dalam satu JPG) dari video MP4.", "keywords": "motion photo,samsung,foto bergerak,mp4,jpg,galeri", "since": "6.19.0"};

// Bangun paket XMP Motion Photo. timestampUs = posisi foto diam di dalam
// video, dalam mikrodetik. Fungsi murni.
export function bangunXmpMotionPhoto(timestampUs) {
  return '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adip Tools">'
    + '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    + '<rdf:Description rdf:about="" xmlns:GCamera="http://ns.google.com/photos/1.0/camera/">'
    + '<GCamera:MotionPhoto>1</GCamera:MotionPhoto>'
    + '<GCamera:MotionPhotoVersion>1</GCamera:MotionPhotoVersion>'
    + '<GCamera:MotionPhotoPresentationTimestampUs>' + String(Math.max(0, Math.round(timestampUs))) + '</GCamera:MotionPhotoPresentationTimestampUs>'
    + '</rdf:Description></rdf:RDF></x:xmpmeta>';
}

// Sisipkan segmen APP1 XMP ke JPEG (setelah SOI, sebelum segmen lain).
// Fungsi murni.
export function sisipkanXmpKeJpeg(jpegBytes, xmpString) {
  const b = jpegBytes instanceof Uint8Array ? jpegBytes : new Uint8Array(jpegBytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('Bukan file JPEG.');
  const xmp = new TextEncoder().encode(xmpString);
  const kepala = new Uint8Array([0x68, 0x74, 0x74, 0x70, 0x3A, 0x2F, 0x2F, 0x6E, 0x73, 0x2E, 0x61, 0x64, 0x6F, 0x62, 0x65, 0x2E, 0x63, 0x6F, 0x6D, 0x2F, 0x78, 0x61, 0x70, 0x2F, 0x31, 0x2E, 0x30, 0x2F, 0x00]); // "http://ns.adobe.com/xap/1.0/\0"
  const isi = kepala.length + xmp.length;
  const len = isi + 2;
  if (len > 65535) throw new Error('Data XMP terlalu besar.');
  const seg = new Uint8Array(2 + 2 + isi);
  seg[0] = 0xFF; seg[1] = 0xE1;
  seg[2] = (len >> 8) & 255; seg[3] = len & 255;
  seg.set(kepala, 4);
  seg.set(xmp, 4 + kepala.length);
  const keluar = new Uint8Array(2 + seg.length + (b.length - 2));
  keluar.set(b.subarray(0, 2), 0);
  keluar.set(seg, 2);
  keluar.set(b.subarray(2), 2 + seg.length);
  return keluar;
}

// Cari akhir data JPEG (marker EOI 0xFFD9) dengan memindai segmen.
// Mengembalikan indeks byte setelah EOI. Fungsi murni.
export function cariAkhirJpeg(b) {
  let i = 2;
  while (i + 1 < b.length) {
    if (b[i] !== 0xFF) return -1;
    let j = i + 1;
    while (j < b.length && b[j] === 0xFF) j++;
    if (j >= b.length) return -1;
    const marker = b[j];
    if (marker === 0xD9) return j + 1;
    if (marker === 0xDA) {
      // Data scan: cari FFD9 dengan memindai byte (0xFF00 adalah data, bukan marker).
      let k = j + 1;
      // Lewati header SOS (panjang di 2 byte setelah marker).
      if (k + 1 >= b.length) return -1;
      const hlen = (b[k] << 8) | b[k + 1];
      k += hlen;
      while (k + 1 < b.length) {
        if (b[k] === 0xFF && b[k + 1] === 0xD9) return k + 2;
        k++;
      }
      return -1;
    }
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= b.length) return -1;
    const len = (b[j + 1] << 8) | b[j + 2];
    if (len < 2) return -1;
    i = j + 1 + len;
  }
  return -1;
}

// Rakit Motion Photo: JPEG + XMP + MP4 setelah EOI.
// Kembalikan {bytes, akhirJpeg, ukuranVideo}. Fungsi murni.
export function rakitMotionPhoto(jpegBytes, mp4Bytes, timestampUs) {
  const jpg = sisipkanXmpKeJpeg(jpegBytes, bangunXmpMotionPhoto(timestampUs));
  const akhir = cariAkhirJpeg(jpg);
  if (akhir < 0) throw new Error('Akhir data JPEG tidak ditemukan.');
  const mp4 = mp4Bytes instanceof Uint8Array ? mp4Bytes : new Uint8Array(mp4Bytes);
  if (mp4.length < 8 || String.fromCharCode(mp4[4], mp4[5], mp4[6], mp4[7]) !== 'ftyp') {
    throw new Error('Video bukan MP4 yang valid (tidak ada kotak ftyp).');
  }
  const keluar = new Uint8Array(akhir + mp4.length);
  keluar.set(jpg.subarray(0, akhir), 0);
  keluar.set(mp4, akhir);
  return { bytes: keluar, akhirJpeg: akhir, ukuranVideo: mp4.length };
}

// Periksa file Motion Photo: XMP ada, video MP4 ada setelah EOI.
// Fungsi murni.
export function periksaMotionPhoto(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const akhir = cariAkhirJpeg(b);
  if (akhir < 0) return { ok: false, alasan: 'Akhir JPEG tidak ditemukan.' };
  const teks = new TextDecoder().decode(b.subarray(0, Math.min(b.length, akhir)));
  if (!teks.includes('GCamera:MotionPhoto>1<')) return { ok: false, alasan: 'Penanda XMP Motion Photo tidak ada.' };
  if (b.length - akhir < 8) return { ok: false, alasan: 'Tidak ada video setelah foto.' };
  if (String.fromCharCode(b[akhir + 4], b[akhir + 5], b[akhir + 6], b[akhir + 7]) !== 'ftyp') {
    return { ok: false, alasan: 'Data setelah foto bukan MP4.' };
  }
  return { ok: true, akhirJpeg: akhir, ukuranVideo: b.length - akhir };
}

export function render(root) {
  const fi = fileInput('video/mp4,.mp4');
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
  let fileObj = null, nama = 'motionphoto', durasi = 0, busy = false;

  detikR.addEventListener('input', () => {
    const d = (parseInt(detikR.value, 10) / 100) * durasi;
    detikV.textContent = 'detik ke-' + (Math.round(d * 10) / 10).toString().replace('.', ',');
    if (video.readyState >= 1 && Number.isFinite(d)) { try { video.currentTime = d; } catch (e) {} }
  });

  const buatB = T.btn('Buat Motion Photo', async () => {
    if (busy) return;
    if (!fileObj) { T.toast('Pilih dulu videonya.'); return; }
    if (!durasi || !Number.isFinite(durasi)) { T.show(hasilBox, '<div class="err">Durasi video belum terbaca. Putar dulu videonya sebentar.</div>'); return; }
    busy = true; buatB.disabled = true;
    T.hide(hasilBox);
    const detikDiam = (parseInt(detikR.value, 10) / 100) * durasi;
    T.show(statusBox, '<span class="dim">Mengambil foto diam dan merakit file…</span>');
    try {
      await new Promise((res) => {
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
      const jpg = new Uint8Array(await blob.arrayBuffer());
      const mp4 = new Uint8Array(await fileObj.arrayBuffer());
      const hasil = rakitMotionPhoto(jpg, mp4, detikDiam * 1000000);
      const cek = periksaMotionPhoto(hasil.bytes);
      if (!cek.ok) throw new Error('Hasil rakitan gagal diperiksa: ' + cek.alasan);
      T.hide(statusBox);
      T.show(hasilBox, '');
      const info = T.el(`<p style="margin:0 0 8px">Motion Photo siap (${fmtBytes(hasil.bytes.length)}): foto ${fmtBytes(hasil.akhirJpeg)} + video ${fmtBytes(hasil.ukuranVideo)}. Buka di galeri Samsung atau Google Foto, fotonya akan bergerak.</p>`);
      const dlB = T.btn('Unduh Motion Photo (JPG)', () => {
        T.dl(nama + '-motionphoto.jpg', hasil.bytes, 'image/jpeg');
      }, true);
      hasilBox.appendChild(info); hasilBox.appendChild(dlB);
    } catch (e) {
      T.hide(statusBox);
      T.show(hasilBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal membuat Motion Photo.') + '</div>');
    }
    busy = false; buatB.disabled = false;
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox);
    fileObj = f;
    nama = (f.name || 'motionphoto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'motionphoto';
    video.src = URL.createObjectURL(f);
    if (!video.parentNode) root.insertBefore(video, detikField);
    T.show(statusBox, '<span class="dim">Membaca video…</span>');
    video.addEventListener('loadedmetadata', () => {
      durasi = Number.isFinite(video.duration) ? video.duration : 0;
      if (!durasi) { T.show(statusBox, '<div class="err">Durasi video tidak terbaca. Coba file MP4 lain.</div>'); return; }
      T.hide(statusBox);
      detikR.value = '50';
      detikV.textContent = 'detik ke-' + (Math.round(durasi / 2 * 10) / 10).toString().replace('.', ',');
      try { video.currentTime = durasi / 2; } catch (e) {}
    }, { once: true });
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Motion Photo menyimpan foto dan videonya dalam satu file JPG. Pilih detik yang jadi foto diamnya; seluruh video ikut tertanam di dalam file. Videonya harus berformat MP4.</p>'));
  root.appendChild(T.field('Pilih video MP4', fi));
  const detikField = T.field('Detik yang jadi foto diam', T.row(detikR, detikV), 'Geser untuk memilih momennya, pratinjau video ikut bergerak.');
  root.appendChild(detikField);
  root.appendChild(statusBox);
  root.appendChild(buatB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">Semua dibuat di perangkat, tanpa internet. ' + LOCAL_NOTE + '</p>'));
}
