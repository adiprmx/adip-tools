import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id": "base64", "name": "Base64 Encode/Decode", "cat": "converter", "icon": "🔤", "desc": "Encode & decode Base64, termasuk varian URL-safe.", "keywords": "base64,encode,decode"};
export function render(root) {

    const inp = T.ta(5, 'Tulis atau tempel teks di sini…');
    const outp = T.ta(5, 'Hasil muncul di sini…');
    outp.readOnly = true;
    const urlSafe = T.el('<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 0;cursor:pointer"><input type="checkbox"> <span>Varian URL-safe (tanpa + / =)</span></label>');
    const usBox = urlSafe.querySelector('input');

    function utf8ToB64(s) {
      const bytes = new TextEncoder().encode(s);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }
    function b64ToUtf8(b64) {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    const enc = () => {
      let b = utf8ToB64(inp.value);
      if (usBox.checked) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      outp.value = b;
    };
    const dec = () => {
      try {
        let b = inp.value.trim().replace(/\s/g, '');
        if (usBox.checked || /[-_]/.test(b)) b = b.replace(/-/g, '+').replace(/_/g, '/');
        while (b.length % 4) b += '=';
        outp.value = b64ToUtf8(b);
      } catch (e) { outp.value = '⚠️ Bukan Base64 yang valid.'; }
    };
    root.appendChild(T.field('Input', inp));
    root.appendChild(urlSafe);
    root.appendChild(T.row(T.btn('Encode →', enc, true), T.btn('← Decode', dec)));
    root.appendChild(T.field('Output', outp));
    root.appendChild(T.row(T.btn('Salin Hasil', () => T.copy(outp.value)), T.btn('Tukar ⇅', () => { const t = inp.value; inp.value = outp.value; outp.value = t; })));
  
}
