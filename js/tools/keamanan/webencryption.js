import { h as T, fileInput, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "webencryption", "name": "Web Encryption", "cat": "keamanan", "icon": "🔐", "desc": "Kunci HTML jadi file berpassword (AES-256).", "keywords": "enkripsi,aes,password,html,kunci,proteksi"};

export function render(root) {

  const MAX_FILE = 5 * 1024 * 1024;

  const fi = fileInput('.html,.htm,.txt,text/html,text/plain');
  fi.style.margin = '6px 0';
  const srcTa = T.ta(8, 'Tempel source HTML lengkap di sini…', '');
  srcTa.style.fontFamily = 'monospace';
  srcTa.spellcheck = false;
  const titleInp = T.input('text', 'Protected Page', 'Protected Page');
  titleInp.maxLength = 80;
  const passInp = T.input('password', 'Minimal 4 karakter', '');
  passInp.autocomplete = 'new-password';
  const bShow = T.btn('Lihat', () => {
    passInp.type = passInp.type === 'password' ? 'text' : 'password';
    bShow.textContent = passInp.type === 'password' ? 'Lihat' : 'Sembunyi';
  });
  bShow.classList.add('small');
  const compactChk = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#e07856">');
  const box = T.out();
  const resWrap = T.el('<div hidden style="margin-top:12px"></div>');
  const outTa = T.ta(8, '', '');
  outTa.style.fontFamily = 'monospace';
  outTa.readOnly = true;
  outTa.spellcheck = false;
  const sizeLbl = T.el('<span class="dim" style="font-size:13px"></span>');

  let latest = '';

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    if (f.size > MAX_FILE) { fi.value = ''; T.show(box, errBox('File terlalu besar. Batas maksimal 5 MB.')); return; }
    try {
      srcTa.value = await f.text();
      if (!titleInp.value || titleInp.value === 'Protected Page')
        titleInp.value = f.name.replace(/\.(html?|txt)$/i, '') || 'Protected Page';
      T.show(box, '<span class="ok">File berhasil dimuat.</span>');
    } catch (e) { T.show(box, errBox('File gagal dibaca.')); }
  });

  const bytesToB64 = (bytes) => {
    let s = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CH, bytes.length)));
    return btoa(s);
  };
  const compactHtml = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim();

  async function deriveKey(password, salt) {
    const mat = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 180000, hash: 'SHA-256' },
      mat, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  const escHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Halaman gate mandiri: desain & kode ditulis ulang fresh.
  function protectedDocument(payload, title) {
    const safeTitle = escHtml(title || 'Protected Page');
    const pJson = JSON.stringify(payload).replace(/</g, '\\u003c');
    return '<!doctype html>\n' +
      '<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex,nofollow"><title>' + safeTitle + '</title>' +
      '<style>html,body{min-height:100%;margin:0}body{display:grid;place-items:center;background:#141210;color:#f5f1ea;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:20px;box-sizing:border-box}' +
      '.card{width:min(420px,100%);background:#1d1a16;border:1px solid #3a332b;border-radius:16px;padding:28px;box-sizing:border-box}' +
      '.kicker{font-size:11px;letter-spacing:.18em;color:#e07856;font-weight:700;margin-bottom:10px}' +
      'h1{font-size:22px;margin:0 0 8px}p{color:#b8ab97;font-size:14px;line-height:1.6;margin:0 0 18px}' +
      'input,button{width:100%;box-sizing:border-box;border-radius:10px;font:inherit}' +
      'input{padding:13px 14px;background:#141210;border:1px solid #3a332b;color:#fff;outline:none}' +
      'input:focus{border-color:#e07856}' +
      'button{margin-top:10px;padding:13px;border:0;background:#e07856;color:#141210;font-weight:700;cursor:pointer}' +
      'button:disabled{opacity:.6;cursor:wait}.msg{min-height:20px;margin-top:10px;color:#f08a8a;font-size:13px}' +
      '.foot{margin-top:14px;font-size:11px;color:#8a7d68;text-align:center}</style></head><body>' +
      '<main class="card"><div class="kicker">HALAMAN TERPROTEKSI</div><h1>Masukkan password</h1>' +
      '<p>Halaman ini terenkripsi. Masukkan password untuk membukanya di browser ini.</p>' +
      '<input id="pw" type="password" autocomplete="current-password" placeholder="Password">' +
      '<button id="open" type="button">Buka halaman</button>' +
      '<div class="msg" id="msg" role="status"></div>' +
      '<div class="foot">AES-256-GCM · PBKDF2-SHA256 · diproses lokal</div></main>' +
      '<script>(function(){"use strict";var P=' + pJson + ';' +
      'function b64(v){var s=atob(v),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}' +
      'async function key(p,s){var m=await crypto.subtle.importKey("raw",new TextEncoder().encode(p),"PBKDF2",false,["deriveKey"]);' +
      'return crypto.subtle.deriveKey({name:"PBKDF2",salt:s,iterations:180000,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["decrypt"])}' +
      'async function open(){var btn=document.getElementById("open"),msg=document.getElementById("msg"),pw=document.getElementById("pw").value;' +
      'if(!pw){msg.textContent="Password wajib diisi.";return}btn.disabled=true;btn.textContent="Membuka\\u2026";msg.textContent="";' +
      'try{var pl=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(P.iv)},await key(pw,b64(P.salt)),b64(P.data));' +
      'var html=new TextDecoder().decode(pl);document.open();document.write(html);document.close()}' +
      'catch(e){msg.textContent="Password salah atau file rusak.";btn.disabled=false;btn.textContent="Buka halaman"}}' +
      'document.getElementById("open").addEventListener("click",open);' +
      'document.getElementById("pw").addEventListener("keydown",function(e){if(e.key==="Enter")open()})})();<' + '/script></body></html>';
  }

  const generate = async () => {
    let html = srcTa.value.trim();
    const pass = passInp.value;
    if (!html) { T.show(box, errBox('Source HTML masih kosong.')); srcTa.focus(); return; }
    if (pass.length < 4) { T.show(box, errBox('Password minimal 4 karakter.')); passInp.focus(); return; }
    if (!window.crypto || !crypto.subtle) { T.show(box, errBox('Browser ini belum mendukung Web Crypto API.')); return; }
    T.show(box, '<span class="dim">Membuat kunci dan mengenkripsi…</span>');
    try {
      if (compactChk.checked) html = compactHtml(html);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(pass, salt);
      const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html));
      latest = protectedDocument(
        { salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(enc)) },
        titleInp.value.trim() || 'Protected Page'
      );
      outTa.value = latest;
      sizeLbl.textContent = (new Blob([latest]).size / 1024).toFixed(1) + ' KB';
      resWrap.hidden = false;
      T.show(box, '<span class="ok">Enkripsi berhasil. Uji file hasil dengan password sebelum dipublikasikan.</span>');
      resWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { T.show(box, errBox('Enkripsi gagal: ' + (e && e.message ? e.message : 'kesalahan browser'))); }
  };

  const slug = (s) => (s || 'protected-page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'protected-page';
  const bDl = T.btn('Unduh HTML', () => {
    if (!latest) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([latest], { type: 'text/html;charset=utf-8' }));
    a.download = slug(titleInp.value.trim()) + '-encrypted.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, true);
  const bCopy = T.copyBtn(() => latest, 'Salin Source');

  const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
  chkRow.appendChild(compactChk);
  chkRow.appendChild(T.el('<span>Rapikan ukuran source sebelum dienkripsi (hapus komentar & spasi berlebih)</span>'));

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah HTML jadi satu file yang hanya terbuka dengan password (AES-256-GCM). Seluruh proses di perangkatmu.</p>'));
  root.appendChild(T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px">Ini perlindungan client-side, bukan DRM mutlak. Simpan source asli dan password secara terpisah.</div>'));
  root.appendChild(T.el('<div style="margin-bottom:4px"><b>Ambil file HTML</b> <span class="dim" style="font-size:12px">· maks 5 MB (.html/.htm/.txt)</span></div>'));
  root.appendChild(fi);
  root.appendChild(T.field('Source HTML', srcTa));
  root.appendChild(T.grid2(T.field('Judul halaman', titleInp), T.field('Password', T.row(passInp, bShow))));
  root.appendChild(chkRow);
  root.appendChild(T.row(T.btn('Enkripsi HTML', generate, true)));
  root.appendChild(box);
  resWrap.appendChild(T.el('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>File terenkripsi siap</b></div>'));
  resWrap.appendChild(sizeLbl);
  resWrap.appendChild(outTa);
  resWrap.appendChild(T.row(bDl, bCopy));
  root.appendChild(resWrap);
}
