import { h as T, errBox } from '../../core.js?v=6.12.1';

// Baca Al-Quran lewat API gratis AlQuran Cloud (tanpa key).
// Terverifikasi 14 Nov 2026: /v1/surah (114 surah), /v1/surah/1 (teks Arab),
// /v1/surah/1/id.indonesian (terjemahan Indonesia).
const API = 'https://api.alquran.cloud/v1';
const KEY = 'adip-tools-baca-quran-terakhir';

const loadLast = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const saveLast = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const meta = {"id": "baca-quran", "name": "Baca Al-Quran", "cat": "liveapi", "icon": "📖", "desc": "Baca Al-Quran per surah: teks Arab beserta terjemahan Indonesianya, dan tandai terakhir dibaca.", "keywords": "quran,alquran,surah,ayat,baca,terjemahan,arab,tilawah,mushaf", "since": "6.11.0"};
export function render(root) {
  const cariI = T.input('text', 'Cari surah, cth: Yasin atau 36…', '');
  const box = T.out();
  const daftarBox = T.out();
  let surahList = [];
  let sedangBuka = 0;
  const cacheSurah = new Map(); // nomor surah -> [arab, indo] (teks Quran tidak berubah, cache selama sesi)

  const tampilTerakhir = () => {
    const last = loadLast();
    if (!last) return '';
    return '<p class="center hint">Terakhir dibaca: <b>' + T.esc(last.nama) + '</b> (surah ' + last.nomor + ')' +
      (last.at ? ' · ' + new Date(last.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '') + '</p>';
  };

  const tampilDaftar = (filter) => {
    const q = String(filter || '').trim().toLowerCase();
    const list = !q ? surahList : surahList.filter((s) =>
      String(s.number) === q ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q));
    if (!list.length) {
      T.show(daftarBox, '<p class="center hint">Tidak ada surah yang cocok dengan pencarian itu. Coba kata lain atau nomor surah.</p>');
      return;
    }
    T.show(daftarBox, '<p class="hint" style="margin-top:12px">' + list.length + ' surah</p>' + list.map((s) =>
      '<div class="kv" data-surah="' + s.number + '" style="cursor:pointer" role="button" tabindex="0">' +
      '<span class="k"><b>' + s.number + '. ' + T.esc(s.englishName) + '</b><br><span class="hint">' + T.esc(s.englishNameTranslation) + ' · ' + s.numberOfAyahs + ' ayat · ' + (s.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah') + '</span></span>' +
      '<span class="v" style="font-size:20px" dir="rtl" lang="ar">' + T.esc(s.name) + '</span></div>'
    ).join(''));
    daftarBox.querySelectorAll('[data-surah]').forEach((el) => {
      const buka = () => bacaSurah(+el.getAttribute('data-surah'));
      el.addEventListener('click', buka);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buka(); } });
    });
  };

  const ambilDaftar = async () => {
    T.show(box, tampilTerakhir() + '<p class="mut">Mengambil daftar surah…</p>');
    T.hide(daftarBox);
    try {
      const j = await getJSON(API + '/surah');
      if (!j || !Array.isArray(j.data) || !j.data.length) throw new Error('bad-data');
      surahList = j.data;
      T.show(box, tampilTerakhir());
      tampilDaftar(cariI.value);
    } catch (e) {
      T.show(box, errBox('Daftar surah gagal diambil. Periksa koneksi internet, lalu coba lagi.') +
        '<p style="margin-top:10px"><button class="btn" id="bq-retry-list">Coba lagi</button></p>');
      const b = box.querySelector('#bq-retry-list');
      if (b) b.addEventListener('click', ambilDaftar);
    }
  };

  const bacaSurah = async (nomor) => {
    sedangBuka = nomor;
    const info = surahList.find((s) => s.number === nomor);
    T.hide(daftarBox);
    T.show(box, '<p class="mut">Mengambil surah ' + (info ? T.esc(info.englishName) : nomor) + '…</p>');
    const cached = cacheSurah.get(nomor);
    try {
      let arab, indo;
      if (cached) { [arab, indo] = cached; }
      else {
        [arab, indo] = await Promise.all([
          getJSON(API + '/surah/' + nomor),
          getJSON(API + '/surah/' + nomor + '/id.indonesian'),
        ]);
        cacheSurah.set(nomor, [arab, indo]);
      }
      if (sedangBuka !== nomor) return;
      const a = arab && arab.data;
      const ter = indo && indo.data;
      if (!a || !Array.isArray(a.ayahs) || !a.ayahs.length) throw new Error('bad-data');
      saveLast({ nomor: a.number, nama: a.englishName, at: Date.now() });
      const terMap = {};
      if (ter && Array.isArray(ter.ayahs)) ter.ayahs.forEach((ay) => { terMap[ay.numberInSurah] = ay.text; });
      T.show(box,
        '<p class="center"><b>' + a.number + '. ' + T.esc(a.englishName) + '</b> · ' + T.esc(a.englishNameTranslation) + '</p>' +
        '<p class="center" style="font-size:28px" dir="rtl" lang="ar">' + T.esc(a.name) + '</p>' +
        '<p class="center hint">' + a.numberOfAyahs + ' ayat · ' + (a.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah') + '</p>' +
        '<p style="margin:10px 0"><button class="btn" id="bq-kembali">← Kembali ke daftar</button></p>' +
        a.ayahs.map((ay) =>
          '<div style="border-top:1px solid #ffffff14;padding:14px 0">' +
          '<p style="text-align:right;font-size:22px;line-height:2" dir="rtl" lang="ar">' + T.esc(String(ay.text || '').trim()) + ' <span style="font-size:14px">﴿' + ay.numberInSurah + '﴾</span></p>' +
          (terMap[ay.numberInSurah] ? '<p class="hint" style="margin-top:6px">' + ay.numberInSurah + '. ' + T.esc(terMap[ay.numberInSurah]) + '</p>' : '') +
          '</div>'
        ).join('') +
        '<p class="hint">Teks Arab dan terjemahan Indonesia dari AlQuran Cloud.</p>');
      const kembali = box.querySelector('#bq-kembali');
      if (kembali) kembali.addEventListener('click', () => { sedangBuka = 0; T.show(box, tampilTerakhir()); tampilDaftar(cariI.value); });
    } catch (e) {
      if (sedangBuka !== nomor) return;
      T.show(box, errBox('Surah gagal diambil. Periksa koneksi internet, lalu coba lagi.') +
        '<p style="margin-top:10px"><button class="btn" id="bq-retry-surah">Coba lagi</button> <button class="btn" id="bq-back2">Kembali ke daftar</button></p>');
      const r = box.querySelector('#bq-retry-surah');
      if (r) r.addEventListener('click', () => bacaSurah(nomor));
      const b2 = box.querySelector('#bq-back2');
      if (b2) b2.addEventListener('click', () => { sedangBuka = 0; T.show(box, tampilTerakhir()); tampilDaftar(cariI.value); });
    }
  };

  cariI.addEventListener('input', () => { if (sedangBuka === 0 && surahList.length) tampilDaftar(cariI.value); });
  root.appendChild(T.el('<p class="note">Daftar 114 surah. Ketuk salah satu untuk membaca teks Arab beserta terjemahan Indonesianya. Butuh internet karena teks diambil langsung dari AlQuran Cloud.</p>'));
  root.appendChild(T.field('Cari surah', cariI, 'Ketik nama atau nomor surah'));
  root.appendChild(box);
  root.appendChild(daftarBox);
  ambilDaftar();
}
