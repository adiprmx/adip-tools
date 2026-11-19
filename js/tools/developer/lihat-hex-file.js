import { h as T, fmtBytes, errBox } from '../../core.js';

// Tampilkan isi file apa pun sebagai heksadesimal (16 byte per baris:
// offset, byte hex, dan kolom ASCII). 100% client-side, file tidak
// diunggah ke mana-mana.
export const BYTE_PER_BARIS = 16;
export const BYTE_PER_HALAMAN = 4096; // 256 baris per halaman

function hex2(n) {
  return n.toString(16).padStart(2, '0');
}

function ascii(byte) {
  return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
}

// Satu baris dump: "00000000  48 65 6c ...  |Hello ...|".
export function barisHex(byte, offset) {
  const potong = byte.slice(offset, offset + BYTE_PER_BARIS);
  const hex = [];
  let teks = '';
  for (let i = 0; i < BYTE_PER_BARIS; i++) {
    if (i < potong.length) {
      hex.push(hex2(potong[i]));
      teks += ascii(potong[i]);
    } else {
      hex.push('  ');
    }
    if (i === 7) hex.push('');
  }
  const off = offset.toString(16).padStart(8, '0');
  return off + '  ' + hex.join(' ') + '  |' + teks + '|';
}

export function dumpHex(byte, offsetAwal, jumlah) {
  const awal = Math.max(0, offsetAwal || 0);
  const akhir = jumlah == null ? byte.length : Math.min(byte.length, awal + jumlah);
  const baris = [];
  for (let off = awal; off < akhir; off += BYTE_PER_BARIS) baris.push(barisHex(byte, off));
  return baris.join('\n');
}

// Ubah kueri cari jadi byte: "48 65" atau "4865" (hex), atau teks biasa.
export function kueriKeByte(kueri, mode) {
  const q = String(kueri == null ? '' : kueri).trim();
  if (!q) return null;
  if (mode === 'teks') return new TextEncoder().encode(q);
  const bersih = q.replace(/[\s,]/g, '');
  if (!/^[0-9a-fA-F]+$/.test(bersih) || bersih.length % 2 !== 0) return null;
  const keluar = new Uint8Array(bersih.length / 2);
  for (let i = 0; i < keluar.length; i++) keluar[i] = parseInt(bersih.slice(i * 2, i * 2 + 2), 16);
  return keluar;
}

export function cariByte(byte, pola, dari) {
  const hasil = [];
  if (!pola || !pola.length || pola.length > byte.length) return hasil;
  let i = Math.max(0, dari || 0);
  while (i + pola.length <= byte.length) {
    let cocok = true;
    for (let j = 0; j < pola.length; j++) {
      if (byte[i + j] !== pola[j]) { cocok = false; break; }
    }
    if (cocok) hasil.push(i);
    i++;
  }
  return hasil;
}

export const meta = { id: 'lihat-hex-file', name: 'Lihat Hex File', cat: 'developer', icon: '🔢', desc: 'Tampilkan isi file apa pun sebagai heksadesimal: offset, byte hex, dan kolom teks. Cari byte atau teks di dalam file.', keywords: 'hex,heksadesimal,hexdump,byte,file,lihat file,analisis file', since: '6.19.0' };

