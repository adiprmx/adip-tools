import { h as T, utils, money, kv } from '../../core.js';

// Bulan penuh antara dua tanggal (tanggal akhir di bawah tanggal mulai = belum genap sebulan).
function bulanPenuh(a, b) {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0, m);
}

// Logika murni (bisa di-test di Node).
// Jatah cuti tahunan 12 hari (UU 13/2003 Pasal 79). Prorata = masa kerja/12 x jatah.
// Uang pengganti cuti = upah sebulan dibagi 21 (5 hari kerja) atau 25 (6 hari kerja)
// dikali sisa cuti (PP 35/2021 Pasal 40, PP 36/2021 Pasal 17).
utils.cutiProrata = function (o) {
  const mulai = new Date(o.mulai + 'T00:00:00');
  const hitung = new Date(o.hitung + 'T00:00:00');
  if (isNaN(mulai) || isNaN(hitung)) return { error: 'Tanggalnya tidak benar.' };
  if (hitung < mulai) return { error: 'Tanggal hitung tidak boleh sebelum tanggal mulai kerja.' };
  const jatah = Math.max(0, Number(o.jatah) || 0);
  const dipakai = Math.max(0, Number(o.dipakai) || 0);
  const upah = Math.max(0, Number(o.upah) || 0);
  const sistem = Number(o.sistem) === 6 ? 6 : 5;
  const pembagi = sistem === 6 ? 25 : 21;
  const masaBulan = bulanPenuh(mulai, hitung);
  const jatahExact = masaBulan >= 12 ? jatah : (masaBulan / 12) * jatah;
  const jatahBulat = Math.floor(jatahExact);
  const sisa = Math.max(0, jatahBulat - dipakai);
  return {
    masaBulan, masaTahun: Math.floor(masaBulan / 12), masaSisaBulan: masaBulan % 12,
    jatahExact, jatahBulat, dipakai, sisa, pembagi,
    upahSehari: upah > 0 ? upah / pembagi : 0,
    uangPengganti: upah > 0 ? (upah / pembagi) * sisa : 0,
  };
};

export const meta = {"id": "cuti-prorata", "name": "Cuti Prorata", "cat": "bisnis", "icon": "🏖️", "desc": "Jatah cuti tahunan sesuai masa kerja, plus uang pengganti cuti.", "keywords": "cuti,prorata,cuti tahunan,jatah cuti,sisa cuti,uang pengganti cuti", "since": "6.11.0"};
export function render(root) {
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = iso(new Date());

  const mulaiI = T.input('date', '', today);
  const hitungI = T.input('date', '', today);
  const jatahI = T.input('text', 'cth: 12', '12'); jatahI.inputMode = 'decimal';
  const dipakaiI = T.input('text', 'cth: 3', '0'); dipakaiI.inputMode = 'decimal';
  const upahI = money(null, 'cth: 6000000 (opsional)');
  const sistemSel = T.select([
    ['5', '5 hari kerja seminggu (Senin-Jumat)'],
    ['6', '6 hari kerja seminggu (Senin-Sabtu)'],
  ], '5');
  const box = T.out();

  const hitung = () => {
    const r = utils.cutiProrata({
      mulai: mulaiI.value, hitung: hitungI.value,
      jatah: T.num(jatahI.value), dipakai: T.num(dipakaiI.value),
      upah: T.num(upahI.value), sistem: sistemSel.value,
    });
    if (r.error) { T.show(box, '<p class="warn">' + T.esc(r.error) + '</p>'); return; }
    const masa = r.masaTahun > 0
      ? r.masaTahun + ' tahun ' + r.masaSisaBulan + ' bulan'
      : r.masaBulan + ' bulan';
    T.show(box,
      '<div class="big">' + T.fmt(r.sisa) + ' hari</div>' +
      '<p class="center mut">Sisa cuti yang bisa dipakai</p>' +
      kv('Masa kerja', T.esc(masa)) +
      kv('Jatah cuti prorata', T.fmt(r.jatahBulat) + ' hari' + (r.jatahExact !== r.jatahBulat ? ' (hitungan persis ' + T.fmt(Math.round(r.jatahExact * 10) / 10) + ' hari, dibulatkan ke bawah)' : '')) +
      kv('Cuti sudah dipakai', T.fmt(r.dipakai) + ' hari') +
      (T.num(upahI.value) > 0
        ? kv('Upah sehari (upah dibagi ' + r.pembagi + ')', T.rp(Math.round(r.upahSehari))) +
          kv('Uang pengganti sisa cuti', '<b>' + T.rp(Math.round(r.uangPengganti)) + '</b>')
        : '') +
      '<p class="hint">Hak cuti tahunan penuh 12 hari berlaku setelah bekerja 12 bulan berturut-turut (UU 13/2003 Pasal 79). Untuk masa kerja di bawah setahun, jatah prorata mengikuti kebijakan perusahaan, umumnya masa kerja dibagi 12 dikali jatah setahun. Uang pengganti cuti dibayar saat hubungan kerja berakhir untuk cuti yang belum diambil dan belum gugur (PP 35/2021 Pasal 40).</p>');
  };
  [mulaiI, hitungI, jatahI, dipakaiI, upahI].forEach((i) => i.addEventListener('input', hitung));
  sistemSel.addEventListener('change', hitung);
  mulaiI.addEventListener('change', hitung);
  hitungI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Baru kerja belum setahun? Jatah cutinya dihitung prorata dari masa kerja. Isi tanggal mulai kerja dan tanggal hitungnya.</p>'));
  root.appendChild(T.grid2(
    T.field('Tanggal mulai kerja', mulaiI),
    T.field('Tanggal hitung', hitungI)
  ));
  root.appendChild(T.grid2(
    T.field('Jatah cuti setahun (hari)', jatahI, 'Umumnya 12 hari'),
    T.field('Cuti sudah dipakai (hari)', dipakaiI)
  ));
  root.appendChild(T.field('Upah sebulan (Rp)', upahI, 'Opsional, untuk menghitung uang pengganti sisa cuti'));
  root.appendChild(T.field('Sistem kerja', sistemSel));
  root.appendChild(T.row(T.btn('Hitung jatah cuti', hitung, true)));
  root.appendChild(box);
}
