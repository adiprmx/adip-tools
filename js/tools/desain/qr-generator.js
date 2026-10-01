import { h as T, utils, errBox, esc } from '../../core.js?v=6.0.0';

function wifiString(ssid, pass, enc) {
    const e = (v) => String(v == null ? '' : v).replace(/([\\;,":])/g, '\\$1');
    return 'WIFI:T:' + enc + ';S:' + e(ssid) + ';P:' + e(pass) + ';;';
  }

export const meta = {"id": "qr-generator", "name": "QR Code Generator", "cat": "desain", "icon": "🔲", "desc": "QR Code teks, URL, & WiFi.", "keywords": "qr,barcode,scan,link,wifi"};
export function render(root) {

    const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    const modeSel = T.select([['text', 'Teks / URL'], ['wifi', 'WiFi']], 'text');
    const fText = T.ta(3, 'Teks atau URL…', 'https://adipmusic.my.id');
    const wSsid = T.input('text', 'Nama WiFi (SSID)', '');
    const wPass = T.input('text', 'Password WiFi', '');
    const wEnc = T.select([['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Tanpa password']], 'WPA');
    const wBox = T.el('<div hidden></div>');
    wBox.appendChild(T.field('SSID', wSsid));
    wBox.appendChild(T.grid2(T.field('Password', wPass), T.field('Enkripsi', wEnc)));
    const sizeSel = T.select([['200', '200px'], ['300', '300px'], ['500', '500px'], ['1000', '1000px']], '300');
    const fg = T.el('<input type="color" value="#000000" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const statusBox = T.out();
    const qrWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:120px;align-items:center"></div>');
    const cv = document.createElement('canvas');
    let libOk = null, libLoading = false;
    const content = () => modeSel.value === 'wifi'
      ? wifiString(wSsid.value.trim(), wPass.value, wEnc.value)
      : fText.value;
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
    const draw = () => {
      const txt = content().trim();
      if (!txt) { qrWrap.innerHTML = '<span class="dim">Isi dulu datanya.</span>'; return; }
      ensureLib().then((ok) => {
        if (!ok) return;
        QRCode.toCanvas(cv, txt, { width: +sizeSel.value, margin: 2, color: { dark: fg.value, light: '#ffffff' } }, (err) => {
          if (err) { T.show(statusBox, errBox('Gagal membuat QR: ' + err.message)); return; }
          qrWrap.innerHTML = '';
          cv.style.maxWidth = '100%'; cv.style.height = 'auto';
          qrWrap.appendChild(cv);
          T.hide(statusBox);
        });
      });
    };
    let deb;
    const queue = () => { clearTimeout(deb); deb = setTimeout(draw, 400); };
    modeSel.addEventListener('change', () => { wBox.hidden = modeSel.value !== 'wifi'; fText.parentNode.style.display = modeSel.value === 'wifi' ? 'none' : ''; queue(); });
    [fText, wSsid, wPass, wEnc, sizeSel].forEach((i) => i.addEventListener('input', queue));
    fg.addEventListener('input', queue);
    root.appendChild(T.field('Mode', modeSel));
    root.appendChild(T.field('Isi QR', fText));
    root.appendChild(wBox);
    root.appendChild(T.grid2(T.field('Ukuran', sizeSel), T.el('<div class="fld"><label>Warna QR</label></div>').appendChild(fg).parentNode));
    root.appendChild(T.row(T.btn('Buat QR', draw, true), T.btn('Unduh PNG', () => {
      if (!qrWrap.contains(cv)) { T.toast('Buat dulu QR-nya'); return; }
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = 'qr-code.png';
      document.body.appendChild(a); a.click(); a.remove();
    })));
    root.appendChild(statusBox);
    root.appendChild(qrWrap);
    T.onLeave(() => clearTimeout(deb));
    draw();
  
}
