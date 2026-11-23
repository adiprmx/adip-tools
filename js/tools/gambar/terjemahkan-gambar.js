import { h as T, utils, LOCAL_NOTE, fileInput, loadImage } from '../../core.js';

// Terjemahkan Gambar: baca teks dari foto (OCR) lalu terjemahkan.
// OCR memakai Tesseract.js, sama seperti tool OCR di repo ini: engine dan
// model bahasa diunduh sekali dari internet, lalu teks dibaca di perangkat.
// Terjemahan memakai MyMemory (kuota gratis IP bersama, terbatas harian).
// Bila OCR atau terjemahan tidak bisa jalan (tanpa internet / jatah habis),
// tool menampilkan pesan jujur, bukan hasil karangan.
export const meta = {"id": "terjemahkan-gambar", "name": "Terjemahkan Gambar", "cat": "gambar", "icon": "🌏", "desc": "Baca teks dari foto lalu terjemahkan ke bahasa lain.", "keywords": "terjemah,translate,ocr,teks gambar,bahasa,foto", "since": "6.19.0", "online": true};

const TS_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

export const BAHASA_OCR = [
  ['eng', 'Inggris'],
  ['ind', 'Indonesia'],
  ['jpn', 'Jepang'],
  ['kor', 'Korea'],
  ['chi_sim', 'Mandarin (sederhana)'],
  ['chi_tra', 'Mandarin (tradisional)'],
  ['ara', 'Arab'],
  ['deu', 'Jerman'],
  ['fra', 'Prancis'],
  ['spa', 'Spanyol'],
  ['nld', 'Belanda'],
  ['rus', 'Rusia'],
];

// Kode bahasa Tesseract (ISO 639-2/T, 3 huruf) -> kode MyMemory
// (ISO 639-1, 2 huruf). MyMemory menolak kode 3 huruf: tanpa pemetaan
// ini, terjemahan dari/ke Indonesia, Jepang, Korea, Jerman, Spanyol,
// Belanda, dan Rusia selalu gagal ("INVALID TARGET LANGUAGE"). Mandarin
// memakai kode wilayah: sederhana zh-CN, tradisional zh-TW.
export const KODE_MYMEMORY = {
  eng: 'en', ind: 'id', jpn: 'ja', kor: 'ko',
  chi_sim: 'zh-CN', chi_tra: 'zh-TW',
  ara: 'ar', deu: 'de', fra: 'fr', spa: 'es', nld: 'nl', rus: 'ru',
};
export function kodeMyMemory(kodeTesseract) {
  return KODE_MYMEMORY[kodeTesseract] || kodeTesseract;
}

