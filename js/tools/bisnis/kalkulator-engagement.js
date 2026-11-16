import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "kalkulator-engagement", "name": "Kalkulator Engagement Rate", "cat": "bisnis", "icon": "❤️", "desc": "Hitung engagement rate konten TikTok, Instagram, dan YouTube dari like, komen, share, dan views.", "keywords": "engagement rate,er,konten,tiktok,instagram,youtube,kreator,endorse,like,komen,share", "since": "6.13.0"};

// Ambang vonis ER per followers (patokan umum industri kreator; tiap niche
// beda-beda, jadi ambangnya dinyatakan jelas di UI, bukan disembunyikan):
// <1% rendah, 1–3% sedang, 3–6% tinggi, >6% sangat tinggi.
function vonisER(er) {
  if (er < 1) return { teks: 'Rendah', cls: 'err', saran: 'Di bawah 1% — coba ubah hook 3 detik pertama, ajak penonton komen, dan posting di jam audiensmu aktif.' };
  if (er < 3) return { teks: 'Sedang', cls: 'warn', saran: '1–3% itu rata-rata kebanyakan akun. Sudah oke — tinggal konsisten dan uji format baru.' };
  if (er < 6) return { teks: 'Tinggi', cls: 'info', saran: '3–6% — di atas rata-rata. Audiensmu aktif; ini angka yang bagus untuk ditawarkan ke brand.' };
  return { teks: 'Sangat tinggi', cls: 'info', saran: 'Di atas 6% — luar biasa. Simpan format konten ini dan ulangi polanya.' };
}

function hitungER(like, komen, share, simpan, views, followers) {
  const interaksi = like + komen + share + simpan;
  const erViews = views > 0 ? (interaksi / views) * 100 : null;
  const erFollowers = followers > 0 ? (interaksi / followers) * 100 : null;
  return { interaksi, erViews, erFollowers };
}

utils.engagementHitung = hitungER;
utils.engagementVonis = vonisER;

const HINT_PLATFORM = {
  tiktok: 'Di TikTok, ER per views lebih bermakna karena videomu ditonton banyak orang bukan followers.',
  instagram: 'Di Instagram, ER per followers adalah patokan yang paling sering dipakai brand saat menilai akun.',
  youtube: 'Di YouTube, bandingkan juga dengan rata-rata channelmu — video Shorts dan video panjang polanya beda.',
};

export function render(root) {
  const platformI = T.select([
    ['tiktok', 'TikTok'],
    ['instagram', 'Instagram'],
    ['youtube', 'YouTube'],
  ], 'tiktok');
  const likeI = T.input('text', 'cth: 1200', '');
  const komenI = T.input('text', 'cth: 85', '');
  const shareI = T.input('text', 'cth: 40', '');
  const simpanI = T.input('text', 'cth: 60 (boleh kosong)', '');
  const viewsI = T.input('text', 'cth: 25000', '');
  const followersI = T.input('text', 'cth: 8000', '');
  [likeI, komenI, shareI, simpanI, viewsI, followersI].forEach((i) => { i.inputMode = 'decimal'; });
  const hintPlatform = T.el('<p class="hint"></p>');
  const box = T.out();

  const aturPlatform = () => {
    hintPlatform.textContent = HINT_PLATFORM[platformI.value] || '';
  };

  const hitung = () => {
    const like = T.num(likeI.value);
    const komen = T.num(komenI.value);
    const share = T.num(shareI.value);
    const simpan = simpanI.value.trim() === '' ? 0 : T.num(simpanI.value);
    const views = T.num(viewsI.value);
    const followers = T.num(followersI.value);
    const angka = [like, komen, share, simpan, views, followers];
    if (!angka.every((n) => isFinite(n) && n >= 0)) {
      T.toast('Isi semua angka dengan benar — boleh 0, tapi jangan dikosongkan (kecuali Simpan).'); return;
    }
    if (views <= 0 && followers <= 0) {
      T.toast('Isi minimal salah satu: jumlah views atau jumlah followers.'); return;
    }
    const h = hitungER(like, komen, share, simpan, views, followers);
    // Guard hasil: angka raksasa meluberkan total interaksi/ER ke Infinity
    // (RT2-08: "Infinity%" + vonis "Sangat tinggi" yang salah).
    if (!isFinite(h.interaksi) || (h.erViews !== null && !isFinite(h.erViews)) || (h.erFollowers !== null && !isFinite(h.erFollowers))) {
      T.toast('Angkanya terlalu besar untuk dihitung — coba pakai angka yang lebih kecil.'); return;
    }
    const namaPlatform = platformI.options[platformI.selectedIndex].text;
    let hasil = '<div class="center"><div class="dim">Total interaksi (like + komen + share + simpan)</div>' +
      '<div class="big">' + T.fmt(h.interaksi) + '</div></div>';
    if (h.erViews !== null) {
      hasil += kv('Engagement rate per views', h.erViews.toFixed(2).replace('.', ',') + '%') +
        '<p class="hint">Dari ' + T.fmt(views) + ' views, ' + h.erViews.toFixed(2).replace('.', ',') + '% penonton berinteraksi.</p>';
    }
    if (h.erFollowers !== null) {
      const v = vonisER(h.erFollowers);
      hasil += kv('Engagement rate per followers', h.erFollowers.toFixed(2).replace('.', ',') + '%') +
        '<p class="' + v.cls + '"><b>Vonis: ' + v.teks + '.</b> ' + v.saran + '</p>';
    }
    hasil += '<p class="hint">Patokan vonis (ER per followers, patokan umum industri): di bawah 1% rendah, 1–3% sedang, 3–6% tinggi, di atas 6% sangat tinggi. ' +
      'Angka ini gambaran umum — tiap niche dan ukuran akun beda standarnya. Hasil ini bisa dipakai sebagai input di tool Rate Card Endorse.</p>';
    T.show(box, hasil);
  };

  root.appendChild(T.el('<p class="note">Sebelum pasang tarif endorse, hitung dulu engagement rate-mu. Masukkan angka satu postingan — like, komen, share, views, dan followers — biar ketahuan seberapa aktif audiensmu.</p>'));
  root.appendChild(T.field('Platform', platformI));
  root.appendChild(hintPlatform);
  root.appendChild(T.grid2(
    T.field('Like', likeI),
    T.field('Komentar', komenI)
  ));
  root.appendChild(T.grid2(
    T.field('Share / bagikan', shareI),
    T.field('Simpan (opsional)', simpanI, 'Kosongkan bila platformnya tidak punya fitur simpan.')
  ));
  root.appendChild(T.grid2(
    T.field('Jumlah views', viewsI),
    T.field('Jumlah followers', followersI)
  ));
  root.appendChild(T.row(T.btn('Hitung Engagement Rate', hitung, true)));
  root.appendChild(box);
  platformI.addEventListener('change', aturPlatform);
  aturPlatform();
}
