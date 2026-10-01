import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "kalkulator-gadai", "name": "Kalkulator Gadai", "cat": "indonesia", "icon": "🏦", "desc": "Simulasi gadai: taksiran barang → plafon pinjaman, sewa modal, total tebus.", "keywords": "gadai,pinjaman,pegadaian,sewa modal,tebus,taksiran,plafon"};
export function render(root) {
  let loanPct = 90, rentPct = 1.1;
  try {
    const l = parseFloat(localStorage.getItem('kalkulator-gadai-loan'));
    if (l > 0 && l <= 100) loanPct = l;
    const s = parseFloat(localStorage.getItem('kalkulator-gadai-rent'));
    if (s >= 0 && s <= 100) rentPct = s;
  } catch (e) { /* abaikan */ }

  const taksI = T.input('text', 'cth: 2000000'); taksI.inputMode = 'decimal';
  const tenorSel = T.select([['15', '15 hari'], ['30', '30 hari'], ['60', '60 hari'], ['90', '90 hari']], '30');
  const loanPctI = T.input('text', 'cth: 90', String(loanPct)); loanPctI.inputMode = 'decimal';
  const rentPctI = T.input('text', 'cth: 1.1', String(rentPct)); rentPctI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const taks = T.num(taksI.value) || 0;
    if (taks <= 0) { T.hide(box); return; }
    const lp = T.num(loanPctI.value), sr = T.num(rentPctI.value);
    if (!(lp > 0 && lp <= 100) || !(sr >= 0 && sr <= 100)) {
      T.show(box, '<p class="warn">Plafon harus 1–100% dan sewa modal harus 0–100%.</p>');
      return;
    }
    try {
      localStorage.setItem('kalkulator-gadai-loan', String(lp));
      localStorage.setItem('kalkulator-gadai-rent', String(sr));
    } catch (e) { /* abaikan */ }
    const tenor = Number(tenorSel.value);
    const pinjaman = taks * lp / 100;
    const periode = Math.ceil(tenor / 15);
    const sewaPerPeriode = pinjaman * sr / 100;
    const totalSewa = sewaPerPeriode * periode;
    const tebus = pinjaman + totalSewa;
    T.show(box,
      '<div class="kv"><span class="k">Taksiran barang</span><span class="v">' + T.rp(taks) + '</span></div>' +
      '<div class="kv"><span class="k">Plafon pinjaman (' + T.esc(String(lp)) + '%)</span><span class="v">' + T.rp(pinjaman) + '</span></div>' +
      '<div class="kv"><span class="k">Sewa modal / 15 hari (' + T.esc(String(sr)) + '%)</span><span class="v">' + T.rp(sewaPerPeriode) + '</span></div>' +
      '<div class="kv"><span class="k">Tenor</span><span class="v">' + tenor + ' hari (' + periode + ' × 15 hari)</span></div>' +
      '<div class="kv"><span class="k">Total sewa modal</span><span class="v">' + T.rp(totalSewa) + '</span></div>' +
      '<div class="kv total"><span class="k"><b>Total tebus</b></span><span class="v"><b>' + T.rp(tebus) + '</b></span></div>' +
      '<div class="big center" style="margin-top:10px">' + T.rp(pinjaman) + ' <span class="mut" style="font-size:14px">cair</span> → ' + T.rp(tebus) + ' <span class="mut" style="font-size:14px">tebus</span></div>');
  };
  [taksI, loanPctI, rentPctI].forEach((i) => i.addEventListener('input', hitung));
  tenorSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Mau gadai barang? Masukkan nilai taksirannya, atur plafon & sewa modal, langsung kelihatan berapa yang cair dan berapa total tebusnya.</p>'));
  root.appendChild(T.field('Nilai taksiran barang (Rp)', taksI));
  root.appendChild(T.field('Tenor gadai', tenorSel));
  root.appendChild(T.grid2(
    T.field('Plafon pinjaman (% dari taksiran)', loanPctI, 'Umumnya 80–95%, tersimpan otomatis'),
    T.field('Sewa modal per 15 hari (%)', rentPctI, 'Tersimpan otomatis')
  ));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Angka di atas ilustrasi untuk bahan pertimbangan, bukan penawaran resmi. Plafon & sewa modal tiap pegadaian bisa beda — cek langsung ke tempat gadainya sebelum deal.</p>'));
}
