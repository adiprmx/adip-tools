import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Lihat info aplikasi dari file APK (Android) atau IPA (iOS): nama,
// versi, paket, izin, ikon, dan ringkasan isi file. Semua parser ditulis
// sendiri tanpa pustaka: pembaca ZIP (stored + deflate), parser
// AndroidManifest.xml biner (AXML), dan parser Info.plist.
// Batasan jujur: label aplikasi yang tersimpan sebagai referensi
// resource (@0x...) tidak bisa dibaca tanpa tabel resources.arsc, dan
// ikon IPA berformat PNG khusus iOS (CgBI) tidak bisa ditampilkan
// browser — keduanya dilaporkan apa adanya, bukan ditebak.

export const meta = { id: 'info-apk-ipa', name: 'Info APK/IPA', cat: 'developer', icon: '📱', desc: 'Lihat nama aplikasi, versi, ikon, dan izin dari file APK atau IPA tanpa memasang apa pun.', keywords: 'apk,ipa,android,ios,aplikasi,versi,izin,manifest,plist', since: '6.19.0' };

export const IZIN_ANDROID = {
  'android.permission.INTERNET': 'akses internet',
  'android.permission.ACCESS_NETWORK_STATE': 'lihat status jaringan',
  'android.permission.CAMERA': 'kamera',
  'android.permission.RECORD_AUDIO': 'rekam suara',
  'android.permission.ACCESS_FINE_LOCATION': 'lokasi akurat (GPS)',
  'android.permission.ACCESS_COARSE_LOCATION': 'lokasi kasar',
  'android.permission.READ_EXTERNAL_STORAGE': 'baca penyimpanan',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'tulis penyimpanan',
  'android.permission.READ_MEDIA_IMAGES': 'baca foto',
  'android.permission.READ_MEDIA_VIDEO': 'baca video',
  'android.permission.READ_MEDIA_AUDIO': 'baca audio',
  'android.permission.READ_CONTACTS': 'baca kontak',
  'android.permission.SEND_SMS': 'kirim SMS',
  'android.permission.READ_SMS': 'baca SMS',
  'android.permission.CALL_PHONE': 'telepon langsung',
  'android.permission.READ_PHONE_STATE': 'status telepon',
  'android.permission.POST_NOTIFICATIONS': 'tampil notifikasi',
  'android.permission.BLUETOOTH': 'bluetooth',
  'android.permission.BLUETOOTH_CONNECT': 'sambung bluetooth',
  'android.permission.VIBRATE': 'getar',
  'android.permission.WAKE_LOCK': 'jaga layar/proses tetap hidup',
  'android.permission.FOREGROUND_SERVICE': 'layanan latar depan',
  'android.permission.RECEIVE_BOOT_COMPLETED': 'jalan saat HP dinyalakan',
  'android.permission.SYSTEM_ALERT_WINDOW': 'tampil di atas aplikasi lain',
  'android.permission.REQUEST_INSTALL_PACKAGES': 'pasang aplikasi lain',
  'android.permission.NFC': 'NFC',
  'android.permission.USE_BIOMETRIC': 'sidik jari/wajah',
  'android.permission.BODY_SENSORS': 'sensor tubuh',
  'android.permission.ACCESS_WIFI_STATE': 'status Wi-Fi',
  'android.permission.CHANGE_WIFI_STATE': 'ubah Wi-Fi',
};

