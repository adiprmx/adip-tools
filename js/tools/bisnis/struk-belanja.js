import { h as T, kv, dlNodePng, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"struk-belanja","name":"Struk Belanja","cat":"bisnis","icon":"🧾","desc":"Bikin struk belanja untuk toko sendiri, siap dibagikan sebagai gambar.","keywords":"struk,belanja,toko,nota,receipt,kasir","since":"6.11.0"};

/* Struk belanja untuk usaha sendiri. BUKAN bukti transfer: tidak ada logo
   bank/e-wallet, nomor rekening, atau format bukti transfer. Pratinjau
   struk thermal, unduh PNG via dlNodePng (html2canvas, sudah dipakai repo). */
const dash = '<div style="border-top:1px dashed #999;margin:8px 0"></div>';
const rupiah = (n) => 'Rp' + T.fmt(Math.round(n || 0));

export function render(root) {
  const tokoInp = T.input('text', 'cth: Toko Berkah Jaya', '');
  const alamatInp = T.input('text', 'Alamat atau nomor HP toko (boleh kosong)', '');
  const bayarSel = T.select([['Tunai', 'Tunai'], ['QRIS', 'QRIS'], ['Debit', 'Kartu debit'], ['Lainnya', 'Lainnya']], 'Tunai');
  const diskonInp = T.input('text', '0', '');
  diskonInp.inputMode = 'decimal';
  const uangInp = T.input('text', 'cth: 100000 (boleh kosong)', '');
  uangInp.inputMode = 'decimal';
  const kakiInp = T.input('text', 'Terima kasih sudah belanja', 'Terima kasih sudah belanja');
  const box = T.out();
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');

  const itemsWrap = T.el('<div style="display:grid;gap:10px;margin:4px 0 10px"></div>');
  const items = [];
  const MAX_ITEM = 20;

  function addItem(nama, qty, harga) {
    if (items.length >= MAX_ITEM) { T.toast('Maksimal ' + MAX_ITEM + ' barang per struk'); return; }
    const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px"></div>');
    const namaI = T.input('text', 'Nama barang', nama || '');
    const qtyI = T.input('text', '1', qty || '1');
    qtyI.inputMode = 'decimal';
    const hargaI = T.input('text', 'Harga satuan (Rp)', harga || '');
    hargaI.inputMode = 'decimal';
    const head = T.el('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:13px">Barang ' + (items.length + 1) + '</b></div>');
    const del = T.btn('Hapus', () => {
      const i = items.findIndex((it) => it.card === card);
      if (i >= 0) items.splice(i, 1);
      card.remove();
      renumber();
      buat();
    });
    del.classList.add('small');
    head.appendChild(del);
    card.appendChild(head);
    card.appendChild(T.field('Nama barang', namaI));
    card.appendChild(T.grid2(T.field('Jumlah', qtyI), T.field('Harga satuan (Rp)', hargaI)));
    itemsWrap.appendChild(card);
    items.push({ card, namaI, qtyI, hargaI });
    [namaI, qtyI, hargaI].forEach((el) => el.addEventListener('input', buat));
  }
  function renumber() {
    items.forEach((it, i) => { it.card.querySelector('b').textContent = 'Barang ' + (i + 1); });
  }

  const collect = () => items.map((it) => {
    const qty = T.num(it.qtyI.value);
    const harga = T.num(it.hargaI.value);
    return { nama: it.namaI.value.trim(), qty: isFinite(qty) ? qty : NaN, harga: isFinite(harga) ? harga : NaN };
  }).filter((it) => it.nama && isFinite(it.qty) && it.qty > 0 && isFinite(it.harga) && it.harga >= 0);

  let teksStruk = '';
  const buat = () => {
    const list = collect();
    if (!list.length) {
      prevWrap.hidden = true;
      T.show(box, '<p class="hint">Isi minimal 1 barang dengan nama, jumlah, dan harga supaya struk bisa dibuat.</p>');
      return;
    }
    const toko = tokoInp.value.trim() || 'TOKO SAYA';
    const now = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const tgl = p2(now.getDate()) + '/' + p2(now.getMonth() + 1) + '/' + now.getFullYear() + ' ' + p2(now.getHours()) + ':' + p2(now.getMinutes());
    const nomor = now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate()) + '-' + p2(now.getHours()) + p2(now.getMinutes()) + p2(now.getSeconds());
    const subtotal = list.reduce((a, it) => a + it.qty * it.harga, 0);
    const diskon = Math.max(0, Math.min(subtotal, T.num(diskonInp.value) || 0));
    const total = subtotal - diskon;
    const uang = T.num(uangInp.value);
    const kembali = isFinite(uang) && uang >= total ? uang - total : null;

    let baris = '';
    let barisTeks = '';
    list.forEach((it) => {
      const sub = it.qty * it.harga;
      baris += '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + T.esc(it.nama) + '</span><span>' + rupiah(sub) + '</span></div>' +
        '<div style="color:#555;font-size:12px">' + it.qty + ' x ' + rupiah(it.harga) + '</div>';
      barisTeks += it.nama + '\n  ' + it.qty + ' x ' + rupiah(it.harga) + ' = ' + rupiah(sub) + '\n';
    });
    const totalRow = (label, val, bold) => '<div style="display:flex;justify-content:space-between;gap:8px' + (bold ? ';font-weight:700;font-size:15px' : '') + '"><span>' + label + '</span><span>' + val + '</span></div>';
    teksStruk = toko + '\n' + (alamatInp.value.trim() ? alamatInp.value.trim() + '\n' : '') +
      'No: ' + nomor + '\n' + tgl + '\n' +
      '--------------------------------\n' + barisTeks +
      '--------------------------------\n' +
      'Subtotal: ' + rupiah(subtotal) + '\n' +
      (diskon ? 'Diskon: -' + rupiah(diskon) + '\n' : '') +
      'TOTAL: ' + rupiah(total) + '\n' +
      'Bayar (' + bayarSel.value + '): ' + (isFinite(uang) && uang > 0 ? rupiah(uang) : '-') + '\n' +
      (kembali != null ? 'Kembali: ' + rupiah(kembali) + '\n' : '') +
      '--------------------------------\n' + (kakiInp.value.trim() || 'Terima kasih sudah belanja');

    prevWrap.hidden = false;
    prevWrap.innerHTML = '';
    const struk = T.el('<div id="struk-belanja" style="background:#ffffff;color:#111111;border-radius:8px;padding:20px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.6;max-width:320px;margin:0 auto"></div>');
    struk.innerHTML =
      '<div style="text-align:center;font-weight:700;font-size:16px">' + T.esc(toko) + '</div>' +
      (alamatInp.value.trim() ? '<div style="text-align:center;font-size:12px;color:#555">' + T.esc(alamatInp.value.trim()) + '</div>' : '') +
      '<div style="text-align:center;font-size:12px;color:#555">No: ' + nomor + '<br>' + tgl + '</div>' +
      dash + baris + dash +
      totalRow('Subtotal', rupiah(subtotal)) +
      (diskon ? totalRow('Diskon', '-' + rupiah(diskon)) : '') +
      totalRow('TOTAL', rupiah(total), true) +
      totalRow('Bayar (' + T.esc(bayarSel.value) + ')', isFinite(uang) && uang > 0 ? rupiah(uang) : '-') +
      (kembali != null ? totalRow('Kembali', rupiah(kembali)) : '') +
      dash +
      '<div style="text-align:center;font-size:12px">' + T.esc(kakiInp.value.trim() || 'Terima kasih sudah belanja') + '</div>';
    prevWrap.appendChild(struk);
    T.show(box, kv('Barang', list.length + ' barang') + kv('Total', rupiah(total)));
    box.appendChild(T.row(
      T.btn('Unduh PNG', () => dlNodePng(struk, 'struk-' + nomor + '.png'), true),
      T.copyBtn(() => teksStruk, 'Salin teks struk')
    ));
  };

  const bTambah = T.btn('+ Tambah barang', () => addItem('', '', ''));
  const bContoh = T.btn('Isi contoh', () => {
    items.splice(0).forEach(() => {});
    itemsWrap.innerHTML = ''; items.length = 0;
    tokoInp.value = 'Toko Berkah Jaya';
    alamatInp.value = 'Jl. Merdeka No. 12, Depok';
    addItem('Kopi susu gula aren', '2', '18000');
    addItem('Roti bakar cokelat', '1', '15000');
    addItem('Air mineral 600ml', '3', '5000');
    buat();
  });

  [tokoInp, alamatInp, diskonInp, uangInp, kakiInp].forEach((el) => el.addEventListener('input', buat));
  bayarSel.addEventListener('change', buat);

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Struk ini untuk usaha sendiri sebagai catatan belanja pelanggan. Bukan bukti transfer bank atau e-wallet: tidak ada logo bank, nomor rekening, atau format bukti transfer di sini.</p>'));
  root.appendChild(T.field('Nama toko', tokoInp));
  root.appendChild(T.field('Alamat atau nomor HP toko (boleh kosong)', alamatInp));
  root.appendChild(T.el('<div class="hint" style="margin:10px 0 4px">Barang:</div>'));
  root.appendChild(itemsWrap);
  root.appendChild(T.row(bTambah, bContoh));
  root.appendChild(T.grid2(T.field('Cara bayar', bayarSel), T.field('Diskon (Rp, boleh kosong)', diskonInp)));
  root.appendChild(T.grid2(T.field('Uang dibayar (Rp, boleh kosong)', uangInp, 'Diisi bila mau menampilkan kembalian.'), T.field('Pesan di bawah struk', kakiInp)));
  root.appendChild(T.row(T.btn('Buat struk', buat, true)));
  root.appendChild(prevWrap);
  root.appendChild(box);
  addItem('', '', '');
  addItem('', '', '');
}
