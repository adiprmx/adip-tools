import { h as T, kv } from '../../core.js';

export const meta = {"id": "food-cost", "name": "Food Cost", "cat": "bisnis", "icon": "🍽️", "desc": "Cek berapa persen biaya bahan dari harga jual, dan ketahuan harga jual yang ideal.", "keywords": "food cost,biaya bahan,harga jual,kuliner,restoran,warung,margin makanan", "since": "6.11.0"};

// Status food cost mengikuti target user sendiri, bukan ambang baku:
// - di bawah/sama dengan target: aman.
// - sampai 5 poin di atas target: masih wajar, tapi sudah di ujung.
// - lebih dari itu: ketinggian.
// Logika murni (bisa di-test di Node).
export function statusFoodCost(pct, target) {
  const p = Number(pct), t = Number(target);
  if (![p, t].every(isFinite) || p < 0 || t <= 0 || t >= 100) return null;
  if (p <= t) return { status: 'aman, masih sesuai targetmu', warna: '#22c55e', level: 'aman' };
  if (p <= t + 5) return { status: 'masih wajar, tapi sudah di atas targetmu', warna: '#eab308', level: 'wajar' };
  return { status: 'ketinggian, bahan makan untung terlalu besar', warna: '#ef4444', level: 'tinggi' };
}

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
      const s = statusFoodCost(pct, target);
      const status = s.status, warna = s.warna;
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + fmtPct(pct) + '</div>' +
        '<p class="center">food cost, ' + status + ' (targetmu ' + fmtPct(target) + ')</p>' +
        kv('Biaya bahan per porsi', T.rp(bahan)) +
        kv('Harga jual per porsi', T.rp(harga)) +
        kv('Sisa per porsi sebelum biaya lain', T.rp(labaKotor)) +
        kv('Harga jual ideal (target ' + fmtPct(target) + ')', T.rp(idealBulat)) +
        '<p class="hint">Rumus: food cost = biaya bahan ÷ harga jual. Patokan umum usaha makanan: 30 sampai 35%. Di bawah targetmu lega, di atas targetmu 5 poin masih wajar, lebih dari itu sudah sempit karena masih ada biaya gas, listrik, tenaga, dan sewa. Contoh dari angka di atas: bahan ' + T.rp(bahan) + ' dibagi harga ' + T.rp(harga) + ' = ' + fmtPct(pct) + '. Harga ideal = bahan ÷ target, jadi ' + T.rp(bahan) + ' ÷ ' + fmtPct(target) + ' = ' + T.rp(idealBulat) + ' (dibulatkan ke atas per Rp100). Target 30 sampai 35% adalah patokan umum industri kuliner, bukan aturan resmi, sesuaikan dengan jenis usahamu.</p>');
    };

    root.appendChild(T.el('<p class="note">Food cost itu porsi biaya bahan dari harga jual. Kalau kebesaran, untung habis di bahan sebelum sempat bayar sewa dan gaji.</p>'));
    root.appendChild(T.field('Biaya bahan per porsi (Rp)', bahanI, 'Semua bahan untuk satu porsi, tanpa kemasan dan tanpa tenaga.'));
    root.appendChild(T.field('Harga jual per porsi (Rp)', hargaI, 'Harga yang dibayar pembeli untuk satu porsi.'));
    root.appendChild(T.field('Target food cost (%)', targetI, 'Patokan umum 30 sampai 35%. Ubah sesuai targetmu.'));
    root.appendChild(T.row(T.btn('Hitung Food Cost', calc, true)));
    root.appendChild(box);
    // Hitung langsung saat mengetik, tapi diam saja bila isian belum lengkap
    // (supaya tidak ada toast yang muncul terus-menerus).
    [bahanI, hargaI, targetI].forEach((i) => i.addEventListener('input', () => {
      const bahan = T.num(bahanI.value), harga = T.num(hargaI.value), target = T.num(targetI.value);
      if (isFinite(bahan) && bahan >= 0 && isFinite(harga) && harga > 0 &&
          isFinite(target) && target > 0 && target < 100) calc();
    }));

}
