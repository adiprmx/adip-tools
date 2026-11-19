import { h as T, kv, utils } from '../../core.js';

// Gear sepeda: rasio = gir depan / gir belakang. Development = jarak yang
// ditempuh dalam satu putaran pedal (rasio x keliling roda). Gear inches =
// rasio x diameter roda dalam inci, dihitung dari keliling roda yang dipilih.
// Kecepatan = development x kayuhan per menit x 60 / 1000 (km/jam).
export const RODA_SEPEDA = [
  ['700x23c', 2.096], ['700x25c', 2.105], ['700x28c', 2.136], ['700x32c', 2.155],
  ['650x47b', 2.048], ['26x2,0', 2.07], ['27,5x2,1', 2.15], ['29x2,2', 2.28],
];

export function gearSepeda(depan, belakang, kelilingM, kayuhan) {
  const d = Number(depan), b = Number(belakang), k = Number(kelilingM), c = Number(kayuhan);
  if (!(d > 0) || !(b > 0) || !(k > 0) || !(c >= 0)) return null;
  const rasio = d / b;
  const development = rasio * k;
  const diameterInci = k / Math.PI / 0.0254;
  const gearInches = rasio * diameterInci;
  const kecepatan = development * c * 60 / 1000;
  return { rasio, development, gearInches, kecepatan };
}
utils.gearSepeda = gearSepeda;

export const meta = {"id": "kalkulator-gear-sepeda", "name": "Kalkulator Gear Sepeda", "cat": "sehari", "icon": "🚲", "desc": "Rasio gear, development, dan kecepatan sepeda dari kombinasi gir depan belakang dan kayuhanmu.", "keywords": "gear sepeda,rasio gear,chainring,cog,development,gear inches,kayuhan,sepeda", "since": "6.19.0"};
export function render(root) {
  const depan = T.input('text', 'cth: 50', '50');
  depan.inputMode = 'decimal';
  const belakang = T.input('text', 'cth: 11', '11');
  belakang.inputMode = 'decimal';
  const roda = T.select(RODA_SEPEDA.map(([n, k]) => [String(k), n + ' (keliling ' + String(k).replace('.', ',') + ' m)']), '2.105');
  const kayuhan = T.input('text', 'cth: 90', '90');
  kayuhan.inputMode = 'decimal';
  const kaset = T.input('text', 'cth: 11,13,15,17,19,21,24,28', '11,13,15,17,19,21,24,28');
  kaset.inputMode = 'text';
  const box = T.out();

  const hitung = () => {
    const kelilingM = Number(roda.value);
    const r = gearSepeda(T.num(depan.value), T.num(belakang.value), kelilingM, T.num(kayuhan.value));
    if (!r) { T.show(box, '<span class="err">Isi gir depan dan belakang dengan angka lebih dari 0, dan kayuhan dengan angka 0 atau lebih.</span>'); return; }
    let tabel = '';
    const cogs = String(kaset.value).split(/[\s,;]+/).map((s) => T.num(s)).filter((n) => isFinite(n) && n > 0);
    if (cogs.length > 0) {
      tabel = '<div class="dim" style="margin-top:12px">Semua gir belakang (gir depan ' + T.esc(String(depan.value)) + ')</div>';
      cogs.forEach((c) => {
        const g = gearSepeda(T.num(depan.value), c, kelilingM, T.num(kayuhan.value));
        tabel += kv('Gir ' + T.fmt(c), 'rasio ' + utils.fmtDes(g.rasio, 2) + ', ' + utils.fmtDes(g.development, 2) + ' m/putaran, ' + utils.fmtDes(g.kecepatan, 1) + ' km/jam');
      });
    }
    T.show(box,
      '<div class="center"><div class="dim">Rasio gear</div>' +
      '<div class="big">' + utils.fmtDes(r.rasio, 2) + ' : 1</div>' +
      '<div class="dim">Roda berputar ' + utils.fmtDes(r.rasio, 2) + ' kali untuk satu putaran pedal</div></div>' +
      kv('Development', utils.fmtDes(r.development, 2) + ' meter per putaran pedal') +
      kv('Gear inches', utils.fmtDes(r.gearInches, 1) + '"') +
      kv('Kecepatan di ' + T.esc(String(kayuhan.value)) + ' kayuhan/menit', utils.fmtDes(r.kecepatan, 1) + ' km/jam') +
      tabel +
      '<p class="hint">Gear inches adalah ukuran lama dari Inggris: makin besar angkanya, makin berat tapi makin jauh jarak tiap kayuhan. Keliling roda di atas nilai umum tiap ukuran ban, hasil sebenarnya bisa beda sedikit tergantung tekanan ban dan merek.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan jumlah gigi gir depan dan belakang, ukuran roda, dan kayuhanmu per menit. Hasilnya rasio gear dan kecepatanmu.</p>'));
  root.appendChild(T.grid2(
    T.field('Gir depan (jumlah gigi)', depan),
    T.field('Gir belakang (jumlah gigi)', belakang),
    T.field('Ukuran roda', roda),
    T.field('Kayuhan per menit', kayuhan, 'Pesepeda santai sekitar 70 sampai 90.'),
  ));
  root.appendChild(T.field('Daftar gir belakang untuk tabel (opsional)', kaset, 'Pisahkan dengan koma. Kosongkan kalau tidak butuh tabel.'));
  root.appendChild(T.btn('Hitung Gear', hitung, true));
  root.appendChild(box);
  hitung();
}
