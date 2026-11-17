import { h as T, utils, fileInput } from '../../core.js';

export const meta = {"id": "tanda-tangan", "name": "Tanda Tangan Digital", "cat": "produktivitas", "icon": "✍️", "desc": "Tanda tangan di layar pakai jari atau stylus, unduh sebagai gambar transparan untuk ditempel di dokumen.", "keywords": "tanda tangan,signature,ttd,canvas,transparan,dokumen"};

export function render(root) {

    // Kunci localStorage bersama tab Tanda Tangan di PDF Lab.
    const TTD_KEY = 'adip-ttd-png';

    const W = 640, H = 260;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.cssText = 'width:100%;max-width:640px;height:auto;touch-action:none;border:1px dashed rgba(255,255,255,.25);border-radius:12px;background:rgba(255,255,255,.06);cursor:crosshair;display:block';
    const ctx = canvas.getContext('2d');

    const tebalI = T.select([['2', 'Tipis'], ['3', 'Sedang'], ['5', 'Tebal'], ['7', 'Sangat tebal']], '3');
    const warnaI = T.select([['#111111', 'Hitam'], ['#1a3fd6', 'Biru']], '#111111');
    const box = T.out();

    let goresan = []; // [{titik:[[x,y]...], tebal, warna}]
    let aktif = null;

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    };

    const gambarUlang = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      goresan.forEach((g) => {
        if (g.titik.length < 2) return;
        ctx.strokeStyle = g.warna;
        ctx.lineWidth = g.tebal;
        ctx.beginPath();
        ctx.moveTo(g.titik[0][0], g.titik[0][1]);
        for (let i = 1; i < g.titik.length; i++) ctx.lineTo(g.titik[i][0], g.titik[i][1]);
        ctx.stroke();
      });
      const kosong = goresan.length === 0;
      T.show(box, kosong
        ? '<p class="dim center">Tanda tangan di kotak di atas dengan jari atau stylus.</p>'
        : '<p class="dim center">Sudah ada ' + goresan.length + ' goresan. Unduh bila sudah pas.</p>');
    };

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      aktif = { titik: [pos(e)], tebal: Number(tebalI.value), warna: warnaI.value };
      goresan.push(aktif);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!aktif) return;
      e.preventDefault();
      aktif.titik.push(pos(e));
      gambarUlang();
    });
    const selesai = (e) => { aktif = null; };
    canvas.addEventListener('pointerup', selesai);
    canvas.addEventListener('pointercancel', selesai);

    const undo = () => { goresan.pop(); gambarUlang(); };
    const hapus = () => { goresan = []; gambarUlang(); };

    // Potong area kosong di sekeliling tanda tangan, kembalikan kanvas hasil.
    const potongCanvas = () => {
      if (goresan.length === 0) return null;
      let minX = W, minY = H, maxX = 0, maxY = 0;
      goresan.forEach((g) => g.titik.forEach((p) => {
        minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
      }));
      const pad = 12;
      minX = Math.max(0, Math.floor(minX - pad)); minY = Math.max(0, Math.floor(minY - pad));
      const cw = Math.min(W - minX, Math.ceil(maxX - minX + pad * 2));
      const ch = Math.min(H - minY, Math.ceil(maxY - minY + pad * 2));
      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
      return out;
    };

    const simpanUntukPdf = (c) => {
      try {
        localStorage.setItem(TTD_KEY, c.toDataURL('image/png'));
        return true;
      } catch (e) { return false; }
    };

    const unduhCanvas = (c, nama) => {
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = nama;
      a.click();
    };

    const unduh = () => {
      const out = potongCanvas();
      if (!out) { T.toast('Belum ada tanda tangan'); return; }
      unduhCanvas(out, 'tanda-tangan.png');
      simpanUntukPdf(out);
      T.toast('Gambar tanda tangan terunduh');
    };

    const tempelKePdf = () => {
      const out = potongCanvas();
      if (!out) { T.toast('Belum ada tanda tangan'); return; }
      simpanUntukPdf(out);
      try { localStorage.setItem('adip-pdflab-tab', '11'); } catch (e) {}
      location.hash = '#/t/pdflab';
    };

    root.appendChild(T.el('<p class="note">Tanda tangan langsung di layar, hasilnya gambar PNG latar transparan, siap ditempel ke surat lamaran, formulir, atau dokumen lain. Semua dikerjakan di HP ini, tanpa dikirim ke server.</p>'));
    root.appendChild(canvas);
    root.appendChild(T.grid2(T.field('Ketebalan pena', tebalI), T.field('Warna tinta', warnaI)));
    root.appendChild(T.row(
      T.btn('⬇️ Unduh PNG', unduh, true),
      T.btn('↩️ Urungkan', undo),
      T.btn('🗑️ Hapus semua', hapus)
    ));
    root.appendChild(T.row(
      T.btn('📄 Tempel ke PDF', tempelKePdf, true)
    ));
    root.appendChild(box);
    gambarUlang();

    /* ---- Dari foto kertas: ekstrak tanda tangan jadi PNG transparan ---- */
    const fotoFi = fileInput('image/*'); fotoFi.style.margin = '6px 0';
    const ambang = T.el('<input type="range" min="120" max="240" value="200" style="width:100%;accent-color:#ffffff">');
    const fotoCanvas = document.createElement('canvas');
    // Latar kotak-kotak terang (CSS saja, tidak ikut terunduh) supaya tinta
    // hitam terlihat jelas dan area transparan kelihatan.
    fotoCanvas.style.cssText = 'width:100%;max-width:640px;height:auto;border:1px dashed rgba(255,255,255,.25);border-radius:12px;background:repeating-conic-gradient(#e8e8e8 0% 25%, #ffffff 0% 50%) 0 0/16px 16px;display:block';
    const fotoBox = T.out();
    let fotoImg = null;
    const olahFoto = () => {
      if (!fotoImg) return;
      const maxW = 900;
      const sc = Math.min(1, maxW / fotoImg.naturalWidth);
      const w = Math.max(1, Math.round(fotoImg.naturalWidth * sc));
      const h = Math.max(1, Math.round(fotoImg.naturalHeight * sc));
      fotoCanvas.width = w; fotoCanvas.height = h;
      const cx = fotoCanvas.getContext('2d');
      cx.drawImage(fotoImg, 0, 0, w, h);
      const imgData = cx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const th = +ambang.value;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Makin gelap makin pekat; kertas terang jadi transparan.
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0;
        d[i + 3] = lum >= th ? 0 : Math.round(255 * (1 - lum / th));
      }
      cx.putImageData(imgData, 0, 0);
    };
    fotoFi.addEventListener('change', () => {
      const f = fotoFi.files && fotoFi.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        fotoImg = img;
        olahFoto();
        T.show(fotoBox, '<p class="dim center">Foto diproses. Geser pengatur bila kertas masih terlihat atau tintanya pudar.</p>');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        T.show(fotoBox, '<p class="dim center">Foto tidak bisa dibaca. Coba foto lain.</p>');
      };
      img.src = url;
    });
    ambang.addEventListener('input', olahFoto);
    const fotoUnduh = () => {
      if (!fotoImg) { T.toast('Pilih dulu foto tanda tangan'); return; }
      unduhCanvas(potongTransparan(fotoCanvas), 'tanda-tangan-foto.png');
      T.toast('Gambar tanda tangan terunduh');
    };
    const fotoSimpan = () => {
      if (!fotoImg) { T.toast('Pilih dulu foto tanda tangan'); return; }
      if (simpanUntukPdf(potongTransparan(fotoCanvas))) T.toast('Tersimpan, bisa dipakai di PDF Lab');
      else T.toast('Gagal menyimpan, memori browser penuh');
    };

    root.appendChild(T.el('<p style="font-weight:600;margin:24px 0 4px">Dari foto kertas</p>'));
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Foto tanda tangan di kertas putih, lalu ubah jadi gambar transparan. Foto kertas putih dengan tinta gelap hasilnya paling bagus.</p>'));
    root.appendChild(fotoFi);
    root.appendChild(T.field('Batas terang kertas', ambang, 'Geser ke kanan bila kertas masih terlihat, ke kiri bila tintanya pudar.'));
    root.appendChild(fotoCanvas);
    root.appendChild(T.row(
      T.btn('⬇️ Unduh PNG', fotoUnduh, true),
      T.btn('💾 Simpan untuk PDF Lab', fotoSimpan)
    ));
    root.appendChild(fotoBox);

    /* ---- Dari nama yang diketik: gaya kaligrafi ---- */
    // Potong area transparan di sekeliling isi kanvas (biar hasil unduhan rapat).
    const potongTransparan = (src) => {
      const w = src.width, h = src.height;
      const cx = src.getContext('2d');
      let d;
      try { d = cx.getImageData(0, 0, w, h).data; } catch (e) { return src; }
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 10) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) return src;
      const pad = 8;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
      x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
      const out = document.createElement('canvas');
      out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
      out.getContext('2d').drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      return out;
    };

    const namaInp = T.input('text', 'Nama lengkap, mis. Nadhif Aslam', '');
    const gayaSel = T.select([
      ['cursive', 'Tulis tangan (kursif)'],
      ['brush', 'Kuas (Brush Script)'],
      ['segoe', 'Tulis tangan rapi (Segoe Script)'],
      ['vibes', 'Kaligrafi elegan (Great Vibes)'],
      ['dancing', 'Tulis tangan santai (Dancing Script)'],
      ['allura', 'Kaligrafi halus (Allura)'],
      ['caveat', 'Tulisan tangan cepat (Caveat)'],
    ], 'cursive');
    const warnaKalSel = T.select([['#111111', 'Hitam'], ['#1a3fd6', 'Biru']], '#111111');
    // Huruf Google Fonts (gratis) dimuat sekali dari internet saat gaya itu dipilih.
    const GFONTS = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@700&family=Allura&family=Caveat:wght@700&display=swap';
    const GAYA_FONT = {
      cursive: { fam: 'cursive', berat: '' },
      brush: { fam: '"Brush Script MT", "Segoe Script", cursive', berat: '' },
      segoe: { fam: '"Segoe Script", "Brush Script MT", cursive', berat: '' },
      vibes: { fam: '"Great Vibes", cursive', berat: '', gf: true },
      dancing: { fam: '"Dancing Script", cursive', berat: '700 ', gf: true },
      allura: { fam: '"Allura", cursive', berat: '', gf: true },
      caveat: { fam: '"Caveat", cursive', berat: '700 ', gf: true },
    };
    let gfontJanji = null, gfontDicoba = false;
    function pastGfont() {
      if (!gfontJanji) gfontJanji = new Promise((res) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = GFONTS;
        l.onload = () => {
          Promise.all([
            document.fonts.load('72px "Great Vibes"'),
            document.fonts.load('700 72px "Dancing Script"'),
            document.fonts.load('72px "Allura"'),
            document.fonts.load('700 72px "Caveat"'),
          ]).then(() => res(true)).catch(() => res(false));
        };
        l.onerror = () => res(false);
        document.head.appendChild(l);
        setTimeout(() => res(false), 15000);
      });
      return gfontJanji;
    }
    const kalCanvas = document.createElement('canvas');
    kalCanvas.width = 640; kalCanvas.height = 200;
    // Latar terang via CSS saja (tidak ikut terunduh) supaya tinta terlihat.
    kalCanvas.style.cssText = 'width:100%;max-width:640px;height:auto;border:1px dashed rgba(255,255,255,.25);border-radius:12px;background:#f5f5f5;display:block';
    const gambarNama = () => {
      const kx = kalCanvas.getContext('2d');
      kx.clearRect(0, 0, 640, 200);
      const nama = namaInp.value.trim();
      if (!nama) return;
      const g = GAYA_FONT[gayaSel.value] || GAYA_FONT.cursive;
      if (g.gf && !gfontDicoba) {
        pastGfont().then(() => { gfontDicoba = true; gambarNama(); });
      }
      let size = 72;
      kx.font = 'italic ' + g.berat + size + 'px ' + g.fam;
      const w = kx.measureText(nama).width;
      if (w > 600) { size = Math.max(28, Math.floor(size * 600 / w)); kx.font = 'italic ' + g.berat + size + 'px ' + g.fam; }
      kx.fillStyle = warnaKalSel.value || '#111111';
      kx.textBaseline = 'middle';
      kx.fillText(nama, (640 - kx.measureText(nama).width) / 2, 105);
    };
    namaInp.addEventListener('input', gambarNama);
    gayaSel.addEventListener('change', gambarNama);
    warnaKalSel.addEventListener('change', gambarNama);
    const kalUnduh = () => {
      if (!namaInp.value.trim()) { T.toast('Ketik dulu namanya'); return; }
      unduhCanvas(potongTransparan(kalCanvas), 'tanda-tangan-nama.png');
      T.toast('Gambar tanda tangan terunduh');
    };
    const kalSimpan = () => {
      if (!namaInp.value.trim()) { T.toast('Ketik dulu namanya'); return; }
      if (simpanUntukPdf(potongTransparan(kalCanvas))) T.toast('Tersimpan, bisa dipakai di PDF Lab');
      else T.toast('Gagal menyimpan, memori browser penuh');
    };
    const kalTempel = () => {
      if (!namaInp.value.trim()) { T.toast('Ketik dulu namanya'); return; }
      simpanUntukPdf(potongTransparan(kalCanvas));
      try { localStorage.setItem('adip-pdflab-tab', '11'); } catch (e) {}
      location.hash = '#/t/pdflab';
    };

    root.appendChild(T.el('<p style="font-weight:600;margin:24px 0 4px">Dari nama yang diketik</p>'));
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketik nama, jadikan tanda tangan gaya kaligrafi. Empat gaya terakhir memakai huruf Google Fonts (diunduh sekali dari internet); tiga gaya pertama memakai huruf yang tersedia di perangkat ini.</p>'));
    root.appendChild(T.grid2(T.field('Nama', namaInp), T.field('Gaya huruf', gayaSel)));
    root.appendChild(T.field('Warna tinta', warnaKalSel));
    root.appendChild(kalCanvas);
    root.appendChild(T.row(
      T.btn('⬇️ Unduh PNG', kalUnduh, true),
      T.btn('💾 Simpan untuk PDF Lab', kalSimpan),
      T.btn('📄 Tempel ke PDF', kalTempel)
    ));

}
