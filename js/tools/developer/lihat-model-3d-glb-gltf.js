import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Buka dan putar model 3D format GLB/GLTF di browser: baca mesh dari
// file, tampilkan dengan renderer 3D software di canvas 2D (tanpa
// three.js, tanpa CDN, jalan offline penuh), lengkap dengan jumlah
// segitiga, simpul, material, tekstur, dan animasi. Yang didukung:
// primitive segitiga (mode 4), indeks atau tanpa indeks, buffer di
// dalam GLB, buffer base64 di .gltf, dan file .bin pendamping.
// Primitive garis/titik dan accessor sparse dilaporkan sebagai
// dilewati, bukan pura-pura tampil.

export const meta = { id: 'lihat-model-3d-glb-gltf', name: 'Lihat Model 3D GLB/GLTF', cat: 'developer', icon: '🔷', desc: 'Buka dan putar model 3D .glb atau .gltf di browser, lengkap dengan jumlah segitiga, material, dan animasinya.', keywords: 'glb,gltf,3d,model,mesh,segitiga,putar,viewer', since: '6.19.0' };

const UKURAN_KOMPONEN = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const JUMLAH_KOMPONEN = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

// Helper 3D tinggal di modul bersama js/model-3d.js (kanonis, G4 C1G4-R;
// dikonsolidasi dari lihat-file-stl.js + lihat-model-3d-glb-gltf.js +
// kompres-model-3d-glb.js). parseGlb kanon mengembalikan juga `versi` +
// `panjang` header (versi lama file ini tidak punya); pemanggil hanya
// membaca .json/.bin, jadi penambahan itu tidak teramati.
import { parseGlb, putarTitik, normalMuka, buatRenderer3d } from '../../model-3d.js';
export { parseGlb, putarTitik, buatRenderer3d } from '../../model-3d.js';

export function dekodeBase64Uri(uri) {
  const m = /^data:.*?;base64,(.*)$/.exec(uri || '');
  if (!m) return null;
  const b64 = m[1].replace(/\s/g, '');
  const bin = atob(b64);
  const keluar = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) keluar[i] = bin.charCodeAt(i);
  return keluar;
}

// Baca satu accessor jadi array angka biasa. Murni, bisa diuji di Node.
// Mengembalikan null bila accessor sparse (belum didukung).
export function bacaAccessor(json, bin, idx) {
  const acc = (json.accessors || [])[idx];
  if (!acc) throw new Error('Accessor ' + idx + ' tidak ada.');
  if (acc.sparse) return null;
  const bv = (json.bufferViews || [])[acc.bufferView || 0];
  if (!bv) throw new Error('BufferView accessor ' + idx + ' tidak ada.');
  const ukuran = UKURAN_KOMPONEN[acc.componentType];
  const jumlah = JUMLAH_KOMPONEN[acc.type];
  if (!ukuran || !jumlah) throw new Error('Accessor ' + idx + ' bertipe tidak dikenal.');
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const awal = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const langkah = bv.byteStride || (ukuran * jumlah);
  const bacaSatu = (p) => {
    switch (acc.componentType) {
      case 5120: return dv.getInt8(p);
      case 5121: return dv.getUint8(p);
      case 5122: return dv.getInt16(p, true);
      case 5123: return dv.getUint16(p, true);
      case 5125: return dv.getUint32(p, true);
      case 5126: return dv.getFloat32(p, true);
      default: return 0;
    }
  };
  const keluar = new Array(acc.count * jumlah);
  for (let i = 0; i < acc.count; i++) {
    for (let k = 0; k < jumlah; k++) keluar[i * jumlah + k] = bacaSatu(awal + i * langkah + k * ukuran);
  }
  return { data: keluar, count: acc.count, komponen: jumlah };
}


