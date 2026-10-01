import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"jurnal-syukur","name":"Jurnal Syukur","cat":"produktivitas","icon":"🙏","desc":"Tulis 3 hal yang kamu syukuri hari ini, simpel dan menenangkan.","keywords":"jurnal,syukur,gratitude,harian,refleksi,mindfulness,catatan"};

export function render(root) {
  const KEY = 'adip-tools:jurnal-syukur';
  const p2 = (n) => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const fmtTgl = (iso) => {
    try {
      const [y, m, dd] = String(iso).split('-').map(Number);
      return new Date(y, m - 1, dd).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return String(iso); }
  };

  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  const hariIni = todayISO();
  const isi = data[hariIni] || ['', '', ''];
  const tas = [
    T.ta(2, 'Hal pertama yang kamu syukuri hari ini...', isi[0] || ''),
    T.ta(2, 'Hal kedua...', isi[1] || ''),
    T.ta(2, 'Hal ketiga...', isi[2] || ''),
  ];

  const lihatBox = T.out();
  const riwayatBox = T.el('<div></div>');

  const tampilEntri = (iso) => {
    const entri = data[iso] || [];
    const list = entri.filter((x) => String(x || '').trim()).map((x, i) =>
      '<div style="display:flex;gap:10px;margin-bottom:8px"><div class="mut">' + (i + 1) + '.</div><div style="flex:1">' + T.esc(x) + '</div></div>').join('');
    T.show(lihatBox,
      '<div style="font-weight:700;margin-bottom:8px">' + T.esc(fmtTgl(iso)) + '</div>' +
      (list || '<p class="mut">Entri hari itu kosong.</p>'));
  };

  const gambarRiwayat = () => {
    riwayatBox.innerHTML = '';
    const tgls = Object.keys(data)
      .filter((k) => k !== hariIni && Array.isArray(data[k]) && data[k].some((x) => String(x || '').trim()))
      .sort().reverse();
    if (!tgls.length) {
      riwayatBox.appendChild(T.el('<p class="mut" style="font-size:13px">Belum ada riwayat. Mulai dari hari ini — besok udah ada yang bisa dilihat lagi.</p>'));
      return;
    }
    tgls.forEach((iso) => {
      const b = T.btn(fmtTgl(iso), () => tampilEntri(iso));
      b.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:8px';
      riwayatBox.appendChild(b);
    });
  };

  const simpan = () => {
    const vals = tas.map((t) => String(t.value || '').trim());
    if (!vals.some(Boolean)) { T.toast('Tulis minimal satu hal dulu'); return; }
    data[hariIni] = vals;
    save();
    gambarRiwayat();
    tampilEntri(hariIni);
    T.toast('Tersimpan. Hal kecil yang disyukuri, efeknya gede.');
  };

  root.appendChild(T.el('<p class="hint">Nggak perlu puitis. Tiga hal aja — kopi pagi yang pas, chat yang dibales, hujan yang reda pas mau jalan. Tulis, simpan, beres.</p>'));
  tas.forEach((t, i) => root.appendChild(T.field('Hal ' + (i + 1), t)));
  root.appendChild(T.row(T.btn('Simpan hari ini', simpan, true)));
  root.appendChild(T.el('<div style="height:14px"></div>'));
  root.appendChild(lihatBox);
  root.appendChild(T.el('<div class="h3" style="margin:14px 0 8px">Riwayat</div>'));
  root.appendChild(riwayatBox);
  if (isi.some((x) => String(x || '').trim())) tampilEntri(hariIni);
  gambarRiwayat();
}
