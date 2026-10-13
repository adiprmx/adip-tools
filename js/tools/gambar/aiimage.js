import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"aiimage","name":"AI Image","cat":"gambar","icon":"🎨","desc":"Generate & edit gambar AI pakai akun Puter milikmu.","keywords":"ai,gambar,generator,edit foto,puter,image"};

const PUTER_SDK_URL = 'https://js.puter.com/v2/';
const RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const RATIO_WH = { '1:1': [1, 1], '3:4': [3, 4], '4:3': [4, 3], '9:16': [9, 16], '16:9': [16, 9] };
const MAX_PROMPT = 2000;
const MAX_SRC_MB = 15;

// Katalog model image Puter (ID publik). Label & hint ditulis sendiri.
const MODEL_CATALOG = [
  { id: 'openai/gpt-image-2.5-flare', label: 'GPT Image 2.5 Flare', hint: 'Cepat & seimbang', recommended: true, maxRef: 4, qualities: ['low', 'medium', 'high', 'xhigh', 'max'], defaultQuality: 'low', aliases: ['gpt-image-2.5-flare', 'openai:openai/gpt-image-2.5-flare'] },
  { id: 'dola-seedream-5-0-flash-260915', label: 'Seedream 5 Flash', hint: 'Cepat & realistis', recommended: true, maxRef: 10, qualities: ['1K', '1.5K', '2K'], defaultQuality: '1K', aliases: ['byteplus/dola-seedream-5-0-flash-260915', 'seedream-5-0-flash'] },
  { id: 'black-forest-labs/flux-2-klein-4b', label: 'FLUX.2 Klein 4B', hint: 'Cepat untuk artwork', recommended: true, maxRef: 5, qualities: ['0.25', '0.5', '1', '2', '4'], defaultQuality: '1', qualitySuffix: ' MP', aliases: ['flux-2-klein-4b', 'replicate:black-forest-labs/flux-2-klein-4b'] },
  { id: 'openai/gpt-image-2.5-sunburst', label: 'GPT Image 2.5 Sunburst', hint: 'Detail tingkat tinggi', recommended: true, maxRef: 4, qualities: ['low', 'medium', 'high', 'xhigh', 'max'], defaultQuality: 'medium', aliases: ['gpt-image-2.5-sunburst', 'openai:openai/gpt-image-2.5-sunburst'] },
  { id: 'google/gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image', hint: 'Prompt panjang & referensi', recommended: true, maxRef: 4, qualities: ['512', '1K', '2K', '4K'], defaultQuality: '1K', aliases: ['gemini-3.1-flash-image', 'google:google/gemini-3.1-flash-image'] },
  { id: 'openai/gpt-image-2', label: 'GPT Image 2', hint: 'Serbaguna & stabil', recommended: false, maxRef: 4, qualities: ['low', 'medium', 'high', 'auto'], defaultQuality: 'low', aliases: ['gpt-image-2', 'openai:openai/gpt-image-2'] },
  { id: 'x-ai/grok-imagine-image-2.0', label: 'Grok Imagine 2.0', hint: 'Kreatif & komposisi', recommended: false, maxRef: 5, qualities: ['low', 'medium', 'auto'], defaultQuality: 'low', aliases: ['grok-imagine-image-2.0', 'xai/grok-imagine-image-2.0'] },
  { id: 'dola-seedream-5-0-pro-260628', label: 'Seedream 5 Pro', hint: 'Realistis & detail', recommended: false, maxRef: 10, qualities: ['1K', '1.5K', '2K'], defaultQuality: '1.5K', aliases: ['byteplus/dola-seedream-5-0-pro-260628', 'seedream-5-0-pro'] },
  { id: 'leonardoai/lucid-origin', label: 'Leonardo Lucid Origin', hint: 'Desain & ilustrasi', recommended: false, maxRef: 0, qualities: ['standard', 'ultra'], defaultQuality: 'standard', aliases: ['leonardo/lucid-origin', 'replicate:leonardoai/lucid-origin'] },
  { id: 'qwen/qwen-image', label: 'Qwen Image', hint: 'Poster & teks', recommended: false, maxRef: 1, qualities: ['Speed', 'Quality'], defaultQuality: 'Quality', aliases: ['qwen-image', 'replicate:qwen/qwen-image'] },
];
const DEFAULT_PRIORITY = ['openai/gpt-image-2.5-flare', 'black-forest-labs/flux-2-klein-4b', 'google/gemini-3.1-flash-image', 'openai/gpt-image-2', 'dola-seedream-5-0-flash-260915'];

