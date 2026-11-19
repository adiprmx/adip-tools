import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Kecilkan file model 3D GLB dengan membuang data yang tidak dipakai
// (accessor, bufferView, material, tekstur, gambar, sampler yang tidak
// terhubung ke apa pun), merapikan JSON, dan — bila dipilih — menghapus
// tangen atau UV kedua. BUKAN kompresi Draco/meshopt: file hasil tetap
// GLB standar yang bisa dibuka di mana saja, hanya data tak terpakai
// yang hilang. Rasio yang dilaporkan adalah byte asli hasil hitung,
// bukan perkiraan.

export const meta = { id: 'kompres-model-3d-glb', name: 'Kompres Model 3D GLB', cat: 'developer', icon: '🗜️', desc: 'Kecilkan file model 3D .glb dengan membuang data yang tidak dipakai. Bukan Draco, hasilnya tetap GLB standar.', keywords: 'glb,gltf,3d,kompres,model,draco,meshopt,kecilkan', since: '6.19.0' };

// parseGlb tinggal di modul bersama js/model-3d.js (kanonis, G4 C1G4-R;
// dikonsolidasi dari kompres-model-3d-glb.js + lihat-model-3d-glb-gltf.js).
import { parseGlb } from '../../model-3d.js';
export { parseGlb } from '../../model-3d.js';

export function rakitGlb(json, bin) {
  const teksJson = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(teksJson);
  const padJson = (4 - (jsonBytes.length % 4)) % 4;
  const padBin = (4 - (bin.length % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + padJson + 8 + bin.length + padBin;
  const keluar = new Uint8Array(total);
  const dv = new DataView(keluar.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length + padJson, true);
  dv.setUint32(16, 0x4e4f534a, true);
  keluar.set(jsonBytes, 20);
  keluar.fill(0x20, 20 + jsonBytes.length, 20 + jsonBytes.length + padJson);
  let p = 20 + jsonBytes.length + padJson;
  dv.setUint32(p, bin.length + padBin, true);
  dv.setUint32(p + 4, 0x004e4942, true);
  keluar.set(bin, p + 8);
  return keluar;
}

function hapusEkstra(obj) {
  if (Array.isArray(obj)) { obj.forEach(hapusEkstra); return; }
  if (obj && typeof obj === 'object') {
    delete obj.extras;
    Object.values(obj).forEach(hapusEkstra);
  }
}

// Kumpulkan indeks tekstur yang dipakai sebuah material (termasuk di
// dalam ekstensi, dengan memindai objek 'index' di bawah kunci *Texture).
function teksturDariMaterial(mat) {
  const keluar = new Set();
  (function jalan(o) {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.index === 'number' && /texture/i.test(k)) keluar.add(v.index);
      jalan(v);
    }
  })(mat);
  return keluar;
}