// ---------- Pembaca ZIP (central directory) ----------
export function bacaZip(u8) {
  if (u8.length < 22) throw new Error('File terlalu kecil untuk arsip ZIP.');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  const awalCari = Math.max(0, u8.length - 65557);
  for (let p = u8.length - 22; p >= awalCari; p--) {
    if (dv.getUint32(p, true) === 0x06054b50) { eocd = p; break; }
  }
  if (eocd < 0) throw new Error('File ini bukan arsip ZIP (APK/IPA adalah ZIP).');
  const jumlah = dv.getUint16(eocd + 10, true);
  const offsetCd = dv.getUint32(eocd + 16, true);
  const entri = [];
  let p = offsetCd;
  for (let i = 0; i < jumlah; i++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
    const metode = dv.getUint16(p + 10, true);
    const ukuranKompres = dv.getUint32(p + 20, true);
    const ukuran = dv.getUint32(p + 24, true);
    const panjangNama = dv.getUint16(p + 28, true);
    const panjangExtra = dv.getUint16(p + 30, true);
    const panjangKomen = dv.getUint16(p + 32, true);
    const offsetLokal = dv.getUint32(p + 42, true);
    const nama = new TextDecoder().decode(u8.slice(p + 46, p + 46 + panjangNama));
    entri.push({ nama, metode, ukuran, ukuranKompres, offset: offsetLokal });
    p += 46 + panjangNama + panjangExtra + panjangKomen;
  }
  return { entri, jumlah };
}

export async function bacaEntriZip(u8, entri) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const p = entri.offset;
  if (p + 30 > u8.length || dv.getUint32(p, true) !== 0x04034b50) throw new Error('Header lokal ZIP rusak untuk ' + entri.nama);
  const panjangNama = dv.getUint16(p + 26, true);
  const panjangExtra = dv.getUint16(p + 28, true);
  const awal = p + 30 + panjangNama + panjangExtra;
  const data = u8.slice(awal, awal + entri.ukuranKompres);
  if (entri.metode === 0) return data;
  if (entri.metode === 8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Deflate tidak didukung di lingkungan ini.');
    // RED-09: batas 16 MB per entri (zip bomb) — manifest/plist/ikon
    // yang sah jauh di bawah itu. Ukuran yang diklaim header dicek
    // duluan, lalu output dibaca per chunk dan dibatalkan bila lewat
    // batas (klaim header bisa bohong).
    const MAKS_ENTRI = 16 * 1024 * 1024;
    if (entri.ukuran > MAKS_ENTRI) throw new Error('Entri ' + entri.nama + ' terlalu besar setelah dibuka (lebih dari 16 MB).');
    const aliran = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = aliran.getReader();
    const potong = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAKS_ENTRI) { try { await reader.cancel(); } catch (e) { /* abaikan */ } throw new Error('Entri ' + entri.nama + ' terlalu besar setelah dibuka (lebih dari 16 MB).'); }
      potong.push(value);
    }
    const keluar = new Uint8Array(total);
    let o = 0;
    for (const c of potong) { keluar.set(c, o); o += c.byteLength; }
    return keluar;
  }
  throw new Error('Metode kompresi ZIP ' + entri.metode + ' tidak didukung.');
}

// ---------- Parser AndroidManifest.xml biner (AXML) ----------
function bacaStringPool(dv, u8, awal) {
  const jumlah = dv.getUint32(awal + 8, true);
  const flags = dv.getUint32(awal + 16, true);
  const awalString = dv.getUint32(awal + 20, true);
  const utf8 = (flags & 0x100) !== 0;
  const hasil = [];
  for (let i = 0; i < jumlah; i++) {
    const off = dv.getUint32(awal + 28 + i * 4, true);
    let p = awal + awalString + off;
    if (utf8) {
      let panjang = u8[p++];
      if (panjang & 0x80) panjang = ((panjang & 0x7f) << 8) | u8[p++];
      let panjangByte = u8[p++];
      if (panjangByte & 0x80) panjangByte = ((panjangByte & 0x7f) << 8) | u8[p++];
      hasil.push(new TextDecoder().decode(u8.slice(p, p + panjangByte)));
    } else {
      let panjang = dv.getUint16(p, true);
      p += 2;
      if (panjang & 0x8000) { panjang = ((panjang & 0x7fff) << 16) | dv.getUint16(p, true); p += 2; }
      const potong = u8.slice(p, p + panjang * 2);
      hasil.push(new TextDecoder('utf-16le').decode(potong));
    }
  }
  return hasil;
}

