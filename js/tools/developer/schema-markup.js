import { h as T, kv, esc, errBox, preHtml } from '../../core.js?v=6.13.0';

/* Fungsi murni (bisa diuji dari node tanpa DOM). data: objek field per tipe.
   Mengembalikan { json } bila valid, atau { error } bila ada field wajib kosong. */
export function buildJsonLd(type, d) {
  const need = (v, label) => { if (!String(v == null ? '' : v).trim()) return label; return null; };
  const miss = [];
  let obj = null;
  if (type === 'article') {
    ['Judul', 'Penulis', 'Tanggal terbit'].forEach((l, i) => { const v = [d.title, d.author, d.date][i]; const m = need(v, l); if (m) miss.push(m); });
    if (miss.length) return { error: miss };
    obj = { '@context': 'https://schema.org', '@type': 'Article', headline: d.title.trim(), author: { '@type': 'Person', name: d.author.trim() }, datePublished: d.date.trim() };
    if (d.image && d.image.trim()) obj.image = d.image.trim();
    if (d.desc && d.desc.trim()) obj.description = d.desc.trim();
  } else if (type === 'local') {
    ['Nama usaha', 'Jenis usaha', 'Alamat'].forEach((l, i) => { const v = [d.name, d.kind, d.address][i]; const m = need(v, l); if (m) miss.push(m); });
    if (miss.length) return { error: miss };
    obj = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: d.name.trim(), address: d.address.trim() };
    if (d.kind.trim().toLowerCase() !== 'bisnis lokal') obj['@type'] = d.kind.trim();
    if (d.phone && d.phone.trim()) obj.telephone = d.phone.trim();
    if (d.hours && d.hours.trim()) obj.openingHours = d.hours.trim();
    if (d.url && d.url.trim()) obj.url = d.url.trim();
  } else if (type === 'faq') {
    const items = (d.items || []).filter((q) => q.q.trim() && q.a.trim());
    if (!items.length) return { error: ['Minimal satu pertanyaan dan jawaban yang terisi'] };
    obj = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((q) => ({ '@type': 'Question', name: q.q.trim(), acceptedAnswer: { '@type': 'Answer', text: q.a.trim() } })) };
  } else if (type === 'product') {
    ['Nama produk', 'Harga'].forEach((l, i) => { const v = [d.name, d.price][i]; const m = need(v, l); if (m) miss.push(m); });
    if (miss.length) return { error: miss };
    const price = parseFloat(String(d.price).replace(/\./g, '').replace(',', '.'));
    if (isNaN(price)) return { error: ['Harga harus angka'] };
    obj = { '@context': 'https://schema.org', '@type': 'Product', name: d.name.trim(), offers: { '@type': 'Offer', price: String(price), priceCurrency: d.currency || 'IDR', availability: d.stock === 'out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' } };
    if (d.desc && d.desc.trim()) obj.description = d.desc.trim();
  } else if (type === 'event') {
    ['Nama acara', 'Tanggal mulai', 'Lokasi'].forEach((l, i) => { const v = [d.name, d.start, d.location][i]; const m = need(v, l); if (m) miss.push(m); });
    if (miss.length) return { error: miss };
    obj = { '@context': 'https://schema.org', '@type': 'Event', name: d.name.trim(), startDate: d.start.trim(), location: { '@type': 'Place', name: d.location.trim() } };
    if (d.end && d.end.trim()) obj.endDate = d.end.trim();
    if (d.desc && d.desc.trim()) obj.description = d.desc.trim();
  } else {
    return { error: ['Tipe tidak dikenal'] };
  }
  return { json: obj };
}

export function scriptTag(obj) {
  return '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2) + '\n</script>';
}

