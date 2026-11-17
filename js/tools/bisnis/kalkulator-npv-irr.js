import { h as T, kv } from '../../core.js';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM. */

/** NPV = -investasi + Σ arusKas[t] / (1 + r)^(t+1). r dalam desimal (0,10 = 10%). */
export function hitungNPV(investasi, arusKas, diskonto) {
  let npv = -investasi;
  for (let t = 0; t < arusKas.length; t++) {
    npv += arusKas[t] / Math.pow(1 + diskonto, t + 1);
  }
  return npv;
}

/** IRR via bisection: cari r yang membuat NPV = 0. null bila tidak ada
    perubahan tanda di rentang [-90%, +1000%] (arus kas tidak pernah balik modal). */
export function cariIRR(investasi, arusKas) {
  const f = (r) => hitungNPV(investasi, arusKas, r);
  let lo = -0.9, hi = 10;
  const flo = f(lo), fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Payback period (tahun, bisa pecahan via interpolasi). null bila tidak pernah balik modal. */
export function paybackPeriod(investasi, arusKas) {
  let kumulatif = 0;
  for (let t = 0; t < arusKas.length; t++) {
    const sebelum = kumulatif;
    kumulatif += arusKas[t];
    if (kumulatif >= investasi) {
      if (arusKas[t] <= 0) return t + 1;
      return t + (investasi - sebelum) / arusKas[t];
    }
  }
  return null;
}

/** Parse teks arus kas jadi daftar angka (satu angka = satu tahun).
    Pemisah antar arus kas: baris baru (\n / \r\n / \r), tab, titik-koma, dan
    koma daftar (koma diikuti spasi, atau diikuti angka bertitik — "30.000.000,
    40.000.000"). Baris kosong diabaikan. Angka Indonesia tetap benar:
    "30.000.000" -> 30000000, "1,5" -> 1,5 (koma desimal TIDAK pernah jadi
    pemisah). Spasi: "30 000 000" (ribuan spasi: 1-3 digit + kelompok 3 digit)
    tetap dibaca SATU angka; baris berisi beberapa angka dipisah spasi
    ("30000000 40000000") dibaca sebagai beberapa arus kas — jadi tempelan
    tidak pernah lagi menyatu diam-diam jadi satu angka raksasa (T.num
    menghapus semua whitespace; parser lama hanya split('\n')).
    Balikan: { nilai: number[]|null, salah: string|null } — `salah` berisi
    token pertama yang bukan angka, untuk pesan ramah di UI. */
export function parseArusKas(teks) {
  const nilai = [];
  const baris = String(teks == null ? '' : teks).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const b of baris) {
    // Tab / titik-koma / koma-daftar = pemisah (tempelan baris spreadsheet / CSV).
    const potong = b.split(/[\t;]+|,(?=\s|\d[\d.]*\.)/);
    for (let tok of potong) {
      tok = tok.trim().replace(/\s+/g, ' ');
      if (!tok) continue;
      if (/\s/.test(tok) && !/^[+-]?\d{1,3}( \d{3})+$/.test(tok)) {
        // Beberapa angka dipisah spasi — pisah, jangan digabung.
        for (const sub of tok.split(' ')) {
          if (!sub) continue;
          const v = T.num(sub);
          if (!isFinite(v)) return { nilai: null, salah: sub };
          nilai.push(v);
        }
      } else {
        const v = T.num(tok);
        if (!isFinite(v)) return { nilai: null, salah: tok };
        nilai.push(v);
      }
    }
  }
  return { nilai, salah: null };
}

const fmtPersen = (x, digit) => (x * 100).toFixed(digit == null ? 2 : digit).replace('.', ',') + '%';
const fmtTahun = (t) => {
  const thn = Math.floor(t);
  const bln = Math.round((t - thn) * 12);
  if (thn === 0) return bln + ' bulan';
  if (bln === 0) return thn + ' tahun';
  return thn + ' tahun ' + bln + ' bulan';
};

