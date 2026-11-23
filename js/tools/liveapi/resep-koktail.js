import { h as T, utils, esc, errBox } from '../../core.js';

// Resep minuman/koktail acak lewat TheCocktailDB, test key publik "1".
// Terverifikasi 19 Nov 2026: /api/json/v1/1/random.php -> 200, key "1"
// MASIH HIDUP (mengembalikan minuman Malibu Twister).
// Hanya endpoint random.php yang dipakai (sesuai dokumen verifikasi).
export const meta = {"id":"resep-koktail","name":"Resep Koktail & Minuman","cat":"liveapi","icon":"🍹","desc":"Resep minuman dan koktail acak, lengkap dengan bahan dan cara buat.","keywords":"koktail,cocktail,minuman,resep,bahan,minum,drink","since":"6.19.0", "online": true};

const API = 'https://www.thecocktaildb.com/api/json/v1/1/random.php';

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

function bahan(d) {
  const list = [];
  for (let i = 1; i <= 15; i++) {
    const b = d['strIngredient' + i];
    if (typeof b === 'string' && b.trim()) {
      const takar = d['strMeasure' + i];
      list.push((typeof takar === 'string' && takar.trim() ? takar.trim() + ' ' : '') + b.trim());
    }
  }
  return list;
}

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari minuman…</p>');
    try {
      const j = await utils.getJson(API);
      const d = j && Array.isArray(j.drinks) && j.drinks[0];
      if (!d || typeof d.strDrink !== 'string' || !d.strDrink) throw new Error('bad-data');
      const daftar = bahan(d);
      const beralkohol = d.strAlcoholic === 'Alcoholic';
      let html = '<div class="center">';
      if (gambarAman(d.strDrinkThumb)) {
        html += '<img src="' + esc(d.strDrinkThumb) + '" alt="Foto ' + esc(d.strDrink) + '" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">';
      }
      html += '<h3 style="margin:12px 0 4px">' + esc(d.strDrink) + '</h3>';
      html += '<p class="hint">' + esc([d.strCategory, d.strGlass].filter(Boolean).join(' · ') || 'Minuman') + '</p></div>';
      html += '<p><strong>Bahan:</strong></p><ul style="margin:4px 0 12px;padding-left:20px;line-height:1.6">' +
        (daftar.length ? daftar.map((b) => '<li>' + esc(b) + '</li>').join('') : '<li>Bahan tidak tercantum di sumber.</li>') + '</ul>';
      if (typeof d.strInstructions === 'string' && d.strInstructions.trim()) {
        html += '<p><strong>Cara buat:</strong></p><p style="line-height:1.6">' + esc(d.strInstructions.trim()) + '</p>';
      }
      html += '<p class="hint">Jenis: ' + esc(beralkohol ? 'Beralkohol' : (d.strAlcoholic || 'Tidak diketahui')) + ' · Sumber: TheCocktailDB.</p>';
      if (beralkohol) html += '<p class="hint">Minuman beralkohol hanya untuk usia 21 tahun ke atas.</p>';
      T.show(box, html);
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil resep minuman. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu resep minuman acak setiap ketukan, lengkap dengan bahan dan cara buat. Nama bahan dan cara buat dalam bahasa Inggris, sesuai sumbernya.</p>'));
  root.appendChild(T.row(T.btn('🍹 Minuman acak', muat, true)));
  root.appendChild(box);
  muat();
}
