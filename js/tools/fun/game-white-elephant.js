import { h as T, utils } from '../../core.js';

export const meta = {"id": "game-white-elephant", "name": "Game White Elephant", "cat": "fun", "icon": "🎁", "desc": "Jalankan tukar kado white elephant: urutan acak, buka atau curi tiap giliran, kado beku, dan swap akhir.", "keywords": "white elephant,tukar kado,natal,hadiah,curian,game,pesta", "since": "6.19.0"};

/* Batas curi: kado yang sudah dicuri 3 kali jadi beku, tidak bisa dicuri lagi. */
export const MAKS_CURI = 3;

export function acakUrutan(pemain, rng) {
  const r = rng || Math.random;
  const a = pemain.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export function bisaCuri(kado, pemainSekarang, idBaruDicuri) {
  if (!kado.terbuka) return false;
  if (kado.pemilik === pemainSekarang) return false;
  if (kado.curian >= MAKS_CURI) return false;
  if (kado.id === idBaruDicuri) return false;
  return true;
}

export function buatKado(namaList) {
  return namaList.map((nama, i) => ({ id: i + 1, nama, terbuka: false, pemilik: null, curian: 0 }));
}

export function statusKado(kado) {
  if (!kado.terbuka) return 'Masih terbungkus';
  if (kado.curian >= MAKS_CURI) return 'Beku (sudah dicuri 3x)';
  return 'Di ' + kado.pemilik + (kado.curian ? ' · dicuri ' + kado.curian + 'x' : '');
}

export function render(root) {
  const box = T.out();
  const pemainI = T.ta(5, 'Satu nama per baris', 'Andi\nBudi\nCitra\nDewi\nEko');
  const kadoI = T.ta(5, 'Satu kado per baris', 'Mug lucu\nKaos kaki aneh\nTanaman mini\nBuku resep\nPower bank');
  let S = null;

  const gambar = () => {
    if (!S) {
      T.show(box, '<p class="hint center">Isi nama pemain dan daftar kado, lalu tekan "Mulai game". Jumlah kado harus sama dengan jumlah pemain.</p>');
      return;
    }
    const p = S.urutan[S.giliran];
    const belumBuka = S.kado.filter((k) => !k.terbuka);
    let html = '<p class="hint center">Giliran ' + (S.giliran + 1) + ' dari ' + S.urutan.length + ' · ' + S.pemain.length + ' pemain</p>' +
      '<div class="big center" style="font-size:24px">' + T.esc(p) + '</div>' +
      '<p class="center">' + (S.fase === 'akhir'
        ? 'Giliran terakhir! ' + T.esc(S.urutan[0]) + ' boleh menukar kadonya dengan kado siapa pun, atau tetap dengan kadonya.'
        : 'Buka kado baru, atau curi kado yang sudah dibuka orang lain.') + '</p>';
    html += '<div style="margin-top:10px">' + S.kado.map((k) => {
      const label = k.terbuka ? T.esc(k.nama) : 'Kado #' + k.id + ' (terbungkus)';
      return '<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #ffffff10;font-size:14px"><span>' + label + '</span><span class="hint">' + T.esc(statusKado(k)) + '</span></div>';
    }).join('') + '</div>';
    if (S.log.length) {
      html += '<p class="hint" style="margin-top:12px;line-height:1.7">' + S.log.slice(-5).map((l) => '• ' + T.esc(l)).join('<br>') + '</p>';
    }
    T.show(box, html);
    const tombol = T.el('<div class="row" style="flex-wrap:wrap;margin-top:12px"></div>');
    if (S.fase === 'akhir') {
      const kadoSaya = S.kado.find((k) => k.pemilik === S.urutan[0]);
      S.kado.filter((k) => k.terbuka && k.pemilik !== S.urutan[0] && k.curian < MAKS_CURI).forEach((k) => {
        tombol.appendChild(T.btn('🔄 Tukar dengan "' + k.nama + '" (' + k.pemilik + ')', () => swapAkhir(k)));
      });
      tombol.appendChild(T.btn('Tetap dengan kadoku', () => selesaiGame(), true));
    } else {
      if (belumBuka.length) tombol.appendChild(T.btn('🎁 Buka kado baru', () => bukaBaru(), true));
      S.kado.filter((k) => bisaCuri(k, p, S.baruDicuri)).forEach((k) => {
        tombol.appendChild(T.btn('😈 Curi "' + k.nama + '" dari ' + k.pemilik, () => curi(k)));
      });
      if (!belumBuka.length && !S.kado.some((k) => bisaCuri(k, p, S.baruDicuri))) {
        tombol.appendChild(T.btn('Tidak ada lagi yang bisa diambil, lanjut', () => lanjutGiliran(), true));
      }
    }
    box.appendChild(tombol);
  };

  const lanjutGiliran = () => {
    S.baruDicuri = null;
    if (S.giliran + 1 >= S.urutan.length) {
      S.fase = 'akhir';
      S.log.push('Semua sudah dapat kado. ' + S.urutan[0] + ' dapat kesempatan swap akhir.');
    } else {
      S.giliran++;
    }
    gambar();
  };

  const bukaBaru = () => {
    const p = S.urutan[S.giliran];
    const tertutup = S.kado.filter((k) => !k.terbuka);
    const k = tertutup[Math.floor(Math.random() * tertutup.length)];
    k.terbuka = true; k.pemilik = p;
    S.log.push(p + ' membuka kado dan dapat "' + k.nama + '".');
    T.beep(660, 0.1);
    lanjutGiliran();
  };

  const curi = (k) => {
    const p = S.urutan[S.giliran];
    const korban = k.pemilik;
    k.pemilik = p; k.curian++;
    S.baruDicuri = k.id;
    S.log.push(p + ' mencuri "' + k.nama + '" dari ' + korban + '.');
    if (k.curian >= MAKS_CURI) S.log.push('"' + k.nama + '" kini beku, tidak bisa dicuri lagi.');
    T.beep(520, 0.12);
    /* Korban langsung dapat giliran: sisipkan dia tepat sesudah giliran ini. */
    const idxKorban = S.urutan.indexOf(korban);
    if (idxKorban > S.giliran) {
      S.urutan.splice(idxKorban, 1);
      S.urutan.splice(S.giliran + 1, 0, korban);
      S.giliran++;
    } else if (idxKorban >= 0 && idxKorban !== S.giliran) {
      S.urutan.splice(idxKorban, 1);
      S.urutan.splice(S.giliran, 0, korban);
    }
    gambar();
  };

  const swapAkhir = (k) => {
    const pertama = S.urutan[0];
    const kadoSaya = S.kado.find((kk) => kk.pemilik === pertama);
    const pemilikLama = k.pemilik;
    k.pemilik = pertama;
    if (kadoSaya) kadoSaya.pemilik = pemilikLama;
    S.log.push(pertama + ' menukar kadonya dengan "' + k.nama + '" milik ' + pemilikLama + '.');
    selesaiGame();
  };

  const selesaiGame = () => {
    const hasil = S.kado.filter((k) => k.terbuka).map((k) => T.esc(k.pemilik) + ' → ' + T.esc(k.nama)).join('<br>');
    T.show(box,
      '<div class="big center" style="font-size:24px">🎉 Game selesai!</div>' +
      '<p class="center" style="line-height:1.9">' + hasil + '</p>' +
      '<p class="center hint">' + S.log.length + ' aksi tercatat.</p>');
    box.appendChild(T.row(
      T.btn('Main lagi 🔄', () => { S = null; gambar(); }, true),
      T.copyBtn(() => 'Hasil White Elephant:\n' + S.kado.filter((k) => k.terbuka).map((k) => k.pemilik + ' -> ' + k.nama).join('\n'), '📋 Salin hasil')
    ));
  };

  const mulai = () => {
    const pemain = pemainI.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const kadoNama = kadoI.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const unik = [...new Set(pemain)];
    if (pemain.length < 3) { T.toast('Minimal 3 pemain'); return; }
    if (unik.length !== pemain.length) { T.toast('Nama pemain tidak boleh sama'); return; }
    if (kadoNama.length !== pemain.length) { T.toast('Jumlah kado harus sama dengan jumlah pemain (' + pemain.length + ')'); return; }
    S = {
      pemain, urutan: acakUrutan(pemain, Math.random),
      kado: buatKado(kadoNama), giliran: 0, fase: 'main', baruDicuri: null, log: [],
    };
    S.log.push('Urutan main: ' + S.urutan.join(', '));
    gambar();
  };

  root.appendChild(T.el('<p class="hint">Aturannya sederhana: tiap giliran, pemain boleh membuka kado baru atau mencuri kado yang sudah dibuka. Kado yang sudah dicuri 3 kali jadi beku. Korban curian langsung dapat giliran lagi. Pemain pertama dapat kesempatan tukar di akhir.</p>'));
  root.appendChild(T.field('Nama pemain (satu per baris)', pemainI, 'Minimal 3 orang.'));
  root.appendChild(T.field('Daftar kado (satu per baris)', kadoI, 'Satu kado per pemain. Tulis nama kado apa adanya, misal "Mug lucu".'));
  root.appendChild(T.row(T.btn('🎲 Mulai game', mulai, true)));
  root.appendChild(box);
  gambar();
}
