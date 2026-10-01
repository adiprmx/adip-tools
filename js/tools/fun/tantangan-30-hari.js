import { h as T } from '../../core.js?v=6.6.0';

export const meta = {"id":"tantangan-30-hari","name":"Tantangan 30 Hari","cat":"fun","icon":"🗓️","desc":"30 tantangan harian per tema + checklist progres yang kesimpan.","keywords":"tantangan,challenge,30 hari,habit,kebiasaan,olahraga,baca,hemat,produktif"};

const KEY = 'adip-tools-tantangan-30-hari';

const TEMA = {
  olahraga: { label: '🏃 Olahraga', bank: [
    'Jalan kaki santai 15 menit', 'Push-up 10× (boleh dicicil 2 set)', 'Stretching 10 menit setelah bangun',
    'Naik-turun tangga 5 menit', 'Squat 20×', 'Plank 30 detik × 3 set',
    'Jogging ringan 10 menit', 'Jumping jack 30×', 'Yoga pemula 10 menit (ikut video)',
    'Jalan kaki 30 menit, HP ditinggal', 'Sit-up 15×', 'Wall sit 45 detik × 2',
    'Lunges 10× tiap kaki', 'Skipping 3 menit', 'Peregangan leher & bahu 5 menit',
    'Berenang / bersepeda 20 menit (kalau bisa)', 'Burpees 10× (pelan-pelan aja)', 'Jalan cepat 20 menit',
    'Mountain climber 20×', 'Istirahat aktif: beberes rumah 20 menit', 'Push-up 15×',
    'Squat 30×', 'Plank 1 menit', 'Jogging 15 menit',
    'Stretching full body 15 menit', 'Naik-turun tangga 10 menit', 'Jumping jack 50×',
    'Yoga 15 menit', 'Jalan kaki 45 menit', 'Sit-up 20× + plank 45 detik',
    'Bebas: olahraga favoritmu 20 menit', 'Evaluasi: catat progres badan minggu ini',
  ] },
  baca: { label: '📚 Baca', bank: [
    'Baca 10 halaman buku', 'Baca 1 artikel panjang sampai habis', 'Baca 1 cerpen',
    'Baca 15 menit sebelum tidur', 'Baca 1 bab buku nonfiksi', 'Baca berita dari 2 sumber berbeda',
    'Baca puisi, resapi maknanya', 'Baca 20 halaman', 'Dengerin podcast edukasi 20 menit',
    'Baca ulang catatan / highlight bukumu', 'Baca 1 bab biografi tokoh', 'Baca 1 esai',
    'Baca komik 1 chapter (tetap baca!)', 'Baca 30 menit tanpa gangguan', 'Tulis 3 hal yang kamu pelajari dari bacaan',
    'Baca 1 artikel sains populer', 'Baca 10 halaman buku bahasa Inggris', 'Baca 1 thread edukasi sampai tuntas',
    'Baca 1 bab buku self-improvement', 'Rekomendasikan 1 buku ke teman', 'Baca 25 halaman',
    'Baca koran / majalah 20 menit', 'Baca 1 dongeng / cerita rakyat', 'Rangkum bacaan hari ini dalam 5 kalimat',
    'Baca 15 halaman', 'Baca puisi karya penyair Indonesia', 'Baca 1 artikel sejarah',
    'Baca 40 menit', 'Intip daftar isi buku baru & pilih 1 buat dibaca', 'Diskusiin bacaanmu sama 1 orang',
    'Baca 20 halaman buku favorit', 'Bikin daftar 5 buku yang mau dibaca bulan depan',
  ] },
  hemat: { label: '💰 Hemat', bank: [
    'Catat SEMUA pengeluaran hari ini', 'Masak sendiri, jangan jajan', 'Bawa bekal & tumbler sendiri',
    'Nggak buka aplikasi belanja seharian', 'Pisahkan 10% uang jajan ke tabungan', 'Batalkan 1 langganan yang jarang dipakai',
    'Jual 1 barang yang nggak kepakai', 'Bandingin harga sebelum beli sesuatu', 'Masak dari bahan yang sudah ada',
    'Catat 3 pengeluaran impulsif minggu ini', 'Tentukan budget mingguan & tulis', 'Nggak beli kopi, bikin sendiri',
    'Pakai transportasi termurah hari ini', 'Sisihkan uang receh ke celengan', 'Review tagihan & cari yang bisa dihemat',
    'Makan di rumah seharian penuh', 'Tulis daftar belanja sebelum ke warung', 'Tunda beli barang keinginan 7 hari',
    'Hitung total pengeluaran minggu ini', 'Nabung Rp10.000 (nominal bebas, yang penting rutin)', 'Bersihkan dompet dari struk tak perlu',
    'Pakai barang sampai habis sebelum beli baru', 'Cari 1 alternatif gratis dari kebiasaan berbayar', 'Catat pemasukan & pengeluaran bulan ini',
    'Tantang diri: nol jajan hari ini', 'Pelajari 1 istilah keuangan (mis. bunga majemuk)', 'Buat dana darurat mini Rp50.000',
    'Tukar 1 kebiasaan boros dengan versi murahnya', 'Hitung berapa yang berhasil dihemat minggu ini', 'Rencanakan budget bulan depan',
    'Nabung Rp20.000', 'Traktir diri 1 jajan kecil dari hasil hematmu',
  ] },
  produktif: { label: '⚡ Produktif', bank: [
    'Tulis 3 prioritas hari ini', 'Bereskan meja kerja / belajar', 'Kerjakan 1 tugas pakai pomodoro (25 menit)',
    'Balas semua chat & email tertunda', 'Rapikan file di HP 15 menit', 'Bangun 30 menit lebih pagi',
    'Olahraga ringan 10 menit', 'Baca 10 halaman buku', 'Meditasi / diam 5 menit',
    'Tulis jurnal 5 menit', 'Selesaikan 1 tugas yang paling ditunda', 'Belajar skill baru 20 menit',
    'Rapikan kamar 15 menit', 'Buat to-do list besok malam ini', 'Hapus 10 foto / file sampah di HP',
    'Telepon 1 orang yang dikangenin', 'Kerjakan tugas tanpa buka sosmed 1 jam', 'Tulis 1 hal yang disyukuri',
    'Pelajari 5 kosakata baru', 'Bereskan 1 laci / lemari', 'Fokus 2 jam: 1 proyek penting',
    'Olahraga 20 menit', 'Baca artikel edukasi 20 menit', 'Tulis rencana minggu depan',
    'Selesaikan 2 tugas kecil yang menumpuk', 'Digital detox 2 jam', 'Belajar masak 1 menu baru',
    'Rapikan catatan & arsip', 'Evaluasi: apa yang berhasil minggu ini?', 'Istirahat berkualitas: tidur 8 jam',
    'Bantu 1 orang tanpa diminta', 'Tulis surat untuk dirimu 1 tahun ke depan',
  ] },
};

