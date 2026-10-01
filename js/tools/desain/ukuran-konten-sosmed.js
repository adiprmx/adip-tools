import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"ukuran-konten-sosmed","name":"Ukuran Sosmed","cat":"desain","icon":"📐","desc":"Panduan ukuran konten sosmed 2026 + kalkulator rasio.","keywords":"ukuran,sosmed,instagram,tiktok,youtube,rasio,dimensi,feed,story,reels,thumbnail"};

const FORMATS = [
  ['IG Feed', '1080 × 1080', 1080, 1080],
  ['IG Story', '1080 × 1920', 1080, 1920],
  ['IG Reels', '1080 × 1920', 1080, 1920],
  ['TikTok', '1080 × 1920', 1080, 1920],
  ['WA Status', '1080 × 1920', 1080, 1920],
  ['YouTube Thumbnail', '1280 × 720', 1280, 720],
  ['X Post', '1200 × 675', 1200, 675],
  ['X Header', '1500 × 500', 1500, 500],
];

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

export function render(root) {
  const wI = T.input('number', 'Lebar (px)');
  const hI = T.input('number', 'Tinggi (px)');
  const out = T.out();

  const calc = () => {
    const w = Math.round(Number(wI.value)), h = Math.round(Number(hI.value));
    if (!w || !h || w < 1 || h < 1) {
      T.show(out, '<p class="hint center">Isi lebar & tinggi dulu — mis. 800 × 1200.</p>');
      return;
    }
    const g = gcd(w, h);
    const ratio = w / h;
    let best = null, bd = Infinity;
    FORMATS.forEach(([n, dim, fw, fh]) => {
      const d = Math.abs(fw / fh - ratio);
      if (d < bd) { bd = d; best = [n, dim]; }
    });
    const note = bd < 0.002
      ? 'Pas banget sama <b>' + T.esc(best[0]) + '</b> (' + T.esc(best[1]) + ').'
      : 'Paling mirip <b>' + T.esc(best[0]) + '</b> (' + T.esc(best[1]) + ').';
    T.show(out,
      '<div class="big center">' + (w / g) + ':' + (h / g) + '</div>' +
      '<p class="center">' + T.esc(String(w)) + ' × ' + T.esc(String(h)) + ' px — ' + note + '</p>');
  };

  root.appendChild(T.el('<p class="hint">Kalkulator rasio</p>'));
  root.appendChild(T.grid2(wI, hI));
  root.appendChild(T.row(T.btn('Hitung rasio', calc, true)));
  root.appendChild(out);

  root.appendChild(T.el('<p class="hint" style="margin-top:18px">Panduan ukuran 2026</p>'));
  const tbl = T.el('<table style="width:100%;border-collapse:collapse;font-size:13px"></table>');
  FORMATS.forEach(([n, dim]) => {
    const tr = T.el('<tr><td style="padding:9px 6px;border-bottom:1px solid var(--line)">' +
      T.esc(n) + '<div class="mut" style="font-size:12px">' + T.esc(dim) + ' px</div></td></tr>');
    const td = T.el('<td style="border-bottom:1px solid var(--line);text-align:right;vertical-align:middle"></td>');
    td.appendChild(T.btn('Salin', () => T.copy(dim.replace(/\s/g, ''))));
    tr.appendChild(td);
    tbl.appendChild(tr);
  });
  root.appendChild(tbl);
  root.appendChild(T.el('<p class="hint center" style="margin-top:14px">Ini panduan umum 2026 — ketentuan tiap platform bisa berubah sewaktu-waktu, cek halaman resmi mereka sebelum produksi.</p>'));
}
