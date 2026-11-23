import { h as T, utils } from '../../core.js';

export const meta = {"id": "tes-mengetik-kode", "name": "Tes Mengetik Kode", "cat": "pelajar", "icon": "💻", "desc": "Ukur kecepatan mengetik kode program: JavaScript, Python, HTML, dan JSON, lengkap dengan hitungan salah per simbol.", "keywords": "tes mengetik kode,typing code,programmer,kecepatan mengetik,kode,javascript,python,teks,produktivitas", "since": "6.19.0"};

const KEY = 'adip-tools:tes-mengetik-kode';

// Cuplikan kode asli untuk diketik. Indentasi 2 spasi, tanpa tab.
export const SNIPPET = [
  {
    id: 'js1', bahasa: 'JavaScript', judul: 'Fungsi jumlah',
    kode: 'function jumlah(a, b) {\n  return a + b;\n}\n\nconsole.log(jumlah(3, 4));',
  },
  {
    id: 'js2', bahasa: 'JavaScript', judul: 'Perulangan array',
    kode: 'const buah = ["apel", "mangga", "jeruk"];\nfor (const b of buah) {\n  console.log(b);\n}',
  },
  {
    id: 'py1', bahasa: 'Python', judul: 'Fungsi sapa',
    kode: 'def sapa(nama):\n    return "Halo, " + nama\n\nprint(sapa("Dina"))',
  },
  {
    id: 'py2', bahasa: 'Python', judul: 'Hitung rata-rata',
    kode: 'nilai = [7, 8, 9, 6, 10]\nrata = sum(nilai) / len(nilai)\nprint(rata)',
  },
  {
    id: 'html1', bahasa: 'HTML', judul: 'Kartu profil',
    kode: '<div class="kartu">\n  <h2>Dina</h2>\n  <p>Pelajar kelas 10</p>\n</div>',
  },
  {
    id: 'css1', bahasa: 'CSS', judul: 'Tombol',
    kode: '.tombol {\n  padding: 10px 16px;\n  border-radius: 8px;\n  background: #fff;\n}',
  },
  {
    id: 'json1', bahasa: 'JSON', judul: 'Data siswa',
    kode: '{\n  "nama": "Dina",\n  "kelas": 10,\n  "lulus": true\n}',
  },
  {
    id: 'js3', bahasa: 'JavaScript', judul: 'Cek bilangan genap',
    kode: 'const genap = (n) => n % 2 === 0;\nconsole.log(genap(8));',
  },
];

// Hasil tes: wpm (kata per menit, 1 kata = 5 huruf), akurasi, dan rincian
// salah: simbol (bukan huruf/angka/spasi) vs huruf/angka.
export function hitungHasil(target, ketikan, detik) {
  const t = String(target || '');
  const k = String(ketikan || '');
  let benar = 0, salahSimbol = 0, salahHuruf = 0;
  for (let i = 0; i < k.length; i++) {
    if (i < t.length && k[i] === t[i]) benar++;
    else if (i < t.length) {
      if (/[a-zA-Z0-9 ]/.test(t[i])) salahHuruf++; else salahSimbol++;
    } else salahHuruf++;
  }
  const salah = k.length - benar;
  const menit = detik / 60;
  return {
    benar, salah, salahSimbol, salahHuruf,
    akurasi: k.length ? Math.round((benar / k.length) * 1000) / 10 : 100,
    wpm: menit > 0 ? Math.round(((k.length / 5) / menit) * 10) / 10 : 0,
  };
}

// Rekor memakai utils.loadBestObj/saveBestObj (kanonis, G4 C1G4-R).

