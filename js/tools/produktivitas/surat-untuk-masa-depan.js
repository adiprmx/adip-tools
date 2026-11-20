import { h as T, utils, LOCAL_NOTE } from '../../core.js';

// Surat untuk Masa Depan: tulis surat untuk diri sendiri, lalu tentukan
// tanggal membukanya. Surat tersimpan di browser ini saja dan baru bisa
// dibaca saat tanggalnya tiba. Ini pengingat, bukan brankas terenkripsi:
// siapa pun yang memegang HP ini tetap bisa menemukan suratnya.
export const meta = {"id": "surat-untuk-masa-depan", "name": "Surat untuk Masa Depan", "cat": "produktivitas", "icon": "💌", "desc": "Tulis surat untuk diri sendiri, dibuka lagi pada tanggal yang dipilih.", "keywords": "surat masa depan,futureme,surat diri sendiri,kapsul waktu", "since": "6.19.0"};

const LS_KUNCI = 'adipTools_surat-masa-depan';

// Sisa waktu sampai tanggal buka. sekarangMs bisa diisi untuk tes.
// Murni, bisa diuji di Node.
export function hitungSisa(tanggalBukaISO, sekarangMs) {
  const target = new Date(tanggalBukaISO + 'T00:00:00');
  const kini = new Date(sekarangMs == null ? Date.now() : sekarangMs);
  const selisih = target.getTime() - kini.getTime();
  if (isNaN(target.getTime())) return { sah: false, lewat: false, hari: 0, jam: 0, menit: 0 };
  if (selisih <= 0) return { sah: true, lewat: true, hari: 0, jam: 0, menit: 0 };
  const hari = Math.floor(selisih / 86400000);
  const jam = Math.floor((selisih % 86400000) / 3600000);
  const menit = Math.floor((selisih % 3600000) / 60000);
  return { sah: true, lewat: false, hari, jam, menit };
}

// Kalimat sisa waktu yang gampang dibaca. Murni, bisa diuji di Node.
export function kalimatSisa(sisa) {
  if (!sisa.sah) return 'Tanggal tidak valid.';
  if (sisa.lewat) return 'Sudah bisa dibuka.';
  if (sisa.hari > 0) return 'Dibuka lagi dalam ' + sisa.hari + ' hari' + (sisa.jam ? ' ' + sisa.jam + ' jam' : '') + '.';
  if (sisa.jam > 0) return 'Dibuka lagi dalam ' + sisa.jam + ' jam ' + sisa.menit + ' menit.';
  return 'Dibuka lagi dalam ' + sisa.menit + ' menit.';
}

// Validasi isi surat. Mengembalikan pesan salah, atau '' bila boleh
// disimpan. Murni, bisa diuji di Node.
export function validasiSurat(data) {
  const d = data || {};
  if (!String(d.isi || '').trim()) return 'Tulis dulu isi suratmu.';
  if (!String(d.tanggal || '').trim()) return 'Pilih tanggal membukanya.';
  const sisa = hitungSisa(d.tanggal, d.sekarangMs);
  if (!sisa.sah) return 'Tanggalnya tidak valid.';
  if (sisa.lewat) return 'Tanggal buka harus di masa depan.';
  return '';
}

// Format tanggal ISO jadi "4 Maret 2027". Murni, bisa diuji di Node.
export function fmtTanggalPanjang(iso) {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return parseInt(m[3], 10) + ' ' + bulan[parseInt(m[2], 10) - 1] + ' ' + m[1];
}

function muatDaftar() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KUNCI) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}

function simpanDaftar(daftar) {
  try { localStorage.setItem(LS_KUNCI, JSON.stringify(daftar)); return true; }
  catch (e) { return false; }
}

