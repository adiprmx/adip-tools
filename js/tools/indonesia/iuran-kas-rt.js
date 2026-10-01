import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "iuran-kas-rt", "name": "Iuran Kas RT", "cat": "indonesia", "icon": "🧾", "desc": "Hitung iuran per KK, catat siapa sudah bayar, pantau total terkumpul & penunggak.", "keywords": "iuran,kas,rt,rw,kk,bayar,tagihan,penunggak,dana"};
export function render(root) {
  const KEY = 'iuran-kas-rt';
  const HARI_PENUH = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  let st = null;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') st = s;
  } catch (e) { /* abaikan */ }
  if (!st) st = { target: 300000, jmlKK: 30, tempo: '', warga: [] };
  if (!Array.isArray(st.warga)) st.warga = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* abaikan */ } };

  const targetI = T.input('number', 'cth: 300000', String(st.target)); targetI.inputMode = 'numeric';
  const kkI = T.input('number', 'cth: 30', String(st.jmlKK)); kkI.inputMode = 'numeric';
  const tempoI = T.input('date', '', st.tempo || todayISO());
  const namaI = T.input('text', 'Nama kepala keluarga', '');
  const nominalI = T.input('number', 'cth: 10000', ''); nominalI.inputMode = 'numeric';

  const infoBox = T.out();
  const listBox = T.el('<div></div>');
  const statBox = T.out();

  const perKK = () => {
    const t = T.num(targetI.value);
    const j = Math.floor(T.num(kkI.value) || 0);
    return j > 0 ? t / j : 0;
  };

  const fmtTgl = (iso) => {
    if (!iso) return '—';
    const p = iso.split('-');
    if (p.length !== 3) return iso;
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return HARI_PENUH[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  };

  const stats = () => {
    let terkumpul = 0;
    st.warga.forEach((w) => { terkumpul += T.num(w.nominal) || 0; });
    const target = T.num(targetI.value) || 0;
    const tunggak = st.warga.filter((w) => !w.lunas);
    return { terkumpul, sisa: target - terkumpul, tunggak, target };
  };

  const renderInfo = () => {
    const t = T.num(targetI.value) || 0;
    const j = Math.floor(T.num(kkI.value) || 0);
    const p = perKK();
    const html = '<div style="font-size:13.5px;line-height:1.8">' +
      '<div>Iuran per KK: <b style="font-size:17px">' + T.rp(p) + '</b></div>' +
      '<div class="mut">Jatuh tempo: ' + T.esc(fmtTgl(tempoI.value)) + '</div>' +
      '<div class="mut">(' + T.rp(t) + ' ÷ ' + j + ' KK)</div>' +
      '</div>';
    T.show(infoBox, html);
  };

  // tabel key-value lokal (kvRows tidak ada di namespace h core v6.8.0)
  const kvTable = (pairs) => '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
    pairs.map((p) => '<tr><td style="padding:7px 4px;color:#a8a29e">' + T.esc(p[0]) + '</td>' +
      '<td style="padding:7px 4px;text-align:right;font-weight:600">' + p[1] + '</td></tr>').join('') + '</table>';

  const renderStats = () => {
    const s = stats();
    const rows = [
      ['Target dana', T.rp(s.target)],
      ['Terkumpul (' + st.warga.filter((w) => w.lunas).length + ' KK)', T.rp(s.terkumpul)],
      ['Sisa target', T.rp(s.sisa)],
      ['Penunggak', s.tunggak.length + ' KK'],
    ];
    let html = kvTable(rows);
    if (s.tunggak.length) {
      html += '<p class="mut" style="margin:10px 0 6px;font-weight:600">Daftar penunggak:</p>' +
        '<ul style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.8">' +
        s.tunggak.map((w) => '<li>' + T.esc(w.nama) + '</li>').join('') + '</ul>';
    }
    T.show(statBox, html);
  };

  const renderList = () => {
    listBox.innerHTML = '';
    const p = perKK();
    if (!st.warga.length) {
      listBox.appendChild(T.el('<p class="mut">Belum ada KK. Tambahkan nama di bawah.</p>'));
      return;
    }
    st.warga.forEach((w, i) => {
      const row = T.el('<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"></div>');
      const nama = T.el('<div style="flex:1;font-size:13.5px">' + T.esc(w.nama) + '</div>');
      const nom = T.input('number', 'Rp', String(w.nominal || Math.round(p)));
      nom.inputMode = 'numeric'; nom.style.flex = '0 0 110px';
      const tggl = T.btn(w.lunas ? '✓ Lunas' : 'Belum', () => {
        w.lunas = !w.lunas;
        if (w.lunas) w.nominal = T.num(nom.value) || Math.round(p);
        beep(w.lunas ? 660 : 330, 0.08, 'sine');
        save(); renderList(); renderStats();
      });
      if (w.lunas) tggl.style.borderColor = '#16a34a';
      const del = T.btn('✕', () => { st.warga.splice(i, 1); save(); renderList(); renderStats(); });
      nom.addEventListener('input', () => { w.nominal = T.num(nom.value); save(); renderStats(); });
      row.appendChild(nama); row.appendChild(nom); row.appendChild(tggl); row.appendChild(del);
      listBox.appendChild(row);
    });
  };

  const refresh = () => {
    st.target = T.num(targetI.value) || 0;
    st.jmlKK = Math.floor(T.num(kkI.value) || 0);
    st.tempo = tempoI.value;
    save();
    renderInfo(); renderList(); renderStats();
  };

  [targetI, kkI, tempoI].forEach((el) => el.addEventListener('input', refresh));

  const addWarga = () => {
    const n = namaI.value.trim();
    if (!n) { T.toast('Isi nama dulu'); return; }
    const p = Math.round(perKK());
    const nomVal = T.num(nominalI.value);
    st.warga.push({ nama: n, nominal: nomVal > 0 ? nomVal : p, lunas: false });
    namaI.value = ''; nominalI.value = '';
    save(); renderList(); renderStats();
    beep(520, 0.07, 'sine');
    namaI.focus();
  };

  root.appendChild(T.el('<p class="note">Catat iuran kas RT/RW: hitung iuran per KK otomatis, tandai siapa yang sudah bayar, dan pantau siapa yang menunggak. Data tersimpan di HP kamu.</p>'));
  root.appendChild(T.grid2(
    T.field('Target dana (Rp)', targetI),
    T.field('Jumlah KK', kkI),
    T.field('Jatuh tempo', tempoI)
  ));
  root.appendChild(infoBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Tambah KK</p>'));
  root.appendChild(T.row(namaI, T.btn('＋ Tambah', addWarga, true)));
  root.appendChild(T.field('Nominal per KK ini (Rp) — kosongkan = pakai iuran per KK', nominalI));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Daftar pembayaran (' + (st.warga.length) + ')</p>'));
  root.appendChild(listBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Ringkasan</p>'));
  root.appendChild(statBox);
  namaI.addEventListener('keydown', (e) => { if (e.key === 'Enter') addWarga(); });

  refresh();
}
