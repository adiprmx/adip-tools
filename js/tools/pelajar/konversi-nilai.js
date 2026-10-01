import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "konversi-nilai", "name": "Konversi Nilai", "cat": "pelajar", "icon": "🔄", "desc": "Angka, huruf, atau skala 4.0 — ubah dua arah.", "keywords": "nilai,konversi,grade,huruf,skala,ipk,angka,rapor"};
export function render(root) {

    const SKALA = [
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
    const rentang = (i) => (i === 0 ? '85–100' : SKALA[i].min + '–' + (SKALA[i - 1].min - 1));

    const inp = T.input('text', 'cth: 87  /  B+  /  3.7');
    inp.autocomplete = 'off';
    inp.setAttribute('enterkeyhint', 'go');
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
      const raw = inp.value.trim().toUpperCase().replace(/\s+/g, '');
      if (!raw) { T.hide(box); return; }
      // 1) input huruf, mis. B+
      const idxHuruf = SKALA.findIndex((s) => s.huruf === raw);
      if (idxHuruf >= 0) {
        const s = SKALA[idxHuruf];
        hasil(rentang(idxHuruf) + ' (kisaran)', s.huruf, s.ipk, s.pred);
        return;
      }
      // 2) input angka
      const n = T.num(raw);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        T.show(box, '<p class="center mut">Hmm, "' + T.esc(inp.value.trim()) + '" nggak dikenali. Coba angka 0–100, huruf A–E, atau skala 0–4.</p>');
        return;
      }
      if (n <= 4) {
        // dianggap skala 4.0 → cari yang paling dekat
        let best = 0, bd = 99;
        SKALA.forEach((s, i) => { const d = Math.abs(s.ipk - n); if (d < bd) { bd = d; best = i; } });
        const s = SKALA[best];
        hasil(rentang(best) + ' (kisaran)', s.huruf, s.ipk, s.pred);
        return;
      }
      const i = SKALA.findIndex((s) => n >= s.min);
      const s = SKALA[i];
      hasil(String(+n.toFixed(2)).replace('.', ','), s.huruf, s.ipk, s.pred);
    };

    inp.addEventListener('input', hitung);
    root.appendChild(T.field('Masukkan nilai', inp, 'Bebas: angka 0–100, huruf (A, A-, B+, … E), atau skala 4.0. Hasilnya muncul otomatis.'));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Patokan: A ≥ 85 · A- ≥ 80 · B+ ≥ 75 · B ≥ 70 · B- ≥ 65 · C+ ≥ 60 · C ≥ 55 · D ≥ 40 · E &lt; 40</p>'));

}
