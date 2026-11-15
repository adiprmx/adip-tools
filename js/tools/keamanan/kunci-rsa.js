import { h as T, utils, LOCAL_NOTE } from '../../core.js?v=6.11.5';

export const meta = {"id": "kunci-rsa", "name": "Buat Pasangan Kunci RSA", "cat": "keamanan", "icon": "🔑", "desc": "Buat pasangan kunci publik & privat RSA langsung di perangkat, tanpa dikirim ke mana-mana.", "keywords": "rsa,kunci,public,private,keypair,ssh,pem,kriptografi"};
export function render(root) {

    const bitsSel = T.select([['2048', '2048 bit (standar, cepat)'], ['4096', '4096 bit (lebih kuat, lebih lambat)']], '2048');
    const pubTa = T.ta(6, 'Kunci publik muncul di sini…');
    pubTa.readOnly = true;
    const privTa = T.ta(8, 'Kunci privat muncul di sini…');
    privTa.readOnly = true;
    const box = T.out();
    let pubPem = '', privPem = '';

    function toPem(buf, label) {
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      const b64 = btoa(bin);
      const lines = b64.match(/.{1,64}/g) || [];
      return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----';
    }

    async function generate() {
      if (!window.crypto || !window.crypto.subtle) {
        T.show(box, '<div style="color:#ef4444;font-size:14px;line-height:1.6">⚠️ Browser ini tidak mendukung pembuatan kunci di perangkat. Coba browser lain yang lebih baru.</div>');
        return;
      }
      T.show(box, '<div class="dim" style="font-size:14px">⏳ Membuat kunci… (4096 bit bisa makan waktu beberapa detik)</div>');
      pubTa.value = ''; privTa.value = ''; pubPem = ''; privPem = '';
      // Kasih jeda supaya pesan "membuat kunci" sempat tampil
      await new Promise((r) => setTimeout(r, 30));
      try {
        const bits = parseInt(bitsSel.value, 10);
        const pair = await window.crypto.subtle.generateKey(
          { name: 'RSASSA-PKCS1-v1_5', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
          true,
          ['sign', 'verify']
        );
        const pubBuf = await window.crypto.subtle.exportKey('spki', pair.publicKey);
        const privBuf = await window.crypto.subtle.exportKey('pkcs8', pair.privateKey);
        pubPem = toPem(pubBuf, 'PUBLIC KEY');
        privPem = toPem(privBuf, 'PRIVATE KEY');
        pubTa.value = pubPem;
        privTa.value = privPem;
        T.show(box, '<div style="color:#22c55e;font-size:14px;line-height:1.6">✅ Pasangan kunci ' + bits + ' bit berhasil dibuat. Kunci privat hanya ada di perangkat ini — simpan baik-baik dan jangan dibagikan ke siapa pun.</div>');
      } catch (e) {
        T.show(box, '<div style="color:#ef4444;font-size:14px;line-height:1.6">⚠️ Gagal membuat kunci: ' + T.esc(e && e.message ? e.message : String(e)) + '</div>');
      }
    }

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + ' Kunci privat tidak pernah keluar dari perangkat ini.</p>'));
    root.appendChild(T.field('Kekuatan kunci', bitsSel, '2048 bit sudah cukup untuk kebanyakan keperluan.'));
    root.appendChild(T.row(T.btn('Buat Pasangan Kunci', generate, true)));
    root.appendChild(box);
    root.appendChild(T.field('Kunci publik (boleh dibagikan)', pubTa));
    root.appendChild(T.row(
      T.btn('Salin Kunci Publik', () => { if (!pubPem) { T.toast('Buat kuncinya dulu'); return; } T.copy(pubPem); }),
      T.btn('Unduh .pem', () => { if (!pubPem) { T.toast('Buat kuncinya dulu'); return; } T.dl('kunci-publik.pem', pubPem, 'application/x-pem-file'); })
    ));
    root.appendChild(T.field('Kunci privat (RAHASIA — jangan dibagikan)', privTa));
    root.appendChild(T.row(
      T.btn('Salin Kunci Privat', () => { if (!privPem) { T.toast('Buat kuncinya dulu'); return; } T.copy(privPem); }),
      T.btn('Unduh .pem', () => { if (!privPem) { T.toast('Buat kuncinya dulu'); return; } T.dl('kunci-privat.pem', privPem, 'application/x-pem-file'); })
    ));
  
}