export const meta = {"id": "kalkulator-npv-irr", "name": "Kalkulator NPV & IRR", "cat": "bisnis", "icon": "💹", "desc": "Nilai proyek bertahun-tahun: NPV, IRR, dan payback dari arus kas per tahun.", "keywords": "npv,irr,investasi,arus kas,payback,diskonto,proyek,balik modal", "since": "6.13.0"};
export function render(root) {

    const invI = T.input('text', 'cth: 100000000', '');
    invI.inputMode = 'decimal';
    const diskI = T.input('text', 'cth: 10', '10');
    diskI.inputMode = 'decimal';
    const cfI = T.ta(5, 'Satu baris per tahun, cth:\n30000000\n40000000\n50000000\n40000000');
    cfI.inputMode = 'decimal';
    const box = T.out();

    const hitung = () => {
      const inv = T.num(invI.value);
      const disk = T.num(diskI.value);
      if (!isFinite(inv) || inv <= 0) { T.toast('Isi investasi awal dengan angka lebih dari 0'); return; }
      if (!isFinite(disk) || disk < 0 || disk >= 100) { T.toast('Tingkat diskonto diisi 0 sampai di bawah 100'); return; }
      const hasil = parseArusKas(cfI.value);
      if (hasil.salah != null) { T.toast('Baris "' + hasil.salah.slice(0, 20) + '" bukan angka — perbaiki dulu'); return; }
      if (!hasil.nilai.length) { T.toast('Isi dulu arus kas per tahunnya, satu baris per tahun'); return; }
      const arusKas = hasil.nilai;
      if (arusKas.length > 30) { T.toast('Maksimal 30 tahun ya'); return; }
      const r = disk / 100;
      const npv = hitungNPV(inv, arusKas, r);
      const irr = cariIRR(inv, arusKas);
      const pb = paybackPeriod(inv, arusKas);
      const totalMasuk = arusKas.reduce((a, b) => a + b, 0);
      // Guard hasil: arus kas raksasa bisa meluberkan NPV/kumulatif ke
      // Infinity (RT2-08: "Rp-∞") — tolak dengan pesan ramah, bukan vonis.
      if (!isFinite(npv) || !isFinite(totalMasuk)) {
        T.toast('Angkanya terlalu besar untuk dihitung — coba pakai investasi atau arus kas yang lebih kecil.'); return;
      }

      let barisTabel = '';
      let kumulatif = -inv;
      for (let t = 0; t < arusKas.length; t++) {
        const faktor = 1 / Math.pow(1 + r, t + 1);
        const nilaiKini = arusKas[t] * faktor;
        kumulatif += arusKas[t];
        barisTabel += '<tr><td>Tahun ' + (t + 1) + '</td><td style="text-align:right">' + T.rp(arusKas[t]) + '</td>' +
          '<td style="text-align:right">' + faktor.toFixed(4).replace('.', ',') + '</td>' +
          '<td style="text-align:right">' + T.rp(nilaiKini) + '</td>' +
          '<td style="text-align:right">' + T.rp(kumulatif) + '</td></tr>';
      }

      const terima = npv > 0;
      const vonis = npv > 0
        ? 'Layak dipertimbangkan — nilai proyek ini lebih besar dari modalnya setelah didiskonto.'
        : npv === 0
          ? 'Impas — proyek ini pas balik modal, tidak untung tidak rugi setelah didiskonto.'
          : 'Sebaiknya ditolak — nilai proyek ini lebih kecil dari modalnya setelah didiskonto.';
      T.show(box,
        '<div class="big center">' + T.rp(npv) + '</div>' +
        '<p class="center">nilai bersih sekarang (NPV)</p>' +
        kv('IRR (tingkat balik modal)', irr == null ? 'tidak ketemu — arus kas tidak pernah balik modal' : fmtPersen(irr) + (irr > r ? ' (di atas diskonto ' + fmtPersen(r, 0) + ')' : ' (di bawah diskonto ' + fmtPersen(r, 0) + ')')) +
        kv('Payback period', pb == null ? 'tidak tercapai dalam ' + arusKas.length + ' tahun' : fmtTahun(pb) + ' (' + String(pb.toFixed(1)).replace('.', ',') + ' tahun)') +
        kv('Total uang masuk', T.rp(arusKas.reduce((a, b) => a + b, 0))) +
        '<table class="tbl" style="margin-top:10px"><thead><tr><th>Tahun</th><th style="text-align:right">Arus kas</th><th style="text-align:right">Faktor diskon</th><th style="text-align:right">Nilai sekarang</th><th style="text-align:right">Kumulatif</th></tr></thead><tbody>' + barisTabel + '</tbody></table>' +
        '<p class="' + (terima ? 'info' : 'err') + '">' + vonis + '</p>' +
        '<p class="hint">Asumsi yang dipakai: tingkat diskonto ' + fmtPersen(r, 0) + ' per tahun, arus kas masuk di akhir tiap tahun, dan semua angka dalam rupiah. ' +
        'NPV positif artinya proyek menghasilkan lebih dari sekadar menaruh uang di tempat lain dengan tingkat diskonto yang sama. ' +
        'Ini hitungan bantu putuskan, bukan jaminan hasil — arus kas nyata bisa beda.</p>');
    };

    root.appendChild(T.el('<p class="note">Mau buka cabang atau beli mesin? Jangan cuma lihat total untungnya — uang tahun depan nilainya lebih kecil dari uang hari ini. Tool ini menghitung NPV, IRR, dan kapan modal balik.</p>'));
    root.appendChild(T.field('Investasi awal (Rp)', invI, 'Modal yang dikeluarkan di awal, sekali saja.'));
    root.appendChild(T.field('Tingkat diskonto (% per tahun)', diskI, 'Perkiraan hasil kalau uangnya ditaruh di tempat lain (mis. deposito/bunga). Default 10%.'));
    root.appendChild(T.field('Arus kas bersih per tahun (Rp)', cfI, 'Satu baris untuk satu tahun, urut dari tahun ke-1. Boleh negatif kalau tahun itu rugi.'));
    root.appendChild(T.row(T.btn('Hitung NPV & IRR', hitung, true)));
    root.appendChild(box);

}
