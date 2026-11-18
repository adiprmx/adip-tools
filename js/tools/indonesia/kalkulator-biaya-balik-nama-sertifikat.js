import { h as T, utils, money, kv } from '../../core.js';

// Biaya balik nama sertifikat tanah/rumah (jual beli), yang ditanggung pembeli:
// BPHTB + jasa PPAT + PNBP BPN + cek sertifikat. PPh final 2,5% ditanggung
// penjual (PP 34/2016), jadi ditampilkan terpisah, bukan masuk total pembeli.
// BPHTB: UU 1/2022, tarif paling tinggi 5% x (NPOP - NPOPTKP), NPOPTKP paling
// sedikit Rp80 juta (perolehan pertama) / Rp300 juta (waris, hibah wasiat).
// Jasa PPAT: Permen ATR/Kepala BPN 33/2021, batas atas 1% (sampai Rp500 jt),
// 0,75% (Rp500 jt - 1 M), 0,5% (Rp1 - 2,5 M), 0,25% (di atas Rp2,5 M).
// PNBP BPN: PP 128/2015, (nilai tanah / 1000) + Rp50.000. Cek sertifikat:
// Rp50.000. Tarif diverifikasi November 2026.
export function ppatMaks(nilai) {
  const v = Math.max(0, Number(nilai) || 0);
  if (v <= 500000000) return 1;
  if (v <= 1000000000) return 0.75;
  if (v <= 2500000000) return 0.5;
  return 0.25;
}
export function hitungBalikNama(o) {
  const harga = Math.max(0, Number(o.harga) || 0);
  const nilai = Math.max(0, Number(o.nilai) || 0) || harga;
  const npoptkp = Math.max(0, Number(o.npoptkp) || 0);
  const tarifBphtb = Math.max(0, Number(o.tarifBphtb) || 0);
  const persenPpat = Math.max(0, Number(o.persenPpat) || 0);
  const cekSertifikat = o.cekSertifikat === false ? 0 : 50000;
  const bphtb = Math.max(0, harga - npoptkp) * tarifBphtb / 100;
  const ppat = harga * persenPpat / 100;
  const pnbp = nilai / 1000 + 50000;
  const total = bphtb + ppat + pnbp + cekSertifikat;
  const pphPenjual = harga * 2.5 / 100;
  return { harga, nilai, bphtb, ppat, pnbp, cekSertifikat, total, pphPenjual };
}
utils.balikNamaSertifikat = hitungBalikNama;

export const meta = {"id": "kalkulator-biaya-balik-nama-sertifikat", "name": "Kalkulator Biaya Balik Nama Sertifikat", "cat": "indonesia", "icon": "📜", "desc": "Perkiraan total biaya balik nama sertifikat tanah atau rumah: BPHTB, jasa PPAT, dan PNBP BPN.", "keywords": "balik nama,sertifikat,tanah,rumah,bphtb,ppat,pnbp,bpn,ajb,biaya", "since": "6.17.0"};
export function render(root) {
  const hargaI = money(null, 'cth: 500000000');
  const nilaiI = money(null, 'cth: 500000000');
  const npoptkpI = money(null, 'cth: 80000000', '80000000');
  const tarifI = T.input('text', 'cth: 5', '5'); tarifI.inputMode = 'decimal';
  const ppatI = T.input('text', 'cth: 1', '1'); ppatI.inputMode = 'decimal';
  const box = T.out();
  let ppatDiubah = false;
  ppatI.addEventListener('input', () => { ppatDiubah = true; });

  const hitung = () => {
    const harga = T.num(hargaI.value) || 0;
    if (!(harga > 0)) { T.hide(box); return; }
    if (!ppatDiubah) ppatI.value = String(ppatMaks(harga)).replace('.', ',');
    const r = hitungBalikNama({ harga, nilai: T.num(nilaiI.value), npoptkp: T.num(npoptkpI.value), tarifBphtb: T.num(tarifI.value), persenPpat: T.num(ppatI.value) });
    const maks = ppatMaks(harga);
    const peringatanPpat = r.ppat > 0 && T.num(ppatI.value) > maks
      ? '<p class="warn">Jasa PPAT di atas ' + String(maks).replace('.', ',') + '% melebihi batas atas Permen ATR 33/2021 untuk nilai ini. Batas itu sudah termasuk biaya saksi.</p>' : '';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.total)) + '</div>' +
      '<p class="center mut">Perkiraan total yang dibayar pembeli.</p>' +
      kv('BPHTB (pembeli)', T.rp(Math.round(r.bphtb))) +
      kv('Jasa PPAT / notaris', T.rp(Math.round(r.ppat))) +
      kv('PNBP BPN', T.rp(Math.round(r.pnbp))) +
      kv('Cek sertifikat', T.rp(r.cekSertifikat)) +
      kv('PPh final 2,5% (ditanggung penjual, bukan pembeli)', T.rp(Math.round(r.pphPenjual))) +
      peringatanPpat +
      '<p class="hint">Dasar hitung (berlaku November 2026): BPHTB = tarif x (harga - NPOPTKP), tarif paling tinggi 5% (UU 1/2022), NPOPTKP paling sedikit Rp80 juta dan ditetapkan Perda tiap daerah. Jasa PPAT batas atas 1% sampai Rp500 juta, 0,75% sampai Rp1 miliar, 0,5% sampai Rp2,5 miliar, 0,25% di atas itu (Permen ATR 33/2021). PNBP BPN = nilai tanah / 1.000 + Rp50.000 (PP 128/2015). PPh final penjual 2,5% dari harga jual (PP 34/2016), dikecualikan bila nilainya di bawah Rp60 juta dan penghasilan penjual di bawah PTKP, atau karena waris dan hibah ke keluarga sedarah. Angka resmi ikut ketetapan BPN, Bapenda, dan PPAT setempat, kalkulator ini hanya estimasi.</p>');
  };
  [hargaI, nilaiI, npoptkpI, tarifI, ppatI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Beli tanah atau rumah, sertifikatnya harus balik nama ke kamu. Ini perkiraan semua biaya yang dibayar pembeli, dari pajak sampai jasa notaris.</p>'));
  root.appendChild(T.field('Harga transaksi (Rp)', hargaI, 'Harga yang tertulis di Akta Jual Beli'));
  root.appendChild(T.field('Nilai tanah menurut BPN / NJOP (Rp)', nilaiI, 'Untuk hitung PNBP. Kosongkan bila sama dengan harga transaksi'));
  root.appendChild(T.grid2(
    T.field('Batas tidak kena pajak / NPOPTKP (Rp)', npoptkpI, 'Beda tiap daerah, paling sedikit Rp80 juta'),
    T.field('Tarif BPHTB (%)', tarifI, 'Paling tinggi 5%, ditetapkan Perda')
  ));
  root.appendChild(T.field('Jasa PPAT (%)', ppatI, 'Terisi otomatis batas atas sesuai harga, bisa diubah sesuai kesepakatan dengan PPAT'));
  root.appendChild(box);
  hitung();
}
