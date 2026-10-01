import { h as T, utils, kv } from '../../core.js?v=6.3.0';

export const meta = {"id": "balik-nama-kendaraan", "name": "Biaya Balik Nama", "cat": "indonesia", "icon": "🔄", "desc": "Estimasi biaya balik nama motor & mobil.", "keywords": "balik nama,kendaraan,bbn-kb,stnk,bpkb,motor,mobil,samsat"};
export function render(root) {
  const JENIS = {
    motor: { label: 'Sepeda motor', stnk: 100000, tnkb: 60000, bpkb: 225000 },
    mobil: { label: 'Mobil', stnk: 200000, tnkb: 100000, bpkb: 375000 },
  };
  const jenisSel = T.select([['motor', 'Sepeda motor'], ['mobil', 'Mobil']], 'motor');
  const njkb = T.input('text', 'Contoh: 15000000');
  njkb.inputMode = 'decimal';
  const pkb = T.input('text', 'Dari STNK, contoh: 350000');
  pkb.inputMode = 'decimal';
  const swdkllj = T.input('text', 'Dari STNK, contoh: 35000');
  swdkllj.inputMode = 'decimal';
  const box = T.out();
  const hitung = () => {
    const j = JENIS[jenisSel.value] || JENIS.motor;
    const vNjkb = T.num(njkb.value) || 0;
    const vPkb = T.num(pkb.value) || 0;
    const vSw = T.num(swdkllj.value) || 0;
    if (vNjkb <= 0) { T.show(box, '<p class="hint">Isi NJKB dulu ya — angkanya ada di STNK/BPKB.</p>'); return; }
    const bbn = Math.round(vNjkb * 0.01);
    const total = bbn + vPkb + vSw + j.stnk + j.tnkb + j.bpkb;
    T.show(box,
      '<div class="big center">' + T.rp(total) + '</div>' +
      '<p class="center hint">Estimasi total balik nama ' + T.esc(j.label) + '</p>' +
      kv('BBN-KB (1% × NJKB)', T.rp(bbn)) +
      kv('PKB (dari STNK)', T.rp(vPkb)) +
      kv('SWDKLLJ (dari STNK)', T.rp(vSw)) +
      kv('STNK baru', T.rp(j.stnk)) +
      kv('TNKB (plat nomor)', T.rp(j.tnkb)) +
      kv('BPKB baru', T.rp(j.bpkb)) +
      kv('Total', '<b>' + T.rp(total) + '</b>') +
      '<p class="hint">Ini ilustrasi/estimasi aja ya — biaya aslinya bisa beda tergantung daerah (belum termasuk cek fisik, fotokopi, dll). Angka pastinya tanya ke Samsat setempat.</p>');
  };
  jenisSel.addEventListener('change', hitung);
  [njkb, pkb, swdkllj].forEach((i) => i.addEventListener('input', hitung));
  root.appendChild(T.field('Jenis kendaraan', jenisSel));
  root.appendChild(T.field('NJKB (Rp)', njkb, 'Nilai Jual Kendaraan Bermotor, lihat di STNK/BPKB.'));
  root.appendChild(T.field('PKB (Rp)', pkb, 'Pajak Kendaraan Bermotor tahunan di STNK.'));
  root.appendChild(T.field('SWDKLLJ (Rp)', swdkllj, 'Sumbangan Wajib Dana Kecelakaan di STNK.'));
  root.appendChild(T.row(T.btn('Hitung biaya', hitung, true)));
  root.appendChild(box);
}
