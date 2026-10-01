import { h as T, utils, p2, parseISO, todayISO } from '../../core.js?v=6.1.0';

export const meta = {"id": "couple-days", "name": "Hari Jadian", "cat": "fun", "icon": "💑", "desc": "Sudah berapa hari bareng?", "keywords": "jadian,pacar,pasangan,hari,anniversary"};
export function render(root) {

    const tgl = T.input('date', 'Tanggal jadian', todayISO());
    const box = T.out();
    const hitung = () => {
      const p = utils.ageParts(tgl.value, todayISO());
      if (!p) { T.show(box, '<span class="err">Tanggal jadian tidak boleh di masa depan.</span>'); return; }
      const d = p.totalHari;
      let html = '<div class="center"><div class="dim">Kalian sudah bersama</div>' +
        '<div class="big">💑 ' + T.fmt(d) + ' hari</div>' +
        '<div class="dim">≈ ' + p.tahun + ' tahun ' + p.bulan + ' bulan ' + p.hari + ' hari</div></div>';
      const MS = [100, 365, 500, 1000, 1500, 2000];
      html += '<div class="dim" style="margin:8px 0 4px">Milestone</div>';
      MS.forEach((m) => {
        if (d >= m) html += '<div class="kv"><span class="k">' + m + ' hari</span><span class="v ok">✅ lewat ' + T.fmt(d - m) + ' hari lalu</span></div>';
        else html += '<div class="kv"><span class="k">' + m + ' hari</span><span class="v">⏳ ' + T.fmt(m - d) + ' hari lagi</span></div>';
      });
      // anniversary tahunan
      const jd = parseISO(tgl.value);
      const nowD = parseISO(todayISO());
      let y = nowD.getUTCFullYear();
      let ann = new Date(Date.UTC(y, jd.getUTCMonth(), jd.getUTCDate()));
      if (isNaN(ann.getTime())) ann = new Date(Date.UTC(y, 1, 28));
      if (ann <= nowD) {
        y += 1;
        ann = new Date(Date.UTC(y, jd.getUTCMonth(), jd.getUTCDate()));
        if (isNaN(ann.getTime())) ann = new Date(Date.UTC(y, 1, 28));
      }
      const sisa = Math.round((ann - nowD) / 86400000);
      html += '<div class="kv"><span class="k">🎂 Anniversary tahun ke-' + (y - jd.getUTCFullYear()) + '</span><span class="v">' +
        T.fmt(sisa) + ' hari lagi</span></div>';
      T.show(box, html);
    };
    root.appendChild(T.field('Tanggal jadian', tgl));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  
}
