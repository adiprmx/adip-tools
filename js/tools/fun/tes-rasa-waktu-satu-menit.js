import { h as T, onLeave } from '../../core.js';

export const meta = {"id": "tes-rasa-waktu-satu-menit", "name": "Tes Rasa Waktu 1 Menit", "cat": "fun", "icon": "⏱️", "desc": "Seberapa akurat perasaanmu soal waktu? Tekan mulai, lalu tekan berhenti saat menurutmu 1 menit sudah lewat.", "keywords": "rasa waktu,tes waktu,satu menit,stopwatch,perasaan waktu,akurasi", "since": "6.19.0"};

export const TARGET_MS = 60000;

// Nilai hasil tes dari waktu yang diukur (milidetik). Murni, bisa diuji.
export function nilaiRasaWaktu(ms) {
  const selisihMs = ms - TARGET_MS;
  const selisihDetik = Math.round(selisihMs / 100) / 10;
  const absDetik = Math.abs(selisihDetik);
  const persen = Math.round((Math.abs(selisihMs) / TARGET_MS) * 1000) / 10;
  let nilai, pesan;
  if (absDetik <= 2) { nilai = 'Luar biasa akurat'; pesan = 'Perasaan waktumu tajam sekali. Selisihnya cuma ' + absDetik.toString().replace('.', ',') + ' detik.'; }
  else if (absDetik <= 5) { nilai = 'Sangat bagus'; pesan = 'Hanya meleset ' + absDetik.toString().replace('.', ',') + ' detik dari 60 detik.'; }
  else if (absDetik <= 10) { nilai = 'Bagus'; pesan = 'Meleset ' + absDetik.toString().replace('.', ',') + ' detik. Kebanyakan orang meleset lebih jauh.'; }
  else if (absDetik <= 20) { nilai = 'Lumayan'; pesan = 'Meleset ' + absDetik.toString().replace('.', ',') + ' detik. Coba lagi dengan menghitung pelan di kepala.'; }
  else { nilai = 'Perlu latihan'; pesan = 'Meleset ' + absDetik.toString().replace('.', ',') + ' detik. Coba hitung detik dengan ritme tetap.'; }
  const arah = selisihMs > 0 ? 'terlambat' : selisihMs < 0 ? 'terlalu cepat' : 'pas';
  return { selisihDetik: Object.is(selisihDetik, -0) ? 0 : selisihDetik, absDetik, persen: Object.is(persen, -0) ? 0 : persen, nilai, pesan, arah };
}

export function render(root) {
  const box = T.out();
  const hasilBox = T.out();
  let mulaiMs = null;
  let timerId = null;
  let terbaik = null;

  const mulaiBtn = T.btn('Mulai', () => {
    if (mulaiMs !== null) { berhenti(); return; }
    mulaiMs = performance.now();
    mulaiBtn.textContent = 'Berhenti! Sudah 1 menit';
    T.show(box, '<p class="big center" style="font-size:40px">🤫</p><p class="center hint">Jam disembunyikan. Tekan tombol saat menurutmu 1 menit sudah lewat.</p>');
    T.show(hasilBox, '');
    timerId = setTimeout(() => {
      if (mulaiMs !== null) {
        T.show(box, '<p class="center hint">Masih berjalan. Jangan mengintip jam lain ya.</p>');
      }
    }, 30000);
  }, true);

  const berhenti = () => {
    if (mulaiMs === null) return;
    const ms = performance.now() - mulaiMs;
    mulaiMs = null;
    if (timerId) { clearTimeout(timerId); timerId = null; }
    mulaiBtn.textContent = 'Coba lagi';
    const r = nilaiRasaWaktu(ms);
    const waktuTampil = (Math.round(ms / 100) / 10).toString().replace('.', ',');
    if (terbaik === null || r.absDetik < terbaik) terbaik = r.absDetik;
    const terbaikTampil = terbaik.toString().replace('.', ',');
    T.show(box, '<p class="big center">' + waktuTampil + ' detik</p>' +
      '<p class="center hint">Kamu ' + r.arah + ' ' + r.absDetik.toString().replace('.', ',') + ' detik dari 60 detik (' + r.persen.toString().replace('.', ',') + '%).</p>' +
      '<p class="center"><b>' + r.nilai + '</b></p><p class="center hint">' + r.pesan + '</p>' +
      '<p class="center hint">Selisih terbaikmu sesi ini: ' + terbaikTampil + ' detik.</p>');
  };

  onLeave(() => { if (timerId) clearTimeout(timerId); });

  root.appendChild(T.el('<p class="hint">Tes ini mengukur perasaanmu soal waktu tanpa melihat jam. Tekan "Mulai", rasakan 1 menit berlalu, lalu tekan tombol yang sama saat menurutmu waktunya sudah pas.</p>'));
  root.appendChild(mulaiBtn);
  root.appendChild(box);
  root.appendChild(hasilBox);
  T.show(box, '<p class="hint">Tekan "Mulai" untuk memulai tes. Jangan membuka jam lain selama tes berjalan.</p>');
}
