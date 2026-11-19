import { h as T, utils, fileInput } from '../../core.js';

// Letterboxd Wrapped: statistik film setahunmu dari data ekspor
// Letterboxd milikmu sendiri (watched.csv, ratings.csv, diary.csv).
// Ekspor Letterboxd berupa ZIP: ekstrak dulu, lalu unggah file CSV-nya
// di sini (bisa beberapa sekaligus). Tanpa data, tidak ada angka yang
// ditampilkan. Durasi total tidak ada di ekspor Letterboxd, jadi hanya
// tampil kalau kamu isi rata-rata durasi film sendiri, dan dilabeli
// perkiraan. Semua diproses lokal, file tidak dikirim ke mana-mana.
export const meta = {"id": "letterboxd-wrapped", "name": "Letterboxd Wrapped", "cat": "fun", "icon": "🎬", "desc": "Rangkuman film setahunmu dari ekspor Letterboxd: film ditonton, rating, favorit, dan streak. Datamu sendiri, diproses lokal.", "keywords": "letterboxd,wrapped,film,statistik,rating,diary,ekspor,sinema", "since": "6.19.0"};

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { parseCSV, hitungStreak } from '../../wrapped.js';
export { parseCSV, hitungStreak } from '../../wrapped.js';

function indeksHeader(baris, nama) {
  const h = baris[0].map((c) => String(c).trim().toLowerCase());
  return h.indexOf(nama.toLowerCase());
}

// Parser watched.csv / ratings.csv / diary.csv Letterboxd.
// Mengembalikan daftar {tanggal, judul, tahun, rating, like, rewatch}.
export function parseLetterboxd(teks) {
  const baris = parseCSV(teks);
  if (baris.length < 2) return null;
  const iTgl = indeksHeader(baris, 'Date');
  const iNama = indeksHeader(baris, 'Name');
  const iTahun = indeksHeader(baris, 'Year');
  const iRating = indeksHeader(baris, 'Rating');
  const iLike = indeksHeader(baris, 'Like');
  const iRewatch = indeksHeader(baris, 'Rewatch');
  if (iTgl < 0 || iNama < 0) return null;
  const out = [];
  for (let i = 1; i < baris.length; i++) {
    const r = baris[i];
    const judul = (r[iNama] || '').trim();
    if (!judul) continue;
    out.push({
      tanggal: (r[iTgl] || '').trim(),
      judul,
      tahun: iTahun >= 0 ? Number(r[iTahun]) : NaN,
      rating: iRating >= 0 ? Number(r[iRating]) : NaN,
      like: iLike >= 0 && String(r[iLike]).trim().toLowerCase() === 'yes',
      rewatch: iRewatch >= 0 && String(r[iRewatch]).trim().toLowerCase() === 'yes',
    });
  }
  return out.length ? out : null;
}


// Statistik dari daftar film. tahunFilter: 0 = semua tahun.
export function hitungStatistik(daftar, tahunFilter) {
  const list = tahunFilter ? daftar.filter((f) => {
    const t = (f.tanggal || '').slice(0, 4);
    return t === String(tahunFilter);
  }) : daftar.slice();
  const rating = list.map((f) => f.rating).filter((r) => isFinite(r) && r > 0);
  const rata = rating.length ? rating.reduce((s, x) => s + x, 0) / rating.length : NaN;
  const bintang5 = list.filter((f) => f.rating === 5 && f.judul);
  const dekade = {};
  const bulan = {};
  for (const f of list) {
    if (isFinite(f.tahun) && f.tahun > 1800) {
      const d = Math.floor(f.tahun / 10) * 10;
      dekade[d] = (dekade[d] || 0) + 1;
    }
    const b = (f.tanggal || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(b)) bulan[b] = (bulan[b] || 0) + 1;
  }
  const topDekade = Object.entries(dekade).sort((a, b) => b[1] - a[1])[0];
  const topBulan = Object.entries(bulan).sort((a, b) => b[1] - a[1])[0];
  const tontonUlang = list.filter((f) => f.rewatch).length;
  const suka = list.filter((f) => f.like).length;
  return {
    total: list.length,
    rataRating: rata,
    jumlahRating: rating.length,
    bintang5: bintang5.slice(0, 5).map((f) => f.judul),
    jumlahBintang5: bintang5.length,
    topDekade: topDekade ? { dekade: Number(topDekade[0]), jumlah: topDekade[1] } : null,
    topBulan: topBulan ? { bulan: topBulan[0], jumlah: topBulan[1] } : null,
    streak: hitungStreak(list.map((f) => f.tanggal)),
    tontonUlang,
    suka,
  };
}

