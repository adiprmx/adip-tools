import { h as T, kv } from '../../core.js?v=6.6.0';

export const meta = {"id":"matriks-keputusan","name":"Matriks Keputusan","cat":"produktivitas","icon":"⚖️","desc":"Bingung milih? Nilai tiap pilihan per kriteria berbobot, biar angka yang bicara.","keywords":"keputusan,matriks,bobot,kriteria,pilihan,analisis,tertimbang,galau"};

export function render(root) {
  let pilihan = ['Pilihan A', 'Pilihan B'];
  let kriteria = [{ name: 'Biaya', bobot: 3 }, { name: 'Kualitas', bobot: 4 }];
  const skor = {}; // "pi:ki" -> number

  const pilBox = T.el('<div></div>');
  const kriBox = T.el('<div></div>');
  const tblBox = T.el('<div style="overflow-x:auto"></div>');
  const out = T.out();

  const bacaSkor = () => {
    tblBox.querySelectorAll('.mk-skor').forEach((inp) => {
      const v = T.num(inp.value);
      skor[inp.getAttribute('data-pi') + ':' + inp.getAttribute('data-ki')] = isNaN(v) ? null : v;
    });
  };
  // Geser kunci skor saat baris/kolom dihapus, biar nilai nggak nyasar
  const remapSkor = (kind, idx) => {
    const ns = {};
    Object.keys(skor).forEach((key) => {
      const parts = key.split(':');
      const pi = +parts[0], ki = +parts[1];
      if (kind === 'p') {
        if (pi === idx) return;
        ns[(pi > idx ? pi - 1 : pi) + ':' + ki] = skor[key];
      } else {
        if (ki === idx) return;
        ns[pi + ':' + (ki > idx ? ki - 1 : ki)] = skor[key];
      }
    });
    Object.keys(skor).forEach((k) => delete skor[k]);
    Object.assign(skor, ns);
  };

  const hitung = () => {
    bacaSkor();
    let totBobot = 0;
    kriteria.forEach((k) => { totBobot += k.bobot; });
    if (!pilihan.length || !kriteria.length || totBobot <= 0) { T.hide(out); return; }
    for (let pi = 0; pi < pilihan.length; pi++) {
      for (let ki = 0; ki < kriteria.length; ki++) {
        const v = skor[pi + ':' + ki];
        if (v == null || isNaN(v) || v < 1 || v > 10) {
          T.show(out, '<p class="warn">Isi semua skor (1–10) dulu biar hasilnya valid.</p>');
          return;
        }
      }
    }
    const hasil = pilihan.map((p, pi) => {
      let s = 0;
      kriteria.forEach((k, ki) => { s += skor[pi + ':' + ki] * k.bobot; });
      return { name: p, val: s / totBobot };
    });
    const win = hasil.slice().sort((a, b) => b.val - a.val)[0];
    T.show(out,
      hasil.map((h) => kv(h.name, h.val.toFixed(2) + ' / 10')).join('') +
      '<p style="font-size:14px;margin:10px 0 0">🏆 <strong>Rekomendasi: ' + T.esc(win.name) + '</strong> ' +
      '<span class="mut">(skor ' + win.val.toFixed(2) + ')</span></p>' +
      '<p class="hint" style="margin:6px 0 0">Angka cuma alat bantu — kalau hatimu protes sama hasilnya, dengarkan juga. 😉</p>'
    );
  };

  const drawPil = () => {
    pilBox.innerHTML = '';
    pilihan.forEach((p, pi) => {
      const row = T.el('<div style="display:flex;gap:6px;margin-bottom:6px"></div>');
      const nm = T.input('text', 'Nama pilihan', p);
      nm.style.flex = '1';
      nm.addEventListener('input', () => {
        pilihan[pi] = nm.value.trim() || ('Pilihan ' + (pi + 1));
        bacaSkor(); drawTbl(); hitung();
      });
      const del = T.btn('✕', () => {
        if (pilihan.length <= 2) { T.toast('Minimal 2 pilihan'); return; }
        bacaSkor(); remapSkor('p', pi);
        pilihan.splice(pi, 1);
        drawPil(); drawTbl(); hitung();
      });
      del.setAttribute('aria-label', 'Hapus pilihan');
      row.appendChild(nm);
      row.appendChild(del);
      pilBox.appendChild(row);
    });
    pilBox.appendChild(T.btn('+ Tambah pilihan', () => {
      pilihan.push('Pilihan ' + String.fromCharCode(65 + pilihan.length));
      drawPil(); drawTbl(); hitung();
    }));
  };

  const drawKri = () => {
    kriBox.innerHTML = '';
    kriteria.forEach((k, ki) => {
      const row = T.el('<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center"></div>');
      const nm = T.input('text', 'Kriteria', k.name);
      nm.style.flex = '2';
      const bb = T.select([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], String(k.bobot));
      bb.style.flex = '1';
      bb.setAttribute('aria-label', 'Bobot kriteria');
      nm.addEventListener('input', () => {
        kriteria[ki].name = nm.value.trim() || ('Kriteria ' + (ki + 1));
        bacaSkor(); drawTbl(); hitung();
      });
      bb.addEventListener('change', () => {
        kriteria[ki].bobot = +bb.value;
        bacaSkor(); drawTbl(); hitung();
      });
      const del = T.btn('✕', () => {
        if (kriteria.length <= 1) { T.toast('Minimal 1 kriteria'); return; }
        bacaSkor(); remapSkor('k', ki);
        kriteria.splice(ki, 1);
        drawKri(); drawTbl(); hitung();
      });
      del.setAttribute('aria-label', 'Hapus kriteria');
      row.appendChild(nm);
      row.appendChild(bb);
      row.appendChild(del);
      kriBox.appendChild(row);
    });
    kriBox.appendChild(T.btn('+ Tambah kriteria', () => {
      kriteria.push({ name: 'Kriteria ' + (kriteria.length + 1), bobot: 3 });
      drawKri(); drawTbl(); hitung();
    }));
  };

  const drawTbl = () => {
    tblBox.innerHTML = '';
    const t = T.el('<table style="border-collapse:collapse;min-width:100%;font-size:13px"></table>');
    const head = T.el('<tr></tr>');
    head.appendChild(T.el('<th style="text-align:left;padding:6px 8px"></th>'));
    kriteria.forEach((k) => {
      head.appendChild(T.el('<th style="padding:6px 8px;text-align:center">' + T.esc(k.name) +
        '<div class="mut" style="font-weight:normal;font-size:11px">bobot ' + k.bobot + '</div></th>'));
    });
    t.appendChild(head);
    pilihan.forEach((p, pi) => {
      const tr = T.el('<tr></tr>');
      tr.appendChild(T.el('<td style="padding:6px 8px;font-weight:600;white-space:nowrap">' + T.esc(p) + '</td>'));
      kriteria.forEach((k, ki) => {
        const td = T.el('<td style="padding:4px"></td>');
        const inp = T.input('number', '1–10', skor[pi + ':' + ki] != null ? skor[pi + ':' + ki] : '');
        inp.className += ' mk-skor';
        inp.min = '1'; inp.max = '10';
        inp.setAttribute('data-pi', pi);
        inp.setAttribute('data-ki', ki);
        inp.setAttribute('aria-label', 'Skor ' + p + ' untuk ' + k.name);
        inp.style.width = '64px';
        inp.style.textAlign = 'center';
        inp.addEventListener('input', hitung);
        td.appendChild(inp);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    tblBox.appendChild(t);
  };

  root.appendChild(T.el('<p class="hint">Galau versi sistematis: daftarkan pilihan, tentukan kriteria + bobotnya (1 = nggak penting, 5 = penting banget), lalu nilai tiap sel 1–10. Skor dihitung otomatis.</p>'));
  root.appendChild(T.el('<h3 style="font-size:14px;margin:14px 0 8px">1. Pilihan</h3>'));
  root.appendChild(pilBox);
  root.appendChild(T.el('<h3 style="font-size:14px;margin:14px 0 8px">2. Kriteria &amp; bobot</h3>'));
  root.appendChild(kriBox);
  root.appendChild(T.el('<h3 style="font-size:14px;margin:14px 0 8px">3. Skor tiap pilihan</h3>'));
  root.appendChild(tblBox);
  root.appendChild(T.el('<h3 style="font-size:14px;margin:14px 0 8px">Hasil</h3>'));
  root.appendChild(out);
  drawPil(); drawKri(); drawTbl(); hitung();
}
