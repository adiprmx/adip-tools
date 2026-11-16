import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.13.0';

export const meta = {"id": "blur-foto", "name": "Blur Foto (Sensor)", "cat": "gambar", "icon": "🫣", "desc": "Sensor area foto, atau blur latar potret otomatis.", "keywords": "blur,sensor,foto,pixel,privasi,latar,potret"};
export function render(root) {

    const fileI = fileInput('image/*');
    const sizeR = T.input('range'); sizeR.min = '6'; sizeR.max = '60'; sizeR.value = '18';
    const sizeV = T.el('<b>18px</b>');
    const box = T.out();
    const statusBox = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:0 auto;touch-action:none;cursor:crosshair';
    const off = document.createElement('canvas'); // gambar asli
    const tmp = document.createElement('canvas'); // pixelate per area
    const bgHasil = document.createElement('canvas'); // hasil blur latar
    let rects = [], fullBlur = false, drag = null, hasImg = false;
    let mode = 'sensor'; // 'sensor' | 'latar'
    let bgSiap = false;
    let pilihArea = null; // indeks area yang dipilih di daftar (disorot garis coral)
    let zoom = 1;
    const daftarAreaBox = T.out();
    const zoomWrap = T.el('<div style="overflow:auto;max-height:70vh;border-radius:12px"></div>');

    function gambarDaftarArea() {
      if (!rects.length) { T.hide(daftarAreaBox); return; }
      T.show(daftarAreaBox, '');
      daftarAreaBox.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:10px 0 6px">Area sensor (' + rects.length + ')</div>'));
      rects.forEach((r, i) => {
        const row = T.el('<div style="display:flex;gap:8px;align-items:center;border:1px solid #ffffff14;border-radius:8px;padding:8px 10px;margin-bottom:6px"></div>');
        const label = T.el('<div style="flex:1;font-size:13px;cursor:pointer">Area ' + (i + 1) + ' · ' + (r.bentuk === 'oval' ? 'oval' : 'persegi') + ' · ' + Math.round(Math.abs(r.w)) + '×' + Math.round(Math.abs(r.h)) + ' px' + (r.otomatis ? ' · wajah' : '') + '</div>');
        label.addEventListener('click', () => { pilihArea = pilihArea === i ? null : i; render2(); });
        const bBentuk = T.btn(r.bentuk === 'oval' ? 'Jadi persegi' : 'Jadi oval', () => {
          r.bentuk = r.bentuk === 'oval' ? 'persegi' : 'oval';
          gambarDaftarArea();
          render2();
        });
        const bHapus = T.btn('Hapus', () => {
          rects.splice(i, 1);
          if (pilihArea === i) pilihArea = null;
          else if (pilihArea != null && pilihArea > i) pilihArea--;
          gambarDaftarArea();
          render2();
        });
        row.appendChild(label);
        row.appendChild(bBentuk);
        row.appendChild(bHapus);
        daftarAreaBox.appendChild(row);
      });
    }

    sizeR.addEventListener('input', () => { sizeV.textContent = sizeR.value + 'px'; render2(); });

    function pix(ctx, x, y, w, h, block) {
      const bw = Math.max(1, Math.round(w / block)), bh = Math.max(1, Math.round(h / block));
      tmp.width = bw; tmp.height = bh;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(canvas, x, y, w, h, 0, 0, bw, bh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, bw, bh, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    }

    function sensorArea(ctx, r, block) {
      const gaya = gayaSel.value;
      const x = Math.max(0, Math.min(r.x, r.x + r.w)), y = Math.max(0, Math.min(r.y, r.y + r.h));
      const w = Math.abs(r.w), h = Math.abs(r.h);
      const oval = r.bentuk === 'oval';
      const klip = () => {
        ctx.save();
        ctx.beginPath();
        if (oval) ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        else ctx.rect(x, y, w, h);
        ctx.clip();
      };
      if (gaya === 'bar') {
        klip();
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
        ctx.restore();
        return;
      }
      if (gaya === 'blur') {
        klip();
        ctx.filter = 'blur(' + Math.max(2, Math.round(block / 2)) + 'px)';
        ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.restore();
        return;
      }
      if (oval) {
        klip();
        pix(ctx, x, y, w, h, block);
        ctx.restore();
        return;
      }
      pix(ctx, x, y, w, h, block);
    }

    function render2() {
      if (!hasImg) return;
      const ctx = canvas.getContext('2d');
      if (mode === 'latar') {
        if (bgSiap) ctx.drawImage(bgHasil, 0, 0, canvas.width, canvas.height);
        else ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      const block = parseInt(sizeR.value, 10);
      if (fullBlur) { sensorArea(ctx, { x: 0, y: 0, w: canvas.width, h: canvas.height, bentuk: 'persegi' }, block * 2); return; }
      for (const r of rects) {
        const w = Math.abs(r.w), h = Math.abs(r.h);
        if (w < 4 || h < 4) continue;
        sensorArea(ctx, r, block);
      }
      // Garis tepi area yang sedang dipilih di daftar.
      if (pilihArea != null && rects[pilihArea]) {
        const r = rects[pilihArea];
        const x = Math.min(r.x, r.x + r.w), y = Math.min(r.y, r.y + r.h);
        ctx.strokeStyle = '#ff6f61'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath();
        if (r.bentuk === 'oval') ctx.ellipse(x + Math.abs(r.w) / 2, y + Math.abs(r.h) / 2, Math.abs(r.w) / 2, Math.abs(r.h) / 2, 0, 0, Math.PI * 2);
        else ctx.rect(x, y, Math.abs(r.w), Math.abs(r.h));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (drag) {
        const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath();
        if (bentukSel.value === 'oval') ctx.ellipse(x + Math.abs(drag.x1 - drag.x0) / 2, y + Math.abs(drag.y1 - drag.y0) / 2, Math.abs(drag.x1 - drag.x0) / 2, Math.abs(drag.y1 - drag.y0) / 2, 0, 0, Math.PI * 2);
        else ctx.rect(x, y, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function toCanvas(e) {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches && e.touches[0] ? e.touches[0] : e);
      return {
        x: (cx.clientX - r.left) * (canvas.width / r.width),
        y: (cx.clientY - r.top) * (canvas.height / r.height),
      };
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (!hasImg || fullBlur || mode !== 'sensor') return;
      e.preventDefault();
      const p = toCanvas(e);
      drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = toCanvas(e);
      drag.x1 = p.x; drag.y1 = p.y;
      render2();
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const w = drag.x1 - drag.x0, h = drag.y1 - drag.y0;
      if (Math.abs(w) > 8 && Math.abs(h) > 8) {
        rects.push({ x: drag.x0, y: drag.y0, w, h, bentuk: bentukSel.value });
        gambarDaftarArea();
      } else {
        // Ketukan (bukan seretan): hapus area yang diketuk, bila ada.
        const p = toCanvas(e);
        for (let i = rects.length - 1; i >= 0; i--) {
          const r = rects[i];
          const x0 = Math.min(r.x, r.x + r.w), x1 = Math.max(r.x, r.x + r.w);
          const y0 = Math.min(r.y, r.y + r.h), y1 = Math.max(r.y, r.y + r.h);
          let kena = false;
          if (r.bentuk === 'oval') {
            const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
            const dx = (p.x - cx) / ((x1 - x0) / 2 || 1), dy = (p.y - cy) / ((y1 - y0) / 2 || 1);
            kena = dx * dx + dy * dy <= 1;
          } else kena = p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
          if (kena) {
            rects.splice(i, 1);
            pilihArea = null;
            gambarDaftarArea();
            T.toast('Area ' + (i + 1) + ' dihapus');
            break;
          }
        }
      }
      drag = null;
      render2();
    });

    async function onFile() {
      if (!fileI.files[0]) return;
      let img;
      try { img = await loadImage(fileI.files[0]); }
      catch (e) { T.toast('File bukan gambar yang valid'); return; }
      const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
      off.width = Math.round(img.naturalWidth * s);
      off.height = Math.round(img.naturalHeight * s);
      off.getContext('2d').drawImage(img, 0, 0, off.width, off.height);
      canvas.width = off.width; canvas.height = off.height;
      rects = []; fullBlur = false; hasImg = true; bgSiap = false; maskCache = null;
      pilihArea = null;
      bAll.classList.remove('primary');
      zoom = 1;
      terapkanZoom();
      gambarDaftarArea();
      render2();
      T.show(box, '');
      box.appendChild(zoomWrap);
      zoomWrap.appendChild(canvas);
      T.toast(mode === 'sensor' ? 'Seret di foto untuk menandai area sensor' : 'Foto dimuat, tekan tombol proses di bawah');
    }
    fileI.addEventListener('change', onFile);

    function terapkanZoom() {
      if (zoom === 1) {
        canvas.style.width = '';
        canvas.style.maxWidth = '100%';
      } else {
        canvas.style.width = Math.round(canvas.width * zoom) + 'px';
        canvas.style.maxWidth = 'none';
      }
    }
    const bZoom1 = T.btn('1x', () => { zoom = 1; terapkanZoom(); });
    const bZoom2 = T.btn('2x', () => { zoom = 2; terapkanZoom(); });

    /* ---- Deteksi wajah otomatis (MediaPipe Face Detection / BlazeFace) ---- */
    const FD_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/face_detection.js';
    const FD_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/';
    let fdSiap = null, fd = null, sedangDeteksi = false;
    async function loadFace() {
      if (fd) return fd;
      if (!fdSiap) {
        fdSiap = Promise.race([
          T.loadScript(FD_CDN).then((ok) => ok && !!window.FaceDetection),
          new Promise((res) => setTimeout(() => res(false), 60000)),
        ]).then((ok) => { if (!ok) fdSiap = null; return ok; });
      }
      const ok = await fdSiap;
      if (!ok) throw new Error('cdn');
      fd = new window.FaceDetection({ locateFile: (f) => FD_BASE + f });
      fd.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
      return fd;
    }
    async function deteksiWajah() {
      if (!hasImg) { T.toast('Pilih foto dulu'); return; }
      if (sedangDeteksi) return;
      sedangDeteksi = true;
      T.show(statusBox, '<p class="center mut">Mencari wajah di foto... (pertama kali butuh internet untuk mengunduh model)</p>');
      try {
        const f = await loadFace();
        const hasil = await new Promise((resolve, reject) => {
          const to = setTimeout(() => reject(new Error('timeout')), 90000);
          f.onResults((res) => { clearTimeout(to); resolve(res); });
          f.send({ image: off }).catch((e) => { clearTimeout(to); reject(e); });
        });
        const det = (hasil && hasil.detections) || [];
        if (!det.length) {
          T.show(statusBox, '<span class="err">Tidak ada wajah yang terdeteksi di foto ini. Coba foto yang menampilkan wajah dengan jelas, atau tandai manual dengan seret.</span>');
          return;
        }
        let baru = 0;
        for (const d of det) {
          const bb = d.boundingBox;
          if (!bb) continue;
          // boundingBox relatif 0-1 (pusat + ukuran). Tambah margin 25%.
          const pad = 0.25;
          const w = bb.width * (1 + pad * 2), h = bb.height * (1 + pad * 2);
          const x0 = (bb.xCenter - w / 2) * off.width;
          const y0 = (bb.yCenter - h / 2) * off.height;
          const rw = w * off.width, rh = h * off.height;
          // Lewati bila hampir sama dengan area wajah yang sudah ada.
          const duplikat = rects.some((r) => r.otomatis && Math.abs(r.x - x0) < 20 && Math.abs(r.y - y0) < 20);
          if (duplikat) continue;
          rects.push({ x: x0, y: y0, w: rw, h: rh, bentuk: 'oval', otomatis: true });
          baru++;
        }
        gambarDaftarArea();
        render2();
        T.hide(statusBox);
        T.toast(baru ? baru + ' wajah ditemukan & ditandai (bentuk oval)' : 'Wajah sudah ditandai semua');
      } catch (e) {
        const msg = e && e.message === 'cdn'
          ? 'Model deteksi wajah tidak bisa dimuat. Cek koneksi internet lalu coba lagi.'
          : e && e.message === 'timeout'
            ? 'Prosesnya terlalu lama. Cek koneksi internet lalu coba lagi.'
            : 'Deteksi wajah gagal. Cek koneksi internetmu lalu coba lagi.';
        T.show(statusBox, '<span class="err">' + msg + '</span>');
      } finally {
        sedangDeteksi = false;
      }
    }

    /* ---- Blur latar potret (segmentasi orang, MediaPipe, pin versi) ---- */
    const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js';
    const MP_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/';
    let mpSiap = null, seg = null;
    async function loadSeg() {
      if (seg) return seg;
      if (!mpSiap) {
        // timeout 60 dtk: script CDN yang nyangkut tidak boleh menggantung selamanya.
        // Gagal tidak di-cache (mpSiap di-reset) supaya tombol proses bisa coba lagi.
        mpSiap = Promise.race([
          T.loadScript(MP_CDN).then((ok) => ok && !!window.SelfieSegmentation),
          new Promise((res) => setTimeout(() => res(false), 60000)),
        ]).then((ok) => { if (!ok) mpSiap = null; return ok; });
      }
      const ok = await mpSiap;
      if (!ok) throw new Error('cdn');
      seg = new window.SelfieSegmentation({ locateFile: (f) => MP_BASE + f });
      seg.setOptions({ modelSelection: 1 });
      return seg;
    }
    function dukungFilter() {
      try { return 'filter' in document.createElement('canvas').getContext('2d'); }
      catch (e) { return false; }
    }
    const latarR = T.input('range'); latarR.min = '2'; latarR.max = '30'; latarR.value = '12';
    const latarV = T.el('<b>12px</b>');
    let maskCache = null; // masker orang yang sudah dilunakkan pinggirnya
    let targetBlur = 'latar'; // 'latar' = blur latar, orang tajam | 'orang' = blur orang, latar tajam
    latarR.addEventListener('input', () => { latarV.textContent = latarR.value + 'px'; if (maskCache) gabungLatar(); });
    let sedangProses = false;
    // Persentase piksel "orang" di masker (disampel kecil biar cepat).
    function cakupanMasker(mask) {
      const w = 100, h = Math.max(1, Math.round(100 * mask.height / mask.width));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(mask, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data;
      let fg = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 127) fg++;
      return fg / (w * h);
    }
    function gabungLatar() {
      const W = off.width, H = off.height, blurPx = +latarR.value;
      // versi blur dari seluruh foto
      const blur = document.createElement('canvas'); blur.width = W; blur.height = H;
      const bx = blur.getContext('2d');
      bx.filter = 'blur(' + blurPx + 'px)';
      bx.drawImage(off, 0, 0);
      bx.filter = 'none';
      // potongan gambar yang dibatasi masker orang
      function potongOrang(sumber) {
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d');
        x.drawImage(sumber, 0, 0);
        x.globalCompositeOperation = 'destination-in';
        x.drawImage(maskCache, 0, 0);
        x.globalCompositeOperation = 'source-over';
        return c;
      }
      bgHasil.width = W; bgHasil.height = H;
      const gx = bgHasil.getContext('2d');
      if (targetBlur === 'latar') {
        gx.drawImage(blur, 0, 0); // latar blur
        gx.drawImage(potongOrang(off), 0, 0); // orang tajam
      } else {
        gx.drawImage(off, 0, 0); // latar tajam
        gx.drawImage(potongOrang(blur), 0, 0); // orang blur
      }
      bgSiap = true;
      render2();
    }
    async function prosesLatar() {
      if (!hasImg) { T.toast('Pilih foto dulu'); return; }
      if (sedangProses) return;
      if (!dukungFilter()) {
        T.show(statusBox, '<span class="err">Browser ini tidak mendukung blur latar. Coba browser lain, atau pakai mode sensor area.</span>');
        return;
      }
      sedangProses = true;
      T.show(statusBox, '<p class="center mut">Memisahkan orang dari latar... (pertama kali butuh internet untuk mengunduh model)</p>');
      try {
        const s = await loadSeg();
        const hasil = await new Promise((resolve, reject) => {
          const to = setTimeout(() => reject(new Error('timeout')), 90000);
          s.onResults((res) => { clearTimeout(to); resolve(res); });
          s.send({ image: off }).catch((e) => { clearTimeout(to); reject(e); });
        });
        if (!hasil || !hasil.segmentationMask) throw new Error('mask');
        // lunakkan pinggir masker sekali, simpan untuk geser slider
        const m = document.createElement('canvas'); m.width = off.width; m.height = off.height;
        const mx = m.getContext('2d');
        mx.filter = 'blur(2px)';
        mx.drawImage(hasil.segmentationMask, 0, 0, m.width, m.height);
        mx.filter = 'none';
        // tidak ada orang terdeteksi: jangan asal blur seluruh foto
        if (cakupanMasker(m) < 0.005) {
          maskCache = null; bgSiap = false;
          T.show(statusBox, '<span class="err">Tidak ada orang yang terdeteksi di foto ini. Coba foto yang menampilkan orang dengan jelas, atau pakai mode sensor area untuk mem-blur manual.</span>');
          return;
        }
        maskCache = m;
        gabungLatar();
        T.hide(statusBox);
        T.toast(targetBlur === 'latar' ? 'Blur latar jadi!' : 'Blur orang jadi!');
      } catch (e) {
        const msg = e && e.message === 'cdn'
          ? 'Model tidak bisa dimuat. Cek koneksi internet lalu coba lagi.'
          : e && e.message === 'timeout'
            ? 'Prosesnya terlalu lama. Cek koneksi internet lalu coba lagi.'
            : 'Blur latar gagal. Cek koneksi internetmu lalu coba lagi. Foto yang dipakai sebaiknya menampilkan orang dengan jelas.';
        T.show(statusBox, '<span class="err">' + msg + '</span>');
      } finally {
        sedangProses = false;
      }
    }

    const bAll = T.btn('Blur seluruh foto', () => { fullBlur = !fullBlur; bAll.classList.toggle('primary', fullBlur); render2(); });
    const bUndo = T.btn('Undo', () => { rects.pop(); pilihArea = null; gambarDaftarArea(); render2(); });
    const bClear = T.btn('Hapus semua', () => { rects = []; pilihArea = null; gambarDaftarArea(); render2(); });
    const dlFmtSel = T.select([['png', 'PNG'], ['jpeg', 'JPEG (ukuran lebih kecil)']], 'png');
    const dlQR = T.input('range'); dlQR.min = '50'; dlQR.max = '100'; dlQR.value = '90';
    const dlQV = T.el('<b>90%</b>');
    const dlQWrap = T.el('<div class="row" style="align-items:center"></div>');
    dlQWrap.appendChild(dlQR); dlQWrap.appendChild(dlQV);
    dlQR.addEventListener('input', () => { dlQV.textContent = dlQR.value + '%'; });
    dlFmtSel.addEventListener('change', () => { dlQWrap.style.display = dlFmtSel.value === 'jpeg' ? '' : 'none'; });
    dlQWrap.style.display = 'none';
    const dlB = T.btn('Unduh hasil', async () => {
      if (!hasImg) { T.toast('Pilih foto dulu'); return; }
      const fmt = dlFmtSel.value;
      // Garis seleksi koral / garis drag adalah elemen UI — jangan sampai
      // ikut terunduh: gambar ulang sekali tanpa garis, baru ambil blob-nya,
      // lalu kembalikan garisnya ke layar.
      const pilihLama = pilihArea;
      pilihArea = null;
      render2();
      let sumber = canvas;
      if (fmt === 'jpeg') {
        // JPEG tidak punya transparansi: timpa di atas latar putih.
        const putih = document.createElement('canvas');
        putih.width = canvas.width; putih.height = canvas.height;
        const px = putih.getContext('2d');
        px.fillStyle = '#fff'; px.fillRect(0, 0, putih.width, putih.height);
        px.drawImage(canvas, 0, 0);
        sumber = putih;
      }
      const blob = await canvasToBlob(sumber, fmt === 'jpeg' ? 'image/jpeg' : 'image/png', fmt === 'jpeg' ? parseInt(dlQR.value, 10) / 100 : undefined);
      pilihArea = pilihLama;
      render2();
      if (!blob) { T.toast('Gagal membuat gambar'); return; }
      T.dl(fmt === 'jpeg' ? 'foto-blur.jpg' : 'foto-blur.png', blob, fmt === 'jpeg' ? 'image/jpeg' : 'image/png');
      T.toast('Berhasil diunduh');
    }, true);

    // Panel per mode
    const panelSensor = T.el('<div></div>');
    const gayaSel = T.select([['pixel', 'Kotak-kotak (pixelate)'], ['blur', 'Blur halus'], ['bar', 'Bar hitam polos']], 'pixel');
    const bentukSel = T.select([['persegi', 'Persegi'], ['oval', 'Oval / lingkaran']], 'persegi');
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(sizeR); sRow.appendChild(sizeV);
    const kekuatanField = T.field('Kekuatan sensor', sRow);
    gayaSel.addEventListener('change', () => {
      kekuatanField.style.display = gayaSel.value === 'bar' ? 'none' : '';
      render2();
    });
    bentukSel.addEventListener('change', () => render2());
    panelSensor.appendChild(T.field('Cara sensor', gayaSel, 'Bar hitam paling aman untuk menutupi tulisan atau wajah.'));
    panelSensor.appendChild(T.grid2(T.field('Bentuk area', bentukSel, 'Oval cocok untuk wajah.'), kekuatanField));
    panelSensor.appendChild(T.row(T.btn('🔍 Deteksi wajah otomatis', () => deteksiWajah(), true)));
    panelSensor.appendChild(T.row(bAll, bUndo, bClear));
    panelSensor.appendChild(T.row(T.el('<span class="dim" style="font-size:12.5px;align-self:center">Perbesar saat menandai:</span>'), bZoom1, bZoom2));
    panelSensor.appendChild(T.el('<p class="hint">Seret/drag di atas foto untuk menandai area yang disensor. Ketuk satu area untuk menghapusnya, atau pakai daftar area di bawah foto. Makin besar nilainya, makin kuat sensornya.</p>'));
    panelSensor.appendChild(daftarAreaBox);

    const panelLatar = T.el('<div></div>');
    const targetSel = T.select([['latar', 'Latar saja (orang tetap tajam)'], ['orang', 'Orang saja (latar tetap tajam)']], 'latar');
    targetSel.addEventListener('change', () => { targetBlur = targetSel.value; if (maskCache) gabungLatar(); });
    const lRow = T.el('<div class="row"></div>');
    lRow.appendChild(latarR); lRow.appendChild(latarV);
    panelLatar.appendChild(T.field('Bagian yang diblur', targetSel));
    panelLatar.appendChild(T.field('Kekuatan blur', lRow));
    panelLatar.appendChild(T.row(T.btn('Proses blur', () => prosesLatar(), true)));
    panelLatar.appendChild(T.el('<p class="hint">Model pemisah orang diunduh sekali dari internet, setelah itu fotonya diproses di perangkatmu.</p>'));
    panelLatar.hidden = true;

    const bModeSensor = T.btn('Sensor area', () => setMode('sensor'), true);
    const bModeLatar = T.btn('Blur latar / orang', () => setMode('latar'));
    function setMode(m) {
      mode = m;
      bModeSensor.classList.toggle('primary', m === 'sensor');
      bModeLatar.classList.toggle('primary', m === 'latar');
      panelSensor.hidden = m !== 'sensor';
      panelLatar.hidden = m !== 'latar';
      canvas.style.cursor = m === 'sensor' ? 'crosshair' : 'default';
      render2();
    }

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    root.appendChild(T.row(bModeSensor, bModeLatar));
    root.appendChild(panelSensor);
    root.appendChild(panelLatar);
    root.appendChild(statusBox);
    root.appendChild(T.grid2(T.field('Format unduhan', dlFmtSel), T.field('Kualitas JPEG', dlQWrap, 'Hanya berlaku bila format JPEG dipilih.')));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    T.onLeave(() => { hasImg = false; rects = []; try { seg && seg.close(); } catch (e) {} seg = null; mpSiap = null; try { fd && fd.close(); } catch (e) {} fd = null; fdSiap = null; });

}
