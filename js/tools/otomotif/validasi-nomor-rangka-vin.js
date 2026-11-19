import { h as T, utils, kv } from '../../core.js';

// Validasi nomor rangka (VIN) 17 karakter, ISO 3779 / standar NHTSA.
// Digit cek ada di posisi ke-9: tiap karakter diubah ke angka (A=1, B=2,
// C=3, D=4, E=5, F=6, G=7, H=8, J=1, K=2, L=3, M=4, N=5, P=7, R=9, S=2,
// T=3, U=4, V=5, W=6, X=7, Y=8, Z=9), dikali bobot posisi
// (8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2), dijumlah, lalu sisa bagi 11.
// Sisa 10 ditulis 'X'. Huruf I, O, Q tidak pernah dipakai di VIN.
// Karakter ke-10 = tahun model (A=1980, B=1981, ..., Y=2000, 1=2001, ...,
// 9=2009, lalu berulang tiap 30 tahun: A=2010, dst). Karakter pertama =
// wilayah asal (1-5 Amerika Utara, J-R Asia, S-Z Eropa, 6-7 Oseania,
// 8-9 Amerika Selatan, A-H Afrika). VIN Eropa sering tidak memakai digit
// cek, jadi digit cek salah pada VIN Eropa belum tentu berarti VIN palsu.
const NILAI = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const BOBOT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const TAHUN = { A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987, J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000, 1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009 };
export function wilayahVin(c) {
  if (c >= '1' && c <= '5') return 'Amerika Utara';
  if (c >= '6' && c <= '7') return 'Oseania';
  if (c >= '8' && c <= '9') return 'Amerika Selatan';
  if (c >= 'A' && c <= 'H') return 'Afrika';
  if (c >= 'J' && c <= 'R') return 'Asia';
  if (c >= 'S' && c <= 'Z') return 'Eropa';
  return 'Tidak dikenal';
}
export function validasiVin(vinMentah) {
  const vin = String(vinMentah || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const panjangOk = vin.length === 17;
  const karakterOk = !/[IOQ]/.test(vin);
  let jumlah = 0;
  let digitHarapan = null;
  if (panjangOk && karakterOk) {
    for (let i = 0; i < 17; i++) {
      const c = vin[i];
      const n = /[0-9]/.test(c) ? Number(c) : NILAI[c];
      jumlah += n * BOBOT[i];
    }
    const sisa = jumlah % 11;
    digitHarapan = sisa === 10 ? 'X' : String(sisa);
  }
  const digitAktual = panjangOk ? vin[8] : null;
  const cekOk = digitHarapan != null && digitHarapan === digitAktual;
  const kodeTahun = panjangOk ? vin[9] : null;
  const tahunDasar = kodeTahun ? TAHUN[kodeTahun] : null;
  return {
    vin, panjangOk, karakterOk, digitHarapan, digitAktual, cekOk,
    valid: panjangOk && karakterOk && cekOk,
    tahun: tahunDasar != null ? [tahunDasar, tahunDasar + 30] : null,
    wilayah: panjangOk ? wilayahVin(vin[0]) : null,
    wmi: panjangOk ? vin.slice(0, 3) : null,
    vds: panjangOk ? vin.slice(3, 8) : null,
    pabrik: panjangOk ? vin[10] : null,
    seri: panjangOk ? vin.slice(11, 17) : null,
  };
}
utils.validasiVin = validasiVin;

export const meta = {"id": "validasi-nomor-rangka-vin", "name": "Validasi Nomor Rangka (VIN)", "cat": "otomotif", "icon": "🔢", "desc": "Cek nomor rangka 17 karakter: digit cek ISO 3779 benar atau tidak, plus tahun model dan wilayah asalnya.", "keywords": "vin,nomor rangka,chassis,check digit,iso 3779,tahun model,kendaraan,stnk", "since": "6.19.0"};
export function render(root) {
  const vinI = T.input('text', 'cth: 1HGCM82633A004352', '');
  vinI.style.textTransform = 'uppercase';
  const box = T.out();

  const hitung = () => {
    const mentah = vinI.value;
    if (!mentah.trim()) { T.hide(box); return; }
    const r = validasiVin(mentah);
    if (!r.panjangOk) {
      T.show(box, '<p class="mut center">Nomor rangka harus 17 karakter. Yang kamu masukkan baru ' + r.vin.length + ' karakter.</p>');
      return;
    }
    if (!r.karakterOk) {
      T.show(box, '<p class="mut center">Nomor rangka tidak pernah memakai huruf I, O, atau Q. Cek lagi penulisanmu.</p>');
      return;
    }
    const tahunTeks = r.tahun ? T.fmt(r.tahun[0]) + ' atau ' + T.fmt(r.tahun[1]) : 'tidak diketahui';
    T.show(box,
      '<div class="big">' + (r.valid ? '✓ VIN valid' : '✗ Digit cek tidak cocok') + '</div>' +
      '<p class="center mut">' + (r.valid ? 'Digit cek di posisi ke-9 cocok dengan hitungan ISO 3779.' : 'Digit cek seharusnya ' + r.digitHarapan + ', tapi di nomor ini ' + r.digitAktual + '.') + '</p>' +
      kv('Nomor rangka', T.esc(r.vin)) +
      kv('Digit cek (posisi 9)', T.esc(r.digitAktual) + ', seharusnya ' + r.digitHarapan) +
      kv('Tahun model (posisi 10)', tahunTeks) +
      kv('Wilayah asal (posisi 1)', T.esc(r.wilayah)) +
      kv('Kode pabrikan / WMI (1–3)', T.esc(r.wmi)) +
      kv('Kode model / VDS (4–8)', T.esc(r.vds)) +
      kv('Kode pabrik (posisi 11)', T.esc(r.pabrik)) +
      kv('Nomor seri (12–17)', T.esc(r.seri)) +
      '<p class="hint">Catatan: digit cek wajib di VIN Amerika Utara. VIN Eropa sering tidak memakai digit cek, jadi digit cek yang tidak cocok pada VIN Eropa belum tentu berarti nomornya palsu. Tahun model punya dua kemungkinan karena kodenya berulang tiap 30 tahun; pilih yang masuk akal dengan umur kendaraanmu.</p>');
  };
  vinI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Nomor rangka ada di STNK, BPKB, dan pelat di bodi kendaraan. Tempel 17 karakternya di sini untuk dicek keaslian digit ceknya.</p>'));
  root.appendChild(T.field('Nomor rangka (VIN)', vinI, '17 karakter huruf dan angka, tanpa spasi'));
  root.appendChild(box);
  hitung();
}