export function render(root) {
  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const box = T.out();

  let data = null; // Uint8Array
  let namaFile = '';
  let halaman = 0;
  let sorot = -1; // offset hasil cari yang sedang ditampilkan

  const totalHalaman = () => (data ? Math.max(1, Math.ceil(data.length / BYTE_PER_HALAMAN)) : 1);

  const cariI = T.input('text', 'Mis. 48 65 6C atau Hello');
  const modeSel = T.select([['hex', 'Cari hex'], ['teks', 'Cari teks']], 'hex');
  const lompatI = T.input('text', 'Mis. 0x100 atau 256');

  const gambar = () => {
    if (!data) return;
    const awal = halaman * BYTE_PER_HALAMAN;
    const dump = dumpHex(data, awal, BYTE_PER_HALAMAN);
    const pre = document.createElement('pre');
    pre.textContent = dump;
    pre.style.cssText = 'font-family:ui-monospace,monospace;font-size:11.5px;line-height:1.55;overflow-x:auto;white-space:pre;margin:0';
    const nav = T.el('<div class="row" style="flex-wrap:wrap;margin-top:10px"></div>');
    const infoHal = T.el('<span class="hint">Halaman ' + (halaman + 1) + ' dari ' + totalHalaman() + ' (' + T.fmt(data.length) + ' byte)</span>');
    const sebelumBtn = T.btn('Sebelumnya', () => { if (halaman > 0) { halaman--; gambar(); } });
    const sesudahBtn = T.btn('Berikutnya', () => { if (halaman < totalHalaman() - 1) { halaman++; gambar(); } });
    sebelumBtn.disabled = halaman === 0;
    sesudahBtn.disabled = halaman >= totalHalaman() - 1;
    nav.append(sebelumBtn, sesudahBtn, infoHal);
    box.innerHTML = '';
    box.appendChild(pre);
    box.appendChild(nav);
    box.hidden = false;
    if (sorot >= 0) {
      const barisKe = Math.floor((sorot - awal) / BYTE_PER_BARIS);
      if (barisKe >= 0 && barisKe < BYTE_PER_HALAMAN / BYTE_PER_BARIS) {
        statusEl.textContent = 'Ketemu di offset 0x' + sorot.toString(16) + ' (' + T.fmt(sorot) + '), baris ke-' + (barisKe + 1) + ' di halaman ini.';
      }
    }
  };

  const cari = () => {
    if (!data) { T.toast('Pilih dulu filenya.'); return; }
    const pola = kueriKeByte(cariI.value, modeSel.value);
    if (!pola) { T.show(box, errBox(modeSel.value === 'hex' ? 'Hex-nya tidak benar. Pakai pasangan digit hex, mis. 48 65 6C.' : 'Tulis dulu teks yang dicari.')); return; }
    const hasil = cariByte(data, pola, 0);
    if (!hasil.length) {
      sorot = -1;
      statusEl.textContent = 'Tidak ketemu di file ini.';
      return;
    }
    sorot = hasil[0];
    halaman = Math.floor(sorot / BYTE_PER_HALAMAN);
    gambar(); // gambar() menulis detail offset ke status
    if (hasil.length > 1) statusEl.textContent += ' Ketemu ' + hasil.length + ' kali, ini yang pertama.';
  };

  const lompat = () => {
    if (!data) { T.toast('Pilih dulu filenya.'); return; }
    const mentah = lompatI.value.trim().toLowerCase();
    const nilai = mentah.startsWith('0x') ? parseInt(mentah.slice(2), 16) : parseInt(mentah, 10);
    if (isNaN(nilai) || nilai < 0 || nilai >= data.length) {
      T.toast('Offset di luar file (0 sampai ' + (data.length - 1) + ').');
      return;
    }
    sorot = nilai;
    halaman = Math.floor(nilai / BYTE_PER_HALAMAN);
    statusEl.textContent = '';
    gambar();
  };

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { T.toast('Filenya terlalu besar (maksimal 50 MB)'); return; }
    statusEl.textContent = 'Membaca file...';
    data = new Uint8Array(await f.arrayBuffer());
    namaFile = f.name;
    halaman = 0;
    sorot = -1;
    statusEl.innerHTML = T.esc(namaFile) + ', ' + fmtBytes(data.length) + '.';
    gambar();
  });

  root.appendChild(T.el('<p class="hint">Pilih file apa pun. Isinya ditampilkan 16 byte per baris: angka offset di kiri, byte hex di tengah, dan teksnya di kanan (byte yang bukan huruf tampil sebagai titik).</p>'));
  root.appendChild(T.field('Pilih file', fileI));
  root.appendChild(statusEl);
  root.appendChild(T.grid2(T.field('Cari di dalam file', cariI), T.field('Mode cari', modeSel)));
  root.appendChild(T.row(T.btn('Cari', cari, true)));
  root.appendChild(T.field('Lompat ke offset', lompatI));
  root.appendChild(T.row(T.btn('Lompat', lompat), T.copyBtn(() => (data ? dumpHex(data, halaman * BYTE_PER_HALAMAN, BYTE_PER_HALAMAN) : ''), 'Salin halaman ini'), T.dlBtn('hex-dump.txt', () => (data ? dumpHex(data, 0, Math.min(data.length, 1024 * 1024)) : ''), 'text/plain;charset=utf-8', 'Unduh dump (maks 1 MB)')));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint" style="margin-top:12px">File dibaca di browser saja, tidak diunggah ke mana-mana. Unduhan dump dibatasi 1 MB pertama supaya browser tidak berat.</p>'));
}
