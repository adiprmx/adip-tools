import { h as T, errBox, fileInput, utils } from '../../core.js';

// Diff baris-per-baris ala LCS (pola yang sama seperti pembanding-teks.js).
// Tiap item: {t:'='|'-'|'+', x:teks}.
// diffLines kanonis tinggal di utils (core.js).

// SHA-256 dari bytes, hasil hex. Pakai WebCrypto (ada di browser dan Node).
export async function sha256Hex(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatUkuran(n) {
  if (n < 1024) return n + ' byte';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

export const meta = {"id": "banding-file", "name": "Banding File", "cat": "developer", "icon": "📂", "desc": "Cek apakah dua file isinya identik atau berbeda.", "keywords": "banding,file,diff,identik,sama,beda,hash,sha256", "since": "6.18.0"};
export function render(root) {

    const fileA = fileInput('*/*');
    const fileB = fileInput('*/*');
    const box = T.out();
    let fa = null, fb = null;

    fileA.addEventListener('change', () => { fa = fileA.files[0] || null; });
    fileB.addEventListener('change', () => { fb = fileB.files[0] || null; });

    const bandingkan = async () => {
      if (!fa || !fb) { T.show(box, errBox('Pilih dulu kedua file yang mau dibandingkan.')); return; }
      T.show(box, '<span class="dim">Membaca dan menghitung sidik jari kedua file…</span>');
      try {
        const [bufA, bufB] = await Promise.all([fa.arrayBuffer(), fb.arrayBuffer()]);
        const [hashA, hashB] = await Promise.all([sha256Hex(bufA), sha256Hex(bufB)]);
        const sama = hashA === hashB;
        let html = '<div style="font-size:16px;margin-bottom:8px">' + (sama
          ? '<span class="ok">✓ Isi kedua file IDENTIK.</span>'
          : '<span class="err">✗ Isi kedua file BERBEDA.</span>') + '</div>' +
          '<div class="kv"><span class="k">File A</span><span class="v" style="word-break:break-all">' + T.esc(fa.name) + ' (' + formatUkuran(fa.size) + ')</span></div>' +
          '<div class="kv"><span class="k">File B</span><span class="v" style="word-break:break-all">' + T.esc(fb.name) + ' (' + formatUkuran(fb.size) + ')</span></div>' +
          '<div class="kv"><span class="k">Sidik jari A</span><span class="v" style="font-family:ui-monospace,monospace;font-size:11px;word-break:break-all">' + hashA + '</span></div>' +
          '<div class="kv"><span class="k">Sidik jari B</span><span class="v" style="font-family:ui-monospace,monospace;font-size:11px;word-break:break-all">' + hashB + '</span></div>';
        if (!sama) {
          // Bila keduanya teks dan tidak terlalu besar, tampilkan beda barisnya.
          const dec = new TextDecoder('utf-8', { fatal: true });
          let teksA = null, teksB = null;
          try {
            if (bufA.byteLength <= 200000 && bufB.byteLength <= 200000) {
              teksA = dec.decode(bufA);
              teksB = dec.decode(bufB);
            }
          } catch (e) { /* bukan teks UTF-8, lewati diff */ }
          if (teksA != null && teksB != null) {
            const linesA = teksA.split('\n').length, linesB = teksB.split('\n').length;
            if (linesA <= 2000 && linesB <= 2000) {
              const diff = utils.diffLines(teksA, teksB);
              const del = diff.filter((d) => d.t === '-').length;
              const add = diff.filter((d) => d.t === '+').length;
              html += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:10px 0;font-size:12.5px"><span style="color:#ef4444">Baris hanya di A: <b>' + del + '</b></span><span style="color:#22c55e">Baris hanya di B: <b>' + add + '</b></span></div>';
              const tampil = diff.slice(0, 300);
              html += '<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden;font-family:monospace;font-size:12.5px">' +
                tampil.map((d) => {
                  const bg = d.t === '-' ? 'rgba(239,68,68,.12)' : d.t === '+' ? 'rgba(34,197,94,.12)' : 'transparent';
                  const col = d.t === '-' ? '#ef4444' : d.t === '+' ? '#22c55e' : '#8a8a93';
                  return '<div style="background:' + bg + ';padding:4px 10px;white-space:pre-wrap;word-break:break-word;border-bottom:1px solid #ffffff10"><span style="color:' + col + ';display:inline-block;width:14px">' + (d.t === '=' ? ' ' : d.t) + '</span>' + T.esc(d.x || ' ') + '</div>';
                }).join('') + '</div>';
              if (diff.length > 300) html += '<div class="hint">Perbedaan ditampilkan 300 baris pertama dari ' + diff.length + ' baris.</div>';
            } else {
              html += '<div class="hint">Kedua file teks, tapi terlalu panjang untuk ditampilkan baris per baris (lebih dari 2000 baris).</div>';
            }
          } else if (bufA.byteLength > 200000 || bufB.byteLength > 200000) {
            html += '<div class="hint">File terlalu besar untuk menampilkan beda barisnya, tapi sidik jari di atas sudah memastikan isinya berbeda.</div>';
          } else {
            html += '<div class="hint">File ini bukan teks biasa, jadi beda barisnya tidak ditampilkan. Sidik jari di atas sudah memastikan isinya berbeda.</div>';
          }
        }
        T.show(box, html);
      } catch (e) {
        T.show(box, errBox('File tidak bisa dibaca. Coba pilih ulang kedua file.'));
      }
    };

    root.appendChild(T.field('File A', fileA));
    root.appendChild(T.field('File B', fileB));
    root.appendChild(T.row(T.btn('Bandingkan', bandingkan, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Identik di sini artinya isi byte-nya sama persis, dicek lewat sidik jari SHA-256. Nama file boleh beda, yang penting isinya.</div>'));

}
