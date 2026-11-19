import { h as T, utils, fileInput } from '../../core.js';

// Netflix Wrapped: statistik nonton setahunmu dari file
// ViewingActivity.csv milikmu sendiri (unduh dari netflix.com > akun >
// View Activity > Download all). Tanpa data, tidak ada angka yang
// ditampilkan. Ekspor Netflix tidak berisi durasi, jadi total jam
// dihitung dari asumsi yang bisa kamu ubah (episode 45 menit, film
// 100 menit) dan SELALU dilabeli perkiraan. Semua diproses lokal.
export const meta = {"id": "netflix-wrapped", "name": "Netflix Wrapped", "cat": "fun", "icon": "🍿", "desc": "Rangkuman nonton Netflix setahunmu dari file ViewingActivity: jam nonton, serial teratas, dan binge terbesarmu. Datamu sendiri, diproses lokal.", "keywords": "netflix,wrapped,statistik,nonton,serial,binge,viewing activity,ekspor", "since": "6.19.0"};

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { parseCSV, hitungStreak } from '../../wrapped.js';
export { parseCSV, hitungStreak } from '../../wrapped.js';

// Judul Netflix serial: "Nama Serial: Season 1: Judul Episode",
// "Nama: Part 2: ...", "Nama: Chapter ...", "Nama: Volume ...".
// Kembalikan {serial: nama serial atau null, film: bool}.
export function pisahJudul(judul) {
  const m = String(judul || '').match(/^(.+?):\s*(Season|Part|Chapter|Volume|Koleksi|Musim)\s+\S+/i);
  if (m) return { serial: m[1].trim(), film: false };
  return { serial: null, film: true };
}

// Parser ViewingActivity.csv: kolom Title, Date (format tanggal
// Netflix: MM/DD/YY atau DD/MM/YYYY tergantung akun).
export function parseNetflix(teks) {
  const baris = parseCSV(teks);
  if (baris.length < 2) return null;
  const h = baris[0].map((c) => String(c).trim().toLowerCase());
  const iJudul = h.indexOf('title');
  const iTgl = h.indexOf('date');
  if (iJudul < 0 || iTgl < 0) return null;
  const out = [];
  for (let i = 1; i < baris.length; i++) {
    const r = baris[i];
    const judul = (r[iJudul] || '').trim();
    const tgl = normalisasiTanggal((r[iTgl] || '').trim());
    if (!judul || !tgl) continue;
    const p = pisahJudul(judul);
    out.push({ judul, tanggal: tgl, serial: p.serial, film: p.film });
  }
  return out.length ? out : null;
}

// Netflix memakai MM/DD/YY (akun US) atau DD/MM/YYYY. Heuristik:
// angka pertama > 12 pasti tanggal; kalau tidak, anggap MM/DD/YY
// (format bawaan ekspor Netflix). Kembalikan ISO YYYY-MM-DD atau ''.
export function normalisasiTanggal(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let a = Number(m[1]), b = Number(m[2]), th = Number(m[3]);
    if (th < 100) th += 2000;
    let bln, tgl;
    if (a > 12) { tgl = a; bln = b; } else { bln = a; tgl = b; }
    if (bln < 1 || bln > 12 || tgl < 1 || tgl > 31) return '';
    return th + '-' + String(bln).padStart(2, '0') + '-' + String(tgl).padStart(2, '0');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}


// Statistik dari daftar tontonan. tahunFilter 0 = semua tahun.
export function hitungStatistik(daftar, tahunFilter, menitEpisode, menitFilm) {
  const list = tahunFilter ? daftar.filter((f) => f.tanggal.slice(0, 4) === String(tahunFilter)) : daftar.slice();
  const episode = list.filter((f) => !f.film).length;
  const film = list.filter((f) => f.film).length;
  const perSerial = {};
  const perHari = {};
  const perBulan = {};
  for (const f of list) {
    if (f.serial) perSerial[f.serial] = (perSerial[f.serial] || 0) + 1;
    perHari[f.tanggal] = (perHari[f.tanggal] || 0) + 1;
    const b = f.tanggal.slice(0, 7);
    perBulan[b] = (perBulan[b] || 0) + 1;
  }
  const topSerial = Object.entries(perSerial).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topHari = Object.entries(perHari).sort((a, b) => b[1] - a[1])[0];
  const topBulan = Object.entries(perBulan).sort((a, b) => b[1] - a[1])[0];
  const menit = episode * (menitEpisode || 45) + film * (menitFilm || 100);
  return {
    total: list.length, episode, film,
    topSerial: topSerial.map(([nama, jumlah]) => ({ nama, jumlah })),
    binge: topHari ? { tanggal: topHari[0], jumlah: topHari[1] } : null,
    topBulan: topBulan ? { bulan: topBulan[0], jumlah: topBulan[1] } : null,
    streak: hitungStreak(list.map((f) => f.tanggal)),
    jamPerkiraan: menit / 60,
  };
}

const NAMA_BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtTanggalISO(iso) {
  const [th, bl, tg] = iso.split('-');
  return Number(tg) + ' ' + NAMA_BULAN[Number(bl)] + ' ' + th;
}

