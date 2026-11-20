import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-resistor', name: 'Kalkulator Resistor', cat: 'sains', icon: '🔌', desc: 'Baca nilai resistor dari warna gelangnya, plus hitung rangkaian seri dan paralel.', keywords: 'resistor,kode warna,gelang resistor,ohm,seri,paralel,elektronik', since: '6.17.0' };

export const WARNA = [
  { nama: 'Hitam', kode: '#1a1a1a', angka: 0, pengali: 1, toleransi: null },
  { nama: 'Cokelat', kode: '#6b3a1f', angka: 1, pengali: 10, toleransi: 1 },
  { nama: 'Merah', kode: '#c62828', angka: 2, pengali: 100, toleransi: 2 },
  { nama: 'Oranye', kode: '#ef6c00', angka: 3, pengali: 1000, toleransi: null },
  { nama: 'Kuning', kode: '#fdd835', angka: 4, pengali: 10000, toleransi: 0.5 },
  { nama: 'Hijau', kode: '#2e7d32', angka: 5, pengali: 100000, toleransi: 0.5 },
  { nama: 'Biru', kode: '#1565c0', angka: 6, pengali: 1000000, toleransi: 0.25 },
  { nama: 'Ungu', kode: '#6a1b9a', angka: 7, pengali: 10000000, toleransi: 0.1 },
  { nama: 'Abu-abu', kode: '#78909c', angka: 8, pengali: 100000000, toleransi: 0.05 },
  { nama: 'Putih', kode: '#eceff1', angka: 9, pengali: 1000000000, toleransi: null },
  { nama: 'Emas', kode: '#c9a227', angka: null, pengali: 0.1, toleransi: 5 },
  { nama: 'Perak', kode: '#b0bec5', angka: null, pengali: 0.01, toleransi: 10 },
];

const byNama = (n) => WARNA.find((w) => w.nama === n);

// Koefisien suhu (ppm/K) gelang ke-6, IEC 60062:2016. Putih, Emas, dan
// Perak tidak punya nilai koefisien suhu (bukan warna gelang ke-6 yang sah).
export const TEMPCO = {
  Hitam: 250, Cokelat: 100, Merah: 50, Oranye: 15, Kuning: 25,
  Hijau: 20, Biru: 10, Ungu: 5, 'Abu-abu': 1,
};

// gelang: array nama warna. 4 gelang: [d1, d2, pengali, toleransi].
// 5 gelang: [d1, d2, d3, pengali, toleransi].
// 6 gelang: [d1, d2, d3, pengali, toleransi, koefisien suhu (ppm/K)].
export function nilaiDariGelang(gelang) {
  const n = gelang.length;
  if (n !== 4 && n !== 5 && n !== 6) return null;
  const jmlDigit = n === 6 ? 3 : n - 2;
  const digit = gelang.slice(0, jmlDigit).map(byNama);
  const pengali = byNama(gelang[jmlDigit]);
  const tol = byNama(gelang[jmlDigit + 1]);
  if (digit.some((d) => !d || d.angka == null) || !pengali || !tol) return null;
  const angka = Number(digit.map((d) => d.angka).join(''));
  const nilai = angka * pengali.pengali;
  const ppm = n === 6 ? (TEMPCO[gelang[5]] ?? null) : null;
  return { nilai, toleransi: tol.toleransi, angka, pengali: pengali.pengali, ppm };
}

export function seri(nilaiArr) { return nilaiArr.reduce((a, b) => a + b, 0); }
export function paralel(nilaiArr) {
  if (nilaiArr.some((v) => v === 0)) return 0;
  return 1 / nilaiArr.reduce((a, b) => a + 1 / b, 0);
}

