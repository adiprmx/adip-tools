import { h as T } from '../../core.js';

/* Konverter HTML -> Markdown, 100% client-side via DOMParser.
   HTML input TIDAK PERNAH dimasukkan ke dokumen hidup — hanya diurai
   jadi struktur lalu dibaca teksnya. Hasilnya teks biasa di textarea. */

const SKEMA_AMAN = /^(https?:|mailto:|#|\/)/i;

function escMd(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/([`*_{}[\]()#+!|])/g, '\\$1');
}

function inlineMd(node) {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) { out += escMd(n.textContent); return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (tag === 'br') { out += '\n'; return; }
    if (tag === 'strong' || tag === 'b') { out += '**' + inlineMd(n) + '**'; return; }
    if (tag === 'em' || tag === 'i') { out += '*' + inlineMd(n) + '*'; return; }
    if (tag === 's' || tag === 'del' || tag === 'strike') { out += '~~' + inlineMd(n) + '~~'; return; }
    if (tag === 'code') { out += '`' + n.textContent.replace(/`/g, "'") + '`'; return; }
    if (tag === 'a') {
      const href = (n.getAttribute('href') || '').trim();
      const teks = inlineMd(n) || href;
      out += (href && SKEMA_AMAN.test(href)) ? '[' + teks + '](' + href + ')' : teks;
      return;
    }
    if (tag === 'img') {
      const src = (n.getAttribute('src') || '').trim();
      const alt = escMd(n.getAttribute('alt') || '');
      out += (src && SKEMA_AMAN.test(src)) ? '![' + alt + '](' + src + ')' : alt;
      return;
    }
    out += inlineMd(n);
  });
  return out;
}

function tabelMd(table) {
  const baris = [...table.querySelectorAll('tr')];
  if (!baris.length) return '';
  const sel = (tr) => [...tr.querySelectorAll('th, td')].map((c) => inlineMd(c).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim());
  const data = baris.map(sel);
  const kolom = Math.max(...data.map((r) => r.length));
  const norm = data.map((r) => { while (r.length < kolom) r.push(''); return r; });
  const garis = (r) => '| ' + r.join(' | ') + ' |';
  const pemisah = '| ' + Array(kolom).fill('---').join(' | ') + ' |';
  const punyaHeader = baris[0].querySelector('th') != null;
  let md = '';
  if (punyaHeader) {
    md = garis(norm[0]) + '\n' + pemisah;
    norm.slice(1).forEach((r) => { md += '\n' + garis(r); });
  } else {
    md = garis(norm[0]) + '\n' + pemisah;
    norm.slice(1).forEach((r) => { md += '\n' + garis(r); });
  }
  return md;
}

const TAG_BLOK = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote', 'pre', 'hr', 'div', 'section', 'article', 'header', 'footer', 'main', 'figure', 'figcaption']);
function punyaAnakBlok(node) {
  return [...node.children].some((c) => TAG_BLOK.has(c.tagName.toLowerCase()));
}

function blokMd(node, kedalaman) {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.textContent.replace(/\s+/g, ' ');
      if (t.trim()) out += escMd(t.trim()) + '\n\n';
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') return;
    if (/^h[1-6]$/.test(tag)) {
      out += '#'.repeat(+tag[1]) + ' ' + inlineMd(n).trim() + '\n\n';
      return;
    }
    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer' || tag === 'main' || tag === 'figure' || tag === 'figcaption') {
      // Tanpa anak blok = konten sebaris (tebal/miring/tautan) -> pakai inlineMd
      // supaya formatnya tidak hilang; bila ada anak blok, proses per blok.
      if (!punyaAnakBlok(n)) {
        const sebaris = inlineMd(n).trim();
        if (sebaris) out += sebaris + '\n\n';
      } else {
        out += blokMd(n, kedalaman);
      }
      return;
    }
    if (tag === 'blockquote') {
      const isi = (punyaAnakBlok(n) ? blokMd(n, kedalaman) : inlineMd(n)).trim();
      if (isi) out += isi.split('\n').map((l) => '> ' + l).join('\n') + '\n\n';
      return;
    }
    if (tag === 'pre') {
      const kode = n.textContent.replace(/^\n+|\s+$/g, '');
      const cls = (n.querySelector('code') && n.querySelector('code').className) || '';
      const bahasa = (cls.match(/language-([\w-]+)/) || [])[1] || '';
      out += '```' + bahasa + '\n' + kode + '\n```\n\n';
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      let i = 0;
      [...n.children].forEach((li) => {
        if (li.tagName.toLowerCase() !== 'li') return;
        i++;
        const penanda = tag === 'ol' ? i + '. ' : '- ';
        const isi = (punyaAnakBlok(li) ? blokMd(li, kedalaman + 1) : inlineMd(li)).trim();
        const indent = '  '.repeat(kedalaman);
        out += isi.split('\n').map((l, j) => (j === 0 ? indent + penanda + l : indent + '  ' + l)).join('\n') + '\n';
      });
      out += '\n';
      return;
    }
    if (tag === 'table') { out += tabelMd(n) + '\n\n'; return; }
    if (tag === 'hr') { out += '---\n\n'; return; }
    if (tag === 'img') { out += inlineMd(n) + '\n\n'; return; }
    out += blokMd(n, kedalaman);
  });
  return out;
}

