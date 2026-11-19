import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "generator-file-acak", "name": "Generator File Acak", "cat": "converter", "icon": "🎲", "desc": "Buat file dummy ukuran tertentu untuk tes upload.", "keywords": "file acak,dummy,tes upload,ukuran file,random", "since": "6.19.0"};

export const MAKS_BYTE = 500 * 1024 * 1024;

// Nilai + satuan jadi jumlah byte. Fungsi murni, diuji di Node.
export function uraiUkuran(nilai, satuan) {
  const n = Number(nilai);
  if (!isFinite(n) || n <= 0) return 0;
  const pengali = satuan === 'GB' ? 1024 * 1024 * 1024 : satuan === 'MB' ? 1024 * 1024 : satuan === 'KB' ? 1024 : 1;
  return Math.floor(n * pengali);
}

export function render(root) {
  const nilaiIn = T.input('text', 'cth: 10', '10'); nilaiIn.inputMode = 'decimal';
  const satuanSel = T.select([['KB', 'KB'], ['MB', 'MB'], ['GB', 'GB']], 'MB');
  const isiSel = T.select([
    ['acak', 'Byte acak (paling mirip file asli)'],
    ['nol', 'Nol semua (file mudah dipadatkan)'],
    ['teks', 'Teks acak (bisa dibuka sebagai .txt)'],
  ], 'acak');
  const namaIn = T.input('text', 'cth: tes-upload', 'file-tes');
  const box = T.out();
  let busy = false;

  const buat = async () => {
    if (busy) return;
    const byte = uraiUkuran(utils.parseNum(nilaiIn.value, NaN), satuanSel.value);
    if (!byte) { T.show(box, errBox('Isi ukuran dengan angka lebih dari 0.')); return; }
    if (byte > MAKS_BYTE) { T.show(box, errBox('Maksimal 500 MB, supaya browser tidak kehabisan memori.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.show(box, '<span class="dim">Membuat file ' + fmtBytes(byte) + '…</span>');
    try {
      const POTONG = 4 * 1024 * 1024;
      const parts = [];
      let sisa = byte;
      const jenis = isiSel.value;
      while (sisa > 0) {
        const n = Math.min(POTONG, sisa);
        if (jenis === 'nol') {
          parts.push(new Uint8Array(n));
        } else if (jenis === 'teks') {
          const buf = new Uint8Array(n);
          const cryptoObj = window.crypto || window.msCrypto;
          cryptoObj.getRandomValues(buf);
          for (let i = 0; i < n; i++) buf[i] = 97 + (buf[i] % 26);
          parts.push(buf);
        } else {
          const buf = new Uint8Array(n);
          const cryptoObj = window.crypto || window.msCrypto;
          cryptoObj.getRandomValues(buf);
          parts.push(buf);
        }
        sisa -= n;
        if (sisa > 0) await new Promise((r) => setTimeout(r, 0));
      }
      const ext = jenis === 'teks' ? '.txt' : '.bin';
      const mime = jenis === 'teks' ? 'text/plain' : 'application/octet-stream';
      const nama = (namaIn.value.trim().replace(/[^\w\- ]+/g, '') || 'file-tes') + ext;
      const blob = new Blob(parts, { type: mime });
      T.dl(nama, blob, mime);
      T.show(box, '<span class="ok">Selesai. File terunduh.</span>' +
        kv('Nama file', T.esc(nama)) +
        kv('Ukuran', fmtBytes(blob.size) + ' (' + blob.size.toLocaleString('id-ID') + ' byte)') +
        kv('Isi', jenis === 'acak' ? 'Byte acak' : jenis === 'nol' ? 'Nol semua' : 'Huruf acak'));
      T.toast('File terunduh');
    } catch (e) {
      T.show(box, errBox('File tidak bisa dibuat. Coba ukuran yang lebih kecil.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  };

  const goBtn = T.btn('Buat file', buat, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Butuh file sekian MB buat ngetes upload atau kirim? Tentukan ukurannya, file dibuat di browser lalu terunduh. Isinya acak, tidak ada data pribadi di dalamnya.</p>'));
  root.appendChild(T.grid2(T.field('Ukuran', nilaiIn), T.field('Satuan', satuanSel)));
  root.appendChild(T.field('Isi file', isiSel));
  root.appendChild(T.field('Nama file (tanpa akhiran)', namaIn));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Maksimal 500 MB. File besar dibuat per potongan supaya browser tidak macet.</p>'));
}
