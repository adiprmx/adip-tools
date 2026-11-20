import { h as T, utils, fileInput, loadImage } from '../../core.js';

export const meta = {"id": "generator-trofi-playstation", "name": "Generator Trofi PlayStation", "cat": "fun", "icon": "🏆", "desc": "Buat pop-up trofi PlayStation: perunggu, perak, emas, atau platinum, lengkap dengan nama game dan tingkat kelangkaan.", "keywords": "playstation,ps,trofi,trophy,platinum,emas,perak,perunggu,game,png", "since": "6.19.0"};

/* Empat tier trofi PlayStation dengan warna khasnya. */
export const TIER_TROFI = {
  perunggu: { nama: 'Perunggu', warna: '#cd7f32', warnaGelap: '#8c531f', poin: 15 },
  perak: { nama: 'Perak', warna: '#c0c0c0', warnaGelap: '#8a8a8a', poin: 30 },
  emas: { nama: 'Emas', warna: '#ffd700', warnaGelap: '#b8860b', poin: 90 },
  platinum: { nama: 'Platinum', warna: '#e5e4e2', warnaGelap: '#7dd3fc', poin: 180 },
};

export const RARITY = [
  ['umum', 'Umum (didapat >50% pemain)'],
  ['jarang', 'Jarang (didapat 10-50% pemain)'],
  ['sangat-jarang', 'Sangat jarang (didapat <10% pemain)'],
  ['ultra-jarang', 'Ultra jarang (didapat <5% pemain)'],
];

export function labelRarity(kode) {
  const r = RARITY.find((x) => x[0] === kode);
  return r ? r[1] : RARITY[0][1];
}

// Potong teks dengan '…' berdasarkan LEBAR TERUKUR (bukan jumlah karakter),
// supaya teks panjang tidak pernah meluber keluar kanvas.
function potongElipsis(x, teks, maksW) {
  if (x.measureText(teks).width <= maksW) return teks;
  let s = teks;
  while (s.length > 1 && x.measureText(s + '…').width > maksW) s = s.slice(0, -1);
  return s + '…';
}

// Bungkus kata + batasi jumlah baris + elipsis bila ada teks terpotong
// (bungkusKata membuang kata di luar 2 baris secara diam-diam).
function bungkusTerbatas(x, teks, maksW, maksBaris) {
  const rapi = String(teks).replace(/\s+/g, ' ').trim();
  let baris = utils.bungkusKata(x, rapi, maksW).map((b) => potongElipsis(x, b, maksW));
  const terpotong = baris.join(' ') !== rapi || baris.length > maksBaris;
  if (baris.length > maksBaris) baris = baris.slice(0, maksBaris);
  if (terpotong && baris.length) {
    const t = baris.length - 1;
    baris[t] = potongElipsis(x, baris[t].replace(/…$/, '') + '…', maksW);
  }
  return baris;
}

/* Ikon trofi digambar di kanvas: cangkir + gagang + kaki + alas. */
export function gambarTrofi(x, px, py, s, warna, warnaGelap) {
  x.save();
  x.translate(px + s / 2, py + s / 2);
  x.fillStyle = warna;
  x.strokeStyle = warna;
  x.lineWidth = s * 0.07;
  x.beginPath();
  x.moveTo(-s * 0.3, -s * 0.42); x.lineTo(s * 0.3, -s * 0.42);
  x.lineTo(s * 0.24, s * 0.02); x.lineTo(s * 0.09, s * 0.14);
  x.lineTo(s * 0.09, s * 0.3); x.lineTo(-s * 0.09, s * 0.3); x.lineTo(-s * 0.09, s * 0.14);
  x.lineTo(-s * 0.24, s * 0.02); x.closePath(); x.fill();
  x.beginPath(); x.arc(-s * 0.35, -s * 0.24, s * 0.11, Math.PI / 2, Math.PI * 1.5); x.stroke();
  x.beginPath(); x.arc(s * 0.35, -s * 0.24, s * 0.11, -Math.PI / 2, Math.PI / 2); x.stroke();
  x.fillStyle = warnaGelap;
  x.fillRect(-s * 0.22, s * 0.32, s * 0.44, s * 0.1);
  x.restore();
}