export const meta = {"id": "schema-markup", "name": "Schema Markup Generator", "cat": "developer", "icon": "🧩", "desc": "Buat data terstruktur JSON-LD untuk mesin pencari.", "keywords": "schema,json-ld,seo,structured data,google", "since": "6.11.0"};
export function render(root) {
  const fType = T.select([
    ['article', 'Artikel'],
    ['local', 'Bisnis Lokal'],
    ['faq', 'Tanya Jawab (FAQ)'],
    ['product', 'Produk'],
    ['event', 'Acara'],
  ], 'article');
  const formBox = T.el('<div></div>');
  const outBox = T.out();
  const prevBox = T.out();
  let fields = {};
  let faqItems = [{ q: '', a: '' }];

  const mk = (key, el) => { fields[key] = el; return el; };
  const dateIn = (key, val) => { const i = T.input('date', '', val || ''); return mk(key, i); };

  const paintFaq = () => {
    const list = formBox.querySelector('[data-faq-list]');
    if (!list) return;
    list.innerHTML = '';
    faqItems.forEach((it, i) => {
      const wrap = T.el('<div style="background:#131316;border:1px solid #27272a;border-radius:8px;padding:10px;margin-bottom:8px"></div>');
      const q = T.input('text', 'Pertanyaan ' + (i + 1), it.q);
      q.addEventListener('input', () => { it.q = q.value; });
      const a = T.ta(2, 'Jawaban ' + (i + 1), it.a);
      a.addEventListener('input', () => { it.a = a.value; });
      const del = T.btn('Hapus pasangan ini', () => { faqItems.splice(i, 1); if (!faqItems.length) faqItems.push({ q: '', a: '' }); paintFaq(); });
      del.style.marginTop = '6px';
      wrap.appendChild(T.field('Pertanyaan', q));
      wrap.appendChild(T.field('Jawaban', a));
      wrap.appendChild(del);
      list.appendChild(wrap);
    });
  };

  const paintForm = () => {
    fields = {};
    formBox.innerHTML = '';
    const t = fType.value;
    if (t === 'article') {
      formBox.appendChild(T.field('Judul artikel', mk('title', T.input('text', 'Judul artikelmu', ''))));
      formBox.appendChild(T.grid2(
        T.field('Penulis', mk('author', T.input('text', 'Nama penulis', ''))),
        T.field('Tanggal terbit', dateIn('date'))
      ));
      formBox.appendChild(T.field('URL gambar utama (opsional)', mk('image', T.input('text', 'https://…', ''))));
      formBox.appendChild(T.field('Ringkasan singkat (opsional)', mk('desc', T.ta(2, 'Satu atau dua kalimat tentang isi artikel'))));
    } else if (t === 'local') {
      formBox.appendChild(T.grid2(
        T.field('Nama usaha', mk('name', T.input('text', 'Nama toko atau usaha', ''))),
        T.field('Jenis usaha', mk('kind', T.input('text', 'Misal: Restoran, Salon, Bengkel', '')))
      ));
      formBox.appendChild(T.field('Alamat lengkap', mk('address', T.input('text', 'Jalan, kota, kode pos', ''))));
      formBox.appendChild(T.grid2(
        T.field('Nomor telepon (opsional)', mk('phone', T.input('text', '+62…', ''))),
        T.field('Jam buka (opsional)', mk('hours', T.input('text', 'Misal: Mo-Fr 09:00-17:00', '')))
      ));
      formBox.appendChild(T.field('Alamat situs (opsional)', mk('url', T.input('text', 'https://…', ''))));
    } else if (t === 'faq') {
      const list = T.el('<div data-faq-list></div>');
      formBox.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tambahkan pasangan tanya jawab. Mesin pencari bisa menampilkan daftar ini langsung di hasil pencarian.</p>'));
      formBox.appendChild(list);
      formBox.appendChild(T.row(T.btn('Tambah Tanya Jawab', () => { faqItems.push({ q: '', a: '' }); paintFaq(); })));
      paintFaq();
    } else if (t === 'product') {
      formBox.appendChild(T.field('Nama produk', mk('name', T.input('text', 'Nama produk', ''))));
      const fPrice = T.input('text', 'Misal: 150000', '');
      fPrice.inputMode = 'decimal';
      formBox.appendChild(T.grid2(
        T.field('Harga', mk('price', fPrice)),
        T.field('Mata uang', mk('currency', T.select([['IDR', 'Rupiah (IDR)'], ['USD', 'Dolar AS (USD)'], ['EUR', 'Euro (EUR)'], ['SGD', 'Dolar Singapura (SGD)']], 'IDR')))
      ));
      formBox.appendChild(T.field('Stok', mk('stock', T.select([['in', 'Tersedia'], ['out', 'Habis']], 'in'))));
      formBox.appendChild(T.field('Deskripsi singkat (opsional)', mk('desc', T.ta(2, 'Apa produk ini, dalam satu atau dua kalimat'))));
    } else if (t === 'event') {
      formBox.appendChild(T.field('Nama acara', mk('name', T.input('text', 'Nama acara', ''))));
      formBox.appendChild(T.grid2(
        T.field('Tanggal mulai', dateIn('start')),
        T.field('Tanggal selesai (opsional)', dateIn('end'))
      ));
      formBox.appendChild(T.field('Lokasi', mk('location', T.input('text', 'Nama tempat atau alamat acara', ''))));
      formBox.appendChild(T.field('Deskripsi singkat (opsional)', mk('desc', T.ta(2, 'Acara ini tentang apa'))));
    }
  };

  const collect = () => {
    const d = {};
    Object.keys(fields).forEach((k) => { d[k] = fields[k].value; });
    if (fType.value === 'faq') d.items = faqItems;
    return d;
  };

  const previewHtml = (type, obj) => {
    let body = '';
    if (type === 'article') body = '<div style="font-size:14px;font-weight:600">' + esc(obj.headline) + '</div><div class="hint">Oleh ' + esc(obj.author.name) + ' · ' + esc(obj.datePublished) + '</div>';
    else if (type === 'local') body = '<div style="font-size:14px;font-weight:600">' + esc(obj.name) + '</div><div class="hint">' + esc(obj.address) + (obj.telephone ? ' · ' + esc(obj.telephone) : '') + '</div>';
    else if (type === 'faq') body = obj.mainEntity.map((q) => '<div style="margin-bottom:8px"><div style="font-size:13px;font-weight:600">' + esc(q.name) + '</div><div class="hint">' + esc(q.acceptedAnswer.text) + '</div></div>').join('');
    else if (type === 'product') body = '<div style="font-size:14px;font-weight:600">' + esc(obj.name) + '</div><div class="hint">Harga: ' + esc(obj.offers.priceCurrency) + ' ' + esc(obj.offers.price) + ' · ' + (obj.offers.availability.indexOf('OutOfStock') > -1 ? 'Habis' : 'Tersedia') + '</div>';
    else if (type === 'event') body = '<div style="font-size:14px;font-weight:600">' + esc(obj.name) + '</div><div class="hint">' + esc(obj.startDate) + ' · ' + esc(obj.location.name) + '</div>';
    return '<div style="background:#131316;border:1px solid #27272a;border-radius:8px;padding:12px">' + body + '</div><div class="hint" style="margin-top:6px">Ringkasan isi datanya. Tampilan asli di hasil pencarian ditentukan mesin pencari.</div>';
  };

  fType.addEventListener('change', () => { paintForm(); T.hide(outBox); T.hide(prevBox); });
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Schema adalah keterangan tambahan di kode halaman yang membantu mesin pencari memahami isi situsmu. Isi formulirnya, lalu tempel kode yang dihasilkan ke dalam halamanmu.</p>'));
  root.appendChild(T.field('Jenis konten', fType, 'Pilih yang paling cocok dengan halamanmu.'));
  root.appendChild(formBox);
  root.appendChild(T.row(
    T.btn('Generate', () => {
      const r = buildJsonLd(fType.value, collect());
      if (r.error) { T.show(outBox, errBox('Lengkapi dulu: ' + r.error.join(', ') + '.')); T.hide(prevBox); return; }
      T.show(outBox, preHtml(scriptTag(r.json)));
      T.show(prevBox, previewHtml(fType.value, r.json));
    }, true),
    T.copyBtn(() => { const r = buildJsonLd(fType.value, collect()); return r.json ? scriptTag(r.json) : ''; }, 'Salin Kode'),
    T.dlBtn('schema-ld.html', () => { const r = buildJsonLd(fType.value, collect()); return r.json ? scriptTag(r.json) : ''; }, 'text/html', 'Unduh Kode')
  ));
  root.appendChild(prevBox);
  root.appendChild(outBox);
  paintForm();
}
