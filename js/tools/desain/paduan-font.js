import { h as T, utils } from '../../core.js?v=6.12.1';

/* 12 pasangan Google Fonts (judul + isi) siap pakai, lengkap dengan preview & salin CSS. */

const PAIRS = [
  { h: 'Playfair Display', b: 'Inter', hw: 700, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Klasik elegan: cocok buat undangan & brand mewah.' },
  { h: 'Poppins', b: 'Open Sans', hw: 600, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Modern & bersih: aman buat company profile.' },
  { h: 'Bebas Neue', b: 'Roboto', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Bold & padat: buat poster dan headline yang nendang.' },
  { h: 'Lora', b: 'Nunito', hw: 600, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Hangat dan ramah: enak buat blog & artikel panjang.' },
  { h: 'Montserrat', b: 'Lato', hw: 700, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Tegas tapi bersahabat: look-nya startup.' },
  { h: 'Oswald', b: 'Merriweather', hw: 500, bw: 400, hf: 'sans-serif', bf: 'serif', note: 'Nuansa editorial: serius tapi tetap enak dibaca.' },
  { h: 'DM Serif Display', b: 'DM Sans', hw: 400, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Premium minimalis: satu keluarga font, dijamin nyambung.' },
  { h: 'Space Grotesk', b: 'IBM Plex Sans', hw: 600, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Techy futuristik: cocok buat produk digital.' },
  { h: 'Archivo Black', b: 'Work Sans', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Berani dan playful: buat landing page yang standout.' },
  { h: 'Dancing Script', b: 'Quicksand', hw: 700, bw: 400, hf: 'cursive', bf: 'sans-serif', note: 'Manis dan personal: buat kartu ucapan & wedding.' },
  { h: 'Anton', b: 'Hind', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Padat dan bertenaga: buat poster event.' },
  { h: 'JetBrains Mono', b: 'Inter', hw: 500, bw: 400, hf: 'monospace', bf: 'sans-serif', note: 'Nuansa developer: cocok buat dokumentasi & dashboard.' },
];

function gfURL() {
  const seen = new Set();
  const fam = [];
  PAIRS.forEach((p) => {
    [[p.h, p.hw], [p.b, p.bw]].forEach(([name, w]) => {
      const key = name + ':' + w;
      if (seen.has(key)) return;
      seen.add(key);
      fam.push('family=' + name.replace(/ /g, '+') + ':wght@' + w);
    });
  });
  return 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap';
}

function cssFor(p) {
  return ".judul { font-family: '" + p.h + "', " + p.hf + "; font-weight: " + p.hw + "; }\n" +
    ".isi { font-family: '" + p.b + "', " + p.bf + "; font-weight: " + p.bw + "; }";
}

export const meta = {"id": "paduan-font", "name": "Paduan Font", "cat": "desain", "icon": "🔤", "desc": "12 pasangan font Google Fonts + pratinjau di contoh halaman.", "keywords": "font,pairing,tipografi,google fonts,desain"};
export function render(root) {

  // Muat semua font sekali saja (tidak diulang tiap buka tool)
  if (typeof document !== 'undefined' && !document.getElementById('paduan-font-gf')) {
    const link = document.createElement('link');
    link.id = 'paduan-font-gf';
    link.rel = 'stylesheet';
    link.href = gfURL();
    document.head.appendChild(link);
  }

  const search = T.input('text', 'Cari font… mis. serif, mono, poppins');
  const list = T.el('<div style="margin-top:12px"></div>');

  /* Pratinjau pasangan terpilih di contoh halaman nyata (navigasi, hero,
     paragraf, tombol, footer) supaya kelihatan rasanya di pemakaian asli. */
  let terpilih = PAIRS[0];
  const teksJudul = T.input('text', 'Judul contoh…', 'Ngopi santai, cerita mengalir.');
  const teksIsi = T.ta(2, 'Paragraf contoh…', 'Kedai kecil di ujung gang dengan biji kopi pilihan dari petani lokal. Duduklah sebentar, pesan satu cangkir, dan biarkan sore berjalan pelan.');
  const temaContoh = T.select([['terang', 'Contoh halaman terang'], ['gelap', 'Contoh halaman gelap']], 'terang');
  const contoh = T.el('<div style="border:1px solid #27272a;border-radius:14px;overflow:hidden;margin:12px 0;background:#fafafa;color:#18181b"></div>');
  const contohLabel = T.el('<p class="hint" style="margin:12px 0 0"></p>');
  function gambarContoh() {
    const p = terpilih;
    const fj = "'" + p.h + "'," + p.hf;
    const fi = "'" + p.b + "'," + p.bf;
    const gelap = temaContoh.value === 'gelap';
    const bg = gelap ? '#18181b' : '#fafafa';
    const tx = gelap ? '#fafafa' : '#18181b';
    const tx2 = gelap ? '#d4d4d8' : '#3f3f46';
    const tx3 = gelap ? '#a1a1aa' : '#52525b';
    const tx4 = gelap ? '#71717a' : '#71717a';
    const garis = gelap ? '#27272a' : '#e4e4e7';
    const btnBg = gelap ? '#fafafa' : '#18181b';
    const btnTx = gelap ? '#18181b' : '#fafafa';
    const judul = T.esc(teksJudul.value.trim() || 'Judul contoh');
    const isi = T.esc(teksIsi.value.trim() || 'Paragraf contoh.');
    contoh.style.background = bg;
    contoh.style.color = tx;
    contohLabel.textContent = 'Contoh halaman dengan ' + p.h + ' (judul) + ' + p.b + ' (isi)';
    contoh.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid ' + garis + '">' +
      '<span style="font-family:' + fj + ';font-weight:' + p.hw + ';font-size:17px">Kedai Kopi Senja</span>' +
      '<span style="font-family:' + fi + ';font-size:12px;color:' + tx3 + '">Menu · Cerita · Lokasi</span></div>' +
      '<div style="padding:20px 16px 8px">' +
      '<div style="font-family:' + fj + ';font-weight:' + p.hw + ';font-size:26px;line-height:1.2">' + judul + '</div>' +
      '<p style="font-family:' + fi + ';font-weight:' + p.bw + ';font-size:14px;line-height:1.65;color:' + tx2 + ';margin:10px 0 0">' + isi + '</p>' +
      '<span style="display:inline-block;margin-top:14px;background:' + btnBg + ';color:' + btnTx + ';font-family:' + fi + ';font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px">Lihat menu hari ini</span></div>' +
      '<div style="display:flex;gap:12px;padding:16px;border-top:1px solid ' + garis + ';margin-top:16px">' +
      '<div style="flex:1"><div style="font-family:' + fj + ';font-weight:' + p.hw + ';font-size:14px">Biji pilihan</div><div style="font-family:' + fi + ';font-size:12px;color:' + tx3 + ';line-height:1.5;margin-top:3px">Dipanggang tiap minggu, diseduh per cangkir.</div></div>' +
      '<div style="flex:1"><div style="font-family:' + fj + ';font-weight:' + p.hw + ';font-size:14px">Tempat nyaman</div><div style="font-family:' + fi + ';font-size:12px;color:' + tx3 + ';line-height:1.5;margin-top:3px">Sofa empuk, colokan banyak, wifi kencang.</div></div></div>' +
      '<div style="padding:10px 16px;border-top:1px solid ' + garis + ';font-family:' + fi + ';font-size:11px;color:' + tx4 + '">Jl. Melati No. 8 · Buka tiap hari 08.00-22.00</div>';
  }

  function card(p) {
    const c = T.el('<div class="card" style="margin-bottom:12px;padding:14px"></div>');
    const hPrev = T.el('<div></div>');
    hPrev.textContent = 'Desain yang Berbicara';
    hPrev.style.cssText = "font-family:'" + p.h + "'," + p.hf + ";font-weight:" + p.hw + ";font-size:26px;line-height:1.25";
    const bPrev = T.el('<div></div>');
    bPrev.textContent = 'Tipografi yang bagus bikin pembaca betah. Pasangan ini dipilih biar judul dan isi saling melengkapi.';
    bPrev.style.cssText = "font-family:'" + p.b + "'," + p.bf + ";font-weight:" + p.bw + ";font-size:14px;line-height:1.6;margin-top:8px;color:#d4d4d8";
    const names = T.el('<div class="hint" style="margin:10px 0 2px"></div>');
    names.textContent = 'Judul: ' + p.h + ' · Isi: ' + p.b;
    const note = T.el('<div class="hint" style="margin-bottom:8px"></div>');
    note.textContent = p.note;
    const r = T.el('<div class="row"></div>');
    r.appendChild(T.copyBtn(() => cssFor(p), 'Salin CSS'));
    const lihatB = T.btn('Lihat di contoh halaman', () => {
      terpilih = p;
      gambarContoh();
      T.scrollToPreview(contoh);
      paint();
    });
    if (terpilih === p) lihatB.classList.add('primary');
    r.appendChild(lihatB);
    c.appendChild(hPrev);
    c.appendChild(bPrev);
    c.appendChild(names);
    c.appendChild(note);
    c.appendChild(r);
    return c;
  }

  function paint() {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = '';
    const hit = PAIRS.filter((p) => !q ||
      (p.h + ' ' + p.b + ' ' + p.hf + ' ' + p.bf + ' ' + p.note).toLowerCase().includes(q));
    if (!hit.length) {
      list.appendChild(T.el('<div class="hint">Nggak ketemu. Coba kata lain, mis. "serif" atau "mono".</div>'));
      return;
    }
    hit.forEach((p) => list.appendChild(card(p)));
  }

  function onSearch() { paint(); }
  search.addEventListener('input', onSearch);
  teksJudul.addEventListener('input', gambarContoh);
  teksIsi.addEventListener('input', gambarContoh);
  temaContoh.addEventListener('change', gambarContoh);
  T.onLeave(() => search.removeEventListener('input', onSearch));

  root.appendChild(T.field('Cari pasangan', search, PAIRS.length + ' pasangan terkurasi: klik Salin CSS buat langsung pakai.'));
  root.appendChild(contohLabel);
  root.appendChild(contoh);
  root.appendChild(T.field('Judul di contoh halaman (bisa diganti)', teksJudul, 'Tulis judulmu sendiri untuk melihat rasanya dengan font ini.'));
  root.appendChild(T.field('Paragraf di contoh halaman (bisa diganti)', teksIsi));
  root.appendChild(T.field('Warna contoh halaman', temaContoh));
  root.appendChild(list);
  gambarContoh();
  paint();

}
