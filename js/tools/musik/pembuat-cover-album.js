import { h as T, kv, errBox } from '../../core.js';

export const meta = {"id": "pembuat-cover-album", "name": "Pembuat Cover Album", "cat": "musik", "icon": "💿", "desc": "Desain sampul album persegi dari fotomu, lengkap dengan judul dan nama artis.", "keywords": "cover,album,sampul,desain,lagu,musik,artwork", "since": "6.17.0"};

/* Gambar menutupi kanvas persegi sepenuhnya (potong sisi berlebih). */
export function drawCover(ctx, img, size) {
  const s = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
}

/* Bungkus teks jadi maksimal 2 baris sesuai lebar. Fungsi murni (diuji
   di Node dengan pengukur lebar palsu). */
export function wrapText(measure, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [''];
  for (const w of words) {
    const trial = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w;
    if (measure(trial) <= maxWidth || !lines[lines.length - 1]) lines[lines.length - 1] = trial;
    else if (lines.length < 2) lines.push(w);
    else lines[1] = lines[1] + ' ' + w;
  }
  // Baris kedua yang masih kepanjangan dipotong dengan elipsis.
  if (lines[1] && measure(lines[1]) > maxWidth) {
    let t = lines[1];
    while (t.length > 1 && measure(t + '…') > maxWidth) t = t.slice(0, -1);
    lines[1] = t + '…';
  }
  return lines.filter((l) => l);
}

