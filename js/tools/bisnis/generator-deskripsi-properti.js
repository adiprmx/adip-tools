import { h as T, utils, kv } from '../../core.js';

// Generator deskripsi listing properti dari detail yang diisi user.
// Tiga varian: singkat (satu paragraf), lengkap (rincian + fitur),
// iklan (gaya pasang iklan, kalimat pendek). Semua kalimat disusun dari
// data yang diisi, tanpa klaim yang tidak berasal dari formulir.
function fmtRp(n) {
  const v = Math.round(Number(n) || 0);
  return 'Rp' + v.toLocaleString('id-ID');
}
function kalimatFitur(fitur) {
  const daftar = String(fitur || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  return daftar;
}
export function buatDeskripsiProperti(d) {
  const jenis = (d.jenis || 'Rumah').trim();
  const lokasi = (d.lokasi || '').trim();
  const lt = Number(d.luasTanah) || 0;
  const lb = Number(d.luasBangunan) || 0;
  const kt = Number(d.kamarTidur) || 0;
  const km = Number(d.kamarMandi) || 0;
  const harga = Number(d.harga) || 0;
  const status = (d.status || 'Dijual').trim();
  const fitur = kalimatFitur(d.fitur);
  const unggul = (d.keunggulan || '').trim();
  const lokasiTeks = lokasi ? ' di ' + lokasi : '';
  const rincian = [];
  if (lt > 0) rincian.push('luas tanah ' + lt + ' m2');
  if (lb > 0) rincian.push('luas bangunan ' + lb + ' m2');
  if (kt > 0) rincian.push(kt + ' kamar tidur');
  if (km > 0) rincian.push(km + ' kamar mandi');
  const rincianTeks = rincian.length ? rincian.join(', ') : '';
  const hargaTeks = harga > 0 ? fmtRp(harga) : '';
  const fiturTeks = fitur.length ? ' Dilengkapi ' + fitur.join(', ') + '.' : '';
  const unggulTeks = unggul ? ' ' + unggul : '';

  const singkat = jenis + ' ' + status.toLowerCase() + lokasiTeks +
    (rincianTeks ? ' dengan ' + rincianTeks : '') + '.' +
    (hargaTeks ? ' Harga ' + hargaTeks + '.' : '') + fiturTeks + unggulTeks;

  const lengkap = jenis.toUpperCase() + ' ' + status.toUpperCase() + (lokasi ? ' DI ' + lokasi.toUpperCase() : '') + '\n\n' +
    singkat + '\n\n' +
    'Rincian:\n' +
    (rincian.length ? rincian.map((r) => '- ' + r.charAt(0).toUpperCase() + r.slice(1)).join('\n') : '- (isi rincian di formulir)') + '\n' +
    (hargaTeks ? '- Harga: ' + hargaTeks + '\n' : '') +
    (fitur.length ? '\nFasilitas:\n' + fitur.map((f) => '- ' + f).join('\n') : '') +
    (unggul ? '\n\n' + unggul : '');

  const iklan = (jenis + ' ' + status.toLowerCase() + lokasiTeks + '!').toUpperCase() + '\n' +
    (rincianTeks ? rincianTeks.charAt(0).toUpperCase() + rincianTeks.slice(1) + '.' : '') +
    (hargaTeks ? ' Hanya ' + hargaTeks + '.' : '') +
    (fitur.length ? ' Fasilitas: ' + fitur.join(', ') + '.' : '') +
    (unggul ? ' ' + unggul : '');

  return { singkat, lengkap, iklan };
}
utils.deskripsiProperti = buatDeskripsiProperti;

export const meta = {"id": "generator-deskripsi-properti", "name": "Generator Deskripsi Properti", "cat": "bisnis", "icon": "🏡", "desc": "Ubah detail rumah atau tanahmu jadi deskripsi listing yang siap dipasang.", "keywords": "properti,deskripsi,listing,rumah,tanah,jual,sewa,iklan,ruko,apartemen", "since": "6.18.0"};
export function render(root) {
  const jenisSel = T.select([['Rumah', 'Rumah'], ['Apartemen', 'Apartemen'], ['Tanah', 'Tanah'], ['Ruko', 'Ruko / Rukan'], ['Kos', 'Kos / Kontrakan']], 'Rumah');
  const statusSel = T.select([['Dijual', 'Dijual'], ['Disewakan', 'Disewakan']], 'Dijual');
  const lokasiI = T.input('text', 'cth: Depok, Jawa Barat', '');
  const ltI = T.input('text', 'cth: 120', ''); ltI.inputMode = 'decimal';
  const lbI = T.input('text', 'cth: 90', ''); lbI.inputMode = 'decimal';
  const ktI = T.input('text', 'cth: 3', ''); ktI.inputMode = 'numeric';
  const kmI = T.input('text', 'cth: 2', ''); kmI.inputMode = 'numeric';
  const hargaI = T.input('text', 'cth: 850000000', ''); hargaI.inputMode = 'decimal';
  const fiturI = T.ta(2, 'cth: garasi, taman, air sumur, dekat stasiun (pisahkan dengan koma)');
  const unggulI = T.ta(2, 'cth: Lingkungan tenang, bebas banjir, 5 menit ke stasiun.');
  const box = T.out();
  let teksGabung = '';

  const buat = () => {
    if (!lokasiI.value.trim() && !T.num(ltI.value) && !T.num(lbI.value) && !T.num(hargaI.value)) {
      T.show(box, '<div class="err">Isi dulu minimal lokasi, luas, atau harga propertinya.</div>');
      return;
    }
    const r = buatDeskripsiProperti({
      jenis: jenisSel.value, status: statusSel.value, lokasi: lokasiI.value,
      luasTanah: T.num(ltI.value), luasBangunan: T.num(lbI.value),
      kamarTidur: T.num(ktI.value), kamarMandi: T.num(kmI.value),
      harga: T.num(hargaI.value), fitur: fiturI.value, keunggulan: unggulI.value,
    });
    teksGabung = 'VARIAN SINGKAT\n' + r.singkat + '\n\nVARIAN LENGKAP\n' + r.lengkap + '\n\nVARIAN IKLAN\n' + r.iklan;
    const pre = (t) => '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.6;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-top:8px">' + T.esc(t) + '</pre>';
    T.show(box,
      '<div class="big">3 varian siap</div>' +
      '<p class="center mut">Pilih yang paling cocok, lalu salin.</p>' +
      kv('Jenis', T.esc(jenisSel.value) + ' ' + T.esc(statusSel.value.toLowerCase())) +
      (T.num(hargaI.value) > 0 ? kv('Harga', T.rp(T.num(hargaI.value))) : '') +
      '<p style="font-weight:600;margin:14px 0 0">Varian singkat</p>' + pre(r.singkat) +
      '<p style="font-weight:600;margin:14px 0 0">Varian lengkap</p>' + pre(r.lengkap) +
      '<p style="font-weight:600;margin:14px 0 0">Varian iklan</p>' + pre(r.iklan) +
      '<p class="hint">Deskripsi di atas disusun dari yang kamu isi. Cek lagi angkanya sebelum dipasang, dan tambahkan foto asli properti supaya calon pembeli percaya.</p>');
    box.appendChild(T.copyBtn(() => teksGabung, 'Salin semua varian'));
    box.appendChild(T.dlBtn('deskripsi-properti.txt', () => teksGabung, 'text/plain;charset=utf-8', 'Unduh (.txt)'));
  };

  root.appendChild(T.el('<p class="note">Isi detail propertinya, alat ini menyusun tiga varian deskripsi: singkat, lengkap, dan gaya iklan. Tinggal salin dan pasang di marketplace properti.</p>'));
  root.appendChild(T.grid2(
    T.field('Jenis properti', jenisSel),
    T.field('Status', statusSel)
  ));
  root.appendChild(T.field('Lokasi', lokasiI, 'Kota atau area, contoh: Depok, Jawa Barat'));
  root.appendChild(T.grid2(
    T.field('Luas tanah (m2)', ltI),
    T.field('Luas bangunan (m2)', lbI)
  ));
  root.appendChild(T.grid2(
    T.field('Kamar tidur', ktI),
    T.field('Kamar mandi', kmI)
  ));
  root.appendChild(T.field('Harga (Rp)', hargaI, 'Harga jual, atau harga sewa per tahun/bulan'));
  root.appendChild(T.field('Fasilitas', fiturI, 'Pisahkan dengan koma'));
  root.appendChild(T.field('Keunggulan lain', unggulI, 'Hal yang membuat properti ini beda'));
  root.appendChild(T.row(T.btn('Buat deskripsi', buat, true)));
  root.appendChild(box);
}
