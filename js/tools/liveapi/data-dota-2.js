import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-dota-2","name":"Data Dota 2","cat":"liveapi","icon":"⚔️","desc":"Info hero Dota 2: atribut, peran, dan angka dasarnya.","keywords":"dota,dota 2,hero,atribut,peran,carry,game","since":"6.16.0"};

const API = 'https://api.opendota.com/api/heroes';

const ATRIBUT = { str: 'Kekuatan', agi: 'Kelincahan', int: 'Kecerdasan', all: 'Universal' };
const SERANG = { Melee: 'Jarak dekat', Ranged: 'Jarak jauh' };

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Cari hero, contoh: Anti-Mage, Pudge, Invoker');
  inp.setAttribute('autocomplete', 'off');
  const daftarBox = T.out();
  let heroes = null;

  const tampilDetail = (h) => {
    const nama = h.localized_name || h.name || '-';
    const peran = Array.isArray(h.roles) && h.roles.length ? h.roles.join(', ') : '-';
    const singkat = String(h.name || '').replace(/^npc_dota_hero_/, '');
    const gambar = singkat ? 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/' + singkat + '.png' : '';
    let html = '<div class="center">' +
      (gambar ? '<img src="' + esc(gambar) + '" alt="" loading="lazy" style="width:180px;max-width:100%;border-radius:8px" onerror="this.style.display=\'none\'">' : '') +
      '<div style="font-weight:800;font-size:20px;margin-top:8px">' + esc(nama) + '</div>' +
      '<div class="dim">' + esc(ATRIBUT[h.primary_attr] || h.primary_attr || '-') + ' · Serangan ' + esc(SERANG[h.attack_type] || h.attack_type || '-') + '</div></div>' +
      '<div class="kv"><span class="k">Peran</span><span class="v">' + esc(peran) + '</span></div>' +
      '<div class="kv"><span class="k">Atribut utama</span><span class="v">' + esc(ATRIBUT[h.primary_attr] || h.primary_attr || '-') + '</span></div>' +
      '<div class="kv"><span class="k">Jenis serangan</span><span class="v">' + esc(SERANG[h.attack_type] || h.attack_type || '-') + '</span></div>' +
      (h.legs != null ? '<div class="kv"><span class="k">Jumlah kaki</span><span class="v">' + esc(String(h.legs)) + '</span></div>' : '') +
      '<p class="hint">Sumber: OpenDota. Angka dasar seperti darah dan serangan tidak disediakan API ini, jadi tidak ditampilkan.</p>';
    T.show(box, html);
  };

  const tampilDaftar = (filter) => {
    const q = (filter || '').trim().toLowerCase();
    const cocok = heroes.filter((h) => !q || String(h.localized_name || '').toLowerCase().includes(q) || String(h.name || '').toLowerCase().includes(q));
    if (!cocok.length) {
      T.show(daftarBox, '<p class="center dim">Tidak ada hero yang cocok dengan "' + esc(filter) + '".</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' hero. Ketuk nama untuk melihat detail.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    cocok.forEach((h) => {
      html += '<button type="button" class="btn" data-hero="' + esc(String(h.id)) + '">' + esc(h.localized_name || h.name) + '</button>';
    });
    html += '</div>';
    T.show(daftarBox, html);
    daftarBox.querySelectorAll('[data-hero]').forEach((b) => {
      b.addEventListener('click', () => {
        const h = heroes.find((x) => String(x.id) === b.getAttribute('data-hero'));
        if (h) tampilDetail(h);
      });
    });
  };

  const muat = async () => {
    T.show(daftarBox, '<p class="mut">Mengambil daftar hero dari OpenDota…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(API, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      heroes = j;
      tampilDaftar('');
      T.show(box, '<p class="center dim">Pilih hero di bawah untuk melihat detailnya.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server OpenDota tidak merespons dalam 20 detik.'
        : 'Gagal ambil data hero. Cek koneksi internet, lalu coba lagi.';
      T.show(daftarBox, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      daftarBox.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('input', () => { if (heroes) tampilDaftar(inp.value); });
  root.appendChild(T.field('Cari hero', inp));
  root.appendChild(box);
  root.appendChild(daftarBox);
  muat();
}
