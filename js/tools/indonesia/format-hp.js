import { h as T, utils, kv, tabs } from '../../core.js';

export const meta = {"id": "format-hp", "name": "Format Nomor HP", "cat": "indonesia", "icon": "📱", "desc": "08xx ↔ +62 ↔ 62xx, satu nomor atau banyak sekaligus, lengkap dengan operator, link WA + pesan awal, dan deteksi nomor rumah.", "keywords": "hp,nomor,telepon,62,whatsapp,operator,telkomsel,indosat,xl,tri,axis,smartfren,massal,rumah,kode area,cek operator"};

/* Prefix 4 digit operator seluler Indonesia (berdasarkan alokasi awal nomor).
   Dicek 20 November 2026 (Wikipedia "Nomor telepon di Indonesia" + daftar
   prefix operator):
   Telkomsel 0811, 0812, 0813, 0821, 0822, 0823, 0851 (termasuk by.U), 0852,
   0853, 0854. */
export const OPERATOR_PREFIX = {
  Telkomsel: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853', '0854'],
  Indosat: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  XL: ['0817', '0818', '0819', '0859', '0877', '0878'],
  Tri: ['0895', '0896', '0897', '0898', '0899'],
  Axis: ['0831', '0832', '0833', '0838'],
  Smartfren: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
};

/* Kode area telepon rumah/kantor Indonesia (kode tanpa 0 di depan saat +62).
   Hanya kode yang umum dipakai; nomor rumah dengan kode area di luar daftar
   ini tetap diformat, tapi kotanya tidak ditebak. */
export const KODE_AREA = {
  '021': 'Jakarta', '022': 'Bandung', '024': 'Semarang', '031': 'Surabaya',
  '0251': 'Bogor', '0265': 'Tasikmalaya', '0274': 'Yogyakarta', '0281': 'Purwokerto',
  '0298': 'Salatiga', '0321': 'Mojokerto', '0331': 'Jember', '0333': 'Banyuwangi',
  '0335': 'Probolinggo', '0341': 'Malang', '0343': 'Pasuruan', '0351': 'Madiun',
  '0354': 'Kediri', '0355': 'Blitar', '0361': 'Denpasar / Bali', '0362': 'Singaraja',
  '0365': 'Jembrana', '0370': 'Mataram', '0380': 'Kupang',
  '061': 'Medan', '0622': 'Tebing Tinggi', '0631': 'Pematang Siantar',
  '0641': 'Langsa', '0651': 'Banda Aceh', '0652': 'Meulaboh', '0662': 'Lhokseumawe',
  '0711': 'Palembang', '0721': 'Bandar Lampung', '0731': 'Prabumulih',
  '0735': 'Lubuklinggau', '0736': 'Bengkulu', '0741': 'Jambi', '0742': 'Muara Bungo',
  '0751': 'Padang', '0761': 'Pekanbaru', '0765': 'Dumai',
  '0771': 'Tanjung Pinang', '0778': 'Batam',
  '0401': 'Kendari', '0411': 'Makassar', '0421': 'Parepare', '0431': 'Manado',
  '0451': 'Palu', '0511': 'Banjarmasin', '0536': 'Palangka Raya',
  '0541': 'Samarinda', '0542': 'Balikpapan', '0551': 'Tarakan', '0561': 'Pontianak',
  '0901': 'Timika', '0951': 'Sorong', '0967': 'Jayapura', '0986': 'Manokwari',
};

/* Panjang nomor HP Indonesia yang umum: 10-13 digit termasuk 0 di depan. */
const HP_MIN = 10, HP_MAX = 13;

/* Normalisasi ke bentuk nasional (diawali 0): terima +62, 62, 0062, 08xx, 8xx. */
export function keBentukNasional(s) {
  let d = String(s == null ? '' : s).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0062')) d = d.slice(4);
  else if (d.startsWith('62')) d = d.slice(2);
  if (d.startsWith('0')) return d;
  return '0' + d;
}

export function normalisasiNomor(s) {
  const a = analisisNomor(s);
  if (a.jenis !== 'hp') return null;
  return a.d;
}

export function deteksiOperator(d) {
  const prefix = '0' + d.slice(0, 3);
  for (const [nama, list] of Object.entries(OPERATOR_PREFIX)) {
    if (list.includes(prefix)) return { operator: nama, prefix };
  }
  return { operator: null, prefix };
}