export function fmtOhm(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const satuan = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω']];
  for (const [batas, nama] of satuan) {
    if (v >= batas) {
      const x = v / batas;
      const r = Math.round(x * 100) / 100;
      return String(r).replace('.', ',') + ' ' + nama;
    }
  }
  return String(Math.round(v * 1000) / 1000).replace('.', ',') + ' Ω';
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.rs-badan{display:flex;align-items:center;gap:0;background:#e8dcc8;border-radius:10px;padding:14px 10px;margin:12px 0;justify-content:center}' +
    '.rs-gelang{width:22px;height:44px;border:1px solid rgba(0,0,0,.25);margin:0 4px;border-radius:3px}' +
    '.rs-gelang.tol{margin-left:18px}' +
    '.rs-kaki{height:8px;background:#9a8f7a;flex:1}' +
    '.rs-warna{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}' +
    '.rs-sw{width:34px;height:34px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}' +
    '.rs-sw.pilih{border-color:var(--acc);box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--acc)}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Ketuk warna gelang satu per satu, dari gelang pertama sampai gelang terakhir. Gelang toleransi biasanya agak berjarak dari yang lain.</p>'));

  const mode = T.select([['4', '4 gelang (paling umum)'], ['5', '5 gelang (lebih teliti)'], ['6', '6 gelang (dengan koefisien suhu)']], '4');
  const badan = T.el('<div></div>');
  const pemilih = T.el('<div></div>');
  const box = T.out();

  let gelang = ['Cokelat', 'Hitam', 'Merah', 'Emas'];
  let gelangAktif = 0;

  function gambarBadan() {
    const n = parseInt(mode.value, 10);
    while (gelang.length < n) gelang.push(n === 4 ? 'Emas' : 'Hitam');
    gelang = gelang.slice(0, n);
    const b = T.el('<div class="rs-badan"></div>');
    b.appendChild(T.el('<div class="rs-kaki"></div>'));
    gelang.forEach((g, i) => {
      const w = byNama(g);
      const el = document.createElement('div');
      el.className = 'rs-gelang' + (i === n - 1 ? ' tol' : '');
      el.style.background = w ? w.kode : '#ccc';
      el.title = 'Gelang ' + (i + 1) + ': ' + g;
      el.style.outline = i === gelangAktif ? '3px solid var(--acc)' : 'none';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { gelangAktif = i; gambarBadan(); gambarPemilih(); });
      b.appendChild(el);
    });
    b.appendChild(T.el('<div class="rs-kaki"></div>'));
    badan.innerHTML = '';
    badan.appendChild(b);
  }

  function gambarPemilih() {
    pemilih.innerHTML = '';
    const n = parseInt(mode.value, 10);
    const jmlDigit = n === 6 ? 3 : n - 2;
    const peran = gelangAktif < jmlDigit ? 'angka' : gelangAktif === jmlDigit ? 'pengali' : gelangAktif === jmlDigit + 1 ? 'toleransi' : 'koefisien suhu';
    const label = T.el('<p style="font-weight:700;margin:8px 0 2px">Gelang ' + (gelangAktif + 1) + ' (' + peran + ')</p>');
    const wrap = T.el('<div class="rs-warna"></div>');
    WARNA.forEach((w) => {
      const boleh = peran === 'angka' ? w.angka != null : peran === 'pengali' ? w.pengali != null : peran === 'toleransi' ? w.toleransi != null : TEMPCO[w.nama] != null;
      if (!boleh) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rs-sw' + (gelang[gelangAktif] === w.nama ? ' pilih' : '');
      b.style.background = w.kode;
      b.title = w.nama;
      b.setAttribute('aria-label', 'Warna ' + w.nama);
      b.addEventListener('click', () => {
        gelang[gelangAktif] = w.nama;
        if (gelangAktif < n - 1) gelangAktif++;
        gambarBadan();
        gambarPemilih();
        hitung();
      });
      wrap.appendChild(b);
    });
    pemilih.append(label, wrap);
  }

  function hitung() {
    const n = parseInt(mode.value, 10);
    const h = nilaiDariGelang(gelang.slice(0, n));
    if (!h) { T.show(box, '<p>Pilih warna semua gelangnya dulu.</p>'); return; }
    const bawah = h.toleransi != null ? h.nilai * (1 - h.toleransi / 100) : null;
    const atas = h.toleransi != null ? h.nilai * (1 + h.toleransi / 100) : null;
    T.show(box,
      '<p class="big">' + fmtOhm(h.nilai) + (h.toleransi != null ? ' ± ' + String(h.toleransi).replace('.', ',') + '%' : '') + (h.ppm != null ? ' · ' + h.ppm + ' ppm/K' : '') + '</p>' +
      '<p class="hint">Angka: ' + h.angka + ' × pengali ' + T.fmt(h.pengali) + ' = ' + T.fmt(h.nilai) + ' Ω.' +
      (bawah != null ? ' Nilai sebenarnya antara ' + fmtOhm(bawah) + ' dan ' + fmtOhm(atas) + '.' : '') +
      (h.ppm != null ? ' Koefisien suhu ' + h.ppm + ' ppm/K: nilainya berubah sekitar ' + h.ppm + ' per sejuta tiap naik 1 derajat.' : '') + '</p>');
  }

  mode.addEventListener('change', () => { gelangAktif = 0; gambarBadan(); gambarPemilih(); hitung(); });

  // ---- Rangkaian seri / paralel ----
  const seriI = T.ta(3, 'Tulis nilai resistor dalam ohm, satu per baris.\nContoh:\n100\n220\n470');
  const boxR = T.out();
  function hitungRangkaian() {
    const nilai = seriI.value.split(/[\n,;]+/).map((x) => T.num(x)).filter((v) => isFinite(v) && v > 0);
    if (nilai.length < 2) { T.toast('Tulis minimal dua nilai resistor'); return; }
    T.show(boxR,
      '<p><b>Seri (disambung berurutan):</b> ' + fmtOhm(seri(nilai)) + '</p>' +
      '<p><b>Paralel (disambung sejajar):</b> ' + fmtOhm(paralel(nilai)) + '</p>' +
      '<p class="hint">Seri: nilai-nilai dijumlahkan. Paralel: kebalikan nilainya dijumlahkan, lalu dibalik lagi.</p>');
  }

  root.append(
    T.field('Jumlah gelang', mode),
    badan, pemilih, box,
    T.el('<hr style="border:none;border-top:1px solid var(--line-soft);margin:24px 0">'),
    T.el('<p style="font-weight:700;font-size:16px;margin:0 0 4px">Rangkaian seri dan paralel</p>'),
    T.el('<p class="hint">Hitung hambatan gabungan dari beberapa resistor yang dirangkai.</p>'),
    T.field('Nilai resistor (ohm)', seriI),
    T.btn('Hitung rangkaian', hitungRangkaian, true),
    boxR,
  );
  gambarBadan();
  gambarPemilih();
  hitung();
}
