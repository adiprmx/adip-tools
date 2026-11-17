import { h as T, kv } from '../../core.js';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM.
   Entri log: { mulai: ms, selesai: ms|null }. */

/** Cek aturan 5-1-1: kontraksi tiap ≤5 menit, durasi ≥1 menit, selama 1 jam.
    Mengembalikan { memenuhi, kontraksiSejam, alasan }. */
export function cekAturan511(entri, sekarang) {
  const selesai = entri.filter((e) => e.selesai).sort((a, b) => a.mulai - b.mulai);
  const sejamLalu = (sekarang || Date.now()) - 60 * 60 * 1000;
  const sejam = selesai.filter((e) => e.mulai >= sejamLalu);
  const yangMemenuhi = sejam.filter((e) => (e.selesai - e.mulai) >= 55 * 1000);
  // Jarak antar kontraksi dihitung dari awal ke awal.
  let jarakRata = null;
  if (yangMemenuhi.length >= 2) {
    const jarak = [];
    for (let i = 1; i < yangMemenuhi.length; i++) {
      jarak.push(yangMemenuhi[i].mulai - yangMemenuhi[i - 1].mulai);
    }
    jarakRata = jarak.reduce((a, b) => a + b, 0) / jarak.length;
  }
  const memenuhi = yangMemenuhi.length >= 6 && jarakRata != null && jarakRata <= 6 * 60 * 1000;
  return {
    memenuhi,
    kontraksiSejam: yangMemenuhi.length,
    jarakRataMenit: jarakRata == null ? null : jarakRata / 60000,
    alasan: memenuhi
      ? 'Pola 5-1-1 terpenuhi: ' + yangMemenuhi.length + ' kontraksi dalam 1 jam terakhir, jarak rata-rata ' + (jarakRata / 60000).toFixed(1).replace('.', ',') + ' menit, tiap kontraksi sekitar 1 menit atau lebih.'
      : yangMemenuhi.length === 0
        ? 'Belum ada kontraksi yang tercatat 1 jam terakhir.'
        : 'Baru ' + yangMemenuhi.length + ' kontraksi (durasi ≥1 menit) dalam 1 jam terakhir — aturan 5-1-1 butuh pola tiap 5 menit selama 1 jam.',
  };
}

/** Format milidetik jadi "1 mnt 5 dtk" / "45 dtk". */
export function formatDurasi(ms) {
  if (!Number.isFinite(ms)) return '—';
  const total = Math.max(0, Math.round(ms / 1000));
  const mnt = Math.floor(total / 60), dtk = total % 60;
  if (mnt === 0) return dtk + ' dtk';
  return mnt + ' mnt ' + dtk + ' dtk';
}

