import { h as T, utils, errBox, kv } from '../../core.js?v=6.9.20';

export const meta = {"id": "ocrintel", "name": "OCR", "cat": "produktivitas", "icon": "🔠", "desc": "Ekstrak teks dari gambar 100% lokal — tanpa upload, tanpa server.", "keywords": "ocr,teks,gambar,scan,ekstrak,tesseract"};

const HIST_KEY = 'at-ocrintel-history-v1';
const MAX_MB = 8;
const TS_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

const getHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } };

function keywordsDari(teks) {
  const f = {};
  (teks.toLowerCase().match(/[a-zà-ÿ0-9]{4,}/g) || []).forEach((w) => { f[w] = (f[w] || 0) + 1; });
  return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function fmtUkuran(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}

// Kecilkan gambar raksasa biar OCR cepat (maks sisi 2000px)
function siapkanGambar(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maks = 2000;
      const sk = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * sk); c.height = Math.round(img.height * sk);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('File bukan gambar yang valid.')); };
    img.src = url;
  });
}

export function render(root) {
  let worker = null, teksHasil = '', kataHasil = [];
  let workerLang = null; // bahasa yang dipakai worker aktif (untuk deteksi ganti bahasa)
  let memproses = false;
  let pendingFile = null;   // file yang dipilih tapi BELUM di-scan (parity UX: tombol scan eksplisit)
  let previewUrl = null;

  const dz = T.el('<div style="border:1.5px dashed #ffffff30;border-radius:12px;padding:26px 14px;text-align:center;cursor:pointer;background:#161311">' +
    '<div style="font-size:28px">🖼️</div><div style="font-size:13px;margin-top:6px"><b>Ketuk untuk pilih gambar</b></div>' +
    '<div class="dim" style="font-size:12px;margin-top:4px">JPG/PNG/GIF/BMP/WEBP · maks ' + MAX_MB + ' MB · atau tempel (paste) & seret file</div></div>');
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = 'image/jpeg,image/png,image/gif,image/bmp,image/webp';
  fileInp.hidden = true;
  const langSel = T.select([['eng+ind', '🌐 Auto (Indonesia + Inggris)'], ['ind', '🇮🇩 Indonesia'], ['eng', '🇬🇧 Inggris']], 'eng+ind');
  const previewBox = T.out(); // pratinjau file sebelum scan
  const scanBtn = T.el('<button class="btn primary" disabled style="width:100%;padding:13px;font-size:15px;margin-top:10px;opacity:.45;cursor:not-allowed">🔍 Pilih gambar dulu untuk mulai scan</button>');
  const out = T.out();
  const hasilBox = T.out();
  const histBox = T.out();

  dz.onclick = () => fileInp.click();
  dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = '#ff7a59'; };
  dz.ondragleave = () => { dz.style.borderColor = '#ffffff30'; };
  dz.ondrop = (e) => { e.preventDefault(); dz.style.borderColor = '#ffffff30'; if (e.dataTransfer.files[0]) pilihFile(e.dataTransfer.files[0]); };
  document.addEventListener('paste', onPaste);
  fileInp.onchange = () => { if (fileInp.files[0]) pilihFile(fileInp.files[0]); fileInp.value = ''; };
  function onPaste(e) {
    const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
    if (f && root.isConnected) pilihFile(f);
  }

  // --- Alur eksplisit: pilih file → pratinjau → tekan "Mulai Scan" ---
  const pilihFile = (file) => {
    if (!/^image\//.test(file.type)) { T.show(out, errBox('Format tidak didukung. Pakai JPG/PNG/GIF/BMP/WEBP.')); return; }
    if (file.size > MAX_MB * 1024 * 1024) { T.show(out, errBox('File melebihi ' + MAX_MB + ' MB. Kompres dahulu lalu coba lagi.')); return; }
    hapusFile(true); // ganti file lama bila ada (tanpa toast)
    pendingFile = file;
    previewUrl = URL.createObjectURL(file);
    T.show(previewBox,
      '<div style="display:flex;gap:10px;align-items:center;border:1px solid #ffffff20;border-radius:12px;padding:10px;background:#161311;margin-top:10px">' +
      '<img id="ocr-thumb" src="' + previewUrl + '" alt="pratinjau" style="width:58px;height:58px;object-fit:cover;border-radius:8px;border:1px solid #ffffff14;flex-shrink:0">' +
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(file.name) + '</div>' +
      '<div class="dim" style="font-size:12px;margin-top:2px">' + fmtUkuran(file.size) + ' · siap di-scan</div></div>' +
      '<button class="btn" id="ocr-hapus" style="font-size:12.5px">🗑️ Hapus</button></div>');
    previewBox.querySelector('#ocr-hapus').onclick = () => hapusFile();
    scanBtn.disabled = false;
    scanBtn.style.opacity = '1';
    scanBtn.style.cursor = 'pointer';
    scanBtn.textContent = '🔍 Mulai Scan';
    T.hide(hasilBox);
    T.hide(out);
  };

  const hapusFile = (diam) => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    pendingFile = null;
    T.hide(previewBox);
    scanBtn.disabled = true;
    scanBtn.style.opacity = '.45';
    scanBtn.style.cursor = 'not-allowed';
    scanBtn.textContent = '🔍 Pilih gambar dulu untuk mulai scan';
    if (!diam) T.toast('File dihapus — pilih gambar lain bila mau.');
  };

  const pastWorker = async (onProg) => {
    const lang = langSel.value;
    if (worker && workerLang !== lang) {
      // Pilihan bahasa berubah setelah worker dibuat → buat ulang worker.
      // (Bug lama: worker lama dipakai terus sehingga ganti bahasa tidak berpengaruh.)
      try { await worker.terminate(); } catch (e) {}
      worker = null;
    }
    if (worker) return worker;
    if (!window.Tesseract) {
      T.show(out, '<p class="dim">Mengunduh engine OCR (~3 MB, sekali saja)…</p>');
      await T.loadScript(TS_CDN);
      if (!window.Tesseract) throw new Error('Engine OCR gagal dimuat.');
    }
    worker = await window.Tesseract.createWorker(lang, window.Tesseract.OEM.LSTM, {
      logger: (m) => { if (m.status === 'recognizing text' && onProg) onProg(m.progress); },
    });
    workerLang = lang;
    return worker;
  };

  scanBtn.onclick = () => {
    if (memproses) { T.toast('Masih memproses…'); return; }
    if (!pendingFile) { T.toast('Pilih gambar dulu.'); return; }
    proses(pendingFile);
  };

  const proses = async (file) => {
    memproses = true;
    scanBtn.disabled = true;
    scanBtn.style.opacity = '.6';
    scanBtn.textContent = '⏳ Memproses…';
    T.hide(hasilBox);
    const mulai = Date.now();
    try {
      const canvas = await siapkanGambar(file);
      T.show(out, '<p class="dim">Mengenali teks… <span id="ocr-p">0</span>%</p><div style="height:6px;background:#ffffff14;border-radius:4px;margin-top:6px"><div id="ocr-bar" style="height:100%;width:0;background:#ff7a59;border-radius:4px;transition:width .2s"></div></div>');
      const w = await pastWorker((p) => {
        const pe = out.querySelector('#ocr-p'), be = out.querySelector('#ocr-bar');
        if (pe) pe.textContent = Math.round(p * 100);
        if (be) be.style.width = (p * 100) + '%';
      });
      // worker sudah dibuat ulang bila bahasa berubah (lihat pastWorker)
      const { data } = await w.recognize(canvas);
      teksHasil = (data.text || '').trim();
      const detik = ((Date.now() - mulai) / 1000).toFixed(1);
      if (!teksHasil) { T.show(out, errBox('Tidak ada teks yang terbaca. Coba gambar yang lebih jelas/kontras.')); }
      else {
        kataHasil = teksHasil.split(/\s+/).filter(Boolean);
        tampilHasil(file.name, detik);
        const l = [{ nama: file.name, kata: kataHasil.length, kar: teksHasil.length, t: Date.now() }, ...getHist()].slice(0, 5);
        try { localStorage.setItem(HIST_KEY, JSON.stringify(l)); } catch (e) {}
        tampilHist();
      }
    } catch (e) {
      T.show(out, errBox('Gagal OCR: ' + e.message));
    }
    memproses = false;
    if (pendingFile) {
      scanBtn.disabled = false;
      scanBtn.style.opacity = '1';
      scanBtn.textContent = '🔍 Scan Ulang';
    } else hapusFile(true);
  };

  const tampilHasil = (nama, detik) => {
    T.hide(out);
    const kata = kataHasil.length, kar = teksHasil.length;
    const menitBaca = Math.max(1, Math.round(kata / 200));
    const kw = keywordsDari(teksHasil);
    T.show(hasilBox,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#161311;margin-top:10px">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
      kv('Bahasa', T.esc(langSel.selectedOptions[0].textContent)) +
      kv('Kata', '<b>' + kata + '</b>') + kv('Karakter', '<b>' + kar + '</b>') +
      kv('Waktu baca', '±' + menitBaca + ' mnt') + kv('Proses', detik + ' dtk') + '</div>' +
      '<div class="dim" style="font-size:12px;margin-bottom:4px">File: ' + T.esc(nama) + '</div>' +
      '<pre id="ocr-teks" style="white-space:pre-wrap;word-break:break-word;background:#0d0b09;border:1px solid #ffffff14;border-radius:8px;padding:12px;font-size:13px;line-height:1.7;max-height:300px;overflow:auto;margin:0">' + T.esc(teksHasil) + '</pre>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
      '<input id="ocr-cari" type="text" placeholder="Cari di hasil…" style="flex:1;min-width:120px" class="inp">' +
      '<span class="dim" id="ocr-nhasil" style="font-size:12px"></span></div>' +
      (kw.length ? '<div style="margin-top:10px"><b style="font-size:12.5px">🔑 Kata kunci:</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        kw.map(([w, n]) => '<button class="btn" data-kw="' + T.esc(w) + '" style="font-size:12px">' + T.esc(w) + ' ·' + n + '</button>').join('') + '</div></div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn primary" data-o="copy">📋 Salin Teks</button>' +
      '<button class="btn" data-o="txt">⬇️ Unduh TXT</button>' +
      '<button class="btn" data-o="json">⬇️ Unduh JSON</button></div>' +
      '<button class="btn" id="ocr-ulang" style="width:100%;margin-top:10px">🔄 Pindai dokumen lain</button>' +
      '<p class="dim" style="font-size:11.5px;margin-top:10px">🔒 100% lokal — gambarmu tidak diupload ke mana pun. Akurasi terbaik untuk teks cetak jelas; tulisan tangan kurang akurat.</p></div>');

    const pre = hasilBox.querySelector('#ocr-teks');
    const cariInp = hasilBox.querySelector('#ocr-cari');
    const nHasil = hasilBox.querySelector('#ocr-nhasil');
    const sorot = () => {
      const q = cariInp.value.trim();
      if (!q) { pre.innerHTML = T.esc(teksHasil); nHasil.textContent = ''; return; }
      const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      let n = 0;
      pre.innerHTML = T.esc(teksHasil).replace(rx, (m) => { n++; return n <= 200 ? '<mark style="background:#ff7a59;color:#000">' + m + '</mark>' : m; });
      nHasil.textContent = n ? n + ' hasil' : 'tidak ketemu';
    };
    cariInp.oninput = sorot;
    hasilBox.querySelectorAll('[data-kw]').forEach((b) => { b.onclick = () => { cariInp.value = b.getAttribute('data-kw'); sorot(); }; });
    hasilBox.querySelector('[data-o=copy]').onclick = () => T.copy(teksHasil);
    hasilBox.querySelector('[data-o=txt]').onclick = () => T.dl('ocr-' + Date.now() + '.txt', teksHasil, 'text/plain');
    hasilBox.querySelector('[data-o=json]').onclick = () => T.dl('ocr-' + Date.now() + '.json',
      JSON.stringify({ teks: teksHasil, kata, karakter: kar, keywords: kw.map(([w, n]) => ({ kata: w, muncul: n })) }, null, 2), 'application/json');
    hasilBox.querySelector('#ocr-ulang').onclick = () => { T.hide(hasilBox); hapusFile(true); window.scrollTo(0, 0); };
  };

  const tampilHist = () => {
    const l = getHist();
    if (!l.length) { T.hide(histBox); return; }
    T.show(histBox, '<div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px">' +
      '<p class="dim" style="font-size:12.5px;margin:0"><b>🕘 Terakhir diproses:</b></p>' +
      '<button class="btn" id="ocr-hapus-hist" style="font-size:12px">🗑️ Hapus riwayat</button></div>' +
      '<div style="display:grid;gap:6px">' +
      l.map((h) => '<div class="dim" style="font-size:12.5px;border:1px solid #ffffff12;border-radius:8px;padding:8px 10px">' +
        T.esc(h.nama) + ' · ' + h.kata + ' kata · ' + h.kar + ' karakter</div>').join('') + '</div>');
    histBox.querySelector('#ocr-hapus-hist').onclick = () => {
      try { localStorage.removeItem(HIST_KEY); } catch (e) {}
      T.hide(histBox);
      T.toast('Riwayat dihapus.');
    };
  };

  // lepas worker saat tool ditutup (hemat memori)
  const lepas = async () => { document.removeEventListener('paste', onPaste); if (worker) { try { await worker.terminate(); } catch (e) {} worker = null; workerLang = null; } };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Foto dokumen, struk, atau screenshot berisi teks? Ekstrak jadi teks yang bisa disalin — memakai Tesseract.js langsung di HP. Tanpa server, tanpa API key, file tidak keluar dari perangkat.</p>'));
  root.appendChild(dz);
  root.appendChild(fileInp);
  root.appendChild(previewBox);
  root.appendChild(scanBtn);
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin:8px 0 0">🔒 Privasi: OCR berjalan 100% lokal di perangkatmu — gambar tidak diupload ke server mana pun.</p>'));
  root.appendChild(T.field('Bahasa dokumen', langSel, 'Model bahasa diunduh sekali (~7 MB untuk Indonesia), lalu tersimpan di cache browser.'));
  root.appendChild(out);
  root.appendChild(hasilBox);
  root.appendChild(histBox);
  tampilHist();

  // simpan cleanup untuk onLeave
  if (T.onLeave) T.onLeave(() => { lepas(); });
}
