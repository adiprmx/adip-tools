import { h as T, fileInput } from '../../core.js';

export const meta = {"id": "strava-wrapped", "name": "Strava Wrapped", "cat": "fun", "icon": "🏃", "desc": "Rangkuman setahun Strava-mu: jarak, waktu gerak, dan olahraga teratas, dari file ekspor atau isi manual.", "keywords": "strava,wrapped,olahraga,laporan,lomba,jarak,ekspor,aktivitas", "since": "6.19.0"};

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
// hitungRingkasan + fmtDurasi file ini TETAP LOKAL: medannya berbeda
// dari kanon (jarak/jam/kecepatan, detik).
import { parseCsvBaris, barisBatang } from '../../wrapped.js';
export { parseCsvBaris } from '../../wrapped.js';

function angkaCsv(s) {
  const n = Number(String(s || '').trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/* Parser CSV ekspor Strava (Settings > Download or Delete Your Account >
   Request your archive, file activities.csv). Kolom dipakai: Activity Date,
   Activity Name, Activity Type, Distance, Moving Time, Elevation Gain.
   Jarak di file ekspor memakai satuan akun (biasanya km); waktu gerak
   dalam detik; elevasi dalam meter. */
export function parseStravaCsv(teks) {
  const rows = parseCsvBaris(teks).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length < 2) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const iTgl = head.indexOf('activity date');
  const iNama = head.indexOf('activity name');
  const iJenis = head.indexOf('activity type');
  const iJarak = head.indexOf('distance');
  const iWaktu = head.indexOf('moving time');
  const iNaik = head.indexOf('elevation gain');
  if (iJenis < 0 && iJarak < 0 && iWaktu < 0) return null;
  const perJenis = new Map();
  let totalJarak = 0, totalDetik = 0, totalNaik = 0, totalAktivitas = 0;
  let terpanjang = null;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const jarak = iJarak >= 0 ? angkaCsv(row[iJarak]) : 0;
    const detik = iWaktu >= 0 ? angkaCsv(row[iWaktu]) : 0;
    const naik = iNaik >= 0 ? angkaCsv(row[iNaik]) : 0;
    const jenis = iJenis >= 0 ? (row[iJenis] || '').trim() || 'Lainnya' : 'Lainnya';
    totalAktivitas++;
    totalJarak += jarak; totalDetik += detik; totalNaik += naik;
    const lama = perJenis.get(jenis) || { jenis, jumlah: 0, jarak: 0, detik: 0 };
    lama.jumlah++; lama.jarak += jarak; lama.detik += detik;
    perJenis.set(jenis, lama);
    if (!terpanjang || jarak > terpanjang.jarak) {
      terpanjang = {
        nama: iNama >= 0 ? (row[iNama] || '').trim() || 'Tanpa nama' : 'Tanpa nama',
        jenis,
        jarak,
        tanggal: iTgl >= 0 ? (row[iTgl] || '').trim() : '',
      };
    }
  }
  if (totalAktivitas === 0) return null;
  const topJenis = [...perJenis.values()].sort((a, b) => b.jarak - a.jarak).slice(0, 5);
  return { totalAktivitas, totalJarak, totalDetik, totalNaik, topJenis, terpanjang };
}

export function fmtDurasi(detik) {
  const d = Math.max(0, Math.round(detik || 0));
  const jam = Math.floor(d / 3600);
  const menit = Math.floor((d % 3600) / 60);
  if (jam > 0) return jam + ' jam ' + menit + ' mnt';
  if (menit > 0) return menit + ' mnt';
  return d + ' dtk';
}

export function hitungRingkasan(d) {
  const bulat4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };
  const jam = d.totalDetik / 3600;
  return {
    jarak: bulat4(d.totalJarak),
    jam: bulat4(jam),
    perMinggu: bulat4(d.totalJarak / 52),
    rataJarak: d.totalAktivitas > 0 ? bulat4(d.totalJarak / d.totalAktivitas) : 0,
    kecepatan: jam > 0 ? bulat4(d.totalJarak / jam) : 0,
  };
}


