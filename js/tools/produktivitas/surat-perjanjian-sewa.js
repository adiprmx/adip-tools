import { h as T } from '../../core.js';

export const meta = {"id": "surat-perjanjian-sewa", "name": "Pembuat Surat Perjanjian Sewa", "cat": "produktivitas", "icon": "🏠", "desc": "Bikin surat perjanjian sewa rumah, kos, atau ruko: pihak pemilik & penyewa, harga, deposit, aturan, dan tanda tangan, siap cetak atau salin.", "keywords": "surat sewa,perjanjian sewa,kontrak sewa,rumah,kos,ruko,deposit,penyewa,pemilik", "since": "6.13.0"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
let _printCss = null;

function ensurePrintCss() {
  if (_printCss) return;
  const st = document.createElement('style');
  st.textContent =
    '@page{size:A4;margin:18mm 20mm}' +
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#surat-sewa-print,#surat-sewa-print *{visibility:visible !important}' +
    '#surat-sewa-print{position:absolute;inset:0;background:#fff;color:#000;padding:0}' +
    '#surat-sewa-print .surat-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' +
    '}';
  document.head.appendChild(st);
  _printCss = st;
}

function hapusPrintCss() {
  if (_printCss) { _printCss.remove(); _printCss = null; }
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function isoHariIni() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtTanggal(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  if (p.length !== 3) return String(iso);
  const tgl = Number(p[2]), bln = Number(p[1]), thn = Number(p[0]);
  if (!tgl || !bln || !thn || bln < 1 || bln > 12) return String(iso);
  return tgl + ' ' + BULAN[bln - 1] + ' ' + thn;
}

function tambahBulan(iso, n) {
  if (!iso || !n) return '';
  const p = String(iso).split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1 + Number(n), Number(p[2]));
  if (isNaN(d.getTime())) return ''; // tanggal di luar jangkauan -> kosong, bukan "NaN"
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Batas wajar angka input: di atas ini hampir pasti salah ketik / tempel
   angka raksasa. Angka di luar batas DIPOTONG (bukan ditolak) supaya
   pratinjau tetap jalan, dan perbarui() menampilkan pesan ramah. */
const MAKS_RUPIAH = 1000000000000000; // 1.000 triliun
const MAKS_LAMA_BULAN = 600; // 50 tahun
function angkaAman(nilai, maks) {
  const n = T.num(nilai) || 0;
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), maks);
}

/* Terbilang rupiah sederhana (sampai triliun), dipakai di pasal harga & deposit. */
export function terbilang(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  let x = Math.floor(Math.abs(Number(n) || 0));
  /* Guard: Infinity membuat sebut() memanggil sebut(Infinity) selamanya
     (stack overflow). Bukan angka wajar -> kembalikan string kosong. */
  if (!Number.isFinite(x)) return '';
  if (x === 0) return 'nol';
  const sebut = (v) => {
    if (v < 12) return satuan[v];
    if (v < 20) return sebut(v - 10) + ' belas';
    if (v < 100) return sebut(Math.floor(v / 10)) + ' puluh' + (v % 10 ? ' ' + sebut(v % 10) : '');
    if (v < 200) return 'seratus' + (v % 100 ? ' ' + sebut(v % 100) : '');
    if (v < 1000) return sebut(Math.floor(v / 100)) + ' ratus' + (v % 100 ? ' ' + sebut(v % 100) : '');
    if (v < 2000) return 'seribu' + (v % 1000 ? ' ' + sebut(v % 1000) : '');
    if (v < 1000000) return sebut(Math.floor(v / 1000)) + ' ribu' + (v % 1000 ? ' ' + sebut(v % 1000) : '');
    if (v < 1000000000) return sebut(Math.floor(v / 1000000)) + ' juta' + (v % 1000000 ? ' ' + sebut(v % 1000000) : '');
    if (v < 1000000000000) return sebut(Math.floor(v / 1000000000)) + ' miliar' + (v % 1000000000 ? ' ' + sebut(v % 1000000000) : '');
    return sebut(Math.floor(v / 1000000000000)) + ' triliun' + (v % 1000000000000 ? ' ' + sebut(v % 1000000000000) : '');
  };
  return sebut(x).trim();
}

const CARA_BAYAR = {
  bulanan: 'setiap bulan, paling lambat tanggal 5 setiap bulannya',
  triwulan: 'di muka setiap 3 (tiga) bulan',
  semester: 'di muka setiap 6 (enam) bulan',
  tahunan: 'di muka setiap 12 (dua belas) bulan',
};

