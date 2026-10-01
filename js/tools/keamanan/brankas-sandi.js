import { h as T, utils } from '../../core.js?v=6.7.0';

/* Enkripsi AES-GCM via WebCrypto — pendekatan meniru catatan-terkunci.js.
 * Satu vault terenkripsi menyimpan {cek, entri[]}; password tidak pernah
 * disimpan, di localStorage maupun di mana pun. Diekspor agar bisa diuji
 * round-trip di luar browser. */
const _te = new TextEncoder(), _td = new TextDecoder();
const LS_KEY = 'brankas.vault';
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
export async function vltEncrypt(entri, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await kunciDariPassword(password, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, _te.encode(JSON.stringify({ cek: 'brankas-ok', entri })));
  return JSON.stringify({ salt: b64e(salt), iv: b64e(iv), data: b64e(data) });
}
export async function vltDecrypt(paket, password) {
  const o = JSON.parse(paket);
  const key = await kunciDariPassword(password, b64d(o.salt));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(o.iv) }, key, b64d(o.data));
  const v = JSON.parse(_td.decode(pt));
  if (!v || v.cek !== 'brankas-ok') throw new Error('cek-gagal');
  return v.entri || [];
}

export const meta = {"id": "brankas-sandi", "name": "Brankas Sandi", "cat": "keamanan", "icon": "🗝️", "desc": "Simpan password terenkripsi AES di HP ini.", "keywords": "brankas,password,sandi,manager,enkripsi,aes"};

