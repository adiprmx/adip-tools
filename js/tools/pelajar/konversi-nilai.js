import { h as T, utils } from '../../core.js';

export const meta = {"id": "konversi-nilai", "name": "Konversi Nilai", "cat": "pelajar", "icon": "🔄", "desc": "Angka, huruf, atau skala 4.0, ubah dua arah.", "keywords": "nilai,konversi,grade,huruf,skala,ipk,angka,rapor"};

export const SKALA = [
  { min: 85, huruf: 'A',  ipk: 4.0, pred: 'Sangat Baik' },
  { min: 80, huruf: 'A-', ipk: 3.7, pred: 'Sangat Baik' },
  { min: 75, huruf: 'B+', ipk: 3.3, pred: 'Baik' },
  { min: 70, huruf: 'B',  ipk: 3.0, pred: 'Baik' },
  { min: 65, huruf: 'B-', ipk: 2.7, pred: 'Baik' },
  { min: 60, huruf: 'C+', ipk: 2.3, pred: 'Cukup' },
  { min: 55, huruf: 'C',  ipk: 2.0, pred: 'Cukup' },
  { min: 40, huruf: 'D',  ipk: 1.0, pred: 'Kurang' },
  { min: 0,  huruf: 'E',  ipk: 0.0, pred: 'Gagal' },
];
// rentang angka untuk huruf pada indeks i (array urut menurun)
export const rentang = (i) => (i === 0 ? '85–100' : SKALA[i].min + '–' + (SKALA[i - 1].min - 1));

// Konversi satu nilai. Murni, bisa diuji di Node.
// `skala` WAJIB dipilih eksplisit ('100' atau '4'): angka 3 tidak bisa
// ditebak asalnya — 3 dari 100 adalah E, 3 dari skala 4 adalah B.
// Dulu tool menebak "0–4 berarti skala 4", sehingga siswa bernilai
// 3/100 mendapat "A". Tebakan itu dihapus: salah pilih skala sekarang
// menghasilkan pesan salah, bukan huruf yang salah.
// Input huruf (A–E) diterima di skala mana pun.
export function konversiNilai(teks, skala) {
  const raw = String(teks == null ? '' : teks).trim().toUpperCase().replace(/\s+/g, '');
  if (!raw) return { error: 'kosong' };
  const idxHuruf = SKALA.findIndex((s) => s.huruf === raw);
  if (idxHuruf >= 0) {
    const s = SKALA[idxHuruf];
    return { angka: rentang(idxHuruf) + ' (kisaran)', huruf: s.huruf, ipk: s.ipk, pred: s.pred };
  }
  const n = T.num(raw);
  if (Number.isNaN(n)) return { error: 'tidak dikenali' };
  if (skala === '4') {
    if (n < 0 || n > 4) return { error: 'di luar skala 0–4' };
    let best = 0, bd = 99;
    SKALA.forEach((s, i) => { const d = Math.abs(s.ipk - n); if (d < bd) { bd = d; best = i; } });
    const s = SKALA[best];
    return { angka: rentang(best) + ' (kisaran)', huruf: s.huruf, ipk: s.ipk, pred: s.pred };
  }
  if (n < 0 || n > 100) return { error: 'di luar skala 0–100' };
  const i = SKALA.findIndex((s) => n >= s.min);
  const s = SKALA[i];
  return { angka: String(+n.toFixed(2)).replace('.', ','), huruf: s.huruf, ipk: s.ipk, pred: s.pred };
}

export function render(root) {

    const inp = T.input('text', 'cth: 87  /  B+  /  3.7');
    inp.autocomplete = 'off';
    inp.setAttribute('enterkeyhint', 'go');
    const skalaSel = T.select([['100', 'Angka 0–100 (nilai rapor)'], ['4', 'Skala 0–4 (IPK)']], '100');
    const box = T.out();

    const hasil = (angkaTxt, huruf, ipk, pred) => {
      T.show(box,
        '<div class="grid2">' +
          '<div class="center"><div class="mut" style="font-size:12px">Angka</div><div class="big">' + T.esc(angkaTxt) + '</div></div>' +
          '<div class="center"><div class="mut" style="font-size:12px">Huruf</div><div class="big">' + T.esc(huruf) + '</div></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="center"><div class="mut" style="font-size:12px">Skala 4.0</div><div class="big">' + ipk.toFixed(1).replace('.', ',') + '</div></div>' +
          '<div class="center"><div class="mut" style="font-size:12px">Predikat</div><div class="big" style="font-size:20px">' + T.esc(pred) + '</div></div>' +
        '</div>');
    };

    const hitung = () => {
      const mentah = inp.value.trim();
      if (!mentah) { T.hide(box); return; }
      const r = konversiNilai(mentah, skalaSel.value);
      if (r.error) {
        const pesan = r.error === 'di luar skala 0–4'
          ? 'Angka ' + T.esc(mentah) + ' di luar skala 0–4. Pilih "Angka 0–100" bila nilaimu dari 100.'
          : r.error === 'di luar skala 0–100'
            ? 'Angka ' + T.esc(mentah) + ' di luar skala 0–100. Pilih "Skala 0–4" bila nilaimu skala IPK.'
            : 'Hmm, "' + T.esc(mentah) + '" nggak dikenali. Coba angka, huruf A–E, atau skala 0–4.';
        T.show(box, '<p class="center mut">' + pesan + '</p>');
        return;
      }
      hasil(r.angka, r.huruf, r.ipk, r.pred);
    };

    inp.addEventListener('input', hitung);
    skalaSel.addEventListener('change', hitung);
    root.appendChild(T.field('Nilaimu dari skala berapa?', skalaSel, 'Pilih dulu — angka 3 dari 100 beda jauh dengan 3 dari skala 4.'));
    root.appendChild(T.field('Masukkan nilai', inp, 'Angka sesuai skala di atas, atau huruf (A, A-, B+, … E). Hasilnya muncul otomatis.'));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Patokan: A ≥ 85 · A- ≥ 80 · B+ ≥ 75 · B ≥ 70 · B- ≥ 65 · C+ ≥ 60 · C ≥ 55 · D ≥ 40 · E &lt; 40</p>'));

}
