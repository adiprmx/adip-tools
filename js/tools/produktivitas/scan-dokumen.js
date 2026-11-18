import { h as T, fileInput, loadImage, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Scan Dokumen: foto dokumen lewat kamera atau unggah foto, luruskan
// sudutnya, ubah jadi hitam-putih bersih, lalu ekspor sebagai PDF.
// Pelurusan memakai warp perspektif mesh segitiga di kanvas (tanpa
// pustaka berat): sudut dokumen digeser manual ke posisi yang benar,
// lalu gambar ditarik lurus. Ekspor PDF-nya dengan pdf-lib.
// BATASAN JUJUR: sudut dokumen diatur manual dengan menyeret titik,
// bukan deteksi otomatis; hasil lurusnya tergantung ketepatan geseranmu.
// Foto yang sangat miring atau blur tetap sulit diluruskan.
export const meta = {"id": "scan-dokumen", "name": "Scan Dokumen", "cat": "produktivitas", "icon": "📷", "desc": "Foto dokumen, luruskan sudutnya, jadi hitam-putih bersih, ekspor PDF.", "keywords": "scan dokumen,foto dokumen,luruskan dokumen,scan ke pdf", "since": "6.17.0"};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_SISI = 2000;

// Hitung matriks affine [a,b,c,d,e,f] yang memetakan segitiga asal ke
// segitiga tujuan: u = a*x + c*y + e, v = b*x + d*y + f.
// Segitiga: [[x1,y1],[x2,y2],[x3,y3]]. Murni, bisa diuji di Node.
// Mengembalikan null bila segitiganya merosot (luas nol).
export function hitungAffine(asal, tujuan) {
  const [x1, y1] = asal[0], [x2, y2] = asal[1], [x3, y3] = asal[2];
  const [u1, v1] = tujuan[0], [u2, v2] = tujuan[1], [u3, v3] = tujuan[2];
  const det = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  if (Math.abs(det) < 1e-9) return null;
  const a = (u1 * (y2 - y3) + u2 * (y3 - y1) + u3 * (y1 - y2)) / det;
  const b = (v1 * (y2 - y3) + v2 * (y3 - y1) + v3 * (y1 - y2)) / det;
  const c = (u1 * (x3 - x2) + u2 * (x1 - x3) + u3 * (x2 - x1)) / det;
  const d = (v1 * (x3 - x2) + v2 * (x1 - x3) + v3 * (x2 - x1)) / det;
  const e = (u1 * (x2 * y3 - x3 * y2) + u2 * (x3 * y1 - x1 * y3) + u3 * (x1 * y2 - x2 * y1)) / det;
  const f = (v1 * (x2 * y3 - x3 * y2) + v2 * (x3 * y1 - x1 * y3) + v3 * (x1 * y2 - x2 * y1)) / det;
  return [a, b, c, d, e, f];
}

// Ubah data piksel RGBA jadi abu-abu di tempat. Murni, bisa diuji di Node.
export function terapkanAbu(data) {
  for (let i = 0; i + 3 < data.length; i += 4) {
    const abu = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = abu; data[i + 1] = abu; data[i + 2] = abu;
  }
  return data;
}

// Ubah data piksel jadi hitam-putih pekat di ambang tertentu (0-255).
// Murni, bisa diuji di Node.
export function terapkanAmbang(data, ambang) {
  const t = Math.max(0, Math.min(255, Number(ambang) || 140));
  for (let i = 0; i + 3 < data.length; i += 4) {
    const abu = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const v = abu >= t ? 255 : 0;
    data[i] = v; data[i + 1] = v; data[i + 2] = v;
  }
  return data;
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.setAttribute('capture', 'environment');
  const modeSel = T.select([
    ['warna', 'Warna asli'],
    ['abu', 'Hitam-putih (abu-abu)'],
    ['pekat', 'Hitam-putih pekat (teks tajam)'],
  ], 'abu');
  const ambangI = T.input('range');
  ambangI.min = '80'; ambangI.max = '200'; ambangI.value = '140';
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  const editorBox = T.out();
  const kanvasTampil = document.createElement('canvas');
  kanvasTampil.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;touch-action:none';
  const kanvasHasil = document.createElement('canvas');
  kanvasHasil.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
  let pdfLibSiap = null;
  let img = null; // HTMLImageElement foto
  let titik = []; // 4 titik sudut dalam koordinat gambar asli [x, y]
  let skalaTampil = 1;
  let sudutSeret = -1;
  let hasilSiap = false;

  const muatPdfLib = () => {
    if (!pdfLibSiap) {
      pdfLibSiap = T.loadScript(PDFLIB_CDN).then((ok) => ok && !!window.PDFLib)
        .catch(() => { pdfLibSiap = null; return false; });
    }
    return pdfLibSiap;
  };

  function gambarEditor() {
    if (!img) return;
    const ctx = kanvasTampil.getContext('2d');
    const lebar = Math.min(img.naturalWidth, 900);
    skalaTampil = lebar / img.naturalWidth;
    kanvasTampil.width = lebar;
    kanvasTampil.height = Math.round(img.naturalHeight * skalaTampil);
    ctx.drawImage(img, 0, 0, kanvasTampil.width, kanvasTampil.height);
    ctx.strokeStyle = '#ff6f61';
    ctx.lineWidth = 2;
    ctx.beginPath();
    titik.forEach((t, i) => {
      const x = t[0] * skalaTampil, y = t[1] * skalaTampil;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    titik.forEach((t) => {
      const x = t[0] * skalaTampil, y = t[1] * skalaTampil;
      ctx.fillStyle = '#ff6f61';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function titikDariEvent(ev) {
    const r = kanvasTampil.getBoundingClientRect();
    return [(ev.clientX - r.left) / skalaTampil, (ev.clientY - r.top) / skalaTampil];
  }

  kanvasTampil.addEventListener('pointerdown', (ev) => {
    if (!img) return;
    const [x, y] = titikDariEvent(ev);
    let terbaik = -1, jarakTerbaik = 36 / skalaTampil;
    titik.forEach((t, i) => {
      const j = Math.hypot(t[0] - x, t[1] - y);
      if (j < jarakTerbaik) { jarakTerbaik = j; terbaik = i; }
    });
    if (terbaik >= 0) {
      sudutSeret = terbaik;
      kanvasTampil.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }
  });
  kanvasTampil.addEventListener('pointermove', (ev) => {
    if (sudutSeret < 0 || !img) return;
    const [x, y] = titikDariEvent(ev);
    titik[sudutSeret] = [
      Math.max(0, Math.min(img.naturalWidth, x)),
      Math.max(0, Math.min(img.naturalHeight, y)),
    ];
    hasilSiap = false;
    gambarEditor();
  });
  const lepasSeret = () => { sudutSeret = -1; };
  kanvasTampil.addEventListener('pointerup', lepasSeret);
  kanvasTampil.addEventListener('pointercancel', lepasSeret);

  // Warp perspektif: bagi segiempat jadi dua segitiga, tiap segitiga
  // digambar dengan transformasi affine ke persegi tujuan.
  function luruskan() {
    if (!img || titik.length !== 4) return false;
    const atas = Math.hypot(titik[1][0] - titik[0][0], titik[1][1] - titik[0][1]);
    const bawah = Math.hypot(titik[2][0] - titik[3][0], titik[2][1] - titik[3][1]);
    const kiri = Math.hypot(titik[3][0] - titik[0][0], titik[3][1] - titik[0][1]);
    const kanan = Math.hypot(titik[2][0] - titik[1][0], titik[2][1] - titik[1][1]);
    let lebar = Math.round(Math.max(atas, bawah));
    let tinggi = Math.round(Math.max(kiri, kanan));
    if (lebar < 10 || tinggi < 10) return false;
    const skala = Math.min(1, MAKS_SISI / Math.max(lebar, tinggi));
    lebar = Math.round(lebar * skala);
    tinggi = Math.round(tinggi * skala);
    kanvasHasil.width = lebar;
    kanvasHasil.height = tinggi;
    const ctx = kanvasHasil.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lebar, tinggi);
    const tujuan = [[0, 0], [lebar, 0], [lebar, tinggi], [0, tinggi]];
    const pasang = [
      { asal: [titik[0], titik[1], titik[2]], tujuan: [tujuan[0], tujuan[1], tujuan[2]] },
      { asal: [titik[0], titik[2], titik[3]], tujuan: [tujuan[0], tujuan[2], tujuan[3]] },
    ];
    for (const p of pasang) {
      const m = hitungAffine(p.asal, p.tujuan);
      if (!m) return false;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.tujuan[0][0], p.tujuan[0][1]);
      ctx.lineTo(p.tujuan[1][0], p.tujuan[1][1]);
      ctx.lineTo(p.tujuan[2][0], p.tujuan[2][1]);
      ctx.closePath();
      ctx.clip();
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
    const mode = modeSel.value;
    if (mode !== 'warna') {
      const imgData = ctx.getImageData(0, 0, lebar, tinggi);
      if (mode === 'pekat') terapkanAmbang(imgData.data, Number(ambangI.value));
      else terapkanAbu(imgData.data);
      ctx.putImageData(imgData, 0, 0);
    }
    hasilSiap = true;
    return true;
  }

  async function eksporPdf() {
    if (!hasilSiap) {
      if (!luruskan()) { T.toast('Luruskan dulu dokumennya'); return; }
      T.show(box, '');
      box.appendChild(kanvasHasil);
    }
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await muatPdfLib();
    if (!ok) { T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>'); return; }
    T.hide(statusBox);
    const L = window.PDFLib;
    const doc = await L.PDFDocument.create();
    const w = kanvasHasil.width, h = kanvasHasil.height;
    // Halaman mengikuti rasio gambar, lebar dasar A4 (595 pt).
    const lebarPt = 595.28;
    const tinggiPt = lebarPt * (h / w);
    const page = doc.addPage([lebarPt, tinggiPt]);
    const jpg = await new Promise((res) => kanvasHasil.toBlob((b) => res(b), 'image/jpeg', 0.92));
    const bytes = new Uint8Array(await jpg.arrayBuffer());
    const gambar = await doc.embedJpg(bytes);
    page.drawImage(gambar, { x: 0, y: 0, width: lebarPt, height: tinggiPt });
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    T.show(hasilBox, '');
    hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
    hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl('hasil-scan.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.btn('Unduh Gambar (JPG)', () => { T.dl('hasil-scan.jpg', jpg, 'image/jpeg'); T.toast('Berhasil diunduh'); }));
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox); T.hide(statusBox); T.hide(box);
    hasilSiap = false;
    try {
      img = await loadImage(f);
      const w = img.naturalWidth, h = img.naturalHeight;
      const inset = 0.06;
      titik = [
        [w * inset, h * inset],
        [w * (1 - inset), h * inset],
        [w * (1 - inset), h * (1 - inset)],
        [w * inset, h * (1 - inset)],
      ];
      editorBox.hidden = false;
      gambarEditor();
      T.scrollToPreview(editorBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar.</div>');
    }
    fi.value = '';
  });

  // Editor dibangun sejak render (tersembunyi sampai foto dipilih) supaya
  // tombolnya selalu ada dan bisa dijangkau keyboard.
  editorBox.appendChild(T.el('<p class="note">Seret 4 titik merah ke sudut dokumenmu, lalu tekan Luruskan.</p>'));
  editorBox.appendChild(kanvasTampil);
  editorBox.appendChild(T.row(
    T.btn('Luruskan', () => {
      if (!img) { T.toast('Pilih foto dokumen dulu'); return; }
      if (!luruskan()) { T.toast('Sudutnya belum benar, geser titiknya'); return; }
      T.show(box, '');
      box.appendChild(kanvasHasil);
      T.scrollToPreview(box);
    }, true),
    T.btn('Ekspor PDF', eksporPdf),
  ));

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Sudut dokumen diatur manual dengan menyeret titik ke sudutnya, bukan deteksi otomatis. Foto yang sangat miring atau blur tetap sulit diluruskan.</p>'));
  root.appendChild(T.field('Foto dokumen (kamera atau galeri)', fi));
  root.appendChild(T.grid2(T.field('Warna hasil', modeSel), T.field('Ambang hitam-putih pekat', ambangI)));
  root.appendChild(editorBox);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
