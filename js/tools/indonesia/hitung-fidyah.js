import { h as T, utils } from '../../core.js?v=6.12.2';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

export const meta = {"id": "hitung-fidyah", "name": "Hitung Fidyah", "cat": "indonesia", "icon": "🍚", "desc": "Hitung fidyah untuk puasa yang terlewat: berapa hari × berapa rupiah, atau setara berapa kg beras.", "keywords": "fidyah,puasa,ramadan,ramadhan,beras,mud,baznas,ibu,hamil,sakit,lansia"};
export function render(root) {
  const hariI = T.input('number', 'cth: 30', '30');
  const jiwaI = T.input('number', 'cth: 1', '1');
  const nominalI = T.input('text', 'cth: 65000', '65000'); nominalI.inputMode = 'decimal';
  const mudI = T.input('text', 'cth: 0,75', '0,75'); mudI.inputMode = 'decimal'; // JANGAN type=number: browser membuang nilai desimal koma ('0,75' -> '')
  const box = T.out();

  const hitung = () => {
    const hari = Math.floor(T.num(hariI.value) || 0);
    const jiwa = Math.floor(T.num(jiwaI.value) || 0);
    const nominal = parseRp(nominalI.value) || 0;
    const mud = T.num(mudI.value) || 0;
    if (!(hari > 0)) { T.show(box, '<p class="warn">Isi jumlah hari puasa yang terlewat dulu ya.</p>'); return; }
    if (!(jiwa > 0)) { T.show(box, '<p class="warn">Jumlah jiwa harus minimal 1.</p>'); return; }
    if (!(nominal > 0)) { T.show(box, '<p class="warn">Isi nominal fidyah per hari dulu ya.</p>'); return; }
    const totalHari = hari * jiwa;
    const totalRp = totalHari * nominal;
    const totalBeras = mud > 0 ? totalHari * mud : 0;
    const fmtKg = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    T.show(box,
      '<div class="big">' + T.rp(totalRp) + '</div>' +
      '<p class="center hint">' + totalHari + ' hari × ' + T.rp(nominal) + ' per hari' +
      (jiwa > 1 ? ' (' + hari + ' hari × ' + jiwa + ' jiwa)' : '') + '</p>' +
      (totalBeras > 0
        ? '<p class="center" style="margin-top:10px">atau setara <b>' + T.esc(fmtKg(totalBeras)) + ' kg beras</b></p>' +
          '<p class="center hint">' + totalHari + ' hari × ' + T.esc(mudI.value) + ' kg (1 mud) per hari</p>'
        : '') +
      '<p class="hint">Nominal Rp65.000/jiwa/hari adalah ketetapan BAZNAS RI (SK Ketua BAZNAS No. 14/2026, Ramadan 1447 H) untuk Jabodetabek. BAZNAS daerah boleh menetapkan lain — misal Semarang dan Belitung Timur Rp30.000/hari — jadi ubah nominalnya sesuai daerahmu. Fidyah diberikan kepada fakir miskin, 1 hari puasa = memberi makan 1 orang.</p>');
  };

  [hariI, jiwaI, nominalI, mudI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Buat yang tidak bisa puasa karena hamil, menyusui, sakit, atau sudah lanjut usia: fidyah dibayar per hari puasa yang terlewat, dengan uang atau beras.</p>'));
  root.appendChild(T.grid2(
    T.field('Jumlah hari puasa yang terlewat', hariI),
    T.field('Jumlah jiwa', jiwaI, 'Isi lebih dari 1 kalau menghitung untuk beberapa orang'),
    T.field('Nominal fidyah per hari (Rp)', nominalI, 'BAZNAS 2026: Rp65.000 — ubah sesuai daerahmu'),
    T.field('Berat 1 mud (kg)', mudI, 'Sekitar 0,75 kg beras per hari, bisa diubah')
  ));
  root.appendChild(T.row(T.btn('Hitung fidyah', hitung, true)));
  root.appendChild(box);
  hitung();
}
