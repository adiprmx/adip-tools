// Parser DXF + DXF ke SVG: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari developer/dxf-ke-svg.js + developer/lihat-file-dxf.js
// (G4 B13): kedua salinan identik kecuali satu variabel mati `minY` di
// dxfKeSvg versi dxf-ke-svg.js (tidak pernah dipakai; fy memakai
// bbox.maxY + pad; kanon memakai bentuk tanpa minY, perilaku sama persis).
// Dipakai 2 tool; ditaruh di modul terpisah (bukan core.js) supaya hanya
// 2 tool itu yang memikul biaya parse ~330 baris ini (preseden
// js/regex-aman.js G4 C1G4).
// Parser ditulis sendiri (tanpa pustaka): LINE, LWPOLYLINE/POLYLINE
// (termasuk lengkung bulge), CIRCLE, ARC, ELLIPSE, SPLINE (lewat titik
// fit/kontrol), POINT, TEXT/MTEXT, SOLID, dan INSERT (referensi blok).
// Entitas lain (DIMENSION, HATCH, dsb.) dihitung dan dilaporkan,
// tidak digambar.
import { h as T, utils } from './core.js';

export const WARNA_ACI = { 1: '#ff0000', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff', 5: '#0000ff', 6: '#ff00ff', 7: '#111111', 8: '#808080', 9: '#c0c0c0' };
export const SATUAN_DXF = { 0: 'tanpa satuan', 1: 'inci', 2: 'kaki', 3: 'mil', 4: 'milimeter', 5: 'sentimeter', 6: 'meter', 7: 'kilometer', 8: 'mikroinci', 9: 'mil', 10: 'yard', 11: 'angstrom', 12: 'nanometer', 13: 'mikrometer', 14: 'desimeter', 15: 'dekameter', 16: 'hektometer', 17: 'gigameter', 18: 'AU', 19: 'tahun cahaya', 20: 'parsec' };

function warnaDari(kode) {
  if (kode == null) return '#111111';
  return WARNA_ACI[kode] || '#111111';
}

export function pasanganDxf(teks) {
  const baris = String(teks).split(/\r\n|\r|\n/);
  const keluar = [];
  for (let i = 0; i + 1 < baris.length; i += 2) {
    const kode = parseInt(String(baris[i]).trim(), 10);
    if (isNaN(kode)) continue;
    keluar.push([kode, baris[i + 1] == null ? '' : String(baris[i + 1])]);
  }
  return keluar;
}

function ambil(ps, kode, awal) {
  for (const [k, v] of ps) if (k === kode) return v;
  return awal;
}
function semua(ps, kode) {
  const out = [];
  for (const [k, v] of ps) if (k === kode) out.push(v);
  return out;
}
function num(v, awal) {
  const n = parseFloat(v);
  return isNaN(n) ? (awal == null ? 0 : awal) : n;
}

// Lengkung dari bulge DXF (bulge = tan(sudut/4)): sampel jadi titik-titik.
function busurBulge(x0, y0, x1, y1, b) {
  const dx = x1 - x0, dy = y1 - y0;
  const c = Math.hypot(dx, dy);
  if (c === 0 || b === 0) return [[x1, y1]];
  const r = (c * (1 + b * b)) / (4 * Math.abs(b));
  const s = -(c / 2) * (1 - b * b) / (2 * b);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const ux = dx / c, uy = dy / c;
  const cx = mx + -uy * s, cy = my + ux * s;
  let a0 = Math.atan2(y0 - cy, x0 - cx);
  let a1 = Math.atan2(y1 - cy, x1 - cx);
  const ccw = b > 0;
  if (ccw && a1 <= a0) a1 += Math.PI * 2;
  if (!ccw && a1 >= a0) a1 -= Math.PI * 2;
  const langkah = Math.max(4, Math.min(24, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 12))));
  const titik = [];
  for (let i = 1; i <= langkah; i++) {
    const a = a0 + ((a1 - a0) * i) / langkah;
    titik.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return titik;
}

