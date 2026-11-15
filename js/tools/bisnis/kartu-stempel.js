import { h as T, utils, dlNodePng } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node).
utils.nomorSeri = function (awalan, mulai, jumlah) {
  const hasil = [];
  for (let i = 0; i < jumlah; i++) {
    hasil.push((awalan || '') + String(mulai + i).padStart(4, '0'));
  }
  return hasil;
};

export const meta = {"id": "kartu-stempel", "name": "Kartu Stempel Pelanggan", "cat": "bisnis", "icon": "🎫", "desc": "Buat kartu stempel loyalitas untuk pelangganmu.", "keywords": "kartu stempel,loyalty,member,pelanggan,warung,kopi,laundry", "since": "6.11.0"};

export function render(root) {
  const namaUsaha = T.input('text', 'Contoh: Kopi Sore', 'Kartu Stempel');
  const hadiah = T.input('text', 'Contoh: Beli 9 gratis 1', 'Beli 9 gratis 1');
  const jumlahKotak = T.select([['6', '6 kotak'], ['8', '8 kotak'], ['10', '10 kotak'], ['12', '12 kotak']], '10');
  const awalan = T.input('text', 'Contoh: KS-', 'KS-');
  const mulaiDari = T.input('text', 'Nomor awal', '1'); mulaiDari.inputMode = 'decimal';
  const jumlahKartu = T.select([['1', '1 kartu'], ['4', '4 kartu'], ['8', '8 kartu'], ['12', '12 kartu']], '4');
  const box = T.out();
  const wadah = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin:16px 0"></div>');

  function buatKartu(seri, nKotak) {
    const kotak = Array.from({ length: nKotak }, () => '<div style="width:34px;height:34px;border:2px dashed #a1a1aa;border-radius:50%"></div>').join('');
    return `<div style="background:#111;border:1px solid #2a2a2a;border-radius:14px;padding:18px">` +
      `<div style="display:flex;justify-content:space-between;align-items:baseline">` +
      `<b style="font-size:16px">${namaUsaha.value.trim() || 'Kartu Stempel'}</b>` +
      `<span style="font-size:12px;color:#a1a1aa">${seri}</span></div>` +
      `<div style="font-size:13px;color:#d4d4d4;margin:6px 0 14px">${hadiah.value.trim()}</div>` +
      `<div style="display:flex;flex-wrap:wrap;gap:8px">${kotak}</div>` +
      `<div style="font-size:11px;color:#a1a1aa;margin-top:14px">Nama pelanggan: ___________________</div></div>`;
  }

  function tampil() {
    const n = Number(jumlahKotak.value);
    const jml = Number(jumlahKartu.value);
    const seri = utils.nomorSeri(awalan.value.trim(), Math.max(1, Math.round(T.num(mulaiDari.value) || 1)), jml);
    wadah.innerHTML = seri.map((s) => buatKartu(s, n)).join('');
    T.show(box, '<div class="hint">Kartu siap. Cetak lewat tombol di bawah (gunakan ukuran A4, atau unduh sebagai gambar lalu cetak dari galeri).</div>');
  }

  root.appendChild(T.el('<p class="note">Buat kartu stempel untuk pelanggan setia: setiap pembelian dapat satu stempel, kartu penuh dapat hadiah. Nomor seri membantu membedakan tiap kartu.</p>'));
  root.appendChild(T.grid2(
    T.field('Nama usaha', namaUsaha),
    T.field('Hadiah kartu penuh', hadiah)
  ));
  root.appendChild(T.grid2(
    T.field('Jumlah kotak stempel', jumlahKotak),
    T.field('Jumlah kartu', jumlahKartu)
  ));
  root.appendChild(T.grid2(
    T.field('Awalan nomor seri', awalan),
    T.field('Nomor seri mulai dari', mulaiDari)
  ));
  root.appendChild(T.row(
    T.btn('Buat kartu', tampil, true),
    T.btn('Cetak', () => {
      if (!wadah.children.length) { T.toast('Buat dulu kartunya'); return; }
      window.print();
    }),
    T.btn('Unduh kartu pertama sebagai gambar', async () => {
      if (!wadah.children.length) { T.toast('Buat dulu kartunya'); return; }
      const ok = await dlNodePng(wadah.children[0], 'kartu-stempel.png');
      T.toast(ok ? 'Gambar berhasil diunduh' : 'Gagal membuat gambar');
    })
  ));
  root.appendChild(box);
  root.appendChild(wadah);
  tampil();
}
