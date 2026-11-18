import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "gabung-file", "name": "Gabung File", "cat": "converter", "icon": "🔗", "desc": "Sambung potongan file jadi satu file utuh.", "keywords": "gabung,file,sambung,potongan,join,part", "since": "6.17.0"};

// Ambil nomor urut dari nama potongan (.part001, .001, .part1, part2).
// Mengembalikan nomornya, atau null bila nama tidak punya nomor urut.
export function nomorPotongan(nama) {
  const m = /(?:\.part|\.part0*|[\._-])(\d+)(?:\.[^.]+)?$/i.exec(String(nama || ''));
  if (!m) return null;
  // Nama seperti "laporan2024.pdf" tidak boleh dibaca sebagai potongan:
  // hanya terima bila angkanya menempel di akhir nama (sebelum ekstensi
  // terakhir) dan diawali pemisah yang jelas (.part, ., _, -).
  return parseInt(m[1], 10);
}

// Urutkan daftar nama potongan berdasarkan nomor urutnya. Nama tanpa nomor
// tetap di tempatnya di belakang yang bernomor. Murni, bisa diuji di Node.
export function urutkanPotongan(daftar) {
  return daftar
    .map((nama, i) => ({ nama, i, n: nomorPotongan(nama) }))
    .sort((a, b) => {
      if (a.n !== null && b.n !== null) return a.n - b.n || a.i - b.i;
      if (a.n !== null) return -1;
      if (b.n !== null) return 1;
      return a.i - b.i;
    })
    .map((x) => x.nama);
}

// Nama hasil gabungan: buang akhiran potongan dari nama potongan pertama.
export function namaGabungan(namaPertama) {
  const s = String(namaPertama || 'gabungan');
  return s.replace(/\.part\d+$/i, '').replace(/\.(\d{2,3})$/i, '') || 'gabungan';
}

export function render(root) {
  const file = T.input('file');
  file.multiple = true;
  const listBox = T.out();
  const outBox = T.out();
  const namaOut = T.input('text', 'Nama file hasil');

  let parts = [];
  let busy = false;

  const refreshList = () => {
    if (!parts.length) {
      T.show(listBox, '<p class="hint">Belum ada potongan. Pilih potongan file di atas, bisa bertahap.</p>');
      return;
    }
    const total = parts.reduce((a, f) => a + f.size, 0);
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + parts.length + ' potongan, total ' + fmtBytes(total) + '. Urutan di bawah adalah urutan penyambungan.</p>');
    parts.forEach((f, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (i + 1) + '. ' + T.esc(f.name) + ' <span class="dim">(' + fmtBytes(f.size) + ')</span></span>'));
      const acts = T.el('<div style="display:flex;gap:6px;flex-shrink:0"></div>');
      const up = T.btn('Naik', () => { if (i > 0) { const t = parts[i - 1]; parts[i - 1] = parts[i]; parts[i] = t; refreshList(); } });
      up.classList.add('small'); up.disabled = i === 0 || busy;
      const down = T.btn('Turun', () => { if (i < parts.length - 1) { const t = parts[i + 1]; parts[i + 1] = parts[i]; parts[i] = t; refreshList(); } });
      down.classList.add('small'); down.disabled = i === parts.length - 1 || busy;
      const del = T.btn('Hapus', () => { parts.splice(i, 1); refreshList(); });
      del.classList.add('small'); del.disabled = busy;
      acts.appendChild(up); acts.appendChild(down); acts.appendChild(del);
      row.appendChild(acts);
      listBox.appendChild(row);
    });
  };

  file.addEventListener('change', () => {
    const picked = Array.from(file.files || []);
    file.value = '';
    if (!picked.length) return;
    T.hide(outBox);
    parts = parts.concat(picked);
    if (!namaOut.value.trim() && parts.length) namaOut.value = namaGabungan(parts[0].name);
    refreshList();
  });

  const urutBtn = T.btn('Urutkan otomatis', () => {
    const urut = urutkanPotongan(parts.map((f) => f.name));
    const byName = new Map();
    parts.forEach((f) => { if (!byName.has(f.name)) byName.set(f.name, []); byName.get(f.name).push(f); });
    parts = urut.map((n) => byName.get(n).shift());
    refreshList();
    T.toast('Potongan terurut berdasarkan nomornya');
  });

  const goBtn = T.btn('Gabung jadi satu file', () => {
    if (busy) return;
    if (parts.length < 2) { T.show(outBox, errBox('Pilih minimal 2 potongan untuk digabung.')); return; }
    busy = true;
    goBtn.disabled = true;
    try {
      const nama = (namaOut.value.trim() || namaGabungan(parts[0].name)).replace(/[\\/:*?"<>|]/g, '-');
      const blob = new Blob(parts, { type: parts[0].type || 'application/octet-stream' });
      T.dl(nama, blob, blob.type);
      const total = parts.reduce((a, f) => a + f.size, 0);
      T.show(outBox, '<span class="ok">Selesai. File gabungan terunduh.</span>' +
        kv('Potongan digabung', parts.length + ' potongan') +
        kv('Ukuran hasil', fmtBytes(blob.size)) +
        (blob.size !== total ? '<p class="hint" style="margin-top:8px">Ukuran hasil berbeda dari jumlah potongan. Cek lagi urutan potongannya.</p>' : ''));
      T.toast('File gabungan terunduh');
    } catch (e) {
      T.show(outBox, errBox('File tidak bisa digabung. Potongannya mungkin terlalu besar untuk memori browser ini.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pasangan dari tool Bagi File. Pilih semua potongannya, pastikan urutannya benar, lalu gabung jadi satu file utuh seperti semula.</p>'));
  root.appendChild(T.field('Pilih potongan file (boleh banyak)', file, 'Potongan dari tool Bagi File bernama seperti nama.part001, nama.part002.'));
  root.appendChild(listBox);
  root.appendChild(T.field('Nama file hasil', namaOut, 'Terisi otomatis dari potongan pertama, boleh diubah.'));
  root.appendChild(T.row(goBtn, urutBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
  refreshList();
}
