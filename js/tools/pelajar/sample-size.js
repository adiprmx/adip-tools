import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id":"sample-size","name":"Ukuran Sampel Survei","cat":"pelajar","icon":"📋","desc":"Berapa responden yang dibutuhkan dari jumlah populasi, margin error, dan tingkat kepercayaan.","keywords":"sampel,survei,responden,populasi,margin error,statistik,skripsi,penelitian","since":"6.11.0"};

/* Rumus Cochran: n0 = Z^2 x p(1-p) / e^2 ; koreksi populasi terbatas n = n0 / (1 + (n0-1)/N). */
export const Z_TABEL = { '90': 1.645, '95': 1.96, '99': 2.576 };

export function hitungSampel(populasi, marginPersen, kepercayaan, p) {
  const e = marginPersen / 100;
  const z = Z_TABEL[String(kepercayaan)];
  if (!z || !(e > 0) || !(p > 0) || !(p < 1)) return null;
  const n0 = z * z * p * (1 - p) / (e * e);
  if (!populasi || !isFinite(populasi) || populasi <= 0) {
    return { n0: Math.ceil(n0), n: Math.ceil(n0), terbatas: false, z };
  }
  const n = n0 / (1 + (n0 - 1) / populasi);
  return { n0: Math.ceil(n0), n: Math.ceil(n), terbatas: true, z };
}

export function render(root) {
  const popInp = T.input('text', 'mis. 1000 (kosongkan bila tidak tahu)', ''); popInp.inputMode = 'numeric';
  const errInp = T.input('text', 'mis. 5', '5'); errInp.inputMode = 'decimal';
  const confSel = T.select([['90', '90%'], ['95', '95% (paling umum dipakai)'], ['99', '99%']], '95');
  const pSel = T.select([['0.5', '0,5: tidak tahu (paling aman)'], ['0.3', '0,3'], ['0.7', '0,7']], '0.5');
  const out = T.out();

  const hitung = () => {
    const pop = popInp.value.trim() === '' ? null : T.num(popInp.value);
    const err = T.num(errInp.value);
    const p = T.num(pSel.value);
    if (pop != null && (!isFinite(pop) || pop < 1 || !Number.isInteger(pop))) {
      T.show(out, '<p class="err">Jumlah populasi harus bilangan bulat 1 atau lebih, atau dikosongkan.</p>'); return;
    }
    if (!isFinite(err) || !(err > 0) || err >= 100) {
      T.show(out, '<p class="err">Margin error harus di antara 0 dan 100 persen.</p>'); return;
    }
    const r = hitungSampel(pop, err, confSel.value, p);
    if (!r) { T.show(out, '<p class="err">Nilai tidak bisa dihitung, periksa isian.</p>'); return;
    }
    T.show(out,
      '<div class="center"><div class="dim">Responden yang dibutuhkan</div>' +
      '<div class="big">' + T.fmt(r.n) + ' orang</div></div>' +
      kv('Tingkat kepercayaan', confSel.value + '% (nilai Z ' + r.z + ')') +
      kv('Margin error', T.esc(String(errInp.value).replace('.', ',')) + '%') +
      kv('Perkiraan jawaban ya/tidak', pSel.value.replace('.', ',')) +
      (r.terbatas
        ? kv('Tanpa koreksi populasi', T.fmt(r.n0) + ' orang') +
          '<p class="hint">Angka dikecilkan dengan koreksi populasi terbatas karena populasi diketahui (' + T.fmt(pop) + ' orang).</p>'
        : '<p class="hint">Populasi tidak diisi, jadi dihitung untuk populasi tak terbatas.</p>') +
      '<p class="hint">Rumus Cochran. Angka ini jumlah minimum; tambah cadangan 10-20% untuk jawaban yang tidak kembali.</p>');
  };

  root.appendChild(T.el('<p class="hint">Untuk skripsi, tugas akhir, atau riset kecil. Isi jumlah populasi bila diketahui, lalu pilih margin error dan tingkat kepercayaan.</p>'));
  root.appendChild(T.field('Jumlah populasi (N)', popInp, 'Kosongkan bila jumlahnya tidak diketahui'));
  root.appendChild(T.grid2(
    T.field('Margin error (%)', errInp, '5% paling umum dipakai'),
    T.field('Tingkat kepercayaan', confSel)
  ));
  root.appendChild(T.field('Perkiraan jawaban', pSel, '0,5 memberi jumlah sampel terbesar dan paling aman'));
  root.appendChild(T.row(T.btn('Hitung sampel', hitung, true)));
  root.appendChild(out);
  T.show(out, '<p class="dim">Contoh: populasi 1000 orang, margin error 5%, kepercayaan 95% butuh 278 responden.</p>');
}
