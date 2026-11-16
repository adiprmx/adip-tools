import { h as T, kv } from '../../core.js?v=6.13.0';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM. */

export function keDesimal(jam, menit) { return jam + menit / 60; }

/** Null bila input bukan angka finite (RT2-08: keJamMenit(Infinity)
    menghasilkan { jam: Infinity, menit: NaN } yang dirender mentah). */
export function keJamMenit(desimal) {
  if (!Number.isFinite(desimal)) return null;
  const negatif = desimal < 0;
  const total = Math.round(Math.abs(desimal) * 60);
  return { jam: Math.floor(total / 60), menit: total % 60, negatif };
}

// '—' untuk angka non-finite, supaya tidak pernah tampil "Infinity".
export const fmtDesimal = (d, digit) => {
  if (!Number.isFinite(d)) return '—';
  return (Math.round(d * Math.pow(10, digit == null ? 2 : digit)) / Math.pow(10, digit == null ? 2 : digit)).toFixed(digit == null ? 2 : digit).replace('.', ',');
};

/** Parse satu baris batch: "7:45", "7.45", "7,75", "7 jam 45 menit", "7j 45m", "45 menit", "7 jam".
    Mengembalikan { jam, menit } atau null bila tidak bisa dibaca. */
export function parseBarisWaktu(s) {
  const t = String(s == null ? '' : s).trim().toLowerCase();
  if (!t) return null;
  let m;
  if ((m = /^(\d+)\s*[:.]\s*(\d{1,2})$/.exec(t))) {
    const jam = +m[1], mnt = +m[2];
    if (mnt >= 60 || !isFinite(jam)) return null;
    return { jam, menit: mnt };
  }
  if ((m = /^(\d+)\s*(?:jam|j)\s*(\d+)?\s*(?:menit|mnt|m)?$/.exec(t))) {
    const mnt = m[2] == null ? 0 : +m[2];
    if (mnt >= 60 || !isFinite(+m[1])) return null;
    return { jam: +m[1], menit: mnt };
  }
  if ((m = /^(\d+)\s*(?:menit|mnt|m)$/.exec(t))) {
    const mnt = +m[1];
    if (!isFinite(mnt)) return null;
    return { jam: 0, menit: mnt };
  }
  if ((m = /^(\d+)[,.](\d+)$/.exec(t))) {
    // Desimal murni (7,75 jam) — dibedakan dari "7.45" (jam:menit) oleh jumlah digit:
    // 2 digit setelah titik/koma di atas sudah ditangkap sebagai menit hanya bila pola jam:menit;
    // pola ini menangkap sisanya, mis. 7,5 atau 7.25 (tetap jam:menit bila 2 digit? tidak —
    // di sini koma = desimal, titik 2 digit = menit. "7.25" sudah jadi 7 jam 25 menit di atas.)
    const d = parseFloat(m[1] + '.' + m[2]);
    if (!isFinite(d)) return null;
    const total = Math.round(d * 60);
    return { jam: Math.floor(total / 60), menit: total % 60, dariDesimal: true };
  }
  if (/^\d+$/.test(t)) {
    const jam = +t;
    if (!isFinite(jam)) return null;
    return { jam, menit: 0 };
  }
  return null;
}

