import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id":"kalkulator-lunasi-utang","name":"Kalkulator Lunasi Utang","cat":"bisnis","icon":"💳","desc":"Bandingkan cara snowball dan avalanche melunasi utang: urutan bayar, lama lunas, dan total bunga.","keywords":"utang,lunasi utang,snowball,avalanche,cicilan,kartu kredit,pinjaman","since":"6.11.0"};

/* Simulasi bulanan. metode: 'snowball' (saldo terkecil dulu) atau 'avalanche' (bunga tertinggi dulu).
   Utang yang lunas membuat pembayaran minimumnya ikut jadi dana ekstra bulan berikutnya. */
export function simulasiUtang(daftar, bayarEkstra, metode) {
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

export function render(root) {
  const daftarEl = T.el('<div></div>');
  const rows = [];
  const ekstraInp = T.input('text', 'mis. 500000', ''); ekstraInp.inputMode = 'decimal';
  const out = T.out();

  const tambahBaris = (def) => {
    const d = def || {};
    const nama = T.input('text', 'Nama utang, mis. Kartu kredit', d.nama || '');
    const saldo = T.input('text', 'Sisa utang (Rp)', d.saldo || ''); saldo.inputMode = 'decimal';
    const bunga = T.input('text', 'Bunga %/tahun', d.bunga || ''); bunga.inputMode = 'decimal';
    const min = T.input('text', 'Bayar minimum/bulan (Rp)', d.min || ''); min.inputMode = 'decimal';
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
      '<div class="center"><div class="dim">Bebas utang dalam</div><div class="big">' + fmtBulan(r.bulan) + '</div>' +
      '<p class="dim">Perkiraan lunas: ' + tanggalLunas(r.bulan) + '</p></div>' +
      kv('Total bunga yang dibayar', '<b>' + T.rp(r.totalBunga) + '</b>') +
      '<p style="font-size:14px;margin:12px 0 4px"><b>Urutan lunas:</b></p>' +
      '<div class="dim" style="font-size:13.5px;line-height:1.8">' +
      r.urutan.map((u, i) => (i + 1) + '. ' + T.esc(u.nama) + ', lunas bulan ke-' + u.bulan).join('<br>') + '</div>';
  };

  const hitung = () => {
    if (rows.length === 0) { T.show(out, '<p class="err">Tambah minimal 1 utang dulu.</p>'); return; }
    const daftar = [];
    for (const r of rows) {
      const saldo = T.num(r.saldo.value), bunga = T.num(r.bunga.value), min = T.num(r.min.value);
      const nama = r.nama.value.trim() || 'Utang';
      if (!isFinite(saldo) || !(saldo > 0)) { T.show(out, '<p class="err">Sisa utang "' + T.esc(nama) + '" harus lebih dari 0.</p>'); return; }
      if (!isFinite(bunga) || bunga < 0 || bunga > 200) { T.show(out, '<p class="err">Bunga "' + T.esc(nama) + '" isi 0 sampai 200 persen per tahun.</p>'); return; }
      if (!isFinite(min) || !(min > 0)) { T.show(out, '<p class="err">Pembayaran minimum "' + T.esc(nama) + '" harus lebih dari 0.</p>'); return; }
      daftar.push({ nama, saldo, bunga, min });
    }
    const ekstra = ekstraInp.value.trim() === '' ? 0 : T.num(ekstraInp.value);
    if (!isFinite(ekstra) || ekstra < 0) { T.show(out, '<p class="err">Dana ekstra isi 0 atau lebih.</p>'); return; }
    const bungaBulanan = daftar.reduce((s, u) => s + u.saldo * (u.bunga / 100 / 12), 0);
    const bayarBulanan = daftar.reduce((s, u) => s + u.min, 0) + ekstra;
    if (bayarBulanan <= bungaBulanan) {
      T.show(out, '<p class="err">Total pembayaran per bulan (' + T.rp(bayarBulanan) + ') tidak cukup menutup bunga bulanannya (' + T.rp(bungaBulanan) + '). Utang akan terus membesar, naikkan pembayarannya.</p>'); return;
    }
    const snow = simulasiUtang(daftar, ekstra, 'snowball');
    const aval = simulasiUtang(daftar, ekstra, 'avalanche');
    let banding = '';
    if (snow.lunas && aval.lunas) {
      const hemat = snow.totalBunga - aval.totalBunga;
      banding = hemat > 1000
        ? '<p class="hint">Avalanche menghemat sekitar ' + T.rp(hemat) + ' bunga dibanding snowball. Snowball tetap berguna bila butuh kemenangan cepat supaya semangat.</p>'
        : '<p class="hint">Kedua cara hasilnya hampir sama untuk utang ini.</p>';
    }
    T.show(out,
      tampilSatu('❄️ Snowball', 'Lunasi saldo terkecil dulu supaya cepat ada utang yang beres.', snow) +
      '<hr class="divi">' +
      tampilSatu('🏔️ Avalanche', 'Lunasi bunga tertinggi dulu supaya total bunga paling kecil.', aval) +
      banding);
  };

  root.appendChild(T.el('<p class="hint">Masukkan semua utang: kartu kredit, pinjaman, cicilan. Dana ekstra adalah uang tambahan di luar pembayaran minimum.</p>'));
  root.appendChild(daftarEl);
  root.appendChild(T.row(T.btn('+ Tambah utang', () => tambahBaris())));
  root.appendChild(T.field('Dana ekstra per bulan (Rp)', ekstraInp, 'Uang tambahan untuk mempercepat pelunasan, boleh 0'));
  root.appendChild(T.row(T.btn('Bandingkan cara bayar', hitung, true)));
  root.appendChild(out);
  tambahBaris({ nama: 'Kartu kredit', saldo: '5000000', bunga: '24', min: '500000' });
  tambahBaris({ nama: 'Pinjaman', saldo: '10000000', bunga: '12', min: '500000' });
  T.show(out, '<p class="dim">Dua contoh utang sudah diisi, ubah angkanya sesuai keadaanmu lalu tekan tombol.</p>');
}
