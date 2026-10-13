import { h as T, utils, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "quotegenerator", "name": "Quote Generator", "cat": "teks", "icon": "💬", "desc": "Bikin gambar quote 736×917: teks justify + kata sorotan, render lokal.", "keywords": "quote,kutipan,gambar,canvas,sorotan,highlight"};

// Geometri & gaya disamakan ke tool asli (Nexora quotegenerator):
// kanvas portrait 736×917, kertas terang monokrom, teks #1a1a1a,
// highlight = kotak rgba(180,180,180,0.6) di belakang kata,
// font Crimson Text 60→20px step 1, line-height 1.35,
// baris terakhir di-center, justify (maxW−Σkata)/(n−1),
// author polos 26px di tengah footer 12%, unduh JPG q0.9.
const W = 736, H = 917;
const INK = '#1a1a1a';
const HL_BOX = 'rgba(180,180,180,0.6)';
const FONT_STACK = "'Crimson Text', Georgia, 'Times New Roman', serif";
const GFONT_HREF = 'https://fonts.googleapis.com/css2?family=Crimson+Text&display=swap';

// RNG deterministik biar tekstur kertas stabil antar render
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tekstur kertas prosedural (independen — tanpa hotlink aset pihak ketiga):
// basis hangat terang + gradasi cahaya terang-kiri-atas → gelap-kanan-bawah
// + grain halus + serat + noda lembut, meniru foto kertas monokrom asli.
function paperBG(ctx) {
  ctx.fillStyle = '#b3a496';
  ctx.fillRect(0, 0, W, H);

  // cahaya: terang di kiri-atas, meredup ke kanan-bawah.
  // W3 (13 Okt 2026): stop di-fit ke kurva diagonal foto asli (diukur via PIL
  // dari BG 736x917: t=0.05 -> (229,220,213); t=0.30 -> (189,178,170);
  // t=0.55 -> (159,147,139); t=0.80 -> (158,143,128); t=0.95 -> (158,138,113)).
  // Hasil gradasi di atas basis #b3a496 kini dalam +/-14 RGB dari foto di
  // seluruh diagonal (mayoritas titik <=10; satu titik noda lokal 14),
  // sebelumnya: sudut BR ~35 terlalu gelap, tengah ~17 terlalu terang.
  // Basis #b3a496 sendiri = mean foto (177.9,163.9,153.1).
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(255,250,240,0.67)');
  g.addColorStop(0.3, 'rgba(255,250,240,0.17)');
  g.addColorStop(0.55, 'rgba(70,52,36,0.14)');
  g.addColorStop(0.8, 'rgba(70,52,36,0.19)');
  g.addColorStop(1, 'rgba(70,52,36,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const rnd = mulberry32(20260425);

  // noda lembut (blotch) skala besar — alpha 0.13 agar stddev tekstur
  // mendekati foto asli (stddev ~24-27, sebelumnya blotch 0.10 undershoot)
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W, y = rnd() * H, r = 60 + rnd() * 150;
    const dark = rnd() > 0.5;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, dark ? 'rgba(90,72,58,0.13)' : 'rgba(255,252,246,0.13)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // grain halus via tile noise kecil yang di-scale (murah & cepat)
  const tw = 184, th = 229;
  const tile = document.createElement('canvas');
  tile.width = tw; tile.height = th;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(tw, th);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(rnd() * 40); // variasi luminance
    img.data[i] = v + 12; img.data[i + 1] = v; img.data[i + 2] = v - 10;
    img.data[i + 3] = 34; // alpha rendah (dinaikkan 26->34, W3: kejar stddev foto)
  }
  tctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tile, 0, 0, W, H);

  // serat kertas: goresan pendek acak sangat tipis
  ctx.lineWidth = 1;
  for (let i = 0; i < 420; i++) {
    const x = rnd() * W, y = rnd() * H;
    const a = rnd() * Math.PI, l = 3 + rnd() * 9;
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(255,252,246,0.06)' : 'rgba(80,64,50,0.06)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
}

// Auto-fit: coba 60→20 step 1, lineHeight = size×1.35,
// bungkus kata greedy dengan measureText (kurung siku diabaikan saat ukur).
function calcFontSize(ctx, text, maxW, maxH) {
  const words = text.split(' ');
  for (let size = 60; size >= 20; size -= 1) {
    ctx.font = size + 'px ' + FONT_STACK;
    const lh = size * 1.35;
    let lines = 0, cur = [];
    for (const word of words) {
      const testLine = cur.concat([word]).join(' ').replace(/[\[\]]/g, '');
      if (ctx.measureText(testLine).width > maxW && cur.length > 0) {
        lines++; cur = [word];
      } else {
        cur.push(word);
      }
    }
    lines++;
    if (lines * lh <= maxH) return size;
  }
  return 20;
}

