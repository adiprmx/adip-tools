import { h as T, utils } from '../../core.js';

export const meta = {"id": "kuis-kosakata-inggris", "name": "Kuis Kosakata Inggris", "cat": "pelajar", "icon": "🔤", "desc": "Latihan kosakata bahasa Inggris pilihan ganda, 3 level, 10 soal per ronde.", "keywords": "kosakata,inggris,vocabulary,kuis,latihan,bahasa inggris,soal", "since": "6.19.0"};

// Bank kosakata, ditulis dari pengetahuan umum. [inggris, indonesia, level]
export const KATA = [
  // Dasar
  ['apple', 'apel', 'dasar'], ['book', 'buku', 'dasar'], ['house', 'rumah', 'dasar'],
  ['water', 'air', 'dasar'], ['sun', 'matahari', 'dasar'], ['moon', 'bulan', 'dasar'],
  ['dog', 'anjing', 'dasar'], ['cat', 'kucing', 'dasar'], ['bird', 'burung', 'dasar'],
  ['fish', 'ikan', 'dasar'], ['tree', 'pohon', 'dasar'], ['flower', 'bunga', 'dasar'],
  ['school', 'sekolah', 'dasar'], ['teacher', 'guru', 'dasar'], ['student', 'murid', 'dasar'],
  ['friend', 'teman', 'dasar'], ['family', 'keluarga', 'dasar'], ['mother', 'ibu', 'dasar'],
  ['father', 'ayah', 'dasar'], ['brother', 'saudara laki-laki', 'dasar'], ['sister', 'saudara perempuan', 'dasar'],
  ['child', 'anak', 'dasar'], ['man', 'pria', 'dasar'], ['woman', 'wanita', 'dasar'],
  ['boy', 'anak laki-laki', 'dasar'], ['girl', 'anak perempuan', 'dasar'], ['day', 'hari', 'dasar'],
  ['night', 'malam', 'dasar'], ['morning', 'pagi', 'dasar'], ['afternoon', 'sore', 'dasar'],
  ['week', 'minggu', 'dasar'], ['month', 'bulan', 'dasar'], ['year', 'tahun', 'dasar'],
  ['today', 'hari ini', 'dasar'], ['tomorrow', 'besok', 'dasar'], ['yesterday', 'kemarin', 'dasar'],
  ['food', 'makanan', 'dasar'], ['rice', 'nasi', 'dasar'], ['bread', 'roti', 'dasar'],
  ['milk', 'susu', 'dasar'], ['eat', 'makan', 'dasar'], ['drink', 'minum', 'dasar'],
  ['sleep', 'tidur', 'dasar'], ['run', 'berlari', 'dasar'], ['walk', 'berjalan', 'dasar'],
  ['read', 'membaca', 'dasar'], ['write', 'menulis', 'dasar'], ['speak', 'berbicara', 'dasar'],
  ['listen', 'mendengarkan', 'dasar'], ['happy', 'senang', 'dasar'], ['sad', 'sedih', 'dasar'],
  ['big', 'besar', 'dasar'], ['small', 'kecil', 'dasar'], ['hot', 'panas', 'dasar'],
  ['cold', 'dingin', 'dasar'], ['new', 'baru', 'dasar'], ['old', 'tua', 'dasar'],
  ['good', 'baik', 'dasar'], ['bad', 'buruk', 'dasar'], ['fast', 'cepat', 'dasar'],
  ['slow', 'lambat', 'dasar'],
  // Menengah
  ['bridge', 'jembatan', 'menengah'], ['journey', 'perjalanan', 'menengah'], ['weather', 'cuaca', 'menengah'],
  ['season', 'musim', 'menengah'], ['honest', 'jujur', 'menengah'], ['brave', 'berani', 'menengah'],
  ['patient', 'sabar', 'menengah'], ['careful', 'hati-hati', 'menengah'], ['decide', 'memutuskan', 'menengah'],
  ['explain', 'menjelaskan', 'menengah'], ['promise', 'berjanji', 'menengah'], ['borrow', 'meminjam', 'menengah'],
  ['lend', 'meminjamkan', 'menengah'], ['save', 'menabung', 'menengah'], ['waste', 'membuang-buang', 'menengah'],
  ['improve', 'memperbaiki', 'menengah'], ['discover', 'menemukan', 'menengah'], ['invent', 'menciptakan', 'menengah'],
  ['describe', 'menggambarkan', 'menengah'], ['compare', 'membandingkan', 'menengah'], ['increase', 'meningkat', 'menengah'],
  ['decrease', 'menurun', 'menengah'], ['prepare', 'menyiapkan', 'menengah'], ['attend', 'menghadiri', 'menengah'],
  ['avoid', 'menghindari', 'menengah'], ['believe', 'percaya', 'menengah'], ['doubt', 'ragu', 'menengah'],
  ['guess', 'menebak', 'menengah'], ['remember', 'mengingat', 'menengah'], ['forget', 'lupa', 'menengah'],
  ['kitchen', 'dapur', 'menengah'], ['village', 'desa', 'menengah'], ['city', 'kota', 'menengah'],
  ['country', 'negara', 'menengah'], ['river', 'sungai', 'menengah'], ['mountain', 'gunung', 'menengah'],
  ['ocean', 'samudra', 'menengah'], ['forest', 'hutan', 'menengah'], ['desert', 'gurun', 'menengah'],
  ['island', 'pulau', 'menengah'],
  // Lanjut
  ['courage', 'keberanian', 'lanjut'], ['wisdom', 'kebijaksanaan', 'lanjut'], ['knowledge', 'pengetahuan', 'lanjut'],
  ['freedom', 'kebebasan', 'lanjut'], ['responsibility', 'tanggung jawab', 'lanjut'], ['achievement', 'prestasi', 'lanjut'],
  ['opportunity', 'kesempatan', 'lanjut'], ['challenge', 'tantangan', 'lanjut'], ['environment', 'lingkungan', 'lanjut'],
  ['government', 'pemerintah', 'lanjut'], ['economy', 'ekonomi', 'lanjut'], ['society', 'masyarakat', 'lanjut'],
  ['develop', 'mengembangkan', 'lanjut'], ['establish', 'mendirikan', 'lanjut'], ['require', 'membutuhkan', 'lanjut'],
  ['achieve', 'mencapai', 'lanjut'], ['maintain', 'memelihara', 'lanjut'], ['consider', 'mempertimbangkan', 'lanjut'],
  ['recognize', 'mengenali', 'lanjut'], ['appreciate', 'menghargai', 'lanjut'], ['despite', 'meskipun', 'lanjut'],
  ['although', 'meskipun', 'lanjut'], ['however', 'namun', 'lanjut'], ['therefore', 'oleh karena itu', 'lanjut'],
  ['meanwhile', 'sementara itu', 'lanjut'], ['gradually', 'secara bertahap', 'lanjut'], ['suddenly', 'tiba-tiba', 'lanjut'],
  ['rarely', 'jarang', 'lanjut'], ['frequently', 'sering', 'lanjut'], ['essential', 'mendasar', 'lanjut'],
  ['significant', 'berarti', 'lanjut'], ['enormous', 'sangat besar', 'lanjut'], ['ancient', 'kuno', 'lanjut'],
  ['rare', 'langka', 'lanjut'], ['ordinary', 'biasa', 'lanjut'], ['extraordinary', 'luar biasa', 'lanjut'],
  ['confident', 'percaya diri', 'lanjut'], ['curious', 'penasaran', 'lanjut'], ['generous', 'murah hati', 'lanjut'],
  ['humble', 'rendah hati', 'lanjut'],
];