// Potong teks jadi potongan <= batas karakter, diusahakan di batas kalimat
// atau kata (pola yang sama dengan penerjemah-pdf). Fungsi murni.
export function potongTeks(teks, batas) {
  const potongan = [];
  let sisa = (teks || '').trim();
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

// Apakah respons MyMemory menandakan jatah habis? Tiga tanda (pola yang
// sama dengan penerjemah-pdf): HTTP 429, quotaFinished, atau teks
// peringatan di dalam respons. Fungsi murni.
export function kuotaHabis(status, data, teks) {
  return status === 429 || (data && data.quotaFinished === true) ||
    (typeof teks === 'string' && /USED ALL AVAILABLE FREE TRANSLATIONS|MYMEMORY WARNING/i.test(teks));
}

// Rapikan hasil OCR: spasi sebelum tanda baca, spasi ganda, baris kosong
// berlebih. Fungsi murni.
export function rapikanTeksOcr(teks) {
  return (teks || '')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function terjemahkan(q, langpair, signal) {
  const res = await fetch(
    'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=' + encodeURIComponent(langpair),
    { signal },
  );
  let data = null;
  try { data = await res.json(); } catch (e) { /* respons bukan JSON */ }
  const teks = data && data.responseData && data.responseData.translatedText;
  if (kuotaHabis(res.status, data, teks)) {
    const e = new Error('Jatah terjemahan gratis hari ini habis. Coba lagi besok, atau salin teks hasil OCR dan terjemahkan di tempat lain.');
    e.quota = true;
    throw e;
  }
  if (!res.ok) throw new Error('Layanan terjemahan bermasalah (HTTP ' + res.status + ').');
  if (typeof teks !== 'string' || !teks.trim()) throw new Error('Layanan terjemahan tidak mengembalikan hasil.');
  if (/QUERY LENGTH LIMIT|INVALID TARGET LANGUAGE/i.test(teks)) throw new Error('Layanan terjemahan menolak permintaan ini.');
  return teks;
}

export function render(root) {
  const fi = fileInput('image/*');
  const ocrSel = T.select(BAHASA_OCR, 'eng');
  const targetSel = T.select([['id', 'Indonesia'], ['en', 'Inggris'], ['ja', 'Jepang'], ['ko', 'Korea'], ['es', 'Spanyol'], ['fr', 'Prancis'], ['de', 'Jerman'], ['ar', 'Arab']], 'id');
  const statusBox = T.out();
  const ocrBox = T.out();
  const hasilBox = T.out();
  const pratinjau = document.createElement('img');
  pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0';
  pratinjau.alt = 'Foto yang akan dibaca';
  let img = null, worker = null, workerLang = null, teksOcr = '';
  let aborter = null;

  async function siapkanOcr(lang, onProg) {
    if (worker && workerLang !== lang) {
      try { await worker.terminate(); } catch (e) {}
      worker = null;
    }
    if (worker) return worker;
    if (!window.Tesseract) {
      T.show(statusBox, '<p class="dim">Mengunduh engine baca teks (~3 MB, sekali saja, perlu internet)…</p>');
      // Loader kanonis: utils.loadLibOnce (core.js) — timeout 30 dtk.
      const ok = await utils.loadLibOnce(TS_CDN, () => !!window.Tesseract);
      if (!ok || !window.Tesseract) throw new Error('Engine baca teks gagal dimuat. Cek koneksi internetmu lalu coba lagi.');
    }
    T.show(statusBox, '<p class="dim">Menyiapkan model bahasa…</p>');
    worker = await window.Tesseract.createWorker(lang, window.Tesseract.OEM.LSTM, {
      logger: (m) => { if (m.status === 'recognizing text' && onProg) onProg(m.progress); },
    });
    workerLang = lang;
    return worker;
  }

  const ocrB = T.btn('Baca teks dari foto', async () => {
    if (!img) { T.toast('Pilih dulu fotonya.'); return; }
    ocrB.disabled = true;
    T.hide(ocrBox); T.hide(hasilBox);
    try {
      const w = await siapkanOcr(ocrSel.value, (p) => {
        T.show(statusBox, `<p class="dim">Membaca teks… ${Math.round(p * 100)}%</p>`);
      });
      T.show(statusBox, '<p class="dim">Membaca teks…</p>');
      const hasil = await w.recognize(img);
      teksOcr = rapikanTeksOcr(hasil && hasil.data ? hasil.data.text : '');
      T.hide(statusBox);
      if (!teksOcr) {
        T.show(ocrBox, '<div class="err">Tidak ada teks yang terbaca di foto ini. Coba foto yang tulisannya lebih jelas dan tegak.</div>');
        ocrB.disabled = false;
        return;
      }
      T.show(ocrBox, '');
      const label = T.el('<p style="margin:0 0 6px"><b>Teks yang terbaca</b> <span class="dim">(boleh diedit sebelum diterjemahkan)</span></p>');
      const ta = T.ta(5, '', teksOcr);
      ta.addEventListener('input', () => { teksOcr = ta.value; });
      const salinB = T.btn('Salin teks', () => { T.copy(teksOcr); });
      salinB.classList.add('small');
      ocrBox.appendChild(label); ocrBox.appendChild(ta); ocrBox.appendChild(salinB);
      const trB = T.btn('Terjemahkan', async () => {
        const teks = teksOcr.trim();
        if (!teks) { T.toast('Tidak ada teks untuk diterjemahkan.'); return; }
        trB.disabled = true;
        aborter = new AbortController();
        const timer = setTimeout(() => aborter.abort(), 30000);
        try {
          const potongan = potongTeks(teks, 450);
          const langpair = kodeMyMemory(ocrSel.value) + '|' + targetSel.value;
          const hasilTerjemah = [];
          for (let i = 0; i < potongan.length; i++) {
            T.show(statusBox, `<p class="dim">Menerjemahkan bagian ${i + 1} dari ${potongan.length}…</p>`);
            hasilTerjemah.push(await terjemahkan(potongan[i], langpair, aborter.signal));
          }
          clearTimeout(timer);
          T.hide(statusBox);
          const gabung = hasilTerjemah.join(' ');
          T.show(hasilBox, '');
          const jLabel = T.el('<p style="margin:12px 0 6px"><b>Hasil terjemahan</b></p>');
          const jTa = T.ta(5, '', gabung);
          jTa.readOnly = true;
          const jSalin = T.btn('Salin terjemahan', () => { T.copy(gabung); });
          jSalin.classList.add('small');
          hasilBox.appendChild(jLabel); hasilBox.appendChild(jTa); hasilBox.appendChild(jSalin);
        } catch (e) {
          clearTimeout(timer);
          T.hide(statusBox);
          T.show(hasilBox, '<div class="err">' + T.esc(e && e.name === 'AbortError' ? 'Terjemahan terlalu lama, coba lagi.' : (e && e.message ? e.message : 'Terjemahan gagal.')) + '</div>');
        }
        trB.disabled = false;
      }, true);
      ocrBox.appendChild(trB);
    } catch (e) {
      T.show(statusBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal membaca teks.') + '</div>');
    }
    ocrB.disabled = false;
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(ocrBox); T.hide(hasilBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      pratinjau.src = URL.createObjectURL(f);
      T.hide(statusBox);
      if (!pratinjau.parentNode) root.insertBefore(pratinjau, ocrB);
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Coba file gambar lain (JPG, PNG, atau WebP).</div>');
    }
    fi.value = '';
  });
  ocrSel.addEventListener('change', () => { teksOcr = ''; T.hide(ocrBox); T.hide(hasilBox); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Foto berisi tulisan (rambu, menu, tangkapan layar) dibaca dulu jadi teks, lalu diterjemahkan. Teks hasil baca bisa kamu perbaiki sebelum diterjemahkan.</p>'));
  root.appendChild(T.field('Pilih foto berisi tulisan', fi));
  root.appendChild(T.field('Bahasa tulisan di foto', ocrSel, 'Pilih yang benar supaya hasil bacanya akurat.'));
  root.appendChild(T.field('Terjemahkan ke', targetSel));
  root.appendChild(statusBox);
  root.appendChild(ocrB);
  root.appendChild(ocrBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">Membaca teks berjalan di perangkat setelah engine diunduh sekali. Teks dikirim ke layanan terjemahan MyMemory (jatah gratis bersama, bisa habis). ' + LOCAL_NOTE.replace('Semua diproses 100% lokal di HP kamu, file tidak diupload ke mana-mana.', 'Fotonya tidak diunggah ke mana-mana.') + '</p>'));
}
