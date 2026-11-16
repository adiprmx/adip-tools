import { h as T, utils } from '../../core.js?v=6.13.0';

// Logika murni (bisa di-test di Node).
utils.hitungMudik = function (o) {
  const jarak = Math.max(0, Number(o.jarak) || 0);
  const konsumsi = Math.max(0, Number(o.konsumsi) || 0);
  const hargaBbm = Math.max(0, Number(o.hargaBbm) || 0);
  const pp = o.pp ? 2 : 1;
  const tol = Math.max(0, Number(o.tol) || 0) * pp;
  const makan = Math.max(0, Number(o.makan) || 0);
  const orang = Math.max(1, Number(o.orang) || 1);
  const hari = Math.max(0, Number(o.hari) || 0);
  const olehOleh = Math.max(0, Number(o.olehOleh) || 0);
  const inap = Math.max(0, Number(o.inap) || 0);
  const lain = Math.max(0, Number(o.lain) || 0);
  const liter = konsumsi > 0 ? (jarak * pp) / konsumsi : 0;
  const bbm = liter * hargaBbm;
  const makanTotal = makan * orang * hari;
  return { liter, bbm, tol, makanTotal, olehOleh, inap, lain, total: bbm + tol + makanTotal + olehOleh + inap + lain };
};

export const meta = {"id": "anggaran-mudik", "name": "Anggaran Mudik", "cat": "sehari", "icon": "🚗", "desc": "Siapkan dana mudik: bensin, tol, makan, sampai oleh-oleh.", "keywords": "mudik,lebaran,anggaran,bbm,tol,perjalanan,liburan", "since": "6.11.0"};

export function render(root) {
  const jarak = T.input('text', 'Contoh: 350', '350'); jarak.inputMode = 'decimal';
  const pp = T.select([['ya', 'Pulang pergi'], ['tidak', 'Sekali jalan saja']], 'ya');
  const konsumsi = T.input('text', 'Contoh: 14', '14'); konsumsi.inputMode = 'decimal';
  const hargaBbm = T.input('text', 'Contoh: 10000', '10000'); hargaBbm.inputMode = 'decimal';
  const tol = T.input('text', 'Contoh: 150000', ''); tol.inputMode = 'decimal';
  const makan = T.input('text', 'Contoh: 50000', '50000'); makan.inputMode = 'decimal';
  const orang = T.input('text', 'Contoh: 4', '4'); orang.inputMode = 'decimal';
  const hari = T.input('text', 'Contoh: 3', '3'); hari.inputMode = 'decimal';
  const olehOleh = T.input('text', 'Contoh: 500000', ''); olehOleh.inputMode = 'decimal';
  const inap = T.input('text', 'Contoh: 0', ''); inap.inputMode = 'decimal';
  const lain = T.input('text', 'Contoh: 200000', ''); lain.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const j = T.num(jarak.value);
    if (!(j > 0)) { T.show(box, '<div class="hint">Isi dulu jarak perjalanan sekali jalan.</div>'); return; }
    const r = utils.hitungMudik({
      jarak: j, pp: pp.value === 'ya', konsumsi: T.num(konsumsi.value), hargaBbm: T.num(hargaBbm.value),
      tol: T.num(tol.value), makan: T.num(makan.value), orang: T.num(orang.value), hari: T.num(hari.value),
      olehOleh: T.num(olehOleh.value), inap: T.num(inap.value), lain: T.num(lain.value)
    });
    T.show(box,
      `<div class="kv"><span>Bensin (${T.fmt(Math.round(r.liter * 10) / 10)} liter)</span><b>${T.rp(r.bbm)}</b></div>` +
      (r.tol > 0 ? `<div class="kv"><span>Tol</span><b>${T.rp(r.tol)}</b></div>` : '') +
      (r.makanTotal > 0 ? `<div class="kv"><span>Makan selama perjalanan</span><b>${T.rp(r.makanTotal)}</b></div>` : '') +
      (r.olehOleh > 0 ? `<div class="kv"><span>Oleh-oleh</span><b>${T.rp(r.olehOleh)}</b></div>` : '') +
      (r.inap > 0 ? `<div class="kv"><span>Penginapan</span><b>${T.rp(r.inap)}</b></div>` : '') +
      (r.lain > 0 ? `<div class="kv"><span>Lain-lain</span><b>${T.rp(r.lain)}</b></div>` : '') +
      `<div class="kv"><span>Total anggaran mudik</span><b style="color:#fff">${T.rp(r.total)}</b></div>` +
      `<div class="hint">Konsumsi BBM motor umumnya 35-45 km per liter, mobil 10-18 km per liter tergantung jenis dan kondisi jalan. Sisakan dana cadangan sekitar 10-20 persen untuk hal tak terduga di jalan.</div>`
    );
  }

  root.appendChild(T.grid2(
    T.field('Jarak sekali jalan (km)', jarak),
    T.field('Perjalanan', pp)
  ));
  root.appendChild(T.grid2(
    T.field('Konsumsi BBM kendaraan (km per liter)', konsumsi),
    T.field('Harga BBM per liter (Rp)', hargaBbm)
  ));
  root.appendChild(T.field('Biaya tol sekali jalan (Rp, kosongkan bila tidak lewat tol)', tol));
  root.appendChild(T.grid2(
    T.field('Biaya makan per orang per hari (Rp)', makan),
    T.field('Jumlah orang', orang)
  ));
  root.appendChild(T.grid2(
    T.field('Lama perjalanan (hari)', hari),
    T.field('Oleh-oleh (Rp)', olehOleh)
  ));
  root.appendChild(T.grid2(
    T.field('Penginapan total (Rp)', inap),
    T.field('Lain-lain: parkir, jajan, dll. (Rp)', lain)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
