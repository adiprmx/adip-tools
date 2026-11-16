import { h as T, kv, tabs } from '../../core.js?v=6.13.0';

export const meta = {"id":"kalkulator-lunasi-utang","name":"Kalkulator Lunasi Utang","cat":"bisnis","icon":"💳","desc":"Rencana melunasi utang sampai lunas: tanggal lunas, total bunga, tabel angsuran per bulan, dan bandingkan snowball vs avalanche untuk banyak utang.","keywords":"utang,lunasi utang,pelunasan,cicilan,bunga,snowball,avalanche,tabel angsuran,amortisasi,kartu kredit,pinjaman","since":"6.11.0"};

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function tanggalLunas(bulanKeDepan, dari) {
  const d = dari ? new Date(dari) : new Date();
  d.setMonth(d.getMonth() + bulanKeDepan);
  return NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

const fmtBulan = (b) => {
  const th = Math.floor(b / 12), bl = b % 12;
  const bag = [];
  if (th) bag.push(th + ' tahun');
  if (bl) bag.push(bl + ' bulan');
  return bag.join(' ') || '0 bulan';
};

/* Simulasi satu utang dengan cicilan tetap per bulan.
   Mengembalikan bulan lunas, total bunga, total bayar, dan jadwal per bulan
   (bulan, bayar, bunga, pokok, sisa). Maks 600 bulan (50 tahun). */
export function simulasiSatuUtang(saldo, bungaPersenTahun, cicilan) {
  const r = bungaPersenTahun / 100 / 12;
  let sisa = saldo, totalBunga = 0, bulan = 0;
  const jadwal = [];
  while (sisa > 0.005 && bulan < 600) {
    bulan++;
    const bunga = sisa * r;
    totalBunga += bunga;
    const bayar = Math.min(cicilan, sisa + bunga);
    const pokok = Math.max(0, bayar - bunga);
    sisa = sisa + bunga - bayar;
    jadwal.push({ bulan, bayar, bunga, pokok, sisa: Math.max(0, sisa) });
    if (bayar <= bunga && sisa > 0.005) break; // cicilan tidak menutup bunga
  }
  const lunas = sisa <= 0.005;
  return { lunas, bulan: lunas ? bulan : null, totalBunga, totalBayar: saldo + totalBunga, jadwal };
}

/* Simulasi banyak utang: snowball (saldo terkecil dulu) atau avalanche
   (bunga tertinggi dulu). Dana ekstra + pembayaran minimum utang yang sudah
   lunas ikut dipakai untuk utang berikutnya. */
export function simulasiBanyakUtang(daftar, bayarEkstra, metode) {
  const utang = daftar.map((u) => ({ nama: u.nama, saldo: u.saldo, bunga: u.bunga, min: u.min, lunasBulan: null }));
  const maksBulan = 600;
  let bulan = 0, totalBunga = 0;
  const urutan = [];
  const danaBebas = () => utang.filter((u) => u.saldo <= 0.005).reduce((s, u) => s + u.min, 0);
  const aktif = () => utang.filter((u) => u.saldo > 0.005);
  while (aktif().length > 0 && bulan < maksBulan) {
    bulan++;
    for (const u of aktif()) {
      const b = u.saldo * (u.bunga / 100 / 12);
      u.saldo += b;
      totalBunga += b;
    }
    for (const u of aktif()) {
      const bayar = Math.min(u.min, u.saldo);
      u.saldo -= bayar;
    }
    let ekstra = bayarEkstra + danaBebas();
    while (ekstra > 0.005 && aktif().length > 0) {
      const list = aktif();
      list.sort((x, y) => metode === 'snowball' ? x.saldo - y.saldo : y.bunga - x.bunga);
      const t = list[0];
      const bayar = Math.min(ekstra, t.saldo);
      t.saldo -= bayar;
      ekstra -= bayar;
    }
    for (const u of utang) {
      if (u.saldo <= 0.005 && u.lunasBulan == null) {
        u.lunasBulan = bulan;
        urutan.push({ nama: u.nama, bulan });
      }
    }
  }
  const lunas = aktif().length === 0;
  return { lunas, bulan: lunas ? bulan : null, totalBunga, urutan };
}

/* Alias nama export lama (kalkulator-lunasi-utang v6.11.0) — fungsi yang sama. */
export const simulasiUtang = simulasiBanyakUtang;

const inpUang = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };

