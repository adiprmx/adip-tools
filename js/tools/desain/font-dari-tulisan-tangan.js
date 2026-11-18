import { h as T, LOCAL_NOTE } from '../../core.js';

// Font dari Tulisan Tangan: gambar tiap huruf dengan jarimu, lalu jadikan
// file font OTF yang benar-benar bisa dipakai di HP/komputer.
// Jalurnya nyata, bukan akal-akalan: tiap gambar huruf di-trace jadi
// kurva vektor (potrace, pustaka yang sama dipakai Auto Trace), lalu
// kurvanya dirakit jadi font memakai opentype.js — pustaka yang memang
// bisa MEMBUAT font (new opentype.Font + toArrayBuffer), bukan cuma baca.
// Huruf yang tidak digambar tidak masuk ke font — itu dijelaskan jujur
// di layar, bukan diisi huruf palsu.
export const meta = {"id": "font-dari-tulisan-tangan", "name": "Font dari Tulisan Tangan", "cat": "desain", "icon": "✍️", "desc": "Gambar huruf-hurufmu sendiri, jadikan file font yang bisa dipakai di mana saja.", "keywords": "font,tulisan tangan,huruf,otf,buat font,handwriting", "since": "6.17.0"};

const OT_CDN = 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js';
const POTRACE_ESM = 'https://esm.sh/@cadit-app/potrace-ts@1.3.0';
const UKURAN_GAMBAR = 300; // kanvas gambar per huruf, px
const HURUF = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-\'';
const NAMA_FONT_DEFAULT = 'Tulisanku';

// Ambil semua atribut d="..." dari SVG hasil trace (murni, bisa diuji).
export function ekstrakPathD(svg) {
  const hasil = [];
  const re = /<path[^>]*\sd="([^"]+)"/g;
  let m;
  while ((m = re.exec(String(svg || ''))) !== null) hasil.push(m[1]);
  return hasil;
}

