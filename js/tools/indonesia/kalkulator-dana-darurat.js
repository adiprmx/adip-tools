import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "kalkulator-dana-darurat", "name": "Dana Darurat", "cat": "indonesia", "icon": "🛟", "desc": "Hitung target dana darurat ideal + progres menabungmu.", "keywords": "dana darurat,tabungan,keuangan,emergency fund,pengeluaran"};

export function render(root) {
  const K = 'tool:kalkulator-dana-darurat';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ b: belanjaI.value, s: statusSel.value, m: pengaliI.value, t: tabungI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Idealnya punya cadangan buat bertahan 3–12 bulan kalau penghasilan tiba-tiba berhenti. Cek di sini kamu udah sampai mana.</p>'));

  const MULT = { lajang: 3, menikah: 6, anak: 12 };
  const belanjaI = T.input('text', 'Contoh: 5000000', sv.b || '');
  const statusSel = T.select([['lajang', 'Lajang — target 3x pengeluaran'], ['menikah', 'Menikah — target 6x pengeluaran'], ['anak', 'Menikah + anak — target 12x pengeluaran']], sv.s || 'lajang');
  const pengaliI = T.input('text', 'Contoh: 6', sv.m || String(MULT[sv.s] || 3));
  const tabungI = T.input('text', 'Contoh: 10000000', sv.t || '');

  root.appendChild(T.field('Pengeluaran per bulan (Rp)', belanjaI, 'Total biaya hidupmu tiap bulan.'));
  root.appendChild(T.field('Status', statusSel));
  root.appendChild(T.field('Target kelipatan (x)', pengaliI, 'Boleh diubah sesukamu, misal mau nabung 9x.'));
  root.appendChild(T.field('Tabungan darurat saat ini (Rp)', tabungI, 'Sudah kekumpul berapa sejauh ini.'));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const belanja = T.num(belanjaI.value);
    let kali = T.num(pengaliI.value);
    const tabung = T.num(tabungI.value) || 0;
    if (isNaN(belanja) || belanja <= 0) { T.show(box, '<p class="mut center">Isi dulu pengeluaran per bulanmu.</p>'); return; }
    if (isNaN(kali) || kali <= 0) kali = 3;
    const target = belanja * kali;
    const progres = Math.min(100, Math.max(0, tabung / target * 100));
    const sisa = Math.max(0, target - tabung);
    const bar = '<div style="height:10px;background:#27272a;border-radius:6px;overflow:hidden;margin:8px 0 12px"><div style="height:100%;width:' + progres.toFixed(1) + '%;background:#fff;border-radius:6px"></div></div>';
    const pesan = sisa <= 0
      ? 'Mantap, targetmu udah tercapai. Tinggal jaga jangan kepakai buat yang bukan darurat.'
      : 'Sabar, dikit-dikit yang penting jalan. Sisihkan rutin tiap gajian biar makin dekat.';
    T.show(box,
      '<div class="big center">' + T.rp(target) + '</div>' +
      '<p class="center mut">target dana darurat (' + kali + 'x pengeluaran)</p>' +
      bar +
      '<div class="kv"><span class="k">Terkumpul</span><span class="v">' + T.rp(tabung) + ' (' + progres.toFixed(1) + '%)</span></div>' +
      '<div class="kv"><span class="k">Masih kurang</span><span class="v">' + T.rp(sisa) + '</span></div>' +
      '<p class="hint">' + pesan + '</p>'
    );
  };
  statusSel.addEventListener('change', () => { pengaliI.value = String(MULT[statusSel.value] || 3); hitung(); });
  [belanjaI, statusSel, pengaliI, tabungI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
