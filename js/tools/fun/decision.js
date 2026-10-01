import { h as T, utils, esc } from '../../core.js?v=5.2.0';

export const meta = {"id": "decision", "name": "Pengacak Keputusan", "cat": "fun", "icon": "🔮", "desc": "Bantu ambil keputusan.", "keywords": "keputusan,acak,pilih,random"};
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
        kandidat = taOpsi.value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!kandidat.length) { T.show(box, '<span class="err">Tulis dulu daftar opsinya.</span>'); return; }
      }
      bersih();
      const hasil = kandidat[0] === '__range__'
        ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
        : kandidat[Math.floor(Math.random() * kandidat.length)];
      let n = 0;
      T.show(box, '<div class="center dim">Mengacak…</div>');
      iv = setInterval(() => {
        n++;
        const acakTampil = kandidat[0] === '__range__'
          ? String(rangeA + Math.floor(Math.random() * (rangeB - rangeA + 1)))
          : kandidat[Math.floor(Math.random() * kandidat.length)];
        T.show(box, '<div class="center"><div class="dim">Mengacak…</div><div class="big">' + esc(acakTampil) + '</div></div>');
        if (n > 12) { bersih(); T.show(box, '<div class="center"><div class="dim">Keputusannya:</div><div class="big">' + esc(hasil) + '</div></div>'); T.beep(660, 0.25, 'sine'); T.beep(880, 0.3, 'sine', 0.22); }
      }, 80);
    };
    root.appendChild(T.field('Mode', mode));
    root.appendChild(modeBox);
    root.appendChild(T.btn('🔮 Putuskan!', putuskan, true));
    root.appendChild(box);
  
}
