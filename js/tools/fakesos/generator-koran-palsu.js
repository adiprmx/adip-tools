import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

// Generator Koran Palsu: halaman depan koran dari headline, foto, dan
// cerita buatanmu. Gayanya kliping koran vintage: kertas krem, judul
// besar, kolom-kolom berita. Seperti tool fakesos lain di sini, hasilnya
// DITANDAI JELAS palsu: ada label "palsu · cuma prank" di hasil dan
// catatan di bawah bahwa ini untuk lucu-lucuan, bukan berita sungguhan
// dan bukan untuk menipu.
export const meta = {"id": "generator-koran-palsu", "name": "Generator Koran Palsu", "cat": "fakesos", "icon": "📰", "desc": "Bikin halaman depan koran dari headline dan fotomu. Untuk lucu-lucuan, bukan berita sungguhan.", "keywords": "koran,palsu,headline,kliping,berita,prank,vintage", "since": "6.17.0"};

// Bagi cerita jadi kolom-kolom (murni, bisa diuji tanpa DOM).
// Return array paragraf per kolom, dibagi rata.
export function bagiKolom(teks, jumlahKolom) {
  const paragraf = String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const k = Math.max(1, Math.min(4, Number(jumlahKolom) || 2));
  if (!paragraf.length) return Array.from({ length: k }, () => []);
  const perKolom = Math.ceil(paragraf.length / k);
  const hasil = [];
  for (let i = 0; i < k; i++) hasil.push(paragraf.slice(i * perKolom, (i + 1) * perKolom));
  return hasil;
}

// Tanggal hari ini dalam bahasa Indonesia (murni, bisa diuji).
export function tanggalHariIni(d) {
  const t = d instanceof Date ? d : new Date();
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][t.getDay()];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][t.getMonth()];
  return `${hari}, ${t.getDate()} ${bulan} ${t.getFullYear()}`;
}