export function render(root) {
  const box = T.out();
  const gameI = T.input('text', 'cth: God of War Ragnarök', 'God of War Ragnarök');
  const judulI = T.input('text', 'cth: Pemburu Legenda', 'Pemburu Legenda');
  const descI = T.input('text', 'cth: Kalahkan semua bos opsional', 'Kalahkan semua bos opsional tanpa sekali pun mati');
  const tierI = T.select(Object.entries(TIER_TROFI).map(([k, v]) => [k, v.nama + ' (' + v.poin + ' poin)']), 'emas');
  const rarityI = T.select(RARITY, 'jarang');
  const fi = fileInput('image/*');
  let imgUnggah = null;
  const canvas = document.createElement('canvas');
  canvas.width = 680; canvas.height = 210;
  canvas.style.cssText = 'width:100%;max-width:680px;height:auto;border-radius:8px;display:block;margin:0 auto';


  const gambar = () => {
    const x = canvas.getContext('2d');
    const tier = TIER_TROFI[tierI.value] || TIER_TROFI.emas;
    x.fillStyle = '#003791'; x.fillRect(0, 0, 680, 210);
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(0, 0, 680, 210);
    x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2; x.strokeRect(1, 1, 678, 208);
    /* kotak ikon trofi */
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(24, 40, 130, 130);
    if (imgUnggah) {
      x.drawImage(imgUnggah, 24, 40, 130, 130);
    } else {
      gambarTrofi(x, 24, 40, 130, tier.warna, tier.warnaGelap);
    }
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = '#fff'; x.font = '700 22px system-ui, sans-serif';
    x.fillText('Trophy Earned!', 178, 28);
    x.fillStyle = tier.warna; x.font = '700 26px system-ui, sans-serif';
    x.fillText('🏆 ' + tier.nama + ' · ' + tier.poin + ' poin', 178, 58);
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    // Judul satu baris: dulu 32 karakter bisa melewati lebar kanvas.
    x.fillText(potongElipsis(x, (judulI.value.trim() || 'Trofi').slice(0, 32), 470), 178, 92);
    x.fillStyle = '#dbe7ff'; x.font = '400 21px system-ui, sans-serif';
    // 2 baris (y=130 & 156, bawah ≈177) — aman dari baris nama game di y=180.
    const baris = bungkusTerbatas(x, descI.value.trim().slice(0, 90), 470, 2);
    baris.forEach((b, i) => x.fillText(b, 178, 130 + i * 26));
    x.fillStyle = '#a8c0ff'; x.font = '400 19px system-ui, sans-serif';
    x.fillText(potongElipsis(x, (gameI.value.trim() || 'Game').slice(0, 36) + '  ·  ' + labelRarity(rarityI.value).split(' (')[0], 632), 24, 180);
  };

  const unduh = () => {
    canvas.toBlob((b) => { if (b) T.dl('ps-trophy-' + tierI.value + '.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    loadImage(f).then((im) => { imgUnggah = im; gambar(); })
      .catch(() => T.toast('Gambar gagal dibaca, coba file lain'));
  };

  [gameI, judulI, descI, tierI, rarityI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Pilih tier trofinya, tulis nama game dan pencapaianmu. Tiap tier punya warna dan poin sendiri: perunggu 15, perak 30, emas 90, platinum 180. Ikon trofi digambar otomatis, atau unggah gambar game sendiri.</p>'));
  root.appendChild(T.field('Nama game', gameI));
  root.appendChild(T.field('Nama trofi', judulI));
  root.appendChild(T.field('Deskripsi', descI));
  root.appendChild(T.field('Tier trofi', tierI));
  root.appendChild(T.field('Kelangkaan', rarityI));
  root.appendChild(T.row(T.btn('🖼️ Unggah gambar game', () => fi.click()), T.btn('⬇️ Unduh PNG', unduh, true)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
