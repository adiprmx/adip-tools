import { h as T, errBox } from '../../core.js?v=6.13.0';

export const meta = {"id":"simulator-serp","name":"Simulator Hasil Pencarian Google","cat":"developer","icon":"🔍","desc":"Lihat tampilan judul dan deskripsi halamanmu di hasil pencarian Google (desktop & HP), lengkap dengan cek panjang yang pas.","keywords":"serp,google,seo,judul,deskripsi,meta,title,snippet,pratinjau pencarian","since":"6.13.0"};

/* Google memotong judul & deskripsi berdasarkan LEBAR PIXEL, bukan jumlah huruf.
   Acuan umum: judul desktop ~600px (font Arial 20px), HP ~360px; deskripsi
   desktop ~2 baris. Pengukuran memakai canvas agar potongannya mirip aslinya. */
const JUDUL_PX_DESKTOP = 600;
const JUDUL_PX_MOBILE = 350;
const DESK_PX_DESKTOP = 600;
const DESK_PX_MOBILE = 350;

let _ctx = null;
function lebarTeks(teks, font) {
  if (typeof document === 'undefined') return teks.length * 9;
  if (!_ctx) {
    const c = document.createElement('canvas');
    _ctx = c.getContext('2d');
  }
  if (!_ctx) return teks.length * 9;
  _ctx.font = font;
  return _ctx.measureText(teks).width;
}

/* Potong teks supaya muat dalam lebar pixel, tambah "…" bila terpotong. */
export function potongPixel(teks, maksPx, font) {
  const t = String(teks || '');
  if (lebarTeks(t, font) <= maksPx) return { tampil: t, terpotong: false };
  let rendah = 0, tinggi = t.length, pas = 0;
  while (rendah <= tinggi) {
    const tengah = Math.floor((rendah + tinggi) / 2);
    if (lebarTeks(t.slice(0, tengah) + '…', font) <= maksPx) { pas = tengah; rendah = tengah + 1; }
    else tinggi = tengah - 1;
  }
  return { tampil: t.slice(0, Math.max(0, pas)).trimEnd() + '…', terpotong: true };
}

/* Vonis panjang judul: 50-60 karakter patokan umum (judul lebih dari itu
   biasanya terpotong di Google). */
export function nilaiJudul(judul) {
  const n = String(judul || '').trim().length;
  if (n === 0) return { nilai: 'kosong', pesan: 'Judul masih kosong.' };
  if (n < 30) return { nilai: 'pendek', pesan: n + ' karakter — agak pendek, judul 50–60 karakter memberi ruang lebih untuk kata kunci.' };
  if (n <= 60) return { nilai: 'pas', pesan: n + ' karakter — panjangnya pas, kecil kemungkinan terpotong.' };
  return { nilai: 'panjang', pesan: n + ' karakter — kemungkinan terpotong di hasil pencarian, coba persingkat jadi 50–60 karakter.' };
}

/* Vonis panjang deskripsi: 150–160 karakter patokan umum. */
export function nilaiDeskripsi(desk) {
  const n = String(desk || '').trim().length;
  if (n === 0) return { nilai: 'kosong', pesan: 'Deskripsi masih kosong — Google akan mengambil sendiri teks dari halamanmu.' };
  if (n < 120) return { nilai: 'pendek', pesan: n + ' karakter — agak pendek, deskripsi 150–160 karakter memanfaatkan ruang dengan baik.' };
  if (n <= 160) return { nilai: 'pas', pesan: n + ' karakter — panjangnya pas.' };
  return { nilai: 'panjang', pesan: n + ' karakter — kemungkinan terpotong, coba persingkat jadi 150–160 karakter.' };
}

const WARNA_VONIS = { pas: '#4ade80', pendek: '#facc15', panjang: '#f87171', kosong: '#a1a1aa' };

