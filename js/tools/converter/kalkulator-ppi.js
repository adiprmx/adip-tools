import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "kalkulator-ppi", "name": "Kalkulator PPI", "cat": "converter", "icon": "🖥️", "desc": "Hitung kerapatan piksel layar dari resolusi & diagonal.", "keywords": "ppi,resolusi,layar,piksel,dpi,monitor,hp,tv"};
export function render(root) {

    const PRESETS = [
      ['HP 1080p · 6,1 inci', 1920, 1080, 6.1],
      ['HP 1440p · 6,7 inci', 3120, 1440, 6.7],
      ['Laptop 1080p · 14 inci', 1920, 1080, 14],
      ['Monitor 1080p · 24 inci', 1920, 1080, 24],
      ['Monitor 1440p · 27 inci', 2560, 1440, 27],
      ['Monitor 4K · 27 inci', 3840, 2160, 27],
      ['TV 4K · 55 inci', 3840, 2160, 55],
    ];

    const katPPI = (ppi) => {
      if (ppi < 150) return {
        label: 'Rada burik',
        desc: 'Piksel masih kelihatan kalau dilihat dekat. Buat nonton dari jauh sih oke.',
        contoh: 'TV HD 32" (~49 PPI) · Monitor 1080p 24" (~92 PPI)',
      };
      if (ppi < 250) return {
        label: 'Standar',
        desc: 'Nyaman buat kerja sehari-hari. Teks terbaca jelas di jarak normal.',
        contoh: 'Laptop 1080p 14" (~157 PPI) · Monitor 4K 27" (~163 PPI)',
      };
      if (ppi < 400) return {
        label: 'Tajam',
        desc: 'Teks terlihat halus, foto kelihatan detail. Enak buat baca lama-lama.',
        contoh: 'HP 1080p 6,1" (~361 PPI) · Tablet 2K 11" (~274 PPI)',
      };
      return {
        label: 'Sangat tajam',
        desc: 'Mata manusia nyaris nggak bisa bedain piksel satu-satu. Maksimal.',
        contoh: 'Flagship 1440p 6,7" (~438 PPI) · iPhone Pro (~460 PPI)',
      };
    };

    const gcd = (a, b) => (b ? gcd(b, a % b) : a);

    // ingat input terakhir
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('ppi-last') || 'null'); } catch (e) { saved = null; }

    const wEl = T.input('number', 'Lebar (px)', saved && saved.w != null ? saved.w : '1920');
    const hEl = T.input('number', 'Tinggi (px)', saved && saved.h != null ? saved.h : '1080');
    const dEl = T.input('number', 'Diagonal (inci)', saved && saved.d != null ? saved.d : '6.1');
    const preset = T.select(
      [['', '— Pilih preset cepat —']].concat(PRESETS.map((p, i) => [String(i), p[0]])),
      ''
    );
    const box = T.out();

    const hitung = () => {
      const w = T.num(wEl.value), h = T.num(hEl.value), d = T.num(dEl.value);
      if (!(w > 0) || !(h > 0) || !(d > 0)) {
        T.show(box, '<p class="center mut">Isi resolusi & diagonal dengan angka yang valid dulu.</p>');
        return;
      }
      try { localStorage.setItem('ppi-last', JSON.stringify({ w: wEl.value, h: hEl.value, d: dEl.value })); } catch (e) {}
      const diagPx = Math.sqrt(w * w + h * h);
      const ppi = diagPx / d;
      const g = gcd(Math.round(w), Math.round(h));
      const rasio = Math.round(w / g) + ':' + Math.round(h / g);
      const mp = (w * h / 1e6);
      const k = katPPI(ppi);
      T.show(box,
        '<div class="center"><div class="mut">Kerapatan piksel layarmu</div>' +
        '<div class="big">' + ppi.toFixed(1) + ' <span class="mut" style="font-size:15px">PPI</span></div>' +
        '<p><b>' + T.esc(k.label) + '</b> — ' + T.esc(k.desc) + '</p></div>' +
        '<div class="kv"><span class="k">Diagonal piksel</span><span class="v">' + T.fmt(Math.round(diagPx)) + ' px</span></div>' +
        '<div class="kv"><span class="k">Rasio aspek</span><span class="v">' + T.esc(rasio) + '</span></div>' +
        '<div class="kv"><span class="k">Total piksel</span><span class="v">' + mp.toFixed(1) + ' MP</span></div>' +
        '<p class="hint">Perangkat sekelas ini: ' + T.esc(k.contoh) + '</p>'
      );
    };

    preset.addEventListener('change', () => {
      if (preset.value === '') return;
      const p = PRESETS[Number(preset.value)];
      wEl.value = p[1]; hEl.value = p[2]; dEl.value = p[3];
      hitung();
    });
    [wEl, hEl, dEl].forEach((elx) => elx.addEventListener('input', hitung));

    root.appendChild(T.field('Preset perangkat', preset));
    root.appendChild(T.grid2(T.field('Lebar resolusi (px)', wEl), T.field('Tinggi resolusi (px)', hEl)));
    root.appendChild(T.field('Diagonal layar (inci)', dEl, 'Biasanya tertulis di spesifikasi, mis. 6,1 atau 24'));
    root.appendChild(box);
    hitung();

}
