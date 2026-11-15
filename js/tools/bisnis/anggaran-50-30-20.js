import { h as T, kv, tabs } from '../../core.js?v=6.12.1';

export const meta = {"id":"anggaran-50-30-20","name":"Anggaran 50/30/20","cat":"bisnis","icon":"💰","desc":"Bagi penghasilan jadi kebutuhan, keinginan, dan tabungan, lalu cek apakah pengeluaranmu sudah sesuai.","keywords":"anggaran,budget,50 30 20,keuangan,penghasilan,tabungan,kebutuhan","since":"6.11.0"};

export function bagiAnggaran(penghasilan, persen) {
  return {
    kebutuhan: penghasilan * persen.kebutuhan / 100,
    keinginan: penghasilan * persen.keinginan / 100,
    tabungan: penghasilan * persen.tabungan / 100,
  };
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: bagi penghasilan ----
  const gaji1 = T.input('text', 'mis. 5000000', ''); gaji1.inputMode = 'decimal';
  const pkKebutuhan = T.input('text', 'mis. 50', '50'); pkKebutuhan.inputMode = 'decimal';
  const pkKeinginan = T.input('text', 'mis. 30', '30'); pkKeinginan.inputMode = 'decimal';
  const pkTabungan = T.input('text', 'mis. 20', '20'); pkTabungan.inputMode = 'decimal';
  const out1 = T.out();
  const hitung1 = () => {
    const gaji = T.num(gaji1.value);
    const pk = { kebutuhan: T.num(pkKebutuhan.value), keinginan: T.num(pkKeinginan.value), tabungan: T.num(pkTabungan.value) };
    if (!isFinite(gaji) || !(gaji > 0)) { T.show(out1, '<p class="err">Isi penghasilan per bulan dengan angka lebih dari 0.</p>'); return; }
    if ([pk.kebutuhan, pk.keinginan, pk.tabungan].some((v) => !isFinite(v) || v < 0)) {
      T.show(out1, '<p class="err">Persentase isi dengan angka 0 atau lebih.</p>'); return;
    }
    const total = pk.kebutuhan + pk.keinginan + pk.tabungan;
    if (Math.abs(total - 100) > 0.001) {
      T.show(out1, '<p class="err">Total persentase harus 100%. Saat ini ' + String(Math.round(total * 100) / 100).replace('.', ',') + '%.</p>'); return;
    }
    const b = bagiAnggaran(gaji, pk);
    T.show(out1,
      '<div class="center"><div class="dim">Pembagian per bulan</div></div>' +
      kv('Kebutuhan (' + pk.kebutuhan + '%)', '<b>' + T.rp(b.kebutuhan) + '</b>') +
      '<p class="dim" style="font-size:12.5px;margin:-4px 0 6px">Makan, tempat tinggal, transport, tagihan, pulsa</p>' +
      kv('Keinginan (' + pk.keinginan + '%)', '<b>' + T.rp(b.keinginan) + '</b>') +
      '<p class="dim" style="font-size:12.5px;margin:-4px 0 6px">Jajan, hiburan, langganan, hobi, nongkrong</p>' +
      kv('Tabungan (' + pk.tabungan + '%)', '<b>' + T.rp(b.tabungan) + '</b>') +
      '<p class="dim" style="font-size:12.5px;margin:-4px 0 6px">Dana darurat, investasi, bayar utang lebih cepat</p>' +
      '<p class="hint">Angka 50/30/20 adalah patokan umum, bukan aturan baku. Sesuaikan dengan keadaanmu, yang penting totalnya 100%.</p>');
  };
  p1.appendChild(T.el('<p class="hint">Aturan sederhana: separuh penghasilan untuk kebutuhan, 30% untuk keinginan, 20% untuk tabungan. Persentasenya bisa diubah.</p>'));
  p1.appendChild(T.field('Penghasilan per bulan (Rp)', gaji1));
  p1.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"></div>'));
  const gridP = p1.lastChild;
  gridP.appendChild(T.field('Kebutuhan %', pkKebutuhan));
  gridP.appendChild(T.field('Keinginan %', pkKeinginan));
  gridP.appendChild(T.field('Tabungan %', pkTabungan));
  p1.appendChild(T.row(T.btn('Bagi penghasilan', hitung1, true)));
  p1.appendChild(T.row(T.btn('Pakai 50/30/20', () => { pkKebutuhan.value = '50'; pkKeinginan.value = '30'; pkTabungan.value = '20'; hitung1(); })));
  p1.appendChild(out1);

  // ---- Panel 2: cek anggaran ----
  const gaji2 = T.input('text', 'mis. 5000000', ''); gaji2.inputMode = 'decimal';
  const belKebutuhan = T.input('text', 'mis. 2800000', ''); belKebutuhan.inputMode = 'decimal';
  const belKeinginan = T.input('text', 'mis. 1500000', ''); belKeinginan.inputMode = 'decimal';
  const belTabungan = T.input('text', 'mis. 700000', ''); belTabungan.inputMode = 'decimal';
  const out2 = T.out();
  const barisCek = (label, target, aktual) => {
    const selisih = aktual - target;
    const lebih = selisih > 0;
    return kv(label, T.rp(aktual) + ' <span style="color:' + (lebih ? '#f87171' : '#4ade80') + '">(' +
      (lebih ? '+' : '') + T.rp(selisih) + ' dari target ' + T.rp(target) + ')</span>') +
      '<p class="dim" style="font-size:12.5px;margin:-4px 0 6px">Target: ' + T.rp(target) + ' · ' +
      (lebih ? 'melewati target' : 'masih dalam target') + '</p>';
  };
  const hitung2 = () => {
    const gaji = T.num(gaji2.value);
    const bel = { kebutuhan: T.num(belKebutuhan.value), keinginan: T.num(belKeinginan.value), tabungan: T.num(belTabungan.value) };
    if (!isFinite(gaji) || !(gaji > 0)) { T.show(out2, '<p class="err">Isi penghasilan per bulan dengan angka lebih dari 0.</p>'); return; }
    if ([bel.kebutuhan, bel.keinginan, bel.tabungan].some((v) => !isFinite(v) || v < 0)) {
      T.show(out2, '<p class="err">Semua pengeluaran isi dengan angka 0 atau lebih.</p>'); return;
    }
    const target = bagiAnggaran(gaji, { kebutuhan: 50, keinginan: 30, tabungan: 20 });
    const totalBelanja = bel.kebutuhan + bel.keinginan + bel.tabungan;
    const sisa = gaji - totalBelanja;
    T.show(out2,
      barisCek('Kebutuhan', target.kebutuhan, bel.kebutuhan) +
      barisCek('Keinginan', target.keinginan, bel.keinginan) +
      barisCek('Tabungan', target.tabungan, bel.tabungan) +
      kv('Total keluar', '<b>' + T.rp(totalBelanja) + '</b>') +
      kv('Sisa penghasilan', '<b style="color:' + (sisa >= 0 ? '#4ade80' : '#f87171') + '">' + T.rp(sisa) + '</b>') +
      (sisa < 0 ? '<p class="warn">Pengeluaran melebihi penghasilan bulan ini.</p>' : ''));
  };
  p2.appendChild(T.el('<p class="hint">Sudah mencatat pengeluaran? Masukkan angka sebenarnya untuk melihat bagian mana yang melewati patokan 50/30/20.</p>'));
  p2.appendChild(T.field('Penghasilan per bulan (Rp)', gaji2));
  p2.appendChild(T.field('Belanja kebutuhan bulan ini (Rp)', belKebutuhan));
  p2.appendChild(T.field('Belanja keinginan bulan ini (Rp)', belKeinginan));
  p2.appendChild(T.field('Yang ditabung bulan ini (Rp)', belTabungan));
  p2.appendChild(T.row(T.btn('Cek anggaran', hitung2, true)));
  p2.appendChild(out2);

  root.appendChild(tabs([['Bagi penghasilan', 0], ['Cek anggaranmu', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
