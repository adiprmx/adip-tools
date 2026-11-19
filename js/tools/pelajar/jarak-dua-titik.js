import { h as T, utils } from '../../core.js';

export const meta = { id: 'jarak-dua-titik', name: 'Kalkulator Jarak Dua Titik', cat: 'pelajar', icon: '📏', desc: 'Hitung jarak antara dua titik di bidang datar atau di ruang, lengkap dengan titik tengah dan langkahnya.', keywords: 'jarak,dua titik,koordinat,euclidean,titik tengah,gradien,matematika', since: '6.19.0' };

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Jarak Euclidean 2D: sqrt((x2-x1)^2 + (y2-y1)^2).
export function jarak2D(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Jarak Euclidean 3D.
export function jarak3D(x1, y1, z1, x2, y2, z2) {
  return Math.hypot(x2 - x1, y2 - y1, z2 - z1);
}

export function titikTengah2D(x1, y1, x2, y2) {
  return [n0((x1 + x2) / 2), n0((y1 + y2) / 2)];
}

export function titikTengah3D(x1, y1, z1, x2, y2, z2) {
  return [n0((x1 + x2) / 2), n0((y1 + y2) / 2), n0((z1 + z2) / 2)];
}

// Gradien garis yang melalui dua titik (2D). NaN bila garis tegak (x sama).
export function gradien(x1, y1, x2, y2) {
  if (x2 === x1) return NaN;
  return n0((y2 - y1) / (x2 - x1));
}

const f = (x) => utils.fmtDes(x, 4);

export function render(root) {
  root.appendChild(T.el('<p class="hint">Masukkan koordinat dua titik. Jarak dihitung dengan rumus Pythagoras: akar dari jumlah kuadrat selisih tiap koordinat.</p>'));

  const mode = T.select([
    ['2d', 'Bidang datar (x, y)'],
    ['3d', 'Ruang (x, y, z)'],
  ], '2d');
  const x1I = T.input('number', 'x1, cth: 1', '1');
  const y1I = T.input('number', 'y1, cth: 2', '2');
  const z1I = T.input('number', 'z1, cth: 0', '0');
  const x2I = T.input('number', 'x2, cth: 4', '4');
  const y2I = T.input('number', 'y2, cth: 6', '6');
  const z2I = T.input('number', 'z2, cth: 0', '0');
  const box = T.out();

  const wrapZ = T.el('<div></div>');
  wrapZ.appendChild(T.grid2(T.field('z titik 1', z1I), T.field('z titik 2', z2I)));
  const aturTampil = () => { wrapZ.hidden = mode.value !== '3d'; };
  mode.addEventListener('change', () => { aturTampil(); hitung(); });
  aturTampil();

  function hitung() {
    const x1 = T.num(x1I.value), y1 = T.num(y1I.value);
    const x2 = T.num(x2I.value), y2 = T.num(y2I.value);
    const z1 = T.num(z1I.value), z2 = T.num(z2I.value);
    const angka = mode.value === '3d' ? [x1, y1, z1, x2, y2, z2] : [x1, y1, x2, y2];
    if (!angka.every(Number.isFinite)) {
      T.show(box, '<p class="dim">Isi semua koordinat dengan angka.</p>');
      return;
    }
    if (mode.value === '2d') {
      const jarak = jarak2D(x1, y1, x2, y2);
      const tengah = titikTengah2D(x1, y1, x2, y2);
      const m = gradien(x1, y1, x2, y2);
      const dx = n0(x2 - x1), dy = n0(y2 - y1);
      T.show(box,
        '<p class="big">Jarak = ' + f(jarak) + '</p>' +
        '<p>Titik tengah: (' + f(tengah[0]) + ', ' + f(tengah[1]) + ')</p>' +
        '<p>Gradien garis: ' + (Number.isNaN(m) ? 'tidak ada (garis tegak, x kedua titik sama)' : f(m)) + '</p>' +
        '<p class="hint"><b>Langkah:</b> selisih x = ' + f(dx) + ', selisih y = ' + f(dy) +
        '<br>Jarak = √(' + f(dx) + '² + ' + f(dy) + '²) = √(' + f(dx * dx) + ' + ' + f(dy * dy) + ') = ' + f(jarak) + '</p>');
    } else {
      const jarak = jarak3D(x1, y1, z1, x2, y2, z2);
      const tengah = titikTengah3D(x1, y1, z1, x2, y2, z2);
      const dx = n0(x2 - x1), dy = n0(y2 - y1), dz = n0(z2 - z1);
      T.show(box,
        '<p class="big">Jarak = ' + f(jarak) + '</p>' +
        '<p>Titik tengah: (' + f(tengah[0]) + ', ' + f(tengah[1]) + ', ' + f(tengah[2]) + ')</p>' +
        '<p class="hint"><b>Langkah:</b> selisih x = ' + f(dx) + ', selisih y = ' + f(dy) + ', selisih z = ' + f(dz) +
        '<br>Jarak = √(' + f(dx) + '² + ' + f(dy) + '² + ' + f(dz) + '²) = ' + f(jarak) + '</p>');
    }
  }

  root.append(
    T.field('Dimensi', mode),
    T.grid2(T.field('x titik 1', x1I), T.field('y titik 1', y1I)),
    T.grid2(T.field('x titik 2', x2I), T.field('y titik 2', y2I)),
    wrapZ,
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