function tabelTahunan(jadwal) {
  if (!jadwal.length) return '';
  const perTahun = {};
  jadwal.forEach((r) => {
    const th = Math.ceil(r.bulan / 12);
    if (!perTahun[th]) perTahun[th] = { bayar: 0, bunga: 0, pokok: 0, sisa: 0 };
    perTahun[th].bayar += r.bayar;
    perTahun[th].bunga += r.bunga;
    perTahun[th].pokok += r.pokok;
    perTahun[th].sisa = r.sisa;
  });
  const rows = Object.keys(perTahun).map((th) => {
    const t = perTahun[th];
    return '<tr><td>Tahun ' + th + '</td><td style="text-align:right">' + T.rp(t.bayar) + '</td><td style="text-align:right">' + T.rp(t.bunga) + '</td><td style="text-align:right">' + T.rp(t.pokok) + '</td><td style="text-align:right">' + T.rp(t.sisa) + '</td></tr>';
  }).join('');
  return '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Tahun</th><th style="text-align:right">Total bayar</th><th style="text-align:right">Bunga</th><th style="text-align:right">Pokok</th><th style="text-align:right">Sisa</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function tabelBulanan(jadwal) {
  const rows = jadwal.map((r) =>
    '<tr><td>' + r.bulan + '</td><td style="text-align:right">' + T.rp(r.bayar) + '</td><td style="text-align:right">' + T.rp(r.bunga) + '</td><td style="text-align:right">' + T.rp(r.pokok) + '</td><td style="text-align:right">' + T.rp(r.sisa) + '</td></tr>'
  ).join('');
  return '<div style="overflow-x:auto;max-height:360px;overflow-y:auto"><table class="tbl"><thead><tr><th>Bulan ke</th><th style="text-align:right">Bayar</th><th style="text-align:right">Bunga</th><th style="text-align:right">Pokok</th><th style="text-align:right">Sisa utang</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Tab 1: satu utang + tabel angsuran ----
  const saldoInp = inpUang('mis. 20000000');
  const bungaInp = inpUang('mis. 12', '12');
  const cicilInp = inpUang('mis. 1000000');
  const ekstraInp = inpUang('mis. 500000 (boleh 0)', '0');
  const out1 = T.out();

  const hitung1 = () => {
    const saldo = T.num(saldoInp.value), bunga = T.num(bungaInp.value);
    const cicil = T.num(cicilInp.value), ekstra = T.num(ekstraInp.value);
    if (!isFinite(saldo) || !(saldo > 0)) { T.show(out1, '<p class="err">Isi sisa utang dengan angka lebih dari 0.</p>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga > 200) { T.show(out1, '<p class="err">Bunga per tahun isi 0 sampai 200 persen.</p>'); return; }
    if (!isFinite(cicil) || !(cicil > 0)) { T.show(out1, '<p class="err">Isi cicilan per bulan dengan angka lebih dari 0.</p>'); return; }
    if (!isFinite(ekstra) || ekstra < 0) { T.show(out1, '<p class="err">Dana tambahan isi 0 atau lebih.</p>'); return; }
    const bungaBulan = saldo * (bunga / 100 / 12);
    if (cicil <= bungaBulan) {
      T.show(out1, '<p class="err">Cicilan (' + T.rp(cicil) + ') tidak cukup menutup bunga bulanannya (' + T.rp(bungaBulan) + '). Utang akan terus membesar — naikkan cicilannya.</p>'); return;
    }
    const dasar = simulasiSatuUtang(saldo, bunga, cicil);
    if (!dasar.lunas) { T.show(out1, '<p class="err">Tidak lunas dalam 50 tahun dengan cicilan ini. Naikkan cicilannya.</p>'); return; }

    let bandingHtml = '';
    if (ekstra > 0) {
      const cepat = simulasiSatuUtang(saldo, bunga, cicil + ekstra);
      if (cepat.lunas) {
        const hematBulan = dasar.bulan - cepat.bulan;
        const hematBunga = dasar.totalBunga - cepat.totalBunga;
        bandingHtml =
          '<hr class="divi"><h3 class="h3">💪 Kalau tambah ' + T.rp(ekstra) + ' per bulan</h3>' +
          '<div class="center"><div class="dim">Lunas lebih cepat</div><div class="big" style="color:#4ade80">' + fmtBulan(hematBulan) + '</div>' +
          '<p class="dim">Lunas ' + tanggalLunas(cepat.bulan) + ' (bukan ' + tanggalLunas(dasar.bulan) + ')</p></div>' +
          kv('Bunga yang dihemat', '<b style="color:#4ade80">' + T.rp(hematBunga) + '</b>') +
          kv('Total bunga jadi', T.rp(cepat.totalBunga));
      }
    }

    T.show(out1,
      '<div class="center"><div class="dim">Bebas utang dalam</div><div class="big" style="color:#ff6f61">' + fmtBulan(dasar.bulan) + '</div>' +
      '<p class="dim">Perkiraan lunas: <b>' + tanggalLunas(dasar.bulan) + '</b></p></div>' +
      kv('Cicilan per bulan', '<b>' + T.rp(cicil) + '</b>') +
      kv('Total bunga yang dibayar', '<b>' + T.rp(dasar.totalBunga) + '</b>') +
      kv('Total yang dibayar (pokok + bunga)', T.rp(dasar.totalBayar)) +
      '<p class="hint">Bunga dihitung dari sisa utang tiap bulan, jadi makin kecil sisa utang, makin kecil bunganya. Asumsi: bunga tetap dan tidak ada denda atau biaya lain.</p>' +
      bandingHtml +
      '<hr class="divi"><h3 class="h3">📅 Tabel angsuran per tahun</h3>' +
      tabelTahunan(dasar.jadwal) +
      '<div style="margin-top:12px"><button class="btn" data-act="bulanan" type="button">Lihat tabel per bulan</button></div>' +
      '<div data-slot="bulanan" style="margin-top:12px"></div>');
    const tombol = out1.querySelector('[data-act="bulanan"]');
    const slot = out1.querySelector('[data-slot="bulanan"]');
    let terbuka = false;
    tombol.addEventListener('click', () => {
      terbuka = !terbuka;
      tombol.textContent = terbuka ? 'Sembunyikan tabel per bulan' : 'Lihat tabel per bulan';
      slot.innerHTML = terbuka ? tabelBulanan(dasar.jadwal) : '';
    });
  };

  p1.appendChild(T.el('<p class="hint">Untuk satu utang: kartu kredit, pinjaman, atau cicilan. Isi sisa utang, bunga, dan cicilan yang sanggup dibayar tiap bulan.</p>'));
  p1.appendChild(T.field('Sisa utang saat ini (Rp)', saldoInp));
  p1.appendChild(T.grid2(
    T.field('Bunga per tahun (%)', bungaInp, 'Cek di tagihan atau perjanjian kredit'),
    T.field('Cicilan per bulan (Rp)', cicilInp, 'Jumlah yang dibayar tiap bulan')
  ));
  p1.appendChild(T.field('Dana tambahan per bulan (Rp)', ekstraInp, 'Uang ekstra di luar cicilan untuk mempercepat lunas, boleh 0'));
  p1.appendChild(T.row(T.btn('Hitung rencana lunas', hitung1, true)));
  p1.appendChild(out1);

  // ---- Tab 2: banyak utang, snowball vs avalanche ----
  const daftarEl = T.el('<div></div>');
  const rows = [];
  const ekstra2Inp = inpUang('mis. 500000 (boleh 0)', '0');
  const out2 = T.out();

  const tambahBaris = (def) => {
    const d = def || {};
    const nama = T.input('text', 'Nama utang, mis. Kartu kredit', d.nama || '');
    const saldo = inpUang('Sisa utang (Rp)', d.saldo || '');
    const bunga = inpUang('Bunga %/tahun', d.bunga || '');
    const min = inpUang('Bayar minimum/bulan (Rp)', d.min || '');
    const wrap = T.el('<div style="border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;margin-bottom:10px"></div>');
    const hapusBtn = T.btn('Hapus utang ini', () => {
      const i = rows.indexOf(rec);
      if (i > -1) rows.splice(i, 1);
      wrap.remove();
    });
    const rec = { wrap, nama, saldo, bunga, min };
    wrap.appendChild(T.field('Nama utang', nama));
    wrap.appendChild(T.grid2(T.field('Sisa utang (Rp)', saldo), T.field('Bunga per tahun (%)', bunga)));
    wrap.appendChild(T.field('Pembayaran minimum per bulan (Rp)', min));
    wrap.appendChild(T.row(hapusBtn));
    rows.push(rec);
    daftarEl.appendChild(wrap);
  };

  const tampilSatu = (judul, ket, r) => {
    if (!r.lunas) {
      return '<h3 class="h3">' + judul + '</h3><p class="dim" style="font-size:13px">' + ket + '</p>' +
        '<p class="warn">Tidak lunas dalam 50 tahun dengan pembayaran ini. Naikkan pembayaran minimum atau dana ekstra.</p>';
    }
    return '<h3 class="h3">' + judul + '</h3><p class="dim" style="font-size:13px">' + ket + '</p>' +
      '<div class="center"><div class="dim">Semua lunas dalam</div><div class="big">' + fmtBulan(r.bulan) + '</div>' +
      '<p class="dim">Perkiraan lunas: ' + tanggalLunas(r.bulan) + '</p></div>' +
      kv('Total bunga yang dibayar', '<b>' + T.rp(r.totalBunga) + '</b>') +
      '<p style="font-size:14px;margin:12px 0 4px"><b>Urutan lunas:</b></p>' +
      '<div class="dim" style="font-size:13.5px;line-height:1.8">' +
      r.urutan.map((u, i) => (i + 1) + '. ' + T.esc(u.nama) + ' — lunas ' + tanggalLunas(u.bulan)).join('<br>') + '</div>';
  };

  const hitung2 = () => {
    if (rows.length === 0) { T.show(out2, '<p class="err">Tambah minimal 1 utang dulu.</p>'); return; }
    const daftar = [];
    for (const r of rows) {
      const saldo = T.num(r.saldo.value), bunga = T.num(r.bunga.value), min = T.num(r.min.value);
      const nama = r.nama.value.trim() || 'Utang';
      if (!isFinite(saldo) || !(saldo > 0)) { T.show(out2, '<p class="err">Sisa utang "' + T.esc(nama) + '" harus lebih dari 0.</p>'); return; }
      if (!isFinite(bunga) || bunga < 0 || bunga > 200) { T.show(out2, '<p class="err">Bunga "' + T.esc(nama) + '" isi 0 sampai 200 persen per tahun.</p>'); return; }
      if (!isFinite(min) || !(min > 0)) { T.show(out2, '<p class="err">Pembayaran minimum "' + T.esc(nama) + '" harus lebih dari 0.</p>'); return; }
      daftar.push({ nama, saldo, bunga, min });
    }
    const ekstra = ekstra2Inp.value.trim() === '' ? 0 : T.num(ekstra2Inp.value);
    if (!isFinite(ekstra) || ekstra < 0) { T.show(out2, '<p class="err">Dana ekstra isi 0 atau lebih.</p>'); return; }
    const bungaBulanan = daftar.reduce((s, u) => s + u.saldo * (u.bunga / 100 / 12), 0);
    const bayarBulanan = daftar.reduce((s, u) => s + u.min, 0) + ekstra;
    if (bayarBulanan <= bungaBulanan) {
      T.show(out2, '<p class="err">Total pembayaran per bulan (' + T.rp(bayarBulanan) + ') tidak cukup menutup bunga bulanannya (' + T.rp(bungaBulanan) + '). Utang akan terus membesar, naikkan pembayarannya.</p>'); return;
    }
    const snow = simulasiBanyakUtang(daftar, ekstra, 'snowball');
    const aval = simulasiBanyakUtang(daftar, ekstra, 'avalanche');
    let banding = '';
    if (snow.lunas && aval.lunas) {
      const hemat = snow.totalBunga - aval.totalBunga;
      banding = hemat > 1000
        ? '<p class="hint">Avalanche menghemat sekitar ' + T.rp(hemat) + ' bunga dibanding snowball. Snowball tetap berguna bila butuh kemenangan cepat supaya semangat bayar utang terjaga.</p>'
        : '<p class="hint">Kedua cara hasilnya hampir sama untuk utang ini — pilih yang paling mudah kamu jalani.</p>';
    }
    T.show(out2,
      tampilSatu('❄️ Snowball', 'Lunasi saldo terkecil dulu supaya cepat ada utang yang beres.', snow) +
      '<hr class="divi">' +
      tampilSatu('🏔️ Avalanche', 'Lunasi bunga tertinggi dulu supaya total bunga paling kecil.', aval) +
      banding +
      '<p class="hint">Asumsi: bunga tetap, tidak ada utang baru, dan pembayaran minimum utang yang sudah lunas ikut dipakai untuk utang berikutnya.</p>');
  };

  p2.appendChild(T.el('<p class="hint">Punya lebih dari satu utang? Bandingkan dua cara melunasinya: snowball (saldo terkecil dulu) dan avalanche (bunga tertinggi dulu).</p>'));
  p2.appendChild(daftarEl);
  p2.appendChild(T.row(T.btn('+ Tambah utang', () => tambahBaris())));
  p2.appendChild(T.field('Dana ekstra per bulan (Rp)', ekstra2Inp, 'Uang tambahan di luar pembayaran minimum, boleh 0'));
  p2.appendChild(T.row(T.btn('Bandingkan snowball vs avalanche', hitung2, true)));
  p2.appendChild(out2);
  tambahBaris({ nama: 'Kartu kredit', saldo: '5000000', bunga: '24', min: '500000' });
  tambahBaris({ nama: 'Pinjaman', saldo: '10000000', bunga: '12', min: '500000' });

  root.appendChild(T.el('<p class="note">Rencana pelunasan utang dengan tabel angsuran. Semua angka dihitung dari yang kamu isi, bukan dari data lain.</p>'));
  root.appendChild(tabs([['Satu utang', 0], ['Banyak utang', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