export function render(root) {
  const box = T.out();
  const tahunI = T.input('number', 'cth: 2026 (kosong = semua tahun)');
  const totalI = T.input('number', 'cth: 340');
  const serialI = T.ta(4, 'Satu serial per baris: Nama: jumlah episode\ncth: Breaking Bad: 62', '');
  const epI = T.input('number', 'cth: 45');
  epI.value = '45';
  const filmI = T.input('number', 'cth: 100');
  filmI.value = '100';
  const fi = fileInput('.csv');
  let daftar = null;

  const gambar = () => {
    if (!daftar) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Unggah file ViewingActivity.csv dari akun Netflix-mu, atau isi angka manual di atas lalu tekan "Lihat rangkumanku".<br><br>Cara dapat file-nya: buka netflix.com, masuk ke akunmu, buka Viewing Activity, tekan Download all di bawah halaman. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const tahunFilter = T.num(tahunI.value) || 0;
    const menitEp = T.num(epI.value) || 45;
    const menitFilm = T.num(filmI.value) || 100;
    const s = hitungStatistik(daftar, tahunFilter, menitEp, menitFilm);
    let html = '<div class="big center">' + T.fmt(Math.round(s.jamPerkiraan)) + '<span class="mut" style="font-size:15px"> jam nonton (perkiraan)</span></div>' +
      '<p class="center hint">' + T.fmt(s.total) + ' tayangan: ' + T.fmt(s.episode) + ' episode serial + ' + T.fmt(s.film) + ' film</p>';
    const info = [];
    if (s.streak) info.push('Streak ' + s.streak + ' hari berturut-turut nonton');
    if (s.binge) info.push('Binge terbesar ' + s.binge.jumlah + ' tayangan dalam sehari (' + fmtTanggalISO(s.binge.tanggal) + ')');
    if (info.length) html += '<p class="center hint">' + info.join(' · ') + '</p>';
    if (s.topSerial.length) {
      const maks = s.topSerial[0].jumlah;
      html += '<h3 style="margin-top:14px">Serial teratas</h3>' + s.topSerial.map((t) => {
        const pct = Math.max(2, Math.round((t.jumlah / maks) * 100));
        return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + T.esc(t.nama) + '</span><b>' + t.jumlah + ' episode</b></div>' +
          '<div style="height:8px;background:#ffffff14;border-radius:4px;margin-top:3px"><div style="height:8px;width:' + pct + '%;background:#fff;border-radius:4px"></div></div></div>';
      }).join('');
    }
    if (s.topBulan) {
      const [th, bl] = s.topBulan.bulan.split('-');
      html += '<div style="margin-top:12px"><div class="kv"><span class="k">Bulan paling banyak nonton</span><span class="v">' + NAMA_BULAN[Number(bl)] + ' ' + th + ' (' + s.topBulan.jumlah + ' tayangan)</span></div></div>';
    }
    html += '<p class="hint" style="margin-top:10px">Total jam itu perkiraan: episode dihitung ' + T.fmt(menitEp) + ' menit dan film ' + T.fmt(menitFilm) + ' menit, karena file ekspor Netflix tidak berisi durasi. Ubah angkanya di atas kalau serialmu kebanyakan berdurasi lain.</p>';
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
    x.fillText('Netflix Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman nonton setahunmu', 48, 118);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(Math.round(s.jamPerkiraan)), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('jam nonton (perkiraan)', 48, 285);
    let y = 380;
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    const baris = [T.fmt(s.total) + ' tayangan: ' + T.fmt(s.episode) + ' episode + ' + T.fmt(s.film) + ' film'];
    if (s.streak) baris.push('Streak: ' + s.streak + ' hari');
    if (s.binge) baris.push('Binge terbesar: ' + s.binge.jumlah + ' tayangan sehari');
    for (const b of baris) { x.fillText(b, 48, y); y += 56; }
    if (s.topSerial.length) {
      y += 30;
      x.fillText('Serial teratas:', 48, y); y += 48;
      x.font = '400 26px system-ui, sans-serif';
      for (const t of s.topSerial.slice(0, 5)) { x.fillText(String(t.nama).slice(0, 30), 48, y); x.fillStyle = '#a1a1aa'; x.fillText(t.jumlah + ' ep', 700, y); x.fillStyle = '#fff'; y += 44; }
    }
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('netflix-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const total = T.num(totalI.value);
    const list = serialI.value.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = s.match(/^(.*?):\s*([\d.,]+)\s*$/);
      if (!m) return null;
      const j = T.num(m[2]);
      return isFinite(j) && j > 0 ? { nama: m[1].trim(), jumlah: Math.round(j) } : null;
    }).filter(Boolean);
    if (!total && !list.length) { T.toast('Isi dulu total tayangan atau daftar serialnya'); return; }
    const tahunFilter = T.num(tahunI.value) || 0;
    const tahun = tahunFilter || new Date().getFullYear();
    const arr = [];
    let dibuat = 0;
    for (const s of list) {
      for (let i = 0; i < s.jumlah; i++) {
        arr.push({ judul: s.nama + ': Season 1: Episode ' + (i + 1), tanggal: tahun + '-01-01', serial: s.nama, film: false });
        dibuat++;
      }
    }
    const sisa = Math.max(0, (total || 0) - dibuat);
    for (let i = 0; i < sisa; i++) arr.push({ judul: '', tanggal: tahun + '-01-01', serial: null, film: true });
    daftar = arr;
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseNetflix(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini ViewingActivity.csv dari Netflix'); return; }
      daftar = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.length) + ' tayangan');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Unggah ViewingActivity.csv dari Netflix, atau isi manual. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Tahun yang dirangkum (opsional)', tahunI, 'Kosongkan untuk semua tahun.'));
  root.appendChild(T.field('Total tayangan setahun (manual)', totalI));
  root.appendChild(T.field('Serial teratas (manual, satu per baris)', serialI, 'Format: Nama serial: jumlah episode'));
  root.appendChild(T.field('Asumsi durasi 1 episode (menit)', epI));
  root.appendChild(T.field('Asumsi durasi 1 film (menit)', filmI));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah ViewingActivity.csv', () => fi.click())));
  root.appendChild(box);
  gambar();
}
