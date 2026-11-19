import { h as T, errBox, fileInput } from '../../core.js';

// Pola nama baru. Placeholder:
// {nama} nama file lama tanpa ekstensi, {n} nomor urut, {nn} 2 digit,
// {nnn} 3 digit, {tanggal} YYYY-MM-DD, {ekstensi} ekstensi tanpa titik.
// Ekstensi lama dipakai otomatis bila pola tidak menyebut {ekstensi}.
export function applyRenamePattern(pattern, file, index, start, dateStr) {
  const dot = file.lastIndexOf('.');
  const base = dot > 0 ? file.slice(0, dot) : file;
  const ext = dot > 0 ? file.slice(dot + 1) : '';
  const n = start + index;
  let out = String(pattern || '').trim() || '{nama}';
  out = out
    .replace(/\{nnn\}/g, String(n).padStart(3, '0'))
    .replace(/\{nn\}/g, String(n).padStart(2, '0'))
    .replace(/\{n\}/g, String(n))
    .replace(/\{nama\}/g, base)
    .replace(/\{tanggal\}/g, dateStr || '')
    .replace(/\{ekstensi\}/g, ext);
  if (!/\{ekstensi\}/.test(String(pattern || '')) && ext) out += '.' + ext;
  return sanitizeFileName(out);
}

// Buang karakter yang tidak boleh ada di nama file Windows/macOS/Linux.
export function sanitizeFileName(name) {
  let s = String(name || '').replace(/[\\/:*?"<>|]/g, '-').replace(/[\x00-\x1f]/g, '');
  s = s.replace(/^\.+/, '').replace(/\.+$/, '').trim();
  return s || 'tanpa-nama';
}

// Daftar rename lengkap + deteksi nama baru yang bentrok (duplikat).
export function buildRenameList(files, pattern, start, dateStr, spaceDash) {
  const list = files.map((f, i) => {
    let baru = applyRenamePattern(pattern, f, i, start, dateStr);
    if (spaceDash) baru = baru.replace(/ /g, '-');
    return { lama: f, baru };
  });
  const seen = new Map();
  for (const it of list) {
    const k = it.baru.toLowerCase();
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  for (const it of list) it.bentrok = seen.get(it.baru.toLowerCase()) > 1;
  return list;
}

export const meta = {"id": "ganti-nama-file-massal", "name": "Ganti Nama File Massal", "cat": "converter", "icon": "🏷️", "desc": "Ganti nama banyak file sekaligus dengan pola, pratinjau dulu sebelum unduh.", "keywords": "rename,ganti nama,file,massal,bulk rename,pola,nomor urut", "since": "6.18.0"};
export function render(root) {

    const fileI = fileInput('*/*');
    fileI.multiple = true;
    const pola = T.input('text', 'cth: foto-liburan-{nnn}', 'foto-{nnn}');
    const mulai = T.input('number', 'Nomor pertama', 1);
    const spasi = document.createElement('input');
    spasi.type = 'checkbox';
    const box = T.out();
    let files = [];
    let hasil = [];

    const tanggalHariIni = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    };

    const pratinjau = () => {
      if (!files.length) { T.show(box, errBox('Pilih dulu file yang mau diganti namanya.')); return; }
      const start = Math.max(1, Math.floor(Number(mulai.value)) || 1);
      hasil = buildRenameList(files.map((f) => f.name), pola.value, start, tanggalHariIni(), spasi.checked);
      const bentrok = hasil.filter((h) => h.bentrok).length;
      const tampil = hasil.slice(0, 50);
      let html = '<div class="kv"><span class="k">File dipilih</span><span class="v">' + hasil.length + '</span></div>';
      if (bentrok) html += '<div style="color:var(--err);font-size:13px;margin:6px 0">Ada ' + bentrok + ' nama baru yang sama. Ubah polanya supaya tiap nama beda.</div>';
      html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px"><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ffffff20">Nama lama</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ffffff20">Nama baru</th></tr>' +
        tampil.map((h) => '<tr><td style="padding:5px 8px;border-bottom:1px solid #ffffff10;word-break:break-all">' + T.esc(h.lama) + '</td><td style="padding:5px 8px;border-bottom:1px solid #ffffff10;word-break:break-all;' + (h.bentrok ? 'color:var(--err)' : '') + '">' + T.esc(h.baru) + '</td></tr>').join('') +
        '</table>';
      if (hasil.length > 50) html += '<div class="hint">Pratinjau dibatasi 50 baris pertama dari ' + hasil.length + ' file.</div>';
      T.show(box, html);
      if (!bentrok) {
        box.appendChild(T.row(
          T.zipBtn('file-ganti-nama.zip', () => hasil.map((h, i) => ({ name: h.baru, data: files[i] })), 'Unduh semua (ZIP)'),
          T.btn('Unduh satu per satu', () => {
            hasil.forEach((h, i) => T.dl(h.baru, files[i], files[i].type || 'application/octet-stream'));
          })
        ));
      }
    };

    fileI.addEventListener('change', () => {
      files = Array.from(fileI.files || []);
      if (files.length) pratinjau();
      else T.show(box, '<span class="dim">Belum ada file dipilih.</span>');
    });

    root.appendChild(T.field('Pilih file (boleh banyak)', fileI));
    root.appendChild(T.field('Pola nama baru', pola, 'Pakai {nama} untuk nama lama, {n} / {nn} / {nnn} untuk nomor urut, {tanggal} untuk tanggal hari ini, {ekstensi} untuk ekstensi. Ekstensi lama dipakai otomatis bila tidak ditulis.'));
    root.appendChild(T.grid2(T.field('Nomor pertama', mulai), T.field('Spasi jadi tanda -', spasi)));
    root.appendChild(T.row(T.btn('Lihat pratinjau', pratinjau, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Nama file asli di perangkatmu tidak berubah. Yang diunduh adalah salinan dengan nama baru, dalam satu ZIP atau satu per satu. Browser tidak bisa mengganti nama file langsung di perangkatmu.</div>'));

}