const jamID = (ts) => {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const meta = {"id": "timer-kontraksi", "name": "Timer Kontraksi", "cat": "sehari", "icon": "🤰", "desc": "Catat durasi & jarak kontraksi melahirkan + cek aturan 5-1-1 kapan ke rumah sakit.", "keywords": "kontraksi,melahirkan,hamil,persalinan,5-1-1,timer,rumah sakit,bidan", "since": "6.13.0"};
export function render(root) {

    const K = 'adip.kontraksi.v1';
    // Validasi saat baca: mulai/selesai wajib angka finite yang membentuk
    // tanggal valid — entri rusak dilewati (RT2-08: selesai "abc" tampil
    // "NaN mnt NaN dtk", mulai 1e20 tampil "Invalid Date"). Selesai boleh
    // null (kontraksi sedang berjalan).
    const tsOk = (v) => typeof v === 'number' && Number.isFinite(v) && !isNaN(new Date(v).getTime());
    const load = () => {
      try {
        const a = JSON.parse(localStorage.getItem(K) || '[]');
        if (!Array.isArray(a)) return [];
        return a.filter((e) => e && tsOk(e.mulai) && (e.selesai == null || tsOk(e.selesai)));
      } catch (e) { return []; }
    };
    const save = () => { try { localStorage.setItem(K, JSON.stringify(log)); } catch (e) {} };

    let log = load();
    // Bila halaman ditutup saat kontraksi berjalan, tutup entri itu di waktu terakhir tercatat.
    const berjalan = log.find((e) => !e.selesai);
    if (berjalan) { berjalan.selesai = Date.now(); save(); }
    let aktif = null;

    const timerEl = T.el('<div class="big center">00:00</div>');
    const statusEl = T.el('<p class="center mut">Belum ada kontraksi berjalan.</p>');
    const tombolMulai = T.btn('▶ Mulai Kontraksi', null, true);
    const tombolSelesai = T.btn('⏹ Selesai', null);
    tombolSelesai.disabled = true;
    const ringkasBox = T.out();
    const logBox = T.out();

    const tick = () => {
      if (!aktif) return;
      const ms = Date.now() - aktif.mulai;
      timerEl.textContent = String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    };
    const iv = setInterval(tick, 500);
    T.onLeave(() => clearInterval(iv));

    const paint = () => {
      const selesai = log.filter((e) => e.selesai).sort((a, b) => b.mulai - a.mulai);
      const hasil511 = cekAturan511(log, Date.now());
      let ringkas = '';
      if (selesai.length >= 2) {
        const durasi = selesai.map((e) => e.selesai - e.mulai);
        const durasiRata = durasi.reduce((a, b) => a + b, 0) / durasi.length;
        const urut = [...selesai].sort((a, b) => a.mulai - b.mulai);
        const jarak = [];
        for (let i = 1; i < urut.length; i++) jarak.push(urut[i].mulai - urut[i - 1].mulai);
        const jarakRata = jarak.reduce((a, b) => a + b, 0) / jarak.length;
        ringkas = kv('Kontraksi tercatat', selesai.length + ' kali') +
          kv('Durasi rata-rata', formatDurasi(durasiRata)) +
          kv('Jarak rata-rata antar kontraksi', formatDurasi(jarakRata));
      } else if (selesai.length === 1) {
        ringkas = kv('Kontraksi tercatat', '1 kali') + kv('Durasi', formatDurasi(selesai[0].selesai - selesai[0].mulai));
      }
      const peringatan = selesai.some((e) => (e.selesai - e.mulai) > 90 * 1000)
        ? '<p class="warn">⚠️ Ada kontraksi yang berlangsung lebih dari 1,5 menit. Kalau ini berulang atau disertai pendarahan, air ketuban pecah, atau gerakan janin berkurang, segera hubungi bidan/dokter.</p>'
        : '';
      const banner511 = hasil511.memenuhi
        ? '<p class="err" style="font-size:15px">🏥 <b>Saatnya ke rumah sakit / hubungi bidan.</b> ' + T.esc(hasil511.alasan) + '</p>'
        : '<p class="hint">Aturan 5-1-1: kontraksi tiap 5 menit, masing-masing 1 menit, selama 1 jam — itu tanda umumnya sudah waktunya ke RS. ' + T.esc(hasil511.alasan) + '</p>';
      T.show(ringkasBox, ringkas + peringatan + banner511);

      if (!selesai.length && !aktif) {
        T.show(logBox, '<p class="center mut">Belum ada catatan. Tekan "Mulai Kontraksi" saat kontraksi terasa.</p>');
        return;
      }
      let html = '<p class="hint" style="margin-bottom:6px">Riwayat kontraksi (terbaru dulu)</p>';
      // Sort SEKALI di luar loop + jarak dihitung dari entri sebelumnya
      // dalam satu jalan (RT2-06: sort + indexOf di dalam loop = O(n²);
      // 3.000 entri butuh 3,6 dtk). Baris dibangun menaik lalu dibalik.
      // Batas tampil 200 entri terbaru: membangun 3.000 baris DOM saja
      // masih membekukan ~1,3 dtk. Ringkasan & aturan 5-1-1 di atas tetap
      // memakai SEMUA entri — yang dibatasi hanya baris riwayatnya.
      const MAKS_RIWAYAT = 200;
      const urutNaik = [...selesai].sort((a, b) => a.mulai - b.mulai);
      // Hanya 200 baris terbaru yang dibangun jadi string DOM; jarak tiap
      // baris tetap dihitung dari pendahulunya di daftar LENGKAP (indeks i).
      const awalTampil = Math.max(0, urutNaik.length - MAKS_RIWAYAT);
      const barisTampil = [];
      for (let i = urutNaik.length - 1; i >= awalTampil; i--) {
        const e = urutNaik[i];
        const jarak = i > 0 ? formatDurasi(e.mulai - urutNaik[i - 1].mulai) : '—';
        barisTampil.push('<div class="kv"><span class="k">' + jamID(e.mulai) + ' · ' + formatDurasi(e.selesai - e.mulai) + '</span>' +
          '<span class="v">jarak dari sebelumnya: ' + jarak + '</span></div>');
      }
      html += barisTampil.join('');
      if (urutNaik.length > MAKS_RIWAYAT) {
        html += '<p class="hint">Menampilkan ' + MAKS_RIWAYAT + ' kontraksi terbaru dari total ' + T.fmt(urutNaik.length) + ' — yang lebih lama tetap tersimpan.</p>';
      }
      T.show(logBox, html);
    };

    tombolMulai.addEventListener('click', () => {
      if (aktif) return;
      aktif = { mulai: Date.now(), selesai: null };
      log.push(aktif);
      save();
      tombolMulai.disabled = true;
      tombolSelesai.disabled = false;
      statusEl.textContent = 'Kontraksi berjalan… tekan "Selesai" saat sudah reda.';
      tick();
      paint();
    });
    tombolSelesai.addEventListener('click', () => {
      if (!aktif) return;
      aktif.selesai = Date.now();
      if (aktif.selesai - aktif.mulai < 1000) aktif.selesai = aktif.mulai + 1000;
      aktif = null;
      save();
      tombolMulai.disabled = false;
      tombolSelesai.disabled = true;
      timerEl.textContent = '00:00';
      statusEl.textContent = 'Kontraksi tercatat. Siap untuk kontraksi berikutnya.';
      paint();
    });

    root.appendChild(T.el('<p class="note">Tekan <b>Mulai</b> saat kontraksi terasa, tekan <b>Selesai</b> saat reda. Tool ini mencatat durasi dan jarak antar kontraksi, lalu menilai pola 5-1-1. Catatan tersimpan di HP ini saja.</p>'));
    root.appendChild(timerEl);
    root.appendChild(statusEl);
    root.appendChild(T.row(tombolMulai, tombolSelesai));
    root.appendChild(T.row(T.btn('Hapus semua catatan', () => {
      log = []; aktif = null; save();
      tombolMulai.disabled = false; tombolSelesai.disabled = true;
      timerEl.textContent = '00:00';
      statusEl.textContent = 'Belum ada kontraksi berjalan.';
      T.toast('Semua catatan dihapus'); paint();
    })));
    root.appendChild(ringkasBox);
    root.appendChild(logBox);
    root.appendChild(T.el('<p class="warn" style="font-size:13px;line-height:1.6">⚠️ Tool ini hanya membantu mencatat — <b>bukan pengganti nasihat dokter atau bidan</b>. Kalau ragu, pendarahan, ketuban pecah, atau gerakan janin berkurang, segera hubungi tenaga medis. Aturan 5-1-1 adalah panduan umum; bidan/doktermu mungkin memberi panduan berbeda sesuai kondisimu.</p>'));
    paint();

}
