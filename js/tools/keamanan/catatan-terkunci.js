import { h as T, utils } from '../../core.js?v=6.7.0';

/* Enkripsi AES-GCM via WebCrypto. Diekspor agar bisa diuji round-trip di luar browser. */
const _te = new TextEncoder(), _td = new TextDecoder();
const LS_PREFIX = 'locknote.';
const ITERASI = 100000;

function b64e(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64d(b64) {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
async function kunciDariPassword(password, salt) {
  const km = await crypto.subtle.importKey('raw', _te.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERASI, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function lockEncrypt(judul, isi, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await kunciDariPassword(password, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, _te.encode(JSON.stringify({ judul, isi })));
  return JSON.stringify({ salt: b64e(salt), iv: b64e(iv), data: b64e(data) });
}
export async function lockDecrypt(paket, password) {
  const o = JSON.parse(paket);
  const key = await kunciDariPassword(password, b64d(o.salt));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(o.iv) }, key, b64d(o.data));
  return JSON.parse(_td.decode(pt));
}

export const meta = {"id": "catatan-terkunci", "name": "Catatan Terkunci", "cat": "keamanan", "icon": "🔐", "desc": "Catatan terenkripsi AES dengan password.", "keywords": "catatan,enkripsi,aes,password,rahasia"};
export function render(root) {

    const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
    const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } };
    const lsJudul = () => {
      const r = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf(LS_PREFIX) === 0) r.push(k.slice(LS_PREFIX.length));
        }
      } catch (e) { /* abaikan */ }
      return r.sort();
    };
    const keyOf = (judul) => LS_PREFIX + encodeURIComponent(judul);
    const judulOf = (k) => { try { return decodeURIComponent(k); } catch (e) { return k; } };

    if (!window.crypto || !window.crypto.subtle) {
      root.appendChild(T.el('<div class="err" style="font-size:13px;line-height:1.6">⚠️ Browser/HP kamu tidak mendukung WebCrypto (butuh koneksi HTTPS). Tool ini tidak bisa dipakai di sini.</div>'));
      return;
    }

    // ---- Form tulis ----
    const jdlInp = T.input('text', 'Contoh: PIN ATM, ide bisnis…');
    const isiInp = T.ta(5, 'Tulis isi catatanmu di sini…');
    const pwInp = T.input('password', 'Password pengunci…');
    pwInp.autocomplete = 'new-password';
    const bShow = T.btn('👁️', () => {
      pwInp.type = pwInp.type === 'password' ? 'text' : 'password';
      bShow.textContent = pwInp.type === 'password' ? '👁️' : '🙈';
    });
    bShow.classList.add('small');
    const msg = T.out();

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Catatan rahasia yang dikunci pakai password — dienkripsi AES-256 langsung di HP kamu. ⚠️ <b>Password-nya jangan sampai lupa:</b> kalau hilang, catatannya nggak bisa dibuka selamanya. Nggak ada tombol "lupa password" di sini.</p>'));
    root.appendChild(T.field('Judul', jdlInp));
    root.appendChild(T.field('Isi catatan', isiInp));
    root.appendChild(T.field('Password', T.row(pwInp, bShow), 'Minimal 4 karakter. Makin panjang & acak, makin aman.'));
    root.appendChild(T.row(T.btn('🔐 Kunci & Simpan', () => {
      const judul = jdlInp.value.trim(), isi = isiInp.value, pw = pwInp.value;
      if (!judul) { T.show(msg, '<span class="err">Kasih judul dulu biar gampang dicari nanti.</span>'); return; }
      if (!isi.trim()) { T.show(msg, '<span class="err">Isi catatannya masih kosong.</span>'); return; }
      if (pw.length < 4) { T.show(msg, '<span class="err">Password minimal 4 karakter ya.</span>'); return; }
      T.show(msg, '<span class="dim">🔒 Mengenkripsi…</span>');
      setTimeout(async () => {
        try {
          const paket = await lockEncrypt(judul, isi, pw);
          if (!lsSet(keyOf(judul), paket)) { T.show(msg, '<span class="err">Gagal menyimpan — penyimpanan HP penuh atau tidak tersedia.</span>'); return; }
          jdlInp.value = ''; isiInp.value = ''; pwInp.value = '';
          T.show(msg, '<span class="ok">✅ Catatan terkunci & tersimpan. Password-nya dicatat baik-baik ya!</span>');
          gambarDaftar();
        } catch (e) { T.show(msg, '<span class="err">Gagal mengenkripsi: ' + T.esc(e.message || e) + '</span>'); }
      }, 30);
    }, true)));
    root.appendChild(msg);

    // ---- Daftar catatan ----
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">📂 Tersimpan di HP ini</h3>'));
    const daftarBox = T.out();
    const bukaBox = T.out();
    root.appendChild(daftarBox);
    root.appendChild(bukaBox);

    function gambarDaftar() {
      T.hide(bukaBox);
      const daftar = lsJudul();
      if (!daftar.length) { T.show(daftarBox, '<p class="dim" style="font-size:13px">Belum ada catatan tersimpan. Tulis yang pertama di atas 👆</p>'); return; }
      let html = '<div style="display:grid;gap:8px">';
      daftar.forEach((k) => {
        html += '<div class="row" style="justify-content:space-between;align-items:center;border:1px solid #ffffff20;border-radius:10px;padding:10px 12px">' +
          '<b style="font-size:14px">🔐 ' + T.esc(judulOf(k)) + '</b>' +
          '<div class="row"><button type="button" class="btn small" data-buka="' + T.esc(k) + '">Buka</button>' +
          '<button type="button" class="btn small" data-hapus="' + T.esc(k) + '">Hapus</button></div></div>';
      });
      html += '</div>';
      T.show(daftarBox, html);
      daftarBox.querySelectorAll('[data-buka]').forEach((b) => b.addEventListener('click', () => formBuka(b.dataset.buka)));
      daftarBox.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.armed) { lsDel(keyOf(b.dataset.hapus)); T.toast('Catatan dihapus'); gambarDaftar(); return; }
        b.dataset.armed = '1';
        b.textContent = 'Yakin hapus?';
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Hapus'; } }, 3000);
      }));
    }

    function formBuka(k) {
      const judul = judulOf(k);
      const pwBuka = T.input('password', 'Password catatan ini…');
      const hasil = T.out();
      const tombol = T.btn('🔓 Buka Catatan', () => {
        if (!pwBuka.value) { T.show(hasil, '<span class="err">Isi passwordnya dulu.</span>'); return; }
        T.show(hasil, '<span class="dim">Membuka…</span>');
        setTimeout(async () => {
          const paket = lsGet(keyOf(k));
          if (!paket) { T.show(hasil, '<span class="err">Catatannya sudah tidak ada.</span>'); return; }
          try {
            const n = await lockDecrypt(paket, pwBuka.value);
            T.show(hasil, '<div style="margin-top:8px"><b>📝 ' + T.esc(n.judul) + '</b></div>' +
              '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;margin-top:6px">' + T.esc(n.isi) + '</pre>');
          } catch (e) {
            T.show(hasil, '<span class="err">🔑 Password salah. Coba lagi — catatannya nggak rusak kok, cuma butuh password yang benar.</span>');
          }
        }, 30);
      }, true);
      T.show(bukaBox, '');
      bukaBox.appendChild(T.el('<div style="margin-top:4px"><b>Membuka: ' + T.esc(judul) + '</b></div>'));
      bukaBox.appendChild(T.field('Password', pwBuka));
      bukaBox.appendChild(T.row(tombol));
      bukaBox.appendChild(hasil);
    }

    gambarDaftar();

}
