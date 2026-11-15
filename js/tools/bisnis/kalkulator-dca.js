import { h as T, utils } from '../../core.js?v=6.12.0';

// Logika murni (bisa di-test di Node): tiap pembelian = investasi / harga saat itu.
utils.hitungDCA = function (o) {
  const investasi = Math.max(0, Number(o.investasi) || 0);
  const hargaList = (o.hargaList || []).map(Number).filter((x) => x > 0);
  const hargaKini = Math.max(0, Number(o.hargaKini) || 0);
  if (investasi <= 0 || hargaList.length === 0) return null;
  const rincian = hargaList.map((h) => ({ harga: h, unit: investasi / h }));
  const unit = rincian.reduce((a, b) => a + b.unit, 0);
  const modal = investasi * hargaList.length;
  const rataHarga = unit > 0 ? modal / unit : 0;
  const nilaiKini = unit * hargaKini;
  return { rincian, unit, modal, rataHarga, nilaiKini, untung: nilaiKini - modal, persen: modal > 0 ? ((nilaiKini - modal) / modal) * 100 : 0 };
};

export const meta = {"id": "kalkulator-dca", "name": "Kalkulator DCA", "cat": "bisnis", "icon": "📈", "desc": "Rata-rata harga beli dari investasi rutin tiap bulan.", "keywords": "dca,dollar cost averaging,saham,kripto,investasi rutin,average down", "since": "6.11.0"};

export function render(root) {
  const investasi = T.input('text', 'Contoh: 500000', '500000'); investasi.inputMode = 'decimal';
  const hargaKini = T.input('text', 'Contoh: 2500', ''); hargaKini.inputMode = 'decimal';
  const daftar = T.ta(5, 'Satu harga per baris. Contoh:\n2000\n2200\n1900\n2500', '');
  const box = T.out();

  function calc() {
    const hargaList = daftar.value.split(/\r?\n/).map((s) => T.num(s)).filter((x) => x > 0);
    const r = utils.hitungDCA({ investasi: T.num(investasi.value), hargaList, hargaKini: T.num(hargaKini.value) });
    if (!r) { T.show(box, '<div class="hint">Isi jumlah investasi per pembelian dan daftar harga belinya (satu harga per baris).</div>'); return; }
    let rows = '';
    r.rincian.forEach((d, i) => {
      rows += `<tr><td style="padding:6px 8px;border-bottom:1px solid #2a2a2a">Beli ke-${i + 1}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.rp(d.harga)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.fmt(d.unit)}</td></tr>`;
    });
    T.show(box,
      `<div class="kv"><span>Total unit terkumpul</span><b style="color:#fff">${T.fmt(r.unit)}</b></div>` +
      `<div class="kv"><span>Total modal</span><b>${T.rp(r.modal)}</b></div>` +
      `<div class="kv"><span>Rata-rata harga beli</span><b>${T.rp(r.rataHarga)}</b></div>` +
      (T.num(hargaKini.value) > 0
        ? `<div class="kv"><span>Nilai sekarang</span><b>${T.rp(r.nilaiKini)}</b></div>` +
          `<div class="kv"><span>Untung / rugi</span><b style="color:${r.untung >= 0 ? '#4ade80' : '#ef4444'}">${T.rp(r.untung)} (${r.persen.toFixed(1)}%)</b></div>`
        : `<div class="hint">Isi harga sekarang untuk melihat nilai investasimu hari ini.</div>`) +
      `<b>Rincian tiap pembelian</b>` +
      `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">` +
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999">Pembelian</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999;text-align:right">Harga beli</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999;text-align:right">Unit dapat</td></tr>` +
      rows + `</table>` +
      `<div class="hint">DCA artinya membeli rutin dengan jumlah uang yang sama, apa pun harganya. Saat harga turun, uang yang sama dapat unit lebih banyak. Biaya broker belum dihitung di sini.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">DCA (beli rutin tiap bulan) membuat harga belimu merata dari waktu ke waktu, tanpa perlu menebak harga terendah.</p>'));
  root.appendChild(T.field('Investasi tiap pembelian (Rp)', investasi));
  root.appendChild(T.field('Daftar harga beli (satu harga per baris)', daftar));
  root.appendChild(T.field('Harga sekarang per unit (Rp, opsional)', hargaKini));
  root.appendChild(T.row(
    T.btn('Hitung', calc, true),
    T.btn('Isi contoh', () => { daftar.value = '2000\n2200\n1900\n2500\n2300\n2600'; hargaKini.value = '2400'; calc(); })
  ));
  root.appendChild(box);
}
