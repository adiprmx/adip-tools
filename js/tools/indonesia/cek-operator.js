import { h as T, utils, kv } from '../../core.js?v=6.7.0';

export const meta = {"id": "cek-operator", "name": "Cek Operator", "cat": "indonesia", "icon": "📱", "desc": "Masukkan nomor HP, langsung tahu operatornya dari prefix-nya.", "keywords": "operator,telkomsel,indosat,xl,tri,smartfren,prefix,nomor hp,cek operator"};

const OPERATORS = [
  { name: 'Telkomsel', color: '#ef4444', prefixes: ['0811','0812','0813','0821','0822','0823','0852','0853'] },
  { name: 'Indosat', color: '#f59e0b', prefixes: ['0814','0815','0816','0855','0856','0857','0858'] },
  { name: 'XL', color: '#22c55e', prefixes: ['0817','0818','0819','0859','0877','0878'] },
  { name: 'Tri', color: '#a855f7', prefixes: ['0895','0896','0897','0898','0899'] },
  { name: 'Smartfren', color: '#3b82f6', prefixes: ['0881','0882','0883','0884','0885','0886','0887','0888','0889'] },
];

export function render(root) {

    const inp = T.input('tel', 'cth: 0812xxxxxxx / 62812… / +62812…');
    inp.inputMode = 'tel';
    const box = T.out();
    const saveBtn = T.btn('💾 Simpan hasil', () => {
      try {
        const hist = JSON.parse(localStorage.getItem('cek-operator-hist') || '[]');
        const d = norm(inp.value);
        if (!d) return;
        const f62 = '+62' + d;
        const op = detect(d);
        hist.unshift({ no: f62, op: op ? op.name : 'Tidak dikenal', t: Date.now() });
        localStorage.setItem('cek-operator-hist', JSON.stringify(hist.slice(0, 10)));
        T.toast('Hasil disimpan di riwayat HP kamu');
        renderHist();
      } catch (e) { /* abaikan */ }
    });
    const histBox = T.out();

    const norm = (s) => {
      let d = String(s).replace(/\D/g, '');
      if (!d) return null;
      if (d.startsWith('62')) d = d.slice(2);
      else if (d.startsWith('0')) d = d.slice(1);
      if (!/^8\d{7,12}$/.test(d)) return null;
      return d;
    };
    const detect = (d) => {
      const p4 = d.slice(0, 4);
      return OPERATORS.find((o) => o.prefixes.includes(p4)) || null;
    };
    const cek = () => {
      const d = norm(inp.value);
      if (!d) { T.show(box, '<p class="warn">Nomornya kurang lengkap — formatnya kayak 0812xxxxxxx.</p>'); return; }
      const f62 = '+62' + d;
      const op = detect(d);
      if (!op) {
        T.show(box,
          kv('Nomor (ternormalisasi)', '<b>' + T.esc(f62) + '</b>') +
          kv('Operator', '<b>Operator tidak dikenal</b>') +
          '<p class="hint">Prefix ' + T.esc(d.slice(0, 4)) + ' belum terdaftar di tabel kami. Bisa jadi nomor baru atau nomor khusus.</p>' +
          '<div style="margin-top:8px">' + T.copyBtn(() => f62, 'Salin +62') + '</div>');
        return;
      }
      T.show(box,
        kv('Nomor (ternormalisasi)', '<b>' + T.esc(f62) + '</b>') +
        kv('Operator', '<b style="color:' + op.color + '">' + T.esc(op.name) + '</b>') +
        kv('Prefix', T.esc(d.slice(0, 4))) +
        '<div style="margin-top:8px">' + T.row(T.copyBtn(() => f62, 'Salin +62'), saveBtn) + '</div>');
    };
    inp.addEventListener('input', cek);

    const renderHist = () => {
      let hist = [];
      try { hist = JSON.parse(localStorage.getItem('cek-operator-hist') || '[]'); } catch (e) { /* abaikan */ }
      if (!hist.length) { T.hide(histBox); return; }
      T.show(histBox,
        '<p class="note" style="margin-top:12px"><b>Riwayat di HP ini</b></p>' +
        hist.map((x) => '<div class="kv"><span class="k">' + T.esc(x.no) + '</span><span class="v">' + T.esc(x.op) + '</span></div>').join(''));
    };

    root.appendChild(T.el('<p class="note">Ngetik nomor, langsung kelihatan dia Telkomsel, Indosat, XL, Tri, atau Smartfren — dari prefix-nya.</p>'));
    root.appendChild(T.field('Nomor HP', inp, 'Bisa 08xx, 62xx, atau +62xx'));
    root.appendChild(box);
    root.appendChild(histBox);
    renderHist();

}
