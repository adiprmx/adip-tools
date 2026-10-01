import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js?v=6.4.0';

export const meta = {"id": "watermark-foto", "name": "Watermark Foto", "cat": "gambar", "icon": "©️", "desc": "Tempel watermark teks ke foto, unduh PNG.", "keywords": "watermark,foto,teks,tulisan,hak cipta,logo,png,download"};

const POS = [
  ['tl', 'Kiri atas'], ['tc', 'Tengah atas'], ['tr', 'Kanan atas'],
  ['ml', 'Kiri tengah'], ['mc', 'Tengah'], ['mr', 'Kanan tengah'],
  ['bl', 'Kiri bawah'], ['bc', 'Tengah bawah'], ['br', 'Kanan bawah'],
];
const FSIZE = { kecil: 0.035, sedang: 0.06, besar: 0.1 };

export function render(root) {
  const fi = fileInput('image/*');
  const teksI = T.input('text', 'cth: © ADIP RMX', '© ADIP RMX');
  const opR = T.input('range');
  opR.min = '10'; opR.max = '100'; opR.value = '70';
  const opV = T.el('<b>70%</b>');
  const sizeSel = T.select([['kecil', 'Kecil'], ['sedang', 'Sedang'], ['besar', 'Besar']], 'sedang');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;margin-top:12px';
  const box = T.out();
  let img = null;
  let pos = 'br';

  const draw = () => {
    if (!img) return;
    const maxSide = 1600;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w, h) > maxSide) {
      const s = maxSide / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    const teks = teksI.value.trim() || '©';
    const fs = Math.max(12, Math.round(w * (FSIZE[sizeSel.value] || FSIZE.sedang)));
    const alpha = Math.max(0.1, Math.min(1, parseInt(opR.value, 10) / 100));
    ctx.font = '600 ' + fs + 'px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.max(2, fs * 0.12);
    ctx.shadowOffsetY = Math.max(1, fs * 0.05);
    ctx.textBaseline = 'middle';
    const v = pos[0], hz = pos[1];
    ctx.textAlign = hz === 'l' ? 'left' : hz === 'c' ? 'center' : 'right';
    const pad = Math.round(w * 0.03);
    const x = hz === 'l' ? pad : hz === 'c' ? w / 2 : w - pad;
    const y = v === 't' ? pad + fs * 0.6 : v === 'm' ? h / 2 : h - pad - fs * 0.6;
    ctx.fillText(teks, x, y);
  };

  const muat = async () => {
    const f = fi.files[0];
    if (!f) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(f); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    draw();
    T.show(box, '');
    box.appendChild(canvas);
    T.toast('Foto dimuat, atur watermark lalu unduh');
  };

  const unduh = async () => {
    if (!img) { T.toast('Muat foto dulu'); return; }
    draw();
    const blob = await canvasToBlob(canvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat gambar'); return; }
    T.dl('watermark.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  };

  const posBtns = POS.map(([v, l]) => {
    const b = T.btn(l, () => { pos = v; refreshPos(); draw(); }, v === 'br');
    b.dataset.pos = v;
    b.style.fontSize = '11px';
    b.style.padding = '8px 4px';
    return b;
  });
  const refreshPos = () => posBtns.forEach((b) => b.classList.toggle('primary', b.dataset.pos === pos));
  const posGrid = T.el('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"></div>');
  posBtns.forEach((b) => posGrid.appendChild(b));

  opR.addEventListener('input', () => { opV.textContent = opR.value + '%'; draw(); });
  teksI.addEventListener('input', draw);
  sizeSel.addEventListener('change', draw);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Muat foto', muat, true)));
  root.appendChild(T.field('Teks watermark', teksI));
  root.appendChild(T.field('Posisi', posGrid));
  const opRow = T.el('<div class="row" style="align-items:center"></div>');
  opRow.appendChild(opR); opRow.appendChild(opV);
  root.appendChild(T.field('Transparansi', opRow));
  root.appendChild(T.field('Ukuran huruf', sizeSel));
  root.appendChild(T.row(T.btn('Unduh PNG', unduh, true)));
  root.appendChild(box);
}