export function render(root) {

    if (!window.crypto || !window.crypto.subtle) {
      root.appendChild(T.el('<div class="err" style="font-size:13px;line-height:1.6">⚠️ Browser/HP kamu tidak mendukung WebCrypto (butuh koneksi HTTPS). Tool ini tidak bisa dipakai di sini.</div>'));
      return;
    }

    const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
    const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } };

    let master = null; // HANYA di memori — tidak pernah ke localStorage

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Brankas password pribadi: semua entri dienkripsi AES-256 pakai master password-mu, tersimpan <b>lokal di browser HP ini saja</b>. Master password tidak disimpan di mana pun — kalau lupa, isi brankas hilang selamanya. Nggak ada tombol "lupa password".</p>'));

    function draw() {
      root.querySelectorAll('.brv').forEach((n) => n.remove());
      if (!lsGet(LS_KEY)) viewSetup();
      else if (!master) viewLocked();
      else viewOpen();
    }
    function box(el) { el.classList.add('brv'); root.appendChild(el); return el; }

    // ---- Belum ada brankas: set master password ----
    function viewSetup() {
      const b = T.el('<div></div>');
      const p1 = T.input('password', 'Master password baru…');
      const p2 = T.input('password', 'Ulangi master password…');
      p1.autocomplete = 'new-password'; p2.autocomplete = 'new-password';
      const msg = T.out();
      b.appendChild(T.el('<h3 class="h3">🗝️ Buat Brankas Baru</h3>'));
      b.appendChild(T.field('Master password', p1, 'Minimal 6 karakter. Ini satu-satunya kunci — catat baik-baik.'));
      b.appendChild(T.field('Konfirmasi', p2));
      b.appendChild(T.row(T.btn('Buat Brankas', () => {
        const a = p1.value, c = p2.value;
        if (a.length < 6) { T.show(msg, '<span class="err">Master password minimal 6 karakter ya.</span>'); return; }
        if (a !== c) { T.show(msg, '<span class="err">Konfirmasinya nggak sama — ketik ulang.</span>'); return; }
        T.show(msg, '<span class="dim">🔒 Mengenkripsi brankas…</span>');
        setTimeout(async () => {
          try {
            const paket = await vltEncrypt([], a);
            if (!lsSet(LS_KEY, paket)) { T.show(msg, '<span class="err">Gagal menyimpan — penyimpanan HP penuh atau tidak tersedia.</span>'); return; }
            master = a;
            draw();
            T.toast('Brankas jadi! Master password-nya dicatat ya.');
          } catch (e) { T.show(msg, '<span class="err">Gagal: ' + T.esc(e.message || e) + '</span>'); }
        }, 30);
      }, true)));
      b.appendChild(msg);
      box(b);
    }

    // ---- Brankas terkunci ----
    function viewLocked() {
      const b = T.el('<div></div>');
      const pw = T.input('password', 'Master password…');
      pw.autocomplete = 'current-password';
      const msg = T.out();
      const buka = () => {
        if (!pw.value) { T.show(msg, '<span class="err">Isi master password dulu.</span>'); return; }
        T.show(msg, '<span class="dim">🔓 Membuka brankas…</span>');
        setTimeout(async () => {
          try {
            await vltDecrypt(lsGet(LS_KEY), pw.value);
            master = pw.value;
            draw();
          } catch (e) {
            T.show(msg, '<span class="err">❌ Master password salah. Coba lagi pelan-pelan.</span>');
          }
        }, 30);
      };
      pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') buka(); });
      b.appendChild(T.el('<h3 class="h3">🔒 Brankas Terkunci</h3>'));
      b.appendChild(T.field('Master password', pw));
      b.appendChild(T.row(T.btn('Buka Brankas', buka, true)));
      b.appendChild(msg);
      box(b);
    }

    // ---- Brankas terbuka ----
    function viewOpen() {
      const b = T.el('<div></div>');
      const msg = T.out();

      async function simpan(entri) {
        const paket = await vltEncrypt(entri, master);
        if (!lsSet(LS_KEY, paket)) throw new Error('penyimpanan penuh');
      }
      async function muat() {
        return vltDecrypt(lsGet(LS_KEY), master);
      }

      b.appendChild(T.el('<h3 class="h3">📂 Isi Brankas</h3>'));
      const daftarBox = T.out();
      b.appendChild(daftarBox);

      function gambarDaftar(entri) {
        if (!entri.length) {
          T.show(daftarBox, '<p class="dim" style="font-size:13px">Brankas masih kosong. Tambah entri pertamamu di bawah 👇</p>');
          return;
        }
        const w = T.el('<div style="display:grid;gap:8px"></div>');
        entri.forEach((e, i) => {
          const baris = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px"></div>');
          const pwSpan = T.el('<span style="font-family:ui-monospace,monospace">••••••••</span>');
          let kelihatan = false;
          baris.appendChild(T.el('<b style="font-size:14px">' + T.esc(e.s || '(tanpa nama)') + '</b>'));
          baris.appendChild(T.el('<div class="dim" style="font-size:12.5px;margin:2px 0">👤 ' + T.esc(e.u || '-') + ' &nbsp;·&nbsp; 🔑 </div>'));
          baris.lastElementChild.appendChild(pwSpan);
          const bLihat = T.btn('👁️', null, false);
          bLihat.classList.add('small');
          bLihat.addEventListener('click', () => {
            kelihatan = !kelihatan;
            pwSpan.textContent = kelihatan ? e.p : '••••••••';
            bLihat.textContent = kelihatan ? '🙈' : '👁️';
          });
          const bSalin = T.copyBtn(() => e.p, 'Salin');
          bSalin.classList.add('small');
          const bHapus = T.btn('Hapus', null, false);
          bHapus.classList.add('small');
          let persenjatai = false, timer = null;
          bHapus.addEventListener('click', async () => {
            if (!persenjatai) {
              persenjatai = true;
              bHapus.textContent = 'Yakin? Tap lagi';
              timer = setTimeout(() => { persenjatai = false; bHapus.textContent = 'Hapus'; }, 3000);
              return;
            }
            clearTimeout(timer);
            try {
              const data = await muat();
              data.splice(i, 1);
              await simpan(data);
              gambarDaftar(data);
              T.toast('Entri dihapus.');
            } catch (err) { T.show(msg, '<span class="err">Gagal menghapus: ' + T.esc(err.message || err) + '</span>'); }
          });
          baris.appendChild(T.row(bLihat, bSalin, bHapus));
          w.appendChild(baris);
        });
        T.show(daftarBox, '');
        daftarBox.appendChild(w);
      }

      (async () => {
        try { gambarDaftar(await muat()); }
        catch (e) { T.show(daftarBox, '<span class="err">Gagal membuka data brankas.</span>'); }
      })();

      // ---- Tambah entri ----
      b.appendChild(T.el('<hr class="divi">'));
      b.appendChild(T.el('<h3 class="h3">➕ Tambah Entri</h3>'));
      const inS = T.input('text', 'Nama situs/aplikasi, mis. Gmail');
      const inU = T.input('text', 'Username / email');
      const inP = T.input('password', 'Password-nya');
      inP.autocomplete = 'new-password';
      b.appendChild(T.field('Situs / aplikasi', inS));
      b.appendChild(T.field('Username', inU));
      b.appendChild(T.field('Password', inP));
      b.appendChild(T.row(T.btn('💾 Simpan Entri', async () => {
        const s = inS.value.trim(), u = inU.value.trim(), p = inP.value;
        if (!s) { T.show(msg, '<span class="err">Kasih nama situsnya dulu.</span>'); return; }
        if (!p) { T.show(msg, '<span class="err">Password-nya jangan kosong dong.</span>'); return; }
        try {
          const data = await muat();
          data.push({ s, u, p });
          await simpan(data);
          inS.value = ''; inU.value = ''; inP.value = '';
          gambarDaftar(data);
          T.toast('Entri tersimpan & terenkripsi.');
        } catch (e) { T.show(msg, '<span class="err">Gagal menyimpan: ' + T.esc(e.message || e) + '</span>'); }
      }, true)));
      b.appendChild(msg);

      // ---- Ganti master password ----
      b.appendChild(T.el('<hr class="divi">'));
      b.appendChild(T.el('<h3 class="h3">🔑 Ganti Master Password</h3>'));
      const n1 = T.input('password', 'Master password baru…');
      const n2 = T.input('password', 'Ulangi yang baru…');
      n1.autocomplete = 'new-password'; n2.autocomplete = 'new-password';
      const msg2 = T.out();
      b.appendChild(T.field('Baru', n1, 'Minimal 6 karakter.'));
      b.appendChild(T.field('Konfirmasi baru', n2));
      b.appendChild(T.row(T.btn('Ganti & Enkripsi Ulang', async () => {
        const a = n1.value, c = n2.value;
        if (a.length < 6) { T.show(msg2, '<span class="err">Minimal 6 karakter.</span>'); return; }
        if (a !== c) { T.show(msg2, '<span class="err">Konfirmasinya nggak sama.</span>'); return; }
        try {
          const data = await muat();
          const paket = await vltEncrypt(data, a);
          if (!lsSet(LS_KEY, paket)) { T.show(msg2, '<span class="err">Gagal menyimpan.</span>'); return; }
          master = a;
          n1.value = ''; n2.value = '';
          T.show(msg2, '<span class="ok">✅ Master password diganti, brankas di-enkripsi ulang.</span>');
        } catch (e) { T.show(msg2, '<span class="err">Gagal: ' + T.esc(e.message || e) + '</span>'); }
      })));
      b.appendChild(msg2);

      // ---- Kunci ----
      b.appendChild(T.el('<hr class="divi">'));
      b.appendChild(T.row(T.btn('🔒 Kunci Brankas', () => {
        master = null;
        draw();
        T.toast('Brankas dikunci.');
      })));
      box(b);
    }

    draw();
}
