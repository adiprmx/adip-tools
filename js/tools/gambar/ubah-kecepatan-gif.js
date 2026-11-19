import { h as T, LOCAL_NOTE, fileInput, fmtBytes, utils } from '../../core.js';

// Ubah Kecepatan GIF: percepat atau perlambat GIF animasi yang sudah ada
// dengan menulis ulang jeda tiap frame-nya. Gambar tidak di-encode ulang,
// jadi kualitas dan ukuran file hampir tidak berubah. Loop dan transparansi
// dibiarkan apa adanya.
export const meta = {"id": "ubah-kecepatan-gif", "name": "Ubah Kecepatan GIF", "cat": "gambar", "icon": "⏩", "desc": "Percepat atau perlambat GIF animasi tanpa menurunkan kualitasnya.", "keywords": "gif,kecepatan,animasi,cepat,lambat,frame,delay", "since": "6.19.0"};

// Pindai blok GIF dan kembalikan info frame + posisi byte jeda tiap frame.
// delay dalam satuan 1/100 detik. Fungsi murni.
export function bacaInfoGif(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 13) throw new Error('Bukan file GIF.');
  const kepala = String.fromCharCode(b[0], b[1], b[2], b[3], b[4], b[5]);
  if (kepala !== 'GIF87a' && kepala !== 'GIF89a') throw new Error('Bukan file GIF.');
  const lebar = b[6] | (b[7] << 8);
  const tinggi = b[8] | (b[9] << 8);
  const packed = b[10];
  let pos = 13;
  if (packed & 0x80) pos += 3 * (1 << ((packed & 0x07) + 1));
  const delay = [];
  const posisiDelay = [];
  let loop = null;
  let gceTertunda = null;
  while (pos < b.length) {
    const pengenal = b[pos];
    if (pengenal === 0x3B) break; // trailer
    if (pengenal === 0x21) {
      // Blok ekstensi.
      const label = b[pos + 1];
      if (label === 0xF9) {
        // Graphic Control Extension: 21 F9 04 packed delayLo delayHi trans 00
        if (pos + 7 >= b.length) throw new Error('File GIF rusak (GCE terpotong).');
        const ukuran = b[pos + 2];
        if (ukuran !== 4) throw new Error('File GIF rusak (ukuran GCE aneh).');
        gceTertunda = { delay: b[pos + 4] | (b[pos + 5] << 8), posDelay: pos + 4 };
        pos += 8;
        continue;
      }
      // Ekstensi lain: lewati sub-blok. Simpan NETSCAPE (loop) bila ketemu.
      if (label === 0xFF && pos + 18 < b.length) {
        const app = String.fromCharCode(...b.subarray(pos + 3, pos + 14));
        if (app === 'NETSCAPE2.0' && b[pos + 15] === 1) {
          loop = b[pos + 16] | (b[pos + 17] << 8);
        }
      }
      pos += 2;
      while (pos < b.length && b[pos] !== 0) {
        const n = b[pos];
        pos += 1 + n;
      }
      pos += 1; // terminator 0
      continue;
    }
    if (pengenal === 0x2C) {
      // Image Descriptor: 10 byte + tabel warna lokal bila ada.
      if (pos + 9 >= b.length) throw new Error('File GIF rusak (deskriptor gambar terpotong).');
      const p = b[pos + 9];
      pos += 10;
      if (p & 0x80) pos += 3 * (1 << ((p & 0x07) + 1));
      // Data gambar: 1 byte ukuran kode LZW + sub-blok.
      if (pos >= b.length) throw new Error('File GIF rusak (data gambar terpotong).');
      pos += 1;
      while (pos < b.length && b[pos] !== 0) {
        const n = b[pos];
        pos += 1 + n;
      }
      pos += 1;
      delay.push(gceTertunda ? gceTertunda.delay : 0);
      posisiDelay.push(gceTertunda ? gceTertunda.posDelay : -1);
      gceTertunda = null;
      continue;
    }
    throw new Error('File GIF rusak (blok tidak dikenal di byte ' + pos + ').');
  }
  return { lebar, tinggi, frame: delay.length, delay, posisiDelay, loop };
}

// Ubah kecepatan GIF: kalikan tiap jeda dengan 1/pengali (pengali 2 =
// dua kali lebih cepat). Jeda 0 diperlakukan sebagai 10 (100 ms, perilaku
// peramban). Jeda hasil dijepit ke 2..65535 (20 ms..655 detik).
// Kembalikan {bytes, frame, delayLama, delayBaru, durasiLamaMs, durasiBaruMs}.
// Fungsi murni.
export function aturKecepatanGif(bytes, pengali) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const info = bacaInfoGif(b);
  if (!Number.isFinite(pengali) || pengali <= 0) throw new Error('Pengali kecepatan tidak valid.');
  const keluar = new Uint8Array(b);
  const delayBaru = [];
  let durasiLama = 0, durasiBaru = 0;
  for (let i = 0; i < info.frame; i++) {
    const lama = info.delay[i] === 0 ? 10 : info.delay[i];
    const baru = Math.max(2, Math.min(65535, Math.round(lama / pengali)));
    delayBaru.push(baru);
    durasiLama += lama * 10;
    durasiBaru += baru * 10;
    const p = info.posisiDelay[i];
    if (p >= 0) {
      keluar[p] = baru & 255;
      keluar[p + 1] = (baru >> 8) & 255;
    }
  }
  return { bytes: keluar, frame: info.frame, delayLama: info.delay, delayBaru, durasiLamaMs: durasiLama, durasiBaruMs: durasiBaru, loop: info.loop };
}

