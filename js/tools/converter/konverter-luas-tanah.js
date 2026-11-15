import { h as T, utils } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node).
// 1 ubin = 1 ru = 1 tumbak = 1 bata = 14,0625 m2 (3,75 m x 3,75 m).
// 1 bahu = 500 ubin = 7.031,25 m2 (acuan nasional; sebagian daerah memakai 7.096,5 m2).
// 1 rante = 400 m2 (Sumatera Utara/Riau). 1 are = 100 m2. 1 hektar = 10.000 m2.
utils.SATUAN_LUAS_TANAH = [
  { id: 'm2', nama: 'Meter persegi (m²)', keM2: 1 },
  { id: 'hektar', nama: 'Hektar (ha)', keM2: 10000 },
  { id: 'are', nama: 'Are', keM2: 100 },
  { id: 'ubin', nama: 'Ubin', keM2: 14.0625 },
  { id: 'ru', nama: 'Ru (Jawa Tengah)', keM2: 14.0625 },
  { id: 'tumbak', nama: 'Tumbak (Jawa Barat)', keM2: 14.0625 },
  { id: 'bata', nama: 'Bata (Sunda)', keM2: 14.0625 },
  { id: 'bahu', nama: 'Bahu / Bau', keM2: 7031.25 },
  { id: 'rante', nama: 'Rante (Sumut/Riau)', keM2: 400 }
];
utils.konversiLuasTanah = function (nilai, dariId) {
  const dari = utils.SATUAN_LUAS_TANAH.find((s) => s.id === dariId) || utils.SATUAN_LUAS_TANAH[0];
  const m2 = Math.max(0, Number(nilai) || 0) * dari.keM2;
  const hasil = {};
  utils.SATUAN_LUAS_TANAH.forEach((s) => { hasil[s.id] = m2 / s.keM2; });
  return { m2, hasil };
};

export const meta = {"id": "konverter-luas-tanah", "name": "Konverter Luas Tanah", "cat": "converter", "icon": "🌾", "desc": "Ubin, ru, bahu, tumbak ke meter persegi dan hektar.", "keywords": "ubin,ru,bahu,tumbak,bata,rante,luas tanah,hektar,m2,sawah", "since": "6.11.0"};

export function render(root) {
  const nilai = T.input('text', 'Contoh: 100', '100'); nilai.inputMode = 'decimal';
  const dari = T.select(utils.SATUAN_LUAS_TANAH.map((s) => [s.id, s.nama]), 'ubin');
  const harga = T.input('text', 'Contoh: 500000', ''); harga.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const n = T.num(nilai.value);
    if (!(n > 0)) { T.show(box, '<div class="hint">Isi dulu luasnya.</div>'); return; }
    const r = utils.konversiLuasTanah(n, dari.value);
    let rows = '';
    utils.SATUAN_LUAS_TANAH.forEach((s) => {
      const v = r.hasil[s.id];
      const tampil = v >= 1000 ? T.fmt(Math.round(v * 100) / 100) : T.fmt(Math.round(v * 10000) / 10000);
      rows += `<tr><td style="padding:6px 8px;border-bottom:1px solid #2a2a2a">${s.nama}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right"><b>${tampil}</b></td></tr>`;
    });
    const h = T.num(harga.value);
    T.show(box,
      `<table style="width:100%;border-collapse:collapse;font-size:13px">` + rows + `</table>` +
      (h > 0 ? `<div class="kv"><span>Perkiraan harga tanah (${T.rp(h)} per m²)</span><b style="color:#fff">${T.rp(r.m2 * h)}</b></div>` : '') +
      `<div class="hint">1 ubin, ru, tumbak, dan bata itu sama: 14,0625 m², dari petak 3,75 m x 3,75 m. 1 bahu = 500 ubin = 7.031,25 m² menurut acuan nasional, tapi di sebagian daerah bahu dihitung 7.096,5 m². Untuk jual beli, tulis luas dalam m² di perjanjian supaya tidak ada tafsir ganda.</div>`
    );
  }

  root.appendChild(T.grid2(
    T.field('Luas', nilai),
    T.field('Satuan asal', dari)
  ));
  root.appendChild(T.field('Harga per m² (Rp, opsional, untuk hitung harga tanah)', harga));
  root.appendChild(T.btn('Konversi', calc, true));
  root.appendChild(box);
}
