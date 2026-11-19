import { h as T, utils } from '../../core.js';

// Generator siaran pers (press release) dari pengumuman yang diisi user.
// Susunan mengikuti format siaran pers umum: judul, dateline kota dan
// tanggal, paragraf pembuka (siapa, apa, kapan, di mana), kutipan, dan
// kontak media. Semua isi berasal dari formulir.
export function buatPressRelease(d) {
  const judul = (d.judul || '').trim() || '[Judul pengumuman]';
  const org = (d.organisasi || '').trim() || '[Nama organisasi]';
  const kota = (d.kota || '').trim() || '[Kota]';
  const tanggal = (d.tanggal || '').trim() || '[Tanggal]';
  const isi = (d.isi || '').trim() || '[Isi pengumuman]';
  const detail = (d.detail || '').trim();
  const kutipan = (d.kutipan || '').trim();
  const pengutip = (d.pengutip || '').trim();
  const kontak = (d.kontak || '').trim();
  const tentang = (d.tentang || '').trim();
  let teks = 'SIARAN PERS\nUNTUK SEGERA DITERBITKAN\n\n' +
    judul.toUpperCase() + '\n\n' +
    kota.toUpperCase() + ', ' + tanggal + ' ' + isi + '\n';
  if (detail) teks += '\n' + detail + '\n';
  if (kutipan) teks += '\n"' + kutipan + '"' + (pengutip ? ' kata ' + pengutip + '.' : '') + '\n';
  teks += '\nTentang ' + org + '\n' + (tentang || '[Tulis satu atau dua kalimat tentang organisasimu.]') + '\n';
  if (kontak) teks += '\nKontak media:\n' + kontak + '\n';
  teks += '\n###';
  return teks;
}
utils.pressRelease = buatPressRelease;

export const meta = {"id": "generator-press-release", "name": "Generator Press Release", "cat": "bisnis", "icon": "📰", "desc": "Susun siaran pers yang rapi dari pengumuman dan detail acaramu.", "keywords": "press release,siaran pers,pengumuman,media,berita,peluncuran,acara,publikasi", "since": "6.18.0"};
export function render(root) {
  const judulI = T.input('text', 'cth: Kopi Sore Buka Cabang Kedua di Depok', '');
  const orgI = T.input('text', 'cth: Kopi Sore', '');
  const kotaI = T.input('text', 'cth: Depok', '');
  const tglI = T.input('text', 'cth: 19 November 2026', '');
  const isiI = T.ta(3, 'cth: Kopi Sore membuka cabang keduanya di Jalan Margonda Raya, Depok, pada 1 Desember 2026. Cabang baru ini menampung 80 kursi dan membuka 12 lowongan kerja untuk warga sekitar.');
  const detailI = T.ta(3, 'Detail tambahan, bila ada. cth: Pembukaan ditandai dengan promo beli 1 gratis 1 selama tiga hari pertama.');
  const kutipI = T.ta(2, 'cth: Kami ingin jadi tempat nongkrong warga Depok yang ramah di kantong.');
  const pengutipI = T.input('text', 'cth: Andi Wijaya, pendiri Kopi Sore', '');
  const kontakI = T.ta(2, 'cth: Sari Dewi, 0812-3456-7890, halo@kopisore.id');
  const tentangI = T.ta(2, 'cth: Kopi Sore adalah kedai kopi lokal yang berdiri sejak 2022 dan kini punya dua cabang di Jabodetabek.');
  const box = T.out();
  let teksPr = '';

  const buat = () => {
    if (!judulI.value.trim() || !isiI.value.trim()) {
      T.show(box, '<div class="err">Isi dulu judul dan isi pengumumannya.</div>');
      return;
    }
    teksPr = buatPressRelease({
      judul: judulI.value, organisasi: orgI.value, kota: kotaI.value,
      tanggal: tglI.value, isi: isiI.value, detail: detailI.value,
      kutipan: kutipI.value, pengutip: pengutipI.value,
      kontak: kontakI.value, tentang: tentangI.value,
    });
    const kata = teksPr.split(/\s+/).filter(Boolean).length;
    T.show(box,
      '<div class="big">Siaran pers siap</div>' +
      '<p class="center mut">' + kata + ' kata, format siap kirim ke media.</p>' +
      '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.6;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-top:12px">' + T.esc(teksPr) + '</pre>' +
      '<p class="hint">Tanda ### di akhir menandakan siaran pers selesai, itu format umum yang dipakai media. Baca sekali lagi sebelum dikirim, dan pastikan tanggal dan kontaknya benar.</p>');
    box.appendChild(T.copyBtn(() => teksPr, 'Salin siaran pers'));
    box.appendChild(T.dlBtn('press-release.txt', () => teksPr, 'text/plain;charset=utf-8', 'Unduh (.txt)'));
  };

  root.appendChild(T.el('<p class="note">Siaran pers itu pengumuman resmi untuk media. Isi formulir ini, alat akan menyusunnya dengan format yang biasa dipakai jurnalis: judul, kota dan tanggal, isi, kutipan, dan kontak.</p>'));
  root.appendChild(T.field('Judul pengumuman', judulI));
  root.appendChild(T.grid2(
    T.field('Nama organisasi', orgI),
    T.field('Kota', kotaI)
  ));
  root.appendChild(T.field('Tanggal rilis', tglI));
  root.appendChild(T.field('Isi pengumuman', isiI, 'Siapa, apa, kapan, di mana, dan kenapa. Tulis yang paling penting dulu.'));
  root.appendChild(T.field('Detail tambahan (boleh kosong)', detailI));
  root.appendChild(T.field('Kutipan (boleh kosong)', kutipI, 'Satu kalimat dari pendiri atau juru bicara'));
  root.appendChild(T.field('Nama pengutip (boleh kosong)', pengutipI));
  root.appendChild(T.field('Tentang organisasi', tentangI, 'Satu atau dua kalimat'));
  root.appendChild(T.field('Kontak media', kontakI, 'Nama, nomor, dan email yang bisa dihubungi jurnalis'));
  root.appendChild(T.row(T.btn('Buat siaran pers', buat, true)));
  root.appendChild(box);
}
