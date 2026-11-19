// Helper model 3D bersama: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari 3 tool developer G4 (B13):
// - parseGlb: kompres-model-3d-glb.js + lihat-model-3d-glb-gltf.js
//   (identik kecuali return: versi kompres mengembalikan juga `versi` dan
//   `panjang` header; kanon memakai bentuk superset itu. Pemanggil viewer
//   hanya membaca .json/.bin, jadi penambahan 2 kunci tidak teramati).
// - putarTitik + normalMuka + buatRenderer3d: lihat-file-stl.js +
//   lihat-model-3d-glb-gltf.js (ketiganya byte-identik di kedua file).
// Renderer 3D software di canvas 2D (proyeksi ortografik + painter's
// algorithm), tanpa three.js, tanpa CDN, jalan offline penuh.
// segitiga: Float32Array per 12 angka (9 koordinat + 3 normal).
export function parseGlb(u8) {
  if (!(u8 instanceof Uint8Array)) u8 = new Uint8Array(u8);
  if (u8.length < 12) throw new Error('File terlalu kecil untuk GLB.');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('File ini bukan GLB (tanda glTF tidak ketemu).');
  const versi = dv.getUint32(4, true);
  if (versi !== 2) throw new Error('Hanya GLB versi 2 yang didukung (file ini versi ' + versi + ').');
  const panjang = dv.getUint32(8, true);
  if (panjang > u8.length) throw new Error('Panjang di header lebih besar dari ukuran file.');
  let json = null, bin = null;
  let p = 12;
  while (p + 8 <= panjang) {
    const panjangChunk = dv.getUint32(p, true);
    const jenis = dv.getUint32(p + 4, true);
    const awal = p + 8;
    const akhir = Math.min(awal + panjangChunk, u8.length);
    if (jenis === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(u8.slice(awal, akhir)));
    else if (jenis === 0x004e4942) bin = u8.slice(awal, akhir);
    p = awal + panjangChunk;
  }
  if (!json) throw new Error('Chunk JSON tidak ketemu di file ini.');
  return { json, bin: bin || new Uint8Array(0), versi, panjang };
}

// Putar satu titik mengelilingi sumbu X lalu Y (radian). Murni.
export function putarTitik(x, y, z, rx, ry) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x2 = x * cy + z1 * sy;
  const z2 = -x * sy + z1 * cy;
  return [x2, y1, z2];
}

// Normal muka segitiga (cross product ternormalisasi). Murni.
function normalMuka(ax, ay, az, bx, by, bz, cx, cy, cz) {
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const p = Math.hypot(nx, ny, nz) || 1;
  return [nx / p, ny / p, nz / p];
}
export { normalMuka };

export function buatRenderer3d(canvas) {
  const ctx = canvas.getContext('2d');
  const state = { rx: -0.5, ry: 0.6, skala: 1, bingkai: false, putarOtomatis: false };
  let segitiga = null, pusat = [0, 0, 0], jari = 1;
  let raf = null;

  function atur(data, bbox) {
    segitiga = data;
    pusat = [(bbox.minX + bbox.maxX) / 2, (bbox.minY + bbox.maxY) / 2, (bbox.minZ + bbox.maxZ) / 2];
    jari = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY, bbox.maxZ - bbox.minZ) / 2 || 1;
    gambar();
  }

  function gambar() {
    if (!segitiga) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, W, H);
    const s = (Math.min(W, H) * 0.42 * state.skala) / jari;
    const cx = W / 2, cy = H / 2;
    const n = segitiga.length / 12;
    const urut = [];
    const cahaya = [0.4, 0.7, 0.6];
    const pj = Math.hypot(...cahaya);
    const cl = cahaya.map((v) => v / pj);
    for (let i = 0; i < n; i++) {
      const o = i * 12;
      const pts = [];
      let zRata = 0;
      for (let k = 0; k < 3; k++) {
        const p = putarTitik(segitiga[o + k * 3] - pusat[0], segitiga[o + k * 3 + 1] - pusat[1], segitiga[o + k * 3 + 2] - pusat[2], state.rx, state.ry);
        pts.push([cx + p[0] * s, cy - p[1] * s]);
        zRata += p[2];
      }
      const nn = putarTitik(segitiga[o + 9], segitiga[o + 10], segitiga[o + 11], state.rx, state.ry);
      const terang = Math.max(0, nn[0] * cl[0] + nn[1] * cl[1] + nn[2] * cl[2]);
      urut.push({ pts, z: zRata / 3, terang });
    }
    urut.sort((a, b) => a.z - b.z);
    for (const t of urut) {
      const v = Math.round(70 + t.terang * 165);
      ctx.beginPath();
      ctx.moveTo(t.pts[0][0], t.pts[0][1]);
      ctx.lineTo(t.pts[1][0], t.pts[1][1]);
      ctx.lineTo(t.pts[2][0], t.pts[2][1]);
      ctx.closePath();
      if (state.bingkai) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  let seret = null;
  canvas.addEventListener('pointerdown', (e) => {
    seret = { x: e.clientX, y: e.clientY, rx: state.rx, ry: state.ry };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!seret) return;
    state.ry = seret.ry + (e.clientX - seret.x) * 0.01;
    state.rx = seret.rx + (e.clientY - seret.y) * 0.01;
    gambar();
  });
  const lepas = () => { seret = null; };
  canvas.addEventListener('pointerup', lepas);
  canvas.addEventListener('pointercancel', lepas);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.skala = Math.max(0.3, Math.min(4, state.skala * (e.deltaY < 0 ? 1.1 : 0.9)));
    gambar();
  }, { passive: false });

  function putar() {
    if (!state.putarOtomatis) return;
    state.ry += 0.01;
    gambar();
    raf = requestAnimationFrame(putar);
  }
  function setOtomatis(nyala) {
    state.putarOtomatis = nyala;
    if (nyala && !raf) raf = requestAnimationFrame(putar);
    if (!nyala && raf) { cancelAnimationFrame(raf); raf = null; }
  }
  function setBingkai(nyala) { state.bingkai = nyala; gambar(); }
  function bersih() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    state.putarOtomatis = false;
  }
  return { atur, gambar, setOtomatis, setBingkai, bersih, state };
}