export function render(root) {
  const judulI = T.input('text', 'Judul surat (boleh kosong)');
  const isiI = T.ta(8, 'Tulis surat untuk dirimu di masa depan…');
  const tanggalI = T.input('date', '');
  const daftarBox = T.out();
  const statusBox = T.out();

  function catatDaftar() {
    const daftar = muatDaftar().slice().sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
    if (!daftar.length) {
      T.show(daftarBox, '<p class="dim">Belum ada surat. Surat pertamamu akan muncul di sini setelah disimpan.</p>');
      return;
    }
    T.show(daftarBox, '');
    daftar.forEach((s) => {
      const sisa = hitungSisa(s.tanggal);
      const kartu = T.el('<div class="card" style="margin-bottom:12px"></div>');
      const judul = T.esc(s.judul || 'Surat tanpa judul');
      kartu.appendChild(T.el('<div style="font-weight:700">' + judul + '</div>'));
      kartu.appendChild(T.el('<div class="dim" style="font-size:12px;margin:4px 0 8px">Dibuka ' + T.esc(fmtTanggalPanjang(s.tanggal)) + ' · ' + T.esc(kalimatSisa(sisa)) + '</div>'));
      if (sisa.lewat) {
        kartu.appendChild(T.el('<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.6;margin:0 0 8px">' + T.esc(s.isi) + '</pre>'));
        const baris = T.el('<div class="row"></div>');
        baris.appendChild(T.btn('Unduh .txt', () => {
          T.dl((s.judul || 'surat').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.txt', s.isi, 'text/plain;charset=utf-8');
          T.toast('Berhasil diunduh');
        }));
        baris.appendChild(T.btn('Hapus', () => {
          if (confirm('Hapus surat ini? Surat yang sudah dihapus tidak bisa kembali.')) {
            if (simpanDaftar(muatDaftar().filter((x) => x.id !== s.id))) {
              catatDaftar();
              T.toast('Surat dihapus');
            } else {
              T.toast('Surat tidak bisa dihapus, coba lagi');
            }
          }
        }));
        kartu.appendChild(baris);
      } else {
        kartu.appendChild(T.el('<div style="font-size:28px">🔒</div>'));
        kartu.appendChild(T.el('<p class="dim" style="font-size:13px;margin:4px 0 8px">Surat ini masih tersegel sampai tanggalnya tiba.</p>'));
        const baris = T.el('<div class="row"></div>');
        baris.appendChild(T.btn('Hapus', () => {
          if (confirm('Hapus surat ini? Surat yang sudah dihapus tidak bisa kembali.')) {
            if (simpanDaftar(muatDaftar().filter((x) => x.id !== s.id))) {
              catatDaftar();
              T.toast('Surat dihapus');
            } else {
              T.toast('Surat tidak bisa dihapus, coba lagi');
            }
          }
        }));
        kartu.appendChild(baris);
      }
      daftarBox.appendChild(kartu);
    });
  }

  function simpan() {
    const salah = validasiSurat({ isi: isiI.value, tanggal: tanggalI.value });
    if (salah) { T.toast(salah); return; }
    const daftar = muatDaftar();
    daftar.push({
      id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      judul: judulI.value.trim(),
      isi: isiI.value,
      tanggal: tanggalI.value,
      dibuat: Date.now(),
    });
    // Hanya tampilkan "tersimpan" bila benar-benar tersimpan. Bila gagal
    // (misal penyimpanan browser penuh), beri tahu dengan jujur dan JANGAN
    // kosongkan form — suratnya belum tersimpan ke mana-mana.
    if (!simpanDaftar(daftar)) {
      T.show(statusBox, '<p class="err">Surat tidak bisa disimpan karena penyimpanan browser penuh. Hapus dulu surat lama atau data lain, lalu coba simpan lagi.</p>');
      return;
    }
    judulI.value = '';
    isiI.value = '';
    tanggalI.value = '';
    T.show(statusBox, '<p class="note">Surat tersimpan. Surat itu akan terbuka pada ' + T.esc(fmtTanggalPanjang(daftar[daftar.length - 1].tanggal)) + '.</p>');
    catatDaftar();
  }

  const simpanB = T.btn('Simpan Surat', simpan, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Surat disimpan di browser ini saja, bukan di server. Bila data browser dihapus, surat ikut hilang. Ini pengingat untuk dirimu sendiri, bukan tempat menyimpan rahasia.</p>'));
  root.appendChild(T.field('Judul surat', judulI));
  root.appendChild(T.field('Isi surat', isiI));
  root.appendChild(T.field('Tanggal membuka', tanggalI, 'Surat baru bisa dibaca saat tanggal ini tiba.'));
  root.appendChild(simpanB);
  root.appendChild(statusBox);
  root.appendChild(T.el('<div style="font-weight:700;margin:16px 0 8px">Surat-suratmu</div>'));
  root.appendChild(daftarBox);
  catatDaftar();
}
