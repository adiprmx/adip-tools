import { h as T, fileInput } from '../../core.js';

export const meta = {"id": "statistik-spotify-tahunan", "name": "Statistik Spotify Tahunan", "cat": "fun", "icon": "🎧", "desc": "Rangkuman setahun Spotify-mu: menit dengar, artis dan lagu teratas, dari file ekspor atau isi manual.", "keywords": "spotify,wrapped,statistik,musik,artis,lagu,menit,ekspor,tahunan", "since": "6.19.0"};

/* Parser file ekspor Spotify (Settings > Privacy > Request your data).
   Mendukung dua bentuk: extended streaming history (endsong_*.json:
   master_metadata_track_name, master_metadata_album_artist_name,
   ms_played, ts) dan streaming history lama (StreamingHistory_music_*.json:
   trackName, artistName, msPlayed, endTime). Hanya putaran yang benar-benar
   diputar (ms_played > 0) yang dihitung. */
export function parseSpotifyJson(teks) {
  let data;
  try { data = JSON.parse(teks); } catch (e) { return null; }
  if (!Array.isArray(data) || !data.length) return null;
  const artis = new Map(), lagu = new Map();
  let totalMs = 0, totalPutar = 0;
  for (const r of data) {
    if (!r || typeof r !== 'object') continue;
    const ms = Number(r.ms_played ?? r.msPlayed);
    if (!Number.isFinite(ms) || ms <= 0) continue;
    const a = String(r.master_metadata_album_artist_name ?? r.artistName ?? '').trim() || 'Artis tidak diketahui';
    const j = String(r.master_metadata_track_name ?? r.trackName ?? '').trim() || 'Lagu tidak diketahui';
    totalMs += ms; totalPutar++;
    artis.set(a, (artis.get(a) || 0) + ms);
    const kunci = j + ' - ' + a;
    const lama = lagu.get(kunci) || { judul: j, artis: a, putar: 0, ms: 0 };
    lama.putar++; lama.ms += ms;
    lagu.set(kunci, lama);
  }
  return agregasiPutar(artis, lagu, totalMs, totalPutar);
}

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { parseDaftarNilai as parseDaftarTeks, hitungRingkasan, barisBatang, agregasiPutar } from '../../wrapped.js';
export { parseDaftarNilai as parseDaftarTeks, hitungRingkasan } from '../../wrapped.js';



