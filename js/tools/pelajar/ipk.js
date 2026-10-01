import { h as T, utils } from '../../core.js?v=6.6.0';

utils.ipk = function (entries) {
    let bobotSks = 0, sks = 0;
    (entries || []).forEach((e) => {
      const s = Number(e && e.sks), bo = Number(e && e.bobot);
      if (s > 0 && !isNaN(bo)) { bobotSks += s * bo; sks += s; }
    });
    if (sks <= 0) return 0;
    return Math.round((bobotSks / sks) * 100) / 100;
  };

export const meta = {"id": "ipk", "name": "Kalkulator IPK", "cat": "pelajar", "icon": "🎓", "desc": "Hitung IPK semester.", "keywords": "ipk,nilai,kuliah,semester"};
export function render(root) {

    const GRADES = [['4', 'A (4,0)'], ['3.7', 'A− (3,7)'], ['3.3', 'B+ (3,3)'], ['3', 'B (3,0)'], ['2.7', 'B− (2,7)'], ['2.3', 'C+ (2,3)'], ['2', 'C (2,0)'], ['1', 'D (1,0)'], ['0', 'E (0,0)'], ['custom', 'Bobot custom…']];
    const listEl = T.el('<div></div>');
    const box = T.out();
    const rows = [];
    function addRow(nama, sks, grade) {
      const r = {};
      r.nama = T.input('text', 'Nama mata kuliah', nama || '');
      r.sks = T.input('number', 'SKS', sks != null ? String(sks) : '3');
      r.grade = T.select(GRADES, grade || '3');
      r.bobot = T.input('number', 'Bobot (0-4)', '');
      r.bobot.style.display = 'none';
      r.grade.addEventListener('change', () => { r.bobot.style.display = r.grade.value === 'custom' ? '' : 'none'; });
      r.del = T.btn('✕', () => {
        const i = rows.indexOf(r);
        if (i >= 0) rows.splice(i, 1);
        wrap.remove();
      });
      const wrap = T.el('<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px"></div>');
      wrap.appendChild(T.grid2(T.field('Mata kuliah', r.nama), T.field('SKS', r.sks)));
      wrap.appendChild(T.grid2(T.field('Nilai', r.grade), T.field('Bobot custom', r.bobot)));
      const delRow = T.el('<div style="text-align:right"></div>');
      delRow.appendChild(r.del);
      wrap.appendChild(delRow);
      r.wrap = wrap;
      rows.push(r);
      listEl.appendChild(wrap);
    }
    const hitung = () => {
      const entries = rows.map((r) => ({
        sks: T.num(r.sks.value),
        bobot: r.grade.value === 'custom' ? T.num(r.bobot.value) : Number(r.grade.value),
      }));
      const valid = entries.filter((e) => e.sks > 0 && !isNaN(e.bobot));
      if (!valid.length) { T.show(box, '<span class="err">Isi minimal satu mata kuliah dengan SKS dan nilai yang valid.</span>'); return; }
      const ipk = utils.ipk(valid);
      const totalSks = valid.reduce((a, e) => a + e.sks, 0);
      const predikat = ipk >= 3.5 ? 'Sangat Memuaskan' : ipk >= 3.0 ? 'Memuaskan' : ipk >= 2.0 ? 'Cukup' : 'Kurang';
      const warna = ipk >= 3.0 ? 'ok' : ipk >= 2.0 ? 'warn' : 'err';
      T.show(box,
        '<div class="center"><div class="dim">Indeks Prestasi Semester</div>' +
        '<div class="big ' + warna + '">' + ipk.toFixed(2) + '</div>' +
        '<div>' + predikat + '</div></div>' +
        '<div class="kv"><span class="k">Total SKS</span><span class="v">' + totalSks + ' SKS</span></div>' +
        '<div class="kv"><span class="k">Jumlah mata kuliah</span><span class="v">' + valid.length + '</span></div>');
    };
    root.appendChild(listEl);
    addRow('Pengantar Ilmu Komputer', 3, '4');
    addRow('Matematika Dasar', 4, '3');
    addRow('Bahasa Inggris', 2, '3.3');
    root.appendChild(T.row(T.btn('+ Tambah mata kuliah', () => addRow()), T.btn('🎓 Hitung IPK', hitung, true)));
    root.appendChild(box);
  
}
