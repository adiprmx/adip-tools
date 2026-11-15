import { h as T, utils, kv } from '../../core.js?v=6.11.5';

export const meta = {"id": "format-hp", "name": "Format Nomor HP", "cat": "indonesia", "icon": "📱", "desc": "08xx ↔ +62 ↔ 62xx, lengkap dengan operator, format internasional, dan validasi prefix.", "keywords": "hp,nomor,telepon,62,whatsapp,operator,telkomsel,indosat,xl,tri,axis,smartfren"};

/* Prefix 4 digit operator seluler Indonesia (berdasarkan alokasi awal nomor).
   Nomor yang sudah pindah operator (porting) tidak lagi cocok dengan prefix ini. */
export const OPERATOR_PREFIX = {
  Telkomsel: ['0811', '0812', '0813', '0821', '0822', '0852', '0853'],
  Indosat: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  XL: ['0817', '0818', '0819', '0859', '0877', '0878'],
  Tri: ['0895', '0896', '0897', '0898', '0899'],
  Axis: ['0831', '0832', '0833', '0838'],
  Smartfren: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
};

export function normalisasiNomor(s) {
  let d = String(s).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('62')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  if (!/^8\d{7,12}$/.test(d)) return null;
  return d;
}

export function deteksiOperator(d) {
  const prefix = '0' + d.slice(0, 3);
  for (const [nama, list] of Object.entries(OPERATOR_PREFIX)) {
    if (list.includes(prefix)) return { operator: nama, prefix };
  }
  return { operator: null, prefix };
}

/* Kelompokkan digit: 4 digit pertama, lalu kelompok 4 digit. */
export function kelompokkan(nomor0) {
  const kepala = nomor0.slice(0, 4);
  const sisa = nomor0.slice(4);
  const grup = [];
  for (let i = 0; i < sisa.length; i += 4) grup.push(sisa.slice(i, i + 4));
  return [kepala].concat(grup).join('-');
}

export function render(root) {

    const inp = T.input('tel', 'cth: 081944475875 / +62819…');
    inp.inputMode = 'tel';
    const box = T.out();
    const norm = normalisasiNomor;
    const hitung = () => {
      const d = norm(inp.value);
      if (!d) { T.show(box, '<p class="warn">Nomor tidak valid. Contoh: 0812xxxxxxx atau +62812xxxxxxx.</p>'); return; }
      const f0 = '0' + d, f62 = '+62' + d, f62b = '62' + d;
      const wa = 'https://wa.me/' + f62b;
      const op = deteksiOperator(d);
      const opHtml = op.operator
        ? kv('Operator (dari prefix)', '<b>' + op.operator + '</b> · prefix ' + op.prefix)
        : kv('Operator (dari prefix)', 'Prefix ' + op.prefix + ' tidak ada di daftar operator yang dikenal');
      T.show(box,
        kv('Format 08xx', '<b>' + T.esc(f0) + '</b>') +
        kv('Format +62', '<b>' + T.esc(f62) + '</b>') +
        kv('Format 62xx', '<b>' + T.esc(f62b) + '</b>') +
        kv('Format internasional', '<b>' + T.esc('+62 ' + kelompokkan(f0).slice(1)) + '</b>') +
        kv('Panggil dari luar negeri', '<b>' + T.esc('00 62 ' + kelompokkan(f0).slice(1)) + '</b>') +
        kv('Format baca (08xx)', '<b>' + T.esc(kelompokkan(f0)) + '</b>') +
        opHtml +
        '<p class="hint">Operator ditebak dari prefix awal nomor. Nomor yang sudah pindah operator tetap memakai prefix lamanya.</p>');
      box.appendChild(T.row(
        T.copyBtn(() => f62, 'Salin +62'),
        (() => { const a = T.el('<a class="btn primary" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center">Buka wa.me</a>'); a.href = wa; return a; })()
      ));
    };
    inp.addEventListener('input', hitung);
    root.appendChild(T.field('Nomor HP', inp, 'Tempel nomor dalam format apa pun'));
    root.appendChild(box);
  
}