function polyDariTitik(ps, titik, tutup, lapis, warna) {
  const bulge = semua(ps, 42).map((v) => num(v, 0));
  const keluar = [];
  if (!titik.length) return null;
  keluar.push(titik[0]);
  const n = tutup ? titik.length : titik.length - 1;
  for (let i = 0; i < n; i++) {
    const a = titik[i], b = titik[(i + 1) % titik.length];
    const bg = bulge[i] || 0;
    if (bg !== 0) keluar.push(...busurBulge(a[0], a[1], b[0], b[1], bg));
    else keluar.push(b);
  }
  return { tipe: 'poly', lapis, warna, titik: keluar, tutup };
}

function tafsirEntitas(jenis, ps, blok, dalamBlok) {
  const lapis = ambil(ps, 8, '0');
  const warna = warnaDari(ps.some(([k]) => k === 62) ? parseInt(ambil(ps, 62, '7'), 10) : null);
  switch (jenis) {
    case 'LINE':
      return { tipe: 'garis', lapis, warna, x1: num(ambil(ps, 10)), y1: num(ambil(ps, 20)), x2: num(ambil(ps, 11)), y2: num(ambil(ps, 21)) };
    case 'LWPOLYLINE': {
      const xs = semua(ps, 10).map((v) => num(v));
      const ys = semua(ps, 20).map((v) => num(v));
      const titik = xs.map((x, i) => [x, ys[i] == null ? 0 : ys[i]]);
      const tutup = (parseInt(ambil(ps, 70, '0'), 10) & 1) === 1;
      return polyDariTitik(ps, titik, tutup, lapis, warna);
    }
    case 'CIRCLE':
      return { tipe: 'lingkaran', lapis, warna, cx: num(ambil(ps, 10)), cy: num(ambil(ps, 20)), r: Math.abs(num(ambil(ps, 40))) };
    case 'ARC': {
      const cx = num(ambil(ps, 10)), cy = num(ambil(ps, 20)), r = Math.abs(num(ambil(ps, 40)));
      let a0 = num(ambil(ps, 50)) * Math.PI / 180;
      let a1 = num(ambil(ps, 51)) * Math.PI / 180;
      if (a1 <= a0) a1 += Math.PI * 2;
      const titik = [];
      const langkah = Math.max(4, Math.min(48, Math.ceil((a1 - a0) / (Math.PI / 24))));
      for (let i = 0; i <= langkah; i++) {
        const a = a0 + ((a1 - a0) * i) / langkah;
        titik.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return { tipe: 'poly', lapis, warna, titik, tutup: false };
    }
    case 'ELLIPSE': {
      const cx = num(ambil(ps, 10)), cy = num(ambil(ps, 20));
      const ax = num(ambil(ps, 11)), ay = num(ambil(ps, 21));
      const rasio = num(ambil(ps, 40), 1);
      const a0 = num(ambil(ps, 41), 0), a1 = num(ambil(ps, 42), Math.PI * 2);
      const panjang = Math.hypot(ax, ay) || 1;
      const putar = Math.atan2(ay, ax);
      const titik = [];
      const langkah = 32;
      for (let i = 0; i <= langkah; i++) {
        const t = a0 + ((a1 - a0) * i) / langkah;
        const lx = panjang * Math.cos(t), ly = panjang * rasio * Math.sin(t);
        titik.push([cx + lx * Math.cos(putar) - ly * Math.sin(putar), cy + lx * Math.sin(putar) + ly * Math.cos(putar)]);
      }
      return { tipe: 'poly', lapis, warna, titik, tutup: a1 - a0 >= Math.PI * 2 - 0.001 };
    }
    case 'SPLINE': {
      const fx = semua(ps, 11).map((v) => num(v));
      const fy = semua(ps, 21).map((v) => num(v));
      const cx = semua(ps, 10).map((v) => num(v));
      const cy = semua(ps, 20).map((v) => num(v));
      const pakai = fx.length >= 2 ? fx.map((x, i) => [x, fy[i] || 0]) : cx.map((x, i) => [x, cy[i] || 0]);
      if (pakai.length < 2) return null;
      return { tipe: 'poly', lapis, warna, titik: pakai, tutup: (parseInt(ambil(ps, 70, '0'), 10) & 1) === 1 };
    }
    case 'POINT':
      return { tipe: 'titik', lapis, warna, x: num(ambil(ps, 10)), y: num(ambil(ps, 20)) };
    case 'TEXT': {
      const isi = ambil(ps, 1, '');
      if (!isi) return null;
      return { tipe: 'teks', lapis, warna, x: num(ambil(ps, 10)), y: num(ambil(ps, 20)), tinggi: Math.abs(num(ambil(ps, 40), 1)) || 1, isi, putar: num(ambil(ps, 50), 0) };
    }
    case 'MTEXT': {
      const isi = semua(ps, 1).concat(semua(ps, 3)).join('').replace(/\\P/g, ' ');
      if (!isi) return null;
      return { tipe: 'teks', lapis, warna, x: num(ambil(ps, 10)), y: num(ambil(ps, 20)), tinggi: Math.abs(num(ambil(ps, 40), 1)) || 1, isi, putar: num(ambil(ps, 50), 0) };
    }
    case 'SOLID': {
      const titik = [[10, 20], [11, 21], [12, 22], [13, 23]].map(([a, b]) => [num(ambil(ps, a)), num(ambil(ps, b))]);
      return { tipe: 'isi', lapis, warna, titik };
    }
    case 'INSERT': {
      if (dalamBlok) return null;
      const namaBlok = ambil(ps, 2, '');
      const isiBlok = blok[namaBlok];
      if (!isiBlok) return null;
      const sx = num(ambil(ps, 41), 1), sy = num(ambil(ps, 42), 1);
      const putar = num(ambil(ps, 50), 0) * Math.PI / 180;
      const tx = num(ambil(ps, 10)), ty = num(ambil(ps, 20));
      const ubah = (x, y) => {
        const rx = x * Math.cos(putar) - y * Math.sin(putar);
        const ry = x * Math.sin(putar) + y * Math.cos(putar);
        return [rx * sx + tx, ry * sy + ty];
      };
      const hasil = [];
      for (const e of isiBlok) {
        if (e.tipe === 'garis') {
          const a = ubah(e.x1, e.y1), b = ubah(e.x2, e.y2);
          hasil.push({ tipe: 'garis', lapis, warna: e.warna, x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
        } else if (e.tipe === 'poly' || e.tipe === 'isi') {
          hasil.push({ ...e, lapis, titik: e.titik.map(([x, y]) => ubah(x, y)) });
        } else if (e.tipe === 'lingkaran') {
          if (Math.abs(sx - sy) < 0.001) {
            const c = ubah(e.cx, e.cy);
            hasil.push({ tipe: 'lingkaran', lapis, warna: e.warna, cx: c[0], cy: c[1], r: e.r * Math.abs(sx) });
          } else {
            const titik = [];
            for (let i = 0; i <= 32; i++) {
              const a = (Math.PI * 2 * i) / 32;
              titik.push(ubah(e.cx + e.r * Math.cos(a), e.cy + e.r * Math.sin(a)));
            }
            hasil.push({ tipe: 'poly', lapis, warna: e.warna, titik, tutup: true });
          }
        } else if (e.tipe === 'teks') {
          const p = ubah(e.x, e.y);
          hasil.push({ ...e, lapis, x: p[0], y: p[1], tinggi: e.tinggi * (Math.abs(sx) + Math.abs(sy)) / 2, putar: e.putar + num(ambil(ps, 50), 0) });
        } else if (e.tipe === 'titik') {
          const p = ubah(e.x, e.y);
          hasil.push({ ...e, lapis, x: p[0], y: p[1] });
        }
      }
      return hasil;
    }
    default:
      return null;
  }
}

export function parseDxf(teks) {
  const ps = pasanganDxf(teks);
  let seksi = '';
  let satuan = 0;
  let satuanKetemu = false;
  const entitas = [];
  const jumlah = {};
  const tidakDigambar = {};
  const lapisSet = new Set();
  const blok = {};
  let blokAktif = null;
  let polylineAktif = null;
  // RED-11: batas total entitas hasil ekspansi INSERT (blok N entitas x
  // M INSERT = N*M tanpa batas — file 58 KB terbukti jadi 1 juta
  // entitas). 200.000 sejalan dengan BATAS_CEK_TERTUTUP di STL; file
  // yang melewati batas ditolak dengan pesan jujur, bukan dipotong diam.
  const MAKS_ENTITAS_DXF = 200000;

  let i = 0;
  function catat(e) {
    if (!e) return;
    const daftar = Array.isArray(e) ? e : [e];
    for (const g of daftar) {
      if (entitas.length >= MAKS_ENTITAS_DXF) throw new Error('File DXF ini punya terlalu banyak entitas (lebih dari 200.000) setelah blok dibuka.');
      entitas.push(g);
      lapisSet.add(g.lapis);
      jumlah[g.tipe] = (jumlah[g.tipe] || 0) + 1;
    }
  }
  function catatBlok(e) {
    if (!e || !blokAktif) return;
    const daftar = Array.isArray(e) ? e : [e];
    for (const g of daftar) blok[blokAktif].push(g);
  }

  while (i < ps.length) {
    const [kode, nilai] = ps[i];
    if (kode === 0 && nilai === 'SECTION') {
      const nama = (ps[i + 1] && ps[i + 1][0] === 2) ? ps[i + 1][1] : '';
      seksi = nama;
      i += 2;
      continue;
    }
    if (kode === 0 && nilai === 'ENDSEC') { seksi = ''; i++; continue; }
    if (seksi === 'HEADER') {
      if (kode === 9 && nilai === '$INSUNITS') {
        // Nilai ada di pasangan 70 berikutnya.
        for (let j = i + 1; j < Math.min(i + 6, ps.length); j++) {
          if (ps[j][0] === 70) { satuan = parseInt(ps[j][1], 10) || 0; satuanKetemu = true; break; }
          if (ps[j][0] === 9) break;
        }
      }
      i++;
      continue;
    }
    if (seksi === 'BLOCKS' || seksi === 'ENTITIES') {
      if (kode !== 0) { i++; continue; }
      const jenis = nilai;
      const awal = i + 1;
      let akhir = awal;
      while (akhir < ps.length && ps[akhir][0] !== 0) akhir++;
      const isi = ps.slice(awal, akhir);
      i = akhir;
      if (jenis === 'BLOCK') {
        blokAktif = ambil(isi, 2, '');
        if (blokAktif && !blok[blokAktif]) blok[blokAktif] = [];
        continue;
      }
      if (jenis === 'ENDBLK') { blokAktif = null; continue; }
      if (jenis === 'POLYLINE') {
        polylineAktif = { ps: isi, titik: [], bulge: [] };
        continue;
      }
      if (jenis === 'VERTEX' && polylineAktif) {
        polylineAktif.titik.push([num(ambil(isi, 10)), num(ambil(isi, 20))]);
        polylineAktif.bulge.push(num(ambil(isi, 42), 0));
        continue;
      }
      if (jenis === 'SEQEND' && polylineAktif) {
        const p = polylineAktif;
        polylineAktif = null;
        const lapis = ambil(p.ps, 8, '0');
        const warna = warnaDari(p.ps.some(([k]) => k === 62) ? parseInt(ambil(p.ps, 62, '7'), 10) : null);
        const tutup = (parseInt(ambil(p.ps, 70, '0'), 10) & 1) === 1;
        const gabung = p.ps.concat(p.bulge.map((b) => [42, String(b)]));
        const e = polyDariTitik(gabung, p.titik, tutup, lapis, warna);
        if (seksi === 'BLOCKS') catatBlok(e); else catat(e);
        continue;
      }
      if (jenis === 'VERTEX' || jenis === 'SEQEND') continue;
      const dikenal = ['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'ELLIPSE', 'SPLINE', 'POINT', 'TEXT', 'MTEXT', 'SOLID', 'INSERT'].includes(jenis);
      if (!dikenal) {
        tidakDigambar[jenis] = (tidakDigambar[jenis] || 0) + 1;
        continue;
      }
      const e = tafsirEntitas(jenis, isi, blok, seksi === 'BLOCKS');
      if (e == null) { tidakDigambar[jenis] = (tidakDigambar[jenis] || 0) + 1; continue; }
      if (seksi === 'BLOCKS') catatBlok(e); else catat(e);
      continue;
    }
    i++;
  }

  let bbox = null;
  function serap(x, y) {
    if (!isFinite(x) || !isFinite(y)) return;
    if (!bbox) bbox = { minX: x, minY: y, maxX: x, maxY: y };
    else {
      bbox.minX = Math.min(bbox.minX, x); bbox.minY = Math.min(bbox.minY, y);
      bbox.maxX = Math.max(bbox.maxX, x); bbox.maxY = Math.max(bbox.maxY, y);
    }
  }
  for (const e of entitas) {
    if (e.tipe === 'garis') { serap(e.x1, e.y1); serap(e.x2, e.y2); }
    else if (e.tipe === 'poly' || e.tipe === 'isi') e.titik.forEach(([x, y]) => serap(x, y));
    else if (e.tipe === 'lingkaran') { serap(e.cx - e.r, e.cy - e.r); serap(e.cx + e.r, e.cy + e.r); }
    else if (e.tipe === 'titik' || e.tipe === 'teks') serap(e.x, e.y);
  }
  return {
    entitas,
    jumlah,
    tidakDigambar,
    lapis: Array.from(lapisSet).sort(),
    bbox,
    satuan: satuanKetemu ? satuan : null,
    satuanLabel: SATUAN_DXF[satuan] || 'tanpa satuan',
  };
}

export function dxfKeSvg(parsed, opts) {
  const o = opts || {};
  const { entitas, bbox } = parsed;
  if (!entitas.length || !bbox) return null;
  const lebar = bbox.maxX - bbox.minX || 1;
  const tinggi = bbox.maxY - bbox.minY || 1;
  const pad = Math.max(lebar, tinggi) * 0.03 + 0.001;
  const minX = bbox.minX - pad;
  const w = lebar + pad * 2, h = tinggi + pad * 2;
  const gores = Math.max(Math.max(lebar, tinggi) * 0.002, 0.05);
  const fx = (x) => utils.r6(x - minX);
  const fy = (y) => utils.r6((bbox.maxY + pad) - y);
  let isi = '';
  for (const e of entitas) {
    const c = e.warna || '#111111';
    if (e.tipe === 'garis') {
      isi += '<line x1="' + fx(e.x1) + '" y1="' + fy(e.y1) + '" x2="' + fx(e.x2) + '" y2="' + fy(e.y2) + '" stroke="' + c + '" stroke-width="' + utils.r6(gores) + '"/>';
    } else if (e.tipe === 'poly') {
      const pts = e.titik.map(([x, y]) => fx(x) + ',' + fy(y)).join(' ');
      isi += e.tutup
        ? '<polygon points="' + pts + '" fill="none" stroke="' + c + '" stroke-width="' + utils.r6(gores) + '" stroke-linejoin="round"/>'
        : '<polyline points="' + pts + '" fill="none" stroke="' + c + '" stroke-width="' + utils.r6(gores) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (e.tipe === 'isi') {
      const pts = e.titik.map(([x, y]) => fx(x) + ',' + fy(y)).join(' ');
      isi += '<polygon points="' + pts + '" fill="' + c + '" stroke="none"/>';
    } else if (e.tipe === 'lingkaran') {
      isi += '<circle cx="' + fx(e.cx) + '" cy="' + fy(e.cy) + '" r="' + utils.r6(e.r) + '" fill="none" stroke="' + c + '" stroke-width="' + utils.r6(gores) + '"/>';
    } else if (e.tipe === 'titik') {
      isi += '<circle cx="' + fx(e.x) + '" cy="' + fy(e.y) + '" r="' + utils.r6(gores * 1.5) + '" fill="' + c + '"/>';
    } else if (e.tipe === 'teks') {
      const putar = e.putar ? ' transform="rotate(' + utils.r6(-e.putar) + ' ' + fx(e.x) + ' ' + fy(e.y) + ')"' : '';
      isi += '<text x="' + fx(e.x) + '" y="' + fy(e.y) + '" font-size="' + utils.r6(e.tinggi) + '" fill="' + c + '" font-family="sans-serif"' + putar + '>' + T.esc(e.isi) + '</text>';
    }
  }
  const judul = o.judul ? '<title>' + T.esc(o.judul) + '</title>' : '';
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(w * 10) / 10 + '" height="' + Math.round(h * 10) / 10 + '" viewBox="0 0 ' + utils.r6(w) + ' ' + utils.r6(h) + '">' + judul + isi + '</svg>';
}
