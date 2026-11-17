import { h as T, esc, utils } from '../../core.js';

export const meta = {"id":"apod-harian","name":"Foto Antariksa Harian","cat":"liveapi","icon":"🪐","desc":"Foto astronomi harian resmi dari NASA (APOD).","keywords":"nasa,apod,antariksa,astronomi,foto,planet,luar angkasa"};

const API_BASE = 'https://api.nasa.gov/planetary/apod?api_key=';

// Foto terakhir yang berhasil dimuat disimpan di browser ini, supaya tool
// tetap menampilkan sesuatu saat API NASA sedang menolak (429/500) / mati.
const KEY = 'apod-harian-last';
const loadLast = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const saveLast = (d) => { try { localStorage.setItem(KEY, JSON.stringify({ date: d.date, title: d.title, url: d.url, media_type: d.media_type, explanation: d.explanation, copyright: d.copyright })); } catch (e) {} };
// Hanya http/https yang boleh jadi sumber media — skema lain (javascript:,
// data:, file:) tidak pernah masuk ke src iframe/img, baik dari API maupun
// dari cache. Mengembalikan URL yang sudah dinormalisasi, atau null.
const urlMediaAman = (u) => {
  if (typeof u !== 'string') return null;
  try {
    const p = new URL(u.trim());
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch (e) { return null; }
};

export function render(root) {
  // API key NASA milik user — OPSIONAL. Tanpa key, tool memakai DEMO_KEY
  // bersama (batas 30 req/jam, 50/hari per IP, dipakai semua orang).
  const kf = utils.byok.field({
    tool: 'apod-harian',
    label: 'API key NASA (opsional)',
    placeholder: 'API key NASA milikmu (opsional)',
    hint: 'Gratis di api.nasa.gov — key disimpan hanya di browser ini. Tanpa key, tool memakai key demo bersama (batas 30x/jam, 50x/hari).',
    docUrl: 'https://api.nasa.gov',
    docLabel: 'Dapatkan API key NASA gratis',
  });
  // byok.field menganggap key wajib; di tool ini key opsional, jadi timpa
  // teks statusnya. Listener dipasang setelah listener internal, jadi jalan
  // belakangan dan menang (input mengetik & klik tombol simpan/hapus).
  const paintStatus = () => {
    const st = kf.box.querySelector('.dim');
    if (!st) return;
    st.innerHTML = kf.get()
      ? '✅ <b>Key NASA milikmu tersimpan</b> — hanya di browser ini. Batas pemakaian mengikuti key milikmu sendiri.'
      : '🔑 <b>Opsional.</b> Tanpa key, tool memakai key demo bersama (batas 30x/jam, 50x/hari). Isi key NASA gratis milikmu supaya tidak rebutan dengan pengguna lain.';
  };
  kf.box.addEventListener('input', paintStatus);
  kf.box.addEventListener('click', paintStatus);
  paintStatus();
  const box = T.out();

  const tampil = (d, dariCache) => {
    const url = urlMediaAman(d.url);
    let media;
    if (!url) {
      // Alamat media tidak valid / skemanya tidak diizinkan — jangan render
      // media sama sekali, tampilkan pesan ramah saja.
      media = '<p class="err">Media foto ini tidak bisa ditampilkan — alamat medianya tidak valid.</p>';
    } else if (d.media_type === 'video') {
      media = '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px">' +
        '<iframe src="' + esc(url) + '" title="APOD video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>';
    } else {
      media = '<img src="' + esc(url) + '" alt="' + esc(d.title || 'APOD') + '" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">';
    }
    const tgl = d.date ? esc(d.date) : '';
    let html = '<div class="center"><div style="font-weight:700;font-size:16px;margin-bottom:2px">' + esc(d.title || 'Tanpa judul') + '</div>' +
      '<div class="dim" style="margin-bottom:10px">' + tgl + (d.copyright ? ' · © ' + esc(d.copyright) : '') + '</div></div>' +
      media;
    if (d.explanation) {
      const exp = esc(d.explanation);
      html += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;color:#c9bda9">📖 Penjelasan (Inggris)</summary>' +
        '<div style="margin-top:8px;font-size:13px;line-height:1.6">' + exp + '</div></details>';
    }
    if (dariCache) html += '<div class="hint" style="margin-top:10px">📦 Ini foto terakhir yang tersimpan di browser ini — NASA sedang tidak bisa dihubungi, jadi fotonya belum tentu yang hari ini.</div>';
    T.show(box, html);
    T.wireImgErr(box);
  };

  const muat = async (retries) => {
    T.show(box, '<div class="dim center">Menghubungi NASA…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch(API_BASE + encodeURIComponent(kf.get() || 'DEMO_KEY'), { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (status === 500 && retries > 0) {
        // API NASA flaky — coba sekali lagi
        return muat(retries - 1);
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server NASA.');
      const d = await res.json();
      if (!d || !d.url) throw new Error('Respons NASA tidak lengkap (url kosong).');
      saveLast(d);
      tampil(d, false);
    } catch (e) {
      clearTimeout(timer);
      // Fallback: foto terakhir yang tersimpan, kalau ada.
      const last = loadLast();
      if (last && last.url) {
        tampil(last, true);
        const wrap = T.el('<div style="margin-top:8px"></div>');
        wrap.appendChild(T.btn('🔄 Coba lagi', () => muat(1)));
        box.appendChild(wrap);
        return;
      }
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu habis — NASA tidak merespons. Koneksi mungkin lambat, coba lagi.';
      else if (status === 429) msg = kf.get()
        ? 'Batas key NASA milikmu tercapai (kode 429). Tunggu sebentar lalu coba lagi.'
        : 'Batas demo tercapai (kode 429). Key demo dipakai bersama (batas 30x/jam, 50x/hari) — tunggu sebentar lalu coba lagi, atau isi key NASA gratis milikmu di kolom atas supaya tidak rebutan.';
      else if (status === 500) msg = 'NASA sedang bermasalah (kode 500). Tunggu beberapa menit lalu coba lagi.';
      else if (status === 403) msg = 'NASA menolak permintaan ini (kode 403). Coba lagi nanti.';
      else msg = 'Gagal memuat foto. NASA kadang sedang bermasalah — tunggu sebentar lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', () => muat(1)));
      box.appendChild(wrap);
    }
  };
  root.appendChild(kf.box);
  root.appendChild(T.row(T.btn('🔄 Muat ulang', () => muat(1), true)));
  root.appendChild(box);
  muat(1);
}
