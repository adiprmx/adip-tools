import { h as T, utils, errBox, esc, preHtml, tabs } from '../../core.js?v=6.13.0';

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
      return { error: 'Token ini tidak bisa dibaca. Pastikan token JWT-nya lengkap dan tersalin utuh.' };
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

// Tabel algoritma: HMAC (satu kata sandi), RSA klasik & PSS, ECDSA.
// size = panjang tiap komponen R/S dalam byte (untuk konversi DER <-> mentah).
const ALGS = {
    HS256: { kind: 'hmac', hash: 'SHA-256' },
    HS384: { kind: 'hmac', hash: 'SHA-384' },
    HS512: { kind: 'hmac', hash: 'SHA-512' },
    RS256: { kind: 'rsassa', hash: 'SHA-256' },
    RS384: { kind: 'rsassa', hash: 'SHA-384' },
    RS512: { kind: 'rsassa', hash: 'SHA-512' },
    PS256: { kind: 'pss', hash: 'SHA-256', salt: 32 },
    PS384: { kind: 'pss', hash: 'SHA-384', salt: 48 },
    PS512: { kind: 'pss', hash: 'SHA-512', salt: 64 },
    ES256: { kind: 'ecdsa', hash: 'SHA-256', curve: 'P-256', size: 32 },
    ES384: { kind: 'ecdsa', hash: 'SHA-384', curve: 'P-384', size: 48 },
    ES512: { kind: 'ecdsa', hash: 'SHA-512', curve: 'P-521', size: 66 },
  };

const ALG_OPTIONS = [
    ['HS256', 'HS256 (kata sandi rahasia)'],
    ['HS384', 'HS384 (kata sandi rahasia)'],
    ['HS512', 'HS512 (kata sandi rahasia)'],
    ['RS256', 'RS256 (kunci RSA)'],
    ['RS384', 'RS384 (kunci RSA)'],
    ['RS512', 'RS512 (kunci RSA)'],
    ['PS256', 'PS256 (kunci RSA, PSS)'],
    ['PS384', 'PS384 (kunci RSA, PSS)'],
    ['PS512', 'PS512 (kunci RSA, PSS)'],
    ['ES256', 'ES256 (kunci kurva P-256)'],
    ['ES384', 'ES384 (kunci kurva P-384)'],
    ['ES512', 'ES512 (kunci kurva P-521)'],
  ];

const KUNCI_HINT = {
    hmac: 'Kata sandi rahasia — satu kata sandi yang sama untuk membuat & memeriksa.',
    rsassa: 'Kunci private RSA format PEM (PKCS#8, diawali "BEGIN PRIVATE KEY"). Belum punya? Buat di tab "Buat kunci".',
    pss: 'Kunci private RSA format PEM (PKCS#8). Kunci RSA yang sama bisa dipakai RS* maupun PS*.',
    ecdsa: 'Kunci private EC format PEM (PKCS#8) dengan kurva yang sesuai algoritma. Belum punya? Buat di tab "Buat kunci".',
  };
const KUNCI_HINT_VERIFIKASI = {
    hmac: 'Kata sandi rahasia yang sama dengan saat token dibuat.',
    rsassa: 'Kunci public RSA format PEM (SPKI, diawali "BEGIN PUBLIC KEY").',
    pss: 'Kunci public RSA format PEM (SPKI).',
    ecdsa: 'Kunci public EC format PEM (SPKI) dengan kurva yang sesuai algoritma.',
  };

export async function signJwt(header, payload, alg, secretOrKey) {
    const a = ALGS[alg];
    if (!a) throw new Error('Algoritma tidak didukung: ' + alg);
    const encHeader = b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const encPayload = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const input = encHeader + '.' + encPayload;
    const data = new TextEncoder().encode(input);
    let sig;
    if (a.kind === 'hmac') {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: a.hash }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
    } else if (a.kind === 'rsassa') {
      const key = await crypto.subtle.importKey('pkcs8', pemToBytes(secretOrKey, 'private'), { name: 'RSASSA-PKCS1-v1_5', hash: a.hash }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data));
    } else if (a.kind === 'pss') {
      const key = await crypto.subtle.importKey('pkcs8', pemToBytes(secretOrKey, 'private'), { name: 'RSA-PSS', hash: a.hash }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: a.salt }, key, data));
    } else if (a.kind === 'ecdsa') {
      // WebCrypto mengembalikan tanda tangan ECDSA sudah dalam format mentah
      // R||S (IEEE P1363) — persis format yang dipakai JWT, tanpa konversi.
      const key = await crypto.subtle.importKey('pkcs8', pemToBytes(secretOrKey, 'private'), { name: 'ECDSA', namedCurve: a.curve }, false, ['sign']);
      sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: a.hash }, key, data));
    }
    return input + '.' + b64urlEncode(sig);
  }

