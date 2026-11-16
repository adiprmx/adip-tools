import { h as T, esc } from '../../core.js?v=6.12.2';

export const meta = {"id":"wilayah-indonesia","name":"Wilayah Indonesia","cat":"liveapi","icon":"🗺️","desc":"Jelajahi provinsi, kabupaten/kota, kecamatan & kelurahan/desa se-Indonesia.","keywords":"wilayah,provinsi,kabupaten,kota,kecamatan,kelurahan,desa,kode wilayah,indonesia","since":"6.12.0"};

const API = 'https://www.emsifa.com/api-wilayah-indonesia/api/';

export function render(root) {
  const box = T.out();
  const cache = new Map();

  const isiSelect = (sel, items, placeholder) => {
    sel.innerHTML = '';
    const o0 = document.createElement('option');
    o0.value = ''; o0.textContent = placeholder;
    sel.appendChild(o0);
    items.forEach((it) => {
      const o = document.createElement('option');
      o.value = it.id; o.textContent = it.name;
      sel.appendChild(o);
    });
    sel.disabled = false;
  };

  const resetSelect = (sel, placeholder) => {
    sel.innerHTML = '';
    const o0 = document.createElement('option');
    o0.value = ''; o0.textContent = placeholder;
    sel.appendChild(o0);
    sel.disabled = true;
  };

  const ambil = async (url) => {
    if (cache.has(url)) return cache.get(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const j = await res.json();
      cache.set(url, j);
      return j;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };

  const namaDipilih = (sel) => (sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].textContent : '');

  const tampilRingkasan = () => {
    const p = namaDipilih(selProv), k = namaDipilih(selKab), c = namaDipilih(selKec), d = namaDipilih(selDesa);
    if (!p && !k && !c && !d) { T.show(box, '<div class="dim center">Pilih provinsi untuk mulai menjelajah.</div>'); return; }
    const kode = d ? selDesa.value : c ? selKec.value : k ? selKab.value : selProv.value;
    let html = '<div class="center"><div class="dim">Wilayah terpilih</div>' +
      '<div style="font-weight:700;font-size:15px">' + esc([d, c, k, p].filter(Boolean).join(', ')) + '</div>' +
      '<div class="dim">Kode wilayah: ' + esc(kode) + '</div></div>';
    const rows = [['Provinsi', p], ['Kabupaten/Kota', k], ['Kecamatan', c], ['Kelurahan/Desa', d]];
    rows.forEach((r) => {
      if (r[1]) html += '<div class="kv"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
    });
    T.show(box, html);
  };

  const gagal = (e, ulang) => {
    let msg;
    if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
    else msg = 'Gagal memuat data wilayah. Periksa koneksi internet lalu coba lagi.';
    T.show(box, '<span class="err">' + esc(msg) + '</span>');
    const wrap = T.el('<div style="margin-top:8px"></div>');
    wrap.appendChild(T.btn('🔄 Coba lagi', ulang));
    box.appendChild(wrap);
  };

  const selProv = T.select([], '');
  const selKab = T.select([], '');
  const selKec = T.select([], '');
  const selDesa = T.select([], '');
  resetSelect(selProv, 'Memuat provinsi…');
  resetSelect(selKab, 'Pilih provinsi dulu');
  resetSelect(selKec, 'Pilih kabupaten/kota dulu');
  resetSelect(selDesa, 'Pilih kecamatan dulu');

  const muatProvinsi = async () => {
    try {
      const data = await ambil(API + 'provinces.json');
      isiSelect(selProv, data, '-- Pilih provinsi --');
      T.show(box, '<div class="dim center">' + data.length + ' provinsi tersedia. Pilih provinsi untuk mulai.</div>');
    } catch (e) { gagal(e, muatProvinsi); }
  };

  selProv.addEventListener('change', async () => {
    resetSelect(selKab, 'Memuat…'); resetSelect(selKec, 'Pilih kabupaten/kota dulu'); resetSelect(selDesa, 'Pilih kecamatan dulu');
    tampilRingkasan();
    if (!selProv.value) return;
    try {
      const data = await ambil(API + 'regencies/' + selProv.value + '.json');
      if (!data.length) { T.show(box, '<div class="dim center">Tidak ada kabupaten/kota untuk provinsi ini.</div>'); return; }
      isiSelect(selKab, data, '-- Pilih kabupaten/kota --');
    } catch (e) { gagal(e, () => selProv.dispatchEvent(new Event('change'))); }
  });

  selKab.addEventListener('change', async () => {
    resetSelect(selKec, 'Memuat…'); resetSelect(selDesa, 'Pilih kecamatan dulu');
    tampilRingkasan();
    if (!selKab.value) return;
    try {
      const data = await ambil(API + 'districts/' + selKab.value + '.json');
      if (!data.length) { T.show(box, '<div class="dim center">Tidak ada kecamatan untuk kabupaten/kota ini.</div>'); return; }
      isiSelect(selKec, data, '-- Pilih kecamatan --');
    } catch (e) { gagal(e, () => selKab.dispatchEvent(new Event('change'))); }
  });

  selKec.addEventListener('change', async () => {
    resetSelect(selDesa, 'Memuat…');
    tampilRingkasan();
    if (!selKec.value) return;
    try {
      const data = await ambil(API + 'villages/' + selKec.value + '.json');
      if (!data.length) { T.show(box, '<div class="dim center">Tidak ada kelurahan/desa untuk kecamatan ini.</div>'); return; }
      isiSelect(selDesa, data, '-- Pilih kelurahan/desa --');
    } catch (e) { gagal(e, () => selKec.dispatchEvent(new Event('change'))); }
  });

  selDesa.addEventListener('change', tampilRingkasan);

  root.appendChild(T.field('Provinsi', selProv));
  root.appendChild(T.field('Kabupaten / Kota', selKab));
  root.appendChild(T.field('Kecamatan', selKec));
  root.appendChild(T.field('Kelurahan / Desa', selDesa));
  root.appendChild(box);
  muatProvinsi();
}
