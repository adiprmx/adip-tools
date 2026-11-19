import { h as T, utils } from '../../core.js';

export const meta = {"id": "latihan-mengetik", "name": "Latihan Mengetik", "cat": "pelajar", "icon": "⌨️", "desc": "Latihan mengetik bertahap: baris dasar, kata umum, kalimat, sampai angka dan tanda baca.", "keywords": "latihan mengetik,typing,pelajaran,keyboard,kecepatan mengetik,akurasi", "since": "6.19.0"};

const KEY = 'adip-tools:latihan-mengetik';

// Pelajaran berjenjang. Bukan tes waktu. Ini latihan: fokus ke ketepatan,
// kecepatan hanya dicatat sebagai umpan balik setelah satu teks selesai.
export const PELAJARAN = [
  {
    id: 'dasar', nama: '1. Baris dasar', ket: 'Huruf-huruf di baris tengah keyboard (a s d f j k l).',
    teks: [
      'ada asa dada jasa kasa lada salah sadar fajar kadar',
      'dada lala kaka jasa rasa dasa fasa lada salah jalak',
      'salah satu ada fajar di dada jasa lada kasa rasa',
    ],
  },
  {
    id: 'kata', nama: '2. Kata umum', ket: 'Kata-kata Indonesia yang paling sering dipakai.',
    teks: [
      'saya kamu dia kita mereka ini itu dan atau yang di ke dari',
      'rumah makan minum tidur bangun pergi pulang kerja sekolah',
      'hari ini cuaca cerah dan kami pergi ke pasar membeli sayur',
    ],
  },
  {
    id: 'kalimat', nama: '3. Kalimat', ket: 'Kalimat lengkap dengan huruf besar dan titik.',
    teks: [
      'Pagi ini matahari bersinar cerah di atas kota. Burung berkicau di dahan.',
      'Belajar mengetik butuh latihan rutin. Jari akan hafal sendiri letak tombolnya.',
      'Indonesia punya ribuan pulau yang membentang dari Sabang sampai Merauke.',
    ],
  },
  {
    id: 'angka', nama: '4. Angka & tanda baca', ket: 'Angka, koma, titik, dan tanda baca lain.',
    teks: [
      'Harga buku itu Rp25.000,00 dan pensilnya Rp5.500,00. Totalnya Rp30.500,00.',
      'Tahun 1945, 1950, dan 1965 adalah tahun penting. Ingat tanggal 17-08-1945!',
      'Telepon saya 0812-3456-7890; email saya ada di kontak. Jam 08.30 kita bertemu.',
    ],
  },
  {
    id: 'paragraf', nama: '5. Paragraf', ket: 'Teks lebih panjang buat melatih ketahanan.',
    teks: [
      'Gotong royong adalah budaya luhur bangsa Indonesia yang mengajarkan kita untuk saling membantu sesama. Nilai ini masih hidup di banyak desa sampai hari ini.',
      'Membaca buku setiap hari dapat memperluas wawasan dan melatih kemampuan berpikir secara kritis. Mulailah dari sepuluh menit sebelum tidur.',
    ],
  },
];

// Hitung ketepatan ketikan terhadap target. salahHuruf: {huruf: jumlah}.
export function hitungAkurasi(target, ketikan) {
  const t = String(target || '');
  const k = String(ketikan || '');
  let benar = 0;
  const salahHuruf = {};
  for (let i = 0; i < k.length; i++) {
    if (i < t.length && k[i] === t[i]) benar++;
    else if (i < t.length) {
      const ch = t[i];
      salahHuruf[ch] = (salahHuruf[ch] || 0) + 1;
    }
  }
  const salah = k.length - benar;
  return {
    benar, salah,
    akurasi: k.length ? Math.round((benar / k.length) * 1000) / 10 : 100,
    salahHuruf,
  };
}

// Rekor memakai utils.loadBestObj/saveBestObj (kanonis, G4 C1G4-R).

