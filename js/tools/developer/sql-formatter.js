import { h as T, utils, errBox, esc, preHtml } from '../../core.js';

// Bagi SQL jadi segmen: "kode" (boleh diformat) vs "mentah" (literal
// string '...', identifier "..." / `...`, komentar -- ... dan /* ... */)
// yang WAJIB dibiarkan persis apa adanya — keyword di dalamnya (mis.
// 'select' di dalam 'kota select') tidak boleh di-newline/di-uppercase.
// '' di dalam string kutip-tunggal adalah escape, bukan penutup.
function bagiSegmen(src) {
    const s = String(src || '');
    const segmen = [];
    let kode = '';
    const dorongKode = () => { if (kode) { segmen.push({ mentah: false, teks: kode }); kode = ''; } };
    let i = 0;
    while (i < s.length) {
      const c = s[i], d = s[i + 1] || '';
      if (c === "'" || c === '"' || c === '`') {
        dorongKode();
        const tutup = c;
        let j = i + 1;
        while (j < s.length) {
          if (s[j] === tutup) {
            // '' di dalam '...' = kutip escape, lanjut.
            if (tutup === "'" && s[j + 1] === "'") { j += 2; continue; }
            j++;
            break;
          }
          j++;
        }
        segmen.push({ mentah: true, teks: s.slice(i, j) });
        i = j;
      } else if (c === '-' && d === '-' && (s[i + 2] === ' ' || s[i + 2] === '\t' || s[i + 2] === '\n' || i + 2 >= s.length)) {
        dorongKode();
        let j = s.indexOf('\n', i);
        if (j < 0) j = s.length;
        segmen.push({ mentah: true, teks: s.slice(i, j) });
        i = j;
      } else if (c === '/' && d === '*') {
        dorongKode();
        let j = s.indexOf('*/', i + 2);
        j = j < 0 ? s.length : j + 2;
        segmen.push({ mentah: true, teks: s.slice(i, j) });
        i = j;
      } else {
        kode += c;
        i++;
      }
    }
    dorongKode();
    return segmen;
  }

function formatKode(s) {
    const kws = ['INSERT INTO', 'DELETE FROM', 'GROUP BY', 'ORDER BY', 'UNION ALL', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN', 'CROSS JOIN', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'ON', 'AND', 'OR', 'UNION', 'VALUES', 'UPDATE', 'SET', 'INTO'];
    let out = ' ' + String(s || '').replace(/\s+/g, ' ').trim();
    const sorted = kws.slice().sort((a, b) => b.length - a.length);
    sorted.forEach((kw) => {
      const re = new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi');
      out = out.replace(re, (m) => '\n' + m.toUpperCase());
    });
    out = out.replace(/\(\s*/g, '(\n  ').replace(/\s*\)/g, '\n)');
    const lines = out.split('\n').map((l) => l.trim()).filter((l) => l);
    return lines.map((l) => (/^(AND|OR|ON)\b/.test(l) ? '  ' + l : l)).join('\n');
  }

export function sqlFormat(src) {
    // Format per segmen kode, lalu gabung kembali. Dua hal dijaga di
    // sambungan: (1) spasi asli di antara segmen dipertahankan (kalau
    // tidak, 'a' 'b' jadi 'a''b' dan 'a' FROM jadi 'a'FROM — query
    // berubah arti/rusak); (2) komentar -- wajib diakhiri baris baru,
    // kalau tidak sisa query ikut jadi komentar.
    const seg = bagiSegmen(src);
    const potong = seg.map((g) => {
      if (g.mentah) return { teks: g.teks, komentarBaris: g.teks.startsWith('--') };
      return { teks: formatKode(g.teks), komentarBaris: false };
    });
    let keluar = '';
    for (let i = 0; i < potong.length; i++) {
      const p = potong[i];
      if (i > 0) {
        const sblm = potong[i - 1];
        const asli = seg[i - 1], kini = seg[i];
        const adaSpasi = (!asli.mentah && /\s$/.test(asli.teks)) || (!kini.mentah && /^\s/.test(kini.teks));
        if (sblm.komentarBaris) {
          if (keluar && !keluar.endsWith('\n')) keluar += '\n';
        } else if (adaSpasi && keluar && !/\s$/.test(keluar) && p.teks && !/^\s/.test(p.teks)) {
          keluar += ' ';
        }
      }
      keluar += p.teks;
    }
    return keluar.split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

export const meta = {"id": "sql-formatter", "name": "SQL Formatter", "cat": "developer", "icon": "🗄️", "desc": "Rapikan query SQL jadi mudah dibaca, dengan kata kunci dan baris yang tertata rapi.", "keywords": "sql,query,database,rapikan sql,format sql"};
export function render(root) {

    const ta = T.ta(8, 'Paste query SQL… misal: select id, nama from users where aktif = 1 order by nama');
    const box = T.out();
    root.appendChild(T.field('Input SQL', ta, 'Kata di dalam tanda kutip dan komentar dibiarkan apa adanya.'));
    root.appendChild(T.row(T.btn('Rapikan', () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu query-nya.')); return; }
      T.show(box, preHtml(sqlFormat(raw)));
    }, true)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : '')));
  
}