export function render(root) {
  const fi = fileInput('.gif,image/gif');
  const cepatSel = T.select([
    ['0.25', '0,25× (4 kali lebih lambat)'],
    ['0.5', '0,5× (2 kali lebih lambat)'],
    ['0.75', '0,75× (sedikit lebih lambat)'],
    ['1.5', '1,5× (sedikit lebih cepat)'],
    ['2', '2× (2 kali lebih cepat)'],
    ['3', '3× (3 kali lebih cepat)'],
    ['4', '4× (4 kali lebih cepat)'],
    ['kustom', 'Angka sendiri…'],
  ], '2');
  const cepatIn = T.input('text', '2', '2');
  cepatIn.inputMode = 'decimal';
  cepatIn.style.display = 'none';
  const pratinjau = document.createElement('img');
  pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0';
  pratinjau.alt = 'Pratinjau GIF';
  const infoBox = T.out();
  const hasilBox = T.out();
  const statusBox = T.out();
  let fileObj = null, nama = 'animasi', info = null;

  cepatSel.addEventListener('change', () => { cepatIn.style.display = cepatSel.value === 'kustom' ? '' : 'none'; });

  const prosesB = T.btn('Ubah kecepatan', async () => {
    if (!fileObj || !info) { T.toast('Pilih dulu file GIF-nya.'); return; }
    const pengali = cepatSel.value === 'kustom' ? utils.parseNum(cepatIn.value, NaN) : parseFloat(cepatSel.value);
    if (!Number.isFinite(pengali) || pengali < 0.1 || pengali > 10) {
      T.show(hasilBox, '<div class="err">Kecepatan harus angka 0,1 sampai 10.</div>');
      return;
    }
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Menulis ulang jeda frame…</span>');
    try {
      const buf = new Uint8Array(await fileObj.arrayBuffer());
      const hasil = aturKecepatanGif(buf, pengali);
      const fmtDetik = (ms) => (Math.round(ms / 100) / 10).toString().replace('.', ',');
      T.hide(statusBox);
      T.show(hasilBox, '');
      const ket = T.el(`<p style="margin:0 0 8px">${hasil.frame} frame. Durasi ${fmtDetik(hasil.durasiLamaMs)} detik jadi ${fmtDetik(hasil.durasiBaruMs)} detik. Ukuran file tetap ${fmtBytes(hasil.bytes.length)}.</p>`);
      const dlB = T.btn('Unduh GIF baru', () => {
        T.dl(`${nama}-${String(pengali).replace('.', ',')}x.gif`, hasil.bytes, 'image/gif');
      }, true);
      hasilBox.appendChild(ket); hasilBox.appendChild(dlB);
    } catch (e) {
      T.hide(statusBox);
      T.show(hasilBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal memproses GIF.') + '</div>');
    }
    prosesB.disabled = false;
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox); T.hide(infoBox);
    nama = (f.name || 'animasi').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'animasi';
    fileObj = f;
    T.show(statusBox, '<span class="dim">Membaca GIF…</span>');
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      info = bacaInfoGif(buf);
      if (!info.frame) throw new Error('GIF ini tidak punya frame animasi.');
      const total = info.delay.reduce((a, d) => a + (d === 0 ? 10 : d), 0) * 10;
      const fmtDetik = (ms) => (Math.round(ms / 100) / 10).toString().replace('.', ',');
      T.hide(statusBox);
      pratinjau.src = URL.createObjectURL(f);
      if (!pratinjau.parentNode) root.insertBefore(pratinjau, infoBox);
      T.show(infoBox, `<p class="dim" style="font-size:13px">${info.lebar}×${info.tinggi}, ${info.frame} frame, durasi ${fmtDetik(total)} detik${info.loop === null ? '' : info.loop === 0 ? ', berulang selamanya' : ', berulang ' + info.loop + ' kali'}. Ukuran ${fmtBytes(f.size)}.</p>`);
    } catch (e) {
      info = null;
      T.show(statusBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'File GIF tidak bisa dibaca.') + '</div>');
    }
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">GIF yang terlalu cepat atau terlalu lambat bisa diatur ulang kecepatannya di sini. Hanya jeda antar frame yang diubah, gambarnya tidak disentuh sama sekali.</p>'));
  root.appendChild(T.field('Pilih file GIF', fi));
  root.appendChild(infoBox);
  root.appendChild(T.field('Kecepatan baru', cepatSel));
  root.appendChild(T.field('Kecepatan sendiri', cepatIn, 'Hanya dipakai bila pilihan di atas "Angka sendiri". 2 = dua kali lebih cepat, 0,5 = dua kali lebih lambat.'));
  root.appendChild(statusBox);
  root.appendChild(prosesB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
