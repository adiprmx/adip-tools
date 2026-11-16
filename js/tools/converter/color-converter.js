import { h as T, utils } from '../../core.js?v=6.13.0';

// OKLCH -> RGB (invers matriks Bjorn Ottosson). L 0-1, C >= 0, H derajat.
export function oklchToRgb(L, C, H) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const enc = (c) => {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(c * 255)));
  };
  return {
    r: enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: enc(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  };
}

// CMYK (%) -> RGB.
export function cmykToRgb(c, m, y, k) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

export const meta = {"id": "color-converter", "name": "Konverter Warna", "cat": "converter", "icon": "🎨", "desc": "Konversi HEX, RGB, HSL, OKLCH, CMYK + nama warna + cek kontras.", "keywords": "warna,color,hex,rgb,hsl,oklch,cmyk,kontras,wcag"};
export function render(root) {

    const inp = T.input('text', '#ff6b6b  atau  255,107,107  atau  hsl(0,100%,65%)  atau  oklch(65% 0.2 20)', '#ff6b6b');
    inp.autocapitalize = 'none'; inp.spellcheck = false;
    const prev = T.el('<div style="width:100%;height:96px;border-radius:12px;border:1px solid #3f3f46;margin:12px 0"></div>');
    const out = T.out();
    const kontrasBox = T.out();

    function parse(str) {
      str = String(str).trim().toLowerCase();
      let m;
      if ((m = str.match(/^#?([0-9a-f]{3})$/))) {
        const h = m[1];
        return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 };
      }
      if ((m = str.match(/^#?([0-9a-f]{4})$/))) {
        const h = m[1];
        return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: parseInt(h[3] + h[3], 16) / 255 };
      }
      if ((m = str.match(/^#?([0-9a-f]{6})$/))) {
        return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
      }
      if ((m = str.match(/^#?([0-9a-f]{8})$/))) {
        return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: parseInt(m[1].slice(6, 8), 16) / 255 };
      }
      if ((m = str.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9]*\.?[0-9]+))?/))) {
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
      }
      if ((m = str.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/))) {
        return { r: +m[1], g: +m[2], b: +m[3], a: 1 };
      }
      if ((m = str.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%(?:\s*,\s*([0-9]*\.?[0-9]+))?/))) {
        const c = hslToRgb(+m[1], +m[2], +m[3]);
        c.a = m[4] == null ? 1 : +m[4];
        return c;
      }
      if ((m = str.match(/^(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%$/))) {
        const c = hslToRgb(+m[1], +m[2], +m[3]);
        c.a = 1;
        return c;
      }
      // oklch(70% 0.15 20) atau oklch(0.7 0.15 20 / 0.5) — L boleh % atau 0-1.
      if ((m = str.match(/^oklch\(\s*(\d{1,3}(?:\.\d+)?%?)\s+(\d(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)(?:\s*\/\s*([0-9]*\.?[0-9]+))?\s*\)$/))) {
        let L = parseFloat(m[1]);
        if (m[1].includes('%')) L /= 100;
        else if (L > 1) L /= 100;
        const c = oklchToRgb(L, +m[2], +m[3]);
        c.a = m[4] == null ? 1 : +m[4];
        return c;
      }
      if ((m = str.match(/^cmyk\(\s*(\d{1,3}(?:\.\d+)?)%?\s*,\s*(\d{1,3}(?:\.\d+)?)%?\s*,\s*(\d{1,3}(?:\.\d+)?)%?\s*,\s*(\d{1,3}(?:\.\d+)?)%?\s*\)$/))) {
        const c = cmykToRgb(+m[1], +m[2], +m[3], +m[4]);
        c.a = 1;
        return c;
      }
      return null;
    }
    function hslToRgb(h, s, l) {
      h = ((h % 360) + 360) % 360; s = Math.min(100, Math.max(0, s)) / 100; l = Math.min(100, Math.max(0, l)) / 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (mx + mn) / 2;
      if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    const hex2 = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');

    // sRGB -> OKLCH (matriks Bjorn Ottosson)
    function rgbToOklch(r, g, b) {
      const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const R = lin(r), G = lin(g), B = lin(b);
      const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
      const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
      const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
      const l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
      const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
      const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
      const bb = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;
      const C = Math.sqrt(a * a + bb * bb);
      let h = Math.atan2(bb, a) * 180 / Math.PI;
      if (h < 0) h += 360;
      if (C < 0.0001) h = 0;
      return { l: L * 100, c: C, h };
    }
    function rgbToCmyk(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const k = 1 - Math.max(r, g, b);
      if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
      return {
        c: Math.round((1 - r - k) / (1 - k) * 100),
        m: Math.round((1 - g - k) / (1 - k) * 100),
        y: Math.round((1 - b - k) / (1 - k) * 100),
        k: Math.round(k * 100),
      };
    }

    // Nama warna standar CSS (subset kurasi) untuk pencari nama terdekat.
    const NAMA_WARNA = [
      ['Hitam', '#000000'], ['Putih', '#FFFFFF'], ['Merah', '#FF0000'], ['Hijau', '#008000'],
      ['Biru', '#0000FF'], ['Kuning', '#FFFF00'], ['Oranye', '#FFA500'], ['Ungu', '#800080'],
      ['Merah muda', '#FFC0CB'], ['Cokelat', '#A52A2A'], ['Abu-abu', '#808080'], ['Emas', '#FFD700'],
      ['Perak', '#C0C0C0'], ['Cyan', '#00FFFF'], ['Magenta', '#FF00FF'], ['Navy', '#000080'],
      ['Maroon', '#800000'], ['Zaitun', '#808000'], ['Teal', '#008080'], ['Lime', '#00FF00'],
      ['Aqua', '#00FFFF'], ['Koral', '#FF7F50'], ['Salmon', '#FA8072'], ['Tomat', '#FF6347'],
      ['Crimson', '#DC143C'], ['Merah bata', '#B22222'], ['Merah muda panas', '#FF69B4'],
      ['Pink tua', '#FF1493'], ['Lavender', '#E6E6FA'], ['Ungu muda', '#DDA0DD'],
      ['Indigo', '#4B0082'], ['Biru langit', '#87CEEB'], ['Biru baja', '#4682B4'],
      ['Biru dongker', '#191970'], ['Biru royal', '#4169E1'], ['Biru laut', '#1E90FF'],
      ['Biru muda', '#ADD8E6'], ['Hijau hutan', '#228B22'], ['Hijau laut', '#2E8B57'],
      ['Hijau muda', '#90EE90'], ['Hijau limau', '#32CD32'], ['Hijau musim semi', '#00FF7F'],
      ['Hijau zaitun tua', '#556B2F'], ['Hijau khaki', '#6B8E23'], ['Kuning hijau', '#9ACD32'],
      ['Kuning muda', '#FFFFE0'], ['Khaki', '#F0E68C'], ['Kuning emas', '#DAA520'],
      ['Kuning kunyit', '#B8860B'], ['Jingga tua', '#FF8C00'], ['Jingga merah', '#FF4500'],
      ['Cokelat peru', '#CD853F'], ['Cokelat tanah', '#D2691E'], ['Cokelat sadel', '#8B4513'],
      ['Cokelat sienna', '#A0522D'], ['Cokelat pasir', '#F4A460'], ['Tan', '#D2B48C'],
      ['Krem', '#FFFDD0'], ['Gading', '#FFFFF0'], ['Putih hantu', '#F8F8FF'],
      ['Putih salju', '#FFFAFA'], ['Putih asap', '#F5F5F5'], ['Abu-abu muda', '#D3D3D3'],
      ['Abu-abu tua', '#A9A9A9'], ['Abu-abu redup', '#696969'], ['Abu-abu batu', '#708090'],
      ['Biru abu', '#778899'], ['Biru kehijauan', '#5F9EA0'], ['Turquoise', '#40E0D0'],
      ['Turquoise tua', '#00CED1'], ['Hijau laut muda', '#20B2AA'], ['Aquamarine', '#7FFFD4'],
      ['Hijau mint', '#F5FFFA'], ['Biru bubuk', '#B0E0E6'], ['Biru jagung', '#6495ED'],
      ['Ungu medium', '#9370DB'], ['Ungu biru', '#8A2BE2'], ['Ungu tua', '#9400D3'],
      ['Anggrek', '#DA70D6'], ['Anggrek tua', '#9932CC'], ['Merah anggur', '#C71585'],
      ['Merah muda pucat', '#DB7093'], ['Kuning lemon', '#FFFACD'], ['Hijau kuning terang', '#ADFF2F'],
      ['Hijau rumput', '#7CFC00'], ['Chartreuse', '#7FFF00'], ['Hijau laut medium', '#3CB371'],
      ['Biru slate', '#6A5ACD'], ['Biru slate tua', '#483D8B'], ['Abu slate tua', '#2F4F4F'],
    ];
    function namaTerdekat(r, g, b) {
      let best = null, bestD = Infinity;
      NAMA_WARNA.forEach(([nama, hex]) => {
        const n = parseInt(hex.slice(1), 16);
        const dr = r - ((n >> 16) & 255), dg = g - ((n >> 8) & 255), db = b - (n & 255);
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = { nama, hex }; }
      });
      return best;
    }

    // WCAG: luminansi relatif + rasio kontras
    const luminansi = (r, g, b) => {
      const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const rasioKontras = (c1, c2) => {
      const l1 = luminansi(c1.r, c1.g, c1.b), l2 = luminansi(c2.r, c2.g, c2.b);
      const atas = Math.max(l1, l2), bawah = Math.min(l1, l2);
      return (atas + 0.05) / (bawah + 0.05);
    };

    const go = () => {
      const c = parse(inp.value);
      if (!c || [c.r, c.g, c.b].some((v) => v < 0 || v > 255 || Number.isNaN(v)) || c.a < 0 || c.a > 1) {
        T.show(out, '<span class="err">Format tidak dikenali. Coba: <b>#ff6b6b</b>, <b>255, 107, 107</b>, <b>rgba(255,107,107,0.5)</b>, <b>hsl(0, 100%, 65%)</b>, <b>oklch(65%, 0.2, 20)</b>, atau <b>cmyk(0%, 58%, 58%, 0%)</b>.</span>');
        return;
      }
      const hex = '#' + hex2(c.r) + hex2(c.g) + hex2(c.b);
      const hex8 = hex + hex2(c.a * 255);
      const rgb = 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
      const rgba = 'rgba(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ', ' + Math.round(c.a * 100) / 100 + ')';
      const hsl = rgbToHsl(c.r, c.g, c.b);
      const hslS = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
      const ok = rgbToOklch(c.r, c.g, c.b);
      const oklch = 'oklch(' + ok.l.toFixed(1) + '% ' + ok.c.toFixed(3) + ' ' + ok.h.toFixed(1) + ')';
      const cmyk = rgbToCmyk(c.r, c.g, c.b);
      const cmykS = 'cmyk(' + cmyk.c + '%, ' + cmyk.m + '%, ' + cmyk.y + '%, ' + cmyk.k + '%)';
      const nama = namaTerdekat(c.r, c.g, c.b);
      prev.style.background = hex;
      prev.style.opacity = c.a;
      const rows = [
        ['HEX', hex],
        ['HEX + transparansi', hex8],
        ['RGB', rgb],
        ['RGBA', rgba],
        ['HSL', hslS],
        ['OKLCH', oklch],
        ['CMYK', cmykS],
        ['Nama terdekat', nama.nama + ' (' + nama.hex + ')'],
      ];
      T.show(out,
        rows.map(([k, v]) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v" class="monoall">' + T.esc(v) + '</span></div>').join('') +
        '<div class="hint">Klik tombol untuk menyalin tiap format.</div>');
      const vals = [hex, hex8, rgb, rgba, hslS, oklch, cmykS];
      const names = ['HEX', 'HEX 8-digit', 'RGB', 'RGBA', 'HSL', 'OKLCH', 'CMYK'];
      const btns = T.el('<div style="margin-top:10px"></div>');
      vals.forEach((v, i) => {
        const b = T.btn('Salin ' + names[i], () => T.copy(v));
        b.classList.add('small'); b.style.margin = '0 6px 6px 0';
        btns.appendChild(b);
      });
      out.appendChild(btns);
      // isi warna teks kontras dengan warna hasil konversi
      if (!teksI.value) teksI.value = hex;
    };

    // Cek kontras WCAG
    const teksI = T.input('text', '#111111', '');
    const latarI = T.input('text', '#ffffff', '#ffffff');
    teksI.autocapitalize = 'none'; latarI.autocapitalize = 'none';
    const cekKontras = () => {
      const t = parse(teksI.value), l = parse(latarI.value);
      if (!t || !l) {
        T.show(kontrasBox, '<span class="err">Isi kedua warna dengan format HEX atau RGB yang benar.</span>');
        return;
      }
      const rasio = rasioKontras(t, l);
      const badge = (lolos, label) => '<span style="display:inline-block;padding:3px 9px;border-radius:20px;font-size:12px;margin:0 6px 6px 0;background:' + (lolos ? 'rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.4)' : 'rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.4)') + '">' + (lolos ? 'Lolos ' : 'Gagal ') + label + '</span>';
      const hexT = '#' + hex2(t.r) + hex2(t.g) + hex2(t.b);
      const hexL = '#' + hex2(l.r) + hex2(l.g) + hex2(l.b);
      T.show(kontrasBox,
        '<div style="background:' + hexL + ';color:' + hexT + ';border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid #3f3f46">' +
        '<div style="font-size:20px;font-weight:700;line-height:1.3">Contoh teks besar</div>' +
        '<div style="font-size:14px;line-height:1.5;margin-top:4px">Contoh teks biasa seperti paragraf ini. Rasio kontrasnya ' + rasio.toFixed(2) + ' banding 1.</div></div>' +
        '<div class="kv"><span class="k">Rasio kontras</span><span class="v">' + rasio.toFixed(2) + ' : 1</span></div>' +
        '<div style="margin-top:8px">' +
        badge(rasio >= 4.5, 'AA teks biasa (4.5)') +
        badge(rasio >= 3, 'AA teks besar (3)') +
        badge(rasio >= 7, 'AAA teks biasa (7)') +
        badge(rasio >= 4.5, 'AAA teks besar (4.5)') +
        '</div>' +
        '<p class="hint">Standar WCAG: teks biasa butuh rasio minimal 4.5 (AA) atau 7 (AAA), teks besar minimal 3 (AA) atau 4.5 (AAA).</p>');
    };

    root.appendChild(T.field('Warna (HEX / RGB / HSL)', inp));
    root.appendChild(T.row(T.btn('Konversi', go, true)));
    root.appendChild(prev);
    root.appendChild(out);
    root.appendChild(T.el('<h3 style="font-size:14px;margin:20px 0 4px">Cek kontras teks</h3>'));
    root.appendChild(T.el('<p class="hint" style="margin-bottom:10px">Cek apakah teks masih enak dibaca di atas warna latar. Standar aksesibilitas web (WCAG).</p>'));
    root.appendChild(T.grid2(T.field('Warna teks', teksI), T.field('Warna latar', latarI)));
    root.appendChild(T.row(T.btn('Cek kontras', cekKontras, true)));
    root.appendChild(kontrasBox);
    go();
  
}
