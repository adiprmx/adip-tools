import { h as T, utils, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "quotegenerator", "name": "Quote Generator", "cat": "teks", "icon": "💬", "desc": "Bikin gambar quote: teks justify + kata sorotan, render lokal.", "keywords": "quote,kutipan,gambar,canvas,sorotan,highlight"};

const W = 1080, H = 1080;
const CORAL = '#ff7a59', CREAM = '#f6f1e8', DIMC = '#c9bda9';

// Pecah teks jadi token {t, hl}; [kata] = sorotan. Kurung tak tertutup = teks biasa.
function tokenize(s) {
  const out = [];
  const parts = String(s).split(/(\[[^\[\]]*\])/g);
  for (const p of parts) {
    if (!p) continue;
    if (/^\[[^\[\]]*\]$/.test(p)) {
      p.slice(1, -1).split(/\s+/).filter(Boolean).forEach((w) => out.push({ t: w, hl: true }));
    } else {
      p.split(/\s+/).filter(Boolean).forEach((w) => out.push({ t: w, hl: false }));
    }
  }
  return out;
}

// Bintang prosedural (tanpa aset eksternal)
function starfield(ctx, seed) {
  let s = seed;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 220; i++) {
    const x = rnd() * W, y = rnd() * H, r = rnd() * 1.6 + 0.3, a = rnd() * 0.55 + 0.08;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(246,241,232,' + a.toFixed(2) + ')';
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }
}

function renderQuote(canvas, text, author) {
  const ctx = canvas.getContext('2d');
  // latar: gradasi gelap hangat + bintang
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, '#221b15');
  g.addColorStop(0.55, '#161210');
  g.addColorStop(1, '#0c0a08');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  starfield(ctx, 1234567);
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  const tokens = tokenize(text);
  const padX = 120, maxW = W - padX * 2;
  const maxTextH = H - 420;
  let size = 68, lines = [];
  // cari ukuran font terbesar yang muat
  while (size >= 30) {
    ctx.font = size + 'px Georgia, "Times New Roman", serif';
    lines = [];
    let cur = [], cw = 0;
    const sp = ctx.measureText(' ').width;
    for (const tk of tokens) {
      const w = ctx.measureText(tk.t).width;
      const add = cur.length ? sp + w : w;
      if (cw + add > maxW && cur.length) { lines.push({ toks: cur, w: cw }); cur = []; cw = 0; }
      cur.push(tk); cw += cur.length > 1 ? sp + w : w;
    }
    if (cur.length) lines.push({ toks: cur, w: cw });
    const lh = size * 1.55;
    if (lines.length * lh <= maxTextH) break;
    size -= 4;
  }
  const lh = size * 1.55;
  const totalH = lines.length * lh;
  let y = (H - totalH) / 2 - 40;

  ctx.textBaseline = 'alphabetic';
  lines.forEach((ln, li) => {
    const last = li === lines.length - 1;
    const sp = ctx.measureText(' ').width;
    const n = ln.toks.length;
    const gaps = n - 1;
    // Rata penuh: x maju Σkata + n·(sp+extra) dan harus pas = maxW
    // → extra = (maxW − ln.w − sp) / n   (ln.w sudah termasuk (n−1)·sp)
    const extra = (!last && gaps > 0) ? (maxW - ln.w - sp) / n : 0;
    let x = padX;
    // baris non-terakhir berisi 1 kata: tengahkan (perilaku tool asli)
    if (!last && n === 1) x = padX + (maxW - ln.w) / 2;
    // rata penuh: mulai dari kiri, spasi antar kata dilebarkan
    for (const tk of ln.toks) {
      ctx.font = size + 'px Georgia, "Times New Roman", serif';
      ctx.fillStyle = tk.hl ? CORAL : CREAM;
      ctx.fillText(tk.t, x, y);
      x += ctx.measureText(tk.t).width + sp + extra;
    }
    y += lh;
  });

  // garis hairline + author
  const ay = y + 60;
  ctx.strokeStyle = 'rgba(246,241,232,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 60, ay); ctx.lineTo(W / 2 + 60, ay); ctx.stroke();
  ctx.font = 'italic 34px Georgia, serif';
  ctx.fillStyle = DIMC;
  ctx.textAlign = 'center';
  ctx.fillText('— ' + (author || 'Someone'), W / 2, ay + 62);
  ctx.textAlign = 'left';
}

export function render(root) {
  const ta = T.ta(5, 'Masukan teks disini... Gunakan [kata] untuk menandai/sorot tulisan', '');
  const authorInp = T.input('text', 'Nama penulis', 'Someone');
  const out = T.out();
  const prevBox = T.out();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'width:100%;max-width:420px;border-radius:12px;border:1px solid #ffffff20;display:block;margin:0 auto';
  let sudah = false;

  const buat = () => {
    const text = ta.value.trim();
    if (!text) { T.show(out, errBox('Isi dulu teks kutipannya.')); return; }
    if (text.length > 1200) { T.show(out, errBox('Teks maksimal 1200 karakter biar muat di gambar.')); return; }
    T.hide(out);
    renderQuote(canvas, text, authorInp.value.trim());
    T.show(prevBox, '');
    prevBox.appendChild(canvas);
    const row = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px"></div>');
    const dlB = T.btn('⬇️ Unduh PNG', () => {
      canvas.toBlob((b) => T.dl('quote-' + Date.now() + '.png', b, 'image/png'), 'image/png');
    }, true);
    const cpB = T.copyBtn(() => ta.value, '📋 Salin Teks');
    row.appendChild(dlB); row.appendChild(cpB);
    prevBox.appendChild(row);
    sudah = true;
  };

  ta.addEventListener('input', () => { if (sudah) buat(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis kutipan, tandai kata penting dengan <b>[kurung siku]</b> untuk disorot coral, lalu unduh sebagai gambar 1080×1080. 100% digambar lokal di HP — tanpa server, tanpa API.</p>'));
  root.appendChild(T.field('Isi Teks Kutipan', ta));
  root.appendChild(T.field('Penulis', authorInp));
  root.appendChild(T.row(T.btn('🎨 Buat Quote', buat, true)));
  root.appendChild(out);
  root.appendChild(prevBox);
}
