import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Buka dan lihat model 3D format STL (untuk 3D print) langsung di
// browser: putar model dengan jari/mouse, lihat jumlah segitiga,
// ukuran, volume, luas permukaan, dan apakah modelnya tertutup rapat
// (watertight). Renderer 3D ditulis sendiri di canvas 2D (proyeksi
// ortografik + painter's algorithm) — tanpa three.js, tanpa CDN, jadi
// jalan offline penuh.

export const meta = { id: 'lihat-file-stl', name: 'Lihat File STL', cat: 'developer', icon: '🧊', desc: 'Buka file model 3D .stl, putar modelnya, dan lihat jumlah segitiga, ukuran, volume, serta apakah modelnya tertutup rapat.', keywords: 'stl,3d,model,3d print,segitiga,volume,mesh,putar', since: '6.19.0' };

export const BATAS_CEK_TERTUTUP = 200000;

// Helper 3D tinggal di modul bersama js/model-3d.js (kanonis, G4 C1G4-R;
// dikonsolidasi dari lihat-file-stl.js + lihat-model-3d-glb-gltf.js +
// kompres-model-3d-glb.js).
import { putarTitik, normalMuka, buatRenderer3d } from '../../model-3d.js';
export { putarTitik, buatRenderer3d } from '../../model-3d.js';

export function parseStl(u8) {
  if (!(u8 instanceof Uint8Array)) u8 = new Uint8Array(u8);
  if (u8.length < 84) throw new Error('File terlalu kecil untuk STL.');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const jumlahBiner = dv.getUint32(80, true);
  const kepala = new TextDecoder().decode(u8.slice(0, 5)).toLowerCase();
  const adalahBiner = (84 + jumlahBiner * 50 === u8.length);
  let segitiga;
  let format;
  if (adalahBiner) {
    format = 'biner';
    segitiga = new Float32Array(jumlahBiner * 12);
    for (let i = 0; i < jumlahBiner; i++) {
      const p = 84 + i * 50;
      const o = i * 12;
      for (let k = 0; k < 9; k++) segitiga[o + k] = dv.getFloat32(p + 12 + k * 4, true);
      const n = normalMuka(segitiga[o], segitiga[o + 1], segitiga[o + 2], segitiga[o + 3], segitiga[o + 4], segitiga[o + 5], segitiga[o + 6], segitiga[o + 7], segitiga[o + 8]);
      segitiga[o + 9] = n[0]; segitiga[o + 10] = n[1]; segitiga[o + 11] = n[2];
    }
  } else if (kepala === 'solid') {
    format = 'teks';
    const teks = new TextDecoder().decode(u8);
    const titik = [];
    const pola = /vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/gi;
    let m;
    while ((m = pola.exec(teks)) !== null) titik.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
    if (titik.length < 3 || titik.length % 3 !== 0) throw new Error('File STL teks ini tidak berisi segitiga yang lengkap.');
    const n = titik.length / 3;
    segitiga = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const o = i * 12;
      for (let k = 0; k < 3; k++) {
        segitiga[o + k * 3] = titik[i * 3 + k][0];
        segitiga[o + k * 3 + 1] = titik[i * 3 + k][1];
        segitiga[o + k * 3 + 2] = titik[i * 3 + k][2];
      }
      const nm = normalMuka(segitiga[o], segitiga[o + 1], segitiga[o + 2], segitiga[o + 3], segitiga[o + 4], segitiga[o + 5], segitiga[o + 6], segitiga[o + 7], segitiga[o + 8]);
      segitiga[o + 9] = nm[0]; segitiga[o + 10] = nm[1]; segitiga[o + 11] = nm[2];
    }
  } else {
    throw new Error('File ini bukan STL (bukan biner yang ukurannya cocok, bukan teks yang diawali "solid").');
  }

  const jumlah = segitiga.length / 12;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let volume = 0, luas = 0;
  for (let i = 0; i < jumlah; i++) {
    const o = i * 12;
    const ax = segitiga[o], ay = segitiga[o + 1], az = segitiga[o + 2];
    const bx = segitiga[o + 3], by = segitiga[o + 4], bz = segitiga[o + 5];
    const cx = segitiga[o + 6], cy = segitiga[o + 7], cz = segitiga[o + 8];
    minX = Math.min(minX, ax, bx, cx); maxX = Math.max(maxX, ax, bx, cx);
    minY = Math.min(minY, ay, by, cy); maxY = Math.max(maxY, ay, by, cy);
    minZ = Math.min(minZ, az, bz, cz); maxZ = Math.max(maxZ, az, bz, cz);
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    luas += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }

  // Cek tertutup: tiap sisi (rusuk) harus dipakai tepat 2 segitiga.
  let tertutup = null, sisiTerbuka = 0, sisiGanda = 0;
  if (jumlah <= BATAS_CEK_TERTUTUP) {
    const sisi = new Map();
    const kunci = (x, y, z) => x + ',' + y + ',' + z;
    for (let i = 0; i < jumlah; i++) {
      const o = i * 12;
      const v = [
        [segitiga[o], segitiga[o + 1], segitiga[o + 2]],
        [segitiga[o + 3], segitiga[o + 4], segitiga[o + 5]],
        [segitiga[o + 6], segitiga[o + 7], segitiga[o + 8]],
      ];
      for (let k = 0; k < 3; k++) {
        const a = kunci(...v[k]), b = kunci(...v[(k + 1) % 3]);
        const kk = a < b ? a + '|' + b : b + '|' + a;
        sisi.set(kk, (sisi.get(kk) || 0) + 1);
      }
    }
    for (const c of sisi.values()) {
      if (c === 1) sisiTerbuka++;
      else if (c > 2) sisiGanda++;
    }
    tertutup = sisiTerbuka === 0 && sisiGanda === 0;
  }

  return {
    format,
    segitiga,
    jumlah,
    bbox: { minX, minY, minZ, maxX, maxY, maxZ },
    ukuran: [maxX - minX, maxY - minY, maxZ - minZ],
    volume: Math.abs(volume),
    volumeBertanda: volume,
    luas,
    tertutup,
    sisiTerbuka,
    sisiGanda,
  };
}


