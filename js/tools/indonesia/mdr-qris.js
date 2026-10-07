import { h as T, kv } from '../../core.js?v=6.9.5';

export const meta = {"id": "mdr-qris", "name": "Kalkulator Biaya QRIS", "cat": "indonesia", "icon": "💳", "desc": "Hitung potongan MDR QRIS per jenis merchant.", "keywords": "qris,mdr,biaya,potongan,merchant", "file": "tools/indonesia/mdr-qris.js"};
export function render(root) {
  const nominal = T.input('number', 'cth: 100000', '');
  const katSel = T.select([
    ['mikro', 'Mikro (UMI) — 0%/0,3%'],
    ['kecil', 'Kecil (UKE) — 0%/0,7%'],
    ['menengah', 'Menengah (UME) — 0%/0,7%'],
    ['besar', 'Besar (UBE) — 0%/0,7%'],
    ['pendidikan', 'Pendidikan — 0,6%'],
    ['khusus', 'SPBU — 0,4%'],
    ['kustom', 'Kustom — isi sendiri']
  ], 'kecil');
  const kustomWrap = T.el('<div></div>');
  const kustomInp = T.input('number', 'cth: 0,5', '');
  kustomWrap.appendChild(T.field('Persen MDR kustom (%)', kustomInp));
  kustomWrap.hidden = true;
  const box = T.out();

  // Tarif BI efektif 1 Okt 2026. Batas bebas potongan dihitung PER TRANSAKSI.
  // bebas = batas nominal MDR 0% (Rp), rate = tarif reguler di atas batas (%).
  const TIER = {
    mikro:      { bebas: 500000, rate: 0.3 },
    kecil:      { bebas: 100000, rate: 0.7 },
    menengah:   { bebas: 100000, rate: 0.7 },
    besar:      { bebas: 100000, rate: 0.7 },
    pendidikan: { bebas: 0, rate: 0.6 },
    khusus:     { bebas: 0, rate: 0.4 }
  };

  const hitung = () => {
    const n = T.num(nominal.value);
    if (!(n > 0)) { T.hide(box); return; }
    let rate, tierNote;
    if (katSel.value === 'kustom') {
      rate = T.num(kustomInp.value);
      if (isNaN(rate) || rate < 0) rate = 0;
      tierNote = 'tarif kustom';
    } else {
      const t = TIER[katSel.value];
      if (t.bebas > 0 && n <= t.bebas) {
        rate = 0;
        tierNote = 'bebas potongan (≤ ' + T.rp(t.bebas) + ' per transaksi, aturan BI 1 Okt 2026)';
      } else {
        rate = t.rate;
        tierNote = t.bebas > 0 ? 'di atas batas bebas potongan ' + T.rp(t.bebas) : 'tarif tetap';
      }
    }
    const potongan = n * rate / 100;
    const diterima = n - potongan;
    const katLabel = katSel.options[katSel.selectedIndex].textContent;
    T.show(box,
      '<div class="big center" style="font-size:24px">' + T.rp(diterima) + '</div>' +
      '<p class="center mut" style="font-size:13px">Dana diterima merchant</p>' +
      kv('Nominal transaksi', T.rp(n)) +
      kv('Kategori merchant', T.esc(katLabel)) +
      kv('MDR', T.esc(String(rate).replace('.', ',')) + '% — ' + T.esc(tierNote)) +
      kv('Potongan MDR', '<span class="warn">−' + T.rp(potongan) + '</span>') +
      '<p class="hint">Acuan tarif BI efektif 1 Okt 2026: MDR 0% untuk transaksi ≤ Rp100.000 (semua kategori) dan ≤ Rp500.000 (usaha mikro); di atas itu 0,7% (kecil/menengah/besar), 0,3% (mikro), 0,6% (pendidikan), 0,4% (SPBU). Estimasi/penyederhanaan — tarif bisa beda per acquirer/penyedia layanan.</p>');
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