function nilaiAtribut(dv, p, pool) {
  const ukuran = dv.getUint16(p, true);
  const tipe = dv.getUint8(p + 3);
  const data = dv.getUint32(p + 4, true);
  if (ukuran < 8) return { nilai: null, mentah: true };
  switch (tipe) {
    case 0x03: return { nilai: pool[data] == null ? '' : pool[data], mentah: false };
    case 0x10: return { nilai: (data | 0), mentah: false };
    case 0x11: return { nilai: '0x' + data.toString(16), mentah: false };
    case 0x12: return { nilai: data !== 0, mentah: false };
    case 0x01: return { nilai: '@0x' + data.toString(16).padStart(8, '0'), mentah: true, ref: true };
    case 0x02: return { nilai: '?0x' + data.toString(16).padStart(8, '0'), mentah: true, ref: true };
    default: return { nilai: String(data), mentah: true };
  }
}

export function parseAxml(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.length < 8 || dv.getUint16(0, true) !== 0x0003) throw new Error('Bukan file XML biner Android (AXML).');
  let pool = [];
  let akar = null;
  const tumpuk = [];
  let p = 8;
  while (p + 8 <= u8.length) {
    const jenis = dv.getUint16(p, true);
    const ukuran = dv.getUint32(p + 4, true);
    if (ukuran < 8 || p + ukuran > u8.length) break;
    if (jenis === 0x0001) {
      pool = bacaStringPool(dv, u8, p);
    } else if (jenis === 0x0102) {
      const namaIdx = dv.getInt32(p + 20, true);
      const jumlahAttr = dv.getUint16(p + 28, true);
      const el = { nama: pool[namaIdx] || '', atribut: {}, anak: [] };
      let ap = p + 36;
      for (let i = 0; i < jumlahAttr; i++) {
        const namaAttrIdx = dv.getInt32(ap + 4, true);
        const namaAttr = pool[namaAttrIdx] || '';
        el.atribut[namaAttr] = nilaiAtribut(dv, ap + 12, pool);
        ap += 20;
      }
      if (tumpuk.length) tumpuk[tumpuk.length - 1].anak.push(el);
      else if (!akar) akar = el;
      tumpuk.push(el);
    } else if (jenis === 0x0103) {
      tumpuk.pop();
    }
    p += ukuran;
  }
  if (!akar) throw new Error('Tidak ada elemen XML di manifest.');
  return akar;
}

function attrStr(el, nama) {
  const a = el && el.atribut && el.atribut[nama];
  if (!a) return null;
  return a.nilai;
}
function cariAnak(el, nama) {
  return (el.anak || []).filter((c) => c.nama === nama);
}

export function infoDariManifest(akar) {
  const info = {
    paket: attrStr(akar, 'package'),
    versionCode: attrStr(akar, 'versionCode'),
    versionName: attrStr(akar, 'versionName'),
    compileSdk: attrStr(akar, 'compileSdkVersion'),
  };
  const sdk = cariAnak(akar, 'uses-sdk')[0];
  if (sdk) {
    info.minSdk = attrStr(sdk, 'minSdkVersion');
    info.targetSdk = attrStr(sdk, 'targetSdkVersion');
  }
  info.izin = cariAnak(akar, 'uses-permission').map((e) => attrStr(e, 'name')).filter(Boolean);
  info.izinPlus = cariAnak(akar, 'uses-permission-sdk-23').map((e) => attrStr(e, 'name')).filter(Boolean);
  info.fitur = cariAnak(akar, 'uses-feature').map((e) => attrStr(e, 'name')).filter(Boolean);
  const app = cariAnak(akar, 'application')[0];
  if (app) {
    info.label = attrStr(app, 'label');
    info.labelRef = !!(app.atribut.label && app.atribut.label.ref);
    info.iconRef = attrStr(app, 'icon');
    info.debuggable = attrStr(app, 'debuggable');
    info.aktivitas = cariAnak(app, 'activity').length + cariAnak(app, 'activity-alias').length;
    info.layanan = cariAnak(app, 'service').length;
    info.penerima = cariAnak(app, 'receiver').length;
    info.penyedia = cariAnak(app, 'provider').length;
  }
  return info;
}

