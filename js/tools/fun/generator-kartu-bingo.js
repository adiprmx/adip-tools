import { h as T, utils } from '../../core.js';

// Generator Kartu Bingo: buat kartu bingo 75 bola (B 1-15, I 16-30,
// N 31-45, G 46-60, O 61-75) siap cetak, tiap kartu berbeda, plus
// pemanggil bola. Bisa juga pakai kata-kata sendiri (24 kata + kotak
// tengah gratis).
export const meta = {"id": "generator-kartu-bingo", "name": "Generator Kartu Bingo", "cat": "fun", "icon": "🎱", "desc": "Buat kartu bingo siap cetak, tiap kartu berbeda, lengkap dengan pemanggil bola.", "keywords": "bingo,kartu bingo,generator bingo,bingo 75,cetak bingo,caller bingo", "since": "6.18.0"};

export const HURUF = ['B', 'I', 'N', 'G', 'O'];

// Huruf kolom untuk satu bola. Murni, bisa diuji di Node.
export function hurufBola(n) {
  const b = Number(n);
  if (!isFinite(b) || b < 1 || b > 75) return '';
  return HURUF[Math.floor((b - 1) / 15)];
}

// Acak array (Fisher-Yates) dengan rng yang bisa di-inject. Murni.
export function acakArray(arr, rng) {
  const acak = typeof rng === 'function' ? rng : Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Buat satu kartu angka: grid 5x5, tengah = 'GRATIS'. Murni, bisa diuji di Node.
export function buatKartuBingo(rng) {
  const grid = [];
  for (let kolom = 0; kolom < 5; kolom++) {
    const awal = kolom * 15 + 1;
    const angka = acakArray(Array.from({ length: 15 }, (_, i) => awal + i), rng).slice(0, 5);
    grid.push(angka);
  }
  const kartu = [];
  for (let baris = 0; baris < 5; baris++) {
    const r = [];
    for (let kolom = 0; kolom < 5; kolom++) r.push(grid[kolom][baris]);
    kartu.push(r);
  }
  kartu[2][2] = 'GRATIS';
  return kartu;
}

// Buat satu kartu kata dari 24 kata (tengah = 'GRATIS'). Murni, bisa diuji di Node.
export function buatKartuKata(kata, rng) {
  const daftar = (kata || []).map((k) => String(k).trim()).filter(Boolean);
  if (daftar.length < 24) return null;
  const pilih = acakArray(daftar, rng).slice(0, 24);
  const kartu = [];
  let idx = 0;
  for (let baris = 0; baris < 5; baris++) {
    const r = [];
    for (let kolom = 0; kolom < 5; kolom++) {
      if (baris === 2 && kolom === 2) r.push('GRATIS');
      else r.push(pilih[idx++]);
    }
    kartu.push(r);
  }
  return kartu;
}

// Urutan bola 1-75 yang sudah diacak. Murni, bisa diuji di Node.
export function acakUrutanBola(rng) {
  return acakArray(Array.from({ length: 75 }, (_, i) => i + 1), rng);
}

// CSS cetak kanonis: utils.ensurePrintCss / utils.removePrintCss (core.js).

export function render(root) {
  utils.ensurePrintCss('bingo-print', { page: '@page{size:A4;margin:12mm}', extra: '#bingo-print .bingo-kartu{box-shadow:none !important;border:2px solid #000 !important;margin:0 auto 12px !important;page-break-inside:avoid}' });
  T.onLeave(() => utils.removePrintCss('bingo-print'));

  const modeI = T.select([['angka', 'Angka 1-75 (bingo biasa)'], ['kata', 'Kata-kata sendiri']], 'angka');
  const jumlahI = T.select([['1', '1 kartu'], ['2', '2 kartu'], ['3', '3 kartu'], ['4', '4 kartu'], ['6', '6 kartu']], '2');
  const kataI = T.ta(5, 'Satu kata per baris, minimal 24 kata.\nContoh:\nApel\nBuku\nKucing\n…', '');
  const box = T.out();
  const callerBox = T.out();
  let urutan = [];
  let dipanggil = [];

  const tabelKartu = (kartu, nomor) => {
    let h = '<div class="bingo-kartu" style="background:#fff;color:#000;border:2px solid #000;border-radius:8px;padding:10px;max-width:420px;margin:0 auto 16px">' +
      '<div style="text-align:center;font-weight:700;font-size:18px;margin-bottom:8px">BINGO' + (nomor ? ' - Kartu ' + nomor : '') + '</div>' +
      '<table style="border-collapse:collapse;width:100%;table-layout:fixed"><thead><tr>' +
      HURUF.map((x) => '<th style="padding:8px;border:1px solid #000;background:#000;color:#fff;font-size:18px">' + x + '</th>').join('') + '</tr></thead><tbody>';
    kartu.forEach((baris) => {
      h += '<tr>';
      baris.forEach((sel) => {
        const gratis = sel === 'GRATIS';
        h += '<td style="text-align:center;padding:10px 4px;border:1px solid #000;font-size:' + (gratis ? '11px' : (typeof sel === 'string' ? '12px' : '17px')) + ';font-weight:' + (gratis ? '700' : '400') + ';word-break:break-word">' + T.esc(String(sel)) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  };

  const buat = () => {
    const jumlah = Number(jumlahI.value);
    let html = '<div id="bingo-print">';
    if (modeI.value === 'kata') {
      const kata = kataI.value.split('\n').map((k) => k.trim()).filter(Boolean);
      if (kata.length < 24) {
        T.show(box, '<div class="err">Butuh minimal 24 kata (satu per baris). Sekarang baru ' + kata.length + ' kata.</div>');
        return;
      }
      for (let i = 0; i < jumlah; i++) html += tabelKartu(buatKartuKata(kata), i + 1);
    } else {
      for (let i = 0; i < jumlah; i++) html += tabelKartu(buatKartuBingo(), i + 1);
    }
    html += '</div>';
    T.show(box, html);
    T.scrollToPreview(box);
  };

  const gambarCaller = () => {
    const terakhir = dipanggil.length ? dipanggil[dipanggil.length - 1] : null;
    T.show(callerBox,
      '<div class="center">' + (terakhir
        ? '<div class="dim">Bola terakhir</div><div class="big">' + hurufBola(terakhir) + ' ' + terakhir + '</div>'
        : '<div class="dim">Belum ada bola yang dipanggil.</div>') + '</div>' +
      '<p class="center mut">' + dipanggil.length + ' dari 75 bola sudah dipanggil.</p>' +
      (dipanggil.length ? '<p style="font-size:13px;line-height:1.8;word-break:break-word">' + dipanggil.map((b) => hurufBola(b) + b).join(', ') + '</p>' : ''));
  };

  const panggil = () => {
    if (!urutan.length) urutan = acakUrutanBola();
    if (dipanggil.length >= 75) { T.toast('Semua bola sudah dipanggil'); return; }
    const bola = urutan[dipanggil.length];
    dipanggil.push(bola);
    gambarCaller();
    T.beep(660, 0.1, 'sine');
  };

  root.appendChild(T.el('<p class="note">Tiap kartu dibuat acak, jadi tidak ada dua kartu yang sama. Cetak kartunya, lalu pakai pemanggil bola di bawah saat bermain.</p>'));
  root.appendChild(T.grid2(T.field('Isi kartu', modeI), T.field('Jumlah kartu', jumlahI)));
  root.appendChild(T.field('Kata-kata (untuk mode kata)', kataI, 'Satu kata per baris, minimal 24 kata.'));
  root.appendChild(T.row(T.btn('Buat Kartu', buat, true), T.btn('Cetak / Simpan PDF', () => { if (!box.innerHTML) { T.toast('Buat kartunya dulu'); return; } window.print(); })));
  root.appendChild(box);
  root.appendChild(T.el('<div class="dim" style="margin:16px 0 4px"><b>Pemanggil bola</b></div>'));
  root.appendChild(T.row(T.btn('Panggil Bola', panggil, true), T.btn('Ulang dari Awal', () => { urutan = []; dipanggil = []; gambarCaller(); })));
  root.appendChild(callerBox);
  gambarCaller();
}