// Parse path SVG (perintah M/L/C/Z, absolut + relatif) jadi daftar perintah
// {type, x, y, x1, y1, x2, y2} dalam koordinat font (murni, bisa diuji).
// skala: pengali ukuran; balikY: bila true, sumbu Y dibalik (SVG y ke
// bawah, font y ke atas); geserX/geserY: tambahan posisi sesudah skala.
export function parsePathD(d, skala, balikY, geserX, geserY) {
  const perintah = [];
  const token = String(d || '').match(/[MLCZmlcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let cx = 0, cy = 0, ax = 0, ay = 0; // posisi sekarang + awal subpath
  const ubah = (x, y) => {
    const fx = x * skala + (geserX || 0);
    const fy = balikY ? (geserY || 0) - y * skala : y * skala + (geserY || 0);
    return [fx, fy];
  };
  while (i < token.length) {
    const t = token[i++];
    if (t === 'M' || t === 'm') {
      const rel = t === 'm';
      const x = parseFloat(token[i++]), y = parseFloat(token[i++]);
      cx = rel ? cx + x : x; cy = rel ? cy + y : y;
      ax = cx; ay = cy;
      const [fx, fy] = ubah(cx, cy);
      perintah.push({ type: 'M', x: fx, y: fy });
      // Pasangan koordinat berikutnya sesudah M = garis (L implisit).
      while (i < token.length && !/^[MLCZmlcz]$/.test(token[i])) {
        const x2 = parseFloat(token[i++]), y2 = parseFloat(token[i++]);
        cx = rel ? cx + x2 : x2; cy = rel ? cy + y2 : y2;
        const [gx, gy] = ubah(cx, cy);
        perintah.push({ type: 'L', x: gx, y: gy });
      }
    } else if (t === 'L' || t === 'l') {
      const rel = t === 'l';
      const x = parseFloat(token[i++]), y = parseFloat(token[i++]);
      cx = rel ? cx + x : x; cy = rel ? cy + y : y;
      const [fx, fy] = ubah(cx, cy);
      perintah.push({ type: 'L', x: fx, y: fy });
    } else if (t === 'C' || t === 'c') {
      const rel = t === 'c';
      const x1 = parseFloat(token[i++]), y1 = parseFloat(token[i++]);
      const x2 = parseFloat(token[i++]), y2 = parseFloat(token[i++]);
      const x = parseFloat(token[i++]), y = parseFloat(token[i++]);
      const p1x = rel ? cx + x1 : x1, p1y = rel ? cy + y1 : y1;
      const p2x = rel ? cx + x2 : x2, p2y = rel ? cy + y2 : y2;
      cx = rel ? cx + x : x; cy = rel ? cy + y : y;
      const [a1x, a1y] = ubah(p1x, p1y);
      const [a2x, a2y] = ubah(p2x, p2y);
      const [fx, fy] = ubah(cx, cy);
      perintah.push({ type: 'C', x1: a1x, y1: a1y, x2: a2x, y2: a2y, x: fx, y: fy });
    } else if (t === 'Z' || t === 'z') {
      perintah.push({ type: 'Z' });
      cx = ax; cy = ay;
    }
  }
  return perintah;
}

// Kotak pembatas dari daftar perintah (murni, bisa diuji).
export function kotakPerintah(perintah) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of perintah) {
    const titik = [[p.x, p.y]];
    if (p.x1 != null) titik.push([p.x1, p.y1], [p.x2, p.y2]);
    for (const [x, y] of titik) {
      if (x == null || y == null) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

export function render(root) {
  const namaInp = T.input('text', 'Nama font, contoh: Tulisanku', NAMA_FONT_DEFAULT);
  const tebalSel = T.select([['tipis', 'Pena tipis'], ['sedang', 'Pena sedang'], ['tebal', 'Pena tebal']], 'sedang');
  const statusBox = T.out();
  const hitungBox = T.out();
  const pratinjauBox = T.out();

  let otSiap = null;
  let potraceSiap = null;
  // goresan[huruf] = [{tebal, titik:[[x,y],...]}, ...]
  const goresan = {};
  let hurufAktif = 'A';
  let fontJadi = null;

  const muatOpentype = () => {
    if (!otSiap) {
      otSiap = (async () => {
        if (typeof window !== 'undefined' && window.opentype) return window.opentype;
        const ok = await T.loadScript(OT_CDN);
        if (!ok || typeof window.opentype === 'undefined') throw new Error('opentype gagal dimuat');
        return window.opentype;
      })().catch((e) => { otSiap = null; throw e; });
    }
    return otSiap;
  };
  const muatPotrace = () => {
    if (!potraceSiap) {
      potraceSiap = import(/* @vite-ignore */ POTRACE_ESM).then((m) => {
        if (typeof m.traceDataUrl !== 'function' || typeof m.getSVG !== 'function') throw new Error('api potrace tidak lengkap');
        return m;
      }).catch((e) => { potraceSiap = null; throw e; });
    }
    return potraceSiap;
  };

  // ---- kanvas gambar ----
  const kanvas = document.createElement('canvas');
  kanvas.width = UKURAN_GAMBAR; kanvas.height = UKURAN_GAMBAR;
  kanvas.style.cssText = 'width:100%;max-width:340px;aspect-ratio:1;border:2px solid #ff6f61;border-radius:12px;background:#fff;touch-action:none;display:block;margin:0 auto;cursor:crosshair';
  const kctx = kanvas.getContext('2d');
  let sedangGambar = false;
  let goresAktif = null;

  const tebalPena = () => (tebalSel.value === 'tipis' ? 5 : tebalSel.value === 'tebal' ? 18 : 10);

  function gambarUlang() {
    kctx.fillStyle = '#ffffff';
    kctx.fillRect(0, 0, UKURAN_GAMBAR, UKURAN_GAMBAR);
    // Garis bantu: garis dasar + garis atas huruf kecil.
    kctx.strokeStyle = '#e8e0d5';
    kctx.lineWidth = 1;
    kctx.beginPath(); kctx.moveTo(0, 225); kctx.lineTo(UKURAN_GAMBAR, 225); kctx.stroke();
    kctx.beginPath(); kctx.moveTo(0, 90); kctx.lineTo(UKURAN_GAMBAR, 90); kctx.stroke();
    kctx.strokeStyle = '#161311';
    kctx.lineCap = 'round';
    kctx.lineJoin = 'round';
    const daftar = goresan[hurufAktif] || [];
    for (const g of daftar) {
      if (g.titik.length < 1) continue;
      kctx.lineWidth = g.tebal;
      kctx.beginPath();
      kctx.moveTo(g.titik[0][0], g.titik[0][1]);
      for (let i = 1; i < g.titik.length; i++) kctx.lineTo(g.titik[i][0], g.titik[i][1]);
      if (g.titik.length === 1) kctx.lineTo(g.titik[0][0] + 0.1, g.titik[0][1] + 0.1);
      kctx.stroke();
    }
  }

  function posisi(e) {
    const b = kanvas.getBoundingClientRect();
    return [
      (e.clientX - b.left) * (UKURAN_GAMBAR / b.width),
      (e.clientY - b.top) * (UKURAN_GAMBAR / b.height),
    ];
  }
  kanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    kanvas.setPointerCapture(e.pointerId);
    sedangGambar = true;
    goresAktif = { tebal: tebalPena(), titik: [posisi(e)] };
    if (!goresan[hurufAktif]) goresan[hurufAktif] = [];
    goresan[hurufAktif].push(goresAktif);
    gambarUlang();
    perbaruiHitungan();
  });
  kanvas.addEventListener('pointermove', (e) => {
    if (!sedangGambar || !goresAktif) return;
    e.preventDefault();
    goresAktif.titik.push(posisi(e));
    gambarUlang();
  });
  const akhiriGores = () => { sedangGambar = false; goresAktif = null; };
  kanvas.addEventListener('pointerup', akhiriGores);
  kanvas.addEventListener('pointercancel', akhiriGores);

  // ---- tombol huruf ----
  const gridHuruf = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0"></div>');
  const tombolHuruf = {};
  function perbaruiHitungan() {
    const sudah = HURUF.split('').filter((ch) => (goresan[ch] || []).length > 0);
    T.show(hitungBox, `<p class="dim">${sudah.length} dari ${HURUF.length} huruf sudah digambar. Huruf yang belum digambar tidak masuk ke font.</p>`);
    HURUF.split('').forEach((ch) => {
      const b = tombolHuruf[ch];
      if (!b) return;
      const ada = (goresan[ch] || []).length > 0;
      b.style.borderColor = ch === hurufAktif ? '#ff6f61' : ada ? '#4caf7d' : '';
      b.style.background = ch === hurufAktif ? '#ff6f61' : ada ? '#1e2b22' : '';
      b.style.color = ch === hurufAktif ? '#161311' : '';
    });
    buatB.disabled = sudah.length === 0;
  }
  HURUF.split('').forEach((ch) => {
    const b = T.btn(ch === ' ' ? 'spasi' : ch, () => {
      hurufAktif = ch;
      gambarUlang();
      perbaruiHitungan();
    });
    b.style.cssText = 'min-width:38px;padding:8px 0;text-align:center;font-size:15px';
    tombolHuruf[ch] = b;
    gridHuruf.appendChild(b);
  });

  function hurufKeDataUrl(ch) {
    const c = document.createElement('canvas');
    c.width = UKURAN_GAMBAR; c.height = UKURAN_GAMBAR;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, UKURAN_GAMBAR, UKURAN_GAMBAR);
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const g of goresan[ch] || []) {
      if (g.titik.length < 1) continue;
      ctx.lineWidth = g.tebal;
      ctx.beginPath();
      ctx.moveTo(g.titik[0][0], g.titik[0][1]);
      for (let i = 1; i < g.titik.length; i++) ctx.lineTo(g.titik[i][0], g.titik[i][1]);
      if (g.titik.length === 1) ctx.lineTo(g.titik[0][0] + 0.1, g.titik[0][1] + 0.1);
      ctx.stroke();
    }
    return c.toDataURL('image/png');
  }

  async function buat() {
    const sudah = HURUF.split('').filter((ch) => (goresan[ch] || []).length > 0);
    if (!sudah.length) { T.toast('Gambar minimal 1 huruf dulu'); return; }
    buatB.disabled = true;
    T.hide(pratinjauBox);
    T.show(statusBox, '<span class="dim">Memuat alat pembuat font… (perlu internet sekali saja)</span>');
    let ot, pot;
    try {
      [ot, pot] = await Promise.all([muatOpentype(), muatPotrace()]);
    } catch (e) {
      T.show(statusBox, '<div class="err">Alat pembuat font gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    try {
      const skala = 1000 / UKURAN_GAMBAR;
      const glyphs = [];
      // .notdef: kotak kosong sebagai pengganti huruf yang tidak ada.
      const notdef = new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new ot.Path() });
      glyphs.push(notdef);
      glyphs.push(new ot.Glyph({ name: 'space', unicode: 32, advanceWidth: 300, path: new ot.Path() }));
      let berhasil = 0;
      for (let idx = 0; idx < sudah.length; idx++) {
        const ch = sudah[idx];
        T.show(statusBox, `<span class="dim">Membuat huruf ${ch}… (${idx + 1} dari ${sudah.length})</span>`);
        await new Promise((r) => setTimeout(r, 0));
        const svg = pot.getSVG(pot.traceDataUrl(hurufKeDataUrl(ch), {
          threshold: 128, turnpolicy: 'minority', turdsize: 2,
          optcurve: true, alphamax: 1, opttolerance: 0.2,
        }), 1);
        const daftarD = ekstrakPathD(svg);
        if (!daftarD.length) continue;
        // Parse dulu tanpa geser untuk mengukur lebarnya.
        let semua = [];
        for (const d of daftarD) semua = semua.concat(parsePathD(d, skala, true, 0, 800));
        const kotak = kotakPerintah(semua);
        if (!kotak) continue;
        // Geser supaya tepi kiri huruf di x=50, lebar spasi kanan 50.
        const geserX = 50 - kotak.minX;
        const path = new ot.Path();
        for (const d of daftarD) {
          const cmds = parsePathD(d, skala, true, geserX, 800);
          for (const c of cmds) {
            if (c.type === 'M') path.moveTo(Math.round(c.x), Math.round(c.y));
            else if (c.type === 'L') path.lineTo(Math.round(c.x), Math.round(c.y));
            else if (c.type === 'C') path.bezierCurveTo(Math.round(c.x1), Math.round(c.y1), Math.round(c.x2), Math.round(c.y2), Math.round(c.x), Math.round(c.y));
            else if (c.type === 'Z') path.closePath();
          }
        }
        const lebar = Math.round((kotak.maxX - kotak.minX) + 100);
        glyphs.push(new ot.Glyph({
          name: ch === '.' ? 'period' : ch === ',' ? 'comma' : ch === '!' ? 'exclam' : ch === '?' ? 'question' : ch === '-' ? 'hyphen' : ch === "'" ? 'quotesingle' : ch,
          unicode: ch.charCodeAt(0),
          advanceWidth: Math.max(200, lebar),
          path,
        }));
        berhasil++;
      }
      if (!berhasil) throw new Error('tidak ada huruf yang berhasil dibuat');
      const namaFont = (namaInp.value || '').trim() || NAMA_FONT_DEFAULT;
      fontJadi = new ot.Font({
        familyName: namaFont,
        styleName: 'Regular',
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        glyphs,
      });
      const buf = fontJadi.toArrayBuffer();
      const blob = new Blob([buf], { type: 'font/otf' });
      T.hide(statusBox);
      T.show(pratinjauBox, '');
      pratinjauBox.appendChild(T.el(`<p><b>Font jadi!</b> ${berhasil} huruf berhasil dibuat dari ${sudah.length} yang digambar.</p>`));
      const prevC = document.createElement('canvas');
      prevC.width = 720; prevC.height = 200;
      prevC.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background:#fff';
      const pctx = prevC.getContext('2d');
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, 720, 200);
      try {
        fontJadi.draw(pctx, sudah.slice(0, 24).join(''), 20, 90, 64, { kerning: false });
        fontJadi.draw(pctx, 'AaBbCc 0123456789', 20, 170, 40, { kerning: false });
      } catch (e) { /* pratinjau gagal, font tetap bisa diunduh */ }
      pratinjauBox.appendChild(prevC);
      const namaAman = namaFont.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || 'fontku';
      pratinjauBox.appendChild(T.el(`<p class="dim">Ukuran file: ${blob.size < 1024 ? blob.size + ' B' : (blob.size / 1024).toFixed(1) + ' KB'}. Pasang file ini di HP/komputermu untuk memakai fontnya.</p>`));
      pratinjauBox.appendChild(T.btn('Unduh File Font (.otf)', () => { T.dl(namaAman + '.otf', blob, 'font/otf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(pratinjauBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat font. Coba gambar hurufnya lebih tebal dan jelas, lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      perbaruiHitungan();
    }
  }

  const hapusB = T.btn('Hapus Gambar Huruf Ini', () => {
    goresan[hurufAktif] = [];
    gambarUlang();
    perbaruiHitungan();
  });
  const urungB = T.btn('Urungkan Goresan Terakhir', () => {
    const daftar = goresan[hurufAktif];
    if (daftar && daftar.length) daftar.pop();
    gambarUlang();
    perbaruiHitungan();
  });
  const buatB = T.btn('Buat File Font', buat, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="dim" style="line-height:1.6">Gambar tiap huruf dengan jari atau stylus di kotak bawah. Gambar huruf besar dan kecil yang kamu butuhkan, lalu tekan tombol buat font. Huruf yang tidak digambar tidak ada di font hasil.</p>'));
  root.appendChild(T.field('Nama font', namaInp));
  root.appendChild(T.field('Pilih huruf yang mau digambar', gridHuruf));
  root.appendChild(T.field('Tebal pena', tebalSel));
  root.appendChild(kanvas);
  root.appendChild(T.el('<p class="hint" style="text-align:center">Gambar hurufnya besar-besar, memenuhi kotak. Garis tipis itu garis bantu saja.</p>'));
  root.appendChild(T.row(urungB, hapusB));
  root.appendChild(hitungBox);
  root.appendChild(statusBox);
  root.appendChild(buatB);
  root.appendChild(pratinjauBox);
  gambarUlang();
  perbaruiHitungan();
}
