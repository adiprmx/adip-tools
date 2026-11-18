import { h as T, kv, errBox } from '../../core.js';

export const meta = {"id": "generator-struk-spotify", "name": "Generator Struk Spotify", "cat": "musik", "icon": "🧾", "desc": "Struk belanja dari lagu-lagu favoritmu, siap dibagikan sebagai gambar.", "keywords": "struk,spotify,receipt,lagu,favorit,gambar,bagikan", "since": "6.17.0"};

/* Satu lagu per baris: "Judul - Artis - 3:24" atau "Judul - Artis" atau
   "Judul". Durasi di ujung (mm:ss) bersifat opsional. Maksimal 50 lagu.
   Fungsi murni, diuji di Node. */
export function parseReceiptLines(text) {
  const out = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    let durationSec = null;
    let rest = line;
    const dm = rest.match(/[-–]\s*(\d{1,3}):(\d{2})\s*$/);
    if (dm) {
      durationSec = parseInt(dm[1], 10) * 60 + parseInt(dm[2], 10);
      rest = rest.slice(0, dm.index).trim();
    }
    const parts = rest.split(/\s+[-–]\s+/);
    const title = (parts[0] || '').trim();
    const artist = parts.slice(1).join(' - ').trim();
    if (!title) continue;
    out.push({ title, artist, durationSec });
  }
  return out.slice(0, 50);
}

export function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* Gambar struk di atas kanvas: kertas putih, huruf monospace, garis
   putus-putus, seperti struk belanja sungguhan. */
export function drawReceipt(canvas, items, name) {
  const W = 340;
  const PAD = 20;
  const SCALE = 2;
  const wrapTitle = (title) => {
    const max = 30;
    if (title.length <= max) return [title];
    const words = title.split(' ');
    const lines = [''];
    for (const w of words) {
      if ((lines[lines.length - 1] + ' ' + w).trim().length > max && lines[lines.length - 1]) lines.push(w);
      else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
    }
    if (lines.length > 2) lines.length = 2;
    return lines;
  };
  const rows = items.map((it) => ({ it, lines: wrapTitle(it.title) }));
  const headerH = name ? 132 : 112;
  const itemsH = rows.reduce((t, r) => t + (r.lines.length * 18 + (r.it.artist ? 16 : 0) + 10), 0);
  const H = headerH + itemsH + 96;
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  let y = 18;
  ctx.font = '700 26px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTIFY', W / 2, y);
  y += 32;
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('STRUK LAGU', W / 2, y);
  y += 20;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  ctx.fillText(today, W / 2, y);
  y += 18;
  if (name) {
    ctx.fillText('UNTUK: ' + name.toUpperCase(), W / 2, y);
    y += 18;
  }
  const dashed = (yy) => {
    ctx.strokeStyle = '#111111';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD, yy);
    ctx.lineTo(W - PAD, yy);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  y += 6;
  dashed(y);
  y += 10;
  ctx.textAlign = 'left';
  for (const r of rows) {
    const num = (rows.indexOf(r) + 1) + '.';
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillText(num, PAD, y);
    const tx = PAD + 26;
    r.lines.forEach((ln, li) => {
      ctx.fillText(ln, tx, y + li * 18);
    });
    if (r.it.durationSec != null) {
      ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatDuration(r.it.durationSec), W - PAD, y);
      ctx.textAlign = 'left';
    }
    y += r.lines.length * 18;
    if (r.it.artist) {
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = '#555555';
      ctx.fillText(r.it.artist, tx, y);
      ctx.fillStyle = '#111111';
      y += 16;
    }
    y += 10;
  }
  dashed(y);
  y += 12;
  ctx.font = '700 13px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL LAGU', PAD, y);
  ctx.textAlign = 'right';
  ctx.fillText(String(items.length), W - PAD, y);
  y += 20;
  const withDur = items.filter((i) => i.durationSec != null);
  if (withDur.length) {
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL DURASI', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatDuration(withDur.reduce((t, i) => t + i.durationSec, 0)), W - PAD, y);
    y += 20;
  }
  y += 12;
  ctx.textAlign = 'center';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('TERIMA KASIH', W / 2, y);
  // Garis-garis dekoratif ala kode batang di bawah struk.
  y += 20;
  let bx = W / 2 - 60;
  const seed = items.length * 7 + 3;
  for (let i = 0; i < 24; i++) {
    const wdt = 1 + ((seed * (i + 3)) % 3);
    ctx.fillRect(bx, y, wdt, 26);
    bx += wdt + 2;
  }
  return { width: W, height: H };
}

export function render(root) {
  const nameInp = T.input('text', 'Namamu (opsional)');
  const ta = T.ta(8, 'Satu lagu per baris. Contoh:\nBlinding Lights - The Weeknd - 3:20\nLevitating - Dua Lipa - 3:23\nAs It Was - Harry Styles');
  const outBox = T.out();
  const prevWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;margin:0 auto;border:1px solid #ffffff20;border-radius:6px;max-width:100%';
  prevWrap.appendChild(canvas);
  let items = [];

  const makeBtn = T.btn('Buat struknya', () => {
    items = parseReceiptLines(ta.value);
    if (!items.length) {
      T.show(outBox, errBox('Tulis dulu minimal satu lagu, satu per baris. Formatnya: Judul - Artis - 3:24. Durasi boleh tidak diisi.'));
      prevWrap.hidden = true;
      return;
    }
    drawReceipt(canvas, items, nameInp.value.trim());
    prevWrap.hidden = false;
    const typedLines = ta.value.split('\n').filter((l) => l.trim()).length;
    T.show(outBox,
      kv('Lagu di struk', items.length + ' lagu') +
      (typedLines > 50 ? '<p class="hint">Kamu menulis ' + typedLines + ' baris, hanya 50 lagu pertama yang masuk struk.</p>' : ''));
    outBox.appendChild(T.row(T.btn('Unduh gambar (PNG)', () => {
      canvas.toBlob((blob) => {
        if (blob) { T.dl('struk-spotify.png', blob, 'image/png'); T.toast('Struk terunduh'); }
        else T.show(outBox, errBox('Gambar tidak bisa dibuat. Coba lagi.'));
      }, 'image/png');
    }, true)));
    T.toast('Struk jadi');
  }, true);

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = 'Blinding Lights - The Weeknd - 3:20\nLevitating - Dua Lipa - 3:23\nAs It Was - Harry Styles - 2:47\nStarboy - The Weeknd - 3:50\nWatermelon Sugar - Harry Styles - 2:54';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis lagu-lagu favoritmu, jadilah gambar struk belanja ala Spotify yang bisa dibagikan. Tanggal di struk adalah tanggal hari ini.</p>'));
  root.appendChild(T.field('Nama di struk (opsional)', nameInp, 'Kosongkan bila tidak mau ada nama.'));
  root.appendChild(T.field('Daftar lagu', ta, 'Satu lagu per baris. Tulis "Judul - Artis - menit:detik". Durasi boleh tidak diisi. Maksimal 50 lagu.'));
  root.appendChild(T.row(contohBtn, makeBtn));
  root.appendChild(prevWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Semua yang tampil di struk berasal dari tulisanmu sendiri. Tidak ada data lagu yang diambil dari mana pun.</p>'));
}
