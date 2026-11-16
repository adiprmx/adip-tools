import { h as T, kv, fileInput, fmtBytes, errBox } from '../../core.js?v=6.13.0';

export const meta = {"id":"zip-file","name":"Buat & Buka ZIP","cat":"converter","icon":"🗜️","desc":"Gabung banyak file jadi satu ZIP, atau buka isi file ZIP.","keywords":"zip,arsip,kompres,ekstrak,file,buka","since":"6.11.0"};

/* ZIP via JSZip 3.10.1 (CDN, pin versi). Buat: banyak file jadi satu ZIP.
   Buka: daftar isi + unduh per file + lihat isi file teks kecil. */
const JSZIP_CDNS = [
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];
const TEXT_EXT = ['txt', 'md', 'json', 'csv', 'html', 'htm', 'css', 'js', 'xml', 'log', 'srt', 'vtt'];
const MAX_PREVIEW = 100 * 1024;

export function render(root) {
  let libOk = null, libLoading = false;
  const ensureLib = () => {
    if (libOk !== null) return Promise.resolve(libOk);
    if (libLoading) return new Promise((res) => { const t = setInterval(() => { if (libOk !== null) { clearInterval(t); res(libOk); } }, 300); });
    libLoading = true;
    return (async () => {
      for (const u of JSZIP_CDNS) {
        const ok = await T.loadScript(u);
        if (ok && typeof window.JSZip === 'function') { libOk = true; return true; }
      }
      libOk = false;
      return false;
    })();
  };

  const tabBuat = T.btn('Buat ZIP', null); tabBuat.classList.add('primary');
  const tabBuka = T.btn('Buka ZIP', null);
  const tabs = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
  tabs.appendChild(tabBuat); tabs.appendChild(tabBuka);

  /* ---- panel buat ---- */
  const panelBuat = T.el('<div></div>');
  const fiBuat = fileInput('*/*');
  fiBuat.multiple = true;
  const namaZip = T.input('text', 'arsip', 'arsip');
  const listBuat = T.out();
  const boxBuat = T.out();
  let filesBuat = [];

  const refreshBuat = () => {
    if (!filesBuat.length) {
      T.show(listBuat, '<p class="hint">Belum ada file. Pilih satu atau banyak file di atas.</p>');
      return;
    }
    const total = filesBuat.reduce((a, f) => a + f.size, 0);
    T.show(listBuat, '<p class="hint" style="margin-bottom:6px">' + filesBuat.length + ' file, total ' + fmtBytes(total) + ':</p>');
    filesBuat.forEach((f, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.name) + ' <span class="dim">(' + fmtBytes(f.size) + ')</span></span>'));
      const del = T.btn('Hapus', () => { filesBuat.splice(i, 1); refreshBuat(); });
      del.classList.add('small');
      row.appendChild(del);
      listBuat.appendChild(row);
    });
  };
  fiBuat.addEventListener('change', () => {
    filesBuat = filesBuat.concat(Array.from(fiBuat.files || []));
    fiBuat.value = '';
    refreshBuat();
  });

  const buatZip = async () => {
    if (!filesBuat.length) { T.show(boxBuat, errBox('Pilih file dulu.')); return; }
    T.show(boxBuat, '<span class="dim">Menyiapkan alat ZIP…</span>');
    const ok = await ensureLib();
    if (!ok) { T.show(boxBuat, errBox('Alat ZIP tidak bisa dimuat dari internet. Periksa koneksi, lalu coba lagi.')); return; }
    T.show(boxBuat, '<span class="dim">Menggabungkan ' + filesBuat.length + ' file…</span>');
    try {
      const zip = new window.JSZip();
      filesBuat.forEach((f) => zip.file(f.name, f));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const nama = (namaZip.value.trim() || 'arsip').replace(/[\\/:*?"<>|]/g, '-').replace(/\.zip$/i, '');
      T.dl(nama + '.zip', blob, 'application/zip');
      T.show(boxBuat, kv('File digabung', filesBuat.length + ' file') + kv('Ukuran ZIP', fmtBytes(blob.size)));
      T.toast('ZIP diunduh');
    } catch (e) {
      T.show(boxBuat, errBox('ZIP tidak bisa dibuat. Coba lagi.'));
    }
  };

  panelBuat.appendChild(T.field('Pilih file (boleh banyak)', fiBuat, 'File dipilih bertahap, semuanya masuk daftar di bawah.'));
  panelBuat.appendChild(listBuat);
  panelBuat.appendChild(T.field('Nama file ZIP', namaZip, 'Tanpa .zip, nanti ditambahkan otomatis.'));
  panelBuat.appendChild(T.row(T.btn('Buat & unduh ZIP', buatZip, true), T.btn('Kosongkan daftar', () => { filesBuat = []; refreshBuat(); })));
  panelBuat.appendChild(boxBuat);

  /* ---- panel buka ---- */
  const panelBuka = T.el('<div></div>');
  panelBuka.hidden = true;
  const fiBuka = fileInput('.zip,application/zip');
  const listBuka = T.out();
  const boxBuka = T.out();
  const prevBuka = T.out();
  let zipObj = null, zipName = '';

  fiBuka.addEventListener('change', async () => {
    const f = fiBuka.files && fiBuka.files[0];
    if (!f) return;
    T.show(boxBuka, '<span class="dim">Menyiapkan alat ZIP…</span>');
    T.hide(listBuka); T.hide(prevBuka);
    const ok = await ensureLib();
    if (!ok) { T.show(boxBuka, errBox('Alat ZIP tidak bisa dimuat dari internet. Periksa koneksi, lalu coba lagi.')); return; }
    T.show(boxBuka, '<span class="dim">Membaca isi ZIP…</span>');
    try {
      zipObj = await new window.JSZip().loadAsync(f);
      zipName = f.name.replace(/\.zip$/i, '');
    } catch (e) {
      zipObj = null;
      T.show(boxBuka, errBox('File ini bukan ZIP yang benar, atau filenya rusak.'));
      return;
    }
    const names = Object.keys(zipObj.files).filter((n) => !zipObj.files[n].dir);
    if (!names.length) {
      T.show(boxBuka, errBox('ZIP ini kosong atau hanya berisi folder.'));
      return;
    }
    T.show(boxBuka, kv('Isi ZIP', names.length + ' file'));
    T.show(listBuka, '<p class="hint" style="margin-bottom:6px">Ketuk Unduh di tiap file untuk menyimpannya:</p>');
    names.forEach((n) => {
      const ext = (n.split('.').pop() || '').toLowerCase();
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(n) + '</span>'));
      const acts = T.el('<div style="display:flex;gap:6px;flex-shrink:0"></div>');
      if (TEXT_EXT.includes(ext)) {
        const lihat = T.btn('Lihat', async () => {
          try {
            const entry = zipObj.files[n];
            const s = await entry.async('string');
            if (s.length > MAX_PREVIEW) {
              T.show(prevBuka, '<p class="hint">File ' + T.esc(n) + ' terlalu besar untuk pratinjau (lebih dari ' + fmtBytes(MAX_PREVIEW) + '). Unduh saja untuk membacanya.</p>');
              return;
            }
            T.show(prevBuka, '<p class="hint">Isi ' + T.esc(n) + ':</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:300px;overflow:auto"></pre>');
            prevBuka.querySelector('pre').textContent = s.slice(0, 3000) + (s.length > 3000 ? '\n…(dipotong, unduh file untuk isi lengkap)' : '');
            T.scrollToPreview(prevBuka);
          } catch (e) { T.toast('File tidak bisa dibaca'); }
        });
        lihat.classList.add('small');
        acts.appendChild(lihat);
      }
      const dl = T.btn('Unduh', async () => {
        try {
          const blob = await zipObj.files[n].async('blob');
          T.dl(n.split('/').pop(), blob);
        } catch (e) { T.toast('File ini tidak bisa diunduh'); }
      });
      dl.classList.add('small');
      acts.appendChild(dl);
      row.appendChild(acts);
      listBuka.appendChild(row);
    });
  });

  panelBuka.appendChild(T.field('Pilih file .zip', fiBuka));
  panelBuka.appendChild(boxBuka);
  panelBuka.appendChild(listBuka);
  panelBuka.appendChild(prevBuka);

  tabBuat.addEventListener('click', () => {
    panelBuat.hidden = false; panelBuka.hidden = true;
    tabBuat.classList.add('primary'); tabBuka.classList.remove('primary');
  });
  tabBuka.addEventListener('click', () => {
    panelBuat.hidden = true; panelBuka.hidden = false;
    tabBuka.classList.add('primary'); tabBuat.classList.remove('primary');
  });

  root.appendChild(T.el('<p class="note">Diproses di browser, file tidak diunggah ke mana-mana. Alat ZIP dimuat sekali dari internet saat tombol ditekan.</p>'));
  root.appendChild(tabs);
  root.appendChild(panelBuat);
  root.appendChild(panelBuka);
  refreshBuat();
}
