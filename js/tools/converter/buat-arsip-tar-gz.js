import { h as T, kv, fmtBytes, errBox } from '../../core.js';
import { gzipBytes } from './gzip-gunzip-file.js';

export const meta = {"id": "buat-arsip-tar-gz", "name": "Buat Arsip TAR.GZ", "cat": "converter", "icon": "📦", "desc": "Gabung banyak file jadi satu arsip TAR.GZ.", "keywords": "tar,gz,arsip,gabung,kompres,tar.gz", "since": "6.17.0"};

/* Penulis TAR (format ustar) murni, tanpa pustaka. Dipakai bersama gzip
   untuk menghasilkan .tar.gz yang bisa dibuka tar, 7-Zip, dan tool
   Ekstrak Arsip di sini. Murni, bisa diuji di Node. */

function tulisTeks(buf, off, len, s) {
  const bytes = new TextEncoder().encode(String(s || ''));
  const n = Math.min(bytes.length, len);
  buf.set(bytes.subarray(0, n), off);
}
function tulisOktal(buf, off, len, nilai) {
  const s = Math.max(0, Math.floor(nilai)).toString(8);
  const isi = s.padStart(len - 1, '0').slice(-(len - 1));
  for (let i = 0; i < isi.length; i++) buf[off + i] = isi.charCodeAt(i);
  buf[off + len - 1] = 0;
}
function headerTar(nama, ukuran, mtime, typeflag) {
  const h = new Uint8Array(512);
  tulisTeks(h, 0, 100, nama);
  tulisTeks(h, 100, 8, '0000644\0');
  tulisTeks(h, 108, 8, '0000000\0');
  tulisTeks(h, 116, 8, '0000000\0');
  tulisOktal(h, 124, 12, ukuran);
  tulisOktal(h, 136, 12, mtime);
  for (let i = 148; i < 156; i++) h[i] = 32; // checksum diisi spasi dulu
  h[156] = (typeflag || '0').charCodeAt(0);
  tulisTeks(h, 257, 6, 'ustar\0');
  tulisTeks(h, 263, 2, '00');
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  const cs = sum.toString(8).padStart(6, '0');
  for (let i = 0; i < 6; i++) h[148 + i] = cs.charCodeAt(i);
  h[154] = 0;
  h[155] = 32;
  return h;
}

// entri: [{nama, data: Uint8Array, mtime?}]. Nama lebih dari 100 karakter
// ditulis lewat entri longname GNU ('L'). Mengembalikan Uint8Array TAR.
export function buatTar(entri) {
  const potong = [];
  let total = 0;
  const dorong = (b) => { potong.push(b); total += b.length; };
  const mtime = Math.floor(Date.now() / 1000);
  for (const e of entri) {
    const nama = String(e.nama || 'file');
    const data = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data || []);
    const mt = e.mtime || mtime;
    if (new TextEncoder().encode(nama).length > 100) {
      const namaBytes = new TextEncoder().encode(nama + '\0');
      dorong(headerTar('././@LongLink', namaBytes.length, mt, 'L'));
      dorong(namaBytes);
      const sisaNama = (512 - (namaBytes.length % 512)) % 512;
      if (sisaNama) dorong(new Uint8Array(sisaNama));
    }
    dorong(headerTar(nama, data.length, mt, '0'));
    if (data.length) dorong(data);
    const sisa = (512 - (data.length % 512)) % 512;
    if (sisa) dorong(new Uint8Array(sisa));
  }
  dorong(new Uint8Array(1024)); // dua blok nol penutup
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of potong) { out.set(p, pos); pos += p.length; }
  return out;
}

// Nama di dalam arsip: nama file saja, tanpa jalur folder. Nama kembar
// diberi nomor supaya tidak menimpa satu sama lain.
export function namaArsipUnik(daftarNama) {
  const dipakai = new Set();
  return daftarNama.map((nama) => {
    let n = String(nama || 'file').replace(/[\\/]+/g, '_').replace(/^\.+/, '') || 'file';
    if (!dipakai.has(n)) { dipakai.add(n); return n; }
    const m = /^(.*?)(\.[^.]+)?$/.exec(n);
    let i = 2;
    let calon = m[1] + ' (' + i + ')' + (m[2] || '');
    while (dipakai.has(calon)) { i++; calon = m[1] + ' (' + i + ')' + (m[2] || ''); }
    dipakai.add(calon);
    return calon;
  });
}