export function render(root) {
  let best = utils.loadBestObj(KEY);
  let pelajaran = PELAJARAN[0];
  let teksIdx = 0;
  let target = pelajaran.teks[0];
  let t0 = null;
  let selesai = false;

  const lvI = T.select(PELAJARAN.map((p) => [p.id, p.nama]), 'dasar');
  const teksEl = T.el('<div class="out" style="font-size:17px;line-height:2;margin-bottom:10px;white-space:pre-wrap"></div>');
  const ketik = T.ta(3, 'Klik di sini lalu ketik teks di atas…');
  const stat = T.out();
  const bestBox = T.out();

  const catat = () => {
    const val = ketik.value;
    const r = hitungAkurasi(target, val);
    let h = '';
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      let cls = '';
      if (i < val.length) cls = val[i] === ch ? 'color:#4ade80' : 'color:#f87171;background:rgba(248,113,113,.15);border-radius:3px';
      else if (i === val.length) cls = 'background:rgba(255,255,255,.18);border-radius:3px';
      h += '<span style="' + cls + '">' + T.esc(ch) + '</span>';
    }
    teksEl.innerHTML = h;
    const persen = target.length ? Math.round((val.length / target.length) * 100) : 0;
    let s = '<p class="dim">Kemajuan ' + persen + '% · Ketepatan ' + r.akurasi + '% · Salah ' + r.salah + ' huruf</p>';
    if (!selesai && val.length >= target.length) {
      selesai = true;
      const detik = t0 ? Math.max(1, Math.round((Date.now() - t0) / 1000)) : 0;
      const kpm = detik ? Math.round((target.length / detik) * 60) : 0;
      const kunci = pelajaran.id;
      const lama = best[kunci] || { akurasi: 0, kpm: 0 };
      const rekor = r.akurasi >= lama.akurasi || kpm > lama.kpm;
      if (rekor) { best[kunci] = { akurasi: Math.max(lama.akurasi, r.akurasi), kpm: Math.max(lama.kpm, kpm) }; utils.saveBestObj(KEY, best); }
      s += '<p><b>Selesai!</b> Waktu ' + detik + ' detik · ' + kpm + ' huruf/menit · ketepatan ' + r.akurasi + '%.</p>';
      const tersulit = Object.keys(r.salahHuruf).sort((a, b) => r.salahHuruf[b] - r.salahHuruf[a]).slice(0, 5);
      if (tersulit.length) {
        s += '<p class="dim">Huruf yang paling sering salah: ' + tersulit.map((c) => '“' + c + '” (' + r.salahHuruf[c] + 'x)').join(', ') + '.</p>';
      } else {
        s += '<p class="dim">Tidak ada huruf yang salah. Bagus sekali.</p>';
      }
      s += '<p><button type="button" class="btn primary" id="latih-lanjut">Teks berikutnya</button></p>';
      T.show(stat, s);
      stat.querySelector('#latih-lanjut').addEventListener('click', () => {
        teksIdx = (teksIdx + 1) % pelajaran.teks.length;
        gantiTeks();
      });
      tampilBest();
      return;
    }
    T.show(stat, s);
  };

  const tampilBest = () => {
    const ada = PELAJARAN.filter((p) => best[p.id]);
    if (!ada.length) { T.hide(bestBox); return; }
    let h = '<p style="margin-top:6px"><b>Rekor latihanmu (tersimpan di HP ini)</b></p>';
    ada.forEach((p) => {
      h += '<div class="kv"><span class="k">' + T.esc(p.nama) + '</span><span class="v">' + best[p.id].akurasi + '% tepat · ' + best[p.id].kpm + ' huruf/menit</span></div>';
    });
    T.show(bestBox, h);
  };

  const gantiTeks = () => {
    target = pelajaran.teks[teksIdx];
    ketik.value = '';
    t0 = null;
    selesai = false;
    catat();
  };

  ketik.addEventListener('input', () => {
    if (t0 == null && ketik.value.length) t0 = Date.now();
    catat();
  });
  ketik.addEventListener('paste', (e) => { e.preventDefault(); T.toast('Ketik sendiri ya, jangan ditempel. Ini latihan.'); });
  lvI.addEventListener('change', () => {
    pelajaran = PELAJARAN.find((p) => p.id === lvI.value) || PELAJARAN[0];
    teksIdx = 0;
    gantiTeks();
  });

  root.appendChild(T.el('<p class="note">Latihan bertahap dari huruf dasar sampai paragraf. Tidak ada batas waktu. Fokus ke ketepatan dulu, kecepatan menyusul sendiri.</p>'));
  root.appendChild(T.grid2(T.field('Pelajaran', lvI)));
  root.appendChild(T.el('<p class="dim" id="latih-ket">' + T.esc(pelajaran.ket) + '</p>'));
  root.appendChild(teksEl);
  root.appendChild(ketik);
  root.appendChild(stat);
  root.appendChild(bestBox);
  lvI.addEventListener('change', () => { root.querySelector('#latih-ket').textContent = pelajaran.ket; });
  gantiTeks();
  tampilBest();
}
