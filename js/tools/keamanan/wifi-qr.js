import { h as T, utils, errBox } from '../../core.js?v=6.8.0';

function wifiString(ssid, pass, enc, hidden) {
  const e = (v) => String(v == null ? '' : v).replace(/([\\;,":])/g, '\\$1');
  let s = 'WIFI:T:' + enc + ';S:' + e(ssid);
  if (enc !== 'nopass') s += ';P:' + e(pass);
  if (hidden) s += ';H:true';
  return s + ';;';
}

export const meta = {"id": "wifi-qr", "name": "WiFi QR Generator", "cat": "keamanan", "icon": "📶", "desc": "QR WiFi siap scan — tamu konek tanpa ketik password.", "keywords": "wifi,qr,ssid,password,scan,kode wifi,wireless,hotspot"};
export function render(root) {

    const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    const inSsid = T.input('text', 'Nama WiFi (SSID)', '');
    const inPass = T.input('text', 'Password WiFi', '');
    const inEnc = T.select([['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Tanpa password']], 'WPA');
    const inHidden = document.createElement('input');
    inHidden.type = 'checkbox';
    const passField = T.field('Password', inPass);
    const statusBox = T.out();
    const qrWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:120px;align-items:center"><span class="mut">Isi data WiFi lalu tekan Buat QR.</span></div>');
    const cv = document.createElement('canvas');
    let libOk = null, libLoading = false;
    const content = () => wifiString(inSsid.value.trim(), inPass.value, inEnc.value, inHidden.checked);
    const ensureLib = () => {
      if (libOk !== null) return Promise.resolve(libOk);
      if (libLoading) return new Promise((res) => { const t = setInterval(() => { if (libOk !== null) { clearInterval(t); res(libOk); } }, 300); });
      libLoading = true;
      T.show(statusBox, '<span class="mut">Memuat library QR…</span>');
      return T.loadScript(QR_CDN).then((ok) => {
        libOk = ok && typeof QRCode !== 'undefined';
        if (!libOk) T.show(statusBox, errBox('Gagal memuat library QR dari CDN. Cek koneksi internet lalu coba lagi.'));
        return libOk;
      });
    };
    const draw = () => {
      const ssid = inSsid.value.trim();
      if (!ssid) { T.show(statusBox, errBox('Isi dulu nama WiFi (SSID)-nya ya.')); return; }
      if (inEnc.value !== 'nopass' && !inPass.value) { T.show(statusBox, errBox('Isi password-nya, atau pilih "Tanpa password".')); return; }
      const txt = content();
      ensureLib().then((ok) => {
        if (!ok) return;
        QRCode.toCanvas(cv, txt, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err) => {
          if (err) { T.show(statusBox, errBox('Gagal membuat QR: ' + err.message)); return; }
          qrWrap.innerHTML = '';
          cv.style.maxWidth = '100%'; cv.style.height = 'auto';
          qrWrap.appendChild(cv);
          T.hide(statusBox);
        });
      });
    };
    let deb;
    const queue = () => { clearTimeout(deb); deb = setTimeout(draw, 600); };
    inEnc.addEventListener('change', () => { passField.style.display = inEnc.value === 'nopass' ? 'none' : ''; queue(); });
    inSsid.addEventListener('input', queue);
    inPass.addEventListener('input', queue);
    inHidden.addEventListener('change', queue);
    root.appendChild(T.field('Nama WiFi (SSID)', inSsid));
    root.appendChild(T.grid2(passField, T.field('Enkripsi', inEnc)));
    root.appendChild(T.field('SSID tersembunyi (hidden)', inHidden));
    root.appendChild(T.row(
      T.btn('Buat QR', draw, true),
      T.copyBtn(content, 'Salin string WiFi'),
      T.btn('Unduh PNG', () => {
        if (!qrWrap.contains(cv)) { T.toast('Buat dulu QR-nya'); return; }
        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'wifi-qr.png';
        document.body.appendChild(a); a.click(); a.remove();
      })
    ));
    root.appendChild(statusBox);
    root.appendChild(qrWrap);
    root.appendChild(T.el('<p class="hint">Scan QR ini dari kamera HP — WiFi langsung tersambung tanpa ketik password. Cocok ditempel di warung, kos, atau rumah.</p>'));
    T.onLeave(() => clearTimeout(deb));

}
