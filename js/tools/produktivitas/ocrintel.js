import { h as T, utils, errBox, kv } from '../../core.js';

export const meta = {"id": "ocrintel", "name": "OCR", "cat": "produktivitas", "icon": "🔠", "desc": "Ekstrak teks dari gambar 100% lokal, tanpa upload, tanpa server.", "keywords": "ocr,teks,gambar,scan,ekstrak,tesseract,pdf,tabel,tiff"};

const HIST_KEY = 'at-ocrintel-history-v1';
const MAX_MB = 8;
const MAKS_HALAMAN = 15;
const TS_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const UTIF_CDN = 'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js';
const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
const MAKS_FILE_BATCH = 10;

const BAHASA = [
  ['eng+ind', '🌐 Auto (Indonesia + Inggris)'],
  ['ind', '🇮🇩 Indonesia'], ['eng', '🇬🇧 Inggris'], ['msa', '🇲🇾 Melayu'],
  ['ara', '🇸🇦 Arab'], ['chi_sim', '🇨🇳 Mandarin (Sederhana)'], ['chi_tra', '🇹🇼 Mandarin (Tradisional)'],
  ['jpn', '🇯🇵 Jepang'], ['kor', '🇰🇷 Korea'],
  ['hin', '🇮🇳 Hindi'], ['ben', '🇧🇩 Bengali'], ['tam', '🇮🇳 Tamil'], ['tel', '🇮🇳 Telugu'],
  ['urd', '🇵🇰 Urdu'], ['fas', '🇮🇷 Persia'], ['heb', '🇮🇱 Ibrani'],
  ['tha', '🇹🇭 Thai'], ['vie', '🇻🇳 Vietnam'], ['tur', '🇹🇷 Turki'],
  ['rus', '🇷🇺 Rusia'], ['ukr', '🇺🇦 Ukraina'], ['ell', '🇬🇷 Yunani'],
  ['spa', '🇪🇸 Spanyol'], ['por', '🇧🇷 Portugis'], ['fra', '🇫🇷 Prancis'],
  ['deu', '🇩🇪 Jerman'], ['ita', '🇮🇹 Italia'], ['nld', '🇳🇱 Belanda'],
  ['pol', '🇵🇱 Polandia'], ['ces', '🇨🇿 Ceko'], ['hun', '🇭🇺 Hungaria'], ['ron', '🇷🇴 Rumania'],
  ['swe', '🇸🇪 Swedia'], ['nor', '🇳🇴 Norwegia'], ['dan', '🇩🇰 Denmark'], ['fin', '🇫🇮 Finlandia'],
  ['swa', '🇰🇪 Swahili'],
];

const getHist = () => { try { const v = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); return Array.isArray(v) ? v.filter((h) => h && typeof h === 'object') : []; } catch (e) { return []; } };

function keywordsDari(teks) {
  const f = {};
  (teks.toLowerCase().match(/[a-zà-ÿ0-9\u0600-\u06ff\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]{4,}/g) || []).forEach((w) => { f[w] = (f[w] || 0) + 1; });
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
      try { res(kecilkanCanvas(img, img.width, img.height)); }
      catch (e) { rej(e); }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('File bukan gambar yang valid.')); };
    img.src = url;
  });
}

function kecilkanCanvas(sumber, w, h) {
  const maks = 2000;
  const sk = Math.min(1, maks / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * sk); c.height = Math.round(h * sk);
  c.getContext('2d').drawImage(sumber, 0, 0, c.width, c.height);
  return c;
}

// ---------- Fungsi murni (bisa diuji di Node) ----------

// Gabung teks per halaman dengan penanda "— Halaman N —"
export function gabungTeksHalaman(halaman) {
  if (!halaman.length) return '';
  if (halaman.length === 1) return halaman[0].teks;
  return halaman.map((h) => '— Halaman ' + h.no + ' —\n' + h.teks).join('\n\n');
}

