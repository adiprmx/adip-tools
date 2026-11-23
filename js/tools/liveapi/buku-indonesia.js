import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"buku-indonesia","name":"Buku Indonesia","cat":"liveapi","icon":"📚","desc":"Cari buku Indonesia berdasarkan penulis, judul, atau ISBN.","keywords":"buku,indonesia,penulis,isbn,novel,sastra,baca","since":"6.16.0", "online": true};

const API = 'https://khrlanamm.github.io/buku-indonesia/api/v1/';

async function ambilJson(url, detik) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), (detik || 15) * 1000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.status === 404) { const e = new Error('NOT_FOUND'); e.notFound = true; throw e; }
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

function kartuBuku(b) {
  const penulis = Array.isArray(b.authors) ? b.authors.join(', ') : (b.authors || '');
  const kat = Array.isArray(b.categories) ? b.categories.join(', ') : '';
  let baris = [];
  if (penulis) baris.push(esc(penulis));
  if (b.year) baris.push(esc(String(b.year)));
  if (b.publisher) baris.push(esc(b.publisher));
  let html = '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
    '<div style="font-weight:700;line-height:1.35">' + esc(b.title || '(Tanpa judul)') + '</div>' +
    (b.subtitle ? '<div class="dim" style="font-size:13px">' + esc(b.subtitle) + '</div>' : '') +
    (baris.length ? '<div class="dim" style="font-size:12.5px;margin-top:4px">' + baris.join(' · ') + '</div>' : '') +
    '<div class="dim" style="font-size:12px;margin-top:2px">' +
    (b.isbn13 ? 'ISBN: ' + esc(b.isbn13) + ' · ' : '') +
    (b.pages ? esc(String(b.pages)) + ' halaman' + (kat ? ' · ' : '') : '') +
    (kat ? esc(kat) : '') + '</div></div>';
  return html;
}

