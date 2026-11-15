import { h as T, utils } from '../../core.js?v=6.11.5';

export const meta = {"id": "latihan-deret-angka", "name": "Latihan Deret Angka", "cat": "pelajar", "icon": "🔢", "desc": "Latihan soal deret angka TIU/psikotes tanpa habis — soal baru tiap kali, lengkap dengan timer dan pembahasan polanya.", "keywords": "deret angka,tiu,cpns,psikotes,latihan soal,barisan bilangan"};

const acak = (min, maks) => Math.floor(Math.random() * (maks - min + 1)) + min;
const pilih = (arr) => arr[acak(0, arr.length - 1)];

function buatSoal() {
  const jenis = pilih(['aritmetika', 'geometri', 'fibonacci', 'selang', 'kuadrat', 'gabungan']);
  let deret = [], jawab = 0, pola = '', bahas = '';
  if (jenis === 'aritmetika') {
    const a = acak(2, 20), d = pilih([2, 3, 4, 5, 6, 7, -3, -4, -5]);
    deret = Array.from({ length: 6 }, (_, i) => a + d * i);
    jawab = deret[5];
    pola = 'Aritmetika';
    bahas = 'Setiap suku bertambah ' + d + '. Selisih antar suku selalu ' + d + ', jadi suku berikutnya = ' + deret[4] + ' + ' + d + ' = ' + jawab + '.';
  } else if (jenis === 'geometri') {
    const a = acak(2, 6), r = pilih([2, 3]);
    deret = Array.from({ length: 6 }, (_, i) => a * Math.pow(r, i));
    jawab = deret[5];
    pola = 'Geometri';
    bahas = 'Setiap suku dikali ' + r + '. Rasio antar suku selalu ' + r + ', jadi suku berikutnya = ' + deret[4] + ' × ' + r + ' = ' + jawab + '.';
  } else if (jenis === 'fibonacci') {
    const a = acak(1, 9), b = acak(1, 9);
    deret = [a, b];
    while (deret.length < 6) deret.push(deret[deret.length - 1] + deret[deret.length - 2]);
    jawab = deret[5];
    pola = 'Fibonacci';
    bahas = 'Setiap suku = jumlah dua suku sebelumnya. Suku berikutnya = ' + deret[3] + ' + ' + deret[4] + ' = ' + jawab + '.';
  } else if (jenis === 'selang') {
    const a1 = acak(2, 15), d1 = acak(2, 6);
    const a2 = acak(2, 15), d2 = acak(2, 6);
    deret = [];
    for (let i = 0; i < 3; i++) { deret.push(a1 + d1 * i); deret.push(a2 + d2 * i); }
    jawab = deret[5];
    pola = 'Selang-seling (2 pola)';
    bahas = 'Ada dua deret selang-seling: suku ganjil (' + deret[0] + ', ' + deret[2] + ', ' + deret[4] + ') bertambah ' + d1 +
      '; suku genap (' + deret[1] + ', ' + deret[3] + ', …) bertambah ' + d2 + '. Suku ke-6 = ' + deret[3] + ' + ' + d2 + ' = ' + jawab + '.';
  } else if (jenis === 'kuadrat') {
    const n0 = acak(1, 5), c = acak(0, 3);
    deret = Array.from({ length: 6 }, (_, i) => (n0 + i) * (n0 + i) + c);
    jawab = deret[5];
    pola = 'Kuadrat';
    bahas = 'Sukunya bilangan kuadrat' + (c ? ' ditambah ' + c : '') + ': ' +
      deret.slice(0, 5).map((v, i) => (n0 + i) + '²' + (c ? '+' + c : '') + '=' + v).join(', ') +
      '. Berikutnya ' + (n0 + 5) + '²' + (c ? '+' + c : '') + ' = ' + jawab + '.';
  } else {
    const a = acak(2, 9), t = acak(2, 5), k = 2;
    deret = [a];
    for (let i = 1; i < 6; i++) deret.push(i % 2 === 1 ? deret[i - 1] + t : deret[i - 1] * k);
    jawab = deret[5];
    pola = 'Gabungan 2 pola';
    bahas = 'Polanya bergantian: tambah ' + t + ' lalu kali ' + k + '. ' +
      deret[4] + ' adalah suku ke-5, langkah berikutnya kali ' + k + ' → ' + deret[4] + ' × ' + k + ' = ' + jawab + '.';
  }
  return { tampil: deret.slice(0, 5), jawab, pola, bahas };
}

