import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "penerjemah-pdf", "name": "Penerjemah PDF", "cat": "converter", "icon": "🌏", "desc": "Terjemahkan isi PDF ke bahasa lain, hasilnya tetap PDF.", "keywords": "terjemah,pdf,bahasa,inggris,indonesia,dokumen", "since": "6.19.0"};

// pdf.js 3.11.174 + pdf-lib 1.17.1. Hash SRI keduanya ada di peta SRI_HASH core.js.
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
// MyMemory membatasi tiap permintaan sampai 500 karakter dan punya jatah
// harian untuk pemakaian tanpa akun. Potong di 450 supaya aman.
const MAKS_POTONG = 450;
const MAKS_HALAMAN = 20;
const MAKS_KARAKTER = 10000;

// Potong teks jadi potongan <= maks, sebisa mungkin di batas kalimat.
// Fungsi murni, diuji di Node.
export function potongTeks(teks, maks) {
  const batas = Math.max(50, maks || MAKS_POTONG);
  const s = String(teks || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  if (s.length <= batas) return [s];
  const potongan = [];
  let sisa = s;
  while (sisa.length > batas) {
    let potong = sisa.lastIndexOf('. ', batas);
    if (potong < batas * 0.4) potong = sisa.lastIndexOf(' ', batas);
    if (potong < batas * 0.4) potong = batas;
    else potong += 1;
    potongan.push(sisa.slice(0, potong).trim());
    sisa = sisa.slice(potong).trim();
  }
  if (sisa) potongan.push(sisa);
  return potongan;
}

async function terjemahkan(q, langpair, signal) {
  const res = await fetch(
    'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=' + encodeURIComponent(langpair),
    { signal },
  );
  let data = null;
  try { data = await res.json(); } catch (e) { /* respons bukan JSON */ }
  const teks = data && data.responseData && data.responseData.translatedText;
  // Jatah habis dikenali dari TIGA tanda, karena API tidak konsisten:
  // HTTP 429, quotaFinished true, atau teks peringatan di dalam respons
  // (terbukti 19 Nov 2026: 429 + "YOU USED ALL AVAILABLE FREE
  // TRANSLATIONS FOR TODAY" dengan quotaFinished null).
  const habis = res.status === 429 || (data && data.quotaFinished === true) ||
    (typeof teks === 'string' && /USED ALL AVAILABLE FREE TRANSLATIONS|MYMEMORY WARNING/i.test(teks));
  if (habis) {
    const e = new Error('Jatah terjemahan hari ini habis, coba lagi besok');
    e.quota = true;
    throw e;
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  if (typeof teks !== 'string' || !teks.trim()) throw new Error('Respons API tidak valid.');
  if (/QUERY LENGTH LIMIT|INVALID TARGET LANGUAGE/i.test(teks)) throw new Error('Respons API tidak valid.');
  return teks;
}

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.pdf,application/pdf';
  const arahSel = T.select([
    ['en|id', 'Inggris ke Indonesia'],
    ['id|en', 'Indonesia ke Inggris'],
  ], 'en|id');
  const box = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  let fileObj = null, busy = false, ctl = null;

  let libSiap = null;
  const muatLib = () => {
    if (!libSiap) {
      libSiap = (async () => {
        // Loader library kanonis: utils.loadLibOnce (core.js).
        if (!(await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }))) return false;
        if (!(await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib))) return false;
        return true;
      })().catch(() => { libSiap = null; return false; });
    }
    return libSiap;
  };

  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const proses = async () => {
    if (busy) return;
    if (!fileObj) { T.show(box, errBox('Pilih dulu file PDF-nya.')); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(box);
    ctl = new AbortController();
    try {
      setStage('Memuat alat baca PDF…', 0);
      const ok = await muatLib();
      if (!ok) { T.show(box, errBox('Alat baca PDF tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.')); return; }
      const data = new Uint8Array(await fileObj.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const totalHalaman = Math.min(doc.numPages, MAKS_HALAMAN);
      if (doc.numPages > MAKS_HALAMAN) {
        T.show(box, '<p class="warn" style="font-size:13px;line-height:1.6">PDF ini ' + doc.numPages + ' halaman. Hanya ' + MAKS_HALAMAN + ' halaman pertama yang diterjemahkan supaya tidak menghabiskan jatah harian.</p>');
      }
      let teksAsli = '';
      for (let i = 1; i <= totalHalaman; i++) {
        if (ctl.signal.aborted) throw new Error('Dibatalkan.');
        setStage('Membaca halaman ' + i + ' dari ' + totalHalaman + '…', Math.round((i / totalHalaman) * 20));
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const teksHalaman = konten.items.map((it) => it.str || '').join(' ');
        teksAsli += (i > 1 ? '\n\n' : '') + teksHalaman;
      }
      teksAsli = teksAsli.replace(/\s+/g, ' ').trim();
      if (!teksAsli) {
        T.show(box, errBox('Tidak ada teks yang bisa dibaca dari PDF ini. PDF hasil scan atau berisi gambar saja tidak bisa diterjemahkan di sini.'));
        return;
      }
      if (teksAsli.length > MAKS_KARAKTER) {
        T.show(box, errBox('Teks PDF ini ' + teksAsli.length.toLocaleString('id-ID') + ' karakter, melebihi batas ' + MAKS_KARAKTER.toLocaleString('id-ID') + ' karakter per dokumen. Bagi PDF jadi beberapa file lalu terjemahkan satu per satu.'));
        return;
      }
      const potongan = potongTeks(teksAsli, MAKS_POTONG);
      const hasil = [];
      for (let i = 0; i < potongan.length; i++) {
        if (ctl.signal.aborted) throw new Error('Dibatalkan.');
        setStage('Menerjemahkan bagian ' + (i + 1) + ' dari ' + potongan.length + '…', 20 + Math.round(((i + 1) / potongan.length) * 60));
        const potongCtl = new AbortController();
        const tmr = setTimeout(() => potongCtl.abort(), 30000);
        try {
          hasil.push(await terjemahkan(potongan[i], arahSel.value, potongCtl.signal));
        } finally {
          clearTimeout(tmr);
        }
        if (i < potongan.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
      const teksHasil = hasil.join(' ');
      setStage('Menyusun PDF hasil…', 90);
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const pdfBaru = await PDFDocument.create();
      const font = await pdfBaru.embedFont(StandardFonts.Helvetica);
      const LEBAR = 595.28, TINGGI = 841.89, MARGIN = 56;
      const lebarTeks = LEBAR - MARGIN * 2;
      const sanitasi = (s) => {
        let hasil = '';
        for (const ch of String(s || '')) {
          const kode = ch.codePointAt(0);
          if (kode <= 255) { hasil += ch; continue; }
          if (ch === '‘' || ch === '’') { hasil += "'"; continue; }
          if (ch === '“' || ch === '”') { hasil += '"'; continue; }
          if (ch === '–' || ch === '—') { hasil += '-'; continue; }
          if (ch === '…') { hasil += '...'; continue; }
          hasil += '?';
        }
        return hasil;
      };
      let page = pdfBaru.addPage([LEBAR, TINGGI]);
      let y = TINGGI - MARGIN;
      const kata = sanitasi(teksHasil).split(/\s+/).filter(Boolean);
      let baris = '';
      const tulis = (t) => {
        if (y - 12 < MARGIN) { page = pdfBaru.addPage([LEBAR, TINGGI]); y = TINGGI - MARGIN; }
        page.drawText(t, { x: MARGIN, y: y - 12, size: 11.5, font, color: rgb(0.1, 0.1, 0.1) });
        y -= 16;
      };
      for (const k of kata) {
        const coba = baris ? baris + ' ' + k : k;
        if (font.widthOfTextAtSize(coba, 11.5) <= lebarTeks || !baris) { baris = coba; continue; }
        tulis(baris);
        baris = k;
      }
      if (baris) tulis(baris);
      const bytes = await pdfBaru.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'dokumen';
      const arah = arahSel.value === 'en|id' ? 'id' : 'en';
      T.dl(base + '-terjemahan-' + arah + '.pdf', blob, 'application/pdf');
      T.show(box, '<span class="ok">Selesai. PDF terjemahan terunduh.</span>' +
        kv('Halaman diterjemahkan', totalHalaman + ' halaman') +
        kv('Karakter', teksAsli.length.toLocaleString('id-ID') + ' karakter') +
        kv('Ukuran PDF', fmtBytes(blob.size)) +
        '<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0">Terjemahan mesin bisa kurang tepat untuk istilah khusus. Periksa lagi sebelum dipakai resmi.</p>');
      T.toast('PDF terjemahan terunduh');
    } catch (e) {
      if (ctl && ctl.signal.aborted) { T.show(box, '<span class="dim">Dibatalkan.</span>'); }
      else if (e && e.quota) { T.show(box, errBox('Jatah terjemahan gratis hari ini sudah habis. Coba lagi besok, atau bagi dokumen jadi bagian yang lebih kecil.')); }
      else if (e && e.name === 'AbortError') { T.show(box, errBox('Waktu habis saat menerjemahkan. Periksa koneksi internet lalu coba lagi.')); }
      else if (e && /Dibatalkan/.test(e.message || '')) { T.show(box, '<span class="dim">Dibatalkan.</span>'); }
      else { T.show(box, errBox('PDF tidak bisa diterjemahkan. Coba lagi, atau cek koneksi internet.')); }
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  };

  const goBtn = T.btn('Terjemahkan PDF', proses, true);
  const cancelBtn = T.btn('Batalkan', () => { if (ctl) ctl.abort(); });
  cancelBtn.hidden = true;

  fi.addEventListener('change', () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    T.hide(box);
    if (!fileObj) return;
    T.show(box, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)));
  });

  T.onLeave(() => { if (ctl) ctl.abort(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Teks PDF dibaca lalu diterjemahkan bagian per bagian, hasilnya disusun jadi PDF baru. Layanan terjemahannya gratis dan punya jatah harian: kalau jatah hari ini habis, muncul pesan dan kamu bisa coba lagi besok. Maksimal 20 halaman dan 10.000 karakter per dokumen.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi, 'PDF berisi teks. PDF hasil scan tidak bisa dibaca.'));
  root.appendChild(T.field('Arah terjemahan', arahSel));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Teks dikirim ke layanan terjemahan MyMemory untuk diterjemahkan. Tata letak, gambar, dan tabel asli tidak ikut ke PDF hasil.</p>'));
}
