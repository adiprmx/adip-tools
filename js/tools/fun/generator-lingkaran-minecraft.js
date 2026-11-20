import { h as T, utils } from '../../core.js';

export const meta = { id: 'generator-lingkaran-minecraft', name: 'Generator Lingkaran Minecraft', cat: 'fun', icon: '⭕', desc: 'Rencanakan lingkaran, oval, atau lengkung Minecraft blok per blok, lengkap dengan hitungan bloknya.', keywords: 'minecraft,lingkaran,circle generator,oval,lengkung,blok,pixel art,bangunan', since: '6.17.0' };

// Lingkaran/oval terisi: kembalikan set "x,y" (koordinat relatif ke pusat).
// rx, ry = jari-jari mendatar dan tegak dalam blok (boleh pecahan .5 untuk diameter genap).
// Konvensi diameter (v6.21.0): diameter d blok = grid d×d; blok terisi bila
// titik tengahnya masuk elips berjari-jari d/2. Konvensi lama
// ((x+0.5)/(rx+0.5)) menggeser pusat 0,5 blok sehingga diameter ganjil
// jadi 1 blok lebih kecil (d=5→4×4, d=11→10×10). Ganjil maupun genap kini
// tepat d blok lebarnya (terverifikasi: d=5→5×5/21 blok, d=6→6×6/32 blok,
// d=11→11×11/97 blok — cocok dengan pola lingkaran Minecraft standar).
export function isiOval(rx, ry) {
  const sel = new Set();
  const dx = 2 * rx + 1, dy = 2 * ry + 1;
  const x0 = -Math.floor(dx / 2), y0 = -Math.floor(dy / 2);
  for (let j = 0; j < dy; j++) {
    for (let i = 0; i < dx; i++) {
      const nx = (i - (dx - 1) / 2) / (dx / 2);
      const ny = (j - (dy - 1) / 2) / (dy / 2);
      if (nx * nx + ny * ny <= 1) sel.add((x0 + i) + ',' + (y0 + j));
    }
  }
  return sel;
}

// Garis tepi dari set terisi: blok yang punya tetangga (4 arah) di luar set.
// tepiDariIsi kanonis tinggal di utils (core.js).

// Busur: lingkaran tepi yang hanya diambil pada rentang sudut (derajat, 0 = kanan, berlawanan jarum jam).
export function busur(r, sudutAwal, sudutAkhir) {
  const isi = isiOval(r, r);
  const tepi = utils.tepiDariIsi(isi);
  const out = new Set();
  // Titik tengah blok relatif ke pusat: koordinat bulat bila diameter ganjil,
  // +0,5 bila diameter genap (pusat di antara blok).
  const off = Number.isInteger(r) ? 0 : 0.5;
  tepi.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    let a = Math.atan2(-(y + off), x + off) * 180 / Math.PI;
    if (a < 0) a += 360;
    // Rentang bisa melewati 0 derajat.
    const dalam = sudutAwal <= sudutAkhir
      ? a >= sudutAwal && a <= sudutAkhir
      : a >= sudutAwal || a <= sudutAkhir;
    if (dalam) out.add(k);
  });
  return out;
}

