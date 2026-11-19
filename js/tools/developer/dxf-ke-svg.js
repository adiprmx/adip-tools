import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Ubah gambar CAD format DXF jadi file vektor SVG. Parser DXF ditulis
// sendiri (tanpa pustaka): LINE, LWPOLYLINE/POLYLINE (termasuk lengkung
// bulge), CIRCLE, ARC, ELLIPSE, SPLINE (lewat titik fit/kontrol),
// POINT, TEXT/MTEXT, SOLID, dan INSERT (referensi blok). Entitas lain
// (DIMENSION, HATCH, dsb.) dihitung dan dilaporkan, tidak digambar.
// Parser yang sama dipakai kembar di lihat-file-dxf.js (pola repo:
// tiap tool mandiri; kandidat konsolidasi C1G4).

export const meta = { id: 'dxf-ke-svg', name: 'DXF ke SVG', cat: 'developer', icon: '📐', desc: 'Ubah gambar CAD .dxf jadi file vektor .svg yang bisa dibuka di browser atau editor gambar.', keywords: 'dxf,svg,cad,vektor,autocad,gambar teknik,konversi', since: '6.19.0' };

// Parser DXF + DXF ke SVG tinggal di modul bersama js/dxf.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari dxf-ke-svg.js + lihat-file-dxf.js).
import { parseDxf, dxfKeSvg } from '../../dxf.js';
export { WARNA_ACI, SATUAN_DXF, pasanganDxf, parseDxf, dxfKeSvg } from '../../dxf.js';

const NAMA_JUMLAH = { garis: 'garis', poly: 'garis banyak', lingkaran: 'lingkaran', teks: 'teks', titik: 'titik', isi: 'bidang isi' };

export function render(root) {
  root.appendChild(T.el('<p class="hint">Ubah gambar CAD .dxf jadi SVG. ' + T.esc(LOCAL_NOTE) + ' Yang digambar: garis, polyline, lingkaran, busur, elips, spline, titik, teks, dan blok. Ukuran dan dimensi (DIMENSION) tidak ikut digambar.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.dxf';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');
  const pratinjauEl = T.el('<div></div>');
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  let svgTerakhir = '', namaDasar = 'gambar';

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    infoEl.innerHTML = ''; pratinjauEl.innerHTML = ''; aksiEl.innerHTML = '';
    svgTerakhir = '';
    try {
      const teks = await f.text();
      const parsed = parseDxf(teks);
      namaDasar = f.name.replace(/\.dxf$/i, '') || 'gambar';
      if (!parsed.entitas.length) {
        statusEl.textContent = '';
        infoEl.innerHTML = '<p style="color:var(--err)">Tidak ada gambar yang bisa diubah dari file ini' +
          (Object.keys(parsed.tidakDigambar).length ? ' (entitas ' + T.esc(Object.keys(parsed.tidakDigambar).join(', ')) + ' tidak didukung)' : '') + '.</p>';
        return;
      }
      const svg = dxfKeSvg(parsed, { judul: f.name });
      svgTerakhir = svg;
      statusEl.textContent = '';
      const rincian = Object.entries(parsed.jumlah).map(([k, v]) => (NAMA_JUMLAH[k] || k) + ' ' + T.fmt(v)).join(', ');
      const lewati = Object.entries(parsed.tidakDigambar).map(([k, v]) => k + ' (' + v + ')').join(', ');
      infoEl.innerHTML = '<div class="card">' +
        kv('File', T.esc(f.name) + ' (' + fmtBytes(f.size) + ')') +
        kv('Entitas digambar', T.fmt(parsed.entitas.length) + ' (' + T.esc(rincian) + ')') +
        kv('Lapisan', parsed.lapis.length ? parsed.lapis.map(T.esc).join(', ') : '-') +
        kv('Ukuran gambar', utils.r6(parsed.bbox.maxX - parsed.bbox.minX) + ' × ' + utils.r6(parsed.bbox.maxY - parsed.bbox.minY) + ' ' + T.esc(parsed.satuanLabel)) +
        kv('Ukuran SVG', fmtBytes(new Blob([svg]).size)) +
        (lewati ? kv('Tidak digambar', T.esc(lewati)) : '') +
        '</div>';
      const wadah = T.el('<div style="background:#f5f5f5;border-radius:10px;padding:8px;margin-top:10px;overflow:auto"></div>');
      wadah.innerHTML = svg.replace(/^<\?xml[^?]*\?>\n/, '');
      const svgEl = wadah.querySelector('svg');
      if (svgEl) { svgEl.style.width = '100%'; svgEl.style.height = 'auto'; svgEl.style.display = 'block'; }
      pratinjauEl.appendChild(wadah);
      aksiEl.append(
        T.btn('Unduh SVG', () => T.dl(namaDasar + '.svg', svgTerakhir, 'image/svg+xml'), true),
        T.btn('Salin SVG', () => { T.copy(svgTerakhir); T.toast('SVG disalin'); }),
      );
    } catch (e) {
      statusEl.textContent = '';
      infoEl.innerHTML = '<p style="color:var(--err)">File tidak bisa dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  fileI.addEventListener('change', bukaFile);
  root.append(
    T.field('Pilih file DXF', fileI, 'Contoh: denah.dxf dari AutoCAD, LibreCAD, atau QCAD.'),
    statusEl,
    infoEl,
    pratinjauEl,
    aksiEl,
  );
}
