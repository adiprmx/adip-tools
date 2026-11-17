import { h as T, errBox, LOCAL_NOTE, loadImage, fmtBytes } from '../../core.js';

// Deteksi jenis isi kode QR. Murni, bisa diuji tanpa browser.
export function deteksiIsi(teks) {
  const s = String(teks == null ? '' : teks).trim();
  if (/^WIFI:/i.test(s)) {
    const isi = s.replace(/^WIFI:/i, '');
    const ambil = (k) => {
      const m = isi.match(new RegExp('(?:^|;)' + k + ':((?:\\\\.|[^;])*)', 'i'));
      return m ? m[1].replace(/\\([\\;,:"])/g, '$1') : '';
    };
    return {
      jenis: 'wifi',
      label: 'WiFi',
      ssid: ambil('S'),
      sandi: ambil('P'),
      pengaman: ambil('T') || 'nopass',
      tersembunyi: /^true$/i.test(ambil('H')),
    };
  }
  if (/^(https?:\/\/|www\.|mailto:|tel:|sms:)/i.test(s)) return { jenis: 'url', label: 'Tautan' };
  return { jenis: 'teks', label: 'Teks biasa' };
}

export const meta = {"id": "qr-decoder", "name": "Baca QR Code", "cat": "desain", "icon": "📷", "desc": "Baca isi kode QR & barcode dari foto, screenshot, atau kamera.", "keywords": "qr,barcode,scan,baca,decode,kamera,screenshot", "since": "6.11.0"};
export function render(root) {
    const JSQR_CDN = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    const MAKS_FILE = 15 * 1024 * 1024;
    const FORMAT_BARCODE = ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'codabar', 'itf', 'data_matrix', 'aztec', 'pdf417'];

    let jsqrSiap = null;
    const pastJsqr = () => {
      if (!jsqrSiap) jsqrSiap = T.loadScript(JSQR_CDN).then((ok) => ok && typeof window.jsQR === 'function');
      return jsqrSiap;
    };
    const barcodeDidukung = () => typeof window !== 'undefined' && 'BarcodeDetector' in window;

    root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Unggah foto atau screenshot yang ada kode QR-nya, tempel langsung dari clipboard, atau arahkan kamera ke kodenya. Hasilnya muncul di bawah.</p>'));

    const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer"><div style="font-size:30px">📷</div><div style="margin-top:6px;font-weight:700">Ketuk / seret gambar ke sini · atau tempel (Ctrl+V)</div><div class="dim" style="font-size:12px;margin-top:4px">JPG · PNG · WebP, maks 15 MB</div></div>');
    const fileInp = T.el('<input type="file" accept="image/*" hidden>');
    const statusBox = T.out();
    const hasilBox = T.out();
    const kameraBox = T.el('<div hidden style="margin-top:12px"></div>');
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.style.cssText = 'width:100%;border-radius:12px;background:#000;display:block';
    const kameraHint = T.el('<p class="dim" style="font-size:12px;margin-top:8px">Arahkan kamera ke kode QR. Pemindaian berhenti sendiri begitu kode terbaca.</p>');
    kameraBox.appendChild(video);
    kameraBox.appendChild(kameraHint);

    let stream = null, timerPindai = null, memindai = false, sibuk = false;
    const hentikanKamera = () => {
      if (timerPindai) { clearInterval(timerPindai); timerPindai = null; }
      if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
      kameraBox.hidden = true;
      memindai = false;
      btnKamera.textContent = 'Pindai pakai kamera';
    };
    T.onLeave(hentikanKamera);

    // Gambar (Image / canvas / video) -> ImageData untuk jsQR
    const keImageData = (sumber, w, h) => {
      const maks = 1600;
      const s = Math.min(1, maks / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      c.getContext('2d').drawImage(sumber, 0, 0, cw, ch);
      return { data: c.getContext('2d').getImageData(0, 0, cw, ch), canvas: c, w: cw, h: ch };
    };

    const pindaiCanvas = async (canvas) => {
      if (await pastJsqr()) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasil = window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (hasil && hasil.data) return { teks: hasil.data, format: 'Kode QR' };
      }
      if (barcodeDidukung()) {
        try {
          let format = FORMAT_BARCODE;
          if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
            const dukung = await window.BarcodeDetector.getSupportedFormats();
            format = FORMAT_BARCODE.filter((f) => dukung.includes(f));
          }
          if (format.length) {
            const detektor = new window.BarcodeDetector({ formats: format });
            const daftar = await detektor.detect(canvas);
            if (daftar && daftar.length && daftar[0].rawValue) {
              const f = String(daftar[0].format || '').replace(/_/g, ' ').toUpperCase();
              return { teks: daftar[0].rawValue, format: f === 'QR CODE' ? 'Kode QR' : 'Barcode (' + f + ')' };
            }
          }
        } catch (e) { /* pemindai bawaan browser gagal, lanjut ke pesan tidak ditemukan */ }
      }
      return null;
    };

    const tampilkanHasil = (teks, format) => {
      const info = deteksiIsi(teks);
      T.hide(statusBox);
      T.show(hasilBox, '');
      const isiHtml = info.jenis === 'wifi'
        ? `<div class="kv"><span>Nama WiFi</span><b>${T.esc(info.ssid || '(tidak terbaca)')}</b></div>` +
          `<div class="kv"><span>Kata sandi</span><b>${T.esc(info.sandi || '(tanpa kata sandi)')}</b></div>` +
          `<div class="kv"><span>Pengaman</span><b>${T.esc(info.pengaman === 'nopass' ? 'Terbuka' : info.pengaman)}</b></div>`
        : `<div style="word-break:break-word;white-space:pre-wrap;font-size:14px;line-height:1.6">${T.esc(teks)}</div>`;
      hasilBox.appendChild(T.el(
        `<div><div class="kv"><span>Jenis kode</span><b>${T.esc(format)}</b></div>` +
        `<div class="kv"><span>Isi</span><b>${T.esc(info.label)}</b></div></div>`
      ));
      hasilBox.appendChild(T.el('<div style="margin-top:10px">' + isiHtml + '</div>'));
      const tombol = T.el('<div class="row" style="margin-top:12px"></div>');
      tombol.appendChild(T.copyBtn(() => teks, 'Salin isi'));
      if (info.jenis === 'url') {
        const tautan = /^www\./i.test(teks.trim()) ? 'https://' + teks.trim() : teks.trim();
        tombol.appendChild(T.btn('Buka tautan', () => window.open(tautan, '_blank', 'noopener'), true));
      }
      if (info.jenis === 'wifi' && info.sandi) {
        tombol.appendChild(T.copyBtn(() => info.sandi, 'Salin kata sandi'));
      }
      hasilBox.appendChild(tombol);
      T.scrollToPreview(hasilBox);
    };

    const tidakKetemu = () => {
      T.show(statusBox, errBox('Tidak ada kode QR atau barcode yang terbaca di gambar ini. Coba gambar yang lebih jelas, lebih dekat, dan tidak buram.'));
    };

    async function prosesFile(file) {
      if (sibuk) return;
      if (!file) return;
      if (file.size > MAKS_FILE) { T.show(statusBox, errBox('File melebihi 15 MB (' + fmtBytes(file.size) + ').')); return; }
      if (file.size === 0) { T.show(statusBox, errBox('File kosong.')); return; }
      sibuk = true;
      T.hide(hasilBox);
      T.show(statusBox, '<span class="dim">Memindai gambar…</span>');
      try {
        const img = await loadImage(file);
        const { canvas } = keImageData(img, img.naturalWidth, img.naturalHeight);
        const hasil = await pindaiCanvas(canvas);
        if (hasil) tampilkanHasil(hasil.teks, hasil.format);
        else tidakKetemu();
      } catch (e) {
        T.show(statusBox, errBox('Gambar tidak bisa dibaca. Pastikan filenya foto atau screenshot yang valid.'));
      }
      sibuk = false;
    }

    async function mulaiKamera() {
      if (memindai) { hentikanKamera(); return; }
      const md = navigator.mediaDevices;
      if (!md || typeof md.getUserMedia !== 'function') {
        T.show(statusBox, errBox('Browser ini tidak mendukung akses kamera. Pakai cara unggah gambar di atas.'));
        return;
      }
      T.show(statusBox, '<span class="dim">Membuka kamera…</span>');
      try {
        stream = await md.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch (e) {
        T.show(statusBox, errBox(e && e.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi.'
          : 'Kamera tidak bisa dibuka di perangkat ini. Pakai cara unggah gambar di atas.'));
        return;
      }
      T.hide(statusBox);
      video.srcObject = stream;
      try { await video.play(); } catch (e) { /* putar manual oleh browser */ }
      kameraBox.hidden = false;
      memindai = true;
      btnKamera.textContent = 'Berhenti memindai';
      let gagalJsqr = 0;
      timerPindai = setInterval(async () => {
        if (!memindai || video.readyState < 2 || sibuk) return;
        sibuk = true;
        try {
          const { canvas } = keImageData(video, video.videoWidth, video.videoHeight);
          const hasil = await pindaiCanvas(canvas);
          if (hasil) {
            hentikanKamera();
            try { T.beep(880, 0.12); } catch (e) {}
            tampilkanHasil(hasil.teks, hasil.format);
          }
        } catch (e) {
          gagalJsqr++;
          if (gagalJsqr > 20) { hentikanKamera(); T.show(statusBox, errBox('Pemindaian kamera gagal. Coba unggah gambar saja.')); }
        }
        sibuk = false;
      }, 400);
    }

    const btnKamera = T.btn('Pindai pakai kamera', mulaiKamera, true);
    const btnTempel = T.btn('Tempel dari clipboard', async () => {
      try {
        if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') throw new Error('tidak didukung');
        const items = await navigator.clipboard.read();
        for (const it of items) {
          for (const tipe of it.types) {
            if (tipe.startsWith('image/')) { prosesFile(await it.getType(tipe)); return; }
          }
        }
        T.toast('Clipboard tidak berisi gambar');
      } catch (e) {
        T.show(statusBox, errBox('Browser ini tidak mengizinkan baca clipboard lewat tombol. Tempel gambar dengan Ctrl+V (atau tempel panjang di HP) di halaman ini.'));
      }
    });

    dz.addEventListener('click', () => fileInp.click());
    dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInp.click(); } });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) prosesFile(e.dataTransfer.files[0]); });
    fileInp.addEventListener('change', () => { if (fileInp.files[0]) prosesFile(fileInp.files[0]); fileInp.value = ''; });
    const onPaste = (e) => {
      if (document.hidden) return;
      const items = (e.clipboardData && e.clipboardData.files) || [];
      for (const f of items) if (f.type.startsWith('image/')) { prosesFile(f); e.preventDefault(); break; }
    };
    document.addEventListener('paste', onPaste);
    T.onLeave(() => document.removeEventListener('paste', onPaste));

    root.appendChild(dz);
    root.appendChild(fileInp);
    root.appendChild(T.row(btnKamera, btnTempel));
    if (!barcodeDidukung()) {
      root.appendChild(T.el('<p class="dim" style="font-size:12px;line-height:1.5">Catatan: browser ini belum punya pemindai barcode bawaan, jadi barcode garis (bukan QR) mungkin tidak terbaca. Kode QR tetap bisa dibaca.</p>'));
    }
    root.appendChild(statusBox);
    root.appendChild(kameraBox);
    root.appendChild(hasilBox);
    root.appendChild(T.el('<p class="dim" style="font-size:12px">Punya teks atau tautan yang mau dijadikan kode QR? <a href="#/t/qr-generator">Buat di sini</a>.</p>'));
}