export function render(root) {
  const fi = T.input('file');
  fi.multiple = true;
  const namaArsip = T.input('text', 'arsip', 'arsip');
  const listBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  let files = [];
  let busy = false;

  const refreshList = () => {
    if (!files.length) {
      T.show(listBox, '<p class="hint">Belum ada file. Pilih satu atau banyak file di atas.</p>');
      return;
    }
    const total = files.reduce((a, f) => a + f.size, 0);
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + files.length + ' file, total ' + fmtBytes(total) + ':</p>');
    files.forEach((f, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.name) + ' <span class="dim">(' + fmtBytes(f.size) + ')</span></span>'));
      const del = T.btn('Hapus', () => { files.splice(i, 1); refreshList(); });
      del.classList.add('small');
      del.disabled = busy;
      row.appendChild(del);
      listBox.appendChild(row);
    });
  };
  fi.addEventListener('change', () => {
    files = files.concat(Array.from(fi.files || []));
    fi.value = '';
    T.hide(outBox);
    refreshList();
  });

  const goBtn = T.btn('Buat & unduh TAR.GZ', async () => {
    if (busy) return;
    if (!files.length) { T.show(outBox, errBox('Pilih file dulu.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    barWrap.hidden = false;
    try {
      const namaUnik = namaArsipUnik(files.map((f) => f.name));
      const entri = [];
      for (let i = 0; i < files.length; i++) {
        const pct = Math.round((i / files.length) * 60);
        barFill.style.width = pct + '%';
        barLabel.textContent = 'Membaca file ' + (i + 1) + ' dari ' + files.length + '…';
        entri.push({ nama: namaUnik[i], data: new Uint8Array(await files[i].arrayBuffer()) });
      }
      barFill.style.width = '70%';
      barLabel.textContent = 'Menyusun arsip…';
      const tar = buatTar(entri);
      barFill.style.width = '85%';
      barLabel.textContent = 'Mengecilkan arsip…';
      const gz = await gzipBytes(tar);
      const blob = new Blob([gz], { type: 'application/gzip' });
      const nama = (namaArsip.value.trim() || 'arsip').replace(/[\\/:*?"<>|]/g, '-').replace(/\.tar\.gz$/i, '').replace(/\.tgz$/i, '');
      T.dl(nama + '.tar.gz', blob, 'application/gzip');
      const totalAwal = files.reduce((a, f) => a + f.size, 0);
      T.show(outBox, '<span class="ok">Selesai. Arsip TAR.GZ terunduh.</span>' +
        kv('File di dalam arsip', files.length + ' file') +
        kv('Ukuran file awal', fmtBytes(totalAwal)) +
        kv('Ukuran arsip', fmtBytes(blob.size)));
      T.toast('Arsip TAR.GZ terunduh');
    } catch (e) {
      const msg = (e && e.message) || '';
      T.show(outBox, errBox(/tidak bisa dimuat/i.test(msg) ? msg : 'Arsip tidak bisa dibuat. File mungkin terlalu besar untuk memori browser ini, coba dengan file yang lebih sedikit.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      outBox.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
      barWrap.hidden = true;
      barFill.style.width = '0%';
      refreshList();
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Gabung banyak file jadi satu arsip .tar.gz yang bisa dibuka di Linux, Mac, Windows (dengan 7-Zip), dan tool Ekstrak Arsip di sini.</p>'));
  root.appendChild(T.field('Pilih file (boleh banyak)', fi, 'File dipilih bertahap, semuanya masuk daftar di bawah.'));
  root.appendChild(listBox);
  root.appendChild(T.field('Nama arsip', namaArsip, 'Tanpa .tar.gz, nanti ditambahkan otomatis.'));
  root.appendChild(T.row(goBtn, T.btn('Kosongkan daftar', () => { files = []; refreshList(); })));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
  refreshList();
}
