import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id": "kalkulator-capo", "name": "Kalkulator Capo", "cat": "musik", "icon": "🎸", "desc": "Bentuk jari + capo = nada apa yang terdengar?", "keywords": "capo,gitar,akor,chord,transpose,fret"};

export function render(root) {

    // tabel kromatik mulai dari A
    const KROM = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const kualitas = [['', 'Mayor'], ['m', 'Minor']];

    const selAkor = T.select(KROM.map((n) => [n, n]), 'C');
    const selKual = T.select(kualitas, '');
    const selFret = T.select([['0','0 (tanpa capo)'],['1','Fret 1'],['2','Fret 2'],['3','Fret 3'],['4','Fret 4'],['5','Fret 5'],['6','Fret 6'],['7','Fret 7']], '2');
    const box = T.out();

    const geser = (nada, fret) => KROM[(KROM.indexOf(nada) + fret) % 12];
    const namaSemiton = (f) => f === 1 ? 'setengah nada' : (f === 2 ? '1 nada penuh' : f / 2 + ' nada');

    const hitung = () => {
      const dasar = selAkor.value, k = selKual.value, fret = +selFret.value;
      const bentuk = dasar + k;                 // bentuk jari yang dimainkan
      const bunyi = geser(dasar, fret) + k;     // nada aktual yang terdengar
      const naik = fret > 0 ? 'Naik ' + fret + ' semiton (' + namaSemiton(fret) + ') dari bentuk jari.' : 'Tanpa capo, yang dimainkan = yang terdengar.';
      T.show(box,
        '<div style="display:grid;gap:12px;margin-top:4px">' +
        '<div class="center" style="border:1px solid #ffffff20;border-radius:12px;padding:16px 12px">' +
          '<div class="mut" style="font-size:12px">👆 BENTUK JARI YANG DIMAINKAN</div>' +
          '<div class="big" style="font-size:40px;margin:6px 0">' + T.esc(bentuk) + '</div>' +
          '<div class="mut" style="font-size:12px">jari menekan pola akor ' + T.esc(bentuk) + ' di bawah capo</div>' +
        '</div>' +
        '<div class="center" style="font-size:20px">⬇️</div>' +
        '<div class="center" style="border:1px solid #ffffff20;border-radius:12px;padding:16px 12px;background:#141210">' +
          '<div class="mut" style="font-size:12px">🔊 NADA AKTUAL YANG TERDENGAR</div>' +
          '<div class="big" style="font-size:40px;margin:6px 0;color:#fff">' + T.esc(bunyi) + '</div>' +
          '<div class="mut" style="font-size:12px">' + T.esc(naik) + '</div>' +
        '</div></div>' +
        '<p class="hint center" style="margin-top:12px">Contoh: bentuk A + capo fret 2 → terdengar B. Capo "menjepit" semua senar, jadi tiap nada naik sejauh posisi fret.</p>');
    };

    [selAkor, selKual, selFret].forEach((s) => s.addEventListener('change', hitung));
    root.appendChild(T.grid2(
      T.field('Akor dasar (bentuk jari)', selAkor),
      T.field('Jenis', selKual)
    ));
    root.appendChild(T.field('Posisi capo', selFret));
    root.appendChild(box);
    hitung();

}