// Baris untuk tampilan: array baris, tiap baris array 0/1.
export function keBaris(sel) {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  sel.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  });
  const baris = [];
  for (let y = minY; y <= maxY; y++) {
    const row = [];
    for (let x = minX; x <= maxX; x++) row.push(sel.has(x + ',' + y) ? 1 : 0);
    baris.push(row);
  }
  return { baris, lebar: maxX - minX + 1, tinggi: maxY - minY + 1 };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.mc-grid{font-family:var(--font-m);font-size:11px;line-height:1.35;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;overflow-x:auto;white-space:pre;margin:12px 0}' +
    '.mc-sel{width:18px;height:18px;display:inline-block;border-radius:3px;margin:1px}' +
    '.mc-kanvas{width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Tulis diameternya, nanti muncul pola bloknya baris per baris. Tiap kotak di gambar sama dengan satu blok di Minecraft.</p>'));

  const mode = T.select([
    ['lingkaran-tepi', 'Lingkaran (tepi saja)'],
    ['lingkaran-isi', 'Lingkaran (terisi penuh)'],
    ['oval-tepi', 'Oval (tepi saja)'],
    ['oval-isi', 'Oval (terisi penuh)'],
    ['busur', 'Lengkung / busur'],
  ], 'lingkaran-tepi');
  const dI = T.input('number', 'mis. 15', '15');
  const d2I = T.input('number', 'mis. 9', '9');
  const sudutAI = T.input('number', 'mis. 0', '0');
  const sudutBI = T.input('number', 'mis. 180', '180');
  const wrapD2 = T.el('<div></div>');
  wrapD2.appendChild(T.field('Diameter tegak (blok)', d2I));
  const wrapBusur = T.el('<div></div>');
  wrapBusur.appendChild(T.grid2(T.field('Sudut awal (derajat)', sudutAI), T.field('Sudut akhir (derajat)', sudutBI)));
  wrapD2.hidden = true;
  wrapBusur.hidden = true;

  mode.addEventListener('change', () => {
    wrapD2.hidden = !mode.value.startsWith('oval');
    wrapBusur.hidden = mode.value !== 'busur';
  });

  const kanvas = document.createElement('canvas');
  kanvas.className = 'mc-kanvas';
  kanvas.width = 640;
  kanvas.height = 400;
  const teksEl = T.el('<div class="mc-grid"></div>');
  const box = T.out();

  function gambar(sel, info) {
    const { baris, lebar, tinggi } = keBaris(sel);
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, 0, W, H);
    const s = Math.min(Math.floor((W - 24) / lebar), Math.floor((H - 24) / tinggi), 34);
    const ox = (W - s * lebar) / 2, oy = (H - s * tinggi) / 2;
    baris.forEach((row, y) => {
      row.forEach((v, x) => {
        if (!v) return;
        ctx.fillStyle = '#ff6f61';
        ctx.fillRect(ox + x * s + 0.5, oy + y * s + 0.5, s - 1, s - 1);
      });
    });
    // Teks baris: hitungan blok per baris (panduan membangun).
    let teks = '';
    baris.forEach((row, i) => {
      const n = row.reduce((a, b) => a + b, 0);
      if (n === 0) return;
      // Jalankan run-length: posisi blok yang terisi.
      let jalan = [];
      let mulai = -1;
      row.forEach((v, x) => {
        if (v && mulai < 0) mulai = x;
        if (!v && mulai >= 0) { jalan.push(mulai === x - 1 ? '' + (mulai + 1) : (mulai + 1) + '-' + x); mulai = -1; }
      });
      if (mulai >= 0) jalan.push(mulai === row.length - 1 ? '' + (mulai + 1) : (mulai + 1) + '-' + row.length);
      teks += 'Baris ' + (i + 1) + ' (' + n + ' blok): ' + jalan.join(', ') + '\n';
    });
    teksEl.textContent = teks || 'Tidak ada blok.';
    T.show(box,
      '<p class="big">' + T.fmt(sel.size) + ' blok</p>' +
      '<p>Ukuran: ' + lebar + ' × ' + tinggi + ' blok. ' + info + '</p>');
  }

  function buat() {
    const d = T.num(dI.value);
    const d2 = T.num(d2I.value);
    if (!Number.isInteger(d) || d < 3 || d > 101) { T.toast('Diameternya 3 sampai 101 blok'); return; }
    const r = (d - 1) / 2;
    let sel, info;
    if (mode.value === 'lingkaran-tepi') { sel = utils.tepiDariIsi(isiOval(r, r)); info = 'Lingkaran tepi diameter ' + d + ' blok.'; }
    else if (mode.value === 'lingkaran-isi') { sel = isiOval(r, r); info = 'Lingkaran terisi diameter ' + d + ' blok.'; }
    else if (mode.value.startsWith('oval')) {
      if (!Number.isInteger(d2) || d2 < 3 || d2 > 101) { T.toast('Diameter tegaknya 3 sampai 101 blok'); return; }
      const isi = isiOval(r, (d2 - 1) / 2);
      sel = mode.value === 'oval-tepi' ? utils.tepiDariIsi(isi) : isi;
      info = 'Oval ' + d + ' × ' + d2 + ' blok.';
    } else {
      const a = T.num(sudutAI.value), b = T.num(sudutBI.value);
      if (!isFinite(a) || !isFinite(b) || a < 0 || a >= 360 || b < 0 || b > 360) { T.toast('Sudutnya 0 sampai 360 derajat'); return; }
      sel = busur(r, a, b);
      info = 'Busur dari sudut ' + a + '° sampai ' + b + '° (0° = ke kanan, berlawanan jarum jam).';
    }
    if (!sel.size) { T.toast('Tidak ada blok yang terbentuk. Coba sudut atau diameter lain.'); return; }
    gambar(sel, info);
  }

  const btnSalin = T.btn('Salin panduan baris', () => {
    if (!teksEl.textContent) { T.toast('Buat dulu polanya'); return; }
    T.copy(teksEl.textContent);
  });

  root.append(
    T.field('Bentuk', mode),
    T.field('Diameter mendatar (blok)', dI),
    wrapD2,
    wrapBusur,
    T.btn('Buat pola', buat, true),
    kanvas,
    box,
    teksEl,
    btnSalin,
  );
  buat();
}
