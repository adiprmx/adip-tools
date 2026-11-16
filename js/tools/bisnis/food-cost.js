import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "food-cost", "name": "Food Cost", "cat": "bisnis", "icon": "🍽️", "desc": "Cek berapa persen biaya bahan dari harga jual, dan ketahuan harga jual yang ideal.", "keywords": "food cost,biaya bahan,harga jual,kuliner,restoran,warung,margin makanan", "since": "6.11.0"};
export function render(root) {

    const bahanI = T.input('text', 'cth: 8000', '');
    bahanI.inputMode = 'decimal';
    const hargaI = T.input('text', 'cth: 25000', '');
    hargaI.inputMode = 'decimal';
    const targetI = T.input('text', 'cth: 30', '30');
    targetI.inputMode = 'decimal';
    const box = T.out();

    const fmtPct = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%';

    const calc = () => {
      const bahan = T.num(bahanI.value);
      const harga = T.num(hargaI.value);
      const target = T.num(targetI.value);
      if (!isFinite(bahan) || bahan < 0 || !isFinite(harga) || harga <= 0 ||
          !isFinite(target) || target <= 0 || target >= 100) {
        T.toast('Isi semua kolom dengan angka yang benar ya (target di bawah 100%).'); return;
      }
      const pct = bahan / harga * 100;
      const ideal = bahan / (target / 100);
      const idealBulat = Math.ceil(ideal / 100) * 100;
      const labaKotor = harga - bahan;
      let status, warna;
      if (pct <= 30) { status = 'aman, masih di bawah 30%'; warna = '#22c55e'; }
      else if (pct <= 35) { status = 'masih wajar, tapi sudah di ujung atas'; warna = '#eab308'; }
      else { status = 'ketinggian, bahan makan untung terlalu besar'; warna = '#ef4444'; }
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + fmtPct(pct) + '</div>' +
        '<p class="center">food cost, ' + status + '</p>' +
        kv('Biaya bahan per porsi', T.rp(bahan)) +
        kv('Harga jual per porsi', T.rp(harga)) +
        kv('Sisa per porsi sebelum biaya lain', T.rp(labaKotor)) +
        kv('Harga jual ideal (target ' + fmtPct(target) + ')', T.rp(idealBulat)) +
        '<p class="hint">Rumus: food cost = biaya bahan ÷ harga jual. Patokan umum usaha makanan: 30 sampai 35%. Di bawah 30% lega, di atas 35% sudah sempit karena masih ada biaya gas, listrik, tenaga, dan sewa. Contoh dari angka di atas: bahan ' + T.rp(bahan) + ' dibagi harga ' + T.rp(harga) + ' = ' + fmtPct(pct) + '. Harga ideal = bahan ÷ target, jadi ' + T.rp(bahan) + ' ÷ ' + fmtPct(target) + ' = ' + T.rp(idealBulat) + ' (dibulatkan ke atas per Rp100). Target 30 sampai 35% adalah patokan umum industri kuliner, bukan aturan resmi, sesuaikan dengan jenis usahamu.</p>');
    };

    root.appendChild(T.el('<p class="note">Food cost itu porsi biaya bahan dari harga jual. Kalau kebesaran, untung habis di bahan sebelum sempat bayar sewa dan gaji.</p>'));
    root.appendChild(T.field('Biaya bahan per porsi (Rp)', bahanI, 'Semua bahan untuk satu porsi, tanpa kemasan dan tanpa tenaga.'));
    root.appendChild(T.field('Harga jual per porsi (Rp)', hargaI, 'Harga yang dibayar pembeli untuk satu porsi.'));
    root.appendChild(T.field('Target food cost (%)', targetI, 'Patokan umum 30 sampai 35%. Ubah sesuai targetmu.'));
    root.appendChild(T.row(T.btn('Hitung Food Cost', calc, true)));
    root.appendChild(box);

}
