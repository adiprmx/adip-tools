import { h as T, utils } from '../../core.js';

/* Enkripsi AES-GCM via WebCrypto. Diekspor agar bisa diuji round-trip di luar browser. */
const _te = new TextEncoder(), _td = new TextDecoder();
const LS_PREFIX = 'locknote.';
// Iterasi PBKDF2-HMAC-SHA256: 600.000 = batas minimum panduan OWASP
// Password Storage Cheat Sheet (terverifikasi 20 Nov 2026 dari
// cheatsheetseries.owasp.org). Catatan lama yang dibuat saat iterasi
// masih 100.000 tetap bisa dibuka: paketnya tidak menyimpan jumlah
// iterasi, jadi lockDecrypt memakai ITERASI_LAMA untuk paket lama.
const ITERASI = 600000;
const ITERASI_LAMA = 100000;

// ID acak 16 karakter hex untuk key localStorage. Judul TIDAK BOLEH jadi
// key: judul plaintext ("PIN ATM") bocor ke siapa pun yang bisa membaca
// penyimpanan perangkat. Judul hanya ada di dalam payload terenkripsi.
function idBaru() {
  return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// b64e, b64d kanonis tinggal di utils (core.js).
async function kunciDariPassword(password, salt, iterasi) {
  const km = await crypto.subtle.importKey('raw', _te.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iterasi, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function lockEncrypt(judul, isi, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await kunciDariPassword(password, salt, ITERASI);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, _te.encode(JSON.stringify({ judul, isi })));
  // `dibuat` (stempel waktu simpan) sengaja plaintext & tidak sensitif:
  // dipakai sebagai label daftar karena judulnya terkunci di dalam data.
  return JSON.stringify({ v: 2, iter: ITERASI, dibuat: Date.now(), salt: utils.b64e(salt), iv: utils.b64e(iv), data: utils.b64e(data) });
}
export async function lockDecrypt(paket, password) {
  const o = JSON.parse(paket);
  const key = await kunciDariPassword(password, utils.b64d(o.salt), o.iter || ITERASI_LAMA);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: utils.b64d(o.iv) }, key, utils.b64d(o.data));
  return JSON.parse(_td.decode(pt));
}

