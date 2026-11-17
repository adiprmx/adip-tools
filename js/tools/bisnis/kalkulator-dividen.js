import { h as T, utils } from '../../core.js';

// Logika murni (bisa di-test di Node).
utils.hitungDividen = function (o) {
  const lembar = Math.max(0, Number(o.lembar) || 0);
  const dps = Math.max(0, Number(o.dps) || 0);
  const harga = Math.max(0, Number(o.harga) || 0);
  const pajak = o.pajak ? 0.10 : 0;
  const kotor = lembar * dps;
  return {
    kotor,
    pajakRp: kotor * pajak,
    bersih: kotor * (1 - pajak),
    yieldPct: harga > 0 ? (dps / harga) * 100 : null
  };
};

export const meta = {"id": "kalkulator-dividen", "name": "Kalkulator Dividen", "cat": "bisnis", "icon": "💰", "desc": "Berapa dividen yang masuk dari saham yang dimiliki?", "keywords": "dividen,saham,yield,dps,investasi,emiten", "since": "6.11.0"};

export function render(root) {
  const lembar = T.input('text', 'Contoh: 1000', '1000'); lembar.inputMode = 'decimal';
  const dps = T.input('text', 'Contoh: 150', '150'); dps.inputMode = 'decimal';
  const harga = T.input('text', 'Contoh: 2500', ''); harga.inputMode = 'decimal';
  const cekPajak = document.createElement('input');
  cekPajak.type = 'checkbox'; cekPajak.checked = true;
  const labelPajak = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;cursor:pointer"></label>');
  labelPajak.appendChild(cekPajak);
  labelPajak.appendChild(document.createTextNode('Potong pajak 10% (pajak final dividen untuk perorangan)'));
  const box = T.out();

  function calc() {
    const l = T.num(lembar.value), d = T.num(dps.value);
    if (!(l > 0) || !(d > 0)) { T.show(box, '<div class="hint">Isi jumlah lembar saham dan dividen per lembarnya.</div>'); return; }
    const r = utils.hitungDividen({ lembar: l, dps: d, harga: T.num(harga.value), pajak: cekPajak.checked });
    T.show(box,
      `<div class="kv"><span>Dividen kotor</span><b style="color:#fff">${T.rp(r.kotor)}</b></div>` +
      (cekPajak.checked ? `<div class="kv"><span>Pajak 10%</span><b>- ${T.rp(r.pajakRp)}</b></div>` : '') +
      `<div class="kv"><span>Dividen yang diterima</span><b style="color:#fff">${T.rp(r.bersih)}</b></div>` +
      (r.yieldPct !== null
        ? `<div class="kv"><span>Yield (dividen dibanding harga saham)</span><b>${r.yieldPct.toFixed(2)}% per tahun</b></div>`
        : `<div class="hint">Isi harga saham saat ini untuk melihat yield-nya.</div>`) +
      `<div class="hint">1 lot = 100 lembar. Jadi 10 lot sama dengan 1.000 lembar. Dividen per lembar biasanya diumumkan emiten menjelang tanggal cum date. Pajak dividen bisa bebas bila diinvestasikan kembali sesuai aturan, cek ketentuan yang berlaku.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Dividen adalah bagian laba perusahaan yang dibagikan ke pemegang saham. Isi angkanya dari pengumuman emiten.</p>'));
  root.appendChild(T.field('Jumlah lembar saham', lembar, 'Dalam lembar, bukan lot.'));
  root.appendChild(T.field('Dividen per lembar (Rp)', dps));
  root.appendChild(T.field('Harga saham sekarang per lembar (Rp, opsional)', harga));
  root.appendChild(labelPajak);
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