const NAMA_BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function render(root) {
  const box = T.out();
  const tahunI = T.input('number', 'cth: 2026 (kosong = semua tahun)');
  const totalI = T.input('number', 'cth: 120');
  const rataI = T.input('text', 'cth: 3,8');
  const favI = T.ta(4, 'Satu film favorit per baris\ncth: Parasite', '');
  const durI = T.input('number', 'cth: 105 (boleh kosong)');
  const fi = fileInput('.csv');
  fi.multiple = true;
  let daftar = null;

  const gambar = () => {
    if (!daftar) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Unggah file CSV dari ekspor Letterboxd-mu, atau isi angka manual di atas lalu tekan "Lihat rangkumanku".<br><br>Cara dapat file-nya: buka letterboxd.com/settings/data, tekan Export Your Data, tunggu emailnya, unduh dan ekstrak ZIP-nya, lalu unggah watched.csv, ratings.csv, atau diary.csv di sini. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const tahunFilter = T.num(tahunI.value) || 0;
    const s = hitungStatistik(daftar, tahunFilter);
    const dur = T.num(durI.value);
    let html = '<div class="big center">' + T.fmt(s.total) + '<span class="mut" style="font-size:15px"> film ditonton</span></div>';
    const info = [];
    if (isFinite(s.rataRating)) info.push('Rating rata-rata ' + utils.r4(s.rataRating) + ' dari ' + s.jumlahRating + ' film');
    if (s.streak) info.push('Streak ' + s.streak + ' hari berturut-turut nonton');
    if (s.tontonUlang) info.push(T.fmt(s.tontonUlang) + ' kali nonton ulang');
    if (s.suka) info.push(T.fmt(s.suka) + ' film disukai');
    if (info.length) html += '<p class="center hint">' + info.join(' · ') + '</p>';
    html += '<div style="margin-top:12px">';
    if (s.topDekade) html += '<div class="kv"><span class="k">Dekade terbanyak ditonton</span><span class="v">' + s.topDekade.dekade + '-an (' + s.topDekade.jumlah + ' film)</span></div>';
    if (s.topBulan) {
      const [th, bl] = s.topBulan.bulan.split('-');
      html += '<div class="kv"><span class="k">Bulan paling rajin nonton</span><span class="v">' + NAMA_BULAN[Number(bl)] + ' ' + th + ' (' + s.topBulan.jumlah + ' film)</span></div>';
    }
    if (isFinite(dur) && dur > 0) html += '<div class="kv"><span class="k">Perkiraan total durasi</span><span class="v">sekitar ' + T.fmt(Math.round((s.total * dur) / 60)) + ' jam</span></div>';
    html += '</div>';
    if (s.bintang5.length) {
      html += '<h3 style="margin-top:14px">Bintang 5 (' + s.jumlahBintang5 + ')</h3><p class="hint">' + s.bintang5.map((j) => T.esc(j)).join('<br>') + '</p>';
    }
    if (isFinite(dur) && dur > 0) html += '<p class="hint">Total durasi itu perkiraan: jumlah film dikali rata-rata durasi yang kamu isi (' + T.fmt(dur) + ' menit), karena ekspor Letterboxd tidak berisi durasi film.</p>';
    T.show(box, html);
    const dl = T.btn('⬇️ Unduh kartu PNG', () => unduhKartu(s), true);
    dl.style.marginTop = '14px';
    box.appendChild(dl);
  };

  const unduhKartu = (s) => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = '#171923'; x.fillRect(0, 0, 900, 1200);
    x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '700 34px system-ui, sans-serif';
    x.fillText('Letterboxd Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman film setahunmu', 48, 118);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(s.total), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('film ditonton', 48, 285);
    let y = 380;
    const baris = [];
    if (isFinite(s.rataRating)) baris.push('Rating rata-rata: ' + utils.r4(s.rataRating));
    if (s.streak) baris.push('Streak terpanjang: ' + s.streak + ' hari');
    if (s.topDekade) baris.push('Dekade favorit: ' + s.topDekade.dekade + '-an');
    if (s.jumlahBintang5) baris.push('Film bintang 5: ' + s.jumlahBintang5);
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    for (const b of baris) { x.fillText(b, 48, y); y += 56; }
    if (s.bintang5.length) {
      y += 30;
      x.fillText('Bintang 5:', 48, y); y += 48;
      x.font = '400 26px system-ui, sans-serif';
      for (const j of s.bintang5.slice(0, 5)) { x.fillText('★ ' + String(j).slice(0, 34), 48, y); y += 44; }
    }
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('letterboxd-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const total = T.num(totalI.value);
    const rata = T.num(rataI.value);
    const fav = favI.value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!total && !isFinite(rata) && !fav.length) { T.toast('Isi dulu salah satu: total film, rating rata-rata, atau film favorit'); return; }
    const tahunFilter = T.num(tahunI.value) || 0;
    const tahun = tahunFilter || new Date().getFullYear();
    const list = [];
    for (let i = 0; i < (total || fav.length); i++) {
      list.push({ tanggal: tahun + '-01-01', judul: fav[i] || '', tahun: NaN, rating: isFinite(rata) ? rata : NaN, like: false, rewatch: false });
    }
    daftar = list;
    gambar();
  };

  fi.onchange = () => {
    const files = Array.from(fi.files || []);
    fi.value = '';
    if (!files.length) return;
    let gabung = [];
    let sisa = files.length;
    let gagal = 0;
    for (const f of files) {
      const rd = new FileReader();
      rd.onload = () => {
        const hasil = parseLetterboxd(String(rd.result || ''));
        if (hasil) gabung = gabung.concat(hasil);
        else gagal++;
        if (--sisa === 0) {
          if (!gabung.length) { T.toast('File tidak dikenali. Pastikan ini watched.csv, ratings.csv, atau diary.csv dari ekspor Letterboxd'); return; }
          const kunci = new Set();
          daftar = gabung.filter((x) => {
            const k = x.tanggal + '|' + x.judul;
            if (kunci.has(k)) return false;
            kunci.add(k);
            return true;
          });
          T.toast('Data dimuat: ' + T.fmt(daftar.length) + ' film' + (gagal ? ' (' + gagal + ' file tidak dikenali)' : ''));
          gambar();
        }
      };
      rd.onerror = () => { gagal++; if (--sisa === 0 && gabung.length) { daftar = gabung; gambar(); } };
      rd.readAsText(f);
    }
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Unggah CSV dari ekspor Letterboxd, atau isi manual. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Tahun yang dirangkum (opsional)', tahunI, 'Kosongkan untuk semua tahun.'));
  root.appendChild(T.field('Total film ditonton (manual)', totalI));
  root.appendChild(T.field('Rating rata-rata (manual)', rataI, 'Skala 0,5 sampai 5.'));
  root.appendChild(T.field('Film favorit (manual, satu per baris)', favI));
  root.appendChild(T.field('Rata-rata durasi film, menit (opsional)', durI, 'Untuk perkiraan total durasi. Ekspor Letterboxd tidak berisi durasi.'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah CSV Letterboxd', () => fi.click())));
  root.appendChild(box);
  gambar();
}
