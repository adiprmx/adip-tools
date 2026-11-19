import { h as T, esc, errBox } from '../../core.js';

// Hitung ekspresi matematika lewat API math.js, tanpa key.
// Terverifikasi 19 Nov 2026: /v4/?expr=2*(7-3) -> 200, CORS echo, hasil "8".
// GET mengembalikan hasil sebagai teks polos. Ekspresi salah -> API balas
// 400 dengan pesan galat; tool menampilkan pesan ramah, bukan pesan mentah.
export const meta = {"id":"kalkulator-ekspresi","name":"Kalkulator Ekspresi","cat":"liveapi","icon":"∑","desc":"Hitung ekspresi matematika apa pun, dari yang sederhana sampai pakai akar dan pangkat.","keywords":"kalkulator,ekspresi,matematika,hitung,mathjs,akar,pangkat","since":"6.19.0"};

const API = 'https://api.mathjs.org/v4/?expr=';

async function hitungApi(expr) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(API + encodeURIComponent(expr), { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return (await r.text()).trim();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: 2*(7-3), sqrt(144), 15% dari 200000');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('inputmode', 'text');
  let riwayat = [];

  const tampilRiwayat = () => {
    if (!riwayat.length) return '';
    let h = '<p class="hint" style="margin-top:14px">Terakhir dihitung:</p><div style="display:flex;flex-direction:column;gap:4px">';
    riwayat.slice(0, 5).forEach((r) => {
      h += '<button type="button" class="btn" data-isi="' + esc(r.expr) + '" style="text-align:left;font-size:13px">' + esc(r.expr) + ' = ' + esc(r.hasil) + '</button>';
    });
    return h + '</div>';
  };

  const jalankan = async (exprPaksa) => {
    // Klik tombol mengoper event sebagai argumen pertama; hanya string yang
    // dianggap ekspresi, selebihnya baca dari kolom input.
    const expr = (typeof exprPaksa === 'string' ? exprPaksa : inp.value).trim();
    if (!expr) {
      T.show(box, errBox('Tulis dulu ekspresinya, contoh: 2*(7-3).'));
      return;
    }
    T.show(box, '<p class="mut">Menghitung…</p>');
    try {
      const hasil = await hitungApi(expr);
      if (!hasil) throw new Error('bad-data');
      riwayat.unshift({ expr, hasil });
      if (riwayat.length > 5) riwayat.length = 5;
      T.show(box,
        '<div class="center"><div class="dim" style="font-size:13px">' + esc(expr) + '</div>' +
        '<div style="font-weight:800;font-size:28px;margin:6px 0;word-break:break-word">' + esc(hasil) + '</div></div>' +
        '<p class="hint">Sumber: math.js. Tanda kali pakai *, bagi pakai /, pangkat pakai ^, akar pakai sqrt().</p>' +
        tampilRiwayat());
      box.querySelectorAll('[data-isi]').forEach((b) => {
        b.addEventListener('click', () => { inp.value = b.getAttribute('data-isi'); jalankan(); });
      });
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server math.js tidak merespons dalam 15 detik.'
        : (e.message && e.message.indexOf('http 400') === 0)
          ? 'Ekspresi tidak bisa dihitung. Periksa tanda kurung dan penulisannya, lalu coba lagi.'
          : 'Gagal menghubungi server hitung. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', jalankan));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') jalankan(); });
  root.appendChild(T.el('<p class="note">Ketik ekspresi matematika, lalu ketuk Hitung. Hasilnya dihitung server math.js, jadi bisa akar, pangkat, sampai fungsi seperti sin dan log.</p>'));
  root.appendChild(T.field('Ekspresi', inp));
  root.appendChild(T.row(T.btn('= Hitung', jalankan, true)));
  root.appendChild(box);
  T.show(box, '<p class="center dim">Belum ada yang dihitung. Coba tulis 2*(7-3) lalu ketuk Hitung.</p>');
}
