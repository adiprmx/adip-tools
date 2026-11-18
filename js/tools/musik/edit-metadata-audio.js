import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "edit-metadata-audio", "name": "Edit Metadata Audio", "cat": "musik", "icon": "🏷️", "desc": "Lihat dan ubah judul, artis, album, dan sampul file MP3.", "keywords": "metadata,mp3,id3,judul,artis,album,sampul,tag", "since": "6.17.0"};

/* Pembaca + penulis ID3 murni JavaScript, tanpa pustaka luar.
   Baca: ID3v2.2/2.3/2.4 (judul, artis, album, sampul) + ID3v1 sebagai
   cadangan. Tulis: ID3v2.3 (UTF-16, paling luas didukung pemutar).
   Hanya MP3 yang didukung tulis. Format lain tampil baca-saja dengan
   pesan jujur, tidak dipalsukan. Semua fungsi murni, diuji di Node
   (round-trip tulis lalu baca kembali). */

const isId3 = (b) => b.length >= 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33;
const readSynchsafe = (b, off) => ((b[off] & 0x7f) << 21) | ((b[off + 1] & 0x7f) << 14) | ((b[off + 2] & 0x7f) << 7) | (b[off + 3] & 0x7f);
const synchsafe = (n) => [(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f];

function latin1(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function decodeText(bytes, encoding) {
  const clean = (s) => String(s || '').split('\0')[0].replace(/\0+$/g, '');
  try {
    if (encoding === 1) {
      if (bytes[0] === 0xff && bytes[1] === 0xfe) return clean(new TextDecoder('utf-16le').decode(bytes.subarray(2)));
      if (bytes[0] === 0xfe && bytes[1] === 0xff) return clean(new TextDecoder('utf-16be').decode(bytes.subarray(2)));
      return clean(new TextDecoder('utf-16le').decode(bytes));
    }
    if (encoding === 2) return clean(new TextDecoder('utf-16be').decode(bytes));
    if (encoding === 3) return clean(new TextDecoder('utf-8').decode(bytes));
    return clean(new TextDecoder('iso-8859-1').decode(bytes));
  } catch (e) {
    return clean(latin1(bytes));
  }
}

/* Parse satu frame APIC/PIC -> { mime, data } atau null. */
function parseApic(data, isV22) {
  if (data.length < 4) return null;
  const enc = data[0];
  let o = 1;
  let mime = '';
  if (isV22) {
    // PIC: format gambar 3 huruf ("JPG"/"PNG"), bukan MIME.
    mime = latin1(data.subarray(o, o + 3)).toUpperCase();
    o += 3;
    mime = mime === 'PNG' ? 'image/png' : 'image/jpeg';
  } else {
    const end = data.indexOf(0, o);
    if (end < 0) return null;
    mime = latin1(data.subarray(o, end)).trim().toLowerCase() || 'image/jpeg';
    if (mime === 'image/jpg') mime = 'image/jpeg';
    o = end + 1;
  }
  o += 1; // tipe gambar
  // Deskripsi: terminator 1 byte (enc 0/3) atau 2 byte (enc 1/2).
  if (enc === 1 || enc === 2) {
    while (o + 1 < data.length && !(data[o] === 0 && data[o + 1] === 0)) o += 2;
    o += 2;
  } else {
    const end = data.indexOf(0, o);
    if (end < 0) return null;
    o = end + 1;
  }
  if (o >= data.length) return null;
  return { mime, data: data.subarray(o) };
}

function readTextFrame(id, data, result) {
  if (data.length < 1) return;
  const text = decodeText(data.subarray(1), data[0]);
  if (!text) return;
  if (id === 'TIT2' || id === 'TT2') result.title = text;
  else if (id === 'TPE1' || id === 'TP1') result.artist = text;
  else if (id === 'TALB' || id === 'TAL') result.album = text;
}

export function parseAudioTags(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const result = { isMp3: false, hasId3v2: false, hasId3v1: false, title: '', artist: '', album: '', cover: null };
  // MP3? Header ID3, atau frame sync MPEG (0xFF + 3 bit atas byte berikut)
  // dalam 8 KB pertama.
  if (isId3(b)) result.isMp3 = true;
  else {
    for (let i = 0; i < Math.min(b.length - 1, 8192); i++) {
      if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) { result.isMp3 = true; break; }
    }
  }
  if (isId3(b)) {
    result.hasId3v2 = true;
    const ver = b[3];
    const tagSize = readSynchsafe(b, 6);
    const end = Math.min(10 + tagSize, b.length);
    if (ver === 2) {
      let o = 10;
      while (o + 6 <= end) {
        const id = latin1(b.subarray(o, o + 3));
        if (id === '\0\0\0') break;
        const size = (b[o + 3] << 16) | (b[o + 4] << 8) | b[o + 5];
        if (size <= 0 || o + 6 + size > end) break;
        const data = b.subarray(o + 6, o + 6 + size);
        if (id === 'PIC') { const c = parseApic(data, true); if (c && !result.cover) result.cover = c; }
        else readTextFrame(id, data, result);
        o += 6 + size;
      }
    } else {
      let o = 10;
      while (o + 10 <= end) {
        const id = latin1(b.subarray(o, o + 4));
        if (id === '\0\0\0\0') break;
        const size = ver === 4
          ? readSynchsafe(b, o + 4)
          : (((b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7]) >>> 0);
        if (size <= 0 || o + 10 + size > end) break;
        const data = b.subarray(o + 10, o + 10 + size);
        if (id === 'APIC') { const c = parseApic(data, false); if (c && !result.cover) result.cover = c; }
        else readTextFrame(id, data, result);
        o += 10 + size;
      }
    }
  }
  // ID3v1 (128 byte terakhir) sebagai cadangan bila v2 tidak punya isinya.
  if (b.length >= 128) {
    const t = b.length - 128;
    if (b[t] === 0x54 && b[t + 1] === 0x41 && b[t + 2] === 0x47) {
      result.hasId3v1 = true;
      const s = (off, len) => latin1(b.subarray(t + off, t + off + len)).replace(/\0+$/g, '').trim();
      if (!result.title) result.title = s(3, 30);
      if (!result.artist) result.artist = s(33, 30);
      if (!result.album) result.album = s(63, 30);
    }
  }
  return result;
}

function frame(id, body) {
  const out = new Uint8Array(10 + body.length);
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  out[4] = (body.length >> 24) & 0xff; out[5] = (body.length >> 16) & 0xff;
  out[6] = (body.length >> 8) & 0xff; out[7] = body.length & 0xff;
  out[8] = 0; out[9] = 0;
  out.set(body, 10);
  return out;
}

function textFrame(id, str) {
  if (!str) return null;
  const body = new Uint8Array(1 + 2 + str.length * 2);
  body[0] = 1; // UTF-16 dengan BOM
  body[1] = 0xff; body[2] = 0xfe;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    body[3 + i * 2] = code & 0xff;
    body[3 + i * 2 + 1] = (code >> 8) & 0xff;
  }
  return frame(id, body);
}

