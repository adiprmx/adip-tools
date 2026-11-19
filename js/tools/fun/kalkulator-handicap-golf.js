import { h as T, utils } from '../../core.js';

// Kalkulator Handicap Golf (sistem WHS / World Handicap System).
// 1) Diferensial satu ronde: (113 / slope) x (skor - rating - PCC).
// 2) Indeks handicap dari daftar diferensial (maks 20 terbaru): jumlah
//    diferensial terbaik + penyesuaian mengikuti tabel WHS 5.2a, lalu
//    dikali 0,96 hanya saat memakai 20 skor (rata-rata 8 terbaik).
// 3) Course handicap: indeks x (slope/113) + (rating - par).
// 4) Playing handicap: course handicap x jatah main (allowance).
// Aturan WHS ini dari ingatan + contoh Calculator.net. BELUM
// TERVERIFIKASI WEB (egress mati saat build): QA cek ulang tabel 5.2a
// dan aturan 0,96 ke whs.com saat egress pulih.
export const meta = {"id": "kalkulator-handicap-golf", "name": "Kalkulator Handicap Golf", "cat": "fun", "icon": "⛳", "desc": "Hitung diferensial ronde, indeks handicap (WHS), course handicap, dan playing handicap dari skor dan rating lapangan.", "keywords": "golf,handicap,whs,indeks handicap,course handicap,playing handicap,slope rating", "since": "6.19.0"};

// Tabel WHS 5.2a: [jumlah skor, jumlah diferensial terbaik, penyesuaian].
export const TABEL_WHS = [
  [3, 1, -2.0], [4, 1, -1.0], [5, 1, 0], [6, 2, -1.0], [7, 2, 0],
  [8, 2, 0], [9, 3, 0], [10, 3, 0], [11, 3, 0], [12, 4, 0],
  [13, 4, 0], [14, 4, 0], [15, 5, 0], [16, 5, 0], [17, 6, 0],
  [18, 6, 0], [19, 7, 0], [20, 8, 0],
];

// Diferensial satu ronde. Murni.
export function diferensial(skor, rating, slope, pcc) {
  if (!(slope > 0) || !isFinite(skor) || !isFinite(rating)) return NaN;
  return (113 / slope) * (skor - rating - (pcc || 0));
}

// Indeks handicap dari daftar diferensial (maks 20, terbaru terakhir).
// Kurang dari 3 skor: null (WHS butuh minimal 3 skor untuk indeks awal).
export function indeksHandicap(daftar) {
  const d = daftar.filter((x) => isFinite(x)).slice(-20);
  if (d.length < 3) return null;
  const baris = TABEL_WHS.find((t) => t[0] === d.length);
  const ambil = baris ? baris[1] : 8;
  const sesuaikan = baris ? baris[2] : 0;
  const urut = d.slice().sort((a, b) => a - b).slice(0, ambil);
  const rata = urut.reduce((s, x) => s + x, 0) / urut.length;
  const hasil = d.length === 20 ? rata * 0.96 : rata + sesuaikan;
  return Math.max(hasil, -5);
}

// Course handicap (dibulatkan ke bilangan bulat). Murni.
export function courseHandicap(indeks, slope, rating, par) {
  if (!isFinite(indeks) || !(slope > 0) || !isFinite(rating) || !isFinite(par)) return NaN;
  return Math.round(indeks * (slope / 113) + (rating - par));
}

// Playing handicap = course handicap x allowance (mis. 0,95). Murni.
export function playingHandicap(course, allowance) {
  if (!isFinite(course) || !(allowance > 0)) return NaN;
  return Math.round(course * allowance);
}