/** HTML -> Markdown. Butuh DOMParser (tersedia di browser). */
export function htmlKeMarkdown(html) {
  if (typeof DOMParser === 'undefined') throw new Error('Browser ini tidak bisa membaca HTML.');
  // Pagar kedalaman (P4-14): 20.000 div bersarang membekukan tab 15,5 dtk
  // — DOMParser SENDIRI butuh ~14 dtk untuk mem-parse-nya, jadi estimasi
  // dari teks mentah berjalan SEBELUM parse (pagar DOM sesudah parse
  // tetap ada sebagai backstop). Batas 200 = batas json-formatter (P-05)
  // — dokumen HTML wajar jarang melewati 50 tingkat.
  if (estimasiKedalamanHtml(html) > MAKS_KEDALAMAN_HTML) throw new RangeError('HTML terlalu dalam (lebih dari 200 tingkat bersarang)');
  const doc = new DOMParser().parseFromString(String(html == null ? '' : html), 'text/html');
  if (kedalamanDom(doc.body) > MAKS_KEDALAMAN_HTML) throw new RangeError('HTML terlalu dalam (lebih dari 200 tingkat bersarang)');
  const md = blokMd(doc.body, 0);
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

// Pagar kedalaman (P4-14): kedalaman DOM maksimum secara iteratif
// (tumpuk eksplisit — input 20.000 div bersarang tidak boleh stack
// overflow saat diukur). Berhenti awal begitu melewati batas.
const MAKS_KEDALAMAN_HTML = 200;
function kedalamanDom(root) {
  let maks = 0;
  const tumpuk = [[root, 0]];
  while (tumpuk.length) {
    const [n, d] = tumpuk.pop();
    if (d > maks) { maks = d; if (maks > MAKS_KEDALAMAN_HTML) return maks; }
    const anak = n.children;
    for (let i = anak.length - 1; i >= 0; i--) tumpuk.push([anak[i], d + 1]);
  }
  return maks;
}

const TAG_VOID_HTML = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// Estimasi kedalaman tag bersarang dari TEKS mentah (P4-14): DOMParser
// sendiri butuh ~14 dtk untuk 20.000 div bersarang, jadi pagar kedalaman
// sesudah parse tidak cukup — estimasi linear ini berjalan SEBELUM parse
// dan menolak input terlalu dalam tanpa pernah mem-parse-nya. Konservatif
// ke arah menolak: komentar/doctype dilewati, isi <script>/<style>
// dilewati utuh (bisa berisi teks mirip tag), elemen void dan tag
// self-closing tidak menambah kedalaman. Pagar DOM sesudah parse tetap
// ada sebagai backstop bila estimasi meleset ke bawah.
function estimasiKedalamanHtml(html) {
  const s = String(html == null ? '' : html);
  let dalam = 0, maks = 0, i = 0;
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    if (lt === -1) break;
    if (s.startsWith('<!--', lt)) {
      const akhir = s.indexOf('-->', lt + 4);
      i = akhir === -1 ? s.length : akhir + 3;
      continue;
    }
    if (s[lt + 1] === '!' || s[lt + 1] === '?') {
      const akhir = s.indexOf('>', lt + 2);
      i = akhir === -1 ? s.length : akhir + 1;
      continue;
    }
    const gt = s.indexOf('>', lt + 1);
    if (gt === -1) break;
    const tagTeks = s.slice(lt, gt + 1);
    const m = /^<\/?([A-Za-z][A-Za-z0-9-]*)[\s/>]/.exec(tagTeks + ' ');
    if (!m) { i = lt + 1; continue; }
    const tag = m[1].toLowerCase();
    const tutup = tagTeks[1] === '/';
    const selfClose = /\/>$/.test(tagTeks);
    i = gt + 1;
    if (tutup) { if (dalam > 0) dalam--; continue; }
    if (selfClose || TAG_VOID_HTML.has(tag)) continue;
    if (tag === 'script' || tag === 'style') {
      // Cari penutup tanpa menyalin seluruh string (toLowerCase per tag
      // akan kuadratik pada dokumen dengan banyak <script>).
      const reTutup = tag === 'script' ? /<\/script\s*>/gi : /<\/style\s*>/gi;
      reTutup.lastIndex = i;
      const ketemu = reTutup.exec(s);
      i = ketemu ? ketemu.index : s.length;
      continue;
    }
    dalam++;
    if (dalam > maks) { maks = dalam; if (maks > MAKS_KEDALAMAN_HTML) return maks; }
  }
  return maks;
}