export function render(root) {
  root.appendChild(T.el('<p class="hint">Buka file model 3D .stl dan putar modelnya dengan jari atau mouse. ' + T.esc(LOCAL_NOTE) + ' Satuan ukuran tidak tertulis di file STL (biasanya milimeter).</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.stl';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 560;
  canvas.style.cssText = 'width:100%;height:auto;border-radius:10px;margin-top:10px;touch-action:none;display:none';
  const kontrolEl = T.el('<div class="row" style="flex-wrap:wrap;margin-top:8px"></div>');
  kontrolEl.hidden = true;
  const cekBingkai = document.createElement('input');
  cekBingkai.type = 'checkbox';
  const cekPutar = document.createElement('input');
  cekPutar.type = 'checkbox';
  const lBingkai = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"></label>');
  lBingkai.append(cekBingkai, document.createTextNode('Bingkai saja'));
  const lPutar = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"></label>');
  lPutar.append(cekPutar, document.createTextNode('Putar otomatis'));
  kontrolEl.append(lBingkai, lPutar);

  const renderer = buatRenderer3d(canvas);
  cekBingkai.addEventListener('change', () => renderer.setBingkai(cekBingkai.checked));
  cekPutar.addEventListener('change', () => renderer.setOtomatis(cekPutar.checked));
  T.onLeave(() => renderer.bersih());

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    infoEl.innerHTML = '';
    canvas.style.display = 'none';
    kontrolEl.hidden = true;
    try {
      const u8 = new Uint8Array(await f.arrayBuffer());
      const hasil = parseStl(u8);
      statusEl.textContent = '';
      const [lx, ly, lz] = hasil.ukuran;
      infoEl.innerHTML = '<div class="card">' +
        kv('File', T.esc(f.name) + ' (' + fmtBytes(f.size) + ', STL ' + hasil.format + ')') +
        kv('Segitiga', T.fmt(hasil.jumlah)) +
        kv('Ukuran', utils.r6(lx) + ' × ' + utils.r6(ly) + ' × ' + utils.r6(lz)) +
        kv('Volume', utils.r6(hasil.volume) + ' satuan³') +
        kv('Luas permukaan', utils.r6(hasil.luas) + ' satuan²') +
        kv('Tertutup rapat', hasil.tertutup === null
          ? 'tidak dicek (lebih dari ' + T.fmt(BATAS_CEK_TERTUTUP) + ' segitiga)'
          : hasil.tertutup ? 'ya, siap cetak 3D' : 'tidak, ' + T.fmt(hasil.sisiTerbuka) + ' rusuk terbuka' + (hasil.sisiGanda ? ', ' + T.fmt(hasil.sisiGanda) + ' rusuk dipakai lebih dari 2 segitiga' : '')) +
        '</div>';
      renderer.atur(hasil.segitiga, hasil.bbox);
      canvas.style.display = 'block';
      kontrolEl.hidden = false;
    } catch (e) {
      statusEl.textContent = '';
      infoEl.innerHTML = '<p style="color:var(--err)">File tidak bisa dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  fileI.addEventListener('change', bukaFile);
  root.append(
    T.field('Pilih file STL', fileI, 'Contoh: model.stl untuk 3D print, format biner atau teks.'),
    statusEl,
    infoEl,
    canvas,
    kontrolEl,
  );
}