export const meta = {"id": "catatan-terkunci", "name": "Catatan Terkunci", "cat": "keamanan", "icon": "🔐", "desc": "Catatan terenkripsi AES dengan password.", "keywords": "catatan,enkripsi,aes,password,rahasia"};
export function render(root) {

    // lsGet, lsSet, lsDel kanonis tinggal di utils (core.js).
    // Daftar catatan: [{id, dibuat}]. Paket lama (v1, key-nya judul
    // plaintext) otomatis dipindah ke key ID acak saat daftar dibaca —
    // isinya tidak disentuh (tetap terenkripsi, tanpa butuh password),
    // judul plaintext-nya hilang dari penyimpanan.
    const lsDaftar = () => {
      const r = [];
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf(LS_PREFIX) === 0) keys.push(k);
        }
        for (const k of keys) {
          let id = k.slice(LS_PREFIX.length);
          const paket = utils.lsGet(k);
          let dibuat = null, lama = false;
          try {
            const o = JSON.parse(paket || '');
            dibuat = typeof o.dibuat === 'number' ? o.dibuat : null;
            lama = o.v !== 2;
          } catch (e) { lama = false; }
          if (lama) {
            const baru = idBaru();
            if (utils.lsSet(LS_PREFIX + baru, paket)) { utils.lsDel(k); id = baru; }
          }
          r.push({ id, dibuat });
        }
      } catch (e) { /* abaikan */ }
      return r.sort((a, b) => (b.dibuat || 0) - (a.dibuat || 0));
    };
    const keyOf = (id) => LS_PREFIX + id;
    const labelCatatan = (dibuat) => {
      if (!dibuat) return 'Catatan lama';
      try { return 'Catatan • ' + new Date(dibuat).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch (e) { return 'Catatan'; }
    };

    if (!window.crypto || !window.crypto.subtle) {
      root.appendChild(T.el('<div class="err" style="font-size:13px;line-height:1.6">⚠️ Browser/HP kamu tidak mendukung enkripsi di sini (butuh koneksi aman). Tool ini tidak bisa dipakai di sini.</div>'));
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
      bShow.setAttribute('aria-label', pwInp.type === 'password' ? 'Lihat sandi' : 'Sembunyikan sandi');
    });
    bShow.setAttribute('aria-label', 'Lihat sandi');
    bShow.classList.add('small');
    const msg = T.out();

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Catatan rahasia yang dikunci pakai password — dienkripsi AES-256 langsung di HP kamu. Judulnya ikut terkunci, jadi daftar di bawah hanya menampilkan tanggal simpan. ⚠️ <b>Password-nya jangan sampai lupa:</b> kalau hilang, catatannya nggak bisa dibuka selamanya. Nggak ada tombol "lupa password" di sini.</p>'));
    root.appendChild(T.field('Judul', jdlInp));
    root.appendChild(T.field('Isi catatan', isiInp));
    root.appendChild(T.field('Password', T.row(pwInp, bShow), 'Minimal 8 karakter. Makin panjang & acak, makin aman.'));
    root.appendChild(T.row(T.btn('🔐 Kunci & Simpan', () => {
      const judul = jdlInp.value.trim(), isi = isiInp.value, pw = pwInp.value;
      if (!judul) { T.show(msg, '<span class="err">Kasih judul dulu biar gampang dicari nanti.</span>'); return; }
      if (!isi.trim()) { T.show(msg, '<span class="err">Isi catatannya masih kosong.</span>'); return; }
      if (pw.length < 8) { T.show(msg, '<span class="err">Password minimal 8 karakter ya.</span>'); return; }
      T.show(msg, '<span class="dim">🔒 Mengenkripsi…</span>');
      setTimeout(async () => {
        try {
          const paket = await lockEncrypt(judul, isi, pw);
          if (!utils.lsSet(keyOf(idBaru()), paket)) { T.show(msg, '<span class="err">Gagal menyimpan — penyimpanan HP penuh atau tidak tersedia.</span>'); return; }
          jdlInp.value = ''; isiInp.value = ''; pwInp.value = '';
          T.show(msg, '<span class="ok">✅ Catatan terkunci & tersimpan. Password-nya dicatat baik-baik ya!</span>');
          gambarDaftar();
        } catch (e) { T.show(msg, '<span class="err">Catatan tidak bisa dikunci. Coba lagi.</span>'); }
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
      const daftar = lsDaftar();
      if (!daftar.length) { T.show(daftarBox, '<p class="dim" style="font-size:13px">Belum ada catatan tersimpan. Tulis yang pertama di atas 👆</p>'); return; }
      let html = '<div style="display:grid;gap:8px">';
      daftar.forEach((c) => {
        html += '<div class="row" style="justify-content:space-between;align-items:center;border:1px solid #ffffff20;border-radius:10px;padding:10px 12px">' +
          '<b style="font-size:14px">🔐 ' + T.esc(labelCatatan(c.dibuat)) + '</b>' +
          '<div class="row"><button type="button" class="btn small" data-buka="' + T.esc(c.id) + '" data-label="' + T.esc(labelCatatan(c.dibuat)) + '">Buka</button>' +
          '<button type="button" class="btn small" data-hapus="' + T.esc(c.id) + '">Hapus</button></div></div>';
      });
      html += '</div>';
      T.show(daftarBox, html);
      daftarBox.querySelectorAll('[data-buka]').forEach((b) => b.addEventListener('click', () => formBuka(b.dataset.buka, b.dataset.label)));
      daftarBox.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.armed) { utils.lsDel(keyOf(b.dataset.hapus)); T.toast('Catatan dihapus'); gambarDaftar(); return; }
        b.dataset.armed = '1';
        b.textContent = 'Yakin hapus?';
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Hapus'; } }, 3000);
      }));
    }

    function formBuka(id, label) {
      const pwBuka = T.input('password', 'Password catatan ini…');
      const hasil = T.out();
      const tombol = T.btn('🔓 Buka Catatan', () => {
        if (!pwBuka.value) { T.show(hasil, '<span class="err">Isi passwordnya dulu.</span>'); return; }
        T.show(hasil, '<span class="dim">Membuka…</span>');
        setTimeout(async () => {
          const paket = utils.lsGet(keyOf(id));
          if (!paket) { T.show(hasil, '<span class="err">Catatannya sudah tidak ada.</span>'); return; }
          try {
            const n = await lockDecrypt(paket, pwBuka.value);
            T.show(hasil, '<div style="margin-top:8px"><b>📝 ' + T.esc(n.judul) + '</b></div>' +
              '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;margin-top:6px">' + T.esc(n.isi) + '</pre>');
          } catch (e) {
            T.show(hasil, '<span class="err">🔑 Password salah atau catatannya rusak. Coba lagi — kalau passwordnya benar tapi tetap gagal, catatannya sudah tidak bisa dibuka.</span>');
          }
        }, 30);
      }, true);
      T.show(bukaBox, '');
      bukaBox.appendChild(T.el('<div style="margin-top:4px"><b>Membuka: ' + T.esc(label) + '</b></div>'));
      bukaBox.appendChild(T.field('Password', pwBuka));
      bukaBox.appendChild(T.row(tombol));
      bukaBox.appendChild(hasil);
    }

    gambarDaftar();

}
