import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"info-makanan","name":"Info Makanan Kemasan","cat":"liveapi","icon":"🍫","desc":"Cek info nutrisi & skor gizi makanan kemasan dari barcode atau nama.","keywords":"makanan,barcode,nutrisi,gizi,kalori,kemasan,openfoodfacts,skor"};

const NS_WARNA = { A: '#2e9e44', B: '#7fbf3f', C: '#f2c200', D: '#ef8b2c', E: '#e5484d' };
const NS_LABEL = { A: 'Sangat baik', B: 'Baik', C: 'Sedang', D: 'Kurang', E: 'Buruk' };

export function render(root) {
  const inp = T.input('text', 'Barcode (cth: 3017620422003) atau nama produk', '');
  const box = T.out();

  const getJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const errText = (e) => {
    if (e && e.name === 'AbortError') return 'Waktu habis — server tidak merespons dalam 15 detik. Periksa koneksi internet lalu coba lagi.';
    if (e && e.status === 429) return 'Rate limit tercapai (429). Tunggu sebentar lalu coba lagi.';
    if (e && e.status) return 'Server mengembalikan HTTP ' + e.status + '. Coba lagi nanti.';
    return 'Gagal memuat data. Periksa koneksi internet lalu coba lagi.';
  };

  const nut = (p, key, satuan) => {
    const v = p && p.nutriments ? p.nutriments[key] : undefined;
    if (v == null || v === '') return '-';
    return (typeof v === 'number' ? Math.round(v * 100) / 100 : v) + ' ' + satuan;
  };

  const tampilkanDetail = (p) => {
    if (!p) { T.show(box, '<span class="err">Detail produk tidak tersedia.</span>'); return; }
    const grade = String(p.nutriscore_grade || '').toUpperCase();
    let html = '<div class="center" style="margin-bottom:12px">';
    const imgUrl = p.image_front_small_url || p.image_front_url || p.image_small_url || '';
    if (imgUrl) {
      html += '<img src="' + esc(imgUrl) + '" alt="' + esc(p.product_name || 'produk') + '" loading="lazy" style="max-width:140px;max-height:180px;object-fit:contain;border-radius:10px;border:1px solid #ffffff20;background:#fff">';
    }
    html += '<div style="font-size:18px;font-weight:700;margin-top:10px">' + esc(p.product_name || 'Tanpa nama') + '</div>';
    if (p.brands) html += '<div class="dim">' + esc(p.brands) + '</div>';
    html += '</div>';
    if (grade && NS_LABEL[grade]) {
      html += '<div class="center" style="margin-bottom:12px">' +
        '<span style="display:inline-block;background:' + NS_WARNA[grade] + ';color:#fff;font-weight:800;font-size:20px;width:44px;height:44px;line-height:44px;border-radius:12px">' + esc(grade) + '</span>' +
        '<div class="dim" style="margin-top:6px">Nutri-Score: ' + esc(NS_LABEL[grade]) + '</div></div>';
    }
    html += '<div class="dim" style="margin-bottom:6px">Nilai gizi per 100 g</div>';
    [
      ['Energi', nut(p, 'energy-kcal_100g', 'kkal')],
      ['Protein', nut(p, 'proteins_100g', 'g')],
      ['Karbohidrat', nut(p, 'carbohydrates_100g', 'g')],
      ['Gula', nut(p, 'sugars_100g', 'g')],
      ['Lemak', nut(p, 'fat_100g', 'g')],
      ['Lemak jenuh', nut(p, 'saturated-fat_100g', 'g')],
      ['Serat', nut(p, 'fiber_100g', 'g')],
      ['Garam', nut(p, 'salt_100g', 'g')],
    ].forEach((r) => {
      html += '<div class="kv"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
    });
    if (p.allergens) {
      html += '<div class="hint">⚠️ Alergen: ' + esc(String(p.allergens).replace(/en:/g, '')) + '</div>';
    }
    html += '<div class="hint">Sumber: Open Food Facts (data komunitas, bisa tidak lengkap).</div>';
    T.show(box, html);
  };

  const detailBarcode = async (barcode) => {
    T.show(box, '<div class="dim center">Mencari barcode ' + esc(barcode) + '…</div>');
    try {
      const d = await getJson('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(barcode) + '.json');
      if (d.status !== 1 || !d.product) {
        T.show(box, '<span class="err">Produk dengan barcode "' + esc(barcode) + '" tidak ditemukan di Open Food Facts.</span>');
        return;
      }
      tampilkanDetail(d.product);
    } catch (e) {
      T.show(box, '<span class="err">' + esc(errText(e)) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', () => detailBarcode(barcode)));
      box.appendChild(wrap);
    }
  };

  const cariNama = async (q) => {
    T.show(box, '<div class="dim center">Mencari "' + esc(q) + '"…</div>');
    try {
      const d = await getJson('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=8');
      const list = (d.products || []).slice(0, 8);
      if (!list.length) {
        T.show(box, '<span class="err">Tidak ada hasil untuk "' + esc(q) + '". Coba kata kunci lain.</span>');
        return;
      }
      T.show(box, '');
      const wrap = T.el('<div></div>');
      wrap.appendChild(T.el('<div class="dim" style="margin-bottom:8px">Ketuk hasil untuk lihat detail:</div>'));
      list.forEach((p) => {
        const b = T.btn((p.product_name || 'Tanpa nama') + (p.brands ? ' — ' + p.brands : ''), () => tampilkanDetail(p));
        b.style.width = '100%';
        b.style.marginBottom = '8px';
        b.style.textAlign = 'left';
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
    } catch (e) {
      T.show(box, '<span class="err">' + esc(errText(e)) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', () => cariNama(q)));
      box.appendChild(wrap);
    }
  };

  const cari = () => {
    const q = inp.value.trim();
    if (!q) { T.show(box, '<span class="err">Isi barcode atau nama produk dulu.</span>'); return; }
    const digits = q.replace(/[\s-]/g, '');
    if (/^[0-9]{6,}$/.test(digits)) detailBarcode(digits);
    else cariNama(q);
  };

  root.appendChild(T.field('Barcode / nama produk', inp, 'Coba: 3017620422003 (Nutella)'));
  root.appendChild(T.row(T.btn('🔍 Cari', cari, true)));
  root.appendChild(box);
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') cari(); });
}
