import { h as T, kv, todayISO } from '../../core.js';

/* Ambang umum gula darah (mg/dL) — rujukan umum (mis. ADA), BUKAN diagnosis.
   Puasa: normal <100, waspada 100–125, tinggi ≥126.
   2 jam setelah makan: normal <140, waspada 140–199, tinggi ≥200.
   Sewaktu/sebelum tidur: dipakai ambang longgar (rendah <70, tinggi >180). */
export function nilaiGula(nilai, kondisi) {
  if (nilai < 70) return { status: 'rendah', label: 'Rendah (di bawah 70)', kelas: 'err' };
  if (kondisi === 'puasa') {
    if (nilai < 100) return { status: 'normal', label: 'Normal (puasa di bawah 100)', kelas: 'info' };
    if (nilai <= 125) return { status: 'waspada', label: 'Waspada (puasa 100–125)', kelas: 'warn' };
    return { status: 'tinggi', label: 'Tinggi (puasa 126 atau lebih)', kelas: 'err' };
  }
  if (kondisi === 'setelah-makan') {
    if (nilai < 140) return { status: 'normal', label: 'Normal (2 jam setelah makan di bawah 140)', kelas: 'info' };
    if (nilai <= 199) return { status: 'waspada', label: 'Waspada (2 jam setelah makan 140–199)', kelas: 'warn' };
    return { status: 'tinggi', label: 'Tinggi (2 jam setelah makan 200 atau lebih)', kelas: 'err' };
  }
  if (nilai > 180) return { status: 'tinggi', label: 'Tinggi (di atas 180)', kelas: 'err' };
  return { status: 'normal', label: 'Dalam rentang umum', kelas: 'info' };
}

const KONDISI = {
  'puasa': 'Puasa (bangun tidur, belum makan)',
  'setelah-makan': '2 jam setelah makan',
  'sewaktu': 'Sewaktu (kapan saja)',
  'sebelum-tidur': 'Sebelum tidur',
};

