import { h as T, utils, dlNodePng } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node).
utils.TIER_LIST_BARIS = ['S', 'A', 'B', 'C', 'D', 'F'];
utils.WARNA_TIER = { S: '#ff7f7f', A: '#ffbf7f', B: '#ffdf7f', C: '#ffff7f', D: '#bfff7f', F: '#7fbfff' };
utils.pindahTier = function (item, barisBaru) {
  if (barisBaru !== 'pool' && !utils.TIER_LIST_BARIS.includes(barisBaru)) return item;
  return { ...item, baris: barisBaru };
};

export const meta = {"id": "tier-list", "name": "Tier List", "cat": "fun", "icon": "📊", "desc": "Susun peringkat favoritmu dari S sampai F.", "keywords": "tier list,peringkat,favorit,ranking,s a b c d f,makanan,film", "since": "6.11.0"};

export function render(root) {
  const judul = T.input('text', 'Contoh: Makanan favorit', 'Tier List');
  const itemBaru = T.input('text', 'Contoh: Rendang (boleh pakai emoji 🍔)', '');
  const box = T.out();
  const papan = T.el('<div style="margin:16px 0"></div>');
  const KUNCI = 'at-tier-list';
  let state = { judul: 'Tier List', item: [] };
  try {
    const simpan = JSON.parse(localStorage.getItem(KUNCI) || 'null');
    if (simpan && Array.isArray(simpan.item)) state = simpan;
  } catch (e) { state = { judul: 'Tier List', item: [] }; }
  if (state.judul) judul.value = state.judul;

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  }

  function chip(it) {
    const c = T.el('<span style="display:inline-flex;align-items:center;gap:4px;background:#1c1c1c;border:1px solid #3a3a3a;border-radius:8px;padding:5px 6px;font-size:14px;margin:3px"></span>');
    c.appendChild(T.el(`<span>${it.teks}</span>`));
    const pilih = document.createElement('select');
    pilih.style.cssText = 'background:#2a2a2a;color:#fff;border:1px solid #3a3a3a;border-radius:6px;font-size:12px;padding:2px 4px';
    [['pool', 'Pool'], ...utils.TIER_LIST_BARIS.map((t) => [t, t])].forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (v === it.baris) o.selected = true;
      pilih.appendChild(o);
    });
    pilih.addEventListener('change', () => {
      it.baris = pilih.value;
      simpan();
      tampil();
    });
    c.appendChild(pilih);
    const hapus = T.el('<button style="background:none;border:none;color:#f87171;cursor:pointer;font-size:14px;padding:0 2px">×</button>');
    hapus.addEventListener('click', () => {
      state.item = state.item.filter((x) => x !== it);
      simpan();
      tampil();
    });
    c.appendChild(hapus);
    return c;
  }

  function tampil() {
    papan.innerHTML = '';
    const judulEl = T.el(`<h3 style="margin-bottom:12px">${judul.value.trim() || 'Tier List'}</h3>`);
    papan.appendChild(judulEl);
    utils.TIER_LIST_BARIS.forEach((t) => {
      const baris = T.el('<div style="display:flex;min-height:56px;border:1px solid #2a2a2a;border-bottom:none"></div>');
      const label = T.el(`<div style="width:44px;min-width:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#111;background:${utils.WARNA_TIER[t]}">${t}</div>`);
      baris.appendChild(label);
      const isi = T.el('<div style="flex:1;padding:6px;background:#111"></div>');
      state.item.filter((it) => it.baris === t).forEach((it) => isi.appendChild(chip(it)));
      baris.appendChild(isi);
      papan.appendChild(baris);
    });
    const pool = T.el('<div style="border:1px solid #2a2a2a;padding:8px;background:#161616;border-radius:0 0 10px 10px"></div>');
    pool.appendChild(T.el('<div style="font-size:12px;color:#a1a1aa;margin-bottom:4px">Belum dinilai</div>'));
    const poolItem = state.item.filter((it) => it.baris === 'pool');
    if (poolItem.length === 0) pool.appendChild(T.el('<div class="hint">Semua item sudah masuk peringkat.</div>'));
    poolItem.forEach((it) => pool.appendChild(chip(it)));
    papan.appendChild(pool);
    T.show(box, '<div class="hint">Tambahkan item, lalu pindahkan ke peringkat S sampai F lewat pilihan di tiap item. Tier list tersimpan di HP ini.</div>');
  }

  judul.addEventListener('input', () => { state.judul = judul.value; simpan(); tampil(); });

  function tambah() {
    const teks = itemBaru.value.trim();
    if (!teks) { T.toast('Isi dulu nama itemnya'); return; }
    state.item.push({ teks, baris: 'pool' });
    itemBaru.value = '';
    simpan();
    tampil();
  }

  root.appendChild(T.el('<p class="note">Buat daftar peringkat versimu: S paling atas, F paling bawah. Cocok untuk makanan, film, lagu, atau apa pun.</p>'));
  root.appendChild(T.field('Judul tier list', judul));
  root.appendChild(T.field('Tambah item', itemBaru));
  root.appendChild(T.row(
    T.btn('Tambah', tambah, true),
    T.btn('Unduh sebagai gambar', async () => {
      if (state.item.length === 0) { T.toast('Tambahkan item dulu'); return; }
      const ok = await dlNodePng(papan, 'tier-list.png');
      T.toast(ok ? 'Gambar berhasil diunduh' : 'Gambarnya tidak bisa dibuat. Coba lagi.');
    }),
    T.btn('Kosongkan semua', () => {
      state.item = [];
      simpan();
      tampil();
    })
  ));
  root.appendChild(box);
  root.appendChild(papan);
  tampil();
}