export const meta = {"id": "konversi-waktu-desimal", "name": "Waktu ke Desimal", "cat": "converter", "icon": "⏱️", "desc": "Ubah jam:menit ↔ jam desimal dua arah (7 jam 45 menit = 7,75 jam) + mode batch untuk payroll.", "keywords": "jam desimal,waktu,menit,payroll,gaji,timesheet,konversi jam", "since": "6.13.0"};
export function render(root) {

    // ---- Jam:menit -> desimal ----
    const jamI = T.input('text', 'Jam, cth: 7', '');
    jamI.inputMode = 'numeric';
    const mntI = T.input('text', 'Menit, cth: 45', '');
    mntI.inputMode = 'numeric';
    const outA = T.out();
    const hitungA = () => {
      const jam = T.num(jamI.value), mnt = T.num(mntI.value);
      if (!Number.isInteger(jam) || jam < 0 || jam > 100000 || !Number.isInteger(mnt) || mnt < 0 || mnt >= 60) {
        T.show(outA, '<span class="err">Isi jam (0 sampai 100.000) dan menit (0–59) dengan bilangan bulat.</span>'); return;
      }
      const d = keDesimal(jam, mnt);
      T.show(outA, '');
      outA.appendChild(T.el(
        '<div><div class="big center">' + fmtDesimal(d) + ' <span class="mut" style="font-size:15px">jam</span></div>' +
        '<p class="center">' + jam + ' jam ' + mnt + ' menit = ' + fmtDesimal(d) + ' jam desimal</p>' +
        kv('Dalam menit', (jam * 60 + mnt).toLocaleString('id-ID') + ' menit') + '</div>'
      ));
      outA.appendChild(T.row(T.copyBtn(() => fmtDesimal(d), 'Salin Desimal')));
    };
    [jamI, mntI].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitungA(); }));

    // ---- Desimal -> jam:menit ----
    const desI = T.input('text', 'cth: 7,75', '');
    desI.inputMode = 'decimal';
    const outB = T.out();
    const hitungB = () => {
      const d = T.num(desI.value);
      if (!isFinite(d) || d < 0 || d > 100000) { T.show(outB, '<span class="err">Isi jam desimal dengan angka 0 atau lebih.</span>'); return; }
      const r = keJamMenit(d);
      T.show(outB, '');
      outB.appendChild(T.el(
        '<div><div class="big center">' + r.jam + ' <span class="mut" style="font-size:15px">jam</span> ' + r.menit + ' <span class="mut" style="font-size:15px">menit</span></div>' +
        '<p class="center">' + fmtDesimal(d) + ' jam = ' + r.jam + ' jam ' + r.menit + ' menit</p>' +
        kv('Dalam menit', Math.round(d * 60).toLocaleString('id-ID') + ' menit') + '</div>'
      ));
      outB.appendChild(T.row(T.copyBtn(() => r.jam + ':' + String(r.menit).padStart(2, '0'), 'Salin Jam:Menit')));
    };
    desI.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitungB(); });

    // ---- Batch ----
    const batchI = T.ta(6, 'Satu baris per entri, cth:\n7:45\n8:30\n7 jam 15 menit\n6,5');
    const outC = T.out();
    // P4-12: 50.000 baris dirender jadi 50.000 <tr> membekukan tab 23 dtk.
    // Total tetap menghitung SEMUA baris (itu gunanya payroll), tapi tabel
    // hanya menampilkan 500 baris pertama + catatan jujur — pola yang sama
    // dengan batas tampil homoglyph (RT2-11). 500 baris itu pun dirender
    // BERTAHAP (100 per chunk): layout 500 baris sekaligus + layout
    // textarea 50k baris menembus 5 dtk di VM lambat, padahal handler-nya
    // sendiri hanya ~0,4 dtk. Total + 100 baris pertama langsung tampil.
    const MAKS_BARIS_TAMPIL = 500;
    const BARIS_PER_CHUNK = 100;
    let tokenBatch = 0;
    const hitungBatch = () => {
      const baris = batchI.value.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!baris.length) { T.show(outC, '<span class="err">Isi dulu daftar waktunya, satu baris per entri.</span>'); return; }
      const token = ++tokenBatch;
      let totalMenit = 0, gagal = 0;
      const htmlTampil = [];
      baris.forEach((b) => {
        const p = parseBarisWaktu(b);
        if (!p) {
          gagal++;
          if (htmlTampil.length < MAKS_BARIS_TAMPIL) {
            htmlTampil.push('<tr><td>' + T.esc(b) + '</td><td colspan="2" class="err">tidak bisa dibaca — pakai format 7:45 atau 7 jam 45 menit</td></tr>');
          }
          return;
        }
        const mnt = p.jam * 60 + p.menit;
        totalMenit += mnt;
        if (htmlTampil.length < MAKS_BARIS_TAMPIL) {
          htmlTampil.push('<tr><td>' + T.esc(b) + '</td><td>' + p.jam + ' jam ' + p.menit + ' menit</td><td style="text-align:right">' + fmtDesimal(mnt / 60) + ' jam</td></tr>');
        }
      });
      const totalJam = keJamMenit(totalMenit / 60);
      if (!totalJam) {
        T.show(outC, '<span class="err">Totalnya terlalu besar untuk dihitung — coba pakai angka jam yang lebih kecil.</span>');
        return;
      }
      T.show(outC, '');
      outC.appendChild(T.el(
        '<div><table class="tbl"><thead><tr><th>Entri</th><th>Waktu</th><th style="text-align:right">Desimal</th></tr></thead><tbody>' + htmlTampil.slice(0, BARIS_PER_CHUNK).join('') + '</tbody></table>' +
        (baris.length > MAKS_BARIS_TAMPIL ? '<p class="hint">Menampilkan ' + MAKS_BARIS_TAMPIL + ' baris pertama dari total ' + T.fmt(baris.length) + ' baris — total di bawah sudah menghitung semuanya.</p>' : '') +
        kv('Total', totalJam.jam + ' jam ' + totalJam.menit + ' menit = ' + fmtDesimal(totalMenit / 60) + ' jam desimal') +
        (gagal ? '<p class="warn">' + gagal + ' baris tidak bisa dibaca — cek lagi formatnya.</p>' : '') +
        '<p class="hint">Catatan: "7.45" dibaca sebagai 7 jam 45 menit, sedangkan "7,5" atau "6,5" dibaca sebagai jam desimal (6,5 jam = 6 jam 30 menit). ' +
        'Untuk payroll, total desimal di atas tinggal dikali tarif per jam.</p></div>'
      ));
      outC.appendChild(T.row(T.copyBtn(() => {
        const hasil = [];
        batchI.value.split('\n').map((s) => s.trim()).filter(Boolean).forEach((b) => {
          const p = parseBarisWaktu(b);
          if (p) hasil.push(b + ' = ' + fmtDesimal((p.jam * 60 + p.menit) / 60) + ' jam');
        });
        hasil.push('Total = ' + fmtDesimal(totalMenit / 60) + ' jam');
        return hasil.join('\n');
      }, 'Salin Hasil Batch')));
      // Sisa baris tampil bertahap (100 per chunk). Token menghentikan
      // chunk basi bila user mengklik lagi; isConnected menghentikannya
      // bila tool sudah ditinggal.
      const tbody = outC.querySelector('tbody');
      let idxChunk = BARIS_PER_CHUNK;
      const renderChunk = () => {
        if (token !== tokenBatch || !tbody || !tbody.isConnected) return;
        if (idxChunk >= htmlTampil.length) return;
        tbody.insertAdjacentHTML('beforeend', htmlTampil.slice(idxChunk, idxChunk + BARIS_PER_CHUNK).join(''));
        idxChunk += BARIS_PER_CHUNK;
        if (idxChunk < htmlTampil.length) setTimeout(renderChunk, 0);
      };
      if (idxChunk < htmlTampil.length) setTimeout(renderChunk, 0);
    };

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Dibayar per jam tapi absensi dicatat jam:menit? Ubah ke jam desimal biar gampang dikali tarif — atau sebaliknya. Mode batch di bawah untuk banyak entri sekaligus.</p>'));
    root.appendChild(T.el('<h3 class="h3">🕐 Jam:Menit → Desimal</h3>'));
    root.appendChild(T.grid2(T.field('Jam', jamI), T.field('Menit', mntI)));
    root.appendChild(T.row(T.btn('Ubah ke Desimal', hitungA, true)));
    root.appendChild(outA);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">🔄 Desimal → Jam:Menit</h3>'));
    root.appendChild(T.field('Jam desimal', desI, 'Bisa pakai koma (7,75) atau titik (7.75).'));
    root.appendChild(T.row(T.btn('Ubah ke Jam:Menit', hitungB, true)));
    root.appendChild(outB);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">📋 Mode Batch (banyak baris)</h3>'));
    root.appendChild(T.field('Daftar waktu', batchI, 'Satu baris per entri: 7:45, 7 jam 45 menit, atau 6,5 (desimal). Tabel menampilkan 500 baris pertama; total tetap menghitung semua baris.'));
    root.appendChild(T.row(T.btn('Hitung Batch', hitungBatch, true)));
    root.appendChild(outC);

}
