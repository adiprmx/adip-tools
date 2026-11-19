import { h as T, esc, utils } from '../../core.js';

// Skor APGAR (Virginia Apgar, 1952): penilaian cepat kondisi bayi baru
// lahir, dinilai pada menit ke-1 dan ke-5 setelah lahir. Lima komponen,
// masing-masing 0-2 poin, total 0-10:
// A (Appearance, warna kulit), P (Pulse, denyut jantung),
// G (Grimace, respons terhadap rangsangan), A (Activity, gerak otot),
// R (Respiration, napas).
// 7-10: normal. 4-6: perlu bantuan. 0-3: perlu pertolongan segera.
export function apgar(warna, denyut, respons, gerak, napas) {
  return warna + denyut + respons + gerak + napas;
}

export function bandApgar(total) {
  if (total >= 7) return ['Normal', 'Bayi dalam kondisi baik. Tetap dipantau seperti biasa oleh tenaga medis.', 'ok'];
  if (total >= 4) return ['Perlu bantuan', 'Bayi butuh bantuan, misalnya oksigen atau rangsangan napas. Tenaga medis yang menangani.', 'warn'];
  return ['Perlu pertolongan segera', 'Bayi dalam kondisi kritis dan butuh resusitasi segera oleh tenaga medis.', 'err'];
}
utils.apgar = apgar;
utils.bandApgar = bandApgar;

const OPSI = {
  warna: [
    ['0', '0: Biru atau pucat di seluruh tubuh'],
    ['1', '1: Badan kemerahan, tangan dan kaki biru'],
    ['2', '2: Kemerahan di seluruh tubuh'],
  ],
  denyut: [
    ['0', '0: Denyut jantung tidak teraba'],
    ['1', '1: Kurang dari 100 kali per menit'],
    ['2', '2: 100 kali per menit atau lebih'],
  ],
  respons: [
    ['0', '0: Tidak ada respons saat dirangsang'],
    ['1', '1: Meringis atau bergerak sedikit'],
    ['2', '2: Menangis keras, batuk, atau bersin'],
  ],
  gerak: [
    ['0', '0: Lemas, tidak bergerak'],
    ['1', '1: Lengan dan kaki sedikit menekuk'],
    ['2', '2: Bergerak aktif'],
  ],
  napas: [
    ['0', '0: Tidak bernapas'],
    ['1', '1: Napas lemah atau tidak teratur'],
    ['2', '2: Napas kuat, menangis keras'],
  ],
};

export const meta = {"id": "skor-apgar", "name": "Skor APGAR Bayi Baru Lahir", "cat": "kesehatan", "icon": "👶", "desc": "Nilai kondisi bayi baru lahir dari 5 tanda: warna kulit, denyut jantung, respons, gerak otot, dan napas.", "keywords": "apgar,skor apgar,bayi baru lahir,kelahiran,nilai apgar,neonatus", "since": "6.19.0"};
export function render(root) {
  const warna = T.select(OPSI.warna, '2');
  const denyut = T.select(OPSI.denyut, '2');
  const respons = T.select(OPSI.respons, '2');
  const gerak = T.select(OPSI.gerak, '2');
  const napas = T.select(OPSI.napas, '2');
  const box = T.out();

  const hitung = () => {
    const w = Number(warna.value);
    const d = Number(denyut.value);
    const r = Number(respons.value);
    const g = Number(gerak.value);
    const n = Number(napas.value);
    const total = apgar(w, d, r, g, n);
    const band = bandApgar(total);
    T.show(box,
      '<div class="center"><div class="dim">Skor APGAR</div>' +
      '<div class="big">' + total + ' / 10</div>' +
      '<div class="' + band[2] + '"><b>' + esc(band[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Warna kulit (A)</span><span class="v">' + w + ' poin</span></div>' +
      '<div class="kv"><span class="k">Denyut jantung (P)</span><span class="v">' + d + ' poin</span></div>' +
      '<div class="kv"><span class="k">Respons rangsangan (G)</span><span class="v">' + r + ' poin</span></div>' +
      '<div class="kv"><span class="k">Gerak otot (A)</span><span class="v">' + g + ' poin</span></div>' +
      '<div class="kv"><span class="k">Napas (R)</span><span class="v">' + n + ' poin</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(band[1]) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan skor</div>' +
      '<div class="kv"><span class="k">7-10</span><span class="v">Normal' + (total >= 7 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">4-6</span><span class="v">Perlu bantuan' + (total >= 4 && total <= 6 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0-3</span><span class="v">Perlu pertolongan segera' + (total <= 3 ? ' <b>&larr; di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Skor APGAR adalah alat bantu tenaga medis, dinilai pada menit ke-1 dan ke-5 setelah bayi lahir. ' +
      'Tool ini BUKAN diagnosis dan tidak menggantikan penilaian bidan atau dokter. ' +
      'Skor ini tidak memprediksi kesehatan jangka panjang bayi. ' +
      'Bila bayi baru lahir terlihat tidak bernapas, biru, atau lemas, segera minta bantuan tenaga medis atau bawa ke fasilitas kesehatan terdekat.</p>');
  };

  root.appendChild(T.field('Warna kulit', warna));
  root.appendChild(T.field('Denyut jantung', denyut));
  root.appendChild(T.field('Respons terhadap rangsangan', respons, 'Misalnya saat telapak kaki disentil pelan.'));
  root.appendChild(T.field('Gerak otot', gerak));
  root.appendChild(T.field('Napas', napas));
  root.appendChild(T.btn('Hitung skor', hitung, true));
  root.appendChild(box);
  hitung();
}
