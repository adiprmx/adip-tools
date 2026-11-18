import { h as T, esc } from '../../core.js';

// Rentang kenaikan berat badan selama hamil dari BMI sebelum hamil,
// pedoman Institute of Medicine (IOM) 2009:
// BMI <18,5: total 12,5-18 kg, 0,44-0,58 kg/minggu (trimester 2 dan 3).
// BMI 18,5-24,9: total 11,5-16 kg, 0,35-0,50 kg/minggu.
// BMI 25-29,9: total 7-11,5 kg, 0,23-0,33 kg/minggu.
// BMI 30 ke atas: total 5-9 kg, 0,17-0,27 kg/minggu.
// Hamil kembar (IOM 2009, provisional): BMI <18,5: 17-25 kg;
// 18,5-24,9: 16,8-24,5 kg; 25-29,9: 14-23 kg; 30 ke atas: 11-19 kg.
// Trimester 1: 0,5-2 kg untuk semua kelompok.
const TUNGGAL = [
  [18.5, 'Kurus', 12.5, 18, 0.44, 0.58],
  [25, 'Normal', 11.5, 16, 0.35, 0.50],
  [30, 'Kelebihan berat', 7, 11.5, 0.23, 0.33],
  [Infinity, 'Obesitas', 5, 9, 0.17, 0.27],
];
const KEMBAR = [
  [18.5, 'Kurus', 17, 25],
  [25, 'Normal', 16.8, 24.5],
  [30, 'Kelebihan berat', 14, 23],
  [Infinity, 'Obesitas', 11, 19],
];

export const meta = {"id": "kalkulator-kenaikan-berat-badan-hamil", "name": "Kalkulator Kenaikan Berat Badan Hamil", "cat": "kesehatan", "icon": "🤰", "desc": "Berapa kenaikan berat badan yang dianjurkan selama hamil, dari berat badan sebelum hamil.", "keywords": "hamil,kehamilan,berat badan hamil,iom,trimester,naik berat badan,bumil", "since": "6.17.0"};
export function render(root) {
  const berat = T.input('number', 'Berat badan sebelum hamil (kg)', '60');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '165');
  const kembar = T.select([['tunggal', 'Hamil satu bayi'], ['kembar', 'Hamil kembar (2 bayi)']], 'tunggal');
  const box = T.out();

  const hitung = () => {
    const bb = T.num(berat.value);
    const h = T.num(tinggi.value);
    if (!(bb >= 30 && bb <= 200)) {
      T.show(box, '<span class="err">Isi berat badan sebelum hamil antara 30 sampai 200 kg.</span>');
      return;
    }
    if (!(h >= 120 && h <= 220)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 120 sampai 220 cm.</span>');
      return;
    }
    const bmi = bb / Math.pow(h / 100, 2);
    const isKembar = kembar.value === 'kembar';
    const tabel = isKembar ? KEMBAR : TUNGGAL;
    const baris = tabel.find(([batas]) => bmi < batas);
    const [, kat, totalBawah, totalAtas, mgBawah, mgAtas] = baris;
    let triHtml = '';
    if (!isKembar) {
      // Trimester 2 dan 3 masing-masing sekitar 13 minggu.
      triHtml =
        '<div class="kv"><span class="k">Trimester 1 (minggu 1-13)</span><span class="v">0,5 - 2 kg</span></div>' +
        '<div class="kv"><span class="k">Trimester 2 (minggu 14-26)</span><span class="v">' + (mgBawah * 13).toFixed(1) + ' - ' + (mgAtas * 13).toFixed(1) + ' kg</span></div>' +
        '<div class="kv"><span class="k">Trimester 3 (minggu 27-40)</span><span class="v">' + (mgBawah * 13).toFixed(1) + ' - ' + (mgAtas * 13).toFixed(1) + ' kg</span></div>' +
        '<div class="kv"><span class="k">Laju per minggu (trimester 2-3)</span><span class="v">' + mgBawah.toFixed(2) + ' - ' + mgAtas.toFixed(2) + ' kg/minggu</span></div>';
    } else {
      triHtml = '<div class="kv"><span class="k">Per trimester</span><span class="v">Pedoman IOM 2009 untuk kembar hanya memberi angka total, bukan per trimester. Dokter atau bidanmu yang memantau lajunya.</span></div>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Kenaikan berat yang dianjurkan selama hamil' + (isKembar ? ' kembar' : '') + '</div>' +
      '<div class="big">' + totalBawah.toFixed(1) + ' - ' + totalAtas.toFixed(1) + ' kg</div>' +
      '<div class="dim">BMI sebelum hamil ' + bmi.toFixed(1) + ' (' + esc(kat) + ')</div></div>' +
      triHtml +
      '<p class="hint">Pedoman Institute of Medicine (IOM) 2009, dari BMI sebelum hamil. Angka kembar adalah angka sementara dari pedoman yang sama. ' +
      'Ini patokan umum, bukan target yang harus dikejar mati-matian dan bukan diagnosis. Tiap kehamilan beda, dan dokter atau bidan bisa memberi target yang beda bila ada kondisi khusus. ' +
      'Konsultasikan ke dokter, bidan, atau tenaga kesehatan, dan jangan diet ketat selama hamil tanpa arahan mereka.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat badan sebelum hamil (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.field('Jumlah bayi', kembar));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
