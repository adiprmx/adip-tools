import { h as T, fileInput } from '../../core.js';

export const meta = {"id": "tiktok-wrapped", "name": "TikTok Wrapped", "cat": "fun", "icon": "🎵", "desc": "Rangkuman setahun TikTok-mu: video ditonton, suka, komentar, dan bagikan, dari file ekspor atau isi manual.", "keywords": "tiktok,wrapped,statistik,video,suka,komentar,bagikan,ekspor,tahunan", "since": "6.19.0"};

/* Parser file ekspor TikTok (Settings > Manage account > Download your data,
   file user_data_tiktok.json). Struktur dipakai:
   "Your Activity" > "Video Browsing History" > VideoList [{Date, Link}],
   "Like List" > ItemFavoriteList, "Share History" > ShareList,
   "Comment History" > CommentsList. Tanggal bentuk "2024-01-15 21:03:00". */
export function parseTikTokJson(teks) {
  let data;
  try { data = JSON.parse(teks); } catch (e) { return null; }
  if (!data || typeof data !== 'object') return null;
  const aktivitas = data['Your Activity'] || data;
  const ambil = (kunci, daftar) => {
    const bagian = aktivitas[kunci];
    if (!bagian || typeof bagian !== 'object') return [];
    const arr = bagian[daftar];
    return Array.isArray(arr) ? arr : [];
  };
  const tonton = ambil('Video Browsing History', 'VideoList');
  const suka = ambil('Like List', 'ItemFavoriteList');
  const bagikan = ambil('Share History', 'ShareList');
  const komen = ambil('Comment History', 'CommentsList');
  const total = tonton.length + suka.length + bagikan.length + komen.length;
  if (total === 0) return null;
  const perJam = {};
  let hariAktif = new Set();
  for (const v of tonton) {
    if (!v || typeof v.Date !== 'string') continue;
    const m = v.Date.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):/);
    if (!m) continue;
    hariAktif.add(m[1] + '-' + m[2] + '-' + m[3]);
    const j = Number(m[4]);
    perJam[j] = (perJam[j] || 0) + 1;
  }
  let jamSibuk = null, jamMaks = 0;
  for (const [j, c] of Object.entries(perJam)) if (c > jamMaks) { jamMaks = c; jamSibuk = Number(j); }
  return {
    ditonton: tonton.length,
    suka: suka.length,
    bagikan: bagikan.length,
    komen: komen.length,
    hariAktif: hariAktif.size,
    jamSibuk,
    jamSibukJumlah: jamMaks,
  };
}

export function hitungRingkasan(d) {
  const bulat4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };
  return {
    perHari: d.hariAktif > 0 ? bulat4(d.ditonton / d.hariAktif) : 0,
    rasioSuka: d.ditonton > 0 ? bulat4((d.suka / d.ditonton) * 100) : 0,
  };
}

export function render(root) {
  const box = T.out();
  const tontonI = T.input('number', 'cth: 18400');
  const sukaI = T.input('number', 'cth: 3200');
  const komenI = T.input('number', 'cth: 450');
  const bagikanI = T.input('number', 'cth: 210');
  const fi = fileInput('.json');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah file user_data_tiktok.json dari ekspor TikTok.<br><br>Cara dapat file-nya: buka TikTok, masuk ke Pengaturan lalu "Kelola akun", pilih "Unduh datamu", minta file JSON, lalu cari file bernama user_data_tiktok.json. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const r = hitungRingkasan(data);
    let html = '<div class="big center">' + T.fmt(data.ditonton) + '<span class="mut" style="font-size:15px"> video ditonton</span></div>' +
      '<p class="center hint">' + T.fmt(data.suka) + ' suka · ' + T.fmt(data.komen) + ' komentar · ' + T.fmt(data.bagikan) + ' dibagikan.</p>';
    if (data.hariAktif > 0) html += '<p class="center hint">Aktif di ' + T.fmt(data.hariAktif) + ' hari, rata-rata ' + T.fmt(r.perHari) + ' video per hari aktif.</p>';
    if (r.rasioSuka > 0) html += '<p class="center hint">Kamu menyukai ' + T.fmt(r.rasioSuka) + '% dari video yang ditonton.</p>';
    if (data.jamSibuk !== null && data.jamSibuk !== undefined) {
      html += '<p class="center hint">Jam paling sering menonton: pukul ' + String(data.jamSibuk).padStart(2, '0') + '.00 (' + T.fmt(data.jamSibukJumlah) + ' video).</p>';
    }
    T.show(box, html);
    const dl = T.btn('⬇️ Unduh kartu PNG', () => unduhKartu(), true);
    dl.style.marginTop = '14px';
    box.appendChild(dl);
  };

  const unduhKartu = () => {
    if (!data) return;
    const c = document.createElement('canvas');
    c.width = 900; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = '#171923'; x.fillRect(0, 0, 900, 1200);
    x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '700 34px system-ui, sans-serif';
    x.fillText('TikTok Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman setahunmu', 48, 118);
    const r = hitungRingkasan(data);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(data.ditonton), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('video ditonton', 48, 285);
    let y = 380;
    x.fillStyle = '#fff'; x.font = '400 26px system-ui, sans-serif';
    x.fillText(T.fmt(data.suka) + ' suka', 48, y); y += 44;
    x.fillText(T.fmt(data.komen) + ' komentar', 48, y); y += 44;
    x.fillText(T.fmt(data.bagikan) + ' dibagikan', 48, y); y += 44;
    if (data.hariAktif > 0) { x.fillText('Aktif di ' + T.fmt(data.hariAktif) + ' hari · ' + T.fmt(r.perHari) + ' video per hari', 48, y); y += 44; }
    if (r.rasioSuka > 0) { x.fillText('Menyukai ' + T.fmt(r.rasioSuka) + '% dari video yang ditonton', 48, y); y += 44; }
    if (data.jamSibuk !== null && data.jamSibuk !== undefined) { x.fillText('Jam paling sibuk: pukul ' + String(data.jamSibuk).padStart(2, '0') + '.00', 48, y); y += 44; }
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('tiktok-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const ditonton = T.num(tontonI.value) || 0;
    const suka = T.num(sukaI.value) || 0;
    const komen = T.num(komenI.value) || 0;
    const bagikan = T.num(bagikanI.value) || 0;
    if (!ditonton && !suka && !komen && !bagikan) {
      T.toast('Isi dulu salah satu angkanya');
      return;
    }
    data = { ditonton, suka, komen, bagikan, hariAktif: 0, jamSibuk: null, jamSibukJumlah: 0 };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseTikTokJson(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini user_data_tiktok.json dari ekspor TikTok'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.ditonton) + ' video ditonton');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah file JSON ekspor TikTok supaya angka dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Video ditonton setahun', tontonI));
  root.appendChild(T.field('Video yang disukai', sukaI));
  root.appendChild(T.field('Komentar yang ditulis', komenI));
  root.appendChild(T.field('Video yang dibagikan', bagikanI));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah JSON ekspor', () => fi.click())));
  root.appendChild(box);
  gambar();
}