export function render(root) {
  const box = T.out();
  const selMode = T.select([['penulis', 'Cari penulis'], ['judul', 'Cari judul buku'], ['isbn', 'Cari ISBN']], 'penulis');
  const inp = T.input('text', 'Contoh: Tere Liye, Pramoedya, Hamka');
  inp.setAttribute('autocomplete', 'off');
  let authorsCache = null;
  let indexCache = null;

  const gagal = (e, ulang, pesan404) => {
    if (e && e.notFound) { T.show(box, '<p class="center dim">' + esc(pesan404 || 'Tidak ditemukan.') + '</p>'); return; }
    const msg = e && e.name === 'AbortError'
      ? 'Waktu habis, server katalog buku tidak bisa dihubungi.'
      : 'Gagal mengambil data buku. Cek koneksi internet, lalu coba lagi.';
    T.show(box, errBox(msg));
    const wr = T.el('<div style="margin-top:8px"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    box.appendChild(wr);
  };

  const tampilBukuPenulis = async (slug, nama) => {
    T.show(box, '<p class="mut">Mengambil daftar buku ' + esc(nama) + '…</p>');
    try {
      const j = await ambilJson(API + 'authors/' + encodeURIComponent(slug) + '.json', 15);
      const buku = Array.isArray(j.books) ? j.books : [];
      if (!buku.length) { T.show(box, '<p class="center dim">Belum ada buku ' + esc(nama) + ' di katalog ini.</p>'); return; }
      let html = '<div style="margin-bottom:10px"><button type="button" class="btn" id="kembali-penulis">← Kembali ke daftar penulis</button></div>' +
        '<div style="font-weight:800;font-size:17px;margin-bottom:2px">' + esc(j.name || nama) + '</div>' +
        '<p class="hint">' + buku.length + ' buku di katalog.</p>' +
        buku.map(kartuBuku).join('');
      T.show(box, html);
      box.querySelector('#kembali-penulis').addEventListener('click', cari);
    } catch (e) { gagal(e, () => tampilBukuPenulis(slug, nama), 'Penulis tidak ditemukan di katalog.'); }
  };

  const tampilDaftarPenulis = (list, q) => {
    const query = (q || '').trim().toLowerCase();
    const cocok = list.filter((a) => !query || String(a.name || '').toLowerCase().includes(query));
    if (!cocok.length) {
      T.show(box, '<p class="center dim">Tidak ada penulis yang cocok dengan "' + esc(q) + '".</p><p class="hint center">Coba nama lain atau sebagian nama saja.</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' penulis. Ketuk nama untuk melihat bukunya.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    cocok.slice(0, 60).forEach((a) => {
      html += '<button type="button" class="btn" data-slug="' + esc(a.slug) + '" data-nama="' + esc(a.name) + '">' + esc(a.name) + ' <span class="dim">(' + esc(String(a.books)) + ')</span></button>';
    });
    html += '</div>';
    if (cocok.length > 60) html += '<p class="hint">Menampilkan 60 pertama. Persempit dengan kata kunci.</p>';
    T.show(box, html);
    box.querySelectorAll('[data-slug]').forEach((b) => {
      b.addEventListener('click', () => tampilBukuPenulis(b.getAttribute('data-slug'), b.getAttribute('data-nama')));
    });
  };

  const cariPenulis = async () => {
    const q = inp.value.trim();
    if (!authorsCache) {
      T.show(box, '<p class="mut">Mengambil daftar penulis…</p>');
      try {
        authorsCache = await ambilJson(API + 'authors.json', 20);
      } catch (e) { gagal(e, cariPenulis); return; }
    }
    tampilDaftarPenulis(Array.isArray(authorsCache) ? authorsCache : [], q);
  };

  const cariJudul = async () => {
    const q = inp.value.trim();
    if (!q) { T.show(box, errBox('Tulis judul buku dulu.')); return; }
    if (!indexCache) {
      T.show(box, '<p class="mut">Mengunduh indeks katalog (sekali saja, lalu tersimpan)…</p>');
      try {
        indexCache = await ambilJson(API + 'search-index.json', 30);
      } catch (e) { gagal(e, cariJudul); return; }
    }
    const query = q.toLowerCase();
    const rows = Array.isArray(indexCache) ? indexCache : [];
    const cocok = rows.filter((r) => String((r && r.title) || '').toLowerCase().includes(query));
    if (!cocok.length) {
      T.show(box, '<p class="center dim">Tidak ada judul yang cocok dengan "' + esc(q) + '".</p><p class="hint center">Coba kata kunci yang lebih pendek, contoh: "bumi" saja.</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' buku cocok. Menampilkan 20 pertama.</p>' +
      cocok.slice(0, 20).map(kartuBuku).join('');
    T.show(box, html);
  };

  const cariIsbn = async () => {
    const isbn = inp.value.replace(/[^0-9Xx]/g, '');
    if (!isbn) { T.show(box, errBox('Tulis nomor ISBN dulu, angka saja.')); return; }
    T.show(box, '<p class="mut">Mencari ISBN ' + esc(isbn) + '…</p>');
    try {
      const b = await ambilJson(API + 'isbn/' + encodeURIComponent(isbn) + '.json', 15);
      if (!b || !b.title) throw new Error('bad-data');
      T.show(box, '<p class="hint">Buku ditemukan:</p>' + kartuBuku(b));
    } catch (e) { gagal(e, cariIsbn, 'ISBN ' + isbn + ' tidak ada di katalog ini.'); }
  };

  const cari = () => {
    if (selMode.value === 'judul') cariJudul();
    else if (selMode.value === 'isbn') cariIsbn();
    else cariPenulis();
  };

  const sesuaikanPetunjuk = () => {
    if (selMode.value === 'judul') inp.placeholder = 'Contoh: Bumi Manusia, Laskar Pelangi';
    else if (selMode.value === 'isbn') inp.placeholder = 'Contoh: 9786020342696';
    else inp.placeholder = 'Contoh: Tere Liye, Pramoedya, Hamka';
  };

  selMode.addEventListener('change', () => { sesuaikanPetunjuk(); T.show(box, ''); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.field('Cari berdasarkan', selMode));
  root.appendChild(T.field('Kata kunci', inp, 'Untuk penulis, kosongkan lalu tekan cari untuk melihat semua penulis.'));
  root.appendChild(T.row(T.btn('🔍 Cari buku', cari, true)));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Katalog: Buku Indonesia (khrlanamm.github.io), data terbuka CC0, 3.000+ buku.</p>'));
  cariPenulis();
}
