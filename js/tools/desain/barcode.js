import { h as T, utils, errBox, esc, tabs } from '../../core.js?v=6.3.0';

function vcardString(d) {
    const e = (v) => String(v == null ? '' : v).replace(/\n/g, ' ');
    const L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:;' + e(d.nama) + ';;;', 'FN:' + e(d.nama)];
    if (d.org) L.push('ORG:' + e(d.org));
    if (d.hp) L.push('TEL;TYPE=CELL:' + e(d.hp));
    if (d.email) L.push('EMAIL:' + e(d.email));
    if (d.web) L.push('URL:' + e(d.web));
    L.push('END:VCARD');
    return L.join('\n');
  }

export const meta = {"id": "barcode", "name": "vCard QR & Barcode", "cat": "desain", "icon": "🧾", "desc": "QR kontak vCard & barcode produk.", "keywords": "barcode,vcard,qr,kontak"};
export function render(root) {

    const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    const BC_CDN = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    let qrOk = null, bcOk = null;
    const loadQr = () => qrOk !== null ? Promise.resolve(qrOk)
      : T.loadScript(QR_CDN).then((ok) => (qrOk = ok && typeof QRCode !== 'undefined'));
    const loadBc = () => bcOk !== null ? Promise.resolve(bcOk)
      : T.loadScript(BC_CDN).then((ok) => (bcOk = ok && typeof JsBarcode !== 'undefined'));

    // --- Tab vCard ---
    const vPage = T.el('<div></div>');
    const vNama = T.input('text', 'Nama lengkap', '');
    const vHp = T.input('tel', 'No. HP, misal 0812…', '');
    const vMail = T.input('email', 'Email', '');
    const vOrg = T.input('text', 'Perusahaan (opsional)', '');
    const vWeb = T.input('text', 'Website (opsional)', '');
    const vStatus = T.out();
    const vWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:120px;align-items:center"><span class="dim">QR vCard muncul di sini.</span></div>');
    const vCv = document.createElement('canvas');
    const vDraw = () => {
      const nama = vNama.value.trim();
      if (!nama) { T.show(vStatus, errBox('Isi dulu nama kontaknya.')); return; }
      const s = vcardString({ nama, hp: vHp.value.trim(), email: vMail.value.trim(), org: vOrg.value.trim(), web: vWeb.value.trim() });
      T.show(vStatus, '<span class="dim">Memuat library QR…</span>');
      loadQr().then((ok) => {
        if (!ok) { T.show(vStatus, errBox('Gagal memuat library QR dari CDN. Cek koneksi internet.')); return; }
        QRCode.toCanvas(vCv, s, { width: 400, margin: 2 }, (err) => {
          if (err) { T.show(vStatus, errBox('Gagal membuat QR: ' + err.message)); return; }
          vWrap.innerHTML = '';
          vCv.style.maxWidth = '100%'; vCv.style.height = 'auto';
          vWrap.appendChild(vCv);
          T.hide(vStatus);
        });
      });
    };
    vPage.appendChild(T.grid2(T.field('Nama', vNama), T.field('No. HP', vHp)));
    vPage.appendChild(T.grid2(T.field('Email', vMail), T.field('Perusahaan', vOrg)));
    vPage.appendChild(T.field('Website', vWeb));
    vPage.appendChild(T.row(T.btn('Buat QR vCard', vDraw, true), T.btn('Unduh PNG', () => {
      if (!vWrap.contains(vCv)) { T.toast('Buat dulu QR-nya'); return; }
      const a = document.createElement('a');
      a.href = vCv.toDataURL('image/png');
      a.download = 'vcard-qr.png';
      document.body.appendChild(a); a.click(); a.remove();
    })));
    vPage.appendChild(vStatus);
    vPage.appendChild(vWrap);

    // --- Tab Barcode ---
    const bPage = T.el('<div hidden></div>');
    const bText = T.input('text', 'misal: 8991234567890 (EAN-13) atau ADIP-001', '8991234567890');
    bText.style.fontFamily = 'monospace';
    const bFmt = T.select([['CODE128', 'CODE128 (umum)'], ['EAN13', 'EAN-13 (produk retail)'], ['UPC', 'UPC-A'], ['CODE39', 'CODE39'], ['ITF14', 'ITF-14']], 'CODE128');
    const bStatus = T.out();
    const bWrap = T.el('<div style="display:flex;justify-content:center;padding:20px;background:#fff;border-radius:12px;margin:12px 0;min-height:100px;align-items:center"><span class="dim">Barcode muncul di sini.</span></div>');
    const bSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const bDraw = () => {
      const txt = bText.value.trim();
      if (!txt) { T.show(bStatus, errBox('Isi dulu teks/angkanya.')); return; }
      T.show(bStatus, '<span class="dim">Memuat library barcode…</span>');
      loadBc().then((ok) => {
        if (!ok) { T.show(bStatus, errBox('Gagal memuat library barcode dari CDN. Cek koneksi internet.')); return; }
        try {
          bWrap.innerHTML = '';
          bSvg.setAttribute('width', '100%');
          JsBarcode(bSvg, txt, { format: bFmt.value, displayValue: true, fontSize: 16, margin: 10, background: '#ffffff', lineColor: '#000000' });
          bWrap.appendChild(bSvg);
          T.hide(bStatus);
        } catch (e) {
          T.show(bStatus, errBox('Barcode tidak valid untuk format ' + bFmt.value + ': ' + e.message));
        }
      });
    };
    bPage.appendChild(T.field('Teks / angka barcode', bText, 'EAN-13 butuh 12-13 digit angka. CODE128 bebas teks.'));
    bPage.appendChild(T.field('Format', bFmt));
    bPage.appendChild(T.row(T.btn('Buat Barcode', bDraw, true), T.btn('Unduh PNG', () => {
      if (!bWrap.contains(bSvg)) { T.toast('Buat dulu barcodenya'); return; }
      const xml = new XMLSerializer().serializeToString(bSvg);
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = img.width || 600; cv.height = img.height || 200;
        const x = cv.getContext('2d');
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, cv.width, cv.height);
        x.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'barcode.png';
        document.body.appendChild(a); a.click(); a.remove();
      };
      img.onerror = () => T.toast('Gagal render PNG');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    })));
    bPage.appendChild(bStatus);
    bPage.appendChild(bWrap);

    root.appendChild(tabs([['QR vCard', 0], ['Barcode', 1]], [vPage, bPage]));
    root.appendChild(vPage);
    root.appendChild(bPage);
  
}
