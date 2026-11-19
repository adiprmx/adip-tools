import { h as T, LOCAL_NOTE, fileInput, loadImage } from '../../core.js';

export const meta = {"id":"analisis-musim-warna","name":"Analisis Musim Warna","cat":"desain","icon":"🎨","desc":"Temukan musim warnamu dari ciri kulit, rambut, dan matamu.","keywords":"musim warna,seasonal color,warm,cool,undertone,palet,makeup","since":"6.19.0"};

// Palet tiap musim: 12 warna rekomendasi per musim (palet standar analisis
// musim warna: Spring hangat-terang-jernih, Summer dingin-terang-lembut,
// Autumn hangat-gelap-lembut, Winter dingin-gelap-jernih).
export const PALET = {
  spring: {
    nama: 'Spring (Musim Semi)',
    ciri: 'Hangat, terang, dan jernih. Warna yang cocok: cerah dan hangat seperti sinar matahari pagi.',
    warna: ['#FF6B6B', '#FF8C42', '#FFD166', '#FFF3B0', '#A8E6CF', '#7FDBDA', '#FFB997', '#F4A261', '#E9C46A', '#2EC4B6', '#FFC8DD', '#FFF8E7'],
    lipstik: 'Coral, peach, dan oranye hangat.',
    hindari: 'Warna dingin kebiruan dan hitam pekat yang terlalu berat.',
  },
  summer: {
    nama: 'Summer (Musim Panas)',
    ciri: 'Dingin, terang, dan lembut. Warna yang cocok: pastel sejuk dengan sedikit abu.',
    warna: ['#D8A7B1', '#A9C6DE', '#C3B2DB', '#B2C2A8', '#F4E1D2', '#B784A7', '#9DB8C4', '#C9C9C9', '#E6B8C3', '#A8B8D8', '#D5C6E0', '#F5F0EB'],
    lipstik: 'Merah muda lembut, rose, dan berry muda.',
    hindari: 'Warna oranye terang dan kuning hangat yang mencolok.',
  },
  autumn: {
    nama: 'Autumn (Musim Gugur)',
    ciri: 'Hangat, gelap, dan lembut. Warna yang cocok: warna tanah yang kaya dan hangat.',
    warna: ['#B85C38', '#6B7F3E', '#D9A441', '#CC5500', '#6B4226', '#2D5016', '#C9A227', '#8B4513', '#A0522D', '#556B2F', '#CD853F', '#F5E6CC'],
    lipstik: 'Merah bata, terakota, dan cokelat hangat.',
    hindari: 'Warna pastel dingin dan merah muda kebiruan.',
  },
  winter: {
    nama: 'Winter (Musim Dingin)',
    ciri: 'Dingin, gelap, dan jernih. Warna yang cocok: kontras tinggi, tajam, dan dingin.',
    warna: ['#1A1A1A', '#FFFFFF', '#1E3A8A', '#047857', '#BE185D', '#F9A8D4', '#C0C0C0', '#DC2626', '#4C1D95', '#0E7490', '#881337', '#E0E7FF'],
    lipstik: 'Merah sejati, berry gelap, dan fuchsia.',
    hindari: 'Warna oranye, emas hangat, dan pastel kekuningan.',
  },
};
const PERTANYAAN = [
  { id: 'urat', label: 'Warna urat nadi di pergelangan tanganmu', opsi: [
    ['dingin', 'Biru atau ungu'],
    ['hangat', 'Hijau'],
    ['netral', 'Campuran biru dan hijau'],
  ] },
  { id: 'perhiasan', label: 'Perhiasan mana yang membuat kulitmu terlihat lebih cerah?', opsi: [
    ['dingin', 'Perak'],
    ['hangat', 'Emas'],
    ['netral', 'Keduanya cocok'],
  ] },
  { id: 'matahari', label: 'Apa yang terjadi pada kulitmu setelah kena matahari?', opsi: [
    ['dingin', 'Mudah memerah atau terbakar'],
    ['hangat', 'Cepat menggelap (sawo matang)'],
    ['netral', 'Kadang memerah, lalu menggelap'],
  ] },
  { id: 'rambut', label: 'Warna rambut alaminya', opsi: [
    ['terang', 'Pirang atau cokelat terang'],
    ['sedang', 'Cokelat sedang'],
    ['gelap', 'Cokelat gelap atau hitam'],
  ] },
  { id: 'mata', label: 'Warna mata', opsi: [
    ['terang', 'Biru, hijau, atau cokelat muda'],
    ['gelap', 'Cokelat gelap atau hitam'],
  ] },
];

// Tentukan musim dari jawaban kuis (fungsi murni, bisa diuji tanpa DOM).
export function tentukanMusim(jawaban) {
  let hangat = 0, dingin = 0, terang = 0, gelap = 0;
  ['urat', 'perhiasan', 'matahari'].forEach((k) => {
    if (jawaban[k] === 'hangat') hangat++;
    else if (jawaban[k] === 'dingin') dingin++;
    else { hangat += 0.5; dingin += 0.5; }
  });
  if (jawaban.rambut === 'terang') terang += 2;
  else if (jawaban.rambut === 'sedang') { terang += 1; gelap += 1; }
  else gelap += 2;
  if (jawaban.mata === 'terang') terang += 1;
  else gelap += 1;
  const isHangat = hangat >= dingin;
  const isTerang = terang >= gelap;
  const musim = isHangat ? (isTerang ? 'spring' : 'autumn') : (isTerang ? 'summer' : 'winter');
  return { musim, hangat, dingin, terang, gelap };
}

