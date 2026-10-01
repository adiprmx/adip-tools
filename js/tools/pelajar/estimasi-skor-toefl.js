import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"estimasi-skor-toefl","name":"Estimasi TOEFL","cat":"pelajar","icon":"🎓","desc":"Perkirakan skor TOEFL dari nilai latihan listening, structure, reading.","keywords":"toefl,skor,estimasi,itp,listening,structure,reading,tes bahasa inggris,latihan"};

export function render(root) {
  const inL = T.input('number', '0 – 68');
  const inS = T.input('number', '0 – 68');
  const inR = T.input('number', '0 – 68');
  const out = T.out();

  const BANDS = [
    ['310 – 420', 'Dasar', 'Masih di tahap fondasi. Perbanyak latihan listening dan vocab dasar.'],
    ['421 – 525', 'Menengah', 'Komunikasi sehari-hari mulai kebuka. Gas latihan soal biar naik.'],
    ['526 – 610', 'Menengah atas', 'Udah enak buat kuliah atau kerja yang butuh bahasa Inggris. Tinggal poles.'],
    ['611 – 677', 'Mahir', 'Level pede ikut tes resmi. Jaga konsistensi biar nggak turun.'],
  ];

  const hitung = () => {
    const vals = [['Listening', T.num(inL.value)], ['Structure', T.num(inS.value)], ['Reading', T.num(inR.value)]];
    for (const [label, v] of vals) {
      if (!Number.isFinite(v) || v < 0 || v > 68) {
        T.show(out, '<p class="warn">Skor ' + T.esc(label) + ' harus angka 0–68. Cek lagi ya.</p>');
        return;
      }
    }
    const L = vals[0][1], S = vals[1][1], R = vals[2][1];
    const mentah = ((L + S + R) * 10) / 3;
    const total = Math.round(mentah);
    const band = BANDS.find(([rentang]) => {
      const [a, b] = rentang.split('–').map((x) => parseInt(x.trim(), 10));
      return total >= a && total <= b;
    });
    const lemah = vals.slice().sort((a, b) => a[1] - b[1])[0];
    T.show(out,
      '<div class="center" style="margin-bottom:4px"><div class="mut" style="font-size:12px">Estimasi skor total</div>' +
      '<div style="font-size:52px;font-weight:800;line-height:1.1">' + total + '</div></div>' +
      '<p class="center hint">(' + L + ' + ' + S + ' + ' + R + ') × 10 ÷ 3 = ' + mentah.toFixed(1) + ' → dibulatkan jadi ' + total + '</p>' +
      (band ? '<p class="center" style="margin:10px 0"><b>Perkiraan level: ' + T.esc(band[1]) + '</b><br><span class="mut" style="font-size:12.5px">' + T.esc(band[2]) + '</span></p>' : '') +
      '<p class="hint">Section terendahmu: <b>' + T.esc(lemah[0]) + '</b> (' + lemah[1] + ') — fokus latihan di sini biar totalnya naik.</p>' +
      '<div class="h3" style="margin:12px 0 6px">Tabel level (perkiraan kasar)</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12.5px">' +
      BANDS.map(([r, nama, ket]) => '<tr><td style="padding:7px 8px;border-bottom:1px solid #ffffff14;white-space:nowrap;font-family:monospace">' + T.esc(r) + '</td><td style="padding:7px 8px;border-bottom:1px solid #ffffff14"><b>' + T.esc(nama) + '</b><br><span class="mut">' + T.esc(ket) + '</span></td></tr>').join('') +
      '</table>' +
      '<p class="warn" style="margin-top:12px">Ingat: ini cuma <b>estimasi latihan, bukan skor resmi</b>. Skor asli dihitung pakai tabel konversi resmi di tiap sesi tes.</p>');
  };

  root.appendChild(T.el('<div class="warn" style="margin-bottom:12px;padding:10px 12px;border-radius:10px">Ini <b>estimasi latihan, bukan skor resmi</b> — buat ngukur progress belajarmu aja.</div>'));
  root.appendChild(T.el('<p class="hint">Masukin skor per section dari hasil latihanmu (skala 0–68 kayak TOEFL ITP), nanti dihitung totalnya.</p>'));
  root.appendChild(T.grid2(
    T.field('Listening', inL),
    T.field('Structure & Written Expression', inS),
    T.field('Reading Comprehension', inR)
  ));
  root.appendChild(T.row(T.btn('Hitung estimasi', hitung, true)));
  root.appendChild(out);
}
