import { h as T, utils, esc } from '../../core.js';

export const meta = {"id": "decision", "name": "Pengacak Keputusan", "cat": "fun", "icon": "🔮", "desc": "Bantu ambil keputusan.", "keywords": "keputusan,acak,pilih,random,pilih satu,opsi"};

/** Parse textarea jadi daftar opsi bersih. */
export function parseOpsi(teks) {
  return String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Pilih 1 opsi acak dari daftar. */
export function acakSatu(opsi) {
  return opsi[Math.floor(Math.random() * opsi.length)];
}
export function render(root) {

    const mode = T.select([
      ['yatidak', 'Ya / Tidak'],
      ['daftar', 'Pilih dari daftar'],
      ['koin', 'Lempar koin'],
      ['angka', 'Angka acak (range)'],
    ], 'yatidak');
    const taOpsi = T.ta(4, 'Satu opsi per baris\nmisal:\nNonton bioskop\nMakan di luar\nMain ke pantai');
    const minN = T.input('number', 'Min', '1');
    const maxN = T.input('number', 'Maks', '100');
    const box = T.out();
    let iv = null, to = null;
    const bersih = () => { if (iv) clearInterval(iv); if (to) clearTimeout(to); iv = null; to = null; };
    T.onLeave(bersih);
    const modeBox = T.el('<div></div>');
    const paintMode = () => {
      modeBox.innerHTML = '';
      if (mode.value === 'daftar') modeBox.appendChild(T.field('Daftar opsi', taOpsi, 'Satu opsi per baris.'));
      if (mode.value === 'angka') modeBox.appendChild(T.grid2(T.field('Angka terkecil', minN), T.field('Angka terbesar', maxN)));
    };
    mode.addEventListener('change', paintMode);
    paintMode();
    const putuskan = () => {
      let kandidat = [];
      if (mode.value === 'yatidak') kandidat = ['YA ✅', 'TIDAK ❌'];
      else if (mode.value === 'koin') kandidat = ['GAMBAR 🪙', 'ANGKA 🔢'];
      else if (mode.value === 'angka') {
        let a = Math.round(T.num(minN.value)), b = Math.round(T.num(maxN.value));
        if (isNaN(a) || isNaN(b)) { T.show(box, '<span class="err">Isi range angka dengan benar.</span>'); return; }
        if (a > b) { const t = a; a = b; b = t; }
        kandidat = ['__range__'];
        var rangeA = a, rangeB = b;
      } else {
        kandidat = parseOpsi(taOpsi.value);
        if (!kandidat.length) { T.show(box, '<span class="err">Tulis dulu daftar opsinya.</span>'); return; }
      }
      bersih();
      const hasil = kandidat[0] === '__range__'
        ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
        : acakSatu(kandidat);
      let n = 0;
      const total = 22;
      T.beep(440, 0.1, 'square');
      iv = setInterval(() => {
        n++;
        const tampil = n >= total ? hasil : (kandidat[0] === '__range__'
          ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
          : acakSatu(kandidat));
        const uk = n >= total ? '30px' : (16 + n) + 'px';
        T.show(box,
          '<div class="center"><div class="dim">' + (n >= total ? '🎯 Keputusannya:' : 'Mengacak…') + '</div>' +
          '<div style="font-size:' + uk + ';font-weight:700;margin:14px 0;line-height:1.3">' + esc(tampil) + '</div></div>');
        if (n >= total) {
          bersih();
          T.beep(660, 0.2, 'sine'); T.beep(990, 0.35, 'sine', 0.18);
        }
      }, 90);
    };
    root.appendChild(T.field('Mode', mode));
    root.appendChild(modeBox);
    root.appendChild(T.btn('🔮 Putuskan!', putuskan, true));
    root.appendChild(box);
  
}
