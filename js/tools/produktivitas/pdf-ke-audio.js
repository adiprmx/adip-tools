import { h as T, utils, fileInput, LOCAL_NOTE } from '../../core.js';

// PDF ke Audio: bacakan isi PDF dengan suara. Teks diambil dengan pdf.js
// lalu dibacakan oleh suara bawaan browser (SpeechSynthesis).
// BATASAN JUJUR (ditulis juga di UI): suaranya tergantung HP/browser,
// tidak semua perangkat punya suara Bahasa Indonesia, dan audio tidak
// bisa disimpan jadi file MP3 dari sini. Teksnya tetap bisa diunduh.
// PDF hasil scan (isinya gambar) tidak punya teks untuk dibacakan.
export const meta = {"id": "pdf-ke-audio", "name": "PDF ke Audio", "cat": "produktivitas", "icon": "🔊", "desc": "Bacakan isi PDF dengan suara, langsung dari browser.", "keywords": "pdf ke audio,bacakan pdf,teks ke suara,pdf didengar", "since": "6.17.0", "online": true};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN = 100;
const MAKS_POTONG = 900;

// Potong teks jadi potongan siap dibaca, masing-masing di bawah batas,
// dipecah di akhir kalimat bila bisa. Murni, bisa diuji di Node.
export function teksKePotongan(teks, maks) {
  const batas = Math.max(100, Number(maks) || MAKS_POTONG);
  const kalimat = String(teks || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [];
  const potong = [];
  let jalan = '';
  const dorong = (s) => {
    const t = s.trim();
    if (t) potong.push(t);
  };
  for (const k of kalimat) {
    const kal = k.trim();
    if (!kal) continue;
    if (kal.length > batas) {
      // Kalimat super panjang: potong paksa per kata.
      if (jalan) { dorong(jalan); jalan = ''; }
      let sisa = kal;
      while (sisa.length > batas) {
        let pot = sisa.lastIndexOf(' ', batas);
        if (pot <= 0) pot = batas;
        dorong(sisa.slice(0, pot));
        sisa = sisa.slice(pot).trim();
      }
      jalan = sisa;
      continue;
    }
    const gabung = jalan ? jalan + ' ' + kal : kal;
    if (gabung.length > batas && jalan) {
      dorong(jalan);
      jalan = kal;
    } else {
      jalan = gabung;
    }
  }
  if (jalan) dorong(jalan);
  return potong;
}

// Kelompokkan potongan teks pdf.js jadi satu teks mengalir per halaman.
// Murni, bisa diuji di Node.
export function itemsKeTeks(items) {
  const urut = (items || []).slice().sort((a, b) => {
    const dy = (b.transform[5] || 0) - (a.transform[5] || 0);
    if (Math.abs(dy) > 2) return dy;
    return (a.transform[4] || 0) - (b.transform[4] || 0);
  });
  const baris = [];
  for (const it of urut) {
    const teks = String(it.str || '');
    if (!teks.trim()) continue;
    const y = it.transform[5] || 0;
    const x = it.transform[4] || 0;
    const h = Math.abs(it.transform[3] || it.height || 12) || 12;
    const lebar = it.width || teks.length * h * 0.5;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= Math.max(2, h * 0.4)) {
      terakhir.potong.push({ x, teks, lebar });
    } else {
      baris.push({ y, h, potong: [{ x, teks, lebar }] });
    }
  }
  const paragraf = [];
  let jalan = '';
  let ySebelumnya = null;
  for (const b of baris) {
    b.potong.sort((a, c) => a.x - c.x);
    let teksBaris = '';
    let ujung = null;
    for (const p of b.potong) {
      if (ujung !== null && p.x > ujung + 1) teksBaris += ' ';
      teksBaris += p.teks;
      ujung = p.x + p.lebar;
    }
    teksBaris = teksBaris.replace(/\s+/g, ' ').trim();
    if (!teksBaris) continue;
    if (ySebelumnya !== null && Math.abs(ySebelumnya - b.y) > b.h * 1.8 && jalan) {
      paragraf.push(jalan);
      jalan = '';
    }
    jalan = jalan ? jalan + ' ' + teksBaris : teksBaris;
    ySebelumnya = b.y;
  }
  if (jalan) paragraf.push(jalan);
  return paragraf.join('\n\n');
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const kecepatanSel = T.select([
    ['0.8', 'Pelan'],
    ['1', 'Normal'],
    ['1.25', 'Agak cepat'],
    ['1.5', 'Cepat'],
  ], '1');
  const suaraSel = T.select([['', 'Suara bawaan perangkat']], '');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  const kendaliBox = T.out();
  let potongan = [];
  let indeksJalan = -1;
  let sedangBaca = false;

  const ttsAda = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  // Loader library kanonis: utils.loadLibOnce (core.js).

  function muatSuara() {
    if (!ttsAda()) return;
    const daftar = window.speechSynthesis.getVoices() || [];
    const sekarang = suaraSel.value;
    suaraSel.innerHTML = '';
    const def = document.createElement('option');
    def.value = ''; def.textContent = 'Suara bawaan perangkat';
    suaraSel.appendChild(def);
    daftar.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = v.name + (v.lang ? ' (' + v.lang + ')' : '');
      suaraSel.appendChild(o);
    });
    // Pilih suara Indonesia bila ada.
    const idxId = daftar.findIndex((v) => /^id/i.test(v.lang || ''));
    if (idxId >= 0) suaraSel.value = String(idxId);
    else if (sekarang) suaraSel.value = sekarang;
  }

  function berhenti() {
    if (ttsAda()) window.speechSynthesis.cancel();
    sedangBaca = false;
    indeksJalan = -1;
    T.show(kendaliBox, '');
    kendaliBox.appendChild(T.btn('Bacakan dari Awal', () => mulaiBaca(0), true));
  }

  function mulaiBaca(dari) {
    if (!ttsAda()) { T.toast('Perangkat ini tidak punya suara bawaan'); return; }
    if (!potongan.length) { T.toast('Ambil teks PDF-nya dulu'); return; }
    window.speechSynthesis.cancel();
    sedangBaca = true;
    indeksJalan = dari;
    T.show(kendaliBox, '');
    kendaliBox.appendChild(T.btn('Berhenti', berhenti, true));
    kendaliBox.appendChild(T.el(`<span class="dim">Membacakan bagian ${dari + 1} dari ${potongan.length}…</span>`));
    bacaBerikutnya();
  }

  function bacaBerikutnya() {
    if (!sedangBaca || indeksJalan < 0 || indeksJalan >= potongan.length) {
      if (sedangBaca) { T.toast('Selesai dibacakan'); berhenti(); }
      return;
    }
    const u = new SpeechSynthesisUtterance(potongan[indeksJalan]);
    u.rate = Number(kecepatanSel.value) || 1;
    const daftar = window.speechSynthesis.getVoices() || [];
    if (suaraSel.value !== '' && daftar[Number(suaraSel.value)]) u.voice = daftar[Number(suaraSel.value)];
    else {
      const id = daftar.find((v) => /^id/i.test(v.lang || ''));
      if (id) { u.voice = id; u.lang = id.lang; }
    }
    u.onend = () => {
      if (!sedangBaca) return;
      indeksJalan++;
      const label = kendaliBox.querySelector('span');
      if (label && indeksJalan < potongan.length) label.textContent = `Membacakan bagian ${indeksJalan + 1} dari ${potongan.length}…`;
      bacaBerikutnya();
    };
    u.onerror = () => { if (sedangBaca) { T.toast('Suara berhenti, coba lagi'); berhenti(); } };
    window.speechSynthesis.speak(u);
  }

  T.onLeave(() => { if (ttsAda()) { try { window.speechSynthesis.cancel(); } catch (e) {} } });

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox); T.hide(kendaliBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; });
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      const semua = [];
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const teks = itemsKeTeks(konten.items || []);
        if (teks) semua.push(teks);
      }
      await doc.destroy();
      const gabung = semua.join('\n\n');
      if (!gabung.trim()) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      potongan = teksKePotongan(gabung, MAKS_POTONG);
      T.hide(statusBox);
      const adaSuara = ttsAda();
      T.show(box, `<p class="note">Teks dari <b>${total} halaman</b> siap dibacakan (${potongan.length} bagian).${adaSuara ? '' : '<br>Perangkat ini tidak punya suara bawaan, jadi teksnya hanya bisa diunduh.'}</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:300px;overflow:auto">${T.esc(gabung.slice(0, 6000))}${gabung.length > 6000 ? '\n…' : ''}</pre>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '.txt', gabung, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }));
      if (adaSuara) {
        T.show(kendaliBox, '');
        kendaliBox.appendChild(T.btn('Bacakan', () => mulaiBaca(0), true));
      }
      T.scrollToPreview(box);
    } catch (e) {
      const terkunci = e && e.name === 'PasswordException';
      T.show(statusBox, terkunci
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ambil Teks dan Siapkan Suara', proses, true);

  if (ttsAda()) {
    muatSuara();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = muatSuara;
    }
  }

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Suara yang dipakai adalah suara bawaan HP atau browsermu, jadi kualitasnya tergantung perangkat. Tidak semua perangkat punya suara Bahasa Indonesia, dan audio tidak bisa disimpan jadi file MP3 dari sini. Teksnya tetap bisa diunduh.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.grid2(T.field('Kecepatan baca', kecepatanSel), T.field('Suara', suaraSel)));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(kendaliBox);
  root.appendChild(hasilBox);
}
