import { h as T, kv } from '../../core.js';

// Anggaran Trip: rencana biaya perjalanan. Isi tiap pos dengan total
// biayanya selama trip, ketahuan totalnya, biaya per hari, per orang,
// dan pos mana yang paling besar.
export const meta = {"id": "anggaran-trip", "name": "Anggaran Trip", "cat": "travel", "icon": "🧳", "desc": "Rencana anggaran perjalanan: total, per hari, dan per orang.", "keywords": "anggaran trip,budget liburan,biaya perjalanan,rencana liburan,ongkos jalan-jalan,biaya traveling", "since": "6.18.0"};

export const POS = [
  ['transport', 'Transport (tiket, bensin, tol, sewa kendaraan)'],
  ['inap', 'Penginapan (hotel, homestay)'],
  ['makan', 'Makan & minum'],
  ['aktivitas', 'Aktivitas & tiket masuk'],
  ['belanja', 'Belanja & oleh-oleh'],
  ['lain', 'Lain-lain (asuransi, visa, darurat)'],
];

// Hitung anggaran. pos: {transport, inap, makan, aktivitas, belanja, lain}
// dalam rupiah total selama trip. Murni, bisa diuji di Node.
export function hitungAnggaran(pos, hari, orang) {
  const h = Math.max(1, Number(hari) || 1);
  const o = Math.max(1, Number(orang) || 1);
  const rincian = POS.map(([kunci, label]) => ({
    kunci, label, nilai: Math.max(0, Number(pos && pos[kunci]) || 0),
  }));
  const total = rincian.reduce((a, r) => a + r.nilai, 0);
  const terbesar = rincian.reduce((a, r) => (r.nilai > a.nilai ? r : a), rincian[0]);
  return {
    rincian, total,
    perHari: total / h,
    perOrang: total / o,
    perOrangPerHari: total / h / o,
    terbesar: total > 0 ? terbesar : null,
    hari: h, orang: o,
  };
}

export function render(root) {
  const tujuanI = T.input('text', 'cth: Yogyakarta', '');
  const hariI = T.input('text', 'cth: 4', ''); hariI.inputMode = 'numeric';
  const orangI = T.input('text', 'cth: 2', ''); orangI.inputMode = 'numeric';
  const posInput = POS.map(([kunci, label]) => {
    const inp = T.input('text', 'cth: 1500000', ''); inp.inputMode = 'decimal';
    return { kunci, label, inp };
  });
  const box = T.out();

  const hitung = () => {
    const hari = T.num(hariI.value);
    const orang = T.num(orangI.value);
    if (!isFinite(hari) || hari < 1 || hari > 365) {
      T.show(box, '<div class="err">Lama trip harus diisi angka 1 sampai 365 hari.</div>');
      return;
    }
    if (!isFinite(orang) || orang < 1 || orang > 100) {
      T.show(box, '<div class="err">Jumlah orang harus diisi angka 1 sampai 100.</div>');
      return;
    }
    const pos = {};
    for (const p of posInput) {
      const v = T.num(p.inp.value);
      if (p.inp.value.trim() && (!isFinite(v) || v < 0)) {
        T.show(box, '<div class="err">Isi ' + p.label.split(' (')[0] + ' harus angka 0 atau lebih.</div>');
        return;
      }
      pos[p.kunci] = isFinite(v) ? v : 0;
    }
    const r = hitungAnggaran(pos, hari, orang);
    if (!r.total) {
      T.show(box, '<div class="err">Belum ada biaya yang diisi. Isi minimal satu pos.</div>');
      return;
    }
    const tujuan = tujuanI.value.trim();
    const bar = r.rincian.filter((x) => x.nilai > 0).map((x) => {
      const persen = Math.round((x.nilai / r.total) * 100);
      return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + T.esc(x.label.split(' (')[0]) + '</span><span><b>' + T.rp(Math.round(x.nilai)) + '</b> (' + persen + '%)</span></div>' +
        '<div style="height:8px;border-radius:4px;background:rgba(127,127,127,.18);overflow:hidden;margin-top:3px"><div style="height:100%;width:' + persen + '%;background:#ff6b4a;border-radius:4px"></div></div></div>';
    }).join('');
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.total)) + '</div>' +
      '<p class="center mut">Total anggaran' + (tujuan ? ' ke ' + T.esc(tujuan) : '') + ' (' + r.hari + ' hari, ' + r.orang + ' orang).</p>' +
      kv('Per hari', T.rp(Math.round(r.perHari))) +
      kv('Per orang', T.rp(Math.round(r.perOrang))) +
      kv('Per orang per hari', T.rp(Math.round(r.perOrangPerHari))) +
      (r.terbesar ? kv('Pos terbesar', T.esc(r.terbesar.label.split(' (')[0]) + ' (' + Math.round((r.terbesar.nilai / r.total) * 100) + '%)') : '') +
      '<div class="dim" style="margin-top:12px">Rincian per pos</div>' + bar);
  };

  root.appendChild(T.el('<p class="note">Isi tiap pos dengan total biayanya selama trip (bukan per hari). Kosongkan pos yang tidak ada.</p>'));
  root.appendChild(T.field('Tujuan (boleh kosong)', tujuanI));
  root.appendChild(T.grid2(T.field('Lama trip (hari)', hariI), T.field('Jumlah orang', orangI)));
  posInput.forEach((p) => root.appendChild(T.field(p.label + ' (Rp)', p.inp)));
  root.appendChild(T.btn('Hitung Anggaran', hitung, true));
  root.appendChild(box);
}
