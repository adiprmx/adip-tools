import { h as T, esc, errBox, utils } from '../../core.js';

// Jadwal dan hasil Formula 1 lewat Ergast (Jolpica), tanpa key.
// Terverifikasi 17 Nov 2026: /ergast/f1/current.json?limit=1 -> 200, CORS *.
// Jadwal dan hasil diambil terpisah, masing-masing satu panggilan per aksi.
export const meta = {"id":"jadwal-hasil-f1","name":"Jadwal & Hasil F1","cat":"liveapi","icon":"🏎️","desc":"Jadwal balapan Formula 1 musim berjalan dan hasil balapan terakhir.","keywords":"f1,formula 1,balapan,jadwal f1,hasil f1,grand prix,motorsport","since":"6.17.0"};

const API = 'https://api.jolpi.ca/ergast/f1';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js) — dipakai dengan
// { tglSaja: true } (tanggal saja, tengah malam lokal).

export function render(root) {
  const box = T.out();
  const hasilBox = T.out();
  const tombolHasil = T.btn('🏁 Lihat hasil balapan terakhir', () => muatHasil());

  const gagal = (target, pesan, ulang) => {
    T.show(target, errBox(pesan));
    const wr = T.el('<div style="margin-top:8px"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    target.appendChild(wr);
  };

  const muatJadwal = async () => {
    T.show(box, '<p class="mut">Mengambil jadwal F1 musim berjalan…</p>');
    try {
      const j = await getJSON(API + '/current.json?limit=30');
      const tabel = j && j.MRData && j.MRData.RaceTable;
      const balapan = (tabel && tabel.Races) || [];
      if (!balapan.length) {
        T.show(box, '<p class="center dim">Jadwal musim ini belum tersedia di Ergast.</p>');
        return;
      }
      T.show(box, '<p class="hint">Musim ' + esc(tabel.season || '') + ', ' + balapan.length + ' balapan</p>' + balapan.map((r) => {
        const sirkuit = r.Circuit || {};
        const lokasi = sirkuit.Location || {};
        return '<div class="kv"><span class="k"><b>' + esc(r.raceName || 'Balapan') + '</b><br><span class="hint">' +
          esc(sirkuit.circuitName || '') + (lokasi.locality ? ' · ' + esc(lokasi.locality) : '') + (lokasi.country ? ', ' + esc(lokasi.country) : '') +
          '</span></span><span class="v">' + esc(utils.tglCantik(r.date, { tglSaja: true })) + '</span></div>';
      }).join('') + '<p class="hint">Sumber: Ergast (Jolpica), data resmi Formula 1.</p>');
    } catch (e) {
      gagal(box, e.name === 'AbortError'
        ? 'Waktu habis, server Ergast tidak merespons dalam 15 detik.'
        : 'Gagal mengambil jadwal F1. Cek koneksi internet, lalu coba lagi.', muatJadwal);
    }
  };

  const muatHasil = async () => {
    tombolHasil.disabled = true;
    T.show(hasilBox, '<p class="mut">Mengambil hasil balapan terakhir…</p>');
    try {
      const j = await getJSON(API + '/current/last/results.json');
      const balapan = j && j.MRData && j.MRData.RaceTable && j.MRData.RaceTable.Races && j.MRData.RaceTable.Races[0];
      const hasil = (balapan && balapan.Results) || [];
      if (!hasil.length) {
        T.show(hasilBox, '<p class="center dim">Belum ada hasil balapan musim ini.</p>');
        return;
      }
      T.show(hasilBox, '<p style="margin-top:14px"><b>Hasil: ' + esc(balapan.raceName || 'Balapan terakhir') + '</b> <span class="hint">' + esc(utils.tglCantik(balapan.date, { tglSaja: true })) + '</span></p>' +
        hasil.slice(0, 10).map((h) => {
          const p = h.Driver || {};
          const tim = (h.Constructor && h.Constructor.name) || '';
          return '<div class="kv"><span class="k"><b>' + esc(String(h.position || '')) + '. ' + esc((p.givenName || '') + ' ' + (p.familyName || '')) + '</b><br><span class="hint">' + esc(tim) + '</span></span>' +
            '<span class="v">' + esc((h.Time && h.Time.time) || h.status || '') + ' · ' + esc(String(h.points || 0)) + ' poin</span></div>';
        }).join(''));
    } catch (e) {
      gagal(hasilBox, e.name === 'AbortError'
        ? 'Waktu habis, server Ergast tidak merespons dalam 15 detik.'
        : 'Gagal mengambil hasil balapan. Cek koneksi internet, lalu coba lagi.', muatHasil);
    } finally { tombolHasil.disabled = false; }
  };

  root.appendChild(T.el('<p class="note">Jadwal balapan Formula 1 musim berjalan. Ketuk tombol di bawah daftar untuk melihat hasil balapan terakhir.</p>'));
  root.appendChild(box);
  root.appendChild(T.row(tombolHasil));
  root.appendChild(hasilBox);
  muatJadwal();
}
