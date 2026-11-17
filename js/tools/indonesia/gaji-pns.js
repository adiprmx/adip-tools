import { h as T, utils } from '../../core.js';

// Logika murni (bisa di-test di Node).
// Rentang gaji pokok PP 5/2024 (per bulan): [MKG 0, MKG 32].
// Nilai per masa kerja di antaranya mengikuti lampiran PP, jadi tool ini
// menampilkan rentang + memakai gaji pokok yang diisi user (default = MKG 0).
utils.TABEL_GAJI_PNS = {
  'I/a': [1685700, 2522600], 'I/b': [1840800, 2670700], 'I/c': [1918700, 2783700], 'I/d': [1999900, 2901400],
  'II/a': [2184000, 3643400], 'II/b': [2385000, 3797500], 'II/c': [2485900, 3958200], 'II/d': [2591100, 4125600],
  'III/a': [2785700, 4575200], 'III/b': [2903600, 4768800], 'III/c': [3026400, 4970500], 'III/d': [3154400, 5180700],
  'IV/a': [3287800, 5399900], 'IV/b': [3426900, 5628300], 'IV/c': [3571900, 5866400], 'IV/d': [3723000, 6114500], 'IV/e': [3880400, 6373200]
};
utils.gajiPns = function (o) {
  const pokok = Math.max(0, Number(o.pokok) || 0);
  const sesuaikan = Math.max(-100, Number(o.sesuaikan) || 0) / 100;
  const pokokEfektif = pokok * (1 + sesuaikan) * (o.cpns ? 0.8 : 1);
  const tunjIstri = o.menikah ? pokokEfektif * 0.10 : 0;
  const anak = Math.min(2, Math.max(0, Math.floor(Number(o.anak) || 0)));
  const tunjAnak = pokokEfektif * 0.02 * anak;
  const tunjLain = Math.max(0, Number(o.tunjLain) || 0);
  return { pokokEfektif, tunjIstri, tunjAnak, tunjLain, total: pokokEfektif + tunjIstri + tunjAnak + tunjLain };
};

export const meta = {"id": "gaji-pns", "name": "Kalkulator Gaji PNS", "cat": "indonesia", "icon": "🏛️", "desc": "Gaji pokok PNS per golongan plus tunjangan keluarga.", "keywords": "gaji pns,cpns,golongan,pns,tunjangan,pp 5 2024,asn", "since": "6.11.0"};

export function render(root) {
  const golongan = T.select(Object.keys(utils.TABEL_GAJI_PNS).map((g) => [g, 'Golongan ' + g]), 'III/a');
  const pokok = T.input('text', 'Contoh: 2785700', '2785700'); pokok.inputMode = 'decimal';
  const menikah = T.select([['tidak', 'Belum menikah'], ['ya', 'Menikah']], 'tidak');
  const anak = T.input('text', 'Contoh: 0', '0'); anak.inputMode = 'decimal';
  const tunjLain = T.input('text', 'Contoh: 0', '0'); tunjLain.inputMode = 'decimal';
  const sesuaikan = T.input('text', 'Contoh: 0', '0'); sesuaikan.inputMode = 'decimal';
  const cpns = T.select([['tidak', 'PNS (100%)'], ['ya', 'CPNS (80% gaji pokok)']], 'tidak');
  const box = T.out();

  function isiPokokDefault() {
    pokok.value = String(utils.TABEL_GAJI_PNS[golongan.value][0]);
  }
  golongan.addEventListener('change', isiPokokDefault);

  function calc() {
    const t = utils.TABEL_GAJI_PNS[golongan.value];
    const r = utils.gajiPns({
      pokok: T.num(pokok.value), menikah: menikah.value === 'ya',
      anak: T.num(anak.value), tunjLain: T.num(tunjLain.value),
      cpns: cpns.value === 'ya', sesuaikan: T.num(sesuaikan.value)
    });
    if (!(T.num(pokok.value) > 0)) { T.show(box, '<div class="hint">Isi dulu gaji pokoknya.</div>'); return; }
    T.show(box,
      `<div class="kv"><span>Rentang golongan ${golongan.value} (PP 5/2024)</span><b>${T.rp(t[0])} - ${T.rp(t[1])}</b></div>` +
      `<div class="kv"><span>Gaji pokok dipakai</span><b>${T.rp(r.pokokEfektif)}</b></div>` +
      (r.tunjIstri > 0 ? `<div class="kv"><span>Tunjangan istri/suami (10%)</span><b>${T.rp(r.tunjIstri)}</b></div>` : '') +
      (r.tunjAnak > 0 ? `<div class="kv"><span>Tunjangan anak (2% per anak, maks 2 anak)</span><b>${T.rp(r.tunjAnak)}</b></div>` : '') +
      (r.tunjLain > 0 ? `<div class="kv"><span>Tunjangan lain</span><b>${T.rp(r.tunjLain)}</b></div>` : '') +
      `<div class="kv"><span>Perkiraan penghasilan per bulan</span><b style="color:#fff">${T.rp(r.total)}</b></div>` +
      `<div class="hint">Gaji pokok naik setiap 2 tahun masa kerja (kenaikan berkala), dari angka bawah rentang menuju angka atas. Nilai per masa kerja persisnya ada di lampiran PP 5/2024, jadi isi gaji pokokmu sendiri bila sudah tahu angkanya. Tunjangan kinerja (tukin/TPP) dan tunjangan jabatan beda-beda tiap instansi, masukkan ke kolom tunjangan lain. Kolom penyesuaian untuk kenaikan gaji nasional bila ada aturan baru, isi 0 bila tidak ada.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Gaji pokok PNS mengikuti PP 5/2024. Pilih golongan, lalu sesuaikan gaji pokoknya dengan masa kerjamu.</p>'));
  root.appendChild(T.field('Golongan', golongan));
  root.appendChild(T.field('Gaji pokok per bulan (Rp)', pokok, 'Terisi otomatis angka awal golongan (masa kerja 0 tahun). Ubah sesuai slip gajimu.'));
  root.appendChild(T.grid2(
    T.field('Status', cpns),
    T.field('Status keluarga', menikah)
  ));
  root.appendChild(T.grid2(
    T.field('Jumlah anak (maks dihitung 2)', anak),
    T.field('Penyesuaian gaji (%)', sesuaikan, 'Kenaikan nasional bila ada. 0 berarti tidak ada.')
  ));
  root.appendChild(T.field('Tunjangan lain per bulan: tukin, jabatan, beras, dll. (Rp)', tunjLain));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
