import { h as T, utils } from '../../core.js?v=6.1.1';

export const meta = {"id": "totp-generator", "name": "OTP Authenticator", "cat": "keamanan", "icon": "⏱️", "desc": "Kode OTP 30-detik dari secret (kayak Google Authenticator).", "keywords": "otp,authenticator,2fa,kode"};
export function render(root) {

    const secInp = T.input('text', 'Secret Base32, misal: JBSWY3DPEHPK3PXP');
    secInp.autocomplete = 'off'; secInp.autocapitalize = 'characters'; secInp.spellcheck = false;
    const out = T.out();
    let timer = null;

    function base32dec(s) {
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      s = String(s).replace(/[\s=-]/g, '').toUpperCase();
      if (!s) throw new Error('Secret kosong.');
      let bits = 0, val = 0;
      const res = [];
      for (const ch of s) {
        const i = A.indexOf(ch);
        if (i < 0) throw new Error('Karakter Base32 tidak valid: "' + ch + '"');
        val = (val << 5) | i; bits += 5;
        if (bits >= 8) { res.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
      }
      if (!res.length) throw new Error('Secret tidak valid.');
      return new Uint8Array(res);
    }
    async function totp(secret, when) {
      const key = await crypto.subtle.importKey('raw', base32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const ctr = Math.floor((when != null ? when : Date.now()) / 1000 / 30);
      const buf = new ArrayBuffer(8), dv = new DataView(buf);
      dv.setUint32(0, Math.floor(ctr / 0x100000000));
      dv.setUint32(4, ctr >>> 0);
      const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
      const o = sig[sig.length - 1] & 0x0f;
      const code = (((sig[o] & 0x7f) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3]) % 1000000;
      return String(code).padStart(6, '0');
    }

    const mulai = () => {
      if (timer) { clearInterval(timer); timer = null; }
      const sec = secInp.value.trim();
      if (!sec) { T.show(out, '<span class="err">Isi secret Base32-nya dulu.</span>'); return; }
      let kode = '••••••';
      const codeEl = T.el('<div class="big center" style="font-family:ui-monospace,monospace;letter-spacing:.15em">••••••</div>');
      const prog = T.el('<div style="height:8px;border-radius:5px;background:#27272a;overflow:hidden;margin:10px 0"><div style="height:100%;width:100%;background:#fff;transition:width .5s linear"></div></div>');
      const sisaEl = T.el('<div class="center dim">Kode baru dalam …</div>');
      T.show(out, '');
      out.appendChild(T.el('<div class="center mut" style="margin-bottom:4px">Kode OTP saat ini</div>'));
      out.appendChild(codeEl);
      out.appendChild(prog);
      out.appendChild(sisaEl);
      const bCopy = T.btn('Salin Kode', () => T.copy(kode));
      out.appendChild(T.row(bCopy));
      const tick = async () => {
        try {
          const now = Date.now();
          kode = await totp(sec, now);
          const sisa = 30 - Math.floor(now / 1000) % 30;
          codeEl.textContent = kode.slice(0, 3) + ' ' + kode.slice(3);
          prog.firstElementChild.style.width = (sisa / 30 * 100) + '%';
          prog.firstElementChild.style.background = sisa <= 5 ? '#ef4444' : '#fff';
          sisaEl.textContent = 'Kode baru dalam ' + sisa + ' detik';
        } catch (e) {
          clearInterval(timer); timer = null;
          T.show(out, '<span class="err">Secret tidak valid: ' + T.esc(e.message) + '</span>');
        }
      };
      tick();
      timer = setInterval(tick, 500);
      T.onLeave(() => { if (timer) clearInterval(timer); });
    };
    root.appendChild(T.field('Secret (Base32)', secInp, '🔒 Secret hanya dipakai di browser ini dan TIDAK disimpan. Tutup halaman, secret hilang.'));
    root.appendChild(T.row(T.btn('▶️ Tampilkan Kode', mulai, true)));
    root.appendChild(out);
  
}