export const meta = {"id": "catatan-gula-darah", "name": "Catatan Gula Darah", "cat": "sehari", "icon": "🩸", "desc": "Log gula darah harian (puasa / setelah makan) + tren sederhana. Info umum, bukan diagnosis.", "keywords": "gula darah,diabetes,glukosa,log gula,puasa,cek gula", "since": "6.13.0"};
export function render(root) {

    const K = 'adip.guladarah.v1';
    // Validasi + normalisasi saat baca: entri rusak DILEWATI (bukan crash,
    // bukan paksa user "Hapus semua" — RT2-04). Syarat entri sehat sama
    // dengan syarat input via UI: nilai bulat 20–600 mg/dL, tanggal
    // YYYY-MM-DD yang valid. Kondisi di luar daftar dinormalisasi ke
    // 'sewaktu'; catatan non-string dibuang. paint() memanggil save() di
    // akhir, jadi localStorage ikut bersih sendiri (self-healing).
    const TGL_OK = /^\d{4}-\d{2}-\d{2}$/;
    const load = () => {
      try {
        const a = JSON.parse(localStorage.getItem(K) || '[]');
        if (!Array.isArray(a)) return [];
        const bersih = [];
        a.forEach((e) => {
          if (!e || typeof e !== 'object') return;
          if (typeof e.nilai !== 'number' || !Number.isFinite(e.nilai) || !Number.isInteger(e.nilai) || e.nilai < 20 || e.nilai > 600) return;
          if (typeof e.tanggal !== 'string' || !TGL_OK.test(e.tanggal) || isNaN(new Date(e.tanggal + 'T00:00:00').getTime())) return;
          bersih.push({
            nilai: e.nilai,
            kondisi: KONDISI[e.kondisi] ? e.kondisi : 'sewaktu',
            tanggal: e.tanggal,
            catatan: typeof e.catatan === 'string' ? e.catatan : '',
            ts: typeof e.ts === 'number' && Number.isFinite(e.ts) ? e.ts : 0,
          });
        });
        return bersih;
      } catch (e) { return []; }
    };
    const save = () => { try { localStorage.setItem(K, JSON.stringify(log)); } catch (e) {} };
    let log = load();

    const nilaiI = T.input('text', 'cth: 110', '');
    nilaiI.inputMode = 'numeric';
    const kondisiI = T.select(Object.keys(KONDISI).map((k) => [k, KONDISI[k]]), 'puasa');
    const tanggalI = T.input('date', '', todayISO());
    const catI = T.input('text', 'Catatan, cth: habis makan nasi padang (boleh kosong)', '');
    const ringkasBox = T.out();
    const trenBox = T.out();
    const logBox = T.out();

    // Selalu kembalikan string aman: input non-string / tanggal tidak valid
    // tidak pernah dikembalikan mentah (RT2-03: jalur XSS via fmtTgl).
    const fmtTgl = (iso) => {
      if (typeof iso !== 'string') return 'tanggal tidak valid';
      const d = new Date(iso + 'T00:00:00');
      if (isNaN(d.getTime())) return 'tanggal tidak valid';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const paint = () => {
      if (!log.length) {
        T.show(ringkasBox, '<p class="center mut">Belum ada catatan — isi pengukuran pertamamu di atas.</p>');
        T.hide(trenBox);
        T.hide(logBox);
        return;
      }
      const urut = [...log].sort((a, b) => (a.tanggal + (a.ts || 0)) > (b.tanggal + (b.ts || 0)) ? 1 : -1);
      const terakhir = urut[urut.length - 1];
      const nilaiTerakhir = nilaiGula(terakhir.nilai, terakhir.kondisi);
      const puasa = log.filter((e) => e.kondisi === 'puasa');
      const makan = log.filter((e) => e.kondisi === 'setelah-makan');
      const rata = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b.nilai, 0) / arr.length) : null;
      const rPuasa = rata(puasa), rMakan = rata(makan);
      let saran = '';
      if (nilaiTerakhir.status === 'rendah') {
        saran = '<p class="err">⚠️ Gula darah terakhir rendah (di bawah 70). Kalau merasa lemas, berkeringat, atau gemetar, ikuti anjuran doktermu dan segera cari bantuan bila tidak membaik.</p>';
      } else if (terakhir.nilai > 250) {
        saran = '<p class="err">⚠️ Gula darah terakhir sangat tinggi (di atas 250). Sebaiknya segera konsultasi ke dokter, apalagi kalau disertai mual, napas cepat, atau sangat haus.</p>';
      } else if (nilaiTerakhir.status !== 'normal') {
        saran = '<p class="warn">Hasil terakhir di luar rentang normal umum. Catat polanya beberapa hari dan diskusikan dengan doktermu.</p>';
      }
      T.show(ringkasBox,
        '<div class="big center">' + terakhir.nilai + ' <span class="mut" style="font-size:15px">mg/dL</span></div>' +
        '<p class="center ' + nilaiTerakhir.kelas + '">' + T.esc(nilaiTerakhir.label) + ' · ' + T.esc(KONDISI[terakhir.kondisi] || terakhir.kondisi) + ' · ' + T.esc(fmtTgl(terakhir.tanggal)) + '</p>' +
        kv('Total catatan', log.length + ' kali') +
        (rPuasa != null ? kv('Rata-rata puasa', rPuasa + ' mg/dL (' + puasa.length + ' catatan)') : '') +
        (rMakan != null ? kv('Rata-rata 2 jam setelah makan', rMakan + ' mg/dL (' + makan.length + ' catatan)') : '') +
        saran);

      // Tren sederhana: 10 catatan terakhir sebagai batang.
      const tren = urut.slice(-10);
      const maks = Math.max(...tren.map((e) => e.nilai), 100);
      let batang = '';
      tren.forEach((e) => {
        const n = nilaiGula(e.nilai, e.kondisi);
        const warna = n.status === 'normal' ? 'var(--ok)' : n.status === 'waspada' ? 'var(--warn)' : 'var(--err)';
        batang += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">' +
          '<div style="font-size:11px;font-weight:700">' + e.nilai + '</div>' +
          '<div style="width:100%;height:80px;display:flex;align-items:flex-end"><div style="width:100%;height:' + Math.max(6, Math.round(e.nilai / maks * 100)) + '%;background:' + warna + ';border-radius:4px 4px 0 0"></div></div>' +
          '<div style="font-size:10px;color:var(--mut);text-align:center;line-height:1.3">' + T.esc(fmtTgl(e.tanggal).replace(/ \d{4}$/, '')) + '<br>' + (e.kondisi === 'puasa' ? 'puasa' : e.kondisi === 'setelah-makan' ? '2j stlh mkn' : e.kondisi === 'sebelum-tidur' ? 'sblm tdr' : 'sewaktu') + '</div></div>';
      });
      T.show(trenBox, '<p class="hint" style="margin-bottom:6px">Tren 10 catatan terakhir (hijau = normal, kuning = waspada, merah = tinggi/rendah)</p>' +
        '<div style="display:flex;gap:6px;align-items:flex-end">' + batang + '</div>');

      // Batas tampil 200 entri terbaru (P4-06, pola yang sama dengan
      // timer-kontraksi pasca-RT2-06): membangun ribuan baris DOM saja
      // sudah membekukan UI. Ringkasan & tren di atas tetap memakai
      // SEMUA entri — yang dibatasi hanya baris daftarnya.
      // Indeks hapus diambil dari Map sekali jalan (O(1) per baris),
      // bukan log.indexOf(e) di dalam loop (O(n²) — 3.000 entri butuh
      // ~9 juta perbandingan).
      const MAKS_RIWAYAT = 200;
      const idxLog = new Map(log.map((e, i) => [e, i]));
      const terbaru = [...urut].reverse().slice(0, MAKS_RIWAYAT);
      let html = '<p class="hint" style="margin-bottom:6px">Semua catatan (terbaru dulu)</p>';
      terbaru.forEach((e) => {
        const n = nilaiGula(e.nilai, e.kondisi);
        html += '<div class="kv"><span class="k">' + T.esc(fmtTgl(e.tanggal)) + ' · ' + T.esc(KONDISI[e.kondisi] || e.kondisi) + (e.catatan ? ' · ' + T.esc(e.catatan) : '') + '</span>' +
          '<span class="v ' + n.kelas + '">' + e.nilai + ' mg/dL <button type="button" class="btn small" data-i="' + idxLog.get(e) + '" aria-label="Hapus catatan ' + e.nilai + ' mg/dL tanggal ' + T.esc(e.tanggal) + '">hapus</button></span></div>';
      });
      if (log.length > MAKS_RIWAYAT) {
        html += '<p class="hint">Menampilkan 200 catatan terbaru dari total ' + T.fmt(log.length) + ' — yang lebih lama tetap tersimpan.</p>';
      }
      T.show(logBox, html);
      logBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        log.splice(+b.dataset.i, 1); save(); paint(); T.toast('Catatan dihapus');
      }));
      save();
    };

    const tambah = () => {
      const nilai = T.num(nilaiI.value);
      if (!Number.isInteger(nilai) || nilai < 20 || nilai > 600) {
        T.toast('Isi gula darah dengan bilangan bulat 20–600 mg/dL'); return;
      }
      if (!tanggalI.value) { T.toast('Pilih tanggal pengukuran dulu'); return; }
      log.push({ nilai, kondisi: kondisiI.value, tanggal: tanggalI.value, catatan: catI.value.trim(), ts: Date.now() });
      save();
      nilaiI.value = ''; catI.value = '';
      T.toast('Catatan tersimpan');
      paint();
    };

    root.appendChild(T.el('<p class="note">Catat hasil pengukuran gula darahmu tiap hari biar polanya kelihatan — puasa, 2 jam setelah makan, atau sewaktu. Semua tersimpan di HP ini saja.</p>'));
    root.appendChild(T.grid2(
      T.field('Gula darah (mg/dL)', nilaiI, 'Angka dari alat ukurmu.'),
      T.field('Waktu pengukuran', kondisiI)
    ));
    root.appendChild(T.grid2(
      T.field('Tanggal', tanggalI),
      T.field('Catatan (boleh kosong)', catI)
    ));
    root.appendChild(T.row(
      T.btn('＋ Simpan Catatan', tambah, true),
      T.btn('Hapus semua', () => { log = []; save(); paint(); T.toast('Semua catatan dihapus'); })
    ));
    root.appendChild(ringkasBox);
    root.appendChild(trenBox);
    root.appendChild(logBox);
    root.appendChild(T.el('<p class="warn" style="font-size:13px;line-height:1.6">ℹ️ Ambang di tool ini adalah <b>info umum</b> (rujukan umum: puasa normal di bawah 100 mg/dL; 2 jam setelah makan normal di bawah 140 mg/dL) — <b>bukan diagnosis</b>. Target tiap orang bisa beda sesuai anjuran dokter. Kalau hasilmu sering di luar ambang, atau merasa tidak enak badan, konsultasikan ke dokter.</p>'));
    paint();

}
