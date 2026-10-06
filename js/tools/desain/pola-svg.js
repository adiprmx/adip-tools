import { h as T, utils, esc, preHtml } from '../../core.js?v=6.9.5';

export const meta = {"id": "pola-svg", "name": "Pola SVG Generator", "cat": "desain", "icon": "🔲", "desc": "Bikin pola SVG (dots, stripes, grid, zigzag) + kode siap pakai.", "keywords": "pola,pattern,svg,background,dots,stripes,grid,zigzag"};
export function render(root) {

    const patSel = T.select([['dots', 'Dots (titik-titik)'], ['stripes', 'Stripes (garis diagonal)'], ['grid', 'Grid (kotak-kotak)'], ['zigzag', 'Zigzag']], 'dots');
    const fg = T.el('<input type="color" value="#a1a1aa" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
    const bg = T.el('<input type="color" value="#000000" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
    const size = T.el('<input type="range" min="8" max="80" value="24" class="inp">');
    const sizeLbl = T.el('<span class="hint">24px</span>');
    const thick = T.el('<input type="range" min="1" max="16" value="3" class="inp">');
    const thickLbl = T.el('<span class="hint">3px</span>');
    const preview = T.el('<div style="height:200px;border-radius:12px;border:1px solid #27272a;margin:12px 0"></div>');
    const cssBox = T.out();
    const svgBox = T.out();

    const svgFor = () => {
      const s = +size.value, t = +thick.value, f = fg.value, b = bg.value;
      const open = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '">';
      const rect = '<rect width="' + s + '" height="' + s + '" fill="' + b + '"/>';
      let body = '';
      if (patSel.value === 'dots') body = '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + t + '" fill="' + f + '"/>';
      else if (patSel.value === 'stripes') body = '<path d="M-' + t + ' ' + (s + t) + ' L' + t + ' ' + (-t) + ' M0 ' + s + ' L' + s + ' 0 M' + (s - t) + ' ' + (s + t) + ' L' + (s + t) + ' ' + (s - t) + '" stroke="' + f + '" stroke-width="' + t + '"/>';
      else if (patSel.value === 'grid') body = '<path d="M' + s + ' 0 H0 V' + s + '" fill="none" stroke="' + f + '" stroke-width="' + t + '"/>';
      else body = '<path d="M0 ' + (s * 0.75) + ' l' + s / 4 + ' ' + (-s / 2) + ' l' + s / 4 + ' ' + (s / 2) + ' l' + s / 4 + ' ' + (-s / 2) + ' l' + s / 4 + ' ' + (s / 2) + '" fill="none" stroke="' + f + '" stroke-width="' + t + '"/>';
      return open + rect + body + '</svg>';
    };
    const cssFor = () => {
      const enc = encodeURIComponent(svgFor()).replace(/'/g, '%27').replace(/"/g, '%22');
      return 'background-color: ' + bg.value + ';\nbackground-image: url("data:image/svg+xml,' + enc + '");';
    };
    const dataUri = () => 'url("data:image/svg+xml,' + encodeURIComponent(svgFor()).replace(/'/g, '%27').replace(/"/g, '%22') + '")';
    const paint = () => {
      preview.style.backgroundColor = bg.value;
      preview.style.backgroundImage = dataUri();
      T.show(cssBox, preHtml(cssFor()));
      T.show(svgBox, preHtml(svgFor()));
    };
    size.addEventListener('input', () => { sizeLbl.textContent = size.value + 'px'; paint(); });
    thick.addEventListener('input', () => { thickLbl.textContent = thick.value + 'px'; paint(); });
    patSel.addEventListener('change', paint);
    fg.addEventListener('input', paint);
    bg.addEventListener('input', paint);

    const sizeRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    sizeRow.appendChild(size); sizeRow.appendChild(sizeLbl);
    const thickRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    thickRow.appendChild(thick); thickRow.appendChild(thickLbl);
    const colorRow = T.el('<div style="display:flex;gap:6px;align-items:center"></div>');
    colorRow.appendChild(T.el('<span class="hint">Pola</span>'));
    colorRow.appendChild(fg);
    colorRow.appendChild(T.el('<span class="hint" style="margin-left:6px">Latar</span>'));
    colorRow.appendChild(bg);
    root.appendChild(T.grid2(
      T.field('Jenis pola', patSel),
      T.field('Ukuran tile', sizeRow)
    ));
    root.appendChild(T.grid2(
      T.field('Ketebalan', thickRow),
      T.field('Warna', colorRow)
    ));
    root.appendChild(preview);
    root.appendChild(T.el('<div class="hint" style="margin:8px 0 4px">Kode CSS:</div>'));
    root.appendChild(cssBox);
    root.appendChild(T.el('<div class="hint" style="margin:8px 0 4px">Kode SVG mentah:</div>'));
    root.appendChild(svgBox);
    root.appendChild(T.row(T.copyBtn(() => cssFor(), 'Salin CSS'), T.copyBtn(() => svgFor(), 'Salin SVG')));
    paint();

}
