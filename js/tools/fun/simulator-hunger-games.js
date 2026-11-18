import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'simulator-hunger-games', name: 'Simulator Hunger Games', cat: 'fun', icon: '🏹', desc: 'Masukkan tributmu dan jalankan battle royale sampai satu tersisa. Tiap ronde punya cerita acaknya sendiri.', keywords: 'hunger games,battle royale,tribut,simulator,game cerita,distrik,arena', since: '6.17.0' };

// Semua narasi ditulis sendiri untuk tool ini (bukan salinan dari simulator lain).
// {a} = tribut pertama, {b} = tribut kedua.
export const ACARA_SIANG = [
  { teks: '{a} menemukan sungai kecil dan mengisi botol airnya sampai penuh.', mati: null },
  { teks: '{a} memanjat pohon tinggi untuk melihat sekeliling arena.', mati: null },
  { teks: '{a} dan {b} berbagi bekal dan sepakat jalan bareng hari ini.', mati: null },
  { teks: '{a} memasang jebakan dari tali dan ranting di dekat sarang kelinci.', mati: null },
  { teks: '{a} menemukan gua kecil dan menjadikannya tempat istirahat.', mati: null },
  { teks: '{a} berlatih melempar tombak ke batang pohon sampai tangannya pegal.', mati: null },
  { teks: '{a} memetik buah liar, mencicipi sedikit dulu sebelum makan banyak.', mati: null },
  { teks: '{a} dan {b} saling kejar di antara pepohonan, lalu sama-sama kehabisan napas.', mati: null },
  { teks: '{a} membuat api unggun kecil dan mengeringkan bajunya yang basah.', mati: null },
  { teks: '{a} mendengar suara langkah dan bersembunyi di balik semak selama satu jam.', mati: null },
  { teks: '{a} menemukan ransel berisi roti kering dan tali tambang.', mati: null },
  { teks: '{a} mencoba memancing di sungai dengan kail dari kawat.', mati: null },
  { teks: '{a} dan {b} bertengkar soal siapa yang boleh tidur di tempat teduh.', mati: null },
  { teks: '{a} menggambar peta arena di tanah dengan ranting.', mati: null },
  { teks: '{a} mengumpulkan daun lebar untuk dijadikan atap darurat.', mati: null },
  { teks: '{a} menyerang {b} dari balik pohon, tapi {b} berhasil menghindar dan kabur.', mati: null },
  { teks: '{a} menantang {b} duel pedang kayu. {b} kalah dan tersungkur.', mati: 'b' },
  { teks: '{a} melempar batu ke arah {b} dari atas bukit. Lemparannya tepat sasaran.', mati: 'b' },
  { teks: '{a} menjebak {b} di lubang yang sudah digali semalaman.', mati: 'b' },
  { teks: '{a} memakan jamur yang ternyata beracun dan tidak bangun lagi.', mati: 'a' },
  { teks: '{a} terpeleset di tebing licin dan jatuh ke jurang.', mati: 'a' },
  { teks: '{a} disengat lebah liar berkali-kali saat mencoba mengambil madu.', mati: 'a' },
  { teks: '{a} tersesat di kabut tebal dan berjalan berputar-putar sampai kelelahan.', mati: null },
  { teks: '{a} menemukan mata air panas dan berendam sebentar untuk menghangatkan badan.', mati: null },
];

export const ACARA_MALAM = [
  { teks: '{a} tidur di atas pohon, mengikat tubuhnya ke dahan supaya tidak jatuh.', mati: null },
  { teks: '{a} berjaga sepanjang malam sambil memegang pisau.', mati: null },
  { teks: '{a} dan {b} tidur bergantian menjaga api unggun.', mati: null },
  { teks: '{a} bermimpi tentang rumah dan bangun dengan mata berkaca-kaca.', mati: null },
  { teks: '{a} mendengar suara dentuman meriam dari kejauhan dan menghitung yang gugur.', mati: null },
  { teks: '{a} kedinginan dan menggigil sampai pagi.', mati: null },
  { teks: '{a} menyelinap ke perkemahan {b} dan mengambil persediaan makanannya.', mati: null },
  { teks: '{a} diserang {b} saat tidur. {a} tidak sempat melawan.', mati: 'a' },
  { teks: '{a} dan {b} saling serang dalam gelap. {b} yang tumbang.', mati: 'b' },
  { teks: '{a} terserang demam tinggi dan kondisinya memburuk sepanjang malam.', mati: 'a' },
];

// Pilih satu acara acak untuk sepasang tribut yang masih hidup.
export function pilihAcara(hidup, rng) {
  const rand = rng || Math.random;
  const daftar = rand() < 0.6 ? ACARA_SIANG : ACARA_MALAM;
  const acara = daftar[Math.floor(rand() * daftar.length)];
  const a = hidup[Math.floor(rand() * hidup.length)];
  let b = a;
  if (hidup.length > 1) {
    do { b = hidup[Math.floor(rand() * hidup.length)]; } while (b === a);
  }
  return { acara, a, b };
}