// Buat satu soal pilihan ganda dari sebuah kata: jawaban benar + 3 pengecoh
// dari level yang sama (atau semua level bila levelnya kurang dari 4 kata).
export function buatPertanyaan(kata, bank) {
  // Pengecoh harus beda kata DAN beda arti (bank punya 'moon'/'month' yang
  // sama-sama 'bulan', dan 'despite'/'although' yang sama-sama 'meskipun').
  const beda = (k) => k[0] !== kata[0] && k[1] !== kata[1];
  const selevel = bank.filter((k) => k[2] === kata[2] && beda(k));
  const sumber = selevel.length >= 3 ? selevel : bank.filter(beda);
  const acak = utils.shuffle(sumber.slice());
  const pengecoh = [];
  acak.forEach((k) => { if (pengecoh.length < 3 && !pengecoh.includes(k[1])) pengecoh.push(k[1]); });
  const opsi = utils.shuffle([kata[1]].concat(pengecoh));
  return { kata: kata[0], arti: kata[1], opsi };
}

export function buatRonde(bank, level, jumlah) {
  const pool = level === 'campur' ? bank.slice() : bank.filter((k) => k[2] === level);
  const acak = utils.shuffle(pool);
  return acak.slice(0, Math.min(jumlah, acak.length)).map((k) => buatPertanyaan(k, bank));
}

