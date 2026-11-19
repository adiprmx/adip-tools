import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Buka File EML: baca file email .eml di browser ini saja. Menampilkan
// pengirim, penerima, subjek, tanggal, isi teks, dan daftar lampiran
// yang bisa diunduh. Isi HTML ditampilkan di bingkai terisolasi
// (sandbox) supaya skrip di dalam email tidak bisa jalan.
export const meta = {"id": "buka-file-eml", "name": "Buka File EML", "cat": "produktivitas", "icon": "✉️", "desc": "Baca isi file email .eml: pengirim, isi, dan lampirannya.", "keywords": "eml,buka eml,email,file email,lampiran email", "since": "6.19.0"};

const _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Dekode base64 jadi byte, tanpa atob supaya sama di browser dan Node.
// Karakter di luar alfabet base64 diabaikan. Murni, bisa diuji di Node.
export function b64KeBytes(s) {
  const bersih = String(s || '').replace(/[^A-Za-z0-9+/=]/g, '');
  const peta = {};
  for (let i = 0; i < _B64.length; i++) peta[_B64[i]] = i;
  const keluar = [];
  let buf = 0, bit = 0;
  for (const c of bersih) {
    if (c === '=') break;
    buf = (buf << 6) | peta[c];
    bit += 6;
    if (bit >= 8) {
      bit -= 8;
      keluar.push((buf >> bit) & 0xff);
    }
  }
  return new Uint8Array(keluar);
}

