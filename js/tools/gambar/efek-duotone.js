import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.7.0';

export const meta = {"id":"efek-duotone","name":"Efek Duotone","cat":"gambar","icon":"🎭","desc":"Foto biasa jadi poster duotone dua warna.","keywords":"duotone,efek,warna,foto,poster,canvas"};

/* Preset duotone: [nama, warna gelap, warna terang] */
const PRESETS = [
  ['Klasik Hitam', '#0a0a0a', '#ffffff'],
  ['Senja', '#1a0533', '#ff8a3d'],
  ['Lautan', '#001b3d', '#38bdf8'],
  ['Mawar', '#3b0713', '#fb7185'],
  ['Hutan', '#04180f', '#4ade80'],
  ['Kuning Vintage', '#2b1c00', '#facc15'],
  ['Ungu Pop', '#2e1065', '#d8b4fe'],
  ['Koral', '#3d0a02', '#ff7a59'],
];

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function duotone(img, darkHex, lightHex, maxDim) {
  const s = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  const [dr, dg, db] = hexToRgb(darkHex);
  const [lr, lg, lb] = hexToRgb(lightHex);
  for (let i = 0; i < p.length; i += 4) {
    const g = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255; // 0..1
    p[i] = dr + (lr - dr) * g;
    p[i + 1] = dg + (lg - dg) * g;
    p[i + 2] = db + (lb - db) * g;
  }
  x.putImageData(d, 0, 0);
  return c;
}

function getLS(key, fb) {
  try { const v = localStorage.getItem(key); return v == null ? fb : v; } catch (e) { return fb; }
}
function setLS(key, v) {
  try { localStorage.setItem(key, v); } catch (e) { /* abaikan */ }
}

export function render(root) {
  const fileI = fileInput('image/*');
  const darkI = T.input('color'); darkI.value = getLS('dt-dark', '#1a0533');
  const lightI = T.input('color'); lightI.value = getLS('dt-light', '#ff8a3d');
  [darkI, lightI].forEach((i) => { i.style.cssText = 'width:100%;height:44px;padding:2px;border:1px solid #ffffff20;border-radius:10px;background:#12100d;cursor:pointer'; });
  const box = T.out();
  const infoBox = T.out();
  let resCanvas = null;

  const presetBox = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>');
  PRESETS.forEach(([name, dk, lt]) => {
    const b = T.el('<button type="button" class="btn" style="padding:6px 10px;display:flex;align-items:center;gap:8px">' +
      '<span style="display:inline-flex;border-radius:6px;overflow:hidden;border:1px solid #ffffff30">' +
      '<span style="width:16px;height:16px;background:' + dk + '"></span>' +
      '<span style="width:16px;height:16px;background:' + lt + '"></span></span>' + T.esc(name) + '</button>');
    b.addEventListener('click', () => {
      darkI.value = dk; lightI.value = lt;
      setLS('dt-dark', dk); setLS('dt-light', lt);
      process();
    });
    presetBox.appendChild(b);
  });

  async function process() {
    T.hide(infoBox); T.hide(box);
    if (!fileI.files[0]) { T.toast('Pilih foto dulu'); return; }
    let img;
    try { img = await loadImage(fileI.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    const dk = darkI.value || '#000000', lt = lightI.value || '#ffffff';
    setLS('dt-dark', dk); setLS('dt-light', lt);
    T.toast('Lagi mewarnai…');
    await new Promise((r) => setTimeout(r, 30));
    resCanvas = duotone(img, dk, lt, 1600);
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat gambar'); return; }
    const resURL = URL.createObjectURL(blob);
    T.onLeave(() => URL.revokeObjectURL(resURL));
    T.show(box, '');
    const cap = T.el('<div class="hint" style="margin-bottom:6px">Hasil — duotone</div>');
    box.appendChild(cap);
    box.appendChild(imgEl(resURL, 'Hasil duotone'));
    T.show(infoBox, '<div class="kv"><span class="k">Ukuran hasil</span><span class="v">' + resCanvas.width + '×' + resCanvas.height + ' px (' + fmtBytes(blob.size) + ')</span></div>');
    T.toast('Jadi! Kesan posternya dapet kan');
  }

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fileI.files[0] && fileI.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-duotone.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  darkI.addEventListener('input', process);
  lightI.addEventListener('input', process);
  fileI.addEventListener('change', () => { if (fileI.files[0]) process(); });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Duotone itu gaya poster: foto dijadiin hitam-putih dulu, terus dipetakan ke dua warna pilihanmu. Enak buat cover single, thumbnail, atau biar feed kelihatan satu tema.</p>'));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.grid2(
    T.field('Warna gelap (bayangan)', darkI),
    T.field('Warna terang (cahaya)', lightI)
  ));
  root.appendChild(T.field('Preset siap pakai', presetBox, 'Ketuk salah satu, warna langsung keganti.'));
  root.appendChild(T.row(T.btn('Terapkan Duotone', process, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
}
