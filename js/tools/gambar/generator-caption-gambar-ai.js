import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-caption-gambar-ai","name":"Generator Caption Gambar AI","cat":"gambar","icon":"🖼️","desc":"Caption untuk fotomu — AI melihat fotonya langsung, lalu menulis captionnya.","keywords":"caption,gambar,foto,deskripsi,ai,puter,vision","since":"6.18.0"};

const MAX_DESKRIPSI = 2000;
const MAX_MB = 10;
// Model vision untuk membaca foto (docs.puter.com/AI/chat/ + tutorial
// resmi Puter "Free, Unlimited OpenAI API", contoh "Analyze images",
// Nov 2026: gpt-6-luna dipakai untuk analisis gambar). Jalur vision
// mengikuti sintaks resmi: puter.ai.chat(prompt, media, testMode,
// { model }) — media bisa berupa objek File (dokumen resmi: "A string
// containing the URL or Puter path of an image or video, or a File
// object"). BELUM terverifikasi live (egress mati, tidak bisa uji
// login Puter) — bila panggilan vision gagal, tool jatuh ke jalur teks
// (dari deskripsi user) dan mengatakannya dengan jujur.
export const MODEL_VISION = 'gpt-6-luna';
const GAYA = [
  ['deskriptif', 'Deskriptif', 'deskriptif, menjelaskan isi foto dengan jelas'],
  ['santai', 'Santai', 'santai seperti sedang ngobrol dengan teman'],
  ['lucu', 'Lucu', 'lucu dan ringan'],
  ['informatif', 'Informatif', 'informatif, cocok untuk foto produk atau tempat'],
];
const JUMLAH = [
  ['1', '1 caption', '1'],
  ['3', '3 caption', '3'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Cek magic bytes: png/jpeg/gif/webp (pola aiimage.js).
export function cekGambarValid(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf || []);
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const gif = b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return !!(png || jpg || gif || webp);
}

// Pembentuk prompt murni (bisa diuji tanpa SDK).
// Jalur vision: foto dikirim sebagai File ke puter.ai.chat, AI membaca
// isi fotonya langsung; deskripsi user (bila ada) hanya konteks tambahan.
export function buatPromptVision(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[0];
  const konteks = (o && o.deskripsi) ? '\n\nKonteks tambahan dari pemilik foto: ' + o.deskripsi : '';
  return 'Lihat foto ini dengan saksama, lalu buatkan ' + j[2] + ' caption foto dalam Bahasa Indonesia dari ISI FOTO tersebut (apa yang terlihat: orang, benda, tempat, suasana, warna).' + konteks + '\n\n' +
    'Gayanya ' + g[2] + '. Tiap caption singkat, maksimal 2 kalimat, dan enak dibaca. ' +
    'Jawab HANYA dengan captionnya, satu per baris, tanpa penjelasan tambahan.';
}
// Jalur teks (tanpa foto / cadangan bila vision gagal): caption dibuat
// dari deskripsi yang ditulis user.
export function buatPrompt(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[0];
  return 'Buatkan ' + j[2] + ' caption foto dalam Bahasa Indonesia dari deskripsi berikut.\n\n' +
    'Deskripsi foto: ' + (o.deskripsi || '') + '\n\n' +
    'Gayanya ' + g[2] + '. Tiap caption singkat, maksimal 2 kalimat, dan enak dibaca. ' +
    'Jawab HANYA dengan captionnya, satu per baris, tanpa penjelasan tambahan.';
}

// Batasi waktu tunggu AI; timer dibersihkan begitu salah satu sisi menang
// supaya tidak ada timer menggantung (di Node, timer 60 dtk yang tidak
// dibersihkan menahan proses; di browser ini kebocoran kecil).
function denganTimeout(promise, ms, pesan) {
  let timer = null;
  const batas = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(pesan)), ms); });
  return Promise.race([Promise.resolve(promise), batas]).finally(() => { if (timer) clearTimeout(timer); });
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  let fotoFile = null;
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Unggah fotomu, lalu AI melihat isi fotonya langsung dan menulis captionnya. Boleh tambah deskripsi singkat sebagai konteks (misal: acaranya apa, buat siapa). Tanpa foto, AI menulis dari deskripsimu saja. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Foto dan teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Foto ---------- */
  const fotoLabel = T.el('<label style="display:block;border:1.5px dashed #ffffff30;border-radius:10px;padding:14px;text-align:center;cursor:pointer;font-size:13px">Pilih foto<div class="dim" style="font-size:11.5px;margin-top:2px">PNG, JPG, atau WebP, maks ' + MAX_MB + ' MB</div></label>');
  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/png,image/jpeg,image/webp'; fileInp.style.display = 'none';
  fotoLabel.appendChild(fileInp);
  root.appendChild(fotoLabel);
  const preview = document.createElement('img');
  preview.alt = 'Foto yang diunggah';
  preview.style.cssText = 'display:none;width:100%;max-height:240px;object-fit:cover;border-radius:10px;border:1px solid #ffffff20;margin-top:8px';
  root.appendChild(preview);

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  fileInp.addEventListener('change', async () => {
    const f = fileInp.files && fileInp.files[0];
    fileInp.value = '';
    if (!f || busy) return;
    if (!f.size || f.size > MAX_MB * 1024 * 1024) { setStatus('Ukuran foto harus di bawah ' + MAX_MB + ' MB.', 'err'); return; }
    try {
      const buf = new Uint8Array(await f.slice(0, 32).arrayBuffer());
      if (!cekGambarValid(buf)) { setStatus('File ini bukan gambar yang valid. Pakai PNG, JPG, atau WebP.', 'err'); return; }
      const du = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || ''));
        r.onerror = () => rej(new Error('gagal membaca foto'));
        r.readAsDataURL(f);
      });
      fotoFile = f;
      preview.src = du;
      preview.style.display = '';
      setStatus('Foto siap. AI akan membaca isi fotonya langsung.', 'ok');
    } catch (e) { setStatus('Foto belum bisa dibaca. Coba foto lain.', 'err'); }
  });

  /* ---------- Deskripsi ---------- */
  const deskTa = T.ta(3, 'Konteks tambahan (opsional)…\nContoh: Foto ini buat postingan ulang tahun adikku, acaranya di rumah.');
  deskTa.maxLength = MAX_DESKRIPSI;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_DESKRIPSI + '</div>');
  deskTa.addEventListener('input', () => { hitung.textContent = deskTa.value.length + ' / ' + MAX_DESKRIPSI; });
  root.appendChild(T.field('Deskripsi / konteks (opsional bila foto sudah diunggah)', deskTa));
  root.appendChild(hitung);

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'deskriptif');
  root.appendChild(T.field('Gaya caption', gayaSel));

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '1');
  root.appendChild(T.field('Jumlah caption', jumlahSel));

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil caption</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Buat lagi', () => jalan()));
    out.appendChild(row);
    setStatus('Selesai dalam ' + detik + ' detik.', 'ok');
  }

  function tampilError(pesan) {
    T.show(out,
      '<div class="err" style="border:1px solid #ff6b6b40;border-radius:10px;padding:12px;font-size:13px;line-height:1.6">' + T.esc(pesan) + '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.btn('Coba lagi', () => jalan(), true));
    out.appendChild(row);
    setStatus('', '');
  }

  async function jalan() {
    if (busy || !alive) return;
    const deskripsi = deskTa.value.trim();
    const pakaiVision = !!fotoFile;
    if (!pakaiVision && deskripsi.length < 10) { setStatus('Unggah fotonya, atau ceritakan isi fotonya sedikit lebih lengkap (minimal 10 huruf).', 'err'); deskTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus(pakaiVision ? 'AI sedang melihat fotomu…' : 'AI sedang menulis captionnya…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        let hasil = '';
        let dariVision = false;
        let jatuhKeTeks = false;
        if (pakaiVision) {
          // Jalur vision: foto dikirim sebagai File (docs.puter.com/AI/chat/).
          try {
            const promptV = buatPromptVision({ deskripsi, gaya: gayaSel.value, jumlah: jumlahSel.value });
            const resV = await denganTimeout(
              window.puter.ai.chat(promptV, fotoFile, false, { model: MODEL_VISION }),
              60000, 'TIMEOUT: AI tidak merespons dalam 60 detik.');
            hasil = utils.chatText(resV).trim();
            dariVision = !!hasil;
          } catch (eV) {
            // Vision gagal: jatuh ke jalur teks bila ada deskripsi,
            // dan katakan dengan jujur di status. Tanpa deskripsi,
            // lemparkan error aslinya.
            if (deskripsi.length >= 10) {
              jatuhKeTeks = true;
            } else {
              throw eV;
            }
          }
        }
        if (!hasil) {
          const prompt = buatPrompt({ deskripsi, gaya: gayaSel.value, jumlah: jumlahSel.value });
          const res = await denganTimeout(
            window.puter.ai.chat(prompt, {}),
            60000, 'TIMEOUT: AI tidak merespons dalam 60 detik.');
          hasil = utils.chatText(res).trim();
        }
        if (!hasil) throw new Error('Puter mengembalikan respons kosong.');
        if (!alive) return;
        const detik = ((performance.now() - t0) / 1000).toFixed(1);
        tampilHasil(hasil, detik);
        if (dariVision) setStatus('Selesai dalam ' + detik + ' detik. AI membaca fotomu langsung.', 'ok');
        else if (jatuhKeTeks) setStatus('Selesai dalam ' + detik + ' detik. Foto tidak bisa dibaca AI, caption dibuat dari deskripsimu.', '');
      } catch (e) {
        if (alive) tampilError(utils.errPesan(e));
      } finally {
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Caption'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Caption', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