// Teks rata penuh + sorotan. Semantik disamakan ke tool asli:
// - token cocok /^\[(.+?)\]([^\w]*)$/ → sorot kata di dalam kurung (satu token
//   utuh; tanda baca boleh menempel, mis. "[baik]." → sorot "baik" saja)
// - "[satu kali]" terpecah jadi token "[satu" & "kali]" → regex gagal →
//   tampil mentah apa adanya (kurung ikut terlihat), TIDAK disorot
// - baris non-terakhir (>1 kata): spasi = (maxW − Σlebar kata)/(n−1),
//   mulai dari centerX − maxW/2
// - baris terakhir / 1 kata: di-CENTER (bukan rata kiri)
function drawTextJustified(ctx, text, centerX, centerY, maxW, fontSize) {
  const lh = fontSize * 1.35;
  const words = text.split(' ');
  const lines = [];
  let cur = [];
  for (const word of words) {
    const testLine = cur.concat([word]).join(' ').replace(/[\[\]]/g, '');
    if (ctx.measureText(testLine).width > maxW && cur.length > 0) {
      lines.push(cur); cur = [word];
    } else {
      cur.push(word);
    }
  }
  lines.push(cur);

  let startY = centerY - ((lines.length - 1) * lh) / 2;

  lines.forEach((line, index) => {
    const isLast = index === lines.length - 1;
    const parts = line.map((word) => {
      const m = word.match(/^\[(.+?)\]([^\w]*)$/);
      if (m) {
        const content = m[1], trailing = m[2] || '';
        const hlW = ctx.measureText(content).width;
        const trW = ctx.measureText(trailing).width;
        return { content, trailing, hl: true, w: hlW + trW, hlW };
      }
      return { content: word, trailing: '', hl: false, w: ctx.measureText(word).width, hlW: 0 };
    });

    const totalW = parts.reduce((s, p) => s + p.w, 0);
    let x, spaceW;
    if (!isLast && line.length > 1) {
      spaceW = (maxW - totalW) / (line.length - 1);
      x = centerX - maxW / 2;
    } else {
      const sp = ctx.measureText(' ').width;
      spaceW = sp;
      x = centerX - (totalW + sp * (line.length - 1)) / 2;
    }

    for (const p of parts) {
      if (p.hl) {
        ctx.fillStyle = HL_BOX;
        ctx.fillRect(x, startY - fontSize * 0.45, p.hlW, fontSize * 0.95);
      }
      ctx.fillStyle = INK;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(p.content, x, startY);
      if (p.trailing) ctx.fillText(p.trailing, x + p.hlW, startY);
      x += p.w + spaceW;
    }
    startY += lh;
  });
}

function renderQuote(canvas, text, author) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  paperBG(ctx);

  const padding = W * 0.15;          // 110.4 px tiap sisi
  const footerH = H * 0.12;          // 110 px
  const centerX = W / 2;
  const maxW = W - padding * 2;      // 515.2 px
  const areaTop = padding;
  const areaH = H - footerH - areaTop;
  const cy = areaTop + areaH / 2;    // teks di-center vertikal di area

  const size = calcFontSize(ctx, text, maxW, areaH);
  ctx.font = size + 'px ' + FONT_STACK;
  drawTextJustified(ctx, text, centerX, cy, maxW, size);

  // author: polos 26px, tanpa "—", tanpa garis, tanpa italic, center di footer
  ctx.font = '26px ' + FONT_STACK;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(author, centerX, H - footerH / 2);
  ctx.textAlign = 'left';
}

// Pastikan Crimson Text (Google Fonts) termuat sebelum mengukur/menggambar
let fontReady = null;
function ensureFont() {
  if (!fontReady) {
    if (!document.querySelector('link[data-qg-font]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = GFONT_HREF;
      l.setAttribute('data-qg-font', '1');
      document.head.appendChild(l);
    }
    fontReady = Promise.all([
      document.fonts.load("60px 'Crimson Text'"),
      document.fonts.load("26px 'Crimson Text'"),
    ]).catch(() => {});
  }
  return fontReady;
}

export function render(root) {
  const ta = T.ta(5, 'Masukan teks disini... Gunakan [kata] untuk menyorot tulisan', '');
  const authorInp = T.input('text', 'Nama penulis', 'Someone');
  const out = T.out();
  const prevBox = T.out();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'width:100%;max-width:420px;border-radius:12px;border:1px solid #ffffff20;display:block;margin:0 auto';
  let sudah = false;

  const buat = async () => {
    const text = ta.value.trim();
    if (!text) { T.show(out, errBox('Isi dulu teks kutipannya.')); return; }
    if (text.length > 1200) { T.show(out, errBox('Teks maksimal 1200 karakter biar muat di gambar.')); return; }
    T.hide(out);
    await ensureFont();
    renderQuote(canvas, text, authorInp.value.trim() || 'Someone');
    T.show(prevBox, '');
    prevBox.appendChild(canvas);
    const row = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px"></div>');
    const dlB = T.btn('⬇️ Unduh JPG', () => {
      canvas.toBlob((b) => T.dl('hasil_justify_monokrom.jpg', b, 'image/jpeg'), 'image/jpeg', 0.9);
    }, true);
    const cpB = T.copyBtn(() => ta.value, '📋 Salin Teks');
    row.appendChild(dlB); row.appendChild(cpB);
    prevBox.appendChild(row);
    sudah = true;
  };

  ta.addEventListener('input', () => { if (sudah) buat(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis kutipan, tandai kata penting dengan <b>[kurung siku]</b> untuk disorot, lalu unduh sebagai gambar 736×917 (JPG). 100% digambar lokal di HP — tanpa server, tanpa API.</p>'));
  root.appendChild(T.field('Isi Teks Kutipan', ta));
  root.appendChild(T.field('Penulis', authorInp));
  root.appendChild(T.row(T.btn('🎨 Buat Quote', buat, true)));
  root.appendChild(out);
  root.appendChild(prevBox);
}