export function render(root) {
  let best = utils.loadBestObj(KEY);
  let snip = SNIPPET[0];
  let t0 = null;
  let selesai = false;

  const pilihI = T.select(SNIPPET.map((s) => [s.id, s.bahasa + ': ' + s.judul]), 'js1');
  const kodeEl = T.el('<pre class="out" style="font-family:monospace;font-size:13px;line-height:1.9;margin-bottom:10px;white-space:pre-wrap;word-break:break-word"></pre>');
  const ketik = T.ta(5, 'Klik di sini lalu ketik kode di atas, persis sama…');
  ketik.style.fontFamily = 'monospace';
  const stat = T.out();
  const bestBox = T.out();

  const catat = () => {
    const val = ketik.value;
    const target = snip.kode;
    let h = '';
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      let cls = '';
      if (i < val.length) cls = val[i] === ch ? 'color:#4ade80' : 'color:#f87171;background:rgba(248,113,113,.15);border-radius:3px';
      else if (i === val.length) cls = 'background:rgba(255,255,255,.18);border-radius:3px';
      h += '<span style="' + cls + '">' + T.esc(ch) + '</span>';
    }
    kodeEl.innerHTML = h;
    const r = hitungHasil(target, val, t0 ? (Date.now() - t0) / 1000 : 0);
    if (!selesai && val.length >= target.length) {
      selesai = true;
      const detik = t0 ? Math.max(1, Math.round((Date.now() - t0) / 1000)) : 0;
      const akhir = hitungHasil(target, val, detik);
      const lama = best[snip.bahasa] || { wpm: 0, akurasi: 0 };
      if (akhir.wpm > lama.wpm) { best[snip.bahasa] = { wpm: akhir.wpm, akurasi: akhir.akurasi }; utils.saveBestObj(KEY, best); }
      let s = '<div class="big">' + akhir.wpm + ' WPM</div>';
      s += '<p class="dim">Selesai dalam ' + detik + ' detik · ketepatan ' + akhir.akurasi + '%.</p>';
      s += '<div class="kv"><span class="k">Huruf benar</span><span class="v">' + akhir.benar + ' dari ' + target.length + '</span></div>';
      s += '<div class="kv"><span class="k">Salah di simbol ( ) { } ; " = &lt; &gt;</span><span class="v">' + akhir.salahSimbol + '</span></div>';
      s += '<div class="kv"><span class="k">Salah di huruf/angka</span><span class="v">' + akhir.salahHuruf + '</span></div>';
      if (akhir.salahSimbol > akhir.salahHuruf) s += '<p class="hint">Salahmu kebanyakan di simbol. Itu wajar, simbol memang bagian tersulit mengetik kode. Latihan di pelajaran angka &amp; tanda baca (Latihan Mengetik) bisa membantu.</p>';
      s += '<p><button type="button" class="btn primary" id="kode-ulang">Coba cuplikan lain</button></p>';
      T.show(stat, s);
      stat.querySelector('#kode-ulang').addEventListener('click', () => {
        const i = SNIPPET.indexOf(snip);
        snip = SNIPPET[(i + 1) % SNIPPET.length];
        pilihI.value = snip.id;
        gantiSnip();
      });
      tampilBest();
      return;
    }
    T.show(stat, '<p class="dim">' + val.length + ' / ' + target.length + ' huruf · Ketepatan ' + r.akurasi + '% · ' + r.wpm + ' WPM sementara</p>');
  };

  const tampilBest = () => {
    const ada = Object.keys(best);
    if (!ada.length) { T.hide(bestBox); return; }
    let h = '<p style="margin-top:6px"><b>Rekor per bahasa (tersimpan di HP ini)</b></p>';
    ada.forEach((b) => {
      h += '<div class="kv"><span class="k">' + T.esc(b) + '</span><span class="v">' + best[b].wpm + ' WPM · ' + best[b].akurasi + '% tepat</span></div>';
    });
    T.show(bestBox, h);
  };

  const gantiSnip = () => {
    ketik.value = '';
    t0 = null;
    selesai = false;
    catat();
  };

  ketik.addEventListener('input', () => {
    if (t0 == null && ketik.value.length) t0 = Date.now();
    catat();
  });
  ketik.addEventListener('paste', (e) => { e.preventDefault(); T.toast('Ketik sendiri ya, jangan ditempel. Ini tes mengetik.'); });
  pilihI.addEventListener('change', () => {
    snip = SNIPPET.find((s) => s.id === pilihI.value) || SNIPPET[0];
    gantiSnip();
  });

  root.appendChild(T.el('<p class="note">Timer mulai saat kamu mengetik huruf pertama. WPM = kata per menit (1 kata dihitung 5 huruf). Salah di simbol dihitung terpisah, karena itu bagian tersulit mengetik kode.</p>'));
  root.appendChild(T.grid2(T.field('Cuplikan kode', pilihI)));
  root.appendChild(kodeEl);
  root.appendChild(ketik);
  root.appendChild(stat);
  root.appendChild(bestBox);
  gantiSnip();
  tampilBest();
}
