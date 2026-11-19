import { h as T, errBox } from '../../core.js';

// Validator Email & URL (sintaks + struktur, tanpa kirim apa pun ke
// internet). Email dicek per aturan umum alamat surat (bukan RFC 5322
// penuh: alamat IP literal dan quoted-string tidak didukung, dan itu
// ditulis jujur). URL dicek lewat parser URL bawaan browser + aturan
// tambahan. 100% client-side.

// --- Email ---
const KARAKTER_LOKAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const LABEL_DOMAIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

export function validasiEmail(masukan) {
  const s = String(masukan == null ? '' : masukan).trim();
  const alasan = [];
  if (!s) return { valid: false, alasan: ['Alamat emailnya kosong.'], email: '' };
  if (s.length > 254) alasan.push('Alamatnya lebih dari 254 karakter.');
  if (/\s/.test(s)) alasan.push('Ada spasi di dalam alamat.');
  const jumlahAt = (s.match(/@/g) || []).length;
  if (jumlahAt === 0) alasan.push('Tidak ada tanda @.');
  if (jumlahAt > 1) alasan.push('Ada lebih dari satu tanda @.');
  if (jumlahAt !== 1) return { valid: false, alasan, email: s };
  const [lokal, domain] = s.split('@');
  if (!lokal) alasan.push('Tidak ada nama sebelum @.');
  else {
    if (lokal.length > 64) alasan.push('Nama sebelum @ lebih dari 64 karakter.');
    if (!KARAKTER_LOKAL.test(lokal)) alasan.push('Nama sebelum @ memakai karakter yang tidak diizinkan.');
    if (lokal.startsWith('.') || lokal.endsWith('.')) alasan.push('Nama sebelum @ tidak boleh diawali atau diakhiri titik.');
    if (lokal.includes('..')) alasan.push('Nama sebelum @ tidak boleh ada dua titik berurutan.');
  }
  if (!domain) alasan.push('Tidak ada domain sesudah @.');
  else {
    if (domain.length > 253) alasan.push('Domainnya lebih dari 253 karakter.');
    if (domain.startsWith('.') || domain.endsWith('.')) alasan.push('Domain tidak boleh diawali atau diakhiri titik.');
    if (domain.includes('..')) alasan.push('Domain tidak boleh ada dua titik berurutan.');
    if (domain.startsWith('[')) {
      alasan.push('Alamat IP literal (mis. user@[1.2.3.4]) tidak didukung di sini.');
    } else {
      const label = domain.split('.');
      if (label.length < 2) alasan.push('Domain harus punya titik, mis. nama.com.');
      for (const l of label) {
        if (!l) { alasan.push('Ada bagian domain yang kosong.'); break; }
        if (l.length > 63) { alasan.push('Ada bagian domain yang lebih dari 63 karakter.'); break; }
        if (!LABEL_DOMAIN.test(l)) { alasan.push('Bagian domain "' + l + '" tidak valid (hanya huruf, angka, dan tanda hubung di tengah).'); break; }
      }
      const tld = label[label.length - 1] || '';
      if (label.length >= 2 && !/^[A-Za-z]{2,}$/.test(tld)) alasan.push('Akhiran domain harus huruf semua dan minimal 2 huruf, mis. .com atau .id.');
    }
  }
  return { valid: alasan.length === 0, alasan, email: s };
}

// --- URL ---
const SKEMA_IZIN = new Set(['http:', 'https:', 'ftp:']);

export function validasiUrl(masukan) {
  const s = String(masukan == null ? '' : masukan).trim();
  const alasan = [];
  if (!s) return { valid: false, alasan: ['URL-nya kosong.'], url: '', bagian: null };
  if (/\s/.test(s)) alasan.push('Ada spasi di dalam URL.');
  let u = null;
  try {
    u = new URL(s);
  } catch (e) {
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(s)) alasan.push('Tidak ada skema (mis. https://). Coba tambah https:// di depan.');
    else alasan.push('Format URL-nya tidak benar.');
    return { valid: false, alasan, url: s, bagian: null };
  }
  if (!SKEMA_IZIN.has(u.protocol)) alasan.push('Skema "' + u.protocol.replace(':', '') + '" tidak didukung di sini (hanya http, https, ftp).');
  if (!u.hostname) alasan.push('Tidak ada nama host (mis. example.com).');
  else {
    if (u.hostname.startsWith('.') || u.hostname.endsWith('.')) alasan.push('Nama host tidak boleh diawali atau diakhiri titik.');
    if (u.hostname.includes('..')) alasan.push('Nama host tidak boleh ada dua titik berurutan.');
    if (/[^A-Za-z0-9.\-:\[\]]/.test(u.hostname)) alasan.push('Nama host memakai karakter yang tidak diizinkan.');
  }
  const bagian = {
    skema: u.protocol.replace(':', ''),
    host: u.hostname,
    port: u.port || '(bawaan)',
    path: u.pathname || '/',
    query: u.search ? u.search.slice(1) : '(tidak ada)',
    hash: u.hash ? u.hash.slice(1) : '(tidak ada)',
  };
  return { valid: alasan.length === 0, alasan, url: s, bagian };
}

