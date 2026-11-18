import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'game-imposter', name: 'Game Imposter', cat: 'fun', icon: '🕵️', desc: 'Satu HP digilir: semua pemain dapat kata yang sama, kecuali satu imposter. Tebak siapa yang bohong.', keywords: 'imposter,game kata,tebak kata,party game,mafia,permainan kelompok,impostor', since: '6.17.0' };

// 35 kategori kata, daftar kata dipilih sendiri (kata umum sehari-hari).
export const KATEGORI = [
  { nama: 'Buah-buahan', kata: ['Mangga', 'Pisang', 'Apel', 'Jeruk', 'Anggur', 'Durian', 'Rambutan', 'Semangka'] },
  { nama: 'Hewan Darat', kata: ['Kucing', 'Anjing', 'Sapi', 'Kambing', 'Kuda', 'Gajah', 'Harimau', 'Kelinci'] },
  { nama: 'Hewan Laut', kata: ['Hiu', 'Paus', 'Gurita', 'Kepiting', 'Udang', 'Lumba-lumba', 'Penyu', 'Ubur-ubur'] },
  { nama: 'Sayuran', kata: ['Bayam', 'Wortel', 'Kentang', 'Kol', 'Brokoli', 'Tomat', 'Timun', 'Cabai'] },
  { nama: 'Makanan Indonesia', kata: ['Rendang', 'Soto', 'Gado-gado', 'Nasi Goreng', 'Sate', 'Bakso', 'Rawon', 'Pempek'] },
  { nama: 'Minuman', kata: ['Teh', 'Kopi', 'Jus', 'Susu', 'Soda', 'Es Kelapa', 'Wedang Jahe', 'Cincau'] },
  { nama: 'Alat Dapur', kata: ['Panci', 'Wajan', 'Pisau', 'Talenan', 'Sendok', 'Garpu', 'Piring', 'Mangkuk'] },
  { nama: 'Pakaian', kata: ['Kemeja', 'Kaos', 'Celana', 'Jaket', 'Sepatu', 'Topi', 'Sarung', 'Batik'] },
  { nama: 'Benda di Kamar', kata: ['Kasur', 'Bantal', 'Lemari', 'Meja', 'Kursi', 'Lampu', 'Cermin', 'Jam'] },
  { nama: 'Kendaraan', kata: ['Mobil', 'Motor', 'Bus', 'Kereta', 'Pesawat', 'Kapal', 'Sepeda', 'Becak'] },
  { nama: 'Olahraga', kata: ['Sepak Bola', 'Basket', 'Badminton', 'Renang', 'Lari', 'Voli', 'Tenis', 'Panahan'] },
  { nama: 'Alat Musik', kata: ['Gitar', 'Piano', 'Drum', 'Biola', 'Seruling', 'Gamelan', 'Harmonika', 'Saksofon'] },
  { nama: 'Benda Sekolah', kata: ['Pensil', 'Pulpen', 'Buku', 'Penghapus', 'Penggaris', 'Tas', 'Rautan', 'Spidol'] },
  { nama: 'Profesi', kata: ['Dokter', 'Guru', 'Polisi', 'Petani', 'Nelayan', 'Pilot', 'Koki', 'Pemadam'] },
  { nama: 'Tempat', kata: ['Pantai', 'Gunung', 'Hutan', 'Pasar', 'Sekolah', 'Rumah Sakit', 'Bioskop', 'Kebun Binatang'] },
  { nama: 'Cuaca', kata: ['Hujan', 'Panas', 'Mendung', 'Badai', 'Pelangi', 'Salju', 'Kabut', 'Angin'] },
  { nama: 'Warna', kata: ['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Oranye', 'Pink', 'Cokelat'] },
  { nama: 'Bentuk', kata: ['Lingkaran', 'Segitiga', 'Persegi', 'Bintang', 'Hati', 'Oval', 'Kubus', 'Silinder'] },
  { nama: 'Serangga', kata: ['Semut', 'Lebah', 'Kupu-kupu', 'Nyamuk', 'Lalat', 'Capung', 'Belalang', 'Kumbang'] },
  { nama: 'Burung', kata: ['Elang', 'Merpati', 'Gagak', 'Beo', 'Kenari', 'Burung Hantu', 'Flamingo', 'Penguin'] },
  { nama: 'Perabot Rumah', kata: ['Sofa', 'Televisi', 'Kulkas', 'Kompor', 'Mesin Cuci', 'Kipas Angin', 'AC', 'Dispenser'] },
  { nama: 'Makanan Manis', kata: ['Es Krim', 'Cokelat', 'Permen', 'Kue', 'Donat', 'Puding', 'Klepon', 'Serabi'] },
  { nama: 'Makanan Cepat Saji', kata: ['Burger', 'Pizza', 'Kentang Goreng', 'Hotdog', 'Ayam Goreng', 'Spaghetti', 'Sandwich', 'Nugget'] },
  { nama: 'Tanaman', kata: ['Mawar', 'Melati', 'Anggrek', 'Kaktus', 'Bambu', 'Padi', 'Kelapa', 'Kamboja'] },
  { nama: 'Benda di Kamar Mandi', kata: ['Sabun', 'Sampo', 'Sikat Gigi', 'Handuk', 'Gayung', 'Ember', 'Pasta Gigi', 'Sisir'] },
  { nama: 'Mainan', kata: ['Boneka', 'Mobil-mobilan', 'Lego', 'Layang-layang', 'Gasing', 'Kelereng', 'Yoyo', 'Puzzle'] },
  { nama: 'Cerita Rakyat', kata: ['Malin Kundang', 'Timun Mas', 'Sangkuriang', 'Bawang Merah', 'Keong Mas', 'Lutung Kasarung', 'Jaka Tarub', 'Roro Jonggrang'] },
  { nama: 'Negara', kata: ['Indonesia', 'Jepang', 'Korea', 'Thailand', 'Malaysia', 'Singapura', 'Australia', 'Belanda'] },
  { nama: 'Kota di Indonesia', kata: ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Yogyakarta', 'Bali', 'Makassar', 'Semarang'] },
  { nama: 'Hari Besar', kata: ['Lebaran', 'Natal', 'Nyepi', 'Waisak', 'Imlek', 'Tahun Baru', 'Kemerdekaan', 'Maulid'] },
  { nama: 'Anggota Tubuh', kata: ['Mata', 'Hidung', 'Telinga', 'Tangan', 'Kaki', 'Rambut', 'Gigi', 'Jari'] },
  { nama: 'Perasaan', kata: ['Senang', 'Sedih', 'Marah', 'Takut', 'Kaget', 'Malu', 'Bangga', 'Rindu'] },
  { nama: 'Pekerjaan Rumah', kata: ['Menyapu', 'Mengepel', 'Mencuci', 'Memasak', 'Menyiram', 'Menyetrika', 'Membersihkan', 'Merapikan'] },
  { nama: 'Benda Elektronik', kata: ['HP', 'Laptop', 'Radio', 'Kamera', 'Jam Tangan', 'Kalkulator', 'Printer', 'Speaker'] },
  { nama: 'Benda Langit', kata: ['Matahari', 'Bulan', 'Bintang', 'Planet', 'Komet', 'Meteor', 'Galaksi', 'Awan'] },
];

// Pilih kata dan imposter. rng bisa di-inject untuk pengujian.
export function mulaiRonde(namaPemain, indeksKategori, rng) {
  const rand = rng || Math.random;
  const kat = indeksKategori === 'acak'
    ? KATEGORI[Math.floor(rand() * KATEGORI.length)]
    : KATEGORI[indeksKategori];
  const kata = kat.kata[Math.floor(rand() * kat.kata.length)];
  const imposter = Math.floor(rand() * namaPemain.length);
  return { kategori: kat.nama, kata, imposter };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.gi-kartu{background:var(--deep);border:1px solid var(--line-soft);border-radius:16px;padding:24px 16px;text-align:center;margin:12px 0}' +
    '.gi-kartu h3{margin:0 0 6px;font-size:20px}' +
    '.gi-kata{font-size:34px;font-weight:800;margin:14px 0;line-height:1.2}' +
    '.gi-imposter{color:var(--err)}' +
    '.gi-timer{font-size:52px;font-weight:800;font-family:var(--font-m);text-align:center;margin:8px 0}' +
    '.gi-pemain{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}' +
    '.gi-chip{padding:8px 12px;border:1px solid var(--line-soft);border-radius:999px;font-size:14px;background:var(--surface)}' +
    '.gi-chip button{background:none;border:none;color:var(--err);cursor:pointer;font-size:14px;margin-left:4px}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Cara main: tulis nama semua pemain, lalu HP digilir satu-satu. Semua pemain melihat kata yang sama, kecuali satu orang yang jadi imposter dan tidak tahu katanya. Setelah itu diskusi dan tebak siapa imposternya.</p>'));

  // ---- Tahap 1: daftar pemain ----
  const namaI = T.input('text', 'Nama pemain, lalu tekan Tambah');
  const katSel = T.select([['acak', 'Acak (kategori apa saja)'], ...KATEGORI.map((k, i) => [String(i), k.nama])], 'acak');
  const durasiSel = T.select([['60', '1 menit'], ['120', '2 menit'], ['180', '3 menit'], ['300', '5 menit']], '180');
  const daftarEl = T.el('<div class="gi-pemain"></div>');
  const tahap = T.el('<div></div>');

  let pemain = [];
  let ronde = null;
  let giliran = 0;
  let kartuTerbuka = false;
  let timerId = null;
  let sisaDetik = 0;
  let suara = {}; // nama -> jumlah suara

  function gambarDaftar() {
    daftarEl.innerHTML = '';
    if (!pemain.length) {
      daftarEl.appendChild(T.el('<p class="hint">Belum ada pemain. Minimal 3 orang untuk main.</p>'));
      return;
    }
    pemain.forEach((nama, i) => {
      const c = T.el('<span class="gi-chip">' + T.esc(nama) + '</span>');
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '✕';
      x.setAttribute('aria-label', 'Hapus ' + nama);
      x.addEventListener('click', () => { pemain.splice(i, 1); gambarDaftar(); });
      c.appendChild(x);
      daftarEl.appendChild(c);
    });
  }

  function tambahPemain() {
    const nama = namaI.value.trim().slice(0, 20);
    if (!nama) { T.toast('Tulis namanya dulu'); return; }
    if (pemain.length >= 20) { T.toast('Maksimal 20 pemain'); return; }
    if (pemain.includes(nama)) { T.toast('Nama ini sudah ada'); return; }
    pemain.push(nama);
    namaI.value = '';
    gambarDaftar();
    namaI.focus();
  }
  namaI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tambahPemain(); } });

  function mulai() {
    if (pemain.length < 3) { T.toast('Minimal 3 pemain untuk main'); return; }
    const kat = katSel.value === 'acak' ? 'acak' : parseInt(katSel.value, 10);
    ronde = mulaiRonde(pemain, kat);
    giliran = 0;
    kartuTerbuka = false;
    suara = {};
    tampilKartu();
  }

  function tampilKartu() {
    tahap.innerHTML = '';
    const nama = pemain[giliran];
    const k = T.el('<div class="gi-kartu"></div>');
    if (!kartuTerbuka) {
      k.innerHTML = '<h3>Giliran ' + T.esc(nama) + '</h3>' +
        '<p class="hint">Pastikan hanya ' + T.esc(nama) + ' yang melihat layar, lalu tekan tombol di bawah.</p>';
      const b = T.btn('Lihat kartuku', () => { kartuTerbuka = true; tampilKartu(); }, true);
      k.appendChild(b);
    } else {
      const adalahImposter = giliran === ronde.imposter;
      k.innerHTML = '<h3>' + T.esc(nama) + '</h3>' +
        (adalahImposter
          ? '<p class="gi-kata gi-imposter">KAMU IMPOSTER</p><p class="hint">Kamu tidak tahu katanya. Ikuti diskusi dan jangan sampai ketahuan.</p>'
          : '<p class="hint">Kategorinya: ' + T.esc(ronde.kategori) + '</p><p class="gi-kata">' + T.esc(ronde.kata) + '</p><p class="hint">Ingat kata ini, jangan sampai terlihat pemain lain.</p>');
      const lanjut = T.btn(giliran + 1 < pemain.length ? 'Sembunyikan dan oper ke pemain berikutnya' : 'Sembunyikan dan mulai diskusi', () => {
        kartuTerbuka = false;
        if (giliran + 1 < pemain.length) { giliran++; tampilKartu(); }
        else tampilDiskusi();
      }, true);
      k.appendChild(lanjut);
    }
    const info = T.el('<p class="hint" style="text-align:center">Pemain ' + (giliran + 1) + ' dari ' + pemain.length + '</p>');
    tahap.append(k, info);
  }

  function tampilDiskusi() {
    tahap.innerHTML = '';
    sisaDetik = parseInt(durasiSel.value, 10);
    const k = T.el('<div class="gi-kartu"></div>');
    k.innerHTML = '<h3>Waktunya diskusi</h3>' +
      '<p class="hint">Giliran memberi petunjuk tentang kata itu, satu orang satu petunjuk. Imposter harus ikut memberi petunjuk tanpa tahu katanya. Kalau waktunya habis, lanjut ke voting.</p>';
    const timerEl = T.el('<div class="gi-timer"></div>');
    const tulisTimer = () => {
      const m = Math.floor(sisaDetik / 60), d = sisaDetik % 60;
      timerEl.textContent = m + ':' + String(d).padStart(2, '0');
    };
    tulisTimer();
    const btnMulai = T.btn('Mulai timer', () => {
      if (timerId) return;
      timerId = setInterval(() => {
        sisaDetik--;
        tulisTimer();
        if (sisaDetik <= 0) {
          clearInterval(timerId);
          timerId = null;
          T.toast('Waktu diskusi habis. Lanjut ke voting.');
          try { T.beep(880, 0.3, 'sine'); T.beep(880, 0.3, 'sine', 0.35); } catch (e) {}
        }
      }, 1000);
      btnMulai.disabled = true;
    }, true);
    const btnVote = T.btn('Lanjut ke voting', () => {
      if (timerId) { clearInterval(timerId); timerId = null; }
      tampilVoting();
    });
    k.append(timerEl, T.row(btnMulai, btnVote));
    tahap.appendChild(k);
  }

  function tampilVoting() {
    tahap.innerHTML = '';
    const k = T.el('<div class="gi-kartu"></div>');
    k.innerHTML = '<h3>Siapa imposternya?</h3><p class="hint">Tiap pemain menunjuk satu orang. Yang paling banyak ditunjuk akan terungkap.</p>';
    const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div>');
    pemain.forEach((nama) => {
      const b = T.btn(nama + (suara[nama] ? ' (' + suara[nama] + ')' : ''), () => {
        suara[nama] = (suara[nama] || 0) + 1;
        tampilVoting();
      });
      grid.appendChild(b);
    });
    const totalSuara = Object.values(suara).reduce((a, b) => a + b, 0);
    const info = T.el('<p class="hint" style="margin-top:10px">Suara masuk: ' + totalSuara + ' dari ' + pemain.length + '</p>');
    const buka = T.btn('Buka hasilnya', () => {
      if (totalSuara === 0) { T.toast('Belum ada suara masuk'); return; }
      tampilHasil();
    }, true);
    k.append(grid, info, buka);
    tahap.appendChild(k);
  }

  function tampilHasil() {
    tahap.innerHTML = '';
    let terbanyak = null, maks = 0;
    pemain.forEach((nama) => {
      if ((suara[nama] || 0) > maks) { maks = suara[nama]; terbanyak = nama; }
    });
    const ketahuan = terbanyak === pemain[ronde.imposter];
    const k = T.el('<div class="gi-kartu"></div>');
    k.innerHTML = '<h3>' + (ketahuan ? 'Imposter ketahuan!' : 'Imposter lolos!') + '</h3>' +
      '<p>Yang paling banyak ditunjuk: <b>' + T.esc(terbanyak) + '</b> (' + maks + ' suara).</p>' +
      '<p>Imposter sebenarnya: <b>' + T.esc(pemain[ronde.imposter]) + '</b>.</p>' +
      '<p>Kata ronde ini: <b>' + T.esc(ronde.kata) + '</b> (kategori ' + T.esc(ronde.kategori) + ').</p>';
    const lagi = T.btn('Main lagi (kata baru)', () => { mulai(); }, true);
    const ubah = T.btn('Ubah pemain', () => { tahap.innerHTML = ''; });
    k.append(T.row(lagi, ubah));
    tahap.appendChild(k);
  }

  onLeave(() => { if (timerId) clearInterval(timerId); });

  root.append(
    T.field('Nama pemain', namaI),
    T.btn('Tambah pemain', tambahPemain),
    daftarEl,
    T.field('Kategori kata', katSel),
    T.field('Waktu diskusi', durasiSel),
    T.btn('Mulai permainan', mulai, true),
    tahap,
  );
  gambarDaftar();
}
