import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"apod-harian","name":"Foto Antariksa Harian","cat":"liveapi","icon":"🪐","desc":"Foto astronomi harian resmi dari NASA (APOD).","keywords":"nasa,apod,antariksa,astronomi,foto,planet,luar angkasa"};

const API = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';

export function render(root) {
  const notice = T.el('<div class="hint" style="margin-bottom:10px">🛰️ Pakai API key demo publik (batas 30 req/jam per IP). Gagal? Coba lagi.</div>');
  const box = T.out();
  const muat = async (retries) => {
    T.show(box, '<div class="dim center">Menghubungi NASA…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch(API, { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (status === 500 && retries > 0) {
        // API NASA flaky — coba sekali lagi
        return muat(retries - 1);
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server NASA.');
      const d = await res.json();
      if (!d || !d.url) throw new Error('Respons NASA tidak lengkap (url kosong).');
      let media;
      if (d.media_type === 'video') {
        media = '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px">' +
          '<iframe src="' + esc(d.url) + '" title="APOD video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>';
      } else {
        media = '<img src="' + esc(d.url) + '" alt="' + esc(d.title || 'APOD') + '" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" onerror="this.style.display=\'none\'">';
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
      T.show(box, html);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server NASA tidak merespons.';
      else if (status === 429) msg = 'Batas demo tercapai (429). Key demo publik dibatasi 30 request/jam per IP — tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal memuat APOD. API NASA kadang sedang down — tunggu sebentar lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', () => muat(1)));
      box.appendChild(wrap);
    }
  };
  root.appendChild(notice);
  root.appendChild(T.row(T.btn('🔄 Muat ulang', () => muat(1), true)));
  root.appendChild(box);
  muat(1);
}