export const meta = {"id": "html-ke-markdown", "name": "HTML ke Markdown", "cat": "developer", "icon": "🔀", "desc": "Ubah HTML jadi Markdown (heading, daftar, tabel, tautan, kode). 100% di browser, hasil bisa disalin/unduh.", "keywords": "html,markdown,konverter,md,readme,notion,cms", "since": "6.13.0"};
export function render(root) {

    const inp = T.ta(10, 'Tempel kode HTML di sini, cth:\n<h1>Judul</h1>\n<p>Teks <strong>tebal</strong> dan <a href="https://example.com">tautan</a>.</p>\n<ul><li>Satu</li><li>Dua</li></ul>');
    const outTa = T.ta(10, 'Hasil Markdown muncul di sini…');
    outTa.readOnly = true;
    const box = T.out();

    const konversi = () => {
      const html = inp.value;
      if (!html.trim()) { T.toast('Tempel kode HTML dulu'); return; }
      let md;
      try {
        md = htmlKeMarkdown(html);
      } catch (e) {
        T.show(box, '<span class="err">' + (e instanceof RangeError
          ? 'HTML-nya terlalu dalam (lebih dari 200 tingkat tag bersarang) sehingga tidak bisa diubah. Coba potong bagiannya dulu.'
          : 'HTML-nya tidak bisa dibaca. Cek lagi kodenya — pastikan tag-tagnya lengkap.') + '</span>');
        return;
      }
      if (!md) { T.show(box, '<span class="err">Tidak ada konten yang bisa diubah — HTML-nya kosong atau hanya berisi tag script/style.</span>'); return; }
      outTa.value = md;
      T.show(box,
        '<div class="info" style="font-size:13px;line-height:1.6">✅ Berhasil diubah: ' + md.split('\n').length + ' baris Markdown dari ' + html.length.toLocaleString('id-ID') + ' karakter HTML.</div>' +
        '<p class="hint">Hasil di bawah sudah teks Markdown biasa — aman disalin ke README, Notion, atau CMS. Tautan dengan skema aneh (mis. javascript:) otomatis dibuang demi keamanan.</p>');
    };

    root.appendChild(T.el('<p class="note">Punya konten web yang mau dipindah ke README, Notion, atau CMS berbasis Markdown? Tempel HTML-nya — heading, daftar, tabel, tautan, dan kode ikut keubah. Semua diproses di HP ini.</p>'));
    root.appendChild(T.field('Kode HTML', inp));
    root.appendChild(T.row(
      T.btn('Konversi', konversi, true),
      T.btn('Contoh HTML', () => {
        inp.value = '<h1>Resep Nasi Goreng</h1>\n<p>Nasi goreng <strong>rumahan</strong> yang gampang dibuat, dari <a href="https://example.com">situs resep</a>.</p>\n<h2>Bahan</h2>\n<ul><li>2 piring nasi dingin</li><li>2 butir telur</li><li>3 siung bawang putih</li></ul>\n<h2>Langkah</h2>\n<ol><li>Tumis bawang sampai harum.</li><li>Masukkan telur, orak-arik.</li><li>Masukkan nasi, aduk sampai rata.</li></ol>\n<table><tr><th>Bahan</th><th>Jumlah</th></tr><tr><td>Nasi</td><td>2 piring</td></tr><tr><td>Telur</td><td>2 butir</td></tr></table>';
        konversi();
      })
    ));
    root.appendChild(box);
    root.appendChild(T.field('Hasil Markdown', outTa));
    root.appendChild(T.row(
      T.copyBtn(() => outTa.value, 'Salin'),
      T.dlBtn('hasil.md', () => outTa.value, 'text/markdown;charset=utf-8', 'Unduh .md')
    ));

}
