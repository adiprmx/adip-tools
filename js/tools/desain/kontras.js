import { h as T } from '../../core.js?v=5.2.0';

function hex2rgb(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lum(rgb) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
const badge = (ok) => ok
  ? '<b class="ok">✓ Lolos</b>'
  : '<b class="warn">✗ Gagal</b>';

export const meta = {"id": "kontras", "name": "Cek Kontras Warna", "cat": "desain", "icon": "◐", "desc": "Rasio kontras WCAG AA/AAA.", "keywords": "kontras,wcag,warna,aksesibilitas"};
export function render(root) {

    const c1 = T.input('color', '', '#ffffff');
    const c2 = T.input('color', '', '#000000');
    const t1 = T.input('text', '#ffffff', '#ffffff');
    const t2 = T.input('text', '#000000', '#000000');
    [t1, t2].forEach((t) => { t.style.fontFamily = 'monospace'; });
    const box = T.out();
    const prev = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div>');
    const pv1 = T.el('<div style="border-radius:12px;padding:18px 12px;text-align:center;border:1px solid #ffffff20"></div>');
    const pv2 = T.el('<div style="border-radius:12px;padding:18px 12px;text-align:center;border:1px solid #ffffff20"></div>');
    prev.appendChild(pv1); prev.appendChild(pv2);

    const sync = (col, txt) => { txt.value = col.value; hitung(); };

    const hitung = () => {
      const a = hex2rgb(t1.value) || hex2rgb(c1.value), b = hex2rgb(t2.value) || hex2rgb(c2.value);
      if (!a || !b) { T.show(box, '<p class="warn">Format warna tidak valid. Pakai hex, cth: #1e3a8a.</p>'); return; }
      const ha = '#' + a.map((n) => n.toString(16).padStart(2, '0')).join('');
      const hb = '#' + b.map((n) => n.toString(16).padStart(2, '0')).join('');
      const L1 = lum(a), L2 = lum(b);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const r = (Math.round(ratio * 100) / 100).toFixed(2);

      pv1.style.background = ha; pv1.style.color = hb;
      pv2.style.background = hb; pv2.style.color = ha;
      pv1.innerHTML = '<div style="font-size:17px;font-weight:700">Teks contoh</div><div style="font-size:12px;opacity:.8">kecil 12px</div>';
      pv2.innerHTML = '<div style="font-size:17px;font-weight:700">Teks contoh</div><div style="font-size:12px;opacity:.8">kecil 12px</div>';

      T.show(box,
        '<div class="big">' + r + ':1</div>' +
        '<div class="kv"><span>AA — teks normal (≥ 4.5:1)</span>' + badge(ratio >= 4.5) + '</div>' +
        '<div class="kv"><span>AA — teks besar (≥ 3:1)</span>' + badge(ratio >= 3) + '</div>' +
        '<div class="kv"><span>AAA — teks normal (≥ 7:1)</span>' + badge(ratio >= 7) + '</div>' +
        '<div class="kv"><span>AAA — teks besar (≥ 4.5:1)</span>' + badge(ratio >= 4.5) + '</div>' +
        '<p class="hint">Standar WCAG 2.1. "Teks besar" = ≥ 18pt (24px) atau ≥ 14pt (18.5px) bold. Untuk teks body biasa, targetkan lolos AA normal.</p>');
    };

    c1.addEventListener('input', () => sync(c1, t1));
    c2.addEventListener('input', () => sync(c2, t2));
    t1.addEventListener('input', () => { if (hex2rgb(t1.value)) { c1.value = t1.value.trim().length === 4 ? '#' + t1.value.trim().slice(1).split('').map((x) => x + x).join('') : t1.value.trim(); } hitung(); });
    t2.addEventListener('input', () => { if (hex2rgb(t2.value)) { c2.value = t2.value.trim().length === 4 ? '#' + t2.value.trim().slice(1).split('').map((x) => x + x).join('') : t2.value.trim(); } hitung(); });

    const swapB = T.btn('⇄ Tukar', () => {
      const a = c1.value, b = t1.value;
      c1.value = c2.value; t1.value = t2.value;
      c2.value = a; t2.value = b;
      hitung();
    });

    // Kolom warna: picker + hex input sejajar
    const colW = (label, picker, hex) => {
      const wrap = T.el('<div></div>');
      const lab = T.el('<label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + T.esc(label) + '</label>');
      const rowEl = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      picker.style.cssText = 'width:52px;height:42px;padding:2px;border:1px solid #ffffff20;border-radius:8px;background:transparent;cursor:pointer;flex-shrink:0';
      hex.style.flex = '1';
      rowEl.appendChild(picker); rowEl.appendChild(hex);
      wrap.appendChild(lab); wrap.appendChild(rowEl);
      return wrap;
    };
    root.appendChild(T.grid2(colW('Warna 1 — teks', c1, t1), colW('Warna 2 — background', c2, t2)));
    root.appendChild(T.row(swapB));
    root.appendChild(prev);
    root.appendChild(box);
    hitung();

}
