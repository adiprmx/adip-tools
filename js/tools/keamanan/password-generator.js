import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id": "password-generator", "name": "Password Generator", "cat": "keamanan", "icon": "🔑", "desc": "Buat password kuat yang susah ditebak.", "keywords": "password,sandi,aman,kuat,acak"};
export function render(root) {

    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const lenRange = T.el('<input type="range" min="8" max="64" value="16" class="inp" style="padding:0">');
    const lenNum = T.input('number', 'Panjang', 16);
    lenNum.min = 8; lenNum.max = 64; lenNum.style.maxWidth = '90px';
    const cUp = mkChk('Huruf besar (A-Z)', true);
    const cLow = mkChk('Huruf kecil (a-z)', true);
    const cNum = mkChk('Angka (0-9)', true);
    const cSym = mkChk('Simbol (!@#$%…)', true);
    const cAmb = mkChk('Hindari karakter ambigu (l, 1, I, 0, O)', false);
    const out = T.out();
    let last = '';

    const syncLen = (fromRange) => {
      const v = Math.max(8, Math.min(64, parseInt(fromRange ? lenRange.value : lenNum.value, 10) || 16));
      lenRange.value = v; lenNum.value = v;
    };
    lenRange.addEventListener('input', () => syncLen(true));
    lenNum.addEventListener('input', () => syncLen(false));

    const pools = {
      up: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      low: 'abcdefghijklmnopqrstuvwxyz',
      num: '0123456789',
      sym: '!@#$%^&*()-_=+[]{};:,.<>?/',
    };
    const pick = (pool) => {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      return pool[r[0] % pool.length];
    };
    const gen = () => {
      const len = Math.max(8, Math.min(64, parseInt(lenNum.value, 10) || 16));
      const active = [];
      if (cUp.box.checked) active.push(pools.up);
      if (cLow.box.checked) active.push(pools.low);
      if (cNum.box.checked) active.push(pools.num);
      if (cSym.box.checked) active.push(pools.sym);
      if (!active.length) { T.show(out, '<span class="err">Pilih minimal satu jenis karakter dulu.</span>'); return; }
      let pool = active.join('');
      if (cAmb.box.checked) pool = pool.replace(/[l1I0O]/g, '');
      const chars = active.map((p) => pick(cAmb.box.checked ? p.replace(/[l1I0O]/g, '') : p));
      while (chars.length < len) chars.push(pick(pool));
      const r = new Uint32Array(chars.length);
      crypto.getRandomValues(r);
      for (let i = chars.length - 1; i > 0; i--) {
        const j = r[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      last = chars.join('');
      const ent = Math.round(len * Math.log2(pool.length));
      const lvl = ent < 50 ? ['Lemah', 'err'] : ent < 70 ? ['Sedang', 'warn'] : ent < 90 ? ['Kuat', 'ok'] : ['Sangat kuat', 'ok'];
      T.show(out,
        '<div class="kv"><span class="k">Password</span><span class="v" class="monoall">' + T.esc(last) + '</span></div>' +
        '<div class="kv"><span class="k">Kekuatan (entropi)</span><span class="v ' + lvl[1] + '">' + lvl[0] + ' · ~' + ent + ' bit</span></div>' +
        '<div class="hint">Dibuat dengan angka acak kriptografis (crypto.getRandomValues).</div>');
    };
    root.appendChild(T.field('Panjang password', T.row(lenRange, lenNum)));
    [cUp, cLow, cNum, cSym, cAmb].forEach((c) => root.appendChild(c.el));
    const bGen = T.btn('Buat Password', gen, true);
    const bCopy = T.btn('Salin', () => { if (last) T.copy(last); else T.toast('Buat password dulu'); });
    root.appendChild(T.row(bGen, bCopy));
    root.appendChild(out);
    gen();
  
}
