import { h as T, kv } from '../../core.js';

// Kalkulator Kartu Waktu (Timesheet): isi jam masuk dan jam pulang tiap
// hari, ketahuan total jam kerja seminggu dan upahnya. Jam di atas 8 jam
// sehari bisa dihitung lembur dengan pengali yang bisa diubah.
export const meta = {"id": "kalkulator-kartu-waktu", "name": "Kalkulator Kartu Waktu", "cat": "produktivitas", "icon": "⏰", "desc": "Hitung total jam kerja seminggu dan upahnya dari jam masuk dan pulang tiap hari.", "keywords": "timesheet,kartu waktu,jam kerja,hitung upah,lembur,hitung gaji,absensi", "since": "6.18.0"};

export const NAMA_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Ubah "HH:MM" jadi menit sejak tengah malam. Null bila tidak valid.
export function jamKeMenit(jam) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(jam || '').trim());
  if (!m) return null;
  const j = Number(m[1]), mn = Number(m[2]);
  if (j > 23 || mn > 59) return null;
  return j * 60 + mn;
}

// Menit kerja satu hari. Pulang yang lebih awal dari masuk dianggap
// melewati tengah malam (shift malam). Murni, bisa diuji di Node.
export function menitKerja(masuk, pulang, istirahatMenit) {
  const a = jamKeMenit(masuk);
  const b = jamKeMenit(pulang);
  if (a == null || b == null) return null;
  let selisih = b - a;
  if (selisih <= 0) selisih += 24 * 60;
  const istirahat = Math.max(0, Number(istirahatMenit) || 0);
  return Math.max(0, selisih - istirahat);
}

export function fmtJamMenit(menit) {
  const m = Math.max(0, Math.round(menit || 0));
  const j = Math.floor(m / 60);
  const s = m % 60;
  return j + ' jam' + (s ? ' ' + s + ' menit' : '');
}

// Hitung seminggu. baris: [{masuk, pulang, istirahat}] per hari.
// lemburDari: jam biasa per hari sebelum lembur (0 = tanpa lembur).
// Murni, bisa diuji di Node.
export function hitungKartuWaktu(baris, tarifPerJam, lemburDari, pengaliLembur) {
  const tarif = Math.max(0, Number(tarifPerJam) || 0);
  const batas = Math.max(0, Number(lemburDari) || 0) * 60;
  const pengali = Number(pengaliLembur) > 0 ? Number(pengaliLembur) : 1.5;
  const perHari = [];
  let totalMenit = 0, biasaMenit = 0, lemburMenit = 0;
  (baris || []).forEach((b, i) => {
    const masuk = (b && b.masuk || '').trim();
    const pulang = (b && b.pulang || '').trim();
    if (!masuk && !pulang) { perHari.push({ hari: i, menit: 0, libur: true }); return; }
    const menit = menitKerja(masuk, pulang, b ? b.istirahat : 0);
    if (menit == null) { perHari.push({ hari: i, menit: 0, salah: true }); return; }
    let biasa = menit, lembur = 0;
    if (batas > 0 && menit > batas) { biasa = batas; lembur = menit - batas; }
    totalMenit += menit; biasaMenit += biasa; lemburMenit += lembur;
    perHari.push({ hari: i, menit, biasa, lembur });
  });
  const upahBiasa = (biasaMenit / 60) * tarif;
  const upahLembur = (lemburMenit / 60) * tarif * pengali;
  return {
    perHari, totalMenit, biasaMenit, lemburMenit,
    upahBiasa, upahLembur, totalUpah: upahBiasa + upahLembur,
    hariKerja: perHari.filter((p) => !p.libur && !p.salah && p.menit > 0).length,
  };
}

