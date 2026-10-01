import { h as T, utils, errBox, esc } from '../../core.js?v=6.5.0';

function chmodToSym(oct) {
    const s = String(oct == null ? '' : oct).trim();
    if (!/^[0-7]{3,4}$/.test(s)) return null;
    const sp = s.length === 4 ? parseInt(s[0], 8) : 0;
    const d = s.slice(-3).split('').map(Number);
    const a = [];
    d.forEach((v) => { a.push(v & 4 ? 'r' : '-', v & 2 ? 'w' : '-', v & 1 ? 'x' : '-'); });
    if (sp & 4) a[2] = a[2] === 'x' ? 's' : 'S';
    if (sp & 2) a[5] = a[5] === 'x' ? 's' : 'S';
    if (sp & 1) a[8] = a[8] === 'x' ? 't' : 'T';
    return a.join('');
  }

export const meta = {"id": "chmod", "name": "Kalkulator Chmod", "cat": "developer", "icon": "🔒", "desc": "Permission oktal ↔ simbolik.", "keywords": "chmod,permission,linux,server"};
export function render(root) {

    const roles = [['u', 'User'], ['g', 'Group'], ['o', 'Other']];
    const perms = [['r', 'baca'], ['w', 'tulis'], ['x', 'eksekusi']];
    const cbs = {};
    const grid = T.el('<div style="display:grid;grid-template-columns:auto 1fr 1fr 1fr;gap:10px;align-items:center;margin-bottom:12px"></div>');
    grid.appendChild(T.el('<div></div>'));
    perms.forEach(([p, lbl]) => grid.appendChild(T.el('<div class="hint" style="text-align:center"><b style="font-size:16px;color:#fafafa">' + p + '</b><br>' + lbl + '</div>')));
    roles.forEach(([r, lbl]) => {
      grid.appendChild(T.el('<div class="hint"><b style="color:#fafafa">' + lbl + '</b></div>'));
      perms.forEach(([p]) => {
        const lab = T.el('<label style="display:flex;justify-content:center"><input type="checkbox" style="width:22px;height:22px;accent-color:#fafafa"></label>');
        const inp = lab.querySelector('input');
        cbs[r + p] = inp;
        inp.addEventListener('change', syncFromCbs);
        grid.appendChild(lab);
      });
    });
    const octInp = T.input('text', 'misal: 755', '755');
    octInp.setAttribute('maxlength', '4');
    octInp.style.fontFamily = 'monospace';
    const resBox = T.out();
    function syncFromCbs() {
      let oct = '';
      roles.forEach(([r]) => {
        let v = 0;
        if (cbs[r + 'r'].checked) v += 4;
        if (cbs[r + 'w'].checked) v += 2;
        if (cbs[r + 'x'].checked) v += 1;
        oct += v;
      });
      octInp.value = oct;
      paint(oct);
    }
    function paint(oct) {
      const sym = chmodToSym(oct);
      if (sym == null) { T.show(resBox, errBox('Oktal tidak valid (3-4 digit 0-7).')); return; }
      const names = ['Pemilik', 'Grup', 'Lainnya'];
      const lines = [0, 1, 2].map((i) => {
        const t = sym.slice(i * 3, i * 3 + 3);
        const acts = [];
        if (t[0] !== '-') acts.push('baca');
        if (t[1] !== '-') acts.push('tulis');
        if (t[2] === 'x' || t[2] === 's' || t[2] === 't') acts.push('eksekusi');
        return names[i] + ': ' + (acts.length ? acts.join(' + ') : 'tidak ada akses');
      });
      T.show(resBox,
        '<div style="display:flex;gap:16px;align-items:baseline;flex-wrap:wrap;margin-bottom:8px">' +
        '<span style="font-size:32px;font-family:monospace;font-weight:700">' + esc(oct) + '</span>' +
        '<span style="font-size:20px;font-family:monospace;color:#a1a1aa">-' + esc(sym) + '</span></div>' +
        '<div class="hint">' + lines.map(esc).join('<br>') + '</div>');
    }
    function syncFromOct() {
      const sym = chmodToSym(octInp.value);
      if (sym == null) { T.show(resBox, errBox('Oktal tidak valid (3-4 digit 0-7).')); return; }
      roles.forEach(([r], i) => {
        cbs[r + 'r'].checked = sym[i * 3] === 'r';
        cbs[r + 'w'].checked = sym[i * 3 + 1] === 'w';
        cbs[r + 'x'].checked = 'xst'.includes(sym[i * 3 + 2]);
      });
      paint(octInp.value.trim());
    }
    octInp.addEventListener('input', syncFromOct);
    root.appendChild(T.el('<div class="hint" style="margin-bottom:8px">Centang izin, atau ketik angka oktal:</div>'));
    root.appendChild(grid);
    root.appendChild(T.field('Oktal', octInp));
    root.appendChild(resBox);
    syncFromOct();
  
}
