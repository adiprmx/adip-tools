import { h as T, utils, LOCAL_NOTE } from '../../core.js';

// Pembuat Diagram Alir: buat flowchart dengan simpul yang bisa digeser
// dan disambung. Simpulnya empat macam: mulai, proses, putusan (belah
// ketupat), dan akhir. Diagram tersimpan di browser ini saja, bisa
// diunduh sebagai gambar SVG atau PNG.
export const meta = {"id": "diagram-alir", "name": "Pembuat Diagram Alir", "cat": "produktivitas", "icon": "🔀", "desc": "Buat diagram alir dengan simpul yang bisa digeser dan disambung.", "keywords": "diagram alir,flowchart,buat flowchart,diagram,alur proses", "since": "6.19.0"};

const LS_KUNCI = 'adipTools_diagram-alir';
const LEBAR_KANVAS = 720;
const TINGGI_KANVAS = 520;

export const JENIS_SIMPUL = [
  ['mulai', 'Mulai (lonjong)'],
  ['proses', 'Proses (kotak)'],
  ['putusan', 'Putusan (belah ketupat)'],
  ['akhir', 'Akhir (lonjong)'],
];

export const UKURAN_SIMPUL = {
  mulai: { w: 120, h: 48 },
  proses: { w: 150, h: 56 },
  putusan: { w: 150, h: 84 },
  akhir: { w: 120, h: 48 },
};

// Model kosong. Murni.
export function buatModel() {
  return { simpul: [], sambung: [] };
}

let _idBerikut = 1;
export function idBaru(prefix) {
  return prefix + (_idBerikut++) + '-' + Date.now().toString(36);
}

// Tambah simpul; posisi otomatis di bawah simpul terakhir (atau pojok
// kiri atas bila masih kosong). Murni (posisi bisa ditimpa setelahnya).
export function tambahSimpul(model, jenis, label) {
  const daftar = model.simpul || [];
  let x = 30, y = 30;
  if (daftar.length) {
    const akhir = daftar[daftar.length - 1];
    const u = UKURAN_SIMPUL[akhir.jenis] || { w: 120, h: 48 };
    x = akhir.x;
    y = akhir.y + u.h + 40;
    if (y > TINGGI_KANVAS - 100) { y = 30; x = akhir.x + 180; }
  }
  const simpul = { id: idBaru('n'), jenis, label: String(label || '').trim() || 'Tanpa nama', x, y };
  daftar.push(simpul);
  return simpul;
}

// Tambah sambungan antar simpul. Menolak sambung ke diri sendiri dan
// sambungan ganda. Mengembalikan sambungan baru atau null bila ditolak.
// Murni, bisa diuji di Node.
export function tambahSambung(model, dari, ke, label) {
  if (!dari || !ke || dari === ke) return null;
  const ada = (model.simpul || []).some((s) => s.id === dari) && (model.simpul || []).some((s) => s.id === ke);
  if (!ada) return null;
  if ((model.sambung || []).some((s) => s.dari === dari && s.ke === ke)) return null;
  const sambung = { id: idBaru('e'), dari, ke, label: String(label || '').trim() };
  model.sambung.push(sambung);
  return sambung;
}

// Hapus simpul beserta sambungan yang menyentuhnya. Murni.
export function hapusSimpul(model, id) {
  model.simpul = (model.simpul || []).filter((s) => s.id !== id);
  model.sambung = (model.sambung || []).filter((s) => s.dari !== id && s.ke !== id);
}

// Periksa model: sambungan harus menunjuk simpul yang ada, tidak ada
// sambung ke diri sendiri. Mengembalikan daftar masalah (kosong = baik).
// Murni, bisa diuji di Node.
export function validasiModel(model) {
  const masalah = [];
  const id = new Set((model.simpul || []).map((s) => s.id));
  for (const s of model.sambung || []) {
    if (!id.has(s.dari)) masalah.push('Sambungan dari simpul yang sudah tidak ada.');
    if (!id.has(s.ke)) masalah.push('Sambungan ke simpul yang sudah tidak ada.');
    if (s.dari === s.ke) masalah.push('Ada simpul yang tersambung ke dirinya sendiri.');
  }
  return masalah;
}

