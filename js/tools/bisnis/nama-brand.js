import { h as T } from '../../core.js';

export const meta = {"id": "nama-brand", "name": "Generator Nama Brand", "cat": "bisnis", "icon": "🏷️", "desc": "Racik kata jadi nama brand yang catchy.", "keywords": "brand,nama,bisnis,usaha,merk"};

// Kapitalisasi: besarkan huruf pertama SAJA, sisanya dibiarkan apa adanya —
// supaya varian CamelCase seperti "KopiSusu" tidak diratakan jadi "Kopisusu".
export function cap(s) {
  const t = String(s == null ? '' : s);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

const judulKata = (s) => String(s).split(/[\s-]+/).filter(Boolean).map(cap).join(' ');

// Racik nama brand dari 1–3 kata kunci. Mengembalikan daftar nama unik.
// Dedup memakai string persis (peka huruf besar-kecil): "KopiSusu" dan
// "kopisusu" adalah dua varian yang berbeda dan keduanya ditampilkan.
export function racikNama(kataKunci) {
  const words = String(kataKunci || '').toLowerCase().split(/\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  if (!words.length) return [];
  const [a, b, c] = [words[0], words[1] || '', words[2] || ''];
  const out = [];
  const sudah = new Set();
  const add = (s) => {
    const n = String(s || '').trim();
    if (!n || sudah.has(n)) return;
    sudah.add(n);
    out.push(n);
  };
  // gabungan kata
  add(a + b); add(a + b + c); add(b + a);
  add(cap(a) + cap(b));
  if (c) { add(cap(a) + cap(b) + cap(c)); add(a + c); add(c + a); }
  // varian dengan spasi (nama dua kata juga sah jadi brand)
  if (b) { add(judulKata(a + ' ' + b)); add(judulKata(b + ' ' + a)); }
  if (c) add(judulKata(a + ' ' + b + ' ' + c));
  // potongan suku kata
  add(a.slice(0, 2) + b.slice(0, 2));
  add(a.slice(0, 3) + b.slice(0, 3));
  add(cap(a) + b.slice(0, 3));
  add(a.slice(0, 2) + b);
  add(a.slice(0, 3) + b.slice(0, 2));
  if (b) add(b.slice(0, 3) + a);
  if (c) add(a.slice(0, 2) + c);
  // akhiran khas Indonesia
  add(a + 'ku'); add(a + 'mu'); add(a + 'in'); add(a + 'kita'); add(a + 'loka');
  if (b) {
    add(b + 'ku'); add(b + 'in');
    add(cap(a + b) + 'ku');
    add(b + 'mart'); add('ka' + b);
  }
  add(a + 'pedia'); add(a + 'nesia'); add(a + 'ologi');
  // awalan / kata depan
  add('si' + a);
  add('raja' + a); add('toko' + a); add('kedai' + a); add('sang' + a);
  // akhiran modern
  add(a + 'hub'); add(a + 'lab'); add(a + 'co');
  if (b) add(a + ' & ' + cap(b));
  return out.slice(0, 24);
}

export function render(root) {
  const kw = T.input('text', 'cth: kopi susu (1-3 kata)', '');
  const box = T.out();

  const racik = () => {
    const list = racikNama(kw.value);
    if (!list.length) { T.toast('Isi dulu kata kuncinya ya'); kw.focus(); return; }
    T.show(box, '');
    box.appendChild(T.el('<p class="mut" style="font-size:12px;margin:0 0 8px">' + list.length + ' nama dibuat. Ketuk nama untuk menyalin:</p>'));
    list.forEach((n) => {
      const item = T.el('<button type="button" class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;font-size:16px"></button>');
      item.textContent = n;
      item.addEventListener('click', () => T.copy(n));
      box.appendChild(item);
    });
    box.appendChild(T.el('<p class="hint">Nama di atas baru ide — cek sendiri apakah nama itu sudah dipakai orang lain sebelum dipakai sebagai brand.</p>'));
  };

  root.appendChild(T.field('Kata kunci', kw, '1–3 kata, mis. "kopi susu" atau "martabak manis".'));
  root.appendChild(T.row(T.btn('Racik Nama', racik, true)));
  root.appendChild(box);
}