export async function verifyJwt(token, alg, secretOrKey) {
    const a = ALGS[alg];
    if (!a) throw new Error('Algoritma tidak didukung: ' + alg);
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
    if (a.kind === 'hmac') {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: a.hash }, false, ['verify']);
      return crypto.subtle.verify('HMAC', key, sigBytes, data);
    }
    if (a.kind === 'rsassa') {
      const key = await crypto.subtle.importKey('spki', pemToBytes(secretOrKey, 'public'), { name: 'RSASSA-PKCS1-v1_5', hash: a.hash }, false, ['verify']);
      return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, data);
    }
    if (a.kind === 'pss') {
      const key = await crypto.subtle.importKey('spki', pemToBytes(secretOrKey, 'public'), { name: 'RSA-PSS', hash: a.hash }, false, ['verify']);
      return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: a.salt }, key, sigBytes, data);
    }
    if (a.kind === 'ecdsa') {
      const key = await crypto.subtle.importKey('spki', pemToBytes(secretOrKey, 'public'), { name: 'ECDSA', namedCurve: a.curve }, false, ['verify']);
      return crypto.subtle.verify({ name: 'ECDSA', hash: a.hash }, key, sigBytes, data);
    }
    throw new Error('Algoritma tidak didukung: ' + alg);
  }

function toPem(buf, label) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return '-----BEGIN ' + label + '-----\n' + b64.match(/.{1,64}/g).join('\n') + '\n-----END ' + label + '-----';
  }

export async function generateKeyPair(kind) {
    let pair;
    if (kind === 'rsa') {
      pair = await crypto.subtle.generateKey(
        { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true, ['sign', 'verify']);
    } else {
      pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: kind }, true, ['sign', 'verify']);
    }
    const priv = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
    const pub = await crypto.subtle.exportKey('spki', pair.publicKey);
    return { priv: toPem(priv, 'PRIVATE KEY'), pub: toPem(pub, 'PUBLIC KEY') };
  }

