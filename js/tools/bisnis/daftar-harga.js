import { h as T, utils, dlNodePng } from '../../core.js?v=6.12.0';

// Logika murni (bisa di-test di Node): daftar harga jadi teks rapi (untuk dibagikan).
utils.daftarHargaTeks = function (namaUsaha, daftar) {
  const garis = daftar.map((d) => '- ' + d.nama + ' : Rp' + d.harga.toLocaleString('id-ID'));
  return [namaUsaha || 'Daftar Harga', '', ...garis].join('\n');
};

export const meta = {"id": "daftar-harga", "name": "Pembuat Daftar Harga", "cat": "bisnis", "icon": "💲", "desc": "Susun daftar harga usahamu jadi kartu rapi siap dibagikan.", "keywords": "daftar harga,price list,usaha,jualan,menu,toko,warung", "since": "6.11.0"};

export function render(root) {
  const namaUsaha = T.input('text', 'Contoh: Warung Bu Sari', 'Daftar Harga');
  const catatan = T.input('text', 'Contoh: Harga sudah termasuk pajak', '');
  const namaItem = T.input('text', 'Nama layanan / barang', '');
  const hargaItem = T.input('text', 'Harga (Rp)', ''); hargaItem.inputMode = 'decimal';
  const box = T.out();
  const KUNCI = 'at-daftar-harga';
  let daftar = [];
  try { daftar = JSON.parse(localStorage.getItem(KUNCI) || '[]'); } catch (e) { daftar = []; }

  const kartu = T.el('<div style="background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:24px;margin:16px 0"></div>');

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(daftar)); } catch (e) { /* abaikan */ }
  }

  function tampilKartu() {
    if (daftar.length === 0) {
      kartu.innerHTML = '<div class="hint">Belum ada item. Tambahkan layanan atau barang di bawah.</div>';
      return;
    }
    const rows = daftar.map((d, i) =>
      `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #2a2a2a">` +
      `<span style="font-size:15px">${d.nama}</span>` +
      `<span style="display:flex;gap:8px;align-items:center"><b style="font-size:15px;white-space:nowrap">Rp${T.fmt(d.harga)}</b>` +
      `<button data-hapus="${i}" style="background:none;border:1px solid #3a3a3a;color:#a1a1aa;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:13px">Hapus</button></span></div>`
    ).join('');
    kartu.innerHTML =
      `<div style="text-align:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700">${namaUsaha.value.trim() || 'Daftar Harga'}</div>` +
      (catatan.value.trim() ? `<div style="font-size:13px;color:#a1a1aa;margin-top:4px">${catatan.value.trim()}</div>` : '') + `</div>` + rows;
    kartu.querySelectorAll('[data-hapus]').forEach((b) => {
      b.addEventListener('click', () => {
        daftar.splice(Number(b.dataset.hapus), 1);
        simpan();
        tampilKartu();
      });
    });
  }

  namaUsaha.addEventListener('input', tampilKartu);
  catatan.addEventListener('input', tampilKartu);

  root.appendChild(T.el('<p class="note">Susun daftar harga usahamu, lalu unduh sebagai gambar untuk dibagikan ke status atau grup pelanggan. Daftar tersimpan di HP ini.</p>'));
  root.appendChild(T.grid2(
    T.field('Nama usaha', namaUsaha),
    T.field('Catatan kecil (opsional)', catatan)
  ));
  root.appendChild(kartu);
  root.appendChild(T.el('<h3>Tambah item</h3>'));
  root.appendChild(T.grid2(
    T.field('Nama layanan / barang', namaItem),
    T.field('Harga (Rp)', hargaItem)
  ));
  root.appendChild(T.row(
    T.btn('Tambah item', () => {
      const nama = namaItem.value.trim();
      const harga = T.num(hargaItem.value);
      if (!nama) { T.toast('Isi dulu nama itemnya'); return; }
      if (!(harga > 0)) { T.toast('Isi harganya dengan angka'); return; }
      daftar.push({ nama, harga });
      simpan();
      namaItem.value = ''; hargaItem.value = '';
      tampilKartu();
    }, true),
    T.btn('Salin sebagai teks', () => {
      if (daftar.length === 0) { T.toast('Daftarnya masih kosong'); return; }
      T.copy(utils.daftarHargaTeks(namaUsaha.value.trim(), daftar));
      T.toast('Daftar harga disalin, siap ditempel ke chat');
    }),
    T.btn('Unduh sebagai gambar', async () => {
      if (daftar.length === 0) { T.toast('Daftarnya masih kosong'); return; }
      const ok = await dlNodePng(kartu, 'daftar-harga.png');
      T.toast(ok ? 'Gambar berhasil diunduh' : 'Gambarnya tidak bisa dibuat, coba salin sebagai teks');
    })
  ));
  root.appendChild(box);
  tampilKartu();
}