/* Cari kode area terpanjang yang cocok di awal nomor nasional (0xx...). */
export function deteksiKodeArea(nasional) {
  for (let len = 4; len >= 2; len--) {
    const kode = nasional.slice(0, len);
    if (KODE_AREA[kode]) return { kode, kota: KODE_AREA[kode] };
  }
  return { kode: null, kota: null };
}

/* Analisis satu nomor: jenis hp / rumah / tidak valid + pesan spesifik.
   Pesan panjang menyebut operatornya bila prefix-nya dikenali. */
export function analisisNomor(s) {
  const mentah = String(s == null ? '' : s).trim();
  if (!mentah) return { jenis: 'kosong', pesan: 'Isi dulu nomornya.' };
  const nasional = keBentukNasional(mentah);
  if (!/^\d+$/.test(nasional) || nasional.length < 2) {
    return { jenis: 'tidak valid', pesan: 'Nomor tidak bisa dibaca. Contoh: 0812xxxxxxx atau +62812xxxxxxx.' };
  }
  if (nasional.startsWith('08')) {
    const d = nasional.slice(1); // tanpa 0, diawali 8
    const op = deteksiOperator(d);
    const siapa = op.operator ? 'Nomor ' + op.operator + ' ini ' : 'Nomor ini ';
    if (nasional.length < HP_MIN) {
      return { jenis: 'tidak valid', pesan: siapa + 'terlalu pendek (' + nasional.length + ' digit, minimal ' + HP_MIN + ' digit). Periksa lagi angkanya.' };
    }
    if (nasional.length > HP_MAX) {
      return { jenis: 'tidak valid', pesan: siapa + 'terlalu panjang (' + nasional.length + ' digit, maksimal ' + HP_MAX + ' digit). Periksa lagi angkanya.' };
    }
    return { jenis: 'hp', d, nasional, operator: op.operator, prefix: op.prefix };
  }
  if (nasional.startsWith('0')) {
    const area = deteksiKodeArea(nasional);
    const sisa = area.kode ? nasional.slice(area.kode.length) : '';
    if (area.kode && sisa.length >= 5 && sisa.length <= 8 && nasional.length <= 12) {
      return { jenis: 'rumah', nasional, kode: area.kode, kota: area.kota, nomor: sisa };
    }
    if (area.kode) {
      return { jenis: 'tidak valid', pesan: 'Nomor rumah ' + area.kota + ' (' + area.kode + ') ini panjangnya tidak wajar (' + nasional.length + ' digit). Periksa lagi angkanya.' };
    }
    return { jenis: 'tidak valid', pesan: 'Awalan nomor ini bukan 08 dan kode areanya tidak dikenal. Nomor HP diawali 08, nomor rumah diawali kode area (mis. 021 untuk Jakarta).' };
  }
  return { jenis: 'tidak valid', pesan: 'Awalan nomor bukan 08. Nomor HP Indonesia diawali 08 atau +62.' };
}

/* Kelompokkan digit: 4 digit pertama, lalu kelompok 4 digit. */
export function kelompokkan(nomor0) {
  const kepala = nomor0.slice(0, 4);
  const sisa = nomor0.slice(4);
  const grup = [];
  for (let i = 0; i < sisa.length; i += 4) grup.push(sisa.slice(i, i + 4));
  return [kepala].concat(grup).join('-');
}

/* Semua format untuk satu nomor HP (d = digit tanpa 0, diawali 8). */
export function semuaFormatHp(d) {
  const f0 = '0' + d, f62 = '+62' + d, f62b = '62' + d;
  return {
    '08xx': f0,
    '+62': f62,
    '62xx': f62b,
    'Internasional': '+62 ' + kelompokkan(f0).slice(1),
    'Panggil dari luar negeri': '00 62 ' + kelompokkan(f0).slice(1),
    'Format baca': kelompokkan(f0),
  };
}

export function linkWa(f62b, pesan) {
  const p = String(pesan || '').trim();
  return 'https://wa.me/' + f62b + (p ? '?text=' + encodeURIComponent(p) : '');
}

