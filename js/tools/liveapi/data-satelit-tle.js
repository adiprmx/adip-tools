import { h as T, esc, errBox, preHtml } from '../../core.js';

// Data orbit satelit (TLE) lewat CelesTrak (tanpa key).
// Terverifikasi 18 Nov 2026: celestrak.org/NORAD/elements/gp.php 200, CORS *.
const API = 'https://celestrak.org/NORAD/elements/gp.php';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function angka(v, digit) {
  const n = Number(v);
  const d = digit == null ? 4 : digit;
  return isFinite(n) ? n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'tidak ada data';
}

export const meta = {"id": "data-satelit-tle", "name": "Data Satelit TLE", "cat": "liveapi", "icon": "🛰️", "desc": "Data orbit satelit terkini (TLE): ISS, Hubble, dan satelit lain dari nomor katalognya.", "keywords": "satelit,tle,orbit,iss,celestrak,norad,stasiun luar angkasa", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const catI = T.input('number', 'Nomor katalog, contoh: 25544', '25544');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const catnr = String(catI.value || '').trim();
    if (!/^\d+$/.test(catnr)) {
      T.show(box, errBox('Nomor katalog diisi angka saja, contoh: 25544 untuk ISS.'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil data orbit satelit nomor ' + esc(catnr) + '…</p>');
    try {
      const j = await getJSON(API + '?CATNR=' + encodeURIComponent(catnr) + '&FORMAT=json');
      const s = Array.isArray(j) && j.length ? j[0] : null;
      if (!s || !s.OBJECT_NAME) {
        T.show(box, '<p class="center dim">Tidak ada satelit dengan nomor katalog itu. Periksa nomornya, contoh: 25544 (ISS) atau 20580 (Hubble).</p>');
        return;
      }
      const periode = Number(s.MEAN_MOTION) ? (1440 / Number(s.MEAN_MOTION)).toFixed(1) : null;
      T.show(box, '<div class="center"><div style="font-weight:800;font-size:16px">' + esc(String(s.OBJECT_NAME)) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:4px">Nomor katalog ' + esc(String(s.NORAD_CAT_ID || catnr)) +
        (s.OBJECT_ID ? ' · ' + esc(String(s.OBJECT_ID)) : '') +
        (s.EPOCH ? '<br>Data orbit per ' + esc(String(s.EPOCH).replace('T', ' ').slice(0, 19)) + ' UTC' : '') + '</div></div>' +
        '<div class="kv"><span class="k">Kemiringan orbit</span><span class="v">' + esc(angka(s.INCLINATION, 2)) + ' derajat</span></div>' +
        '<div class="kv"><span class="k">Bentuk orbit (eksentrisitas)</span><span class="v">' + esc(angka(s.ECCENTRICITY, 6)) + '</span></div>' +
        '<div class="kv"><span class="k">Putaran per hari</span><span class="v">' + esc(angka(s.MEAN_MOTION, 3)) + ' kali</span></div>' +
        (periode ? '<div class="kv"><span class="k">Satu putaran penuh</span><span class="v">sekitar ' + esc(periode) + ' menit</span></div>' : '') +
        '<div class="kv"><span class="k">Titik naik orbit</span><span class="v">' + esc(angka(s.RA_OF_ASC_NODE, 2)) + ' derajat</span></div>' +
        '<div class="kv"><span class="k">Argumen perigee</span><span class="v">' + esc(angka(s.ARG_OF_PERICENTER, 2)) + ' derajat</span></div>' +
        (s.TLE_LINE1 && s.TLE_LINE2 ? '<p class="hint" style="margin-top:12px">Data TLE mentah (dua baris, untuk aplikasi pelacak satelit):</p>' +
          preHtml(String(s.TLE_LINE1) + '\n' + String(s.TLE_LINE2)) : '') +
        '<p class="hint">Sumber: CelesTrak. Data orbit diperbarui berkala oleh NORAD.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server CelesTrak tidak merespons dalam 15 detik.'
        : 'Data satelit gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  const cepat = (nomor) => { catI.value = String(nomor); muat(); };
  catI.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(); });
  root.appendChild(T.el('<p class="note">Data orbit satelit terkini. Isi nomor katalog satelitnya, atau pakai tombol cepat di bawah. Defaultnya ISS, stasiun luar angkasa.</p>'));
  root.appendChild(T.field('Nomor katalog (CATNR)', catI, 'Contoh: 25544 untuk ISS, 20580 untuk teleskop Hubble'));
  root.appendChild(T.row(T.btn('Lihat data orbit', muat, true), T.btn('ISS', () => cepat(25544)), T.btn('Hubble', () => cepat(20580)), T.btn('Tiangong', () => cepat(48274))));
  root.appendChild(box);
  muat();
}
