import { h as T, esc } from '../../core.js';

export const meta = {"id":"resep-makanan","name":"Resep Makanan","cat":"liveapi","icon":"🍳","desc":"Cari resep masakan dari seluruh dunia, lengkap dengan bahan & cara masak.","keywords":"resep,masakan,makanan,masak,bahan,cara masak,themealdb","since":"6.12.0", "online": true};

const API = 'https://www.themealdb.com/api/json/v1/1/';

export function render(root) {
  const q = T.input('text', 'Nama makanan dalam bahasa Inggris, mis. chicken…', '');
  const box = T.out();
  const detail = T.out();
  const cache = new Map();

  const ambil = async (url) => {
    if (cache.has(url)) return cache.get(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const j = await res.json();
      cache.set(url, j);
      return j;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };

  const bahan = (m) => {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const b = (m['strIngredient' + i] || '').trim();
      const takar = (m['strMeasure' + i] || '').trim();
      if (b) list.push((takar ? takar + ' ' : '') + b);
    }
    return list;
  };

  const tampilDetail = (m) => {
    const bl = bahan(m);
    let html = '<div class="center">';
    if (m.strMealThumb) html += '<img src="' + esc(m.strMealThumb) + '" alt="" style="max-width:100%;border-radius:10px;margin-bottom:8px" loading="lazy" data-err="hide">';
    html += '<div style="font-weight:700;font-size:16px">' + esc(m.strMeal || 'Tanpa nama') + '</div>' +
      '<div class="dim">' + esc([m.strCategory, m.strArea].filter(Boolean).join(' · ') || '-') + '</div></div>';
    if (bl.length) {
      html += '<div style="font-weight:700;margin-top:12px">Bahan-bahan</div><ul style="margin:6px 0;padding-left:20px">';
      bl.forEach((b) => { html += '<li>' + esc(b) + '</li>'; });
      html += '</ul>';
    }
    if (m.strInstructions) {
      html += '<div style="font-weight:700;margin-top:12px">Cara masak</div>' +
        '<div style="white-space:pre-wrap;margin-top:6px">' + esc(m.strInstructions) + '</div>';
    }
    if (m.strYoutube) {
      html += '<div style="margin-top:12px"><a href="' + esc(m.strYoutube) + '" target="_blank" rel="noopener">▶ Tonton video masaknya di YouTube</a></div>';
    }
    if (m.strSource) {
      html += '<div style="margin-top:6px"><a href="' + esc(m.strSource) + '" target="_blank" rel="noopener">Sumber resep asli ↗</a></div>';
    }
    T.show(detail, html);
    T.wireImgErr(detail);
    T.scrollToPreview && T.scrollToPreview(detail);
  };

  const tampilHasil = (meals) => {
    const list = T.el('<div></div>');
    list.appendChild(T.el('<div class="dim" style="margin-bottom:8px">Ketuk hasil untuk lihat resep lengkap:</div>'));
    meals.forEach((m) => {
      const thumb = m.strMealThumb
        ? '<img src="' + esc(m.strMealThumb) + '" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy" data-err="remove">'
        : '<div style="width:56px;height:56px;border-radius:8px;background:#27272a;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">🍽️</div>';
      const item = T.el(
        '<button type="button" style="display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:#18181b;border:1px solid #ffffff14;border-radius:10px;padding:8px;margin-bottom:8px;cursor:pointer;color:inherit">' +
        thumb +
        '<span><span style="display:block;font-weight:600;font-size:13.5px">' + esc(m.strMeal || 'Tanpa nama') + '</span>' +
        '<span class="dim" style="display:block;font-size:12px">' + esc([m.strCategory, m.strArea].filter(Boolean).join(' · ') || '-') + '</span></span>' +
        '</button>'
      );
      item.addEventListener('click', () => tampilDetail(m));
      T.wireImgErr(item);
      list.appendChild(item);
    });
    T.show(box, '');
    box.appendChild(list);
  };

  const gagal = (e, ulang) => {
    let msg;
    if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak bisa dihubungi.';
    else if (/429/.test(e.message || '')) msg = 'Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
    else msg = 'Gagal memuat resep. Periksa koneksi internet lalu coba lagi.';
    T.show(box, '<span class="err">' + esc(msg) + '</span>');
    const wrap = T.el('<div style="margin-top:8px"></div>');
    wrap.appendChild(T.btn('🔄 Coba lagi', ulang));
    box.appendChild(wrap);
  };

  const cari = async () => {
    const kw = q.value.trim();
    if (!kw) { T.toast && T.toast('Ketik dulu nama makanannya'); return; }
    T.hide(detail);
    T.show(box, '<div class="dim center">Mencari resep…</div>');
    try {
      const j = await ambil(API + 'search.php?s=' + encodeURIComponent(kw));
      const meals = (j && j.meals) || [];
      if (!meals.length) {
        T.show(box, '<div class="dim center">Tidak ada resep untuk "' + esc(kw) + '". Coba kata lain dalam bahasa Inggris, mis. beef, pasta, salad.</div>');
        return;
      }
      tampilHasil(meals);
    } catch (e) { gagal(e, cari); }
  };

  const acak = async () => {
    T.hide(detail);
    T.show(box, '<div class="dim center">Mengacak resep…</div>');
    try {
      const j = await ambil(API + 'random.php?_=' + Date.now());
      const meals = (j && j.meals) || [];
      if (!meals.length) {
        T.show(box, '<div class="dim center">Resep acak tidak tersedia saat ini. Coba lagi sebentar lagi.</div>');
        return;
      }
      tampilDetail(meals[0]);
      T.show(box, '');
    } catch (e) { gagal(e, acak); }
  };

  root.appendChild(T.field('Nama makanan', q, 'Database resep berbahasa Inggris — ketik mis. chicken, salmon, pancake.'));
  const row = T.row(T.btn('🔍 Cari resep', cari, true), T.btn('🎲 Resep acak', acak));
  root.appendChild(row);
  root.appendChild(detail);
  root.appendChild(box);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
}