export const meta = {"id": "jwt-parser", "name": "JWT Parser", "cat": "developer", "icon": "🎫", "desc": "Baca, buat & verifikasi token JWT (HS/RS/PS/ES) + buat kunci.", "keywords": "jwt,token,auth,sign,verify,hs256,rs256,es256,ps256"};
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
    const algSel = T.select(ALG_OPTIONS, 'HS256');
    const hdrTa = T.ta(3, '{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    const payTa = T.ta(5, '{\n  "sub": "123",\n  "name": "contoh",\n  "iat": 1700000000\n}');
    hdrTa.style.fontFamily = 'ui-monospace,monospace'; payTa.style.fontFamily = 'ui-monospace,monospace';
    const keyTa = T.ta(3, 'Kata sandi rahasia (HS*) atau kunci private PEM (RS*/PS*/ES*)…');
    const keyHint = T.el('<div class="hint"></div>');
    const syncKeyHint = () => { keyHint.textContent = KUNCI_HINT[ALGS[algSel.value].kind] || ''; };
    algSel.addEventListener('change', syncKeyHint);
    const createBox = T.out();
    const createRes = T.ta(4, 'Token hasil muncul di sini…');
    createRes.readOnly = true;
    let created = '';
    const doCreate = async () => {
      let header, payload;
      try { header = hdrTa.value.trim() ? JSON.parse(hdrTa.value) : {}; } catch (e) { T.show(createBox, errBox('Header bukan JSON yang benar. Periksa penulisannya, lalu coba lagi.')); return; }
      try { payload = payTa.value.trim() ? JSON.parse(payTa.value) : {}; } catch (e) { T.show(createBox, errBox('Payload bukan JSON yang benar. Periksa penulisannya, lalu coba lagi.')); return; }
      const alg = algSel.value;
      header = { ...header, alg, typ: header.typ || 'JWT' };
      const secret = keyTa.value;
      if (!secret.trim()) { T.show(createBox, errBox(ALGS[alg].kind === 'hmac' ? 'Isi kata sandi rahasianya.' : 'Tempel kunci private PEM-nya.')); return; }
      T.show(createBox, '<span class="dim">Menandatangani…</span>');
      try {
        created = await signJwt(header, payload, alg, secret);
        createRes.value = created;
        T.show(createBox, '<span class="ok">✓ Token dibuat (' + alg + ').</span>');
      } catch (e) {
        created = '';
        const kind = ALGS[alg].kind;
        const tip = kind === 'hmac' ? ''
          : kind === 'ecdsa' ? ' Pastikan kunci private EC-nya memakai kurva yang sesuai (' + ALGS[alg].curve + ') dan format PKCS#8 (diawali "BEGIN PRIVATE KEY").'
          : ' Pastikan kunci private format PKCS#8 (diawali "BEGIN PRIVATE KEY").';
        T.show(createBox, errBox('Gagal membuat token.' + tip));
      }
    };
    pCreate.appendChild(T.field('Algoritma', algSel, 'HS* pakai satu kata sandi rahasia. RS*/PS* pakai kunci RSA. ES* pakai kunci kurva eliptik (lebih pendek).'));
    pCreate.appendChild(T.field('Header (JSON)', hdrTa));
    pCreate.appendChild(T.field('Payload (JSON)', payTa));
    pCreate.appendChild(T.field('Kunci', keyTa));
    pCreate.appendChild(keyHint);
    syncKeyHint();
    pCreate.appendChild(T.row(T.btn('Buat Token', doCreate, true), T.copyBtn(() => created, 'Salin Token')));
    pCreate.appendChild(createBox);
    pCreate.appendChild(T.field('Token', createRes));

    // ---- Tab 3: Verifikasi ----
    const pVerify = T.el('<div></div>');
    const vAlgSel = T.select(ALG_OPTIONS, 'HS256');
    const vTa = T.ta(4, 'Paste token JWT…');
    const vKeyTa = T.ta(3, 'Kata sandi rahasia (HS*) atau kunci public PEM (RS*/PS*/ES*)…');
    const vKeyHint = T.el('<div class="hint"></div>');
    const syncVKeyHint = () => { vKeyHint.textContent = KUNCI_HINT_VERIFIKASI[ALGS[vAlgSel.value].kind] || ''; };
    vAlgSel.addEventListener('change', syncVKeyHint);
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
        const kind = ALGS[vAlgSel.value].kind;
        const tip = kind === 'hmac' ? ''
          : kind === 'ecdsa' ? ' Pastikan kunci public EC-nya memakai kurva yang sesuai (' + ALGS[vAlgSel.value].curve + ') dan format SPKI (diawali "BEGIN PUBLIC KEY").'
          : ' Pastikan kunci public format SPKI (diawali "BEGIN PUBLIC KEY").';
        T.show(vBox, errBox('Gagal memverifikasi token.' + tip));
      }
    };
    pVerify.appendChild(T.field('Algoritma', vAlgSel));
    pVerify.appendChild(T.field('Token JWT', vTa));
    pVerify.appendChild(T.field('Kunci', vKeyTa));
    pVerify.appendChild(vKeyHint);
    syncVKeyHint();
    pVerify.appendChild(T.row(T.btn('Verifikasi', doVerify, true)));
    pVerify.appendChild(vBox);

    // ---- Tab 4: Buat kunci (RSA / EC) ----
    const pKeys = T.el('<div></div>');
    const kKindSel = T.select([
      ['rsa', 'RSA 2048-bit (untuk RS256/384/512 & PS256/384/512)'],
      ['P-256', 'Kurva P-256 (untuk ES256)'],
      ['P-384', 'Kurva P-384 (untuk ES384)'],
      ['P-521', 'Kurva P-521 (untuk ES512)'],
    ], 'rsa');
    const kPrivTa = T.ta(6, 'Kunci private muncul di sini…');
    const kPubTa = T.ta(4, 'Kunci public muncul di sini…');
    kPrivTa.readOnly = true; kPubTa.readOnly = true;
    kPrivTa.style.fontFamily = 'ui-monospace,monospace'; kPubTa.style.fontFamily = 'ui-monospace,monospace';
    const kBox = T.out();
    const doGenKeys = async () => {
      T.show(kBox, '<span class="dim">Membuat pasangan kunci…</span>');
      try {
        const kp = await generateKeyPair(kKindSel.value);
        kPrivTa.value = kp.priv;
        kPubTa.value = kp.pub;
        T.show(kBox, '<span class="ok">✓ Pasangan kunci dibuat.</span> <span class="dim">Private untuk membuat token, public untuk memeriksa. Simpan private-nya baik-baik.</span>');
      } catch (e) {
        T.show(kBox, errBox('Kunci tidak bisa dibuat. Coba lagi.'));
      }
    };
    pKeys.appendChild(T.el('<p class="hint" style="margin-bottom:10px">Kunci dibuat langsung di perangkat ini dan tidak dikirim ke mana-mana. Dipakai untuk algoritma RS*, PS*, dan ES*.</p>'));
    pKeys.appendChild(T.field('Jenis kunci', kKindSel));
    pKeys.appendChild(T.row(T.btn('Buat Pasangan Kunci', doGenKeys, true)));
    pKeys.appendChild(kBox);
    pKeys.appendChild(T.field('Kunci private (rahasia)', kPrivTa));
    pKeys.appendChild(T.row(T.copyBtn(() => kPrivTa.value, 'Salin Private')));
    pKeys.appendChild(T.field('Kunci public (boleh dibagikan)', kPubTa));
    pKeys.appendChild(T.row(T.copyBtn(() => kPubTa.value, 'Salin Public')));

    root.appendChild(tabs([['Baca token', 0], ['Buat token', 1], ['Verifikasi', 2], ['Buat kunci', 3]], [pRead, pCreate, pVerify, pKeys]));
    root.appendChild(pRead);
    root.appendChild(pCreate);
    root.appendChild(pVerify);
    root.appendChild(pKeys);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Semua diproses di perangkat ini. Jangan tempel token produksi yang masih aktif ke perangkat orang lain.</div>'));
  
}
