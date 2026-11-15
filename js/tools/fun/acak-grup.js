import { h as T } from '../../core.js?v=6.12.1';

// ---------- Logika murni (tanpa DOM, bisa diuji dari Node) ----------

// Satu nama per baris, baris kosong dibuang. Nama yang sama dua kali
// dihitung sebagai dua orang berbeda.
function parseNama(teks) {
  return String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

// Satu pasangan per baris: "Budi, Sari" atau "Budi vs Sari".
// Hasil: { pasangan: [[namaA, namaB], ...], salah: [baris yang tidak terbaca] }
function parsePasangan(teks) {
  const pasangan = [];
  const salah = [];
  for (const baris of String(teks || '').split('\n')) {
    const s = baris.trim();
    if (!s) continue;
    const potong = s.split(/\s+vs\s+|,/i).map((x) => x.trim()).filter(Boolean);
    if (potong.length !== 2) { salah.push(s); continue; }
    pasangan.push(potong);
  }
  return { pasangan, salah };
}

function acakUrutan(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Bagi nama jadi grup seimbang (selisih ukuran maksimal 1 orang).
// opt: { mode: 'count'|'size', angka, pisah: [[a,b]], bersama: [[a,b]],
//        ketua: [nama], percobaan: 500, rnd: Math.random }
// Sukses: { ok: true, grup: [[nama...]], ketua: [nama|null], pesan: [] }
// Gagal:  { ok: false, grup: [], ketua: [], pesan: [], konflik: [pesan] }
function bagiGrup(nama, opt) {
  const o = opt || {};
  const rnd = o.rnd || Math.random;
  const maksCoba = o.percobaan || 500;
  const gagal = (konflik) => ({ ok: false, grup: [], ketua: [], pesan: [], konflik });
  if (!Array.isArray(nama) || nama.length < 2) return gagal(['Isi minimal 2 nama dulu.']);
  const n = nama.length;

  // Indeks per nama (huruf besar kecil tidak dibedakan).
  const idxNama = new Map();
  nama.forEach((nm, i) => {
    const k = String(nm).toLowerCase();
    if (!idxNama.has(k)) idxNama.set(k, []);
    idxNama.get(k).push(i);
  });
  const cari = (nm) => idxNama.get(String(nm).toLowerCase()) || null;

  // Jumlah grup.
  let g;
  if (o.mode === 'size') {
    const per = Math.max(1, Math.floor(o.angka) || 1);
    g = Math.ceil(n / per);
  } else {
    g = Math.max(1, Math.floor(o.angka) || 1);
  }
  const pesan = [];
  if (g > n) { g = n; pesan.push('Jumlah grup disesuaikan jadi ' + g + ' karena hanya ada ' + n + ' nama.'); }
  const maksIsi = Math.ceil(n / g);
  const minIsi = Math.floor(n / g);

  // Kelompok "harus satu grup" (union-find antar indeks).
  const induk = nama.map((_, i) => i);
  const cariInduk = (x) => { while (induk[x] !== x) { induk[x] = induk[induk[x]]; x = induk[x]; } return x; };
  const gabung = (a, b) => { const ra = cariInduk(a), rb = cariInduk(b); if (ra !== rb) induk[ra] = rb; };

  const konflik = [];
  for (const [a, b] of (o.bersama || [])) {
    const ia = cari(a), ib = cari(b);
    if (!ia) konflik.push('Nama "' + a + '" di aturan harus satu grup tidak ada di daftar nama.');
    if (!ib) konflik.push('Nama "' + b + '" di aturan harus satu grup tidak ada di daftar nama.');
    if (ia && ib) { for (const x of ia) for (const y of ib) gabung(x, y); }
  }
  const pasanganPisah = []; // pasangan indeks yang tidak boleh satu grup
  for (const [a, b] of (o.pisah || [])) {
    const ia = cari(a), ib = cari(b);
    if (!ia) konflik.push('Nama "' + a + '" di aturan jangan satu grup tidak ada di daftar nama.');
    if (!ib) konflik.push('Nama "' + b + '" di aturan jangan satu grup tidak ada di daftar nama.');
    if (ia && ib) {
      for (const x of ia) for (const y of ib) {
        if (x === y) konflik.push('"' + a + '" tidak bisa dipisah dari dirinya sendiri.');
        else pasanganPisah.push([x, y]);
      }
    }
  }
  // Ketua: indeks orangnya (kemunculan pertama bila nama dobel).
  const ketuaIdx = new Set();
  for (const k of (o.ketua || [])) {
    const ik = cari(k);
    if (!ik) konflik.push('Nama "' + k + '" di daftar ketua tidak ada di daftar nama.');
    else ketuaIdx.add(ik[0]);
  }
  if (konflik.length) return gagal(konflik);

  // Kelompok hasil gabungan.
  const kelompokMap = new Map();
  nama.forEach((_, i) => {
    const r = cariInduk(i);
    if (!kelompokMap.has(r)) kelompokMap.set(r, []);
    kelompokMap.get(r).push(i);
  });
  const kelompok = [...kelompokMap.values()];
  for (const k of kelompok) {
    if (k.length > maksIsi) {
      const saran = o.mode === 'size' ? 'tambah anggota per grup' : 'kurangi jumlah grup';
      return gagal(['Kelompok "' + k.map((i) => nama[i]).join(', ') + '" berisi ' + k.length + ' orang, tapi tiap grup maksimal ' + maksIsi + ' orang. Kurangi aturan harus satu grup atau ' + saran + '.']);
    }
  }
  // Pisah yang bentrok dengan kelompok yang sama.
  for (const [x, y] of pasanganPisah) {
    if (cariInduk(x) === cariInduk(y)) {
      return gagal(['Aturan bentrok: "' + nama[x] + '" dan "' + nama[y] + '" diminta pisah sekaligus satu grup. Hapus salah satu aturannya.']);
    }
  }
  // Cek cepat: orang-orang yang semuanya saling pisah tidak boleh
  // lebih banyak dari jumlah grup.
  const tetangga = new Map();
  for (const [x, y] of pasanganPisah) {
    if (!tetangga.has(x)) tetangga.set(x, new Set());
    if (!tetangga.has(y)) tetangga.set(y, new Set());
    tetangga.get(x).add(y); tetangga.get(y).add(x);
  }
  let klikTerbesar = [];
  for (const awal of tetangga.keys()) {
    const klik = [awal];
    const calon = [...(tetangga.get(awal) || [])].sort((a, b) => tetangga.get(b).size - tetangga.get(a).size);
    for (const c of calon) {
      if (klik.every((k) => (tetangga.get(c) || new Set()).has(k))) klik.push(c);
    }
    if (klik.length > klikTerbesar.length) klikTerbesar = klik;
  }
  if (klikTerbesar.length > g) {
    return gagal(['Aturan pisah tidak mungkin dipenuhi: ' + klikTerbesar.map((i) => '"' + nama[i] + '"').join(', ') + ' semuanya harus pisah, tapi hanya ada ' + g + ' grup. Tambah jumlah grup atau kurangi aturan pisah.']);
  }

  const ketuaCukup = ketuaIdx.size >= g;
  if (ketuaIdx.size > 0 && !ketuaCukup) {
    pesan.push('Ketua hanya ' + ketuaIdx.size + ' orang untuk ' + g + ' grup, jadi ' + (g - ketuaIdx.size) + ' grup tidak punya ketua.');
  }

  // Acak + coba sampai semua aturan terpenuhi.
  const alasanGagal = { pisah: new Map(), seimbang: 0, ketua: 0, muat: 0 };
  for (let coba = 0; coba < maksCoba; coba++) {
    const urutan = acakUrutan(kelompok, rnd);
    const isi = Array.from({ length: g }, () => []);
    let muat = true;
    for (const k of urutan) {
      // Kelompok masuk ke grup paling sedikit isinya yang masih muat.
      let target = -1;
      for (let j = 0; j < g; j++) {
        if (isi[j].length + k.length > maksIsi) continue;
        if (target === -1 || isi[j].length < isi[target].length) target = j;
      }
      if (target === -1) { muat = false; break; }
      isi[target].push(...k);
    }
    if (!muat) { alasanGagal.muat++; continue; }
    if (isi.some((gr) => gr.length < minIsi)) { alasanGagal.seimbang++; continue; }
    const grupDari = new Array(n);
    isi.forEach((gr, j) => gr.forEach((i) => { grupDari[i] = j; }));
    let langgar = null;
    for (const [x, y] of pasanganPisah) {
      if (grupDari[x] === grupDari[y]) { langgar = [x, y]; break; }
    }
    if (langgar) {
      const kunci = nama[langgar[0]] + '|' + nama[langgar[1]];
      alasanGagal.pisah.set(kunci, (alasanGagal.pisah.get(kunci) || 0) + 1);
      continue;
    }
    if (ketuaCukup) {
      const adaKetua = isi.map((gr) => gr.some((i) => ketuaIdx.has(i)));
      if (adaKetua.some((v) => !v)) { alasanGagal.ketua++; continue; }
    }
    const grupNama = isi.map((gr) => gr.map((i) => nama[i]));
    const ketuaGrup = isi.map((gr) => {
      const k = gr.find((i) => ketuaIdx.has(i));
      return k === undefined ? null : nama[k];
    });
    return { ok: true, grup: grupNama, ketua: ketuaGrup, pesan, konflik: [] };
  }
  // Semua percobaan gagal: laporkan penyebab yang paling sering muncul.
  if (alasanGagal.pisah.size) {
    let terbanyak = null, jumlah = 0;
    for (const [k, v] of alasanGagal.pisah) if (v > jumlah) { jumlah = v; terbanyak = k; }
    const [a, b] = terbanyak.split('|');
    return gagal(['Aturan pisah "' + a + '" dan "' + b + '" tidak bisa dipenuhi bersama aturan lainnya setelah ' + maksCoba + ' kali mencoba. Kurangi aturan pisah atau tambah jumlah grup.']);
  }
  if (alasanGagal.seimbang > 0 || alasanGagal.muat > 0) {
    return gagal(['Tidak bisa membagi rata karena kelompok "harus satu grup" tidak muat dibagi seimbang. Kurangi aturan harus satu grup atau ubah jumlah grup.']);
  }
  if (alasanGagal.ketua > 0) {
    return gagal(['Ketua tidak bisa tersebar merata ke semua grup karena aturan lainnya. Coba ubah daftar ketua atau aturan pisah.']);
  }
  return gagal(['Tidak bisa membagi grup dengan aturan yang ada setelah ' + maksCoba + ' kali mencoba. Coba kurangi aturannya.']);
}

export const meta = {"id": "acak-grup", "name": "Pembagi Grup Acak", "cat": "fun", "icon": "👥", "desc": "Bagi daftar nama jadi beberapa grup acak.", "keywords": "grup,acak,kelompok,bagi,random", "file": "tools/fun/acak-grup.js"};
export { parseNama, parsePasangan, bagiGrup };
export function render(root) {
  const daftar = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nSari\nAndi\nDewi\nRudi\nTono');
  const mode = T.select([['count', 'Jumlah grup'], ['size', 'Anggota per grup']], 'count');
  const angka = T.input('number', 'cth: 3', '3');
  angka.min = '1';
  const pisah = T.ta(3, 'Satu pasangan per baris\ncth:\nBudi, Sari\nAndi vs Dewi');
  const bersama = T.ta(3, 'Satu pasangan per baris\ncth:\nBudi, Sari\nAndi vs Dewi');
  const ketua = T.ta(3, 'Satu nama per baris\ncth:\nBudi\nSari');
  const box = T.out();
  let anim = null;
  T.onLeave(() => { if (anim) clearInterval(anim); });

  const names = () => parseNama(daftar.value);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const tampil = (hasil) => {
    T.show(box, '');
    if (hasil.pesan.length) {
      const note = T.el('<p class="dim" style="font-size:13px;line-height:1.6;margin:0 0 10px"></p>');
      note.textContent = hasil.pesan.join(' ');
      box.appendChild(note);
    }
    let teks = '';
    hasil.grup.forEach((g, i) => {
      const ketuaNama = hasil.ketua[i];
      const anggota = g.slice();
      if (ketuaNama) {
        const k = anggota.indexOf(ketuaNama);
        if (k > 0) { anggota.splice(k, 1); anggota.unshift(ketuaNama); }
      }
      const baris = anggota.map((nm, j) => (j === 0 && ketuaNama ? nm + ' (ketua)' : nm));
      const label = 'Grup ' + (i + 1);
      teks += label + ':\n' + baris.map((n) => '- ' + n).join('\n') + '\n\n';
      const card = T.el('<div class="out" style="margin-bottom:10px"><p class="mut" style="font-size:12px;margin:0 0 6px"></p><p style="font-size:14px;line-height:1.7;margin:0"></p></div>');
      card.querySelector('p:first-child').textContent = label + ' (' + g.length + ' orang)';
      card.querySelector('p:nth-child(2)').textContent = baris.join(', ');
      box.appendChild(card);
    });
    box.appendChild(T.row(
      T.copyBtn(() => teks.trim(), 'Salin Hasil'),
      T.btn('⬇️ Unduh TXT', () => {
        const d = new Date();
        const nama = 'pembagian-grup-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.txt';
        T.dl(nama, teks.trim(), 'text/plain');
        T.toast('TXT terunduh');
      })
    ));
  };

  const bagi = () => {
    const list = names();
    if (list.length < 2) { T.show(box, '<p class="warn">Isi minimal 2 nama dulu ya.</p>'); return; }
    let n = T.num(angka.value);
    if (!n || n < 1) { T.toast('Masukkan angka yang valid'); angka.focus(); return; }
    n = Math.floor(n);
    const pisahParsed = parsePasangan(pisah.value);
    const bersamaParsed = parsePasangan(bersama.value);
    const salahBaris = [...pisahParsed.salah, ...bersamaParsed.salah];
    if (salahBaris.length) {
      T.show(box, '<p class="warn">Baris ini tidak terbaca sebagai pasangan (tulis "Nama, Nama" atau "Nama vs Nama"): ' + salahBaris.map(T.esc).join(', ') + '</p>');
      return;
    }
    if (anim) clearInterval(anim);
    let tick = 0;
    anim = setInterval(() => {
      const peek = shuffle(list).slice(0, Math.min(6, list.length));
      T.show(box, '<div class="big center" style="font-size:16px">' + peek.map(T.esc).join(' · ') + '</div>');
      if (++tick > 12) {
        clearInterval(anim); anim = null;
        const hasil = bagiGrup(list, {
          mode: mode.value, angka: n,
          pisah: pisahParsed.pasangan, bersama: bersamaParsed.pasangan,
          ketua: parseNama(ketua.value),
        });
        if (!hasil.ok) {
          T.show(box, '<p class="warn">' + hasil.konflik.map(T.esc).join('<br>') + '</p>');
          return;
        }
        tampil(hasil);
      }
    }, 90);
  };

  root.appendChild(T.field('Daftar nama', daftar));
  root.appendChild(T.field('Mode pembagian', mode));
  root.appendChild(T.field('Angka', angka));
  root.appendChild(T.field('Jangan satu grup (opsional)', pisah, 'Pasangan yang harus pisah. Satu pasangan per baris, pisahkan dengan koma atau "vs".'));
  root.appendChild(T.field('Harus satu grup (opsional)', bersama, 'Pasangan yang harus selalu satu grup. Format sama seperti di atas.'));
  root.appendChild(T.field('Ketua grup (opsional)', ketua, 'Tulis nama yang sudah ada di daftar. Tiap grup dapat satu ketua bila jumlahnya cukup.'));
  root.appendChild(T.row(T.btn('Bagi!', bagi, true)));
  root.appendChild(box);
}