export function render(root) {
  const box = T.out();
  const jarakI = T.input('number', 'cth: 1250');
  const aktivitasI = T.input('number', 'cth: 180');
  const jamI = T.input('number', 'cth: 96');
  const jenisI = T.ta(5, 'Run: 800\nRide: 400\nWalk: 50\n...', '');
  const fi = fileInput('.csv');
  const selSatuan = T.select([['km', 'Kilometer (km)'], ['mil', 'Mil']], 'km');
  const fldJarak = T.field('Total jarak setahun (km)', jarakI);
  const labJarak = fldJarak.querySelector('label');
  const satuan = () => selSatuan.value;
  let data = null;

  const syncSatuan = () => {
    labJarak.textContent = 'Total jarak setahun (' + satuan() + ')';
    gambar();
  };
  selSatuan.addEventListener('change', syncSatuan);

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah file activities.csv dari ekspor Strava.<br><br>Cara dapat file-nya: buka strava.com, masuk ke Pengaturan lalu "Download or Delete Your Account", minta arsip datamu, lalu cari file activities.csv di dalamnya. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const r = hitungRingkasan(data);
    const maksJ = data.topJenis.length ? data.topJenis[0].jarak : 0;
    const s = satuan();
    let html = '<div class="big center">' + T.fmt(r.jarak) + '<span class="mut" style="font-size:15px"> ' + s + '</span></div>' +
      '<p class="center hint">' + T.fmt(data.totalAktivitas) + ' aktivitas · ' + fmtDurasi(data.totalDetik) + ' waktu gerak · ' +
      T.fmt(Math.round(data.totalNaik)) + ' m tanjakan.</p>' +
      '<p class="center hint">Rata-rata ' + T.fmt(r.perMinggu) + ' ' + s + ' per minggu, ' + T.fmt(r.rataJarak) + ' ' + s + ' per aktivitas' +
      (r.kecepatan > 0 ? ', kecepatan rata-rata ' + T.fmt(r.kecepatan) + ' ' + s + '/jam.' : '.') + '</p>';
    if (data.topJenis.length) html += '<h3 style="margin-top:14px">Olahraga teratas</h3>' + data.topJenis.map((j) => barisBatang(j.jenis + ' (' + T.fmt(j.jumlah) + 'x)', Math.round(j.jarak * 10) / 10, maksJ, s)).join('');
    if (data.terpanjang && data.terpanjang.jarak > 0) {
      html += '<p class="hint" style="margin-top:14px">Aktivitas terjauh: ' + T.esc(data.terpanjang.nama) + ' (' + T.esc(data.terpanjang.jenis) + '), ' +
        T.fmt(Math.round(data.terpanjang.jarak * 10) / 10) + ' ' + s + (data.terpanjang.tanggal ? ' pada ' + T.esc(data.terpanjang.tanggal) : '') + '.</p>';
    }
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
    x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '700 34px system-ui, sans-serif';
    x.fillText('Strava Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman setahunmu', 48, 118);
    const r = hitungRingkasan(data);
    const s = satuan();
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(r.jarak), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText(s + ' ditempuh', 48, 285);
    let y = 380;
    x.fillStyle = '#fff'; x.font = '400 26px system-ui, sans-serif';
    x.fillText(T.fmt(data.totalAktivitas) + ' aktivitas · ' + fmtDurasi(data.totalDetik) + ' waktu gerak', 48, y); y += 44;
    if (data.totalNaik) { x.fillText(T.fmt(Math.round(data.totalNaik)) + ' m tanjakan', 48, y); y += 44; }
    if (r.kecepatan > 0) { x.fillText('Kecepatan rata-rata ' + T.fmt(r.kecepatan) + ' ' + s + '/jam', 48, y); y += 44; }
    y += 30;
    if (data.topJenis.length) {
      x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
      x.fillText('Olahraga teratas', 48, y); y += 48;
      x.font = '400 26px system-ui, sans-serif';
      data.topJenis.forEach((j, i) => {
        x.fillStyle = '#fff'; x.fillText((i + 1) + '. ' + String(j.jenis).slice(0, 30), 48, y);
        x.fillStyle = '#a1a1aa'; x.fillText(T.fmt(Math.round(j.jarak * 10) / 10) + ' ' + s, 700, y); y += 44;
      });
    }
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('strava-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const jarak = T.num(jarakI.value) || 0;
    const aktivitas = T.num(aktivitasI.value) || 0;
    const jam = T.num(jamI.value) || 0;
    const jenis = jenisI.value.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = s.match(/^(.*?):\s*([\d.,]+)\s*$/);
      if (!m) return null;
      const nilai = Number(m[2].replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(nilai) && nilai > 0 ? { jenis: m[1].trim(), jumlah: 0, jarak: nilai, detik: 0 } : null;
    }).filter(Boolean).sort((a, b) => b.jarak - a.jarak).slice(0, 5);
    if (!jarak && !aktivitas && !jam && !jenis.length) {
      T.toast('Isi dulu salah satu angkanya');
      return;
    }
    const jarakDariJenis = jenis.reduce((s, j) => s + j.jarak, 0);
    data = {
      totalAktivitas: aktivitas || 0,
      totalJarak: jarak || jarakDariJenis,
      totalDetik: jam * 3600,
      totalNaik: 0,
      topJenis: jenis,
      terpanjang: null,
    };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseStravaCsv(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini activities.csv dari ekspor Strava'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.totalAktivitas) + ' aktivitas');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah file activities.csv dari ekspor Strava supaya angka dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan. Pilih satuan jarak akunmu di bawah supaya labelnya benar.</p>'));
  root.appendChild(T.field('Satuan jarak di file ekspor', selSatuan, 'File ekspor Strava memakai satuan akunmu. Pilih yang sama supaya labelnya benar.'));
  root.appendChild(fldJarak);
  root.appendChild(T.field('Total aktivitas setahun', aktivitasI));
  root.appendChild(T.field('Total waktu gerak (jam)', jamI));
  root.appendChild(T.field('Jarak per olahraga (satu per baris)', jenisI, 'Format: Jenis olahraga: jarak. Contoh: Run: 800'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah CSV ekspor', () => fi.click())));
  root.appendChild(box);
  gambar();
}
