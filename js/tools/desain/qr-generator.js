import { h as T, utils, errBox, esc, loadImage } from '../../core.js';

function wifiString(ssid, pass, enc, hidden) {
    const e = (v) => String(v == null ? '' : v).replace(/([\\;,":])/g, '\\$1');
    let s = 'WIFI:T:' + enc + ';S:' + e(ssid);
    if (enc !== 'nopass') s += ';P:' + e(pass);
    if (hidden) s += ';H:true';
    return s + ';;';
  }

// ---------- Fungsi murni (bisa diuji di Node) ----------

export { wifiString };

// vCard 3.0 dari field kontak. Nilai di-escape sesuai RFC 2426.
export function vcardString(nama, hp, email, org) {
  const e = (v) => String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n?/g, '\\n').replace(/\n/g, '\\n');
  const baris = ['BEGIN:VCARD', 'VERSION:3.0'];
  const n = String(nama || '').trim();
  if (n) { baris.push('N:' + e(n)); baris.push('FN:' + e(n)); }
  if (String(hp || '').trim()) baris.push('TEL;TYPE=CELL:' + e(String(hp).trim()));
  if (String(email || '').trim()) baris.push('EMAIL:' + e(String(email).trim()));
  if (String(org || '').trim()) baris.push('ORG:' + e(String(org).trim()));
  baris.push('END:VCARD');
  return baris.join('\n');
}

export function smsString(nomor, pesan) {
  // Nomor di-encode supaya '?'/'&' di dalamnya tidak membajak parameter body
  // (sms:0812?body=SUNTIKAN...). '+' dipertahankan agar +62 tetap terbaca.
  const n = encodeURIComponent(String(nomor || '').trim()).replace(/%2B/g, '+');
  const p = String(pesan || '').trim();
  return 'sms:' + n + (p ? '?body=' + encodeURIComponent(p) : '');
}

export function emailString(alamat, subjek, isi) {
  // Alamat di-encode supaya '?'/'&' di dalamnya tidak membajak parameter
  // subject/body. '@' dipertahankan agar alamat tetap terbaca normal.
  const a = encodeURIComponent(String(alamat || '').trim()).replace(/%40/g, '@');
  const q = [];
  if (String(subjek || '').trim()) q.push('subject=' + encodeURIComponent(String(subjek).trim()));
  if (String(isi || '').trim()) q.push('body=' + encodeURIComponent(String(isi).trim()));
  return 'mailto:' + a + (q.length ? '?' + q.join('&') : '');
}

// Bersihkan daftar massal: satu per baris, buang kosong & duplikat, maks 20.
export function bersihkanDaftarMassal(teks, maks) {
  const m = maks || 20;
  const out = [];
  String(teks || '').split('\n').forEach((s) => {
    const t = s.trim();
    if (t && out.indexOf(t) === -1) out.push(t);
  });
  return out.slice(0, m);
}

// ---------- Akhir fungsi murni ----------

export const meta = {"id": "qr-generator", "name": "QR Code Generator", "cat": "desain", "icon": "🔲", "desc": "QR Code teks, URL, WiFi (termasuk jaringan tersembunyi), lokasi, vCard, SMS & email. Mode massal, logo, bingkai, ekspor SVG.", "keywords": "qr,barcode,scan,link,wifi,svg,logo,whatsapp,telegram,lokasi,maps,vcard,sms,email,massal,ssid,tersembunyi,hotspot"};
export function render(root) {

    const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
    const MAKS_MASSAL = 20;
    const modeSel = T.select([['text', 'Teks / URL'], ['wifi', 'WiFi'], ['lokasi', 'Lokasi (peta)'], ['vcard', 'Kontak (vCard)'], ['sms', 'SMS'], ['email', 'Email'], ['massal', 'Massal (banyak sekaligus)']], 'text');
    const fText = T.ta(3, 'Teks atau URL…', 'https://adipmusic.my.id');
    const wSsid = T.input('text', 'Nama WiFi (SSID)', '');
    const wPass = T.input('text', 'Password WiFi', '');
    const wEnc = T.select([['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Tanpa password']], 'WPA');
    const wHidden = document.createElement('input');
    wHidden.type = 'checkbox';
    const wBox = T.el('<div hidden></div>');
    wBox.appendChild(T.field('SSID', wSsid));
    wBox.appendChild(T.grid2(T.field('Password', wPass), T.field('Enkripsi', wEnc)));
    wBox.appendChild(T.field('Jaringan tersembunyi (hidden)', wHidden, 'Centang bila WiFi-mu tidak muncul di daftar jaringan — QR tetap bisa di-scan.'));
    wBox.appendChild(T.row(T.copyBtn(() => wifiString(wSsid.value.trim(), wPass.value, wEnc.value, wHidden.checked), 'Salin string WiFi')));
    const aturPassWifi = () => { const f = wPass.closest('.fld'); if (f) f.style.display = wEnc.value === 'nopass' ? 'none' : ''; };
    wEnc.addEventListener('change', aturPassWifi);
    const lokLat = T.input('text', 'cth: -6.200000', '-6.200000'); lokLat.inputMode = 'decimal';
    const lokLng = T.input('text', 'cth: 106.816666', '106.816666'); lokLng.inputMode = 'decimal';
    const lokFmt = T.select([['geo', 'geo: (buka aplikasi peta)'], ['maps', 'Link Google Maps']], 'geo');
    const lokBox = T.el('<div hidden></div>');
    lokBox.appendChild(T.grid2(T.field('Lintang (latitude)', lokLat), T.field('Bujur (longitude)', lokLng)));
    lokBox.appendChild(T.field('Format isi QR', lokFmt, 'Ambil angkanya dari Google Maps: tekan lama titiknya, lalu salin koordinat yang muncul.'));
    // --- vCard ---
    const vNama = T.input('text', 'Nama lengkap', '');
    const vHp = T.input('text', 'Nomor HP, cth: 08123456789', '');
    const vEmail = T.input('text', 'Email', '');
    const vOrg = T.input('text', 'Perusahaan / organisasi (opsional)', '');
    const vBox = T.el('<div hidden></div>');
    vBox.appendChild(T.field('Nama', vNama));
    vBox.appendChild(T.grid2(T.field('Nomor HP', vHp), T.field('Email', vEmail)));
    vBox.appendChild(T.field('Perusahaan (opsional)', vOrg));
    // --- SMS ---
    const sNomor = T.input('text', 'Nomor tujuan, cth: 08123456789', '');
    const sPesan = T.ta(2, 'Isi pesan (opsional)', '');
    const sBox = T.el('<div hidden></div>');
    sBox.appendChild(T.field('Nomor tujuan', sNomor));
    sBox.appendChild(T.field('Isi pesan (opsional)', sPesan));
    // --- Email ---
    const eAlamat = T.input('text', 'Alamat email tujuan', '');
    const eSubjek = T.input('text', 'Subjek (opsional)', '');
    const eIsi = T.ta(2, 'Isi email (opsional)', '');
    const eBox = T.el('<div hidden></div>');
    eBox.appendChild(T.field('Alamat email', eAlamat));
    eBox.appendChild(T.field('Subjek (opsional)', eSubjek));
    eBox.appendChild(T.field('Isi email (opsional)', eIsi));
    // --- Massal ---
    const mTa = T.ta(5, 'Satu teks/URL per baris, misal:\nhttps://toko-saya.com/produk-1\nhttps://toko-saya.com/produk-2\nhttps://wa.me/6281234567890', '');
    const mBox = T.el('<div hidden></div>');
    mBox.appendChild(T.field('Daftar teks / URL (maks ' + MAKS_MASSAL + ')', mTa, 'Satu baris = satu QR. Baris kosong & duplikat diabaikan.'));
    const massalGrid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:12px 0" hidden></div>');
    const massalBar = T.el('<div hidden></div>');
    const sizeSel = T.select([['200', '200px'], ['300', '300px'], ['500', '500px'], ['1000', '1000px']], '300');
    const fg = T.el('<input type="color" value="#000000" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const bg = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const fg2 = T.el('<input type="color" value="#ff6f61" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const gradChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;margin-top:8px"><input type="checkbox" id="qr-grad"> Warna gradasi (dari warna QR ke warna kedua)</label>');
    const gradCek = gradChk.querySelector('#qr-grad');
    const gradRow = T.el('<div hidden></div>');
    gradRow.appendChild(T.el('<div class="fld"><label>Warna kedua (gradasi)</label></div>').appendChild(fg2).parentNode);
    const gayaSel = T.select([['kotak', 'Kotak (klasik)'], ['bulat', 'Bulat (modul membulat)']], 'kotak');
    const eccSel = T.select([['L', 'Rendah (L)'], ['M', 'Sedang (M)'], ['Q', 'Tinggi (Q)'], ['H', 'Paling tinggi (H)']], 'M');
    const frameSel = T.select([['0', 'Tanpa bingkai'], ['2', 'Bingkai tipis'], ['6', 'Bingkai tebal']], '2');
    const logoInp = T.el('<input type="file" accept="image/*">');
    const logoCatatan = T.el('<p class="dim" style="font-size:12px" hidden>Logo dipasang di tengah. Ketahanan kode otomatis naik ke paling tinggi (H) supaya tetap terbaca.</p>');
    const statusBox = T.out();
    const qrWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:120px;align-items:center"></div>');
    const cv = document.createElement('canvas');
    let libOk = null, libLoading = false, logoImg = null, logoDataUrl = null;
    let massalHasil = []; // [{teks, canvas, svg}]
    const content = () => {
      if (modeSel.value === 'wifi') return wifiString(wSsid.value.trim(), wPass.value, wEnc.value, wHidden.checked);
      if (modeSel.value === 'lokasi') {
        const lat = lokLat.value.trim().replace(',', '.'), lng = lokLng.value.trim().replace(',', '.');
        if (!lat || !lng) return '';
        return lokFmt.value === 'maps'
          ? 'https://maps.google.com/?q=' + encodeURIComponent(lat + ',' + lng)
          : 'geo:' + lat + ',' + lng;
      }
      if (modeSel.value === 'vcard') {
        if (!vNama.value.trim() && !vHp.value.trim() && !vEmail.value.trim()) return '';
        return vcardString(vNama.value, vHp.value, vEmail.value, vOrg.value);
      }
      if (modeSel.value === 'sms') {
        if (!sNomor.value.trim()) return '';
        return smsString(sNomor.value, sPesan.value);
      }
      if (modeSel.value === 'email') {
        if (!eAlamat.value.trim()) return '';
        return emailString(eAlamat.value, eSubjek.value, eIsi.value);
      }
      return fText.value;
    };
    const ensureLib = () => {
      if (libOk !== null) return Promise.resolve(libOk);
      if (libLoading) return new Promise((res) => { const t = setInterval(() => { if (libOk !== null) { clearInterval(t); res(libOk); } }, 300); });
      libLoading = true;
      T.show(statusBox, '<span class="dim">Memuat library QR…</span>');
      return T.loadScript(QR_CDN).then((ok) => {
        libOk = ok && typeof QRCode !== 'undefined';
        if (!libOk) T.show(statusBox, errBox('Gagal memuat library QR dari CDN. Cek koneksi internet lalu coba lagi.'));
        return libOk;
      });
    };
    // Loader ZIP kanonis: utils.loadLibOnce (core.js).
    const tempelLogo = (canvas, ctx) => {
      if (!logoImg) return;
      const sisi = Math.round(canvas.width * 0.22);
      const x = Math.round((canvas.width - sisi) / 2), y = Math.round((canvas.height - sisi) / 2);
      const pad = Math.round(sisi * 0.12);
      ctx.fillStyle = '#ffffff';
      if (typeof ctx.roundRect === 'function') { ctx.beginPath(); ctx.roundRect(x - pad, y - pad, sisi + pad * 2, sisi + pad * 2, Math.round(pad * 0.8)); ctx.fill(); }
      else ctx.fillRect(x - pad, y - pad, sisi + pad * 2, sisi + pad * 2);
      ctx.drawImage(logoImg, x, y, sisi, sisi);
    };

    // Matriks modul QR dari lib (QRCode.create). Kembalikan {size, data} atau null.
    const matriksQr = (txt, ecc) => {
      try {
        const qr = QRCode.create(txt, { errorCorrectionLevel: ecc });
        const m = qr.modules;
        return { size: m.size, data: m.data };
      } catch (e) { return null; }
    };
    const diFinder = (size, r, c) => {
      // Tiga pola pencari 7x7 di sudut kiri-atas, kanan-atas, kiri-bawah.
      if (r < 7 && c < 7) return 0;
      if (r < 7 && c >= size - 7) return 1;
      if (r >= size - 7 && c < 7) return 2;
      return -1;
    };
    const isiGradasi = (ctx, w, h) => {
      if (!gradCek.checked) return fg.value;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, fg.value);
      g.addColorStop(1, fg2.value);
      return g;
    };
    // Gambar QR manual dari matriks: dukung modul bulat + gradasi + pola
    // pencari berbentuk cincin membulat.
    const gambarManual = (canvas, txt, ecc, ukuran, margin) => {
      const m = matriksQr(txt, ecc);
      if (!m) return false;
      const total = m.size + margin * 2;
      const skala = ukuran / total;
      canvas.width = Math.round(total * skala);
      canvas.height = Math.round(total * skala);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bulat = gayaSel.value === 'bulat';
      const isi = isiGradasi(ctx, canvas.width, canvas.height);
      const kotak = (r, c, wMod, hMod, radius) => {
        const x = (c + margin) * skala, y = (r + margin) * skala;
        const w = wMod * skala, h = hMod * skala;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function' && radius > 0) ctx.roundRect(x, y, w, h, radius);
        else ctx.rect(x, y, w, h);
        ctx.fill();
      };
      ctx.fillStyle = isi;
      // Pola pencari: cincin luar + titik tengah.
      const finder = [[0, 0], [0, m.size - 7], [m.size - 7, 0]];
      for (const [fr, fc] of finder) {
        if (bulat) {
          kotak(fr, fc, 7, 7, skala * 1.8);
          ctx.fillStyle = bg.value;
          kotak(fr + 1, fc + 1, 5, 5, skala * 1.2);
          ctx.fillStyle = isi;
          kotak(fr + 2, fc + 2, 3, 3, skala * 0.9);
        } else {
          kotak(fr, fc, 7, 7, 0);
          ctx.fillStyle = bg.value;
          kotak(fr + 1, fc + 1, 5, 5, 0);
          ctx.fillStyle = isi;
          kotak(fr + 2, fc + 2, 3, 3, 0);
        }
      }
      // Modul data (di luar pola pencari).
      for (let r = 0; r < m.size; r++) {
        for (let c = 0; c < m.size; c++) {
          if (diFinder(m.size, r, c) > -1) continue;
          if (!m.data[r * m.size + c]) continue;
          if (bulat) kotak(r, c, 1, 1, skala * 0.35);
          else kotak(r, c, 1, 1, 0);
        }
      }
      return true;
    };
    // SVG dari matriks (selalu manual supaya logo + gradasi + modul bulat ikut).
    const qrKeSvg = (txt, ecc, ukuran, margin) => {
      const m = matriksQr(txt, ecc);
      if (!m) return null;
      const total = m.size + margin * 2;
      const skala = ukuran / total;
      const bulat = gayaSel.value === 'bulat';
      const grad = gradCek.checked;
      const isi = grad ? 'url(#qrgrad)' : fg.value;
      const r = (x) => Math.round(x * 100) / 100;
      let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + ukuran + '" height="' + ukuran + '" viewBox="0 0 ' + r(total * skala) + ' ' + r(total * skala) + '">';
      if (grad) s += '<defs><linearGradient id="qrgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + fg.value + '"/><stop offset="1" stop-color="' + fg2.value + '"/></linearGradient></defs>';
      s += '<rect width="100%" height="100%" fill="' + bg.value + '"/>';
      const rx = bulat ? r(skala * 0.35) : 0;
      const rect = (rr, cc, wMod, hMod, rad) => '<rect x="' + r((cc + margin) * skala) + '" y="' + r((rr + margin) * skala) + '" width="' + r(wMod * skala) + '" height="' + r(hMod * skala) + '" rx="' + rad + '" fill="' + isi + '"/>';
      const rectBg = (rr, cc, wMod, hMod, rad) => '<rect x="' + r((cc + margin) * skala) + '" y="' + r((rr + margin) * skala) + '" width="' + r(wMod * skala) + '" height="' + r(hMod * skala) + '" rx="' + rad + '" fill="' + bg.value + '"/>';
      const finder = [[0, 0], [0, m.size - 7], [m.size - 7, 0]];
      for (const [fr, fc] of finder) {
        s += rect(fr, fc, 7, 7, bulat ? r(skala * 1.8) : 0);
        s += rectBg(fr + 1, fc + 1, 5, 5, bulat ? r(skala * 1.2) : 0);
        s += rect(fr + 2, fc + 2, 3, 3, bulat ? r(skala * 0.9) : 0);
      }
      for (let rr = 0; rr < m.size; rr++) {
        for (let cc = 0; cc < m.size; cc++) {
          if (diFinder(m.size, rr, cc) > -1) continue;
          if (!m.data[rr * m.size + cc]) continue;
          s += rect(rr, cc, 1, 1, rx);
        }
      }
      if (logoDataUrl) {
        const sisi = ukuran * 0.22, pad = sisi * 0.12;
        const x = (ukuran - sisi) / 2, y = (ukuran - sisi) / 2;
        s += '<rect x="' + r(x - pad) + '" y="' + r(y - pad) + '" width="' + r(sisi + pad * 2) + '" height="' + r(sisi + pad * 2) + '" rx="' + r(pad * 0.8) + '" fill="#ffffff"/>';
        s += '<image x="' + r(x) + '" y="' + r(y) + '" width="' + r(sisi) + '" height="' + r(sisi) + '" href="' + logoDataUrl + '"/>';
      }
      s += '</svg>';
      return s;
    };
    const draw = () => {
      if (modeSel.value === 'massal') { gambarMassal(); return; }
      if (modeSel.value === 'wifi') {
        if (!wSsid.value.trim()) { T.show(statusBox, errBox('Isi dulu nama WiFi (SSID)-nya ya.')); return; }
        if (wEnc.value !== 'nopass' && !wPass.value) { T.show(statusBox, errBox('Isi password-nya, atau pilih "Tanpa password".')); return; }
      }
      const txt = content().trim();
      if (!txt) { qrWrap.innerHTML = '<span class="dim">Isi dulu datanya.</span>'; return; }
      ensureLib().then((ok) => {
        if (!ok) return;
        const ecc = logoImg ? 'H' : eccSel.value;
        const ukuran = +sizeSel.value, margin = +frameSel.value;
        const perluManual = gayaSel.value === 'bulat' || gradCek.checked;
        if (perluManual) {
          if (!gambarManual(cv, txt, ecc, ukuran, margin)) {
            T.show(statusBox, errBox('QR tidak bisa dibuat. Datanya mungkin terlalu panjang — coba persingkat, lalu coba lagi.'));
            return;
          }
          tempelLogo(cv, cv.getContext('2d'));
          qrWrap.innerHTML = '';
          cv.style.maxWidth = '100%'; cv.style.height = 'auto';
          qrWrap.appendChild(cv);
          T.hide(statusBox);
          return;
        }
        QRCode.toCanvas(cv, txt, { width: ukuran, margin, errorCorrectionLevel: ecc, color: { dark: fg.value, light: bg.value } }, (err) => {
          if (err) { T.show(statusBox, errBox('QR tidak bisa dibuat. Datanya mungkin terlalu panjang — coba persingkat, lalu coba lagi.')); return; }
          tempelLogo(cv, cv.getContext('2d'));
          qrWrap.innerHTML = '';
          cv.style.maxWidth = '100%'; cv.style.height = 'auto';
          qrWrap.appendChild(cv);
          T.hide(statusBox);
        });
      });
    };
    const gambarMassal = () => {
      const daftar = bersihkanDaftarMassal(mTa.value, MAKS_MASSAL);
      massalGrid.innerHTML = '';
      massalHasil = [];
      if (!daftar.length) {
        massalGrid.hidden = true;
        massalBar.hidden = true;
        return;
      }
      ensureLib().then((ok) => {
        if (!ok) return;
        massalGrid.hidden = false;
        const ecc = logoImg ? 'H' : eccSel.value;
        const ukuran = +sizeSel.value, margin = +frameSel.value;
        const perluManual = gayaSel.value === 'bulat' || gradCek.checked;
        daftar.forEach((txt, i) => {
          const c = document.createElement('canvas');
          let jadi = false;
          if (perluManual) jadi = gambarManual(c, txt, ecc, ukuran, margin);
          else {
            try {
              QRCode.toCanvas(c, txt, { width: ukuran, margin, errorCorrectionLevel: ecc, color: { dark: fg.value, light: bg.value } }, () => {});
              jadi = true;
            } catch (e) { jadi = false; }
          }
          const card = T.el('<div style="background:#fff;border-radius:12px;padding:10px;text-align:center"></div>');
          if (jadi) {
            if (logoImg) tempelLogo(c, c.getContext('2d'));
            c.style.maxWidth = '100%'; c.style.height = 'auto';
            card.appendChild(c);
            const svg = qrKeSvg(txt, ecc, ukuran, margin);
            massalHasil.push({ teks: txt, canvas: c, svg });
          } else {
            card.appendChild(T.el('<div class="dim" style="font-size:12px;padding:20px 0">QR ke-' + (i + 1) + ' gagal (datanya terlalu panjang)</div>'));
          }
          card.appendChild(T.el('<div style="font-size:11.5px;color:#333;word-break:break-all;margin-top:6px">' + T.esc(txt.length > 40 ? txt.slice(0, 40) + '…' : txt) + '</div>'));
          massalGrid.appendChild(card);
        });
        massalBar.hidden = massalHasil.length === 0;
        T.hide(statusBox);
      });
    };
    const unduhZipMassal = async (jenis) => {
      if (!massalHasil.length) { T.toast('Buat dulu QR massalnya'); return; }
      T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
      if (!(await utils.loadLibOnce(ZIP_CDN, () => typeof window.JSZip === 'function'))) { T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi.</span>'); return; }
      try {
        const zip = new window.JSZip();
        for (let i = 0; i < massalHasil.length; i++) {
          const nama = 'qr-' + String(i + 1).padStart(2, '0');
          if (jenis === 'svg') {
            if (massalHasil[i].svg) zip.file(nama + '.svg', massalHasil[i].svg);
          } else {
            const blob = await new Promise((res) => massalHasil[i].canvas.toBlob(res, 'image/png'));
            if (blob) zip.file(nama + '.png', blob);
          }
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        T.dl('qr-massal-' + jenis + '.zip', blob, 'application/zip');
        T.hide(statusBox);
        T.toast('ZIP berhasil diunduh');
      } catch (e) {
        T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Coba lagi.</span>');
      }
    };
    let deb;
    const queue = () => { clearTimeout(deb); deb = setTimeout(draw, 400); };
    const aturMode = () => {
      const m = modeSel.value;
      wBox.hidden = m !== 'wifi';
      lokBox.hidden = m !== 'lokasi';
      vBox.hidden = m !== 'vcard';
      sBox.hidden = m !== 'sms';
      eBox.hidden = m !== 'email';
      mBox.hidden = m !== 'massal';
      fText.parentNode.style.display = m === 'text' ? '' : 'none';
      qrWrap.style.display = m === 'massal' ? 'none' : '';
      massalGrid.hidden = m !== 'massal';
      massalBar.hidden = m !== 'massal' || !massalHasil.length;
      queue();
    };
    modeSel.addEventListener('change', aturMode);
    [fText, wSsid, wPass, wEnc, lokLat, lokLng, lokFmt, vNama, vHp, vEmail, vOrg, sNomor, sPesan, eAlamat, eSubjek, eIsi, mTa, sizeSel, eccSel, frameSel, gayaSel].forEach((i) => i.addEventListener('input', queue));
    wHidden.addEventListener('change', queue);
    aturPassWifi();
    fg.addEventListener('input', queue);
    bg.addEventListener('input', queue);
    fg2.addEventListener('input', queue);
    gradCek.addEventListener('change', () => { gradRow.hidden = !gradCek.checked; queue(); });
    logoInp.addEventListener('change', async () => {
      const f = logoInp.files[0];
      if (!f) return;
      try {
        logoImg = await loadImage(f);
        logoDataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = () => rej(new Error('gagal baca logo'));
          r.readAsDataURL(f);
        });
        eccSel.value = 'H';
        logoCatatan.hidden = false;
        draw();
      } catch (e) {
        T.toast('Logo bukan gambar yang valid');
        logoInp.value = '';
      }
    });
    const isiPreset = (templat, pesan) => {
      modeSel.value = 'text';
      aturMode();
      fText.value = templat;
      T.toast(pesan);
      queue();
      fText.focus();
    };
    massalBar.appendChild(T.row(
      T.btn('Unduh semua PNG (ZIP)', () => unduhZipMassal('png'), true),
      T.btn('Unduh semua SVG (ZIP)', () => unduhZipMassal('svg'), true)
    ));
    root.appendChild(T.field('Mode', modeSel));
    root.appendChild(T.row(
      T.btn('WhatsApp (wa.me)', () => isiPreset('https://wa.me/6281234567890', 'Ganti nomor di atas dengan nomormu')),
      T.btn('Telegram (t.me)', () => isiPreset('https://t.me/namapengguna', 'Ganti nama pengguna di atas dengan namamu')),
      T.btn('Lokasi (peta)', () => { modeSel.value = 'lokasi'; aturMode(); T.toast('Isi koordinat lokasinya'); })
    ));
    root.appendChild(T.field('Isi QR', fText));
    root.appendChild(wBox);
    root.appendChild(lokBox);
    root.appendChild(vBox);
    root.appendChild(sBox);
    root.appendChild(eBox);
    root.appendChild(mBox);
    root.appendChild(T.grid2(T.field('Ukuran', sizeSel), T.field('Ketahanan kode', eccSel, 'Makin tinggi, makin tahan rusak atau tertutup sebagian.')));
    root.appendChild(T.grid2(
      T.el('<div class="fld"><label>Warna QR</label></div>').appendChild(fg).parentNode,
      T.el('<div class="fld"><label>Warna latar</label></div>').appendChild(bg).parentNode
    ));
    root.appendChild(gradChk);
    root.appendChild(gradRow);
    root.appendChild(T.grid2(
      T.field('Bentuk modul', gayaSel, 'Bulat membuat QR terlihat lebih lembut; tetap terbaca normal.'),
      T.field('Bingkai', frameSel)
    ));
    root.appendChild(T.field('Logo tengah (opsional)', logoInp, 'Gambar kotak paling bagus. PNG transparan bisa dipakai. Logo ikut masuk ke PNG & SVG.'));
    root.appendChild(logoCatatan);
    root.appendChild(T.row(T.btn('Buat QR', draw, true), T.btn('Unduh PNG', () => {
      if (!qrWrap.contains(cv)) { T.toast('Buat dulu QR-nya'); return; }
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = 'qr-code.png';
      document.body.appendChild(a); a.click(); a.remove();
    }), T.btn('Unduh SVG', () => {
      const txt = content().trim();
      if (!txt) { T.toast('Isi dulu datanya'); return; }
      ensureLib().then((ok) => {
        if (!ok) return;
        const ecc = logoImg ? 'H' : eccSel.value;
        const svg = qrKeSvg(txt, ecc, +sizeSel.value, +frameSel.value);
        if (!svg) { T.show(statusBox, errBox('SVG tidak bisa dibuat. Datanya mungkin terlalu panjang — coba persingkat, lalu coba lagi.')); return; }
        T.dl('qr-code.svg', svg, 'image/svg+xml');
        T.toast('SVG berhasil diunduh');
      });
    }), T.btn('Hapus logo', () => {
      logoImg = null;
      logoDataUrl = null;
      logoInp.value = '';
      logoCatatan.hidden = true;
      draw();
    })));
    root.appendChild(statusBox);
    root.appendChild(qrWrap);
    root.appendChild(massalGrid);
    root.appendChild(massalBar);
    root.appendChild(T.el('<p class="dim" style="font-size:13px">Punya kode QR? <a href="#/t/qr-decoder">Baca di sini</a>.</p>'));
    T.onLeave(() => clearTimeout(deb));
    draw();
  
}
