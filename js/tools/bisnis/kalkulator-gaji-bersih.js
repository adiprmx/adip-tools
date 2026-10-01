import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "kalkulator-gaji-bersih", "name": "Kalkulator Gaji Bersih", "cat": "bisnis", "icon": "💰", "desc": "Gaji pokok + tunjangan − BPJS & potongan = take-home pay.", "keywords": "gaji,bersih,take home pay,bpjs,jht,potongan,tunjangan,payroll,thr"};
export function render(root) {
  let bpjsPct = 1, jhtPct = 2;
  try {
    const b = parseFloat(localStorage.getItem('kalkulator-gaji-bersih-bpjs'));
    if (b >= 0 && b <= 100) bpjsPct = b;
    const j = parseFloat(localStorage.getItem('kalkulator-gaji-bersih-jht'));
    if (j >= 0 && j <= 100) jhtPct = j;
  } catch (e) { /* abaikan */ }

  const pokokI = T.input('text', 'cth: 5000000'); pokokI.inputMode = 'decimal';
  const bpjsI = T.input('text', 'cth: 1', String(bpjsPct)); bpjsI.inputMode = 'decimal';
  const jhtI = T.input('text', 'cth: 2', String(jhtPct)); jhtI.inputMode = 'decimal';
  const tunjBox = T.el('<div></div>');
  const potBox = T.el('<div></div>');
  const box = T.out();

  let tunj = [{ nama: 'Tunjangan makan', jumlah: '' }];
  let potLain = [];

  const rowHtml = (rows) => rows.map((r, i) =>
    '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
    '<input class="inp" data-k="nama" data-i="' + i + '" placeholder="Nama" value="' + T.esc(r.nama) + '" style="flex:2"/>' +
    '<input class="inp" data-k="jumlah" data-i="' + i + '" placeholder="Rp" value="' + T.esc(r.jumlah) + '" inputmode="decimal" style="flex:1"/>' +
    '<button class="btn" data-del="' + i + '" style="flex-shrink:0">✕</button>' +
    '</div>').join('');

  const bindRows = (boxEl, rows, rerender) => {
    boxEl.querySelectorAll('input[data-k]').forEach((el) => {
      el.addEventListener('input', () => {
        rows[Number(el.dataset.i)][el.dataset.k] = el.value;
        hitung();
      });
    });
    boxEl.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', () => {
        rows.splice(Number(b.dataset.del), 1);
        rerender();
        hitung();
      });
    });
  };

  const renderTunj = () => {
    tunjBox.innerHTML = rowHtml(tunj) + '<button class="btn" data-add="1">＋ Tambah tunjangan</button>';
    tunjBox.querySelector('[data-add]').addEventListener('click', () => {
      tunj.push({ nama: '', jumlah: '' });
      renderTunj(); hitung();
    });
    bindRows(tunjBox, tunj, renderTunj);
  };
  const renderPot = () => {
    potBox.innerHTML = (potLain.length ? rowHtml(potLain) : '<p class="hint" style="margin-bottom:8px">Belum ada potongan lain.</p>') +
      '<button class="btn" data-add="1">＋ Tambah potongan</button>';
    potBox.querySelector('[data-add]').addEventListener('click', () => {
      potLain.push({ nama: '', jumlah: '' });
      renderPot(); hitung();
    });
    bindRows(potBox, potLain, renderPot);
  };

  const sumRows = (rows) => rows.reduce((a, r) => a + (T.num(r.jumlah) || 0), 0);

  const hitung = () => {
    const pokok = T.num(pokokI.value) || 0;
    const bp = T.num(bpjsI.value), jp = T.num(jhtI.value);
    if (!(pokok > 0)) { T.hide(box); return; }
    if (!(bp >= 0 && bp <= 100) || !(jp >= 0 && jp <= 100)) {
      T.show(box, '<p class="warn">Persentase BPJS & JHT harus 0–100%.</p>'); return;
    }
    try {
      localStorage.setItem('kalkulator-gaji-bersih-bpjs', String(bp));
      localStorage.setItem('kalkulator-gaji-bersih-jht', String(jp));
    } catch (e) { /* abaikan */ }
    const totTunj = sumRows(tunj);
    const gross = pokok + totTunj;
    const bpjs = gross * bp / 100;
    const jht = gross * jp / 100;
    const lain = sumRows(potLain);
    const thp = gross - bpjs - jht - lain;
    const baris = (arr, minus) => arr.filter((r) => String(r.nama).trim() && (T.num(r.jumlah) || 0) > 0)
      .map((r) => '<div class="kv"><span class="k">' + T.esc(r.nama) + '</span><span class="v">' + (minus ? '− ' : '') + T.rp(T.num(r.jumlah)) + '</span></div>').join('');
    T.show(box,
      '<div class="kv"><span class="k">Gaji pokok</span><span class="v">' + T.rp(pokok) + '</span></div>' +
      baris(tunj) +
      '<div class="kv"><span class="k"><b>Penghasilan bruto</b></span><span class="v"><b>' + T.rp(gross) + '</b></span></div>' +
      '<div class="kv"><span class="k">BPJS Kesehatan (' + T.esc(String(bp)) + '%)</span><span class="v">− ' + T.rp(bpjs) + '</span></div>' +
      '<div class="kv"><span class="k">JHT (' + T.esc(String(jp)) + '%)</span><span class="v">− ' + T.rp(jht) + '</span></div>' +
      baris(potLain, true) +
      '<div class="kv total"><span class="k"><b>Take-home pay</b></span><span class="v"><b>' + T.rp(thp) + '</b></span></div>' +
      '<div class="big center" style="margin-top:10px">' + T.rp(thp) + ' <span class="mut" style="font-size:14px">/ bulan</span></div>');
  };
  [pokokI, bpjsI, jhtI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Hitung gaji yang beneran masuk rekening: gaji pokok + tunjangan, dikurangi BPJS, JHT, dan potongan lain. Persentase iurannya bisa disesuaikan.</p>'));
  root.appendChild(T.field('Gaji pokok (Rp)', pokokI));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Tunjangan</p>'));
  root.appendChild(tunjBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Potongan iuran (dari penghasilan bruto, tersimpan otomatis)</p>'));
  root.appendChild(T.grid2(
    T.field('BPJS Kesehatan (%)', bpjsI),
    T.field('JHT (%)', jhtI)
  ));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Potongan lain</p>'));
  root.appendChild(potBox);
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Iuran dihitung dari penghasilan bruto (pokok + tunjangan). Angka ilustrasi — potongan aktual bisa beda tergantung kebijakan perusahaan & batas upah BPJS.</p>'));
  renderTunj();
  renderPot();
  hitung();
}
