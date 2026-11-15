import { h as T, utils, money, kv } from '../../core.js?v=6.12.0';

// PBB Perdesaan dan Perkotaan (PBB-P2), UU 1/2022 Pasal 40-42:
// PBB = (NJOP - NJOPTKP) x persentase NJOP x tarif.
// NJOPTKP paling sedikit Rp10 juta per wajib pajak; persentase NJOP 20-100%;
// tarif paling tinggi 0,5%, ditetapkan Perda kabupaten/kota.
utils.pbb = function (o) {
  const tanah = Math.max(0, Number(o.njopTanah) || 0);
  const bangunan = Math.max(0, Number(o.njopBangunan) || 0);
  const njoptkp = Math.max(0, Number(o.njoptkp) || 0);
  const persen = Math.max(0, Math.min(100, Number(o.persen) || 0));
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const total = tanah + bangunan;
  const kenaPajak = Math.max(0, total - njoptkp);
  const dasar = kenaPajak * persen / 100;
  const pbb = dasar * tarif / 100;
  return { total, kenaPajak, dasar, pbb, perBulan: pbb / 12 };
};

export const meta = {"id": "pbb", "name": "Kalkulator PBB", "cat": "indonesia", "icon": "🏡", "desc": "Hitung PBB tahunan dari NJOP tanah dan bangunan.", "keywords": "pbb,pajak bumi bangunan,njop,njoptkp,sppt,bapenda,tarif", "since": "6.11.0"};
export function render(root) {
  const tanahI = money(null, 'cth: 300000000');
  const bangunanI = money(null, 'cth: 200000000');
  const njoptkpI = money(null, 'cth: 10000000', '10000000');
  const persenI = T.input('text', 'cth: 100', '100'); persenI.inputMode = 'decimal';
  const tarifI = T.input('text', 'cth: 0,5', '0,5'); tarifI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const tanah = T.num(tanahI.value) || 0;
    const bangunan = T.num(bangunanI.value) || 0;
    if (!((tanah > 0) || (bangunan > 0))) { T.hide(box); return; }
    const persen = T.num(persenI.value);
    const tarif = T.num(tarifI.value);
    if (!(persen >= 0 && persen <= 100)) { T.show(box, '<p class="warn">Persentase NJOP harus 0-100%.</p>'); return; }
    if (!(tarif >= 0)) { T.show(box, '<p class="warn">Tarif harus 0% atau lebih.</p>'); return; }
    const r = utils.pbb({
      njopTanah: tanah, njopBangunan: bangunan,
      njoptkp: T.num(njoptkpI.value), persen, tarif,
    });
    const peringatan = (tarif > 0.5 ? '<p class="warn">Tarif di atas 0,5% melebihi batas tertinggi UU 1/2022. Periksa lagi tarif Perda daerahmu.</p>' : '') +
      (persen < 20 ? '<p class="warn">Persentase NJOP di bawah 20% berada di luar rentang 20-100% yang diatur UU 1/2022.</p>' : '');
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.pbb)) + '<span style="font-size:13px;font-weight:400"> / tahun</span></div>' +
      '<p class="center mut">Sekitar ' + T.rp(Math.round(r.perBulan)) + ' per bulan.</p>' +
      kv('NJOP tanah + bangunan', T.rp(r.total)) +
      kv('Dikurangi NJOPTKP', '− ' + T.rp(T.num(njoptkpI.value) || 0)) +
      kv('NJOP kena pajak', T.rp(r.kenaPajak)) +
      kv('Dasar pengenaan (' + T.esc(String(persen)) + '% dari NJOP kena pajak)', T.rp(Math.round(r.dasar))) +
      kv('Tarif PBB', T.esc(String(tarif)) + '%') +
      peringatan +
      '<p class="hint">Rumus UU 1/2022 Pasal 42: PBB = (NJOP - NJOPTKP) x persentase NJOP x tarif. NJOPTKP paling sedikit Rp10 juta per wajib pajak (Pasal 40), persentase NJOP 20-100%, tarif paling tinggi 0,5% dan ditetapkan Perda tiap kabupaten/kota. Bila punya lebih dari satu objek di satu kabupaten/kota, NJOPTKP hanya berlaku untuk satu objek. Angka resmi ikut SPPT dari Bapenda setempat, kalkulator ini hanya estimasi.</p>');
  };
  [tanahI, bangunanI, njoptkpI, persenI, tarifI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">PBB rumah dihitung dari NJOP tanah dan bangunan setelah dikurangi batas tidak kena pajak. Angka NJOP-nya ada di SPPT tahun lalu.</p>'));
  root.appendChild(T.grid2(
    T.field('NJOP tanah (Rp)', tanahI),
    T.field('NJOP bangunan (Rp)', bangunanI)
  ));
  root.appendChild(T.grid2(
    T.field('NJOPTKP (Rp)', njoptkpI, 'Paling sedikit Rp10 juta, cek SPPT daerahmu'),
    T.field('Persentase NJOP (%)', persenI, 'Rentang UU: 20-100%, ditetapkan Perda')
  ));
  root.appendChild(T.field('Tarif PBB (%)', tarifI, 'Paling tinggi 0,5%, ditetapkan Perda'));
  root.appendChild(box);
  hitung();
}
