import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id": "fotolink", "name": "Foto to Link", "cat": "gambar", "icon": "🔗", "desc": "Upload gambar → dapat URL publik langsung.", "keywords": "upload,link,url,gambar,hosting,catbox"};

// API upload publik independen (tanpa key, tanpa daftar): catbox.moe
export const CATBOX_API = 'https://catbox.moe/user/api.php';
// Batas 10 MB mengikuti tool aslinya (photo-to-link: "JPG · PNG · WEBP · GIF MAX 10 MB")
export const MAX_FILE = 10 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Bangun FormData upload catbox (tanpa DOM — bisa diuji). */
export function buildCatboxForm(file) {
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', file);
  return fd;
}
/** Validasi file sebelum upload (tanpa DOM — bisa diuji). Return null bila OK. */
export function validateImage(file) {
  if (!file) return 'Pilih gambar dulu.';
  if (!OK_TYPES.includes(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name || '')) return 'Format tidak didukung. Pakai JPG/PNG/WebP/GIF.';
  if (file.size > MAX_FILE) return 'File melebihi 10 MB.';
  if (file.size === 0) return 'File kosong.';
  return null;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload gambar → dapat <b>direct URL publik</b> yang bisa ditempel di mana saja. Bisa juga tempel (paste) screenshot langsung dari clipboard.<br><span class="dim" style="font-size:12px">Hosting via API publik catbox.moe (gratis, tanpa daftar). ⚠️ Link bersifat publik — jangan upload foto pribadi/rahasia.</span></p>'));

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-size:30px">📤</div><div style="margin-top:6px;font-weight:700">Ketuk / seret gambar · atau paste (Ctrl+V)</div><div class="dim" style="font-size:12px;margin-top:4px">JPG · PNG · WebP · GIF — maks 10 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>');
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]); });
  document.addEventListener('paste', onPaste);
  T.onLeave(() => document.removeEventListener('paste', onPaste));
  function onPaste(e) {
    if (document.hidden) return;
    const items = (e.clipboardData && e.clipboardData.files) || [];
    for (const f of items) if (f.type.startsWith('image/')) { upload(f); e.preventDefault(); break; }
  }
  root.appendChild(dz); root.appendChild(fileInp);
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) upload(fileInp.files[0]); });

  const out = T.out();
  root.appendChild(out);
  let busy = false;

  async function upload(file) {
    if (busy) return;
    const err = validateImage(file);
    if (err) { T.show(out, '<span class="err">' + T.esc(err) + '</span>'); return; }
    busy = true;
    const previewUrl = URL.createObjectURL(file);
    T.show(out, '<span class="dim">⏳ Mengupload ' + T.esc(file.name || 'gambar') + ' (' + (file.size / 1024).toFixed(0) + ' KB)…</span>');
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 90000);
      const r = await fetch(CATBOX_API, { method: 'POST', body: buildCatboxForm(file), signal: ctrl.signal });
      clearTimeout(to);
      const text = (await r.text()).trim();
      if (!r.ok || !/^https:\/\/files\.catbox\.moe\//.test(text)) throw new Error(text.slice(0, 120) || 'upload-gagal');
      drawSuccess(text, previewUrl, file);
    } catch (e) {
      T.show(out, '<span class="err">Upload gagal (' + T.esc(e && e.name === 'AbortError' ? 'timeout' : (e && e.message ? e.message : 'error')) + '). Coba lagi.</span>');
    } finally { busy = false; }
  }

  function drawSuccess(url, previewUrl, file) {
    const box = T.el('<div></div>');
    box.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">✅ Upload berhasil</div>'));
    const img = T.el('<img style="max-width:100%;max-height:260px;border-radius:12px;border:1px solid #2e2823;display:block;margin-bottom:10px" alt="preview">');
    img.src = previewUrl;
    box.appendChild(img);
    const linkField = T.el('<div style="display:flex;gap:6px"></div>');
    const linkInp = T.input('text', '', url);
    linkInp.readOnly = true; linkInp.style.fontFamily = 'monospace'; linkInp.style.fontSize = '12px'; linkInp.style.flex = '1';
    linkField.appendChild(linkInp);
    linkField.appendChild(T.copyBtn(() => url, 'Salin'));
    box.appendChild(T.field('Direct URL', linkField));
    box.appendChild(T.el('<div class="dim" style="font-size:12px;margin:6px 0">' + T.esc(file.type || '') + ' · ' + (file.size / 1024).toFixed(1) + ' KB</div>'));
    box.appendChild(T.row(
      T.el('<a class="btn" href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">🔗 Buka gambar</a>'),
      T.btn('🔁 Upload lagi', () => { T.hide(out); fileInp.click(); }, true)
    ));
    T.show(out, ''); out.innerHTML = ''; out.appendChild(box);
    T.scrollToPreview(out);
  }
}
