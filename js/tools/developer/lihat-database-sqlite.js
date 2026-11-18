import { h as T, LOCAL_NOTE } from '../../core.js';

export const meta = { id: 'lihat-database-sqlite', name: 'Lihat Database SQLite', cat: 'developer', icon: '🗄️', desc: 'Buka file database .db atau .sqlite di browser, jelajahi tabelnya, dan jalankan query SELECT. Baca saja, tidak bisa mengubah.', keywords: 'sqlite,database,db,sql,query,tabel,buka database,select', since: '6.17.0' };

// sql.js 1.13.0 via jsDelivr. Hash SRI dibaca dari peta core.js
// (T.scriptIntegrity) — satu sumber kebenaran, bukan konstanta lokal
// (RED-G2-13). File sql-wasm.wasm diambil sql.js lewat fetch internal
// (tidak ada SRI untuk fetch WASM; keterbatasan browser yang sama
// seperti di core.js).
const SQLJS_URL = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js';
const SQLJS_WASM_DIR = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/';

// Batas baris hasil query (RED-G2-10): tanpa LIMIT, satu query bisa
// mewujudkan jutaan baris di memori dan membekukan tab. Query yang belum
// punya LIMIT dibungkus LIMIT 1001 — satu baris ekstra untuk mendeteksi
// pemotongan, supaya UI bisa menulis jujur "hasil dipotong".
export const BATAS_BARIS = 1000;

let sqlPromise = null;
function muatSqlJs() {
  if (sqlPromise) return sqlPromise;
  sqlPromise = new Promise((resolve) => {
    if (typeof window.initSqlJs === 'function') {
      window.initSqlJs({ locateFile: (f) => SQLJS_WASM_DIR + f }).then(resolve, () => resolve(null));
      return;
    }
    const s = document.createElement('script');
    s.src = SQLJS_URL;
    s.async = true;
    const hashSql = T.scriptIntegrity(SQLJS_URL);
    if (hashSql) { s.integrity = hashSql; s.crossOrigin = 'anonymous'; }
    s.onload = () => {
      if (typeof window.initSqlJs !== 'function') { resolve(null); return; }
      window.initSqlJs({ locateFile: (f) => SQLJS_WASM_DIR + f }).then(resolve, () => resolve(null));
    };
    s.onerror = () => { sqlPromise = null; resolve(null); };
    document.head.appendChild(s);
  });
  return sqlPromise;
}

// Validasi query hanya-baca: hanya SELECT / WITH ... SELECT, satu pernyataan.
// Kembalikan null bila lolos, atau pesan penolakan.
export function validasiBacaSaja(sql) {
  const s = String(sql || '').trim();
  if (!s) return 'Tulis query-nya dulu.';
  // Buang komentar -- dan /* */ di depan.
  const bersih = s.replace(/^\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/, '');
  if (!/^(SELECT|WITH)\b/i.test(bersih)) return 'Hanya query SELECT yang boleh jalan di sini. Query yang mengubah data (INSERT, UPDATE, DELETE, DROP, dan sejenisnya) diblokir.';
  const tanpaString = bersih.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""');
  const tanpaKomentar = tanpaString.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // Titik koma hanya boleh satu di akhir.
  const titikKoma = (tanpaKomentar.match(/;/g) || []).length;
  if (titikKoma > 1) return 'Satu query saja dalam sekali jalan. Hapus query keduanya.';
  if (titikKoma === 1 && !/;\s*$/.test(tanpaKomentar)) return 'Satu query saja dalam sekali jalan. Hapus query keduanya.';
  const larang = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'REPLACE', 'TRUNCATE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'REINDEX', 'GRANT', 'REVOKE'];
  for (const kata of larang) {
    if (new RegExp('\\b' + kata + '\\b', 'i').test(tanpaKomentar)) return 'Kata ' + kata + ' tidak boleh ada di query. Tool ini hanya membaca, tidak mengubah.';
  }
  return null;
}

