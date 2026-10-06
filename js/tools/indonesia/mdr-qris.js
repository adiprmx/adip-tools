import { h as T, kv } from '../../core.js?v=6.9.5';

export const meta = {"id": "mdr-qris", "name": "Kalkulator Biaya QRIS", "cat": "indonesia", "icon": "💳", "desc": "Hitung potongan MDR QRIS per jenis merchant.", "keywords": "qris,mdr,biaya,potongan,merchant", "file": "tools/indonesia/mdr-qris.js"};
export function render(root) {
  const nominal = T.input('number', 'cth: 100000', '');
  const katSel = T.select([
    ['mikro', 'Mikro — 0%'],
    ['kecil', 'Kecil — 0,7%'],
    ['menengah', 'Menengah — 0,7%'],
    ['besar', 'Besar — 0,7%'],
    ['khusus', 'Khusus/SPBU — 0,4%'],
    ['kustom', 'Kustom — isi sendiri']
  ], 'kecil');
  const kustomWrap = T.el('<div></div>');
  const kustomInp = T.input('number', 'cth: 0,5', '');
  kustomWrap.appendChild(T.field('Persen MDR kustom (%)', kustomInp));
  kustomWrap.hidden = true;
  const box = T.out();

  const RATE = { mikro: 0, kecil: 0.7, menengah: 0.7, besar: 0.7, khusus: 0.4 };

  const hitung = () => {
    const n = T.num(nominal.value);
    if (!(n > 0)) { T.hide(box); return; }
    let rate = katSel.value === 'kustom' ? T.num(kustomInp.value) : RATE[katSel.value];
    if (isNaN(rate) || rate < 0) rate = 0;
    const potongan = n * rate / 100;
    const diterima = n - potongan;
    const katLabel = katSel.options[katSel.selectedIndex].textContent;
    T.show(box,
      '<div class="big center" style="font-size:24px">' + T.rp(diterima) + '</div>' +
      '<p class="center mut" style="font-size:13px">Dana diterima merchant</p>' +
      kv('Nominal transaksi', T.rp(n)) +
      kv('Kategori merchant', T.esc(katLabel)) +
      kv('MDR', T.esc(String(rate).replace('.', ',')) + '%') +
      kv('Potongan MDR', '<span class="warn">−' + T.rp(potongan) + '</span>') +
      '<p class="hint">Estimasi/penyederhanaan, bukan ketentuan resmi. Acuan umum MDR QRIS Bank Indonesia — tarif bisa beda per acquirer/penyedia layanan.</p>');
  };

  katSel.addEventListener('change', () => {
    kustomWrap.hidden = katSel.value !== 'kustom';
    hitung();
  });
  kustomInp.addEventListener('input', hitung);

  root.appendChild(T.field('Nominal transaksi (Rp)', nominal));
  root.appendChild(T.field('Kategori merchant', katSel));
  root.appendChild(kustomWrap);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
}
