import { h as T, utils, errBox, esc, preHtml, tabs } from '../../core.js?v=6.11.5';

function b64urlDecode(seg) {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const bin = atob(b64 + (pad ? '='.repeat(4 - pad) : ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

function b64urlEncode(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

function jwtDecode(token) {
    const parts = String(token == null ? '' : token).trim().split('.');
    if (parts.length !== 3) return { error: 'Format JWT harus punya 3 bagian (header.payload.signature).' };
    try {
      const header = JSON.parse(b64urlDecode(parts[0]));
      const payload = JSON.parse(b64urlDecode(parts[1]));
      return { header, payload, signature: parts[2], signingInput: parts[0] + '.' + parts[1] };
    } catch (e) {
      return { error: 'Gagal decode JWT: ' + (e && e.message ? e.message : e) };
    }
  }

// Penjelasan klaim standar JWT, bahasa sehari-hari.
const CLAIM_HELP = {
    iss: 'Siapa yang menerbitkan token ini.',
    sub: 'Pemilik token ini (biasanya ID pengguna).',
    aud: 'Siapa yang dituju token ini (nama aplikasi/layanan).',
    exp: 'Kapan token kedaluwarsa (tidak berlaku lagi sesudah waktu ini).',
    nbf: 'Token baru berlaku mulai waktu ini.',
    iat: 'Kapan token ini dibuat.',
    jti: 'ID unik token ini (untuk melacak/mencabut satu token).',
  };

function pemToBytes(pem, label) {
    const clean = String(pem || '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    if (!clean) throw new Error('Tempel dulu kunci ' + label + ' format PEM.');
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

async function signJwt(header, payload, alg, secretOrKey) {
    const encHeader = b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const encPayload = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const input = encHeader + '.' + encPayload;
    const data = new TextEncoder().encode(input);
    let sig;
    if (alg === 'HS256') {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
    } else if (alg === 'RS256') {
      const key = await crypto.subtle.importKey('pkcs8', pemToBytes(secretOrKey, 'private'), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data));
    } else throw new Error('Algoritma tidak didukung: ' + alg);
    return input + '.' + b64urlEncode(sig);
  }

async function verifyJwt(token, alg, secretOrKey) {
    const r = jwtDecode(token);
    if (r.error) throw new Error(r.error);
    const data = new TextEncoder().encode(r.signingInput);
    const sigBytes = (() => {
      const b64 = r.signature.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const bin = atob(b64 + (pad ? '='.repeat(4 - pad) : ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    })();
    if (alg === 'HS256') {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      return crypto.subtle.verify('HMAC', key, sigBytes, data);
    }
    if (alg === 'RS256') {
      const key = await crypto.subtle.importKey('spki', pemToBytes(secretOrKey, 'public'), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, data);
    }
    throw new Error('Algoritma tidak didukung: ' + alg);
  }

export const meta = {"id": "jwt-parser", "name": "JWT Parser", "cat": "developer", "icon": "🎫", "desc": "Baca, buat & verifikasi token JWT.", "keywords": "jwt,token,auth,sign,verify"};
export function render(root) {

    const fmtDur = (sec) => {
      if (sec < 0) return null;
      const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
      const p = [];
      if (d) p.push(d + ' hari'); if (h) p.push(h + ' jam'); if (m || !p.length) p.push(m + ' menit');
      return p.join(' ');
    };
    const claimRows = (payload) => {
      const rows = Object.keys(CLAIM_HELP).filter((k) => payload && payload[k] != null).map((k) => {
        let v = payload[k];
        if ((k === 'exp' || k === 'nbf' || k === 'iat') && typeof v === 'number') v = new Date(v * 1000).toLocaleString('id-ID') + ' (' + v + ')';
        return '<div class="kv"><span class="k">' + esc(k) + ' <span class="dim">: ' + esc(CLAIM_HELP[k]) + '</span></span><span class="v" style="font-family:ui-monospace,monospace;font-size:12px;word-break:break-all">' + esc(String(v)) + '</span></div>';
      });
      return rows.length ? '<div class="hint" style="margin:12px 0 4px">Penjelasan klaim:</div>' + rows.join('') : '';
    };

    // ---- Tab 1: Baca token (fitur lama, dipertahankan) ----
    const pRead = T.el('<div></div>');
    const ta = T.ta(4, 'Paste token JWT (xxxxx.yyyyy.zzzzz)…');
    const box = T.out();
    pRead.appendChild(T.field('Token JWT', ta));
    pRead.appendChild(T.row(T.btn('Decode', () => {
      const r = jwtDecode(ta.value);
      if (r.error) { T.show(box, errBox(r.error)); return; }
      let expHtml = '<span class="dim">tidak ada klaim exp</span>';
      if (r.payload && r.payload.exp != null) {
        const now = Math.floor(Date.now() / 1000);
        const left = r.payload.exp - now;
        const when = new Date(r.payload.exp * 1000).toLocaleString('id-ID');
        expHtml = left <= 0
          ? '<span class="err">⛔ Kedaluwarsa (' + esc(when) + ')</span>'
          : '<span class="ok">✓ Berlaku</span> <span class="dim">, kedaluwarsa ' + esc(when) + ' (sisa ' + esc(fmtDur(left)) + ')</span>';
      }
      let iatHtml = '';
      if (r.payload && r.payload.iat != null) iatHtml = '<div class="hint">Diterbitkan: ' + esc(new Date(r.payload.iat * 1000).toLocaleString('id-ID')) + '</div>';
      let nbfHtml = '';
      if (r.payload && r.payload.nbf != null) {
        const now = Math.floor(Date.now() / 1000);
        nbfHtml = '<div class="hint">Mulai berlaku: ' + esc(new Date(r.payload.nbf * 1000).toLocaleString('id-ID')) + (r.payload.nbf > now ? ' <span class="warn">(belum berlaku)</span>' : '') + '</div>';
      }
      T.show(box,
        '<div style="background:#3f2f04;border:1px solid #eab308;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:10px">⚠️ <b>Signature TIDAK diverifikasi di tab ini.</b> Tool ini hanya membaca isi token. Pakai tab Verifikasi untuk memeriksa keaslian signature.</div>' +
        '<div class="hint" style="margin:8px 0 4px">Header:</div>' + preHtml(JSON.stringify(r.header, null, 2)) +
        '<div class="hint" style="margin:8px 0 4px">Payload:</div>' + preHtml(JSON.stringify(r.payload, null, 2)) +
        '<div style="font-size:13px;margin-top:10px"><b>Status exp:</b> ' + expHtml + '</div>' + iatHtml + nbfHtml +
        '<div class="hint" style="margin-top:6px">Signature: <span style="font-family:monospace">' + esc(String(r.signature).slice(0, 24)) + '…</span></div>' +
        claimRows(r.payload));
    }, true)));
    pRead.appendChild(box);

    // ---- Tab 2: Buat token ----
    const pCreate = T.el('<div></div>');
    const algSel = T.select([['HS256', 'HS256 (kata sandi rahasia)'], ['RS256', 'RS256 (kunci private RSA)']], 'HS256');
    const hdrTa = T.ta(3, '{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    const payTa = T.ta(5, '{\n  "sub": "123",\n  "name": "contoh",\n  "iat": 1700000000\n}');
    hdrTa.style.fontFamily = 'ui-monospace,monospace'; payTa.style.fontFamily = 'ui-monospace,monospace';
    const keyTa = T.ta(3, 'Kata sandi rahasia (HS256) atau kunci private PEM (RS256)…');
    const createBox = T.out();
    const createRes = T.ta(4, 'Token hasil muncul di sini…');
    createRes.readOnly = true;
    let created = '';
    const doCreate = async () => {
      let header, payload;
      try { header = hdrTa.value.trim() ? JSON.parse(hdrTa.value) : {}; } catch (e) { T.show(createBox, errBox('Header bukan JSON valid: ' + e.message)); return; }
      try { payload = payTa.value.trim() ? JSON.parse(payTa.value) : {}; } catch (e) { T.show(createBox, errBox('Payload bukan JSON valid: ' + e.message)); return; }
      const alg = algSel.value;
      header = { ...header, alg, typ: header.typ || 'JWT' };
      const secret = keyTa.value;
      if (!secret.trim()) { T.show(createBox, errBox(alg === 'HS256' ? 'Isi kata sandi rahasianya.' : 'Tempel kunci private PEM-nya.')); return; }
      T.show(createBox, '<span class="dim">Menandatangani…</span>');
      try {
        created = await signJwt(header, payload, alg, secret);
        createRes.value = created;
        T.show(createBox, '<span class="ok">✓ Token dibuat (' + alg + ').</span>');
      } catch (e) {
        created = '';
        T.show(createBox, errBox('Gagal membuat token: ' + (e && e.message ? e.message : e) + (alg === 'RS256' ? ' Pastikan kunci private format PKCS#8 (diawali "BEGIN PRIVATE KEY").' : '')));
      }
    };
    pCreate.appendChild(T.field('Algoritma', algSel, 'HS256 pakai satu kata sandi rahasia. RS256 pakai pasangan kunci private/public.'));
    pCreate.appendChild(T.field('Header (JSON)', hdrTa));
    pCreate.appendChild(T.field('Payload (JSON)', payTa));
    pCreate.appendChild(T.field('Kunci', keyTa));
    pCreate.appendChild(T.row(T.btn('Buat Token', doCreate, true), T.copyBtn(() => created, 'Salin Token')));
    pCreate.appendChild(createBox);
    pCreate.appendChild(T.field('Token', createRes));

    // ---- Tab 3: Verifikasi ----
    const pVerify = T.el('<div></div>');
    const vAlgSel = T.select([['HS256', 'HS256 (kata sandi rahasia)'], ['RS256', 'RS256 (kunci public RSA)']], 'HS256');
    const vTa = T.ta(4, 'Paste token JWT…');
    const vKeyTa = T.ta(3, 'Kata sandi rahasia (HS256) atau kunci public PEM (RS256)…');
    const vBox = T.out();
    const doVerify = async () => {
      if (!vTa.value.trim()) { T.show(vBox, errBox('Tempel dulu tokennya.')); return; }
      if (!vKeyTa.value.trim()) { T.show(vBox, errBox('Isi kuncinya.')); return; }
      T.show(vBox, '<span class="dim">Memeriksa signature…</span>');
      try {
        const ok = await verifyJwt(vTa.value, vAlgSel.value, vKeyTa.value);
        const r = jwtDecode(vTa.value);
        let expNote = '';
        if (r.payload && r.payload.exp != null) {
          expNote = r.payload.exp <= Math.floor(Date.now() / 1000)
            ? ' <span class="err">Tapi token ini sudah kedaluwarsa.</span>'
            : ' <span class="dim">Token belum kedaluwarsa.</span>';
        }
        T.show(vBox, ok
          ? '<span class="ok">✓ Signature SAH.</span> <span class="dim">Token ini memang ditandatangani dengan kunci tersebut dan isinya tidak berubah.</span>' + expNote
          : '<span class="err">✗ Signature TIDAK SAH.</span> <span class="dim">Kunci salah, atau isi token sudah diubah setelah ditandatangani.</span>');
      } catch (e) {
        T.show(vBox, errBox('Gagal memverifikasi: ' + (e && e.message ? e.message : e) + (vAlgSel.value === 'RS256' ? ' Pastikan kunci public format SPKI (diawali "BEGIN PUBLIC KEY").' : '')));
      }
    };
    pVerify.appendChild(T.field('Algoritma', vAlgSel));
    pVerify.appendChild(T.field('Token JWT', vTa));
    pVerify.appendChild(T.field('Kunci', vKeyTa));
    pVerify.appendChild(T.row(T.btn('Verifikasi', doVerify, true)));
    pVerify.appendChild(vBox);

    root.appendChild(tabs([['Baca token', 0], ['Buat token', 1], ['Verifikasi', 2]], [pRead, pCreate, pVerify]));
    root.appendChild(pRead);
    root.appendChild(pCreate);
    root.appendChild(pVerify);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Semua diproses di perangkat ini. Jangan tempel token produksi yang masih aktif ke perangkat orang lain.</div>'));
  
}
