import { h as T, utils } from '../../core.js?v=6.13.0';

// Logika murni (bisa di-test di Node): target FIRE = pengeluaran setahun x 25,
// lalu simulasi bunga majemuk bulanan sampai target tercapai.
utils.simulasiFire = function (o) {
  const keluarBln = Math.max(0, Number(o.keluarBln) || 0);
  const awal = Math.max(0, Number(o.awal) || 0);
  const setoran = Math.max(0, Number(o.setoran) || 0);
  const r = Math.max(0, Number(o.imbal) || 0) / 100 / 12;
  const target = keluarBln * 12 * 25;
  const MAX = 1200; // 100 tahun
  if (target <= 0) return { target: 0, months: 0, reached: false, totalSetoran: 0, totalHasil: 0, akhir: awal };
  if (awal >= target) return { target, months: 0, reached: true, totalSetoran: 0, totalHasil: 0, akhir: awal };
  if (setoran <= 0 && r <= 0) return { target, months: Infinity, reached: false, totalSetoran: 0, totalHasil: 0, akhir: awal };
  let bal = awal, months = 0, totalHasil = 0;
  while (bal < target && months < MAX) {
    bal += setoran;
    const b = bal * r;
    bal += b; totalHasil += b;
    months++;
  }
  return { target, months, reached: bal >= target, totalSetoran: setoran * months, totalHasil, akhir: bal };
};

export const meta = {"id": "kalkulator-fire", "name": "Kalkulator FIRE", "cat": "bisnis", "icon": "🔥", "desc": "Berapa dana yang perlu disiapkan supaya bisa berhenti kerja?", "keywords": "fire,pensiun dini,dana pensiun,investasi,25x,keuangan", "since": "6.11.0"};

export function render(root) {
  const keluar = T.input('text', 'Contoh: 5000000', '5000000'); keluar.inputMode = 'decimal';
  const awal = T.input('text', 'Contoh: 10000000', '10000000'); awal.inputMode = 'decimal';
  const setoran = T.input('text', 'Contoh: 2000000', '2000000'); setoran.inputMode = 'decimal';
  const imbal = T.input('text', 'Contoh: 8', '8'); imbal.inputMode = 'decimal';
  const usia = T.input('text', 'Contoh: 25', '25'); usia.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const k = T.num(keluar.value);
    if (!(k > 0)) { T.show(box, '<div class="hint">Isi dulu pengeluaran per bulan.</div>'); return; }
    const r = utils.simulasiFire({
      keluarBln: k,
      awal: T.num(awal.value),
      setoran: T.num(setoran.value),
      imbal: T.num(imbal.value)
    });
    if (!isFinite(r.months)) {
      T.show(box, '<div class="hint">Target tidak akan tercapai tanpa setoran bulanan atau imbal hasil. Isi salah satunya.</div>');
      return;
    }
    const thn = Math.floor(r.months / 12), bln = r.months % 12;
    const u = T.num(usia.value);
    const usiaTarget = (u > 0 && r.reached) ? ' (usia sekitar ' + Math.round(u + r.months / 12) + ' tahun)' : '';
    T.show(box,
      `<div class="kv"><span>Dana yang perlu disiapkan</span><b style="color:#fff">${T.rp(r.target)}</b></div>` +
      (r.reached
        ? `<div class="kv"><span>Perkiraan tercapai dalam</span><b>${r.months === 0 ? 'sudah tercapai sekarang' : r.months + ' bulan' + (thn > 0 ? ' (' + thn + ' thn ' + bln + ' bln)' : '') + usiaTarget}</b></div>` +
          `<div class="kv"><span>Total setoran sendiri</span><b>${T.rp(r.totalSetoran)}</b></div>` +
          `<div class="kv"><span>Imbal hasil yang terkumpul</span><b>${T.rp(r.totalHasil)}</b></div>`
        : `<div class="hint">Dengan angka ini, target belum tercapai dalam 100 tahun. Coba naikkan setoran bulanan atau kurangi pengeluaran.</div>`) +
      `<div class="hint">Aturannya sederhana: siapkan 25 kali pengeluaran setahun. Angka itu berasal dari aturan 4 persen, yaitu menarik 4 persen dari dana tiap tahun untuk biaya hidup. Ini perkiraan kasar, bukan nasihat keuangan.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">FIRE artinya menyiapkan dana sampai hasil investasinya cukup untuk biaya hidup, jadi kerja menjadi pilihan, bukan keharusan.</p>'));
  root.appendChild(T.field('Pengeluaran per bulan (Rp)', keluar));
  root.appendChild(T.grid2(
    T.field('Tabungan/investasi sekarang (Rp)', awal),
    T.field('Setoran per bulan (Rp)', setoran)
  ));
  root.appendChild(T.grid2(
    T.field('Imbal hasil (% per tahun)', imbal, 'Perkiraan saja. Deposito sekitar 4-5 persen, reksa dana saham bisa naik turun.'),
    T.field('Usia sekarang (tahun, opsional)', usia)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
