import { h as T, errBox } from '../../core.js';

// Bersihkan nomor: buang spasi dan tanda hubung. Kembalikan null bila
// bukan angka semua.
export function cleanNumber(s) {
  const d = String(s == null ? '' : s).replace(/[\s-]/g, '');
  return /^\d+$/.test(d) ? d : null;
}

// Langkah Luhn dari kanan: tiap digit kedua digandakan, bila hasil
// gandanya 10 ke atas, kurangi 9. Kembalikan { steps, total }.
export function luhnSteps(num) {
  const d = cleanNumber(num);
  if (d === null) return null;
  const steps = [];
  let total = 0;
  for (let i = d.length - 1, pos = 0; i >= 0; i--, pos++) {
    const digit = +d[i];
    let value = digit;
    let doubled = false;
    if (pos % 2 === 1) {
      value = digit * 2;
      if (value > 9) value -= 9;
      doubled = true;
    }
    total += value;
    steps.push({ digit, doubled, value, posisiDariKanan: pos + 1 });
  }
  steps.reverse();
  return { steps, total };
}

export function luhnValid(num) {
  const d = cleanNumber(num);
  if (d === null || d.length < 2) return false;
  const r = luhnSteps(d);
  return r.total % 10 === 0;
}

// Cari digit cek (0-9) supaya nomor + digit itu lolos Luhn.
export function luhnCheckDigit(partial) {
  const d = cleanNumber(partial);
  if (d === null || d.length < 1) return null;
  for (let c = 0; c <= 9; c++) if (luhnValid(d + c)) return c;
  return null;
}

export const meta = {"id": "kalkulator-luhn", "name": "Kalkulator Luhn", "cat": "developer", "icon": "💳", "desc": "Cek nomor kartu atau cari digit ceknya dengan algoritma Luhn.", "keywords": "luhn,kartu,check digit,validasi,nomor,algoritma", "since": "6.18.0"};
export function render(root) {

    const cekInp = T.input('text', 'cth: 4532 0151 1283 0366', '');
    cekInp.inputMode = 'numeric';
    const box = T.out();
    const partialInp = T.input('text', 'cth: 4532 0151 1283 036', '');
    partialInp.inputMode = 'numeric';
    const box2 = T.out();

    const cek = () => {
      const d = cleanNumber(cekInp.value);
      if (d === null || d.length < 2) { T.show(box, errBox('Tulis nomornya dulu, angka saja (spasi dan tanda hubung boleh).')); return; }
      const r = luhnSteps(d);
      const ok = r.total % 10 === 0;
      let html = '<div style="font-size:16px;margin-bottom:8px">' + (ok
        ? '<span class="ok">✓ Nomor ini LOLOS cek Luhn.</span>'
        : '<span class="err">✗ Nomor ini TIDAK LOLOS cek Luhn.</span>') + '</div>' +
        '<div class="kv"><span class="k">Jumlah digit</span><span class="v">' + d.length + '</span></div>' +
        '<div class="kv"><span class="k">Total hitungan</span><span class="v">' + r.total + (ok ? ' (habis dibagi 10)' : ' (tidak habis dibagi 10)') + '</span></div>';
      html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:10px"><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ffffff20">Digit</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ffffff20">Digandakan?</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ffffff20">Nilai</th></tr>' +
        r.steps.map((s) => '<tr><td style="padding:5px 8px;border-bottom:1px solid #ffffff10;font-family:ui-monospace,monospace">' + s.digit + '</td><td style="padding:5px 8px;border-bottom:1px solid #ffffff10">' + (s.doubled ? 'Ya' : 'Tidak') + '</td><td style="padding:5px 8px;border-bottom:1px solid #ffffff10;text-align:right;font-family:ui-monospace,monospace">' + s.value + '</td></tr>').join('') +
        '</table>';
      T.show(box, html);
    };

    const cari = () => {
      const d = cleanNumber(partialInp.value);
      if (d === null || d.length < 1) { T.show(box2, errBox('Tulis nomor tanpa digit terakhirnya dulu.')); return; }
      const c = luhnCheckDigit(d);
      if (c === null) { T.show(box2, errBox('Digit cek tidak ketemu.')); return; }
      T.show(box2,
        '<div class="kv"><span class="k">Digit cek</span><span class="v big">' + c + '</span></div>' +
        '<div class="kv"><span class="k">Nomor lengkap</span><span class="v" style="font-family:ui-monospace,monospace;word-break:break-all">' + T.esc(d + c) + '</span></div>');
    };

    root.appendChild(T.el('<h3 class="h3">Cek nomor</h3>'));
    root.appendChild(T.field('Nomor yang mau dicek', cekInp));
    root.appendChild(T.row(T.btn('Cek', cek, true)));
    root.appendChild(box);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">Cari digit cek</h3>'));
    root.appendChild(T.field('Nomor tanpa digit terakhir', partialInp));
    root.appendChild(T.row(T.btn('Cari digit cek', cari, true)));
    root.appendChild(box2);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Luhn hanya memeriksa format angkanya, untuk menangkap salah ketik. Nomor yang lolos belum tentu kartu asli, aktif, atau punya saldo. Jangan tempel nomor kartu asli yang masih dipakai.</div>'));

}