// Validasi daftar (satu per baris). Mode 'email' | 'url'.
export function validasiBatch(teks, mode) {
  const baris = String(teks == null ? '' : teks).split('\n').map((b) => b.trim()).filter((b) => b !== '');
  return baris.map((b) => {
    const hasil = mode === 'url' ? validasiUrl(b) : validasiEmail(b);
    return { masukan: b, valid: hasil.valid, alasan: hasil.alasan };
  });
}

export const meta = { id: 'validator-email-url', name: 'Validator Email & URL', cat: 'developer', icon: '✅', desc: 'Cek format email dan URL: valid atau tidak, plus alasan dan rincian bagiannya. Bisa cek banyak sekaligus.', keywords: 'validator,email,url,validasi,cek format,email valid,url valid', since: '6.19.0' };

export function render(root) {
  const modeSel = T.select([['email', 'Email'], ['url', 'URL']], 'email');
  const inp = T.input('text', 'Mis. nama@example.com');
  const box = T.out();
  const batchTa = T.ta(6, 'Satu email/URL per baris untuk cek banyak sekaligus…');
  const batchBox = T.out();

  const hasilHtml = (hasil, mode) => {
    if (hasil.valid) {
      let html = '<p><span class="ok">Valid.</span> Formatnya benar.</p>';
      if (mode === 'url' && hasil.bagian) {
        const b = hasil.bagian;
        html += '<div class="kv"><span class="k">Skema</span><span class="v">' + T.esc(b.skema) + '</span></div>' +
          '<div class="kv"><span class="k">Host</span><span class="v">' + T.esc(b.host) + '</span></div>' +
          '<div class="kv"><span class="k">Port</span><span class="v">' + T.esc(b.port) + '</span></div>' +
          '<div class="kv"><span class="k">Path</span><span class="v">' + T.esc(b.path) + '</span></div>' +
          '<div class="kv"><span class="k">Query</span><span class="v">' + T.esc(b.query) + '</span></div>' +
          '<div class="kv"><span class="k">Hash</span><span class="v">' + T.esc(b.hash) + '</span></div>';
      }
      return html;
    }
    return '<p><span style="color:var(--err)">Tidak valid.</span></p><ul style="margin:6px 0 0;padding-left:18px;line-height:1.7">' +
      hasil.alasan.map((a) => '<li>' + T.esc(a) + '</li>').join('') + '</ul>';
  };

  const cek = () => {
    const mode = modeSel.value;
    const nilai = inp.value.trim();
    if (!nilai) { T.show(box, errBox(mode === 'url' ? 'Tulis dulu URL-nya.' : 'Tulis dulu emailnya.')); return; }
    const hasil = mode === 'url' ? validasiUrl(nilai) : validasiEmail(nilai);
    T.show(box, hasilHtml(hasil, mode));
  };

  const cekBatch = () => {
    const mode = modeSel.value;
    const hasil = validasiBatch(batchTa.value, mode);
    if (!hasil.length) { T.show(batchBox, errBox('Tulis dulu daftarnya, satu per baris.')); return; }
    const jumlahValid = hasil.filter((h) => h.valid).length;
    let html = '<p>' + T.fmt(jumlahValid) + ' dari ' + T.fmt(hasil.length) + ' valid.</p>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.6"><tbody>';
    for (const h of hasil) {
      html += '<tr style="border-bottom:1px solid var(--line)"><td style="padding:5px 8px;word-break:break-all">' + T.esc(h.masukan) + '</td>' +
        '<td style="padding:5px 8px;white-space:nowrap">' + (h.valid ? '<span class="ok">Valid</span>' : '<span style="color:var(--err)">Tidak valid</span>') + '</td>' +
        '<td style="padding:5px 8px;color:var(--dim)">' + (h.valid ? '' : T.esc(h.alasan[0] || '')) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    T.show(batchBox, html);
  };

  modeSel.addEventListener('change', () => {
    inp.placeholder = modeSel.value === 'url' ? 'Mis. https://example.com/jalan?q=1' : 'Mis. nama@example.com';
    inp.value = '';
    T.hide(box);
    T.hide(batchBox);
  });

  root.appendChild(T.el('<p class="hint">Cek ini hanya soal format dan struktur, bukan soal apakah email atau situsnya benar-benar ada. Tidak ada yang dikirim ke internet.</p>'));
  root.appendChild(T.field('Yang dicek', modeSel));
  root.appendChild(T.field('Email atau URL', inp));
  root.appendChild(T.row(T.btn('Cek', cek, true)));
  root.appendChild(box);
  root.appendChild(T.field('Cek banyak sekaligus', batchTa));
  root.appendChild(T.row(T.btn('Cek daftar', cekBatch)));
  root.appendChild(batchBox);
  root.appendChild(T.el('<p class="hint" style="margin-top:12px">Batas yang perlu kamu tahu: alamat IP literal (user@[1.2.3.4]) dan nama berpetik ("nama"@example.com) tidak didukung di sini. Skema URL yang diterima: http, https, dan ftp.</p>'));
}
