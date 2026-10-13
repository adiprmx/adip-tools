import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"aivideo","name":"AI Video","cat":"gambar","icon":"🎬","desc":"Generate video AI (teks/gambar jadi video) pakai akun Puter milikmu.","keywords":"ai,video,generator,sora,veo,puter"};

const MAX_PROMPT = 3000;
const MAX_IMG_MB = 10;
const TIMEOUT_MS = 11 * 60 * 1000;

// Model video Puter (ID publik). imageInput: format referensi yg dipakai tiap model.
const MODELS = [
  { id: 'sora-2', label: 'Sora 2', detail: 'Seimbang', imageInput: 'file', cost: 0.10, durations: [4, 8, 12] },
  { id: 'sora-2-pro', label: 'Sora 2 Pro', detail: 'Kualitas tinggi', imageInput: 'file', cost: 0.30, durations: [4, 8, 12] },
  { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast', detail: 'Lebih cepat', imageInput: 'data-uri', cost: 0.15, durations: [4, 6, 8] },
  { id: 'veo-3.1-generate-preview', label: 'Veo 3.1', detail: 'Kualitas tinggi', imageInput: 'data-uri', cost: 0.40, durations: [4, 6, 8] },
];
const SIZES = { '9:16': '720x1280', '16:9': '1280x720' };
const modelById = (id) => MODELS.find((m) => m.id === id) || MODELS[0];

function errInfo(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  return {
    code: String(n.errorCode || n.code || r.errorCode || r.code || '').toLowerCase(),
    status: Number(n.status || r.status || 0) || 0,
    message: String(n.message || r.message || (typeof r.error === 'string' ? r.error : '') || e || '').slice(0, 240),
  };
}
function errPesan(e) {
  const d = errInfo(e);
  const raw = (d.code + ' ' + d.status + ' ' + d.message).toLowerCase();
  if (/popup|blocked/.test(raw)) return 'Jendela login diblokir browser. Izinkan pop-up lalu coba lagi.';
  if (/email_must_be_confirmed|confirm.*email|email.*confirm/.test(raw)) return 'Email akun Puter belum dikonfirmasi.';
  if (d.status === 401 || d.status === 403 || /unauthor|auth|sign.?in|login|cancel|closed|denied/.test(raw)) return 'Login Puter diperlukan — tekan "Hubungkan ulang" bila sesi kedaluwarsa.';
  if (d.status === 402 || /allowance|credit|quota|insufficient|payment|fund/.test(raw)) return 'Allowance atau credit Puter tidak cukup untuk membuat video ini.';
  if (d.status === 429 || /rate|too many|concurren/.test(raw)) return 'Permintaan terlalu banyak. Coba lagi nanti.';
  if (/safety|moderation|policy|filtered|rai|disallowed/.test(raw)) return 'Prompt atau gambar ditolak oleh aturan keamanan model.';
  if (/timeout|timed out/.test(raw)) return 'Pembuatan video melewati batas waktu. Silakan coba lagi.';
  if (/model not found|unknown.*model|model.*unavailable|unsupported model|no provider/.test(raw)) return 'Model video sedang tidak tersedia. Coba model lain.';
  if (/network|fetch|offline/.test(raw)) return 'Koneksi ke layanan video terputus. Periksa internet lalu coba lagi.';
  return 'Video gagal dibuat. Coba lagi.';
}
// Validasi magic bytes: jpeg/png/webp.
async function validasiGambar(file) {
  if (!file || !file.size) throw new Error('Pilih gambar referensi terlebih dahulu.');
  if (file.size > MAX_IMG_MB * 1024 * 1024) throw new Error('Ukuran gambar maksimal ' + MAX_IMG_MB + ' MB.');
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (!jpg && !png && !webp) throw new Error('Gambar referensi harus JPG, PNG, atau WebP yang valid.');
  return file;
}
function dataUrlOf(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.onerror = () => rej(new Error('gagal membaca gambar'));
    r.readAsDataURL(file);
  });
}
const fmtBytes = (v) => v >= 1048576 ? (v / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(v / 1024)) + ' KB';
const fmtUsd = (v) => '$' + Number(v || 0).toFixed(2);

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, mode = 'text';
  let refFile = null, refDataUrl = '', refObjUrl = '';
  let resultUrl = '', resultOwnsUrl = false;
  let genToken = 0;
  const timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
  T.onLeave(() => {
    alive = false; genToken++; clearTimers();
    if (refObjUrl) URL.revokeObjectURL(refObjUrl);
    if (resultOwnsUrl && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
    tutupLb();
    if (lightbox.parentNode) lightbox.parentNode.removeChild(lightbox);
  });

  root.appendChild(T.el('<p class="dim" style="font-size:12.5px;line-height:1.6;border:1px solid #ffffff14;border-radius:10px;padding:10px">Diproses melalui <b>akun Puter milikmu</b> — tanpa API key, tanpa server perantara. Prompt, gambar referensi, dan video hasil tidak disimpan di mana pun.<br><span style="font-size:12px">Catatan jujur: video AI memakan kuota besar (mis. Sora ±$0,10/detik dipotong dari allowance akunmu).</span></p>'));

  /* ---------- Mode ---------- */
  const tabTeks = T.btn('Teks ke Video', () => setMode('text'));
  const tabGambar = T.btn('Gambar ke Video', () => setMode('image'));
  root.appendChild(T.row(tabTeks, tabGambar));

  /* ---------- Referensi gambar ---------- */
  const refWrap = T.el('<div style="display:none;margin:10px 0"></div>');
  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/jpeg,image/png,image/webp'; fileInp.style.display = 'none';
  const pilihBtn = T.btn('Pilih Gambar', () => { if (!busy) fileInp.click(); });
  const prevBox = T.el('<div style="display:none;align-items:center;gap:10px;margin-top:8px;border:1px solid #ffffff14;border-radius:10px;padding:8px"></div>');
  const prevImg = document.createElement('img');
  prevImg.alt = 'Preview referensi';
  prevImg.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:8px';
  const prevMeta = T.el('<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div><div class="dim" style="font-size:12px"></div></div>');
  const gantiBtn = T.btn('Ganti', () => { if (!busy) fileInp.click(); });
  const hapusRefBtn = T.btn('Hapus', () => { bersihRef(); });
  prevBox.appendChild(prevImg); prevBox.appendChild(prevMeta);
  prevBox.appendChild(gantiBtn); prevBox.appendChild(hapusRefBtn);
  refWrap.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin-bottom:4px">Gambar referensi</div>'));
  refWrap.appendChild(pilihBtn); refWrap.appendChild(prevBox);
  refWrap.appendChild(T.el('<div class="dim" style="font-size:11.5px;margin-top:4px">JPG, PNG, atau WebP &middot; maksimal ' + MAX_IMG_MB + ' MB &middot; langsung ke Puter.</div>'));
  refWrap.appendChild(fileInp);
  root.appendChild(refWrap);

  function bersihRef() {
    refFile = null; refDataUrl = '';
    if (refObjUrl) { URL.revokeObjectURL(refObjUrl); refObjUrl = ''; }
    fileInp.value = '';
    prevBox.style.display = 'none';
    pilihBtn.textContent = 'Pilih Gambar';
  }
  fileInp.addEventListener('change', async () => {
    const f = fileInp.files && fileInp.files[0];
    fileInp.value = '';
    if (!f || busy) return;
    try {
      await validasiGambar(f);
      const du = await dataUrlOf(f);
      if (!alive) return;
      bersihRef();
      refFile = f; refDataUrl = du;
      refObjUrl = URL.createObjectURL(f);
      prevImg.src = refObjUrl;
      prevMeta.children[0].textContent = f.name || 'Gambar referensi';
      prevMeta.children[1].textContent = fmtBytes(f.size);
      prevBox.style.display = 'flex';
      pilihBtn.textContent = 'Ganti Gambar';
      pesan('Gambar siap dipakai sebagai frame referensi.', 'ok');
    } catch (e) { bersihRef(); pesan(T.esc(e.message || 'Gambar tidak valid.'), 'err'); }
  });

  /* ---------- Prompt ---------- */
  const prompt = T.ta(4, 'Contoh: Kota futuristik pada malam hari, hujan deras, pantulan neon di jalan basah, gerakan kamera perlahan.');
  prompt.maxLength = MAX_PROMPT;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_PROMPT + '</div>');
  prompt.addEventListener('input', () => { hitung.textContent = prompt.value.length + ' / ' + MAX_PROMPT; });
  root.appendChild(T.field('Deskripsi video (prompt) — wajib', prompt, 'Jelaskan subjek, gerakan, kamera, dan suasana.'));
  root.appendChild(hitung);

  /* ---------- Model, durasi, rasio ---------- */
  const modelSel = T.select(MODELS.map((m) => [m.id, m.label + ' — ' + m.detail]), 'sora-2');
  const durSel = T.select([], '');
  const biayaBox = T.el('<div class="dim" style="font-size:12.5px;border:1px solid #ffffff14;border-radius:8px;padding:8px 10px;margin-top:8px"></div>');
  const syncDur = () => {
    const m = modelById(modelSel.value);
    const prev = Number(durSel.value);
    durSel.innerHTML = '';
    m.durations.forEach((d) => {
      const o = document.createElement('option');
      o.value = String(d); o.textContent = d + ' detik';
      if (d === prev || (!prev && d === m.durations[0])) o.selected = true;
      durSel.appendChild(o);
    });
    syncBiaya();
  };
  const syncBiaya = () => {
    const m = modelById(modelSel.value);
    const d = Number(durSel.value || m.durations[0]);
    biayaBox.innerHTML = '<b>Perkiraan biaya ' + fmtUsd(m.cost * d) + '</b> untuk ' + d + ' detik' +
      '<br><span style="font-size:11.5px">Durasi yang dipilih bukan jaminan — Puter dapat menurunkannya sesuai allowance akunmu.</span>';
  };
  modelSel.addEventListener('change', syncDur);
  durSel.addEventListener('change', syncBiaya);
  syncDur();
  root.appendChild(T.grid2(
    T.field('Model', modelSel),
    T.field('Durasi yang diminta', durSel, 'Opsi durasi menyesuaikan model.')
  ));
  root.appendChild(biayaBox);

  const rasioRow = T.el('<div style="display:flex;gap:8px;margin:10px 0"></div>');
  let rasio = '9:16';
  const rasioBtns = [['9:16', '9:16 (vertikal)'], ['16:9', '16:9 (lanskap)']].map(([v, l]) => {
    const b = T.btn(l, () => { rasio = v; rasioBtns.forEach((x) => x.classList.toggle('primary', x.dataset.v === v)); });
    b.dataset.v = v;
    rasioRow.appendChild(b);
    return b;
  });
  rasioBtns.forEach((x) => x.classList.toggle('primary', x.dataset.v === rasio));
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin-bottom:4px">Rasio video</div>'));
  root.appendChild(rasioRow);

  /* ---------- Generate ---------- */
  const genBtn = T.btn('Generate Video', () => jalan(), true);
  const pesanBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const pesan = (html, cls) => { if (alive) pesanBox.innerHTML = html ? '<span class="' + (cls || '') + '">' + html + '</span>' : ''; };
  const authUlang = T.btn('Hubungkan Ulang Puter', async () => {
    authUlang.style.display = 'none';
    await puter.refresh();
    pesan('Puter sudah terhubung. Video siap dibuat.', 'ok');
  });
  authUlang.style.display = 'none';
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(genBtn));
  root.appendChild(pesanBox);
  root.appendChild(T.row(authUlang));

  /* ---------- Hasil ---------- */
  const hasilWrap = T.el('<div style="display:none;margin-top:10px"></div>');
  const hasilHead = T.el('<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px"><div style="font-size:13px;font-weight:700">HASIL</div><div class="dim" id="aivideo-meta" style="font-size:11.5px"></div></div>');
  const hasilKosong = T.el('<div class="dim center" style="border:1.5px dashed #ffffff20;border-radius:10px;padding:26px 12px">Video akan muncul di sini.<br><span style="font-size:12px">Proses dapat memerlukan beberapa menit.</span></div>');
  const videoEl = document.createElement('video');
  videoEl.controls = true; videoEl.playsInline = true; videoEl.preload = 'metadata';
  videoEl.style.cssText = 'display:none;max-width:100%;border-radius:10px;margin:0 auto';
  const aksiRow = T.el('<div style="display:none;gap:6px;margin-top:8px;flex-wrap:wrap;justify-content:center"></div>');
  hasilWrap.appendChild(hasilHead); hasilWrap.appendChild(hasilKosong);
  hasilWrap.appendChild(videoEl); hasilWrap.appendChild(aksiRow);
  root.appendChild(hasilWrap);
  root.appendChild(T.el('<p class="dim" style="font-size:11.5px;margin-top:8px">Video memakai allowance akun Puter milikmu. Durasi final mengikuti hasil nyata provider.</p>'));

  // Lightbox
  const lightbox = T.el('<div style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;padding:16px"></div>');
  const lbVideo = document.createElement('video');
  lbVideo.controls = true; lbVideo.playsInline = true;
  lbVideo.style.cssText = 'max-width:100%;max-height:92vh;border-radius:8px';
  const lbX = T.el('<button type="button" aria-label="Tutup" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:1px solid #ffffff40;background:#222;color:#fff;font-size:18px;cursor:pointer;z-index:1">&times;</button>');
  lightbox.appendChild(lbVideo); lightbox.appendChild(lbX);
  const tutupLb = () => { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lightbox.style.display = 'none'; document.body.style.overflow = ''; };
  const bukaLb = () => { if (!resultUrl) return; lbVideo.src = resultUrl; lightbox.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
  lbX.addEventListener('click', tutupLb);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) tutupLb(); });
  document.body.appendChild(lightbox);

  function setMode(m) {
    if (busy) return;
    mode = m;
    tabTeks.classList.toggle('primary', m === 'text');
    tabGambar.classList.toggle('primary', m === 'image');
    refWrap.style.display = m === 'image' ? '' : 'none';
    pesan(m === 'image' ? 'Pilih gambar, tulis gerakannya, lalu generate video.' : 'Tulis prompt lalu generate video.', 'ok');
  }

  function setBusy(b) {
    busy = b;
    genBtn.disabled = b;
    modelSel.disabled = b; durSel.disabled = b;
    tabTeks.disabled = b; tabGambar.disabled = b;
    genBtn.textContent = b ? 'Membuat video…' : 'Generate Video';
  }

  async function jalan() {
    if (busy || !alive) return;
    const p = prompt.value.trim();
    if (!p) { pesan('Masukkan prompt video terlebih dahulu.', 'err'); prompt.focus(); return; }
    if (p.length < 3 || p.length > MAX_PROMPT) { pesan('Prompt video harus 3-' + MAX_PROMPT + ' karakter.', 'err'); prompt.focus(); return; }
    const m = modelById(modelSel.value);
    if (mode === 'image' && !refFile) { pesan('Pilih gambar referensi terlebih dahulu.', 'err'); return; }
    await puter.need(async () => {
      const token = ++genToken;
      clearTimers(); setBusy(true);
      authUlang.style.display = 'none';
      pesan('Menyiapkan model video…', '');
      timers.push(setTimeout(() => { if (alive && token === genToken) pesan('Membuat video…', ''); }, 1800));
      timers.push(setTimeout(() => { if (alive && token === genToken) pesan('Video AI dapat memerlukan beberapa menit. Jangan tutup halaman ini.', ''); }, 30000));
      try {
        const detik = Number(durSel.value || m.durations[0]);
        const opts = { model: m.id, seconds: detik, size: SIZES[rasio] || '720x1280' };
        if (mode === 'image') opts.input_reference = m.imageInput === 'file' ? refFile : refDataUrl;
        const req = window.puter.ai.txt2vid(p, opts);
        const res = await Promise.race([
          Promise.resolve(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('PUTER_VIDEO_TIMEOUT')), TIMEOUT_MS)),
        ]);
        let src = '';
        if (typeof res === 'string') src = res;
        else if (res && res.src) src = res.src;
        else if (res && res.videoUrl) src = res.videoUrl;
        if (!/^(https:\/\/|blob:|data:video\/)/i.test(src)) throw new Error('Puter tidak mengembalikan video yang bisa dibaca.');
        if (!alive || token !== genToken) return;
        // tampilkan hasil
        if (resultOwnsUrl && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
        resultUrl = src; resultOwnsUrl = src.startsWith('blob:');
        videoEl.style.aspectRatio = rasio === '16:9' ? '16 / 9' : '9 / 16';
        videoEl.src = src;
        videoEl.style.display = 'block';
        hasilWrap.style.display = '';
        hasilKosong.style.display = 'none';
        const metaEl = hasilHead.querySelector('#aivideo-meta');
        metaEl.textContent = m.label + ' · diminta ' + detik + ' dtk · membaca hasil…';
        const laporDurasi = () => {
          if (!alive || token !== genToken) return;
          const aktual = Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? Math.round(videoEl.duration) : 0;
          if (!aktual) return;
          metaEl.textContent = m.label + ' · diminta ' + detik + ' dtk · hasil ' + aktual + ' dtk · ' + rasio;
          if (aktual < detik) pesan('Puter menghasilkan ' + aktual + ' detik dari permintaan ' + detik + ' detik (penyesuaian allowance).', 'warn');
          else pesan('Video selesai dengan durasi ' + aktual + ' detik.', 'ok');
        };
        videoEl.onloadedmetadata = laporDurasi;
        videoEl.ondurationchange = laporDurasi;
        if (videoEl.readyState >= 1) laporDurasi();
        aksiRow.style.display = 'flex'; aksiRow.innerHTML = '';
        const unduh = document.createElement('a');
        unduh.href = src; unduh.download = 'ai-video-' + Date.now() + '.mp4';
        unduh.textContent = 'Unduh Video';
        unduh.className = 'btn primary';
        unduh.style.cssText = 'text-decoration:none;display:inline-block';
        aksiRow.appendChild(unduh);
        aksiRow.appendChild(T.btn('Buka Penuh', bukaLb));
        aksiRow.appendChild(T.btn('Buat Lagi', () => {
          prompt.focus();
          prompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
          pesan('Prompt siap diedit untuk generate berikutnya.', 'ok');
        }));
        videoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        if (!alive || token !== genToken) return;
        const d = errInfo(e);
        if (d.status === 401 || d.status === 403 || /popup|auth|sign.?in|login/.test((d.code + ' ' + d.message).toLowerCase())) {
          authUlang.style.display = '';
          pesan('Otorisasi Puter perlu diperbarui. Tekan "Hubungkan Ulang Puter".', 'err');
        } else {
          pesan(errPesan(e), 'err');
        }
      } finally {
        clearTimers();
        if (alive && token === genToken) setBusy(false);
      }
    });
  }

  setMode('text');
  root.appendChild(T.el(utils.puter.poweredBy()));
}
