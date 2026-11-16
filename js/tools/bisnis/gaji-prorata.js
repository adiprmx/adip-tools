import { h as T, utils, money, kv } from '../../core.js?v=6.13.0';

// Jumlah hari kerja dalam satu bulan (Senin-Jumat untuk sistem 5 hari,
// Senin-Sabtu untuk sistem 6 hari). Libur nasional belum dikurangi.
function hariKerjaBulan(y, m, sistem) {
  const last = new Date(y, m, 0).getDate();
  let n = 0;
  for (let d = 1; d <= last; d++) {
    const wd = new Date(y, m - 1, d).getDay();
    if (sistem === 6 ? (wd >= 1 && wd <= 6) : (wd >= 1 && wd <= 5)) n++;
  }
  return n;
}
function hariKerjaRange(y, m, d1, d2, sistem) {
  let n = 0;
  for (let d = d1; d <= d2; d++) {
    const wd = new Date(y, m - 1, d).getDay();
    if (sistem === 6 ? (wd >= 1 && wd <= 6) : (wd >= 1 && wd <= 5)) n++;
  }
  return n;
}

// Logika murni (bisa di-test di Node).
// mode: 'masuk' (baru masuk), 'keluar' (hari terakhir kerja), 'manual'.
// Pembagi PP 36/2021 Pasal 17: 21 untuk sistem 5 hari kerja, 25 untuk 6 hari kerja.
utils.gajiProrata = function (o) {
  const gaji = Math.max(0, Number(o.gaji) || 0);
  const sistem = Number(o.sistem) === 6 ? 6 : 5;
  const pembagi = sistem === 6 ? 25 : 21;
  const y = Number(o.tahun) || new Date().getFullYear();
  const m = Math.min(12, Math.max(1, Number(o.bulan) || 1));
  const last = new Date(y, m, 0).getDate();
  const hkb = hariKerjaBulan(y, m, sistem);
  const mode = o.mode === 'keluar' ? 'keluar' : o.mode === 'manual' ? 'manual' : 'masuk';
  let efektif = 0, kalEfektif = 0;
  if (mode === 'manual') {
    efektif = Math.max(0, Math.min(hkb, Math.floor(Number(o.hari) || 0)));
  } else {
    const tgl = Math.min(last, Math.max(1, Math.floor(Number(o.tanggal) || 1)));
    if (mode === 'keluar') {
      efektif = hariKerjaRange(y, m, 1, tgl, sistem);
      kalEfektif = tgl;
    } else {
      efektif = hariKerjaRange(y, m, tgl, last, sistem);
      kalEfektif = last - tgl + 1;
    }
  }
  const perHariPP = gaji / pembagi;
  const perHariAktual = hkb > 0 ? gaji / hkb : 0;
  const perHariKal = gaji / last;
  return {
    mode, gaji, sistem, pembagi, hariKalender: last, hariKerjaBulan: hkb,
    hariEfektif: efektif, hariKalenderEfektif: kalEfektif,
    perHariPP, prorataPP: perHariPP * efektif,
    perHariAktual, prorataAktual: perHariAktual * efektif,
    perHariKal, prorataKal: perHariKal * kalEfektif,
  };
};

