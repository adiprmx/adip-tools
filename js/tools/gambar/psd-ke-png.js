import { h as T, fileInput, fmtBytes, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// PSD ke PNG: file Photoshop (.psd) jadi gambar PNG. Pembaca PSD-nya
// ag-psd (pustaka PSD murni JavaScript, dipakai banyak proyek web).
// Hasil gabungan semua layer bisa diunduh, begitu juga tiap layer
// satu per satu. Semua dibaca di browser, file tidak diunggah.
export const meta = {"id": "psd-ke-png", "name": "PSD ke PNG", "cat": "gambar", "icon": "🎨", "desc": "File Photoshop jadi gambar PNG. Unduh hasil gabungan atau tiap layernya.", "keywords": "psd,photoshop,png,layer,ubah psd", "since": "6.17.0", "online": true};

const AGPSD_ESM = 'https://esm.sh/ag-psd@34.2.1';
const AGPSD_JSD = 'https://cdn.jsdelivr.net/npm/ag-psd@34.2.1/dist-es/index.js';

// Kumpulkan layer beserta anak-anaknya jadi daftar datar (murni, tanpa DOM).
// Tiap item: {nama, lebar, tinggi, kanvas, tersembunyi}.
export function daftarLayer(node, keluar) {
  const hasil = keluar || [];
  const anak = (node && node.children) || [];
  for (const c of anak) {
    hasil.push({
      nama: c.name || 'Layer tanpa nama',
      lebar: c.width || 0,
      tinggi: c.height || 0,
      kanvas: c.canvas || null,
      tersembunyi: !!c.hidden,
    });
    if (c.children && c.children.length) daftarLayer(c, hasil);
  }
  return hasil;
}

export function render(root) {
  const fi = fileInput('.psd');
  const statusBox = T.out();
  const infoBox = T.out();
  const hasilBox = T.out();
  const layerBox = T.out();

  let agSiap = null;
  let namaFile = 'hasil';

  const muatAgPsd = () => {
    if (!agSiap) {
      agSiap = (async () => {
        let m = null;
        try {
          m = await import(/* @vite-ignore */ AGPSD_ESM);
        } catch (e) { m = null; }
        if (!m || typeof m.readPsd !== 'function') {
          try {
            m = await import(/* @vite-ignore */ AGPSD_JSD);
          } catch (e) { m = null; }
        }
        if (!m || typeof m.readPsd !== 'function') throw new Error('api ag-psd tidak lengkap');
        return m;
      })().catch((e) => { agSiap = null; throw e; });
    }
    return agSiap;
  };

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(infoBox); T.hide(hasilBox); T.hide(layerBox);
    namaFile = (f.name || 'hasil').replace(/\.[^.]*$/, '');
    T.show(statusBox, '<span class="dim">Memuat pembaca PSD… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatAgPsd();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembaca PSD gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>');
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca file PSD…</span>');
      const buf = await f.arrayBuffer();
      const psd = lib.readPsd(buf);
      if (!psd || !psd.width || !psd.height) throw new Error('psd tidak valid');
      const layers = daftarLayer(psd);
      const gabung = psd.canvas;
      if (!gabung) throw new Error('tidak ada gambar gabungan');
      const blob = await canvasToBlob(gabung, 'image/png');
      if (!blob) throw new Error('gagal membuat png');
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(infoBox, `<div class="kv"><span>Ukuran</span><b>${psd.width} × ${psd.height}</b></div><div class="kv"><span>Jumlah layer</span><b>${layers.length}</b></div><div class="kv"><span>Ukuran file PSD</span><b>${fmtBytes(f.size)}</b></div>`);
      T.show(hasilBox, '');
      const im = document.createElement('img');
      im.src = url; im.alt = 'Hasil gabungan PSD';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background-image:linear-gradient(45deg,#3a332c 25%,transparent 25%),linear-gradient(-45deg,#3a332c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a332c 75%),linear-gradient(-45deg,transparent 75%,#3a332c 75%);background-size:20px 20px;background-color:#221e19';
      hasilBox.appendChild(im);
      hasilBox.appendChild(T.el(`<p class="dim">PNG hasil gabungan semua layer, ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PNG Gabungan', () => { T.dl(`${namaFile}.png`, blob, 'image/png'); T.toast('Berhasil diunduh'); }, true));
      // Daftar layer dengan unduhan per layer.
      if (layers.length) {
        T.show(layerBox, '');
        layerBox.appendChild(T.el('<p style="font-weight:700;margin:14px 0 8px">Layer di dalam file ini</p>'));
        layers.forEach((ly, i) => {
          const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
          const nama = T.el(`<div style="word-break:break-word"><b>${T.esc(ly.nama)}</b><div class="dim" style="font-size:12px">${ly.lebar} × ${ly.tinggi}${ly.tersembunyi ? ' · tersembunyi' : ''}</div></div>`);
          baris.appendChild(nama);
          if (ly.kanvas && ly.lebar > 0 && ly.tinggi > 0) {
            const b = T.btn('Unduh PNG', async () => {
              const lb = await canvasToBlob(ly.kanvas, 'image/png');
              if (!lb) { T.toast('Gagal membuat PNG layer ini'); return; }
              const aman = ly.nama.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || ('layer-' + (i + 1));
              T.dl(`${namaFile}-${aman}.png`, lb, 'image/png');
              T.toast('Berhasil diunduh');
            });
            b.classList.add('small');
            baris.appendChild(b);
          } else {
            baris.appendChild(T.el('<span class="dim" style="font-size:12px">tidak ada gambar</span>'));
          }
          layerBox.appendChild(baris);
        });
      }
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">File ini bukan PSD yang bisa dibaca, atau rusak. Pastikan filenya .psd asli dari Photoshop.</div>');
    }
  });

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih file PSD', fi, 'File .psd dari Photoshop. Layer yang tersembunyi tetap tercantum di daftar.'));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(hasilBox);
  root.appendChild(layerBox);
}
