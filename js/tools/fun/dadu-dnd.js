import { h as T } from '../../core.js';

// Dadu D&D: lempar dadu dengan notasi lengkap Dungeons & Dragons.
// Contoh: 4d6kh3 (lempar 4 dadu 6 sisi, ambil 3 tertinggi), 2d20kh1
// (advantage), 2d20kl1 (disadvantage), 1d20+5, 3d6-2, 2d6+1d4+3.
// Ada juga pembuat skor ability (4d6 buang yang terendah, 6 skor) dan
// serangan tersimpan.
export const meta = {"id": "dadu-dnd", "name": "Dadu D&D", "cat": "fun", "icon": "🎲", "desc": "Lempar dadu D&D dengan notasi lengkap, advantage, dan skor ability.", "keywords": "dadu dnd,dice roller d&d,4d6kh3,advantage,disadvantage,ability score,d20,lempar dadu", "since": "6.18.0"};

const LS_KEY = 'adip-tools:dadu-dnd-serangan';

// Urai notasi jadi {suku: [{n, sisi, kh, kl}], mod} atau {error}.
// Murni, bisa diuji di Node.
export function uraiNotasi(notasi) {
  const s = String(notasi || '').replace(/\s+/g, '').toLowerCase();
  if (!s) return { error: 'Notasi kosong.' };
  if (!/^[0-9d+\-khl]+$/.test(s)) return { error: 'Notasi hanya boleh berisi angka, d, +, -, k, h, dan l.' };
  const suku = [];
  let mod = 0;
  const bagian = s.split(/(?=[+-])/);
  for (const b of bagian) {
    if (!b) continue;
    const m = /^([+-]?)(\d*)d(\d+)(kh(\d+)|kl(\d+))?$/.exec(b);
    if (m) {
      if (m[1] === '-') return { error: 'Dadu tidak bisa dikurangi, hanya angkanya.' };
      const n = m[2] ? Number(m[2]) : 1;
      const sisi = Number(m[3]);
      if (n < 1 || n > 100) return { error: 'Jumlah dadu 1 sampai 100.' };
      if (sisi < 2 || sisi > 1000) return { error: 'Sisi dadu 2 sampai 1000.' };
      const kh = m[5] ? Number(m[5]) : null;
      const kl = m[6] ? Number(m[6]) : null;
      if ((kh != null && (kh < 1 || kh > n)) || (kl != null && (kl < 1 || kl > n))) {
        return { error: 'Jumlah yang diambil (kh/kl) tidak boleh lebih dari jumlah dadu.' };
      }
      suku.push({ n, sisi, kh, kl });
      continue;
    }
    const a = /^([+-]?\d+)$/.exec(b);
    if (a) { mod += Number(a[1]); continue; }
    return { error: 'Bagian "' + b + '" tidak bisa dibaca. Contoh yang benar: 4d6kh3, 2d20+5.' };
  }
  if (!suku.length) return { error: 'Notasi harus berisi minimal satu dadu, contoh: 1d20.' };
  return { suku, mod };
}

// Lempar sesuai notasi. rng: fungsi acak () => [0,1). Murni, bisa diuji di Node.
export function lemparNotasi(notasi, rng) {
  const urai = uraiNotasi(notasi);
  if (urai.error) return { error: urai.error };
  const acak = typeof rng === 'function' ? rng : Math.random;
  const rincian = [];
  let total = urai.mod;
  urai.suku.forEach((sk) => {
    const hasil = [];
    for (let i = 0; i < sk.n; i++) hasil.push(1 + Math.floor(acak() * sk.sisi));
    let dipakai = hasil.slice();
    let keterangan = '';
    if (sk.kh != null) {
      dipakai = hasil.slice().sort((a, b) => b - a).slice(0, sk.kh);
      keterangan = ' (ambil ' + sk.kh + ' tertinggi)';
    } else if (sk.kl != null) {
      dipakai = hasil.slice().sort((a, b) => a - b).slice(0, sk.kl);
      keterangan = ' (ambil ' + sk.kl + ' terendah)';
    }
    const subtotal = dipakai.reduce((a, b) => a + b, 0);
    total += subtotal;
    rincian.push({
      notasi: sk.n + 'd' + sk.sisi + (sk.kh != null ? 'kh' + sk.kh : '') + (sk.kl != null ? 'kl' + sk.kl : ''),
      hasil, dipakai, subtotal, keterangan,
    });
  });
  return { total, mod: urai.mod, rincian };
}

// Modifier skor ability D&D: (skor - 10) / 2 dibulatkan ke bawah.
export function modSkor(skor) {
  return Math.floor((Number(skor) - 10) / 2);
}

// Enam skor ability: tiap skor 4d6 buang yang terendah. Murni, bisa diuji di Node.
export function skorAbility(rng) {
  const acak = typeof rng === 'function' ? rng : Math.random;
  const skor = [];
  for (let i = 0; i < 6; i++) {
    const d = [0, 1, 2, 3].map(() => 1 + Math.floor(acak() * 6));
    d.sort((a, b) => a - b);
    skor.push({ dadu: d, nilai: d[1] + d[2] + d[3] });
  }
  return skor;
}

