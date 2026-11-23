import { h as T, esc, errBox } from '../../core.js';

// Info tim olahraga dunia lewat TheSportsDB, pakai test key publik "123"
// (tanpa daftar). Terverifikasi 19 Nov 2026: key MASIH HIDUP,
// /api/v1/json/123/searchteams.php?t=Arsenal -> 200, CORS *.
// PERINGATAN: provider bisa menonaktifkan key ini sewaktu-waktu (key "3"
// sudah pernah dimatikan). Karena itu tool ini menyediakan kolom kunci
// sendiri: pengguna bisa daftar gratis di thesportsdb.com, masukkan kuncinya,
// dan tool memakai kunci itu (tersimpan di perangkat saja). Bila kunci bawaan
// mati, pesan gagalnya menyebut itu dengan jelas, bukan data karangan.
export const meta = {"id":"info-tim-olahraga","name":"Info Tim Olahraga","cat":"liveapi","icon":"🏟️","desc":"Cari tim olahraga dunia dan lihat stadion, tahun berdiri, dan liganya.","keywords":"tim,olahraga,sepak bola,basket,klub,stadion,liga","since":"6.19.0", "online": true};

const KEY_BAWAAN = '123';
const KEY_LS = 'at-info-tim-olahraga-key-v1';

export function kunciAktif() {
  try { return (localStorage.getItem(KEY_LS) || '').trim() || KEY_BAWAAN; } catch (e) { return KEY_BAWAAN; }
}
export function simpanKunci(k) {
  try {
    const v = String(k || '').trim();
    if (v) localStorage.setItem(KEY_LS, v);
    else localStorage.removeItem(KEY_LS);
  } catch (e) {}
}
export function urlCariTim(q) {
  return 'https://www.thesportsdb.com/api/v1/json/' + encodeURIComponent(kunciAktif()) + '/searchteams.php?t=' + encodeURIComponent(q);
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;
const teksAman = (u) => typeof u === 'string' && (u.indexOf('https://') === 0 || u.indexOf('http://') === 0);

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Arsenal, Lakers, Real Madrid');
  inp.setAttribute('autocomplete', 'off');
  const detailBox = T.out();
  let hasil = null;

  const tampilDetail = (t) => {
    const desk = typeof t.strDescriptionEN === 'string' ? t.strDescriptionEN : '';
    T.show(detailBox,
      '<div class="center">' +
      (gambarAman(t.strTeamBadge) ? '<img src="' + esc(t.strTeamBadge) + '" alt="Logo tim" style="width:110px;max-width:40%;height:auto" loading="lazy" data-err="hide">' : '') +
      '<div style="font-weight:800;font-size:20px;margin-top:8px">' + esc(t.strTeam || '-') + '</div>' +
      '<div class="dim">' + esc(t.strSport || '') + (t.strLeague ? ' di ' + esc(t.strLeague) : '') + '</div></div>' +
      (t.intFormedYear ? '<div class="kv"><span class="k">Berdiri</span><span class="v">' + esc(String(t.intFormedYear)) + '</span></div>' : '') +
      (t.strStadium ? '<div class="kv"><span class="k">Stadion</span><span class="v">' + esc(t.strStadium) + '</span></div>' : '') +
      (t.strStadiumLocation ? '<div class="kv"><span class="k">Lokasi stadion</span><span class="v">' + esc(t.strStadiumLocation) + '</span></div>' : '') +
      (t.strCountry ? '<div class="kv"><span class="k">Negara</span><span class="v">' + esc(t.strCountry) + '</span></div>' : '') +
      (t.strTeamAlternate ? '<div class="kv"><span class="k">Nama lain</span><span class="v">' + esc(t.strTeamAlternate) + '</span></div>' : '') +
      (desk ? '<p style="font-size:13px;line-height:1.6;margin-top:10px">' + esc(desk.slice(0, 600)) + (desk.length > 600 ? '…' : '') + '</p>' : '') +
      (teksAman(t.strWebsite) ? '<p style="margin-top:8px"><a href="' + esc(t.strWebsite.indexOf('http') === 0 ? t.strWebsite : 'https://' + t.strWebsite) + '" target="_blank" rel="noopener" style="font-size:12.5px">Situs resmi tim</a></p>' : '') +
      '<p class="hint">Sumber: TheSportsDB.</p>');
    T.wireImgErr(detailBox);
  };

  const tampilDaftar = () => {
    let html = '<p class="hint">' + hasil.length + ' tim ditemukan. Ketuk nama untuk melihat detail.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    hasil.forEach((t, i) => {
      html += '<button type="button" class="btn" data-tim="' + i + '">' + esc(t.strTeam || '-') + '</button>';
    });
    html += '</div>';
    T.show(box, html);
    box.querySelectorAll('[data-tim]').forEach((b) => {
      b.addEventListener('click', () => tampilDetail(hasil[parseInt(b.getAttribute('data-tim'), 10)]));
    });
  };

  const cari = async () => {
    const q = inp.value.trim();
    if (!q) {
      T.show(box, errBox('Tulis dulu nama timnya.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari tim…</p>');
    T.show(detailBox, '');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    let status = 0;
    try {
      const r = await fetch(urlCariTim(q), { signal: c.signal });
      status = r.status;
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const list = j && Array.isArray(j.teams) ? j.teams.filter(Boolean) : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada tim bernama "' + esc(q) + '". Coba nama lain atau ejaan lain.</p>');
        return;
      }
      hasil = list;
      tampilDaftar();
      if (list.length === 1) tampilDetail(list[0]);
      else T.show(detailBox, '<p class="center dim">Pilih tim di atas untuk melihat detailnya.</p>');
    } catch (e) {
      const pakaiKunciSendiri = kunciAktif() !== KEY_BAWAAN;
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu habis, server tidak bisa dihubungi dalam 20 detik.';
      else if (status === 401 || status === 403) {
        msg = pakaiKunciSendiri
          ? 'Kunci yang kamu masukkan ditolak server. Periksa lagi kuncinya, atau kosongkan kolom kunci untuk kembali ke kunci bawaan.'
          : 'Kunci bawaan alat ini sudah tidak berlaku lagi (kunci uji publik bisa dimatikan penyedia kapan saja). Masukkan kunci TheSportsDB-mu sendiri di bawah, atau coba lagi nanti.';
      } else if (status >= 500) msg = 'Server TheSportsDB sedang bermasalah. Coba lagi sebentar.';
      else msg = 'Gagal mencari tim. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  const kunciInp = T.input('text', 'Kosong = pakai kunci bawaan');
  kunciInp.setAttribute('autocomplete', 'off');
  try { const tersimpan = localStorage.getItem(KEY_LS) || ''; if (tersimpan) kunciInp.value = tersimpan; } catch (e) {}
  const simpanKunciBtn = T.btn('Simpan kunci', () => {
    simpanKunci(kunciInp.value);
    T.toast(kunciInp.value.trim() ? 'Kunci tersimpan di perangkat ini.' : 'Kembali memakai kunci bawaan.');
  });

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis nama tim olahraga apa pun, dari sepak bola sampai basket, lalu ketuk Cari.</p>'));
  root.appendChild(T.field('Nama tim', inp));
  root.appendChild(T.row(T.btn('🔍 Cari tim', cari, true)));
  root.appendChild(box);
  root.appendChild(detailBox);
  root.appendChild(T.field('Kunci API sendiri (opsional)', kunciInp, 'Alat ini memakai kunci uji publik yang bisa dimatikan penyedia kapan saja. Kalau suatu hari pencarian gagal terus, daftar gratis di thesportsdb.com, masukkan kuncimu di sini, lalu ketuk Simpan kunci. Kunci hanya tersimpan di perangkatmu.'));
  root.appendChild(T.row(simpanKunciBtn));
  T.show(box, '<p class="center dim">Belum ada yang dicari. Coba tulis Arsenal lalu ketuk Cari tim.</p>');
}
