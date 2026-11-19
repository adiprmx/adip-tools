import { h as T, utils, kv } from '../../core.js';

// Estimasi akselerasi dari tenaga dan berat kendaraan.
// 0-100 km/jam: rumus empiris t = 2,7 x akar(kg/hp). Quarter mile pakai
// rumus Hale: ET = 5,825 x (lb/hp)^(1/3), kecepatan akhir =
// 234 x (hp/lb)^(1/3) mph. Keduanya perkiraan kasar untuk kondisi ideal:
// traksi ban, girboks, aerodinamika, dan pengemudi tidak dihitung.
export function hitungAkselerasi(hp, kg) {
  const p = Number(hp);
  const m = Number(kg);
  if (![p, m].every(isFinite) || p <= 0 || m <= 0) return null;
  const lb = m * 2.20462;
  const nolSeratus = 2.7 * Math.sqrt(m / p);
  const quarterMile = 5.825 * Math.cbrt(lb / p);
  const trapMph = 234 * Math.cbrt(p / lb);
  const trapKmh = trapMph * 1.60934;
  if (![nolSeratus, quarterMile, trapKmh].every(isFinite)) return null;
  return {
    nolSeratus,
    quarterMile,
    trapKmh,
    rasioBobotTenaga: m / p,
  };
}
utils.akselerasi = hitungAkselerasi;

function fmtDetik(x) {
  return x.toFixed(2).replace('.', ',') + ' detik';
}

export const meta = {"id": "akselerasi-0-100-quarter-mile", "name": "Akselerasi 0–100 & Quarter Mile", "cat": "otomotif", "icon": "🏎️", "desc": "Perkiraan akselerasi mobil atau motormu dari tenaga mesin dan beratnya.", "keywords": "akselerasi,0-100,quarter mile,drag,tenaga,hp,berat,cepat,mobil,motor", "since": "6.18.0"};
export function render(root) {
  const hpI = T.input('text', 'cth: 150', ''); hpI.inputMode = 'decimal';
  const kgI = T.input('text', 'cth: 1200', ''); kgI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const hp = T.num(hpI.value);
    const kg = T.num(kgI.value);
    if (!isFinite(hp) || hp <= 0) {
      T.show(box, '<div class="err">Tenaga mesin harus diisi angka lebih dari 0 (dalam HP).</div>');
      return;
    }
    if (!isFinite(kg) || kg <= 0) {
      T.show(box, '<div class="err">Berat kendaraan harus diisi angka lebih dari 0 (dalam kg).</div>');
      return;
    }
    const r = hitungAkselerasi(hp, kg);
    if (!r) {
      T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>');
      return;
    }
    T.show(box,
      '<div class="big">' + fmtDetik(r.nolSeratus) + '</div>' +
      '<p class="center mut">Perkiraan 0 sampai 100 km/jam.</p>' +
      kv('Quarter mile (402 m)', fmtDetik(r.quarterMile)) +
      kv('Kecepatan akhir quarter mile', T.fmt(Math.round(r.trapKmh)) + ' km/jam') +
      kv('Rasio berat dan tenaga', r.rasioBobotTenaga.toFixed(1).replace('.', ',') + ' kg per HP') +
      '<p class="hint">Ini perkiraan kasar dari rumus empiris, untuk kondisi ideal. Traksi ban, girboks, aerodinamika, dan pengemudi tidak dihitung, jadi angka asli di jalan bisa beda. Berat yang dipakai sebaiknya berat kendaraan ditambah pengemudi dan bahan bakar.</p>');
  };

  root.appendChild(T.el('<p class="note">Seberapa cepat kendaraanmu? Masukkan tenaga mesin dan beratnya, dan lihat perkiraan waktu 0 sampai 100 km/jam serta waktu tempuh quarter mile (402 meter).</p>'));
  root.appendChild(T.field('Tenaga mesin (HP)', hpI, 'Lihat di brosur atau STNK, kadang tertulis dalam PS atau kW'));
  root.appendChild(T.field('Berat kendaraan (kg)', kgI, 'Berat kosong ditambah pengemudi dan bahan bakar'));
  root.appendChild(T.row(T.btn('Hitung akselerasi', hitung, true)));
  root.appendChild(box);
}
