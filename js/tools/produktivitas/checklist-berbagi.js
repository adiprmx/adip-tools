import { h as T } from '../../core.js';

// Checklist Berbagi: buat daftar centang sendiri, lalu bagikan lewat
// tautan. Isi daftar disimpan di dalam tautannya (hash URL), jadi tidak
// perlu akun dan tidak ada server yang menyimpan datamu. Siapa pun yang
// membuka tautan melihat daftar yang sama, tapi centangannya masing-masing
// (tautan tidak ikut berubah saat penerima mencentang).
export const meta = {"id": "checklist-berbagi", "name": "Checklist Berbagi", "cat": "produktivitas", "icon": "🔗", "desc": "Buat daftar centang lalu bagikan lewat tautan, tanpa akun dan tanpa server.", "keywords": "checklist berbagi,daftar centang,bagi checklist,tautan checklist,todo share,daftar tugas", "since": "6.18.0"};

const LS_KEY = 'adip-tools:checklist-berbagi';
const PREFIX = 'c=';

// Kodekan state jadi teks hash yang aman di URL. Murni, bisa diuji di Node.
export function kodeState(state) {
  const json = JSON.stringify({
    j: String((state && state.judul) || '').slice(0, 100),
    i: (state && Array.isArray(state.items) ? state.items : []).slice(0, 200).map((it) => ({
      t: String(it && it.t || '').slice(0, 200),
      c: !!(it && it.c),
    })),
  });
  let bin = '';
  const bytes = new TextEncoder().encode(json);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Baca kembali state dari teks hash. Murni, bisa diuji di Node.
// Mengembalikan null bila hash bukan checklist yang benar.
export function bacaState(kode) {
  try {
    const s = String(kode || '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const d = JSON.parse(new TextDecoder().decode(bytes));
    if (!d || !Array.isArray(d.i)) return null;
    return {
      judul: typeof d.j === 'string' ? d.j : '',
      items: d.i.filter((it) => it && typeof it.t === 'string').map((it) => ({ t: it.t, c: !!it.c })),
    };
  } catch (e) { return null; }
}

export function tautanBerbagi(state, dasar) {
  return String(dasar || '').split('#')[0] + '#' + PREFIX + kodeState(state);
}

export function render(root) {
  let state = { judul: '', items: [] };
  let dariTautan = false;
  try {
    const h = (typeof location !== 'undefined' ? location.hash || '' : '');
    if (h.startsWith('#' + PREFIX)) {
      const d = bacaState(h.slice(PREFIX.length + 1));
      if (d) { state = d; dariTautan = true; }
    }
  } catch (e) { /* hash rusak, mulai dari kosong */ }
  if (!dariTautan) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.items)) state = { judul: d.judul || '', items: d.items.filter((it) => it && typeof it.t === 'string') };
      }
    } catch (e) { /* penyimpanan bermasalah, mulai dari kosong */ }
  }

  const judulI = T.input('text', 'cth: Belanja mingguan', state.judul);
  const baruI = T.input('text', 'Tulis satu hal, lalu tekan Tambah', '');
  const progBox = T.out();
  const listBox = T.out();
  const linkBox = T.out();
  const kosongBox = T.out();

  const simpanLokal = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  };

  const gambar = () => {
    const total = state.items.length;
    const selesai = state.items.filter((it) => it.c).length;
    if (!total) {
      T.hide(progBox);
      T.show(kosongBox, '<p class="note center">Belum ada isi. Tulis satu hal di bawah lalu tekan Tambah.</p>');
    } else {
      T.hide(kosongBox);
      const persen = Math.round((selesai / total) * 100);
      T.show(progBox, '<div class="dim" style="margin-bottom:6px">' + selesai + ' dari ' + total + ' selesai (' + persen + '%)</div>' +
        '<div style="height:10px;border-radius:6px;background:rgba(127,127,127,.18);overflow:hidden"><div style="height:100%;width:' + persen + '%;border-radius:6px;background:#4ade80;transition:width .25s"></div></div>');
    }
    T.show(listBox, '');
    state.items.forEach((it, idx) => {
      const baris = T.el('<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(127,127,127,.15)"></div>');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!it.c;
      cb.setAttribute('aria-label', 'Centang: ' + it.t);
      cb.addEventListener('change', () => { state.items[idx].c = cb.checked; simpanLokal(); gambar(); });
      const teks = T.el('<span style="flex:1;word-break:break-word' + (it.c ? ';text-decoration:line-through;opacity:.6' : '') + '"></span>');
      teks.textContent = it.t;
      const hapus = T.btn('✕', () => { state.items.splice(idx, 1); simpanLokal(); gambar(); });
      hapus.setAttribute('aria-label', 'Hapus: ' + it.t);
      baris.appendChild(cb);
      baris.appendChild(teks);
      baris.appendChild(hapus);
      listBox.appendChild(baris);
    });
    T.hide(linkBox);
  };

  const tambah = () => {
    const t = baruI.value.trim();
    if (!t) { T.toast('Tulis dulu isinya'); return; }
    if (state.items.length >= 200) { T.toast('Daftar sudah penuh (200 butir)'); return; }
    state.items.push({ t, c: false });
    baruI.value = '';
    simpanLokal();
    gambar();
    baruI.focus();
  };

  const buatTautan = () => {
    state.judul = judulI.value.trim();
    if (!state.items.length) { T.toast('Isi daftarnya dulu sebelum dibagikan'); return; }
    const dasar = typeof location !== 'undefined' ? location.href : '';
    const url = tautanBerbagi(state, dasar);
    if (url.length > 8000) {
      T.show(linkBox, '<div class="err">Daftarnya terlalu panjang untuk jadi tautan (' + T.fmt(url.length) + ' karakter). Kurangi isi atau judulnya.</div>');
      return;
    }
    T.show(linkBox, '<p class="note">Tautan ini berisi seluruh isi daftar. Siapa pun yang membukanya melihat daftar yang sama.</p>' +
      '<pre style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12px;line-height:1.5;max-height:120px;overflow:auto">' + T.esc(url) + '</pre>');
    linkBox.appendChild(T.copyBtn(() => url, 'Salin Tautan'));
  };

  baruI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tambah(); } });
  judulI.addEventListener('input', () => { state.judul = judulI.value.trim(); simpanLokal(); });

  root.appendChild(T.el('<p class="note">Isi daftar tersimpan di dalam tautannya sendiri, jadi tidak perlu akun dan tidak ada server yang menyimpan datamu. Penerima melihat daftar yang sama, tapi centangannya masing-masing.</p>'));
  if (dariTautan) root.appendChild(T.el('<p class="note">Daftar ini dibuka dari tautan berbagi. Kamu bisa mengubahnya, lalu buat tautan baru untuk dibagikan lagi.</p>'));
  root.appendChild(T.field('Judul daftar (boleh kosong)', judulI));
  root.appendChild(progBox);
  root.appendChild(listBox);
  root.appendChild(kosongBox);
  root.appendChild(T.row(T.field('Tambah butir', baruI), T.btn('Tambah', tambah, true)));
  root.appendChild(T.row(
    T.btn('Buat Tautan Berbagi', buatTautan, true),
    T.btn('Bersihkan Semua', () => { state.items = []; state.judul = ''; judulI.value = ''; simpanLokal(); gambar(); }),
  ));
  root.appendChild(linkBox);
  gambar();
}