export function render(root) {
  const barisInput = NAMA_HARI.map((nama) => {
    const masuk = T.input('text', 'cth: 08:00', ''); masuk.inputMode = 'numeric';
    const pulang = T.input('text', 'cth: 17:00', ''); pulang.inputMode = 'numeric';
    const istirahat = T.input('text', 'cth: 60', '60'); istirahat.inputMode = 'numeric';
    return { nama, masuk, pulang, istirahat };
  });
  const tarifI = T.input('text', 'cth: 25000', ''); tarifI.inputMode = 'decimal';
  const lemburI = T.select([['8', 'Lembur dihitung setelah 8 jam/hari'], ['0', 'Tanpa lembur (semua jam biasa)']], '8');
  const pengaliI = T.input('text', 'cth: 1,5', '1,5'); pengaliI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const tarif = T.num(tarifI.value);
    if (!isFinite(tarif) || tarif < 0) {
      T.show(box, '<div class="err">Upah per jam harus diisi angka 0 atau lebih.</div>');
      return;
    }
    const pengali = T.num(pengaliI.value);
    if (!isFinite(pengali) || pengali <= 0) {
      T.show(box, '<div class="err">Pengali lembur harus diisi angka lebih dari 0.</div>');
      return;
    }
    const baris = barisInput.map((b) => ({ masuk: b.masuk.value, pulang: b.pulang.value, istirahat: T.num(b.istirahat.value) }));
    const r = hitungKartuWaktu(baris, tarif, Number(lemburI.value), pengali);
    const salah = r.perHari.filter((p) => p.salah);
    if (salah.length) {
      T.show(box, '<div class="err">Jam di hari ' + salah.map((p) => NAMA_HARI[p.hari]).join(', ') + ' tidak benar. Pakai format jam:menit, contoh 08:00.</div>');
      return;
    }
    if (!r.totalMenit) {
      T.show(box, '<div class="err">Belum ada jam kerja yang diisi. Isi jam masuk dan pulang minimal satu hari.</div>');
      return;
    }
    const rincian = r.perHari.filter((p) => !p.libur).map((p) =>
      kv(NAMA_HARI[p.hari], fmtJamMenit(p.menit) + (p.lembur ? ' (lembur ' + fmtJamMenit(p.lembur) + ')' : ''))).join('');
    T.show(box,
      '<div class="big">' + fmtJamMenit(r.totalMenit) + '</div>' +
      '<p class="center mut">Total jam kerja minggu ini (' + r.hariKerja + ' hari kerja).</p>' +
      kv('Jam biasa', fmtJamMenit(r.biasaMenit)) +
      kv('Jam lembur', fmtJamMenit(r.lemburMenit)) +
      kv('Upah jam biasa', T.rp(Math.round(r.upahBiasa))) +
      kv('Upah lembur', T.rp(Math.round(r.upahLembur))) +
      kv('Total upah minggu ini', '<b>' + T.rp(Math.round(r.totalUpah)) + '</b>') +
      '<div class="dim" style="margin-top:10px">Rincian per hari</div>' + rincian +
      '<p class="hint">Pulang yang lebih awal dari masuk dianggap shift malam (melewati tengah malam). Istirahat memotong jam kerja.</p>');
  };

  root.appendChild(T.el('<p class="note">Kosongkan hari libur. Pulang yang lebih awal dari masuk dianggap shift malam.</p>'));
  barisInput.forEach((b) => {
    root.appendChild(T.el('<div class="dim" style="margin:10px 0 4px"><b>' + b.nama + '</b></div>'));
    root.appendChild(T.grid2(T.field('Masuk', b.masuk), T.field('Pulang', b.pulang)));
    root.appendChild(T.field('Istirahat (menit)', b.istirahat));
  });
  root.appendChild(T.field('Upah per jam (Rp)', tarifI, 'Isi 0 bila hanya mau tahu total jamnya.'));
  root.appendChild(T.grid2(T.field('Aturan lembur', lemburI), T.field('Pengali lembur', pengaliI, '1,5 artinya lembur dibayar 1,5 kali jam biasa.')));
  root.appendChild(T.btn('Hitung Minggu Ini', hitung, true));
  root.appendChild(box);
}