const STYLE_PRESETS = [
  ['Realistis', 'photorealistic, natural lighting, realistic textures'],
  ['Anime', 'anime illustration, expressive character design, clean linework'],
  ['Ilustrasi', 'editorial illustration, polished composition'],
  ['3D', 'stylized 3D render, soft studio lighting, detailed materials'],
  ['Poster', 'poster composition, strong focal point, readable typography space'],
  ['Sinematik', 'cinematic lighting, dramatic depth, film still composition'],
  ['Minimal', 'minimal composition, clean shapes, restrained color palette'],
  ['Pixel Art', 'pixel art, crisp edges, limited color palette'],
  ['Vector', 'clean vector artwork, precise shapes, scalable graphic style'],
  ['Manga', 'detailed manga illustration, expressive ink linework'],
  ['Foto Produk', 'premium product photography, controlled studio lighting'],
];
const IDEA_PRESETS = [
  'kota terapung di atas awan saat matahari terbit, detail sinematik',
  'kucing astronot di bulan dengan bumi di kejauhan, ilustrasi hangat',
  'poster kedai kopi futuristik dengan ruang teks yang jelas',
  'pemandangan desa Indonesia setelah hujan, cahaya sore realistis',
];

const normId = (v) => String(v || '').trim().toLowerCase();
function catalogModel(id) {
  const n = normId(id);
  return MODEL_CATALOG.find((m) => normId(m.id) === n || (m.aliases || []).some((a) => normId(a) === n)) || null;
}

// Muat Puter.js sekali, dengan timeout 15 detik.
let _sdkP = null;
function loadSdk() {
  if (window.puter && window.puter.auth && window.puter.ai) return Promise.resolve(window.puter);
  if (_sdkP) return _sdkP;
  _sdkP = new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => fin(new Error('Puter terlalu lama merespons. Periksa internet lalu coba lagi.')), 15000);
    const fin = (err) => {
      if (done) return; done = true; clearTimeout(timer);
      if (err) { _sdkP = null; reject(err); } else resolve(window.puter);
    };
    const ready = () => { if (window.puter && window.puter.auth && window.puter.ai) fin(); };
    let s = document.querySelector('script[data-adip-puter-sdk="1"]');
    if (!s) {
      s = document.createElement('script');
      s.src = PUTER_SDK_URL; s.async = true; s.dataset.adipPuterSdk = '1';
      s.addEventListener('load', ready, { once: true });
      s.addEventListener('error', () => fin(new Error('Gagal memuat Puter. Periksa koneksi internet atau pemblokir iklan.')), { once: true });
      document.head.appendChild(s);
    } else { s.addEventListener('load', ready, { once: true }); }
    const poll = setInterval(() => { if (done) clearInterval(poll); else ready(); }, 80);
    ready();
  });
  return _sdkP;
}

// Pemetaan error Puter -> Bahasa Indonesia.
function errInfo(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  return {
    code: String(n.errorCode || n.code || r.errorCode || r.code || '').toLowerCase().slice(0, 100),
    status: Number(n.status || r.status || 0) || 0,
    message: String(n.message || r.message || (typeof r.error === 'string' ? r.error : '') || e || '').slice(0, 240),
  };
}
function errPesan(e) {
  const d = errInfo(e);
  const raw = (d.code + ' ' + d.status + ' ' + d.message).toLowerCase();
  if (/popup|blocked/.test(raw)) return 'Jendela login diblokir browser. Izinkan pop-up lalu coba lagi.';
  if (/email_must_be_confirmed|confirm.*email|email.*confirm/.test(raw)) return 'Email akun Puter belum dikonfirmasi. Konfirmasi email di Puter lalu coba lagi.';
  if (/cancel|closed|auth_canceled/.test(raw)) return 'Login Puter dibatalkan. Kamu bisa menghubungkannya lagi.';
  if (d.status === 401 || d.status === 403 || /unauthorized|authentication|required.*login|not signed/.test(raw)) return 'Hubungkan akun Puter terlebih dahulu.';
  if (d.status === 402 || /allowance|credit|quota|insufficient_funds|payment|fund/.test(raw)) return 'Allowance Puter kamu sudah habis atau tidak cukup.';
  if (d.status === 429 || /rate.limit|too many|concurren/.test(raw)) return 'Terlalu banyak permintaan. Coba lagi sebentar.';
  if (/moderation_flagged|safety|moderation|policy|filtered|rai/.test(raw)) return 'Prompt ditolak oleh aturan keamanan AI.';
  if (/invalid image|image.*decode|corrupt|unsupported.*(?:image|format)|mime/.test(raw)) return 'Gambar input tidak valid atau formatnya belum didukung.';
  if (/unsupported capability|input image.*not supported|reference.*not supported/.test(raw)) return 'Model ini tidak mendukung mode gambar yang dipilih.';
  if (/model not found|unknown model|model.*unavailable|unsupported model|no provider|excluded route/.test(raw)) return 'Model ini sedang tidak tersedia.';
  if (/network|failed to fetch|offline|connection/.test(raw)) return 'Koneksi ke Puter terputus.';
  if (d.status >= 500 || /upstream|provider|internal_error|unknown_error|service_unavailable|something went wrong|temporar/.test(raw)) return 'Provider model sedang bermasalah.';
  return 'Puter belum bisa memproses gambar. Coba lagi beberapa saat.';
}
function bisaFallback(e) {
  const d = errInfo(e);
  const raw = (d.code + ' ' + d.status + ' ' + d.message).toLowerCase();
  if ([401, 402, 403, 429].includes(d.status)) return false;
  if (/allowance|credit|quota|insufficient|payment|fund|safety|moderation|policy|filtered|rai|cancel|closed|denied|unauthorized|authentication|rate.limit|too many|concurren|network|fetch|offline|invalid image|unsupported.*(?:image|format)|mime/.test(raw)) return false;
  if (d.status >= 500 && d.status < 600) return true;
  return /model not found|unknown model|model.*unavailable|unsupported model|no provider|excluded route|internal_error|unknown_error|service_unavailable|upstream|something went wrong|temporar/.test(raw);
}

