import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "nokiamsg", "name": "Nokia Message", "cat": "fun", "icon": "📱", "desc": "Bikin gambar SMS ala HP Nokia jadul.", "keywords": "nokia,sms,jadul,meme,pesan,gambar"};

export function render(root) {

  const W = 900, H = 1200;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  const now = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const defDate = p2(now.getDate()) + '/' + p2(now.getMonth() + 1) + '/' + now.getFullYear();
  const defTime = p2(now.getHours()) + ':' + p2(now.getMinutes());

  const fPesan = T.input('text', 'Tulis pesan…', 'kata-kata hari ini');
  const fDari = T.input('text', 'Nama pengirim', 'Dika');
  const fJudul = T.input('text', 'Judul', 'Pesan');
  const fTgl = T.input('text', 'DD/MM/YYYY', defDate);
  const fJam = T.input('text', 'HH:MM', defTime);
  const box = T.out();
  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  preview.appendChild(imgPrev);

  const LCD = '#a8b78f', LCD_D = '#8a9a72', INK = '#1c2416';

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(text, maxW, font) {
    ctx.font = font;
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function draw(pesan, dari, judul, tgl, jam) {
    // bodi HP
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#2b3440'); bg.addColorStop(1, '#141a22');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const px = 150, pw = W - 300;
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    rr(px + 12, 40, pw, H - 80, 90); ctx.fill();
    const body = ctx.createLinearGradient(px, 0, px + pw, 0);
    body.addColorStop(0, '#3d4a5c'); body.addColorStop(0.5, '#2e3947'); body.addColorStop(1, '#232c38');
    ctx.fillStyle = body;
    rr(px, 30, pw, H - 60, 90); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 3;
    rr(px, 30, pw, H - 60, 90); ctx.stroke();

    // layar
    const sx = px + 70, sw = pw - 140, sy = 120, sh = 560;
    ctx.fillStyle = '#0c0f0a';
    rr(sx - 14, sy - 14, sw + 28, sh + 28, 26); ctx.fill();
    const scr = ctx.createLinearGradient(0, sy, 0, sy + sh);
    scr.addColorStop(0, LCD); scr.addColorStop(1, LCD_D);
    ctx.fillStyle = scr;
    rr(sx, sy, sw, sh, 14); ctx.fill();

    // header layar: judul kiri, jam kanan
    ctx.fillStyle = INK;
    ctx.fillRect(sx + 18, sy + 18, sw - 36, 4);
    ctx.font = '700 34px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    const jt = (judul || 'Pesan').slice(0, 18);
    ctx.fillText(jt, sx + 24, sy + 62);
    ctx.textAlign = 'right';
    ctx.fillText((jam || '').slice(0, 5), sx + sw - 24, sy + 62);
    ctx.textAlign = 'left';
    ctx.fillRect(sx + 18, sy + 96, sw - 36, 4);

    // isi pesan
    const font = '700 32px "Courier New", monospace';
    const lines = wrap(pesan, sw - 60, font).slice(0, 9);
    ctx.font = font; ctx.fillStyle = INK;
    lines.forEach((l, i) => ctx.fillText(l, sx + 30, sy + 150 + i * 42));

    // footer layar: dari + tanggal
    ctx.fillRect(sx + 18, sy + sh - 100, sw - 36, 4);
    ctx.font = '700 30px "Courier New", monospace';
    const dr = (dari ? 'Dari: ' + dari : '').slice(0, 24);
    ctx.fillText(dr, sx + 24, sy + sh - 58);
    ctx.textAlign = 'right';
    ctx.fillText((tgl || '').slice(0, 10), sx + sw - 24, sy + sh - 58);
    ctx.textAlign = 'left';

    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    for (let y = sy; y < sy + sh; y += 6) ctx.fillRect(sx, y, sw, 2);

    // tombol Navi
    const ny = sy + sh + 90;
    ctx.fillStyle = '#1a2230';
    ctx.beginPath(); ctx.ellipse(W / 2, ny, 130, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#0e141d';
    ctx.beginPath(); ctx.ellipse(W / 2, ny, 62, 34, 0, 0, Math.PI * 2); ctx.fill();
    // tombol C dan -
    ctx.fillStyle = '#1a2230';
    rr(px + 110, ny - 34, 120, 68, 30); ctx.fill();
    rr(px + pw - 230, ny - 34, 120, 68, 30); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = '700 34px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillText('C', px + 170, ny + 2);
    ctx.fillText('–', px + pw - 170, ny + 2);
    ctx.textAlign = 'left';
    // keypad 3x4 (dekorasi)
    ctx.font = '700 30px "Courier New", monospace';
    const keys = [['1', '2abc', '3def'], ['4ghi', '5jkl', '6mno'], ['7pqrs', '8tuv', '9wxyz'], ['*', '0+', '#']];
    const kx0 = W / 2 - 200, ky0 = ny + 130;
    keys.forEach((rowK, r) => rowK.forEach((k, c) => {
      const x = kx0 + c * 200, y = ky0 + r * 92;
      ctx.fillStyle = '#1a2230'; rr(x - 78, y - 34, 156, 68, 30); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.textAlign = 'center';
      ctx.fillText(k, x, y + 2);
    }));
    ctx.textAlign = 'left';
    // speaker
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(W / 2 - 56 + i * 28, 78, 7, 0, Math.PI * 2); ctx.fill(); }
  }

  const generate = () => {
    const pesan = fPesan.value.trim();
    if (!pesan) { alert('Isi pesan dulu!'); fPesan.focus(); return; }
    draw(pesan, fDari.value.trim(), fJudul.value.trim(), fTgl.value.trim(), fJam.value.trim());
    imgPrev.src = cv.toDataURL('image/png');
    imgPrev.style.display = 'block';
    T.hide(box);
  };

  const bDl = T.btn('Unduh PNG', () => {
    if (!imgPrev.src) { T.show(box, errBox('Generate dulu gambarnya.')); return; }
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'NokiaMessage_' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar SMS ala HP Nokia jadul — digambar langsung di perangkatmu, tanpa server.</p>'));
  root.appendChild(T.field('Pesan', fPesan));
  root.appendChild(T.grid2(T.field('Dari', fDari), T.field('Judul', fJudul)));
  root.appendChild(T.grid2(T.field('Tanggal', fTgl), T.field('Jam', fJam)));
  root.appendChild(T.row(T.btn('Generate', generate, true)));
  root.appendChild(preview);
  root.appendChild(T.row(bDl));
  root.appendChild(box);
}