export function render(root) {

    let soal = null, benar = 0, total = 0, detik = 0, iv = null, sudahJawab = false;
    const soalBox = T.out();
    const skorBox = T.out();
    const bahasBox = T.out();
    const jawabI = T.input('number', 'Suku berikutnya…', '');
    const timerEl = T.el('<div class="center dim" style="font-variant-numeric:tabular-nums">⏱ 00:00</div>');

    const fmtWaktu = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

    const mulaiTimer = () => {
      if (iv) return;
      iv = setInterval(() => { detik++; timerEl.textContent = '⏱ ' + fmtWaktu(detik); }, 1000);
    };
    T.onLeave(() => { if (iv) clearInterval(iv); });

    const tampilSkor = () => {
      T.show(skorBox, '<div class="center">Skor: <b>' + benar + ' benar</b> dari ' + total + ' soal' +
        (total > 0 ? ' (' + Math.round(benar / total * 100) + '%)' : '') + '</div>');
    };

    const soalBaru = () => {
      soal = buatSoal();
      sudahJawab = false;
      jawabI.value = '';
      jawabI.disabled = false;
      T.hide(bahasBox);
      T.show(soalBox,
        '<div class="center" style="font-size:13px;color:#aaa;margin-bottom:8px">Pola: ' + soal.pola + '</div>' +
        '<div class="center" style="font-size:26px;font-weight:700;letter-spacing:1px;font-variant-numeric:tabular-nums">' +
        soal.tampil.join(' &nbsp; ') + ' &nbsp; <span style="color:#facc15">?</span></div>' +
        '<div class="center dim" style="margin-top:8px">Berapa angka berikutnya?</div>');
      mulaiTimer();
    };

    const cek = () => {
      if (sudahJawab || !soal) return;
      if (jawabI.value === '' || jawabI.value == null) { T.toast('Isi dulu jawabannya'); return; }
      sudahJawab = true;
      total++;
      const ok = Number(jawabI.value) === soal.jawab;
      if (ok) benar++;
      jawabI.disabled = true;
      tampilSkor();
      T.show(bahasBox,
        '<div style="padding:12px;border-radius:10px;background:' + (ok ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.12)') + ';border:1px solid ' + (ok ? 'rgba(74,222,128,.4)' : 'rgba(248,113,113,.4)') + '">' +
        '<b>' + (ok ? '✅ Benar!' : '❌ Belum tepat — jawabannya ' + soal.jawab) + '</b></div>' +
        '<div style="margin-top:10px;font-size:14px;line-height:1.6"><b>Pembahasan (' + soal.pola + '):</b><br/>' + soal.bahas + '</div>');
    };

    jawabI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); });

    root.appendChild(T.el('<p class="note">Latihan deret angka untuk TIU CPNS dan psikotes kerja. Soal dibuat acak tiap kali — tidak akan habis. Tebak angka berikutnya, lalu baca pembahasannya.</p>'));
    root.appendChild(timerEl);
    root.appendChild(skorBox);
    root.appendChild(soalBox);
    root.appendChild(T.field('Jawabanmu', jawabI));
    root.appendChild(T.row(
      T.btn('✓ Cek jawaban', cek, true),
      T.btn('Soal berikutnya →', soalBaru),
      T.btn('↺ Ulang skor', () => { benar = 0; total = 0; detik = 0; timerEl.textContent = '⏱ 00:00'; tampilSkor(); soalBaru(); })
    ));
    root.appendChild(bahasBox);
    T.hide(bahasBox);
    tampilSkor();
    soalBaru();

}
