import { h as T, utils, kv } from '../../core.js';

// Rasio beras : air (per berat) untuk rice cooker / dimasak di panci.
// Beras putih 1 : 1,2; beras merah 1 : 2; ketan 1 : 1; basmati 1 : 1,5.
// Rasio bisa diubah bebas, karena tiap merek beras dan selera beda.
// 1 gelas ukur = 200 ml air. Berat nasi matang kira-kira 2,5x berat
// beras mentah untuk beras putih (perkiraan, tergantung jenis beras).
const JENIS = {
  putih: { label: 'Beras putih', rasio: 1.2, matang: 2.5 },
  merah: { label: 'Beras merah', rasio: 2, matang: 2.2 },
  ketan: { label: 'Ketan', rasio: 1, matang: 2 },
  basmati: { label: 'Basmati', rasio: 1.5, matang: 2.8 },
};
export function hitungBerasAir(gram, rasio) {
  const g = Math.max(0, Number(gram) || 0);
  const r = Math.max(0, Number(rasio) || 0);
  return { gram: g, airMl: g * r, airGelas: g * r / 200 };
}
utils.rasioBerasAir = hitungBerasAir;

export const meta = {"id": "kalkulator-rasio-beras-air", "name": "Kalkulator Rasio Beras-Air", "cat": "masak", "icon": "🍚", "desc": "Takaran air dari jumlah beras dan jenisnya: putih, merah, ketan, atau basmati.", "keywords": "beras,air,nasi,rice cooker,takaran,rasio,masak,ketan,basmati", "since": "6.17.0"};
export function render(root) {
  const gramI = T.input('text', 'cth: 400', '400'); gramI.inputMode = 'decimal';
  const jenisSel = T.select(Object.keys(JENIS).map((k) => [k, JENIS[k].label]), 'putih');
  const rasioI = T.input('text', 'cth: 1,2', '1,2'); rasioI.inputMode = 'decimal';
  const box = T.out();
  let rasioDiubah = false;
  rasioI.addEventListener('input', () => { rasioDiubah = true; });
  jenisSel.addEventListener('change', () => {
    const jj = JENIS[jenisSel.value] || JENIS.putih;
    if (!rasioDiubah) rasioI.value = String(jj.rasio).replace('.', ',');
    hitung();
  });

  const hitung = () => {
    const gram = T.num(gramI.value) || 0;
    if (!(gram > 0)) { T.hide(box); return; }
    const rasio = T.num(rasioI.value);
    if (!isFinite(rasio) || rasio <= 0) { T.show(box, '<p class="warn">Rasio air harus angka lebih dari 0.</p>'); return; }
    const r = hitungBerasAir(gram, rasio);
    const j = JENIS[jenisSel.value] || JENIS.putih;
    const matang = Math.round(gram * j.matang);
    const porsi = Math.max(1, Math.round(matang / 200));
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.airMl)) + ' ml air</div>' +
      '<p class="center mut">Untuk ' + T.fmt(gram) + ' g ' + T.esc(j.label.toLowerCase()) + '.</p>' +
      kv('Air dalam gelas (1 gelas = 200 ml)', T.fmt(Math.round(r.airGelas * 10) / 10) + ' gelas') +
      kv('Rasio yang dipakai', '1 : ' + String(rasio).replace('.', ',')) +
      kv('Perkiraan nasi matang', 'sekitar ' + T.fmt(matang) + ' g') +
      kv('Perkiraan porsi (1 porsi sekitar 200 g nasi)', 'sekitar ' + porsi + ' porsi') +
      '<p class="hint">Rasio bawaan: beras putih 1 : 1,2, beras merah 1 : 2, ketan 1 : 1, basmati 1 : 1,5. Beras baru biasanya butuh air lebih sedikit, beras lama lebih banyak. Rasio di atas bisa diubah sesuai beras dan seleramu. Berat nasi matang hanya perkiraan.</p>');
  };
  [gramI, rasioI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Beras beda jenis, beda takaran airnya. Masukkan berat berasmu, pilih jenisnya, dan takaran airnya langsung ketemu.</p>'));
  root.appendChild(T.field('Berat beras (gram)', gramI, '1 gelas beras kira-kira 200 gram'));
  root.appendChild(T.field('Jenis beras', jenisSel));
  root.appendChild(T.field('Rasio air (air per 1 bagian beras)', rasioI, 'Terisi otomatis sesuai jenis beras, bisa diubah'));
  root.appendChild(box);
  hitung();
}
