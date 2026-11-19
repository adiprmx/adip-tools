import { h as T, esc, errBox } from '../../core.js';

// Info tim bisbol MLB lewat MLB Stats API, tanpa key.
// Terverifikasi 19 Nov 2026: /api/v1/teams/119 -> 200, CORS *.
// Daftar 30 tim diambil sekali dari /api/v1/teams?sportId=1 (host dan pola
// sama, terverifikasi saat dibangun); detail tim sudah ada di daftar itu,
// jadi tidak ada panggilan kedua.
export const meta = {"id":"data-bisbol-mlb","name":"Data Bisbol MLB","cat":"liveapi","icon":"⚾","desc":"Lihat daftar 30 tim bisbol MLB beserta stadion, kota, dan liganya.","keywords":"bisbol,mlb,baseball,tim,olahraga,amerika,stadion","since":"6.19.0"};

const API = 'https://statsapi.mlb.com/api/v1/teams?sportId=1';

// Pola yang sama dengan tool live-API lain (info-tim-olahraga dkk.):
// URL dari API hanya dipakai bila skemanya http(s) — javascript:/data:
// dari respons API yang terkompromi tidak boleh sampai ke href (RED-05).
const teksAman = (u) => typeof u === 'string' && (u.indexOf('https://') === 0 || u.indexOf('http://') === 0);

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Cari tim, contoh: Yankees, Dodgers, Cubs');
  inp.setAttribute('autocomplete', 'off');
  const daftarBox = T.out();
  let teams = null;

  const tampilDetail = (t) => {
    const venue = t.venue || {};
    const liga = t.league || {};
    const divisi = t.division || {};
    T.show(box,
      '<div class="center"><div style="font-weight:800;font-size:20px">' + esc(t.name || '-') + '</div>' +
      '<div class="dim">' + esc(t.locationName || '') + (t.abbreviation ? ' (' + esc(t.abbreviation) + ')' : '') + '</div></div>' +
      '<div class="kv"><span class="k">Stadion</span><span class="v">' + esc(venue.name || '-') + '</span></div>' +
      (venue.city ? '<div class="kv"><span class="k">Kota</span><span class="v">' + esc(venue.city) + '</span></div>' : '') +
      '<div class="kv"><span class="k">Liga</span><span class="v">' + esc(liga.name || '-') + '</span></div>' +
      '<div class="kv"><span class="k">Divisi</span><span class="v">' + esc(divisi.name || '-') + '</span></div>' +
      (t.firstYearOfPlay ? '<div class="kv"><span class="k">Bermain sejak</span><span class="v">' + esc(String(t.firstYearOfPlay)) + '</span></div>' : '') +
      (teksAman(t.officialSiteUrl) ? '<p style="margin-top:8px"><a href="' + esc(t.officialSiteUrl) + '" target="_blank" rel="noopener" style="font-size:12.5px">Situs resmi tim</a></p>' : '') +
      '<p class="hint">Sumber: MLB Stats API.</p>');
  };

  const tampilDaftar = (filter) => {
    const q = (filter || '').trim().toLowerCase();
    const cocok = teams.filter((t) => !q || String(t.name || '').toLowerCase().includes(q) || String(t.abbreviation || '').toLowerCase().includes(q));
    if (!cocok.length) {
      T.show(daftarBox, '<p class="center dim">Tidak ada tim yang cocok dengan "' + esc(filter) + '".</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' tim. Ketuk nama untuk melihat detail.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    cocok.forEach((t) => {
      html += '<button type="button" class="btn" data-tim="' + esc(String(t.id)) + '">' + esc(t.name || t.teamName || '-') + '</button>';
    });
    html += '</div>';
    T.show(daftarBox, html);
    daftarBox.querySelectorAll('[data-tim]').forEach((b) => {
      b.addEventListener('click', () => {
        const t = teams.find((x) => String(x.id) === b.getAttribute('data-tim'));
        if (t) tampilDetail(t);
      });
    });
  };

  const muat = async () => {
    T.show(daftarBox, '<p class="mut">Mengambil daftar tim MLB…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    try {
      const r = await fetch(API, { signal: c.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const list = j && Array.isArray(j.teams) ? j.teams : [];
      if (!list.length) throw new Error('bad-data');
      teams = list;
      tampilDaftar('');
      T.show(box, '<p class="center dim">Pilih tim di bawah untuk melihat detailnya.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server MLB tidak merespons dalam 20 detik.'
        : 'Gagal mengambil daftar tim. Cek koneksi internet, lalu coba lagi.';
      T.show(daftarBox, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      daftarBox.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  inp.addEventListener('input', () => { if (teams) tampilDaftar(inp.value); });
  root.appendChild(T.el('<p class="note">Daftar lengkap 30 tim Major League Baseball (liga bisbol Amerika). Ketuk nama tim untuk melihat stadion, kota, dan liganya.</p>'));
  root.appendChild(T.field('Cari tim', inp));
  root.appendChild(box);
  root.appendChild(daftarBox);
  muat();
}