export function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Serialisasi model jadi SVG mandiri. Murni, bisa diuji di Node.
export function modelKeSvg(model, opsi) {
  const o = opsi || {};
  const lebar = o.lebar || LEBAR_KANVAS;
  const tinggi = o.tinggi || TINGGI_KANVAS;
  const latar = o.latar || '#171412';
  const garis = o.garis || '#ffffff';
  const teks = o.teks || '#ffffff';
  const isi = o.isi || '#221e1b';
  const cari = (id) => (model.simpul || []).find((s) => s.id === id);
  const tengahBawah = (s) => {
    const u = UKURAN_SIMPUL[s.jenis] || { w: 120, h: 48 };
    return { x: s.x + u.w / 2, y: s.y + u.h };
  };
  const tengahAtas = (s) => {
    const u = UKURAN_SIMPUL[s.jenis] || { w: 120, h: 48 };
    return { x: s.x + u.w / 2, y: s.y };
  };
  let out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + lebar + '" height="' + tinggi + '" viewBox="0 0 ' + lebar + ' ' + tinggi + '">';
  out += '<rect width="100%" height="100%" fill="' + latar + '"/>';
  out += '<defs><marker id="panah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="' + garis + '"/></marker></defs>';
  for (const s of model.sambung || []) {
    const a = cari(s.dari), b = cari(s.ke);
    if (!a || !b) continue;
    const p1 = tengahBawah(a), p2 = tengahAtas(b);
    const tengahY = (p1.y + p2.y) / 2;
    const jalur = 'M' + p1.x + ',' + p1.y + ' C' + p1.x + ',' + tengahY + ' ' + p2.x + ',' + tengahY + ' ' + p2.x + ',' + (p2.y - 2);
    out += '<path d="' + jalur + '" fill="none" stroke="' + garis + '" stroke-width="1.5" marker-end="url(#panah)"/>';
    if (s.label) {
      out += '<text x="' + ((p1.x + p2.x) / 2 + 6) + '" y="' + (tengahY - 4) + '" font-family="system-ui, sans-serif" font-size="12" fill="' + teks + '">' + escXml(s.label) + '</text>';
    }
  }
  for (const s of model.simpul || []) {
    const u = UKURAN_SIMPUL[s.jenis] || { w: 120, h: 48 };
    const cx = s.x + u.w / 2, cy = s.y + u.h / 2;
    if (s.jenis === 'putusan') {
      out += '<polygon points="' + cx + ',' + s.y + ' ' + (s.x + u.w) + ',' + cy + ' ' + cx + ',' + (s.y + u.h) + ' ' + s.x + ',' + cy + '" fill="' + isi + '" stroke="' + garis + '" stroke-width="1.5"/>';
    } else if (s.jenis === 'mulai' || s.jenis === 'akhir') {
      out += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (u.w / 2) + '" ry="' + (u.h / 2) + '" fill="' + isi + '" stroke="' + garis + '" stroke-width="1.5"/>';
    } else {
      out += '<rect x="' + s.x + '" y="' + s.y + '" width="' + u.w + '" height="' + u.h + '" rx="10" fill="' + isi + '" stroke="' + garis + '" stroke-width="1.5"/>';
    }
    out += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="' + teks + '">' + escXml(s.label) + '</text>';
  }
  out += '</svg>';
  return out;
}

function muatModel() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KUNCI) || 'null');
    if (v && Array.isArray(v.simpul) && Array.isArray(v.sambung)) return v;
  } catch (e) {}
  return buatModel();
}

