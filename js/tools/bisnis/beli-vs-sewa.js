import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "beli-vs-sewa", "name": "Beli vs Sewa", "cat": "bisnis", "icon": "⚖️", "desc": "Bandingkan total biaya beli vs sewa + titik impasnya.", "keywords": "beli,sewa,break even,impas,perbandingan,biaya"};

export function render(root) {
  const K = 'tool:beli-vs-sewa';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ b: beliI.value, s: sewaI.value, d: durasiI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Mau beli alat sendiri atau sewa aja? Kalau dipakai sebentar, sewa menang. Kalau dipakai lama, beli menang. Ini hitungannya.</p>'));

  const beliI = T.input('text', 'Contoh: 15000000', sv.b || '');
  const sewaI = T.input('text', 'Contoh: 500000', sv.s || '');
  const durasiI = T.input('text', 'Contoh: 24', sv.d || '');

  root.appendChild(T.field('Harga beli (Rp, sekali bayar)', beliI, 'Misal harga kamera, alat kopi, laptop.'));
  root.appendChild(T.grid2(
    T.field('Biaya sewa per bulan (Rp)', sewaI),
    T.field('Rencana dipakai (bulan)', durasiI)
  ));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const beli = T.num(beliI.value);
    const sewa = T.num(sewaI.value);
    const durasi = Math.floor(T.num(durasiI.value));
    if (isNaN(beli) || beli <= 0) { T.show(box, '<p class="mut center">Isi dulu harga belinya.</p>'); return; }
    if (isNaN(sewa) || sewa <= 0) { T.show(box, '<p class="mut center">Biaya sewanya juga diisi ya.</p>'); return; }
    const d = (isNaN(durasi) || durasi <= 0) ? null : durasi;
    const bep = Math.ceil(beli / sewa);
    const totalBeli = beli;
    const totalSewa = d == null ? null : sewa * d;
    let rekom;
    if (d == null) {
      rekom = 'Belum ada rencana durasi — masukkan dulu biar rekomendasinya muncul.';
    } else if (d < bep) {
      rekom = 'Rekomendasi: SEWA lebih hemat. Kamu cuma butuh ' + d + ' bulan, total sewa ' + T.rp(totalSewa) + ' — jauh lebih murah dari beli ' + T.rp(totalBeli) + '.';
    } else if (d === bep) {
      rekom = 'Pas impas: total sewa ' + T.rp(totalSewa) + ' setara harga beli. Kalau ada kemungkinan dipakai lebih lama, mending beli sekalian.';
    } else {
      rekom = 'Rekomendasi: BELI lebih hemat. Total sewa ' + T.rp(totalSewa) + ' udah melewati harga beli ' + T.rp(totalBeli) + ' — sayang duitnya.';
    }
    T.show(box,
      '<div class="kv"><span class="k">Total beli (sekali bayar)</span><span class="v">' + T.rp(totalBeli) + '</span></div>' +
      '<div class="kv"><span class="k">Total sewa' + (d == null ? '' : ' (' + d + ' bln)') + '</span><span class="v">' + (totalSewa == null ? '—' : T.rp(totalSewa)) + '</span></div>' +
      '<div class="kv"><span class="k">Break-even point</span><span class="v">bulan ke-' + bep + '</span></div>' +
      '<p class="hint">Artinya: kalau kamu pakai lebih dari ' + bep + ' bulan, sewa udah lebih mahal dari beli. ' + rekom + '</p>'
    );
  };
  [beliI, sewaI, durasiI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
