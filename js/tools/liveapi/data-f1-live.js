import { h as T, esc, errBox, utils, tabs } from '../../core.js';

// Data Formula 1 lewat OpenF1 (tanpa key) + hasil balapan lewat Ergast/Jolpica.
// Terverifikasi 18 Nov 2026: api.openf1.org/v1/meetings 200, CORS *.
// Terverifikasi 17 Nov 2026: /ergast/f1/current.json?limit=1 -> 200, CORS *.
// Hasil gabung v6.21.0 (B9): tab Hasil diserap dari Jadwal & Hasil F1.
// Nama tampil "Data F1" dipertahankan (perbaikan gelombang 2, F8): ini
// jadwal dan data sesi, bukan hitungan waktu balapan yang sedang berjalan.
const API = 'https://api.openf1.org/v1';
const API_ERGAST = 'https://api.jolpi.ca/ergast/f1';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js).

export const meta = {"id": "data-f1-live", "name": "Data F1", "cat": "liveapi", "icon": "🏎️", "desc": "Jadwal balapan Formula 1 per musim, sesi tiap seri, daftar pembalap, dan hasil balapan terakhir.", "keywords": "f1,formula 1,balapan,pembalap,grand prix,jadwal f1,hasil f1,openf1,ergast,motorsport", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const detailBox = T.out();
  const hasilBox = T.out();
  const thn = new Date().getFullYear();
  const tahunS = T.select([[String(thn), String(thn)], [String(thn - 1), String(thn - 1)], [String(thn - 2), String(thn - 2)], ['2023', '2023']], String(thn));
  let hasilSudahDimuat = false;

  const gagal = (pesan, ulang) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', ulang || muat));
    box.appendChild(w);
  };

  const muatSesi = async (meetingKey, nama) => {
    T.show(detailBox, '<p class="mut">Mengambil sesi ' + esc(nama) + '…</p>');
    try {
      const sesi = await getJSON(API + '/sessions?meeting_key=' + encodeURIComponent(meetingKey));
      if (!Array.isArray(sesi) || !sesi.length) {
        T.show(detailBox, '<p class="center dim">Tidak ada sesi yang tercatat untuk seri ini.</p>');
        return;
      }
      T.show(detailBox, '<p style="margin-top:6px"><b>Sesi ' + esc(nama) + '</b></p>' +
        sesi.map((s) => '<div class="kv"><span class="k">' + esc(String(s.session_name || 'Sesi')) + '</span><span class="v">' + esc(utils.tglCantik(s.date_start)) + '</span></div>').join('') +
        '<p style="margin-top:10px"><button class="btn" id="f1-drivers">Lihat pembalap seri ini</button></p>');
      const b = detailBox.querySelector('#f1-drivers');
      if (b) b.addEventListener('click', () => muatPembalap(meetingKey, sesi[sesi.length - 1].session_key, nama));
    } catch (e) {
      T.show(detailBox, errBox('Sesi gagal diambil. Cek koneksi internet, lalu coba lagi.'));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', () => muatSesi(meetingKey, nama)));
      detailBox.appendChild(w);
    }
  };

  const muatPembalap = async (meetingKey, sessionKey, nama) => {
    T.show(detailBox, '<p class="mut">Mengambil daftar pembalap ' + esc(nama) + '…</p>');
    try {
      const list = await getJSON(API + '/drivers?meeting_key=' + encodeURIComponent(meetingKey) + '&session_key=' + encodeURIComponent(sessionKey));
      if (!Array.isArray(list) || !list.length) {
        T.show(detailBox, '<p class="center dim">Tidak ada pembalap yang tercatat untuk seri ini.</p>');
        return;
      }
      const unik = [];
      const sudah = new Set();
      list.forEach((d) => { if (d.driver_number != null && !sudah.has(d.driver_number)) { sudah.add(d.driver_number); unik.push(d); } });
      unik.sort((a, b) => Number(a.driver_number) - Number(b.driver_number));
      T.show(detailBox, '<p style="margin-top:6px"><b>Pembalap ' + esc(nama) + '</b> (' + unik.length + ' orang)</p>' +
        unik.map((d) => '<div class="kv"><span class="k"><b>#' + esc(String(d.driver_number)) + ' ' + esc(String(d.full_name || d.broadcast_name || 'Tanpa nama')) + '</b>' +
          '<br><span class="hint">' + esc(String(d.team_name || '')) + '</span></span>' +
          '<span class="v">' + esc(String(d.country_code || '')) + '</span></div>').join(''));
    } catch (e) {
      T.show(detailBox, errBox('Daftar pembalap gagal diambil. Cek koneksi internet, lalu coba lagi.'));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', () => muatPembalap(meetingKey, sessionKey, nama)));
      detailBox.appendChild(w);
    }
  };

  const muat = async () => {
    const tahun = tahunS.value;
    T.hide(detailBox);
    T.show(box, '<p class="mut">Mengambil jadwal F1 musim ' + esc(tahun) + '…</p>');
    try {
      const j = await getJSON(API + '/meetings?year=' + encodeURIComponent(tahun));
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada jadwal balapan untuk musim ' + esc(tahun) + ' di data ini. Coba tahun lain.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + j.length + ' seri di musim ' + esc(tahun) + '. Ketuk satu seri untuk melihat sesi dan pembalapnya.</p>' +
        j.map((m) => '<div class="kv" data-meeting="' + (Number(m.meeting_key) || 0) + '" data-nama="' + esc(String(m.meeting_name || '')) + '" style="cursor:pointer" role="button" tabindex="0">' +
          '<span class="k"><b>' + esc(String(m.meeting_name || 'Tanpa nama')) + '</b><br><span class="hint">' + esc(String(m.location || '')) + (m.country_name ? ', ' + esc(String(m.country_name)) : '') + '</span></span>' +
          '<span class="v">' + esc(utils.tglCantik(m.date_start)) + '</span></div>').join('') +
        '<p class="hint">Sumber: OpenF1 (data resmi Formula 1).</p>');
      box.querySelectorAll('[data-meeting]').forEach((el) => {
        const buka = () => muatSesi(el.getAttribute('data-meeting'), el.getAttribute('data-nama') || '');
        el.addEventListener('click', buka);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buka(); } });
      });
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server OpenF1 tidak merespons dalam 15 detik.'
        : 'Jadwal F1 gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  // --- Tab Hasil: hasil balapan terakhir via Ergast/Jolpica ---
  const muatHasil = async () => {
    tombolHasil.disabled = true;
    T.show(hasilBox, '<p class="mut">Mengambil hasil balapan terakhir…</p>');
    try {
      const j = await getJSON(API_ERGAST + '/current/last/results.json');
      const balapan = j && j.MRData && j.MRData.RaceTable && j.MRData.RaceTable.Races && j.MRData.RaceTable.Races[0];
      const hasil = (balapan && balapan.Results) || [];
      if (!hasil.length) {
        T.show(hasilBox, '<p class="center dim">Belum ada hasil balapan musim ini.</p>');
        return;
      }
      hasilSudahDimuat = true;
      T.show(hasilBox, '<p style="margin-top:6px"><b>Hasil: ' + esc(balapan.raceName || 'Balapan terakhir') + '</b> <span class="hint">' + esc(utils.tglCantik(balapan.date, { tglSaja: true })) + '</span></p>' +
        hasil.slice(0, 10).map((h) => {
          const p = h.Driver || {};
          const tim = (h.Constructor && h.Constructor.name) || '';
          return '<div class="kv"><span class="k"><b>' + esc(String(h.position || '')) + '. ' + esc((p.givenName || '') + ' ' + (p.familyName || '')) + '</b><br><span class="hint">' + esc(tim) + '</span></span>' +
            '<span class="v">' + esc((h.Time && h.Time.time) || h.status || '') + ' · ' + esc(String(h.points || 0)) + ' poin</span></div>';
        }).join('') +
        '<p class="hint">Sumber: Ergast (Jolpica), data resmi Formula 1. 10 besar ditampilkan.</p>');
    } catch (e) {
      T.show(hasilBox, errBox(e.name === 'AbortError'
        ? 'Waktu habis, server Ergast tidak merespons dalam 15 detik.'
        : 'Gagal mengambil hasil balapan. Cek koneksi internet, lalu coba lagi.'));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', muatHasil));
      hasilBox.appendChild(w);
    } finally {
      tombolHasil.disabled = false;
    }
  };

  const tombolHasil = T.btn('Lihat hasil balapan terakhir', muatHasil, true);

  // --- Halaman tab ---
  const jadwalPage = T.el('<div></div>');
  jadwalPage.appendChild(T.field('Musim', tahunS));
  jadwalPage.appendChild(T.row(T.btn('Lihat jadwal', muat, true)));
  jadwalPage.appendChild(box);
  jadwalPage.appendChild(detailBox);

  const hasilPage = T.el('<div hidden></div>');
  hasilPage.appendChild(T.el('<p class="note">Hasil balapan terakhir musim berjalan, 10 besar beserta waktunya dan poinnya.</p>'));
  hasilPage.appendChild(T.row(tombolHasil));
  hasilPage.appendChild(hasilBox);

  const tabBar = tabs([['Jadwal', 0], ['Hasil balapan', 1]], [jadwalPage, hasilPage]);
  // Hasil dimuat sekali saat tab Hasil pertama kali dibuka.
  const tabBtns = tabBar.querySelectorAll('button');
  if (tabBtns[1]) tabBtns[1].addEventListener('click', () => { if (!hasilSudahDimuat) muatHasil(); });

  root.appendChild(T.el('<p class="note">Jadwal seri Formula 1 per musim. Ketuk satu seri untuk melihat sesi latihannya, kualifikasi, balapan, dan siapa saja pembalapnya. Tab Hasil menampilkan siapa saja yang finis 10 besar di balapan terakhir. Ini jadwal dan data sesi, bukan hitungan waktu balapan yang sedang berjalan.</p>'));
  root.appendChild(tabBar);
  root.appendChild(jadwalPage);
  root.appendChild(hasilPage);
  muat();
}
