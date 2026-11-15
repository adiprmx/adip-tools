import { h as T, kv } from '../../core.js?v=6.12.1';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
const parseTgl = (s) => {
  if (!s) return null;
  const [y, mo, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return isNaN(dt.getTime()) ? null : dt;
};
const tambahHari = (d, n) => new Date(d.getTime() + n * 86400000);

// Perkembangan janin per minggu (ringkas, dari rujukan umum kehamilan).
// Panjang adalah perkiraan rata-rata, tiap janin beda-beda.
const PERKEMBANGAN = [
  [4, 'Jantung mulai terbentuk dan berdenyut. Panjang janin sekitar 2 mm.'],
  [8, 'Semua organ utama mulai terbentuk. Jari tangan dan kaki mulai muncul. Panjang sekitar 1,6 cm.'],
  [12, 'Jari tangan dan kaki sudah terbentuk lengkap. Janin mulai bergerak, meski biasanya belum terasa. Panjang sekitar 5,4 cm.'],
  [16, 'Jenis kelamin mulai bisa terlihat di USG. Janin mulai bisa mendengar suara samar. Panjang sekitar 11,6 cm.'],
  [20, 'Setengah jalan. Janin bisa menelan dan gerakannya mulai terasa. Panjang sekitar 25,6 cm.'],
  [24, 'Paru-paru mulai berkembang. Mata janin sudah bisa membuka. Panjang sekitar 30 cm.'],
  [28, 'Janin merespons cahaya dan suara dari luar. Panjang sekitar 37,6 cm.'],
  [32, 'Tulang mengeras, kecuali tengkorak yang tetap lentur untuk persalinan. Panjang sekitar 42,4 cm.'],
  [36, 'Janin hampir siap lahir, posisi kepala biasanya sudah di bawah. Panjang sekitar 47,4 cm.'],
  [40, 'Cukup bulan. Janin siap lahir kapan saja. Panjang sekitar 51,7 cm.'],
];

export const meta = {"id": "hitung-hpl", "name": "Hitung HPL", "cat": "sehari", "icon": "🤰", "desc": "Perkiraan hari lahir (HPL) + usia kehamilan dari HPHT.", "keywords": "hpl,hari lahir,kehamilan,hpht,naegele,trimester,usg"};
export function render(root) {

    const mode = T.select([
      ['hpht', 'Dari HPHT (hari pertama haid terakhir)'],
      ['usg', 'Dari hasil USG'],
      ['pembuahan', 'Dari tanggal pembuahan'],
      ['ivf', 'Dari transfer embrio (IVF / bayi tabung)'],
    ], 'hpht');
    const tgl = T.input('date');
    const tglUsg = T.input('date');
    const gaMinggu = T.input('text', 'Minggu, cth: 8', '');
    gaMinggu.inputMode = 'numeric';
    const gaHari = T.input('text', 'Hari, cth: 3', '');
    gaHari.inputMode = 'numeric';
    const tglBuah = T.input('date');
    const tglTransfer = T.input('date');
    const embrio = T.select([
      ['3', 'Embrio hari ke-3'],
      ['5', 'Blastokista hari ke-5'],
    ], '5');
    const box = T.out();

    const fHpht = T.field('HPHT', tgl);
    const fUsg = T.field('Tanggal USG', tglUsg);
    const fGa = T.grid2(
      T.field('Usia kehamilan saat USG: minggu', gaMinggu),
      T.field('Usia kehamilan saat USG: hari', gaHari),
    );
    const fBuah = T.field('Tanggal pembuahan', tglBuah);
    const fTransfer = T.field('Tanggal transfer embrio', tglTransfer);
    const fEmbrio = T.field('Umur embrio saat transfer', embrio);

    const toggleMode = () => {
      const m = mode.value;
      fHpht.style.display = m === 'hpht' ? '' : 'none';
      fUsg.style.display = m === 'usg' ? '' : 'none';
      fGa.style.display = m === 'usg' ? '' : 'none';
      fBuah.style.display = m === 'pembuahan' ? '' : 'none';
      fTransfer.style.display = m === 'ivf' ? '' : 'none';
      fEmbrio.style.display = m === 'ivf' ? '' : 'none';
    };
    mode.addEventListener('change', toggleMode);

    const calc = () => {
      const m = mode.value;
      let hpht = null, hpl = null, cara = '';
      if (m === 'hpht') {
        hpht = parseTgl(tgl.value);
        if (!hpht) { T.toast('Pilih tanggal HPHT dulu'); return; }
        // Rumus Naegele: HPHT + 7 hari, − 3 bulan, + 1 tahun
        hpl = new Date(hpht.getTime());
        hpl.setUTCDate(hpl.getUTCDate() + 7);
        hpl.setUTCMonth(hpl.getUTCMonth() - 3);
        hpl.setUTCFullYear(hpl.getUTCFullYear() + 1);
        cara = 'Rumus Naegele: HPHT + 7 hari, dikurangi 3 bulan, ditambah 1 tahun.';
      } else if (m === 'usg') {
        const t = parseTgl(tglUsg.value);
        const mingguGa = T.num(gaMinggu.value) || 0, hariGa = T.num(gaHari.value) || 0;
        if (!t) { T.toast('Pilih tanggal USG dulu'); return; }
        const gaHariTotal = mingguGa * 7 + hariGa;
        if (!(gaHariTotal > 0) || gaHariTotal >= 280) { T.toast('Isi usia kehamilan saat USG yang valid (kurang dari 40 minggu)'); return; }
        hpht = tambahHari(t, -gaHariTotal);
        hpl = tambahHari(t, 280 - gaHariTotal);
        cara = 'HPL dihitung dari usia kehamilan saat USG: tanggal USG ditambah sisa hari sampai 40 minggu (280 hari).';
      } else if (m === 'pembuahan') {
        const t = parseTgl(tglBuah.value);
        if (!t) { T.toast('Pilih tanggal pembuahan dulu'); return; }
        hpht = tambahHari(t, -14);
        hpl = tambahHari(t, 266);
        cara = 'Kehamilan dihitung 266 hari (38 minggu) dari pembuahan.';
      } else {
        const t = parseTgl(tglTransfer.value);
        if (!t) { T.toast('Pilih tanggal transfer embrio dulu'); return; }
        const umurEmbrio = Number(embrio.value);
        // Usia kehamilan saat transfer = 14 hari + umur embrio.
        hpht = tambahHari(t, -(14 + umurEmbrio));
        hpl = tambahHari(t, 280 - (14 + umurEmbrio));
        cara = 'Embrio hari ke-' + umurEmbrio + ' ditransfer saat usia kehamilan ' + (14 + umurEmbrio) + ' hari, jadi HPL = tanggal transfer + ' + (280 - 14 - umurEmbrio) + ' hari.';
      }

      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const diffHari = Math.round((today - hpht) / 86400000);
      // Rentang cukup bulan: 37 minggu 0 hari sampai 41 minggu 6 hari.
      const cukupAwal = tambahHari(hpht, 37 * 7);
      const cukupAkhir = tambahHari(hpht, 42 * 7 - 1);
      const tri2 = tambahHari(hpht, 14 * 7);
      const tri3 = tambahHari(hpht, 28 * 7);
      const sisaHpl = Math.round((hpl - today) / 86400000);
      const sisaHtml = sisaHpl > 0
        ? kv('Sisa waktu menuju HPL', sisaHpl + ' hari lagi')
        : sisaHpl === 0
        ? kv('Sisa waktu menuju HPL', 'Hari ini HPL-nya!')
        : kv('Sisa waktu menuju HPL', 'Sudah lewat ' + (-sisaHpl) + ' hari dari HPL');

      let usiaHtml = '', trimesterHtml = '', janinHtml = '';
      if (diffHari < 0) {
        usiaHtml = '<p class="warn">Tanggalnya masih di masa depan, kehamilannya belum mulai dihitung.</p>';
      } else if (diffHari > 294) {
        usiaHtml = '<p class="err">Sudah lewat 42 minggu. Segera konsultasi ke dokter atau bidan ya.</p>';
      } else {
        const minggu = Math.floor(diffHari / 7);
        const sisa = diffHari % 7;
        const tri = minggu < 14 ? 1 : minggu <= 27 ? 2 : 3;
        usiaHtml = kv('Usia kehamilan', minggu + ' minggu ' + sisa + ' hari');
        trimesterHtml = kv('Trimester', 'Trimester ' + tri + (tri === 1 ? ' (masa pembentukan organ, jaga asupan dan hindari yang berisiko)' : tri === 2 ? ' (biasanya paling nyaman, janin tumbuh pesat)' : ' (persiapan persalinan, kontrol makin rutin)'));
        let tahap = null;
        for (const [w, teks] of PERKEMBANGAN) {
          if (minggu >= w) tahap = { w, teks };
        }
        if (tahap) {
          janinHtml = kv('Perkembangan janin (minggu ke-' + tahap.w + ')', tahap.teks);
        } else {
          janinHtml = kv('Perkembangan janin', 'Kehamilan masih sangat awal, di bawah 4 minggu. Sel telur yang dibuahi sedang menempel di dinding rahim.');
        }
      }

      T.show(box,
        '<div class="big center">' + fmtTgl(hpl) + '</div>' +
        '<p class="center">Hari Perkiraan Lahir (HPL)</p>' +
        usiaHtml + trimesterHtml + janinHtml + sisaHtml +
        kv('HPHT (dihitung)', fmtTgl(hpht)) +
        kv('Masuk trimester 2', fmtTgl(tri2)) +
        kv('Masuk trimester 3', fmtTgl(tri3)) +
        kv('Rentang cukup bulan (37-42 minggu)', fmtTgl(cukupAwal) + ' s.d. ' + fmtTgl(cukupAkhir)) +
        '<p class="hint">' + cara + ' Ini cuma perkiraan kasar, HPL bisa maju atau mundur. ' +
        'Hasil USG trimester pertama biasanya paling akurat. Bayi yang lahir di rentang cukup bulan (37-42 minggu) umumnya sudah siap lahir. Ini perkiraan umum, bukan pengganti saran dokter.</p>');
    };
    tgl.addEventListener('change', calc);
    tglUsg.addEventListener('change', calc);
    tglBuah.addEventListener('change', calc);
    tglTransfer.addEventListener('change', calc);

    root.appendChild(T.el('<p class="note">HPHT = <b>Hari Pertama Haid Terakhir</b>. Dari situ bisa diperkirain kapan si kecil lahir dan usia kehamilan sekarang. Kalau punya hasil USG atau program bayi tabung, pilih modenya di bawah.</p>'));
    root.appendChild(T.field('Hitung dari', mode));
    root.appendChild(fHpht);
    root.appendChild(fUsg);
    root.appendChild(fGa);
    root.appendChild(fBuah);
    root.appendChild(fTransfer);
    root.appendChild(fEmbrio);
    root.appendChild(T.row(T.btn('Hitung HPL', calc, true)));
    root.appendChild(box);
    toggleMode();

}
