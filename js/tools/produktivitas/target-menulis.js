import { h as T, kv } from '../../core.js?v=6.5.0';

export const meta = {"id":"target-menulis","name":"Target Menulis","cat":"produktivitas","icon":"✍️","desc":"Pasang target kata, pantau bar progresnya sampai garis finis.","keywords":"target,menulis,kata,word count,progres,progress,novel,skripsi,naskah"};

export function render(root) {
  const KEY = 'adip-tools:target-menulis';
  let target = 1000;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && +v.target > 0) target = Math.round(+v.target);
  } catch (e) {}
  const saveTarget = () => { try { localStorage.setItem(KEY, JSON.stringify({ target: target })); } catch (e) {} };

  const out = T.out();
  const bar = T.el('<div style="height:14px;border-radius:99px;background:#ffffff12;overflow:hidden;margin:12px 0 4px"></div>');
  const fill = T.el('<div style="height:100%;width:0%;border-radius:99px;background:#fff;transition:width .25s"></div>');
  bar.appendChild(fill);

  const tgtInp = T.input('number', 'mis. 5000', target);
  tgtInp.min = '1';
  const curInp = T.input('number', 'mis. 1250', '');

  const hitung = () => {
    const cur = Math.max(0, T.num(curInp.value) || 0);
    const tgt = Math.max(1, Math.round(T.num(tgtInp.value) || 0));
    const pct = Math.min(100, (cur / tgt) * 100);
    fill.style.width = pct + '%';
    const sisa = Math.max(0, tgt - cur);
    let extra;
    if (cur >= tgt && cur > 0) {
      extra = '<p style="color:#22c55e;font-size:13.5px;margin:8px 0 0">🎉 Target tercapai! Istirahat, kamu pantas.</p>';
    } else if (cur > 0) {
      extra = '<p class="mut" style="font-size:13px;margin:8px 0 0">' + T.fmt(sisa) + ' kata lagi. Sedikit demi sedikit, yang penting jalan.</p>';
    } else {
      extra = '<p class="mut" style="font-size:13px;margin:8px 0 0">Mulai dari satu kalimat. Bar di atas bakal ikut gerak.</p>';
    }
    T.show(out,
      kv('Target', T.fmt(tgt) + ' kata') +
      kv('Sudah ditulis', T.fmt(cur) + ' kata') +
      kv('Progres', pct.toFixed(1).replace('.', ',') + '%') +
      kv('Sisa', T.fmt(sisa) + ' kata') +
      extra
    );
  };

  tgtInp.addEventListener('input', hitung);
  curInp.addEventListener('input', hitung);

  const saveBtn = T.btn('Simpan target', () => {
    const v = T.num(tgtInp.value);
    if (!(v > 0)) { T.toast('Targetnya harus angka lebih dari 0'); return; }
    target = Math.round(v);
    saveTarget();
    hitung();
    T.toast('Target ' + T.fmt(target) + ' kata tersimpan!');
  }, true);

  root.appendChild(T.el('<p class="hint">Buat yang lagi garap skripsi, novel, atau naskah — pasang target, update jumlah kata tiap selesai satu sesi.</p>'));
  root.appendChild(T.field('Target jumlah kata', tgtInp, 'Target tersimpan otomatis di HP kamu.'));
  root.appendChild(T.field('Kata yang sudah ditulis', curInp, 'Update tiap selesai satu sesi menulis.'));
  root.appendChild(T.row(saveBtn));
  root.appendChild(bar);
  root.appendChild(out);
  hitung();
}
