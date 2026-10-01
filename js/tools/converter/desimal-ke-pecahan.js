import { h as T, utils } from '../../core.js?v=6.7.0';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM. */
export function fpb(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

export function desimalKePecahan(d) {
  if (!isFinite(d)) return null;
  const neg = d < 0;
  d = Math.abs(d);
  if (Number.isInteger(d)) return { pembilang: neg ? -d : d, penyebut: 1, langkah: [] };
  const s = String(d);
  const koma = s.indexOf('.');
  const digit = koma === -1 ? 0 : Math.min(s.length - koma - 1, 10);
  const pen = Math.pow(10, digit);
  let pem = Math.round(d * pen);
  const langkah = [];
  langkah.push(d + ' = ' + pem + '/' + pen);
  const f = fpb(pem, pen);
  if (f > 1) {
    langkah.push('FPB(' + pem + ', ' + pen + ') = ' + f);
    langkah.push(pem + ' ÷ ' + f + ' = ' + (pem / f) + '   |   ' + pen + ' ÷ ' + f + ' = ' + (pen / f));
  } else {
    langkah.push('Sudah paling sederhana (FPB = 1).');
  }
  pem = pem / f;
  const p2 = pen / f;
  return { pembilang: neg ? -pem : pem, penyebut: p2, langkah };
}

export function pecahanKeDesimal(pem, pen) {
  if (!pen) return null;
  const des = pem / pen;
  return { desimal: des, persen: des * 100 };
}

export const meta = {"id": "desimal-ke-pecahan", "name": "Desimal ke Pecahan", "cat": "converter", "icon": "➗", "desc": "Desimal jadi pecahan tersederhana + langkahnya.", "keywords": "desimal,pecahan,fraksi,fpb,persen"};

export function render(root) {

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Dua arah: desimal jadi pecahan tersederhana (lengkap sama langkah FPB-nya), atau pecahan jadi desimal + persen.</p>'));

    // ---- Desimal → Pecahan ----
    const inDes = T.input('text', 'Contoh: 0,75 atau 2.5');
    inDes.inputMode = 'decimal';
    const outA = T.out();
    const hitungA = () => {
      const d = T.num(inDes.value);
      if (!isFinite(d)) { T.show(outA, '<span class="err">Masukin angka desimal yang bener dulu.</span>'); return; }
      const r = desimalKePecahan(d);
      const campur = Math.abs(r.pembilang) > r.penyebut && r.penyebut !== 1
        ? '<div class="kv"><span class="k">Campuran</span><span class="v">' + Math.trunc(r.pembilang / r.penyebut) + ' ' + Math.abs(r.pembilang % r.penyebut) + '/' + r.penyebut + '</span></div>' : '';
      T.show(outA, '');
      outA.appendChild(T.el(
        '<div class="kv"><span class="k">Pecahan</span><span class="v" style="font-size:18px"><b>' + r.pembilang + '/' + r.penyebut + '</b></span></div>' + campur +
        '<div class="dim" style="font-size:12.5px;margin-top:8px;line-height:1.7">' +
        r.langkah.map((l) => '• ' + T.esc(l)).join('<br>') + '</div>'
      ));
      outA.appendChild(T.row(T.copyBtn(() => r.pembilang + '/' + r.penyebut, 'Salin Pecahan')));
    };
    inDes.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitungA(); });
    root.appendChild(T.el('<h3 class="h3">🔢 Desimal → Pecahan</h3>'));
    root.appendChild(T.field('Angka desimal', inDes, 'Bisa pakai koma (0,75) atau titik (0.75).'));
    root.appendChild(T.row(T.btn('Ubah ke Pecahan', hitungA, true)));
    root.appendChild(outA);

    // ---- Pecahan → Desimal ----
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">🔄 Pecahan → Desimal</h3>'));
    const inPem = T.input('text', 'Pembilang, mis. 3');
    const inPen = T.input('text', 'Penyebut, mis. 4');
    inPem.inputMode = 'numeric'; inPen.inputMode = 'numeric';
    const outB = T.out();
    const hitungB = () => {
      const pem = T.num(inPem.value), pen = T.num(inPen.value);
      if (!isFinite(pem) || !isFinite(pen)) { T.show(outB, '<span class="err">Isi pembilang & penyebut dengan angka.</span>'); return; }
      const r = pecahanKeDesimal(pem, pen);
      if (!r) { T.show(outB, '<span class="err">Penyebut nggak boleh nol — pembagian dengan nol itu dilarang keras 😄</span>'); return; }
      const desStr = String(Math.round(r.desimal * 1e10) / 1e10).replace('.', ',');
      const perStr = String(Math.round(r.persen * 1e8) / 1e8).replace('.', ',');
      T.show(outB, '');
      outB.appendChild(T.el(
        '<div class="kv"><span class="k">Desimal</span><span class="v" style="font-size:18px"><b>' + T.esc(desStr) + '</b></span></div>' +
        '<div class="kv"><span class="k">Persen</span><span class="v"><b>' + T.esc(perStr) + ' %</b></span></div>'
      ));
      outB.appendChild(T.row(T.copyBtn(() => desStr, 'Salin Desimal')));
    };
    [inPem, inPen].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitungB(); }));
    root.appendChild(T.grid2(T.field('Pembilang', inPem), T.field('Penyebut', inPen)));
    root.appendChild(T.row(T.btn('Ubah ke Desimal', hitungB, true)));
    root.appendChild(outB);
}