export function render(root) {
  const judulInp = T.input('text', 'Judul halaman, mis. Jual Kopi Arabika Gayo — Toko Kopi Adip', 'Jual Kopi Arabika Gayo — Toko Kopi Adip');
  const urlInp = T.input('text', 'Alamat halaman, mis. https://tokoku.com/kopi-gayo', 'https://tokoku.com/kopi-arabika-gayo');
  const deskInp = T.ta(3, 'Deskripsi halaman 1–2 kalimat yang mengajak orang mengeklik', 'Kopi arabika Gayo asli dari petani dataran tinggi Aceh. Sangrai segar setiap minggu, dikirim ke seluruh Indonesia. Pesan hari ini, gratis ongkir untuk pembelian pertama.');
  const namaSitusInp = T.input('text', 'Nama situs (boleh kosong, diambil dari alamat)', '');
  const previewBox = T.out();
  const cekBox = T.out();
  const mode = { nilai: 'desktop' };

  const bDesktop = T.btn('💻 Desktop', () => { mode.nilai = 'desktop'; perbarui(); }, true);
  const bMobile = T.btn('📱 HP', () => { mode.nilai = 'mobile'; perbarui(); });

  const domainDariUrl = (u) => {
    try { return new URL(u.trim()).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  };

  const breadcrumbDariUrl = (u) => {
    try {
      const url = new URL(u.trim());
      const segmen = url.pathname.split('/').filter(Boolean).slice(0, 3);
      return url.hostname.replace(/^www\./, '') + (segmen.length ? ' › ' + segmen.map((s) => decodeURIComponent(s).replace(/[-_]/g, ' ')).join(' › ') : '');
    } catch (e) { return u.trim(); }
  };

  function hasilHtml() {
    const judul = judulInp.value.trim();
    const desk = deskInp.value.trim();
    const url = urlInp.value.trim();
    const mobile = mode.nilai === 'mobile';
    const maksJudul = mobile ? JUDUL_PX_MOBILE : JUDUL_PX_DESKTOP;
    const maksDesk = mobile ? DESK_PX_MOBILE : DESK_PX_DESKTOP;
    const judulPotong = potongPixel(judul || '(judul halaman)', maksJudul, '20px Arial, sans-serif');
    // Deskripsi: potong per baris kasar — Google menampilkan ~2 baris desktop.
    let deskTampil = desk || '(deskripsi halaman)';
    const perBaris = Math.floor(maksDesk / 7.2); // perkiraan karakter per baris
    const maksKarakter = perBaris * 2;
    let deskTerpotong = false;
    if (deskTampil.length > maksKarakter) {
      deskTampil = deskTampil.slice(0, maksKarakter).trimEnd() + '…';
      deskTerpotong = true;
    }
    const domain = domainDariUrl(url);
    const namaSitus = namaSitusInp.value.trim() || domain || 'Nama situs';
    const huruf = (namaSitus.charAt(0) || '?').toUpperCase();
    const lebar = mobile ? '360px' : '640px';

    return (
      '<div style="max-width:' + lebar + ';margin:0 auto;background:#fff;border-radius:12px;padding:' + (mobile ? '14px' : '20px') + ';font-family:Arial,Helvetica,sans-serif">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="width:28px;height:28px;border-radius:50%;background:#f1f3f4;color:#5f6368;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex:none">' + T.esc(huruf) + '</span>' +
      '<div style="min-width:0"><div style="font-size:14px;color:#202124;line-height:1.3">' + T.esc(namaSitus) + '</div>' +
      '<div style="font-size:12px;color:#5f6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(breadcrumbDariUrl(url)) + '</div></div></div>' +
      '<div style="margin-top:6px"><a href="#" onclick="return false" style="font-size:' + (mobile ? '18px' : '20px') + ';line-height:1.3;color:#1a0dab;text-decoration:none">' + T.esc(judulPotong.tampil) + '</a></div>' +
      '<div style="font-size:14px;line-height:1.58;color:#4d5156;margin-top:2px">' + T.esc(deskTampil) + '</div>' +
      '</div>' +
      '<p class="hint" style="text-align:center">' + (judulPotong.terpotong ? '⚠️ Judul terpotong di tampilan ' + mode.nilai + '. ' : '') + (deskTerpotong ? '⚠️ Deskripsi terpotong di tampilan ' + mode.nilai + '.' : '') + '</p>'
    );
  }

  function perbarui() {
    bDesktop.classList.toggle('primary', mode.nilai === 'desktop');
    bMobile.classList.toggle('primary', mode.nilai === 'mobile');
    const url = urlInp.value.trim();
    const urlOk = url === '' || domainDariUrl(url) !== '';
    if (!urlOk) {
      T.show(cekBox, errBox('Alamat halaman tidak bisa dibaca. Tulis alamat lengkap, diawali https://'));
    } else {
      const j = nilaiJudul(judulInp.value);
      const d = nilaiDeskripsi(deskInp.value);
      T.show(cekBox,
        '<div class="kv"><span class="k">Judul (' + judulInp.value.trim().length + ' karakter)</span><span class="v" style="color:' + WARNA_VONIS[j.nilai] + '">' + T.esc(j.pesan) + '</span></div>' +
        '<div class="kv"><span class="k">Deskripsi (' + deskInp.value.trim().length + ' karakter)</span><span class="v" style="color:' + WARNA_VONIS[d.nilai] + '">' + T.esc(d.pesan) + '</span></div>' +
        '<p class="hint">Patokan umum: judul 50–60 karakter, deskripsi 150–160 karakter. Google memotong berdasarkan lebar layar, jadi angka ini panduan, bukan aturan mutlak.</p>');
    }
    T.show(previewBox, hasilHtml());
  }

  const salinMeta = T.copyBtn(() => {
    const judul = judulInp.value.trim();
    const desk = deskInp.value.trim();
    if (!judul && !desk) return null;
    /* Judul & deskripsi WAJIB di-escape: snippet ini ditempel ke situs user.
       Tanpa escape, judul berisi </title><script> akan mengeksekusi script
       di halaman tempat snippet ditempel. T.esc meng-escape & < > " '. */
    return '<title>' + T.esc(judul) + '</title>\n<meta name="description" content="' + T.esc(desk) + '">';
  }, '📋 Salin tag judul & deskripsi');

  [judulInp, urlInp, namaSitusInp].forEach((el) => el.addEventListener('input', perbarui));
  deskInp.addEventListener('input', perbarui);

  root.appendChild(T.el('<p class="note">Ketik judul dan deskripsi halamanmu, lalu lihat tampilannya seperti di hasil pencarian Google — sebelum halaman diterbitkan.</p>'));
  root.appendChild(T.field('Judul halaman', judulInp, 'Ini yang tampil sebagai tautan biru di hasil pencarian'));
  root.appendChild(T.field('Alamat halaman (URL)', urlInp));
  root.appendChild(T.field('Nama situs (boleh kosong)', namaSitusInp, 'Kosongkan untuk memakai nama domain dari alamat'));
  root.appendChild(T.field('Deskripsi halaman', deskInp, 'Satu atau dua kalimat yang mengajak orang mengeklik'));
  root.appendChild(T.row(bDesktop, bMobile));
  root.appendChild(T.el('<p class="dim" style="margin-top:12px">Pratinjau hasil pencarian</p>'));
  root.appendChild(previewBox);
  root.appendChild(cekBox);
  root.appendChild(T.row(salinMeta));
  perbarui();
}
