import { h as T, LOCAL_NOTE, fmtBytes } from '../../core.js';

// Base64 ke Gambar: ubah teks Base64 kembali jadi file gambar. Terima
// kode polos maupun data URI lengkap (data:image/png;base64,...).
export const meta = {"id": "base64-ke-gambar", "name": "Base64 ke Gambar", "cat": "gambar", "icon": "🖼️", "desc": "Ubah teks Base64 kembali jadi gambar yang bisa dilihat dan diunduh.", "keywords": "base64,gambar,decode,data uri,ubah base64 jadi gambar", "since": "6.18.0"};

// Bersihkan teks: buang awalan data URI bila ada, buang spasi dan baris
// baru. Kembalikan { bersih, mime } (mime dari awalan, atau null).
export function bersihkanBase64(teks) {
  let s = String(teks == null ? '' : teks).trim();
  let mime = null;
  const m = s.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,/i);
  if (m) { mime = m[1].toLowerCase(); s = s.slice(m[0].length); }
  s = s.replace(/\s+/g, '');
  return { bersih: s, mime };
}

// Kenali format gambar dari byte awalnya (magic bytes). Murni.
export function deteksiFormat(bytes) {
  if (!bytes || bytes.length < 4) return null;
  const awal = (n) => Array.from(bytes.slice(0, n));
  const sama = (arr, pat) => pat.every((v, i) => arr[i] === v);
  if (sama(awal(8), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png', nama: 'PNG' };
  }
  if (sama(awal(3), [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: 'jpg', nama: 'JPG' };
  }
  if (sama(awal(6), [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || sama(awal(6), [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
    return { mime: 'image/gif', ext: 'gif', nama: 'GIF' };
  }
  if (sama(awal(4), [0x52, 0x49, 0x46, 0x46]) && bytes.length >= 12 && sama(Array.from(bytes.slice(8, 12)), [0x57, 0x45, 0x42, 0x50])) {
    return { mime: 'image/webp', ext: 'webp', nama: 'WebP' };
  }
  if (sama(awal(2), [0x42, 0x4d])) {
    return { mime: 'image/bmp', ext: 'bmp', nama: 'BMP' };
  }
  if (sama(awal(4), [0x00, 0x00, 0x01, 0x00])) {
    return { mime: 'image/vnd.microsoft.icon', ext: 'ico', nama: 'ICO' };
  }
  // SVG: teks XML yang diawali <svg atau <?xml ... <svg
  try {
    const teks = new TextDecoder('utf-8').decode(bytes.slice(0, 512)).trim();
    if (/^(<\?xml[^>]*\?>\s*)?<svg[\s>]/.test(teks)) {
      return { mime: 'image/svg+xml', ext: 'svg', nama: 'SVG' };
    }
  } catch (e) {}
  return null;
}

// Base64 murni jadi byte. Lempar Error bila kodenya tidak valid.
export function base64KeByte(b64) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64) || b64.length % 4 !== 0) {
    throw new Error('tidak-valid');
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function render(root) {
  const ta = T.ta(6, 'Tempel kode Base64 di sini, atau data URI lengkap (data:image/png;base64,...)', '');
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  let blobHasil = null;
  let formatHasil = null;
  let urlHasil = '';

  function tampilkan() {
    T.hide(box); T.hide(infoBox);
    blobHasil = null; formatHasil = null;
    if (urlHasil) { URL.revokeObjectURL(urlHasil); urlHasil = ''; }
    unduhB.disabled = true;
    salinB.disabled = true;
    const { bersih, mime } = bersihkanBase64(ta.value);
    if (!bersih) {
      T.show(statusBox, '<div class="err">Tempel dulu kode Base64-nya di kolom atas.</div>');
      return;
    }
    let bytes;
    try {
      bytes = base64KeByte(bersih);
    } catch (e) {
      T.show(statusBox, '<div class="err">Kode ini bukan Base64 yang benar. Periksa lagi, mungkin ada huruf yang kurang atau terpotong saat disalin.</div>');
      return;
    }
    const format = deteksiFormat(bytes) || (mime && mime.startsWith('image/')
      ? { mime, ext: mime.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg'), nama: mime.split('/')[1].toUpperCase() }
      : null);
    if (!format) {
      T.show(statusBox, '<div class="err">Kode Base64-nya benar, tapi isinya bukan gambar yang dikenali (PNG, JPG, GIF, WebP, BMP, ICO, atau SVG).</div>');
      return;
    }
    blobHasil = new Blob([bytes], { type: format.mime });
    formatHasil = format;
    urlHasil = URL.createObjectURL(blobHasil);
    const img = document.createElement('img');
    img.src = urlHasil;
    img.alt = 'Gambar hasil Base64';
    img.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
    img.onerror = () => {
      T.show(statusBox, '<div class="err">Gambarnya tidak bisa dibuka. Kodenya mungkin terpotong atau formatnya rusak.</div>');
      T.hide(box); T.hide(infoBox);
      unduhB.disabled = true;
      salinB.disabled = true;
    };
    T.hide(statusBox);
    T.show(box, '');
    box.appendChild(img);
    T.show(infoBox, '<span class="dim">Format: ' + T.esc(format.nama) + ' · Ukuran: ' + fmtBytes(bytes.length) + '</span>');
    unduhB.disabled = false;
    salinB.disabled = false;
  }

  async function tempel() {
    try {
      const teks = await navigator.clipboard.readText();
      if (!teks) { T.toast('Clipboard kosong'); return; }
      ta.value = teks;
      T.toast('Kode ditempel');
      tampilkan();
    } catch (e) {
      T.toast('Browser tidak mengizinkan baca clipboard, tempel manual saja');
    }
  }

  function unduh() {
    if (!blobHasil || !formatHasil) { T.toast('Tampilkan gambar dulu'); return; }
    T.dl('gambar-dari-base64.' + formatHasil.ext, blobHasil, formatHasil.mime);
    T.toast('Berhasil diunduh');
  }

  function salinDataUri() {
    if (!urlHasil || !formatHasil) return;
    const { bersih } = bersihkanBase64(ta.value);
    T.copy('data:' + formatHasil.mime + ';base64,' + bersih);
  }

  const tampilB = T.btn('Tampilkan Gambar', tampilkan, true);
  const tempelB = T.btn('Tempel dari Clipboard', tempel);
  const unduhB = T.btn('Unduh Gambar', unduh, true, true);
  const salinB = T.btn('Salin Data URI', salinDataUri, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Kode Base64', ta, 'Bisa kode polos, bisa juga data URI lengkap dari hasil salin tool lain.'));
  root.appendChild(T.row(tampilB, tempelB));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.row(unduhB, salinB));
  root.appendChild(T.el('<p class="hint">Kode yang ditempel tidak pernah dikirim ke mana-mana, semuanya diubah di perangkatmu.</p>'));
  T.onLeave(() => { if (urlHasil) URL.revokeObjectURL(urlHasil); });
}
