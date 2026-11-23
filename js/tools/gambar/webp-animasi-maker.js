import { h as T, LOCAL_NOTE, fileInput, canvasToBlob, fmtBytes, loadImage } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg } from '../../ffmpeg-loader.js';

// WebP Animasi Maker: gabung beberapa foto jadi satu animasi WebP.
// WebP animasi jauh lebih ringan dari GIF dengan kualitas yang sama, dan
// bisa dipakai sebagai stiker atau gambar bergerak di web. Encoding memakai
// ffmpeg di peramban (perlu internet sekali untuk memuat mesinnya, ~31 MB).
export const meta = {"id": "webp-animasi-maker", "name": "WebP Animasi Maker", "cat": "gambar", "icon": "🎞️", "desc": "Gabung beberapa foto jadi animasi WebP yang ringan.", "keywords": "webp,animasi,foto bergerak,stiker,ringan,gif", "since": "6.19.0", "online": true};

const MAKS_FOTO = 20;

// Nama file frame ke-i dalam urutan ffmpeg (f000.png, f001.png, ...).
// Fungsi murni.
export function namaFrame(i) { return 'f' + String(i).padStart(3, '0') + '.png'; }

// Argumen ffmpeg untuk animasi WebP dari urutan gambar. Encoder khusus
// animasi (libwebp_anim, ffmpeg 6.1+) dicoba dulu, jatuh ke libwebp bila
// mesin tidak kenal. Fungsi murni.
export function bangunArgumenWebpAnimasi(fps, lebar, encoder) {
  const enc = encoder || 'libwebp_anim';
  return ['-framerate', String(fps), '-i', 'f%03d.png',
    '-vf', 'scale=' + lebar + ':-2:flags=lanczos',
    '-c:v', enc, '-loop', '0', '-quality', '80', '-an', '-y', 'output.webp'];
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const fpsSel = T.select([['2', '2 foto/detik (lambat)'], ['4', '4 foto/detik'], ['6', '6 foto/detik'], ['10', '10 foto/detik (cepat)']], '4');
  const lebarSel = T.select([['320', 'Kecil (lebar 320)'], ['480', 'Sedang (lebar 480)'], ['640', 'Besar (lebar 640)'], ['asli', 'Ukuran asli foto']], '480');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let daftar = []; // [{file, img, nama, url}]
  let busy = false;

  function gambarDaftar() {
    T.show(box, '');
    if (!daftar.length) {
      box.appendChild(T.el('<p class="dim">Belum ada foto. Pilih minimal 2 foto untuk dibuat animasi.</p>'));
      return;
    }
    daftar.forEach((item, i) => {
      const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
      const kiri = T.el('<div style="display:flex;gap:10px;align-items:center;min-width:0"></div>');
      const thumb = document.createElement('img');
      thumb.src = item.url; thumb.alt = item.nama;
      thumb.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:8px;flex:none';
      const nama = T.el(`<div style="word-break:break-word"><b>${i + 1}. ${T.esc(item.nama)}</b><div class="dim" style="font-size:12px">${item.img.naturalWidth}×${item.img.naturalHeight}</div></div>`);
      kiri.appendChild(thumb); kiri.appendChild(nama);
      const tombol = T.el('<div style="display:flex;gap:6px;flex:none"></div>');
      const naikB = T.btn('↑', () => { if (i > 0) { const t = daftar[i - 1]; daftar[i - 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === 0);
      const turunB = T.btn('↓', () => { if (i < daftar.length - 1) { const t = daftar[i + 1]; daftar[i + 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === daftar.length - 1);
      const hapusB = T.btn('Hapus', () => { URL.revokeObjectURL(daftar[i].url); daftar.splice(i, 1); gambarDaftar(); buatB.disabled = daftar.length < 2; });
      [naikB, turunB, hapusB].forEach((b) => { b.classList.add('small'); tombol.appendChild(b); });
      baris.appendChild(kiri); baris.appendChild(tombol);
      box.appendChild(baris);
    });
  }

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])];
    if (!files.length) return;
    T.hide(hasilBox);
    const sisa = MAKS_FOTO - daftar.length;
    if (sisa <= 0) { T.toast(`Maksimal ${MAKS_FOTO} foto`); fi.value = ''; return; }
    const batch = files.slice(0, sisa);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    let gagal = 0;
    for (const f of batch) {
      try {
        const img = await loadImage(f);
        daftar.push({ file: f, img, nama: f.name || 'foto', url: URL.createObjectURL(f) });
      } catch (e) { gagal++; }
    }
    T.hide(statusBox);
    if (gagal) T.toast(`${gagal} foto tidak bisa dibuka, dilewati`);
    if (files.length > batch.length) T.toast(`Hanya ${batch.length} foto pertama yang dipakai (maksimal ${MAKS_FOTO})`);
    fi.value = '';
    buatB.disabled = daftar.length < 2;
    gambarDaftar();
  });

  const buatB = T.btn('Buat WebP animasi', async () => {
    if (busy) return;
    if (daftar.length < 2) { T.toast('Pilih minimal 2 foto dulu'); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(hasilBox, '<div class="err">' + T.esc(sup.reason) + '</div>'); return; }
    busy = true;
    buatB.disabled = true;
    T.hide(hasilBox);
    // Samakan ukuran semua frame ke frame pertama (encoder butuh sama).
    const pertama = daftar[0].img;
    const targetLebar = lebarSel.value === 'asli' ? pertama.naturalWidth : parseInt(lebarSel.value, 10);
    const skala = Math.min(1, targetLebar / pertama.naturalWidth);
    const W = Math.max(2, Math.round(pertama.naturalWidth * skala));
    const H = Math.max(2, Math.round(pertama.naturalHeight * skala));
    const fps = parseInt(fpsSel.value, 10);
    let ffmpeg = null;
    const namaFile = [];
    try {
      T.show(statusBox, '<span class="dim">Memuat mesin video… (perlu internet sekali, ~31 MB)</span>');
      const muat = await loadFFmpeg((s) => { T.show(statusBox, `<span class="dim">${T.esc(s)}</span>`); });
      ffmpeg = muat.ffmpeg;
      const fetchFile = muat.fetchFile;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      for (let i = 0; i < daftar.length; i++) {
        T.show(statusBox, `<span class="dim">Menyiapkan foto ${i + 1} dari ${daftar.length}…</span>`);
        await new Promise((r) => setTimeout(r, 0));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        const img = daftar[i].img;
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        const blob = await canvasToBlob(c, 'image/png');
        if (!blob) throw new Error('Gagal menyiapkan foto ke-' + (i + 1) + '.');
        const nama = namaFrame(i);
        namaFile.push(nama);
        await ffmpeg.writeFile(nama, await fetchFile(blob));
      }
      T.show(statusBox, '<span class="dim">Membuat animasi WebP…</span>');
      try {
        await runFFmpeg(ffmpeg, bangunArgumenWebpAnimasi(fps, W, 'libwebp_anim'));
      } catch (e) {
        await runFFmpeg(ffmpeg, bangunArgumenWebpAnimasi(fps, W, 'libwebp'));
      }
      const data = await ffmpeg.readFile('output.webp');
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      // Periksa header WebP (RIFF....WEBP) sebelum ditawarkan.
      const kepala = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) + String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (kepala !== 'RIFFWEBP') throw new Error('Hasil encoding bukan WebP yang valid.');
      await cleanupFFmpeg(ffmpeg, [...namaFile, 'output.webp']);
      T.hide(statusBox);
      T.show(hasilBox, '');
      const pratinjau = document.createElement('img');
      pratinjau.src = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
      pratinjau.alt = 'Pratinjau animasi WebP';
      pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0';
      const info = T.el(`<p style="margin:0 0 8px">Animasi WebP siap: ${daftar.length} foto, ${fmtBytes(bytes.length)}.</p>`);
      const dlB = T.btn('Unduh WebP animasi', () => { T.dl('animasi.webp', bytes, 'image/webp'); }, true);
      hasilBox.appendChild(pratinjau); hasilBox.appendChild(info); hasilBox.appendChild(dlB);
    } catch (e) {
      if (ffmpeg && namaFile.length) { try { await cleanupFFmpeg(ffmpeg, [...namaFile, 'output.webp']); } catch (err) {} }
      if (isCancelled(e)) T.show(statusBox, '<span class="dim">Dibatalkan.</span>');
      else T.show(statusBox, '<div class="err">Gagal membuat animasi (' + T.esc(friendlyError(e)) + '). Cek koneksi internetmu lalu coba lagi.</div>');
    }
    busy = false;
    buatB.disabled = daftar.length < 2;
  }, true);
  buatB.disabled = true;

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih beberapa foto, atur urutannya, lalu jadikan satu animasi WebP yang ringan. Cocok untuk stiker dan gambar bergerak di web.</p>'));
  root.appendChild(T.field('Pilih foto (minimal 2)', fi));
  root.appendChild(box);
  root.appendChild(T.field('Kecepatan', fpsSel));
  root.appendChild(T.field('Ukuran hasil', lebarSel));
  root.appendChild(statusBox);
  root.appendChild(buatB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">Foto diproses di perangkat. Mesin encoding (ffmpeg) dimuat sekali dari internet. ' + LOCAL_NOTE + '</p>'));
  gambarDaftar();
}
