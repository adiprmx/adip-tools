import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"jadwal-siram-tanaman","name":"Jadwal Siram","cat":"sehari","icon":"🪴","desc":"Catat tanamanmu, diingetin kapan waktunya disiram.","keywords":"tanaman,siram,jadwal,berkebun,menyiram,rawat tanaman,air"};

export function render(root) {
  const KEY = 'adip-tools:jadwal-siram-tanaman';
  const DAY = 86400000;
  const p2 = (n) => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const fmtTgl = (iso) => {
    const [y, m, dd] = String(iso).split('-').map(Number);
    const nama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return dd + ' ' + (nama[m - 1] || m) + ' ' + y;
  };
  const sejakHari = (iso) => {
    const [y, m, dd] = String(iso).split('-').map(Number);
    const lalu = Date.UTC(y, m - 1, dd);
    const now = new Date();
    const kini = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((kini - lalu) / DAY));
  };

  let daftar = [];
  try { daftar = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { daftar = []; }
  if (!Array.isArray(daftar)) daftar = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(daftar)); } catch (e) {} };

  const statusOf = (t) => {
    const sejak = sejakHari(t.terakhir);
    if (sejak >= t.interval) {
      const telat = sejak - t.interval;
      return telat > 0
        ? { teks: 'Terlambat ' + telat + ' hari', bg: '#3f1d1d', fg: '#fca5a5' }
        : { teks: 'Waktunya disiram', bg: '#1d3a2a', fg: '#6ee7b7' };
    }
    return { teks: (t.interval - sejak) + ' hari lagi', bg: '#1c2b3a', fg: '#93c5fd' };
  };

  const listBox = T.el('<div></div>');

  const gambar = () => {
    listBox.innerHTML = '';
    if (!daftar.length) {
      listBox.appendChild(T.el('<p class="center mut">Belum ada tanaman. Daftarin dulu yang paling sering kamu lupa siram.</p>'));
      return;
    }
    const urut = daftar
      .map((t, i) => ({ t, i, sisa: t.interval - sejakHari(t.terakhir) }))
      .sort((a, b) => a.sisa - b.sisa);
    urut.forEach(({ t, i }) => {
      const st = statusOf(t);
      const card = T.el('<div class="card" style="margin-bottom:10px;padding:12px"></div>');
      const head = T.el('<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"></div>');
      head.appendChild(T.el('<div style="font-weight:700;flex:1;min-width:0">' + T.esc(t.nama) + '</div>'));
      head.appendChild(T.el('<span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:' + st.bg + ';color:' + st.fg + '">' + T.esc(st.teks) + '</span>'));
      card.appendChild(head);
      card.appendChild(T.el('<div class="mut" style="font-size:12px;margin-bottom:10px">Siram tiap ' + t.interval + ' hari &middot; terakhir ' + T.esc(fmtTgl(t.terakhir)) + '</div>'));
      const siram = T.btn('Sudah disiram hari ini', () => {
        t.terakhir = todayISO();
        save(); gambar();
        T.toast('Siap, ' + t.nama + ' udah disiram. Ketemu lagi ' + t.interval + ' hari lagi.');
      }, true);
      siram.style.cssText = 'flex:1';
      const hapus = T.btn('Hapus', () => { daftar.splice(i, 1); save(); gambar(); });
      card.appendChild(T.row(siram, hapus));
      listBox.appendChild(card);
    });
  };

  const namaIn = T.input('text', 'Nama tanaman, mis. Monstera');
  const intervalIn = T.input('number', 'Tiap berapa hari? mis. 3');
  intervalIn.min = '1';
  const tglIn = T.input('date', 'Terakhir disiram');
  tglIn.value = todayISO();

  const tambah = () => {
    const nama = String(namaIn.value || '').trim();
    const interval = Math.max(1, Math.round(T.num(intervalIn.value) || 0));
    const terakhir = /^\d{4}-\d{2}-\d{2}$/.test(String(tglIn.value || '')) ? tglIn.value : todayISO();
    if (!nama) { T.toast('Isi dulu nama tanamannya'); if (typeof namaIn.focus === 'function') namaIn.focus(); return; }
    if (!(T.num(intervalIn.value) > 0)) { T.toast('Isi interval siramnya (berapa hari)'); return; }
    daftar.push({ nama, interval, terakhir });
    save();
    namaIn.value = ''; intervalIn.value = ''; tglIn.value = todayISO();
    gambar();
    T.toast(nama + ' masuk daftar. Jangan lupa disiram ya.');
  };

  root.appendChild(T.el('<p class="hint">Tanaman yang disiram pas waktunya itu beda auranya. Catat di sini biar nggak ada yang kehausan.</p>'));
  root.appendChild(T.field('Nama tanaman', namaIn));
  root.appendChild(T.grid2(T.field('Siram tiap (hari)', intervalIn), T.field('Terakhir disiram', tglIn)));
  root.appendChild(T.row(T.btn('Tambah tanaman', tambah, true)));
  root.appendChild(T.el('<div style="height:14px"></div>'));
  root.appendChild(listBox);
  gambar();
}
