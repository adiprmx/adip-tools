import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Buka dan lihat gambar CAD format DXF langsung di browser: gambar
// ditampilkan sebagai SVG, lengkap dengan jumlah entitas per jenis,
// daftar lapisan, dan ukuran gambar. Parser DXF di sini kembar dengan
// dxf-ke-svg.js (pola repo: tiap tool mandiri; kandidat konsolidasi
// C1G4). Entitas yang tidak didukung dihitung dan dilaporkan, bukan
// disembunyikan.

export const meta = { id: 'lihat-file-dxf', name: 'Lihat File DXF', cat: 'developer', icon: '👁️', desc: 'Buka file gambar CAD .dxf dan lihat isinya di browser, lengkap dengan jumlah entitas dan daftar lapisannya.', keywords: 'dxf,cad,lihat,autocad,gambar teknik,vektor,denah', since: '6.19.0' };

// Parser DXF + DXF ke SVG tinggal di modul bersama js/dxf.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari dxf-ke-svg.js + lihat-file-dxf.js).
import { parseDxf, dxfKeSvg } from '../../dxf.js';
export { WARNA_ACI, SATUAN_DXF, pasanganDxf, parseDxf, dxfKeSvg } from '../../dxf.js';




const NAMA_JUMLAH = { garis: 'garis', poly: 'garis banyak', lingkaran: 'lingkaran', teks: 'teks', titik: 'titik', isi: 'bidang isi' };

export function render(root) {
  root.appendChild(T.el('<p class="hint">Buka file gambar CAD .dxf dan lihat isinya. ' + T.esc(LOCAL_NOTE) + ' Yang ditampilkan: garis, polyline, lingkaran, busur, elips, spline, titik, teks, dan blok.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.dxf';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');
  const gambarEl = T.el('<div></div>');
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  let svgTerakhir = '', namaDasar = 'gambar';

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    infoEl.innerHTML = ''; gambarEl.innerHTML = ''; aksiEl.innerHTML = '';
    svgTerakhir = '';
    try {
      const teks = await f.text();
      const parsed = parseDxf(teks);
      namaDasar = f.name.replace(/\.dxf$/i, '') || 'gambar';
      if (!parsed.entitas.length) {
        statusEl.textContent = '';
        infoEl.innerHTML = '<p style="color:var(--err)">Tidak ada gambar yang bisa ditampilkan dari file ini' +
          (Object.keys(parsed.tidakDigambar).length ? ' (entitas ' + T.esc(Object.keys(parsed.tidakDigambar).join(', ')) + ' tidak didukung)' : '') + '.</p>';
        return;
      }
      const svg = dxfKeSvg(parsed, { judul: f.name });
      svgTerakhir = svg;
      statusEl.textContent = '';
      const perLapis = {};
      parsed.entitas.forEach((e) => { perLapis[e.lapis] = (perLapis[e.lapis] || 0) + 1; });
      const rincian = Object.entries(parsed.jumlah).map(([k, v]) => (NAMA_JUMLAH[k] || k) + ' ' + T.fmt(v)).join(', ');
      const lewati = Object.entries(parsed.tidakDigambar).map(([k, v]) => k + ' (' + v + ')').join(', ');
      infoEl.innerHTML = '<div class="card">' +
        kv('File', T.esc(f.name) + ' (' + fmtBytes(f.size) + ')') +
        kv('Entitas', T.fmt(parsed.entitas.length) + ' (' + T.esc(rincian) + ')') +
        kv('Lapisan', parsed.lapis.map((l) => T.esc(l) + ' (' + perLapis[l] + ')').join(', ')) +
        kv('Ukuran gambar', utils.r6(parsed.bbox.maxX - parsed.bbox.minX) + ' × ' + utils.r6(parsed.bbox.maxY - parsed.bbox.minY) + ' ' + T.esc(parsed.satuanLabel)) +
        (lewati ? kv('Tidak ditampilkan', T.esc(lewati)) : '') +
        '</div>';
      const wadah = T.el('<div style="background:#f5f5f5;border-radius:10px;padding:8px;margin-top:10px;overflow:auto"></div>');
      wadah.innerHTML = svg.replace(/^<\?xml[^?]*\?>\n/, '');
      const svgEl = wadah.querySelector('svg');
      if (svgEl) { svgEl.style.width = '100%'; svgEl.style.height = 'auto'; svgEl.style.display = 'block'; }
      gambarEl.appendChild(wadah);
      aksiEl.append(T.btn('Unduh sebagai SVG', () => T.dl(namaDasar + '.svg', svgTerakhir, 'image/svg+xml')));
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
    gambarEl,
    aksiEl,
  );
}
