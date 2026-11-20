import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "gzip-gunzip-file", "name": "Gzip/Gunzip File", "cat": "converter", "icon": "🧊", "desc": "Kecilkan file jadi .gz, atau buka file .gz.", "keywords": "gzip,gunzip,gz,kompres,buka,kecilkan", "since": "6.17.0"};

// pako dipakai sebagai cadangan bila CompressionStream tidak tersedia.
// Hash SRI ada di peta SRI_HASH core.js (terverifikasi dari 3 sumber).
const PAKO_CDNS = [
  'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js',
  'https://unpkg.com/pako@2.1.0/dist/pako.min.js',
];

async function muatPako() {
  // Loader kanonis: utils.loadLibOnce (core.js).
  return utils.loadLibOnce(PAKO_CDNS, () => window.pako && typeof window.pako.gzip === 'function');
}

// Kompres dengan alat bawaan browser; cadangan pako bila tidak tersedia.
export async function gzipBytes(data) {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const blob = new Blob([data]);
      const gz = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();
      return new Uint8Array(await gz.arrayBuffer());
    } catch (e) { /* jatuh ke pako */ }
  }
  const ok = await muatPako();
  if (!ok) throw new Error('Alat kompres tidak bisa dimuat. Cek koneksi lalu coba lagi.');
  return window.pako.gzip(data, { level: 6 });
}

// Buka .gz dengan alat bawaan browser; cadangan pako bila tidak tersedia.
export async function gunzipBytes(data) {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const blob = new Blob([data]);
      const out = await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).blob();
      return new Uint8Array(await out.arrayBuffer());
    } catch (e) { /* jatuh ke pako */ }
  }
  const ok = await muatPako();
  if (!ok) throw new Error('Alat buka .gz tidak bisa dimuat. Cek koneksi lalu coba lagi.');
  return window.pako.ungzip(data);
}

export function render(root) {
  const tabKompres = T.btn('Kecilkan jadi .gz', null); tabKompres.classList.add('primary');
  const tabBuka = T.btn('Buka file .gz', null);
  const tabs = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
  tabs.appendChild(tabKompres); tabs.appendChild(tabBuka);

  /* ---- panel kompres ---- */
  const panelKompres = T.el('<div></div>');
  const fiKompres = T.input('file');
  const boxKompres = T.out();
  let fileKompres = null;
  let busyK = false;
  fiKompres.addEventListener('change', () => {
    fileKompres = fiKompres.files && fiKompres.files[0] ? fiKompres.files[0] : null;
    T.hide(boxKompres);
    if (fileKompres) T.show(boxKompres, kv('File', T.esc(fileKompres.name)) + kv('Ukuran', fmtBytes(fileKompres.size)));
  });
  const goKompres = T.btn('Kecilkan file', async () => {
    if (busyK) return;
    if (!fileKompres) { T.show(boxKompres, errBox('Pilih dulu file yang mau dikecilkan.')); return; }
    busyK = true;
    goKompres.disabled = true;
    T.show(boxKompres, '<span class="dim">Mengecilkan file…</span>');
    try {
      const data = new Uint8Array(await fileKompres.arrayBuffer());
      const gz = await gzipBytes(data);
      const blob = new Blob([gz], { type: 'application/gzip' });
      T.dl(fileKompres.name + '.gz', blob, 'application/gzip');
      T.show(boxKompres, '<span class="ok">Selesai. File .gz terunduh.</span>' +
        kv('Ukuran awal', fmtBytes(fileKompres.size)) +
        kv('Ukuran hasil', fmtBytes(blob.size)) +
        (blob.size >= fileKompres.size
          ? '<p class="hint" style="margin-top:8px">Hasilnya tidak lebih kecil. File yang sudah padat seperti foto, video, dan ZIP memang sulit dikecilkan lagi.</p>'
          : kv('Berkurang', fmtBytes(fileKompres.size - blob.size))));
      T.toast('File .gz terunduh');
    } catch (e) {
      T.show(boxKompres, errBox(e && e.message ? e.message : 'File tidak bisa dikecilkan. Coba lagi.'));
    } finally {
      busyK = false;
      goKompres.disabled = false;
    }
  }, true);
  panelKompres.appendChild(T.field('Pilih file', fiKompres));
  panelKompres.appendChild(T.row(goKompres));
  panelKompres.appendChild(boxKompres);

  /* ---- panel buka ---- */
  const panelBuka = T.el('<div></div>');
  panelBuka.hidden = true;
  const fiBuka = T.input('file');
  fiBuka.accept = '.gz,application/gzip';
  const boxBuka = T.out();
  let fileBuka = null;
  let busyB = false;
  fiBuka.addEventListener('change', () => {
    fileBuka = fiBuka.files && fiBuka.files[0] ? fiBuka.files[0] : null;
    T.hide(boxBuka);
    if (fileBuka) T.show(boxBuka, kv('File', T.esc(fileBuka.name)) + kv('Ukuran', fmtBytes(fileBuka.size)));
  });
  const goBuka = T.btn('Buka file .gz', async () => {
    if (busyB) return;
    if (!fileBuka) { T.show(boxBuka, errBox('Pilih dulu file .gz yang mau dibuka.')); return; }
    busyB = true;
    goBuka.disabled = true;
    T.show(boxBuka, '<span class="dim">Membuka file…</span>');
    try {
      const data = new Uint8Array(await fileBuka.arrayBuffer());
      if (data.length < 2 || data[0] !== 0x1f || data[1] !== 0x8b) {
        T.show(boxBuka, errBox('File ini bukan .gz yang benar. Cek lagi filenya.'));
        return;
      }
      const out = await gunzipBytes(data);
      const nama = /\.gz$/i.test(fileBuka.name) ? fileBuka.name.replace(/\.gz$/i, '') : fileBuka.name + '-hasil';
      const blob = new Blob([out], { type: 'application/octet-stream' });
      T.dl(nama, blob, 'application/octet-stream');
      T.show(boxBuka, '<span class="ok">Selesai. Isi file terunduh.</span>' +
        kv('Ukuran .gz', fmtBytes(fileBuka.size)) +
        kv('Ukuran isi', fmtBytes(blob.size)));
      T.toast('Isi file terunduh');
    } catch (e) {
      T.show(boxBuka, errBox('File .gz ini rusak atau tidak lengkap, jadi tidak bisa dibuka.'));
    } finally {
      busyB = false;
      goBuka.disabled = false;
    }
  }, true);
  panelBuka.appendChild(T.field('Pilih file .gz', fiBuka));
  panelBuka.appendChild(T.row(goBuka));
  panelBuka.appendChild(boxBuka);

  tabKompres.addEventListener('click', () => {
    panelKompres.hidden = false; panelBuka.hidden = true;
    tabKompres.classList.add('primary'); tabBuka.classList.remove('primary');
  });
  tabBuka.addEventListener('click', () => {
    panelKompres.hidden = true; panelBuka.hidden = false;
    tabBuka.classList.add('primary'); tabKompres.classList.remove('primary');
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Kecilkan satu file supaya gampang dikirim, atau buka file .gz yang kamu terima. Untuk menggabung banyak file jadi satu arsip, pakai tool Arsip TAR/7Z/RAR, tab Buat arsip.</p>'));
  root.appendChild(tabs);
  root.appendChild(panelKompres);
  root.appendChild(panelBuka);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
