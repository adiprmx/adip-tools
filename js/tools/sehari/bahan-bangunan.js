import { h as T, utils } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node).
// Koefisien per m2 (AHSP/SNI): dinding bata merah 1/2 bata 1:4 = bata 70 buah,
// semen 11,5 kg, pasir 0,043 m3. Plesteran 1:4 tebal 15 mm = semen 6,24 kg,
// pasir 0,024 m3. Acian = semen 3,25 kg. Keramik lantai = keramik 1,06 m2
// (termasuk sisa potong), semen 10 kg, pasir 0,045 m3, nat 1,5 kg.
utils.hitungBahan = function (o) {
  const dinding = Math.max(0, Number(o.dinding) || 0);
  const plester = Math.max(0, Number(o.plester) || 0);
  const acian = Math.max(0, Number(o.acian) || 0);
  const keramik = Math.max(0, Number(o.keramik) || 0);
  const sisiKeramik = Math.max(0, Number(o.sisiKeramik) || 40) / 100;
  const isiDus = Math.max(1, Number(o.isiDus) || 6);
  const sakKg = Math.max(1, Number(o.sakKg) || 40);
  const bata = Math.ceil(dinding * 70);
  const semenKg = dinding * 11.5 + plester * 6.24 + acian * 3.25 + keramik * 10;
  const pasir = dinding * 0.043 + plester * 0.024 + keramik * 0.045;
  const keramikM2 = keramik * 1.06;
  const dus = Math.ceil(keramikM2 / (sisiKeramik * sisiKeramik * isiDus));
  const natKg = keramik * 1.5;
  return { bata, semenKg, sak: Math.ceil(semenKg / sakKg), pasir, keramikM2, dus, natKg };
};

export const meta = {"id": "bahan-bangunan", "name": "Hitung Bahan Bangunan", "cat": "sehari", "icon": "🧱", "desc": "Berapa bata, semen, pasir, dan keramik yang perlu dibeli?", "keywords": "bahan bangunan,bata,semen,pasir,keramik,renovasi,rab,plester,acian", "since": "6.11.0"};

export function render(root) {
  const dinding = T.input('text', 'Contoh: 20', '20'); dinding.inputMode = 'decimal';
  const plester = T.input('text', 'Contoh: 40', ''); plester.inputMode = 'decimal';
  const acian = T.input('text', 'Contoh: 40', ''); acian.inputMode = 'decimal';
  const keramik = T.input('text', 'Contoh: 12', ''); keramik.inputMode = 'decimal';
  const ukuran = T.select([['40', '40 x 40 cm'], ['30', '30 x 30 cm'], ['60', '60 x 60 cm']], '40');
  const isiDus = T.input('text', 'Contoh: 6', '6'); isiDus.inputMode = 'decimal';
  const sakKg = T.select([['40', 'Sak 40 kg'], ['50', 'Sak 50 kg']], '40');
  const hargaBata = T.input('text', 'Contoh: 800', ''); hargaBata.inputMode = 'decimal';
  const hargaSemen = T.input('text', 'Contoh: 65000', ''); hargaSemen.inputMode = 'decimal';
  const hargaPasir = T.input('text', 'Contoh: 250000', ''); hargaPasir.inputMode = 'decimal';
  const hargaDus = T.input('text', 'Contoh: 60000', ''); hargaDus.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const r = utils.hitungBahan({
      dinding: T.num(dinding.value), plester: T.num(plester.value), acian: T.num(acian.value),
      keramik: T.num(keramik.value), sisiKeramik: T.num(ukuran.value), isiDus: T.num(isiDus.value),
      sakKg: T.num(sakKg.value)
    });
    if (!(T.num(dinding.value) > 0) && !(T.num(plester.value) > 0) && !(T.num(keramik.value) > 0) && !(T.num(acian.value) > 0)) {
      T.show(box, '<div class="hint">Isi dulu luas pekerjaan yang mau dihitung, minimal satu.</div>');
      return;
    }
    let totalHarga = 0;
    const hb = T.num(hargaBata.value), hs = T.num(hargaSemen.value), hp = T.num(hargaPasir.value), hd = T.num(hargaDus.value);
    if (hb > 0) totalHarga += r.bata * hb;
    if (hs > 0) totalHarga += r.sak * hs;
    if (hp > 0) totalHarga += r.pasir * hp;
    if (hd > 0) totalHarga += r.dus * hd;
    T.show(box,
      (T.num(dinding.value) > 0 ? `<div class="kv"><span>Bata merah</span><b>${T.fmt(r.bata)} buah</b></div>` : '') +
      `<div class="kv"><span>Semen</span><b style="color:#fff">${T.fmt(Math.round(r.semenKg * 10) / 10)} kg (sekitar ${r.sak} sak)</b></div>` +
      `<div class="kv"><span>Pasir</span><b>${T.fmt(Math.round(r.pasir * 100) / 100)} m³</b></div>` +
      (T.num(keramik.value) > 0
        ? `<div class="kv"><span>Keramik</span><b>${T.fmt(Math.round(r.keramikM2 * 100) / 100)} m² (sekitar ${r.dus} dus)</b></div>` +
          `<div class="kv"><span>Semen nat</span><b>${T.fmt(Math.round(r.natKg * 10) / 10)} kg</b></div>` : '') +
      (totalHarga > 0 ? `<div class="kv"><span>Perkiraan total biaya bahan</span><b style="color:#fff">${T.rp(totalHarga)}</b></div>` : '') +
      `<div class="hint">Koefisien memakai standar AHSP/SNI: 1 m² dinding bata 1/2 bata butuh 70 bata, 11,5 kg semen, dan 0,043 m³ pasir. Angka ini patokan, tukangmu mungkin memakai campuran berbeda. Harga bahan tidak diisi otomatis karena beda daerah dan beda waktu, isi sendiri sesuai harga toko bangunan terdekat.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Isi luas tiap pekerjaan yang mau dihitung. Yang tidak dikerjakan, kosongkan saja.</p>'));
  root.appendChild(T.grid2(
    T.field('Luas dinding bata (m²)', dinding),
    T.field('Luas plesteran (m²)', plester)
  ));
  root.appendChild(T.grid2(
    T.field('Luas acian (m²)', acian),
    T.field('Luas lantai keramik (m²)', keramik)
  ));
  root.appendChild(T.grid2(
    T.field('Ukuran keramik', ukuran),
    T.field('Isi keramik per dus (lembar)', isiDus)
  ));
  root.appendChild(T.field('Ukuran sak semen', sakKg));
  root.appendChild(T.el('<h3 style="margin-top:20px">Harga bahan (opsional, untuk hitung biaya)</h3>'));
  root.appendChild(T.grid2(
    T.field('Harga bata per buah (Rp)', hargaBata),
    T.field('Harga semen per sak (Rp)', hargaSemen)
  ));
  root.appendChild(T.grid2(
    T.field('Harga pasir per m³ (Rp)', hargaPasir),
    T.field('Harga keramik per dus (Rp)', hargaDus)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