// ---------- Parser plist XML (tanpa DOMParser, jalan di Node juga) ----------
function lepasEntitasXml(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

export function parsePlist(teks) {
  const s = String(teks);
  let p = 0;
  function lewati() {
    for (;;) {
      while (p < s.length && /\s/.test(s[p])) p++;
      if (s.startsWith('<!--', p)) { p = s.indexOf('-->', p) + 3; if (p < 3) p = s.length; continue; }
      if (s.startsWith('<?', p)) { p = s.indexOf('?>', p) + 2; if (p < 2) p = s.length; continue; }
      if (s.startsWith('<!DOCTYPE', p)) { p = s.indexOf('>', p) + 1; if (p < 1) p = s.length; continue; } // RED-10: -1 ditangani seperti cabang <!-- dan <? di atas
      return;
    }
  }
  function bacaTag() {
    lewati();
    if (s[p] !== '<') throw new Error('Plist rusak di posisi ' + p);
    const akhir = s.indexOf('>', p);
    if (akhir < 0) throw new Error('Plist rusak: tag tidak tertutup.');
    const isi = s.slice(p + 1, akhir).trim();
    p = akhir + 1;
    if (isi.endsWith('/')) return { nama: isi.slice(0, -1).trim().split(/\s+/)[0], tutupSendiri: true };
    return { nama: isi.split(/\s+/)[0], tutupSendiri: false };
  }
  function bacaTeksSampai(penutup) {
    const idx = s.indexOf(penutup, p);
    if (idx < 0) throw new Error('Plist rusak: ' + penutup + ' tidak ketemu.');
    const t = s.slice(p, idx);
    p = idx + penutup.length;
    return t;
  }
  function bacaNilai() {
    const tag = bacaTag();
    switch (tag.nama) {
      case 'plist': { const v = bacaNilai(); lewati(); if (s.startsWith('</plist>', p)) p += 8; return v; }
      case 'dict': {
        const obj = {};
        for (;;) {
          lewati();
          if (s.startsWith('</dict>', p)) { p += 7; return obj; }
          const kt = bacaTag();
          if (kt.nama !== 'key') throw new Error('Plist rusak: dict tanpa key.');
          const kunci = lepasEntitasXml(bacaTeksSampai('</key>'));
          obj[kunci] = bacaNilai();
        }
      }
      case 'array': {
        const arr = [];
        for (;;) {
          lewati();
          if (s.startsWith('</array>', p)) { p += 8; return arr; }
          arr.push(bacaNilai());
        }
      }
      case 'string': return tag.tutupSendiri ? '' : lepasEntitasXml(bacaTeksSampai('</string>'));
      case 'integer': return parseInt(bacaTeksSampai('</integer>'), 10);
      case 'real': return parseFloat(bacaTeksSampai('</real>'));
      case 'true': return true;
      case 'false': return false;
      case 'date': return bacaTeksSampai('</date>');
      case 'data': return '(data biner)';
      default: throw new Error('Tag plist tidak dikenal: ' + tag.nama);
    }
  }
  return bacaNilai();
}

export function infoDariPlist(pl) {
  const info = {
    nama: pl.CFBundleDisplayName || pl.CFBundleName || null,
    paket: pl.CFBundleIdentifier || null,
    versionName: pl.CFBundleShortVersionString || null,
    versionCode: pl.CFBundleVersion || null,
    minOs: pl.MinimumOSVersion || pl.LSMinimumSystemVersion || null,
    ikonNama: pl.CFBundleIconName || null,
    ikonFiles: [],
    izin: [],
    perangkat: pl.UIRequiredDeviceCapabilities || null,
  };
  const ikon = pl.CFBundleIcons && pl.CFBundleIcons.CFBundlePrimaryIcon;
  if (ikon && Array.isArray(ikon.CFBundleIconFiles)) info.ikonFiles = ikon.CFBundleIconFiles.slice();
  for (const k of Object.keys(pl)) {
    if (/^NS.*UsageDescription$/.test(k) && typeof pl[k] === 'string') {
      info.izin.push({ kunci: k, alasan: pl[k] });
    }
  }
  return info;
}

// ---------- Antarmuka ----------
const DENSITAS = ['xxxhdpi', 'xxhdpi', 'xhdpi', 'hdpi', 'mdpi', 'nodpi'];

function cariIkonApk(entri) {
  const kandidat = entri.filter((e) => /^res\/[^/]*\/ic_launcher[^/]*\.(png|webp)$/i.test(e.nama));
  kandidat.sort((a, b) => {
    const da = DENSITAS.findIndex((d) => a.nama.includes(d));
    const db = DENSITAS.findIndex((d) => b.nama.includes(d));
    return (da < 0 ? 99 : da) - (db < 0 ? 99 : db);
  });
  return kandidat[0] || null;
}

function cariIkonIpa(entri, dirApp, info) {
  const dasar = (info.ikonFiles || []).length ? info.ikonFiles : ['AppIcon60x60', 'AppIcon76x76', 'AppIcon83.5x83.5', 'AppIcon'];
  for (const b of dasar) {
    for (const akhir of ['@3x.png', '@2x.png', '.png']) {
      const nama = dirApp + b + akhir;
      const ketemu = entri.find((e) => e.nama === nama);
      if (ketemu) return ketemu;
    }
  }
  return entri.find((e) => e.nama.startsWith(dirApp) && /^AppIcon.*\.png$/i.test(e.nama.slice(dirApp.length))) || null;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.ai-ikon{width:96px;height:96px;border-radius:22px;object-fit:cover;border:1px solid var(--line-soft);background:var(--surface-2)}' +
    '.ai-izin{font-size:13px;line-height:1.8}' +
    '.ai-izin b{font-weight:700}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Lihat isi file aplikasi Android (.apk) atau iOS (.ipa). ' + T.esc(LOCAL_NOTE) + '</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.apk,.ipa';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const hasilEl = T.el('<div></div>');

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    hasilEl.innerHTML = '';
    try {
      const u8 = new Uint8Array(await f.arrayBuffer());
      const zip = bacaZip(u8);
      const nama = f.name.toLowerCase();
      const entri = zip.entri;
      if (nama.endsWith('.apk') || entri.some((e) => e.nama === 'AndroidManifest.xml')) {
        await tampilApk(u8, entri, f);
      } else if (nama.endsWith('.ipa') || entri.some((e) => e.nama.startsWith('Payload/'))) {
        await tampilIpa(u8, entri, f);
      } else {
        throw new Error('File ZIP ini bukan APK maupun IPA (tidak ada AndroidManifest.xml atau folder Payload/).');
      }
      statusEl.textContent = '';
    } catch (e) {
      statusEl.textContent = '';
      hasilEl.innerHTML = '<p style="color:var(--err)">' + T.esc(e.message || 'File tidak bisa dibaca.') + '</p>';
    }
  }

  function ringkasanZip(entri, f) {
    const total = entri.reduce((a, e) => a + e.ukuran, 0);
    return kv('Isi arsip', T.fmt(entri.length) + ' file, ' + fmtBytes(total) + ' setelah dibuka (file ' + fmtBytes(f.size) + ')');
  }

  async function tampilApk(u8, entri, f) {
    const manifestEntri = entri.find((e) => e.nama === 'AndroidManifest.xml');
    if (!manifestEntri) throw new Error('AndroidManifest.xml tidak ketemu di APK ini.');
    const manifestBytes = await bacaEntriZip(u8, manifestEntri);
    const akar = parseAxml(manifestBytes);
    const info = infoDariManifest(akar);
    const dex = entri.filter((e) => /\.dex$/i.test(e.nama)).length;
    const so = entri.filter((e) => /\.so$/i.test(e.nama));
    const arsitektur = [...new Set(so.map((e) => {
      const m = /^lib\/([^/]+)\//.exec(e.nama);
      return m ? m[1] : null;
    }).filter(Boolean))];
    const tanda = entri.filter((e) => /^META-INF\/.*\.(RSA|DSA|EC|SF)$/i.test(e.nama)).map((e) => e.nama.split('/').pop());
    const ikonEntri = cariIkonApk(entri);
    let ikonHtml = '<p class="hint">Ikon tidak ketemu di file ini.</p>';
    if (ikonEntri) {
      try {
        const ikonBytes = await bacaEntriZip(u8, ikonEntri);
        const url = URL.createObjectURL(new Blob([ikonBytes], { type: ikonEntri.nama.endsWith('.webp') ? 'image/webp' : 'image/png' }));
        ikonHtml = '<img class="ai-ikon" src="' + T.esc(url) + '" alt="Ikon aplikasi"><p class="hint">' + T.esc(ikonEntri.nama) + '</p>';
      } catch (e) {
        ikonHtml = '<p class="hint">Ikon ketemu (' + T.esc(ikonEntri.nama) + ') tapi gagal dibaca.</p>';
      }
    }
    const semuaIzin = [...info.izin, ...info.izinPlus];
    const izinHtml = semuaIzin.length
      ? '<div class="ai-izin">' + semuaIzin.map((z) => {
        const jelas = IZIN_ANDROID[z];
        return '<div><b>' + T.esc(z) + '</b>' + (jelas ? ': ' + T.esc(jelas) : '') + '</div>';
      }).join('') + '</div>'
      : '<p class="hint">Aplikasi ini tidak meminta izin apa pun.</p>';
    hasilEl.innerHTML =
      '<div class="card">' +
      kv('Jenis file', 'APK (Android)') +
      kv('Paket', info.paket ? T.esc(info.paket) : '-') +
      kv('Nama aplikasi', info.label ? T.esc(String(info.label)) + (info.labelRef ? ' <span class="hint">(tersimpan sebagai referensi, nama aslinya ada di tabel resource)</span>' : '') : '-') +
      kv('Versi', (info.versionName ? T.esc(String(info.versionName)) : '-') + (info.versionCode != null ? ' (kode ' + T.esc(String(info.versionCode)) + ')' : '')) +
      kv('Android minimal', info.minSdk != null ? 'API ' + T.esc(String(info.minSdk)) : '-') +
      kv('Target Android', info.targetSdk != null ? 'API ' + T.esc(String(info.targetSdk)) : '-') +
      (info.aktivitas != null ? kv('Aktivitas / layanan / penerima / penyedia', info.aktivitas + ' / ' + info.layanan + ' / ' + info.penerima + ' / ' + info.penyedia) : '') +
      (info.debuggable === true ? kv('Debuggable', 'ya (versi debug)') : '') +
      kv('Kode DEX', dex ? T.fmt(dex) + ' file' : 'tidak ada') +
      (arsitektur.length ? kv('Arsitektur native', arsitektur.map(T.esc).join(', ')) : '') +
      (tanda.length ? kv('Tanda tangan', tanda.map(T.esc).join(', ')) : kv('Tanda tangan', 'tidak ketemu file tanda tangan di META-INF')) +
      ringkasanZip(entri, f) +
      '</div>' +
      '<h3 style="margin:14px 0 4px">Ikon</h3>' + ikonHtml +
      '<h3 style="margin:14px 0 4px">Izin (' + semuaIzin.length + ')</h3>' + izinHtml +
      (info.fitur.length ? '<h3 style="margin:14px 0 4px">Fitur perangkat yang diminta</h3><p class="hint">' + info.fitur.map(T.esc).join(', ') + '</p>' : '');
  }

  async function tampilIpa(u8, entri, f) {
    const plistEntri = entri.find((e) => /^Payload\/[^/]+\.app\/Info\.plist$/i.test(e.nama));
    if (!plistEntri) throw new Error('Info.plist tidak ketemu di IPA ini (seharusnya di Payload/Nama.app/Info.plist).');
    const dirApp = plistEntri.nama.slice(0, plistEntri.nama.lastIndexOf('/') + 1);
    const plistBytes = await bacaEntriZip(u8, plistEntri);
    if (plistBytes.length >= 6 && new TextDecoder().decode(plistBytes.slice(0, 6)) === 'bplist') {
      throw new Error('Info.plist file ini berformat biner (bplist), belum didukung. Hanya plist XML yang bisa dibaca.');
    }
    const pl = parsePlist(new TextDecoder().decode(plistBytes));
    const info = infoDariPlist(pl);
    const ikonEntri = cariIkonIpa(entri, dirApp, info);
    let ikonHtml = '<p class="hint">Ikon tidak ketemu di file ini.</p>';
    if (ikonEntri) {
      try {
        const ikonBytes = await bacaEntriZip(u8, ikonEntri);
        const url = URL.createObjectURL(new Blob([ikonBytes], { type: 'image/png' }));
        ikonHtml = '<img class="ai-ikon" src="' + T.esc(url) + '" alt="Ikon aplikasi" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
          '<p class="hint" style="display:none">Ikon ketemu (' + T.esc(ikonEntri.nama) + ') tapi memakai format PNG khusus iOS (CgBI) yang tidak bisa ditampilkan browser.</p>' +
          '<p class="hint">' + T.esc(ikonEntri.nama) + '</p>';
      } catch (e) {
        ikonHtml = '<p class="hint">Ikon ketemu (' + T.esc(ikonEntri.nama) + ') tapi gagal dibaca.</p>';
      }
    }
    const izinHtml = info.izin.length
      ? '<div class="ai-izin">' + info.izin.map((z) => '<div><b>' + T.esc(z.kunci) + '</b>: "' + T.esc(z.alasan) + '"</div>').join('') + '</div>'
      : '<p class="hint">Aplikasi ini tidak menyatakan alasan akses privasi (kamera, lokasi, dsb.) di Info.plist.</p>';
    hasilEl.innerHTML =
      '<div class="card">' +
      kv('Jenis file', 'IPA (iOS)') +
      kv('Bundle ID', info.paket ? T.esc(info.paket) : '-') +
      kv('Nama aplikasi', info.nama ? T.esc(info.nama) : '-') +
      kv('Versi', (info.versionName ? T.esc(String(info.versionName)) : '-') + (info.versionCode != null ? ' (build ' + T.esc(String(info.versionCode)) + ')' : '')) +
      kv('iOS minimal', info.minOs ? T.esc(String(info.minOs)) : '-') +
      (info.perangkat ? kv('Perangkat yang dibutuhkan', T.esc(JSON.stringify(info.perangkat))) : '') +
      ringkasanZip(entri, f) +
      '</div>' +
      '<h3 style="margin:14px 0 4px">Ikon</h3>' + ikonHtml +
      '<h3 style="margin:14px 0 4px">Alasan akses privasi (' + info.izin.length + ')</h3>' + izinHtml;
  }

  fileI.addEventListener('change', bukaFile);
  root.append(
    T.field('Pilih file APK atau IPA', fileI, 'Contoh: aplikasi.apk dari Android, atau aplikasi.ipa dari iOS.'),
    statusEl,
    hasilEl,
  );
}