export function render(root) {
  const SIZE = 1080;
  const file = T.input('file');
  file.accept = 'image/*';
  const titleInp = T.input('text', 'Judul album');
  const artistInp = T.input('text', 'Nama artis');
  const tplSel = T.select([
    ['bawah', 'Teks di bawah'],
    ['atas', 'Teks di atas'],
    ['tengah', 'Teks di tengah'],
    ['minimal', 'Minimal (kecil di pojok)'],
  ], 'bawah');
  const outBox = T.out();
  const prevWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.cssText = 'display:block;width:100%;max-width:420px;margin:0 auto;border:1px solid #ffffff20;border-radius:10px';
  prevWrap.appendChild(canvas);
  const emptyNote = T.el('<p class="hint">Pilih foto dulu, pratinjau sampul akan muncul di sini.</p>');
  let photo = null, photoUrl = null, fontReady = false;

  const renderCover = async () => {
    if (!photo) return;
    const ctx = canvas.getContext('2d');
    if (!fontReady) {
      try {
        if (document.fonts && document.fonts.load) {
          await document.fonts.load('700 96px "Bricolage Grotesque"');
          await document.fonts.load('500 44px "Bricolage Grotesque"');
        }
      } catch (e) { /* pakai huruf cadangan */ }
      fontReady = true;
    }
    const title = titleInp.value.trim();
    const artist = artistInp.value.trim();
    const tpl = tplSel.value;
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawCover(ctx, photo, SIZE);
    const measure = (s, px, weight) => {
      ctx.font = weight + ' ' + px + 'px "Bricolage Grotesque", sans-serif';
      return ctx.measureText(s).width;
    };
    // Latar gelap di belakang teks supaya terbaca di atas foto apa pun.
    const scrim = (x0, y0, x1, y1, from, to) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, from);
      g.addColorStop(1, to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
    };
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    if (tpl === 'bawah' || tpl === 'atas') {
      const bottom = tpl === 'bawah';
      if (bottom) scrim(0, SIZE * 0.45, 0, SIZE, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.78)');
      else scrim(0, 0, 0, SIZE * 0.5, 'rgba(0,0,0,0.78)', 'rgba(0,0,0,0)');
      let titlePx = 96;
      let lines = [];
      if (title) {
        while (titlePx > 44) {
          lines = wrapText((s) => measure(s, titlePx, 700), title, SIZE - 128);
          if (lines.length <= 2 && lines.every((l) => measure(l, titlePx, 700) <= SIZE - 128)) break;
          titlePx -= 6;
        }
        lines = wrapText((s) => measure(s, titlePx, 700), title, SIZE - 128);
      }
      ctx.textAlign = 'left';
      const lineH = titlePx * 1.12;
      const artistPx = 44;
      const blockH = lines.length * lineH + (artist ? artistPx * 1.5 : 0);
      let y = bottom ? SIZE - 64 - blockH + lineH : 64 + lineH;
      ctx.font = '700 ' + titlePx + 'px "Bricolage Grotesque", sans-serif';
      for (const ln of lines) {
        ctx.fillText(ln, 64, y);
        y += lineH;
      }
      if (artist) {
        ctx.font = '500 ' + artistPx + 'px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(artist, 64, y + 8);
      }
    } else if (tpl === 'tengah') {
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, 0, SIZE, SIZE);
      let titlePx = 110;
      let lines = [];
      if (title) {
        while (titlePx > 48) {
          lines = wrapText((s) => measure(s, titlePx, 700), title, SIZE - 160);
          if (lines.length <= 2) break;
          titlePx -= 6;
        }
        lines = wrapText((s) => measure(s, titlePx, 700), title, SIZE - 160);
      }
      ctx.textAlign = 'center';
      const lineH = titlePx * 1.12;
      const artistPx = 46;
      const blockH = lines.length * lineH + (artist ? artistPx * 1.8 : 0);
      let y = SIZE / 2 - blockH / 2 + lineH;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 ' + titlePx + 'px "Bricolage Grotesque", sans-serif';
      for (const ln of lines) {
        ctx.fillText(ln, SIZE / 2, y);
        y += lineH;
      }
      if (artist) {
        ctx.font = '500 ' + artistPx + 'px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(artist, SIZE / 2, y + 16);
      }
    } else {
      // Minimal: teks kecil di pojok kiri bawah, bayangan lembut supaya
      // tetap terbaca tanpa menutup foto.
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 14;
      let y = SIZE - 56;
      if (artist) {
        ctx.font = '500 30px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(artist, 48, y);
        y -= 44;
      }
      if (title) {
        ctx.font = '700 54px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = '#ffffff';
        let t = title;
        while (measure(t, 54, 700) > SIZE - 96 && t.length > 1) t = t.slice(0, -1);
        ctx.fillText(t, 48, y);
      }
      ctx.shadowBlur = 0;
    }
  };

  const scheduleRender = () => {
    clearTimeout(scheduleRender._t);
    scheduleRender._t = setTimeout(() => { renderCover(); }, 120);
  };

  file.addEventListener('change', () => {
    const f = file.files && file.files[0] ? file.files[0] : null;
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      T.show(outBox, errBox('Pilih file gambar (JPG, PNG, atau sejenisnya).'));
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      photo = img;
      prevWrap.hidden = false;
      emptyNote.hidden = true;
      T.hide(outBox);
      renderCover();
    };
    img.onerror = () => {
      T.show(outBox, errBox('Gambar tidak bisa dibaca. Coba file JPG atau PNG lain.'));
      URL.revokeObjectURL(photoUrl);
      photoUrl = null;
    };
    img.src = photoUrl;
  });
  titleInp.addEventListener('input', scheduleRender);
  artistInp.addEventListener('input', scheduleRender);
  tplSel.addEventListener('change', () => { renderCover(); });

  const exportBtn = T.btn('Unduh sampul (PNG)', () => {
    if (!photo) { T.show(outBox, errBox('Pilih dulu fotonya.')); return; }
    renderCover().then(() => {
      canvas.toBlob((blob) => {
        if (!blob) { T.show(outBox, errBox('Gambar tidak bisa dibuat. Coba lagi.')); return; }
        T.dl('cover-album.png', blob, 'image/png');
        T.show(outBox, '<span class="ok">Selesai. Sampul terunduh.</span>' +
          kv('Ukuran gambar', '1080 x 1080'));
        T.toast('Sampul terunduh');
      }, 'image/png');
    });
  }, true);

  T.onLeave(() => { if (photoUrl) URL.revokeObjectURL(photoUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Satu foto, judul, dan nama artis jadi sampul album persegi siap pakai. Pratinjau berubah langsung saat kamu mengetik atau ganti template.</p>'));
  root.appendChild(T.field('Foto sampul', file, 'Foto apa pun, akan dipotong jadi persegi.'));
  root.appendChild(T.grid2(T.field('Judul album', titleInp), T.field('Nama artis', artistInp)));
  root.appendChild(T.field('Template', tplSel));
  root.appendChild(emptyNote);
  root.appendChild(prevWrap);
  root.appendChild(T.row(exportBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Fotomu tidak diunggah ke mana-mana.</p>'));
}