export function render(root) {
  const notasiI = T.input('text', 'cth: 4d6kh3 atau 1d20+5', '1d20');
  const box = T.out();
  const riwBox = T.out();
  const abilityBox = T.out();
  const simpanBox = T.out();
  const namaSerangI = T.input('text', 'Nama serangan, cth: Pedang panjang', '');
  const riwayat = [];

  let serangan = [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) serangan = d.filter((s) => s && typeof s.nama === 'string' && typeof s.notasi === 'string').slice(0, 20);
    }
  } catch (e) { /* abaikan */ }
  const simpanSerangan = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(serangan)); } catch (e) { /* abaikan */ } };

  const gambarRiwayat = () => {
    if (!riwayat.length) { T.hide(riwBox); return; }
    T.show(riwBox, '<div class="dim" style="margin-bottom:6px">Riwayat lemparan</div>' +
      riwayat.map((r) => '<div class="kv"><span class="k">' + T.esc(r.notasi) + '</span><span class="v">' + T.esc(r.teks) + ' = <b>' + r.total + '</b></span></div>').join(''));
  };

  const gambarSerangan = () => {
    if (!serangan.length) {
      T.show(simpanBox, '<p class="note">Belum ada serangan tersimpan. Isi nama dan notasi di bawah lalu tekan Simpan.</p>');
      return;
    }
    T.show(simpanBox, '');
    serangan.forEach((s, idx) => {
      const baris = T.el('<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(127,127,127,.15)"></div>');
      const teks = T.el('<span style="flex:1"></span>');
      teks.textContent = s.nama + ' (' + s.notasi + ')';
      const lemparB = T.btn('Lempar', () => { notasiI.value = s.notasi; lempar(); });
      const hapusB = T.btn('✕', () => { serangan.splice(idx, 1); simpanSerangan(); gambarSerangan(); });
      hapusB.setAttribute('aria-label', 'Hapus ' + s.nama);
      baris.appendChild(teks);
      baris.appendChild(lemparB);
      baris.appendChild(hapusB);
      simpanBox.appendChild(baris);
    });
  };

  const lempar = () => {
    const notasi = notasiI.value.trim();
    const hasil = lemparNotasi(notasi);
    if (hasil.error) { T.show(box, '<div class="err">' + T.esc(hasil.error) + '</div>'); return; }
    const teksRincian = hasil.rincian.map((r) =>
      r.notasi + ': ' + r.hasil.join(', ') + (r.keterangan ? r.keterangan + ' -> ' + r.dipakai.join(', ') : '') + ' = ' + r.subtotal).join(' | ');
    const modTeks = hasil.mod ? ' ' + (hasil.mod > 0 ? '+' : '-') + ' ' + Math.abs(hasil.mod) : '';
    T.show(box,
      '<div class="center"><div class="dim">' + T.esc(notasi) + '</div><div class="big">' + hasil.total + '</div>' +
      '<div class="info" style="font-size:13px;line-height:1.6">' + T.esc(teksRincian) + modTeks + '</div></div>');
    riwayat.unshift({ notasi, teks: teksRincian + modTeks, total: hasil.total });
    if (riwayat.length > 20) riwayat.pop();
    gambarRiwayat();
    T.beep(520, 0.12, 'square');
  };

  const buatAbility = () => {
    const skor = skorAbility();
    const nama = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    T.show(abilityBox,
      '<div class="dim" style="margin-bottom:6px">Enam skor ability (4d6 buang yang terendah)</div>' +
      skor.map((s, i) => {
        const m = modSkor(s.nilai);
        return '<div class="kv"><span class="k">' + nama[i] + ' <span class="dim">(' + s.dadu.join(', ') + ')</span></span><span class="v"><b>' + s.nilai + '</b> (' + (m >= 0 ? '+' : '') + m + ')</span></div>';
      }).join(''));
  };

  notasiI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lempar(); } });

  root.appendChild(T.el('<p class="note">Tulis notasi dadumu. kh = ambil yang tertinggi, kl = ambil yang terendah. Contoh: 4d6kh3, 2d20kh1 (advantage), 2d20kl1 (disadvantage), 1d20+5.</p>'));
  root.appendChild(T.field('Notasi dadu', notasiI));
  root.appendChild(T.row(T.btn('Lempar', lempar, true), T.btn('Advantage (2d20kh1)', () => { notasiI.value = '2d20kh1'; lempar(); }), T.btn('Disadvantage (2d20kl1)', () => { notasiI.value = '2d20kl1'; lempar(); })));
  root.appendChild(box);
  root.appendChild(riwBox);
  root.appendChild(T.el('<div class="dim" style="margin:16px 0 4px"><b>Skor ability</b></div>'));
  root.appendChild(T.btn('Buat 6 Skor Ability', buatAbility));
  root.appendChild(abilityBox);
  root.appendChild(T.el('<div class="dim" style="margin:16px 0 4px"><b>Serangan tersimpan</b></div>'));
  const notasiSerangI = T.input('text', 'cth: 1d8+3', '');
  root.appendChild(T.grid2(T.field('Nama serangan', namaSerangI), T.field('Notasi', notasiSerangI)));
  root.appendChild(T.btn('Simpan Serangan', () => {
    const nama = namaSerangI.value.trim();
    const notasi = notasiSerangI.value.trim();
    if (!nama || !notasi) { T.toast('Isi nama dan notasi serangannya'); return; }
    const urai = uraiNotasi(notasi);
    if (urai.error) { T.toast(urai.error); return; }
    if (serangan.length >= 20) { T.toast('Serangan tersimpan sudah penuh (20)'); return; }
    serangan.push({ nama, notasi });
    simpanSerangan();
    gambarSerangan();
    namaSerangI.value = '';
    notasiSerangI.value = '';
    T.toast('Serangan tersimpan');
  }));
  root.appendChild(simpanBox);
  gambarSerangan();
}