// Discovery model live via Puter driver (cache 5 menit), fallback ke katalog.
let _disc = null, _discAt = 0;
async function discoverModels() {
  if (_disc && Date.now() - _discAt < 5 * 60 * 1000) return { models: _disc.slice(), live: true };
  try {
    if (!window.puter.drivers || typeof window.puter.drivers.call !== 'function') throw new Error('no-driver');
    const resp = await window.puter.drivers.call('puter-image-generation', 'models', {});
    const rows = resp && Array.isArray(resp.result) ? resp.result : resp;
    const names = {};
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (typeof row === 'string') names[normId(row)] = 1;
      else if (row && typeof row === 'object') {
        [row.id, row.puterId, row.name, row.model].concat(Array.isArray(row.aliases) ? row.aliases : [])
          .forEach((v) => { const k = normId(v); if (k) names[k] = 1; });
      }
    });
    const avail = MODEL_CATALOG.filter((m) => [m.id].concat(m.aliases || []).some((id) => names[normId(id)]));
    if (!avail.length) throw new Error('empty');
    _disc = avail; _discAt = Date.now();
    return { models: avail.slice(), live: true };
  } catch (e) {
    return { models: MODEL_CATALOG.slice(), live: false };
  }
}

function opsiGenerate(model, ratioKey, mode, quality, inputs) {
  const safeRatio = RATIO_WH[ratioKey] ? ratioKey : '1:1';
  const opts = { model: model.id, ratio: { w: RATIO_WH[safeRatio][0], h: RATIO_WH[safeRatio][1] } };
  const q = quality || model.defaultQuality || '';
  if (q && model.qualities.includes(q)) {
    if (model.qualitySuffix) opts.output_megapixels = q;
    else opts.quality = q;
  }
  if (mode !== 'generate' && inputs && inputs.length) {
    const pakai = inputs.slice(0, Math.max(1, model.maxRef || 1));
    opts.input_images = pakai;
    if (pakai.length === 1) {
      opts.input_image = pakai[0];
      const mm = String(pakai[0] || '').match(/^data:(image\/[a-z0-9.+-]+);/i);
      if (mm) opts.input_image_mime_type = mm[1].toLowerCase();
    }
  }
  return opts;
}

function blobKeDataUrl(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.onerror = () => rej(new Error('gagal membaca gambar'));
    r.readAsDataURL(blob);
  });
}
// Validasi magic bytes: png/jpeg/gif/webp. JPEG di-transcode ke webp agar stabil.
async function siapkanReferensi(file) {
  const buf = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const gif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
  const webp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  if (!png && !jpg && !gif && !webp) throw new Error('"' + file.name + '" bukan gambar valid (pakai PNG/JPG/WebP).');
  if (png || webp || gif) return file;
  // JPEG: transcode ke webp via canvas (galeri Android kadang bermasalah di provider)
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  c.getContext('2d').drawImage(bmp, 0, 0);
  if (bmp.close) bmp.close();
  const out = await new Promise((res) => c.toBlob(res, 'image/webp', 0.95));
  return out || file;
}