function loadAll() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    return (d && typeof d === 'object') ? d : {};
  } catch (e) { return {}; }
}
function saveAll(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* abaikan */ }
}
const acak = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export function render(root) {
  const temaSel = T.select(Object.keys(TEMA).map((k) => [k, TEMA[k].label]), 'olahraga');
  const area = T.el('<div></div>');
  let tema = 'olahraga';

  const gambar = () => {
    area.innerHTML = '';
    const semua = loadAll();
    const st = semua[tema];
    if (!st || !Array.isArray(st.list) || st.list.length !== 30) {
      area.appendChild(T.el('<p class="hint">Belum ada tantangan <b>' + T.esc(TEMA[tema].label) + '</b>. Klik tombol di bawah buat generate 30 tantangan acak — urutannya beda tiap generate, tapi bakal kesimpan setelah itu.</p>'));
      area.appendChild(T.row(T.btn('Buat 30 tantangan', () => {
        const d = loadAll();
        d[tema] = { list: acak(TEMA[tema].bank).slice(0, 30), done: new Array(30).fill(false) };
        saveAll(d);
        gambar();
        T.toast('Tantangan dibuat. Gas hari pertama! 💪');
      }, true)));
      return;
    }

    const barLuar = T.el('<div style="background:#27272a;border-radius:8px;height:12px;overflow:hidden;margin:10px 0 6px"></div>');
    const barDalam = T.el('<div style="background:#22c55e;height:100%;width:0%;transition:width .3s"></div>');
    const barTeks = T.el('<p class="hint" style="margin:0 0 10px"></p>');
    barLuar.appendChild(barDalam);
    const segarkan = () => {
      const n = st.done.filter(Boolean).length;
      const persen = Math.round((n / 30) * 100);
      barDalam.style.width = persen + '%';
      barTeks.textContent = n + '/30 hari selesai (' + persen + '%)' + (n === 30 ? ' — TAMAT! Kamu keren. 🏆' : '');
    };

    area.appendChild(T.el('<p style="font-size:15px;margin:0"><b>' + T.esc(TEMA[tema].label) + '</b> <span class="dim">— 30 hari</span></p>'));
    area.appendChild(barLuar);
    area.appendChild(barTeks);

    const daftar = T.el('<div></div>');
    st.list.forEach((c, i) => {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!st.done[i];
      cb.style.cssText = 'width:18px;height:18px;accent-color:#22c55e;flex-shrink:0';
      cb.addEventListener('change', () => {
        st.done[i] = cb.checked;
        saveAll(loadAllMerge(tema, st));
        segarkan();
        lbl.style.textDecoration = cb.checked ? 'line-through' : 'none';
        lbl.style.opacity = cb.checked ? '0.55' : '1';
      });
      const lbl = T.el('<span style="font-size:13.5px;line-height:1.5"></span>');
      lbl.textContent = c;
      if (cb.checked) { lbl.style.textDecoration = 'line-through'; lbl.style.opacity = '0.55'; }
      const baris = T.el('<label style="display:flex;gap:10px;align-items:flex-start;padding:9px 4px;border-bottom:1px solid #ffffff14;cursor:pointer"></label>');
      baris.appendChild(T.el('<span class="dim" style="font-size:12px;min-width:52px;padding-top:2px">Hari ' + (i + 1) + '</span>'));
      baris.appendChild(cb);
      baris.appendChild(lbl);
      daftar.appendChild(baris);
    });
    area.appendChild(daftar);
    area.appendChild(T.el('<div style="margin-top:12px"></div>'));
    area.appendChild(T.row(
      T.btn('Acak ulang tantangan', () => {
        const d = loadAll();
        d[tema] = { list: acak(TEMA[tema].bank).slice(0, 30), done: new Array(30).fill(false) };
        saveAll(d);
        gambar();
        T.toast('Tantangan diacak ulang. Progres direset ya.');
      }),
      T.btn('Hapus progres tema ini', () => {
        const d = loadAll();
        delete d[tema];
        saveAll(d);
        gambar();
      })
    ));
    segarkan();
  };

  const loadAllMerge = (t, st) => {
    const d = loadAll();
    d[t] = st;
    return d;
  };

  temaSel.addEventListener('change', () => { tema = temaSel.value; gambar(); });
  root.appendChild(T.el('<p class="hint">Pilih tema, generate 30 tantangan harian, terus centang satu-satu tiap hari. Progres kesimpan otomatis per tema.</p>'));
  root.appendChild(T.field('Tema tantangan', temaSel));
  root.appendChild(area);
  gambar();
}
