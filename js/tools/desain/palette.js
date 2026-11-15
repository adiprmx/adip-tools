import { h as T, utils } from '../../core.js?v=6.12.1';

function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return '#' + to(f(0)) + to(f(8)) + to(f(4));
  }

function hexToHsl(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
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

export const meta = {"id": "palette", "name": "Color Palette Generator", "cat": "desain", "icon": "🎨", "desc": "Palet harmonis, skala warna 50-950, ekspor Tailwind, mixer warna.", "keywords": "palette,palet,warna,harmonis,skala,tailwind,mixer"};
export function render(root) {

    const modeSel = T.select([
      ['analogous', 'Analogous (bersebelahan)'],
      ['complementary', 'Complementary (berlawanan)'],
      ['triadic', 'Triadic (segitiga)'],
      ['tetradic', 'Tetradic (persegi)'],
      ['mono', 'Monokromatik']
    ], 'analogous');
    const wrap = T.el('<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0"></div>');
    const state = { base: Math.floor(Math.random() * 360), locks: [false, false, false, false, false], colors: [] };
    const harmony = (mode, base) => {
      const offs = { analogous: [-40, -20, 0, 20, 40], complementary: [0, 180, 15, 195, 0], triadic: [0, 120, 240, 30, 150], tetradic: [0, 90, 180, 270, 45], mono: [0, 0, 0, 0, 0] }[mode];
      return offs.map((o, i) => {
        const h = (base + o + 360) % 360;
        const s = mode === 'mono' ? 65 : 65 + ((i * 7) % 15);
        const l = mode === 'mono' ? 30 + i * 10 : 55 + ((i % 2) * 6 - 3);
        return hslToHex(h, s, l);
      });
    };
    const swatches = [];
    const paint = () => {
      state.colors = harmony(modeSel.value, state.base).map((c, i) => state.locks[i] && state.colors[i] ? state.colors[i] : c);
      wrap.innerHTML = '';
      swatches.length = 0;
      state.colors.forEach((hex, i) => {
        const sw = T.el('<div style="border-radius:10px;overflow:hidden;border:1px solid #27272a;cursor:pointer;position:relative"></div>');
        sw.innerHTML =
          '<div style="height:86px;background:' + hex + '"></div>' +
          '<div style="padding:6px 4px;text-align:center;font-size:11px;font-family:monospace;background:#131316">' + hex.toUpperCase() + '</div>' +
          '<button type="button" title="' + (state.locks[i] ? 'Buka kunci' : 'Kunci warna') + '" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);border:none;border-radius:6px;font-size:13px;padding:2px 6px;cursor:pointer">' + (state.locks[i] ? '🔒' : '🔓') + '</button>';
        sw.addEventListener('click', (e) => {
          if (e.target.tagName === 'BUTTON') {
            state.locks[i] = !state.locks[i];
            paint();
          } else T.copy(hex);
        });
        wrap.appendChild(sw);
        swatches.push(sw);
      });
    };
    const gen = () => { state.base = Math.floor(Math.random() * 360); paint(); };
    root.appendChild(T.field('Mode harmoni', modeSel));
    root.appendChild(T.row(T.btn('🎲 Generate Palet', gen, true), T.btn('Buka Semua Kunci', () => { state.locks = [false, false, false, false, false]; paint(); })));
    root.appendChild(wrap);
    root.appendChild(T.el('<div class="hint">Klik warna untuk salin HEX · klik 🔓 untuk mengunci warna supaya tidak berubah saat generate.</div>'));
    modeSel.addEventListener('change', paint);
    paint();

    /* ---- Skala warna 50-950 dari satu warna dasar ---- */
    const SKALA = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const skalaInp = T.el('<input type="color" value="#6366f1" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const skalaHex = T.input('text', '#6366f1', '#6366f1');
    skalaHex.autocapitalize = 'none'; skalaHex.spellcheck = false;
    const skalaWrap = T.el('<div style="display:flex;flex-direction:column;gap:4px;margin:12px 0"></div>');
    const skalaState = { scale: [] };
    // Skala berjangkar di warna dasar: langkah 500 = warna dasar persis,
    // 50-400 makin terang (menuju 97), 600-950 makin gelap (menuju 13).
    const buatSkala = (hex) => {
      const hsl = hexToHsl(hex);
      // Jangkar ujung mengikuti basis bila basis sudah ekstrem, supaya
      // terang selalu menurun monoton dari 50 ke 950.
      const lAtas = Math.max(97, hsl.l);
      const lBawah = hsl.l <= 13 ? Math.max(0, hsl.l - 2) : 13;
      return SKALA.map((step) => {
        // 500 = warna dasar persis (tanpa rugi konversi HSL bolak-balik)
        if (step === 500) return { step, hex: hex.toLowerCase() };
        let l, sFaktor;
        if (step <= 500) {
          const t = (step - 50) / 450;
          l = lAtas + (hsl.l - lAtas) * t;
          sFaktor = 0.7 + 0.3 * t;
        } else {
          const t = (step - 500) / 450;
          l = hsl.l + (lBawah - hsl.l) * t;
          sFaktor = 1 - 0.15 * t;
        }
        const s = Math.round(Math.min(100, hsl.s * sFaktor));
        return { step, hex: hslToHex(hsl.h, s, Math.round(l)) };
      });
    };
    const catSkala = () => {
      let hex = (skalaHex.value || '').trim();
      if (!/^#?[0-9a-f]{6}$/i.test(hex)) { T.toast('Isi warna dasar dengan HEX yang benar, mis. #6366f1'); return; }
      if (!hex.startsWith('#')) hex = '#' + hex;
      skalaInp.value = hex;
      skalaState.scale = buatSkala(hex);
      skalaWrap.innerHTML = '';
      skalaState.scale.forEach(({ step, hex: h }) => {
        const row = T.el('<div style="display:flex;align-items:center;gap:10px;border-radius:8px;overflow:hidden;cursor:pointer;border:1px solid #27272a"></div>');
        row.innerHTML =
          '<div style="width:44px;height:34px;background:' + h + ';flex-shrink:0"></div>' +
          '<span style="font-size:13px;font-weight:600;width:36px">' + step + '</span>' +
          '<span style="font-size:12px;font-family:monospace;color:#a1a1aa">' + h.toUpperCase() + '</span>';
        row.addEventListener('click', () => T.copy(h));
        skalaWrap.appendChild(row);
      });
    };
    skalaInp.addEventListener('input', () => { skalaHex.value = skalaInp.value; catSkala(); });
    const eksporTailwind = () => {
      if (!skalaState.scale.length) { T.toast('Buat skalanya dulu'); return; }
      const isi = skalaState.scale.map(({ step, hex }) => "    '" + step + "': '" + hex + "',").join('\n');
      T.copy("// Tempel di tailwind.config.js, dalam theme.extend.colors\nbrand: {\n" + isi + "\n  },");
    };
    const eksporMaterial = () => {
      if (!skalaState.scale.length) { T.toast('Buat skalanya dulu'); return; }
      const isi = skalaState.scale.map(({ step, hex }) => '  --brand-' + step + ': ' + hex + ';').join('\n');
      T.copy(':root {\n' + isi + '\n}');
    };
    const eksporJson = () => {
      if (!skalaState.scale.length) { T.toast('Buat skalanya dulu'); return; }
      const obj = {};
      skalaState.scale.forEach(({ step, hex }) => { obj[step] = hex; });
      T.copy(JSON.stringify({ brand: obj }, null, 2));
    };
    const salinSemuaHex = () => {
      if (!skalaState.scale.length) { T.toast('Buat skalanya dulu'); return; }
      T.copy(skalaState.scale.map(({ hex }) => hex).join('\n'));
    };
    root.appendChild(T.el('<h3 style="font-size:14px;margin:22px 0 4px">Skala warna 50-950</h3>'));
    root.appendChild(T.el('<p class="hint" style="margin-bottom:10px">Satu warna dasar jadi 11 tingkat terang sampai gelap, siap pakai di Tailwind atau CSS. Klik baris untuk salin HEX-nya.</p>'));
    root.appendChild(T.grid2(T.field('Warna dasar', skalaInp), T.field('Kode HEX', skalaHex)));
    root.appendChild(T.row(
      T.btn('Buat skala', catSkala, true),
      T.btn('Salin Tailwind', eksporTailwind),
      T.btn('Salin CSS', eksporMaterial),
      T.btn('Salin JSON', eksporJson),
      T.btn('Salin semua HEX', salinSemuaHex)
    ));
    root.appendChild(skalaWrap);
    catSkala();

    /* ---- Color mixer: campur dua warna ---- */
    const mixA = T.el('<input type="color" value="#ff6b6b" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const mixB = T.el('<input type="color" value="#4f46e5" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const mixR = T.el('<input type="range" min="0" max="100" value="50" class="inp">');
    const mixLbl = T.el('<span class="hint">50% warna kedua</span>');
    const mixPrev = T.el('<div style="width:100%;height:72px;border-radius:12px;border:1px solid #3f3f46;margin:12px 0 6px"></div>');
    const mixHex = T.el('<div class="hint center" style="font-family:monospace;font-size:13px"></div>');
    const campur = () => {
      const t = mixR.value / 100;
      const pa = parseInt(mixA.value.slice(1), 16), pb = parseInt(mixB.value.slice(1), 16);
      const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
      const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
      const b = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
      const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      mixPrev.style.background = hex;
      mixHex.textContent = hex.toUpperCase() + '  (klik untuk salin)';
      mixLbl.textContent = mixR.value + '% warna kedua';
      mixPrev.dataset.hex = hex;
    };
    mixR.addEventListener('input', campur);
    mixA.addEventListener('input', campur);
    mixB.addEventListener('input', campur);
    mixPrev.addEventListener('click', () => { if (mixPrev.dataset.hex) T.copy(mixPrev.dataset.hex); });
    mixPrev.style.cursor = 'pointer';
    root.appendChild(T.el('<h3 style="font-size:14px;margin:22px 0 4px">Campur dua warna</h3>'));
    root.appendChild(T.el('<p class="hint" style="margin-bottom:10px">Geser untuk mengatur seberapa banyak warna kedua dicampur ke warna pertama.</p>'));
    root.appendChild(T.grid2(T.field('Warna pertama', mixA), T.field('Warna kedua', mixB)));
    const mixRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    mixRow.appendChild(mixR); mixRow.appendChild(mixLbl);
    root.appendChild(T.field('Takaran campuran', mixRow));
    root.appendChild(mixPrev);
    root.appendChild(mixHex);
    campur();
  
}
