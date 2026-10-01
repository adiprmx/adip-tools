import { h as T, num, fmt } from '../../core.js?v=6.8.0';

export const meta = {"id": "konversi-resep", "name": "Konversi Resep", "cat": "sehari", "icon": "🍳", "desc": "Skala bahan resep otomatis buat porsi yang beda.", "keywords": "resep,konversi,porsi,masak,bahan,skala"};

export function render(root) {

    const SATUAN = ['g', 'kg', 'ml', 'liter', 'sdm', 'sdt', 'butir', 'siung', 'buah', 'lembar', 'batang', 'gelas', 'bungkus', 'pcs'];
    const box = T.out();
    const rowsBox = T.el('<div style="margin-bottom:10px"></div>');
    const rows = [];

    const makeRow = (nama, jml, sat) => {
      const wrap = T.el('<div style="display:flex;gap:8px;margin-bottom:8px"></div>');
      const nI = T.input('text', 'nama bahan', nama || '');
      nI.style.flex = '1.6';
      const jI = T.input('text', 'jumlah', jml || '');
      jI.style.flex = '0.9';
      const sI = T.select(SATUAN.map((s) => [s, s]), sat || 'g');
      sI.style.flex = '0.9';
      const del = T.btn('✕', () => { wrap.remove(); const i = rows.findIndex((r) => r.wrap === wrap); if (i >= 0) rows.splice(i, 1); });
      wrap.appendChild(nI); wrap.appendChild(jI); wrap.appendChild(sI); wrap.appendChild(del);
      const r = { wrap, nI, jI, sI };
      rows.push(r);
      rowsBox.appendChild(wrap);
      return r;
    };

    const porsiDariI = T.input('number', 'cth: 4', '4');
    const porsiKeI = T.input('number', 'cth: 10', '10');

    const fmtJ = (n) => {
      const r = Math.round(n * 100) / 100;
      return fmt(r);
    };

    const calc = () => {
      const dari = num(porsiDariI.value), ke = num(porsiKeI.value);
      if (!isFinite(dari) || !isFinite(ke) || dari <= 0 || ke <= 0) { T.toast('Porsi asal & target harus lebih dari 0'); return; }
      const items = [];
      rows.forEach(({ nI, jI, sI }) => {
        const v = num(jI.value);
        if (!isFinite(v) || v < 0) return;
        items.push({ nama: (nI.value || '(bahan)').trim(), jml: v, sat: sI.value, baru: v * ke / dari });
      });
      if (!items.length) { T.toast('Tambahin dulu bahan + jumlahnya'); return; }
      const lines = items.map((x) => '- ' + x.nama + ': ' + fmtJ(x.baru) + ' ' + x.sat);
      T.show(box,
        '<div class="big center">' + fmtJ(ke) + ' <span class="mut" style="font-size:15px">porsi</span></div>' +
        '<p class="center">resep ' + fmtJ(dari) + ' porsi → ' + fmtJ(ke) + ' porsi (×' + fmtJ(ke / dari) + ')</p>' +
        '<div class="kv"><span class="k">Bahan lama</span><span class="v">Bahan baru</span></div>' +
        items.map((x) => '<div class="kv"><span class="k">' + T.esc(x.nama) + ' ' + fmtJ(x.jml) + ' ' + T.esc(x.sat) + '</span><span class="v"><b>' + fmtJ(x.baru) + ' ' + T.esc(x.sat) + '</b></span></div>').join('') +
        '<p class="hint">Bumbu & rempah biasanya nggak perlu diskala penuh — cicipi aja sambil masak.</p>');
      return lines.join('\n');
    };

    makeRow('Beras', '500', 'g');
    makeRow('Air', '1000', 'ml');
    makeRow('Bawang merah', '6', 'siung');

    root.appendChild(T.el('<p class="note">Resepnya buat 4 orang, yang mau makan 10? <b>Tulis bahannya</b>, biar ukurannya yang ngitung.</p>'));
    root.appendChild(T.el('<h3 style="margin:14px 0 8px">🧂 Bahan-bahan</h3>'));
    root.appendChild(rowsBox);
    root.appendChild(T.row(T.btn('+ Tambah bahan', () => makeRow('', '', 'g'))));
    root.appendChild(T.grid2(
      T.field('Porsi asal', porsiDariI, 'Resep ini awalnya untuk berapa porsi?'),
      T.field('Porsi target', porsiKeI, 'Mau masak untuk berapa porsi?')
    ));
    root.appendChild(T.row(T.btn('Konversi', calc, true)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => {
      const dari = num(porsiDariI.value), ke = num(porsiKeI.value);
      if (!isFinite(dari) || !isFinite(ke) || dari <= 0 || ke <= 0) return null;
      const lines = [];
      rows.forEach(({ nI, jI, sI }) => {
        const v = num(jI.value);
        if (!isFinite(v) || v < 0) return;
        lines.push('- ' + ((nI.value || '(bahan)').trim()) + ': ' + fmtJ(v * ke / dari) + ' ' + sI.value);
      });
      if (!lines.length) return null;
      return 'Resep ' + dari + ' porsi → ' + ke + ' porsi:\n' + lines.join('\n');
    }, 'Salin Hasil')));
}