export function render(root) {
  const box = T.out();
  const modeS = T.select([
    ['dif', 'Diferensial satu ronde'],
    ['indeks', 'Indeks dari daftar skor'],
    ['course', 'Course + playing handicap'],
  ], 'dif');

  const skorI = T.input('number', 'cth: 85');
  const ratingI = T.input('text', 'cth: 71,5');
  const slopeI = T.input('number', 'cth: 128');
  const pccI = T.input('text', 'cth: 0 (boleh kosong)');
  const daftarI = T.ta(6, 'Satu diferensial per baris, paling baru di bawah.\ncth:\n11,2\n9,8\n13,5', '');
  const indeksI = T.input('text', 'cth: 11');
  const parI = T.input('number', 'cth: 72');
  const slope2I = T.input('number', 'cth: 128');
  const rating2I = T.input('text', 'cth: 71,5');
  const allowS = T.select([
    ['1', '100% (main biasa)'], ['0.95', '95% (stroke play perorangan)'],
    ['0.85', '85% (four-ball)'], ['0.9', '90% (match play perorangan)'],
  ], '1');

  const panelDif = T.el('<div></div>');
  panelDif.appendChild(T.field('Skor brutomu (adjusted gross)', skorI));
  panelDif.appendChild(T.field('Course rating', ratingI, 'Angka di scorecard, contoh 71,5.'));
  panelDif.appendChild(T.field('Slope rating', slopeI, 'Angka 55-155 di scorecard.'));
  panelDif.appendChild(T.field('PCC (opsional)', pccI, 'Penyesuaian kondisi main hari itu, -1 sampai 3. Kosongkan kalau tidak tahu.'));
  const panelIndeks = T.el('<div></div>');
  panelIndeks.appendChild(T.field('Daftar diferensial (maks 20 terbaru)', daftarI, 'Salin dari riwayat skormu. Minimal 3 skor untuk indeks awal.'));
  panelIndeks.style.display = 'none';
  const panelCourse = T.el('<div></div>');
  panelCourse.appendChild(T.field('Indeks handicap-mu', indeksI));
  panelCourse.appendChild(T.field('Slope rating lapangan', slope2I, 'Angka 55-155 di scorecard.'));
  panelCourse.appendChild(T.field('Course rating', rating2I, 'Angka di scorecard, contoh 71,5.'));
  panelCourse.appendChild(T.field('Par lapangan', parI));
  panelCourse.appendChild(T.field('Jatah main (allowance)', allowS));
  panelCourse.style.display = 'none';

  modeS.onchange = () => {
    panelDif.style.display = modeS.value === 'dif' ? '' : 'none';
    panelIndeks.style.display = modeS.value === 'indeks' ? '' : 'none';
    panelCourse.style.display = modeS.value === 'course' ? '' : 'none';
  };

  const hitung = () => {
    if (modeS.value === 'dif') {
      const skor = T.num(skorI.value);
      const rating = T.num(ratingI.value);
      const slope = T.num(slopeI.value);
      const pcc = T.num(pccI.value) || 0;
      if (!isFinite(skor) || !isFinite(rating) || !(slope > 0)) { T.toast('Isi skor, course rating, dan slope dengan benar'); return; }
      const d = diferensial(skor, rating, slope, pcc);
      T.show(box,
        '<div class="big center">' + utils.r4(d) + '</div>' +
        '<p class="center hint">diferensial ronde ini</p>' +
        '<p class="hint" style="margin-top:10px">Diferensial itu skor yang sudah disesuaikan dengan sulitnya lapangan, jadi bisa dibandingkan antar lapangan. Indeks handicap-mu adalah rata-rata diferensial terbaikmu.</p>');
    } else if (modeS.value === 'indeks') {
      const daftar = daftarI.value.split(/[\n,;]+/).map((s) => T.num(s.trim())).filter((x) => isFinite(x));
      if (daftar.length < 3) { T.toast('Butuh minimal 3 diferensial untuk menghitung indeks'); return; }
      const idx = indeksHandicap(daftar);
      const baris = TABEL_WHS.find((t) => t[0] === Math.min(daftar.length, 20));
      T.show(box,
        '<div class="big center">' + utils.r4(idx) + '</div>' +
        '<p class="center hint">indeks handicap (dari ' + Math.min(daftar.length, 20) + ' skor)</p>' +
        '<p class="hint" style="margin-top:10px">Dihitung dari rata-rata ' + (baris ? baris[1] : 8) + ' diferensial terbaikmu' +
        (daftar.length >= 20 ? ', dikali 0,96 (aturan WHS untuk 20 skor)' : (baris && baris[2] ? ', penyesuaian ' + utils.r4(baris[2]) : '')) + '.</p>');
    } else {
      const idx = T.num(indeksI.value);
      const slope = T.num(slope2I.value);
      const rating = T.num(rating2I.value);
      const par = T.num(parI.value);
      const allow = Number(allowS.value);
      if (!isFinite(idx) || !(slope > 0) || !isFinite(rating) || !isFinite(par)) { T.toast('Isi indeks, slope, course rating, dan par dengan benar'); return; }
      const ch = courseHandicap(idx, slope, rating, par);
      const ph = playingHandicap(ch, allow);
      T.show(box,
        '<div class="big center">' + ch + '</div>' +
        '<p class="center hint">course handicap di lapangan ini</p>' +
        '<div style="margin-top:12px"><div class="kv"><span class="k">Playing handicap (' + Math.round(allow * 100) + '%)</span><span class="v">' + ph + ' pukulan</span></div></div>' +
        '<p class="hint" style="margin-top:10px">Course handicap itu jatah pukulanmu di lapangan ini. Playing handicap menerapkannya ke format main yang dipilih.</p>');
    }
  };

  root.appendChild(T.el('<p class="hint">Tiga hitungan golf dalam satu tool: diferensial satu ronde, indeks handicap dari riwayat skormu, dan course/playing handicap untuk lapangan tertentu.</p>'));
  root.appendChild(T.field('Mau hitung apa', modeS));
  root.appendChild(panelDif);
  root.appendChild(panelIndeks);
  root.appendChild(panelCourse);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
}
