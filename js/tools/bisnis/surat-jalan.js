import { h as T, utils, kv, dlNodePng } from '../../core.js';

export const meta = {"id": "surat-jalan", "name": "Pembuat Surat Jalan", "cat": "bisnis", "icon": "🚚", "desc": "Bikin surat jalan pengiriman barang untuk UMKM: pengirim, penerima, daftar barang, tanda tangan, siap cetak.", "keywords": "surat jalan,pengiriman,barang,umkm,ekspedisi,tanda terima,cetak", "since": "6.13.0"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
// CSS cetak kanonis: utils.ensurePrintCss / utils.removePrintCss (core.js).

// tglIndo kanonis tinggal di utils (core.js).
function hariIniISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function render(root) {
  utils.ensurePrintCss('sjalan-print', { page: '@page{size:A4;margin:16mm 18mm}', extra: '#sjalan-print .sj-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' });
  T.onLeave(() => utils.removePrintCss('sjalan-print'));

  const noI = T.input('text', 'cth: SJ-001/XI/2026 (boleh dikosongkan)', '');
  const tglI = T.input('date', '', hariIniISO());
  const dariNamaI = T.input('text', 'Nama usaha / nama pengirim', '');
  const dariAlamatI = T.input('text', 'Alamat pengirim', '');
  const dariTelpI = T.input('text', 'No. HP pengirim (opsional)', '');
  const keNamaI = T.input('text', 'Nama penerima / toko tujuan', '');
  const keAlamatI = T.input('text', 'Alamat penerima', '');
  const keTelpI = T.input('text', 'No. HP penerima (opsional)', '');
  const ekspedisiI = T.input('text', 'cth: JNE, GoSend, antar sendiri (opsional)', '');
  const nopolI = T.input('text', 'cth: B 1234 ABC (opsional)', '');
  const catatanI = T.ta(2, 'Catatan tambahan, cth: barang mudah pecah (opsional)', '');
  const serahI = T.input('text', 'Nama yang menyerahkan barang', '');
  const terimaI = T.input('text', 'Nama yang menerima barang', '');
  const itemsBox = T.out();
  const box = T.out();
  let teksSurat = '';

  let items = [{ nama: '', qty: '', satuan: '', ket: '' }];

  const renderItems = () => {
    T.show(itemsBox,
      items.map((r, i) =>
        '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">' +
        '<input class="inp" data-k="nama" data-i="' + i + '" placeholder="Nama barang" value="' + T.esc(r.nama) + '" style="flex:3;min-width:140px" aria-label="Nama barang ' + (i + 1) + '"/>' +
        '<input class="inp" data-k="qty" data-i="' + i + '" placeholder="Jumlah" value="' + T.esc(r.qty) + '" inputmode="decimal" style="flex:1;min-width:70px" aria-label="Jumlah barang ' + (i + 1) + '"/>' +
        '<input class="inp" data-k="satuan" data-i="' + i + '" placeholder="Satuan (pcs, dus, kg)" value="' + T.esc(r.satuan) + '" style="flex:1;min-width:80px" aria-label="Satuan barang ' + (i + 1) + '"/>' +
        '<input class="inp" data-k="ket" data-i="' + i + '" placeholder="Keterangan (opsional)" value="' + T.esc(r.ket) + '" style="flex:2;min-width:110px" aria-label="Keterangan barang ' + (i + 1) + '"/>' +
        (items.length > 1 ? '<button type="button" class="btn" data-del="' + i + '" aria-label="Hapus barang ' + (i + 1) + '" style="flex-shrink:0">✕</button>' : '') +
        '</div>').join('') +
      '<button type="button" class="btn" data-add="1">＋ Tambah barang</button>');
    itemsBox.querySelectorAll('input[data-k]').forEach((el) => {
      el.addEventListener('input', () => { items[Number(el.dataset.i)][el.dataset.k] = el.value; });
    });
    itemsBox.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ nama: '', qty: '', satuan: '', ket: '' });
      renderItems();
    });
    itemsBox.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', () => {
        items.splice(Number(b.dataset.del), 1);
        renderItems();
      });
    });
  };

  const buat = () => {
    const dariNama = dariNamaI.value.trim();
    const dariAlamat = dariAlamatI.value.trim();
    const keNama = keNamaI.value.trim();
    const keAlamat = keAlamatI.value.trim();
    const serah = serahI.value.trim();
    const terima = terimaI.value.trim();
    const barang = items.filter((r) => String(r.nama).trim());
    if (!dariNama || !dariAlamat || !keNama || !keAlamat || !serah || !terima) {
      T.toast('Isi dulu: pengirim, penerima, dan nama yang menyerahkan & menerima.');
      return;
    }
    if (!barang.length) {
      T.toast('Isi dulu minimal satu barang yang dikirim.');
      return;
    }
    const nomor = noI.value.trim();
    const tgl = utils.tglIndo(tglI.value);
    const dariTelp = dariTelpI.value.trim();
    const keTelp = keTelpI.value.trim();
    const ekspedisi = ekspedisiI.value.trim();
    const nopol = nopolI.value.trim();
    const catatan = catatanI.value.trim();

    const barisTeks = barang.map((r, i) => {
      const q = String(r.qty).trim();
      const s = String(r.satuan).trim();
      const k = String(r.ket).trim();
      return (i + 1) + '. ' + r.nama.trim() + (q ? ' — ' + q + (s ? ' ' + s : '') : '') + (k ? ' (' + k + ')' : '');
    }).join('\n');

    teksSurat =
      'SURAT JALAN' + (nomor ? '\nNo: ' + nomor : '') + '\nTanggal: ' + tgl + '\n\n' +
      'Dari:\n' + dariNama + '\n' + dariAlamat + (dariTelp ? '\nTelp: ' + dariTelp : '') + '\n\n' +
      'Kepada:\n' + keNama + '\n' + keAlamat + (keTelp ? '\nTelp: ' + keTelp : '') + '\n\n' +
      'Barang yang dikirim:\n' + barisTeks + '\n' +
      (ekspedisi ? '\nEkspedisi: ' + ekspedisi : '') +
      (nopol ? '\nNo. kendaraan: ' + nopol : '') +
      (catatan ? '\nCatatan: ' + catatan : '') + '\n\n' +
      'Diserahkan oleh,\n\n\n( ' + serah + ' )\n\n' +
      'Diterima oleh,\n\n\n( ' + terima + ' )';

    const barisHtml = barang.map((r, i) => {
      const q = String(r.qty).trim();
      const s = String(r.satuan).trim();
      return '<tr><td style="border:1px solid #999;padding:8px;text-align:center">' + (i + 1) + '</td>' +
        '<td style="border:1px solid #999;padding:8px">' + T.esc(r.nama.trim()) + '</td>' +
        '<td style="border:1px solid #999;padding:8px;text-align:center">' + T.esc(q || '-') + '</td>' +
        '<td style="border:1px solid #999;padding:8px;text-align:center">' + T.esc(s || '-') + '</td>' +
        '<td style="border:1px solid #999;padding:8px">' + T.esc(String(r.ket).trim() || '-') + '</td></tr>';
    }).join('');

    const html =
      '<div id="sjalan-print"><div class="sj-page" style="background:#fff;color:#111;border:2px solid #111;border-radius:10px;padding:24px 22px;font-family:Georgia,serif;line-height:1.6">' +
      '<div style="text-align:center"><div style="font-size:22px;font-weight:bold;letter-spacing:3px">SURAT JALAN</div>' +
      (nomor ? '<div style="font-size:13px">No. ' + T.esc(nomor) + '</div>' : '') +
      '<div style="font-size:13px">Tanggal: ' + T.esc(tgl) + '</div></div>' +
      '<hr style="border:none;border-top:1px solid #111;margin:14px 0">' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:14px">' +
      '<div style="flex:1;min-width:200px"><b>Dari:</b><br>' + T.esc(dariNama) + '<br>' + T.esc(dariAlamat) + (dariTelp ? '<br>Telp: ' + T.esc(dariTelp) : '') + '</div>' +
      '<div style="flex:1;min-width:200px"><b>Kepada:</b><br>' + T.esc(keNama) + '<br>' + T.esc(keAlamat) + (keTelp ? '<br>Telp: ' + T.esc(keTelp) : '') + '</div>' +
      '</div>' +
      // Tabel dibungkus scroller + min-width 420px (P1-2): tanpa ini kolom
      // diremuk di HP sampai teks jadi vertikal per huruf.
      '<div style="overflow-x:auto;margin-top:16px"><table style="width:100%;min-width:420px;border-collapse:collapse;font-size:14px">' +
      '<tr><th style="border:1px solid #999;padding:8px;width:36px">No</th><th style="border:1px solid #999;padding:8px;white-space:nowrap">Nama barang</th><th style="border:1px solid #999;padding:8px;width:70px">Jumlah</th><th style="border:1px solid #999;padding:8px;width:70px">Satuan</th><th style="border:1px solid #999;padding:8px;white-space:nowrap">Keterangan</th></tr>' +
      barisHtml + '</table></div>' +
      ((ekspedisi || nopol || catatan) ? '<div style="font-size:14px;margin-top:14px">' +
        (ekspedisi ? '<div>Ekspedisi: <b>' + T.esc(ekspedisi) + '</b></div>' : '') +
        (nopol ? '<div>No. kendaraan: <b>' + T.esc(nopol) + '</b></div>' : '') +
        (catatan ? '<div>Catatan: ' + T.esc(catatan) + '</div>' : '') + '</div>' : '') +
      '<div style="display:flex;justify-content:space-between;gap:16px;margin-top:28px;font-size:14px;flex-wrap:wrap">' +
      '<div style="text-align:center">Diserahkan oleh,<br><br><br><br><b>( ' + T.esc(serah) + ' )</b></div>' +
      '<div style="text-align:center">Diterima oleh,<br><br><br><br><b>( ' + T.esc(terima) + ' )</b></div>' +
      '</div></div></div>';

    T.show(box, html +
      '<div class="row" style="margin-top:12px">' +
      '<button type="button" class="btn primary" data-aksi="cetak">Cetak</button>' +
      '<button type="button" class="btn" data-aksi="salin">Salin Teks</button>' +
      '<button type="button" class="btn" data-aksi="png">Unduh PNG</button>' +
      '</div>' +
      '<p class="hint">Tombol Cetak membuka dialog cetak browser — pilih "Simpan sebagai PDF" bila mau versi PDF.</p>');
    box.querySelector('[data-aksi="cetak"]').addEventListener('click', () => window.print());
    box.querySelector('[data-aksi="salin"]').addEventListener('click', () => T.copy(teksSurat));
    box.querySelector('[data-aksi="png"]').addEventListener('click', () => {
      const node = box.querySelector('#sjalan-print');
      if (node) dlNodePng(node, 'surat-jalan.png');
    });
  };

  root.appendChild(T.el('<p class="note">Surat jalan rapi buat pengiriman barang: isi pengirim, penerima, dan daftar barangnya — langsung jadi, tinggal cetak atau bagikan.</p>'));
  root.appendChild(T.grid2(
    T.field('Nomor surat (opsional)', noI),
    T.field('Tanggal kirim', tglI)
  ));
  root.appendChild(T.field('Pengirim — nama usaha / nama', dariNamaI));
  root.appendChild(T.field('Pengirim — alamat', dariAlamatI));
  root.appendChild(T.field('Pengirim — no. HP (opsional)', dariTelpI));
  root.appendChild(T.field('Penerima — nama / toko tujuan', keNamaI));
  root.appendChild(T.field('Penerima — alamat', keAlamatI));
  root.appendChild(T.field('Penerima — no. HP (opsional)', keTelpI));
  root.appendChild(T.field('Daftar barang', itemsBox, 'Nama barang wajib diisi; jumlah, satuan, dan keterangan boleh dikosongkan.'));
  root.appendChild(T.grid2(
    T.field('Ekspedisi / kurir (opsional)', ekspedisiI),
    T.field('No. kendaraan (opsional)', nopolI)
  ));
  root.appendChild(T.field('Catatan (opsional)', catatanI));
  root.appendChild(T.grid2(
    T.field('Nama yang menyerahkan', serahI, 'Tanda tangan di surat.'),
    T.field('Nama yang menerima', terimaI, 'Tanda tangan di surat.')
  ));
  root.appendChild(T.row(T.btn('Buat Surat Jalan', buat, true)));
  root.appendChild(box);
  renderItems();
}