export function render(root) {
  ensurePrintCss();
  T.onLeave(hapusPrintCss);

  const uang = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };

  // Pihak pemilik
  const namaPemilik = T.input('text', 'Nama lengkap pemilik', '');
  const ktpPemilik = T.input('text', 'Nomor KTP pemilik', '');
  const alamatPemilik = T.input('text', 'Alamat pemilik sesuai KTP', '');
  const hpPemilik = T.input('text', 'Nomor HP pemilik (boleh kosong)', '');
  // Pihak penyewa
  const namaPenyewa = T.input('text', 'Nama lengkap penyewa', '');
  const ktpPenyewa = T.input('text', 'Nomor KTP penyewa', '');
  const alamatPenyewa = T.input('text', 'Alamat penyewa sesuai KTP', '');
  const hpPenyewa = T.input('text', 'Nomor HP penyewa (boleh kosong)', '');
  // Objek sewa
  const jenisObjek = T.select([['rumah', 'Rumah'], ['kos', 'Kamar kos'], ['ruko', 'Ruko'], ['apartemen', 'Apartemen'], ['kios', 'Kios / toko'], ['lainnya', 'Lainnya']], 'rumah');
  const alamatObjek = T.input('text', 'Alamat lengkap yang disewakan', '');
  const luasObjek = T.input('text', 'Mis. 72 m² (boleh kosong)', '');
  const fasilitas = T.ta(2, 'Fasilitas yang ikut disewakan, mis. 2 kamar tidur, dapur, garasi (boleh kosong)', '');
  // Waktu & harga
  const tglMulai = T.input('date', '', isoHariIni());
  const lamaSewa = uang('Mis. 12', '12');
  const hargaSewa = uang('Harga sewa per bulan (Rp)', '');
  const caraBayar = T.select([['bulanan', 'Dibayar tiap bulan'], ['triwulan', 'Dibayar di muka per 3 bulan'], ['semester', 'Dibayar di muka per 6 bulan'], ['tahunan', 'Dibayar di muka per tahun']], 'bulanan');
  const deposit = uang('Uang deposit / jaminan (Rp, boleh 0)', '0');
  const denda = uang('Denda telat bayar per hari (Rp, boleh 0)', '0');
  // Aturan
  const aturanTambahan = T.ta(2, 'Aturan tambahan, mis. jam malam, hewan peliharaan (boleh kosong)', '');
  // Penutup
  const tempatTtd = T.input('text', 'Tempat tanda tangan, mis. Jakarta', '');
  const tglSurat = T.input('date', '', isoHariIni());
  const saksi1 = T.input('text', 'Nama saksi 1 (boleh kosong)', '');
  const saksi2 = T.input('text', 'Nama saksi 2 (boleh kosong)', '');

  const aturanCek = [
    ['pindah', 'Penyewa dilarang memindahtangankan atau menyewakan lagi ke pihak lain tanpa izin tertulis pemilik.', true],
    ['ubah', 'Penyewa dilarang mengubah bentuk bangunan tanpa izin tertulis pemilik.', true],
    ['rawat', 'Penyewa wajib menjaga kebersihan dan merawat objek sewa dengan baik.', true],
    ['masuk', 'Pemilik boleh masuk untuk memeriksa kondisi, dengan memberi tahu penyewa minimal 1 hari sebelumnya.', true],
    ['deposit', 'Deposit dikembalikan penuh saat sewa berakhir bila tidak ada kerusakan atau tunggakan.', true],
  ].map(([id, label, cek]) => {
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'sewa-aturan-' + id; cb.checked = cek;
    cb.style.cssText = 'width:18px;height:18px;accent-color:#ff6f61;flex:none;margin-top:2px';
    const lab = document.createElement('label');
    lab.setAttribute('for', cb.id);
    lab.style.cssText = 'display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.5;cursor:pointer';
    const sp = document.createElement('span'); sp.textContent = label;
    lab.appendChild(cb); lab.appendChild(sp);
    return { cb, lab, label };
  });

  const previewBox = T.out();
  const peringatanBox = T.out();

  const esc = (s) => T.esc(String(s == null ? '' : s));
  const v = (el) => el.value.trim();
  const jenisLabel = () => jenisObjek.options[jenisObjek.selectedIndex].textContent;

  function suratHtml() {
    const pemilik = v(namaPemilik) || '(nama pemilik)';
    const penyewa = v(namaPenyewa) || '(nama penyewa)';
    const lama = angkaAman(lamaSewa.value, MAKS_LAMA_BULAN);
    const tglAkhir = tambahBulan(v(tglMulai), lama);
    const harga = angkaAman(hargaSewa.value, MAKS_RUPIAH);
    const dep = angkaAman(deposit.value, MAKS_RUPIAH);
    const den = angkaAman(denda.value, MAKS_RUPIAH);
    const totalSewa = harga * lama;
    const tglTtd = (v(tempatTtd) ? v(tempatTtd) + ', ' : '') + (fmtTanggal(v(tglSurat)) || fmtTanggal(isoHariIni()));

    const barisPihak = (nama, ktp, alamat, hp) =>
      '<div style="margin:8px 0 8px 16px">Nama: <b>' + esc(nama) + '</b>' +
      (ktp ? '<br/>Nomor KTP: ' + esc(ktp) : '') +
      (alamat ? '<br/>Alamat: ' + esc(alamat) : '') +
      (hp ? '<br/>Nomor HP: ' + esc(hp) : '') + '</div>';

    const aturanDipilih = aturanCek.filter((a) => a.cb.checked).map((a) => a.label);
    const aturanTambah = v(aturanTambahan);
    const pasalAturan = aturanDipilih.concat(aturanTambah ? [aturanTambah] : []);

    const p = (isi) => '<p style="text-align:justify;margin:8px 0">' + isi + '</p>';
    const pasal = (no, judul, isi) => '<div style="margin-top:14px"><b>Pasal ' + no + '<br/>' + judul + '</b>' + isi + '</div>';

    return (
      '<div style="font-size:14px;line-height:1.7">' +
      '<div style="text-align:center"><b style="font-size:16px">SURAT PERJANJIAN SEWA</b><br/>' + esc(jenisLabel()) + '</div>' +
      p('Pada hari ini, ' + esc(tglTtd) + ', kami yang bertanda tangan di bawah ini:') +
      '<div><b>I. PIHAK PERTAMA (Pemilik)</b>' + barisPihak(pemilik, v(ktpPemilik), v(alamatPemilik), v(hpPemilik)) +
      'yang selanjutnya disebut <b>PIHAK PERTAMA</b>.</div>' +
      '<div><b>II. PIHAK KEDUA (Penyewa)</b>' + barisPihak(penyewa, v(ktpPenyewa), v(alamatPenyewa), v(hpPenyewa)) +
      'yang selanjutnya disebut <b>PIHAK KEDUA</b>.</div>' +
      p('PIHAK PERTAMA dan PIHAK KEDUA sepakat mengadakan perjanjian sewa-menyewa dengan ketentuan sebagai berikut:') +
      pasal(1, 'Objek Sewa',
        p('PIHAK PERTAMA menyewakan kepada PIHAK KEDUA berupa ' + esc(jenisLabel().toLowerCase()) +
          ' yang beralamat di <b>' + esc(v(alamatObjek) || '(alamat objek sewa)') + '</b>' +
          (v(luasObjek) ? ' dengan luas ' + esc(v(luasObjek)) : '') + '.' +
          (v(fasilitas) ? '<br/>Fasilitas yang ikut disewakan: ' + esc(v(fasilitas)) + '.' : ''))) +
      pasal(2, 'Jangka Waktu Sewa',
        p('Perjanjian ini berlaku selama <b>' + (lama ? lama + ' bulan' : '(lama sewa)') + '</b>, terhitung sejak ' +
          '<b>' + esc(fmtTanggal(v(tglMulai)) || '(tanggal mulai)') + '</b> sampai dengan ' +
          '<b>' + esc(fmtTanggal(tglAkhir) || '(tanggal selesai)') + '</b>.' +
          ' Perpanjangan sewa disepakati kedua belah pihak paling lambat 1 (satu) bulan sebelum masa sewa berakhir.')) +
      pasal(3, 'Harga Sewa dan Cara Pembayaran',
        p('Harga sewa sebesar <b>' + T.rp(harga) + ' (' + terbilang(harga) + ' rupiah) per bulan</b>, ' +
          'dibayar ' + CARA_BAYAR[caraBayar.value] + '.' +
          (lama && harga ? ' Total sewa selama masa perjanjian ini sebesar <b>' + T.rp(totalSewa) + '</b>.' : '') +
          (den ? ' Keterlambatan pembayaran dikenakan denda sebesar ' + T.rp(den) + ' per hari.' : ''))) +
      pasal(4, 'Deposit',
        p(dep
          ? 'PIHAK KEDUA menyerahkan deposit sebesar <b>' + T.rp(dep) + ' (' + terbilang(dep) + ' rupiah)</b> sebagai jaminan. Deposit dikembalikan setelah masa sewa berakhir, setelah dikurangi biaya perbaikan kerusakan (bila ada) dan tunggakan (bila ada).'
          : 'Perjanjian ini tidak memakai deposit.')) +
      pasal(5, 'Hak dan Kewajiban',
        pasalAturan.length
          ? '<ol style="margin:8px 0;padding-left:22px;text-align:justify">' + pasalAturan.map((a) => '<li style="margin:4px 0">' + esc(a) + '</li>').join('') + '</ol>'
          : p('Tidak ada aturan khusus yang dicentang.')) +
      pasal(6, 'Berakhirnya Perjanjian',
        p('Perjanjian berakhir bila masa sewa habis dan tidak diperpanjang, atau bila salah satu pihak melanggar isi perjanjian ini setelah diberi peringatan tertulis. ' +
          'Bila PIHAK KEDUA mengakhiri sewa sebelum waktunya, sisa sewa yang sudah dibayar tidak dikembalikan, kecuali disepakati lain secara tertulis.')) +
      pasal(7, 'Penutup',
        p('Perjanjian ini dibuat dalam 2 (dua) rangkap yang sama bunyinya dan mempunyai kekuatan yang sama, masing-masing dipegang oleh PIHAK PERTAMA dan PIHAK KEDUA. ' +
          'Hal-hal yang belum diatur dalam perjanjian ini akan diselesaikan secara musyawarah oleh kedua belah pihak.')) +
      '<div style="margin-top:28px;text-align:right">' + esc(tglTtd) + '</div>' +
      '<div style="display:flex;gap:24px;margin-top:12px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:180px;text-align:center">PIHAK PERTAMA,<br/><br/><br/><br/>( <b>' + esc(pemilik) + '</b> )</div>' +
      '<div style="flex:1;min-width:180px;text-align:center">PIHAK KEDUA,<br/><br/><br/><br/>( <b>' + esc(penyewa) + '</b> )</div></div>' +
      ((v(saksi1) || v(saksi2)) ?
        '<div style="margin-top:28px"><b>Saksi-saksi:</b><br/><br/>' +
        '<div style="display:flex;gap:24px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:180px">1. ( ' + esc(v(saksi1) || '....................') + ' )</div>' +
        '<div style="flex:1;min-width:180px">2. ( ' + esc(v(saksi2) || '....................') + ' )</div></div></div>' : '') +
      '</div>'
    );
  }

  function suratTeks() {
    const tmp = document.createElement('div');
    tmp.innerHTML = suratHtml();
    return tmp.innerText || tmp.textContent;
  }

  function perbarui() {
    const kurang = [];
    if (!v(namaPemilik)) kurang.push('nama pemilik');
    if (!v(namaPenyewa)) kurang.push('nama penyewa');
    if (!v(alamatObjek)) kurang.push('alamat yang disewakan');
    if (!(T.num(hargaSewa.value) > 0)) kurang.push('harga sewa');
    if (!(T.num(lamaSewa.value) > 0)) kurang.push('lama sewa');

    /* Angka di luar batas wajar: pratinjau memakai nilai yang dipotong
       (angkaAman), dan user diberi tahu dengan bahasa sehari-hari. */
    const diLuarBatas = [];
    const cekBatas = (el, maks, nama) => {
      const n = T.num(el.value) || 0;
      if (!Number.isFinite(n) || n > maks) diLuarBatas.push(nama);
    };
    cekBatas(hargaSewa, MAKS_RUPIAH, 'harga sewa dihitung sampai Rp1.000.000.000.000.000 saja');
    cekBatas(deposit, MAKS_RUPIAH, 'deposit dihitung sampai Rp1.000.000.000.000.000 saja');
    cekBatas(denda, MAKS_RUPIAH, 'denda dihitung sampai Rp1.000.000.000.000.000 saja');
    cekBatas(lamaSewa, MAKS_LAMA_BULAN, 'lama sewa dihitung sampai 600 bulan (50 tahun) saja');

    const pesan = [];
    if (kurang.length) pesan.push('Lengkapi ' + kurang.join(', ') + ' supaya surat siap dipakai.');
    if (diLuarBatas.length) pesan.push('Angka yang kamu tulis terlalu besar, jadi ' + diLuarBatas.join(', ') + '.');
    if (pesan.length) {
      T.show(peringatanBox, '<p style="font-size:13px;color:#a1a1aa">' + esc(pesan.join(' ')) + '</p>');
    } else {
      T.hide(peringatanBox);
    }

    T.show(previewBox,
      '<div id="surat-sewa-print"><div class="surat-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
      suratHtml() +
      '</div></div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
      '<button class="btn" data-act="copy">📋 Salin surat</button></div>' +
      '<p class="hint">Surat ini perjanjian di bawah tangan antara dua pihak. Untuk kekuatan hukum yang lebih kuat, kedua pihak bisa membawa surat ini ke notaris. Baca lagi seluruh isi sebelum ditandatangani.</p>');
    previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
    previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(suratTeks()));
  }

  const semuaInput = [namaPemilik, ktpPemilik, alamatPemilik, hpPemilik, namaPenyewa, ktpPenyewa, alamatPenyewa, hpPenyewa,
    alamatObjek, luasObjek, fasilitas, lamaSewa, hargaSewa, deposit, denda, aturanTambahan, tempatTtd, saksi1, saksi2];
  semuaInput.forEach((el) => el.addEventListener('input', perbarui));
  [jenisObjek, caraBayar].forEach((el) => el.addEventListener('change', perbarui));
  [tglMulai, tglSurat].forEach((el) => el.addEventListener('change', perbarui));
  aturanCek.forEach((a) => a.cb.addEventListener('change', perbarui));

  const judul = (t) => T.el('<h3 class="h3" style="margin-top:20px">' + t + '</h3>');

  root.appendChild(T.el('<p class="note">Isi form di bawah, surat perjanjian sewa langsung jadi dan bisa dicetak atau disalin.</p>'));
  root.appendChild(judul('👤 Pemilik (pihak pertama)'));
  root.appendChild(T.grid2(T.field('Nama lengkap pemilik', namaPemilik), T.field('Nomor KTP pemilik', ktpPemilik)));
  root.appendChild(T.grid2(T.field('Alamat pemilik', alamatPemilik), T.field('Nomor HP pemilik (boleh kosong)', hpPemilik)));
  root.appendChild(judul('🧑 Penyewa (pihak kedua)'));
  root.appendChild(T.grid2(T.field('Nama lengkap penyewa', namaPenyewa), T.field('Nomor KTP penyewa', ktpPenyewa)));
  root.appendChild(T.grid2(T.field('Alamat penyewa', alamatPenyewa), T.field('Nomor HP penyewa (boleh kosong)', hpPenyewa)));
  root.appendChild(judul('🏠 Yang disewakan'));
  root.appendChild(T.grid2(T.field('Jenis yang disewakan', jenisObjek), T.field('Luas (boleh kosong)', luasObjek)));
  root.appendChild(T.field('Alamat lengkap yang disewakan', alamatObjek));
  root.appendChild(T.field('Fasilitas yang ikut disewakan (boleh kosong)', fasilitas));
  root.appendChild(judul('📅 Waktu, harga & deposit'));
  root.appendChild(T.grid2(T.field('Tanggal mulai sewa', tglMulai), T.field('Lama sewa (bulan)', lamaSewa, 'Tanggal selesai dihitung otomatis')));
  root.appendChild(T.grid2(T.field('Harga sewa per bulan (Rp)', hargaSewa), T.field('Cara pembayaran', caraBayar)));
  root.appendChild(T.grid2(T.field('Deposit / uang jaminan (Rp)', deposit, 'Isi 0 bila tidak pakai deposit'), T.field('Denda telat bayar per hari (Rp)', denda, 'Isi 0 bila tidak ada denda')));
  root.appendChild(judul('📋 Aturan sewa'));
  const aturanBox = T.el('<div style="display:flex;flex-direction:column;gap:10px"></div>');
  aturanCek.forEach((a) => aturanBox.appendChild(a.lab));
  root.appendChild(aturanBox);
  root.appendChild(T.field('Aturan tambahan (boleh kosong)', aturanTambahan));
  root.appendChild(judul('✍️ Tanda tangan'));
  root.appendChild(T.grid2(T.field('Tempat tanda tangan', tempatTtd), T.field('Tanggal surat', tglSurat)));
  root.appendChild(T.grid2(T.field('Nama saksi 1 (boleh kosong)', saksi1), T.field('Nama saksi 2 (boleh kosong)', saksi2)));
  root.appendChild(T.el('<p class="dim" style="margin-top:16px">Hasil surat</p>'));
  root.appendChild(peringatanBox);
  root.appendChild(previewBox);
  perbarui();
}
