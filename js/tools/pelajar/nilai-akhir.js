import { h as T, utils, kv } from '../../core.js?v=6.6.0';

export const meta = {"id":"nilai-akhir","name":"Kalkulator Nilai Akhir","cat":"pelajar","icon":"🎓","desc":"Hitung nilai akhir dari bobot tiap komponen + predikat A–E.","keywords":"nilai,akhir,bobot,predikat,rapor,uts,uas,tugas,kuliah,sekolah"};

function predikat(n) {
  if (n >= 85) return 'A';
  if (n >= 70) return 'B';
  if (n >= 55) return 'C';
  if (n >= 40) return 'D';
  return 'E';
}

export function render(root) {
  const rowsBox = T.el('<div></div>');
  const out = T.out();

  const addRow = (name, val, w) => {
    const line = T.el('<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center"></div>');
    const nm = T.input('text', 'Komponen', name || '');
    nm.style.flex = '2';
    nm.className += ' na-name';
    const vv = T.input('number', 'Nilai', val == null ? '' : val);
    vv.style.flex = '1';
    vv.className += ' na-val';
    vv.min = '0'; vv.max = '100';
    const ww = T.input('number', 'Bobot %', w == null ? '' : w);
    ww.style.flex = '1';
    ww.className += ' na-w';
    ww.min = '0'; ww.max = '100';
    const del = T.btn('✕', () => { line.remove(); hitung(); });
    line.appendChild(nm); line.appendChild(vv); line.appendChild(ww); line.appendChild(del);
    rowsBox.appendChild(line);
  };

  const readRows = () => {
    const names = rowsBox.querySelectorAll('.na-name');
    const vals = rowsBox.querySelectorAll('.na-val');
    const ws = rowsBox.querySelectorAll('.na-w');
    const rows = [];
    for (let i = 0; i < names.length; i++) {
      rows.push({
        name: (names[i].value || '').trim() || 'Komponen ' + (i + 1),
        val: T.num(vals[i].value),
        w: T.num(ws[i].value),
      });
    }
    return rows;
  };

  const hitung = () => {
    const rows = readRows();
    if (!rows.length) { T.show(out, '<p class="warn">Tambah dulu baris komponennya.</p>'); return; }
    let totalW = 0, skor = 0;
    const rincian = [];
    for (const r of rows) {
      if (isNaN(r.val) || r.val < 0 || r.val > 100) {
        T.show(out, '<p class="err">Nilai "' + T.esc(r.name) + '" harus angka 0–100.</p>');
        return;
      }
      if (isNaN(r.w) || r.w < 0 || r.w > 100) {
        T.show(out, '<p class="err">Bobot "' + T.esc(r.name) + '" harus angka 0–100.</p>');
        return;
      }
      totalW += r.w;
      const kontribusi = r.val * r.w / 100;
      skor += kontribusi;
      rincian.push(kv(T.esc(r.name) + ' <span class="mut">(' + r.val + ' × ' + r.w + '%)</span>', kontribusi.toFixed(2)));
    }
    const akhir = Math.round(skor * 100) / 100;
    const ok = Math.abs(totalW - 100) < 0.0001;
    let html = '';
    if (!ok) {
      html += '<p class="warn" style="margin-top:0">⚠️ Total bobot = ' + (Math.round(totalW * 100) / 100) + '%, bukan 100%. Hasil di bawah belum valid sampai totalnya pas 100%.</p>';
    }
    html += '<div class="big center">' + akhir.toFixed(2) + ' <span class="mut" style="font-size:15px">· Predikat ' + predikat(akhir) + '</span></div>';
    html += '<p class="center hint">Rumus: Σ(nilai × bobot) ÷ 100</p>';
    html += rincian.join('');
    html += kv('Total bobot', totalW + '%');
    T.show(out, html);
  };

  addRow('Tugas', '', '');
  addRow('UTS', '', '');
  addRow('UAS', '', '');

  root.appendChild(T.el('<p class="hint">Tambah komponen penilaian (tugas, kuis, UTS, UAS...) beserta bobotnya. Total bobot harus pas 100%.</p>'));
  root.appendChild(T.el('<div class="mut" style="font-size:12px;display:flex;gap:6px;margin-bottom:4px"><span style="flex:2">Nama komponen</span><span style="flex:1">Nilai (0–100)</span><span style="flex:1">Bobot %</span><span style="width:34px"></span></div>'));
  root.appendChild(rowsBox);
  root.appendChild(T.row(
    T.btn('+ Tambah baris', () => addRow('', '', '')),
    T.btn('Hitung nilai akhir', hitung, true)
  ));
  root.appendChild(out);
}