export function isiNarasi(teks, a, b) {
  return teks.split('{a}').join(a).split('{b}').join(b);
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.hg-tribut{display:flex;gap:10px;align-items:center;background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:10px;margin-bottom:8px}' +
    '.hg-foto{width:48px;height:48px;border-radius:50%;object-fit:cover;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}' +
    '.hg-foto img{width:48px;height:48px;border-radius:50%;object-fit:cover}' +
    '.hg-mati{opacity:.45}' +
    '.hg-mati .hg-nama{text-decoration:line-through}' +
    '.hg-log{background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:14px;margin-top:12px;max-height:420px;overflow-y:auto}' +
    '.hg-log p{margin:0 0 10px;line-height:1.55;font-size:14px}' +
    '.hg-hari{font-weight:800;font-size:16px;margin:14px 0 8px;color:var(--acc)}' +
    '.hg-meninggal{color:var(--err)}' +
    '.hg-pemenang{background:#2e7d4f;color:#fff;border-radius:12px;padding:16px;text-align:center;margin-top:12px}' +
    '.hg-pemenang .hg-nama-besar{font-size:26px;font-weight:800;margin:6px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Tulis nama tributmu, pilih distriknya, dan kalau mau, pasang fotonya. Lalu jalankan gamenya hari demi hari sampai satu tersisa. Semua ceritanya dibuat acak dari daftar kejadian yang ditulis untuk game ini.</p>'));

  const namaI = T.input('text', 'Nama tribut');
  const distrikI = T.select(Array.from({ length: 12 }, (_, i) => [String(i + 1), 'Distrik ' + (i + 1)]), '1');
  const fotoI = document.createElement('input');
  fotoI.type = 'file';
  fotoI.accept = 'image/*';
  fotoI.className = 'inp';
  const daftarEl = T.el('<div></div>');
  const logEl = T.el('<div class="hg-log" hidden></div>');
  const hasilEl = T.el('<div></div>');
  const kontrolEl = T.el('<div></div>');

  let tribut = []; // { nama, distrik, foto, hidup, hariGugur }
  let hari = 0;
  let timerId = null;
  let fotoSementara = '';

  fotoI.addEventListener('change', () => {
    const f = fotoI.files && fotoI.files[0];
    if (!f) { fotoSementara = ''; return; }
    if (f.size > 2 * 1024 * 1024) { T.toast('Fotonya maksimal 2 MB'); fotoI.value = ''; return; }
    const r = new FileReader();
    r.onload = () => { fotoSementara = String(r.result || ''); };
    r.readAsDataURL(f);
  });

  function gambarDaftar() {
    daftarEl.innerHTML = '';
    if (!tribut.length) {
      daftarEl.appendChild(T.el('<p class="hint">Belum ada tribut. Minimal 4 tribut untuk memulai.</p>'));
      return;
    }
    tribut.forEach((t, i) => {
      const d = T.el('<div class="hg-tribut' + (t.hidup ? '' : ' hg-mati') + '"></div>');
      const foto = T.el('<div class="hg-foto"></div>');
      if (t.foto) {
        const im = document.createElement('img');
        im.src = t.foto;
        im.alt = 'Foto ' + t.nama;
        foto.appendChild(im);
      } else {
        foto.textContent = '👤';
      }
      const info = T.el('<div style="flex:1;min-width:0"><div class="hg-nama" style="font-weight:700">' + T.esc(t.nama) + '</div><div class="hint">Distrik ' + t.distrik + (t.hidup ? '' : ' · gugur hari ke-' + t.hariGugur) + '</div></div>');
      const x = T.btn('Hapus', () => {
        tribut.splice(i, 1);
        gambarDaftar();
      });
      x.classList.add('small');
      d.append(foto, info, x);
      daftarEl.appendChild(d);
    });
  }

  function tambahTribut() {
    const nama = namaI.value.trim().slice(0, 30);
    if (!nama) { T.toast('Tulis namanya dulu'); return; }
    if (tribut.length >= 24) { T.toast('Maksimal 24 tribut'); return; }
    if (tribut.some((t) => t.nama.toLowerCase() === nama.toLowerCase())) { T.toast('Nama ini sudah ada'); return; }
    tribut.push({ nama, distrik: parseInt(distrikI.value, 10), foto: fotoSementara, hidup: true, hariGugur: 0 });
    namaI.value = '';
    fotoI.value = '';
    fotoSementara = '';
    gambarDaftar();
    namaI.focus();
  }
  namaI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tambahTribut(); } });

  function tambahContoh() {
    const contoh = [
      ['Andi', 1], ['Budi', 2], ['Citra', 3], ['Dewi', 4],
      ['Eko', 5], ['Fitri', 6], ['Gilang', 7], ['Hana', 8],
    ];
    contoh.forEach(([nama, d]) => {
      if (!tribut.some((t) => t.nama === nama) && tribut.length < 24) {
        tribut.push({ nama, distrik: d, foto: '', hidup: true, hariGugur: 0 });
      }
    });
    gambarDaftar();
    T.toast('8 tribut contoh ditambahkan. Kamu bisa menghapus atau menambah lagi.');
  }

  function tulisLog(html, kelas) {
    const p = document.createElement('p');
    if (kelas) p.className = kelas;
    p.innerHTML = html;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function jalankanHari() {
    const hidup = tribut.filter((t) => t.hidup);
    if (hidup.length <= 1) { akhiri(); return; }
    hari++;
    tulisLog('Hari ke-' + hari, 'hg-hari');
    // 2-4 kejadian per hari.
    const jumlah = Math.min(hidup.length, 2 + Math.floor(Math.random() * 3));
    for (let i = 0; i < jumlah; i++) {
      const masih = tribut.filter((t) => t.hidup);
      if (masih.length <= 1) break;
      const { acara, a, b } = pilihAcara(masih.map((t) => t.nama), Math.random);
      const teks = isiNarasi(acara.teks, a, b);
      const korban = acara.mati === 'a' ? a : acara.mati === 'b' ? b : null;
      if (korban) {
        const t = tribut.find((x) => x.nama === korban);
        if (t) { t.hidup = false; t.hariGugur = hari; }
        tulisLog(T.esc(teks) + ' <span class="hg-meninggal">💀 ' + T.esc(korban) + ' gugur.</span>');
      } else {
        tulisLog(T.esc(teks));
      }
    }
    const sisa = tribut.filter((t) => t.hidup).length;
    tulisLog('<span class="hint">' + sisa + ' tribut tersisa.</span>');
    gambarDaftar();
    if (sisa <= 1) akhiri();
  }

  function akhiri() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    const pemenang = tribut.find((t) => t.hidup);
    if (!pemenang) return;
    hasilEl.innerHTML = '';
    const k = T.el('<div class="hg-pemenang"></div>');
    k.innerHTML = '<div>🏆 Pemenangnya</div><div class="hg-nama-besar">' + T.esc(pemenang.nama) + '</div><div>Distrik ' + pemenang.distrik + ' · bertahan ' + hari + ' hari</div>';
    hasilEl.appendChild(k);
    kontrolEl.innerHTML = '';
    kontrolEl.appendChild(T.btn('Main lagi dari awal', () => {
      tribut.forEach((t) => { t.hidup = true; t.hariGugur = 0; });
      hari = 0;
      logEl.innerHTML = '';
      logEl.hidden = true;
      hasilEl.innerHTML = '';
      kontrolEl.innerHTML = '';
      gambarDaftar();
      kontrolEl.appendChild(btnMulai);
    }, true));
  }

  const btnMulai = T.btn('Mulai gamenya', () => {
    if (tribut.length < 4) { T.toast('Minimal 4 tribut untuk memulai'); return; }
    logEl.hidden = false;
    logEl.innerHTML = '';
    hasilEl.innerHTML = '';
    hari = 0;
    tulisLog('Arena dibuka. ' + tribut.length + ' tribut masuk, hanya satu yang keluar sebagai pemenang.');
    kontrolEl.innerHTML = '';
    const btnHari = T.btn('Jalankan satu hari', jalankanHari, true);
    const btnOtomatis = T.btn('Jalankan otomatis', () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
        btnOtomatis.textContent = 'Jalankan otomatis';
        return;
      }
      btnOtomatis.textContent = 'Berhenti otomatis';
      timerId = setInterval(() => {
        if (tribut.filter((t) => t.hidup).length <= 1) {
          clearInterval(timerId);
          timerId = null;
          akhiri();
          return;
        }
        jalankanHari();
      }, 2200);
    });
    const btnReset = T.btn('Ulang', () => {
      if (timerId) { clearInterval(timerId); timerId = null; }
      tribut.forEach((t) => { t.hidup = true; t.hariGugur = 0; });
      hari = 0;
      logEl.innerHTML = '';
      logEl.hidden = true;
      hasilEl.innerHTML = '';
      kontrolEl.innerHTML = '';
      kontrolEl.appendChild(btnMulai);
      gambarDaftar();
    });
    kontrolEl.append(T.row(btnHari, btnOtomatis, btnReset));
  }, true);

  onLeave(() => { if (timerId) clearInterval(timerId); });

  root.append(
    T.field('Nama tribut', namaI),
    T.grid2(T.field('Distrik', distrikI), T.field('Foto (opsional)', fotoI)),
    T.row(T.btn('Tambah tribut', tambahTribut), T.btn('Isi 8 tribut contoh', tambahContoh)),
    daftarEl,
    kontrolEl,
    logEl,
    hasilEl,
  );
  kontrolEl.appendChild(btnMulai);
  gambarDaftar();
}
