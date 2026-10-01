import { h as T, utils, esc } from '../../core.js?v=4.2.0';

export const meta = {"id": "typing-test", "name": "Tes Mengetik", "cat": "pelajar", "icon": "🚀", "desc": "Kecepatan mengetik Indonesia."};

export function render(root) {

    const TEKS = [
      'Pagi ini matahari bersinar cerah dan burung-burung berkicau riang di dahan pohon mangga depan rumah.',
      'Belajar mengetik dengan cepat membutuhkan latihan rutin setiap hari agar jari terbiasa dengan posisi tombol.',
      'Indonesia adalah negara kepulauan terbesar di dunia dengan ribuan pulau yang membentang dari Sabang sampai Merauke.',
      'Teknologi berkembang sangat pesat sehingga kita harus terus belajar agar tidak tertinggal oleh zaman.',
      'Secangkir kopi hangat dan sepotong roti bakar menjadi teman setia saat mengerjakan tugas hingga larut malam.',
      'Gotong royong adalah budaya luhur bangsa Indonesia yang mengajarkan kita untuk saling membantu sesama.',
      'Hujan turun dengan derasnya sore itu, membuat jalanan basah dan udara terasa sejuk menyegarkan.',
      'Membaca buku setiap hari dapat memperluas wawasan dan melatih kemampuan berpikir secara kritis.',
      'Pantai di Bali terkenal dengan pasir putihnya yang lembut dan ombak yang cocok untuk berselancar.',
      'Disiplin waktu adalah kunci keberhasilan, karena waktu yang sudah berlalu tidak akan pernah kembali lagi.',
    ];
    const mode = T.select([['waktu', '⏱ 60 detik'], ['paragraf', '📝 1 paragraf sampai selesai']], 'waktu');
    const teksEl = T.el('<div class="out" style="font-size:16px;line-height:1.9;margin-bottom:10px"></div>');
    const ketik = T.ta(3, 'Klik di sini lalu ketik teks di atas…');
    const stat = T.out();
    let target = '', mulai = false, t0 = 0, iv = null, dur = 60;
    T.onLeave(() => { if (iv) clearInterval(iv); });
    const acakTeks = () => {
      if (mode.value === 'waktu') return TEKS[Math.floor(Math.random() * TEKS.length)];
      const i = Math.floor(Math.random() * TEKS.length);
      return TEKS[i] + ' ' + TEKS[(i + 3) % TEKS.length] + ' ' + TEKS[(i + 6) % TEKS.length];
    };
    const paint = () => {
      const val = ketik.value;
      let html = '';
      for (let i = 0; i < target.length; i++) {
        const c = target[i];
        let cls = '';
        if (i < val.length) cls = val[i] === c ? 'ok' : 'err';
        else if (i === val.length) cls = 'info';
        html += '<span class="' + cls + '"' + (i === val.length ? ' style="border-left:2px solid var(--info)"' : '') + '>' + esc(c) + '</span>';
      }
      teksEl.innerHTML = html;
    };
    const statistik = () => {
      const val = ketik.value;
      const elapsed = Math.max(1, (performance.now() - t0) / 1000);
      let benar = 0;
      for (let i = 0; i < Math.min(val.length, target.length); i++) if (val[i] === target[i]) benar++;
      const wpm = Math.round((benar / 5) / Math.max(elapsed / 60, 1 / 60));
      const akurasi = val.length ? Math.round((benar / val.length) * 100) : 100;
      return { wpm, akurasi, benar, salah: val.length - benar, elapsed: Math.round(elapsed) };
    };
    const finish = () => {
      if (iv) { clearInterval(iv); iv = null; }
      const s = statistik();
      T.show(stat,
        '<div class="center"><div class="dim">Hasil tes mengetik</div>' +
        '<div class="big">' + s.wpm + ' <span style="font-size:14px">WPM</span></div></div>' +
        '<div class="kv"><span class="k">Akurasi</span><span class="v">' + s.akurasi + '%</span></div>' +
        '<div class="kv"><span class="k">Karakter benar</span><span class="v ok">' + s.benar + '</span></div>' +
        '<div class="kv"><span class="k">Karakter salah</span><span class="v err">' + s.salah + '</span></div>' +
        '<div class="kv"><span class="k">Waktu</span><span class="v">' + s.elapsed + ' detik</span></div>');
      T.beep(880, 0.2); T.beep(1100, 0.3, 'sine', 0.2);
      mulai = false;
    };
    const reset = () => {
      if (iv) { clearInterval(iv); iv = null; }
      target = acakTeks();
      ketik.value = '';
      mulai = false;
      T.hide(stat);
      paint();
    };
    ketik.addEventListener('input', () => {
      if (!mulai && ketik.value.length > 0) {
        mulai = true; t0 = performance.now();
        if (mode.value === 'waktu') {
          let sisa = dur;
          iv = setInterval(() => {
            sisa--;
            if (sisa <= 0) finish();
          }, 1000);
        }
      }
      paint();
      if (mulai && mode.value === 'paragraf' && ketik.value === target) finish();
    });
    mode.addEventListener('change', reset);
    root.appendChild(T.field('Mode tes', mode));
    root.appendChild(teksEl);
    root.appendChild(T.field('Ketik di sini', ketik));
    root.appendChild(T.row(T.btn('↺ Teks baru', reset), T.btn('⏹ Selesai', () => { if (mulai) finish(); else T.toast('Mulai mengetik dulu'); })));
    root.appendChild(stat);
    T.hide(stat);
    reset();
  
}
