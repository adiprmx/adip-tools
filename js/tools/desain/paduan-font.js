import { h as T, utils } from '../../core.js?v=6.5.0';

/* 12 pasangan Google Fonts (judul + isi) siap pakai, lengkap dengan preview & salin CSS. */

const PAIRS = [
  { h: 'Playfair Display', b: 'Inter', hw: 700, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Klasik elegan — cocok buat undangan & brand mewah.' },
  { h: 'Poppins', b: 'Open Sans', hw: 600, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Modern & bersih — aman buat company profile.' },
  { h: 'Bebas Neue', b: 'Roboto', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Bold & padat — buat poster dan headline yang nendang.' },
  { h: 'Lora', b: 'Nunito', hw: 600, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Hangat dan ramah — enak buat blog & artikel panjang.' },
  { h: 'Montserrat', b: 'Lato', hw: 700, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Tegas tapi bersahabat — look-nya startup.' },
  { h: 'Oswald', b: 'Merriweather', hw: 500, bw: 400, hf: 'sans-serif', bf: 'serif', note: 'Nuansa editorial — serius tapi tetap enak dibaca.' },
  { h: 'DM Serif Display', b: 'DM Sans', hw: 400, bw: 400, hf: 'serif', bf: 'sans-serif', note: 'Premium minimalis — satu keluarga font, dijamin nyambung.' },
  { h: 'Space Grotesk', b: 'IBM Plex Sans', hw: 600, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Techy futuristik — cocok buat produk digital.' },
  { h: 'Archivo Black', b: 'Work Sans', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Berani dan playful — buat landing page yang standout.' },
  { h: 'Dancing Script', b: 'Quicksand', hw: 700, bw: 400, hf: 'cursive', bf: 'sans-serif', note: 'Manis dan personal — buat kartu ucapan & wedding.' },
  { h: 'Anton', b: 'Hind', hw: 400, bw: 400, hf: 'sans-serif', bf: 'sans-serif', note: 'Padat dan bertenaga — buat poster event.' },
  { h: 'JetBrains Mono', b: 'Inter', hw: 500, bw: 400, hf: 'monospace', bf: 'sans-serif', note: 'Nuansa developer — cocok buat dokumentasi & dashboard.' },
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

export const meta = {"id": "paduan-font", "name": "Paduan Font", "cat": "desain", "icon": "🔤", "desc": "12 pasangan font Google Fonts siap pakai.", "keywords": "font,pairing,tipografi,google fonts,desain"};
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
  T.onLeave(() => search.removeEventListener('input', onSearch));

  root.appendChild(T.field('Cari pasangan', search, PAIRS.length + ' pasangan terkurasi — klik Salin CSS buat langsung pakai.'));
  root.appendChild(list);
  paint();

}