export function kompresGlb(u8, opsi) {
  const o = opsi || {};
  const { json, bin } = parseGlb(u8);
  const laporan = { dihapus: {}, sebelum: u8.length };
  const j = JSON.parse(JSON.stringify(json));

  const meshes = j.meshes || [];
  const accessors = j.accessors || [];
  const bufferViews = j.bufferViews || [];
  const materials = j.materials || [];
  const textures = j.textures || [];
  const images = j.images || [];
  const samplers = j.samplers || [];

  // Opsi strip: buang atribut dari primitive sebelum menghitung pemakaian.
  let stripTangen = 0, stripUv = 0;
  if (o.hapusTangen || o.hapusUvLanjut) {
    for (const m of meshes) {
      for (const p of (m.primitives || [])) {
        if (!p.attributes) continue;
        if (o.hapusTangen && p.attributes.TANGENT_0 != null) { delete p.attributes.TANGENT_0; stripTangen++; }
        if (o.hapusUvLanjut) {
          for (const k of Object.keys(p.attributes)) {
            if (/^TEXCOORD_[1-9]/.test(k)) { delete p.attributes[k]; stripUv++; }
          }
        }
        if (p.targets) {
          for (const t of p.targets) {
            if (o.hapusTangen && t.TANGENT_0 != null) { delete t.TANGENT_0; stripTangen++; }
            if (o.hapusUvLanjut) for (const k of Object.keys(t)) if (/^TEXCOORD_[1-9]/.test(k)) { delete t[k]; stripUv++; }
          }
        }
      }
    }
  }
  if (stripTangen) laporan.dihapus.tangen = stripTangen;
  if (stripUv) laporan.dihapus.uvLanjut = stripUv;

  // 1. Accessor yang dipakai.
  const pakaiAccessor = new Set();
  const pakaiBufferView = new Set();
  function tandaiAccessor(i) { if (i != null && accessors[i]) pakaiAccessor.add(i); }
  for (const m of meshes) {
    for (const p of (m.primitives || [])) {
      if (p.indices != null) tandaiAccessor(p.indices);
      for (const v of Object.values(p.attributes || {})) tandaiAccessor(v);
      for (const t of (p.targets || [])) for (const v of Object.values(t)) tandaiAccessor(v);
    }
  }
  for (const s of (j.skins || [])) {
    tandaiAccessor(s.inverseBindMatrices);
  }
  for (const a of (j.animations || [])) {
    for (const sm of (a.samplers || [])) { tandaiAccessor(sm.input); tandaiAccessor(sm.output); }
  }
  for (const i of pakaiAccessor) {
    const a = accessors[i];
    if (a.bufferView != null) pakaiBufferView.add(a.bufferView);
    if (a.sparse) {
      if (a.sparse.indices && a.sparse.indices.bufferView != null) pakaiBufferView.add(a.sparse.indices.bufferView);
      if (a.sparse.values && a.sparse.values.bufferView != null) pakaiBufferView.add(a.sparse.values.bufferView);
    }
  }
  // 2. Material -> tekstur -> gambar/sampler.
  const pakaiMaterial = new Set();
  for (const m of meshes) for (const p of (m.primitives || [])) if (p.material != null) pakaiMaterial.add(p.material);
  const pakaiTekstur = new Set();
  for (const i of pakaiMaterial) {
    if (!materials[i]) continue;
    for (const t of teksturDariMaterial(materials[i])) pakaiTekstur.add(t);
  }
  const pakaiGambar = new Set();
  const pakaiSampler = new Set();
  for (const i of pakaiTekstur) {
    const t = textures[i];
    if (!t) continue;
    if (t.source != null) pakaiGambar.add(t.source);
    if (t.sampler != null) pakaiSampler.add(t.sampler);
  }
  for (const i of pakaiGambar) {
    const g = images[i];
    if (g && g.bufferView != null) pakaiBufferView.add(g.bufferView);
  }

  // 3. Peta indeks lama -> baru (hanya yang dipakai, urutan dipertahankan).
  function petaBaru(n, pakai) {
    const peta = new Map();
    let baru = 0;
    for (let i = 0; i < n; i++) if (pakai.has(i)) peta.set(i, baru++);
    return peta;
  }
  const petaAccessor = petaBaru(accessors.length, pakaiAccessor);
  const petaBufferView = petaBaru(bufferViews.length, pakaiBufferView);
  const petaMaterial = petaBaru(materials.length, pakaiMaterial);
  const petaTekstur = petaBaru(textures.length, pakaiTekstur);
  const petaGambar = petaBaru(images.length, pakaiGambar);
  const petaSampler = petaBaru(samplers.length, pakaiSampler);
  laporan.dihapus.accessor = accessors.length - petaAccessor.size;
  laporan.dihapus.bufferView = bufferViews.length - petaBufferView.size;
  laporan.dihapus.material = materials.length - petaMaterial.size;
  laporan.dihapus.tekstur = textures.length - petaTekstur.size;
  laporan.dihapus.gambar = images.length - petaGambar.size;
  laporan.dihapus.sampler = samplers.length - petaSampler.size;

  // 4. Bangun ulang BIN hanya dari bufferView yang dipakai.
  const binBaru = [];
  const offsetBaru = new Map();
  for (const [lama] of petaBufferView) {
    const bv = bufferViews[lama];
    const awal = bv.byteOffset || 0;
    const potong = bin.slice(awal, awal + (bv.byteLength || 0));
    while (binBaru.length % 4 !== 0) binBaru.push(0);
    offsetBaru.set(lama, binBaru.length);
    for (const b of potong) binBaru.push(b);
  }
  while (binBaru.length % 4 !== 0) binBaru.push(0);
  const binHasil = new Uint8Array(binBaru);

  // 5. Tulis ulang JSON dengan indeks baru.
  const jBaru = JSON.parse(JSON.stringify(j));
  jBaru.bufferViews = [...petaBufferView.keys()].map((lama) => {
    const bv = { ...bufferViews[lama] };
    bv.byteOffset = offsetBaru.get(lama);
    return bv;
  });
  jBaru.accessors = [...petaAccessor.keys()].map((lama) => {
    const a = { ...accessors[lama] };
    if (a.bufferView != null) a.bufferView = petaBufferView.get(a.bufferView);
    if (a.sparse) {
      a.sparse = JSON.parse(JSON.stringify(a.sparse));
      if (a.sparse.indices) a.sparse.indices.bufferView = petaBufferView.get(a.sparse.indices.bufferView);
      if (a.sparse.values) a.sparse.values.bufferView = petaBufferView.get(a.sparse.values.bufferView);
    }
    return a;
  });
  const tulisUlangTekstur = (mat) => {
    (function jalan(obj) {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.index === 'number' && /texture/i.test(k)) v.index = petaTekstur.get(v.index);
        jalan(v);
      }
    })(mat);
  };
  jBaru.materials = [...petaMaterial.keys()].map((lama) => {
    const m = JSON.parse(JSON.stringify(materials[lama]));
    tulisUlangTekstur(m);
    return m;
  });
  jBaru.textures = [...petaTekstur.keys()].map((lama) => {
    const t = { ...textures[lama] };
    if (t.source != null) t.source = petaGambar.get(t.source);
    if (t.sampler != null) t.sampler = petaSampler.get(t.sampler);
    return t;
  });
  jBaru.images = [...petaGambar.keys()].map((lama) => {
    const g = { ...images[lama] };
    if (g.bufferView != null) g.bufferView = petaBufferView.get(g.bufferView);
    return g;
  });
  jBaru.samplers = [...petaSampler.keys()].map((lama) => ({ ...samplers[lama] }));
  for (const m of (jBaru.meshes || [])) {
    for (const p of (m.primitives || [])) {
      if (p.indices != null) p.indices = petaAccessor.get(p.indices);
      if (p.material != null) p.material = petaMaterial.get(p.material);
      if (p.attributes) for (const k of Object.keys(p.attributes)) p.attributes[k] = petaAccessor.get(p.attributes[k]);
      for (const t of (p.targets || [])) for (const k of Object.keys(t)) t[k] = petaAccessor.get(t[k]);
    }
  }
  for (const s of (jBaru.skins || [])) {
    if (s.inverseBindMatrices != null) s.inverseBindMatrices = petaAccessor.get(s.inverseBindMatrices);
  }
  for (const a of (jBaru.animations || [])) {
    for (const sm of (a.samplers || [])) {
      sm.input = petaAccessor.get(sm.input);
      sm.output = petaAccessor.get(sm.output);
    }
  }
  if (o.hapusEkstra) hapusEkstra(jBaru);
  if (jBaru.buffers && jBaru.buffers[0]) jBaru.buffers[0].byteLength = binHasil.length;

  const keluar = rakitGlb(jBaru, binHasil);
  laporan.sesudah = keluar.length;
  laporan.hemat = laporan.sebelum - keluar.length;
  laporan.persen = laporan.sebelum > 0 ? Math.round((laporan.hemat / laporan.sebelum) * 1000) / 10 : 0;
  laporan.binSebelum = bin.length;
  laporan.binSesudah = binHasil.length;
  return { keluar, laporan, json: jBaru };
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Kecilkan file .glb dengan membuang data yang tidak dipakai dan merapikan JSON-nya. ' + T.esc(LOCAL_NOTE) + ' Ini bukan kompresi Draco/meshopt: bentuk model tidak berubah, file hasil tetap GLB standar.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.glb';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  const cekTangen = document.createElement('input');
  cekTangen.type = 'checkbox';
  const cekUv = document.createElement('input');
  cekUv.type = 'checkbox';
  const cekEkstra = document.createElement('input');
  cekEkstra.type = 'checkbox';
  cekEkstra.checked = true;
  function barisCek(el, teks) {
    const l = T.el('<label style="display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:6px 0;line-height:1.4"></label>');
    l.append(el, document.createTextNode(teks));
    return l;
  }
  const opsiEl = T.el('<div></div>');
  opsiEl.append(
    barisCek(cekEkstra, 'Hapus data "extras" di JSON (catatan tambahan pembuat file, aman dihapus)'),
    barisCek(cekTangen, 'Hapus tangen (TANGENT_0), bisa dihitung ulang oleh mesin 3D, tapi normal map bisa sedikit berubah'),
    barisCek(cekUv, 'Hapus UV kedua dan seterusnya (TEXCOORD_1+), hanya bila modelmu tidak memakai lightmap/tekstur kedua'),
  );

  let hasilTerakhir = null, namaDasar = 'model';

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Memproses file...';
    infoEl.innerHTML = ''; aksiEl.innerHTML = '';
    hasilTerakhir = null;
    try {
      const u8 = new Uint8Array(await f.arrayBuffer());
      namaDasar = f.name.replace(/\.glb$/i, '') || 'model';
      const { keluar, laporan } = kompresGlb(u8, {
        hapusTangen: cekTangen.checked,
        hapusUvLanjut: cekUv.checked,
        hapusEkstra: cekEkstra.checked,
      });
      hasilTerakhir = keluar;
      // Validasi: hasil harus bisa di-parse lagi dan mesh-nya utuh.
      const cek = parseGlb(keluar);
      const meshAsal = parseGlb(u8).json.meshes ? parseGlb(u8).json.meshes.length : 0;
      const meshHasil = cek.json.meshes ? cek.json.meshes.length : 0;
      if (meshAsal !== meshHasil) throw new Error('Validasi gagal: jumlah mesh berubah.');
      statusEl.textContent = '';
      const rincian = [];
      const d = laporan.dihapus;
      if (d.accessor) rincian.push(d.accessor + ' accessor');
      if (d.bufferView) rincian.push(d.bufferView + ' bufferView');
      if (d.material) rincian.push(d.material + ' material');
      if (d.tekstur) rincian.push(d.tekstur + ' tekstur');
      if (d.gambar) rincian.push(d.gambar + ' gambar');
      if (d.sampler) rincian.push(d.sampler + ' sampler');
      if (d.tangen) rincian.push(d.tangen + ' atribut tangen');
      if (d.uvLanjut) rincian.push(d.uvLanjut + ' atribut UV lanjut');
      infoEl.innerHTML = '<div class="card">' +
        kv('File asal', T.esc(f.name) + ' (' + fmtBytes(laporan.sebelum) + ')') +
        kv('File hasil', fmtBytes(laporan.sesudah)) +
        kv('Hemat', fmtBytes(laporan.hemat) + ' (' + utils.r4(laporan.persen) + '%)') +
        kv('Data biner', fmtBytes(laporan.binSebelum) + ' → ' + fmtBytes(laporan.binSesudah)) +
        kv('Mesh', T.fmt(meshHasil) + ' (tetap utuh)') +
        kv('Yang dibuang', rincian.length ? T.esc(rincian.join(', ')) : 'tidak ada data tak terpakai, file sudah rapat') +
        '</div>';
      if (laporan.hemat <= 0) {
        infoEl.innerHTML += '<p class="hint">File ini sudah rapat: tidak ada byte yang bisa dihemat dengan cara ini. Untuk pengecilan lebih jauh, pakai kompresi Draco/meshopt di aplikasi desktop (mis. gltf-transform). Tool ini sengaja tidak melakukannya supaya hasilnya tetap GLB standar.</p>';
      }
      aksiEl.append(T.btn('Unduh GLB hasil', () => T.dl(namaDasar + '-kecil.glb', new Blob([hasilTerakhir], { type: 'model/gltf-binary' }), 'model/gltf-binary'), true));
    } catch (e) {
      statusEl.textContent = '';
      infoEl.innerHTML = '<p style="color:var(--err)">File tidak bisa diproses: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  fileI.addEventListener('change', bukaFile);
  root.append(
    T.field('Pilih file GLB', fileI, 'Contoh: model.glb. File .gltf (JSON) tidak didukung di tool ini.'),
    opsiEl,
    statusEl,
    infoEl,
    aksiEl,
  );
}