// Bungkus query dengan LIMIT bila belum ada (RED-G2-10). LIMIT dicari di
// luar string dan komentar supaya kata "LIMIT" di dalam teks tidak menipu.
// Baris baru sebelum kurung tutup melindungi dari komentar `--` di akhir
// query yang akan menelan `) LIMIT ...` bila sebaris. Murni, bisa diuji
// di Node. Kembalikan { sql, dibatasi }.
export function batasiQuery(sql, batas) {
  const q = String(sql || '').trim().replace(/;\s*$/, '');
  const tanpaString = q.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""');
  const tanpaKomentar = tanpaString.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\bLIMIT\b/i.test(tanpaKomentar)) return { sql: q, dibatasi: false };
  const n = Number(batas) || BATAS_BARIS;
  return { sql: 'SELECT * FROM (\n' + q + '\n) LIMIT ' + (n + 1), dibatasi: true };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.sq-tabel{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}' +
    '.sq-tabel th,.sq-tabel td{border:1px solid var(--line-soft);padding:6px 8px;text-align:left;vertical-align:top;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.sq-tabel th{background:var(--surface-2);font-weight:700}' +
    '.sq-wrap{overflow-x:auto}' +
    '.sq-badge{display:inline-block;background:#2e7d4f;color:#fff;font-size:12px;font-weight:700;padding:3px 8px;border-radius:999px}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Buka file database SQLite dan lihat isinya tanpa memasang apa pun. Tool ini <span class="sq-badge">HANYA MEMBACA</span> — query yang mengubah, menambah, atau menghapus data diblokir. ' + T.esc(LOCAL_NOTE) + '</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.db,.sqlite,.sqlite3,.db3';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const tabelSel = T.select([], '');
  const tabelWrap = T.el('<div></div>');
  tabelWrap.appendChild(T.field('Tabel yang dilihat', tabelSel));
  tabelWrap.hidden = true;
  const isiEl = T.el('<div></div>');
  const queryI = T.ta(4, 'Tulis query SELECT di sini.\nContoh: SELECT * FROM nama_tabel LIMIT 20;');
  const queryWrap = T.el('<div></div>');
  queryWrap.append(T.field('Query SELECT (baca saja)', queryI, 'Hanya SELECT yang boleh jalan. Satu query dalam sekali jalan. Hasil dibatasi 1.000 baris — tulis LIMIT sendiri bila mau lebih sedikit.'));
  queryWrap.hidden = true;
  const hasilEl = T.el('<div></div>');
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  let SQL = null, db = null, namaFile = '';
  let halaman = 0;
  const PER_HALAMAN = 50;
  let barisTerakhir = null, kolomTerakhir = null; // untuk ekspor CSV

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Memuat mesin database...';
    SQL = await muatSqlJs();
    if (!SQL) {
      statusEl.textContent = '';
      T.toast('Mesin database gagal dimuat. Cek koneksi internet lalu coba lagi.');
      return;
    }
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      if (db) { try { db.close(); } catch (e) {} }
      db = new SQL.Database(buf);
      namaFile = f.name;
      halaman = 0;
      statusEl.textContent = 'Database "' + f.name + '" terbuka (' + T.fmt(f.size) + ' byte).';
      muatDaftarTabel();
      queryWrap.hidden = false;
      aksiEl.innerHTML = '';
      aksiEl.append(
        T.btn('Jalankan query', jalankanQuery, true),
        T.btn('Unduh hasil sebagai CSV', eksporCSV),
      );
    } catch (e) {
      statusEl.textContent = '';
      T.toast('File ini bukan database SQLite yang valid, atau file-nya rusak.');
      db = null;
    }
  }

  function muatDaftarTabel() {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const daftar = r.length ? r[0].values.map((v) => v[0]) : [];
    tabelSel.innerHTML = '';
    if (!daftar.length) {
      tabelWrap.hidden = true;
      isiEl.innerHTML = '<p class="hint">Database ini tidak punya tabel.</p>';
      return;
    }
    daftar.forEach((nama) => {
      const o = document.createElement('option');
      o.value = nama;
      o.textContent = nama;
      tabelSel.appendChild(o);
    });
    tabelWrap.hidden = false;
    tampilTabel();
  }

  function tabelHTML(kolom, baris) {
    let h = '<div class="sq-wrap"><table class="sq-tabel"><thead><tr>' +
      kolom.map((c) => '<th>' + T.esc(String(c)) + '</th>').join('') + '</tr></thead><tbody>';
    baris.forEach((row) => {
      h += '<tr>' + row.map((v) => {
        if (v === null) return '<td style="color:var(--faint)">NULL</td>';
        if (v instanceof Uint8Array) return '<td style="color:var(--faint)">[data biner ' + v.length + ' byte]</td>';
        return '<td>' + T.esc(String(v)) + '</td>';
      }).join('') + '</tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  function tampilTabel() {
    const nama = tabelSel.value;
    if (!nama) return;
    try {
      const hitung = db.exec('SELECT COUNT(*) FROM "' + nama.replace(/"/g, '""') + '"');
      const total = hitung.length ? hitung[0].values[0][0] : 0;
      const r = db.exec('SELECT * FROM "' + nama.replace(/"/g, '""') + '" LIMIT ' + PER_HALAMAN + ' OFFSET ' + (halaman * PER_HALAMAN));
      const kolom = r.length ? r[0].columns : [];
      const baris = r.length ? r[0].values : [];
      barisTerakhir = baris;
      kolomTerakhir = kolom;
      const totalHal = Math.max(1, Math.ceil(total / PER_HALAMAN));
      isiEl.innerHTML = '<p class="hint">Tabel <b>' + T.esc(nama) + '</b>: ' + T.fmt(total) + ' baris, ' + kolom.length + ' kolom. Halaman ' + (halaman + 1) + ' dari ' + totalHal + '.</p>' +
        (baris.length ? tabelHTML(kolom, baris) : '<p class="hint">Tabel ini kosong.</p>');
      const nav = T.el('<div class="row"></div>');
      const btnPrev = T.btn('◀ Sebelumnya', () => { if (halaman > 0) { halaman--; tampilTabel(); } });
      const btnNext = T.btn('Berikutnya ▶', () => { if (halaman < totalHal - 1) { halaman++; tampilTabel(); } });
      btnPrev.disabled = halaman === 0;
      btnNext.disabled = halaman >= totalHal - 1;
      nav.append(btnPrev, btnNext);
      isiEl.appendChild(nav);
    } catch (e) {
      isiEl.innerHTML = '<p style="color:var(--err)">Tabel ini tidak bisa dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  tabelSel.addEventListener('change', () => { halaman = 0; tampilTabel(); });

  function jalankanQuery() {
    if (!db) { T.toast('Buka file database dulu'); return; }
    const q = queryI.value.trim();
    const tolak = validasiBacaSaja(q);
    if (tolak) { T.toast(tolak); return; }
    try {
      const mulai = performance.now();
      const terbungkus = batasiQuery(q, BATAS_BARIS);
      const r = db.exec(terbungkus.sql);
      const ms = Math.round(performance.now() - mulai);
      if (!r.length) {
        hasilEl.innerHTML = '<p class="hint">Query jalan dalam ' + ms + ' ms, tapi tidak mengembalikan baris.</p>';
        barisTerakhir = [];
        kolomTerakhir = [];
        return;
      }
      const kolom = r[0].columns;
      const semuaBaris = r[0].values;
      // Bila pembungkus LIMIT mengembalikan satu baris ekstra, hasilnya
      // terpotong — tulis jujur, jangan diam-diam.
      const terpotong = terbungkus.dibatasi && semuaBaris.length > BATAS_BARIS;
      const baris = terpotong ? semuaBaris.slice(0, BATAS_BARIS) : semuaBaris;
      barisTerakhir = baris;
      kolomTerakhir = kolom;
      hasilEl.innerHTML = '<p class="hint">Ditemukan ' + T.fmt(baris.length) + ' baris dalam ' + ms + ' ms' +
        (terpotong ? ' (hasil dipotong di ' + T.fmt(BATAS_BARIS) + ' baris pertama — persempit query-mu dengan WHERE atau LIMIT yang lebih kecil untuk melihat sisanya)' : '') + '.</p>' +
        tabelHTML(kolom, baris.slice(0, 200));
      if (baris.length > 200) hasilEl.innerHTML += '<p class="hint">Hanya 200 baris pertama yang ditampilkan. Unduh CSV untuk semua ' + T.fmt(baris.length) + ' baris yang diambil.</p>';
    } catch (e) {
      hasilEl.innerHTML = '<p style="color:var(--err)">Query gagal: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  function eksporCSV() {
    if (!kolomTerakhir || !barisTerakhir || !barisTerakhir.length) { T.toast('Belum ada hasil untuk diunduh'); return; }
    const escCsv = (v) => {
      if (v === null || v === undefined) return '';
      if (v instanceof Uint8Array) return '[data biner]';
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const isi = [kolomTerakhir.map(escCsv).join(',')]
      .concat(barisTerakhir.map((row) => row.map(escCsv).join(',')))
      .join('\n');
    const dasar = namaFile.replace(/\.[^.]*$/, '') || 'hasil';
    T.dl(dasar + '-hasil.csv', isi, 'text/csv;charset=utf-8');
  }

  fileI.addEventListener('change', bukaFile);

  root.append(
    T.field('Pilih file database', fileI),
    statusEl,
    tabelWrap,
    isiEl,
    queryWrap,
    aksiEl,
    hasilEl,
  );
}