export const meta = {"id": "gaji-prorata", "name": "Gaji Prorata", "cat": "bisnis", "icon": "📅", "desc": "Gaji masuk atau keluar tengah bulan, dihitung per hari kerja.", "keywords": "gaji,prorata,prorate,masuk,keluar,resign,tengah bulan,upah harian,pp 36", "since": "6.11.0"};
export function render(root) {
  const now = new Date();
  const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const gajiI = money(null, 'cth: 6000000');
  const sistemSel = T.select([
    ['5', '5 hari kerja seminggu (Senin-Jumat)'],
    ['6', '6 hari kerja seminggu (Senin-Sabtu)'],
  ], '5');
  const kasusSel = T.select([
    ['masuk', 'Baru masuk di tengah bulan'],
    ['keluar', 'Hari terakhir kerja di tengah bulan'],
    ['manual', 'Hitung manual per hari kerja'],
  ], 'masuk');
  const bulanI = T.input('month', '', ym);
  const tglI = T.input('text', 'cth: 16'); tglI.inputMode = 'numeric';
  const hariI = T.input('text', 'cth: 11'); hariI.inputMode = 'numeric';
  const box = T.out();

  const fldBulan = T.field('Bulan yang dihitung', bulanI);
  const fldTgl = T.field('Tanggal mulai kerja', tglI, 'Tanggal 1-31 di bulan itu');
  const fldHari = T.field('Hari kerja yang dijalani', hariI);
  fldHari.hidden = true;

  const aturTampil = () => {
    const manual = kasusSel.value === 'manual';
    fldBulan.hidden = true; fldTgl.hidden = true; fldHari.hidden = true;
    fldBulan.hidden = false;
    if (manual) { fldHari.hidden = false; }
    else {
      fldTgl.hidden = false;
      fldTgl.querySelector('label').textContent = kasusSel.value === 'keluar' ? 'Tanggal terakhir kerja' : 'Tanggal mulai kerja';
    }
  };
  kasusSel.addEventListener('change', aturTampil);

  const hitung = () => {
    const gaji = T.num(gajiI.value) || 0;
    if (!(gaji > 0)) { T.show(box, '<p class="warn">Isi dulu gaji sebulannya.</p>'); return; }
    const parts = String(bulanI.value || '').split('-');
    const y = Number(parts[0]) || now.getFullYear();
    const m = Number(parts[1]) || (now.getMonth() + 1);
    const r = utils.gajiProrata({
      gaji, sistem: sistemSel.value, mode: kasusSel.value,
      tahun: y, bulan: m, tanggal: T.num(tglI.value), hari: T.num(hariI.value),
    });
    if (r.hariEfektif <= 0) { T.show(box, '<p class="warn">Hari kerja yang dijalani masih 0. Periksa tanggal atau jumlah harinya.</p>'); return; }
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m - 1];
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.prorataPP)) + '</div>' +
      '<p class="center mut">Gaji prorata cara PP 36/2021 untuk ' + T.esc(namaBulan) + ' ' + y + '</p>' +
      kv('Gaji sebulan', T.rp(gaji)) +
      kv('Hari kerja bulan itu', T.fmt(r.hariKerjaBulan) + ' hari') +
      kv('Hari kerja yang dijalani', T.fmt(r.hariEfektif) + ' hari') +
      kv('Gaji per hari (gaji dibagi ' + r.pembagi + ')', T.rp(Math.round(r.perHariPP))) +
      '<h3 style="font-size:14px;margin:12px 0 4px">Cara hitung lain (pembanding)</h3>' +
      kv('Hari kerja aktual: gaji dibagi ' + r.hariKerjaBulan + ' hari x ' + r.hariEfektif + ' hari', T.rp(Math.round(r.prorataAktual))) +
      (r.mode === 'manual' ? '' : kv('Hari kalender: gaji dibagi ' + r.hariKalender + ' hari x ' + r.hariKalenderEfektif + ' hari', T.rp(Math.round(r.prorataKal)))) +
      '<p class="hint">Patokan aturan: upah sehari = upah sebulan dibagi 21 (sistem 5 hari kerja) atau dibagi 25 (sistem 6 hari kerja), PP 36/2021 Pasal 17. Cara lain hanya pembanding, karena tiap perusahaan bisa memakai patokan sendiri. Libur nasional belum dikurangi dari hitungan hari kerja. Cek perjanjian kerja atau peraturan perusahaan untuk patokan yang dipakai tempat kerjamu.</p>');
  };
  [gajiI, sistemSel, bulanI, tglI, hariI].forEach((i) => i.addEventListener('input', hitung));
  sistemSel.addEventListener('change', hitung);
  bulanI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Masuk atau keluar kerja di tengah bulan? Gajinya dihitung prorata, sesuai hari kerja yang dijalani. Cara pertama di bawah adalah patokan aturan, dua cara lain sekadar pembanding.</p>'));
  root.appendChild(T.field('Gaji sebulan (Rp)', gajiI, 'Gaji pokok + tunjangan tetap'));
  root.appendChild(T.field('Sistem kerja', sistemSel));
  root.appendChild(T.field('Kasus', kasusSel));
  root.appendChild(fldBulan);
  root.appendChild(fldTgl);
  root.appendChild(fldHari);
  root.appendChild(T.row(T.btn('Hitung gaji prorata', hitung, true)));
  root.appendChild(box);
  aturTampil();
}