// Ekstrak semua segitiga dari seluruh mesh. Mengembalikan Float32Array
// per 12 angka (9 koordinat + 3 normal) + statistik + catatan lewati.
export function ekstrakSegitiga(json, bin) {
  const segitiga = [];
  let dilewati = 0;
  let alasanLewat = [];
  let simpulTotal = 0;
  for (const mesh of (json.meshes || [])) {
    for (const prim of (mesh.primitives || [])) {
      const mode = prim.mode == null ? 4 : prim.mode;
      if (mode !== 4) { dilewati++; alasanLewat.push('primitive mode ' + mode + ' (bukan segitiga)'); continue; }
      const posIdx = prim.attributes && prim.attributes.POSITION;
      if (posIdx == null) { dilewati++; alasanLewat.push('primitive tanpa POSITION'); continue; }
      let pos;
      try {
        pos = bacaAccessor(json, bin, posIdx);
      } catch (e) {
        dilewati++;
        alasanLewat.push('POSITION gagal dibaca: ' + (e.message || 'error'));
        continue;
      }
      if (!pos) { dilewati++; alasanLewat.push('POSITION sparse belum didukung'); continue; }
      simpulTotal += pos.count;
      let indeks = null;
      if (prim.indices != null) {
        try {
          const idxAcc = bacaAccessor(json, bin, prim.indices);
          if (!idxAcc) { dilewati++; alasanLewat.push('indeks sparse belum didukung'); continue; }
          indeks = idxAcc.data;
        } catch (e) {
          dilewati++;
          alasanLewat.push('indeks gagal dibaca: ' + (e.message || 'error'));
          continue;
        }
      }
      const ambil = (i) => [pos.data[i * 3], pos.data[i * 3 + 1], pos.data[i * 3 + 2]];
      const jumlahSegi = indeks ? Math.floor(indeks.length / 3) : Math.floor(pos.count / 3);
      for (let t = 0; t < jumlahSegi; t++) {
        const ia = indeks ? indeks[t * 3] : t * 3;
        const ib = indeks ? indeks[t * 3 + 1] : t * 3 + 1;
        const ic = indeks ? indeks[t * 3 + 2] : t * 3 + 2;
        if (ia >= pos.count || ib >= pos.count || ic >= pos.count) continue;
        const a = ambil(ia), b = ambil(ib), c = ambil(ic);
        const n = normalMuka(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
        segitiga.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], n[0], n[1], n[2]);
      }
    }
  }
  let bbox = null;
  if (segitiga.length) {
    bbox = { minX: Infinity, minY: Infinity, minZ: Infinity, maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity };
    for (let i = 0; i < segitiga.length; i += 12) {
      for (let k = 0; k < 3; k++) {
        const x = segitiga[i + k * 3], y = segitiga[i + k * 3 + 1], z = segitiga[i + k * 3 + 2];
        bbox.minX = Math.min(bbox.minX, x); bbox.maxX = Math.max(bbox.maxX, x);
        bbox.minY = Math.min(bbox.minY, y); bbox.maxY = Math.max(bbox.maxY, y);
        bbox.minZ = Math.min(bbox.minZ, z); bbox.maxZ = Math.max(bbox.maxZ, z);
      }
    }
  }
  return {
    segitiga: new Float32Array(segitiga),
    jumlah: segitiga.length / 12,
    simpul: simpulTotal,
    bbox,
    dilewati,
    alasanLewat: [...new Set(alasanLewat)],
    mesh: (json.meshes || []).length,
    material: (json.materials || []).length,
    tekstur: (json.textures || []).length,
    gambar: (json.images || []).length,
    animasi: (json.animations || []).length,
    simpulScene: (json.nodes || []).length,
    skin: (json.skins || []).length,
  };
}



