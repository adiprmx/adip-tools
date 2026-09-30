/* ADIP Tools — tools-e.js
 * 18 tools: Sehari-hari (5) + Fun & Hiburan (6) + Produktivitas & Kesehatan (3)
 *           + Pelajar (3) + Live API (1). Semua jalan 100% di browser.
 */
(function () {
  const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, cats: [], leaveCbs: [] });
  const T = NS.h;
  const R = (id, name, cat, icon, desc, render) => NS.tools.push({ id, name, cat, icon, desc, render });
  const esc = T.esc;

  /* ---------- helper internal ---------- */
  function p2(n) { return String(n).padStart(2, '0'); }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return d;
  }
  function fmtHM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return p2(Math.floor(min / 60)) + ':' + p2(min % 60);
  }
  function toMin(hm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '').trim());
    if (!m) return NaN;
    return (+m[1]) * 60 + (+m[2]);
  }

  /* ================= FUNGSI MURNI (untuk testing) ================= */
  NS.utils.bmi = function (beratKg, tinggiCm) {
    const b = Number(beratKg), h = Number(tinggiCm);
    if (!(b > 0) || !(h > 0)) return null;
    const v = b / Math.pow(h / 100, 2);
    let kategori;
    if (v < 18.5) kategori = 'Kurus (underweight)';
    else if (v < 23) kategori = 'Normal';
    else if (v < 25) kategori = 'Kelebihan berat (overweight)';
    else if (v < 30) kategori = 'Obesitas I';
    else kategori = 'Obesitas II';
    return { bmi: Math.round(v * 10) / 10, kategori };
  };

  NS.utils.bmr = function (gender, beratKg, tinggiCm, umur) {
    const g = String(gender || '').toLowerCase().trim();
    const isMale = /^(pria|laki|laki-laki|male|m|l)$/.test(g);
    const b = Number(beratKg), h = Number(tinggiCm), u = Number(umur);
    if (!(b > 0) || !(h > 0) || !(u > 0)) return NaN;
    return Math.round(10 * b + 6.25 * h - 5 * u + (isMale ? 5 : -161));
  };

  NS.utils.ipk = function (entries) {
    let bobotSks = 0, sks = 0;
    (entries || []).forEach((e) => {
      const s = Number(e && e.sks), bo = Number(e && e.bobot);
      if (s > 0 && !isNaN(bo)) { bobotSks += s * bo; sks += s; }
    });
    if (sks <= 0) return 0;
    return Math.round((bobotSks / sks) * 100) / 100;
  };

  NS.utils.sleepOptions = function (mode, jamAcuan) {
    const ref = toMin(jamAcuan);
    if (isNaN(ref)) return [];
    const out = [];
    if (mode === 'now') {
      const start = ref + 15; // +15 menit waktu tertidur
      [3, 4, 5, 6].forEach((n) => out.push(fmtHM(start + n * 90)));
    } else {
      [4, 5, 6].forEach((n) => out.push(fmtHM(ref - 15 - n * 90)));
    }
    return out;
  };

  NS.utils.ageParts = function (birthISO, refISO) {
    const b = parseISO(birthISO), r = parseISO(refISO);
    if (!b || !r || r < b) return null;
    let tahun = r.getUTCFullYear() - b.getUTCFullYear();
    let bulan = r.getUTCMonth() - b.getUTCMonth();
    let hari = r.getUTCDate() - b.getUTCDate();
    if (hari < 0) {
      bulan -= 1;
      hari += new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), 0)).getUTCDate();
    }
    if (bulan < 0) { tahun -= 1; bulan += 12; }
    return { tahun, bulan, hari, totalHari: Math.floor((r - b) / 86400000) };
  };

  NS.utils.weatherId = function (code) {
    const m = {
      0: 'Cerah', 1: 'Cerah berawan tipis', 2: 'Berawan sebagian', 3: 'Mendung',
      45: 'Berkabut', 48: 'Berkabut tebal',
      51: 'Gerimis ringan', 53: 'Gerimis', 55: 'Gerimis lebat',
      56: 'Gerimis beku', 57: 'Gerimis beku',
      61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat',
      66: 'Hujan es ringan', 67: 'Hujan es lebat',
      71: 'Salju ringan', 73: 'Salju', 75: 'Salju lebat', 77: 'Butiran salju',
      80: 'Hujan rintik', 81: 'Hujan sedang', 82: 'Hujan sangat lebat',
      85: 'Hujan salju ringan', 86: 'Hujan salju lebat',
      95: 'Badai petir', 96: 'Badai petir + hujan es', 99: 'Badai petir + hujan es',
    };
    return m[Number(code)] || 'Tidak diketahui';
  };

  /* ================= 1. BMI & KALORI ================= */
  R('bmi', 'BMI & Kalori', 'sehari', '⚕️', 'BMI + estimasi kebutuhan kalori.', (root) => {
    const berat = T.input('number', 'Berat badan (kg)', '65');
    const tinggi = T.input('number', 'Tinggi badan (cm)', '165');
    const umur = T.input('number', 'Umur (tahun)', '25');
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const aktif = T.select([
      ['1.2', 'Jarang gerak (kantoran)'],
      ['1.375', 'Ringan (olahraga 1–3x/minggu)'],
      ['1.55', 'Sedang (olahraga 3–5x/minggu)'],
      ['1.725', 'Berat (olahraga 6–7x/minggu)'],
      ['1.9', 'Atlet / fisik sangat berat'],
    ], '1.375');
    const box = T.out();
    const hitung = () => {
      const r = NS.utils.bmi(T.num(berat.value), T.num(tinggi.value));
      const bmr = NS.utils.bmr(gender.value, T.num(berat.value), T.num(tinggi.value), T.num(umur.value));
      if (!r || isNaN(bmr)) { T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang valid.</span>'); return; }
      const tdee = Math.round(bmr * Number(aktif.value));
      const warna = r.kategori === 'Normal' ? 'ok' : (r.kategori.indexOf('Obesitas') === 0 ? 'err' : 'warn');
      T.show(box,
        '<div class="center"><div class="dim">Indeks Massa Tubuh</div>' +
        '<div class="big">' + r.bmi.toFixed(1) + '</div>' +
        '<div class="' + warna + '"><b>' + esc(r.kategori) + '</b></div>' +
        '<div class="hint">Standar WHO untuk Asia</div></div>' +
        '<div class="kv"><span class="k">BMR (kalori basal)</span><span class="v">' + T.fmt(bmr) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">TDEE (kebutuhan harian)</span><span class="v">' + T.fmt(tdee) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target turun BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee - 500) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target naik BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee + 500) + ' kkal/hari</span></div>' +
        '<div class="hint">Estimasi kasar untuk panduan umum, bukan pengganti saran dokter/ahli gizi.</div>');
    };
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Umur (tahun)', umur),
      T.field('Jenis kelamin', gender),
    ));
    root.appendChild(T.field('Tingkat aktivitas', aktif));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  });

  /* ================= 2. KALKULATOR UMUR ================= */
  R('age-calc', 'Kalkulator Umur', 'sehari', '🎂', 'Umur presisi tahun-bulan-hari.', (root) => {
    const lahir = T.input('date', 'Tanggal lahir', '2000-01-01');
    const ref = T.input('date', 'Tanggal acuan', todayISO());
    const box = T.out();
    const hitung = () => {
      const r = NS.utils.ageParts(lahir.value, ref.value);
      if (!r) { T.show(box, '<span class="err">Tanggal lahir harus sebelum tanggal acuan.</span>'); return; }
      const totalBulan = r.tahun * 12 + r.bulan;
      const totalMinggu = Math.floor(r.totalHari / 7);
      // ulang tahun berikutnya
      const refD = parseISO(ref.value), lahirD = parseISO(lahir.value);
      let y = refD.getUTCFullYear();
      let next = new Date(Date.UTC(y, lahirD.getUTCMonth(), lahirD.getUTCDate()));
      if (isNaN(next.getTime()) || next < refD) {
        y += 1;
        next = new Date(Date.UTC(y, lahirD.getUTCMonth(), lahirD.getUTCDate()));
      }
      if (isNaN(next.getTime())) next = new Date(Date.UTC(y, 1, 28)); // 29 Feb -> 28 Feb
      const sisa = Math.round((next - refD) / 86400000);
      const tglNext = next.getUTCDate() + '/' + (next.getUTCMonth() + 1) + '/' + next.getUTCFullYear();
      T.show(box,
        '<div class="center"><div class="big">' + r.tahun + ' thn ' + r.bulan + ' bln ' + r.hari + ' hari</div></div>' +
        '<div class="kv"><span class="k">Total hari</span><span class="v">' + T.fmt(r.totalHari) + ' hari</span></div>' +
        '<div class="kv"><span class="k">Total bulan</span><span class="v">' + T.fmt(totalBulan) + ' bulan</span></div>' +
        '<div class="kv"><span class="k">Total minggu</span><span class="v">' + T.fmt(totalMinggu) + ' minggu</span></div>' +
        '<div class="kv"><span class="k">Ulang tahun ke-' + (r.tahun + 1) + '</span><span class="v">' + tglNext + ' (' + (sisa === 0 ? 'hari ini! 🎉' : sisa + ' hari lagi') + ')</span></div>');
    };
    root.appendChild(T.grid2(T.field('Tanggal lahir', lahir), T.field('Tanggal acuan', ref)));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  });


  /* ================= 3. DURASI TANGGAL ================= */
  R('date-duration', 'Durasi Tanggal', 'sehari', '📅', 'Durasi antara dua tanggal.', (root) => {
    const dari = T.input('date', 'Tanggal awal', todayISO());
    const sampai = T.input('date', 'Tanggal akhir', todayISO());
    const cekKerja = document.createElement('input');
    cekKerja.type = 'checkbox'; cekKerja.checked = true; cekKerja.id = 'dd-kj';
    const box = T.out();
    const hitung = () => {
      const a = parseISO(dari.value), b = parseISO(sampai.value);
      if (!a || !b) { T.show(box, '<span class="err">Isi kedua tanggal dengan benar.</span>'); return; }
      const awal = a < b ? a : b, akhir = a < b ? b : a;
      const totalHari = Math.round((akhir - awal) / 86400000);
      const minggu = Math.floor(totalHari / 7), sisaHari = totalHari % 7;
      let html =
        '<div class="center"><div class="big">' + T.fmt(totalHari) + ' hari</div></div>' +
        '<div class="kv"><span class="k">Minggu</span><span class="v">' + minggu + ' minggu ' + sisaHari + ' hari</span></div>' +
        '<div class="kv"><span class="k">Bulan (perkiraan)</span><span class="v">± ' + (totalHari / 30.44).toFixed(1) + ' bulan</span></div>' +
        '<div class="kv"><span class="k">Tahun (perkiraan)</span><span class="v">± ' + (totalHari / 365.25).toFixed(2) + ' tahun</span></div>';
      if (cekKerja.checked) {
        let kerja = 0;
        for (let t = awal.getTime(); t < akhir.getTime(); t += 86400000) {
          const w = new Date(t).getUTCDay();
          if (w >= 1 && w <= 5) kerja++;
        }
        html += '<div class="kv"><span class="k">Hari kerja (Senin–Jumat)</span><span class="v">' + T.fmt(kerja) + ' hari</span></div>';
      }
      T.show(box, html);
    };
    root.appendChild(T.grid2(T.field('Tanggal awal', dari), T.field('Tanggal akhir', sampai)));
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(cekKerja);
    lbl.appendChild(document.createTextNode('Hitung hari kerja (Senin–Jumat)'));
    root.appendChild(lbl);
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  });

  /* ================= 4. STOPWATCH ================= */
  R('stopwatch', 'Stopwatch', 'sehari', '🏁', 'Stopwatch + catat lap.', (root) => {
    const disp = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">00:00.00</div>');
    const lapBox = T.out();
    let startTs = 0, acc = 0, running = false, iv = null, laps = [];
    const now = () => acc + (running ? performance.now() - startTs : 0);
    const fmt = (ms) => {
      ms = Math.max(0, Math.floor(ms));
      return p2(Math.floor(ms / 60000)) + ':' + p2(Math.floor(ms / 1000) % 60) + '.' + p2(Math.floor(ms / 10) % 100);
    };
    const paintLaps = () => {
      if (!laps.length) { T.hide(lapBox); return; }
      let html = '';
      laps.forEach((l, i) => {
        html += '<div class="kv"><span class="k">Lap ' + (i + 1) + '</span><span class="v">' + fmt(l.t) +
          ' <span class="dim">(+' + fmt(l.d) + ')</span></span></div>';
      });
      T.show(lapBox, html);
    };
    const start = () => {
      if (running) return;
      running = true; startTs = performance.now();
      iv = setInterval(() => { disp.textContent = fmt(now()); }, 47);
      T.toast('Berjalan…');
    };
    const stop = () => {
      if (!running) return;
      acc = now(); running = false;
      clearInterval(iv); iv = null;
      disp.textContent = fmt(acc);
    };
    const reset = () => { stop(); acc = 0; laps = []; disp.textContent = '00:00.00'; T.hide(lapBox); };
    const lap = () => {
      if (!running) { T.toast('Jalankan dulu stopwatch-nya'); return; }
      const t = now();
      laps.push({ t, d: laps.length ? t - laps[laps.length - 1].t : t });
      paintLaps();
    };
    T.onLeave(() => { if (iv) clearInterval(iv); });
    root.appendChild(disp);
    root.appendChild(T.row(T.btn('▶ Start', start, true), T.btn('⏸ Stop', stop), T.btn('↺ Reset', reset)));
    root.appendChild(T.row(T.btn('🏁 Lap', lap)));
    root.appendChild(lapBox);
  });

  /* ================= 5. PANTUN PEMBUKA ================= */
  R('pantun', 'Pantun Pembuka', 'sehari', '🎭', 'Template pantun buat presentasi.', (root) => {
    const PEMBUKA = [
      { t: 'formal', b: 'Pagi hari embun menetes,\nBurung berkicau di dahan jati.\nIzinkan saya membuka sesi,\nDengan salam hormat yang berarti.' },
      { t: 'formal', b: 'Jalan-jalan ke kota Medan,\nSinggah sebentar membeli duku.\nSelamat pagi hadirin sekalian,\nTerima kasih atas waktu dan perhatianmu.' },
      { t: 'formal', b: 'Ke pasar membeli kain batik,\nBatik indah buatan Solo.\nDengan rendah hati saya angkat topik,\nSemoga bermanfaat bagi kita semua.' },
      { t: 'formal', b: 'Burung garuda terbang tinggi,\nHinggap sebentar di pohon mangga.\nAssalamu\u2019alaikum saya sampaikan lagi,\nSemoga acara berjalan lancar jaya.' },
      { t: 'santai', b: 'Main ke pantai bawa kelapa,\nKelapa muda manis rasanya.\nSantai saja kita belajar bersama,\nYang penting pulang bawa ilmunya.' },
      { t: 'santai', b: 'Ke warung beli gorengan,\nGorengan hangat lima ribuan.\nJangan tegang dengarkan presentasi,\nKita diskusi bareng-bareng kawan.' },
      { t: 'santai', b: 'Naik kereta ke Bandung,\nBandung dingin udaranya.\nSambil ngopi kita sambung,\nMateri asyik, jangan ke mana-mana.' },
      { t: 'santai', b: 'Beli batagor di pinggir jalan,\nBatagor enak bumbunya kacang.\nDuduk santai dengarkan penjelasan,\nKalau bingung langsung tanya abang.' },
      { t: 'lucu', b: 'Ada kucing makan ikan,\nIkannya digoreng pakai mentega.\nJangan panik, jangan deg-degan,\nPresentasi ini anti bikin nganga.' },
      { t: 'lucu', b: 'Ke dapur masak mi instan,\nMi-nya enak, kuahnya seger.\nKalau ngantuk, tahan-tahan,\nSebentar lagi kita bubar, geser.' },
      { t: 'lucu', b: 'Beli es teh di pinggir jalan,\nEs teh manis campur jeruk nipis.\nWalaupun saya bukan pujangga,\nPantun ini khusus buat yang manis.' },
      { t: 'lucu', b: 'Kuda nil berendam di kali,\nAirnya keruh, lumpurnya tebal.\nSaya deg-degan setengah mati,\nTapi demi nilai, saya tetap nekat.' },
    ];
    const PENUTUP = [
      { t: 'semua', b: 'Burung nuri, burung cendrawasih,\nCukup sekian dan terima kasih.' },
      { t: 'semua', b: 'Jalan-jalan ke kota tua,\nPulang-pulang bawa oleh-oleh.\nMohon maaf bila ada salah kata,\nSampai jumpa di lain waktu, boleh?' },
      { t: 'semua', b: 'Pohon kelapa daunnya lebat,\nBuahnya manis, isinya segar.\nPresentasi saya sudah tamat,\nSemoga ilmu makin mekar.' },
      { t: 'semua', b: 'Naik delman ke Pasar Senen,\nPulangnya mampir beli sate.\nSekian dulu dari saya, kawan,\nKurang lebihnya mohon maaf, ya.' },
      { t: 'semua', b: 'Makan soto di warung pinggir,\nSoto panas, kuahnya kental.\nSelesai sudah materi yang tersaji,\nTerima kasih, sampai jumpa kembali.' },
      { t: 'semua', b: 'Ke toko membeli buku,\nBuku tulis sampulnya biru.\nSaya tutup dengan doa dan restu,\nSukses selalu untukmu.' },
      { t: 'formal', b: 'Bunga mawar, bunga melati,\nHarum semerbak di pagi hari.\nAkhir kata saya tutup presentasi,\nWassalamu\u2019alaikum, terima kasih sekali.' },
      { t: 'lucu', b: 'Ikan hiu makan tomat,\nI love you so much.\nSelesai sudah, jangan ngantuk berat,\nSemoga ilmunya nempel terus.' },
    ];
    const tema = T.select([['semua', 'Semua tema'], ['formal', 'Formal'], ['santai', 'Santai'], ['lucu', 'Lucu']], 'semua');
    const jenis = T.select([['pembuka', 'Pembuka'], ['penutup', 'Penutup']], 'pembuka');
    const box = T.out();
    let current = '';
    const acak = () => {
      const bank = jenis.value === 'pembuka' ? PEMBUKA : PENUTUP;
      const pool = bank.filter((p) => tema.value === 'semua' || p.t === 'semua' || p.t === tema.value);
      if (!pool.length) { T.show(box, '<span class="err">Tidak ada pantun untuk kombinasi ini.</span>'); return; }
      current = pool[Math.floor(Math.random() * pool.length)].b;
      T.show(box, '<pre>' + esc(current) + '</pre>');
    };
    root.appendChild(T.grid2(T.field('Tema', tema), T.field('Jenis', jenis)));
    root.appendChild(T.row(T.btn('🎲 Acak pantun', acak, true), T.copyBtn(() => current || 'Acak dulu pantunnya', 'Salin')));
    root.appendChild(box);
    acak();
    tema.addEventListener('change', acak);
    jenis.addEventListener('change', acak);
  });


  /* ================= 6. PENGACAK KEPUTUSAN ================= */
  R('decision', 'Pengacak Keputusan', 'fun', '🔮', 'Bantu ambil keputusan.', (root) => {
    const mode = T.select([
      ['yatidak', 'Ya / Tidak'],
      ['daftar', 'Pilih dari daftar'],
      ['koin', 'Lempar koin'],
      ['angka', 'Angka acak (range)'],
    ], 'yatidak');
    const taOpsi = T.ta(4, 'Satu opsi per baris\nmisal:\nNonton bioskop\nMakan di luar\nMain ke pantai');
    const minN = T.input('number', 'Min', '1');
    const maxN = T.input('number', 'Maks', '100');
    const box = T.out();
    let iv = null, to = null;
    const bersih = () => { if (iv) clearInterval(iv); if (to) clearTimeout(to); iv = null; to = null; };
    T.onLeave(bersih);
    const modeBox = T.el('<div></div>');
    const paintMode = () => {
      modeBox.innerHTML = '';
      if (mode.value === 'daftar') modeBox.appendChild(T.field('Daftar opsi', taOpsi, 'Satu opsi per baris.'));
      if (mode.value === 'angka') modeBox.appendChild(T.grid2(T.field('Angka terkecil', minN), T.field('Angka terbesar', maxN)));
    };
    mode.addEventListener('change', paintMode);
    paintMode();
    const putuskan = () => {
      let kandidat = [];
      if (mode.value === 'yatidak') kandidat = ['YA ✅', 'TIDAK ❌'];
      else if (mode.value === 'koin') kandidat = ['GAMBAR 🪙', 'ANGKA 🔢'];
      else if (mode.value === 'angka') {
        let a = Math.round(T.num(minN.value)), b = Math.round(T.num(maxN.value));
        if (isNaN(a) || isNaN(b)) { T.show(box, '<span class="err">Isi range angka dengan benar.</span>'); return; }
        if (a > b) { const t = a; a = b; b = t; }
        kandidat = ['__range__'];
        var rangeA = a, rangeB = b;
      } else {
        kandidat = taOpsi.value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!kandidat.length) { T.show(box, '<span class="err">Tulis dulu daftar opsinya.</span>'); return; }
      }
      bersih();
      const hasil = kandidat[0] === '__range__'
        ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
        : kandidat[Math.floor(Math.random() * kandidat.length)];
      let n = 0;
      T.show(box, '<div class="center dim">Mengacak…</div>');
      iv = setInterval(() => {
        n++;
        const acakTampil = kandidat[0] === '__range__'
          ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
          : kandidat[Math.floor(Math.random() * kandidat.length)];
        T.show(box, '<div class="center"><div class="dim">Mengacak…</div><div class="big">' + esc(acakTampil) + '</div></div>');
        if (n > 12) { bersih(); T.show(box, '<div class="center"><div class="dim">Keputusannya:</div><div class="big">' + esc(hasil) + '</div></div>'); T.beep(660, 0.25, 'sine'); T.beep(880, 0.3, 'sine', 0.22); }
      }, 80);
    };
    root.appendChild(T.field('Mode', mode));
    root.appendChild(modeBox);
    root.appendChild(T.btn('🔮 Putuskan!', putuskan, true));
    root.appendChild(box);
  });

  /* ================= 7. DADU ================= */
  R('dice', 'Dadu', 'fun', '🎲', 'Lempar dadu + riwayat.', (root) => {
    const jumlah = T.select([['1', '1 dadu'], ['2', '2 dadu'], ['3', '3 dadu'], ['4', '4 dadu'], ['5', '5 dadu'], ['6', '6 dadu']], '2');
    const sisi = T.select([['4', 'd4'], ['6', 'd6'], ['8', 'd8'], ['10', 'd10'], ['12', 'd12'], ['20', 'd20']], '6');
    const box = T.out();
    const riwBox = T.out();
    const riwayat = [];
    const lempar = () => {
      const n = Number(jumlah.value), s = Number(sisi.value);
      const hasil = [];
      for (let i = 0; i < n; i++) hasil.push(1 + Math.floor(Math.random() * s));
      const total = hasil.reduce((a, b) => a + b, 0);
      T.show(box,
        '<div class="center"><div class="dim">' + n + 'd' + s + '</div><div class="big">' + hasil.join(' · ') + '</div>' +
        '<div class="info">Total: <b>' + total + '</b></div></div>');
      riwayat.unshift({ n, s, hasil, total });
      if (riwayat.length > 20) riwayat.pop();
      T.show(riwBox, '<div class="dim" style="margin-bottom:6px">Riwayat lemparan</div>' +
        riwayat.map((r) => '<div class="kv"><span class="k">' + r.n + 'd' + r.s + '</span><span class="v">' + r.hasil.join(', ') + ' = <b>' + r.total + '</b></span></div>').join(''));
      T.beep(520, 0.12, 'square');
    };
    root.appendChild(T.grid2(T.field('Jumlah dadu', jumlah), T.field('Sisi dadu', sisi)));
    root.appendChild(T.btn('🎲 Lempar', lempar, true));
    root.appendChild(box);
    root.appendChild(riwBox);
    T.hide(riwBox);
  });

  /* ================= 8. RODA PUTAR ================= */
  R('spinwheel', 'Roda Putar', 'fun', '🎡', 'Spin wheel visual.', (root) => {
    const taOpsi = T.ta(5, 'Satu nama per baris\nmisal:\nAndi\nBudi\nCitra\nDewi');
    taOpsi.value = 'Andi\nBudi\nCitra\nDewi\nEka';
    const hapus = document.createElement('input');
    hapus.type = 'checkbox'; hapus.checked = true;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;max-width:320px;display:block;margin:8px auto';
    const box = T.out();
    const TAU = Math.PI * 2;
    let rot = 0, raf = null, spinning = false;
    T.onLeave(() => { if (raf) cancelAnimationFrame(raf); });
    const getOpts = () => taOpsi.value.split('\n').map((s) => s.trim()).filter(Boolean);
    function draw() {
      const opts = getOpts();
      const dpr = window.devicePixelRatio || 1, S = 320;
      canvas.width = S * dpr; canvas.height = S * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const cx = S / 2, cy = S / 2, Rr = S / 2 - 6;
      const n = Math.max(opts.length, 1), seg = TAU / n;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Rr, rot + i * seg, rot + (i + 1) * seg);
        ctx.closePath();
        ctx.fillStyle = 'hsl(' + Math.round((i * 360) / n) + ',65%,52%)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.stroke();
        if (opts[i]) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot + (i + 0.5) * seg);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px system-ui,sans-serif';
          const label = opts[i].length > 14 ? opts[i].slice(0, 13) + '…' : opts[i];
          ctx.fillText(label, Rr - 12, 5);
          ctx.restore();
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, TAU);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('SPIN', cx, cy + 4);
      // penunjuk (segitiga di atas)
      ctx.beginPath();
      ctx.moveTo(cx - 10, 2); ctx.lineTo(cx + 10, 2); ctx.lineTo(cx, 24);
      ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    }
    const putar = () => {
      const opts = getOpts();
      if (opts.length < 2) { T.toast('Isi minimal 2 opsi'); return; }
      if (spinning) return;
      spinning = true;
      const start = rot, dur = 4200 + Math.random() * 1800;
      const extra = (5 + Math.random() * 4) * TAU + Math.random() * TAU;
      const t0 = performance.now();
      const frame = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        rot = start + extra * e;
        draw();
        if (p < 1) raf = requestAnimationFrame(frame);
        else {
          spinning = false;
          const seg = TAU / opts.length;
          const pos = (((-Math.PI / 2 - rot) % TAU) + TAU) % TAU;
          const idx = Math.floor(pos / seg) % opts.length;
          const menang = opts[idx];
          T.show(box, '<div class="center"><div class="dim">Pemenang</div><div class="big">🎉 ' + esc(menang) + '</div></div>');
          T.beep(660, 0.15); T.beep(880, 0.15, 'sine', 0.15); T.beep(1100, 0.3, 'sine', 0.3);
          if (hapus.checked) {
            const sisa = getOpts().filter((_, i) => i !== idx);
            taOpsi.value = sisa.join('\n');
            T.toast(menang + ' dihapus dari daftar');
            draw();
          }
        }
      };
      raf = requestAnimationFrame(frame);
    };
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(hapus);
    lbl.appendChild(document.createTextNode('Hapus pemenang dari daftar'));
    root.appendChild(T.field('Daftar opsi (satu per baris)', taOpsi));
    root.appendChild(lbl);
    root.appendChild(canvas);
    root.appendChild(T.btn('🎡 PUTAR', putar, true));
    root.appendChild(box);
    draw();
    taOpsi.addEventListener('input', draw);
  });

  /* ================= 9. TES REFLEKS ================= */
  R('reaction', 'Tes Refleks', 'fun', '⚡', 'Ukur kecepatan refleks.', (root) => {
    const area = T.el('<div class="out center" style="min-height:150px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;user-select:none"></div>');
    const statBox = T.out();
    let state = 'idle', t0 = 0, timer = null, tries = [];
    T.onLeave(() => { if (timer) clearTimeout(timer); });
    const paint = (bg, teks, sub) => {
      area.style.background = bg;
      area.innerHTML = '<div class="big">' + teks + '</div>' + (sub ? '<div class="dim" style="margin-top:6px">' + sub + '</div>' : '');
    };
    const ringkas = () => {
      const ok = tries.filter((x) => x != null);
      if (tries.length >= 5) {
        const avg = ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : 0;
        const best = ok.length ? Math.min.apply(null, ok) : null;
        T.show(statBox,
          '<div class="center"><div class="dim">5 percobaan selesai!</div>' +
          (ok.length
            ? '<div class="kv"><span class="k">Rata-rata</span><span class="v">' + avg + ' ms</span></div>' +
              '<div class="kv"><span class="k">Terbaik</span><span class="v">' + best + ' ms</span></div>'
            : '<div class="err">Semua percobaan gagal — coba lagi lebih sabar 😅</div>') + '</div>');
        tries = [];
        paint('#222', 'Klik area ini untuk mulai lagi', '5 percobaan selesai');
        T.beep(880, 0.2);
      } else if (ok.length) {
        const best = Math.min.apply(null, ok);
        T.show(statBox, '<div class="dim center">Percobaan ' + tries.length + '/5 · terbaik: <b>' + best + ' ms</b></div>');
      }
    };
    const mulai = () => {
      state = 'wait';
      paint('#3a0d0d', 'Tunggu…', 'Jangan klik dulu!');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        state = 'ready';
        paint('#0d3a1a', 'KLIK!', 'Sekarang!');
        t0 = performance.now();
      }, 1000 + Math.random() * 3000);
    };
    area.addEventListener('click', () => {
      if (state === 'idle') { mulai(); return; }
      if (state === 'wait') {
        clearTimeout(timer);
        state = 'idle';
        tries.push(null);
        paint('#222', 'Terlalu cepat! 😅', 'Klik "Mulai" untuk coba lagi');
        T.show(statBox, '<div class="err center">Gagal — klik sebelum hijau. Percobaan ' + tries.length + '/5.</div>');
        ringkas();
        return;
      }
      if (state === 'ready') {
        const ms = Math.round(performance.now() - t0);
        state = 'idle';
        tries.push(ms);
        paint('#222', ms + ' ms', ms < 250 ? 'Cepat banget! ⚡' : ms < 400 ? 'Lumayan!' : 'Bisa lebih cepat lagi');
        ringkas();
      }
    });
    root.appendChild(T.el('<div class="hint" style="margin-bottom:8px">Klik area di bawah untuk mulai. Begitu berubah hijau, klik secepat mungkin! 5x percobaan.</div>'));
    root.appendChild(area);
    root.appendChild(statBox);
    T.hide(statBox);
    paint('#222', 'Klik area ini untuk mulai', 'Uji kecepatan refleksmu');
  });


  /* ================= 10. NAMA BAYI ================= */
  R('baby-name', 'Nama Bayi', 'fun', '👶', 'Nama bayi Indonesia + arti.', (root) => {
    const L = [
      ['Aditya', 'matahari'], ['Arjuna', 'pahlawan yang bersih hatinya'], ['Bagas', 'tegap dan kuat'],
      ['Bayu', 'angin yang memberi kehidupan'], ['Bima', 'kuat dan berani'], ['Damar', 'cahaya penerang'],
      ['Dimas', 'adik tercinta'], ['Eka', 'yang pertama dan utama'], ['Fajar', 'cahaya pagi hari'],
      ['Galang', 'menegakkan kebenaran'], ['Gilang', 'bercahaya'], ['Hadi', 'pemberi petunjuk'],
      ['Hendra', 'kuat dan perkasa'], ['Indra', 'pemimpin yang agung'], ['Jatmiko', 'terhormat dan mulia'],
      ['Langit', 'setinggi langit cita-citanya'], ['Mahesa', 'kuat bagai banteng'], ['Nara', 'pemimpin umat'],
      ['Pandu', 'bijaksana'], ['Raditya', 'matahari pagi'], ['Rangga', 'tampan bagai bunga'],
      ['Sakti', 'berkuasa dan sakti'], ['Satria', 'ksatria pemberani'], ['Surya', 'matahari'],
      ['Taufik', 'mendapat petunjuk Tuhan'],
    ];
    const P = [
      ['Anisa', 'ramah dan bersahabat'], ['Ayu', 'cantik'], ['Bunga', 'indah bagai bunga'],
      ['Cahya', 'cahaya'], ['Dewi', 'bidadari'], ['Dinda', 'adik kesayangan'],
      ['Fitri', 'suci dan bersih'], ['Intan', 'permata yang berharga'], ['Kartika', 'bintang'],
      ['Kirana', 'cahaya yang indah'], ['Laras', 'selaras dan harmonis'], ['Lestari', 'abadi'],
      ['Lintang', 'bintang di langit'], ['Maya', 'cahaya yang mempesona'], ['Melati', 'suci bagai bunga melati'],
      ['Nabila', 'mulia'], ['Nadia', 'penuh harapan'], ['Putri', 'putri raja'],
      ['Ratna', 'permata'], ['Ratri', 'malam yang tenang'], ['Sari', 'inti yang terbaik'],
      ['Sekar', 'bunga'], ['Wulan', 'bulan purnama'], ['Zahra', 'bersinar terang'],
      ['Cinta', 'penuh kasih sayang'],
    ];
    const gender = T.select([['semua', 'Semua'], ['l', 'Laki-laki'], ['p', 'Perempuan']], 'semua');
    const gabung = document.createElement('input');
    gabung.type = 'checkbox';
    const box = T.out();
    let current = '';
    const acak = () => {
      let pool = [];
      if (gender.value === 'l') pool = L;
      else if (gender.value === 'p') pool = P;
      else pool = L.concat(P);
      const pick = () => pool[Math.floor(Math.random() * pool.length)];
      let nama, arti;
      if (gabung.checked && pool.length > 1) {
        const a = pick(); let b = pick(), guard = 0;
        while (b[0] === a[0] && guard++ < 20) b = pick();
        nama = a[0] + ' ' + b[0];
        arti = a[1] + '; ' + b[1];
      } else {
        const p = pick();
        nama = p[0]; arti = p[1];
      }
      current = nama;
      T.show(box,
        '<div class="center"><div class="dim">Nama untuk si kecil</div>' +
        '<div class="big">' + esc(nama) + '</div>' +
        '<div class="info">Artinya: ' + esc(arti) + '</div></div>');
    };
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(gabung);
    lbl.appendChild(document.createTextNode('Gabung 2 nama (nama depan + belakang)'));
    root.appendChild(T.field('Jenis kelamin', gender));
    root.appendChild(lbl);
    root.appendChild(T.row(T.btn('👶 Acak nama', acak, true), T.copyBtn(() => current || 'Acak dulu namanya', 'Salin')));
    root.appendChild(box);
    acak();
    gender.addEventListener('change', acak);
  });

  /* ================= 11. HARI JADIAN ================= */
  R('couple-days', 'Hari Jadian', 'fun', '💑', 'Sudah berapa hari bareng?', (root) => {
    const tgl = T.input('date', 'Tanggal jadian', todayISO());
    const box = T.out();
    const hitung = () => {
      const p = NS.utils.ageParts(tgl.value, todayISO());
      if (!p) { T.show(box, '<span class="err">Tanggal jadian tidak boleh di masa depan.</span>'); return; }
      const d = p.totalHari;
      let html = '<div class="center"><div class="dim">Kalian sudah bersama</div>' +
        '<div class="big">💑 ' + T.fmt(d) + ' hari</div>' +
        '<div class="dim">≈ ' + p.tahun + ' tahun ' + p.bulan + ' bulan ' + p.hari + ' hari</div></div>';
      const MS = [100, 365, 500, 1000, 1500, 2000];
      html += '<div class="dim" style="margin:8px 0 4px">Milestone</div>';
      MS.forEach((m) => {
        if (d >= m) html += '<div class="kv"><span class="k">' + m + ' hari</span><span class="v ok">✅ lewat ' + T.fmt(d - m) + ' hari lalu</span></div>';
        else html += '<div class="kv"><span class="k">' + m + ' hari</span><span class="v">⏳ ' + T.fmt(m - d) + ' hari lagi</span></div>';
      });
      // anniversary tahunan
      const jd = parseISO(tgl.value);
      const nowD = parseISO(todayISO());
      let y = nowD.getUTCFullYear();
      let ann = new Date(Date.UTC(y, jd.getUTCMonth(), jd.getUTCDate()));
      if (isNaN(ann.getTime())) ann = new Date(Date.UTC(y, 1, 28));
      if (ann <= nowD) {
        y += 1;
        ann = new Date(Date.UTC(y, jd.getUTCMonth(), jd.getUTCDate()));
        if (isNaN(ann.getTime())) ann = new Date(Date.UTC(y, 1, 28));
      }
      const sisa = Math.round((ann - nowD) / 86400000);
      html += '<div class="kv"><span class="k">🎂 Anniversary tahun ke-' + (y - jd.getUTCFullYear()) + '</span><span class="v">' +
        T.fmt(sisa) + ' hari lagi</span></div>';
      T.show(box, html);
    };
    root.appendChild(T.field('Tanggal jadian', tgl));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  });

  /* ================= 12. POMODORO TIMER ================= */
  R('pomodoro', 'Pomodoro Timer', 'produktivitas', '🍅', 'Timer fokus 25/5.', (root) => {
    const dur = { focus: 25, short: 5, long: 15 };
    const label = { focus: 'Fokus', short: 'Istirahat', long: 'Istirahat Panjang' };
    let mode = 'focus', total = dur.focus * 60, left = total, iv = null, running = false, siklus = 0;
    const judulAsli = document.title;
    const disp = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">25:00</div>');
    const modeLbl = T.el('<div class="center dim" style="margin-bottom:6px">🍅 Mode: <b>Fokus</b></div>');
    const cycBox = T.out();
    const inF = T.input('number', 'Fokus', '25');
    const inS = T.input('number', 'Istirahat', '5');
    const inL = T.input('number', 'Istirahat panjang', '15');
    const fmtT = (s) => p2(Math.floor(s / 60)) + ':' + p2(s % 60);
    const paintSiklus = () => {
      T.show(cycBox, '<div class="center dim">Sesi fokus selesai: <b>' + siklus + '</b> 🍅' +
        (siklus > 0 && siklus % 4 === 0 ? '<br><span class="info">Sudah 4 sesi — saatnya istirahat panjang!</span>' : '') + '</div>');
    };
    const setMode = (m, resetTimer) => {
      mode = m; total = Math.max(1, Math.round(Number(dur[m]))) * 60; left = total;
      disp.textContent = fmtT(left);
      modeLbl.innerHTML = '🍅 Mode: <b>' + label[m] + '</b>';
      document.title = label[m] + ' ' + fmtT(left) + ' · ' + judulAsli;
      if (resetTimer && iv) { clearInterval(iv); iv = null; running = false; }
    };
    const selesai = () => {
      clearInterval(iv); iv = null; running = false;
      if (mode === 'focus') siklus++;
      T.beep(880, 0.2); T.beep(880, 0.2, 'sine', 0.3); T.beep(1320, 0.4, 'sine', 0.6);
      document.title = '⏰ ' + label[mode] + ' selesai! · ' + judulAsli;
      T.toast(label[mode] + ' selesai!');
      paintSiklus();
    };
    const tick = () => {
      left--;
      if (left <= 0) { disp.textContent = '00:00'; selesai(); return; }
      disp.textContent = fmtT(left);
      document.title = label[mode] + ' ' + fmtT(left) + ' · ' + judulAsli;
    };
    const start = () => {
      if (running) return;
      running = true;
      iv = setInterval(tick, 1000);
    };
    const jeda = () => { if (iv) clearInterval(iv); iv = null; running = false; };
    const resetT = () => { jeda(); left = total; disp.textContent = fmtT(left); document.title = judulAsli; };
    T.onLeave(() => { if (iv) clearInterval(iv); document.title = judulAsli; });
    const tabs = T.row(
      T.btn('🍅 Fokus', () => setMode('focus', true)),
      T.btn('☕ 5 mnt', () => setMode('short', true)),
      T.btn('🌴 15 mnt', () => setMode('long', true)),
    );
    const terapkan = () => {
      const f = Math.round(T.num(inF.value)), s = Math.round(T.num(inS.value)), l = Math.round(T.num(inL.value));
      if (!(f > 0) || !(s > 0) || !(l > 0)) { T.toast('Durasi harus angka positif'); return; }
      dur.focus = f; dur.short = s; dur.long = l;
      setMode(mode, true);
      T.toast('Durasi diperbarui');
    };
    root.appendChild(tabs);
    root.appendChild(modeLbl);
    root.appendChild(disp);
    root.appendChild(T.row(T.btn('▶ Mulai', start, true), T.btn('⏸ Jeda', jeda), T.btn('↺ Reset', resetT)));
    root.appendChild(cycBox);
    T.hide(cycBox);
    root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px">Atur durasi (menit)</div>'));
    root.appendChild(T.grid2(T.field('Fokus', inF), T.field('Istirahat', inS), T.field('Istirahat panjang', inL)));
    root.appendChild(T.btn('Terapkan durasi', terapkan));
    paintSiklus();
  });


  /* ================= 13. SIKLUS TIDUR ================= */
  R('sleep-cycle', 'Siklus Tidur', 'produktivitas', '😴', 'Jam bangun ideal per 90 menit.', (root) => {
    const mode = T.select([['now', '😴 Saya mau tidur sekarang'], ['wake', '⏰ Saya harus bangun jam…']], 'now');
    const jamBangun = T.input('time', 'Jam bangun', '06:00');
    const box = T.out();
    const siklusOf = { 3: '3 siklus', 4: '4 siklus', 5: '5 siklus', 6: '6 siklus' };
    const hitung = () => {
      const jamList = mode.value === 'now'
        ? NS.utils.sleepOptions('now', (() => { const d = new Date(); return p2(d.getHours()) + ':' + p2(d.getMinutes()); })())
        : NS.utils.sleepOptions('wake', jamBangun.value || '06:00');
      if (!jamList.length) { T.show(box, '<span class="err">Isi jam dengan format HH:MM.</span>'); return; }
      const siklus = mode.value === 'now' ? [3, 4, 5, 6] : [4, 5, 6];
      let html = mode.value === 'now'
        ? '<div class="dim" style="margin-bottom:6px">Kalau tidur sekarang, bangunlah di jam ini (sudah termasuk ±15 menit waktu tertidur):</div>'
        : '<div class="dim" style="margin-bottom:6px">Supaya bangun jam <b>' + esc(jamBangun.value || '06:00') + '</b> dengan segar, tidurlah di jam ini:</div>';
      jamList.forEach((j, i) => {
        const dur = (siklus[i] * 1.5).toFixed(1).replace('.', ',');
        const rekom = (siklus[i] === 5 || siklus[i] === 6) ? ' <span class="ok">⭐ ideal</span>' : '';
        html += '<div class="kv"><span class="k">' + siklusOf[siklus[i]] + ' (' + dur + ' jam)</span><span class="v big" style="font-size:20px">' + j + '</span></div>' + (rekom ? '<div class="hint" style="margin:-4px 0 4px;text-align:right">' + rekom.trim() + '</div>' : '');
      });
      html += '<div class="hint">Satu siklus tidur ≈ 90 menit. Bangun di akhir siklus bikin badan terasa lebih segar.</div>';
      T.show(box, html);
    };
    const jamWrap = T.el('<div></div>');
    const paintMode = () => {
      jamWrap.innerHTML = '';
      if (mode.value === 'wake') jamWrap.appendChild(T.field('Jam bangun yang diinginkan', jamBangun));
      hitung();
    };
    mode.addEventListener('change', paintMode);
    jamBangun.addEventListener('change', hitung);
    root.appendChild(T.field('Mode', mode));
    root.appendChild(jamWrap);
    root.appendChild(box);
    paintMode();
  });

  /* ================= 14. TRACKER AIR MINUM ================= */
  R('water-tracker', 'Tracker Air Minum', 'produktivitas', '💧', 'Target minum harian.', (root) => {
    const KEY = 'adip-tools:water';
    const load = () => {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (d && d.date === todayISO()) return d;
      } catch (e) {}
      return { date: todayISO(), ml: 0, target: 2000 };
    };
    const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
    let st = load();
    const bar = T.el('<div style="background:#1c1c1e;border-radius:10px;height:26px;overflow:hidden;margin:10px 0"></div>');
    const fill = T.el('<div style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#0ea5e9);transition:width .3s;display:flex;align-items:center;justify-content:flex-end"></div>');
    const pctLbl = T.el('<span style="font-size:12px;font-weight:700;color:#001;padding-right:8px"></span>');
    fill.appendChild(pctLbl);
    bar.appendChild(fill);
    const info = T.el('<div class="center"></div>');
    const targetInp = T.input('number', 'Target harian (ml)', String(st.target));
    const beratInp = T.input('number', 'Berat badan (kg) — untuk saran', '');
    const paint = () => {
      const pct = Math.min(100, Math.round((st.ml / st.target) * 100));
      fill.style.width = pct + '%';
      pctLbl.textContent = pct + '%';
      info.innerHTML = '<div class="big">' + T.fmt(st.ml) + ' <span class="dim" style="font-size:16px">/ ' + T.fmt(st.target) + ' ml</span></div>' +
        (st.ml >= st.target ? '<div class="ok">🎉 Target tercapai! Pertahankan!</div>' : '<div class="dim">Kurang ' + T.fmt(Math.max(0, st.target - st.ml)) + ' ml lagi</div>');
    };
    const tambah = (n) => { st.ml += n; save(st); paint(); T.beep(700, 0.1); };
    const saran = () => {
      const bb = T.num(beratInp.value);
      if (!(bb > 0)) { T.toast('Isi berat badan dulu'); return; }
      st.target = Math.round(bb * 30);
      targetInp.value = String(st.target);
      save(st); paint();
      T.toast('Target diset: ' + T.fmt(st.target) + ' ml');
    };
    root.appendChild(info);
    root.appendChild(bar);
    root.appendChild(T.row(T.btn('+250 ml', () => tambah(250), true), T.btn('+500 ml', () => tambah(500), true)));
    root.appendChild(T.row(T.btn('↺ Reset hari ini', () => { st = { date: todayISO(), ml: 0, target: st.target }; save(st); paint(); })));
    root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px">Pengaturan</div>'));
    root.appendChild(T.grid2(T.field('Target harian (ml)', targetInp), T.field('Berat badan (kg)', beratInp, 'Saran: 30 ml × berat badan')));
    root.appendChild(T.row(
      T.btn('Simpan target', () => { const v = Math.round(T.num(targetInp.value)); if (v > 0) { st.target = v; save(st); paint(); T.toast('Target tersimpan'); } }),
      T.btn('Pakai saran 30×kg', saran),
    ));
    paint();
  });

  /* ================= 15. KALKULATOR IPK ================= */
  R('ipk', 'Kalkulator IPK', 'pelajar', '🎓', 'Hitung IPK semester.', (root) => {
    const GRADES = [['4', 'A (4,0)'], ['3.7', 'A− (3,7)'], ['3.3', 'B+ (3,3)'], ['3', 'B (3,0)'], ['2.7', 'B− (2,7)'], ['2.3', 'C+ (2,3)'], ['2', 'C (2,0)'], ['1', 'D (1,0)'], ['0', 'E (0,0)'], ['custom', 'Bobot custom…']];
    const listEl = T.el('<div></div>');
    const box = T.out();
    const rows = [];
    function addRow(nama, sks, grade) {
      const r = {};
      r.nama = T.input('text', 'Nama mata kuliah', nama || '');
      r.sks = T.input('number', 'SKS', sks != null ? String(sks) : '3');
      r.grade = T.select(GRADES, grade || '3');
      r.bobot = T.input('number', 'Bobot (0–4)', '');
      r.bobot.style.display = 'none';
      r.grade.addEventListener('change', () => { r.bobot.style.display = r.grade.value === 'custom' ? '' : 'none'; });
      r.del = T.btn('✕', () => {
        const i = rows.indexOf(r);
        if (i >= 0) rows.splice(i, 1);
        wrap.remove();
      });
      const wrap = T.el('<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px"></div>');
      wrap.appendChild(T.grid2(T.field('Mata kuliah', r.nama), T.field('SKS', r.sks)));
      wrap.appendChild(T.grid2(T.field('Nilai', r.grade), T.field('Bobot custom', r.bobot)));
      const delRow = T.el('<div style="text-align:right"></div>');
      delRow.appendChild(r.del);
      wrap.appendChild(delRow);
      r.wrap = wrap;
      rows.push(r);
      listEl.appendChild(wrap);
    }
    const hitung = () => {
      const entries = rows.map((r) => ({
        sks: T.num(r.sks.value),
        bobot: r.grade.value === 'custom' ? T.num(r.bobot.value) : Number(r.grade.value),
      }));
      const valid = entries.filter((e) => e.sks > 0 && !isNaN(e.bobot));
      if (!valid.length) { T.show(box, '<span class="err">Isi minimal satu mata kuliah dengan SKS dan nilai yang valid.</span>'); return; }
      const ipk = NS.utils.ipk(valid);
      const totalSks = valid.reduce((a, e) => a + e.sks, 0);
      const predikat = ipk >= 3.5 ? 'Sangat Memuaskan' : ipk >= 3.0 ? 'Memuaskan' : ipk >= 2.0 ? 'Cukup' : 'Kurang';
      const warna = ipk >= 3.0 ? 'ok' : ipk >= 2.0 ? 'warn' : 'err';
      T.show(box,
        '<div class="center"><div class="dim">Indeks Prestasi Semester</div>' +
        '<div class="big ' + warna + '">' + ipk.toFixed(2) + '</div>' +
        '<div>' + predikat + '</div></div>' +
        '<div class="kv"><span class="k">Total SKS</span><span class="v">' + totalSks + ' SKS</span></div>' +
        '<div class="kv"><span class="k">Jumlah mata kuliah</span><span class="v">' + valid.length + '</span></div>');
    };
    root.appendChild(listEl);
    addRow('Pengantar Ilmu Komputer', 3, '4');
    addRow('Matematika Dasar', 4, '3');
    addRow('Bahasa Inggris', 2, '3.3');
    root.appendChild(T.row(T.btn('+ Tambah mata kuliah', () => addRow()), T.btn('🎓 Hitung IPK', hitung, true)));
    root.appendChild(box);
  });


  /* ================= 16. CITATION GENERATOR ================= */
  R('citation', 'Citation Generator', 'pelajar', '📚', 'Daftar pustaka APA & MLA.', (root) => {
    const tipe = T.select([['buku', '📕 Buku'], ['jurnal', '📰 Jurnal'], ['web', '🌐 Website']], 'buku');
    const fPenulis = T.ta(2, 'Nama penulis, pisahkan dengan titik koma bila lebih dari satu\ncth: Budi Santoso; Andi Wijaya');
    const fTahun = T.input('number', 'Tahun terbit', String(new Date().getFullYear()));
    const fJudul = T.ta(2, 'Judul');
    const fPenerbit = T.input('text', 'Penerbit');
    const fJurnal = T.input('text', 'Nama jurnal');
    const fVol = T.input('text', 'Volume (cth: 12)');
    const fUrl = T.input('text', 'URL lengkap (https://…)');
    const box = T.out();
    const formBox = T.el('<div></div>');
    const splitAuthors = (raw) => String(raw || '').split(/[;]+/).map((s) => s.trim()).filter(Boolean);
    const inisial = (nama) => {
      const p = nama.split(/\s+/);
      const fam = p[p.length - 1];
      const ini = p.slice(0, -1).map((x) => x.charAt(0).toUpperCase() + '.').join(' ');
      return { fam, ini, depan: p.slice(0, -1).join(' ') };
    };
    const apaAuthors = (raw) => {
      const list = splitAuthors(raw).map((a) => { const x = inisial(a); return x.fam + ', ' + x.ini; });
      if (!list.length) return '';
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + ', & ' + list[1];
      return list.slice(0, -1).join(', ') + ', & ' + list[list.length - 1];
    };
    const mlaAuthors = (raw) => {
      const list = splitAuthors(raw).map((a, i) => {
        const x = inisial(a);
        return i === 0 ? x.fam + ', ' + x.depan : a;
      });
      if (!list.length) return '';
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + ', and ' + list[1];
      return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    };
    const siteDariUrl = (url) => {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    };
    const paintForm = () => {
      formBox.innerHTML = '';
      formBox.appendChild(T.field('Penulis', fPenulis, 'Pisahkan beberapa penulis dengan titik koma (;)'));
      formBox.appendChild(T.grid2(T.field('Tahun', fTahun), T.field('Judul', fJudul)));
      if (tipe.value === 'buku') formBox.appendChild(T.field('Penerbit', fPenerbit));
      if (tipe.value === 'jurnal') formBox.appendChild(T.grid2(T.field('Nama jurnal', fJurnal), T.field('Volume', fVol)));
      if (tipe.value === 'web') formBox.appendChild(T.field('URL', fUrl, 'Sertakan https://'));
    };
    const buat = () => {
      const penulis = fPenulis.value.trim(), tahun = (fTahun.value || 't.t.').trim(), judul = fJudul.value.trim();
      if (!penulis || !judul) { T.show(box, '<span class="err">Isi minimal nama penulis dan judul.</span>'); return; }
      const apaA = apaAuthors(penulis), mlaA = mlaAuthors(penulis);
      let apa = '', mla = '';
      if (tipe.value === 'buku') {
        const pb = fPenerbit.value.trim() || '[penerbit]';
        apa = apaA + ' (' + tahun + '). <i>' + esc(judul) + '</i>. ' + esc(pb) + '.';
        mla = mlaA + '. <i>' + esc(judul) + '</i>. ' + esc(pb) + ', ' + tahun + '.';
      } else if (tipe.value === 'jurnal') {
        const j = fJurnal.value.trim() || '[nama jurnal]', v = fVol.value.trim();
        apa = apaA + ' (' + tahun + '). ' + esc(judul) + '. <i>' + esc(j) + '</i>' + (v ? ', <i>' + esc(v) + '</i>' : '') + '.';
        mla = mlaA + '. "' + esc(judul) + '." <i>' + esc(j) + '</i>' + (v ? ', vol. ' + esc(v) : '') + ', ' + tahun + '.';
      } else {
        const url = fUrl.value.trim() || '[URL]';
        const site = siteDariUrl(url);
        apa = apaA + ' (' + tahun + '). ' + esc(judul) + '. ' + esc(url);
        mla = mlaA + '. "' + esc(judul) + '."' + (site ? ' <i>' + esc(site) + '</i>,' : '') + ' ' + tahun + ', ' + esc(url) + '.';
      }
      T.show(box,
        '<div class="dim" style="margin-bottom:4px"><b>APA 7th</b></div><div style="margin-bottom:8px">' + apa + '</div>' +
        '<div class="dim" style="margin-bottom:4px"><b>MLA 9th</b></div><div>' + mla + '</div>');
      const plain = box.innerText || '';
      const bar = T.row(T.copyBtn(() => plain, 'Salin hasil'));
      box.appendChild(bar);
    };
    tipe.addEventListener('change', paintForm);
    root.appendChild(T.field('Jenis sumber', tipe));
    root.appendChild(formBox);
    root.appendChild(T.btn('📚 Buat sitasi', buat, true));
    root.appendChild(box);
    paintForm();
  });

  /* ================= 17. TES MENGETIK ================= */
  R('typing-test', 'Tes Mengetik', 'pelajar', '🚀', 'Kecepatan mengetik Indonesia.', (root) => {
    const TEKS = [
      'Pagi ini matahari bersinar cerah dan burung-burung berkicau riang di dahan pohon mangga depan rumah.',
      'Belajar mengetik dengan cepat membutuhkan latihan rutin setiap hari agar jari terbiasa dengan posisi tombol.',
      'Indonesia adalah negara kepulauan terbesar di dunia dengan ribuan pulau yang membentang dari Sabang sampai Merauke.',
      'Teknologi berkembang sangat pesat sehingga kita harus terus belajar agar tidak tertinggal oleh zaman.',
      'Secangkir kopi hangat dan sepotong roti bakar menjadi teman setia saat mengerjakan tugas hingga larut malam.',
      'Gotong royong adalah budaya luhur bangsa Indonesia yang mengajarkan kita untuk saling membantu sesama.',
      'Hujan turun dengan derasnya sore itu, membuat jalanan basah dan udara terasa sejuk menyegarkan.',
      'Membaca buku setiap hari dapat memperluas wawasan dan melatih kemampuan berpikir secara kritis.',
      'Pantai di Bali terkenal dengan pasir putihnya yang lembut dan ombak yang cocok untuk berselancar.',
      'Disiplin waktu adalah kunci keberhasilan, karena waktu yang sudah berlalu tidak akan pernah kembali lagi.',
    ];
    const mode = T.select([['waktu', '⏱ 60 detik'], ['paragraf', '📝 1 paragraf sampai selesai']], 'waktu');
    const teksEl = T.el('<div class="out" style="font-size:16px;line-height:1.9;margin-bottom:10px"></div>');
    const ketik = T.ta(3, 'Klik di sini lalu ketik teks di atas…');
    const stat = T.out();
    let target = '', mulai = false, t0 = 0, iv = null, dur = 60;
    T.onLeave(() => { if (iv) clearInterval(iv); });
    const acakTeks = () => {
      if (mode.value === 'waktu') return TEKS[Math.floor(Math.random() * TEKS.length)];
      const i = Math.floor(Math.random() * TEKS.length);
      return TEKS[i] + ' ' + TEKS[(i + 3) % TEKS.length] + ' ' + TEKS[(i + 6) % TEKS.length];
    };
    const paint = () => {
      const val = ketik.value;
      let html = '';
      for (let i = 0; i < target.length; i++) {
        const c = target[i];
        let cls = '';
        if (i < val.length) cls = val[i] === c ? 'ok' : 'err';
        else if (i === val.length) cls = 'info';
        html += '<span class="' + cls + '"' + (i === val.length ? ' style="border-left:2px solid var(--info)"' : '') + '>' + esc(c) + '</span>';
      }
      teksEl.innerHTML = html;
    };
    const statistik = () => {
      const val = ketik.value;
      const elapsed = Math.max(1, (performance.now() - t0) / 1000);
      let benar = 0;
      for (let i = 0; i < Math.min(val.length, target.length); i++) if (val[i] === target[i]) benar++;
      const wpm = Math.round((benar / 5) / Math.max(elapsed / 60, 1 / 60));
      const akurasi = val.length ? Math.round((benar / val.length) * 100) : 100;
      return { wpm, akurasi, benar, salah: val.length - benar, elapsed: Math.round(elapsed) };
    };
    const finish = () => {
      if (iv) { clearInterval(iv); iv = null; }
      const s = statistik();
      T.show(stat,
        '<div class="center"><div class="dim">Hasil tes mengetik</div>' +
        '<div class="big">' + s.wpm + ' <span style="font-size:14px">WPM</span></div></div>' +
        '<div class="kv"><span class="k">Akurasi</span><span class="v">' + s.akurasi + '%</span></div>' +
        '<div class="kv"><span class="k">Karakter benar</span><span class="v ok">' + s.benar + '</span></div>' +
        '<div class="kv"><span class="k">Karakter salah</span><span class="v err">' + s.salah + '</span></div>' +
        '<div class="kv"><span class="k">Waktu</span><span class="v">' + s.elapsed + ' detik</span></div>');
      T.beep(880, 0.2); T.beep(1100, 0.3, 'sine', 0.2);
      mulai = false;
    };
    const reset = () => {
      if (iv) { clearInterval(iv); iv = null; }
      target = acakTeks();
      ketik.value = '';
      mulai = false;
      T.hide(stat);
      paint();
    };
    ketik.addEventListener('input', () => {
      if (!mulai && ketik.value.length > 0) {
        mulai = true; t0 = performance.now();
        if (mode.value === 'waktu') {
          let sisa = dur;
          iv = setInterval(() => {
            sisa--;
            if (sisa <= 0) finish();
          }, 1000);
        }
      }
      paint();
      if (mulai && mode.value === 'paragraf' && ketik.value === target) finish();
    });
    mode.addEventListener('change', reset);
    root.appendChild(T.field('Mode tes', mode));
    root.appendChild(teksEl);
    root.appendChild(T.field('Ketik di sini', ketik));
    root.appendChild(T.row(T.btn('↺ Teks baru', reset), T.btn('⏹ Selesai', () => { if (mulai) finish(); else T.toast('Mulai mengetik dulu'); })));
    root.appendChild(stat);
    T.hide(stat);
    reset();
  });

  /* ================= 18. KURS & CUACA ================= */
  R('kurs-cuaca', 'Kurs & Cuaca', 'liveapi', '💱', 'Kurs mata uang live & cuaca kota.', (root) => {
    const CURS = [['IDR', 'IDR – Rupiah'], ['USD', 'USD – Dolar AS'], ['EUR', 'EUR – Euro'], ['SGD', 'SGD – Dolar Singapura'], ['MYR', 'MYR – Ringgit'], ['JPY', 'JPY – Yen'], ['GBP', 'GBP – Pound'], ['AUD', 'AUD – Dolar Australia'], ['THB', 'THB – Baht'], ['CNY', 'CNY – Yuan'], ['KRW', 'KRW – Won'], ['SAR', 'SAR – Riyal'], ['PHP', 'PHP – Peso'], ['VND', 'VND – Dong'], ['INR', 'INR – Rupee'], ['HKD', 'HKD – Dolar HK']];
    const jml = T.input('number', 'Jumlah', '100000');
    const dari = T.select(CURS, 'IDR');
    const ke = T.select(CURS, 'USD');
    const kursBox = T.out();
    let rates = null, updateTime = '';
    const konversi = () => {
      if (!rates) return;
      const v = T.num(jml.value);
      if (isNaN(v)) { T.show(kursBox, '<span class="err">Isi jumlah dengan angka yang valid.</span>'); return; }
      const rf = rates[dari.value], rt = rates[ke.value];
      if (!rf || !rt) { T.show(kursBox, '<span class="err">Mata uang tidak tersedia di data kurs.</span>'); return; }
      const hasil = v * (rt / rf);
      T.show(kursBox,
        '<div class="center"><div class="dim">' + esc(jml.value) + ' ' + esc(dari.value) + ' =</div>' +
        '<div class="big">' + T.fmt(Math.round(hasil * 100) / 100) + ' ' + esc(ke.value) + '</div>' +
        '<div class="hint">1 ' + esc(dari.value) + ' = ' + (rt / rf).toFixed(6).replace(/0+$/, '').replace(/\.$/, '') + ' ' + esc(ke.value) + '</div>' +
        (updateTime ? '<div class="dim" style="font-size:12px">Update: ' + esc(updateTime) + '</div>' : '') + '</div>');
    };
    const muatKurs = async () => {
      T.show(kursBox, '<div class="dim center">Memuat kurs terbaru…</div>');
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/IDR');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.result !== 'success' || !data.rates) throw new Error('data tidak valid');
        rates = data.rates;
        try { updateTime = new Date(data.time_last_update_utc).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { updateTime = ''; }
        konversi();
      } catch (e) {
        T.show(kursBox, '<span class="err">Gagal memuat kurs. Periksa koneksi internet lalu coba lagi.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
        const wrap = T.el('<div style="margin-top:8px"></div>');
        wrap.appendChild(T.btn('🔄 Coba lagi', muatKurs));
        kursBox.appendChild(wrap);
      }
    };
    const kota = T.input('text', 'Nama kota', 'Jakarta');
    const cuacaBox = T.out();
    const cariCuaca = async () => {
      const q = kota.value.trim();
      if (!q) { T.show(cuacaBox, '<span class="err">Isi nama kota dulu.</span>'); return; }
      T.show(cuacaBox, '<div class="dim center">Mencari cuaca ' + esc(q) + '…</div>');
      try {
        const g = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=1&language=id');
        if (!g.ok) throw new Error('HTTP ' + g.status);
        const gd = await g.json();
        if (!gd.results || !gd.results.length) throw new Error('Kota "' + q + '" tidak ditemukan.');
        const loc = gd.results[0];
        const f = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m');
        if (!f.ok) throw new Error('HTTP ' + f.status);
        const fd = await f.json();
        const c = fd.current;
        const namaKota = loc.name + (loc.admin1 ? ', ' + loc.admin1 : '') + (loc.country ? ' (' + loc.country + ')' : '');
        T.show(cuacaBox,
          '<div class="center"><div class="dim">' + esc(namaKota) + '</div>' +
          '<div class="big">' + Math.round(c.temperature_2m) + '°C</div>' +
          '<div class="info"><b>' + esc(NS.utils.weatherId(c.weather_code)) + '</b></div></div>' +
          '<div class="kv"><span class="k">Kelembapan</span><span class="v">' + c.relative_humidity_2m + '%</span></div>' +
          '<div class="kv"><span class="k">Angin</span><span class="v">' + c.wind_speed_10m + ' km/jam</span></div>');
      } catch (e) {
        T.show(cuacaBox, '<span class="err">Gagal memuat cuaca. Periksa koneksi internet atau coba kota lain.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      }
    };
    [jml, dari, ke].forEach((elx) => elx.addEventListener('input', konversi));
    dari.addEventListener('change', konversi);
    ke.addEventListener('change', konversi);
    root.appendChild(T.el('<div class="dim" style="margin-bottom:6px"><b>💱 Kurs mata uang</b></div>'));
    root.appendChild(T.field('Jumlah', jml));
    root.appendChild(T.grid2(T.field('Dari', dari), T.field('Ke', ke)));
    root.appendChild(kursBox);
    root.appendChild(T.el('<div class="dim" style="margin:16px 0 6px"><b>🌤️ Cuaca kota</b></div>'));
    root.appendChild(T.grid2(T.field('Kota', kota)));
    root.appendChild(T.row(T.btn('🔍 Cek cuaca', cariCuaca, true)));
    root.appendChild(cuacaBox);
    muatKurs();
  });

})();
