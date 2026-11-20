import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-covid-19-flu","name":"Data COVID-19","cat":"liveapi","icon":"🦠","desc":"Angka COVID-19 terbaru, seluruh dunia atau satu negara.","keywords":"covid,corona,statistik,virus,pandemi,negara","since":"6.18.0"};

// Statistik COVID-19 global dan per negara lewat disease.sh, tanpa key.
// Terverifikasi 18 Nov 2026: disease.sh/v3/covid-19/all -> 200, CORS *.
// Dicek ulang 19 Nov 2026: /all 200, /countries/indonesia 200.
// Catatan jujur: penyedia ini tidak punya endpoint flu (dicek 19 Nov 2026,
// /v3/influenza/all mengembalikan 404), jadi yang tampil saat ini data COVID-19.
// Dicek lagi 20 Nov 2026: belum ada pengganti flu gratis yang terverifikasi —
// satu-satunya kandidat (Delphi Epidata FluView, api.delphi.cmu.edu) hanya
// data Amerika Serikat, API lamanya sedang dihentikan, dan belum teruji dari
// browser. Karena itu tool ini tetap COVID-19 saja, dan UI-nya berkata begitu.
// ID "data-covid-19-flu" dipertahankan apa adanya supaya tautan/routing lama
// tidak putus; nama yang tampil ke pengguna adalah "Data COVID-19".
const API = 'https://disease.sh/v3/covid-19/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function urlNegara(nama) {
  return API + 'countries/' + encodeURIComponent(nama) + '?strict=false';
}

export function ringkasData(j) {
  if (!j || typeof j !== 'object' || typeof j.cases !== 'number') return null;
  return {
    nama: typeof j.country === 'string' ? j.country : 'Dunia',
    kasus: j.cases,
    kasusHariIni: j.todayCases || 0,
    meninggal: j.deaths,
    meninggalHariIni: j.todayDeaths || 0,
    sembuh: j.recovered,
    aktif: j.active,
    kritis: j.critical,
    diperbarui: typeof j.updated === 'number' ? j.updated : null,
  };
}

const fmtAngka = (v) => (typeof v === 'number' ? v.toLocaleString('id-ID') : '-');
const fmtWaktu = (ms) => {
  if (!ms) return '-';
  const d = new Date(ms);
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export function render(root) {
  const box = T.out();
  const modeSel = T.select([['global', 'Seluruh dunia'], ['negara', 'Satu negara']], 'global');
  const inp = T.input('text', 'Contoh: Indonesia, Japan, Brazil');
  inp.setAttribute('autocomplete', 'off');
  const bungkusNegara = T.field('Nama negara', inp, 'Nama negara dalam bahasa Inggris');

  const tampil = (hasil) => {
    T.show(box,
      '<div class="center"><div style="font-weight:800;font-size:17px">COVID-19 di ' + esc(hasil.nama) + '</div>' +
      '<div class="dim" style="font-size:12.5px;margin-top:2px">Data diperbarui ' + esc(fmtWaktu(hasil.diperbarui)) + '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">' +
      '<div><div class="dim" style="font-size:12px">Total kasus</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.kasus)) + '</div></div>' +
      '<div><div class="dim" style="font-size:12px">Kasus baru hari ini</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.kasusHariIni)) + '</div></div>' +
      '<div><div class="dim" style="font-size:12px">Meninggal</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.meninggal)) + '</div></div>' +
      '<div><div class="dim" style="font-size:12px">Sembuh</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.sembuh)) + '</div></div>' +
      '<div><div class="dim" style="font-size:12px">Masih sakit</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.aktif)) + '</div></div>' +
      '<div><div class="dim" style="font-size:12px">Kondisi kritis</div><div style="font-weight:700;font-size:16px">' + esc(fmtAngka(hasil.kritis)) + '</div></div>' +
      '</div>' +
      '<p class="hint">Sumber: disease.sh (data COVID-19). Angka adalah total sejak awal pandemi, bukan hanya tahun ini.</p>');
  };

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', lihat));
    box.appendChild(w);
  };

  const lihat = async () => {
    const mode = modeSel.value;
    let url = API + 'all';
    if (mode === 'negara') {
      const nama = String(inp.value || '').trim();
      if (!nama) { T.show(box, errBox('Tulis nama negara dulu, contoh: Indonesia.')); return; }
      url = urlNegara(nama);
    }
    T.show(box, '<p class="mut">Mengambil data terbaru…</p>');
    try {
      const hasil = ringkasData(await getJSON(url));
      if (!hasil) throw new Error('bad-data');
      tampil(hasil);
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Negara tidak ditemukan. Coba ejaan bahasa Inggrisnya, contoh: Japan, United States.</p>');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data tidak merespons dalam 10 detik.'
        : 'Gagal mengambil data. Cek koneksi internet, lalu coba lagi.');
    }
  };

  modeSel.addEventListener('change', () => {
    bungkusNegara.hidden = modeSel.value !== 'negara';
  });
  bungkusNegara.hidden = true;
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') lihat(); });
  root.appendChild(T.el('<p class="note">Lihat angka COVID-19 terbaru, seluruh dunia atau satu negara. Data flu belum tersedia — penyedia ini tidak punya data flu, dan belum ada sumber flu gratis lain yang terverifikasi.</p>'));
  root.appendChild(T.field('Cakupan data', modeSel));
  root.appendChild(bungkusNegara);
  root.appendChild(T.row(T.btn('Lihat data', lihat, true)));
  root.appendChild(box);
  lihat();
}