export function render(root) {
  const lvI = T.select([['dasar', 'Dasar'], ['menengah', 'Menengah'], ['lanjut', 'Lanjut'], ['campur', 'Campur semua level']], 'dasar');
  const box = T.out();
  let ronde = [];
  let idx = 0;
  let benar = 0;
  let salah = [];

  const tampilSoal = () => {
    if (idx >= ronde.length) {
      let h = '<div class="big">' + benar + ' / ' + ronde.length + '</div>';
      h += '<p class="dim">Nilai ronde ini: ' + Math.round((benar / ronde.length) * 100) + ' dari 100.</p>';
      if (salah.length) {
        h += '<p style="margin-top:10px"><b>Yang perlu dihafal lagi</b></p>';
        salah.forEach(([en, id, pilih]) => {
          h += '<div class="kv"><span class="k">' + T.esc(en) + '</span><span class="v">' + T.esc(id) + ' <span class="dim">(kamu jawab: ' + T.esc(pilih) + ')</span></span></div>';
        });
      } else {
        h += '<p class="hint">Sempurna, semua jawaban benar.</p>';
      }
      h += '<p><button type="button" class="btn primary" id="kuis-ulang">Ronde baru</button></p>';
      T.show(box, h);
      box.querySelector('#kuis-ulang').addEventListener('click', mulai);
      return;
    }
    const s = ronde[idx];
    let h = '<p class="dim">Soal ' + (idx + 1) + ' dari ' + ronde.length + ' · Benar: ' + benar + '</p>';
    h += '<div style="font-size:26px;font-weight:700;margin:8px 0 14px;text-align:center">' + T.esc(s.kata) + '</div>';
    h += '<p class="dim" style="text-align:center">Apa artinya dalam bahasa Indonesia?</p>';
    s.opsi.forEach((o, i) => {
      h += '<button type="button" class="btn" data-opsi="' + i + '" style="display:block;width:100%;margin:6px 0;text-align:left">' + T.esc(o) + '</button>';
    });
    T.show(box, h);
    box.querySelectorAll('[data-opsi]').forEach((b) => {
      b.addEventListener('click', () => {
        const pilih = s.opsi[Number(b.getAttribute('data-opsi'))];
        if (pilih === s.arti) {
          benar++;
          b.style.borderColor = '#4ade80';
        } else {
          salah.push([s.kata, s.arti, pilih]);
          b.style.borderColor = '#f87171';
          box.querySelectorAll('[data-opsi]').forEach((x) => {
            if (s.opsi[Number(x.getAttribute('data-opsi'))] === s.arti) x.style.borderColor = '#4ade80';
          });
        }
        box.querySelectorAll('[data-opsi]').forEach((x) => { x.disabled = true; });
        setTimeout(() => { idx++; tampilSoal(); }, 650);
      });
    });
  };

  const mulai = () => {
    ronde = buatRonde(KATA, lvI.value, 10);
    idx = 0;
    benar = 0;
    salah = [];
    tampilSoal();
  };

  const tombol = T.btn('Mulai kuis', mulai, true);
  lvI.addEventListener('change', mulai);

  const jDasar = KATA.filter((k) => k[2] === 'dasar').length;
  const jMenengah = KATA.filter((k) => k[2] === 'menengah').length;
  const jLanjut = KATA.filter((k) => k[2] === 'lanjut').length;
  root.appendChild(T.el('<p class="note">' + KATA.length + ' kata (dasar ' + jDasar + ', menengah ' + jMenengah + ', lanjut ' + jLanjut + '). Pilih level, lalu jawab 10 soal. Jawaban yang salah dikumpulkan di akhir biar bisa dihafal lagi.</p>'));
  root.appendChild(T.grid2(T.field('Level', lvI)));
  root.appendChild(tombol);
  root.appendChild(box);
  mulai();
}