export function render(root) {
  root.appendChild(T.el(`<style>
.gkp-koran{max-width:520px;margin:14px auto;background:#f5efdd;color:#1a1712;font-family:Georgia,'Times New Roman',serif;padding:22px 22px 16px;box-shadow:0 4px 24px rgba(0,0,0,.35)}
.gkp-masthead{text-align:center;border-bottom:3px double #1a1712;padding-bottom:8px;margin-bottom:8px}
.gkp-nama{font-size:44px;font-weight:700;letter-spacing:1px;line-height:1;margin:0}
.gkp-meta{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.5px;text-transform:uppercase;border-bottom:1px solid #1a1712;padding-bottom:6px;margin-bottom:12px}
.gkp-headline{font-size:34px;font-weight:700;line-height:1.1;text-align:center;margin:0 0 6px}
.gkp-sub{font-size:15px;font-style:italic;text-align:center;margin:0 0 12px;color:#3a332a}
.gkp-foto{width:100%;height:auto;display:block;border:1px solid #1a1712;margin-bottom:4px}
.gkp-caption{font-size:11px;font-style:italic;text-align:center;color:#55504a;margin:0 0 12px}
.gkp-kolom{column-gap:16px;font-size:13.5px;line-height:1.55;text-align:justify}
.gkp-kolom p{margin:0 0 8px;text-indent:1.2em}
.gkp-kolom p:first-child{text-indent:0}
.gkp-kolom p:first-child::first-letter{font-size:34px;font-weight:700;line-height:1;float:left;margin:2px 6px 0 0}
.gkp-pranktag-wrap{display:flex;justify-content:center;padding:12px 0 4px}
.gkp-pranktag{font-family:system-ui,sans-serif;font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.gkp-foot{font-family:system-ui,sans-serif;font-size:11px;text-align:center;color:#55504a;line-height:1.5;border-top:1px solid #1a171233;padding-top:8px;margin-top:4px}
</style>`));

  const namaInp = T.input('text', 'Nama koran, contoh: Harian Pagi', 'Harian Pagi');
  const headlineInp = T.input('text', 'Judul berita yang besar', 'Kucing Tetangga Menang Lomba Lari');
  const subInp = T.input('text', 'Anak judul (boleh kosong)', 'Si Oren mengalahkan 12 kucing lain dengan selisih setengah detik');
  const tanggalInp = T.input('text', 'Tanggal di koran', tanggalHariIni());
  const edisiInp = T.input('text', 'Edisi / harga (boleh kosong)', 'Edisi 001 · Gratis');
  const ceritaInp = T.ta(5, 'Isi ceritanya. Satu paragraf per baris.', 'Warga RT 05 geger pagi ini. Si Oren, kucing oranye milik Bu RT, memenangkan lomba lari kucing tahunan yang digelar di lapangan dekat pos ronda.\n"Dia larinya kencang sekali, saya sampai tidak sempat memotret," kata salah satu panitia sambil tertawa.\nHadiahnya sekantong makanan kucing dan piala kecil. Si Oren sendiri tampak tidak peduli dan langsung tidur setelah lomba selesai.');
  const captionInp = T.input('text', 'Keterangan foto (boleh kosong)', 'Si Oren sesaat sebelum garis finis.');
  const kolomSel = T.select([['1', '1 kolom'], ['2', '2 kolom'], ['3', '3 kolom']], '2');
  const fi = fileInput('image/*');

  const preview = T.el('<div class="gkp-koran"></div>');
  let fotoUrl = '';

  function gambar() {
    const nama = (namaInp.value || '').trim() || 'Harian Pagi';
    const headline = (headlineInp.value || '').trim() || 'Judul Berita';
    const sub = (subInp.value || '').trim();
    const tanggal = (tanggalInp.value || '').trim();
    const edisi = (edisiInp.value || '').trim();
    const caption = (captionInp.value || '').trim();
    const kolom = bagiKolom(ceritaInp.value, parseInt(kolomSel.value, 10));
    const isiKolom = kolom.map((par) => par.map((p) => `<p>${T.esc(p)}</p>`).join('')).join('');
    const ceritaHtml = isiKolom || '<p class="dim" style="font-family:system-ui,sans-serif;font-size:13px">Belum ada cerita. Tulis ceritanya di atas.</p>';
    preview.innerHTML =
      '<div class="gkp-masthead"><div class="gkp-nama">' + T.esc(nama) + '</div></div>' +
      '<div class="gkp-meta"><span>' + T.esc(tanggal) + '</span><span>' + T.esc(edisi) + '</span></div>' +
      '<h1 class="gkp-headline">' + T.esc(headline) + '</h1>' +
      (sub ? '<p class="gkp-sub">' + T.esc(sub) + '</p>' : '') +
      (fotoUrl ? '<img class="gkp-foto" src="' + T.esc(fotoUrl) + '" alt="Foto berita">' : '') +
      (fotoUrl && caption ? '<p class="gkp-caption">' + T.esc(caption) + '</p>' : '') +
      '<div class="gkp-kolom" style="column-count:' + kolomSel.value + '">' + ceritaHtml + '</div>' +
      '<div class="gkp-pranktag-wrap"><span class="gkp-pranktag">palsu · cuma prank</span></div>' +
      '<div class="gkp-foot">Halaman ini PALSU — dibuat untuk lucu-lucuan, <b>bukan berita sungguhan</b> dan bukan untuk menipu siapa pun.</div>';
  }

  [namaInp, headlineInp, subInp, tanggalInp, edisiInp, ceritaInp, captionInp].forEach((el) => el.addEventListener('input', gambar));
  kolomSel.addEventListener('change', gambar);

  fi.addEventListener('change', () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    fotoUrl = URL.createObjectURL(f);
    T.onLeave(() => URL.revokeObjectURL(fotoUrl));
    gambar();
  });

  root.appendChild(T.el('<div class="note">🔒 ' + T.esc(LOCAL_NOTE + ' Hanya untuk lucu-lucuan, bukan berita sungguhan.') + '</div>'));
  root.appendChild(T.field('Nama koran', namaInp));
  root.appendChild(T.field('Judul berita', headlineInp));
  root.appendChild(T.field('Anak judul', subInp));
  root.appendChild(T.grid2(
    T.field('Tanggal di koran', tanggalInp),
    T.field('Edisi / harga', edisiInp),
  ));
  root.appendChild(T.field('Foto berita (boleh kosong)', fi));
  root.appendChild(T.field('Keterangan foto', captionInp));
  root.appendChild(T.field('Isi cerita', ceritaInp, 'Satu paragraf per baris. Baris kosong diabaikan.'));
  root.appendChild(T.field('Jumlah kolom cerita', kolomSel));
  root.appendChild(preview);
  root.appendChild(T.row(
    T.btn('Unduh PNG', () => { dlNodePng(preview, 'koran-palsu.png'); }, true),
  ));
  gambar();
}