function namaUnduh(ext) {
  const d = new Date(), p = (v) => String(v).padStart(2, '0');
  return 'ai-image-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.' + (ext || 'png');
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();
  loadSdk().then(() => { puter.refresh(); muatModel(); }).catch((e) => pesan(errPesan(e), 'err'));

  let alive = true, busy = false, mode = 'generate';
  let modelList = MODEL_CATALOG.slice(), discoveryLive = false;
  let modelTerpilih = '', qualityTerpilih = '', ratioTerpilih = '1:1';
  let sources = []; // {name, dataUrl, previewUrl, owned}
  let resultUrl = '', resultBlob = null, lastPrompt = '';
  let genToken = 0;
  T.onLeave(() => {
    alive = false; genToken++;
    sources.forEach((s) => { if (s.owned && s.previewUrl && s.previewUrl.startsWith('blob:')) URL.revokeObjectURL(s.previewUrl); });
    if (resultBlob && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
    if (lightbox.parentNode) lightbox.parentNode.removeChild(lightbox);
    document.removeEventListener('keydown', escClose);
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Generate, edit, dan pakai gambar referensi — <b>pakai akun Puter milikmu</b> (login gratis). Kuota AI dipotong dari akunmu sendiri, tidak disimpan di mana pun.</p>'));

  /* ---------- Mode ---------- */
  const MODES = [['generate', 'Generate'], ['edit', 'Edit'], ['reference', 'Referensi'], ['multi', 'Multi (2-4)']];
  const modeBtns = MODES.map(([v, l]) => T.btn(l, () => setMode(v)));
  root.appendChild(T.row(...modeBtns));

  const pesanBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px"></div>');
  const pesan = (html, cls) => {
    if (!alive) return;
    pesanBox.innerHTML = html ? '<span class="' + (cls || '') + '">' + html + '</span>' : '';
  };

  /* ---------- Sumber gambar ---------- */
  const srcWrap = T.el('<div style="display:none;margin-bottom:10px"></div>');
  const srcJudul = T.el('<div style="font-size:13px;font-weight:700;margin-bottom:4px">Gambar sumber</div>');
  const srcHint = T.el('<div class="dim" style="font-size:12px;margin-bottom:6px"></div>');
  const dropZone = T.el('<label style="display:block;border:1.5px dashed #ffffff30;border-radius:10px;padding:14px;text-align:center;cursor:pointer;font-size:13px">Tambah gambar<div class="dim" style="font-size:11.5px;margin-top:2px">PNG, JPG, atau WebP &middot; maks ' + MAX_SRC_MB + ' MB</div></label>');
  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/png,image/jpeg,image/webp'; fileInp.style.display = 'none';
  dropZone.appendChild(fileInp);
  const srcList = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>');
  const srcClear = T.btn('Hapus semua', () => { bersihSumber(); });
  srcClear.style.display = 'none';
  srcWrap.appendChild(srcJudul); srcWrap.appendChild(srcHint);
  srcWrap.appendChild(dropZone); srcWrap.appendChild(srcList);
  srcWrap.appendChild(T.el('<div style="margin-top:6px"></div>')).appendChild(srcClear);
  root.appendChild(srcWrap);

  const maxSumber = () => {
    if (mode === 'generate') return 0;
    if (mode !== 'multi') return 1;
    const m = catalogModel(modelTerpilih);
    return Math.max(2, Math.min(4, (m && m.maxRef) || 4));
  };
  const minSumber = () => (mode === 'multi' ? 2 : mode === 'generate' ? 0 : 1);
  function bersihSumber() {
    sources.forEach((s) => { if (s.owned && s.previewUrl.startsWith('blob:')) URL.revokeObjectURL(s.previewUrl); });
    sources = []; gambarSumber(); updateAksi();
  }
  function gambarSumber() {
    srcList.innerHTML = '';
    sources.forEach((s, i) => {
      const card = T.el('<div style="position:relative;width:84px"></div>');
      const img = document.createElement('img');
      img.src = s.previewUrl; img.alt = 'Sumber ' + (i + 1);
      img.style.cssText = 'width:84px;height:84px;object-fit:cover;border-radius:8px;border:1px solid #ffffff20;display:block';
      const x = T.el('<button type="button" aria-label="Hapus" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:1px solid #ffffff30;background:#222;color:#fff;font-size:12px;line-height:1;cursor:pointer">&times;</button>');
      x.addEventListener('click', () => {
        if (s.owned && s.previewUrl.startsWith('blob:')) URL.revokeObjectURL(s.previewUrl);
        sources.splice(i, 1); gambarSumber(); updateAksi();
      });
      const nm = T.el('<div class="dim" style="font-size:10.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(s.name) + '</div>');
      card.appendChild(img); card.appendChild(x); card.appendChild(nm);
      srcList.appendChild(card);
    });
    const maks = maxSumber();
    dropZone.style.display = (maks > 0 && sources.length >= maks) ? 'none' : '';
    srcClear.style.display = sources.length ? '' : 'none';
    srcHint.textContent = mode === 'multi'
      ? 'Tambahkan 2-' + maks + ' gambar referensi. Urutan dipertahankan.'
      : mode === 'edit' ? 'Gambar ini akan diedit mengikuti instruksi.'
      : 'Karakter, gaya, atau suasana gambar dipakai sebagai acuan.';
  }
  fileInp.addEventListener('change', async () => {
    const files = [...fileInp.files];
    fileInp.value = '';
    if (!files.length || busy) return;
    const maks = maxSumber();
    if (mode !== 'multi') bersihSumber();
    for (const f of files) {
      if (sources.length >= maks) break;
      if (!f.size || f.size > MAX_SRC_MB * 1024 * 1024) { pesan('Ukuran gambar harus di bawah ' + MAX_SRC_MB + ' MB.', 'err'); continue; }
      try {
        const siap = await siapkanReferensi(f);
        const du = await blobKeDataUrl(siap);
        const pv = URL.createObjectURL(siap);
        sources.push({ name: String(f.name || 'Gambar').slice(0, 60), dataUrl: du, previewUrl: pv, owned: true });
      } catch (e) { pesan(T.esc(e.message || 'Gambar tidak valid.'), 'err'); }
    }
    gambarSumber(); updateAksi();
    if (sources.length >= minSumber()) pesan('Gambar siap. Tulis prompt lalu tekan tombol generate.', 'ok');
  });
  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      const dt = new DataTransfer();
      [...e.dataTransfer.files].forEach((f) => dt.items.add(f));
      fileInp.files = dt.files;
      fileInp.dispatchEvent(new Event('change'));
    }
  });

  /* ---------- Prompt ---------- */
  const promptLabel = T.el('<div style="font-size:13px;font-weight:700;margin:10px 0 4px">Ide gambarmu</div>');
  const promptBar = T.el('<div style="display:flex;gap:6px;margin-bottom:6px"></div>');
  const ideBtn = T.btn('Acak ide', () => {
    const ide = IDEA_PRESETS[Math.floor(Math.random() * IDEA_PRESETS.length)];
    prompt.value = prompt.value.trim() ? prompt.value.trim() + '\nIde tambahan: ' + ide : ide;
    hitungPrompt(); prompt.focus();
  });
  const hapusBtn = T.btn('Hapus', () => { prompt.value = ''; hitungPrompt(); prompt.focus(); });
  promptBar.appendChild(ideBtn); promptBar.appendChild(hapusBtn);
  const prompt = T.ta(4, 'Coba: seekor kucing astronot di bulan, cinematic lighting...');
  prompt.maxLength = MAX_PROMPT;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_PROMPT + '</div>');
  const hitungPrompt = () => { hitung.textContent = prompt.value.length + ' / ' + MAX_PROMPT; };
  prompt.addEventListener('input', hitungPrompt);
  root.appendChild(promptLabel); root.appendChild(promptBar);
  root.appendChild(prompt); root.appendChild(hitung);

  /* ---------- Quick style ---------- */
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin:10px 0 4px">Quick style <span class="dim" style="font-weight:400">(opsional)</span></div>'));
  const styleRow = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"></div>');
  STYLE_PRESETS.forEach(([label, suffix]) => {
    const b = T.btn(label, () => {
      const cur = prompt.value;
      if (cur.toLowerCase().includes(suffix.toLowerCase())) return;
      prompt.value = cur.trim() ? cur.trim().replace(/[,\.\s]+$/, '') + ', ' + suffix : suffix;
      hitungPrompt(); prompt.focus();
    });
    styleRow.appendChild(b);
  });
  root.appendChild(styleRow);

  /* ---------- Model ---------- */
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin:10px 0 4px">Model <span class="dim" id="aiimage-model-status" style="font-weight:400">Memeriksa ketersediaan…</span></div>'));
  const modelStatus = () => root.querySelector('#aiimage-model-status');
  const rekGrid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:6px"></div>');
  const allDetails = T.el('<details style="margin-bottom:4px"><summary style="cursor:pointer;font-size:13px">Lihat semua model</summary><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px"></div></details>');
  const allGrid = allDetails.querySelector('div');
  const modelManual = T.input('text', '…atau tulis ID model manual (opsional)');
  root.appendChild(rekGrid); root.appendChild(allDetails);
  root.appendChild(T.field('ID model manual', modelManual, 'Opsional — untuk ID model yang tidak ada di daftar.'));

  function modelKompatibel() {
    return modelList.filter((m) => mode === 'generate' || m.maxRef > 0);
  }
  function pilihModelDefault() {
    const cocok = modelKompatibel();
    for (const id of DEFAULT_PRIORITY) {
      const m = cocok.find((x) => x.id === id);
      if (m) return m.id;
    }
    return cocok.length ? cocok[0].id : '';
  }
  function tombolModel(m) {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = 'text-align:left;border:1px solid #ffffff20;border-radius:10px;padding:8px 10px;background:#ffffff08;cursor:pointer;color:inherit';
    b.innerHTML = '<div style="font-weight:700;font-size:13px">' + T.esc(m.label) + '</div>' +
      '<div class="dim" style="font-size:11.5px">' + T.esc(m.hint) + '</div>';
    b.addEventListener('click', () => {
      modelTerpilih = m.id; qualityTerpilih = '';
      gambarModel(); gambarQuality();
      pesan('Model dipilih: ' + T.esc(m.label) + '.', 'ok');
    });
    b.dataset.mid = m.id;
    return b;
  }
  function gambarModel() {
    rekGrid.innerHTML = ''; allGrid.innerHTML = '';
    const cocok = modelKompatibel();
    if (!cocok.some((m) => m.id === modelTerpilih)) modelTerpilih = pilihModelDefault();
    let unggulan = cocok.filter((m) => m.recommended).slice(0, 5);
    if (!unggulan.length) unggulan = cocok.slice(0, 5);
    const ids = unggulan.map((m) => m.id);
    const lain = cocok.filter((m) => !ids.includes(m.id));
    unggulan.forEach((m) => rekGrid.appendChild(tombolModel(m)));
    lain.forEach((m) => allGrid.appendChild(tombolModel(m)));
    allDetails.style.display = lain.length ? '' : 'none';
    [...rekGrid.children, ...allGrid.children].forEach((b) => {
      const aktif = b.dataset.mid === modelTerpilih;
      b.style.borderColor = aktif ? '#fff' : '#ffffff20';
      b.style.background = aktif ? '#ffffff14' : '#ffffff08';
    });
    const st = modelStatus();
    if (st) st.textContent = discoveryLive ? cocok.length + ' kompatibel sekarang' : 'Daftar aman terverifikasi';
    updateAksi();
  }
  async function muatModel() {
    const { models, live } = await discoverModels();
    if (!alive) return;
    modelList = models; discoveryLive = live;
    gambarModel();
  }

  /* ---------- Rasio & kualitas ---------- */
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin:10px 0 4px">Rasio gambar</div>'));
  const ratioRow = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"></div>');
  const ratioBtns = RATIOS.map((r) => {
    const b = T.btn(r, () => { ratioTerpilih = r; syncRatio(); });
    b.dataset.ratio = r;
    ratioRow.appendChild(b);
    return b;
  });
  const syncRatio = () => ratioBtns.forEach((b) => b.classList.toggle('primary', b.dataset.ratio === ratioTerpilih));
  syncRatio();
  root.appendChild(ratioRow);

  const qWrap = T.el('<div style="display:none"></div>');
  const qLabel = T.el('<div style="font-size:13px;font-weight:700;margin:10px 0 4px">Kualitas</div>');
  const qRow = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"></div>');
  qWrap.appendChild(qLabel); qWrap.appendChild(qRow);
  root.appendChild(qWrap);
  function gambarQuality() {
    const m = catalogModel(modelTerpilih) || catalogModel(modelManual.value.trim());
    qRow.innerHTML = '';
    const qs = m ? m.qualities : [];
    if (!qs || qs.length < 2) { qWrap.style.display = 'none'; qualityTerpilih = qs[0] || ''; return; }
    qWrap.style.display = '';
    if (!qs.includes(qualityTerpilih)) qualityTerpilih = qs.includes(m.defaultQuality) ? m.defaultQuality : qs[0];
    qs.forEach((q) => {
      const b = T.btn(q + (m.qualitySuffix || ''), () => { qualityTerpilih = q; gambarQuality(); });
      b.classList.toggle('primary', q === qualityTerpilih);
      qRow.appendChild(b);
    });
  }
  modelManual.addEventListener('input', gambarQuality);

  /* ---------- Generate ---------- */
  const labelGen = { generate: 'Buat Gambar', edit: 'Edit Gambar', reference: 'Buat dari Referensi', multi: 'Gabungkan Referensi' };
  const genBtn = T.btn(labelGen.generate, () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(genBtn));
  root.appendChild(pesanBox);

  /* ---------- Hasil ---------- */
  const hasilWrap = T.el('<div style="display:none;margin-top:10px"></div>');
  const hasilKosong = T.el('<div class="dim center" style="border:1.5px dashed #ffffff20;border-radius:10px;padding:26px 12px">Belum ada gambar.<br><span style="font-size:12px">Tulis ide lalu tekan tombol generate.</span></div>');
  const hasilImgBtn = T.el('<button type="button" style="display:none;width:100%;padding:0;border:1px solid #ffffff20;border-radius:10px;overflow:hidden;background:none;cursor:zoom-in"></button>');
  const hasilImg = document.createElement('img');
  hasilImg.alt = 'Hasil AI Image';
  hasilImg.style.cssText = 'width:100%;height:auto;display:block';
  hasilImgBtn.appendChild(hasilImg);
  const aksiRow = T.el('<div style="display:none;gap:6px;margin-top:8px;flex-wrap:wrap"></div>');
  const aksi = (label, fn, primary) => { const b = T.btn(label, fn, primary); aksiRow.appendChild(b); return b; };
  root.appendChild(hasilWrap);
  hasilWrap.appendChild(hasilKosong); hasilWrap.appendChild(hasilImgBtn); hasilWrap.appendChild(aksiRow);
  root.appendChild(T.el('<p class="dim" style="font-size:11.5px;margin-top:8px">Diproses melalui Puter dengan akunmu — tidak disimpan di mana pun.</p>'));

  // Lightbox
  const lightbox = T.el('<div style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;padding:16px"></div>');
  const lbImg = document.createElement('img');
  lbImg.style.cssText = 'max-width:100%;max-height:92vh;border-radius:8px';
  const lbX = T.el('<button type="button" aria-label="Tutup" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:1px solid #ffffff40;background:#222;color:#fff;font-size:18px;cursor:pointer">&times;</button>');
  lightbox.appendChild(lbImg); lightbox.appendChild(lbX);
  const bukaLb = () => { if (!resultUrl) return; lbImg.src = resultUrl; lightbox.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
  const tutupLb = () => { lightbox.style.display = 'none'; document.body.style.overflow = ''; };
  const escClose = (e) => { if (e.key === 'Escape') tutupLb(); };
  hasilImgBtn.addEventListener('click', bukaLb);
  lbX.addEventListener('click', tutupLb);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) tutupLb(); });
  document.addEventListener('keydown', escClose);
  document.body.appendChild(lightbox);

  function updateAksi() {
    if (busy) return;
    genBtn.disabled = busy || !modelTerpilih || sources.length < minSumber();
    genBtn.textContent = busy ? 'Memproses…' : labelGen[mode];
  }

  function setMode(m) {
    if (busy || mode === m) { gambarMode(); return; }
    mode = m; qualityTerpilih = '';
    gambarMode(); gambarModel(); gambarSumber(); gambarQuality();
    pesan(m === 'generate' ? 'Tulis ide untuk membuat gambar baru.'
      : m === 'edit' ? 'Tambahkan satu gambar lalu tulis perubahan yang diinginkan.'
      : m === 'reference' ? 'Tambahkan satu referensi untuk menjaga karakter atau gaya.'
      : 'Tambahkan minimal dua referensi dan jelaskan peran tiap gambar.', '');
  }
  function gambarMode() {
    modeBtns.forEach((b, i) => b.classList.toggle('primary', MODES[i][0] === mode));
    srcWrap.style.display = mode === 'generate' ? 'none' : '';
    promptLabel.textContent = mode === 'edit' ? 'Instruksi edit'
      : mode === 'reference' ? 'Prompt dengan referensi'
      : mode === 'multi' ? 'Prompt komposisi' : 'Ide gambarmu';
    prompt.placeholder = mode === 'edit' ? 'Coba: ubah background menjadi kota Tokyo di malam hari...'
      : mode === 'reference' ? 'Coba: buat karakter ini berdiri di bawah hujan, sinematik...'
      : mode === 'multi' ? 'Coba: pakai karakter gambar pertama, outfit kedua, suasana ketiga...'
      : 'Coba: seekor kucing astronot di bulan, cinematic lighting...';
    updateAksi();
  }

  function tampilHasil(src, blob) {
    if (resultBlob && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
    resultUrl = src; resultBlob = blob || null;
    hasilWrap.style.display = '';
    hasilKosong.style.display = 'none';
    hasilImgBtn.style.display = '';
    hasilImg.src = src;
    aksiRow.style.display = 'flex'; aksiRow.innerHTML = '';
    aksi('Unduh', unduhHasil, true);
    aksi('Buat lagi', () => jalan());
    aksi('Edit gambar', () => pakaiHasilSebagai('edit', false));
    aksi('Jadi referensi', () => pakaiHasilSebagai('reference', false));
    aksi('Buat variasi', () => pakaiHasilSebagai('reference', true));
    aksi('Salin prompt', async () => {
      const t = lastPrompt || prompt.value.trim();
      if (!t) return;
      try { await navigator.clipboard.writeText(t); pesan('Prompt disalin.', 'ok'); }
      catch (e) { pesan('Prompt belum bisa disalin di browser ini.', 'err'); }
    });
    aksi('Edit prompt', () => { prompt.focus(); prompt.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    hasilImgBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function unduhHasil() {
    if (!resultUrl) return;
    pesan('Menyiapkan file unduhan…', '');
    try {
      let blob = resultBlob;
      if (!blob) {
        const r = await fetch(resultUrl);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        blob = await r.blob();
      }
      const ext = (blob.type.includes('jpeg') ? 'jpg' : blob.type.includes('webp') ? 'webp' : blob.type.includes('gif') ? 'gif' : 'png');
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u; a.download = namaUnduh(ext); a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 15000);
      pesan('Gambar berhasil diunduh.', 'ok');
    } catch (e) { pesan('Gambar belum bisa diunduh. Periksa koneksi lalu coba lagi.', 'err'); }
  }

  async function pakaiHasilSebagai(modeBaru, variasi) {
    if (!resultUrl || busy) return;
    pesan('Menyiapkan hasil sebagai input…', '');
    try {
      let du;
      if (resultUrl.startsWith('data:image/')) du = resultUrl;
      else {
        const r = await fetch(resultUrl);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        du = await blobKeDataUrl(await r.blob());
      }
      bersihSumber();
      const pv = resultUrl.startsWith('blob:') ? resultUrl : du;
      sources.push({ name: 'Hasil saat ini', dataUrl: du, previewUrl: pv, owned: false });
      setMode(modeBaru);
      if (variasi) {
        const dasar = lastPrompt || prompt.value.trim();
        prompt.value = 'Buat variasi kreatif dari gambar ini dengan tetap mempertahankan subjek utama' + (dasar ? '. Konsep awal: ' + dasar : '');
        hitungPrompt();
      }
      gambarSumber(); prompt.focus();
      pesan(modeBaru === 'edit' ? 'Hasil siap diedit tanpa unduh-upload ulang.' : 'Hasil siap dipakai sebagai referensi.', 'ok');
    } catch (e) { pesan(errPesan(e), 'err'); }
  }

  async function jalan() {
    if (busy || !alive) return;
    const p = prompt.value.trim();
    if (p.length < 3) { pesan('Tulis prompt sedikitnya 3 huruf.', 'err'); prompt.focus(); return; }
    if (sources.length < minSumber()) {
      pesan(mode === 'multi' ? 'Tambahkan minimal dua referensi terlebih dahulu.' : 'Tambahkan gambar terlebih dahulu.', 'err');
      return;
    }
    const manual = modelManual.value.trim();
    let model = manual ? (catalogModel(manual) || { id: manual, maxRef: 4, qualities: [], defaultQuality: '' }) : catalogModel(modelTerpilih);
    if (!model) { pesan('Pilih model dulu.', 'err'); return; }
    await puter.need(async () => {
      busy = true; updateAksi();
      const token = ++genToken;
      pesan(mode === 'edit' ? 'Mengedit gambar… AI sedang menerapkan perubahan.' : 'Membuat gambar… AI sedang merender detail.', '');
      try {
        const inputs = sources.map((s) => s.dataUrl);
        const cocok = modelKompatibel();
        let utama = model;
        let fallback = cocok.find((m) => m.id !== utama.id && (m.maxRef || 0) >= inputs.length && DEFAULT_PRIORITY.includes(m.id))
          || cocok.find((m) => m.id !== utama.id && (m.maxRef || 0) >= inputs.length) || null;
        if (manual && !catalogModel(manual)) fallback = null;
        const coba = async (md, q) => {
          const o = opsiGenerate(md.id ? md : { id: md, maxRef: 4, qualities: [], defaultQuality: '' }, ratioTerpilih, mode, q, inputs);
          return { res: await window.puter.ai.txt2img(p, o), id: md.id || md };
        };
        let hasil, dipakai = utama.id || utama;
        try {
          hasil = await coba(utama, qualityTerpilih);
        } catch (e1) {
          if (!bisaFallback(e1) || !fallback) throw e1;
          pesan('Model pilihan sedang tidak tersedia. Mencoba model stabil satu kali…', '');
          hasil = await coba(fallback, '');
          dipakai = fallback.id;
        }
        const src = hasil.res && hasil.res.src ? String(hasil.res.src) : (typeof hasil.res === 'string' ? hasil.res : '');
        if (!/^(data:image\/|blob:|https:\/\/)/i.test(src)) throw new Error('Puter tidak mengembalikan gambar yang valid.');
        if (!alive || token !== genToken) return;
        lastPrompt = p;
        let blob = null;
        try {
          const r = await fetch(src);
          if (r.ok) blob = await r.blob();
        } catch (e) { /* pakai URL langsung */ }
        tampilHasil(blob ? URL.createObjectURL(blob) : src, blob);
        const label = (catalogModel(dipakai) || {}).label || dipakai;
        pesan('Gambar selesai dibuat dengan ' + T.esc(label) + '.', 'ok');
      } catch (e) {
        if (alive && token === genToken) pesan(errPesan(e), 'err');
      } finally {
        if (alive && token === genToken) { busy = false; updateAksi(); }
      }
    });
  }

  setMode('generate');
  hitungPrompt();
  root.appendChild(T.el(utils.puter.poweredBy()));
}