export function render(root) {
  const box = T.out();
  const menitI = T.input('number', 'cth: 32450');
  const artisI = T.ta(5, 'Taylor Swift: 4200\nHindia: 3100\n...', '');
  const laguI = T.ta(5, 'Judul lagu - Nama artis: 87\n...', '');
  const fi = fileInput('.json');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi menit dan daftar di atas lalu tekan "Lihat statistikku", atau unggah file JSON ekspor Spotify.<br><br>Cara dapat file-nya: buka akun Spotify di web, masuk ke Pengaturan lalu Privasi, minta salinan datamu, dan unduh file yang namanya diawali endsong atau StreamingHistory. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const r = hitungRingkasan(data);
    const maksA = data.topArtis.length ? data.topArtis[0].menit : 0;
    const maksL = data.topLagu.length ? data.topLagu[0].putar : 0;
    let html = '<div class="big center">' + T.fmt(r.menit) + '<span class="mut" style="font-size:15px"> menit</span></div>' +
      '<p class="center hint">Sekitar ' + T.fmt(r.jam) + ' jam setahun, atau ' + T.fmt(r.perHari) + ' menit per hari. ' +
      'Setara kira-kira ' + T.fmt(r.setaraLagu) + ' lagu yang diputar.</p>';
    if (data.totalPutar) html += '<p class="center hint">' + T.fmt(data.totalPutar) + ' kali putar · ' + T.fmt(data.totalArtis) + ' artis · ' + T.fmt(data.totalLagu) + ' lagu</p>';
    if (data.topArtis.length) html += '<h3 style="margin-top:14px">Artis teratas</h3>' + data.topArtis.map((a) => barisBatang(a.nama, a.menit, maksA, 'mnt')).join('');
    if (data.topLagu.length) html += '<h3 style="margin-top:14px">Lagu teratas</h3>' + data.topLagu.map((l) => barisBatang(l.judul + ' - ' + l.artis, l.putar, maksL, 'x')).join('');
    T.show(box, html);
    const dl = T.btn('⬇️ Unduh kartu PNG', () => unduhKartu(), true);
    dl.style.marginTop = '14px';
    box.appendChild(dl);
  };

  const unduhKartu = () => {
    if (!data) return;
    const c = document.createElement('canvas');
    c.width = 900; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = '#171923'; x.fillRect(0, 0, 900, 1200);
    x.fillStyle = '#fff'; x.textAlign = 'left';
    x.font = '700 34px system-ui, sans-serif';
    x.fillText('Statistik Spotify Tahunan', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman setahunmu', 48, 118);
    const r = hitungRingkasan(data);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(r.menit), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('menit didengarkan', 48, 285);
    let y = 380;
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    x.fillText('Artis teratas', 48, y); y += 48;
    x.font = '400 26px system-ui, sans-serif';
    data.topArtis.forEach((a, i) => {
      x.fillStyle = '#fff'; x.fillText((i + 1) + '. ' + a.nama.slice(0, 32), 48, y);
      x.fillStyle = '#a1a1aa'; x.fillText(T.fmt(a.menit) + ' mnt', 700, y); y += 44;
    });
    y += 30;
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    x.fillText('Lagu teratas', 48, y); y += 48;
    x.font = '400 26px system-ui, sans-serif';
    data.topLagu.forEach((l, i) => {
      x.fillStyle = '#fff'; x.fillText((i + 1) + '. ' + (l.judul + ' - ' + l.artis).slice(0, 32), 48, y);
      x.fillStyle = '#a1a1aa'; x.fillText(l.putar + 'x', 700, y); y += 44;
    });
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('statistik-spotify-tahunan.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const menit = T.num(menitI.value);
    const artis = parseDaftarTeks(artisI.value).map((a) => ({ nama: a.nama, menit: a.nilai }))
      .sort((x, y) => y.menit - x.menit).slice(0, 5);
    const lagu = parseDaftarTeks(laguI.value).map((l) => {
      const pisah = l.nama.split(' - ');
      return pisah.length > 1 ? { judul: pisah.slice(0, -1).join(' - ').trim(), artis: pisah[pisah.length - 1].trim(), putar: l.nilai } : { judul: l.nama, artis: '', putar: l.nilai };
    }).sort((x, y) => y.putar - x.putar).slice(0, 5);
    if (!menit && !artis.length && !lagu.length) {
      T.toast('Isi dulu menit atau salah satu daftarnya');
      return;
    }
    const totalDariArtis = artis.reduce((s, a) => s + a.menit, 0);
    data = { totalMenit: menit || totalDariArtis, totalPutar: 0, totalArtis: artis.length, totalLagu: lagu.length, topArtis: artis, topLagu: lagu };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseSpotifyJson(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini file endsong atau StreamingHistory dari Spotify'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.totalPutar) + ' kali putar');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah file JSON ekspor Spotify supaya angka dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Total menit didengarkan setahun', menitI, 'Bisa dilihat di Spotify Wrapped tahunanmu, atau dari file ekspor.'));
  root.appendChild(T.field('Artis teratas (satu per baris)', artisI, 'Format: Nama artis: menit. Contoh: Hindia: 3100'));
  root.appendChild(T.field('Lagu teratas (satu per baris)', laguI, 'Format: Judul lagu - Artis: jumlah putar. Contoh: Evaluasi - Hindia: 87'));
  root.appendChild(T.row(T.btn('Lihat statistikku', dariManual, true), T.btn('📄 Unggah JSON ekspor', () => fi.click())));
  root.appendChild(box);
  gambar();
}
