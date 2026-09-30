/* ADIP Tools — tools-c.js
 * Kategori: Indonesia Spesifik (11) + Musik & Audio (10) = 21 tools.
 * Semua tool berfungsi beneran (bukan mock). Vanilla JS murni.
 */
(function () {
  const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, cats: [], leaveCbs: [] });
  const T = NS.h;
  const R = (id, name, cat, icon, desc, render) => NS.tools.push({ id, name, cat, icon, desc, render });
  const U = NS.utils;

  /* ================= FUNGSI MURNI (di-test) ================= */

  U.hitungPatungan = (total, pajakPct, servicePct, orang) => {
    total = +total || 0; pajakPct = +pajakPct || 0; servicePct = +servicePct || 0;
    orang = Math.max(1, Math.round(+orang) || 1);
    const pajak = total * pajakPct / 100;
    const service = total * servicePct / 100;
    const grandTotal = total + pajak + service;
    return { subtotal: total, pajak, service, grandTotal, perOrang: grandTotal / orang };
  };

  U.diskonBertingkat = (harga, arrDiskon) => {
    let sisa = +harga || 0;
    const tahapan = [];
    (arrDiskon || []).forEach((d) => {
      d = Math.min(100, Math.max(0, +d || 0));
      const potongan = sisa * d / 100;
      sisa -= potongan;
      tahapan.push({ diskon: d, potongan, hargaSetelah: sisa });
    });
    return { tahapan, hargaAkhir: sisa, totalHemat: (+harga || 0) - sisa };
  };

  U.hitungTHR = (gaji, bulanKerja) => {
    gaji = +gaji || 0; bulanKerja = +bulanKerja || 0;
    return bulanKerja >= 12 ? gaji : (gaji * bulanKerja) / 12;
  };

  U.cicilanFlat = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const totalBunga = pokok * (+bungaTahunanPct || 0) / 100 * (bulan / 12);
    const totalBayar = pokok + totalBunga;
    return { perBulan: totalBayar / bulan, totalBunga, totalBayar };
  };

  U.cicilanAnuitas = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const r = (+bungaTahunanPct || 0) / 100 / 12;
    const perBulan = r > 0 ? (pokok * r) / (1 - Math.pow(1 + r, -bulan)) : pokok / bulan;
    const totalBayar = perBulan * bulan;
    return { perBulan, totalBunga: totalBayar - pokok, totalBayar };
  };

  // ANCHOR WAJIB: 17 Agustus 1945 = Jumat Legi
  U.weton = (yyyy, mm, dd) => {
    const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const NEPTU_H = { Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9, Minggu: 5 };
    const NEPTU_P = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 };
    const t = Date.UTC(+yyyy, +mm - 1, +dd);
    if (isNaN(t)) return null;
    const anchor = Date.UTC(1945, 7, 17);
    const diff = Math.round((t - anchor) / 86400000);
    const pasaran = PASARAN[(((diff % 5) + 5) % 5)];
    const hari = HARI[new Date(t).getUTCDay()];
    const neptuHari = NEPTU_H[hari];
    const neptuPasaran = NEPTU_P[pasaran];
    return { hari, pasaran, weton: hari + ' ' + pasaran, neptuHari, neptuPasaran, neptuTotal: neptuHari + neptuPasaran };
  };

  U.zakatMaal = (harta, hargaEmas) => {
    harta = +harta || 0; hargaEmas = +hargaEmas || 0;
    const nisab = 85 * hargaEmas;
    const wajib = hargaEmas > 0 && harta >= nisab;
    return { nisab, wajib, zakat: wajib ? harta * 0.025 : 0 };
  };

  // --- transpose chord ---
  const _NS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const _NF = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const _NI = { C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, 'E#': 5, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11 };
  const _normAcc = (a) => (a === '♯' ? '#' : a === '♭' ? 'b' : a || '');
  const _tNote = (root, acc, steps, flat) => {
    const i = _NI[root + _normAcc(acc)];
    if (i == null) return null;
    return (flat ? _NF : _NS)[((((i + steps) % 12) + 12) % 12)];
  };
  U.transposeChord = (chord, steps, preferFlat) => {
    steps = Math.round(+steps || 0);
    const m = /^\s*([A-G])([#b♯♭]?)\s*(.*?)\s*(?:\/\s*([A-G])([#b♯♭]?)\s*)?$/.exec(String(chord));
    if (!m) return chord;
    const suf = m[3] || '';
    if (suf && !/^(m(?!aj)|maj|min|dim|aug|sus|add)?\d*(b5|#5)?$/.test(suf)) return chord;
    const flatFor = (a) => {
      a = _normAcc(a);
      return a === 'b' ? true : a === '#' ? false : !!preferFlat;
    };
    const nr = _tNote(m[1], m[2], steps, flatFor(m[2]));
    if (nr == null) return chord;
    let out = nr + suf;
    if (m[4]) {
      const nb = _tNote(m[4], m[5], steps, flatFor(m[5]));
      if (nb == null) return chord;
      out += '/' + nb;
    }
    return out;
  };

  // --- camelot wheel ---
  const _MIN = { 1: 'Ab', 2: 'Eb', 3: 'Bb', 4: 'F', 5: 'C', 6: 'G', 7: 'D', 8: 'A', 9: 'E', 10: 'B', 11: 'F#', 12: 'Db' };
  const _MAJ = { 1: 'B', 2: 'F#', 3: 'Db', 4: 'Ab', 5: 'Eb', 6: 'Bb', 7: 'F', 8: 'C', 9: 'G', 10: 'D', 11: 'A', 12: 'E' };
  const _minByPc = {}, _majByPc = {};
  for (let n = 1; n <= 12; n++) { _minByPc[_NI[_MIN[n]]] = n; _majByPc[_NI[_MAJ[n]]] = n; }
  U.camelotToKey = (code) => {
    const m = /^\s*(\d{1,2})\s*([ABab])\s*$/.exec(String(code));
    if (!m) return null;
    const n = +m[1];
    if (n < 1 || n > 12) return null;
    const isA = m[2].toUpperCase() === 'A';
    return (isA ? _MIN[n] : _MAJ[n]) + (isA ? ' minor' : ' major');
  };
  U.keyToCamelot = (key) => {
    const m = /^\s*([A-Ga-g])([#b♯♭]?)\s*(minor|min|major|maj|m|M)?\s*$/.exec(String(key));
    if (!m) return null;
    const pc = _NI[m[1].toUpperCase() + _normAcc(m[2])];
    if (pc == null) return null;
    const mode = (m[3] || '').toLowerCase();
    const minor = mode === 'minor' || mode === 'min' || mode === 'm';
    const n = minor ? _minByPc[pc] : _majByPc[pc];
    if (n == null) return null;
    return n + (minor ? 'A' : 'B');
  };

  U.parseDuration = (s) => {
    const parts = String(s).trim().split(':').map((p) => p.trim());
    if (!parts.length || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return NaN;
    if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + +parts[2];
    if (parts.length === 2) return +parts[0] * 60 + +parts[1];
    return +parts[0];
  };

  /* ============ helper internal (non-test) ============ */
  const fmtDur = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
    return h ? h + ':' + mm + ':' + ss : m + ':' + ss;
  };
  const money = (inpEl, ph, val) => { const i = T.input('text', ph, val); i.inputMode = 'decimal'; return i; };
  const kv = (k, v) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + v + '</span></div>';

  /* ==================== INDONESIA ==================== */

  R('patungan', 'Kalkulator Patungan', 'indonesia', '🧾', 'Split bill + pajak & service.', (root) => {
    const total = money(null, 'cth: 150000'), pajak = money(null, 'cth: 10', '10'),
      svc = money(null, 'cth: 5', '5'), orang = T.input('number', 'cth: 4', '4');
    const bulat = T.select([['0', 'Tidak dibulatkan'], ['100', 'Ke atas ratusan terdekat'], ['1000', 'Ke atas ribuan terdekat']], '0');
    const box = T.out();
    const hitung = () => {
      const tot = T.num(total.value), pp = T.num(pajak.value) || 0, ps = T.num(svc.value) || 0;
      const n = Math.max(1, Math.round(T.num(orang.value)) || 1);
      if (!(tot > 0)) { T.show(box, '<p class="warn">Isi total tagihan dulu ya.</p>'); return; }
      const u = U.hitungPatungan(tot, pp, ps, n);
      let per = u.perOrang;
      const b = +bulat.value;
      if (b > 0) per = Math.ceil(per / b) * b;
      T.show(box,
        '<div class="big">' + T.rp(per) + ' <span class="mut" style="font-size:14px;font-weight:400">/ orang</span></div>' +
        kv('Subtotal', T.rp(u.subtotal)) +
        kv('Pajak (' + T.esc(String(pp)) + '%)', T.rp(u.pajak)) +
        kv('Service (' + T.esc(String(ps)) + '%)', T.rp(u.service)) +
        kv('Grand total', '<b>' + T.rp(u.grandTotal) + '</b>') +
        kv('Dibagi ' + n + ' orang', T.rp(u.perOrang) + (b > 0 ? ' → <b>' + T.rp(per) + '</b>' : '')) +
        (b > 0 ? '<p class="hint">Dibulatkan ke atas ke kelipatan Rp' + T.fmt(b) + '. Total terkumpul ' + T.rp(per * n) + '.</p>' : ''));
    };
    [total, pajak, svc, orang].forEach((i) => i.addEventListener('input', hitung));
    bulat.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Total tagihan', total, 'Sebelum pajak & service'),
      T.field('Pajak (%)', pajak),
      T.field('Service (%)', svc),
      T.field('Jumlah orang', orang)
    ));
    root.appendChild(T.field('Pembulatan', bulat, 'Biar gampang bayarnya, tanpa receh'));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  });

  R('diskon', 'Diskon Bertingkat', 'indonesia', '💸', 'Hitung diskon berlapis yang benar.', (root) => {
    const harga = money(null, 'cth: 200000');
    const list = T.el('<div style="display:flex;flex-direction:column;gap:8px"></div>');
    const box = T.out();
    const addRow = (val) => {
      const r = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      const inp = T.input('number', 'cth: 50', val == null ? '' : String(val));
      inp.style.flex = '1';
      const del = T.btn('✕', () => { r.remove(); hitung(); });
      r.appendChild(T.el('<span class="mut" style="flex:none">Diskon</span>'));
      r.appendChild(inp); r.appendChild(T.el('<span class="mut">%</span>')); r.appendChild(del);
      inp.addEventListener('input', hitung);
      list.appendChild(r);
    };
    const hitung = () => {
      const h = T.num(harga.value);
      const arr = [...list.querySelectorAll('input')].map((i) => T.num(i.value)).filter((v) => v > 0);
      if (!(h > 0)) { T.hide(box); return; }
      const u = U.diskonBertingkat(h, arr);
      let rows = u.tahapan.map((t, i) =>
        '<tr><td>Tahap ' + (i + 1) + '</td><td>' + T.esc(String(t.diskon)) + '%</td><td>−' + T.rp(t.potongan) + '</td><td><b>' + T.rp(t.hargaSetelah) + '</b></td></tr>').join('');
      T.show(box,
        (u.tahapan.length ? '<table class="tbl"><tr><th></th><th>Diskon</th><th>Hemat</th><th>Harga</th></tr>' + rows + '</table>' : '') +
        '<div class="big" style="margin-top:8px">' + T.rp(u.hargaAkhir) + '</div>' +
        kv('Total hemat', '<span class="ok"><b>' + T.rp(u.totalHemat) + '</b></span>') +
        '<p class="hint">Catatan: diskon ' + (arr.join('% lalu ') || '…') + '% itu <b>tidak</b> sama dengan ' +
        T.esc(String(arr.reduce((a, b) => a + b, 0))) + '%. Contoh: 50% lalu 20% = hemat 60%, bukan 70% — karena diskon kedua dihitung dari harga yang sudah didiskon.</p>');
    };
    addRow(50); addRow(20);
    harga.addEventListener('input', hitung);
    root.appendChild(T.field('Harga awal', harga));
    root.appendChild(T.el('<div class="fld"><label>Diskon berlapis (berurutan)</label></div>'));
    root.appendChild(list);
    root.appendChild(T.row(T.btn('＋ Tambah diskon', () => addRow()), T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  });

  R('thr', 'Kalkulator THR', 'indonesia', '🧧', 'THR proporsional sesuai masa kerja.', (root) => {
    const gaji = money(null, 'cth: 5000000'), bulan = T.input('number', 'cth: 8', '12');
    const box = T.out();
    const hitung = () => {
      const g = T.num(gaji.value), bl = Math.max(0, T.num(bulan.value) || 0);
      if (!(g > 0)) { T.show(box, '<p class="warn">Isi gaji satu bulan dulu ya.</p>'); return; }
      const thr = U.hitungTHR(g, bl);
      T.show(box,
        '<div class="big">' + T.rp(thr) + '</div>' +
        '<p class="hint">' + (bl >= 12
          ? 'Masa kerja ' + bl + ' bulan (≥ 12 bulan) → berhak atas <b>1× gaji</b> sebulan penuh.'
          : 'Masa kerja ' + bl + ' bulan (&lt; 12 bulan) → THR proporsional: <b>(' + bl + ' ÷ 12) × ' + T.rp(g) + '</b>.') +
        '</p><p class="hint">Acuan umum: pekerja dengan masa kerja 1 bulan+ berhak atas THR Keagamaan. Konsultasikan ke HRD untuk kebijakan kantormu.</p>');
    };
    [gaji, bulan].forEach((i) => i.addEventListener('input', hitung));
    root.appendChild(T.grid2(
      T.field('Gaji 1 bulan', gaji, 'Gaji pokok + tunjangan tetap'),
      T.field('Masa kerja (bulan)', bulan)
    ));
    root.appendChild(T.row(T.btn('Hitung THR', hitung, true)));
    root.appendChild(box);
  });

  R('cicilan', 'Kalkulator Cicilan', 'indonesia', '🏍️', 'Simulasi cicilan flat & anuitas.', (root) => {
    const pokok = money(null, 'cth: 20000000'), bunga = money(null, 'cth: 12', '12'), tenor = T.input('number', 'cth: 12', '12');
    const box = T.out();
    const hitung = () => {
      const p = T.num(pokok.value), r = T.num(bunga.value) || 0, n = Math.max(1, Math.round(T.num(tenor.value)) || 1);
      if (!(p > 0)) { T.show(box, '<p class="warn">Isi jumlah pinjaman dulu ya.</p>'); return; }
      const f = U.cicilanFlat(p, r, n), a = U.cicilanAnuitas(p, r, n);
      const murah = f.totalBayar <= a.totalBayar ? 'flat' : 'anuitas';
      T.show(box,
        '<table class="tbl"><tr><th></th><th>Flat</th><th>Anuitas</th></tr>' +
        '<tr><td>Cicilan/bulan</td><td><b>' + T.rp(f.perBulan) + '</b></td><td><b>' + T.rp(a.perBulan) + '</b></td></tr>' +
        '<tr><td>Total bunga</td><td>' + T.rp(f.totalBunga) + '</td><td>' + T.rp(a.totalBunga) + '</td></tr>' +
        '<tr><td>Total bayar</td><td>' + T.rp(f.totalBayar) + '</td><td>' + T.rp(a.totalBayar) + '</td></tr></table>' +
        '<p class="hint">Flat: bunga dihitung dari pokok awal setiap bulan (cicilan tetap). Anuitas: porsi bunga menyusut, pokok membesar (cicilan tetap). ' +
        'Untuk simulasi ini yang totalnya lebih ringan adalah metode <b>' + murah + '</b>.</p>');
    };
    [pokok, bunga, tenor].forEach((i) => i.addEventListener('input', hitung));
    root.appendChild(T.grid2(
      T.field('Pokok pinjaman', pokok),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Tenor (bulan)', tenor)
    ));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  });

  R('zakat', 'Kalkulator Zakat', 'indonesia', '🤲', 'Zakat maal & fitrah.', (root) => {
    const harta = money(null, 'cth: 200000000'), emas = money(null, 'cth: 1400000', '1400000');
    const jiwa = T.input('number', 'cth: 4', '4'), beras = money(null, 'cth: 15000', '15000');
    const box1 = T.out(), box2 = T.out();
    const hitMaal = () => {
      const h = T.num(harta.value), e = T.num(emas.value) || 0;
      if (!(h > 0) || !(e > 0)) { T.show(box1, '<p class="warn">Isi total harta dan harga emas dulu ya.</p>'); return; }
      const u = U.zakatMaal(h, e);
      T.show(box1,
        kv('Nisab (85 gram emas)', T.rp(u.nisab)) +
        kv('Total harta', T.rp(h)) +
        (u.wajib
          ? '<div class="big ok">' + T.rp(u.zakat) + '</div><p class="hint">Hartamu mencapai nisab. Zakat maal = <b>2,5%</b> dari total harta.</p>'
          : '<p class="warn">Belum wajib zakat — hartamu di bawah nisab (' + T.rp(u.nisab) + ').</p>'));
    };
    const hitFitrah = () => {
      const j = Math.max(1, Math.round(T.num(jiwa.value)) || 1), b = T.num(beras.value) || 0;
      if (!(b > 0)) { T.show(box2, '<p class="warn">Isi harga beras per kg dulu ya.</p>'); return; }
      const total = 2.5 * b * j;
      T.show(box2,
        '<div class="big">' + T.rp(total) + '</div>' +
        kv('Per jiwa', '2,5 kg × ' + T.rp(b) + ' = ' + T.rp(2.5 * b)) +
        kv('Jumlah jiwa', j) +
        '<p class="hint">Zakat fitrah = 2,5 kg beras (atau makanan pokok) per jiwa, dibayar sebelum salat Idulfitri.</p>');
    };
    [harta, emas].forEach((i) => i.addEventListener('input', hitMaal));
    [jiwa, beras].forEach((i) => i.addEventListener('input', hitFitrah));
    root.appendChild(T.el('<h3 style="font-size:15px">Zakat Maal</h3>'));
    root.appendChild(T.grid2(
      T.field('Total harta (Rp)', harta, 'Tabungan, emas, investasi, piutang'),
      T.field('Harga emas / gram', emas)
    ));
    root.appendChild(T.row(T.btn('Hitung zakat maal', hitMaal, true)));
    root.appendChild(box1);
    root.appendChild(T.el('<h3 style="font-size:15px;margin-top:6px">Zakat Fitrah</h3>'));
    root.appendChild(T.grid2(
      T.field('Jumlah jiwa', jiwa),
      T.field('Harga beras / kg', beras)
    ));
    root.appendChild(T.row(T.btn('Hitung zakat fitrah', hitFitrah, true)));
    root.appendChild(box2);
  });

  R('bunga-majemuk', 'Bunga Majemuk', 'indonesia', '📈', 'Simulasi compound interest.', (root) => {
    const modal = money(null, 'cth: 10000000'), setor = money(null, 'cth: 1000000', '0'),
      bunga = money(null, 'cth: 8', '8'), tahun = T.input('number', 'cth: 10', '10');
    const freq = T.select([['12', 'Bulanan'], ['4', 'Kuartalan'], ['2', 'Semesteran'], ['1', 'Tahunan']], '12');
    const box = T.out();
    const hitung = () => {
      const P = T.num(modal.value) || 0, PMT = T.num(setor.value) || 0,
        r = (T.num(bunga.value) || 0) / 100, Y = Math.max(1, Math.round(T.num(tahun.value)) || 1), n = +freq.value;
      if (!(P > 0 || PMT > 0) || !(r >= 0)) { T.show(box, '<p class="warn">Isi modal awal atau setoran bulanan dulu ya.</p>'); return; }
      const i = r / n, N = Y * n;
      const fvSetor = (bulan) => {
        const per = N / Y; // periode compounding per tahun
        let bal = P, m = 0;
        const rows = [];
        for (let y = 1; y <= bulan; y++) {
          for (let k = 0; k < per; k++) { bal *= (1 + i); m++; if (m <= N) bal += PMT * (12 / n); }
          rows.push({ y, bal });
        }
        return rows;
      };
      const rows = fvSetor(Y);
      const akhir = rows[rows.length - 1].bal;
      const totalSetor = P + PMT * 12 * Y;
      T.show(box,
        '<div class="big">' + T.rp(akhir) + '</div>' +
        kv('Total setoran', T.rp(totalSetor)) +
        kv('Total bunga', '<span class="ok"><b>' + T.rp(akhir - totalSetor) + '</b></span>') +
        '<table class="tbl" style="margin-top:8px"><tr><th>Tahun</th><th>Saldo akhir</th></tr>' +
        rows.map((x) => '<tr><td>' + x.y + '</td><td>' + T.rp(x.bal) + '</td></tr>').join('') + '</table>' +
        '<p class="hint">Setoran bulanan dibagi rata ke tiap periode compounding. Ini simulasi — hasil investasi asli bisa naik-turun.</p>');
    };
    [modal, setor, bunga, tahun].forEach((x) => x.addEventListener('input', hitung));
    freq.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Modal awal', modal),
      T.field('Setoran / bulan', setor, 'Opsional, boleh 0'),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Durasi (tahun)', tahun)
    ));
    root.appendChild(T.field('Frekuensi compounding', freq));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  });

  R('weton', 'Weton Jawa', 'indonesia', '🗓️', 'Hitung weton & pasaran dari tanggal lahir.', (root) => {
    const tgl = T.input('date');
    tgl.value = new Date().toISOString().slice(0, 10);
    const box = T.out();
    const hitung = () => {
      if (!tgl.value) { T.show(box, '<p class="warn">Pilih tanggal dulu ya.</p>'); return; }
      const [y, m, d] = tgl.value.split('-').map(Number);
      const u = U.weton(y, m, d);
      if (!u) { T.show(box, '<p class="err">Tanggal tidak valid.</p>'); return; }
      T.show(box,
        '<div class="big center">' + T.esc(u.weton) + '</div>' +
        kv('Hari', T.esc(u.hari) + ' <span class="mut">(neptu ' + u.neptuHari + ')</span>') +
        kv('Pasaran', T.esc(u.pasaran) + ' <span class="mut">(neptu ' + u.neptuPasaran + ')</span>') +
        kv('Total neptu', '<b>' + u.neptuTotal + '</b>') +
        '<p class="hint">Dihitung dari patokan 17 Agustus 1945 = Jumat Legi. Neptu: Senin 4, Selasa 3, Rabu 7, Kamis 8, Jumat 6, Sabtu 9, Minggu 5; Legi 5, Pahing 9, Pon 7, Wage 4, Kliwon 8.</p>');
    };
    tgl.addEventListener('change', hitung);
    root.appendChild(T.field('Tanggal lahir', tgl));
    root.appendChild(T.row(T.btn('Hitung weton', hitung, true)));
    root.appendChild(box);
    hitung();
  });

  R('zona-waktu', 'Konverter Zona Waktu', 'indonesia', '🕐', 'WIB, WITA, WIT + kota dunia.', (root) => {
    const jam = T.input('time', '', '12:00');
    const asal = T.select([['WIB', 'WIB (UTC+7)'], ['WITA', 'WITA (UTC+8)'], ['WIT', 'WIT (UTC+9)']], 'WIB');
    const box = T.out();
    const ZONES = [
      ['WIB', 'Asia/Jakarta'], ['WITA', 'Asia/Makassar'], ['WIT', 'Asia/Jayapura'],
      ['Singapura', 'Asia/Singapore'], ['Tokyo', 'Asia/Tokyo'], ['Seoul', 'Asia/Seoul'],
      ['Dubai', 'Asia/Dubai'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'],
      ['New York', 'America/New_York'], ['Los Angeles', 'America/Los_Angeles'], ['Sydney', 'Australia/Sydney'],
    ];
    const hitung = () => {
      if (!jam.value) { T.hide(box); return; }
      const [hh, mm] = jam.value.split(':').map(Number);
      const off = { WIB: 7, WITA: 8, WIT: 9 }[asal.value] || 7;
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hh - off, mm || 0));
      const f = (tz) => {
        try {
          return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d);
        } catch (e) { return '-'; }
      };
      T.show(box,
        '<p class="mut" style="font-size:13px">Jam <b>' + T.esc(jam.value) + ' ' + T.esc(asal.value) + '</b> sama dengan:</p>' +
        ZONES.map(([label, tz]) => kv(label, '<b>' + T.esc(f(tz)) + '</b>')).join('') +
        '<p class="hint">Kota dunia mengikuti daylight saving time (DST) otomatis bila berlaku. WIB/WITA/WIT tidak memakai DST.</p>');
    };
    jam.addEventListener('change', hitung);
    asal.addEventListener('change', hitung);
    root.appendChild(T.grid2(T.field('Jam', jam), T.field('Zona asal', asal)));
    root.appendChild(T.row(T.btn('Konversi', hitung, true)));
    root.appendChild(box);
  });

  R('format-hp', 'Format Nomor HP', 'indonesia', '📱', '08xx ↔ +62 ↔ 62xx.', (root) => {
    const inp = T.input('tel', 'cth: 081944475875 / +62819…');
    inp.inputMode = 'tel';
    const box = T.out();
    const norm = (s) => {
      let d = String(s).replace(/\D/g, '');
      if (!d) return null;
      if (d.startsWith('62')) d = d.slice(2);
      else if (d.startsWith('0')) d = d.slice(1);
      if (!/^8\d{7,12}$/.test(d)) return null;
      return d;
    };
    const hitung = () => {
      const d = norm(inp.value);
      if (!d) { T.show(box, '<p class="warn">Nomor tidak valid. Contoh: 0812xxxxxxx atau +62812xxxxxxx.</p>'); return; }
      const f0 = '0' + d, f62 = '+62' + d, f62b = '62' + d;
      const wa = 'https://wa.me/' + f62b;
      T.show(box,
        kv('Format 08xx', '<b>' + T.esc(f0) + '</b>') +
        kv('Format +62', '<b>' + T.esc(f62) + '</b>') +
        kv('Format 62xx', '<b>' + T.esc(f62b) + '</b>') +
        T.row(
          T.copyBtn(() => f62, 'Salin +62'),
          (() => { const a = T.el('<a class="btn primary" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center">Buka wa.me</a>'); a.href = wa; return a; })()
        ));
    };
    inp.addEventListener('input', hitung);
    root.appendChild(T.field('Nomor HP', inp, 'Tempel nomor dalam format apa pun'));
    root.appendChild(box);
  });

  R('countdown', 'Countdown Acara', 'indonesia', '🎉', 'Hitung mundur ke hari penting.', (root) => {
    const LEBARAN = new Date(2027, 2, 10, 0, 0, 0); // 10 Mar 2027, perkiraan
    const nextJan1 = () => { const n = new Date(); let y = n.getFullYear(); if (n.getMonth() === 0 && n.getDate() === 1) return new Date(y, 0, 1); return new Date(y + 1, 0, 1); };
    const nextXmas = () => { const n = new Date(); let d = new Date(n.getFullYear(), 11, 25); if (d <= n) d = new Date(n.getFullYear() + 1, 11, 25); return d; };
    const preset = T.select([
      ['lebaran', 'Lebaran / Idulfitri (perkiraan)'],
      ['tahunbaru', 'Tahun Baru'],
      ['natal', 'Natal'],
      ['custom', 'Tanggal sendiri…'],
    ], 'lebaran');
    const namaWrap = T.el('<div></div>');
    const nama = T.input('text', 'Nama acara, cth: Nikahan Budi');
    const tgl = T.input('date');
    const box = T.out();
    let timer = null;
    const targetOf = () => {
      const p = preset.value;
      if (p === 'lebaran') return { d: LEBARAN, label: 'Lebaran / Idulfitri 1448 H', note: 'Tanggal perkiraan — penetapan resmi bisa bergeser mengikuti sidang isbat.' };
      if (p === 'tahunbaru') return { d: nextJan1(), label: 'Tahun Baru', note: '' };
      if (p === 'natal') return { d: nextXmas(), label: 'Hari Natal', note: '' };
      if (!tgl.value) return null;
      const [y, m, dd] = tgl.value.split('-').map(Number);
      return { d: new Date(y, m - 1, dd), label: nama.value.trim() || 'Acara', note: '' };
    };
    const tick = () => {
      const t = targetOf();
      if (!t) { T.show(box, '<p class="warn">Pilih tanggal dulu ya.</p>'); return; }
      const diff = t.d - new Date();
      if (diff <= 0) { T.show(box, '<div class="big center">Sudah tiba waktunya</div><p class="center mut">' + T.esc(t.label) + '</p>'); return; }
      const s = Math.floor(diff / 1000);
      const dd = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
      const pad = (x) => String(x).padStart(2, '0');
      T.show(box,
        '<p class="center mut">' + T.esc(t.label) + '</p>' +
        '<div class="big center" style="font-variant-numeric:tabular-nums">' + dd + ' hari<br>' + pad(hh) + ':' + pad(mm) + ':' + pad(ss) + '</div>' +
        '<p class="center hint">' + t.d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</p>' +
        (t.note ? '<p class="hint">' + T.esc(t.note) + '</p>' : ''));
    };
    const start = () => { if (timer) clearInterval(timer); tick(); timer = setInterval(tick, 1000); };
    T.onLeave(() => { if (timer) clearInterval(timer); });
    const syncCustom = () => {
      const custom = preset.value === 'custom';
      namaWrap.innerHTML = '';
      if (custom) { namaWrap.appendChild(T.field('Nama acara', nama)); namaWrap.appendChild(T.field('Tanggal', tgl)); }
      start();
    };
    preset.addEventListener('change', syncCustom);
    nama.addEventListener('input', start);
    tgl.addEventListener('change', start);
    root.appendChild(T.field('Acara', preset));
    root.appendChild(namaWrap);
    root.appendChild(box);
    syncCustom();
  });

  R('arisan', 'Arisan Picker', 'indonesia', '🎰', 'Kocok nama anggota arisan.', (root) => {
    const daftar = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nSari\nAndi');
    const keluarkan = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" checked> Keluarkan pemenang dari daftar (tanpa pengulangan)</label>');
    const box = T.out();
    const riw = T.out();
    const winners = [];
    let anim = null;
    T.onLeave(() => { if (anim) clearInterval(anim); });
    const names = () => daftar.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const kocok = () => {
      const list = names();
      if (list.length < 2) { T.show(box, '<p class="warn">Isi minimal 2 nama dulu ya.</p>'); return; }
      if (anim) clearInterval(anim);
      let n = 0;
      anim = setInterval(() => {
        const pick = list[Math.floor(Math.random() * list.length)];
        T.show(box, '<div class="big center" style="font-size:20px">' + T.esc(pick) + '</div>');
        if (++n > 14) {
          clearInterval(anim); anim = null;
          const win = list[Math.floor(Math.random() * list.length)];
          winners.push(win);
          T.show(box, '<p class="center mut">Pemenangnya…</p><div class="big center ok" style="font-size:30px">' + T.esc(win) + '</div>');
          T.show(riw, '<p class="mut" style="font-size:13px">Riwayat: ' + winners.map(T.esc).join(' → ') + '</p>');
          if (keluarkan.querySelector('input').checked) {
            const rest = names().filter((x) => x !== win);
            daftar.value = rest.join('\n');
            if (!rest.length) T.toast('Semua nama sudah keluar!');
          }
        }
      }, 90);
    };
    root.appendChild(T.field('Daftar nama', daftar));
    root.appendChild(keluarkan);
    root.appendChild(T.row(T.btn('Kocok!', kocok, true)));
    root.appendChild(box);
    root.appendChild(riw);
  });

  /* ==================== MUSIK & AUDIO ==================== */

  R('tap-bpm', 'Tap BPM', 'musik', '👆', 'Ketuk layar untuk deteksi tempo.', (root) => {
    const zone = T.el('<div class="tapzone">Ketuk di sini mengikuti beat</div>');
    const box = T.out();
    let taps = [];
    const labelTempo = (bpm) => {
      if (bpm < 40) return 'Sangat lambat';
      if (bpm < 60) return 'Largo — lambat & lebar';
      if (bpm < 66) return 'Larghetto — agak lambat';
      if (bpm < 76) return 'Adagio — tenang';
      if (bpm < 108) return 'Andante — seperti langkah kaki';
      if (bpm < 120) return 'Moderato — sedang';
      if (bpm < 156) return 'Allegro — cepat & ceria';
      if (bpm < 168) return 'Vivace — hidup';
      if (bpm < 200) return 'Presto — sangat cepat';
      return 'Prestissimo — secepat mungkin';
    };
    const render = () => {
      if (taps.length < 2) { T.show(box, '<p class="center mut">Ketuk minimal 2 kali untuk mulai mengukur.</p>'); return; }
      const iv = [];
      for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
      const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
      const bpm = Math.round(60000 / avg);
      T.show(box,
        '<div class="big center">' + bpm + ' <span class="mut" style="font-size:15px">BPM</span></div>' +
        '<p class="center">' + T.esc(labelTempo(bpm)) + '</p>' +
        '<p class="center hint">' + taps.length + ' ketukan dihitung</p>');
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
      taps.push(now);
      if (taps.length > 16) taps.shift();
      T.beep(660, 0.06, 'square');
      render();
    });
    root.appendChild(zone);
    root.appendChild(T.row(T.btn('Reset', () => { taps = []; render(); })));
    root.appendChild(box);
    render();
  });

  R('metronome', 'Metronom', 'musik', '🥁', 'Metronom dengan birama.', (root) => {
    const bpmNum = T.input('number', 'BPM', '120');
    const bpmRange = T.el('<input type="range" class="inp" min="40" max="240" value="120">');
    const birama = T.select([['2/4', '2/4'], ['3/4', '3/4'], ['4/4', '4/4'], ['6/8', '6/8']], '4/4');
    const dots = T.el('<div class="center" style="display:flex;gap:10px;justify-content:center"></div>');
    const box = T.out();
    let timer = null, nextTime = 0, beat = 0, running = false;
    const getBpm = () => Math.min(240, Math.max(40, Math.round(+bpmNum.value) || 120));
    const beatsPerBar = () => +birama.value.split('/')[0];
    const beatDur = () => (birama.value.endsWith('/8') ? (60 / getBpm()) / 2 : 60 / getBpm());
    const paintDots = () => {
      dots.innerHTML = '';
      for (let i = 0; i < beatsPerBar(); i++) {
        const d = T.el('<span style="width:16px;height:16px;border-radius:50%;background:#27272a;display:inline-block;transition:background .05s"></span>');
        d.dataset.i = i;
        dots.appendChild(d);
      }
    };
    const blip = (t, accent) => {
      try {
        const c = T.actx();
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'square';
        o.frequency.value = accent === 2 ? 1200 : accent === 1 ? 900 : 650;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.1);
      } catch (e) { /* abaikan */ }
    };
    const scheduler = () => {
      const c = T.actx();
      while (nextTime < c.currentTime + 0.12) {
        const bpb = beatsPerBar();
        const cur = beat % bpb;
        const acc = cur === 0 ? 2 : (birama.value === '6/8' && cur === 3 ? 1 : 0);
        blip(nextTime, acc);
        const showBeat = cur;
        setTimeout(() => {
          [...dots.children].forEach((d) => { d.style.background = +d.dataset.i === showBeat ? '#fff' : '#27272a'; });
        }, Math.max(0, (nextTime - c.currentTime) * 1000));
        nextTime += beatDur();
        beat++;
      }
    };
    const stop = () => {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      startBtn.textContent = 'Start';
      [...dots.children].forEach((d) => { d.style.background = '#27272a'; });
      T.show(box, '');
    };
    const start = () => {
      const c = T.actx();
      running = true;
      beat = 0;
      nextTime = c.currentTime + 0.06;
      timer = setInterval(scheduler, 25);
      startBtn.textContent = 'Stop';
    };
    const startBtn = T.btn('Start', () => { running ? stop() : start(); }, true);
    T.onLeave(stop);
    const sync = (v) => { bpmNum.value = v; bpmRange.value = v; };
    bpmNum.addEventListener('input', () => sync(getBpm()));
    bpmRange.addEventListener('input', () => sync(bpmRange.value));
    birama.addEventListener('change', paintDots);
    // tap tempo
    let tapTimes = [];
    const tapBtn = T.btn('Tap tempo', () => {
      const now = performance.now();
      if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) tapTimes = [];
      tapTimes.push(now);
      if (tapTimes.length > 6) tapTimes.shift();
      if (tapTimes.length >= 2) {
        const iv = [];
        for (let i = 1; i < tapTimes.length; i++) iv.push(tapTimes[i] - tapTimes[i - 1]);
        sync(Math.round(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)));
      }
    });
    root.appendChild(T.grid2(
      T.field('Tempo (BPM)', bpmNum),
      T.field('Birama', birama)
    ));
    root.appendChild(T.field('Geser tempo', bpmRange));
    root.appendChild(dots);
    root.appendChild(T.row(startBtn, tapBtn));
    root.appendChild(box);
    paintDots();
  });

  R('camelot', 'Camelot Wheel', 'musik', '🎧', 'Kunci lagu untuk DJ mixing.', (root) => {
    const MIN = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db'];
    const MAJ = ['B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E'];
    const box = T.out();
    // bangun SVG roda: ring luar = major (B), ring dalam = minor (A)
    const seg = (cx, cy, r1, r2, a0, a1) => {
      const p = (r, a) => { const rad = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(rad)).toFixed(1) + ' ' + (cy + r * Math.sin(rad)).toFixed(1); };
      return 'M' + p(r2, a0) + 'L' + p(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + p(r1, a1) + 'L' + p(r2, a1) + 'A' + r2 + ' ' + r2 + ' 0 0 0 ' + p(r2, a0) + 'Z';
    };
    const label = (cx, cy, r, a, txt, code) => {
      const rad = (a - 90) * Math.PI / 180;
      const x = (cx + r * Math.cos(rad)).toFixed(1), y = (cy + r * Math.sin(rad)).toFixed(1);
      return '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#fafafa" data-code="' + code + '" style="cursor:pointer">' + txt + '</text>';
    };
    let svg = '<svg class="wheel" viewBox="0 0 220 220" style="width:min(78vw,260px);height:auto">';
    const cx = 110, cy = 110;
    for (let n = 1; n <= 12; n++) {
      const a0 = (n - 1) * 30, a1 = n * 30, am = (a0 + a1) / 2;
      const codeB = n + 'B', codeA = n + 'A';
      svg += '<path d="' + seg(cx, cy, 62, 104, a0, a1) + '" fill="' + (n % 2 ? '#1c1c20' : '#232328') + '" stroke="#000" stroke-width="1" data-code="' + codeB + '" style="cursor:pointer"/>';
      svg += '<path d="' + seg(cx, cy, 22, 60, a0, a1) + '" fill="' + (n % 2 ? '#26262c' : '#1a1a1e') + '" stroke="#000" stroke-width="1" data-code="' + codeA + '" style="cursor:pointer"/>';
      svg += label(cx, cy, 83, am, codeB, codeB);
      svg += label(cx, cy, 41, am, codeA, codeA);
    }
    svg += '</svg>';
    const wheel = T.el(svg);
    let selected = null;
    const showKey = (code) => {
      selected = code;
      wheel.querySelectorAll('path').forEach((p) => { p.setAttribute('stroke', '#000'); p.setAttribute('stroke-width', '1'); });
      wheel.querySelectorAll('path[data-code="' + code + '"]').forEach((p) => { p.setAttribute('stroke', '#fff'); p.setAttribute('stroke-width', '2.5'); });
      const n = parseInt(code, 10), L = code.slice(-1);
      const other = n + (L === 'A' ? 'B' : 'A');
      const prev = (n === 1 ? 12 : n - 1) + L, next = (n === 12 ? 1 : n + 1) + L;
      const item = (c) => '<div class="kv"><span class="k">' + T.esc(c) + '</span><span class="v">' + T.esc(U.camelotToKey(c)) + '</span></div>';
      T.show(box,
        '<div class="big center">' + T.esc(code) + ' <span class="mut" style="font-size:15px">' + T.esc(U.camelotToKey(code)) + '</span></div>' +
        '<p class="mut" style="font-size:13px;margin:6px 0 2px">Kunci yang kompatibel (aman di-mix):</p>' +
        item(other) + item(prev) + item(next) +
        '<p class="hint">Aturan Camelot: kunci yang sama angka beda huruf (mis. 8A ↔ 8B), atau angka ±1 huruf sama (8A → 7A / 9A) terdengar mulus saat transisi.</p>');
    };
    wheel.querySelectorAll('[data-code]').forEach((elm) => {
      elm.addEventListener('click', () => showKey(elm.dataset.code));
    });
    // konverter
    const inKey = T.input('text', 'cth: A minor'), inCam = T.input('text', 'cth: 8A');
    const boxC = T.out();
    const conv = () => {
      const a = U.keyToCamelot(inKey.value), b = U.camelotToKey(inCam.value);
      let html = '';
      if (inKey.value.trim()) html += a ? kv('"' + inKey.value.trim() + '" → Camelot', '<b>' + T.esc(a) + '</b>') : '<p class="warn">Kunci "' + T.esc(inKey.value.trim()) + '" tidak dikenali.</p>';
      if (inCam.value.trim()) html += b ? kv('"' + inCam.value.trim() + '" → Kunci', '<b>' + T.esc(b) + '</b>') : '<p class="warn">Kode "' + T.esc(inCam.value.trim()) + '" tidak valid (1A–12B).</p>';
      if (html) T.show(boxC, html); else T.hide(boxC);
    };
    [inKey, inCam].forEach((i) => i.addEventListener('input', conv));
    // peta lengkap
    let mapHtml = '<div class="grid2" style="font-size:13px">';
    for (let n = 1; n <= 12; n++) mapHtml += '<div>' + kv(n + 'A', T.esc(U.camelotToKey(n + 'A'))) + '</div>';
    for (let n = 1; n <= 12; n++) mapHtml += '<div>' + kv(n + 'B', T.esc(U.camelotToKey(n + 'B'))) + '</div>';
    mapHtml += '</div>';
    const det = T.el('<details style="font-size:13px"><summary style="cursor:pointer;color:var(--mut)">Lihat peta 24 kunci</summary><div style="margin-top:8px">' + mapHtml + '</div></details>');
    root.appendChild(T.el('<p class="center mut" style="font-size:13px">Ketuk salah satu kunci di roda</p>'));
    root.appendChild(wheel);
    root.appendChild(box);
    root.appendChild(T.el('<h3 style="font-size:15px;margin-top:4px">Konverter notasi</h3>'));
    root.appendChild(T.grid2(T.field('Nama kunci → Camelot', inKey, 'cth: A minor, C major, F# minor'), T.field('Camelot → nama kunci', inCam, 'cth: 8A, 11B')));
    root.appendChild(boxC);
    root.appendChild(det);
    showKey('8A');
  });

  R('chord-transpose', 'Chord Transposer', 'musik', '🎸', 'Naik-turunkan kunci chord lagu.', (root) => {
    const src = T.ta(8, '[Am]           [G]\nAku di sini menunggumu\n[F]            [C]\nDi bawah langit yang biru…');
    const steps = T.el('<input type="range" class="inp" min="-11" max="11" value="0" step="1">');
    const stepsLbl = T.el('<span class="big">0</span>');
    const accidental = T.select([['sharp', 'Tampilkan kres (#)'], ['flat', 'Tampilkan mol (b)']], 'sharp');
    const box = T.out();
    const TOKEN = /^[A-G][#b]?(m(?!aj)|maj|min|dim|aug|sus|add)?\d*(\/[A-G][#b]?)?$/;
    const transposeText = (text, st, preferFlat) => {
      return text.split('\n').map((line) => {
        const toks = line.trim().split(/\s+/).filter(Boolean);
        const isChordLine = toks.length > 0 && toks.every((t) => t === '|' || TOKEN.test(t));
        let out = line.replace(/\[([^\]]+)\]/g, (m, c) => '[' + U.transposeChord(c, st, preferFlat) + ']')
          .replace(/\(([^)]+)\)/g, (m, c) => '(' + U.transposeChord(c, st, preferFlat) + ')');
        if (isChordLine) {
          out = out.split(/(\s+)/).map((w) => (/^\s*$/.test(w) || w === '|' ? w : (TOKEN.test(w) ? U.transposeChord(w, st, preferFlat) : w))).join('');
        } else {
          out = out.replace(/\b([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?\d*\/[A-G][#b]?)\b/g, (m) => U.transposeChord(m, st, preferFlat));
        }
        return out;
      }).join('\n');
    };
    const hitung = () => {
      const st = +steps.value;
      stepsLbl.textContent = (st > 0 ? '+' : '') + st;
      const res = transposeText(src.value, st, accidental.value === 'flat');
      T.show(box, '<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">' + T.esc(res) + '</pre>' +
        T.row(T.copyBtn(() => res, 'Salin hasil')));
    };
    steps.addEventListener('input', hitung);
    accidental.addEventListener('change', hitung);
    src.addEventListener('input', hitung);
    root.appendChild(T.field('Lirik + chord', src, 'Chord terdeteksi di dalam [tanda kurung siku], (kurung biasa), pola G/B, atau baris yang semuanya chord.'));
    root.appendChild(T.field('Transpose', steps, 'Geser nada'));
    root.appendChild(T.el('<div class="center"></div>').appendChild(stepsLbl).parentNode || T.el('<div></div>'));
    root.appendChild(T.field('Notasi nada baru', accidental));
    root.appendChild(T.row(T.btn('Transpose', hitung, true)));
    root.appendChild(box);
  });

  R('playlist-duration', 'Durasi Playlist', 'musik', '📃', 'Total durasi dari daftar lagu.', (root) => {
    const src = T.ta(8, 'Judul lagu - 3:45\nLagu kedua - 4:12\nIntro - 1:02:30');
    const box = T.out();
    const hitung = () => {
      const lines = src.value.split('\n').map((s) => s.trim()).filter(Boolean);
      const items = [];
      lines.forEach((ln) => {
        const m = ln.match(/(\d+:)?\d{1,3}:\d{2}\s*$/);
        if (!m) return;
        const sec = U.parseDuration(m[0].trim());
        if (isNaN(sec)) return;
        const title = ln.slice(0, ln.length - m[0].length).replace(/[-–—:|]+$/, '').trim() || 'Tanpa judul';
        items.push({ title, sec });
      });
      if (!items.length) { T.show(box, '<p class="warn">Tidak ada durasi yang terbaca. Format per baris: <b>Judul - m:ss</b> (atau h:mm:ss).</p>'); return; }
      const total = items.reduce((a, x) => a + x.sec, 0);
      const avg = total / items.length;
      const sorted = [...items].sort((a, b) => a.sec - b.sec);
      T.show(box,
        '<div class="big">' + T.esc(fmtDur(total)) + '</div>' +
        kv('Jumlah lagu', items.length) +
        kv('Rata-rata', fmtDur(avg)) +
        kv('Terpendek', T.esc(sorted[0].title) + ' (' + fmtDur(sorted[0].sec) + ')') +
        kv('Terpanjang', T.esc(sorted[sorted.length - 1].title) + ' (' + fmtDur(sorted[sorted.length - 1].sec) + ')') +
        '<p class="hint">Cocok buat ngitung durasi set DJ, mixtape, atau playlist lari.</p>');
    };
    src.addEventListener('input', hitung);
    root.appendChild(T.field('Daftar lagu', src, 'Satu lagu per baris, akhiri dengan durasi m:ss'));
    root.appendChild(T.row(T.btn('Hitung total', hitung, true)));
    root.appendChild(box);
  });

  R('audio-trimmer', 'Audio Trimmer', 'musik', '✂️', 'Potong audio di browser, export WAV.', (root) => {
    const file = T.input('file');
    file.accept = 'audio/*';
    const wrap = T.el('<div></div>');
    let buf = null, srcNode = null;
    T.onLeave(() => { try { srcNode && srcNode.stop(); } catch (e) {} });
    const stopPrev = () => { try { srcNode && srcNode.stop(); } catch (e) {} srcNode = null; };

    const drawWave = (canvas, s0, s1) => {
      const W = canvas.width = Math.min(720, canvas.clientWidth * 2 || 640), H = canvas.height = 160;
      const g = canvas.getContext('2d');
      const ch = buf.getChannelData(0), len = buf.length;
      g.fillStyle = '#18181b'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8b8b93';
      const step = Math.max(1, Math.floor(len / W));
      for (let x = 0; x < W; x++) {
        let mn = 1, mx = -1;
        for (let i = x * step; i < (x + 1) * step && i < len; i += 4) {
          const v = ch[i];
          if (v < mn) mn = v; if (v > mx) mx = v;
        }
        const y1 = (1 - (mx + 1) / 2) * H, y2 = (1 - (mn + 1) / 2) * H;
        g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
      // area potongan
      const x0 = (s0 / buf.duration) * W, x1 = (s1 / buf.duration) * W;
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, 0, x0, H); g.fillRect(x1, 0, W - x1, H);
      g.fillStyle = '#fff'; g.fillRect(x0 - 1, 0, 2, H); g.fillRect(x1 - 1, 0, 2, H);
    };

    const encodeWav = (s0, s1) => {
      const sr = buf.sampleRate, nCh = buf.numberOfChannels;
      const a = Math.max(0, Math.floor(s0 * sr)), b = Math.min(buf.length, Math.floor(s1 * sr));
      const frames = Math.max(0, b - a);
      const ab = new ArrayBuffer(44 + frames * nCh * 2), v = new DataView(ab);
      const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true); ws(8, 'WAVE');
      ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, nCh, true); v.setUint32(24, sr, true);
      v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
      ws(36, 'data'); v.setUint32(40, frames * nCh * 2, true);
      const chans = [];
      for (let c = 0; c < nCh; c++) chans.push(buf.getChannelData(c));
      let o = 44;
      for (let i = a; i < b; i++) for (let c = 0; c < nCh; c++) {
        const x = Math.max(-1, Math.min(1, chans[c][i]));
        v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2;
      }
      return new Blob([ab], { type: 'audio/wav' });
    };

    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      stopPrev();
      try {
        const c = T.actx();
        buf = await c.decodeAudioData(await f.arrayBuffer());
      } catch (e) { wrap.innerHTML = '<p class="err">Gagal membaca file audio. Coba file MP3/WAV/OGG lain.</p>'; return; }
      wrap.innerHTML = '';
      const info = T.el('<p class="mut" style="font-size:13px"></p>');
      const canvas = T.el('<canvas class="prev" style="width:100%"></canvas>');
      const sIn = T.input('number', '0', '0'), eIn = T.input('number', '', buf.duration.toFixed(2));
      [sIn, eIn].forEach((i) => { i.step = '0.1'; i.min = '0'; i.max = String(buf.duration); });
      const getRange = () => {
        let s = Math.max(0, +sIn.value || 0), e = Math.min(buf.duration, +eIn.value || buf.duration);
        if (e <= s) e = Math.min(buf.duration, s + 1);
        return [s, e];
      };
      const refresh = () => {
        const [s, e] = getRange();
        info.textContent = 'Durasi file ' + buf.duration.toFixed(2) + ' dtk · potongan ' + (e - s).toFixed(2) + ' dtk';
        drawWave(canvas, s, e);
      };
      const playBtn = T.btn('Putar potongan', () => {
        stopPrev();
        const c = T.actx(), [s, e] = getRange();
        srcNode = c.createBufferSource();
        srcNode.buffer = buf; srcNode.connect(c.destination);
        srcNode.start(0, s, e - s);
        T.toast('Memutar ' + (e - s).toFixed(1) + ' detik');
      }, true);
      const stopBtn = T.btn('Stop', stopPrev);
      const dlBtn = T.btn('Export WAV', () => {
        const [s, e] = getRange();
        T.dl('potongan-' + Math.round(s) + '-' + Math.round(e) + 's.wav', encodeWav(s, e), 'audio/wav');
        T.toast('WAV diunduh');
      });
      [sIn, eIn].forEach((i) => i.addEventListener('input', refresh));
      wrap.appendChild(info);
      wrap.appendChild(canvas);
      wrap.appendChild(T.grid2(T.field('Mulai (detik)', sIn), T.field('Selesai (detik)', eIn)));
      wrap.appendChild(T.row(playBtn, stopBtn, dlBtn));
      wrap.appendChild(T.el('<p class="hint">Semua proses jalan lokal di browser — file tidak di-upload ke mana pun. Export menghasilkan WAV 16-bit.</p>'));
      requestAnimationFrame(refresh);
    });
    root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, OGG, M4A…'));
    root.appendChild(wrap);
  });

  R('drum-machine', 'Drum Machine', 'musik', '🎛️', 'Step sequencer drum sederhana.', (root) => {
    const TRACKS = [
      { name: 'Kick', play: (c, t, nb) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.3);
      } },
      { name: 'Snare', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
        const g = c.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.2);
        const o = c.createOscillator(), g2 = c.createGain();
        o.type = 'triangle'; o.frequency.value = 190;
        g2.gain.setValueAtTime(0.4, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g2); g2.connect(c.destination); o.start(t); o.stop(t + 0.12);
      } },
      { name: 'Hihat', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
        const g = c.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.08);
      } },
      { name: 'Clap', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
        const g = c.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.18);
      } },
    ];
    const STEPS = 16;
    const state = TRACKS.map(() => Array(STEPS).fill(false));
    const bpmIn = T.input('number', 'BPM', '120');
    const grid = T.el('<div class="drumgrid" style="grid-template-columns:52px repeat(16,1fr)"></div>');
    const cellRefs = [];
    TRACKS.forEach((tr, r) => {
      grid.appendChild(T.el('<div class="mut" style="font-size:12px;display:flex;align-items:center">' + T.esc(tr.name) + '</div>'));
      cellRefs.push([]);
      for (let s = 0; s < STEPS; s++) {
        const cell = T.el('<div class="cell' + (s % 4 === 0 ? ' play' : '') + '" style="' + (s % 4 === 0 ? '' : '') + '"></div>');
        if (s % 4 === 0) cell.style.borderColor = '#52525b';
        cell.addEventListener('click', () => { state[r][s] = !state[r][s]; cell.classList.toggle('on', state[r][s]); });
        grid.appendChild(cell);
        cellRefs[r].push(cell);
      }
    });
    let noiseBuf = null;
    const getNoise = (c) => {
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return noiseBuf;
    };
    let timer = null, step = 0, nextTime = 0, playing = false;
    const mark = (s) => {
      cellRefs.forEach((row) => row.forEach((cell, i) => {
        cell.style.outline = i === s ? '2px solid var(--info)' : '';
      }));
    };
    const scheduler = () => {
      const c = T.actx(), nb = getNoise(c);
      const spb = 60 / Math.min(220, Math.max(40, +bpmIn.value || 120)) / 4;
      while (nextTime < c.currentTime + 0.12) {
        const cur = step % STEPS;
        TRACKS.forEach((tr, r) => { if (state[r][cur]) tr.play(c, nextTime, nb); });
        setTimeout(((cc) => () => mark(cc))(cur), Math.max(0, (nextTime - c.currentTime) * 1000));
        nextTime += spb;
        step++;
      }
    };
    const stop = () => {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      playBtn.textContent = 'Play';
      cellRefs.forEach((row) => row.forEach((cell) => { cell.style.outline = ''; }));
    };
    const playBtn = T.btn('Play', () => {
      if (playing) { stop(); return; }
      T.actx(); playing = true; step = 0; nextTime = T.actx().currentTime + 0.06;
      timer = setInterval(scheduler, 25);
      playBtn.textContent = 'Stop';
    }, true);
    T.onLeave(stop);
    const preset = () => {
      state.forEach((r) => r.fill(false));
      [0, 4, 8, 12].forEach((s) => { state[0][s] = true; });
      [4, 12].forEach((s) => { state[1][s] = true; state[3][s] = true; });
      for (let s = 0; s < 16; s += 2) state[2][s] = true;
      paint();
    };
    const clear = () => { state.forEach((r) => r.fill(false)); paint(); };
    const paint = () => cellRefs.forEach((row, r) => row.forEach((cell, s) => cell.classList.toggle('on', state[r][s])));
    preset();
    root.appendChild(T.field('Tempo (BPM)', bpmIn));
    root.appendChild(grid);
    root.appendChild(T.row(playBtn, T.btn('Pola dasar', preset), T.btn('Bersihkan', clear)));
    root.appendChild(T.el('<p class="hint">Ketuk kotak untuk mengaktifkan/mematikan suara. Semua suara disintesis langsung — tanpa sample.</p>'));
  });

  R('piano', 'Piano Browser', 'musik', '🎹', 'Main piano di browser.', (root) => {
    const wrap = T.el('<div class="piano"></div>');
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const BLACK = new Set([1, 3, 6, 8, 10]);
    const playNote = (midi) => {
      try {
        const c = T.actx();
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        const t = c.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 1.2);
      } catch (e) { /* abaikan */ }
    };
    for (let midi = 60; midi <= 83; midi++) { // C4 – B5
      const pc = midi % 12;
      const isBlack = BLACK.has(pc);
      const key = T.el('<div class="pkey' + (isBlack ? ' black' : '') + '">' + (isBlack ? '' : NAMES[pc] + Math.floor(midi / 12) - 1) + '</div>');
      key.addEventListener('pointerdown', (e) => { e.preventDefault(); playNote(midi); key.style.transform = 'scale(.95)'; setTimeout(() => { key.style.transform = ''; }, 120); });
      wrap.appendChild(key);
    }
    // peta keyboard fisik (opsional)
    const kb = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76 };
    const onKey = (e) => {
      if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const m = kb[e.key.toLowerCase()];
      if (m != null) playNote(m);
    };
    document.addEventListener('keydown', onKey);
    T.onLeave(() => document.removeEventListener('keydown', onKey));
    root.appendChild(wrap);
    root.appendChild(T.el('<p class="hint">Ketuk tutsnya, atau pakai keyboard: A W S E D F T G Y H U J K (oktaf bawah)…</p>'));
  });

  R('white-noise', 'White Noise', 'musik', '🌧️', 'Suara fokus & tidur.', (root) => {
    const jenis = T.select([
      ['hujan', 'Hujan — rintik menenangkan'],
      ['kafe', 'Kafe — dengung ramai yang jauh'],
      ['api', 'Api unggun — hangat + letupan'],
      ['putih', 'White noise — desis datar'],
      ['pink', 'Pink noise — lembut untuk tidur'],
    ], 'hujan');
    const vol = T.el('<input type="range" class="inp" min="0" max="100" value="60">');
    const box = T.out();
    let nodes = null, crackleTimer = null;
    const mkNoise = (c, kind) => {
      const len = c.sampleRate * 2;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      if (kind === 'brown') {
        let last = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      } else if (kind === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
          b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
      } else {
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return b;
    };
    const stop = () => {
      if (crackleTimer) { clearInterval(crackleTimer); crackleTimer = null; }
      if (nodes) {
        try { nodes.src.stop(); } catch (e) {}
        try { nodes.master.disconnect(); } catch (e) {}
        nodes = null;
      }
      playBtn.textContent = 'Putar';
      T.hide(box);
    };
    const start = () => {
      stop();
      const c = T.actx();
      const kind = jenis.value;
      const master = c.createGain();
      master.gain.value = (+vol.value / 100) * 0.6;
      master.connect(c.destination);
      const src = c.createBufferSource();
      src.loop = true;
      let label = '';
      if (kind === 'hujan') {
        src.buffer = mkNoise(c, 'white');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        src.connect(f); f.connect(master); label = 'Hujan';
      } else if (kind === 'kafe') {
        src.buffer = mkNoise(c, 'brown');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
        src.connect(f); f.connect(master); label = 'Kafe';
      } else if (kind === 'api') {
        src.buffer = mkNoise(c, 'brown');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
        const g = c.createGain(); g.gain.value = 0.7;
        src.connect(f); f.connect(g); g.connect(master); label = 'Api unggun';
        // letupan acak
        const pop = () => {
          try {
            const t = c.currentTime;
            const o = c.createBufferSource(); o.buffer = mkNoise(c, 'white');
            const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1500 + Math.random() * 2500; bf.Q.value = 2;
            const og = c.createGain();
            og.gain.setValueAtTime(0.25 + Math.random() * 0.3, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + Math.random() * 0.08);
            o.connect(bf); bf.connect(og); og.connect(master);
            o.start(t); o.stop(t + 0.2);
          } catch (e) {}
        };
        crackleTimer = setInterval(() => { if (Math.random() < 0.75) pop(); }, 260);
      } else if (kind === 'putih') {
        src.buffer = mkNoise(c, 'white');
        src.connect(master); label = 'White noise';
      } else {
        src.buffer = mkNoise(c, 'pink');
        src.connect(master); label = 'Pink noise';
      }
      src.start();
      nodes = { src, master };
      playBtn.textContent = 'Stop';
      T.show(box, '<p class="center mut">' + T.esc(label) + ' sedang diputar…</p>');
    };
    const playBtn = T.btn('Putar', () => { nodes ? stop() : start(); }, true);
    vol.addEventListener('input', () => { if (nodes) nodes.master.gain.value = (+vol.value / 100) * 0.6; });
    jenis.addEventListener('change', () => { if (nodes) start(); });
    T.onLeave(stop);
    root.appendChild(T.field('Jenis suara', jenis));
    root.appendChild(T.field('Volume', vol));
    root.appendChild(T.row(playBtn));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Cocok untuk fokus kerja, menenangkan bayi, atau pengantar tidur. Matikan tab/keluar halaman untuk berhenti total.</p>'));
  });

  R('tts', 'Text-to-Speech', 'musik', '🗣️', 'Bacakan teks bahasa Indonesia.', (root) => {
    const teks = T.ta(5, 'Ketik atau tempel teks di sini…');
    const suara = T.select([], '');
    const rate = T.el('<input type="range" class="inp" min="50" max="200" value="100">');
    const pitch = T.el('<input type="range" class="inp" min="50" max="200" value="100">');
    const box = T.out();
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      if (!synth) return;
      const vs = synth.getVoices();
      const sorted = [...vs].sort((a, b) => {
        const ai = /id[-_]ID/i.test(a.lang) ? 0 : /id/i.test(a.lang) ? 1 : 2;
        const bi = /id[-_]ID/i.test(b.lang) ? 0 : /id/i.test(b.lang) ? 1 : 2;
        return ai - bi;
      });
      suara.innerHTML = '';
      sorted.forEach((v) => {
        const o = document.createElement('option');
        o.value = v.name; o.textContent = v.name + ' (' + v.lang + ')';
        suara.appendChild(o);
      });
      if (!sorted.length) {
        const o = document.createElement('option');
        o.value = ''; o.textContent = 'Suara bawaan sistem';
        suara.appendChild(o);
      }
    };
    if (synth) {
      loadVoices();
      if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    }
    const speak = () => {
      if (!synth) { T.show(box, '<p class="err">Browser tidak mendukung text-to-speech.</p>'); return; }
      const t = teks.value.trim();
      if (!t) { T.show(box, '<p class="warn">Isi teksnya dulu ya.</p>'); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'id-ID';
      const v = synth.getVoices().find((x) => x.name === suara.value);
      if (v) u.voice = v;
      u.rate = +rate.value / 100; u.pitch = +pitch.value / 100;
      u.onend = () => T.hide(box);
      u.onerror = () => T.show(box, '<p class="err">Gagal membacakan teks.</p>');
      synth.speak(u);
      T.show(box, '<p class="center mut">Membacakan…</p>');
    };
    const stop = () => { try { synth && synth.cancel(); } catch (e) {} T.hide(box); };
    T.onLeave(stop);
    root.appendChild(T.field('Teks', teks));
    root.appendChild(T.field('Suara', suara, 'Suara Indonesia (id-ID) diprioritaskan bila tersedia'));
    root.appendChild(T.grid2(
      T.field('Kecepatan (' + rate.value + '%)', rate),
      T.field('Nada (' + pitch.value + '%)', pitch)
    ));
    rate.addEventListener('input', () => { rate.closest('.fld').querySelector('label').textContent = 'Kecepatan (' + rate.value + '%)'; });
    pitch.addEventListener('input', () => { pitch.closest('.fld').querySelector('label').textContent = 'Nada (' + pitch.value + '%)'; });
    root.appendChild(T.row(T.btn('Bacakan', speak, true), T.btn('Stop', stop)));
    root.appendChild(box);
  });

})();
