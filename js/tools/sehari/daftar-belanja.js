import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"daftar-belanja","name":"Daftar Belanja","cat":"sehari","icon":"🛒","desc":"Catat belanjaan, centang yang udah dibeli, pantau totalnya.","keywords":"belanja,daftar,shopping,grocery,total,harga,list,pasar"};

export function render(root) {
  const KEY = 'adip-tools:daftar-belanja';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { items = []; }
  if (!Array.isArray(items)) items = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Tulis dulu mau beli apa aja, biar nggak kalap pas udah nyampe toko. Centang yang udah masuk keranjang. 💸</p>'));

  const nama = T.input('text', 'Contoh: beras 5 kg');
  const harga = T.input('text', 'Harga (Rp) — boleh kosong');
  const jumlah = T.input('number', 'Jumlah', '1');
  jumlah.min = '1';

  const sumBox = T.el('<div class="card" hidden style="margin-bottom:10px"></div>');
  const wrap = T.el('<div></div>');

  const subtotal = (it) => (T.num(it.harga) || 0) * Math.max(1, T.num(it.jumlah) || 0);

  const draw = () => {
    wrap.innerHTML = '';
    if (!items.length) {
      wrap.appendChild(T.el('<p class="center mut">Daftarnya masih kosong. Tambahin dulu di atas. 📝</p>'));
      sumBox.hidden = true;
      return;
    }
    items.forEach((it, idx) => {
      const done = !!it.done;
      const line = T.el('<div class="card" style="margin-bottom:8px;padding:10px 12px;display:flex;align-items:center;gap:10px"></div>');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = done;
      cb.title = 'Tandai sudah dibeli';
      cb.style.cssText = 'width:20px;height:20px;flex-shrink:0;accent-color:#4ade80';
      cb.addEventListener('change', () => { it.done = cb.checked; save(); draw(); });
      line.appendChild(cb);
      const mid = T.el('<div style="flex:1;min-width:0"></div>');
      mid.innerHTML = done
        ? '<s class="mut">' + T.esc(it.nama) + '</s>'
        : '<b>' + T.esc(it.nama) + '</b>';
      const per = T.num(it.harga) > 0
        ? T.rp(T.num(it.harga)) + ' × ' + (Math.max(1, T.num(it.jumlah) || 0))
        : '';
      if (per) mid.appendChild(T.el('<div class="mut" style="font-size:11px">' + T.esc(per) + '</div>'));
      line.appendChild(mid);
      const st = T.el('<div style="text-align:right;white-space:nowrap;font-size:13px"></div>');
      st.innerHTML = done ? '<s class="mut">' + T.rp(subtotal(it)) + '</s>' : '<b>' + T.rp(subtotal(it)) + '</b>';
      line.appendChild(st);
      const del = T.btn('✕', () => { items.splice(idx, 1); save(); draw(); });
      del.style.cssText = 'padding:4px 9px';
      del.title = 'Hapus item';
      line.appendChild(del);
      wrap.appendChild(line);
    });

    const total = items.reduce((a, it) => a + subtotal(it), 0);
    const sisa = items.filter((it) => !it.done).reduce((a, it) => a + subtotal(it), 0);
    const nDone = items.filter((it) => it.done).length;
    sumBox.hidden = false;
    sumBox.innerHTML =
      '<div class="kv"><span class="k">Total semua</span><span class="v">' + T.rp(total) + '</span></div>' +
      '<div class="kv"><span class="k">Sisa yang belum dibeli</span><span class="v">' + T.rp(sisa) + '</span></div>' +
      '<div class="hint" style="margin-top:6px">Udah dibeli ' + nDone + ' dari ' + items.length + ' item. ' +
      (sisa === 0 && total > 0 ? 'Lunas semua, tinggal bayar di kasir. 🎉' : 'Semangat, tinggal dikit lagi.') + '</div>';
  };

  const tambah = () => {
    const nm = nama.value.trim();
    if (!nm) { T.toast('Isi dulu nama barangnya'); return; }
    items.push({
      id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999),
      nama: nm,
      harga: T.num(harga.value) || 0,
      jumlah: Math.max(1, Math.round(T.num(jumlah.value) || 1)),
      done: false,
    });
    nama.value = ''; harga.value = ''; jumlah.value = '1';
    nama.focus();
    save(); draw();
  };
  [nama, harga, jumlah].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambah(); }));

  const clearDone = () => {
    if (!items.some((it) => it.done)) { T.toast('Belum ada yang dicentang'); return; }
    if (confirm('Hapus semua item yang sudah dibeli?')) {
      items = items.filter((it) => !it.done);
      save(); draw();
      T.toast('Item yang udah dibeli dihapus');
    }
  };

  root.appendChild(T.grid2(T.field('Nama barang', nama), T.field('Jumlah', jumlah)));
  root.appendChild(T.field('Harga per pcs', harga, 'Kosongin aja kalau belum tahu harganya'));
  root.appendChild(T.row(T.btn('Tambah item', tambah, true), T.btn('Hapus yang sudah dibeli', clearDone)));
  root.appendChild(T.el('<div style="height:12px"></div>'));
  root.appendChild(sumBox);
  root.appendChild(wrap);
  draw();
}
