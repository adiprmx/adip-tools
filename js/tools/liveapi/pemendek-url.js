import { h as T, esc, errBox } from '../../core.js';

// Pemendek tautan lewat is.gd, tanpa key.
// Terverifikasi 17 Nov 2026: /create.php?format=json&url=https://example.com -> 200, CORS *.
// Tautan pendek dibuat oleh layanan is.gd dan mengarah ke alamat aslinya.
export const meta = {"id":"pemendek-url","name":"Pemendek URL","cat":"liveapi","icon":"🔗","desc":"Perpendek tautan panjang menjadi tautan pendek is.gd yang mudah dibagikan.","keywords":"pemendek url,short link,shorten,is.gd,tautan pendek,perpendek link","since":"6.17.0", "online": true};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) throw new Error('http ' + r.status);
    if (j.errormessage) throw new Error('api:' + j.errormessage);
    return j;
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Tempel tautan panjang di sini, contoh: https://example.com/halaman-yang-sangat-panjang');
  inp.setAttribute('inputmode', 'url');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');
  let pendek = '';
  let tombolBtn = null;
  let sibuk = false;

  const buat = async () => {
    if (sibuk) return;
    let u = String(inp.value || '').trim();
    if (!u) { T.show(box, errBox('Tempel tautan dulu.')); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { new URL(u); } catch (e) { T.show(box, errBox('Tautan itu tidak valid. Periksa lagi penulisannya.')); return; }
    // Kunci anti-klik-ganda (RED-G2-09): tombol dimatikan selama request
    // berjalan supaya satu klik tidak membuat banyak tautan pendek.
    sibuk = true;
    if (tombolBtn) tombolBtn.disabled = true;
    T.show(box, '<p class="mut">Memendekkan tautan…</p>');
    try {
      const j = await getJSON('https://is.gd/create.php?format=json&url=' + encodeURIComponent(u));
      if (!j.shorturl || j.shorturl.indexOf('https://') !== 0) throw new Error('bad-data');
      pendek = j.shorturl;
      T.show(box,
        '<div class="center"><div class="dim">Tautan pendekmu</div>' +
        '<div style="font-weight:800;font-size:19px;margin:6px 0;word-break:break-all"><a href="' + esc(pendek) + '" target="_blank" rel="noopener">' + esc(pendek) + '</a></div>' +
        '<div class="dim" style="font-size:12.5px;word-break:break-all">Mengarah ke: ' + esc(u) + '</div></div>' +
        '<div class="center" style="margin-top:12px"></div>' +
        '<p class="hint">Tautan pendek ini dibuat oleh layanan is.gd. Tautan aslinya tetap milik situs yang bersangkutan.</p>');
      const wadah = box.querySelector('.center[style*="margin-top:12px"]');
      if (wadah) wadah.appendChild(T.copyBtn(() => pendek, '📋 Salin tautan pendek'));
    } catch (e) {
      const msg = e.message.indexOf('api:') === 0
        ? 'is.gd menolak tautan ini: ' + e.message.slice(4)
        : e.name === 'AbortError'
          ? 'Waktu habis, server is.gd tidak bisa dihubungi dalam 15 detik.'
          : 'Gagal memendekkan tautan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', buat));
      box.appendChild(wr);
    } finally {
      sibuk = false;
      if (tombolBtn) tombolBtn.disabled = false;
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') buat(); });
  root.appendChild(T.el('<p class="note">Tempel tautan panjang untuk dibuat versi pendeknya. Tautan yang ditempel dikirim ke is.gd dan tautan pendeknya bisa dibuka siapa saja — jangan pakai untuk tautan yang berisi kode rahasia atau undangan pribadi.</p>'));
  root.appendChild(T.field('Tautan panjang', inp, 'Contoh: https://example.com/halaman-panjang'));
  tombolBtn = T.btn('✂️ Pendekkan tautan', buat, true);
  root.appendChild(T.row(tombolBtn));
  root.appendChild(box);
}
