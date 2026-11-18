import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "bagi-file", "name": "Bagi File", "cat": "converter", "icon": "🧩", "desc": "Bagi satu file besar jadi beberapa potongan kecil.", "keywords": "bagi,file,potong,split,potongan,mb", "since": "6.17.0"};

// Rencana potong murni: daftar {awal, akhir} byte. Bisa diuji di Node.
export function rencanaPotong(ukuran, perPotong) {
  const out = [];
  const potong = Math.max(1, Math.floor(perPotong) || 1);
  for (let awal = 0; awal < ukuran; awal += potong) {
    out.push({ awal, akhir: Math.min(ukuran, awal + potong) });
  }
  return out;
}

export function render(root) {
  const UKURAN = [
    ['5', '5 MB per potong'],
    ['10', '10 MB per potong'],
    ['25', '25 MB per potong'],
    ['50', '50 MB per potong'],
    ['100', '100 MB per potong'],
    ['custom', 'Ukuran sendiri...'],
  ];
  const file = T.input('file');
  const ukuranSel = T.select(UKURAN, '10');
  const customMb = T.input('number', 'Misal 20');
  customMb.min = '1';
  customMb.max = '2048';
  const customWrap = T.el('<div></div>');
  customWrap.hidden = true;
  customWrap.appendChild(T.field('Ukuran tiap potong (MB)', customMb, 'Isi angka 1 sampai 2048.'));
  const infoBox = T.out();
  const listBox = T.out();
  const outBox = T.out();

  let fileObj = null;
  let potongan = [];

  const ukuranPerPotong = () => {
    if (ukuranSel.value === 'custom') {
      const v = Math.floor(Number(customMb.value));
      return v >= 1 && v <= 2048 ? v * 1024 * 1024 : 0;
    }
    return Number(ukuranSel.value) * 1024 * 1024;
  };

  const refreshRencana = () => {
    potongan = [];
    T.hide(listBox);
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    const per = ukuranPerPotong();
    if (!per) {
      T.show(infoBox, errBox('Isi dulu ukuran tiap potong, angka 1 sampai 2048.'));
      return;
    }
    const rencana = rencanaPotong(fileObj.size, per);
    potongan = rencana;
    T.show(infoBox,
      kv('File', T.esc(fileObj.name)) +
      kv('Ukuran file', fmtBytes(fileObj.size)) +
      kv('Jadi potongan', rencana.length + ' potongan') +
      kv('Ukuran tiap potong', fmtBytes(per)));
  };

  ukuranSel.addEventListener('change', () => {
    customWrap.hidden = ukuranSel.value !== 'custom';
    refreshRencana();
  });
  customMb.addEventListener('input', refreshRencana);
  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    refreshRencana();
  });

  const namaPotong = (i) => fileObj.name + '.part' + String(i + 1).padStart(3, '0');

  const goBtn = T.btn('Bagi file', () => {
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file yang mau dibagi.')); return; }
    const per = ukuranPerPotong();
    if (!per) { T.show(outBox, errBox('Isi dulu ukuran tiap potong, angka 1 sampai 2048.')); return; }
    const rencana = rencanaPotong(fileObj.size, per);
    if (!rencana.length) { T.show(outBox, errBox('File ini kosong, tidak ada yang bisa dibagi.')); return; }
    potongan = rencana;
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + rencana.length + ' potongan siap. Unduh satu per satu, atau semuanya sekaligus.</p>');
    rencana.forEach((p, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(namaPotong(i)) + ' <span class="dim">(' + fmtBytes(p.akhir - p.awal) + ')</span></span>'));
      const dl = T.btn('Unduh', () => {
        T.dl(namaPotong(i), fileObj.slice(p.awal, p.akhir), fileObj.type || 'application/octet-stream');
      });
      dl.classList.add('small');
      row.appendChild(dl);
      listBox.appendChild(row);
    });
    const semuaBtn = T.btn('Unduh semua potongan', async () => {
      for (let i = 0; i < rencana.length; i++) {
        T.dl(namaPotong(i), fileObj.slice(rencana[i].awal, rencana[i].akhir), fileObj.type || 'application/octet-stream');
        await new Promise((r) => setTimeout(r, 400));
      }
      T.toast('Semua potongan diunduh');
    }, true);
    listBox.appendChild(T.el('<p class="hint" style="margin-top:10px">Kalau browser bertanya soal unduhan ganda, izinkan supaya semua potongan terunduh.</p>'));
    listBox.appendChild(semuaBtn);
    T.show(outBox, '<span class="ok">Selesai. File terbagi jadi ' + rencana.length + ' potongan.</span>' +
      kv('Ukuran file', fmtBytes(fileObj.size)) +
      kv('Potongan', rencana.length + ' potongan') +
      '<p class="hint" style="margin-top:8px">Untuk menyambungnya kembali, pakai tool Gabung File.</p>');
    T.scrollToPreview(listBox);
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">File besar kadang tidak bisa dikirim utuh. Bagi jadi potongan kecil, kirim satu per satu, lalu sambung lagi di tujuan dengan tool Gabung File.</p>'));
  root.appendChild(T.field('Pilih file', file));
  root.appendChild(T.field('Ukuran tiap potong', ukuranSel, 'Potongan terakhir biasanya lebih kecil, itu normal.'));
  root.appendChild(customWrap);
  root.appendChild(infoBox);
  root.appendChild(T.row(goBtn));
  root.appendChild(listBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
