import { h as T, utils, money, kv } from '../../core.js';

// BPHTB (Bea Perolehan Hak atas Tanah dan Bangunan), UU 1/2022 (HKPD):
// BPHTB = tarif x (NPOP - NPOPTKP). Tarif paling tinggi 5%, ditetapkan Perda.
// NPOP = harga transaksi atau NJOP, mana yang lebih tinggi.
// NPOPTKP paling sedikit Rp80 juta untuk perolehan pertama di daerah itu;
// untuk waris/hibah wasiat paling sedikit Rp300 juta.
utils.bphtb = function (o) {
  const npop = Math.max(0, Number(o.npop) || 0);
  const npoptkp = Math.max(0, Number(o.npoptkp) || 0);
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const kenaPajak = Math.max(0, npop - npoptkp);
  const bphtb = kenaPajak * tarif / 100;
  return { npop, npoptkp, kenaPajak, bphtb };
};

export const meta = {"id": "kalkulator-bphtb", "name": "Kalkulator BPHTB", "cat": "indonesia", "icon": "🏠", "desc": "Hitung bea balik nama tanah dan rumah dari harga beli dan batas tidak kena pajak.", "keywords": "bphtb,bea perolehan hak,npoptkp,npop,balik nama,sertifikat,rumah,tanah,pajak", "since": "6.16.0"};
export function render(root) {
  const npopI = money(null, 'cth: 500000000');
  const npoptkpI = money(null, 'cth: 80000000', '80000000');
  const tarifI = T.input('text', 'cth: 5', '5'); tarifI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const npop = T.num(npopI.value) || 0;
    if (!(npop > 0)) { T.hide(box); return; }
    const tarif = T.num(tarifI.value);
    if (!(tarif >= 0)) { T.show(box, '<p class="warn">Tarif harus 0% atau lebih.</p>'); return; }
    const r = utils.bphtb({ npop, npoptkp: T.num(npoptkpI.value), tarif });
    const peringatan = tarif > 5
      ? '<p class="warn">Tarif di atas 5% melebihi batas tertinggi UU 1/2022. Periksa lagi tarif Perda daerahmu.</p>' : '';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.bphtb)) + '</div>' +
      '<p class="center mut">Bea yang harus dibayar sekali saat balik nama.</p>' +
      kv('Harga beli / NJOP (NPOP)', T.rp(r.npop)) +
      kv('Dikurangi batas tidak kena pajak (NPOPTKP)', '− ' + T.rp(r.npoptkp)) +
      kv('Nilai kena pajak', T.rp(r.kenaPajak)) +
      kv('Tarif BPHTB', T.esc(String(tarif)) + '%') +
      peringatan +
      '<p class="hint">Rumus UU 1/2022 tentang Hubungan Keuangan Pemerintah Pusat dan Daerah: BPHTB = tarif x (NPOP - NPOPTKP). NPOP adalah harga transaksi atau NJOP, mana yang lebih tinggi. NPOPTKP paling sedikit Rp80 juta untuk perolehan pertama di daerah itu, dan paling sedikit Rp300 juta untuk waris atau hibah wasiat — angka pastinya ditetapkan Perda tiap daerah, jadi sesuaikan dengan daerahmu (contoh: DKI Jakarta Rp80 juta umum / Rp250 juta perolehan pertama, Perda DKI 1/2024). Tarif paling tinggi 5%. Angka resmi ikut ketetapan dari Bapenda setempat, kalkulator ini hanya estimasi.</p>');
  };
  [npopI, npoptkpI, tarifI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">BPHTB adalah bea sekali bayar saat tanah atau rumah berpindah tangan. Besarnya dari harga beli dikurangi batas tidak kena pajak, dikali tarif daerah.</p>'));
  root.appendChild(T.field('Harga beli atau NJOP (Rp)', npopI, 'Pakai yang lebih tinggi antara harga transaksi dan NJOP'));
  root.appendChild(T.grid2(
    T.field('Batas tidak kena pajak / NPOPTKP (Rp)', npoptkpI, 'Beda tiap daerah, paling sedikit Rp80 juta'),
    T.field('Tarif BPHTB (%)', tarifI, 'Paling tinggi 5%, ditetapkan Perda')
  ));
  root.appendChild(box);
  hitung();
}