export function render(root) {
  root.appendChild(T.el('<p class="hint">Buka model 3D .glb atau .gltf dan putar modelnya dengan jari atau mouse. ' + T.esc(LOCAL_NOTE) + ' Tekstur tidak ditampilkan, model digambar satu warna dengan bayangan cahaya.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.glb,.gltf';
  fileI.className = 'inp';
  const binI = document.createElement('input');
  binI.type = 'file';
  binI.accept = '.bin';
  binI.className = 'inp';
  const binWrap = T.el('<div></div>');
  binWrap.hidden = true;
  binWrap.appendChild(T.field('File .bin pendamping (bila .gltf memakai buffer luar)', binI, 'Pilih file .bin yang namanya sama dengan yang tertulis di .gltf.'));
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

  let jsonAktif = null, binAktif = null, namaFile = '';

  async function tampilkan() {
    if (!jsonAktif || !binAktif) return;
    try {
      const hasil = ekstrakSegitiga(jsonAktif, binAktif);
      if (!hasil.jumlah) {
        infoEl.innerHTML = '<p style="color:var(--err)">Tidak ada segitiga yang bisa ditampilkan dari model ini.' +
          (hasil.alasanLewat.length ? ' Alasan: ' + hasil.alasanLewat.map(T.esc).join('; ') + '.' : '') + '</p>';
        return;
      }
      const b = hasil.bbox;
      infoEl.innerHTML = '<div class="card">' +
        kv('File', T.esc(namaFile)) +
        kv('Segitiga', T.fmt(hasil.jumlah)) +
        kv('Simpul (vertex)', T.fmt(hasil.simpul)) +
        kv('Ukuran', utils.r6(b.maxX - b.minX) + ' × ' + utils.r6(b.maxY - b.minY) + ' × ' + utils.r6(b.maxZ - b.minZ)) +
        kv('Mesh / material / tekstur / gambar', hasil.mesh + ' / ' + hasil.material + ' / ' + hasil.tekstur + ' / ' + hasil.gambar) +
        kv('Animasi / skin / node', hasil.animasi + ' / ' + hasil.skin + ' / ' + hasil.simpulScene) +
        (hasil.dilewati ? kv('Primitive dilewati', T.fmt(hasil.dilewati) + ' (' + hasil.alasanLewat.map(T.esc).join('; ') + ')') : '') +
        '</div>';
      renderer.atur(hasil.segitiga, hasil.bbox);
      canvas.style.display = 'block';
      kontrolEl.hidden = false;
    } catch (e) {
      infoEl.innerHTML = '<p style="color:var(--err)">Model tidak bisa dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    infoEl.innerHTML = '';
    canvas.style.display = 'none';
    kontrolEl.hidden = true;
    binWrap.hidden = true;
    jsonAktif = null;
    binAktif = null;
    namaFile = f.name;
    try {
      if (f.name.toLowerCase().endsWith('.glb')) {
        const u8 = new Uint8Array(await f.arrayBuffer());
        const parsed = parseGlb(u8);
        jsonAktif = parsed.json;
        binAktif = parsed.bin;
        statusEl.textContent = '';
        await tampilkan();
      } else {
        const teks = await f.text();
        jsonAktif = JSON.parse(teks);
        const buf0 = (jsonAktif.buffers || [])[0];
        if (!buf0) throw new Error('File .gltf ini tidak menyatakan buffer.');
        if (buf0.uri && buf0.uri.startsWith('data:')) {
          binAktif = dekodeBase64Uri(buf0.uri);
          if (!binAktif) throw new Error('Buffer base64 di .gltf tidak bisa dibaca.');
          statusEl.textContent = '';
          await tampilkan();
        } else if (buf0.uri) {
          statusEl.textContent = '';
          infoEl.innerHTML = '<p class="hint">File .gltf ini memakai buffer luar (' + T.esc(buf0.uri) + '). Pilih file .bin-nya di bawah.</p>';
          binWrap.hidden = false;
        } else {
          throw new Error('Buffer .gltf ini tidak punya uri maupun data.');
        }
      }
    } catch (e) {
      statusEl.textContent = '';
      infoEl.innerHTML = '<p style="color:var(--err)">File tidak bisa dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  async function bukaBin() {
    const f = binI.files && binI.files[0];
    if (!f || !jsonAktif) return;
    statusEl.textContent = 'Membaca file .bin...';
    binAktif = new Uint8Array(await f.arrayBuffer());
    statusEl.textContent = '';
    await tampilkan();
  }

  fileI.addEventListener('change', bukaFile);
  binI.addEventListener('change', bukaBin);
  root.append(
    T.field('Pilih file GLB atau GLTF', fileI, 'Contoh: model.glb, atau model.gltf beserta file .bin-nya.'),
    binWrap,
    statusEl,
    infoEl,
    canvas,
    kontrolEl,
  );
}
