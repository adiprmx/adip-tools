import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "bep-umkm", "name": "Kalkulator BEP UMKM", "cat": "bisnis", "icon": "📊", "desc": "Hitung titik impas: berapa unit & rupiah.", "keywords": "bep,impas,umkm,usaha,modal", "file": "tools/bisnis/bep-umkm.js"};

export function render(root) {
  const tetap = T.input('text', 'cth: 3000000 (sewa + gaji + listrik)');
  tetap.inputMode = 'decimal';
  const harga = T.input('text', 'cth: 25000');
  harga.inputMode = 'decimal';
  const variabel = T.input('text', 'cth: 15000 (bahan + kemas per unit)');
  variabel.inputMode = 'decimal';
  const targetHarian = T.input('text', 'cth: 20 (opsional)');
  targetHarian.inputMode = 'numeric';

  const box = T.out();

  const hitung = () => {
    const t = T.num(tetap.value);
    const h = T.num(harga.value);
    const v = T.num(variabel.value);
    if (t <= 0) { T.show(box, '<p class="warn">Isi biaya tetap per bulan dulu (angka > 0).</p>'); return; }
    if (h <= 0) { T.show(box, '<p class="warn">Isi harga jual per unit dulu (angka > 0).</p>'); return; }
    if (v < 0) { T.show(box, '<p class="warn">Biaya variabel tidak boleh negatif.</p>'); return; }
    const margin = h - v;
    if (margin <= 0) {
      T.show(box, '<p class="warn">Harga jual harus di atas biaya variabel per unit. Setiap unit yang terjual malah rugi ' + T.rp(Math.abs(margin)) + ' — naikkan harga atau tekan biaya variabel dulu.</p>');
      return;
    }
    const bepUnit = t / margin;
    const bepRp = bepUnit * h;

    let extra = '';
    const th = T.num(targetHarian.value);
    if (th > 0) {
      const hari = Math.ceil(bepUnit / th);
      extra = '<tr><td style="padding:4px 0">Estimasi hari mencapai BEP<br><span class="mut" style="font-size:12px">(' + T.esc(String(Math.round(th))) + ' unit/hari)</span></td><td style="text-align:right">± ' + T.esc(String(hari)) + ' hari</td></tr>';
    }

    T.show(box,
      '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
      '<tr><td style="padding:4px 0">Biaya tetap / bulan</td><td style="text-align:right">' + T.rp(t) + '</td></tr>' +
      '<tr><td style="padding:4px 0">Margin kontribusi / unit<br><span class="mut" style="font-size:12px">' + T.rp(h) + ' − ' + T.rp(v) + '</span></td><td style="text-align:right">' + T.rp(margin) + '</td></tr>' +
      '<tr><td style="padding:8px 0;border-top:1px solid #ffffff20;font-weight:700">BEP (unit)</td><td style="text-align:right;font-weight:700">' + T.esc(String(Math.ceil(bepUnit))) + ' unit</td></tr>' +
      '<tr><td style="padding:4px 0;font-weight:700">BEP (rupiah)</td><td style="text-align:right;font-weight:700">' + T.rp(bepRp) + '</td></tr>' +
      extra +
      '</table>' +
      '<p class="mut" style="font-size:13px;margin-top:8px">Di atas titik ini, setiap unit terjual = untung ' + T.rp(margin) + '.</p>' +
      '<p class="mut" style="font-size:12px;margin-top:4px">Estimasi, bukan ketentuan resmi.</p>');
  };

  root.appendChild(T.field('Biaya tetap per bulan (Rp)', tetap, 'Sewa, gaji, listrik, internet — yang keluar walau tak jualan.'));
  root.appendChild(T.field('Harga jual per unit (Rp)', harga));
  root.appendChild(T.field('Biaya variabel per unit (Rp)', variabel, 'Bahan baku + kemasan per satu unit terjual.'));
  root.appendChild(T.field('Target penjualan per hari (opsional)', targetHarian, 'Untuk estimasi berapa hari sampai impas.'));
  root.appendChild(T.row(T.btn('Hitung BEP', hitung, true)));
  root.appendChild(box);
}