const RIWAYAT_K = 'adip.format-hp.riwayat.v1';
function bacaRiwayat() {
  try { const v = JSON.parse(localStorage.getItem(RIWAYAT_K) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function simpanRiwayat(nasional) {
  try {
    const r = bacaRiwayat().filter((x) => x !== nasional);
    r.unshift(nasional);
    localStorage.setItem(RIWAYAT_K, JSON.stringify(r.slice(0, 5)));
  } catch (e) { /* abaikan */ }
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: satu nomor ----
  const inp = T.input('tel', 'cth: 081944475875 / +62819…');
  inp.inputMode = 'tel';
  const pesanI = T.input('text', 'cth: Halo, saya mau tanya… (opsional)');
  const box = T.out();
  const riwBox = T.out();

  const tampilRiwayat = () => {
    const r = bacaRiwayat();
    if (!r.length) { T.hide(riwBox); return; }
    T.show(riwBox, '<p class="mut" style="font-size:13px;margin:10px 0 6px">Terakhir dicek</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      r.map((n) => {
        const a = analisisNomor(n);
        const label = n + (a.jenis === 'hp' && a.operator ? ' · ' + a.operator : '');
        return '<button type="button" class="btn" data-riw="' + T.esc(n) + '">' + T.esc(label) + '</button>';
      }).join('') +
      '<button type="button" class="btn" data-riw-hapus="1">Hapus riwayat</button></div>');
    riwBox.querySelectorAll('[data-riw]').forEach((b) => b.addEventListener('click', () => {
      inp.value = b.dataset.riw;
      hitung();
    }));
    const hapus = riwBox.querySelector('[data-riw-hapus]');
    if (hapus) hapus.addEventListener('click', () => {
      try { localStorage.removeItem(RIWAYAT_K); } catch (e) {}
      tampilRiwayat();
    });
  };

  const barisFormat = (label, nilai) =>
    '<div class="kv"><span class="k">' + T.esc(label) + '</span><span class="v" style="display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap"><b>' + T.esc(nilai) + '</b>' +
    '<button type="button" class="btn" data-salin="' + T.esc(nilai) + '">Salin</button></span></div>';

  const hitung = () => {
    const a = analisisNomor(inp.value);
    if (a.jenis === 'kosong') { T.show(box, '<p class="hint">Tempel nomor dalam format apa pun — 08xx, +62, 62xx, atau nomor rumah (021…). Hasilnya muncul di sini.</p>'); return; }
    if (a.jenis === 'tidak valid') { T.show(box, '<p class="warn">' + T.esc(a.pesan) + '</p>'); return; }
    if (a.jenis === 'rumah') {
      const f62 = '+62' + a.nasional.slice(1);
      const f62b = '62' + a.nasional.slice(1);
      T.show(box,
        '<p class="note">Ini nomor <b>telepon rumah/kantor</b> — kode area ' + T.esc(a.kode) + ' (' + T.esc(a.kota) + '), bukan nomor HP. Nomor rumah biasanya tidak bisa dipakai untuk WhatsApp.</p>' +
        barisFormat('Format 0', a.nasional) +
        barisFormat('Format +62', f62) +
        barisFormat('Format 62xx', f62b) +
        barisFormat('Format baca', a.kode + '-' + a.nomor));
      box.querySelectorAll('[data-salin]').forEach((b) => b.addEventListener('click', () => T.copy(b.dataset.salin)));
      return;
    }
    // HP valid
    const f = semuaFormatHp(a.d);
    const wa = linkWa(f['62xx'], pesanI.value);
    const opHtml = a.operator
      ? kv('Operator (dari prefix)', '<b>' + T.esc(a.operator) + '</b> · prefix ' + T.esc(a.prefix))
      : kv('Operator (dari prefix)', 'Prefix ' + T.esc(a.prefix) + ' tidak ada di daftar operator yang dikenal');
    T.show(box,
      barisFormat('Format 08xx', f['08xx']) +
      barisFormat('Format +62', f['+62']) +
      barisFormat('Format 62xx', f['62xx']) +
      barisFormat('Format internasional', f['Internasional']) +
      barisFormat('Panggil dari luar negeri', f['Panggil dari luar negeri']) +
      barisFormat('Format baca (08xx)', f['Format baca']) +
      opHtml +
      kv('Link WhatsApp', '<b>' + T.esc(wa) + '</b>') +
      '<p class="hint">Operator ditebak dari prefix awal nomor (4 digit pertama).</p>');
    box.appendChild(T.row(
      T.copyBtn(() => wa, 'Salin link WA'),
      (() => { const el = T.el('<a class="btn primary" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center">Buka wa.me</a>'); el.href = wa; return el; })()
    ));
    box.querySelectorAll('[data-salin]').forEach((b) => b.addEventListener('click', () => T.copy(b.dataset.salin)));
    simpanRiwayat(a.nasional);
    tampilRiwayat();
  };
  inp.addEventListener('input', hitung);
  pesanI.addEventListener('input', hitung);
  p1.appendChild(T.field('Nomor HP', inp, 'Tempel nomor dalam format apa pun'));
  p1.appendChild(T.field('Pesan awal WhatsApp (opsional)', pesanI, 'Bila diisi, link wa.me langsung membuka chat dengan pesan ini'));
  p1.appendChild(box);
  p1.appendChild(riwBox);
  hitung();
  tampilRiwayat();

  // ---- Panel 2: banyak nomor ----
  const massalTa = T.ta(6, 'Satu nomor per baris, mis.\n081234567890\n+6281299988877\n0211234567');
  const massalBox = T.out();
  let massalHasil = [];
  const hitungMassal = () => {
    const baris = String(massalTa.value || '').split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (!baris.length) { T.show(massalBox, '<p class="warn">Tempel dulu daftar nomornya, satu per baris.</p>'); return; }
    const maks = 200;
    const potong = baris.slice(0, maks);
    massalHasil = potong.map((asli) => {
      const a = analisisNomor(asli);
      if (a.jenis === 'hp') {
        const f = semuaFormatHp(a.d);
        return { asli, ok: true, f0: f['08xx'], f62: f['+62'], f62b: f['62xx'], inter: f['Internasional'], op: a.operator || 'Tidak dikenal', status: 'HP' };
      }
      if (a.jenis === 'rumah') {
        return { asli, ok: true, f0: a.nasional, f62: '+62' + a.nasional.slice(1), f62b: '62' + a.nasional.slice(1), inter: '+62 ' + a.nasional.slice(1), op: '—', status: 'Rumah (' + a.kota + ')' };
      }
      return { asli, ok: false, f0: '—', f62: '—', f62b: '—', inter: '—', op: '—', status: a.pesan };
    });
    const valid = massalHasil.filter((r) => r.ok).length;
    let rows = '';
    massalHasil.forEach((r) => {
      rows += '<tr><td>' + T.esc(r.asli) + '</td><td>' + T.esc(r.f0) + '</td><td>' + T.esc(r.f62) + '</td><td>' + T.esc(r.f62b) + '</td><td>' + T.esc(r.op) + '</td><td>' + T.esc(r.status) + '</td></tr>';
    });
    T.show(massalBox,
      '<p class="note">' + valid + ' dari ' + massalHasil.length + ' nomor valid' + (baris.length > maks ? ' (hanya ' + maks + ' baris pertama yang diproses)' : '') + '.</p>' +
      '<div style="overflow-x:auto"><table class="tbl">' +
      '<tr><th>Asli</th><th>08xx</th><th>+62</th><th>62xx</th><th>Operator</th><th>Status</th></tr>' +
      rows + '</table></div>');
    massalBox.appendChild(T.row(
      T.btn('Unduh CSV', () => {
        if (!massalHasil.length) { T.toast('Format dulu daftarnya'); return; }
        const escCsv = (s) => {
          // Netralisasi injeksi formula: sel yang diawali = + - @ | % dieksekusi
          // spreadsheet sebagai formula — kutip CSV bukan perlindungan.
          let v = String(s == null ? '' : s);
          if (/^[=+\-@|%]/.test(v.trimStart())) v = '\t' + v;
          return '"' + v.replace(/"/g, '""') + '"';
        };
        const isi = ['Asli,08xx,+62,62xx,Internasional,Operator,Status']
          .concat(massalHasil.map((r) => [r.asli, r.f0, r.f62, r.f62b, r.inter, r.op, r.status].map(escCsv).join(',')))
          .join('\n');
        T.dl('format-nomor-hp.csv', isi, 'text/csv');
        T.toast('CSV terunduh');
      }),
      T.btn('Unduh TXT (+62 saja)', () => {
        if (!massalHasil.length) { T.toast('Format dulu daftarnya'); return; }
        const isi = massalHasil.filter((r) => r.ok).map((r) => r.f62).join('\n');
        if (!isi) { T.toast('Tidak ada nomor valid'); return; }
        T.dl('format-nomor-hp.txt', isi, 'text/plain');
        T.toast('TXT terunduh');
      })
    ));
  };
  p2.appendChild(T.field('Daftar nomor', massalTa, 'Satu nomor per baris, maksimal 200 nomor. Nomor rumah ikut dikenali.'));
  p2.appendChild(T.row(T.btn('Format semua', hitungMassal, true)));
  p2.appendChild(massalBox);

  root.appendChild(tabs([['Satu nomor', 0], ['Banyak nomor', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
