import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "hmac-generator", "name": "HMAC Generator", "cat": "keamanan", "icon": "🔏", "desc": "Buat HMAC-SHA256/SHA-512 dari teks + secret key.", "keywords": "hmac,sha,secret,api"};
export function render(root) {

    const txt = T.ta(4, 'Teks / pesan…');
    const key = T.input('text', 'Secret key…');
    const alg = T.select([['SHA-256', 'HMAC-SHA-256'], ['SHA-512', 'HMAC-SHA-512']], 'SHA-256');
    const out = T.out();
    const go = async () => {
      if (!txt.value) { T.show(out, '<span class="err">Isi teksnya dulu.</span>'); return; }
      if (!key.value) { T.show(out, '<span class="err">Isi secret key-nya dulu.</span>'); return; }
      try {
        T.show(out, '<span class="dim">Menghitung…</span>');
        const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key.value), { name: 'HMAC', hash: alg.value }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(txt.value));
        const bytes = new Uint8Array(sig);
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        const b64 = btoa(bin);
        T.show(out,
          '<div class="kv"><span class="k">Hex</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(hex) + '</span></div>' +
          '<div class="kv"><span class="k">Base64</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(b64) + '</span></div>');
        out.appendChild(T.row(T.btn('Salin Hex', () => T.copy(hex)), T.btn('Salin Base64', () => T.copy(b64))));
      } catch (e) { T.show(out, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
    };
    root.appendChild(T.field('Teks / pesan', txt));
    root.appendChild(T.field('Secret key', key, 'Kunci rahasia hanya dipakai di browser ini.'));
    root.appendChild(T.field('Algoritma', alg));
    root.appendChild(T.row(T.btn('Buat HMAC', go, true)));
    root.appendChild(out);
  
}
