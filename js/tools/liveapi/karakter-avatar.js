import { h as T, esc, errBox } from '../../core.js';

// Info karakter Avatar: The Last Airbender lewat Last Airbender API.
// Terverifikasi 19 Nov 2026: /api/v1/characters?perPage=1 -> 200, CORS *.
// Daftar dimuat 20 karakter per halaman; pencarian menyaring yang sudah
// dimuat. Foto karakter berasal dari wiki Avatar (tautan API).
export const meta = {"id":"karakter-avatar","name":"Karakter Avatar","cat":"liveapi","icon":"🌊","desc":"Cari karakter Avatar: The Last Airbender dan lihat sekutu, musuh, dan kelompoknya.","keywords":"avatar,last airbender,aang,korra,karakter,animasi","since":"6.19.0"};

const API = 'https://last-airbender-api.fly.dev/api/v1/characters?perPage=20&page=';
const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Cari karakter, contoh: Aang, Katara, Zuko');
  inp.setAttribute('autocomplete', 'off');
  const daftarBox = T.out();
  const lagiBox = T.out();
  let semua = [];
  let halaman = 0;
  let habis = false;
  let memuat = false;

  const tampilDetail = (k) => {
    const daftar = (arr) => Array.isArray(arr) && arr.length ? arr.filter(Boolean).join(', ') : '-';
    T.show(box,
      '<div class="center">' +
      (gambarAman(k.photoUrl) ? '<img src="' + esc(k.photoUrl) + '" alt="Foto karakter" style="width:160px;max-width:60%;height:auto;border-radius:8px" loading="lazy" data-err="hide">' : '') +
      '<div style="font-weight:800;font-size:20px;margin-top:8px">' + esc(k.name || '-') + '</div></div>' +
      (k.affiliation ? '<div class="kv"><span class="k">Kelompok</span><span class="v">' + esc(k.affiliation) + '</span></div>' : '') +
      (k.gender ? '<div class="kv"><span class="k">Jenis kelamin</span><span class="v">' + esc(k.gender) + '</span></div>' : '') +
      (k.profession ? '<div class="kv"><span class="k">Pekerjaan</span><span class="v">' + esc(k.profession) + '</span></div>' : '') +
      (k.position ? '<div class="kv"><span class="k">Jabatan</span><span class="v">' + esc(k.position) + '</span></div>' : '') +
      (k.weapon ? '<div class="kv"><span class="k">Senjata</span><span class="v">' + esc(k.weapon) + '</span></div>' : '') +
      '<div class="kv"><span class="k">Sekutu</span><span class="v">' + esc(daftar(k.allies)) + '</span></div>' +
      '<div class="kv"><span class="k">Musuh</span><span class="v">' + esc(daftar(k.enemies)) + '</span></div>' +
      '<p class="hint">Sumber: Last Airbender API.</p>');
    T.wireImgErr(box);
  };

  const tampilDaftar = (filter) => {
    const q = (filter || '').trim().toLowerCase();
    const cocok = semua.filter((k) => !q || String(k.name || '').toLowerCase().includes(q));
    if (!cocok.length) {
      T.show(daftarBox, '<p class="center dim">Tidak ada karakter yang cocok dengan "' + esc(filter) + '" di antara yang sudah dimuat. Muat lagi di bawah untuk menambah daftar.</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' karakter. Ketuk nama untuk melihat detail.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    cocok.forEach((k) => {
      html += '<button type="button" class="btn" data-kar="' + esc(String(k._id)) + '">' + esc(k.name || '-') + '</button>';
    });
    html += '</div>';
    T.show(daftarBox, html);
    daftarBox.querySelectorAll('[data-kar]').forEach((b) => {
      b.addEventListener('click', () => {
        const k = semua.find((x) => String(x._id) === b.getAttribute('data-kar'));
        if (k) tampilDetail(k);
      });
    });
  };

  const tampilLagi = () => {
    T.show(lagiBox, '');
    if (habis) {
      T.show(lagiBox, '<p class="hint">Semua karakter sudah dimuat.</p>');
      return;
    }
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(T.btn('Muat 20 karakter lagi', muat));
    lagiBox.appendChild(wr);
  };

  const muat = async () => {
    if (memuat) return;
    memuat = true;
    T.show(lagiBox, '<p class="mut">Memuat…</p>');
    if (!semua.length) T.show(daftarBox, '<p class="mut">Mengambil daftar karakter…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    try {
      const r = await fetch(API + (halaman + 1), { signal: c.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const list = Array.isArray(j) ? j.filter(Boolean) : [];
      if (!list.length && !semua.length) throw new Error('bad-data');
      if (list.length < 20) habis = true;
      halaman++;
      semua = semua.concat(list);
      tampilDaftar(inp.value);
      tampilLagi();
      if (halaman === 1) T.show(box, '<p class="center dim">Pilih karakter di bawah untuk melihat detailnya.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 20 detik.'
        : 'Gagal mengambil daftar karakter. Cek koneksi internet, lalu coba lagi.';
      const target = semua.length ? lagiBox : daftarBox;
      if (!semua.length) T.show(lagiBox, '');
      T.show(target, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      target.appendChild(wr);
    } finally { clearTimeout(t); memuat = false; }
  };

  inp.addEventListener('input', () => { if (semua.length) tampilDaftar(inp.value); });
  root.appendChild(T.el('<p class="note">Karakter dari serial Avatar: The Last Airbender dan The Legend of Korra. Ketuk nama untuk melihat sekutu, musuh, dan kelompoknya.</p>'));
  root.appendChild(T.field('Cari karakter', inp));
  root.appendChild(box);
  root.appendChild(daftarBox);
  root.appendChild(lagiBox);
  muat();
}