// Dekode quoted-printable (=XX dan baris sambung). Murni.
export function decodeQuotedPrintable(s) {
  const teks = String(s || '').replace(/=\r?\n/g, '');
  const byte = [];
  for (let i = 0; i < teks.length; i++) {
    if (teks[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(teks.slice(i + 1, i + 3))) {
      byte.push(parseInt(teks.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const kode = teks.charCodeAt(i);
      byte.push(kode < 128 ? kode : 63);
    }
  }
  return byte;
}

// Byte jadi teks. Charset yang tidak dikenal jatuh ke UTF-8. Murni.
export function bytesKeTeks(byte, charset) {
  const nama = String(charset || 'utf-8').trim().toLowerCase() || 'utf-8';
  try { return new TextDecoder(nama).decode(byte instanceof Uint8Array ? byte : new Uint8Array(byte)); }
  catch (e) { try { return new TextDecoder('utf-8').decode(byte instanceof Uint8Array ? byte : new Uint8Array(byte)); } catch (e2) { return ''; } }
}

// Dekode kata terkode RFC 2047 (=?UTF-8?B?...?= atau =?UTF-8?Q?...?=).
// Murni, bisa diuji di Node.
export function decodeKataTerkode(s) {
  return String(s || '').replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (m, cs, enc, isi) => {
    try {
      if (enc.toUpperCase() === 'B') return bytesKeTeks(b64KeBytes(isi), cs);
      const qp = isi.replace(/_/g, ' ');
      return bytesKeTeks(decodeQuotedPrintable(qp), cs);
    } catch (e) { return m; }
  });
}

// Urai blok header jadi {nama: nilai} (nama huruf kecil, baris sambung
// digabung, nilai didekode). Murni, bisa diuji di Node.
export function uraiHeader(teks) {
  const hasil = {};
  const baris = String(teks || '').replace(/\r\n?/g, '\n').split('\n');
  let nama = '', nilai = '';
  const siram = () => {
    if (nama) hasil[nama] = decodeKataTerkode(nilai.trim().replace(/\s+/g, ' '));
  };
  for (const b of baris) {
    const m = /^([A-Za-z0-9-]+):\s*(.*)$/.exec(b);
    if (m) { siram(); nama = m[1].toLowerCase(); nilai = m[2]; }
    else if (/^[ \t]/.test(b) && nama) { nilai += ' ' + b.trim(); }
  }
  siram();
  return hasil;
}

// Ambil parameter dari nilai header, mis. boundary atau charset. Murni.
export function paramHeader(nilai, param) {
  const m = new RegExp(param + '\\s*=\\s*"?([^";\\s]+)"?', 'i').exec(String(nilai || ''));
  return m ? m[1] : '';
}

// Dekode isi bagian sesuai Content-Transfer-Encoding jadi byte. Murni.
export function isiKeByte(isi, encoding) {
  const enc = String(encoding || '').trim().toLowerCase();
  if (enc === 'base64') return b64KeBytes(isi);
  if (enc === 'quoted-printable') return new Uint8Array(decodeQuotedPrintable(isi));
  return new TextEncoder().encode(String(isi || ''));
}

// Urai satu file .eml utuh. Mengembalikan:
// {dari, kepada, cc, subjek, tanggal, teks, html, lampiran: [{nama, tipe,
// ukuran, bytes}], peringatan}. Murni, bisa diuji di Node.
export function parseEml(teksMentah) {
  const mentah = String(teksMentah || '').replace(/\r\n?/g, '\n');
  const hasil = { dari: '', kepada: '', cc: '', subjek: '', tanggal: '', teks: '', html: '', lampiran: [], peringatan: '' };
  const pisah = mentah.indexOf('\n\n');
  const kepala = pisah >= 0 ? mentah.slice(0, pisah) : mentah;
  const badan = pisah >= 0 ? mentah.slice(pisah + 2) : '';
  const h = uraiHeader(kepala);
  hasil.dari = h.from || '';
  hasil.kepada = h.to || '';
  hasil.cc = h.cc || '';
  hasil.subjek = h.subject || '';
  hasil.tanggal = h.date || '';
  if (!pisah && !h.from && !h.subject) hasil.peringatan = 'File ini tidak terlihat seperti email .eml (tidak ada baris pengirim atau subjek).';

  function prosesBagian(kepalaBagian, badanBagian, kedalaman) {
    const hb = uraiHeader(kepalaBagian);
    const tipe = String(hb['content-type'] || 'text/plain').split(';')[0].trim().toLowerCase();
    const disp = String(hb['content-disposition'] || '').toLowerCase();
    const nama = decodeKataTerkode(paramHeader(hb['content-disposition'], 'filename') || paramHeader(hb['content-type'], 'name') || '');
    const enc = hb['content-transfer-encoding'] || '';
    if (tipe.startsWith('multipart/') && kedalaman < 5) {
      const batas = paramHeader(hb['content-type'], 'boundary');
      if (!batas) return;
      const potong = badanBagian.split('--' + batas);
      for (let i = 1; i < potong.length; i++) {
        let bagian = potong[i];
        if (bagian.startsWith('--')) break;
        bagian = bagian.replace(/^\n/, '');
        const p = bagian.indexOf('\n\n');
        if (p < 0) continue;
        prosesBagian(bagian.slice(0, p), bagian.slice(p + 2).replace(/\n$/, ''), kedalaman + 1);
      }
      return;
    }
    const byte = isiKeByte(badanBagian, enc);
    if (disp.includes('attachment') || (nama && tipe !== 'text/plain' && tipe !== 'text/html')) {
      hasil.lampiran.push({ nama: nama || 'lampiran', tipe: tipe || 'application/octet-stream', ukuran: byte.length, bytes: byte });
      return;
    }
    if (tipe === 'text/plain' && !hasil.teks) {
      hasil.teks = bytesKeTeks(byte, paramHeader(hb['content-type'], 'charset'));
    } else if (tipe === 'text/html' && !hasil.html) {
      hasil.html = bytesKeTeks(byte, paramHeader(hb['content-type'], 'charset'));
    } else if (tipe.startsWith('text/') && !hasil.teks) {
      hasil.teks = bytesKeTeks(byte, paramHeader(hb['content-type'], 'charset'));
    }
  }

  const tipeUtama = String(h['content-type'] || 'text/plain').split(';')[0].trim().toLowerCase();
  if (tipeUtama.startsWith('multipart/')) {
    prosesBagian(kepala, badan, 0);
  } else {
    prosesBagian(kepala, badan, 4);
  }
  if (!hasil.teks && !hasil.html && !hasil.lampiran.length && !hasil.peringatan) {
    hasil.peringatan = 'Isi email tidak ditemukan. Mungkin formatnya tidak didukung.';
  }
  return hasil;
}

// Bersihkan HTML email dari elemen aktif sebelum ditampilkan di iframe
// sandbox (lapis kedua; sandbox tanpa allow-scripts sudah memblokir
// skrip). Butuh DOM, hanya dipakai di browser.
export function bersihkanHtmlEmail(html) {
  const dok = new DOMParser().parseFromString(String(html || ''), 'text/html');
  dok.querySelectorAll('script, iframe, object, embed, form, link, meta, base, style').forEach((n) => n.remove());
  dok.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => {
      if (/^on/i.test(a.name) || (a.name === 'href' && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
    });
  });
  return dok.documentElement.outerHTML;
}

export function render(root) {
  const fi = fileInput('.eml,message/rfc822');
  const box = T.out();
  const statusBox = T.out();
  let hasilTerakhir = null;

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file .eml dulu'); return; }
    T.hide(box);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Membaca email…</span>');
    try {
      const teks = await f.text();
      const r = parseEml(teks);
      hasilTerakhir = r;
      T.hide(statusBox);
      const baris = [
        ['Dari', r.dari], ['Kepada', r.kepada], ['Cc', r.cc],
        ['Subjek', r.subjek], ['Tanggal', r.tanggal],
      ].filter(([, v]) => v).map(([k, v]) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + T.esc(v) + '</span></div>').join('');
      let html = '';
      if (r.peringatan) html += '<div class="err">' + T.esc(r.peringatan) + '</div>';
      html += baris ? '<div style="margin-bottom:12px">' + baris + '</div>' : '<p class="dim">Tidak ada info pengirim di file ini.</p>';
      if (r.teks) {
        html += '<div style="font-weight:700;margin:12px 0 6px">Isi email (teks)</div>';
        html += '<pre style="white-space:pre-wrap;word-break:break-word;background:#ffffff08;border:1px solid #ffffff14;border-radius:10px;padding:12px;font-size:13px;line-height:1.6;max-height:320px;overflow:auto">' + T.esc(r.teks) + '</pre>';
      }
      T.show(box, html);
      if (r.html) {
        const judul = T.el('<div style="font-weight:700;margin:12px 0 6px">Isi email (tampilan asli)</div>');
        const frame = document.createElement('iframe');
        frame.setAttribute('sandbox', '');
        frame.style.cssText = 'width:100%;height:320px;border:1px solid #ffffff14;border-radius:10px;background:#fff';
        frame.srcdoc = bersihkanHtmlEmail(r.html);
        frame.title = 'Isi email versi HTML';
        box.appendChild(judul);
        box.appendChild(frame);
      }
      if (r.lampiran.length) {
        const judul = T.el('<div style="font-weight:700;margin:12px 0 6px">Lampiran (' + r.lampiran.length + ')</div>');
        box.appendChild(judul);
        r.lampiran.forEach((lamp) => {
          const barisLamp = T.el('<div class="row" style="align-items:center;margin-bottom:8px"></div>');
          barisLamp.appendChild(T.el('<span style="font-size:13px;flex:1;word-break:break-word">📎 ' + T.esc(lamp.nama) + ' <span class="dim">(' + fmtBytes(lamp.ukuran) + ')</span></span>'));
          barisLamp.appendChild(T.btn('Unduh', () => {
            const blob = new Blob([lamp.bytes], { type: lamp.tipe });
            T.dl(lamp.nama, blob, lamp.tipe);
            T.toast('Lampiran diunduh');
          }));
          box.appendChild(barisLamp);
        });
      } else if (!r.teks && !r.html) {
        box.appendChild(T.el('<p class="dim">Tidak ada isi atau lampiran yang bisa ditampilkan.</p>'));
      }
      const aksi = T.el('<div class="row" style="margin-top:12px"></div>');
      if (r.teks) aksi.appendChild(T.copyBtn(() => r.teks, 'Salin isi teks'));
      if (r.subjek || r.dari) aksi.appendChild(T.copyBtn(() => 'Dari: ' + r.dari + '\nKepada: ' + r.kepada + '\nSubjek: ' + r.subjek + '\nTanggal: ' + r.tanggal, 'Salin info email'));
      if (aksi.children.length) box.appendChild(aksi);
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">File tidak bisa dibaca. Pastikan filenya .eml yang benar.</div>');
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Buka Email', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">File .eml biasanya berasal dari aplikasi email di laptop. Tempel atau pilih filenya untuk membaca isinya di sini.</p>'));
  root.appendChild(T.field('Pilih file .eml', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
}
