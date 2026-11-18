import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"kuis-trivia","name":"Kuis Trivia","cat":"liveapi","icon":"🧠","desc":"Kuis pilihan ganda dari berbagai topik. Jawab, lihat skor, main lagi.","keywords":"kuis,trivia,soal,pilihan ganda,tebak,game","since":"6.16.0"};

const API = 'https://opentdb.com/api.php';
const KATEGORI_CADANGAN = [
  ['', 'Semua topik'],
  ['9', 'Pengetahuan umum'], ['10', 'Buku'], ['11', 'Film'], ['12', 'Musik'],
  ['14', 'Televisi'], ['15', 'Game'], ['17', 'Sains dan alam'], ['18', 'Komputer'],
  ['19', 'Matematika'], ['21', 'Olahraga'], ['22', 'Geografi'], ['23', 'Sejarah'],
  ['25', 'Seni'], ['27', 'Hewan'], ['28', 'Kendaraan'],
];

function decodeHtml(s) {
  const doc = new DOMParser().parseFromString(String(s || ''), 'text/html');
  return doc.body.textContent || '';
}

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function render(root) {
  const box = T.out();
  const selKat = T.select(KATEGORI_CADANGAN, '');
  const selSulit = T.select([['', 'Campur'], ['easy', 'Mudah'], ['medium', 'Sedang'], ['hard', 'Sulit']], '');
  let terakhirMinta = 0;
  let soal = [];
  let idx = 0;
  let skor = 0;
  let sudahJawab = false;

  const barisSkor = () => 'Skor: ' + skor + ' dari ' + soal.length + ' soal';

  const tampilSoal = () => {
    sudahJawab = false;
    const s = soal[idx];
    const jawaban = acak([s.correct_answer].concat(s.incorrect_answers || []));
    let html = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">' +
      '<div class="dim">Soal ' + (idx + 1) + ' dari ' + soal.length + ' · ' + esc(decodeHtml(s.category)) + '</div>' +
      '<div id="skor-trivia" style="font-weight:700">' + esc(barisSkor()) + '</div></div>' +
      '<div style="font-weight:700;font-size:16px;line-height:1.5;margin:12px 0">' + esc(decodeHtml(s.question)) + '</div>' +
      '<div id="opsi-trivia" style="display:flex;flex-direction:column;gap:8px">';
    jawaban.forEach((j) => {
      html += '<button type="button" class="btn" data-jwb="' + esc(j) + '" style="text-align:left;white-space:normal">' + esc(decodeHtml(j)) + '</button>';
    });
    html += '</div><div id="hasil-trivia" style="margin-top:12px"></div>';
    T.show(box, html);
    const wadahHasil = box.querySelector('#hasil-trivia');
    const tombolSkor = box.querySelector('#skor-trivia');
    box.querySelectorAll('#opsi-trivia button').forEach((b) => {
      b.addEventListener('click', () => {
        if (sudahJawab) return;
        sudahJawab = true;
        const dipilih = b.getAttribute('data-jwb');
        const benar = dipilih === s.correct_answer;
        if (benar) skor += 1;
        tombolSkor.textContent = barisSkor();
        box.querySelectorAll('#opsi-trivia button').forEach((x) => {
          x.disabled = true;
          if (x.getAttribute('data-jwb') === s.correct_answer) {
            x.style.borderColor = '#22c55e'; x.style.color = '#22c55e';
          } else if (x === b) {
            x.style.borderColor = '#ef4444'; x.style.color = '#ef4444';
          }
        });
        let verdict = benar
          ? '<div style="font-weight:800;font-size:16px;color:#22c55e">Benar!</div>'
          : '<div style="font-weight:800;font-size:16px;color:#ef4444">Kurang tepat.</div><div style="margin-top:4px">Jawaban yang benar: <b>' + esc(decodeHtml(s.correct_answer)) + '</b></div>';
        verdict += '<div class="dim" style="margin-top:4px">' + esc(barisSkor()) + '</div>';
        wadahHasil.innerHTML = verdict;
        const lanjut = T.btn(idx + 1 < soal.length ? 'Soal berikutnya' : 'Lihat hasil akhir', () => {
          idx += 1;
          if (idx < soal.length) tampilSoal();
          else tampilAkhir();
        }, true);
        const wr = T.el('<div style="margin-top:10px"></div>');
        wr.appendChild(lanjut);
        wadahHasil.appendChild(wr);
      });
    });
  };

  const tampilAkhir = () => {
    const pesan = skor === soal.length ? 'Sempurna, semua benar!' : skor >= Math.ceil(soal.length / 2) ? 'Bagus, lanjutkan!' : 'Tidak apa-apa, coba lagi.';
    T.show(box,
      '<div class="center"><div class="dim">Kuis selesai</div>' +
      '<div class="big" style="margin:8px 0">' + esc(barisSkor()) + '</div>' +
      '<div>' + esc(pesan) + '</div></div>');
    const wr = T.el('<div class="center" style="margin-top:12px"></div>');
    wr.appendChild(T.btn('🔄 Main lagi', mulai, true));
    box.appendChild(wr);
  };

  const mulai = async () => {
    const sekarang = Date.now();
    if (sekarang - terakhirMinta < 5000) {
      T.show(box, '<p class="dim center">Tunggu sebentar, soal baru hanya bisa diminta tiap 5 detik.</p>');
      return;
    }
    terakhirMinta = sekarang;
    T.show(box, '<p class="mut">Mengambil soal baru…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      let url = API + '?amount=5&type=multiple';
      if (selKat.value) url += '&category=' + encodeURIComponent(selKat.value);
      if (selSulit.value) url += '&difficulty=' + encodeURIComponent(selSulit.value);
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || !Array.isArray(j.results) || !j.results.length) {
        T.show(box, '<p class="center dim">Tidak ada soal untuk kombinasi topik dan tingkat itu.</p><p class="hint center">Coba topik lain atau tingkat campur.</p>');
        return;
      }
      soal = j.results; idx = 0; skor = 0;
      tampilSoal();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server kuis tidak merespons dalam 15 detik.'
        : 'Gagal ambil soal. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', mulai));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  const muatKategori = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const r = await fetch('https://opentdb.com/api_category.php', { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const list = j && Array.isArray(j.trivia_categories) ? j.trivia_categories : [];
      if (!list.length) return;
      selKat.innerHTML = '';
      const o0 = document.createElement('option');
      o0.value = ''; o0.textContent = 'Semua topik';
      selKat.appendChild(o0);
      list.forEach((c) => {
        const o = document.createElement('option');
        o.value = String(c.id); o.textContent = decodeHtml(c.name);
        selKat.appendChild(o);
      });
    } catch (e) {
      // Daftar cadangan tetap dipakai.
    } finally { clearTimeout(timer); }
  };

  root.appendChild(T.field('Topik', selKat));
  root.appendChild(T.field('Tingkat kesulitan', selSulit));
  root.appendChild(T.row(T.btn('▶️ Mulai kuis', mulai, true)));
  root.appendChild(box);
  muatKategori();
}
