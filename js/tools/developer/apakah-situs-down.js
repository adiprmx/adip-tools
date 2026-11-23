import { h as T, utils, errBox } from '../../core.js';

// Normalisasi input jadi URL http(s) penuh. Kembalikan {url} atau {error}.
export function normalizeUrl(input) {
  let s = String(input || '').trim();
  if (!s) return { error: 'Isi dulu alamat situsnya.' };
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { return { error: 'Alamatnya tidak bisa dibaca. Contoh yang benar: google.com atau https://contoh.id.' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: 'Hanya alamat http dan https yang bisa dicek.' };
  return { url: u.toString() };
}

// Probe jujur: fetch no-cors hanya membedakan "server merespons" vs
// "gagal jaringan". Status HTTP (404, 500, dst.) TIDAK bisa dilihat
// dari browser karena aturan keamanan lintas situs. Bila fetch gagal,
// dicoba memuat gambar favicon sebagai cek kedua (img-src mengizinkan
// https: mana pun, jadi cek ini tetap jalan saat fetch diblokir kebijakan
// keamanan situs). Probe ini TIDAK BISA di-proxy: tujuannya menguji
// keterjangkauan dari koneksi pengguna sendiri.
// Bila fetch diblokir kebijakan keamanan situs DAN cek gambar gagal,
// hasilnya 'tidak-pasti' — jangan vonis "down", itu false-negative.
// opts: { fetchFn, ImageCtor, timeoutMs } (bisa di-inject untuk tes).
export async function probeSite(url, opts) {
  const o = opts || {};
  const fetchFn = o.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  const ImageCtor = o.ImageCtor || (typeof Image !== 'undefined' ? Image : null);
  const timeoutMs = o.timeoutMs || 10000;
  const mulai = Date.now();
  const ms = () => Date.now() - mulai;
  const w = utils.cspWatch();
  const selesai = (r) => { w.stop(); return r; };

  if (fetchFn) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        await fetchFn(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
        return selesai({ status: 'up', method: 'fetch', ms: ms() });
      } finally { clearTimeout(timer); }
    } catch (e) { /* lanjut ke probe gambar */ }
  }
  if (ImageCtor) {
    const imgOk = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const timer = setTimeout(() => finish(false), Math.min(timeoutMs, 8000));
      try {
        const img = new ImageCtor();
        img.onload = () => { clearTimeout(timer); finish(true); };
        img.onerror = () => { clearTimeout(timer); finish(false); };
        img.src = url.replace(/\/?$/, '/') + 'favicon.ico?cek=' + Date.now();
      } catch (e) { clearTimeout(timer); finish(false); }
    });
    if (imgOk) return selesai({ status: 'up', method: 'gambar', ms: ms() });
  }
  // Beri jeda agar event securitypolicyviolation sempat datang.
  await new Promise((r) => setTimeout(r, 100));
  if (w.blocked()) return selesai({ status: 'tidak-pasti', method: 'csp', ms: ms() });
  return selesai({ status: 'down', method: null, ms: ms() });
}

export const meta = {"id": "apakah-situs-down", "name": "Apakah Situs Down?", "cat": "developer", "icon": "📶", "desc": "Cek apakah sebuah situs merespons atau tidak dari koneksimu.", "keywords": "down,offline,situs,website,cek,up,error,koneksi", "since": "6.18.0", "online": true};
export function render(root) {

    const inp = T.input('text', 'cth: google.com atau https://contoh.id', '');
    inp.autocapitalize = 'off'; inp.spellcheck = false;
    const box = T.out();
    let sedang = false;

    const cek = async () => {
      if (sedang) return;
      const n = normalizeUrl(inp.value);
      if (n.error) { T.show(box, errBox(n.error)); return; }
      sedang = true;
      T.show(box, '<span class="dim">Menghubungi ' + T.esc(n.url) + '…</span>');
      const r = await probeSite(n.url, { timeoutMs: 10000 });
      sedang = false;
      if (r.status === 'up') {
        T.show(box,
          '<div style="font-size:16px;margin-bottom:6px"><span class="ok">✓ Situs merespons.</span></div>' +
          '<div class="kv"><span class="k">Alamat dicek</span><span class="v" style="word-break:break-all">' + T.esc(n.url) + '</span></div>' +
          '<div class="kv"><span class="k">Waktu respons</span><span class="v">' + r.ms + ' ms</span></div>' +
          '<div class="hint" style="margin-top:8px">Artinya server situs itu terjangkau dari koneksimu saat ini. Cek ini tidak bisa melihat kode statusnya, jadi situs yang menampilkan halaman error tetap terbaca merespons.</div>');
      } else if (r.status === 'tidak-pasti') {
        T.show(box,
          '<div style="font-size:16px;margin-bottom:6px"><span style="color:#facc15">Tidak bisa dipastikan.</span></div>' +
          '<div class="kv"><span class="k">Alamat dicek</span><span class="v" style="word-break:break-all">' + T.esc(n.url) + '</span></div>' +
          '<div class="kv"><span class="k">Waktu tunggu</span><span class="v">' + r.ms + ' ms</span></div>' +
          '<div class="hint" style="margin-top:8px">Cek langsung ke situs ini tidak bisa jalan karena kebijakan keamanan situs ini, dan cek cadangannya juga tidak memberi jawaban. Ini bukan berarti situsnya mati — coba buka langsung situsnya di browser.</div>');
      } else {
        T.show(box,
          '<div style="font-size:16px;margin-bottom:6px"><span class="err">✗ Situs tidak bisa dihubungi.</span></div>' +
          '<div class="kv"><span class="k">Alamat dicek</span><span class="v" style="word-break:break-all">' + T.esc(n.url) + '</span></div>' +
          '<div class="kv"><span class="k">Waktu tunggu</span><span class="v">' + r.ms + ' ms</span></div>' +
          '<div class="hint" style="margin-top:8px">Bisa jadi situsnya sedang mati, bisa juga koneksimu yang bermasalah, atau situsnya memblokir cek dari browser. Coba buka situs lain dulu: kalau situs lain bisa dibuka, kemungkinan besar situs ini yang bermasalah.</div>');
      }
      box.appendChild(T.row(T.btn('Cek lagi', cek)));
    };

    root.appendChild(T.field('Alamat situs', inp));
    root.appendChild(T.row(T.btn('Cek sekarang', cek, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Batas cek ini: browser tidak mengizinkan halaman ini membaca jawaban situs lain, jadi hasilnya hanya "bisa dihubungi" atau "tidak bisa dihubungi". Halaman error seperti 404 atau 500 tetap terhitung bisa dihubungi.</div>'));

}