function apicFrame(mime, imageBytes) {
  const mimeBytes = new TextEncoder().encode(mime);
  const body = new Uint8Array(1 + mimeBytes.length + 1 + 1 + 1 + imageBytes.length);
  let o = 0;
  body[o++] = 0; // encoding latin1 (deskripsi kosong)
  body.set(mimeBytes, o); o += mimeBytes.length;
  body[o++] = 0; // akhir MIME
  body[o++] = 3; // sampul depan
  body[o++] = 0; // deskripsi kosong
  body.set(imageBytes, o);
  return frame('APIC', body);
}

export function buildId3v2Tag(fields) {
  const parts = [];
  const t = textFrame('TIT2', (fields.title || '').trim());
  if (t) parts.push(t);
  const a = textFrame('TPE1', (fields.artist || '').trim());
  if (a) parts.push(a);
  const al = textFrame('TALB', (fields.album || '').trim());
  if (al) parts.push(al);
  if (fields.cover && fields.cover.data && fields.cover.data.length) {
    parts.push(apicFrame(fields.cover.mime || 'image/jpeg', fields.cover.data));
  }
  const bodyLen = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(10 + bodyLen);
  out[0] = 0x49; out[1] = 0x44; out[2] = 0x33; // "ID3"
  out[3] = 3; out[4] = 0; out[5] = 0; // versi 2.3
  const ss = synchsafe(bodyLen);
  out[6] = ss[0]; out[7] = ss[1]; out[8] = ss[2]; out[9] = ss[3];
  let o = 10;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/* Buang tag ID3v2 di depan dan ID3v1 di belakang, sisakan data suara. */
export function stripAudioTags(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  let start = 0;
  let end = b.length;
  if (isId3(b)) {
    start = 10 + readSynchsafe(b, 6);
    if (b[5] & 0x10) start += 10; // flag footer (v2.4)
    if (start > b.length) start = 0;
  }
  if (end >= 128) {
    const t = end - 128;
    if (b[t] === 0x54 && b[t + 1] === 0x41 && b[t + 2] === 0x47) end = t;
  }
  return b.subarray(start, end);
}

/* Tulis keterangan baru: tag lama dibuang, tag baru ditempel di depan. */
export function writeAudioTags(input, fields) {
  const audio = stripAudioTags(input);
  const tag = buildId3v2Tag(fields);
  const out = new Uint8Array(tag.length + audio.length);
  out.set(tag, 0);
  out.set(audio, tag.length);
  return out;
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const coverFile = T.input('file');
  coverFile.accept = 'image/jpeg,image/png';
  const infoBox = T.out();
  const formBox = T.out();
  const outBox = T.out();
  const coverBox = T.out();
  const titleInp = T.input('text', 'Judul lagu');
  const artistInp = T.input('text', 'Nama penyanyi');
  const albumInp = T.input('text', 'Nama album');
  let fileObj = null, fileBytes = null, tags = null, busy = false;
  let newCover = null, coverUrl = null, removeCover = false;

  const showCover = (cover) => {
    if (coverUrl) { URL.revokeObjectURL(coverUrl); coverUrl = null; }
    if (!cover || !cover.data || !cover.data.length) { T.hide(coverBox); return; }
    const blob = new Blob([cover.data], { type: cover.mime || 'image/jpeg' });
    coverUrl = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = coverUrl;
    img.alt = 'Sampul album';
    img.style.cssText = 'width:120px;height:120px;object-fit:cover;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(coverBox, '<p class="hint" style="margin-bottom:8px">Sampul saat ini:</p>');
    coverBox.appendChild(img);
  };

  const setFormEnabled = (on) => {
    titleInp.disabled = !on;
    artistInp.disabled = !on;
    albumInp.disabled = !on;
    coverFile.disabled = !on;
    saveBtn.disabled = !on;
    clearBtn.disabled = !on;
  };

  const saveBtn = T.btn('Simpan keterangan', () => {
    if (busy || !fileBytes || !tags || !tags.isMp3) return;
    busy = true;
    saveBtn.disabled = true;
    try {
      const cover = removeCover ? null : (newCover || tags.cover);
      const out = writeAudioTags(fileBytes, {
        title: titleInp.value,
        artist: artistInp.value,
        album: albumInp.value,
        cover,
      });
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'lagu';
      const blob = new Blob([out], { type: 'audio/mpeg' });
      T.dl(base + '.mp3', blob, 'audio/mpeg');
      T.show(outBox, '<span class="ok">Selesai. File MP3 dengan keterangan baru terunduh.</span>' +
        kv('Judul', T.esc(titleInp.value.trim()) || '(kosong)') +
        kv('Artis', T.esc(artistInp.value.trim()) || '(kosong)') +
        kv('Album', T.esc(albumInp.value.trim()) || '(kosong)') +
        kv('Sampul', cover ? 'Ada' : 'Tidak ada') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Keterangan tersimpan');
    } catch (e) {
      T.show(outBox, errBox('Gagal menyimpan keterangan. Coba lagi atau pakai file MP3 lain.'));
    } finally {
      busy = false;
      saveBtn.disabled = false;
    }
  }, true);

  const clearBtn = T.btn('Hapus semua keterangan', () => {
    if (busy || !fileBytes || !tags || !tags.isMp3) return;
    busy = true;
    clearBtn.disabled = true;
    try {
      const audio = stripAudioTags(fileBytes);
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'lagu';
      const blob = new Blob([audio], { type: 'audio/mpeg' });
      T.dl(base + '-tanpa-keterangan.mp3', blob, 'audio/mpeg');
      titleInp.value = '';
      artistInp.value = '';
      albumInp.value = '';
      newCover = null;
      removeCover = false;
      showCover(null);
      T.show(outBox, '<span class="ok">Selesai. File MP3 tanpa keterangan terunduh.</span>' +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Keterangan dihapus');
    } catch (e) {
      T.show(outBox, errBox('Gagal menghapus keterangan. Coba lagi.'));
    } finally {
      busy = false;
      clearBtn.disabled = false;
    }
  });

  const removeCoverBtn = T.btn('Hapus sampul', () => {
    removeCover = true;
    newCover = null;
    coverFile.value = '';
    showCover(null);
    T.toast('Sampul akan dihapus saat disimpan');
  });
  removeCoverBtn.classList.add('small');

  coverFile.addEventListener('change', async () => {
    const f = coverFile.files && coverFile.files[0] ? coverFile.files[0] : null;
    if (!f) return;
    if (f.type !== 'image/jpeg' && f.type !== 'image/png') {
      T.show(outBox, errBox('Sampul harus gambar JPG atau PNG.'));
      coverFile.value = '';
      return;
    }
    const buf = new Uint8Array(await f.arrayBuffer());
    newCover = { mime: f.type, data: buf };
    removeCover = false;
    showCover(newCover);
    T.hide(outBox);
  });

  file.addEventListener('change', async () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    fileBytes = null;
    tags = null;
    newCover = null;
    removeCover = false;
    coverFile.value = '';
    T.hide(outBox);
    formBox.hidden = true;
    T.hide(coverBox);
    if (!fileObj) { T.hide(infoBox); return; }
    T.show(infoBox, '<span class="dim">Membaca file…</span>');
    try {
      fileBytes = new Uint8Array(await fileObj.arrayBuffer());
      tags = parseAudioTags(fileBytes);
      titleInp.value = tags.title || '';
      artistInp.value = tags.artist || '';
      albumInp.value = tags.album || '';
      if (!tags.isMp3) {
        T.show(infoBox,
          kv('File', T.esc(fileObj.name)) +
          kv('Ukuran', fmtBytes(fileObj.size)) +
          '<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0">File ini bukan MP3. Tool ini hanya bisa mengubah keterangan file MP3, jadi di sini keterangannya tidak bisa dibaca atau diubah. Coba pilih file MP3.</p>');
        setFormEnabled(false);
        return;
      }
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Ukuran', fmtBytes(fileObj.size)) +
        kv('Keterangan lama', tags.hasId3v2 || tags.hasId3v1 ? 'Ada' : 'Belum ada'));
      formBox.hidden = false;
      setFormEnabled(true);
      showCover(tags.cover);
    } catch (e) {
      T.show(infoBox, errBox('File ini tidak bisa dibaca. Coba file MP3 lain.'));
    }
  });

  T.onLeave(() => { if (coverUrl) URL.revokeObjectURL(coverUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah judul, artis, album, dan sampul yang tampil di pemutar musik. Hanya file MP3 yang bisa diubah di sini. File lain (seperti WAV atau FLAC) tidak bisa dibaca keterangannya oleh tool ini.</p>'));
  root.appendChild(T.field('Pilih file MP3', file, 'Hanya MP3 yang keterangannya bisa diubah.'));
  root.appendChild(infoBox);
  root.appendChild(formBox);
  formBox.appendChild(T.field('Judul', titleInp));
  formBox.appendChild(T.field('Artis', artistInp));
  formBox.appendChild(T.field('Album', albumInp));
  formBox.appendChild(T.field('Sampul baru (opsional)', coverFile, 'JPG atau PNG. Kosongkan bila sampul lama tetap dipakai.'));
  formBox.appendChild(coverBox);
  formBox.appendChild(T.row(removeCoverBtn));
  formBox.appendChild(T.el('<div style="height:10px"></div>'));
  formBox.appendChild(T.row(saveBtn, clearBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Lagunya tidak diunggah ke mana-mana. Suaranya tidak diubah, hanya keterangannya.</p>'));
}
