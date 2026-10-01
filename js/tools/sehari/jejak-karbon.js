import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "jejak-karbon", "name": "Jejak Karbon", "cat": "sehari", "icon": "🌱", "desc": "Estimasi jejak karbon tahunanmu + tips menguranginya.", "keywords": "karbon,emisi,co2,lingkungan,kendaraan,listrik,penerbangan"};

export function render(root) {
  const K = 'tool:jejak-karbon';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ k: kendI.value, v: kendaraSel.value, l: listrikI.value, p: pendekI.value, j: jauhI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Penasaran kendaraan, listrik, dan terbang-terbangmu menyumbang berapa CO₂ ke udara? Hitung kasarnya di sini.</p>'));

  const kendaraSel = T.select([['motor', 'Motor bensin'], ['mobil-bensin', 'Mobil bensin'], ['mobil-diesel', 'Mobil diesel']], sv.v || 'motor');
  const kendI = T.input('text', 'Contoh: 70', sv.k || '');
  const listrikI = T.input('text', 'Contoh: 150', sv.l || '');
  const pendekI = T.input('text', 'Contoh: 2', sv.p || '');
  const jauhI = T.input('text', 'Contoh: 0', sv.j || '');

  root.appendChild(T.field('Kendaraan yang dipakai', kendaraSel));
  root.appendChild(T.field('Jarak tempuh per minggu (km)', kendI, 'Rata-rata naik kendaraan itu.'));
  root.appendChild(T.field('Listrik per bulan (kWh)', listrikI, 'Cek tagihan listrik / token.'));
  root.appendChild(T.grid2(
    T.field('Penerbangan pendek/tahun', pendekI, 'Contoh: Jakarta–Bali.'),
    T.field('Penerbangan jauh/tahun', jauhI, 'Contoh: Jakarta–Dubai.')
  ));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const km = T.num(kendI.value) || 0;
    const kwh = T.num(listrikI.value) || 0;
    const pendek = Math.floor(T.num(pendekI.value)) || 0;
    const jauh = Math.floor(T.num(jauhI.value)) || 0;
    // Faktor emisi (kg CO2e):
    const faktorKm = { 'motor': 0.103, 'mobil-bensin': 0.192, 'mobil-diesel': 0.171 }[kendaraSel.value] || 0.103;
    const eKend = km * 52 * faktorKm;
    const eListrik = kwh * 12 * 0.81;                 // grid Indonesia ~0,81 kg/kWh
    const ePendek = pendek * 800 * 0.18;             // ~800 km per penerbangan pendek
    const eJauh = jauh * 6000 * 0.15;                // ~6000 km per penerbangan jauh
    const total = eKend + eListrik + ePendek + eJauh;
    const tips = [
      'Kurangi jarak berkendara: yang dekat, jalan kaki atau naik sepeda — sehat juga.',
      'Matikan lampu & cabut charger yang nganggur. AC naik 1 derajat aja udah ngirit listrik.',
      'Gabung carpool atau naik transportasi umum buat rute harian yang macet.',
      'Servis kendaraan rutin — mesin sehat = pembakaran lebih bersih & irit BBM.',
      'Kurangi plastik sekali pakai, bawa botol & tas belanja sendiri.'
    ].slice(0, 5);
    T.show(box,
      '<div class="big center">' + T.fmt(Math.round(total)) + ' <span class="mut" style="font-size:15px">kg CO₂e/tahun</span></div>' +
      '<p class="center mut">estimasi kasar, bukan pengukuran resmi</p>' +
      '<div class="kv"><span class="k">Kendaraan</span><span class="v">' + T.fmt(Math.round(eKend)) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Listrik</span><span class="v">' + T.fmt(Math.round(eListrik)) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Penerbangan</span><span class="v">' + T.fmt(Math.round(ePendek + eJauh)) + ' kg</span></div>' +
      '<p class="hint">Asumsi faktor emisi: motor 0,103 / mobil bensin 0,192 / mobil diesel 0,171 kg per km; listrik 0,81 kg per kWh; penerbangan pendek ±800 km @0,18 kg/km, jauh ±6000 km @0,15 kg/km. Angka aslinya bisa beda tergantung kondisi nyata.</p>' +
      '<p style="margin:10px 0 4px;font-weight:600">Biar jejakmu makin kecil:</p>' +
      '<ol style="font-size:13px;line-height:1.7;padding-left:18px;margin:0">' +
      tips.map((t) => '<li>' + T.esc(t) + '</li>').join('') + '</ol>'
    );
  };
  [kendI, listrikI, pendekI, jauhI].forEach((i) => i.addEventListener('input', hitung));
  kendaraSel.addEventListener('change', hitung);
  hitung();
}