export function render(root) {
  const labelI = T.input('text', 'Nama simpul, misal Cek stok');
  const jenisSel = T.select(JENIS_SIMPUL, 'proses');
  const dariSel = T.select([], '');
  const keSel = T.select([], '');
  const labelSambungI = T.input('text', 'Label panah (boleh kosong, misal Ya)');
  const labelUbahI = T.input('text', 'Ubah nama simpul yang dipilih');
  const kanvasBox = T.out();
  const statusBox = T.out();

  let model = muatModel();
  let terpilih = null; // id simpul

  function simpan() {
    try { localStorage.setItem(LS_KUNCI, JSON.stringify(model)); } catch (e) {}
  }

  function isiPilihanSimpul() {
    const pasangan = model.simpul.map((s) => [s.id, s.label + ' (' + s.jenis + ')']);
    const isi = (sel) => {
      sel.innerHTML = '';
      if (!pasangan.length) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = 'Belum ada simpul';
        sel.appendChild(o);
        return;
      }
      pasangan.forEach(([v, l]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = l;
        sel.appendChild(o);
      });
    };
    isi(dariSel);
    isi(keSel);
  }

  function catat() {
    isiPilihanSimpul();
    const svgTeks = modelKeSvg(model);
    T.show(kanvasBox, '');
    const wadah = T.el('<div style="border:1px solid #ffffff14;border-radius:12px;overflow:auto;background:#171412"></div>');
    wadah.innerHTML = svgTeks;
    const svg = wadah.querySelector('svg');
    svg.style.cssText = 'display:block;min-width:520px;width:100%;height:auto;touch-action:none';
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Diagram alir');
    // Lapisi simpul dengan area klik/seret (rect transparan per simpul).
    model.simpul.forEach((s) => {
      const u = UKURAN_SIMPUL[s.jenis] || { w: 120, h: 48 };
      const area = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      area.setAttribute('x', s.x);
      area.setAttribute('y', s.y);
      area.setAttribute('width', u.w);
      area.setAttribute('height', u.h);
      area.setAttribute('fill', 'transparent');
      area.setAttribute('data-id', s.id);
      area.style.cursor = 'grab';
      if (terpilih === s.id) {
        area.setAttribute('stroke', '#fff');
        area.setAttribute('stroke-width', '2');
        area.setAttribute('stroke-dasharray', '5 4');
        area.setAttribute('rx', '10');
      }
      area.addEventListener('pointerdown', (ev) => mulaiSeret(ev, s.id, svg));
      svg.appendChild(area);
    });
    kanvasBox.appendChild(wadah);
    const info = T.el('<p class="dim" style="font-size:12px;margin-top:6px">' + model.simpul.length + ' simpul, ' + model.sambung.length + ' sambungan. Ketuk simpul untuk memilih, seret untuk memindah.</p>');
    kanvasBox.appendChild(info);
  }

  function keKoordinatSvg(ev, svg) {
    const r = svg.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (LEBAR_KANVAS / r.width),
      y: (ev.clientY - r.top) * (TINGGI_KANVAS / r.height),
    };
  }

  function mulaiSeret(ev, id, svg) {
    ev.preventDefault();
    const simpul = model.simpul.find((s) => s.id === id);
    if (!simpul) return;
    terpilih = id;
    labelUbahI.value = simpul.label;
    catat();
    const awal = keKoordinatSvg(ev, svg);
    const x0 = simpul.x, y0 = simpul.y;
    let bergerak = false;
    const gerak = (e2) => {
      const p = keKoordinatSvg(e2, svg);
      const dx = p.x - awal.x, dy = p.y - awal.y;
      if (!bergerak && Math.hypot(dx, dy) < 3) return;
      bergerak = true;
      const u = UKURAN_SIMPUL[simpul.jenis] || { w: 120, h: 48 };
      simpul.x = Math.max(0, Math.min(LEBAR_KANVAS - u.w, x0 + dx));
      simpul.y = Math.max(0, Math.min(TINGGI_KANVAS - u.h, y0 + dy));
      catat();
    };
    const lepas = () => {
      window.removeEventListener('pointermove', gerak);
      window.removeEventListener('pointerup', lepas);
      if (bergerak) simpan();
      catat();
    };
    window.addEventListener('pointermove', gerak);
    window.addEventListener('pointerup', lepas);
  }

  function tambah() {
    const s = tambahSimpul(model, jenisSel.value, labelI.value);
    labelI.value = '';
    terpilih = s.id;
    simpan();
    catat();
    T.toast('Simpul ditambahkan');
  }

  function sambung() {
    const hasil = tambahSambung(model, dariSel.value, keSel.value, labelSambungI.value);
    if (!hasil) { T.toast('Pilih dua simpul yang berbeda, dan jangan sambung dua kali'); return; }
    labelSambungI.value = '';
    simpan();
    catat();
    T.toast('Simpul tersambung');
  }

  const tambahB = T.btn('Tambah Simpul', tambah, true);
  const sambungB = T.btn('Sambung', sambung);
  const ubahB = T.btn('Ubah nama', () => {
    if (!terpilih) { T.toast('Pilih dulu simpulnya di kanvas'); return; }
    const s = model.simpul.find((x) => x.id === terpilih);
    if (!s) return;
    const nama = labelUbahI.value.trim();
    if (!nama) { T.toast('Tulis dulu nama barunya'); return; }
    s.label = nama;
    simpan();
    catat();
    T.toast('Nama diubah');
  });
  const hapusB = T.btn('Hapus yang dipilih', () => {
    if (!terpilih) { T.toast('Pilih dulu simpulnya di kanvas'); return; }
    hapusSimpul(model, terpilih);
    terpilih = null;
    labelUbahI.value = '';
    simpan();
    catat();
    T.toast('Simpul dihapus');
  });
  const svgB = T.btn('Unduh SVG', () => {
    if (!model.simpul.length) { T.toast('Diagram masih kosong'); return; }
    T.dl('diagram-alir.svg', modelKeSvg(model), 'image/svg+xml;charset=utf-8');
    T.toast('Berhasil diunduh');
  });
  const pngB = T.btn('Unduh PNG', () => {
    if (!model.simpul.length) { T.toast('Diagram masih kosong'); return; }
    const svgTeks = modelKeSvg(model);
    const blob = new Blob([svgTeks], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = LEBAR_KANVAS; c.height = TINGGI_KANVAS;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => {
        if (!b) { T.toast('Gambar gagal dibuat'); return; }
        T.dl('diagram-alir.png', b, 'image/png');
        T.toast('Berhasil diunduh');
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); T.toast('Gambar gagal dibuat'); };
    img.src = url;
  });
  const bersihB = T.btn('Hapus semua', () => {
    model = buatModel();
    terpilih = null;
    simpan();
    catat();
    T.toast('Diagram dikosongkan');
  });

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tambah simpul satu per satu, lalu sambungkan. Simpul yang baru muncul di bawah simpul terakhir dan bisa diseret ke mana saja.</p>'));
  root.appendChild(T.grid2(
    T.field('Nama simpul baru', labelI),
    T.field('Bentuk simpul', jenisSel),
  ));
  root.appendChild(T.row(tambahB));
  root.appendChild(T.el('<div style="font-weight:700;margin:16px 0 8px">Sambungkan dua simpul</div>'));
  root.appendChild(T.grid2(
    T.field('Dari simpul', dariSel),
    T.field('Ke simpul', keSel),
  ));
  root.appendChild(T.field('Label panah', labelSambungI));
  root.appendChild(T.row(sambungB));
  root.appendChild(T.el('<div style="font-weight:700;margin:16px 0 8px">Diagram</div>'));
  root.appendChild(kanvasBox);
  root.appendChild(T.field('Nama simpul yang dipilih', labelUbahI));
  root.appendChild(T.el('<div class="row" style="flex-wrap:wrap"></div>'));
  const barisAksi = root.lastChild;
  barisAksi.appendChild(ubahB);
  barisAksi.appendChild(hapusB);
  barisAksi.appendChild(svgB);
  barisAksi.appendChild(pngB);
  barisAksi.appendChild(bersihB);
  root.appendChild(statusBox);
  catat();
}
