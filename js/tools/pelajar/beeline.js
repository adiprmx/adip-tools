import { h as T, esc } from '../../core.js';

export const meta = { id: 'beeline', name: 'BeeLine: Baca Gradasi Warna', cat: 'pelajar', icon: '🐝', desc: 'Tempel teks bacaanmu, tiap baris diwarnai gradasi supaya mata mudah mengikuti dari baris ke baris.', keywords: 'beeline,gradasi,baca,warna,baris,disleksia,fokus,membaca', since: '6.19.0' };

// Skema gradasi: tiap skema adalah daftar warna latar per baris yang berulang.
// Warna dipilih kontras aman dengan teks gelap (latar terang) dan teks terang
// (latar gelap dipakai dengan opasitas rendah di atas latar aplikasi).
export const SKEMA = {
  pelangi: ['#e3f2fd', '#e0f2f1', '#e8f5e9', '#fff8e1', '#fce4ec', '#f3e5f5'],
  biru: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5'],
  hangat: ['#fff3e0', '#ffe0b2', '#ffccbc', '#f8bbd0', '#e1bee7'],
  hijau: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'],
};

export function warnaBaris(i, skema) {
  const daftar = SKEMA[skema] || SKEMA.pelangi;
  return daftar[i % daftar.length];
}

// Pecah teks jadi baris-baris dengan lebar karakter maksimal per baris
// (algoritma rakus: kata demi kata sampai penuh, lalu baris baru).
export function bungkusBaris(teks, lebar) {
  const hasil = [];
  const w = Math.max(10, Math.min(200, Math.floor(lebar) || 60));
  String(teks || '').split('\n').forEach((paragraf) => {
    const kata = paragraf.split(/\s+/).filter(Boolean);
    if (kata.length === 0) { hasil.push(''); return; }
    let baris = '';
    kata.forEach((k) => {
      if (baris === '') baris = k;
      else if (baris.length + 1 + k.length <= w) baris += ' ' + k;
      else { hasil.push(baris); baris = k; }
    });
    if (baris !== '') hasil.push(baris);
  });
  return hasil;
}

const CONTOH = 'Membaca adalah jendela dunia. Dengan membaca, kita bisa belajar hal baru tanpa harus mengalaminya sendiri.\n\nBeeLine mewarnai tiap baris dengan gradasi warna. Mata kita lebih mudah melompat ke baris berikutnya karena warnanya berubah sedikit demi sedikit, seperti mengikuti jejak lebah dari bunga ke bunga.\n\nCoba tempel teks bacaanmu sendiri di atas, lalu atur lebar baris dan skema warnanya sampai terasa nyaman.';

export function render(root) {
  root.appendChild(T.el('<p class="hint">Tempel teks yang mau dibaca. Tiap baris diberi warna gradasi supaya mata tidak gampang lompat baris saat membaca. Cocok untuk bacaan panjang dan latihan membaca.</p>'));

  const teksI = T.ta(6, 'Tempel teks bacaanmu di sini...', CONTOH);
  const skemaS = T.select([
    ['pelangi', 'Pelangi lembut'],
    ['biru', 'Biru'],
    ['hangat', 'Hangat'],
    ['hijau', 'Hijau'],
  ], 'pelangi');
  const lebarS = T.select([
    ['40', 'Sempit (40 huruf per baris)'],
    ['60', 'Sedang (60 huruf per baris)'],
    ['80', 'Lebar (80 huruf per baris)'],
  ], '60');
  const ukuranS = T.select([
    ['16', 'Huruf sedang (16)'],
    ['18', 'Huruf besar (18)'],
    ['20', 'Huruf sangat besar (20)'],
  ], '18');
  const area = T.el('<div style="margin-top:12px"></div>');

  function gambar() {
    const baris = bungkusBaris(teksI.value, Number(lebarS.value));
    const ukuran = Number(ukuranS.value);
    const html = baris.map((b, i) => {
      const bg = warnaBaris(i, skemaS.value);
      return '<div style="background:' + bg + ';color:#111;padding:2px 8px;line-height:1.7;font-size:' + ukuran + 'px;border-radius:4px;min-height:1.7em">' +
        (b ? esc(b) : '&nbsp;') + '</div>';
    }).join('');
    area.innerHTML = html;
    const info = T.el('<p class="hint" style="margin-top:8px">' + baris.length + ' baris · skema ' + skemaS.options[skemaS.selectedIndex].text + '</p>');
    area.appendChild(info);
  }

  [teksI, skemaS, lebarS, ukuranS].forEach((el) => el.addEventListener('input', gambar));
  root.append(
    T.field('Teks bacaan', teksI),
    T.grid2(T.field('Skema warna', skemaS), T.field('Lebar baris', lebarS)),
    T.field('Ukuran huruf', ukuranS),
    area,
  );
  gambar();
}
