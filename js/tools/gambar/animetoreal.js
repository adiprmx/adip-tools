import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"animetoreal","name":"Anime to Real","cat":"gambar","icon":"🧑‍🎨","desc":"Ubah ilustrasi anime jadi foto realistik via akun Puter milikmu.","keywords":"anime,realistik,foto,ai,konversi,puter"};

const MAX_MB = 12;
const MAX_UPLOAD_BYTES = 2.35 * 1024 * 1024;
const MAX_EDGE = 1600;
const TIMEOUT_MS = 65 * 1000;

// Kecilkan client-side: sisi terpanjang maks 1600px, JPEG q0.86 (q0.7 bila masih >2.35MB).
function siapkanGambar(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h || w > 12000 || h > 12000) throw new Error('Dimensi gambar tidak didukung.');
        if (Math.max(w, h) > MAX_EDGE) {
          const k = MAX_EDGE / Math.max(w, h);
          w = Math.round(w * k); h = Math.round(h * k);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('Browser tidak bisa menyiapkan gambar.');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob((b1) => {
          if (!b1) return rej(new Error('Gambar gagal disiapkan.'));
          const selesai = (b) => {
            const r = new FileReader();
            r.onload = () => res({ dataUrl: String(r.result), bytes: b.size });
            r.onerror = () => rej(new Error('Gambar gagal dibaca.'));
            r.readAsDataURL(b);
          };
          if (b1.size > MAX_UPLOAD_BYTES) {
            c.toBlob((b2) => {
              if (!b2 || b2.size > MAX_UPLOAD_BYTES) return rej(new Error('Gambar masih terlalu besar setelah diperkecil.'));
              selesai(b2);
            }, 'image/jpeg', 0.7);
          } else selesai(b1);
        }, 'image/jpeg', 0.86);
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibuka.')); };
    img.src = url;
  });
}
function errPesan(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  const raw = String(n.code || r.code || n.message || r.message || e || '').toLowerCase();
  if (/abort|timeout|timed out/.test(raw)) return 'Proses terlalu lama (maks ~65 detik). Coba lagi.';
  if (/popup|blocked/.test(raw)) return 'Jendela login diblokir browser. Izinkan pop-up lalu coba lagi.';
  if (/401|403|unauthor|auth|sign.?in|login|cancel|closed|denied/.test(raw)) return 'Hubungkan akun Puter terlebih dahulu.';
  if (/402|allowance|credit|quota|insufficient|payment|fund/.test(raw)) return 'Allowance Puter habis / tidak cukup.';
  if (/429|rate|too many/.test(raw)) return 'Terlalu banyak permintaan. Coba lagi sebentar.';
  if (/safety|moderation|policy|filtered|rai/.test(raw)) return 'Gambar ditolak aturan keamanan AI.';
  if (/model not found|unknown model|model.*unavailable|unsupported model|no provider/.test(raw)) return 'Model AI sedang tidak tersedia.';
  if (/network|failed to fetch|offline/.test(raw)) return 'Koneksi ke Puter terputus.';
  return 'Konversi gagal. Coba lagi.';
}
const urlValid = (v) => {
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password;
  } catch (e) { return false; }
};

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false;
  let sourceMode = 'url'; // 'url' | 'file'
  let fileData = '', fileName = '', fileBytes = 0, previewAsli = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload ilustrasi anime (atau tempel URL file gambar) — AI mengubahnya jadi foto realistik. ' +
    'Pakai <b>akun Puter milikmu</b>. Gambar diperkecil otomatis (sisi maks 1600px) agar hemat kuota.</p>'));

  /* ---------- Input URL ---------- */
  const urlInp = T.input('url', 'https://… (link file gambar langsung)');
  urlInp.maxLength = 4096;
  urlInp.autocomplete = 'off'; urlInp.spellcheck = false;
  const pasteBtn = T.btn('Tempel', async () => {
    if (busy || !navigator.clipboard || !navigator.clipboard.readText) { T.toast('Clipboard tidak bisa dibaca'); return; }
    try {
      const t = (await navigator.clipboard.readText() || '').trim();
      if (!t) { pesan('Clipboard kosong.', 'err'); return; }
      urlInp.value = t;
      if (urlValid(t)) {
        sourceMode = 'url'; previewAsli = t; pesan('', '');
      } else {
        pesan('Clipboard tidak berisi URL gambar yang valid.', 'err');
      }
      gambarAsli();
    } catch (e) { T.toast('Clipboard tidak bisa dibaca'); }
  });
  urlInp.addEventListener('input', () => {
    const v = urlInp.value.trim();
    if (!fileData) sourceMode = 'url';
    if (v && urlValid(v) && sourceMode === 'url') { previewAsli = v; pesan('', ''); }
    gambarAsli();
  });
  const uf = T.field('URL gambar', urlInp, 'Link file gambar langsung — bukan halaman Pinterest/Google.');
  uf.appendChild(T.el('<div style="height:6px"></div>'));
  uf.appendChild(pasteBtn);
  root.appendChild(uf);
  root.appendChild(T.el('<div class="dim center" style="margin:8px 0;font-size:12.5px">— atau —</div>'));

  /* ---------- Upload file ---------- */
  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'; fileInp.style.display = 'none';
  const pilihBtn = T.btn('Pilih Gambar', () => { if (!busy) fileInp.click(); });
  const fileMeta = T.el('<button type="button" style="flex:1;min-width:0;text-align:left;background:none;border:none;color:inherit;cursor:pointer;padding:0"></button>');
  const fmNama = T.el('<div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Belum ada gambar dipilih</div>');
  const fmUkuran = T.el('<div class="dim" style="font-size:12px">JPG, PNG, atau WebP</div>');
  fileMeta.appendChild(fmNama); fileMeta.appendChild(fmUkuran);
  const hapusFileBtn = T.btn('Hapus', () => { bersihFile(); });
  hapusFileBtn.style.display = 'none';
  const upBox = T.el('<div style="display:flex;gap:8px;align-items:center;border:1px solid #ffffff14;border-radius:10px;padding:8px"></div>');
  upBox.appendChild(pilihBtn); upBox.appendChild(fileMeta); upBox.appendChild(hapusFileBtn);
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin-bottom:4px">Upload gambar</div>'));
  root.appendChild(upBox);
  root.appendChild(fileInp);
  root.appendChild(T.el('<div class="dim" style="font-size:11.5px;margin-top:4px">JPG/PNG/WebP, maks ' + MAX_MB + ' MB.</div>'));

  function bersihFile() {
    fileData = ''; fileName = ''; fileBytes = 0;
    fileInp.value = '';
    sourceMode = 'url';
    previewAsli = urlValid(urlInp.value.trim()) ? urlInp.value.trim() : '';
    fmNama.textContent = 'Belum ada gambar dipilih';
    fmUkuran.textContent = 'JPG, PNG, atau WebP';
    pilihBtn.textContent = 'Pilih Gambar';
    hapusFileBtn.style.display = 'none';
    gambarAsli();
  }
  fileInp.addEventListener('change', async () => {
    const f = fileInp.files && fileInp.files[0];
    fileInp.value = '';
    if (!f || busy) return;
    pilihBtn.disabled = true; pilihBtn.textContent = 'Menyiapkan…';
    try {
      if (!f.size || f.size > MAX_MB * 1024 * 1024) throw new Error('Gambar asli terlalu besar. Maksimal ' + MAX_MB + ' MB.');
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error('Format harus JPG, PNG, atau WebP.');
      const siap = await siapkanGambar(f);
      if (!alive) return;
      fileData = siap.dataUrl; fileName = String(f.name || 'gambar-anime.jpg').slice(0, 90); fileBytes = siap.bytes;
      sourceMode = 'file'; previewAsli = fileData;
      fmNama.textContent = fileName;
      fmUkuran.textContent = Math.max(1, Math.round(fileBytes / 1024)) + ' KB · siap dikirim';
      pilihBtn.textContent = 'Ganti Gambar';
      hapusFileBtn.style.display = '';
      pesan('', '');
      T.toast('Gambar siap diproses');
    } catch (e) {
      bersihFile();
      pesan(T.esc(e.message || 'Gambar tidak dapat disiapkan.'), 'err');
    } finally {
      pilihBtn.disabled = false;
      if (!fileData) pilihBtn.textContent = 'Pilih Gambar';
      gambarAsli();
    }
  });
  fileMeta.addEventListener('click', () => { if (fileData && !busy) { sourceMode = 'file'; previewAsli = fileData; gambarAsli(); } });
  hapusFileBtn.addEventListener('click', () => { if (!busy) bersihFile(); });

  /* ---------- Preview ORIGINAL ---------- */
  const asliWrap = T.el('<div style="display:none;margin-top:10px"></div>');
  const asliLabel = T.el('<div class="dim" style="font-size:11.5px;font-weight:700;letter-spacing:.5px;margin-bottom:4px">ORIGINAL</div>');
  const asliImg = document.createElement('img');
  asliImg.alt = 'Gambar anime asli';
  asliImg.style.cssText = 'max-width:100%;max-height:280px;border-radius:10px;display:block;margin:0 auto;border:1px solid #ffffff14';
  asliWrap.appendChild(asliLabel); asliWrap.appendChild(asliImg);
  root.appendChild(asliWrap);
  function gambarAsli() {
    if (previewAsli) { asliWrap.style.display = ''; asliImg.src = previewAsli; }
    else { asliWrap.style.display = 'none'; asliImg.removeAttribute('src'); }
  }

  /* ---------- Aksi ---------- */
  const goBtn = T.btn('Ubah jadi realistik', () => jalan(), true);
  const pesanBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const pesan = (t, cls) => { if (alive) pesanBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(goBtn));
  root.appendChild(pesanBox);
  const out = T.out();
  root.appendChild(out);

  async function ambilSumber() {
    if (sourceMode === 'file' && fileData) return fileData;
    const u = urlInp.value.trim();
    if (!u) throw new Error('Pilih file atau tempel URL gambar dulu.');
    if (u.length > 4096 || !urlValid(u)) throw new Error('URL gambar tidak valid.');
    let r;
    try { r = await fetch(u); }
    catch (e) { throw new Error('URL tidak bisa diambil (kemungkinan diblokir CORS). Unduh gambarnya lalu upload sebagai file.'); }
    if (!r.ok) throw new Error('URL gambar tidak bisa diakses (HTTP ' + r.status + ').');
    const b = await r.blob();
    if (!/^image\//.test(b.type)) throw new Error('URL itu bukan file gambar langsung (terdeteksi: ' + (b.type || 'tak dikenal') + '). Pakai link file gambar, bukan halaman web.');
    if (b.size > MAX_MB * 1024 * 1024) throw new Error('Gambar dari URL melebihi ' + MAX_MB + ' MB.');
    const siap = await siapkanGambar(new File([b], 'gambar', { type: b.type }));
    return siap.dataUrl;
  }

  async function jalan() {
    if (busy || !alive) return;
    await puter.need(async () => {
      busy = true; goBtn.disabled = true; goBtn.textContent = 'Mengonversi…';
      pesan('Gambar sedang diproses. Proses dapat membutuhkan waktu hingga satu menit.', '');
      try {
        const srcAsli = await ambilSumber();
        if (!alive) return;
        previewAsli = srcAsli; gambarAsli();
        const prompt = 'Convert this anime illustration into a photorealistic photograph. Keep the same composition, pose, colors and mood; realistic skin, natural lighting, photographic detail. Output photo only.';
        const req = window.puter.ai.txt2img(prompt, { input_image: srcAsli, input_image_mime_type: 'image/jpeg' });
        const res = await Promise.race([
          Promise.resolve(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), TIMEOUT_MS)),
        ]);
        const src = utils.puter.srcOf(res);
        if (!src) throw new Error('Puter tidak mengembalikan gambar.');
        if (!alive) return;
        T.show(out, '');
        const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
        [['ORIGINAL', srcAsli], ['HASIL REALISTIK', src]].forEach(([label, s]) => {
          const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden"></div>');
          card.appendChild(T.el('<div class="dim" style="font-size:11.5px;font-weight:700;padding:6px 8px;letter-spacing:.5px">' + label + '</div>'));
          const img = document.createElement('img');
          img.src = s; img.alt = label; img.referrerPolicy = 'no-referrer';
          img.style.cssText = 'width:100%;height:auto;display:block';
          card.appendChild(img);
          grid.appendChild(card);
        });
        out.appendChild(grid);
        const rw = T.el('<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;justify-content:center"></div>');
        rw.appendChild(T.btn('Buka gambar hasil', () => window.open(src, '_blank', 'noopener')));
        rw.appendChild(T.btn('Unduh hasil', () => utils.dlUrl(src, 'anime-to-real-' + Date.now() + '.png'), true));
        rw.appendChild(T.copyBtn(() => src, 'Salin link hasil'));
        rw.appendChild(T.btn('Konversi lain', () => { T.hide(out); bersihFile(); urlInp.value = ''; previewAsli = ''; gambarAsli(); }));
        out.appendChild(rw);
        out.appendChild(T.el(utils.puter.poweredBy()));
        out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        pesan('Konversi selesai.', 'ok');
      } catch (e) {
        if (alive) pesan(errPesan(e), 'err');
      } finally {
        if (alive) { busy = false; goBtn.disabled = false; goBtn.textContent = 'Ubah jadi realistik'; }
      }
    });
  }

  root.appendChild(T.el(utils.puter.poweredBy()));
}
