import { h as T, errBox, LOCAL_NOTE, fmtBytes, fileInput } from '../../core.js?v=6.13.0';

export const meta = {"id": "heic-ke-jpg", "name": "HEIC ke JPG", "cat": "gambar", "icon": "🍎", "desc": "Ubah foto iPhone (HEIC) jadi JPG/PNG, bisa banyak foto sekaligus.", "keywords": "heic,heif,iphone,jpg,png,foto,convert", "since": "6.11.0"};
export function render(root) {
    const HEIC_CDN = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
    const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
    const MAKS_FILE = 50 * 1024 * 1024;
    const MAKS_JUMLAH = 20;
    const BATAS_MUAT_LIB = 45 * 1000; // muat library dari CDN, maks 45 dtk
    const BATAS_DECODE = 120 * 1000; // decode satu foto, maks 120 dtk

    // Muat <script> dengan timeout sendiri: T.loadScript tidak punya timeout,
    // jadi bila CDN menggantung (tidak load, tidak error) tool macet selamanya
    // di "Memuat pengubah HEIC…" tanpa pesan apa pun.
    const percobaanMuat = {}; // src -> jumlah percobaan
    const muatScript = (src, batasMs) => {
      percobaanMuat[src] = (percobaanMuat[src] || 0) + 1;
      // Percobaan ulang pakai URL berbeda: browser menggabungkan request yang
      // URL-nya sama dan masih menggantung, jadi retry dengan URL sama tidak
      // pernah sampai ke jaringan (terbukti di uji Playwright P3).
      const url = percobaanMuat[src] === 1 ? src : src + '?coba=' + percobaanMuat[src];
      return new Promise((selesai) => {
        const s = document.createElement('script');
        s.src = url; s.async = true;
        // SRI: hash dicari dari URL dasar (tanpa ?coba=N) — isi file yang
        // dilayani retry identik, dan browser memeriksa hash terhadap isi.
        const hash = T.scriptIntegrity ? T.scriptIntegrity(src) : null;
        if (hash) { s.integrity = hash; s.crossOrigin = 'anonymous'; }
        const timer = setTimeout(() => { s.remove(); selesai(false); }, batasMs);
        s.onload = () => { clearTimeout(timer); selesai(true); };
        s.onerror = () => { clearTimeout(timer); selesai(false); };
        document.head.appendChild(s);
      });
    };
    // Janji dengan timeout: bila janji asli tidak kunjung selesai, ditolak
    // dengan Error('timeout') supaya UI bisa lanjut dan memberi pesan.
    const denganTimeout = (janji, batasMs) => Promise.race([
      janji,
      new Promise((_, tolak) => setTimeout(() => tolak(new Error('timeout')), batasMs)),
    ]);

    let heicSiap = null, zipSiap = null;
    const pastHeic = () => {
      if (!heicSiap) heicSiap = muatScript(HEIC_CDN, BATAS_MUAT_LIB).then((ok) => {
        const siap = ok && typeof window.heic2any === 'function';
        if (!siap) heicSiap = null; // gagal -> klik berikutnya mencoba lagi
        return siap;
      });
      return heicSiap;
    };
    const pastZip = () => {
      if (!zipSiap) zipSiap = muatScript(ZIP_CDN, BATAS_MUAT_LIB).then((ok) => {
        const siap = ok && typeof window.JSZip === 'function';
        if (!siap) zipSiap = null;
        return siap;
      });
      return zipSiap;
    };

    const adalahHeic = (f) => {
      const t = (f.type || '').toLowerCase();
      const n = (f.name || '').toLowerCase();
      return t === 'image/heic' || t === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif');
    };

    root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Foto dari iPhone tersimpan sebagai HEIC, yang tidak bisa dibuka di banyak tempat. Ubah jadi JPG atau PNG di sini, langsung di browser, tanpa diunggah ke mana-mana.</p>'));

    const fileI = fileInput('.heic,.heif,image/heic,image/heif');
    fileI.multiple = true;
    const fmtSel = T.select([['jpeg', 'JPG'], ['png', 'PNG']], 'jpeg');
    const qRange = T.input('range'); qRange.min = '50'; qRange.max = '100'; qRange.value = '90';
    const qVal = T.el('<b>90%</b>');
    qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });
    const daftarBox = T.out();
    const statusBox = T.out();
    const hasilBox = T.out();

    let antrean = []; // File[]
    let hasil = []; // {blob, name, asal}

    const gambarDaftar = () => {
      if (!antrean.length) { T.hide(daftarBox); return; }
      T.show(daftarBox, '');
      antrean.forEach((f, i) => {
        const row = T.el('<div class="kv"><span>' + T.esc(f.name || 'foto ' + (i + 1)) + '</span><b>' + fmtBytes(f.size) + '</b></div>');
        daftarBox.appendChild(row);
      });
    };

    const tambahFile = (files) => {
      let baru = [...files].filter(adalahHeic);
      const ditolak = files.length - baru.length;
      if (ditolak > 0) T.toast(ditolak + ' file dilewati (bukan HEIC/HEIF)');
      const kebesaran = baru.filter((f) => f.size > MAKS_FILE);
      kebesaran.forEach((f) => T.toast((f.name || 'foto') + ' melebihi 50 MB, dilewati'));
      baru = baru.filter((f) => f.size <= MAKS_FILE && f.size > 0);
      antrean = antrean.concat(baru).slice(0, MAKS_JUMLAH);
      if (antrean.length >= MAKS_JUMLAH) T.toast('Maksimal ' + MAKS_JUMLAH + ' foto sekali proses');
      hasil = [];
      T.hide(hasilBox);
      gambarDaftar();
    };

    const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer"><div style="font-size:30px">🍎</div><div style="margin-top:6px;font-weight:700">Ketuk / seret foto HEIC ke sini</div><div class="dim" style="font-size:12px;margin-top:4px">HEIC · HEIF, maks 20 foto, 50 MB per foto</div></div>');
    dz.addEventListener('click', () => fileI.click());
    dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileI.click(); } });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files.length) tambahFile(e.dataTransfer.files); });
    fileI.addEventListener('change', () => { if (fileI.files.length) tambahFile(fileI.files); fileI.value = ''; });

    let memproses = false;
    async function proses() {
      if (memproses) { T.toast('Masih memproses…'); return; }
      if (!antrean.length) { T.toast('Pilih foto HEIC dulu'); return; }
      memproses = true;
      hasil = [];
      T.hide(hasilBox);
      T.show(statusBox, '<span class="dim">Memuat pengubah HEIC…</span>');
      if (!(await pastHeic())) {
        T.show(statusBox, errBox('Alat pengubah HEIC tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.'));
        memproses = false;
        return;
      }
      const keJpg = fmtSel.value === 'jpeg';
      const mime = keJpg ? 'image/jpeg' : 'image/png';
      const q = parseInt(qRange.value, 10) / 100;
      const gagal = [];
      let gagalLama = 0; // gagal karena decode melewati BATAS_DECODE
      for (let i = 0; i < antrean.length; i++) {
        const f = antrean[i];
        T.show(statusBox, '<span class="dim">Memproses ' + (i + 1) + ' dari ' + antrean.length + ': ' + T.esc(f.name || '') + '…</span>');
        try {
          const keluar = await denganTimeout(window.heic2any({ blob: f, toType: mime, quality: q }), BATAS_DECODE);
          const blob = Array.isArray(keluar) ? keluar[0] : keluar;
          if (!blob) throw new Error('kosong');
          const base = (f.name || 'foto').replace(/\.[^.]*$/, '');
          hasil.push({ blob, name: base + (keJpg ? '.jpg' : '.png'), asal: f.name });
        } catch (e) {
          if (e && e.message === 'timeout') gagalLama++;
          gagal.push(f.name || 'foto ' + (i + 1));
        }
      }
      memproses = false;
      T.hide(statusBox);
      if (!hasil.length) {
        T.show(statusBox, errBox(gagalLama > 0
          ? 'Tidak ada foto yang berhasil diubah. Fotonya mungkin terlalu besar sehingga prosesnya terlalu lama, atau varian HEIC-nya tidak bisa dibaca alat ini. Coba foto yang lebih kecil, atau kirim ulang fotonya dari iPhone sebagai JPG (Pengaturan > Kamera > Format > Paling Kompatibel).'
          : 'Tidak ada foto yang berhasil diubah. Beberapa varian HEIC memang tidak bisa dibaca alat ini. Coba kirim ulang fotonya dari iPhone sebagai JPG (Pengaturan > Kamera > Format > Paling Kompatibel).'));
        return;
      }
      T.show(hasilBox, '');
      hasil.forEach((r) => {
        const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
        row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(r.name) + '</b><div class="dim" style="font-size:12px">' + fmtBytes(r.blob.size) + '</div></div>'));
        row.appendChild(T.btn('Unduh', () => { T.dl(r.name, r.blob, r.blob.type); }, true));
        hasilBox.appendChild(row);
      });
      if (gagal.length) {
        hasilBox.appendChild(T.el('<p class="dim" style="font-size:12px">' + gagal.length + ' foto gagal diubah: ' + T.esc(gagal.join(', ')) + (gagalLama > 0 ? '. Prosesnya terlalu lama atau varian HEIC-nya tidak bisa diubah oleh alat ini.' : '. Varian HEIC-nya tidak bisa diubah oleh alat ini.') + '</p>'));
      }
      if (hasil.length > 1) {
        const zipB = T.btn('Unduh semua (ZIP)', async () => {
          T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
          if (!(await pastZip())) { T.show(statusBox, errBox('Alat pembuat ZIP tidak bisa dimuat. Cek koneksi lalu coba lagi.')); return; }
          try {
            const zip = new window.JSZip();
            hasil.forEach((r) => zip.file(r.name, r.blob));
            const blob = await zip.generateAsync({ type: 'blob' });
            T.dl('foto-heic-jadi-' + (keJpg ? 'jpg' : 'png') + '.zip', blob, 'application/zip');
            T.hide(statusBox);
            T.toast('ZIP berhasil diunduh');
          } catch (e) {
            T.show(statusBox, errBox('ZIP tidak bisa dibuat. Unduh fotonya satu per satu.'));
          }
        }, true);
        hasilBox.appendChild(T.row(zipB));
      }
      T.scrollToPreview(hasilBox);
    }

    const qRow = T.el('<div class="row"></div>');
    qRow.appendChild(qRange); qRow.appendChild(qVal);
    root.appendChild(dz);
    root.appendChild(fileI);
    root.appendChild(T.grid2(
      T.field('Format hasil', fmtSel),
      T.field('Kualitas JPG', qRow, 'Tidak berlaku untuk PNG.')
    ));
    const prosesB = T.btn('Ubah jadi JPG', proses, true);
    root.appendChild(T.row(prosesB));
    fmtSel.addEventListener('change', () => {
      prosesB.textContent = 'Ubah jadi ' + (fmtSel.value === 'jpeg' ? 'JPG' : 'PNG');
    });
    root.appendChild(daftarBox);
    root.appendChild(statusBox);
    root.appendChild(hasilBox);
}
