import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"pokemon-viewer","name":"Pokemon Viewer","cat":"liveapi","icon":"⚡","desc":"Lihat sprite, tipe, dan kemampuan Pokemon dari PokeAPI.","keywords":"pokemon,pokeapi,sprite,pikachu,tipe,kemampuan,game"};

const cap = (s) => String(s || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function render(root) {
  const inp = T.input('text', 'Nama atau ID, cth: pikachu / 25', '');
  const box = T.out();

  const getJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const lihat = async () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) { T.show(box, '<span class="err">Isi nama atau ID Pokemon dulu.</span>'); return; }
    T.show(box, '<div class="dim center">Mencari Pokemon "' + esc(q) + '"…</div>');
    try {
      const d = await getJson('https://pokeapi.co/api/v2/pokemon/' + encodeURIComponent(q));
      const sp = d.sprites || {};
      const art = sp.other && sp.other['official-artwork'] && sp.other['official-artwork'].front_default;
      const imgUrl = art || sp.front_default || '';
      let html = '<div class="center" style="margin-bottom:12px">';
      if (imgUrl) {
        html += '<img src="' + esc(imgUrl) + '" alt="' + esc(d.name || 'pokemon') + '" loading="lazy" style="width:160px;height:160px;object-fit:contain">';
      }
      html += '<div style="font-size:20px;font-weight:700;margin-top:8px">' + esc(cap(d.name)) + '</div>' +
        '<div class="dim">#' + esc(String(d.id)) + '</div></div>';
      [
        ['⚔️ Tipe', (d.types || []).map((t) => cap(t.type && t.type.name)).filter(Boolean).join(', ') || '-'],
        ['📏 Tinggi', d.height != null ? (d.height / 10).toLocaleString('id-ID') + ' m' : '-'],
        ['⚖️ Berat', d.weight != null ? (d.weight / 100).toLocaleString('id-ID') + ' kg' : '-'],
        ['✨ Kemampuan', (d.abilities || []).map((a) => cap(a.ability && a.ability.name)).filter(Boolean).join(', ') || '-'],
      ].forEach((r) => {
        html += '<div class="kv"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
      });
      html += '<div class="hint">Data dari PokeAPI (pokeapi.co).</div>';
      T.show(box, html);
    } catch (e) {
      let msg;
      if (e && e.name === 'AbortError') msg = 'Waktu habis — PokeAPI tidak merespons dalam 15 detik. Periksa koneksi internet lalu coba lagi.';
      else if (e && e.status === 404) msg = 'Pokemon "' + q + '" tidak ditemukan. Cek ejaan atau coba ID angka (1–1025).';
      else msg = 'Gagal memuat data Pokemon. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', lihat));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.field('Nama / ID Pokemon', inp));
  root.appendChild(T.row(T.btn('🔍 Lihat', lihat, true)));
  root.appendChild(box);
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') lihat(); });
}
