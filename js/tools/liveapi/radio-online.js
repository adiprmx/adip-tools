import { h as T, esc, errBox, onLeave } from '../../core.js';

export const meta = {"id":"radio-online","name":"Radio Online","cat":"liveapi","icon":"📻","desc":"Dengarkan stasiun radio Indonesia dan dunia, langsung dari browser.","keywords":"radio,online,streaming,musik,fm,stasiun","since":"6.16.0", "online": true};

const API = 'https://de1.api.radio-browser.info/json';

export function render(root) {
  const box = T.out();
  const daftarBox = T.out();
  const inp = T.input('text', 'Cari stasiun, contoh: Prambors, RRI, BBC');
  inp.setAttribute('autocomplete', 'off');
  let audio = null;

  const hentikan = () => {
    if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
  };
  onLeave(hentikan);

  const putar = (st) => {
    hentikan();
    const src = st.url_resolved || st.url;
    if (!src || String(src).indexOf('https://') !== 0) {
      T.show(box, '<p class="center dim">Stasiun ini tidak bisa diputar karena alamat siarannya tidak aman. Coba stasiun lain.</p>');
      return;
    }
    audio = new Audio(src);
    audio.preload = 'none';
    T.show(box,
      '<div style="border:1px solid #ff6f61;border-radius:10px;padding:12px">' +
      '<div style="font-weight:800;font-size:16px">' + esc(st.name || 'Stasiun radio') + '</div>' +
      '<div class="dim" style="font-size:12.5px;margin:2px 0 8px">' + esc([st.country, st.tags ? String(st.tags).split(',').slice(0, 3).join(', ') : ''].filter(Boolean).join(' · ') || 'Radio online') + '</div>' +
      '<div id="pemutar-radio"></div>' +
      '<div id="radio-gagal" class="err" style="display:none;font-size:12.5px;margin-top:6px">Stasiun ini tidak bisa diputar sekarang. Coba stasiun lain.</div>' +
      '<div class="dim" style="font-size:12px;margin-top:6px">Kalau tidak ada suara dalam beberapa detik, stasiun itu mungkin sedang tidak siaran. Coba stasiun lain.</div></div>');
    const wadah = box.querySelector('#pemutar-radio');
    audio.controls = true;
    audio.style.width = '100%';
    wadah.appendChild(audio);
    audio.addEventListener('error', () => {
      const note = box.querySelector('#radio-gagal');
      if (note) note.style.display = '';
    }, { once: true });
    const janji = audio.play();
    if (janji && janji.catch) janji.catch(() => {});
  };

  const tampilDaftar = (list) => {
    const layak = list.filter((s) => s && s.url_resolved && String(s.url_resolved).indexOf('https://') === 0);
    if (!layak.length) {
      T.show(daftarBox, '<p class="center dim">Tidak ada stasiun yang bisa diputar untuk pencarian ini.</p><p class="hint center">Coba nama lain. Hanya stasiun dengan siaran aman (https) yang ditampilkan supaya bisa diputar di browser.</p>');
      return;
    }
    let html = '<p class="hint">Ketuk stasiun untuk mendengarkan.</p>';
    layak.forEach((s) => {
      html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">' +
        (s.favicon ? '<img src="' + esc(s.favicon) + '" alt="" loading="lazy" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex:none" data-err="hide">' : '') +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;line-height:1.3">' + esc(s.name || 'Tanpa nama') + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc([s.country, s.codec ? String(s.codec).toUpperCase() : '', s.bitrate ? s.bitrate + ' kbps' : ''].filter(Boolean).join(' · ') || 'Radio') + '</div></div>' +
        '<button type="button" class="btn primary" data-stasiun="' + esc(s.stationuuid) + '">▶️ Putar</button></div>';
    });
    T.show(daftarBox, html);
    T.wireImgErr(daftarBox);
    daftarBox.querySelectorAll('[data-stasiun]').forEach((b) => {
      b.addEventListener('click', () => {
        const st = layak.find((x) => x.stationuuid === b.getAttribute('data-stasiun'));
        if (st) putar(st);
      });
    });
  };

  const ambil = async (url, pesanKosong) => {
    T.show(daftarBox, '<p class="mut">Mengambil daftar stasiun…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) {
        T.show(daftarBox, '<p class="center dim">' + esc(pesanKosong) + '</p>');
        return;
      }
      tampilDaftar(j);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server direktori radio tidak bisa dihubungi dalam 20 detik.'
        : 'Gagal ambil daftar stasiun. Cek koneksi internet, lalu coba lagi.';
      T.show(daftarBox, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', () => ambil(url, pesanKosong)));
      daftarBox.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  const cari = () => {
    const q = inp.value.trim();
    if (!q) { muatPopuler(); return; }
    ambil(API + '/stations/search?name=' + encodeURIComponent(q) + '&limit=12&order=votes&reverse=true&hidebroken=true', 'Tidak ada stasiun bernama "' + q + '". Coba kata lain.');
  };

  const muatPopuler = () => {
    ambil(API + '/stations/search?country=Indonesia&limit=12&order=votes&reverse=true&hidebroken=true', 'Belum ada stasiun Indonesia yang tersedia saat ini.');
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.field('Cari stasiun radio', inp, 'Kosongkan lalu tekan cari untuk melihat radio Indonesia terpopuler.'));
  root.appendChild(T.row(T.btn('🔍 Cari', cari, true)));
  root.appendChild(box);
  root.appendChild(daftarBox);
  muatPopuler();
}
