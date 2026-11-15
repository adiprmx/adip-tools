import { h as T, utils, errBox, esc, loadImage } from '../../core.js?v=6.12.1';

function wifiString(ssid, pass, enc) {
    const e = (v) => String(v == null ? '' : v).replace(/([\\;,":])/g, '\\$1');
    return 'WIFI:T:' + enc + ';S:' + e(ssid) + ';P:' + e(pass) + ';;';
  }

export const meta = {"id": "qr-generator", "name": "QR Code Generator", "cat": "desain", "icon": "🔲", "desc": "QR Code teks, URL, WiFi, & lokasi. Bisa pakai logo, bingkai, dan ekspor SVG.", "keywords": "qr,barcode,scan,link,wifi,svg,logo,whatsapp,telegram,lokasi,maps"};
export function render(root) {

    const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    const modeSel = T.select([['text', 'Teks / URL'], ['wifi', 'WiFi'], ['lokasi', 'Lokasi (peta)']], 'text');
    const fText = T.ta(3, 'Teks atau URL…', 'https://adipmusic.my.id');
    const wSsid = T.input('text', 'Nama WiFi (SSID)', '');
    const wPass = T.input('text', 'Password WiFi', '');
    const wEnc = T.select([['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Tanpa password']], 'WPA');
    const wBox = T.el('<div hidden></div>');
    wBox.appendChild(T.field('SSID', wSsid));
    wBox.appendChild(T.grid2(T.field('Password', wPass), T.field('Enkripsi', wEnc)));
    const lokLat = T.input('text', 'cth: -6.200000', '-6.200000'); lokLat.inputMode = 'decimal';
    const lokLng = T.input('text', 'cth: 106.816666', '106.816666'); lokLng.inputMode = 'decimal';
    const lokFmt = T.select([['geo', 'geo: (buka aplikasi peta)'], ['maps', 'Link Google Maps']], 'geo');
    const lokBox = T.el('<div hidden></div>');
    lokBox.appendChild(T.grid2(T.field('Lintang (latitude)', lokLat), T.field('Bujur (longitude)', lokLng)));
    lokBox.appendChild(T.field('Format isi QR', lokFmt, 'Ambil angkanya dari Google Maps: tekan lama titiknya, lalu salin koordinat yang muncul.'));
    const sizeSel = T.select([['200', '200px'], ['300', '300px'], ['500', '500px'], ['1000', '1000px']], '300');
    const fg = T.el('<input type="color" value="#000000" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const bg = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const eccSel = T.select([['L', 'Rendah (L)'], ['M', 'Sedang (M)'], ['Q', 'Tinggi (Q)'], ['H', 'Paling tinggi (H)']], 'M');
    const frameSel = T.select([['0', 'Tanpa bingkai'], ['2', 'Bingkai tipis'], ['6', 'Bingkai tebal']], '2');
    const logoInp = T.el('<input type="file" accept="image/*">');
    const logoCatatan = T.el('<p class="dim" style="font-size:12px" hidden>Logo dipasang di tengah. Ketahanan kode otomatis naik ke paling tinggi (H) supaya tetap terbaca.</p>');
    const svgCatatan = T.el('<p class="dim" style="font-size:12px" hidden>Ekspor SVG tidak menyertakan logo (logo hanya ada di PNG).</p>');
    const statusBox = T.out();
    const qrWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:120px;align-items:center"></div>');
    const cv = document.createElement('canvas');
    let libOk = null, libLoading = false, logoImg = null;
    const content = () => {
      if (modeSel.value === 'wifi') return wifiString(wSsid.value.trim(), wPass.value, wEnc.value);
      if (modeSel.value === 'lokasi') {
        const lat = lokLat.value.trim().replace(',', '.'), lng = lokLng.value.trim().replace(',', '.');
        if (!lat || !lng) return '';
        return lokFmt.value === 'maps'
          ? 'https://maps.google.com/?q=' + encodeURIComponent(lat + ',' + lng)
          : 'geo:' + lat + ',' + lng;
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
    const tempelLogo = () => {
      if (!logoImg) return;
      const ctx = cv.getContext('2d');
      const sisi = Math.round(cv.width * 0.22);
      const x = Math.round((cv.width - sisi) / 2), y = Math.round((cv.height - sisi) / 2);
      const pad = Math.round(sisi * 0.12);
      ctx.fillStyle = '#ffffff';
      if (typeof ctx.roundRect === 'function') { ctx.beginPath(); ctx.roundRect(x - pad, y - pad, sisi + pad * 2, sisi + pad * 2, Math.round(pad * 0.8)); ctx.fill(); }
      else ctx.fillRect(x - pad, y - pad, sisi + pad * 2, sisi + pad * 2);
      ctx.drawImage(logoImg, x, y, sisi, sisi);
    };
    const draw = () => {
      const txt = content().trim();
      if (!txt) { qrWrap.innerHTML = '<span class="dim">Isi dulu datanya.</span>'; return; }
      ensureLib().then((ok) => {
        if (!ok) return;
        const ecc = logoImg ? 'H' : eccSel.value;
        QRCode.toCanvas(cv, txt, { width: +sizeSel.value, margin: +frameSel.value, errorCorrectionLevel: ecc, color: { dark: fg.value, light: bg.value } }, (err) => {
          if (err) { T.show(statusBox, errBox('Gagal membuat QR: ' + err.message)); return; }
          tempelLogo();
          qrWrap.innerHTML = '';
          cv.style.maxWidth = '100%'; cv.style.height = 'auto';
          qrWrap.appendChild(cv);
          T.hide(statusBox);
        });
      });
    };
    let deb;
    const queue = () => { clearTimeout(deb); deb = setTimeout(draw, 400); };
    const aturMode = () => {
      const m = modeSel.value;
      wBox.hidden = m !== 'wifi';
      lokBox.hidden = m !== 'lokasi';
      fText.parentNode.style.display = m === 'text' ? '' : 'none';
      queue();
    };
    modeSel.addEventListener('change', aturMode);
    [fText, wSsid, wPass, wEnc, lokLat, lokLng, lokFmt, sizeSel, eccSel, frameSel].forEach((i) => i.addEventListener('input', queue));
    fg.addEventListener('input', queue);
    bg.addEventListener('input', queue);
    logoInp.addEventListener('change', async () => {
      const f = logoInp.files[0];
      if (!f) return;
      try {
        logoImg = await loadImage(f);
        eccSel.value = 'H';
        logoCatatan.hidden = false;
        svgCatatan.hidden = false;
        draw();
      } catch (e) {
        T.toast('Logo bukan gambar yang valid');
        logoInp.value = '';
      }
    });
    const isiPreset = (templat, pesan) => {
      modeSel.value = 'text';
      wBox.hidden = true;
      lokBox.hidden = true;
      fText.parentNode.style.display = '';
      fText.value = templat;
      T.toast(pesan);
      queue();
      fText.focus();
    };
    root.appendChild(T.field('Mode', modeSel));
    root.appendChild(T.row(
      T.btn('WhatsApp (wa.me)', () => isiPreset('https://wa.me/6281234567890', 'Ganti nomor di atas dengan nomormu')),
      T.btn('Telegram (t.me)', () => isiPreset('https://t.me/namapengguna', 'Ganti nama pengguna di atas dengan namamu')),
      T.btn('Lokasi (peta)', () => { modeSel.value = 'lokasi'; aturMode(); T.toast('Isi koordinat lokasinya'); })
    ));
    root.appendChild(T.field('Isi QR', fText));
    root.appendChild(wBox);
    root.appendChild(lokBox);
    root.appendChild(T.grid2(T.field('Ukuran', sizeSel), T.field('Ketahanan kode', eccSel, 'Makin tinggi, makin tahan rusak atau tertutup sebagian.')));
    root.appendChild(T.grid2(
      T.el('<div class="fld"><label>Warna QR</label></div>').appendChild(fg).parentNode,
      T.el('<div class="fld"><label>Warna latar</label></div>').appendChild(bg).parentNode
    ));
    root.appendChild(T.grid2(
      T.field('Bingkai', frameSel),
      T.field('Logo tengah (opsional)', logoInp, 'Gambar kotak paling bagus. PNG transparan bisa dipakai.')
    ));
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
        QRCode.toString(txt, { type: 'svg', width: +sizeSel.value, margin: +frameSel.value, errorCorrectionLevel: ecc, color: { dark: fg.value, light: bg.value } }).then((svg) => {
          T.dl('qr-code.svg', svg, 'image/svg+xml');
          T.toast('SVG berhasil diunduh');
        }).catch((err) => T.show(statusBox, errBox('Gagal membuat SVG: ' + err.message)));
      });
    }), T.btn('Hapus logo', () => {
      logoImg = null;
      logoInp.value = '';
      logoCatatan.hidden = true;
      svgCatatan.hidden = true;
      draw();
    })));
    root.appendChild(svgCatatan);
    root.appendChild(statusBox);
    root.appendChild(qrWrap);
    root.appendChild(T.el('<p class="dim" style="font-size:13px">Punya kode QR? <a href="#/t/qr-decoder">Baca di sini</a>.</p>'));
    T.onLeave(() => clearTimeout(deb));
    draw();
  
}
