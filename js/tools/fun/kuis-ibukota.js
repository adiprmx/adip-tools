import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"kuis-ibukota","name":"Kuis Ibukota","cat":"fun","icon":"🗺️","desc":"Kuis 10 soal acak: ibukota 38 provinsi Indonesia.","keywords":"ibukota,provinsi,indonesia,kuis,geografi,peta"};

// 38 provinsi Indonesia + ibukotanya
const PROV = [
  ['Aceh', 'Banda Aceh'],
  ['Sumatera Utara', 'Medan'],
  ['Sumatera Barat', 'Padang'],
  ['Riau', 'Pekanbaru'],
  ['Kepulauan Riau', 'Tanjung Pinang'],
  ['Jambi', 'Jambi'],
  ['Sumatera Selatan', 'Palembang'],
  ['Kepulauan Bangka Belitung', 'Pangkal Pinang'],
  ['Bengkulu', 'Bengkulu'],
  ['Lampung', 'Bandar Lampung'],
  ['DKI Jakarta', 'Jakarta'],
  ['Jawa Barat', 'Bandung'],
  ['Banten', 'Serang'],
  ['Jawa Tengah', 'Semarang'],
  ['DI Yogyakarta', 'Yogyakarta'],
  ['Jawa Timur', 'Surabaya'],
  ['Bali', 'Denpasar'],
  ['Nusa Tenggara Barat', 'Mataram'],
  ['Nusa Tenggara Timur', 'Kupang'],
  ['Kalimantan Barat', 'Pontianak'],
  ['Kalimantan Tengah', 'Palangka Raya'],
  ['Kalimantan Selatan', 'Banjarmasin'],
  ['Kalimantan Timur', 'Samarinda'],
  ['Kalimantan Utara', 'Tanjung Selor'],
  ['Sulawesi Utara', 'Manado'],
  ['Sulawesi Tengah', 'Palu'],
  ['Sulawesi Selatan', 'Makassar'],
  ['Sulawesi Tenggara', 'Kendari'],
  ['Gorontalo', 'Gorontalo'],
  ['Sulawesi Barat', 'Mamuju'],
  ['Maluku', 'Ambon'],
  ['Maluku Utara', 'Ternate'],
  ['Papua', 'Jayapura'],
  ['Papua Barat', 'Manokwari'],
  ['Papua Selatan', 'Merauke'],
  ['Papua Tengah', 'Nabire'],
  ['Papua Pegunungan', 'Wamena'],
  ['Papua Barat Daya', 'Sorong'],
];

const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export function render(root) {
  const box = T.out();
  const quiz = { list: [], idx: 0, score: 0, answered: false };

  const buatSoal = () => shuffle(PROV).slice(0, 10).map(([prov, kota]) => {
    const pengecoh = shuffle(PROV.filter((p) => p[1] !== kota)).slice(0, 3).map((p) => p[1]);
    return { prov, kota, opsi: shuffle([kota].concat(pengecoh)) };
  });

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score + '</p>' +
      '<p style="font-size:18px;line-height:1.6">Apa ibukota provinsi <b>' + T.esc(q.prov) + '</b>?</p>' +
      '<div class="row" style="flex-direction:column;align-items:stretch;gap:8px;margin-top:10px">' +
      q.opsi.map((o) => '<button type="button" class="btn opsi">' + T.esc(o) + '</button>').join('') +
      '</div>'
    );
    const btns = box.querySelectorAll('.opsi');
    btns.forEach((b) => b.addEventListener('click', () => jawab(b, btns)));
  };

  const jawab = (btn, btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = btn.textContent === q.kota;
    if (ok) quiz.score++;
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.kota) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.kota || b === btn ? '1' : '0.45';
    });
    const last = quiz.idx >= 9;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= 10) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    const msg = s === 10 ? 'Sempurna! Kamu hafal peta Indonesia luar kepala. 🗺️✨'
      : s >= 8 ? 'Keren banget! Dikit lagi sempurna.'
      : s >= 6 ? 'Lumayan! Provinsi-provinsi baru Papua yang bikin jebakan ya?'
      : s >= 4 ? 'Masih bisa diasah. Coba hafalin yang Papua dulu.'
      : 'Yah… waktunya buka atlas lagi. 😅';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/10</span></div>' +
      '<p class="center">' + msg + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = () => {
    quiz.list = buatSoal();
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };

  root.appendChild(T.el('<p class="hint">Uji hafalanmu: 10 soal acak dari 38 provinsi. Hati-hati sama provinsi-provinsi baru di Papua! 🗺️</p>'));
  root.appendChild(box);
  start();
}