// Kelompokkan kata Tesseract jadi baris via kedekatan vertikal bbox
export function kelompokkanBaris(words) {
  const ws = (words || []).filter((w) => w && w.text && String(w.text).trim() && w.bbox && w.bbox.x1 > w.bbox.x0 && w.bbox.y1 > w.bbox.y0)
    .map((w) => ({ text: String(w.text).trim(), bbox: w.bbox, confidence: w.confidence }));
  if (!ws.length) return [];
  const hs = ws.map((w) => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
  const medH = hs[Math.floor(hs.length / 2)] || 20;
  const ambang = Math.max(8, medH * 0.7);
  ws.sort((a, b) => ((a.bbox.y0 + a.bbox.y1) / 2) - ((b.bbox.y0 + b.bbox.y1) / 2));
  const baris = [];
  let cur = [], curY = null;
  for (const w of ws) {
    const yc = (w.bbox.y0 + w.bbox.y1) / 2;
    if (cur.length && Math.abs(yc - curY) > ambang) { baris.push(cur); cur = []; curY = null; }
    cur.push(w);
    curY = curY == null ? yc : (curY * (cur.length - 1) + yc) / cur.length;
  }
  if (cur.length) baris.push(cur);
  baris.forEach((r) => r.sort((a, b) => a.bbox.x0 - b.bbox.x0));
  return baris;
}

function medianLebarKar(words) {
  const a = words.map((w) => {
    const t = (w.text || '').trim();
    const wdt = w.bbox.x1 - w.bbox.x0;
    return t.length && wdt > 0 ? wdt / t.length : 0;
  }).filter((x) => x > 0).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : 12;
}

// Deteksi tabel: baris dari bbox vertikal, kolom dari clustering jeda-x antar kata
export function deteksiTabel(words) {
  const baris = kelompokkanBaris(words);
  if (!baris.length) return { kolom: 0, baris: [], pemisah: [] };
  const semua = baris.flat();
  const cw = medianLebarKar(semua);
  const ambangJeda = Math.max(3 * cw, 24);
  const calonPemisah = [];
  const segPerBaris = baris.map((r) => {
    const segs = [[r[0]]];
    for (let i = 1; i < r.length; i++) {
      const jeda = r[i].bbox.x0 - r[i - 1].bbox.x1;
      if (jeda > ambangJeda) {
        calonPemisah.push((r[i - 1].bbox.x1 + r[i].bbox.x0) / 2);
        segs.push([r[i]]);
      } else segs[segs.length - 1].push(r[i]);
    }
    return segs;
  });
  // Cluster posisi pemisah antar-baris (toleransi 2x lebar karakter)
  calonPemisah.sort((a, b) => a - b);
  const tol = Math.max(2 * cw, 30);
  const pemisah = [];
  for (const x of calonPemisah) {
    const last = pemisah[pemisah.length - 1];
    if (last == null || x - last > tol) pemisah.push(x);
    else pemisah[pemisah.length - 1] = (last + x) / 2;
  }
  const nKol = pemisah.length + 1;
  const tabelBaris = baris.map((r, ri) => {
    const sel = new Array(nKol).fill('');
    for (const sg of segPerBaris[ri]) {
      const xc = (sg[0].bbox.x0 + sg[sg.length - 1].bbox.x1) / 2;
      let ci = 0;
      while (ci < pemisah.length && xc > pemisah[ci]) ci++;
      const teks = sg.map((w) => w.text).join(' ');
      sel[ci] = sel[ci] ? sel[ci] + ' ' + teks : teks;
    }
    return sel;
  });
  // Buang kolom yang kosong total (mis. celah ekstra dari baris tak-lengkap)
  const pakai = [];
  for (let c = 0; c < nKol; c++) if (tabelBaris.some((r) => r[c].trim())) pakai.push(c);
  const bersih = tabelBaris.map((r) => pakai.map((c) => r[c]));
  return { kolom: pakai.length, baris: bersih, pemisah: pakai.map((c) => (c < pemisah.length ? pemisah[c] : null)).filter((x) => x != null) };
}

// Netralisasi injeksi formula spreadsheet (OWASP CSV Injection): sel yang
// diawali = + - @ | % (setelah spasi/tab awal) dieksekusi Excel/LibreOffice
// sebagai formula saat file dibuka — tanda kutip CSV BUKAN perlindungan
// (kutip hanya sintaks pemisah, nilainya terurai kembali utuh).
// CSV: awali dengan TAB — sel tetap terbaca sebagai teks, bukan formula.
// TSV: tab adalah pemisah kolom, jadi pakai apostrof (penanda teks Excel).
function netralSelCsv(c) {
  const s = String(c);
  // Angka polos (-10000, +5, 3.5) aman: spreadsheet membacanya sebagai
  // angka, bukan formula — jangan beri awalan supaya tetap numerik.
  if (/^[+-]?\d+(\.\d+)?$/.test(s.trim())) return s;
  if (/^[=+\-@|%]/.test(s.trimStart())) return '\t' + s;
  return s;
}
function netralSelTsv(c) {
  const s = String(c);
  if (/^[+-]?\d+(\.\d+)?$/.test(s.trim())) return s;
  if (/^[=+\-@|%]/.test(s.trimStart())) return "'" + s;
  return s;
}

export function tabelKeTSV(t) {
  return t.baris.map((r) => r.map((c) => netralSelTsv(String(c).replace(/\t/g, ' '))).join('\t')).join('\n');
}

export function tabelKeCSV(t) {
  return t.baris.map((r) => r.map((c) => {
    c = netralSelCsv(String(c));
    return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
  }).join(',')).join('\n');
}

// Rata-rata skor kepercayaan kata (0–100). Kata tanpa skor diabaikan.
// Kembalikan null bila tidak ada kata berskor.
export function hitungKepercayaan(words) {
  const skor = (words || []).map((w) => Number(w && w.confidence)).filter((n) => Number.isFinite(n) && n >= 0);
  if (!skor.length) return null;
  return Math.round(skor.reduce((a, b) => a + b, 0) / skor.length);
}

// Kata-kata Indonesia umum untuk koreksi salah baca 'rn'→'m' dan 'vv'→'w'.
// Koreksi HANYA diterapkan bila hasilnya persis kata di daftar ini — jadi
// kata lain tidak ikut berubah.
const KATA_RN_M = new Set(['rumah', 'nama', 'sama', 'kamu', 'semua', 'ramai', 'teman', 'cuma', 'lama', 'makan', 'minum', 'namun', 'damai', 'ramah', 'timur', 'umum', 'kami', 'mama', 'mami', 'tamu', 'jam', 'taman', 'aman', 'iman', 'mama']);
const KATA_VV_W = new Set(['waktu', 'awal', 'jawab', 'kawan', 'lawan', 'sawah', 'bawa', 'jawa', 'rawa', 'tawa', 'wajah', 'warga', 'warna', 'wangi', 'wajib', 'awal', 'kawat', 'sawat', 'lewat', 'rawat']);

// Rapikan hasil OCR: spasi sebelum tanda baca, spasi ganda, angka yang
// terbaca di tengah kata (k0pi→kopi), dan salah baca umum 'rn'/'vv'.
// Konservatif: hanya pola yang aman yang diubah.
export function rapikanOcr(teks) {
  let s = String(teks || '');
  s = s.replace(/[ \t]+([,.:;!?%])/g, '$1');
  s = s.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(/([A-Za-zÀ-ÿ0-9]{2,})/g, (tok) => {
    let t = tok;
    if (/[0-9]/.test(t) && /[A-Za-zÀ-ÿ]{2,}/.test(t)) {
      t = t.replace(/0/g, 'o').replace(/1/g, 'l');
    }
    if (t.indexOf('rn') > -1) {
      const coba = t.replace(/rn/g, 'm');
      if (KATA_RN_M.has(coba.toLowerCase())) t = coba;
    }
    if (t.indexOf('vv') > -1) {
      const coba = t.replace(/vv/g, 'w');
      if (KATA_VV_W.has(coba.toLowerCase())) t = coba;
    }
    return t;
  });
  return s;
}

// Teks polos -> dokumen RTF (dibuka Word/LibreOffice/WPS).
// Karakter non-ASCII ditulis sebagai \uN (signed 16-bit) + '?' pengganti,
// jadi teks Indonesia & aksen tetap terbaca.
export function teksKeRtf(teks) {
  let isi = '';
  for (const ch of String(teks || '')) {
    const code = ch.codePointAt(0);
    if (ch === '\\') isi += '\\\\';
    else if (ch === '{') isi += '\\{';
    else if (ch === '}') isi += '\\}';
    else if (ch === '\n') isi += '\\par\n';
    else if (ch === '\r') isi += '';
    else if (ch === '\t') isi += '\\tab ';
    else if (code > 127) isi += '\\u' + (code > 32767 ? code - 65536 : code) + '?';
    else isi += ch;
  }
  return '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Arial;}}\n\\f0\\fs22\n' + isi + '\n}';
}

// Bangun PDF searchable: tiap halaman = gambar + teks tak-terlihat di posisi kata.
// PDFLib disuntik dari luar (browser: window.PDFLib, node: require('pdf-lib')) —
// supaya fungsi ini murni & bisa diuji tanpa DOM.
export async function pdfSearchableDariHalaman(PDFLib, daftar) {
  const doc = await PDFLib.PDFDocument.create();
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  for (const h of daftar) {
    const page = doc.addPage([h.w, h.h]);
    const img = await doc.embedJpg(h.jpeg);
    page.drawImage(img, { x: 0, y: 0, width: h.w, height: h.h });
    for (const wd of (h.words || [])) {
      const t = wd && wd.text ? String(wd.text).trim() : '';
      const b = wd && wd.bbox ? wd.bbox : null;
      if (!t || !b) continue;
      const tinggi = b.y1 - b.y0;
      if (!(b.x1 > b.x0 && tinggi > 0)) continue;
      try {
        page.drawText(t, {
          x: b.x0, y: h.h - b.y1,
          size: Math.max(4, tinggi * 0.85), font,
          color: PDFLib.rgb(0, 0, 0),
          renderMode: PDFLib.TextRenderingMode.Invisible,
        });
      } catch (e) { /* karakter di luar WinAnsi (mis. Arab/CJK) dilewati — gambarnya tetap ada */ }
    }
  }
  return await doc.save();
}

// ---------- Akhir fungsi murni ----------

export function render(root) {
  let worker = null, teksHasil = '', kataHasil = [];
  let workerLang = null; // bahasa yang dipakai worker aktif (untuk deteksi ganti bahasa)
  let memproses = false;
  let pendingFiles = []; // file yang dipilih tapi BELUM di-scan (maks MAKS_FILE_BATCH)
  let previewUrls = [];
  let hasilHalaman = []; // [{no, canvas, words, teks}]
  let tabelPerHalaman = []; // hasil deteksiTabel per halaman (bila mode tabel)
  let namaFileTerakhir = '';
  let pdfJsSiap = null, pdfLibSiap = null, utifSiap = null, zipSiap = null;
  let halAktif = -1; // tab reader: -1 = semua halaman, >=0 = indeks halaman
  let hasilBatch = []; // [{nama, halaman, teks, detik}] — satu entri per file
  let fileAktif = 0;
  let sorotRendah = false; // sorot kata ber-kepercayaan rendah di hasil
  let dirapikan = false; // hasil sedang dalam mode "rapikan"
  let teksAsliBatch = ''; // teks sebelum dirapikan (untuk undo)

  const ACCEPT_OCR = 'image/jpeg,image/png,image/gif,image/bmp,image/webp,application/pdf,image/tiff,.pdf,.tif,.tiff';
  const dz = T.el('<div style="border:1.5px dashed #ffffff30;border-radius:12px;padding:26px 14px;text-align:center;cursor:pointer;background:#161311">' +
    '<div style="font-size:28px">🖼️</div><div style="font-size:13px;margin-top:6px"><b>Ketuk untuk pilih file</b></div>' +
    '<div class="dim" style="font-size:12px;margin-top:4px">Gambar JPG/PNG/GIF/BMP/WEBP · PDF multi-halaman · TIFF · maks ' + MAX_MB + ' MB per file · bisa banyak sekaligus (maks ' + MAKS_FILE_BATCH + ' file) · atau tempel (paste) & seret file</div>' +
    '<div style="margin-top:10px"><button type="button" class="btn" id="ocr-kamera">Kamera</button></div></div>');
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = ACCEPT_OCR;
  fileInp.multiple = true;
  fileInp.hidden = true;
  const langSel = T.select(BAHASA, 'eng+ind');
  const previewBox = T.out(); // pratinjau file sebelum scan
  const scanBtn = T.el('<button class="btn primary" disabled style="width:100%;padding:13px;font-size:15px;margin-top:10px;opacity:.45;cursor:not-allowed">🔍 Pilih gambar dulu untuk mulai scan</button>');
  const tabelChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="ocr-tabelmode"> 📊 <b>Mode tabel</b> <span class="dim">— untuk struk/nota bertabel: hasil jadi tabel + unduh CSV/TSV</span></label>');
  const tabelCek = tabelChk.querySelector('#ocr-tabelmode');
  const out = T.out();
  const hasilBox = T.out();
  const histBox = T.out();

  dz.onclick = () => fileInp.click();
  const kamBtn = dz.querySelector('#ocr-kamera');
  if (kamBtn) kamBtn.onclick = (e) => {
    e.stopPropagation();
    fileInp.accept = 'image/*';
    fileInp.setAttribute('capture', 'environment');
    fileInp.click();
    setTimeout(() => { fileInp.accept = ACCEPT_OCR; fileInp.removeAttribute('capture'); }, 1500);
  };
  dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = '#ff7a59'; };
  dz.ondragleave = () => { dz.style.borderColor = '#ffffff30'; };
  dz.ondrop = (e) => { e.preventDefault(); dz.style.borderColor = '#ffffff30'; if (e.dataTransfer.files.length) pilihFiles([...e.dataTransfer.files]); };
  document.addEventListener('paste', onPaste);
  fileInp.onchange = () => { if (fileInp.files.length) pilihFiles([...fileInp.files]); fileInp.value = ''; };
  function onPaste(e) {
    const f = [...(e.clipboardData?.files || [])].find((x) => jenisFile(x));
    if (f && root.isConnected) pilihFiles([f]);
  }
  tabelCek.onchange = () => {
    // Toggle mode tabel tanpa OCR ulang bila hasil kata sudah ada
    if (hasilHalaman.length && hasilHalaman.some((h) => h.words && h.words.length)) {
      hitungTabel();
      tampilHasil(namaFileTerakhir, '');
    }
  };

  // --- Alur eksplisit: pilih file → pratinjau → tekan "Mulai Scan" ---
  // Batch: banyak file ditampung, diproses berurutan saat tombol ditekan.
  const pilihFiles = (daftarBaru) => {
    let ditambah = 0, ditolak = 0;
    for (const file of daftarBaru) {
      const jenis = jenisFile(file);
      if (!jenis) { ditolak++; continue; }
      if (file.size > MAX_MB * 1024 * 1024) { ditolak++; continue; }
      if (pendingFiles.length >= MAKS_FILE_BATCH) { ditolak++; continue; }
      // Jangan buang file hanya karena nama + ukuran sama dengan yang sudah
      // ada: dua foto berbeda bisa bernama sama (mis. IMG_001.jpg dari dua
      // folder) — yang dulu dibuang diam-diam sehingga 1 file hilang dari
      // batch tanpa kabar (keluarga S8). Hanya objek File yang PERSIS sama
      // (event ganda) yang diabaikan.
      if (pendingFiles.some((p) => p === file)) continue;
      pendingFiles.push(file);
      ditambah++;
    }
    if (ditolak && !ditambah && !pendingFiles.length) {
      T.show(out, errBox('Format tidak didukung atau file melebihi ' + MAX_MB + ' MB. Pakai gambar (JPG/PNG/GIF/BMP/WEBP), PDF, atau TIFF.'));
      return;
    }
    if (ditolak) T.toast(ditolak + ' file dilewati (format tidak didukung / terlalu besar / sudah ' + MAKS_FILE_BATCH + ' file).');
    gambarPratinjau();
    T.hide(hasilBox);
    T.hide(out);
  };

  const gambarPratinjau = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    previewUrls = [];
    if (!pendingFiles.length) {
      T.hide(previewBox);
      scanBtn.disabled = true;
      scanBtn.style.opacity = '.45';
      scanBtn.style.cursor = 'not-allowed';
      scanBtn.textContent = '🔍 Pilih gambar dulu untuk mulai scan';
      return;
    }
    let html = '';
    pendingFiles.forEach((file, i) => {
      const jenis = jenisFile(file);
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      const thumb = jenis === 'gambar'
        ? '<img src="' + url + '" alt="pratinjau" style="width:58px;height:58px;object-fit:cover;border-radius:8px;border:1px solid #ffffff14;flex-shrink:0">'
        : '<div style="width:58px;height:58px;border-radius:8px;border:1px solid #ffffff14;background:#0d0b09;flex-shrink:0;font-size:28px;line-height:58px;text-align:center">' + (jenis === 'pdf' ? '📄' : '🖼️') + '</div>';
      html += '<div style="display:flex;gap:10px;align-items:center;border:1px solid #ffffff20;border-radius:12px;padding:10px;background:#161311;margin-top:10px">' +
        thumb +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(file.name) + '</div>' +
        '<div class="dim" style="font-size:12px;margin-top:2px">' + fmtUkuran(file.size) + ' · siap di-scan</div></div>' +
        '<button class="btn" data-hapus-file="' + i + '" style="font-size:12.5px">🗑️ Hapus</button></div>';
    });
    T.show(previewBox, html);
    previewBox.querySelectorAll('[data-hapus-file]').forEach((b) => {
      b.onclick = () => {
        pendingFiles.splice(parseInt(b.getAttribute('data-hapus-file'), 10), 1);
        gambarPratinjau();
      };
    });
    scanBtn.disabled = false;
    scanBtn.style.opacity = '1';
    scanBtn.style.cursor = 'pointer';
    scanBtn.textContent = pendingFiles.length > 1 ? '🔍 Mulai Scan (' + pendingFiles.length + ' file)' : '🔍 Mulai Scan';
  };

  const hapusFile = (diam) => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    previewUrls = [];
    pendingFiles = [];
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
    T.show(out, '<p class="dim">Menyiapkan model bahasa…</p>');
    worker = await window.Tesseract.createWorker(lang, window.Tesseract.OEM.LSTM, {
      logger: (m) => { if (m.status === 'recognizing text' && onProg) onProg(m.progress); },
    });
    workerLang = lang;
    return worker;
  };

  const pastPdfJs = () => {
    if (!pdfJsSiap) {
      pdfJsSiap = T.loadScript(PDFJS_CDN).then((ok) => {
        if (ok && window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return ok && !!window.pdfjsLib;
      });
    }
    return pdfJsSiap;
  };
  const pastPdfLib = () => {
    if (!pdfLibSiap) pdfLibSiap = T.loadScript(PDFLIB_CDN).then((ok) => ok && !!window.PDFLib);
    return pdfLibSiap;
  };
  const pastUtif = () => {
    if (!utifSiap) utifSiap = T.loadScript(UTIF_CDN).then((ok) => ok && !!window.UTIF);
    return utifSiap;
  };

  function jenisFile(file) {
    const t = (file.type || '').toLowerCase();
    const n = (file.name || '').toLowerCase();
    if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
    if (t === 'image/tiff' || t === 'image/x-tiff' || n.endsWith('.tif') || n.endsWith('.tiff')) return 'tiff';
    if (/^image\//.test(t)) return 'gambar';
    return null;
  }

  const fileKeBuffer = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Gagal membaca file.'));
    r.readAsArrayBuffer(file);
  });

  // PDF → daftar canvas (1 per halaman, maks MAKS_HALAMAN)
  const pdfKeCanvas = async (buffer, onHal) => {
    if (!(await pastPdfJs())) throw new Error('Pustaka PDF gagal dimuat dari CDN.');
    const doc = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const total = Math.min(doc.numPages, MAKS_HALAMAN);
    const out = [];
    for (let i = 1; i <= total; i++) {
      if (onHal) onHal(i, total);
      const pg = await doc.getPage(i);
      const vp0 = pg.getViewport({ scale: 1 });
      const skala = Math.min(3, 2000 / Math.max(vp0.width, vp0.height));
      const vp = pg.getViewport({ scale: skala });
      const c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      out.push(c);
    }
    try { await doc.destroy(); } catch (e) {}
    return { canvas: out, totalAsli: doc.numPages };
  };

  // TIFF → daftar canvas (1 per halaman IFD, dukung multi-page)
  const tiffKeCanvas = async (buffer, onHal) => {
    if (!(await pastUtif())) throw new Error('Pustaka TIFF gagal dimuat dari CDN.');
    const ifds = window.UTIF.decode(buffer);
    if (!ifds || !ifds.length) throw new Error('File TIFF tidak terbaca.');
    const total = Math.min(ifds.length, MAKS_HALAMAN);
    const out = [];
    for (let i = 0; i < total; i++) {
      if (onHal) onHal(i + 1, total);
      window.UTIF.decodeImage(buffer, ifds[i]);
      const rgba = window.UTIF.toRGBA8(ifds[i]);
      const c = document.createElement('canvas');
      c.width = ifds[i].width; c.height = ifds[i].height;
      c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), c.width, c.height), 0, 0);
      out.push(kecilkanCanvas(c, c.width, c.height));
    }
    return { canvas: out, totalAsli: ifds.length };
  };

  const canvasKeBlob = (c) => new Promise((res, rej) => {
    c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal meng-encode gambar.'))), 'image/jpeg', 0.92);
  });

  scanBtn.onclick = () => {
    if (memproses) { T.toast('Masih memproses…'); return; }
    if (!pendingFiles.length) { T.toast('Pilih gambar dulu.'); return; }
    proses();
  };

  const pastZip = () => {
    if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && typeof window.JSZip === 'function');
    return zipSiap;
  };

  const barProgress = (label, p) => {
    T.show(out, '<p class="dim">' + T.esc(label) + ' <span id="ocr-p">' + Math.round(p * 100) + '</span>%</p>' +
      '<div style="height:6px;background:#ffffff14;border-radius:4px;margin-top:6px"><div id="ocr-bar" style="height:100%;width:' + (p * 100) + '%;background:#ff7a59;border-radius:4px;transition:width .2s"></div></div>');
  };

  // OCR satu file → {nama, halaman, teks, infoHalaman, detik}. Throw bila gagal.
  const prosesSatuFile = async (file, awalan) => {
    const jenis = jenisFile(file);
    if (!jenis) throw new Error('Format tidak didukung.');
    if (file.size > MAX_MB * 1024 * 1024) throw new Error('File melebihi ' + MAX_MB + ' MB.');
    const mulai = Date.now();
    barProgress(awalan + 'Menyiapkan halaman…', 0);
    let daftarCanvas, infoHalaman = '';
    if (jenis === 'pdf') {
      const buf = await fileKeBuffer(file);
      const r = await pdfKeCanvas(buf.slice(0), (i, n) => barProgress(awalan + 'Merender halaman ' + i + '/' + n + '…', i / n * 0.5));
      daftarCanvas = r.canvas;
      if (r.totalAsli > MAKS_HALAMAN) infoHalaman = ' (hanya ' + MAKS_HALAMAN + ' halaman pertama dari ' + r.totalAsli + ' diproses)';
    } else if (jenis === 'tiff') {
      const buf = await fileKeBuffer(file);
      const r = await tiffKeCanvas(buf.slice(0), (i, n) => barProgress(awalan + 'Membaca halaman TIFF ' + i + '/' + n + '…', i / n * 0.5));
      daftarCanvas = r.canvas;
      if (r.totalAsli > MAKS_HALAMAN) infoHalaman = ' (hanya ' + MAKS_HALAMAN + ' halaman pertama dari ' + r.totalAsli + ' diproses)';
    } else {
      daftarCanvas = [await siapkanGambar(file)];
    }
    if (!daftarCanvas.length) throw new Error('Tidak ada halaman yang bisa dibaca.');
    const w = await pastWorker((p) => {
      const pe = out.querySelector('#ocr-p');
      if (pe) pe.textContent = Math.round(p * 100);
      const be = out.querySelector('#ocr-bar');
      if (be) be.style.width = (p * 100) + '%';
    });
    const halaman = [];
    for (let i = 0; i < daftarCanvas.length; i++) {
      const label = daftarCanvas.length > 1 ? 'Mengenali teks halaman ' + (i + 1) + '/' + daftarCanvas.length + '… ' : 'Mengenali teks… ';
      barProgress(awalan + label, 0);
      const { data } = await w.recognize(daftarCanvas[i]);
      halaman.push({
        no: i + 1,
        canvas: daftarCanvas[i],
        words: (data.words || []).map((x) => ({ text: x.text, bbox: x.bbox, confidence: x.confidence })),
        teks: (data.text || '').trim(),
      });
    }
    const teks = gabungTeksHalaman(halaman.map((h) => ({ no: h.no, teks: h.teks })));
    return { nama: file.name || 'dokumen', halaman, teks, teksAsli: teks, infoHalaman, detik: ((Date.now() - mulai) / 1000).toFixed(1) };
  };

  // Muat satu entri batch ke state tampil lalu gambar hasilnya.
  const muatFileHasil = (idx) => {
    fileAktif = idx;
    const entri = hasilBatch[idx];
    if (!entri) return;
    hasilHalaman = entri.halaman;
    teksHasil = entri.teks;
    teksAsliBatch = entri.teksAsli || entri.teks;
    dirapikan = entri.teks !== teksAsliBatch;
    sorotRendah = false;
    kataHasil = teksHasil.split(/\s+/).filter(Boolean);
    namaFileTerakhir = entri.nama;
    hitungTabel();
    tampilHasil(entri.nama + (entri.infoHalaman || ''), entri.detik);
  };

  const proses = async () => {
    if (memproses) { T.toast('Masih memproses…'); return; }
    if (!pendingFiles.length) { T.toast('Pilih gambar dulu.'); return; }
    memproses = true;
    scanBtn.disabled = true;
    scanBtn.style.opacity = '.6';
    scanBtn.textContent = '⏳ Memproses…';
    T.hide(hasilBox);
    hasilBatch = [];
    const gagal = [];
    const daftar = pendingFiles.slice();
    for (let i = 0; i < daftar.length; i++) {
      const awalan = daftar.length > 1 ? 'File ' + (i + 1) + '/' + daftar.length + ' — ' : '';
      try {
        const r = await prosesSatuFile(daftar[i], awalan);
        if (!r.teks) gagal.push((r.nama || 'file ' + (i + 1)) + ' (tidak ada teks terbaca)');
        else hasilBatch.push(r);
      } catch (e) {
        gagal.push((daftar[i].name || 'file ' + (i + 1)) + ' (tidak bisa dibaca)');
      }
    }
    memproses = false;
    if (!hasilBatch.length) {
      T.show(out, errBox('Tidak ada teks yang terbaca dari file-file ini. Coba file yang lebih jelas/kontras.'));
    } else {
      muatFileHasil(0);
      const l = hasilBatch.map((r) => ({ nama: r.nama, kata: r.teks.split(/\s+/).filter(Boolean).length, kar: r.teks.length, halaman: r.halaman.length, bahasa: langSel.selectedOptions[0].textContent, t: Date.now() })).concat(getHist()).slice(0, 5);
      try { localStorage.setItem(HIST_KEY, JSON.stringify(l)); } catch (e) {}
      tampilHist();
      if (gagal.length) T.toast(gagal.length + ' file gagal: ' + gagal.slice(0, 2).join('; '));
    }
    if (pendingFiles.length) {
      scanBtn.disabled = false;
      scanBtn.style.opacity = '1';
      scanBtn.textContent = '🔍 Scan Ulang';
    } else hapusFile(true);
  };

  const hitungTabel = () => {
    tabelPerHalaman = tabelCek.checked
      ? hasilHalaman.map((h) => deteksiTabel(h.words))
      : [];
  };

  const unduhPdfSearchable = async () => {
    if (!hasilHalaman.length) return;
    T.toast('Menyusun PDF searchable…');
    try {
      if (!(await pastPdfLib())) { T.toast('Gagal memuat pustaka PDF.'); return; }
      const daftar = [];
      for (const h of hasilHalaman) {
        const blob = await canvasKeBlob(h.canvas);
        daftar.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), w: h.canvas.width, h: h.canvas.height, words: h.words });
      }
      const bytes = await pdfSearchableDariHalaman(window.PDFLib, daftar);
      T.dl('ocr-searchable-' + Date.now() + '.pdf', new Blob([bytes], { type: 'application/pdf' }), 'application/pdf');
      T.toast('PDF searchable terunduh ✅');
    } catch (e) {
      T.show(out, errBox('PDF tidak bisa dibuat. Coba lagi.'));
    }
  };

  // Teks sesuai tab aktif ("Semua" = gabungan semua halaman)
  const teksTabAktif = () => (halAktif >= 0 && hasilHalaman[halAktif] ? hasilHalaman[halAktif].teks : teksHasil);

  const tampilHasil = (nama, detik) => {
    T.hide(out);
    halAktif = -1;
    const kata = kataHasil.length, kar = teksHasil.length;
    const menitBaca = Math.max(1, Math.round(kata / 200));
    const kw = keywordsDari(teksHasil);
    const confPerHal = hasilHalaman.map((h) => hitungKepercayaan(h.words));
    const confSemua = hitungKepercayaan(hasilHalaman.flatMap((h) => h.words || []));
    let fileTabHtml = '';
    if (hasilBatch.length > 1) {
      fileTabHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="ocr-filetabbar">' +
        hasilBatch.map((r, i) => '<button type="button" class="btn' + (i === fileAktif ? ' primary' : '') + '" data-file="' + i + '">📄 ' + T.esc(r.nama.length > 24 ? r.nama.slice(0, 24) + '…' : r.nama) + '</button>').join('') + '</div>';
    }
    let tabHtml = '';
    if (hasilHalaman.length > 1) {
      tabHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="ocr-tabbar">' +
        '<button type="button" class="btn primary" data-hal="-1">Semua</button>' +
        hasilHalaman.map((h, i) => '<button type="button" class="btn" data-hal="' + i + '">Halaman ' + h.no + (confPerHal[i] != null ? ' · ' + confPerHal[i] + '%' : '') + '</button>').join('') + '</div>';
    }
    const adaTabel = tabelPerHalaman.length && tabelPerHalaman.some((t) => t.kolom > 0);
    let tabelHtml = '';
    if (adaTabel) {
      tabelHtml = tabelPerHalaman.map((t, i) => {
        if (!t.kolom) return '';
        const judul = tabelPerHalaman.length > 1 ? '<div class="dim" style="font-size:12px;margin:8px 0 4px">📄 Halaman ' + (i + 1) + ' — ' + t.baris.length + ' baris × ' + t.kolom + ' kolom</div>' : '<div class="dim" style="font-size:12px;margin:8px 0 4px">' + t.baris.length + ' baris × ' + t.kolom + ' kolom terdeteksi</div>';
        const barisTampil = t.baris.slice(0, 60);
        return judul + '<div style="overflow:auto;max-height:280px;border:1px solid #ffffff14;border-radius:8px"><table style="border-collapse:collapse;width:100%;font-size:12.5px">' +
          barisTampil.map((r, ri) => '<tr>' + r.map((c) => (ri === 0 ? '<th' : '<td') + ' style="border:1px solid #ffffff14;padding:6px 8px;text-align:left;white-space:nowrap">' + T.esc(c) + (ri === 0 ? '</th>' : '</td>')).join('') + '</tr>').join('') +
          '</table></div>' + (t.baris.length > 60 ? '<div class="dim" style="font-size:11.5px">… ' + (t.baris.length - 60) + ' baris lagi (tetap ikut di file unduhan)</div>' : '');
      }).join('');
    }
    T.show(hasilBox,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#161311">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
      kv('Bahasa', T.esc(langSel.selectedOptions[0].textContent)) +
      kv('Kata', '<b>' + kata + '</b>') + kv('Karakter', '<b>' + kar + '</b>') +
      (hasilHalaman.length > 1 ? kv('Halaman', '<b>' + hasilHalaman.length + '</b>') : '') +
      (confSemua != null ? kv('Keyakinan', '<b>' + confSemua + '%</b>') : '') +
      kv('Waktu baca', '±' + menitBaca + ' mnt') + (detik ? kv('Proses', detik + ' dtk') : '') + '</div>' +
      '<div class="dim" style="font-size:12px;margin-bottom:4px">File: ' + T.esc(nama) + '</div>' +
      fileTabHtml +
      tabHtml +
      '<pre id="ocr-teks" style="white-space:pre-wrap;word-break:break-word;background:#0d0b09;border:1px solid #ffffff14;border-radius:8px;padding:12px;font-size:13px;line-height:1.7;max-height:300px;overflow:auto;margin:0">' + T.esc(teksHasil) + '</pre>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="ocr-sorot"> Sorot kata yang kurang yakin dibaca</label>' +
      '<button class="btn" id="ocr-rapikan" style="font-size:12.5px">' + (dirapikan ? '↩️ Kembalikan seperti semula' : '✨ Rapikan hasil') + '</button></div>' +
      '<p class="dim" id="ocr-sorot-ket" style="font-size:11.5px;margin:6px 0 0" hidden><span style="background:rgba(239,68,68,.35);border-radius:3px;padding:0 3px">merah</span> = sangat tidak yakin (&lt;50%) · <span style="background:rgba(251,191,36,.3);border-radius:3px;padding:0 3px">kuning</span> = kurang yakin (50–79%). Arahkan kursor ke kata untuk melihat skornya.</p>' +
      tabelHtml +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
      '<input id="ocr-cari" type="text" placeholder="Cari di hasil…" style="flex:1;min-width:120px" class="inp">' +
      '<span class="dim" id="ocr-nhasil" style="font-size:12px"></span></div>' +
      (kw.length ? '<div style="margin-top:10px"><b style="font-size:12.5px">🔑 Kata kunci:</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        kw.map(([w, n]) => '<button class="btn" data-kw="' + T.esc(w) + '" style="font-size:12px">' + T.esc(w) + ' ·' + n + '</button>').join('') + '</div></div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn primary" data-o="copy">📋 Salin Teks</button>' +
      '<button class="btn" data-o="txt">⬇️ Unduh TXT</button>' +
      '<button class="btn" data-o="rtf">⬇️ Unduh RTF</button>' +
      '<button class="btn" data-o="json">⬇️ Unduh JSON</button>' +
      '<button class="btn" data-o="pdf">⬇️ Unduh PDF searchable</button>' +
      (adaTabel ? '<button class="btn" data-o="csv">⬇️ Unduh CSV</button><button class="btn" data-o="tsv">⬇️ Unduh TSV</button>' : '') +
      (hasilBatch.length > 1 ? '<button class="btn" data-o="zip">⬇️ Unduh semua TXT (ZIP)</button>' : '') + '</div>' +
      '<button class="btn" id="ocr-ulang" style="width:100%;margin-top:10px">🔄 Pindai dokumen lain</button>' +
      '<p class="dim" style="font-size:11.5px;margin-top:10px">🔒 100% lokal — filemu tidak diupload ke mana pun. PDF searchable: teksnya bisa di-select & dicari. Akurasi terbaik untuk teks cetak jelas; tulisan tangan kurang akurat.</p></div>');

    const pre = hasilBox.querySelector('#ocr-teks');
    const cariInp = hasilBox.querySelector('#ocr-cari');
    const nHasil = hasilBox.querySelector('#ocr-nhasil');
    // HTML hasil dengan kata ber-keyakinan rendah disorot (dari data words).
    const teksSorotHtml = () => {
      const daftar = halAktif >= 0 ? [hasilHalaman[halAktif]] : hasilHalaman;
      const parts = [];
      for (const h of daftar) {
        if (!h) continue;
        const baris = kelompokkanBaris(h.words || []);
        parts.push(baris.map((r) => r.map((w) => {
          const c = Number(w.confidence);
          const gaya = Number.isFinite(c) && c < 50 ? 'background:rgba(239,68,68,.35);border-radius:3px' : Number.isFinite(c) && c < 80 ? 'background:rgba(251,191,36,.3);border-radius:3px' : '';
          return '<span' + (gaya ? ' style="' + gaya + '"' : '') + (Number.isFinite(c) ? ' title="Tingkat keyakinan: ' + Math.round(c) + '%"' : '') + '>' + T.esc(w.text) + '</span>';
        }).join(' ')).join('\n'));
      }
      return parts.join('\n\n');
    };
    const gambarTeks = () => {
      if (sorotRendah) pre.innerHTML = teksSorotHtml();
      else pre.textContent = teksTabAktif();
    };
    const sorot = () => {
      const q = cariInp.value.trim();
      const sumber = teksTabAktif();
      if (!q) { gambarTeks(); nHasil.textContent = ''; return; }
      const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      let n = 0;
      pre.innerHTML = T.esc(sumber).replace(rx, (m) => { n++; return n <= 200 ? '<mark style="background:#ff7a59;color:#000">' + m + '</mark>' : m; });
      nHasil.textContent = n ? n + ' hasil' : 'tidak ketemu';
    };
    cariInp.oninput = sorot;
    const sorotCek = hasilBox.querySelector('#ocr-sorot');
    const sorotKet = hasilBox.querySelector('#ocr-sorot-ket');
    if (sorotCek) sorotCek.onchange = () => {
      sorotRendah = sorotCek.checked;
      sorotKet.hidden = !sorotRendah;
      cariInp.value = ''; nHasil.textContent = '';
      gambarTeks();
    };
    const bRapikan = hasilBox.querySelector('#ocr-rapikan');
    if (bRapikan) bRapikan.onclick = () => {
      const entri = hasilBatch[fileAktif];
      if (!entri) return;
      if (!dirapikan) {
        teksAsliBatch = entri.teks;
        entri.teks = rapikanOcr(entri.teks);
        entri.halaman.forEach((h) => { h.teksAsli = h.teks; h.teks = rapikanOcr(h.teks); });
        teksHasil = entri.teks;
        dirapikan = true;
        bRapikan.textContent = '↩️ Kembalikan seperti semula';
        T.toast('Hasil dirapikan — periksa dulu sebelum disalin');
      } else {
        entri.teks = teksAsliBatch;
        entri.halaman.forEach((h) => { if (h.teksAsli != null) h.teks = h.teksAsli; });
        teksHasil = entri.teks;
        dirapikan = false;
        bRapikan.textContent = '✨ Rapikan hasil';
      }
      kataHasil = teksHasil.split(/\s+/).filter(Boolean);
      gambarTeks();
    };
    const filetabbar = hasilBox.querySelector('#ocr-filetabbar');
    if (filetabbar) filetabbar.querySelectorAll('[data-file]').forEach((b) => {
      b.onclick = () => muatFileHasil(parseInt(b.getAttribute('data-file'), 10));
    });
    const tabbar = hasilBox.querySelector('#ocr-tabbar');
    if (tabbar) tabbar.querySelectorAll('[data-hal]').forEach((b) => {
      b.onclick = () => {
        halAktif = parseInt(b.getAttribute('data-hal'), 10);
        tabbar.querySelectorAll('[data-hal]').forEach((x) => x.classList.toggle('primary', x === b));
        gambarTeks();
        cariInp.value = ''; nHasil.textContent = '';
      };
    });
    hasilBox.querySelectorAll('[data-kw]').forEach((b) => { b.onclick = () => { cariInp.value = b.getAttribute('data-kw'); sorot(); }; });
    hasilBox.querySelector('[data-o=copy]').onclick = () => T.copy(teksTabAktif());
    hasilBox.querySelector('[data-o=txt]').onclick = () => T.dl('ocr-' + Date.now() + '.txt', teksTabAktif(), 'text/plain');
    hasilBox.querySelector('[data-o=rtf]').onclick = () => T.dl('ocr-' + Date.now() + '.rtf', teksKeRtf(teksTabAktif()), 'application/rtf');
    hasilBox.querySelector('[data-o=json]').onclick = () => T.dl('ocr-' + Date.now() + '.json',
      JSON.stringify({ teks: teksHasil, kata, karakter: kar, halaman: hasilHalaman.length, keywords: kw.map(([w, n]) => ({ kata: w, muncul: n })) }, null, 2), 'application/json');
    hasilBox.querySelector('[data-o=pdf]').onclick = unduhPdfSearchable;
    const bCsv = hasilBox.querySelector('[data-o=csv]');
    if (bCsv) bCsv.onclick = () => T.dl('ocr-tabel-' + Date.now() + '.csv', tabelPerHalaman.map(tabelKeCSV).join('\n\n'), 'text/csv');
    const bTsv = hasilBox.querySelector('[data-o=tsv]');
    if (bTsv) bTsv.onclick = () => T.dl('ocr-tabel-' + Date.now() + '.tsv', tabelPerHalaman.map(tabelKeTSV).join('\n\n'), 'text/tab-separated-values');
    const bZip = hasilBox.querySelector('[data-o=zip]');
    if (bZip) bZip.onclick = async () => {
      T.toast('Menyiapkan ZIP…');
      if (!(await pastZip())) { T.toast('Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi.'); return; }
      try {
        const zip = new window.JSZip();
        const pakaiNama = new Set();
        const namaUnik = (nama) => {
          if (!pakaiNama.has(nama)) { pakaiNama.add(nama); return nama; }
          const i = nama.lastIndexOf('.');
          const dasar = i > 0 ? nama.slice(0, i) : nama;
          const ext = i > 0 ? nama.slice(i) : '';
          let k = 2, coba;
          do { coba = dasar + ' (' + k + ')' + ext; k++; } while (pakaiNama.has(coba));
          pakaiNama.add(coba);
          return coba;
        };
        hasilBatch.forEach((r, i) => {
          const base = (r.nama || ('dokumen-' + (i + 1))).replace(/\.[^.]*$/, '');
          zip.file(namaUnik(base + '.txt'), r.teks);
        });
        zip.file(namaUnik('semua-gabungan.txt'), hasilBatch.map((r) => '===== ' + r.nama + ' =====\n' + r.teks).join('\n\n'));
        const blob = await zip.generateAsync({ type: 'blob' });
        T.dl('ocr-semua-' + Date.now() + '.zip', blob, 'application/zip');
        T.toast('ZIP berhasil diunduh');
      } catch (e) { T.toast('Gagal membuat ZIP.'); }
    };
    hasilBox.querySelector('#ocr-ulang').onclick = () => { T.hide(hasilBox); hapusFile(true); window.scrollTo(0, 0); };
  };

  const tampilHist = () => {
    const l = getHist();
    if (!l.length) {
      T.show(histBox, '<p class="dim" style="font-size:12.5px;margin:14px 0 6px"><b>Terakhir diproses</b></p>' +
        '<p class="dim" style="font-size:12.5px">Belum ada dokumen yang diproses.</p>');
      return;
    }
    T.show(histBox, '<div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px">' +
      '<p class="dim" style="font-size:12.5px;margin:0"><b>Terakhir diproses</b></p>' +
      '<button class="btn" id="ocr-hapus-hist" style="font-size:12px">Hapus riwayat</button></div>' +
      '<div style="display:grid;gap:6px">' +
      l.map((h) => '<div class="dim" style="font-size:12.5px;border:1px solid #ffffff12;border-radius:8px;padding:8px 10px">' +
        T.esc(h.nama) + ' · ' + h.kata + ' kata · ' + (h.halaman || 1) + ' halaman' + (h.bahasa ? ' · ' + T.esc(h.bahasa) : '') + '</div>').join('') + '</div>');
    histBox.querySelector('#ocr-hapus-hist').onclick = () => {
      try { localStorage.removeItem(HIST_KEY); } catch (e) {}
      T.hide(histBox);
      T.toast('Riwayat dihapus.');
    };
  };

  // lepas worker saat tool ditutup (hemat memori)
  const lepas = async () => {
    document.removeEventListener('paste', onPaste);
    hasilHalaman = []; tabelPerHalaman = [];
    if (worker) { try { await worker.terminate(); } catch (e) {} worker = null; workerLang = null; }
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Foto dokumen, struk, PDF multi-halaman, atau file TIFF berisi teks? Ekstrak jadi teks yang bisa disalin — memakai Tesseract.js langsung di HP. Tanpa server, tanpa API key, file tidak keluar dari perangkat.</p>'));
  root.appendChild(dz);
  root.appendChild(fileInp);
  root.appendChild(previewBox);
  root.appendChild(scanBtn);
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin:8px 0 0">🔒 Privasi: OCR berjalan 100% lokal di perangkatmu — file tidak diupload ke server mana pun.</p>'));
  root.appendChild(T.field('Bahasa dokumen', langSel, 'Model bahasa diunduh sekali dari CDN saat pertama dipilih (' + BAHASA.length + ' bahasa tersedia), lalu tersimpan di cache browser.'));
  root.appendChild(tabelChk);
  root.appendChild(out);
  root.appendChild(hasilBox);
  root.appendChild(histBox);
  tampilHist();

  // simpan cleanup untuk onLeave
  if (T.onLeave) T.onLeave(() => { lepas(); });
}