// Nilai kehangatan kulit dari satu piksel: rasio merah terhadap biru.
export function nilaiKehangatan(r, g, b) {
  return Math.round((r - b) / 255 * 100) / 100;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Jawab lima pertanyaan singkat, lalu lihat musim warnamu beserta palet yang cocok. Ini perkiraan dari jawabanmu, bukan konsultasi penata gaya profesional. Kamu juga bisa memakai foto untuk cek kehangatan kulit.</p>'));

  const pilihan = {};
  PERTANYAAN.forEach((p) => {
    const sel = T.select(p.opsi, p.opsi[0][0]);
    pilihan[p.id] = sel;
    root.appendChild(T.field(p.label, sel));
  });

  const fileI = fileInput('image/*');
  root.appendChild(T.field('Foto wajah (opsional, untuk cek kehangatan kulit)', fileI));
  root.appendChild(T.el('<p class="hint">🔒 ' + LOCAL_NOTE + '</p>'));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const out = T.out();
  let sampelKulit = null;

  const kanvasFoto = document.createElement('canvas');
  kanvasFoto.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;cursor:crosshair';
  const fotoBox = T.out();

  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try {
      const img = await loadImage(fileI.files[0]);
      const skala = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
      kanvasFoto.width = Math.max(1, Math.round(img.naturalWidth * skala));
      kanvasFoto.height = Math.max(1, Math.round(img.naturalHeight * skala));
      const ctx = kanvasFoto.getContext('2d');
      if (!ctx) { T.toast('Foto tidak bisa diproses di perangkat ini'); return; }
      ctx.drawImage(img, 0, 0, kanvasFoto.width, kanvasFoto.height);
      T.show(fotoBox, '');
      fotoBox.appendChild(T.el('<div class="hint" style="margin-bottom:6px">Ketuk bagian kulit di foto (pipi atau dahi).</div>'));
      fotoBox.appendChild(kanvasFoto);
      statusBox.textContent = 'Foto dimuat. Ketuk bagian kulitnya.';
    } catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); }
  });

  kanvasFoto.addEventListener('click', (ev) => {
    const rect = kanvasFoto.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) * kanvasFoto.width / rect.width);
    const y = Math.floor((ev.clientY - rect.top) * kanvasFoto.height / rect.height);
    const ctx = kanvasFoto.getContext('2d');
    if (!ctx) return;
    const d = ctx.getImageData(x, y, 1, 1).data;
    const nilai = nilaiKehangatan(d[0], d[1], d[2]);
    sampelKulit = nilai;
    statusBox.textContent = 'Warna kulit di titik itu: rgb(' + d[0] + ', ' + d[1] + ', ' + d[2] + '). ' +
      (nilai > 0.08 ? 'Cenderung hangat.' : nilai < -0.02 ? 'Cenderung dingin.' : 'Cenderung netral.');
  });

  function tampil() {
    const jawaban = {};
    PERTANYAAN.forEach((p) => { jawaban[p.id] = pilihan[p.id].value; });
    const hasil = tentukanMusim(jawaban);
    const p = PALET[hasil.musim];
    let html = '<div style="border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px">' +
      '<div style="font-weight:800;font-size:18px;margin-bottom:4px">' + T.esc(p.nama) + '</div>' +
      '<div style="font-size:13.5px;line-height:1.6;color:var(--mut)">' + T.esc(p.ciri) + '</div>' +
      '<div style="font-size:12.5px;color:var(--faint);margin-top:6px">Skor: hangat ' + hasil.hangat + ' vs dingin ' + hasil.dingin + ', terang ' + hasil.terang + ' vs gelap ' + hasil.gelap + '.' +
      (sampelKulit !== null ? ' Sampel foto: kehangatan ' + sampelKulit + '.' : '') + '</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">';
    p.warna.forEach((w) => {
      html += '<div class="swatch-musim" data-warna="' + w + '" style="cursor:pointer;border-radius:10px;overflow:hidden;border:1px solid var(--line)">' +
        '<div style="height:44px;background:' + w + '"></div>' +
        '<div style="font-size:11px;padding:4px 6px;text-align:center;font-family:var(--font-m)">' + w + '</div></div>';
    });
    html += '</div>' +
      '<div style="font-size:13.5px;line-height:1.6"><b>Lipstik yang cocok:</b> ' + T.esc(p.lipstik) + '<br><b>Kurang cocok:</b> ' + T.esc(p.hindari) + '</div>' +
      '<div class="hint" style="margin-top:8px">Ketuk warna untuk menyalin kodenya.</div>';
    T.show(out, html);
    out.querySelectorAll('.swatch-musim').forEach((el) => {
      el.addEventListener('click', () => { T.copy(el.getAttribute('data-warna')); });
    });
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div>');
    row.appendChild(T.copyBtn(() => p.warna.join(', '), 'Salin semua warna'));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Lihat Musim Warnaku', tampil, true)));
  root.appendChild(statusBox);
  root.appendChild(fotoBox);
  root.appendChild(out);
  T.show(out, '<div class="dim center" style="padding:14px 0">Hasil analisismu akan tampil di sini.</div>');
  T.onLeave(() => { sampelKulit = null; });
}
