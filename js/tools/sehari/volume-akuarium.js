import { h as T, utils, kv } from '../../core.js';

// Volume akuarium dari panjang x lebar x tinggi (cm). Volume air memakai
// tinggi air (biasanya 2-5 cm di bawah bibir atas). Tebal kaca mengurangi
// ruang dalam bila diisi. Berat air kira-kira 1 kg per liter, ditambah
// berat kaca dan pasir bila dihitung.
export function volumeAkuarium(panjang, lebar, tinggi, tinggiAir, tebalKaca) {
  const p = Number(panjang);
  const l = Number(lebar);
  const t = Number(tinggi);
  const ta = tinggiAir == null || tinggiAir === '' ? t : Number(tinggiAir);
  const kaca = Number(tebalKaca) || 0;
  if (!isFinite(p) || !isFinite(l) || !isFinite(t) || !isFinite(ta) || p <= 0 || l <= 0 || t <= 0 || ta <= 0 || ta > t || kaca < 0) return null;
  const pd = Math.max(0, p - 2 * kaca);
  const ld = Math.max(0, l - 2 * kaca);
  const td = Math.max(0, ta - kaca);
  const literKotor = p * l * t / 1000;
  const literAir = pd * ld * td / 1000;
  return {
    literKotor: Math.round(literKotor * 10) / 10,
    literAir: Math.round(literAir * 10) / 10,
    beratAirKg: Math.round(literAir * 10) / 10,
    // Panduan kasar umum: 1 liter air per 1 cm panjang ikan dewasa.
    ikanCm: Math.floor(literAir),
  };
}
utils.volumeAkuarium = volumeAkuarium;

export const meta = {"id": "volume-akuarium", "name": "Volume Akuarium", "cat": "sehari", "icon": "🐠", "desc": "Hitung liter air akuarium dari ukurannya, plus berat air dan panduan kasar jumlah ikan.", "keywords": "volume akuarium,akuarium,liter air,ikan hias,tank,fish tank", "since": "6.19.0"};
export function render(root) {
  const panjangI = T.input('text', 'cth: 100', ''); panjangI.inputMode = 'decimal';
  const lebarI = T.input('text', 'cth: 40', ''); lebarI.inputMode = 'decimal';
  const tinggiI = T.input('text', 'cth: 50', ''); tinggiI.inputMode = 'decimal';
  const tinggiAirI = T.input('text', 'cth: 45', ''); tinggiAirI.inputMode = 'decimal';
  const kacaI = T.input('text', 'cth: 0,8', '0'); kacaI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const p = T.num(panjangI.value);
    const l = T.num(lebarI.value);
    const t = T.num(tinggiI.value);
    const ta = tinggiAirI.value.trim() ? T.num(tinggiAirI.value) : t;
    const kaca = T.num(kacaI.value);
    if (!panjangI.value.trim() && !lebarI.value.trim() && !tinggiI.value.trim()) { T.hide(box); return; }
    const cek = (v, nama) => {
      if (!isFinite(v) || v <= 0 || v > 1000) { T.show(box, '<div class="err">' + nama + ' harus angka lebih dari 0 sampai 1000 cm.</div>'); return false; }
      return true;
    };
    if (!cek(p, 'Panjang') || !cek(l, 'Lebar') || !cek(t, 'Tinggi')) return;
    if (!isFinite(ta) || ta <= 0 || ta > t) { T.show(box, '<div class="err">Tinggi air harus angka lebih dari 0 dan tidak melebihi tinggi akuarium.</div>'); return; }
    if (!isFinite(kaca) || kaca < 0 || kaca > 5) { T.show(box, '<div class="err">Tebal kaca harus angka 0 sampai 5 cm.</div>'); return; }
    const r = volumeAkuarium(p, l, t, ta, kaca);
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.literAir)) + ' liter air</div>' +
      '<p class="center mut">Volume kotor ' + T.fmt(Math.round(r.literKotor)) + ' liter bila diisi penuh sampai bibir atas.</p>' +
      kv('Volume air', utils.fmtDes(r.literAir, 1) + ' liter') +
      kv('Berat air saja', '~' + T.fmt(Math.round(r.beratAirKg)) + ' kg') +
      kv('Panduan kasar ikan', 'Total sekitar ' + T.fmt(r.ikanCm) + ' cm panjang ikan dewasa') +
      '<p class="hint">Berat total aslinya lebih besar karena kaca, pasir, batu, dan hiasan. Pastikan meja atau raknya kuat menahan beban. Panduan ikan di atas hitungan kasar umum (1 liter per 1 cm ikan), ikan besar dan ikan yang kotorannya banyak butuh ruang lebih lega. Isi akuarium sampai 2 sampai 5 cm di bawah bibir atas supaya air tidak tumpah saat ikan bergerak.</p>');
  };
  [panjangI, lebarI, tinggiI, tinggiAirI, kacaI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Ukur akuariummu, langsung ketahuan berapa liter airnya dan seberapa berat jadinya.</p>'));
  root.appendChild(T.grid2(
    T.field('Panjang (cm)', panjangI),
    T.field('Lebar (cm)', lebarI)
  ));
  root.appendChild(T.grid2(
    T.field('Tinggi akuarium (cm)', tinggiI),
    T.field('Tinggi air (cm, opsional)', tinggiAirI, 'Kosongkan bila air sampai atas')
  ));
  root.appendChild(T.field('Tebal kaca (cm, opsional)', kacaI, 'Kaca akuarium biasa 0,5 sampai 1,2 cm'));
  root.appendChild(box);
}
