import { h as T, utils } from '../../core.js?v=6.13.0';

// Logika murni (bisa di-test di Node). Dosis per hektar per musim tanam.
// Skema NPK mengikuti Permentan 13/2022: NPK 225 + Urea 50 + SP-36 75 + KCl 50 kg/ha.
// Skema tunggal memakai nilai tengah kisaran Permentan 2022 (Urea 300-400,
// SP-36 100-150, KCl 75-100). Semua dosis bisa diubah, karena kebutuhan
// tiap lahan beda.
utils.SKEMA_PUPUK_PADI = {
  npk: { nama: 'Skema NPK (majemuk)', dosis: { npk: 225, urea: 50, sp36: 75, kcl: 50, za: 0 } },
  tunggal: { nama: 'Skema pupuk tunggal', dosis: { npk: 0, urea: 300, sp36: 100, kcl: 75, za: 0 } }
};
utils.hitungPupukPadi = function (o) {
  const luas = Math.max(0, Number(o.luas) || 0);
  const d = o.dosis || {};
  const hasil = {};
  ['npk', 'urea', 'sp36', 'kcl', 'za'].forEach((k) => {
    hasil[k] = Math.max(0, Number(d[k]) || 0) * luas;
  });
  hasil.total = hasil.npk + hasil.urea + hasil.sp36 + hasil.kcl + hasil.za;
  return hasil;
};

export const meta = {"id": "pupuk-padi", "name": "Hitung Pupuk Padi", "cat": "indonesia", "icon": "🌾", "desc": "Dosis pupuk per hektar untuk padi sawah, sesuai luas lahanmu.", "keywords": "pupuk,padi,urea,npk,sp-36,kcl,sawah,pertanian,phonska", "since": "6.11.0"};

export function render(root) {
  const luas = T.input('text', 'Contoh: 0,5', '0,5'); luas.inputMode = 'decimal';
  const skema = T.select(Object.keys(utils.SKEMA_PUPUK_PADI).map((k) => [k, utils.SKEMA_PUPUK_PADI[k].nama]), 'npk');
  const dosisInput = {};
  ['npk', 'urea', 'sp36', 'kcl', 'za'].forEach((k) => {
    const inp = T.input('text', '0', ''); inp.inputMode = 'decimal';
    dosisInput[k] = inp;
  });
  const box = T.out();

  function isiDosisDefault() {
    const d = utils.SKEMA_PUPUK_PADI[skema.value].dosis;
    Object.keys(dosisInput).forEach((k) => { dosisInput[k].value = String(d[k] || 0); });
  }
  skema.addEventListener('change', isiDosisDefault);
  isiDosisDefault();

  const NAMA = { npk: 'NPK Phonska', urea: 'Urea', sp36: 'SP-36', kcl: 'KCl', za: 'ZA' };

  function calc() {
    const l = T.num(luas.value);
    if (!(l > 0)) { T.show(box, '<div class="hint">Isi dulu luas lahan dalam hektar.</div>'); return; }
    const dosis = {};
    Object.keys(dosisInput).forEach((k) => { dosis[k] = T.num(dosisInput[k].value); });
    const r = utils.hitungPupukPadi({ luas: l, dosis });
    let rows = '';
    Object.keys(NAMA).forEach((k) => {
      if (r[k] > 0) {
        rows += `<div class="kv"><span>${NAMA[k]}</span><b>${T.fmt(Math.round(r[k] * 10) / 10)} kg</b></div>`;
      }
    });
    if (!rows) { T.show(box, '<div class="hint">Semua dosis masih 0. Pilih skema atau isi dosis per hektarnya.</div>'); return; }
    T.show(box, rows +
      `<div class="kv"><span>Total pupuk</span><b style="color:#fff">${T.fmt(Math.round(r.total * 10) / 10)} kg untuk ${T.fmt(l)} ha</b></div>` +
      `<div class="hint">Jadwal umum: pupuk dasar saat 0-7 hari setelah tanam, susulan pertama 15-21 hari, susulan kedua 30-35 hari. Dosis di atas adalah patokan umum Permentan, kebutuhan lahanmu bisa beda menurut jenis tanah dan varietas. Tanyakan ke penyuluh pertanian setempat untuk dosis yang paling pas.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Hitung kebutuhan pupuk padi sawah dari luas lahan. Dosis per hektar bisa diubah sesuai anjuran penyuluh di daerahmu.</p>'));
  root.appendChild(T.field('Luas lahan (hektar)', luas, '1 hektar = 10.000 m². Lahan 5.000 m² berarti 0,5 ha.'));
  root.appendChild(T.field('Skema pemupukan', skema));
  root.appendChild(T.el('<h3 style="margin-top:20px">Dosis per hektar (kg), bisa diubah</h3>'));
  root.appendChild(T.grid2(
    T.field('NPK Phonska (kg/ha)', dosisInput.npk),
    T.field('Urea (kg/ha)', dosisInput.urea)
  ));
  root.appendChild(T.grid2(
    T.field('SP-36 (kg/ha)', dosisInput.sp36),
    T.field('KCl (kg/ha)', dosisInput.kcl)
  ));
  root.appendChild(T.field('ZA (kg/ha, opsional)', dosisInput.za));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
